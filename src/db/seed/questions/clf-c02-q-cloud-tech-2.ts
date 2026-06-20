// src/db/seed/questions/clf-c02-q-cloud-tech-2.ts

import type { NewQuestion } from "../../schema";

export const clfC02QCloudTech2: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Was ist eine Amazon VPC?",
    choices: [
      { id: "A", text: "Ein verwalteter Datenbank-Service" },
      { id: "B", text: "Ein isoliertes virtuelles Netzwerk innerhalb von AWS, das man selbst konfiguriert" },
      { id: "C", text: "Ein Content Delivery Network" },
      { id: "D", text: "Ein Tool zur Kostenanalyse" },
    ],
    correct: ["B"],
    explanation:
      "Eine Amazon VPC (Virtual Private Cloud) ist ein logisch isoliertes virtuelles Netzwerk in AWS, in dem man IP-Bereiche, Subnetze, Routing und Gateways selbst definiert.",
    difficulty: 1,
    seedKey: "clf-c02-q-136",
    sourceRef: "AWS VPC Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service übernimmt DNS (Domain-Namen-Auflösung) und Domain-Registrierung in AWS?",
    choices: [
      { id: "A", text: "Amazon Route 53" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Direct Connect" },
      { id: "D", text: "Amazon VPC" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Route 53 ist der verwaltete DNS-Service von AWS: Domain-Registrierung, DNS-Auflösung, Health Checks und verschiedene Routing-Policies (z.B. Latency-based, Failover).",
    difficulty: 1,
    seedKey: "clf-c02-q-137",
    sourceRef: "AWS Route 53 Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Website hat Nutzer weltweit und soll statische Inhalte mit niedriger Latenz ausliefern. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon CloudFront" },
      { id: "B", text: "Amazon RDS" },
      { id: "C", text: "AWS Lambda" },
      { id: "D", text: "Amazon SQS" },
    ],
    correct: ["A"],
    explanation:
      "Amazon CloudFront ist ein Content Delivery Network (CDN), das Inhalte an Edge Locations nahe den Nutzern cached und so weltweit mit niedriger Latenz ausliefert.",
    difficulty: 2,
    seedKey: "clf-c02-q-138",
    sourceRef: "AWS CloudFront Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen benötigt eine dedizierte, private Netzwerkverbindung mit konsistenter Leistung zwischen seinem Rechenzentrum und AWS. Welcher Service eignet sich?",
    choices: [
      { id: "A", text: "Amazon CloudFront" },
      { id: "B", text: "AWS Direct Connect" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS WAF" },
    ],
    correct: ["B"],
    explanation:
      "AWS Direct Connect stellt eine dedizierte physische Leitung zwischen dem eigenen Rechenzentrum und AWS bereit — mit konsistenter Latenz und Bandbreite, nicht über das öffentliche Internet.",
    difficulty: 2,
    seedKey: "clf-c02-q-139",
    sourceRef: "AWS Direct Connect Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Worin unterscheiden sich CloudFront und Global Accelerator hauptsächlich?",
    choices: [
      { id: "A", text: "CloudFront cached Web-Inhalte an Edge Locations; Global Accelerator beschleunigt das Routing von (auch Nicht-HTTP-)Traffic über das AWS-Backbone" },
      { id: "B", text: "Beide sind Datenbank-Services" },
      { id: "C", text: "CloudFront ist nur für E-Mail, Global Accelerator nur für DNS" },
      { id: "D", text: "Es gibt keinen Unterschied" },
    ],
    correct: ["A"],
    explanation:
      "CloudFront ist ein CDN, das Inhalte (HTTP/HTTPS) an Edge Locations cached. Global Accelerator leitet Traffic (auch TCP/UDP) optimiert über das AWS-Backbone zu den nächstgelegenen Endpunkten und liefert statische Anycast-IPs.",
    difficulty: 2,
    seedKey: "clf-c02-q-140",
    sourceRef: "AWS Networking Services",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung soll entkoppelt werden, sodass Komponenten Nachrichten asynchron über eine Warteschlange austauschen. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon SQS" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "Amazon EBS" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["A"],
    explanation:
      "Amazon SQS (Simple Queue Service) ist eine verwaltete Nachrichten-Warteschlange, die Komponenten entkoppelt: Producer legen Nachrichten ab, Consumer holen sie ab — asynchron und ausfalltolerant.",
    difficulty: 2,
    seedKey: "clf-c02-q-141",
    sourceRef: "AWS SQS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche Aussagen zu Amazon SQS und Amazon SNS sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "SQS ist eine Nachrichten-Warteschlange (Pull-basiert)" },
      { id: "B", text: "SNS ist ein relationaler Datenbank-Service" },
      { id: "C", text: "SNS verteilt Nachrichten per Pub/Sub an mehrere Abonnenten (Push)" },
      { id: "D", text: "SQS ist ein Content Delivery Network" },
      { id: "E", text: "SNS hängt Block-Volumes an EC2-Instanzen an" },
    ],
    correct: ["A", "C"],
    explanation:
      "SQS ist eine Pull-basierte Warteschlange (eine Nachricht pro Consumer). SNS ist ein Pub/Sub-Dienst, der eine Nachricht per Push an viele Abonnenten gleichzeitig verteilt.",
    difficulty: 2,
    seedKey: "clf-c02-q-142",
    sourceRef: "AWS Messaging Comparison",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Analyst möchte mit SQL direkt Daten abfragen, die als Dateien in Amazon S3 liegen, ohne sie vorher in eine Datenbank zu laden. Welcher Service eignet sich?",
    choices: [
      { id: "A", text: "Amazon Athena" },
      { id: "B", text: "Amazon RDS" },
      { id: "C", text: "Amazon EC2" },
      { id: "D", text: "AWS Lambda" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Athena ist ein serverloser Abfrage-Service, der SQL direkt auf Daten in S3 ausführt — ohne Server oder vorheriges Laden. Man zahlt pro gescannter Datenmenge.",
    difficulty: 2,
    seedKey: "clf-c02-q-143",
    sourceRef: "AWS Athena Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service ist ein Data Warehouse für komplexe Analysen auf großen, strukturierten Datenmengen?",
    choices: [
      { id: "A", text: "Amazon Redshift" },
      { id: "B", text: "Amazon DynamoDB" },
      { id: "C", text: "Amazon ElastiCache" },
      { id: "D", text: "Amazon Polly" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Redshift ist ein verwaltetes Data Warehouse für analytische Abfragen (OLAP) über große, strukturierte Datenmengen mit spaltenbasierter Speicherung und Parallelverarbeitung.",
    difficulty: 2,
    seedKey: "clf-c02-q-144",
    sourceRef: "AWS Redshift Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen muss kontinuierliche Echtzeit-Datenströme (z.B. Klickströme, IoT-Telemetrie) aufnehmen und verarbeiten. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon Kinesis" },
      { id: "B", text: "Amazon S3 Glacier" },
      { id: "C", text: "AWS Direct Connect" },
      { id: "D", text: "Amazon RDS" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Kinesis nimmt Echtzeit-Streaming-Daten in großem Umfang auf und ermöglicht deren Verarbeitung nahezu in Echtzeit — im Gegensatz zu Batch-orientierten Analysen.",
    difficulty: 2,
    seedKey: "clf-c02-q-145",
    sourceRef: "AWS Kinesis Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Welcher Service wandelt geschriebenen Text in gesprochene Sprache um?",
    choices: [
      { id: "A", text: "Amazon Transcribe" },
      { id: "B", text: "Amazon Polly" },
      { id: "C", text: "Amazon Rekognition" },
      { id: "D", text: "Amazon Comprehend" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Polly ist der Text-to-Speech-Service: er wandelt Text in natürlich klingende Sprache um. (Transcribe macht das Umgekehrte: Sprache in Text.)",
    difficulty: 2,
    seedKey: "clf-c02-q-146",
    sourceRef: "AWS Polly Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Call-Center möchte aufgezeichnete Telefonate automatisch in Text umwandeln. Welcher Service ist dafür geeignet?",
    choices: [
      { id: "A", text: "Amazon Polly" },
      { id: "B", text: "Amazon Transcribe" },
      { id: "C", text: "Amazon Translate" },
      { id: "D", text: "Amazon Lex" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Transcribe ist der Speech-to-Text-Service: er wandelt gesprochene Sprache (Audio) in geschriebenen Text um — ideal für Transkripte und Call-Center-Analysen.",
    difficulty: 2,
    seedKey: "clf-c02-q-147",
    sourceRef: "AWS Transcribe Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service analysiert Bilder und Videos, um Objekte, Gesichter und unangemessene Inhalte zu erkennen?",
    choices: [
      { id: "A", text: "Amazon Rekognition" },
      { id: "B", text: "Amazon Comprehend" },
      { id: "C", text: "Amazon Textract" },
      { id: "D", text: "Amazon Kendra" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Rekognition ist der Bild- und Videoanalyse-Service: er erkennt Objekte, Szenen, Gesichter, Text in Bildern und unangemessene Inhalte (Content Moderation).",
    difficulty: 2,
    seedKey: "clf-c02-q-148",
    sourceRef: "AWS Rekognition Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche Zuordnungen von AI/ML-Service zu Aufgabe sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Amazon Textract — Text und Daten aus gescannten Dokumenten extrahieren" },
      { id: "B", text: "Amazon Translate — Bilder in 3D-Modelle umwandeln" },
      { id: "C", text: "Amazon Lex — Chatbots und Sprach-Assistenten bauen" },
      { id: "D", text: "Amazon Polly — Schwachstellen in EC2-Instanzen scannen" },
      { id: "E", text: "Amazon Comprehend — Block-Speicher bereitstellen" },
    ],
    correct: ["A", "C"],
    explanation:
      "Textract extrahiert Text/Tabellen/Formulare aus Dokumenten (OCR). Lex baut Chatbots/Conversational Interfaces. Translate übersetzt Text, Polly macht Text-to-Speech, Comprehend ist NLP — die anderen Zuordnungen sind falsch.",
    difficulty: 2,
    seedKey: "clf-c02-q-149",
    sourceRef: "AWS AI Services Comparison",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service sammelt Metriken, Logs und Alarme zur Überwachung der Performance von AWS-Ressourcen?",
    choices: [
      { id: "A", text: "AWS CloudTrail" },
      { id: "B", text: "Amazon CloudWatch" },
      { id: "C", text: "AWS Config" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["B"],
    explanation:
      "Amazon CloudWatch ist der Monitoring-Service: er sammelt Metriken (CPU, Netzwerk etc.), Logs und Events, ermöglicht Dashboards und Alarme. (CloudTrail protokolliert dagegen API-Aktivitäten.)",
    difficulty: 2,
    seedKey: "clf-c02-q-150",
    sourceRef: "AWS CloudWatch Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Team will seine gesamte Infrastruktur als wiederholbaren Code (Template) definieren und automatisch bereitstellen. Welcher Service ermöglicht das?",
    choices: [
      { id: "A", text: "AWS CloudFormation" },
      { id: "B", text: "Amazon CloudWatch" },
      { id: "C", text: "Amazon SNS" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["A"],
    explanation:
      "AWS CloudFormation ist das Infrastructure-as-Code-Tool: Infrastruktur wird in einer Vorlage (JSON/YAML) beschrieben und automatisch, wiederholbar und konsistent bereitgestellt.",
    difficulty: 2,
    seedKey: "clf-c02-q-151",
    sourceRef: "AWS CloudFormation Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Service verteilt eingehenden Anwendungs-Traffic automatisch auf mehrere EC2-Instanzen über mehrere Availability Zones hinweg?",
    choices: [
      { id: "A", text: "Elastic Load Balancing (ELB)" },
      { id: "B", text: "Amazon Route 53" },
      { id: "C", text: "Amazon S3" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "Elastic Load Balancing (ELB) verteilt eingehenden Traffic automatisch auf mehrere Ziele (z.B. EC2-Instanzen) über Availability Zones hinweg. Das erhöht Verfügbarkeit und Fehlertoleranz und arbeitet typischerweise mit Auto Scaling zusammen.",
    difficulty: 2,
    seedKey: "clf-c02-q-152",
    sourceRef: "AWS Elastic Load Balancing Documentation",
  },
];
