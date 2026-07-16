---
service: Amazon WorkMail
seedKey: saa-c03-script-workmail
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/workmail/latest/adminguide/what_is.html
  - https://docs.aws.amazon.com/workmail/latest/adminguide/workmail-end-of-support.html
status: draft
---

# Amazon WorkMail

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> WorkMail ist im CLF-Kurs nicht vertieft — hier die Einordnung: **managed Business-E-Mail + Kalender** (wie Exchange/Outlook), sicher gehostet. Zugriff via Outlook, native iOS/Android, IMAP oder Web-Client; Kalender/Kontakte, AD-Integration, KMS-Verschlüsselung. **Nutzt SES für ausgehenden Versand.** Killer-Abgrenzung: **WorkMail = Mitarbeiter-Postfächer (Groupware); SES = anwendungsgetriebener E-Mail-Versand an Endkunden.** 🛑 End of Support 31.03.2027.

Der SAA vertieft: **Mitarbeiter-Postfächer vs. App-E-Mail, die Integrationen — und den Abkündigungs-Status.**

---

## 🎯 SAA-Vertiefung

### Mitarbeiter-Postfächer statt App-E-Mail

**Das Problem:** Eine Firma braucht **E-Mail-Postfächer + Kalender für ihre Mitarbeiter** (wie ein gehostetes Exchange) — nicht das Versenden von App-Benachrichtigungen an Kunden.

**Die Lösung:** **WorkMail** ist managed **Groupware**: jeder Mitarbeiter hat ein Postfach mit Kalender, Kontakten und Aufgaben, erreichbar über **Microsoft Outlook**, native Mobile-Apps (Exchange ActiveSync), IMAP oder den Web-Client. Integration mit **AWS Directory Service** (Simple AD/Managed AD/AD Connector), Verschlüsselung at-rest via **KMS**, Data-Locality-Kontrolle. Das ist der entscheidende Unterschied zu SES: WorkMail = **Postfächer für Menschen im Unternehmen**; SES = **Versand-Engine für Anwendungen**. „gehostete Mitarbeiter-E-Mail + Kalender (Exchange-Ersatz)" → WorkMail.

> **💡 Merksatz:** WorkMail = **managed Mitarbeiter-Postfächer + Kalender** (Outlook/ActiveSync/IMAP/Web), AD-Integration, KMS. **WorkMail (Postfächer für Menschen) vs. SES (App-Versand)**.

### Die Integrationen und der Abkündigungs-Status

**Das Problem:** Wie fügt sich WorkMail ein — und ist es heute noch die richtige Wahl?

**Die Lösung:**
- **Integrationen**: nutzt **SES** für ausgehenden Versand, **Directory Service** für Nutzerverwaltung, **KMS** für Verschlüsselung.
- 🛑 **Aktualität**: WorkMail hat **End of Support am 31.03.2027**; **keine Neukunden mehr ab 30.04.2026**. AWS empfiehlt Migration zu Microsoft 365/Exchange Online, Google Workspace o. ä. In **neuen** Architekturen ist WorkMail daher nicht mehr die empfohlene Lösung; in Prüfungsfragen kann es als Groupware-Antwort/Distraktor auftauchen, und die **Abgrenzung zu SES** bleibt das Prüfungswichtige.

> **💡 Merksatz:** Integrationen: **SES** (Versand), **Directory Service** (Nutzer), **KMS** (Verschlüsselung). 🛑 **EoS 31.03.2027**, keine Neukunden ab 30.04.2026 → M365/Google Workspace. Abgrenzung zu SES bleibt zentral.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Mitarbeiter-E-Mail", „Postfach + Kalender", „Outlook/Exchange-Ersatz", „gehostete Business-E-Mail" → WorkMail.
- **WorkMail (Postfächer für Menschen/Groupware) vs. SES (anwendungsgetriebener Versand an Kunden)**.
- Integrationen: **SES** (ausgehend), **Directory Service**, **KMS**.
- 🛑 **EoS 31.03.2027** (keine Neukunden ab 30.04.2026) → M365/Google Workspace; in neuen Designs nicht mehr wählen.

## 💡 Der eine Satz zum Mitnehmen

**WorkMail ist gehostete Business-E-Mail plus Kalender für Mitarbeiter — Exchange-artige Groupware über Outlook/ActiveSync mit AD- und KMS-Integration — und grenzt sich klar von SES ab (Postfächer für Menschen vs. Versand-Engine für Apps), ist aber mit End of Support 2027 in neuen Architekturen durch M365/Google Workspace zu ersetzen.**
