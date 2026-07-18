---
nr: 27
title: "Timestream — IoT-Zeitreihen zwischen Prüfungsstand und Produktstand"
services:
  - Amazon Timestream for LiveAnalytics
  - Amazon Timestream for InfluxDB
  - AWS IoT Core
signalwords:
  - time-series data
  - IoT sensor readings, telemetry
  - millions of data points per minute
  - query by time window
  - recent data fast, historical data cheap
  - data lifecycle, retention tiers
domains: [D3, D4]
assets:
  png: battle_card_27.png
  pdf: battle_card_27.pdf
  svg: battle_card_27.svg
status_note: >
  QC-Skript (gepatchte Fassung): 0 Befunde — 9 Boxen, 62 Texte, 21 Segmente,
  7 Badges. Alle Palettenfarben im PNG nachweisbar, fünf definierte Freizonen
  rein weiß. SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT MÖGLICH (Regel F9) —
  liegt bei Oktay.
---

# Battle Card 27 — Amazon Timestream

## Szenario

**Nordwerk Antriebstechnik**, Hersteller von Industriegetrieben, betreibt
**40.000 Maschinen** bei Kunden im Feld. Jede meldet Temperatur, Druck und
Vibration im Sekundentakt — zusammen rund **3 Mio. Messwerte pro Minute**.

Zwei Zugriffsmuster, die einander widersprechen:

1. **Die Leitwarte** fragt „Was hat Maschine 4711 in den letzten zehn Minuten
   gemeldet?" — kleine Datenmenge, muss in Millisekunden da sein.
2. **Die Konstruktion** fragt „Wie verlief die Lagertemperatur aller Getriebe
   der Baureihe X über drei Jahre?" — Terabytes, darf Sekunden dauern, muss
   aber bezahlbar bleiben.

Beides in einem Speicher zu halten ist entweder zu teuer oder zu langsam.
Genau dafür gibt es Zeitreihen-Datenbanken.

## Ablauf

**1 — Sensoren → IoT Core**
40.000 Geräte sprechen MQTT gegen AWS IoT Core. MQTT ist für Geräte mit wenig
Strom und wackeliger Verbindung gebaut — ein HTTP-Request pro Messwert wäre
bei dieser Frequenz Verschwendung.

**2 — IoT Core → Memory Store (Prüfungspfad)**
Eine **Rule Action** in IoT Core schreibt direkt nach Timestream. Kein Lambda,
kein eigener Code dazwischen. Das ist das Prüfungsmuster: IoT Core routet per
Regel in die Zieldatenbank.

**3 — IoT Core → Timestream for InfluxDB (Realitätspfad)**
Dieselbe Quelle, dieselbe Regel — nur ein anderes Ziel. Die Zone unten zeigt,
was ein Team heute tatsächlich aufsetzen würde.

**4 — Memory Store → Magnetic Store**
Der Memory Store ist auf hohen Schreibdurchsatz und schnelle Punktabfragen
optimiert. Nach Ablauf seiner Retention wandern die Daten **automatisch** in
den Magnetic Store — kein Archivierungsjob, keine Lambda, keine
Lifecycle-Regel von Hand. Genau das ist der Verkaufsgrund: Der Dienst nimmt
einem das Data-Lifecycle-Management ab.

**5 — Magnetic Store → SQL-Abfrage**
Der Magnetic Store ist auf spät eintreffende Schreibvorgänge mit geringerem
Durchsatz, Langzeitspeicherung und schnelle analytische Abfragen optimiert.
Hier landet die Drei-Jahres-Frage der Konstruktion.

**6 — Memory Store → dieselbe Abfrage**
Der gestrichelte Pfeil ist der eigentliche Trick: Die **adaptive Query-Engine**
greift über beide Speicherstufen hinweg zu, ohne dass man den Speicherort
angeben muss. Es gibt **kein** `FROM memory_store` — man schreibt eine
SQL-Abfrage über den Zeitraum, und die Engine entscheidet, wo sie liest.

**7 — InfluxDB → SQL / InfluxQL**
Der Realitätspfad endet ebenfalls bei SQL und Grafana — aber mit einer
anderen Abfragesprache und einem anderen Betriebsmodell.

## Prüfungs-Kernsatz

> **Bei Zeitreihen ist die Zeit nicht eine Spalte unter vielen, sondern der
> Index. Wo „Millionen Messwerte pro Minute" und „Abfrage nach Zeitfenster"
> zusammen auftreten, lautet die Antwort Timestream.**

Merkhilfe für die zwei Stufen: Der Memory Store ist die Werkbank — teuer pro
Quadratmeter, aber alles liegt griffbereit. Der Magnetic Store ist das
Regallager — billig, etwas langsamer, und man geht selten hin.

## 🔴 Die zentrale Divergenz: Prüfungsrealität ≠ Produktrealität

**AWS hat den Neukundenzugang zu Timestream for LiveAnalytics zum
20.06.2025 geschlossen.**

| | Prüfungsrealität | Produktrealität |
|---|---|---|
| Erwartete Antwort | „Amazon Timestream" | LiveAnalytics nur noch für Bestandskunden |
| Architektur | serverless, Memory + Magnetic Store, SQL | Timestream for InfluxDB, InfluxDB 3, Instanzen |
| Abfragesprache | SQL | SQL **und** InfluxQL |
| Empfehlung von AWS | — | Neukunden sollen InfluxDB evaluieren |

**Wichtige Präzisierung, damit die Karte nicht überzeichnet:** Bestehende
Workloads sind nicht betroffen, AWS investiert weiter in Sicherheit,
Verfügbarkeit und Performance, und Bestandskunden mit aktivem Payer-Account
dürfen weiterhin neue Nutzer und Linked Accounts anlegen. LiveAnalytics ist
**nicht abgeschaltet** — es ist geschlossen für Neukunden.

**Für die Prüfung heißt das:** Antworte weiter „Timestream". Die SAA-C03-Frage
zielt auf das Muster „Zeitreihen brauchen eine Zeitreihen-Datenbank", nicht
auf den Vertriebsstatus. Der zweite Teil ist Praxiswissen — und der Grund,
warum diese Karte zwei Zonen hat.

## Klassiker-Fallen

**1. „DynamoDB kann das auch, mit Sortierschlüssel = Zeitstempel."**
Technisch ja, wirtschaftlich nein. DynamoDB rechnet pro Schreibvorgang und
kennt **kein automatisches Tiering** — heiße und kalte Daten kosten dasselbe.
Es gibt keine eingebauten Zeitreihenfunktionen (Interpolation, gleitende
Fenster, Zeitraum-Aggregate), und Retention gibt es nur als TTL, das löscht,
statt zu verbilligen. Prüfungssignal für DynamoDB ist der **Zugriff über einen
Schlüssel**, für Timestream das **Zeitfenster**.

**2. „Die Abfrage muss wissen, in welcher Stufe die Daten liegen."**
Nein — die adaptive Query-Engine kombiniert beide Stufen ohne Ortsangabe. Ein
Distraktor, der zwei getrennte Abfragen oder einen Union baut, ist falsch.

**3. Spät eintreffende Messwerte — die Falle, die im Diagramm fehlt.**
Ein Sensor war zwei Tage offline und liefert jetzt Werte mit altem
Zeitstempel. Liegt der Zeitstempel **vor** der Memory-Store-Retention, wird
der Schreibvorgang abgelehnt — es sei denn, die Tabelle hat
`EnableMagneticStoreWrites` gesetzt. Dann nimmt sie Daten an, die älter als
die Memory-Retention, aber jünger als die Magnetic-Retention sind. Bei IoT mit
zeitweiliger Konnektivität ist das kein Randfall, sondern der Normalfall.

**4. Retention ist kein Backup.**
Läuft die Magnetic-Retention ab, sind die Daten weg. Wer zehn Jahre
aufbewahren muss, setzt entweder die Retention entsprechend oder exportiert
nach S3.

**5. „Scheduled Queries sind nur eine Bequemlichkeit."**
Sie sind ein Kostenwerkzeug. Sie berechnen Aggregate vorab und schreiben sie
in abgeleitete Tabellen mit **eigener, entkoppelter Retention**. Damit kann
die Quelltabelle kurz aufbewahren, während die Aggregate lange bleiben — zu
einem Bruchteil der Speicherkosten. Ein Dashboard, das dieselbe Aggregation
bei jedem Aufruf neu rechnet, zahlt jedes Mal für den Scan.

## Abgrenzung

| Frageform | Antwort | Warum nicht das andere |
|---|---|---|
| „Millionen Messwerte pro Minute", „Abfrage nach Zeitfenster", „heiße und kalte Daten" | **Timestream** | Zeit ist der Index, Tiering ist eingebaut |
| „Key-Value", „single-digit millisecond", „Partition Key" | **DynamoDB** (Karte 21/25) | Zugriff über Schlüssel, kein Tiering |
| „Beziehungen", „wer kennt wen", „mehrere Hops" | **Neptune** (Karte 26) | Die Verbindung ist das Gesuchte |
| „Volltextsuche über Logs", „Kibana-Dashboards" | **OpenSearch** (Karte 54) | Suche im Text, nicht Aggregation über die Zeit |
| „Streaming-Puffer mit Replay, mehrere Konsumenten" | **Kinesis Data Streams** (Karte 51) | Transport, keine Datenbank |

## Bewusste Vereinfachungen im Diagramm

- **Scheduled Queries und abgeleitete Tabellen fehlen.** Die Entscheidung für
  zwei gleichwertige Zonen hat den Platz gekostet; der Mechanismus steht oben
  als Falle 5.
- **`EnableMagneticStoreWrites` fehlt** — Falle 3, aus demselben Grund.
- **Die AZ-Replikation ist nicht gezeichnet.** Beide Speicherstufen werden
  automatisch über mehrere Availability Zones innerhalb einer Region
  repliziert; ein Balken pro AZ hätte die Zonenlogik der Karte gestört.
- **Kinesis, MSK und Telegraf als Alternativen zu IoT Core fehlen.** Die Karte
  zeigt einen Ingestion-Weg, nicht alle vier.
- **Der Realitätspfad ist verkürzt.** InfluxDB 3 bringt Cluster, S3-basierten
  Objektspeicher und die Aufteilung in Core und Enterprise mit — auf der Karte
  steht nur, was für die Abgrenzung zählt.
- **Pfeil 3 hat kein Label.** Er trägt dieselbe Aussage wie Pfeil 2; ein
  zweites „Rule Action" hätte nur Fläche gekostet.

## Farbkonvention

Keine neue Kategorie in dieser Karte, nur bestehende:

- **Lila = In-Memory-Schicht** (Memory Store) — dieselbe Zuordnung wie DAX auf
  Karte 21 und ElastiCache auf Karte 24, und hier fachlich exakt zutreffend.
- **Grün = Storage** (Magnetic Store) — die günstige Langzeitstufe.
- **Blau = Consumer** (Abfrage, Dashboard, Sensoren als Quelle).
- **Orange = Ingestion und aktive Verarbeitung** (IoT Core, Timestream for
  InfluxDB).
- **Grau gestrichelt = passiv** (Bestandskunden-Hinweis).
- **Zonen** in dünn gestricheltem Grau nach Stil-Guide §4.

## Faktencheck-Quellen (geprüft 18.07.2026)

- AWS-Doku, „Amazon Timestream for LiveAnalytics availability change" —
  Schließung für Neukunden zum 20.06.2025, Bestandsregelung, Empfehlung
  Timestream for InfluxDB
- AWS-Doku, Document History Timestream — Ankündigung vom 20.05.2025
- AWS-Doku, „Storage" — Memory Store und Magnetic Store, AZ-Replikation
- AWS-Doku, `RetentionProperties` — Memory Store 1–8.766 Stunden,
  Magnetic Store 1–73.000 Tage
- AWS-Doku, „Configuring Amazon Timestream for LiveAnalytics" —
  late-arriving data, `EnableMagneticStoreWrites`
- AWS-Doku, „Using scheduled queries" — abgeleitete Tabellen, entkoppelte
  Retention, Ingestion über Kinesis, MSK, IoT Core, Telegraf
- Amazon Timestream FAQs — adaptive Query-Engine, Abrechnung nach
  Schreibvorgängen, Speicher und gescannter Datenmenge
