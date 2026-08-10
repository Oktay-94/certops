---
cardNumber: 32
slug: site-to-site-vpn-direct-connect-hansa-fracht-nachtreplikation
title: "Site-to-Site VPN vs Direct Connect — mit VPN starten, auf DX landen"
services: ["AWS Site-to-Site VPN", "AWS Direct Connect", "AWS Transit Gateway", "AWS Direct Connect Gateway"]
domains: ["D1", "D3", "D4"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/vpn/latest/s2svpn/VPNTunnels.html"
  - "https://docs.aws.amazon.com/vpn/latest/s2svpn/tunnel-configure.html"
  - "https://docs.aws.amazon.com/vpn/latest/s2svpn/VPC_VPN.html"
  - "https://docs.aws.amazon.com/vpc/latest/tgw/how-transit-gateways-work.html"
  - "https://docs.aws.amazon.com/directconnect/latest/UserGuide/hosted_connection.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/hybrid-networking-lens/aws-direct-connect.html"
  - "https://aws.amazon.com/directconnect/faqs/"
  - "https://aws.amazon.com/directconnect/features/"
  - "https://aws.amazon.com/vpn/pricing/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/aws-site-to-site-vpn-5-gbps-bandwidth-tunnels"
  - "https://aws.amazon.com/about-aws/whats-new/2026/05/aws-site-to-site-vpn-modify-bandwidth/"
---

## Die Grundidee zuerst

Jede Nacht müssen 1,8 TB von Hamburg nach Frankfurt, und sie müssen zwischen 22:00 und 04:00 ankommen.

**Weg eins: der LKW über die Autobahn.** Du kannst heute Nachmittag losfahren. Die Straße ist da, sie gehört dir nicht, sie kostet nichts extra, und niemand fragt dich um Erlaubnis. Meistens bist du in fünf Stunden da. Manchmal in vier. Und zwei- bis dreimal pro Woche stehst du im Stau und bist um 05:30 da — nicht weil dein LKW zu klein ist, sondern weil zwischen dir und Frankfurt zehntausend andere Fahrzeuge liegen, über die du nichts entscheidest.

**Weg zwei: ein eigenes Gleis zum Depot.** Es dauert Wochen, bis es liegt. Es kostet eine feste Miete, ob du fährst oder nicht. Aber der Fahrplan gehört dir. Wenn du sagst, der Zug fährt um 22:00 und ist um 03:00 da, dann ist das keine Prognose, sondern eine Zusage.

Und hier steht die Falle dieser Karte, in einem Satz: **Ein größerer LKW löst keinen Stau.** Wer nach zwei Wochen Verspätung einen Sattelzug mit doppelter Ladefläche kauft, zahlt das Zwölffache und steht immer noch im selben Stau. Das Problem ist nie die Ladefläche gewesen. Das Problem ist die Straße.

Site-to-Site VPN ist die Autobahn: sofort verfügbar, verschlüsselt, unvorhersagbar. Direct Connect ist das Gleis: langsam zu bekommen, vorhersagbar — und unverschlüsselt, weil ein eigenes Gleis kein Schloss an der Ladung ist.

## Was es eigentlich ist — zwei Attachments und eine BGP-Entscheidung

Die Karte sieht aus, als ginge es um zwei Leitungen. Tatsächlich geht es um **zwei Attachments am selben Transit Gateway** und um die Frage, welches davon gewinnt, wenn beide dieselben Prefixe anbieten.

So sieht die relevante Konfiguration einer VPN-Verbindung aus. Die eine Zeile, um die es auf dieser Karte geht, ist `TunnelBandwidth`:

```json
{
  "TransitGatewayId": "tgw-04f9c1a7e2",
  "CustomerGatewayId": "cgw-0hh1a2m3b4",
  "Type": "ipsec.1",
  "Options": {
    "StaticRoutesOnly": false,
    "TunnelOptions": [
      { "TunnelBandwidth": "standard" },
      { "TunnelBandwidth": "standard" }
    ]
  }
}
```

Zwei Tunnel, immer. `StaticRoutesOnly: false` bedeutet BGP — und BGP ist die Voraussetzung dafür, dass der Umstieg später ohne Wartungsfenster funktioniert. `standard` sind bis zu 1,25 Gbps pro Tunnel, `large` bis zu 5 Gbps. Beide Tunnel einer Verbindung müssen dieselbe Einstellung tragen.

Und so sieht die TGW-Route-Table aus, wenn beide Wege stehen und beide `172.20.0.0/16` aus Hamburg anbieten:

```
CIDR              Attachment                    Route type
172.20.0.0/16     tgw-attach-dxgw-0a1b          propagated
```

**Die VPN-Route ist nicht da.** Sie ist nicht gelöscht, nicht deaktiviert und nicht falsch konfiguriert — das Transit Gateway zeigt schlicht nur die bevorzugte Route an. Erst wenn Direct Connect aufhört, den Prefix anzukündigen, erscheint die VPN-Route in derselben Tabelle. Das ist der ganze Failover-Mechanismus, und er ist ein Anzeigeverhalten, kein Schalter.

## Der Weg durch die Karte

### Der graue Kasten links — was das Szenario wirklich verlangt

`1,8 TB pro Nacht`, `Fenster: 6 Stunden`. Rechne es einmal aus, denn die Prüfung tut es auch: 1,8 TB in sechs Stunden sind rund **0,67 Gbps Dauerdurchsatz**, wenn du TB dezimal rechnest. Rechnest du binär, wie AWS es bei GB-Angaben selbst tut, sind es 0,73 Gbps. Beides passt rechnerisch in einen Standard-Tunnel mit 1,25 Gbps — und genau das ist die Falle. Die Kapazität reicht. Die Verfügbarkeit dieser Kapazität nicht.

Der Kasten ist grau gestrichelt: Das Rechenzentrum liegt außerhalb der AWS-Kontrollebene. `Customer Gateway` ist der einzige Teil davon, den AWS überhaupt kennt — ein Objekt mit einer öffentlichen IP und einer BGP-ASN.

### Badge 1 und der Internet-Kasten — die Strecke, die dir nicht gehört

Eine Site-to-Site-VPN-Verbindung steht in Minuten: IPsec über das öffentliche Internet, **von Haus aus verschlüsselt**, zwei Tunnel in verschiedenen Availability Zones. Genau deshalb ist sie der richtige Startpunkt, wenn Konnektivität *jetzt* gebraucht wird.

Was sie nicht liefert, steht im Kasten: `Rate schwankt`, `0,3 – 1,1 Gbps`. Der Pfad gehört dem Internet. AWS sagt in der eigenen Dokumentation ungewöhnlich offen, welche Faktoren die real erreichte Bandbreite beeinflussen — Paketgröße, Traffic-Mix aus TCP und UDP, Shaping und Throttling auf Zwischennetzen, „internet weather" und die Anforderungen der Anwendung selbst. Keiner dieser Faktoren steht unter deiner Kontrolle.

### Der rote X-Stub — `5 Gbps hilft hier nicht`

Das ist der didaktische Kern der Karte und der Grund, warum der Stub rot ist: Er markiert eine **verworfene Zwischenlösung**, keinen ausgefallenen Pfad.

Seit dem **12.11.2025** gibt es Large Bandwidth Tunnels mit bis zu 5 Gbps pro Tunnel statt 1,25 Gbps. Drei Einschränkungen davon sind prüfungstauglich: nur an **Transit Gateway oder Cloud WAN**, nicht an einem Virtual Private Gateway; nicht in Melbourne, Tel Aviv, Zürich, Calgary und den VAE; und **Accelerated VPN wird nicht unterstützt**. Der Preis springt von $0,05 auf **$0,60 pro Stunde und Verbindung** — Faktor zwölf, und dieser Satz gilt laut AWS-Preisseite in allen unterstützten Regionen gleich.

Der Denkfehler liegt aber woanders: **LBT hebt die Decke des Tunnels, nicht die des Pfades darunter.** Die gemessenen 0,3 bis 1,1 Gbps sind nie am 1,25-Gbps-Limit angestanden. Wer hier auf LBT ausweicht, zahlt das Zwölffache und behält die Schwankung.

### Badge 2 und `DX Location` — warum Wochen vergehen

Eine dedizierte Leitung gibt es in **1, 10, 100 und 400 Gbps**; über einen Partner als Hosted Connection auch ab **50 Mbps** und in Stufen bis 25 Gbps. Der Vorlauf sind Tage bis Wochen, weil im Colocation-Rechenzentrum ein Cross-Connect geschaltet und ein Port bereitgestellt werden muss. Das ist keine AWS-Bremse, sondern Physik und Terminplanung — und der Grund, warum Schritt 1 überhaupt existiert.

### Badge 3 — DX terminiert am selben Hub

Über eine Transit VIF und ein Direct Connect Gateway hängt die Leitung am selben Transit Gateway wie das VPN. Damit erreichen alle zwölf VPCs die neue Leitung, ohne dass ein einziges VPC angefasst wird. Genau das ist der Ertrag aus Karte 31: Der Hub existiert schon, die neue Leitung ist ein Attachment mehr.

### Der TGW-Kasten — `bevorzugt DX automatisch`

Das steht so auf der Karte, und es ist belegbar. AWS dokumentiert, dass ein Transit Gateway Routen ohne MED Default-Werte zuweist: **0 für eingehende Routen auf Direct-Connect-Attachments, 100 für VPN- und Connect-Attachments**. Der niedrigere Wert gewinnt. Deshalb erscheint in der Route Table nur der DX-Weg, und deshalb übernimmt das VPN von allein, wenn DX seine Routen zurückzieht.

Wichtig ist die Richtung: Das gilt **AWS-seitig**. Der Rückweg — welchen Pfad dein eigener Router für Traffic nach AWS wählt — wird auf der on-premises-Seite konfiguriert, üblicherweise über BGP Local Preference. Wer nur eine Seite einstellt, baut asymmetrisches Routing.

### Badge 4 — `Backup`, gestrichelt

Der gestrichelte Pfeil vom Internet zum TGW ist der VPN-Weg nach dem Umstieg. Er bleibt bestehen und kostet weiter seine Grundgebühr. Das ist kein Restposten, sondern Absicht: Eine einzelne DX-Leitung ist ein Single Point of Failure.

### Die drei VPC-Boxen rechts — `und 9 weitere am TGW`

Drei von zwölf sind gezeichnet, der Rest steht als Textzeile. Die Aussage dahinter ist die eigentliche Belohnung: Der Umbau auf DX berührt **kein einziges VPC**. Alles passiert am Hub.

### Badge 5 — `DX ist nicht verschlüsselt`

Der wichtigste Satz der Karte für die Prüfung. Direct Connect ist eine **private, aber unverschlüsselte** Leitung. „Privat" und „verschlüsselt" sind zwei verschiedene Zusagen, und DX gibt nur die erste.

MACsec wäre die native Antwort, ist aber nur auf **dedizierten 10-, 100- und 400-Gbps-Verbindungen an ausgewählten Standorten** verfügbar — bei einer 1-Gbps-Leitung also nicht, und bei Hosted Connections grundsätzlich nicht. Bleibt der Weg, den die Karte nennt: `IPsec-VPN über DX`. Du legst also eine VPN-Verbindung über die private Leitung, statt über das Internet.

### Badge 6 — die Kostenwende

Die Karte rechnet 14 TB Egress pro Monat gegeneinander: über das Internet `$0,09/GB ≈ $1.290`, über Direct Connect `$0,02/GB ≈ $287`, dagegen der Port mit `$219/Monat`.

**Auf der Karte steht $0,09/GB als glatter Satz — richtig ist, dass Internet-Egress gestaffelt abgerechnet wird.** Nach der ersten Stufe sinkt der Preis; die ersten 100 GB im Monat sind frei, danach gilt der höchste Satz bis 10 TB und darüber ein niedrigerer. Bei 14 TB liegst du also über der ersten Stufe. Beide Rechenwege gehören nebeneinander, solange die Karte nicht geändert ist:

- **Glatt gerechnet, wie auf der Karte:** 14 TB × $0,09/GB ≈ $1.290. Das ist die Zahl, die auch die meisten Übungsaufgaben verwenden.
- **Gestaffelt gerechnet:** die ersten rund 10 TB zum höheren Satz, der Rest zum niedrigeren — das Ergebnis liegt spürbar, aber nicht dramatisch unter $1.290.

Für die Prüfungslogik ändert das nichts: Das Verhältnis bleibt grob **vier zu eins** zugunsten von Direct Connect, und der Port frisst diesen Vorteil bei 14 TB nicht auf. Behandle alle vier Beträge als Größenordnung — die AWS-Preistabellen sind JS-gerendert und lassen sich nicht als Primärquelle abrufen, und die DX-Rate hängt zusätzlich davon ab, in welcher Geografie die DX Location liegt.

Und der Posten, der in keiner AWS-Rechnung auftaucht: **Cross-Connect im Colocation und die Telco-Leitung nach Hamburg stellt nicht AWS in Rechnung.** In realen Kalkulationen liegen die oft in derselben Größenordnung wie der Port selbst.

### Die Fußzeile — drei Sätze, drei Prüfungsfragen

`VPN in Minuten, DX in Wochen` beantwortet die Zeitfrage. `AWS bevorzugt DX vor VPN — Failover läuft von selbst` beantwortet die Betriebsfrage. `DX ist nicht verschlüsselt` beantwortet die Sicherheitsfrage — und das ist der Satz, der am häufigsten geprüft wird.

## Die entscheidende Unterscheidung — Zeit gegen Vorhersagbarkeit

| | Site-to-Site VPN | Direct Connect |
|---|---|---|
| Bereitstellung | Minuten | Tage bis Wochen |
| Pfad | öffentliches Internet | dedizierte Leitung |
| Durchsatz | 1,25 Gbps je Tunnel, mit LBT 5 Gbps | 50 Mbps bis 400 Gbps je Port |
| Vorhersagbarkeit | keine Zusage | konsistent |
| Verschlüsselung | **inklusive** (IPsec) | **keine**, MACsec nur ab 10 Gbps dedicated |
| Egress-Preis | Internet-Rate | deutlich niedrigere DX-Rate |
| Fixkosten | Verbindungsstunde | Port-Stunde plus Colo und Telco |
| Hochverfügbarkeit | zwei Tunnel inklusive | erst mit zweiter Leitung oder VPN-Backup |

## Die ehrliche Feinheit

Die Karte erzählt LBT als Sackgasse, und für dieses Szenario stimmt das. Zwei Dinge relativieren die Härte des Urteils.

Erstens ist Large Bandwidth Tunnel seit dem **06.05.2026** kein Einbahnentscheid mehr. Bis dahin bedeutete ein Wechsel der Tunnelbandbreite, die Verbindung zu löschen und neu anzulegen — mit neuen Tunnel-IP-Adressen und entsprechender Nacharbeit am on-premises-Gerät. Seither lässt sich die Bandbreite an einer **bestehenden** Verbindung umstellen, unter Erhalt von IP-Adressen, CIDRs, Pre-Shared Keys und aller übrigen Einstellungen. Weder die Karte noch `battle_card_32.md` kennen das. Das Argument „LBT ist teuer und aufwendig" verliert damit die Hälfte — teuer bleibt es, aufwendig nicht mehr.

Zweitens ist LBT für den *Backup*-Fall durchaus die richtige Antwort, und AWS nennt genau diesen Anwendungsfall selbst: eine VPN-Verbindung als Rückfallebene für eine hochkapazitive DX-Strecke. Wenn deine DX-Leitung 10 Gbps liefert und das Backup bei 1,25 Gbps pro Tunnel steht, ist der Ausfall kein Failover, sondern eine Drosselung um Faktor acht. In diesem Szenario mit einer 1-Gbps-Leitung ist das kein Thema — bei einer Prüfungsfrage mit 10 Gbps und *resilient* im Text wäre es eins.

Eine Einschränkung zur Quellenlage: `battle_card_32.md` trägt eine Randnotiz, wonach der MED-Mechanismus am Virtual Private Gateway von allein greife, am Transit Gateway hingegen nur mit `bgp always-compare-med` auf dem Kundenrouter. Belegen ließ sich davon nur der AWS-dokumentierte Teil — die Default-MED-Werte 0 und 100 am TGW. Für die Aussage über `always-compare-med` fand sich ausschließlich eine einzelne Drittquelle. Sie steht deshalb hier als offene Frage und nicht als Tatsache.

## Syntax lesen — wie das TGW zwischen zwei Wegen entscheidet

```
Prefix 172.20.0.0/16 kommt zweimal an:

   ueber DX-Attachment   -->  MED = 0     (Default fuer Direct Connect)
   ueber VPN-Attachment  -->  MED = 100   (Default fuer VPN und Connect)

                niedrigerer MED gewinnt
                          |
                          v
   Route Table zeigt:  nur den DX-Eintrag

   DX zieht Ankuendigung zurueck
                          |
                          v
   Route Table zeigt:  den VPN-Eintrag   (kein Eingriff noetig)
```

Zwei Konsequenzen, die in Prüfungsfragen auftauchen. Erstens: Der Vergleich funktioniert nur, wenn **beide Wege denselben Prefix** ankündigen. Ist die VPN-Route spezifischer — etwa `/24` gegen `/16` über DX — gewinnt sie unabhängig vom MED, weil die längere Maske vor jeder Attributbewertung kommt. Zweitens: Das TGW zeigt grundsätzlich nur die bevorzugte Route. Eine leere Zeile für das VPN-Attachment ist im Normalbetrieb das erwartete Bild, nicht der Fehler.

## Was du dadurch nicht baust

- **Keine Verschlüsselung über Direct Connect.** Sie kommt nicht mit und lässt sich bei 1 Gbps auch nicht per MACsec nachrüsten.
- **Keine Hochverfügbarkeit mit einer Leitung.** Eine DX-Verbindung ist ein Single Point of Failure; die SLA greift erst bei redundanten Verbindungen an getrennten Standorten.
- **Keine schnellere Internet-Strecke.** Weder LBT noch ein zweiter Tunnel machen den Pfad zwischen Hamburg und AWS besser.
- **Kein Wartungsfenster-Cutover.** Der Umstieg passiert im Routing. Wer ihn plant wie eine Migration, plant etwas, das es nicht gibt.
- **Keine vollständige Kostentransparenz aus der AWS-Rechnung.** Cross-Connect und Telco stehen nicht darauf.

## Wenn du dir eine Sache merkst

**VPN kauft Zeit, Direct Connect kauft Vorhersagbarkeit — und DX bringt seine Verschlüsselung nicht mit.**

Wer *connectivity needed within days* liest, wählt VPN. Wer *consistent and predictable network performance* liest, wählt DX. Wer beides zusammen mit *encrypted in transit* liest, wählt DX **plus** IPsec — nicht DX allein.

## Prüfungsknackpunkte

**Signalwörter für Direct Connect:** *consistent and predictable network performance*, *dedicated connection*, *reduce data transfer costs*, *not over the public internet*.

**Signalwörter für VPN:** *connectivity needed within days*, *encrypted in transit* ohne weitere Auflage, *temporary*, *lowest upfront cost*.

**Warum „Large Bandwidth Tunnels mit 5 Gbps" hier verliert:** Die Engstelle ist der Internetpfad, nicht der Tunnel. Zwölffacher Preis, unveränderte Schwankung.

**Warum „ECMP über mehrere Tunnel" hier verliert:** Gleiche Begründung, anderer Weg. Mehrere Tunnel bündeln Kapazität, die auf dieser Strecke nicht das Problem war.

**Warum „Direct Connect ist sicher, weil privat" hier verliert:** Privat heißt nicht verschlüsselt. Das ist die meistgestellte Fangfrage dieser Karte.

**Warum „ein größerer DX-Port" bei einer Resilienz-Frage verliert:** Ein größerer Port ist immer noch ein Port. *Resilient* verlangt einen zweiten Standort oder ein VPN-Backup.

**Warum „auf ein Wartungsfenster für den Cutover planen" verliert:** Es gibt keinen Cutover. Werden dieselben Prefixe über beide Wege angekündigt, entscheidet BGP.
