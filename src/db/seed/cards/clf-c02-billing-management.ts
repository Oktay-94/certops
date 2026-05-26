// src/db/seed/cards/clf-c02-billing-management.ts

import type { NewFlashcard } from "../../schema";

export const clfC02BillingManagementCards: NewFlashcard[] = [
  // ── Billing & Pricing ── domain: Billing, Pricing, and Support

  // 1. Pay-as-you-go
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Pay-as-you-go — Grundprinzip?",
    back: "Du zahlst nur für die Ressourcen, die du tatsächlich nutzt — keine Vorab-Verpflichtung, keine fixen Kosten für ungenutzte Kapazität. Drei Spar-Prinzipien von AWS: pay-as-you-go (nutzungsbasiert), save when you reserve (Rabatt bei Vorab-Commitment, z.B. Reserved Instances), pay less by using more (Mengenrabatte, z.B. gestaffelte S3-Preise).",
    difficulty: 1,
    sourceRef: "AWS Pricing Principles",
  },

  // 2. 3 Pricing-Fundamente
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Die 3 grundlegenden Kostentreiber bei AWS?",
    back: "1. Compute (Rechenleistung — z.B. EC2-Stunden, Lambda-Aufrufe). 2. Storage (gespeicherte Daten — z.B. S3, EBS pro GB). 3. Data Transfer OUT (ausgehender Datenverkehr aus AWS heraus). Wichtig: eingehender Transfer (in AWS hinein) ist meist kostenlos, ausgehender kostet. Faustregel: Compute + Storage + Data-Out.",
    difficulty: 2,
    sourceRef: "AWS Pricing Fundamentals",
  },

  // 3. Free Tier
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Free Tier — die 3 Typen?",
    back: "1. Always Free: dauerhaft kostenlos bis zu einem Limit (z.B. Lambda 1 Mio. Requests/Monat, DynamoDB 25 GB). 2. 12 Months Free: erste 12 Monate ab Account-Erstellung kostenlos (z.B. EC2 t2.micro 750 Std/Monat). 3. Trials: kurze Testzeiträume für bestimmte Services (Tage bis Monate). Faustregel: Always Free / 12 Monate / Trials.",
    difficulty: 2,
    sourceRef: "AWS Free Tier",
  },

  // 4. Consolidated Billing
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Consolidated Billing (AWS Organizations) — Vorteil?",
    back: "Eine einzige Rechnung für alle Accounts in einer Organisation. Vorteile: zentrale Abrechnung, und die kombinierte Nutzung aller Accounts qualifiziert für Mengenrabatte (z.B. S3-Staffelpreise) und geteilte Reserved Instances / Savings Plans. Faustregel: viele Accounts, eine Rechnung, gemeinsame Rabatte.",
    difficulty: 2,
    sourceRef: "AWS Organizations Billing",
  },

  // 5. Pricing Calculator
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Pricing Calculator — wofür?",
    back: "Kostenloses Tool zum SCHÄTZEN von Kosten VOR der Nutzung — du konfigurierst geplante Services und bekommst eine Kostenprognose. Ideal für Budgetplanung und Vergleiche, bevor du etwas baust. Faustregel: Pricing Calculator = Kosten im Voraus planen (nicht reale Kosten ansehen — das ist Cost Explorer).",
    difficulty: 2,
    sourceRef: "AWS Pricing Calculator",
  },

  // 6. Cost Explorer
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Cost Explorer — wofür?",
    back: "Visualisiert und analysiert deine TATSÄCHLICHEN, vergangenen AWS-Kosten und -Nutzung über die Zeit (Diagramme, Filter nach Service/Tag/Region). Erkennt Trends und Kostentreiber, bietet Prognosen. Faustregel: Cost Explorer = was habe ich ausgegeben und wohin floss es (rückblickend + Forecast).",
    difficulty: 2,
    sourceRef: "AWS Cost Explorer",
  },

  // 7. AWS Budgets
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Budgets — wofür?",
    back: "Du setzt Kosten- oder Nutzungs-Budgets und bekommst Alarme (E-Mail/SNS), wenn du eine Schwelle erreichst oder voraussichtlich überschreitest. Proaktiv: warnt VOR dem Überschreiten. Faustregel: Budgets = Limit setzen + benachrichtigt werden, bevor es zu teuer wird.",
    difficulty: 2,
    sourceRef: "AWS Budgets",
  },

  // 8. Cost Allocation Tags
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Cost Allocation Tags — wozu?",
    back: "Schlüssel-Wert-Markierungen an Ressourcen (z.B. Projekt=Alpha, Abteilung=Marketing), mit denen du Kosten zuordnen und aufschlüsseln kannst. So siehst du, welches Team/Projekt wie viel verursacht. Faustregel: Tags = Kosten nach Projekt/Abteilung sortieren und sichtbar machen.",
    difficulty: 2,
    sourceRef: "AWS Cost Allocation Tags",
  },

  // 9. Cost and Usage Report
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Cost and Usage Report (CUR) — was ist das?",
    back: "Der detaillierteste verfügbare Kosten- und Nutzungsbericht — bis auf die Ebene einzelner Ressourcen und Stunden. Wird in S3 abgelegt, für tiefe Analysen (z.B. mit Athena oder QuickSight). Faustregel: CUR = die granularste Rechnungsaufschlüsselung, die AWS bietet.",
    difficulty: 1,
    sourceRef: "AWS Cost and Usage Report",
  },

  // 10. Data Transfer Costs
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Data-Transfer-Kosten bei AWS — Grundregel?",
    back: "Eingehender Datenverkehr (ins AWS hinein, z.B. Upload nach S3) ist meist KOSTENLOS. Ausgehender Verkehr (aus AWS ins Internet) KOSTET. Transfer innerhalb derselben Region/AZ ist oft kostenlos oder günstiger; zwischen Regionen kostet. Faustregel: rein = gratis, raus = zahlen.",
    difficulty: 2,
    sourceRef: "AWS Data Transfer Pricing",
  },

  // 11. Pricing Calculator vs Cost Explorer vs Budgets
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Pricing Calculator vs Cost Explorer vs Budgets — Abgrenzung?",
    back: "Pricing Calculator: Kosten VORHER schätzen (Planung, noch nichts gebaut). Cost Explorer: tatsächliche Kosten rückblickend analysieren + Forecast. Budgets: Limits setzen und alarmiert werden. Merksatz: Calculator = vorher schätzen, Cost Explorer = analysieren, Budgets = überwachen/warnen. Häufige Prüfungs-Verwechslung.",
    difficulty: 2,
    sourceRef: "AWS Cost Management Tools",
  },

  // ── Support ── domain: Billing, Pricing, and Support

  // 12. Die 5 Support-Pläne
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Die 5 AWS-Support-Pläne (Übersicht)?",
    back: "1. Basic (kostenlos, alle Kunden). 2. Developer (für Test/Entwicklung). 3. Business (für Produktiv-Workloads, 24/7). 4. Enterprise On-Ramp (business-critical, Pool von TAMs). 5. Enterprise (mission-critical, dedizierter TAM). Steigend: Preis, Reaktionsgeschwindigkeit, Umfang. Faustregel: je höher, desto schneller + persönlicher der Support.",
    difficulty: 2,
    sourceRef: "AWS Support Plans",
  },

  // 13. Basic Support
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Basic Support — was ist enthalten?",
    back: "Kostenlos für ALLE AWS-Kunden. Enthält: Kundenservice für Account-/Billing-Fragen, AWS-Dokumentation, Whitepapers, re:Post (Community-Forum), AWS Health Dashboard und Trusted Advisor (nur Core Checks). KEIN technischer Support für Probleme. Faustregel: Basic = gratis, aber kein echter technischer Support.",
    difficulty: 1,
    sourceRef: "AWS Basic Support",
  },

  // 14. Developer Support
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Developer Support — für wen und was?",
    back: "Für Test- und Entwicklungsumgebungen (nicht Produktion). Zugang zu Cloud Support Associates per E-Mail während der Geschäftszeiten. Reaktionszeiten: general guidance < 24 Std, system impaired < 12 Std. Faustregel: Developer = günstiger Einstieg, Email-Support zu Bürozeiten, für Dev/Test.",
    difficulty: 2,
    sourceRef: "AWS Developer Support",
  },

  // 15. Business Support
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Business Support — was kommt dazu?",
    back: "Empfohlenes Minimum für PRODUKTIV-Workloads. 24/7-Zugang zu Cloud Support Engineers per Telefon, Chat, E-Mail. Reaktionszeiten: production system impaired < 4 Std, production system down < 1 Std. Voller Trusted Advisor (alle Checks). Faustregel: Business = 24/7, voller Trusted Advisor, ab Produktion.",
    difficulty: 2,
    sourceRef: "AWS Business Support",
  },

  // 16. Enterprise Support
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Enterprise On-Ramp vs Enterprise Support — Unterschied?",
    back: "Enterprise On-Ramp: business-critical system down < 30 Min Reaktion, Zugang zu einem POOL von Technical Account Managers. Enterprise: mission-critical system down < 15 Min Reaktion, DEDIZIERTER TAM (fester Ansprechpartner), Concierge-Team, Well-Architected/Operations-Reviews. Faustregel: On-Ramp = TAM-Pool/30 Min, Enterprise = eigener TAM/15 Min.",
    difficulty: 2,
    sourceRef: "AWS Enterprise Support",
  },

  // 17. Trusted Advisor Kategorien
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Trusted Advisor — die 5 Kategorien?",
    back: "Prüft deine Umgebung gegen Best Practices in 5 Bereichen: 1. Cost Optimization (Kosten senken), 2. Performance, 3. Security, 4. Fault Tolerance (Ausfallsicherheit), 5. Service Limits/Quotas. Liefert konkrete Handlungsempfehlungen. Faustregel: Trusted Advisor = automatischer Best-Practice-Berater in 5 Kategorien.",
    difficulty: 2,
    sourceRef: "AWS Trusted Advisor",
  },

  // 18. Trusted Advisor nach Plan
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Trusted Advisor — was bekommt man je nach Support-Plan?",
    back: "Basic und Developer: nur Core Checks (eingeschränkt — einige Security- und Service-Limit-Prüfungen). Business, Enterprise On-Ramp und Enterprise: ALLE Trusted-Advisor-Checks in allen 5 Kategorien. Faustregel: voller Trusted Advisor erst ab Business Support.",
    difficulty: 2,
    sourceRef: "AWS Trusted Advisor",
  },

  // 19. AWS Health Dashboard
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Health Dashboard — wofür?",
    back: "Zeigt den Gesundheitszustand der AWS-Services und Ereignisse, die DEINE Ressourcen betreffen. Zwei Teile: Service Health (allgemeiner AWS-Status aller Regionen) und Your Account Health (personalisierte Ereignisse/geplante Wartungen, die deine Ressourcen betreffen). Faustregel: Health Dashboard = läuft AWS, und betrifft mich etwas?",
    difficulty: 1,
    sourceRef: "AWS Health Dashboard",
  },

  // 20. TAM
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Technical Account Manager (TAM) — Rolle, ab welchem Plan?",
    back: "Ein persönlicher technischer Ansprechpartner bei AWS, der deine Umgebung kennt, proaktiv berät, Architektur-Reviews macht und bei Optimierung hilft. Pool von TAMs ab Enterprise On-Ramp; DEDIZIERTER (fester) TAM ab Enterprise Support. Faustregel: TAM = persönlicher AWS-Berater, erst in den Top-Plänen.",
    difficulty: 2,
    sourceRef: "AWS Technical Account Manager",
  },

  // ── Management & Monitoring ── domain: Cloud Technology and Services

  // 21. CloudWatch
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon CloudWatch — was macht es?",
    back: "Monitoring- und Observability-Service: sammelt Metriken (CPU, Netzwerk, Speicher etc.), Logs und Events von AWS-Ressourcen. Du kannst Dashboards bauen, Alarme setzen und automatische Aktionen auslösen. Faustregel: CloudWatch = Überwachung von Performance und Metriken (wie gesund/ausgelastet sind meine Ressourcen?).",
    difficulty: 2,
    sourceRef: "AWS CloudWatch Documentation",
  },

  // 22. CloudWatch Alarms + Billing Alarm
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "CloudWatch Alarms — was können sie, auch für Kosten?",
    back: "Alarme überwachen eine Metrik und reagieren bei Schwellenwert-Überschreitung: Benachrichtigung (SNS), Auto-Scaling auslösen, EC2 stoppen/neustarten. Auch ein Billing-Alarm ist möglich (warnt, wenn geschätzte Kosten eine Grenze überschreiten). Faustregel: Alarm = automatisch reagieren, wenn ein Wert eine Grenze reißt.",
    difficulty: 2,
    sourceRef: "AWS CloudWatch Alarms",
  },

  // 23. CloudWatch vs CloudTrail vs Config
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "CloudWatch vs CloudTrail vs Config — die 3 abgrenzen?",
    back: "CloudWatch: PERFORMANCE/Metriken überwachen (wie läuft es?). CloudTrail: API-AKTIVITÄTEN protokollieren (wer hat was getan?). Config: KONFIGURATION + Compliance verfolgen (wie ist es eingestellt, ist es regelkonform?). Merksatz: CloudWatch = Performance, CloudTrail = wer/was, Config = wie konfiguriert. Klassische Prüfungs-Verwechslung.",
    difficulty: 2,
    sourceRef: "AWS Management Tools Comparison",
  },

  // 24. CloudFormation
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS CloudFormation — wofür?",
    back: "Infrastructure as Code: du beschreibst deine gesamte Infrastruktur in einer Vorlage (Template, JSON/YAML), und CloudFormation erstellt/aktualisiert/löscht die Ressourcen automatisch und konsistent. Wiederholbar, versionierbar, kein manuelles Klicken. Faustregel: CloudFormation = Infrastruktur per Vorlage automatisch ausrollen.",
    difficulty: 2,
    sourceRef: "AWS CloudFormation Documentation",
  },

  // 25. Infrastructure as Code
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Infrastructure as Code (IaC) — Konzept und Vorteile?",
    back: "Infrastruktur wird als Code/Vorlagen definiert statt manuell per Konsole erstellt. Vorteile: wiederholbar (gleiche Umgebung mehrfach), versionierbar (in Git), weniger Fehler, schnelle Wiederherstellung. AWS-Tool dafür: CloudFormation. Faustregel: IaC = Infrastruktur als wiederholbaren Code beschreiben statt klicken.",
    difficulty: 2,
    sourceRef: "AWS Infrastructure as Code",
  },

  // 26. Systems Manager
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Systems Manager — wofür?",
    back: "Zentrale Verwaltung und Automatisierung für deine AWS- und On-Premises-Ressourcen: Patches verteilen, Befehle auf vielen Instanzen ausführen (Run Command), Konfigurationen/Secrets verwalten (Parameter Store), Inventar. Faustregel: Systems Manager = Flotte von Servern zentral verwalten und automatisieren.",
    difficulty: 2,
    sourceRef: "AWS Systems Manager Documentation",
  },

  // 27. Control Tower
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Control Tower — Zweck?",
    back: "Richtet eine sichere, gut strukturierte Multi-Account-Umgebung (Landing Zone) per Knopfdruck ein und verwaltet sie — auf Basis von AWS Organizations, mit vordefinierten Best-Practice-Leitplanken (Guardrails). Faustregel: Control Tower = Multi-Account-Setup mit Best Practices automatisch aufsetzen und überwachen.",
    difficulty: 2,
    sourceRef: "AWS Control Tower Documentation",
  },

  // 28. AWS Marketplace
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Marketplace — was ist das?",
    back: "Ein digitaler Katalog mit Software von Drittanbietern (fertige Server-Images, SaaS, ML-Modelle), die du finden, kaufen und direkt in AWS bereitstellen kannst. Abrechnung läuft über deine AWS-Rechnung. Faustregel: Marketplace = App-Store für Drittanbieter-Software, abgerechnet über AWS.",
    difficulty: 1,
    sourceRef: "AWS Marketplace",
  },

  // 29. Organizations (Recap)
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "AWS Organizations — die zwei Hauptnutzen für Billing/Governance?",
    back: "1. Consolidated Billing: eine Rechnung für alle Accounts + gemeinsame Mengenrabatte/Reserved Instances. 2. Governance: Accounts in Organizational Units (OUs) gruppieren und mit Service Control Policies (SCPs) zentral begrenzen, was erlaubt ist. Faustregel: Organizations = viele Accounts zentral abrechnen + steuern.",
    difficulty: 2,
    sourceRef: "AWS Organizations",
  },

  // 30. Trusted Advisor vs Well-Architected Tool
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    front: "Trusted Advisor vs Well-Architected Tool — Unterschied?",
    back: "Trusted Advisor: automatische, laufende Checks deiner LIVE-Ressourcen in 5 Kategorien (Kosten, Performance, Security, Fault Tolerance, Limits) mit sofortigen Empfehlungen. Well-Architected Tool: fragebasierte SELBST-Bewertung einer Workload-ARCHITEKTUR gegen die 6 Säulen. Merksatz: Trusted Advisor = automatischer Ressourcen-Check, WA Tool = manuelle Architektur-Bewertung.",
    difficulty: 2,
    sourceRef: "AWS Management Tools Comparison",
  },
];
