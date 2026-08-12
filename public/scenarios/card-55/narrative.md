---
cardNumber: 55
slug: msk-kafka-zulieferer-bestehende-clients
title: "Amazon MSK · Apache Kafka — bestehende Kafka-Anwendungen managed betreiben"
services: ["Amazon MSK", "Amazon MSK Serverless", "Apache Kafka", "Kafka Connect", "Amazon Kinesis Data Streams"]
domains: ["D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/msk/latest/developerguide/serverless.html"
  - "https://docs.aws.amazon.com/msk/latest/developerguide/bestpractices-express.html"
  - "https://docs.aws.amazon.com/msk/latest/developerguide/port-info.html"
  - "https://docs.aws.amazon.com/msk/latest/developerguide/troubleshooting.html"
  - "https://docs.amazonaws.cn/en_us/msk/latest/developerguide/limits.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/express-brokers-amazon-msk-generally-available"
  - "https://aws.amazon.com/about-aws/whats-new/2025/12/aws-msk-express-brokers-support-kraft"
  - "https://aws.amazon.com/msk/faqs/"
  - "https://aws.amazon.com/msk/features/"
---

## Die Grundidee zuerst

Ein Betrieb zieht in eine neue Halle um. Zwei Angebote liegen auf dem Tisch.

**Angebot eins:** Die neue Halle hat andere Steckdosen, ein anderes Druckluftsystem und andere Regalmaße. Alle vierzig Maschinen funktionieren dort — nachdem jede einzelne umgebaut wurde. Der Umbau ist gut planbar, dauert acht Monate und kostet mehr als der Umzug.

**Angebot zwei:** Die neue Halle hat dieselben Steckdosen, dieselbe Druckluft, dieselben Regale. Die Maschinen werden hochgehoben, hingestellt, angeschlossen. Was sich ändert, ist die Hausnummer.

Das ist die ganze Karte, und sie handelt nicht von Durchsatz, Latenz oder Preis pro Gigabyte. Sie handelt von **Anschlüssen**.

Amazon MSK ist Angebot zwei — es ist echtes Apache Kafka, kein kompatibler Nachbau. Producer, Consumer, Kafka Connect, Kafka Streams und `kafka-topics.sh` reden weiter dieselbe Sprache. Kinesis Data Streams ist Angebot eins: technisch oft die schönere Halle, aber mit anderen Steckdosen.

**In dieser Aufgabe entscheidet nicht die bessere Technik, sondern der vorhandene Code.**

## Was es eigentlich ist — die Client-Konfiguration

Das zentrale Objekt ist nicht der Cluster, sondern die Datei, die auf vierzig Anwendungen liegt. Vorher, im eigenen Rechenzentrum:

```properties
bootstrap.servers=kafka01.rz-intern.example:9092
security.protocol=PLAINTEXT

key.serializer=org.apache.kafka.common.serialization.StringSerializer
value.serializer=org.apache.kafka.common.serialization.StringSerializer
acks=all
group.id=sap-lieferavis
enable.idempotence=true
```

Nachher, gegen MSK mit IAM Access Control:

```properties
bootstrap.servers=b-1.zulieferer-prod.a1b2c3.c2.kafka.eu-central-1.amazonaws.com:9098
security.protocol=SASL_SSL
sasl.mechanism=AWS_MSK_IAM
sasl.jaas.config=software.amazon.msk.auth.iam.IAMLoginModule required;
sasl.client.callback.handler.class=software.amazon.msk.auth.iam.IAMClientCallbackHandler

key.serializer=org.apache.kafka.common.serialization.StringSerializer
value.serializer=org.apache.kafka.common.serialization.StringSerializer
acks=all
group.id=sap-lieferavis
enable.idempotence=true
```

Lies die beiden Blöcke nebeneinander. Der **untere Teil ist identisch** — Serializer, `acks`, `group.id`, Idempotenz. Das ist die Anwendungslogik, und sie wird nicht angefasst.

Der obere Teil ändert sich vollständig: Adresse, Protokoll, Authentifizierung. Das ist Konfiguration und Betrieb. Genau an dieser Trennlinie verläuft die Aussage der Karte — und genau hier liegt auch ihre Schwachstelle, siehe „Die ehrliche Feinheit".

## Der Weg durch die Karte

### Die Zone links — 40 Anwendungen im eigenen Rechenzentrum

Gestrichelt gerahmt und grau, weil sie außerhalb von AWS stehen. Vier Zeilen beschreiben die Ausgangslage, und jede ist ein Argument:

**Kafka Producer/Consumer** — die Client-Bibliotheken, in vierzig Deployments. **Kafka Connect zu SAP** — ein Konnektor, den jemand konfiguriert und getestet hat. **Kafka Streams** — laufende Aggregate mit eigenem Zustand in internen Topics. **Kein Code wird angefasst** — die Vorgabe.

Kafka Connect und Kafka Streams stehen bewusst als Textzeilen im Kasten, nicht als eigene Knoten: Sie sind eine Bibliothek und ein Framework, die auf dem Client laufen, keine AWS-Dienste.

### Badge 1 — Lift

Ein grauer Pfeil mit dem kürzesten Label der Karte. Er meint das Umhängen der Bootstrap-Server, nicht die Datenmigration.

Was hier **nicht** passiert, ist die eigentliche Nachricht: kein Umschreiben, keine neue SDK, keine geänderte Offset-Logik, kein Zwischenlayer. Zwei Zeilen in einer Properties-Datei ersetzen ein Migrationsprojekt.

### Der Kasten — Amazon MSK

Fünf Zeilen, die zusammen eine Behauptung aufstellen: **echtes Apache Kafka.**

Das ist kein Marketingsatz, sondern eine überprüfbare Eigenschaft. AWS betreibt Broker, Speicher, Patches und Ausfallsicherheit — die Protokollebene bleibt Apache Kafka. Deshalb funktionieren die mitgelieferten Kommandozeilenwerkzeuge, deshalb greifen bestehende Connectors, deshalb lässt sich ein Rollback denken.

Was AWS nicht abnimmt: Topic-Design, Partitionszahl, Replikationsfaktor, Retention. Das bleibt Kafka-Wissen und bleibt deine Arbeit.

Damit ist auch klar, was der Zulieferer im Umzug **verliert** — nämlich die zwei Vollzeitstellen, aber nur deren untere Hälfte. ZooKeeper-Pflege, Broker-Austausch, Patch-Fenster und Hardwareplanung fallen weg. Die obere Hälfte, also die Frage, ob ein Topic acht oder achtzig Partitionen braucht, bleibt im Haus. Wer eine Prüfungsfrage mit „reduce the operational overhead" liest, sollte genau diese Trennung im Kopf haben: Betriebslast ja, Fachwissen nein.

### Die Zeile im Kasten — KRaft statt ZooKeeper

Früher lag die Metadatenverwaltung bei externen ZooKeeper-Knoten neben dem Cluster. In KRaft-Modus liegt sie bei einer Gruppe von Controllern **innerhalb** des Kafka-Clusters; Metadaten werden als Topics in den Brokern gespeichert und repliziert.

Der Effekt, der auf der Karte steht, ist nachlesbar in der Quota-Dokumentation: **30 Broker je Cluster bei ZooKeeper-basierten Clustern, 60 bei KRaft-basierten** — ohne Antrag auf Erhöhung. Der Wert gilt für Standard- wie für Express-Broker.

Das Bild dazu: Die Hausverwaltung ist aus dem Nebengebäude ins Haus gezogen. Weniger Wege, weniger Türen, ein Gebäude weniger, das jemand abschließen muss. KRaft-Controller kosten nichts extra und werden nicht separat verwaltet.

### Badge 2 — der Weg zu den Standard-Brokern

Der erste von drei Pfeilen aus dem MSK-Kasten. Wichtig ist, was der Pfeil **nicht** bedeutet: Er ist keine parallele Lieferung an drei Ziele, sondern eine Auswahl.

### Der Kasten — Standard-Broker

EC2-Instanzen mit EBS-Volumes. Du wählst Instanztyp und Speichergröße, planst Wachstum, beobachtest die Volumenauslastung und erhöhst rechtzeitig.

Die flexibelste und arbeitsintensivste Variante. Sie ist dann richtig, wenn du feingranulare Kontrolle über Broker-Konfiguration brauchst oder eine Instanzfamilie, die es woanders nicht gibt.

Der Preis dafür steht nicht auf der Karte, sondern im Kalender: Ein volllaufendes EBS-Volumen ist bei Standard-Brokern dein Problem, und es kündigt sich nicht höflich an. Genau diese Klasse von Aufgaben nimmt die nächste Variante weg.

### Badge 3 — der Weg zu den Express-Brokern

Seit dem 07.11.2024 allgemein verfügbar. Kursmaterial, das vor 2025 entstanden ist, kennt diese Option nicht und stellt MSK als Zweiteilung Provisioned gegen Serverless dar.

### Der Kasten — Express-Broker

Die Ankündigung nennt bis zu dreifachen Durchsatz je Broker, bis zu zwanzigmal schnelleres Skalieren und neunzig Prozent kürzere Wiederherstellungszeiten gegenüber Standard-Brokern; alle Kafka-APIs werden unterstützt, bestehende Clients bleiben unverändert.

Die drei Zeilen auf der Karte sind die betrieblich wichtigen: **kein Storage-Management** — der Speicher wird vollständig verwaltet und wächst mit. **Keine Wartungsfenster.** **Drei AZ Pflicht** — und das ist sogar untertrieben: Nach der Best-Practices-Doku verteilen Express-Broker Daten standardmäßig über drei Availability Zones, der Replikationsfaktor ist **immer 3** und `min.insync.replicas` **immer 2**. Diese Werte sind nicht Vorschlag, sondern Vorgabe.

### Badge 4 — der Weg zu MSK Serverless

Der dritte Pfeil, und der einzige, der die gestrichelte Zone verlässt. Diese Geometrie ist der Lerninhalt: Serverless steht außerhalb, weil es **kein Broker-Typ** ist.

### Der Kasten — MSK Serverless

Keine Kapazitätsplanung, automatische Skalierung von Rechen- und Speicherressourcen, Abrechnung nach Durchsatz. Kafka-kompatibel wie die anderen Varianten.

Die Grenzen verschieben sich dabei von der Broker-Dimensionierung zu **Service-Quotas**, und die stehen inzwischen vollständig in der Dokumentation: 200 MBps Eingang und 400 MBps Ausgang je Cluster, 5 MBps Eingang und 10 MBps Ausgang je Partition, 3.000 gleichzeitige Client-Verbindungen, 8 MiB maximale Nachrichtengröße, 500 Consumer-Gruppen, 2.400 Leader-Partitionen bei nicht-kompaktierten Topics.

Wer diese Zahlen liest, sieht sofort, wofür Serverless nicht gedacht ist — und dass „serverless" hier nicht „grenzenlos" heißt.

Eine Zahl bleibt hier bewusst offen: Wie viele Serverless-Cluster ein Konto haben darf, geben AWS-Quellen unterschiedlich an — der offene Doku-Spiegel nennt drei, die aktuelle Quota-Seite zehn. Nach der Hausregel steht bei widersprüchlichen Quellen keine Zahl im Text.

### Die Zone — Provisioned, und warum Serverless daneben steht

Die häufigste Fehlvorstellung ist, es gäbe drei gleichrangige Optionen. Es sind **zwei Ebenen**:

```
Cluster-Typ ─┬─ Provisioned ─┬─ Standard-Broker
             │               └─ Express-Broker
             └─ Serverless
```

Zuerst der Cluster-Typ, dann — und nur bei Provisioned — der Broker-Typ. Die gestrichelte Zone auf der Karte umschließt genau die zweite Ebene.

### Badge 5 und der Kasten — Konsumenten lesen dieselben Topics

Kein Rewrite, keine neue SDK, keine geänderte Offset-Logik. Die Consumer Group behält ihren Namen, die Offsets liegen wie zuvor in einem internen Kafka-Topic, das Rebalancing funktioniert wie zuvor.

Der Pfeil geht auf der Karte von den Express-Brokern aus; er gilt für alle drei Varianten und ist eine Layoutentscheidung.

Dass dieser Kasten überhaupt auf der Karte steht, ist Absicht: Ein Umzug gilt erst dann als gelungen, wenn auch die Lesenden nichts merken. Producer umzuhängen ist die halbe Strecke — die andere Hälfte sind Consumer, deren Offsets, deren Gruppenzugehörigkeit und deren Wiederanlauf nach einem Neustart unverändert funktionieren müssen.

### Der verworfene Kasten — Kinesis Data Streams

Für einen Neubau wäre Kinesis die naheliegendere AWS-Wahl: weniger Betriebslast, engere Integration, kein Kafka-Wissen nötig. Und die Fähigkeiten überschneiden sich weitgehend: Beide sind Puffer mit Zeitachse, beide erlauben mehrere unabhängige Konsumenten, beide können erneut gelesen werden. Der Unterschied ist nicht das Können, sondern der Anschluss.

Es scheitert an zwei Zeilen im Kasten: **andere API, andere SDKs.** Vierzig Anwendungen, ein Kafka-Connect-Konnektor zu SAP und eine Kafka-Streams-Topologie müssten neu geschrieben und neu getestet werden. Diese Migrationskosten stehen in Prüfungsfragen selten in der Antwortoption — sie sind trotzdem der Entscheidungsgrund.

Beachte die Farbe: Kinesis trägt dieselbe Kategoriefarbe wie MSK. Die Farbe sagt „dieselbe Klasse von Dienst", das rote X sagt „in diesem Szenario trotzdem falsch". Ein roter Rahmen hätte behauptet, Kinesis sei fachlich unterlegen. Ist es nicht.

## Die entscheidende Unterscheidung

| | Standard-Broker | Express-Broker | MSK Serverless |
|---|---|---|---|
| Ebene | Broker-Typ unter Provisioned | Broker-Typ unter Provisioned | eigener Cluster-Typ |
| Speicher | EBS, selbst dimensioniert | vollständig verwaltet | vollständig verwaltet |
| Availability Zones | wählbar | drei, verpflichtend | verwaltet |
| Replikation | konfigurierbar | fest RF 3, min ISR 2 | verwaltet |
| Wartungsfenster | ja | nein | nein |
| Broker je Cluster | 30 (ZooKeeper) / 60 (KRaft) | 30 (ZooKeeper) / 60 (KRaft) | keine Broker sichtbar |
| Authentifizierung | IAM, SASL/SCRAM oder mTLS | IAM, SASL/SCRAM oder mTLS | **nur IAM** |
| Autorisierung | IAM-Policies **oder** Kafka-ACLs | IAM-Policies **oder** Kafka-ACLs | **nur IAM-Policies** |

Die letzten beiden Zeilen sind die, die in dieser Aufgabe wehtun.

## Die ehrliche Feinheit

**„Kein Code wird angefasst" gilt nicht für alle drei Zielvarianten.**

Die Dokumentation zu MSK Serverless sagt es in zwei Sätzen: MSK Serverless **verlangt IAM Access Control für alle Cluster**, und Apache-Kafka-ACLs werden **nicht unterstützt**. Für den Automobilzulieferer heißt das konkret:

Jeder Client braucht die IAM-Auth-Bibliothek im Classpath und die vier Zeilen `security.protocol`, `sasl.mechanism`, `sasl.jaas.config` und `sasl.client.callback.handler.class`. Das ist Konfiguration plus eine Abhängigkeit — bei vierzig Anwendungen ein Rollout, kein Handgriff. Und wer heute mit ACLs autorisiert, baut die Berechtigungen nach IAM um: aus `kafka-acls.sh` werden IAM-Policies, aus Prinzipalen werden Rollen. Die Anwendungslogik bleibt unberührt, das Berechtigungsmodell nicht.

Bei Provisioned besteht diese Zwangslage nicht — dort sind SASL/SCRAM und TLS-Zertifikate mit ACLs weiterhin möglich, AWS empfiehlt IAM lediglich. **Wer den Satz „ohne Codeänderung" wörtlich nimmt, landet deshalb bei Provisioned, nicht bei Serverless.**

Zwei kleinere Ehrlichkeiten dazu:

**KRaft ist nicht überall gleich weit.** Für Express-Broker kam KRaft erst am 18.12.2025 mit Kafka 3.9; neue Express-Cluster auf 3.9 nutzen es automatisch, das Upgrade bestehender Cluster war zum Ankündigungszeitpunkt noch nicht möglich und für eine spätere Version angekündigt. Wer eine Prüfungsfrage aus 2024er-Material liest, sieht diese Staffelung nicht.

**Die Karte zeigt den Zielzustand, nicht den Weg.** Wie bestehende Topics, Daten und Offsets tatsächlich hinüberkommen, ist ein eigenes Thema — dafür gibt es den MSK Replicator, mit eigenen Grenzen. Ebenso fehlt die Netzanbindung: Zwischen Rechenzentrum und VPC braucht es Direct Connect oder VPN, sonst erreicht kein Client die Bootstrap-Server.

## Syntax lesen — Bootstrap-Server und Port

Der Port ist keine Nebensache: Er **ist** die Angabe, mit welchem Verfahren du dich anmeldest.

```
b-1.zulieferer-prod.a1b2c3.c2.kafka.eu-central-1.amazonaws.com:9098
│   │                              │      │                   │
│   │                              │      │                   └─ Verfahren
│   │                              │      └─ Region
│   │                              └─ Dienst
│   └─ Clustername
└─ Broker 1 von n
```

Die Portbelegung steht in der MSK-Dokumentation:

```
9092  Plaintext
9094  TLS                    (öffentlich: 9194)
9096  SASL/SCRAM             (öffentlich: 9196)
9098  IAM Access Control     (öffentlich: 9198)
2181  ZooKeeper, Standard    (2182 mit TLS)
```

Zwei Folgerungen für die Praxis. **Erstens:** Der klassische Verbindungsfehler ist kein Netzfehler, sondern eine Portverwechslung — Bootstrap-Adresse für IAM geholt, Security Group nur für 9094 geöffnet, Zeitüberschreitung ohne aussagekräftige Meldung. **Zweitens:** Dass 2181 in dieser Liste überhaupt noch steht, ist der letzte Rest der ZooKeeper-Welt. Bei KRaft-Clustern gibt es diesen Port nicht mehr, weil es die Knoten nicht mehr gibt.

## Was du dadurch nicht baust

- keine Umstellung der Anwendungslogik — Serializer, Consumer Groups und Offsets bleiben
- keine Ablösung von Kafka Connect oder Kafka Streams; beide laufen weiter clientseitig
- keine ZooKeeper-Knoten mehr, wenn der Cluster im KRaft-Modus läuft
- kein Stream Processing im Dienst selbst — Fensteraggregate rechnet Flink oder Kafka Streams, nicht MSK
- keine Befreiung von Kafka-Wissen: Partitionen, Replikation und Retention bleiben deine Entscheidung
- keinen automatischen Datenumzug; dafür braucht es einen eigenen Vorgang

## Wenn du dir eine Sache merkst

**MSK, wenn der Kafka-Code bleiben soll — Kinesis, wenn neu gebaut wird.**

Wer „existing Apache Kafka applications", „without changing application code" oder „already using Kafka Connect" liest, ist bei MSK. Wer eine grüne Wiese hat und AWS-nativ bauen darf, ist bei Kinesis. Und wer drei gleichrangige MSK-Optionen sieht, hat die zweistufige Wahl übersehen.

## Prüfungsknackpunkte

**Signalwörter:** „existing Apache Kafka applications", „without changing application code", „already using Kafka Connect and Kafka Streams", „reduce the operational overhead of running Kafka", „migrate from self-managed Kafka", „open-source compatible". Bestehender Kafka-Code schlägt jedes Durchsatzargument.

**Die Kompatibilitätsfalle.** MSK ist kein kompatibler Nachbau, sondern Apache Kafka. Eine Antwortoption, die MSK als „Kafka-ähnlich" beschreibt oder eine Anpassung der Clients verlangt, beschreibt einen anderen Dienst.

**Die ZooKeeper-Falle.** Die oft zitierte 30-Broker-Grenze gilt nur für ZooKeeper-basierte Cluster; mit KRaft sind es 60. Material vor Mitte 2024 beschreibt durchgängig die alte Architektur.

**Die Serverless-Falle.** „Serverless ist immer die einfachere Wahl" stimmt hier nicht: Es erzwingt IAM Access Control und kennt keine Kafka-ACLs.

**Warum Kinesis Data Streams hier verliert:** andere API und andere SDKs — vierzig Anwendungen, ein SAP-Konnektor und eine Streams-Topologie müssten umgeschrieben werden.

**Warum selbstverwaltetes Kafka auf EC2 hier verliert:** löst das Kompatibilitätsproblem, aber nicht das eigentliche — die zwei Vollzeitstellen für Broker-Austausch und Patch-Fenster blieben bestehen.

**Warum SQS oder SNS hier verlieren:** kein Kafka-Protokoll, kein Replay über eine Zeitachse, keine Consumer Groups mit eigenen Offsets.

**Warum Managed Service for Apache Flink hier verliert:** rechnet über Ereignisse hinweg, transportiert sie aber nicht — es ersetzt keinen Broker.

**Warum „Firehose statt MSK" hier verliert:** Firehose liefert ab und hält nichts vor; die vierzig Anwendungen erwarten einen Broker, aus dem sie lesen.
