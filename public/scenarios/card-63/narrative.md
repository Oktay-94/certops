---
cardNumber: 63
slug: comprehend-sentiment-custom-classification-tickets
title: "Support-Tickets klassifizieren — Comprehend, Lambda, DynamoDB"
services: ["Amazon Comprehend", "AWS Lambda", "Amazon API Gateway", "Amazon DynamoDB"]
domains: ["D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/comprehend/latest/dg/comprehend-availability-change.html"
  - "https://docs.aws.amazon.com/comprehend/latest/dg/guidelines-and-limits.html"
  - "https://docs.aws.amazon.com/comprehend/latest/dg/topic-modeling.html"
  - "https://docs.aws.amazon.com/comprehend/latest/dg/API_BatchDetectSentiment.html"
  - "https://docs.aws.amazon.com/comprehend/latest/dg/supported-languages.html"
  - "https://docs.aws.amazon.com/comprehend/latest/dg/how-sentiment.html"
  - "https://aws.amazon.com/comprehend/features/"
  - "https://aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability"
---

## Die Grundidee zuerst

Zwei Fragen zu demselben Brief, und der Unterschied zwischen ihnen ist die ganze Karte.

**Frage eins:** „Ist der Absender wütend?" Diese Frage kann jeder Mensch auf der Straße beantworten. Du brauchst niemanden einzuarbeiten, niemandem deine Firma zu erklären, niemandem beizubringen, was ihr verkauft. Du hältst den Brief hin und bekommst eine Antwort.

**Frage zwei:** „Geht es um Abrechnung, um einen Bug oder um einen Feature-Wunsch?" Diese Frage kann derselbe Mensch **nicht** beantworten. Nicht weil sie schwerer wäre — sondern weil diese drei Schubladen eure Erfindung sind. Wer sie sortieren soll, muss vorher lernen, wie ihr sie meint. Und solange jemand dafür an einem Schreibtisch sitzt, kostet dieser Schreibtisch Geld — auch nachts, auch wenn kein Brief kommt.

Genau daran entlang trennt Amazon Comprehend seine Dienste. **Was für alle gleich ist, ist vortrainiert. Was nur bei dir gilt, musst du trainieren und bereitstellen.** Stimmung ist Weltwissen. Deine Kategorien sind es nicht.

Das erklärt die beiden orangen Kästen oben und unten auf der Karte: gleiche Farbe, weil beide dasselbe Ticket verarbeiten — verschiedene Zeilen darunter, weil der eine kein Modell braucht und der andere eines im Stand bezahlt.

## Was es eigentlich ist — zwei Aufrufe, ein Ticket

Leg die beiden Requests nebeneinander, dann siehst du den Unterschied in einer einzigen Zeile:

```json
{
  "Text": "Seit dem Update stürzt die App beim Export ab. Drittes Ticket dazu!",
  "LanguageCode": "de"
}
```

```json
{
  "Text": "Seit dem Update stürzt die App beim Export ab. Drittes Ticket dazu!",
  "EndpointArn": "arn:aws:comprehend:eu-central-1:1234:document-classifier-endpoint/tickets-v3"
}
```

Oben `DetectSentiment`: Text, Sprache, fertig. Es gibt nichts zu referenzieren, weil es nichts gibt, das dir gehört.

Unten `ClassifyDocument`: derselbe Text, aber ein **ARN** dazu. Dieser ARN zeigt auf einen Endpoint, der auf einem Modell steht, das du aus gelabelten Beispielen trainiert hast. Die Zeile ist keine Formalität — sie ist die Rechnung. Ein Endpoint existiert oder existiert nicht, und solange er existiert, wird er bezahlt.

Die Antwort auf den ersten Aufruf ist ebenso schlicht: eine von vier Kategorien plus vier Wahrscheinlichkeiten.

```json
{
  "Sentiment": "NEGATIVE",
  "SentimentScore": {
    "Positive": 0.002, "Negative": 0.981, "Neutral": 0.013, "Mixed": 0.004
  }
}
```

`Sentiment` ist bereits die Entscheidung — Comprehend nimmt dir das Argmax ab. Der Block darunter ist trotzdem der interessantere: Er sagt dir, **wie sicher** die Entscheidung war. 0,981 gegen 0,013 ist eine klare Sache. Ein Ticket mit 0,44 gegen 0,41 ist es nicht, und ob du solche Fälle als „unklar" ablegst oder trotzdem eskalierst, ist eine Produktentscheidung, die niemand außer dir treffen kann.

Nimm beide Antworten zusammen, und das Ticket trägt danach zwei Attribute. Mehr Ergebnis gibt es nicht, und mehr braucht es auch nicht.

## Der Weg durch die Karte

### Kasten — API Gateway

Ticket `TCK-8842` kommt als Freitext herein, tausende am Tag. API Gateway ist hier reine Tür: Es nimmt entgegen, authentifiziert, drosselt — und versteht kein Wort vom Inhalt.

Für die Karte zählt nur eines: Es kommt **ein einzelnes Ticket** an, und es soll sofort verarbeitet werden. Genau diese zwei Eigenschaften entscheiden später gegen den asynchronen Batch-Weg.

Halt diesen Satz fest, denn er ist der eigentliche Hebel der ganzen Aufgabe. Dieselben Dienste, dieselben Modelle, dieselben Kategorien — aber sobald in der Aufgabenstellung „einmal nachts" statt „sofort" steht, kippt die richtige Antwort komplett. Der Eingang bestimmt die Architektur, nicht das Ziel.

### Pfeil 1 — Freitext an Lambda

Ein Aufruf, ein Ticket. Kein Puffer, keine Sammelfahrt.

Das ist eine Designentscheidung mit Preisschild, und sie ist hier richtig, weil verärgerte Kunden nicht bis zum nächsten Nachtlauf warten sollen. Bei einem Archiv-Import wäre sie falsch.

### Kasten — Lambda

Die Lambda ist Klammer, nicht Intelligenz. Sie ruft zwei APIs auf, wartet auf beide Antworten und schreibt ein Ergebnis. Kein Modell, kein Training, kein State.

Ehrlich dazugesagt: Sie ruft sie nacheinander auf oder parallel, und das ist deine Entscheidung. Nacheinander summieren sich die Latenzen, parallel nicht — bei zwei Aufrufen ist das der Unterschied zwischen „spürbar" und „egal".

Die zweite Ehrlichkeit betrifft das Scheitern. Zwei Aufrufe heißen zwei Fehlerquellen, und sie sind nicht gleich wichtig: Fällt die Klassifikation aus, kannst du das Ticket mit Stimmung und ohne Thema ablegen und später nachziehen. Fällt beides aus, hast du ein rohes Ticket in der Warteschlange. Beides ist überlebbar — aber nur, wenn du vorher entschieden hast, was ein Teilergebnis wert ist. Auf der Karte steht dazu nichts, und das ist eine bewusste Vereinfachung, keine Vollständigkeit.

### Pfeil 2 — Stimmung

`DetectSentiment` nutzt ein **vortrainiertes** Modell. Kein Endpoint, kein Modell-ARN, keine Trainingsdaten. Du zahlst pro Aufruf und sonst nichts.

Das Bild dazu: Du fragst jemanden auf der Straße nach der Uhrzeit. Du stellst dafür niemanden ein.

### Kasten — DetectSentiment

Zurück kommt genau eine von vier Kategorien: `POSITIVE`, `NEGATIVE`, `NEUTRAL` oder `MIXED` — mit Konfidenzwerten für alle vier.

`MIXED` ist dabei kein Verlegenheitswert. Es bedeutet, dass **beide** Stimmungen im Text belegbar vorkommen: „Der Support war super, aber das Produkt ist Schrott." Wer `MIXED` wie `NEUTRAL` behandelt, verliert genau die Tickets, bei denen ein Mensch hinschauen sollte.

Die Grenze steht in der Quota-Tabelle: **5 KB** pro Dokument für die Sentiment-Operationen. Ein langer Beschwerdebrief mit Log-Auszug reißt das.

### Pfeil 3 — Thema

Für firmeneigene Klassen gibt es kein vortrainiertes Modell. Du trainierst mit `CreateDocumentClassifier` und stellst mit `CreateEndpoint` bereit; erst dann kann `ClassifyDocument` überhaupt etwas tun.

Beide Schritte laufen **einmalig vorab**, nicht pro Ticket — deshalb stehen sie nicht auf der Karte. Auf der Rechnung stehen sie trotzdem.

### Kasten — ClassifyDocument

Der Endpoint wird in **Inference Units** dimensioniert. Eine IU liefert laut Quota-Tabelle einen Durchsatz von **100 Zeichen pro Sekunde**, alternativ zwei Dokumenten pro Sekunde; pro Endpoint sind bis zu 50 IU möglich, pro Region und Konto 200.

Rechne das einmal für dein Szenario durch: 100 Zeichen pro Sekunde sind bei einem 600-Zeichen-Ticket rund sechs Sekunden. Wer tausende Tickets am Tag in Spitzen erwartet, dimensioniert nicht eine IU, sondern zählt.

Und der Satz, der in der Prüfung zählt: **Der Endpoint kostet, solange er steht** — auch nachts, auch ohne Tickets.

### Pfeil 4 — NEGATIVE zuerst

Das Sentiment-Ergebnis läuft in die Ablage. Aus „wütender Kunde" wird damit ein Attribut, kein Gefühl — und Attribute kann man sortieren.

Beachte, was der Pfeil **nicht** tut: Er ruft niemanden an, er eskaliert nicht, er schreibt keine Mail. Die Karte endet bei der Ablage. Wer sich die Prioritätenliste anschaut, ist das Support-Tool, und das steht bewusst nicht im Bild.

### Pfeil 5 — Klasse und Score

Dasselbe für das Thema, mit einem Zusatz: Der zweite Pfeil trägt den Konfidenzwert der Klasse mit.

Der ist wichtiger, als er aussieht. Ein Custom Classifier vergibt **immer** eine Klasse — auch für ein Ticket, das in keine deiner Schubladen gehört. Er kennt kein „weiß nicht". Wenn du unterhalb einer selbst gewählten Schwelle nicht auf „unklassifiziert" umschaltest, landet jede Anfrage, an die beim Training niemand gedacht hat, mit voller Überzeugung in der falschen Gruppe.

### Kasten — Ticket-Ablage

DynamoDB hält das Ticket mit zwei zusätzlichen Attributen: Stimmung und Thema.

Und hier passiert das eigentlich Wichtige: **Die Priorisierung ist ab jetzt keine ML-Frage mehr, sondern eine Abfrage.** `NEGATIVE` zuerst, danach nach Thema an die richtige Gruppe. Ein Index auf Stimmung und Eingangszeit, mehr braucht die Sortierung nicht. Alles Schwierige ist vorher passiert.

### Kasten — Topic Modeling, verworfen

Der Dienst klingt nach „Themen erkennen" und tut das auch — nur im falschen Sinn. Er **entdeckt** Themen in einer Sammlung, statt Dokumente in **vorgegebene** Klassen einzusortieren.

Mach dir den Unterschied an der Ausgabe klar. Topic Modeling gibt dir zwei CSV-Dateien zurück, und darin steht so etwas wie „Thema 3: abbuchung, rechnung, doppelt, mahnung" mit Gewichten dahinter — plus eine Zuordnung, welches Dokument zu welchem Thema gehört. Nirgends steht das Wort „ABRECHNUNG". Wie das Thema heißt und ob es überhaupt eurer Schublade entspricht, entscheidest **du** beim Lesen der Wortliste. Für ein Ticketsystem, das automatisch an ein Team routen soll, ist das kein Ergebnis, sondern eine Hausaufgabe.

Dazu kommt der Status: Topic Modeling, Event Detection und Prompt Safety Classification sind seit dem **30.04.2026** für neue Kunden geschlossen. Konten mit Nutzung in den letzten zwölf Monaten behalten Zugriff. AWS nennt als Migrationsweg ausdrücklich Bedrock-LLMs für Topics und Events sowie Bedrock Guardrails für Prompt Safety.

## Die entscheidende Unterscheidung

Die Achse dieser Karte heißt: **Kennst du deine Kategorien schon?**

| | Topic Modeling | Custom Classification |
|---|---|---|
| Lernart | unüberwacht | überwacht |
| Du lieferst | eine Sammlung Dokumente | gelabelte Beispiele |
| Du bekommst | Wortgruppen mit Gewichten | genau deine Klassen |
| Ausgabe | `topic-terms.csv`, `doc-topics.csv` | Klasse plus Score |
| Betrieb | asynchroner Job | Endpoint oder Job |
| Status | für Neukunden zu | unverändert verfügbar |

Wer die Kategorien schon kennt, braucht nie Topic Modeling. Und wer sie noch nicht kennt, hat kein Sortierproblem, sondern ein Erkundungsproblem.

## Die ehrliche Feinheit

**Nur drei Features sind betroffen, nicht der Dienst.** Sentiment, Entities, Key Phrases, Language Detection, PII, Toxicity, Custom Classification und Custom Entity Recognition laufen unverändert weiter. „Comprehend ist abgekündigt" ist falsch und in einer Prüfungsantwort ein teurer Irrtum.

**Die Trainingsmengen stehen in der Doku, auch wenn Blogs anderes behaupten.** Für den CSV-Weg verlangt AWS im Multi-class-Modus mindestens **50 Trainingsdokumente je Klasse**; im Multi-label-Modus mindestens 10 je Klasse und mindestens 50 insgesamt. Über das Annotations-Format sind es je 10 pro Klasse. Die Klassenzahl ist gedeckelt: 2 bis 1.000 im Multi-class-, 2 bis 100 im Multi-label-Modus.

**Multi-class gegen Multi-label ist eine Trainingsentscheidung, keine API-Option.** Multi-class vergibt genau **eine** Klasse je Dokument. Ein Ticket, das eine Abrechnungsfrage *und* einen Bug enthält, verlangt Multi-label — und wenn du das erst nach dem Training merkst, trainierst du neu. Die Entscheidung fällt in dem Moment, in dem du die erste Trainingsdatei schreibst.

**Die Sprachunterstützung ist je Feature verschieden, und das trifft dich in genau diesem Szenario.** Sentiment beherrscht alle zwölf von Comprehend unterstützten Sprachen, deutsche Tickets eingeschlossen. Custom Classification als Plain-Text-Modell kann Deutsch, Englisch, Spanisch, Französisch, Italienisch und Portugiesisch — als **Native Document Model**, also für PDF, Word und Bilder, dagegen nur Englisch. Und die PII-Erkennung, die man bei Support-Tickets fast immer irgendwann braucht, gibt es nur für Englisch und Spanisch. Drei Features desselben Dienstes, drei verschiedene Sprachlisten. Wer „Comprehend kann Deutsch" als einen Satz merkt, baut irgendwann gegen eine Wand.

**Ein trainiertes Modell altert.** Eure Klassen bleiben, aber die Sprache eurer Kunden ändert sich: neues Produkt, neuer Preisplan, neue Fehlermeldung. Der Classifier von heute sortiert die Tickets von übermorgen schlechter, ohne dass irgendetwas kaputtgeht — er wird einfach leiser falsch. Comprehend hat dafür **Flywheels**, die Trainingsdatensätze und Modellversionen verwalten; die Quota-Seite führt sie mit eigenen Grenzen. Auf der Karte steht davon nichts, weil es nicht pro Ticket passiert. In einem Betriebsplan muss es stehen.

**Die drei Größengrenzen sind unterschiedlich, und das überrascht regelmäßig:** 5 KB für Sentiment, 10 KB für die synchrone Klassifikation von Text, **ein** Dokument pro synchronem Klassifikations-Request. Dieselbe Nachricht kann also für den einen Aufruf zu groß und für den anderen in Ordnung sein. Und `BatchDetectSentiment` nimmt bis zu **25 Dokumente** à 5 KB — das ist eine Aufrufoptimierung, kein asynchroner Job. Wer „Batch" liest und „nachts" denkt, verwechselt zwei verschiedene Dinge.

## Syntax lesen — die Trainingsdatei

Der Unterschied zwischen den beiden Modi ist eine einzige Datei, und man sieht ihn nur an einem Zeichen:

```
Multi-class, eine Klasse je Zeile:

ABRECHNUNG,"Die Rechnung vom 3. Mai ist doppelt abgebucht worden."
BUG,"Seit dem Update stürzt die App beim Export ab."
FEATURE,"Ein Dark Mode wäre großartig."

Multi-label, mehrere Klassen je Zeile, Pipe-getrennt:

ABRECHNUNG|BUG,"Doppelt abgebucht, und der Beleg-Download crasht."
```

Links die Klasse, rechts der Text, kein Header. Das Pipe-Zeichen ist der ganze Unterschied — und der Grund, warum eine für Multi-class gedachte Datei im Multi-label-Training klaglos durchläuft und ein Modell erzeugt, das nie zwei Klassen vergibt.

## Was du dadurch nicht baust

- kein eigenes Sentiment-Modell und keine Trainingsdaten dafür
- keine Wörterbücher, keine Stoppwortlisten, keine Regex-Regeln je Kategorie
- keinen Trainings-Cluster, keine GPU, keine Modellversionierung von Hand
- keine Priorisierungslogik in der Anwendung — sie ist eine Abfrage geworden
- keine ML-Rolle im Team

Übrig bleiben: eine Lambda mit zwei API-Aufrufen, ein trainierter Classifier, ein Endpoint mit einer laufenden Rechnung.

## Wenn du dir eine Sache merkst

**Topic Modeling entdeckt Themen, Custom Classification sortiert in vorgegebene Klassen ein — und Sentiment braucht überhaupt kein Modell.**

SageMaker für Stimmung ist Aufwand für etwas, das vortrainiert bereitliegt. Topic Modeling für feste Kategorien liefert Wortgruppen, wo Schubladen verlangt sind. Und ein Custom Classifier für Stimmung trainiert etwas, das AWS längst mitbringt.

## Prüfungsknackpunkte

**Signalwörter:** „our own predefined categories" und „custom categories specific to our business" schließen alles Vortrainierte aus. „No machine learning expertise" schließt SageMaker aus. „Route angry customers first" ist Sentiment. Stehen beide Signale in einer Aufgabe, ist die Antwort **beides zusammen** — und nicht eines von beiden.

**Warum Topic Modeling hier verliert:** Es bekommt keine Klassen vorgegeben und liefert Wortgruppen mit Gewichten. Selbst ohne den Neukunden-Stopp wäre es die falsche Antwort — die Verfügbarkeit ist nur der zweite Grund.

**Warum SageMaker hier verliert:** Ein eigenes Modell zu trainieren, wo `DetectSentiment` vortrainiert bereitsteht, widerspricht dem Signalwort „no ML expertise" direkt.

**Warum ein Custom Classifier für die Stimmung verliert:** Doppelte Arbeit für ein gelöstes Problem — der umgekehrte Fehler zum vorigen.

**Warum ein LLM auf Bedrock hier verliert — mit Einschränkung:** Ein Sprachmodell könnte beide Fragen in einem Aufruf beantworten, und AWS selbst nennt Bedrock als Migrationsweg für das eingestellte Topic Modeling. In einer SAA-C03-Frage mit den Signalwörtern „no ML expertise" und „predefined categories" ist der spezialisierte, verwaltete Dienst trotzdem die erwartete Antwort: Er liefert einen Score, ist auf genau diese Klassen trainiert und braucht kein Prompt-Design. Merk dir die Nuance — Bedrock ist der Nachfolger für *Topic Modeling*, nicht für Custom Classification.

**Warum `StartDocumentClassificationJob` hier verliert:** Der asynchrone Weg braucht keinen Endpoint und ist für nächtliche Stapel günstiger — aber die Aufgabe verlangt sofortige Verarbeitung eines einzeln eintreffenden Tickets. Dreht die Aufgabe das um („einmal nachts alle Tickets"), dreht sich auch die Antwort.
