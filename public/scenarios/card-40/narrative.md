---
cardNumber: 40
slug: athena-glue-s3-data-lake-falkendorf-telematik-speicherlayout
title: "Athena · Glue · S3 Data Lake — Ad-hoc-SQL ohne Cluster"
services:
  - Amazon Athena
  - AWS Glue Data Catalog
  - AWS Glue ETL
  - Amazon S3
  - Amazon QuickSight
domains:
  - D3
  - D4
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/whitepapers/latest/big-data-analytics-options/amazon-athena.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/partition-projection.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/capacity-management-editing-capacity-reservations.html"
  - "https://docs.aws.amazon.com/athena/latest/APIReference/API_CapacityReservation.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-athena-one-minute-capacity-reservations"
  - "https://docs.aws.amazon.com/athena/latest/ug/capacity-management-requirements.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/capacity-management-control-capacity-usage.html"
---

## Die Grundidee zuerst

Stell dir zwei Archive vor, in denen dieselben Papiere liegen.

**Archiv eins:** Alles liegt in Umzugskisten. Die Kisten sind nicht beschriftet, die Blätter darin nicht sortiert, und auf jedem Blatt stehen zwölf Angaben nebeneinander. Du willst wissen, wie viel Diesel die Fahrzeuge im Depot Kassel im Juni verbraucht haben. Du hast keine Wahl: Du trägst jede Kiste heraus, öffnest sie, liest jedes Blatt ganz durch und legst die drei Blätter beiseite, die passen. Nach vier Stunden hast du deine Antwort. Für die nächste Frage fängst du wieder von vorn an.

**Archiv zwei:** Dieselben Papiere, aber jede Kiste trägt einen Monat auf dem Deckel, und die zwölf Angaben stehen nicht nebeneinander auf einem Blatt, sondern jede in einem eigenen Ordner. Dieselbe Frage: Du gehst zur Kiste „Juni", ziehst den Ordner „Verbrauch", liest die Spalte. Zehn Minuten.

Es ist derselbe Bestand, dieselbe Frage, dieselbe Antwort. Was sich geändert hat, ist ausschließlich **wie die Papiere liegen**.

Das ist die ganze Karte. Athena rechnet nicht ab, wie klug deine Frage formuliert war, sondern **wie viele Blätter es anfassen musste, um sie zu beantworten**. Wer Athena teuer findet, hat fast immer ein Archiv der ersten Sorte.

## Was es eigentlich ist — eine Tabelle ohne Datenbank

Athena hat keinen Speicher. Es gibt keine Datenbank, in die du etwas lädst. Was du anlegst, ist eine **Beschreibung von Dateien, die schon da sind**:

```sql
CREATE EXTERNAL TABLE telematik (
  fahrzeug_id  string,
  zeitpunkt    timestamp,
  verbrauch_l  double,
  fehlercode   string,
  depot        string
)
PARTITIONED BY (dt string)
STORED AS PARQUET
LOCATION 's3://falkendorf-lake/kuratiert/telematik/'
```

Lies das von unten nach oben, dann ergibt es Sinn. `LOCATION` sagt, wo die Dateien liegen — es ist ein S3-Präfix, kein Tabellenname. `STORED AS PARQUET` sagt, wie sie aufgebaut sind. `PARTITIONED BY (dt string)` sagt, dass unterhalb des Präfixes Verzeichnisse der Form `dt=2026-07-19/` liegen. Der Rest ist die Spaltenliste.

Nichts davon bewegt ein einziges Byte. Es entsteht kein Speicher, keine Kopie, keine Ladezeit. **Du hast eine Landkarte gezeichnet, kein Gebäude gebaut.**

Und weil es nur eine Landkarte ist, kann sie jeder benutzen, der sie lesen kann — genau das steht auf der Karte im Katalog-Kasten: ein Schema für Athena, Spectrum und EMR.

## Der Weg durch die Karte

### Der Kasten links — Falkendorf Logistik und die Frage, die nicht gestellt wurde

Zwölftausend Fahrzeuge senden Position, Verbrauch und Fehlercodes. Das landet als JSON in S3, rund 3 TB. Das Controlling will **ein paar Mal pro Woche** etwas wissen.

Diese letzte Angabe ist die eigentliche Aufgabe. Ein Data Warehouse würde die Fragen schneller beantworten — aber es liefe auch nachts, sonntags und in der Woche, in der niemand fragt. Bei zwei Abfragen pro Woche zahlst du den Cluster für 166 Stunden Nichtstun.

Die Prüfung schreibt diesen Satz gern als *„the team only runs a few queries per week"* oder *„ad-hoc analysis without loading into a data warehouse"*. Er ist kein Beiwerk. Er ist die Antwort.

### Badge 1 und die S3-Rohzone — der Zustand, in dem Daten ankommen

JSON, unpartitioniert, viele kleine Dateien. Das ist kein Versäumnis, das ist der Normalfall: So kommt Telemetrie an, weil der Sender nichts über Abfragen weiß.

JSON hat für Athena zwei Eigenschaften, die zusammen teuer werden. Es ist **zeilenweise** gespeichert — um eine Spalte zu lesen, muss die ganze Zeile gelesen werden. Und es ist **unkomprimiert lesbar**, also groß.

Das Bild dazu: Ein Brief, in dem alle zwölf Angaben in einem Fließtext stehen. Du kannst nicht nur den Verbrauch lesen. Du liest den Brief.

### Badge 2 und der Glue-ETL-Kasten — der gestrichelte Rand ist die Aussage

Der Glue-Job wandelt nach **Parquet** und legt nach Tag partitioniert ab. Zwei Dinge, die zwei verschiedene Probleme lösen.

Parquet ist spaltenweise: Athena liest nur die Spalten aus dem `SELECT`. Die Partitionierung ist grober und wirkt früher — ein `WHERE dt = '2026-06-15'` lässt Athena ganze Verzeichnisse überspringen, ohne sie zu öffnen.

Der **gestrichelte Rand** des Kastens sagt: Dieser Job existiert nicht dauerhaft. Er läuft, macht seine Arbeit und ist wieder weg. Das unterscheidet ihn vom Katalog daneben, der durchgezogen gezeichnet ist, weil er permanent ist.

### Der S3-Kuratiert-Kasten — 0,33 TB statt 3 TB

Aus 3 TB werden 0,33 TB gescannt. **Diese Zahl ist ein gerechnetes Beispiel, kein Messwert** — sie steht so auf der Karte und die `.md` sagt es dazu.

Was daran verlässlich ist, ist die Größenordnung: AWS nennt für Komprimierung, Partitionierung und Spaltenformat zusammen eine Ersparnis von 30 % bis 90 % pro Abfrage. Der Faktor zehn liegt am oberen Rand dieser Spanne und setzt voraus, dass die Abfrage tatsächlich wenige Spalten und einen Partitionsfilter benutzt.

Was daran **nicht** verlässlich ist: dein Fall. Bei einer Tabelle mit drei Spalten holt der Spaltenschnitt wenig. Bei einer mit vierzig holt er fast alles.

### Badge 3 und 4 und der Glue Data Catalog — Zeiger, nicht Zeilen

Der Katalog nimmt auf, was der ETL-Job erzeugt hat: Tabellen, Spalten, Datentypen, Partitionen. Beim Planen der Abfrage liest Athena ihn zurück — daher die zwei Pfeile.

Der Satz auf der Karte, der am meisten trägt: **Metadaten, keine Daten.** Der Katalog speichert Zeiger, nicht Zeilen. Er weiß, dass unter `dt=2026-06-15/` etwas liegt und wie es aufgebaut ist. Er weiß nicht, was drinsteht.

Das Bild: ein Bibliotheksregister. Es sagt dir, in welchem Regal welches Buch steht. Es enthält keine Bücher.

Daraus folgt die Prüfungsantwort auf *„a central metadata repository"*: der Katalog. Und auf *„transform the data before analysis"*: Glue ETL. Zwei Dinge, ein Produktname.

### Badge 5 und der Athena-Kasten — gescannte Bytes, nicht gelieferte Zeilen

Serverless heißt hier wörtlich: Es gibt keine Kapazität, die du vorher wählst, und nichts, das zwischen den Abfragen läuft.

Abgerechnet wird nach **gescannten Bytes**, aufgerundet auf das nächste Megabyte, mit **10 MB Mindestmenge je Abfrage**, zu 5 USD je TB. Für DDL-Anweisungen wie `CREATE`, `ALTER` und `DROP TABLE`, für Anweisungen zur Partitionsverwaltung und für fehlgeschlagene Abfragen fallen keine Gebühren an.

Der Satz, den du dir merken musst, weil er drei Distraktoren erschlägt: **Die Kosten hängen an dem, was gelesen wurde, nicht an dem, was zurückkam.** Ein `SELECT ... LIMIT 10` auf eine unpartitionierte Tabelle liefert zehn Zeilen und kostet den vollen Scan.

### Badge 6 und QuickSight — der verkürzte Rückweg

Das Ergebnis geht nach QuickSight. Im Diagramm ist das ein direkter Pfeil, tatsächlich schreibt Athena zuerst in einen S3-Ergebnisbucket, aus dem das BI-Werkzeug liest.

Diese Verkürzung ist auf der Karte bewusst und in der `.md` notiert. Sie hat eine Nebenfolge, die unten im goldenen Kasten wieder auftaucht: Die Ergebnisse in S3 kosten Speicher, und niemand räumt sie automatisch weg.

### Das rote X — `SELECT *` auf die Rohzone

Der gestrichelte rote Kasten oben zeigt dieselbe fachliche Frage, gestellt an das falsche Archiv: kein Spaltenschnitt, kein Partitionsfilter, die vollen 3 TB.

Das Entscheidende daran ist, dass die Abfrage **nicht kaputt** ist. Sie ist syntaktisch gültig, sie läuft durch, sie liefert das richtige Ergebnis. Sie kostet nur das Neunfache. Es gibt keine Fehlermeldung, die dich darauf hinweist — nur eine Zeile in der Rechnung, drei Wochen später.

### Der Partition-Projection-Kasten — und wo er nicht wirkt

Partition Projection berechnet die Partitionswerte aus der Tabellenkonfiguration, statt sie im Katalog nachzuschlagen. Bei sehr vielen Partitionen spart das den `GetPartitions`-Aufruf und beschleunigt die Planung.

Die dritte Zeile im Kasten ist die ehrliche: **schlechter bei vielen leeren Partitionen.** Sind mehr als die Hälfte der projizierten Partitionen leer, empfiehlt AWS ausdrücklich die klassischen Partitionen — Athena projiziert dann Pfade, hinter denen nichts liegt, und läuft die vergeblich ab. Abfragen jenseits des konfigurierten Bereichs geben übrigens keinen Fehler, sondern null Zeilen zurück.

**Was auf der Karte nicht steht und direkt daneben stehen müsste:** Partition Projection wirkt **nur, wenn die Tabelle über Athena abgefragt wird**. Liest Redshift Spectrum, Athena for Spark oder EMR dieselbe Tabelle, gelten wieder die normalen Katalog-Partitionsmetadaten. Der Kasten steht auf der Karte unmittelbar neben der Zeile „ein Schema für Athena, Spectrum und EMR" — und ist genau die Ausnahme davon.

### Der goldene Kasten — was nicht unter „Athena" auftaucht

S3-GET-Requests für jede einzelne Datei, Glue-Data-Catalog-Requests, die Speicherung der Ergebnisse. Nichts davon erscheint in der Athena-Zeile der Rechnung.

**Viele kleine Dateien sind das zweite Layout-Problem neben fehlender Partitionierung.** Ein Data Lake aus zwei Millionen 40-KB-Dateien erzeugt zwei Millionen GET-Requests je vollem Scan — bei einer harmlos aussehenden Athena-Zeile und einer unangenehmen S3-Zeile.

### Die Merksätze-Fußzeile

Vier Sätze, von denen drei bereits gefallen sind. Der vierte — *Spectrum braucht einen Cluster* — ist die Abgrenzung, die gleich als Tabelle kommt.

## Die entscheidende Unterscheidung

| | Athena | Redshift Spectrum |
|---|---|---|
| Rechenumgebung | serverless, keine | ein **laufender** Redshift-Cluster ist Voraussetzung |
| Abrechnung | je gescanntem TB | Cluster-Kosten **plus** je gescanntem TB |
| Typischer Fall | seltene Ad-hoc-Abfragen | S3-Daten mit Warehouse-Tabellen **joinen** |
| Ohne Cluster nutzbar | ja | nein |
| Glue Data Catalog | derselbe | derselbe |

Die letzte Zeile erklärt die Verwechslung: Beide lesen dieselben Dateien über dasselbe Schema. Der Unterschied liegt ausschließlich darin, **wo gerechnet wird**.

**Auf der Karte steht dazu nichts Falsches — aber `battle_card_40.md` verweist auf „Karte 26 (Redshift Spectrum)". Karte 26 ist Neptune.** Und Redshift Spectrum hat überhaupt keine eigene Karte: Der Masterplan führt unter Nummer 60 Redshift **Serverless**, Spectrum kommt in der Liste nicht vor. Der Fixvorschlag für die `.md` ist deshalb nicht „Nummer korrigieren", sondern den Verweis streichen und die Abgrenzung stehen lassen, wie sie hier steht — sie trägt sich selbst.

## Die ehrliche Feinheit

**Fehlgeschlagen ist nicht abgebrochen.** Für fehlgeschlagene Abfragen zahlst du nichts. Für **abgebrochene** Abfragen zahlst du nach der bis dahin gescannten Datenmenge. Auf der Karte steht nur die erste Hälfte. Wer eine 4-TB-Abfrage nach zwei Minuten abbricht, weil er den Filter vergessen hat, hat trotzdem gescannt. Das ist keine Kartenkorrektur — die Zeile ist richtig, sie ist nur nicht vollständig.

**Der Preis pro TB ist stabil, die Reservierungen sind es nicht.** `battle_card_40.md` enthält einen Nachrecherche-Block, der behauptet, seit dem 10.02.2026 seien 4 DPUs und 1 Minute das Minimum je Capacity Reservation, belegt durch die Doku-Seite *Manage query processing capacity*. **Die Doku-Seite sagt das nicht.** Die 4 steht dort in einem anderen Zusammenhang: als Min/Max-DPU **pro Abfrage** (Werte zwischen 4 und 124) und als Verbrauch einer DDL-Abfrage. Die Seite *Edit capacity reservations* nennt weiterhin **24 DPUs als Minimum je Reservierung**, und die API-Referenz gibt für `TargetDpus` ebenfalls einen Mindestwert von 24 an.

Die Ankündigung vom 10.02.2026 trägt die Aussage dagegen tatsächlich: 1-Minuten-Reservierungen und 4 DPUs Mindestkapazität für alle Reservierungen. **Damit stehen zwei AWS-Primärquellen gegeneinander** — die Ankündigung gegen User Guide und API-Referenz. Für die Prüfung ist das ohne Folgen, weil keine dieser Zahlen auf der Karte steht und Capacity Reservations kein SAA-C03-Stoff sind. Für die `.md` ist es ein Fehler: Die Belegkette stimmt nicht, und die Widersprüchlichkeit wird nicht benannt. Der Dollarwert je DPU-Stunde ist ohnehin nicht belegbar — im Umlauf sind mindestens drei verschiedene Werte, keiner davon aus einer AWS-Primärquelle.

**Warum hier überhaupt Zahlen auf der Karte stehen dürfen.** Das Szenario nennt keine Region. Wäre `eu-central-1` genannt, wäre jede aus einer US-Preisangabe abgeleitete Zahl ein Fehler, und die 15 USD im roten Kasten würden ihn erben. So bleibt es eine Größenordnung mit einem Verhältnis — und das Verhältnis ist die Aussage, nicht der Betrag.

## Syntax lesen — das Hive-Layout und die zwei Wege, es bekannt zu machen

Auf der Karte steht im kuratierten Kasten eine unscheinbare Zeile: `dt=2026-07-19/`. Sie ist kein Beispielpfad, sie ist eine Konvention mit Namen.

```text
s3://falkendorf-lake/kuratiert/telematik/
                     └─ dt=2026-07-17/   part-0000.snappy.parquet
                     └─ dt=2026-07-18/   part-0000.snappy.parquet
                     └─ dt=2026-07-19/   part-0000.snappy.parquet
                        │  │
                        │  └── Wert der Partitionsspalte
                        └───── Name der Partitionsspalte
```

Der Doppelname im Verzeichnis — `spalte=wert` — heißt **Hive-Layout**. Steht er so da, kann Athena die Partitionen selbst finden:

```sql
MSCK REPAIR TABLE telematik
```

Diese eine Anweisung liest das Präfix ab, erkennt alle `dt=…`-Verzeichnisse und trägt sie in den Katalog ein. Sie ist DDL, kostet also nichts nach gescannten Bytes.

Liegen die Daten anders — etwa unter `2026/07/19/` ohne Spaltennamen —, funktioniert das nicht. Dann bleibt nur der Weg je Partition:

```sql
ALTER TABLE telematik ADD PARTITION (dt='2026-07-19')
LOCATION 's3://falkendorf-lake/kuratiert/telematik/2026/07/19/'
```

Bei einem Tag ist das ein Einzeiler. Bei drei Jahren Rückstand sind es tausend Anweisungen aus einem Skript. **Deshalb entscheidet das Verzeichnislayout, das der ETL-Job schreibt, über den Betriebsaufwand der nächsten Jahre** — und deshalb steht die Zeile auf der Karte.

## Was du dadurch nicht baust

- **Keine Anwendungsdatenbank.** Keine Sub-Sekunden-Latenz, keine hohe Nebenläufigkeit für Nutzerabfragen. Für *„a dashboard used by hundreds of users"* ist Athena die falsche Antwort.
- **Keine Transaktionen.** Kein `UPDATE ... WHERE` auf einzelne Zeilen im klassischen Sinn, kein Rollback über mehrere Anweisungen.
- **Keine Datenkopie.** Löscht jemand das S3-Präfix, ist die Tabelle leer. Der Katalog merkt davon nichts und meldet auch nichts — die Abfrage gibt null Zeilen zurück.
- **Keine feingranularen Rechte.** Zugriffskontrolle auf Spalten- und Zeilenebene läuft über Lake Formation, das auf dieser Karte fehlt.
- **Keine automatische Pflege.** Kompaktierung kleiner Dateien und Aufräumen alter Partitionen macht niemand für dich.

## Wenn du dir eine Sache merkst

**Athena zahlt gescannte Bytes — die Kosten entstehen im Speicherlayout, nicht in der SQL-Syntax.**

Wer Athena optimieren soll, ändert Format und Partitionierung, nicht die Abfrage. *Redshift Spectrum* fällt, wo kein Cluster existiert. *Glue ETL* fällt bei der Frage nach einem Metadatenspeicher, weil ETL Daten bewegt und der Katalog sie nur beschreibt. *EMR* fällt bei „ein paar Abfragen pro Woche", weil du dafür einen Cluster betreiben müsstest.

## Prüfungsknackpunkte

**Signalwörter:** *query data in S3 using standard SQL*, *no infrastructure to manage, pay per query*, *reduce the amount of data scanned*, *ad-hoc analysis without loading into a data warehouse*, *only a few queries per week*.

**Warum Redshift Spectrum hier verliert:** Es setzt einen laufenden Cluster voraus. Sobald in der Aufgabe kein Redshift existiert oder ausdrücklich keine Fixkosten gewünscht sind, ist Spectrum ausgeschlossen — nicht weil es schlechter wäre, sondern weil die Voraussetzung fehlt.

**Warum Glue ETL als Antwort auf „zentrales Metadaten-Repository" verliert:** ETL sind Spark-Jobs, die Daten bewegen und nach DPU-Stunden kosten. Gefragt ist der Katalog, der passiv und billig ist.

**Warum „die Query umschreiben" als Kostenmaßnahme verliert:** Solange Format und Partitionierung gleich bleiben, ändert sich die gescannte Datenmenge kaum. Die richtige Antwort nennt Parquet oder ORC, Partitionierung, Komprimierung.

**Warum der Crawler nicht die Antwort auf „Schema anlegen" sein muss:** Er ist bequem, aber optional — Tabellen lassen sich per DDL selbst anlegen. Wo die Aufgabe Kostenkontrolle betont, ist ein regelmäßig laufender Crawler eher Teil des Problems.

**Warum EMR bei niedriger Abfragefrequenz verliert:** Dieselbe Logik wie beim Warehouse. EMR lohnt sich, wenn dauerhaft gerechnet wird, nicht wenn zweimal pro Woche gefragt wird.
