---
service: Amazon SNS
seedKey: saa-c03-script-sns
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/sns/latest/dg/welcome.html
  - https://docs.aws.amazon.com/sns/latest/dg/fifo-message-delivery.html
  - https://docs.aws.amazon.com/sns/latest/dg/sns-message-filtering.html
status: draft
---

# Amazon SNS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> SNS = der **Lautsprecher**, der eine Nachricht gleichzeitig an alle Abonnenten ausruft (**Pub/Sub**). Sender publisht an ein **Topic**, viele Empfänger abonnieren (SQS, Lambda, E-Mail, SMS, HTTP). Fundamentaler Unterschied zu SQS: **SNS = 1→viele, Push, sofort raus**; SQS = 1→1, Pull, wartend. Königsdisziplin: das **Fan-out-Muster** (SNS → mehrere SQS-Queues).

Der SAA vertieft: **das Fan-out-Pattern im Detail, Message Filtering, Standard vs. FIFO — und die feine Abgrenzung zu EventBridge.**

---

## 🎯 SAA-Vertiefung

### Das Fan-out-Pattern: Breitenverteilung + Puffersicherheit

**Das Problem:** Eine Bestellung geht ein, und **vier** Systeme müssen es erfahren: Lager, Buchhaltung, Analyse, Kundenmail. Publisht man direkt an vier Endpunkte, ist eines vielleicht gerade offline und verpasst die Nachricht — und es gibt keinen Puffer.

**Die Lösung:** Das klassische **Fan-out**: SNS-Topic → mehrere abonnierte **SQS-Queues** (eine je Consumer). SNS verteilt die Nachricht **gleichzeitig an alle Queues**, und jede Queue **puffert ausfallsicher** für ihren Consumer — fällt die Analyse aus, warten ihre Nachrichten in der Queue, während Lager und Buchhaltung ungestört weiterarbeiten. Man bekommt **beides**: die Breitenverteilung von SNS und die Persistenz/Entkopplung von SQS. Das ist das meistgeprüfte Integrationsmuster überhaupt — Signalwort „eine Nachricht an mehrere Systeme, jedes ausfallsicher verarbeitet" → SNS + SQS Fan-out.

> **💡 Merksatz:** **Fan-out = SNS-Topic → mehrere SQS-Queues.** SNS verteilt gleichzeitig, jede SQS puffert ausfallsicher für ihren Consumer. Das Standard-Muster für „an viele verteilen + puffern".

### Message Filtering: Nicht jeder braucht alles

**Das Problem:** An einem „Bestellungen"-Topic hängen zehn Subscriber, aber der DE-Versand-Service interessiert sich nur für deutsche Bestellungen. Alles zu empfangen und selbst zu filtern ist verschwenderisch.

**Die Lösung:** Mit **Filter Policies** bekommt jeder Subscriber nur die Nachrichten, die zu seinem Filter passen — ausgewertet über **Message Attributes** oder (per Filter Policy Scope) den **Message Body**. So braucht man **kein** Topic pro Variante: Ein Topic, viele gefilterte Subscriber. Signalwort „Subscriber sollen nur bestimmte Nachrichten erhalten" → SNS Message Filtering. Für nicht zustellbare Nachrichten gibt es eine **DLQ pro Subscription**.

> **💡 Merksatz:** **Filter Policies** liefern jedem Subscriber nur passende Nachrichten (Attribute oder Body) — ein Topic statt vieler. DLQ pro Subscription für Fehlzustellungen.

### Standard vs. FIFO — und die EventBridge-Abgrenzung

**Standard vs. FIFO Topics:** Wie bei SQS gibt es **FIFO Topics** mit strikter Reihenfolge und Exactly-once (🔴 bis 3.000 Nachrichten/s pro Topic) — aber mit einer wichtigen Einschränkung: **FIFO-Topics liefern nur an SQS-Subscriber** (FIFO oder Standard Queues), **nicht** an E-Mail/SMS/HTTP. „Fan-out mit garantierter Reihenfolge" → SNS FIFO → SQS FIFO.

**Die feine Falle SNS vs. EventBridge:**
- **SNS**: **hoher Durchsatz, niedrige Latenz** (typisch <30 ms), massives Fan-out (bis Millionen Subscriber), plus A2P-Kanäle (SMS/E-Mail/Push). **Du publisht aktiv.**
- **EventBridge**: **Event-Routing** mit inhaltsbasiertem Filtering über den gesamten Event-Body, Schema Registry, **SaaS-Partner-Quellen**, Archive/Replay, viele AWS-Targets — aber historisch höhere Latenz und nur 5 Targets pro Rule.

Merksatz aus dem CLF-Recap: **SNS rufst du selbst (Megafon), EventBridge lauscht von allein auf ganz AWS.** „einfaches, schnelles Fan-out an viele" → SNS; „auf AWS-/SaaS-Ereignisse reagieren, inhaltsbasiert routen" → EventBridge.

> **💡 Merksatz:** **SNS FIFO** nur an SQS-Subscriber. **SNS = Low-Latency-Fan-out (du publisht), EventBridge = Event-Routing/Filtering/SaaS (lauscht).**

---

## ⚠️ Prüfungs-Knackpunkte

- **Fan-out = SNS → mehrere SQS-Queues** (Breitenverteilung + Puffer je Consumer) — das Kernmuster.
- **Message Filtering** (Filter Policies auf Attribute/Body) → ein Topic statt vieler; DLQ pro Subscription.
- **FIFO Topics** (🔴 bis 3.000/s) = Ordering + Exactly-once, aber **nur SQS-Subscriber**.
- Typische Latenz **<30 ms**; bis Millionen Subscriptions.
- Abgrenzung: **SNS (Push, Low-Latency, du publisht) ≠ EventBridge (Event-Routing, Content-Filtering, SaaS, lauscht)**.
- **SNS (1→viele, Push) ≠ SQS (1→1, Pull)**.

## 💡 Der eine Satz zum Mitnehmen

**SNS ist das Push-Megafon für Pub/Sub — im Fan-out mit SQS kombiniert bekommt man Breitenverteilung plus ausfallsichere Pufferung, Message Filtering spart Topics, und gegenüber EventBridge gilt: SNS ist schnelles Fan-out, das du selbst auslöst, EventBridge das inhaltsbasierte Routing, das von allein lauscht.**
