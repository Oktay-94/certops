import type { NewQuestion } from "../schema";

export const securityQuestions: NewQuestion[] = [
  // ── Security and Compliance (K1 initial) ──
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
];
