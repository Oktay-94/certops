---
service: AWS Control Tower
seedKey: saa-c03-script-control-tower
batch: B10
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html
  - https://docs.aws.amazon.com/controltower/latest/controlreference/controls.html
status: draft
---

# AWS Control Tower

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Control Tower ist im CLF-Kurs kaum präsent — hier die Einordnung: Control Tower **automatisiert** Aufbau und Governance einer Multi-Account-Umgebung („Landing Zone") als Best-Practice-Layer **auf Organizations**. Es orchestriert Organizations, IAM Identity Center, CloudTrail und Config, richtet **Guardrails** ein und liefert eine **Account Factory** für standardisiertes Account-Provisioning.

Der SAA vertieft: **Landing Zone, die drei Guardrail-Typen, Account Factory — und die Abgrenzung zu Organizations.**

---

## 🎯 SAA-Vertiefung

### Landing Zone: Governance per Knopfdruck

**Das Problem:** Eine Firma will eine sichere Multi-Account-Struktur (getrennte Accounts für Prod/Dev, zentrales Logging, Audit) nach AWS-Best-Practices — das alles manuell über Organizations aufzusetzen, dauert Wochen und ist fehleranfällig.

**Die Lösung:** Control Tower baut in **unter einer Stunde** eine vollständige **Landing Zone**: Es legt eine **Security OU** mit **Log Archive Account** (zentrale CloudTrail/Config-Logs) und **Audit Account** an, richtet **IAM Identity Center** für SSO ein und aktiviert Baseline-Guardrails. Man bekommt die org-weite Struktur, die man sonst mühsam von Hand konfigurieren müsste — als geführten, wiederholbaren Prozess. „automatisierte Best-Practice-Multi-Account-Umgebung/Landing Zone" → Control Tower (nicht Organizations allein, das nur die manuelle Basis liefert).

> **💡 Merksatz:** **Control Tower** baut in <1 h eine **Landing Zone** (Security OU, Log Archive + Audit Account, SSO, Baseline-Guardrails) — automatisierte Best-Practice-Governance auf Organizations.

### Die drei Guardrail-Typen

**Das Problem:** Governance muss sowohl bestimmte Aktionen **verhindern** als auch Verstöße **erkennen** — und idealerweise schon vor dem Deployment prüfen.

**Die Lösung — drei Control-Typen (prüfbar):**
- **Preventive** Controls: **blockieren** Aktionen — technisch über **SCPs**. („Region X verbieten".)
- **Detective** Controls: **erkennen** Verstöße nach der Tatsache — über **Config Rules**. („nicht verschlüsselte Volumes melden".)
- **Proactive** Controls: prüfen **vor** dem Deployment — über **CloudFormation Hooks**.

Kategorien: mandatory, strongly recommended, elective. Der Reflex: „Aktion blockieren" → preventive (SCP); „Verstoß erkennen" → detective (Config); „vor Deployment prüfen" → proactive.

> **💡 Merksatz:** **Preventive (SCP, blockiert) · Detective (Config, erkennt) · Proactive (CFN Hooks, prüft vor Deployment).** blockieren→preventive, erkennen→detective.

### Account Factory und die Organizations-Abgrenzung

**Account Factory** ist eine konfigurierbare **Account-Vorlage** (technisch ein **Service-Catalog-Produkt**), mit der neue Konten standardisiert und policy-konform provisioniert werden — statt jedes Konto manuell einzurichten. „neue Accounts standardisiert bereitstellen" → Account Factory.

Die **Organizations-Abgrenzung**: **Organizations** ist die **manuelle Basis** (OUs, SCPs, Consolidated Billing) — man baut die Governance selbst. **Control Tower** ist die **automatisierte Best-Practice-Schicht darauf** (Landing Zone, Guardrails, Account Factory). Reflex: „selbst OUs/SCPs verwalten" → Organizations; „automatisierte, geführte Best-Practice-Umgebung" → Control Tower. Control Tower selbst ist kostenlos — man zahlt die zugrundeliegenden Dienste (v. a. Config).

> **💡 Merksatz:** **Account Factory** (Service-Catalog-Produkt) provisioniert Accounts standardisiert. **Organizations = manuelle Basis; Control Tower = automatisierte Best-Practice-Schicht darauf.**

---

## ⚠️ Prüfungs-Knackpunkte

- **Landing Zone** in <1 h: Security OU, Log Archive + Audit Account, IAM Identity Center, Baseline-Guardrails.
- Guardrails: **Preventive (SCP)** · **Detective (Config Rules)** · **Proactive (CFN Hooks)**.
- **Account Factory** = standardisiertes Account-Provisioning (Service-Catalog-Produkt).
- **Organizations (manuelle Basis) vs. Control Tower (automatisierte Best-Practice-Schicht)**.
- Control Tower gratis; man zahlt die darunterliegenden Dienste (v. a. Config).

## 💡 Der eine Satz zum Mitnehmen

**Control Tower automatisiert eine Best-Practice-Multi-Account-Umgebung auf Organizations — eine Landing Zone mit Log-Archive- und Audit-Account entsteht in unter einer Stunde, Guardrails sind preventive (SCP), detective (Config) oder proactive (CFN Hooks), und die Account Factory provisioniert neue Konten standardisiert.**
