# AWS Master-Lernskript — CLF-C02 & SAA-C03

**Die komplette AWS-Service-Landschaft (172 Dienste) im einheitlichen Lernschema — von den Core-Diensten bis zu den Nischen-Tools, mit allen prüfungsrelevanten Abgrenzungen.**

Dieses Skript entstand aus deinen strukturierten AWS-Lernnotizen und ist nach **fachlichen Domänen** in 13 Kapitel gegliedert (nicht nach der ursprünglichen Kartennummer). Jeder Dienst folgt demselben Schema: **Metapher/Konzept → Das Problem & Die Lösung → Abgrenzungen → ⚠️ Prüfungs-Knackpunkte**.

---

## Konvention (gilt im gesamten Skript)

- **Normaler Text / Blockquote** = dein **Originalinhalt, wortgetreu erhalten** (jede Metapher, jedes Problem/Lösung-Paar, jeder Prüfungs-Knackpunkt und Merksatz).
- **🛑-markiert** = **faktengeprüfte Ergänzung** (aktuelle CLF-C02-/SAA-C03-Traps, Deprecations, Namensänderungen, SAA-Vertiefungen). Jede 🛑-Aktualität ist per Web-Recherche verifiziert.

> **Grundprinzip: Zero Data Loss.** Nichts aus deinen Notizen wurde gekürzt oder zusammengefasst — nur ergänzt und angereichert.

---

## Inhaltsverzeichnis

1. **Grundlagen & Cloud-Konzepte** — Cloud-Modelle, Regionen/AZs, Shared Responsibility, Well-Architected-Grundlagen
2. **Compute, Container & Edge** — EC2, Lambda, ECS/EKS/Fargate, Auto Scaling, Load Balancing, Edge-Compute
3. **Storage** — S3 (+ Storage-Klassen), EBS, EFS, FSx, Storage Gateway
4. **Datenbanken** — RDS, Aurora, DynamoDB, ElastiCache, Redshift, Spezialdatenbanken
5. **Netzwerk & Content Delivery** — VPC, Subnetze, Route 53, CloudFront, Direct Connect, Global Accelerator
6. **Sicherheit, Identität & Compliance** — IAM, KMS, Cognito, GuardDuty, Shield, WAF, Inspector, Macie u. v. m.
7. **Analytik** — Athena, Glue, EMR, Kinesis, OpenSearch, QuickSight, Lake Formation, MSK, DataZone
8. **Machine Learning & KI** — Bedrock, SageMaker, die fertigen KI-Dienste (Rekognition, Comprehend, Kendra …)
9. **Anwendungsintegration** — SQS, SNS, EventBridge, Step Functions, API Gateway, Amazon MQ, AppFlow
10. **Entwickler-Tools & DevOps** — CloudFormation, CDK, die Code-Familie (CI/CD), Q Developer, X-Ray
11. **Migration & Disaster Recovery** — DMS, MGN, Snow Family, DRS, DR-Strategien (RTO/RPO), Resilience Hub
12. **Management, Governance & Kosten** — CloudWatch, CloudTrail, Config, Systems Manager, Cost Explorer, Budgets …
13. **Front-End, End-User & Business Apps** — Amplify, AppSync, SES, Connect, WorkSpaces, AppStream

---

## 🛑 Konsolidierte Aktualitäts-Übersicht (Stand: Juli 2026, web-verifiziert)

Diese Dienste sind in deinen Notizen enthalten und **weiterhin prüfungsrelevant** (CLF-C02/SAA-C03), aber praktisch im Umbruch. Für die Prüfung normal mitlernen — für echte Projekte (CertOps!) beachten:

**Abgekündigt / für Neukunden geschlossen:**
- **Amazon QLDB** — End of Support 31.07.2025 → Nachfolger **Amazon Aurora PostgreSQL** *(Kap. 4)*
- **AWS CodeCommit** — Neukunden-Stopp 25.07.2024 → **GitHub/GitLab** *(Kap. 10)*
- **AWS CodeStar** — End of Support 31.07.2024 *(Kap. 10)*
- **Amazon CodeCatalyst** — Maintenance seit Nov 2025, keine Neukunden *(Kap. 10)*
- **AWS Cloud9** — Neukunden-Stopp 25.07.2024 → **IDE Toolkits / CloudShell / VS Code** *(Kap. 10)*
- **Amazon Q Developer** — IDE-Plugins/Subscriptions End of Support 30.04.2027 → **Kiro** (spec-driven IDE); neue Signups seit 15.05.2026 blockiert *(Kap. 8 & 10)*
- **Amazon Forecast** — Neukunden-Stopp 30.07.2024 → **SageMaker Canvas** *(Kap. 8)*
- **Amazon Pinpoint** — End of Support 30.10.2026; Marketing-Layer → **Amazon Connect**, Messaging → **AWS End User Messaging**, E-Mail → **SES** *(Kap. 13)*
- **AWS Snowmobile** — eingestellt; **Snowball Edge Compute/Storage Optimized** in Maintenance seit Nov 2025 (Neuprojekte: DataSync erwägen) *(Kap. 11)*

**Namens-/Produktänderungen (Konzept unverändert):**
- **Kinesis Data Firehose** → **Amazon Data Firehose** (2024) *(Kap. 7)*
- **Kinesis Data Analytics** → **Amazon Managed Service for Apache Flink** (2023) *(Kap. 7)*
- **AWS Security Hub** → **Security Hub CSPM** (Aufteilung 2025) *(Kap. 6)*
- **Amazon Elasticsearch Service** → **Amazon OpenSearch Service** *(Kap. 7)*
- **Personal/Service Health Dashboard** → **AWS Health Dashboard (Your account / Service health)** *(Kap. 12)*
- **AWS Free Tier** → credit-basiert seit 15.07.2025 (Alt-Modell nur für Konten davor)

---

*Erstellt für Oktays CertOps-Lernprojekt. Weiter geht's mit Kapitel 1.*
