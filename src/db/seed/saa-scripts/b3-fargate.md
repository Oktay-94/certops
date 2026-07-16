---
service: AWS Fargate
seedKey: saa-c03-script-fargate
batch: B3
domains: [D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/fargate/pricing/
  - https://docs.aws.amazon.com/AmazonECS/latest/developerguide/fargate-task-storage.html
status: draft
---

# AWS Fargate

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Fargate = **Container ohne Server**: Du sagst „diesen Container, 1 vCPU, 2 GB" — AWS beschafft, patcht und skaliert die Maschine darunter, die du nie siehst. Kein Konkurrent zu ECS/EKS, sondern deren **serverless Launch Type**.

Der SAA fragt: **Wann Fargate, wann doch EC2? Was kann Fargate ausdrücklich NICHT? Und wie holt man 70 % Rabatt raus?**

---

## 🎯 SAA-Vertiefung

### Der Deal: Ops gegen Geld

**Das Problem:** Ein Team betreibt einen ECS-Cluster auf EC2 — und verbringt die Hälfte der Zeit mit Instanz-Patching, Kapazitätsplanung und der Frage, warum der Cluster zu 30 % ausgelastet ist (aber zu 100 % bezahlt wird).

**Die Lösung:** Fargate rechnet **pro Task nach vCPU und Memory pro Sekunde** ab (Minimum: 1 Minute) — du zahlst exakt für das, was der Container beansprucht, nicht für halbleere Instanzen. Die Kehrseite: Pro vCPU-Stunde ist Fargate **teurer** als eine gut ausgelastete EC2-Instanz. Daraus folgt die Prüfungslogik:

- **Fargate gewinnt bei:** sporadischer/schwankender Last, kleinen Teams, „minimal operational overhead", vielen kleinen Services mit ungleichmäßiger Auslastung.
- **EC2-Launch-Type gewinnt bei:** hoher, gleichmäßiger **Dauerauslastung** (mit Savings Plans deutlich günstiger), **GPU**-Bedarf, **Instance-Store**-Anforderung oder wenn man an den Host ranmuss.

> **💡 Merksatz:** Fargate kauft dir **Betriebsaufwand mit Geld ab**. Sporadisch/klein/ops-arm → Fargate. Dauerlast/GPU/Host-Zugriff → EC2-Launch-Type.

### Was Fargate nicht kann — die Distraktor-Sammlung

Diese Einschränkungen sind bare Prüfungspunkte, weil sie ganze Antwortoptionen ungültig machen:
- **Kein DaemonSet** (in EKS) und **kein privilegierter Modus** — Monitoring-/Security-Agents, die als DaemonSet laufen sollen, scheitern hier. (Auch der EKS-**Pod-Identity-Agent** ist so ein DaemonSet → deshalb braucht Fargate **IRSA**.)
- **Kein Instance Store, kein GPU-Zugriff.**
- **Netzwerkmodus zwingend `awsvpc`** — jeder Task hat seine eigene ENI.
- **Ephemeral Storage: 20 GiB Default, konfigurierbar bis 200 GiB** — mehr braucht **EFS** (oder EBS-Attach). Der Klassiker „Container braucht 500 GB Arbeitsdaten" ist also keine Fargate-Storage-Frage, sondern eine EFS-Frage.

> **💡 Merksatz:** Fargate = **kein DaemonSet, kein privileged, kein Instance Store, kein GPU**, `awsvpc` Pflicht, Ephemeral 20 → max. 200 GiB (darüber: **EFS**).

### Fargate Spot: 70 % für Unterbrechbares

Analog zu EC2 Spot gibt es **Fargate Spot** — 🔴 **bis zu 70 % Rabatt** gegen dieselbe Bedingung: AWS kann den Task mit **2 Minuten Vorwarnung** zurückholen. Zwei Details, die geprüft werden: Fargate Spot gibt es **nur für ECS-Tasks, nicht für EKS-Pods**, und nur für Linux. Das Standardmuster ist die Mischung über **Capacity Provider**: ein Basis-Anteil auf `FARGATE` (garantiert) und der Aufwuchs auf `FARGATE_SPOT` (billig). Zusätzlich decken **Compute Savings Plans** auch Fargate ab (🔴 bis zu 50 %).

> **💡 Merksatz:** Unterbrechbare Container günstiger → **Fargate Spot** (🔴 bis zu 70 %, **nur ECS**, 2-Min-Warnung). Planbare Fargate-Dauerlast → **Compute Savings Plan**.

---

## ⚠️ Prüfungs-Knackpunkte

- „Container, minimaler operativer Aufwand, keine Server verwalten" → **Fargate** (Launch Type für ECS **und** EKS).
- Dauerhaft hohe Auslastung / GPU / Instance Store / Host-Zugriff → **EC2-Launch-Type** (mit Savings Plan günstiger).
- Fargate-Grenzen: **kein DaemonSet, kein privileged, kein Instance Store, kein GPU**; `awsvpc` Pflicht; Ephemeral Storage **20 GiB → max. 200 GiB**, darüber **EFS**.
- EKS auf Fargate: **IRSA statt Pod Identity** (kein DaemonSet möglich).
- **Fargate Spot**: 🔴 bis zu 70 %, **nur ECS**, 2-Minuten-Notice; Mischung über **Capacity Provider** (FARGATE + FARGATE_SPOT).
- Abrechnung: vCPU + Memory pro Sekunde, **Minimum 1 Minute**.

## 💡 Der eine Satz zum Mitnehmen

**Fargate ist der Tausch „Betriebsaufwand gegen Preis pro vCPU"** — er gewinnt jede Frage mit „minimal operational overhead" und verliert jede, in der Dauerauslastung, GPUs oder ein DaemonSet vorkommen.
