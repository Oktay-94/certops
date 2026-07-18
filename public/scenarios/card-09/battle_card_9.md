---
nr: 9
title: "Outposts · Local Zones — AWS-Compute nah an der Maschine"
services:
  - AWS Outposts
  - EC2 on Outposts
  - EBS / S3 on Outposts
  - Local Gateway (LGW)
  - AWS Local Zones (Abgrenzung)
  - AWS Wavelength (Abgrenzung)
signalwords:
  - < 10 ms Latenz zur Maschine
  - im eigenen Werk / Rechenzentrum
  - Daten durfen das Werk nicht verlassen
  - muss bei Leitungsausfall weiterlaufen
  - gleiche AWS-APIs on-premises
domains: [D3, D1]
assets:
  - battle_card_9.svg
  - battle_card_9.png
  - battle_card_9.pdf
status_note: "Latenzangaben sind Größenordnungen (Outposts sub-10 ms lokal, Region 30–100 ms), keine garantierten SLA-Werte. Faktencheck 17.07.2026."
---

## Szenario

Ein Automobilzulieferer betreibt eine Fertigungsstraße mit SPS-Steuerungen und
Kamera-Qualitätsprüfung. Die Bildverarbeitung muss der Maschine in **unter
10 ms** antworten, sonst läuft schlechte Ware weiter. Zusätzlich gilt: die
Rohdaten **dürfen das Werksgelände nicht verlassen**, und die Produktion muss
auch dann weiterlaufen, wenn die WAN-Leitung ausfällt. Das Team will trotzdem
**dieselben AWS-APIs** nutzen wie in der Region.

## Ablauf

1. **Maschine → lokales Compute:** SPS und Kameras sprechen direkt **EC2 auf
   Outposts** an — ein AWS-eigenes Rack, das **physisch in der Fabrikhalle**
   steht und von AWS betrieben wird. Der Weg ist wenige Meter statt hunderte
   Kilometer, damit sind **< 10 ms** überhaupt erst möglich.
2. **Local Gateway:** Der Traffic zwischen Maschinen und Outpost läuft über das
   **Local Gateway** im Werksnetz — **ohne Umweg über die Region**. Das ist der
   Unterschied zu „VPN in die Cloud".
3. **Lokale Speicherung:** Rohdaten liegen auf **EBS / S3 on Outposts** im Werk.
   Damit ist die **Data-Residency**-Anforderung erfüllt; nur Aggregate gehen
   später in die Region.
4. **Service Link zur Region:** Der Outpost bleibt an eine **Parent Region**
   angebunden — für Control Plane, Verwaltung, Backup und Analytics. Fällt die
   Leitung aus, laufen die **lokalen Workloads weiter**; nur Management- und
   Sync-Funktionen pausieren.

## Prüfungs-Kernsatz

**Outposts = AWS-Hardware im eigenen Gebäude (Latenz zu lokalen Systemen und
Data Residency); Local Zones = AWS-Standort in der Metro-Region, nah bei
Endnutzern — nicht bei dir im Werk.**

## Klassiker-Fallen

- **Outposts vs. Local Zones:** Die Local Zone steht in der **Großstadt-Region**
  und ist die richtige Antwort, wenn **Endnutzer / Gamer / Streaming-Clients** in
  einem Metro-Gebiet niedrige Latenz brauchen. Sobald der Text „**im eigenen
  Werk / Rechenzentrum**", „Daten dürfen das Gelände nicht verlassen" oder
  „Maschinensteuerung" sagt, ist **Outposts** gemeint.
- **Direct Connect löst das nicht:** DX macht die Leitung **stabil und privat**,
  aber die **Entfernung zur Region bleibt**. Gegen Lichtgeschwindigkeit hilft
  nur, das Compute physisch näher zu stellen.
- **Wavelength ≠ Outposts:** Wavelength bringt Compute in das **5G-Netz des
  Providers** — Ziel sind mobile Endgeräte, nicht die Fabrikhalle.
- **CloudFront hilft hier nicht:** Ein CDN cacht **Inhalte für Leser**; eine
  Echtzeit-Regelschleife zur Maschine lässt sich nicht cachen.
- **Outpost ist nicht autark gedacht:** Er **braucht** die Parent Region als
  Anker. Lokale Workloads überleben einen WAN-Ausfall, aber „läuft für immer
  ohne AWS-Region" ist falsch.
