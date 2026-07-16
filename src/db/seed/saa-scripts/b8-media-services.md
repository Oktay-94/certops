---
service: Media Services (Kinesis Video Streams & Elastic Transcoder)
seedKey: saa-c03-script-media-services
batch: B8
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/kinesisvideostreams/latest/dg/what-is-kinesis-video.html
  - https://docs.aws.amazon.com/kinesisvideostreams-webrtc-dg/latest/devguide/what-is-kvswebrtc.html
  - https://docs.aws.amazon.com/elastictranscoder/latest/developerguide/introduction.html
status: draft
---

# Media Services

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Zwei Media-Dienste im SAA-C03-Scope: **Kinesis Video Streams** (Video-/Audioströme von Kameras/Drohnen in die Cloud für Wiedergabe, Analyse, ML — z. B. mit Rekognition) und **Elastic Transcoder** (Video-Transcoding/Formatkonvertierung). Beide sind Randthemen — es geht um sichere Erkennung ihrer Signalwörter.

Der SAA testet vor allem: **Video-Ingestion + ML → Kinesis Video Streams**, WebRTC für Zwei-Wege-Video, und die Deprecation-Lage bei Elastic Transcoder.

---

## 🎯 SAA-Vertiefung

### Kinesis Video Streams: Video von Geräten für Analyse/ML

**Das Problem:** Ein Unternehmen hat tausende Überwachungskameras und will die Videoströme sicher in die Cloud bringen, um darauf Computer Vision (Gesichts-/Objekterkennung) laufen zu lassen und sie wiederzugeben.

**Die Lösung:** **Kinesis Video Streams** nimmt Video-/Audio-(und andere time-encoded)-Ströme von verbundenen Geräten auf, provisioniert und **skaliert die Infrastruktur automatisch**, speichert verschlüsselt und indiziert. Der Analytics-Hebel: **Integration mit Amazon Rekognition Video** für Computer Vision (Gesichts-, Objekt-, Personenerkennung) und mit SageMaker/ML-Frameworks. Wiedergabe über **HLS/DASH**. Signalwort „**Video von Kameras/Geräten** in die Cloud für Analyse/ML" → Kinesis Video Streams (nicht Kinesis Data Streams, das für generische Daten-Records, nicht für Video, gebaut ist).

Für **Zwei-Wege-Video** in Echtzeit (Video-Chat, Gegensprechanlage) gibt es **KVS WebRTC**: ultra-low-latency (sub 1 s) Peer-to-Peer-Media mit managed Signaling/TURN/STUN. „bidirektionales Live-Video, sehr niedrige Latenz" → KVS WebRTC (nicht HLS, das höhere Latenz hat).

> **💡 Merksatz:** **Kinesis Video Streams** = Video/Audio von Geräten in die Cloud → Analyse/ML (**Rekognition**), Wiedergabe HLS/DASH. **WebRTC** = bidirektionales Ultra-low-latency-Video. „Video von Kameras für ML" → KVS, nicht Data Streams.

### Elastic Transcoder: Transcoding — mit Deprecation-Hinweis

**Das Problem:** Hochgeladene Videos sollen in verschiedene Formate/Auflösungen für unterschiedliche Endgeräte konvertiert werden.

**Die Lösung im SAA-Kontext:** **Elastic Transcoder** ist AWS' Video-Transcoding-Dienst (Format-/Auflösungskonvertierung für VOD). Signalwort „**Video transcodieren / in andere Formate konvertieren**" → Elastic Transcoder (im SAA-C03-Scope). 🛑 **Aktualität:** In der Praxis ist Elastic Transcoder **abgekündigt** (Support endete Nov 2025); Nachfolger ist **AWS Elemental MediaConvert** — dieser ist aber **nicht** im SAA-C03-Scope. Für Prüfungsfragen bleibt daher Elastic Transcoder die „richtige" Media-Transcoding-Antwort; MediaConvert nur als Praxis-Randnotiz kennen.

> **💡 Merksatz:** **Elastic Transcoder** = Video-Transcoding (SAA-Scope-Antwort). 🛑 In der Praxis abgekündigt (Nachfolger MediaConvert, aber **nicht** im Scope) — für die Prüfung bleibt Elastic Transcoder die Antwort.

---

## ⚠️ Prüfungs-Knackpunkte

- **Kinesis Video Streams** = Video/Audio von Geräten → Analyse/ML (**Rekognition Video**), Wiedergabe HLS/DASH; auto-skalierend, verschlüsselt.
- **KVS WebRTC** = bidirektionales Ultra-low-latency-Video (sub 1 s), managed Signaling/TURN/STUN.
- „Video von Kameras für ML" → **KVS** (nicht Kinesis **Data** Streams, das ist für generische Records).
- **Elastic Transcoder** = Video-Transcoding (SAA-Scope-Antwort); 🛑 praktisch abgekündigt, Nachfolger MediaConvert (nicht im Scope).

## 💡 Der eine Satz zum Mitnehmen

**Kinesis Video Streams bringt Video von Geräten in die Cloud für Analyse und ML (mit Rekognition, WebRTC für Zwei-Wege-Video), und Elastic Transcoder bleibt im SAA-C03-Scope die Transcoding-Antwort — auch wenn es in der Praxis längst von MediaConvert abgelöst ist.**
