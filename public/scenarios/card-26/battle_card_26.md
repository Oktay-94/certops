---
nr: 26
title: "Neptune — Betrugsringe über Beziehungsnetzwerke finden"
services:
  - Amazon Neptune (Database)
  - Neptune Analytics
  - AWS Lambda
  - Amazon S3
signalwords:
  - "highly connected data"
  - "relationships between entities"
  - "wer kennt wen"
  - "fraud ring / fraud graph"
  - "multi-hop / traversal"
  - "shared device, shared address"
  - "identity graph, knowledge graph"
  - "social network, recommendation engine"
domains: [D3, D2]
assets:
  - battle_card_26.svg
  - battle_card_26.png
  - battle_card_26.pdf
status_note: >-
  Rechnerisch vollständig geprüft: qc.py 0 Befunde (8 Boxen, 57 Texte,
  28 Segmente, 6 Badges), alle Palettenfarben im PNG nachweisbar, fünf
  definierte Freizonen rein weiß. Die Sichtprüfung des PNG durch Chat-Claude
  war NICHT möglich — `view` lieferte ein leeres Bild (Regel F9). Sichtprüfung
  durch Oktay steht aus.
---

# Battle Card 26 — Amazon Neptune · Neptune Analytics

## Szenario

**Falkenbank Direkt**, Online-Bank mit 3,1 Mio. Kunden und rund 480.000
Kontoeröffnungen im Jahr. Der Graph aus Kunden, Geräten, IP-Adressen,
Zustelladressen und Empfängerkonten hat etwa **240 Mio. Beziehungen**.

Betrug tritt hier nie als Einzelkonto auf, sondern als **Ring**: zwanzig
frische Konten, die sich ein Gerät teilen, deren Zustelladressen über einen
Zwischenhändler zusammenhängen und deren Auszahlungen auf drei dieselben
Empfängerkonten laufen. Zwei Anforderungen:

1. **Echtzeit:** Bei jeder Kontoeröffnung muss der Fraud-Service in **unter
   50 ms** wissen, ob der Antragsteller über bis zu **drei Hops** an einem
   bereits markierten Betrugskonto hängt.
2. **Ermittlung:** Nachts sucht das Betrugs-Team im **Gesamtgraph** nach
   Ringen, die keine Einzelabfrage findet — Gruppen, die erst durch ihre
   Struktur auffallen.

Die verworfene Alternative steht auf der Karte: dieselbe Frage relational
gestellt braucht **einen Self-Join pro Hop**. Bei vier Hops sind das vier
Joins über eine Tabelle mit 240 Mio. Zeilen — Laufzeit in Minuten. Und die
eigentliche Sperre ist nicht die Laufzeit, sondern dass die **Hop-Tiefe vorab
nicht bekannt ist**: SQL braucht die Anzahl der Joins zur Schreibzeit, die
Frage „wie weit hängt das zusammen" kennt sie erst zur Laufzeit.

## Ablauf

**1 — Bulk Load: S3 → Neptune Database (einmalig)**
Der Altbestand liegt als CSV in S3 und wird über den **Neptune Bulk Loader**
geladen, nicht über einzelne Insert-Statements. Der Loader ist ein
HTTP-Endpoint der Datenbank, der über eine IAM-Rolle aus dem Bucket liest —
er ist um Größenordnungen schneller als zeilenweises Schreiben und der
vorgesehene Weg für Erstbefüllung und Massenimport. Danach schreibt die
Anwendung laufend selbst Knoten und Kanten fort.

**2 — Neuer Antrag: Kontoeröffnung → Fraud-Service**
Jede Kontoeröffnung liefert Gerätekennung, IP und Zustelladresse mit. Diese
Attribute sind im Graph **eigene Knoten**, nicht Spalten am Kundenknoten —
genau das macht sie verbindend. Zwei Kunden mit derselben Gerätekennung
zeigen im Graph auf denselben Geräteknoten und sind damit zwei Hops
voneinander entfernt.

**3 — Echtzeit-Traversal: Fraud-Service → Neptune Database**
Die Lambda-Funktion stellt eine **3-Hop-Traversal-Abfrage**. Neptune Database
versteht dafür **Gremlin** (Apache TinkerPop, Property Graph), **openCypher**
(Neo4j-kompatibel, ebenfalls Property Graph) und **SPARQL** (W3C, RDF). Auf
der Karte stehen Gremlin und openCypher nebeneinander, weil beide dasselbe
Property-Graph-Modell abfragen — die Wahl ist eine Team-Entscheidung, keine
Architekturentscheidung. Die Antwort kommt in Millisekunden, weil der
Traversal den Kanten folgt, statt eine Tabelle zu durchsuchen: Der Aufwand
hängt an der **Nachbarschaft des Startknotens**, nicht an der Gesamtgröße des
Graphen. Genau deshalb ist ein Graph hier schnell und eine relationale DB
nicht.

**4 — Graph laden: Neptune Database → Neptune Analytics**
Für die Ermittlung wird der Graph aus einem **Snapshot** (oder aus S3) in
**Neptune Analytics** geladen. Das ist ein **eigener Dienst**, keine
Betriebsart der Datenbank: eine speicheroptimierte Engine, die den Graphen
komplett im Arbeitsspeicher hält. Der Pfeil ist gestrichelt, weil dies ein
Ladevorgang ist und kein laufender Datenfluss — die Kopie **altert ab dem
Moment des Ladens**.

**5 — Befund: Neptune Analytics → Ermittlung**
Auf der In-Memory-Kopie laufen Graph-Algorithmen: **Community Detection**
findet dicht verbundene Gruppen, die kein Einzeltraversal je aufdecken würde,
**PageRank** gewichtet, welcher Knoten der Ring-Mittelpunkt ist. Das ist der
Unterschied zwischen den beiden Pfaden auf der Karte: Schritt 3 beantwortet
eine Frage über **einen** Antragsteller, Schritt 5 stellt eine Frage über
**den ganzen Graphen**.

**6 — Risiko-Label zurück: Ermittlung → Neptune Database**
Die Befunde wandern als Risiko-Label an die Knoten in der **Database**
zurück, nicht in die Analytics-Kopie. Damit sieht der Echtzeit-Traversal aus
Schritt 3 ab sofort, was die nächtliche Analyse gefunden hat — der Kreis
schließt sich, und die Analytics-Kopie bleibt das, was sie ist: ein
Wegwerf-Arbeitsexemplar.

**Verworfen — relationale DB mit Self-Joins**
Rotes X: technisch möglich, fachlich falsch. Vier Joins für vier Hops, und bei
unbekannter Tiefe gar nicht formulierbar.

## Prüfungs-Kernsatz

> **Wenn die Beziehung selbst die Frage ist — „wer hängt über wie viele
> Zwischenschritte mit wem zusammen" — heißt die Antwort Neptune. Nicht,
> wenn viele Daten zusammenhängen, sondern wenn die Verbindung das Gesuchte
> ist.**

Merkhilfe: Ein Fremdschlüssel verbindet zwei Zeilen. Eine Graphkante ist
selbst ein Objekt, das man traversieren, zählen und gewichten kann. Sobald
eine Frage „wie viele Schritte" enthält, ist der Fremdschlüssel das falsche
Werkzeug.

## Klassiker-Fallen

**1. „Neptune spricht Gremlin und SPARQL."**
Unvollständig — **openCypher** kommt seit 2021 dazu und fehlt in vielem
Kursmaterial. Neptune Database beherrscht alle drei. **Neptune Analytics
dagegen nur openCypher** — wer aus einer Gremlin-Anwendung heraus analysieren
will, muss die Abfragen neu schreiben.

**2. „Neptune Serverless skaliert wie Aurora Serverless v2 auf 0."**
Falsch. Das Minimum sind **1 NCU** (1 NCU ≈ 2 GB RAM), Maximum **128 NCU**
= 256 GB. Die 1 NCU läuft durch und wird bezahlt. Das ist die **direkte
Gegenprobe zu Karte 23**: Aurora Serverless v2 kann seit November 2024 auf
0 ACU, Neptune kann das nicht. Wer die Regel von Karte 23 hierher überträgt,
liegt falsch.

**3. „Neptune Analytics ist der schnellere Neptune."**
Nein — es ist ein **anderer Dienst mit einer eigenen Datenkopie**. Es ersetzt
die Database nicht, es wird aus ihr befüllt. Schreibvorgänge in der Database
nach dem Laden sind in Analytics **unsichtbar**. Wer Analytics als Cache
denkt, baut sich stille Fehlentscheidungen — deshalb trägt Analytics auf
dieser Karte bewusst **nicht** die Lila-Farbe der Cache-Schicht aus Batch 5.

**4. „Der Graph ist übers Internet erreichbar."**
Neptune ist **VPC-only** und hat keinen öffentlichen Endpoint. Zugriff läuft
über die VPC — von außen also über Bastion, VPN, Direct Connect oder eine
Lambda in der VPC. Ein typischer Distraktor bietet „öffentlichen Endpoint mit
IP-Whitelist" an; den gibt es nicht.

**5. „Für Hochverfügbarkeit reicht eine zweite Instanz."**
Neptune hält **6 Kopien über 3 AZs** und failt in etwa 30 Sekunden auf eine
Replica um. Bis zu **15 Read Replicas** teilen sich denselben Storage, es gibt
einen eigenen **Reader-Endpoint**. Wer Read Replicas nennt, um *Schreiblast*
zu verteilen, liegt falsch: Es gibt genau **einen Writer**.

## Abgrenzung (Pflicht laut Batch-Vorgabe)

| Frageform in der Prüfung | Antwort | Warum nicht das andere |
|---|---|---|
| „Beziehungen zwischen Entitäten", „wer kennt wen", „mehrere Hops", „Empfehlung", „Betrugsring" | **Neptune** | Das Gesuchte ist die **Verbindung** |
| „MongoDB-kompatibel", „JSON-Dokumente", „flexibles Schema", „ohne Code-Änderung migrieren" | **DocumentDB** (Karte 29) | Das Gesuchte ist das **Dokument**; Verweise zwischen Dokumenten sind Felder, keine traversierbaren Kanten |
| „Key-Value", „single-digit millisecond", „Partition Key", „beliebige Skalierung" | **DynamoDB** (Karte 21/25) | Zugriff über **einen Schlüssel**, nicht über einen Pfad |
| „Zeitreihen", „Millionen Messwerte pro Minute", „Abfrage nach Zeitfenster" | **Timestream** (Karte 27) | Die Ordnung ist die **Zeit**, nicht die Beziehung |

**Merksatz zur Trennung 26 ↔ 29:** Beides ist „nicht-relational und managed".
Neptune modelliert **Kanten als erstklassige Objekte** — DocumentDB
modelliert **verschachtelte Dokumente**. Wenn die Prüfungsfrage nach
Zusammenhängen *über* Datensätze hinweg fragt, ist es Neptune. Wenn sie nach
*Struktur innerhalb* eines Datensatzes fragt, ist es DocumentDB.

## ⚠️ Divergenzen: Prüfungsrealität ≠ Produktrealität

| Punkt | Kursmaterial / Prüfung | Produktrealität (Stand 18.07.2026) |
|---|---|---|
| Abfragesprachen | „Gremlin und SPARQL" | **Drei**: Gremlin, openCypher, SPARQL. openCypher seit 2021. |
| Neptune Analytics | kommt meist gar nicht vor | Eigener Dienst seit Ende 2023, In-Memory, **nur openCypher**, Algorithmenbibliothek + Vektorsuche. Prüfungsantwort für Graph bleibt trotzdem schlicht „Neptune". |
| Serverless-Minimum | teils noch „2,5 NCU" | Seit **01.03.2023** sind es **1 NCU**. Max 128 NCU = 256 GB. |
| Skalierung auf 0 | wird gern von Aurora übertragen | Neptune Serverless **kann es nicht** — 1 NCU läuft immer. |
| Produktpositionierung | „Graphdatenbank" | Die Produktseite nennt Neptune heute „serverless graph database" und stellt **GraphRAG mit Bedrock Knowledge Bases** in den Vordergrund. Real ist Neptune Database weiterhin ein Cluster mit Instanzen; serverless ist eine **Instanzklasse** (`db.serverless`). |

**Für die Prüfung gilt weiterhin:** Graph-Szenario → Neptune. Die Divergenzen
sind Wissen für die Praxis und Schutz vor überholten Distraktoren, keine
neuen Antwortmuster.

## Bewusste Vereinfachungen im Diagramm

- **Read Replicas sind nicht als eigene Boxen gezeichnet.** „1 Writer + bis zu
  15 Read Replicas" steht als Textzeile in der Database-Box. Fünfzehn Kästchen
  hätten die Karte gefüllt, ohne etwas zu erklären.
- **Der Reader-Endpoint ist nicht als eigener Knoten dargestellt.** Der
  Fraud-Service spricht auf der Karte „die Database" an; in der Praxis geht
  eine reine Leseabfrage an den Reader-Endpoint.
- **Die 3 AZs sind nicht als Zonen gezeichnet**, sondern als Textzeile
  („6 Kopien über 3 AZs"). Die Karte erklärt Graphmodelle, nicht
  AZ-Topologie — dafür gibt es Karte 81.
- **Die VPC ist nicht als Rahmen gezeichnet**, obwohl Neptune VPC-only ist.
  Der Hinweis steht als Textzeile in der Box.
- **Neptune ML ist weggelassen.** Der Dienst sagt per Graph Neural Network
  Betrug auf *neuen* Kanten voraus und wäre fachlich passend — er hätte aber
  einen dritten Pfad und SageMaker als weiteren Knoten gebraucht.
- **Der Rückfluss von Schritt 3** (Antwort der Database an den Fraud-Service)
  ist in der Anfrage-Verbindung implizit und nicht als eigener Pfeil
  gezeichnet.
- **Schritt 4 ist gestrichelt**, weil es ein Ladevorgang ist. Die Karte zeigt
  bewusst keinen laufenden Sync — den gibt es nicht.

## Farbkonvention (neu in diesem Batch, dokumentierpflichtig)

- **Teal `#0F7C8C` = Graph-Datenbank** (Neptune Database) — neue Kategorie.
- **Rot-Pink `#B0084D` = Analytik-Engine** (Neptune Analytics), dieselbe
  Kategorie wie Redshift auf früheren Karten.
- **Lila bleibt der In-Memory-Cache-Schicht** aus Batch 5 (DAX, ElastiCache)
  vorbehalten. Neptune Analytics ist ausdrücklich **kein Cache** — es
  invalidiert nicht, es altert. Diese Trennung ist Absicht, damit Karte 26
  neben Karte 21 und 24 gelesen werden kann, ohne dass die Farbe eine falsche
  Aussage macht.

## Werkzeug-Learning aus dieser Karte

`scripts/qc.py` parst Pfade nur über `M`/`L` mit Komma-Koordinaten. Die
SVG-Kurzformen **`H` und `V` werden nicht erkannt** — Pfade in dieser Notation
liefern **null Segmente** und laufen still an den Prüfungen (b) und (c)
vorbei. Erster Entwurf dieser Karte hatte drei solche Pfade; nach dem
Umschreiben auf `L` stiegen die geprüften Segmente von 20 auf 28.
**Regel: Pfeilpfade immer als `M x,y L x,y L x,y` schreiben.**

Zweitens wurde `qc.py` minimal ergänzt: Prüfung (d) hielt bisher **jeden**
`<circle>` für einen Nummern-Badge und meldete das rote X des verworfenen
Pfades (Stil-Guide §4: „Kreis r=20 weiß gefüllt, roter Rand") als Befund.
Badges sind jetzt definiert als Kreise **ohne Rand und mit farbiger Füllung**;
weiß gefüllte Kreise mit Rand sind davon ausgenommen. Echte Badges fallen
nicht durch den Filter.

## Faktencheck-Quellen (geprüft 18.07.2026)

- AWS-Doku, Amazon Neptune — Übersicht, Gremlin/openCypher/SPARQL
- AWS-Doku, Neptune Analytics — „What is Neptune Analytics", In-Memory,
  Algorithmenbibliothek, Vektorsuche, nur openCypher
- AWS-Doku, Amazon Neptune Serverless — NCU-Definition, Maximum 128 NCU
  = 256 GB Arbeitsspeicher
- AWS-API-Referenz, `ServerlessV2ScalingConfiguration` — Halbschritte
- AWS What's New, 01.03.2023 — Serverless-Minimum von 2,5 auf 1 NCU gesenkt
- AWS-Produktseite, Neptune Features — bis zu 15 Read Replicas, gemeinsamer
  Storage, Reader-Endpoint, Storage in 10-GiB-Segmenten
- AWS re:Post — Unterschiede Neptune Database vs. Neptune Analytics
- AWS-Produktseite Neptune — aktuelle Positionierung, GraphRAG mit Bedrock
  Knowledge Bases
