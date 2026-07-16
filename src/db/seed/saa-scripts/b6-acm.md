---
service: AWS Certificate Manager (ACM)
seedKey: saa-c03-script-acm
batch: B6
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/acm/latest/userguide/acm-overview.html
  - https://docs.aws.amazon.com/acm/latest/userguide/managed-renewal.html
  - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html
status: draft
---

# AWS Certificate Manager (ACM)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> ACM = das **Bürgeramt für kostenlose HTTPS-Ausweise**: öffentliche SSL/TLS-Zertifikate gratis per Mausklick, mit dem Killer-Feature **Auto-Renewal** — kein abgelaufenes Zertifikat mehr. Andocken an **ELB, CloudFront, API Gateway**. Wichtige Grenze: ein ACM-Zertifikat kann **nicht heruntergeladen** und außerhalb AWS installiert werden. Abgrenzung: **KMS = at rest, ACM = in transit**.

Der SAA vertieft: **die Auto-Renewal-Bedingung, die EC2-Grenze, die us-east-1-Falle und ACM Private CA.**

---

## 🎯 SAA-Vertiefung

### Auto-Renewal — aber nur unter einer Bedingung

**Das Problem:** Ein Team verlässt sich auf ACMs automatische Erneuerung — trotzdem läuft ein Zertifikat ab und die Website zeigt die rote Warnung. Wie kann das sein?

**Die Lösung:** Auto-Renewal funktioniert zuverlässig, aber an zwei Bedingungen geknüpft, die geprüft werden:
- **DNS-Validierung** statt E-Mail: Nur bei DNS-validierten Zertifikaten erneuert ACM vollautomatisch (der CNAME-Eintrag muss dauerhaft bleiben). **E-Mail-validierte** Zertifikate verlangen bei **jedem** Zyklus eine manuelle Klick-Bestätigung — die perfekte Quelle für „vergessen und abgelaufen".
- **Das Zertifikat muss in Benutzung sein** (an einen AWS-Service gebunden). Ein ungenutztes Zertifikat wird nicht automatisch erneuert.

Und die dritte Falle: **Importierte** Zertifikate (von extern) haben **kein** Auto-Renewal — dafür ist der Kunde selbst verantwortlich.

> **💡 Merksatz:** Auto-Renewal nur bei **DNS-Validierung** + Zertifikat **in Benutzung**. E-Mail-Validierung = manuell pro Zyklus; **importierte** Zertifikate = keine Erneuerung.

### Die EC2-Grenze und die us-east-1-Falle

**Das Problem 1:** „TLS-Zertifikat direkt auf einer EC2-Instanz installieren" — mit einem kostenlosen öffentlichen ACM-Zertifikat. Geht nicht.

**Die Lösung 1:** ACM-**Public**-Zertifikate lassen sich **nicht exportieren** und daher **nicht direkt auf EC2** installieren — sie „leben" nur im AWS-Ökosystem (ELB, CloudFront, API Gateway). Wer TLS auf EC2 terminieren will, legt einen **ALB davor** (der trägt das ACM-Zertifikat) oder braucht ein Zertifikat aus **ACM Private CA** (das *kann* exportiert werden). „ACM-Zertifikat auf EC2" ist als Antwortoption fast immer falsch.

**Das Problem 2:** Ein CloudFront-Distribution soll ein eigenes Zertifikat nutzen — es liegt in eu-central-1 und taucht im Dropdown nicht auf.

**Die Lösung 2:** Für **CloudFront muss das Zertifikat in us-east-1** liegen (die Distribution ist global). Für einen ALB dagegen: gleiche Region wie der ALB. ACM-Zertifikate lassen sich nicht zwischen Regionen verschieben — im Zweifel in us-east-1 neu ausstellen. Einer der meistgeprüften Einzelfakten.

> **💡 Merksatz:** ACM-Public **nicht auf EC2** (nicht exportierbar → ALB davor). **CloudFront-Zertifikat muss in us-east-1** liegen; ALB-Zertifikat in der ALB-Region.

### ACM Private CA: Zertifikate für die interne Welt

**Das Problem:** Ein Unternehmen braucht **interne** Zertifikate — für Service-zu-Service-mTLS, interne Hostnamen, IoT-Geräte —, die nicht öffentlich vertrauenswürdig sein müssen, aber zentral verwaltet und ausgestellt werden sollen.

**Die Lösung:** **ACM Private CA (AWS Private CA)** ist eine **kostenpflichtige** private Certificate Authority: Man stellt eigene interne Zertifikate aus, die auf **EC2 und on-prem** installierbar sind (im Gegensatz zu ACM-Public). Das ist die Antwort auf „interne PKI / private Zertifikate zentral ausstellen" — nicht die kostenlosen öffentlichen ACM-Zertifikate (die nur für öffentlich erreichbare AWS-Endpunkte gedacht sind).

Kleiner, aber prüfbarer Zusatz: Ein **Wildcard**-Zertifikat (`*.example.com`) deckt Subdomains, **nicht** die Apex-Domain — beide gehören als SANs in denselben Request.

> **💡 Merksatz:** Interne/private Zertifikate (auch für EC2/on-prem) → **ACM Private CA** (kostet). Öffentliche AWS-Endpunkte → kostenlose **ACM-Public**-Zertifikate.

---

## ⚠️ Prüfungs-Knackpunkte

- Auto-Renewal nur bei **DNS-Validierung** + **in Benutzung**; E-Mail-Validierung = manuell; **importierte** Zertifikate = keine Erneuerung.
- ACM-**Public nicht exportierbar → nicht direkt auf EC2** (ALB davor, oder ACM Private CA).
- **CloudFront-Zertifikat muss in us-east-1**; ALB-Zertifikat in der ALB-Region; kein Region-Umzug.
- **ACM Private CA** (kostet) = interne Zertifikate, auf EC2/on-prem installierbar.
- **Wildcard** deckt Subdomains, nicht die Apex-Domain (beide als SANs).
- Abgrenzung: **ACM = TLS in transit (kostenlos, Auto-Renewal)** vs. KMS (at rest).

## 💡 Der eine Satz zum Mitnehmen

**ACM nimmt einem das Zertifikats-Management ab — solange man DNS-validiert und im AWS-Ökosystem bleibt; die drei Fallen heißen „nicht auf EC2", „CloudFront braucht us-east-1" und „interne Zertifikate → Private CA".**
