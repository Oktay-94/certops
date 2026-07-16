---
service: Amazon Polly
seedKey: saa-c03-script-polly
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/polly/latest/dg/what-is.html
  - https://docs.aws.amazon.com/polly/latest/dg/neural-voices.html
status: draft
---

# Amazon Polly

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Polly = **Text → Sprache** (Text-to-Speech), fertiger API-Dienst — verwandelt geschriebenen Text in natürlich klingende Stimme. Für **Vorlese-Funktionen, Hörbücher, Telefonansagen**. Das **exakte Gegenstück zu Transcribe** (Sprache→Text). Merksatz: **Polly Plappert (Text→Stimme), Transcribe Tippt mit (Stimme→Text).** Eselsbrücke: ein Papagei (Polly the Parrot) spricht.

Der SAA vertieft: **Neural TTS, SSML, Lexicons, Speech Marks — und die Transcribe-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Standard vs. Neural TTS

**Das Problem:** Eine E-Learning-App soll Texte vorlesen — aber die Roboterstimme klingt unnatürlich und schreckt Nutzer ab.

**Die Lösung:** Polly bietet mehrere **Engines**: **Standard** (concatenative) und **Neural (NTTS)** — Letztere nutzt ein Sequence-to-Sequence-Netz und klingt deutlich natürlicher/lebensechter (dazu Long-Form und Generative). Ausgabe als Audio-Stream (MP3/OGG/PCM). „lebensechte/natürliche Stimme" → Neural (NTTS). Alexa nutzt Polly-Technologie.

> **💡 Merksatz:** **Standard** vs. **Neural (NTTS)** — Neural klingt natürlicher/lebensecht. Ausgabe MP3/OGG/PCM. „lebensecht" → Neural.

### SSML, Lexicons und Speech Marks

**Das Problem:** Der Markenname wird falsch ausgesprochen, an der falschen Stelle wird nicht pausiert, und für eine Animation muss man wissen, wann welches Wort gesprochen wird.

**Die Lösung — drei Kontroll-Features:**
- **SSML** (Speech Synthesis Markup Language, XML): steuert Aussprache, Pausen, Sprechtempo, Tonhöhe, Betonung, Newscaster-Stil.
- **Lexicons (Custom Lexicons)**: definieren die Aussprache von Markennamen/Akronymen/Fremdwörtern (gilt automatisch für alle Requests).
- **Speech Marks**: JSON-Metadaten, die Wörter/Sätze auf **Timestamps** mappen — für Lip-Sync, Karaoke-Highlighting, Animationen.

Reflex: „Aussprache/Pausen steuern" → SSML; „Markenname korrekt aussprechen" → Lexicon; „Wort-Timing für Lip-Sync" → Speech Marks.

> **💡 Merksatz:** **SSML** (Aussprache/Pausen/Tempo), **Lexicons** (Marken-/Fachwort-Aussprache), **Speech Marks** (Wort-Timestamps für Lip-Sync).

### Die Transcribe-Abgrenzung und die Kette

**Das Problem:** Polly und Transcribe werden gern vertauscht.

**Die Lösung:** Exakte Gegenstücke — **Polly** = Text → Audio (📄→🔊), **Transcribe** = Audio → Text (🎤→📄). In der Sprach-Kette (Voicebot) ist Polly der **letzte** Schritt: Kunde spricht → Transcribe → Lex (versteht) → **Polly** spricht die Antwort. Reflex: „Text vorlesen/Sprachausgabe erzeugen" → Polly; „Gesprochenes mitschreiben" → Transcribe.

> **💡 Merksatz:** **Polly (Text→Stimme) ↔ Transcribe (Stimme→Text)**; Polly ist der letzte Schritt der Kette **Transcribe → Lex → Polly**. „vorlesen" → Polly.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „vorlesen", „Sprachausgabe", „lebensechte Stimme", „Text-to-Speech", „Telefonansage" → Polly.
- **Standard vs. Neural (NTTS)**; Ausgabe MP3/OGG/PCM.
- **SSML** (Aussprache/Pausen), **Lexicons** (Marken-Aussprache), **Speech Marks** (Wort-Timestamps/Lip-Sync).
- **Polly (Text→Stimme) ↔ Transcribe (Stimme→Text)**; Kette Transcribe→Lex→Polly.

## 💡 Der eine Satz zum Mitnehmen

**Polly verwandelt Text in lebensechte Sprache — Neural TTS für natürliche Stimmen, SSML und Lexicons für Aussprachekontrolle, Speech Marks für Lip-Sync — und ist das exakte Gegenstück zu Transcribe: Polly plappert, Transcribe tippt mit.**
