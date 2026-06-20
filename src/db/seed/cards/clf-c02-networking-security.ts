// src/db/seed/cards/clf-c02-networking-security.ts

import type { NewFlashcard } from "../../schema";

export const clfC02NetworkingSecurityCards: NewFlashcard[] = [
  // ── Networking (Rest) ──

  // 1. Direct Connect
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Direct Connect — was ist das?",
    back: "Dedizierte physische Netzwerkverbindung von deinem Rechenzentrum zu AWS (über einen Direct-Connect-Standort), nicht übers öffentliche Internet. Vorteile: konsistente niedrige Latenz, höhere Bandbreite, sicherer. Use Case: große Datenmengen, hybride Architekturen, Compliance. Teurer und länger einzurichten als VPN.",
    difficulty: 2,
    seedKey: "clf-c02-card-031",
    sourceRef: "AWS Direct Connect Documentation",
  },

  // 2. Site-to-Site VPN
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "AWS Site-to-Site VPN — was ist das?",
    back: "Verschlüsselte Verbindung zwischen deinem On-Premises-Netzwerk und deiner VPC über das öffentliche Internet (IPsec-Tunnel). Schnell einzurichten und günstig. Nachteil: Latenz/Bandbreite vom Internet abhängig (schwankend). Use Case: schnelle, sichere Hybrid-Anbindung ohne dedizierte Leitung.",
    difficulty: 2,
    seedKey: "clf-c02-card-032",
    sourceRef: "AWS VPN Documentation",
  },

  // 3. Direct Connect vs VPN
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Direct Connect vs Site-to-Site VPN — wann was?",
    back: "VPN: über öffentliches Internet, schnell + günstig einzurichten, aber Latenz schwankt. Direct Connect: dedizierte private Leitung, konsistente Performance + hohe Bandbreite, aber teurer und Wochen Vorlauf. Faustregel: VPN für schnell/günstig/flexibel, Direct Connect für konstante Performance + große Datenmengen. Kombinierbar (VPN als Backup für DX).",
    difficulty: 2,
    seedKey: "clf-c02-card-033",
    sourceRef: "AWS Hybrid Connectivity",
  },

  // 4. API Gateway
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Amazon API Gateway — Zweck?",
    back: "Vollständig managed Service zum Erstellen, Veröffentlichen und Verwalten von APIs (REST, HTTP, WebSocket). Übernimmt Traffic-Management, Authentifizierung, Throttling, Caching, Versionierung. Häufig als Front-Door für Lambda-Funktionen (Serverless-Backend) oder andere Services. Zahlst pro API-Aufruf.",
    difficulty: 1,
    seedKey: "clf-c02-card-034",
    sourceRef: "AWS API Gateway Documentation",
  },

  // 5. VPC Peering
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "VPC Peering — was ist das?",
    back: "Direkte private Netzwerkverbindung zwischen zwei VPCs, sodass Ressourcen kommunizieren, als wären sie im selben Netz. Funktioniert über Accounts und Regionen hinweg. Wichtig: nicht transitiv (A↔B und B↔C bedeutet NICHT A↔C — dafür Transit Gateway). Verkehr bleibt im AWS-Netz, nicht im öffentlichen Internet.",
    difficulty: 2,
    seedKey: "clf-c02-card-035",
    sourceRef: "AWS VPC Peering",
  },

  // 6. VPC Endpoints
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "VPC Endpoints — wofür?",
    back: "Ermöglichen privaten Zugriff von der VPC auf AWS-Services, ohne übers öffentliche Internet zu gehen (kein IGW/NAT nötig). Zwei Typen: Gateway Endpoint (nur für S3 und DynamoDB, kostenlos) und Interface Endpoint (für viele Services, via PrivateLink, kostenpflichtig). Use Case: Sicherheit + keine Internet-Exposition.",
    difficulty: 2,
    seedKey: "clf-c02-card-036",
    sourceRef: "AWS VPC Endpoints",
  },

  // 7. Global Accelerator vs CloudFront
  {
    cert: "CLF-C02",
    domain: "Cloud Technology and Services",
    front: "Global Accelerator vs CloudFront — Unterschied?",
    back: "CloudFront: CDN, cached Inhalte an Edge Locations — ideal für statische/dynamische Web-Inhalte (HTTP/HTTPS). Global Accelerator: leitet Traffic über das AWS-Backbone zu nächstgelegenen Endpunkten, verbessert Performance für NICHT-HTTP-Workloads (TCP/UDP, Gaming, IoT, VoIP), liefert statische Anycast-IPs. Faustregel: CloudFront = Content cachen, Global Accelerator = Traffic-Routing beschleunigen.",
    difficulty: 2,
    seedKey: "clf-c02-card-037",
    sourceRef: "AWS Networking Services",
  },

  // ── IAM & Identity ──

  // 8. IAM
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS IAM — die 4 Grundbausteine?",
    back: "Identity and Access Management steuert WER WAS darf. Users (einzelne Identitäten für Personen/Apps), Groups (Sammlung von Users mit gemeinsamen Rechten), Roles (temporäre Rechte zum Annehmen, z.B. für Services oder Cross-Account), Policies (JSON-Dokumente, die Berechtigungen definieren — an User/Group/Role gehängt). IAM ist global, kostenlos.",
    difficulty: 2,
    seedKey: "clf-c02-card-038",
    sourceRef: "AWS IAM Documentation",
  },

  // 9. IAM Role vs User
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "IAM Role vs IAM User — Unterschied?",
    back: "User: feste Identität mit langfristigen Credentials (Passwort/Access Keys), für eine Person oder App. Role: KEINE festen Credentials, wird temporär 'angenommen' (assumed) und liefert kurzlebige Credentials. Roles für: EC2-Instanzen/Lambda (Service-Zugriff), Cross-Account-Zugriff, föderierte Logins. Best Practice: Services nutzen Roles, nicht eingebettete Access Keys.",
    difficulty: 2,
    seedKey: "clf-c02-card-039",
    sourceRef: "AWS IAM Roles",
  },

  // 10. IAM Policy + Least Privilege
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "IAM Policy + Prinzip Least Privilege?",
    back: "Policy: JSON-Dokument mit Effect (Allow/Deny), Action (welche API-Calls), Resource (worauf). Explizites Deny schlägt immer jedes Allow. Least Privilege: gib nur die minimal nötigen Rechte — nicht mehr. Start mit nichts, füge gezielt hinzu. Reduziert Schaden bei kompromittierten Credentials. Zentrale Prüfungs-Faustregel.",
    difficulty: 2,
    seedKey: "clf-c02-card-040",
    sourceRef: "AWS IAM Policies",
  },

  // 11. Root User
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Root User — was beachten?",
    back: "Der Root User (mit der Account-E-Mail erstellt) hat uneingeschränkten Vollzugriff. Best Practices: NICHT für Alltagsaufgaben nutzen, MFA aktivieren, Access Keys löschen, stattdessen IAM-User/Roles mit minimalen Rechten anlegen. Nur wenige Aufgaben erfordern wirklich Root (z.B. Account-Schließung, Support-Plan ändern).",
    difficulty: 1,
    seedKey: "clf-c02-card-041",
    sourceRef: "AWS Root User Best Practices",
  },

  // 12. MFA
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Multi-Factor Authentication (MFA) — Prinzip?",
    back: "Zusätzliche Sicherheitsebene über das Passwort hinaus: etwas, das du WEISST (Passwort) + etwas, das du HAST (Code von App/Hardware-Token/Sicherheitsschlüssel). Selbst bei gestohlenem Passwort kein Zugriff ohne zweiten Faktor. Sollte für Root User und alle privilegierten IAM-User aktiviert sein. Kostenlos.",
    difficulty: 1,
    seedKey: "clf-c02-card-042",
    sourceRef: "AWS MFA Documentation",
  },

  // 13. IAM Identity Center
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS IAM Identity Center (früher SSO) — wofür?",
    back: "Zentrale Verwaltung von Single Sign-On (SSO) über mehrere AWS-Accounts und Anwendungen hinweg. Nutzer melden sich einmal an und greifen auf alle zugewiesenen Accounts/Apps zu. Integriert mit existierenden Identity Providern (Active Directory, externe IdPs). Ideal für Organisationen mit vielen Accounts (via AWS Organizations).",
    difficulty: 2,
    seedKey: "clf-c02-card-043",
    sourceRef: "AWS IAM Identity Center",
  },

  // 14. Cognito
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Amazon Cognito — wofür?",
    back: "Verwaltung von Identitäten für DEINE Endnutzer-Anwendungen (Web/Mobile) — nicht für AWS-interne Verwaltung (das ist IAM). Bietet Sign-up/Sign-in, soziale Logins (Google, Facebook), MFA für App-Nutzer. User Pools (Authentifizierung) + Identity Pools (temporärer AWS-Ressourcen-Zugriff). Faustregel: IAM = AWS-Zugriff, Cognito = App-Nutzer-Zugriff.",
    difficulty: 2,
    seedKey: "clf-c02-card-044",
    sourceRef: "AWS Cognito Documentation",
  },

  // 15. Organizations + SCPs
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Organizations + Service Control Policies (SCPs)?",
    back: "Organizations: zentrale Verwaltung mehrerer AWS-Accounts unter einem Dach — consolidated Billing (Mengenrabatte), Account-Gruppierung in Organizational Units (OUs). SCPs: Leitplanken, die maximal erlaubte Berechtigungen für Accounts/OUs festlegen (auch der Root User eines Accounts kann nicht darüber hinaus). SCPs erlauben nichts aktiv — sie begrenzen nur.",
    difficulty: 2,
    seedKey: "clf-c02-card-045",
    sourceRef: "AWS Organizations Documentation",
  },

  // ── Threat Detection & Data ──

  // 16. GuardDuty
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Amazon GuardDuty — was macht es?",
    back: "Intelligente Bedrohungserkennung (Threat Detection): analysiert kontinuierlich Logs (CloudTrail, VPC Flow Logs, DNS-Logs) mit Machine Learning, um verdächtige Aktivitäten zu erkennen (ungewöhnliche API-Calls, Krypto-Mining, kompromittierte Instanzen). Keine Agents nötig. Faustregel: GuardDuty schaut, WAS PASSIERT IST (in Logs).",
    difficulty: 2,
    seedKey: "clf-c02-card-046",
    sourceRef: "AWS GuardDuty Documentation",
  },

  // 17. Inspector
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Amazon Inspector — was macht es?",
    back: "Automatisierte Schwachstellen-Prüfung (Vulnerability Management): scannt EC2-Instanzen, Container-Images in ECR und Lambda-Funktionen auf bekannte Sicherheitslücken (CVEs) und unbeabsichtigte Netzwerk-Exposition. Faustregel: Inspector prüft, WAS PASSIEREN KÖNNTE (Schwachstellen in Ressourcen).",
    difficulty: 2,
    seedKey: "clf-c02-card-047",
    sourceRef: "AWS Inspector Documentation",
  },

  // 18. Macie
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Amazon Macie — was macht es?",
    back: "Sensitive-Data-Discovery: nutzt Machine Learning, um in S3-Buckets sensible Daten (PII wie Namen, Kreditkartennummern, Gesundheitsdaten) zu finden und zu klassifizieren. Hilft bei Datenschutz und Compliance (DSGVO, HIPAA). Faustregel: Macie = sensible Daten in S3 aufspüren.",
    difficulty: 2,
    seedKey: "clf-c02-card-048",
    sourceRef: "AWS Macie Documentation",
  },

  // 19. GuardDuty vs Inspector vs Macie
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "GuardDuty vs Inspector vs Macie — schnelle Abgrenzung?",
    back: "GuardDuty: Bedrohungen in LOGS erkennen (was passiert ist). Inspector: SCHWACHSTELLEN in EC2/ECR/Lambda scannen (was passieren könnte). Macie: sensible DATEN (PII) in S3 finden. Merksatz: GuardDuty = Bedrohungen, Inspector = Schwachstellen, Macie = Daten. Werden in der Prüfung gerne gegeneinander abgefragt.",
    difficulty: 2,
    seedKey: "clf-c02-card-049",
    sourceRef: "AWS Security Services Comparison",
  },

  // ── Schutz, Verschlüsselung, Audit ──

  // 20. Shield
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Shield — Standard vs Advanced?",
    back: "DDoS-Schutz. Shield Standard: automatisch und KOSTENLOS für alle AWS-Kunden, schützt vor häufigen Netzwerk-/Transport-Layer-Angriffen. Shield Advanced: kostenpflichtig, erweiterter Schutz gegen große/komplexe DDoS-Angriffe, 24/7-DDoS-Response-Team, Kostenschutz bei Angriffs-bedingter Skalierung. Faustregel: Standard reicht meist, Advanced für hochkritische Apps.",
    difficulty: 2,
    seedKey: "clf-c02-card-050",
    sourceRef: "AWS Shield Documentation",
  },

  // 21. WAF
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS WAF — was macht es?",
    back: "Web Application Firewall: überwacht und filtert HTTP/HTTPS-Anfragen an deine Web-Apps. Schützt vor Application-Layer-Angriffen wie SQL Injection und Cross-Site-Scripting (XSS). Du definierst Regeln (z.B. IPs blockieren, Rate Limiting, Geo-Blocking). Integriert mit CloudFront, ALB, API Gateway. Faustregel: WAF = Schutz auf Anwendungsebene (Layer 7).",
    difficulty: 2,
    seedKey: "clf-c02-card-051",
    sourceRef: "AWS WAF Documentation",
  },

  // 22. Shield vs WAF
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Shield vs AWS WAF — Unterschied?",
    back: "Shield: schützt vor DDoS-Angriffen (Überflutung mit Traffic, Netzwerk-/Transport-Layer). WAF: schützt vor Application-Layer-Exploits (SQL Injection, XSS) durch Regel-basiertes Filtern von HTTP-Requests. Faustregel: Shield = Volumen-Angriffe abwehren, WAF = bösartige Anfragen filtern. Werden oft kombiniert.",
    difficulty: 2,
    seedKey: "clf-c02-card-052",
    sourceRef: "AWS Security Comparison",
  },

  // 23. KMS
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS KMS (Key Management Service) — Zweck?",
    back: "Zentrale Erstellung und Verwaltung von Verschlüsselungs-Keys. Integriert mit den meisten AWS-Services (S3, EBS, RDS etc.) für Verschlüsselung im Ruhezustand (at rest). Du kontrollierst Key-Zugriff über IAM-Policies. Faustregel: KMS = Schlüssel verwalten und Daten verschlüsseln. Für dedizierte Hardware: CloudHSM.",
    difficulty: 2,
    seedKey: "clf-c02-card-053",
    sourceRef: "AWS KMS Documentation",
  },

  // 24. Secrets Manager
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Secrets Manager — wofür?",
    back: "Sicheres Speichern und automatisches Rotieren von Geheimnissen (DB-Passwörter, API-Keys, Credentials). Anwendungen rufen Secrets zur Laufzeit ab, statt sie im Code zu hinterlegen. Automatische Rotation (z.B. RDS-Passwörter regelmäßig wechseln). Faustregel: Secrets Manager = Passwörter/Keys sicher + mit Auto-Rotation.",
    difficulty: 2,
    seedKey: "clf-c02-card-054",
    sourceRef: "AWS Secrets Manager Documentation",
  },

  // 25. ACM
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Certificate Manager (ACM) — Zweck?",
    back: "Erstellen, Verwalten und automatisches Erneuern von SSL/TLS-Zertifikaten für HTTPS-Verschlüsselung. Kostenlose öffentliche Zertifikate für AWS-Ressourcen (CloudFront, ALB, API Gateway). Automatische Erneuerung verhindert abgelaufene Zertifikate. Faustregel: ACM = HTTPS-Zertifikate verwalten, ohne manuelles Erneuern.",
    difficulty: 1,
    seedKey: "clf-c02-card-055",
    sourceRef: "AWS Certificate Manager",
  },

  // 26. Security Hub
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Security Hub — wofür?",
    back: "Zentrale Sammelstelle für Sicherheits-Findings aus mehreren Services (GuardDuty, Inspector, Macie, Config) und Partner-Tools — in einem standardisierten Format und einem Dashboard. Automatisierte Best-Practice-Checks gegen Standards (z.B. CIS, AWS Foundational Security Best Practices). Faustregel: Security Hub = ein Überblick über deine gesamte Sicherheitslage.",
    difficulty: 2,
    seedKey: "clf-c02-card-056",
    sourceRef: "AWS Security Hub Documentation",
  },

  // 27. CloudTrail
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS CloudTrail — was zeichnet es auf?",
    back: "Protokolliert alle API-Aufrufe und Aktivitäten in deinem Account: WER hat WANN WAS gemacht (Konsole, CLI, SDK). Entscheidend für Audit, Compliance und Sicherheitsanalyse ('Wer hat diese Instanz gelöscht?'). Standardmäßig 90 Tage Event-History; für längere Aufbewahrung in S3 speichern. Faustregel: CloudTrail = Aktivitäts-/Audit-Log.",
    difficulty: 2,
    seedKey: "clf-c02-card-057",
    sourceRef: "AWS CloudTrail Documentation",
  },

  // 28. AWS Config
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "AWS Config — wofür?",
    back: "Verfolgt die Konfiguration deiner AWS-Ressourcen über die Zeit und prüft sie gegen gewünschte Regeln (Compliance). Beantwortet: 'Wie war diese Ressource konfiguriert?' und 'Entspricht sie unseren Vorgaben?' (z.B. 'sind alle S3-Buckets verschlüsselt?'). Faustregel: Config = Ressourcen-Konfiguration + Compliance-Überwachung.",
    difficulty: 2,
    seedKey: "clf-c02-card-058",
    sourceRef: "AWS Config Documentation",
  },

  // 29. CloudTrail vs Config
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "CloudTrail vs AWS Config — Unterschied?",
    back: "CloudTrail: zeichnet AKTIONEN auf — wer hat welchen API-Call gemacht (Aktivitäts-Audit). Config: zeichnet ZUSTÄNDE auf — wie sind Ressourcen konfiguriert und sind sie compliant (Konfigurations-Audit). Merksatz: CloudTrail = WER hat WAS getan, Config = WIE ist es konfiguriert. Häufige Prüfungs-Verwechslung.",
    difficulty: 2,
    seedKey: "clf-c02-card-059",
    sourceRef: "AWS Management Tools Comparison",
  },

  // 30. Firewall-Ebenen
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    front: "Security Group vs Network Firewall vs WAF — welche Ebene?",
    back: "Security Group: einfache Firewall auf Instanz-Ebene (Ports/IPs erlauben), stateful. AWS Network Firewall: managed Firewall + Intrusion Detection/Prevention auf VPC-Ebene (komplexer Netzwerkverkehr). WAF: Application-Layer (Layer 7), filtert HTTP-Anfragen (SQLi, XSS). Merksatz: SG = Instanz-Ports, Network Firewall = VPC-Netzwerk, WAF = Web-Anfragen.",
    difficulty: 2,
    seedKey: "clf-c02-card-060",
    sourceRef: "AWS Network Security Comparison",
  },
];
