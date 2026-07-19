---
nr: 33
title: "AWS PrivateLink — einen Dienst privat und einseitig in Kunden-VPCs anbieten"
services:
  - AWS PrivateLink
  - Amazon VPC
  - Elastic Load Balancing (Network Load Balancer)
  - VPC Endpoint Service
signalwords:
  - expose a service to multiple customer VPCs
  - without exposing it to the internet
  - overlapping CIDR blocks
  - consumers initiate connections only
  - without managing IP allowlists
  - cross-account access
domains: [D1, D3]
assets:
  png: battle_card_33.png
  pdf: battle_card_33.pdf
  svg: battle_card_33.svg
status_note: >
  QC 0 Befunde, Render-Sanity bestanden, SICHTPRÜFUNG NICHT MÖGLICH
  (Bildansicht leer).
---

# Karte 33 — AWS PrivateLink

**Szenario.** Telemetrik24 GmbH betreibt eine SaaS-Plattform für Flottentelemetrie
in einer eigenen VPC in `eu-central-1`. **40 Kundenunternehmen** greifen darauf
zu — bisher über einen öffentlichen Load Balancer mit IP-Allowlist. Drei Dinge
brechen gleichzeitig: Kunden aus dem regulierten Umfeld verlangen, dass die
Telemetriedaten **AWS nie verlassen**. Die Allowlist mit 40 Kunden und
wechselnden NAT-IPs erzeugt bei jeder Kunden-IP-Änderung ein Ticket. Und zwei
Kunden nutzen **10.0.0.0/16** — dieselbe CIDR wie Telemetrik24 selbst.
Vertraglich gilt außerdem: Telemetrik24 darf nicht in Kundennetze hineinreichen,
und Kunden dürfen sich untereinander nicht sehen.

## Ablauf

**1 — Der Kunde legt den Endpoint an, nicht der Anbieter.** Kunde A erzeugt in
seinem eigenen Subnetz einen Interface Endpoint. Technisch ist das eine ENI mit
einer privaten IP **aus dem Subnetz des Kunden**. Aus Sicht der
Kundenanwendung liegt der SaaS-Dienst damit im eigenen Netz.

**2 — Über PrivateLink zum NLB des Anbieters.** Der Endpoint verbindet sich mit
dem Endpoint Service von Telemetrik24, der auf einen **Network Load Balancer**
zeigt. Der Verkehr bleibt vollständig im AWS-Netz — kein Internet Gateway, kein
NAT, keine öffentliche IP.

**3 — Der NLB verteilt auf die Service-Instanzen.** Ab hier ist es normale
Anbieter-Architektur. Wichtig für die Verfügbarkeit: der Endpoint Service ist
**pro Availability Zone** verfügbar, und Kunden können Endpoints nur in AZs
anlegen, in denen der Anbieter den Dienst bereitstellt. Cross-Zone Load
Balancing schließt die Lücke, erzeugt beim Anbieter aber
EC2-Datentransferkosten.

**4 — Die überlappende CIDR ist kein Thema.** Kunde B fährt 10.0.0.0/16 wie der
Anbieter. Für PrivateLink ist das irrelevant: es gibt **keine Routen und keine
Route-Table-Einträge** zwischen den VPCs. Der Kunde spricht mit einer IP aus
seinem eigenen Subnetz, der Rest ist AWS-interne Zustellung. Genau hier
scheitert Peering — und das ist der Grund, warum PrivateLink bei
Multi-Tenant-SaaS die Standardantwort ist.

**5 — Allowed Principals ersetzen die IP-Allowlist.** Am Endpoint Service legt
Telemetrik24 fest, welche AWS-Accounts den Dienst überhaupt anfordern dürfen.
Verbindungsanfragen werden manuell akzeptiert oder per Auto-Accept
durchgewinkt. Statt 40 wechselnder NAT-IPs verwaltet der Anbieter 40 stabile
Account-IDs. Sollen Kunden einen eigenen DNS-Namen sehen, verlangt AWS eine
**Domain-Verifikation per TXT-Record**.

**6 — Die Kosten liegen beim Consumer.** Der Kunde zahlt **$0,01 pro Endpoint,
AZ und Stunde** — bei drei AZs rund **$21,90 im Monat pro Kunden-VPC** — plus
**$0,01/GB** verarbeitete Daten für die erste 1 PB im Monat und Region, danach
$0,006 und ab 5 PB $0,004. Der Anbieter zahlt seinen NLB. Das ist ein
Nebeneffekt mit Vertriebswirkung: die Netzwerkkosten des Zugriffs wandern zum
Kunden.

## Prüfungs-Kernsatz

**PrivateLink ist eine Einbahnstraße ohne Routen: der Consumer initiiert, die
CIDRs dürfen sich überlappen, und Zugriff regeln Account-IDs statt IP-Listen.**

## Klassiker-Fallen

**1 — „PrivateLink braucht immer einen Network Load Balancer." Nicht mehr
absolut.** Für einen klassischen Endpoint Service stimmt es: der Anbieter stellt
einen NLB davor (für Appliances einen Gateway Load Balancer). Seit re:Invent
2024 gibt es aber **Resource Endpoints** — Zugriff auf eine konkrete Ressource
in einer fremden VPC, etwa eine RDS-Instanz oder ein TCP-Ziel per IP oder
Domain, **ohne NLB**, über die Resource Configurations von VPC Lattice. Für
SAA-C03 bleibt die NLB-Antwort die erwartete; das Wort „immer" ist
angreifbar geworden.

**2 — PrivateLink ist kein Ersatz für Peering, wenn Verkehr in beide
Richtungen fließen soll.** Der Anbieter kann über PrivateLink **nicht** in die
Kunden-VPC hinein. Fragt die Prüfung nach beidseitiger Erreichbarkeit zwischen
zwei VPCs, ist die Antwort Peering oder Transit Gateway. Fragt sie danach,
einen **Dienst anzubieten**, ist es PrivateLink. Die Richtung der Frage
entscheidet, nicht die Zahl der VPCs.

**3 — Zwei verbreitete Absolutheiten stimmen nicht mehr.** „PrivateLink ist
TCP-only" gilt seit dem **31.10.2024** nicht mehr — UDP wird über dual-stack
NLBs unterstützt. „PrivateLink funktioniert nur innerhalb einer Region" gilt
seit dem **26.11.2024** für kundeneigene Endpoint Services und seit dem
**19.11.2025** für AWS-eigene Dienste nicht mehr. Cross-Region hat allerdings
Kanten: nicht mit einem custom TCP-Idle-Timeout am NLB, nicht mit
UDP-Fragmentierung, und nicht in `use1-az3`, `usw1-az2`, `apne1-az3`,
`apne2-az2`, `apne2-az4`. AWS empfiehlt weiterhin intra-Region wegen Latenz und
Kosten.

**Randnotiz:** PrivateLink unterstützt keine Network Load Balancer mit mehr als
50 Listenern.

## Abgrenzung

- **Zu Karte 20:** Dort geht es um Gateway- gegen Interface-Endpoint aus der
  **Consumer**-Perspektive beim Zugriff auf AWS-Dienste. Karte 33 nimmt die
  **Provider**-Perspektive: einen eigenen Dienst als Endpoint Service anbieten.
- **Zu Karte 31:** Peering und Transit Gateway verbinden Netze beidseitig.
  PrivateLink exponiert einen einzelnen Dienst einseitig. Bei überlappenden
  CIDRs bleibt nur PrivateLink.

## Bewusste Vereinfachungen im Diagramm

- Gezeigt sind **2 von 40 Kunden**; der Rest steht als Textzeile.
- Der Interface Endpoint ist als **eine** ENI gezeichnet. Real entsteht pro
  konfiguriertem Subnetz eine eigene ENI, üblicherweise in mehreren AZs.
- Der rote X-Stub unter Kunde B steht für den **verworfenen** Peering-Weg, nicht
  für einen ausgefallenen Pfad.
- Der gestrichelte Teal-Pfeil vom Endpoint Service zum NLB ist eine
  Konfigurationsbeziehung, kein Datenfluss.

## Farben

Keine neue Kategorie, aber eine Doppelbelegung zum Gegenlesen: **Teal steht hier
für „Config"** (VPC Endpoint Service Configuration), wie ursprünglich für AWS
Config und Macie definiert — **nicht** für die Graph-Datenbank-Bedeutung, die in
Karte 26 für Neptune ergänzt wurde. Sonst: Blau = Kunden-VPCs (User/Consumer) ·
Grün = Interface Endpoints (erlaubt) · Navy = NLB und Service-Instanzen ·
Grau gestrichelt = Provider-VPC als Zone · Rot = verworfen und gesperrt ·
Gold = Kosten.
