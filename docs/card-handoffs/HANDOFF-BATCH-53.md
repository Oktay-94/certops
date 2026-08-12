# HANDOFF-BATCH-53 — IPv6 · Egress-only IGW · NAT64

Stand: 11.08.2026. Phase A abgeschlossen und freigegeben. Phase B offen.
Kein Repo-Schreiben erfolgt, kein SCENARIO_COUNT geändert, keine Commits.

---

## 1. Entscheidungen dieser Sitzung

### 1.1 Von Oktay entschieden

| # | Entscheidung |
|---|---|
| E1 | Die gezeichnete Athena-Karte (aktuell `battle_card_53`) bekommt **Nummer 101** als Extra-Karte über den Masterplan hinaus. Sie entfällt nicht. |
| E2 | Die Abgrenzungen „↔ 53" in `battle_card_52.md` und `battle_card_54.md` werden **in diesem Batch** mitkorrigiert. |
| E3 | Karte 53 bekommt **Variante B**: IPv6-only Subnetz mit EIGW plus NAT64/DNS64. |
| E4 | Branche: Hochschulrechenzentrum / Forschungsverbund. |
| E5 | Befund 169 wird über **Weg 1** aufgelöst: EKS fällt raus, stattdessen Nitro-EC2-Flotte im IPv6-only Subnetz. |

### 1.2 Ohne Rückfrage entschieden — widerrufbar

Ab dieser Sitzung gilt: Detailentscheidungen werden getroffen und hier
dokumentiert, statt einzeln vorgelegt. Rückfrage nur noch, wenn eine
Entscheidung nicht wiederherstellbare Arbeit vernichtet.

| # | Entscheidung | Begründung |
|---|---|---|
| A1 | Firmenname **Forschungsverbund Marbeck** | trifft keins der gesperrten Muster |
| A2 | **Teal-Festschreibung** (siehe §5) | die achtzehnfache Doppelbelegung ist hier nicht mehr auflösbar |
| A3 | Titelvariante „Battle Card 53 — IPv6 · Egress-only IGW · NAT64" (1089,7 px) statt der Langfassung (1367,9 px) | Langfassung zu nah an der Arbeitsgrenze |
| A4 | Footer-Variante V3 (977,5 px) | präziser als die kürzere V4 |
| A5 | Pfeile werden als `<line>` gezeichnet | prüft Befund 167 / den `zones.py`-Fix gegen |
| A6 | Nach Phase B wird der **Kartenstrang geschlossen**, danach ausschließlich Narrative | Ziel sind die Texte; 100 Karten stehen, ~49 Narrative fehlen |

---

## 2. Befund 169 — NEU

**EKS-Cluster können keine IPv6-only Subnetze belegen.**

Aufgefallen beim Prüfen der Szenarioannahme, bevor gezeichnet wurde. Die
Kombination „EKS-Pods im IPv6-only Subnetz mit NAT64/DNS64" ist fachlich
unmöglich; sie wäre durch die gesamte geometrische Prüfkette gelaufen, weil
qc.py, collide.py, r2.py und zones.py nur Geometrie prüfen. Gefangen hätte
sie erst Ganzheitsfrage (b) am Ende von Phase B — nach dem Zeichnen.

Belege, AWS-Primärquellen:

- `docs.aws.amazon.com/eks/latest/best-practices/subnets.html` — IPv6-Cluster
  erfordern Dual-Stack-VPCs und -Subnetze.
- `docs.aws.amazon.com/eks/latest/best-practices/ipv6.html` — jede VPC erhält
  ein IPv4-Präfix und ein festes /56-IPv6-Präfix aus Amazons GUA-Bereich,
  jedem Subnetz wird ein /64 zugewiesen; die VPC heißt dann Dual-Stack-VPC.
- `docs.aws.amazon.com/eks/latest/userguide/cni-ipv6.html` — EKS unterstützt
  keine dual-stacked Pods oder Services; die IP-Familie wird bei
  Cluster-Erstellung gewählt und ist unveränderlich; IPv6 nur mit
  Nitro-basierten EC2- oder Fargate-Knoten.

Zusatzfund, für ein späteres EKS-Narrativ aufheben: der Weg zu IPv4-Zielen
läuft bei EKS **nicht** über NAT64/DNS64, sondern über ein host-local
CNI-Plugin, das dem Pod eine knotenlokale, nicht routbare IPv4 aus
`169.254.172.0/22` vergibt; der Knoten SNATet über seine eigene IPv4-ENI.

**Merksatz für künftige Batches:** die Prüfkette prüft Geometrie, nicht
Physik. Szenarioannahmen gehören vor Phase A gegen die Doku geprüft, nicht
erst im Ganzheitsdurchgang.

---

## 3. Faktencheck — belegt, für die .md in Phase B

Neun AWS-Seiten geöffnet. Nichts aus dem Gedächtnis.

### 3.1 Egress-only Internet Gateway
Quelle: `vpc/latest/userguide/egress-only-internet-gateway.html`

- horizontal skalierte, redundante, hochverfügbare VPC-Komponente
- **stateful** — leitet hinaus und schickt die Antwort zurück
- **keine Security Group anhängbar**; die Network ACL ist die Kontrollstelle
- **keine Gebühr** für das Gateway; Datenübertragungsgebühren fallen an
- nur für IPv6; für ausgehend-only über IPv4 ist das NAT Gateway zuständig
- Grund der Konstruktion: IPv6-Adressen sind global eindeutig und damit
  per Default öffentlich

### 3.2 Adressraum
Quellen: `vpc-cidr-blocks.html`, `subnet-sizing.html`, `ipv4-ipv6-comparison.html`

- VPC: bis **5 IPv6-CIDRs von /44 bis /60** in /4-Schritten
- Subnetz: **/44 bis /64** in /4-Schritten
- Amazon-Pool-Beispiel: `2001:db8:1234:1a00::/56` für die VPC, ein /64 für
  das Subnetz; der Bereich ist nicht selbst wählbar
- Herkunft wahlweise BYOIP, Amazon-Block oder IPAM
- **Elastic IPs gibt es für IPv6 nicht** — IPv6-Adressen sind statisch
- erste vier und letzte Adresse je Subnetz sind reserviert

### 3.3 Regeln
Quelle: `vpc-migrate-ipv6-add.html`

- beim Assoziieren eines IPv6-CIDR wird die **Outbound**-Regel automatisch
  ergänzt, aber nur wenn die ursprünglichen Outbound-Regeln unverändert sind
- **Inbound**-Regeln müssen von Hand nachgezogen werden
- Default-NACL bekommt automatisch IPv6-Regeln, eine eigene oder modifizierte
  NACL nicht
- eine Routing-Tabelle kann `::/0` **nicht gleichzeitig** auf IGW und EIGW
  zeigen lassen

### 3.4 NAT64 / DNS64
Quelle: `nat-gateway-nat64-dns64.html`

- NAT64 ist auf jedem bestehenden und jedem neuen NAT Gateway **automatisch**
  verfügbar und **nicht ein- oder ausschaltbar**
- das Subnetz des NAT Gateway muss dafür **nicht** dual-stack sein
- DNS64 ist eine **Subnetz-Einstellung** (`modify-subnet-attribute --enable-dns64`)
- Präfix `64:ff9b::/96` nach RFC 6052
- die Doku zeigt drei Routen in **einer** Tabelle: IPv4-Route zum NAT Gateway,
  `64:ff9b::/96` zum NAT Gateway, `::/0` zum Egress-only IGW
- ausdrückliche Warnung: `::/0` auf das Internet Gateway zu zeigen erlaubt
  externen IPv6-Hosts, von außen eine Verbindung zu initiieren

### 3.5 Kosten
Quelle: AWS News Blog zur IPv4-Bepreisung

- **0,005 USD pro IP und Stunde ab 01.02.2024** für alle öffentlichen
  IPv4-Adressen, ob an einen Dienst angehängt oder nicht, über alle Dienste
  und Regionen
- Aufrechnung, falls eine Zahl auf die Karte soll: 0,005 × 24 × 30 = **3,60
  USD/Monat je Adresse**; 0,005 × 8760 = **43,80 USD/Jahr**. Vor Übernahme
  gegen die Knotenzahl im Szenario gegenrechnen (Befund-159-Lehre).

### 3.6 Dienstgrenzen
Quelle: `aws-ipv6-support.html`

- EC2 in IPv6-only-Subnetzen **nur auf Nitro-Instanzen**
- Dual-Stack ja, IPv6-only **nein**: RDS, Lambda, Fargate
- nur „Partial": ELB, EKS
- gar kein Dual-Stack in der VPC: EMR, FSx, Systems Manager, SageMaker,
  EventBridge, GuardDuty, Config, CloudFormation, Bedrock

### 3.7 Divergenzen zu älterem Kursmaterial

1. „Subnetz ist immer /64" — falsch, /44 bis /64.
2. „VPC bekommt /56" — nur der Amazon-Pool-Fall; assoziierbar /44 bis /60,
   bis zu fünf.
3. „AWS weist zu, eigene Blöcke gehen nicht" — falsch, BYOIP und IPAM.
4. „NAT Gateway kann kein IPv6" — **Quellenkonflikt**, siehe §3.8.
5. „IPv6 in AWS ist immer öffentlich" — nicht mehr absolut. Private
   IPv6-Bereiche (ULA/GUA über IPAM) werden an der Internet-Gateway-Kante
   verworfen, auch wenn ein IGW oder EIGW vorhanden ist.
   Quelle: `vpc-ip-addressing.html`
6. Das viel zitierte Whitepaper „IPv6 on AWS" ist als **historical reference
   only** markiert, Stand 26.10.2021 — als Beleg unbrauchbar.

### 3.8 Quellenkonflikt — auf die Karte kommt keine Absolutaussage

Zwei Seiten desselben User Guide widersprechen sich dem Wortlaut nach:

- `vpc-migrate-ipv6-add.html`: NAT Gateways unterstützen kein IPv6.
- `ipv4-ipv6-comparison.html`: NAT Gateway für IPv6 „Supported" — nutzbar mit
  NAT64.

Auflösung, die auf die Karte gehört: **es gibt kein NAT66, aber NAT64.** Das
NAT Gateway ersetzt den EIGW nicht und der EIGW ersetzt das NAT Gateway
nicht — sie stehen nebeneinander. Zentralisierten IPv6-Egress gibt es nur
selbstgebaut: NPTv6/NAT66 erfordert Transit Gateway plus eine
EC2-Router-Appliance, kein Managed Service.

Nach der Batch-10-Regel kommt **keine pauschale Aussage** „NAT Gateway kann
(k)ein IPv6" auf die Karte; der Widerspruch wird in der .md dokumentiert.

---

## 4. Szenario

**Forschungsverbund Marbeck** betreibt eine autoskalierende Analyseflotte auf
Nitro-EC2. Der IPv4-Raum der VPC ist erschöpft, sekundäre CIDRs kollidieren
mit den Campusnetzen der per VPN angebundenen Partnerhochschulen — Overlap
statt Erweiterung. Die Flotte zieht auf IPv6-only Subnetze um. Die Knoten
müssen Paketspiegel und Referenzdaten aus dem Internet holen, von außen darf
niemand eine Verbindung aufbauen. Ein Teil der Ziele ist noch IPv4-only. Die
erste Lösung hatte `::/0` auf das Internet Gateway geroutet — damit war jeder
Knoten von außen erreichbar.

Signalwörter: *outbound internet access but no inbound connections · IPv4
address exhaustion · overlapping CIDR blocks · instances must reach package
repositories · some endpoints remain IPv4-only · no NAT for IPv6*

---

## 5. Farbzuordnung und Teal-Festschreibung (A2)

**Festschreibung, ab Karte 53 gültig:**

> Teal `#0F7C8C` bleibt **Transport** (Gateways, Kanäle).
> Die **Regel-/Konfigurationsinstanz** wandert auf Governance/Control
> Gold `#A16E00`.

Begründung: Der Stil-Guide führt unter Governance ohnehin „Regeln, Rechte,
Kataloge, Nachweise". Eine Routing-Tabelle und eine DNS64-Subnetzeinstellung
sind Regelinstanzen, keine Datenwege. Löst die Doppelbelegung ohne neue Farbe.

Karten 34–50 und 54 tragen Teal weiterhin als Regelinstanz — **dokumentierte
Schuld für den Sammelpass**, nicht rückwirkend zu ändern.

| Box | Farbe |
|---|---|
| Forschungsknoten (Nitro-EC2) | Compute Orange `#D97706` |
| Routing-Tabelle | Governance Gold `#A16E00` |
| Route 53 Resolver (DNS64) | Governance Gold `#A16E00` |
| Egress-only IGW | Transport Teal `#0F7C8C` |
| NAT Gateway | Transport Teal `#0F7C8C` |
| Internet Gateway (verworfen) | Transport Teal, Rand gestrichelt Rot `#C7161D` |
| Paketspiegel, Lizenzportal | Grau `#9A9A9A` |
| Zonenrahmen | Grau `#9A9A9A`, dasharray 4,4 |

Rot `#C7161D` ausschließlich für den verworfenen Pfad und das X.

---

## 6. Geometrieplan — durchgerechnet, 0 Befunde

viewBox `0 0 1600 900`, PNG 2400×1350.

### 6.1 Boxen

| # | Box | x | y | b | h | Titelreserve |
|---|---|---|---|---|---|---|
| 1 | Forschungsknoten | 80 | 390 | 280 | 130 | 35,5 |
| 2 | Routing-Tabelle | 430 | 390 | 250 | 130 | 43,2 |
| 3 | Route 53 Resolver | 80 | 620 | 280 | 130 | 37,2 |
| 4 | Egress-only IGW | 790 | 230 | 260 | 130 | 41,3 |
| 5 | NAT Gateway | 790 | 480 | 220 | 130 | 40,4 |
| 8 | Internet Gateway (verworfen) | 790 | 660 | 270 | 110 | 37,9 |
| 6 | Paketspiegel | 1180 | 245 | 210 | 100 | 34,6 |
| 7 | Lizenzportal | 1180 | 495 | 200 | 100 | 31,6 |

Alle Titelreserven über der 20-px-Schwelle aus R4. Engster Box-zu-Box-Abstand
50 px (NAT Gateway ↔ Internet Gateway).

### 6.2 Zonen

| Zone | x | y | b | h | Luft zu den Boxen |
|---|---|---|---|---|---|
| IPv6-ONLY SUBNETZ | 50 | 300 | 690 | 270 | ≥ 30 px |
| AUSGANG AUS DER VPC | 760 | 180 | 330 | 620 | ≥ 30 px |

Zone 2 endet bei y=800, Footer ab y=820 → 20 px Luft. **In Phase B prüfen**,
ob das nach dem Rendern reicht.

### 6.3 Segmente (als `<line>`, stroke 3)

| Segment | x1 | y1 | x2 | y2 |
|---|---|---|---|---|
| 1 DNS64 (gestrichelt) | 220 | 520 | 220 | 620 |
| 2 Paket raus | 360 | 455 | 430 | 455 |
| 3a | 680 | 410 | 745 | 410 |
| 3b | 745 | 410 | 745 | 295 |
| 3c | 745 | 295 | 790 | 295 |
| 4 EIGW → Paketspiegel | 1050 | 295 | 1180 | 295 |
| 5a | 680 | 470 | 770 | 470 |
| 5b | 770 | 470 | 770 | 545 |
| 5c | 770 | 545 | 790 | 545 |
| 6 NAT → Lizenzportal | 1010 | 545 | 1180 | 545 |
| Xa (rot, gestrichelt) | 680 | 505 | 700 | 505 |
| Xb (rot, gestrichelt) | 700 | 505 | 700 | 715 |
| Xc (rot, gestrichelt) | 700 | 715 | 790 | 715 |

**0 Segment-durch-Box-Befunde** bei 6 px Inset (Liang-Barsky vorgerechnet).

### 6.4 Badges und X-Kreis

| Element | cx | cy | liegt auf |
|---|---|---|---|
| Badge 1 | 220 | 570 | Segment 1 |
| Badge 2 | 395 | 455 | Segment 2 |
| Badge 3 | 745 | 352 | Segment 3b |
| Badge 4 | 1115 | 295 | Segment 4 |
| Badge 5 | 770 | 507 | Segment 5b |
| Badge 6 | 1095 | 545 | Segment 6 |
| X-Kreis (weiß, roter Rand) | 700 | 625 | Segment Xb |

Alle sechs Badges liegen auf ihrem Segment (qc.py (d) vorgerechnet).
Badge-Ziffern auf `y = cy + 6`. Der X-Kreis hat zu jeder Box und jedem
fremden Segment über 25 px Abstand.

### 6.5 Ablauf

1. DNS64 löst auf — gestrichelt, weil Metadaten: A-Record wird AAAA mit
   `64:ff9b::/96`
2. Paket in die Routing-Tabelle
3. `::/0` zum Egress-only IGW
4. ans IPv6-Ziel (Paketspiegel)
5. `64:ff9b::/96` zum NAT Gateway
6. ans IPv4-Ziel (Lizenzportal)

Verworfen: `::/0` aufs Internet Gateway, rotes X.

Didaktische Achse: **eine Routing-Tabelle, zwei Wege.** Macht sichtbar, dass
EIGW und NAT Gateway nicht Alternativen sind, sondern nebeneinander stehen.

### 6.6 Gemessene Texte

Titel 40 px bold: „Battle Card 53 — IPv6 · Egress-only IGW · NAT64" =
**1089,7 px**, x=60 → endet bei 1149,7.

Untertitel 21 px: „IPv4-Raum erschöpft: die Flotte geht IPv6-only — raus ja,
rein nein" ≈ **717 px**.

Footer 17 px, „Merksätze:" bold getrennt gemessen und addiert:
**977,5 px** (Arbeitsgrenze ~1400).
> Merksätze:  EIGW lässt raus, nicht rein · NAT64 gilt IPv4-Zielen, NAT66
> gibt es nicht · ::/0 aufs IGW lässt auch rein

Die +13,1-px-Konstante aus HANDOFF-19 §2.4 wurde unabhängig reproduziert:
„Merksätze:" bold 106,1 px gegen normal 93,0 px.

**Großumlaut-Grep (ÄÖÜ) über alle Kartentexte: 0 Kandidaten.**

Vollständige Einzelmessungen: `precheck53b.py` im Paket, Wiederholung mit
`python3 precheck53b.py`.

### 6.7 In Phase B offen

- Drei Labels an Korridoren unter 90 px müssen `text-anchor="middle"` **über**
  ihr Segment: „Paket raus" (78,3 px im 70-px-Korridor), „::/0" (24,7 px im
  65-px-Korridor), „64:ff9b::/96" (87,8 px im 90-px-Korridor). Positionen dort
  messen, ~9 px Luft zur Badge-Oberkante.
- Freizonen aus der Elementgeometrie ableiten, nicht von Hand setzen.
- Zone 2 gegen den Footer nachmessen (20 px Luft, siehe §6.2).
- R8 Sichtprüfung: selbst rendern, dann **croppen auf ~1200×750** oder die
  Vollansicht auf 1400 px Breite skalieren. Ein `view` auf die volle
  2400×1350-PNG kommt leer zurück. „Nicht gesehen" ist keine akzeptable
  status_note.
- Ganzheitsdurchgang (a) (b) (c).

---

## 7. Folgearbeit aus E1 — Athena-Karte wird 101

Nicht in diesem Batch erledigt, gehört ins Repo-Fenster.

- Ordner `card-53/` → `card-101/`, Dateien `battle_card_53.*` →
  `battle_card_101.*`
- **SVG-Titel trägt „Battle Card 53" → „101" ist ein Geometrie-Eingriff**
  (ein Zeichen mehr bei 40 px bold, x=60, links ausgerichtet). Nachmessen.
  Die Datei lag in dieser Sitzung nicht vor.
- Frontmatter `nr: 53` → `nr: 101`
- **Befund 159 muss gefixt werden** — die Karte lebt weiter, also ist die
  nicht aufgehende 40.000 kein vertagbarer Punkt mehr. Ebenso gehen Befund
  165 und 168 auf `battle_card_101.md` über.
- Prüfen, ob `cardDir()` / `cardStem()` Nummern jenseits 100 bilden können.
- `SCENARIO_COUNT` → 101, im Unlock-Commit, nicht im Asset-Commit.
- Masterplan: Karte 101 hat **keine** Masterplan-Zeile — als „extra card"
  dokumentieren. Masterplan-Zeile 53 (Athena) ist durch Karte 40 abgedeckt,
  Masterplan-Zeile 40 (IPv6) durch Karte 53.

**Nicht überschreiben.** Das ZIP dieses Batches enthält keine
`battle_card_53.*`-Dateien, weil Phase B offen ist — beim späteren Entpacken
darauf achten, dass die Athena-Karte vorher umbenannt ist.

---

## 8. Folgearbeit aus E2 — Abgrenzungen

In Phase B mitzuliefern:

- `battle_card_52.md`, Abschnitt „Abgrenzungen": der Punkt **52 ↔ 53** ist
  gegenstandslos. IPv6/EIGW hat mit Firehose keine Berührungsfläche. Ersatz:
  **52 ↔ 40**, weil Karte 40 die Athena-Kosten-Karte ist. Der vorhandene Text
  („auf 53 geht es darum, was die Abfrage kostet") passt inhaltlich
  unverändert auf 40.
- `battle_card_54.md`: Punkt „↔ 53" prüfen, vermutlich **ersatzlos streichen**.
  Die Datei lag in dieser Sitzung als SVG vor, nicht als .md.

---

## 9. Umgebung

- Pillow im Container war **12.1.1**, Repo pinnt **12.3.0** → auf 12.3.0
  gebracht, gegengemessen: identische Breiten (131,0 / 228,5), kein
  Versionsdrift. Alle Messwerte in diesem Dokument gelten für 12.3.0.
- Fonts `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf` und `-Bold.ttf`
- Breitenmessung `ImageFont.truetype(pfad, size).getlength(text)`
- Render: CairoSVG 2.9.0 + Pillow, Fontconfig-Fix (`rgba=none`,
  `antialias=true`) in frischen Containern setzen

---

## 10. Prüfkette für Phase B

```
precheck (Textbreiten + Grossumlaut-Grep)   ← in §6.6 vorweggenommen
  → qc.py        0 Befunde Pflicht
  → collide.py   Text gegen Text
  → r2.py        Text gegen Boxgeometrie
  → zones.py     R7 Freizonen (frisch gefixt, Befund 167)
  → r16.py       Label-zu-Box-Abstand
  → R12-Grep     path mit stroke braucht fill="none"
  → R13          0 px reines Schwarz im PNG
  → R8           Sichtprüfung per Crop
```
