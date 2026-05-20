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
