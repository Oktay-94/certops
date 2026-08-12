---
cardNumber: 69
slug: kendra-maintenance-bmkb-migration
title: "Kendra → Bedrock Managed Knowledge Base — Enterprise-Suche im Wartungsmodus"
services: ["Amazon Kendra", "Amazon Bedrock Managed Knowledge Base", "Amazon S3", "AWS Lambda", "AWS Step Functions", "Amazon EventBridge Scheduler", "Amazon OpenSearch Service"]
domains: ["D3"]
correctAnswer: "C"
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/kendra/latest/dg/kendra-availability-change.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/06/aws-service-availability/"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html"
  - "https://docs.aws.amazon.com/bedrock/latest/userguide/kb-chunking.html"
---

## Die Grundidee zuerst

Stell dir eine Firmenbibliothek und zwei Menschen, die darin arbeiten.

**Die eine ist Archivarin.** Du kommst mit einer Frage, sie tippt drei Wörter und legt dir vierzig Treffer hin — sortiert, mit Filtern an der Seite: 12 aus der Konstruktion, 9 aus dem Einkauf, 19 aus dem Qualitätswesen. Tippst du dich vertippt, korrigiert sie. Sagst du „Drehmoment", weiß sie, dass im Haus auch „Anzugsmoment" geschrieben wird, und sucht beides. Sie merkt sich, welche Treffer angeklickt werden, und rankt beim nächsten Mal anders. Sie gibt dir nie eine Antwort. Sie gibt dir immer die Stelle, an der die Antwort steht.

**Der andere ist Referent.** Du stellst dieselbe Frage, und er antwortet in zwei Sätzen — mit Fußnote, aus welchem Dokument er das hat. Bei einer verzwickten Frage geht er dreimal ins Regal und setzt die Teile zusammen. Aber er hat keine Filterleiste. Er kann dir nicht sagen, wie viele Treffer aus dem Einkauf kämen. Er korrigiert deine Tippfehler nicht, und er kennt eure Hausbegriffe nicht.

Amazon Kendra ist die Archivarin. Bedrock Managed Knowledge Base ist der Referent.

**Und jetzt der Punkt, an dem die meisten Migrationsszenarien scheitern: Die Archivarin geht in Rente, und der Referent ist nicht ihr Nachfolger. Er ist ein anderer Beruf.** Das ist keine Aufwärts-Migration. Es ist ein Tausch — du gewinnst Antwortfähigkeit und verlierst Sucherfahrung.

## Was es eigentlich ist — die Managed Knowledge Base

Der Typ steht im Aufruf, und er ist das Einzige, was du wirklich entscheiden musst:

```python
response = bedrock_agent.create_knowledge_base(
    name="konzern-suche",
    description="Migriert von einem Kendra-Index",
    roleArn="arn:aws:iam::1234:role/BedrockKBRole",
    knowledgeBaseConfiguration={
        "type": "MANAGED",
        "managedKnowledgeBaseConfiguration": {
            "embeddingModelArn":
                "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0",
            "embeddingModelConfiguration": {
                "bedrockEmbeddingModelConfiguration": {
                    "embeddingDataType": "FLOAT32"
                }
            }
        }
    }
)
```

Lies, was hier **fehlt**. Keine `storageConfiguration`. Kein Collection-ARN, kein Index-Name, kein `fieldMapping`. Kein Aurora-Cluster, kein Secrets-Manager-ARN.

Genau das ist der Unterschied zum Knowledge-Base-Typ auf Karte 68: Dort wählst du den Vector Store und trägst seine Adresse ein. Hier steht `"type": "MANAGED"`, und Bedrock betreibt Index, Storage und Reranking selbst.

Was du behältst, ist die Wahl des Embedding-Modells. Die Dokumentation nennt Titan Text Embeddings V2, Cohere Embed English v3, Cohere Embed Multilingual v3, Cohere Embed v4 und Nova Multimodal Embeddings — **alle auf 1024 Dimensionen mit float32 festgelegt.** Bei einer selbst verwalteten Knowledge Base hättest du bei Titan V2 auch 512 oder 256 wählen können. Hier nicht.

## Der Weg durch die Karte

### Kasten — sieben Konnektoren, und die Zahl daneben

BMKB bindet sieben Quellen direkt an: Amazon S3, Confluence, Microsoft SharePoint, Web Crawler, Google Drive, Microsoft OneDrive und einen Custom Connector.

Die Kursivzeile auf der Karte sagt „Kendra hatte 32+", und diese Zahl ist der ganze Konflikt in einer Zeile. Die Architektin öffnet die Vergleichstabelle, sieht 32+ gegen 7 und weiß, dass mindestens 25 Anbindungen in ihrem Haus keinen Nachfolger haben.

**Das Bild dazu:** Du ziehst um und der neue Vermieter sagt, sieben deiner zweiunddreißig Steckdosen werden übernommen. Der Kühlschrank läuft weiter. Für den Rest brauchst du Verlängerungskabel — und die legst du selbst.

### Pfeil 1 — direkt: was ohne Umbau weiterläuft

Confluence, SharePoint und S3 aus dem Szenario sind alle drei dabei. Für diese drei ist die Migration tatsächlich das, wonach sie klingt: Konnektor konfigurieren, Ingestion Job starten, fertig.

Eine Betriebsfeinheit steht in der Dokumentation als Note und kostet sonst eine Stunde Fehlersuche: `CreateDataSource` ist bei Managed Knowledge Bases **asynchron**. Die Data Source geht von `CREATING` nach `AVAILABLE`, typischerweise in zwei bis fünf Minuten. Wer sofort danach den Ingestion Job startet, bekommt einen Fehler, der nach einem Konfigurationsproblem aussieht und keines ist.

### Pfeil 2 — parsen: Smart Parsing und die Entscheidung, die Kendra dir abgenommen hat

**Smart Parsing** wählt die Parsing-Strategie je Dokumenttyp automatisch — PDF, PPTX, DOCX, Dokumente mit eingebetteten Grafiken, Audio, Video, gescannte Seiten.

Das Chunking dagegen musst du **explizit wählen**. Kendra hat das intern erledigt und dir nie eine Frage gestellt. Verfügbar sind Default, Fixed-size, Hierarchical und No Chunking; **semantisches Chunking gibt es für Managed Knowledge Bases nicht.**

Für Migrationen nennt AWS einen konkreten Startpunkt: **Fixed-size mit 200 Tokens und 30 % Overlap.** Merk dir, dass das ein Startpunkt ist und keine Empfehlung für den Endzustand — es ist die Einstellung, mit der du die Parallelmessung beginnst.

### Pfeil 3 — indexieren: der Managed Vector Store und das Wort „immer"

Bedrock betreibt den Store vollständig. Kein OpenSearch, kein Aurora, keine Provisionierung, keine Kapazitätsplanung.

Der prüfungsrelevante Satz ist ein anderer, und er steht wörtlich in der Dokumentation: **Der Dienst führt stets eine hybride Suche aus — Keyword plus semantisch — und bietet keinen reinen Semantic-Modus.** Kendra hatte die Wahl zwischen Keyword, semantisch und hybrid.

Meistens ist „immer hybrid" ein Vorteil und niemandem eine Erklärung wert. Es wird zum Problem, wenn dein Korpus voller Bauteilnummern steckt: `AW-400-17B` ist als Keyword ein präziser Treffer und als Vektor Rauschen. Bei hybrider Suche mischt sich das Rauschen dazu. Du kannst es nicht abschalten.

Der positive Nebeneffekt steht auf derselben Seite: Weil immer auch Keyword gesucht wird, wirkt ein selbst gebauter Synonym-Ersatz — Query vor dem Aufruf um Hausbegriffe erweitern — auf beiden Dimensionen gleichzeitig.

### Kasten — `RetrieveAndGenerate` und das, was Kendra nie konnte

Hier steht die Gegenrechnung zur Feature-Lücke. Kendra brauchte für jede generierte Antwort ein extern angebundenes LLM: Du riefst `Retrieve` auf, bautest den Prompt selbst, riefst das Modell selbst auf, setztest die Zitate selbst zusammen. BMKB macht das in einem Aufruf und liefert die `citations` mit.

Darüber hinaus gibt es **Agentic Retrieval**, und das ist die Fähigkeit, die Kendra architektonisch fehlte. Die Dokumentation beschreibt sie als mehrstufiges Vorgehen: komplexe Fragen werden in Teilfragen zerlegt, es wird **iterativ über mehrere Knowledge Bases** gesucht, und das System bewertet, ob das Gefundene zur Beantwortung reicht — statt einmal zu suchen und das Ergebnis zu nehmen.

Für die Architektin aus dem Szenario heißt das: Die Suchmaske verliert. Der Chatbot, den bisher niemand bauen konnte, weil das Anbinden eines LLM an Kendra ein eigenes Projekt war, gewinnt.

### Kasten — ServiceNow und Salesforce: gestrichelt, aber nicht verworfen

Zwei echte Datenquellen mit einem Konnektor, den es in BMKB nicht gibt. Sie sind gestrichelt, weil sie nicht direkt anbindbar sind — nicht, weil sie abgelehnt wären. Das rote X gehört auf dieser Karte nur dem Selbstbau.

### Pfeil 4 — abziehen: die selbst gebaute Ingestion

Der von AWS benannte Weg für nicht unterstützte Quellen ist wörtlich dieser: eine automatisierte Pipeline aus **Lambda, Step Functions oder EventBridge Scheduler**, die periodisch über die API des Quellsystems Inhalte abzieht, sie mit Metadaten-Sidecars nach S3 schreibt und einen Ingestion Job auslöst.

Lies das nüchtern: **Das ist der Nachbau eines Kendra-Konnektors.** Das periodische Ziehen, das Erkennen von Änderungen, das Wegräumen gelöschter Dokumente, das Fehlerhandling bei einem API-Timeout auf der Salesforce-Seite — alles, was der Konnektor drei Jahre lang unsichtbar gemacht hat, wird zu Code in deinem Repository.

### Pfeil 5 — Umweg über S3: Metadaten als Sidecar

In Kendra waren Dokumentattribute auf Index-Ebene definiert und wurden beim Ingest an die Dokumente gehängt. In BMKB liegen sie als `.metadata.json`-Datei **neben** dem Quelldokument in S3.

```
s3://konzern-suche/servicenow/INC0042719.pdf
s3://konzern-suche/servicenow/INC0042719.pdf.metadata.json
```

Die Grenzen dazu: maximal **10 KB je Datei**, und jedes Attribut ist `STRING`, `NUMBER` oder `BOOLEAN`. Verschachtelte Strukturen gibt es nicht.

### Badge 6 — verworfen: alles selbst auf OpenSearch bauen

Der Gedanke liegt nahe: Wenn man ohnehin eine Export-Pipeline schreibt, kann man auch gleich den Rest selbst bauen.

Die Rechnung geht nicht auf. Die Pipeline aus Pfeil 4 betrifft **zwei** Quellen. Der Selbstbau würde Chunking, Embedding-Aufrufe, Indexpflege, Reranking und Synchronisation für **alle** Quellen bedeuten — und du hättest weiterhin kein `RetrieveAndGenerate`. Ein Nachteil wird nicht dadurch kleiner, dass man ihn auf den ganzen Bestand ausdehnt.

### Gold-Kasten — was BMKB nicht kann

Sechs Kendra-Funktionen fehlen. AWS listet sie mitsamt Workarounds:

| Fehlt | Workaround laut AWS |
|---|---|
| Query Suggestions | eigener OpenSearch-Index mit Suggester, oder LLM-basierte Vervollständigung |
| Faceted Search | Metadatenfilter über Sidecars; Filteroptionen fest in der UI, **keine dynamischen Trefferzähler** |
| Custom Synonyms | Thesaurus in DynamoDB oder S3, Query vor dem Aufruf erweitern |
| Spell Checking | Lambda-Vorstufe mit SymSpell oder LLM-Korrektur |
| Incremental Learning | Reranking plus eigener Feedback-Loop in DynamoDB |
| Custom Document Enrichment | Vorverarbeitung über Step Functions oder Lambda vor dem S3-Upload |

Der wichtigste Eintrag ist Faceted Search, und zwar wegen der Klammer. Du kannst Filter simulieren, aber du kannst die **Zahl neben dem Filter** nicht ausrechnen — dafür müsste das System alle Treffer zählen, bevor es rankt. Ein Szenario mit „Filter nach Abteilung **mit Trefferzahlen**" ist mit BMKB allein nicht lösbar.

### Statusleiste — Kendra im Wartungsmodus

Seit dem **30.06.2026** ist Amazon Kendra im Maintenance Mode: keine neue Feature-Entwicklung. Seit dem **30.07.2026** nimmt der Dienst keine Neukunden mehr auf.

Und dann der Satz, der die Panik herausnimmt: Während des Wartungsmodus bleibt der Dienst **voll unterstützt**, AWS liefert weiter Bugfixes und Security-Updates für Bestandskunden; nur neue Feature-Wünsche werden nicht mehr berücksichtigt. **Es gibt kein Enddatum.** Der Konzern aus dem Szenario muss nicht bis Silvester migriert sein.

## Die entscheidende Unterscheidung

| | Amazon Kendra | Bedrock Managed Knowledge Base |
|---|---|---|
| Native Konnektoren | 32+ | 7 |
| Embedding | intern verwaltet | du wählst (Titan V2, Cohere, Nova) |
| Vector Store | intern verwaltet | vollständig von Bedrock betrieben |
| Suchmodus | Keyword, semantisch **oder** hybrid | immer hybrid |
| RAG | braucht ein extern angebundenes LLM | `RetrieveAndGenerate` nativ |
| Agentic Retrieval | nicht verfügbar | mehrstufig, nativ |
| Maximale Treffer | 100 Passagen (`Retrieve`) | 100 Ergebnisse (`Retrieve`) |

## Die ehrliche Feinheit

**Die 32 ist keine 32.** Auf derselben AWS-Seite steht in der Architekturvergleichstabelle „32+ connectors" und wenige Absätze später im Abschnitt zur Data-Source-Migration „Kendra supports 32 native connectors". Einmal mit Plus, einmal ohne. Nach Projektregel steht deshalb auf der Karte „32+" — die schwächere, sichere Aussage. Für die Prüfung zählt ohnehin die Größenordnung, nicht die Zahl: viele gegen sieben.

**Der naheliegende Ausweg ist selbst eine Sackgasse.** Wer den Wartungsmodus liest, denkt an Amazon Q Business. Q Business steht in derselben Ankündigung vom 30.06.2026 auf derselben Liste — ebenfalls Wartungsmodus, ebenfalls für Neukunden zu ab dem 30.07.2026. Auf derselben Liste stehen auch Bedrock Agents Classic (Karte 68), Cognito Sync und Directory Service Simple AD. Das war kein einzelner Dienst, das war eine Aufräumaktion.

**AWS sagt „machbar", nicht „einfach".** Die Formulierung lautet, die Migration sei für die meisten Enterprise-Search- und RAG-Workloads **mit sorgfältiger Planung** erreichbar. Die Zusammenfassung benennt zwei Aufwände ausdrücklich: Daten neu ingestieren **und** Anwendungscode umschreiben. Wer das Szenario als reinen Konfigurationswechsel liest, unterschätzt die zweite Hälfte.

**`batch_put_document` gibt es nicht mehr.** In der API-Mapping-Tabelle steht in dieser Zeile nicht der Name einer neuen Operation, sondern eine Anweisung: S3-Upload plus Ingestion Job. Wer in Kendra Dokumente aus der Anwendung heraus in den Index geschoben hat, baut diesen Pfad um — nicht um, sondern neu.

## Syntax lesen — der Filter, der umgeschrieben werden muss

Beide Systeme filtern nach Metadaten. Beide meinen dasselbe. Keins versteht das andere.

```
Kendra                              BMKB
──────────────────────────────      ──────────────────────────────
AttributeFilter: {                  filter: {
  "EqualsTo": {                       "equals": {
    "Key": "_category",                 "key": "category",
    "Value": {                          "value": "networking"
      "StringValue": "networking"     }
    }                               }
  }
}
   │                                   │
   └─ Groß, verschachtelt,             └─ klein, flach, im
      typisiert im Value                  managedSearchConfiguration
```

Die Zuordnung ist über weite Strecken eins zu eins: `ContainsAny` → `in`, `GreaterThan` → `greaterThan`, `AndAllFilters` → `andAll`, `NotFilter` → `notIn` oder `notEquals`.

**Zwei Operatoren haben keinen Nachfolger:** `startsWith` und `stringContains` gibt es für Managed Knowledge Bases nicht. Wer in Kendra mit Präfixen oder Teilstrings gefiltert hat — `dokumenttyp startsWith "QM-"` — muss das Metadatenschema umbauen, auf exakte Treffer oder Mengenzugehörigkeit. Das ist keine Codeänderung, das ist eine Datenmigration.

## Was du dadurch nicht baust

Was in der Zielarchitektur nicht mehr existiert:

- kein Kendra-Index und keine Index-Edition, die stündlich abgerechnet wird
- kein selbst betriebener Vector Store, kein OpenSearch-Cluster, keine Kapazitätsplanung
- kein extern angebundenes LLM für die Antwortgenerierung
- keine `SubmitFeedback`-Schleife, die aus Klicks lernt
- keine Lambda-Hooks in der Ingestion
- keine Facettenleiste mit Trefferzahlen

Die letzten drei Punkte stehen absichtlich in derselben Liste wie die ersten drei. Manches davon wolltest du loswerden. Manches nicht.

## Wenn du dir eine Sache merkst

**Kendra hatte 32+ Konnektoren, BMKB hat 7. Was BMKB nicht anbinden kann, geht über S3 — mit einer Pipeline, die du selbst baust und selbst betreibst.**

Q Business ist kein Ausweg, es steht auf derselben Liste. OpenSearch ist kein Ausweg, es verlagert den Betrieb zu dir. Kendra weiterbetreiben ist für Bestandskunden zulässig und für einen Neubau seit dem 30.07.2026 keine Option mehr.

## Prüfungsknackpunkte

**Signalwörter:** „enterprise search across Confluence, SharePoint and S3", „connector not supported", „migrate off a service in maintenance mode". Kommt zusätzlich „faceted search" oder „autocomplete" vor, ist die Frage eine Fallenfrage.

**Maintenance Mode ist nicht Sunset.** Wartungsmodus heißt: keine neuen Features, keine Neukunden, aber voller Support, Bugfixes und Security-Updates — und **kein Enddatum**. Bei „our existing Kendra index" bleibt Kendra korrekt. Bei „we are building a new search application" nicht mehr.

**Facetten sind der Prüfstein.** Wer BMKB als vollwertigen Kendra-Ersatz anbietet, hat die Feature-Lücke nicht gelesen. Trefferzähler sind architektonisch nicht nachbaubar.

**Semantic-only erwarten.** BMKB ist immer hybrid. Eine Antwortoption, die einen reinen Semantic-Modus verspricht, ist falsch.

**A — Kendra-Index vergrößern und weiterbetreiben:** für Bestandskunden zulässig, aber die Frage nach der Migration bleibt unbeantwortet, und neue Features kommen keine mehr.

**B — Amazon Q Business:** seit dem 30.06.2026 selbst im Wartungsmodus.

**D — Eigener OpenSearch-Cluster mit selbst gebautem RAG:** löst die Konnektorenlücke nicht und bringt den vollen Betriebsaufwand zurück.

**E — Kendra-Konnektoren gegen BMKB-Konnektoren eins zu eins tauschen:** setzt voraus, dass es für jede Quelle einen gibt. Für ServiceNow und Salesforce gibt es keinen.
