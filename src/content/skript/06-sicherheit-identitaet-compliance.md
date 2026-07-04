# Kapitel 6 — Sicherheit, Identität & Compliance

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Das größte Kapitel — aber es sortiert sich in **vier Familien**, und die Prüfung testet fast ausschließlich, welcher Dienst welche Frage beantwortet:

| Familie | Frage | Dienste |
|---|---|---|
| **Identität** | „Wer bist du — und was darfst du?" | IAM, Identity Center, Cognito, Managed AD |
| **Schutz (Mauern)** | „Wie halte ich Angriffe ab?" | Shield, WAF, Network Firewall, Firewall Manager, KMS/CloudHSM, ACM, Secrets Manager |
| **Erkennung (Alarme)** | „Passiert gerade etwas Böses?" | GuardDuty, Inspector, Macie, Security Hub, Detective |
| **Governance** | „Wie regiere ich viele Konten?" | Organizations, Control Tower, RAM, Audit Manager |

---

## AWS IAM (Identity and Access Management)

**Architektonische Einordnung**

IAM ist das **Fundament unter allem** — kein einziger AWS-Dienst funktioniert ohne die Frage „darf diese Identität das?". IAM ist ein **globaler Dienst** (nicht regional) und kostenlos.

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Die **zentrale Schließanlage**. Mit IAM entscheidest du haargenau, **wer** (Authentifizierung) auf **welche** AWS-Ressourcen zugreifen darf (Autorisierung).

- **Principle of Least Privilege:** Das absolute Lieblingswort von AWS. Gib Nutzern immer nur **exakt** die Berechtigungen, die sie für ihre aktuelle Aufgabe zwingend benötigen — und kein bisschen mehr.
- **IAM Policies:** Berechtigungen als **JSON-Dokumente**, die Aktionen erlauben (**Allow**) oder verbieten (**Deny**). **Ein „Deny" überschreibt immer ein „Allow".**
- **IAM Roles:** Das ist wichtig! Rollen sind **nicht für Personen** gedacht, sondern **temporär für Maschinen oder Services**. Eine EC2-Instanz bekommt eine Rolle, um sicher ein Bild aus S3 lesen zu dürfen — **ganz ohne fest einprogrammierte Passwörter**.

**Praxis (Partner & Use Cases):** In großen Unternehmen legt niemand manuell 5.000 IAM-Nutzer an — man nutzt **Identity Federation**: Das AWS-Konto wird mit **Microsoft Entra ID** (früher Azure AD) oder **Okta** verknüpft. Der Mitarbeiter loggt sich morgens bei Microsoft ein und greift per **Single Sign-On (SSO)** direkt auf AWS zu — im Hintergrund nimmt er temporär eine IAM-Rolle an.

🛑 **Pro-Tipp CLF/SAA — die Basics, die die Prüfung liebt:**
- **Root User:** das Konto, mit dem alles begann — **niemals für die tägliche Arbeit nutzen**, mit **MFA** absichern, keine Access Keys dafür erstellen. Nur für die wenigen Root-only-Aufgaben (Konto schließen, Support-Plan ändern).
- **User / Group / Role:** User = eine Person (dauerhafte Credentials), Group = Bündel von Usern (Policies effizient zuweisen), **Role = temporär, für Menschen UND Maschinen** — die Prüfungs-Best-Practice ist fast immer „Rolle statt Access Keys im Code".
- **MFA** für alle menschlichen Nutzer, **Access Keys** nur für CLI/API-Zugriff (und lieber Rollen).
- **IAM ist global** — Nutzer/Rollen gelten in allen Regionen.

---

## IAM Access Analyzer & Erweiterte IAM-Konzepte

**Metapher / Konzept**

> Der IAM-Röntgenblick plus die Profi-Werkzeuge, die genau steuern, wer in AWS was darf.

**Die Konzepte (deine Karte, wortgetreu):**

- **IAM Access Analyzer:** analysiert deine Richtlinien und zeigt, **welche Ressourcen von außerhalb** (anderes Konto, Internet, andere Organisation) zugänglich sind — „dieser S3-Bucket/diese Rolle ist für ein externes Konto offen". Deckt **unbeabsichtigten externen Zugriff** auf; findet auch ungenutzte Zugriffe und validiert Richtlinien.
- **Permission Boundary:** eine **Obergrenze** für das, was eine IAM-Identität maximal darf — selbst wenn ihre Policy mehr erlaubt. Anwendungsfall: Ein Team-Lead darf neue User anlegen, aber die Boundary stellt sicher, dass diese nie mehr Rechte als erlaubt bekommen. Wie SCPs, aber auf **Einzel-Identitäts-Ebene**.
- **STS AssumeRole (Security Token Service):** STS gibt **temporäre Zugangsdaten** aus. AssumeRole = eine Identität „schlüpft" vorübergehend in eine Rolle. Kernmechanismus für **Cross-Account-Zugriff**, Services, die im Auftrag handeln, und Federation. Keine dauerhaften Schlüssel → sicherer.
- **SAML-/Identity Federation:** verbindet AWS mit einem externen Identitätsanbieter (Firmen-AD via SAML, Web-Identitäten wie Google). Mitarbeiter nutzen ihren Firmen-Login und nehmen per STS eine Rolle an — kein separater IAM-User nötig (oft über IAM Identity Center).

**⚠️ Prüfungs-Knackpunkte**
- Extern/öffentlich zugängliche Ressourcen finden → **Access Analyzer**.
- Maximale Rechte einer Identität deckeln → **Permission Boundary**.
- Temporäre Rechte / Cross-Account → **STS AssumeRole**.
- Firmen-AD/externer Login → **(SAML-)Federation**.
- **Hierarchie der „Leitplanken": SCP (ganzes Konto) > Permission Boundary (einzelne Identität) > IAM Policy (tatsächliche Rechte).**

---

## AWS IAM Identity Center

**Metapher / Konzept**

> Der eine zentrale Login, mit dem Mitarbeiter auf alle ihre AWS-Konten und Apps zugreifen — einmal anmelden, überall drin.

**Das Problem & Die Lösung**

Große Firmen haben hunderte AWS-Konten (Organizations, Karte 43). Soll wirklich jeder der 500 Mitarbeiter **in jedem Konto** einen eigenen IAM-User haben? Tausende Logins — ein Sicherheits- und Verwaltungs-Albtraum: neue Mitarbeiter in 50 Konten anlegen, ausscheidende überall löschen (wird garantiert irgendwo vergessen).

**IAM Identity Center** (früher **„AWS SSO"** — der alte Name taucht in Fragen noch auf!) gibt jedem Mitarbeiter **eine einzige Identität** mit **Single Sign-On** auf alle zugewiesenen Konten und Apps:
- **Zentrale Nutzerverwaltung** für die ganze Organisation — perfekt mit Organizations.
- **Ein Zugangsportal** mit allen erlaubten Konten/Apps.
- **Anbindung an bestehende Verzeichnisse:** Active Directory / Entra ID, Okta — der Mitarbeiter nutzt sein gewohntes Firmenpasswort.
- **Temporäre Berechtigungen** über Rollen, ohne dauerhafte Credentials pro Konto.

**Die Killer-Abgrenzung (verschärft die Cognito-Frage):**
- **IAM** = Berechtigungen **innerhalb eines einzelnen Kontos**.
- **IAM Identity Center** = zentraler Login **über viele Konten** (SSO, Mitarbeiter).
- **Cognito** = Logins für die **Endkunden deiner App** (nicht Mitarbeiter!).

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Single Sign-On / SSO", „ein Login für mehrere AWS-Konten", „zentraler Mitarbeiter-Zugang", „mit Active Directory verbinden" → **IAM Identity Center**.
- Alter Name „AWS SSO" → gemeint ist IAM Identity Center.
- **Traumpaar in Prüfungsfragen:** Organizations (viele Konten) + IAM Identity Center (ein Login für alle).

---

## Amazon Cognito

**Metapher / Konzept**

> Das fertige Login-System zum Mieten.

**Das Problem & Die Lösung**

Du baust eine Fitness-App mit 100.000 Nutzern. Jeder braucht ein Konto: Registrierung, Login, „Passwort vergessen", E-Mail-Bestätigung, Zwei-Faktor, „Login mit Google/Apple/Facebook"... Das selbst zu programmieren dauert Monate — und **ein einziger Sicherheitsfehler** in der Passwort-Datenbank ruiniert deinen Ruf (und der Datenschutzbeauftragte steht vor der Tür).

**Cognito** ist die komplette Identitätsverwaltung für App-Nutzer als fertiger Dienst — die **zwei Bausteine**:
- **User Pools (das Nutzerverzeichnis):** Hier „wohnen" deine Millionen App-Nutzer. Registrierung, Login, Passwort-Reset, MFA, **Social Login** („Anmelden mit Google/Apple/Facebook"). Beantwortet: **Wer bist du?**
- **Identity Pools (der AWS-Zugang):** Wenn ein eingeloggter Nutzer direkt auf AWS-Ressourcen zugreifen soll (Profilbild in S3 hochladen), gibt der Identity Pool ihm **temporäre AWS-Berechtigungen**. Beantwortet: **Was darfst du in AWS?**

**⚠️ Die Prüfungs-Knackpunkte**
- **Die absolute Killer-Abgrenzung — Cognito vs. IAM:** **IAM** = Identitäten für **dein Team / deine Firma** (Entwickler, Admins, interne Services). **Cognito** = Identitäten für die **Endkunden deiner App** (die Millionen Nutzer, die von AWS gar nichts wissen).
- Signalwörter: „Web-/Mobile-App", „Sign-up/Sign-in für Nutzer", „Social Login" → **Cognito**.
- „Mitarbeiter sollen auf die AWS-Konsole zugreifen" → **IAM** (bzw. IAM Identity Center), **NICHT** Cognito.

---

## AWS Managed Microsoft AD

**Metapher / Konzept**

> Das vollwertige Microsoft-Firmenverzeichnis als verwalteter Dienst in der Cloud — echtes Active Directory, nur ohne den Serverpflege-Stress.

**Das Problem & Die Lösung**

In fast jeder Firma läuft **Microsoft Active Directory (AD)**: das zentrale Verzeichnis für Mitarbeiter-Konten, Passwörter, Gruppen, Berechtigungen. Daran hängen Windows-Anmeldungen, Datei-Freigaben — und viele Unternehmensanwendungen (**SharePoint, SQL Server**) **erwarten** ein AD. Bringt die Firma solche Anwendungen nach AWS, gibt es zwei mühsame Wege: das Keller-AD mühsam verbinden oder eigene Domain Controller auf EC2 betreiben.

**Managed Microsoft AD** ist ein von AWS betriebenes, **echtes** Microsoft Active Directory in der Cloud — kein Nachbau:
- **Volle AD-Kompatibilität:** AD-abhängige Apps funktionieren direkt.
- **Verwaltet:** AWS übernimmt Betrieb, Patches, Hochverfügbarkeit, Backups.
- **Trust zum eigenen AD:** Vertrauensstellung zum On-Premises-AD → Mitarbeiter nutzen gewohnte Firmen-Logins (Hybrid).

**Die Abgrenzungen (wichtig!):** **Managed AD** = das Verzeichnis selbst (Windows-Welt, für AD-Apps). **IAM Identity Center** = SSO für AWS-Konten (kann sich mit AD verbinden). **IAM** = Rechte in einem Konto. **Cognito** = App-Endkunden. **Merksatz:** Managed AD = das klassische Windows-Firmenverzeichnis; Identity Center = der SSO-Türsteher zu AWS.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Active Directory", „AD-abhängige Anwendungen (SharePoint, SQL Server)", „Trust zum on-premises AD" → **Managed Microsoft AD**.
- Es gibt auch **AD Connector** (leitet nur zum eigenen AD weiter) und **Simple AD** (kleiner, einfacher) — Managed Microsoft AD ist die vollwertige Variante.

---

## AWS Organizations

**Metapher / Konzept**

> Das Familienoberhaupt, das alle AWS-Konten der Firma regiert.

**Das Problem & Die Lösung**

Ein verbreiteter Irrtum: Volkswagen hat *ein* großes AWS-Konto. In Wahrheit ist es Best Practice, **viele getrennte Konten** zu haben: pro Team, für Dev, für Prod, für Buchhaltung — **Isolation** (wird das Test-Konto gehackt, ist die Produktion nicht betroffen). Aber: 200 Konten = 200 Rechnungen, 200-mal Sicherheitsregeln, kein Überblick.

**Organizations** fasst alle Konten unter einem zentralen **Management-Konto** zusammen, gruppiert in **Organizational Units (OUs)** („OU: Entwicklung", „OU: Produktion"). Die **drei Superkräfte**:
- **Consolidated Billing:** **eine** Sammelrechnung statt 200. Genialer Nebeneffekt: Die Nutzung aller Konten wird **zusammengezählt für Mengenrabatte** — 50 Konten erreichen gemeinsam Rabatt-Schwellen, die einzeln unerreichbar wären. Auch **Reserved Instances und Savings Plans** werden kontoübergreifend geteilt.
- **Service Control Policies (SCPs) — die Hausregeln:** Regeln für ganze OUs, die **niemand in den Unterkonten umgehen kann — nicht einmal deren Root-User!** Beispiel: „In OU ‚Entwicklung' keine Ressourcen außerhalb Frankfurts" oder „Niemand darf CloudTrail deaktivieren."
- **Zentrale Verwaltung:** Konten per Knopfdruck erstellen; GuardDuty/CloudTrail zentral für alle aktivieren.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „mehrere AWS-Konten zentral verwalten", „Consolidated Billing", „eine Rechnung", „Mengenrabatte über Konten" → **Organizations**.
- **Die wichtigste Feinheit — SCPs vs. IAM:** Eine SCP **gibt niemals Rechte**, sie setzt nur die **maximale Grenze** (Guardrail). Die tatsächlichen Rechte vergibt IAM im Konto. **Merksatz: SCP = der Zaun ums Grundstück, IAM = der Schlüssel zu den Zimmern.** Selbst wenn IAM etwas erlaubt — verbietet die SCP es, geht es nicht.
- **SCPs gelten sogar für den Root-User der Mitgliedskonten** — beliebter Prüfungs-Trick.

---

## AWS Organizations Details & Account Factory

**Metapher / Konzept**

> Das Unternehmensverzeichnis für AWS-Konten — mit zentraler Verwaltung, Leitplanken und automatischer Konten-Fabrik.

**Die Details (deine Karte, wortgetreu):**

- **Management Account** (früher „Master Account"): das oberste Konto, das die Organisation erstellt und verwaltet. Bekommt die Sammelrechnung, setzt SCPs. **Best Practice: Im Management Account keine produktiven Workloads** — nur Verwaltung (Sicherheit!).
- **OUs:** Ordner für Konten („Prod", „Dev", „Sandbox"). SCPs auf OUs gelten für alle Konten darin.
- **SCPs:** die Leitplanken — definieren das **maximal Erlaubte**. Geben nie Rechte, begrenzen nur. Gelten sogar für Root-User der Mitgliedskonten.
- **Account Factory:** Teil von **Control Tower** (Karte 50) — erstellt neue Konten **automatisch nach vordefinierten Standards** (Guardrails, Netzwerk, Sicherheit bereits eingerichtet). Kein Konto wird „vergessen" abzusichern.

**⚠️ Prüfungs-Knackpunkte**
- Zentrale Verwaltung, Sammelrechnung, Mengenrabatte → **Organizations**.
- Maximale Berechtigungen erzwingen (auch gegen Root) → **SCPs**.
- Neue Konten automatisch nach Standard → **Account Factory** (Control Tower).
- SCP = der Zaun (max. möglich), IAM = der Schlüssel (tatsächliche Rechte).

---

## AWS Control Tower

**Metapher / Konzept**

> Der Flughafen-Tower, der eine ganze Multi-Account-Landschaft nach Vorschrift aufbaut und überwacht.

**Das Problem & Die Lösung**

Organizations gibt dir **Werkzeuge** — aber keinen **Bauplan**. Eine saubere Multi-Account-Umgebung von Null aufzubauen (Welche OU-Struktur? Welche Logging-/Audit-Konten? Welche Regeln überall?) erfordert monatelange Expertenarbeit.

**Control Tower** setzt auf Organizations auf und **automatisiert das Ganze** — per Knopfdruck entsteht eine **Landing Zone**: eine komplette, nach AWS-Best-Practices vorkonfigurierte Multi-Account-Umgebung (Management-Konto, zentrales Log-Archiv, Audit-Konto, sinnvolle OUs). Die Kernkonzepte:
- **Landing Zone:** die schlüsselfertige „Wohnsiedlung" für alle Konten.
- **Guardrails (Leitplanken):** vorgefertigte Regeln per Klick. **Präventive** Guardrails verhindern Verstöße (technisch: **SCPs**), **detektive** entdecken sie (technisch: **Config Rules**). Beispiel: „Verbiete S3-Buckets ohne Verschlüsselung."
- **Account Factory:** neue Konten per Knopfdruck — automatisch mit allen Guardrails.
- **Dashboard:** der Tower-Blick von oben — welche Konten verstoßen gegen welche Regeln?

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Multi-Account-Umgebung einrichten", „Landing Zone", „Guardrails", „neue Konten automatisch nach Best Practices" → **Control Tower**.
- **Die Abgrenzung zu Organizations (Lieblingsfrage!):** Organizations = das Fundament/Werkzeug. Control Tower = die Automatisierungsschicht obendrauf. **Merksatz: Organizations ist der Baukasten, Control Tower ist der Architekt, der damit baut.**
- „Einfachster Weg, eine neue, sichere Multi-Account-Umgebung aufzusetzen" → **Control Tower**.

---

## AWS Resource Access Manager (RAM)

**Metapher / Konzept**

> Der Verleih-Dienst, mit dem ein AWS-Konto seine Ressourcen mit anderen Konten teilt — ohne sie zu kopieren.

**Das Problem & Die Lösung**

Die zentrale IT hat eine sorgfältig konfigurierte VPC gebaut — aber jedes der 20 Team-Konten bräuchte auch Netzwerk-Infrastruktur. 20-mal dieselbe Arbeit, 20 Konfigurationen pflegen? Redundant, fehleranfällig, teuer.

Mit **RAM** teilt ein Konto Ressourcen **sicher mit anderen Konten** — die Ressource bleibt **eine einzige**, sie wird nicht dupliziert:
- **VPC-Subnetze:** die zentrale IT baut das Netzwerk, mehrere Team-Konten arbeiten darin (**VPC Sharing**).
- **Transit Gateway, Route 53 Resolver Rules, License-Manager-Konfigurationen** u. a.
- **Sicher & granular:** gezielt mit bestimmten Konten oder ganzen OUs/der Organisation teilen — zentrale Kontrolle bleibt.

**Praxis:** Das Netzwerk-Team teilt die Subnetze per RAM mit allen Entwickler-Konten. Teams starten ihre EC2 einfach in den geteilten Subnetzen — niemand baut eine eigene VPC, das Netzwerk-Team behält die Kontrolle.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Ressourcen über Konten hinweg teilen", „VPC/Subnetze teilen", „ohne Duplizieren" → **RAM**.
- **Abgrenzung:** RAM teilt **Ressourcen**. Organizations verwaltet die **Konten**. Identity Center = **Login** über Konten. Drei verschiedene Dinge!
- Nicht mit Hardware-RAM (Arbeitsspeicher) verwechseln.

---

## AWS KMS (Key Management Service)

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Der **hochsichere Tresor für kryptografische Schlüssel** — KMS speichert und verwaltet die Schlüssel, mit denen du deine Daten in AWS verschlüsselst.

- **Customer Managed vs. AWS Managed:** Du kannst AWS die Schlüssel generieren lassen **oder eigenes Schlüsselmaterial hochladen**.
- **Auditierbarkeit:** **Jeder** Schlüssel-Aufruf (wer, wann, welcher Schlüssel) wird lückenlos in **CloudTrail** protokolliert — essenziell für Compliance-Audits.

**Praxis — Envelope Encryption:** KMS verschlüsselt nicht deine 5-TB-Datenbank direkt (viel zu langsam). Stattdessen **Umschlagverschlüsselung**: Der **Master Key** bleibt immer hochsicher in KMS eingesperrt. Er generiert einen kleinen **Data Key**, der deine Terabytes verschlüsselt. Danach wird der Data Key **selbst vom Master Key verschlüsselt** und neben den Daten abgelegt. Partner wie **HashiCorp (Vault)** oder **CyberArk** integrieren sich tief in KMS für Multi-Cloud-Schlüsselverwaltung.

🛑 **Pro-Tipp SAA:** Für **Customer Managed Keys** lässt sich **automatische jährliche Schlüsselrotation** aktivieren. Und die Verbindung merken: **SSE-KMS in S3** (Kapitel 3) nutzt genau diese KMS-Schlüssel — inklusive CloudTrail-Audit jeder Nutzung.

---

## AWS CloudHSM

**Metapher / Konzept**

> Der unantastbare physische Hardware-Tresor, den nur du allein besitzt und kontrollierst — für die strengsten Sicherheitsanforderungen.

**Das Problem & Die Lösung**

KMS ist hervorragend — aber ein **geteilter Dienst (multi-tenant)**: AWS verwaltet die Hardware, die (logisch getrennt) mit anderen Kunden geteilt wird. Für 95 % aller Fälle völlig okay. Aber Banken, Behörden, Militär haben teils Vorschriften, die verlangen: Schlüssel in **dedizierter, physisch alleiniger Hardware**, auf die **ausschließlich der Kunde** — nicht einmal AWS — Zugriff hat.

**CloudHSM** stellt ein **dediziertes, physisches Hardware-Sicherheitsmodul (HSM)** bereit — manipulationssicher, **nur dir gehörend (single-tenant)**:
- **Single-Tenant:** die Hardware gehört dir allein.
- **Volle Alleinkontrolle:** **AWS hat keinerlei Zugriff** auf die Schlüssel. Kehrseite: Verlierst du den Zugang, kann auch AWS nicht helfen.
- **Höchste Compliance:** erfüllt strengste Standards (z. B. **FIPS 140-2 Level 3**).

**Die ewige Prüfungsfrage — KMS vs. CloudHSM:** **KMS** = geteilt, AWS hilft, einfach, tief integriert — der Standard. **CloudHSM** = dedizierte eigene Hardware, Alleinkontrolle, strengste Compliance. **Merksatz: KMS = der Tresor in der Gemeinschafts-Bank (sicher & bequem). CloudHSM = dein eigener Tresor im eigenen Keller, zu dem nur du den Schlüssel hast.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „dedizierte Hardware", „single-tenant", „alleinige Kontrolle über Schlüssel", „AWS soll keinen Zugriff haben", „FIPS 140-2 Level 3" → **CloudHSM**.
- **Schlüsselsatz:** Bei CloudHSM hat AWS **keinen Zugriff** auf deine Schlüssel — bei KMS verwaltet AWS die Infrastruktur mit.

> **🧠 Mini-Merkkasten dieser vier (wortgetreu):** **Identität:** IAM (1 Konto) ↔ IAM Identity Center (SSO, viele Konten) ↔ Cognito (App-Kunden) · **Schlüssel:** KMS (geteilt, Standard) ↔ CloudHSM (dediziert, Alleinkontrolle) · **Firewalls:** Security Group (Instanz) ↔ Network Firewall (ganze VPC) ↔ WAF (Web-App, SQLi/XSS) ↔ Shield (DDoS) · **Verbindung:** VPN (über Internet) ↔ Direct Connect (eigene Leitung).

---

## AWS Secrets Manager

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Der **sichere Passwortmanager für Anwendungen** — für Datenbank-Passwörter, API-Schlüssel, Lizenzcodes, damit sie **niemals im Quellcode (Hardcoding)** stehen.

- **Automatische Rotation:** **das absolute Signalwort!** Passwörter werden nach Zeitplan (z. B. alle 30 Tage) **vollautomatisch geändert**.
- **Der Unterschied zum Parameter Store:** AWS Systems Manager **Parameter Store** speichert ebenfalls Konfigurationen/Passwörter und ist **kostenlos**. Fragt die Prüfung aber explizit nach **„automatischer Rotation von Zugangsdaten"** → einzig richtige Antwort: **Secrets Manager**.

**Praxis:** Früher stand das DB-Passwort im App-Code — bei jedem Mitarbeiter-Abgang manuell in DB *und* Code ändern. Mit Secrets Manager ruft die App das Passwort **bei jedem Start live via API** ab. Im Hintergrund ändert eine kleine **Lambda-Funktion** alle 30 Tage das Passwort direkt in der RDS und speichert den neuen Wert — die App holt sich beim nächsten Start einfach das neue, **ohne dass ein Mensch eingreift**.

---

## AWS Certificate Manager (ACM)

**Metapher / Konzept**

> Das Bürgeramt für kostenlose HTTPS-Ausweise.

**Das Problem & Die Lösung**

Jede seriöse Website braucht **HTTPS** — das Schloss-Symbol. Dahinter: ein **SSL/TLS-Zertifikat** (digitaler Ausweis + Verschlüsselung). Ohne HTTPS warnt der Browser „Nicht sicher", Google straft im Ranking ab. Früher: Zertifikat kaufen (50–500 €/Jahr), umständlich installieren — und das Schlimmste: **Zertifikate laufen ab**. Wer das Datum verschläft, zeigt allen Besuchern eine rote Sicherheitswarnung (ist den größten Firmen der Welt passiert).

**ACM:** öffentliche SSL/TLS-Zertifikate **komplett kostenlos** per Mausklick — Domain angeben, Besitz bestätigen (DNS/E-Mail), Minuten später fertig. **Das Killer-Feature: Auto-Renewal** — ACM verlängert vollautomatisch, bevor sie ablaufen. Das Albtraum-Szenario „abgelaufenes Zertifikat" ist für immer Geschichte.

**Praxis:** Zertifikate direkt andocken an **ELB (ALB), CloudFront, API Gateway**. **Wichtige Einschränkung:** Ein ACM-Zertifikat kann **nicht heruntergeladen** und außerhalb von AWS installiert werden — es lebt nur im AWS-Ökosystem.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „SSL/TLS-Zertifikate", „HTTPS", „Verschlüsselung in transit für die Website" → **ACM**.
- Die zwei Gratis-Argumente: **kostenlos** (öffentliche Zertifikate) und **automatische Erneuerung**.
- **Abgrenzung: KMS = at rest (gespeichert), ACM = in transit (unterwegs, HTTPS).**

---

## AWS Shield

**Das Konzept (deine Karte, wortgetreu):**

**Was es ist:** Der **DDoS-Schutzschild** (Distributed Denial of Service). Ein DDoS-Angriff versucht, deine Website in die Knie zu zwingen, indem er sie mit **Millionen sinnloser Anfragen** bombardiert, bis die Server überlasten. Shield fängt diesen Müll-Traffic ab.

**Der Prüfungs-Fokus:** In der Prüfung musst du exakt den Unterschied zwischen den beiden Shield-Varianten kennen: *(🛑 die Vergleichstabelle war im Original eingebettet und ist als Text nicht extrahierbar — faktengeprüft rekonstruiert:)*

| | **Shield Standard** | **Shield Advanced** |
|---|---|---|
| Kosten | **kostenlos** | **~3.000 $/Monat** (1 Jahr Bindung) |
| Aktivierung | **automatisch für alle AWS-Kunden** | explizit buchen |
| Schutz | gängige **Layer-3/4**-Angriffe (SYN-Floods, UDP-Reflection) | erweitert, auch **Layer 7** (mit WAF), für EC2, ELB, CloudFront, Global Accelerator, Route 53 |
| Extras | — | **24/7 Shield Response Team (SRT)**, detaillierte Angriffs-Diagnostik, **DDoS-Kostenschutz** (keine Skalierungs-Kosten durch den Angriff) |

**Prüfungs-Tipp (wortgetreu):** Shield Advanced arbeitet auf **Layer 7 extrem eng mit der AWS WAF** zusammen, um bösartige Anfragen herauszufiltern, die wie normaler Nutzer-Traffic aussehen.

**Praxis (wortgetreu):** Shield Standard ist **unsichtbar** — es analysiert an den globalen Edge-Standorten den Verkehr. Feuert jemand einen massiven **SYN-Flood** auf deine IP, erkennt Shield die unnatürlichen Pakete und **verwirft sie schon am Rand des AWS-Netzwerks**, bevor sie in die Nähe deiner Server kommen. Bei großen E-Commerce-/Finanz-Partnern ist **Shield Advanced** im Einsatz, damit bei einem komplexen Angriff **sofort AWS-Sicherheitsexperten live eingreifen**.

---

## AWS WAF (Web Application Firewall)

**Metapher / Konzept**

> Der intelligente Türsteher, der jedem Gast in die Tasche schaut.

**Das Problem & Die Lösung**

Shield schützt vor der **brutalen Masse** (DDoS). Aber es gibt eine hinterlistigere Sorte: Ein einzelner Hacker schickt eine **harmlos aussehende Anfrage** — mit bösartigem Code im Suchfeld oder der URL. Die zwei Klassiker:
- **SQL Injection:** statt eines Namens ein **Datenbank-Befehl** im Login-Formular — schlampig programmierte Apps führen ihn aus und spucken z. B. alle Kundenpasswörter aus.
- **Cross-Site Scripting (XSS):** schädlicher JavaScript-Code wird eingeschmuggelt und **im Browser deiner Besucher** ausgeführt.

Gegen so etwas ist Shield machtlos — es ist kein Massen-Bombardement, sondern eine einzelne, „intelligente" Anfrage.

**Die WAF** sitzt vor der Webanwendung (**Layer 7**) und **inspiziert den Inhalt jeder HTTP-Anfrage**. Du definierst **Web ACLs**:
- Blocke alles, was nach **SQL Injection oder XSS** aussieht (fertige **Managed Rules** von AWS — Rad nicht neu erfinden).
- **Geo-Blocking** (Anfragen aus bestimmten Ländern).
- Bestimmte **IP-Adressen** blocken.
- **Rate Limiting:** mehr als 1.000 Anfragen/Minute von einer IP → gesperrt.

**Praxis:** Die WAF wird an bestimmte Dienste **angedockt**: **CloudFront, ALB oder API Gateway**. Traffic fließt erst durch die WAF-Prüfung, dann zur Anwendung.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „SQL Injection", „XSS", „Layer 7", „HTTP-Anfragen filtern" → **WAF**.
- **Die wichtigste Abgrenzung überhaupt: Shield = DDoS (stumpfe Masse), WAF = SQLi/XSS (gezielte, inhaltliche Angriffe).** Kommt in fast jeder Prüfung dran.
- Schutz einer Website/Web-App vor bösartigen Anfragen → **WAF**.

---

## AWS Firewall Manager

**Metapher / Konzept**

> Der zentrale Regel-Verteiler, der Firewall-Regeln einmal festlegt und automatisch über alle Konten und Ressourcen der ganzen Organisation durchsetzt.

**Das Problem & Die Lösung**

Viele Konten (Organizations!) — und die Firma will zentral durchsetzen: „Auf **jeder** Webanwendung in **allen** Konten muss eine WAF mit SQL-Injection-Schutz laufen." Das in jedem Konto manuell einzurichten wäre ein Albtraum — garantiert vergisst jemand ein Konto, oder eine neue App geht **ohne Schutz** live.

**Firewall Manager** verwaltet Firewall-Regeln **zentral über viele Konten** (mit Organizations). Eine **Security Policy** einmal definieren → automatisch überall ausgerollt, **auch auf neue Ressourcen**. Er orchestriert:
- **AWS WAF:** Regeln zentral auf alle ALBs, CloudFront-Verteilungen, API Gateways.
- **Shield Advanced:** DDoS-Schutz organisationsweit.
- **Network Firewall und Security Groups:** zentrale Verwaltung und Konformitätsprüfung.
- **Automatische Abdeckung:** neue Konten/Ressourcen werden automatisch erfasst.

**Die entscheidende Abgrenzung:** Firewall Manager ist **kein neuer Firewall-Typ**, sondern der zentrale **Verwalter** der bestehenden. **Merksatz: WAF und Network Firewall sind die einzelnen Wächter. Firewall Manager ist der Chef, der dieselben Regeln allen Wächtern in allen Konten gleichzeitig erteilt.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „zentral verwalten" + „Firewall/WAF-Regeln", „über mehrere Konten/die Organisation", „automatisch auf neue Ressourcen" → **Firewall Manager**.
- Einzelne Web-App → WAF. Eine VPC → Network Firewall. Zentral über viele Konten → **Firewall Manager**.
- **Setzt Organizations voraus** — die Verbindung merken.

> **🧠 Mini-Merkkasten dieser vier (wortgetreu):** **Caching:** DAX (nur DynamoDB) ↔ ElastiCache (allgemein) · **Compliance:** Audit Manager (dein Audit vorbereiten) ↔ Artifact (AWS' eigene Zertifikate) ↔ Config (Konfigurationsregeln) ↔ Security Hub (Security-Findings) · **VPN:** Client VPN (einzelne Nutzer) ↔ Site-to-Site VPN (ganzes Netzwerk) ↔ Direct Connect (dedizierte Leitung) · **Firewalls:** WAF (Web-App) ↔ Network Firewall (VPC) ↔ Firewall Manager (zentrale Verwaltung) ↔ Security Group (Instanz) ↔ Shield (DDoS).

---

## Amazon GuardDuty

**Metapher / Konzept**

> Der KI-Detektiv, der nachts durch dein Konto patrouilliert.

**Das Problem & Die Lösung**

Die bittere Wahrheit: Die meisten Firmen merken einen Hackerangriff erst **nach Wochen oder Monaten**. Vielleicht wurden Access Keys gestohlen und jemand schürft seit drei Monaten heimlich **Bitcoin auf deinen EC2-Servern**. Oder ein Server redet nachts um 3 mit einem bekannten Hacker-Server. Welcher Mensch soll **Millionen Log-Einträge pro Tag** durchlesen? Keiner.

**GuardDuty** ist intelligente **Bedrohungserkennung (Threat Detection)** — **ein Klick**, keine Software, keine Agenten. Ab dann liest es rund um die Uhr **drei Datenquellen**:
- **CloudTrail-Logs:** Wer hat was im Konto gemacht?
- **VPC Flow Logs:** Welcher Netzwerk-Traffic fließt wohin?
- **DNS-Logs:** Welche Adressen werden aufgerufen?

Mit **Machine Learning** lernt GuardDuty, was „normal" ist — und schlägt bei Anomalien Alarm (**Findings**): „EC2 kommuniziert mit Krypto-Mining-Server", „Login aus ungewöhnlichem Land", „ungewöhnlich viele API-Aufrufe".

**Praxis:** GuardDuty **erkennt nur — es repariert nicht**. Aber elegant kombiniert: Ein Finding löst über **EventBridge eine Lambda** aus, die die kompromittierte Instanz automatisch vom Netz isoliert → automatische Verteidigung.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Threat Detection", „Machine Learning", „bösartige Aktivität erkennen", „kompromittierte Konten/Instanzen" → **GuardDuty**.
- **Abgrenzung zu Inspector:** GuardDuty sucht **aktive Bedrohungen** (Verhalten). Inspector sucht **Schwachstellen** (vorher). **Merksatz: Inspector = „Wo bin ich verwundbar?", GuardDuty = „Werde ich gerade angegriffen?"**
- GuardDuty braucht **keine Agenten** — das betont AWS gerne.

---

## Amazon Inspector

**Metapher / Konzept**

> Der Sicherheits-TÜV, der deine Server und Container auf bekannte Schwachstellen abklopft, bevor ein Angreifer sie findet.

**Das Problem & Die Lösung**

Auf deinen Servern läuft viel Software — und ständig werden **Sicherheitslücken (CVEs)** öffentlich bekannt. Läuft auf einem deiner 200 Server eine veraltete Bibliothek mit gefährlicher Lücke? Fehlt ein Patch? Ist ein Port offen? Manuell unprüfbar — und **genau diese bekannten Lücken sind das Einfallstor Nummer eins**.

**Inspector** scannt **automatisch und kontinuierlich** auf bekannte Lücken und Fehlkonfigurationen:
- **EC2-Instanzen:** veraltete Software mit CVEs, fehlende Patches.
- **Container-Images in ECR:** Lücken **schon vor dem Ausrollen**.
- **Lambda-Funktionen:** Schwachstellen in Code und Abhängigkeiten.

Jeder Fund bekommt eine **Risiko-Bewertung** — die gefährlichsten zuerst beheben.

**Die Killer-Unterscheidung Inspector vs. GuardDuty (kommt in beiden Prüfungen):** **Inspector** = Schwachstellen, **vorbeugend**, schaut in die **Software**. **GuardDuty** = aktive Bedrohungen, **während es passiert**, schaut auf **Verhalten/Logs**. **Merksatz: Inspector = der TÜV prüft das Auto auf Mängel (vorher). GuardDuty = die Alarmanlage meldet den Einbrecher (währenddessen).**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Vulnerabilities", „EC2/Container/Lambda scannen", „CVEs", „fehlende Patches" → **Inspector**.
- Die drei Ziele merken: **EC2, ECR-Container, Lambda**.

---

## Amazon Macie

**Metapher / Konzept**

> Der Datenschutz-Detektiv, der deine S3-Buckets durchwühlt und Alarm schlägt, wenn dort sensible Daten ungeschützt herumliegen.

**Das Problem & Die Lösung**

Hunderte S3-Buckets, Millionen Dateien — und irgendwo darin: **Kreditkartennummern** in einem alten CSV-Export, **Kundendaten** in einem Log, **Passnummern** in einem vergessenen Backup. Keiner weiß, wo. Liegt ein Bucket mit Klarnamen sogar **öffentlich** im Netz? Bei **DSGVO/GDPR** drohen Millionenstrafen — aber Millionen Dateien von Hand durchsuchen ist unmöglich.

**Macie** durchsucht mit **Machine Learning** gezielt **S3** und findet/klassifiziert sensible Daten:
- **PII** (Namen, Adressen, Geburtsdaten), **Finanzdaten** (Kreditkarten, Bankverbindungen), **Zugangsdaten/Geheimnisse**.
- Meldet: „In diesem Bucket liegen 5.000 Kreditkartennummern — **und der Bucket ist öffentlich**!" Überwacht zudem die Bucket-Sicherheitseinstellungen.

**Praxis:** DSGVO-Audit → Macie liefert den Bericht, welche Buckets personenbezogene Daten enthalten und welche unsicher konfiguriert sind. Ein Finding kann über **EventBridge automatisch eine Lambda** auslösen, die den Bucket sofort privat setzt.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „sensible Daten / PII", „S3", „personenbezogene Daten finden", „DSGVO/GDPR", „Kreditkartennummern entdecken" → **Macie**.
- **Macie = ausschließlich S3 + sensible Daten.** Geht es um Daten-**Inhalte** in S3 → Macie, kein anderer Dienst.
- **Eselsbrücke:** Macie schaut **in die Dateien hinein** und fragt „Stehen hier Geheimnisse drin?"

---

## AWS Security Hub

**Metapher / Konzept**

> Die zentrale Sicherheits-Leitstelle, die alle Alarme aus allen Security-Diensten auf einem einzigen Bildschirm bündelt.

**Das Problem & Die Lösung**

Du hast eine Armee von Sicherheitsdiensten: GuardDuty, Inspector, Macie, Config — aber **jeder hat sein eigenes Dashboard**. Das Team müsste fünf Konsolen im Auge behalten; wichtige Alarme gehen unter. Es fehlt der Gesamtüberblick: „Wie sicher ist meine Umgebung — **auf einen Blick**?"

**Security Hub** sammelt und bündelt die **Findings aller anderen Sicherheitsdienste** zentral — der **Aggregator**:
- **Zentrale Sammelstelle:** GuardDuty, Inspector, Macie & Co. schicken ihre Findings hierher — **ein Dashboard für alles**.
- **Automatische Compliance-Checks** gegen Standards (**CIS AWS Foundations Benchmark, AWS Best Practices, PCI DSS**) mit **Security Score**.
- **Priorisierung:** vereinheitlicht und sortiert — das Kritischste zuerst.
- **Multi-Account:** die Sicherheitslage der **ganzen Organisation** zentral.

**Praxis:** Das Security-Team öffnet morgens **nur den Security Hub**: GuardDuty 2 Bedrohungen, Inspector 15 kritische Lücken, Macie 1 offener PII-Bucket, Compliance-Score 87 %. Alles auf einem Schirm.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „zentraler Sicherheitsüberblick", „Findings aggregieren", „Compliance-Standards (CIS, PCI DSS)", „Security Score", „über mehrere Konten" → **Security Hub**.
- **Die Kern-Abgrenzung:** Security Hub **erzeugt die Funde nicht selbst** — er sammelt die von GuardDuty, Inspector, Macie ein. **Merksatz: Die anderen finden, Security Hub sammelt ein.**
- **Eselsbrücke:** Hub = Knotenpunkt → alle Sicherheitsmeldungen laufen hier zusammen.

🛑 **Aktualität (verifiziert, wichtig fürs Console-Wiedererkennen):** AWS hat das Produkt **umbenannt und aufgeteilt**: Der klassische Dienst, den deine Karte beschreibt (Aggregation + CIS/PCI-Checks + Score), heißt seit 2025 **„Security Hub CSPM"** (Cloud Security Posture Management). Der Name **„Security Hub"** bezeichnet jetzt einen **neuen, erweiterten Dienst** (GA Ende 2025), der GuardDuty, Inspector, Macie und Security Hub CSPM korreliert (Exposure-Findings, Attack-Path-Visualisierung, OCSF-Schema). **Für die Prüfungen bleibt die Antwort auf „zentrale Security-Findings aggregieren" → Security Hub** — aber wundere dich in der Konsole nicht über die zwei Namen.

---

## Amazon Detective

**Metapher / Konzept**

> Der Ermittler, der nach einem Alarm das Warum und Wie rekonstruiert — die Spurensuche, die nach der Entdeckung beginnt.

**Das Problem & Die Lösung**

GuardDuty meldet: „Diese EC2 kommuniziert mit einem Schad-Server." Okay — aber jetzt beginnen die eigentlichen Fragen: **Wie kam der Angreifer rein? Wann fing das an? Was hat er schon berührt? Welche Konten sind betroffen?** Dafür müsstest du dich durch riesige Mengen CloudTrail-/Flow-Logs wühlen — **tagelange forensische Detektivarbeit unter Zeitdruck**.

**Detective** untersucht Sicherheitsvorfälle und findet die **Ursache (Root Cause Analysis)**: Es sammelt automatisch die relevanten Logs (CloudTrail, VPC Flow Logs, GuardDuty-Findings) und baut mit ML **visuelle Zusammenhangs-Grafiken (Behavior Graphs)**:
- **Verbindet die Punkte:** wie Ressourcen, IPs, Konten zusammenhängen und sich über die Zeit verhalten haben.
- **Zeitliche Analyse:** „Das ungewöhnliche Verhalten begann Dienstag um 3 Uhr, ausgehend von diesem Account."
- **Beschleunigt die Forensik:** Was manuell Tage dauert, liefert Detective in Minuten.

**Die Trio-Logik eines Vorfalls (Lieblings-SAA-Stoff):** **GuardDuty** entdeckt → schlägt Alarm. **Detective** ermittelt danach → Ursache und Ausmaß. **Merksatz: GuardDuty ist die Alarmanlage (es piept). Detective ist der Kriminalkommissar, der danach den Tathergang rekonstruiert.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Ursache untersuchen / Root Cause", „Sicherheitsvorfall analysieren", „forensische Analyse", „nachträglich verstehen" → **Detective**.
- „Erkennen" → GuardDuty, „verstehen/ermitteln" → **Detective**.
- Detective **analysiert, es behebt nichts** — reiner Ermittlungsdienst.

> **🧠 Der ultimative Sicherheits-Merkkasten: „Wer macht was?" (wortgetreu)** — DIE Verwechslungsgruppe beider Prüfungen. **Selbsttest zur Kontrolle:**
> - „Liegen Kreditkartennummern offen in S3?" → **Macie**
> - „Läuft auf meinen EC2 veraltete Software mit Lücken?" → **Inspector**
> - „Meine Instanz schürft plötzlich Krypto — Alarm!" → **GuardDuty**
> - „Alle Security-Alarme auf einem Dashboard + Compliance-Score" → **Security Hub**
> - „Wie kam der Angreifer rein und was hat er angefasst?" → **Detective**

---

## AWS Audit Manager

**Metapher / Konzept**

> Der automatische Compliance-Buchhalter, der laufend Nachweise für Audits sammelt und prüfungsfertige Berichte erstellt.

**Das Problem & Die Lösung**

Firmen müssen regelmäßig **Compliance-Audits** bestehen (DSGVO/GDPR, PCI DSS, HIPAA, ISO 27001, SOC 2). Vor jedem Audit beginnt die Quälerei: **manuell Beweise sammeln** — Screenshots, Logs, Einstellungen — und belegen, dass jede Anforderung erfüllt ist. Wochen Arbeit, fehleranfällig, bei jedem Audit aufs Neue.

**Audit Manager** automatisiert das **Sammeln von Nachweisen (Evidence)**:
- **Fertige Frameworks:** Vorlagen für gängige Standards (PCI DSS, GDPR, HIPAA, SOC 2...).
- **Automatische Beweissammlung:** kontinuierlich aus der AWS-Umgebung (oft aus CloudTrail, Config, Security Hub) — kein Screenshot-Sammeln mehr.
- **Prüfungsfertige Berichte** direkt für den Prüfer.

**Die Abgrenzung (wichtig — ähnlich klingende Compliance-Dienste!):**
- **Audit Manager** = sammelt Nachweise + erstellt Audit-Berichte (für Prüfer).
- **AWS Config** (Karte 47) = prüft **technische Konfigurationsregeln** und deren Historie.
- **Security Hub** = aggregiert **Security-Findings**, prüft Sicherheits-Benchmarks.
- **AWS Artifact** = das **Download-Portal für AWS' eigene Compliance-Zertifikate** (z. B. AWS' ISO-Zertifikat).
- **Merksatz: Audit Manager bereitet DEIN Audit vor. Config prüft Konfigurationsregeln. Artifact liefert AWS' eigene Zertifikate zum Download.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Audit vorbereiten", „Compliance-Nachweise sammeln", „Evidence für PCI DSS/HIPAA/GDPR/SOC 2", „Audit-Berichte" → **Audit Manager**.
- DEIN Audit → Audit Manager. AWS' Zertifikate herunterladen → **Artifact**. Konfigurations-Compliance → **Config**.

---

*Ende Kapitel 6 — Sicherheit, Identität & Compliance.*
