---
service: Amazon EventBridge
seedKey: saa-c03-script-eventbridge
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html
  - https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-pipes.html
  - https://docs.aws.amazon.com/scheduler/latest/UserGuide/what-is-scheduler.html
status: draft
---

# Amazon EventBridge

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EventBridge = die **zentrale Nervenbahn**, die auf Ereignisse aus ganz AWS lauscht und automatisch reagiert. Serverloser **Event-Bus**; man definiert **Rules** („WENN dieses Event, DANN jene Aktion"), die auf **Event-Muster** filtern und an Ziele (Lambda, SNS, SQS) leiten. Enthält einen **Scheduler** (Cron, Nachfolger der CloudWatch Events) und **Partner-Events** (SaaS). Merksatz: **SNS rufst du selbst, EventBridge lauscht von allein auf ganz AWS.**

Der SAA vertieft: **Content-Filtering, EventBridge Pipes, den Scheduler — und die Dreier-Abgrenzung zu SNS/SQS und Step Functions.**

---

## 🎯 SAA-Vertiefung

### Content-based Filtering: Routing nach Event-Inhalt

**Das Problem:** Es sollen nur EC2-Instanzen reagieren, die in den Zustand `stopped` wechseln und ein bestimmtes Tag tragen — nicht jedes EC2-Event. Ein einfacher Broadcast würde alle Ziele mit irrelevanten Events fluten.

**Die Lösung:** Eine EventBridge **Rule** enthält ein **Event Pattern**, das den **gesamten Event-Body** inhaltlich matcht (Felder, Werte, Präfixe, Zahlenbereiche). Nur passende Events werden an die Ziele geleitet — bis zu 5 Targets pro Rule. Das ist der entscheidende Unterschied zu SNS: EventBridge routet **nach Inhalt** aus über 90 AWS-Quellen (und SaaS), ohne dass der Producer wissen muss, wer zuhört. Zusätzlich: **Archive & Replay** (Events aufbewahren und später erneut abspielen — etwa zum Testen oder nach einem Bug), **Input Transformer** (Event vor Zustellung umformen) und **Schema Registry**.

> **💡 Merksatz:** EventBridge **Rules** matchen den **gesamten Event-Body** (Content-Filtering) aus 90+ AWS-/SaaS-Quellen → bis 5 Targets. **Archive & Replay** für Wiederholung.

### EventBridge Pipes und Scheduler

**Das Problem 1:** Eine DynamoDB-Stream-Quelle soll gefiltert, angereichert und an ein einzelnes Ziel (z. B. Step Functions) weitergereicht werden — ohne dafür Glue-Code oder eine eigene Lambda zu schreiben.

**Die Lösung 1:** 🛑 **EventBridge Pipes** ist eine **Point-to-Point-Integration** (eine Source → ein Target) mit optionalem **Filtering**, **Enrichment** (z. B. via Lambda/API Destination) und Transformation — deklarativ, ohne Klebe-Code. Ideal, um eine Quelle (SQS, Kinesis, DynamoDB Streams) mit einem Ziel zu verdrahten und dazwischen anzureichern. Abgrenzung: **Event Bus = many-to-many** (Broadcast mit Routing), **Pipes = one-to-one** (Punkt-zu-Punkt mit Enrichment).

**Das Problem 2:** Ein Task soll jeden Montag um 8 Uhr laufen — zuverlässig, mit Zeitzonen und Retry.

**Die Lösung 2:** 🛑 Der **EventBridge Scheduler** (GA Nov 2022) ist der dedizierte, serverlose Task-Scheduler: Cron-/Rate-/One-time-Schedules, Zeitzonen, flexible Zeitfenster, DLQ, über 270 AWS-Services als Ziel. Er ersetzt die alten „Scheduled Rules" als empfohlene Lösung. „Cron / jeden Tag um X / geplanter Task" → EventBridge Scheduler.

> **💡 Merksatz:** 🛑 **Pipes = Punkt-zu-Punkt (Source→Enrichment→Target)** ohne Code; **Event Bus = many-to-many**. **Scheduler** (Cron/Rate) für geplante Tasks — ersetzt Scheduled Rules.

### Die große Abgrenzung: SNS vs. SQS vs. EventBridge vs. Step Functions

**Das Problem:** Vier Dienste, die alle irgendwie „Nachrichten/Events bewegen". Die Prüfung stellt sie gegeneinander.

**Die Lösung — die Rollen:**
- **SQS** = Entkopplung/Puffer, 1 Consumer pro Nachricht, Pull. „decouple, buffer, task queue".
- **SNS** = Fan-out an viele Subscriber, Push, niedrige Latenz. „notify multiple, broadcast".
- **EventBridge** = Event-**Routing** nach Inhalt, SaaS-Quellen, Scheduler, Archive/Replay. „event-driven, route by content, SaaS, schedule".
- **Step Functions** = **Orchestrierung** eines mehrstufigen Workflows mit Logik/Retry/State. „workflow, coordinate steps".

Die feinste Falle bleibt **SNS vs. EventBridge** (schnelles Fan-out vs. inhaltsbasiertes Routing) und **EventBridge vs. Step Functions**: EventBridge reagiert auf **ein Event → eine Reaktion** (reaktiv), Step Functions steuert den **ganzen Ablauf** (das Drehbuch). 🛑 Hinweis: EventBridge hat die Latenz stark gesenkt (P99 ~129 ms, Aug 2024) — für die Prüfung gilt aber weiter SNS = Low-Latency-Fan-out, EventBridge = Routing.

> **💡 Merksatz:** **SQS puffert (1 Consumer), SNS verteilt (Fan-out), EventBridge routet nach Inhalt (+ SaaS/Scheduler), Step Functions orchestriert den Ablauf.** EventBridge = ein Event→eine Reaktion, Step Functions = das ganze Drehbuch.

---

## ⚠️ Prüfungs-Knackpunkte

- **Rules** mit **Event Pattern** matchen den gesamten Body (Content-Filtering); 90+ Quellen, bis 5 Targets; **Archive & Replay**.
- 🛑 **Pipes** = Punkt-zu-Punkt (Source→Filter→Enrichment→Target) ohne Code; **Event Bus** = many-to-many.
- 🛑 **Scheduler** (Cron/Rate, GA 2022) für geplante Tasks — ersetzt Scheduled Rules.
- Abgrenzung: **SQS (Puffer) · SNS (Fan-out) · EventBridge (Routing/SaaS/Scheduler) · Step Functions (Orchestrierung)**.
- Feinste Falle: **SNS (schnelles Fan-out) vs. EventBridge (Content-Routing)**; **EventBridge (ein Event→Reaktion) vs. Step Functions (ganzer Ablauf)**.
- SaaS-Partner-Quellen (Zendesk, Datadog) → EventBridge Partner Event Bus.

## 💡 Der eine Satz zum Mitnehmen

**EventBridge ist der inhaltsbasierte Router der ereignisgesteuerten Architektur: Rules filtern den ganzen Event-Body aus 90+ AWS- und SaaS-Quellen, Pipes verdrahten Punkt-zu-Punkt mit Enrichment, der Scheduler übernimmt Cron — und es reagiert auf einzelne Events, während Step Functions den mehrstufigen Ablauf orchestriert.**
