---
service: Disaster-Recovery-Strategien (RTO/RPO)
seedKey: saa-c03-script-dr-strategien
batch: B9
domains: [D2]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
  - https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html
  - https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html
status: draft
---

# Disaster-Recovery-Strategien (RTO/RPO)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Vier Rettungspläne fürs Rechenzentrum — von billig/langsam bis teuer/sofort. **RPO** = wie viel **Datenverlust** verkraftbar (blickt zurück); **RTO** = wie lange die **Wiederherstellung** dauern darf (blickt vorwärts). **Je kleiner RPO/RTO gefordert, desto teurer.** Die vier: **Backup & Restore** (billigste, langsamste) · **Pilot Light** (Kern läuft, App-Server aus) · **Warm Standby** (verkleinert, aber läuft) · **Multi-Site Active/Active** (teuerste, ~0 Ausfall).

Der SAA vertieft: **wie man aus einem Szenario die Strategie ableitet, die Pilot-Light-vs-Warm-Standby-Feinheit, Route 53 Failover — das ist DIE DR-Prüfungsachse.**

---

## 🎯 SAA-Vertiefung

### RTO/RPO aus dem Szenario ableiten

**Das Problem:** Eine Frage nennt „maximal 15 Minuten Ausfall, höchstens 1 Minute Datenverlust, Kosten sekundär". Welche Strategie?

**Die Lösung:** Man liest zwei Zahlen aus dem Text:
- **RTO** (Ausfallzeit-Ziel): niedriges RTO → mehr Infrastruktur muss **vorab bereitstehen/laufen** (Warm Standby, Multi-Site). Hohes RTO (Stunden ok) → Backup & Restore reicht.
- **RPO** (Datenverlust-Ziel): niedriges RPO → **häufigere/kontinuierliche Replikation**. Hohes RPO (Stunden ok) → periodische Backups genügen.

Die grobe Zuordnung (🔴 Zeitwerte = Größenordnungs-Konventionen, keine SLA):
- RTO **Stunden**, günstig → **Backup & Restore**
- RTO **~10er Minuten** → **Pilot Light**
- RTO **Minuten** → **Warm Standby**
- RTO/RPO **~null** → **Multi-Site Active/Active**

Wichtig: **HA ≠ DR.** HA hält den Workload bei AZ-/Komponenten-Ausfall **innerhalb einer Region**; DR ist Recovery bei größerer Katastrophe (oft **Region-Ausfall**), meist in einer **anderen Region**, gegen explizite RTO/RPO. Und: Replikation schützt **nicht** vor Datenkorruption/-löschung → zusätzlich Point-in-Time-Backups.

> **💡 Merksatz:** **RTO klein → mehr Infra vorab laufen lassen; RPO klein → häufiger replizieren.** Stunden→Backup&Restore, ~10er-Min→Pilot Light, Min→Warm Standby, ~0→Multi-Site. **HA ≠ DR.**

### Die feinste Falle: Pilot Light vs. Warm Standby

**Das Problem:** Beide halten „etwas" in der zweiten Region bereit. Was unterscheidet sie genau?

**Die Lösung:** Der entscheidende Unterschied ist, **ob die Umgebung sofort Traffic verarbeiten kann**:
- **Pilot Light**: Daten sind **live repliziert** (DB aktuell), aber die **Compute-Ebene ist „aus"** (Server nicht deployed / 0 Instanzen). Bei Failover muss man erst **deployen und hochskalieren** → RTO 10er-Minuten. Bild: Die Zündflamme brennt, man dreht nur das Gas auf.
- **Warm Standby**: eine **verkleinerte, aber voll funktionsfähige** Kopie **läuft dauerhaft** und kann sofort (reduziert) Traffic verarbeiten — bei Failover muss man **nur hochskalieren** → RTO Minuten.

Der Reflex: „Kern läuft, Compute aus, erst hochfahren" → **Pilot Light**; „läuft schon klein, nur hochskalieren" → **Warm Standby**. Das ist eine der meistgeprüften DR-Unterscheidungen.

> **💡 Merksatz:** **Pilot Light = Daten live, Compute aus** (erst deployen+skalieren). **Warm Standby = läuft verkleinert** (nur hochskalieren, kann sofort reduziert Traffic). „nur hochskalieren" → Warm Standby.

### Umsetzung: Route 53 Failover und Datenreplikation

**Das Problem:** Wie schaltet man im Ernstfall tatsächlich um, und wie hält man die Daten in der zweiten Region aktuell?

**Die Lösung — die Bausteine:**
- **Route 53 Failover-Routing** (Active-Passive): DNS-basiert; ein **Health Check** überwacht den Primary, bei Ausfall liefert Route 53 automatisch den **Secondary**. Health-Check-Intervall **30 s Standard / 10 s Fast**, Failure Threshold Default 3. Kostengünstiges Muster: Secondary als **S3-Static-Website** („we'll be back"). Active-Active nutzt weighted/latency/multivalue + Health Checks.
- **Datenreplikation** je nach RPO: **S3 Cross-Region Replication**, **RDS/Aurora Cross-Region Read Replicas/Snapshots** (Pilot Light nutzt oft eine Cross-Region Read Replica), vorab kopierte **AMIs** in die Zielregion (für schnelles EC2-Hochfahren).

> **💡 Merksatz:** **Route 53 Failover-Routing (Active-Passive)** = Health Check → automatisch Secondary. Daten aktuell halten via **S3 CRR / RDS-Aurora Cross-Region Replica / AMIs**. Health Check 30 s bzw. 10 s Fast.

---

## ⚠️ Prüfungs-Knackpunkte

- **RPO = Datenverlust** (blickt zurück), **RTO = Ausfallzeit** (blickt vorwärts). Nicht verwechseln.
- Zuordnung (🔴 Größenordnung): Stunden→**Backup & Restore**, ~10er-Min→**Pilot Light**, Min→**Warm Standby**, ~0→**Multi-Site**.
- **Pilot Light** (Daten live, Compute aus, erst deployen) vs. **Warm Standby** (läuft verkleinert, nur hochskalieren).
- **HA ≠ DR**; Replikation schützt nicht vor Korruption → zusätzlich PIT-Backups.
- **Route 53 Failover-Routing** (Active-Passive, Health Check 30 s/10 s Fast); Daten via **S3 CRR / RDS-Aurora Cross-Region / AMIs**.
- Kostengünstiges Secondary: **S3 Static Website**.

## 💡 Der eine Satz zum Mitnehmen

**DR-Fragen löst man über RTO und RPO: kleines RTO heißt mehr Infrastruktur vorab (Warm Standby/Multi-Site), kleines RPO heißt häufiger replizieren — und die Schlüsselunterscheidung bleibt Pilot Light (Compute aus, erst hochfahren) gegen Warm Standby (läuft schon klein, nur hochskalieren), umgeschaltet per Route 53 Failover-Routing.**
