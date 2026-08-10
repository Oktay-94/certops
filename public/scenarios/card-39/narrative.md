---
cardNumber: 39
slug: aurora-global-database-kestrel-payments-switchover-failover
title: "Aurora Global Database — RPO und RTO über Regionsgrenzen"
services: ["Amazon Aurora Global Database", "Aurora PostgreSQL", "Aurora MySQL", "Amazon Application Recovery Controller"]
domains: ["D2", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Replication.CrossRegion.html"
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/aurora-replication-options/aurora-global-database.html"
  - "https://d1.awsstatic.com/Amazon%20Aurora%20High%20Availability%20and%20Disaster%20Recovery%20Features%20for%20Global%20Resilience%20Whitepaper.pdf"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Kassenbuch an einem zweiten Ort zu spiegeln.

**Weg eins:** Ein Schreiber sitzt in Frankfurt, liest jede Buchung laut vor, und ein zweiter Schreiber in Virginia schreibt mit. Das funktioniert, kostet aber den Vorleser Zeit — er muss vorlesen, statt zu buchen. Bei hoher Last wird er langsamer, und der Mitschreiber kommt trotzdem hinterher.

**Weg zwei:** Unter dem Kassenbuch liegt Kohlepapier, und der Durchschlag wird nach Virginia gefahren. Der Buchhalter in Frankfurt merkt vom Kopieren **nichts**. Er drückt beim Schreiben ohnehin auf.

Aurora Global Database ist das Kohlepapier. Die Replikation läuft nicht über Binlog oder logische Replikation, sondern **unterhalb der Datenbank-Engine** im verteilten Speichersystem. Deshalb kostet sie den Writer kaum Rechenleistung, und deshalb liegt die typische Verzögerung unter einer Sekunde.

Und aus dem Bild folgt die zweite Hälfte der Karte von selbst: Es gibt **ein** Original. Der Durchschlag ist ein Durchschlag. Wer in Virginia hineinschreiben will, schreibt nicht ins Kassenbuch — er schreibt auf ein Blatt, das niemand liest.

## Was es eigentlich ist — ein Global Cluster über regionalen Clustern

Ein Aurora Global Database ist kein Cluster. Es ist eine **Klammer über Clustern**, mit einer eigenen Identität und einer eigenen API:

```
GlobalCluster: kestrel-global
├── eu-central-1   Rolle: primary     Writer + Reader   ← alle Writes
├── us-east-1      Rolle: secondary   nur Reader        read-only
└── ap-northeast-1 Rolle: secondary   nur Reader        read-only
```

Die Zeile, die die ganze Karte trägt, ist die Spalte **Rolle**. Genau ein Cluster hat `primary`. Das ist keine Konfigurationsentscheidung, die man auch anders treffen könnte — es ist die Bauart.

Auf diesen Klammer-Cluster wirken genau zwei Operationen, und die Prüfung fragt nach dem Unterschied:

```
aws rds switchover-global-cluster \
  --global-cluster-identifier kestrel-global \
  --target-db-cluster-identifier arn:aws:rds:us-east-1:1234:cluster:kestrel-use1

aws rds failover-global-cluster \
  --global-cluster-identifier kestrel-global \
  --target-db-cluster-identifier arn:aws:rds:us-east-1:1234:cluster:kestrel-use1 \
  --allow-data-loss
```

Zwei Befehle, fast identisch. Der Unterschied ist die letzte Zeile: **`--allow-data-loss`**. AWS zwingt dich, den Datenverlust selbst hinzuschreiben. Der Flag ist nicht optional-dekorativ, er ist das, was aus einem Switchover einen Failover macht.

## Der Weg durch die Karte

### Der Kasten links — Kestrel Payments und zwei Anforderungen, die man verwechselt

`Schreibpfad`, `Frankfurt`. Blau, die Anwendung.

Kestrel Payments wickelt Kartenzahlungen ab. Die Aufsicht verlangt einen dokumentierten Wiederanlaufplan mit belegten Zielwerten **und einen quartalsweisen DR-Test im Produktivsystem**. Gleichzeitig sollen Lesezugriffe aus Nordamerika nicht mehr über den Atlantik laufen.

Die beiden Anforderungen sehen ähnlich aus und sind es nicht:

**Der DR-Test darf keine Daten kosten. Der echte Ausfall darf welche kosten.**

Aurora hat für beides eine eigene Operation. Genau diese Unterscheidung ist der Kern der Karte, und genau sie wird in Prüfungsfragen abgefragt.

### Badge 1 und der Aurora-Primary-Kasten — eine einzige Quelle der Wahrheit

`eu-central-1`, `einzige Schreibregion`, `Writer + Reader`. Rot-Pink, wie alle Aurora-Cluster auf dieser Karte.

Alle Schreibvorgänge gehen hierher. Innerhalb der Region liegt ein normaler Aurora-Cluster mit einer Writer-Instanz und Reader-Instanzen über mehrere Availability Zones, plus der geteilten Storage-Schicht. Die Karte zeichnet das als **eine** Box, weil der Regionsaspekt der Karteninhalt ist, nicht der AZ-Aufbau.

Verbunden wird idealerweise nicht über den Cluster-Endpoint dieser Region, sondern über den **Aurora Global Database Writer Endpoint**. Warum, wird bei Badge 4 wichtig.

### Badge 2 und der Replikationspfeil — `< 1 s Lag`

Der Pfeil zum Secondary trägt die Beschriftung `< 1 s Lag`.

Die Doku formuliert das als „latency **typically** under a second" — mit dem Prüfwort. Für die Karte ist die Verkürzung vertretbar, weil sie die Größenordnung trifft und der Wert nicht abgeleitet weiterverrechnet wird. Wer den Wert im Betrieb wirklich braucht, misst ihn: Die CloudWatch-Metrik heißt `AuroraGlobalDBRPOLag` (bei älteren Aurora-MySQL-Minorversionen `AuroraGlobalDBReplicationLag`) und gibt den Rückstand in **Millisekunden** an.

Merk dir die Metrik, nicht die Zahl. Der Lag ist keine Diensteigenschaft, sondern ein Messwert, der mit Last und Distanz schwankt — und er ist gleichzeitig dein RPO.

### Der Aurora-Secondary-Kasten — read-only ist keine Einstellung

`us-east-1`, `read-only, nimmt keine Writes`, `beförderbar in ~1 Minute`.

Die Sekundärregion hält einen vollständigen Datenbestand und bedient lokale Lesezugriffe. Ein Detail, das man geschenkt bekommt und das gern gefragt wird: Weil der Sekundärcluster keine Writer-Instanz hat, kann er **16 statt 15** Reader-Instanzen tragen.

Zur dritten Zeile gibt es einen offenen Punkt, siehe unten bei Badge 4 und 5.

### Badge 3 und der gestrichelte Kasten — weitere Secondaries

`mehrere Regionen möglich`, `je Region eine volle Kopie`.

Auf der Karte steht bewusst **keine Zahl**, und das ist die einzig belastbare Entscheidung. Denn AWS widerspricht sich hier selbst:

- Der **Aurora User Guide** schreibt an zwei Stellen „up to **10** read-only secondary Regions".
- Die **AWS Prescriptive Guidance** schreibt „up to **five** read-only secondary DB clusters".
- Das **Whitepaper zur globalen Resilienz** nennt ebenfalls fünf, und die Zahl 5 steht in praktisch allen Kursmaterialien.

Das sind alles AWS-Quellen. Wahrscheinlich wurde das Limit angehoben und nicht überall nachgezogen — belegen lässt sich das aus dem vorliegenden Material **nicht**. Wer die Zahl für das eigene Konto braucht, sieht im Service-Quotas-Bereich der Konsole nach; das ist die einzige verbindliche Quelle.

Wichtig für die Karte: Jede Sekundärregion ist gleichwertig, und **jede** von ihnen kann Ziel von Switchover oder Failover sein. Dass die beiden Pfeile im Diagramm an `us-east-1` hängen, ist Platzgründen geschuldet.

### Badge 4 und der Switchover-Kasten — der geplante Rollentausch

`RPO = 0, kein Datenverlust`, `alle Cluster müssen gesund sein`, `Rollen tauschen, ~1 Minute`, `für DR-Test und Wartungsrotation`. Grün, der verlustfreie Weg.

Der Ablauf, in der Reihenfolge der Doku: Aurora **wartet zuerst**, bis die Zielregion vollständig synchronisiert ist. Dann wird der bisherige Primary read-only. Dann befördert der Sekundärcluster einen seiner Reader zum Writer. Weil vorher synchronisiert wurde, geht **nichts** verloren.

Die Voraussetzung steht in Zeile zwei und ist keine Empfehlung: **alle beteiligten Cluster müssen erreichbar sein.** Dazu kommt eine, die auf der Karte keinen Platz hat: Primary und Secondary müssen **dieselbe Major- und Minorversion** der Engine fahren.

Zur Zeitangabe `~1 Minute` gibt es einen Quellenkonflikt, der nicht aufgelöst ist. Das **Whitepaper zur globalen Resilienz** schreibt, ein Aurora-Cluster erhole sich „typically ... in a minute", mit effektivem RPO von 1 Sekunde und RTO von 1 Minute. Der **User Guide** nennt für Switchover **gar keine Zahl** — und sagt stattdessen ausdrücklich, die Dauer sei **proportional zum Replikationslag**: je größer der Lag, desto länger der Switchover. Beides sind AWS-Quellen.

**Zwei Wege stehen zur Wahl, wie die Karte damit umgeht:**

**Weg A — die Zahl streichen.** Aus `Rollen tauschen, ~1 Minute` wird `Rollen tauschen, Dauer je nach Lag`, aus `beförderbar in ~1 Minute` wird `beförderbar per Promotion`. Die Karte trägt dann nur, was der User Guide deckt.

**Weg B — die Zahl bleibt** als Whitepaper-Richtwert, und der Vorbehalt lebt hier im Text. Die Karte behält ihre Konkretheit, aber ein Leser hält die Minute für eine Diensteigenschaft.

In beiden Fällen gilt für die Prüfung dasselbe: Wenn die Frage nach RTO für Aurora Global Database fragt, ist die erwartete Antwort **Minuten**, nicht Stunden — und nicht Sekunden.

### Badge 5 und der Failover-Kasten — der ungeplante Weg

`RPO in Sekunden`, `abhängig vom Replikationslag`, `RTO in Minuten`, `für den echten Regionalausfall`. Gold — der Weg, der einen Preis hat, und der Preis sind Daten statt Geld.

Fällt die Primärregion aus, wird ein Sekundärcluster befördert, **ohne dass er aufholen kann**. Was zum Zeitpunkt des Ausfalls unterwegs war, ist weg. Der User Guide formuliert die Dauer als „within **a few minutes**".

Drei Details, die die Karte nicht trägt und die den Failover erst verständlich machen:

**Write Fencing.** Aurora versucht, Schreibzugriffe in der alten Primärregion über die Storage-Schicht zu stoppen, und meldet per RDS-Event, ob das gelungen ist. Es ist ein *best effort* — bei mehreren AZ-Ausfällen kann es scheitern, und dann sind kurzzeitig **Split-Brain-Situationen** möglich.

**Der Rettungs-Snapshot.** Bevor Aurora für die alte Primärregion ein neues Storage-Volume anlegt, versucht es einen Snapshot des alten Volumes zum Ausfallzeitpunkt zu ziehen — `rds:unplanned-global-failover-…`. Aus dem lassen sich die verlorenen Transaktionen im Nachhinein herausholen. Der Snapshot unterliegt der Backup-Retention des alten Clusters; wer ihn behalten will, kopiert ihn als manuellen Snapshot.

**Die alte Primärregion kommt automatisch zurück.** Beim *Managed Failover* hängt Aurora die alte Region wieder als Sekundärregion ein, sobald sie verfügbar ist — die Topologie bleibt erhalten. Beim *Manual Failover*, dem Weg über *detach and promote*, passiert das nicht; dort baut man die Topologie von Hand neu auf. Manual Failover braucht man, wenn die Engine-Versionen zwischen den Clustern nicht zusammenpassen.

### Der Teal-Kasten — `rds.global_db_rpo`

`nur Aurora PostgreSQL`, `setzt eine RPO-Obergrenze`, `bremst Transaktionen am Writer`. Teal, wie jede Steuerungsinstanz.

Der Parameter erkauft eine RPO-Garantie mit Bremswirkung. Gültige Werte reichen von **20 Sekunden** bis 2.147.483.647 Sekunden; ist er nicht gesetzt, liefert eine Abfrage `-1`.

Die Mechanik ist feiner, als sie meist wiedergegeben wird. Aurora blockiert **nicht**, sobald ein Sekundärcluster zurückfällt. Es committet, solange **mindestens ein** Sekundärcluster innerhalb des RPO-Fensters liegt, und blockiert nur, wenn **alle** darüber liegen. Bei mehreren Sekundärregionen ist das ein erheblicher Unterschied — die Garantie lautet „irgendeine Region ist aktuell genug", nicht „alle sind es".

Wer den Wert zu eng setzt, hat kein DR-Problem mehr, sondern ein Durchsatzproblem im Normalbetrieb. Für Aurora MySQL gibt es den Parameter nicht.

### Der gestrichelte Kasten rechts — Falle Write Forwarding

`Secondary nimmt Writes entgegen`, `und leitet sie zum Primary weiter`, `das ist kein aktiv-aktiv`. Rot, gestrichelt.

Die Anwendung darf Schreibbefehle an einen Reader in der Sekundärregion schicken; Aurora leitet sie über einen verwalteten Kanal an den Writer der Primärregion. Der Primary bleibt die einzige Quelle der Wahrheit, und der Schreibvorgang zahlt weiterhin die volle Netzlatenz.

**Der Gewinn ist Bequemlichkeit im Anwendungscode, nicht Schreibkapazität.** Verfügbar für Aurora MySQL seit 2020 und für Aurora PostgreSQL seit dem 09.11.2023.

### Die Merksätze-Fußzeile

Vier Sätze, und der erste ist der Prüfungskernsatz: `Switchover = RPO 0, alle Cluster gesund`. Dann `Failover = RPO in Sekunden`, `Secondary ist read-only`, `Write Forwarding ist kein aktiv-aktiv`.

## Die entscheidende Unterscheidung

Aurora Global Database und DynamoDB Global Tables sehen auf Folien ähnlich aus und sind gegensätzlich gebaut. Karte 25 behandelt die Gegenseite:

| | Aurora Global Database | DynamoDB Global Tables |
|---|---|---|
| Schreibregionen | **eine** | **alle** |
| Konfliktlösung | entfällt (nur eine Quelle) | **Last Writer Wins** |
| Konsistenz | stark innerhalb der Primärregion | eventual zwischen Regionen |
| Replikation | Storage-Ebene | Streams je Tabelle |
| DR-Charakter | Promotion nötig | kein Failover nötig |

**Der entscheidende Satz:** Global Tables brauchen kein Failover, weil jede Region schon schreibt — dafür muss die Anwendung mit *Last Writer Wins* leben können. Aurora Global Database braucht ein Failover, liefert dafür relationale Konsistenz und Transaktionen.

Seit 2025 gibt es einen dritten Fall: **Aurora DSQL** ist PostgreSQL-kompatibel und tatsächlich aktiv-aktiv über Regionen mit starker Konsistenz — also das, was Global Database ausdrücklich nicht ist. Für SAA-C03 ist DSQL noch kein Standard-Antwortkandidat. Verlangt eine Frage aber „active-active relational across Regions", ist Global Database **falsch**.

## Die ehrliche Feinheit

**Ein Failover innerhalb der Primärregion trifft alle Sekundärregionen.** Das steht in den Limitations und widerspricht dem Bauchgefühl: Startet die Writer-Instanz der Primärregion neu oder failt sie auf eine andere AZ um, **starten die Reader-Instanzen in allen Sekundärregionen ebenfalls neu**. Die Sekundärcluster sind so lange nicht verfügbar, bis alle Reader wieder synchron sind. Wer die Sekundärregionen für Lesezugriffe im Produktivbetrieb nutzt, kauft sich damit eine Kopplung ein, die man nicht erwartet.

**Bei genau zwei Regionen ist `rds.global_db_rpo` eine Falle.** AWS empfiehlt ausdrücklich, den Parameter in der Parametergruppe der Sekundärregion auf dem Default zu lassen. Sonst kann ein Failover wegen des Verlusts der Primärregion dazu führen, dass Aurora Transaktionen pausiert — man setzt eine RPO-Garantie und legt damit im Ernstfall die neue Primärregion lahm. Erst wenn Aurora den Cluster in der alten Region wieder aufgebaut hat, darf man den Parameter setzen.

**Was Global Database nicht mitbringt:** kein Backtracking, kein Aurora Auto Scaling für Sekundärcluster, keine Secrets-Manager-Integration beim Hinzufügen einer Region, kein automatisches Minor-Version-Upgrade. Und: Bei aktiviertem RPO-Feature ist ein **Major-Version-Upgrade der PostgreSQL-Engine nicht möglich**.

**Der Wiederaufbau dauert.** Nach einem Failover baut Aurora alle übrigen Sekundärregionen neu auf den Stand der neuen Primärregion auf. Das kann von wenigen Minuten bis zu **mehreren Stunden** dauern, je nach Volumengröße und Distanz. Bis dahin stehen diese Regionen für Lesezugriffe nicht zur Verfügung. Der RTO-Wert der Karte beschreibt die Schreibfähigkeit, nicht die Rückkehr zur vollen Topologie.

## Was du dadurch nicht baust

Zähl durch, was hier **nicht** existiert:

- keine zweite Schreibregion und keine Konfliktauflösung
- keine automatische Umschaltung — jede Promotion ist eine ausdrückliche Operation
- kein Ersatz für Multi-AZ; das schützt die AZ, nicht die Region
- keine Replikation über Binlog oder logische Replikation
- kein Backtracking, kein Auto Scaling für Sekundärcluster
- keine Anwendungslogik, die den Endpunktwechsel selbst merkt

Übrig bleibt: ein Global Cluster, regionale Cluster darunter und zwei API-Operationen.

## Wenn du dir eine Sache merkst

**Switchover kostet Zeit, Failover kostet Daten.**

Wer in der Frage „no data loss" oder „planned Regional rotation" liest, meint Switchover. Wer „Region becomes unavailable" oder „minimize data loss" liest, meint Failover — und die richtige Antwort enthält dann ein RPO **größer als null**.

Multi-AZ schützt vor dem Ausfall einer Availability Zone und schaltet automatisch um. Global Database schützt vor dem Ausfall einer ganzen Region und braucht eine ausdrückliche Promotion. Beides ergänzt sich, keins ersetzt das andere.

## Prüfungsknackpunkte

**Signalwörter:** „recover from a Region-wide outage", „RPO of seconds and RTO of minutes", „the secondary Region must not accept writes". Der Satz „test the disaster recovery plan **without data loss**" ist der Switchover-Marker — dort und nur dort ist RPO 0 die richtige Antwort.

**Warum „wir nehmen im Ernstfall Switchover" hier verliert:** Der häufigste Denkfehler der Karte. Switchover braucht **alle** Cluster gesund, auch den in der ausgefallenen Region. Im Ernstfall ist er nicht erreichbar. Die Operation, die RPO 0 liefert, ist genau die, die im Ernstfall nicht zur Verfügung steht.

**Warum Multi-AZ hier verliert:** Falscher Radius. Es schützt innerhalb einer Region.

**Warum Write Forwarding hier verliert:** Es beantwortet „low-latency **writes**" nicht — der Schreibvorgang läuft weiterhin zum Primary und zahlt die volle Latenz. Als Antwort auf „reduce write latency in other Regions" ist es falsch.

**Warum eine Cross-Region Read Replica hier verliert:** Sie repliziert über die Engine statt über die Storage-Schicht, hat höheren Lag und braucht eine manuelle Promotion über mehrere Minuten. Bei „RPO of seconds and RTO of minutes" reicht das nicht.

**Warum DynamoDB Global Tables hier verliert:** Kestrel Payments wickelt Kartenzahlungen ab — relational, transaktional. *Last Writer Wins* ist bei Zahlungsdaten keine akzeptable Konfliktauflösung.

**Der Endpunkt-Nachtrag:** Nach Switchover oder Failover ist die alte Sekundärregion die neue Primärregion. Wer den **Global Writer Endpoint** benutzt, muss nichts ändern — der zeigt immer auf den aktuellen Primary. Wer den Cluster-Endpoint einer Region benutzt, muss umstellen; der Unterschied steckt oft nur im `-ro` im Namen. Für die Orchestrierung drumherum hat der Amazon Application Recovery Controller einen fertigen Ausführungsblock für Aurora Global Database.
