---
service: AWS Network Firewall
seedKey: saa-c03-script-network-firewall
batch: B4
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/network-firewall/latest/developerguide/what-is-aws-network-firewall.html
  - https://docs.aws.amazon.com/network-firewall/latest/developerguide/firewall-deployment-models.html
status: draft
---

# AWS Network Firewall

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Network Firewall = die **managed Profi-Firewall für die ganze VPC**: stateful Deep Packet Inspection, IDS/IPS-Funktionen, Domain-Filtering — dort, wo Security Groups und NACLs mit ihren simplen Port/IP-Regeln aufhören. AWS betreibt, skaliert und patcht sie.

Der SAA testet zwei Dinge: **das zentrale Deployment-Muster (Inspection VPC) — und vor allem die Firewall-Landkarte: welches der sieben Sicherheitswerkzeuge auf welcher Ebene arbeitet.**

---

## 🎯 SAA-Vertiefung

### Was sie kann, was SG und NACL nicht können

**Das Problem:** Die Compliance verlangt: „Ausgehender Traffic darf nur zu **freigegebenen Domains** gehen (`*.firma.de`, `github.com`), alles andere wird geblockt und protokolliert." Mit Security Groups unmöglich — die kennen nur IPs und Ports, und hinter `github.com` stecken hunderte wechselnde IPs.

**Die Lösung:** Network Firewall arbeitet mit **stateful Rules auf Suricata-Basis**: **FQDN-/Domain-Filtering** (via SNI/Host-Header), Protokoll-Erkennung, IDS/IPS-Signaturen gegen bekannte Angriffsmuster, dazu klassische stateless 5-Tupel-Regeln für den Vorfilter. Actions: pass, drop, reject, **alert** (nur protokollieren — der Audit-Modus vor dem Scharfschalten). Genau das ist die Antwort auf „Egress-Kontrolle auf Domain-Ebene": **Network Firewall mit Domain-Allowlist**, nicht Security Groups, nicht NACLs.

> **💡 Merksatz:** **Domains/FQDN filtern, IDS/IPS, Deep Packet Inspection auf VPC-Ebene → Network Firewall.** SG/NACL können nur IP+Port.

### Das Deployment-Muster: Die Inspection VPC

**Das Problem:** 30 VPCs am Transit Gateway — und jede bräuchte ihre eigene Firewall? Teuer, und 30 Regelwerke driften auseinander.

**Die Lösung:** Das Standard-Muster ist die **zentrale Inspection VPC**: Eine dedizierte VPC am TGW enthält die **Firewall Endpoints** (in eigenen Subnetzen), und die **TGW Route Tables** zwingen den Verkehr zwischen den Spokes (und Richtung Internet) **durch diese VPC hindurch** — ein Regelwerk, ein Kontrollpunkt, zentral vom Security-Team verwaltet. Die Alternative (dezentral: eine Firewall pro VPC, Route Table leitet IGW-Traffic durchs Firewall-Subnetz) bleibt für Einzel-VPCs richtig.

Die Prüfungslogik: „**Zentral** für viele VPCs inspizieren" → **TGW + Inspection VPC**. „Eine einzelne VPC schützen" → Firewall-Endpoint + Routing in derselben VPC.

> **💡 Merksatz:** Viele VPCs, ein Regelwerk → **Inspection VPC am Transit Gateway** (Route Tables leiten den Verkehr durch die Firewall).

### Die Firewall-Landkarte — die eigentliche Prüfungsfrage

**Das Problem:** Sieben Werkzeuge, die alle „Firewall" oder „Schutz" heißen. Die Prüfung nennt ein Symptom und will das richtige Werkzeug.

**Die Lösung — die Landkarte, Ebene für Ebene:**

| Werkzeug | Ebene | Kann | Signalwort |
|---|---|---|---|
| **Security Group** | Instanz/ENI | stateful, nur ALLOW, SG-Referenzen | „Instanz X darf Port Y" |
| **NACL** | Subnetz | stateless, ALLOW+**DENY** | „bestimmte IP aussperren" |
| **Network Firewall** | VPC (L3/L4 + FQDN) | DPI, IDS/IPS, Domain-Filter | „Domains erlauben/blocken, Traffic inspizieren" |
| **AWS WAF** | **Layer 7 HTTP** (an ALB/CloudFront/API GW) | SQL-Injection, XSS, Rate Limits, Geo | „Web-Angriffe abwehren" |
| **Shield (Advanced)** | DDoS | volumetrische Angriffe, Response Team | „DDoS" |
| **GWLB** | L3-Einbindung | **Third-Party**-Appliances (Palo Alto & Co.) | „bestehende Firewall-Appliance weiter nutzen" |
| **Route 53 Resolver DNS Firewall** | **DNS** | ausgehende DNS-Queries filtern | „DNS-Exfiltration/-Tunneling" |

Die drei häufigsten Verwechslungen:
- **Network Firewall vs. WAF:** WAF versteht **HTTP-Inhalte** (SQL-Injection im Request-Body) — Network Firewall sieht Pakete und Domains, aber keine Web-Angriffslogik. „SQLi/XSS" → immer WAF.
- **Network Firewall vs. GWLB:** Managed AWS-Firewall → Network Firewall. „Vorhandene **Drittanbieter**-Appliance einbinden" → GWLB.
- **Network Firewall vs. DNS Firewall:** Beide filtern Domains — aber auf verschiedenen Pfaden. Die **DNS Firewall** blockt schon die **Namensauflösung** (greift nur, wenn der Route-53-Resolver genutzt wird); die Network Firewall blockt die **Verbindung** selbst. Defense in depth: beide zusammen.

> **💡 Merksatz:** **SQLi/XSS → WAF · DDoS → Shield · fremde Appliance → GWLB · DNS-Ebene → DNS Firewall · IP sperren → NACL · alles dazwischen auf VPC-Ebene → Network Firewall.**

---

## ⚠️ Prüfungs-Knackpunkte

- **Stateful (Suricata-kompatibel) + stateless**; Actions pass/drop/reject/**alert** (Audit-Modus).
- **FQDN-/Domain-Filtering** für Egress-Kontrolle — die Fähigkeit, die SG/NACL nicht haben.
- Zentral für viele VPCs → **Inspection VPC am TGW** (Route Tables erzwingen den Weg durch die Firewall-Endpoints); einzelne VPC → dezentrales Modell.
- **WAF** = Layer 7/HTTP (SQLi, XSS — an ALB/CloudFront/API GW, **nicht am NLB**); **Shield** = DDoS; **GWLB** = Third-Party-Appliances; **DNS Firewall** = DNS-Egress (nur via Route-53-Resolver).
- „Bestimmte IP blockieren" bleibt die **NACL**-Antwort — Network Firewall wäre Overkill.

## 💡 Der eine Satz zum Mitnehmen

**Network Firewall ist die managed VPC-Firewall für alles, was tiefer geht als IP und Port** — und die eigentliche Prüfungskunst ist die Landkarte: WAF spricht HTTP, Shield schluckt DDoS, GWLB trägt fremde Appliances, die DNS Firewall stoppt die Namensauflösung, und dazwischen inspiziert die Network Firewall.
