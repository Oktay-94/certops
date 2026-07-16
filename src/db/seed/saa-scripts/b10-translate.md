---
service: Amazon Translate
seedKey: saa-c03-script-translate
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/translate/latest/dg/what-is.html
  - https://aws.amazon.com/translate/details/
status: draft
---

# Amazon Translate

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Translate = der **automatische KI-Dolmetscher** — neuronale maschinelle Übersetzung zwischen dutzenden Sprachen, per API, kein ML-Wissen. Für **Lokalisierung** (Websites/Kataloge), **Echtzeit-Übersetzung** (Live-Chat) und **User-Content verstehen** (fremdsprachige Tickets). Abgrenzung im KI-Block: Translate = **übersetzen** (A→B), Comprehend = verstehen, Transcribe = Sprache→Text, Polly = Text→Sprache.

Der SAA vertieft: **Real-time vs. Batch, Custom Terminology/ACT, die Ketten-Integration — und die Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Neuronale Übersetzung, Real-time und Batch

**Das Problem:** Eine App soll international laufen — Produktbeschreibungen in 20 Sprachen, eingehende Bewertungen aus aller Welt, Tickets auf Japanisch. Menschliche Übersetzer sind zu langsam und zu teuer bei laufendem Content.

**Die Lösung:** **Amazon Translate** nutzt **Neural Machine Translation** (kontextsensitiv, ganze Sätze statt Wort-für-Wort). Zwei Modi:
- **Real-time** (`TranslateText`): synchron, für Live-Chat/eingehende Nachrichten.
- **Batch** (asynchron über S3): große Dokumentmengen (Word/PPT/Excel/Text/HTML) unter Formaterhalt.

Die Quellsprache wird automatisch erkannt. 🔴 Offiziell deckt Translate **75 Sprachen / 5.550 Kombinationen** ab. „übersetzen/Lokalisierung/mehrsprachig" → Translate.

> **💡 Merksatz:** **Neural Machine Translation**, **Real-time** (`TranslateText`) vs. **Batch** (S3, Formaterhalt); automatische Quellsprachenerkennung. 🔴 75 Sprachen / 5.550 Kombinationen.

### Custom Terminology und Active Custom Translation

**Das Problem:** Markennamen und Fachbegriffe werden generisch (falsch) übersetzt — der Produktname „Lightning" wird zu „Blitz".

**Die Lösung:**
- **Custom Terminology** (CSV/TMX): erzwingt die korrekte Übersetzung marken-/branchenspezifischer Begriffe — kein Aufpreis.
- **Active Custom Translation (ACT)**: passt Übersetzungen anhand von „parallel data" (Beispielübersetzungen) an, ohne ein Custom-Model zu trainieren — feiner, aber teurer.

„Markennamen/Fachbegriffe konsistent übersetzen" → Custom Terminology (bzw. ACT für stilistische Anpassung).

> **💡 Merksatz:** **Custom Terminology** (CSV/TMX, gratis) erzwingt korrekte Begriffe; **Active Custom Translation** (parallel data) passt den Stil an, ohne Training.

### Die Ketten-Integration und Abgrenzung

Translate ist oft Teil einer **Sprach-Kette** (internationales Callcenter mit Connect): Kunde schreibt Spanisch → **Translate** ins Deutsche → **Comprehend** erkennt Stimmung → Agent antwortet Deutsch → **Translate** zurück ins Spanische. Die Abgrenzung im KI-Block (ähnlich klingend):
- **Translate** = übersetzen (Sprache A → B).
- **Comprehend** = verstehen/analysieren (kein Sprachwechsel).
- **Transcribe** = Audio → Text; **Polly** = Text → Audio.

> **💡 Merksatz:** Translate in der Kette **Translate → Comprehend → (Agent) → Translate**. **Translate übersetzt**, Comprehend versteht, Transcribe/Polly wandeln Audio↔Text.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „übersetzen", „Lokalisierung", „mehrsprachige Inhalte", „fremdsprachige Tickets" → Translate.
- **Real-time** (`TranslateText`) vs. **Batch** (S3, Formaterhalt); Auto-Quellsprachenerkennung; 🔴 75 Sprachen/5.550 Kombinationen.
- **Custom Terminology** (Begriffe erzwingen, gratis) / **Active Custom Translation** (parallel data).
- Abgrenzung: **Translate (übersetzen) vs. Comprehend (verstehen) vs. Transcribe (Audio→Text) vs. Polly (Text→Audio)**.

## 💡 Der eine Satz zum Mitnehmen

**Translate ist der neuronale Dolmetscher zwischen Sprachen — Real-time oder Batch, mit Custom Terminology für konsistente Markennamen — und im Sprach-KI-Block der Dienst fürs Übersetzen (A→B), abzugrenzen von Comprehend (verstehen), Transcribe (Audio→Text) und Polly (Text→Audio).**
