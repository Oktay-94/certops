// src/db/seed/questions/clf-c02-q-cloud-concepts.ts

import type { NewQuestion } from "../../schema";

export const clfC02QCloudConcepts: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen wechselt von eigenen Rechenzentren in die AWS Cloud. Welche Veränderung der Kostenstruktur beschreibt diesen Wechsel am besten?",
    choices: [
      { id: "A", text: "Von variablen Kosten zu fixen Kosten" },
      { id: "B", text: "Von Investitionsausgaben (CapEx) zu Betriebsausgaben (OpEx)" },
      { id: "C", text: "Von Betriebsausgaben (OpEx) zu Investitionsausgaben (CapEx)" },
      { id: "D", text: "Die Kostenstruktur bleibt unverändert" },
    ],
    correct: ["B"],
    explanation:
      "Die Cloud verschiebt hohe Vorab-Investitionen in eigene Hardware (CapEx) hin zu nutzungsbasierten, variablen Betriebskosten (OpEx). Du zahlst nur, was du verbrauchst.",
    difficulty: 1,
    sourceRef: "AWS Cloud Economics",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welcher Cloud-Vorteil bedeutet, dass ein Unternehmen seine Kapazität nicht mehr im Voraus abschätzen muss?",
    choices: [
      { id: "A", text: "Stop guessing capacity (Kapazität nicht mehr raten)" },
      { id: "B", text: "Go global in minutes" },
      { id: "C", text: "Massive economies of scale" },
      { id: "D", text: "Trade fixed expense for variable expense" },
    ],
    correct: ["A"],
    explanation:
      "Dank elastischer Skalierung kommen Ressourcen bei Bedarf hinzu und werden bei Flaute abgebaut — man muss die Kapazität nicht mehr vorab raten und über- oder unterdimensionieren.",
    difficulty: 1,
    sourceRef: "AWS Cloud Value Framework",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Warum kann AWS niedrigere Preise anbieten, als ein einzelnes Unternehmen mit eigener Infrastruktur erreichen würde?",
    choices: [
      { id: "A", text: "AWS subventioniert die Preise dauerhaft mit Verlust" },
      { id: "B", text: "Durch Skaleneffekte (economies of scale) aufgrund der riesigen Kundenbasis" },
      { id: "C", text: "Weil AWS keine Rechenzentren betreibt" },
      { id: "D", text: "Weil Kunden die Hardware selbst kaufen müssen" },
    ],
    correct: ["B"],
    explanation:
      "AWS bündelt die Nachfrage von Millionen Kunden und erzielt dadurch massive Skaleneffekte. Diese niedrigeren Stückkosten werden in Form sinkender Preise weitergegeben.",
    difficulty: 1,
    sourceRef: "AWS Cloud Economics",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Online-Shop hat während des Weihnachtsgeschäfts enorme Lastspitzen und in der restlichen Zeit wenig Traffic. Welches Cloud-Konzept adressiert dies am besten?",
    choices: [
      { id: "A", text: "Fault Tolerance" },
      { id: "B", text: "Elastizität" },
      { id: "C", text: "Vendor Lock-in" },
      { id: "D", text: "Verschlüsselung" },
    ],
    correct: ["B"],
    explanation:
      "Elastizität ermöglicht das automatische Hoch- und Runterskalieren von Ressourcen je nach Nachfrage — bei Lastspitzen mehr, in ruhigen Zeiten weniger (und damit geringere Kosten).",
    difficulty: 1,
    sourceRef: "AWS Cloud Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Startup möchte eine Idee schnell testen, ohne wochenlang auf Hardware zu warten. Welcher Cloud-Vorteil ist hier zentral?",
    choices: [
      { id: "A", text: "Compliance" },
      { id: "B", text: "Agilität" },
      { id: "C", text: "Datenredundanz" },
      { id: "D", text: "Verschlüsselung" },
    ],
    correct: ["B"],
    explanation:
      "Agilität bedeutet, Ressourcen in Minuten bereitstellen zu können. Das ermöglicht schnelles Experimentieren mit geringem Risiko — Fehlschläge sind billig, da Ressourcen einfach wieder abgeschaltet werden.",
    difficulty: 1,
    sourceRef: "AWS Cloud Benefits",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt: "Amazon EC2 ist ein Beispiel für welches Cloud-Service-Modell?",
    choices: [
      { id: "A", text: "Software as a Service (SaaS)" },
      { id: "B", text: "Platform as a Service (PaaS)" },
      { id: "C", text: "Infrastructure as a Service (IaaS)" },
      { id: "D", text: "Function as a Service (FaaS)" },
    ],
    correct: ["C"],
    explanation:
      "EC2 stellt grundlegende Recheninfrastruktur (virtuelle Server) bereit, bei der der Kunde Betriebssystem und Anwendungen selbst verwaltet — das ist IaaS.",
    difficulty: 2,
    sourceRef: "AWS Cloud Computing Models",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen nutzt eine fertige, webbasierte E-Mail-Anwendung und verwaltet keinerlei Infrastruktur. Welches Service-Modell ist das?",
    choices: [
      { id: "A", text: "IaaS" },
      { id: "B", text: "PaaS" },
      { id: "C", text: "SaaS" },
      { id: "D", text: "On-Premises" },
    ],
    correct: ["C"],
    explanation:
      "Bei SaaS nutzt der Kunde fertige Software und verwaltet weder Infrastruktur noch Plattform. Eine webbasierte E-Mail-Anwendung ist ein klassisches SaaS-Beispiel.",
    difficulty: 1,
    sourceRef: "AWS Cloud Computing Models",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Wie erreicht man auf AWS typischerweise hohe Verfügbarkeit für eine Anwendung?",
    choices: [
      { id: "A", text: "Alle Ressourcen in einer einzigen Availability Zone bündeln" },
      { id: "B", text: "Ressourcen über mehrere Availability Zones verteilen" },
      { id: "C", text: "Nur eine große EC2-Instanz verwenden" },
      { id: "D", text: "Auf Backups verzichten, um Kosten zu sparen" },
    ],
    correct: ["B"],
    explanation:
      "Durch das Verteilen von Ressourcen über mehrere Availability Zones bleibt die Anwendung verfügbar, selbst wenn eine AZ ausfällt — das ist die Grundlage für Hochverfügbarkeit.",
    difficulty: 2,
    sourceRef: "AWS High Availability",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt: "Was unterscheidet Fault Tolerance von High Availability?",
    choices: [
      { id: "A", text: "Es gibt keinen Unterschied, beide bedeuten dasselbe" },
      { id: "B", text: "Fault Tolerance erlaubt keinerlei Unterbrechung, High Availability eine sehr kurze Erholungszeit" },
      { id: "C", text: "High Availability ist immer günstiger als Fault Tolerance" },
      { id: "D", text: "Fault Tolerance betrifft nur die Datensicherung" },
    ],
    correct: ["B"],
    explanation:
      "Fault Tolerance bedeutet, dass das System ohne spürbare Unterbrechung weiterläuft, selbst bei Komponentenausfall. High Availability erlaubt eine sehr kurze Downtime mit schneller Erholung. Fault Tolerance ist aufwändiger und teurer.",
    difficulty: 2,
    sourceRef: "AWS Reliability Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Team fügt zusätzliche EC2-Instanzen hinzu, um wachsenden Traffic zu bewältigen, statt eine einzelne Instanz zu vergrößern. Welche Skalierungsart ist das?",
    choices: [
      { id: "A", text: "Vertikale Skalierung (scale up)" },
      { id: "B", text: "Horizontale Skalierung (scale out)" },
      { id: "C", text: "Diagonale Skalierung" },
      { id: "D", text: "Statische Skalierung" },
    ],
    correct: ["B"],
    explanation:
      "Horizontale Skalierung (scale out) bedeutet, mehr Ressourcen hinzuzufügen (weitere Instanzen). Vertikale Skalierung würde eine bestehende Instanz vergrößern. Die Cloud bevorzugt horizontale Skalierung.",
    difficulty: 2,
    sourceRef: "AWS Scalability Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welches Architektur-Prinzip beschreibt das Entkoppeln von Komponenten, sodass der Ausfall einer Komponente nicht alle anderen mitreißt?",
    choices: [
      { id: "A", text: "Tight Coupling" },
      { id: "B", text: "Loose Coupling (lose Kopplung)" },
      { id: "C", text: "Vertical Scaling" },
      { id: "D", text: "Vendor Lock-in" },
    ],
    correct: ["B"],
    explanation:
      "Loose Coupling entkoppelt Komponenten (z.B. über Message Queues wie SQS), sodass ein Ausfall isoliert bleibt und nicht das gesamte System lahmlegt.",
    difficulty: 2,
    sourceRef: "AWS Architecture Best Practices",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche der folgenden gehören zu den Säulen des AWS Well-Architected Framework? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Security" },
      { id: "B", text: "Vendor Lock-in" },
      { id: "C", text: "Cost Optimization" },
      { id: "D", text: "Marketing Efficiency" },
      { id: "E", text: "Data Monetization" },
    ],
    correct: ["A", "C"],
    explanation:
      "Die 6 Säulen sind: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization und Sustainability. Security und Cost Optimization gehören dazu; die anderen Optionen sind keine Säulen.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected Framework",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Well-Architected-Säule befasst sich damit, unnötige Ausgaben zu vermeiden und Kosten transparent zu machen?",
    choices: [
      { id: "A", text: "Reliability" },
      { id: "B", text: "Performance Efficiency" },
      { id: "C", text: "Cost Optimization" },
      { id: "D", text: "Operational Excellence" },
    ],
    correct: ["C"],
    explanation:
      "Die Säule Cost Optimization fokussiert darauf, den niedrigsten Preis für den Geschäftswert zu erzielen — durch Verbrauchsmodelle, Messen der Effizienz und Vermeiden unnötiger Ausgaben.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Well-Architected-Säule wurde hinzugefügt, um die Umweltauswirkungen von Cloud-Workloads zu minimieren?",
    choices: [
      { id: "A", text: "Sustainability" },
      { id: "B", text: "Reliability" },
      { id: "C", text: "Security" },
      { id: "D", text: "Performance Efficiency" },
    ],
    correct: ["A"],
    explanation:
      "Die Sustainability-Säule (seit 2021 die sechste Säule) fokussiert auf die Minimierung des ökologischen Fußabdrucks — durch effiziente Ressourcennutzung und Reduktion des Energieverbrauchs.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche der folgenden sind Perspektiven des AWS Cloud Adoption Framework (CAF)? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Business" },
      { id: "B", text: "Marketing" },
      { id: "C", text: "Operations" },
      { id: "D", text: "Sales" },
      { id: "E", text: "Procurement" },
    ],
    correct: ["A", "C"],
    explanation:
      "Die sechs CAF-Perspektiven sind: Business, People, Governance (geschäftlich) sowie Platform, Security, Operations (technisch). Business und Operations gehören dazu.",
    difficulty: 2,
    sourceRef: "AWS Cloud Adoption Framework",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche Faktoren sollte ein Unternehmen bei der Auswahl einer AWS-Region berücksichtigen? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Compliance- und Datenschutzanforderungen" },
      { id: "B", text: "Die Lieblingsfarbe des CEOs" },
      { id: "C", text: "Latenz zu den Endnutzern" },
      { id: "D", text: "Die Anzahl der Mitarbeiter im Unternehmen" },
      { id: "E", text: "Das Gründungsjahr des Unternehmens" },
    ],
    correct: ["A", "C"],
    explanation:
      "Bei der Region-Auswahl zählen: Compliance/Datenschutz (Datenresidenz), Latenz/Nähe zu Nutzern, Service-Verfügbarkeit und Kosten. Compliance und Latenz sind hier korrekt.",
    difficulty: 2,
    sourceRef: "AWS Region Selection",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt: "Was ist eine Availability Zone (AZ)?",
    choices: [
      { id: "A", text: "Eine weltweite Sammlung aller AWS-Rechenzentren" },
      { id: "B", text: "Ein oder mehrere isolierte Rechenzentren innerhalb einer Region" },
      { id: "C", text: "Ein Standort nahe beim Nutzer nur für Content-Caching" },
      { id: "D", text: "Ein virtuelles Netzwerk in der Cloud" },
    ],
    correct: ["B"],
    explanation:
      "Eine AZ besteht aus einem oder mehreren physisch isolierten Rechenzentren innerhalb einer Region, mit eigener Strom-/Kühlungs-/Netzwerkversorgung, aber schnell mit den anderen AZs verbunden.",
    difficulty: 2,
    sourceRef: "AWS Global Infrastructure",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Wofür werden Edge Locations primär verwendet?",
    choices: [
      { id: "A", text: "Zum Speichern von Backups über mehrere Regionen" },
      { id: "B", text: "Zum Cachen und Ausliefern von Inhalten nahe beim Nutzer (CloudFront)" },
      { id: "C", text: "Zum Ausführen großer Datenbank-Workloads" },
      { id: "D", text: "Zum Trainieren von Machine-Learning-Modellen" },
    ],
    correct: ["B"],
    explanation:
      "Edge Locations sind zahlreiche Standorte nahe bei den Endnutzern, die von CloudFront (CDN) genutzt werden, um Inhalte mit niedriger Latenz auszuliefern.",
    difficulty: 2,
    sourceRef: "AWS Global Infrastructure",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt einen Teil seiner Workloads im eigenen Rechenzentrum und einen Teil in AWS, verbunden über eine sichere Leitung. Welches Deployment-Modell ist das?",
    choices: [
      { id: "A", text: "Reine Cloud" },
      { id: "B", text: "Hybrid" },
      { id: "C", text: "Reines On-Premises" },
      { id: "D", text: "Multi-Cloud" },
    ],
    correct: ["B"],
    explanation:
      "Ein hybrides Deployment kombiniert eigene On-Premises-Infrastruktur mit der Cloud, typischerweise verbunden über VPN oder Direct Connect — häufig bei Migration oder regulatorischen Anforderungen.",
    difficulty: 1,
    sourceRef: "AWS Cloud Deployment Models",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welches Prinzip empfiehlt, Systeme so zu bauen, dass sie Ausfälle einzelner Komponenten von vornherein einplanen?",
    choices: [
      { id: "A", text: "Design for Failure" },
      { id: "B", text: "Single Point of Failure" },
      { id: "C", text: "Vendor Lock-in" },
      { id: "D", text: "Manual Provisioning" },
    ],
    correct: ["A"],
    explanation:
      "'Design for Failure' geht davon aus, dass alles ausfallen kann, und baut Redundanz und automatischen Failover ein, statt zu hoffen, dass nichts kaputtgeht.",
    difficulty: 2,
    sourceRef: "AWS Architecture Best Practices",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen will seine Anwendung schnell Nutzern in mehreren Kontinenten anbieten. Welcher Cloud-Vorteil ist hier am relevantesten?",
    choices: [
      { id: "A", text: "Trade fixed expense for variable expense" },
      { id: "B", text: "Go global in minutes" },
      { id: "C", text: "Stop spending money on data centers" },
      { id: "D", text: "Economies of scale" },
    ],
    correct: ["B"],
    explanation:
      "'Go global in minutes' bedeutet, dass man Anwendungen mit wenigen Klicks in mehreren AWS-Regionen weltweit bereitstellen kann, um Nutzer mit niedriger Latenz zu bedienen.",
    difficulty: 1,
    sourceRef: "AWS Cloud Value Framework",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Was ist ein Single Point of Failure (SPOF) und warum sollte man ihn vermeiden?",
    choices: [
      { id: "A", text: "Eine einzelne Komponente, deren Ausfall das gesamte System lahmlegt; vermeiden durch Redundanz" },
      { id: "B", text: "Ein Verschlüsselungsverfahren für sensible Daten" },
      { id: "C", text: "Ein Kostenmodell für reservierte Instanzen" },
      { id: "D", text: "Ein Tool zur Überwachung von Netzwerkverkehr" },
    ],
    correct: ["A"],
    explanation:
      "Ein Single Point of Failure ist eine Komponente ohne Redundanz, deren Ausfall das ganze System stoppt. Man vermeidet ihn durch Redundanz über mehrere AZs und automatischen Failover.",
    difficulty: 2,
    sourceRef: "AWS Reliability Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welches kostenlose AWS-Tool hilft, eine Workload anhand der Well-Architected-Säulen zu bewerten und Risiken aufzuzeigen?",
    choices: [
      { id: "A", text: "AWS Cost Explorer" },
      { id: "B", text: "AWS Well-Architected Tool" },
      { id: "C", text: "AWS Trusted Advisor" },
      { id: "D", text: "Amazon CloudWatch" },
    ],
    correct: ["B"],
    explanation:
      "Das AWS Well-Architected Tool ist eine kostenlose, fragebasierte Selbstbewertung in der Konsole, die Workloads gegen die sechs Säulen prüft und Verbesserungsvorschläge liefert.",
    difficulty: 2,
    sourceRef: "AWS Well-Architected Tool",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen möchte seine On-Premises-Datenbank in die Cloud verlagern und dabei den Betrieb mit minimaler Unterbrechung aufrechterhalten. Welches AWS-Konzept/Tool unterstützt diese Migration?",
    choices: [
      { id: "A", text: "AWS Database Migration Service (DMS)" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Shield" },
      { id: "D", text: "Amazon Polly" },
    ],
    correct: ["A"],
    explanation:
      "AWS DMS migriert Datenbanken in die Cloud mit minimaler Downtime, da die Quell-Datenbank während der Migration verfügbar bleibt — passend zum Cloud-Migrations-Konzept.",
    difficulty: 2,
    sourceRef: "AWS Migration",
  },
];
