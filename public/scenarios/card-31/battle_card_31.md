---
nr: 31
title: "VPC Peering vs Transit Gateway — warum Full Mesh an Betrieb und Transit scheitert"
services:
  - Amazon VPC
  - VPC Peering
  - AWS Transit Gateway
  - AWS Site-to-Site VPN
signalwords:
  - as the number of VPCs grows
  - centrally manage connectivity
  - on-premises data center must reach all VPCs
  - minimize operational overhead
  - transitive routing
  - segment production from non-production
domains: [D3, D4]
assets:
  png: battle_card_31.png
  pdf: battle_card_31.pdf
  svg: battle_card_31.svg
status_note: >
  QC 0 Befunde, Render-Sanity bestanden, SICHTPRÜFUNG EINMAL ERFOLGT
  (Bildansicht lieferte die Karte beim ersten Versuch, beim zweiten nicht;
  F9 ist sporadisch, nicht deterministisch). Layout korrekt, keine
  Überlappungen. Offen: Label "Sandbox sieht keine Prod-Daten" steht mit
  10 px Abstand sehr dicht am goldenen Pfeil zur Kostenbox.
---

# Karte 31 — VPC Peering vs Transit Gateway

**Szenario.** Hansa Fracht AG, Logistik, alles in `eu-central-1`. Über vier Jahre
sind 12 VPCs gewachsen: vier Produkt-Teams mit je Prod und Test, dazu Shared
Services, Data Platform, Security-Tooling und eine Sandbox. Verbunden sind sie
mit 18 selektiven Peering-Verbindungen, gebaut immer dann, wenn zwei Teams
etwas voneinander brauchten. Die neue Tracking-Plattform braucht jetzt jedes
VPC mit jedem. Und das Rechenzentrum Hamburg hängt per Site-to-Site VPN an
genau einem VPC.

## Ablauf

**1 — Full Mesh, verworfen.** Peering ist eine Punkt-zu-Punkt-Beziehung. Wer
alle mit allen verbinden will, braucht n(n−1)/2 Verbindungen: bei 12 VPCs sind
das **66 Peering-Verbindungen** und rund **132 Route-Table-Einträge**, denn
jede Verbindung braucht auf beiden Seiten eine Route. Das Quota ist dabei
ausdrücklich *nicht* das Problem — 50 aktive Verbindungen pro VPC sind Default,
125 das Maximum, und jedes VPC bräuchte hier nur 11. Der Killer ist der
Betriebsaufwand: ein zweiköpfiges Netzwerkteam pflegt 132 Einträge von Hand,
und jedes neue VPC bringt 12 weitere Verbindungen mit.

**2 — Der VPN-Anschluss endet an seinem VPC.** Hamburg hängt an Shared
Services. VPC Team 3 ist mit Shared Services gepeert — und erreicht Hamburg
trotzdem nicht. Peering kennt **kein transitives Routing** und **kein
Edge-to-Edge-Routing**: ein VPC darf das Internet Gateway, den NAT Gateway, den
Gateway-Endpoint und eben auch die VPN-/Direct-Connect-Anbindung des Nachbarn
nicht mitbenutzen. Die bisherige Notlösung war eine eigene VPN-Verbindung pro
VPC; vier laufen bereits. Das ist der eigentliche Grund für den Umbau, nicht
die Zahl 66.

**3 — Transit Gateway als Hub.** Jedes VPC bekommt genau ein Attachment zum
TGW, das Routing läuft transitiv über den Hub. Aus 66 Verbindungen werden 12
Attachments, aus 132 Route-Table-Einträgen werden zentrale TGW-Route-Tables.
Ein TGW trägt bis zu 5.000 Attachments, ein VPC-Attachment bis 50 Gbps burst.

**4 — Ein VPN-Attachment für Hamburg.** Das Rechenzentrum wird einmal an das
TGW angebunden, nicht zwölfmal an zwölf VPCs. Die vier bestehenden
Einzel-VPNs entfallen. Damit erreichen alle VPCs on-premises über dieselbe
Leitung — genau das, was Peering strukturell nicht kann.

**5 — Segmentierung über Route-Tables.** Ein Hub ohne Trennung würde die
Sandbox direkt neben die Produktion stellen. Zwei TGW-Route-Tables — eine für
Prod, eine für Test/Sandbox — regeln, wer wen sieht. Die Trennung passiert im
Routing, ohne zusätzliche Firewall.

**6 — Der Preis der Ordnung.** TGW kostet rund **$0,05 pro Attachment und
Stunde** (us-east-1, ≈ $36,50/Monat) plus **$0,02 je GB**, das ein VPC an das
TGW schickt. 13 Attachments sind ≈ **$475/Monat vor Traffic**. Peering-
Verbindungen selbst kosten nichts; dort zahlt man nur Datentransfer über
AZ- oder Region-Grenzen, innerhalb einer AZ ist er frei.

## Prüfungs-Kernsatz

**Peering verbindet Paare, Transit Gateway verbindet Netze — und nur das TGW
trägt on-premises zu allen VPCs weiter.**

## Klassiker-Fallen

**1 — „Nur Peering kann Security-Group-Referenzierung." Veraltet.**
Kursmaterial und viele Practice Exams sagen das noch geschlossen. Seit
**25.09.2024** unterstützt auch Transit Gateway die Referenzierung von
Security Groups aus anderen VPCs. Die Einschränkungen sind aber real und
prüfungstauglich: nur **inbound**-Regeln, nur **innerhalb einer Region**, nur
wenn das Feature **auf dem TGW und auf dem Attachment** aktiviert ist (auf
TGW-Ebene per Default aus), nur auf **Nitro**-Instanzen, **nicht** über
TGW-Peering-Verbindungen hinweg, **nicht** für PrivateLink-Endpoints, nicht in
`use1-az3` und nicht in `ap-southeast-4`. Kurios und erwähnenswert: die
TGW-Quotas-Seite trägt bis heute den gegenteiligen Satz, dass
SG-Referenzierung bei der Migration von Peering nicht unterstützt werde. Die
AWS-Doku widerspricht sich hier selbst.

**2 — „Niedrigste Latenz zwischen zwei VPCs" ist keine TGW-Frage.** Fragt die
Prüfung nach genau zwei VPCs und nennt Latenz als Kriterium, ist Peering die
Antwort: direkte Verbindung, kein zusätzlicher Hop. TGW gewinnt bei *vielen*
VPCs, nicht bei zweien.

**3 — TGW ist nicht automatisch billiger.** Bei zwei oder drei VPCs kostet
Peering praktisch nichts, TGW dagegen ab dem ersten Attachment pro Stunde. Die
Kostenersparnis entsteht erst über Betriebsaufwand und weggefallene
Einzel-VPNs, nicht über den Listenpreis. Wer „cost-effective" liest und
reflexhaft TGW ankreuzt, fällt bei kleinen VPC-Zahlen darauf herein.

## Abgrenzung zu Karte 32

Karte 31 beantwortet das **Ob**: zentrale Anbindung über ein TGW statt einer
VPN-Verbindung pro VPC. Karte 32 beantwortet das **Womit**: Site-to-Site VPN
gegen Direct Connect, Bandbreite, Kosten, Umstiegspfad.

## Bewusste Vereinfachungen im Diagramm

- Der Mesh zeigt **4 von 12 VPCs**; ein gezeichneter Full Mesh aus 12 Knoten
  wäre unlesbar. Die Zahl 66 steht im Label, nicht in der Grafik.
- Die 12 Spokes am TGW sind durch **4 Boxen plus Textzeile** vertreten.
- Die on-premises-Zone zeigt das Rechenzentrum als Block; der Leitungstyp
  (VPN vs. Direct Connect) ist bewusst offen und gehört auf Karte 32.

## Farben

Keine neue Kategorie. Blau = VPCs, Navy = Transit Gateway und
on-premises-Anbindung, Grün = erlaubter Pfad (Route Table PROD), Grau = extern
und isoliert (on-premises-Zone, Route Table TEST), Rot = verworfen, Gold =
Kosten.
