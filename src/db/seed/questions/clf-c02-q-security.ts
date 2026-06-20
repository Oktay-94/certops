// src/db/seed/questions/clf-c02-q-security.ts

import type { NewQuestion } from "../../schema";

export const clfC02QSecurity: NewQuestion[] = [
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Im Shared Responsibility Model: Wer ist für das Patchen des Gastbetriebssystems auf einer EC2-Instanz verantwortlich?",
    choices: [
      { id: "A", text: "AWS" },
      { id: "B", text: "Der Kunde" },
      { id: "C", text: "Niemand, EC2 patcht sich selbst" },
      { id: "D", text: "Der jeweilige Internet Service Provider" },
    ],
    correct: ["B"],
    explanation:
      "Bei EC2 (IaaS) liegt das Patchen des Gastbetriebssystems beim Kunden ('Security IN the cloud'). AWS ist für die zugrundeliegende Hardware und Infrastruktur zuständig ('Security OF the cloud').",
    difficulty: 2,
    seedKey: "clf-c02-q-089",
    sourceRef: "AWS Shared Responsibility Model",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Für welche der folgenden Bereiche ist AWS im Shared Responsibility Model verantwortlich? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Physische Sicherheit der Rechenzentren" },
      { id: "B", text: "Konfiguration von IAM-Benutzerrechten" },
      { id: "C", text: "Hardware und die globale Infrastruktur" },
      { id: "D", text: "Verschlüsselung der eigenen Anwendungsdaten" },
      { id: "E", text: "Konfiguration von Security Groups" },
    ],
    correct: ["A", "C"],
    explanation:
      "AWS verantwortet 'Security OF the cloud': physische Rechenzentren, Hardware, globale Infrastruktur, Virtualisierung. IAM-Rechte, Datenverschlüsselung und Security Groups liegen beim Kunden.",
    difficulty: 2,
    seedKey: "clf-c02-q-090",
    sourceRef: "AWS Shared Responsibility Model",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche Verantwortung liegt im Shared Responsibility Model IMMER beim Kunden, unabhängig vom genutzten Service?",
    choices: [
      { id: "A", text: "Wartung der physischen Server" },
      { id: "B", text: "Verwaltung der eigenen Daten und Zugriffsrechte (IAM)" },
      { id: "C", text: "Kühlung der Rechenzentren" },
      { id: "D", text: "Patchen des Hypervisors" },
    ],
    correct: ["B"],
    explanation:
      "Egal ob IaaS, PaaS oder SaaS — die eigenen Daten und die Verwaltung der Zugriffsrechte (IAM) bleiben immer in der Verantwortung des Kunden.",
    difficulty: 2,
    seedKey: "clf-c02-q-091",
    sourceRef: "AWS Shared Responsibility Model",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Anwendung auf einer EC2-Instanz muss auf einen S3-Bucket zugreifen. Was ist die empfohlene, sicherste Methode?",
    choices: [
      { id: "A", text: "Access Keys fest im Anwendungscode hinterlegen" },
      { id: "B", text: "Der EC2-Instanz eine IAM Role zuweisen" },
      { id: "C", text: "Die Root-User-Credentials verwenden" },
      { id: "D", text: "Den S3-Bucket öffentlich zugänglich machen" },
    ],
    correct: ["B"],
    explanation:
      "Eine IAM Role liefert der Instanz temporäre, automatisch rotierte Credentials, ohne dass langlebige Access Keys im Code gespeichert werden müssen — das ist die sichere Best Practice.",
    difficulty: 2,
    seedKey: "clf-c02-q-092",
    sourceRef: "AWS IAM Roles",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt: "Was beschreibt das Prinzip des 'Least Privilege' am besten?",
    choices: [
      { id: "A", text: "Allen Benutzern Vollzugriff geben, um die Arbeit zu erleichtern" },
      { id: "B", text: "Nur die minimal notwendigen Berechtigungen vergeben" },
      { id: "C", text: "Berechtigungen nur einmal pro Jahr überprüfen" },
      { id: "D", text: "Den Root-User für alle Aufgaben nutzen" },
    ],
    correct: ["B"],
    explanation:
      "Least Privilege bedeutet, jeder Identität nur die minimal nötigen Rechte zu geben. Das begrenzt den möglichen Schaden, falls Credentials kompromittiert werden.",
    difficulty: 1,
    seedKey: "clf-c02-q-093",
    sourceRef: "AWS IAM Best Practices",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche der folgenden sind Best Practices für den AWS Root User? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "MFA für den Root User aktivieren" },
      { id: "B", text: "Den Root User für alle täglichen Aufgaben verwenden" },
      { id: "C", text: "Die Root-Access-Keys breit im Team teilen" },
      { id: "D", text: "Für tägliche Arbeit IAM-User mit minimalen Rechten anlegen" },
      { id: "E", text: "Das Root-Passwort im Anwendungscode speichern" },
    ],
    correct: ["A", "D"],
    explanation:
      "Best Practices: MFA für Root aktivieren und für den Alltag IAM-User/Roles mit minimalen Rechten nutzen. Der Root User sollte nur für die wenigen Aufgaben verwendet werden, die ihn zwingend erfordern.",
    difficulty: 2,
    seedKey: "clf-c02-q-094",
    sourceRef: "AWS Root User Best Practices",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche zusätzliche Sicherheitsmaßnahme verlangt neben dem Passwort einen zweiten Faktor (z.B. einen Code aus einer App)?",
    choices: [
      { id: "A", text: "Multi-Factor Authentication (MFA)" },
      { id: "B", text: "Cross-Region Replication" },
      { id: "C", text: "Auto Scaling" },
      { id: "D", text: "Elastic Load Balancing" },
    ],
    correct: ["A"],
    explanation:
      "MFA fügt eine zweite Sicherheitsebene hinzu: etwas, das man weiß (Passwort) plus etwas, das man hat (Code/Token). Selbst ein gestohlenes Passwort reicht dann nicht für den Zugriff.",
    difficulty: 1,
    seedKey: "clf-c02-q-095",
    sourceRef: "AWS MFA Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen möchte Single Sign-On (SSO) für seine Mitarbeiter über mehrere AWS-Accounts hinweg ermöglichen. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon Cognito" },
      { id: "B", text: "AWS IAM Identity Center" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["B"],
    explanation:
      "AWS IAM Identity Center (früher AWS SSO) bietet zentrales Single Sign-On über mehrere AWS-Accounts und Anwendungen, oft in Kombination mit AWS Organizations.",
    difficulty: 2,
    seedKey: "clf-c02-q-096",
    sourceRef: "AWS IAM Identity Center",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Entwickler braucht Anmeldefunktionen (Sign-up/Sign-in, soziale Logins) für die ENDNUTZER seiner Mobile-App. Welcher Service eignet sich?",
    choices: [
      { id: "A", text: "AWS IAM" },
      { id: "B", text: "Amazon Cognito" },
      { id: "C", text: "AWS Organizations" },
      { id: "D", text: "Amazon Macie" },
    ],
    correct: ["B"],
    explanation:
      "Amazon Cognito verwaltet Identitäten für die Endnutzer von Anwendungen (App-Login, soziale Logins). IAM verwaltet dagegen den Zugriff AUF AWS-Ressourcen, nicht App-Nutzer.",
    difficulty: 2,
    seedKey: "clf-c02-q-097",
    sourceRef: "AWS Cognito Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Womit kann eine Organisation zentral die maximal erlaubten Berechtigungen für mehrere AWS-Accounts begrenzen?",
    choices: [
      { id: "A", text: "Service Control Policies (SCPs) in AWS Organizations" },
      { id: "B", text: "Security Groups" },
      { id: "C", text: "Amazon CloudFront" },
      { id: "D", text: "Elastic IP-Adressen" },
    ],
    correct: ["A"],
    explanation:
      "SCPs in AWS Organizations definieren Leitplanken für die maximal erlaubten Berechtigungen eines Accounts oder einer OU — selbst der Root User eines Accounts kann nicht darüber hinausgehen.",
    difficulty: 2,
    seedKey: "clf-c02-q-098",
    sourceRef: "AWS Organizations Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Service erkennt mithilfe von Machine Learning Bedrohungen, indem er kontinuierlich CloudTrail-, VPC-Flow- und DNS-Logs analysiert?",
    choices: [
      { id: "A", text: "Amazon Inspector" },
      { id: "B", text: "Amazon GuardDuty" },
      { id: "C", text: "Amazon Macie" },
      { id: "D", text: "AWS Config" },
    ],
    correct: ["B"],
    explanation:
      "Amazon GuardDuty ist der Threat-Detection-Service, der Logs (CloudTrail, VPC Flow, DNS) per ML auf verdächtige Aktivitäten untersucht — ganz ohne Agents.",
    difficulty: 2,
    seedKey: "clf-c02-q-099",
    sourceRef: "AWS GuardDuty Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen will EC2-Instanzen und Container-Images automatisch auf bekannte Software-Schwachstellen (CVEs) prüfen lassen. Welcher Service ist dafür gedacht?",
    choices: [
      { id: "A", text: "Amazon Macie" },
      { id: "B", text: "Amazon GuardDuty" },
      { id: "C", text: "Amazon Inspector" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["C"],
    explanation:
      "Amazon Inspector ist der Vulnerability-Management-Service: er scannt EC2, Container-Images (ECR) und Lambda automatisch auf bekannte Schwachstellen und Netzwerk-Exposition.",
    difficulty: 2,
    seedKey: "clf-c02-q-100",
    sourceRef: "AWS Inspector Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen muss prüfen, ob sensible personenbezogene Daten (PII) versehentlich in S3-Buckets liegen. Welcher Service hilft dabei?",
    choices: [
      { id: "A", text: "Amazon Macie" },
      { id: "B", text: "Amazon GuardDuty" },
      { id: "C", text: "AWS WAF" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Macie nutzt Machine Learning, um sensible Daten (PII) in S3-Buckets zu entdecken und zu klassifizieren — wichtig für Datenschutz und Compliance.",
    difficulty: 2,
    seedKey: "clf-c02-q-101",
    sourceRef: "AWS Macie Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Service schützt Webanwendungen vor DDoS-Angriffen, wobei eine Basisstufe für alle Kunden automatisch und kostenlos aktiv ist?",
    choices: [
      { id: "A", text: "AWS WAF" },
      { id: "B", text: "AWS Shield" },
      { id: "C", text: "Amazon Inspector" },
      { id: "D", text: "AWS KMS" },
    ],
    correct: ["B"],
    explanation:
      "AWS Shield bietet DDoS-Schutz. Shield Standard ist automatisch und kostenlos für alle Kunden; Shield Advanced (kostenpflichtig) bietet erweiterten Schutz und ein Response-Team.",
    difficulty: 2,
    seedKey: "clf-c02-q-102",
    sourceRef: "AWS Shield Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Webanwendung soll vor SQL Injection und Cross-Site-Scripting (XSS) geschützt werden. Welcher Service ist dafür der richtige?",
    choices: [
      { id: "A", text: "AWS Shield" },
      { id: "B", text: "AWS WAF" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "AWS Secrets Manager" },
    ],
    correct: ["B"],
    explanation:
      "AWS WAF (Web Application Firewall) filtert HTTP/HTTPS-Anfragen auf Application-Layer-Ebene und schützt vor Angriffen wie SQL Injection und XSS über regelbasiertes Filtern.",
    difficulty: 2,
    seedKey: "clf-c02-q-103",
    sourceRef: "AWS WAF Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche Aussagen zu AWS Shield und AWS WAF sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Shield schützt vor DDoS-Angriffen" },
      { id: "B", text: "WAF verschlüsselt Daten im Ruhezustand" },
      { id: "C", text: "WAF filtert Anfragen auf Anwendungsebene (Layer 7)" },
      { id: "D", text: "Shield verwaltet SSL/TLS-Zertifikate" },
      { id: "E", text: "WAF ist ein Datenbank-Service" },
    ],
    correct: ["A", "C"],
    explanation:
      "Shield wehrt DDoS-Angriffe (Volumen) ab; WAF filtert bösartige HTTP-Anfragen auf Layer 7. Zertifikate verwaltet ACM, Verschlüsselung von Daten übernimmt KMS.",
    difficulty: 2,
    seedKey: "clf-c02-q-104",
    sourceRef: "AWS Security Comparison",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Service dient zum Erstellen und zentralen Verwalten von Verschlüsselungs-Keys, die mit Services wie S3, EBS und RDS integriert sind?",
    choices: [
      { id: "A", text: "AWS Secrets Manager" },
      { id: "B", text: "AWS Key Management Service (KMS)" },
      { id: "C", text: "AWS Certificate Manager" },
      { id: "D", text: "Amazon Cognito" },
    ],
    correct: ["B"],
    explanation:
      "AWS KMS erstellt und verwaltet kryptografische Schlüssel und ist mit den meisten AWS-Services für Verschlüsselung im Ruhezustand integriert. Der Zugriff auf Keys wird über IAM gesteuert.",
    difficulty: 2,
    seedKey: "clf-c02-q-105",
    sourceRef: "AWS KMS Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Anwendung soll Datenbank-Passwörter sicher speichern und diese automatisch regelmäßig rotieren lassen. Welcher Service ist am besten geeignet?",
    choices: [
      { id: "A", text: "AWS Secrets Manager" },
      { id: "B", text: "Amazon S3" },
      { id: "C", text: "AWS CloudTrail" },
      { id: "D", text: "Amazon Macie" },
    ],
    correct: ["A"],
    explanation:
      "AWS Secrets Manager speichert Geheimnisse (z.B. DB-Passwörter, API-Keys) sicher und kann sie automatisch rotieren. Anwendungen rufen sie zur Laufzeit ab, statt sie im Code zu hinterlegen.",
    difficulty: 2,
    seedKey: "clf-c02-q-106",
    sourceRef: "AWS Secrets Manager Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Service stellt kostenlose SSL/TLS-Zertifikate für AWS-Ressourcen bereit und erneuert sie automatisch?",
    choices: [
      { id: "A", text: "AWS KMS" },
      { id: "B", text: "AWS Certificate Manager (ACM)" },
      { id: "C", text: "AWS Secrets Manager" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["B"],
    explanation:
      "AWS Certificate Manager (ACM) stellt SSL/TLS-Zertifikate für HTTPS bereit, integriert mit CloudFront, ALB und API Gateway, und erneuert sie automatisch — keine abgelaufenen Zertifikate mehr.",
    difficulty: 1,
    seedKey: "clf-c02-q-107",
    sourceRef: "AWS Certificate Manager",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Service aggregiert Sicherheits-Findings aus GuardDuty, Inspector, Macie und anderen Quellen in einem zentralen Dashboard?",
    choices: [
      { id: "A", text: "AWS Security Hub" },
      { id: "B", text: "Amazon CloudWatch" },
      { id: "C", text: "AWS Config" },
      { id: "D", text: "AWS Trusted Advisor" },
    ],
    correct: ["A"],
    explanation:
      "AWS Security Hub sammelt und standardisiert Sicherheits-Findings aus mehreren Services und Partner-Tools und bietet automatisierte Best-Practice-Checks — ein zentraler Überblick über die Sicherheitslage.",
    difficulty: 2,
    seedKey: "clf-c02-q-108",
    sourceRef: "AWS Security Hub Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Auditor fragt, wer vor zwei Wochen eine bestimmte EC2-Instanz beendet hat. Welcher Service liefert diese Information?",
    choices: [
      { id: "A", text: "Amazon CloudWatch" },
      { id: "B", text: "AWS CloudTrail" },
      { id: "C", text: "AWS Config" },
      { id: "D", text: "Amazon Inspector" },
    ],
    correct: ["B"],
    explanation:
      "AWS CloudTrail protokolliert alle API-Aufrufe und Aktivitäten im Account (wer, wann, was). Damit lässt sich nachvollziehen, welcher Benutzer welche Aktion ausgeführt hat.",
    difficulty: 2,
    seedKey: "clf-c02-q-109",
    sourceRef: "AWS CloudTrail Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen will sicherstellen, dass alle S3-Buckets dauerhaft verschlüsselt sind, und bei Abweichungen alarmiert werden. Welcher Service eignet sich?",
    choices: [
      { id: "A", text: "AWS Config" },
      { id: "B", text: "AWS CloudTrail" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "AWS Shield" },
    ],
    correct: ["A"],
    explanation:
      "AWS Config verfolgt die Konfiguration von Ressourcen über die Zeit und prüft sie gegen Regeln (Compliance) — z.B. 'sind alle S3-Buckets verschlüsselt?' — und meldet Abweichungen.",
    difficulty: 2,
    seedKey: "clf-c02-q-110",
    sourceRef: "AWS Config Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt: "Worin unterscheiden sich AWS CloudTrail und AWS Config?",
    choices: [
      { id: "A", text: "CloudTrail protokolliert Aktionen (wer/was), Config verfolgt Ressourcen-Konfigurationen und Compliance" },
      { id: "B", text: "Beide sind identisch und austauschbar" },
      { id: "C", text: "CloudTrail verschlüsselt Daten, Config erstellt Backups" },
      { id: "D", text: "CloudTrail ist ein CDN, Config ein Load Balancer" },
    ],
    correct: ["A"],
    explanation:
      "CloudTrail beantwortet 'wer hat welchen API-Call gemacht' (Aktivitäts-Audit). AWS Config beantwortet 'wie sind Ressourcen konfiguriert und sind sie compliant' (Konfigurations-Audit).",
    difficulty: 2,
    seedKey: "clf-c02-q-111",
    sourceRef: "AWS Management Tools Comparison",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche Aussagen über Security Groups und Network ACLs (NACLs) sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Security Groups arbeiten auf Instanz-Ebene und sind stateful" },
      { id: "B", text: "NACLs arbeiten auf Subnetz-Ebene und sind stateless" },
      { id: "C", text: "Security Groups unterstützen explizite Deny-Regeln" },
      { id: "D", text: "NACLs können nur auf einzelne EC2-Instanzen angewendet werden" },
      { id: "E", text: "Security Groups arbeiten auf der globalen Account-Ebene" },
    ],
    correct: ["A", "B"],
    explanation:
      "Security Groups sind auf Instanz-Ebene und stateful (nur Allow-Regeln). NACLs sind auf Subnetz-Ebene und stateless (Allow und Deny). Damit sind A und B korrekt.",
    difficulty: 2,
    seedKey: "clf-c02-q-112",
    sourceRef: "AWS VPC Security",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Kunde benötigt Compliance-Berichte wie SOC 2 oder ISO-Zertifikate für ein Audit. Welcher AWS-Service stellt diese bereit?",
    choices: [
      { id: "A", text: "AWS Artifact" },
      { id: "B", text: "AWS Config" },
      { id: "C", text: "Amazon Macie" },
      { id: "D", text: "AWS CloudTrail" },
    ],
    correct: ["A"],
    explanation:
      "AWS Artifact ist das Self-Service-Portal für AWS-Compliance-Berichte und -Vereinbarungen (z.B. SOC, PCI, ISO), die Kunden für ihre eigenen Audits herunterladen können.",
    difficulty: 2,
    seedKey: "clf-c02-q-113",
    sourceRef: "AWS Artifact Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Was beschreibt 'Verschlüsselung im Ruhezustand' (encryption at rest) am besten?",
    choices: [
      { id: "A", text: "Verschlüsselung von Daten während der Übertragung über das Netzwerk" },
      { id: "B", text: "Verschlüsselung von gespeicherten Daten (z.B. in S3 oder auf EBS-Volumes)" },
      { id: "C", text: "Ein Verfahren zum Komprimieren von Daten" },
      { id: "D", text: "Das Löschen von Daten nach 30 Tagen" },
    ],
    correct: ["B"],
    explanation:
      "Encryption at rest verschlüsselt gespeicherte Daten (z.B. in S3, EBS, RDS). Encryption in transit verschlüsselt dagegen Daten während der Übertragung (z.B. via TLS).",
    difficulty: 2,
    seedKey: "clf-c02-q-114",
    sourceRef: "AWS Encryption Concepts",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Organisation möchte mehrere AWS-Accounts zentral verwalten und Richtlinien account-übergreifend durchsetzen. Welcher Service bildet die Grundlage?",
    choices: [
      { id: "A", text: "AWS Organizations" },
      { id: "B", text: "Amazon Cognito" },
      { id: "C", text: "AWS Secrets Manager" },
      { id: "D", text: "Amazon Inspector" },
    ],
    correct: ["A"],
    explanation:
      "AWS Organizations ermöglicht die zentrale Verwaltung mehrerer Accounts, Gruppierung in OUs, Consolidated Billing und das Durchsetzen von Richtlinien über Service Control Policies (SCPs).",
    difficulty: 2,
    seedKey: "clf-c02-q-115",
    sourceRef: "AWS Organizations Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen meldet einen Verdacht auf Krypto-Mining durch eine kompromittierte EC2-Instanz. Welcher Service hätte diese ungewöhnliche Aktivität automatisch erkennen können?",
    choices: [
      { id: "A", text: "Amazon GuardDuty" },
      { id: "B", text: "AWS Certificate Manager" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "AWS Budgets" },
    ],
    correct: ["A"],
    explanation:
      "GuardDuty erkennt ungewöhnliche Aktivitäten wie Krypto-Mining oder verdächtige API-Calls durch die ML-Analyse von Logs und meldet sie als Findings.",
    difficulty: 2,
    seedKey: "clf-c02-q-116",
    sourceRef: "AWS GuardDuty Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Was ist der Hauptunterschied zwischen einer IAM Group und einer IAM Role?",
    choices: [
      { id: "A", text: "Eine Group bündelt User mit gemeinsamen Rechten; eine Role wird temporär angenommen und liefert kurzlebige Credentials" },
      { id: "B", text: "Beide sind identisch" },
      { id: "C", text: "Eine Group ist nur für Root-User, eine Role nur für externe Nutzer" },
      { id: "D", text: "Eine Role kann keine Berechtigungen enthalten" },
    ],
    correct: ["A"],
    explanation:
      "Eine IAM Group ist eine Sammlung von Usern mit gemeinsamen Berechtigungen. Eine IAM Role hat keine festen Credentials und wird temporär 'angenommen' (z.B. von Services oder für Cross-Account-Zugriff).",
    difficulty: 2,
    seedKey: "clf-c02-q-117",
    sourceRef: "AWS IAM Documentation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Was gilt bei AWS bezüglich Penetration Testing der eigenen Ressourcen?",
    choices: [
      { id: "A", text: "Penetration Testing ist auf AWS grundsätzlich verboten" },
      { id: "B", text: "Für eine Reihe genehmigter Services ist Penetration Testing der EIGENEN Ressourcen ohne vorherige Freigabe erlaubt" },
      { id: "C", text: "Man muss dafür zwingend einen Enterprise-Support-Plan abschließen" },
      { id: "D", text: "Penetration Testing darf ausschließlich AWS selbst durchführen" },
    ],
    correct: ["B"],
    explanation:
      "AWS erlaubt Kunden, gegen eine Reihe genehmigter Services (z.B. EC2) Penetration Tests der eigenen Ressourcen ohne vorherige Genehmigung durchzuführen — im Rahmen der AWS-Richtlinien. Angriffe auf fremde Ressourcen bleiben verboten.",
    difficulty: 2,
    seedKey: "clf-c02-q-118",
    sourceRef: "AWS Penetration Testing Policy",
  },
];
