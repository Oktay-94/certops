---
service: Amazon Pinpoint
seedKey: saa-c03-script-pinpoint
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/pinpoint/latest/userguide/welcome.html
  - https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html
status: draft
---

# Amazon Pinpoint

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Pinpoint = die **Marketing-Zentrale** für gezielte, **kanalübergreifende** Kundenkommunikation — E-Mail, SMS, Push, Voice — mit **Segmentierung**, **Kampagnen/Journeys** und **Analytics**. Abgrenzung: **SES = reiner E-Mail-Versand (Motor); SNS = System-Benachrichtigungen; Pinpoint = Marketing-Kampagnen mit Segmentierung & Analyse** (nutzt SES/SNS darunter). 🛑 End of Support 30.10.2026 — der Dienst wird aufgeteilt.

Der SAA vertieft: **das Multichannel-Marketing-Konzept, die Abgrenzung — und vor allem die Aufteilung/Nachfolger.**

---

## 🎯 SAA-Vertiefung

### Multichannel-Marketing mit Segmentierung und Analytics

**Das Problem:** Eine Firma will gezielt und kanalübergreifend mit Kunden kommunizieren — Kampagnen, Push, SMS-Aktionen, personalisierte E-Mails an bestimmte Zielgruppen — und **messen**, wie gut das ankommt. Reine Versanddienste (SES/SNS) bieten dafür keine Segmente/Journeys/Analytics.

**Die Lösung (konzeptionell):** **Pinpoint** ist die **Engagement-Plattform obendrauf**: Multichannel (E-Mail/SMS/Push/Voice) aus einem Dienst, **Zielgruppen-Segmentierung**, geplante/ausgelöste **Kampagnen** und **Customer Journeys**, plus **Analytics** (Zustellung, Öffnungen, Klicks, Conversions). Es nutzt SES/SNS im Hintergrund als Versand-„Motor". „Multichannel-Marketing mit Segmentierung/Journeys/Analytics" → Pinpoint (bzw. der Nachfolger, s. u.).

> **💡 Merksatz:** Pinpoint = **Engagement-Plattform** (Multichannel + Segmentierung + Kampagnen/Journeys + Analytics) über SES/SNS. Mehr als Versand: **Zielgruppen + Messung**.

### Die Abgrenzung und — wichtiger — die Aufteilung

**Das Problem:** Pinpoint überschneidet sich mit SES/SNS, und der Dienst ist im Umbruch.

**Die Lösung — die Abgrenzung:**
- **SES** = reiner E-Mail-Versand (Motor).
- **SNS** = Pub/Sub-Benachrichtigungen zwischen Systemen / einfache Alarme.
- **Pinpoint** = Marketing/Engagement (Segmentierung, Kampagnen, Analytics) darüber.

🛑 **Aktualität (entscheidend):** AWS beendet den Pinpoint-Support zum **30.10.2026** (keine Neukunden seit 2025). Der Dienst wird **aufgeteilt**, nicht ersatzlos gestrichen:
- **Engagement/Marketing-Layer** (Kampagnen, Journeys, Segmente, Analytics) → Nachfolger **Amazon Connect** (Outbound Campaigns + Customer Profiles).
- **Messaging-Kanäle** (SMS, MMS, Push, WhatsApp, Voice) → laufen als **AWS End User Messaging** weiter.
- **E-Mail** → **SES**.

Das Lehrkonzept „Multichannel-Marketing" bleibt gültig, und Pinpoint kann in älteren Fragen als richtige Antwort/Distraktor auftauchen — aber der **künftige Distraktor** für „Multichannel-Marketing" zeigt auf **Connect / End User Messaging**.

> **💡 Merksatz:** 🛑 Pinpoint **EoS 30.10.2026**, aufgeteilt: Engagement → **Connect Outbound**, Messaging → **AWS End User Messaging**, E-Mail → **SES**. Konzept bleibt, Distraktor wandert.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Multichannel-Marketing", „Kampagne/Journey", „Segmentierung", „Engagement-Analytics" → Pinpoint (bzw. Nachfolger).
- **SES (Versand-Motor) vs. SNS (System-Pub/Sub) vs. Pinpoint (Marketing/Engagement darüber)**.
- 🛑 **EoS 30.10.2026**, Aufteilung: Engagement → **Connect**, Messaging → **AWS End User Messaging**, E-Mail → **SES**.
- In neuen Architekturen nicht mehr wählen; als Distraktor in Altmaterial möglich.

## 💡 Der eine Satz zum Mitnehmen

**Pinpoint war die Multichannel-Marketing-Plattform mit Segmentierung, Kampagnen und Analytics über SES/SNS — aber mit End of Support 2026 wandert das Engagement zu Amazon Connect, das Messaging zu AWS End User Messaging und die E-Mail zu SES; das Konzept bleibt prüfbar, der Dienst selbst ist auslaufend.**
