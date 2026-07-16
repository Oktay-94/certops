---
service: Amazon Lex
seedKey: saa-c03-script-lex
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/lexv2/latest/dg/what-is.html
  - https://aws.amazon.com/lex/faqs/
status: draft
---

# Amazon Lex

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Lex = der **Chatbot-Baukasten**, der die **Absicht (Intent)** des Nutzers versteht — getippt oder gesprochen. Es ist die **Technologie hinter Alexa**. Für Chatbots/Sprachassistenten: versteht „Ich will meinen Flug umbuchen" und löst die Aktion aus. In der Sprach-Kette der Mittelteil: Transcribe (Text) → **Lex** (Absicht) → Polly (Antwort). Signalwort „Chatbot/Conversational Interface" → Lex.

Der SAA vertieft: **Intents/Slots/Utterances, Lambda- und Connect-Integration — und die Rolle in der Kette.**

---

## 🎯 SAA-Vertiefung

### Intents, Slots und Utterances

**Das Problem:** Ein Nutzer schreibt „Ich möchte einen Flug für morgen nach Berlin buchen". Der Bot muss erkennen, *was* der Nutzer will und die nötigen Details *einsammeln*.

**Die Lösung — die drei Kernkonzepte:**
- **Intent**: das Ziel des Nutzers (z. B. `BookFlight`).
- **Utterances**: Beispielphrasen, die den Intent auslösen (empfohlen 10+) — Lex generalisiert daraus.
- **Slots**: die benötigten Parameter (Ziel, Datum, Anzahl) mit Built-in oder Custom Slot Types; Lex fragt fehlende Slots aktiv nach.

Ist alles gesammelt, erfolgt die **Fulfillment**-Aktion. Ein **Fallback Intent** fängt nicht erkannte Eingaben ab. „Bot mit Intents und Slots" → Lex.

> **💡 Merksatz:** **Intent** (Ziel), **Utterances** (Beispielphrasen, die den Intent auslösen), **Slots** (Parameter, die Lex nachfragt). Fehlende Slots werden aktiv abgefragt.

### Lambda- und Connect-Integration

**Das Problem:** Der Bot muss nicht nur reden, sondern echte Aktionen ausführen — einen Flug tatsächlich buchen, einen Kontostand abfragen — und als Telefon-Bot im Callcenter laufen.

**Die Lösung:**
- **AWS Lambda** (Dialog Code Hooks): validiert Eingaben und führt die **Business-Logik/Fulfillment** aus (DB-Abfrage, Buchung).
- **Amazon Connect**: Lex ist die NLU-Schicht für Telefon-Self-Service (IVR/Voicebot) im Contact Center.
- Weitere Kanäle: Facebook Messenger, Slack, Twilio SMS; **Cognito** für Auth.

„Bot, der eine Aktion ausführt" → Lex + Lambda; „Telefon-Self-Service" → Lex + Connect.

> **💡 Merksatz:** **Lambda** = Validierung + Fulfillment (echte Aktion); **Connect** = Telefon-Voicebot/IVR. Kanäle: Messenger/Slack/SMS.

### Die Rolle in der Sprach-Kette

**Das Problem:** Wo sitzt Lex zwischen den anderen Sprach-Diensten?

**Die Lösung:** Lex ist der **Verständnis-Mittelteil** eines Voicebots: Kunde spricht → **Transcribe** (Audio→Text) → **Lex** (Absicht verstehen + Dialog) → **Polly** (Antwort sprechen). Lex selbst versteht auch gesprochene Eingabe direkt (ASR + NLU wie Alexa), wird aber in Architektur-Diagrammen oft mit Transcribe/Polly kombiniert dargestellt. Abgrenzung: Lex = **Konversation/Dialog** (Intent-basiert); ein generativer LLM-Chatbot mit RAG wäre dagegen **Bedrock** (+ Knowledge Base).

> **💡 Merksatz:** Kette **Transcribe → Lex → Polly**; Lex = Absicht/Dialog (wie Alexa). Generativer LLM-Chatbot mit RAG → **Bedrock**, nicht Lex.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Chatbot", „Voicebot", „Conversational Interface", „Intents/Slots", „wie Alexa" → Lex.
- **Intent** (Ziel), **Utterances** (Auslöser-Phrasen), **Slots** (Parameter, nachgefragt); **Fallback Intent**.
- **Lambda** = Fulfillment/Business-Logik; **Connect** = Telefon-Voicebot; Kanäle Messenger/Slack/SMS.
- Kette **Transcribe → Lex → Polly**; generativer RAG-Chatbot → **Bedrock** statt Lex.

## 💡 Der eine Satz zum Mitnehmen

**Lex ist der Chatbot-/Voicebot-Baukasten mit derselben Technik wie Alexa — es erkennt Intents, sammelt Slots ein und führt über Lambda echte Aktionen aus, sitzt in der Sprach-Kette zwischen Transcribe und Polly, und weicht dem generativen Bedrock, sobald ein LLM-Chatbot mit RAG gefragt ist.**
