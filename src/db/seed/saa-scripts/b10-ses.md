---
service: Amazon SES (Simple Email Service)
seedKey: saa-c03-script-ses
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/ses/latest/dg/Welcome.html
  - https://aws.amazon.com/ses/faqs/
status: draft
---

# Amazon SES (Simple Email Service)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> SES = die **Hochleistungs-E-Mail-Fabrik**, die zuverlässig Massen- und Transaktions-Mails an echte Kunden-Postfächer verschickt. **Senden und Empfangen** echter E-Mails; AWS kümmert sich um Zustellbarkeit, Reputation, **DKIM/SPF**, Bounces/Beschwerden. Killer-Frage **SES vs. SNS**: **SES = echte E-Mails an Menschen/Kunden** (HTML, Anhänge, Newsletter, Bestätigungen); **SNS = Benachrichtigungen zwischen Systemen** (Pub/Sub, Alarme). Eselsbrücke: SES → Email Service.

Der SAA vertieft: **transaktional vs. Massen, Deliverability-Features, Empfang + Ketten — und die Messaging-Abgrenzungen.**

---

## 🎯 SAA-Vertiefung

### Senden: transaktional und Massen, zuverlässig zugestellt

**Das Problem:** Eine App muss Bestellbestätigungen, Passwort-Reset-Links und Newsletter an 100.000 Empfänger schicken. Ein eigener Mail-Server landet schnell auf **Spam-Blacklists** — die Mails kommen gar nicht an.

**Die Lösung:** **SES** versendet **transaktionale** (einzeln ausgelöste: Bestätigung, Reset, Quittung) und **Massen-/Marketing-E-Mails** über **SMTP** oder **API** und übernimmt die schwierige **Zustellbarkeit**:
- **Authentifizierung**: DKIM (Easy DKIM), SPF, DMARC — damit Mails nicht als Spam gewertet werden.
- **Configuration Sets** (Tracking/Regeln), **Dedicated IPs** und IP-Pools (Reputation isolieren), **Bounce-/Complaint-Handling**, Mailbox-Simulator zum Testen.

„E-Mails (transaktional oder Massen) an Endkunden senden, hohe Zustellbarkeit" → SES.

> **💡 Merksatz:** SES = **senden** (transaktional + Massen) via **SMTP/API** mit Deliverability (**DKIM/SPF/DMARC**, Dedicated IP, Bounce-Handling). „App schickt E-Mail an Kunden" → SES.

### Empfang und Ketten-Integration

**Das Problem:** Eingehende E-Mails (z. B. Support-Anfragen) sollen automatisch verarbeitet werden.

**Die Lösung:** SES kann E-Mails auch **empfangen**: eingehende Mails landen per Receipt Rule automatisch in einem **S3-Bucket** und triggern **Lambda** oder **SNS** — Basis für automatisierte E-Mail-Pipelines. (WorkMail nutzt SES für ausgehenden Versand.)

> **💡 Merksatz:** SES **empfängt** auch: eingehende Mail → **S3** → Lambda/SNS (Receipt Rules). Basis für E-Mail-Automatisierung.

### Die Messaging-Abgrenzungen (die klassische Falle)

**Das Problem:** SES, SNS, SQS und Pinpoint „senden" alle irgendetwas.

**Die Lösung — die klare Trennlinie Human-Email vs. Application-Messaging:**
- **SES** = **E-Mail-Content an Menschen/Kunden** (reiche Inhalte, Newsletter, Bestätigungen).
- **SNS** = **Pub/Sub-Benachrichtigungen** zwischen Systemen (A2A) oder kurze A2P-Alerts/Push; Fan-out.
- **SQS** = **Queue** (Nachrichten puffern/entkoppeln).
- **Pinpoint** (auslaufend) = **Marketing-Kampagnen** mit Segmentierung/Journeys (nutzt SES/SNS darunter).

Wichtiger Reflex: „CloudWatch-Alarm soll E-Mail an Ops schicken" → **SNS** (native CloudWatch-Integration), nicht SES. „App schickt E-Mail an Kunden" → SES.

> **💡 Merksatz:** **SES (E-Mail an Menschen) vs. SNS (System-Benachrichtigung/Alarm) vs. SQS (Queue) vs. Pinpoint (Marketing)**. CloudWatch-Alarm-Mail → SNS; Kunden-Mail → SES.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „E-Mails versenden", „Newsletter/Marketing-Mail", „Transaktions-Mail (Bestätigung/Reset)", „Massen-E-Mail", „SMTP" → SES.
- Deliverability: **DKIM/SPF/DMARC**, Configuration Sets, Dedicated IP/Pools, Bounce-/Complaint-Handling.
- **Empfang**: eingehend → **S3** → Lambda/SNS (Receipt Rules).
- **SES (E-Mail an Menschen) vs. SNS (System/Alarm) vs. SQS (Queue) vs. Pinpoint (Marketing)**; CloudWatch-Alarm-Mail → SNS.

## 💡 Der eine Satz zum Mitnehmen

**SES ist die E-Mail-Fabrik, die transaktionale und Massen-Mails zuverlässig an echte Kundenpostfächer zustellt — mit DKIM/SPF/DMARC und Bounce-Handling, und Empfang über S3→Lambda — und in der Messaging-Falle gilt: SES schickt E-Mail an Menschen, SNS benachrichtigt Systeme (auch CloudWatch-Alarme).**
