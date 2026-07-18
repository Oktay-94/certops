---
nr: 2
title: "Battle Card 2 — ECS Fargate · ALB · ECR"
services: ["Amazon ECS", "AWS Fargate", "Application Load Balancer", "Amazon ECR"]
signalwords: ["Container ohne Server verwalten", "kein Cluster-Management", "kein EC2-Patching", "Docker in Produktion"]
domain: "Compute & Serverless"
assets: ["battle_card_2.png", "battle_card_2.pdf", "battle_card_2.svg"]
---

# Battle Card 2 — ECS Fargate · ALB · ECR

**Szenario:** Das Team **ShopFlow** hat seine Web-App als Docker-Container fertig und will sie in Produktion bringen. Es gibt keine Lust und keine Kapazität, EC2-Instanzen zu provisionieren, Betriebssysteme zu patchen oder eine Cluster-Kapazität zu planen — die Container sollen einfach laufen und automatisch mit der Last skalieren. Signalwörter: *„Container ohne Server verwalten", „kein Cluster-Management", „kein OS-Patching", „Docker in Produktion mit minimalem Ops-Aufwand"*.

## Ablauf

- **1 — HTTPS:** Der Nutzer erreicht die App über einen **Application Load Balancer**. Der ALB ist der öffentliche Eintrittspunkt (Layer 7, HTTP/HTTPS) und terminiert TLS. Design-Entscheidung: Der ALB entkoppelt Clients von den einzelnen Container-Instanzen — die dürfen kommen und gehen, ohne dass sich die öffentliche Adresse ändert.
- **2 — Routing:** Der ALB verteilt Requests auf die **Fargate Tasks** in seiner Target Group. Jeder gesunde Task ist ein Ziel; fällt einer aus oder kommt ein neuer hinzu (Scaling), aktualisiert ECS die Target Group automatisch. So bleibt Load Balancing korrekt, ohne manuelle Pflege.
- **3 — Image-Pull:** Beim Start zieht jeder Task sein Container-Image aus **Amazon ECR** (privates Registry). ECR ist die Quelle der Wahrheit fürs Image; die Task-Definition verweist per Image-URI darauf. Ohne Image kein Task — deshalb ist ECR Teil jeder Fargate-Architektur.

**Kernpunkt der Karte (die grüne Fläche):** Bei **Fargate** managt AWS die komplette Compute-Ebene — keine EC2-Instanzen, keine AMIs, kein Kernel-/Host-Patching, kein Cluster-Capacity-Management. ShopFlow definiert nur CPU/RAM pro Task und die Task-Zahl; alles darunter ist unsichtbar.

## Prüfungs-Kernsatz

**ECS = Orchestrator, Fargate = serverless Launch-Type. „Container in Produktion, aber keine Server/Instanzen verwalten" = ECS auf Fargate; Image aus ECR, ALB davor.**

## Klassiker-Fallen

1. **ECS ≠ Fargate:** Fargate ist kein eigener Service neben ECS, sondern **ein Launch-Type von ECS** (Alternative: EC2-Launch-Type). Prüfungsfrage-Falle: „Welcher Service ersetzt ECS durch Fargate?" — falsch gestellt; Fargate läuft *innerhalb* von ECS (und EKS).
2. **Fargate vs. EC2-Launch-Type:** „kein Infrastruktur-Management / variabler Workload" → Fargate. „volle Kontrolle über Instanztyp, GPU, günstiger bei hoher konstanter Auslastung" → EC2-Launch-Type. Das Signalwort ist meist *operational overhead* vs. *control/cost at scale*.
3. **Fargate vs. Lambda:** Beide serverless. Lambda = kurzlebig, event-/request-getrieben, Null-Grundlast (Karte 1). Fargate = langlaufende Container/Services, eigene Runtime, kein 15-Min-Limit. „Bestehender Docker-Container / Long-running Web-Service" → Fargate, nicht Lambda.
4. **awsvpc + IP-Verbrauch:** Jeder Fargate-Task bekommt eine eigene ENI und damit eine eigene IP aus dem Subnetz. Bei sehr großen Task-Zahlen wird die **Subnetz-Größe** zum Engpass — eine gern getestete Nebenwirkung.
