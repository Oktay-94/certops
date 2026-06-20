// src/db/seed/questions/clf-c02-q-cloud-tech-1.ts

import type { NewQuestion } from "../../schema";

export const clfC02QCloudTech1: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Was ist Amazon EC2?",
    choices: [
      { id: "A", text: "Ein Objektspeicher-Service" },
      { id: "B", text: "Ein Service für virtuelle Server (Recheninstanzen) in der Cloud" },
      { id: "C", text: "Ein verwalteter Datenbank-Service" },
      { id: "D", text: "Ein Content Delivery Network" },
    ],
    correct: ["B"],
    explanation:
      "Amazon EC2 (Elastic Compute Cloud) stellt virtuelle Server (Instanzen) bereit, auf denen Anwendungen laufen. Der Kunde wählt Instanztyp, Betriebssystem und Größe.",
    difficulty: 1,
    seedKey: "clf-c02-q-119",
    sourceRef: "AWS EC2 Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen führt einen unterbrechbaren Batch-Verarbeitungsjob aus, der flexibel zu beliebiger Zeit laufen kann. Welches EC2-Pricing-Modell ist am kostengünstigsten?",
    choices: [
      { id: "A", text: "On-Demand Instances" },
      { id: "B", text: "Reserved Instances" },
      { id: "C", text: "Spot Instances" },
      { id: "D", text: "Dedicated Hosts" },
    ],
    correct: ["C"],
    explanation:
      "Spot Instances bieten die größten Rabatte (bis ~90%), können aber mit kurzer Vorwarnung zurückgenommen werden. Für unterbrechbare, fehlertolerante Workloads wie Batch-Jobs sind sie ideal.",
    difficulty: 2,
    seedKey: "clf-c02-q-120",
    sourceRef: "AWS EC2 Pricing",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung läuft 24/7 mit konstanter, vorhersehbarer Last über die nächsten drei Jahre. Welches EC2-Pricing-Modell senkt die Kosten am stärksten?",
    choices: [
      { id: "A", text: "On-Demand Instances" },
      { id: "B", text: "Reserved Instances bzw. Savings Plans" },
      { id: "C", text: "Spot Instances" },
      { id: "D", text: "Es gibt keinen Unterschied im Preis" },
    ],
    correct: ["B"],
    explanation:
      "Bei konstanter, vorhersehbarer Last über 1–3 Jahre bieten Reserved Instances bzw. Savings Plans erhebliche Rabatte gegenüber On-Demand, im Austausch für eine Nutzungsverpflichtung.",
    difficulty: 2,
    seedKey: "clf-c02-q-121",
    sourceRef: "AWS EC2 Pricing",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche der folgenden sind gültige EC2-Pricing-Modelle? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "On-Demand Instances" },
      { id: "B", text: "Prepaid Storage Instances" },
      { id: "C", text: "Spot Instances" },
      { id: "D", text: "Elastic Cache Instances" },
      { id: "E", text: "Global Transfer Instances" },
    ],
    correct: ["A", "C"],
    explanation:
      "Die EC2-Pricing-Modelle sind On-Demand, Reserved Instances, Savings Plans, Spot Instances und Dedicated Hosts. On-Demand und Spot gehören dazu; die übrigen Optionen existieren nicht.",
    difficulty: 2,
    seedKey: "clf-c02-q-122",
    sourceRef: "AWS EC2 Pricing",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service führt Code als Reaktion auf Ereignisse aus, ohne dass Server bereitgestellt oder verwaltet werden müssen?",
    choices: [
      { id: "A", text: "Amazon EC2" },
      { id: "B", text: "AWS Lambda" },
      { id: "C", text: "Amazon S3" },
      { id: "D", text: "Amazon RDS" },
    ],
    correct: ["B"],
    explanation:
      "AWS Lambda ist ein serverloser Compute-Service: Code läuft als Reaktion auf Ereignisse, ohne dass man Server verwaltet. Man zahlt nur für die tatsächliche Ausführungszeit und Anzahl der Aufrufe.",
    difficulty: 1,
    seedKey: "clf-c02-q-123",
    sourceRef: "AWS Lambda Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine kleine Funktion soll nur dann laufen, wenn eine Datei in S3 hochgeladen wird — kurz, ereignisgesteuert, ohne dauerhaften Server. Was ist die passendste Wahl?",
    choices: [
      { id: "A", text: "Eine dauerhaft laufende EC2-Instanz" },
      { id: "B", text: "AWS Lambda" },
      { id: "C", text: "Amazon Redshift" },
      { id: "D", text: "AWS Direct Connect" },
    ],
    correct: ["B"],
    explanation:
      "Für kurze, ereignisgesteuerte Aufgaben ohne dauerhaften Serverbedarf ist Lambda ideal — es wird durch das S3-Upload-Event ausgelöst und man zahlt nur für die kurze Ausführung.",
    difficulty: 2,
    seedKey: "clf-c02-q-124",
    sourceRef: "AWS Lambda Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service ermöglicht das Ausführen von Containern, ohne die zugrundeliegenden Server (EC2-Instanzen) selbst verwalten zu müssen?",
    choices: [
      { id: "A", text: "AWS Fargate" },
      { id: "B", text: "Amazon EBS" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "AWS Fargate ist eine serverlose Compute-Engine für Container (mit ECS oder EKS), bei der man keine EC2-Instanzen verwaltet. AWS kümmert sich um die zugrundeliegende Infrastruktur.",
    difficulty: 2,
    seedKey: "clf-c02-q-125",
    sourceRef: "AWS Fargate Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Welche Aussage beschreibt Amazon S3 am besten?",
    choices: [
      { id: "A", text: "Ein Block-Speicher, der an eine einzelne EC2-Instanz angehängt wird" },
      { id: "B", text: "Ein skalierbarer Objektspeicher für Dateien, Bilder und Backups" },
      { id: "C", text: "Eine relationale Datenbank" },
      { id: "D", text: "Ein DNS-Service" },
    ],
    correct: ["B"],
    explanation:
      "Amazon S3 (Simple Storage Service) ist ein hoch skalierbarer Objektspeicher für beliebige Dateien (Objekte) wie Bilder, Videos, Backups — mit sehr hoher Haltbarkeit.",
    difficulty: 1,
    seedKey: "clf-c02-q-126",
    sourceRef: "AWS S3 Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen muss Daten langfristig archivieren, auf die nur selten und mit Verzögerung zugegriffen wird, zu möglichst niedrigen Kosten. Welche S3-Speicherklasse passt?",
    choices: [
      { id: "A", text: "S3 Standard" },
      { id: "B", text: "S3 Glacier / Glacier Deep Archive" },
      { id: "C", text: "S3 Standard-Infrequent Access für tägliche Zugriffe" },
      { id: "D", text: "Amazon EBS" },
    ],
    correct: ["B"],
    explanation:
      "S3 Glacier und Glacier Deep Archive sind für selten benötigte Langzeitarchivierung zu sehr niedrigen Kosten gedacht — im Austausch für längere Abrufzeiten.",
    difficulty: 2,
    seedKey: "clf-c02-q-127",
    sourceRef: "AWS S3 Storage Classes",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche Aussagen über S3, EBS und EFS sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "S3 ist ein Objektspeicher" },
      { id: "B", text: "EBS ist ein Objektspeicher für statische Webseiten" },
      { id: "C", text: "EFS ist ein Dateisystem, das von mehreren EC2-Instanzen gleichzeitig genutzt werden kann" },
      { id: "D", text: "S3 wird als einzelnes Block-Volume an eine Instanz angehängt" },
      { id: "E", text: "EBS kann von beliebig vielen Instanzen über Regionen hinweg gleichzeitig gemountet werden" },
    ],
    correct: ["A", "C"],
    explanation:
      "S3 ist Objektspeicher; EFS ist ein gemeinsam nutzbares Dateisystem (mehrere Instanzen gleichzeitig); EBS ist Block-Speicher, der typischerweise an eine Instanz in derselben AZ angehängt wird.",
    difficulty: 2,
    seedKey: "clf-c02-q-128",
    sourceRef: "AWS Storage Comparison",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service stellt Block-Speicher bereit, der wie eine virtuelle Festplatte an eine EC2-Instanz angehängt wird?",
    choices: [
      { id: "A", text: "Amazon S3" },
      { id: "B", text: "Amazon EBS" },
      { id: "C", text: "Amazon CloudFront" },
      { id: "D", text: "Amazon SQS" },
    ],
    correct: ["B"],
    explanation:
      "Amazon EBS (Elastic Block Store) liefert persistente Block-Speicher-Volumes, die wie Festplatten an EC2-Instanzen angehängt werden (innerhalb derselben Availability Zone).",
    difficulty: 1,
    seedKey: "clf-c02-q-129",
    sourceRef: "AWS EBS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Mehrere EC2-Instanzen müssen gleichzeitig auf dasselbe Dateisystem zugreifen können. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon EBS" },
      { id: "B", text: "Amazon EFS (Elastic File System)" },
      { id: "C", text: "Amazon Redshift" },
      { id: "D", text: "AWS Lambda" },
    ],
    correct: ["B"],
    explanation:
      "Amazon EFS ist ein verwaltetes, gemeinsam nutzbares Dateisystem (NFS), auf das mehrere EC2-Instanzen gleichzeitig zugreifen können — anders als EBS, das typischerweise an eine Instanz gebunden ist.",
    difficulty: 2,
    seedKey: "clf-c02-q-130",
    sourceRef: "AWS EFS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Wie kann man in Amazon S3 automatisch ältere Objekte in günstigere Speicherklassen verschieben oder löschen lassen?",
    choices: [
      { id: "A", text: "Mit einer S3 Lifecycle Policy" },
      { id: "B", text: "Mit einer Security Group" },
      { id: "C", text: "Mit einem CloudFront Distribution" },
      { id: "D", text: "Mit einer Reserved Instance" },
    ],
    correct: ["A"],
    explanation:
      "Eine S3 Lifecycle Policy automatisiert das Verschieben von Objekten in günstigere Speicherklassen (z.B. nach Glacier) oder deren Löschen nach festgelegten Regeln — spart Kosten.",
    difficulty: 2,
    seedKey: "clf-c02-q-131",
    sourceRef: "AWS S3 Lifecycle",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service stellt eine verwaltete relationale Datenbank bereit und übernimmt Patching, Backups und Failover?",
    choices: [
      { id: "A", text: "Amazon DynamoDB" },
      { id: "B", text: "Amazon RDS" },
      { id: "C", text: "Amazon S3" },
      { id: "D", text: "Amazon ElastiCache" },
    ],
    correct: ["B"],
    explanation:
      "Amazon RDS (Relational Database Service) ist eine verwaltete relationale Datenbank (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2). AWS übernimmt Verwaltung, Patching, Backups und Failover.",
    difficulty: 1,
    seedKey: "clf-c02-q-132",
    sourceRef: "AWS RDS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung benötigt eine hochskalierbare NoSQL-Datenbank mit konstant niedriger Latenz und flexiblem Schema für Millionen von Anfragen. Welcher Service passt?",
    choices: [
      { id: "A", text: "Amazon DynamoDB" },
      { id: "B", text: "Amazon RDS" },
      { id: "C", text: "Amazon Redshift" },
      { id: "D", text: "Amazon Aurora" },
    ],
    correct: ["A"],
    explanation:
      "Amazon DynamoDB ist eine serverlose NoSQL-Datenbank mit einstelliger Millisekunden-Latenz und automatischer Skalierung — ideal für massive, einfache Zugriffsmuster mit flexiblem Schema.",
    difficulty: 2,
    seedKey: "clf-c02-q-133",
    sourceRef: "AWS DynamoDB Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welche AWS-Datenbank ist mit MySQL und PostgreSQL kompatibel und bietet deutlich höhere Performance als die Standard-Engines?",
    choices: [
      { id: "A", text: "Amazon DynamoDB" },
      { id: "B", text: "Amazon Aurora" },
      { id: "C", text: "Amazon ElastiCache" },
      { id: "D", text: "Amazon Neptune" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Aurora ist eine cloud-native relationale Datenbank, kompatibel mit MySQL und PostgreSQL, mit deutlich höherer Performance und automatischer 6-facher Replikation über 3 Availability Zones.",
    difficulty: 2,
    seedKey: "clf-c02-q-134",
    sourceRef: "AWS Aurora Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Worin unterscheiden sich RDS Multi-AZ und Read Replicas in ihrem Hauptzweck?",
    choices: [
      { id: "A", text: "Multi-AZ dient der Hochverfügbarkeit/Failover, Read Replicas dienen der Lese-Skalierung" },
      { id: "B", text: "Beide dienen ausschließlich der Kostensenkung" },
      { id: "C", text: "Multi-AZ skaliert Lesezugriffe, Read Replicas sind nur für Backups" },
      { id: "D", text: "Es gibt keinen Unterschied" },
    ],
    correct: ["A"],
    explanation:
      "Multi-AZ stellt einen synchronen Standby in einer anderen AZ für automatischen Failover bereit (Hochverfügbarkeit). Read Replicas sind asynchrone, lesbare Kopien zur Verteilung der Leselast (Skalierung).",
    difficulty: 2,
    seedKey: "clf-c02-q-135",
    sourceRef: "AWS RDS High Availability",
  },
];
