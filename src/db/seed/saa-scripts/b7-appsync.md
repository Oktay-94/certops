---
service: AWS AppSync
seedKey: saa-c03-script-appsync
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html
  - https://docs.aws.amazon.com/appsync/latest/devguide/aws-appsync-real-time-data.html
  - https://docs.aws.amazon.com/appsync/latest/eventapi/event-api-welcome.html
status: draft
---

# AWS AppSync

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AppSync ist im CLF-Kurs kaum präsent — hier die Kurz-Einordnung: AppSync = **managed GraphQL** für Web-/Mobile-Apps. Es stellt einen GraphQL-Endpunkt bereit, der Daten aus mehreren Quellen (DynamoDB, Lambda, RDS, HTTP) in **einer** Query bündelt, und liefert **Realtime-Updates** über WebSocket-Subscriptions. Es ist die GraphQL-Alternative zu API Gateway (REST).

Der SAA vertieft: **wann GraphQL statt REST, die Data Sources und Subscriptions, die Auth-Optionen — und AppSync Events als neuen Pub/Sub-Dienst.**

---

## 🎯 SAA-Vertiefung

### GraphQL statt REST: Datenaggregation ohne Over-Fetching

**Das Problem:** Eine Mobile-App braucht für einen Screen Daten aus drei Quellen: Nutzerprofil (DynamoDB), Empfehlungen (Lambda) und Lagerbestand (RDS). Mit REST wären das drei Endpunkte und drei Roundtrips — und jeder liefert oft mehr Felder als gebraucht (Over-Fetching), was auf mobilen Netzen teuer ist.

**Die Lösung:** **AppSync** stellt einen **GraphQL**-Endpunkt bereit: Der Client fragt in **einer** Query genau die benötigten Felder aus **mehreren Data Sources** ab; **Resolver** (in VTL oder JavaScript) verbinden Query-Felder mit den Quellen (**DynamoDB, Lambda, RDS/Aurora, HTTP, OpenSearch, EventBridge**). Kein Over-/Under-Fetching, ein Roundtrip, ein Schema. Das ist das Signalwort-Muster „Mobile/Web-App, Datenaggregation aus mehreren Quellen, GraphQL, kein Over-Fetching" → AppSync (nicht API Gateway, das REST macht und nicht nativ aggregiert).

> **💡 Merksatz:** **AppSync = GraphQL**: eine Query aggregiert mehrere Data Sources (DynamoDB/Lambda/RDS/HTTP/OpenSearch), **Resolver** verbinden Felder mit Quellen, kein Over-Fetching. „Multi-Source-Aggregation für App" → AppSync.

### Realtime-Subscriptions und Auth

**Das Problem:** In einer Collaboration-App sollen alle Clients sofort sehen, wenn jemand ein Dokument ändert — ohne ständiges Polling.

**Die Lösung:** AppSync **Subscriptions** liefern **Realtime-Updates über WebSockets**: Eine GraphQL-Mutation (Datenänderung) triggert automatisch alle Clients, die die passende Subscription abonniert haben (`@aws_subscribe`). So entsteht Live-Sync ohne eigene WebSocket-Infrastruktur. Die **Auth-Optionen** sind prüfbar und flexibel kombinierbar: **API Key** (einfach/öffentlich), **IAM**, **Cognito User Pools** (App-Nutzer), **OIDC** und **Lambda** (Custom). „Realtime-App-Updates ohne WebSocket-Server bauen" → AppSync Subscriptions.

> **💡 Merksatz:** **Subscriptions** = Realtime über WebSockets, ausgelöst durch Mutations — Live-Sync ohne eigene Infra. Auth: **API Key / IAM / Cognito / OIDC / Lambda**.

### 🛑 AppSync Events: Pub/Sub ohne GraphQL

**Das Problem:** Ein Team will reines **Pub/Sub über WebSockets** an Millionen Clients (Live-Scores, Preisticker) — ohne ein GraphQL-Schema aufzusetzen und ohne WebSocket-Connection-Management selbst zu betreiben.

**Die Lösung:** 🛑 **AppSync Events** (GA Okt 2024) ist ein **eigenständiger Pub/Sub-Dienst** über serverlose WebSocket-APIs — **nicht** an GraphQL gebunden. Man publisht auf **Channels** (gruppiert in **Namespaces**), Clients subscriben über WebSocket; Auth wie bei AppSync (API Key/IAM/Cognito/OIDC/Lambda), WAF-Support. Das ist die neue Antwort auf „serverloses Realtime-Pub/Sub an viele Clients" — eine Alternative zu selbstgebauten API-Gateway-WebSockets. Abgrenzung zu SNS: SNS ist Server-zu-Server-Fan-out (SQS/Lambda/E-Mail), AppSync Events pusht direkt an **Browser/Mobile-WebSocket-Clients**.

> **💡 Merksatz:** 🛑 **AppSync Events** = serverloses **Pub/Sub über WebSockets** (Channels/Namespaces), ohne GraphQL — für Realtime-Push an viele Browser/Mobile-Clients. SNS ist Server-Fan-out, nicht Browser-Push.

---

## ⚠️ Prüfungs-Knackpunkte

- **AppSync = managed GraphQL**: eine Query aggregiert mehrere **Data Sources** (DynamoDB/Lambda/RDS/HTTP/OpenSearch/EventBridge) via **Resolver** (VTL/JS).
- **Subscriptions** = Realtime über WebSockets (Mutation triggert Clients) — Live-Sync ohne eigene Infra.
- Auth: **API Key / IAM / Cognito User Pools / OIDC / Lambda**.
- 🛑 **AppSync Events** (Okt 2024) = eigenständiges Pub/Sub über WebSockets (Channels/Namespaces), ohne GraphQL.
- Abgrenzung: **AppSync (GraphQL/Multi-Source/Realtime) vs. API Gateway (REST)**; AppSync Events (Browser-Push) vs. SNS (Server-Fan-out).

## 💡 Der eine Satz zum Mitnehmen

**AppSync ist die GraphQL-Antwort für Web-/Mobile-Apps: eine Query bündelt mehrere Datenquellen ohne Over-Fetching, Subscriptions liefern Realtime-Updates ohne eigenen WebSocket-Server — und AppSync Events bringt seit 2024 reines Pub/Sub-Push an viele Clients, wo API Gateway nur REST spricht.**
