// src/db/seed/questions/clf-c02-q-sec-batch3.ts
//
// Batch 3 — Security and Compliance (30 Fragen).
// Prüfungstreue EIGEN-Fragen, thematisch disjunkt zu den 49 bereits
// vorhandenen Security-Fragen (Batch 1 + 2). Verteilt über 2.1 Shared
// Responsibility, 2.2 Governance/Compliance/Encryption, 2.3 Access Management,
// 2.4 Security-Komponenten. Difficulty: 3× diff 1, 26× diff 2, 1× diff 3.
// Multiple-Response: 4 von 30.
//
// INTEGRATION (Code-Claude): in den Batch-3-Index + src/db/seed.ts aufnehmen.

import type { NewQuestion } from "../../schema";

export const clfC02QSecurityB3: NewQuestion[] = [
  // ── 2.1 Shared Responsibility (frische Winkel) ──
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Team betreibt Container über AWS Fargate. Für welche Aufgabe ist im Shared Responsibility Model der KUNDE verantwortlich?",
    choices: [
      { id: "A", text: "Patchen des Host-Betriebssystems, auf dem die Container laufen" },
      { id: "B", text: "Sicherheit des eigenen Container-Images und der Anwendung sowie Konfiguration der IAM-Task-Role" },
      { id: "C", text: "Skalieren und Patchen der zugrunde liegenden Fargate-Infrastruktur" },
      { id: "D", text: "Wartung der physischen Server und des Hypervisors" },
    ],
    correct: ["B"],
    explanation:
      "Fargate ist serverlos für Container: AWS übernimmt Host-OS, Laufzeitumgebung, Skalierung und die darunterliegende Infrastruktur. Der Kunde verantwortet das eigene Container-Image (inkl. der darin enthaltenen Software/Dependencies), den Anwendungscode und die IAM-Berechtigungen (Task-Role, welche AWS-Ressourcen die Aufgabe nutzen darf). Wie bei Lambda ist die Kunden-Verantwortung damit deutlich schmaler als bei EC2.",
    difficulty: 2,
    sourceRef: "AWS Fargate Security / Shared Responsibility Model",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Web-Anwendung überträgt Daten zwischen Kunde und Endnutzern über das öffentliche Internet. Wer muss die Verschlüsselung in Transit (TLS/HTTPS) für diese eigenen Endpunkte einrichten?",
    choices: [
      { id: "A", text: "AWS — der gesamte Internet-Traffic wird automatisch verschlüsselt" },
      { id: "B", text: "Der Kunde — er konfiguriert TLS/HTTPS für seine eigenen Endpunkte (z. B. via Zertifikaten aus ACM)" },
      { id: "C", text: "Der Internet Service Provider des Endnutzers" },
      { id: "D", text: "Niemand — Verschlüsselung in Transit ist auf AWS nicht möglich" },
    ],
    correct: ["B"],
    explanation:
      "Die Konfiguration der Verschlüsselung in Transit für die eigenen Anwendungen liegt beim Kunden ('Security IN the cloud') — er aktiviert TLS/HTTPS auf seinen Endpunkten, z. B. mit kostenlosen Zertifikaten aus AWS Certificate Manager (ACM) an CloudFront/ALB/API Gateway. AWS stellt die Werkzeuge und das sichere Netzwerk bereit, verschlüsselt aber nicht automatisch jeglichen Anwendungs-Traffic des Kunden.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model — Encryption in Transit",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche Sicherheits-Kontrollen 'erbt' ein AWS-Kunde vollständig von AWS, ohne sie selbst umsetzen zu müssen (sogenannte inherited controls)?",
    choices: [
      { id: "A", text: "IAM-Berechtigungen und Passwort-Richtlinien" },
      { id: "B", text: "Verschlüsselung der eigenen Anwendungsdaten" },
      { id: "C", text: "Physische und umgebungsbezogene Kontrollen der Rechenzentren (Zutritt, Stromversorgung, Brandschutz)" },
      { id: "D", text: "Konfiguration von Security Groups und Netzwerk-Firewalls" },
    ],
    correct: ["C"],
    explanation:
      "'Inherited controls' sind Kontrollen, die der Kunde vollständig von AWS übernimmt — vor allem die physische und umgebungsbezogene Sicherheit der Rechenzentren (Zutrittskontrollen, Stromversorgung, Kühlung, Brandschutz). IAM, Datenverschlüsselung und Netzwerk-Konfiguration bleiben dagegen Kunden-Verantwortung ('Security IN the cloud').",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model — Inherited Controls",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI Aufgaben fallen unter 'Security IN the cloud' und liegen damit in der Verantwortung des Kunden? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Verwaltung von IAM-Benutzern, -Rollen und -Berechtigungen" },
      { id: "B", text: "Physische Sicherheit der AWS-Rechenzentren" },
      { id: "C", text: "Verschlüsselung und Klassifizierung der eigenen Daten" },
      { id: "D", text: "Wartung des Virtualisierungs-Hypervisors" },
      { id: "E", text: "Betrieb der globalen AWS-Netzwerk-Backbone" },
    ],
    correct: ["A", "C"],
    explanation:
      "'Security IN the cloud' umfasst alles, was der Kunde konfiguriert und steuert: IAM (Identitäten und Berechtigungen), Klassifizierung und Verschlüsselung der eigenen Daten, OS-/Netzwerk-/Firewall-Konfiguration und Anwendungssicherheit. Physische Sicherheit (B), Hypervisor (D) und das globale Netzwerk (E) sind 'Security OF the cloud' — AWS.",
    difficulty: 2,
    sourceRef: "AWS Shared Responsibility Model",
  },

  // ── 2.3 Access Management ──
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein IAM-Benutzer hat eine IAM-Policy, die ihm den Zugriff auf Amazon S3 ERLAUBT. Die übergeordnete Service Control Policy (SCP) der AWS Organization VERWEIGERT jedoch S3 für das gesamte Konto. Was gilt für diesen Benutzer?",
    choices: [
      { id: "A", text: "Der Benutzer kann S3 nutzen, da die IAM-Policy Vorrang hat." },
      { id: "B", text: "Der Benutzer kann S3 NICHT nutzen — die SCP setzt die maximal erlaubten Berechtigungen, und ein Deny dort kann durch keine IAM-Policy überschrieben werden." },
      { id: "C", text: "Der Benutzer kann S3 nur lesend, aber nicht schreibend nutzen." },
      { id: "D", text: "Die SCP wird ignoriert, weil der Benutzer ein direktes Allow besitzt." },
    ],
    correct: ["B"],
    explanation:
      "Die effektive Berechtigung ist die SCHNITTMENGE aus SCP und IAM-Policy. SCPs gewähren keine Rechte, sondern begrenzen, was IAM-Policies maximal erlauben können. Verweigert die SCP S3, kann selbst ein ausdrückliches Allow in der IAM-Policy das nicht aufheben — der Zugriff bleibt blockiert (gilt sogar für den Root-User des Member-Accounts). Merksatz: SCP = Leitplanke/Obergrenze, IAM = konkrete Erlaubnis innerhalb dieser Grenze.",
    difficulty: 3,
    sourceRef: "AWS Organizations — SCPs and IAM Policy Evaluation",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine IAM-Policy enthält ein Allow für eine Aktion, eine andere zutreffende Policy enthält ein explizites Deny für dieselbe Aktion. Wie wird der Zugriff ausgewertet?",
    choices: [
      { id: "A", text: "Das Allow gewinnt, weil es zuerst gefunden wird." },
      { id: "B", text: "Ein explizites Deny hat immer Vorrang — der Zugriff wird verweigert." },
      { id: "C", text: "Die beiden Regeln heben sich auf und der Zugriff ist undefiniert." },
      { id: "D", text: "Es zählt die Policy mit der höheren Versionsnummer." },
    ],
    correct: ["B"],
    explanation:
      "In der IAM-Auswertung gilt: standardmäßig ist alles verboten (implicit Deny); ein Allow hebt das auf; ein explizites Deny überschreibt aber JEDES Allow. Ein explizites Deny gewinnt also immer. Das ist die Grundlage, um Berechtigungen sicher einzugrenzen.",
    difficulty: 2,
    sourceRef: "AWS IAM — Policy Evaluation Logic",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Bucket-Policy wird direkt an einen Amazon-S3-Bucket angehängt und steuert, wer auf diesen Bucket zugreifen darf. Um welchen Policy-Typ handelt es sich?",
    choices: [
      { id: "A", text: "Eine identitätsbasierte Policy (identity-based)" },
      { id: "B", text: "Eine ressourcenbasierte Policy (resource-based)" },
      { id: "C", text: "Eine Service Control Policy" },
      { id: "D", text: "Eine Session Policy" },
    ],
    correct: ["B"],
    explanation:
      "Eine ressourcenbasierte Policy wird direkt an eine Ressource (z. B. S3-Bucket, SQS-Queue, Lambda-Funktion) angehängt und legt fest, welche Prinzipale darauf zugreifen dürfen — inklusive Cross-Account-Zugriff. Identitätsbasierte Policies hängen dagegen an IAM-Usern, -Gruppen oder -Rollen und legen fest, was diese Identität tun darf.",
    difficulty: 2,
    sourceRef: "AWS IAM — Identity-based vs Resource-based Policies",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Wie kann ein Administrator durchsetzen, dass IAM-Benutzer-Passwörter eine Mindestlänge haben, Sonderzeichen enthalten und regelmäßig geändert werden müssen?",
    choices: [
      { id: "A", text: "Durch Festlegen einer Account-Passwort-Richtlinie (IAM password policy)" },
      { id: "B", text: "Durch Aktivieren von AWS Shield" },
      { id: "C", text: "Durch eine S3-Bucket-Policy" },
      { id: "D", text: "Durch Amazon CloudFront" },
    ],
    correct: ["A"],
    explanation:
      "Mit der Account-Passwort-Richtlinie in IAM lassen sich Anforderungen für IAM-Benutzer-Passwörter erzwingen: Mindestlänge, Zeichentypen (Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen), maximales Passwort-Alter (Rotation) und Verhinderung der Wiederverwendung. Shield (DDoS), Bucket-Policies (S3-Zugriff) und CloudFront (CDN) haben damit nichts zu tun.",
    difficulty: 2,
    sourceRef: "AWS IAM — Account Password Policy",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Dienst hilft dabei, zu erkennen, ob Ressourcen (z. B. S3-Buckets oder IAM-Rollen) unbeabsichtigt für externe Konten oder das Internet freigegeben wurden?",
    choices: [
      { id: "A", text: "IAM Access Analyzer" },
      { id: "B", text: "Amazon Polly" },
      { id: "C", text: "AWS Budgets" },
      { id: "D", text: "Amazon CloudFront" },
    ],
    correct: ["A"],
    explanation:
      "IAM Access Analyzer analysiert Ressourcen-Policies und meldet, wenn Ressourcen (S3, IAM-Rollen, KMS-Keys, Lambda u. a.) mit externen Entitäten geteilt werden — so lassen sich unbeabsichtigte oder ungenutzte Zugriffe erkennen und entfernen. Polly (Text-to-Speech), Budgets (Kosten) und CloudFront (CDN) sind dafür nicht zuständig.",
    difficulty: 2,
    sourceRef: "AWS IAM Access Analyzer",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen möchte, dass sich Mitarbeiter mit ihren vorhandenen Unternehmens-Anmeldedaten (z. B. aus dem Active Directory) bei AWS anmelden, ohne dass für jeden ein separater IAM-Benutzer angelegt werden muss. Welches Konzept ermöglicht das?",
    choices: [
      { id: "A", text: "Identity Federation (z. B. via SAML 2.0, oft über AWS IAM Identity Center)" },
      { id: "B", text: "Für jeden Mitarbeiter Root-Credentials ausstellen" },
      { id: "C", text: "Access Keys im Anwendungscode hinterlegen" },
      { id: "D", text: "Eine einzige Security Group für alle Mitarbeiter" },
    ],
    correct: ["A"],
    explanation:
      "Identity Federation erlaubt es, einen externen Identitätsanbieter (Active Directory, Okta, Entra ID) via SAML 2.0 anzubinden — meist über AWS IAM Identity Center. Mitarbeiter melden sich mit ihren bestehenden Unternehmens-Identitäten an und erhalten über Rollen temporären Zugriff, ohne dass pro Person ein IAM-Benutzer nötig ist. Root-Credentials (B) und Access Keys im Code (C) sind Sicherheits-Antipattern; eine Security Group (D) ist eine Netzwerk-Firewall, kein Identitätsmechanismus.",
    difficulty: 2,
    sourceRef: "AWS IAM — Identity Federation / SAML",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Wenn eine Anwendung eine IAM-Rolle annimmt (assume role), erhält sie zeitlich befristete Anmeldedaten. Welcher AWS-Dienst stellt diese temporären Sicherheits-Credentials aus?",
    choices: [
      { id: "A", text: "AWS Security Token Service (STS)" },
      { id: "B", text: "Amazon Cognito" },
      { id: "C", text: "AWS Secrets Manager" },
      { id: "D", text: "AWS Config" },
    ],
    correct: ["A"],
    explanation:
      "AWS STS (Security Token Service) stellt temporäre, eingeschränkte Anmeldedaten aus — etwa beim Annehmen einer IAM-Rolle (AssumeRole) oder bei Federation. Diese Credentials laufen automatisch ab, wodurch keine langlebigen Access Keys gespeichert werden müssen. Cognito ist für End-User-Identitäten, Secrets Manager für Geheimnis-Verwaltung, Config für Konfigurations-Tracking.",
    difficulty: 2,
    sourceRef: "AWS Security Token Service (STS)",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche der folgenden Aufgaben erfordert ZWINGEND die Anmeldung mit dem Root-User eines AWS-Kontos?",
    choices: [
      { id: "A", text: "Eine neue EC2-Instanz starten" },
      { id: "B", text: "Das AWS-Konto schließen oder den AWS-Support-Plan ändern" },
      { id: "C", text: "Einen S3-Bucket erstellen" },
      { id: "D", text: "Eine IAM-Policy an einen Benutzer anhängen" },
    ],
    correct: ["B"],
    explanation:
      "Einige wenige Aufgaben sind dem Root-User vorbehalten — z. B. das Konto schließen, den Support-Plan ändern, bestimmte Konto-Einstellungen (Name/E-Mail/Root-Passwort) ändern oder versehentlich gesperrte IAM-Berechtigungen wiederherstellen. Alltägliche Aufgaben wie EC2 starten, S3-Buckets erstellen oder IAM-Policies zuweisen sollten über IAM-Benutzer/Rollen erfolgen, NICHT über Root.",
    difficulty: 1,
    sourceRef: "AWS — Tasks that Require Root User Credentials",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI der folgenden sind gültige Methoden für Multi-Factor Authentication (MFA) bei AWS? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Eine virtuelle MFA-App (Authenticator-App auf dem Smartphone)" },
      { id: "B", text: "Ein FIDO-Sicherheitsschlüssel (Hardware-Security-Key / Passkey)" },
      { id: "C", text: "Eine zweite E-Mail-Adresse als Bestätigung" },
      { id: "D", text: "Das Wiederholen desselben Passworts" },
      { id: "E", text: "Eine öffentliche IP-Adresse als Faktor" },
    ],
    correct: ["A", "B"],
    explanation:
      "AWS unterstützt als MFA u. a. virtuelle MFA-Apps (TOTP-Authenticator wie Google/Microsoft Authenticator), Hardware-TOTP-Token und FIDO2-Sicherheitsschlüssel/Passkeys. MFA kombiniert 'etwas, das man weiß' (Passwort) mit 'etwas, das man hat' (Gerät/Schlüssel). Eine zweite E-Mail (C), dasselbe Passwort (D) oder eine IP-Adresse (E) sind keine MFA-Faktoren.",
    difficulty: 2,
    sourceRef: "AWS IAM — MFA Device Types",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Eine Anwendung in AWS-Konto A muss auf einen S3-Bucket in AWS-Konto B zugreifen. Was ist der empfohlene, sichere Weg?",
    choices: [
      { id: "A", text: "Die Access Keys eines IAM-Benutzers aus Konto B in die Anwendung in Konto A kopieren" },
      { id: "B", text: "In Konto B eine IAM-Rolle erstellen, die Konto A vertraut, und diese aus Konto A annehmen (assume role)" },
      { id: "C", text: "Den Bucket in Konto B öffentlich zugänglich machen" },
      { id: "D", text: "Die Root-Credentials von Konto B verwenden" },
    ],
    correct: ["B"],
    explanation:
      "Für kontoübergreifenden Zugriff erstellt man in Konto B eine IAM-Rolle mit einer Trust-Policy, die Konto A erlaubt, die Rolle anzunehmen. Die Anwendung in Konto A nimmt die Rolle via STS an und erhält temporäre Credentials — ohne langlebige Access Keys zu teilen. Access Keys kopieren (A), den Bucket öffentlich machen (C) oder Root nutzen (D) sind unsichere Antipattern.",
    difficulty: 2,
    sourceRef: "AWS IAM — Cross-Account Access with Roles",
  },

  // ── 2.2 Governance, Compliance, Encryption ──
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Was beschreibt 'Verschlüsselung während der Übertragung' (encryption in transit) am besten?",
    choices: [
      { id: "A", text: "Das Verschlüsseln gespeicherter Daten auf einem EBS-Volume" },
      { id: "B", text: "Das Schützen von Daten, während sie über ein Netzwerk übertragen werden, typischerweise mit TLS/SSL" },
      { id: "C", text: "Das Komprimieren von Daten zur Kostenersparnis" },
      { id: "D", text: "Das automatische Löschen von Daten nach 30 Tagen" },
    ],
    correct: ["B"],
    explanation:
      "Encryption in transit schützt Daten, während sie sich zwischen Endpunkten über ein Netzwerk bewegen — z. B. zwischen Browser und Webserver via HTTPS/TLS. Das Verschlüsseln gespeicherter Daten ist dagegen 'encryption at rest' (A). Komprimierung (C) und Löschung (D) haben nichts mit Verschlüsselung zu tun.",
    difficulty: 1,
    sourceRef: "AWS Encryption Concepts — In Transit",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Worin unterscheidet sich in AWS KMS ein 'Customer Managed Key' von einem 'AWS Managed Key'?",
    choices: [
      { id: "A", text: "Customer Managed Keys gibt es nur in der Konsole, AWS Managed Keys nur über die CLI." },
      { id: "B", text: "Bei einem Customer Managed Key kontrolliert der Kunde Key-Policy, Rotation und Aktivierung/Deaktivierung selbst; ein AWS Managed Key wird von AWS für einen Service erstellt und verwaltet, mit weniger Kontrolle für den Kunden." },
      { id: "C", text: "AWS Managed Keys sind unsicher und sollten nie verwendet werden." },
      { id: "D", text: "Es gibt keinen Unterschied." },
    ],
    correct: ["B"],
    explanation:
      "Customer Managed Keys (CMK) werden vom Kunden erstellt und vollständig kontrolliert: eigene Key-Policy, Aktivieren/Deaktivieren, Löschplanung und steuerbare Rotation. AWS Managed Keys werden automatisch von einem AWS-Service in deinem Konto erstellt und von AWS verwaltet — bequem, aber mit weniger Kontrolle (z. B. keine frei wählbare Key-Policy). Beide sind sicher; die Wahl hängt vom gewünschten Kontrollgrad ab.",
    difficulty: 2,
    sourceRef: "AWS KMS — Customer Managed vs AWS Managed Keys",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Worin unterscheiden sich AWS KMS und AWS Secrets Manager in ihrem Hauptzweck?",
    choices: [
      { id: "A", text: "KMS erstellt und verwaltet Verschlüsselungs-Schlüssel; Secrets Manager speichert und rotiert Geheimnisse wie Datenbank-Passwörter und API-Keys." },
      { id: "B", text: "Beide machen exakt dasselbe." },
      { id: "C", text: "KMS speichert Passwörter, Secrets Manager erstellt SSL-Zertifikate." },
      { id: "D", text: "KMS ist ein Load Balancer, Secrets Manager ein CDN." },
    ],
    correct: ["A"],
    explanation:
      "AWS KMS verwaltet kryptografische SCHLÜSSEL (Erstellen, Kontrollieren, Integrieren in Services zur Verschlüsselung). AWS Secrets Manager speichert GEHEIMNISSE (DB-Zugangsdaten, API-Keys), ruft sie zur Laufzeit ab und kann sie automatisch rotieren. Secrets Manager nutzt KMS intern, um die abgelegten Geheimnisse zu verschlüsseln — sie ergänzen sich.",
    difficulty: 2,
    sourceRef: "AWS KMS vs AWS Secrets Manager",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen muss für ein Audit kontinuierlich Nachweise sammeln und sie automatisiert auf einen Compliance-Rahmen (z. B. PCI-DSS oder CIS) abbilden. Welcher AWS-Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Audit Manager" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Lambda" },
      { id: "D", text: "Amazon Polly" },
    ],
    correct: ["A"],
    explanation:
      "AWS Audit Manager automatisiert das Sammeln von Nachweisen (Evidence) aus der AWS-Nutzung und ordnet sie vordefinierten oder eigenen Compliance-Frameworks zu (z. B. PCI-DSS, CIS, HIPAA, DSGVO) — das vereinfacht und beschleunigt Audits erheblich. CloudFront (CDN), Lambda (Compute) und Polly (Text-to-Speech) sind dafür nicht vorgesehen. (Hinweis: AWS Artifact liefert die FERTIGEN AWS-Compliance-Berichte; Audit Manager unterstützt die EIGENE Audit-Vorbereitung des Kunden.)",
    difficulty: 2,
    sourceRef: "AWS Audit Manager",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen möchte schnell eine sichere, gut strukturierte Umgebung aus mehreren AWS-Konten aufsetzen, mit zentralen Leitplanken (Guardrails), zentralem Logging und einem Audit-Konto. Welcher Dienst automatisiert das?",
    choices: [
      { id: "A", text: "AWS Control Tower" },
      { id: "B", text: "Amazon Inspector" },
      { id: "C", text: "AWS WAF" },
      { id: "D", text: "Amazon Athena" },
    ],
    correct: ["A"],
    explanation:
      "AWS Control Tower richtet eine 'Landing Zone' für eine Multi-Account-Umgebung nach AWS-Best-Practices ein: vordefinierte Guardrails (preventive/detective controls), ein zentrales Log-Archiv- und ein Audit-Konto, Account Factory zum standardisierten Bereitstellen neuer Konten und Anbindung an IAM Identity Center. Es baut auf AWS Organizations auf. Inspector (Schwachstellen), WAF (Web-Filter) und Athena (SQL auf S3) lösen andere Aufgaben.",
    difficulty: 2,
    sourceRef: "AWS Control Tower",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welche Aussage beschreibt Compliance im Shared Responsibility Model am besten?",
    choices: [
      { id: "A", text: "Sobald ein Unternehmen AWS nutzt, ist es automatisch für alles compliant." },
      { id: "B", text: "AWS lässt seine Infrastruktur von Dritten zertifizieren (z. B. ISO, SOC, PCI); der Kunde bleibt jedoch für die Compliance dessen verantwortlich, was er auf AWS aufbaut und konfiguriert." },
      { id: "C", text: "Compliance ist allein Sache von AWS, der Kunde muss nichts tun." },
      { id: "D", text: "Compliance ist auf AWS grundsätzlich nicht erreichbar." },
    ],
    correct: ["B"],
    explanation:
      "Compliance ist geteilt: AWS erreicht und belegt Zertifizierungen für seine Infrastruktur (abrufbar über AWS Artifact) — der Kunde 'erbt' dieses Fundament. Aber der Kunde bleibt verantwortlich, seine eigenen Workloads, Daten und Konfigurationen compliant zu gestalten (z. B. Verschlüsselung, Zugriffskontrollen, Aufbewahrung). Die bloße AWS-Nutzung macht nicht automatisch compliant.",
    difficulty: 2,
    sourceRef: "AWS Compliance — Shared Responsibility",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen unterliegt gesetzlichen Vorgaben, dass bestimmte Daten sein Land nicht verlassen dürfen (Datenresidenz/Datensouveränität). Wie adressiert man das in AWS am direktesten?",
    choices: [
      { id: "A", text: "Die Daten in einer AWS-Region innerhalb der erforderlichen geografischen/rechtlichen Grenze speichern und verarbeiten" },
      { id: "B", text: "Edge Locations weltweit aktivieren" },
      { id: "C", text: "Den Support-Plan auf Enterprise upgraden" },
      { id: "D", text: "Alle Daten in S3 Glacier verschieben" },
    ],
    correct: ["A"],
    explanation:
      "AWS-Regionen sind geografisch isoliert; der Kunde wählt die Region und kontrolliert damit, wo seine Daten gespeichert und verarbeitet werden. Für Datenresidenz/-souveränität legt man die Workloads in eine Region innerhalb der erforderlichen Rechtsordnung und schränkt ggf. via SCP die nutzbaren Regionen ein. Edge Locations (B), Support-Pläne (C) oder Glacier (D) adressieren die Anforderung nicht.",
    difficulty: 2,
    sourceRef: "AWS — Data Residency / Region Selection",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI AWS-Funktionen/-Dienste helfen dabei, Sicherheit und Governance über VIELE AWS-Konten hinweg zentral durchzusetzen? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "Service Control Policies (SCPs) in AWS Organizations" },
      { id: "B", text: "AWS Control Tower" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "Eine einzelne EC2-Security-Group" },
      { id: "E", text: "Amazon Transcribe" },
    ],
    correct: ["A", "B"],
    explanation:
      "Über viele Konten hinweg setzt man Governance mit AWS Organizations (SCPs als kontenübergreifende Leitplanken) und AWS Control Tower (Landing Zone + automatisierte Guardrails) durch. Polly (Text-to-Speech), eine einzelne Security Group (nur eine Instanz/VPC) und Transcribe (Speech-to-Text) eignen sich dafür nicht.",
    difficulty: 2,
    sourceRef: "AWS Organizations / AWS Control Tower",
  },

  // ── 2.4 Security-Komponenten & -Ressourcen ──
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Unternehmen mit vielen AWS-Konten möchte WAF-Regeln und weitere Sicherheits-Schutzmaßnahmen ZENTRAL über alle Konten und Ressourcen hinweg verwalten. Welcher Dienst ist dafür gedacht?",
    choices: [
      { id: "A", text: "AWS Firewall Manager" },
      { id: "B", text: "Amazon Route 53" },
      { id: "C", text: "AWS Cost Explorer" },
      { id: "D", text: "Amazon Comprehend" },
    ],
    correct: ["A"],
    explanation:
      "AWS Firewall Manager verwaltet Sicherheitsregeln zentral über mehrere Konten und Ressourcen in einer AWS Organization — z. B. WAF-Regeln, AWS Shield Advanced, Security-Group-Richtlinien und AWS Network Firewall. So bleibt der Schutz konsistent, auch wenn neue Ressourcen hinzukommen. Route 53 (DNS), Cost Explorer (Kosten) und Comprehend (NLP) leisten das nicht.",
    difficulty: 2,
    sourceRef: "AWS Firewall Manager",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Dienst bietet eine verwaltete, zustandsbehaftete (stateful) Netzwerk-Firewall mit Intrusion-Prevention für den Datenverkehr innerhalb einer Amazon VPC?",
    choices: [
      { id: "A", text: "AWS Network Firewall" },
      { id: "B", text: "AWS WAF" },
      { id: "C", text: "Amazon GuardDuty" },
      { id: "D", text: "AWS Artifact" },
    ],
    correct: ["A"],
    explanation:
      "AWS Network Firewall ist eine verwaltete Netzwerk-Firewall (Layer 3/4, stateful) mit Intrusion-Prevention-Funktionen zum Filtern des Datenverkehrs in einer VPC. AWS WAF filtert dagegen Web-Anfragen auf Layer 7 (HTTP/HTTPS); GuardDuty erkennt Bedrohungen aus Logs; Artifact liefert Compliance-Berichte.",
    difficulty: 2,
    sourceRef: "AWS Network Firewall",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Nachdem GuardDuty eine verdächtige Aktivität gemeldet hat, möchte ein Sicherheitsteam den Vorfall genauer analysieren und die Ursache (root cause) ermitteln, indem es zusammenhängende Ereignisse visuell auswertet. Welcher Dienst unterstützt diese Untersuchung?",
    choices: [
      { id: "A", text: "Amazon Detective" },
      { id: "B", text: "AWS Budgets" },
      { id: "C", text: "Amazon Polly" },
      { id: "D", text: "AWS Certificate Manager" },
    ],
    correct: ["A"],
    explanation:
      "Amazon Detective sammelt und korreliert automatisch Log- und Ereignisdaten (u. a. aus GuardDuty, CloudTrail, VPC Flow Logs) und stellt sie als Visualisierungen dar, um Sicherheitsvorfälle zu untersuchen und die Ursache schneller zu finden. GuardDuty ERKENNT Bedrohungen, Detective hilft, sie zu UNTERSUCHEN. Budgets, Polly und ACM sind dafür nicht gedacht.",
    difficulty: 2,
    sourceRef: "Amazon Detective",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Team möchte Datenbank-Passwörter sicher ablegen UND automatisch rotieren lassen. Für reine, nicht-sensible Konfigurationswerte reicht ein kostenloser Speicher. Welche Zuordnung ist korrekt?",
    choices: [
      { id: "A", text: "AWS Secrets Manager für rotierbare Geheimnisse; AWS Systems Manager Parameter Store für (auch kostenlose) Konfigurationswerte" },
      { id: "B", text: "Beide Aufgaben übernimmt ausschließlich Amazon S3" },
      { id: "C", text: "AWS Shield für Geheimnisse; AWS WAF für Konfiguration" },
      { id: "D", text: "Amazon Rekognition für beides" },
    ],
    correct: ["A"],
    explanation:
      "AWS Secrets Manager speichert Geheimnisse und unterstützt automatische Rotation (kostenpflichtig pro Secret) — ideal für DB-Zugangsdaten. AWS Systems Manager Parameter Store speichert Konfigurationsdaten und Geheimnisse, hat eine kostenlose Standard-Stufe, bietet aber keine eingebaute automatische Rotation. Faustregel: automatische Rotation nötig → Secrets Manager; einfache/kostenlose Konfiguration → Parameter Store.",
    difficulty: 2,
    sourceRef: "AWS Secrets Manager vs SSM Parameter Store",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "multiple",
    prompt:
      "Welche ZWEI Aussagen über AWS WAF (Web Application Firewall) sind korrekt? (Wähle ZWEI)",
    choices: [
      { id: "A", text: "WAF kann mit AWS Managed Rules vorkonfigurierte Regelgruppen gegen gängige Bedrohungen (z. B. SQL Injection) nutzen." },
      { id: "B", text: "WAF wird typischerweise vor CloudFront, einem Application Load Balancer oder API Gateway geschaltet." },
      { id: "C", text: "WAF ist ein Service zum Erstellen relationaler Datenbanken." },
      { id: "D", text: "WAF verschlüsselt Daten im Ruhezustand auf EBS-Volumes." },
      { id: "E", text: "WAF ersetzt vollständig die Notwendigkeit von IAM." },
    ],
    correct: ["A", "B"],
    explanation:
      "AWS WAF filtert Web-Anfragen auf Layer 7 und lässt sich vor CloudFront, ALB, API Gateway oder AppSync schalten. Man kann AWS Managed Rules (vorgefertigte Regelgruppen, z. B. Core Rule Set, Known Bad Inputs, SQL-Injection) oder eigene Regeln einsetzen. WAF ist keine Datenbank (C), verschlüsselt keine Daten at rest (D, das ist KMS) und ersetzt nicht IAM (E).",
    difficulty: 2,
    sourceRef: "AWS WAF — Managed Rules / Integrations",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Welcher Dienst führt automatisierte Prüfungen der eigenen AWS-Umgebung gegen anerkannte Sicherheitsstandards (z. B. AWS Foundational Security Best Practices oder CIS) durch und fasst die Ergebnisse in einem zentralen Posture-Management-Dashboard zusammen?",
    choices: [
      { id: "A", text: "AWS Security Hub" },
      { id: "B", text: "Amazon Polly" },
      { id: "C", text: "AWS Direct Connect" },
      { id: "D", text: "Amazon SQS" },
    ],
    correct: ["A"],
    explanation:
      "AWS Security Hub ist ein Cloud Security Posture Management (CSPM): Es aggregiert Findings aus Diensten wie GuardDuty, Inspector und Macie UND führt automatisierte Checks gegen Sicherheitsstandards durch (AWS FSBP, CIS AWS Foundations, PCI-DSS, NIST) — mit zentralem Überblick über die Sicherheitslage. Polly, Direct Connect und SQS haben damit nichts zu tun.",
    difficulty: 2,
    sourceRef: "AWS Security Hub — Security Standards",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Ein Konto-Administrator möchte schnell auf gängige Sicherheits-Risiken hingewiesen werden, etwa Security Groups mit unbeschränktem Zugriff, fehlende MFA auf dem Root-User oder zu offene S3-Bucket-Berechtigungen. Welcher Dienst liefert solche Best-Practice-Sicherheits-Checks?",
    choices: [
      { id: "A", text: "AWS Trusted Advisor" },
      { id: "B", text: "Amazon Athena" },
      { id: "C", text: "AWS Snowball" },
      { id: "D", text: "Amazon Polly" },
    ],
    correct: ["A"],
    explanation:
      "AWS Trusted Advisor prüft das Konto u. a. in der Kategorie Security gegen Best Practices — z. B. Security Groups mit offenem Zugriff, fehlende MFA auf dem Root-User, exponierte Access Keys oder zu offene S3-Berechtigungen — und gibt konkrete Empfehlungen. (Umfang der Checks hängt vom Support-Plan ab.) Athena, Snowball und Polly bieten solche Sicherheits-Checks nicht.",
    difficulty: 2,
    sourceRef: "AWS Trusted Advisor — Security Checks",
  },
  {
    cert: "CLF-C02",
    domain: "Security and Compliance",
    type: "single",
    prompt:
      "Das Patchen des Betriebssystems auf EC2-Instanzen liegt beim Kunden. Welcher AWS-Dienst hilft, dieses Patching über eine ganze EC2-Flotte hinweg zu automatisieren?",
    choices: [
      { id: "A", text: "AWS Systems Manager (Patch Manager)" },
      { id: "B", text: "Amazon CloudFront" },
      { id: "C", text: "AWS Artifact" },
      { id: "D", text: "Amazon Comprehend" },
    ],
    correct: ["A"],
    explanation:
      "AWS Systems Manager (Patch Manager) automatisiert das Bereitstellen von Betriebssystem- und Software-Patches über viele EC2-Instanzen (und On-Premises-Server) hinweg — inkl. Patch-Baselines und Wartungsfenstern. Das adressiert direkt die Kunden-Verantwortung fürs OS-Patching aus dem Shared Responsibility Model. CloudFront (CDN), Artifact (Compliance-Berichte) und Comprehend (NLP) helfen dabei nicht.",
    difficulty: 2,
    sourceRef: "AWS Systems Manager — Patch Manager",
  },
];
