// src/db/seed/cards/clf-c02-analytics-ai-gaps.ts

import type { NewFlashcard } from "../../schema";

export const clfC02AnalyticsAiGapsCards: NewFlashcard[] = [
  // ── Application Integration ── domain: Cloud Technology and Services

  // 1. SQS
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon SQS — was ist das?",
    back: "Simple Queue Service: vollständig managed Message-Queue. Komponenten schicken Nachrichten in eine Warteschlange, andere holen sie zur Verarbeitung ab — entkoppelt Systeme (loose coupling). Producer und Consumer müssen nicht gleichzeitig verfügbar sein. Faustregel: SQS = Nachrichten-Warteschlange, ein Empfänger pro Nachricht (Pull).",
    difficulty: 2,
    sourceRef: "AWS SQS Documentation",
  },

  // 2. SNS
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon SNS — was ist das?",
    back: "Simple Notification Service: Pub/Sub-Messaging. Ein veröffentlichtes Ereignis (Publish zu einem Topic) wird an VIELE Abonnenten gleichzeitig verteilt (Fan-out) — z.B. an Lambda, SQS, E-Mail, SMS, HTTP. Faustregel: SNS = eine Nachricht an viele Empfänger gleichzeitig (Push/Broadcast).",
    difficulty: 2,
    sourceRef: "AWS SNS Documentation",
  },

  // 3. SQS vs SNS
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "SQS vs SNS — Unterschied?",
    back: "SQS: Queue, Nachrichten werden GESPEICHERT und von einem Consumer abgeholt (Pull), 1 Nachricht → 1 Verarbeiter. SNS: Pub/Sub, Nachrichten werden sofort an alle Abonnenten verteilt (Push), 1 Nachricht → viele Empfänger. Merksatz: SQS = Warteschlange/Pull/einer, SNS = Broadcast/Push/viele. Oft kombiniert (Fan-out: SNS → mehrere SQS).",
    difficulty: 2,
    sourceRef: "AWS Messaging Comparison",
  },

  // 4. EventBridge
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon EventBridge — wofür?",
    back: "Serverless Event-Bus, der Ereignisse von AWS-Services, eigenen Apps und SaaS-Anbietern entgegennimmt und nach Regeln an Ziele weiterleitet (Lambda, SQS, SNS etc.). Auch geplante Events (Cron-artig). Faustregel: EventBridge = zentraler Verteiler, der auf Ereignisse reagiert und Workflows auslöst (Event-driven).",
    difficulty: 2,
    sourceRef: "AWS EventBridge Documentation",
  },

  // 5. Step Functions
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Step Functions — wofür?",
    back: "Orchestriert mehrere Services/Lambda-Funktionen zu einem visuellen Workflow (State Machine) mit Schritten, Verzweigungen, Wiederholungen und Fehlerbehandlung. Ideal für lange oder komplexe Abläufe, die über die 15-Min-Lambda-Grenze hinausgehen. Faustregel: Step Functions = mehrere Schritte zu einem geordneten Workflow zusammenfügen.",
    difficulty: 2,
    sourceRef: "AWS Step Functions Documentation",
  },

  // ── Analytics ── domain: Cloud Technology and Services

  // 6. Kinesis
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Kinesis — wofür?",
    back: "Verarbeitet Echtzeit-Streaming-Daten in großem Umfang (Logs, Klickströme, IoT-Telemetrie, Video). Nimmt kontinuierliche Datenströme auf und ermöglicht Analyse in nahezu Echtzeit. Faustregel: Kinesis = Echtzeit-Datenströme aufnehmen und verarbeiten (im Gegensatz zu Batch-Analyse).",
    difficulty: 2,
    sourceRef: "AWS Kinesis Documentation",
  },

  // 7. Athena
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Athena — wofür?",
    back: "Serverless Abfrage-Service: führt SQL-Abfragen direkt auf Daten in S3 aus — keine Datenbank/Server nötig, keine Daten laden. Du zahlst pro gescannter Datenmenge. Faustregel: Athena = SQL direkt auf S3-Dateien, serverless, pay-per-query. Ideal für gelegentliche Ad-hoc-Analysen.",
    difficulty: 2,
    sourceRef: "AWS Athena Documentation",
  },

  // 8. Glue
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Glue — wofür?",
    back: "Serverless ETL-Service (Extract, Transform, Load): entdeckt, bereinigt, transformiert und verschiebt Daten zwischen Quellen für Analysen. Enthält einen Data Catalog (Metadaten-Verzeichnis). Faustregel: Glue = Daten aufbereiten und verschieben (ETL), bevor sie analysiert werden.",
    difficulty: 2,
    sourceRef: "AWS Glue Documentation",
  },

  // 9. QuickSight
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon QuickSight — wofür?",
    back: "Serverless Business-Intelligence-Service: erstellt interaktive Dashboards und Visualisierungen aus deinen Daten (RDS, S3, Athena, Redshift etc.). Für Reporting und datengetriebene Entscheidungen. Faustregel: QuickSight = Dashboards und Diagramme bauen (BI/Visualisierung).",
    difficulty: 1,
    sourceRef: "AWS QuickSight Documentation",
  },

  // 10. EMR
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon EMR — wofür?",
    back: "Elastic MapReduce: managed Big-Data-Plattform für Frameworks wie Apache Spark, Hadoop, Hive, Presto. Verarbeitet riesige Datenmengen über Cluster verteilt. Faustregel: EMR = Big-Data-Verarbeitung mit Hadoop/Spark auf managed Clustern.",
    difficulty: 2,
    sourceRef: "AWS EMR Documentation",
  },

  // 11. Athena vs Redshift vs EMR
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Athena vs Redshift vs EMR — wann was?",
    back: "Athena: serverless SQL-Abfragen direkt auf S3, für gelegentliche Ad-hoc-Analysen (kein Setup). Redshift: dediziertes Data Warehouse für komplexe, wiederkehrende Analytics auf strukturierten Daten. EMR: Big-Data-Frameworks (Spark/Hadoop) für massive verteilte Verarbeitung. Merksatz: Athena = schnell/serverless, Redshift = Data Warehouse, EMR = Big-Data-Cluster.",
    difficulty: 2,
    sourceRef: "AWS Analytics Comparison",
  },

  // ── AI / ML ── domain: Cloud Technology and Services

  // 12. AI vs ML vs Deep Learning
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AI vs Machine Learning vs Deep Learning?",
    back: "AI (Künstliche Intelligenz): Oberbegriff — Maschinen, die menschenähnliche Aufgaben erledigen. ML (Machine Learning): Teilbereich der AI — Systeme lernen aus Daten, ohne explizit programmiert zu werden. Deep Learning: Teilbereich des ML — neuronale Netze mit vielen Schichten (für Bild-/Spracherkennung). Verschachtelung: AI ⊃ ML ⊃ Deep Learning.",
    difficulty: 2,
    sourceRef: "AWS AI/ML Concepts",
  },

  // 13. SageMaker
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon SageMaker — wofür?",
    back: "End-to-End-Plattform, um EIGENE Machine-Learning-Modelle zu bauen, zu trainieren und bereitzustellen (deployen). Für Data Scientists/Entwickler, die eigene Modelle entwickeln wollen. Faustregel: SageMaker = eigene ML-Modelle selbst entwickeln (im Gegensatz zu fertigen AI-Services wie Rekognition).",
    difficulty: 2,
    sourceRef: "AWS SageMaker Documentation",
  },

  // 14. Bedrock
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Bedrock — wofür?",
    back: "Vollständig managed Service für Generative AI: Zugriff auf Foundation Models (großer KI-Modelle) verschiedener Anbieter über eine einzige API — z.B. Anthropic Claude, Meta Llama, Amazon Titan, Cohere, Mistral. Ohne eigene Infrastruktur/GPUs. Faustregel: Bedrock = generative KI-Anwendungen mit fertigen Foundation Models bauen.",
    difficulty: 2,
    sourceRef: "AWS Bedrock Documentation",
  },

  // 15. Rekognition
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Rekognition — wofür?",
    back: "Bild- und Videoanalyse per Deep Learning: erkennt Objekte, Szenen, Gesichter, Text in Bildern und unangemessene Inhalte (Content Moderation). Use Cases: Gesichtserkennung, automatische Bild-Verschlagwortung, Inhaltsprüfung. Faustregel: Rekognition = sehen/analysieren, was in Bildern und Videos ist.",
    difficulty: 1,
    sourceRef: "AWS Rekognition Documentation",
  },

  // 16. Comprehend
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Comprehend — wofür?",
    back: "Natural Language Processing (NLP): analysiert Text und extrahiert Bedeutung — Sentiment (positiv/negativ), Entitäten (Namen, Orte), Schlüsselbegriffe, Sprache. Use Cases: Kundenfeedback-Analyse, Dokument-Klassifizierung. Faustregel: Comprehend = Text verstehen und Erkenntnisse rausziehen.",
    difficulty: 2,
    sourceRef: "AWS Comprehend Documentation",
  },

  // 17. Polly
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Polly — wofür?",
    back: "Text-to-Speech: wandelt geschriebenen Text in natürlich klingende, lebensechte Sprache um (viele Stimmen und Sprachen). Use Cases: Vorlese-Apps, Sprachausgabe, Hörbücher. Faustregel: Polly = Text → Sprache (geschrieben wird gesprochen).",
    difficulty: 1,
    sourceRef: "AWS Polly Documentation",
  },

  // 18. Transcribe
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Transcribe — wofür?",
    back: "Speech-to-Text: wandelt gesprochene Sprache (Audio) in geschriebenen Text um, inkl. Sprecher-Erkennung. Use Cases: Meeting-Transkripte, Untertitel, Call-Center-Analyse. Faustregel: Transcribe = Sprache → Text (gesprochen wird geschrieben).",
    difficulty: 1,
    sourceRef: "AWS Transcribe Documentation",
  },

  // 19. Translate
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Translate — wofür?",
    back: "Neuronale maschinelle Übersetzung: übersetzt Text in Echtzeit zwischen vielen Sprachen. Use Cases: mehrsprachige Websites, Lokalisierung, internationaler Support. Faustregel: Translate = Text von einer Sprache in eine andere übersetzen.",
    difficulty: 1,
    sourceRef: "AWS Translate Documentation",
  },

  // 20. Textract
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Textract — wofür?",
    back: "Optical Character Recognition (OCR) plus mehr: extrahiert Text, Tabellen und Formularfelder aus gescannten Dokumenten/Bildern in strukturierter Form. Use Cases: Rechnungen, Formulare, Verträge automatisch auslesen. Faustregel: Textract = Text und Daten aus Dokumenten/Scans herausziehen.",
    difficulty: 2,
    sourceRef: "AWS Textract Documentation",
  },

  // 21. Lex
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Lex — wofür?",
    back: "Service zum Bauen von Chatbots und Sprach-Assistenten: nutzt Automatic Speech Recognition (ASR) und Natural Language Understanding (NLU). Dieselbe Technologie wie hinter Amazon Alexa. Use Cases: Kundenservice-Bots, Sprachschnittstellen. Faustregel: Lex = Chatbots/Conversational Interfaces bauen.",
    difficulty: 2,
    sourceRef: "AWS Lex Documentation",
  },

  // 22. Kendra
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Kendra — wofür?",
    back: "Intelligente Enterprise-Suche per ML: durchsucht interne Unternehmensdaten (Dokumente, Wikis, Datenbanken) und beantwortet Fragen in natürlicher Sprache. Faustregel: Kendra = clevere Suchmaschine für firmeninterne Inhalte (versteht echte Fragen, nicht nur Stichwörter).",
    difficulty: 2,
    sourceRef: "AWS Kendra Documentation",
  },

  // 23. Polly vs Transcribe
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Polly vs Transcribe — schnell merken?",
    back: "Polly: Text → Sprache (lässt den Computer sprechen). Transcribe: Sprache → Text (schreibt mit, was gesprochen wird). Merksatz: Polly spricht (Out = Audio), Transcribe schreibt (Out = Text). Genau umgekehrt — beliebte Prüfungs-Verwechslung.",
    difficulty: 2,
    sourceRef: "AWS AI Services Comparison",
  },

  // 24. Rekognition vs Textract
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Rekognition vs Textract — Unterschied?",
    back: "Rekognition: analysiert BILDER/VIDEOS auf Objekte, Gesichter, Szenen (was ist auf dem Bild zu sehen?). Textract: extrahiert TEXT/Tabellen/Formulare aus Dokumenten (OCR — was steht im Dokument?). Merksatz: Rekognition = Bilder erkennen, Textract = Text auslesen.",
    difficulty: 2,
    sourceRef: "AWS AI Services Comparison",
  },

  // ── Lücken & häufige Verwechslungen ── domain: Cloud Technology and Services

  // 25. Snow Family
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Snow Family — wofür, welche Geräte?",
    back: "Physische Geräte, um große Datenmengen OFFLINE in die Cloud zu transportieren (wenn das Netzwerk zu langsam wäre). Snowcone: klein/portabel (wenige TB). Snowball Edge: koffergroß, viel Speicher + optional Rechenleistung. (Snowmobile, der Exabyte-LKW, wurde eingestellt.) Faustregel: Snow Family = Daten per Hardware verschicken statt hochladen.",
    difficulty: 2,
    sourceRef: "AWS Snow Family Documentation",
  },

  // 26. DataSync vs Storage Gateway vs Snow
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "DataSync vs Storage Gateway vs Snow Family — Migration?",
    back: "DataSync: schnelle ONLINE-Datenübertragung übers Netzwerk (einmalig oder laufend, On-Prem ↔ AWS). Storage Gateway: hybrider Dauerzugriff — On-Prem-Apps nutzen Cloud-Storage laufend. Snow Family: OFFLINE-Transport per Hardware bei riesigen Mengen / schlechtem Netz. Merksatz: DataSync = online kopieren, Storage Gateway = hybrid dauerhaft, Snow = offline per Gerät.",
    difficulty: 2,
    sourceRef: "AWS Data Transfer Comparison",
  },

  // 27. Elastic Beanstalk
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Elastic Beanstalk — wofür?",
    back: "PaaS zum schnellen Bereitstellen von Web-Anwendungen: du lädst nur deinen Code hoch, Beanstalk kümmert sich automatisch um Provisionierung, Load Balancing, Auto Scaling und EC2-Instanzen. Du behältst Kontrolle über die Ressourcen. Faustregel: Beanstalk = App-Code hochladen, AWS richtet die Infrastruktur ein.",
    difficulty: 2,
    sourceRef: "AWS Elastic Beanstalk Documentation",
  },

  // 28. Lightsail
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Lightsail — wofür?",
    back: "Vereinfachter Service für einfache Workloads zu einem vorhersehbaren, festen Monatspreis: vorkonfigurierte virtuelle Server, Datenbanken, Websites (z.B. WordPress) — ohne die Komplexität von EC2/VPC. Für Einsteiger und kleine Projekte. Faustregel: Lightsail = der einfache, günstige Einstieg (EC2 für Anfänger).",
    difficulty: 1,
    sourceRef: "AWS Lightsail Documentation",
  },

  // 29. Beanstalk vs CloudFormation
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Elastic Beanstalk vs CloudFormation — Unterschied?",
    back: "Beanstalk: fokussiert auf das DEPLOYEN einer Anwendung — du gibst Code, AWS richtet automatisch die passende Infrastruktur ein (für Apps). CloudFormation: definiert BELIEBIGE Infrastruktur als Code per Vorlage (für alles, nicht nur Apps). Merksatz: Beanstalk = App schnell deployen, CloudFormation = Infrastruktur per Template bauen.",
    difficulty: 2,
    sourceRef: "AWS Deployment Comparison",
  },

  // 30. Outposts / Hybrid
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Outposts — wofür?",
    back: "AWS-Hardware/Infrastruktur, die in deinem EIGENEN Rechenzentrum (on-premises) steht und dieselben AWS-Services/APIs lokal bereitstellt. Für Workloads, die aus Latenz- oder Compliance-Gründen vor Ort bleiben müssen, aber AWS-konsistent sein sollen. Faustregel: Outposts = AWS-Cloud physisch bei dir vor Ort (echtes Hybrid).",
    difficulty: 2,
    sourceRef: "AWS Outposts Documentation",
  },
];
