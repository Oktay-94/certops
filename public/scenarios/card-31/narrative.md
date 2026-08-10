---
cardNumber: 31
slug: vpc-peering-transit-gateway-hansa-fracht-full-mesh
title: "VPC Peering vs Transit Gateway — warum Full Mesh an Betrieb und Transit scheitert"
services: ["Amazon VPC", "VPC Peering", "AWS Transit Gateway", "AWS Site-to-Site VPN"]
domains: ["D3", "D4"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-connection-quotas.html"
  - "https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html"
  - "https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/vpc-peering.html"
  - "https://docs.aws.amazon.com/vpc/latest/tgw/transit-gateway-quotas.html"
  - "https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html"
  - "https://docs.aws.amazon.com/vpc/latest/tgw/tgw-vpc-attachments.html"
  - "https://aws.amazon.com/transit-gateway/pricing/"
  - "https://aws.amazon.com/about-aws/whats-new/2021/05/amazon-vpc-announces-pricing-change-for-vpc-peering"
  - "https://aws.amazon.com/about-aws/whats-new/2022/04/aws-data-transfer-price-reduction-privatelink-transit-gateway-client-vpn-services"
  - "https://aws.amazon.com/about-aws/whats-new/2024/09/general-availability-security-group-referencing-aws-transit-gateway"
---

## Die Grundidee zuerst

Stell dir ein Bürogebäude ohne Flur vor.

**So sieht es heute aus:** Zwölf Büros, und wenn zwei Leute miteinander arbeiten müssen, brichst du eine Tür in die Wand zwischen ihren Räumen. Das funktioniert wunderbar für die ersten drei Türen. Bei zwölf Büros, in denen jeder mit jedem reden soll, sind es 66 Türen — und für jede Tür musst du in **beiden** Räumen ein Schild aufhängen, damit die Leute wissen, welche der elf Türen zu wem führt. 132 Schilder, gepflegt von Hand.

Und dann kommt die Regel, die alles kippt: **Du darfst durch eine fremde Tür nicht hindurchgehen.** Steht Anna in Raum 3 und will zu Clara in Raum 7, dann hilft ihr die Tür von Raum 3 nach Raum 5 nichts, auch wenn Raum 5 eine Tür zu Raum 7 hat. Sie müsste selbst eine Tür zu Raum 7 haben. Das gilt auch für die Haustür: Der Hauseingang liegt in Raum 5. Anna kommt trotz Verbindungstür nicht auf die Straße.

**So könnte es aussehen:** Du reißt die Türen zu und baust einen **Flur**. Jedes Büro bekommt genau eine Tür — zum Flur. Zwölf Türen statt 66. Wer wen erreichen darf, steht nicht mehr an 132 Schildern, sondern in einer Liste am Flur. Und der Hauseingang liegt jetzt ebenfalls am Flur, nicht in einem Büro. Damit kommt jeder auf die Straße.

Das ist die ganze Karte. VPC Peering sind die Türen, Transit Gateway ist der Flur. Der teure Fehler ist nicht die Zahl 66. Der teure Fehler ist, dass die Hansa Fracht AG vier separate VPN-Verbindungen gebaut hat, weil ihr Hauseingang in einem Büro liegt.

## Was es eigentlich ist — ein Route-Table-Eintrag, kein Kabel

Eine Peering-Verbindung ist kein Tunnel und kein Gerät. Sie ist eine Erlaubnis plus zwei Zeilen in Routing-Tabellen. Ohne die Zeilen passiert nichts, auch wenn die Verbindung im Status `active` steht.

So sieht die Route Table von VPC Team 3 aus, wenn alle zwölf VPCs miteinander gepeert sind:

```
Destination      Target                    Zweck
10.0.0.0/16      local                     eigenes VPC
10.1.0.0/16      pcx-0a1b2c3d              Team 1 Prod
10.2.0.0/16      pcx-0e4f5a6b              Team 1 Test
10.3.0.0/16      pcx-07c8d9e0              Team 2 Prod
10.4.0.0/16      pcx-01f2a3b4              Team 2 Test
   ...           ...                       sieben weitere
```

Elf Peering-Zeilen, in jedem der zwölf VPCs. Kommt VPC dreizehn dazu, öffnest du zwölf Route Tables und trägst je eine Zeile nach — plus zwölf neue Peering-Verbindungen, jede mit Request und Accept.

Dieselbe Route Table nach dem Umbau:

```
Destination      Target                    Zweck
10.0.0.0/16      local                     eigenes VPC
10.0.0.0/8       tgw-04f9c1a7e2            alles andere
```

**Zwei Zeilen, und sie ändern sich nie wieder.** Das VPC weiß nicht mehr, wer sonst noch am Hub hängt — und muss es auch nicht wissen. Die Entscheidung, wer wen erreicht, ist aus den VPCs herausgewandert und liegt jetzt in den Route Tables des Transit Gateways.

## Der Weg durch die Karte

### Der Mesh oben links — 66 ist Rechnung, nicht Schätzung

Peering ist eine Punkt-zu-Punkt-Beziehung zwischen genau zwei VPCs. Für ein Full Mesh brauchst du jede Paarung genau einmal: n(n−1)/2. Bei zwölf VPCs sind das 12 × 11 / 2 = **66 Verbindungen**. Das AWS-Whitepaper zu Multi-VPC-Netzwerken rechnet dieselbe Formel für 100 VPCs vor und kommt auf 4.950. Die Karte zeigt nur vier der zwölf VPCs — ein gezeichneter Mesh aus zwölf Knoten wäre unlesbar, und die Zahl steht deshalb im Label statt in der Grafik.

### Badge 1 — die eine Verbindung, die für 66 steht

Das Badge sitzt auf der Linie zwischen VPC 1 und VPC 2 und markiert das Bauteil: **eine** Peering-Verbindung. Alles, was diese Karte an Aufwand behauptet, ist dieses Bauteil mal 66.

### Die rote Zeile darunter — 132 Einträge, zwei Netzwerker

Jede Verbindung braucht auf beiden Seiten eine Route, sonst fließt nichts. 66 × 2 = 132 Route-Table-Einträge. Gepflegt von einem zweiköpfigen Netzwerkteam, von Hand, über vier Jahre gewachsen. **Das Quota ist dabei ausdrücklich nicht das Problem:** AWS erlaubt per Default 50 aktive Peering-Verbindungen pro VPC und auf Antrag bis zu 125. Jedes VPC bräuchte hier elf. Wer in der Prüfung „Peering scheitert am Limit" liest, liest meistens einen Distraktor.

### Der Mittelkasten — aus 66 mach 13

`n(n-1)/2 → n+1` ist die eigentliche Aussage der Karte. Der Aufwand wächst bei Peering **quadratisch**, beim Hub **linear**. Zwölf VPCs plus ein VPN-Attachment sind 13 Attachments. Bei 24 VPCs wären es 276 Peering-Verbindungen — oder 25 Attachments.

### Der graue Kasten unten links — warum Hamburg grau ist

`ON-PREMISE HAMBURG` steht in einem grau gestrichelten Rahmen, während alle VPCs blau und durchgezogen sind. Das ist keine Dekoration, sondern die Farbkonvention dieser Kartenreihe: Grau gestrichelt heißt **außerhalb der AWS-Kontrollebene**. Für das Rechenzentrum kannst du keine Route Table anlegen, keine Security Group setzen und kein Attachment erzwingen — du kannst nur eine Leitung dorthin terminieren. Genau deshalb ist die Frage „wo endet die Leitung?" auf dieser Karte so wichtig: Sie ist die einzige Stelle, an der du überhaupt eine Entscheidung triffst. Die Karte lässt bewusst offen, ob es VPN oder Direct Connect ist — das gehört auf Karte 32.

### Badge 2 — der Hauseingang liegt im falschen Raum

Hamburg hängt per Site-to-Site VPN an genau einem VPC: Shared Services. VPC Team 3 ist mit Shared Services gepeert und erreicht Hamburg **trotzdem nicht**. Peering kennt kein transitives Routing und kein Edge-to-Edge-Routing: Ein VPC darf das Internet Gateway, den NAT Gateway, den Gateway Endpoint und eben auch die VPN- oder Direct-Connect-Anbindung des Nachbarn nicht mitbenutzen. Das AWS-Whitepaper sagt es so trocken wie möglich — bei Peering muss die on-premises-Anbindung **an jedes VPC einzeln** gebaut werden. Vier dieser Notlösungs-VPNs laufen bereits. Das ist der eigentliche Grund für den Umbau, nicht die Zahl 66.

### Badge 3 — zwölf Attachments statt 66 Verbindungen

Jedes VPC bekommt genau ein Attachment zum Transit Gateway. Ein TGW trägt per Default **5.000 Attachments**, und das Quota ist auf Antrag erhöhbar. Die Größenordnung spielt hier also keine Rolle mehr — der Hub ist nicht die Grenze.

### Der TGW-Kasten — transitiv ist ein Feature, kein Nebeneffekt

`Hub — transitiv, zentral`. Genau das kann Peering nicht. Der Verkehr von Team 3 nach Team 1 läuft über den Hub, mit einem zusätzlichen Hop. Bandbreite ist dabei selten das Argument: Ein VPC-Attachment liefert laut aktueller Quotas-Seite **bis zu 100 Gbps je Richtung und Availability Zone**. Die weit verbreitete Angabe „50 Gbps" ist der ältere Stand; auch `battle_card_31.md` trägt sie noch. Sie ist nicht falsch im Sinne von unerreichbar, aber sie unterschätzt den heutigen Wert um die Hälfte.

### Badge 4 — ein VPN-Attachment statt vier Einzel-VPNs

Das Rechenzentrum wird einmal an das TGW angebunden, nicht zwölfmal an zwölf VPCs. Die vier bestehenden Einzel-VPNs entfallen. Damit erreichen alle VPCs on-premises über dieselbe Leitung — genau das, was Peering strukturell nicht kann.

### Badge 5 — Segmentierung passiert im Routing

Ein Hub ohne Trennung stellt die Sandbox direkt neben die Produktion. Zwei TGW-Route-Tables regeln, wer wen sieht: `Route Table PROD` für die Prod-VPCs, `Route Table TEST` für Test und Sandbox. Die Karte schreibt das Ergebnis daneben — `Sandbox sieht keine Prod-Daten`. Es braucht dafür keine Firewall und keine Appliance. Ein TGW trägt per Default 20 Route Tables.

### Badge 6 — der Preis der Ordnung

13 Attachments × $0,05 pro Stunde × 730 Stunden ≈ **$475 im Monat**, bevor ein einziges Byte fließt, plus **$0,02 je verarbeitetem GB**. Die Rechnung geht auf. Der Preis stammt aus dem Beispiel der AWS-Preisseite für US East (Ohio); die Regionstabelle selbst ist JS-gerendert und nicht abrufbar, das Szenario spielt in `eu-central-1`. Nimm die Zahl als Größenordnung, nicht als Rechnungsbetrag.

**Auf der Karte steht `Peering-Verbindungen kosteten nichts` — richtig ist: die Verbindung kostet nichts, der Verkehr darüber sehr wohl.** AWS schreibt es in der Peering-Dokumentation ausdrücklich: Es gibt keine Gebühr für das Anlegen einer Peering-Verbindung, und Datentransfer, der **innerhalb einer AZ** bleibt, ist seit dem 01.05.2021 kostenlos — auch über Accountgrenzen. Für Transfer über AZ- und Regionsgrenzen fallen die normalen In-Region-Raten an, in der Größenordnung eines Cents pro GB und Richtung.

Und die Karte lässt die Pointe weg, die in dieselbe Zeile gehört: Seit dem **01.04.2022** ist cross-AZ-Datentransfer **über Transit Gateway kostenlos**. Beim TGW zahlst du nur die Data-Processing-Gebühr, beim Peering zusätzlich den cross-AZ-Transfer. In einem Multi-AZ-Aufbau ist die Kostendifferenz zwischen beiden Modellen also kleiner, als die Karte suggeriert.

Fixvorschlag für die Kostenbox, gegen die Boxbreite von 350 px gemessen und passend:

```
+ $0,02/GB verarbeitet, cross-AZ frei
Peering: $0/Verbindung, $0,01/GB cross-AZ
```

### Die Fußzeile — drei Sätze, drei verschiedene Fragen

Die Merksätze am unteren Rand sehen aus wie eine Zusammenfassung, sind aber drei Antworten auf drei verschiedene Prüfungsfragen. `Peering ist nicht transitiv — 12 VPCs = 66 Verbindungen` beantwortet die Architekturfrage. `nur TGW trägt on-premises zu allen VPCs` beantwortet die Hybrid-Frage — und das ist die, an der die meisten Punkte hängen. `TGW kostet pro Attachment und pro GB` beantwortet die Kostenfrage und ist der Satz, der dich davor bewahrt, TGW reflexhaft als die billigere Lösung anzukreuzen. Lies die drei Sätze getrennt, nicht als einen.

## Die entscheidende Unterscheidung — Paar gegen Netz

| | VPC Peering | Transit Gateway |
|---|---|---|
| Beziehung | genau zwei VPCs | beliebig viele, über einen Hub |
| Aufwand bei n VPCs | n(n−1)/2 Verbindungen | n Attachments |
| Transitives Routing | **nein** | **ja** |
| on-premises für alle VPCs | nur pro VPC einzeln | ein Attachment für alle |
| Zusätzlicher Hop | nein | ja |
| Grundgebühr | keine | pro Attachment und Stunde |
| Datentransfer cross-AZ | kostenpflichtig | frei, Processing bleibt |
| Segmentierung | über Route Tables je VPC | über TGW-Route-Tables zentral |

## Die ehrliche Feinheit

Der Satz „Nur Peering kann Security Groups aus anderen VPCs referenzieren" steht so noch in viel Kursmaterial und in vielen Practice Exams. Er stimmt seit dem **25.09.2024** nicht mehr: Transit Gateway unterstützt Security Group Referencing.

Die Einschränkungen sind aber real und prüfungstauglich. Es gilt nur für **inbound**-Regeln, nur **innerhalb einer Region**, nur auf **Nitro**-Instanzen, **nicht** über TGW-Peering-Verbindungen hinweg, **nicht** für Interface Endpoints von PrivateLink, und nicht für Attachments mit einem Subnetz in der Availability Zone `use1-az3`. Dazu kommt eine Default-Falle, wie sie in der Prüfung gern auftaucht: Auf **TGW-Ebene** ist das Feature per Default **aus**, auf **Attachment-Ebene** per Default **an** — und wer das Attachment per API anlegt, ohne `SecurityGroupReferencingSupport` zu setzen, erbt die Einstellung des TGW.

Zwei Anmerkungen zur Quellenlage, die in `battle_card_31.md` stehen und beim Nachprüfen nicht gehalten haben. Erstens: Die Karte-`.md` merkt an, die TGW-Quotas-Seite trage „bis heute den gegenteiligen Satz", SG-Referenzierung werde bei der Migration von Peering nicht unterstützt. Am 30.07.2026 steht dieser Satz **nicht mehr** auf der Seite; AWS hat den Widerspruch stillschweigend behoben. Zweitens: Die dort genannte Ausnahmeregion `ap-southeast-4` ließ sich in der aktuellen Dokumentation nicht belegen — genannt wird nur `use1-az3`, dazu Einschränkungen für bestimmte Local Zones, Outposts und Wavelength Zones.

## Syntax lesen — Association gegen Propagation

Eine TGW-Route-Table hat zwei Beziehungen zu einem Attachment, und sie werden ständig verwechselt:

```
Attachment  VPC Sandbox
   |
   +-- ASSOCIATION  ---> Route Table TEST
   |    "Welche Tabelle wird benutzt, wenn Traffic AUS diesem
   |     Attachment ankommt?"  Genau EINE pro Attachment.
   |
   +-- PROPAGATION ---> Route Table TEST
        "In welche Tabellen werden die CIDRs dieses Attachments
         als Routen EINGETRAGEN?"  Beliebig viele.
```

Die Isolation der Sandbox entsteht aus der Kombination: Das Sandbox-Attachment ist mit `Route Table TEST` **associated**, und die Prod-Attachments propagieren **nicht** dorthin. Die Sandbox findet die Prod-CIDRs also gar nicht erst in ihrer Tabelle. Umgekehrt propagiert die Sandbox nicht in `Route Table PROD`. Wer nur eine Richtung konfiguriert, baut asymmetrisches Routing statt Isolation.

## Was du dadurch nicht baust

- **Keine Verschlüsselung.** Verkehr zwischen VPCs über TGW oder Peering bleibt im AWS-Netz, ist aber kein IPsec. Intra-Region-Verkehr zwischen Nitro-Instanzen wird transparent verschlüsselt — das ist eine Eigenschaft der Instanzen, keine des TGW.
- **Keine Inspektion.** Ein TGW routet, es filtert nicht. Wer Deep Packet Inspection will, braucht ein Inspection-VPC mit Gateway Load Balancer oder Network Firewall.
- **Keine Lösung für überlappende CIDRs.** Beide Modelle brauchen eindeutige Adressbereiche. Überlappen zwei VPCs, hilft nur PrivateLink — das ist Karte 33.
- **Keine niedrigere Latenz.** Der Hub ist ein zusätzlicher Hop. Für genau zwei VPCs ist Peering der kürzere Weg.
- **Keine automatische Kostenersparnis.** Die Ersparnis entsteht über Betriebsaufwand und weggefallene Einzel-VPNs, nicht über den Listenpreis.

## Wenn du dir eine Sache merkst

**Peering verbindet Paare, Transit Gateway verbindet Netze — und nur das TGW trägt on-premises zu allen VPCs weiter.**

Alles, was nach „jedes VPC einzeln anbinden" klingt, fällt an der fehlenden Transitivität. Alles, was nach „zentral verwalten" oder „operational overhead minimieren" klingt, fällt zugunsten des Hubs. Und alles, was nach „genau zwei VPCs, niedrigste Latenz" klingt, fällt zurück auf Peering.

## Prüfungsknackpunkte

**Signalwörter für Transit Gateway:** *as the number of VPCs grows*, *centrally manage connectivity*, *on-premises data center must reach all VPCs*, *minimize operational overhead*, *transitive routing*, *segment production from non-production*.

**Signalwörter für Peering:** genau zwei VPCs, *lowest latency*, *no additional hop*, *simplest possible connection*.

**Warum „mehr Peering-Verbindungen anlegen" hier verliert:** Es löst die Vernetzung, aber nicht den Zugang nach Hamburg. Peering ist nicht transitiv — das bleibt auch bei 66 Verbindungen so.

**Warum „eine VPN-Verbindung pro VPC" hier verliert:** Es funktioniert technisch und ist genau der Zustand, aus dem die Firma herauswill. Zwölf VPN-Verbindungen bedeuten zwölffachen Betrieb und zwölffache Grundgebühr.

**Warum „das Peering-Quota erhöhen lassen" hier verliert:** Das Quota ist nicht erreicht. 50 sind Default, 125 das Maximum, gebraucht werden elf.

**Warum „TGW ist immer günstiger" hier verliert:** Bei zwei oder drei VPCs kostet Peering praktisch nichts, TGW dagegen ab dem ersten Attachment pro Stunde. Wer *cost-effective* liest und reflexhaft TGW ankreuzt, fällt bei kleinen VPC-Zahlen herein.

**Die veraltete Aussage, die dich Punkte kostet:** „Security-Group-Referenzierung geht nur mit Peering." Seit September 2024 falsch. Wenn eine Frage genau darauf zielt, prüfe, ob sie inbound-Regeln und eine einzelne Region meint — dann kann TGW es auch.
