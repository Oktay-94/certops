---
service: Amazon ECR
seedKey: saa-c03-script-ecr
batch: B3
domains: [D1, D4]
sourceRef:
  - https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html
  - https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-scanning.html
status: draft
---

# Amazon ECR

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> ECR = **die private Container-Bibliothek** von AWS: Docker-Images werden hier abgelegt, versioniert (Tags) und von ECS, EKS, Fargate, Lambda oder App-Servern gezogen. Das AWS-eigene Gegenstück zu Docker Hub — nur privat, IAM-geschützt und in der eigenen Region.

Kurzes Skript — der SAA prüft ECR vor allem als **Sicherheits- und Kostenbaustein** rundherum.

---

## 🎯 SAA-Vertiefung

### Sicherheit: Wer darf ziehen, und ist das Image sauber?

**Das Problem:** Ein Task startet nicht („cannot pull image"). Oder: Ein Audit fragt, ob in den Produktions-Images bekannte CVEs stecken.

**Die Lösung:**
- **Zugriff läuft über IAM**, nicht über Passwörter: ECS/Fargate ziehen das Image mit der **Task Execution Role** (siehe ECS-Skript — der Pull-Fehler ist fast immer diese Rolle). **Repository Policies** regeln zusätzlich **Cross-Account-Zugriff** (der Shared-Services-Account hostet die Images, Prod-Accounts dürfen ziehen).
- **Image Scanning:** ECR scannt Images auf bekannte Schwachstellen — **Basic** (on-push, kostenlos) und **Enhanced** über **Amazon Inspector** (kontinuierlich, auch OS- und Sprachpakete). Signalwort „Container-Images fortlaufend auf CVEs prüfen" → **Enhanced Scanning / Inspector**.
- **Verschlüsselung at rest** (KMS) und **Tag Immutability**: verhindert, dass jemand `:latest` oder `:v1.2` heimlich überschreibt — die Antwort auf „nachvollziehbare, unveränderliche Deployments".

> **💡 Merksatz:** Pull-Fehler → **Task Execution Role**. Cross-Account-Images → **Repository Policy**. CVE-Prüfung → **Enhanced Scanning (Inspector)**. Überschreiben verhindern → **Tag Immutability**.

### Kosten und Netzwerk: Zwei kleine, gern geprüfte Details

- **Lifecycle Policies** räumen alte, ungetaggte Images automatisch weg — sonst wächst das Repository (und die Rechnung) unbegrenzt. Dieselbe Denke wie S3-Lifecycle.
- **VPC Interface Endpoints (PrivateLink) für ECR:** Tasks in **privaten Subnetzen** können Images ziehen, **ohne NAT Gateway** — Kosten- und Sicherheitsgewinn. Achtung, Detailfalle: Man braucht **zwei** ECR-Endpoints (`ecr.api` und `ecr.dkr`) **plus einen S3-Gateway-Endpoint**, weil die eigentlichen Image-Layer aus S3 kommen. „Fargate-Task im privaten Subnetz kann kein Image ziehen" ist deshalb fast immer eine Endpoint-/NAT-Frage.
- **Cross-Region Replication** hält Images für Multi-Region-Deployments lokal vor (schnellere Pulls, weniger Transferkosten).

> **💡 Merksatz:** Privates Subnetz ohne NAT → **ECR Interface Endpoints (api + dkr) + S3 Gateway Endpoint**. Repository wächst endlos → **Lifecycle Policy**.

---

## ⚠️ Prüfungs-Knackpunkte

- Image-Pull-Fehler in ECS/Fargate → **Task Execution Role** (nicht Task Role).
- Images accountübergreifend teilen → **Repository Policy** (Shared-Services-Account-Muster).
- CVE-Scanning: **Basic** (on-push) vs. **Enhanced/Inspector** (kontinuierlich, tiefer).
- Unveränderliche Deployments → **Tag Immutability**; Aufräumen → **Lifecycle Policy**.
- Pull aus privatem Subnetz ohne NAT → **ECR Interface Endpoints (ecr.api + ecr.dkr) + S3 Gateway Endpoint**.
- Multi-Region → **Cross-Region Replication**.

## 💡 Der eine Satz zum Mitnehmen

**ECR selbst ist simpel — geprüft wird immer das Drumherum: die richtige IAM-Rolle beim Pull, der Weg aus dem privaten Subnetz und die Frage, ob jemand die Images gescannt hat.**
