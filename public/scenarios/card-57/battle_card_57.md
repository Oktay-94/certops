---
nr: 57
title: "Naechtliche CSV-nach-Parquet-Transformation mit Glue ETL und Job Bookmarks"
services:
  - AWS Glue ETL (Spark)
  - AWS Glue Data Catalog
  - AWS Glue Crawler
  - Amazon S3
  - Amazon Athena
  - Amazon EventBridge Scheduler
domains:
  - D1
  - D3
  - D4
signalwords:
  - "nightly batch transformation"
  - "convert CSV to a columnar format"
  - "process only new files since the last run"
  - "without managing servers or clusters"
  - "reduce the amount of data scanned by Athena"
  - "schema must be discovered automatically"
  - "incremental processing"
assets:
  - battle_card_57.svg
  - battle_card_57.png
  - battle_card_57.pdf
status_note: |
  QC (scripts/qc.py): 0 Befunde.
  Gegenzaehlung R5: 10 Boxen gemeldet = 9 fachliche Boxen + 1 Footer-Rect.
  66 Texte. 8 Segmente gemeldet = 8 gezeichnete <path>-Pfeile; alle geradlinig,
  daher keine Aufloesung in Teilsegmente wie bei Karte 56. 7 Badges, alle
  randlos und in Linienfarbe gefuellt. Keine weiss gefuellten Kreise mit Rand
  (R6 nicht einschlaegig).

  Korrekturrunden — alle VIER vor dem Zeichnen im Geometrieplan gefunden:
  (1) Boxtitel "40 Speditionspartner" 239,5 px > 235 px Innenbreite. Gekuerzt
      auf "Speditionspartner" (204,6 px); die Zahl 40 wanderte in die Sachzeile.
  (2) Ersatz-Sachzeile "40 Stueck, CSV unkomprimiert" 230,3 px > 227 px
      tatsaechliche Grenze (Box endet 310, minus 8 Padding, Text ab x=75).
      Der erste Korrekturversuch war also selbst zu breit — geloest mit
      "CSV, unkomprimiert" (150,6 px), die 40 steht bereits im Untertitel-Kontext.
  (3) R16-Pruefung: Label "Partitionen" (81,9 px) ragte 5,2 px in die ETL-Box.
      Ursache: der Korridor zwischen Catalog (666,25) und ETL (748,75) ist nur
      82,5 px breit und wird von Badge 4 (cx 707,5, r 15) zusaetzlich geteilt.
      Geloest durch kuerzeres Label "Tabelle" (53,1 px) UEBER dem Segment.
  (4) "Tabelle" bei y=486 hatte nur 0,7 px Luft zu Badge 4 (Oberkante y=490).
      Auf y=480 gesetzt -> 6,7 px Luft.
  Nach dem Zeichnen wurden keine Labels verschoben; die Plangrenzen gingen
  unveraendert in die Zonendefinition (R15).

  Render-Sanity: 11 Freizonen aus der Elementgeometrie, im ersten Durchgang
  2 belegt. Beide Befunde waren FALSCH GESCHNITTENE ZONEN, nicht Bildfehler —
  diesmal ueber LABELS statt ueber Badges (Karte 56):
    - "zw. Sched und ETL rechts" begann bei x=892, das Label "02:00" belegt
      aber x 892..932 (gemessen im PNG, Plan sagt 890..933). Nachgeschnitten
      auf x-Start 940.
    - "zw. ETL und Bookmark oben" reichte bis y=480, das Label "fragt" beginnt
      laut Plan bei y=468 und belegt im PNG y 468..479. Nachgeschnitten auf
      y-Ende 462.
  Nach dem Nachschnitt: 0 belegte Pixel in 11 Freizonen.
  Alle fuenf Palettenfarben im PNG nachweisbar (gruen 3778, lila 3090,
  orange 3671, blau 1137, grau 2268 px).

  Schwarz-Pruefung R13: 3177 dunkle Punkte im Sample, ausnahmslos im Titel
  (y 40..80) und im Footer-Merksatz (y 722..746) — beide laut Stil-Guide
  #111111. 0 Punkte ausserhalb. Kein schwarz gefuellter Pfad.

  R12-Gegencheck: 8 <path>-Elemente mit stroke, davon 8 mit fill="none".
  Erfuellt. Die vier Marker-<path> tragen fill und keinen stroke — korrekt.

  Footer von Hand gemessen: Merksatz 840,1 px bei 16 px bold (Grenze 1480),
  Zeile 2 833,2 px und Zeile 3 889,3 px bei 15 px.

  Sichtpruefung: VERSUCHT, NICHT GELUNGEN. `view` gab einen leeren Platzhalter
  zurueck. Damit 22. erfolgloser Versuch in Folge (R8). Diese Karte ist
  RECHNERISCH GEPRUEFT, ABER NICHT GESEHEN. Freigabe durch Oktay steht aus.
---

# Battle Card 57 — Glue ETL, Data Catalog, S3

## Szenario

Ein Logistikunternehmen erhaelt jede Nacht von **40 Speditionspartnern**
CSV-Dateien in einen S3-Rohdaten-Bucket — unkomprimiert, mit uneinheitlichen
Spaltentypen. Die Analysten fragen die Daten ueber **Athena** ab, und die
Abfragen sind langsam und teuer, weil jede Abfrage saemtliche CSV-Spalten scannt.

Gesucht ist eine **naechtliche Transformation nach Parquet**, partitioniert nach
Datum. Dabei darf der Job **nur die neuen Dateien** verarbeiten — die
Wiederverarbeitung von sieben Jahren Bestand jede Nacht ist weder bezahlbar noch
in der Zeitscheibe machbar. Der Betrieb moechte keine Server und keinen eigenen
Spark-Cluster verwalten.

## Ablauf 1–7

**1 — Partner → S3 Raw-Zone.** Die Speditionen legen ihre CSV-Dateien ab. Diese
Zone ist bewusst roh: nichts wird beim Schreiben umgewandelt, damit die
Anlieferung nicht scheitern kann. Athena koennte hier bereits abfragen — aber
zeilenweise, unkomprimiert und ueber alle Spalten hinweg, also langsam und teuer.

**2 — Crawler → Data Catalog.** Der Crawler liest Stichproben aus den Dateien,
leitet Spaltennamen und Typen ab und traegt Tabelle samt Partitionen in den
Katalog ein. Damit ist die Anforderung "Schema soll automatisch erkannt werden"
erfuellt, ohne dass jemand ein DDL von Hand pflegt.

**3 — EventBridge Scheduler → Glue ETL.** Ein Zeitplan startet den Job nachts um
zwei. Genau dieses Wort — **Zeitplan** — entscheidet die Prueferfrage: Es geht
nicht um einen Datenstrom, sondern um einen Stapellauf ueber bereits abgelegte
Daten.

**4 — Data Catalog → Glue ETL.** Der Job liest die Quelle **ueber den Katalog**
(`create_dynamic_frame.from_catalog`), nicht direkt per Pfad. Das ist die von AWS
empfohlene Variante: Neue Partitionen werden ueber den Crawler automatisch
nachgezogen, und Push-Down-Predicates lassen sich sauber anwenden. Beim Lesen
direkt per Pfad ist das Hinzufuegen und Entfernen von Partitionen umstaendlich.

**5 — Glue ETL → Job Bookmark.** Der Job fragt den gespeicherten Zustand des
letzten Laufs ab. Das Bookmark haelt fest, welche Dateien beziehungsweise
Partitionen bereits erfolgreich verarbeitet wurden. Voraussetzung: Am Source-Node
ist ein **`transformation_ctx`** gesetzt — ohne ihn hat das Bookmark keinen
Anker und der Job liest jede Nacht den vollen Bestand.

**6 — Bookmark-gefiltertes Delta → S3 Curated-Zone.** Verarbeitet wird nur, was
seit dem letzten Lauf hinzugekommen ist. Das Ergebnis geht als **Parquet**,
partitioniert nach Datum, in die kuratierte Zone. Spaltenformat plus
Partitionierung sind die beiden Hebel, die spaeter das gescannte Volumen senken.

**7 — Curated-Zone → Athena.** Die Analysten fragen jetzt die kuratierte Zone ab.
Parquet erlaubt, nur die tatsaechlich benoetigten Spalten zu lesen; die
Datumspartitionen schneiden zusaetzlich ganze Verzeichnisse weg. Dieselbe Frage
kostet damit einen Bruchteil und antwortet schneller.

## Pruefungs-Kernsatz

**Eine geplante, naechtliche Transformation ueber abgelegte Daten ist immer Glue
ETL — und das Job Bookmark macht sie inkrementell, aber nur mit gesetztem
`transformation_ctx`.**

## Abgrenzungen

**57 ↔ 52 (Amazon Data Firehose).** Firehose transformiert **im Fluss**, Record
fuer Record, waehrend die Daten unterwegs sind. Glue ETL transformiert **im
Batch**, nach Plan, ueber Daten, die bereits liegen. Steht im Szenario
"naechtlich", "geplant", "taeglich um X Uhr" oder "ueber den Bestand", ist es
Glue ETL. Steht dort "waehrend der Aufnahme" oder "bevor die Daten in S3
landen", ist es Firehose.

**57 ↔ 53 (Data Catalog / Athena).** Beide heissen "Glue", sind aber getrennte
Dienste: Der **Data Catalog** ist ein Register — er beschreibt, wo Daten liegen
und wie sie aufgebaut sind, und speichert selbst nichts. **Glue ETL** ist die
Rechenmaschine, die Daten tatsaechlich umformt. Eine Antwort, die den Data
Catalog Daten transformieren laesst, ist ohne Weiterlesen aussortierbar.

**57 ↔ 60 (Redshift).** Wenn das Szenario nach dem Transformationsschritt fragt,
ist es Glue ETL. Fragt es nach dem **Ort**, an dem die transformierten Daten fuer
anhaltende Warehouse-Last vorgehalten werden, kann Redshift die Antwort sein.
Beide koennen in derselben Pipeline vorkommen.

**57 ↔ Zero-ETL.** Seit Dezember 2024 gibt es Zero-ETL-Integrationen, die
Pipelines zwischen bestimmten Quellen und Zielen ganz entfallen lassen. Sie
greifen bei **unterstuetzten Quell-Ziel-Paaren** — nicht bei beliebigen
CSV-Dateien von 40 externen Partnern. Fuer dieses Szenario bleibt Glue ETL die
Antwort.

## Klassiker-Fallen

**Falle 1 — Data Catalog und Glue ETL verwechseln.** Die haeufigste Verwechslung
des ganzen Analytics-Blocks, weil beide Dienste "Glue" heissen. Merksatz: Der
Katalog **weiss**, der ETL-Job **macht**.

**Falle 2 — Firehose fuer eine naechtliche Transformation.** Firehose kann
transformieren, das stimmt. Aber im Fluss, nicht im Stapel. Das Wort
"naechtlich" schliesst Firehose aus, egal wie plausibel die Option klingt.

**Falle 3 — Bookmark aktiviert, `transformation_ctx` vergessen.** Das ist die
teuerste Falle in der Praxis, weil nichts abstuerzt: Der Job laeuft, liefert
korrekte Daten und verarbeitet trotzdem jede Nacht den vollen Bestand. `job.init()`
und `job.commit()` allein genuegen nicht — der Kontext gehoert an den
**Source-Node**.

**Falle 4 — Input-Pfad bei aktivem Bookmark aendern.** Wird der Pfad einer
Datenquelle umgestellt, ohne den `transformation_ctx` zu wechseln, verwendet Glue
den alten Bookmark-Zustand weiter. Die Folge steht so in der AWS-Doku: Dateien im
neuen Pfad werden uebersprungen, weil Glue sie fuer bereits verarbeitet haelt.
Auch hier keine Fehlermeldung — nur fehlende Daten.

**Falle 5 — Bookmark als Aenderungserkennung missverstehen.** Ein Bookmark
erkennt **neue** Dateien. Wird eine alte Datei im Quell-Bucket ueberschrieben,
ist das Verhalten nicht das, was man beim Wort "inkrementell" erwartet. Wer
Aktualisierungen bestehender Datensaetze braucht, kommt mit Bookmarks allein
nicht aus.

## Faktencheck — Divergenzen zu aelterem Kursmaterial

**(1) Job Bookmarks unterstuetzen Parquet und ORC seit Glue 1.0.** Aeltere Kurse
behaupten haeufig, Bookmarks funktionierten nur mit JSON, CSV, Avro und XML —
das galt fuer **Glue 0.9**. Ab Version 1.0 kommen Parquet und ORC hinzu. Fuer
dieses Szenario relevant, weil das Ziel Parquet ist.
*Quellen: AWS-Dokumentation, "Tracking processed data using job bookmarks"
(Tabelle der unterstuetzten S3-Quellformate); AWS What's New, "AWS Glue now
provides the ability to bookmark Parquet and ORC files using Glue ETL jobs",
26.07.2019.*

**(2) Glue 5.0 ist der aktuelle Stand, aeltere Kurse zeigen 2.0 oder 3.0.**
Glue 5.0 bringt Spark 3.5.4 (statt 3.3.0 in Glue 4.0), Java 17, Python 3.11,
Spark-native Fine-Grained Access Control ueber Lake Formation — auch fuer
Iceberg-, Delta- und Hudi-Tabellen — sowie die Integration mit SageMaker
Lakehouse. **Fuer diese Karte entscheidend:** Wer FGAC nicht braucht, muss nicht
auf Spark-DataFrames migrieren; GlueContext-Funktionen wie **Job Bookmarks und
Push-Down-Predicates funktionieren weiter**.
*Quellen: AWS-Dokumentation, "Migrating AWS Glue for Spark jobs to AWS Glue
version 5.0"; AWS Glue Documentation History, 03.12.2024.*

**(3) Support-Ende fuer Glue Python Shell 3.6 am 31.03.2026.** Neue Jobs mit
dieser Version koennen seitdem nicht mehr angelegt werden; bestehende laufen
weiter, erhalten aber keine Sicherheits-Updates, keinen technischen Support und
keine SLA-Zusagen.
*Quelle: AWS-Dokumentation, "AWS Glue version support policy".*

**(4) Zero-ETL-Integrationen existieren seit Dezember 2024.** AWS beschreibt sie
als vollstaendig verwaltete Integrationen, die den Bau von ETL-Pipelines
ueberfluessig machen sollen. Kursmaterial von vor 2025 kennt diese Option nicht,
in neueren Pruefungsfragen taucht sie als Alternative auf. Sie ersetzt Glue ETL
**nicht allgemein**, sondern nur fuer unterstuetzte Quell-Ziel-Paare.
*Quelle: AWS Glue Documentation History, 06.12.2024.*

**(5) Aus der Doku, in Kursen kaum erwaehnt: Katalog-Quelle schlaegt Pfad-Quelle.**
AWS empfiehlt ausdruecklich, mit Bookmarks aus einer **Katalogtabelle** zu lesen
statt direkt per Pfad — das Hinzufuegen und Entfernen von Partitionen ist beim
Pfad-Ansatz umstaendlich, waehrend Katalogtabellen mit Crawlern neue Partitionen
automatisch nachziehen und die gezielte Auswahl per Push-Down-Predicate erlauben.
Genau deshalb ist Schritt 4 der Karte so gezeichnet.
*Quelle: AWS-Dokumentation, "Tracking processed data using job bookmarks".*

## Nicht bestaetigt

- Zum gemeldeten Fehlverhalten von Job Bookmarks mit Snowflake-JDBC unter
  Glue 5.0 (funktioniert unter 4.0, schlaegt unter 5.0 fehl) gibt es eine
  re:Post-Frage, aber **keine Bestaetigung in der AWS-Doku und keinen
  Known-Issue-Eintrag**. Kommt deshalb nicht auf die Karte. Die dort
  wiedergegebene Regel — Bookmark-Keys muessen monoton steigen oder fallen und
  sollten keine gross-/kleinschreibungsabhaengigen Spaltennamen sein — ist
  dagegen durch die AWS-Doku zu JDBC-Bookmarks gedeckt.
- Die Aussage, ein Bookmark erkenne geaenderte Altdateien "nie", liess sich in
  dieser Schaerfe nicht belegen. Die auffindbaren Beschreibungen stammen aus
  einem Community-Playbook. Auf der Karte steht deshalb nur die gesicherte
  Formulierung "filtert auf neue Dateien"; Falle 5 nennt die Unsicherheit
  ausdruecklich als Grenze des Verfahrens statt als feste Regel.
- Konkrete Kostenersparnis durch Parquet gegenueber CSV ist nicht beziffert.
  Sie haengt vom Abfragemuster ab und ist kein Pruefungsstoff.

## Bewusste Vereinfachungen im Diagramm

- **Der Crawler ist gestrichelt gezeichnet und ohne eigenen Zeitplan.** In der
  Praxis laeuft er entweder nach Zeitplan oder ereignisgesteuert; im Diagramm
  steht "laeuft nach Bedarf", weil sein Takt fuer die Kernaussage unerheblich
  ist. Die gestrichelte Linie kennzeichnet ihn als **zeitweise laufend**, nicht
  als dauerhaft aktiven Baustein.
- **Der Job schreibt direkt in die Curated-Zone.** Real steht dazwischen oft ein
  weiterer Crawler oder ein `MSCK REPAIR`, damit Athena die neuen Partitionen der
  kuratierten Tabelle kennt. Das ist weggelassen, weil sonst zwei Katalog-Boxen
  im Bild staenden und die Kernaussage verwaessert waere.
- **Job Bookmark ist als eigene Box gezeichnet.** Technisch ist es kein
  eigenstaendiger Dienst, sondern eine Eigenschaft des Jobs mit persistiertem
  Zustand. Die eigene Box ist didaktisch gewaehlt, weil drei der fuenf Fallen
  genau an dieser Stelle sitzen.
- **Nur eine Transformation.** Reale Jobs erledigen zusaetzlich
  Typvereinheitlichung, Deduplizierung und Qualitaetspruefungen. Das Diagramm
  zeigt nur CSV nach Parquet plus Partitionierung — die beiden Schritte, die die
  Athena-Kosten senken.
- **EventBridge Scheduler steht stellvertretend fuer die Ausloesung.** Ebenso
  moeglich waeren Glue Triggers oder Step Functions. Die Aussage der Karte —
  geplanter Stapellauf statt Datenstrom — ist von der Wahl unabhaengig.

## Farbkonventionen dieser Karte

| Farbe | Bedeutung auf dieser Karte |
|---|---|
| Gruen `#1B7F5A` | S3-Zonen und Athena — Datenhaltung und Abfrage darauf |
| Lila `#7B5EA7` | Glue-Metadaten: Crawler, Data Catalog und die Schema-Pfeile |
| Orange `#C2410C` | Glue-Verarbeitung: ETL-Job, Job Bookmark und die Pfeile daraus |
| Blau `#1F5C99` | Ausloesung: EventBridge Scheduler |
| Grau `#555555` | Externe Beteiligte: die Speditionspartner |
| Gestrichelt `7,5` | Partner (extern), Crawler (zeitweise), Scheduler (zeitweise) |

**Anmerkung zu den Doppelbelegungen:** Gruen traegt hier S3 **und** Athena,
obwohl Athena auf Karte 56 orange war. Die Zuordnung folgt der Rolle auf der
jeweiligen Karte: Auf Karte 56 war Athena die Abfrage-Engine im Gegensatz zur
BI-Schicht; hier ist Athena der **Nutzniesser des Ergebnisses** und gehoert zur
Datenseite. Diese Inkonsistenz ist bewusst und geht in die Liste der offenen
Doppelbelegungen ein — sie sollte beim naechsten Durchgang durch die
Farbkonvention entschieden werden, nicht stillschweigend fortgeschrieben.
Lila und Orange trennen innerhalb von "Glue" die beiden Dienste, deren
Verwechslung Falle 1 ist.
