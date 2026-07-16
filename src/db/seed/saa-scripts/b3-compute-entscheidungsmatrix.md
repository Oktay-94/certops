---
service: Compute-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-compute-decision-matrix
batch: B3
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/aws-overview/compute-services.html
status: draft
---

# Compute-Entscheidungsmatrix

## 📋 Einordnung

> Dieses Skript ist **kein Dienst, sondern das Nadelöhr**: In fast jeder SAA-Frage geht es nicht darum, *was* Lambda kann, sondern darum, **welchen der sieben Compute-Dienste das Szenario meint** — und woran man das erkennt. Wer diese Matrix beherrscht, eliminiert in Sekunden zwei bis drei Antwortoptionen.

---

## 🎯 Die vier Fragen, die jede Compute-Frage entscheiden

### Frage 1: Wie lange läuft die Arbeit?

Die härteste, schnellste Filterregel überhaupt:
- **Millisekunden bis 15 Minuten, ereignisgetrieben** → **Lambda**.
- **Länger als 15 Minuten** → **Lambda ist raus.** Endlicher Job → **AWS Batch** oder **Fargate-Task**; dauerhaft laufender Service → **ECS/EKS/EC2**.

Der Distraktor, auf den viele hereinfallen: „Job in mehrere Lambdas aufteilen und mit Step Functions verketten." Das ist technisch möglich, aber wenn das Szenario einen zusammenhängenden Rechenjob beschreibt, ist es **künstliche Komplexität** — und damit die schlechtere Antwort.

> **💡 Merksatz:** **15 Minuten** ist die Wasserscheide der gesamten Compute-Domäne.

### Frage 2: Wie viel Betrieb darf es sein? (Die Kontroll-Achse)

Von „ich baue alles" bis „ich sehe nichts":

**EC2** → **Beanstalk** → **ECS/EKS auf EC2** → **Fargate** → **Lambda**

Signalwörter am Kipppunkt:
- „**Minimal operational overhead**", „kein Server-Management" → nach rechts (Fargate/Lambda).
- „Wir brauchen **Zugriff auf das Betriebssystem**", „spezielle Kernel-Module", „GPU", „Instance Store" → nach links (EC2).
- „Nur Code hochladen, aber **Server sichtbar behalten**" → **Beanstalk** (der einzige Dienst, der genau das anbietet).

> **💡 Merksatz:** „minimal operational overhead" ist das meistgenutzte Signalwort der Prüfung — es zeigt **immer** nach rechts auf der Kontroll-Achse.

### Frage 3: Container — und wenn ja, welcher Dirigent?

- Container, **AWS-nativ, einfach**, kein K8s-Wissen → **ECS**.
- Container, **bestehende Kubernetes-Skills / Helm / Multi-Cloud-Portabilität** → **EKS**.
- Und darunter: **Fargate** (keine Nodes) vs. **EC2-Launch-Type** (Dauerlast, GPU, Instance Store, günstiger bei hoher Auslastung).

Wichtig: **Fargate ist keine dritte Orchestrierung**, sondern das Fundament unter ECS *oder* EKS. Wer „ECS vs. EKS vs. Fargate" als Dreikampf liest, hat die Frage falsch verstanden.

> **💡 Merksatz:** **ECS oder EKS** beantwortet „wer dirigiert?" · **Fargate oder EC2** beantwortet „wer stellt die Bühne?".

### Frage 4: Wie soll bezahlt werden? (Domain 4)

| Das Szenario sagt … | Antwort |
|---|---|
| Unvorhersehbar, kurz, Test | **On-Demand** |
| Stabile Dauerlast, eine Familie/Region, 1–3 Jahre | **EC2 Instance SP** / **Standard RI** (🔴 bis zu 72 %) |
| Dauerlast, aber flexibel — **inkl. Fargate & Lambda** | **Compute Savings Plan** (🔴 bis zu 66 %) |
| Fault-tolerant, unterbrechbar | **Spot** (🔴 bis zu 90 %) — bei Batch fast immer die Antwort |
| **BYOL** / socket-basierte Lizenz / Compliance | **Dedicated Host** |
| Garantierte **Kapazität** in einer AZ | **ODCR** oder **zonale RI** — Savings Plans reservieren **nichts** |

> **💡 Merksatz:** Savings Plans sparen **Geld**, reservieren aber **keine Kapazität** — und nur der **Compute** SP deckt Fargate und Lambda.

---

## 🎯 Die Gesamtmatrix

| Das Szenario beschreibt … | Antwort |
|---|---|
| Ereignisgetrieben, kurz (< 15 min), kein Server | **Lambda** |
| Container, kein Node-Management, sporadische Last | **Fargate** (unter ECS/EKS) |
| Container, AWS-nativ, kein Kubernetes-Know-how | **ECS** |
| Container, Kubernetes-Skills/Helm/Multi-Cloud | **EKS** (minimalster Aufwand: **Auto Mode**) |
| Viele unabhängige, lange Rechenjobs, kostenoptimiert | **AWS Batch** (auf Spot) |
| Abhängige Schritte, Verzweigungen, Fehlerbehandlung | **Step Functions** (orchestriert die anderen) |
| Code hochladen, Infra automatisch, **Server sichtbar** | **Elastic Beanstalk** |
| Volle Kontrolle, OS-Zugriff, GPU, Legacy, Lizenzbindung | **EC2** |
| Elastische EC2-Flotte, self-healing, HA über AZs | **EC2 + ASG + ELB** |
| Latenz in einer Metropolregion | **Local Zone** |
| 5G/mobile Ultra-Low-Latency | **Wavelength** |
| AWS-Dienste im eigenen RZ, Data Residency | **Outposts** |
| vSphere-VMs ohne Umbau übernehmen | **VMware Cloud on AWS / Amazon EVS** (🛑 Vertrieb via Broadcom) |
| VMs nach AWS als echte EC2 überführen | **MGN** |

---

## ⚠️ Die zehn häufigsten Fehlgriffe

1. **Lambda für Jobs über 15 Minuten** → Batch/Fargate.
2. **„CPU erhöhen" bei Lambda** → es gibt nur den **Memory**-Regler (CPU skaliert mit).
3. **EC2-Health-Check** statt **ELB-Health-Check**, wenn die *App* stirbt.
4. **Launch Configuration** statt **Launch Template** (🛑 deprecated).
5. **Spot für Datenbanken/kritische Dauerdienste** — Spot ist nur für Unterbrechbares.
6. **Savings Plan als Kapazitätsgarantie** — er garantiert nur den Preis (→ **ODCR**).
7. **Task Role und Task Execution Role verwechseln** (ECR-Pull-Fehler = Execution Role).
8. **Node-Rolle für Pod-Rechte** in EKS → **Pod Identity** (bzw. **IRSA** auf Fargate).
9. **Beanstalk-eigene RDS** — stirbt mit der Umgebung.
10. **Lambda in der VPC ohne NAT/VPC Endpoint** — dann kein Internet.

## 💡 Der eine Satz zum Mitnehmen

**Jede Compute-Frage lässt sich auf vier Filter reduzieren: Wie lange läuft es (15-Minuten-Grenze)? Wie viel Betrieb ist erlaubt (Kontroll-Achse)? Welcher Container-Dirigent (ECS/EKS) auf welcher Bühne (Fargate/EC2)? Und wie wird bezahlt (Spot/SP/RI/Dedicated)?**
