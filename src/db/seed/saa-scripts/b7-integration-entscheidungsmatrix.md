---
service: Integration-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-integration-decision-matrix
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/decision-guides/latest/sns-or-sqs-or-eventbridge/sns-or-sqs-or-eventbridge.html
status: draft
---

# Integration-Entscheidungsmatrix

## 📋 Einordnung

> Das Integration-Kapitel ist ein Verwechslungs-Minenfeld: SQS/SNS/EventBridge/Kinesis/MQ klingen alle nach „Nachrichten bewegen", API Gateway/AppSync/ALB nach „APIs bereitstellen", Standard/Express und REST/HTTP/WebSocket nach Feinheiten. Dieses Skript bündelt die sieben Entscheidungstabellen — die Messaging-Matrix (1) und SNS-vs-EventBridge (5) sind die meistgeprüften.

---

## 🎯 Matrix 1: Messaging-Entkopplung — die zentrale Abgrenzung

| Das Szenario sagt … | Antwort |
|---|---|
| decouple, buffer, load leveling, **ein Worker**, task queue | **SQS** |
| fan-out, **an mehrere gleichzeitig**, broadcast, SMS/E-Mail/Push, low latency | **SNS** |
| event-driven, **route nach Inhalt**, SaaS-Quelle, schedule/Cron, archive/replay | **EventBridge** |
| JMS/AMQP/MQTT/STOMP, **bestehenden Broker migrieren**, ActiveMQ/RabbitMQ | **Amazon MQ** |
| real-time streaming, **mehrere Consumer**, replay, ordering, shards, analytics | **Kinesis Data Streams** |
| streaming **nach S3/Redshift/OpenSearch laden**, kein Code | **Kinesis Firehose** |

## 🎯 Matrix 2: SQS Standard vs. FIFO

| Bedarf | Antwort |
|---|---|
| maximaler Durchsatz, Reihenfolge/Duplikate egal | **Standard** (at-least-once) |
| strikte Reihenfolge + keine Duplikate (Zahlungen, Bestellungen) | **FIFO** (exactly-once, 🔴 300/s, HT bis 70.000/s) |

## 🎯 Matrix 3: API-Layer

| Bedarf | Antwort |
|---|---|
| günstige/einfache REST-API für Lambda, JWT | **API Gateway HTTP API** |
| API Keys, Usage Plans, WAF, Caching, Private | **API Gateway REST API** |
| bidirektional, Server-Push (Chat, Live) | **API Gateway WebSocket** |
| GraphQL, Multi-Source-Aggregation, Realtime | **AppSync** |
| reines HTTP-Load-Balancing für Container/EC2 | **ALB** |
| serverloses Pub/Sub-Push an viele Browser/Mobile | 🛑 **AppSync Events** |

## 🎯 Matrix 4: Step Functions — Typ & Alternative

| Bedarf | Antwort |
|---|---|
| langlaufend (bis 1 Jahr), exactly-once, auditierbar | **Standard** |
| hochvolumig, kurz (bis 5 min), günstig (IoT) | **Express** |
| Human Approval / externer Callback | **`waitForTaskToken`** |
| externe Signale / Parent-Child-Rückgaben / on-prem Worker | **SWF** (Legacy) |
| triviale Verkettung ohne Retry/State | einfache Lambda-Kette (kein Step Functions nötig) |

## 🎯 Matrix 5: SNS vs. EventBridge (die feine Falle)

| | **SNS** | **EventBridge** |
|---|---|---|
| Modell | Pub/Sub-Fan-out, **du publisht** | Event-Routing, **lauscht** auf AWS/SaaS |
| Filtering | Attribute/Body | **gesamter Event-Body** (content-based) |
| Latenz | **<30 ms** (typisch) | ~0,5 s (🛑 P99 ~129 ms seit 2024) |
| Ziele | Millionen Subscriber (SQS/Lambda/HTTP/SMS/E-Mail) | viele AWS-Targets (5/Rule), Schema, Replay |
| Signalwort | „schnelles Fan-out an viele" | „auf Events reagieren, SaaS, Cron, routen" |

## 🎯 Matrix 6: Kinesis Data Streams vs. Firehose vs. SQS

| Bedarf | Antwort |
|---|---|
| Custom-Processing, mehrere Consumer, Replay, Sub-Sekunde | **Data Streams** |
| managed Delivery nach S3/Redshift/OpenSearch, kein Code | **Firehose** |
| simple Entkopplung, 1 Consumer, kein Streaming | **SQS** |

## 🎯 Matrix 7: Fan-out-Pattern

| Bedarf | Antwort |
|---|---|
| hohes Fan-out mit Puffer/Persistenz je Consumer | **SNS + SQS** |
| inhaltsbasiertes Routing, Schema, SaaS, Archive/Replay | **EventBridge** |

## ⚠️ Die zehn häufigsten Integration-Fehlgriffe

1. **SNS statt Fan-out (SNS+SQS)** gewählt, obwohl Puffer je Consumer nötig.
2. **Standard Queue** trotz „Reihenfolge/keine Duplikate" (→ FIFO).
3. **SQS** trotz „mehrere Consumer / Replay" (→ Kinesis).
4. **EventBridge** trotz „schnelles Fan-out an Millionen" (→ SNS).
5. **SNS** trotz „inhaltsbasiert routen / SaaS-Quelle / Cron" (→ EventBridge).
6. **REST API** trotz „kostengünstigste Lambda-API" (→ HTTP API).
7. **API Gateway** trotz „GraphQL/Multi-Source" (→ AppSync).
8. **Lambda-Verkettung** trotz Verzweigung/Retry/langem Warten (→ Step Functions).
9. **SQS/SNS** trotz „bestehenden ActiveMQ/RabbitMQ migrieren" (→ Amazon MQ).
10. **Firehose** trotz „mehrere Consumer / Replay" (→ Data Streams).

## 💡 Der eine Satz zum Mitnehmen

**Integration-Fragen beantworten sich über das Signalwort: ein Worker (SQS), an viele verteilen (SNS), nach Inhalt routen (EventBridge), Streaming mit Replay (Kinesis), bestehenden Broker migrieren (MQ), Ablauf orchestrieren (Step Functions), API bereitstellen (API Gateway/AppSync) — fast immer zeigt genau ein Wort auf genau eine Zeile.**
