---
service: AWS PrivateLink
seedKey: saa-c03-script-privatelink
batch: B4
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/privatelink/what-is-privatelink.html
  - https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html
status: draft
---

# AWS PrivateLink

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> PrivateLink = der **Geheimgang**: Er verbindet nicht ganze Netzwerke, sondern stellt **einen einzelnen Dienst** privat zur Verfügung — als ENI mit privater IP in der VPC des Konsumenten. Die Technik hinter den **Interface Endpoints**.

Der SAA fragt: **Wann exponiert man einen Service statt Netzwerke zu verbinden — und warum ist PrivateLink die einzige Antwort bei überlappenden CIDRs?**

---

## 🎯 SAA-Vertiefung

### Service statt Netzwerk: Die Kernidee

**Das Problem:** Ein SaaS-Anbieter (oder eine interne Plattform-Abteilung) will hundert Kunden-VPCs Zugriff auf **eine einzige API** geben. Mit VPC Peering müsste er hundert Peerings aufsetzen — und jeder Kunde bekäme dabei eine **Route in sein Netzwerk**, also potenziell Sichtbarkeit auf mehr als nur die API. Umgekehrt müsste der Anbieter hundert fremde CIDR-Bereiche in seiner Route Table verwalten und beten, dass sich keine zwei überschneiden.

**Die Lösung:** **PrivateLink dreht das Modell um.** Der Anbieter stellt seinen Service hinter einen **Network Load Balancer** (oder GWLB) und macht daraus einen **Endpoint Service**. Jeder Konsument erstellt in seiner eigenen VPC einen **Interface Endpoint** — eine ENI mit einer IP **aus dem eigenen Adressraum**. Die Konsequenzen sind genau die Punkte, die die Prüfung abfragt:

- **Keine Route-Table-Änderungen, kein Peering, kein IGW/NAT** — die Verbindung entsteht über die ENI, nicht über Routing.
- **Überlappende CIDRs sind egal!** Weil nie zwei Netzwerke zusammengeschaltet werden, dürfen Anbieter und Konsument denselben Adressbereich benutzen. Das ist die **einzige** AWS-Lösung dafür — Peering und Transit Gateway scheitern beide an CIDR-Überlappung.
- **Unidirektional:** Nur der Konsument initiiert Verbindungen zum Anbieter, nie umgekehrt. Der Anbieter „sieht" das Kundennetz nicht.
- **Nur der eine Service ist exponiert** — nicht das ganze Netzwerk. Das ist Least Privilege auf Netzwerkebene.

> **💡 Merksatz:** Peering/TGW verbinden **Netzwerke**, PrivateLink exponiert **einen Service**. **Überlappende CIDRs → nur PrivateLink.** Unidirektional: Consumer ruft, Provider antwortet.

### Die drei Gesichter von PrivateLink

Man begegnet PrivateLink in der Prüfung in drei Kostümen — und sollte erkennen, dass es dieselbe Technik ist:
1. **Interface Endpoints zu AWS-Diensten** (Secrets Manager, ECR, SQS …) — der Alltagsfall.
2. **Endpoint Services für eigene/SaaS-Anwendungen** — hinter **NLB** (bzw. GWLB für Appliances). Der NLB ist Pflicht: PrivateLink arbeitet auf **Layer 4**.
3. **GWLB Endpoints (GWLBe)** — zur Einbindung von Security-Appliances.

Ein Detail, das gern geprüft wird: Weil ein **NLB** die Basis ist, spricht PrivateLink **TCP/UDP** — es ist kein HTTP-Dienst und macht kein Path-Routing. Wer einen ALB dahinter braucht, stellt den ALB **als Target hinter den NLB**.

> **💡 Merksatz:** PrivateLink-Service = **hinter einem NLB** (Layer 4). ALB dahinter? → ALB als **Target des NLB** einhängen.

### Die große Konnektivitäts-Matrix

Das ist die eigentliche SAA-Frage der ganzen Netzwerk-Domäne:

| Das Szenario sagt … | Antwort |
|---|---|
| Zwei/wenige VPCs komplett verbinden, kein transitives Routing nötig | **VPC Peering** |
| Viele VPCs + on-prem, Segmentierung, Hub | **Transit Gateway** |
| **Einen Service** anbieten/konsumieren, **überlappende CIDRs**, unidirektional, SaaS | **PrivateLink** |
| Ganzes Netzwerk zu on-prem, verschlüsselt, schnell aufgesetzt | **Site-to-Site VPN** |
| Ganzes Netzwerk zu on-prem, dediziert, konsistente Bandbreite | **Direct Connect** |

> **💡 Merksatz:** Merke die Frage hinter der Frage: **„Sollen sich Netzwerke sehen — oder nur ein Service?"** Antwortet das Szenario „nur ein Service", ist es **immer PrivateLink**.

---

## ⚠️ Prüfungs-Knackpunkte

- PrivateLink exponiert **einen Service**, verbindet keine Netzwerke: keine Route-Table-Änderung, kein Peering, **kein IGW/NAT nötig**.
- **Überlappende CIDRs → nur PrivateLink** (Peering und TGW sind dann raus).
- **Unidirektional** (Consumer → Provider); Provider erhält keinen Zugang ins Kundennetz.
- **Endpoint Service läuft hinter einem NLB** (Layer 4, TCP/UDP) bzw. GWLB; ALB nur als Target des NLB.
- Consumer-Seite = **Interface Endpoint** (ENI, private IP, **Security Group**, Private DNS).
- Anwendungsfälle: SaaS-Anbieter, interne Plattform-Services über viele Accounts, AWS-Dienste privat erreichen.
- Cross-Region-PrivateLink inzwischen möglich.

## 💡 Der eine Satz zum Mitnehmen

**PrivateLink beantwortet die Frage „Wie gebe ich genau einen Service frei, ohne zwei Netzwerke zu verheiraten?"** — und ist damit die einzige Lösung, die auch dann noch funktioniert, wenn beide Seiten denselben IP-Bereich benutzen.
