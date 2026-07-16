---
service: Elastic Load Balancing (ALB / NLB / GWLB)
seedKey: saa-c03-script-elb
batch: B4
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/userguide/how-elastic-load-balancing-works.html
  - https://docs.aws.amazon.com/elasticloadbalancing/latest/gateway/gateway-load-balancers.html
  - https://aws.amazon.com/about-aws/whats-new/2023/08/network-load-balancer-supports-security-groups/
status: draft
---

# Elastic Load Balancing

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> ELB = der **Verkehrspolizist**, der Anfragen auf gesunde Ziele verteilt und mit ASG + CloudWatch das Standard-HA-Trio bildet. Drei moderne Typen: **ALB** (Layer 7, HTTP/HTTPS, intelligentes Routing), **NLB** (Layer 4, TCP/UDP, extrem schnell, statische IP), **GWLB** (für Security-Appliances). **CLB** = Legacy.

Der SAA fragt: **Welcher Typ genau — und woran erkennt man das im Szenario? Plus die Detailfallen: Cross-Zone, WAF und die neue NLB-Security-Group.**

---

## 🎯 SAA-Vertiefung

### ALB: Der Türsteher, der die Anfrage liest

**Das Problem:** Eine Anwendung besteht aus Microservices: `/api/*` gehört zum Backend, `/images/*` zum Bilderdienst, `admin.firma.de` zur Verwaltungsoberfläche. Alles soll hinter **einer** Adresse liegen.

**Die Lösung:** Der **ALB arbeitet auf Layer 7** — er **liest den HTTP-Request** und kann danach routen: nach **Pfad**, **Host-Header**, **HTTP-Header**, **Query-String** oder Quell-IP, an unterschiedliche **Target Groups**. Sein Feature-Katalog ist der Grund, warum er die Standardantwort für Webanwendungen ist:

- **Lambda als Target** (eine Serverless-Funktion direkt hinter dem Load Balancer),
- **Authentifizierung** über **Cognito/OIDC** direkt am ALB (Login, bevor die App überhaupt gefragt wird),
- **SNI** — mehrere TLS-Zertifikate an einem Listener (viele Domains, ein ALB),
- **Sticky Sessions** über Cookie, WebSockets, HTTP/2,
- und der wichtigste Punkt für D1: **AWS WAF lässt sich an den ALB hängen.**

> **💡 Merksatz:** Alles, was mit **HTTP-Inhalten** zu tun hat — Pfad-/Host-Routing, WAF, Cognito-Login, Lambda-Targets — ist **ALB**.

### NLB: Der Rohr-Verleger

**Das Problem:** Ein Spieleserver spricht **UDP**. Eine Legacy-Firewall beim Kunden lässt nur **feste Ziel-IP-Adressen** durch. Und ein Zahlungsdienstleister braucht die **echte Quell-IP** des Clients für sein Fraud-System — nicht die des Load Balancers.

**Die Lösung:** Der **NLB arbeitet auf Layer 4**: Er schaut sich den Inhalt gar nicht an, er verlegt Rohre. Genau daraus folgen seine drei Alleinstellungsmerkmale, die jedes für sich eine Prüfungsfrage sind:
- **TCP/UDP/TLS** (der ALB kann kein UDP!),
- **statische IP pro AZ / Elastic IP** — der einzige Load Balancer mit fester IP (Firewall-Whitelisting),
- **Preserve Source IP** — die Anwendung sieht die echte Client-IP,
- plus: **Millionen Requests pro Sekunde** bei minimaler Latenz und **PrivateLink-Fähigkeit** (ein Endpoint Service braucht zwingend einen NLB).

Und die Falle, die AWS gern stellt: **Der NLB unterstützt kein AWS WAF.** Steht im Szenario „Layer-7-Schutz / SQL-Injection abwehren / WAF" und in den Antwortoptionen „NLB + WAF", ist das falsch — WAF geht an **ALB, CloudFront oder API Gateway**.

🛑 **Aktualität, die alte Kursmaterialien falsch haben:** **Seit August 2023 unterstützt der NLB Security Groups.** Der alte Merksatz „NLB hat keine Security Group, also muss man auf den Instanzen filtern" ist überholt. (Zu setzen nur bei der Erstellung.)

> **💡 Merksatz:** **UDP, statische IP, Source-IP erhalten, PrivateLink, extreme Performance → NLB.** Aber: **NLB + WAF geht nicht.** 🛑 NLB **hat** inzwischen Security Groups.

### GWLB: Der unsichtbare Kontrollpunkt

**Das Problem:** Die Sicherheitsabteilung besteht auf ihrer gewohnten **Palo-Alto-/Fortinet-Appliance**. Diese soll **jeden** Paketfluss inspizieren — transparent, ohne dass Anwendungen ihre IPs oder Routen ändern.

**Die Lösung:** Der **Gateway Load Balancer** arbeitet auf **Layer 3** und ist der einzige, der **Third-Party-Appliances transparent inline** schaltet: Er kapselt den Traffic per **GENEVE (Port 6081)**, schickt ihn durch die Appliance-Flotte (die er zugleich skaliert und gesund hält) und leitet ihn dann weiter. Der Einstiegspunkt ist ein **GWLB Endpoint (GWLBe)**, den man als **Next Hop in einer Route Table** einträgt — meist in einer zentralen **Inspection VPC** am Transit Gateway.

> **💡 Merksatz:** **Third-Party-Security-Appliance transparent einbinden → GWLB (GENEVE 6081) + GWLBe als Route-Ziel.** Managed AWS-Firewall dagegen → **Network Firewall**.

### Die Detailfallen: Cross-Zone, Draining, Health Checks

**Das Problem:** Zwei AZs, in der einen 8 Instanzen, in der anderen 2. Der Load Balancer verteilt 50/50 auf die AZs — die zwei Instanzen glühen, die acht langweilen sich.

**Die Lösung:** **Cross-Zone Load Balancing** verteilt auf *alle* Ziele über alle AZs hinweg statt nur AZ-intern. Und hier liegt die Falle: **Beim ALB ist es standardmäßig AN** (und kostenlos), **beim NLB und GWLB standardmäßig AUS** — dort muss man es aktivieren, und dann fallen **Cross-AZ-Datentransfergebühren** an. „Ungleichmäßige Last trotz Load Balancer" → beim NLB Cross-Zone einschalten.

Dazu zwei Betriebs-Details:
- **Deregistration Delay / Connection Draining** (Default **300 s**): Beim Herausnehmen einer Instanz werden laufende Anfragen noch zu Ende bedient. Antwort auf „Nutzer verlieren beim Deployment ihre Verbindung".
- **Health Checks:** Der ALB prüft **anwendungsnah** (HTTP-Pfad wie `/health`), der NLB nur TCP/Ping. Diese Health Checks sind es auch, an die die Auto Scaling Group ihren Health-Check-Typ hängen sollte (siehe Auto-Scaling-Skript).

Verschlüsselung: Ein Load Balancer kann TLS **terminieren** (ACM-Zertifikat, entlastet die Instanzen) — soll die Verschlüsselung durchgehen (**End-to-End**), verschlüsselt man vom LB zum Target erneut. Und wenn eine reine **TLS-Passthrough**-Anforderung besteht (der LB darf gar nicht entschlüsseln), ist der **NLB im TCP-Modus** die Antwort.

> **💡 Merksatz:** **Cross-Zone: ALB an (gratis), NLB/GWLB aus (kostet Cross-AZ).** Verbindungsabbrüche beim Deployment → **Deregistration Delay**. TLS darf nicht entschlüsselt werden → **NLB (TCP-Passthrough)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **ALB (L7):** Pfad-/Host-/Header-Routing, **WAF**, **Cognito/OIDC-Auth**, **Lambda-Targets**, SNI, WebSockets, Sticky Sessions.
- **NLB (L4):** **UDP/TCP/TLS**, **statische IP/EIP**, **Source-IP erhalten**, Millionen req/s, **PrivateLink-Basis**; 🛑 **hat seit 08/2023 Security Groups**; **kein WAF**.
- **GWLB (L3):** Third-Party-Appliances transparent, **GENEVE Port 6081**, **GWLBe** als Route-Next-Hop (Inspection VPC).
- **Cross-Zone: ALB Default AN (kostenlos), NLB/GWLB Default AUS** (aktivierbar, dann Cross-AZ-Gebühren).
- **Deregistration Delay/Connection Draining** (Default 300 s) gegen Verbindungsabbrüche.
- Health Checks: ALB app-aware (HTTP-Pfad), NLB TCP — ASG sollte den **ELB-Health-Check** nutzen.
- TLS-Passthrough (LB darf nicht entschlüsseln) → **NLB TCP**; TLS-Termination → ALB/NLB mit **ACM**-Zertifikat.
- Target-Typen: Instance, IP, **Lambda (nur ALB)**, und **ALB als Target eines NLB** (z. B. für PrivateLink vor HTTP-Services).
- **CLB = Legacy** — in neuen Architekturen immer Distraktor.

## 💡 Der eine Satz zum Mitnehmen

**Die Load-Balancer-Frage beantwortet sich an einem einzigen Signalwort: HTTP-Inhalt (Pfad, Host, WAF, Login) → ALB · UDP, statische IP, Source-IP, PrivateLink → NLB · fremde Security-Appliance → GWLB.**
