---
service: Netzwerk-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-network-decision-matrix
batch: B4
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/welcome.html
status: draft
---

# Netzwerk-Entscheidungsmatrix

## 📋 Einordnung

> Wie bei Compute gilt: Die meisten Netzwerk-Fragen testen nicht *einen* Dienst, sondern die **Wahl zwischen Nachbarn**. Dieses Skript bündelt die fünf Entscheidungstabellen der Domäne — als Schnellzugriff vor der Prüfung.

---

## 🎯 Matrix 1: Konnektivität — wer verbindet was?

| Das Szenario sagt … | Antwort |
|---|---|
| **Zwei/wenige VPCs** komplett verbinden, keine CIDR-Überlappung | **VPC Peering** (nicht transitiv!) |
| **Viele VPCs** + on-prem, Segmentierung, Hub-and-Spoke | **Transit Gateway** |
| **Einen Service** freigeben, **überlappende CIDRs**, SaaS, unidirektional | **PrivateLink** |
| On-prem ↔ AWS **schnell** (Stunden), verschlüsselt, günstig | **Site-to-Site VPN** |
| On-prem ↔ AWS **dediziert**, konsistente Bandbreite (Wochen Vorlauf) | **Direct Connect** |
| Einzelne **Nutzer** (Homeoffice) in die VPC | **Client VPN** |
| Nur **AWS-Dienste** privat erreichen | **VPC Endpoints** |

Die drei Killer-Detailregeln: **Peering ist nicht transitiv und kein Edge-to-Edge** · **überlappende CIDRs kann nur PrivateLink** · **DX ist unverschlüsselt** (→ MACsec/IPsec darüber).

## 🎯 Matrix 2: Load Balancer

| Signalwort | Antwort |
|---|---|
| HTTP-Routing (Pfad/Host/Header), **WAF**, Cognito-Login, Lambda-Target | **ALB** |
| **UDP/TCP**, **statische IP/EIP**, Source-IP erhalten, PrivateLink, extreme Performance | **NLB** |
| **Third-Party-Security-Appliance** transparent (GENEVE 6081) | **GWLB** |
| Legacy | CLB (immer Distraktor) |

Fallen: **NLB + WAF geht nicht** · Cross-Zone: **ALB an (gratis), NLB/GWLB aus (kostet)** · 🛑 NLB **hat** seit 08/2023 Security Groups.

## 🎯 Matrix 3: Edge & Delivery — die drei Verwechselten

| Das Szenario sagt … | Antwort |
|---|---|
| HTTP-Inhalte **cachen**/ausliefern (statisch + dynamisch) | **CloudFront** |
| **Non-HTTP** (UDP/MQTT/VoIP), **statische IPs**, DNS-freies Regions-Failover | **Global Accelerator** |
| Nutzer per **DNS** zur latenzbesten Region | **Route 53 Latency-based** |

Merkbild: **CloudFront = Filialnetz · GA = Privatautobahn · Route 53 = Wegweiser.**

## 🎯 Matrix 4: Die Firewall-Landkarte

| Ebene | Werkzeug | Signalwort |
|---|---|---|
| Instanz/ENI | **Security Group** (stateful, nur ALLOW) | „Instanz X darf Port Y" |
| Subnetz | **NACL** (stateless, DENY möglich) | „IP-Adresse aussperren" |
| VPC L3/L4 + FQDN | **Network Firewall** | „Domains filtern, Traffic inspizieren" |
| Layer 7 HTTP | **WAF** (ALB/CloudFront/API GW) | „SQL-Injection, XSS" |
| DDoS | **Shield** | „DDoS-Angriff" |
| Appliance-Einbindung | **GWLB** | „vorhandene Palo-Alto-Firewall" |
| DNS-Egress | **Route 53 Resolver DNS Firewall** | „DNS-Exfiltration" |

## 🎯 Matrix 5: Privater Zugriff auf S3 — die Dreifaltigkeit

| Herkunft & Ziel | Antwort |
|---|---|
| **Aus der VPC** zu S3/DynamoDB, kostenlos | **Gateway Endpoint** |
| **Von on-prem** (DX/VPN) privat zu S3 | **Interface Endpoint** |
| Allgemeiner Internet-Egress privater Instanzen | **NAT Gateway** (teuer — nie für S3 wählen, wenn ein Endpoint reicht) |

## ⚠️ Die zehn häufigsten Netzwerk-Fehlgriffe

1. **Peering transitiv gedacht** (A↔B↔C ≠ A↔C) → TGW.
2. **Überlappende CIDRs mit Peering/TGW** → nur PrivateLink kann das.
3. **NAT Gateway für S3-Traffic** → Gateway Endpoint ist gratis.
4. **Ein NAT für alle AZs** → SPOF; eines pro AZ.
5. **NACL ohne Ephemeral-Port-Regel (1024–65535)** → Antworten versickern.
6. **„DX ist doch privat"** → unverschlüsselt; MACsec oder IPsec darüber.
7. **DX für „schnell benötigt"** → Wochen Vorlauf; VPN zuerst.
8. **NLB + WAF** → nicht unterstützt; WAF an ALB/CloudFront/API GW.
9. **CNAME am Zone Apex** → RFC-verboten; ALIAS.
10. **OAI für KMS-verschlüsselte Buckets** → kann kein SSE-KMS; OAC.

## 💡 Der eine Satz zum Mitnehmen

**Netzwerk-Fragen beantworten sich über fünf Tabellen: Wer verbindet was (Netz vs. Service)? Welcher Balancer (HTTP vs. L4 vs. Appliance)? Welcher Edge-Dienst (Cache vs. Weg vs. DNS)? Welche Firewall-Ebene? Und welcher Weg zu S3?** — das Signalwort im Szenario zeigt fast immer auf genau eine Zeile.
