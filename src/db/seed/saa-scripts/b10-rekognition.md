---
service: Amazon Rekognition
seedKey: saa-c03-script-rekognition
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/rekognition/latest/dg/what-is.html
  - https://docs.aws.amazon.com/rekognition/latest/dg/streaming-video.html
  - https://aws.amazon.com/rekognition/content-moderation/
status: draft
---

# Amazon Rekognition

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Rekognition = das **fertige Auge**, das per API sagt, was auf Bild/Video zu sehen ist — vortrainiert, kein ML-Wissen. Erkennt **Objekte & Szenen**, **Gesichter** (finden, vergleichen, Attribute), **Text in Bildern** (Nummernschilder, Schilder) und moderiert **anstößige Inhalte** (Riesen-Use-Case Social Media). Praxis: S3-Upload → Lambda → Rekognition-API → Foto blockiert. Eselsbrücke: (Re)cognition = (Wieder-)Erkennen.

Der SAA vertieft: **Content Moderation + A2I, Custom Labels, Video via Kinesis Video Streams — und die Textract-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Content Moderation und die serverlose Pipeline

**Das Problem:** Eine Foto-Plattform bekommt täglich 100.000 Uploads. Jedes Bild manuell auf anstößige Inhalte zu prüfen ist unmöglich — aber ungeprüft durchzulassen auch.

**Die Lösung:** **Content Moderation** markiert automatisch unsichere Inhalte über eine hierarchische Kategorien-Taxonomie mit Confidence Scores (`MinConfidence`-Schwelle einstellbar). Der typische **serverlose Fluss**: S3-Upload triggert **Lambda** → Lambda ruft die Rekognition-API → bei „unangemessen" wird das Bild automatisch blockiert. Für Grenzfälle koppelt man **A2I (Augmented AI)** an: unsichere Ergebnisse (niedrige Confidence) gehen zur **menschlichen Prüfung**, statt blind entschieden zu werden. So reduziert sich die manuelle Prüfmenge drastisch — Menschen sehen nur noch den kleinen unsicheren Rest.

> **💡 Merksatz:** **Content Moderation** (hierarchische Labels + Confidence) im Muster **S3 → Lambda → Rekognition**; unsichere Fälle via **A2I** an menschliche Prüfer. Kein eigenes Modell nötig.

### Custom Labels und Video-Analyse

**Das Problem:** Rekognition erkennt generische Objekte — aber nicht das firmeneigene Maschinenteil oder Logo. Und ein Live-Kamerastream soll auf bekannte Gesichter durchsucht werden.

**Die Lösung — zwei Erweiterungen:**
- **Custom Labels**: Training eines **eigenen** Modells für geschäftsspezifische Objekte/Szenen (Logos, Produktdefekte) — mit wenigen annotierten Bildern, ohne ML-Expertise. Wichtig: Custom Labels ist für **Objekte/Szenen**, nicht für Gesichter/Text/Celebrities.
- **Video**: **Stored Video** (asynchron, Ergebnis via SNS) und **Streaming Video** über **Amazon Kinesis Video Streams** (Stream Processor) — Live-Analyse auf Gesichter/Objekte. Signalwort „Live-Video auf bekannte Gesichter" → Rekognition Video + Kinesis Video Streams.

🛑 **Aktualität:** Rekognition **Streaming Video Analysis** und **Batch Image Content Moderation** sind ab **30.04.2026 für Neukunden** nicht mehr verfügbar (Bestandskunden weiter). Übrige Features unberührt.

> **💡 Merksatz:** **Custom Labels** = eigenes Modell für spezifische Objekte (nicht Gesichter/Text). **Video** via **Kinesis Video Streams** (Streaming) bzw. asynchron (Stored). 🛑 Streaming/Batch-Moderation ab 30.04.2026 keine Neukunden.

### Die Textract-Abgrenzung

**Das Problem:** Sowohl Rekognition (`DetectText`) als auch Textract „lesen Text". Wann welches?

**Die Lösung:**
- **Rekognition DetectText** = Text in **Szenen/natürlichen Bildern** (Straßenschild, Nummernschild, Text auf Produktverpackung im Foto) — nur Text + Bounding Box, **keine** Struktur.
- **Textract** = Text **und Struktur** aus **Dokumenten** (Formulare, Tabellen, Key-Value-Paare, Rechnungen, Ausweise).

Reflex: „Text im Foto/in der Szene" → Rekognition; „Formular/Tabelle/Dokument strukturiert" → Textract.

> **💡 Merksatz:** **Rekognition DetectText = Text in Szenen/Bildern** (keine Struktur); **Textract = Text + Struktur aus Dokumenten**. „Straßenschild" → Rekognition, „Rechnung/Formular" → Textract.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Bilder/Videos analysieren", „Gesichtserkennung/-vergleich", „Objekterkennung", „Content Moderation", „Text in Bildern" → Rekognition (fertig, kein SageMaker).
- **Content Moderation** im Muster **S3 → Lambda → Rekognition**; unsichere Fälle via **A2I** an Menschen.
- **Custom Labels** = eigenes Objekt-/Szenen-Modell (nicht Gesichter/Text).
- **Video** via **Kinesis Video Streams** (Streaming) / SNS (Stored). 🛑 Streaming + Batch-Moderation ab 30.04.2026 keine Neukunden.
- **Rekognition DetectText (Szenen) vs. Textract (Dokumente/Struktur)**.

## 💡 Der eine Satz zum Mitnehmen

**Rekognition ist das fertige Auge für Bild- und Videoanalyse — Objekte, Gesichter, Text in Szenen und Content Moderation per API, oft im Muster S3→Lambda→Rekognition mit A2I für unsichere Fälle; Text in Dokumenten dagegen ist immer Textract, nicht Rekognition.**
