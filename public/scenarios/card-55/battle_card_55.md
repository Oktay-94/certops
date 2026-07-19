---
nr: 55
title: "Amazon MSK · Apache Kafka — bestehende Kafka-Anwendungen managed betreiben"
services:
  - Amazon MSK
  - Amazon MSK Serverless
  - Apache Kafka
  - Kafka Connect
  - Amazon Kinesis Data Streams
domains:
  - D3
signalwords:
  - "existing Apache Kafka applications"
  - "without changing application code"
  - "already using Kafka Connect and Kafka Streams"
  - "reduce the operational overhead of running Kafka"
  - "migrate from self-managed Kafka"
  - "open-source compatible streaming"
assets:
  - battle_card_55.svg
  - battle_card_55.png
  - battle_card_55.pdf
status_note: >
  QC (scripts/qc.py): 0 Befunde, sowohl vor als auch nach der Korrekturrunde.
  Gemeldet 8 Boxen, 43 Texte, 17 Segmente, 5 Badges. Segmentzahl
  aufgeschluesselt nach R5: 17 gemeldet minus 8 Phantom-Segmente aus VIER
  Marker-Definitionen in <defs> = 9 tatsaechlich gezeichnete Segmente,
  allesamt <line>. (Diese Karte hat nur vier Marker, nicht fuenf wie die
  uebrigen — daher acht statt zehn Phantom-Segmente.) Badge-Zahl nach R6:
  5 gemeldete Badges = die fuenf Nummern-Badges; der weiss gefuellte Kreis mit
  rotem Rand bei (190,590) ist das rote X des verworfenen Pfades und wird von
  Pruefung (d) korrekt nicht als Badge gezaehlt.
  Korrekturrunden: eine, NACH dem Zeichnen — und es war ein echter
  Grafikbefund, kein Zonenfehler. Der Geometrieplan selbst lief sauber durch
  (0 Texte unter der 20-px-Reserve aus R4, 0 Kollisionen). Beim Zeichnen wurde
  das Label "dieselben Topics" auf x=1240 gesetzt; nachtraeglich gemessen
  belegte es 1178,7..1301,3 und beruehrte damit die Aussenkante der
  Konsumenten-Box (x=1300, stroke 2,5, Rand belegt 1298,75..1301,25). Im PNG
  liessen sich drei Pixel Textfarbe #1B3E86 bei x 1298,0..1299,3 nachweisen.
  **qc.py findet das nicht**, weil das Label ausserhalb der Box liegt (also
  nicht unter Pruefung (a) faellt) und eine Boxkante kein Segment ist (also
  auch nicht unter Pruefung (b)). Gefunden wurde es nur, weil die Labelbreite
  nach dem Zeichnen erneut gemessen und gezielt gegen die Boxkante geprueft
  wurde. Label auf x=1215 verschoben, Abstand zur Boxkante jetzt 22,4 px;
  Gegenprobe im neuen PNG: an der Kante ausschliesslich Boxrand #2E6BE6 und
  Fuellung #EFF4FE, keine Textfarbe.
  Footer in drei Varianten gemessen, V3 mit 1089,0 px uebernommen.
  Schwarz-Pruefung nach R13: 0 px reines Schwarz (0,0,0) im PNG, vor und nach
  der Korrektur. Alle vier Palettenfarben nachweisbar (#3B3B98 22681 px,
  #2E6BE6 6172 px, #9A9A9A 6789 px, #C7161D 3368 px). R12-Gegencheck: NULL
  <path> mit stroke im SVG — alle neun Verbindungen sind <line>-Elemente.
  Render-Sanity: neun Freizonen aus der Elementgeometrie abgeleitet, eine
  musste nachgeschnitten werden. Z1 reichte bis x=420 und traf das Label
  "Lift" (23,4 px breit, text-anchor=middle auf x=377, belegt 365,3..388,7,
  Baseline 345); gemessener Fund im PNG: 365,3..388,0 — Deckung mit der
  Vorabrechnung. Neu bei x=362 geschnitten. Nach der Label-Korrektur wurden
  alle neun Zonen erneut geprueft: 9 von 9 frei.
  Footer von Hand mit PIL gemessen: 1089,0 px (Stil-Guide ~1420,
  R3-Arbeitsgrenze ~1400).
  Sichtpruefung nach R8: versucht. Der view-Aufruf lieferte ein LEERES
  Bildobjekt zurueck — die Karte konnte NICHT gesehen werden. Fuenfmal von
  fuenfmal in dieser Sitzung. Rechnerisch geprueft ist nicht gesehen.
  Sichtpruefung durch Oktay steht aus.
---

# Battle Card 55 — Amazon MSK · Apache Kafka

## Szenario

Ein Automobilzulieferer betreibt seit Jahren Apache Kafka im eigenen
Rechenzentrum. **Über 40 Anwendungen** nutzen Kafka-Producer- und
Consumer-Bibliotheken, dazu Kafka Connect für die Anbindung an SAP und Kafka
Streams für laufende Aggregate. Der Betrieb bindet zwei Vollzeitstellen:
ZooKeeper-Pflege, Broker-Austausch, Patch-Fenster, Kapazitätsplanung. Die
Anwendungen selbst sollen **nicht angefasst werden**. Gesucht ist der Weg in
die Cloud ohne Umschreiben.

## Ablauf

**1 — Die Anwendungen werden umgehängt, nicht umgeschrieben.**
Sie sprechen weiterhin das Kafka-Protokoll; geändert werden die
Bootstrap-Server und die Authentifizierung. Das ist der ganze Punkt dieser
Karte: MSK **ist** Apache Kafka, kein kompatibler Nachbau. Producer,
Consumer, Kafka Connect und Kafka Streams laufen unverändert weiter.

**2, 3, 4 — Die Entscheidung fällt in zwei Stufen, nicht in einer.**
Zuerst wählt man den **Cluster-Typ**: Provisioned oder Serverless. Nur
innerhalb von Provisioned wählt man dann den **Broker-Typ**:

- **Standard-Broker** — EC2-Instanzen mit EBS-Volumes. Instanztyp und
  Speicher werden selbst dimensioniert. Die flexibelste, aber auch
  arbeitsintensivste Variante.
- **Express-Broker** — seit November 2024 verfügbar. Bis zu dreimal mehr
  Durchsatz je Broker, zwanzigmal schnelleres Skalieren und neunzig Prozent
  kürzere Wiederherstellungszeit gegenüber Standard-Brokern. Speicher
  skaliert automatisch mit, es gibt **keine Wartungsfenster**, und die
  Broker kommen mit Kafka-Best-Practices vorkonfiguriert. Sie benötigen
  **drei Availability Zones**.
- **MSK Serverless** — keine Kapazitätsplanung, automatische Skalierung von
  Rechen- und Speicherressourcen. Ebenfalls voll Kafka-kompatibel.

**KRaft statt ZooKeeper.**
Die Metadatenverwaltung liegt nicht mehr bei externen ZooKeeper-Knoten,
sondern bei einer Gruppe von Controllern innerhalb des Kafka-Clusters;
Metadaten werden als Topics in den Brokern gespeichert und repliziert. Der
praktische Effekt für die Prüfung: im KRaft-Modus lassen sich **bis zu 60
Broker je Cluster** betreiben, gegenüber 30 bei ZooKeeper-basierten
Clustern — ohne eine Limit-Erhöhung zu beantragen. KRaft-Controller kosten
nichts extra und erfordern keine eigene Verwaltung.

**5 — Die Konsumenten lesen dieselben Topics wie vorher.**
Kein Rewrite, keine neue SDK, keine geänderte Offset-Logik. Was vorher im
eigenen Rechenzentrum funktionierte, funktioniert jetzt in der Cloud.

**Verworfen — Kinesis Data Streams.**
Technisch ist Kinesis für einen Neubau die naheliegendere AWS-Wahl: weniger
Betriebslast, engere Integration in das AWS-Ökosystem. Aber es hat eine
**andere API und andere SDKs**. Vierzig Anwendungen, Kafka Connect und Kafka
Streams müssten umgeschrieben werden. Genau diese Migrationskosten sind das
Argument gegen Kinesis — nicht Durchsatz, nicht Latenz, nicht Kosten pro
Gigabyte.

## Prüfungs-Kernsatz

**MSK, wenn der Kafka-Code bleiben soll — Kinesis, wenn neu gebaut wird.**
Wer „existing Kafka applications", „without code changes" oder „Kafka Connect
already in use" liest, ist bei MSK. Wer eine grüne Wiese hat, ist bei
Kinesis.

## Abgrenzungen

- **55 ↔ 51:** Die direkte Spiegelung. Auf Karte 51 war Kinesis die richtige
  Antwort, hier ist es die falsche — und die Technik hat sich nicht geändert.
  Beide Dienste sind Puffer mit Zeitachse, beide erlauben mehrere unabhängige
  Konsumenten und Replay. **Der Unterschied ist der bestehende Code**, nicht
  die Fähigkeit. Deshalb tragen MSK und das verworfene Kinesis auf dieser
  Karte dieselbe Farbe.
- **55 ↔ 52:** Firehose kann MSK als Quelle nutzen, genau wie Data Streams.
  Die Lieferschicht ist von der Frage „Kafka oder Kinesis" unabhängig.
- **Provisioned ↔ Serverless ↔ Express:** Die häufigste Fehlvorstellung ist,
  dass es drei gleichrangige Optionen wären. Es sind zwei Ebenen: erst
  Cluster-Typ (Provisioned oder Serverless), dann — nur bei Provisioned —
  Broker-Typ (Standard oder Express).
- **55 ↔ 59 (Managed Service for Apache Flink):** MSK **transportiert**
  Ereignisse, Flink **rechnet** über sie hinweg. Fensteraggregate und
  Musterkennung im Strom sind Flink, nicht MSK. Kafka Streams ist die
  Alternative dazu innerhalb der Kafka-Welt — auf dieser Karte läuft es
  clientseitig weiter.

## Klassiker-Fallen

1. **MSK wird für einen Kafka-kompatiblen Nachbau gehalten.** Es ist echtes
   Apache Kafka; AWS betreibt die Infrastruktur darum herum. Deshalb
   funktionieren Kafka Connect, Kafka Streams, `kafka-topics.sh` und jedes
   andere Kafka-Werkzeug unverändert. Genau das kann Kinesis nicht bieten.
2. **„Serverless ist immer die einfachere Wahl."** MSK Serverless nimmt die
   Kapazitätsplanung ab, aber die Grenzen verschieben sich von der
   Broker-Dimensionierung zu Service-Quotas. Wer feingranulare
   Broker-Konfiguration braucht, ist bei Provisioned besser aufgehoben.
3. **ZooKeeper wird noch als Bestandteil angenommen.** In KRaft-Modus gibt es
   keine ZooKeeper-Knoten mehr; Kursmaterial vor Mitte 2024 beschreibt
   durchgängig die ZooKeeper-Architektur. Die 30-Broker-Grenze, die dort oft
   genannt wird, gilt nur für ZooKeeper-basierte Cluster.
4. **Der Umstieg auf Kinesis wird mit Kostenvorteilen begründet.** In diesem
   Szenario wäre er teurer, weil vierzig Anwendungen umgeschrieben werden
   müssten. Migrationskosten stehen in Prüfungsfragen selten in der
   Antwortoption, sind aber der eigentliche Entscheidungsgrund.

## Faktencheck — Divergenzen zu älterem Kursmaterial

1. **Express-Broker sind seit dem 07.11.2024 allgemein verfügbar** — ein
   dritter Weg neben Standard-Brokern und Serverless. Sie liefern je nach
   Instanzgröße bis zu dreimal mehr Durchsatz pro Broker, skalieren bis zu
   zwanzigmal schneller und stellen sich neunzig Prozent schneller wieder
   her als Standard-Broker; sie unterstützen alle Kafka-APIs, sodass
   bestehende Clients unverändert bleiben. Kursmaterial vor 2025 kennt nur
   die Zweiteilung Provisioned/Serverless.
   *Quelle: AWS What's New, „Express brokers for Amazon MSK is now generally
   available", 07.11.2024; AWS Developer Guide, „Amazon MSK Express brokers".*

2. **Die Wahl ist zweistufig, nicht flach.** Beim Anlegen eines Clusters
   wählt man zuerst Provisioned oder Serverless; **innerhalb** von
   Provisioned gibt es dann die Broker-Typen Standard und Express.
   *Quelle: AWS Big Data Blog, „How to choose the right Amazon MSK cluster
   type for you" (im März 2025 auf Genauigkeit überprüft).*

3. **KRaft ersetzt ZooKeeper — seit dem 29.05.2024 auf Kafka 3.7.** Die
   Metadaten wandern von externen ZooKeeper-Knoten zu Controllern innerhalb
   des Kafka-Clusters. Praktische Folge: **bis zu 60 Broker je Cluster ohne
   Limit-Erhöhung, gegenüber 30 bei ZooKeeper-basierten Clustern.**
   KRaft-Controller sind kostenfrei und erfordern keine zusätzliche
   Einrichtung.
   *Quelle: AWS What's New, „Amazon MSK launches support for KRaft mode for
   new Apache Kafka clusters", 29.05.2024; AWS MSK Developer Guide.*

4. **KRaft für Express-Broker kam erst am 18.12.2025 mit Kafka 3.9.** Neue
   Express-Cluster auf Version 3.9 nutzen KRaft automatisch; das Upgrade
   bestehender Cluster war zum Ankündigungszeitpunkt noch nicht möglich und
   für eine spätere Version angekündigt. **Diese Meldung ist rund sieben
   Monate alt und in keinem Kursmaterial enthalten.**
   *Quelle: AWS What's New, „Amazon MSK introduces KRaft support for Express
   Brokers with Apache Kafka v3.9", 18.12.2025.*

5. **Express-Broker laufen auf Kafka 3.6, 3.8 und 3.9 und benötigen drei
   Availability Zones.** KRaft steht dort ab Version 3.9 zur Verfügung.
   *Quelle: AWS Developer Guide, „Amazon MSK Express brokers".*

6. **MSK Serverless ist seit dem 28.04.2022 allgemein verfügbar** und
   vollständig Kafka-kompatibel; bestehende Anwendungen laufen ohne
   Codeänderung. Abgerechnet wird nach Durchsatz, mit einem Stundensatz je
   Cluster und je angelegter Partition.
   *Quelle: AWS What's New, „Amazon MSK Serverless is now generally
   available", 28.04.2022.*

## Nicht bestätigt

- **Die Quota-Werte von MSK Serverless.** Eine Drittquelle nennt eine Liste
  von Grenzwerten je Cluster (maximaler Ein- und Ausgangsdurchsatz,
  Client-Verbindungen, Anfragerate, Nachrichtengröße, Consumer-Gruppen,
  Leader-Partitionen, Partitions-Erstellungsrate, Durchsatz je Partition,
  Größe kompaktierter Topic-Partitionen, Client-VPCs je Cluster, Cluster je
  Konto) und verweist auf die AWS-Quota-Seite. **Die konkreten Zahlen wurden
  nicht direkt gegengelesen** und stehen deshalb nicht auf der Karte.
- **Instanzgrößen für Express-Broker.** Genannt werden Graviton3-basierte
  M7g-Instanzen in sieben Größen von large bis 16xlarge (Stand Januar 2025).
  Aus AWS-Ankündigungen belegt, aber zu volatil und zu detailliert für eine
  Karte.
- **Sämtliche Preisangaben.** Nicht auf der Karte.
- **Die Aussage, AWS empfehle Express-Broker für neue Produktions-Cluster**,
  stammt aus einer Drittquelle und wurde nicht in der AWS-Dokumentation
  bestätigt. Nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Die drei Zielboxen stehen nebeneinander, obwohl nur eine gewählt wird.**
  Die Zone „PROVISIONED — Broker-Typ" umschließt Standard und Express und
  macht die Zweistufigkeit sichtbar; Serverless steht bewusst außerhalb
  dieser Zone, weil es ein Cluster-Typ ist und kein Broker-Typ.
- **Der Pfeil zu den Konsumenten geht von den Express-Brokern aus.** Er gilt
  für alle drei Varianten; die Wahl war eine Layoutentscheidung.
- **Kafka Connect und Kafka Streams sind als Textzeilen in der
  On-Premise-Box dargestellt**, nicht als eigene Knoten. Sie sind
  Client-Bibliotheken bzw. ein Framework, keine separaten AWS-Dienste — eine
  eigene Box hätte sie fälschlich zu Infrastruktur gemacht.
- **Der Migrationsvorgang selbst fehlt.** MSK Replicator und die Frage, wie
  bestehende Topics und Offsets übertragen werden, sind ein eigenes Thema.
  Die Karte zeigt den Zielzustand.
- **Die Netzwerkanbindung ist nicht gezeichnet.** Direct Connect oder VPN
  zwischen Rechenzentrum und VPC wären nötig, gehören aber zu den
  Netzwerkkarten des Masterplans.

## Farbkonventionen dieser Karte

- **Indigo #3B3B98 — Streaming-Transport.** Trägt Amazon MSK, alle drei
  Zielvarianten **und das verworfene Kinesis Data Streams**. Die Kategorie
  wurde auf Karte 51 eingeführt und am 19.07.2026 von Oktay freigegeben.
  **Bewusste Entscheidung:** Kinesis behält die Kategoriefarbe, obwohl es
  verworfen wird. Die Farbe sagt „dieselbe Klasse", das rote X sagt „hier
  trotzdem falsch" — genau das ist die Aussage der Karte. Ein roter Boxrand
  hätte suggeriert, Kinesis sei fachlich unterlegen; es ist aber nur in
  diesem Szenario die falsche Wahl.
- **Grau #9A9A9A — extern und on-premise.** Trägt die Anwendungen im eigenen
  Rechenzentrum, gestrichelt gerandet nach der Stil-Guide-Regel für externe
  bzw. passive Elemente, sowie den Pfeil des Lift-Vorgangs und die
  Zonenrahmen.
- **Blau #2E6BE6 — Clients und Konsumenten.**
- **Rot #C7161D — ausschließlich „verworfen".** Der Pfad zum Kinesis-Kasten
  und das rote X darauf.
