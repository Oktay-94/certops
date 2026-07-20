---
nr: 63
title: "Support-Tickets klassifizieren — Comprehend, Lambda, DynamoDB"
services: ["Amazon Comprehend", "AWS Lambda", "Amazon API Gateway", "Amazon DynamoDB"]
domains: ["D3"]
signalwords:
  - "analyze customer feedback for sentiment"
  - "categorize tickets into our own predefined categories"
  - "no machine learning expertise"
  - "route angry customers first"
  - "custom categories specific to our business"
assets:
  svg: "battle_card_63.svg"
  png: "battle_card_63.png"
  pdf: "battle_card_63.pdf"
status_note: |
  QC (scripts/qc.py inkl. Prüfung (e)): 0 Befunde.
  Gemeldet: 7 Boxen, 38 Texte, 14 Segmente, 5 Badges, 1 X-Kreis.
  Aufschlüsselung R5: 14 gemeldete Segmente = 8 reale + 6 Phantom
  (3 Marker in <defs> × 2). Die 8 realen = 6 Pfeilsegmente + 2 X-Striche.
  7 Boxen = 6 Knoten + Footer-Leiste.
  R6: der X-Kreis ist weiß gefüllt mit rotem Rand, korrekt von (d)
  ausgenommen.

  Korrekturrunden:
  1. VOR dem Zeichnen: "Stimmung" und "Thema" lagen am rechten Ende ihrer
     Diagonalen und ragten in die Zielboxen (Sentiment bzw. Classify).
     Auf text-anchor="end" bei x=628 umgestellt, also an das linke
     Segmentende verlegt.
  2. VOR dem Zeichnen: "falsches Werkzeug" überlappte den X-Kreis.
     Nach unten auf y=645 verschoben.
  3. Footer-Variante 1 (1586,0 px) verworfen, Variante 2 mit 1210,0 px
     gewählt.
  4. **NACH dem Zeichnen, im PNG gefunden:** Die Topic-Modeling-Box
     endete bei y=820 und stieß damit ohne Luft direkt auf die
     Footer-Leiste, die bei y=820 beginnt. Der Übergangsstreifen zeigte
     Boxrand (217,119,6) und Footergrau (244,244,244) unmittelbar
     nebeneinander. Box um 30 px auf y=650 hochgezogen; Segment,
     X-Kreis und Label wurden mitgerechnet, nicht geschätzt.
     **Plan und SVG wurden synchron nachgezogen**, danach beide erneut
     geprüft (Plan 0/0/0, qc.py 0 Befunde).
     Diese Klasse — Box gegen Footer-Leiste — findet weder qc.py noch
     der Geometrieplan, weil der Footer im Plan nicht als Box geführt
     wird. Kandidat für die nächste Planversion.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie. **Eine musste
  nachgeschnitten werden (Z4).** Ursache erneut mein Zonenschnitt, nicht
  die Zeichnung: Ich hatte die Marker-Belegung nach R14 nicht
  berücksichtigt. Das Marker-Dreieck von Segment s2 endet bei (696,300)
  und belegt damit x bis 711 und y 285..315; meine Zone reichte bis
  x=700. Auf x1=660 korrigiert, danach 0 px.
  Alle vier verwendeten Farben im PNG nachweisbar (Quelle 4751 px,
  Compute 21953, Storage 2389, Verworfen 2429).

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855, aus dem
  SVG gelesen.

  R12-Gegencheck: **null <path> mit stroke.** Alle sechs Verbindungen
  sind <line>; die drei <path> sind Marker-Dreiecke in <defs>.

  R18 Titelband-Kanaldivergenz: 0 px.

  R16 von Hand: acht Spalte geprüft. Sechs 0 px. Bei "Stimmung" und
  "Thema" zunächst 84 bzw. 82 px Textfarbe im Streifen zur Lambda-Box —
  **Prüffehler meinerseits:** Der Streifen x 605,25..628 liegt
  *innerhalb* der gemessenen Labelbreite (550,7..628,0 bzw.
  576,3..628,0), nicht dahinter. Gefunden wurden also die Labels selbst.
  Rechnerisch gegengeprüft: Beide überlappen die Lambda-Box in x, aber
  **nicht in y** — "Stimmung" liegt 24,4 px über der Oberkante, "Thema"
  15,8 px unter der Unterkante. Keine Kollision.

  Footer von Hand mit PIL (R3): 1210,0 px, Textende x=1272,0,
  Luft 278,0 px.

  Sichtprüfung (R8): **versucht, fehlgeschlagen.** Zurück kam ein
  Bildobjekt ohne für Claude lesbaren Inhalt. Rechnerisch vollständig
  geprüft, aber **nicht gesehen**. Freigabe durch Oktay steht aus.
---

# Battle Card 63 — Support-Tickets nach Stimmung und Thema

## Szenario

Ein Software-Anbieter erhält täglich tausende Support-Tickets als Freitext.
Sie sollen automatisch nach **Stimmung** sortiert werden (verärgerte Kunden
zuerst) und nach **Thema** (Abrechnung, Bug, Feature-Wunsch). Die Themen sind
firmeneigen — kein Standardvokabular. Ein ML-Team gibt es nicht.

## Ablauf

**1 — Das Ticket kommt über API Gateway herein.** Freitext, unstrukturiert,
in großer Menge. Für die Karte ist nur wichtig, dass ein einzelnes Ticket
ankommt und sofort verarbeitet werden soll — das entscheidet später gegen den
Batch-Weg.

**2 — Lambda ruft `DetectSentiment` auf.** Diese Operation nutzt ein
**vortrainiertes** Modell: kein Training, kein Endpoint, kein Modell-ARN.
Zurück kommt genau eine von vier Kategorien — `POSITIVE`, `NEGATIVE`,
`NEUTRAL` oder `MIXED` — mit Konfidenzwerten. `MIXED` ist kein
Verlegenheitswert, sondern bedeutet, dass beide Stimmungen belegbar im Text
vorkommen.

**3 — Dieselbe Lambda ruft `ClassifyDocument` am Custom-Classifier-Endpoint
auf.** Für firmeneigene Klassen gibt es kein vortrainiertes Modell. Man
trainiert einen Custom Classifier mit gelabelten Beispielen und stellt ihn
über `CreateEndpoint` bereit; erst dann kann `ClassifyDocument` ihn nutzen.
Der Endpoint wird in **Inference Units** dimensioniert und **kostet, solange
er steht** — auch nachts, auch ohne Tickets.

**4 und 5 — Beide Ergebnisse laufen in DynamoDB zusammen.** Ein Ticket trägt
danach zwei Attribute: Stimmung und Thema. Die Priorisierung ist dann keine
ML-Frage mehr, sondern eine Abfrage — `NEGATIVE` zuerst.

**Verworfen — Topic Modeling.** Der Dienst klingt nach „Themen erkennen" und
ist es auch, aber im falschen Sinn: Er **entdeckt** Themen in einer Sammlung,
statt Dokumente in **vorgegebene** Klassen einzusortieren. Dazu kommt: Für
neue Accounts ist er seit dem **30.04.2026** nicht mehr verfügbar.

## Prüfungs-Kernsatz

**Topic Modeling entdeckt Themen, Custom Classification sortiert in
vorgegebene Klassen ein — und Sentiment braucht überhaupt kein Modell.**

## Abgrenzungen

- **Topic Modeling ↔ Custom Classification:** unüberwacht gegen überwacht.
  Topic Modeling bekommt keine Klassen vorgegeben und liefert Wortgruppen mit
  Gewichten (`topic-terms.csv`, `doc-topics.csv`). Custom Classification
  bekommt gelabelte Beispiele und liefert genau die Klassen, die man definiert
  hat. **Wer die Kategorien schon kennt, braucht nie Topic Modeling.**
- **Multi-class ↔ Multi-label:** Multi-class vergibt genau **eine** Klasse pro
  Dokument, Multi-label mehrere gleichzeitig. Ein Ticket, das eine
  Abrechnungsfrage *und* einen Bug enthält, verlangt Multi-label — das ist
  eine Trainingsentscheidung, keine API-Option.
- **Realtime-Endpoint ↔ asynchroner Job:** `ClassifyDocument` am Endpoint
  antwortet sofort, der Endpoint kostet dauerhaft.
  `StartDocumentClassificationJob` braucht keinen Endpoint, liest aus S3 und
  schreibt nach S3 — passend für nächtliche Stapel, nicht für ein einzelnes
  eintreffendes Ticket.
- **`DetectSentiment` ↔ `BatchDetectSentiment`:** Die Batch-Variante nimmt bis
  zu **25 Dokumente** pro Aufruf. Das ist eine Aufrufoptimierung, kein
  asynchroner Job.
- **63 ↔ 61/62:** Alle drei nutzen vortrainierte AI-Services ohne eigenes
  Modell. 63 ist der einzige Fall, in dem ein Teil der Aufgabe **doch** ein
  trainiertes Modell braucht — weil die Klassen firmeneigen sind.

## Klassiker-Fallen

1. **Topic Modeling für feste Kategorien.** Die häufigste Falle dieser Karte.
   Signalwörter wie „our own categories", „predefined classes" oder
   „route to the right team" schließen Topic Modeling aus, unabhängig von der
   Verfügbarkeit.
2. **SageMaker für Sentiment.** Ein eigenes Modell zu trainieren, wo
   `DetectSentiment` vortrainiert bereitsteht, ist in der Prüfung fast immer
   die falsche Antwort — „no ML expertise" ist das Signalwort dagegen.
3. **Endpoint für gelegentliche Stapel.** Wer einmal nachts alle Tickets
   klassifiziert, braucht keinen dauerhaft laufenden Endpoint. Antworten, die
   `StartDocumentClassificationJob` nennen, sind dann günstiger.
4. **Custom Classification für Sentiment.** Umgekehrter Fehler zu Falle 2:
   Stimmung ist abgedeckt, dafür braucht niemand ein eigenes Modell.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Comprehend Topic Modeling, Event Detection und Prompt Safety
  Classification sind für neue Kunden seit dem 30.04.2026 geschlossen.**
  Accounts mit Nutzung in den letzten zwölf Monaten behalten Zugriff. AWS
  nennt als Migrationsweg ausdrücklich **Bedrock LLMs** für Topics und Events
  sowie **Bedrock Guardrails** für Prompt Safety. **Alle übrigen
  Comprehend-Features sind nicht betroffen** — Sentiment, Entities, Key
  Phrases, Language Detection, PII, Toxicity, Custom Classification und Custom
  Entity Recognition laufen unverändert weiter.
  *Quelle: AWS-Doku „Amazon Comprehend feature availability change";
  AWS Service Availability Updates.*
- Kursmaterial führt Topic Modeling durchgehend als reguläres
  Comprehend-Feature. Für neue Accounts stimmt das nicht mehr — und die
  fachliche Abgrenzung zu Custom Classification wird dort oft gar nicht
  gemacht.
- Im selben Wartungsmodus-Paket stehen unter anderem **Rekognition Streaming
  Events und Batch Image Content Moderation** (siehe Karte 61), **AWS App
  Runner** (Thema 5), **AWS CloudTrail Lake** und **SNS Message Data
  Protection**.

## Nicht bestätigt

- **Durchsatz je Inference Unit.** Ein Drittanbieter nennt 100 Zeichen pro
  Sekunde je Unit. Die AWS-Doku beschreibt Inference Units als
  Durchsatzeinheit, ohne diesen Wert an gut auffindbarer Stelle zu bestätigen.
  **Nicht auf der Karte** — es ist zudem ein Betriebswert, kein Prüfungsstoff.
- **Preise** für Endpoints, Training und API-Aufrufe stehen grundsätzlich
  nicht auf der Karte. Die Karte sagt nur, **dass** der Endpoint im Stand
  kostet — das ist die prüfungsrelevante Aussage.
- **Empfohlene Mindestmenge an Trainingsbeispielen** für einen Custom
  Classifier: In Blogs kursieren verschiedene Zahlen; ich habe keine
  belastbare AWS-Angabe gefunden, die zu allen Klassenmodi passt.

## Bewusste Vereinfachungen im Diagramm

- **Die beiden Comprehend-Aufrufe sind als getrennte Boxen gezeichnet.**
  Es ist derselbe Dienst, aber zwei verschiedene Operationen mit
  grundsätzlich verschiedenen Voraussetzungen — genau das soll die Karte
  zeigen. Eine gemeinsame „Comprehend"-Box würde den Kernunterschied
  verdecken.
- **Training und Bereitstellung des Custom Classifiers fehlen im Bild.**
  `CreateDocumentClassifier` und `CreateEndpoint` laufen einmalig vorab, nicht
  pro Ticket. Der Kasten nennt „Endpoint nötig" als Hinweis darauf.
- **Der Rückweg zum Ticketsystem ist nicht gezeichnet.** Die Karte endet bei
  der Ablage; wie das Support-Tool die Priorisierung liest, ist nicht ihr
  Gegenstand.
- **Fehlerbehandlung, Retries und DLQ** sind nicht dargestellt.

## Farbkonventionen dieser Karte

| Element | Rolle | Farbe |
|---|---|---|
| API Gateway | **Quelle** | Blau `#2E6BE6` |
| Lambda | **Compute** | Orange `#D97706` |
| DetectSentiment | **Compute** | Orange `#D97706` |
| ClassifyDocument | **Compute** | Orange `#D97706` |
| Ticket-Ablage | **Storage** | Grün `#3F8624` |
| Topic Modeling (verworfen) | Compute-Rand, Ablehnung via X | Orange + Rot `#C7161D` |

Diese Karte ist stark orange, und das ist beabsichtigt: **Vier von sechs
Kästen sind Compute**, weil die Karte einen Verarbeitungsvorgang erklärt und
nicht einen Datenfluss über Speicherstufen. Nach der alten service-basierten
Palette hätten die drei Comprehend-Operationen und Lambda vier verschiedene
Farben getragen und suggeriert, dort passiere strukturell Verschiedenes.
Tatsächlich tun alle vier dasselbe: Sie verarbeiten den Ticketinhalt.

Der Unterschied zwischen den beiden Comprehend-Aufrufen ist deshalb **nicht**
über Farbe kodiert, sondern über die Kastentexte („vortrainiert" gegen
„Endpoint nötig") — Farbe beantwortet die Rollenfrage, nicht jede fachliche
Frage.
