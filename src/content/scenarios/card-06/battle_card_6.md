---
nr: 6
title: "EKS · Karpenter · Spot — Kubernetes kostenoptimal skalieren"
services:
  - Amazon EKS
  - Karpenter
  - EC2 Spot
  - EC2 On-Demand
  - EventBridge
  - SQS
  - Cluster Autoscaler (Abgrenzung)
signalwords:
  - kostenoptimal
  - unkritische / stateless Pods auf Spot
  - Nodes automatisch skalieren
  - Pods bleiben Pending
  - richtig dimensionierte Nodes
domain: "D4 (Design Cost-Optimized) — primär · D3 (High-Performing) Compute"
assets:
  - battle_card_6.svg
  - battle_card_6.png
  - battle_card_6.pdf
status_note: "Karpenter v1.x (CNCF); AWS nutzt Karpenter als Default-Engine in EKS Auto Mode (seit Ende 2024). Faktencheck 17.07.2026."
---

## Szenario

Eine Streaming-Plattform betreibt ihre Microservices auf **Amazon EKS**. Die
Rechnung explodiert, weil Nodes halb leer laufen. Die kritischen API- und
stateful Pods müssen **stabil** laufen, die vielen **unkritischen, stateless**
Batch-/Transcoding-Pods dürfen jederzeit unterbrochen werden. Gesucht ist eine
Lösung, die bei **Pending Pods** automatisch **richtig dimensionierte** Nodes
nachschiebt, unkritische Last auf **Spot** kostenoptimal fährt und leere Nodes
wieder abräumt.

## Ablauf

1. **Developer deployt** die Workload (`kubectl apply`). Der kube-scheduler
   findet keine freie Kapazität — die neuen Pods bleiben **Pending**. Pending
   ist das Trigger-Signal für jeden Node-Autoscaler.
2. **Karpenter beobachtet** die Pending Pods direkt über die Kubernetes-API und
   liest ihre echten Anforderungen (CPU/Memory, Taints, Affinity). Anders als
   der Cluster Autoscaler denkt Karpenter **nicht in vordefinierten Node
   Groups**, sondern pro Pod.
3. **Provision On-Demand:** Für die kritischen/stateful Pods startet Karpenter
   Nodes aus dem **On-Demand NodePool** — Stabilität vor Preis.
4. **Provision Spot:** Für die unkritischen/stateless Pods startet Karpenter
   Nodes aus dem **Spot NodePool**. Karpenter wählt aus ~100 Instanz-Typen die
   günstigste passende und fällt bei fehlender Spot-Kapazität automatisch auf
   On-Demand zurück (**On-Demand-Fallback**).
5. **Spot-Interruption:** EC2 kündigt eine Spot-Node ~2 Minuten vorher. Eine
   **EventBridge Rule** fängt das Event, legt es in die **SQS Interruption
   Queue**.
6. **Ersatz:** Karpenter liest die Queue, **cordon + drain** die betroffene
   Node und startet rechtzeitig eine Ersatz-Node — die Pods wandern um, ohne
   dass Last verloren geht.

Zusätzlich (nicht als Pfeil gezeichnet, im Merksatz benannt):
**Consolidation** — sinkt die Auslastung, packt Karpenter Pods auf weniger
Nodes und terminiert die leeren.

## Prüfungs-Kernsatz

**Karpenter provisioniert EC2-Nodes direkt aus Pending Pods — kein Node-Group-
Denken; Cluster Autoscaler skaliert nur vordefinierte ASGs.**

## Klassiker-Fallen

- **Karpenter vs. Cluster Autoscaler:** CAS skaliert **bestehende Node Groups
  (ASGs)** und ist an deren Instanz-Typen gebunden; Karpenter startet passgenaue
  Instanzen just-in-time, konsolidiert aktiv und ist schneller. Auf einem
  Cluster fährt man **entweder / oder** — beide gleichzeitig kollidieren.
- **Spot ist nicht „einfach an":** Für sauberes Spot-Handling braucht Karpenter
  eine **SQS-Queue + EventBridge-Rule** für die Interruption Notices. Ohne das
  reagiert der Cluster erst, wenn die Node schon weg ist.
- **Nicht alles auf Spot:** stateful/kritische Pods gehören in den **On-Demand
  NodePool**. Die Kunst ist die Trennung per NodePool + nodeAffinity, nicht
  „alles Spot".
- **Fargate ≠ Antwort hier:** EKS-on-Fargate nimmt dir Nodes ganz ab, kann aber
  **kein Spot** und keine GPU — bei „Spot-Kostenoptimierung mit Node-Kontrolle"
  ist Karpenter gemeint.
