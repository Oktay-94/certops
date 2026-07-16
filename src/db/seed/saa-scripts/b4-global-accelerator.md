---
service: AWS Global Accelerator
seedKey: saa-c03-script-global-accelerator
batch: B4
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/global-accelerator/latest/dg/what-is-global-accelerator.html
  - https://aws.amazon.com/global-accelerator/faqs/
status: draft
---

# AWS Global Accelerator

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Global Accelerator = die **Schnellstraße ins AWS-Netz**: Nutzer-Traffic verlässt das öffentliche Internet am **nächstgelegenen Edge-Standort** und reist ab dort über das private **AWS-Backbone** zur Anwendung — weniger Hops, stabile Latenz. Kein Cache, sondern ein besserer **Weg**.

Der SAA prüft im Kern eine einzige Abgrenzung — **CloudFront vs. Global Accelerator** — plus die Anatomie: statische IPs, Endpoint Groups, Failover.

---

## 🎯 SAA-Vertiefung

### Zwei Adressen für die ganze Welt

**Das Problem:** Ein globaler Spieleanbieter hat drei Anforderungen, an denen DNS-basierte Lösungen scheitern: Die Kunden-Firewalls brauchen **feste IP-Adressen** zum Whitelisten. Das Spiel spricht **UDP** (kein HTTP). Und beim Regionsausfall soll das Umschalten **nicht** davon abhängen, wann tausende Clients ihren DNS-Cache leeren.

**Die Lösung:** Global Accelerator gibt der Anwendung **zwei statische Anycast-IPv4-Adressen** (aus zwei getrennten Network Zones — eingebaute Redundanz). „Anycast" heißt: Dieselben zwei IPs werden **weltweit an allen Edge-Standorten** announced — jeder Nutzer erreicht unter derselben Adresse automatisch den nächstgelegenen Einstieg ins AWS-Backbone. Dahinter verteilt GA auf **Layer 4 (TCP/UDP)** an die Endpoints: **ALB, NLB, EC2 oder Elastic IPs** — auch über mehrere Regionen.

Damit fallen die drei Anforderungen von oben in eins: **feste IPs** (Firewall-Whitelisting, kein DNS-Chaos), **UDP-fähig**, und Failover passiert **im Netz statt im DNS** — GA prüft die Endpoints per Health Check und lenkt neue Verbindungen sofort um, ohne auf TTLs zu warten. 🔴 Die kursierende Zahl „Failover < 1 Minute" ist **nicht offiziell** — als „deterministisch schnell, ohne DNS-Propagation" lehren, nicht als Sekundenwert.

Feinsteuerung: **Endpoint Groups** (eine pro Region) mit **Traffic Dials** (Prozent-Regler pro Region — „20 % nach eu-central-1 für den Canary-Test"), Gewichte pro Endpoint, **Client Affinity** (derselbe Client landet beim selben Endpoint — für zustandsbehaftete Protokolle) und als Spezialfall **Custom Routing** (deterministisch ein bestimmter Client → eine bestimmte EC2/Port-Kombination, z. B. Game-Session-Zuweisung). Shield-DDoS-Schutz ist integriert.

> **💡 Merksatz:** GA = **2 statische Anycast-IPs + AWS-Backbone + L4 (TCP/UDP)** über Regionen. Failover läuft **im Netz, nicht im DNS** (🔴 „<1 min" ist keine offizielle Zahl). Regional dosieren → **Traffic Dials**.

### CloudFront vs. Global Accelerator — DIE Abgrenzung

**Das Problem:** Beide nutzen dieselben Edge-Standorte und dasselbe Backbone, beide machen „global schneller". Die Prüfung liebt es, sie nebeneinander in die Antwortoptionen zu stellen.

**Die Lösung:** Der Unterschied ist fundamental: **CloudFront speichert (Cache), GA transportiert (Weg).** Die offizielle FAQ-Formulierung ist praktisch die Prüfungsantwort: CloudFront verbessert die Performance für **cacheable Content und dynamisches HTTP** — Global Accelerator ist die Wahl für **non-HTTP-Anwendungen (Gaming/UDP, IoT/MQTT, VoIP)** sowie für HTTP-Fälle, die **statische IPs** oder **deterministisch schnelles Regions-Failover** brauchen.

| Das Szenario sagt … | Antwort |
|---|---|
| Website, Videos, API-Responses cachen; HTTP | **CloudFront** |
| **UDP/TCP non-HTTP** (Game-Server, MQTT, VoIP, Custom-Protokoll) | **Global Accelerator** |
| **Statische IPs** für Partner-Firewalls | **Global Accelerator** |
| Multi-Region-**Failover ohne DNS-Wartezeit** | **Global Accelerator** |
| Nutzer per DNS zur latenzbesten Region (ohne feste IPs, Caching egal) | Route 53 Latency-based (der günstige Dritte) |

Merkbild: **CloudFront ist das Filialnetz** (die Ware liegt schon vor Ort), **GA ist die Privatautobahn** (die Fahrt zum Zentrallager wird schneller). Wer Videos ausliefert, braucht Filialen; wer UDP-Pakete in Echtzeit zustellt, braucht die Autobahn.

> **💡 Merksatz:** **Cachebar/HTTP → CloudFront. Non-HTTP, statische IPs oder schnelles Regions-Failover → Global Accelerator.** Dieselben Edges, zwei völlig verschiedene Jobs.

---

## ⚠️ Prüfungs-Knackpunkte

- **2 statische Anycast-IPv4s** (2 Network Zones), weltweit gleiche Adresse, Einstieg am nächsten Edge → **AWS-Backbone**.
- **Layer 4 (TCP/UDP)**; Endpoints: ALB, NLB, **EC2, Elastic IP** — multi-region.
- Failover über **Health Checks im Netz** — kein DNS-TTL-Problem; 🔴 „< 1 Minute" nicht als offizielle Zahl lehren.
- **Endpoint Groups + Traffic Dials** (Prozent pro Region), Endpoint-Gewichte, **Client Affinity**, **Custom Routing** (deterministisch Client → EC2/Port).
- **Shield**-Schutz integriert; Accelerated Site-to-Site VPN nutzt GA unter der Haube.
- **DIE Abgrenzung:** cachebar/HTTP → **CloudFront** · non-HTTP (UDP/MQTT/VoIP), statische IPs, deterministisches Regions-Failover → **GA** · nur DNS-Steuerung → Route 53 Latency.

## 💡 Der eine Satz zum Mitnehmen

**Global Accelerator baut keinen Cache, sondern eine Privatautobahn mit zwei festen Hausnummern** — es gewinnt jede Frage mit UDP, statischen IPs oder DNS-freiem Regions-Failover, und verliert jede, in der „cachen" oder „HTTP-Inhalte ausliefern" steht.
