import type { NewQuestion } from "../schema";

export const cloudConceptsQuestions: NewQuestion[] = [
  // ── Cloud Concepts (K1 initial) ──
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
    seedKey: "clf-c02-q-001",
    sourceRef: "AWS Exam Guide CLF-C02, Domain 1.1",
  },

  // ── Cloud Concepts (+6) ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welcher Vorteil des Cloud Computing beschreibt am besten den Wechsel von Vorab-Investitionen in Hardware hin zu nutzungsbasierter Abrechnung nach tatsächlichem Verbrauch?",
    choices: [
      { id: "A", text: "Elasticity" },
      { id: "B", text: "High Availability" },
      { id: "C", text: "Trade capital expense for variable expense" },
      { id: "D", text: "Fault Tolerance" },
    ],
    correct: ["C"],
    explanation:
      "'Trade capital expense for variable expense' ist einer der sechs offiziellen AWS Cloud-Vorteile. Statt vorab Server zu kaufen (CapEx, Investitionsausgaben) zahlt man nur was man verbraucht (OpEx, Betriebskosten). Elasticity ist das automatische Skalieren nach Last, High Availability bezieht sich auf Uptime, Fault Tolerance auf Weiterbetrieb bei Ausfällen.",
    difficulty: 1,
    seedKey: "clf-c02-q-002",
    sourceRef: "AWS Whitepaper 'Overview of Amazon Web Services' — Six Advantages of Cloud Computing",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Welche zwei Säulen (Pillars) gehören zum AWS Well-Architected Framework? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Operational Excellence" },
      { id: "B", text: "Rapid Deployment" },
      { id: "C", text: "Sustainability" },
      { id: "D", text: "Cost Minimization" },
      { id: "E", text: "Vendor Lock-in Prevention" },
    ],
    correct: ["A", "C"],
    explanation:
      "Das AWS Well-Architected Framework besteht aus sechs Säulen: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization und Sustainability. Sustainability wurde 2021 als sechste Säule hinzugefügt. 'Rapid Deployment' und 'Vendor Lock-in Prevention' sind keine Säulen. 'Cost Minimization' klingt ähnlich wie 'Cost Optimization', ist aber nicht die offizielle Bezeichnung.",
    difficulty: 2,
    seedKey: "clf-c02-q-003",
    sourceRef: "AWS Well-Architected Framework Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen plant, eine bestehende On-Premises-Anwendung in die AWS Cloud zu verlagern. Sie möchten die Anwendung ohne Änderungen am Code 'wie sie ist' auf EC2-Instanzen verschieben, um schnell zu migrieren. Welche der 7 Migrations-Strategien (7 Rs) wird hier angewandt?",
    choices: [
      { id: "A", text: "Replatform" },
      { id: "B", text: "Refactor" },
      { id: "C", text: "Rehost" },
      { id: "D", text: "Repurchase" },
    ],
    correct: ["C"],
    explanation:
      "'Rehost' (auch 'Lift-and-Shift') bedeutet, eine Anwendung ohne Code-Änderungen auf AWS zu verschieben, typischerweise auf EC2-Instanzen. Schnellste Migrationsstrategie. Replatform = kleinere Optimierungen (z. B. MySQL → RDS), Refactor = kompletter Umbau auf cloud-native Architektur, Repurchase = Wechsel zu SaaS. Die 7 Rs: Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor.",
    difficulty: 2,
    seedKey: "clf-c02-q-004",
    sourceRef: "AWS Cloud Adoption Framework / Migration Strategies Whitepaper",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Was ist der Hauptunterschied zwischen einer AWS Region und einer Availability Zone (AZ)?",
    choices: [
      {
        id: "A",
        text: "Eine Region ist ein physisches Rechenzentrum, eine AZ ist ein virtuelles Server-Cluster.",
      },
      {
        id: "B",
        text: "Eine Region besteht aus mehreren AZs an unterschiedlichen, geografisch isolierten Standorten innerhalb eines geografischen Gebiets.",
      },
      {
        id: "C",
        text: "AZs sind weltweit, Regions sind nur auf bestimmte Länder beschränkt.",
      },
      {
        id: "D",
        text: "Es gibt keinen technischen Unterschied — beide Begriffe werden synonym verwendet.",
      },
    ],
    correct: ["B"],
    explanation:
      "Eine AWS Region ist ein geografisches Gebiet (z. B. eu-central-1 Frankfurt). Jede Region besteht aus mindestens drei Availability Zones. Eine AZ ist ein oder mehrere physisch getrennte Rechenzentren mit eigener Stromversorgung, Kühlung und Netzwerk innerhalb derselben Region, aber an unterschiedlichen geografischen Standorten. Die AZs sind über Low-Latency-Glasfaser verbunden, aber so weit getrennt, dass Naturkatastrophen oder Stromausfälle nicht alle gleichzeitig treffen.",
    difficulty: 2,
    seedKey: "clf-c02-q-005",
    sourceRef: "AWS Global Infrastructure Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche der folgenden Aussagen beschreibt am besten den Vorteil 'Economies of Scale' beim Einsatz der AWS Cloud?",
    choices: [
      {
        id: "A",
        text: "AWS-Kunden können ihre Hardware selbst betreiben und so eigene Skaleneffekte nutzen.",
      },
      {
        id: "B",
        text: "Durch die Bündelung der Nachfrage von Millionen von Kunden kann AWS die Kosten pro Einheit senken und diese Einsparungen an die Kunden weitergeben.",
      },
      {
        id: "C",
        text: "Jeder AWS-Kunde erhält denselben Festpreis, unabhängig von der Nutzung.",
      },
      {
        id: "D",
        text: "Economies of Scale bedeutet, dass nur Großunternehmen wirtschaftlich von AWS profitieren können.",
      },
    ],
    correct: ["B"],
    explanation:
      "'Massive economies of scale' ist einer der sechs offiziellen AWS Cloud-Vorteile. Da AWS die Nachfrage von Millionen Kunden bündelt, können Server, Strom, Netzwerk und Personal in Größenordnungen eingekauft werden, die einzelne Unternehmen nie erreichen könnten. Diese Effizienz-Gewinne gibt AWS in Form niedrigerer Preise weiter. Gerade kleine Unternehmen und Startups profitieren überproportional.",
    difficulty: 1,
    seedKey: "clf-c02-q-006",
    sourceRef: "AWS Whitepaper 'Overview of Amazon Web Services' — Six Advantages of Cloud Computing",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Entwickler möchte statische Inhalte (Bilder, JavaScript, CSS) weltweit mit niedriger Latenz an Endnutzer ausliefern. Welche AWS-Komponente erfüllt diese Aufgabe durch geografisch verteilte Caching-Server in der Nähe der Nutzer?",
    choices: [
      { id: "A", text: "Regions" },
      { id: "B", text: "Availability Zones" },
      { id: "C", text: "Edge Locations" },
      { id: "D", text: "Local Zones" },
    ],
    correct: ["C"],
    explanation:
      "Edge Locations sind Teil des globalen AWS-Netzwerks und dienen primär als Caching-Punkte für Amazon CloudFront (CDN) und Route 53 (DNS). Sie sind in mehr Städten verfügbar als Regionen. Inhalte werden vom Origin (z. B. S3-Bucket in einer Region) an die Edge Location nahe des Nutzers ausgeliefert und dort gecacht. Regions sind geografische Gebiete für Hauptdienste, AZs sind für Hochverfügbarkeit innerhalb einer Region, Local Zones erweitern eine Region in eine bestimmte Stadt für niedrige Latenz.",
    difficulty: 2,
    seedKey: "clf-c02-q-007",
    sourceRef: "AWS Global Infrastructure Documentation, Amazon CloudFront Documentation",
  },

  // ── Cloud Concepts (Snowball, ursprünglich in K1-CT-Block, getaggt als CC) ──
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen muss 100 TB Daten aus einem On-Premises-Rechenzentrum in AWS migrieren. Die verfügbare Internet-Bandbreite ist begrenzt (ca. 100 Mbps), und der Transfer über das Internet würde Wochen dauern. Welche AWS-Lösung ist am besten geeignet?",
    choices: [
      {
        id: "A",
        text: "AWS Direct Connect — eine dedizierte Netzwerkverbindung zu AWS",
      },
      {
        id: "B",
        text: "AWS Snowball Edge — physisches Speichergerät, das per Spedition verschickt wird",
      },
      { id: "C", text: "AWS DataSync über das öffentliche Internet" },
      { id: "D", text: "Manueller Upload via AWS Management Console" },
    ],
    correct: ["B"],
    explanation:
      "AWS Snowball Edge: gehärtetes, verschlüsseltes Speichergerät per Spedition, Daten lokal aufspielen, zurückschicken, AWS lädt in S3. Storage Optimized ~80 TB, Compute Optimized ~42 TB + EC2 on-device. Direct Connect = dedizierte Netzwerkverbindung für laufenden Transfer, Aufbau dauert Wochen, nicht für einmalige Migration. DataSync über Internet bei 100 Mbps = ~33 Tage für 100 TB. Manueller Console-Upload = absurd bei 100 TB.",
    difficulty: 2,
    seedKey: "clf-c02-q-008",
    sourceRef: "AWS Snow Family, AWS Direct Connect Documentation",
  },

  // ── K2 — Cloud Concepts (+11) ──

  // 1.1 Benefits — HA vs Elasticity
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Eine E-Commerce-Anwendung muss bei Black-Friday-Lastspitzen automatisch mehr EC2-Instanzen starten und nach den Spitzen wieder abbauen. Welcher Cloud-Vorteil beschreibt diese Fähigkeit am besten?",
    choices: [
      { id: "A", text: "High Availability" },
      { id: "B", text: "Elasticity" },
      { id: "C", text: "Durability" },
      { id: "D", text: "Fault Tolerance" },
    ],
    correct: ["B"],
    explanation:
      "Elasticity beschreibt das dynamische Hoch- und Herunterskalieren von Ressourcen nach Bedarf — exakt das Black-Friday-Szenario. High Availability zielt auf Uptime/Verfügbarkeit (mehrere AZs), nicht auf Skalierung. Durability bezieht sich auf Datenerhalt (z. B. S3 mit 11 Neunen). Fault Tolerance ist die Fähigkeit, trotz Komponentenausfall weiterzuarbeiten — auch nicht das Kernthema beim Skalieren.",
    difficulty: 1,
    seedKey: "clf-c02-q-009",
    sourceRef: "AWS Whitepaper 'Overview of Amazon Web Services' — Six Advantages of Cloud Computing",
  },

  // 1.2 Well-Architected — Operational Excellence
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Eine Säule des AWS Well-Architected Framework konzentriert sich darauf, Workloads effizient zu betreiben, Operations als Code zu behandeln und Anpassungen häufig und in kleinen, reversiblen Schritten vorzunehmen. Um welche Säule handelt es sich?",
    choices: [
      { id: "A", text: "Reliability" },
      { id: "B", text: "Performance Efficiency" },
      { id: "C", text: "Operational Excellence" },
      { id: "D", text: "Cost Optimization" },
    ],
    correct: ["C"],
    explanation:
      "Operational Excellence umfasst Design-Prinzipien wie 'Perform operations as code' (Infrastructure as Code), 'Make frequent, small, reversible changes', 'Refine operations procedures frequently', 'Anticipate failure' und 'Learn from operational events'. Reliability fokussiert auf Wiederherstellung nach Ausfällen, Performance Efficiency auf optimale Ressourcennutzung, Cost Optimization auf Kostenvermeidung — alle wichtig, aber das Operations-as-Code-Prinzip ist Operational Excellence.",
    difficulty: 2,
    seedKey: "clf-c02-q-010",
    sourceRef: "AWS Well-Architected Framework — Operational Excellence Pillar",
  },

  // 1.2 Well-Architected — Sustainability
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Säule des AWS Well-Architected Framework wurde 2021 als sechste Säule hinzugefügt und behandelt die Minimierung der Umweltauswirkungen beim Betrieb von Cloud-Workloads?",
    choices: [
      { id: "A", text: "Performance Efficiency" },
      { id: "B", text: "Sustainability" },
      { id: "C", text: "Cost Optimization" },
      { id: "D", text: "Reliability" },
    ],
    correct: ["B"],
    explanation:
      "Sustainability ist die jüngste Säule (re:Invent 2021). Sie zielt auf die Reduktion der Umweltauswirkungen — durch Auswahl effizienter Regionen (Carbon-Footprint pro Region), Rightsizing, Nutzung serverless/managed Services (höhere Auslastung der AWS-Hardware), Reduktion ungenutzter Ressourcen. Die anderen fünf Säulen: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization — alle älter.",
    difficulty: 1,
    seedKey: "clf-c02-q-011",
    sourceRef: "AWS Well-Architected Framework — Sustainability Pillar (added 2021)",
  },

  // 1.2 Well-Architected — Multi: 2 Säulen für Szenario
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "multiple",
    prompt:
      "Ein Unternehmen plant eine Workload, die durch Auto-Scaling über mehrere Availability Zones läuft, mit täglichen Backups und automatisierter Wiederherstellung nach Ausfällen. Welche zwei Säulen des Well-Architected Framework adressieren diese Anforderungen am DIREKTESTEN? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Reliability" },
      { id: "B", text: "Cost Optimization" },
      { id: "C", text: "Performance Efficiency" },
      { id: "D", text: "Sustainability" },
      { id: "E", text: "Operational Excellence" },
    ],
    correct: ["A", "E"],
    explanation:
      "Reliability adressiert Wiederherstellbarkeit nach Ausfällen, Multi-AZ-Verteilung, Backup/Restore, automatisches Recovery. Operational Excellence deckt die Automatisierung von Backups und Recovery-Prozessen als Code ab. Cost Optimization, Performance Efficiency und Sustainability sind nicht die Hauptthemen dieses Szenarios. Hinweis: jede Architektur berührt mehrere Säulen — hier sind Reliability und Operational Excellence die DIREKTESTEN.",
    difficulty: 2,
    seedKey: "clf-c02-q-012",
    sourceRef: "AWS Well-Architected Framework — Reliability and Operational Excellence Pillars",
  },

  // 1.3 Migration — AWS CAF Perspectives
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Das AWS Cloud Adoption Framework (AWS CAF) gruppiert seine Fähigkeiten in mehrere 'Perspectives', die jeweils unterschiedliche Stakeholder-Gruppen ansprechen. Welche der folgenden Listen entspricht den OFFIZIELLEN sechs CAF-Perspectives?",
    choices: [
      { id: "A", text: "Strategy, Innovation, Operations, Security, Compliance, Finance" },
      { id: "B", text: "Business, People, Governance, Platform, Security, Operations" },
      { id: "C", text: "Plan, Build, Run, Secure, Optimize, Migrate" },
      { id: "D", text: "Compute, Storage, Network, Database, Security, Analytics" },
    ],
    correct: ["B"],
    explanation:
      "Die sechs CAF-Perspectives sind: Business (Strategie/Outcomes), People (Kultur/Skills), Governance (Risiko/Compliance), Platform (Architektur/Engineering), Security (Sicherheits-Capabilities) und Operations (Service Delivery). CAF läuft in vier Phasen (Envision, Align, Launch, Scale) und deckt 47 Capabilities über die 6 Perspectives ab. Die anderen Optionen sind erfunden oder mischen Konzepte mit anderen Frameworks.",
    difficulty: 2,
    seedKey: "clf-c02-q-013",
    sourceRef: "AWS Cloud Adoption Framework Documentation",
  },

  // 1.3 Migration — Refactor vs Replatform
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen möchte eine bestehende, monolithische On-Premises-Anwendung in eine cloud-native Microservices-Architektur umbauen, die serverless auf AWS Lambda und Amazon DynamoDB läuft. Welche der 7-Rs-Migrations-Strategien beschreibt diesen Ansatz am besten?",
    choices: [
      { id: "A", text: "Rehost (Lift-and-Shift)" },
      { id: "B", text: "Replatform (Lift-and-Reshape)" },
      { id: "C", text: "Refactor (Re-Architect)" },
      { id: "D", text: "Repurchase" },
    ],
    correct: ["C"],
    explanation:
      "Refactor (auch 'Re-Architect') bedeutet, eine Anwendung grundlegend cloud-native umzubauen — z. B. Monolith → Microservices, EC2 → Lambda, SQL → DynamoDB. Höchster Aufwand, höchster langfristiger Nutzen. Rehost = ohne Code-Änderungen verschieben (EC2). Replatform = kleinere Optimierungen (z. B. MySQL → RDS), aber kein Architektur-Umbau. Repurchase = Wechsel zu SaaS (z. B. Salesforce statt eigenem CRM).",
    difficulty: 2,
    seedKey: "clf-c02-q-014",
    sourceRef: "AWS Migration Strategies — 7 Rs Framework",
  },

  // 1.4 Economics — Fixed vs Variable Cost
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welche Aussage beschreibt am besten, warum AWS Cloud-Nutzung typischerweise als 'Variable Expense' (variable Kosten) und nicht als 'Capital Expense' (Investitionsausgabe) eingeordnet wird?",
    choices: [
      { id: "A", text: "Weil AWS-Rechnungen jeden Monat denselben Festbetrag aufweisen." },
      { id: "B", text: "Weil Kunden für die tatsächliche Nutzung zahlen und keine Hardware vorab kaufen müssen." },
      { id: "C", text: "Weil AWS-Services nur dann verfügbar sind, wenn der Kunde monatlich einen Pauschalbetrag zahlt." },
      { id: "D", text: "Weil Kunden physische Hardware in einem AWS-Rechenzentrum besitzen, aber gemeinsam nutzen." },
    ],
    correct: ["B"],
    explanation:
      "Cloud-Nutzung ist Variable Expense (OpEx), weil Kunden nur für tatsächlich verbrauchte Ressourcen zahlen — keine Vorab-Investition in Server, Rechenzentren, Klimatisierung. Variable Kosten skalieren mit der Nutzung. CapEx bedeutet großen Vorab-Kauf physischer Assets, die über mehrere Jahre abgeschrieben werden — das klassische Modell von On-Premises. AWS dreht das um: kein Vorab-Kauf, granulare Abrechnung, sofortige Anpassung an Bedarf.",
    difficulty: 1,
    seedKey: "clf-c02-q-015",
    sourceRef: "AWS Whitepaper 'Overview of Amazon Web Services' — Six Advantages of Cloud Computing",
  },

  // 1.4 Economics — BYOL
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen besitzt bereits gültige Windows-Server-Lizenzen mit Software Assurance und möchte diese auf EC2-Dedicated-Hosts weiterverwenden, anstatt erneut für die Lizenzierung über AWS zu zahlen. Welches Lizenzmodell ermöglicht das?",
    choices: [
      { id: "A", text: "License Included" },
      { id: "B", text: "Bring Your Own License (BYOL)" },
      { id: "C", text: "AWS License Manager Free Tier" },
      { id: "D", text: "Reserved Instance Discount" },
    ],
    correct: ["B"],
    explanation:
      "BYOL erlaubt es, vorhandene Lizenzen (z. B. Windows Server, SQL Server, Oracle) auf AWS weiterzuverwenden — typisch auf Dedicated Hosts wegen Hardware-Affinität. 'License Included' = AWS legt die Lizenzkosten auf den Stundenpreis um (kein vorhandener Vertrag nötig, aber teurer). AWS License Manager hilft beim Tracken, ist aber kein Lizenzmodell selbst. Reserved Instance Discount betrifft Compute-Kapazität, nicht Software-Lizenzen.",
    difficulty: 2,
    seedKey: "clf-c02-q-016",
    sourceRef: "AWS License Manager / BYOL Documentation",
  },

  // 1.4 Economics — Rightsizing
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Was bedeutet der Begriff 'Rightsizing' im Kontext von AWS Cloud-Ökonomie?",
    choices: [
      { id: "A", text: "Den höchsten verfügbaren EC2-Instanz-Typ wählen, um maximale Performance sicherzustellen." },
      { id: "B", text: "EC2-Instanzen automatisch nach Last hoch- und herunterskalieren." },
      { id: "C", text: "Den am besten passenden Instanz-Typ und die optimale Größe für eine Workload auswählen, basierend auf tatsächlicher CPU-, RAM- und Netzwerk-Nutzung." },
      { id: "D", text: "Alle EC2-Instanzen in derselben Region zentralisieren, um Kosten zu sparen." },
    ],
    correct: ["C"],
    explanation:
      "Rightsizing bedeutet, jede Workload mit dem am besten passenden Instance-Typ (compute-/memory-/storage-optimiert) und der minimal nötigen Größe zu betreiben — basierend auf gemessener Auslastung. Über-provisionierte Instanzen sind die häufigste Quelle vermeidbarer Cloud-Kosten. AWS Compute Optimizer und Cost Explorer geben Rightsizing-Empfehlungen. Größtmöglich wählen (A) verschwendet Geld. Auto-Skalieren (B) ist Elasticity. Zentralisieren in einer Region (D) ist keine etablierte Rightsizing-Strategie.",
    difficulty: 2,
    seedKey: "clf-c02-q-017",
    sourceRef: "AWS Cost Optimization Pillar / AWS Compute Optimizer",
  },

  // 1.4 Economics — CloudFormation Automation Benefit
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Welcher Vorteil von AWS CloudFormation trägt direkt zur Kostenkontrolle und Wirtschaftlichkeit von Cloud-Workloads bei?",
    choices: [
      { id: "A", text: "CloudFormation gibt automatisch Volumenrabatte auf alle erstellten Ressourcen." },
      { id: "B", text: "CloudFormation ermöglicht reproduzierbares, automatisiertes Provisioning, wodurch manuelle Fehler und 'vergessene' (weiterlaufende, ungenutzte) Ressourcen reduziert werden." },
      { id: "C", text: "CloudFormation ist günstiger als die AWS Management Console und reduziert dadurch die Service-Kosten." },
      { id: "D", text: "CloudFormation ersetzt EC2 durch Lambda-Funktionen, was immer kostengünstiger ist." },
    ],
    correct: ["B"],
    explanation:
      "CloudFormation (Infrastructure as Code) macht Provisioning reproduzierbar, versionierbar und automatisierbar. Vorteile für die Wirtschaftlichkeit: weniger manuelle Fehler, einheitliche Umgebungen (Dev/Stage/Prod), einfaches Aufräumen ungenutzter Ressourcen via 'delete-stack', kein 'Cost-Drift' durch handgeklickte Test-Ressourcen. CloudFormation selbst ist kostenlos — Kosten entstehen nur durch die provisionierten Ressourcen. Volumenrabatte (A) sind kein CloudFormation-Feature. Console vs IaC (C) hat keinen Preisunterschied. EC2 → Lambda (D) ist eine Architektur-Entscheidung, kein CloudFormation-Feature.",
    difficulty: 2,
    seedKey: "clf-c02-q-018",
    sourceRef: "AWS CloudFormation Documentation",
  },

  // 3.2 Global Infra — Multi-Region DR (DB-getaggt als Cloud Concepts, konsistent mit Whizlabs-Konvention)
  {
    cert: "CLF-C02",
    domain: "Cloud Concepts",
    type: "single",
    prompt:
      "Ein Unternehmen möchte sicherstellen, dass eine kritische Webanwendung auch dann erreichbar bleibt, wenn eine GANZE AWS-Region (z. B. eu-central-1) komplett ausfällt. Welche Architektur erfüllt diese Anforderung?",
    choices: [
      { id: "A", text: "Deployment in mehreren Availability Zones derselben Region" },
      { id: "B", text: "Deployment in mehreren AWS-Regionen mit Route 53 Failover-Routing" },
      { id: "C", text: "Mehrere EC2-Instanzen in derselben Availability Zone" },
      { id: "D", text: "Tägliche Snapshots der EBS-Volumes" },
    ],
    correct: ["B"],
    explanation:
      "Multi-Region-Deployments schützen gegen vollständige Region-Outages — z. B. Stack in eu-central-1 + Standby in eu-west-1, Route 53 Failover-Routing wechselt automatisch. Multi-AZ (A) schützt gegen AZ-Ausfälle innerhalb einer Region, aber NICHT gegen Region-weite Ausfälle. Mehrere Instanzen in einer AZ (C) ist die schwächste Variante — Single Point of Failure. Snapshots (D) ermöglichen Recovery, aber nicht laufende HA über Region-Grenzen. Hinweis: Multi-Region ist teurer und komplexer (Datenreplikation, Cross-Region-Traffic-Kosten) — wird nur für sehr kritische Workloads gemacht.",
    difficulty: 2,
    seedKey: "clf-c02-q-019",
    sourceRef: "AWS Disaster Recovery Documentation / Amazon Route 53",
  },
];
