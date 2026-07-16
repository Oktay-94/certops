---
service: AWS Direct Connect
seedKey: saa-c03-script-direct-connect
batch: B4
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/aws-direct-connect.html
  - https://docs.aws.amazon.com/directconnect/latest/UserGuide/MACsec.html
  - https://docs.aws.amazon.com/directconnect/latest/UserGuide/WorkingWithVirtualInterfaces.html
status: draft
---

# AWS Direct Connect

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Direct Connect = die **private Standleitung** vom eigenen Rechenzentrum zu AWS: ein physisches Kabel über einen DX-Standort, das das öffentliche Internet komplett umgeht. Ergebnis: **konsistente Bandbreite, stabile Latenz** — im Gegensatz zum VPN, das durchs Internet schwankt.

Der SAA vertieft an vier Stellen: **VIF-Typen, die Verschlüsselungs-Falle, HA-Muster — und die Zeitfrage, die DX regelmäßig zum Distraktor macht.**

---

## 🎯 SAA-Vertiefung

### Die Zeitfalle: Wochen, nicht Stunden

**Das Problem:** „Die Firma braucht **innerhalb weniger Tage** eine sichere Verbindung zwischen RZ und AWS." In den Antwortoptionen steht Direct Connect — klingt hochwertig, ist aber falsch.

**Die Lösung:** Eine DX-Verbindung ist ein **physischer Prozess**: Cross-Connect im Colocation-Standort, ggf. Last-Mile-Anbindung durch einen Carrier — das dauert **Wochen bis Monate**. Das Zeit-Signalwort entscheidet:
- „schnell / sofort / in Tagen" → **Site-to-Site VPN** (in Stunden aufgebaut).
- „dediziert / konsistent / hohe Bandbreite / dauerhafte Hybrid-Architektur" → **Direct Connect**.
- Das Kombi-Muster: **VPN sofort aufsetzen, DX bestellen, später umschwenken** — taucht als „Übergangslösung" wörtlich in Prüfungsfragen auf.

Bandbreiten: **Dedicated Connections** mit **1, 10 und 100 Gbps** (eigener Port), **Hosted Connections** über Partner von **50 Mbps bis 10 Gbps**. Mehr Durchsatz oder Port-Redundanz → **LAG** (Link Aggregation Group, bündelt mehrere gleiche Links zu einem logischen).

> **💡 Merksatz:** DX braucht **Wochen bis Monate** — „schnell" heißt immer VPN. Standardmuster: **VPN als Sofortlösung + DX als Endzustand, VPN als Backup behalten.**

### Die drei Türen: Private, Public und Transit VIF

**Das Problem:** Das Kabel liegt — aber *wohin* führt es? On-prem soll gleichzeitig in die VPC, auf S3 **und** in 40 weitere VPCs über drei Regionen.

**Die Lösung:** Auf der physischen Leitung konfiguriert man **Virtual Interfaces (VIFs)** — logische Türen mit je eigenem Ziel:

| VIF | Führt zu … | Typischer Satz im Szenario |
|---|---|---|
| **Private VIF** | **einer VPC** (via VGW) oder via **DX Gateway** zu mehreren VPCs | „on-prem soll privat in die VPC" |
| **Public VIF** | **öffentlichen AWS-Endpunkten** (S3, DynamoDB …) — ohne Internet | „S3 über die DX-Leitung statt übers Internet" |
| **Transit VIF** | **DX Gateway → Transit Gateway** → viele VPCs | „on-prem soll alle VPCs am TGW erreichen" |

Das **Direct Connect Gateway** ist der globale Verteiler: Eine Private/Transit VIF erreicht darüber VPCs in **mehreren Regionen** — ohne pro Region eine eigene Leitung. **SiteLink** (Randnotiz) verbindet zwei eigene Standorte **über das AWS-Backbone** miteinander (RZ-zu-RZ ohne eigenes WAN).

> **💡 Merksatz:** **Private VIF = eine VPC · Public VIF = S3 & Co. ohne Internet · Transit VIF = DX Gateway → TGW → alle VPCs.** Multi-Region über eine Leitung → **DX Gateway**.

### Die Verschlüsselungs-Falle: Privat heißt nicht verschlüsselt

**Das Problem:** Compliance verlangt: „Alle Daten zwischen RZ und AWS müssen **in transit verschlüsselt** sein." Das Team verweist auf die DX-Leitung — „ist doch privat". Der Auditor lehnt ab. Zu Recht.

**Die Lösung:** **Direct Connect verschlüsselt standardmäßig NICHT.** Es ist eine private Leitung, aber die Bits fließen im Klartext. Zwei Auswege, und die Wahl ist prüfbar:
- **MACsec** (Layer 2): Leitungsverschlüsselung mit voller Geschwindigkeit — aber nur auf **dedizierten** Verbindungen mit **10/100 (und 400) Gbps**, und der DX-Standort muss es unterstützen.
- **IPsec-VPN über die DX-Leitung** (Layer 3): ein Site-to-Site VPN, dessen Tunnel über die **Public VIF** (bzw. Transit VIF) läuft statt übers Internet — funktioniert immer, unterliegt aber den VPN-Durchsatzgrenzen.

Der Distraktor in beide Richtungen: „DX ist privat, also reicht das" (falsch bei Verschlüsselungspflicht) — und „zusätzlich ein VPN übers Internet" (verschenkt die DX-Qualität; der Tunnel gehört **über** die DX-Leitung).

> **💡 Merksatz:** **DX ist privat, aber unverschlüsselt.** Verschlüsselungspflicht → **MACsec** (dedicated, 10/100G) oder **IPsec-VPN über die DX-Leitung**.

### Hochverfügbarkeit: Was passiert, wenn der Bagger kommt?

**Das Problem:** Eine einzige DX-Leitung ist ein Single Point of Failure — ein Baggerbiss, ein Standortausfall, und die Hybrid-Architektur ist offline.

**Die Lösung — die Resiliency-Stufen, dem Budget nach:**
1. **DX + Site-to-Site VPN als Backup** — das preiswerte Standardmuster: Fällt DX aus, übernimmt das VPN (mit weniger Bandbreite — das Szenario muss „reduzierte Kapazität akzeptabel" hergeben). BGP regelt das Failover automatisch.
2. **Zwei DX-Verbindungen an zwei verschiedenen Standorten** — High Resiliency: übersteht Geräte- *und* Standortausfall.
3. **Maximum Resiliency:** je zwei Verbindungen an zwei Standorten (4 Leitungen) — für „keinerlei Ausfalltoleranz".

Merkbild: **VPN-Backup = Ersatzreifen** (langsamer, aber man kommt heim), **zweite DX = zweites Auto**.

> **💡 Merksatz:** Budget-HA = **DX + VPN-Failover** (reduzierte Bandbreite einkalkulieren). Kritisch = **2 DX an 2 Standorten**. Ein einzelnes DX ist immer ein SPOF.

---

## ⚠️ Prüfungs-Knackpunkte

- Bereitstellung **Wochen–Monate** → „schnell" = **VPN**; Übergangsmuster: VPN sofort, DX später, VPN bleibt Backup.
- **Dedicated 1/10/100 Gbps** vs. **Hosted 50 Mbps–10 Gbps** (Partner); mehr Durchsatz/Redundanz → **LAG**.
- **Private VIF** (eine VPC / DX GW) · **Public VIF** (S3 & öffentliche Endpunkte ohne Internet) · **Transit VIF** (→ DX Gateway → **TGW**).
- **DX Gateway** = eine Leitung, viele VPCs/Regionen; **SiteLink** = Standort-zu-Standort übers AWS-Backbone.
- **Nicht verschlüsselt by default** → **MACsec** (nur dedicated 10/100/400G) oder **IPsec-VPN über die DX-Leitung**.
- HA: **DX + VPN-Backup** (günstig) · **2 DX / 2 Standorte** (High) · 4 Leitungen (Maximum).
- On-prem soll **Interface Endpoints** privat erreichen → geht über DX (Private/Transit VIF); **Gateway Endpoints gehen nicht** von on-prem.

## 💡 Der eine Satz zum Mitnehmen

**Direct Connect kauft Konsistenz — nicht Geschwindigkeit der Bereitstellung und nicht Verschlüsselung**: Die drei Prüfungsfallen heißen „dauert Wochen", „ist unverschlüsselt" und „braucht ein Backup", und jede hat ihre feste Antwort — VPN zuerst, MACsec/IPsec darüber, VPN oder zweite Leitung daneben.
