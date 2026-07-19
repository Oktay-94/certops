---
nr: 35
title: "Global Accelerator vs CloudFront — der Weg gegen den Inhalt"
services:
  - AWS Global Accelerator
  - Amazon CloudFront
  - Amazon Route 53
  - Amazon S3
signalwords:
  - non-HTTP protocol
  - UDP traffic
  - static IP addresses for firewall allowlisting
  - failover within seconds
  - reduce jitter and packet loss
  - cacheable content and cache hit ratio
domains: [D2, D3]
assets:
  png: battle_card_35.png
  pdf: battle_card_35.pdf
  svg: battle_card_35.svg
status_note: >
  QC 0 Befunde, Render-Sanity bestanden (eine Freizone zunächst als Befund
  gemeldet — Ursache war die zu weit gefasste Zonendefinition, nicht die
  Karte). SICHTPRÜFUNG NICHT MÖGLICH.
---

# Karte 35 — Global Accelerator vs CloudFront

**Szenario.** Kartenwerk Interactive GmbH betreibt ein mobiles
Multiplayer-Spiel mit Game-Servern auf EC2 in `eu-central-1` und
`ap-northeast-1`. Die Zustandssynchronisierung läuft über **UDP**. Drei
Anforderungen liegen auf dem Tisch: Spieler in Asien sehen 180 ms Latenz mit
starkem Jitter. Ein Telko-Partner muss die Eintritts-IPs **einmal und dauerhaft
in seiner Firewall freischalten**. Und beim Ausfall einer Region muss die
Umleitung **in Sekunden** greifen, nicht nach Ablauf einer DNS-TTL. Daneben
liefert dasselbe Spiel **40 TB Patch- und Texturdownloads pro Monat** — reines
HTTP und hoch cachebar.

## Ablauf

**1 — Die Spieler treffen zwei feste Anycast-IPs.** Global Accelerator vergibt
zwei statische IPv4-Adressen, die über die gesamte Lebensdauer des Accelerators
unverändert bleiben. Der Telko-Partner trägt sie einmal in seine Firewall ein
und muss nie wieder nachziehen. Anycast sorgt dafür, dass dieselbe Adresse
weltweit am jeweils nächstgelegenen AWS-Edge landet.

**2 — Ab dem Edge läuft der Verkehr über das AWS-Backbone.** Das ist der
eigentliche Gewinn: nicht der Inhalt wird beschleunigt, sondern der Weg. Die
lange, unzuverlässige Strecke über das öffentliche Internet schrumpft auf das
Stück zwischen Spieler und nächstem Edge. Jitter und Paketverlust sinken genau
dort, wo sie entstehen. Global Accelerator arbeitet auf **Layer 4** und trägt
deshalb TCP **und UDP** — es inspiziert keine Header, cacht nichts und
transformiert nichts.

**3 — Failover über aktive Health Checks.** Global Accelerator prüft die
Endpunkte laufend und schaltet bei Ausfall typischerweise **in unter 30
Sekunden** um, ohne dass ein Client eine neue DNS-Auflösung braucht. Über
Traffic Dials lässt sich der Anteil je Endpoint-Gruppe prozentual steuern —
brauchbar für Blue/Green und für kontrollierte Regionswechsel.

**4 — Die Patch-Downloads gehen nicht über den Accelerator.** Sie sind HTTP und
zu einem sehr großen Teil identisch für alle Spieler. Über Global Accelerator
liefen sie zwar, würden aber jedes Byte einzeln durch das Backbone tragen und
DT-Premium erzeugen.

**5 — CloudFront cached am Edge.** 40 TB verlassen den Ursprung nicht mehr,
sondern werden aus den Edge-Standorten bedient. Dazu kommen die Dinge, die es
nur auf Layer 7 gibt: WAF, Signed URLs, CloudFront Functions und Lambda@Edge.

**6 — Was Global Accelerator kostet.** $0,025 pro Stunde, also rund **$18 im
Monat fix** je Accelerator — unabhängig davon, ob er aktiviert ist. Dazu die
DT-Premium von **$0,007 bis $0,105 pro GB**, abhängig vom Paar aus Quellregion
und Ziel-Edge. Der oft übersehene Teil: berechnet wird **nur die dominante
Richtung**. AWS' eigenes Beispiel: 10 TB Gesamtverkehr, davon 60 % ausgehend →
abgerechnet werden 6 TB → $110 DT-Premium plus $18 fix = **$128 im Monat**.
Standardgebühren für öffentliche IPv4-Adressen kommen obendrauf.

## Prüfungs-Kernsatz

**Global Accelerator beschleunigt den Weg, CloudFront den Inhalt. Die
Entscheidung fällt am Protokoll und an der Cachebarkeit — nicht an der
statischen IP.**

## Klassiker-Fallen

**1 — „Statische IPs brauchst du → Global Accelerator." Seit November 2024
nicht mehr exklusiv.** CloudFront hat **Anycast Static IPs** bekommen: seit
**April 2025** auch für Apex-Domains, wo drei Adressen die vorherigen 21
ersetzen und ein A-Record ohne CNAME-Umweg möglich wird; seit **November 2025**
mit IPv6; seit **März 2026** mit BYOIP für IPv6 über VPC IPAM. Ausgenommen sind
die AWS-China-Regionen, und es kostet extra. Wer die Frage weiterhin allein an
„statische IP" aufhängt, benutzt ein Kriterium, das nicht mehr trennscharf ist.
Die belastbare Achse ist: **Ist es HTTP? Ist es cachebar?** Zweimal nein →
Global Accelerator.

**2 — Route 53 Latency-Routing ist kein Ersatz.** Das ist die Falle, die auf
Prüfungsniveau am häufigsten zuschlägt. Latency-based Routing steuert
ausschließlich, **welche IP der Resolver zurückgibt**. Danach laufen die Pakete
genau wie vorher über das öffentliche Internet — Jitter und Paketverlust bleiben
unverändert. Dazu kommt: DNS-Failover hängt an TTLs und an Clients, die
Antworten zwischenspeichern, was auf Mobilgeräten notorisch unzuverlässig ist.
DNS ist kein Durchgangs-Gateway; Verkehr fließt nie *durch* Route 53.

**3 — Die Failover-Mechanik ist bei beiden Diensten grundverschieden.** Global
Accelerator prüft aktiv per Health Check und schaltet um, **bevor** eine
Anfrage scheitert. CloudFront-Origin-Failover reagiert auf **HTTP-Fehlercodes**
— es braucht also erst eine fehlgeschlagene Anfrage. Steht in der Frage „within
seconds" oder „before users are affected", ist das ein Signal für Global
Accelerator, selbst wenn der Verkehr HTTP ist.

## Abgrenzung zu Karte 37

Karte 35 legt die Entscheidungsachse fest: **Protokoll und Cachebarkeit.**
Karte 37 kann darauf aufbauen und die Frageformen durchspielen, ohne die
Unterscheidung neu herzuleiten. Wichtigster gemeinsamer Satz: **CloudFront
cached, Global Accelerator nicht.**

## Bewusste Vereinfachungen im Diagramm

- Zwei Regionen stehen für beliebig viele Endpoint-Gruppen.
- Die zwei Anycast-Adressen sind als Textzeile im Kasten benannt, nicht als
  zwei Objekte gezeichnet.
- Die CloudFront-Edge-Standorte sind nicht dargestellt; der Cache steckt in der
  Zeile „cached am Edge".
- WAF, Signed URLs, CloudFront Functions und Lambda@Edge sind weggelassen — sie
  gehören zur Layer-7-Argumentation, nicht zur Kernunterscheidung.
- Die gestrichelte Linie zu `ap-northeast-1` markiert den Failover-Pfad. In
  einer echten Aktiv-Aktiv-Aufstellung wären beide Pfade durchgezogen.

## Farben

Keine neue Kategorie. Blau = Spieler (User/Consumer) · Navy = Global
Accelerator als Infrastruktur-Eintrittspunkt, konsistent mit Transit Gateway
auf 31/32, NLB auf 33 und NAT Gateway auf 34 · **Orange = CloudFront** nach
bestehender Palettenregel · **Lila = Route 53** nach bestehender Palettenregel ·
Grün = Game-Server und S3 als Ziel · Rot = verworfen · Gold = Kosten.
