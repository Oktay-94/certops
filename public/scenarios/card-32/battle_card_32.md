---
nr: 32
title: "Site-to-Site VPN vs Direct Connect — mit VPN starten, auf DX landen"
services:
  - AWS Site-to-Site VPN
  - AWS Direct Connect
  - AWS Transit Gateway
  - AWS Direct Connect Gateway
signalwords:
  - consistent and predictable network performance
  - dedicated connection
  - reduce data transfer costs
  - connectivity needed within days
  - encrypted in transit
  - backup connection
domains: [D1, D3, D4]
assets:
  png: battle_card_32.png
  pdf: battle_card_32.pdf
  svg: battle_card_32.svg
status_note: >
  QC 0 Befunde, Render-Sanity bestanden, SICHTPRÜFUNG NICHT MÖGLICH
  (Bildansicht leer, F9 greift bei dieser Karte).
---

# Karte 32 — Site-to-Site VPN vs Direct Connect

**Szenario.** Hansa Fracht AG, Fortsetzung von Karte 31. Hamburg hängt seit dem
Umbau mit einem VPN-Attachment am Transit Gateway. Jetzt kommt die Last: Die
Sendungsdatenbank repliziert nachts **1,8 TB in ein Sechs-Stunden-Fenster**,
rund **0,67 Gbps Dauerdurchsatz**. Rechnerisch passt das in einen
Standard-Tunnel. In der Praxis schwankt die erreichte Rate über das öffentliche
Internet zwischen 0,3 und 1,1 Gbps, und das Fenster reißt zwei- bis dreimal pro
Woche. Dazu kommen 14 TB Egress pro Monat nach Hamburg.

## Ablauf

**1 — VPN ist die Brücke, nicht die Lösung.** Eine Site-to-Site-VPN-Verbindung
steht in Minuten: IPsec über das öffentliche Internet, **von Haus aus
verschlüsselt**, zwei Tunnel in verschiedenen Availability Zones. Genau deshalb
ist sie der richtige Startpunkt, wenn Konnektivität *jetzt* gebraucht wird. Was
sie nicht liefert, ist Vorhersagbarkeit — der Pfad gehört dem Internet, nicht
AWS.

**2 — Direct Connect parallel bestellen.** Eine dedizierte Leitung gibt es in
1, 10, 100 und 400 Gbps; über einen Partner (hosted) auch ab 50 Mbps. Der
Vorlauf sind **Tage bis Wochen**, weil ein Cross-Connect im Colo geschaltet und
ein Port bereitgestellt werden muss. Das ist keine AWS-Bremse, sondern Physik
und Terminplanung — und der Grund, warum Schritt 1 überhaupt existiert.

**3 — DX terminiert am selben Transit Gateway.** Über eine Transit VIF und ein
Direct Connect Gateway hängt die Leitung am selben Hub wie das VPN. Damit
erreichen alle VPCs die neue Leitung, ohne dass irgendein VPC angefasst wird.

**4 — Der Umstieg braucht kein Wartungsfenster.** Werden über beide Wege
dieselben Prefixe announced, **bevorzugt AWS die DX-BGP-Routen vor den
VPN-Routen**. Der Cutover passiert im Routing, nicht per Schalter. Fällt DX
aus, verschwinden dessen Routen und das VPN übernimmt automatisch. Wichtig: das
gilt nur AWS-seitig — die on-premises-Seite muss dieselbe Präferenz separat
konfiguriert bekommen, sonst entsteht asymmetrisches Routing.

**5 — Verschlüsselung nachziehen.** Direct Connect ist **nicht verschlüsselt**.
MACsec wäre die native Antwort, ist aber nur auf dedizierten 10-, 100- und
400-Gbps-Verbindungen an ausgewählten Standorten verfügbar — bei 1 Gbps also
nicht. Bleibt IPsec-VPN über die DX-Leitung, wenn Compliance Verschlüsselung
verlangt.

**6 — Die Kostenwende.** 14 TB Egress im Monat kosten über das Internet
**$0,09/GB ≈ $1.290**, über Direct Connect **$0,02/GB ≈ $287**. Dagegen steht
der Port mit $0,30/h ≈ **$219/Monat**. Cross-Connect und Telco-Leitung stellt
**nicht AWS** in Rechnung — die fehlen in jeder AWS-Rechnung und in den meisten
Übungsaufgaben.

## Prüfungs-Kernsatz

**VPN kauft Zeit, Direct Connect kauft Vorhersagbarkeit — und DX bringt seine
Verschlüsselung nicht mit.**

## Klassiker-Fallen

**1 — Die 1,25-Gbps-Grenze stimmt nicht mehr, hilft hier aber trotzdem nicht.**
Kursmaterial nennt geschlossen 1,25 Gbps pro Tunnel als harte Decke mit ECMP
als einzigem Ausweg. Seit **12.11.2025** gibt es Large Bandwidth Tunnels mit
**5 Gbps pro Tunnel**. Drei Einschränkungen, die prüfungstauglich sind: nur an
**Transit Gateway oder Cloud WAN**, nicht an einem Virtual Private Gateway;
nicht in Melbourne, Tel Aviv, Zürich, Calgary und den VAE; und der Preis
springt von **$0,05/h auf $0,60/h**, also Faktor 12. Der eigentliche Denkfehler
im Szenario liegt aber woanders: **ein 5-Gbps-Tunnel macht die Internet-Strecke
nicht schneller.** LBT hebt die Decke des Tunnels, nicht die des Pfades
darunter. Wer hier auf LBT ausweicht, zahlt das Zwölffache und behält die
Schwankung.

**2 — „encrypted in transit" plus Direct Connect ist eine Fangfrage.** DX ist
eine private, aber unverschlüsselte Leitung. Wer beides braucht, kombiniert:
MACsec auf Layer 2 (nur dedicated 10/100/400 Gbps, ausgewählte Standorte,
kostenlos) oder IPsec-VPN über DX. „Direct Connect ist sicher, weil privat" ist
die falsche Antwort.

**3 — Ein einzelner DX ist keine Hochverfügbarkeit.** Eine Leitung ist ein
Single Point of Failure; die AWS-SLA greift erst bei redundanten Verbindungen.
Fragt die Prüfung nach *resilient* und *hybrid*, ist die Antwort entweder ein
zweiter DX an einem zweiten Standort oder eben DX plus VPN-Backup — nicht ein
größerer Port.

**Randnotiz für die Praxis, nicht für die Prüfung:** Am VGW tragen DX und VPN
dieselbe ASN, weshalb der MED-Mechanismus die DX-Präferenz von allein
durchsetzt. Am TGW nutzen beide Wege unterschiedliche ASNs — dort greift MED
nur, wenn der Kunden-Router `bgp always-compare-med` gesetzt hat.

## Abgrenzung zu Karte 31

Karte 31 beantwortet das **Ob**: zentrale Anbindung über ein Transit Gateway
statt einer VPN-Verbindung pro VPC. Karte 32 beantwortet das **Womit**: VPN
gegen Direct Connect, Bandbreite, Verschlüsselung, Kosten und der Umstiegspfad
zwischen beiden.

## Bewusste Vereinfachungen im Diagramm

- Das Diagramm zeigt **3 der 12 VPCs**; die restlichen stehen als Textzeile.
- Die beiden VPN-Tunnel einer Verbindung sind als **eine Linie** gezeichnet.
  Real sind es immer zwei, in verschiedenen AZs.
- Direct Connect Gateway und Transit VIF sind im Kasten „DX Location"
  zusammengefasst; die VIF-Typen gehören nicht auf diese Karte.
- Der rote X-Stub am Internet-Kasten steht für die **verworfene**
  5-Gbps-Zwischenlösung, nicht für einen ausgefallenen Pfad.

## Farben

Keine neue Kategorie. Navy = VPN und Transit Gateway, konsistent mit Karte 31 ·
Grün = Direct Connect als Zielpfad („erlaubt/Ziel") · Grau gestrichelt =
on-premises-Zone und Internet als externe, nicht kontrollierte Strecke · Blau =
VPCs · Rot = verworfen und Warnung · Gold = Kosten.
