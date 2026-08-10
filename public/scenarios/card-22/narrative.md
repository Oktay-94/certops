---
cardNumber: 22
slug: rds-multi-az-read-replica-nordlicht-schadenbearbeitung
title: "RDS Multi-AZ · Read Replicas — Verfügbarkeit und Lesekapazität auseinanderhalten"
services: ["Amazon RDS", "Amazon RDS for PostgreSQL", "RDS Multi-AZ", "RDS Read Replica"]
domains: ["D2", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PostgreSQL.Replication.ReadReplicas.Configuration.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/rds/create-db-instance-read-replica.html"
  - "https://aws.amazon.com/about-aws/whats-new/2022/10/amazon-rds-mysql-mariadb-postgre-sql-support-15-read-replicas-3x-read-capacity"
  - "https://aws.amazon.com/about-aws/whats-new/2022/03/amazon-rds-multi-az-transaction-commit-latency"
  - "https://aws.amazon.com/blogs/database/choose-the-right-amazon-rds-deployment-option-single-az-instance-multi-az-instance-or-multi-az-database-cluster/"
---

## Die Grundidee zuerst

Stell dir eine Versicherung mit genau einem Aktenschrank vor. Alle 1.400
Sachbearbeiter holen sich daraus ihre Akten, und alle legen sie dort wieder
hinein. Zwei völlig verschiedene Dinge können jetzt schiefgehen.

**Das erste:** Morgens um acht kommt das Controlling, zieht jede einzelne Akte
heraus, zählt sie und legt sie zurück. Zwei Stunden lang kommt niemand sonst an
den Schrank. Das ist kein Ausfall — der Schrank funktioniert tadellos. Er ist nur
belegt.

**Das zweite:** Nachts brennt das Gebäude ab. Der Schrank ist weg, und mit ihm
jede Akte, die nicht woanders liegt.

Man löst das nicht mit einem Werkzeug, sondern mit zwei. Gegen den Brand hilft
ein **zweiter Schrank im Nachbargebäude**, in den jede Akte in dem Moment mitkopiert
wird, in dem sie abgelegt wird — und der **verschlossen bleibt**, bis das erste
Gebäude tatsächlich brennt. Niemand darf dort blättern, sonst wüsste man nicht
mehr, welcher Schrank die Wahrheit ist. Gegen das Controlling hilft ein
**Fotokopiensatz**, der ein paar Sekunden hinterherhinkt und in dem geblättert
werden darf, soviel jemand will.

Der verschlossene Zweitschrank ist Multi-AZ. Der Fotokopiensatz ist eine Read
Replica. Sie sehen sich ähnlich, sie liegen beide in einer anderen Availability
Zone, und sie sind trotzdem kein Ersatz füreinander. Genau daran zerbrechen
Prüfungsfragen.

## Was es eigentlich ist

Das Bemerkenswerte an der Trennung: Sie ist nicht theoretisch, sie steht in zwei
verschiedenen API-Aufrufen. Multi-AZ ist ein **Schalter an der Instanz selbst**.
Eine Read Replica ist eine **eigene Ressource mit eigenem Namen**.

Verfügbarkeit — ein Flag an der bestehenden Instanz:

```
aws rds create-db-instance \
  --db-instance-identifier nordlicht-schaden \
  --engine postgres \
  --db-instance-class db.r6g.2xlarge \
  --multi-az \
  --backup-retention-period 7
```

Lesekapazität — eine zweite Instanz, die es vorher nicht gab:

```
aws rds create-db-instance-read-replica \
  --db-instance-identifier nordlicht-schaden-reporting \
  --source-db-instance-identifier nordlicht-schaden \
  --availability-zone eu-central-1c
```

Lies die beiden Blöcke nebeneinander. Oben taucht kein zweiter Name auf — der
Standby hat keinen, weil man ihn nie anspricht. `--multi-az` ist ein Boolean.
Unten steht ein neuer `--db-instance-identifier`, und das ist der ganze
Unterschied: Die Replica bekommt einen eigenen DNS-Namen, den man in eine
Konfiguration eintragen kann. Der Standby nicht.

Beachte außerdem `--backup-retention-period 7` im oberen Block. Das ist keine
Kosmetik: Eine Read Replica lässt sich nur von einer Quelle anlegen, deren
automatische Backups eingeschaltet sind. Steht die Retention auf 0, scheitert der
zweite Befehl — und zwar mit einer Fehlermeldung, die nach Berechtigungsproblem
klingt.

## Der Weg durch die Karte

### 1 — Die Anwendung spricht den Writer-Endpoint an

Die Sachbearbeitung liest *und* schreibt über einen einzigen DNS-Namen. Dieser
Endpoint ist der einzige Schreibpunkt des Systems, und daran ändert Multi-AZ
nichts: Auch mit Standby gibt es genau eine Instanz, die Schreibvorgänge annimmt.

Das ist der Satz, an dem sich die halbe Karte aufhängt. Wer Multi-AZ einschaltet,
verdoppelt die Rechnung und bekommt **null zusätzliche Abfragekapazität**.

### 2 — Multi-AZ repliziert synchron in eine zweite AZ

RDS hält in `eu-central-1b` eine synchrone Kopie. Synchron heißt: Ein Commit gilt
erst als bestätigt, wenn er auch im Standby liegt. Daraus folgt **RPO 0** — im
Ernstfall fehlt kein einziger Datensatz. Bezahlt wird das mit etwas höherer
Schreiblatenz, weil jeder Commit auf die zweite AZ wartet.

Der Standby ist auf der Karte gestrichelt gezeichnet, und das ist wörtlich zu
nehmen. AWS schreibt in einem eigenen Hinweis, dass die Hochverfügbarkeitsoption
keine Skalierungslösung für Lesezugriffe ist und ein Standby keinen Leseverkehr
bedienen kann. Er hat keinen Endpoint, er beantwortet keine Abfrage, er wartet.

Das Bild dazu: ein Ersatzreifen im Kofferraum. Er trägt kein Gewicht, solange er
dort liegt. Genau deshalb ist er im Ernstfall brauchbar.

### 3 — Die Read Replica repliziert asynchron

Parallel läuft in `eu-central-1c` eine asynchrone Kopie. Bei PostgreSQL ist das
native Streaming Replication: Die Quelle schickt WAL-Daten über eine eigene
Verbindung, die Replica spielt sie ein.

Asynchron heißt hier: **Die Quelle wartet nicht.** Sie schreibt ihr WAL und macht
weiter, egal ob die Replica hinterherkommt. Der Rückstand ist in CloudWatch als
`ReplicaLag` sichtbar und liegt im Sekundenbereich.

Und genau dieser Verzicht auf Synchronität ist der Grund, warum eine Replica die
Quelle entlastet, ein Standby aber nicht. Der Standby hängt am Commit-Pfad. Die
Replica hängt daneben.

### 4 — Das Reporting bekommt einen eigenen Endpoint

Das Controlling trägt einen anderen DNS-Namen in die BI-Konfiguration ein. Ab
diesem Moment laufen die Full Scans auf einer anderen Instanz in einer anderen AZ,
und die Sachbearbeitung merkt von der Quartalsauswertung nichts mehr. Dass die
Berichte auf Daten von vor einigen Sekunden beruhen, ist für eine
Quartalsauswertung ohne Belang.

**Auf der Karte steht an diesem Pfeil „Reader-Endpoint" — das ist der falsche
Begriff.** Ein *reader endpoint* ist ein lastverteilender Sammelendpoint, den es
bei Aurora und beim RDS Multi-AZ **DB cluster** gibt. Eine gewöhnliche
DB-Instance-Read-Replica hat so etwas nicht; sie hat ihren eigenen
Instance-Endpoint, genau wie jede andere Instanz auch. Richtig wäre entweder
**„eigener Endpoint"** — so steht es auf derselben Karte zweimal in den Kästen —
oder **„Replica-Endpoint"**. Welche der beiden Formulierungen die Karte bekommt,
ist noch offen.

Der praktische Unterschied ist nicht kosmetisch: Ein Reader Endpoint verteilt
Verbindungen automatisch auf mehrere Leser. Bei Read Replicas gibt es keine
Verteilung. Wer drei Replicas hat, hat drei Namen, und die Verteilung dazwischen
ist Anwendungssache.

### 5 — Failover

Fällt AZ-a aus, promotet RDS den Standby automatisch. Typische Dauer laut AWS:
**60 bis 120 Sekunden**, wobei große Transaktionen oder ein langer Recovery-Lauf
das verlängern können.

Der Writer-Endpoint bleibt dabei **derselbe Name**. RDS ändert nur den
DNS-Eintrag, sodass er auf die neue Primary zeigt. Genau das ist der Grund, warum
niemand eine Konfiguration anfassen muss.

Und genau hier liegt die Falle, die im Betrieb am meisten Schaden anrichtet — sie
steht auf der Karte als eine einzige Zeile: **„Endpoint bleibt, Verbindung
nicht."** Bestehende TCP-Verbindungen brechen ab. AWS sagt das ausdrücklich: Weil
der Failover-Mechanismus den DNS-Eintrag umbiegt, müssen alle bestehenden
Verbindungen neu aufgebaut werden. Ein Connection Pool, der das nicht kann, macht
aus einem 90-Sekunden-Failover einen Ausfall bis zum nächsten Deployment.

### Der Kasten „Multi-AZ = Verfügbarkeit"

Drei Zeilen, die zusammen eine Definition ergeben: automatisches Failover, RPO 0,
Endpoint bleibt und Verbindung nicht. Die vierte Zeile ist die eigentliche
Aussage und steht bewusst als Negativsatz da — *skaliert keine einzige
Leseabfrage*.

Warum ein Negativsatz? Weil man Multi-AZ nicht durch das versteht, was es tut,
sondern durch das, was es demonstrativ nicht tut. Zwei Instanzen, doppelte
Rechnung, null zusätzlicher Durchsatz. Wer diesen Satz einmal richtig gelesen
hat, kreuzt Multi-AZ nie wieder bei einer Leselast-Frage an.

### Der Kasten „Replica = Lesekapazität"

Das Gegenstück, ebenfalls mit einem Negativsatz am Ende: *kein automatisches
Failover*. Darüber die beiden Eigenschaften, die eine Replica überhaupt nutzbar
machen — eigener Endpoint, nur SELECT — und die Einschränkung, die sie als
HA-Konzept disqualifiziert: Promotion nur manuell.

Die beiden Kästen sind absichtlich spiegelbildlich gebaut. Jeder nennt zwei
Fähigkeiten und eine Grenze, und die Grenze des einen ist die Fähigkeit des
anderen. Genau das ist die Karte in zwei Rechtecken.

### Der rote Kasten „Multi-AZ DB cluster"

Rot gestrichelt, weil er nicht Teil der Lösung ist, sondern eine Ausnahme von der
Regel darüber. Zwei lesbare Standbys über drei AZs, nur MySQL und PostgreSQL —
also ein Produkt, in dem ein Standby sehr wohl liest.

Er steht auf der Karte, weil sonst jemand die Merkzeile „ein Standby ist nie
lesbar" mitnimmt und in einer Prüfungsfrage über Multi-AZ DB cluster darüber
stolpert. Die ausführliche Abgrenzung steht weiter unten unter „Die ehrliche
Feinheit".

### Der Kasten „Controlling / BI"

Der Auslöser des ganzen Szenarios, und der einzige Kasten, der eine Zeitangabe
trägt: Quartalsberichte zwischen 8 und 10 Uhr, Full Scans über 400 Millionen
Zeilen. Die letzte Zeile — *Sekunden Lag sind ok* — ist die fachliche Freigabe
für die asynchrone Replikation.

Ohne diese Zeile wäre die Karte nicht lösbar. Verlangte das Controlling
tagesaktuelle Zahlen auf die Sekunde genau, fiele die Read Replica aus, und man
landete beim Multi-AZ DB cluster oder bei einem eigenen Analyseweg. Fachliche
Toleranz gegenüber Verzögerung ist die Voraussetzung, unter der Leseentlastung
überhaupt funktioniert.

## Die entscheidende Unterscheidung

|  | **Multi-AZ (DB instance)** | **Read Replica** |
|---|---|---|
| Wofür | Verfügbarkeit | Lesekapazität |
| Replikation | synchron | asynchron |
| Datenverlust im Ernstfall | keiner, RPO 0 | Sekunden möglich |
| Eigener Endpoint | nein | ja |
| Lesbar | nein | ja, nur SELECT |
| Übernahme | automatisch, 60–120 s | manuell, Promotion |
| Umkehrbar | ja, der alte Primary wird Standby | nein, Promotion ist endgültig |
| Anzahl | genau 1 Standby | bis 15 (PostgreSQL) |

Die Zeile, die Prüfungsfragen entscheidet, ist **„Übernahme"**. Eine Read Replica
kennt kein automatisches Failover. Die Promotion zur eigenständigen Instanz ist
ein Handgriff, den ein Mensch auslösen muss, und danach empfängt die Instanz keine
Änderungen mehr — sie ist eine normale Datenbank geworden. Für eine RTO-Zusage ist
das kein Ersatz für Multi-AZ.

## Die ehrliche Feinheit

**Die Ausnahme heißt Multi-AZ DB cluster, und sie hebt die Regel nicht auf.**
Seit 2022 gibt es neben dem Multi-AZ **DB instance**-Deployment ein Multi-AZ **DB
cluster**-Deployment: ein Writer plus **zwei lesbare Standbys** über drei AZs,
Failover typischerweise unter 35 Sekunden, verfügbar nur für **MySQL und
PostgreSQL**. Damit stimmt der Satz „ein Standby ist nie lesbar" nur noch für das
Instance-Deployment.

Die Prüfungsstrategie dafür ist mechanisch: Steht im Fragetext ausdrücklich
*Multi-AZ DB cluster*, gilt die Ausnahme. Steht dort nur *Multi-AZ*, ist das
Instance-Deployment gemeint. Und ein Multi-AZ DB cluster ist **kein
Aurora-Cluster** — gleiche Wortwahl, anderes Produkt, andere Speicherarchitektur.

**Die Replica-Zahl wird fast überall falsch zitiert.** Verbreitetes Kursmaterial
nennt 5 Read Replicas pro Quell-Instanz. Seit Oktober 2022 sind es 15 — aber
**nicht für jede Engine**. Die RDS-API-Referenz ist da eindeutig: 15 je
DB-Instanz, mit Ausnahme von Db2 (3), Oracle (5) und **SQL Server (5)**. Die
Ankündigung von 2022 nennt ausdrücklich nur MySQL, MariaDB und PostgreSQL. Wer
„15 Replicas" als allgemeine Zahl lernt, hat sie für zwei von sechs Engines
falsch. *(Diese Korrektur betrifft auch `battle_card_22.md`, Falle 4 — dort steht
SQL Server fälschlich in der 15er-Gruppe.)*

**Eine Replica kann selbst Multi-AZ sein.** Das wird regelmäßig übersehen, obwohl
es die AWS-CLI-Referenz explizit sagt: Man kann eine Read Replica als
Multi-AZ-DB-Instance anlegen, unabhängig davon, ob die Quelle Multi-AZ ist. Genau
das ist das Standardmuster für Cross-Region-DR — Replica in der zweiten Region,
dort Multi-AZ, im Ernstfall Promotion.

**Der rote Failover-Pfeil zeigt weniger, als er zeigen müsste.** Er mündet in die
Primary-Box, weil dort der Writer-Endpoint sitzt. Real findet eine Rollenrochade
statt: Der bisherige Standby *wird* die Primary, und RDS baut anschließend in einer
anderen AZ einen neuen Standby auf. Ein Diagramm kann diesen Tausch nicht zeigen,
ohne zwei Zustände nebeneinanderzustellen. Lies den Pfeil als „die Rolle wandert
hierher", nicht als „Daten fließen hierher".

## Syntax lesen — der Endpoint-Name

Beide Endpoints auf dieser Karte sind DNS-Namen nach demselben Muster:

```
nordlicht-schaden . cabcd1efghij . eu-central-1 . rds.amazonaws.com
       │                 │              │              │
       │                 │              │              └─ Service-Domain
       │                 │              └─ Region
       │                 └─ kontospezifisches Kürzel
       └─ DB-Instance-Identifier (der Name aus dem CLI-Aufruf)
```

Damit lässt sich die wichtigste Aussage der Karte am Namen ablesen. Nach einem
Failover ist dieser String **Zeichen für Zeichen identisch** — nur die IP-Adresse
dahinter ist eine andere. Die Replica dagegen heißt
`nordlicht-schaden-reporting.…`, weil sie eine eigene Instanz mit eigenem
Identifier ist.

Daraus folgt eine Betriebsregel, die AWS im selben Abschnitt gibt: Weil sich die
IP hinter einem gleichbleibenden Namen ändert, darf der Client den Namen nicht
unbegrenzt zwischenspeichern. Für die JVM empfiehlt AWS eine DNS-Cache-TTL von
höchstens 60 Sekunden. Steht sie auf „unendlich" — bei älteren JVM-Konfigurationen
der Default — findet die Anwendung nach dem Failover dauerhaft die tote Instanz.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur **nicht** existiert:

- kein zweiter Schreibpunkt — es bleibt bei genau einer schreibenden Instanz
- keine Lastverteilung zwischen mehreren Lesern
- kein automatisches Failover auf die Read Replica
- keine garantiert aktuellen Daten im Reporting
- keine Skalierung der Schreiblast, weder durch Standby noch durch Replica
- kein Schutz vor einem gelöschten Datensatz — Multi-AZ repliziert auch das
  `DELETE`, und zwar synchron

Der letzte Punkt ist der, der am teuersten missverstanden wird: Multi-AZ ist keine
Sicherung. Gegen fachliche Fehler hilft nur ein Wiederherstellungspunkt, also
Snapshot oder Point-in-time Recovery.

## Wenn du dir eine Sache merkst

**Multi-AZ beantwortet die Frage „was, wenn die AZ ausfällt". Read Replica
beantwortet die Frage „wer liest das alles". Wer beide Fragen im Text findet,
kreuzt beide Antworten an.**

Ein Snapshot ist ein Wiederherstellungspunkt und hat keine laufende Kopie. Eine
größere Instanz verschiebt die Reporting-Last nur, sie trennt sie nicht. Ein
Cache davor hilft bei denselben Abfragen, nicht bei Full Scans über 400 Millionen
Zeilen.

## Prüfungsknackpunkte

**Signalwörter für die Verfügbarkeitsachse:** „automatic failover", „no data
loss", „RPO of zero", „survive an Availability Zone outage", „synchronous". Das
alles zeigt auf Multi-AZ.

**Signalwörter für die Kapazitätsachse:** „reporting workload must not impact
production", „read-heavy", „scale reads", „analytics queries", „eventual
consistency is acceptable". Das alles zeigt auf Read Replicas.

**Die Standardfalle.** Im Fragetext stehen beide Achsen, und die Antwortoptionen
bieten jeweils nur eine an. Dann ist die richtige Antwort die Kombination — oder,
wenn keine Kombination angeboten wird, das Multi-AZ **DB cluster**, das beides in
einem Produkt liefert.

**Warum „nur Multi-AZ" hier verliert:** Der Standby beantwortet keine einzige
Abfrage. Die Reporting-Last bleibt exakt dort, wo sie vorher war.

**Warum „nur Read Replica" hier verliert:** Kein automatisches Failover. Die
Fachaufsicht verlangt eine dokumentierte Wiederanlaufzeit, und eine manuelle,
unumkehrbare Promotion ist keine.

**Warum „größere Instanzklasse" hier verliert:** Vertikale Skalierung verschiebt
die Grenze, sie trennt die Arbeitslasten nicht. Beim nächsten Quartalsende ist
dasselbe Problem zurück, nur teurer.

**Warum „Snapshot vor dem Reporting" hier verliert:** Ein Snapshot ist ein
Wiederherstellungspunkt, keine laufende Kopie. Ihn zu einer Instanz zu machen,
dauert und ist manuell.

**Warum „Migration auf Aurora" hier verliert:** Fachlich ginge es, aber die Frage
verlangt eine Lösung für eine bestehende RDS-for-PostgreSQL-Instanz. Eine
Migration ist ein Projekt, keine Konfigurationsänderung — und Aurora löst dasselbe
Problem mit denselben zwei Begriffen.
