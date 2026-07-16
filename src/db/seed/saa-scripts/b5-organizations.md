---
service: AWS Organizations (+ SCPs, RCPs, Control Tower)
seedKey: saa-c03-script-organizations
batch: B5
domains: [D1, D4]
sourceRef:
  - https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html
  - https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_rcps.html
  - https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html
status: draft
---

# AWS Organizations

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Organizations = die **Konzernverwaltung**: viele AWS-Konten zentral steuern. **Management Account** an der Spitze, **OUs** zum Gruppieren, **Member Accounts** darunter. **Consolidated Billing** bündelt alle Rechnungen und teilt Mengenrabatte. **SCPs** setzen kontoweite Leitplanken.

Der SAA vertieft die Leitplanken: **Was SCPs genau (nicht) tun, wo RCPs ergänzen, wie Consolidated Billing Geld spart — und wann Control Tower die Antwort ist.**

---

## 🎯 SAA-Vertiefung

### SCPs: Leitplanken, die selbst nichts erlauben

**Das Problem:** Ein Konzern will erzwingen, dass Member-Konten **ausschließlich** in `eu-central-1` und `eu-west-1` arbeiten — auch ein lokaler Konto-Admin darf keine Ressourcen in Tokio starten. Eine IAM-Policy reicht nicht: Der Admin könnte sie ändern.

**Die Lösung:** Eine **SCP (Service Control Policy)** ist eine **Guardrail** — die maximale Grenze dessen, was Prinzipale in einem Member-Konto überhaupt dürfen. Vier Eigenschaften, die jede für sich Prüfungsstoff sind:
- **Sie gewährt selbst nichts.** Eine SCP allein macht niemanden handlungsfähig — die Rechte müssen weiterhin per IAM-Policy erteilt werden. Effektive Rechte = **Schnittmenge** aus SCP und IAM-Policy.
- **Sie wirkt auf ALLE Prinzipale des Member-Kontos — auch auf den Root-User.** Das ist der Grund, warum sie den lokalen Admin (und sogar Root) einbremsen kann, wo IAM-Policies versagen.
- **Sie wirkt NICHT auf das Management Account.** Deshalb gehören produktive Workloads *nie* ins Management Account — es lässt sich per SCP nicht einschränken.
- **Sie wirkt NICHT auf Service-Linked Roles.**

Für das Region-Beispiel: eine SCP mit `Deny` und Condition `aws:RequestedRegion` außerhalb der erlaubten Liste, an die OU gehängt — fertig. Die gängige Strategie ist die **Deny-List**: Das AWS-Default `FullAWSAccess` bleibt dran, und man verbietet gezielt einzelne Dinge (neue Services funktionieren dann automatisch). Die **Allow-List** (FullAWSAccess entfernen, alles einzeln erlauben) ist strenger, aber wartungsintensiv — und verlangt ein Allow auf **jeder** Ebene vom Root bis zum Konto.

> **💡 Merksatz:** **SCP = Guardrail, gewährt nichts** (Schnittmenge mit IAM). Wirkt auf **Member-Root**, aber **nicht aufs Management Account** und **nicht auf Service-Linked Roles**. Region sperren → SCP mit `aws:RequestedRegion`.

### RCPs: Die neue Guardrail für die Ressourcen-Seite

**Das Problem:** Ein Data Perimeter soll erzwingen: „**Kein** Principal von außerhalb unserer Organisation darf auf unsere S3-Buckets zugreifen — egal, was eine einzelne Bucket Policy erlaubt." SCPs helfen nicht: Sie begrenzen die *eigenen* Prinzipale, nicht den *externen* Zugriff auf *eigene* Ressourcen.

**Die Lösung:** 🛑 **RCPs (Resource Control Policies, seit November 2024)** sind das **Ressourcen-seitige Gegenstück** zu SCPs. Wo die SCP fragt „was dürfen *meine Nutzer* tun?", fragt die RCP „wer darf auf *meine Ressourcen* zugreifen?". Eine RCP mit einer `aws:PrincipalOrgID`-Bedingung sperrt jeden externen Zugriff org-weit — überschreibt also selbst eine zu großzügige Bucket Policy. Unterstützte Dienste beim Start: **S3, STS, KMS, SQS, Secrets Manager**. Wie SCPs gewähren RCPs nichts und wirken nicht aufs Management Account.

Die Abgrenzung, die eine neue Fragenklasse bildet: **SCP begrenzt Prinzipale (Aktions-Seite), RCP begrenzt Ressourcen (Zugriffs-Seite).** „Datenexfiltration / externer Zugriff org-weit unterbinden" → **RCP**.

> **💡 Merksatz:** 🛑 **RCP = Guardrail für Ressourcen** (wer darf rein), **SCP = Guardrail für Prinzipale** (was dürfen meine Leute). Data Perimeter / kein externer Zugriff → **RCP** (S3/STS/KMS/SQS/Secrets).

### Consolidated Billing: Warum ein RI in Konto A auch Konto B hilft

**Das Problem:** Fünf Konten kaufen je für sich EC2-Kapazität. Keines erreicht allein die nächste Mengenrabatt-Stufe, und ein in Konto A gekaufter Reserved Instance verfällt ungenutzt, während Konto B On-Demand zahlt.

**Die Lösung:** **Consolidated Billing** behandelt alle Konten fürs Pricing als **eine Einheit**: Die Nutzung wird für **Volumen-Staffelpreise** zusammengezählt, und **Reserved-Instance- sowie Savings-Plans-Rabatte werden über alle Konten geteilt** (per Default aktiv). Der in Konto A gekaufte RI-Rabatt greift automatisch für passende Nutzung in B, C, D. Das ist das klassische Kosten-Argument für Organizations — und der Distraktor ist „RI pro Konto kaufen" (verschenkt das Sharing).

> **💡 Merksatz:** Consolidated Billing = **Volumenrabatte aggregiert + RI/SP-Sharing über alle Konten** (Default an). Ein RI im Verbund hilft jedem Konto.

### Control Tower: Governance auf Knopfdruck

**Das Problem:** Ein Unternehmen will eine **Multi-Account-Umgebung nach Best Practices** aufsetzen — mit vorkonfigurierten Guardrails, zentralem Logging und einem sauberen Prozess, um neue Konten auszurollen. Alles von Hand mit Organizations, SCPs, Config und CloudTrail zu bauen, dauert Wochen.

**Die Lösung:** **AWS Control Tower** orchestriert Organizations, IAM Identity Center, CloudTrail und Config zu einer fertigen **Landing Zone**. Es liefert **Controls/Guardrails** in drei Geschmacksrichtungen: **Preventive** (über SCPs/RCPs — „das darf gar nicht passieren"), **Detective** (über Config Rules — „melde, wenn es passiert"), **Proactive** (über CloudFormation Hooks — „prüfe schon vor dem Deployment"). Die **Account Factory** rollt neue Konten standardisiert aus.

Die Abgrenzung: **Organizations** ist das Fundament (Konten strukturieren, SCPs). **Control Tower** ist die **Automatisierungs- und Governance-Schicht darüber**. „Schnell eine well-architected Landing Zone mit Guardrails" → Control Tower; „nur Konten gruppieren und SCPs setzen" → Organizations direkt.

> **💡 Merksatz:** **Control Tower = fertige Landing Zone** auf Organizations (Preventive/Detective/Proactive Controls, Account Factory). Organizations = das Fundament, Control Tower = die Automatisierung darüber.

### 🛑 Der Root-User ist nicht mehr, was er war

Eine wichtige Aktualisierung, weil alte Übungsfragen es falsch haben: Seit **November 2024** kann Organizations mit **Centralized Root Access Management** die **langlebigen Root-Credentials aus Member-Konten entfernen** — neue Konten haben per Default gar keine mehr. Privilegierte Root-Aufgaben laufen dann über **temporäre, eng begrenzte Sitzungen** (`sts:AssumeRoot`) aus dem Management Account. Zusätzlich erzwingt AWS inzwischen **MFA für alle Root-User**. Die alte Aussage „den Root-User eines Kontos kann man letztlich nicht einschränken" ist damit überholt.

> **💡 Merksatz:** 🛑 Root-Credentials sind org-weit **entfernbar** (Nov 2024, `sts:AssumeRoot`); **MFA-Pflicht für Root**. „Root kann man nicht bändigen" ist veraltet.

---

## ⚠️ Prüfungs-Knackpunkte

- **SCP = Guardrail, gewährt nichts** (Schnittmenge mit IAM); wirkt auf **Member-Root**, **nicht** aufs Management Account, **nicht** auf Service-Linked Roles.
- **Deny-List** (FullAWSAccess behalten + gezielt verbieten) vs. **Allow-List** (alles einzeln erlauben, Allow auf jeder Ebene nötig).
- Region-Lockdown → SCP mit `aws:RequestedRegion`.
- 🛑 **RCP (Nov 2024) = Ressourcen-Guardrail** (S3/STS/KMS/SQS/Secrets); externer Zugriff/Data Perimeter → RCP (nicht SCP).
- **Consolidated Billing:** Volumenrabatte aggregiert + **RI/SP-Sharing** (Default an) → Kostenvorteil.
- **Control Tower** = Landing Zone (Preventive/Detective/Proactive Controls, Account Factory); Organizations = Fundament.
- Weitere Policy-Typen: **Tag Policies, Backup Policies**.
- 🛑 **Centralized Root Access Management** + MFA-Pflicht Root ändern klassische Root-Aussagen.

## 💡 Der eine Satz zum Mitnehmen

**Organizations gibt zwei Arten von Leitplanken (SCP für Prinzipale, RCP für Ressourcen) plus einen Kostenhebel (RI-Sharing) — und wenn das Szenario „Best-Practice-Multi-Account auf Knopfdruck" verlangt, heißt die Antwort Control Tower.**
