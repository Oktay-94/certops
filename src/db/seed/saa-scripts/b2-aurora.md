---
service: Amazon Aurora & Aurora Serverless
seedKey: saa-c03-script-aurora
batch: B2
domains: [D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/rds/aurora/global-database/
  - https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2-auto-pause.html
  - https://aws.amazon.com/blogs/aws/new-amazon-aurora-i-o-optimized-cluster-configuration-with-up-to-40-cost-savings-for-i-o-intensive-applications/
status: draft
---

# Amazon Aurora & Aurora Serverless

## 📋 CLF-Recap

> *Im CLF-Track war Aurora nur ein Unterpunkt im RDS-Skript — der SAA-Guide listet es separat, und die Prüfung liebt es. Daher ein eigenes Skript.* Kurz: Aurora ist Amazons **cloud-native Neuerfindung** der relationalen Datenbank — MySQL-/PostgreSQL-kompatibel, aber mit radikal anderem Unterbau: Compute und Storage sind getrennt.

---

## 🎯 SAA-Vertiefung

### Die Architektur: Ein Gehirn, sechs Gedächtnisse

**Das Problem:** Bei klassischem RDS hängt die Festplatte an der Instanz — stirbt die AZ, muss ein kompletter Standby samt eigener Datenkopie einspringen. Replikation, Failover und Skalierung kämpfen alle mit demselben Konstrukt: Daten kleben am Server.

**Die Lösung:** Aurora trennt beides. Der **Storage-Layer** ist ein eigenes, verteiltes System, das jede Information **sechsfach über drei AZs** hält, sich selbst heilt und automatisch bis 128 TiB wächst. Die Compute-Instanzen (Writer + Replicas) sind nur noch „Gehirne", die alle **auf denselben Speicher schauen**. Konzeptionell bestätigt der Storage einen Write bei 4 von 6 Kopien, einen Read bei 3 von 6 (🔴 als Architektur-Prinzip verstehen, nicht als Prüfungszahl auswendig beten).

Daraus fallen die Prüfungsfakten wie reife Früchte:
- **Bis 15 Aurora Replicas** — und weil sie denselben Storage lesen, ist ihr Replica-Lag minimal (kein Datenkopieren wie bei RDS-Replicas).
- **Failover** befördert einfach eine Replica zum Writer (Prioritäts-Tiers steuern, welche) — es muss kein Standby-Datenbestand „aufwachen".
- **Endpoints als Verkehrsleitsystem:** **Writer Endpoint** (zeigt immer auf den aktuellen Writer — auch nach Failover), **Reader Endpoint** (verteilt Lese-Traffic über alle Replicas automatisch), **Custom Endpoints** (z. B. „nur die zwei großen Analytics-Replicas"). Dazu Replica **Auto Scaling** nach Last.

> **💡 Merksatz:** Aurora = **geteilter 6-fach-Storage über 3 AZs**, Compute obendrauf. Deshalb: 15 Replicas mit Mini-Lag, schnelles Failover, und Apps sprechen **Endpoints** an, nie einzelne Instanzen.

### Global Database: Der Not-Ausgang mit Stoppuhr (D2-Kern)

**Das Problem:** „Die Anwendung muss einen kompletten **Regionsausfall** überleben — mit höchstens einer Sekunde Datenverlust und unter einer Minute Umschaltzeit." Mit RDS Cross-Region-Replicas (manuelle Promotion, Minuten bis Stunden) ist das nicht zu gewinnen.

**Die Lösung:** **Aurora Global Database** — eine Primär-Region schreibt, bis zu **5 Sekundär-Regionen** lesen mit typischer Replikations-Latenz **unter 1 Sekunde** (die Replikation läuft auf Storage-Ebene, nicht über die Engine). Die offiziellen Kennzahlen, die die Prüfung hören will: **RPO typisch 1 Sekunde, RTO typisch unter 1 Minute** (🔴 „typisch" — keine Garantie).

Die Begriffs-Falle, die Punkte kostet: **Managed Failover vs. Switchover.**
- **Failover** = der *ungeplante* Notfall: Sekundär-Region wird sofort befördert, die letzten nicht replizierten Sekunden(bruchteile) sind verloren — **RPO > 0**.
- **Switchover** = der *geplante* Regionswechsel (Wartung, DR-Übung): Aurora synchronisiert erst vollständig, dann wird getauscht — **RPO = 0**.

Dazu **Write Forwarding**: Sekundär-Regionen können Writes annehmen und an die Primary weiterleiten — die App in Sydney braucht keine eigene Routing-Logik, zahlt aber die Latenz des Umwegs. Und die große Abgrenzung: Aurora Global hat **eine** Writer-Region. Sollen **alle** Regionen aktiv schreiben → das ist DynamoDB Global Tables (multi-active), nicht Aurora.

> **💡 Merksatz:** Region-DR relational = **Aurora Global** (RPO ~1 s, RTO < 1 min, typisch). Geplant = **Switchover (RPO 0)**, Notfall = **Failover (RPO > 0)**. „Überall schreiben" → DynamoDB, nicht Aurora.

### Aurora Serverless: Die Datenbank, die schlafen kann

**Das Problem:** Eine interne App läuft werktags 9–17 Uhr; nachts und am Wochenende steht die provisionierte DB bezahlt, aber ungenutzt herum. Und das Entwickler-Team hat noch zwölf solcher Datenbanken.

**Die Lösung:** **Aurora Serverless** (technisch v2 — 🛑 seit April 2026 offiziell nur noch „Aurora Serverless" genannt) misst Kapazität in **ACUs** (~2 GiB RAM) und skaliert **stufenlos von 0 bis 256 ACUs** in 0,5er-Schritten — ohne Verbindungsabbrüche, in Sekundenbruchteilen. Das Highlight seit 🛑 11/2024: **Scale-to-Zero** — bei null Verbindungen pausiert die DB automatisch (nur noch Storage-Kosten), und der Resume dauert etwa **15 Sekunden**.

Drei Feinheiten mit Prüfungswert:
1. **Mischbetrieb:** Serverless- und Provisioned-Instanzen leben **im selben Cluster** — z. B. ein provisionierter Writer für die Grundlast plus serverless Reader, die mit Lastspitzen atmen.
2. **Die Auto-Pause-Bremse:** Offene Verbindungen verhindern die Pause — insbesondere ein **RDS Proxy** hält die DB dauerhaft wach (siehe Proxy-Skript).
3. 🛑 **v1 ist tot** (EoL 31.03.2025). Alte v1-Eigenschaften — grobe Verdopplungs-Skalierstufen, Data API als Alleinstellungsmerkmal, Pause mit langem Kaltstart — sind heute **veraltete Distraktoren**.

> **💡 Merksatz:** Schwankende oder Teilzeit-Last relational → **Aurora Serverless** (0–256 ACUs). Nachts idle → **Scale-to-Zero** (Resume ~15 s) — außer ein Proxy hält die Tür auf.

### Die Werkzeugkiste: Vier Tricks, die RDS nicht kann

Jeder dieser vier ist eine eigene Szenario-Frage wert:

1. **Cloning (copy-on-write):** „Wir brauchen eine Kopie der 5-TB-Produktions-DB für einen zweitägigen Test — heute noch." Ein Clone zeigt zunächst auf **dieselben Storage-Seiten** und kopiert nur, was sich ändert: fertig in Minuten, kostet anfangs fast nichts. Snapshot-Restore (Stunden, voller Speicherpreis) und Dump/Restore sind die Distraktoren.
2. **Backtrack (nur Aurora MySQL):** „Ein fehlerhaftes UPDATE lief vor einer Stunde — zurück, aber **ohne neue Instanz**." Backtrack spult die **bestehende** DB in-place zurück. PITR dagegen erzeugt immer eine *neue* Instanz — genau das ist der Unterschied, den die Frage testet.
3. **Babelfish (Aurora PostgreSQL):** „SQL-Server-Lizenzkosten loswerden, aber die App spricht T-SQL." Babelfish versteht das SQL-Server-Protokoll und T-SQL direkt — Migration mit minimalen Codeänderungen statt komplettem Rewrite.
4. **Parallel Query** (Analytics-Push-down in den Storage-Layer) und **Aurora ML** als Randnotizen.

> **💡 Merksatz:** Test-Kopie in Minuten → **Cloning**. Zurückspulen ohne neue Instanz → **Backtrack** (nur MySQL!). T-SQL/SQL-Server-Ablöse → **Babelfish**.

### Kostenmodell: Die 25-%-Schwelle (D4)

**Das Problem:** Die Aurora-Rechnung eines I/O-hungrigen Workloads explodiert — nicht wegen Compute oder Storage, sondern wegen der **I/O-Gebühren** (Standard-Konfiguration rechnet pro Request ab).

**Die Lösung:** **Aurora I/O-Optimized**: keine I/O-Gebühren mehr, dafür teurerer Compute/Storage — offiziell „**bis zu 40 % Ersparnis, wenn die I/O-Kosten mehr als 25 % der Aurora-Ausgaben ausmachen**". Diese 25-%-Schwelle ist die Prüfungszahl. Wechsel zu I/O-Optimized alle 30 Tage möglich, zurück jederzeit. Dazu: Database Savings Plans decken Aurora ab (bis 35 % Serverless / 20 % Provisioned). 🛑 Randnotiz: **Aurora DSQL** (multi-region active-active SQL, GA 2025) ist zu neu für die SAA-C03 — nicht als Antwort erwarten.

> **💡 Merksatz:** I/O-Anteil **> 25 %** der Aurora-Kosten → **I/O-Optimized** (bis −40 %). Unter der Schwelle bleibt Standard günstiger.

---

## ⚠️ Prüfungs-Knackpunkte

- Architektur: 6 Kopien / 3 AZs, geteilter Storage, bis **15 Replicas**, minimaler Lag, Failover = Replica-Beförderung.
- Apps nutzen **Writer/Reader/Custom Endpoints** — nie Instanz-Adressen.
- Region-DR: **Aurora Global** — RPO ~1 s, RTO < 1 min (typisch); **Switchover = RPO 0 (geplant)**, Failover = RPO > 0 (Notfall); max. 5 Sekundär-Regionen; Write Forwarding möglich.
- **Eine** Writer-Region — multi-active schreiben können nur DynamoDB Global Tables.
- **Aurora Serverless:** 0–256 ACUs, Scale-to-Zero (11/2024, Resume ~15 s), Mischbetrieb im Cluster; 🛑 v1 EoL 03/2025 (Distraktor); Proxy verhindert Auto-Pause.
- Test-Kopie in Minuten → **Cloning** (copy-on-write); In-Place-Zurückspulen → **Backtrack** (nur Aurora MySQL); T-SQL-Migration → **Babelfish**.
- I/O-Kosten > 25 % der Rechnung → **I/O-Optimized** (bis −40 %).
- 🛑 Aurora DSQL = zu neu, kein Prüfungsstoff.

## 💡 Der eine Satz zum Mitnehmen

**Aurora ist „RDS mit getrenntem Superspeicher"** — der geteilte 6-fach-Storage erklärt fast jede Prüfungsantwort: 15 Replicas ohne Lag, Failover in Sekunden, Klone in Minuten, globale Replikation unter einer Sekunde — und Serverless macht daraus eine Datenbank, die nachts schlafen geht.
