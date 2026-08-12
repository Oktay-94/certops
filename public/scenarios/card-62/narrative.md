---
cardNumber: 62
slug: textract-callback-task-token-rechnungspruefung
title: "Rechnungsprüfung mit Human-in-the-Loop — Textract, Step Functions, SQS"
services: ["Amazon Textract", "AWS Step Functions", "Amazon SQS", "Amazon DynamoDB", "Amazon Augmented AI"]
domains: ["D3"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html"
  - "https://docs.aws.amazon.com/step-functions/latest/dg/integrate-optimized.html"
  - "https://docs.aws.amazon.com/step-functions/latest/apireference/API_SendTaskSuccess.html"
  - "https://docs.aws.amazon.com/textract/latest/dg/limits-document.html"
  - "https://docs.aws.amazon.com/textract/latest/dg/API_AnalyzeDocument.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-use-augmented-ai-a2i-human-review-loops.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-permissions-security.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/06/aws-service-availability/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, einem Menschen Arbeit zu übergeben und danach selbst weiterzumachen.

**Weg eins:** Du legst einem Kollegen die Rechnung auf den Tisch — und bleibst neben seinem Schreibtisch stehen. Alle zehn Sekunden fragst du, ob er schon fertig ist. Du tust nichts anderes, du gehst nicht weg, und bezahlt wirst du für jede dieser Minuten. Nach einer Viertelstunde ist deine Schicht zu Ende, ohne dass irgendetwas passiert wäre, und der Nächste stellt sich hin und fragt weiter.

**Weg zwei:** Garderobe. Du gibst den Mantel ab, bekommst Marke 47 und gehst. Niemand hält deinen Mantel in der Hand, der Garderobier trinkt Kaffee. Irgendwann kommst du mit Marke 47 zurück, und genau dein Mantel kommt heraus — nicht irgendeiner.

Die Marke ist der ganze Trick. Für sich genommen ist sie wertlos: ein Stück Pappe mit einer Zahl. Ihr Wert liegt darin, dass an der anderen Seite ein angehaltener Vorgang hängt, den sie eindeutig identifiziert. Solange die Marke draußen ist, wartet niemand, und es läuft nichts.

Genau das ist der **Task Token**. Step Functions hält eine Execution an, gibt eine Marke nach außen und schläft. Kommt die Marke zurück, läuft exakt dieser eine Vorgang weiter. Und wie in der Garderobe gilt: Die Marke funktioniert nur in *dieser* Garderobe. Eine Marke aus einem anderen Haus nimmt niemand an.

## Was es eigentlich ist — der Callback-Task

Kein Dienst, kein Server, kein Prozess. Ein **Task State mit einem Suffix im ARN**:

```json
{
  "An Sachbearbeiter geben": {
    "Type": "Task",
    "Resource": "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
    "HeartbeatSeconds": 172800,
    "Parameters": {
      "QueueUrl": "https://sqs.eu-central-1.amazonaws.com/1234/review-queue",
      "MessageBody": {
        "belegNr": "RE-2026-0473",
        "unsichereFelder": ["Rechnungsbetrag", "IBAN"],
        "taskToken.$": "$$.Task.Token"
      }
    },
    "Catch": [
      { "ErrorEquals": ["States.Timeout"], "Next": "Eskalation an Teamleitung" }
    ],
    "Next": "In ERP buchen"
  }
}
```

Lies das von oben nach unten, es ist die ganze Lösung der Aufgabe. Wohin geht die Nachricht (`Resource` plus `QueueUrl`), wie lange darf geschwiegen werden (`HeartbeatSeconds`), was steht drin (`MessageBody`), welche Marke gehört dazu (`taskToken.$`), was passiert bei Schweigen (`Catch`), wie geht es bei Erfolg weiter (`Next`).

Das entscheidende Zeichen ist der Punkt vor `waitForTaskToken`. Ohne ihn schickt Step Functions die Nachricht und geht sofort zum nächsten State — die Rechnung wäre gebucht, bevor sie jemand angesehen hat.

## Der Weg durch die Karte

### Kasten — Eingangs-Bucket

Rechnung `RE-2026-0473` landet als Scan im S3-Bucket. Mehr passiert hier nicht: S3 ist Ablage, kein Auslöser mit Meinung. Der Bucket weiß nichts über Beträge, IBANs oder Freigaben.

Wichtig für später: Ein Scan ist eine Datei mit einer Größe und einer Seitenzahl. Beide Zahlen entscheiden gleich darüber, welchen Textract-Weg du überhaupt nehmen darfst.

### Pfeil 1 — Upload startet die Execution

Das S3-Event startet eine Execution. Und hier fällt bereits die Entscheidung, die die ganze Karte trägt: **Standard**, nicht Express.

Express Workflows unterstützen ausschließlich *Request Response*. Kein `.sync`, kein `.waitForTaskToken` — das steht so in der Integrationstabelle der Step-Functions-Doku. Ein Express Workflow kann prinzipiell nicht auf einen Menschen warten. Wer diese Wahl am Anfang falsch trifft, merkt es erst an Schritt vier, und dann hilft kein Nachbessern: Der Workflow-Typ lässt sich nach dem Anlegen nicht umschalten.

### Kasten — Step Functions

Der Dienst rechnet nicht, er **entscheidet und koordiniert**. Deshalb steht die Box in Governance-Gold und nicht in Compute-Orange. Die eigentliche Arbeit macht Textract; Step Functions merkt sich nur, wo im Ablauf man gerade ist.

Das ist mehr wert, als es klingt. Der Zustand „Beleg 0473 wartet seit Dienstag auf Prüfung" liegt nicht in einer Datenbank, die jemand pflegen müsste, sondern *ist* die angehaltene Execution.

### Pfeil 2 — Dokument an Textract

`AnalyzeDocument` mit `FeatureTypes: ["FORMS"]` liefert Key-Value-Paare mit Confidence-Werten zurück.

Der Aufruf ist synchron, und die Grenzen sind eng: **10 MB** in Memory, und bei PDF und TIFF **genau eine Seite**. Die zweiseitige Rechnung mit Anlage geht diesen Weg also nicht. Dafür gibt es `StartDocumentAnalysis` — asynchron, bis 500 MB und 3.000 Seiten, Rückmeldung über SNS.

### Kasten — Textract

Textract liefert Zahlen, keine Urteile. Zu jedem erkannten Feld kommt ein Confidence-Wert, und dieser Wert ist eine Aussage über die Erkennung, nicht über die Richtigkeit der Rechnung. Ein sauber gedrucktes, aber falsches Konto bekommt 99,8 %.

Merk dir das Bild: Textract ist ein sehr guter Vorleser, kein Buchhalter.

Und er liest wörtlich. `FORMS` gibt dir Paare aus dem, was auf dem Papier steht — „Gesamtbetrag" bei einem Lieferanten, „Total" beim nächsten, „Endsumme brutto" beim dritten. Die Zuordnung dieser drei auf dein ERP-Feld `betrag_brutto` macht deine Anwendung, nicht Textract. Für Belege gibt es dafür `AnalyzeExpense`: dieselbe Idee, aber mit normalisierten Feldern wie Vendor Name und Total. Auf dieser Karte steht bewusst `AnalyzeDocument`, weil nur diese Operation den A2I-Block überhaupt kennt — die Karte zeigt den Weg, auf dem die Human-Review-Frage entsteht.

### Pfeil 3 — Confidence hoch, direkt ins ERP

Ein Choice State vergleicht die Confidence-Werte der wichtigen Felder mit einer Schwelle, die **du** festlegst. AWS gibt für den Eigenbau keine Empfehlung. 95 %, 98 %, 99,5 % — das ist eine fachliche Entscheidung darüber, wie teuer ein durchgerutschter Fehler ist, keine technische.

Liegen alle Felder darüber, wandert der Buchungssatz ohne Umweg in die Ablage.

### Kasten — ERP-Ablage

DynamoDB hält den geprüften Buchungssatz. Für die Karte ist nur eines wichtig: Hier landen **beide** Wege. Der automatisch durchgelaufene Beleg und der von Hand korrigierte liegen hinterher in derselben Tabelle und sehen gleich aus.

Wenn du später wissen willst, welcher Beleg durch Menschenhand ging, musst du das selbst mitschreiben.

### Pfeil 4 — Graubereich, der Workflow hält an

Ein unsicheres Feld führt in den Callback-Zweig. Step Functions erzeugt einen Task Token, legt ihn über `$$.Task.Token` aus dem Context Object in die SQS-Nachricht und **hält die Execution an**.

In dieser Zeit läuft keine Lambda, kein Container, keine Instanz. Das ist der ganze Gewinn: Warten kostet hier nichts außer dem Speicherplatz für den Zustand.

### Kasten — Review-Queue

SQS ist Briefkasten, nicht Bearbeiter. Die Queue weiß nicht, dass in der Nachricht eine Marke liegt; für sie ist der Token ein String wie jeder andere.

Das erklärt auch eine Zeile aus der Integrationstabelle, die man leicht überliest: SQS unterstützt `.waitForTaskToken`, aber **kein** `.sync`. AWS kann nicht sehen, wann eine Nachricht „fertig" ist — das kann nur der, der sie herausnimmt.

### Pfeil 5 — Task Token an den Sachbearbeiter

Die Web-App holt die Nachricht, zeigt Scan und unsichere Felder nebeneinander und nimmt die Korrektur entgegen.

Diesen Teil stellt AWS nicht bereit. Kein Task-Template, keine Workforce-Verwaltung, keine fertige Oberfläche — das ist der Preis dieser Architektur, und er ist kein kleiner: Oberflächen für Prüfarbeit sind zäh, weil jede Rückfrage der Fachabteilung darin landet.

### Kasten — Sachbearbeiter

Ein Mensch ist kein AWS-Dienst, deshalb ist die Box Navy und trägt keine Rollenfarbe.

Fachlich ist er trotzdem die interessanteste Stelle der Karte: Er ist der einzige Beteiligte, der die Rechnung *versteht*. Alles davor liest, alles danach speichert.

### Pfeil 6 — SendTaskSuccess weckt den Workflow

Die App ruft `SendTaskSuccess` mit dem Token und dem korrigierten Ergebnis auf. Das `output`-Feld fasst bis zu **262.144 Bytes** — die korrigierten Felder passen bequem, das komplette Dokument nicht. Schick den Beleg also nicht mit, sondern seinen Schlüssel.

Bei Ablehnung wäre es `SendTaskFailure`. Beide Aufrufe müssen von einem Prinzipal **desselben AWS-Accounts** kommen; Tokens über Account-Grenzen funktionieren nicht.

### Kasten — A2I Human Loop, verworfen

Und hier steht der eigentliche Grund, warum diese Karte so aussieht, wie sie aussieht.

**Amazon Augmented AI ist für Neukunden geschlossen.** Die SageMaker-Doku sagt es inzwischen im Präsens: „no longer open to new customers". Bestandskunden nutzen den Dienst weiter, AWS investiert in Sicherheit und Verfügbarkeit, aber keine neuen Features mehr.

A2I war der Dienst, der genau die Lücke füllte, die diese Karte per Hand schließt: `AnalyzeDocument` nimmt einen `HumanLoopConfig`-Block entgegen, Textract prüft die Confidence der wichtigen Felder selbst und startet bei Unterschreitung eine Review — samt Oberfläche, Worker-Verwaltung und Ergebnisablage. Das gibt es weiterhin, nur nicht mehr für neue Konten.

Die Karte zeigt die Ablehnung deshalb als rotes X und nicht als Alternative: Sie ist keine Abwägung mehr, sondern eine geschlossene Tür.

## Die entscheidende Unterscheidung

Drei Integrationsmuster, und nur eines wartet auf einen Menschen:

| | Request Response | Run a Job (`.sync`) | Callback (`.waitForTaskToken`) |
|---|---|---|---|
| Wartet auf | HTTP-Antwort | Ende eines Jobs | Rückgabe einer Marke |
| Wer meldet fertig | der Dienst sofort | AWS selbst | ein Aufruf von außen |
| Workflow-Typ | Standard und Express | nur Standard | nur Standard |
| Typisch für | SNS, DynamoDB | Batch, ECS, EMR, Glue | Mensch, Fremdsystem, Legacy |
| Bei SQS | unterstützt | **nicht unterstützt** | unterstützt |

Die mittlere Spalte ist der beliebteste Distraktor: `.sync` klingt nach „wartet", wartet aber nur auf Dinge, deren Ende AWS von sich aus erkennt.

## Die ehrliche Feinheit

**Der Statuswechsel ist größer als eine Box auf der Karte.** Mit dem Availability-Update vom 30. Juni 2026 sind zum 30. Juli 2026 gleich mehrere SageMaker-AI-Features für Neukunden geschlossen worden — darunter **A2I, Ground Truth und Mechanical Turk**. Ground Truth Plus hat bereits zum 30. Juni das End of Support erreicht. Für ein frisches AWS-Konto ist damit die gesamte verwaltete Human-Review-Ecke zu. Der Eigenbau mit Callback ist keine Stilfrage mehr, sondern der verbliebene Weg.

**Für die Prüfung heißt das etwas anderes als für die Praxis.** Prüfungsfragen hinken Produktentscheidungen hinterher. Es kann dir in einem SAA-C03-Item begegnen, dass A2I als Antwort auf „low-confidence predictions need human review" erwartet wird — inhaltlich ist das die Beschreibung des Dienstes, und die stimmt weiterhin. Lerne beides: was A2I *tut* und dass du es in einem neuen Konto nicht mehr anlegen kannst.

**Die Ein-Jahres-Grenze gehört nicht dem Token.** Die Doku formuliert sie als Eigenschaft der Execution: pausiert wird, „until the workflow execution reaches the one year service quota". Es ist also das Maximalalter eines Standard Workflows, das hier zuschlägt, nicht eine Haltbarkeit der Marke. Praktisch reicht das ohnehin nie als Sicherung — kein Sachbearbeiter kommt nach elf Monaten zurück. Deshalb `HeartbeatSeconds` mit einer Zahl, die zu deinem Prozess passt, und ein `Catch` auf `States.Timeout`.

**Es laufen zwei Uhren, und sie wissen nichts voneinander.** Die angehaltene Execution ist die eine. Die SQS-Nachricht ist die andere: Sie hat eine eigene Retention, laut SQS-Doku zwischen einer Minute und **14 Tagen**, voreingestellt vier Tage. Nimmt der Sachbearbeiter den Beleg nicht rechtzeitig heraus, löscht SQS die Nachricht — und mit ihr die einzige Kopie des Tokens. Die Execution wartet danach auf eine Marke, die niemand mehr besitzt. Aus Sicht der Konsole sieht das aus wie „läuft noch".

Dieselbe Logik gilt kleiner: Zieht die Web-App die Nachricht und stürzt vor `SendTaskSuccess` ab, wird sie nach Ablauf des Visibility Timeout wieder sichtbar — Voreinstellung 30 Sekunden, Maximum 12 Stunden. Das ist die gute Hälfte der Geschichte: Der Callback überlebt einen App-Absturz, aber nur bis zum Ende der Retention.

**Und eine Falle im Timeout selbst:** Läuft ein Callback-Task in den Timeout, erzeugt Step Functions bei einem erneuten Anlauf einen **neuen** Token. Die alte Marke ist damit Papier. Wer sie zwei Tage später doch noch zurückschickt, bekommt `InvalidToken` — und wundert sich, weil die Nachricht in der Queue ja korrekt aussah.

## Syntax lesen — der Resource-ARN

Der ARN identifiziert keine echte Ressource, er ist ein Namensraum für Integrationen:

```
arn:aws:states:::sqs:sendMessage.waitForTaskToken
    │    │      ││ │   │           │
    │    │      ││ │   │           └─ Integrationsmuster
    │    │      ││ │   └─ die API-Operation
    │    │      ││ └─ der Zieldienst
    │    │      │└─ Account leer: der eigene
    │    │      └─ Region leer: die eigene
    │    └─ Step Functions als Namensraum
    └─ Partition
```

Die beiden leeren Felder zwischen den Doppelpunkten sind kein Tippfehler — Region und Account stehen deshalb nicht drin, weil beide aus der laufenden Execution abgeleitet werden. Genau das ist auch der technische Kern der Account-Beschränkung weiter oben.

Der Pfad zur Marke funktioniert nach derselben Logik: `$` ist die State-Eingabe, `$$` das Context Object, `$$.Task.Token` die Marke des aktuellen Task. Das doppelte Dollarzeichen ist der ganze Unterschied zwischen „was reinkam" und „wo ich gerade bin".

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Prozess, der pollt und dabei Laufzeit bezahlt
- keine Statustabelle „offene Prüffälle" — die angehaltene Execution ist der Status
- kein Cron, der nachschaut, ob jemand geantwortet hat
- keine A2I-Flow-Definition, keine Workforce, keine Worker-Task-Templates
- kein Wiederanlauf-Code nach einem Neustart der Web-App

Übrig bleiben ein State-Machine-Definition, eine Queue, eine eigene Oberfläche — und die Rechnung, dass die Oberfläche der teure Teil ist.

## Wenn du dir eine Sache merkst

**Der Task Token pausiert eine Execution ohne laufenden Compute — und `.waitForTaskToken` gibt es nur in Standard Workflows.**

Express Workflows können das Muster nicht, egal wie günstig sie sonst wären. Eine Lambda, die auf den Menschen wartet, bezahlt Laufzeit fürs Nichtstun und stirbt nach spätestens 15 Minuten. Und `.sync` wartet zwar auch, aber nur auf Jobs, deren Ende AWS selbst sieht — ein Mensch gehört nicht dazu.

## Prüfungsknackpunkte

**Signalwörter:** „the workflow must wait for human approval", „pause until someone responds", „without paying for idle compute", „low-confidence fields must be reviewed by a person". Warten plus Mensch plus keine Leerlaufkosten ist immer der Callback.

**Warum Express Workflows hier verlieren:** Sie unterstützen nur Request Response — die Fähigkeit fehlt, nicht die Geduld. Jede Antwortoption mit Express *und* menschlicher Freigabe ist automatisch falsch.

**Warum eine pollende Lambda hier verliert:** Sie bezahlt jede Minute Wartezeit und reißt bei 15 Minuten Laufzeit ab. Die Aufgabe verlangt Warten über Stunden.

**Warum `.sync` hier verliert:** Es wartet auf Jobs, deren Abschluss AWS erkennt. Bei SQS ist es laut Integrationstabelle gar nicht verfügbar.

**Warum A2I hier verliert:** Fachlich wäre es die gebaute Lösung für genau diese Aufgabe — für ein neues Konto ist der Dienst seit dem 30.07.2026 aber nicht mehr anlegbar. In der Praxis ist er raus; in einer Prüfungsfrage kann er als Beschreibung noch auftauchen.

**Die Detailfalle:** Task Tokens müssen von Prinzipalen desselben AWS-Accounts zurückkommen. Cross-Account funktioniert nicht — und diese Zeile steht nur in der Callback-Doku, nicht in den üblichen Übersichten.
