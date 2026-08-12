---
cardNumber: 57
slug: glue-etl-job-bookmark-parquet
title: "Nächtliche CSV-nach-Parquet-Transformation mit Glue ETL und Job Bookmarks"
services: ["AWS Glue ETL", "AWS Glue Data Catalog", "AWS Glue Crawler", "Amazon S3", "Amazon Athena", "Amazon EventBridge Scheduler"]
domains: ["D1", "D3", "D4"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/glue/latest/dg/monitor-continuations.html"
  - "https://docs.aws.amazon.com/glue/latest/dg/programming-etl-connect-bookmarks.html"
  - "https://docs.aws.amazon.com/glue/latest/dg/glue-version-support-policy.html"
  - "https://docs.aws.amazon.com/glue/latest/dg/update-from-job.html"
  - "https://aws.amazon.com/athena/pricing/"
  - "https://aws.amazon.com/blogs/big-data/introducing-aws-glue-5-0-for-apache-spark/"
---

## Die Grundidee zuerst

Stell dir ein Lager vor, in das jede Nacht neue Paletten kommen, und zwei Arten, morgens zu wissen, was neu ist.

**Weg eins:** Du zählst das ganze Lager. Jede Nacht, von vorne, alle sieben Jahrgänge. Am Ende weißt du korrekt, was drinsteht — und du hast vierzehn Stunden dafür gebraucht, um vierzig neue Paletten zu finden. Nach ein paar Monaten passt die Zählung nicht mehr in die Nacht.

**Weg zwei:** Du hast ein Wareneingangsbuch, und unter den letzten Eintrag von gestern hast du einen **Strich** gezogen. Heute Nacht fängst du unter dem Strich an. Was darüber steht, fasst du nicht an. Am Ende ziehst du den Strich weiter nach unten.

Der Strich im Buch ist das **Job Bookmark**. Er speichert keine Daten, er speichert eine Grenze.

Und daraus folgt sofort die Gefahr, die drei der fünf Prüfungsfallen dieser Karte trägt: Ein Strich gilt nur für **dieses eine Buch**. Wer ein neues Buch aufschlägt, den alten Strich aber mitnimmt, überspringt dessen erste Seiten — nicht weil sie gelesen wurden, sondern weil die Grenze aus einem anderen Zusammenhang stammt. Genau das passiert, wenn der Eingabepfad wechselt und der Kontext gleich bleibt.

## Was es eigentlich ist — der Source-Node mit Kontext

Das zentrale Objekt ist nicht der Job. Es ist die Zeile im Skript, die die Quelle liest:

```python
dyf = glueContext.create_dynamic_frame.from_catalog(
    database="logistik_raw",
    table_name="lieferscheine",
    transformation_ctx="src_lieferscheine",
    push_down_predicate="(jahr == '2026' and monat == '08')"
)
```

Lies das von hinten nach vorne. `push_down_predicate` schneidet Partitionen weg, bevor überhaupt gelesen wird. `transformation_ctx` ist der **Schlüssel**, unter dem Glue den Strich in seiner Datenbank ablegt — ohne ihn gibt es keinen Strich, egal welche Schalter du sonst umlegst. `table_name` und `database` zeigen auf den Data Catalog statt auf einen S3-Pfad.

Darum herum stehen zwei Aufrufe, die keine Fachlogik enthalten und trotzdem unverzichtbar sind:

```python
job.init(args["JOB_NAME"], args)
// ... Transformationen ...
job.commit()
```

`job.init` holt den aktuellen Bookmark-Zustand, `job.commit` schreibt ihn atomar zurück. Die Doku ist an dieser Stelle ungewöhnlich direkt: **ohne beide Aufrufe funktionieren Bookmarks nicht.**

## Der Weg durch die Karte

### Der gestrichelte Kasten links plus Badge 1 — was hereinkommt

Vierzig Speditionspartner legen CSV ab. Unkomprimiert, mit uneinheitlichen Spaltentypen, von außerhalb AWS. Der Kasten ist gestrichelt, weil dort niemand etwas vorschreiben kann: Wer eine Datei anliefert, liefert sie so an, wie sein System sie erzeugt.

Das ist eine bewusste Entscheidung und keine Nachlässigkeit. Würde beim Schreiben validiert und umgewandelt, könnte die Anlieferung **scheitern** — und dann fehlt der Tag ganz, statt unsauber dazuliegen.

### Der grüne Kasten — die Raw-Zone, und warum Athena hier teuer ist

`s3://…/raw/` hält sieben Jahre Bestand. Man könnte Athena direkt darauf loslassen, und es würde funktionieren. Es wäre nur die teuerste Variante von allen: unkomprimierter Text lässt sich nicht spaltenweise lesen und nicht aufteilen, also scannt jede Abfrage alles.

AWS rechnet das auf der Preisseite vor: 3 TB Text mit drei gleich großen Spalten, eine Abfrage auf eine Spalte — gescannt werden 3 TB. Mit GZIP bei 3:1 wird daraus 1 TB. Mit GZIP **und** Parquet liest Athena nur die gefragte Spalte und scannt 0,33 TB. AWS beziffert die Gesamtersparnis durch Komprimieren, Partitionieren und Spaltenformat mit 30 bis 90 Prozent.

Deshalb existiert diese Karte überhaupt.

### Der gestrichelte lila Kasten plus Badge 2 — der Crawler

Der Crawler liest Stichproben, leitet Spaltennamen und Typen ab und trägt Tabelle samt Partitionen in den Katalog ein. Damit ist „Schema soll automatisch erkannt werden" erfüllt, ohne dass jemand DDL pflegt.

Er ist gestrichelt, weil er nicht dauerhaft läuft — er ist ein Besuch, kein Bewohner. Ob er nach Zeitplan oder ereignisgesteuert startet, ändert an der Kernaussage nichts.

### Der lila Kasten — Data Catalog: Register, nicht Rechenmaschine

Der Katalog hält Tabellen und Partitionen. Er speichert **keine** Daten. Die Zeile „nicht der ETL-Dienst" steht deshalb auf der Karte: Beide Dienste heißen „Glue", und in der Prüfung ist das keine Kleinigkeit, sondern die häufigste Verwechslung des ganzen Analytics-Blocks.

Der Katalog **weiß**, der ETL-Job **macht**.

### Der blaue Kasten plus Badge 3 — der Auslöser um 02:00

Ein Zeitplan startet den Job. Genau dieses Wort entscheidet die Prüferfrage: Es geht nicht um einen Datenstrom, sondern um einen Stapellauf über Daten, die bereits liegen. Der Kasten ist gestrichelt, weil auch der Scheduler nichts vorhält — er ist ein Eintrag, kein Prozess. EventBridge Scheduler steht hier stellvertretend; Glue Triggers oder Step Functions täten dasselbe.

### Badge 4 — die Quelle kommt aus dem Katalog, nicht aus dem Pfad

Der Job liest über `from_catalog`, nicht direkt per Pfad. AWS empfiehlt das ausdrücklich als Best Practice für Bookmarks, und zwar mit einer konkreten Begründung: Bookmarks funktionieren zwar in beiden Varianten, aber beim Pfad-Ansatz ist das Hinzufügen und Entfernen von Partitionen umständlich. Eine Katalogtabelle mit Crawler zieht neue Partitionen automatisch nach und erlaubt die gezielte Auswahl per Push-Down-Predicate.

### Der orange Kasten — Glue ETL auf Spark, ohne Cluster

Der Job läuft auf Apache Spark, aber du siehst keinen Cluster, richtest keine Knoten ein und patchst kein Betriebssystem. Du gibst an, wie viele Worker du willst, und AWS stellt sie für die Laufzeit hin.

Was er tut, steht in einer Zeile: CSV nach Parquet, partitioniert nach Datum. Und was er **nicht** tut, steht kursiv darunter: Er transformiert im Batch, nicht im Fluss. Das ist der Trennstrich zu Amazon Data Firehose.

### Badge 5 — der Job fragt den Strich ab

Beim Start holt der Job den gespeicherten Zustand des letzten Laufs. Für S3-Quellen prüft Glue dafür die **Last-Modified-Zeit** der Objekte — nicht den Dateinamen, nicht eine Prüfsumme. Was seit dem letzten erfolgreichen Lauf neuer ist, kommt dran.

### Der zweite orange Kasten — das Bookmark selbst

In der Glue-Datenbank sieht der Zustand so aus:

```json
{
  "job_name": "csv-nach-parquet",
  "run_number": 214,
  "attempt_number": 0,
  "states": {
    "src_lieferscheine": { "bookmark_state": "…" }
  }
}
```

Unter `states` steht genau ein Schlüssel je `transformation_ctx`. Fehlt der Kontext am Source-Node, entsteht dort kein Eintrag — und der Job liest jede Nacht den vollen Bestand. **Ohne Fehlermeldung.** Die Ergebnisse bleiben korrekt, nur die Rechnung wächst und die Laufzeit auch.

`run_number` steigt monoton mit jedem erfolgreichen Lauf, `attempt_number` zählt Wiederholungen nach einem fehlgeschlagenen Versuch.

Zwei Bedienhandlungen gehören dazu, die auf der Karte keinen Platz hatten. **Rewind** setzt den Strich auf einen beliebigen früheren Lauf zurück — der nächste Lauf verarbeitet dann alles ab dort. Das ist der Weg für Backfills. **Reset** löscht ihn ganz:

```
aws glue reset-job-bookmark --job-name csv-nach-parquet
```

Danach beginnt der Job wieder bei null. Und: Löschst du den Job, ist der Bookmark-Zustand mit weg. Er hängt am Job, nicht an den Daten.

### Badge 6 — nur das Delta wandert in die Curated-Zone

Geschrieben wird als Parquet, partitioniert nach Datum, nach `s3://…/curated/`. Spaltenformat und Partitionierung sind die beiden Hebel, die später das gescannte Volumen senken — der eine schneidet Spalten weg, der andere ganze Verzeichnisse.

Wichtig für das Verständnis von Wiederholungsläufen: **Nur Quelldateien werden getrackt, Ziele nicht.** Setzt du das Bookmark zurück und lässt den Job erneut laufen, räumt Glue das Ziel nicht auf. Du bekommst Duplikate, wenn du nicht selbst ein anderes Ziel wählst.

### Badge 7 — die Analysten fragen die kuratierte Zone

Dieselbe fachliche Frage kostet jetzt einen Bruchteil und antwortet schneller. Nichts an der Frage hat sich geändert, nur die Form der Ablage.

Die beiden Hebel wirken übrigens unabhängig voneinander, und das ist der Grund, warum die Karte beide nennt. **Partitionierung** hilft nur, wenn die Abfrage nach dem Partitionsschlüssel filtert — eine Abfrage ohne `WHERE datum …` liest weiterhin alle Verzeichnisse. **Spaltenformat** hilft nur, wenn die Abfrage nicht alle Spalten braucht — ein `SELECT *` über Parquet spart die Spaltenersparnis nicht ein, sondern nur die Komprimierung. Wer eines von beiden baut und das andere weglässt, bekommt die Hälfte der Rechnung, nicht ein Neuntel.

## Die entscheidende Unterscheidung

Das Bookmark hat **drei** Schalterstellungen, nicht zwei — und die dritte ist die, die in Prüfungsfragen zum Thema Backfill auftaucht:

| Stellung | Was passiert | Zustand wird fortgeschrieben |
|---|---|---|
| `Disable` | Der Job verarbeitet immer den ganzen Bestand. **Das ist die Voreinstellung.** | — |
| `Enable` | Der Job verarbeitet, was seit dem letzten Checkpoint dazukam | ja |
| `Pause` | Der Job verarbeitet das Delta oder einen per `job-bookmark-from` / `job-bookmark-to` benannten Lauf-Bereich | **nein** |

Der praktische Unterschied: `Pause` ist der Modus zum Nachfahren eines Zeitraums, ohne die laufende Produktion aus dem Takt zu bringen. Für die Ausgabe bist du in `Disable` und `Pause` selbst verantwortlich.

## Die ehrliche Feinheit

**Erstens: „nur neue Dateien" ist zu grob formuliert.** Auf der Karte steht „filtert auf neue Dateien". Die Doku sagt es präziser — und die Präzisierung dreht die Bedeutung: Glue prüft die Last-Modified-Zeit. Wurde eine **alte** Datei seit dem letzten Lauf überschrieben, wird sie beim nächsten Lauf erneut verarbeitet. Das Bookmark filtert also nicht auf „neu angelegt", sondern auf „seit dem Checkpoint angefasst". Wer daraus eine Änderungserkennung auf Datensatzebene macht, irrt trotzdem: Verarbeitet wird immer die ganze Datei, nie die geänderte Zeile darin.

**Zweitens: Das Ziel weiß nichts vom Katalog.** Auf der Karte schreibt der Job direkt in die Curated-Zone, und Athena liest von dort. Real fehlt dazwischen ein Schritt — Athena kennt die neuen Partitionen der kuratierten Tabelle nicht von selbst. Entweder läuft danach ein zweiter Crawler, oder der Job aktualisiert den Katalog selbst mit `enableUpdateCatalog` und `partitionKeys` im Sink; mit `updateBehavior: UPDATE_IN_DATABASE` schreibt er zusätzlich Schemaänderungen fort. Das Diagramm lässt das weg, weil sonst zwei Katalog-Kästen im Bild stünden.

**Drittens: Die Versionsangabe auf der Karte ist überholt.** Dort steht „ab Glue 1.0 auch Parquet". Als Aussage über die Formattabelle stimmt das — Version 0.9 unterstützte JSON, CSV, Avro und XML, ab Version 1.0 kommen Parquet und ORC dazu. Als Handlungsanweisung taugt es nicht mehr: Die Glue-Versionen 0.9, 1.0 und 2.0 haben am **01.04.2026 ihr End of Life** erreicht. Auf diesen Versionen lassen sich weder neue Jobs anlegen noch bestehende Läufe starten. Aktueller Migrationsstand ist **Glue 5.1**; Glue 5.0 brachte Spark 3.5.4, Python 3.11 und Java 17, 5.1 hebt auf Spark 3.5.6 an. Praktisch heißt das: Parquet-Bookmarks sind heute selbstverständlich, und die Zahl 1.0 ist nur noch Fußnote.

**Viertens: Bei JDBC-Quellen gelten andere Regeln als bei S3.** Diese Karte liest aus S3, aber die Prüfung mischt gern. Bei JDBC arbeitet das Bookmark nicht mit Zeitstempeln, sondern mit **Bookmark Keys**: einer oder mehreren Spalten, die zu einem zusammengesetzten Schlüssel verbunden werden. Standardmäßig nimmt Glue den Primärschlüssel — aber nur, wenn er lückenlos auf- oder absteigend ist. Und Spalten, deren Namen sich nur in der Groß- und Kleinschreibung unterscheiden, werden als Bookmark Keys nicht unterstützt.

**Fünftens: Bookmarks können den Treiber sprengen.** Ein Bookmark listet alle Dateien unter jeder Eingabepartition auf und filtert dann. Liegen unter einer Partition zu viele Dateien, läuft der Spark-Driver aus dem Heap. AWS empfiehlt für solche Fälle den Glue S3 File Lister. Ein Verfahren, das Kosten spart, hat also selbst eine Skalierungsgrenze.

## Syntax lesen — der Strich und sein Schlüssel

```
transformation_ctx="src_lieferscheine"
        │                    │
        │                    └─ frei wählbar, muss aber STABIL bleiben
        └─ Schlüssel in states{} der Bookmark-Ablage

Job-Bookmark-Schalter   ->  Enable    (sonst passiert nichts)
job.init() / job.commit ->  Klammer   (sonst passiert nichts)
transformation_ctx      ->  Schlüssel (sonst passiert nichts)
```

Alle drei müssen gesetzt sein. Fällt eines weg, verhält sich der Job wie mit `Disable` — er läuft, liefert richtig, und liest jede Nacht alles.

Die Warnung der Doku dazu wörtlich sinngemäß: Quelle und `transformation_ctx` müssen zusammen konsistent bleiben. Änderst du die eine oder benennst du den anderen um, wird der bisherige Zustand ungültig, und die zeitstempelbasierte Filterung liefert nicht mehr das erwartete Ergebnis.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Spark-Cluster, keine EMR-Knoten, kein Kapazitätsmanagement
- kein Betriebssystem, das gepatcht werden müsste
- kein selbstgeschriebener Abgleich, welche Dateien schon dran waren
- keine Zustandstabelle in DynamoDB, kein Manifest, kein Marker-Objekt in S3
- kein Streaming-Puffer, kein Shard, keine Consumer-Gruppe
- kein DDL, das jemand nachpflegt, wenn ein Partner eine Spalte ergänzt

Übrig bleiben: ein Zeitplan, ein Skript mit drei Pflichtzeilen und ein Katalogeintrag.

## Wenn du dir eine Sache merkst

**Eine geplante nächtliche Transformation über abgelegte Daten ist immer Glue ETL — und inkrementell wird sie erst durch das Job Bookmark, das ohne `transformation_ctx` am Source-Node nicht existiert.**

Der Data Catalog beschreibt und rechnet nicht. Firehose transformiert im Fluss und kennt keinen Zeitplan über Bestandsdaten. Athena fragt ab und schreibt keine Pipeline. Und ein Bookmark ohne Kontext ist ein Strich, den niemand gezogen hat.

## Prüfungsknackpunkte

**Signalwörter:** „nightly batch", „convert CSV to a columnar format", „process only new files since the last run", „without managing servers or clusters", „reduce the amount of data scanned by Athena", „schema must be discovered automatically". Die Kombination aus „nächtlich" und „nur die neuen" ist praktisch eine Signatur für Glue ETL plus Bookmark.

**Warum Amazon Data Firehose hier verliert:** Firehose kann transformieren, aber **im Fluss**, während Daten unterwegs sind. Hier liegen die Daten bereits in S3, und der Auslöser ist eine Uhrzeit. Steht „während der Aufnahme" oder „bevor die Daten in S3 landen" im Text, dreht sich die Antwort um.

**Warum der Glue Data Catalog als Antwort hier verliert:** Er ist ein Register. Eine Option, die ihn Daten transformieren lässt, ist ohne Weiterlesen aussortierbar — auch wenn „Glue" darin vorkommt.

**Warum EMR hier verliert:** Technisch möglich, aber die Aufgabe sagt ausdrücklich, dass kein eigener Cluster verwaltet werden soll. EMR gewinnt, wenn das Szenario Cluster-Kontrolle, eigene Spark-Konfiguration oder lang laufende Verarbeitung betont.

**Warum Lambda hier verliert:** Vierzig Dateien mit sieben Jahren Kontext und einer Datumspartitionierung sind kein Ereignis, sondern ein Stapel. Lambda hat zudem eine harte Laufzeitgrenze, die ein Bestandslauf reißen kann.

**Warum Zero-ETL hier verliert:** Zero-ETL-Integrationen greifen bei **unterstützten Quell-Ziel-Paaren**, typischerweise zwischen AWS-Datenbanken und Warehouses. CSV-Dateien von vierzig externen Partnern gehören nicht dazu. Die Option klingt in neueren Fragen plausibel und passt hier trotzdem nicht.

**Die stille Falle, die keine Antwortoption ist:** Bookmark eingeschaltet, `transformation_ctx` vergessen. Es stürzt nichts ab. Es fällt nur bei der Rechnung auf.
