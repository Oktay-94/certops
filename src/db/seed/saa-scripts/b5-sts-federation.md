---
service: AWS STS & Federation
seedKey: saa-c03-script-sts-federation
batch: B5
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_common-scenarios_third-party.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/confused-deputy.html
  - https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_manage-assume.html
status: draft
---

# AWS STS & Federation

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> STS (Security Token Service) gibt **temporäre Zugangsdaten** aus. **AssumeRole** = eine Identität schlüpft vorübergehend in eine Rolle — der Kernmechanismus für **Cross-Account-Zugriff**, Services, die im Auftrag handeln, und **Federation** (Firmen-Login via SAML). Keine dauerhaften Schlüssel → sicherer.

Der SAA vertieft: **die AssumeRole-Mechanik samt Zeitlimits, das ExternalId-Muster gegen den Confused Deputy, Role Chaining — und die Federation-Wege.**

---

## 🎯 SAA-Vertiefung

### AssumeRole: Wer, was — und wie lange

**Das Problem:** Ein Analyse-Job in Konto B braucht für vier Stunden Lesezugriff auf Ressourcen in Konto A. Wie bekommt er ihn sicher, zeitlich begrenzt und auditierbar?

**Die Lösung:** Konto A stellt eine **Rolle** bereit. Deren **Trust Policy** legt fest, **wer** sie annehmen darf (hier: Konto B), die **Permissions Policy**, **was** sie darf (Lesen). Konto B ruft **`AssumeRole`** und erhält **temporäre Credentials** — die nach Ablauf von selbst verfallen (nichts zu widerrufen, nichts, das geleakt langfristig schadet).

Die Zeitgrenzen sind ein beliebtes Detail: Die Session dauert **15 Minuten bis 12 Stunden**, Default **1 Stunde**; das Maximum legt die Rolle fest. Für den 4-Stunden-Job stellt man die Max Session Duration entsprechend hoch — funktioniert.

Die Falle steht daneben: **Role Chaining** (mit den Credentials einer Rolle die nächste Rolle annehmen) ist **hart auf 1 Stunde begrenzt** — egal, was die Rolle sonst erlaubt. „Über mehrere Rollen hinweg 4 Stunden" geht damit *nicht*; das ist der eingebaute Distraktor.

> **💡 Merksatz:** AssumeRole: **Trust = wer, Permissions = was**, Dauer **15 min–12 h (Default 1 h)**. **Role Chaining = hart max. 1 h.**

### ExternalId: Das Gegenmittel zum Confused Deputy

**Das Problem:** Ein SaaS-Monitoring-Anbieter („MonitorCorp") braucht Lesezugriff auf die AWS-Konten *vieler* Kunden. Jeder Kunde legt eine Cross-Account-Rolle an, die MonitorCorps Konto vertraut. Das Risiko: Kunde X könnte MonitorCorp dazu bringen, mit *seinen* Rechten auf das Konto von Kunde Y zuzugreifen — MonitorCorp ist der „verwirrte Stellvertreter" (Confused Deputy), der seine Privilegien im falschen Kontext einsetzt.

**Die Lösung:** Der Kunde nimmt in die Trust Policy eine Bedingung auf **`sts:ExternalId`** auf — ein eindeutiger Wert, den **nur MonitorCorp** für dieses Kundenkonto kennt und beim `AssumeRole` mitschickt. Fehlt die ExternalId oder ist sie falsch, scheitert die Annahme. So kann kein Kunde MonitorCorp missbrauchen, um auf ein fremdes Konto zuzugreifen. Wichtig fürs Verständnis: Die ExternalId ist **kein Secret** — sie ist ein Kontext-Anker, kein Passwort.

Das ist die klassischste Federation-Frage überhaupt: „**Third-Party/SaaS braucht Cross-Account-Zugriff aufs Kundenkonto**" → **Cross-Account-Rolle mit ExternalId**. Distraktoren: IAM User mit Access Keys teilen (langlebiges Anti-Pattern), oder eine Rolle **ohne** ExternalId (lässt den Confused Deputy offen). Für den verwandten **Cross-Service**-Fall (ein AWS-Service handelt im Auftrag) nutzt man `aws:SourceArn` / `aws:SourceAccount`.

> **💡 Merksatz:** **SaaS-Zugriff aufs Kundenkonto → Cross-Account-Rolle mit `sts:ExternalId`** (gegen Confused Deputy). ExternalId ist kein Secret. Cross-Service → `aws:SourceArn`.

### Die Federation-Wege

**Das Problem:** Nutzer sollen sich **nicht** mit IAM-Credentials anmelden, sondern mit einer bestehenden Identität — mal Firmen-AD, mal Google-Login. Welcher Weg wofür?

**Die Lösung — die Zuordnung:**
- **Enterprise / Firmen-IdP (SAML 2.0):** `AssumeRoleWithSAML` — Mitarbeiter meldet sich am Firmen-IdP an, nimmt per STS eine Rolle an. In der Praxis übernimmt das heute meist **IAM Identity Center** (die komfortable Schicht darüber).
- **Web/Mobile-App-Kunden (OIDC/Web Identity):** `AssumeRoleWithWebIdentity` — aber AWS empfiehlt, das **über Cognito Identity Pools** laufen zu lassen statt direkt.
- **On-prem-Workloads ohne IAM-User:** **IAM Roles Anywhere** — Server/Container/Geräte tauschen **X.509-Zertifikate** gegen temporäre AWS-Credentials. Das ist die moderne Antwort auf „on-prem-Maschine braucht AWS-Zugriff, aber ohne langlebige Access Keys".

Reflex: „Firmen-AD/Enterprise-IdP" → **SAML** (bzw. Identity Center). „App-Endkunden/Social" → **Cognito**. „On-prem-Server ohne Access Keys" → **IAM Roles Anywhere**.

> **💡 Merksatz:** **SAML = Enterprise-Login · Cognito = App-Kunden (Web Identity) · IAM Roles Anywhere = on-prem-Maschinen via X.509** (statt langlebiger Keys).

### Temporäre Credentials widerrufen

Ein feiner, aber prüfbarer Punkt: Temporäre STS-Credentials lassen sich **nicht direkt widerrufen** (sie sind ja gerade darauf ausgelegt, von selbst abzulaufen). Muss man sie doch sofort entwerten — etwa weil ein Leak vermutet wird —, hängt man der Rolle eine Policy an, die **alle Sitzungen vor einem bestimmten Zeitpunkt** verweigert (Bedingung `aws:TokenIssueTime`; AWS liefert dafür `AWSRevokeOlderSessions`). Die naive Antwort „Credentials löschen" gibt es bei temporären Tokens nicht.

> **💡 Merksatz:** Temporäre Credentials sind nicht direkt widerrufbar → Rollen-Policy mit **`aws:TokenIssueTime`** (`AWSRevokeOlderSessions`) entwertet alle alten Sessions.

---

## ⚠️ Prüfungs-Knackpunkte

- AssumeRole: **Trust (wer) + Permissions (was)**, temporäre Credentials **15 min–12 h (Default 1 h)**.
- **Role Chaining = hart 1 h** — Distraktor bei „mehrere Stunden über mehrere Rollen".
- **Third-Party/SaaS → Cross-Account-Rolle mit `sts:ExternalId`** (Confused Deputy); ExternalId ist **kein Secret**; Cross-Service → `aws:SourceArn`/`aws:SourceAccount`.
- Anti-Pattern: **IAM User + Access Keys** für Cross-Account/Third-Party teilen.
- Federation: **SAML** (Enterprise) · **Cognito/Web Identity** (App-Kunden) · **IAM Roles Anywhere** (on-prem via X.509).
- Temporäre Credentials **nicht direkt widerrufbar** → Policy mit `aws:TokenIssueTime`.

## 💡 Der eine Satz zum Mitnehmen

**STS ist die Maschine hinter „temporär statt dauerhaft": AssumeRole für Cross-Account (mit ExternalId, sobald ein Dritter im Spiel ist), Role Chaining immer auf eine Stunde gedeckelt — und der Federation-Weg richtet sich danach, ob Mitarbeiter (SAML), App-Kunden (Cognito) oder on-prem-Maschinen (Roles Anywhere) zugreifen.**
