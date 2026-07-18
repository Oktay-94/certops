---
nr: 7
title: "Lambda · SQS · DLQ — Bestellungen entkoppeln und Fehler abfangen"
services:
  - AWS Lambda
  - Amazon SQS
  - SQS Dead-Letter Queue
  - Amazon DynamoDB
  - Lambda Async-DLQ (Abgrenzung)
signalwords:
  - entkoppeln
  - Lastspitzen puffern
  - fehlgeschlagene Nachrichten
  - Dead-Letter-Queue
  - Retry
domains: [D2]
assets:
  - battle_card_7.svg
  - battle_card_7.png
  - battle_card_7.pdf
status_note: "Semantik gegen AWS-Doku geprüft 17.07.2026 (Event Source Mapping, RedrivePolicy, ReportBatchItemFailures)."
---

## Szenario

Ein Bestell-Service erzeugt zur Peak-Zeit **Lastspitzen**. Die Verarbeitung soll
**entkoppelt** werden, damit ein langsamer oder ausfallender Consumer keine
Bestellungen verliert. Nachrichten, die sich **wiederholt nicht** verarbeiten
lassen (Poison Pills), sollen isoliert in einer **Dead-Letter Queue** landen,
statt die Verarbeitung endlos zu blockieren.

## Ablauf

1. **Producer → Queue:** Der Bestell-Service schreibt jede Bestellung in die
   **SQS Order Queue**. Die Queue puffert die Spitze und entkoppelt Producer
   von Consumer — der Producer wartet nie auf die Verarbeitung.
2. **Lambda pollt:** Ein **Event Source Mapping** zieht Batches aus der Queue
   und skaliert die Concurrency mit der Queue-Tiefe. Wichtig: Der Visibility
   Timeout der Queue muss **≥ 6× Lambda-Timeout** sein.
3. **Write:** Lambda verarbeitet den Batch und schreibt die Bestellung nach
   **DynamoDB**. Weil SQS **at-least-once** liefert, muss die Funktion
   **idempotent** sein.
4. **Fehler → zurück in die Queue:** Wirft Lambda einen Fehler oder ist
   gedrosselt, wird der Batch nach Ablauf des Visibility Timeouts wieder
   sichtbar und erneut zugestellt. Mit **ReportBatchItemFailures** kommen nur
   die *fehlgeschlagenen* Nachrichten zurück, nicht der ganze Batch.
5. **Nach maxReceiveCount → DLQ:** Wird eine Nachricht **5×** erfolglos
   zugestellt, verschiebt SQS sie über die **RedrivePolicy der Source-Queue** in
   die **Dead-Letter Queue** (14 Tage Retention, Alarm auf Queue-Depth). Dort
   wird sie ohne Blockade untersucht.

## Prüfungs-Kernsatz

**Die DLQ hängt an der RedrivePolicy der Source-Queue (maxReceiveCount) — nicht
an Lambdas Async-DLQ.**

## Klassiker-Fallen

- **Source-Queue-DLQ ≠ Lambda-Async-DLQ:** Bei einem **SQS-Trigger** (poll-based)
  ist die DLQ die der **Queue**. Lambdas eigene On-Failure-Destination / Async-
  DLQ greift **nur bei asynchronen Invokes** (SNS, EventBridge, direkter async
  Call) — bei SQS niemals. Genau hier fällt die Prüfung gern.
- **SNS statt SQS?** SNS ist **Fan-out** (push an mehrere Abonnenten) und
  **puffert nicht**. Wenn „Lastspitze puffern / entkoppeln" gefragt ist, ist
  **SQS** die Antwort; SNS erst, wenn *mehrere* Systeme *jede* Nachricht brauchen.
- **maxReceiveCount ≥ 5:** zu niedrig → gute Nachrichten landen bei einem
  einzelnen Throttle schon in der DLQ. Deshalb Empfehlung ≥ 5.
- **Ganzer Batch vs. partial:** Ohne `ReportBatchItemFailures` schickt **eine**
  schlechte Nachricht den **kompletten** Batch zurück — die guten werden erneut
  verarbeitet (braucht Idempotenz).
