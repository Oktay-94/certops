---
cardNumber: 59
slug: flink-sliding-window-betrugsmuster
title: "Betrugsmuster im Zahlungsstrom mit gleitenden Fenstern in Managed Service for Apache Flink"
services: ["Amazon Managed Service for Apache Flink", "Amazon Kinesis Data Streams", "Amazon SNS", "Amazon S3"]
domains: ["D1", "D3"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/kinesisanalytics/latest/dev/discontinuation.html"
  - "https://aws.amazon.com/about-aws/whats-new/2023/08/amazon-managed-service-apache-flink"
  - "https://docs.aws.amazon.com/managed-flink/latest/apiv2/API_CheckpointConfiguration.html"
  - "https://docs.aws.amazon.com/managed-flink/latest/java/how-resources.html"
  - "https://docs.aws.amazon.com/managed-flink/latest/java/how-pricing.html"
  - "https://docs.aws.amazon.com/managed-flink/latest/java/earlier.html"
  - "https://docs.aws.amazon.com/managed-flink/latest/java/troubleshooting-checkpoints.html"
  - "https://docs.aws.amazon.com/streams/latest/dev/kinesis-extended-retention.html"
  - "https://aws.amazon.com/managed-service-apache-flink/faqs/"
  - "https://nightlies.apache.org/flink/flink-docs-master/docs/dev/datastream/operators/windows/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, zu schnelles Fahren zu erwischen.

**Weg eins:** Ein Blitzer am Mast. Er misst einen einzigen Moment an einem einzigen Punkt. Wer die Stelle kennt, bremst zwei Sekunden vorher, wird brav mit 48 km/h gemessen und gibt danach wieder Gas. Der Blitzer hat kein Gedächtnis. Er weiß nicht, was hundert Meter vorher war, und er weiß nicht, was das Auto morgen tut. Jede Messung steht für sich.

**Weg zwei:** Die Abschnittskontrolle. Zwei Punkte, dazwischen elf Kilometer. Gemessen wird nicht ein Moment, sondern die Zeit dazwischen. Diese Anlage lässt sich nicht durch einen einzelnen unauffälligen Augenblick täuschen, weil sie gar nicht auf Augenblicke schaut.

Flink ist die Abschnittskontrolle für Datenströme.

Und damit ist der Kern der Aufgabe erklärt: „mehr als fünf Transaktionen in einem beliebigen Fünf-Minuten-Zeitraum". Jede einzelne Kartenzahlung über 40 € ist unauffällig. Auffällig ist erst ihre Häufung — und eine Häufung ist keine Eigenschaft eines Ereignisses, sondern eines Zeitraums. **Wer über Zeiträume rechnen muss, braucht etwas, das sich Ereignisse merkt.** Genau das ist der Unterschied zwischen einem Stream-Prozessor und allem, was auf der Karte links davon steht.

## Was es eigentlich ist — eine Anwendung, kein Cluster

Du gibst AWS nicht Maschinen an, sondern eine Anwendung und zwei Zahlen. Ausschnitt aus der Konfiguration, wie sie die API entgegennimmt:

```json
{
  "ApplicationName": "fraud-pattern-eu",
  "RuntimeEnvironment": "FLINK-1_20",
  "ApplicationConfiguration": {
    "FlinkApplicationConfiguration": {
      "CheckpointConfiguration": { "ConfigurationType": "DEFAULT" },
      "ParallelismConfiguration": {
        "ConfigurationType": "CUSTOM",
        "Parallelism": 4,
        "ParallelismPerKPU": 1,
        "AutoScalingEnabled": true
      }
    }
  }
}
```

Lies das von unten nach oben. `Parallelism` geteilt durch `ParallelismPerKPU` ergibt die Zahl der **KPU** — Kinesis Processing Units. Eine KPU ist 1 vCPU, 4 GB Arbeitsspeicher und 50 GB laufender Anwendungsspeicher, in dem der Zustand und die Checkpoints liegen. Für die Orchestrierung berechnet AWS **eine zusätzliche KPU je Anwendung**, abgerechnet wird sekundengenau.

`ConfigurationType: DEFAULT` beim Checkpointing ist keine Leerstelle, sondern drei konkrete Werte: Checkpointing **an**, Intervall **60.000 ms**, Mindestpause zwischen zwei Checkpoints **5.000 ms**. Wer `CUSTOM` setzt, darf diese Werte ändern; wer `DEFAULT` stehen lässt, bekommt sie auch dann, wenn im Anwendungscode etwas anderes steht.

Das ist die ganze Infrastrukturentscheidung. Keine Instanztypen, kein JobManager, keine ZooKeeper-Ensembles.

## Der Weg durch die Karte

### Badge 1 — schreibt: die Terminals kennen nur den Stream

Ein Terminal in Lissabon zieht Karte `4539 ****  8812` um 14:03:07 Ortszeit über 62,40 €. Es schreibt einen Datensatz in den Stream und ist fertig. Es weiß nichts über Betrugsregeln, nichts über Fenster, nichts über andere Terminals.

Das ist der Grund für den gestrichelten Rand auf der Karte: Die Terminals stehen außerhalb von AWS. Sie sind Produzenten, sonst nichts.

### Der Kasten Kinesis Streams — Transport mit Haltbarkeitsdatum

Kinesis Data Streams **bewegt und puffert**. Es rechnet nichts. Der Stream ist eine nach Ankunftszeit geordnete Folge von Datensätzen, aufgeteilt in Shards; **innerhalb** eines Shards bleibt die Reihenfolge erhalten, **zwischen** Shards gibt es keine Ordnung.

Standardmäßig sind die Datensätze **24 Stunden** lang lesbar. Das lässt sich auf sieben Tage und weiter bis auf **365 Tage (8.760 Stunden)** anheben. Deshalb steht „Replay möglich" auf der Karte: Wenn deine Flink-Anwendung zwei Stunden lang fehlerhaft rechnet, kannst du sie zurücksetzen und dieselben Ereignisse noch einmal durchlaufen lassen — solange sie im Aufbewahrungszeitraum liegen.

Das Bild dazu: Der Stream ist ein Förderband mit einem Auffangkorb am Ende, der 24 Stunden hält. Was rechnet, steht neben dem Band, nicht darauf.

### Badge 2 — liest: hier beginnt das Gedächtnis

Die Flink-Anwendung liest den Stream als Quelle. Vor diesem Pfeil gilt „ein Datensatz nach dem anderen"; hinter ihm gibt es Zustand, der einen Absturz überlebt.

Der Zustand liegt in **RocksDB** auf der lokalen Platte der KPU, und bei jedem Checkpoint wandert er zusätzlich nach S3. Fällt die Platte aus, wird aus dem Checkpoint wiederhergestellt — das ist die technische Grundlage der Exactly-once-Semantik, die auf der Karte nur als Stichwort steht.

### Der Kasten Watermarks — Ereigniszeit statt Ankunftszeit

Die Transaktion aus Lissabon geht um 14:03:07 über den Tresen und trifft wegen einer Netzverzögerung erst um 14:03:52 ein. Welche Zeit zählt?

**Ereigniszeit ist die Zeit auf dem Beleg, Verarbeitungszeit die Zeit auf der Uhr des Rechners.** Nur die erste ist eine Eigenschaft der Transaktion; die zweite hängt von Netzwerk und Auslastung ab und ändert sich, wenn du dieselben Daten morgen noch einmal einliest.

Ein Watermark ist die Behauptung: „Alles, was vor 14:03:00 passiert ist, dürfte jetzt da sein." Diese Behauptung löst die Fensterberechnung aus. Sie ist eine Schätzung, kein Beweis — und was daraus folgt, steht weiter unten in der ehrlichen Feinheit.

### Badge 3 — sortiert: keyBy(Kartennummer)

`keyBy` teilt den einen Strom in so viele logische Ströme auf, wie es Kartennummern gibt. Jede Karte bekommt ihren eigenen Zustand, und die Verarbeitung läuft trotzdem parallel über die KPU verteilt.

Das Bild dazu: eine Postsortieranlage mit einem Fach je Kunde. Alle Fächer werden gleichzeitig befüllt, aber kein Brief landet im falschen Fach. Ohne diesen Schritt würden die Transaktionen aller Karten in einen Topf fallen und die Regel „fünf pro Karte" wäre nicht formulierbar.

### Badge 4 — gruppiert: das Sliding Window

Hier sitzt der Kern der Karte. Ein Sliding Window hat **zwei** Zeitangaben: eine Größe und einen Versatz. Größe fünf Minuten, Versatz eine Minute heißt: Jede Minute entsteht ein neues Fenster, das die letzten fünf Minuten umfasst. Die Fenster überlappen, und **jedes Ereignis liegt in fünf Fenstern gleichzeitig**.

Genau das verlangt die Formulierung „in einem beliebigen Fünf-Minuten-Zeitraum". Ein festes Fenster von 14:00 bis 14:05 prüft nicht den Zeitraum von 14:03 bis 14:08.

### Badge 7 — speist: vom Fenster in die Mustererkennung

Die Länderregel ist keine Zählung, sondern eine Folge: erst Lissabon, dann zehn Minuten später Manila. Dafür braucht es keinen Fensteraggregat-Wert, sondern gemerkten Zustand je Karte — das zuletzt gesehene Land und wann es gesehen wurde.

Eine Lambda-Funktion kann das nicht leisten. Sie sieht ein Ereignis oder einen Stapel und hat danach kein Gedächtnis; jeden Zustand müsste sie in DynamoDB auslagern, inklusive selbst gebauter Konsistenz- und Ablauflogik. **Das ist die Arbeit, die Flink dir abnimmt.**

### Der Kasten Mustererkennung — was „zustandsbehaftet" konkret heißt

Zwei Regeln stehen auf dieser Karte, und sie sind technisch nicht dasselbe.

Die Zählregel ist ein **Aggregat über ein Fenster**: Nimm alle Ereignisse in diesem Zeitraum, zähle sie, vergleiche mit fünf. Das Fenster endet, das Ergebnis steht, der Zustand wird verworfen.

Die Länderregel ist ein **Muster über eine Folge**: Sie hat kein natürliches Ende. Der Zustand „zuletzt Portugal, gesehen um 14:03" muss so lange leben, bis er entweder durch ein neues Land ersetzt wird oder alt genug ist, um zu verfallen. Wer diesen Zustand nicht aktiv ablaufen lässt, sammelt für jede jemals gesehene Kartennummer einen Eintrag — bei einem Zahlungsdienstleister ist das die Speichergrenze, an die man zuerst stößt.

Auf der Karte stehen beide Regeln nebeneinander, weil Prüfungsfragen beide Formen bringen. Die Antwort ist in beiden Fällen dieselbe, aber aus zwei verschiedenen Gründen.

### Badge 5 — Treffer: SNS

Schlägt eine Regel an, geht sofort eine Nachricht an SNS und von dort an die Betrugsabwehr. **Nur bei Treffern** — SNS steht hier für den Ausnahmefall, nicht für den Normalbetrieb.

Warum überhaupt ein eigener Dienst dafür? Weil ein Alarm mehrere Empfänger hat: das Sperrsystem, eine Warteschlange für die manuelle Prüfung, vielleicht eine SMS an den Karteninhaber. Flink schreibt einmal, SNS verteilt. Ein Alarm, der erst im Nachtlauf entsteht, ist bei einer laufenden Kartenserie ohnehin wertlos.

### Badge 6 — alles: S3

Unabhängig davon landen **alle** Ereignisse in S3 — auch die unauffälligen. Die Revision muss später beantworten können, warum ein Alarm ausgelöst wurde **und warum ein anderer nicht**. Ein System, das nur Treffer speichert, kann seine eigenen Fehlentscheidungen nicht mehr nachweisen; genau danach fragt aber jede Prüfung eines Falschnegativs.

Ausgewertet wird das später per Athena über die Dateien im Data Lake. Das ist der Punkt, an dem die Betrugsabwehr die Streaming-Welt verlässt und in die Analyse-Welt der Karte 60 übergeht.

## Die entscheidende Unterscheidung

Drei Fenstertypen, und die Prüfung fragt nach genau einem davon:

| | Tumbling | Sliding | Session |
|---|---|---|---|
| Größe | fest | fest | offen |
| Überlappung | nein | ja | nein |
| Ein Ereignis liegt in | genau einem Fenster | mehreren Fenstern | genau einem Fenster |
| Ende durch | Zeitablauf | Zeitablauf | Lücke ohne Ereignisse |
| Signalwort | „every five minutes" | „in any five-minute period", „evaluated every minute" | „user session", „inactivity" |

## Die ehrliche Feinheit

**Allowed Lateness steht auf null, und das ist lauter, als es klingt.** Die Flink-Dokumentation ist eindeutig: Elemente, die hinter dem Watermark eintreffen, werden per Voreinstellung **verworfen**. Kein Fehler, keine Meldung, kein Eintrag. Die Transaktion fehlt einfach in der Auswertung.

Für eine Betrugsregel ist das die gefährlichste Voreinstellung des ganzen Aufbaus: Wer die dritte von fünf Transaktionen verliert, löst keinen Alarm aus und merkt nichts davon. `allowedLateness` verlängert die Lebensdauer eines Fensters über sein Ende hinaus; sehr späte Ereignisse lassen sich zusätzlich über einen Side Output auffangen, statt sie stumm fallen zu lassen. Der Preis: Fenster halten länger Zustand, und ein spätes Ereignis lässt ein Fenster ein zweites Mal feuern — dein Ziel bekommt also ein korrigiertes Ergebnis für einen Zeitraum, den es schon gesehen hat.

**Zweitens ist der Pfeil nach S3 auf der Karte eine Abkürzung.** Real läuft die vollständige Archivierung meist über Amazon Data Firehose direkt aus dem Stream, nicht durch die Flink-Anwendung. Auf der Karte ist es ein Pfeil aus dem Flink-Block, um eine Box zu sparen. Fachlich unscharf, bewusst so gezeichnet, hier benannt.

**Drittens ist „managed" nicht „wartungsfrei".** AWS hat den Support für die Flink-Versionen 1.6, 1.8 und 1.11 im Juli 2025 beendet und für 1.13 im Oktober 2025 — betroffene Anwendungen ließen sich danach nicht mehr starten. Version 1.20 ist die letzte 1.x-Version und als Long-Term-Support-Version gekennzeichnet. Der Dienst nimmt dir den Cluster ab, nicht den Versionswechsel.

## Syntax lesen — `SlidingEventTimeWindows.of(...)`

Zwei Argumente, und ihre Reihenfolge entscheidet über die Aussage der Regel:

```
SlidingEventTimeWindows.of( Time.minutes(5) , Time.minutes(1) )
                                  |                  |
                                  |                  +- Versatz (slide)
                                  |                     alle 60 s ein neues Fenster
                                  +- Größe (size)
                                     jedes Fenster deckt 5 Minuten ab
```

Größe geteilt durch Versatz ergibt die Zahl der Fenster, in denen ein einzelnes Ereignis gleichzeitig liegt: fünf. Setzt du beide Werte gleich, hast du kein Sliding Window mehr, sondern ein Tumbling Window — dasselbe Objekt, dieselbe Zeile, völlig andere Regel.

Merkhilfe: **Die Größe beantwortet „worüber?", der Versatz beantwortet „wie oft?".** Die Aufgabe nennt beide Werte getrennt („über die letzten fünf Minuten, geprüft jede Minute"), und wer nur einen davon liest, wählt in der Prüfung Tumbling.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** vorkommt:

- kein Flink-Cluster, kein JobManager, kein TaskManager, den jemand betreibt
- keine eigene Zustandsdatenbank für „letztes Land je Karte"
- kein selbst geschriebener Checkpoint-Mechanismus und keine Wiederanlauflogik
- keine Sortierung der Ereignisse im Anwendungscode
- kein Zeitplan, der eine Auswertung anstößt — der Strom stößt sie an
- keine SQL-Anwendung in Kinesis Data Analytics, denn die gibt es nicht mehr

Übrig bleibt eine Anwendung, zwei Zahlen für die Parallelität und die eigentliche Regel.

## Wenn du dir eine Sache merkst

**Sobald über mehrere Ereignisse hinweg gerechnet werden muss — ein Fensteraggregat oder ein Muster —, ist die Antwort Managed Service for Apache Flink. Kinesis und MSK transportieren nur.**

Kinesis Data Streams puffert und liefert aus, ohne zu rechnen. Firehose kann jeden Datensatz einzeln umformen, aber nichts über mehrere zusammenzählen. Lambda sieht ein Ereignis und vergisst es wieder.

## Prüfungsknackpunkte

**Signalwörter:** „sliding window", „in any five-minute period", „detect patterns across multiple events", „events arrive out of order", „exactly-once", „stateful stream processing". Zwei oder mehr davon zusammen sind immer Flink.

**Die Tumbling-Falle.** Die gefährlichste Antwortoption dieser Karte, weil sie fachlich existiert und plausibel klingt. Verteilt jemand seine Transaktionen über eine feste Fenstergrenze, liegen in keinem einzelnen Fenster mehr als fünf — der Alarm bleibt aus. Steht „evaluated every minute" neben einer Fenstergröße von fünf Minuten, sind zwei verschiedene Zahlen genannt, und zwei Zahlen bedeuten Überlappung.

**Die Namensfalle.** Der Dienst heißt seit dem **30.08.2023** Amazon Managed Service for Apache Flink; vorher hieß er Amazon Kinesis Data Analytics. Endpunkte, APIs, IAM-Aktionen und CloudWatch-Metriken blieben unverändert — nur der Name wechselte. Taucht „Kinesis Data Analytics" in einer Antwortoption auf, ist entweder der alte Name gemeint oder es ist die nächste Falle.

**Warum Kinesis Data Analytics for SQL hier verliert:** Der Dienst ist abgeschaltet. AWS hat ihn über fünfzehn Monate zurückgebaut — ab 01.09.2025 keine Bugfixes, ab 15.10.2025 keine neuen Anwendungen, ab **27.01.2026 werden verbliebene Kundenanwendungen gelöscht** und lassen sich weder starten noch betreiben. Kursmaterial bis etwa 2023 zeigt ihn prominent als den einfachen SQL-Weg. Diese Option existiert nicht mehr; der SQL-Zugang lebt in Flink und Flink Studio weiter.

**Warum Lambda hier verliert:** Es verarbeitet je Ereignis oder je Stapel, ohne dauerhaften Zustand über die Aufrufe hinweg. Regeln der Form „X-mal innerhalb von Y Minuten" oder „erst A, dann B" sind damit allein nicht sauber umsetzbar.

**Warum Amazon Data Firehose hier verliert:** Es kann pro Datensatz transformieren, aber kein Aggregat über ein Zeitfenster bilden. Firehose ist der Weg **nach** S3, nicht der Weg zur Regel.

**Warum MSK hier verliert:** MSK ist Transport, genau wie Kinesis — nur mit Kafka-API. Fragt das Szenario nach „Kafka-kompatibel betreiben", ist es MSK; fragt es nach Fenstern oder Mustern, ist es Flink darüber.

**Warum Redshift oder Athena hier verlieren:** Beide beantworten Fragen über **gespeicherte** Daten. Flink beantwortet Fragen über **fließende** Daten, bevor sie gespeichert sind. Steht „in real time" oder „as transactions occur" im Text, ist jede Warehouse-Antwort falsch.
