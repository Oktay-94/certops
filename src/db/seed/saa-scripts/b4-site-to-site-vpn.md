---
service: AWS Site-to-Site VPN
seedKey: saa-c03-script-site-to-site-vpn
batch: B4
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/vpn/latest/s2svpn/VPNTunnels.html
  - https://docs.aws.amazon.com/vpn/latest/s2svpn/vpn-limits.html
  - https://aws.amazon.com/vpn/faqs/
status: draft
---

# AWS Site-to-Site VPN

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Site-to-Site VPN = der **verschlüsselte Tunnel durchs öffentliche Internet** zwischen Firmen-RZ und AWS: schnell aufgebaut (Stunden statt Wochen), IPsec-verschlüsselt, günstig — aber die Qualität schwankt mit dem Internet. Bausteine: **Customer Gateway (CGW)** auf Firmenseite, **Virtual Private Gateway (VGW)** oder **Transit Gateway** auf AWS-Seite.

Der SAA vertieft: **Warum zwei Tunnel? Wie kommt man über die 1,25-Gbps-Grenze? Und wann ist VPN die richtige Antwort — und wann nur der Notnagel?**

---

## 🎯 SAA-Vertiefung

### Zwei Tunnel, ein Auftrag: Verfügbarkeit

**Das Problem:** Ein Kunde richtet sein VPN ein, konfiguriert einen Tunnel — und wundert sich über die AWS-Warnung, der zweite Tunnel sei „down".

**Die Lösung:** Jede Site-to-Site-VPN-Connection besteht **immer aus zwei Tunneln** — jeder endet an einem anderen AWS-Endpunkt (unterschiedliche Verfügbarkeitsdomänen). Das ist eingebaute HA auf AWS-Seite: Fällt ein Endpunkt aus (auch bei AWS-Wartung!), übernimmt der zweite. **Beide Tunnel gehören konfiguriert** — ein einzelner ist ein selbstgebauter SPOF. Für automatisches Failover braucht es **dynamisches Routing (BGP)**; statisches Routing schaltet nicht selbstständig um.

Auf der Firmenseite bleibt das CGW trotzdem der SPOF — wer auch den absichern will, stellt ein **zweites Customer Gateway** mit einer zweiten VPN-Connection auf.

> **💡 Merksatz:** **Eine VPN-Connection = zwei Tunnel** (AWS-seitige HA) — beide konfigurieren, **BGP** für automatisches Failover. Firmenseitige HA = zweites CGW.

### Die Durchsatzgrenze — und die zwei Wege darüber hinaus

**Das Problem:** Die nächtliche Replikation schaufelt 4 TB durchs VPN und wird nicht fertig. Der Admin misst: nie mehr als ~1,2 Gbps, egal wie dick die Internetleitung ist.

**Die Lösung:** Ein VPN-Tunnel schafft 🔴 **„up to" 1,25 Gbps (und ~140.000 Pakete/s)** — ein geschätztes Maximum, abhängig von Verschlüsselung und Paketgröße, nie eine Garantie. Zwei Auswege, beide prüfungsrelevant:

1. **ECMP am Transit Gateway:** Mehrere VPN-Connections (= mehrere Tunnelpaare) am TGW, und **Equal-Cost Multi-Path** verteilt die Last darüber — aggregiert deutlich mehr Durchsatz (🔴 ~2,5 Gbps schon mit einer Connection über beide Tunnel). Zwei Haken mit Punktwert: **ECMP gibt es nur am TGW (nicht am VGW)** und **nur mit BGP** — und ein *einzelner Flow* bleibt trotzdem bei ~1,25 Gbps (ECMP verteilt Flows, beschleunigt keinen einzelnen).
2. 🛑 **Large Bandwidth Tunnels:** bis **5 Gbps pro Tunnel** — aber **nur an Transit Gateway / Cloud WAN**, nicht am klassischen VGW.

Und wenn nicht die Bandbreite, sondern die **Internet-Latenz/Jitter** das Problem ist (Standort weit weg von der AWS-Region): **Accelerated Site-to-Site VPN** — der Tunnel läuft ab dem nächsten Edge-Standort über das **AWS-Backbone** (technisch via Global Accelerator).

> **💡 Merksatz:** 🔴 **~1,25 Gbps pro Tunnel („up to")**. Mehr Durchsatz → **ECMP am TGW (nur BGP!)** oder 🛑 **5-Gbps-Tunnel (nur TGW)**. Schwankende Internetqualität → **Accelerated VPN**.

### Einordnung: Wann VPN die Antwort ist

Die drei Rollen, in denen VPN in Prüfungsfragen gewinnt:
- **Der Schnelle:** Verbindung in Stunden statt Wochen — Migrationsstart, Proof of Concept, Übergangslösung bis DX steht.
- **Der Backup:** Failover-Pfad für Direct Connect (BGP schwenkt automatisch um).
- **Der Sparsame:** Wenig Traffic, Verschlüsselung inklusive, kein Budget für DX.

Und eine Randnotiz für Multi-Standort-Szenarien: **VPN CloudHub** — mehrere Firmenstandorte verbinden sich über ein VGW und können **untereinander** über AWS kommunizieren (Hub-and-Spoke für Filialen ohne eigenes WAN).

Abgrenzung nach unten: Geht es nur um **einzelne Nutzer** im Homeoffice, ist es **Client VPN** (nächstes Skript) — Site-to-Site verbindet **Standorte/Netzwerke**.

> **💡 Merksatz:** VPN = **schnell, verschlüsselt, günstig, schwankend** — als Erstlösung, DX-Backup oder Sparlösung. Standorte untereinander via AWS → **CloudHub**. Einzelne Nutzer → **Client VPN**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Zwei Tunnel pro Connection** (AWS-seitige HA, verschiedene Endpunkte) — beide konfigurieren; automatisches Failover nur mit **BGP**.
- CGW = Firmenseite (SPOF → zweites CGW), AWS-Seite = **VGW oder TGW**.
- 🔴 **„up to" 1,25 Gbps / 140.000 PPS pro Tunnel** — nie als Garantie.
- Mehr Durchsatz: **ECMP nur am TGW + nur BGP** (Flows verteilen, Einzelflow bleibt limitiert); 🛑 **Large Bandwidth Tunnels 5 Gbps nur TGW/Cloud WAN**.
- Instabile Internetstrecke → **Accelerated Site-to-Site VPN** (AWS-Backbone ab Edge).
- Rollen: Sofortlösung (Stunden), **DX-Backup**, Low-Cost-Hybrid; IPsec-Verschlüsselung eingebaut (im Gegensatz zu DX!).
- **VPN CloudHub** = mehrere Standorte über ein VGW, auch untereinander.
- Standort ↔ AWS = **Site-to-Site**; einzelner Nutzer ↔ AWS = **Client VPN**.

## 💡 Der eine Satz zum Mitnehmen

**Site-to-Site VPN ist der schnelle, verschlüsselte, aber gedeckelte Weg zu AWS** — zwei Tunnel sind Pflicht, BGP macht das Failover, und wer mehr als ~1,25 Gbps braucht, landet zwangsläufig beim Transit Gateway (ECMP oder 5-Gbps-Tunnel) oder gleich bei Direct Connect.
