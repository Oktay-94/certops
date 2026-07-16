---
service: Amazon ECS (+ ECS Anywhere)
seedKey: saa-c03-script-ecs
batch: B3
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html
  - https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html
  - https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html
status: draft
---

# Amazon ECS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> ECS = **Amazons hauseigener Container-Dirigent**: einfacher als Kubernetes, tief in AWS integriert. **Task Definition** (Bauplan) → **Task** (laufender Container) → **Service** (hält die gewünschte Anzahl am Leben, hängt am Load Balancer) → **Cluster**. Zwei Launch Types: **EC2** (du verwaltest die Server) oder **Fargate** (serverless).

Der SAA testet drei Dinge gnadenlos: **die zwei IAM-Rollen (die meistverwechselte ECS-Frage), die Netzwerk-Modi — und ECS vs. EKS.**

---

## 🎯 SAA-Vertiefung

### Die zwei Rollen: Was der Container darf vs. was der Kellner darf

**Das Problem:** Ein Task startet nicht („cannot pull image from ECR"). Ein anderer läuft, aber die Anwendung bekommt „Access Denied" beim Schreiben nach S3. Zwei völlig verschiedene Ursachen — und beide sehen nach „IAM-Problem" aus.

**Die Lösung:** ECS hat **zwei** IAM-Rollen, und sie zu verwechseln ist der wohl häufigste ECS-Fehler:

- **Task Role** = was die **Anwendung im Container** darf: S3, DynamoDB, SQS, alles, was dein Code aufruft.
- **Task Execution Role** = was **ECS/Fargate selbst** braucht, um den Task überhaupt zu starten: das **Image aus ECR ziehen**, **CloudWatch-Logs** schreiben, **Secrets aus Secrets Manager/SSM injizieren**.

Bild dazu: Die **Execution Role ist der Kellner**, der dein Essen aus der Küche holt und den Tisch deckt; die **Task Role ist dein Besteck** — womit *du* dann isst. Ein hungriger Gast ohne Kellner bekommt nichts serviert (Image-Pull scheitert); ein Gast mit Kellner, aber ohne Besteck, sitzt vor vollem Teller (App-Zugriff scheitert).

Diagnose-Reflex für die Prüfung: **„Image kann nicht gepullt werden / keine Logs" → Execution Role. „App darf nicht auf S3/DynamoDB" → Task Role.**

> **💡 Merksatz:** **Execution Role = ECR-Pull + Logs + Secrets (der Kellner). Task Role = was die App darf (dein Besteck).**

### Netzwerk-Modi: Eine ENI pro Container

**Das Problem:** Zwei Container derselben App sollen auf einer EC2-Instanz laufen, beide auf Port 8080 — Konflikt. Und die Sicherheitsabteilung will pro Microservice eine eigene Security Group.

**Die Lösung:** Drei Netzwerk-Modi:
- **awsvpc:** Jeder Task bekommt eine **eigene ENI mit eigener VPC-IP und eigener Security Group** — Netzwerk-Isolation auf Task-Ebene, wie bei einer eigenen Instanz. **Pflicht bei Fargate** und die Antwort auf „Security Group pro Microservice".
- **bridge:** klassisches Docker-Bridge-Netz auf der Instanz; mit dem ALB und **dynamic port mapping** lösen sich Portkonflikte (der ALB findet den zufälligen Host-Port automatisch).
- **host:** der Container nutzt direkt den Netzwerk-Stack der Instanz (schnell, aber Portkonflikte garantiert).

> **💡 Merksatz:** Eigene IP/Security Group pro Task → **awsvpc** (Fargate-Pflicht). Mehrere Container derselben App auf einer Instanz → **bridge + dynamic port mapping** am ALB.

### Skalierung und Deployment

Zwei Ebenen, die gern vermischt werden: **Service Auto Scaling** skaliert die **Anzahl der Tasks** (nach CPU/Memory/Requests). **Cluster Capacity Provider** mit Managed Scaling skaliert die **darunterliegenden EC2-Instanzen** — bei Fargate entfällt diese Ebene komplett (das ist das eigentliche Fargate-Verkaufsargument).

Beim Ausrollen: **Rolling Update** ist der Standard; **Blue/Green über CodeDeploy** ist die Antwort auf „sofortiger Rollback / Canary-Test vor dem Umschalten". Für die Service-zu-Service-Kommunikation gibt es **Service Connect** (integriertes Service-Mesh-Light mit Namen, Retries, Metriken) — der modernere Nachfolger der reinen **Service Discovery** über Cloud Map. Und wenn jemand „ich muss mal in den laufenden Container schauen" sagt: **ECS Exec** (Shell ohne SSH auf der Instanz).

Randnotiz Hybrid: **ECS Anywhere** lässt ECS-Tasks auf **eigener On-Prem-Hardware** laufen (EXTERNAL launch type) — die Antwort auf „gleiche Orchestrierung im eigenen RZ, ohne Kubernetes einzuführen".

> **💡 Merksatz:** Tasks skalieren = **Service Auto Scaling**; Instanzen darunter = **Capacity Provider** (bei Fargate: gar nicht). Rollback/Canary → **Blue/Green via CodeDeploy**.

### ECS vs. EKS: Die Frage hinter der Frage

**Das Problem:** Beide orchestrieren Container. Wie entscheidet die Prüfung?

**Die Lösung:** Nicht über Features, sondern über **Kontext-Signalwörter**:
- „**Minimaler operativer Aufwand**, AWS-nativ, kein Kubernetes-Know-how im Team" → **ECS**.
- „**Bestehende Kubernetes-Workloads/-Skills**, Helm-Charts, Multi-Cloud-Portabilität, K8s-Ökosystem" → **EKS**.
- „Container ohne jedes Server-Management" → **Fargate** (als *Launch Type* unter ECS **oder** EKS — kein Konkurrent, sondern das Fundament).

> **💡 Merksatz:** ECS = **AWS-einfach**, EKS = **Kubernetes-kompatibel**. Fargate ist keine dritte Option, sondern der Boden, auf dem beide stehen können.

---

## ⚠️ Prüfungs-Knackpunkte

- **Task Role** (was die App darf) vs. **Task Execution Role** (ECR-Pull, CloudWatch-Logs, Secrets) — Image-Pull-Fehler ⇒ Execution Role; App-Zugriffsfehler ⇒ Task Role.
- **awsvpc** = eigene ENI/IP/Security Group pro Task (**Fargate-Pflicht**); **bridge + dynamic port mapping** löst Portkonflikte am ALB.
- **Service Auto Scaling** (Tasks) ≠ **Capacity Provider** (EC2-Instanzen darunter); Fargate hat die zweite Ebene nicht.
- Rollback/Canary → **Blue/Green via CodeDeploy**; Service-zu-Service → **Service Connect** (bzw. Cloud Map Service Discovery).
- Debugging im laufenden Container → **ECS Exec** (kein SSH nötig).
- On-Prem-Container mit ECS-Orchestrierung → **ECS Anywhere**.
- ECS vs. EKS: minimaler Overhead/AWS-nativ → **ECS**; Kubernetes-Skills/Portabilität → **EKS**.

## 💡 Der eine Satz zum Mitnehmen

**ECS ist die Container-Antwort für alle, die kein Kubernetes wollen** — und wenn eine ECS-Frage nach einem Fehler klingt, ist sie fast immer eine Frage nach der richtigen der beiden IAM-Rollen.
