---
service: ML/KI-Überblick & Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-ml-ai-decision-matrix
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/decision-guides/latest/bedrock-or-sagemaker/bedrock-or-sagemaker.html
  - https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model-options.html
status: draft
---

# ML/KI-Überblick & Entscheidungsmatrix

## 📋 Einordnung

> Der ML/KI-Block wirkt groß, ist aber über **drei Leitfragen** fast vollständig lösbar. Der SAA-C03-Guide listet **exakt 11 ML-Dienste**: Comprehend, Forecast, Fraud Detector, Kendra, Lex, Polly, Rekognition, SageMaker, Textract, Transcribe, Translate. **Bedrock und Amazon Q stehen NICHT im Guide-Appendix** — sie sind reale GenAI-Standards 2024–2026 und werden als Orientierung mitgenommen, aber ehrlich als „nicht offiziell gelistet" markiert. **Personalize** ist laut Guide **out-of-scope** (nur Randnotiz).

Dieses Skript bündelt die drei prüfungsentscheidenden Matrizen. Wer sie beherrscht, beantwortet die meisten KI-Fragen im Reflex.

---

## 🎯 Matrix (a): Fertige AI-Services vs. SageMaker vs. Bedrock — DIE Leitfrage

| | Fertige AI-Services | SageMaker (AI) | Bedrock |
|---|---|---|---|
| Was | vortrainierte API für **eine konkrete Aufgabe** (Bild/Sprache/Text) | **eigenes** Modell bauen/trainieren/deployen | Foundation Models / **generative KI** über API |
| ML-Wissen | keins | Data-Science-Expertise | wenig (Prompting) |
| Metapher | die **fertig gelieferte Pizza** | die **Küche zum Selberkochen** | das **fertige, fremd gebaute Haus** (Schlüssel drehen) |
| Signalwort | „vortrainiert", „ohne ML-Expertise", konkrete Aufgabe | „eigenes/custom Modell", „trainieren", „eigene Daten", „Notebook", „Endpoint" | „generative AI", „Foundation Model", „LLM", „RAG", „Claude/Titan" |

**Leitlinie (wortgetreu aus dem CLF-Recap):** maßgeschneidertes Modell → **SageMaker**; fertige Standardfunktion per API → der passende vortrainierte Dienst. Diese eine Unterscheidung beantwortet die meisten KI-Fragen.

> **💡 Merksatz:** **Fertige Pizza (AI-Services) · Selber kochen (SageMaker) · Fertiges Haus mieten (Bedrock/GenAI).** „eigenes Modell/eigene Daten trainieren" → SageMaker; „generative KI/LLM" → Bedrock; sonst → fertiger Dienst.

## 🎯 Matrix (b): Die Sprach-KI-Richtungen — die klassische Verwechslung

| Dienst | Richtung / Aufgabe | Signalwort |
|---|---|---|
| **Translate** | Sprache A → Sprache B (übersetzen) | „übersetzen", „Lokalisierung", „mehrsprachig" |
| **Comprehend** | Text → Insights (NLP/verstehen) | „Sentiment", „Entitäten", „Themen", „Text analysieren" |
| **Transcribe** | Audio → Text (Speech-to-Text) | „Transkription", „Untertitel", „Anruf zu Text" |
| **Polly** | Text → Audio (Text-to-Speech) | „vorlesen", „Sprachausgabe", „lebensechte Stimme" |
| **Lex** | Konversation (Chatbot/Voicebot) | „Chatbot", „Intents/Slots", „wie Alexa" |

**Die Falle:** Transcribe (🎤→📄) und Polly (📄→🔊) sind exakte Gegenstücke — die Prüfung vertauscht sie gern. **Merksatz: Polly Plappert (Text→Stimme), Transcribe Tippt mit (Stimme→Text).** Translate bleibt Text↔Text über die Sprachgrenze; Comprehend versteht Text, erzeugt aber keine neue Sprache/Audio.

> **💡 Merksatz:** **Polly Plappert · Transcribe Tippt · Translate übersetzt · Comprehend versteht · Lex chattet.** Richtung ist die halbe Antwort.

## 🎯 Matrix (c): Fraud Detector vs. GuardDuty — Sicherheit vs. KI

| | **Fraud Detector** | **GuardDuty** |
|---|---|---|
| Schützt vor | Betrug durch **App-Endnutzer** (Fake-Accounts, Zahlungsbetrug) | Bedrohungen der **AWS-Infrastruktur/-Konten** |
| Datenquelle | eigene historische Transaktionsdaten | CloudTrail, VPC Flow Logs, DNS Logs |
| Kategorie | Machine Learning | Security |
| Signalwort | „betrügerische Bestellung", „Fake-Registrierung", „Online-Zahlungsbetrug" | „kompromittierte Credentials", „Cryptomining", „Malware auf EC2" |

**Merksatz:** Fraud Detector schützt **dein Geschäft** vor betrügerischen Endnutzern; GuardDuty schützt **deine AWS-Umgebung** vor Angreifern.

> **💡 Merksatz:** **Fraud Detector = Endnutzer-Betrug (dein Geschäft); GuardDuty = Infrastruktur-Bedrohung (deine AWS-Umgebung).** Nicht verwechseln.

## 🎯 Matrix (d): Die vier SageMaker-Inference-Optionen

| Option | Latenz | Payload | Muster |
|---|---|---|---|
| **Real-time Endpoint** | Millisekunden, konstant | bis 🔴 25 MB | stetiger, interaktiver Traffic; Endpoint immer an |
| **Serverless Inference** | Cold Starts möglich | bis 4 MB | sporadisch/bursty; skaliert auf 0 |
| **Asynchronous Inference** | Sek–Min (Queue) | bis 1 GB, bis 60 min | große Payloads/lange Verarbeitung; via S3 |
| **Batch Transform** | offline | GB-Datasets | Offline-Vorhersage auf vorliegendem Datenbestand |

> **💡 Merksatz:** stetig+interaktiv → **Real-time**; sporadisch → **Serverless**; große Payload/lange Verarbeitung → **Async**; offline-Massendaten → **Batch Transform**.

## ⚠️ Prüfungs-Knackpunkte

- **11 In-Scope-Dienste** auswendig; **Bedrock/Q** = nicht gelistet, aber real; **Personalize** = out-of-scope.
- Matrix (a): fertig vs. SageMaker vs. Bedrock — die Leitfrage.
- Matrix (b): Sprach-KI-Richtungen (Polly↔Transcribe).
- Matrix (c): Fraud Detector vs. GuardDuty.
- Matrix (d): vier Inference-Optionen nach Latenz/Payload/Muster.
- 🛑 Forecast + Fraud Detector = Legacy (keine Neukunden), aber weiter im Guide; SageMaker heißt jetzt „SageMaker AI".

## 💡 Der eine Satz zum Mitnehmen

**Der ML/KI-Block löst sich über drei Leitfragen: fertige Pizza vs. selbst kochen vs. Haus mieten (AI-Services/SageMaker/Bedrock), die Sprach-Richtung (Polly plappert, Transcribe tippt) und Endnutzer-Betrug vs. Infrastruktur-Bedrohung (Fraud Detector vs. GuardDuty) — plus die vier SageMaker-Inference-Optionen nach Latenz und Payload.**
