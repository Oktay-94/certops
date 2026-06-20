// src/db/seed/questions/clf-c02-q-bill-batch3.ts
//
// Batch 3 — Billing, Pricing, and Support (12 Fragen) — letzter Teil (4/4).
// Prüfungstreue EIGEN-Fragen, thematisch disjunkt zu den 19 bestehenden
// Billing-Fragen (Batch 1 + 2) und zu CC/Security/CloudTech-Batch-3.
// Difficulty: 2× diff 1, 10× diff 2. Multiple-Response: 2 von 12.
//
// CURRENCY: Die Free-Tier-Frage spiegelt das AKTUELLE Modell (credit-basiert
// für Konten ab 15.07.2025; Legacy 12-Monate nur für ältere Konten). Dies
// schließt die im Audit gefundene Currency-Lücke der Bestands-Billing-Fragen.
//
// INTEGRATION (Code-Claude): in den Batch-3-Index + src/db/seed.ts aufnehmen.

import type { NewQuestion } from "../../schema";

export const clfC02QBillingB3: NewQuestion[] = [
  // ── 4.1 Pricing-Modelle ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "multiple",
    prompt:
      "Welche ZWEI Aussagen über AWS Savings Plans sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Man verpflichtet sich für 1 oder 3 Jahre zu einem konsistenten Compute-Nutzungsbetrag (gemessen in $/Stunde) und erhält dafür einen Rabatt gegenüber On-Demand." },
      { id: "B", text: "Compute Savings Plans bieten Flexibilität über Instanz-Familien, -Größen, Regionen und sogar Dienste wie AWS Lambda und AWS Fargate hinweg." },
      { id: "C", text: "Savings Plans gelten ausschließlich für Amazon-S3-Speicher." },
      { id: "D", text: "Savings Plans erfordern zwingend eine vollständige Vorauszahlung (All Upfront)." },
      { id: "E", text: "Savings Plans sind preislich identisch mit On-Demand." },
    ],
    correct: ["A", "B"],
    explanation:
      "Savings Plans bieten Rabatte im Gegenzug für eine Selbstverpflichtung auf einen bestimmten Compute-Nutzungsbetrag ($/Stunde) über 1 oder 3 Jahre. Compute Savings Plans sind besonders flexibel: Der Rabatt gilt unabhängig von Instanz-Familie, -Größe, OS, Region und sogar für Fargate und Lambda. Sie gelten nicht nur für S3 (C falsch), bieten verschiedene Zahlungsoptionen statt nur All Upfront (D falsch) und sind günstiger als On-Demand (E falsch).",
    difficulty: 2,
    seedKey: "clf-c02-q-253",
    sourceRef: "AWS Savings Plans",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Bei einigen AWS-Diensten wie Amazon S3 sinkt der Preis pro Einheit (z. B. pro GB), je mehr man nutzt. Wie nennt sich dieses Preismodell?",
    choices: [
      { id: "A", text: "Tiered Pricing / Volumen-Rabatte (gestaffelte Preise)" },
      { id: "B", text: "Reserved Pricing" },
      { id: "C", text: "Spot Pricing" },
      { id: "D", text: "Dedicated Pricing" },
    ],
    correct: ["A"],
    explanation:
      "Bei gestaffelter Preisgestaltung (tiered pricing / volume discounts) sinkt der Preis pro Einheit mit steigender Nutzung — 'je mehr man nutzt, desto weniger zahlt man pro Einheit'. Beispiel: S3-Speicher wird ab bestimmten Mengen pro GB günstiger. Reserved (Kapazitäts-Commitment), Spot (ungenutzte EC2-Kapazität) und Dedicated (dedizierte Hardware) sind andere Modelle.",
    difficulty: 2,
    seedKey: "clf-c02-q-254",
    sourceRef: "AWS Pricing — Tiered / Volume Pricing",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen muss aus Lizenz- und Compliance-Gründen seine Workloads auf einem physischen Server betreiben, der ausschließlich ihm zugewiesen ist (z. B. um vorhandene Software-Lizenzen pro Sockel/Kern weiterzuverwenden). Welche EC2-Option erfüllt das?",
    choices: [
      { id: "A", text: "Amazon EC2 Dedicated Hosts" },
      { id: "B", text: "Spot Instances" },
      { id: "C", text: "On-Demand Instances in einem öffentlichen Subnetz" },
      { id: "D", text: "AWS Lambda" },
    ],
    correct: ["A"],
    explanation:
      "Ein Amazon EC2 Dedicated Host ist ein physischer Server, der vollständig einem Kunden zugewiesen ist. Das erlaubt die Nutzung vorhandener, an physische Hardware gebundener Lizenzen (BYOL, z. B. pro Sockel/Kern) und hilft, regulatorische bzw. Compliance-Anforderungen zu erfüllen. Spot (unterbrechbar, geteilte Hardware), On-Demand (geteilte Hardware) und Lambda (serverlos) bieten keine dedizierte physische Hardware mit Sichtbarkeit der Sockel/Kerne.",
    difficulty: 2,
    seedKey: "clf-c02-q-255",
    sourceRef: "Amazon EC2 Dedicated Hosts",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Bei Reserved Instances bzw. Savings Plans kann man zwischen verschiedenen Zahlungsoptionen wählen. Welche Option führt typischerweise zum GRÖSSTEN Rabatt?",
    choices: [
      { id: "A", text: "All Upfront (vollständige Vorauszahlung)" },
      { id: "B", text: "Partial Upfront (teilweise Vorauszahlung)" },
      { id: "C", text: "No Upfront (keine Vorauszahlung)" },
      { id: "D", text: "Alle Optionen ergeben exakt denselben Preis." },
    ],
    correct: ["A"],
    explanation:
      "Es gibt drei Zahlungsoptionen: All Upfront, Partial Upfront und No Upfront. Je mehr im Voraus bezahlt wird, desto höher der Rabatt — daher bietet 'All Upfront' typischerweise die größte Ersparnis, 'No Upfront' die geringste (aber dafür keine Anfangszahlung). Die Optionen unterscheiden sich also preislich (D falsch).",
    difficulty: 2,
    seedKey: "clf-c02-q-256",
    sourceRef: "AWS Reserved Instances / Savings Plans — Payment Options",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Eine Entwicklerin erstellt HEUTE ein brandneues AWS-Konto, um AWS kennenzulernen. Welche Aussage beschreibt den AWS Free Tier, den sie erhält, am besten?",
    choices: [
      { id: "A", text: "Ein credit-basierter Free Tier: bis zu 200 $ Guthaben und ein Free Plan, der nach 6 Monaten oder bei Aufbrauchen des Guthabens endet (je nachdem, was zuerst eintritt)." },
      { id: "B", text: "Automatisch 12 Monate kostenlose Nutzung eines festen Kontingents bestimmter Dienste." },
      { id: "C", text: "Alle AWS-Dienste sind dauerhaft und unbegrenzt kostenlos." },
      { id: "D", text: "Es gibt keine kostenlose Option; es muss sofort bezahlt werden." },
    ],
    correct: ["A"],
    explanation:
      "Seit dem 15. Juli 2025 erhalten NEUE AWS-Konten einen credit-basierten Free Tier: bis zu 200 $ Guthaben (100 $ bei Anmeldung + bis zu 100 $ durch Onboarding-Aktivitäten) und die Wahl zwischen Free Plan (endet nach 6 Monaten oder bei Aufbrauchen des Guthabens) und Paid Plan. Das frühere 12-Monats-Modell (B) gilt nur noch für Konten, die VOR dem 15.07.2025 erstellt wurden. Über 30 'Always Free'-Dienste mit monatlichen Limits bleiben weiterhin bestehen — aber 'alles dauerhaft unbegrenzt frei' (C) trifft nicht zu, und eine kostenlose Option existiert sehr wohl (D falsch).",
    difficulty: 2,
    seedKey: "clf-c02-q-257",
    sourceRef: "AWS Free Tier (credit-based model, ab 15.07.2025)",
  },

  // ── 4.2 Kostenmanagement-Werkzeuge ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Finanzteam benötigt die detailliertesten verfügbaren Kosten- und Nutzungsdaten auf Einzelposten-Ebene, um sie anschließend mit eigenen Tools (z. B. via Amazon Athena) tief auszuwerten. Welche AWS-Ressource liefert diese granularsten Daten?",
    choices: [
      { id: "A", text: "AWS Cost and Usage Report (CUR)" },
      { id: "B", text: "Die Karten-Kacheln im Dashboard" },
      { id: "C", text: "Amazon CloudFront-Berichte" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["A"],
    explanation:
      "Der AWS Cost and Usage Report (CUR) enthält die umfassendsten und granularsten Kosten- und Nutzungsdaten auf Einzelposten-Ebene. Er lässt sich nach Amazon S3 exportieren und mit Athena, Redshift oder QuickSight detailliert analysieren. Cost Explorer bietet eher visuelle Übersichten/Trends; CloudFront-Berichte und Trusted Advisor liefern keine vollständigen Abrechnungs-Einzelposten.",
    difficulty: 2,
    seedKey: "clf-c02-q-258",
    sourceRef: "AWS Cost and Usage Report (CUR)",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte seine AWS-Kosten nach Projekten, Teams und Umgebungen (z. B. 'prod' vs 'dev') aufschlüsseln und in den Kostenberichten getrennt nachverfolgen. Welche Funktion ermöglicht das?",
    choices: [
      { id: "A", text: "Cost Allocation Tags (Kostenzuordnungs-Tags)" },
      { id: "B", text: "Security Groups" },
      { id: "C", text: "Amazon Route 53 Records" },
      { id: "D", text: "S3-Bucket-Policies" },
    ],
    correct: ["A"],
    explanation:
      "Mit Cost Allocation Tags versieht man Ressourcen mit Schlüssel-Wert-Tags (z. B. Project=Apollo, Environment=prod). Nach Aktivierung erscheinen diese Tags in Cost Explorer und im Cost and Usage Report, sodass sich Kosten nach Projekt, Team, Kostenstelle oder Umgebung filtern und nachverfolgen lassen. Security Groups (Firewall), Route-53-Records (DNS) und Bucket-Policies (Zugriff) dienen nicht der Kostenzuordnung.",
    difficulty: 2,
    seedKey: "clf-c02-q-259",
    sourceRef: "AWS Cost Allocation Tags",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte automatisch benachrichtigt werden, wenn ungewöhnliche, unerwartete Ausgabensteigerungen auftreten — erkannt mittels maschinellem Lernen. Welcher AWS-Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Cost Anomaly Detection" },
      { id: "B", text: "Amazon GuardDuty" },
      { id: "C", text: "AWS CloudFormation" },
      { id: "D", text: "Amazon Polly" },
    ],
    correct: ["A"],
    explanation:
      "AWS Cost Anomaly Detection nutzt Machine Learning, um ungewöhnliche Ausgabenmuster zu erkennen, und benachrichtigt das Team über unerwartete Kostenanstiege — so lassen sich Budgetüberraschungen früh entdecken. GuardDuty erkennt SICHERHEITS-Bedrohungen (nicht Kosten), CloudFormation ist IaC, Polly ist Text-to-Speech.",
    difficulty: 2,
    seedKey: "clf-c02-q-260",
    sourceRef: "AWS Cost Anomaly Detection",
  },

  // ── 4.3 Support & technische Ressourcen ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "multiple",
    prompt:
      "Welche ZWEI AWS-Support-Pläne beinhalten rund um die Uhr (24/7) Zugang zu Cloud Support Engineers per Telefon, Chat und E-Mail? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Business" },
      { id: "B", text: "Enterprise" },
      { id: "C", text: "Basic" },
      { id: "D", text: "Developer" },
      { id: "E", text: "Platinum" },
    ],
    correct: ["A", "B"],
    explanation:
      "Die Support-Pläne Business und Enterprise (sowie Enterprise On-Ramp) bieten 24/7-Zugang zu Cloud Support Engineers per Telefon, Chat und E-Mail. Basic (kostenlos) bietet nur Foren/Dokumentation und Account-/Abrechnungsfragen; Developer bietet nur E-Mail-Support zu Geschäftszeiten. 'Platinum' (E) ist kein AWS-Support-Plan.",
    difficulty: 2,
    seedKey: "clf-c02-q-261",
    sourceRef: "AWS Support Plans",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte fertige Software von Drittanbietern (z. B. Sicherheits-Appliances oder Datenbank-Software) finden, kaufen und schnell bereitstellen — abgerechnet bequem über die eigene AWS-Rechnung. Welche Ressource ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Marketplace" },
      { id: "B", text: "AWS Artifact" },
      { id: "C", text: "Amazon CloudWatch" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "AWS Marketplace ist ein digitaler Katalog, in dem man Software und Services von Drittanbietern finden, kaufen, abonnieren und bereitstellen kann — die Kosten erscheinen konsolidiert auf der AWS-Rechnung. Artifact liefert Compliance-Berichte, CloudWatch ist für Monitoring, CloudTrail für API-Auditing.",
    difficulty: 1,
    seedKey: "clf-c02-q-262",
    sourceRef: "AWS Marketplace",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Entwickler hat eine technische Frage und sucht eine KOSTENLOSE, von einer Community und AWS-Experten betriebene Frage-und-Antwort-Plattform. Welche AWS-Ressource passt?",
    choices: [
      { id: "A", text: "AWS re:Post" },
      { id: "B", text: "Ein Enterprise-Support-Vertrag mit TAM" },
      { id: "C", text: "Amazon SNS" },
      { id: "D", text: "AWS Shield Advanced" },
    ],
    correct: ["A"],
    explanation:
      "AWS re:Post ist eine kostenlose, community-getriebene Frage-und-Antwort-Plattform (Nachfolger der AWS-Foren), auf der Nutzer und AWS-Experten technische Fragen beantworten — ergänzt durch das AWS Knowledge Center und die Dokumentation. Ein Enterprise-Vertrag mit TAM ist kostenpflichtiger Premium-Support; SNS ist ein Messaging-Dienst; Shield Advanced ist DDoS-Schutz.",
    difficulty: 1,
    seedKey: "clf-c02-q-263",
    sourceRef: "AWS re:Post",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Betriebsteam möchte personalisierte Hinweise zu AWS-Ereignissen und geplanten Änderungen sehen, die SPEZIELL die eigenen Konten und Ressourcen betreffen (z. B. anstehende Wartungen oder Probleme, die genutzte Ressourcen tangieren). Welche AWS-Ressource bietet diese personalisierte Sicht?",
    choices: [
      { id: "A", text: "AWS Health Dashboard" },
      { id: "B", text: "AWS Pricing Calculator" },
      { id: "C", text: "Amazon Athena" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["A"],
    explanation:
      "Das AWS Health Dashboard zeigt sowohl den allgemeinen Status der AWS-Dienste als auch eine PERSONALISIERTE Sicht auf Ereignisse und geplante Änderungen, die die eigenen Konten und Ressourcen betreffen (z. B. anstehende Wartung oder Vorfälle, die genutzte Ressourcen tangieren). Pricing Calculator (Kostenschätzung), Athena (Abfragen) und Artifact (Compliance-Berichte) bieten diese Health-Sicht nicht.",
    difficulty: 2,
    seedKey: "clf-c02-q-264",
    sourceRef: "AWS Health Dashboard",
  },
];
