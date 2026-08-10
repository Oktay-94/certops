---
cardNumber: 33
slug: privatelink-endpoint-service-telemetrik24-saas-multi-tenant
title: "AWS PrivateLink — einen Dienst privat und einseitig in Kunden-VPCs anbieten"
services: ["AWS PrivateLink", "Amazon VPC", "Elastic Load Balancing (Network Load Balancer)", "VPC Endpoint Service"]
domains: ["D1", "D3"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html"
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/configure-endpoint-service.html"
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/aws-services-cross-region-privatelink-support.html"
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-access-aws-services.html"
  - "https://aws.amazon.com/privatelink/pricing/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/10/aws-udp-privatelink-dual-stack-network-load-balancers/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/aws-privatelink-across-region-connectivity"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/aws-privatelink-cross-region-connectivity-aws-services"
  - "https://aws.amazon.com/about-aws/whats-new/2022/04/aws-data-transfer-price-reduction-privatelink-transit-gateway-client-vpn-services"
  - "https://aws.amazon.com/blogs/networking-and-content-delivery/aws-privatelink-extends-cross-region-connectivity-to-aws-services/"
---

## Die Grundidee zuerst

Stell dir vor, du belieferst 40 Firmen mit Waren.

**So machst du es heute:** Du hast ein Werkstor mit einem Pförtner und einer Liste von Kennzeichen. Jede Firma schickt ihre Transporter, der Pförtner gleicht das Kennzeichen ab und öffnet. Das funktioniert — bis die erste Firma ihren Fuhrpark austauscht. Dann ruft jemand an, du trägst neue Kennzeichen ein, und beim nächsten Wechsel wieder. Bei 40 Firmen ist die Liste ein Vollzeitjob. Außerdem fahren alle Transporter über öffentliche Straßen zu dir, und zwei deiner Kunden sitzen in Gebäuden, deren Hausnummer identisch mit deiner ist — die Post kommt regelmäßig durcheinander.

**So könntest du es machen:** Du baust in die Wand jedes Kundengebäudes eine **Durchreiche**. Der Kunde öffnet sie von seiner Seite, greift hinein, und die Ware ist da. Keine Straße, keine Adresse, kein Kennzeichen. Was du stattdessen führst, ist eine Liste von **Firmen**, die eine Durchreiche bekommen — und Firmen wechseln ihren Namen seltener als ihre Transporter.

Drei Dinge fallen dabei automatisch weg. Die Hausnummer ist egal, weil niemand mehr anfährt. Die Kunden sehen sich gegenseitig nicht, weil jede Durchreiche nur zwei Seiten hat. Und **du kommst nicht hindurch**: Eine Durchreiche ist ein Fach in der Wand, kein Gang. Von deiner Seite aus ins Kundengebäude zu greifen, ist baulich nicht vorgesehen.

Das ist AWS PrivateLink. Die Durchreiche ist ein Interface Endpoint, und sie steht **im Netz des Kunden**, nicht in deinem.

## Was es eigentlich ist — der Endpoint Service

Auf der Anbieterseite gibt es genau ein Objekt, und in ihm steht die gesamte Zugriffskontrolle:

```json
{
  "ServiceName": "com.amazonaws.vpce.eu-central-1.vpce-svc-0a1b2c3d4e5f6",
  "NetworkLoadBalancerArns": [
    "arn:aws:elasticloadbalancing:eu-central-1:999988887777:loadbalancer/net/telemetrie-nlb/ab12cd34"
  ],
  "AcceptanceRequired": true,
  "AllowedPrincipals": [
    "arn:aws:iam::111122223333:root",
    "arn:aws:iam::444455556666:root"
  ],
  "PrivateDnsName": "telemetrie.telemetrik24.de"
}
```

Lies es von oben nach unten, es ist die ganze Lösung. `ServiceName` ist der Name, den du deinen Kunden gibst — mehr brauchen sie nicht. `NetworkLoadBalancerArns` sagt, wohin die Anfragen laufen. `AcceptanceRequired` entscheidet, ob du jede Verbindung von Hand bestätigst oder durchwinkst. `AllowedPrincipals` ist die Kennzeichenliste, die keine mehr ist: 40 Account-ARNs statt 40 wechselnder NAT-IP-Bereiche.

Auf der Kundenseite steht dem ein einziger Aufruf gegenüber:

```
aws ec2 create-vpc-endpoint \
  --vpc-endpoint-type Interface \
  --vpc-id vpc-0kunde \
  --service-name com.amazonaws.vpce.eu-central-1.vpce-svc-0a1b2c3d4e5f6 \
  --subnet-ids subnet-0a subnet-0b subnet-0c
```

**Keine Route, kein Gateway, kein Peering, keine CIDR-Absprache.** Was danach existiert, sind ENIs in den genannten Subnetzen des Kunden — und deren IP-Adressen stammen aus **seinen** Subnetzen.

## Der Weg durch die Karte

### Kunde A links oben — die Rollenverteilung steht in der Box

`VPC 172.16.0.0/16`, `eigener Account`. Die Prüfung hängt fast immer an genau dieser Zeile: Wer ist **Consumer**, wer ist **Provider**? Telemetrik24 ist der Provider und stellt den Endpoint Service bereit. Kunde A ist der Consumer und legt den Endpoint an. Wer die Rollen vertauscht, wählt in der Prüfung zuverlässig die falsche Antwort — etwa „der Anbieter erstellt Interface Endpoints in den Kunden-VPCs". Das kann er gar nicht; er hat dort keine Rechte.

### Badge 1 und der Interface Endpoint — dieselbe ENI wie auf Karte 20

`ENI, private IP`, `im Kunden-Subnetz`. Der Baustein ist identisch mit dem, den Karte 20 für den Zugriff auf S3 von on-premises einsetzt: eine Elastic Network Interface mit einer privaten Adresse aus einem Subnetz deiner eigenen VPC. **Was sich ändert, ist nur, was auf der anderen Seite hängt** — dort ein AWS-Dienst, hier der Endpoint Service einer fremden Firma. Aus Sicht der Kundenanwendung ist beides derselbe Vorgang: eine private IP im eigenen Netz ansprechen.

Auf der Karte ist der Endpoint als **eine** ENI gezeichnet. Real entsteht pro konfiguriertem Subnetz eine eigene ENI, üblicherweise in mehreren AZs.

### Der rote Pfeil oben — `Provider kann nicht zurück`

Das ist die Aussage, die PrivateLink von allem anderen auf diesen drei Karten trennt. Der Verkehr fließt **nur** in eine Richtung der Initiierung: Der Consumer baut die Verbindung auf, der Provider antwortet. Telemetrik24 kann über PrivateLink **nicht** in die Kunden-VPC hineingreifen — auch dann nicht, wenn es wollte.

Vertraglich war das eine Zusage. Architektonisch ist es eine Eigenschaft, die du nicht versehentlich verlierst. Das ist ein Unterschied, den Auditoren mögen.

### Badge 2 — `über PrivateLink` zum NLB

Der Endpoint verbindet sich mit dem Endpoint Service, der auf einen Network Load Balancer zeigt. Der Verkehr bleibt vollständig im AWS-Netz: kein Internet Gateway, kein NAT Gateway, keine öffentliche IP. Genau das ist die Anforderung der regulierten Kunden — die Telemetriedaten verlassen AWS nie.

### Der gestrichelte Provider-Container — `10.0.0.0/16`

Der Rahmen um NLB, Service und Endpoint Service ist eine logische Gruppierung, keine Sicherheitszone. Die CIDR im Titel steht dort aus einem einzigen Grund: damit du sie mit der von Kunde B vergleichst.

### Der NLB — `TCP und UDP`

Layer 4, und seit dem **31.10.2024** nicht mehr nur TCP. Die Kartenzeile ist an dieser Stelle verkürzt: UDP über PrivateLink setzt einen **dual-stack NLB** mit UDP-Listener voraus, und die Target Group des Anbieters muss IPv6 nutzen. Wer die Zeile als „PrivateLink kann jetzt einfach auch UDP" liest, unterschlägt die Bedingung. Für die Prüfung reicht: „TCP-only" ist als absolute Aussage falsch geworden.

### Badge 3 — der Service dahinter

`EC2 / ECS`. Ab hier ist es normale Anbieter-Architektur ohne PrivateLink-Besonderheit. Eine Verfügbarkeitsfalle steckt aber davor: Der Endpoint Service ist **pro Availability Zone** verfügbar, und Kunden können Endpoints nur in AZs anlegen, in denen der Anbieter den Dienst bereitstellt. AWS verlangt für Hochverfügbarkeit mindestens zwei AZs auf Anbieterseite.

Cross-Zone Load Balancing schließt die Lücke — mit einem Preis, den AWS ausdrücklich nennt: Es erzeugt beim Anbieter EC2-Datentransferkosten. Und es verschiebt das Risiko, statt es zu beseitigen: Fällt die AZ aus, in der der Endpoint Service gehostet ist, verlieren Kunden den Zugang aus **beiden** Zonen.

### Kunde B und Badge 4 — `gleiche CIDR wie SaaS`

`VPC 10.0.0.0/16` — dieselbe CIDR wie der Anbieter. Für PrivateLink ist das **irrelevant**, und der Grund ist einfacher, als er klingt: Es gibt zwischen den beiden VPCs keine Routen und keine Route-Table-Einträge. Der Kunde spricht mit einer IP aus seinem eigenen Subnetz, alles Weitere ist AWS-interne Zustellung. Es gibt also gar keinen Punkt, an dem zwei identische Adressbereiche gegeneinander aufgelöst werden müssten.

### Der rote X-Stub darunter — `Peering: CIDR kollidiert`

Der durchgestrichene Pfad ist der verworfene Peering-Weg, kein ausgefallener. Peering und Transit Gateway brauchen beide eindeutige Adressbereiche, weil sie Routing betreiben. Genau hier scheitern sie — und genau deshalb ist PrivateLink bei Multi-Tenant-SaaS die Standardantwort. Das ist die direkte Fortsetzung von Karte 31: Dort ging es darum, **Netze** zu verbinden. Hier geht es darum, einen **Dienst** anzubieten.

### Badge 5 und der teale Kasten — Allowed Principals

Der gestrichelte Pfeil vom `VPC Endpoint Service` zum NLB ist eine **Konfigurationsbeziehung, kein Datenfluss**. Am Endpoint Service legt Telemetrik24 fest, welche AWS-Accounts den Dienst überhaupt anfordern dürfen; Verbindungsanfragen werden manuell akzeptiert oder per Auto-Accept durchgewinkt. Statt 40 wechselnder NAT-IP-Bereiche verwaltet der Anbieter 40 stabile Account-IDs.

Soll der Kunde einen eigenen DNS-Namen sehen statt des generierten `vpce-`-Hostnamens, verlangt AWS eine **Domain-Verifikation**: Der Anbieter muss nachweisen, dass ihm die Domain gehört, bevor Consumer den privaten DNS-Namen nutzen können.

### Die Zeile links unten — `und 38 weitere Kunden, je ein Endpoint`

Zwei von 40 sind gezeichnet. Die Aussage dahinter ist der eigentliche Skalierungsvorteil: Ein neuer Kunde bedeutet **null Änderungen** in der Provider-VPC. Kein Subnetz, keine Route, keine Firewall-Regel — nur eine Account-ID mehr in `AllowedPrincipals`.

### Badge 6 — `Kosten trägt der Consumer`

`$0,01 je Endpoint, AZ und Stunde`, bei drei AZs rund `$21,90 pro Monat und VPC`, plus `$0,01/GB` verarbeitete Daten. Die Datenverarbeitungs-Staffel steht primärquellenbelegt auf der AWS-Preisseite: **erste 1 PB $0,01, nächste 4 PB $0,006, darüber $0,004** — jeweils bezogen auf alle Interface Endpoints einer Region und eines Monats. Die Stundentabelle ist JS-gerendert und nicht abrufbar; nimm die $0,01 als Größenordnung, sie gilt laut Drittquellen in den meisten Regionen.

Der Anbieter zahlt seinen NLB. Das ist ein Nebeneffekt mit Vertriebswirkung: Die Netzwerkkosten des Zugriffs wandern zum Kunden. Und eine Kostenfalle fällt weg, die viele noch im Kopf haben — seit dem **01.04.2022** ist inter-AZ-Datentransfer über Interface Endpoints kostenlos.

### Die Fußzeile — drei Sätze, drei Prüfungsfragen

`PrivateLink ist einseitig — nur der Consumer initiiert` beantwortet die Richtungsfrage. `überlappende CIDRs sind egal` beantwortet die Netzwerkfrage. `Allowed Principals statt IP-Allowlist` beantwortet die Zugriffsfrage.

## Die entscheidende Unterscheidung — Netz verbinden oder Dienst anbieten

| | Peering / Transit Gateway | PrivateLink |
|---|---|---|
| Was wird verbunden | ganze Netze | ein einzelner Dienst |
| Richtung | beidseitig | Consumer initiiert, Provider antwortet |
| Routen nötig | ja | **nein** |
| Überlappende CIDRs | unmöglich | egal |
| Zugriffssteuerung | Route Tables, Security Groups | Allowed Principals, Endpoint Policy |
| Neuer Teilnehmer | Route-Änderungen auf beiden Seiten | eine Account-ID mehr |
| Kunden sehen sich | potenziell ja | nein |
| Kosten trägt | beide Seiten anteilig | überwiegend der Consumer |

## Die ehrliche Feinheit

Drei Absolutheiten, die in Kursmaterial noch stehen, sind angreifbar geworden.

**„PrivateLink braucht immer einen Network Load Balancer."** Für den klassischen Endpoint Service stimmt es weiterhin — der Anbieter stellt einen NLB davor, für Appliances einen Gateway Load Balancer. Seit re:Invent 2024 gibt es aber **Resource Endpoints**: Zugriff auf eine konkrete Ressource in einer fremden VPC, etwa eine RDS-Instanz oder ein TCP-Ziel per IP oder Domain, ohne NLB, über die Resource Configurations von VPC Lattice. Die AWS-Preisseite führt Resource Endpoints inzwischen als eigene Kategorie mit eigener Preiszeile. Für SAA-C03 bleibt die NLB-Antwort die erwartete — das Wort „immer" ist es nicht mehr.

**„PrivateLink funktioniert nur innerhalb einer Region."** Gilt seit dem **26.11.2024** für kundeneigene Endpoint Services nicht mehr und seit dem **19.11.2025** auch für AWS-eigene Dienste. Hier ist eine Einschränkung wichtig, die `battle_card_33.md` nicht nennt: Beim Start am 26.11.2024 war Cross-Region nur in sieben Regionen verfügbar — Nord-Virginia, Oregon, Irland, Singapur, São Paulo, Tokio und Sydney. **`eu-central-1`, die Region dieses Szenarios, war nicht dabei.** Wie der Stand heute ist, ließ sich nicht primärquellenbelegt feststellen; die aktuelle Regionsliste steht in der Dokumentation und ändert sich laufend.

Cross-Region hat außerdem harte Kanten: nicht mit einem custom TCP-Idle-Timeout am NLB, nicht mit UDP-Fragmentierung, und nicht in den Availability Zones `use1-az3`, `usw1-az2`, `apne1-az3`, `apne2-az2` und `apne2-az4`. Es gilt zudem **nur für Interface Endpoints** — Gateway, Gateway Load Balancer und Resource Endpoints unterstützen es nicht. AWS empfiehlt weiterhin intra-Region wegen Latenz und Kosten und stellt dem Provider $0,05 pro Stunde je Remote-Region in Rechnung, in der mindestens ein Endpoint hängt.

**Eine Randnotiz, die nicht gehalten hat:** `battle_card_33.md` schreibt, PrivateLink unterstütze keine Network Load Balancer mit mehr als 50 Listenern. Dafür ließ sich keine AWS-Primärquelle finden. Sie steht hier deshalb als unbelegt und nicht als Grenzwert.

## Syntax lesen — welchen Hostnamen der Kunde bekommt

```
Regionaler Endpoint-DNS-Name
  vpce-0abc123-xy4z.vpce-svc-0a1b2c3d4e5f6.eu-central-1.vpce.amazonaws.com
       |          |    |
       |          |    +-- der ServiceName des Anbieters
       |          +------- Kennung dieses einen Endpoints
       +------------------ Endpoint-ID des Kunden

  loest zu einer ENI, im Round-Robin ueber alle konfigurierten AZs

Zonaler Endpoint-DNS-Name
  vpce-0abc123-xy4z-eu-central-1a.vpce-svc-...vpce.amazonaws.com
                    |
                    +-- feste Availability Zone

  loest nur zur ENI in genau dieser AZ

Privater DNS-Name (nach Domain-Verifikation)
  telemetrie.telemetrik24.de
```

Die Unterscheidung ist prüfungsrelevant, weil sie zwei verschiedene Fehlerbilder erzeugt. Der **regionale** Name wechselt bei jedem Request die Zone — gut für Verfügbarkeit, schlecht, wenn die Anwendung zonale Affinität braucht. Der **zonale** Name bleibt in seiner AZ und fällt mit ihr aus. Und der **private DNS-Name** funktioniert nur, wenn der Anbieter die Domain verifiziert hat; ohne Verifikation bleibt es beim `vpce`-Hostnamen.

## Was du dadurch nicht baust

- **Keine Verbindung vom Anbieter in die Kunden-VPC.** Braucht die Prüfungsfrage beide Richtungen, ist die Antwort Peering oder Transit Gateway.
- **Kein Netzwerk zwischen den Kunden.** 40 Durchreichen sind 40 getrennte Beziehungen, keine Topologie.
- **Keine Layer-7-Steuerung.** Der NLB arbeitet auf Layer 4. Pfadbasiertes Routing, Header-Auswertung oder WAF gehören vor oder hinter diese Strecke, nicht hinein.
- **Keine Lösung für den Zugriff auf AWS-Dienste aus deiner eigenen VPC.** Dafür brauchst du Gateway oder Interface Endpoints in der Consumer-Rolle — das ist Karte 20.
- **Keine automatische Multi-AZ-Verfügbarkeit.** Der Anbieter muss den Dienst in mindestens zwei AZs bereitstellen; sonst kann der Kunde dort keine Endpoints anlegen.

## Wenn du dir eine Sache merkst

**PrivateLink ist eine Einbahnstraße ohne Routen: der Consumer initiiert, die CIDRs dürfen sich überlappen, und Zugriff regeln Account-IDs statt IP-Listen.**

Die Richtung der Frage entscheidet, nicht die Zahl der VPCs. „Zwei Netze sollen sich gegenseitig erreichen" führt zu Peering oder TGW. „Ein Dienst soll vielen angeboten werden" führt zu PrivateLink.

## Prüfungsknackpunkte

**Signalwörter für PrivateLink:** *expose a service to multiple customer VPCs*, *without exposing it to the internet*, *overlapping CIDR blocks*, *consumers initiate connections only*, *without managing IP allowlists*, *cross-account access*.

**Warum „VPC Peering zwischen Anbieter und Kunden" hier verliert:** Zwei Kunden fahren dieselbe CIDR wie der Anbieter. Peering braucht eindeutige Adressbereiche und scheitert daran, bevor eine Policy überhaupt gelesen wird.

**Warum „Transit Gateway mit allen 40 Kunden" hier verliert:** Es löst dieselbe CIDR-Frage nicht, verbindet die Kunden untereinander sichtbar und macht aus einer Anbieterbeziehung eine gemeinsame Netztopologie.

**Warum „öffentlicher NLB mit strengerer IP-Allowlist" hier verliert:** Der Verkehr läuft weiter über das Internet, und die Anforderung lautet, dass er AWS nie verlässt. Die Pflegelast bleibt zusätzlich bestehen.

**Warum „der Anbieter legt die Endpoints in den Kunden-VPCs an" hier verliert:** Er hat dort keine Rechte. Der Consumer legt den Endpoint an, immer.

**Warum „Gateway Endpoint für den SaaS-Dienst" hier verliert:** Gateway Endpoints gibt es nur für S3 und DynamoDB, und sie wirken über die Route Table der eigenen VPC. Ein fremder Dienst ist über sie grundsätzlich nicht erreichbar — Details dazu auf Karte 20.

**Die Falle mit den Kosten:** Wer „der Anbieter zahlt für 40 Kunden-Endpoints" ankreuzt, liegt falsch. Endpoint-Stunden und Datenverarbeitung trägt der Consumer.
