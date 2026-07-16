---
service: Amazon Transcribe
seedKey: saa-c03-script-transcribe
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/transcribe/latest/dg/what-is.html
  - https://aws.amazon.com/transcribe/features/
status: draft
---

# Amazon Transcribe

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Transcribe = **Sprache → Text** (Speech-to-Text), fertiger API-Dienst. Für **Untertitel, Meeting-Protokolle, durchsuchbare Callcenter-Mitschnitte**. Das **exakte Gegenstück zu Polly** (Text→Sprache) — die Prüfung vertauscht sie gern. Merksatz: **Transcribe Tippt mit (Stimme→Text), Polly Plappert (Text→Stimme).** Eselsbrücke: Transcript = Mitschrift.

Der SAA vertieft: **Batch vs. Streaming, Speaker Diarization + PII-Redaction, Transcribe Medical/Call Analytics — und die Polly-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Batch, Streaming und die Kern-Features

**Das Problem:** Ein Callcenter hat tausende aufgezeichnete Gespräche, die durchsuchbar werden sollen — und gleichzeitig sollen Live-Anrufe in Echtzeit transkribiert werden.

**Die Lösung:** **Transcribe** wandelt Audio in Text, in zwei Modi:
- **Batch** (`StartTranscriptionJob`): gespeicherte Audiodateien (S3).
- **Streaming** (WebSocket/HTTP2): Echtzeit-Transkription von Live-Audio.

Kern-Features (prüfbar): **Speaker Diarization** (unterscheidet Sprecher, bis 🔴 30 — `spk_0`..`spk_29`), **Custom Vocabulary** (Fachbegriffe/Eigennamen), **Custom Language Models**, automatische Interpunktion, Sprachidentifikation, Channel Identification (getrennte Kanäle). „Anrufe transkribieren und Sprecher trennen" → Transcribe mit Speaker Diarization.

> **💡 Merksatz:** **Batch** (S3) vs. **Streaming** (Live); **Speaker Diarization** (bis 🔴 30 Sprecher), Custom Vocabulary. „Sprecher trennen" → Diarization.

### PII-Redaction, Medical und Call Analytics

**Das Problem:** Transkribierte Gespräche enthalten Kreditkartennummern und Namen, die entfernt werden müssen — und man will aus Kundengesprächen automatisch Insights ziehen.

**Die Lösung — drei Spezialisierungen:**
- **Automatic Content Redaction / PII Redaction**: erkennt und entfernt sensible PII direkt aus dem Transkript.
- **Transcribe Medical**: ASR für medizinische Fachsprache (Diktat + Arzt-Patienten-Gespräch).
- **Transcribe Call Analytics**: Insights aus Kundengesprächen — Sentiment, Call-Kategorien, Talk-Speed, Interruptions, generative Zusammenfassungen; integriert mit **Amazon Connect Contact Lens**. „Callcenter-Analyse mit Sentiment und Zusammenfassung" → Call Analytics.

> **💡 Merksatz:** **PII Redaction** (sensible Daten raus), **Transcribe Medical** (Fachsprache), **Call Analytics** (Sentiment/Zusammenfassung, mit Connect).

### Die Polly-Abgrenzung und die Kette

**Das Problem:** Transcribe und Polly sind die meistverwechselte KI-Paarung.

**Die Lösung:** Sie sind **exakte Gegenstücke**:
- **Transcribe** = Audio → Text (🎤→📄).
- **Polly** = Text → Audio (📄→🔊).

In der Sprach-Kette (Voicebot): Kunde spricht → **Transcribe** (Text) → **Lex** (Absicht verstehen) → **Polly** (Antwort sprechen). Reflex: „Gesprochenes mitschreiben/Untertitel" → Transcribe; „Text vorlesen" → Polly.

> **💡 Merksatz:** **Transcribe (Stimme→Text) ↔ Polly (Text→Stimme)** — exakte Gegenstücke. Kette: **Transcribe → Lex → Polly**. „mitschreiben" → Transcribe.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Transkription", „Audio/Anruf zu Text", „Untertitel", „Diktat" → Transcribe (Speech-to-Text).
- **Batch** (S3) vs. **Streaming** (Live); **Speaker Diarization** (bis 🔴 30), Custom Vocabulary.
- **PII Redaction**, **Transcribe Medical**, **Call Analytics** (mit Connect Contact Lens).
- **Transcribe (Stimme→Text) ↔ Polly (Text→Stimme)**; Kette Transcribe→Lex→Polly.

## 💡 Der eine Satz zum Mitnehmen

**Transcribe schreibt Sprache als Text mit — Batch oder Streaming, mit Speaker Diarization, PII-Redaction und Call Analytics fürs Callcenter — und ist das exakte Gegenstück zu Polly: Transcribe tippt mit, Polly plappert.**
