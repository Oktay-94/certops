---
service: Amazon RDS
seedKey: saa-c03-script-rds
batch: B2
domains: [D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/rds/features/multi-az/
  - https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_Storage.html
  - https://aws.amazon.com/blogs/aws/introducing-database-savings-plans-for-aws-databases/
status: draft
---

# Amazon RDS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> RDS = die **relationale Datenbank mit Chauffeur**: AWS übernimmt OS-Patching, Backups und Betrieb für MySQL, PostgreSQL, MariaDB, Oracle und SQL Server. **Multi-AZ** = synchroner Standby für den Notfall (Verfügbarkeit), **Read Replicas** = asynchrone Lese-Kopien (Skalierung). Lebt in privaten Subnetzen hinter Security Groups.

Der SAA fragt nicht mehr „was ist Multi-AZ", sondern: **Instance oder Cluster? Wie verschlüsselt man nachträglich? Und wie upgraded man eine Major-Version, ohne dass der Vorstand die Downtime bemerkt?**

---

## 🎯 SAA-Vertiefung

### Multi-AZ Instance vs. Multi-AZ Cluster: Der unsichtbare und die nützlichen Zwillinge

**Das Problem:** „Wir zahlen für einen kompletten Standby-Server, aber er tut den ganzen Tag *nichts* — kann der nicht wenigstens Leseanfragen bedienen?" Und gleich hinterher: „Beim letzten Failover waren wir zwei Minuten offline — geht das schneller?"

**Die Lösung:** Ja — aber nicht mit dem klassischen Multi-AZ. RDS hat zwei Multi-AZ-Bauformen, und ihre Unterscheidung ist DIE RDS-Vertiefungsfrage:

| | Multi-AZ **DB Instance** (klassisch) | Multi-AZ **DB Cluster** |
|---|---|---|
| Aufbau | 1 Primary + 1 **unsichtbarer** Standby | 1 Writer + **2 lesbare Standbys** über 3 AZs |
| Standby bedient Reads? | **Nein** — er wartet nur | **Ja** — eigener Reader Endpoint |
| Failover | 🔴 typisch 60–120 s (Cold Standby + Crash Recovery) | 🔴 „typically under 35 seconds" |
| Engines | alle | nur MySQL & PostgreSQL |

Der klassische Standby ist ein **Feuerwehrmann in Bereitschaft**: Er sitzt voll ausgerüstet in der Wache, aber er löscht erst, wenn es brennt — Leseanfragen bedient er *nie*. Der Multi-AZ Cluster stellt stattdessen **zwei aktive Zwillinge** hin, die nebenbei Lese-Traffic abarbeiten und im Ernstfall schneller übernehmen (semi-synchrone Replikation: ein Standby muss bestätigen).

Zwei Fallen dazu: Beim Failover bleibt der **Endpoint gleich** (DNS zeigt auf die neue Instanz) — eine App mit ewig gecachtem DNS merkt das nicht, daher niedrige DNS-TTL. Und: 🔴 Failover-Zeiten immer als „**typisch**" lehren — AWS garantiert keine Sekundenwerte.

> **💡 Merksatz:** Klassisches Multi-AZ = unsichtbarer Feuerwehrmann (keine Reads!). Sollen die Standbys **lesen** und **schneller** übernehmen → **Multi-AZ DB Cluster**. Verfügbarkeit ≠ Skalierung — dafür gibt's Read Replicas.

### Read Replicas: Die Kopisten — und ihr zweiter Job als Not-Ausgang

**Das Problem:** Das Reporting-Team feuert schwere Abfragen auf die Produktions-DB, und die Kasse im Shop wird langsam.

**Die Lösung:** **Read Replicas** — asynchrone Kopien, die den Lese-Traffic übernehmen: same-AZ, cross-AZ oder sogar **cross-region**. Das Reporting bekommt seine eigene Replica, die Kasse hat ihre Ruhe.

Ihr zweiter Job ist subtiler: Eine Cross-Region-Replica ist ein **preiswerter DR-Baustein** — im Katastrophenfall wird sie zur eigenständigen DB **promoted**. Aber: Promotion ist *manuell*, die Replikation *asynchron* (RPO > 0) — für ambitionierte RTO/RPO-Ziele ist Aurora Global Database die bessere Antwort (eigenes Skript).

🔴 Zur Anzahl: Die klassische Prüfungsantwort lautet **„RDS = 5, Aurora = 15"** — neuere RDS-Engine-Versionen erlauben inzwischen auch 15, aber die 5-vs-15-Gegenüberstellung ist der erwartete Prüfungsreflex. Beide Welten kennen.

> **💡 Merksatz:** Replica = Skalierung (async, lesbar), Multi-AZ = Verfügbarkeit (sync, automatisch). Kombinierbar — und die Cross-Region-Replica ist der Budget-Not-Ausgang mit manueller Promotion.

### Der Snapshot-Copy-Trick: Verschlüsselung zum Nachrüsten

**Das Problem:** Ein Audit stellt fest: Die drei Jahre alte Produktions-DB ist **unverschlüsselt**. Der Auditor will Encryption at rest — aber das Encryption-Häkchen ist bei einer laufenden Instanz ausgegraut.

**Die Lösung:** RDS-Verschlüsselung ist eine **Geburtsentscheidung** — sie lässt sich nur beim Erstellen aktivieren. Der offizielle Umweg ist der **Snapshot-Copy-Trick**: Snapshot der DB → **Copy mit aktivierter Verschlüsselung** → aus der verschlüsselten Kopie eine neue Instanz restoren → Anwendung umschwenken. (Merk dir das Muster einmal — es ist bei EBS exakt dasselbe.)

Gleich daneben wohnen die Backup-Basics mit SAA-Präzision: **Automatische Backups** mit Retention **0–35 Tagen** ermöglichen **Point-in-Time Recovery**; **manuelle Snapshots** leben unbegrenzt (auch nach Löschung der Instanz — die Antwort auf „DB stilllegen, aber Endzustand aufheben"). Cross-Region-Snapshot-Copy ist der einfachste DR-Baustein.

> **💡 Merksatz:** Verschlüsselung nachträglich = **Snapshot → Encrypted Copy → Restore**. PITR braucht automatische Backups (max. 35 Tage); manuelle Snapshots sind für die Ewigkeit.

### Blue/Green: Das Major-Upgrade ohne Schweißausbruch

**Das Problem:** PostgreSQL-Major-Upgrade auf der Produktions-DB. In-Place-Upgrade heißt: Downtime unbekannter Länge, und wenn etwas schiefgeht, gibt es kein einfaches Zurück.

**Die Lösung:** **Blue/Green Deployments**: RDS erstellt eine vollständige, **laufend synchronisierte** Kopie der Produktionsumgebung (Green), auf der du das Upgrade durchführst und testest — die Produktion (Blue) läuft ungestört weiter. Der Switchover tauscht dann die Umgebungen in **unter einer Minute**, und Blue bleibt als Rollback-Option stehen.

Zwei Spezialisten am Rand: **RDS Custom** (Oracle/SQL Server) gibt OS-/DB-Zugriff für Legacy-Software, die Standard-RDS verbietet — Signalwort „benötigt Zugriff aufs Betriebssystem, will aber managed bleiben". Und **Performance Insights** ist das eingebaute DB-Last-Dashboard („welche Query frisst die DB auf?").

> **💡 Merksatz:** Major-Upgrade / riskante Schemaänderung mit Minimal-Downtime und Rollback → **Blue/Green Deployment** (Switchover < 1 min).

### Storage & Kosten: gp3 als Default, Savings Plans als Neuzugang

Auf der Storage-Seite gilt dasselbe wie bei EBS: **gp3 ist der Default**, io2 für konsistent niedrige Latenz kritischer DBs, und **Storage Autoscaling** lässt den Speicher automatisch mitwachsen (nicht bei magnetic, nicht bei Multi-AZ DB Clusters). 🛑 **Magnetic ist Geschichte**: Bestände wurden zu gp3 migriert, ab 01.07.2026 kein Snapshot-Restore auf magnetic mehr — magnetic ist in jeder neuen Frage ein Distraktor.

Bei den Kosten (D4) zwei Instrumente:
- **Reserved Instances:** bis 72 % (3 Jahre, All Upfront) für planbare Dauerlast — der Klassiker.
- 🛑 **Database Savings Plans** (seit 12/2025): flexibles $/h-Commitment über **Aurora, RDS, DynamoDB, ElastiCache (nur Valkey), DocumentDB, Neptune, Keyspaces** u. a. — bis 35 % (Serverless), bis 20 % (Provisioned), nur Gen-7+-Instances. Wichtigste Prüfungsfußnote: **Redshift ist NICHT dabei** (dort weiter Reserved Nodes).

Und für „Dev-DB läuft nur werktags": RDS **Stop/Start** spart Compute — aber maximal **7 Tage**, dann startet AWS die Instanz automatisch. Die elegantere Antwort für solche Muster ist Aurora Serverless mit Scale-to-Zero (→ Aurora-Skript).

> **💡 Merksatz:** gp3 ist der Storage-Default, magnetic ist tot. Dauerlast → RI/Database Savings Plans (Merke: **Redshift ausgenommen**); Teilzeit-DB → Stop/Start (7-Tage-Limit) oder gleich Aurora Serverless.

---

## ⚠️ Prüfungs-Knackpunkte

- AZ-Ausfall überleben → **Multi-AZ**; lesbare Standbys + schnelleres Failover → **Multi-AZ DB Cluster** (nur MySQL/PostgreSQL).
- Klassischer Multi-AZ-Standby bedient **keinen** Traffic; Failover per DNS-Swap → niedrige DNS-TTL.
- 🔴 Failover-Zeiten: „typisch" 60–120 s (Instance) vs. „typically under 35 s" (Cluster) — nie als Garantie.
- Lese-Skalierung/Reporting-Offload → **Read Replica** (5 klassisch vs. 15 Aurora); Cross-Region-Replica = DR mit manueller Promotion.
- Nachträgliche Verschlüsselung → **Snapshot → Encrypted Copy → Restore**.
- PITR ≤ 35 Tage (automatische Backups); manuelle Snapshots unbegrenzt.
- Major-Upgrade mit Minimal-Downtime + Rollback → **Blue/Green Deployment**.
- OS-Zugriff nötig, trotzdem managed → **RDS Custom**; Query-Last analysieren → **Performance Insights**.
- 🛑 magnetic deprecated (Distraktor); Storage Autoscaling nicht mit magnetic/Multi-AZ Cluster.
- 🛑 **Database Savings Plans** (12/2025): viele DB-Dienste, bis 35 % — **ohne Redshift**.

## 💡 Der eine Satz zum Mitnehmen

**RDS-Fragen sortieren sich fast immer in eines von drei Mustern: Verfügbarkeit (Multi-AZ — Instance oder Cluster?), Skalierung (Read Replicas) oder Betriebstrick (Snapshot-Copy, Blue/Green, Stop/Start)** — wer zuerst das Muster erkennt, eliminiert die Hälfte der Antwortoptionen.
