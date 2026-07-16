---
service: Amazon SageMaker (AI)
seedKey: saa-c03-script-sagemaker
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html
  - https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model-options.html
  - https://aws.amazon.com/about-aws/whats-new/2024/12/next-generation-amazon-sagemaker/
status: draft
---

# Amazon SageMaker (AI)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> SageMaker = die **komplette Werkstatt/Großküche**, in der man **eigene** ML-Modelle von Grund auf baut, trainiert und betreibt — volle Kontrolle, für Data Scientists/Entwickler. Drei Stationen: **Build** (Jupyter Notebook, Daten aufbereiten), **Train** (mietet automatisch GPU-Server, trainiert, schaltet sie wieder ab), **Deploy** (Modell als **Endpoint** live). Killer-Leitlinie: **maßgeschneidertes Modell → SageMaker (Küche); fertige Standardfunktion per API → fertiger KI-Dienst (Pizza).**

Der SAA vertieft: **die Komponenten (JumpStart/Autopilot/Feature Store/Pipelines), die vier Inference-Optionen, das Rebranding — und die Bedrock-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Die Plattform-Komponenten

**Das Problem:** „Ein Modell bauen" umfasst Labeling, Feature-Engineering, Algorithmuswahl, Training, Deployment und Monitoring — jeden Schritt einzeln zu bauen ist aufwendig.

**Die Lösung — die managed Komponenten (Auswahl):**
- **Studio**: web-basierte ML-IDE.
- **Autopilot**: **AutoML** — automatisiert Modellbau/Training/Tuning end-to-end.
- **JumpStart**: vortrainierte Open-Source-Modelle **und Foundation Models** (Llama, Falcon, Stable Diffusion, Hugging Face), deploybar auf eigenen Endpoints.
- **Feature Store**: zentrales Repository für Features (Training + Inference).
- **Model Monitor**: erkennt Drift im Produktivmodell.
- **Pipelines**: MLOps-Workflow-Orchestrierung.
- **Canvas**: No-Code-ML (übernimmt u. a. Zeitreihen-Forecasting als Forecast-Nachfolger).

„eigenes Modell mit voller Kontrolle bauen/trainieren/deployen" → SageMaker.

> **💡 Merksatz:** **Studio** (IDE), **Autopilot** (AutoML), **JumpStart** (vortrainierte/FM-Modelle auf eigenem Endpoint), **Feature Store**, **Model Monitor** (Drift), **Pipelines** (MLOps), **Canvas** (No-Code).

### Die vier Inference-Optionen

**Das Problem:** Ein trainiertes Modell muss bereitgestellt werden — mal interaktiv in Millisekunden, mal offline über Gigabytes, mal nur sporadisch.

**Die Lösung — vier Deploy-Optionen (prüfbar nach Latenz/Payload/Muster):**
- **Real-time Endpoint**: Millisekunden, konstanter Traffic; Payload bis 🔴 25 MB; Endpoint immer an (skaliert nicht auf 0).
- **Serverless Inference**: sporadischer/bursty Traffic, Cold Starts möglich, Payload bis 4 MB; **skaliert auf 0**.
- **Asynchronous Inference**: große Payloads (bis 1 GB) / lange Verarbeitung (bis 60 min), Request/Response über S3, Queue.
- **Batch Transform**: offline-Vorhersage auf großem, bereits vorliegendem Datenbestand; kein persistenter Endpoint.

Reflex: stetig+interaktiv → Real-time; sporadisch → Serverless; große Payload/lang → Async; offline-Massendaten → Batch Transform.

> **💡 Merksatz:** **Real-time** (stetig, ms, 25 MB) · **Serverless** (sporadisch, skaliert auf 0, 4 MB) · **Async** (große Payload/lang, S3-Queue, 1 GB) · **Batch Transform** (offline-Massendaten).

### Rebranding und die Bedrock-Abgrenzung

🛑 **Aktualität:** Seit re:Invent 2024 heißt der Dienst **„Amazon SageMaker AI"** (Build/Train/Deploy); die „next generation of SageMaker" ist eine übergreifende Plattform mit **Unified Studio**, Lakehouse und Catalog. Für die Prüfung bleibt SageMaker der Dienst zum **eigenen Modellbau**.

Die **Bedrock-Abgrenzung**:
- **SageMaker** = **eigenes** Modell bauen/trainieren/deployen, volle Kontrolle (Weights, VPC, Fine-tuning), Modell läuft auf **deiner** Compute (Endpoint kostet auch idle).
- **Bedrock** = **Foundation Models** serverless über API (per-Token, nichts bei idle), minimal Infrastruktur — für generative KI.
- **JumpStart vs. Bedrock**: beide bieten FMs; JumpStart = FM auf eigenem Endpoint/eigener Compute (Kontrolle/Data Sovereignty), Bedrock = serverless FM.

Reflex: „eigenes Modell/eigene Daten/volle Kontrolle" → SageMaker; „generative KI/LLM serverless" → Bedrock.

> **💡 Merksatz:** 🛑 „SageMaker AI" (Rebranding). **SageMaker (eigenes Modell, eigene Compute) vs. Bedrock (serverless FM)**; **JumpStart** = FM auf eigenem Endpoint vs. Bedrock = serverless.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „eigenes/custom ML-Modell bauen/trainieren/deployen", „ML-Lebenszyklus", „Data Scientist", „Notebook/Endpoint" → SageMaker.
- Komponenten: **Autopilot** (AutoML), **JumpStart** (FMs auf eigenem Endpoint), **Feature Store**, **Model Monitor**, **Pipelines**, **Canvas**.
- Vier Inference-Optionen: **Real-time / Serverless / Async / Batch Transform** nach Latenz/Payload/Muster.
- 🛑 Rebranding „SageMaker AI"; **SageMaker (eigenes Modell) vs. Bedrock (serverless FM)**; **JumpStart vs. Bedrock**.
- Leitlinie: maßgeschneidert → SageMaker; fertige Funktion → AI-Service.

## 💡 Der eine Satz zum Mitnehmen

**SageMaker (AI) ist die Werkstatt für eigene ML-Modelle über den ganzen Lebenszyklus — Build, Train, Deploy mit vier Inference-Optionen von Real-time bis Batch Transform — und grenzt sich klar ab: eigenes Modell auf eigener Compute heißt SageMaker, serverlose Foundation Models heißen Bedrock.**
