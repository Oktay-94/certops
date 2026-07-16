---
service: Amazon Kinesis (Data Streams & Data Firehose)
seedKey: saa-c03-script-kinesis
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/streams/latest/dev/key-concepts.html
  - https://docs.aws.amazon.com/streams/latest/dev/enhanced-consumers.html
  - https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html
status: draft
---

# Amazon Kinesis

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Kinesis ist im CLF-Kurs Randthema — hier die Einordnung: Kinesis verarbeitet **Streaming-Daten in (nahezu) Echtzeit**. **Data Streams** = echtes Streaming mit **Shards**, mehreren Consumern und Replay; **Data Firehose** = managed **Delivery** von Streaming-Daten nach S3/Redshift/OpenSearch/Splunk, ohne Code. Kern-Abgrenzung: **Kinesis (Streaming, mehrere Consumer, Replay) vs. SQS (Entkopplung, 1 Consumer, delete-after-read)**.

Der SAA vertieft: **Streams-Mechanik (Shards, Ordering, Enhanced Fan-Out), Firehose-Delivery — und die Abgrenzung zu SQS.**

---

## 🎯 SAA-Vertiefung

### Data Streams: Shards, Ordering und mehrere Consumer

**Das Problem:** Ein Clickstream mit hunderttausenden Events/s soll in Echtzeit von **mehreren** unabhängigen Systemen verarbeitet werden (Live-Dashboard, Betrugserkennung, Archivierung) — und man will Events bei Bedarf **erneut** durchlaufen lassen.

**Die Lösung:** **Kinesis Data Streams** ist genau dafür gebaut. Ein Stream besteht aus **Shards**; der **Partition Key** bestimmt, in welchen Shard ein Record fällt, und **innerhalb eines Shards** ist die Reihenfolge garantiert. Provisioned Mode: pro Shard **1 MB/s bzw. 1.000 Records/s Write, 2 MB/s Read**. 🛑 **On-demand Mode** skaliert automatisch (bis 200 MB/s, in bestimmten Regionen bis 10 GB/s). Die entscheidenden Streaming-Eigenschaften:
- **Mehrere Consumer** lesen denselben Stream unabhängig; mit **Enhanced Fan-Out** bekommt jeder Consumer **dedizierte 2 MB/s pro Shard** (🔴 ~70 ms Latenz, Blog-Wert) statt sich das Limit zu teilen.
- **Replay**: Records bleiben in der **Retention** (Default 24 h, bis **365 Tage**) und können **mehrfach** gelesen werden — anders als bei SQS, wo nach Verarbeitung gelöscht wird.

Das ist das Signalwort-Muster „Echtzeit-Streaming, mehrere Consumer, Replay, Ordering" → Data Streams.

> **💡 Merksatz:** **Data Streams = Shards** (Partition Key → Shard, Ordering pro Shard), **mehrere Consumer** (Enhanced Fan-Out = dedizierte 2 MB/s), **Replay** (Retention bis 365 Tage). 🛑 On-demand skaliert automatisch.

### Data Firehose: Managed Delivery ohne Code

**Das Problem:** Streaming-Logs sollen mit **minimalem Aufwand** in S3 und OpenSearch landen — niemand will Consumer-Code, Shard-Management oder Skalierung betreiben.

**Die Lösung:** **Amazon Data Firehose** (früher Kinesis Data Firehose) ist **fully managed, kein Code**: Es liefert Streaming-Daten **near-real-time** an **S3, Redshift, OpenSearch, Splunk, Snowflake** (u. a. HTTP-Endpunkte). Es **puffert** (Buffer Size / Interval, Default ~300 s; 🛑 **Zero Buffering** seit Dez 2023 für Sekunden-Latenz) und kann optional per **Lambda transformieren**. Der Preis der Einfachheit: **kein Replay** (Firehose speichert nichts), kein Custom-Consumer, keine Sub-Sekunden-Streaming-Semantik. Signalwort „Streaming-Daten einfach nach S3/Redshift/OpenSearch laden, ohne Code" → Firehose.

> **💡 Merksatz:** **Firehose = managed Delivery** (S3/Redshift/OpenSearch/Splunk/Snowflake), **kein Code**, Buffering (🛑 Zero Buffering möglich), optional Lambda-Transform — **kein Replay**. „einfach nach S3 laden" → Firehose.

### Die Abgrenzung: Kinesis vs. SQS

**Das Problem:** SQS und Kinesis Data Streams bewegen beide viele Nachrichten. Wann welches?

**Die Lösung:** Die Frage ist **Task-Queue vs. Stream**:
- **SQS**: simple Entkopplung, **1 Consumer pro Nachricht**, Nachricht wird nach Verarbeitung **gelöscht**, kein Replay, keine Ordering (außer FIFO). „decouple, task queue, ein Worker".
- **Kinesis Data Streams**: **mehrere unabhängige Consumer** desselben Streams, **Replay**, **Ordering pro Shard**, Retention. „real-time analytics, mehrere Consumer, Replay, streaming".

Der Reflex: „mehrere Systeme lesen dieselben Daten / Replay / Echtzeit-Analyse" → Kinesis; „ein Worker arbeitet Aufgaben ab / entkoppeln" → SQS. Und **Firehose vs. Data Streams**: braucht man Custom-Processing/mehrere Consumer/Replay → Streams; will man nur managed Delivery ohne Code → Firehose.

> **💡 Merksatz:** **SQS** = Task-Queue (1 Consumer, delete-after-read). **Kinesis Streams** = Streaming (mehrere Consumer, Replay, Ordering). **Firehose** = managed Delivery (kein Replay).

---

## ⚠️ Prüfungs-Knackpunkte

- **Data Streams**: Shards (Partition Key → Shard, **Ordering pro Shard**), **mehrere Consumer**, **Enhanced Fan-Out** (dedizierte 2 MB/s), **Replay** (Retention bis 365 Tage). 🛑 On-demand bis 10 GB/s (Regionen).
- **Firehose**: managed Delivery (S3/Redshift/OpenSearch/Splunk/Snowflake), **kein Code, kein Replay**, Buffering (🛑 Zero Buffering), optional Lambda-Transform.
- **SQS (1 Consumer, delete-after-read) vs. Kinesis (mehrere Consumer, Replay, Ordering)**.
- **Data Streams (Custom/mehrere Consumer/Replay) vs. Firehose (managed Delivery, kein Code)**.
- Managed Service for Apache Flink (ex Kinesis Data Analytics) = Stream-Processing (SQL/Flink).

## 💡 Der eine Satz zum Mitnehmen

**Kinesis ist die Streaming-Familie: Data Streams für echtes Streaming mit mehreren Consumern, Replay und Ordering pro Shard, Firehose für codelose managed Delivery nach S3/Redshift/OpenSearch — und gegenüber SQS gilt: sobald „mehrere Consumer" oder „Replay" fällt, ist es Kinesis, nicht die Task-Queue.**
