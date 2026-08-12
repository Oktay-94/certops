---
cardNumber: 51
slug: kinesis-data-streams-sqs-replay-kirnau-clickstream-drei-konsumenten
title: "Kinesis Data Streams vs. SQS — Clickstream mit mehreren Konsumenten und Replay"
services:
  - "Amazon Kinesis Data Streams"
  - "Amazon SQS"
  - "AWS Lambda"
  - "Amazon S3"
domains:
  - "D3"
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/streams/latest/dev/enhanced-consumers.html"
  - "https://docs.aws.amazon.com/kinesis/latest/APIReference/API_RegisterStreamConsumer.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-kinesis-data-streams-ondemand-advantage"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-kinesis-data-streams-enhanced-fan-out-consumers"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-queue-parameters.html"
  - "https://aws.amazon.com/sqs/faqs/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, wie eine Nachricht in einem Haus ankommt.

**Erste Art: die Poststelle.** Ein Brief kommt an und landet im Fach. Der Kollege aus der Buchhaltung nimmt ihn mit. Jetzt ist das Fach leer. Wer den Brief auch gebraucht hätte — die Revision, das Controlling — bekommt ihn nicht. Und wenn die Buchhaltung ihn falsch abgeheftet hat und ihn noch einmal lesen will, ist er weg. Das ist SQS.

**Zweite Art: der Lesesaal.** Die Zeitung liegt aus. Drei Leute lesen sie gleichzeitig, jeder an seiner eigenen Seite, jeder mit einem eigenen Lesezeichen. Dass der eine auf Seite 4 ist, hindert den anderen nicht daran, auf Seite 1 zu sein. Und wer sich verlesen hat, blättert zurück. Nach einer festgelegten Frist wird der Jahrgang eingestampft — **nicht weil jemand gelesen hat, sondern weil die Zeit um ist.** Das ist Kinesis Data Streams.

Der Unterschied ist nicht Geschwindigkeit und nicht Durchsatz. Er ist: **Verbraucht das Lesen den Datensatz oder nicht.**

Kirnau, ein Online-Modehändler, hat genau die Konstellation, in der das entscheidet: Drei Teams brauchen dieselben Klick-Events gleichzeitig, und nach einem fehlerhaften Deployment muss eines davon drei Stunden noch einmal lesen.

## Was es eigentlich ist — der Shard Iterator

Der Stream ist nicht das interessante Objekt. Das interessante Objekt ist das Lesezeichen, und es gehört nicht dem Stream, sondern dem Konsumenten:

```json
{
  "StreamARN": "arn:aws:kinesis:eu-central-1:1234:stream/kirnau-clickstream",
  "ShardId": "shardId-000000000003",
  "ShardIteratorType": "AT_TIMESTAMP",
  "Timestamp": 1754812800
}
```

Das ist die vollständige Antwort auf die Aufgabe. `GetShardIterator` mit diesen vier Feldern gibt dir eine Position im Shard zurück, ab der du liest. Drei Konsumenten rufen es dreimal auf und bekommen drei unabhängige Positionen.

Und der Replay steckt in **einem** Feld: `AT_TIMESTAMP` plus ein Zeitstempel von vor drei Stunden. Kein neuer Stream, keine kopierten Daten, keine Wiedereinspielung. Ein anderes Lesezeichen.

## Der Weg durch die Karte

### Kasten — Shop-Frontend

Links steht der Erzeuger, und die Kursivzeile darunter ist die eigentliche Design-Entscheidung der ganzen Karte: `Partition Key = Session-ID`.

Kinesis garantiert Reihenfolge **je Partition Key**, nicht über den Stream. Alle Events einer Sitzung landen im selben Shard und werden in der Reihenfolge gelesen, in der sie passiert sind.

Warum das zählt, sagt der zweite Konsument: „erst Warenkorb gefüllt, dann Lieferadresse geändert" ist ein anderes Ereignis als die umgekehrte Reihenfolge. Wer als Partition Key etwas Zufälliges wählt — eine UUID etwa — verteilt die Sitzung gleichmäßig über alle Shards und verliert genau diese Aussage.

### Pfeil 1 — Klickstrom

Ein `PutRecord` je Klick, oder besser `PutRecords` im Bündel. Der Pfeil trägt keine Bedingung: Alles geht rein, ungefiltert.

Das unterscheidet die Quelle von einer Queue schon hier. Ein Producer schreibt in den Stream, ohne zu wissen oder festzulegen, wer liest.

### Kasten — Kinesis Data Streams

Die drei Zeilen im Kasten sind die Zeitachse: **24 Stunden Default**, bis 7 Tage mit extended retention, bis 365 Tage mit long-term retention.

Das Wort „Default" auf der Karte ist wichtig, und es ist bewusst gesetzt. Es sagt dir, dass diese Zahl eine Voreinstellung ist und keine Grenze — und zugleich, dass die drei Stunden aus dem Szenario **innerhalb** der Voreinstellung liegen. Der gezeigte Weg funktioniert also ohne jede Zusatzkonfiguration.

Die beiden Kursivzeilen sind die Zusammenfassung der ganzen Karte: „Records bleiben nach dem Lesen" und „Reihenfolge je Partition Key".

### Die Pfeile 2, 3 und 4 — und das Label „Enhanced Fan-out"

Drei Pfeile aus einem Kasten, ohne Verzweigungslogik dazwischen. Das ist keine Vereinfachung: Der Stream *verteilt* nicht, er *liegt aus*. Jeder Konsument holt sich, was er braucht.

Das Label daneben braucht eine Präzisierung, die nicht auf der Karte steht: **Enhanced Fan-out ist keine Voreinstellung.** Es ist eine Registrierung per `RegisterStreamConsumer`, mit eigener Gebühr je Konsument-Shard-Stunde und je abgerufenem Gigabyte.

Ohne EFO teilen sich alle Leser die 2 MB/s Lesedurchsatz je Shard. Bei Kirnaus drei Konsumenten sind das rechnerisch rund 667 KB/s pro Team — und beim Replay liest einer davon in voller Fahrt, während die anderen live arbeiten sollen. **Mit** EFO bekommt jeder registrierte Konsument eigene 2 MB/s je Shard, per HTTP/2 gepusht statt gepollt.

Wie viele Konsumenten registriert werden dürfen, hängt seit November 2025 vom Kapazitätsmodus ab: 50 je Stream bei On-demand Advantage, 20 bei On-demand Standard und Provisioned. Beide Zahlen sind richtig, und die Dokumentation führt sie sauber getrennt — das ist die Sorte Zahl, bei der eine Prüfungsfrage ohne Modusangabe unbeantwortbar wäre.

### Kasten — Personalisierung

Der erste Konsument liest live und antwortet dem Kunden im Millisekundenbereich. Er persistiert nichts. Sein Zustand ist der Iterator und sonst nichts.

Genau deshalb ist er auch der Konsument, den ein fehlerhaftes Deployment am härtesten trifft: Er hat keine Kopie, aus der er sich reparieren könnte. Er hat nur den Stream.

### Kasten — Betrugserkennung

Der zweite Konsument liest **denselben** Shard, zur selben Zeit, ohne dass das Lesen der Personalisierung ihn beeinflusst. Kein Lock, keine Sichtbarkeitssperre, keine Konkurrenz um die Datensätze.

Er ist der Grund für die Partition-Key-Entscheidung ganz links. Sitzungsmuster sind Reihenfolgen; ohne garantierte Ordnung je Sitzung sieht er dieselben Events in beliebiger Folge und findet nichts.

### Kasten — BI-Konsument

Der dritte liest im Batch, nachts, und ist der einzige, der den Stream verlässt.

Die Kursivzeile sagt „Nachtladung", nicht „Echtzeit" — er darf hinterherhängen. Solange er innerhalb der Retention liest, ist das kein Problem, sondern der Normalfall. **Das ist die eigentliche Freiheit eines Streams: Konsumenten dürfen unterschiedlich schnell sein.**

### Der gestrichelte Zonenrahmen — KONSUMENTEN

Der graue Rahmen trägt keine Semantik über einen Dienst. Er sagt nur: Diese drei stehen nebeneinander, nicht hintereinander.

Zeichnerisch ist er der wichtigste Strich der Karte. Ohne ihn liest man die drei Kästen als Kette — erst Personalisierung, dann Betrugserkennung, dann BI. Genau diese Fehllesart ist das SQS-Denken, das die Karte widerlegen will.

### Pfeil 5 und der Kasten S3 Data Lake

Der einzige grüne Pfeil, und der einzige, der den Stream verlässt. Von dort arbeiten Athena und Glue weiter (Karte 52).

Eine Genauigkeit, die die Karte offenlässt: Das Label sagt „Parquet-Ablage", der Kasten sagt „Rohdaten-Ablage". Beides stimmt, wenn man „roh" als *unaggregiert* liest — jedes Event einzeln, nichts verdichtet. Parquet ist dabei nur das Speicherformat, in dem diese einzelnen Events landen. **Roh heißt hier nicht unverarbeitet, sondern unzusammengefasst.** Die Umwandlung nach Parquet macht der BI-Konsument selbst; ein Data Stream kann das nicht, und wer sie geschenkt haben will, landet bei Firehose — und verliert damit den Replay.

### Pfeil 6 — Replay ab Zeitpunkt

Der gestrichelte Pfeil zeigt vom Konsumenten zurück auf den Stream, und **er stellt keinen Datenfluss dar.** Es fließt nichts vom Konsumenten zum Stream. Der Konsument setzt seinen Iterator zurück und liest erneut. Der Pfeil zeigt die Absicht, nicht die Richtung — deshalb gestrichelt.

Was dabei *nicht* passiert, ist der Punkt: Nichts wurde neu geschrieben. Niemand musste die Events vorsorglich aufheben. Kein anderer Konsument merkt etwas davon.

Und eine Falle, die von hier aus nicht sichtbar ist: **Eine Erhöhung der Retention wirkt nur nach vorn.** Wer von 24 auf 168 Stunden hochsetzt, erreicht damit keine Daten, die bereits älter als 24 Stunden sind. Wer sie senkt, verliert die überzähligen Records fast sofort.

### Der verworfene Weg — die SQS-Queue

Der rote Kasten sagt präzise: „Nachricht nach Delete weg". Nicht *nach dem Lesen* — nach dem Delete.

Eine empfangene Nachricht bleibt zunächst in der Queue und wird nur für andere Konsumenten unsichtbar; entfernt wird sie erst durch `DeleteMessage` oder durch das automatische Löschen, das manche SDKs nach erfolgreicher Verarbeitung übernehmen. Für die Frage dieser Karte ändert das nichts: Sobald sie gelöscht ist, ist sie für **alle** weg — und ein zweiter Leser, der sie nie bekommen hat, kann sie auch nicht zurückholen.

### Das rote X — warum auch SNS-Fan-out nicht reicht

Der naheliegende Rettungsversuch heißt: ein SNS-Topic davor, drei Queues dahinter. Und er löst tatsächlich ein Problem — nur nicht dieses.

Drei Queues geben drei Konsumenten ihre eigene Kopie. Fan-out gelöst. Aber sobald eine Nachricht in ihrer Queue gelöscht ist, ist sie dort weg, und der Personalisierungs-Konsument, der nach dem fehlerhaften Deployment drei Stunden neu lesen will, steht mit leeren Händen da. **Fan-out ist nicht Replay.**

## Die entscheidende Unterscheidung

| | SQS | Kinesis Data Streams |
|---|---|---|
| Wer entfernt den Datensatz | der Konsument per `DeleteMessage` | die Retention, sonst niemand |
| Retention-Default | 4 Tage | 24 Stunden |
| Retention-Spanne | 1 Minute bis 14 Tage | bis 365 Tage |
| Zweiter unabhängiger Leser | nein, braucht zweite Queue | ja, eigener Iterator |
| Erneut lesen | nicht möglich | ja, innerhalb der Retention |
| Reihenfolge | FIFO-Queue je Message Group | je Partition Key |

Lies die zweite und dritte Zeile zweimal. **Per Voreinstellung hält SQS eine Nachricht viermal länger als Kinesis einen Record.** Wer den Unterschied als „SQS ist kurzlebig, Kinesis ist langlebig" merkt, merkt ihn falsch.

Beide haben eine Zeitachse. Nur bei SQS gibt es zusätzlich einen zweiten Weg hinaus — und den nimmt jeder gesunde Konsument sofort.

## Die ehrliche Feinheit

**Der Merksatz auf der Karte verkürzt, und du solltest wissen, wo.** „SQS löscht nach Konsum" ist als Kontrast zu „Kinesis behält nach Zeit" richtig gedacht, aber technisch zweifach ungenau: Nicht der Konsum löscht, sondern der Delete. Und SQS löscht auch ohne jeden Konsum, sobald die Retention abläuft.

Für diese Karte trägt die Verkürzung — hier geht es darum, ob ein zweiter Leser dieselben Records bekommt, und das tut er bei SQS in keinem Fall. Für Karte 89 (Idempotenz und Retry) ist sie die falsche mentale Karte: Wer glaubt, der Konsum lösche automatisch, versteht nicht, warum dieselbe Nachricht nach Ablauf des Visibility Timeout ein zweites Mal ankommt.

**Zweitens: Shards sind auf der Karte nicht gezeichnet.** Der Stream erscheint als ein Kasten. In Wirklichkeit besteht er aus Shards, und sowohl der geteilte Durchsatz als auch Enhanced Fan-out rechnen **je Shard**. Die Karte zeigt das Konsummodell, nicht die Kapazitätsstruktur.

**Drittens: Es gibt seit dem 4. November 2025 einen dritten Kapazitätsmodus.** On-demand Advantage ist eine Einstellung auf Kontoebene, die für alle On-demand-Streams einer Region gilt. Sie erlaubt das Vorwärmen von Schreibkapazität und entfernt die feste Gebühr je Stream. AWS nennt als eines von drei Eignungskriterien ausdrücklich „Fan-out auf mehr als zwei Konsumenten-Anwendungen" — Kirnau hat drei. Kursmaterial von vor Ende 2025 stellt die Wahl noch als Zweierentscheidung dar. Auf der Karte steht der Modus nicht, weil er den gezeigten Weg nicht ändert.

**Viertens:** Die drei Konsumenten sind als fachliche Rollen gezeichnet, nicht als Laufzeitumgebung. Ob dahinter Lambda, die KCL auf EC2 oder Managed Service for Apache Flink steckt, ist für die Abgrenzung zu SQS ohne Belang.

## Syntax lesen — die Iterator-Typen

Die fünf Werte von `ShardIteratorType` sind die ganze Replay-Mechanik, und drei davon werden regelmäßig verwechselt:

```
TRIM_HORIZON        ältester noch vorhandener Record im Shard
AT_TIMESTAMP        ab einem Zeitpunkt   (braucht Timestamp)
LATEST              nur, was ab jetzt neu ankommt
AT_SEQUENCE_NUMBER  genau dieser Record  (braucht SequenceNumber)
AFTER_SEQUENCE_NUMBER   der nächste danach
```

`LATEST` ist der Normalfall im Betrieb und die falsche Wahl beim Wiederanlauf: Ein Konsument, der nach einem Absturz mit `LATEST` startet, überspringt stillschweigend alles, was während des Ausfalls geschrieben wurde.

`TRIM_HORIZON` heißt nicht „ab Streambeginn", sondern „ab dem ältesten, der noch da ist" — die Grenze wandert mit der Retention mit.

`AT_TIMESTAMP` ist der Typ, der auf dieser Karte gebraucht wird. Er ist auch der einzige, für den du keine Kenntnis über den Stream brauchst: kein Sequence Number, kein Checkpoint, nur eine Uhrzeit.

## Was du dadurch nicht baust

- keine zweite, dritte, vierte Queue je Konsument
- kein SNS-Topic davor, das die Kopien verteilt
- keinen Zwischenspeicher, in dem Events „für den Fall der Fälle" liegen
- keine Koordination zwischen den drei Teams darüber, wer wann gelesen hat
- keine Wiedereinspielung aus einem Backup nach dem fehlerhaften Deployment
- **keine garantierte Gesamtreihenfolge über den Stream** — nur je Partition Key
- **kein Exactly-once** — auch hier kann ein Record mehrfach verarbeitet werden

Übrig bleiben: ein Stream, ein Partition Key und drei Iteratoren.

## Wenn du dir eine Sache merkst

**Bei SQS verbraucht das Lesen den Datensatz, bei Kinesis nicht.**

Wer „replay", „reprocess", „mehrere Konsumenten lesen dieselben Records" oder „jedes Team braucht seine eigene Kopie" liest, ist bei Kinesis — nicht bei SQS, und auch nicht bei SQS mit einem SNS-Topic davor.

## Prüfungsknackpunkte

**Signalwörter:** „multiple consumers must process the same records", „replay the last N hours", „reprocess events after a faulty deployment", „ordered per session". Die ersten drei zeigen auf Kinesis, das vierte auf den Partition Key.

**Warum SQS hier verliert:** Eine gelöschte Nachricht ist für alle weg. Drei unabhängige Leser bräuchten drei Queues, und selbst dann gäbe es kein Replay.

**Warum SNS + drei Queues hier verliert:** Löst Fan-out, nicht Replay. Nach dem Delete ist die Kopie in jeder Queue ebenso weg.

**Warum Firehose (Karte 52) hier verliert:** Data Streams ist ein Puffer, aus dem Konsumenten **holen**. Firehose **liefert** selbstständig ab und kennt kein Replay durch Dritte. Beide sind stapelbar — Firehose kann einen Data Stream als Quelle haben — aber nicht austauschbar.

**Warum MSK (Karte 55) hier nicht gewinnt, obwohl es könnte:** Kafka behält Records ebenfalls nach Zeit und erlaubt unabhängige Consumer Groups. Der Unterschied ist nicht fachlich, sondern operativ. MSK ist die Antwort, wenn **bestehender Kafka-Code** weiterlaufen soll. Ein Greenfield-Projekt ohne Kafka-Bindung nimmt Kinesis.

**Warum Karte 7 (SQS + Lambda + DLQ) trotzdem richtig ist:** Dort soll jede Bestellung **genau einmal** von **einem** Verarbeiter bearbeitet und eine Lastspitze gepuffert werden. Hier müssen dieselben Events von **mehreren** gelesen werden. Die Frage ist nie „welcher Dienst ist besser", sondern „wie viele lesen dasselbe".

**Die Retention-Falle:** Eine Erhöhung wirkt nur nach vorn. Bereits abgelaufene Records kommen nicht zurück.

**Die Fan-out-Falle:** Enhanced Fan-out ist eine kostenpflichtige Registrierung, keine Voreinstellung. Eine Antwort, die drei Konsumenten selbstverständlich je 2 MB/s je Shard zuschreibt, unterstellt eine Konfiguration, die erst gemacht werden muss.
