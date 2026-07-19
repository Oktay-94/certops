---
nr: 40
title: "Athena · Glue · S3 Data Lake — Ad-hoc-SQL ohne Cluster"
services:
  - Amazon Athena
  - AWS Glue Data Catalog
  - AWS Glue ETL
  - Amazon S3
  - Amazon QuickSight
domains: [D3, D4]
signalwords:
  - "query data in S3 using standard SQL"
  - "no infrastructure to manage, pay per query"
  - "reduce the amount of data scanned"
  - "ad-hoc analysis without loading into a data warehouse"
  - "the team only runs a few queries per week"
assets:
  png: battle_card_40.png
  pdf: battle_card_40.pdf
  svg: battle_card_40.svg
status_note: >
  QC 0 Befunde (10 Boxen, 41 Texte, 19 gemeldete Segmente — davon 6
  Phantom-Segmente aus den drei Marker-Definitionen, also 13 gezeichnet,
  6 Badges). Render-Sanity bestanden: vier aus der Elementgeometrie
  abgeleitete Freizonen rein weiss, alle 15 Palettenfarben nachweisbar.
  Footer von Hand gemessen: 1311,0 px (Stil-Guide ~1420). Zwei Texte mussten
  vor dem Zeichnen gekuerzt werden (Katalog-Zeile 612 px bei 584 px Platz,
  Footer 1512 px). Sichtpruefung: Bildansicht lieferte einen leeren
  Platzhalter — visuell NICHT geprueft, Oktay muss draufschauen.
---

# Battle Card 40 — Athena · Glue · S3 Data Lake

## Szenario

**Falkendorf Logistik** sammelt Telematikdaten von 12.000 Fahrzeugen — Position,
Verbrauch, Fehlercodes — die als JSON in S3 landen, rund 3 TB. Das Controlling
will ein paar Mal pro Woche auswerten: Verbrauch je Region, Standzeiten je
Depot. Ein Data Warehouse dafür aufzubauen und dauerhaft laufen zu lassen, wäre
für diese Abfragefrequenz nicht zu rechtfertigen.

Genau das ist der Athena-Fall: **seltene Abfragen auf viele Daten**. Bezahlt
wird pro Abfrage, es läuft nichts zwischen den Abfragen.

## Ablauf

**1 — Rohdaten liegen in S3.** Unpartitioniert, als JSON, in vielen kleinen
Dateien. Das ist der Zustand, in dem Daten normalerweise ankommen — und der
Zustand, in dem Athena am teuersten ist.

**2 — Glue ETL räumt auf.** Ein Glue-Job wandelt nach **Parquet** und legt die
Daten **nach Tag partitioniert** ab (`dt=2026-07-19/`). Beides zusammen ist der
eigentliche Hebel: Parquet ist spaltenweise gespeichert, Athena liest also nur
die Spalten aus dem `SELECT`; die Partitionierung sorgt dafür, dass ein
`WHERE dt = ...` ganze Verzeichnisse überspringt. Aus 3 TB gescannt werden
0,33 TB — aus 15 USD werden 1,67 USD, für dieselbe Antwort.

**3 — Der Glue Data Catalog nimmt das Schema auf.** Tabellen, Spalten,
Datentypen, Partitionen. Der Katalog speichert **keine Daten**, sondern Zeiger:
wo liegen die Dateien, wie sind sie aufgebaut. Metapher: ein Bibliotheksregister,
kein Bücherregal.

**4 — Athena liest den Katalog beim Planen.** Aus den Partitionsangaben ergibt
sich, welche S3-Präfixe überhaupt angefasst werden müssen.

**5 — Athena scannt und rechnet.** Serverless, kein Cluster, keine Kapazität, die
man vorher wählt. Abgerechnet wird nach **gescannten Bytes**: 5 USD je TB, mit
10 MB Mindestmenge je Abfrage. DDL-Anweisungen und fehlgeschlagene Abfragen sind
kostenfrei.

**6 — Das Ergebnis landet in S3** und von dort in QuickSight oder im
BI-Werkzeug.

**Verworfen (rotes X):** `SELECT *` direkt auf die Rohzone. Kein Spaltenschnitt,
kein Partitionsfilter — die vollen 3 TB werden gelesen. Die Abfrage ist syntaktisch
identisch, das Ergebnis fachlich dasselbe, der Preis das Neunfache.

## Prüfungs-Kernsatz

**Athena zahlt gescannte Bytes, nicht zurückgegebene Zeilen.** Die Kosten
entstehen im Speicherlayout, nicht in der SQL-Syntax. Wer Athena optimieren
soll, ändert das Format und die Partitionierung — nicht die Abfrage.

## Abgrenzung zu Karte 26 (Redshift Spectrum)

Beide lesen dieselben Dateien in S3 und benutzen **denselben Glue Data
Catalog**. Das ist der Satz, der die Verwechslung erklärt und zugleich auflöst:

| | Athena | Redshift Spectrum |
|---|---|---|
| Rechenumgebung | serverless, keine | ein **laufender Redshift-Cluster** ist Voraussetzung |
| Abrechnung | je gescanntem TB | Cluster-Kosten **plus** je gescanntem TB |
| Typischer Fall | seltene Ad-hoc-Abfragen | S3-Daten mit Warehouse-Tabellen **joinen** |
| Ohne Cluster nutzbar | ja | nein |

**Merksatz:** Wer keinen Redshift-Cluster hat, kann Spectrum nicht benutzen —
Athena schon. Wer einen hat und externe S3-Daten mit internen Tabellen
verbinden will, nimmt Spectrum. Der Katalog ist beiden gemeinsam; ein einmal
angelegtes Schema ist von Athena, Spectrum, EMR und Glue nutzbar.

## Klassiker-Fallen

**1. Glue Data Catalog ist nicht Glue ETL.** Zwei verschiedene Dinge unter einem
Produktnamen. Der **Katalog** ist ein Metadatenspeicher — passiv, billig
(erste 1 Mio. Objekte im Monat frei), von vielen Diensten gemeinsam genutzt.
**Glue ETL** sind Spark-Jobs, die tatsächlich Daten bewegen, und die kosten nach
DPU-Stunden. Eine Prüfungsfrage nach „a central metadata repository" meint den
Katalog; „transform the data before analysis" meint ETL.

**2. Der Crawler ist nicht Pflicht.** Ein Glue Crawler ist bequem, um Schemata
automatisch zu erkennen, aber man kann Tabellen auch per DDL selbst anlegen —
und bei regelmäßigen Partitionsschemata ganz auf Katalog-Partitionen verzichten.
Crawler kosten DPU-Stunden und laufen manchmal öfter, als jemand gemerkt hat.

**3. Partition Projection ist nicht automatisch besser.** Sie berechnet
Partitionswerte aus der Tabellenkonfiguration statt sie im Katalog
nachzuschlagen — das beschleunigt die Planung bei sehr vielen Partitionen und
spart Glue-Requests. **Aber:** AWS weist darauf hin, dass die Leistung
*schlechter* sein kann als mit Katalog-Metadaten, wenn mehr als die Hälfte der
projizierten Partitionen leer ist, weil Athena dann Pfade projiziert, hinter
denen nichts liegt. Der richtige Anwendungsfall ist ein **dichter, vorhersagbarer**
Partitionsraum — Tageslogs, nicht dünn besetzte Kombinationen.

**4. Die Athena-Zeile in Cost Explorer ist nicht die Rechnung.** Dazu kommen
S3-GET-Requests (jede einzelne Datei), Glue-Data-Catalog-Requests, die
Speicherung der Ergebnisse in S3 und bei föderierten Abfragen Lambda-Kosten.
Ein Data Lake aus Millionen winziger Dateien kann eine harmlose Athena-Zeile und
eine unangenehme S3-Zeile erzeugen. **Viele kleine Dateien sind das zweite
Layout-Problem neben fehlender Partitionierung.**

**5. Athena ist keine Anwendungsdatenbank.** Keine Sub-Sekunden-Latenz, keine
Transaktionen im klassischen Sinn, keine hohe Nebenläufigkeit für
Nutzerabfragen. Für „a dashboard used by hundreds of users" ist Redshift oder
eine aufbereitete Datenbank die Antwort, nicht Athena.

**6. Hive-Layout entscheidet über den Aufwand.** Verzeichnisse der Form
`dt=2026-07-19/` erkennt Athena mit `MSCK REPAIR TABLE`. Andere Layouts brauchen
`ALTER TABLE ADD PARTITION` je Partition — von Hand oder per Skript.

## Ausblick, bewusst nicht auf der Karte

Seit 2025 gibt es **Amazon S3 Tables**: einen eigenen Bucket-Typ mit eingebauter
**Apache-Iceberg**-Unterstützung, automatischer Tabellenpflege (Kompaktierung,
Snapshot-Aufräumen) und einer automatischen Registrierung im Glue Data Catalog
unter einem föderierten Katalog `s3tablescatalog`. Athena, Redshift, EMR und
Iceberg-fähige Fremdwerkzeuge lesen dieselbe Tabelle über den
Glue-Iceberg-REST-Endpunkt.

Das löst genau die Probleme, die auf dieser Karte als Fallen stehen — kleine
Dateien, manuelle Kompaktierung, Partitionspflege. **Für SAA-C03 ist die
klassische Kombination S3 + Glue Catalog + Athena weiterhin die erwartete
Antwort**, aber wer die Karte in ein Jahr weiterträgt, sollte S3 Tables kennen.
Nicht aufs Diagramm genommen, weil es die Ablauflinie verdoppelt hätte.

## Faktenlage geprüft (Nachrecherche nach Batch 8)

**Der Preis ist gut gestützt, aber die verbreiteten Mindestwerte sind seit dem
10.02.2026 überholt — und der Name hat sich geändert.**

**Preis:** 0,30 USD je DPU-Stunde, minutengenau abgerechnet. Vier unabhängige
Quellen nennen diesen Wert übereinstimmend; die abweichende Angabe von 0,40 USD
steht allein. Eine DPU entspricht 4 vCPUs und 16 GB Arbeitsspeicher. ⚠️ Eine
**AWS-eigene** Preisangabe in USD konnte nicht direkt eingesehen werden — der
Wert ist gut gestützt, aber nicht amtlich belegt.

**Mindestwerte — hier liegt der eigentliche Fund.** Die Angabe „mindestens
24 DPUs, mindestens 8 Stunden", die in fast jedem Kursmaterial und in den
meisten Blogs steht, ist **zweimal überholt worden**:

| Stand | Minimum DPUs | Mindestdauer |
|---|---|---|
| Start 2023 | 24 | 8 Stunden |
| ab 31.10.2023 | 24 | 1 Stunde |
| **ab 10.02.2026** | **4** | **1 Minute** |

Belegt durch die AWS-Ankündigung vom 10.02.2026 und die Doku-Seite *Manage
query processing capacity*, die schreibt, dass je Capacity Reservation
mindestens 4 DPUs nötig sind. AWS nennt bis zu 95 % Ersparnis für kurze
Arbeitslasten gegenüber der On-Demand-Abrechnung. Damit ist auch die
verbreitete Rechnung „24 × 8 × 0,30 = 57,60 USD als kleinstmögliche
Reservierung" hinfällig.

**Namensänderung:** Das Feature heißt inzwischen **Capacity Reservations**,
nicht mehr *Provisioned Capacity*. Ältere Quellen und Kursunterlagen benutzen
den alten Namen.

**Weitere belegte Eckwerte aus der Doku:** Athena weist DML-Abfragen automatisch
zwischen 4 und 124 DPUs zu, DDL-Abfragen immer 4. Je Konto und Region sind
maximal 1.000 DPUs und 100 Reservierungen möglich. Kapazitätsanfragen sind nicht
garantiert und können bis zu 30 Minuten dauern. Reservierungen und Abrechnung
nach gescannten Bytes lassen sich im selben Konto parallel nutzen.

**Der Grundpreis von 5 USD je gescanntem TB und die 10 MB Mindestmenge sind
quellenübergreifend konsistent und bleiben unverändert.**

Keine dieser Zahlen steht auf der Karte — dort stehen nur die 5 USD je TB und
die 10 MB Mindestmenge, die stabil sind.

## Bewusste Vereinfachungen im Diagramm

- **Der Crawler ist nicht separat gezeichnet**, sondern in der Glue-ETL-Box
  aufgegangen. Real sind Crawler (Schema erkennen) und ETL-Job (Daten wandeln)
  getrennte Dinge, die man auch unabhängig voneinander betreibt.
- **Der Katalog ist als eine Box gezeichnet**, obwohl er pro Region und Konto
  existiert und von mehreren Diensten gleichzeitig gelesen wird. Die Pfeile
  zeigen nur die zwei Beziehungen dieser Karte.
- **Lake Formation fehlt.** Feingranulare Zugriffsrechte auf Tabellen-, Spalten-
  und Zeilenebene laufen darüber; das wäre eine eigene Karte.
- **Die Zahlen sind ein gerechnetes Beispiel**, kein Messwert: 3 TB Rohdaten,
  ein Zehntel nach Parquet und Spaltenschnitt. Die tatsächliche Ersparnis hängt
  an Datentypen und Abfragen.
- **Der Rückweg des Ergebnisses über den S3-Ergebnisbucket ist verkürzt** — im
  Diagramm geht der Pfeil direkt von Athena nach QuickSight.

## Farbkonventionen dieser Karte

- **Orange = Glue** (ETL und Katalog), direkt aus dem Stil-Guide. Der ETL-Job
  hat einen **gestrichelten Rand**, weil er periodisch läuft und nicht dauerhaft
  existiert; der Katalog ist durchgezogen, weil er permanent ist.
- **Grün = S3 und der Datenfluss**, unverändert.
- **Lila = Athena.** Der Stil-Guide vergibt Lila unter anderem an **Redshift
  Spectrum** — beide sind Abfrage-Engines auf S3-Daten. Das ist hier
  **absichtlich** dieselbe Farbe: Die Farbe sagt „Query-Engine über S3", der
  Unterschied liegt in der Ausführungsumgebung und steht in der
  Abgrenzungstabelle. ⚠️ Wenn du willst, dass die Farbe die Abgrenzung mitträgt,
  braucht Athena einen eigenen Ton — zum Gegenlesen.
- **Gold = Kosten** für die Box „Versteckte Kosten". Das ist die **ursprüngliche**
  Stil-Guide-Bedeutung (Kosten/Cost Protection) und damit ein Gegenbeispiel zur
  Umdeutung auf Karte 39, wo Gold „kostet Daten" hieß. ⚠️ Beide Verwendungen
  stehen jetzt nebeneinander; das ist ein Argument dafür, Gold bei „Geld" zu
  belassen und für Karte 39 eine andere Farbe zu wählen.
- **Teal = Konfigurationsinstanz** für Partition Projection — vierte Karte in
  Folge in dieser Bedeutung.
- **Blau = BI/Anwendung**, **Rot = verworfen**: unverändert.
