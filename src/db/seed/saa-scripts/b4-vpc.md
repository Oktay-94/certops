---
service: Amazon VPC
seedKey: saa-c03-script-vpc
batch: B4
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/userguide/subnet-sizing.html
  - https://docs.aws.amazon.com/vpc/latest/userguide/configure-subnets.html
  - https://aws.amazon.com/vpc/faqs/
status: draft
---

# Amazon VPC

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Die VPC = **dein privates, isoliertes Netzwerk in AWS** — das Fundament, in dem EC2, RDS und alles andere lebt. Die zwei Firewalls: **Security Group** = Wächter *an der Instanz*, **stateful**, nur ALLOW. **NACL** = Wächter *am Subnetz*, **stateless**, kann auch DENY. Ein Subnetz ist **öffentlich**, wenn seine **Route Table zum Internet Gateway** zeigt — es gibt kein „public"-Häkchen. **VPC Peering ist nicht transitiv.**

Der SAA rechnet nach und gräbt tiefer: **Wie viele IPs hat ein /24 wirklich? Warum blockiert die NACL trotz korrekter Inbound-Regel? Und was geht mit Peering ausdrücklich nicht?**

---

## 🎯 SAA-Vertiefung

### Die Rechenfrage: Warum ein /24 nur 251 nutzbare IPs hat

**Das Problem:** „Ihr Subnetz ist ein /24. Wie viele EC2-Instanzen können Sie darin starten?" Wer 256 oder 254 antwortet, ist auf die Falle hereingefallen.

**Die Lösung:** **AWS reserviert in jedem Subnetz fünf IP-Adressen** — und zwar immer dieselben fünf:

| Adresse (Beispiel 10.0.0.0/24) | Wofür |
|---|---|
| `.0` | Netzwerkadresse |
| `.1` | **VPC-Router** |
| `.2` | **Amazon DNS** (Basis + 2) |
| `.3` | „reserved for future use" |
| `.255` | Broadcast (in VPCs nicht unterstützt, trotzdem reserviert) |

→ **256 − 5 = 251 nutzbare IPs.** Analog: ein /28 (16 Adressen) hat nur **11** nutzbare — und /28 ist zugleich das **kleinstmögliche** Subnetz. Die VPC selbst darf **/16 bis /28** groß sein (bis zu **5 IPv4-CIDR-Blöcke**: 1 primär + 4 sekundär).

Praktische Konsequenz, die geprüft wird: Bei einer Auto-Scaling-Gruppe, Fargate-Tasks im `awsvpc`-Modus (jeder Task eine ENI!) oder EKS-Pods mit VPC-CNI ist der **IP-Verbrauch** der eigentliche Engpass — „Instanzen starten nicht, weil das Subnetz keine IPs mehr hat" ist ein echtes SAA-Szenario. Antwort: größeres Subnetz bzw. **sekundärer CIDR-Block**.

> **💡 Merksatz:** **AWS reserviert 5 IPs pro Subnetz** → /24 = 251 nutzbar, /28 (kleinstmöglich) = 11. Bei `awsvpc`/EKS frisst jede Task/jeder Pod eine IP.

### Security Group vs. NACL: Die Ephemeral-Port-Falle

**Das Problem:** Die NACL erlaubt eingehend Port 443. Trotzdem funktioniert der Web-Zugriff nicht. Die Security Group ist korrekt. Was fehlt?

**Die Lösung:** Die **NACL ist stateless** — sie merkt sich nichts. Der Client verbindet von einem zufälligen hohen Port (**Ephemeral Port, 1024–65535**) auf Port 443. Die **Antwort** geht von Port 443 zurück an genau diesen hohen Port — und dafür braucht es eine **eigene Outbound-Regel für 1024–65535**. Fehlt die, versickert jede Antwort. Bei der **stateful Security Group** passiert das nie: Sie erinnert sich an die erlaubte eingehende Verbindung und lässt die Antwort automatisch durch.

Die zweite Unterscheidung mit Punktwert: **NACLs können explizit DENY**, Security Groups nur ALLOW. Signalwort **„eine bestimmte IP-Adresse aussperren"** → **NACL** (in einer Security Group ist das schlicht unmöglich). NACL-Regeln werden nach **Nummer** ausgewertet — die **erste passende Regel gewinnt**, danach wird nicht weitergeschaut.

Und der Bonus, den nur Security Groups können: Sie dürfen **andere Security Groups referenzieren** („alles aus der `sg-web` darf auf Port 3306 in die `sg-db`") — das ist die saubere Tier-Architektur, ganz ohne IP-Listen.

> **💡 Merksatz:** **Stateless NACL braucht Ephemeral-Port-Rückweg (1024–65535).** IP explizit sperren → **NACL** (SG kann kein DENY). Tier-zu-Tier-Regeln → **SG-Referenzen** statt IPs.

### VPC Peering: Was es kann — und die drei Dinge, die es nicht kann

**Das Problem:** VPC A ist mit B verbunden, B mit C. Warum erreicht A nicht C? Und warum lässt sich VPC D (10.0.0.0/16) nicht mit VPC E (10.0.0.0/16) peeren?

**Die Lösung:** VPC Peering ist eine **direkte 1:1-Standleitung** — mit drei harten Grenzen, die jede für sich Prüfungsstoff sind:
1. **Nicht transitiv:** A↔B und B↔C bedeutet **nie** A↔C. Für Vollvernetzung bräuchte man ein Full Mesh mit **n(n−1)/2** Verbindungen — bei 10 VPCs sind das 45, bei 50 VPCs 1.225. Genau hier kippt die Antwort zum **Transit Gateway**.
2. **Keine überlappenden CIDRs** — zwei VPCs mit demselben Adressbereich lassen sich nicht peeren (dann hilft nur **PrivateLink**).
3. **Kein Edge-to-Edge-Routing:** On-Prem (via VPN/DX an VPC A) erreicht **nicht** das gepeerte VPC B. Auch NAT Gateway, IGW oder Endpoints von A darf B nicht mitbenutzen.

Was es dafür kann: **cross-region und cross-account**, kein Bandbreiten-Bottleneck, keine Zusatzkosten pro Attachment.

> **💡 Merksatz:** Peering = **nicht transitiv, keine CIDR-Überlappung, kein Edge-to-Edge**. Wenige VPCs → Peering. Viele VPCs oder on-prem → **Transit Gateway**. Überlappende CIDRs → **PrivateLink**.

### Routing und die IPv6-Nuance

Die **Route Table** entscheidet über alles — und der **Longest Prefix Match** gewinnt: Eine spezifischere Route (`10.0.1.0/24`) schlägt immer die allgemeinere (`0.0.0.0/0`). Die `local`-Route (VPC-intern) ist unveränderbar und schlägt alles.

Bei **IPv6** dreht sich eine Selbstverständlichkeit um: IPv6-Adressen sind **immer öffentlich routbar** — es gibt keine „privaten" IPv6-Adressen wie bei RFC 1918. Damit eine IPv6-Instanz **nur ausgehend** ins Internet darf, braucht es kein NAT, sondern ein **Egress-Only Internet Gateway** (das IPv6-Pendant zur Katzenklappe). Ein NAT Gateway macht bei IPv6 nur **NAT64** (IPv6 → IPv4-Ziele).

Für große Umgebungen noch zwei Werkzeuge: **VPC Sharing über AWS RAM** (mehrere Accounts nutzen Subnetze **einer** VPC — spart Peering/TGW-Aufwand) und **IPAM** (zentrale IP-Adressplanung gegen CIDR-Kollisionen über viele Accounts).

> **💡 Merksatz:** Routing = **Longest Prefix Match**. IPv6 hat kein „privat" → nur ausgehend = **Egress-Only IGW** (nicht NAT).

---

## ⚠️ Prüfungs-Knackpunkte

- **5 reservierte IPs pro Subnetz** → /24 = **251** nutzbar; kleinstes Subnetz **/28** (11 nutzbar); VPC-CIDR **/16–/28**, bis 5 CIDR-Blöcke.
- IP-Erschöpfung bei `awsvpc`-Tasks/EKS-Pods → größeres Subnetz / sekundärer CIDR.
- **Public Subnet = Route zum IGW** (kein Häkchen!); privat = keine IGW-Route.
- **SG stateful, nur ALLOW, kann andere SGs referenzieren** · **NACL stateless, ALLOW+DENY, nummeriert, erste Treffer-Regel gewinnt**.
- NACL-Klassiker: **Ephemeral Ports 1024–65535 outbound** für Rückantworten; „bestimmte IP sperren" → **nur NACL**.
- **Peering: nicht transitiv, keine überlappenden CIDRs, kein Edge-to-Edge** (on-prem erreicht das gepeerte VPC nicht, kein Mitbenutzen von NAT/IGW).
- **Longest Prefix Match**; `local`-Route unveränderbar.
- IPv6 nur ausgehend → **Egress-Only IGW**; NAT Gateway macht bei IPv6 nur **NAT64**.
- **VPC Sharing (RAM)** und **IPAM** für Multi-Account-Netzwerke.

## 💡 Der eine Satz zum Mitnehmen

**Fast jede VPC-Frage entscheidet sich an einer von drei Stellen: der Route Table (was ist „öffentlich"?), dem Unterschied stateful/stateless (wer braucht den Rückweg?) — oder daran, dass Peering genau die drei Dinge nicht kann, die das Szenario verlangt.**
