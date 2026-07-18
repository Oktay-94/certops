---
nr: 10
title: "AWS Batch · EC2 GPU · S3 — nächtliches Rendering als Job-Queue"
services:
  - AWS Batch
  - EC2 GPU (p-Familie)
  - EC2 Spot
  - Amazon S3
  - Fargate (Abgrenzung)
signalwords:
  - naechtlicher Batch-Lauf
  - GPU-Jobs in einer Queue
  - hunderte unabhaengige Jobs
  - kein Cluster verwalten
  - kostenoptimal, unterbrechbar
domain: "D4 (Cost-Optimized) · D3 (High-Performing) — Compute/Batch"
assets:
  - battle_card_10.svg
  - battle_card_10.png
  - battle_card_10.pdf
status_note: "Fargate unterstützt keine GPUs (AWS-Doku, geprüft 17.07.2026). GPU-Jobs brauchen ein EC2-Compute-Environment mit NVIDIA-Instanzen und GPU-optimiertem AMI."
---

## Szenario

Ein Animationsstudio rendert jede Nacht hunderte **unabhängige 3D-Szenen**.
Jeder Job braucht **GPU-Leistung**, läuft je nach Szene Minuten bis Stunden und
darf ruhig **unterbrochen und wiederholt** werden. Tagsüber wird nicht
gerendert — für einen dauerhaft laufenden GPU-Cluster will niemand zahlen. Das
Team will **keine Server verwalten**, sondern nur Jobs abschicken.

## Ablauf

1. **Jobs einreichen:** Das Render-Team schickt die Jobs per `submit-job` an
   **AWS Batch** — gebündelt für den Nachtlauf, ohne vorher Infrastruktur
   anzufassen.
2. **Job Queue → Dispatch:** Die **Batch Job Queue** hält die Jobs mit
   **Priorität**, **Retry**-Regeln und **Dependencies**. Batch startet im
   **Managed Compute Environment (Typ EC2)** genau so viele Instanzen, wie die
   Warteschlange braucht.
3. **Input aus S3:** Der Container-Job zieht Szenen und Texturen aus dem
   **S3-Input-Bucket**. S3 ist der zentrale, entkoppelte Datenspeicher — die
   Instanzen bleiben zustandslos.
4. **GPU + Spot:** Gerendert wird auf **EC2-GPU-Instanzen der p-Familie**
   (NVIDIA, GPU-optimiertes AMI). Weil Rendering **unterbrechbar** ist, läuft die
   Kapazität auf **Spot** — wird eine Instanz zurückgeholt, **retryt Batch den
   Job** automatisch.
5. **Output nach S3:** Die fertigen Frames landen im **S3-Output-Bucket**, per
   **Lifecycle-Regel** später günstig ins Archiv (Glacier-Klassen).

Nach dem letzten Job fährt Batch das Compute Environment auf **0 Instanzen**
herunter — tagsüber entstehen **keine GPU-Kosten**.

## Prüfungs-Kernsatz

**AWS Batch = Job-Queue + managed Scaling für Stapel-Jobs; GPUs gibt es nur im
EC2-Compute-Environment — Fargate kann kein GPU.**

## Klassiker-Fallen

- **Fargate für GPU-Jobs:** Klingt nach „noch weniger Verwaltung", ist aber
  falsch — **Fargate unterstützt keine GPUs**. Für Rendering/Training bleibt nur
  das **EC2**-Compute-Environment. (Fargate ist ok für kurze CPU-Jobs.)
- **Lambda für lange Renders:** Lambda hat **15 Minuten** Timeout und keine GPU —
  für stundenlange GPU-Jobs prinzipiell ungeeignet.
- **Dauerhafter EC2-/EKS-Cluster:** Funktioniert technisch, verletzt aber die
  Kostenvorgabe. Kern von Batch ist **minvCpus 0** → keine Leerlaufkosten.
- **Spot ohne Retry-Denken:** Spot ist hier **richtig**, weil Batch fehlgeschlagene
  Jobs erneut einplant. Bei nicht wiederholbaren Jobs (harte Deadline, kein
  Checkpoint) wäre On-Demand die Antwort.
- **EFS statt S3 als Reflex:** Ein gemeinsames Dateisystem ist nur nötig, wenn
  Jobs **wirklich** POSIX-Semantik brauchen; für „Input rein, Output raus" ist
  **S3** der günstigere, entkoppelte Weg.
