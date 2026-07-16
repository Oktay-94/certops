---
service: Amazon SQS
seedKey: saa-c03-script-sqs
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html
  - https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
  - https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-fifo-queue-message-identifiers.html
status: draft
---

# Amazon SQS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> SQS = die **geduldige Warteschlange**, die Aufgaben zwischenparkt und Dienste **entkoppelt**. Fällt der Empfänger aus, warten die Nachrichten (bis 14 Tage) — nichts geht verloren; Lastspitzen werden **abgepuffert**. Kernmodell: **1 Nachricht → 1 Empfänger, Pull** (der Verarbeiter holt sich die Arbeit). Klassisches Bild: Queue vor einer **Auto-Scaling-Gruppe** von Workern. Abgrenzung: **SQS = Queue (1→1, Pull), SNS = Megafon (1→viele, Push)**.

Der SAA vertieft: **Standard vs. FIFO mit Zahlen, Visibility Timeout und DLQ als Mechanik, die Größen-Grenze — und wann Kinesis statt SQS.**

---

## 🎯 SAA-Vertiefung

### Standard vs. FIFO: Reihenfolge gegen Durchsatz

**Das Problem:** Ein Zahlungssystem verarbeitet Transaktionen — die Reihenfolge muss stimmen (erst Deckung prüfen, dann abbuchen), und **keine** Transaktion darf doppelt laufen. Eine Standard Queue kann das nicht garantieren.

**Die Lösung — die zwei Typen an ihren harten Eigenschaften:**
- **Standard Queue**: nahezu unbegrenzter Durchsatz, aber **at-least-once** (seltene Duplikate möglich) und **best-effort ordering** (keine garantierte Reihenfolge). Für die meisten Entkopplungsfälle ideal.
- **FIFO Queue**: **exactly-once processing** (keine Duplikate) + **strikte Reihenfolge** — dafür begrenzter Durchsatz. 🔴 Ohne High-Throughput-Mode **300 Nachrichten/s** (bzw. 3.000 mit Batching); 🛑 mit **High-Throughput-Mode bis zu 70.000/s** (regionsabhängig). „Reihenfolge / keine Duplikate" → FIFO.

Zwei FIFO-Konzepte, die geprüft werden: Die **Message Group ID** ist der **Ordering-Scope** — innerhalb einer Gruppe strikt sequentiell, verschiedene Gruppen parallel (so skaliert FIFO trotz Ordering). Die **Message Deduplication ID** (oder Content-based Deduplication per SHA-256-Hash) verhindert Duplikate innerhalb eines **5-Minuten-Fensters**.

> **💡 Merksatz:** **Standard = maximaler Durchsatz, at-least-once, keine Ordering.** **FIFO = exactly-once + strikte Reihenfolge** (🔴 300/s, mit HT-Mode bis 70.000/s). Ordering-Scope = **Message Group ID**, Dedup = **5-Min-Fenster**.

### Visibility Timeout und DLQ: Die Zuverlässigkeits-Mechanik

**Das Problem:** Ein Worker zieht eine Nachricht und stürzt bei der Verarbeitung ab. Wie stellt SQS sicher, dass die Nachricht weder verloren geht noch doppelt verarbeitet wird — und dass eine dauerhaft „giftige" Nachricht nicht ewig kreist?

**Die Lösung — zwei Mechanismen:**
- **Visibility Timeout** (Default 30 s, max **12 h**): Sobald ein Worker eine Nachricht zieht, wird sie für alle anderen **unsichtbar**. Verarbeitet er erfolgreich → er löscht sie. Stürzt er ab (kein Delete) → nach Ablauf des Timeouts wird sie **wieder sichtbar**, ein anderer übernimmt. **Zu kurz → Doppelverarbeitung, zu lang → Verzögerung bei Fehlern.** Das ist die genaue Balance, die Fragen testen.
- **Dead-Letter Queue (DLQ)**: Nach **`maxReceiveCount`** erfolglosen Zustellversuchen (Redrive Policy) wandert die Nachricht in eine separate Auffang-Queue — so blockiert eine kaputte Nachricht nicht das System und kann isoliert analysiert werden.

Wichtiger Grenzfall: Braucht ein Job **länger als 12 h**, hilft kein längeres Visibility Timeout (Limit) — dann gehört die Orchestrierung in **Step Functions**.

> **💡 Merksatz:** **Visibility Timeout** (Default 30 s, max 12 h) verhindert Doppelverarbeitung; abgestürzt → Nachricht wird wieder sichtbar. **DLQ** nach `maxReceiveCount` fängt Gift-Nachrichten. >12 h Verarbeitung → Step Functions.

### Größen-Grenze, Polling und die Kinesis-Abgrenzung

Drei Punkte, die als Distraktoren oder Detailfragen auftauchen:
- **Message Size max 256 KB** — größere Payloads über die **SQS Extended Client Library + S3** (die Nachricht enthält nur einen Pointer aufs S3-Objekt). „Nachricht > 256 KB" → S3 + Extended Client, nicht splitten.
- **Long Polling** (`ReceiveMessageWaitTimeSeconds` bis 20 s) statt Short Polling reduziert leere Antworten und damit **API-Kosten** — Signalwort „leere Abfragen / Kosten senken" → Long Polling.
- **SQS vs. Kinesis Data Streams**: SQS = simple Entkopplung, **1 Consumer pro Nachricht**, Nachricht wird nach Verarbeitung **gelöscht**, kein Replay. Kinesis = Streaming mit **mehreren unabhängigen Consumern**, **Replay** (mehrfaches Lesen), **Ordering pro Shard**. „mehrere Consumer / Replay / Echtzeit-Analyse" → Kinesis; „Task-Queue / ein Worker" → SQS.

> **💡 Merksatz:** **256 KB** max → Größeres via **S3 + Extended Client**. **Long Polling** senkt Kosten. **SQS** (1 Consumer, delete-after-read) vs. **Kinesis** (mehrere Consumer, Replay).

---

## ⚠️ Prüfungs-Knackpunkte

- **Standard** (at-least-once, keine Ordering, unbegrenzt) vs. **FIFO** (exactly-once, strikte Reihenfolge, 🔴 300/s, HT-Mode bis 70.000/s).
- FIFO: **Message Group ID** = Ordering-Scope; **Dedup ID** / Content-based Dedup = 5-Min-Fenster.
- **Visibility Timeout** Default 30 s, max **12 h**; zu kurz → Doppelverarbeitung.
- **DLQ** nach `maxReceiveCount` (Redrive Policy) isoliert Fehler-Nachrichten.
- **256 KB** Grenze → S3 + Extended Client; **Long Polling** (bis 20 s) senkt Kosten.
- **SQS (1 Consumer, delete-after-read) ≠ Kinesis (mehrere Consumer, Replay)**; >12 h → Step Functions.
- Retention Default 4 Tage, max 14; In-flight 🛑 120.000 (seit Nov 2024).

## 💡 Der eine Satz zum Mitnehmen

**SQS entkoppelt über eine Pull-Queue mit genau einem Empfänger pro Nachricht — FIFO bringt strikte Reihenfolge und Exactly-once (zum Preis des Durchsatzes), Visibility Timeout und DLQ sichern die Zuverlässigkeit, und sobald „mehrere Consumer" oder „Replay" fällt, ist es Kinesis statt SQS.**
