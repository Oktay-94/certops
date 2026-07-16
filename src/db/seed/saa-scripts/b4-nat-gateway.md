---
service: NAT Gateway (+ NAT Instance)
seedKey: saa-c03-script-nat-gateway
batch: B4
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/userguide/nat-gateway-basics.html
  - https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-comparison.html
status: draft
---

# NAT Gateway

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> NAT Gateway = die **Katzenklappe**: private Server dürfen **raus** (Updates, externe APIs), aber von außen kommt niemand **rein**. Es liegt im **öffentlichen** Subnetz, dient aber den **privaten** Subnetzen (deren Route `0.0.0.0/0` auf das NAT zeigt). Abgrenzung: **Internet Gateway = Haustür (rein und raus)**, NAT = Einbahnstraße.

Der SAA fragt nach Verfügbarkeit, Kosten und Grenzen: **Warum ein NAT pro AZ? Warum ist NAT der teuerste Weg zu S3? Und warum kann man dem NAT Gateway keine Security Group geben?**

---

## 🎯 SAA-Vertiefung

### Ein NAT pro AZ — sonst reißt der AZ-Ausfall alles mit

**Das Problem:** Eine Architektur läuft brav über drei AZs, mit einem NAT Gateway in AZ-A, auf das alle privaten Subnetze routen. Dann fällt AZ-A aus — und plötzlich haben **alle drei AZs** keinen Internet-Ausgang mehr. Die Instanzen laufen, aber Updates, Lizenz-Server und externe APIs sind tot.

**Die Lösung:** Ein NAT Gateway ist **AZ-gebunden**. AWS baut es *innerhalb* seiner AZ redundant — aber es überlebt den Ausfall dieser AZ nicht. Das HA-Muster lautet deshalb: **ein NAT Gateway pro AZ**, und jedes private Subnetz routet auf das NAT **seiner eigenen** AZ. Das ist zugleich der Kosten-Tipp: Es vermeidet **Cross-AZ-Datentransfergebühren** (Traffic bleibt in der AZ).

Zu den Kapazitätszahlen: NAT Gateway startet bei **5 Gbps und skaliert automatisch bis 100 Gbps** — Bandbreite ist praktisch nie das Prüfungsproblem. Interessanter ist die Verbindungsgrenze: **55.000 gleichzeitige Verbindungen pro Ziel und IP-Adresse** — bei extremen Verbindungszahlen zu *einem* Ziel hilft es, dem NAT weitere IPs zu geben.

> **💡 Merksatz:** **NAT Gateway ist AZ-gebunden → ein NAT pro AZ** für HA (und um Cross-AZ-Gebühren zu sparen). Ein einzelnes NAT für alle AZs = SPOF.

### Die teuerste Route zu S3

**Das Problem:** Ein Data-Lake-Job in einem privaten Subnetz schaufelt täglich Terabytes nach S3. Am Monatsende steht ein vierstelliger Betrag auf der Rechnung — beim **NAT Gateway**, nicht bei S3.

**Die Lösung:** Das NAT Gateway kostet **pro Stunde plus pro verarbeitetem Gigabyte**. Für Traffic zu **AWS-Diensten** ist das dreifach unsinnig: Es ist teuer, es ist ein Umweg, und die Daten verlassen dabei unnötig den direkten AWS-Pfad. Die Antwort heißt **VPC Endpoints**:
- **S3 und DynamoDB → Gateway Endpoint (kostenlos!)** — der Standardreflex bei „NAT-Kosten senken".
- Andere AWS-Dienste → **Interface Endpoint** (kostet, aber meist deutlich weniger als NAT-Data-Processing).

Und seit 🛑 **01.02.2024** kommt eine zweite Kostenschraube dazu: **jede öffentliche IPv4-Adresse kostet $0,005 pro Stunde** — auch die des NAT Gateways, auch in Benutzung. Das verstärkt zwei Architektur-Trends, die in aktuellen Fragen auftauchen: **weniger öffentliche IPs** (NAT konsolidieren, private ALBs, CloudFront VPC Origins) und **IPv6**.

> **💡 Merksatz:** **NAT kostet pro GB** → Traffic zu S3/DynamoDB gehört über den **kostenlosen Gateway Endpoint**. 🛑 Seit 02/2024 kostet zusätzlich **jede public IPv4** Geld.

### Die Detailfallen: keine Security Group, kein Bastion, kein IPv6-Egress

Drei kleine Fakten, die ganze Antwortoptionen kippen:
- **Ein NAT Gateway hat keine Security Group.** Man kann seinen Traffic nur über die **NACL des Subnetzes** einschränken. Wer „Security Group am NAT Gateway" liest, liest einen Distraktor.
- **Ein NAT Gateway kann nicht als Bastion Host dienen** — man kann sich nicht darauf einloggen. Das konnte die alte **NAT Instance** (eine normale EC2 mit deaktiviertem **Source/Destination Check**), die aber selbst gepatcht, skaliert und hochverfügbar gebaut werden muss. AWS empfiehlt eindeutig das NAT Gateway; das alte NAT-AMI wird nicht mehr gepflegt. Für Shell-Zugriff ist die moderne Antwort ohnehin **SSM Session Manager**.
- **Für reines IPv6-Egress ist NAT falsch** — dort heißt die Antwort **Egress-Only Internet Gateway**. Das NAT Gateway macht bei IPv6 nur **NAT64** (IPv6-Client erreicht IPv4-Ziel).

> **💡 Merksatz:** NAT Gateway = **keine SG (nur NACL), kein Bastion, kein IPv6-Egress**. NAT Instance ist Legacy (Source/Dest-Check!), IPv6-Egress = **Egress-Only IGW**.

---

## ⚠️ Prüfungs-Knackpunkte

- **AZ-gebunden → ein NAT Gateway pro AZ** (HA + Vermeidung von Cross-AZ-Kosten); ein NAT für alle AZs = SPOF.
- Liegt im **öffentlichen** Subnetz, dient den **privaten** (Route `0.0.0.0/0 → nat-...`).
- Kapazität: **5 → 100 Gbps automatisch**; **55.000 gleichzeitige Verbindungen pro Ziel/IP** (mehr IPs = mehr Verbindungen).
- **Kosten pro Stunde + pro GB** → Traffic zu **S3/DynamoDB über Gateway Endpoint (gratis)** umleiten; 🛑 seit 02/2024 zusätzlich **$0,005/h pro public IPv4**.
- **Keine Security Group** am NAT Gateway (nur NACL); **kein Bastion-Ersatz** (das konnte nur die NAT Instance).
- **NAT Instance** = Legacy: **Source/Destination Check deaktivieren**, selbst skalieren/patchen; altes AMI wird nicht mehr gepflegt.
- **IPv6 nur ausgehend → Egress-Only IGW**; NAT macht bei IPv6 nur **NAT64**.

## 💡 Der eine Satz zum Mitnehmen

**Das NAT Gateway ist die richtige Antwort auf „privat raus ins Internet" — und die falsche auf fast alles andere**: für S3/DynamoDB gibt es den kostenlosen Gateway Endpoint, für IPv6 das Egress-Only IGW, für Shell-Zugriff den Session Manager, und für Hochverfügbarkeit braucht es eines pro AZ.
