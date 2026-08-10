---
cardNumber: 20
slug: s3-access-points-vpc-endpoints-helios-datalake
title: "S3 Access Points + VPC Endpoints — ein Bucket, viele Teams, privater Traffic"
services: ["Amazon S3 Access Points", "S3 Gateway VPC Endpoint", "S3 Interface VPC Endpoint", "AWS PrivateLink", "S3 Bucket Policy", "AWS Direct Connect"]
domains: ["D1", "D3", "D4"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-points-restrictions-limitations.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/privatelink-interface-endpoints.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies-vpc-endpoint.html"
  - "https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html"
  - "https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-basics.html"
  - "https://aws.amazon.com/blogs/security/iam-policies-and-bucket-policies-and-acls-oh-my-controlling-access-to-s3-resources/"
---

## Die Grundidee zuerst

Stell dir ein Bürogebäude mit genau einer Tür vor.

**Vorher:** Am Empfang liegt eine Besucherliste. Anfangs sind es zwei Seiten.
Dann zieht die Buchhaltung ein, dann das Labor, dann ein externer Dienstleister,
und jeder braucht Sonderregeln — dieser darf nur ins zweite Obergeschoss, jener
nur lesen, der dritte nur dienstags. Nach drei Jahren hat die Liste
zweihundertvierzig Einträge. Niemand traut sich mehr, etwas zu streichen, weil
keiner weiß, wessen Zugang daran hängt. Und der Ordner hat einen Deckel: Passt
kein Blatt mehr rein, kommt niemand Neues mehr ins Haus.

**Nachher:** Du baust jedem Team einen **eigenen Eingang** mit eigenem Schild und
eigener, kurzer Liste. Am Haupteingang steht dann nur noch ein Satz: „Wer durch
einen unserer Eingänge kommt, ist geprüft." Die Buchhaltung ändert ihre Liste,
ohne dass das Labor davon erfährt.

Das ist ein S3 **Access Point** — und der wichtigste Satz gleich vorweg: Es ist
**kein zweiter Datenbestand und kein Proxy**. Es ist ein zusätzlicher, benannter
Zugangsweg zu demselben Bucket, mit eigener Türsteher-Regel.

Der zweite Teil der Karte hat damit nichts zu tun und wird trotzdem ständig
damit verwechselt. Access Points regeln **wer was darf**. VPC Endpoints regeln,
**auf welchem Weg** der Verkehr fließt. Helios muss beides lösen: Die Policy ist
am Limit, und kein Byte darf über das öffentliche Internet gehen.

## Was es eigentlich ist

Die Umstellung ist im Kern ein Tausch von Policy-Masse gegen Policy-Struktur.
Vorher standen alle Regeln in der Bucket Policy. Nachher steht dort ein
Delegationssatz:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "DelegiereAnAccessPoints",
    "Effect": "Allow",
    "Principal": { "AWS": "*" },
    "Action": "s3:*",
    "Resource": [
      "arn:aws:s3:::helios-datalake",
      "arn:aws:s3:::helios-datalake/*"
    ],
    "Condition": {
      "StringEquals": { "s3:DataAccessPointAccount": "111122223333" }
    }
  }]
}
```

`Principal: "*"` sieht beim ersten Lesen falsch aus. Es ist es nicht — die
Condition trägt die ganze Last. Erlaubt wird nicht „jeder", sondern „jeder
Request, der über einen Access Point des Accounts `111122223333` kommt". Wer den
Bucket direkt anspricht, erfüllt die Condition nicht und fällt durch.

Die Feinsteuerung wandert in die Access Point Policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::111122223333:role/FinanceBI" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:us-east-1:111122223333:accesspoint/finance-ro/object/finance/*"
  }]
}
```

Ein Principal, eine Aktion, ein Präfix. Das passt auf einen Bildschirm, und
jemand kann es in fünf Minuten prüfen. Zweihundertvierzig Statements konnte das
niemand.

## Der Weg durch die Karte

### 1 — Data Science spricht einen Access-Point-Hostnamen an

Die Anwendung richtet sich nicht mehr an `bucket.s3.region.amazonaws.com`,
sondern an den Hostnamen des Access Points `ds-curated`. Das ist die einzige
Änderung im Code — ein anderer Endpoint, dieselben API-Aufrufe.

Auf der Karte steht in der Box „Network Origin: VPC". Das ist die Eigenschaft,
die den Access Point von einer reinen Policy-Aufteilung unterscheidet: Ein
Access Point mit VPC-Origin nimmt Requests **nur** aus der zugeordneten VPC an.
Kommt ein Request von woanders, weist S3 ihn ab — auch dann, wenn die IAM-Policy
des Aufrufers ihn erlauben würde. Das Bild dazu: ein Eingang, den es nur von der
Tiefgarage aus gibt. Von der Straße existiert diese Tür nicht.

### 2 — Der Traffic verlässt die VPC über den Gateway Endpoint

Der **S3 Gateway Endpoint** ist ein Eintrag in der Route Table. Traffic zu den
S3-Präfixen wird nicht ans Internet Gateway geschickt, sondern an den Endpoint.
Kein ENI, keine IP-Adresse, und der Endpoint kostet nichts.

Damit fallen Internet Gateway und NAT Gateway für S3-Zugriffe weg. Bei 8 PB ist
das nicht nur eine Compliance-Aussage, sondern eine Rechnung:
NAT-Gateway-Datenverarbeitung wird pro GB abgerechnet, und ein Data Lake bewegt
viele GB.

Die **Endpoint-Policy** ist der Teil, den man leicht übersieht. Ohne sie ist über
diesen Endpoint jeder Bucket in jedem Account erreichbar — auch fremde. Für
einen Data Lake mit Exfiltrationsrisiko ist das eine Tür, die man bewusst
zumacht.

### 3 — Die Bucket Policy delegiert

Statt zweihundertvierzig Statements steht in der Bucket Policy der eine Satz von
oben. Aus einem zentralen Monolithen wird eine Menge kleiner, unabhängig
änderbarer Regelwerke.

Und hier der Satz, den die Prüfung liebt: **Beide Policies müssen den Zugriff
erlauben.** Der Access Point kann keine Rechte erfinden, die die Bucket Policy
nicht delegiert hat. Er kann nur einschränken. Das Bild dazu: Der Nebeneingang
hat einen eigenen Türsteher, aber das Gebäude gehört ihm nicht — er kann
niemanden reinlassen, für den der Hausherr die Tür nicht freigegeben hat.

### 4 — Finance kommt über Direct Connect ins AWS-Netz

Das BI-Tool steht im eigenen Rechenzentrum. Die Anbindung liefert Direct
Connect, alternativ Site-to-Site VPN.

Wichtig ist, was dieser Schritt **nicht** löst. Direct Connect bringt dich ins
AWS-Netz. Es bringt dich nicht privat zu S3, denn S3 ist ein regionaler Service
mit öffentlichen Endpunkten und liegt nicht in deiner VPC. Ohne den nächsten
Schritt läuft der S3-Zugriff weiterhin über das öffentliche Internet, obwohl die
Leitung privat ist.

### 5 — Für Finance braucht es einen Interface Endpoint

Das ist die zentrale Abgrenzung der Karte. Ein Gateway Endpoint arbeitet über
die **Route Table einer VPC** — und ein Rechenzentrum hat keine
VPC-Route-Table. Damit ist der Weg strukturell zu, nicht wegen einer
Berechtigung.

Der **Interface Endpoint (AWS PrivateLink)** löst genau das: eine ENI mit
privater IP-Adresse in den Subnetzen deiner VPC. Weil sie eine private IP hat,
ist sie über Direct Connect erreichbar wie jede andere Adresse in der VPC. Die
S3-Dokumentation formuliert den Zweck so: Interface Endpoints erweitern die
Funktionalität von Gateway Endpoints, indem sie private IP-Adressen nutzen, um
Requests an S3 aus der VPC, von on-premises oder aus einer VPC in einer anderen
Region über VPC-Peering oder Transit Gateway zu routen.

Der Preis ist der Unterschied: Stundensatz je AZ plus GB-Preis, gegenüber einem
kostenlosen Gateway Endpoint.

### 6 — Der Access Point `finance-ro` lässt nur Lesezugriffe durch

Seine Policy erlaubt ausschließlich `s3:GetObject` und ausschließlich unter
`/finance`. Der Network Origin steht auch hier auf VPC, und der Access Point hat
eigene Block-Public-Access-Einstellungen — unabhängig von denen des Buckets.

Damit ist die Anforderung „darf ausschließlich lesen, und nur ihren Bereich"
nicht in einer IAM-Rolle irgendwo im Account kodiert, sondern am Zugangsweg
selbst. Wer den Hostnamen kennt, kann trotzdem nichts anderes tun.

### Verworfen — ein Gateway Endpoint für Finance

Der durchgestrichene Pfad ist die beliebteste falsche Antwortoption: „Legen Sie
einen S3 Gateway Endpoint an, damit das Rechenzentrum privat auf S3 zugreift."
Das funktioniert nicht, und zwar aus dem Grund aus Schritt 5 — nicht wegen
fehlender Rechte, sondern weil der Mechanismus an der VPC-Route-Table hängt.

### Der Footer-Kasten — die Gegenüberstellung

Der graue Kasten unten fasst zusammen, was die Prüfung tatsächlich abfragt. Er
ist an einer Stelle enger formuliert, als er sein sollte — dazu unten mehr.

## Die entscheidende Unterscheidung

| | **Gateway Endpoint** | **Interface Endpoint (PrivateLink)** |
|---|---|---|
| Technik | Eintrag in der Route Table | ENI mit privater IP im Subnetz |
| Kosten | keine | Stundensatz je AZ + GB-Preis |
| Services | nur S3 und DynamoDB | sehr viele AWS-Services |
| Aus der eigenen VPC | ja | ja |
| Von on-premises (DX/VPN) | **nein** | ja |
| Aus einer gepeerten VPC | **nein** | ja |
| Über Transit Gateway | **nein** | ja |
| Steuerung | Endpoint-Policy | Endpoint-Policy + Security Group |
| DNS | keine Änderung nötig | Private DNS oder eigener Hostname |

Die Zeile „Security Group" wird selten gefragt und ist trotzdem aufschlussreich:
Ein Interface Endpoint ist eine ENI, also ein Netzwerkobjekt in deinem Subnetz —
mit allem, was dazugehört. Ein Gateway Endpoint ist kein Objekt im Datenpfad,
sondern eine Routing-Entscheidung. Daraus folgt jede einzelne Zeile darüber.

## Die ehrliche Feinheit

**Die Karte ist beim VPC-Peering zu freundlich — und AWS ist es auch.** Im
Footer steht, ein Gateway Endpoint gehe nicht „aus gepeerten VPCs **anderer
Regionen**". Das legt nahe, aus einer gepeerten VPC derselben Region ginge es.
Hier widersprechen sich zwei offizielle AWS-Quellen. Der Übersichtstext der
Seite „Gateway endpoints for Amazon S3" nennt tatsächlich nur gepeerte VPCs
anderer Regionen. Die *Considerations* **derselben Seite** sagen dagegen
generisch: Endpoint-Verbindungen lassen sich nicht aus einer VPC herausziehen —
Ressourcen jenseits einer VPN-Verbindung, einer VPC-Peering-Verbindung, eines
Transit Gateway oder einer Direct-Connect-Verbindung können keinen Gateway
Endpoint für S3 nutzen. Und der VPC-Peering-Guide wird ganz konkret, ohne jede
Regionseinschränkung: Hat VPC A einen Gateway Endpoint für S3, können Ressourcen
in VPC B ihn nicht nutzen.

Die technisch präzise Aussage ist die strengere, und der Mechanismus erklärt
warum: Ein Gateway Endpoint wirkt über einen Eintrag in der Route Table **der
VPC, in der er liegt**. Eine gepeerte VPC hat ihre eigene Route Table, und
Peering trägt dort keinen Endpoint-Eintrag ein — unabhängig von der Region.

**Auf der Karte steht „nicht aus gepeerten VPCs anderer Regionen" — richtig ist
„nicht aus gepeerten VPCs".** Fixvorschlag für den Sammelpass: den Zusatz
„anderer Regionen" im Footer streichen. Für die Prüfung selbst ist die
Konsequenz dieselbe, weil dort fast immer nach on-premises gefragt wird.

**Der Access Point liegt nicht im Datenpfad, auch wenn die Karte ihn so
zeichnet.** Er ist als Box zwischen Endpoint und Bucket dargestellt, weil das
den Ablauf lesbar macht. Real ist er ein zusätzlicher benannter Endpunkt
derselben S3-Regionalinfrastruktur. Der Traffic fließt nicht „durch" ihn
hindurch wie durch einen Proxy, und du kannst ihn deshalb auch nicht überlasten
oder skalieren.

**Die VPC-Bindung ist eine Einbahnstraße.** Nach dem Anlegen eines Access Points
lässt sich seine VPC-Konfiguration nicht mehr ändern. Wer sich vertut, löscht
ihn und legt einen neuen an — was bedeutet, dass jede Anwendung mit dem alten
Hostnamen bis zur Umstellung ins Leere läuft.

**Eine Deny-Policy auf VPC-Endpoints sperrt auch dich aus.** Die S3-Doku warnt
explizit: Eine Bucket Policy, die den Zugriff auf einen bestimmten VPC Endpoint
beschränkt, deaktiviert den Konsolenzugriff auf diesen Bucket, weil
Konsolen-Requests nicht von diesem Endpoint kommen. Und weil dieselbe Policy
auch das Ändern der Policy blockieren kann, ist der Weg zurück ein
Support-Fall.

**Die Grenzen sind großzügig, aber vorhanden.** Access Point Policies sind auf
20 KB begrenzt — dieselbe Zahl wie bei der Bucket Policy. Pro Account und Region
lassen sich 10.000 Access Points anlegen, erhöhbar über eine Service-Quota.
Ältere Kursunterlagen nennen hier noch 1.000; das ist überholt.

## Syntax lesen

Access Points bringen eine eigene ARN-Form mit, und die zu lesen hilft beim
Verständnis, warum Bucket-Regeln und Access-Point-Regeln nebeneinander
existieren:

```
arn:aws:s3:us-east-1:111122223333:accesspoint/finance-ro/object/finance/2026-Q1.parquet
    │   │   │            │              │           │      │
    │   │   │            │              │           │      └─ Objektschlüssel
    │   │   │            │              │           └──────── Objekt-Ebene
    │   │   │            │              └──────────────────── Name des Access Points
    │   │   │            └─────────────────────────────────── Account
    │   │   └──────────────────────────────────────────────── Region
    │   └──────────────────────────────────────────────────── S3
    └──────────────────────────────────────────────────────── Partition
```

Der Bucket kommt in dieser ARN **nicht vor**. Genau das ist der Punkt: Die
Access Point Policy redet über den Zugangsweg, die Bucket Policy über die Daten.
Beide Seiten müssen zustimmen.

Die drei Condition-Keys, die in dieser Landschaft zählen:

```
aws:SourceVpce   → dieser eine Endpoint      (vpce-0abc…)
aws:SourceVpc    → diese eine VPC            (vpc-1234…)
aws:VpcSourceIp  → private IP innerhalb der VPC
```

`aws:SourceIp` steht bewusst nicht dabei — dazu unten.

## Was du dadurch nicht baust

- **Keine Verschlüsselung.** Access Points regeln Zugriff, nicht Vertraulichkeit
  im Ruhezustand. SSE-KMS, Bucket Keys und Key Policies sind ein eigenes Thema.
- **Keine Nachvollziehbarkeit.** Wer welches Objekt gelesen hat, steht in
  CloudTrail-Data-Events, die separat eingeschaltet und bezahlt werden.
- **Keine fachliche Governance.** Access Points kennen Präfixe, keine Tabellen
  oder Spalten. Zeilen- und spaltenweise Rechte auf einem Data Lake sind Lake
  Formation.
- **Keine Regionsverteilung.** Ein Access Point zeigt auf genau einen Bucket in
  genau einer Region. Für „nächstgelegener Bucket von mehreren" ist der
  Multi-Region Access Point zuständig.
- **Keine Inhaltsveränderung.** Wer beim Lesen PII schwärzen will, braucht einen
  Object Lambda Access Point.
- **Keine Verkehrslenkung für andere Services.** Der Gateway Endpoint deckt S3
  und DynamoDB ab. Für KMS, Secrets Manager oder ECR brauchst du Interface
  Endpoints — mit eigener Stundenrechnung je AZ.

## Wenn du dir eine Sache merkst

**Access Point = eigener Hostname plus eigene Policy je Zugriffsmuster, während
die Bucket Policy nur noch delegiert — und Gateway Endpoint heißt kostenlos,
aber ausschließlich aus der eigenen VPC.**

Warum „ein Bucket pro Team" hier verliert: Es zerlegt den gemeinsamen
Datenbestand, verdoppelt Lifecycle-, Verschlüsselungs- und
Replikationskonfiguration und löst das Netzwerkproblem überhaupt nicht.

Warum „IAM-Rollen statt Access Points" hier verliert: IAM-Policies haben
kleinere Größenlimits als Bucket Policies und lösen die Netzwerkherkunft nicht —
Network Origin VPC gibt es nur am Access Point.

Warum „Gateway Endpoint für on-premises" verliert: Er arbeitet über die Route
Table der VPC, und ein Rechenzentrum hat keine.

## Prüfungsknackpunkte

**Signalwörter für Access Points:** „gemeinsam genutzter Bucket" · „die Bucket
Policy wird zu groß" · „jedes Team braucht eigene Berechtigungen" · „ein Data
Lake, viele Zugriffsmuster".

**Signalwörter für den Interface Endpoint:** „aus dem eigenen Rechenzentrum" ·
„Direct Connect" oder „VPN" in Kombination mit „privat auf S3" · „über Transit
Gateway" · „aus einer gepeerten VPC".

**Signalwörter für den Gateway Endpoint:** „Kosten senken" · „kein NAT Gateway
mehr" · „innerhalb derselben VPC".

**Warum `aws:SourceIp` verliert:** Über einen VPC Endpoint ist die Quelladresse
die private VPC-Adresse. Eine IP-Allowlist mit öffentlichen Adressen greift ins
Leere. Richtig sind `aws:SourceVpce` und `aws:SourceVpc`.

**Warum „Access Point erlaubt PutObject, Zugriff wird trotzdem verweigert"
kein Widerspruch ist:** Die Bucket Policy delegiert für diese Aktion nicht. Zwei
Zustimmungen, nicht eine.

**Warum der Multi-Region Access Point hier verliert:** Er löst Geo-Latenz und
Failover über mehrere Buckets. Helios hat einen Bucket und ein
Governance-Problem.

**Warum Object Lambda hier verliert:** Er transformiert Objekte beim Lesen.
Gefragt ist, wer zugreifen darf — nicht, was zurückkommt.

**Warum „Bucket Policy einfach aufräumen" verliert:** Das 20-KB-Limit bleibt,
und die nächste Teamanforderung bringt es zurück. Die Frage zielt auf die
Struktur, nicht auf Kosmetik.
