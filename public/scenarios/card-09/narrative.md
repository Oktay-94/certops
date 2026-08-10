---
cardNumber: 9
slug: outposts-local-zones-werkslatenz
title: "Battle Card 9 — Outposts · Local Zones"
services: ["AWS Outposts", "EC2 on Outposts", "EBS on Outposts", "S3 on Outposts", "Local Gateway", "AWS Local Zones", "AWS Wavelength"]
domains: ["D3", "D1"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/outposts/latest/network-userguide/what-is-outposts.html"
  - "https://aws.amazon.com/outposts/servers/"
  - "https://aws.amazon.com/about-aws/global-infrastructure/localzones/"
  - "https://aws.amazon.com/wavelength/faqs/"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Werk zu führen, das zu einem Konzern gehört.

**Art eins:** Bei jeder Entscheidung ruft der Werksleiter in der Konzernzentrale an. Darf diese Charge weiterlaufen? Ist dieses Teil in Ordnung? Er wählt, es klingelt, jemand geht ran, prüft, antwortet. Das dauert. Bei drei Entscheidungen am Tag funktioniert das wunderbar. Bei dreihundert Entscheidungen in der Sekunde ist die Fertigungsstraße schneller als das Telefon, und die Ware läuft weiter, während noch geprüft wird.

**Art zwei:** Die Zentrale schickt einen bevollmächtigten Mitarbeiter ins Werk. Er sitzt in der Halle, er entscheidet vor Ort — aber nach exakt denselben Regeln, mit denselben Formularen, in denselben Systemen wie die Zentrale. Für die Fertigung ändert sich nichts außer der Entfernung. Abends meldet er nach oben, was er getan hat.

Das ist AWS Outposts. AWS-eigene Hardware, von AWS betrieben, physisch in deinem Gebäude, mit denselben APIs wie die Region.

Und der Grund, warum Art eins nicht schneller gemacht werden kann, ist keine Frage der Leitung, sondern der Physik. Zwischen deinem Werk und `eu-central-1` liegen ein paar hundert Kilometer. Licht braucht in Glasfaser rund fünf Mikrosekunden pro Kilometer, für Hin- und Rückweg also das Doppelte. Bei 300 Kilometern Entfernung sind das etwa drei Millisekunden, bevor auch nur ein einziger Switch, Router oder Software-Stack mitgerechnet ist.

**Gegen Lichtgeschwindigkeit hilft keine bessere Leitung. Nur eine kürzere.**

## Was es eigentlich ist — ein Subnetz, das in deiner Halle steht

Der häufigste Denkfehler bei Outposts ist, es für eine kleine private AWS-Region zu halten. Ist es nicht. Ein Outpost ist eine **Erweiterung einer Availability Zone deiner bestehenden Region**, und das zeigt sich an der Stelle, an der Infrastruktur konkret wird:

```json
{
  "OutpostArn": "arn:aws:outposts:eu-central-1:1234:outpost/op-0abc123",
  "AvailabilityZone": "eu-central-1a",
  "Subnet": {
    "SubnetId": "subnet-0fab12",
    "VpcId": "vpc-0aa77",
    "CidrBlock": "10.0.16.0/24",
    "OutpostArn": "arn:aws:outposts:eu-central-1:1234:outpost/op-0abc123"
  },
  "LocalGatewayRouteTableId": "lgw-rtb-0dd45"
}
```

Lies die Zeilen einzeln. Der ARN beginnt mit `eu-central-1` — der Outpost gehört zu dieser Region und zu keiner anderen. `AvailabilityZone` verweist auf eine ganz normale AZ. `VpcId` ist die VPC, in der auch deine Instanzen in Frankfurt laufen. Das Subnetz hat einen CIDR-Block aus demselben Adressraum.

Der einzige Unterschied zu jedem anderen Subnetz deiner VPC ist die Zeile `OutpostArn` im Subnetz — und die bedeutet: Alles, was du hier startest, läuft auf dem Rack in deiner Halle.

Der Befehl dafür ist derselbe wie in der Region:

```
aws ec2 run-instances --subnet-id subnet-0fab12 --instance-type m5.2xlarge
```

Kein anderer Endpoint, keine andere CLI, keine andere IAM-Logik. Genau das meint der Kartentext `gleiche APIs wie Region`, und genau darin liegt der Wert: Dein Team muss nichts Neues lernen, deine Terraform-Module funktionieren, deine Pipelines auch.

## Der Weg durch die Karte

### Kasten links — die Fertigungsstraße

`SPS · Kameras`, `Echtzeit-Steuerung`.

Das ist die Anforderung, aus der alles andere folgt. Eine Kamera nimmt ein Bauteil auf, die Bildverarbeitung entscheidet „gut oder Ausschuss", und die Weiche muss umschalten, bevor das Teil sie passiert hat. Der Regelkreis hat ein hartes Zeitbudget.

Das Bild dazu: ein Gespräch über eine Satellitenverbindung. Ihr fallt euch ständig ins Wort — nicht weil einer langsam denkt, sondern weil der Weg lang ist. Bei einem Gespräch ist das lästig. Bei einer Weiche, die in zehn Millisekunden schalten muss, ist die Charge Ausschuss.

Dazu kommt die zweite Anforderung, die man leicht übersieht, weil sie nichts mit Latenz zu tun hat: **Die Rohdaten dürfen das Werksgelände nicht verlassen.** Auch wenn die Leitung schnell genug wäre, wäre die Region damit ausgeschlossen.

### Badge 1 — < 10 ms zum Rack

Der Pfeil geht von der Fertigungsstraße direkt auf `EC2 auf Outposts`. Kein Umweg, keine Zwischenstation, wenige Meter Kabel im Werksnetz.

Zur Zahl selbst eine Einordnung, die ehrlich gemeint ist: `< 10 ms` ist hier die **Anforderung aus dem Szenario**, keine Zusage von AWS. Es gibt für Outposts kein Latenz-SLA, weil die Latenz zwischen deiner Maschine und dem Rack von deinem Werksnetz abhängt — von deinen Switches, deiner Verkabelung, deiner Last. AWS liefert die kurze Strecke. Was daraus wird, entscheidet dein Netz.

### Der orange gestrichelte Rahmen — die Fabrikhalle

`AWS-eigene Hardware, von AWS betrieben, im Werk des Kunden`.

Drei Aussagen, und jede einzelne ist prüfungsrelevant.

**AWS-eigene Hardware:** Du kaufst sie nicht. Sie gehört AWS, auch wenn sie bei dir steht. Du bezahlst Kapazität über eine Laufzeit.

**Von AWS betrieben:** Firmware, Patches, Ersatzteile, Überwachung der Hardware — das macht AWS, per Fernwartung und mit Technikern vor Ort. Du stellst Strom, Kühlung, Stellfläche und Netzanbindung.

**Im Werk des Kunden:** Das ist der Unterschied zu allem anderen in der AWS-Landschaft. Nicht in der Nähe. Nicht in der Metro-Region. In deinem Gebäude.

### Kasten — EC2 auf Outposts

`Steuerungs-App`, `Bildverarbeitung`, `gleiche APIs wie Region`.

Hier läuft die Arbeit. Und die dritte Zeile ist der eigentliche Verkaufsgrund von Outposts gegenüber jedem beliebigen Industrieserver, den du selbst hinstellen könntest: Ein eigener Server in der Halle wäre schneller beschafft und billiger. Aber dann hast du ein zweites Betriebsmodell — eigene Patches, eigenes Monitoring, eigene Sicherheitsprozesse, eigene Werkzeuge.

Outposts kostet mehr und spart dir das zweite Betriebsmodell.

### Badge 2 — Local Gateway

`Traffic bleibt lokal`, `kein Umweg über Region`.

Das Local Gateway ist der Bestandteil, den man beim ersten Lesen für Beiwerk hält und der in Wahrheit die ganze Konstruktion trägt.

Ohne LGW wäre der Outpost ein Subnetz deiner VPC — und Verkehr aus einer VPC zu einem Gerät im Werksnetz würde den Weg nehmen, den VPC-Verkehr eben nimmt: über die Region und wieder zurück. Damit wäre die kurze Strecke wieder eine lange, und der ganze Zweck dahin.

Das LGW ist der Ausgang aus dem Outpost-Subnetz direkt in dein lokales Netz. Es hat eine eigene Routentabelle, spricht BGP mit deinen Routern, und der Verkehr zwischen SPS und Instanz verlässt das Gebäude nie.

Das Bild dazu: Der bevollmächtigte Mitarbeiter hat eine Tür zur Werkshalle, nicht nur ein Telefon in die Zentrale.

### Badge 3 — EBS / S3 on Outposts

`Rohdaten lokal`, `Data Residency erfüllt`.

Der Pfeil geht von der Compute-Instanz nach unten in den lokalen Speicher. Das ist die Antwort auf die zweite Anforderung: Die Bilddaten der Qualitätsprüfung liegen auf Volumes und in Buckets, die physisch im Rack in der Halle stehen.

S3 on Outposts ist dabei nicht dasselbe wie S3 in der Region — anderer Endpoint, anderes Zugriffsmodell über Access Points, andere Speicherklassen, und die Kapazität ist begrenzt durch das, was im Rack steckt. Elastisch ist daran nichts. Was du bestellt hast, hast du.

Auf der Karte steht `nur Aggregate gehen später in die Region` sinngemäß im Ablauf der Altdatei, und das ist das übliche Muster: Rohbilder bleiben, Kennzahlen wandern.

### Badge 4 — Service Link zur Region

Der gestrichelte Pfeil nach rechts, beschriftet `(Mgmt · Sync)`.

Über den Service Link redet der Outpost mit seiner Parent Region. Was darüber läuft, ist ausschließlich die **Steuerungsebene**: Wenn du eine Instanz startest, geht der API-Aufruf an den regionalen EC2-Endpoint, und die Region weist den Outpost an, sie zu starten. Auch CloudWatch-Metriken, CloudTrail-Einträge, IAM-Entscheidungen und die Konsolenansicht kommen von dort.

Auf der Karte steht im Region-Kasten `Outpost braucht die Region als Anker`. Das ist korrekt und wichtig — dazu gleich mehr, denn an dieser Stelle widerspricht sich die Karte selbst.

Zur Zahl `30–100 ms` im Region-Kasten: Das ist eine **Größenordnung ohne AWS-Primärquelle**. Sie soll zeigen, dass die Region für einen Echtzeit-Regelkreis zu weit weg ist, und in dieser Rolle ist sie brauchbar. Als belastbarer Wert ist sie es nicht — die tatsächliche Latenz zu `eu-central-1` hängt von deinem Standort und deiner Anbindung ab und liegt aus Deutschland üblicherweise deutlich unter dem oberen Ende dieser Spanne. Merk dir die Aussage, nicht die Zahl.

### Der grüne Kasten — Betrieb bei WAN-Ausfall

`Produktion läuft weiter`, `lokale Workloads autark`.

Die erste Zeile stimmt. Fällt der Service Link aus, laufen bereits gestartete Instanzen weiter, verarbeiten weiter, schreiben weiter auf lokalen Speicher. Die Fertigung merkt nichts.

**Die zweite Zeile ist falsch, und zwar auf eine Weise, die im selben Artefakt widerlegt wird.** „Autark" heißt selbstständig, unabhängig, ohne fremde Hilfe. Genau das ist ein Outpost nicht. Der Region-Kasten auf derselben Karte sagt es ausdrücklich: `Outpost braucht die Region als Anker`. Und die Altdatei `battle_card_9.md` führt es unter ihren Klassiker-Fallen sogar wörtlich auf — „Outpost ist nicht autark gedacht".

**Auf der Karte steht „lokale Workloads autark" — richtig ist „lokale Workloads laufen weiter".**

Der Unterschied ist kein Wortklauben, sondern genau der Prüfungsstoff. Was bei getrenntem Service Link nicht mehr geht:

- keine neuen Instanzen starten, keine bestehenden neu starten
- keine EBS-Volumes anlegen oder anhängen
- keine API-Aufrufe, keine Konsole, kein Terraform
- keine CloudWatch-Metriken, keine CloudTrail-Einträge in der Region
- kein Zugriff auf regionale Dienste

Eine Instanz, die während des Ausfalls abstürzt, kommt nicht wieder hoch. Für eine Fertigung, die tagelang ohne WAN laufen soll, ist das ein Risiko, das man kennen muss — und der Grund, warum eine redundante Anbindung, typischerweise über Direct Connect, zur Outposts-Planung gehört.

### Die verworfenen Wege

**Local Zone** — durchgestrichen mit `zu weit`. Eine Local Zone ist ein AWS-Standort in einem Ballungsraum, nah bei Endnutzern. AWS beziffert das Netz selbst als über 30 Metros weltweit. Sie löst „Gamer in Hamburg brauchen niedrige Latenz". Sie löst nicht „SPS in meiner Halle braucht niedrige Latenz", weil sie eben nicht in deiner Halle steht, und sie löst die Data-Residency-Anforderung nicht, weil die Daten das Gelände verlassen.

**Nur Region + Direct Connect** — durchgestrichen mit `löst Latenz nicht`. Direct Connect gibt dir eine dedizierte, private, vorhersagbare Leitung. Das ist wertvoll, und für den Service Link ist es die richtige Wahl. Aber die Entfernung bleibt dieselbe. Auf der Karte steht dazu `Physik: < 10 ms nicht erreichbar` — und das ist die ehrlichste Zeile auf dem ganzen Bild.

## Die entscheidende Unterscheidung

Drei Dienste bringen AWS näher an jemanden heran. Die Frage ist immer: näher an **wen**?

| | Outposts | Local Zones | Wavelength |
|---|---|---|---|
| Steht | in deinem Gebäude | im Ballungsraum | im Rechenzentrum eines Telco-Partners |
| Nah bei | deinen Maschinen und Systemen | deinen Endnutzern in der Metro | Geräten im Mobilfunknetz |
| Betrieben von | AWS, bei dir vor Ort | AWS, eigener Standort | AWS, in fremdem Gebäude |
| Data Residency auf dem Gelände | ja | nein | nein |
| Läuft bei WAN-Ausfall weiter | ja, eingeschränkt | nicht relevant | nicht relevant |
| Typisches Stichwort | „im eigenen Werk", „Daten dürfen nicht raus" | „Endnutzer", „Gaming", „Streaming" | „5G", „mobile Endgeräte" |

Die Zeile „Nah bei wem" ist der Schlüssel. Wenn die Aufgabe von Maschinen, Produktionsanlagen, einem bestehenden Rechenzentrum oder Daten spricht, die ein Gelände nicht verlassen dürfen, ist Outposts gemeint. Sobald von Endnutzern die Rede ist, ist es eine Local Zone.

## Die ehrliche Feinheit

**Erstens: Den kleinen Formfaktor gibt es für Neukunden nicht mehr.**

Auf die Aufgabe „Fabrikhalle, wenig Platz, kein Rechenzentrum" ist die intuitive Antwort ein kompakter Server im Schaltschrank. Outposts gab es dafür in zwei Größen: als 1U- und als 2U-Gerät, für Filialen, Arztpraxen, Werkshallen.

**AWS hat den Verkauf beider Server eingestellt.** Neukunden werden für das ursprüngliche Server-Angebot nicht mehr angenommen, betroffene Bestandskunden werden bei der Migration auf Outposts Racks unterstützt. Als Begründung nennt AWS, die Fähigkeiten des Racks künftig in kleineren Leistungs- und Platzklassen anbieten zu wollen, inklusive neuer Formfaktoren für beengte Umgebungen — ohne Produkt und ohne Datum.

Für diese Karte heißt das: Das Bild zeigt ein `AWS OUTPOSTS RACK`, und das ist richtig. Es ist inzwischen sogar der einzige Weg. Für die Prüfung heißt es etwas anderes: Fragen und Vorbereitungsmaterial führen die Server-Formfaktoren weiterhin, und in einer Prüfungsfrage bleibt „Outposts Server für den Standort mit wenig Platz" eine plausible richtige Antwort. **Kenne beide Stände — den der Prüfung und den der Realität — und verwechsle sie nicht.**

Praktisch bedeutet es außerdem, dass die Einstiegshürde gestiegen ist. Ein 42U-Rack braucht Stellfläche, Starkstrom und Kühlung. Eine Werkshalle hat das oft, ein Verkaufsraum nicht.

**Zweitens: Der Kartenkasten „autark" ist die eine Stelle, an der du dir das falsche Wort merken könntest.** Siehe oben — laufen weiter, ja; unabhängig, nein.

**Drittens: Outposts ist keine Hochverfügbarkeitslösung.**

Ein Outpost hängt an genau einer Availability Zone. Fällt diese AZ aus, verlierst du die Steuerungsebene für dein Rack. Und das Rack selbst steht an einem einzigen Ort — deinem. Brennt die Halle, ist die Verfügbarkeit deiner Anwendung dein Problem, nicht das von AWS. Wer Ausfallsicherheit über Standorte braucht, braucht mehrere Outposts oder eine Kombination aus Outpost und Region.

**Viertens, zur Abgrenzung von Wavelength:** Die Karte stellt es im Footer als `5G-Edge` dar. Das war die ursprüngliche Positionierung und ist als Prüfungs-Merksatz weiterhin brauchbar. AWS beschreibt Wavelength inzwischen breiter — als Infrastruktur in den Rechenzentren von Telco-Partnern, die neben niedriger Latenz auch Datenresidenz und Resilienz adressiert. Für die Abgrenzung auf dieser Karte ändert das nichts: Es steht im Gebäude eines Providers, nicht in deinem.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur nicht entsteht:

- kein eigenes Rechenzentrum mit eigenem Betriebsmodell
- keine zweite Werkzeugkette für „lokal" neben der für „Cloud"
- kein eigenes Patch- und Firmware-Management für die Hardware
- keine Hardware-Beschaffung, keine Ersatzteilhaltung
- keine VPN- oder Tunnel-Konstruktion, damit lokale Geräte die Anwendung erreichen — das macht das Local Gateway
- keine getrennte IAM-Welt; es gelten dieselben Rollen und Policies wie in der Region

Was du stellst: Stellfläche, Strom, Kühlung, Netzanbindung — und die Bereitschaft, dich für Jahre zu binden.

## Wenn du dir eine Sache merkst

**Outposts bringt AWS in dein Gebäude; Local Zones bringt AWS näher an deine Nutzer.**

Direct Connect macht die Leitung stabil, aber nicht kürzer. CloudFront cacht Inhalte für Leser und kann eine Regelschleife zur Maschine nicht zwischenspeichern. Wavelength steht im Netz eines Mobilfunkanbieters, nicht in deiner Halle. Und ein Outpost läuft bei WAN-Ausfall weiter, ohne deshalb unabhängig zu sein.

## Prüfungsknackpunkte

**Signalwörter:** „im eigenen Werk", „im eigenen Rechenzentrum", „Daten dürfen das Gelände nicht verlassen", „einstellige Millisekunden zur Maschine", „gleiche AWS-APIs on-premises". Sobald ein *eigenes Gebäude* vorkommt, ist Outposts die Richtung.

**Das Gegensignal:** „Endnutzer", „Kunden in der Metro-Region", „Gaming", „Live-Streaming", „Virtual Workstations". Dann Local Zones. Der Text sagt dir immer, wer nah dran sein muss.

**Warum Local Zones hier verliert:** Sie stehen im Ballungsraum, nicht auf deinem Gelände. Weder die Anforderung an die Maschinenlatenz noch die Data-Residency-Anforderung wird damit erfüllt.

**Warum Direct Connect hier verliert:** Es adressiert Stabilität, Bandbreite und Privatheit der Verbindung — nicht die Entfernung. Als *Ergänzung* zu Outposts ist es richtig und für den Service Link sogar empfohlen. Als Alternative ist es falsch.

**Warum Wavelength hier verliert:** Es sitzt in der Infrastruktur eines Telekommunikationsanbieters und zielt auf Endgeräte im Mobilfunknetz. Eine SPS in einer Werkshalle ist kein Mobilfunkteilnehmer.

**Warum CloudFront hier verliert:** Ein CDN verkürzt den Weg zu *auslieferbaren Inhalten*. Eine Entscheidung, die aus einem Kamerabild in Echtzeit berechnet wird, existiert vorher nicht und kann deshalb nicht gecacht werden.

**Warum IoT Greengrass nicht dasselbe ist:** Greengrass bringt Lambda-Funktionen und Machine-Learning-Inferenz auf ein Gerät am Rand und ist für Edge-Verarbeitung eine ernsthafte Alternative. Es liefert aber keine EC2-Instanzen, keine EBS-Volumes und keine regionsgleichen APIs. Wenn die Aufgabe „dieselben AWS-Dienste wie in der Region" verlangt, ist es Outposts; wenn sie „schlanke Verarbeitung direkt auf dem Gerät" verlangt, ist Greengrass die bessere Antwort.

**Warum die Snow Family hier verliert:** Sie ist für Datentransport und für abgesetzte, zeitlich begrenzte Einsätze gedacht, nicht für den Dauerbetrieb einer Fertigungslinie mit regionsgleichem Betriebsmodell.
