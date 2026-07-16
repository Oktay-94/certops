---
service: AWS IAM Identity Center
seedKey: saa-c03-script-iam-identity-center
batch: B5
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html
  - https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html
  - https://docs.aws.amazon.com/singlesignon/latest/userguide/scim-profile-saml.html
status: draft
---

# AWS IAM Identity Center

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> IAM Identity Center (früher **AWS SSO** — der alte Name kommt in Fragen noch vor) = **ein zentraler Login für viele AWS-Konten und Apps**. Jeder Mitarbeiter hat *eine* Identität mit **Single Sign-On**, angebunden an bestehende Verzeichnisse (Active Directory, Entra ID, Okta). Das Traumpaar der Prüfung: **Organizations (viele Konten) + Identity Center (ein Login)**.

Der SAA vertieft: **Wie Permission Sets zu Rollen werden, welche Identity Source wann passt — und die scharfe Abgrenzung Workforce vs. Customer.**

---

## 🎯 SAA-Vertiefung

### Permission Sets: Ein Rechte-Bündel, das in jedem Konto zur Rolle wird

**Das Problem:** 500 Mitarbeiter, 60 AWS-Konten. „Entwickler" sollen in den Dev-Konten Lese-/Schreibrechte haben, in Prod nur lesen. Das in jedem Konto einzeln als IAM-Rollen zu pflegen, driftet garantiert auseinander.

**Die Lösung:** Man definiert das Rechte-Bündel **einmal zentral** als **Permission Set** (basierend auf AWS-managed oder Custom Policies) und weist es Gruppen für bestimmte Konten zu. Identity Center **provisioniert daraus automatisch IAM-Rollen** in den Zielkonten (sie erscheinen dort als `AWSReservedSSO_*`). Ein Mitarbeiter meldet sich am **Access Portal** an, sieht alle erlaubten Konten und springt per Klick hinein — im Hintergrund nimmt er die zugehörige Rolle mit **temporären STS-Credentials** an. Keine langlebigen Access Keys, nirgends.

Die Konsequenz für Onboarding/Offboarding — genau das Prüfungsargument gegen IAM Users pro Konto: Ein neuer Mitarbeiter kommt in **eine** Gruppe und hat sofort den richtigen Zugriff über alle Konten; scheidet er aus, entzieht das Deaktivieren der *einen* Identität den Zugriff überall. Kein Vergessen in Konto 47.

> **💡 Merksatz:** **Permission Set = zentral definiertes Rechte-Bündel → wird automatisch zur IAM-Rolle** (`AWSReservedSSO_*`) in jedem Zielkonto. Zugriff immer über temporäre STS-Credentials.

### Identity Source: Wo die Nutzer wirklich herkommen

**Das Problem:** Die Firma verwaltet ihre Mitarbeiter längst in **Microsoft Entra ID**. Niemand will diese 500 Nutzer ein zweites Mal in AWS pflegen — und wenn jemand das Unternehmen verlässt, soll der AWS-Zugriff automatisch mit erlöschen.

**Die Lösung:** Identity Center kennt drei **Identity Sources** — die Wahl ist ein Frage-Muster:
- **Eingebautes Directory**: kleine Umgebungen ohne bestehendes Verzeichnis.
- **Active Directory** (via AWS Directory Service / AD Connector): wenn AD die Quelle ist.
- **Externer IdP** (Okta, Entra ID, Ping …): via **SAML 2.0** für die **Authentifizierung** + **SCIM** für das **automatische Provisioning/Deprovisioning** von Nutzern und Gruppen.

Der Detail-Punkt mit Punktwert: **SAML allein authentifiziert nur** — für das automatische Anlegen/Löschen von Nutzern braucht es **SCIM**. „Nutzer sollen automatisch aus dem IdP synchronisiert werden" → SAML **+ SCIM**, nicht SAML allein.

> **💡 Merksatz:** Externer IdP = **SAML (Login) + SCIM (automatisches Provisioning/Deprovisioning)**. Nur eine Identity Source pro Organisation.

### Die Abgrenzung: Workforce vs. Customer (und vs. IAM)

**Das Problem:** Drei Dienste klingen nach „Login-Verwaltung": IAM, IAM Identity Center, Cognito. Die Prüfung stellt sie gegeneinander.

**Die Lösung — die Trennlinie ist die Zielgruppe:**
- **IAM**: Maschinen und AWS-interne Prinzipale (EC2-Rollen, Service Roles), programmatischer Zugriff — und Rechte *innerhalb eines* Kontos.
- **IAM Identity Center**: **Mitarbeiter** (Workforce), **Single Sign-On über viele Konten**.
- **Cognito**: **App-Endkunden** (Customer Identities), die von AWS gar nichts wissen.

Der Reflex: „Mitarbeiter", „SSO", „mehrere AWS-Konten", „mit Active Directory verbinden" → **Identity Center**. „Endnutzer meiner Web-/Mobile-App", „Sign-up/Sign-in", „Social Login" → **Cognito**. „EC2 braucht Zugriff auf S3" → **IAM-Rolle**.

> **💡 Merksatz:** **Workforce (Mitarbeiter, Multi-Account) → Identity Center. Customer (App-Nutzer) → Cognito. Maschinen/ein Konto → IAM.**

---

## ⚠️ Prüfungs-Knackpunkte

- Alter Name **AWS SSO** = IAM Identity Center (seit 2022).
- **Permission Sets** werden zu IAM-Rollen (`AWSReservedSSO_*`) in Zielkonten; Zugriff über **temporäre STS-Credentials**, kein langlebiger Key.
- Identity Sources: eingebaut / **AD** / **externer IdP (SAML + SCIM)**; **SCIM = automatisches Provisioning/Deprovisioning**, SAML nur Auth.
- **Traumpaar:** Organizations + Identity Center für Multi-Account-SSO.
- Abgrenzung: **IAM (Maschinen/ein Konto)** · **Identity Center (Workforce, Multi-Account)** · **Cognito (App-Kunden)**.
- Für Machine-to-Machine ohne Menschen: nicht Identity Center, sondern **EC2 Instance Profile / IAM Roles Anywhere**.
- Quotas sind Defaults (anpassbar) — keine exakten Zahlen auswendig lernen.

## 💡 Der eine Satz zum Mitnehmen

**IAM Identity Center ist die Antwort, sobald „Mitarbeiter" und „mehrere Konten" im selben Satz stehen** — Permission Sets werden zu Rollen, ein externer IdP klinkt sich per SAML+SCIM ein, und die Zielgruppe (Workforce, nicht App-Kunde) trennt es sauber von Cognito.
