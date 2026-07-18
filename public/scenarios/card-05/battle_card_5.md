---
nr: 5
title: "Battle Card 5 — AWS App Runner · ECR"
services: ["AWS App Runner", "Amazon ECR", "Amazon ECS Express Mode"]
signalwords: ["ohne VPC/ALB/Scaling anfassen", "einfachster Container-Deploy", "kleines Team, kein DevOps", "Image rein, HTTPS-URL raus"]
domains: [D3]
status_note: "App Runner ab 30.04.2026 Maintenance Mode (keine Neukunden); Migrationspfad ECS Express Mode."
assets: ["battle_card_5.png", "battle_card_5.pdf", "battle_card_5.svg"]
---

# Battle Card 5 — AWS App Runner · ECR

**Szenario:** Ein kleines Team hat ein fertiges Container-Image und will einen Webservice live bringen — **ohne** VPC einzurichten, einen ALB zu konfigurieren, Auto-Scaling-Gruppen zu definieren oder Task-Definitionen zu schreiben. Es soll heißen: Image rein, HTTPS-URL raus. Signalwörter: *„einfachster Weg", „kein DevOps/kein Infra-Setup", „nur Container deployen", „ohne ALB/VPC/Scaling"*.

## Ablauf

- **1 — Image ziehen:** App Runner nimmt ein Image aus **Amazon ECR** (oder direkt ein Quell-Repo) und baut daraus einen Service. Kein Cluster, keine Task-Definition nötig — man zeigt nur auf das Image.
- **2 — HTTPS-URL:** App Runner erledigt intern alles: Load Balancing, HTTPS-Endpunkt, TLS-Zertifikat, Auto Scaling (inkl. scale-to-zero), Deploy/CI-CD und CloudWatch-Logs. Nutzer erreichen den Dienst über eine fertige `*.awsapprunner.com`-URL — ohne dass das Team je VPC, ALB oder Scaling angefasst hat.

**Kern der Karte:** App Runner ist die *höchste Abstraktionsebene* für Container auf AWS — im Kern ein dünner Wrapper um ECS Fargate, der die ganze Umgebung (VPC, ALB, IAM-Rollen, Scaling) auf dem „Happy Path" versteckt.

## ⚠ Aktueller Service-Status (Stand 2026)

Wichtig für ehrliches Verständnis — **nicht als harte Prüfungszahl lernen**: App Runner geht laut offizieller AWS-Doku in den **Maintenance Mode**. Ab **30.04.2026 keine Neukunden** mehr; Bestandskunden nutzen weiter (inkl. neuer Ressourcen), aber es kommen **keine neuen Features**. Empfohlener Migrationspfad: **Amazon ECS Express Mode** — behält App Runners Einfachheit, gibt aber Zugriff auf den vollen ECS-Funktionsumfang. Fürs Examen bleibt das **Konzept** „Container → HTTPS-Endpunkt ohne Infrastrukturarbeit" relevant; bei einem Neu-Design ist heute ECS Express Mode die aktuelle Antwort.

## Prüfungs-Kernsatz

**App Runner = einfachster Weg, einen Container-Webservice zu betreiben: Image rein, HTTPS-URL raus, kein VPC/ALB/Scaling. Bei Neubau heute → ECS Express Mode.**

## Klassiker-Fallen

1. **App Runner vs. ECS Fargate:** „maximale Einfachheit, kein Infra-Management, kleines Team" → App Runner (bzw. heute ECS Express Mode). „Feingranulare Kontrolle über Netzwerk/VPC/IAM, Batch- oder Nicht-Web-Workloads, tiefe AWS-Integration" → ECS Fargate. Der Hebel ist *Einfachheit vs. Kontrolle*.
2. **App Runner vs. Lambda:** Beide serverless und scale-to-zero-fähig. Lambda = event-/request-getriebene Funktionen mit 15-Min-Limit (Karte 1). App Runner = dauerhaft laufender HTTP-Webservice aus einem Container. „langlebiger Webservice aus vorhandenem Docker-Image" → App Runner, nicht Lambda.
3. **App Runner vs. Elastic Beanstalk:** Beide „einfach deployen". App Runner ist container-first und noch stärker abstrahiert; Beanstalk provisioniert klassisch EC2 im Hintergrund (Karte für Beanstalk kommt separat). „Container ohne jegliche Infra-Sicht" → App Runner.
4. **Blueprint ≠ Realstand (Content-Regel):** Der Maintenance-Mode-Status kann in aktuellen Prüfungsfragen noch nicht abgebildet sein. Das *Prinzip* der Abstraktionsebene bleibt testbar; die Neukunden-Sperre ist Kontextwissen, keine auswendig zu testende Prüfungszahl.
