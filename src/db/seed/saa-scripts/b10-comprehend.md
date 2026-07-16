---
service: Amazon Comprehend
seedKey: saa-c03-script-comprehend
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/comprehend/latest/dg/what-is.html
  - https://aws.amazon.com/comprehend/features/
status: draft
---

# Amazon Comprehend

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Comprehend = die **NLP-KI, die den Sinn von Text versteht** — vortrainiert, per API. Liefert **Sentiment** (positiv/negativ/neutral), **Entitäten** (Namen/Orte/Firmen), **Schlüsselwörter/Themen**, **Spracherkennung** und **PII**. **Comprehend Medical** zieht medizinische Infos aus Arztberichten. Kette: Textract zieht Text raus → **Comprehend versteht ihn**. Nicht verwechseln: Translate = übersetzen, Comprehend = verstehen.

Der SAA vertieft: **die NLP-Fähigkeiten + Sprachgrenzen, PII-Redaction, Comprehend Medical — und die Abgrenzungen (Translate/Textract/Macie).**

---

## 🎯 SAA-Vertiefung

### NLP-Insights und eine Sprach-Falle

**Das Problem:** Eine Firma bekommt 50.000 Bewertungen/Monat. Darin steckt, ob Kunden zufrieden sind und worüber sie sich beschweren — aber niemand liest das von Hand.

**Die Lösung:** Comprehend extrahiert per API die **Bedeutung**: **Sentiment** (auch Targeted Sentiment pro Entity), **Entities**, **Key Phrases**, **Language Detection**, **Syntax** und **PII**. Man schickt Text hin, bekommt strukturierte Insights zurück — kein eigenes Modell. Mit **Comprehend Custom** trainiert man optional eigene Klassifikatoren/Entity-Recognizer (AutoML, ohne ML-Expertise).

Prüfbare Detail-Falle (🔴 offiziell): **Language Detection kann ~100 Sprachen**, aber die **Sentiment-Analyse nur 6** (Englisch, Französisch, Deutsch, Spanisch, Italienisch, Portugiesisch). „Sentiment in einer exotischen Sprache" ist also nicht selbstverständlich abgedeckt.

> **💡 Merksatz:** Comprehend = **Sentiment/Entities/Key Phrases/Language/PII** per API; **Comprehend Custom** für eigene Klassifikation. 🔴 Language Detection ~100 Sprachen, **Sentiment nur 6**.

### PII-Redaction und Comprehend Medical

**Das Problem:** Support-E-Mails enthalten personenbezogene Daten, die vor der Weiterverarbeitung/Archivierung entfernt werden müssen — und klinische Notizen enthalten geschützte Gesundheitsdaten (PHI).

**Die Lösung:**
- **PII-Erkennung/Redaction**: Comprehend findet und **redigiert** PII in Freitext (E-Mails, Tickets). Für die redigierte Ausgabe nutzt man einen asynchronen Job.
- **Comprehend Medical**: Spezialvariante, extrahiert medizinische Information und **PHI** (Diagnosen, Medikamente, Dosierungen) aus unstrukturiertem klinischem Text — für Healthcare/HIPAA-Kontexte.

Abgrenzung zu **Macie**: Macie findet PII in **S3-Objekten** (Data Discovery über gespeicherte Dateien); Comprehend erkennt/redigiert PII in **beliebigem Text**, den man per API schickt. „PII in S3-Buckets scannen" → Macie; „PII in Freitext erkennen/redigieren" → Comprehend.

> **💡 Merksatz:** **Comprehend PII** = erkennen/redigieren in Freitext; **Comprehend Medical** = PHI aus klinischem Text. Abgrenzung: **Macie = PII in S3-Objekten**, Comprehend = PII in beliebigem Text.

### Die Kette und die Nachbar-Abgrenzungen

Comprehend steht oft in einer **Kette**: Scan in S3 → **Textract** (Text rausziehen) → **Comprehend** (Sinn verstehen) → automatische Reaktion (Ticket als dringend markieren). Die Abgrenzungen:
- **Textract** = Text **herausziehen** (OCR + Struktur). **Comprehend** = Sinn **verstehen**.
- **Translate** = **übersetzen** (Sprache A→B), Comprehend versteht/analysiert nur.

🛑 Aktualität: Topic Modeling, Event Detection und Prompt Safety sind ab 30.04.2026 für Neukunden geschlossen (Kern-APIs wie Sentiment/Entities/PII bleiben); AWS verweist auf Bedrock. Die klassische Prüfungsaussage „Comprehend = NLP/verstehen" bleibt gültig.

> **💡 Merksatz:** Kette **Textract (rausziehen) → Comprehend (verstehen)**; **Translate übersetzt**, Comprehend versteht. 🛑 Topic Modeling/Event Detection ab 30.04.2026 keine Neukunden.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Sentiment/Stimmung", „NLP", „Entitäten/Schlüsselwörter", „Kundenfeedback auswerten", „PII in Text" → Comprehend.
- 🔴 Language Detection ~100 Sprachen, **Sentiment nur 6**.
- **Comprehend PII (Freitext) vs. Macie (S3-Objekte)**; **Comprehend Medical** = PHI.
- Kette **Textract → Comprehend**; **Translate (übersetzen) vs. Comprehend (verstehen)**.
- 🛑 Topic Modeling/Event Detection/Prompt Safety ab 30.04.2026 keine Neukunden.

## 💡 Der eine Satz zum Mitnehmen

**Comprehend ist die NLP-KI, die den Sinn von Text versteht — Sentiment, Entitäten, Themen und PII per API, mit Comprehend Medical für PHI; es steht oft hinter Textract in der Kette und ist klar abzugrenzen von Translate (übersetzen) und Macie (PII in S3-Objekten statt Freitext).**
