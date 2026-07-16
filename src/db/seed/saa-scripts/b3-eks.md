---
service: Amazon EKS (+ EKS Anywhere / Distro / Hybrid Nodes)
seedKey: saa-c03-script-eks
batch: B3
domains: [D1, D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/blogs/containers/amazon-eks-pod-identity-a-new-way-for-applications-on-eks-to-obtain-iam-credentials/
  - https://aws.amazon.com/about-aws/whats-new/2024/12/amazon-eks-auto-mode/
  - https://aws.amazon.com/blogs/containers/amazon-eks-extended-support-for-kubernetes-versions-pricing/
status: draft
---

# Amazon EKS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EKS = **managed Kubernetes**: AWS betreibt die Control Plane (Master Nodes), du bringst die Workloads. Der Weg für Teams mit K8s-Erfahrung, bestehenden Helm-Charts oder Multi-Cloud-Anspruch. Worker laufen auf EC2 oder Fargate.

Der SAA fragt: **Wie kommt ein Pod an IAM-Rechte (und was ist an Pod Identity neu)? Welche Compute-Option? Und wo liegt die versteckte Kostenfalle?**

---

## 🎯 SAA-Vertiefung

### Wie ein Pod an AWS-Rechte kommt: IRSA vs. Pod Identity

**Das Problem:** Ein Pod soll auf einen S3-Bucket zugreifen. Der bequeme Weg wäre, der **Node-Rolle** die S3-Rechte zu geben — nur bekommt dann **jeder Pod auf diesem Node** dieselben Rechte. Das ist das Kubernetes-Äquivalent zum Generalschlüssel für alle Mieter.

**Die Lösung:** Rechte gehören an den **Service Account des Pods**, nicht an den Node. Dafür gibt es zwei Verfahren — und die Prüfung testet den Unterschied:

- **IRSA (IAM Roles for Service Accounts, seit 2019):** Der Cluster bekommt einen **OIDC-Provider**, und die IAM-Rolle vertraut diesem Provider über eine Trust Policy. Funktioniert überall (auch EKS Anywhere, self-managed K8s) — aber: pro Cluster ein OIDC-Provider, Trust Policies wachsen, IAM-Admin muss bei jedem neuen Service Account ran.
- 🛑 **EKS Pod Identity (seit Ende 2023):** kein OIDC mehr, sondern eine einfache **Association über die EKS-API**. Dieselbe IAM-Rolle ist **über Cluster hinweg wiederverwendbar**, ohne die Trust Policy anzufassen; Session Tags ermöglichen ABAC. Braucht den **Pod Identity Agent** (ein DaemonSet auf EC2-Nodes).

Die Nuance, die den Punkt bringt: **Pod Identity läuft nicht auf Fargate** (dort gibt es kein DaemonSet) und nicht auf Windows-Nodes — **für Fargate-Pods bleibt IRSA die Antwort.** Beide Verfahren koexistieren, IRSA ist nicht abgekündigt.

> **💡 Merksatz:** Pod braucht IAM-Rechte → **niemals die Node-Rolle** (Generalschlüssel). Neu und einfach auf EC2-Nodes → **Pod Identity**; **auf Fargate → IRSA**.

### Die Compute-Frage: Von „alles selbst" bis „gar nichts mehr"

**Das Problem:** Ein Team will Kubernetes, aber niemand will Nodes patchen, dimensionieren und skalieren.

**Die Lösung — vier Stufen mit sinkendem Aufwand:**
1. **Self-Managed Nodes:** volle Kontrolle, volle Verantwortung (eigene AMIs, eigenes Patching).
2. **Managed Node Groups:** AWS übernimmt den EC2-Lebenszyklus (Provisioning, Updates, Draining).
3. **Fargate-Profile:** Pods laufen serverless, ganz ohne Nodes — kein Patching, aber die Fargate-Einschränkungen (kein DaemonSet, kein privilegierter Modus).
4. 🛑 **EKS Auto Mode** (GA 12/2024): AWS wählt und skaliert die Instanzen selbst, patcht das OS und betreibt die Kern-Add-ons (Karpenter, ALB Controller, EBS CSI, CoreDNS, VPC CNI) gleich mit. Die neue Antwort auf „Kubernetes mit **minimalem operativem Aufwand**, aber ohne Fargate-Einschränkungen".

Dazu der Node-Scheduler: **Karpenter** (an die CNCF gespendet, Basis von Auto Mode) wählt für wartende Pods **passgenau** die günstigste Instanz — schneller und kosteneffizienter als der klassische **Cluster Autoscaler**, der nur bestehende ASGs vergrößert. Signalwort: „Nodes passgenau und kostenoptimiert bereitstellen" → **Karpenter**.

Für Hybrid: 🛑 **EKS Hybrid Nodes** (2024) hängen **On-Prem-Server als Worker Nodes** an einen Cloud-EKS-Cluster. **EKS Anywhere** ist dagegen ein *vollständiger* K8s-Cluster im eigenen RZ, und **EKS Distro** ist nur die Open-Source-Distribution, die du selbst betreiben kannst.

> **💡 Merksatz:** Kubernetes mit minimalem Aufwand → 🛑 **EKS Auto Mode**; passgenaue Node-Bereitstellung → **Karpenter**; On-Prem-Nodes am Cloud-Cluster → **Hybrid Nodes**; eigener Cluster on-prem → **EKS Anywhere**.

### Die versteckte Kostenfalle: Extended Support

**Das Problem:** „Wir sind bei Kubernetes-Version X geblieben, das Upgrade hat keine Priorität." Zwei Monate später ist die EKS-Rechnung explodiert — ohne dass ein einziger Pod dazugekommen wäre.

**Die Lösung:** Die EKS-Control-Plane kostet **$0,10 pro Cluster und Stunde** — **aber nur im Standard Support** (grob 14 Monate pro K8s-Version). Danach rutscht der Cluster in den **Extended Support**, und der kostet 🛑 **$0,60 pro Cluster und Stunde — das Sechsfache**. Bei vielen Clustern wird das schnell vierstellig im Monat. Die richtige Antwort auf „EKS-Kosten unerwartet gestiegen, keine Workload-Änderung" ist deshalb: **Kubernetes-Version aktualisieren** (Extended Support verlassen) — nicht „Instanzen verkleinern".

Und noch eine Kosten-Fußnote zum Merken: **Savings Plans decken die EC2-Worker-Nodes ab, aber nicht die EKS-Control-Plane-Gebühr.**

> **💡 Merksatz:** 🛑 **Extended Support = 6× teurer** ($0,60 statt $0,10 pro Cluster/h) — die häufigste unerkannte EKS-Kostenfalle. Savings Plans decken nur die Nodes, nie die Control Plane.

---

## ⚠️ Prüfungs-Knackpunkte

- Pod braucht IAM-Rechte → **Pod Identity** (modern, EC2-Nodes) oder **IRSA**; **auf Fargate zwingend IRSA**; Node-Rolle = Anti-Pattern (Rechte für alle Pods).
- Compute-Stufen: Self-Managed → Managed Node Groups → Fargate-Profile → 🛑 **EKS Auto Mode** (minimalster Aufwand, GA 12/2024).
- **Karpenter** = passgenaues, kostenoptimiertes Node-Provisioning (schlägt Cluster Autoscaler); Grundlage von Auto Mode.
- Hybrid: **EKS Hybrid Nodes** (on-prem Nodes am Cloud-Cluster) vs. **EKS Anywhere** (kompletter Cluster on-prem) vs. **EKS Distro** (nur die Distribution).
- 🛑 **Extended Support: $0,60/Cluster/h statt $0,10** — Kostenanstieg ohne Workload-Änderung ⇒ K8s-Version upgraden.
- Savings Plans decken **Worker-Nodes**, nicht die Control-Plane-Gebühr.
- EKS vs. ECS: bestehende K8s-Skills/Helm/Multi-Cloud → **EKS**; minimaler Overhead/AWS-nativ → **ECS**.

## 💡 Der eine Satz zum Mitnehmen

**EKS ist Kubernetes ohne Master-Betrieb — und seine Prüfungsfragen drehen sich fast immer um drei Dinge: wie der Pod an IAM-Rechte kommt, wie wenig Node-Arbeit man haben will, und dass eine veraltete K8s-Version die Rechnung versechsfacht.**
