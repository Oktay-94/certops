---
nr: 64
title: "Callcenter-Pipeline — Transcribe, Translate, Polly"
services: ["Amazon Transcribe Call Analytics", "Amazon Translate", "Amazon Polly", "Amazon S3"]
domains: ["D3"]
signalwords:
  - "transcribe customer calls"
  - "agent and customer sentiment during the call"
  - "redact personally identifiable information from the recording"
  - "translate for a quality assurance team"
  - "read the response back to the caller"
assets:
  svg: "battle_card_64.svg"
  png: "battle_card_64.png"
  pdf: "battle_card_64.pdf"
status_note: |
  QC (scripts/qc.py inkl. Prüfung (e)): 0 Befunde.
  Gemeldet: 7 Boxen, 39 Texte, 16 Segmente, 4 Badges, 1 X-Kreis.
  Aufschlüsselung R5: 16 gemeldete Segmente = 8 reale + 8 Phantom
  (4 Marker in <defs> × 2). Die 8 realen = 6 Pfeilsegmente + 2 X-Striche.
  7 Boxen = 6 Knoten + Footer-Leiste.

  **Planänderung dieses Batches:** Der Geometrieplan führt ab dieser Karte
  die **Footer-Leiste als Box** und prüft jede Knotenbox auf mindestens
  20 px Luft dazu (Abschnitt 2b), außerdem Segmente und Labels gegen die
  Leiste. Anlass war Karte 63, wo eine Box ohne Luft an den Footer stieß
  und weder qc.py noch der Plan das fand. Auf dieser Karte meldete 2b
  für alle sechs Knoten ausreichend Abstand (kleinster Wert: Comprehend
  mit 68,8 px).

  Korrekturrunden — beide VOR dem Zeichnen, keine danach:
  1. "Audio-Stream" ragte in die Anruf-Audio-Box (Korridor nur 96 px).
     Auf "Audio" gekürzt statt die Box zu verschieben — das Label trägt
     die Information auch kürzer.
  2. "zweiter Dienst" überlappte den X-Kreis. Von y=551 auf y=596
     unter den Kreis verschoben.
  3. Footer-Variante 1 (1505,3 px) verworfen, Variante 3 mit 1074,2 px
     gewählt.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie. **Eine musste
  nachgeschnitten werden (Z8)** — zum dritten Mal in diesem Batch mein
  Zonenschnitt, nicht die Zeichnung. Die Zone begann bei y=645 und lag
  damit auf dem Rückweg-Segment s6 (y=655, stroke 3, plus Marker-
  Belegung y 640..670 nach R14). Auf y0=675 korrigiert, danach 0 px.
  Alle vier verwendeten Farben im PNG nachweisbar (Quelle 4793 px,
  Compute 16147, Storage 4342, Verworfen 2189).

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855, aus dem
  SVG gelesen.

  R12-Gegencheck: **null <path> mit stroke.** Alle sechs Verbindungen
  sind <line>; die vier <path> sind Marker-Dreiecke in <defs>.

  R18 Titelband-Kanaldivergenz: 0 px.

  R16 von Hand: zehn Spalte geprüft, acht mit 0 px. Zwei Einzelpixel
  bei "Transkript" (x=733,0) und "Transkript zur QS" (x=944,2) — beide
  exakt auf der berechneten Labelkante, also AA-Säume der Labels selbst,
  17,8 px bzw. 162,5 px von der nächsten Boxkante entfernt. Keine
  Kollision.

  Footer von Hand mit PIL (R3): 1074,2 px, Textende x=1136,2,
  Luft 413,8 px.

  Sichtprüfung (R8): **versucht, fehlgeschlagen.** Zurück kam ein
  leeres Bildobjekt. Rechnerisch vollständig geprüft, aber **nicht
  gesehen**. Freigabe durch Oktay steht aus.
---

# Battle Card 64 — Callcenter-Pipeline

## Szenario

Ein Callcenter betreut Kunden in mehreren Sprachen. Gespräche sollen
transkribiert werden, das Transkript für die deutschsprachige
Qualitätssicherung übersetzt und Standardantworten als Audio ausgegeben
werden. Stimmungsverlauf und PII-Schwärzung sollen ohne zusätzlichen Dienst
kommen.

## Ablauf

**1 — Das Anruf-Audio geht an Transcribe Call Analytics.** Ob Stream oder
Datei ist keine Nebensache: Ein **Audio-Stream** ergibt eine Realtime-
Transkription, eine **Datei in S3** eine Post-Call-Transkription. Beide Wege
liefern unterschiedliche Insights — das ist die zentrale Weiche dieser Karte.

**2 — Call Analytics liefert Transkript, Sentiment und PII-Redaktion in einem
Schritt.** Das ist der eigentliche Punkt: Der Dienst ist auf Callcenter-Audio
zugeschnitten und bringt die Analyse mit. Sentiment kommt pro Sprechsegment
als qualitativer Wert; in der Post-Call-Variante zusätzlich quantitativ pro
Viertel und pro Anruf. PII wird sowohl im Text als auch **in der Audiodatei**
geschwärzt. Der Preis dafür: **Sentiment ist nicht anpassbar** — kein
Training, keine eigenen Kategorien.

**3 — Translate übersetzt das Transkript.** `TranslateText` arbeitet synchron
bis 10.000 Bytes je Aufruf; längere Transkripte werden aufgeteilt oder laufen
als asynchroner Batch-Job. **Custom Terminology** sorgt dafür, dass
Produktnamen und Fachbegriffe nicht wegübersetzt werden — bei Support-Texten
regelmäßig der Unterschied zwischen brauchbar und unbrauchbar.

**4 — Polly spricht die Antwort.** `SynthesizeSpeech` liefert die Audiodaten
direkt im Antwort-Stream. Für lange Texte gibt es stattdessen
`StartSpeechSynthesisTask`, das asynchron nach S3 schreibt und optional per
SNS meldet. Die Engine-Wahl (standard, neural, long-form, generative) bestimmt
Natürlichkeit und verfügbare Stimmen.

**Ergebnis — Transkript und Audio landen in S3.** Von dort liest die
Qualitätssicherung. Der gestrichelte Rückweg zeigt, dass das Transkript
zur Prüfung bereitliegt, nicht dass ein neuer Verarbeitungsschritt beginnt.

**Verworfen — ein zweiter Aufruf an Comprehend.** Der Reflex „Sentiment also
Comprehend" führt hier zu doppelter Arbeit: Call Analytics hat die
Stimmungsanalyse bereits geliefert.

## Prüfungs-Kernsatz

**Transcribe Call Analytics bringt Sentiment und PII-Redaktion mit — Stream
heißt Realtime, Datei heißt Post-Call.**

## Abgrenzungen

- **Transcribe ↔ Transcribe Call Analytics:** Standard-Transcribe liefert das
  Transkript. Call Analytics ist die auf Kundengespräche trainierte Variante
  und liefert zusätzlich Sentiment, Issue Detection, Kategorien,
  Gesprächscharakteristik (Unterbrechungen, Sprechtempo, Nicht-Sprechzeit) und
  generative Zusammenfassungen.
- **Realtime ↔ Post-Call:** nicht nur schnell gegen langsam. Realtime liefert
  Sentiment **qualitativ pro Segment** und erlaubt Alarme auf
  Kategorie-Treffer für Agent-Assist. Post-Call liefert zusätzlich
  **quantitative** Sentiment-Werte pro Viertel und für den Gesamtanruf sowie
  die Gesprächscharakteristik. Post-Call kann über
  `PostCallAnalyticsSettings` aus einem Realtime-Request mit angefordert
  werden.
- **64 ↔ 63:** Auf Karte 63 ist Comprehend die richtige Antwort für Sentiment,
  hier die falsche. Der Unterschied ist der **Eingang**: Freitext gegen
  Callcenter-Audio. Wer Audio verarbeitet, bekommt die Analyse im selben
  Dienst.
- **Call Analytics ↔ Connect Contact Lens:** Contact Lens ist die in Amazon
  Connect eingebaute Variante. Call Analytics ist die API für **fremde**
  Contact Center. Signalwort: „our existing contact center".
- **`SynthesizeSpeech` ↔ `StartSpeechSynthesisTask`:** synchron im Antwort-
  Stream gegen asynchron mit S3-Ziel und optionaler SNS-Meldung. Für lange
  Texte ist die asynchrone Variante nicht schneller, sondern die einzig
  mögliche.

## Klassiker-Fallen

1. **Comprehend für Anruf-Sentiment.** Die häufigste Falle dieser Karte —
   fachlich funktioniert es, ist aber ein überflüssiger zweiter Dienst.
   Antworten mit Call Analytics allein sind einfacher und günstiger.
2. **Standard-Transcribe plus Eigenbau.** Transkript holen und danach
   Sentiment, Kategorien und Redaktion selbst zusammenbauen ist der
   umständliche Weg zum selben Ergebnis.
3. **PII-Redaktion nur im Text.** Call Analytics schwärzt auch die
   **Audiodatei**. Antworten, die nur den Text erwähnen, greifen zu kurz,
   wenn die Aufnahme aufbewahrt wird.
4. **Eigene Sentiment-Kategorien in Call Analytics.** Geht nicht — die
   Sentiment-Analyse ist nicht anpassbar. Wer firmeneigene Kategorien braucht,
   nutzt zusätzlich Custom Classification (siehe Karte 63) oder die
   Kategorienfunktion von Call Analytics auf Basis von Schlüsselphrasen.
5. **Translate ohne Custom Terminology.** Produktnamen werden sonst
   mitübersetzt.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Keiner der drei Dienste ist von den Wartungsmodus-Ankündigungen betroffen.**
  Geprüft gegen die AWS-Lifecycle-Listen vom März und Juni 2026: Transcribe,
  Translate und Polly stehen weder unter Maintenance noch unter Sunset. Das
  ist in diesem Batch erwähnenswert, weil die Karten 61, 62 und 63 jeweils
  einen betroffenen Dienst enthielten.
- **`TranslateText` verarbeitet seit dem 29.12.2022 bis zu 10.000 Bytes**,
  vorher 5.000. **Die Amazon-Translate-FAQ nennt weiterhin 5.000 Bytes**,
  während Quota-Seite und Ankündigung 10.000 nennen — eine Divergenz
  innerhalb der AWS-Quellen selbst. Auf der Karte steht deshalb keine Zahl;
  die aktuelle Angabe ist 10.000 Bytes laut Quota-Seite.
  *Quelle: AWS What's New 29.12.2022; „Guidelines and quotas" (Amazon
  Translate); abweichend: Amazon Translate FAQs.*
- **Polly hat vier Engines**, nicht zwei: standard, neural, **long-form** und
  **generative**. Kursmaterial kennt meist nur standard und neural.
  Einschränkung der generativen Stimmen: **keine Speech Marks**, kein
  Newscaster-Stil.
  *Quelle: AWS-Doku „Generative voices", „Long-form voices".*
- **Sentiment in Call Analytics ist explizit nicht anpassbar** — steht
  wörtlich in der Doku zu Post-Call und Realtime Analytics. Diese Grenze fehlt
  in Übersichten, die Call Analytics nur als „Transcribe mit Extras" führen.

## Nicht bestätigt

- **Zeichengrenze von `SynthesizeSpeech`.** Zwei AWS-Quellen widersprechen
  sich: Die Seite „Long audio files" nennt 3.000 Zeichen, die API-Referenz
  nennt 6.000 gesamt, davon höchstens 3.000 abgerechnet. Beide sind offizielle
  Dokumentation. **Deshalb steht keine Zahl auf der Karte**; die Karte sagt
  nur, dass es für lange Texte den asynchronen Weg gibt.
- **Preise** für Transcribe-Minuten, Translate-Zeichen und Polly-Zeichen
  stehen grundsätzlich nicht auf der Karte.
- **Genaue Liste der Sprachen** je Dienst — sie wächst laufend und ist kein
  Prüfungsstoff.

## Bewusste Vereinfachungen im Diagramm

- **Der Weg vom Anruf zurück zum Kunden fehlt.** Die Karte endet bei der
  Ablage und dem erzeugten Audio; wie die Telefonanlage es abspielt, ist nicht
  ihr Gegenstand.
- **Die Weiche Stream ↔ Datei ist nicht als Verzweigung gezeichnet.** Sie
  steht als Zeile in der Anruf-Audio-Box („Stream oder Datei"), weil beide
  Wege denselben Dienst erreichen und sich erst in den gelieferten Insights
  unterscheiden.
- **Zwischen Translate und Polly liegt in der Praxis eine Anwendungslogik**,
  die entscheidet, welche Antwort gesprochen wird. Die Karte zeigt den
  Datenweg, nicht die Entscheidung.
- **Keine IAM-Rollen, kein SNS-Topic für den asynchronen Polly-Weg.**

## Farbkonventionen dieser Karte

| Element | Rolle | Farbe |
|---|---|---|
| Anruf-Audio | **Quelle** | Blau `#2E6BE6` |
| Call Analytics | **Compute** | Orange `#D97706` |
| Translate | **Compute** | Orange `#D97706` |
| Polly | **Compute** | Orange `#D97706` |
| Ablage | **Storage** | Grün `#3F8624` |
| Comprehend (verworfen) | Compute-Rand, Ablehnung via X | Orange + Rot `#C7161D` |

Wie Karte 63 ist auch diese Karte überwiegend orange, und aus demselben Grund:
Sie erklärt eine **Verarbeitungskette**, nicht einen Weg über Speicherstufen.
Drei Dienste transformieren nacheinander denselben Inhalt — Audio wird Text,
Text wird übersetzter Text, Text wird wieder Audio. Alle drei sind Compute.

Der Rückweg zur Qualitätssicherung trägt **Storage-Grün**, weil er von der
Ablage ausgeht und nicht von einem verarbeitenden Dienst: Die Farbe folgt der
Quelle des Pfeils, nicht seinem Zweck.
