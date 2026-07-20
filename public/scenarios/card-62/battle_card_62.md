---
nr: 62
title: "Rechnungsprüfung mit Human-in-the-Loop — Textract, Step Functions, SQS"
services: ["Amazon Textract", "AWS Step Functions", "Amazon SQS", "Amazon DynamoDB"]
domains: ["D3"]
signalwords:
  - "extract data from invoices and forms"
  - "low-confidence fields must be reviewed by a person"
  - "the workflow must wait for human approval"
  - "without paying for idle compute"
  - "pause the workflow until someone responds"
assets:
  svg: "battle_card_62.svg"
  png: "battle_card_62.png"
  pdf: "battle_card_62.pdf"
status_note: |
  QC (scripts/qc.py inkl. Prüfung (e)): 0 Befunde.
  Gemeldet: 8 Boxen, 46 Texte, 22 Segmente, 6 Badges, 1 X-Kreis.
  Aufschlüsselung R5: 22 gemeldete Segmente = 10 reale + 12 Phantom
  (6 Marker in <defs> × 2). Die 10 realen = 8 Pfeilsegmente (davon 2
  Teilstücke des rechtwinkligen Rückwegs) + 2 X-Striche.
  8 Boxen = 7 Knoten + Footer-Leiste.
  R6: der X-Kreis ist weiß gefüllt mit rotem Rand, korrekt von (d)
  ausgenommen.

  Korrekturrunden — alle VOR dem Zeichnen gefunden, keine danach:
  1. Boxtitel "Eingangs-Bucket" hatte nur 14,0 px Reserve (R4 verlangt
     20). Box von 228 auf 248 px verbreitert.
  2. "Dokument" ragte in die Step-Functions-Box: der Korridor
     Sfn→Textract war nur 76 px breit. Textract von x=676 auf x=716
     verschoben, Korridor damit 116 px.
  3. "Task Token" ragte in die Review-Queue-Box, gleiche Ursache im
     Korridor Queue→Sachbearbeiter. Sachbearbeiter ebenfalls auf
     x=716, A2I auf x=1050 nachgezogen.
  4. "geschlossen" überlappte gleich zwei Boxen (Sachbearbeiter und
     A2I), weil es unter dem X-Kreis zwischen beiden lag. Zu
     "A2I geschlossen" über den X-Kreis auf y=545 verschoben.
  5. Footer-Variante 1 (1437,8 px) verworfen — über der
     Stil-Guide-Grenze. Variante 3 mit 1168,4 px gewählt, weil sie
     die A2I-Schließung mitnimmt.
  Alle Segmente, Badges und der X-Kreis wurden nach den
  Boxverschiebungen neu berechnet, nicht angepasst geschätzt.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie. **Eine musste
  nachgeschnitten werden (Z5).** Ursache: Ich hatte gegen die
  Segmentachse x=472 geschnitten statt gegen die Badge-Außenkante
  cx−15=457 — genau der in R7 beschriebene Fehler. Die 125 belegten
  Pixel waren der Governance-farbene Badge 4, nicht die Zeichnung.
  Zone auf x1=455 korrigiert, danach 0 px. Alle übrigen zehn Zonen
  im ersten Lauf frei.
  Alle sieben verwendeten Farben im PNG nachweisbar (Quelle 3965 px,
  Transport 4858, Compute 6000, Storage 3087, Governance 9236,
  Verworfen 1443, Navy 8482).

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855, aus dem
  SVG gelesen.

  R12-Gegencheck: **null <path> mit stroke.** Alle acht Verbindungen
  sind <line>; die sechs <path> im Dokument sind ausschließlich
  Marker-Dreiecke in <defs>.

  R18 Titelband-Kanaldivergenz: 0 px — mit dem in Karte 61 gefundenen
  Gray-AA-Patch (scripts/render.py) im ersten Rendern erreicht.

  R16 von Hand: acht Spalte zwischen Labelenden und Boxaußenkanten
  (Kante inkl. stroke/2) gezielt auf die jeweilige Label-Textfarbe
  geprüft. Sechs Spalte 0 px. Bei "Task Token" zwei Treffer, exakt
  lokalisiert auf x 608,6–609,9 und x 689,9–691,9 — beides
  Antialiasing-Säume an den berechneten Labelenden selbst, 15,4 px
  bzw. 22,9 px von der nächsten Boxkante entfernt. Keine Kollision.
  Die PIL-Breitenmessung schneidet den AA-Saum knapp ab; das ist
  bekanntes Verhalten und kein Layoutfehler.

  Footer von Hand mit PIL (R3): 1168,4 px, Textende x=1230,4,
  Luft 319,6 px.

  Sichtprüfung (R8): **versucht, fehlgeschlagen.** Zurück kam ein
  leeres Bildobjekt. Die Karte ist rechnerisch vollständig geprüft,
  aber **nicht gesehen**. Freigabe durch Oktay steht aus.
---

# Battle Card 62 — Rechnungsprüfung mit Human-in-the-Loop

## Szenario

Eine Buchhaltung verarbeitet eingehende Rechnungen automatisch. Felder, die
Textract unsicher erkennt, dürfen nicht ungeprüft ins ERP. Ein Sachbearbeiter
soll sie korrigieren — ohne dass die Verarbeitung blockiert oder Compute im
Leerlauf bezahlt wird.

## Ablauf

**1 — Die Rechnung landet im Eingangs-Bucket und startet die Execution.** Ein
S3-Event startet eine **Standard**-Workflow-Execution. Der Workflow-Typ ist
hier keine Geschmacksfrage: Express Workflows unterstützen ausschließlich das
Request-Response-Muster. Ohne Standard gibt es keinen Callback.

**2 — Step Functions ruft Textract auf.** `AnalyzeDocument` mit
`FeatureTypes=["FORMS"]` liefert Key-Value-Paare mit Confidence-Werten. Der
Aufruf ist synchron, das Dokument darf bis 10 MB groß sein. Für vielseitige
PDFs bis 500 MB gäbe es `StartDocumentAnalysis`, das asynchron über SNS
zurückmeldet — dann führt der Weg über eine andere Verzweigung.

**3 — Ein Choice State entscheidet anhand der Confidence.** Liegen alle
wichtigen Felder über der Schwelle, wandert der Buchungssatz direkt in die
ERP-Ablage. Die Entscheidung trifft der Workflow, nicht Textract — Textract
liefert nur Zahlen.

**4 — Unsichere Felder gehen in die Review-Queue, der Workflow pausiert.** Der
Task nutzt `arn:aws:states:::sqs:sendMessage.waitForTaskToken`. Step Functions
erzeugt einen Task Token, legt ihn über `$$.Task.Token` aus dem Context Object
in die SQS-Nachricht und **hält die Execution an**. In dieser Zeit läuft keine
Lambda, kein Container, keine Instanz — genau das ist der Gewinn gegenüber
einem pollenden Prozess.

**5 — Der Sachbearbeiter zieht die Nachricht aus der Queue.** Die Web-App ist
selbstgebaut: Sie liest die Nachricht, zeigt Dokument und unsichere Felder an
und nimmt die Korrektur entgegen. Diesen Teil stellt AWS nicht bereit — das
ist der Preis dafür, ohne A2I auszukommen.

**6 — `SendTaskSuccess` weckt den Workflow.** Die App ruft die API mit dem
Token und dem korrigierten Ergebnis auf; erst dann läuft die Execution weiter.
Bei einer Ablehnung wäre es `SendTaskFailure`. Gegen hängende Executions setzt
man `HeartbeatSeconds`: Bleibt der Token aus, schlägt der Task mit
`States.Timeout` fehl und ein `Catch`-Block eskaliert.

**Verworfen — A2I.** Der naheliegende Dienst für genau diese Aufgabe wird am
**30.07.2026 für Neukunden geschlossen**. Bestandskunden nutzen ihn weiter.

## Prüfungs-Kernsatz

**Der Task Token pausiert den Workflow ohne laufenden Compute — und
`waitForTaskToken` gibt es nur in Standard Workflows.**

## Abgrenzungen

- **Standard ↔ Express:** Express unterstützt **nur** Request Response. Weder
  `.sync` noch `.waitForTaskToken`. Jede Aufgabe mit Warten auf einen Menschen
  ist damit automatisch Standard.
- **`.sync` ↔ `.waitForTaskToken`:** `.sync` wartet auf einen **Job**, dessen
  Ende AWS selbst erkennt (Batch, ECS, EMR). `.waitForTaskToken` wartet auf
  eine **Rückmeldung von außen**, die AWS nicht sehen kann. SQS unterstützt
  `waitForTaskToken`, aber kein `.sync`.
- **62 ↔ 61:** Beide holen bei Unsicherheit einen Menschen. 61 zeigt die
  fertige Integration (A2I in Rekognition), 62 den Eigenbau mit Callback.
  Der Unterschied ist nicht die Fähigkeit, sondern **wer die Review-Oberfläche
  stellt**.
- **`AnalyzeDocument` ↔ `AnalyzeExpense`:** Beide lesen Rechnungen.
  `AnalyzeExpense` ist auf Belege spezialisiert und liefert normalisierte
  Felder wie Vendor Name und Total. **`HumanLoopConfig` gibt es nur bei
  `AnalyzeDocument`** — wer A2I nutzen will, ist auf diese Operation
  festgelegt.
- **`AnalyzeDocument` ↔ `StartDocumentAnalysis`:** synchron bis 10 MB gegen
  asynchron bis 500 MB PDF mit SNS-Benachrichtigung. A2I ist nur im
  synchronen Weg vorgesehen.

## Klassiker-Fallen

1. **Express Workflow für einen Genehmigungsschritt.** Klingt nach „kurz und
   günstig", kann aber prinzipiell nicht warten. Eine Antwortoption mit
   Express plus menschlicher Freigabe ist immer falsch.
2. **Lambda, die auf die Antwort wartet.** Der Reflex „Lambda pollt die Queue,
   bis der Mensch antwortet" bezahlt Laufzeit fürs Nichtstun und stößt nach 15
   Minuten an die Lambda-Grenze. Der Token kostet währenddessen nichts.
3. **Kein Timeout gesetzt.** Ohne `HeartbeatSeconds` oder `TimeoutSeconds`
   wartet der Task, bis die Execution ihr Kontingent erreicht. Antworten, die
   Fehlerbehandlung erwähnen, sind meist die besseren.
4. **Token aus einem anderen Account.** Task Tokens müssen von Prinzipalen
   **desselben AWS-Accounts** zurückgeschickt werden. Cross-Account
   funktioniert nicht — eine beliebte Detailfalle.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **A2I, SageMaker Ground Truth und Mechanical Turk werden am 30.07.2026 für
  Neukunden geschlossen.** Bestandskunden nutzen weiter, AWS investiert in
  Sicherheit und Verfügbarkeit, aber **keine neuen Features**. Kursmaterial
  empfiehlt A2I durchgehend als Standardantwort für Human-in-the-Loop; für
  neue Accounts ist das ab dieser Woche keine Option mehr.
  *Quelle: AWS-Doku „Core Components of Amazon A2I" und „Get Started with
  Amazon Augmented AI"; AWS Service Availability Updates.*
- **`.waitForTaskToken` ist auf Standard Workflows beschränkt.** Die
  Integrationstabelle der AWS-Doku führt für Express durchgehend nur Request
  Response. Diese Einschränkung fehlt in vielen Übersichten, die Express nur
  über Dauer und Preis abgrenzen.
  *Quelle: AWS-Doku „Discover service integration patterns in Step Functions".*
- **Task Tokens funktionieren nicht über Account-Grenzen.** Steht als
  ausdrücklicher Hinweis in derselben Doku-Seite und fehlt in den meisten
  Kursdarstellungen des Callback-Patterns.

## Nicht bestätigt

- **Die Ein-Jahres-Grenze als Eigenschaft des Callbacks.** Die AWS-Doku
  beschreibt sie als Service-Quota der **Execution** („until the workflow
  execution reaches the one year service quota"), nicht als Eigenschaft des
  Task Tokens. Weil beide Lesarten in Umlauf sind, steht **keine Zahl auf der
  Karte**; die Karte sagt nur, dass der Workflow pausiert.
- **Preise** für Textract, Step Functions und A2I stehen grundsätzlich nicht
  auf der Karte. Die im Netz kursierenden Seitenpreise stammen zudem aus einer
  Drittquelle, die selbst angibt, die AWS-Preis-API nicht erreicht zu haben.
- **Confidence-Schwellen.** Welcher Wert „unsicher" bedeutet, legt die
  Anwendung fest. Für den A2I-Weg gibt es mit
  `ImportantFormKeyConfidenceCheck` einen definierten Bedingungstyp; für den
  Eigenbau gibt AWS keine Empfehlung.

## Bewusste Vereinfachungen im Diagramm

- **Der Choice State ist nicht als eigener Kasten gezeichnet**, sondern als
  Zeile in der Step-Functions-Box. Die Verzweigung zeigen die beiden
  ausgehenden Pfeile (3 und 4).
- **Der Rückweg endet im Bild an der Step-Functions-Box.** Fachlich ruft die
  Web-App die `SendTaskSuccess`-API des Step-Functions-Service auf; der Pfeil
  steht für „Execution läuft weiter", nicht für eine Netzwerkverbindung zur
  Box.
- **Der Weg vom geweckten Workflow ins ERP ist nicht separat gezeichnet.** Er
  ist mit Pfeil 3 identisch — nach dem Callback durchläuft der Vorgang
  dieselbe Ablage.
- **Kein DLQ, keine IAM-Rollen, kein `HeartbeatSeconds`-Kasten.** Die
  Timeout-Behandlung steht in der Erklärung, nicht im Bild.

## Farbkonventionen dieser Karte

| Element | Rolle | Farbe |
|---|---|---|
| Eingangs-Bucket | **Quelle** | Blau `#2E6BE6` |
| Step Functions | **Governance/Control** | Gold `#A16E00` |
| Textract | **Compute** | Orange `#D97706` |
| ERP-Ablage | **Storage** | Grün `#3F8624` |
| Review-Queue | **Transport** | Teal `#0F7C8C` |
| Sachbearbeiter | Struktur, keine Rolle | Navy `#232F3E` |
| A2I (verworfen) | Governance-Rand, Ablehnung via X | Gold + Rot `#C7161D` |

Zwei Zuordnungen sind erklärungsbedürftig und wurden bewusst so gewählt:

**Step Functions ist Governance, nicht Compute.** Der Dienst rechnet nicht, er
**entscheidet und koordiniert** — das ist die Rolle „Regeln und Steuerung".
Die eigentliche Arbeit macht Textract. Auf einer Karte, die Step Functions als
Datenverarbeiter zeigt, könnte dieselbe Box orange sein; hier erklärt die
Karte die Orchestrierung.

**Der Sachbearbeiter ist Navy, nicht Quelle.** Ein Mensch ist kein
AWS-Dienst und trägt keine Rollenfarbe. Navy ist im Stil-Guide für
Struktur und Nicht-Dienst-Boxen vorgesehen.

Die verworfene A2I-Box behält ihren **Governance-Rand in Gold**, damit der
Dienst erkennbar bleibt; abgelehnt wird sie durch X und roten Pfad. Ihr Rand
ist zusätzlich gestrichelt, weil sie passiv ist.
