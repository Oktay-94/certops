---
service: AWS Step Functions
seedKey: saa-c03-script-step-functions
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html
  - https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html
  - https://docs.aws.amazon.com/step-functions/latest/dg/connect-to-resource.html
status: draft
---

# AWS Step Functions

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Step Functions = der **Regisseur**, der viele Dienste zu einem geordneten **Workflow** zusammenschnürt. Man definiert den Ablauf als **State Machine** (Flussdiagramm aus States): Reihenfolge, Verzweigungen, automatisches **Retry/Catch**, lange **Wartezeiten** ohne laufenden Server, und ein **visuelles Live-Diagramm** zum Debuggen. Falle: **EventBridge = ein Event → eine Reaktion; Step Functions = das Drehbuch für den ganzen Film.**

Der SAA vertieft: **Standard vs. Express mit Zahlen, die Callback-/Human-Approval-Mechanik — und wann Orchestrierung statt Lambda-Verkettung.**

---

## 🎯 SAA-Vertiefung

### Standard vs. Express: Dauer gegen Durchsatz

**Das Problem:** Zwei sehr verschiedene Workloads — eine Bestellabwicklung, die über Tage laufen und lückenlos auditierbar sein muss, und eine IoT-Event-Transformation mit zehntausenden kurzen Ausführungen pro Sekunde. Ein Workflow-Typ passt nicht für beide.

**Die Lösung — die zwei Typen an ihren Grenzen:**
- **Standard**: bis **1 Jahr** Laufzeit, **exactly-once**, voller Ausführungsverlauf (bis 90 Tage über API), Abrechnung **pro State Transition**. Für langlaufende, durable, auditierbare Geschäftsprozesse (Payment, Order Fulfillment). 🔴 Execution-Start-Rate über ~2.000/s.
- **Express**: bis **5 min** Laufzeit, sehr hoher Durchsatz (🔴 über ~100.000 Executions/s), Abrechnung nach **Anzahl + Dauer**, History in CloudWatch Logs. Für High-Volume-Event-Processing (IoT, Streaming-Transformation, Mobile-Backends). Zwei Sub-Typen: **Asynchronous Express** (at-least-once) und **Synchronous Express** (at-most-once).

Der Reflex: „langlaufend + auditierbar" → **Standard**; „hochvolumig + kurzlebig" → **Express**. Man kann sogar Express als Child in einem Standard-Parent nesten.

> **💡 Merksatz:** **Standard = bis 1 Jahr, exactly-once, pro State Transition** (Geschäftsprozesse). **Express = bis 5 min, hoher Durchsatz, pro Execution** (IoT/High-Volume). „auditierbar" → Standard, „hochvolumig kurz" → Express.

### Callback und Human Approval: Warten auf die Außenwelt

**Das Problem:** In einem Genehmigungs-Workflow muss ein Mensch per E-Mail-Link eine Ausgabe freigeben — das kann Stunden oder Tage dauern. Der Workflow soll währenddessen nicht teuer „laufen" und danach exakt weitermachen.

**Die Lösung:** Das **Callback-Pattern** mit **`waitForTaskToken`**: Step Functions pausiert einen Task und gibt einen **Task Token** aus; der Workflow wartet (ohne laufende Kosten), bis eine externe Aktion mit diesem Token `SendTaskSuccess`/`SendTaskFailure` zurückmeldet. Das ist die saubere Umsetzung von **Human-in-the-Loop** und der Integration langsamer externer Systeme. Dazu die **Service-Integrationen**: `.sync` wartet, bis ein aufgerufener Service (z. B. ein Batch-Job) fertig ist, statt nur zu starten. Fehlerbehandlung ist eingebaut (**Retry** mit Backoff, **Catch** für Fallback-Pfade) — genau das, was man in handgeschriebenem Lambda-Code mühsam selbst bauen müsste.

> **💡 Merksatz:** **`waitForTaskToken`** pausiert kostenfrei bis zum externen Callback → **Human Approval** / langsame Systeme. **`.sync`** wartet auf Job-Ende. Retry/Catch sind eingebaut.

### Wann Orchestrierung statt Lambda-Verkettung

**Das Problem:** Man könnte fünf Lambdas auch einfach nacheinander aus dem Code aufrufen. Wann lohnt der Schritt zu Step Functions?

**Die Lösung:** Sobald es **Verzweigungen, Retries, Parallelität, lange Wartezeiten oder Sichtbarkeit** braucht, ist handgeschriebene Verkettung fragil: Die Ablauflogik ist im Code vergraben, bei einem Absturz weiß niemand, **wo** der Prozess hängt, und Retry/State muss man selbst bauen. Step Functions macht den Ablauf **explizit, beobachtbar und robust** (State-Typen: Task, Choice, Parallel, Map, Wait). Distraktoren: „Lambdas einfach nacheinander aufrufen" (kein State/Retry-Management) oder „SQS-Ketten" (keine Verzweigung). Und der Klassiker aus dem Compute-Kapitel: Überschreitet ein Job das **15-min-Lambda-Limit**, orchestriert man ihn mit Step Functions.

> **💡 Merksatz:** Verzweigung / Retry / Parallelität / langes Warten / Sichtbarkeit → **Step Functions** (nicht handverkettete Lambdas). >15 min Lambda-Limit → Step Functions.

---

## ⚠️ Prüfungs-Knackpunkte

- **Standard** (bis 1 Jahr, exactly-once, pro State Transition, auditierbar) vs. **Express** (bis 5 min, hoher Durchsatz, pro Execution, IoT/High-Volume).
- **`waitForTaskToken`** = Human Approval / externe Callbacks (kostenfreies Warten); **`.sync`** wartet auf Job-Ende.
- **Retry/Catch** eingebaut; State-Typen Task/Choice/Parallel/Map/Wait.
- Orchestrierung statt Lambda-Verkettung bei Verzweigung/Retry/Parallelität/Warten; >15 min → Step Functions.
- Abgrenzung: **Step Functions (ganzer Ablauf) vs. EventBridge (ein Event→Reaktion)**.
- **SWF** nur Legacy / bei externen Signalen / Parent-Child-Rückgaben / on-prem Workern.

## 💡 Der eine Satz zum Mitnehmen

**Step Functions macht mehrstufige Abläufe explizit, beobachtbar und robust — Standard für langlaufende auditierbare Geschäftsprozesse, Express für hochvolumige kurze Events, `waitForTaskToken` für Human-in-the-Loop; sobald Verzweigung, Retry oder langes Warten nötig ist, schlägt es die handverkettete Lambda-Lösung.**
