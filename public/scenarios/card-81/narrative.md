---
cardNumber: 81
slug: multi-az-gegen-multi-region
title: "Multi-AZ vs Multi-Region"
services: ["Amazon RDS Multi-AZ", "Amazon Aurora Global Database", "Elastic Load Balancing", "EC2 Auto Scaling", "Amazon S3 Cross-Region Replication", "Amazon DynamoDB Global Tables"]
domains: ["D2"]
badgeCount: 0
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/multi-az-db-clusters-concepts-failover.html"
  - "https://aws.amazon.com/rds/features/multi-az"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.configuration.requirements.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database-disaster-recovery.html"
  - "https://aws.amazon.com/rds/aurora/global-database"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-global-table-design.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/replication-time-control.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html"
---

## Die Grundidee zuerst

Ein Versicherer betreibt seine Schadenmeldung in eu-central-1. Irgendwo brennt ein fremdes Rechenzentrum ab, und am Montag darauf sitzt der Vorstand im Raum und fragt: „Überstehen wir das?"

**Die alte Antwort:** „Wir haben einen zweiten Server." Der stand im selben Rack, im selben Raum, an derselben Stromschiene. Er schützte gegen ein defektes Netzteil — und gegen nichts anderes. Wenn der Raum voll Wasser lief, liefen beide Server voll Wasser.

**Die neue Antwort:** „Wir haben einen zweiten Standort." Eine Availability Zone ist kein Serverraum in einem Gebäude. Sie ist ein eigener Standort mit eigener Stromversorgung, eigener Kühlung und eigener Netzanbindung. Der Brand trifft eine AZ, nicht zwei.

Und jetzt kommt die Frage, um die es auf dieser Karte wirklich geht — und sie ist eine Ebene höher: **Was, wenn nicht das Gebäude ausfällt, sondern die Stadt?**

Das ist der Sprung von Hochverfügbarkeit zu Disaster Recovery. Zwei Bänder, zwei Ausfallgrößen, zwei völlig verschiedene Antworten. Wer sie zusammenwirft, hat für ein Problem bezahlt und rechnet mit dem Schutz gegen ein anderes.

## Was es eigentlich ist — ein Boolean gegen eine Topologie

Der Unterschied zwischen den beiden Bändern ist im Betrieb erstaunlich sichtbar. Das obere Band ist ein Schalter. Das untere Band ist ein zweites Bauwerk.

Oben, Hochverfügbarkeit innerhalb der Region:

```bash
aws rds create-db-instance \
  --db-instance-identifier schaden-prod \
  --engine postgres \
  --db-instance-class db.r6g.2xlarge \
  --multi-az                      # ← das ist alles
```

Ein Flag. AWS legt einen Standby in einer zweiten AZ an, repliziert dorthin, überwacht das Ganze und schaltet im Fehlerfall den DNS-Eintrag um. Du siehst den Standby nie, du kannst ihn nicht lesen, du bezahlst ihn.

Unten, Disaster Recovery über Regionen:

```bash
aws rds create-global-cluster \
  --global-cluster-identifier schaden-global \
  --source-db-cluster-identifier arn:aws:rds:eu-central-1:1234:cluster:schaden-prod

aws rds create-db-cluster \
  --region eu-west-1 \
  --db-cluster-identifier schaden-dr \
  --global-cluster-identifier schaden-global
```

Zwei Befehle, zwei Regionen, zwei eigenständige Cluster mit eigenen Endpunkten, eigenen Instanzen, eigener Rechnung. Kein Flag der Welt macht daraus ein Multi-Region-Setup.

**Merk dir das Verhältnis, nicht die Befehle:** Multi-AZ ist eine Eigenschaft einer Ressource. Multi-Region ist eine zweite Landschaft.

## Der Weg durch die Karte

### Band A — Innerhalb einer Region: Hochverfügbarkeit

Der graue gestrichelte Rahmen um das obere Band ist die Regionsgrenze. Alles, was darin steht, hilft gegen Ausfälle innerhalb dieser Grenze — und endet an ihr.

### AZ-Ausfall — was hier tatsächlich passiert

Der Reliability Pillar nennt in REL13-BP02 die Beispiele wörtlich: Eine DR-Strategie über mehrere Availability Zones innerhalb einer Region mildert Ereignisse wie **Feuer, Überflutungen und größere Stromausfälle**.

Das ist kein rhetorisches Beispiel, sondern die Definition des Schutzbereichs. Eine AZ ist ein Standort. Standorte brennen einzeln.

Die Konsequenz für den Bauplan: Wenn deine Anwendung in genau einer AZ läuft, ist sie gegen genau diese drei Ereignisse ungeschützt — egal wie viele Instanzen dort stehen.

### ELB + Auto Scaling — die Kapazität, nicht die Daten

Der Load Balancer verteilt auf Ziele in mehreren AZs und prüft ihre Gesundheit. Fällt eine AZ aus, fallen ihre Ziele aus der Verteilung heraus. Auto Scaling stellt die fehlende Kapazität in den verbleibenden AZs wieder her.

Das Bild dazu: drei Kassen in drei Filialen. Fällt eine Filiale aus, leiten die Schilder die Kunden zu den anderen zwei — und die stellen eine zusätzliche Kassiererin ein.

Wichtig ist, was hier **nicht** passiert: Der Load Balancer repliziert keine Daten. Er verteilt Anfragen. Wer die Datenebene vergisst, hat eine hochverfügbare Anwendung vor einer einzigen Datenbank in einer einzigen AZ.

### RDS Multi-AZ — die entscheidende Eigenschaft heißt „synchron"

Bei der klassischen Multi-AZ **DB Instance** hält AWS einen Standby in einer zweiten AZ und repliziert synchron dorthin. Synchron heißt: Eine Transaktion gilt erst als bestätigt, wenn beide Seiten sie haben.

Daraus folgt der ganze Rest. **Weil kein Commit ohne den Standby zustande kommt, kann beim Failover nichts verloren gehen.** Der Datenverlust ist null, nicht „sehr klein".

Die Zahlen aus der Doku, und sie unterscheiden sich um den Faktor drei:

- **Multi-AZ DB Instance:** Failover typischerweise **60–120 Sekunden**. Große Transaktionen oder ein längerer Recovery-Vorgang können das verlängern.
- **Multi-AZ DB Cluster** (ein Writer, zwei lesbare Standbys in drei AZs): typischerweise **unter 35 Sekunden**.

Der Mechanismus dahinter ist DNS. AWS ändert den DNS-Eintrag des Endpunkts auf den ehemaligen Standby. Deine bestehenden Verbindungen sterben und müssen neu aufgebaut werden — deshalb steht in der RDS-Doku die Warnung zur JVM-DNS-Cache-TTL. Eine Anwendung, die bei einem Verbindungsabbruch hängen bleibt statt neu zu verbinden, hat von Multi-AZ nichts.

### RPO 0 — und was diese Null nicht bedeutet

RPO 0 heißt: kein Datenverlust. Das Failover läuft ohne Eingriff, du wirst nicht gefragt.

RPO 0 heißt **nicht** RTO 0. Zwischen 35 und 120 Sekunden nimmt die Datenbank keine Schreibvorgänge an. Für eine Schadenmeldung ist das unkritisch, für ein Handelssystem ist es ein Vorfall.

Und es heißt erst recht nicht „Backup". Dazu unten mehr — das ist der teuerste Denkfehler in diesem Themenfeld.

### Band B — Über Regionen hinweg: Disaster Recovery

Der zweite gestrichelte Rahmen. Hier ändert sich nicht die Menge der Redundanz, sondern ihre Art.

### Regions-Ausfall — warum kein Multi-AZ-Mechanismus hilft

Die gesamte Region ist nicht erreichbar. Kein Load Balancer hilft, weil alle Zielgruppen in dieser Region liegen. Kein Auto Scaling hilft, weil es in dieser Region skaliert. Kein Multi-AZ-Standby hilft, weil alle AZs zur ausgefallenen Region gehören.

Das Bild: Der zweite Standort auf der anderen Straßenseite nützt nichts, wenn das Hochwasser die ganze Stadt trifft.

### Aurora Global Database — Replikation auf Speicherebene

Aurora Global Database repliziert auf der Speicherebene in eine zweite Region, mit typischer Latenz unter einer Sekunde, über eigene Infrastruktur, die die Datenbank nicht ausbremst — die Instanzen in beiden Regionen bleiben vollständig für den Anwendungsverkehr verfügbar.

Der Aurora User Guide legt die Topologie fest: mindestens zwei Regionen, ein Primärcluster mit genau einer Writer-Instanz, **bis zu 10 sekundäre Regionen**, jede davon rein lesend. Und ein Detail, das man selten mitliest: Jede zusätzliche Sekundärregion kostet dich einen Reader-Platz im Primärcluster. Bei 10 Sekundärregionen bleiben dort statt 15 nur noch 5 Aurora Replicas.

### S3 · DynamoDB — was jenseits der relationalen Datenbank passiert

Die Box fasst zwei Dienste zusammen, weil sie dieselbe Rolle spielen: regionsübergreifende Datenreplikation für alles, was nicht in der SQL-Datenbank liegt.

**S3 Cross-Region Replication** kopiert Objekte in einen Bucket in einer zweiten Region — im Normalfall ohne jede Zeitzusage. Wer eine Zusage braucht, schaltet **S3 Replication Time Control** dazu: Laut S3 User Guide repliziert S3 RTC die meisten Objekte in Sekunden und 99,9 Prozent davon innerhalb von 15 Minuten, mit CloudWatch-Metriken zum Nachweis.

**DynamoDB Global Tables** replizieren die Tabelle in weitere Regionen, jede Replik nimmt Lese- und Schreibvorgänge an. Im Standardmodus — multi-Region eventual consistency — liegt der RPO laut Doku bei der Replikationsverzögerung zwischen den Repliken, üblicherweise wenige Sekunden.

### RPO 1 s · RTO 1 min — und der Satz, der darunter steht

Die Zahlen stammen aus dem AWS-Whitepaper zur globalen Resilienz und werden von der Aurora-Produktseite gestützt: Replikationslatenz typisch unter einer Sekunde, Promotion einer Sekundärregion in unter einer Minute.

**Diese Minute ist keine Wartezeit, sondern eine Handlung.** Die Promotion passiert nicht von selbst. Jemand oder etwas muss sie auslösen. Der Aurora User Guide beschreibt genau deshalb zwei getrennte Verfahren — Switchover für den geplanten Fall, Managed Failover für den Notfall — und beide startest du.

Auf der Karte ist das der Halbsatz „ist ein Schritt, der ausgelöst werden muss". Es ist der wichtigste Halbsatz im unteren Band.

### ✗ Verworfen — der Trugschluss

„Wir sind Multi-AZ, also überstehen wir auch den Ausfall einer Region."

Multi-AZ endet an der Regionsgrenze. Der Reliability Pillar formuliert die Konsequenz unmissverständlich: Wenn Schutz gegen ein Ereignis verlangt wird, das den Betrieb in einer ganzen AWS-Region unmöglich macht, brauchst du eine Multi-Region-Strategie — Pilot Light, Warm Standby oder Multi-Site Active/Active.

## Die entscheidende Unterscheidung

| | Multi-AZ | Multi-Region |
|---|---|---|
| Schützt gegen | Feuer, Flut, Stromausfall an **einem** Standort | Ausfall einer **ganzen** Region |
| Heißt bei AWS | Hochverfügbarkeit (HA) | Disaster Recovery (DR) |
| Replikation | synchron (DB Instance) | asynchron |
| RPO | 0 | Sekunden |
| RTO | 35–120 s | Minuten |
| Failover | automatisch | wird ausgelöst |
| Kostet | ein Standby | eine zweite Landschaft |

Die Zeile, an der Prüfungsfragen hängen, ist die vierte. **RPO 0 gibt es innerhalb der Region. Über Regionen hinweg kostet die Entfernung Zeit, und Zeit ist Datenverlust.**

## Die ehrliche Feinheit

**Erstens: „synchron" gilt nicht für beide Bauformen.** Die Karte schreibt „synchrone Replikation" an die RDS-Multi-AZ-Box, und für die DB Instance stimmt das. Der Multi-AZ **DB Cluster** ist laut RDS User Guide ausdrücklich **semisynchron**: Ein Commit braucht die Bestätigung von *mindestens einer* der beiden Reader-Instanzen, nicht von beiden. AWS bewirbt trotzdem für beide Bauformen „zero data loss", weil die Transaktion damit auf mindestens zwei Maschinen liegt. Beide Aussagen sind korrekt; sie beschreiben nur verschiedene Schichten. Wenn eine Frage nach dem Replikationsverfahren fragt und nicht nach dem Ergebnis, ist „semisynchronous" für den Cluster die richtige Vokabel.

**Zweitens: „RPO 0 über Regionen ist unmöglich" stimmt nicht mehr uneingeschränkt.** DynamoDB Global Tables kennen seit Juni 2025 einen zweiten Konsistenzmodus: **multi-Region strong consistency (MRSC)**, und der unterstützt laut DynamoDB Developer Guide einen **RPO von null**. Der Preis dafür steht in derselben Quelle: höhere Schreiblatenzen, höhere Latenzen für strongly consistent reads — und die Architektur verlangt **genau drei Regionen**, entweder als drei Repliken oder als zwei Repliken plus einen Witness. Der Modus lässt sich nach der Erstellung nicht mehr ändern.

Der Merksatz auf der Karte bleibt damit haltbar, aber aus einem präziseren Grund als gedacht: RPO 0 über *zwei* Regionen gibt es nicht. Über drei gibt es ihn, für genau einen Dienst, mit Aufschlag.

**Drittens: die RPO/RTO-Zahlen sind Größenordnungen, keine Zusagen.** Das Whitepaper nennt effektiv RPO 1 Sekunde und RTO 1 Minute. Der Aurora User Guide — die Quelle mit dem höheren Rang — bleibt bewusst vager: RTO „in der Größenordnung von Minuten", RPO „typischerweise in Sekunden gemessen". Das ist kein Widerspruch, sondern eine unterschiedliche Zusicherungstiefe. Für die Prüfung reicht die Größenordnung; für einen Vertrag reicht sie nicht.

**Viertens, und das ist der teuerste Punkt: Replikation ist kein Backup.** Jede Replikation in diesem Bild kopiert zuverlässig auch das Falsche. Ein `DELETE FROM schadenfaelle` ohne `WHERE` ist in der Sekundärregion genauso gültig wie in der Primärregion. Der Reliability Pillar verlangt deshalb für **jede** DR-Strategie Backups innerhalb der Region und deren Kopie in die Recovery-Region — auch für Active/Active. Wogegen diese Karte schützt, ist Infrastrukturausfall. Gegen Datenverfälschung schützt Point-in-Time Recovery, und das ist Karte 82.

## Syntax lesen — RTO und RPO auf einer Zeitachse

RTO und RPO sind keine Konfigurationswerte, sondern zwei Abstände zu einem Zeitpunkt. Fast alle Verwechslungen entstehen daran, dass beide „Zeit in Minuten" sind und in verschiedene Richtungen zeigen:

```
  Daten                        AUSFALL                     Betrieb
  gesichert                     08:14                      wieder da
      │                           │                            │
──────┼───────────────────────────┼────────────────────────────┼──────►
      │◄─────── RPO ─────────────►│◄────────── RTO ───────────►│
      │                           │                            │
   letzter                    hier bricht                  hier nimmt
   konsistenter               es ab                        das System
   Stand                                                   wieder an

  RPO blickt ZURÜCK  →  „wie viel Arbeit ist weg?"      → Datenverlust
  RTO blickt VORWÄRTS →  „wie lange stehen wir still?"  → Ausfallzeit
```

So gelesen wird das obere Band der Karte zu einer Aussage: RPO-Strecke = 0, RTO-Strecke = 35 bis 120 Sekunden. Das untere Band: RPO-Strecke ≈ 1 Sekunde, RTO-Strecke ≈ 1 Minute — plus der Zeit, die jemand braucht, um die Promotion überhaupt auszulösen.

Genau diese letzte Ergänzung fehlt in fast jeder Rechnung. Der gemessene RTO beginnt nicht, wenn du auf den Knopf drückst, sondern wenn der Ausfall eintritt.

## Was du dadurch nicht baust

- **Kein Lastverteilungssystem über Regionen.** Auf der Karte kommt der Verkehr nie in der zweiten Region an. Wie er dorthin findet — Route 53, Global Accelerator — steht auf Karte 84.
- **Keine automatische Regions-Umschaltung.** Die Promotion ist ein ausgelöster Schritt.
- **Keinen Failback.** Der Weg zurück in die Primärregion ist nicht dargestellt und in der Praxis der aufwendigere Teil.
- **Kein Backup und keine Wiederherstellung eines alten Standes.**
- **Keine Netzwerktopologie.** Subnetze, Routen und Endpunkte fehlen bewusst — die Karte beantwortet eine Zuordnungsfrage, sie zeichnet keine Architektur.
- **Keine Kostenaussage.** Eine zweite Region ist keine Prozentsatz-Aufschlag, sondern eine zweite Rechnung.

## Wenn du dir eine Sache merkst

**Multi-AZ ist Hochverfügbarkeit innerhalb einer Region mit RPO 0 — gegen den Ausfall einer ganzen Region hilft ausschließlich eine zweite Region.**

Warum die üblichen Gegenpositionen fallen: „Mehr AZs hinzufügen" skaliert die falsche Achse — drei AZs schützen gegen dasselbe Ereignis wie zwei. „Cross-Region Read Replica reicht" übersieht, dass eine Read Replica nicht von allein zum Primary wird und die Replikationsbeziehung nach der Promotion aufgelöst ist. „Backups liegen ohnehin in S3" verwechselt Wiederherstellbarkeit mit Verfügbarkeit: Ein Restore ist Stunden, kein Failover.

## Prüfungsknackpunkte

**Signalwörter:** „survive the loss of an entire Region" und „protect against an Availability Zone failure" stehen fast nie im selben Text — das eine Wort entscheidet, welches Band gemeint ist. „Zero data loss" oder „RPO of zero" zeigt nach oben ins HA-Band. „Promote a secondary Region" zeigt nach unten.

**Multi-AZ DB Instance gegen Multi-AZ DB Cluster.** 60–120 Sekunden gegenüber unter 35 Sekunden. Nennt eine Frage eine Failover-Zeit, unterscheidet sie genau hier. Der Cluster hat außerdem zwei **lesbare** Standbys — der Standby der DB Instance ist nicht lesbar.

**Synchron und asynchron verwechseln.** Innerhalb der Region synchron, RPO 0. Über Regionen asynchron, RPO größer null. Die einzige belegte Ausnahme ist DynamoDB MRSC über drei Regionen.

**„Multi-AZ ist Disaster Recovery."** Multi-AZ ist Hochverfügbarkeit. DR beginnt dort, wo der Ausfall größer ist als das, wogegen die In-Region-Redundanz ausgelegt wurde.

**Replikation mit Backup verwechseln.** Replikation kopiert Löschungen und Datenkorruption mit. Ohne Point-in-Time Recovery ist ein repliziertes System gegen Datenverfälschung wehrlos.

**Warum Route 53 hier verliert:** DNS-Failover leitet Verkehr um, repliziert aber keine Daten. Ohne zweite Datenbank in der zweiten Region zeigt es auf nichts.

**Warum ein Snapshot in eine zweite Region hier verliert:** Ein kopierter Snapshot ist Backup and Restore mit RTO in Stunden — das erfüllt „RPO 1 Sekunde" nicht einmal ansatzweise.

**Warum „mehr Instanzen im Auto Scaling" hier verliert:** Kapazität ist nicht Redundanz. Zehn Instanzen in einer AZ fallen gemeinsam aus.
