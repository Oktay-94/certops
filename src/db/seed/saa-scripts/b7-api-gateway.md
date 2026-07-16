---
service: Amazon API Gateway
seedKey: saa-c03-script-api-gateway
batch: B7
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html
  - https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html
  - https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api-overview.html
status: draft
---

# Amazon API Gateway

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> API Gateway = die **Empfangshalle mit Pförtner**, durch die jede Anfrage von außen muss. Es nimmt Anfragen an und leitet sie ans Backend (Lambda, EC2), erledigt **Authentifizierung** (oft mit Cognito), **Throttling**, **Caching** und **Versionierung**. Das berühmte **serverlose Trio**: API Gateway → Lambda → DynamoDB. Drei Typen: **REST** (voll), **HTTP** (günstig), **WebSocket** (bidirektional).

Der SAA vertieft: **REST vs. HTTP vs. WebSocket mit Kriterien, Authorizer-Optionen, Endpoint-Typen, das Timeout — und die Abgrenzung zu ALB/AppSync.**

---

## 🎯 SAA-Vertiefung

### REST vs. HTTP vs. WebSocket: Welcher API-Typ

**Das Problem:** Ein Team baut eine einfache Lambda-Backend-API und will die günstigste, schnellste Option — ein anderes braucht API Keys, Usage Plans und WAF. Der falsche Typ kostet Geld oder fehlende Features.

**Die Lösung — die drei Typen an ihren Kriterien:**
- **HTTP API**: **günstiger und niedrigere Latenz**, weniger Features; JWT-Authorizer (OIDC/OAuth), CORS, VPC Link zu ALB/NLB. Der Default für einfache, kostengünstige Lambda-/HTTP-Proxy-APIs. Signalwort „kostengünstigste API für Lambda" → HTTP API.
- **REST API**: **voller Funktionsumfang** — **API Keys + Usage Plans**, Request/Response-Validierung, **WAF-Integration**, Caching, Canary Deployments, Edge-optimized/Regional/Private Endpoints. Wenn eines dieser Enterprise-Features gefragt ist → REST API.
- **WebSocket API**: **bidirektional, stateful** — das Backend kann Nachrichten an Clients **pushen** (Chat, Live-Dashboards, Gaming). Routes `$connect`/`$disconnect`/`$default`.

> **💡 Merksatz:** **HTTP API** = günstig/schnell, einfach (Default). **REST API** = API Keys/Usage Plans/WAF/Caching (Enterprise). **WebSocket API** = bidirektionales Server-Push.

### Authorizer, Endpoints und das 29-s-Timeout

**Das Problem:** Eine REST-API soll nur eingeloggten Nutzern offenstehen, privat in der VPC bleiben — und ein langsamer LLM-Backend-Call dauert länger als die üblichen 29 s.

**Die Lösung — drei prüfbare Details:**
- **Authorization**: **IAM** (Service-zu-Service), **Cognito User Pool Authorizer** (App-Nutzer), **Lambda Authorizer** (Custom-Logik, z. B. Drittanbieter-Token), **Resource Policies** (IP-/VPC-Beschränkung). „App-Nutzer-Login" → Cognito Authorizer; „eigene Token-Logik" → Lambda Authorizer.
- **Endpoint-Typen**: **Edge-optimized** (global über CloudFront), **Regional** (eine Region), **Private** (nur aus der VPC via Interface Endpoint/PrivateLink). „API nur intern erreichbar" → Private API.
- **Integration-Timeout**: Default max **29 s**. 🛑 Seit Juni 2024 auf Antrag (Service Quota) **>29 s nur für Regional/Private REST APIs** (getrieben u. a. durch LLM-Use-Cases) — **nicht** für HTTP APIs. „langer Backend-Call >29 s" → Regional/Private REST API mit erhöhtem Timeout.

> **💡 Merksatz:** Authorizer: **IAM / Cognito / Lambda / Resource Policy**. Endpoints: **Edge / Regional / Private** (Private = nur VPC). Timeout Default **29 s**, 🛑 >29 s nur Regional/Private REST.

### Throttling und die Abgrenzung zu ALB/AppSync

**Throttling & Usage Plans:** API Gateway drosselt Anfragen (Rate + Burst), und **Usage Plans + API Keys** weisen einzelnen Kunden Kontingente zu (Monetarisierung/Fair Use) — ein REST-only-Feature. Klassische Rechenfrage: API-Gateway-Default-Throttle trifft auf Lambdas Concurrency-Limit.

**API Gateway vs. ALB vs. AppSync:**
- **API Gateway** = vollwertiges **API-Management** (Auth, Keys, Throttling, Caching, Versionierung) für REST/HTTP/WebSocket.
- **ALB** = reiner HTTP(S)-**Load-Balancer** für Container/EC2 ohne API-Management-Features — günstiger bei hohem, konstantem Traffic ohne API-Features.
- **AppSync** = **GraphQL** (Datenaggregation aus mehreren Quellen, Realtime-Subscriptions) — nächstes Skript.

Reflex: „API mit Auth/Keys/Throttling" → API Gateway; „nur HTTP-Load-Balancing für Container" → ALB; „GraphQL/Multi-Source" → AppSync.

> **💡 Merksatz:** **Usage Plans + API Keys** (REST) für Kundenkontingente. **API Gateway = API-Management, ALB = reines HTTP-LB, AppSync = GraphQL.**

---

## ⚠️ Prüfungs-Knackpunkte

- **HTTP API** (günstig/einfach, JWT) vs. **REST API** (API Keys/Usage Plans/WAF/Caching/Private) vs. **WebSocket** (bidirektional Push).
- Authorizer: **IAM, Cognito User Pool, Lambda (Custom), Resource Policy**.
- Endpoints: **Edge-optimized / Regional / Private** (Private = nur VPC via PrivateLink).
- Integration-Timeout Default **29 s**; 🛑 >29 s nur **Regional/Private REST** (nicht HTTP API).
- **Usage Plans + API Keys** = REST-only, Kundenkontingente; Default-Throttle vs. Lambda-Concurrency.
- Abgrenzung: **API Gateway (API-Mgmt) · ALB (HTTP-LB) · AppSync (GraphQL)**; serverloses Trio API GW → Lambda → DynamoDB.

## 💡 Der eine Satz zum Mitnehmen

**API Gateway ist die verwaltete Eingangstür für APIs — HTTP API für günstig/einfach, REST API für Enterprise-Features (Keys, Usage Plans, WAF, Private), WebSocket für Server-Push; die Authorizer-, Endpoint- und Timeout-Details entscheiden die kniffligen Fragen, und gegen ALB/AppSync gewinnt es, sobald echtes API-Management gefragt ist.**
