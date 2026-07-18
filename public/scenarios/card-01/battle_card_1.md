---
nr: 1
title: "Battle Card 1 — API Gateway · Lambda · DynamoDB"
services: ["Amazon API Gateway", "AWS Lambda", "Amazon DynamoDB"]
signalwords: ["unvorhersehbarer Traffic", "keine Server verwalten", "Pay-per-Request", "minimaler operativer Aufwand"]
domains: [D3, D4]
assets: ["battle_card_1.png", "battle_card_1.pdf", "battle_card_1.svg"]
---

# Battle Card 1 — API Gateway · Lambda · DynamoDB

**Szenario:** Das Startup **TicketWave** verkauft Konzert-Tickets. Am Launch-Tag kann der Traffic von 10 auf 100.000 Requests/Minute explodieren — niemand weiß vorher, wie viral es geht. Das Team hat keine Ops-Kapazität für Server-Management und will **nur zahlen, was tatsächlich genutzt wird**. Signalwörter: *„unvorhersehbarer Traffic", „keine Server verwalten", „Pay-per-Request", „minimaler operativer Aufwand"*.

## Ablauf

- **1 — HTTPS-Request:** Die App ruft die REST-API über API Gateway auf. API Gateway ist die managed „Front Door": TLS-Terminierung, Authentifizierung, Throttling und Routing — ohne dass TicketWave je einen Webserver betreibt. Design-Entscheidung: Der Endpunkt skaliert von AWS-Seite automatisch, es gibt keinen Load Balancer zu dimensionieren.
- **2 — Proxy-Event:** API Gateway übergibt den Request als Event an Lambda (Proxy-Integration). Jeder Request bekommt bei Bedarf eine eigene Ausführungsumgebung — Lambda skaliert pro Request, nicht pro Instanz. Genau das fängt den viralen Spike ab, für den man bei EC2 vorher Kapazität hätte planen müssen.
- **3 — PutItem/Query:** Die Funktion schreibt die Bestellung nach DynamoDB. Im **On-Demand Capacity Mode** atmet die Tabelle mit der Last mit — keine RCU/WCU-Planung, keine Drosselung beim Spike. Einstellige Millisekunden-Latenz passt zum API-Latenzbudget.
- **4 — JSON-Antwort:** Die Antwort geht zurück an den Client. *Bewusste Vereinfachung im Diagramm:* Real fließt die Antwort durch Lambda → API Gateway zurück; der Sammel-Rückpfeil steht für den gesamten Response-Pfad.

## Prüfungs-Kernsatz

**„Unvorhersehbarer Traffic + keine Server + Pay-per-Request" = API Gateway + Lambda + DynamoDB — die Serverless-Standardantwort.**

## Klassiker-Fallen

1. **Lambda vs. Fargate:** Fargate ist auch „serverless", aber container-basiert und läuft dauerhaft → bei kurzlebigen, request-getriebenen Workloads mit Null-Grundlast ist Lambda die Antwort. Fargate kommt in Karte 2.
2. **DynamoDB On-Demand vs. Provisioned:** „unvorhersehbar/spiky" → On-Demand; „stabil und planbar" → Provisioned (ggf. mit Auto Scaling) ist günstiger. Die Prüfung testet diese Abgrenzung gern über das Wort *predictable*.
3. **API-Gateway-Timeout:** Default 29 s Integration-Timeout — langlaufende Verarbeitung gehört nicht hinter eine synchrone API (→ SQS/Step Functions entkoppeln). Seit 2024 ist das Limit für Regional/Private REST APIs per Quota erhöhbar, aber der Prüfungsreflex bleibt: lange Jobs asynchron.
