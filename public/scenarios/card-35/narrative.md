---
cardNumber: 35
slug: global-accelerator-cloudfront-kartenwerk-udp-anycast-backbone
title: "Global Accelerator vs CloudFront — der Weg gegen den Inhalt"
services:
  - AWS Global Accelerator
  - Amazon CloudFront
  - Amazon Route 53
  - Amazon S3
  - Amazon EC2
domains:
  - D2
  - D3
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/global-accelerator/latest/dg/introduction-how-it-works.html"
  - "https://docs.aws.amazon.com/global-accelerator/latest/dg/about-endpoints-endpoint-weights.unhealthy-endpoints.html"
  - "https://docs.aws.amazon.com/global-accelerator/latest/api/API_CreateEndpointGroup.html"
  - "https://aws.amazon.com/global-accelerator/pricing"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/amazon-cloudfront-anycast-static-ips"
  - "https://aws.amazon.com/about-aws/whats-new/2025/04/amazon-cloudfront-anycast-static-ips-apex-domains"
  - "https://aws.amazon.com/about-aws/whats-new/2026/03/cloudfront-byoip-ipv6-vpc-ipam"
---

## Die Grundidee zuerst

Zwei Wege, ein Paket von Frankfurt nach Osaka zu bringen.

**Weg eins:** Du gibst es bei irgendeinem Zusteller ab. Der reicht es an einen Partner weiter, der an einen nächsten, und irgendwann kommt es an. Meistens in vier Tagen, manchmal in elf, gelegentlich gar nicht. Niemand ist zuständig, weil alle nur ein Stück tragen. Das ist das öffentliche Internet.

**Weg zwei:** Du bringst es zwei Straßen weiter zu einem Firmenlager. Ab dort läuft es auf der werkseigenen Bahnlinie — eine Strecke, ein Betreiber, ein Fahrplan. Das öffentliche Chaos schrumpft auf die zwei Straßen bis zum Lager.

Global Accelerator ist die Bahnlinie. Es macht dein Paket nicht kleiner und es legt keine Kopie in Osaka bereit — **es verkürzt nur die Strecke, auf der etwas schiefgehen kann.**

Und jetzt der Kontrast, an dem die ganze Karte hängt: CloudFront macht etwas völlig anderes. Es legt eine **Kopie** in Osaka bereit. Wer die Kopie will, bekommt sie sofort und ohne Reise. Wer aber eine Antwort will, die es nur in Frankfurt gibt, hat davon nichts.

Beschleunigter Weg oder vorhandene Kopie. Das ist die Achse.

## Was es eigentlich ist — der Accelerator

Kein Server, kein Cache, kein Proxy mit Logik. Ein Accelerator ist ein Paar statischer Adressen plus eine Zuordnung, wohin sie zeigen:

```json
{
  "AcceleratorArn": "arn:aws:globalaccelerator::1234:accelerator/ab12",
  "IpAddressType": "IPV4",
  "IpSets": [{ "IpAddresses": ["75.2.0.1", "99.83.0.1"] }],
  "Listeners": [{
    "Protocol": "UDP",
    "PortRanges": [{ "FromPort": 30000, "ToPort": 30010 }],
    "ClientAffinity": "SOURCE_IP",
    "EndpointGroups": [
      { "Region": "eu-central-1", "TrafficDialPercentage": 100,
        "HealthCheckIntervalSeconds": 10, "ThresholdCount": 3 },
      { "Region": "ap-northeast-1", "TrafficDialPercentage": 100 }
    ]
  }]
}
```

Lies es von oben nach unten: zwei feste Adressen, ein Listener auf **UDP**, zwei Regionen als Endpoint Groups, ein Traffic Dial je Gruppe, ein Health-Check-Intervall.

Auffällig ist, was fehlt. Kein Cache-Verhalten, kein TTL, keine Header-Regel, kein Ursprungspfad. **Global Accelerator sieht deine Nutzdaten nicht an.** Es arbeitet auf Layer 4 — Adresse und Port, sonst nichts. Genau deshalb trägt es UDP, und genau deshalb kann es nichts cachen.

## Der Weg durch die Karte

### Der Kasten links — Kartenwerk Interactive und drei Anforderungen

`weltweit, mobil`, `UDP + HTTP`, `Asien: 180 ms`. Ein Multiplayer-Spiel mit Game-Servern in `eu-central-1` und `ap-northeast-1`. Die Zustandssynchronisierung läuft über UDP. Drei Anforderungen liegen auf dem Tisch, und jede einzelne schließt Optionen aus.

Erstens: 180 ms Latenz mit starkem Jitter in Asien. Zweitens: Ein Telko-Partner muss die Eintritts-IPs einmal und dauerhaft freischalten. Drittens: Beim Regionsausfall muss die Umleitung in Sekunden greifen, nicht nach Ablauf einer DNS-TTL.

Daneben liefert dasselbe Spiel **40 TB Patch- und Texturdownloads pro Monat** — reines HTTP, hoch cachebar. Das ist bewusst eingebaut: Auf dieser Karte gewinnt nicht ein Dienst, sondern jeder Dienst gewinnt seinen Teil.

### Badge 1 und der GA-Kasten — zwei Adressen, die bleiben

`2 statische Anycast-IPs`, `Layer 4, TCP und UDP`. Global Accelerator vergibt beim Anlegen zwei statische IPv4-Adressen, die über die gesamte Lebensdauer des Accelerators unverändert bleiben.

Anycast heißt: Dieselbe Adresse wird von vielen AWS-Edge-Standorten gleichzeitig angekündigt. Ein Spieler in Osaka und einer in Hamburg tippen dieselbe IP an und landen an zwei verschiedenen Orten — beim jeweils nächsten.

Das Bild dazu: eine Notrufnummer. Überall dieselben drei Ziffern, überall eine andere Leitstelle.

Für den Telko-Partner ist damit Anforderung zwei erledigt. Er trägt zwei Adressen ein und zieht nie wieder nach.

### Badge 2 — ab dem Edge das AWS-Backbone

Der Pfeil nach `eu-central-1` ist der eigentliche Gewinn der Karte, und er ist leicht zu unterschätzen, weil er so unspektakulär aussieht.

Ohne Accelerator reist ein Paket aus Osaka über ein Dutzend fremder Netze. Jeder Übergang ist eine Stelle, an der gepuffert, verworfen oder umgeleitet werden kann. Jitter ist nichts anderes als die Summe dieser Unregelmäßigkeiten.

Mit Accelerator schrumpft die öffentliche Strecke auf das Stück zwischen Spieler und nächstem Edge — oft wenige Millisekunden. Der Rest läuft über eine Infrastruktur mit einem einzigen Betreiber.

**Nicht der Inhalt wird beschleunigt, sondern der Weg.** Deshalb hilft es bei UDP-Spielverkehr, den niemand cachen kann.

### Badge 3 und der Failover-Pfeil — Health Checks statt Fehlerantworten

`ap-northeast-1`, gestrichelt, mit der Beschriftung `Failover in Sekunden`. Global Accelerator prüft die Endpunkte aktiv: Intervall wahlweise 10 oder 30 Sekunden, per Default 30, und der Zustand kippt nach einer konfigurierbaren Zahl aufeinanderfolgender Prüfungen — Default drei.

Rechne die Defaults nach: 3 × 30 s ergibt bis zu 90 Sekunden bis zur Erkennung. Mit 10 s Intervall sind es unter 30. Die Kartenzeile „in Sekunden" ist als Kontrast zur DNS-TTL richtig, sie ist keine Garantie.

Der Unterschied zur DNS-Welt ist trotzdem grundsätzlich: Die Umschaltung passiert **hinter** einer Adresse, die sich nie ändert. Kein Client muss neu auflösen, kein Resolver muss einen Cache verwerfen, kein Mobilgerät muss mitspielen.

Über **Traffic Dials** lässt sich zusätzlich der Anteil je Endpoint Group prozentual steuern — brauchbar für Blue/Green und kontrollierte Regionswechsel.

### Die zwei grünen Kästen — Game-Server EC2, zweimal dasselbe

`eu-central-1` und `ap-northeast-1`, beide mit `Game-Server EC2`. Zwei Kästen, identisch beschriftet, und das ist kein Platzhalter — es ist die Aussage.

Global Accelerator ist kein Ersatz für eine zweite Region. Es setzt sie voraus. Ohne Endpunkt in Asien beschleunigt der Dienst zwar den Weg dorthin, wo dein Server steht, aber er verkürzt keine physikalische Distanz. Licht braucht von Osaka nach Frankfurt seine Zeit, ganz gleich, wessen Glasfaser es durchläuft.

Was Global Accelerator ändert, ist der **Aufschlag über der physikalischen Untergrenze** — Umwege, Warteschlangen, Neuübertragungen. Bei 180 ms aus Asien steckt die Mehrzahl in diesem Aufschlag, und der schmilzt. Der Rest schmilzt erst, wenn ein Server näher steht.

Als Endpunkte kommen bei Standard-Accelerators Network Load Balancer, Application Load Balancer, EC2-Instanzen und Elastic IPs in Frage. Der Accelerator zeigt also auf eine regionale Struktur, die du ohnehin baust.

### Badge 4, das obere X und der CloudFront-Kasten

`Patch-Downloads, HTTP` führt zum CloudFront-Kasten, `Layer 7, HTTP/S`, `cached am Edge`. Daneben ein rotes X mit `kein UDP`.

Das X sagt: Dieser Weg trägt den Spielverkehr nicht. CloudFront spricht HTTP und HTTPS, sonst nichts. Ein UDP-Datagramm hat dort keine Form, in der es transportiert werden könnte.

Umgekehrt gilt aber genauso: Die 40 TB Patches über Global Accelerator zu schicken, wäre technisch möglich und wirtschaftlich unsinnig. Jedes Byte würde einzeln durchs Backbone getragen und DT-Premium erzeugen — bei Daten, die für alle Spieler identisch sind.

### Badge 5 und der S3-Kasten — 40 TB, die den Ursprung nicht sehen

`S3 Origin`, `40 TB Patches`, `kaum Origin-Last`. Das ist die Cache-Wirkung: Ein Patch wird einmal je Edge-Standort geholt und danach lokal ausgeliefert.

Dazu kommt alles, was es nur auf Layer 7 gibt und was auf der Karte bewusst fehlt: WAF, Signed URLs, CloudFront Functions, Lambda@Edge. Wenn eine Frage nach Zugriffsschutz auf Dateiebene oder nach Request-Manipulation klingt, ist sie eine CloudFront-Frage, ganz gleich wie schnell irgendetwas sein soll.

### Das untere X und der Route-53-Kasten — die Falle mit Ansage

`Route 53 Latency`, `nur DNS-Auflösung`, `Pakete via Internet`, dazu das X mit `löst Jitter nicht`.

Latency-based Routing steuert ausschließlich, **welche IP der Resolver zurückgibt**. Danach reisen die Pakete exakt wie vorher. Jitter und Paketverlust bleiben unverändert, weil sich am Weg nichts geändert hat.

Das Bild dazu: Ein Auskunftsschalter nennt dir die schnellste Autobahn. Er baut sie nicht.

### Badge 6 und die Kostenbox

`$18 im Monat fix`, `+ DT-Premium $0,007–0,105/GB`, `nur in der dominanten Richtung`, `AWS-Beispiel: 10 TB → $128`.

$0,025 pro Stunde für jeden provisionierten Accelerator, ob aktiviert oder nicht — rund $18 im Monat. Dazu die Data-Transfer-Premium, deren Satz vom Paar aus Quellregion und Ziel-Edge abhängt.

Der übersehene Teil steht in der dritten Zeile: Abgerechnet wird stündlich **nur die dominante Richtung**. AWS' eigenes Beispiel: 10 TB Gesamtverkehr, davon 60 Prozent ausgehend → berechnet werden 6 TB → $110 plus $18 fix = **$128 im Monat**. Standardgebühren für öffentliche IPv4-Adressen kommen obendrauf, ebenso die normalen EC2-Egress-Kosten.

### Die Merksätze-Fußzeile

`GA beschleunigt den Weg, CloudFront den Inhalt · nur GA kann UDP · statische IPs gibt es inzwischen bei beiden`.

Der dritte Satz ist der jüngste und der wichtigste, weil er ein Kriterium zurücknimmt, das in älterem Kursmaterial noch als sicheres Erkennungszeichen gilt. Wer ihn nicht kennt, wählt bei jeder Frage mit „static IP" reflexhaft Global Accelerator — und liegt inzwischen manchmal daneben.

## Die entscheidende Unterscheidung

| | **Global Accelerator** | **CloudFront** |
|---|---|---|
| Schicht | Layer 4 | Layer 7 |
| Protokolle | TCP **und UDP** | nur HTTP/S |
| Cache | keiner | Kern der Funktion |
| Was besser wird | der Weg | die Nähe des Inhalts |
| Failover | aktive Health Checks | Origin Failover auf HTTP-Fehler |
| Statische IPs | 2 je Accelerator | 3 oder 21, kostenpflichtig |
| Fixkosten | ~$18/Monat je Accelerator | keine Grundgebühr |

Die belastbare Frage lautet nicht „brauche ich statische IPs", sondern: **Ist es HTTP? Ist es cachebar?** Zweimal nein → Global Accelerator.

## Die ehrliche Feinheit

Zwei Dinge, die auf keiner Karte stehen und in echten Ausfällen wehtun.

**Erstens: Bestehende Verbindungen werden beim Failover nicht umgezogen.** Der Developer Guide sagt es klar — etablierte Verbindungen laufen weiter zum bisherigen Endpunkt, auch wenn er als unhealthy markiert oder aus dem Accelerator entfernt wurde, bis der Client oder der Server die Verbindung zurücksetzt oder das Idle-Timeout greift. Für UDP sind das 30 Sekunden.

Für ein Spiel heißt das: Neue Spieler landen sofort in Tokio, laufende Sitzungen hängen noch an Frankfurt. „Failover in Sekunden" beschreibt die Umleitung neuer Verbindungen, nicht das Ende aller Verbindungen zur alten Region.

**Zweitens: Global Accelerator kann „fail open".** Findet es nach den drei nächstgelegenen Endpoint Groups keinen gesunden Endpunkt mit einem Gewicht über null, routet es auf einen zufälligen Endpunkt in der nächstgelegenen Gruppe — auch auf einen ungesunden. Die Begründung ist vertretbar: Ein Versuch, der scheitern kann, ist besser als gar keine Antwort. Aber wer erwartet, dass ein unhealthy Endpunkt garantiert keinen Verkehr sieht, liegt falsch.

**Drittens: `ClientAffinity` ist bei zustandsbehafteten Anwendungen kein Detail.** Steht sie auf dem Default `NONE`, verteilt der Accelerator Verbindungen anhand von Quell- und Zieladresse samt Ports — derselbe Spieler kann bei einer neuen Verbindung auf einer anderen Instanz landen. Mit `SOURCE_IP` zählt nur die Quelladresse, und alle Verbindungen eines Spielers bleiben beisammen. Für ein Spiel mit Sitzungszustand ist das der Unterschied zwischen „läuft" und „Spieler verliert beim Reconnect seinen Match".

Vierte Feinheit, die Prüfungsvorbereitung angeht: Die Randwerte der DT-Premium-Spanne auf der Karte sind nicht primärquellenbelegt. Die Preistabelle ist JS-gerendert; abrufbar sind einzelne Werte und das Rechenbeispiel. **Verlass dich auf die Mechanik — Fixgebühr plus dominante Richtung —, nicht auf die Randzahlen.**

## Syntax lesen — woran du das Protokoll im Fragetext erkennst

Prüfungsfragen nennen den Dienst nie. Sie nennen das Protokoll, und zwar verkleidet:

```text
"UDP traffic"                        -> nur Global Accelerator
"non-HTTP protocol"                  -> nur Global Accelerator
"MQTT" / "gaming" / "VoIP" / "SIP"   -> Layer 4, also Global Accelerator
"static IP addresses"                -> allein nicht mehr entscheidend
"cache hit ratio"                    -> CloudFront
"cacheable content"                  -> CloudFront
"signed URLs" / "WAF at the edge"    -> CloudFront
"failover within seconds"            -> Global Accelerator
"before users are affected"          -> Global Accelerator
```

Die dritte Zeile von unten ist die wichtigste Umwertung der letzten Jahre: „statische IP" war einmal ein sicheres Erkennungszeichen. Heute ist es nur noch ein Hinweis, dass irgendetwas allowlisted werden soll.

## Was du dadurch nicht baust

Mit Global Accelerator entsteht ausdrücklich **nicht**:

- kein Cache — jedes Byte reist bis zum Endpunkt
- keine Inhaltsverarbeitung, keine Header-Manipulation, keine Kompression
- kein WAF, keine Signed URLs, keine Edge-Funktionen
- keine Verschlüsselung, die es vorher nicht gab; GA terminiert nichts
- keine garantierte Latenzzahl — nur ein kürzerer öffentlicher Abschnitt
- kein Umzug bestehender Verbindungen im Failover
- keine Ersparnis; der Dienst ist ein Aufpreis auf den Datentransfer

Übrig bleiben zwei Adressen, ein kürzerer unzuverlässiger Streckenabschnitt und ein Failover, der nicht auf einen Fehler wartet.

## Wenn du dir eine Sache merkst

**Global Accelerator beschleunigt den Weg, CloudFront den Inhalt. Die Entscheidung fällt am Protokoll und an der Cachebarkeit — nicht an der statischen IP.**

Route 53 Latency-Routing wählt nur eine Adresse aus und fasst die Pakete nie an. Ein Network Load Balancer ist regional und kennt keine Edge-Standorte. Und eine zweite Region ohne Steuerung davor ist keine Failover-Lösung, sondern nur zusätzliche Kapazität.

## Prüfungsknackpunkte

**Signalwörter für Global Accelerator:** „UDP traffic" · „non-HTTP protocol" · „static IP addresses for firewall allowlisting" · „reduce jitter and packet loss" · „failover within seconds".

**Signalwörter für CloudFront:** „cacheable content" · „cache hit ratio" · „reduce origin load" · „signed URLs" · „WAF".

**Warum „statische IPs → Global Accelerator" nicht mehr trägt:** CloudFront hat seit dem **20.11.2024** Anycast Static IPs. Seit dem **16.04.2025** gibt es sie auch für Apex-Domains, wo **drei** Adressen die vorherigen 21 ersetzen und ein A-Record ohne CNAME-Umweg möglich wird. Seit dem **05.11.2025** kommen IPv6-Adressen dazu, seit dem **31.03.2026** lässt sich per BYOIP über VPC IPAM auch eigener IPv6-Raum einbringen — eigener IPv4-Raum ging bereits seit dem **24.11.2025**. Ausgenommen sind die AWS-China-Regionen, und es kostet extra. Wer die Frage weiterhin allein an „statische IP" aufhängt, benutzt ein Kriterium, das nicht mehr trennscharf ist.

**Warum „Route 53 Latency-Routing" verliert:** Es steuert die Namensauflösung, nicht den Paketweg. Verkehr fließt nie *durch* Route 53. Dazu kommt: DNS-Failover hängt an TTLs und an Clients, die Antworten zwischenspeichern — auf Mobilgeräten notorisch unzuverlässig.

**Warum „CloudFront Origin Failover" bei „within seconds" verliert:** Es reagiert auf **HTTP-Fehlercodes**, braucht also erst eine fehlgeschlagene Anfrage. Global Accelerator schaltet um, bevor eine Anfrage scheitert. Steht in der Frage „before users are affected", ist das ein GA-Signal — selbst wenn der Verkehr HTTP ist.

**Warum „CloudFront für dynamische Inhalte" nicht automatisch falsch ist:** Auch nicht-cachebare Anfragen laufen bei CloudFront ab dem Edge über das AWS-Backbone. Der Unterschied bleibt das Protokoll: Sobald etwas kein HTTP ist, ist CloudFront draußen — unabhängig davon, wie dynamisch es ist.
