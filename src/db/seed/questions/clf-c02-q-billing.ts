// src/db/seed/questions/clf-c02-q-billing.ts

import type { NewQuestion } from "../../schema";

export const clfC02QBilling: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt: "Was beschreibt das AWS Pay-as-you-go-Preismodell am besten?",
    choices: [
      { id: "A", text: "Man zahlt eine feste monatliche Pauschale unabhängig von der Nutzung" },
      { id: "B", text: "Man zahlt nur für die tatsächlich genutzten Ressourcen, ohne Vorab-Verpflichtung" },
      { id: "C", text: "Man muss Hardware drei Jahre im Voraus kaufen" },
      { id: "D", text: "Alle Services sind dauerhaft kostenlos" },
    ],
    correct: ["B"],
    explanation:
      "Pay-as-you-go bedeutet, dass man nur für die tatsächlich verbrauchten Ressourcen zahlt — keine Vorab-Investition, keine Kosten für ungenutzte Kapazität.",
    difficulty: 1,
    sourceRef: "AWS Pricing Principles",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "multiple",
    prompt:
      "Welche der folgenden gehören zu den grundlegenden Kostentreibern bei AWS? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Compute (Rechenleistung)" },
      { id: "B", text: "Die Anzahl der IAM-Benutzer" },
      { id: "C", text: "Storage (gespeicherte Daten)" },
      { id: "D", text: "Die Anzahl der erstellten Tags" },
      { id: "E", text: "Die Anzahl der AWS-Regionen weltweit" },
    ],
    correct: ["A", "C"],
    explanation:
      "Die drei grundlegenden Kostentreiber sind Compute, Storage und Data Transfer (ausgehend). Compute und Storage gehören dazu; IAM-Benutzer und Tags sind kostenlos.",
    difficulty: 2,
    sourceRef: "AWS Pricing Fundamentals",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welche Aussage über die Data-Transfer-Kosten bei AWS ist korrekt?",
    choices: [
      { id: "A", text: "Eingehender Datenverkehr (in AWS hinein) ist meist kostenlos, ausgehender kostet" },
      { id: "B", text: "Eingehender Datenverkehr kostet, ausgehender ist kostenlos" },
      { id: "C", text: "Sämtlicher Datenverkehr ist immer kostenlos" },
      { id: "D", text: "Datenverkehr wird nicht abgerechnet" },
    ],
    correct: ["A"],
    explanation:
      "Eingehender Datenverkehr (z.B. Upload nach S3) ist in der Regel kostenlos. Ausgehender Datenverkehr (aus AWS ins Internet) wird berechnet — ein häufig übersehener Kostenpunkt.",
    difficulty: 2,
    sourceRef: "AWS Data Transfer Pricing",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher Vorteil ergibt sich aus Consolidated Billing in AWS Organizations?",
    choices: [
      { id: "A", text: "Jeder Account erhält eine komplett getrennte Rechnung ohne Verbindung" },
      { id: "B", text: "Eine gemeinsame Rechnung für alle Accounts plus mögliche Mengenrabatte" },
      { id: "C", text: "Alle Accounts werden automatisch gelöscht" },
      { id: "D", text: "Die Sicherheit wird automatisch erhöht" },
    ],
    correct: ["B"],
    explanation:
      "Consolidated Billing liefert eine einzige Rechnung für alle Accounts einer Organisation, und die kombinierte Nutzung qualifiziert für Mengenrabatte und geteilte Reserved Instances / Savings Plans.",
    difficulty: 2,
    sourceRef: "AWS Organizations Billing",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte die Kosten einer geplanten AWS-Architektur abschätzen, BEVOR es etwas bereitstellt. Welches Tool eignet sich?",
    choices: [
      { id: "A", text: "AWS Pricing Calculator" },
      { id: "B", text: "AWS Cost Explorer" },
      { id: "C", text: "Amazon CloudWatch" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "Der AWS Pricing Calculator schätzt die Kosten geplanter Services im Voraus — ideal für Budgetplanung, bevor Ressourcen tatsächlich bereitgestellt werden.",
    difficulty: 2,
    sourceRef: "AWS Pricing Calculator",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher Service visualisiert und analysiert die TATSÄCHLICHEN vergangenen AWS-Kosten und -Nutzung über die Zeit?",
    choices: [
      { id: "A", text: "AWS Pricing Calculator" },
      { id: "B", text: "AWS Cost Explorer" },
      { id: "C", text: "AWS Trusted Advisor" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["B"],
    explanation:
      "AWS Cost Explorer visualisiert und analysiert die tatsächlichen, vergangenen Kosten und die Nutzung über die Zeit, erkennt Trends und bietet Prognosen.",
    difficulty: 2,
    sourceRef: "AWS Cost Explorer",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Team möchte automatisch benachrichtigt werden, wenn die monatlichen Kosten einen festgelegten Betrag zu überschreiten drohen. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Budgets" },
      { id: "B", text: "AWS Pricing Calculator" },
      { id: "C", text: "Amazon Inspector" },
      { id: "D", text: "AWS Config" },
    ],
    correct: ["A"],
    explanation:
      "Mit AWS Budgets setzt man Kosten- oder Nutzungsgrenzen und erhält Alarme, wenn eine Schwelle erreicht oder voraussichtlich überschritten wird — proaktiv vor dem Überschreiten.",
    difficulty: 2,
    sourceRef: "AWS Budgets",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher AWS-Support-Plan ist für alle Kunden kostenlos enthalten?",
    choices: [
      { id: "A", text: "Basic Support" },
      { id: "B", text: "Business Support" },
      { id: "C", text: "Enterprise Support" },
      { id: "D", text: "Developer Support" },
    ],
    correct: ["A"],
    explanation:
      "Basic Support ist für alle AWS-Kunden kostenlos. Er umfasst Account-/Billing-Support, Dokumentation, Whitepapers, re:Post und Trusted Advisor (Core Checks), aber keinen technischen Support für Probleme.",
    difficulty: 1,
    sourceRef: "AWS Support Plans",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt produktive Workloads und benötigt rund um die Uhr (24/7) technischen Support per Telefon, Chat und E-Mail. Welcher Support-Plan ist das empfohlene Minimum?",
    choices: [
      { id: "A", text: "Basic Support" },
      { id: "B", text: "Developer Support" },
      { id: "C", text: "Business Support" },
      { id: "D", text: "Es ist kein kostenpflichtiger Plan nötig" },
    ],
    correct: ["C"],
    explanation:
      "Business Support ist das empfohlene Minimum für produktive Workloads: 24/7-Zugang zu Cloud Support Engineers per Telefon, Chat und E-Mail sowie voller Trusted Advisor.",
    difficulty: 2,
    sourceRef: "AWS Business Support",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher Support-Plan bietet einen dedizierten Technical Account Manager (TAM) als festen Ansprechpartner?",
    choices: [
      { id: "A", text: "Basic Support" },
      { id: "B", text: "Developer Support" },
      { id: "C", text: "Enterprise Support" },
      { id: "D", text: "Es gibt bei AWS keinen TAM" },
    ],
    correct: ["C"],
    explanation:
      "Enterprise Support bietet einen dedizierten (festen) Technical Account Manager, schnellste Reaktionszeiten (mission-critical < 15 Min), Concierge-Team und Architektur-Reviews. (Enterprise On-Ramp bietet einen TAM-Pool.)",
    difficulty: 2,
    sourceRef: "AWS Enterprise Support",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "multiple",
    prompt:
      "Welche der folgenden sind Kategorien, die AWS Trusted Advisor prüft? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Cost Optimization" },
      { id: "B", text: "Marketing Reach" },
      { id: "C", text: "Security" },
      { id: "D", text: "Employee Satisfaction" },
      { id: "E", text: "Brand Awareness" },
    ],
    correct: ["A", "C"],
    explanation:
      "Trusted Advisor prüft fünf Kategorien: Cost Optimization, Performance, Security, Fault Tolerance und Service Limits. Cost Optimization und Security gehören dazu; die anderen Optionen sind keine Kategorien.",
    difficulty: 2,
    sourceRef: "AWS Trusted Advisor",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein neuer Kunde möchte AWS-Services kostenlos ausprobieren. Welche Aussage über das AWS Free Tier ist korrekt?",
    choices: [
      { id: "A", text: "Alle AWS-Services sind dauerhaft und unbegrenzt kostenlos" },
      { id: "B", text: "Das Free Tier umfasst dauerhaft kostenlose Angebote, 12-Monats-Angebote und kurzfristige Trials" },
      { id: "C", text: "Das Free Tier gilt nur für Kunden mit Enterprise Support" },
      { id: "D", text: "Das Free Tier ist nur am ersten Tag nach Account-Erstellung aktiv" },
    ],
    correct: ["B"],
    explanation:
      "Das AWS Free Tier hat drei Typen: Always Free (dauerhaft bis zu einem Limit), 12 Months Free (erste 12 Monate ab Account-Erstellung) und Trials (kurze Testzeiträume). Nicht alle Services sind unbegrenzt kostenlos.",
    difficulty: 1,
    sourceRef: "AWS Free Tier",
  },
];
