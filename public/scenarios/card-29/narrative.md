---
cardNumber: 29
slug: documentdb-dms-wildbach-mongodb-lift-and-shift
title: "DocumentDB — MongoDB-Workload managed betreiben, ohne die Anwendung umzuschreiben"
services: ["Amazon DocumentDB", "AWS DMS"]
domains: ["D2", "D3"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/what-is.html"
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/how-it-works.html"
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/compatibility.html"
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/db-cluster-manage-performance.html"
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/connect_programmatically.html"
  - "https://docs.aws.amazon.com/documentdb/latest/devguide/functional-differences.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/07/amazon-documentdb-mongodb-8-0-1-mongo-api/"
  - "https://aws.amazon.com/about-aws/whats-new/2026/04/amazon-documentdb-mongodb-in-place-version-upgrade-5-0-to-8-0/"
  - "https://aws.amazon.com/documentdb/faqs/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, aus einer alten Wohnung in eine neue zu ziehen.

**Art eins:** Die neue Wohnung ist schöner, aber alle Türmaße sind anders. Deine Schränke passen nicht, deine Küche passt nicht, die Vorhänge passen nicht. Du ziehst nicht um, du richtest neu ein. Das ist die Migration eines Dokumentmodells in eine relationale Datenbank: Aus einem Zelt mit Packmaß und Wassersäule, einem Kletterseil mit Durchmesser und Sturzzahl und einem Schuh mit Größentabelle wird entweder eine Wand aus NULL-Spalten oder ein Entity-Attribute-Value-Muster, das keine Abfrage mehr lesbar macht.

**Art zwei:** Die neue Wohnung hat exakt dieselben Türmaße. Deine Möbel passen, dein Schlüssel passt in dasselbe Schloss. **Nur die Adresse ändert sich.** Und der Hausmeister, den es vorher nicht gab, kümmert sich jetzt um Heizung, Dach und Wasserleitung.

Wildbach Outdoor betreibt seit sieben Jahren ein eigenes MongoDB Replica Set: drei Knoten, 1,4 TB, Version 5.0, eigene Patches, eigene Backups, eigenes Failover-Testen. Vier Leute, die lieber Features bauen würden. Das Problem ist nicht die Datenbank, sondern **der Betrieb**.

DocumentDB ist Art zwei. Und die Fußnote, die diese Karte ehrlicher macht als die meisten Kursfolien: Fast alle Türmaße stimmen. Bei einem Schrank musst du nachmessen.

## Was es eigentlich ist — ein Connection-String und ein geteiltes Volume

Die Anwendung behält ihren MongoDB-Treiber. Was sich ändert, ist eine Zeichenkette:

```
mongodb://appuser:****@wildbach-prod.cluster-a1b2c3.eu-central-1.docdb.amazonaws.com:27017/
  ?tls=true
  &tlsCAFile=global-bundle.pem
  &replicaSet=rs0
  &readPreference=secondaryPreferred
  &retryWrites=false
```

Lies das von oben nach unten, es ist die vollständige Umstellung.

`cluster-a1b2c3…docdb.amazonaws.com` ist der **Cluster-Endpoint**. Er zeigt immer auf die aktuelle Primary Instance — auch nach einem Failover, ohne dass die Anwendung etwas merkt.

`tls=true` mit `tlsCAFile` ist bei DocumentDB der Normalfall, nicht die Ausnahme. Das Zertifikatsbündel muss ins Deployment.

`readPreference=secondaryPreferred` ist die Zeile, die die Read Replicas überhaupt erst benutzt. Ohne sie geht alles an die Primary, und die 15 Replicas stehen als teure Zuschauer daneben.

`retryWrites=false` ist die eine Zeile, an der „nur der Connection-String ändert sich" eine Fußnote bekommt: **Retryable Writes unterstützt DocumentDB nicht.** Treiber ab MongoDB 4.2 schalten sie standardmäßig ein, also musst du sie ausschalten. Und AWS setzt selbst noch eine Warnung obendrauf — in der alten `mongo`-Shell darf `retryWrites=false` gerade *nicht* mitgegeben werden, dort sind Retryable Writes ohnehin aus, und der Parameter kann normale Lesekommandos zum Scheitern bringen.

Ein Parameter, zwei entgegengesetzte Regeln je nach Client. Genau solche Stellen meint der rot gestrichelte Kasten auf der Karte.

## Der Weg durch die Karte

### Der graue Rahmen — das eigene Rechenzentrum

`RECHENZENTRUM` mit gestricheltem Rand, darin MongoDB mit `eigene Patches` und `eigene Backups`. Grau gestrichelt heißt im Stil-Guide „extern", und extern heißt hier: Das ist der Zustand, den die Karte auflöst.

Die beiden Zeilen sind keine Deko. Sie sind die eigentliche Anforderung der Aufgabe. Nicht „wir brauchen eine andere Datenbank", sondern „wir wollen diese beiden Zeilen loswerden".

### Badge 1 — MongoDB zu DMS

AWS DMS liest aus dem bestehenden Replica Set. Das Wichtige steht nicht auf der Karte und ist trotzdem der Prüfungsinhalt: Das ist eine **homogene** Migration, Dokumentmodell zu Dokumentmodell.

Ein Schema Conversion Tool wird hier **nicht** gebraucht. SCT übersetzt Strukturen zwischen unterschiedlichen Engine-Typen — Oracle nach PostgreSQL, SQL Server nach MySQL. Hier ist die Zielstruktur dieselbe wie die Quellstruktur.

Das ist die Brücke zu Karte 72, wo genau diese Unterscheidung die Frage ist.

### Badge 2 — Full Load plus CDC

`Full Load + CDC` und `Umstellung im Betrieb`. Zwei Phasen: Erst wandert der Bestand, dann hält Change Data Capture die Zielseite aktuell, während das Altsystem weiterläuft.

Die Konsequenz ist der Grund, warum diese Kombination in Prüfungsfragen fast immer die richtige Antwort ist: **Die Umstellung wird ein Endpoint-Wechsel statt eines Wochenendprojekts.** Du migrierst nicht in einem Wartungsfenster, sondern schaltest um, wenn der Rückstand nahe null ist.

### Badge 3 — Primary schreibt ins Cluster-Volume

Hier liegt die Architektur. DocumentDB trennt **Compute und Storage**: Die Instanzen rechnen, das Cluster-Volume speichert. Ein Cluster besteht aus 0 bis 16 Instanzen und genau einem Volume.

Das Volume wächst automatisch in 10-GB-Schritten mit den Daten mit. Du provisionierst keinen Speicher auf Vorrat und bezahlst nur, was belegt ist.

### Der gestrichelte Pfeil — `geteilt`

Der Pfeil vom Cluster-Volume zurück zu den Read Replicas trägt bewusst **keinen Nummern-Badge**. Er ist kein Ablaufschritt, sondern eine dauerhafte Eigenschaft.

Und er ist die wichtigste Zeile der Karte: **Die Read Replicas halten keine eigene Kopie.** Sie lesen aus demselben Volume wie die Primary.

Das Bild dazu: Klassische Read Replicas sind fünfzehn Kopien eines Buchs, die jemand ständig nachpflegen muss. Hier steht ein Buch auf dem Tisch, und fünfzehn Leute lesen mit.

Daraus folgt alles Weitere: Eine neue Replica ist in Minuten da statt in Stunden, unabhängig davon, wie groß das Volume ist. Es gibt keinen Replikationsverzug im klassischen Sinn — der Rückstand liegt üblicherweise unter 100 Millisekunden. Und es gibt keine Schreiblast auf den Replicas, weil sie nichts nachschreiben.

### Der Read-Replicas-Kasten — `bis zu 15` heißt hier etwas anderes

Ein Cluster besteht aus 0 bis 16 Instanzen: **genau einer Primary und bis zu 15 Replicas.** Alle unterstützen Lesen, schreiben darf nur die Primary.

Weil die Replicas kein eigenes Volume nachziehen, gilt hier eine Reihe von Aussagen, die bei klassischen Read Replicas falsch wären. Eine neue Replica ist in Minuten verfügbar, egal ob das Volume 10 GB oder 10 TB hält. Der Rückstand liegt üblicherweise unter 100 Millisekunden. Und beim Ausfall der Primary übernimmt eine Replica, ohne dass Daten nachgeladen werden müssten — es gibt nichts nachzuladen, das Volume ist dasselbe.

Der Prüfungspunkt daran ist eine Negation: **Read Replicas erhöhen den Lesedurchsatz, nicht den Schreibdurchsatz.** Es gibt genau einen Writer. Wer über eine einzelne Instanz hinaus schreiben muss, braucht Elastic Clusters mit Sharding — oder eine andere Datenbank. Ein Distraktor, der 15 Replicas gegen ein Schreibproblem anbietet, ist immer falsch.

### Badge 4 — die Anwendung spricht den Cluster-Endpoint an

`unveränderter MongoDB-Treiber`, `nur der Connection-String ändert sich`. Das ist die Prüfungsantwort in einem Satz.

Beachte, was die Karte damit **nicht** sagt: Sie sagt nicht „dieselbe Datenbank". Sie sagt „derselbe Treiber".

### Der Kasten DocumentDB 8.0

`MongoDB-API 6, 7, 8`, `In-place-Upgrade`, `Serverless verfügbar`, `Elastic Clusters: Sharding`. Vier Zeilen, die in Kursmaterial fast durchweg fehlen.

Version 8.0 bringt Kompatibilität mit den MongoDB-API-Versionen 6.0, 7.0 und 8.0, dazu bis zu siebenfach bessere Query-Latenz und bis zu fünffach bessere Kompression. Das In-place-Upgrade von 5.0 auf 8.0 läuft ohne neue Cluster, ohne Endpoint-Wechsel und ohne Index-Neuaufbau.

**DocumentDB Serverless** ist seit Mai 2026 auf Version 8.0 verfügbar und skaliert die Kapazität automatisch in feinen Schritten mit der Last. AWS beziffert die Ersparnis gegenüber einer Provisionierung für Spitzenlast mit bis zu 90 Prozent. Das ist der direkte Gegenpart zu Aurora Serverless v2 auf Karte 23 — und der Grund, warum ein Distraktor der Form „für schwankende Last taugt DocumentDB nicht, weil man Instanzen provisionieren muss" veraltet ist.

**Elastic Clusters** sind die zweite Cluster-Art: Sharding für Millionen Lese- und Schreibvorgänge pro Sekunde und Petabyte-Kapazität. Wer bei „muss über eine einzelne Instanz hinaus schreiben" reflexhaft an DynamoDB denkt, hat hier eine zweite Option.

Die beiden Zeilen zusammen sind der Grund, warum diese Karte mehr sagt als „MongoDB, aber managed": Der Dienst deckt inzwischen drei Betriebsformen ab — instanzbasiert, serverless und geshardet.

### Der rot gestrichelte Kasten — `API, nicht Engine`

`manche Operatoren fehlen`, `8.0.1 ergänzte 46 davon`, `Kompatibilität prüfen, nicht annehmen`.

Das ist der ehrlichste Kasten auf dieser Karte. DocumentDB implementiert die MongoDB-**API**, nicht die MongoDB-Engine. Der beste Beleg dafür, dass die Lücken real sind, ist die Nachlieferung selbst: Version 8.0.1 hat 46 weitere Aggregations-Operatoren und Cursor-Methoden ergänzt — 13 Akkumulatoren, 15 Trigonometrie-Funktionen, 4 Bitweise-Operatoren und weitere. Wer nachreicht, hatte vorher nicht alles.

## Die entscheidende Unterscheidung — Dokument gegen Graph

Beides ist „nicht-relational und managed". Die Prüfung unterscheidet über die **Frageform**, nicht über das Buzzword:

| Was die Frage sucht | Modell | Antwort |
|---|---|---|
| Struktur **innerhalb** eines Datensatzes — verschachtelte Felder, je Kategorie andere Attribute, flexibles Schema | Dokument | **DocumentDB** |
| Verbindung **zwischen** Datensätzen — „wer kennt wen", mehrere Hops, Ringe, Empfehlungen | Graph | **Neptune** (Karte 26) |

Der Satz, der beide Seiten trägt, steht auch im Narrativ zu Karte 26 und wird hier bewusst wortgleich wiederholt: **Verweise zwischen Dokumenten sind Felder, keine traversierbaren Kanten.** In DocumentDB ist ein Verweis ein Feld mit einer ID — die Anwendung muss selbst nachladen und selbst verknüpfen. In Neptune ist die Kante ein eigenständiges Objekt, das man traversieren, zählen und gewichten kann.

Praktischer Test an einer Prüfungsfrage: Steht dort „für jedes Produkt andere Attribute" → Dokument. Steht dort „über bis zu vier Zwischenschritte verbunden" → Graph. Steht beides, gewinnt die Frage nach der Verbindung, denn ein Graph kann Dokumente halten, aber ein Dokumentspeicher traversiert nicht.

## Die ehrliche Feinheit

**Auf der Karte steht `bis 128 TiB` neben `DocumentDB 8.0` — richtig ist: 256 TiB ab Version 8.0.** Der Developer Guide sagt es versionsdifferenziert: Das Storage-Volume wächst bis maximal 256 TiB ab Engine-Version 8.0 und höher, 128 TiB bei früheren Versionen. Die Karte zeigt beides nebeneinander und widerspricht sich damit selbst — die 8.0-Box oben, die Vor-8.0-Grenze im Volume-Kasten. Fixvorschlag: `bis 256 TiB`. Ehrlicher Zusatz: Drei andere AWS-Seiten (How-it-works, FAQ, Features) nennen weiterhin pauschal 128 TiB, ohne die Version zu unterscheiden. Die versionsdifferenzierte Angabe ist die spezifischere und die neuere.

**Zweite Feinheit: die Einheit ist nicht eindeutig, und AWS ist es auch nicht.** Die Karte schreibt `10-GiB-Schritte`, die `.md` derselben Karte schreibt „10-GB-Schritten". Beides lässt sich belegen — FAQ und die Scaling-Seite des Developer Guide schreiben GiB, What-is und die Features-Seite schreiben GB. Für dieselbe Zahl. Das ist kein Fehler der Karte, sondern ein Quellenkonflikt; was nicht bleiben darf, ist die Abweichung zwischen Karte und Begleittext. Fürs Lernen ist die Zahl ohnehin nur eine Größenordnung: Der Speicher wächst in kleinen Schritten automatisch mit, du provisionierst nichts.

**Dritte Feinheit: die Zahlen gehören zu verschiedenen Cluster-Arten und dürfen nicht in einen Satz.** 128 beziehungsweise 256 TiB sind die Obergrenze des Cluster-Volumes bei **instanzbasierten** Clustern. Die Petabyte-Angaben gehören zu **Elastic Clusters**, die eine andere Architektur haben. Wer beides mischt, produziert eine Zahl, die es nirgends gibt.

**Vierte Feinheit, die Prüfung gegen Praxis trennt:** Für die Prüfung bleibt „ohne Anwendungsänderung migrieren" die erwartete Antwort. Für die Praxis gilt: Kompatibilität gegen die AWS-Liste der unterstützten APIs, Operationen und Datentypen prüfen, nicht annehmen. Beides ist richtig, in unterschiedlichen Räumen.

## Syntax lesen — woran du einen DocumentDB-Endpoint erkennst

Der Hostname sagt dir mehr als jede Dokumentation, und in Prüfungsfragen taucht er als Beleg auf:

```
wildbach-prod.cluster-a1b2c3.eu-central-1.docdb.amazonaws.com
    │              │              │          │
    │              │              │          └─ Dienst: docdb
    │              │              └─ Region
    │              └─ "cluster-" = Cluster-Endpoint, zeigt auf die Primary
    └─ dein Clustername
```

Drei Varianten kommen vor, und der Unterschied ist prüfungsrelevant:

`cluster-a1b2c3` — der **Cluster-Endpoint**. Schreiben und Lesen, zeigt immer auf die aktuelle Primary. Nach einem Failover zeigt er auf die neue Primary, ohne dass du etwas änderst.

`cluster-ro-a1b2c3` — der **Reader-Endpoint**. Verteilt Leseanfragen über die Replicas. Auf der Karte steht er im Read-Replicas-Kasten, hat aber bewusst keinen eigenen Pfeil: Die Anwendung verbindet sich in diesem Szenario auf den Cluster-Endpoint, die Lastverteilung ist eine Frage der `readPreference`.

Ohne `cluster-` im Namen — ein **Instanz-Endpoint**. Der zeigt auf genau eine Instanz und überlebt keinen Failover. Wer den in die Anwendung schreibt, hat sich die Hochverfügbarkeit wegkonfiguriert.

## Was du dadurch nicht baust

Zähl durch, was nach der Migration **nicht** mehr existiert:

- kein eigenes Patchen der Datenbankknoten
- keine selbst gebauten Backups und kein selbst getestetes Failover
- keine Umstellung des Datenmodells und kein Schema Conversion Tool
- kein neuer Treiber, kein neues ORM, keine neue Abfragesprache
- keine Replikationskopien, die nachgezogen werden müssen
- kein Wartungsfenster für die Umstellung

Und was es weiterhin **nicht** gibt: MongoDB. Es gibt einen Dienst, der dieselbe API spricht.

## Wenn du dir eine Sache merkst

**Das Signalwort ist nicht „NoSQL", sondern „MongoDB-kompatibel" oder „bestehende Treiber".**

DynamoDB ist Key-Value mit Partition Key und Kapazitätsmodell — richtig bei „single-digit millisecond", falsch bei „MongoDB". Neptune modelliert Kanten als Objekte — richtig bei „mehrere Hops", falsch bei „flexibles Schema". Eine relationale Datenbank verlangt genau die Modelländerung, die die Aufgabe ausschließt.

## Prüfungsknackpunkte

**Signalwörter:** „MongoDB-compatible", „JSON documents, flexible schema", „lift and shift without rewriting the application", „reduce operational overhead of a self-managed database", „existing MongoDB drivers". Steht „MongoDB" in der Frage, steht DocumentDB in der Antwort.

**Die Betriebsfalle.** Viele Fragen beschreiben ein funktionierendes MongoDB und fragen trotzdem nach einer Änderung. Lies, was stört: Wenn es Patches, Backups und Failover sind und nicht die Abfragen, ist es kein Datenbankproblem, sondern ein Betriebsproblem — und die Antwort ist ein managed Dienst, keine andere Engine.

**Die Replica-Falle.** „Read Replicas haben eine eigene Kopie" ist bei RDS richtig (Karte 22) und hier falsch. Alle Instanzen teilen sich dasselbe Cluster-Volume. Wer das verwechselt, zieht falsche Schlüsse über Verzug, Promotion und die Dauer, eine Replica hinzuzufügen.

**Die Versionsfalle.** „DocumentDB ist kompatibel mit MongoDB 3.6, 4.0 und 5.0" steht in älterem Kursmaterial. Aktuell ist 8.0 mit den API-Versionen 6.0, 7.0 und 8.0. In der Prüfung ist die Versionsnummer selten die Antwort — aber ein Distraktor der Form „nur bis Version X kompatibel, daher Umschreiben nötig" wird damit erkennbar falsch.

**DMS ohne SCT:** homogene Migration, gleiches Modell. Taucht „Schema Conversion Tool" als Antwortoption auf, ist sie hier falsch.

**DynamoDB:** anderer Zugriffspfad. Ein Schlüssel statt einer reichhaltigen Abfrage mit Aggregations-Pipeline.

**Neptune:** modelliert die Verbindung zwischen Datensätzen. Verweise zwischen Dokumenten sind Felder, keine traversierbaren Kanten.

**Timestream:** ordnet nach Zeit, nicht nach Struktur. Signalwort dort ist „Abfrage nach Zeitfenster".

**Öffentlicher Endpoint:** existiert nicht. DocumentDB läuft VPC-only.
