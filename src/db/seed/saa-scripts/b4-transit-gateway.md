---
service: AWS Transit Gateway
seedKey: saa-c03-script-transit-gateway
batch: B4
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html
  - https://docs.aws.amazon.com/vpc/latest/tgw/transit-gateway-quotas.html
  - https://docs.aws.amazon.com/vpc/latest/tgw/tgw-peering.html
status: draft
---

# AWS Transit Gateway

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Transit Gateway = der **Netzwerk-Knotenpunkt**: statt jedes VPC einzeln mit jedem zu verkabeln (Peering-Mesh), hängen alle VPCs, VPNs und Direct-Connect-Verbindungen an **einem zentralen Hub**. Hub-and-Spoke statt Kabelsalat.

Der SAA vertieft: **Ab wann kippt Peering zu TGW? Wie isoliert man Umgebungen im Hub? Und welche Grenzen hat der Hub selbst?**

---

## 🎯 SAA-Vertiefung

### Die Rechnung, die alles entscheidet: n(n−1)/2

**Das Problem:** Eine Firma hat 10 VPCs, die alle miteinander reden sollen. Mit VPC Peering braucht man **n(n−1)/2 = 45** Verbindungen — und in jeder VPC 9 Routen. Bei 50 VPCs sind es **1.225** Peerings. Jede neue VPC bedeutet, in *allen* bestehenden Route Tables nachzupflegen. Das ist kein Netzwerk mehr, das ist ein Kabelsalat mit Vollzeitstelle.

**Die Lösung:** Das **Transit Gateway** ist ein **regionaler Router**, an den jede VPC nur **eine** Verbindung (ein *Attachment*) hat — bei 50 VPCs also 50 statt 1.225. Jede VPC braucht nur **eine** Route zum TGW; der Hub kennt den Rest. Und im Gegensatz zu Peering ist TGW **transitiv**: VPC A erreicht VPC C über den Hub, und **on-prem** (via VPN oder Direct Connect am selben Hub) erreicht alle VPCs auf einen Schlag.

Die Umschaltregel, die die Prüfung testet: **Wenige VPCs, kein transitives Routing nötig → Peering** (kostenlos, keine Bandbreitengrenze). **Viele VPCs, on-prem-Anbindung, Segmentierung → Transit Gateway.**

> **💡 Merksatz:** Peering-Mesh wächst mit **n(n−1)/2**, TGW mit **n**. Sobald „viele VPCs" oder „on-prem soll alle erreichen" im Text steht → **Transit Gateway**.

### TGW Route Tables: Der Hub, der bewusst nicht alles verbindet

**Das Problem:** Alle VPCs am selben Hub bedeutet erstmal: **alle können mit allen reden**. Aber Prod darf Dev nicht erreichen, und die beiden Kunden-VPCs im Multi-Tenant-Setup dürfen sich nicht einmal sehen — sie sollen aber beide den zentralen Shared-Services-VPC (AD, Monitoring) nutzen.

**Die Lösung:** Der Hub hat **eigene Route Tables** — und genau darüber baut man **Segmentierung**. Man kann mehrere TGW-Route-Tables anlegen und Attachments unterschiedlich zuordnen:
- Prod-Attachments zeigen auf eine Route Table, die **nur** Shared Services kennt.
- Dev-Attachments auf eine andere.
- Die Shared-Services-Route-Table kennt alle.

Ergebnis: **Prod ↔ Shared Services ja, Prod ↔ Dev nein** — ohne eine einzige Firewall-Regel, allein durch Routing. Das ist das klassische **Isolations-Muster** (VRF-artig) und eine sehr beliebte SAA-Frage: „Wie erlaubt man Spokes den Zugriff auf einen zentralen Service, aber nicht untereinander?" → **separate TGW Route Tables**.

Ein verwandtes Muster für Sicherheit: die **Inspection VPC** — sämtlicher Verkehr zwischen den Spokes wird über eine zentrale VPC mit **Network Firewall** (oder Appliances hinter einem GWLB) geroutet, bevor er weitergeleitet wird.

> **💡 Merksatz:** Segmentierung/Isolation am Hub → **mehrere TGW Route Tables**. Zentrale Inspektion → **Inspection VPC** mit Network Firewall/GWLB am TGW.

### Die Grenzen des Hubs

Vier Fakten, die als Distraktoren auftauchen:
- **Attachments:** bis zu **5.000 pro Transit Gateway** — die Skalierung ist praktisch nie das Problem.
- **Bandbreite: bis zu 50 Gbps (Burst) pro VPC-/DX-/Peering-Attachment** — das ist ein **hartes Limit** (🔴 als „bis zu" lehren; Drittquellen nennen fälschlich 100 Gbps). Für mehr Durchsatz: mehrere Attachments/VPCs.
- **Keine überlappenden CIDRs:** Auch der Hub kann Adresskonflikte nicht auflösen — überlappende VPCs werden nicht propagiert. Bei Überlappung hilft nur **PrivateLink**.
- **TGW Peering (inter-region) ist der Sonderfall:** Es verbindet zwei Transit Gateways über Regionen hinweg, aber **nur mit statischen Routen**, **ohne Route-Propagation**, **ohne ECMP** — und **nicht transitiv**: Traffic kann nicht über zwei gepeerte TGWs hinweg zu einem dritten weiterlaufen. Wer glaubt, TGW-Peering verhalte sich wie der Hub selbst, tappt in die Falle.

Und ein Alleinstellungsmerkmal, das man kennen sollte: **Multicast** unterstützt in AWS **nur** das Transit Gateway (und nur über VPC-Attachments) — Signalwort „Multicast" hat genau eine Antwort.

Kosten: **pro Attachment und Stunde + pro GB verarbeiteten Traffics** — TGW ist bequem, aber nicht gratis. Bei genau zwei VPCs mit viel Traffic kann Peering die günstigere Antwort sein.

> **💡 Merksatz:** TGW: **bis 5.000 Attachments**, 🔴 **bis 50 Gbps pro Attachment**, **keine überlappenden CIDRs**. **TGW-Peering: nur statische Routen, nicht transitiv.** „Multicast" → immer TGW.

---

## ⚠️ Prüfungs-Knackpunkte

- Viele VPCs / on-prem soll alle erreichen / transitives Routing → **Transit Gateway** (Peering-Mesh wächst mit n(n−1)/2).
- Isolation zwischen Spokes bei gemeinsamem Shared-Services-Zugriff → **mehrere TGW Route Tables**.
- Zentrale Traffic-Inspektion → **Inspection VPC** (Network Firewall / GWLB) am TGW.
- Grenzen: **5.000 Attachments**, 🔴 **bis 50 Gbps Burst pro Attachment**, **keine überlappenden CIDRs** (dann PrivateLink).
- **TGW Peering (cross-region): nur statische Routen, keine Propagation, kein ECMP, nicht transitiv.**
- **Multicast** → nur Transit Gateway (über VPC-Attachments).
- Kosten: **pro Attachment/Stunde + pro GB** — bei nur zwei VPCs kann Peering günstiger sein.
- Attachment-Typen: VPC, VPN, **Direct Connect Gateway (Transit VIF)**, TGW-Peering, **Connect** (SD-WAN via GRE/BGP).

## 💡 Der eine Satz zum Mitnehmen

**Das Transit Gateway ersetzt den Kabelsalat durch einen Router mit eigenen Route Tables** — und genau diese Route Tables sind der Grund, warum es nicht nur verbindet, sondern auch trennt.
