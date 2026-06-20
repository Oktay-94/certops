import type { NewQuestion } from "../schema";

export const billingQuestions: NewQuestion[] = [
  // ── Billing, Pricing, and Support (K1 initial) ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt einen produktiven Datenbank-Workload, der 24/7 für mindestens die nächsten drei Jahre laufen muss. Welches EC2-Pricing-Modell bietet hier typischerweise die größte Kostenersparnis gegenüber On-Demand?",
    choices: [
      { id: "A", text: "Spot Instances" },
      { id: "B", text: "On-Demand Instances mit Auto Scaling" },
      { id: "C", text: "Reserved Instances / Savings Plans für 3 Jahre, All Upfront" },
      { id: "D", text: "Dedicated Hosts on-demand" },
    ],
    correct: ["C"],
    explanation:
      "Für vorhersehbare, dauerhaft laufende Workloads bieten 3-Jahres-Commitments (Reserved Instances oder Compute/EC2 Savings Plans) mit 'All Upfront' die höchsten Rabatte (bis ~72 % gegenüber On-Demand). Spot ist ungeeignet für stateful DBs (kann unterbrochen werden). Dedicated Hosts sind teurer und auf Compliance/Lizenz-Use-Cases zugeschnitten.",
    difficulty: 2,
    seedKey: "clf-c02-q-058",
    sourceRef: "AWS Exam Guide CLF-C02, Domain 4.1",
  },

  // ── Billing, Pricing, and Support (Spot, ursprünglich in K1-CT-Block, getaggt als Billing) ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt eine Batch-Verarbeitungs-Workload, die fehlertolerant ist und jederzeit unterbrochen werden kann. Die Workload muss möglichst kostengünstig auf EC2 laufen. Welche Kauf-Option (Purchasing Option) ist am besten geeignet?",
    choices: [
      { id: "A", text: "On-Demand Instances" },
      { id: "B", text: "Reserved Instances (3-Year, All Upfront)" },
      { id: "C", text: "Spot Instances" },
      { id: "D", text: "Dedicated Hosts" },
    ],
    correct: ["C"],
    explanation:
      "Spot Instances nutzen ungenutzte EC2-Kapazität mit bis zu 90 % Rabatt gegenüber On-Demand. Trade-off: AWS kann mit 2 Min Vorwarnung beenden. Ideal für Batch, Big Data, CI/CD, fehlertolerante Workloads. On-Demand = höchster Preis, höchste Flexibilität. Reserved 3-Year = 72 % Rabatt aber lange Bindung, nur für konstante Workloads. Dedicated Hosts = Lizenz-/Compliance-Gründe, teuer.",
    difficulty: 2,
    seedKey: "clf-c02-q-059",
    sourceRef: "Amazon EC2 Pricing",
  },

  // ── Billing, Pricing, and Support (+5) ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welche der folgenden Aussagen beschreibt das AWS-Abrechnungsmodell 'Pay-as-you-go' am besten?",
    choices: [
      {
        id: "A",
        text: "Kunden zahlen monatlich einen festen Preis für unbegrenzte Nutzung aller AWS-Services.",
      },
      {
        id: "B",
        text: "Kunden zahlen nur für die tatsächlich genutzten Ressourcen, ohne Vorab-Verpflichtungen oder lange Laufzeitverträge.",
      },
      {
        id: "C",
        text: "Kunden müssen für jedes neue Projekt eine separate Vertragsverhandlung mit AWS führen.",
      },
      {
        id: "D",
        text: "Kunden zahlen einmalig einen Upfront-Betrag für ein Jahr AWS-Nutzung, unabhängig vom tatsächlichen Verbrauch.",
      },
    ],
    correct: ["B"],
    explanation:
      "Pay-as-you-go: nur für tatsächlich genutzte Ressourcen zahlen, keine Vorab-Verpflichtung, keine Kündigungsfristen, granulare Abrechnung (oft pro Sekunde oder pro Anfrage). Drei AWS-Preisprinzipien: 1) Pay for what you use, 2) Pay less when you reserve (Reserved Instances / Savings Plans), 3) Pay less when you use more (Volumenrabatte).",
    difficulty: 1,
    seedKey: "clf-c02-q-060",
    sourceRef: "AWS Pricing Philosophy",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt: "Welche Aussage über den AWS Free Tier ist KORREKT?",
    choices: [
      {
        id: "A",
        text: "Der gesamte AWS Free Tier ist ausschließlich für 12 Monate nach Account-Eröffnung verfügbar.",
      },
      {
        id: "B",
        text: "Der AWS Free Tier umfasst drei Kategorien: 12 Monate kostenlos (für neue Konten), dauerhaft kostenlos (Always Free) und kurzzeitige Trials für bestimmte Services.",
      },
      {
        id: "C",
        text: "Der AWS Free Tier deckt unbegrenzte Nutzung aller AWS-Services für neue Konten ab.",
      },
      {
        id: "D",
        text: "Der Free Tier wird automatisch in einen kostenpflichtigen Plan umgewandelt, sobald irgendein AWS-Service zum ersten Mal verwendet wird.",
      },
    ],
    correct: ["B"],
    explanation:
      "AWS Free Tier hat drei Kategorien: 1) 12 Months Free (neue Konten, z. B. 750h EC2 t2.micro, 5 GB S3, 750h RDS), 2) Always Free dauerhaft (z. B. Lambda 1 Mio. Anfragen/Monat, DynamoDB 25 GB, SNS 1 Mio. Notifications), 3) Trials für bestimmte Services (Inspector 90 Tage, GuardDuty 30 Tage, SageMaker 2 Monate). Cost-Trap: nur bestimmte Services bis zu Limits, nicht unbegrenzt alles.",
    difficulty: 2,
    seedKey: "clf-c02-q-061",
    sourceRef: "AWS Free Tier",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte seine AWS-Kosten der letzten 12 Monate analysieren, um Trends zu erkennen und zukünftige Ausgaben zu prognostizieren. Welcher AWS-Service ist dafür am besten geeignet?",
    choices: [
      { id: "A", text: "AWS Budgets" },
      { id: "B", text: "AWS Cost Explorer" },
      { id: "C", text: "AWS Cost Anomaly Detection" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["B"],
    explanation:
      "AWS Cost Explorer: Visualisierung von Kosten/Nutzung bis 12 Monate rückwirkend, Filter/Gruppierung nach Service/Region/Tag, Prognose bis 12 Monate voraus, RI/Savings-Plans-Reports, kostenlos. Budgets = Schwellwert-Alerts (proaktiv), Cost Anomaly Detection = ML-basierte Ausreißer-Erkennung, Trusted Advisor = Best-Practice-Spar-Empfehlungen.",
    difficulty: 2,
    seedKey: "clf-c02-q-062",
    sourceRef: "AWS Cost Explorer Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher AWS Support Plan ist der GÜNSTIGSTE, der einen 24/7-Zugriff per Telefon und Chat sowie einen dedizierten Technical Account Manager (TAM) bietet?",
    choices: [
      { id: "A", text: "Basic Support" },
      { id: "B", text: "Developer Support" },
      { id: "C", text: "Business Support" },
      { id: "D", text: "Enterprise Support" },
    ],
    correct: ["D"],
    explanation:
      "Support-Pläne: Basic (kostenlos, kein Phone/Chat), Developer (ab 29 USD/Monat, Business-Hours-Email), Business (ab 100 USD/Monat, 24/7 Phone/Chat, voller Trusted Advisor, < 1h Response bei Production Down, KEIN TAM), Enterprise On-Ramp (ab 5.500 USD/Monat, Pool-TAM nicht dediziert), Enterprise (ab 15.000 USD/Monat, dedizierter TAM, < 15 Min bei Business-Critical Down). Enterprise ist der günstigste mit DEDIZIERTEM TAM.",
    difficulty: 2,
    seedKey: "clf-c02-q-063",
    sourceRef: "AWS Support Plans",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Architekt plant eine neue AWS-Lösung und möchte VOR der tatsächlichen Bereitstellung die monatlichen Kosten genau abschätzen (z. B. 'Was kostet eine Architektur mit 3× t3.medium EC2-Instanzen, 500 GB S3-Storage und einem RDS in Frankfurt?'). Welcher AWS-Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Cost Explorer" },
      { id: "B", text: "AWS Pricing Calculator" },
      { id: "C", text: "AWS Budgets" },
      { id: "D", text: "AWS Cost & Usage Report (CUR)" },
    ],
    correct: ["B"],
    explanation:
      "AWS Pricing Calculator: web-basiert (calculator.aws), keine Anmeldung nötig, Service-Auswahl mit Region/Konfiguration, monatliche und 12-Monats-Kostenberechnung, Free-Tier-Inklusion, PDF/CSV-Export, Vergleichs-Szenarien. Cost Explorer = Vergangenheit + Prognose basierend auf Historie. Budgets = Schwellwert-Alerts laufend. CUR = detaillierter S3-Export für Custom-Analysen. Pricing Calculator ersetzte 2019 den alten Simple Monthly Calculator.",
    difficulty: 2,
    seedKey: "clf-c02-q-064",
    sourceRef: "AWS Pricing Calculator",
  },
];
