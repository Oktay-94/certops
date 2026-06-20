// src/db/seed/questions/clf-c02-q-ct2-batch3.ts
//
// Batch 3 — Cloud Technology and Services, Teil 2 von 2 (17 Fragen):
// Networking (6), AI/ML (5), Analytics (3), Integration (3).
// Prüfungstreue EIGEN-Fragen, thematisch disjunkt zu den 53 bestehenden
// Cloud-Tech-Fragen (Batch 1 + 2) und zu CC/Security/CT1-Batch-3.
// Difficulty: 3× diff 1, 13× diff 2, 1× diff 3. Multiple-Response: 1 von 17.
//
// INTEGRATION (Code-Claude): in den Batch-3-Index + src/db/seed.ts aufnehmen.

import type { NewQuestion } from "../../schema";

export const clfC02QCloudTech2B3: NewQuestion[] = [
  // ── Networking ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Entwickler möchte eine REST-API erstellen, veröffentlichen und absichern, die als 'Eingangstür' Anfragen entgegennimmt und an AWS-Lambda-Funktionen weiterleitet. Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon API Gateway" },
      { id: "B", text: "Amazon Route 53" },
      { id: "C", text: "AWS Direct Connect" },
      { id: "D", text: "Amazon CloudFront" },
    ],
    correct: ["A"],
    explanation:
      "Amazon API Gateway erstellt, veröffentlicht, sichert und überwacht APIs (REST, HTTP, WebSocket) im großen Maßstab und dient häufig als Front-Door für Lambda-Funktionen oder andere Backends — inklusive Drosselung, Autorisierung und Caching. Route 53 ist DNS, Direct Connect eine Netzwerk-Leitung, CloudFront ein CDN.",
    difficulty: 1,
    sourceRef: "Amazon API Gateway",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen hat im Laufe der Zeit Dutzende Amazon VPCs sowie mehrere On-Premises-Standorte und kämpft mit einem unübersichtlichen Netz aus vielen einzelnen VPC-Peering-Verbindungen. Es möchte alle Netzwerke über einen zentralen Knotenpunkt verbinden und zentral verwalten. Welcher Dienst löst das am besten?",
    choices: [
      { id: "A", text: "Eine zusätzliche VPC-Peering-Verbindung pro VPC-Paar anlegen" },
      { id: "B", text: "AWS Transit Gateway als zentralen Hub für alle VPCs und On-Premises-Netze" },
      { id: "C", text: "Amazon CloudFront vor jede VPC schalten" },
      { id: "D", text: "Für jede VPC einen eigenen NAT Gateway einrichten" },
    ],
    correct: ["B"],
    explanation:
      "AWS Transit Gateway wirkt als zentraler Hub (Hub-and-Spoke), der viele VPCs und On-Premises-Netzwerke über eine einzige, zentral verwaltete Stelle verbindet — statt eines schwer wartbaren Vollvermaschungs-Netzes aus vielen einzelnen Peering-Verbindungen (die Zahl der Peerings wächst sonst quadratisch). Mehr Peerings (A) verschärfen das Problem; CloudFront (CDN) und NAT Gateway (Internet-Ausgang) lösen die Aufgabe nicht.",
    difficulty: 3,
    sourceRef: "AWS Transit Gateway",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen möchte aus seiner VPC privat auf einen AWS-Dienst (oder einen Drittanbieter-Service) zugreifen, ohne dass der Datenverkehr das öffentliche Internet durchquert. Welche Lösung ist dafür vorgesehen?",
    choices: [
      { id: "A", text: "AWS PrivateLink / VPC-Endpunkte" },
      { id: "B", text: "Ein öffentlicher Internet Gateway für die gesamte VPC" },
      { id: "C", text: "Amazon Route 53 Health Checks" },
      { id: "D", text: "Eine öffentliche IP-Adresse pro Instanz" },
    ],
    correct: ["A"],
    explanation:
      "AWS PrivateLink (über VPC-Endpunkte) ermöglicht privaten Zugriff auf AWS-Dienste oder Partner-/eigene Services innerhalb des AWS-Netzwerks — der Traffic verlässt das öffentliche Internet nicht, was Sicherheit und Datenschutz erhöht. Ein Internet Gateway oder öffentliche IPs würden den Verkehr gerade übers Internet leiten; Route 53 Health Checks prüfen die Erreichbarkeit, lösen die Aufgabe aber nicht.",
    difficulty: 2,
    sourceRef: "AWS PrivateLink / VPC Endpoints",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Instanzen in einem privaten Subnetz müssen Software-Updates aus dem Internet herunterladen, dürfen aber selbst nicht aus dem Internet erreichbar sein. Welche Komponente ermöglicht diesen ausgehenden Internetzugang?",
    choices: [
      { id: "A", text: "Ein NAT Gateway" },
      { id: "B", text: "Ein Amazon S3-Bucket" },
      { id: "C", text: "Eine Security Group im Verweigerungs-Modus" },
      { id: "D", text: "Amazon Athena" },
    ],
    correct: ["A"],
    explanation:
      "Ein NAT Gateway (in einem öffentlichen Subnetz) erlaubt Instanzen in privaten Subnetzen ausgehende Verbindungen ins Internet (z. B. für Updates), verhindert aber eingehende, unaufgeforderte Verbindungen aus dem Internet. So bleiben die Instanzen privat. S3 (Storage), Security Groups (Firewall-Regeln, kein Routing ins Internet) und Athena (Abfragen) leisten das nicht.",
    difficulty: 2,
    sourceRef: "Amazon VPC — NAT Gateway",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche ZWEI Aussagen über Subnetze in einer Amazon VPC sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Ein öffentliches Subnetz hat eine Route zu einem Internet Gateway." },
      { id: "B", text: "Instanzen in einem privaten Subnetz können über einen NAT Gateway ausgehend ins Internet kommunizieren." },
      { id: "C", text: "Ein einzelnes Subnetz erstreckt sich über mehrere AWS-Regionen." },
      { id: "D", text: "Private Subnetze sind standardmäßig direkt aus dem Internet erreichbar." },
      { id: "E", text: "Subnetze können keiner Availability Zone zugeordnet werden." },
    ],
    correct: ["A", "B"],
    explanation:
      "Ein öffentliches Subnetz besitzt eine Route zu einem Internet Gateway (daher 'öffentlich'); Instanzen in privaten Subnetzen erreichen das Internet ausgehend über einen NAT Gateway. Ein Subnetz liegt immer in genau EINER Availability Zone (nicht über Regionen hinweg, C falsch; und es ist einer AZ zugeordnet, E falsch). Private Subnetze sind nicht direkt aus dem Internet erreichbar (D falsch).",
    difficulty: 2,
    sourceRef: "Amazon VPC — Public vs Private Subnets",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung läuft in mehreren AWS-Regionen. Nutzeranfragen sollen automatisch an die Region geleitet werden, die für den jeweiligen Nutzer die NIEDRIGSTE Latenz bietet. Welche Routing-Methode von Amazon Route 53 erfüllt das?",
    choices: [
      { id: "A", text: "Latency-based Routing" },
      { id: "B", text: "Simple Routing" },
      { id: "C", text: "Multivalue Answer Routing" },
      { id: "D", text: "Failover Routing" },
    ],
    correct: ["A"],
    explanation:
      "Latency-based Routing leitet Nutzer an die AWS-Region mit der geringsten Latenz für sie weiter und verbessert so die Antwortzeiten global verteilter Anwendungen. Simple Routing gibt nur einen festen Wert zurück, Multivalue Answer liefert mehrere gesunde Endpunkte (einfache Lastverteilung), Failover Routing schaltet bei Ausfall auf einen Standby um.",
    difficulty: 2,
    sourceRef: "Amazon Route 53 — Routing Policies",
  },

  // ── AI / ML ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Data-Science-Team möchte EIGENE Machine-Learning-Modelle erstellen, trainieren, optimieren und als Endpunkt bereitstellen — in einer vollständig verwalteten Umgebung. Welcher AWS-Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon SageMaker" },
      { id: "B", text: "Amazon Rekognition" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "Amazon Connect" },
    ],
    correct: ["A"],
    explanation:
      "Amazon SageMaker ist die verwaltete Plattform, um eigene ML-Modelle zu erstellen, zu trainieren, zu tunen und bereitzustellen (Deployment als Endpunkt). Rekognition (vortrainierte Bild-/Video-Analyse), Polly (Text-to-Speech) und Connect (Contact Center) sind fertige Dienste für spezifische Aufgaben, kein Baukasten für eigene Modelle. (Für vortrainierte Generative-AI-Foundation-Models nutzt man dagegen Amazon Bedrock.)",
    difficulty: 2,
    sourceRef: "Amazon SageMaker",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen möchte aus großen Mengen Kundenfeedback automatisch Stimmung (positiv/negativ), Schlüsselbegriffe und Entitäten extrahieren (Natural Language Processing). Welcher AWS-Dienst passt?",
    choices: [
      { id: "A", text: "Amazon Comprehend" },
      { id: "B", text: "Amazon Translate" },
      { id: "C", text: "Amazon Textract" },
      { id: "D", text: "Amazon QuickSight" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Comprehend ist ein NLP-Dienst, der aus Texten Stimmung (Sentiment), Schlüsselbegriffe, Entitäten, Sprache und mehr extrahiert — ideal zur Analyse von Kundenfeedback. Translate übersetzt zwischen Sprachen, Textract extrahiert Text/Daten aus gescannten Dokumenten, QuickSight ist ein BI-Visualisierungsdienst.",
    difficulty: 2,
    sourceRef: "Amazon Comprehend",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine App soll von Nutzern eingegebenen Text in Echtzeit von einer Sprache in eine andere übersetzen. Welcher AWS-Dienst ist dafür vorgesehen?",
    choices: [
      { id: "A", text: "Amazon Translate" },
      { id: "B", text: "Amazon Transcribe" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "Amazon Comprehend" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Translate ist ein neuronaler maschineller Übersetzungsdienst, der Text zwischen Sprachen übersetzt. Zur Abgrenzung: Transcribe wandelt gesprochene Sprache in Text (Speech-to-Text), Polly wandelt Text in Sprache (Text-to-Speech), Comprehend analysiert Text (NLP), übersetzt aber nicht.",
    difficulty: 2,
    sourceRef: "Amazon Translate",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Mitarbeiter sollen über eine natürliche Suchanfrage schnell Antworten aus verstreuten internen Dokumentenquellen (Wikis, Handbücher, FAQs) finden. Welcher AWS-Dienst bietet diese intelligente Unternehmenssuche?",
    choices: [
      { id: "A", text: "Amazon Kendra" },
      { id: "B", text: "Amazon Rekognition" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "AWS Glue" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Kendra ist ein ML-gestützter, intelligenter Unternehmens-Suchdienst: Er durchsucht verschiedene Inhaltsquellen und beantwortet natürliche Suchanfragen mit präzisen Treffern/Antworten. Rekognition analysiert Bilder/Videos, Polly erzeugt Sprache, Glue ist ein ETL-/Datenkatalog-Dienst — keiner davon ist eine Suchmaschine.",
    difficulty: 2,
    sourceRef: "Amazon Kendra",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Online-Shop möchte seinen Nutzern in Echtzeit personalisierte Produktempfehlungen anzeigen, basierend auf deren Verhalten — ähnlich der Empfehlungstechnologie von Amazon.com. Welcher AWS-Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon Personalize" },
      { id: "B", text: "Amazon Athena" },
      { id: "C", text: "Amazon Macie" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Personalize liefert in Echtzeit individualisierte Empfehlungen (Produkte, Inhalte) auf Basis von Nutzerverhalten und -daten — dieselbe Art Technologie, die Amazon.com verwendet, ohne dass man ML-Expertise aufbauen muss. Athena (SQL-Abfragen), Macie (PII-Erkennung) und CloudTrail (API-Audit) sind für Empfehlungen nicht vorgesehen.",
    difficulty: 2,
    sourceRef: "Amazon Personalize",
  },

  // ── Analytics ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen muss Daten aus verschiedenen Quellen extrahieren, bereinigen/transformieren und für Analysen laden (ETL) — möglichst ohne eigene Server zu betreiben, inklusive eines zentralen Datenkatalogs. Welcher Dienst passt?",
    choices: [
      { id: "A", text: "AWS Glue" },
      { id: "B", text: "Amazon EC2" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["A"],
    explanation:
      "AWS Glue ist ein serverloser ETL-Dienst: Er erkennt, bereitet und integriert Daten aus verschiedenen Quellen und stellt mit dem Glue Data Catalog ein zentrales Metadaten-Verzeichnis bereit — ohne dass man Infrastruktur verwalten muss. EC2 (Compute), Route 53 (DNS) und Shield (DDoS-Schutz) sind keine ETL-Dienste.",
    difficulty: 2,
    sourceRef: "AWS Glue",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Geschäftsanwender möchten interaktive Dashboards und Visualisierungen aus ihren Daten erstellen und teilen (Business Intelligence). Welcher AWS-Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon QuickSight" },
      { id: "B", text: "Amazon SQS" },
      { id: "C", text: "AWS Lambda" },
      { id: "D", text: "Amazon EBS" },
    ],
    correct: ["A"],
    explanation:
      "Amazon QuickSight ist der Cloud-BI-Dienst von AWS zum Erstellen, Veröffentlichen und Teilen interaktiver Dashboards und Visualisierungen. SQS (Message-Queue), Lambda (Compute) und EBS (Block-Speicher) sind keine BI-Werkzeuge.",
    difficulty: 1,
    sourceRef: "Amazon QuickSight",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen verarbeitet sehr große Datenmengen mit Big-Data-Frameworks wie Apache Spark und Apache Hadoop und möchte dafür einen verwalteten Cluster nutzen. Welcher AWS-Dienst ist dafür vorgesehen?",
    choices: [
      { id: "A", text: "Amazon EMR" },
      { id: "B", text: "Amazon Polly" },
      { id: "C", text: "Amazon Cognito" },
      { id: "D", text: "AWS Certificate Manager" },
    ],
    correct: ["A"],
    explanation:
      "Amazon EMR ist eine verwaltete Big-Data-Plattform, die Frameworks wie Apache Spark, Hadoop, Hive und Presto auf skalierbaren Clustern betreibt — für umfangreiche Datenverarbeitung, ETL und Analysen. Polly (Sprache), Cognito (Identitäten) und ACM (Zertifikate) haben damit nichts zu tun.",
    difficulty: 2,
    sourceRef: "Amazon EMR",
  },

  // ── Integration ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Team möchte mehrere AWS-Dienste zu einem mehrstufigen Workflow mit Schritten, Verzweigungen und Fehlerbehandlung verketten und diesen Ablauf visuell modellieren. Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Step Functions" },
      { id: "B", text: "Amazon S3" },
      { id: "C", text: "Amazon CloudFront" },
      { id: "D", text: "AWS Direct Connect" },
    ],
    correct: ["A"],
    explanation:
      "AWS Step Functions orchestriert mehrere Dienste (z. B. Lambda, ECS, SNS) zu serverlosen Workflows mittels State Machines — inklusive Schritten, Verzweigungen, Wiederholungen und Fehlerbehandlung, visuell modellierbar. S3 (Storage), CloudFront (CDN) und Direct Connect (Netzwerk) sind keine Workflow-Orchestrierung.",
    difficulty: 2,
    sourceRef: "AWS Step Functions",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung muss zuverlässig große Mengen an Transaktions- und Marketing-E-Mails versenden. Welcher AWS-Dienst ist dafür vorgesehen?",
    choices: [
      { id: "A", text: "Amazon SES (Simple Email Service)" },
      { id: "B", text: "Amazon SQS" },
      { id: "C", text: "Amazon Kinesis" },
      { id: "D", text: "Amazon Neptune" },
    ],
    correct: ["A"],
    explanation:
      "Amazon SES (Simple Email Service) ist ein skalierbarer Dienst zum Versenden (und Empfangen) von E-Mails — sowohl transaktional (z. B. Bestätigungen) als auch für Marketing. SQS ist eine Message-Queue, Kinesis ein Streaming-Dienst, Neptune eine Graph-Datenbank — keiner versendet E-Mails.",
    difficulty: 1,
    sourceRef: "Amazon SES",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen baut eine ereignisgesteuerte Architektur: Ereignisse aus verschiedenen AWS-Diensten, SaaS-Anwendungen und eigenen Apps sollen über einen zentralen Event-Bus anhand von Regeln an passende Ziele weitergeleitet werden. Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon EventBridge" },
      { id: "B", text: "Amazon RDS" },
      { id: "C", text: "Amazon S3 Glacier" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["A"],
    explanation:
      "Amazon EventBridge ist ein serverloser Event-Bus für ereignisgesteuerte Architekturen: Er empfängt Ereignisse von AWS-Diensten, vielen SaaS-Anwendungen und eigenen Apps und leitet sie anhand von Regeln an Ziele wie Lambda, SQS oder Step Functions weiter. RDS (Datenbank), Glacier (Archiv-Storage) und Trusted Advisor (Best-Practice-Checks) sind keine Event-Busse.",
    difficulty: 2,
    sourceRef: "Amazon EventBridge",
  },
];
