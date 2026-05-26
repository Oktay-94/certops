// src/db/seed/cards/clf-c02-database-networking.ts

import type { NewFlashcard } from "../../schema";

export const clfC02DatabaseNetworkingCards: NewFlashcard[] = [
  // ── Datenbanken ──

  // 1. RDS
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon RDS — was ist das, welche Engines?",
    back: "Relational Database Service: managed relationale DB — AWS übernimmt Setup, Patching, Backups, Failover. 6 Engines: MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Db2. Du verwaltest keine Server, nur Daten und Schema. Nicht serverless (außer Aurora Serverless) — du wählst Instanz-Größe.",
    difficulty: 1,
    sourceRef: "AWS RDS Documentation",
  },

  // 2. Aurora
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Aurora — was macht es besonders?",
    back: "Cloud-native relationale DB, kompatibel mit MySQL und PostgreSQL. Bis zu 5x schneller als Standard-MySQL, 3x schneller als PostgreSQL. Speicher automatisch 6-fach über 3 AZs repliziert (hohe Ausfallsicherheit, self-healing). Storage wächst automatisch bis 128 TB. Bis zu 15 Read Replicas. Teil der RDS-Familie, aber eigene Architektur.",
    difficulty: 2,
    sourceRef: "AWS Aurora Documentation",
  },

  // 3. Multi-AZ vs Read Replica
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "RDS Multi-AZ vs Read Replica — wofür je?",
    back: "Multi-AZ: synchroner Standby in anderer AZ, NUR für Hochverfügbarkeit/Failover (Standby ist nicht lesbar im klassischen Modus). Automatischer Failover bei Ausfall. Read Replica: asynchrone Kopie(n), für LESE-Skalierung (Last verteilen), lesbar, kann zu eigenständiger DB promoted werden. Faustregel: Multi-AZ = Verfügbarkeit, Read Replica = Performance.",
    difficulty: 2,
    sourceRef: "AWS RDS High Availability",
  },

  // 4. DynamoDB
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon DynamoDB — was ist das?",
    back: "Vollständig managed NoSQL-Datenbank (Key-Value + Document). Serverless — keine Instanzen, automatische Skalierung. Single-digit-Millisekunden-Latenz bei jeder Größe. Global Tables für Multi-Region-Replikation. Ideal für hohe Lese-/Schreiblast mit einfachem Zugriffsmuster (Gaming, IoT, Shopping Carts). Kein SQL, keine komplexen Joins.",
    difficulty: 2,
    sourceRef: "AWS DynamoDB Documentation",
  },

  // 5. ElastiCache
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon ElastiCache — Zweck und Varianten?",
    back: "Managed In-Memory-Cache — beschleunigt Anwendungen, indem häufig abgefragte Daten im RAM gehalten werden (statt jedes Mal die DB zu fragen). Zwei Engines: Redis (persistent, Replikation, komplexe Datentypen) und Memcached (einfach, multi-threaded, reines Caching). Use Cases: Session-Stores, DB-Query-Caching, Leaderboards.",
    difficulty: 1,
    sourceRef: "AWS ElastiCache Documentation",
  },

  // 6. Redshift
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Redshift — wofür?",
    back: "Managed Data Warehouse für Analytics auf großen Datenmengen (Petabyte-Scale). Spaltenbasierte Speicherung + Parallelverarbeitung (MPP) → schnelle komplexe Abfragen über riesige Datensätze. Für OLAP (Analyse, Reporting, BI), NICHT für OLTP (Transaktionen — dafür RDS/Aurora). Redshift Spectrum fragt Daten direkt in S3 ab.",
    difficulty: 2,
    sourceRef: "AWS Redshift Documentation",
  },

  // 7. RDS vs DynamoDB
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "RDS/Aurora vs DynamoDB — wann was?",
    back: "RDS/Aurora (relational/SQL): wenn du Joins, komplexe Abfragen, Transaktionen, festes Schema brauchst (Buchhaltung, ERP, klassische Web-Apps). DynamoDB (NoSQL): wenn du extreme Skalierung, flexibles Schema, einfache Key-basierte Zugriffe und konstant niedrige Latenz brauchst (Millionen Requests/Sek., Gaming, IoT). Faustregel: strukturierte Beziehungen → SQL; massive Skalierung + einfacher Zugriff → NoSQL.",
    difficulty: 2,
    sourceRef: "AWS Database Comparison",
  },

  // 8. DMS
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Database Migration Service (DMS) — Zweck?",
    back: "Migriert Datenbanken nach AWS mit minimaler Downtime — Quell-DB bleibt während der Migration verfügbar. Unterstützt homogene Migration (Oracle → Oracle) und heterogene (Oracle → Aurora, mit AWS Schema Conversion Tool / SCT für Schema-Umwandlung). Auch für laufende Replikation. Use Case: On-Premises-DB in die Cloud bringen, ohne den Betrieb zu stoppen.",
    difficulty: 1,
    sourceRef: "AWS DMS Documentation",
  },

  // 9. Aurora Serverless
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Aurora Serverless — wann sinnvoll?",
    back: "Aurora-Variante, die Kapazität automatisch hoch-/runterskaliert (auch auf nahe null bei Inaktivität) je nach Last. Du zahlst pro verbrauchter Kapazität, nicht für eine feste Instanz. Ideal für unvorhersehbare/schwankende Workloads, selten genutzte Apps, Dev/Test-Umgebungen. Bei konstanter Last ist provisioniertes Aurora oft günstiger.",
    difficulty: 2,
    sourceRef: "AWS Aurora Serverless",
  },

  // ── Networking ──

  // 10. VPC
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon VPC — was ist das?",
    back: "Virtual Private Cloud: dein eigenes, isoliertes virtuelles Netzwerk in AWS. Du definierst IP-Bereiche, Subnetze, Routing, Gateways. Wie ein abgegrenztes privates Rechenzentrum in der Cloud — andere AWS-Kunden haben keinen Zugriff. Grundlage für die meisten AWS-Workloads (EC2, RDS etc. laufen in einer VPC).",
    difficulty: 1,
    sourceRef: "AWS VPC Documentation",
  },

  // 11. Subnets
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Public vs Private Subnet — Unterschied?",
    back: "Public Subnet: hat eine Route zum Internet Gateway → Ressourcen können direkt aus dem Internet erreichbar sein (z.B. Web-Server, Load Balancer). Private Subnet: keine direkte Internet-Route → für geschützte Ressourcen (Datenbanken, Backend-Server). Private Subnets erreichen das Internet ausgehend nur über ein NAT Gateway.",
    difficulty: 2,
    sourceRef: "AWS VPC Subnets",
  },

  // 12. Security Groups vs NACLs
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Security Groups vs Network ACLs — Unterschied?",
    back: "Security Group: Firewall auf INSTANZ-Ebene (z.B. an EC2), stateful (Antwort-Traffic automatisch erlaubt), nur Allow-Regeln. Network ACL (NACL): Firewall auf SUBNETZ-Ebene, stateless (Hin- und Rückweg müssen beide erlaubt sein), Allow UND Deny-Regeln. Faustregel: SG = pro Ressource, NACL = pro Subnetz, zusätzliche Schicht.",
    difficulty: 2,
    sourceRef: "AWS VPC Security",
  },

  // 13. Route 53
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon Route 53 — was macht es?",
    back: "Managed DNS-Service (Domain → IP-Auflösung) + Domain-Registrierung + Health Checks. Routing-Policies: Simple, Weighted (Lastverteilung in %), Latency-based (schnellste Region), Failover (Disaster Recovery), Geolocation. Der Name kommt vom DNS-Port 53. Verbindet Nutzer mit deinen AWS- oder externen Ressourcen.",
    difficulty: 1,
    sourceRef: "AWS Route 53 Documentation",
  },

  // 14. CloudFront
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon CloudFront — Zweck?",
    back: "Content Delivery Network (CDN): cached Inhalte an weltweiten Edge Locations nahe beim Nutzer → schnellere Ladezeiten, weniger Last auf dem Ursprung. Liefert statische UND dynamische Inhalte (Webseiten, Videos, APIs). Integriert mit S3, EC2, ELB. Bietet zusätzlich DDoS-Schutz (mit AWS Shield) und HTTPS.",
    difficulty: 1,
    sourceRef: "AWS CloudFront Documentation",
  },

  // 15. Internet Gateway vs NAT Gateway
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Internet Gateway vs NAT Gateway — Unterschied?",
    back: "Internet Gateway (IGW): verbindet die VPC mit dem Internet, ermöglicht eingehenden UND ausgehenden Verkehr (für Public Subnets). NAT Gateway: lässt Ressourcen in PRIVATEN Subnets ausgehend ins Internet (z.B. Updates laden), aber blockiert eingehende Verbindungen von außen. Faustregel: IGW = Tür in beide Richtungen, NAT = nur raus, nicht rein.",
    difficulty: 2,
    sourceRef: "AWS VPC Gateways",
  },
];
