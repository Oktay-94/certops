---
nr: 29
title: "DocumentDB — MongoDB-Workload managed betreiben, ohne die Anwendung umzuschreiben"
services:
  - Amazon DocumentDB
  - AWS DMS
signalwords:
  - MongoDB-compatible
  - JSON documents, flexible schema
  - lift and shift without rewriting the application
  - reduce operational overhead of self-managed database
  - existing MongoDB drivers
  - millions of reads and writes per second
domains: [D2, D3]
assets:
  png: battle_card_29.png
  pdf: battle_card_29.pdf
  svg: battle_card_29.svg
status_note: >
  QC-Skript (gepatchte Fassung): 0 Befunde — 9 Boxen, 49 Texte, 17 Segmente,
  4 Badges. Footer nach Kürzung 1353 px (Stil-Guide-Limit ~1420; die erste
  Fassung lag bei 1438 px und wurde von qc.py NICHT beanstandet, weil das
  Skript gegen die Leistenbreite prüft, nicht gegen die Guide-Regel). Alle
  Palettenfarben im PNG nachweisbar, fünf definierte Freizonen rein weiß.
  SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT MÖGLICH (Regel F9) — liegt bei Oktay.
---

# Battle Card 29 — Amazon DocumentDB

## Szenario

**Wildbach Outdoor**, Onlinehändler für Bergsportausrüstung. Der
Produktkatalog liegt seit sieben Jahren in einem selbst betriebenen
**MongoDB Replica Set** im eigenen Rechenzentrum — drei Knoten, 1,4 TB
Bestell- und Katalogdaten, Version 5.0.

Das Datenmodell ist der Grund, warum es MongoDB wurde und bleiben soll: Ein
Zelt hat Packmaß und Wassersäule, ein Kletterseil hat Durchmesser und
Sturzzahl, ein Schuh hat Größentabellen. Jede Kategorie hat andere Felder.
In einer relationalen Tabelle wäre das entweder eine Wand aus NULL-Spalten
oder ein Entity-Attribute-Value-Muster, das keine Abfrage mehr lesbar macht.

Das Problem ist nicht die Datenbank, sondern der **Betrieb**: eigene Patches,
eigene Backups, eigenes Failover-Testen, und ein Team von vier Leuten, das
lieber Features baut. Die Anwendung soll dabei **nicht angefasst** werden.

## Ablauf

**1 — MongoDB → DMS**
AWS DMS liest aus dem bestehenden Replica Set. Wichtig: Das ist eine
**homogene** Migration, Dokumentmodell zu Dokumentmodell. Ein Schema
Conversion Tool wird hier **nicht** gebraucht — das ist die Brücke zu
Karte 72, wo genau diese Unterscheidung die Frage ist.

**2 — DMS → Primary Instance**
Der Ladelauf läuft als **Full Load plus CDC**: Erst wandert der Bestand,
danach hält Change Data Capture die Zielseite aktuell, während das Altsystem
weiterläuft. Die Umstellung ist dadurch ein Endpoint-Wechsel, kein
Wochenendprojekt.

**3 — Primary → Cluster-Volume**
Hier liegt die eigentliche Architektur. DocumentDB trennt **Compute und
Storage**: Die Instanzen rechnen, das Cluster-Volume speichert. Bei
instanzbasierten Clustern wächst das Volumen automatisch in **10-GB-Schritten
bis maximal 128 TiB** — es wird kein Speicher auf Vorrat provisioniert.

**Das Volume ist geteilt** — der gestrichelte Pfeil zurück zu den Replicas
zeigt es: Die Read Replicas halten **keine eigene Kopie**. Sie lesen aus
demselben Volume. Deshalb ist eine neue Replica in Minuten da statt in Stunden,
und deshalb gibt es hier keinen Replikationsverzug im klassischen Sinn. **Bis
zu 15 Replica-Instanzen** erhöhen den Lesedurchsatz.

**4 — App → Cluster-Endpoint**
Die Anwendung behält ihren MongoDB-Treiber. Geändert wird der
Connection-String — Cluster-Endpoint für Schreibzugriffe, Reader-Endpoint für
Lesezugriffe. Das ist der ganze Eingriff, und genau das ist die
Prüfungsantwort.

## Prüfungs-Kernsatz

> **DocumentDB ist die Antwort, wenn eine bestehende MongoDB-Anwendung managed
> laufen soll, ohne umgeschrieben zu werden. Das Signalwort ist nicht „NoSQL",
> sondern „MongoDB-kompatibel" oder „bestehende Treiber".**

Merkhilfe: DocumentDB ist nicht MongoDB, sondern **spricht MongoDB**. Wie
jemand, der fließend Deutsch spricht, aber in Lissabon aufgewachsen ist — man
versteht sich, bis es an Dialekt und Redewendungen geht.

## 🔴 Pflicht-Abgrenzung: 29 ↔ 26 (Dokument vs. Graph)

Beides ist „nicht-relational und managed". Die Prüfung unterscheidet über die
**Frageform**, nicht über das Buzzword:

| Was die Frage sucht | Modell | Antwort |
|---|---|---|
| Struktur **innerhalb** eines Datensatzes — verschachtelte Felder, unterschiedliche Attribute je Kategorie, flexibles Schema | **Dokument** | DocumentDB |
| Verbindung **zwischen** Datensätzen — „wer kennt wen", mehrere Hops, Ringe, Empfehlungen | **Graph** | Neptune (Karte 26) |

**Der entscheidende Satz:** In DocumentDB ist ein Verweis auf ein anderes
Dokument ein **Feld mit einer ID** — die Anwendung muss selbst nachladen und
selbst verknüpfen. In Neptune ist die Kante ein **eigenständiges Objekt**, das
man traversieren, zählen und gewichten kann.

Praktischer Test an einer Prüfungsfrage: Steht dort „für jedes Produkt andere
Attribute" → Dokument. Steht dort „über bis zu vier Zwischenschritte
verbunden" → Graph. Steht beides, gewinnt die Frage nach der Verbindung, denn
ein Graph kann Dokumente halten, aber ein Dokumentspeicher traversiert nicht.

## Klassiker-Fallen

**1. „Lift ohne Code-Änderung" — die Behauptung mit Fußnote.**
DocumentDB implementiert die **MongoDB-API**, nicht die MongoDB-Engine. Nicht
jeder Operator und nicht jedes Verhalten ist abgedeckt; AWS pflegt eine
eigene Liste unterstützter APIs, Operationen und Datentypen. Der beste Beleg
dafür, dass Lücken real sind: **Version 8.0.1 hat Unterstützung für 46
weitere MongoDB-Operatoren ergänzt.** Wer nachreicht, hatte vorher nicht alles.

**Für die Prüfung** bleibt „ohne Anwendungsänderung migrieren" die erwartete
Antwort. **Für die Praxis** gilt: Kompatibilität gegen die Liste prüfen, nicht
annehmen. Genau deshalb steht die rote gestrichelte Box auf der Karte.

**2. Die Versionsangaben im Kursmaterial sind überholt.**
Verbreitet ist „DocumentDB ist kompatibel mit MongoDB 3.6, 4.0 und 5.0".
Aktuell: **Version 8.0** bringt Kompatibilität mit den MongoDB-API-Versionen
**6.0, 7.0 und 8.0**, dazu bis zu **7x bessere Query-Latenz** und bis zu **5x
bessere Kompression**. Das **In-place-Upgrade von 5.0 auf 8.0** läuft ohne
neue Cluster, ohne Endpoint-Wechsel und ohne Index-Neuaufbau. Der
Standard-Support für Version 3.6 endete am **30.03.2026**; danach greift
Extended Support mit Zusatzkosten.

**3. Serverless und Elastic Clusters fehlen im Kursmaterial komplett.**
- **DocumentDB Serverless** skaliert automatisch in feinen Schritten und ist
  seit Mai 2026 auf Version 8.0 verfügbar — laut AWS bis zu **90 % Ersparnis**
  gegenüber der Provisionierung für Spitzenlast. Das ist der direkte Gegenpart
  zu Aurora Serverless v2 auf Karte 23.
- **Elastic Clusters** sind die zweite Cluster-Art: Sharding für **Millionen
  Lese- und Schreibvorgänge pro Sekunde** und Petabyte-Kapazität. Wer bei
  „muss über eine einzelne Instanz hinaus schreiben" an DynamoDB denkt, hat
  hier eine zweite Option.

**Zahlen sauber auseinanderhalten** (Regel F8): **128 TiB** ist die Obergrenze
des Cluster-Volumes bei **instanzbasierten** Clustern. Die Petabyte-Angaben
gehören zu **Elastic Clusters**. Beides in einem Satz zu mischen erzeugt eine
falsche Zahl.

**4. „Read Replicas haben eine eigene Kopie."**
Nein — alle Instanzen teilen sich dasselbe Cluster-Volume. Wer das mit RDS
Read Replicas verwechselt (Karte 22, eigene Kopie, asynchrone Replikation),
zieht falsche Schlüsse über Verzug und Promotion.

**5. „DocumentDB ist ein Drop-in-Ersatz für DynamoDB."**
Andere Baustelle. DynamoDB ist Key-Value mit Partitionierung und
Kapazitätsmodell; DocumentDB ist ein Dokumentspeicher mit reichhaltigen
Abfragen und Aggregations-Pipelines. Das Prüfungssignal für DocumentDB ist
immer **MongoDB**.

## Abgrenzung gesamt

| Frageform | Antwort |
|---|---|
| „MongoDB-kompatibel", „bestehende Treiber", „flexibles Schema" | **DocumentDB** |
| „Beziehungen", „wer kennt wen", „mehrere Hops" | **Neptune** (Karte 26) |
| „Key-Value", „Partition Key", „single-digit millisecond" | **DynamoDB** (Karte 21/25) |
| „Zeitreihen", „Abfrage nach Zeitfenster" | **Timestream** (Karte 27) |
| MySQL/PostgreSQL nach RDS, gleiche Engine | **DMS ohne SCT** (Karte 72) |

## Bewusste Vereinfachungen im Diagramm

- **Die drei AZs sind nicht als Zonen gezeichnet.** „6 Kopien über 3 AZs" steht
  als Textzeile im Cluster-Volume; drei Zonenrahmen hätten die
  Migrationsgeschichte erdrückt.
- **Der gestrichelte Pfeil vom Volume zu den Replicas trägt bewusst keinen
  Nummern-Badge.** Er ist kein Ablaufschritt, sondern eine dauerhafte
  Eigenschaft der Architektur.
- **Elastic Clusters und Serverless sind nur Textzeilen**, keine eigenen
  Boxen. Beide würden eine zweite Architektur zeigen.
- **Die VPC ist nicht gezeichnet.** DocumentDB ist VPC-only.
- **Der Reader-Endpoint hat keinen eigenen Pfeil** — die App-Verbindung geht
  auf der Karte zum Cluster-Endpoint; die Lastverteilung auf Replicas steht
  als Textzeile.
- **DMS-Details fehlen:** Replikationsinstanz, Endpoints und Task-Konfiguration
  sind zu einer Box zusammengezogen.
- **1,4 TB und 15 Replicas sind Szenariozahlen**, keine Messwerte.

## Farbkonvention

- **Navy = Cluster mit geteiltem Storage-Volume** (Primary, Read Replicas,
  Versions-Box) — dieselbe Kategorie wie RDS/Aurora aus Batch 5, weil
  DocumentDB genau diese Architektur teilt.
- **Grün = Storage** (Cluster-Volume) — konsistent mit Karte 27.
- **Orange = Migrationswerkzeug** (DMS) — entspricht dem Stil-Guide, der DMS
  ausdrücklich Orange zuordnet.
- **Grau gestrichelt = extern** (das eigene Rechenzentrum).
- **Rot gestrichelt = Warnung** (die Kompatibilitätsbox).
- **Neptune behält Teal.** Dass Karte 26 und Karte 29 unterschiedliche Farben
  tragen, ist Absicht: Die Pflicht-Abgrenzung Graph vs. Dokument soll auch
  visuell tragen, wenn beide Karten nebeneinander liegen.

## Faktencheck-Quellen (geprüft 18.07.2026)

- AWS-Doku, „What is Amazon DocumentDB" — instanzbasierte Cluster und Elastic
  Clusters, Volumenwachstum in 10-GB-Schritten bis 128 TiB, bis zu 15 Replicas
- AWS What's New, 20.05.2026 — DocumentDB Serverless auf Version 8.0,
  feingranulare Skalierung, bis zu 90 % Ersparnis, MongoDB-API 6.0/7.0/8.0
- AWS What's New, 20.04.2026 — In-place-Upgrade 5.0 → 8.0 ohne neue Cluster,
  ohne Endpoint-Wechsel, ohne Index-Neuaufbau; 7x Latenz, 5x Kompression
- AWS-Produktseite DocumentDB Features — Elastic Clusters für Millionen
  Lese-/Schreibvorgänge pro Sekunde, Standard- und I/O-Optimized-Konfiguration
- AWS What's New, 13.08.2025 — Extended Support für Version 3.6,
  Standard-Support-Ende 30.03.2026
- AWS-Doku, Release Notes DocumentDB — Versionsstände 3.6, 4.0, 5.0, 8.0
- AWS News, Version 8.0.1 — Unterstützung für 46 weitere MongoDB-Operatoren
