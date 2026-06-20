import type { NewFlashcard } from "../../schema";

export const clfC02ComputeStorageCards: NewFlashcard[] = [
  // ── Compute (Domain 3.3) ──

  // 1. EC2 Konzept + Instance Families
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon EC2 — was ist das, und welche 6 Instance-Families gibt es?",
    back: "Elastic Compute Cloud: virtuelle Server (Instanzen) auf Abruf. Instance-Families nach Workload-Typ: M = General Purpose (ausgewogen), C = Compute Optimized (CPU-intensiv), R = Memory Optimized (RAM-intensiv), I = Storage Optimized (NVMe SSD), D = Dense Storage (HDD), G/P = GPU für Grafik/ML.",
    difficulty: 2,
    seedKey: "clf-c02-card-001",
    sourceRef: "AWS EC2 Instance Types Documentation",
  },

  // 2. EC2 Pricing-Optionen
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "EC2 Pricing-Optionen: On-Demand vs Reserved vs Spot vs Savings Plans — Faustregel?",
    back: "On-Demand: pay-per-Stunde, keine Vorab-Verpflichtung, höchster Preis (unvorhersehbare Workloads). Reserved Instances: 1- oder 3-Jahres-Vertrag, bis 72% günstiger (stabile Workloads). Spot: bis 90% günstiger, kann jederzeit unterbrochen werden (fehlertolerante Batch-Workloads). Savings Plans: 1-/3-Jahres-Commitment auf $/Std-Verbrauch, flexibler als RI (gilt instance-family-übergreifend).",
    difficulty: 2,
    seedKey: "clf-c02-card-002",
    sourceRef: "AWS EC2 Pricing",
  },

  // 3. Lambda Konzept + Limits
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Lambda — Definition und wichtigste Limits",
    back: "Serverless Compute: führt Code als Reaktion auf Events aus, ohne Server zu managen. Pay-per-Request + Ausführungszeit. Limits: max 15 Min Timeout (900 sec), 128 MB - 10 GB RAM, 512 MB - 10 GB /tmp-Storage, 6 MB synchrone Response (Streaming bis 20 MB), default 1000 concurrent executions pro Region/Account.",
    difficulty: 2,
    seedKey: "clf-c02-card-003",
    sourceRef: "AWS Lambda Documentation",
  },

  // 4. Container-Services Vergleich
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Container-Services: ECS vs EKS vs Fargate — wann was?",
    back: "ECS (Elastic Container Service): AWS-eigene Container-Orchestrierung, einfacher als Kubernetes, tighter AWS-Integration. EKS (Elastic Kubernetes Service): Managed Kubernetes — Standard wenn du K8s-API/Tooling brauchst. Fargate: Serverless Compute-Engine für Container — funktioniert MIT ECS oder EKS, du kümmerst dich nicht um EC2-Nodes (kein Patchen, kein Skalieren von Worker-Nodes).",
    difficulty: 2,
    seedKey: "clf-c02-card-004",
    sourceRef: "AWS Container Services Overview",
  },

  // 5. ELB-Typen
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Elastic Load Balancer — ALB vs NLB vs GLB?",
    back: "ALB (Application LB): Layer 7 (HTTP/HTTPS), content-based Routing, Path-/Host-based Rules, Web-Anwendungen. NLB (Network LB): Layer 4 (TCP/UDP/TLS), extrem niedrige Latenz, Millionen Requests/Sek., statische IPs. GLB (Gateway LB): Layer 3, für Third-Party-Firewall/Inspection-Appliances. Classic LB ist deprecated — nur für Legacy.",
    difficulty: 2,
    seedKey: "clf-c02-card-005",
    sourceRef: "AWS Elastic Load Balancing",
  },

  // 6. Auto Scaling Group
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Auto Scaling Group — Zweck und Min/Desired/Max?",
    back: "ASG hält automatisch eine definierte Anzahl gesunder EC2-Instanzen am Laufen, basierend auf Min (Mindestkapazität), Desired (Zielkapazität jetzt) und Max (Obergrenze). Skaliert je nach Policy: target-tracking (z.B. CPU 70%), step-scaling, scheduled. Ersetzt automatisch unhealthy Instances. Verteilt Instances über mehrere AZs für HA.",
    difficulty: 2,
    seedKey: "clf-c02-card-006",
    sourceRef: "AWS Auto Scaling Documentation",
  },

  // 7. Lambda Use Cases
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Typische Lambda Use Cases (4 Kategorien)",
    back: "1. API-Backends via API Gateway (REST/HTTP/WebSocket). 2. Event-Verarbeitung: S3-Upload-Trigger, DynamoDB-Stream, SQS, EventBridge. 3. Geplante Tasks: EventBridge-Schedules (Cron-Ersatz). 4. ETL/Datentransformation: kleine Batch-Jobs unter 15 Min. NICHT geeignet: lange Workloads (>15 Min) → Step Functions oder ECS; hochfrequente konstante Last → EC2/Fargate oft günstiger.",
    difficulty: 2,
    seedKey: "clf-c02-card-007",
    sourceRef: "AWS Lambda Use Cases",
  },

  // ── Storage (Domain 3.6) ──

  // 8. S3 Storage-Klassen Übersicht
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "S3 Storage-Klassen — die 8 aktuellen Klassen",
    back: "1. Standard (General Purpose, frequent). 2. Intelligent-Tiering (automatisches Tiering bei unklarem Zugriffsmuster). 3. Express One Zone (ms-Latenz, Single-AZ, hottest Daten, seit 2023). 4. Standard-IA (Infrequent Access, Multi-AZ). 5. One Zone-IA (IA in einer AZ, günstiger). 6. Glacier Instant Retrieval (ms Retrieval, selten zugegriffen). 7. Glacier Flexible Retrieval (Min-Std Retrieval, früher 'Glacier'). 8. Glacier Deep Archive (12+ Std Retrieval, günstigste Klasse).",
    difficulty: 2,
    seedKey: "clf-c02-card-008",
    sourceRef: "Amazon S3 Storage Classes",
  },

  // 9. S3 Glacier-Familie Vergleich
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "S3 Glacier: Instant vs Flexible vs Deep Archive — wann was?",
    back: "Instant Retrieval: ms Zugriff, mind. 90 Tage Storage, für archivierte Daten die selten aber schnell gebraucht werden (Medizinbilder, News-Archive). Flexible Retrieval: 1-5 min (Expedited), 3-5 Std (Standard), 5-12 Std (Bulk), mind. 90 Tage, für Backups die selten und nicht eilig sind. Deep Archive: 12+ Std (Standard) oder 48 Std (Bulk), mind. 180 Tage, günstigste Option für Compliance-Archive (7+ Jahre Aufbewahrung).",
    difficulty: 2,
    seedKey: "clf-c02-card-009",
    sourceRef: "AWS S3 Glacier Storage Classes",
  },

  // 10. EBS Volume-Typen
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "EBS Volume-Typen — die 5 wichtigsten?",
    back: "SSD-basiert: gp3 (General Purpose, neuer Default — IOPS und Throughput unabhängig konfigurierbar), gp2 (älterer Default, IOPS skalieren mit Größe), io2 / io2 Block Express (Provisioned IOPS, höchste Performance + Durability, für I/O-intensive Datenbanken). HDD-basiert: st1 (Throughput Optimized, für Big-Data-Sequential-Workloads wie HDFS), sc1 (Cold HDD, günstigster Storage für seltene Zugriffe).",
    difficulty: 2,
    seedKey: "clf-c02-card-010",
    sourceRef: "AWS EBS Volume Types",
  },

  // 11. EBS vs EFS vs FSx
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Storage-Services: EBS vs EFS vs FSx — Block / File / spezial?",
    back: "EBS: Block Storage, einer AZ zugeordnet, an 1 EC2 angeschlossen (wie eine virtuelle Festplatte). EFS: NFS-basiertes File System, gleichzeitig nutzbar von vielen EC2-Instanzen über mehrere AZs (Linux-Workloads). FSx: Managed File Systems für spezifische Protokolle — FSx for Windows (SMB), FSx for Lustre (HPC), FSx for NetApp ONTAP (Enterprise-NAS), FSx for OpenZFS. Keiner davon ist Object Storage (das ist S3).",
    difficulty: 2,
    seedKey: "clf-c02-card-011",
    sourceRef: "AWS Storage Services Comparison",
  },

  // 12. FSx Familie
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "FSx — die 4 verfügbaren Dateisysteme?",
    back: "FSx for Windows File Server: SMB-Protokoll, Windows-Workloads, Active-Directory-Integration. FSx for Lustre: High-Performance File System für HPC, ML, Media Processing — extrem niedrige Latenz und hohe Throughput. FSx for NetApp ONTAP: Enterprise-NAS-Features (Snapshots, Replikation, SnapMirror) für Workloads die ONTAP brauchen. FSx for OpenZFS: ZFS-kompatibel, Snapshots, Clones — für Linux-Workloads die ZFS-Features brauchen.",
    difficulty: 2,
    seedKey: "clf-c02-card-012",
    sourceRef: "AWS FSx Product Family",
  },

  // 13. AWS Backup (Format B — Frage-Antwort)
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Welcher AWS-Service zentralisiert Backups quer über EBS, RDS, DynamoDB, EFS, FSx, Storage Gateway, Aurora und S3?",
    back: "AWS Backup: zentrale, policy-basierte Backup-Lösung. Statt jeden Service einzeln zu konfigurieren, definierst du Backup-Pläne (Frequenz, Aufbewahrung, Region) und wendest sie via Tags oder explizit auf Ressourcen an. Unterstützt Cross-Region- und Cross-Account-Backups, Vault Lock für Compliance (WORM), Audit-Berichte. Spart Operations-Aufwand massiv gegenüber Service-eigenen Backup-Mechanismen.",
    difficulty: 1,
    seedKey: "clf-c02-card-013",
    sourceRef: "AWS Backup Documentation",
  },

  // 14. Storage Gateway
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Storage Gateway — die 3 Modi und ihre Use Cases?",
    back: "File Gateway: NFS/SMB-Interface, schreibt in S3-Buckets — für File-basierten Zugriff aus On-Premises. Volume Gateway: iSCSI-Block-Storage, im Stored-Mode (Daten On-Prem, Backup in S3) oder Cached-Mode (häufige Daten On-Prem, Rest in S3). Tape Gateway: emuliert eine virtuelle Tape Library (VTL), kompatibel mit bestehender Backup-Software (z.B. Veeam, Veritas) — schreibt in S3 + Glacier. Brücke zwischen On-Prem-Workloads und Cloud-Storage.",
    difficulty: 2,
    seedKey: "clf-c02-card-014",
    sourceRef: "AWS Storage Gateway Documentation",
  },

  // 15. S3 Lifecycle Policy
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Was kann eine S3 Lifecycle Policy automatisieren? (2 Aktionstypen)",
    back: "1. Transition Actions: Objekte nach Alter zwischen Storage-Klassen verschieben (z.B. Standard → IA nach 30 Tagen → Glacier nach 90 → Deep Archive nach 365). 2. Expiration Actions: Objekte nach Aufbewahrungsfrist automatisch löschen (z.B. Logs nach 7 Jahren). Kombinierbar pro Bucket oder Prefix. NICHT automatisierbar: Public-Schalten (=Bucket-Policy), Cross-Account-Migration (=S3 Replication), Bucket-Umbenennung (Bucket-Namen unveränderlich).",
    difficulty: 1,
    seedKey: "clf-c02-card-015",
    sourceRef: "Amazon S3 Lifecycle Configuration",
  },
];
