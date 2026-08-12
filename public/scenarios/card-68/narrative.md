---
cardNumber: 68
slug: bedrock-knowledge-bases-rag-chatbot
title: "Bedrock Knowledge Bases (RAG) — interner Chatbot auf Firmendokumenten"
services: ["Amazon Bedrock Knowledge Bases", "Amazon Bedrock", "Amazon OpenSearch Serverless", "Amazon S3", "Amazon Bedrock Agents Classic"]
domains: ["D3"]
correctAnswer: "B"
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/data-source-connectors.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-setup.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-prereq.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html"
  - "https://docs.aws.amazon.com/kendra/latest/dg/kendra-availability-change.html"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, wie der Innendienst eine Antwort auf „Welches Drehmoment gilt für die Antriebswelle der Baureihe 400?" bekommt.

**Weg eins:** Du schickst einen Mitarbeiter auf einen sechswöchigen Lehrgang, in dem er 12.000 Wartungsanleitungen auswendig lernt. Danach kann er jede Frage beantworten — aus dem Kopf, flüssig, ohne nachzuschlagen. Am Montag darauf ändert die Konstruktion das Drehmoment für die Baureihe 400. Der Mitarbeiter weiß davon nichts. Er antwortet weiterhin überzeugt mit dem alten Wert, und er kann dir nicht sagen, woher er ihn hat. Um ihn zu korrigieren, schickst du ihn wieder auf den Lehrgang. Sechs Wochen, für eine Zahl.

**Weg zwei:** Du schickst ihn auf gar keinen Lehrgang. Du gibst ihm einen Aktenschrank und eine Bibliothekarin. Er stellt seine Frage, die Bibliothekarin holt die drei passenden Seiten heraus und legt sie ihm aufgeschlagen hin. Er liest sie und formuliert die Antwort — und weil die Seiten vor ihm liegen, kann er dazusagen, aus welchem Dokument sie stammt. Ändert die Konstruktion etwas, tauscht jemand ein Blatt im Schrank aus. Der Mitarbeiter muss nichts neu lernen.

Weg eins ist Fine-Tuning. Weg zwei ist Retrieval Augmented Generation, kurz RAG.

Das ist die ganze Idee, und sie erklärt beide Bedingungen aus der Aufgabe auf einmal: „mit Quellenangabe" geht nur, weil die Seiten tatsächlich vorliegen. „Die Dokumente ändern sich laufend" ist unproblematisch, weil sich das Modell nie etwas gemerkt hat.

## Was es eigentlich ist — die Knowledge Base

Die Knowledge Base ist kein Modell und kein Server. Sie ist eine **Konfiguration**, die vier Dinge zusammenbindet: woher die Daten kommen, wie sie zerlegt werden, welches Embedding-Modell sie in Vektoren übersetzt und in welchem Vector Store diese Vektoren landen.

```json
{
  "name": "wartung-baureihe-400",
  "roleArn": "arn:aws:iam::1234:role/BedrockKBRole",
  "knowledgeBaseConfiguration": {
    "type": "VECTOR",
    "vectorKnowledgeBaseConfiguration": {
      "embeddingModelArn":
        "arn:aws:bedrock:eu-central-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  },
  "storageConfiguration": {
    "type": "OPENSEARCH_SERVERLESS",
    "opensearchServerlessConfiguration": {
      "collectionArn": "arn:aws:aoss:eu-central-1:1234:collection/abc",
      "vectorIndexName": "wartung-index",
      "fieldMapping": {
        "vectorField": "embeddings",
        "textField": "AMAZON_BEDROCK_TEXT_CHUNK",
        "metadataField": "AMAZON_BEDROCK_METADATA"
      }
    }
  }
}
```

Lies das `fieldMapping` genau, denn dort steckt die Quellenangabe. Drei Felder je Chunk: der Vektor zum Vergleichen, der **Rohtext** zum Anzeigen und die **Metadaten**, die auf das Originaldokument zurückzeigen. AWS beschreibt den Ingestion-Vorgang ausdrücklich so, dass die Chunks in Embeddings umgewandelt und in einen Vektorindex geschrieben werden, **unter Beibehaltung eines Mappings auf das Originaldokument**.

Kein Modelltraining. Kein Fine-Tuning-Job. Eine IAM-Rolle, ein Embedding-Modell und drei Feldnamen.

## Der Weg durch die Karte

### Kasten — Dokumente: S3 und Confluence

12.000 Wartungsanleitungen, Prüfprotokolle und Serviceberichte in S3, dazu das Confluence mit den Prozessbeschreibungen. Beides sind für Bedrock **Data Sources**, nicht Dateien: Du konfigurierst nicht 12.000 Objekte, sondern einen Bucket-Präfix und einen Confluence-Space.

Die Liste der unterstützten Konnektoren für eine Knowledge Base mit eigenem Vector Store ist kurz und du solltest sie kennen: Amazon S3, Confluence, Microsoft SharePoint, Salesforce, Web Crawler und eine Custom Data Source. Sechs. Wer ServiceNow, Jira oder ein SAP-Archiv anbinden will, kommt hier nicht weiter — das ist genau die Lücke, die Karte 69 behandelt.

### Pfeil 1 — abholen: der Data Source Sync

Ein **Ingestion Job** zieht die Dokumente. Er läuft nicht dauernd, sondern wird gestartet — manuell, über die API oder aus einer eigenen Automatisierung heraus.

Und hier steht der Satz, um den sich die ganze Karte dreht: **Das ist der Teil, den die Selbstbau-Variante dauerhaft selbst betreiben müsste.** Nicht das Chunking, nicht das Embedding — die Wiederholung. Ein einmaliger Import ist an einem Nachmittag gebaut. Ein Sync, der nach neun Monaten immer noch weiß, welches der 12.000 Dokumente sich seit dem letzten Lauf geändert hat und welche Vektoren dafür zu löschen sind, ist ein Betriebsthema.

### Pfeil 2 — zerlegen: Chunking und Embedding

Bedrock schneidet die Dokumente in Chunks und schickt jeden Chunk durch das Embedding-Modell. Die Strategien laut Dokumentation:

- **Default chunking** — rund 300 Tokens, Satzgrenzen werden respektiert, komplette Sätze bleiben in einem Chunk.
- **Fixed-size chunking** — du setzt die maximale Tokenzahl je Chunk und einen Overlap-Prozentsatz.
- **Hierarchical chunking** — Eltern- und Kind-Chunks in zwei Ebenen.
- **Semantic chunking** — Schnitte anhand inhaltlicher Ähnlichkeit.
- **No chunking** — jede Datei ist ein Chunk.

Das Bild dazu: Du kopierst ein Handbuch nicht als Ganzes in den Karteikasten, sondern zerschneidest es in Abschnitte, die einzeln eine Frage beantworten können. Zu klein, und der Zusammenhang fehlt. Zu groß, und der Karteikasten liefert dir zehn Seiten für eine Zahl.

### Pfeil 3 — indexieren: der Vector Store

Die Embeddings landen in einem Vektorindex. Für eine Knowledge Base mit eigenem Store hast du acht dokumentierte Möglichkeiten: OpenSearch Serverless, OpenSearch Managed Clusters, Amazon S3 Vectors, Amazon Aurora, Neptune Analytics für GraphRAG, Pinecone, Redis Enterprise Cloud und MongoDB Atlas.

Der prüfungsrelevante Punkt ist ein anderer: **Bedrock kann die OpenSearch-Serverless-Collection über die Konsole automatisch anlegen.** In einem Szenario mit „kein Team für den Betrieb" ist das die halbe Antwort.

### Pfeil 4 — Suche: was die Knowledge Base steuert

Der Pfeil vom Vector Store zur Knowledge Base zeigt keinen Datenfluss, sondern eine Zuständigkeit. Die Knowledge Base hält die IAM Service Role, die Datenquellen-Konfiguration und die Chunking-Strategie. Sie rechnet nichts.

Eine Feinheit, die in der Praxis wehtut: **Die Chunking-Strategie kannst du nach dem Anlegen der Data Source nicht mehr ändern.** Wer sich vertut, legt die Data Source neu an und ingestiert alles noch einmal.

### Kasten — der Chatbot und das Wort „erwartet"

Auf der Karte steht unter dem Chatbot in Kursiv „erwartet Quellenangabe". Das ist keine Verzierung, sondern die Anforderung, an der drei der vier Distraktoren scheitern.

Der Innendienst fragt nach dem Drehmoment für die Antriebswelle der Baureihe 400. Eine Antwort wie „180 Nm" ist wertlos, wenn der Monteur nicht nachschlagen kann, ob das aus der Anleitung von 2019 oder aus der Revision von letzter Woche stammt. Bei einer Drehmomentangabe ist das kein Komfortthema — eine falsch angezogene Verschraubung ist ein Sicherheitsproblem.

Der Chatbot ist übrigens **kein AWS-Dienst** auf dieser Karte. Er ist die Anwendung des Kunden, ein Origin von Anfragen, und deshalb blau wie die Dokumente. Was zwischen ihm und Bedrock liegt — eine API, eine Lambda, ein Container — ist für das Szenario gleichgültig.

### Pfeil 5 — fragt: `RetrieveAndGenerate`

Der Innendienst tippt seine Frage. Die Anwendung ruft **einen** API-Aufruf, und der macht vier Dinge hintereinander: Frage einbetten, ähnliche Chunks aus dem Index holen, sie in den Prompt schreiben, das Foundation Model aufrufen. Zurück kommt Text plus eine `citations`-Struktur, in der jede Aussage auf die Chunks zeigt, aus denen sie stammt.

Auf der Karte gibt es keine eigene Box für das Foundation Model. Das ist Absicht: Du wählst zwar aus, welches Modell antwortet, aber du verwaltest nichts an ihm.

### Pfeil 6 — steuert: `Retrieve` als die andere Tür

`Retrieve` geht denselben Weg bis zum vorletzten Schritt und hört dann auf. Es gibt dir die Chunks samt Score und Herkunft zurück — und lässt dich mit ihnen allein. Prompt selbst formulieren, Modell selbst aufrufen, Antwort selbst zusammensetzen.

Auf der Karte hängt `Retrieve` bewusst an keiner Linie zum Fluss. Es ist keine Station nach `RetrieveAndGenerate`, sondern eine Abzweigung davor.

### Badge 7 — verworfen: Selbstbau auf Lambda und OpenSearch

Technisch möglich, und der Entwickler hat recht, dass es keine Zauberei ist. Lambda zerschneidet, Bedrock bettet ein, OpenSearch indexiert.

Der Unterschied ist nicht die erste Version, sondern der zweite Winter: Retry bei fehlgeschlagenen Embedding-Aufrufen, Löschen verwaister Vektoren, Umgang mit einem PDF, das der Parser nicht öffnet, und die Frage, wer nachts das Sync-Log liest. Das ist undifferenziertes Heavy Lifting — Arbeit, die keinen Wettbewerbsvorteil erzeugt.

### Randleiste — Bedrock Agents Classic: eine Entwarnung

Die gestrichelte Leiste am unteren Kartenrand sieht aus wie eine Warnung und ist eine.

Amazon Bedrock Agents, gestartet im November 2023, heißt seit dem 30.06.2026 **Bedrock Agents Classic** und ist seit dem 30.07.2026 für Neukunden geschlossen. AWS empfiehlt die Migration auf Bedrock AgentCore.

Für dieses Szenario ist das eine Entwarnung, und AWS formuliert das selbst deutlich: Bedrock bleibt voll unterstützt, betroffen ist nur die Agents-Classic-Orchestrierungsschicht; bestehende Modelle, **Knowledge Bases und Guardrails sind nicht betroffen**. Der Modellkatalog von Agents Classic friert zum Stichtag ein, während Bedrock selbst — Model Inference, Knowledge Bases, Guardrails — weiter neue Modelle bekommt.

Und dieses Szenario braucht ohnehin keinen Agent. Fragen aus Dokumenten beantworten ist reines Retrieval. Einen Agent brauchst du, wenn das System **handeln** soll: APIs aufrufen, Aufgaben zerlegen, mehrschrittig orchestrieren.

## Die entscheidende Unterscheidung

| | `Retrieve` | `RetrieveAndGenerate` |
|---|---|---|
| Was kommt zurück | Chunks mit Score und Herkunft | fertiger Antworttext plus `citations` |
| Wer schreibt den Prompt | du | Bedrock |
| Wer ruft das Modell | du | Bedrock |
| Modellzugriff nötig | nein | ja, Model Access für das Antwortmodell |
| Wann sinnvoll | eigenes Prompting, Nachbearbeitung, eigene Modellwahl | Chatbot, der eine Antwort ausgibt |

Die Zeile „Modellzugriff nötig" wird gern übersehen und ist der praktische Unterschied am ersten Tag: `RetrieveAndGenerate` scheitert in einem frischen Konto, in dem der Model Access für das Antwortmodell in der Zielregion nicht angefordert wurde. `Retrieve` läuft dort problemlos, weil es kein Textmodell aufruft — nur das Embedding-Modell, und das steht ohnehin schon in der Knowledge Base.

Für dieses Szenario ist die Wahl trotzdem eindeutig: Der Innendienst will eine Antwort, keine Chunks. Wer `Retrieve` nimmt, baut sich die Prompt-Augmentierung und die Zitatstruktur von Hand nach, die `RetrieveAndGenerate` mitliefert.

## Die ehrliche Feinheit

**Erstens: Es gibt seit Juni 2026 zwei Knowledge Bases, und die Karte zeigt nur eine.** Die AWS-Dokumentation unterscheidet inzwischen **Managed Knowledge Base** — Bedrock betreibt Ingestion, Index, Storage und Retrieval komplett — und **Customer-managed Knowledge Base**, bei der du den Vector Store selbst wählst und verwaltest. Diese Karte zeigt die zweite Variante, denn nur dort suchst du dir OpenSearch Serverless oder Aurora aus. Auf der Übersichtsseite steht seit demselben Stand die Empfehlung, für optimierte Retrieval-Genauigkeit die Managed-Variante zu nehmen.

**Zweitens, und das ist ein echter Quellenkonflikt:** Dieselbe Übersichtsseite schreibt, dass Third-Party-Konnektoren nur für Managed Knowledge Bases verfügbar seien. Die Konnektorenseite des Customer-managed-Pfads listet aber weiterhin Confluence, SharePoint und Salesforce als konfigurierbare Data Sources auf, mit eigener Anleitung je Dienst. Zwei Seiten desselben User Guide, zwei verschiedene Aussagen. **Deshalb steht auf der Karte keine Behauptung darüber, welche Konnektoren zu welchem Typ gehören** — nur die Datenquellen des Szenarios. Wer in der Prüfung eine Frage bekommt, die auf dieser Unterscheidung beruht, sollte auf das Wort „managed" achten, nicht auf die Konnektorenliste.

**Drittens:** Die Angabe „bis zu fünf Data Sources je Knowledge Base" stammt aus einer AWS-Ankündigung von 2024 und aus den Service Quotas, nicht aus dem Kapitel über Knowledge Bases selbst. Sie ist ein anpassbares Soft Limit. Merk dir die Aussage „mehrere Quellen in einem Index", nicht die Zahl.

## Syntax lesen — die `chunkingConfiguration`

```
"chunkingConfiguration": {
  "chunkingStrategy": "HIERARCHICAL",
  "hierarchicalChunkingConfiguration": {
    "levelConfigurations": [
      { "maxTokens": 1500 },   ← Ebene 1: Parent
      { "maxTokens": 300 }     ← Ebene 2: Child
    ],
    "overlapTokens": 60        ← absolute Tokenzahl, kein Prozentsatz
  }
}
```

Zwei Ebenen, nicht mehr. Gesucht wird auf den **kleinen** Chunks, weil kurze Embeddings präziser treffen. Ausgeliefert wird der **große** Chunk, weil das Modell Kontext braucht.

Genau daraus folgt die Falle, auf die AWS ausdrücklich hinweist: Weil mehrere Kind-Chunks denselben Eltern-Chunk haben können, **kann die Trefferzahl kleiner ausfallen als angefordert.** Du fragst nach zehn Ergebnissen und bekommst sechs. Das ist kein Fehler, das ist die Mechanik.

Beachte auch den Unterschied in der Einheit: Fixed-size arbeitet mit einem Overlap-**Prozentsatz**, hierarchisch mit einer absoluten **Tokenzahl**.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung nicht existiert:

- kein Trainingsjob und kein Fine-Tuning
- keine Trainingsdaten, kein Labeling, keine Evaluierung von Modellgewichten
- keine eigene Chunking-Logik in Lambda
- kein selbst geschriebener Embedding-Aufruf mit Retry und Backoff
- keine Indexpflege, kein Löschen verwaister Vektoren
- kein selbst gebautes Prompt-Template für die Augmentierung
- kein Agent, keine Action Groups, keine Orchestrierung

Übrig bleiben: eine Konfiguration, eine IAM-Rolle und ein API-Aufruf.

## Wenn du dir eine Sache merkst

**RAG heißt: kein Modelltraining. `Retrieve` gibt dir die Chunks, `RetrieveAndGenerate` gibt dir die Antwort.**

Fine-Tuning verändert Gewichte und muss bei jeder Dokumentänderung wiederholt werden. Ein Agent orchestriert Aktionen — hier ist keine Aktion zu orchestrieren. Der Selbstbau endet im selben Vector Store, nur mit dir als Betreiber der Synchronisation.

## Prüfungsknackpunkte

**Signalwörter:** „answer questions from company documents" plus „without training a model" plus „cite the source" plus „documents change frequently". Diese vier zusammen sind immer Knowledge Bases.

**Die Fine-Tuning-Falle.** Sie ist die häufigste falsche Antwort auf Dokumentenfragen und fällt an zwei Stellen: bei „ändern sich laufend" und bei „mit Quellenangabe". Fine-Tuning kann beides nicht.

**Die Agent-Falle.** Ein Agent klingt nach der mächtigeren Antwort und ist hier die falsche. Agents Classic ist zudem seit dem 30.07.2026 für Neukunden zu — in einem Neubau-Szenario also doppelt falsch. In einem Bestandskunden-Szenario bleibt er zulässig.

**Die API-Falle.** Achte darauf, ob die Anwendung eine fertige Antwort oder Rohmaterial braucht. „Build our own prompt" heißt `Retrieve`. „Return an answer with citations" heißt `RetrieveAndGenerate`.

**Vector Store selbst bauen.** Falsch, sobald „kein Team für den Betrieb" im Szenario steht — Bedrock legt die OpenSearch-Serverless-Collection selbst an.

**Kendra als Alternative.** Verlockend, aber seit dem 30.07.2026 für Neukunden geschlossen. Siehe Karte 69.

**Die Quellenangabe für selbstverständlich halten.** Sie funktioniert nur, weil das Mapping vom Chunk zum Originaldokument beim Ingestion erhalten bleibt. In einer selbst gebauten Pipeline musst du dieses Mapping selbst anlegen und selbst konsistent halten — wenn du es vergisst, merkst du es erst, wenn jemand nach der Quelle fragt.

**Zu den einzelnen Distraktoren:**

**A — Ein Modell auf den Firmendokumenten fine-tunen:** ändert Gewichte, nicht Inhalte; scheitert an „ändern sich laufend" und liefert nie eine Quelle.

**C — Ein Bedrock Agent mit Action Groups:** orchestriert Aktionen. Hier ist keine Aktion auszuführen, nur eine Frage zu beantworten — und Agents Classic nimmt keine Neukunden mehr an.

**D — Eigene Pipeline aus Lambda, Bedrock-Embeddings und OpenSearch:** kommt zum selben Ergebnis und bringt die Dauerlast der Synchronisation mit, die das Szenario ausdrücklich vermeiden will.

**E — Amazon Kendra:** war die richtige Antwort für Enterprise-Suche, ist es für ein Neubau-Szenario ab dem 30.07.2026 nicht mehr.
