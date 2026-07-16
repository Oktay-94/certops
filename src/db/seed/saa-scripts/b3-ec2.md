---
service: Amazon EC2 (inkl. Kaufoptionen & Placement Groups)
seedKey: saa-c03-script-ec2
batch: B3
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances.html
  - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/placement-strategies.html
  - https://aws.amazon.com/savingsplans/compute-pricing/
  - https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html
status: draft
---

# Amazon EC2

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EC2 = der **Rohbau**: ein virtueller Server, den du komplett selbst einrichtest (IaaS — ab dem OS gehört alles dir). Beim Start wählst du AMI, Instanztyp, VPC/Subnet, Security Group und Key Pair. Familien nach Verwendungszweck (M/T allgemein, C Rechenpower, R/X RAM, I/D Storage, P/G GPU). Security Group = stateful, nur ALLOW. Stop ≠ Terminate. **User Data** = Bootstrap-Skript, **IMDSv2** = Best Practice.

Der SAA gräbt an drei Stellen tiefer: **die Kaufoptionen (Domain-4-Schwergewicht), die physische Platzierung (Placement Groups) und die Detailfallen von Burstable-Instances, Nitro und IMDS.**

---

## 🎯 SAA-Vertiefung — Teil 1: Die Instanz selbst

### Das Prepaid-Handy: Burstable T-Instances und ihre Credits

**Das Problem:** „Unsere t2.micro läuft nachmittags wie durch Sirup, morgens ist sie schnell." Ein Klassiker — und genau hier hat sich die richtige Antwort inzwischen verschoben.

**Die Lösung:** T-Instances haben eine niedrige **Baseline-CPU** (z. B. t3.large = 30 %) und sammeln unterhalb davon **CPU-Credits**, die sie beim Bursten ausgeben. Was passiert, wenn das Guthaben leer ist, hängt vom **Modus** ab — und *das* ist die Vertiefung:

- **Standard-Modus:** Credits leer → **Drosselung auf die Baseline**. Genau das beschriebene Sirup-Erlebnis. **T2 ist per Default Standard.**
- **Unlimited-Modus:** Die Instanz burstet **weiter** und AWS berechnet den Mehrverbrauch (Surplus) — sie wird also *teurer*, nicht langsamer. **T3, T3a und T4g sind per Default Unlimited.**

Damit ist die alte Pauschalregel „T-Instances werden langsam, wenn die Credits weg sind" **nur für Standard/T2 richtig**. Bei einer T3 ist das Symptom nicht Langsamkeit, sondern eine überraschende Rechnung. Und wenn eine Instanz dauerhaft über der Baseline läuft, ist die eigentliche Architektur-Antwort ohnehin: **kein T-Typ, sondern M/C** — T-Instances sind für *schwankende*, nicht für *dauerhafte* Last gebaut.

> **💡 Merksatz:** T2 = Standard (drosselt auf Baseline) · T3/T3a/T4g = Unlimited (drosselt nicht, kostet extra). Dauerlast → gar kein T-Typ, sondern M/C.

### Nitro, ENA und EFA: Warum HPC ein eigenes Netzwerk-Kabel bekommt

**Das Problem:** Ein HPC-Cluster rechnet mit MPI über hunderte Instanzen — und verbringt mehr Zeit mit Warten auf das Netzwerk als mit Rechnen.

**Die Lösung:** Der **Nitro-Hypervisor** (leichtgewichtig, mit dedizierten Nitro-Karten für IO/Netzwerk) gibt fast native Performance und ermöglicht überhaupt erst Bare-Metal-Instances. Darauf setzt das Netzwerk-Angebot auf:
- **ENA** = der normale Enhanced-Networking-Adapter (hoher Durchsatz).
- **EFA (Elastic Fabric Adapter)** = der HPC-Spezialist: umgeht das Betriebssystem (**OS-bypass**, SRD-Protokoll) und spricht direkt mit der Hardware — genau das, was **MPI und NCCL** brauchen. **Kostet keinen Aufpreis.**

Signalwort-Kette: **„tightly coupled HPC / MPI / ML-Training über viele Nodes"** → **EFA + Cluster Placement Group**. Beide gehören zusammen wie Reifen und Rennstrecke.

> **💡 Merksatz:** HPC/MPI mit niedrigster Netzwerk-Latenz → **EFA** (OS-bypass, gratis) **plus Cluster Placement Group**. ENA reicht für alles Normale.

### IMDSv2 und der Bastion-Ausstieg

Die Instanz fragt sich selbst über `169.254.169.254` ab — inklusive der **temporären Credentials ihrer IAM-Rolle**. Genau das machte IMDSv1 zur SSRF-Beute. **IMDSv2** ist session-/token-basiert und die klare AWS-Empfehlung; seit 🛑 **März 2024** lässt sich IMDSv2 als **Account-Default pro Region** setzen (wirkt nur auf *neue* Instanzen), und neuere Instance-Typen sind bereits IMDSv2-only. Antwort auf „Credentials-Diebstahl über SSRF verhindern" → **IMDSv2 erzwingen**, nicht „Metadaten abschalten".

Und der zweite Sicherheits-Klassiker: Der **Bastion Host mit offenem Port 22** ist der Legacy-Distraktor. Die moderne Antwort heißt **SSM Session Manager** — Zugriff über IAM, ohne offene Ports, ohne SSH-Keys, mit CloudTrail-Protokoll.

> **💡 Merksatz:** SSRF-Schutz → **IMDSv2 erzwingen**. Shell-Zugriff ohne offenen Port 22 → **SSM Session Manager** statt Bastion.

### Dedicated Instances vs. Dedicated Hosts: Die Lizenzfrage

Beides ist „eigene Hardware", aber nur eines löst das Lizenzproblem:
- **Dedicated Instance:** Hardware wird nicht mit anderen *Accounts* geteilt — aber du siehst die physischen Sockets/Cores **nicht**.
- **Dedicated Host:** ein ganzer physischer Server mit **sichtbaren Sockets und Cores** — und genau das braucht **BYOL** für socket-/core-gebundene Lizenzen (Windows Server, SQL Server, Oracle).

> **💡 Merksatz:** „**BYOL** / socket-basierte Lizenz / ich muss die Cores sehen" → **Dedicated Host**. Nur „keine fremden Nachbarn" → Dedicated Instance.

---

## 🎯 SAA-Vertiefung — Teil 2: Kaufoptionen (Domain 4)

### Die fünf Einkaufsstrategien — und wann welche gewinnt

**Das Problem:** Dieselbe Instanz kostet je nach Vertrag das Fünf- bis Zehnfache. Die Prüfung gibt dir immer zwei Hinweise: **Wie vorhersehbar** ist die Last, und **wie unterbrechbar**?

**Die Lösung — die Entscheidungsachse:**

| Das Szenario sagt … | Antwort |
|---|---|
| Kurz, unvorhersehbar, Test | **On-Demand** |
| Stabile Dauerlast, 1–3 Jahre, **eine** Familie/Region | **EC2 Instance Savings Plan** (🔴 bis zu 72 %) oder **Standard RI** (🔴 bis zu 72 %) |
| Dauerlast, aber **flexibel** — inkl. Fargate & Lambda | **Compute Savings Plan** (🔴 bis zu 66 %) |
| Fault-tolerant, unterbrechbar, kostenoptimiert | **Spot** (🔴 bis zu 90 %) |
| BYOL / Compliance / physische Cores sichtbar | **Dedicated Host** |
| **Kapazitätsgarantie** in einer AZ | **ODCR** oder **zonale RI** |

Die drei Punkte, an denen die Distraktoren ansetzen:

1. **Savings Plans reservieren keine Kapazität — nur den Preis.** Verlangt das Szenario eine *garantierte* Kapazität in einer AZ (Disaster-Failover, Kapazitätsengpass), brauchst du eine **On-Demand Capacity Reservation (ODCR)** oder eine **zonale RI** — beide kombinierbar mit einem Savings Plan (Garantie *und* Rabatt).
2. **Nur der Compute SP deckt Fargate und Lambda ab.** Der EC2 Instance SP nicht. Steht „auch unsere Lambda-/Fargate-Kosten senken" im Text, ist die Antwort eindeutig.
3. **Spot bekommt keinen Savings-Plan-Rabatt** — Spot ist bereits der Rabatt. Und Spot ist nie die Antwort für Datenbanken oder dauerhaft laufende kritische Dienste, egal wie verlockend die Prozentzahl klingt.

🔴 Alle Prozentwerte (90 %, 72 %, 66 %) sind offizielle **„bis zu"-Angaben** — reale Spot-Rabatte liegen oft bei 50–70 %. Niemals als Punktwert lehren.

> **💡 Merksatz:** Vorhersehbar → SP/RI · unterbrechbar → Spot · Lizenz → Dedicated Host · **Kapazität garantiert → ODCR/zonale RI (Savings Plans reservieren nichts!)** · Fargate/Lambda mit drin → **Compute SP**.

### Spot richtig einsetzen: Die zwei Minuten vor dem Tod

**Das Problem:** Spot-Instanzen können AWS jederzeit zurückholen. Wie baut man darauf etwas, das nicht bei jeder Rückholung Daten verliert?

**Die Lösung:** Spot kündigt sich an — **2-Minuten-Interruption-Notice** (abrufbar über IMDS oder als **EventBridge-Event**), davor gibt es oft schon die **Rebalance Recommendation** („erhöhtes Risiko"). Die richtige Architektur reagiert darauf: Checkpoint schreiben, Task drainen, Job an die Queue zurückgeben. Dazu die Betriebsmuster: **Mixed Instances Policy** in der ASG (On-Demand-Basis + Spot-Aufsatz), **Capacity-Optimized Allocation Strategy** (wählt Pools mit der geringsten Interruption-Wahrscheinlichkeit) und **Capacity Rebalancing**.

🛑 **Spot Blocks** (garantierte Laufzeit gegen Aufpreis) hat AWS zurückgezogen — in neuen Szenarien kein gültiges Werkzeug mehr.

> **💡 Merksatz:** Spot = **2-Minuten-Warnung** (IMDS/EventBridge) + Checkpointing + Mixed Instances Policy. Ohne Reaktion auf die Warnung ist Spot ein Datenverlust-Design.

---

## 🎯 SAA-Vertiefung — Teil 3: Placement Groups

### Zusammen, verstreut oder in Brandabschnitten

**Das Problem:** Standardmäßig verteilt AWS Instanzen beliebig. Aber HPC will sie **nah beieinander** (Latenz), kritische Einzel-Instanzen wollen **maximal getrennt** (Ausfall), und Cassandra will **Gruppen mit isolierten Fehlerdomänen**.

**Die Lösung — drei Strategien, drei Bilder:**
- **Cluster** = *alle in einem Raum*: eine AZ, physisch eng, niedrigste Latenz + höchster Durchsatz. Für HPC/MPI (mit EFA!). Preis: geballtes Risiko, wenn das Rack fällt.
- **Spread** = *jeder in einem eigenen Gebäude*: jede Instanz auf distinkter Hardware. Für **wenige, besonders kritische** Instanzen. **Harte Grenze: max. 7 laufende Instanzen pro AZ** (bei 3 AZs also 21 gesamt) — die Zahl ist prüfungsrelevant und ein beliebter Rechenfallen-Distraktor („20 Instanzen in einer AZ per Spread" → unmöglich).
- **Partition** = *Brandabschnitte*: logische Partitionen, jede auf eigener Hardware, **max. 7 Partitionen pro AZ**. Für große verteilte Systeme mit eigener Replikation: **HDFS, HBase, Cassandra, Kafka**.

> **💡 Merksatz:** **Cluster = zusammen (schnell, HPC + EFA)** · **Spread = verstreut (sicher, max. 7 pro AZ)** · **Partition = Brandabschnitte (Cassandra/Kafka, max. 7 Partitionen pro AZ)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **T2 = Standard-Modus** (drosselt auf Baseline) vs. **T3/T3a/T4g = Unlimited** (drosselt nicht, kostet Surplus); Dauerlast → M/C statt T.
- HPC/MPI/ML-Multi-Node → **EFA** (OS-bypass, kostenlos) + **Cluster Placement Group**.
- SSRF-Schutz → **IMDSv2 erzwingen** (🛑 Account-Default seit 03/2024, gilt nur für neue Instances); Zugriff ohne Port 22 → **SSM Session Manager**.
- **BYOL/socket-basierte Lizenz** → **Dedicated Host** (Cores sichtbar); Dedicated Instance = nur Isolation.
- Kaufoptionen: unvorhersehbar → On-Demand · stabil/eine Familie → **EC2 Instance SP / Standard RI** · flexibel inkl. **Fargate+Lambda** → **Compute SP** · unterbrechbar → **Spot** · Kapazitätsgarantie → **ODCR / zonale RI**.
- **Savings Plans reservieren keine Kapazität**; **Spot bekommt keinen SP-Rabatt**; 🛑 **Spot Blocks zurückgezogen**.
- Spot-Architektur: **2-Minuten-Notice** (IMDS/EventBridge), Rebalance Recommendation, Mixed Instances Policy, Capacity-Optimized.
- Placement Groups: Cluster (Latenz, 1 AZ) · **Spread (max. 7 Instanzen/AZ)** · **Partition (max. 7 Partitionen/AZ, Cassandra/Kafka)**.
- 🔴 Alle Rabatt-Prozente sind „bis zu"-Werte (Spot 90 %, RI/SP 72/66 %) — nie als exakte Zahl.

## 💡 Der eine Satz zum Mitnehmen

**Bei EC2 entscheiden zwei Fragen fast jede Prüfungsantwort: „Wie vorhersehbar ist die Last?" (→ Kaufoption) und „Wie nah oder getrennt müssen die Instanzen stehen?" (→ Placement Group)** — der Rest sind Detailfallen wie T-Credits, EFA und IMDSv2.
