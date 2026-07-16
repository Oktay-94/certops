---
service: VPC Endpoints (Gateway & Interface)
seedKey: saa-c03-script-vpc-endpoints
batch: B4
domains: [D1, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html
  - https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-aws-services.html
status: draft
---

# VPC Endpoints

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> VPC Endpoints = der **Privatgang zu AWS-Diensten**, der den Umweg übers öffentliche Internet spart. Zwei Typen: **Gateway Endpoint** (nur **S3 und DynamoDB**, **kostenlos**, wird als **Route** eingetragen) und **Interface Endpoint** (fast alle anderen Dienste, technisch eine **ENI mit privater IP**, basiert auf **PrivateLink**, kostet pro Stunde). Nutzen: Sicherheit (Daten bleiben im AWS-Netz), weniger Kosten (kein NAT), weniger Latenz.

Der SAA testet exakt eine Sache: **Welcher Endpoint-Typ, und warum genau der?**

---

## 🎯 SAA-Vertiefung

### Die zwei Typen — technisch völlig verschieden

**Das Problem:** Beide heißen „VPC Endpoint" und beide bringen privaten Zugriff. In der Prüfung entscheidet aber, dass sie **technisch grundverschieden** funktionieren — und daraus folgen ihre Grenzen.

**Die Lösung — die Gegenüberstellung, die alles erklärt:**

| | **Gateway Endpoint** | **Interface Endpoint (PrivateLink)** |
|---|---|---|
| Dienste | **nur S3 und DynamoDB** | fast alle AWS-Dienste, Marketplace, eigene Services |
| Technik | Eintrag in die **Route Table** (Prefix List → `vpce`) | **ENI mit privater IP** im Subnetz |
| Kosten | **kostenlos** | **pro Stunde + pro GB** |
| Security Group? | **nein** (nur Endpoint Policy) | **ja** (es ist eine ENI!) |
| Von **on-prem** (DX/VPN) erreichbar? | **NEIN** | **JA** |
| Nutzt PrivateLink? | nein | ja |

Daraus fallen die beiden Standardantworten wie von selbst:
- **„EC2 im privaten Subnetz soll S3 erreichen, ohne NAT-Kosten"** → **Gateway Endpoint** (kostenlos — der Reflex).
- **„On-Prem-Rechenzentrum soll S3 privat über Direct Connect erreichen"** → **Interface Endpoint**. Der Gateway Endpoint scheidet hier aus, weil er nur *innerhalb* der VPC funktioniert — er ist eine Route, und on-prem hat diese Route nicht.

Genau in dieser Asymmetrie liegt die beliebteste Endpoint-Frage der Prüfung: **Beide Antworten „funktionieren" auf S3 — aber nur eine passt zur Herkunft des Traffics.**

> **💡 Merksatz:** **Aus der VPC zu S3/DynamoDB → Gateway Endpoint (gratis). Von on-prem zu S3 → Interface Endpoint (kostet).** Nur der Interface Endpoint hat eine ENI, eine private IP und eine Security Group.

### Endpoint Policies: Die Tür, die nur einen Bucket kennt

**Das Problem:** Compliance verlangt, dass Mitarbeiter über den Firmen-Endpoint **ausschließlich** in die firmeneigenen S3-Buckets schreiben können — Datenexfiltration in einen fremden Bucket („`s3://ich-klaue-daten`") muss technisch unmöglich sein. Eine IAM-Policy allein reicht nicht, weil sie sich mit einer kompromittierten Rolle umgehen ließe.

**Die Lösung:** Jeder Endpoint kann eine **Endpoint Policy** tragen — eine Ressourcen-Policy **am Gang selbst**. Sie beschränkt, welche Dienste, Aktionen und **Ressourcen** durch diesen Endpoint überhaupt erreichbar sind (z. B. nur Buckets der eigenen Organisation, per `aws:PrincipalOrgID` bzw. `s3:ResourceAccount`). Das ist die typische **Datenexfiltrations-Antwort** in D1-Szenarien: nicht „strengere IAM-Policy", sondern **Endpoint Policy** am privaten Zugang.

Dazu die **Private DNS**-Option beim Interface Endpoint: Sie sorgt dafür, dass der normale Dienst-Hostname (`secretsmanager.eu-central-1.amazonaws.com`) **innerhalb der VPC** auf die private Endpoint-IP auflöst — die Anwendung muss also **keine Zeile Code ändern**. Ist Private DNS aus, muss man den kryptischen Endpoint-DNS-Namen selbst verwenden (ein klassischer Fehlerfall: „Anwendung geht trotz Endpoint über das Internet" → Private DNS nicht aktiviert).

> **💡 Merksatz:** Zugriff auf fremde Buckets/Konten technisch unterbinden → **Endpoint Policy**. App findet den Endpoint nicht → **Private DNS** aktivieren.

### Der dritte Typ und die Nachbarschaft

Es gibt noch einen dritten Endpoint-Typ, der im GWLB-Kontext auftaucht: den **Gateway Load Balancer Endpoint (GWLBe)** — ebenfalls PrivateLink-basiert, aber als **Next Hop in einer Route Table** nutzbar, um Traffic durch Security-Appliances zu leiten (siehe ELB-Skript).

Und die Einordnung gegenüber den Nachbarn:
- **VPC Endpoint** = privater Zugang zu **AWS-Diensten** (oder zu einem PrivateLink-Service).
- **NAT Gateway** = Zugang zum **öffentlichen Internet** (teuer, aber universell).
- **VPC Peering / Transit Gateway** = Verbindung ganzer **Netzwerke**.

Der klassische Architektur-Satz dazu: In einer streng abgeschotteten VPC **ganz ohne Internetzugang** (kein IGW, kein NAT) laufen S3-Backups, Secrets-Manager-Abrufe und ECR-Pulls trotzdem — komplett über Endpoints.

> **💡 Merksatz:** Endpoints verbinden mit **Diensten**, Peering/TGW mit **Netzwerken**, NAT mit dem **Internet**. Eine VPC ohne jeden Internetzugang bleibt mit Endpoints voll arbeitsfähig.

---

## ⚠️ Prüfungs-Knackpunkte

- **Gateway Endpoint: nur S3 + DynamoDB, kostenlos, Route-Table-Eintrag, KEINE Security Group, NICHT von on-prem erreichbar.**
- **Interface Endpoint (PrivateLink): fast alle Dienste, ENI + private IP, Security Group möglich, VON ON-PREM (DX/VPN) erreichbar, kostet Stunde + GB.**
- Standardreflexe: „S3 aus VPC ohne NAT-Kosten" → **Gateway Endpoint**; „S3 von on-prem privat" → **Interface Endpoint**.
- Exfiltration in fremde Buckets verhindern → **Endpoint Policy** (nicht nur IAM).
- App nutzt den Endpoint nicht → **Private DNS** prüfen.
- **GWLBe** = dritter Typ (Next Hop für Traffic-Inspection).
- ECR-Pull aus privatem Subnetz braucht **ecr.api + ecr.dkr Interface Endpoints + S3 Gateway Endpoint** (die Layer liegen in S3).

## 💡 Der eine Satz zum Mitnehmen

**Bei Endpoint-Fragen entscheidet nicht der Dienst, sondern die Herkunft des Traffics: aus der VPC heraus zu S3 gewinnt der kostenlose Gateway Endpoint — kommt der Traffic von on-prem, kann es nur der Interface Endpoint sein.**
