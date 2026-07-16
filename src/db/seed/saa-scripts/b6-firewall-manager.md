---
service: AWS Firewall Manager
seedKey: saa-c03-script-firewall-manager
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/waf/latest/developerguide/fms-chapter.html
  - https://aws.amazon.com/firewall-manager/faqs/
status: draft
---

# AWS Firewall Manager

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Firewall Manager = der **zentrale Regel-Verteiler**: Eine Security Policy einmal definieren → automatisch über **alle Konten und Ressourcen** der Organisation ausrollen, **auch auf neue**. Er ist **kein neuer Firewall-Typ**, sondern der **Chef**, der WAF, Shield Advanced, Security Groups und Network Firewall zentral orchestriert. **Setzt Organizations voraus.**

Der SAA vertieft: **die Voraussetzungen, welche Policy-Typen er steuert — und die scharfe Abgrenzung „einzeln vs. zentral".**

---

## 🎯 SAA-Vertiefung

### Zentral statt in jedem Konto einzeln

**Das Problem:** Ein Konzern mit 200 Konten will erzwingen: „Auf **jeder** Web-App in **allen** Konten läuft eine WAF mit SQL-Injection-Schutz — auch auf Apps, die morgen erst erstellt werden." In jedem Konto von Hand eingerichtet, wird garantiert eines vergessen, und neue Apps gehen ungeschützt live.

**Die Lösung:** **Firewall Manager** definiert die Regel **einmal** als **Security Policy** und rollt sie **org-weit** aus — inklusive automatischer Anwendung auf **neu erstellte Konten und Ressourcen** („compliant from day one"). Genau das ist das Signalwort-Muster: „zentral verwalten" + „über mehrere Konten / die ganze Organisation" + „automatisch auf neue Ressourcen" → **Firewall Manager**.

Die **Voraussetzungen** sind prüfbar: **AWS Organizations (all features)** + **AWS Config** in allen Member-Konten (für die Compliance-Erkennung), ein designiertes **Firewall-Manager-Admin-Konto**, und für Network-Firewall-/DNS-Firewall-Policies zusätzlich **AWS RAM**. Ohne Organizations kein Firewall Manager — diese Kopplung wird gern gefragt.

> **💡 Merksatz:** **Zentral + mehrere Konten + automatisch auf neue Ressourcen → Firewall Manager.** Voraussetzung: **Organizations + Config** (Network/DNS Firewall zusätzlich RAM).

### Was er orchestriert — und die Abgrenzung „einzeln vs. zentral"

**Das Problem:** WAF, Shield Advanced, Network Firewall — und jetzt auch noch Firewall Manager. Wann der einzelne Dienst, wann der Manager?

**Die Lösung:** Firewall Manager steuert **mehrere Policy-Typen** zentral: **AWS WAF** (Web ACLs), **Shield Advanced**, **VPC Security Groups** (auditieren/vereinheitlichen), **Network ACLs**, **Network Firewall**, **Route 53 Resolver DNS Firewall** und Third-Party-Firewalls (Palo Alto, Fortinet). Die Abgrenzung ist eine reine Skopus-Frage:
- **Eine einzelne Web-App** schützen → direkt **WAF** (eine Web ACL).
- **Eine VPC** schützen → **Network Firewall**.
- **Dieselbe Regel über viele Konten** durchsetzen und Compliance sicherstellen → **Firewall Manager**.

Der Merksatz aus dem CLF-Recap trägt weiter: **WAF und Network Firewall sind die einzelnen Wächter, Firewall Manager ist der Chef, der allen Wächtern in allen Konten dieselben Regeln erteilt.** Non-compliant-Findings meldet Firewall Manager an Security Hub.

> **💡 Merksatz:** **Einzelne App → WAF · eine VPC → Network Firewall · org-weit dieselbe Regel → Firewall Manager.** Er verwaltet WAF, Shield Advanced, SGs, Network/DNS Firewall zentral.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „zentral verwalten", „über mehrere Konten/Organisation", „automatisch auf neue Ressourcen" → **Firewall Manager**.
- **Voraussetzung: Organizations (all features) + Config** (Network/DNS Firewall zusätzlich **RAM**); Admin-Konto.
- Steuert: **WAF, Shield Advanced, Security Groups, NACLs, Network Firewall, Route 53 DNS Firewall**, Third-Party (Palo Alto/Fortinet).
- Abgrenzung: **einzelne App → WAF** · **eine VPC → Network Firewall** · **org-weit → Firewall Manager**.
- Kein neuer Firewall-Typ, sondern zentraler **Verwalter**; Findings an Security Hub.

## 💡 Der eine Satz zum Mitnehmen

**Firewall Manager ist nicht die Firewall, sondern der Dirigent: dieselbe WAF-, Shield- oder Network-Firewall-Regel org-weit und automatisch auf jede neue Ressource — die richtige Antwort immer dann, wenn „zentral über viele Konten" im Szenario steht (und Organizations vorausgesetzt ist).**
