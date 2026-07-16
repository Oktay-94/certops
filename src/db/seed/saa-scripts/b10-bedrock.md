---
service: Amazon Bedrock (Orientierung — nicht im Guide-Appendix)
seedKey: saa-c03-script-bedrock
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html
  - https://aws.amazon.com/bedrock/
status: draft
---

# Amazon Bedrock

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Bedrock = das **Kaufhaus für fertige KI-Gehirne / das Edel-Restaurant**: fertige **Foundation Models** (Claude, Llama, Titan/Nova, Stability u. a.) zur sofortigen Miete über **eine API** — kein eigenes Training. Freie Modellauswahl, einfacher „Stecker", und **absoluter Datenschutz**: deine Daten trainieren nie das Basismodell. Unterschied zu SageMaker: SageMaker = selbst mauern (eigenes Modell); Bedrock = fertiges Haus mit dem Schlüssel betreten.

**Wichtige Einordnung:** Bedrock steht **nicht im SAA-C03-Exam-Guide-Appendix** — es ist aber der GenAI-Standarddienst 2024–2026 und taucht real in Fragen auf. Dieses Skript ist **Orientierung**, kein Kern-Prüfungsstoff.

Der SAA vertieft: **das Konzept (ein API-Zugang, viele Modelle), die drei Bausteine (Knowledge Bases/Agents/Guardrails) — und die SageMaker-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Ein API-Zugang, viele austauschbare Foundation Models

**Das Problem:** Eine Firma will generative KI (Textgenerierung, Zusammenfassung, Chatbot) in ihre App bauen — aber ein eigenes LLM zu trainieren ist für 99 % der Firmen unbezahlbar.

**Die Lösung:** **Bedrock** bietet **Foundation Models mehrerer Anbieter** (Anthropic Claude, Meta Llama, Amazon Titan/Nova, Stability AI, Cohere, AI21, Mistral) über **eine einzige, serverlose API** — Modelle sind austauschbar, man wählt je nach Aufgabe. Kein Infrastruktur-Management, Abrechnung per Token (nichts bei idle). Wichtig fürs Skript: nicht die Modell-Liste auswendig lernen (🔴 ändert sich ständig), sondern das **Konzept** — *ein* Zugang, *viele* Modelle, Daten bleiben privat. „generative KI/LLM ohne eigenes Training/Infrastruktur" → Bedrock.

> **💡 Merksatz:** Bedrock = **serverlose API zu vielen austauschbaren Foundation Models** (per-Token, Daten bleiben privat). Konzept > Modell-Liste (🔴 volatil). „generative KI ohne Training" → Bedrock.

### Die drei Bausteine: Knowledge Bases, Agents, Guardrails

**Das Problem:** Ein FM „halluziniert" oder kennt die eigenen Firmendaten nicht, soll aber faktenbasiert antworten und mehrstufige Aufgaben erledigen — und keine unerwünschten Inhalte ausgeben.

**Die Lösung — die drei SAA-relevanten Bausteine:**
- **Knowledge Bases** (Managed **RAG**): verbindet ein FM mit **deinen eigenen Dokumenten** (S3), damit es faktenbasiert antwortet. Signalwort „generative KI auf **eigenen** Firmendaten, ohne selbst zu trainieren" → Bedrock + Knowledge Base.
- **Agents**: das Modell ruft Tools/APIs auf (Action Groups via Lambda) und erledigt **mehrstufige** Aufgaben.
- **Guardrails**: Filter gegen unerwünschte Inhalte/PII (Sicherheits-/Content-Schranken).

> **💡 Merksatz:** **Knowledge Bases** (RAG mit eigenen Daten) · **Agents** (Tools/APIs, mehrstufig) · **Guardrails** (Content-/PII-Filter). „faktenbasiert auf Firmendaten" → Knowledge Base.

### Die Abgrenzungen

**Das Problem:** Bedrock, SageMaker/JumpStart, Kendra und Lex berühren alle „KI".

**Die Lösung:**
- **Bedrock (serverless FM) vs. SageMaker (eigenes Modell auf eigener Compute)**; **JumpStart** = FM auf eigenem Endpoint vs. Bedrock = serverless.
- **Bedrock Knowledge Bases (generative RAG-Antwort) vs. Kendra (NLP-Suche/Fundstellen) vs. OpenSearch (Keyword/Log)**.
- **Bedrock-Chatbot (generativer LLM mit RAG) vs. Lex (Intent-basierter klassischer Bot)**.

Reflex: „generative Antwort/LLM/RAG" → Bedrock; „eigenes Modell trainieren" → SageMaker; „Dokumente durchsuchen (Fundstelle)" → Kendra; „Intent-Chatbot" → Lex.

> **💡 Merksatz:** **Bedrock (serverless GenAI/RAG) vs. SageMaker (eigenes Modell) vs. Kendra (Suche) vs. Lex (Intent-Bot)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Einordnung:** nicht im Guide-Appendix, aber real vorkommend (GenAI-Standard 2024–2026) — Orientierung.
- Konzept: **serverlose API zu vielen austauschbaren Foundation Models**, Daten bleiben privat (🔴 Modell-Liste volatil).
- Drei Bausteine: **Knowledge Bases (RAG)** · **Agents** · **Guardrails**.
- **Bedrock (serverless FM) vs. SageMaker/JumpStart (eigenes Modell/eigener Endpoint) vs. Kendra (Suche) vs. Lex (Intent-Bot)**.
- „generative KI auf eigenen Firmendaten" → Bedrock + Knowledge Base.

## 💡 Der eine Satz zum Mitnehmen

**Bedrock ist der serverlose Zugang zu vielen austauschbaren Foundation Models über eine API — mit Knowledge Bases für RAG auf eigenen Daten, Agents für mehrstufige Aufgaben und Guardrails für Sicherheit — und steht für generative KI ohne eigenes Training, im Gegensatz zu SageMaker (eigenes Modell), Kendra (Suche) und Lex (Intent-Bot).**
