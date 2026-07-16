---
service: Amazon Route 53
seedKey: saa-c03-script-route-53
batch: B4
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-choosing-alias-non-alias.html
  - https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy.html
  - https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html
status: draft
---

# Amazon Route 53

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Route 53 = das **Telefonbuch der Cloud** (DNS): übersetzt Namen in IPs, mit 100-%-Verfügbarkeits-SLA. Kann Domains registrieren, Hosted Zones verwalten (public/private) und mit **Routing Policies** intelligent antworten — je nach Latenz, Standort oder Gesundheit des Ziels.

Der SAA prüft Route 53 an drei Stellen gnadenlos: **ALIAS vs. CNAME, die richtige Routing Policy zum Szenario — und Hybrid-DNS mit den Resolver Endpoints.**

---

## 🎯 SAA-Vertiefung

### ALIAS vs. CNAME — DIE Route-53-Frage

**Das Problem:** `firma.de` (ohne www — der **Zone Apex**) soll auf einen ALB zeigen. Ein CNAME wäre naheliegend — aber die Konsole verweigert ihn. Warum?

**Die Lösung:** Der DNS-Standard verbietet CNAME am Zone Apex. AWS' Antwort ist der **ALIAS-Record** — und die Gegenüberstellung ist auswendig zu können:

| | **ALIAS** | **CNAME** |
|---|---|---|
| Am **Zone Apex** (`firma.de`)? | **JA** | **NEIN** (RFC-Verbot) |
| Zeigt auf … | nur **AWS-Ressourcen** (ELB, CloudFront, S3-Website, API GW, andere Records der Zone) | **beliebige** DNS-Namen (auch extern) |
| Query-Kosten | **kostenlos** (zu AWS-Zielen) | kostenpflichtig |
| Eigenes TTL? | nein (folgt dem Ziel) | ja |
| Reagiert auf IP-Wechsel des Ziels | automatisch/sofort | über den Zielnamen |

Die zwei Reflexe: **„Zone Apex auf ALB/CloudFront" → ALIAS** (die einzige Möglichkeit). **„Auf einen externen Dienst außerhalb von AWS zeigen" → CNAME** (ALIAS kann das nicht). Und der Distraktor „A-Record mit der ALB-IP" ist immer falsch — ELB-IPs wechseln.

> **💡 Merksatz:** **Zone Apex → ALIAS** (gratis, nur AWS-Ziele, kein eigenes TTL). **Externes Ziel → CNAME** (nie am Apex).

### Routing Policies: Acht Antworten auf „Wohin?"

**Das Problem:** Die Prüfung beschreibt ein Verteilungs-Szenario — und vier Policies in den Antwortoptionen klingen alle plausibel.

**Die Lösung — die Zuordnung über das Signalwort:**

| Das Szenario sagt … | Policy |
|---|---|
| Ein Ziel, keine Logik | **Simple** |
| „10 % auf die neue Version" (Canary), A/B-Test | **Weighted** |
| „Nutzer zur **schnellsten** Region" | **Latency-based** |
| „Primary/Standby, bei Ausfall umschalten" (DR!) | **Failover** (+ Health Check) |
| „Nutzer aus der EU **müssen** zu EU-Servern" (Compliance, Sprachen) | **Geolocation** |
| „Traffic-Anteil einer Region **verschieben**" (Bias) | **Geoproximity** (Traffic Flow) |
| „mehrere gesunde IPs zufällig zurückgeben" (Client-seitiges LB light) | **Multivalue Answer** (bis 8) |
| Routing nach bekannten **Quell-IP-Bereichen** | **IP-based** |

Die zwei Verwechslungspärchen, die Punkte kosten:
- **Latency vs. Geolocation:** Latency optimiert **Geschwindigkeit** (der Ire kann in us-east-1 landen, wenn das gerade schneller ist) — Geolocation erzwingt **Herkunft** (der Ire landet *immer* in der EU, egal wie langsam). Compliance-Wörter → Geolocation.
- **Geolocation vs. Geoproximity:** Geolocation fragt „**wo ist der Nutzer**", Geoproximity „**wo ist die Ressource**" — und kann per **Bias** den Einzugsbereich einer Region vergrößern/verkleinern („mehr Traffic nach eu-central-1 schieben").

Dazu die **Health Checks** als Fundament von Failover & Co.: **Endpoint**-Checks (HTTP/HTTPS/TCP, optional String-Matching), **Calculated** (kombiniert mehrere Checks) und **CloudWatch-Alarm-basiert** — Letzteres der einzige Weg, **private** Ressourcen zu überwachen, die die Route-53-Checker nicht erreichen. Und die TTL-Falle: Beim Failover schaltet Route 53 sofort um — aber Clients cachen die alte Antwort noch **TTL-lang**. „Failover soll schnell greifen" → **niedrige TTL** gehört zur Antwort.

> **💡 Merksatz:** **Schnellste Region → Latency · Herkunft erzwingen → Geolocation · Anteile verschieben → Geoproximity (Bias) · DR → Failover + Health Check + niedrige TTL.** Private Ziele prüfen → **CloudWatch-Alarm-Health-Check**.

### Hybrid-DNS: Die Resolver Endpoints

**Das Problem:** Zwei Welten, zwei Telefonbücher: On-prem-Server müssen `db.firma.aws` (Private Hosted Zone) auflösen — und EC2-Instanzen müssen `erp.firma.local` (on-prem-DNS) finden. Standardmäßig kennt keine Seite die andere.

**Die Lösung:** **Route 53 Resolver Endpoints** — die Richtung ist der Merkpunkt:
- **Inbound Endpoint:** on-prem → AWS. Der Firmen-DNS-Server *forwarded* Anfragen für die AWS-Zonen an die Inbound-ENIs in der VPC.
- **Outbound Endpoint + Forwarding Rules:** AWS → on-prem. Der VPC-Resolver leitet Anfragen für `firma.local` per Regel an die on-prem-DNS-Server weiter.

Vollständiges Hybrid-DNS = beide Endpoints. Und die Voraussetzung, die als Detailfrage kommt: Eine **Private Hosted Zone** funktioniert nur, wenn in der VPC **`enableDnsSupport` und `enableDnsHostnames`** aktiviert sind — „private Zone löst nicht auf" ist fast immer diese Einstellung.

Randnotizen zur Vollständigkeit: **DNS Firewall** (ausgehende DNS-Abfragen filtern — siehe Network-Firewall-Skript) und **ARC/Zonal Shift** (Application Recovery Controller: Traffic bewusst aus einer AZ/Region herauslenken — nur als Begriff erkennen).

> **💡 Merksatz:** **Inbound = on-prem fragt AWS · Outbound + Rules = AWS fragt on-prem.** Private Hosted Zone braucht **enableDnsSupport + enableDnsHostnames**.

---

## ⚠️ Prüfungs-Knackpunkte

- **ALIAS:** Zone Apex ✓, gratis, nur AWS-Ziele, kein eigenes TTL · **CNAME:** nie am Apex, beliebige Ziele, kostet. „firma.de → ALB" = **ALIAS**.
- Policies: Weighted (Canary/A-B) · Latency (schnellste Region) · **Failover (DR, active-passive)** · Geolocation (Herkunft/Compliance) · Geoproximity (**Bias**, Traffic Flow) · Multivalue (bis 8 gesunde Records) · IP-based.
- **Latency ≠ Geolocation** (Speed vs. Zwang); **Geolocation ≠ Geoproximity** (Nutzer-Standort vs. Ressourcen-Standort mit Bias).
- Health Checks: Endpoint / **Calculated** / **CloudWatch-Alarm (einziger Weg für private Ressourcen)**; Failover-Tempo hängt an der **TTL**.
- Hybrid-DNS: **Inbound** (on-prem→AWS) / **Outbound + Forwarding Rules** (AWS→on-prem).
- Private Hosted Zone: VPC-Assoziation + **enableDnsSupport/enableDnsHostnames**.
- Randnotizen: DNS Firewall (DNS-Egress), ARC/Zonal Shift (Traffic aus AZ lenken).

## 💡 Der eine Satz zum Mitnehmen

**Route-53-Fragen sind Zuordnungsfragen mit drei Ebenen: der Record-Typ (Apex → ALIAS), die Policy (Signalwort → eine von acht) und die Richtung des Resolver-Endpoints (wer fragt wen?)** — wer die drei Tabellen kann, löst die Domäne fast mechanisch.
