// src/db/seed/questions/clf-c02-q-ct1-batch3.ts
//
// Batch 3 — Cloud Technology and Services, Teil 1 von 2 (17 Fragen):
// Compute (6), Storage (5), Database (6).
// Prüfungstreue EIGEN-Fragen, thematisch disjunkt zu den 53 bestehenden
// Cloud-Tech-Fragen (Batch 1 + 2) und zu CC/Security-Batch-3.
// Difficulty: 2× diff 1, 15× diff 2. Multiple-Response: 2 von 17.
//
// INTEGRATION (Code-Claude): in den Batch-3-Index + src/db/seed.ts aufnehmen.

import type { NewQuestion } from "../../schema";

export const clfC02QCloudTech1B3: NewQuestion[] = [
  // ── Compute ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Entwickler möchte eine Webanwendung hochladen und von AWS automatisch bereitstellen lassen (Kapazität, Load Balancing, Skalierung, Health-Monitoring), ohne die zugrunde liegende Infrastruktur manuell konfigurieren zu müssen — aber bei Bedarf weiter Zugriff auf die Ressourcen behalten. Welcher Dienst passt am besten?",
    choices: [
      { id: "A", text: "AWS Elastic Beanstalk" },
      { id: "B", text: "Amazon S3" },
      { id: "C", text: "Amazon Route 53" },
      { id: "D", text: "AWS Snowball" },
    ],
    correct: ["A"],
    explanation:
      "AWS Elastic Beanstalk ist ein Platform-as-a-Service (PaaS): Man lädt den Anwendungscode hoch, und Beanstalk übernimmt Provisioning, Load Balancing, Auto Scaling und Health-Monitoring — während der Kunde weiterhin Zugriff auf die erzeugten AWS-Ressourcen (EC2, ELB usw.) behält. S3 (Objektspeicher), Route 53 (DNS) und Snowball (Datenmigration) leisten das nicht.",
    difficulty: 2,
    sourceRef: "AWS Elastic Beanstalk",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welcher Dienst fügt automatisch EC2-Instanzen hinzu, wenn die Last steigt, und entfernt sie wieder, wenn die Last sinkt, um eine gewünschte Kapazität aufrechtzuerhalten?",
    choices: [
      { id: "A", text: "Amazon EC2 Auto Scaling" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Config" },
      { id: "D", text: "Amazon Athena" },
    ],
    correct: ["A"],
    explanation:
      "Amazon EC2 Auto Scaling passt die Anzahl der EC2-Instanzen automatisch an die Last an (Scale Out / Scale In nach Richtlinien), hält die gewünschte Kapazität und ersetzt unhealthy Instanzen. Es arbeitet typischerweise mit einem Load Balancer zusammen. CloudFront (CDN), Config (Konfigurations-Tracking) und Athena (SQL auf S3) skalieren keine EC2-Flotte.",
    difficulty: 2,
    sourceRef: "Amazon EC2 Auto Scaling",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung hält sehr große Datensätze für schnelle Verarbeitung im Arbeitsspeicher (in-memory). Welche EC2-Instanz-Kategorie ist dafür am besten geeignet?",
    choices: [
      { id: "A", text: "Compute-optimized (rechenoptimiert)" },
      { id: "B", text: "Memory-optimized (speicheroptimiert)" },
      { id: "C", text: "Storage-optimized (speicherplatzoptimiert)" },
      { id: "D", text: "General purpose (universell)" },
    ],
    correct: ["B"],
    explanation:
      "Memory-optimized-Instanzen bieten besonders viel RAM pro vCPU und eignen sich für arbeitsspeicherintensive Workloads wie In-Memory-Datenbanken, große Caches oder Echtzeit-Big-Data-Analysen. Compute-optimized passt für CPU-lastige Aufgaben, Storage-optimized für hohen lokalen Durchsatz/IOPS, General Purpose für ausgewogene Workloads.",
    difficulty: 2,
    sourceRef: "Amazon EC2 — Instance Type Families",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Einsteiger möchte eine einfache Website mit vorhersehbaren, niedrigen monatlichen Kosten und minimaler Konfiguration starten (Compute, Storage und Netzwerk gebündelt). Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon Lightsail" },
      { id: "B", text: "Amazon Redshift" },
      { id: "C", text: "AWS Lambda" },
      { id: "D", text: "Amazon EMR" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Lightsail ist der vereinfachte Einstieg: vordefinierte Pakete aus Compute, Storage und Netzwerk zu einem vorhersehbaren, niedrigen Monatspreis — ideal für einfache Websites, Blogs, kleine Apps oder Dev/Test, ohne sich tief in EC2/VPC einarbeiten zu müssen. Redshift (Data Warehouse), Lambda (serverless Functions) und EMR (Big Data) dienen anderen Zwecken.",
    difficulty: 1,
    sourceRef: "Amazon Lightsail",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Team betreibt containerisierte Workloads und möchte explizit die Orchestrierung über KUBERNETES nutzen, jedoch als verwalteten Dienst. Welcher AWS-Dienst passt?",
    choices: [
      { id: "A", text: "Amazon ECS (Elastic Container Service)" },
      { id: "B", text: "Amazon EKS (Elastic Kubernetes Service)" },
      { id: "C", text: "AWS Lambda" },
      { id: "D", text: "Amazon Lightsail" },
    ],
    correct: ["B"],
    explanation:
      "Amazon EKS ist der verwaltete Kubernetes-Dienst von AWS — passend, wenn man bewusst das Kubernetes-Ökosystem nutzen möchte. Amazon ECS ist AWS' eigene Container-Orchestrierung (oft einfacher, ohne Kubernetes). Beide können EC2 oder Fargate als Compute nutzen. Lambda ist für ereignisgesteuerte Funktionen, Lightsail für einfache Apps.",
    difficulty: 2,
    sourceRef: "Amazon EKS vs Amazon ECS",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen muss regelmäßig sehr viele rechenintensive Batch-Jobs (z. B. Simulationen) ausführen und möchte, dass AWS die dafür nötige Rechenkapazität automatisch bereitstellt und nach Abschluss wieder abbaut. Welcher Dienst ist speziell dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Batch" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "Amazon Cognito" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["A"],
    explanation:
      "AWS Batch ist ein vollständig verwalteter Dienst für Batch-Computing: Er plant Jobs ein und stellt dynamisch die passende Rechenkapazität (EC2, inkl. Spot, oder Fargate) bereit, skaliert mit der Job-Menge und baut sie danach wieder ab. CloudFront (CDN), Cognito (End-User-Identitäten) und Artifact (Compliance-Berichte) sind dafür nicht vorgesehen.",
    difficulty: 2,
    sourceRef: "AWS Batch",
  },

  // ── Storage ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen möchte seinen On-Premises-Anwendungen nahtlosen Zugriff auf nahezu unbegrenzten AWS-Cloud-Speicher geben und dabei häufig genutzte Daten lokal zwischenspeichern (hybrider Storage). Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Storage Gateway" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Direct Connect" },
      { id: "D", text: "Amazon DynamoDB" },
    ],
    correct: ["A"],
    explanation:
      "AWS Storage Gateway verbindet On-Premises-Umgebungen mit AWS-Cloud-Speicher (File, Volume und Tape Gateway) und hält häufig genutzte Daten lokal im Cache — für hybride Storage-Szenarien, Backups und schrittweise Migration. Direct Connect ist eine Netzwerk-Leitung (kein Storage-Dienst), CloudFront ein CDN, DynamoDB eine NoSQL-Datenbank.",
    difficulty: 2,
    sourceRef: "AWS Storage Gateway",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Unternehmen möchte Backups mehrerer AWS-Dienste (z. B. Amazon EBS, Amazon RDS, Amazon DynamoDB, Amazon EFS) zentral über Richtlinien planen, durchführen und überwachen. Welcher Dienst ist dafür vorgesehen?",
    choices: [
      { id: "A", text: "AWS Backup" },
      { id: "B", text: "Amazon S3 Glacier Deep Archive" },
      { id: "C", text: "AWS CloudFormation" },
      { id: "D", text: "Amazon Athena" },
    ],
    correct: ["A"],
    explanation:
      "AWS Backup ist ein zentraler, richtlinienbasierter Backup-Dienst, der Sicherungen über viele AWS-Services hinweg (EBS, RDS, Aurora, DynamoDB, EFS, FSx, Storage Gateway u. a.) plant, ausführt, aufbewahrt und überwacht. Glacier Deep Archive ist nur eine Storage-Klasse (ein mögliches Backup-Ziel), CloudFormation ist IaC, Athena ist ein Abfrage-Dienst.",
    difficulty: 2,
    sourceRef: "AWS Backup",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Daten in einem S3-Bucket werden mal häufig, mal lange gar nicht abgerufen — das Zugriffsmuster ist unvorhersehbar. Das Unternehmen möchte Kosten optimieren, ohne Zugriffe manuell zu analysieren. Welche S3-Speicherklasse ist am besten geeignet?",
    choices: [
      { id: "A", text: "S3 Intelligent-Tiering" },
      { id: "B", text: "S3 Glacier Deep Archive" },
      { id: "C", text: "S3 Standard für alle Objekte dauerhaft" },
      { id: "D", text: "S3 One Zone-IA für alle Objekte dauerhaft" },
    ],
    correct: ["A"],
    explanation:
      "S3 Intelligent-Tiering verschiebt Objekte automatisch zwischen Zugriffs-Stufen (häufig/selten/archiviert) je nach tatsächlicher Nutzung und optimiert so die Kosten — ideal bei unbekannten oder wechselnden Zugriffsmustern, ohne Abrufgebühren für die Tier-Wechsel. Deep Archive ist nur für selten genutzte Archivdaten, durchgängig Standard ist teuer, durchgängig One Zone-IA wäre riskant für wichtige Daten.",
    difficulty: 2,
    sourceRef: "Amazon S3 — Intelligent-Tiering",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Welche S3-Speicherklasse speichert Daten in nur EINER Availability Zone, ist dadurch günstiger als die Standard-IA-Klasse, eignet sich aber nur für selten genutzte und leicht reproduzierbare Daten?",
    choices: [
      { id: "A", text: "S3 Standard" },
      { id: "B", text: "S3 One Zone-Infrequent Access (One Zone-IA)" },
      { id: "C", text: "S3 Glacier Instant Retrieval" },
      { id: "D", text: "S3 Intelligent-Tiering" },
    ],
    correct: ["B"],
    explanation:
      "S3 One Zone-IA speichert Daten in einer einzelnen AZ und ist deshalb günstiger als S3 Standard-IA (das über mehrere AZs repliziert). Der Trade-off: Geht diese AZ verloren, sind die Daten weg. Daher nur für selten genutzte, unkritische oder leicht wiederherstellbare Daten (z. B. sekundäre Backups, reproduzierbare Zwischenergebnisse). S3 Standard und Glacier Instant Retrieval replizieren über mehrere AZs.",
    difficulty: 2,
    sourceRef: "Amazon S3 — One Zone-IA",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "Welche ZWEI Aussagen über EC2 Instance Store und Amazon EBS sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Daten im Instance Store gehen verloren, wenn die Instanz gestoppt oder beendet wird (ephemer)." },
      { id: "B", text: "Amazon EBS bietet persistenten Block-Speicher, der unabhängig vom Lebenszyklus der Instanz bestehen bleibt." },
      { id: "C", text: "Der Instance Store ist immer dauerhaft persistent." },
      { id: "D", text: "Amazon EBS ist ein Objektspeicher wie S3." },
      { id: "E", text: "Beide sind identisch und austauschbar." },
    ],
    correct: ["A", "B"],
    explanation:
      "Der EC2 Instance Store ist physisch an den Host gebundener, EPHEMERER Speicher — beim Stoppen/Beenden der Instanz gehen die Daten verloren (gut für Caches/Scratch-Daten). Amazon EBS ist dagegen PERSISTENTER, netzgebundener Block-Speicher, der unabhängig von der Instanz bestehen bleibt und sich an andere Instanzen anhängen lässt. EBS ist kein Objektspeicher (das ist S3), und die beiden sind nicht austauschbar.",
    difficulty: 2,
    sourceRef: "Amazon EC2 — Instance Store vs EBS",
  },

  // ── Database ──
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung muss stark vernetzte Daten und deren Beziehungen effizient abfragen (z. B. soziale Netzwerke, Betrugserkennung, Empfehlungs-Beziehungen). Welcher AWS-Datenbankdienst ist dafür speziell gebaut?",
    choices: [
      { id: "A", text: "Amazon Neptune" },
      { id: "B", text: "Amazon RDS for PostgreSQL" },
      { id: "C", text: "Amazon Redshift" },
      { id: "D", text: "Amazon S3" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Neptune ist ein verwalteter Graph-Datenbankdienst, optimiert für stark vernetzte Daten und Beziehungs-Abfragen (Property Graph / RDF) — typisch für soziale Netzwerke, Betrugserkennung, Wissensgraphen und Empfehlungen. Eine relationale DB (RDS) oder ein Data Warehouse (Redshift) sind für tiefe Graph-Traversierung weniger geeignet; S3 ist Objektspeicher.",
    difficulty: 2,
    sourceRef: "Amazon Neptune",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Ein Team nutzt MongoDB und möchte zu einem verwalteten AWS-Dienst wechseln, der mit MongoDB kompatibel ist und Dokumente (JSON-ähnlich) speichert. Welcher Dienst passt?",
    choices: [
      { id: "A", text: "Amazon DocumentDB (with MongoDB compatibility)" },
      { id: "B", text: "Amazon DynamoDB" },
      { id: "C", text: "Amazon RDS for SQL Server" },
      { id: "D", text: "Amazon ElastiCache" },
    ],
    correct: ["A"],
    explanation:
      "Amazon DocumentDB ist ein verwalteter Dokumenten-Datenbankdienst mit MongoDB-Kompatibilität — passend für Workloads, die das MongoDB-Modell/API nutzen. DynamoDB ist eine (eigene) NoSQL-Key-Value/Document-DB ohne MongoDB-Kompatibilität, RDS for SQL Server ist relational, ElastiCache ist ein In-Memory-Cache.",
    difficulty: 2,
    sourceRef: "Amazon DocumentDB",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine global genutzte Anwendung benötigt für Amazon DynamoDB niedrige Latenz in mehreren Regionen und soll auch beim Ausfall einer Region weiterarbeiten. Welche DynamoDB-Funktion erfüllt das?",
    choices: [
      { id: "A", text: "DynamoDB Global Tables (Multi-Region-Replikation)" },
      { id: "B", text: "Ein einzelner DynamoDB-Tisch in einer Region" },
      { id: "C", text: "Amazon CloudFront vor DynamoDB" },
      { id: "D", text: "Eine S3-Lifecycle-Policy" },
    ],
    correct: ["A"],
    explanation:
      "DynamoDB Global Tables replizieren eine Tabelle automatisch und aktiv-aktiv über mehrere AWS-Regionen — das liefert lokale Lese-/Schreib-Latenz für globale Nutzer und erhöht die Ausfallsicherheit (eine Region kann ausfallen, andere übernehmen). Ein Single-Region-Tisch bietet das nicht; CloudFront ist ein CDN; S3-Lifecycle betrifft Objektspeicher.",
    difficulty: 2,
    sourceRef: "Amazon DynamoDB — Global Tables",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine leselastige Anwendung fragt immer wieder dieselben Daten aus einer relationalen Datenbank ab, was die Datenbank stark belastet. Wie lässt sich die Lese-Latenz senken und die Datenbank entlasten?",
    choices: [
      { id: "A", text: "Eine In-Memory-Cache-Schicht mit Amazon ElastiCache vorschalten" },
      { id: "B", text: "Die Datenbank durch Amazon S3 ersetzen" },
      { id: "C", text: "Alle Daten nach Amazon Glacier verschieben" },
      { id: "D", text: "AWS Shield aktivieren" },
    ],
    correct: ["A"],
    explanation:
      "Amazon ElastiCache (für Valkey, Redis OSS oder Memcached) legt häufig gelesene Daten im Arbeitsspeicher ab. Wiederkehrende Lese-Anfragen werden aus dem Cache bedient — das senkt die Latenz drastisch und entlastet die Primär-Datenbank. S3/Glacier sind kein Datenbank-Cache; Shield ist DDoS-Schutz.",
    difficulty: 1,
    sourceRef: "Amazon ElastiCache — Caching",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "single",
    prompt:
      "Eine Anwendung hat stark schwankende, teils unvorhersehbare Datenbanklast und soll nicht für dauerhaft bereitgestellte Kapazität zahlen. Welche Option von Amazon Aurora passt am besten?",
    choices: [
      { id: "A", text: "Aurora Serverless (automatisch skalierende Kapazität)" },
      { id: "B", text: "Eine fest dimensionierte, durchgehend laufende Aurora-Instanz" },
      { id: "C", text: "Amazon Redshift" },
      { id: "D", text: "Amazon S3" },
    ],
    correct: ["A"],
    explanation:
      "Aurora Serverless skaliert die Datenbank-Kapazität automatisch je nach Last hoch und runter, sodass man nicht dauerhaft für fest bereitgestellte Kapazität zahlt — ideal für schwankende, intermittierende oder unvorhersehbare Workloads. Eine fest dimensionierte Instanz wäre für sporadische Last unwirtschaftlich; Redshift ist ein Data Warehouse, S3 ein Objektspeicher.",
    difficulty: 2,
    sourceRef: "Amazon Aurora Serverless",
  },
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    type: "multiple",
    prompt:
      "AWS bietet 'purpose-built' Datenbanken für unterschiedliche Datenmodelle. Welche ZWEI Zuordnungen von Workload zu Dienst sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Graph-/Beziehungsdaten → Amazon Neptune" },
      { id: "B", text: "Key-Value mit Millisekunden-Latenz im großen Maßstab → Amazon DynamoDB" },
      { id: "C", text: "Beliebige Datei-Objekte/Bilder → Amazon RDS" },
      { id: "D", text: "Relationale ACID-Transaktionen → Amazon S3" },
      { id: "E", text: "In-Memory-Cache → Amazon Redshift" },
    ],
    correct: ["A", "B"],
    explanation:
      "AWS empfiehlt, je Workload die passende Datenbank zu wählen: Graph → Neptune, Key-Value im großen Maßstab → DynamoDB, relational/ACID → RDS/Aurora, In-Memory-Cache → ElastiCache/MemoryDB, Data Warehouse → Redshift, Dokument → DocumentDB. Datei-Objekte gehören nach S3 (nicht RDS), relationale Transaktionen nicht nach S3, und Redshift ist kein In-Memory-Cache — daher sind C, D und E falsch.",
    difficulty: 2,
    sourceRef: "AWS Purpose-Built Databases",
  },
];
