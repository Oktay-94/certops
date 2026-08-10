---
cardNumber: 34
slug: nat-gateway-vpc-endpoints-nordlicht-analytics-kostenschwelle
title: "NAT Gateway vs VPC Endpoints — ab wann sich ein Endpoint rechnet"
services:
  - Amazon VPC
  - NAT Gateway
  - Gateway VPC Endpoint
  - Interface VPC Endpoint
  - Amazon S3
  - Amazon ECR
domains:
  - D3
  - D4
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://aws.amazon.com/vpc/pricing/"
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/aws-nat-gateway-regional-availability"
  - "https://aws.amazon.com/blogs/networking-and-content-delivery/introducing-amazon-vpc-regional-nat-gateway"
  - "https://aws.amazon.com/network-firewall/pricing/"
---

## Die Grundidee zuerst

Stell dir eine Werkshalle vor, die nur einen einzigen Ausgang hat. Ein Pförtner sitzt daneben. Jede Kiste, die das Gebäude verlässt, geht an ihm vorbei, er notiert sie, und für jede notierte Kiste stellt er dir am Monatsende etwas in Rechnung. Egal, wohin sie geht.

Das Kuriose an dieser Halle: Der Nachbarbau gehört derselben Firma. Er steht zwanzig Meter weiter, es gibt eine Verbindungstür, und trotzdem tragen deine Leute jede Kiste erst durch den Haupteingang, an dem Pförtner vorbei, außen ums Gebäude herum und wieder hinein. Nicht aus Dummheit — sondern weil beim Bau nur ein Weg eingezeichnet wurde und niemand ihn seither angesehen hat.

Das ist ein NAT Gateway in einer VPC, deren private Subnetze eine Default-Route ins Internet haben. Der Pförtner ist die Datenverarbeitungsgebühr. Der Nachbarbau ist S3.

**Ein Gateway Endpoint ist die Verbindungstür.** Kein neues Gebäude, kein zweiter Pförtner, kein Umbau: ein Eintrag in der Route Table, der sagt „für diese Ziele gehst du direkt hinüber". Und für S3 und DynamoDB kostet diese Tür nichts.

Das ist die ganze Karte. Der Rest ist die Frage, für welche Ziele sich eine solche Tür lohnt — denn für alles außer S3 und DynamoDB ist sie nicht mehr gratis, sondern eine Rechnung, die man aufmachen muss.

## Was es eigentlich ist — zwei Objekte mit demselben Namen

„VPC Endpoint" bezeichnet zwei völlig verschiedene Dinge. Der Unterschied ist kein Detail, er entscheidet die Kostenfrage.

Ein **Gateway Endpoint** ist kein Gerät. Er hat keine IP-Adresse, kein Interface, keine Availability Zone. Er ist ein Zielobjekt in einer Route Table:

```text
Route Table  rtb-priv-a  (eu-central-1a)
  10.0.0.0/16               local
  pl-6ea54007  (S3)         vpce-0a1b2c3d      <- die Tuer
  0.0.0.0/0                 nat-08f2e1d9       <- der Pfoertner
```

Die mittlere Zeile ist der ganze Mechanismus. `pl-6ea54007` ist eine **Prefix List** — eine von AWS gepflegte Liste aller IP-Bereiche, unter denen S3 in dieser Region antwortet. Weil sie spezifischer ist als `0.0.0.0/0`, gewinnt sie beim Longest-Prefix-Match. Der Verkehr biegt ab, bevor er den NAT je sieht.

Ein **Interface Endpoint** ist das Gegenteil: eine Elastic Network Interface mit einer privaten IP aus deinem Subnetz, pro AZ eine. Ein echtes Objekt, das man in der Konsole anfassen kann — und für das eine Stundengebühr läuft, solange es existiert.

**Der eine ist eine Wegweisung, der andere ist Hardware.** Daraus folgt der komplette Rest der Karte: Wegweisungen kosten nichts, Hardware kostet pro Stunde und pro AZ.

## Der Weg durch die Karte

### Der Kasten links — Nordlicht Analytics in drei AZs

`3 AZs, keine Public IPs`, `Analytics-Cluster`, `11,4 TB pro Monat`. Ein Datenplattform-Cluster in privaten Subnetzen über drei Availability Zones. Keine Instanz hat eine öffentliche Adresse, keine ist aus dem Internet erreichbar — genau so soll es sein.

Nur: „nicht erreichbar" heißt nicht „redet nicht". Der Cluster schreibt nach S3, holt Container-Images, schickt Logs und ruft ein paar externe APIs. Alles davon ist ausgehender Verkehr, und ausgehender Verkehr aus einem privaten Subnetz braucht einen Weg nach draußen.

### Badge 1 — heute geht alles über den NAT

Der Pfeil trägt die Beschriftung `heute: alles über NAT`. Das ist der Ist-Zustand, und er ist nicht das Ergebnis einer Entscheidung. Der VPC-Assistent legt für private Subnetze eine Default-Route auf das NAT Gateway an. Niemand hat je gesagt „S3-Verkehr soll bitte über den NAT laufen" — es ist einfach der einzige eingezeichnete Weg.

Merk dir das als Fragenmuster: Wenn eine Aufgabe schreibt „private subnets with no internet access" und gleichzeitig eine hohe NAT-Rechnung erwähnt, ist fast immer genau diese Default-Route gemeint.

### Der NAT-Kasten — die Gebühr, die zweimal zuschlägt

`$0,045 je Stunde und AZ`, `$0,045 je GB`. Zwei Zahlen, zwei völlig verschiedene Kostenarten.

Die **Stundengebühr** läuft, solange das Gateway existiert. Drei AZs bedeuten drei Gateways, und die drei kosten zusammen rund $98 im Monat, auch wenn kein einziges Byte fließt.

Die **Datenverarbeitungsgebühr** fällt pro verarbeitetem GB an, in beide Richtungen, unabhängig von Quelle und Ziel. Das ist die Zeile, die Rechnungen sprengt.

Rechne den Schnittpunkt einmal selbst: 730 Stunden × $0,045 ergibt $32,85 fix. Dieselbe Summe erreicht die Datenverarbeitung bei **730 GB**. Alles darüber macht die Verarbeitung zum größeren Posten — und ein Analytics-Cluster bewegt nicht 730 GB, sondern das Fünfzehnfache.

**Wichtig zur Region:** Diese Sätze stammen aus dem AWS-Preisbeispiel für **US East (Ohio)**. Das Szenario spielt in `eu-central-1`, wo die Sätze höher liegen. Die AWS-Preistabelle ist JS-gerendert und nicht abrufbar, deshalb steht hier keine Frankfurt-Zahl. Nimm die Beträge als Größenordnung — die Verhältnisse und Formeln gelten unabhängig von der Region.

### Badge 2 und der gestrichelte Kasten — was wirklich ins Internet muss

`Internet`, `300 GB / Monat`, gestrichelt gezeichnet. Von 11,4 TB sind das noch 2,6 Prozent. Betriebssystem-Updates, ein paar Partner-APIs, DNS-Kram.

Der Kasten steht auf der Karte, damit klar wird: **Der NAT bleibt.** Diese Karte handelt nicht davon, ihn abzuschaffen, sondern davon, ihn zu entlasten. Wer ihn löscht, nimmt dem Cluster die Updates.

### Badge 3 — S3 wandert auf den Gateway Endpoint

`S3 Gateway Endpoint`, `kostenlos`, `nur Route-Table-Eintrag`. AWS schreibt es auf der eigenen Preisseite ausdrücklich hin: Für Gateway Endpoints gibt es weder Datenverarbeitungs- noch Stundengebühren.

8 TB verlassen damit die NAT-Rechnung ersatzlos. **Das ist die mit Abstand ertragreichste Maßnahme der ganzen Karte, und sie erfordert keine Zeile Anwendungscode** — kein neuer Endpunkt, kein SDK-Update, keine Änderung an einer Bucket-Referenz. Die Anwendung spricht weiter `s3.eu-central-1.amazonaws.com` an; nur der Weg dorthin ist ein anderer.

Gateway Endpoints gibt es ausschließlich für **S3 und DynamoDB**. Diese Liste ist seit Jahren unverändert und ein beliebtes Prüfungsdetail.

### Badge 4 — ECR bekommt Interface Endpoints, und zwar zwei

`ecr.api + ecr.dkr`, `$0,01/h je AZ + $0,01/GB`. Hier fängt das Rechnen an.

ECR braucht **zwei** Endpoints: `ecr.api` für die Steuerbefehle, `ecr.dkr` für das Docker-Protokoll. Über drei AZs sind das sechs ENIs. Sechs × 730 h × $0,01 = $43,80 fix, dazu 2.560 GB × $0,01 = $25,60. Zusammen $69,40 gegen $115,20 über den NAT. **Ersparnis rund $46.**

Ein Nebeneffekt, den Kursmaterial fast immer unterschlägt: Die eigentlichen Image-Layer holt ECR aus S3. Dieser Anteil läuft bereits über den kostenlosen Gateway Endpoint aus Badge 3 — die Interface Endpoints tragen nur den kleineren Rest.

### Badge 5 und das rote X — CloudWatch Logs bleibt, wo es ist

`bleibt auf NAT`, darunter `400 GB / Monat`, und unter den Interface Endpoints ein rotes X mit `400 GB — unter der Schwelle`.

Rechne mit: Über den NAT kosten 400 GB × $0,045 = **$18**. Über einen Interface Endpoint in drei AZs: $21,90 fix plus 400 × $0,01 = $4, zusammen **$25,90**. Der Endpoint ist teurer. Er würde die Rechnung um rund $8 erhöhen.

**Das X markiert eine verworfene Option, keinen Ausfall.** Genau diese Verwechslung ist in Prüfungsfragen eingebaut: Ein Endpoint ist kein Sparknopf, den man überall drückt.

### Badge 6 und die Kostenbox — was übrig bleibt

`vorher: 3 NAT, 11,4 TB ≈ $614`, `nachher ≈ $199`. Aus rund $614 werden rund $199, etwa 67 Prozent weniger. Der NAT läuft weiter, er trägt nur noch die 700 GB, für die es keine Alternative gibt.

Darunter steht die Zahl, um die es der Karte eigentlich geht: `Break-even Interface-Endpoint: 626 GB je Monat und Dienst`.

### Die Merksätze-Fußzeile

`Gateway-Endpoint für S3 und DynamoDB ist gratis · Interface-Endpoint lohnt ab ~626 GB/Monat · S3 in derselben Region: kein Egress`.

Drei Sätze, die zusammen fast jede Kostenfrage zu diesem Thema erschlagen. Der dritte ist der unbekannteste und steht im nächsten Abschnitt.

## Die entscheidende Unterscheidung

| | **Gateway Endpoint** | **Interface Endpoint** |
|---|---|---|
| Was es ist | Route-Table-Eintrag auf eine Prefix List | ENI mit privater IP, eine je Subnetz |
| Dienste | nur S3 und DynamoDB | über 100 AWS-Dienste, auch PrivateLink-SaaS |
| Stundengebühr | keine | je Endpoint, **je AZ** |
| Datenverarbeitung | keine | pro GB, gestaffelt |
| Aus gepeerter VPC | nein | ja |
| Von on-premises | nein | ja |
| Entscheidung | immer anlegen | erst ab einer Volumenschwelle |

Die letzte Zeile ist die Kernaussage der Karte. Ein Gateway Endpoint braucht keine Wirtschaftlichkeitsrechnung — er kostet nichts und kann nichts verschlechtern. Ein Interface Endpoint braucht sie immer.

Die Zugriffsfrage — *welcher Typ geht überhaupt woher* — ist die Achse von Karte 20. Dort steht auch die Begründung, warum ein Gateway Endpoint aus einer gepeerten VPC nicht funktioniert. Diese Karte setzt darauf auf und beantwortet nur noch: *ob es sich lohnt.*

## Die ehrliche Feinheit

Die verbreitetste Zahl zu diesem Thema ist für den häufigsten Fall falsch.

In vielen gut rankenden Artikeln steht, NAT-Verkehr koste $0,135 pro GB: $0,045 Datenverarbeitung plus $0,09 Internet-Egress. Das stimmt — **für Ziele im Internet.** AWS' eigenes Preisbeispiel rechnet den S3-Fall durch und kommt zu einem anderen Ergebnis: Der Transfer von EC2 nach S3 in derselben Region ist kostenlos, und auch zwischen NAT und Instanz fällt nichts an, solange beide in derselben AZ liegen. Für S3-Verkehr über den NAT bleibt allein die Verarbeitung von $0,045/GB.

Wer mit $0,135 rechnet, überschätzt die Ersparnis eines S3 Gateway Endpoints um den Faktor drei. Die Maßnahme bleibt richtig, die Zahl in der Vorlage fürs Management ist es nicht.

Zweite Feinheit: **Die Break-even-Schwelle skaliert mit den AZs, nicht mit dem Verkehr.** Die 626 GB kommen aus einer einzigen Zeile — ein Interface Endpoint in drei AZs kostet $21,90 fix und spart $0,035 pro GB gegenüber dem NAT, also $21,90 ÷ $0,035 = 626 GB. Bei einer AZ sinkt die Schwelle auf rund 209 GB, bei sechs AZs steigt sie über 1,2 TB. Wer dieselbe Zahl aus einer Single-AZ-Architektur in eine Multi-AZ-Architektur überträgt, legt Endpoints an, die Geld kosten.

Und weil auch die Schwelle aus den US-Sätzen abgeleitet ist: In Frankfurt verschiebt sie sich. Die Mechanik bleibt, die Zahl ist eine Größenordnung.

Dritte Feinheit, offen: Ein Preisrechner nennt einen „Provisioned"-Modus für NAT Gateway mit Gbps-Stunden-Preis und kostenloser Datenverarbeitung. Auf der AWS-Preisseite steht davon in den abrufbaren Abschnitten nichts — dort finden sich nur „NAT Gateway" und „Regional NAT Gateway". Das reicht nicht für eine Aussage. Für die Prüfung ist es ohnehin belanglos; hier steht es, damit du weißt, dass es offen ist und nicht übersehen wurde.

## Syntax lesen — woran du eine Prefix List erkennst

Wenn dir in einer Route Table oder Endpoint Policy so etwas begegnet, ist das der Gateway-Endpoint-Mechanismus:

```text
pl-6ea54007     com.amazonaws.eu-central-1.s3
pl-02cd2c6b     com.amazonaws.eu-central-1.dynamodb
```

Links steht die von AWS verwaltete Prefix List — eine Sammlung der IP-Bereiche des Dienstes, die AWS aktualisiert, ohne dass du etwas tust. Rechts der Service-Name im Format `com.amazonaws.<region>.<service>`.

Zwei Ableitungen daraus, beide prüfungsrelevant:

**Erstens** ist der Gateway Endpoint an die Region gebunden, die im Namen steht. Ein Endpoint in `eu-central-1` bringt dich nicht an einen Bucket in `us-east-1` — dafür läuft der Verkehr wieder über den NAT.

**Zweitens** wirkt er über die Route Table **derjenigen VPC, in der er liegt**. Eine gepeerte VPC hat ihre eigene Route Table und kann den Eintrag nicht übernehmen. Das ist keine Rechtefrage, sondern Routing-Mechanik.

## Was du dadurch nicht baust

Zähl durch, was nach dem Umbau **nicht** existiert:

- keine Änderung an der Anwendung, keine neuen Endpunkte im Code
- kein zusätzliches Gerät im Datenpfad für S3 — der Gateway Endpoint ist keins
- keine Verschlüsselungs- oder Firewall-Funktion; ein Endpoint filtert nichts
- keine Verbindung aus einer gepeerten VPC oder von on-premises auf den Gateway Endpoint
- kein Zugriff auf Buckets in anderen Regionen über diesen Endpoint
- keine Abschaffung des NAT Gateways — 700 GB brauchen ihn weiter
- keine Kostensenkung durch Endpoint Policies; die sind Sicherheitswerkzeug

Übrig bleiben zwei Route-Table-Einträge, sechs ENIs für ECR und eine Rechnung, die ein Drittel der alten beträgt.

## Wenn du dir eine Sache merkst

**Gateway Endpoint für S3 und DynamoDB immer — Interface Endpoint erst ab rund 626 GB pro Monat und Dienst, und diese Schwelle steigt mit jeder Availability Zone.**

Ein zweiter NAT hilft nicht, er verdoppelt die Stundengebühr. Route-Table-Feintuning hilft nicht, solange die Default-Route steht. Und ein Interface Endpoint für einen Dienst mit 50 GB Monatsvolumen kostet in drei AZs $21,90 statt $2,25 — das ist die Falle, die auf der Karte als rotes X steht.

## Prüfungsknackpunkte

**Signalwörter für den Gateway Endpoint:** „most cost-effective way to access S3" · „minimize NAT Gateway charges" · „no changes to the application" · „private subnets without internet access". Sobald S3 oder DynamoDB im Spiel sind und das Wort Kosten fällt, ist es der Gateway Endpoint.

**Signalwörter für den Interface Endpoint:** ein anderer AWS-Dienst als S3 oder DynamoDB · Zugriff aus einer gepeerten VPC · Zugriff von on-premises über Direct Connect oder VPN.

**Warum „ein weiteres NAT Gateway" hier verliert:** Es senkt keine Datenverarbeitung, es fügt eine weitere Stundengebühr hinzu. Mehr NAT heißt immer mehr Fixkosten.

**Warum „Regional NAT Gateway" in einer Kostenfrage verliert:** Seit dem **19.11.2025** gibt es diesen Modus. Ein NAT Gateway dehnt sich automatisch über die AZs aus, in denen Workloads liegen, und zieht sich zurück, wenn sie verschwinden; ein Public Subnet ist nicht mehr nötig, Route-Table-Pflege bei neuen AZs entfällt. Abgerechnet wird aber weiterhin **pro AZ-Stunde** — AWS sagt das auf der Preisseite ausdrücklich. Es ist eine Betriebsvereinfachung, keine Kostensenkung. Nebenbei: Die Ausdehnung in eine neue AZ dauert bis zu 60 Minuten, bis dahin läuft der Verkehr cross-zone.

**Warum „Endpoint Policy" hier verliert:** Sie beschränkt, *wer worauf zugreifen darf*. Sie beeinflusst kein Routing und keinen Preis.

**Warum „VPC Peering zu einer Shared-Services-VPC mit Endpoint" verliert:** Für Gateway Endpoints geht das nicht — die Route Table der gepeerten VPC kennt den Eintrag nicht. Für Interface Endpoints geht es, ist aber eine andere Frage als die nach Kosten.

**Die Zwei-Endpoints-Falle:** ECR braucht `ecr.api` **und** `ecr.dkr`, SSM sogar drei (`ssm`, `ssmmessages`, `ec2messages`). Antwortoptionen, die von *einem* Endpoint pro Dienst ausgehen, rechnen die Fixkosten zu niedrig.
