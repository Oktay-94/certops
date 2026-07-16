---
service: Amazon Connect
seedKey: saa-c03-script-connect
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/connect/latest/adminguide/what-is-amazon-connect.html
  - https://aws.amazon.com/connect/
status: draft
---

# Amazon Connect

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Connect = das **komplette Callcenter aus der Cloud** — ein cloudbasiertes **Contact Center** (Callcenter as a Service), per Weboberfläche eingerichtet, **keine Hardware, keine Telefonanlage**. Schnell startklar, **pay-per-use** (nur Gesprächsminuten), **elastisch** (10 oder 10.000 Anrufe), **Anruf-Flows** per Drag-and-Drop. Kern-Vertiefung: Connect ist der Ort, an dem die **Sprach-KI-Dienste** zusammenlaufen.

Der SAA vertieft: **Omnichannel + Contact Flows, den KI-Zusammenlauf (Lex/Polly/Transcribe/Comprehend/Contact Lens) — und die Abgrenzungen.**

---

## 🎯 SAA-Vertiefung

### Cloud-Contact-Center: omnichannel und elastisch

**Das Problem:** Eine Firma braucht telefonischen Kundenservice. Der klassische Weg — teure Telefonanlagen-Hardware, Software-Lizenzen, Wochen Einrichtung — skaliert im Weihnachtsgeschäft nicht, wenn plötzlich dreimal so viele Anrufe kommen.

**Die Lösung:** **Amazon Connect** ist ein **Cloud-Contact-Center** ohne Hardware: in Minuten/Stunden startklar, **omnichannel** (Voice, Chat, Task, E-Mail), **pay-per-use** (Kunden-/Telefonminuten), automatisch **elastisch**. Die Anruf-Logik baut man visuell als **Contact Flows** (Drag-and-Drop: IVR-Menüs, Skills-based Routing, Queues). „Cloud-Callcenter/Contact Center, elastisch, ohne Hardware" → Connect.

> **💡 Merksatz:** Connect = **Cloud-Contact-Center** (omnichannel, pay-per-use, elastisch, keine Hardware); **Contact Flows** = visuelle IVR-/Routing-Logik.

### Der KI-Zusammenlauf (das Herzstück)

**Das Problem:** Einfache Anliegen (Bestellstatus, Öffnungszeiten) sollen ohne menschlichen Agenten gelöst und jedes Gespräch auf Stimmung/Qualität analysiert werden.

**Die Lösung — hier laufen die Sprach-KI-Dienste aus dem ML-Block zusammen:**
- **Amazon Lex** → versteht die Absicht (Conversational IVR/Bot).
- **Amazon Polly** → wandelt Text in Sprache für dynamische Ansagen.
- **AWS Lambda** → custom Business-Logik (CRM-/DB-Abfrage) im Contact Flow.
- **Contact Lens** (conversational analytics, nutzt Transcribe/Comprehend) → **Transkription**, **Sentiment**, automatische Kategorisierung, Redaction, Call-Summaries; real-time + post-call.
- **Amazon Q in Connect** → generative Agent-Assistenz.
- **Translate** für mehrsprachige Interaktionen.

So entsteht ein intelligenter Telefon-Self-Service: Anrufer spricht → Lex versteht → Lambda holt Daten → Polly antwortet; parallel analysiert Contact Lens Sentiment. „Callcenter + Bot/Sentiment/Transkription" → Connect + die passenden KI-Dienste.

> **💡 Merksatz:** Connect-Hub: **Lex** (versteht) · **Polly** (spricht) · **Lambda** (Logik) · **Contact Lens** (Transkript/Sentiment via Transcribe/Comprehend) · **Q in Connect** (GenAI) · **Translate** (mehrsprachig).

### Die Abgrenzungen

**Das Problem:** Connect wird mit Pinpoint und einzelnen KI-Diensten verwechselt.

**Die Lösung:**
- **Connect** = **inbound/outbound Contact Center** (Gespräche, IVR, Routing).
- **Pinpoint** (auslaufend) = outbound **Marketing-Kampagnen** — deren Engagement-Nachfolger ist übrigens **Connect Outbound Campaigns**.
- Einzelne KI-Dienste (Lex/Polly/Transcribe) allein sind **Bausteine**, kein Callcenter.

Reflex: „Callcenter/Contact Center" → Connect; „Marketing-Kampagne" → Pinpoint/Connect Outbound; „nur Bot" → Lex allein.

> **💡 Merksatz:** **Connect (Contact Center) vs. Pinpoint (Marketing, auslaufend → Connect Outbound)**; einzelne KI-Dienste sind Bausteine, kein Callcenter.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Callcenter/Contact Center", „Cloud-Telefonie", „Anrufe entgegennehmen/verteilen", „virtueller Agent am Telefon" → Connect.
- Omnichannel, pay-per-use, elastisch, keine Hardware; **Contact Flows** (visuelle IVR/Routing).
- KI-Zusammenlauf: **Lex · Polly · Lambda · Contact Lens (Transcribe/Comprehend, Sentiment) · Q in Connect · Translate**.
- **Connect (Contact Center) vs. Pinpoint (Marketing, → Connect Outbound)**.

## 💡 Der eine Satz zum Mitnehmen

**Amazon Connect ist das Cloud-Callcenter ohne Hardware — omnichannel, elastisch, pay-per-use, mit visuellen Contact Flows — und ist der Ort, an dem Lex, Polly, Lambda und Contact Lens (Transkription/Sentiment) zu intelligentem Telefon-Self-Service zusammenlaufen.**
