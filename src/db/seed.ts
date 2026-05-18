import { db } from "./index";
import { questions, type NewQuestion } from "./schema";

// CLF-C02 domains (AWS Exam Guide):
//   1. Cloud Concepts
//   2. Security and Compliance
//   3. Cloud Technology and Services
//   4. Billing, Pricing, and Support
const clfC02Questions: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welcher Vorteil von Cloud Computing beschreibt am besten die Möglichkeit, Rechenkapazität automatisch an die aktuelle Last anzupassen, ohne vorab Hardware kaufen zu müssen?",
    choices: [
      { id: "A", text: "High Availability" },
      { id: "B", text: "Elasticity" },
      { id: "C", text: "Fault Tolerance" },
      { id: "D", text: "Durability" },
    ],
    correct: ["B"],
    explanation:
      "Elasticity bezeichnet das automatische Skalieren von Ressourcen nach Bedarf (hoch und runter). High Availability zielt auf Uptime, Fault Tolerance auf Weiterbetrieb bei Ausfällen, Durability auf Datenerhalt (z. B. S3 11 Neunen).",
    difficulty: 1,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 1.1",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Im AWS Shared Responsibility Model — für welche der folgenden Aufgaben ist AUSSCHLIESSLICH AWS verantwortlich?",
    choices: [
      { id: "A", text: "Patchen des Gast-Betriebssystems auf einer EC2-Instanz" },
      { id: "B", text: "Konfiguration der Security Groups einer EC2-Instanz" },
      { id: "C", text: "Physische Sicherheit der AWS-Rechenzentren" },
      { id: "D", text: "Verschlüsselung von Daten in einem S3-Bucket" },
    ],
    correct: ["C"],
    explanation:
      "AWS ist für 'Security OF the Cloud' verantwortlich — dazu gehört die physische Sicherheit der Rechenzentren, Hardware und das Host-OS des Hypervisors. Gast-OS-Patches, Security Groups und Datenverschlüsselung sind Kundenaufgaben ('Security IN the Cloud').",
    difficulty: 2,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 2.1",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche zwei Maßnahmen entsprechen den AWS-IAM-Best-Practices für den Root-User eines AWS-Accounts? (Wähle ZWEI.)",
    choices: [
      { id: "A", text: "Multi-Factor Authentication (MFA) für den Root-User aktivieren" },
      { id: "B", text: "Access Keys für den Root-User erstellen und in der CI-Pipeline verwenden" },
      { id: "C", text: "Den Root-User für tägliche Verwaltungsaufgaben nutzen" },
      { id: "D", text: "Den Root-User nur für Aufgaben verwenden, die ihn zwingend erfordern" },
    ],
    correct: ["A", "D"],
    explanation:
      "Best Practice: MFA aktivieren (A) und den Root-User nur für die wenigen Aufgaben nutzen, die ihn explizit verlangen (D), z. B. Account-Schließung oder Support-Plan-Wechsel. Access Keys für Root sollen NICHT existieren, und tägliche Arbeit erfolgt über IAM-User/Roles.",
    difficulty: 2,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 2.2",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Entwickler will eine kurze Funktion (< 200 ms Laufzeit) ausführen, die nur bei eingehenden HTTP-Requests läuft. Es soll keine Server-Verwaltung anfallen und nur die tatsächliche Ausführungszeit bezahlt werden. Welcher AWS-Service passt am besten?",
    choices: [
      { id: "A", text: "Amazon EC2" },
      { id: "B", text: "AWS Lambda" },
      { id: "C", text: "Amazon ECS auf EC2" },
      { id: "D", text: "AWS Elastic Beanstalk" },
    ],
    correct: ["B"],
    explanation:
      "AWS Lambda ist serverless, event-getrieben und wird pro Ausführungszeit (ms) + Requests abgerechnet — perfekt für kurze HTTP-getriggerte Funktionen. EC2 und ECS-on-EC2 erfordern Server-Management; Elastic Beanstalk verwaltet zwar Server für dich, läuft aber dauerhaft.",
    difficulty: 2,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 3.2",
  },
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
    sourceRef: "AWS Exam Guide CLF-C02, Domain 4.1",
  },
];

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const all = [...clfC02Questions];
  if (all.length === 0) {
    console.log("No seed data defined yet — skipping insert.");
    return;
  }

  db.delete(questions).run();
  db.insert(questions).values(all).run();
  console.log(`Seeded ${all.length} question(s).`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
