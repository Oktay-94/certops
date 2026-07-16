---
service: AWS WAF
seedKey: saa-c03-script-waf
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/waf/latest/developerguide/waf-chapter.html
  - https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html
status: draft
---

# AWS WAF

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> WAF = der **intelligente Türsteher, der jedem in die Tasche schaut**. Sie sitzt auf **Layer 7** vor der Web-App und inspiziert **jede HTTP-Anfrage** — gegen **SQL-Injection** und **XSS** (die zwei Klassiker), Geo-Blocking, IP-Blocking, Rate Limiting. Angedockt an **CloudFront, ALB, API Gateway**. Kern-Abgrenzung: **Shield = DDoS-Masse, WAF = gezielte inhaltliche Anfrage**.

Der SAA vertieft: **Rate-based Rules, Managed Rule Groups, wo WAF (nicht) andockt — und die Firewall-Landkarte.**

---

## 🎯 SAA-Vertiefung

### Rate-based Rules und Managed Rule Groups

**Das Problem 1:** Ein Login-Endpunkt wird per Brute-Force mit tausenden Versuchen pro Minute von einzelnen IPs bombardiert — kein klassischer Volumen-DDoS, aber schädlich.

**Die Lösung 1:** Eine **Rate-based Rule** zählt Requests pro IP über ein rollierendes 5-Minuten-Fenster und blockt IPs, die einen Schwellwert überschreiten. Das ist die WAF-Antwort auf **Brute Force, Credential Stuffing, Scraping und Layer-7-Request-Fluten** — Signalwort „zu viele Requests von einer Quelle drosseln".

**Das Problem 2:** Man will Schutz gegen die OWASP-Top-10 (SQLi, XSS & Co.), ohne hunderte Regeln selbst zu schreiben.

**Die Lösung 2:** **Managed Rule Groups** liefern fertige, von AWS gepflegte Regelsätze — z. B. das **Core Rule Set** (OWASP-Basisschutz) und **Known Bad Inputs**. Man aktiviert sie und ist sofort geschützt, ohne Regel-Handarbeit; AWS aktualisiert sie laufend. Dazu kommen **Rule Actions**: nicht nur `Block`/`Allow`, sondern auch `Count` (erstmal nur mitzählen, um eine Regel gefahrlos zu testen) und `CAPTCHA`/`Challenge` (Bots aussieben). Der `Count`-Modus ist der Prüfungs-Tipp für „neue Regel einführen, ohne legitime Nutzer zu blocken".

> **💡 Merksatz:** **Brute Force / zu viele Requests → Rate-based Rule** (5-Min-Fenster pro IP). OWASP-Schutz ohne Handarbeit → **Managed Rule Groups**. Neue Regel gefahrlos testen → Action **`Count`**.

### Wo WAF andockt — und wo nicht

**Das Problem:** Ein NLB-basierter Dienst soll „mit WAF geschützt" werden. Klingt plausibel, ist aber falsch.

**Die Lösung:** WAF ist ein **Layer-7-HTTP-Dienst** und dockt nur an Ressourcen an, die HTTP verstehen: **CloudFront, ALB, API Gateway (REST), AppSync, Cognito** (u. a. App Runner). **Nicht am NLB** — der arbeitet auf Layer 4 und sieht keine HTTP-Inhalte. „NLB + WAF" ist ein klassischer Distraktor; für den NLB bleiben **Network Firewall** (VPC-Ebene) und **Shield** (DDoS). Für CloudFront gilt zusätzlich, dass die zugehörige Web ACL im **Global/us-east-1**-Scope liegt.

> **💡 Merksatz:** WAF dockt an **CloudFront, ALB, API Gateway, AppSync, Cognito** — **NICHT am NLB** (Layer 4). NLB schützen → Network Firewall/Shield.

### Die Firewall-Landkarte (Wiederholung + Einordnung)

Die WAF ist ein Puzzlestück in der größeren Schutz-Landkarte, die der SAA gern komplett abfragt:
- **Security Group** — Instanz/ENI, stateful, nur Allow (Layer 3/4).
- **NACL** — Subnetz, stateless, Allow+Deny (Layer 3/4).
- **WAF** — Layer 7 HTTP, inhaltliche Web-Exploits (SQLi/XSS, Rate Limiting).
- **Shield** — DDoS (Layer 3/4, + L7-DDoS bei Advanced).
- **Network Firewall** — ganze VPC, Layer 3–7, Domain-Filtering, IDS/IPS.
- **Firewall Manager** — org-weites zentrales Management all dessen (nächstes Skript).

Der Reflex: „SQLi/XSS/Web-Exploit" → **WAF**. „DDoS" → **Shield**. „ganze VPC / Domains filtern" → **Network Firewall**. „IP am Subnetz sperren" → **NACL**.

> **💡 Merksatz:** **WAF = L7-Web-Exploits (SQLi/XSS)**, Shield = DDoS, Network Firewall = VPC-weit, NACL = Subnetz-IP, Security Group = Instanz.

---

## ⚠️ Prüfungs-Knackpunkte

- **Rate-based Rule** (5-Min-Fenster pro IP) gegen Brute Force / L7-Request-Fluten.
- **Managed Rule Groups** (Core Rule Set, Known Bad Inputs) = OWASP-Schutz ohne Handarbeit.
- Rule Actions: Allow/Block/**Count** (Test-Modus)/CAPTCHA/Challenge.
- Dockt an **CloudFront, ALB, API Gateway, AppSync, Cognito** — **NICHT am NLB**.
- CloudFront-Web-ACL im **us-east-1/Global**-Scope.
- Landkarte: WAF (L7) · Shield (DDoS) · Network Firewall (VPC) · NACL (Subnetz) · Security Group (Instanz).

## 💡 Der eine Satz zum Mitnehmen

**WAF ist die Layer-7-Inhaltskontrolle: Managed Rule Groups gegen SQLi/XSS, Rate-based Rules gegen Brute Force — angedockt an alles HTTP außer dem NLB, für den Shield und Network Firewall zuständig bleiben.**
