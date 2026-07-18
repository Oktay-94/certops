---
nr: 22
title: "RDS Multi-AZ · Read Replicas — Verfügbarkeit und Lesekapazität auseinanderhalten"
services:
  - Amazon RDS (PostgreSQL)
  - RDS Multi-AZ deployment
  - RDS Read Replica
signalwords:
  - reporting workload must not impact production
  - automatic failover
  - no data loss / RPO 0
  - read scaling
  - synchronous vs asynchronous replication
domain: D2
domain_secondary: D3
assets:
  png: battle_card_22.png
  pdf: battle_card_22.pdf
  svg: battle_card_22.svg
status_note: >
  KORRIGIERTE FASSUNG. Die erste Auslieferung enthielt eine Textkollision:
  Der Failover-Pfeil lief senkrecht bei x=965 durch das Zonen-Label
  "AZ eu-central-1b". Das damalige QC-Skript hat Texte in gestrichelten Zonen
  weder bei (a) noch bei (b) geprüft und meldete faelschlich 0 Befunde.
  Skript repariert (Zonen-Texte gelten jetzt als freie Labels), Pfeil auf
  x=1075 / x=470 verlegt, danach erneut geprueft.
  QC-Skript: 0 Befunde. Render-Sanity bestanden (alle Palettenfarben im PNG
  nachweisbar, drei definierte Freizonen rein weiß). SICHTPRÜFUNG DURCH
  CHAT-CLAUDE NICHT MÖGLICH — view lieferte auf das PNG kein auswertbares
  Bild (Regel F9). Sichtprüfung liegt bei Oktay.
---

# Battle Card 22 — RDS Multi-AZ · Read Replicas

## Szenario

Die *Nordlicht Versicherung* in Hamburg betreibt ihre Schadenbearbeitung auf einer
einzelnen **RDS for PostgreSQL**-Instanz (`db.r6g.2xlarge`, Single-AZ) mit 400 Mio.
Schadensfällen. Zwei Probleme treffen zusammen:

1. Werktags zwischen 8 und 10 Uhr fährt das Controlling Quartalsauswertungen mit
   Full-Table-Scans gegen **dieselbe Instanz**. Die 1.400 Sachbearbeiter sehen in
   diesem Fenster Timeouts.
2. Die Fachaufsicht verlangt eine dokumentierte Wiederanlaufzeit: Der Ausfall einer
   Availability Zone darf höchstens Minuten kosten — und **keinen Datensatz**.

Die verführerische Frage lautet „Multi-AZ **oder** Read Replica?". Die richtige Antwort
lautet **beides**, weil es zwei verschiedene Probleme sind.

## Ablauf

**1 — Die Anwendung spricht den Writer-Endpoint an.** Sachbearbeitung liest *und*
schreibt über einen DNS-Namen, der immer auf die aktuelle Primary-Instanz zeigt. Dieser
Endpoint ist der einzige Schreibpunkt des gesamten Systems — daran ändert auch Multi-AZ
nichts.

**2 — Multi-AZ repliziert synchron in eine zweite AZ.** RDS hält in AZ-b eine
**synchrone** Kopie. Synchron heißt: Ein Commit gilt erst als bestätigt, wenn er auch
im Standby liegt — daher **RPO 0**, kein Datenverlust. Der Preis ist etwas höhere
Schreiblatenz. Der Standby ist im Diagramm **gestrichelt gezeichnet, weil er passiv
ist**: Er beantwortet keine einzige Abfrage und hat keinen eigenen Endpoint.

**3 — Die Read Replica repliziert asynchron.** Parallel läuft in AZ-c eine
**asynchrone** Kopie. Asynchron heißt: Der Primary wartet nicht auf sie, dafür hinkt sie
um Sekunden hinterher (`ReplicaLag` in CloudWatch). Genau dieser Verzicht auf
Synchronität ist der Grund, warum eine Replica die Schreiblast des Primary nicht
belastet.

**4 — Das Reporting fragt den Replica-Endpoint ab.** Das Controlling bekommt einen
**eigenen Endpoint** in die BI-Konfiguration. Ab jetzt laufen die Full Scans auf einer
anderen Instanz, in einer anderen AZ — die Sachbearbeitung merkt nichts davon. Dass die
Berichte auf Daten von vor ein paar Sekunden basieren, ist für Quartalsauswertungen
irrelevant.

**5 — Failover (rot).** Fällt AZ-a aus, promotet RDS **automatisch** den Standby. Der
**Writer-Endpoint bleibt derselbe** — der DNS-Eintrag zeigt danach auf die neue
Primary-Instanz. Typische Dauer: **60–120 Sekunden**. Wichtiges Detail für die Praxis:
Der Endpoint bleibt, die **bestehenden Verbindungen brechen trotzdem ab**. Der
Connection Pool der Anwendung muss neu verbinden können, sonst nützt das schnellste
Failover nichts.

## Prüfungs-Kernsatz

> **Multi-AZ ist Verfügbarkeit (synchron, automatisch, unlesbar). Read Replica ist
> Lesekapazität (asynchron, eigener Endpoint, Promotion nur von Hand). Wer beides
> braucht, baut beides.**

## Klassiker-Fallen

**1. „Multi-AZ entlastet die Datenbank" — nein.** Die AWS-Doku sagt es als Note
wörtlich: Die Hochverfügbarkeitsoption ist **keine Skalierungslösung für Lesezugriffe**,
der Standby kann keinen Leseverkehr bedienen. Wer im Fragetext „reporting must not
impact production" liest und Multi-AZ ankreuzt, hat die falsche Achse gewählt.

**2. „Read Replica ist mein Hochverfügbarkeitskonzept" — auch nein.** Eine Replica
kennt **kein automatisches Failover**. Die Promotion zur eigenständigen Instanz ist ein
**manueller** Schritt und **nicht umkehrbar**; danach empfängt die Instanz keine
Änderungen mehr. Für RPO/RTO-Anforderungen ist das kein Ersatz für Multi-AZ.

**3. Die große Ausnahme: Multi-AZ DB *cluster*.** Seit 2022 gibt es neben dem
Multi-AZ **DB instance**-Deployment das Multi-AZ **DB cluster**-Deployment (**nur MySQL
und PostgreSQL**): ein Writer plus **zwei lesbare Standbys** in drei AZs,
semi-synchrone Replikation über die native Engine-Replikation, Failover **typisch unter
35 Sekunden**. Damit ist der Satz „ein Standby ist nie lesbar" nur noch für das
Instance-Deployment richtig. Prüfungsstrategie: Steht im Fragetext ausdrücklich
„Multi-AZ DB cluster", gilt die Ausnahme; steht dort nur „Multi-AZ", ist das
Instance-Deployment gemeint. **Ein Multi-AZ DB cluster ist außerdem kein Aurora-Cluster**
— gleiche Wortwahl, anderes Produkt.

**4. Veraltete Zahl.** Verbreitetes Kursmaterial nennt **5** Read Replicas pro
Quell-Instanz. Seit Oktober 2022 sind es **15** (MySQL, MariaDB, PostgreSQL, SQL Server),
davon bis zu **5 cross-Region**; Oracle bleibt bei 5. Cascading Replicas gibt es bei
MySQL/MariaDB und ab PostgreSQL 14.1 (bis zu drei Ebenen).

**5. Die Kombination wird übersehen.** Eine Read Replica **kann selbst Multi-AZ sein** —
unabhängig davon, ob die Quelle Multi-AZ ist. Das ist das Standardmuster für
Cross-Region-DR: Replica in der zweiten Region, dort Multi-AZ, im Ernstfall Promotion.

## Abgrenzung zu Karte 19 (EBS Snapshots)

Karte 19 hat bereits gesetzt: **Snapshot ≠ Multi-AZ.** Diese Karte wiederholt das
nicht, sondern zieht die nächste Trennlinie: **Multi-AZ ≠ Read Replica.** Zusammen
ergibt sich die vollständige Kette, die in Prüfungsfragen gern vermischt wird:
*Snapshot = Wiederherstellungspunkt · Multi-AZ = Verfügbarkeit · Read Replica =
Lesekapazität.* Drei Werkzeuge, drei Probleme, kein Ersatz füreinander.

## Bewusste Vereinfachungen im Diagramm

- **Die Zeitachse ist zusammengezogen.** Die Schritte 1–4 sind Dauerzustand,
  Schritt 5 ist ein Ereignis. Ein Diagramm kann beides nur nebeneinander zeigen.
- **Beim Failover ist die Rollenrochade nicht ausgemalt.** Real wird der bisherige
  Standby zum Primary, und RDS baut anschließend in einer anderen AZ einen neuen
  Standby auf. Der rote Pfeil zeigt nur die Übernahme.
- **Der Abbruch bestehender Verbindungen ist nicht gezeichnet**, sondern nur in der
  Box „Multi-AZ = Verfügbarkeit" als Zeile benannt („Endpoint bleibt, Verbindung
  nicht"). Er ist in der Praxis die häufigste Ursache dafür, dass ein technisch
  erfolgreiches Failover trotzdem als Ausfall wahrgenommen wird.
- **Nur eine Read Replica ist gezeichnet.** Möglich sind bis zu 15; für die Aussage der
  Karte ändert die Anzahl nichts.
- **Backups, Snapshots und Maintenance Windows fehlen** — sie gehören auf Karte 19
  bzw. in den Backup-Strang (Masterplan Nr. 82).
- **Farbzuordnung:** Navy = RDS-Instanzen (Primary und Standby), gestrichelt = passiv.
  Grün = Entlastungsziel (Read Replica), Blau = Anwender/BI.

## Faktencheck

Geprüft am 18.07.2026 gegen die aktuelle AWS-Doku: `Concepts.MultiAZ` (Abgrenzung
DB instance vs. DB cluster), `Concepts.MultiAZSingleStandby` (synchroner Standby, Note
„isn't a scaling solution for read-only scenarios"), `USER_ReadRepl` (Promotion,
kein Autoscaling der Replicas), `USER_MySQL.Replication.ReadReplicas` und
`USER_PostgreSQL.Replication.ReadReplicas` (15 Replicas, Cascading, Lag-Verhalten),
AWS-Ankündigung vom 20.10.2022 (5 → 15 Replicas) sowie die AWS-Database-Blog-Beiträge
zu Multi-AZ mit zwei lesbaren Standbys.

*Quellenspanne bei der Failover-Zeit des DB cluster:* AWS und mehrere Sekundärquellen
nennen **typisch unter 35 s**, eine verbreitete Prüfungsquelle nennt **bis 75 s je nach
Replica-Lag**. Im Diagramm steht deshalb nur die belastbare Zahl für das
Instance-Deployment (60–120 s); für den Cluster steht die Größenordnung in der Falle 3.
