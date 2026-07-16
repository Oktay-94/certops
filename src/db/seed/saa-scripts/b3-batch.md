---
service: AWS Batch
seedKey: saa-c03-script-batch
batch: B3
domains: [D3, D4]
sourceRef:
  - https://aws.amazon.com/batch/faqs/
  - https://docs.aws.amazon.com/batch/latest/userguide/multi-node-parallel-jobs.html
status: draft
---

# AWS Batch

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AWS Batch = die **Waschmaschine**: Du wirfst Jobs in einen Korb (**Job Queue**), Batch berechnet den Aufwand, besorgt automatisch die passende Menge Server (**Compute Environment**), arbeitet ab — und schaltet danach alles wieder ab. Für schwere, asynchrone Massenarbeit (Video-Encoding, Risikoberechnung, Genomik), ideal auf **Spot**.

Der SAA vertieft: **Welche Compute Environment, warum Spot hier fast immer richtig ist — und wo die Grenze zu Lambda, ECS und Step Functions verläuft.**

---

## 🎯 SAA-Vertiefung

### Die drei Bausteine — und die eine Regel, die man kennen muss

**Das Problem:** 100.000 unabhängige Rechenjobs sollen nachts durchlaufen. Wer entscheidet, wie viele Server dafür starten, welcher Job zuerst drankommt, und was passiert, wenn ein Server mitten im Job stirbt?

**Die Lösung — Batch besteht aus drei Teilen:**
- **Job Definition:** der Bauplan eines Jobs (Container-Image, vCPU/Memory, IAM-Rolle, Retry-Strategie).
- **Job Queue:** der Korb mit **Priorität** — mehrere Queues können unterschiedlich wichtig sein.
- **Compute Environment (CE):** die Maschinerie darunter. **Managed** (AWS provisioniert und skaliert selbst — der Normalfall) oder **Unmanaged** (du bringst deinen eigenen Cluster mit, etwa für Dedicated Hosts). Compute-Typen: **EC2, SPOT, FARGATE, FARGATE_SPOT**.

Die Detailregel, die als Distraktor auftaucht: Eine Job Queue kann **nicht** Fargate- und EC2-Compute-Environments mischen — man entscheidet sich pro Queue. Und: **AWS Batch selbst kostet nichts** — du zahlst nur die EC2-/Fargate-Ressourcen darunter.

> **💡 Merksatz:** Job Definition (Was) → Job Queue (Reihenfolge) → Compute Environment (Womit). Managed CE ist der Normalfall; **Batch selbst ist kostenlos**, du zahlst nur Compute.

### Warum Batch und Spot zusammengehören wie Waschmaschine und Nachtstrom

**Das Problem:** Die nächtliche Risikoberechnung kostet ein Vermögen an On-Demand-Instanzen — obwohl es völlig egal ist, ob sie um 2 oder um 4 Uhr fertig wird.

**Die Lösung:** Batch-Jobs sind per Definition **fault-tolerant und wiederholbar** — genau das Profil, für das **Spot** gebaut ist (🔴 bis zu 90 % günstiger). Wird eine Spot-Instanz zurückgeholt, legt Batch den Job einfach wieder in die Queue und startet ihn neu. In einer Managed Compute Environment aktiviert man Spot mit einem Schalter (optional mit maximalem Preis-Prozentsatz gegenüber On-Demand) und wählt eine Allocation Strategy wie **SPOT_CAPACITY_OPTIMIZED**, die Pools mit der geringsten Rückhol-Wahrscheinlichkeit bevorzugt.

Deshalb ist „**Batch-Workload kostenoptimiert ausführen**" fast immer gleichbedeutend mit „**AWS Batch auf Spot**". Der Distraktor „Reserved Instances" fällt hier durch: Man reserviert nichts, was nur nachts läuft.

> **💡 Merksatz:** Batch + **Spot** ist die Standardpaarung — unterbrechbare Jobs, bis zu 90 % billiger, Wiederholung ist eingebaut. RI/Savings Plans sind für sporadische Batch-Last der Distraktor.

### Die Job-Typen: Array, Dependencies und der HPC-Sonderfall

Drei Muster, die die Prüfung unterscheidet:
- **Array Jobs:** ein Job, tausende Shards — jeder Shard bekommt einen Index (`AWS_BATCH_JOB_ARRAY_INDEX`) und verarbeitet „seinen" Teil der Daten. Antwort auf „10.000 Dateien parallel verarbeiten, gleiche Logik".
- **Job Dependencies:** Job B startet erst, wenn Job A fertig ist — eine einfache Pipeline. **Aber Achtung:** Sobald das Szenario nach *echter Workflow-Orchestrierung* verlangt (Verzweigungen, Fehlerbehandlung, Wartezustände, Human Approval), ist die Antwort **Step Functions**, nicht Batch-Dependencies.
- **Multi-node Parallel Jobs:** der HPC-Fall — **ein** Job spannt sich über **mehrere Instanzen**, die per **MPI** miteinander reden (Gang Scheduling). Zwei Details mit Punktwert: Das geht **nur in Managed EC2-CEs** und **nicht auf Spot** (weil der Ausfall eines einzelnen Knotens den ganzen Job killt) — und man kombiniert es mit **Cluster Placement Group + EFA**.

Dazu **Fair Share Scheduling**: Wenn mehrere Teams dieselbe Queue nutzen, verhindert es, dass ein Team mit 50.000 Jobs alle anderen aushungert.

> **💡 Merksatz:** Gleiche Logik, viele Datenteile → **Array Jobs**. Echter Workflow mit Verzweigungen → **Step Functions**. MPI über mehrere Knoten → **Multi-node Parallel** (Managed EC2, **kein Spot**, mit EFA + Cluster PG).

### Die Abgrenzung: Wer macht die Schwerarbeit?

| Das Szenario sagt … | Antwort |
|---|---|
| Kurze, ereignisgetriebene Einzelaktion (< 15 min) | **Lambda** |
| Viele unabhängige, lang laufende Rechenjobs, kostenoptimiert | **AWS Batch** (auf Spot) |
| Mehrere **abhängige** Schritte mit Logik koordinieren | **Step Functions** |
| Dauerhaft laufende Services/Microservices | **ECS/EKS** (Batch ist für endliche Jobs) |
| Hadoop/Spark-Analytik | **EMR** |

> **💡 Merksatz:** **Lambda = kurz & reaktiv · Batch = lang & massenhaft · Step Functions = koordiniert · ECS = läuft dauerhaft · EMR = Spark/Hadoop.**

---

## ⚠️ Prüfungs-Knackpunkte

- Aufbau: Job Definition → Job Queue (Priorität) → **Compute Environment** (Managed/Unmanaged; EC2, SPOT, FARGATE, FARGATE_SPOT). Eine Queue mischt **nicht** Fargate- und EC2-CE.
- **Batch selbst ist kostenlos** — nur Compute wird berechnet.
- Kostenoptimierte Batch-Last → **Spot** (🔴 bis zu 90 %) + Capacity-Optimized-Strategie; Retry ist eingebaut.
- **Array Jobs** = viele Shards mit Index; **Job Dependencies** = simple Kette; **echter Workflow → Step Functions**.
- **Multi-node Parallel Jobs** (MPI/HPC): nur **Managed EC2**, **nicht auf Spot**, mit **EFA + Cluster Placement Group**.
- **Fair Share Scheduling** gegen aushungernde Teams.
- Job > 15 Minuten → **nicht Lambda**, sondern Batch/Fargate.

## 💡 Der eine Satz zum Mitnehmen

**AWS Batch ist die Antwort, wenn viele unabhängige, endliche Rechenjobs möglichst billig durchlaufen sollen** — und weil solche Jobs wiederholbar sind, gehört Spot fast immer zur richtigen Antwort dazu.
