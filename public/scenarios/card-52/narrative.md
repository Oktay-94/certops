---
cardNumber: 52
slug: firehose-s3-athena-logistik-datalake
title: "Amazon Data Firehose · S3 · Athena — Logs ohne Code in den Data Lake"
services: ["Amazon Data Firehose", "Amazon S3", "Amazon Athena", "AWS Glue Data Catalog", "AWS Lambda"]
domains: ["D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/firehose/latest/dev/buffering.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/dynamic-partitioning-enable.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/dynamic-partitioning-partitioning-keys.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/dynamic-partitioning-s3bucketprefix.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/enable-record-format-conversion.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/create-destination.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/create-configure-backup.html"
  - "https://docs.aws.amazon.com/firehose/latest/APIReference/API_DataFormatConversionConfiguration.html"
  - "https://docs.aws.amazon.com/firehose/latest/APIReference/API_BufferingHints.html"
  - "https://aws.amazon.com/firehose/faqs/"
  - "https://aws.amazon.com/about-aws/whats-new/2021/11/amazon-athena-queries-aws-glue-data-catalog-partition-indexes"
---

## Die Grundidee zuerst

Stell dir ein Firmenarchiv im Keller vor, in das jeden Tag zwei Kisten Papier gestellt werden.

**Die alte Ordnung:** Alles kommt in denselben Raum, ungeordnet, in Kartons ohne Aufschrift. Wenn jemand fragt „welche Sendungen sind am 3. März in Nordrhein-Westfalen gescheitert?", geht der Archivar in den Raum und liest **jedes Blatt**. Er findet die Antwort. Er braucht dafür drei Tage, und er hat 99,8 % der Blätter angefasst, die ihn nicht interessierten.

**Die neue Ordnung:** Beim Einstellen wird jedes Blatt sortiert — ein Regal je Region, ein Fach je Tag. Und die Blätter selbst werden umgeheftet: nicht mehr Vorgang für Vorgang, sondern **spaltenweise**, alle Empfängernamen in einem Heft, alle Fehlercodes in einem anderen. Jetzt geht der Archivar zu einem Fach und schlägt ein Heft auf.

Beides ist dasselbe Archiv mit denselben Daten. Der Unterschied liegt nicht im Suchen, sondern im **Einstellen**.

Genau das macht diese Karte. Firehose ist nicht der Archivar — Firehose ist der Mitarbeiter an der Kellertür, der beim Einstellen sortiert. Und weil er beim Einstellen sortiert, kostet jede spätere Frage einen Bruchteil.

Der zweite Teil der Idee steckt in dem, was **nicht** passiert. In der alten Ordnung musste jemand den Keller betreiben: aufschließen, Regale nachkaufen, krank werden, ersetzt werden. In der neuen gibt es diesen Jemand nicht. Die vierzig Dienste werfen ein, AWS sortiert, S3 hält. Das ist der Unterschied zwischen einem Dienst, der **liefert**, und einem, der **vorhält** und auf jemanden wartet, der abholt.

## Was es eigentlich ist — der Firehose-Stream

Kein Cluster, kein Consumer, kein Prozess, den jemand startet. Ein **Konfigurationsobjekt**, das Ziel, Format und Ordnung beschreibt:

```json
{
  "DeliveryStreamName": "logistik-app-logs",
  "DeliveryStreamType": "DirectPut",
  "ExtendedS3DestinationConfiguration": {
    "BucketARN": "arn:aws:s3:::logistik-datalake-prod",
    "RoleARN": "arn:aws:iam::1234:role/FirehoseDeliveryRole",
    "Prefix": "logs/region=!{partitionKeyFromQuery:region}/dt=!{timestamp:yyyy-MM-dd}/",
    "ErrorOutputPrefix": "errors/!{firehose:error-output-type}/",
    "DynamicPartitioningConfiguration": { "Enabled": true },
    "ProcessingConfiguration": {
      "Enabled": true,
      "Processors": [
        {
          "Type": "MetadataExtraction",
          "Parameters": [
            { "ParameterName": "JsonParsingEngine", "ParameterValue": "JQ-1.6" },
            { "ParameterName": "MetadataExtractionQuery", "ParameterValue": "{region:.region}" }
          ]
        }
      ]
    },
    "DataFormatConversionConfiguration": {
      "Enabled": true,
      "SchemaConfiguration": {
        "DatabaseName": "logistik",
        "TableName": "app_logs",
        "RoleARN": "arn:aws:iam::1234:role/FirehoseDeliveryRole"
      },
      "InputFormatConfiguration":  { "Deserializer": { "OpenXJsonSerDe": {} } },
      "OutputFormatConfiguration": { "Serializer":   { "ParquetSerDe": {} } }
    },
    "BufferingHints": { "SizeInMBs": 128, "IntervalInSeconds": 300 }
  }
}
```

Lies das von oben nach unten, es ist die ganze Karte. Woher (`DirectPut`), wohin (`BucketARN`), in welche Ordnung (`Prefix`), wohin mit dem Schrott (`ErrorOutputPrefix`), wie die Sortierschlüssel entstehen (`MetadataExtraction` mit jq), in welches Format umgeschrieben wird (`ParquetSerDe`) — und woher die Spaltendefinition dafür kommt (`SchemaConfiguration`, eine Tabelle im Glue Data Catalog).

**Diese `SchemaConfiguration` ist kein Zubehör: Ist die Format Conversion aktiv, ist die Glue-Tabelle ein Pflichtparameter.** Ohne Katalogeintrag gibt es kein Parquet.

## Der Weg durch die Karte

### Der Kasten links — 40 Microservices mit Direct PUT

Vierzig Dienste, vierzig Codebasen, ein gemeinsames Ziel. Sie rufen `PutRecord` beziehungsweise `PutRecordBatch` auf und sind fertig. Kein Stream davor, keine Shard-Zuordnung, kein Partition Key, über den jemand nachdenken müsste.

Das Bild dazu: Es ist ein Briefschlitz, kein Postfach. Du wirfst ein, du holst nie ab.

### Badge 1 — Logs

Ein Pfeil, eine Richtung, keine Rückrichtung. Dass hier kein Rückpfeil existiert, ist die wichtigste Eigenschaft der ganzen Karte — es gibt niemanden, der aus Firehose liest.

### Der Kasten — Amazon Data Firehose

Drei Zeilen stehen darin, und sie tun drei verschiedene Dinge.

**Format Conversion Parquet** schreibt jeden Record aus JSON in ein spaltenweises Format um. Das spart später **Spalten**: Eine Abfrage, die drei von fünfzig Feldern braucht, liest nur diese drei.

**Dynamic Partitioning** entscheidet, in welchen Präfix ein Record fällt. Das spart später **Zeilen**: `WHERE region='DE'` öffnet die übrigen Regionen gar nicht erst.

**Puffer: Größe ODER Zeit** — was zuerst eintritt, löst die Auslieferung aus. Nicht beides, nicht und.

Zusammen sind das die zwei Achsen der Kosteneinsparung, und sie sind unabhängig voneinander. Wer nur konvertiert, liest weiterhin jeden Tag — nur schmaler.

Die vierte Zeile, „kein Consumer-Code", ist keine Eigenschaft, die man einschaltet. Sie ist die Folge davon, dass Firehose kein Lesemodell besitzt. Es gibt keine Position im Stream, die jemand halten müsste, keinen Iterator, keinen Checkpoint, keine Rebalancierung, wenn ein zweiter Leser dazukommt. Alles, was in einem Consumer schiefgehen kann, existiert hier nicht — weil der Consumer nicht existiert.

### Der gestrichelte Kasten — Lambda-Transformation

Firehose kann jeden Record durch eine Lambda-Funktion schicken, bevor er abgelegt wird. Felder entfernen, Formate vereinheitlichen, ein verschachteltes Objekt flach klopfen.

Gestrichelt, weil es hier **nicht gebraucht** wird: Bei JSON-Daten holt sich Firehose die Partitionsschlüssel per Inline-Parsing selbst, mit einem eingebauten jq-Parser. Kein Code, kein Deployment, keine Concurrency-Grenze, kein zweites Fehlerbild.

Der Weg über Lambda bleibt für den Fall, dass der Schlüssel gar nicht im Record steht, sondern erst berechnet werden muss.

### Badge 2 — Schema vorab

Ein Pfeil, der gegen die Leserichtung zeigt: vom Glue Data Catalog **zurück** zu Firehose. Das irritiert beim ersten Hinsehen und ist genau richtig.

Firehose kann nicht wissen, dass `duration_ms` eine Zahl und `order_id` eine Zeichenkette ist. Es fragt die Spaltendefinition beim Katalog ab und benutzt sie als Bauplan für die Parquet-Datei. Der Katalog ist hier **Zulieferer**, nicht Abnehmer.

### Der Kasten — Glue Data Catalog

Kein Speicher. Ein Register.

Er hält Tabellennamen, Spalten, Typen und die Information, welche Präfixe welche Partitionswerte tragen. Die Daten selbst liegen in S3 und sind ihm gleichgültig.

Das Bild dazu: der Zettelkasten im Lesesaal. Er enthält kein einziges Buch, aber ohne ihn findest du keines.

### Badge 3 — Parquet + Präfixe

Erst hier fließen Nutzdaten nach S3, und zwar in fertiger Form. Das ist der Moment, in dem der Ausgangsfehler des Szenarios behoben wird — vorher lagen dort rohe JSON-Zeilen ohne Ordnung.

Wichtig für die Prüfung: Die Umformung passiert **im Fluss**, Record für Record, nicht in einem nächtlichen Lauf über bereits abgelegte Dateien.

### Der Kasten — S3 Data Lake

`region=DE/dt=2026-03-03/` ist kein hübscher Ordnername. Es ist die Datenstruktur.

S3 kennt in Wahrheit gar keine Ordner — der Schrägstrich ist Teil des Objektschlüssels. Was aussieht wie ein Verzeichnisbaum, ist eine Konvention, auf die sich Firehose, Glue und Athena gemeinsam geeinigt haben. Genau deshalb muss die Schreibseite die Ordnung erzeugen: Es gibt keine Instanz, die sie nachträglich erzwingen würde.

Was nicht zugeordnet werden kann, verschwindet nicht. Records, deren Partitionsschlüssel fehlt oder deren Umwandlung scheitert, landen unter dem konfigurierten Error-Präfix — dieselben Daten, anderer Ort, nachlesbar. Für den Betrieb heißt das: Ein leerer `errors/`-Präfix ist ein Betriebssignal, kein Zufall.

### Badge 4 — Tabellen-Metadaten

Gestrichelt gezeichnet, weil hier keine Nutzdaten fließen. Athena holt vom Katalog die Tabellendefinition und die Liste der Partitionen — und **nur** die.

Diese Trennung ist prüfungsrelevant und wird oft verwechselt: Metadaten kommen von Glue, Bytes kommen von S3. Zwei Quellen, zwei Wege, ein Ergebnis.

### Der Kasten — Amazon Athena

Serverless, Standard-SQL, kein Cluster, Abrechnung nach **gescanntem Datenvolumen**. Der letzte Punkt ist der, der diese Karte trägt: Die Rechnung entsteht nicht durch die Frage, sondern durch die Menge Bytes, die für die Antwort gelesen wurde.

### Badge 5 — SQL liest

Athena bestimmt beim Planen der Abfrage, welche Partitionen überhaupt in Frage kommen, und ruft dafür die Partitionsliste beim Glue Data Catalog ab. Was nicht zum `WHERE` passt, wird nie geöffnet — für diese Objekte gibt es nicht einmal ein GET.

Die Betriebsabteilung tippt:

```sql
SELECT order_id, error_code
FROM logistik.app_logs
WHERE region = 'DE' AND dt = '2026-03-03' AND status = 'FAILED'
```

Zwei der drei Bedingungen sind Partitionsspalten. Sie kosten nichts, weil sie verhindern, dass gelesen wird.

Der Effekt ist unsymmetrisch, und das lohnt sich zu verinnerlichen: `region` und `dt` wirken **vor** dem Lesen und bestimmen, welche Objekte überhaupt angefasst werden. `status` wirkt **beim** Lesen und filtert Zeilen, die bereits bezahlt sind. Dieselbe SQL-Syntax, zwei völlig verschiedene Wirkungsorte — deshalb kostet eine Abfrage ohne Partitionsbedingung das Vielfache, obwohl sie identisch aussieht.

### Der rote Kasten — Eigener Consumer auf EC2

Fachlich funktioniert das: ein Programm liest aus einem Stream, sammelt, konvertiert, schreibt. Millionen Zeilen Produktionscode tun genau das.

Es scheitert nicht an der Technik, sondern an einem Satz in der Aufgabe: **Es gibt kein Data-Engineering-Team.** Wer den Consumer wählt, wählt damit implizit jemanden, der ihn nachts patcht, sein Speicherleck sucht und seine Wiederaufnahme nach dem Absturz baut. Diese Person existiert im Szenario nicht.

### Die zwei Zonen — Ingestion und Abfrage

Der graue Rahmen links sagt „ohne Code", der rechte sagt „pro Volumen". Das ist keine Dekoration, sondern die Kostenlogik der Karte: Links zahlst du für **Durchsatz**, rechts für **gelesene Bytes**. Alles, was links an Ordnung entsteht, senkt rechts die Rechnung — dauerhaft, für jede künftige Abfrage.

## Die entscheidende Unterscheidung

Zwei Ersparnisse, die ständig verwechselt werden, weil beide „weniger Daten" heißen:

| | Format Conversion (Parquet) | Dynamic Partitioning |
|---|---|---|
| Spart | Spalten | Zeilen |
| Wirkt über | die Struktur **in** der Datei | die Auswahl **der** Dateien |
| Braucht | eine Glue-Tabelle als Schema | einen Schlüssel im Record (jq) oder Lambda |
| Ohne sie liest die Abfrage | alle Felder jedes Treffers | jeden Tag und jede Region |
| Fällt aus bei | fehlendem Katalogeintrag | fehlendem Feld im Record |

## Die ehrliche Feinheit

Drei Dinge, die auf keiner Karte Platz haben und in Tutorials fehlen.

**Erstens: Dynamic Partitioning ist eine Einbahnstraße.** Es lässt sich laut Dokumentation nur beim **Anlegen** eines Streams aktivieren — nicht nachträglich — und ist danach **nicht mehr abschaltbar**. Wer den Stream ohne Partitionierung baut und drei Monate später merkt, dass die Abfragen zu teuer sind, legt einen neuen Stream an und schaltet die Producer um.

**Zweitens: Zero Buffering und Dynamic Partitioning schließen sich aus.** Firehose kann das Puffer-Intervall auf null setzen und dann nahezu sofort liefern. Die Dokumentation zur Pufferung bei dynamischer Partitionierung sagt ausdrücklich: für Dynamic Partitioning ist Zero Buffering **nicht verfügbar**. Wer in einer Prüfungsantwort beides gleichzeitig verspricht, liegt falsch.

**Drittens: Das Puffer-Intervall ist nicht die Latenz.** Bei aktivem Dynamic Partitioning puffert Firehose intern mehrstufig, um möglichst große Objekte zu schreiben. Die Ende-zu-Ende-Verzögerung eines Record-Batches kann deshalb rund das **1,5-fache** der eingestellten Pufferzeit betragen. Aus „300 Sekunden" wird gefühlt eine Frischegarantie — sie ist keine.

Und eine Stelle, an der sich AWS selbst widerspricht: Für die **Puffergröße** nennt die API-Referenz einen Standardwert von 5 MB, die FAQ dagegen 64 bis 128 MB (Vorgabe 128), sobald Parquet oder Dynamic Partitioning aktiv sind; die Doku-Seite zur Format Conversion nennt 64 MB als harte Untergrenze. Beim **Intervall** stehen 0 bis 900 Sekunden (API) gegen 60 bis 900 (Quota-Hinweise). Belegbar ist die Untergrenze von 64 MB bei Format Conversion. Für alles andere gilt hier die Hausregel: **Bei widersprüchlichen AWS-Quellen kommt keine Zahl auf die Karte** — dort steht nur „Größe ODER Zeit".

## Syntax lesen — der Präfix-Ausdruck

Der Präfix ist keine Zeichenkette, sondern eine Vorlage, die Firehose je Record auswertet:

```
logs/region=!{partitionKeyFromQuery:region}/dt=!{timestamp:yyyy-MM-dd}/
     │      │                        │      │        │
     │      │                        │      │        └─ Datumsformat
     │      │                        │      └─ eingebauter Namensraum
     │      │                        └─ Schlüsselname aus der jq-Abfrage
     │      └─ Namensraum: aus der Query (Alternative: partitionKeyFromLambda)
     └─ statischer Anteil, gilt für alle Objekte
```

Die Form ist immer `!{namensraum:wert}`. Es gibt genau zwei Namensräume für Partitionsschlüssel — `partitionKeyFromQuery` beim Inline-Parsing und `partitionKeyFromLambda`, wenn eine Lambda-Funktion die Schlüssel erzeugt. Beide dürfen im selben Präfix vorkommen.

Der Schlüssel `region` entsteht vorher in der Extraktionsabfrage:

```
{region:.region, geraet:.type.device, jahr:.event_timestamp| strftime("%Y")}
```

Links vom Doppelpunkt der Name, den der Präfix benutzt; rechts ein jq-Ausdruck auf den Record. Verschachtelte Felder mit Punktnotation, berechnete Werte mit jq-Funktionen. Unterstützt wird jq in Version 1.6.

Die Schreibweise `spalte=wert` im Präfix ist übrigens Konvention, nicht Zwang — sie heißt Hive-Style und ist der Grund, warum Glue und Athena den Präfix ohne Zusatzangabe als Partition verstehen.

## Was du dadurch nicht baust

- keinen Stream, aus dem jemand lesen könnte — es gibt keine Consumer-API und keinen Iterator
- keine Retention, aus der sich etwas erneut lesen ließe; wer nachverarbeiten will, holt aus S3
- keinen Server, kein Auto Scaling, keine Kapazitätsplanung für die Ingestion
- keine Datenbank — S3 bleibt S3, es gibt keine Indizes und keine Updates auf Zeilenebene
- keinen ETL-Job und keinen Zeitplan
- keine Volltextsuche über die Logs

Übrig bleiben: ein Konfigurationsobjekt, eine IAM-Rolle, ein Katalogeintrag und ein Bucket.

## Wenn du dir eine Sache merkst

**Firehose liefert ab, Streams halten vor — und die Ordnung entsteht beim Schreiben, nicht beim Lesen.**

Ein Puffer mit Zeitachse, aus dem mehrere Konsumenten holen und erneut lesen, ist Kinesis Data Streams (Karte 51). Ein Programm, das selbst konvertiert, braucht jemanden, der es betreibt. Und eine Abfrage wird nicht dadurch billig, dass man sie besser formuliert, sondern dadurch, dass weniger Bytes unter ihr liegen.

## Prüfungsknackpunkte

**Signalwörter:** „no code to write, no consumers to manage", „near real-time delivery into the data lake", „query with standard SQL", „minimize the amount of data scanned", „no cluster to provision". Kein Code plus S3 plus SQL ist immer diese Karte.

**Die Reihenfolge-Falle.** Wer „minimize data scanned" liest, greift oft zur Antwort mit dem größten Athena-Tuning. Der Hebel liegt aber vor Athena: Format und Partition entstehen bei der Ablage. Eine Antwortoption, die nur an der Abfrage schraubt, ist in diesem Szenario zu spät dran.

**Die Katalog-Falle.** „Glue" in einer Antwortoption heißt nicht automatisch ETL-Job. Der Data Catalog ist Metadatenregister, der Glue-ETL-Job ist ein Spark-Lauf nach Plan. Auf dieser Karte kommt nur der Katalog vor.

**Warum ein eigener Consumer auf EC2 hier verliert:** technisch möglich, scheitert an der ausdrücklichen Vorgabe „kein Data-Engineering-Team".

**Warum Kinesis Data Streams als Ziel hier verliert:** ein Stream liefert nichts ab, er hält vor — jemand müsste weiterhin lesen und schreiben.

**Warum ein Glue-ETL-Job hier verliert:** er transformiert im Batch über bereits abgelegte Daten und erzeugt damit genau die Zwischenstufe, die vermieden werden soll.

**Warum „nur Parquet, ohne Partitionierung" hier verliert:** spart Spalten, aber nicht Tage und Regionen — die Abfrage liest weiterhin den gesamten Zeitraum.

**Warum eine Datenbank als Ziel hier verliert:** Logs in einer relationalen Datenbank kosten dauerhaft Speicher und Rechenzeit, auch wenn niemand fragt; der Data Lake kostet beim Fragen.
