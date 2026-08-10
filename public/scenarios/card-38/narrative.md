---
cardNumber: 38
slug: network-firewall-egress-halden-pharma-domain-allowlist
title: "AWS Network Firewall — Egress-Kontrolle über Domain-Allowlist"
services: ["AWS Network Firewall", "Amazon VPC", "NAT Gateway", "Internet Gateway", "Route 53 Resolver DNS Firewall"]
domains: ["D1", "D2"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/network-firewall/latest/developerguide/stateful-rule-groups-domain-names.html"
  - "https://docs.aws.amazon.com/network-firewall/latest/developerguide/firewall-logging.html"
  - "https://docs.aws.amazon.com/network-firewall/latest/developerguide/troubleshooting-logging.html"
  - "https://docs.aws.amazon.com/network-firewall/latest/APIReference/API_RulesSourceList.html"
  - "https://repost.aws/knowledge-center/network-firewall-configure-domain-rules"
  - "https://repost.aws/knowledge-center/network-firewall-troubleshoot-rule-issue"
---

## Die Grundidee zuerst

Stell dir eine Werkspforte vor, und zwei Arten, den Ausgang zu kontrollieren.

**Weg eins:** Der Pförtner hat eine Liste mit Hausnummern. Wer rausgeht, muss sagen, zu welcher Hausnummer er fährt. Steht sie auf der Liste, geht er. Das funktioniert, solange die Empfänger feste Adressen haben. Sobald jemand umzieht — oder, schlimmer, wenn eine Firma an 200 wechselnden Adressen sitzt, die täglich neu vergeben werden —, ist die Liste eine Vollzeitstelle.

**Weg zwei:** Der Pförtner hört zu, wie der Bote am Telefon den **Namen** des Empfängers nennt, bevor er losfährt. Nicht die Adresse — den Namen. „Ich fahre zu den Debian-Servern." Der Name steht auf der Liste, also darf er.

Security Groups sind Weg eins. Sie kennen IP-Adressen, Ports und Prefix Lists — **keine Domainnamen**. Network Firewall ist Weg zwei.

Und in diesem Bild steckt schon die Schwäche, die später als Falle wiederkommt: Der Pförtner glaubt dem Boten. Wer den Namen gar nicht erst ausspricht und einfach zur Adresse fährt, kommt an ihm vorbei.

## Was es eigentlich ist — die Domain List Rule Group

Die zentrale Konfiguration ist erstaunlich kurz. Sie ist keine Firewall-Regel im klassischen Sinn, sondern eine **Liste von Namen mit einem Verhalten**:

```json
{
  "RulesSource": {
    "RulesSourceList": {
      "Targets": [".debian.org", ".amazonaws.com", "repo.halden.internal"],
      "TargetTypes": ["TLS_SNI", "HTTP_HOST"],
      "GeneratedRulesType": "ALLOWLIST"
    }
  },
  "RuleVariables": {
    "IPSets": { "HOME_NET": { "Definition": ["10.20.0.0/16"] } }
  }
}
```

Lies das von oben nach unten. **Welche Namen** (`Targets`), **woran erkannt** (`TargetTypes`), **erlauben oder verbieten** (`GeneratedRulesType`), und — die Zeile, an der die meisten Setups scheitern — **für welchen Quellbereich das überhaupt gilt** (`HOME_NET`).

Zwei Details in `Targets`, die Punkte kosten, wenn man sie vertauscht: `repo.halden.internal` ohne führenden Punkt trifft **genau diesen einen Namen**. `.debian.org` mit führendem Punkt trifft `debian.org` **und** alle Subdomains. Der Punkt ist kein Tippfehler, er ist der Wildcard.

Und `GeneratedRulesType: ALLOWLIST` tut mehr, als es aussieht: Es erzeugt implizit eine **Drop-Regel für alles Übrige**. Diese unsichtbare Regel ist später der Grund für zwei getrennte Fallen.

## Der Weg durch die Karte

### Der Kasten links — Halden Pharma und die Auflage des Auditors

`Private Subnet AZ-a`, `0.0.0.0/0 → Firewall`, `kein direkter IGW-Weg`. Blau, weil hier der Workload steht.

Halden Pharma verarbeitet Zulassungsdaten auf EC2-Instanzen in privaten Subnetzen. Die Auflage lautet: Ausgehender Verkehr **nur** zu einer freigegebenen Liste von Domains — Paketquellen, interne Repositories, AWS-Endpunkte. Alles andere wird verworfen und protokolliert. Anlass war ein kompromittiertes Build-Paket in einer anderen Firma, das Daten an einen Paste-Dienst geschickt hatte.

Die dritte Zeile ist die stille Voraussetzung der ganzen Karte: **kein direkter IGW-Weg**. Gäbe es einen, könnte der Verkehr die Firewall umgehen, und die Kontrolle wäre Dekoration.

### Badge 1 — die Route-Tabelle ist die eigentliche Firewall-Installation

Der Pfeil vom Workload zur Firewall trägt keine Technik, sondern eine **Routing-Entscheidung**. Die Route-Tabelle des privaten Subnetzes schickt `0.0.0.0/0` **nicht** zum NAT Gateway, sondern zum **Firewall-Endpoint derselben Availability Zone**.

Das ist der ganze Einbau. Es gibt keinen Agenten auf der Instanz, keine Änderung an der Anwendung, keinen Proxy in der Konfiguration. Die Instanz merkt nichts; für sie ist es eine normale ausgehende Verbindung.

**Das Bild dazu:** Du hast nicht die Tür der Werkstatt ausgetauscht. Du hast das Straßenschild umgedreht.

### Badge 2 und der Firewall-Policy-Kasten — zwei Stufen, nicht eine

`Stateless: pass → stateful`, `Stateful Domain List: TLS-SNI / HTTP-Host`, `Suricata-kompatible Regeln`. Teal, wie jede Regel- und Policy-Instanz auf den letzten Karten.

Der Verkehr durchläuft **zwei getrennte Verarbeitungsstufen mit eigener Kapazitätsrechnung**, die auf der Karte aus Platzgründen in einem Kasten stecken.

**Stufe eins**, die Stateless Rule Groups, arbeitet paketweise auf dem 5-Tupel — Quell-IP, Ziel-IP, Quellport, Zielport, Protokoll. Kein Verbindungsgedächtnis. In dieser Architektur macht sie nur eines: Sie reicht mit der Default Action `aws:forward_to_sfe` alles an die zweite Stufe weiter.

**Stufe zwei**, die Stateful Engine, basiert auf Suricata und kennt den Verbindungszustand. Hier greift die Domain List. Bei HTTPS liest sie den **SNI aus dem TLS-Handshake**, bei HTTP den **Host-Header**.

Zwei Dinge tut sie ausdrücklich **nicht**: Sie macht keine eigenen DNS-Lookups, und sie bewertet keine IP-Adressen. Sie liest nur, was der Client selbst in den Handshake schreibt.

### Der Network-Firewall-Kasten — was auf dem Schild „macht kein NAT" steht

`Endpoint je AZ`, `eigenes Firewall-Subnet`, `macht kein NAT`.

Alle drei Zeilen sind Betriebsanforderungen, die man verletzen kann, ohne dass sofort etwas kaputtgeht.

**Endpoint je AZ** ist keine Redundanzempfehlung, sondern eine Korrektheitsbedingung. Hin- und Rückweg einer Verbindung müssen über **denselben** Endpoint laufen, sonst sieht die Stateful Engine nur eine Richtung des Verbindungszustands und trifft Entscheidungen auf halber Information. Deshalb gehört pro AZ ein Endpoint, und die Routen bleiben AZ-lokal. Nebeneffekt: Jeder Endpoint kostet einzeln.

**Eigenes Firewall-Subnet** heißt: In dieses Subnetz gehört **nichts anderes**. Keine Instanzen, kein NAT Gateway.

**Macht kein NAT** ist die Zeile, die im Entwurf am häufigsten übersehen wird. Network Firewall ersetzt weder NAT Gateway noch Internet Gateway. Ohne NAT davor oder dahinter bräuchten die Instanzen öffentliche IPs — womit man sich die Architektur wieder aufreißt, die man gerade geschlossen hat.

### Das rote X und `paste.evil.example`

`nicht in der Allowlist`, `DROP im Stateful-Regelwerk`, mit dem X und der Beschriftung `SNI geprüft`.

Ein kompromittiertes Build-Paket versucht, Daten an einen Paste-Dienst zu schicken. Der Name steht nicht auf der Liste, die implizite Drop-Regel greift.

Hier lohnt eine Präzisierung, die auf der Karte keinen Platz hat und die man beim Testen sofort bemerkt: **Der TCP-3-Wege-Handshake muss abgeschlossen sein, bevor die Firewall überhaupt etwas sehen kann.** SYN, SYN-ACK, ACK laufen durch — erst danach schickt der Client sein Client Hello mit dem SNI, und erst dann fällt die Entscheidung. Die TCP-Verbindung kommt also zustande; was nicht durchkommt, sind die Nutzdaten.

Das hat eine praktische Konsequenz: Wer versucht, mit Stateless-Regeln auf Port 443 vorzufiltern und dabei die Handshake-Pakete blockt, bekommt keinen sauberen Abbruch, sondern einen **Timeout** in der Anwendung — und sucht den Fehler dann in der Anwendung.

### Badge 3 und der NAT-Gateway-Kasten — die Reihenfolge ist der Punkt

`Public Subnet AZ-a`, `Quell-IP → EIP`, `keine Kontrollinstanz`. Navy, wie alle Infrastruktur-Eintrittspunkte.

Der erlaubte Verkehr geht weiter zum NAT Gateway **in derselben AZ**. Die Reihenfolge — erst Firewall, dann NAT — ist keine Geschmacksfrage.

**Nur so sieht die Firewall die echten privaten Quell-IPs der Workloads.** Stünde die Firewall hinter dem NAT Gateway, sähe sie ausschließlich dessen Elastic IP: alle Instanzen des VPC sähen identisch aus, und 5-Tuple-Regeln pro Instanz wären unmöglich.

Das ist auch historisch interessant. Vor den VPC-Routing-Erweiterungen **konnte** Network Firewall nur zwischen IGW und NAT Gateway stehen. Seit sich die `local`-Route in Subnet-Route-Tabellen überschreiben lässt, steht sie davor. Ältere Diagramme und Kursmaterialien zeigen noch die alte Anordnung — wer sie nachbaut, verliert die Quell-IPs.

### Badge 4 und der Internet-Gateway-Kasten

`VPC-Ausgang`. Navy, ebenfalls reine Transportstation.

Das NAT Gateway hat auf seine Elastic IP übersetzt, die Route-Tabelle des öffentlichen Subnetzes zeigt auf das IGW. Beide treffen keine Entscheidung über den Inhalt — sie stehen auf der Karte, damit klar ist, wo **nicht** gefiltert wird.

### Badge 5 und `updates.debian.org`

`in der Allowlist`, `SNI stimmt überein`. Grün, das erlaubte Ziel.

Der Gegenbeweis zum roten X: Derselbe Mechanismus, dasselbe Regelwerk, anderes Ergebnis. Der Name steht auf der Liste, die Verbindung läuft durch.

### Badge 6 und der Firewall-Logs-Kasten — hier steht der wichtigste Vorbehalt der Karte

`Alert + Flow`, `S3 / CloudWatch / Firehose`, der grüne gestrichelte Pfad mit `jeder Treffer geloggt`.

Für den Auditor ist genau das der Nachweis — und deshalb muss man hier genau hinsehen.

**Auf der Karte steht `jeder Treffer geloggt`. Das ist so nicht garantiert.** Die Troubleshooting-Doku sagt ausdrücklich: Flows, die von den Stateful Default Actions *Drop established* oder *Drop all* verworfen werden, erzeugen **keine Alert-Logs**, solange keine Stateful Default Alert Action konfiguriert ist. Genau dieser Fall liegt hier vor — die Allowlist erzeugt ihre Drop-Regel implizit. Das Setup blockt dann korrekt und **schweigt dabei**.

Für den Nachweis heißt das: Die Alert-Action muss ausdrücklich gesetzt sein. Sonst hat Halden Pharma eine funktionierende Sperre ohne Beleg — und der Auditor verlangt den Beleg.

Wie das auf der Karte selbst gelöst wird, ist noch offen. **Zwei Wege stehen zur Wahl:**

**Weg A — die Kartenzeile ändern**, etwa zu `Treffer geloggt bei Alert-Action`. Die Karte ist dann für sich allein korrekt, die Linie verliert aber ihren Merksatz-Charakter.

**Weg B — die Karte bleibt, der Vorbehalt lebt hier.** `jeder Treffer geloggt` beschreibt dann das Ziel des Setups, nicht seine Default-Konfiguration. Die Linie behält ihre Aussage, aber wer nur die Karte sieht, hält das Logging für automatisch.

Was in beiden Fällen gilt: Es gibt **drei** Log-Typen, nicht zwei. **ALERT** für Regeltreffer, **FLOW** für Verbindungsmetadaten aller Verbindungen, und **TLS** für Ereignisse der TLS-Inspektion. TLS setzt eine TLS-Inspection-Konfiguration voraus, die auf dieser Karte nicht vorkommt — deshalb ist `Alert + Flow` hier keine Falschaussage, sondern eine Auslassung.

Praktisch wichtig: Alert- und Flow-Logs lassen sich über `flow_id` korrelieren. Der SNI steht im Alert-Log, das übertragene Volumen im Flow-Log. Flow-Logs allein sagen dir **nicht**, welche Regel gegriffen hat.

### Der gestrichelte Kasten — die Falle HOME_NET

`prüft nur das Deployment-VPC`, `Spoke-VPCs über TGW: CIDRs eintragen`, `sonst läuft Spoke-Traffic ungeprüft`.

Das ist die gefährlichste Fehlkonfiguration der Karte, weil sie **wie ein funktionierendes Setup aussieht**.

Standardmäßig inspiziert die Domain List nur Verkehr, dessen Quelle im **CIDR-Bereich des Deployment-VPC** liegt. Das steht so in der API-Referenz und im Developer Guide. Steht die Firewall zentral in einem Inspection-VPC und kommt der Verkehr über Transit Gateway aus Spoke-VPCs, dann liegt diese Quelle außerhalb — und der Verkehr läuft **ungeprüft durch**.

Kein Fehler. Kein Log. Kein Alarm. Die Firewall arbeitet, die Regeln sind korrekt, die Konsole zeigt grün. Nur wird nichts geprüft.

Der Ausweg ist eine Zeile: Die CIDRs der Spokes gehören explizit in die Rule-Variable `HOME_NET`, zusammen mit dem CIDR des Deployment-VPC. Wer prüfen will, ob eine bestehende Rule Group betroffen ist, ruft `DescribeRuleGroup` auf — fehlt das `RuleVariables`-Objekt in der Antwort, gilt der Default.

### Die Merksätze-Fußzeile

Vier Sätze. Der erste trägt die Karte: `Security Group kennt keine Domains`. Der zweite ist die Schichtung: `SNI ≠ DNS: beides filtern`. Der dritte die Reihenfolge, der vierte die HOME_NET-Falle.

## Die entscheidende Unterscheidung

Fünf Kontrollen, die in Fragen gegeneinander stehen. Die Spalte, die entscheidet, ist **Filtert nach**:

| Kontrolle | Ebene | Richtung | Filtert nach |
|---|---|---|---|
| Security Group | ENI, stateful | ein/aus | IP, Port, Prefix List, SG |
| Network ACL | Subnet, stateless | ein/aus | IP, Port |
| Network Firewall | VPC-Route, stateful | ein/aus | **Domain (SNI/Host)**, 5-Tupel, Suricata |
| DNS Firewall | Route 53 Resolver | DNS-Anfragen | **Domainname in der Query** |
| AWS WAF | HTTP(S) an ALB/CloudFront/API GW | eingehend | HTTP-Inhalt, Rate, Geo |

**Network Firewall und DNS Firewall sind keine Alternativen, sondern zwei Schichten.** DNS Firewall verhindert, dass ein Name überhaupt aufgelöst wird — das greift auch gegen DNS-Tunneling, bei dem Daten in DNS-Anfragen versteckt werden. Network Firewall prüft die tatsächliche Verbindung.

Wer nur DNS Firewall einsetzt, ist umgangen, sobald jemand die IP kennt und direkt verbindet. Wer nur Network Firewall einsetzt, sieht DNS-Exfiltration nicht. AWS empfiehlt in den eigenen Beispielen ausdrücklich beides.

**Nicht zu verwechseln mit Gateway Load Balancer.** GWLB ist der Weg, wenn eine **Appliance eines Drittanbieters** inspizieren soll. Network Firewall ist die verwaltete AWS-eigene Variante desselben Musters.

## Die ehrliche Feinheit

**SNI-Filterung ist umgehbar, und die Doku sagt es selbst.** Die Firewall vertraut dem, was der Client in den Handshake schreibt. Wer den Namen kennt, ihn per DNS auflöst und dann **direkt per IP** verbindet, taucht in keiner Domain-List-Regel auf. Die Doku formuliert es als Handlungsanweisung: Wer das abdecken will, schreibt **zusätzlich IP-basierte Regeln**, ergänzend oder anstelle der Domain-Regeln.

**Die Action Order kann Regeln stillschweigend entwerten.** Eine Allow-Domain-List erzeugt implizit eine Drop-Regel für alles Übrige. In einer Policy mit *Default Action Order* greift diese implizite Drop-Regel **vor** Reject- oder Alert-Regeln aus anderen Domain-List-Gruppen. AWS rät deshalb ausdrücklich davon ab, Allow-Listen und Reject- oder Alert-Listen in derselben Policy mit Default-Reihenfolge zu mischen. Wer beides braucht, nimmt *Strict Evaluation Order*.

**Was nicht belegt ist:** Eine Drittquelle behauptet, bei verschlüsseltem SNI (ESNI/ECH) funktioniere die SNI-Filterung überhaupt nicht und man brauche zwingend TLS-Inspektion. Technisch plausibel und im Einklang mit dem Prinzip — aber die AWS-Doku sagt es **nicht in dieser Form**. Sie spricht allgemein von manipulierten SNI- oder Host-Headern. Vor Verwendung im Unterricht gegenprüfen.

**Randnotiz, AWS-bestätigt:** Seit November 2025 gibt es das **Regional NAT Gateway**, das die AZ-weise Vervielfachung in Inspektionsarchitekturen vereinfacht. Abgerechnet wird weiterhin pro AZ-Stunde — es ist eine Betriebsvereinfachung, keine Kostensenkung. Für SAA-C03 noch kein Prüfungsstoff.

## Was du dadurch nicht baust

Zähl durch, was hier **nicht** existiert:

- kein Agent auf den Instanzen und keine Änderung an der Anwendung
- kein Proxy, dessen Zertifikat verteilt werden müsste
- keine IP-Allowlist, die jemand pflegen müsste
- keine Drittanbieter-Appliance und kein Gateway Load Balancer
- keine TLS-Inspektion — der SNI wird gelesen, nicht der Inhalt entschlüsselt
- kein Ersatz für NAT Gateway oder Internet Gateway
- keine Kontrolle über DNS-Auflösung; dafür fehlt DNS Firewall

Übrig bleiben: drei Route-Tabellen pro AZ, ein Endpoint je AZ und eine Liste von Namen.

## Wenn du dir eine Sache merkst

**Security Groups filtern Adressen, Network Firewall filtert Namen.**

Sobald in einer Frage „approved domains", „domain allowlist" oder „prevent exfiltration to unknown destinations" steht, ist die Antwort Network Firewall oder Route 53 Resolver DNS Firewall — nie eine Security Group und nie eine NACL.

Eine Security Group kennt IP, Port, Prefix List und andere Security Groups. Eine NACL kennt IP und Port. Beide haben kein Feld, in das ein Domainname passen würde.

## Prüfungsknackpunkte

**Signalwörter:** „outbound traffic must be restricted to approved domains", „prevent data exfiltration to unknown destinations", „security groups cannot filter by domain name", „inspect and log all egress traffic centrally". Der dritte ist geschenkt — er nennt den Ausschlussgrund direkt.

**Warum eine Security Group hier verliert:** Sie hat kein Feld für Namen. Das ist keine Frage der Konfiguration, sondern des Datenmodells.

**Warum eine NACL hier verliert:** Gleicher Grund, plus stateless.

**Warum AWS WAF hier verliert:** Falsche Richtung. WAF sitzt vor ALB, CloudFront oder API Gateway und prüft **eingehenden** HTTP-Verkehr. Die Frage zielt auf ausgehenden.

**Warum ein Proxy mit Allowlist hier verliert:** Er funktioniert technisch, verlangt aber Konfiguration auf jeder Instanz und in jeder Anwendung. Bei „centrally" und „without modifying the instances" fällt er raus.

**Warum DNS Firewall allein hier verliert:** Sie verhindert die Auflösung, nicht die Verbindung. Steht in der Frage „inspect and log all egress traffic", reicht das nicht — gefragt ist der Datenpfad. Steht dort dagegen ausdrücklich DNS-Tunneling oder „prevent domain resolution", ist DNS Firewall die bessere Antwort.

**Die Falle mit dem zentralen Inspection-VPC:** Sobald eine Frage eine Hub-and-Spoke-Architektur mit Transit Gateway beschreibt und fragt, warum Verkehr ungefiltert durchkommt, ist die Antwort `HOME_NET`. Nicht die Regeln, nicht die Routen, nicht die Policy-Reihenfolge.
