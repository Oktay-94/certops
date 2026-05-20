import { db } from "./index";
import { questionAttempts, questions, type NewQuestion } from "./schema";

// CLF-C02 domains (AWS Exam Guide):
//   1. Cloud Concepts
//   2. Security and Compliance
//   3. Cloud Technology and Services
//   4. Billing, Pricing, and Support
const clfC02Questions: NewQuestion[] = [
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
    sourceRef: "AWS Exam Guide CLF-C02, Domain 1.1",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche zwei Maßnahmen entsprechen den AWS-IAM-Best-Practices für den Root-User eines AWS-Accounts? (Wähle ZWEI.)",
    choices: [
      { id: "A", text: "Multi-Factor Authentication (MFA) für den Root-User aktivieren" },
      { id: "B", text: "Access Keys für den Root-User erstellen und in der CI-Pipeline verwenden" },
      { id: "C", text: "Den Root-User für tägliche Verwaltungsaufgaben nutzen" },
      { id: "D", text: "Den Root-User nur für Aufgaben verwenden, die ihn zwingend erfordern" },
      { id: "E", text: "Den Root-User per IP-Whitelist absichern und ohne MFA arbeiten" },
    ],
    correct: ["A", "D"],
    explanation:
      "Best Practice: MFA aktivieren (A) und den Root-User nur für die wenigen Aufgaben nutzen, die ihn explizit verlangen (D), z. B. Account-Schließung oder Support-Plan-Wechsel. Access Keys für Root sollen NICHT existieren, und tägliche Arbeit erfolgt über IAM-User/Roles. E ist falsch: eine IP-Whitelist ersetzt MFA nicht — AWS empfiehlt explizit MFA für den Root-User, da eine Netzwerk-Einschränkung allein keinen Schutz gegen kompromittierte Credentials (Phishing, Leak) bietet.",
    difficulty: 2,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 2.2",
  },
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
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt einen produktiven Datenbank-Workload, der 24/7 für mindestens die nächsten drei Jahre laufen muss. Welches EC2-Pricing-Modell bietet hier typischerweise die größte Kostenersparnis gegenüber On-Demand?",
    choices: [
      { id: "A", text: "Spot Instances" },
      { id: "B", text: "On-Demand Instances mit Auto Scaling" },
      { id: "C", text: "Reserved Instances / Savings Plans für 3 Jahre, All Upfront" },
      { id: "D", text: "Dedicated Hosts on-demand" },
    ],
    correct: ["C"],
    explanation:
      "Für vorhersehbare, dauerhaft laufende Workloads bieten 3-Jahres-Commitments (Reserved Instances oder Compute/EC2 Savings Plans) mit 'All Upfront' die höchsten Rabatte (bis ~72 % gegenüber On-Demand). Spot ist ungeeignet für stateful DBs (kann unterbrochen werden). Dedicated Hosts sind teurer und auf Compliance/Lizenz-Use-Cases zugeschnitten.",
    difficulty: 2,
    sourceRef: "AWS Exam Guide CLF-C02, Domain 4.1",
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
    sourceRef: "AWS Global Infrastructure Documentation, Amazon CloudFront Documentation",
  },

  // ── Security and Compliance (+9) ──
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Im Rahmen des AWS Shared Responsibility Model — für welche der folgenden Sicherheitsaufgaben ist AUSSCHLIESSLICH AWS verantwortlich?",
    choices: [
      { id: "A", text: "Patchen des Betriebssystems auf einer EC2-Instanz" },
      { id: "B", text: "Konfiguration von Security Groups für EC2-Instanzen" },
      { id: "C", text: "Physische Sicherheit der Rechenzentren" },
      { id: "D", text: "Verschlüsselung der Daten in einem S3-Bucket" },
    ],
    correct: ["C"],
    explanation:
      "AWS verantwortet die 'Security OF the Cloud' — physische Sicherheit der Rechenzentren (Zugangskontrollen, Wachpersonal, Brandschutz), Hardware, globales Netzwerk, Virtualisierungs-Hypervisor. Der Kunde verantwortet 'Security IN the Cloud' — alles was er konfiguriert: OS-Patches auf EC2, Security Groups, Verschlüsselung in S3. Bei verwalteten Services (RDS, Lambda) übernimmt AWS mehr, bei IaaS (EC2) der Kunde mehr.",
    difficulty: 1,
    sourceRef: "AWS Shared Responsibility Model — https://aws.amazon.com/compliance/shared-responsibility-model/",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Entwicklerteam benötigt programmgesteuerten Zugriff auf S3-Buckets von einer EC2-Anwendung aus. Welche IAM-Komponente ist die bewährte Praxis (Best Practice) für diesen Anwendungsfall?",
    choices: [
      {
        id: "A",
        text: "Erstellen eines IAM Users und Einbetten der Access Keys in die Anwendung",
      },
      {
        id: "B",
        text: "Erstellen einer IAM Role, die der EC2-Instanz zugewiesen wird",
      },
      {
        id: "C",
        text: "Speichern der Root-Account-Credentials in einer Umgebungsvariable",
      },
      {
        id: "D",
        text: "Erstellen einer IAM Group mit den notwendigen Berechtigungen",
      },
    ],
    correct: ["B"],
    explanation:
      "IAM Roles sind der AWS Best Practice für Anwendungen. Wenn eine Rolle einer EC2-Instanz zugewiesen wird (Instance Profile), bekommt die Anwendung temporäre Credentials, die AWS automatisch verwaltet und rotiert. Keine Access Keys im Code. Access Keys einbetten ist klassischer Sicherheits-Fehler (Git-Leaks). Root-Credentials niemals nutzen. IAM Groups sind für Menschen-User gedacht, nicht für EC2.",
    difficulty: 2,
    sourceRef: "AWS IAM Best Practices",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche zwei AWS-Services können verwendet werden, um sensible Daten zu verschlüsseln und kryptografische Schlüssel zu verwalten? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "AWS KMS (Key Management Service)" },
      { id: "B", text: "AWS Trusted Advisor" },
      { id: "C", text: "AWS CloudHSM" },
      { id: "D", text: "AWS Config" },
      { id: "E", text: "AWS Inspector" },
    ],
    correct: ["A", "C"],
    explanation:
      "AWS KMS ist vollständig verwalteter Service für Schlüsselverwaltung, integriert mit über 100 AWS-Services, geteilte HSM-Hardware aber kryptografisch isoliert. AWS CloudHSM bietet dedizierte HSMs (FIPS 140-2 Level 3), Single-Tenant — für regulatorische Anforderungen. Trusted Advisor = Best-Practice-Checks, Config = Konfigurations-Tracking, Inspector = Schwachstellen-Scanning. KMS ist die Standard-Wahl, CloudHSM nur wenn dediziertes HSM verlangt.",
    difficulty: 2,
    sourceRef: "AWS KMS Documentation, AWS CloudHSM Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher AWS-Service erkennt automatisch bösartige Aktivitäten und unautorisiertes Verhalten in einem AWS-Konto durch kontinuierliche Analyse von CloudTrail-Logs, VPC Flow Logs und DNS-Logs?",
    choices: [
      { id: "A", text: "AWS Inspector" },
      { id: "B", text: "Amazon GuardDuty" },
      { id: "C", text: "AWS Shield" },
      { id: "D", text: "AWS WAF" },
    ],
    correct: ["B"],
    explanation:
      "Amazon GuardDuty ist verwalteter Threat-Detection-Service. Analysiert kontinuierlich CloudTrail, VPC Flow Logs und DNS-Logs via Machine Learning, Anomalie-Erkennung und Threat Intelligence. Erkennt ungewöhnliche API-Calls, kompromittierte Instanzen, Bitcoin-Mining. Inspector = Vulnerability Scanning für EC2/Container, Shield = DDoS-Schutz, WAF = Web Application Firewall (SQL Injection, XSS).",
    difficulty: 2,
    sourceRef: "Amazon GuardDuty Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen muss Compliance-Berichte und Zertifizierungen (z. B. SOC 2, ISO 27001, PCI-DSS) von AWS für ein internes Audit herunterladen. Welcher Service stellt diese Dokumente bereit?",
    choices: [
      { id: "A", text: "AWS Config" },
      { id: "B", text: "AWS Artifact" },
      { id: "C", text: "AWS Audit Manager" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["B"],
    explanation:
      "AWS Artifact ist das zentrale Self-Service-Portal für AWS-Compliance-Berichte (SOC 1/2/3, ISO 27001, PCI-DSS, FedRAMP, BSI C5) und Vereinbarungen (z. B. HIPAA BAA). Kostenlos zugänglich. Config trackt Konfigurationsänderungen, Audit Manager automatisiert eigene Audit-Vorbereitung, Trusted Advisor gibt Best-Practice-Empfehlungen.",
    difficulty: 1,
    sourceRef: "AWS Artifact Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Was ist der Hauptunterschied zwischen einer Security Group und einer Network ACL (NACL) in einer VPC?",
    choices: [
      {
        id: "A",
        text: "Security Groups arbeiten auf Subnetz-Ebene und sind stateless, NACLs arbeiten auf Instanz-Ebene und sind stateful.",
      },
      {
        id: "B",
        text: "Security Groups arbeiten auf Instanz-Ebene und sind stateful, NACLs arbeiten auf Subnetz-Ebene und sind stateless.",
      },
      {
        id: "C",
        text: "Security Groups und NACLs sind funktional identisch — nur die Syntax unterscheidet sich.",
      },
      {
        id: "D",
        text: "Security Groups können nur eingehenden Verkehr filtern, NACLs können nur ausgehenden Verkehr filtern.",
      },
    ],
    correct: ["B"],
    explanation:
      "Security Groups: Instanz-Ebene (ENI), stateful (Antwort-Traffic automatisch erlaubt), nur Allow-Rules. NACLs: Subnetz-Ebene, stateless (Inbound/Outbound separat definieren), Allow- UND Deny-Rules, Auswertung nach Regelnummer. Merksatz: SG = Stateful, Instanz, nur Allow. NACL = Not Stateful, Network/Subnetz, Allow + Deny.",
    difficulty: 2,
    sourceRef: "Amazon VPC Security Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen verwaltet mehrere AWS-Konten und möchte verhindern, dass bestimmte AWS-Services (z. B. EC2 in nicht-genehmigten Regionen) in untergeordneten Konten verwendet werden können — unabhängig von den IAM-Berechtigungen einzelner User. Welche Funktion erreicht das?",
    choices: [
      { id: "A", text: "IAM Policies in jedem Konto manuell konfigurieren" },
      { id: "B", text: "Service Control Policies (SCPs) in AWS Organizations" },
      { id: "C", text: "AWS Config Rules in jedem Konto aktivieren" },
      { id: "D", text: "Security Groups auf VPC-Ebene anpassen" },
    ],
    correct: ["B"],
    explanation:
      "Service Control Policies (SCPs) in AWS Organizations setzen maximale Berechtigungsgrenzen für ganze Konten oder OUs. SCPs gewähren keine Berechtigungen, sondern limitieren was IAM-Policies maximal erlauben können. Greifen auch beim Root-Account der Member Accounts. IAM Policies pro Konto = unskalierbar. Config Rules = Detection nach Verstoß, nicht Prevention. Security Groups wirken auf Netzwerk, nicht auf Service-Verwendung.",
    difficulty: 2,
    sourceRef: "AWS Organizations — Service Control Policies",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche der folgenden Methoden ist eine bewährte Praxis (Best Practice) für die Absicherung des AWS-Root-Accounts?",
    choices: [
      {
        id: "A",
        text: "Den Root-Account täglich für administrative Aufgaben verwenden",
      },
      {
        id: "B",
        text: "MFA (Multi-Factor Authentication) aktivieren und den Root-Account nur für Aufgaben verwenden, die ihn zwingend erfordern",
      },
      {
        id: "C",
        text: "Die Root-Zugangsdaten mit dem gesamten DevOps-Team teilen",
      },
      {
        id: "D",
        text: "Access Keys für den Root-Account erstellen und in CI/CD-Pipelines verwenden",
      },
    ],
    correct: ["B"],
    explanation:
      "Der AWS-Root-Account hat unbeschränkten Zugriff. Best Practices: MFA aktivieren (idealerweise Hardware-MFA), starkes Passwort, KEINE Access Keys, nur für Root-only-Aufgaben (Account schließen, Support-Plan ändern, Steuerinformationen). Für alles andere IAM-User oder IAM Identity Center. Root täglich nutzen erhöht Angriffsfläche dramatisch, Credentials teilen zerstört Audit-Spur, Root-Access-Keys in CI/CD sind ein Desaster.",
    difficulty: 1,
    sourceRef: "AWS IAM Best Practices — Root User",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen mit mehreren AWS-Konten möchte seinen Mitarbeitern zentralen Single-Sign-On-Zugriff (SSO) auf alle Konten basierend auf ihrer Rolle im Unternehmen ermöglichen. Welcher AWS-Service ist dafür die empfohlene Lösung?",
    choices: [
      { id: "A", text: "AWS IAM Identity Center (früher AWS SSO)" },
      { id: "B", text: "IAM-User in jedem Konto manuell erstellen" },
      { id: "C", text: "AWS Cognito" },
      { id: "D", text: "AWS Directory Service" },
    ],
    correct: ["A"],
    explanation:
      "AWS IAM Identity Center (umbenannt von AWS SSO im Juli 2022) ist die empfohlene zentrale Lösung für Workforce-Identitätsmanagement: SSO über alle AWS-Konten, Integration mit AWS Organizations, Permission Sets, Anbindung an externe IdPs (Active Directory, Okta, Entra ID via SAML), kostenlos. IAM-User pro Konto = unskalierbar. Cognito = End-User-Authentifizierung in eigenen Apps, NICHT für Mitarbeiter-Zugriff. Directory Service = Managed AD.",
    difficulty: 2,
    sourceRef: "AWS IAM Identity Center Documentation",
  },

  // ── Cloud Technology and Services (+10) ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt eine Batch-Verarbeitungs-Workload, die fehlertolerant ist und jederzeit unterbrochen werden kann. Die Workload muss möglichst kostengünstig auf EC2 laufen. Welche Kauf-Option (Purchasing Option) ist am besten geeignet?",
    choices: [
      { id: "A", text: "On-Demand Instances" },
      { id: "B", text: "Reserved Instances (3-Year, All Upfront)" },
      { id: "C", text: "Spot Instances" },
      { id: "D", text: "Dedicated Hosts" },
    ],
    correct: ["C"],
    explanation:
      "Spot Instances nutzen ungenutzte EC2-Kapazität mit bis zu 90 % Rabatt gegenüber On-Demand. Trade-off: AWS kann mit 2 Min Vorwarnung beenden. Ideal für Batch, Big Data, CI/CD, fehlertolerante Workloads. On-Demand = höchster Preis, höchste Flexibilität. Reserved 3-Year = 72 % Rabatt aber lange Bindung, nur für konstante Workloads. Dedicated Hosts = Lizenz-/Compliance-Gründe, teuer.",
    difficulty: 2,
    sourceRef: "Amazon EC2 Pricing",
  },
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
    sourceRef: "AWS Snow Family, AWS Direct Connect Documentation",
  },

  // ── Billing, Pricing, and Support (+5) ──
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welche der folgenden Aussagen beschreibt das AWS-Abrechnungsmodell 'Pay-as-you-go' am besten?",
    choices: [
      {
        id: "A",
        text: "Kunden zahlen monatlich einen festen Preis für unbegrenzte Nutzung aller AWS-Services.",
      },
      {
        id: "B",
        text: "Kunden zahlen nur für die tatsächlich genutzten Ressourcen, ohne Vorab-Verpflichtungen oder lange Laufzeitverträge.",
      },
      {
        id: "C",
        text: "Kunden müssen für jedes neue Projekt eine separate Vertragsverhandlung mit AWS führen.",
      },
      {
        id: "D",
        text: "Kunden zahlen einmalig einen Upfront-Betrag für ein Jahr AWS-Nutzung, unabhängig vom tatsächlichen Verbrauch.",
      },
    ],
    correct: ["B"],
    explanation:
      "Pay-as-you-go: nur für tatsächlich genutzte Ressourcen zahlen, keine Vorab-Verpflichtung, keine Kündigungsfristen, granulare Abrechnung (oft pro Sekunde oder pro Anfrage). Drei AWS-Preisprinzipien: 1) Pay for what you use, 2) Pay less when you reserve (Reserved Instances / Savings Plans), 3) Pay less when you use more (Volumenrabatte).",
    difficulty: 1,
    sourceRef: "AWS Pricing Philosophy",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt: "Welche Aussage über den AWS Free Tier ist KORREKT?",
    choices: [
      {
        id: "A",
        text: "Der gesamte AWS Free Tier ist ausschließlich für 12 Monate nach Account-Eröffnung verfügbar.",
      },
      {
        id: "B",
        text: "Der AWS Free Tier umfasst drei Kategorien: 12 Monate kostenlos (für neue Konten), dauerhaft kostenlos (Always Free) und kurzzeitige Trials für bestimmte Services.",
      },
      {
        id: "C",
        text: "Der AWS Free Tier deckt unbegrenzte Nutzung aller AWS-Services für neue Konten ab.",
      },
      {
        id: "D",
        text: "Der Free Tier wird automatisch in einen kostenpflichtigen Plan umgewandelt, sobald irgendein AWS-Service zum ersten Mal verwendet wird.",
      },
    ],
    correct: ["B"],
    explanation:
      "AWS Free Tier hat drei Kategorien: 1) 12 Months Free (neue Konten, z. B. 750h EC2 t2.micro, 5 GB S3, 750h RDS), 2) Always Free dauerhaft (z. B. Lambda 1 Mio. Anfragen/Monat, DynamoDB 25 GB, SNS 1 Mio. Notifications), 3) Trials für bestimmte Services (Inspector 90 Tage, GuardDuty 30 Tage, SageMaker 2 Monate). Cost-Trap: nur bestimmte Services bis zu Limits, nicht unbegrenzt alles.",
    difficulty: 2,
    sourceRef: "AWS Free Tier",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Unternehmen möchte seine AWS-Kosten der letzten 12 Monate analysieren, um Trends zu erkennen und zukünftige Ausgaben zu prognostizieren. Welcher AWS-Service ist dafür am besten geeignet?",
    choices: [
      { id: "A", text: "AWS Budgets" },
      { id: "B", text: "AWS Cost Explorer" },
      { id: "C", text: "AWS Cost Anomaly Detection" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["B"],
    explanation:
      "AWS Cost Explorer: Visualisierung von Kosten/Nutzung bis 12 Monate rückwirkend, Filter/Gruppierung nach Service/Region/Tag, Prognose bis 12 Monate voraus, RI/Savings-Plans-Reports, kostenlos. Budgets = Schwellwert-Alerts (proaktiv), Cost Anomaly Detection = ML-basierte Ausreißer-Erkennung, Trusted Advisor = Best-Practice-Spar-Empfehlungen.",
    difficulty: 2,
    sourceRef: "AWS Cost Explorer Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Welcher AWS Support Plan ist der GÜNSTIGSTE, der einen 24/7-Zugriff per Telefon und Chat sowie einen dedizierten Technical Account Manager (TAM) bietet?",
    choices: [
      { id: "A", text: "Basic Support" },
      { id: "B", text: "Developer Support" },
      { id: "C", text: "Business Support" },
      { id: "D", text: "Enterprise Support" },
    ],
    correct: ["D"],
    explanation:
      "Support-Pläne: Basic (kostenlos, kein Phone/Chat), Developer (ab 29 USD/Monat, Business-Hours-Email), Business (ab 100 USD/Monat, 24/7 Phone/Chat, voller Trusted Advisor, < 1h Response bei Production Down, KEIN TAM), Enterprise On-Ramp (ab 5.500 USD/Monat, Pool-TAM nicht dediziert), Enterprise (ab 15.000 USD/Monat, dedizierter TAM, < 15 Min bei Business-Critical Down). Enterprise ist der günstigste mit DEDIZIERTEM TAM.",
    difficulty: 2,
    sourceRef: "AWS Support Plans",
  },
  {
    cert: "CLF-C02",
    domain: "Billing, Pricing, and Support",
    type: "single",
    prompt:
      "Ein Architekt plant eine neue AWS-Lösung und möchte VOR der tatsächlichen Bereitstellung die monatlichen Kosten genau abschätzen (z. B. 'Was kostet eine Architektur mit 3× t3.medium EC2-Instanzen, 500 GB S3-Storage und einem RDS in Frankfurt?'). Welcher AWS-Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Cost Explorer" },
      { id: "B", text: "AWS Pricing Calculator" },
      { id: "C", text: "AWS Budgets" },
      { id: "D", text: "AWS Cost & Usage Report (CUR)" },
    ],
    correct: ["B"],
    explanation:
      "AWS Pricing Calculator: web-basiert (calculator.aws), keine Anmeldung nötig, Service-Auswahl mit Region/Konfiguration, monatliche und 12-Monats-Kostenberechnung, Free-Tier-Inklusion, PDF/CSV-Export, Vergleichs-Szenarien. Cost Explorer = Vergangenheit + Prognose basierend auf Historie. Budgets = Schwellwert-Alerts laufend. CUR = detaillierter S3-Export für Custom-Analysen. Pricing Calculator ersetzte 2019 den alten Simple Monthly Calculator.",
    difficulty: 2,
    sourceRef: "AWS Pricing Calculator",
  },

  // ╔════════════════════════════════════════════╗
  // ║ K2 — +30 questions (35 → 64)                ║
  // ╚════════════════════════════════════════════╝

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
    sourceRef: "AWS Disaster Recovery Documentation / Amazon Route 53",
  },

  // ── K2 — Security and Compliance (+9) ──

  // 2.1 Shared Responsibility — RDS Customer Side
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen betreibt eine Anwendung mit Amazon RDS (Managed Database Service). Welche der folgenden Aufgaben fällt unter die Verantwortung des KUNDEN im Shared Responsibility Model?",
    choices: [
      { id: "A", text: "Patches des Betriebssystems der zugrunde liegenden Datenbank-Host-Server installieren" },
      { id: "B", text: "Hardware-Wartung der physischen Server, auf denen RDS läuft" },
      { id: "C", text: "Konfiguration von Datenbank-Benutzern, Tabellen-Berechtigungen und IAM-Zugriffsrichtlinien" },
      { id: "D", text: "Patchen der RDS-Datenbank-Engine (z. B. PostgreSQL-Minor-Version-Updates)" },
    ],
    correct: ["C"],
    explanation:
      "Bei Managed Services wie RDS verschiebt sich die Verantwortungsgrenze: AWS übernimmt OS, Hardware, Hypervisor, Patches der DB-Engine, automatische Backups und Multi-AZ-Failover. Der Kunde verantwortet das, was 'in' der Datenbank passiert: DB-Schema, User/Rollen innerhalb der DB, Tabellen-Berechtigungen, IAM-Policies für RDS-API-Zugriff, Wahl der Verschlüsselungsoptionen, Backup-Aufbewahrungsdauer. Merksatz: AWS = Engine läuft, Kunde = Daten + Zugriff.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model — Managed Services",
  },

  // 2.1 Shared Responsibility — Lambda Customer Side
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Für welche Aufgabe ist der KUNDE verantwortlich, wenn er eine Anwendung auf AWS Lambda betreibt?",
    choices: [
      { id: "A", text: "Patchen des Linux-Kernels der Server, auf denen die Lambda-Runtime läuft" },
      { id: "B", text: "Skalieren der Lambda-Infrastruktur auf tausende parallele Ausführungen" },
      { id: "C", text: "Sicherheit des eigenen Function-Codes und Konfiguration der IAM-Execution-Role" },
      { id: "D", text: "Wartung und Update der zugrunde liegenden Hypervisor-Software" },
    ],
    correct: ["C"],
    explanation:
      "Lambda ist Serverless: AWS übernimmt Server, OS, Runtime-Patches, Hypervisor, automatisches Skalieren, HA. Der Kunde verantwortet ausschließlich den Function-Code (inkl. Logik-Sicherheit, Dependency-Updates der eigenen Libraries) und die IAM-Execution-Role (welche AWS-Ressourcen die Funktion zugreifen darf). Lambda hat die schmalste Kunden-Verantwortung aller Compute-Services — deshalb auch der schnellste Sicherheits-Gewinn bei Migration von EC2 zu Lambda.",
    difficulty: 2,
    sourceRef: "AWS Lambda Security / Shared Responsibility Model",
  },

  // 2.1 Shared Responsibility — S3 Bucket Misconfiguration
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Entwickler lädt Kundendaten in einen Amazon-S3-Bucket. Wer ist im Shared Responsibility Model dafür verantwortlich, dass dieser Bucket nicht versehentlich öffentlich zugänglich wird?",
    choices: [
      { id: "A", text: "AWS — durch automatische Schutzmechanismen auf allen Buckets" },
      { id: "B", text: "AWS und Kunde gemeinsam — beide müssen explizit zustimmen, einen Bucket öffentlich zu machen" },
      { id: "C", text: "Der Kunde — durch korrekte Bucket-Policies, IAM, ACLs und 'Block Public Access'-Einstellungen" },
      { id: "D", text: "AWS Support — der nach jeder Bucket-Erstellung eine manuelle Sicherheits-Prüfung durchführt" },
    ],
    correct: ["C"],
    explanation:
      "S3-Buckets sind seit 2023 standardmäßig nicht-öffentlich (Block Public Access on by default), aber der Kunde bleibt verantwortlich für die korrekte Konfiguration: Bucket-Policies, IAM-Policies, Verschlüsselung, Replikation. AWS sichert die Infrastruktur ('Security OF the Cloud') und stellt Sicherheitsfunktionen bereit — aber der Kunde muss sie aktivieren und korrekt konfigurieren ('Security IN the Cloud'). Öffentliche S3-Buckets bleiben eine der häufigsten Ursachen für Daten-Leaks.",
    difficulty: 2,
    sourceRef: "Amazon S3 Security Best Practices / AWS Shared Responsibility Model",
  },

  // 2.1 Shared Responsibility — Multi: 2 AWS-Verantwortungen bei RDS
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI der folgenden Aufgaben gehören bei der Verwendung von Amazon RDS in die Verantwortung von AWS? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Patches der zugrunde liegenden Datenbank-Engine bereitstellen" },
      { id: "B", text: "Verschlüsselung der gespeicherten Daten aktivieren" },
      { id: "C", text: "IAM-Berechtigungen für die RDS-API steuern" },
      { id: "D", text: "Physische Sicherheit der Rechenzentren gewährleisten" },
      { id: "E", text: "Schema-Design der Tabellen festlegen" },
    ],
    correct: ["A", "D"],
    explanation:
      "AWS verantwortet bei RDS: physische Sicherheit der DCs (D), OS- und Hypervisor-Patches, DB-Engine-Patches und Minor-Version-Upgrades (A), Hardware-Wartung, Netzwerk-Infrastruktur. Der Kunde verantwortet: Verschlüsselungs-Konfiguration aktivieren (B — AWS stellt die Funktion bereit, Kunde muss sie einschalten), IAM-Policies und DB-Zugriffskontrolle (C), Schema-Design und Daten-Modell (E), Wahl der Engine und Instance-Größe, Backup-Strategie. AWS macht die Engine sicher; was IN der DB passiert, ist Kundensache.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model — Amazon RDS",
  },

  // 2.2 Security/Governance — CloudTrail vs Config
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Compliance-Auditor benötigt ein lückenloses Audit-Log darüber, WER WANN WELCHE API-Aktion in einem AWS-Konto durchgeführt hat (z. B. 'User Alice hat um 14:32 Uhr den S3-Bucket xyz gelöscht'). Welcher AWS-Service ist dafür die richtige Wahl?",
    choices: [
      { id: "A", text: "Amazon CloudWatch" },
      { id: "B", text: "AWS CloudTrail" },
      { id: "C", text: "AWS Config" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["B"],
    explanation:
      "AWS CloudTrail loggt API-Aktivität: Wer (Identity), Wann (Timestamp), Was (API Action), Wovon (Source IP), Worauf (Resource). Standardmäßig 90 Tage Event History; für längere Aufbewahrung Trail in S3 anlegen. CloudWatch = Metriken, Logs, Alarms (Performance/Operations, nicht Audit-Aktivität pro User). AWS Config = Tracking von Konfigurationsänderungen an Ressourcen (z. B. 'wurde Security Group X jemals modifiziert?'), nicht primär API-Aktor. Trusted Advisor = Best-Practice-Empfehlungen. Merksatz: CloudTrail = WHO did WHAT, Config = WHAT changed HOW.",
    difficulty: 2,
    sourceRef: "AWS CloudTrail Documentation",
  },

  // 2.4 Security Components — WAF Use Case
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Webanwendung läuft hinter einem Application Load Balancer und soll vor häufigen Web-Angriffen wie SQL Injection, Cross-Site Scripting (XSS) und bekannten Bot-Mustern geschützt werden. Welcher AWS-Service erfüllt diese Aufgabe?",
    choices: [
      { id: "A", text: "AWS Shield Standard" },
      { id: "B", text: "AWS Web Application Firewall (WAF)" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "Amazon Inspector" },
    ],
    correct: ["B"],
    explanation:
      "AWS WAF ist die Web Application Firewall für Layer-7-Schutz: SQL Injection, XSS, Bad Bots, Rate Limiting, Geo-Blocking. Wird vor CloudFront, ALB, API Gateway oder AppSync geschaltet. Verwendet AWS Managed Rules (z. B. OWASP Top 10) oder eigene Rules. Shield Standard = automatisch aktiv, DDoS-Schutz auf Layer 3/4 (Netzwerk), nicht Layer 7. GuardDuty = Threat Detection via Logs (CloudTrail/VPC Flow/DNS), nicht inline Web-Filtering. Inspector = Vulnerability Scanner für EC2/ECR/Lambda, kein Traffic-Filter.",
    difficulty: 2,
    sourceRef: "AWS WAF Documentation",
  },

  // 2.4 Security Components — Shield Standard vs Advanced
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt: "Welche Aussage über AWS Shield ist KORREKT?",
    choices: [
      { id: "A", text: "Shield Standard ist kostenpflichtig, Shield Advanced ist kostenlos für alle AWS-Kunden." },
      { id: "B", text: "Shield Standard ist automatisch und kostenlos für alle AWS-Kunden aktiv; Shield Advanced ist eine kostenpflichtige Erweiterung mit Zugang zum AWS DDoS Response Team." },
      { id: "C", text: "AWS Shield ist ein Schwachstellen-Scanner für EC2-Instanzen." },
      { id: "D", text: "AWS Shield ersetzt vollständig die Notwendigkeit für AWS WAF." },
    ],
    correct: ["B"],
    explanation:
      "Shield Standard ist immer aktiv und kostenlos — schützt gegen häufige Netzwerk- und Transport-Layer-DDoS-Angriffe (Layer 3/4). Shield Advanced kostet ~3.000 USD/Monat pro Organisation und bietet zusätzlich: erweiterten Schutz auch auf Layer 7, 24/7-Zugang zum AWS DDoS Response Team (DRT), Cost Protection (Abrechnung skalierter Ressourcen während Angriff), Echtzeit-Metriken. Shield schützt vor DDoS; WAF filtert Web-Angriffe wie SQL Injection — die beiden ergänzen sich, ersetzen sich nicht.",
    difficulty: 2,
    sourceRef: "AWS Shield Documentation",
  },

  // 2.4 Security Components — Macie
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen möchte automatisch erkennen, ob in Amazon-S3-Buckets versehentlich personenbezogene Daten (PII) wie Sozialversicherungsnummern, Kreditkartennummern oder Geburtsdaten gespeichert sind. Welcher AWS-Service ist speziell darauf ausgelegt?",
    choices: [
      { id: "A", text: "Amazon GuardDuty" },
      { id: "B", text: "AWS CloudTrail" },
      { id: "C", text: "Amazon Macie" },
      { id: "D", text: "AWS Config" },
    ],
    correct: ["C"],
    explanation:
      "Amazon Macie nutzt Machine Learning und Pattern Matching, um sensible Daten (PII, PHI, Finanzdaten, Credentials, AWS-Access-Keys) in S3-Buckets automatisch zu klassifizieren und zu kennzeichnen. Standard Managed Identifiers für gängige Typen + Custom Identifiers via Regex. Erzeugt Findings in Security Hub. GuardDuty = Threat Detection (verdächtige API-Calls, Crypto-Mining), nicht Daten-Klassifizierung. CloudTrail = API-Audit-Logs. Config = Konfigurations-Tracking. Macie ist auf S3 spezialisiert.",
    difficulty: 2,
    sourceRef: "Amazon Macie Documentation",
  },

  // 2.4 Security Components — Multi: Inspector + GuardDuty Differenzierung
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI AWS-Services führen kontinuierliche, automatisierte Sicherheits-Scans durch — der eine auf Schwachstellen in EC2/ECR/Lambda, der andere auf bösartige Verhaltensmuster im AWS-Konto? (Wähle 2 Antworten)",
    choices: [
      { id: "A", text: "Amazon Inspector" },
      { id: "B", text: "AWS Trusted Advisor" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "AWS Artifact" },
      { id: "E", text: "AWS Config" },
    ],
    correct: ["A", "C"],
    explanation:
      "Amazon Inspector (A) scannt automatisch und kontinuierlich EC2-Instanzen, Container-Images in ECR und Lambda-Funktionen auf Software-Schwachstellen (CVEs) und ungewollte Netzwerk-Exposure. Amazon GuardDuty (C) analysiert CloudTrail-, VPC-Flow- und DNS-Logs auf bösartige Verhaltensmuster (kompromittierte Credentials, Crypto-Mining, ungewöhnliche API-Calls). Trusted Advisor (B) = Best-Practice-Empfehlungen, kein Schwachstellen-Scanner. Artifact (D) = Self-Service-Portal für Compliance-Berichte (SOC, ISO). Config (E) = Konfigurations-Tracking, kein aktiver Scan auf Bedrohungen.",
    difficulty: 2,
    sourceRef: "Amazon Inspector / Amazon GuardDuty Documentation",
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

async function seed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed: NODE_ENV is production.");
  }

  const all = [...clfC02Questions];
  if (all.length === 0) {
    console.log("No seed data defined yet — skipping insert.");
    return;
  }

  // FK (question_attempts.question_id -> questions.id, ON DELETE RESTRICT)
  // forces us to clear attempts before reseeding questions.
  db.delete(questionAttempts).run();
  db.delete(questions).run();
  db.insert(questions).values(all).run();
  console.log(`Seeded ${all.length} question(s).`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
