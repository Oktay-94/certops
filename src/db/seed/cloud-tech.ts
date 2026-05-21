import type { NewQuestion } from "../schema";

export const cloudTechQuestions: NewQuestion[] = [
  // ── Cloud Technology and Services (K1 initial) ──
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

  // ── Cloud Technology and Services (+10) ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen speichert Archivdaten, die selten abgerufen werden, aber im Notfall innerhalb weniger Millisekunden verfügbar sein müssen (z. B. medizinische Bilddaten). Welche S3-Storage-Klasse ist am besten geeignet?",
    choices: [
      { id: "A", text: "S3 Standard" },
      { id: "B", text: "S3 Glacier Flexible Retrieval" },
      { id: "C", text: "S3 Glacier Instant Retrieval" },
      { id: "D", text: "S3 Glacier Deep Archive" },
    ],
    correct: ["C"],
    explanation:
      "S3 Glacier Instant Retrieval (seit 2021): niedrige Speicherkosten + Millisekunden-Zugriff, ideal für quartalsweise genutzte Archivdaten mit Notfall-Zugriff. S3 Standard = Millisekunden, aber teurer. Glacier Flexible Retrieval = Minuten bis 12h. Glacier Deep Archive = 12-48h. Merksatz: 'Instant' = Millisekunden, 'Flexible' = Minuten/Stunden, 'Deep' = halber Tag oder mehr.",
    difficulty: 2,
    sourceRef: "Amazon S3 Storage Classes",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Welche Aussage über AWS Lambda ist KORREKT?",
    choices: [
      {
        id: "A",
        text: "Lambda-Funktionen können maximal 30 Sekunden laufen, bevor sie automatisch beendet werden.",
      },
      {
        id: "B",
        text: "Lambda eignet sich besonders für stark frequentierte Datenbank-Server, die rund um die Uhr laufen.",
      },
      {
        id: "C",
        text: "Bei Lambda zahlt man pro Anfrage und für die tatsächliche Ausführungszeit — bei Inaktivität fallen keine Kosten an.",
      },
      {
        id: "D",
        text: "Lambda-Funktionen können nur in Python und Node.js geschrieben werden.",
      },
    ],
    correct: ["C"],
    explanation:
      "Lambda ist Serverless: Pay-per-Request + Pay-per-Execution-Time, bei Inaktivität keine Kosten. Aktuelle Limits (2026): max. 15 Min Laufzeit, max. 10 GB RAM. Unterstützte Sprachen nativ: Node.js, Python, Java, .NET, Go, Ruby + Custom Runtimes via Layers. Lambda ist stateless für kurze Aufgaben — kein Anti-Pattern für Datenbanken (dafür RDS/DynamoDB).",
    difficulty: 2,
    sourceRef: "AWS Lambda Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen entwickelt eine Web-Anwendung mit klar definiertem relationalem Datenmodell, komplexen SQL-Joins und ACID-Transaktionen. Welcher AWS-Service ist am besten geeignet?",
    choices: [
      { id: "A", text: "Amazon DynamoDB" },
      { id: "B", text: "Amazon RDS (Relational Database Service)" },
      { id: "C", text: "Amazon S3" },
      { id: "D", text: "Amazon ElastiCache" },
    ],
    correct: ["B"],
    explanation:
      "Amazon RDS unterstützt sechs Engines: Aurora (AWS-eigene MySQL/PostgreSQL-kompatibel), MySQL, PostgreSQL, MariaDB, Oracle, SQL Server. RDS übernimmt Backups, Patches, Multi-AZ, Read Replicas, Monitoring. DynamoDB = NoSQL ohne SQL-Joins. S3 = Object Storage, keine Datenbank. ElastiCache = In-Memory Cache (Redis/Memcached) vor einer DB, kein primärer Datenspeicher.",
    difficulty: 2,
    sourceRef: "Amazon RDS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Was ist die Hauptfunktion einer Amazon Virtual Private Cloud (VPC)?",
    choices: [
      {
        id: "A",
        text: "Bereitstellung eines globalen Content Delivery Networks für schnelle Auslieferung von Webinhalten.",
      },
      {
        id: "B",
        text: "Bereitstellung eines logisch isolierten, virtuellen Netzwerks in der AWS Cloud, in dem AWS-Ressourcen gestartet werden können.",
      },
      {
        id: "C",
        text: "Verwaltung von DNS-Einträgen und Routing-Policies für öffentliche Domains.",
      },
      {
        id: "D",
        text: "Automatische Skalierung von EC2-Instanzen basierend auf CPU-Auslastung.",
      },
    ],
    correct: ["B"],
    explanation:
      "Eine VPC ist dein eigenes, logisch isoliertes Netzwerk in AWS. Du kontrollierst CIDR-Block, Subnetze (Public/Private), Route Tables, Internet Gateway, NAT Gateway, Security Groups, NACLs, VPC Peering und Transit Gateway. Globales CDN = CloudFront. DNS + Routing-Policies = Route 53. Auto Scaling = EC2 Auto Scaling Groups.",
    difficulty: 2,
    sourceRef: "Amazon VPC Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche zwei AWS-Services arbeiten typischerweise zusammen, um eine hochverfügbare Webanwendung mit dynamischer Lastskalierung zu realisieren? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Elastic Load Balancer (ELB)" },
      { id: "B", text: "Amazon S3 Glacier" },
      { id: "C", text: "EC2 Auto Scaling" },
      { id: "D", text: "AWS Snowball" },
      { id: "E", text: "Amazon Athena" },
    ],
    correct: ["A", "C"],
    explanation:
      "Standard-Pattern für HA-Webanwendungen: ELB verteilt Traffic auf mehrere EC2-Instanzen in mehreren AZs (ALB Layer 7, NLB Layer 4, GWLB für Network-Appliances). EC2 Auto Scaling passt Instanz-Anzahl automatisch an Last an (Scale Out / Scale In via Scaling Policies). ELB = Vorderseite, Auto Scaling = Hinterseite. S3 Glacier = Archiv-Storage, Snowball = physische Datenmigration, Athena = SQL-Queries auf S3.",
    difficulty: 2,
    sourceRef: "AWS Auto Scaling, Elastic Load Balancing Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welche Routing-Policy in Amazon Route 53 ermöglicht es, Traffic basierend auf der geografischen Position des anfragenden Nutzers an unterschiedliche Endpunkte zu leiten (z. B. europäische Nutzer auf einen EU-Server, US-Nutzer auf einen US-Server)?",
    choices: [
      { id: "A", text: "Simple Routing" },
      { id: "B", text: "Weighted Routing" },
      { id: "C", text: "Geolocation Routing" },
      { id: "D", text: "Failover Routing" },
    ],
    correct: ["C"],
    explanation:
      "Route 53 Routing-Policies: Geolocation = basierend auf Herkunftsland des Users (z. B. DSGVO-Compliance, Content-Lokalisierung). Simple = ein Endpunkt. Weighted = Traffic nach %-Verteilung (A/B-Tests). Latency-Based = niedrigste Netzwerk-Latenz. Failover = Primär+Sekundär (Disaster Recovery). Geoproximity = geografische Distanz mit Bias. Multi-Value Answer = mehrere gesunde Endpunkte.",
    difficulty: 2,
    sourceRef: "Amazon Route 53 Routing Policies",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Entwicklerteam möchte eine containerisierte Anwendung in AWS betreiben, ohne dabei selbst EC2-Instanzen für die Container-Hosts verwalten zu müssen. AWS soll die zugrunde liegende Infrastruktur vollständig übernehmen. Welche Lösung erfüllt diese Anforderung?",
    choices: [
      { id: "A", text: "Amazon EKS auf selbst verwalteten EC2-Worker-Nodes" },
      {
        id: "B",
        text: "Amazon ECS oder EKS mit AWS Fargate als Launch Type",
      },
      { id: "C", text: "EC2-Instanzen mit Docker manuell installiert" },
      { id: "D", text: "AWS Lambda mit Container-Images" },
    ],
    correct: ["B"],
    explanation:
      "AWS Fargate ist Serverless-Compute für Container. AWS verwaltet Infrastruktur (Server, Skalierung, Patching), du zahlst nur für genutzte Ressourcen. Funktioniert mit ECS (AWS-eigene Orchestrierung) und EKS (Managed Kubernetes). EKS auf EC2-Worker-Nodes = Eigenverwaltung der Nodes. EC2 mit Docker manuell = komplette Eigenverwaltung. Lambda mit Container-Images = max. 15 Min Laufzeit, für kurze Aufgaben, nicht für lang laufende Container-Services.",
    difficulty: 2,
    sourceRef: "AWS Fargate Documentation, Amazon ECS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher AWS-Service ermöglicht es, generative KI-Anwendungen zu bauen, indem er über eine einheitliche API Zugriff auf vortrainierte Foundation-Modelle (z. B. von Anthropic, Meta, Cohere, AWS und anderen Anbietern) bereitstellt — ohne dass eigene Modelle trainiert werden müssen?",
    choices: [
      { id: "A", text: "Amazon SageMaker" },
      { id: "B", text: "Amazon Bedrock" },
      { id: "C", text: "Amazon Rekognition" },
      { id: "D", text: "Amazon Comprehend" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Bedrock (seit Oktober 2023) ist verwalteter Service für generative KI mit einheitlicher API für Foundation Models: Anthropic Claude, Meta Llama, Mistral, Cohere, AI21 Jurassic, Amazon Titan, Stability AI. Serverless, Pay-per-Token, Knowledge Bases für RAG, Agents, Guardrails. SageMaker = eigene ML-Modelle trainieren/deployen. Rekognition = Bild-/Video-Analyse. Comprehend = NLP (Sentiment, Entities). Bedrock = 'fertige Modelle nutzen', SageMaker = 'eigene Modelle bauen'.",
    difficulty: 2,
    sourceRef: "Amazon Bedrock Documentation",
  },

  // ── K2 — Cloud Technology and Services (+10) ──

  // 3.1 Deploying — CloudFormation als IaC-Service
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher AWS-Service ermöglicht es, AWS-Infrastruktur als Code (Infrastructure as Code, IaC) in JSON- oder YAML-Vorlagen zu definieren und automatisiert, reproduzierbar und versioniert auszurollen?",
    choices: [
      { id: "A", text: "AWS CloudFormation" },
      { id: "B", text: "AWS Systems Manager" },
      { id: "C", text: "AWS Cloud9" },
      { id: "D", text: "AWS Elastic Beanstalk" },
    ],
    correct: ["A"],
    explanation:
      "AWS CloudFormation ist der native IaC-Service: Templates in JSON/YAML, Stacks für gebündelte Ressourcen, Drift-Detection, StackSets für Multi-Account-Multi-Region-Deployments, Rollback bei Fehlern. CloudFormation selbst ist kostenlos — Kosten entstehen nur durch die provisionierten Ressourcen. Systems Manager = Operations und Konfigurations-Management bestehender Ressourcen. Cloud9 = browser-basierte IDE. Elastic Beanstalk = PaaS, deployed Anwendungen, nutzt CloudFormation intern, ist aber nicht selbst der IaC-Service.",
    difficulty: 1,
    sourceRef: "AWS CloudFormation Documentation",
  },

  // 3.1 Deploying — CLI für Automation
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein DevOps-Engineer möchte AWS-Ressourcen aus einem Bash-Skript heraus erstellen und verwalten, das nachts automatisch auf einem EC2-Build-Server läuft. Welche Zugriffsmethode auf AWS ist dafür am geeignetsten?",
    choices: [
      { id: "A", text: "AWS Management Console" },
      { id: "B", text: "AWS Command Line Interface (AWS CLI)" },
      { id: "C", text: "AWS-Konto-Login per Browser durch einen Mitarbeiter" },
      { id: "D", text: "Postal Mail an den AWS Support" },
    ],
    correct: ["B"],
    explanation:
      "Die AWS CLI ist das richtige Werkzeug für skriptbare, automatisierte AWS-Operationen aus Shell-Skripten heraus. Authentifizierung idealerweise über IAM Role am EC2-Instance-Profile (keine Access Keys im Skript!). Alternativen: AWS SDK (programmatisch in Python/Java/JS/Go/etc. — wenn Code direkt mit AWS reden soll), CloudFormation/Terraform (wenn IaC gewünscht). Die Management Console (A) ist interaktiv, nicht skriptbar. Browser-Login (C) ist manuell. Briefpost (D) ist Quatsch.",
    difficulty: 1,
    sourceRef: "AWS CLI Documentation",
  },

  // 3.1 Deploying — Direct Connect vs VPN
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Finanzunternehmen benötigt eine permanente Netzwerk-Verbindung zwischen seinem On-Premises-Rechenzentrum und AWS mit konsistent niedriger Latenz, hoher Bandbreite (10 Gbps) und der Garantie, dass der Traffic NICHT über das öffentliche Internet läuft. Welche Lösung erfüllt diese Anforderungen am besten?",
    choices: [
      { id: "A", text: "AWS Site-to-Site VPN über das öffentliche Internet" },
      { id: "B", text: "AWS Direct Connect" },
      { id: "C", text: "AWS Client VPN für jeden Mitarbeiter" },
      { id: "D", text: "Mehrere parallele NAT Gateways" },
    ],
    correct: ["B"],
    explanation:
      "AWS Direct Connect stellt eine dedizierte Glasfaser-Verbindung von einer AWS-Direct-Connect-Location zum Kunden bereit — 1/10/100 Gbps, konsistente Latenz, Traffic NICHT über öffentliches Internet. Aufbau dauert Wochen, dafür stabile Performance + reduzierte Data-Transfer-Kosten. Site-to-Site VPN (A) läuft über das öffentliche Internet (verschlüsselt via IPsec) — schnell aufgesetzt, aber Latenz/Bandbreite hängen vom Internet ab. Client VPN (C) = einzelne Nutzer-Geräte. NAT Gateways (D) = ausgehender Internet-Traffic aus privaten Subnetzen, keine Hybrid-Verbindung.",
    difficulty: 2,
    sourceRef: "AWS Direct Connect Documentation",
  },

  // 3.4 Database — DynamoDB Use Case
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine mobile Gaming-Anwendung benötigt eine Datenbank, die einstellige Millisekunden-Latenz garantiert, automatisch auf Millionen von Requests pro Sekunde skaliert und für ein Key-Value-Datenmodell (Spieler-ID → Profil-Daten) optimiert ist. Welcher AWS-Service ist am besten geeignet?",
    choices: [
      { id: "A", text: "Amazon RDS for PostgreSQL" },
      { id: "B", text: "Amazon Aurora" },
      { id: "C", text: "Amazon DynamoDB" },
      { id: "D", text: "Amazon Redshift" },
    ],
    correct: ["C"],
    explanation:
      "Amazon DynamoDB ist eine vollständig verwaltete, serverless NoSQL-Datenbank: einstellige Millisekunden-Latenz im Standard-Modus, sub-Millisekunden mit DAX-Cache, automatische Skalierung (On-Demand) auf Millionen Requests/Sek., Multi-Region (Global Tables) optional. Ideal für Key-Value- und Document-Workloads, Gaming, IoT, Session-Stores, Shopping Carts. RDS PostgreSQL/Aurora = relational mit SQL-Joins und ACID — andere Stärken, höhere Latenz. Redshift = Data Warehouse für Analytics über große Datenmengen, nicht für Low-Latency-Transaktional.",
    difficulty: 2,
    sourceRef: "Amazon DynamoDB Documentation",
  },

  // 3.4 Database — ElastiCache vs MemoryDB
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Was ist der wesentliche Unterschied zwischen Amazon ElastiCache und Amazon MemoryDB?",
    choices: [
      { id: "A", text: "Beide sind identisch — nur die Preise unterscheiden sich." },
      { id: "B", text: "ElastiCache ist ein In-Memory-Cache (vor anderer Datenbank, nicht-durable); MemoryDB ist eine durable In-Memory-Primär-Datenbank mit Multi-AZ-Persistenz." },
      { id: "C", text: "ElastiCache ist NoSQL, MemoryDB ist relational." },
      { id: "D", text: "ElastiCache läuft nur auf EC2, MemoryDB ist serverless." },
    ],
    correct: ["B"],
    explanation:
      "ElastiCache (für Valkey, Redis OSS oder Memcached) ist ein klassischer Cache vor einer Primär-Datenbank (z. B. RDS) — Daten sind transient, bei Knoten-Ausfall können Schreibvorgänge verloren gehen. MemoryDB nutzt dieselbe Redis/Valkey-API, persistiert aber jeden Schreibvorgang in einem Multi-AZ Transaction Log — durable, geeignet als Primär-Datenbank für Workloads, die Mikrosekunden-Lese-Latenz UND Persistenz brauchen. Faustregel: brauchst du nur Caching → ElastiCache; brauchst du Cache-Geschwindigkeit als Primary Store → MemoryDB.",
    difficulty: 2,
    sourceRef: "Amazon ElastiCache and MemoryDB Documentation",
  },

  // 3.5 Network — CloudFront Use Case
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Welcher der folgenden Anwendungsfälle ist der typischste für Amazon CloudFront?",
    choices: [
      { id: "A", text: "Speichern von Datenbank-Backups in mehreren Regionen für Disaster Recovery" },
      { id: "B", text: "Globale Auslieferung von Webinhalten (HTML, Bilder, Videos, APIs) mit niedriger Latenz durch Caching an Edge Locations weltweit" },
      { id: "C", text: "Ausführen von Schwachstellen-Scans auf EC2-Instanzen" },
      { id: "D", text: "Verschlüsselung von Daten in transit zwischen EC2-Instanzen" },
    ],
    correct: ["B"],
    explanation:
      "Amazon CloudFront ist das AWS Content Delivery Network (CDN): über 600 Edge Locations weltweit cachen Inhalte aus dem Origin (z. B. S3-Bucket, ALB, EC2 oder externer Server) und liefern sie mit niedriger Latenz an Endnutzer aus. Reduziert Origin-Last und Data-Transfer-Kosten. Integriert mit Shield (DDoS) und WAF. Datenbank-Backups (A) = Aurora Cross-Region, RDS Snapshots. Vulnerability Scans (C) = Inspector. Encryption in Transit (D) = TLS, ACM — keine CDN-Funktion.",
    difficulty: 1,
    sourceRef: "Amazon CloudFront Documentation",
  },

  // 3.6 Storage — EBS vs EFS vs FSx
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt: "Welche Aussage über die AWS-Storage-Services ist KORREKT?",
    choices: [
      { id: "A", text: "Amazon EBS = shared file storage für mehrere EC2-Instanzen; Amazon EFS = block storage für eine einzelne EC2-Instanz." },
      { id: "B", text: "Amazon EBS = block storage typischerweise an eine EC2-Instanz in einer AZ angeschlossen; Amazon EFS = NFS-basiertes shared file storage über mehrere EC2-Instanzen und AZs; Amazon FSx = managed file systems für spezifische Protokolle (Windows / Lustre / NetApp ONTAP / OpenZFS)." },
      { id: "C", text: "EBS, EFS und FSx sind funktional identisch — nur die Preise unterscheiden sich." },
      { id: "D", text: "Alle drei Services sind Object Storage und konkurrieren mit Amazon S3." },
    ],
    correct: ["B"],
    explanation:
      "EBS = Block Storage, einer AZ zugeordnet, an eine EC2-Instanz attached (Multi-Attach für io1/io2 ausnahmsweise möglich). Wie eine virtuelle Festplatte. EFS = NFS-basiertes File System, gleichzeitig von tausenden EC2-Instanzen, Lambda-Funktionen oder On-Premises über mehrere AZs nutzbar. Linux-Workloads. FSx = managed file systems für spezielle Protokolle: FSx for Windows (SMB), FSx for Lustre (HPC), FSx for NetApp ONTAP (Enterprise-NAS), FSx for OpenZFS. Keiner davon ist Object Storage (das ist S3).",
    difficulty: 2,
    sourceRef: "AWS Storage Services Documentation",
  },

  // 3.6 Storage — Multi: S3 Lifecycle Actions
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche ZWEI Aktionen können mit Amazon S3 Lifecycle Policies automatisiert werden? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Objekte nach einer definierten Zeitspanne automatisch in eine günstigere Storage-Klasse verschieben (z. B. Standard → Glacier Deep Archive)" },
      { id: "B", text: "Den Bucket automatisch öffentlich zugänglich machen" },
      { id: "C", text: "Objekte nach einer definierten Aufbewahrungsfrist automatisch löschen (Expiration)" },
      { id: "D", text: "Alle Objekte automatisch in einen anderen AWS-Account migrieren" },
      { id: "E", text: "Bucket-Namen automatisch ändern" },
    ],
    correct: ["A", "C"],
    explanation:
      "S3 Lifecycle Policies automatisieren zwei Kategorien: Transition Actions (A) verschieben Objekte zwischen Storage-Klassen (Standard → IA → Glacier Instant/Flexible Retrieval → Deep Archive) basierend auf Alter; Expiration Actions (C) löschen Objekte nach einer Frist (oft Compliance-getrieben, z. B. Logs nach 7 Jahren). Public-Schalten (B) wird über Bucket-Policy gesteuert, nicht Lifecycle. Cross-Account-Migration (D) = S3 Replication, nicht Lifecycle. Bucket-Namen (E) sind unveränderlich nach Erstellung.",
    difficulty: 2,
    sourceRef: "Amazon S3 Lifecycle Configuration Documentation",
  },

  // 3.7 AI/ML + Analytics — Athena vs Redshift
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Analyst möchte einmalig ad-hoc SQL-Queries direkt auf eine Sammlung von CSV- und JSON-Dateien in einem Amazon-S3-Bucket ausführen, ohne vorher die Daten in ein Data Warehouse zu laden oder einen Cluster zu provisionieren. Welcher Service eignet sich am besten?",
    choices: [
      { id: "A", text: "Amazon Redshift" },
      { id: "B", text: "Amazon Athena" },
      { id: "C", text: "Amazon RDS" },
      { id: "D", text: "Amazon DynamoDB" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Athena ist serverless Interactive Query Service: SQL direkt auf Daten in S3 (CSV, JSON, Parquet, ORC, Avro), keine Cluster-Verwaltung, Pay-per-Query (etwa 5 USD pro TB gescannter Daten). Ideal für ad-hoc-Analysen, Log-Auswertung, einmalige Berichte. Redshift = managed Data Warehouse, erfordert Cluster (provisioned oder Serverless), günstiger für regelmäßige komplexe Analysen über große Datenmengen, aber Daten müssen erst geladen werden. RDS = transaktionale DB. DynamoDB = NoSQL Key-Value, nicht für SQL-Analytics.",
    difficulty: 2,
    sourceRef: "Amazon Athena Documentation",
  },

  // 3.8 Other Services — SQS vs SNS vs EventBridge
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung muss Bestellungen entgegennehmen und in eine Warteschlange legen, sodass mehrere Worker-Prozesse die Bestellungen UNABHÄNGIG voneinander und im EIGENEN Tempo abarbeiten können — auch wenn die Worker zwischenzeitlich offline sind. Welcher AWS-Service erfüllt dieses Pull-basierte Queue-Pattern am besten?",
    choices: [
      { id: "A", text: "Amazon Simple Notification Service (SNS)" },
      { id: "B", text: "Amazon Simple Queue Service (SQS)" },
      { id: "C", text: "Amazon EventBridge" },
      { id: "D", text: "Amazon Kinesis Data Streams" },
    ],
    correct: ["B"],
    explanation:
      "Amazon SQS ist eine vollständig verwaltete Message-Queue (Pull-Modell): Producer legen Messages in die Queue, Consumer pollen und arbeiten sie eigenständig ab. Decoupling von Producer/Consumer, Retries, Visibility Timeouts, Dead-Letter-Queues. Genau das beschriebene Bestellungs-Worker-Pattern. SNS (A) = Pub/Sub Fan-Out (Push), eine Message an viele Subscriber gleichzeitig. EventBridge (C) = Event-Bus mit Content-Based Routing, ideal für Multi-Source-Event-Verteilung mit Regeln. Kinesis Data Streams (D) = High-Throughput-Streaming mit Replay-Fähigkeit, andere Anwendungsfälle (z. B. Real-Time-Analytics).",
    difficulty: 2,
    sourceRef: "Amazon SQS Documentation",
  },
];
