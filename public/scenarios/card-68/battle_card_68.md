---
nr: 68
title: "Bedrock Knowledge Bases (RAG) — interner Chatbot auf Firmendokumenten"
services:
  - Amazon Bedrock Knowledge Bases
  - Amazon Bedrock (Model Inference, Embeddings)
  - Amazon OpenSearch Serverless
  - Amazon S3
  - Amazon Bedrock Agents Classic (Randhinweis, Neukunden-Stopp)
domains:
  - D3
signalwords:
  - "Retrieval Augmented Generation / RAG"
  - "answer questions from company documents"
  - "without training or fine-tuning a model"
  - "source attribution / cite the source"
  - "documents change frequently"
  - "fully managed RAG workflow"
assets:
  - battle_card_68.svg
  - battle_card_68.png
  - battle_card_68.pdf
status_note: |
  qc.py: 0 Befunde im ERSTEN Lauf.
  Gemeldet: 11 Boxen, 62 Texte, 21 Segmente, 7 Badges, 1 X-Kreis.
  Segment-Aufschlüsselung nach R5: 6 Marker in <defs> erzeugen 12
  Phantom-Segmente -> 21 - 12 = 9 echte Segmente (7 Pfeile + 2 X-Striche).
  Elfte "Box" ist die gestrichelte Agents-Classic-Randleiste (trägt Text,
  deshalb echte Box, keine Zone).

  Korrekturrunden — ALLE VOR dem Zeichnen:
  (1) 1 Titelbefund: 'Data Source Sync' 218,1 px bei Innenmaß 234 ->
      Reserve 15,9 px, unter der 20-px-Schwelle. Behoben durch
      ZWEIZEILIGEN Titel 'Data Source' / 'Sync' statt Kürzung.
      Dritte Karte in Folge mit derselben Ursache — 22-px-Bold-Titel
      passen ab etwa 18 Zeichen nicht mehr in eine 250-px-Box.
  (2) Randleiste: BEIDE geplanten Textvarianten sprengten die
      930 px breite Leiste (1.156,6 und 980,3 px bei Innenmaß 914).
      Behoben durch Verbreiterung der Leiste auf 1.180 px.
      Variante 1 hätte darin nur 7,4 px Reserve gehabt und wurde
      verworfen; genommen wurde Variante 2 mit 183,7 px Reserve.
  (3) Footer-Variante 1 mit 1.424,5 px über dem Stil-Guide-Maß (~1.420).
      Variante 2 mit 1.282,5 px genommen.

  METHODISCHER BEFUND AM PLANSKRIPT: Die Schwellenprüfung für die
  Randleiste stand nach dem Patch noch auf dem alten Innenmaß 914 und
  meldete deshalb FAIL für eine Variante, die in die verbreiterte Leiste
  passt. Aufgefallen bei der Kontrolle, von Hand gegen 1.164 nachgerechnet.
  Lehre: Wird eine Boxbreite im Plan geändert, muss die zugehörige
  Schwelle mitgeändert werden — sonst prüft das Skript still gegen ein
  totes Maß. Für Batch 15 vormerken.

  NACH dem Zeichnen: keine Korrektur nötig.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie abgeleitet
  (40 belegte Rechtecke automatisch eingesammelt).
  Planvorhersage 0 — PNG 0. Übereinstimmung, keine Zone nachgeschnitten.

  R13: 0 px reines (0,0,0). Merksatz-y = 863 AUS DEM SVG gelesen;
  Band y 843..871 ebenfalls 0 px.
  R18 Titelband: 0 px Kanaldivergenz.
  R12: NULL <path> mit stroke — alle 9 Verbindungen als <line>.
  Palettenfarben: Quelle 9.366 · Transport 4.679 · Compute 10.555 ·
  Storage 4.998 · Governance 8.358 · Verworfen 2.534 px.
  ERSTE KARTE DES BATCHES MIT ALLEN SECHS ROLLENFARBEN.
  Footer: 1.282,5 px. Randleiste: 980,3 px in 1.164 px.

  Sichtprüfung: VERSUCHT, FEHLGESCHLAGEN. Der Viewer gab lediglich
  '[image]' ohne lesbaren Inhalt zurück. Siebter Fehlschlag in Folge.
  RECHNERISCH GEPRÜFT, NICHT GESEHEN.
---

# Battle Card 68 — Bedrock Knowledge Bases (RAG)

## Szenario

Ein Maschinenbauer hat 12.000 Dokumente: Wartungsanleitungen, Prüfprotokolle
und Serviceberichte in S3, dazu ein Confluence mit den internen
Prozessbeschreibungen. Der Innendienst soll natürlichsprachlich fragen können —
"Welches Drehmoment gilt für die Antriebswelle der Baureihe 400?" — und eine
Antwort **mit Quellenangabe** bekommen. Die Dokumente ändern sich laufend.

Ein Entwickler schlägt vor, die RAG-Pipeline selbst zu bauen: Lambda für das
Chunking, Bedrock für die Embeddings, OpenSearch als Vector Store, die
Synchronisation selbst orchestriert.

## Ablauf

**1 — Dokumente abholen.**
Die Knowledge Base zieht aus S3 und Confluence. Weitere unterstützte Quellen
sind SharePoint, Salesforce und Web Crawler; **bis zu fünf Datenquellen** lassen
sich in einen Index zusammenführen.

**2 — Data Source Sync hält den Index aktuell.**
Ein Ingestion Job holt die Dokumente und hält den Vektorindex mit der Quelle
synchron. Bedrock übernimmt das Aktualisieren der Embeddings — **das ist der
Teil, den die Selbstbau-Variante dauerhaft selbst betreiben müsste.**

**3 — Chunking und Embedding, managed.**
Bedrock zerlegt die Dokumente in Chunks, wandelt sie in Embeddings um und
schreibt sie in den Vektorindex — **unter Beibehaltung des Mappings auf das
Originaldokument.** Genau dieses Mapping ist die technische Grundlage der
Quellenangabe, die der Innendienst verlangt.

Chunking-Strategien: fixed-size (Tokenzahl je Chunk plus Overlap-Prozentsatz),
hierarchisch (Kind-Chunks werden bei der Retrieval durch ihre Eltern-Chunks
ersetzt) und semantisch.

**4 — Vector Store.**
Bedrock kann eine OpenSearch-Serverless-Collection automatisch anlegen.
Alternativen: Aurora, Pinecone, Redis Enterprise Cloud, MongoDB.

**5 — Der Chatbot fragt über RetrieveAndGenerate.**
Ein Aufruf, der Retrieval und Generierung zusammenfasst und die Antwort samt
Quellenangabe zurückgibt.

**6 — Die Knowledge Base steuert den Abfragepfad.**
IAM Service Role, Datenquellen-Konfiguration und Chunking-Strategie hängen an
der Knowledge Base. **Kein Modelltraining, kein Fine-Tuning.**

**7 — Verworfen: Selbstbau auf Lambda + OpenSearch.**
Technisch möglich, aber undifferenziertes Heavy Lifting: Chunking-Logik,
Embedding-Aufrufe, Indexpflege und vor allem die laufende Synchronisation
müssten selbst gebaut und betrieben werden.

## Die Kontrastbox: Retrieve gegen RetrieveAndGenerate

Zwei APIs, die in Prüfungsfragen gern verwechselt werden:

- **`Retrieve`** liefert nur die relevanten Chunks samt Quellen zurück. Man
  formuliert den Prompt selbst und ruft das Modell selbst auf. Sinnvoll, wenn
  eigenes Prompting, Nachbearbeitung oder eine eigene Modellwahl nötig ist.
- **`RetrieveAndGenerate`** macht beides in einem Aufruf: Retrieval, Prompt-
  Augmentierung, Modellaufruf, Antwort mit Source Attribution.

Faustregel: Wer nur eine Antwort will, nimmt `RetrieveAndGenerate`. Wer die
Chunks weiterverarbeiten will, nimmt `Retrieve`.

## Randleiste auf der Karte: Agents Classic — eine Entwarnung

Bedrock Agents (Launch November 2023) heißt seit dem 30.06.2026
**Bedrock Agents Classic** und ist ab dem 30.07.2026 für Neukunden geschlossen.

**Für diese Karte ist das eine Entwarnung, keine Warnung.** AWS stellt
ausdrücklich klar: Bedrock selbst bleibt voll unterstützt, nur die
Agents-Classic-Orchestrierungsschicht ist betroffen; bestehende Modelle,
Knowledge Bases und Guardrails sind unberührt. Der Modellkatalog von Agents
Classic friert zum Stichtag ein, während Bedrock — Model Inference, Knowledge
Bases, Guardrails — weiterhin neue Modelle bekommt.

Und für dieses Szenario braucht es ohnehin keinen Agent: Fragen aus Dokumenten
beantworten ist reines RAG. Ein Agent wird gebraucht, wenn das System **Aktionen
ausführen** soll — APIs aufrufen, Aufgaben zerlegen, mehrschrittig orchestrieren.

## Prüfungs-Kernsatz

**RAG heißt: kein Modelltraining. Retrieve gibt Chunks, RetrieveAndGenerate gibt
die Antwort.**

## Abgrenzungen

- **RAG ↔ Fine-Tuning:** Fine-Tuning verändert die Modellgewichte und muss bei
  jeder Dokumentänderung wiederholt werden. RAG lässt das Modell unverändert
  und tauscht den Inhalt des Vektorindex. Ein Szenario mit "die Dokumente ändern
  sich laufend" ist immer RAG.
- **Knowledge Base ↔ Agent:** Die Knowledge Base beantwortet Fragen aus Daten.
  Der Agent führt Aktionen aus und kann dabei eine Knowledge Base benutzen.
  Q&A allein braucht keinen Agent.
- **Bedrock Knowledge Bases ↔ Kendra (Karte 69):** siehe dort. Kurz: Kendra ist
  Enterprise-Suche mit vielen Konnektoren, Bedrock KB ist der RAG-Pfad in eine
  Modellantwort.
- **Managed ↔ Selbstbau:** Beide Wege enden im selben Vector Store. Der
  Unterschied ist der Betrieb: Sync-Logik, Indexpflege und Fehlerbehandlung.

## Klassiker-Fallen

1. **"Fine-Tuning" als Antwort auf "Antworten aus Firmendokumenten".** Fast
   immer falsch, wenn die Dokumente sich ändern oder Quellenangaben gefordert
   sind.
2. **Agent für reines Q&A.** Ein Agent ist Orchestrierung. Wo nichts orchestriert
   werden muss, ist er überflüssig — und seit 30.07.2026 für Neukunden zu.
3. **`Retrieve` und `RetrieveAndGenerate` verwechseln.** Das Signalwort ist,
   ob die Anwendung eine fertige Antwort oder Rohmaterial braucht.
4. **Vector Store selbst bauen wollen.** Bedrock kann OpenSearch Serverless
   automatisch anlegen. In einem Szenario mit "kein Team für Betrieb" ist das
   der Punkt.
5. **Quellenangabe für selbstverständlich halten.** Sie funktioniert nur, weil
   das Mapping vom Chunk zum Originaldokument erhalten bleibt — ein Argument
   gegen den Selbstbau, in dem man das selbst implementieren müsste.

## Faktencheck

- **Bedrock Agents Classic:** Umbenennung zum 30.06.2026, Neukunden-Stopp zum
  30.07.2026, Empfehlung Migration auf Bedrock AgentCore. Bestandskunden nutzen
  den Dienst normal weiter.
  *Quelle: AWS-Doku, "Amazon Bedrock Agents Classic maintenance mode".*
- **Knowledge Bases sind NICHT betroffen.** AWS formuliert ausdrücklich, dass
  Bedrock voll unterstützt bleibt und nur Agents Classic für Neukunden schließt;
  bestehende Modelle, Knowledge Bases und Guardrails bleiben unberührt.
  *Quelle: ebenda.*
- **Modellkatalog-Freeze:** Der in Agents Classic verfügbare Modellkatalog ist
  zum Stichtag eingefroren; neue Modelle kommen über AgentCore. Bedrock selbst
  (Model Inference, Knowledge Bases, Guardrails) erhält weiterhin neue Modelle.
  *Quelle: ebenda, FAQ-Abschnitt.*
- **Fehlerbild bei nicht freigeschaltetem Konto:** `AccessDeniedException`
  (HTTP 403) mit dem Hinweis, dass Agents im Maintenance Mode sind und neue
  Agents für Konten ohne vorherige Nutzung nicht erstellt werden können.
  *Quelle: ebenda.*
- **Ingestion-Ablauf:** Bedrock zerlegt Dokumente in Chunks, wandelt sie in
  Embeddings und schreibt sie in einen Vektorindex unter Beibehaltung des
  Mappings zum Originaldokument.
  *Quelle: AWS-Doku, "How content chunking works for knowledge bases".*
- **Chunking-Strategien:** fixed-size mit konfigurierbarer Tokenzahl und
  Overlap-Prozentsatz; hierarchisches Chunking ersetzt Kind-Chunks bei der
  Retrieval durch Eltern-Chunks, wodurch weniger Ergebnisse zurückkommen können
  als angefordert.
  *Quelle: ebenda.*
- **Managed RAG:** Knowledge Bases decken den gesamten RAG-Workflow von der
  Ingestion bis zur Retrieval und Prompt-Augmentierung ab; eigene Integrationen
  zu Datenquellen oder Datenflusssteuerung entfallen. Session-Kontext für
  Multi-Turn-Konversationen ist eingebaut.
  *Quelle: AWS Prescriptive Guidance, "Knowledge bases for Amazon Bedrock".*
- **Vector-Store-Optionen:** OpenSearch Serverless (von Bedrock automatisch
  anlegbar), Aurora, Pinecone, Redis Enterprise Cloud, MongoDB.
  *Quelle: ebenda und AWS-Ankündigung zur GA von Knowledge Bases.*

## Nicht bestätigt

- **Die Zahl "bis zu fünf Datenquellen je Knowledge Base"** stammt aus einem
  AWS-Builder-Center-Workshop, nicht aus der Referenzdokumentation. Sie steht
  auf der Karte, weil AWS sie in eigenem Material nennt — sollte sie sich als
  veraltet erweisen, ist die Aussage "mehrere Quellen in einen Index" davon
  unberührt.
- **Ein Enddatum für Agents Classic.** Es gibt keines; Bestandskunden behalten
  den Dienst. Dieselbe Unterscheidung wie bei Forecast (Karte 66) und Model
  Monitor (Karte 67).
- **Ob Kendra als Retrieval-Backend für Bedrock KB in der Prüfung eine Rolle
  spielt.** Die Verbindung existiert, gehört aber auf Karte 69.

## Bewusste Vereinfachungen im Diagramm

- **Das Foundation Model ist keine eigene Box.** `RetrieveAndGenerate` ruft
  intern ein Bedrock-Modell auf; eine eigene Box hätte suggeriert, es sei ein
  separat zu verwaltender Baustein.
- **Der Rückweg der Antwort zum Chatbot ist nicht gezeichnet.** Pfeil 5 zeigt
  die Frage; die Antwort läuft denselben Weg zurück.
- **`Retrieve` steht ohne Verbindungslinie** neben `RetrieveAndGenerate`. Das
  ist Absicht: Es ist eine Alternative auf demselben Pfad, kein zusätzlicher
  Schritt. Eine Linie hätte eine Reihenfolge suggeriert.
- **Guardrails sind nicht dargestellt**, obwohl sie in einem internen Chatbot
  meist dazugehören.
- **Der Sync-Job ist als eigener Knoten geführt**, obwohl er Teil der Knowledge
  Base ist. Die Trennung ist didaktisch: Sie macht sichtbar, was der Selbstbau
  dauerhaft selbst betreiben müsste.

## Farbkonventionen dieser Karte

| Knoten | Rolle | Begründung |
|---|---|---|
| Dokumente S3 + Confluence | **Quelle** (Blau) | Einstieg der Daten |
| Data Source Sync | **Transport** (Teal) | Nimmt entgegen und reicht weiter — Präzedenz Event Tracker K65 |
| Chunking + Embedding | **Compute** (Orange) | Transformiert Text in Vektoren |
| Vector Store | **Storage** (Grün) | Hier liegen die Embeddings |
| Chatbot | **Quelle** (Blau) | Origin der Anfrage |
| RetrieveAndGenerate | **Compute** (Orange) | Rechnet: Suche plus Generierung |
| Retrieve | **Compute** (Orange) | Gleiche Rolle, andere API |
| Knowledge Base | **Governance** (Gold) | Konfiguration und Rechte, rechnet nicht |
| Agents Classic (Randleiste) | **Governance** (Gold), gestrichelt | Kein Ablaufschritt, Statushinweis |
| Selbstbau | **Compute-Rand** (Orange), verworfen über X | Rollenfarbe bleibt, abgelehnt über X und roten Pfad |

**Erste Karte des Batches mit allen sechs Rollenfarben.** Transport kommt
durch den Sync-Knoten dazu — die Einstufung folgt dem Präzedenzfall Event
Tracker auf Karte 65: ein Knoten, der Daten entgegennimmt und weiterreicht,
ohne sie fachlich zu verändern, ist Transport, nicht Compute.

**Zum Gegenlesen:** Chunking + Embedding ist **Compute**, obwohl es Teil
desselben managed Workflows ist wie der Sync. Begründung: Hier wird der Inhalt
tatsächlich transformiert (Text zu Vektoren), während der Sync nur befördert.
