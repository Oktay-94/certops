---
cardNumber: 37
slug: cloudfront-s3-oac-nordwind-robotics-privater-bucket
title: "CloudFront + S3 mit OAC — privater Bucket, globale Auslieferung"
services: ["Amazon CloudFront", "Amazon S3", "CloudFront Origin Access Control", "AWS KMS", "Amazon Route 53"]
domains: ["D1", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/about-object-ownership.html"
  - "https://repost.aws/knowledge-center/s3-rest-api-cloudfront-error-403"
  - "https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-introduces-origin-access-control-oac/"
  - "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-lambda.html"
---

## Die Grundidee zuerst

Stell dir ein Archiv im Keller eines Verlagshauses vor, und zwei Arten, Leser an die Dokumente zu lassen.

**Weg eins:** Du stellst das Kellertor offen. Jeder, der die Adresse kennt, geht runter und nimmt sich, was er will. Damit es schneller geht, stellst du Kopien in Lesesäle in Tokio und Toronto. Praktisch — nur steht das Kellertor eben offen. Wer die Kelleradresse herausfindet, umgeht die Lesesäle komplett und geht direkt an die Originale.

**Weg zwei:** Das Kellertor ist zu und bleibt zu. Es gibt genau einen Boten, der hinunter darf, und der Kellermeister erkennt ihn an einem Siegel, das der Bote auf jeden Zettel drückt. Nicht an seinem Weg — der Bote nimmt dieselbe Treppe wie alle anderen. An seinem **Siegel**. Wer ohne Siegel kommt, egal auf welchem Weg, wird abgewiesen.

Das Siegel ist Origin Access Control. Und der entscheidende Satz steckt schon im Bild: **Der Bote nimmt dieselbe Treppe.** OAC baut keinen Geheimgang. Es gibt keinen privaten Tunnel zwischen CloudFront und deinem Bucket. Es gibt eine Unterschrift, und eine Bucket Policy, die nur diese eine Unterschrift akzeptiert.

Wer das einmal begriffen hat, beantwortet die halbe Karte von selbst.

## Was es eigentlich ist — die Bucket Policy

OAC ist kein Gerät, das man irgendwo hinstellt. Es ist ein Konfigurationsobjekt in CloudFront plus **eine Resource-based Policy am Bucket**. Die Policy ist der eigentliche Kern:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontServicePrincipalReadOnly",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::nordwind-docs/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::1234:distribution/E2NORDWIND"
      }
    }
  }]
}
```

Lies das von oben nach unten, es ist die ganze Zugangsregelung. Wer darf (`Principal`), was darf er (`Action`), woran (`Resource`), und — die wichtigste Zeile — **unter welcher Bedingung** (`Condition`).

Der `Principal` ist ein Service-Principal, kein Konto und keine Rolle. `cloudfront.amazonaws.com` ist für **alle AWS-Kunden derselbe String**. Ohne die `Condition` erlaubst du damit nicht deiner Distribution den Zugriff, sondern jeder CloudFront-Distribution auf der Welt. Die `AWS:SourceArn`-Zeile ist das, was aus einer offenen Tür eine Tür mit Schloss macht.

Auf der CloudFront-Seite steht dem ein zweites, viel kürzeres Objekt gegenüber:

```json
{
  "Name": "nordwind-oac",
  "SigningProtocol": "sigv4",
  "SigningBehavior": "always",
  "OriginAccessControlOriginType": "s3"
}
```

Vier Felder. `SigningProtocol` hat genau einen gültigen Wert. `SigningBehavior` hat drei — und die Wahl hat eine Nebenwirkung, die man leicht übersieht. Dazu unten mehr.

## Der Weg durch die Karte

### Der Kasten links — ein Leser in Tokio

`Viewer`, `Tokio`, `docs.nordwind.io`. Der Kasten ist blau, weil hier nichts von AWS steht — nur ein Browser irgendwo auf der Welt.

Nordwind Robotics baut Maschinen in Bremen und veröffentlicht die Produktdokumentation als statische Site: ein React-Build, Bilder, PDFs. Gelesen wird das in Japan und Nordamerika, also gerade dort, wo Bremen weit weg ist. Und die interne Sicherheitsrichtlinie verbietet öffentlich lesbare S3-Buckets **ausnahmslos**.

Zwei Anforderungen, die sich auf den ersten Blick beißen: weltweit schnell, und trotzdem privat.

### Badge 1 und der Route-53-Kasten — Alias, nicht CNAME

`Alias-Record`, `kein CNAME nötig`. Der Kasten ist lila, wie auf allen Karten mit Route 53.

Ein Alias-Record sieht aus wie ein CNAME und ist keiner. Der Unterschied wird an einer Stelle handfest: Auf einer **Apex-Domain** — `nordwind.io` ohne Subdomain — verbietet der DNS-Standard einen CNAME. Ein Alias-Record ist dagegen erlaubt, weil Route 53 die Auflösung intern macht und dem Client eine fertige A-Antwort gibt.

Der zweite Unterschied ist die Rechnung: Anfragen auf Alias-Records, die auf AWS-Ziele zeigen, stellt Route 53 nicht in Rechnung.

**Wichtig für das Kartenverständnis:** Schritt 1 ist eine Namensauflösung, kein Transport. Der HTTPS-Verkehr fließt danach direkt zur Edge Location. Route 53 sieht kein einziges Byte der Dokumentation.

### Badge 2 und der CloudFront-Kasten — was am Rand passiert

`Edge Location`, `Cache + TLS + Shield Std`, `Default Root Object`. Orange, wie CloudFront auf allen Karten.

Drei Dinge passieren hier gleichzeitig. **TLS wird am Rand terminiert**, in der Nähe des Nutzers — der teure Handshake läuft über eine kurze Strecke statt über den Atlantik. **AWS Shield Standard** ist bei jeder Distribution ohne Aufpreis dabei; das musst du nicht einschalten und nicht bezahlen. Und das **Default Root Object** sorgt dafür, dass ein Aufruf von `https://docs.nordwind.io/` nicht ins Leere läuft, sondern `index.html` liefert.

Beim Default Root Object lohnt eine Präzisierung, die auf keiner Karte Platz hat: Es wirkt **nur auf den Wurzelpfad**. Ein Aufruf von `/handbuch/` liefert nicht automatisch `/handbuch/index.html`. Wer das braucht, löst es mit einer CloudFront Function.

### Badge 3 und der Cache-Hit-Pfeil — die Antwort, die den Keller nie sieht

Der gestrichelte orange Pfeil zurück zum Viewer, beschriftet mit `Cache Hit — Antwort ohne Origin`.

Das ist der eigentliche Zweck der ganzen Konstruktion, und auf der Karte ist es der einzige Pfeil, der **rückwärts** läuft. Bei statischen Assets bedient die Edge den überwiegenden Teil der Anfragen aus dem eigenen Bestand. Der Bucket sieht diesen Verkehr nie. Du bezahlst weder S3-Requests noch Egress aus `eu-central-1`.

Die Achse dahinter ist auf Karte 35 hergeleitet und wird hier nur benutzt: **CloudFront cached, Global Accelerator nicht.** Statischer, cachebarer HTTP-Inhalt gehört hinter CloudFront. Nicht-cachebarer TCP- oder UDP-Verkehr, der stabile Anycast-IPs braucht, gehört hinter Global Accelerator. Diese Karte ist der Fall, in dem das Caching der ganze Gewinn ist.

### Badge 4 und der OAC-Kasten — die Signatur, die kein Weg ist

`signiert mit SigV4`, `Signing "always" → HTTPS`, `keine Netzwerk-Route`. Teal, und — das ist die wichtigste Designentscheidung der Karte — **der Kasten steht neben dem Pfeil, nicht in ihm**, gestrichelt angebunden.

Erst beim Cache Miss wird OAC überhaupt aktiv. CloudFront erzeugt eine SigV4-Signatur mit dem Service-Principal `cloudfront.amazonaws.com`, hängt sie als `Authorization`-Header an und schickt den Request an den **REST-Endpoint** des Buckets. Über das normale öffentliche Internet.

Genau deshalb ist OAC **keine Station im Datenweg**. Der Request läuft nicht „durch" OAC hindurch. OAC ist die Regel, nach der CloudFront unterschreibt — nicht die Leitung, auf der es fährt.

Die mittlere Zeile trägt eine Nebenwirkung, die kaum jemand kennt: **Nur bei `SigningBehavior: always` ist die Verbindung zwischen CloudFront und S3 garantiert HTTPS.** Das sagt die Doku wörtlich. Bei `never` oder `no-override` richtet sich das Protokoll nach deiner Viewer- beziehungsweise Origin-Protocol-Policy. Ein Signaturschalter, der nebenbei über Transportverschlüsselung entscheidet — das merkt man sich am besten als Kuriosität.

### Der S3-Kasten — drei Zeilen, drei getrennte Bedingungen

`privat, Block Public Access`, `Bucket Policy: SourceArn`, `Bucket owner enforced`. Grün, wie S3 überall.

Die drei Zeilen sehen aus wie eine Aufzählung von Sicherheitshäkchen. Sie sind drei voneinander unabhängige Anforderungen, und jede fehlende bricht etwas anderes.

**Block Public Access** verhindert, dass irgendjemand versehentlich ein öffentliches Statement einbaut. **`SourceArn`** grenzt den Service-Principal auf deine eine Distribution ein. **`Bucket owner enforced`** ist keine Empfehlung, sondern Voraussetzung: Die Doku schreibt, dass bei OAC mit S3-Origins Object Ownership auf diesen Wert gesetzt sein **muss**. Er ist der Standard für neue Buckets. Wer ACLs braucht, weicht auf `Bucket owner preferred` aus — mehr Spielraum gibt es nicht.

### Badge 5 und der KMS-Kasten — die zweite Policy, die man vergisst

`SSE-KMS`, `Key Policy: kms:Decrypt`. Navy.

Die Objekte liegen SSE-KMS-verschlüsselt. Damit reicht die Bucket Policy allein nicht: Die **Key Policy** braucht ein eigenes Statement, das demselben Service-Principal `kms:Decrypt` erlaubt, mit derselben `SourceArn`-Condition.

Und hier steckt eine Fehlersuche, die fast immer an der falschen Stelle beginnt. Fehlt das KMS-Statement, ist der Fehler **kein S3-Berechtigungsfehler**. S3 lässt den Lesezugriff zu und scheitert dann beim Entschlüsseln. Wer daraufhin die Bucket Policy immer weiter aufmacht, löst nichts — und hat am Ende einen Bucket, der offener ist als vorher.

Das Bild dazu: Der Kellermeister hat dem Boten die Tür geöffnet. Der Safe im Keller hat aber ein eigenes Schloss, und dafür hat niemand einen Schlüssel ausgegeben.

### Der gestrichelte Kasten rechts — 403 auf die Objekt-URL

`Block Public Access an`, `Policy ohne Public-Statement`, `= 403 Forbidden`. Rot, gestrichelt, mit rotem X am Pfeil.

Das ist die Anforderung „users must not be able to bypass the CDN", als Bild. Wer die S3-Objekt-URL direkt aufruft, bekommt **403 Forbidden** — nicht weil ein Netzwerk ihn blockiert, sondern weil er keine gültige Signatur mitbringt. Für den Betrieb wichtig: CloudFront cached „Access Denied" bis zu fünf Minuten, wer eine Policy repariert und sofort testet, sieht womöglich noch die alte Antwort.

### Der gestrichelte Kasten links — die Falle mit dem Website-Endpoint

`S3-Website-Endpoint = Custom Origin`, `→ OAC und OAI nicht möglich`, `REST-Endpoint des Buckets verwenden`.

Ein Bucket hat zwei Adressen. Der **REST-Endpoint** (`bucket.s3.region.amazonaws.com`) und der **Website-Endpoint** (`bucket.s3-website-region.amazonaws.com`). Sie sehen ähnlich aus und verhalten sich völlig verschieden.

Nur der REST-Endpoint zählt für CloudFront als S3-Origin. Der Website-Endpoint gilt als **Custom Origin** — und dann funktioniert **weder OAC noch OAI**. Der Bucket müsste öffentlich sein, womit die Anforderung gerissen ist. Anleitungen im Netz kombinieren beides trotzdem regelmäßig, weil der Website-Endpoint bequeme Extras mitbringt: Index-Dokumente in Unterordnern, Redirect-Regeln, eigene Fehlerseiten.

Wer die braucht und trotzdem privat bleiben will, baut sie mit einer CloudFront Function nach. Ein Detail dazu steht in der Doku direkt neben der Website-Endpoint-Einschränkung und ist einen eigenen Satz wert: **OAC unterstützt kein Origin-Redirect via Lambda@Edge.** Das ist etwas anderes als ein Pfad-Rewrite, aber nah genug, um beim Nachbauen zu stolpern.

### Die Merksätze-Fußzeile

Vier Sätze, und der erste trägt die Karte: `OAC = Signatur, kein Endpoint`. Danach die drei Ausschlüsse — Website-Endpoint schließt OAC aus, SSE-KMS erzwingt OAC, CloudFront cached und Global Accelerator nicht.

## Die entscheidende Unterscheidung

Die Achse dieser Karte ist **Wer** gegen **Wo entlang**. Sie ist die häufigste Verwechslung im ganzen Netzwerkteil der Prüfung:

| | OAC | VPC Endpoint / PrivateLink | CloudFront VPC Origins |
|---|---|---|---|
| Art | Signaturbeziehung | Netzwerkkonstrukt | Netzwerkkonstrukt |
| Regelt | **wer** lesen darf | **wo entlang** es geht | **wo entlang** es geht |
| Traffic über Internet | ja | nein | nein |
| Antwort auf „private connectivity" | nein | **ja** | ja |
| Antwort auf „only my distribution may read" | **ja** | nein | nein |

Wer die Spalten vertauscht, beantwortet Fragen nach privater Anbindung mit OAC und Fragen nach Lesezugriff mit einem VPC Endpoint. Beides ist falsch, und beides kommt vor.

CloudFront VPC Origins gibt es seit 2024, seit Mai 2026 auch mit WebSocket-Unterstützung — CloudFront steht damit direkt vor Ressourcen in privaten Subnetzen. Das **schärft** die Abgrenzung: zwei CloudFront-Funktionen, beide mit „Zugriff" im Namen, und trotzdem gehört die eine links und die andere rechts.

## Die ehrliche Feinheit

**Erstens: Die Doku widerspricht sich selbst, auf derselben Seite.** Oben in der Vorteilsliste steht „Dynamic requests (PUT and DELETE)", weiter unten im OAI-Vergleich „(PUT, POST, or DELETE)". Für die Prüfung ohne Belang, aber ein gutes Beispiel dafür, dass eine einzelne Doku-Zeile nicht automatisch die genaue Aufzählung liefert.

**Zweitens: Die Regionsangabe wird gern falsch zitiert.** Man liest häufig, OAI unterstütze keine Regionen „nach Januar 2023". Die Doku sagt: **opt-in Regions launched after December 2022**. Zwei Abweichungen — der Monat, und der Zusatz *opt-in*. Es geht nicht um alle neuen Regionen, sondern um die, die man im Konto erst aktivieren muss.

**Drittens: OAI ist nicht abgeschaltet.** Mehrere Drittquellen mit 2026er-Datum behaupten, neue Distributionen könnten nur noch OAC verwenden. Eine gezielte Nachprüfung findet keine AWS-Ankündigung dieses Inhalts, und die Doku-Seite beschreibt weiterhin beide Verfahren nebeneinander und verlinkt die OAI-Migration. Bewertung: OAI ist **legacy und nicht empfohlen**, aber vorhanden. Für die Prüfung ändert das nichts — die Antwort ist in jedem Fall OAC, weil SSE-KMS im Spiel ist.

**Viertens, und das ist die Feinheit mit Folgen:** Die S3-Doku empfiehlt inzwischen **AWS Amplify Hosting** als bevorzugten Weg, statische Websites aus einem Bucket auszuliefern. Für SAA-C03 bleibt S3 + CloudFront + OAC die kanonische Antwort. Wo eine Frage aber ausdrücklich nach dem **geringsten Verwaltungsaufwand** fragt, kann Amplify gemeint sein. Prüfungsrealität und aktuelle AWS-Empfehlung laufen hier auseinander.

## Syntax lesen — die `SourceArn`-Condition

Der wichtigste Block der ganzen Karte ist fünf Zeilen lang:

```
"Condition": {
  "StringEquals": {
    "AWS:SourceArn": "arn:aws:cloudfront::1234:distribution/E2NORDWIND"
  }
}
```

Der ARN hat eine Besonderheit, die auffällt, wenn man sie einmal gesehen hat:

```
arn:aws:cloudfront::1234:distribution/E2NORDWIND
                    ↑↑
                    doppelter Doppelpunkt
```

Dort steht normalerweise die Region. CloudFront ist ein globaler Service und hat keine — das Feld bleibt leer, die beiden Doppelpunkte stehen trotzdem da. Fehlt einer davon, ist der ARN ungültig und die Policy greift nicht.

Und der Angriff, gegen den die ganze Zeile gebaut ist, heißt **Confused Deputy**: Ein Dienst wird als Stellvertreter benutzt, um an Ressourcen zu kommen, die dem Aufrufer selbst nicht gehören. Weil `cloudfront.amazonaws.com` bei allen Kunden gleich lautet, wäre die Policy ohne `SourceArn` eine Einladung an jede fremde Distribution. Der Bucket wäre formal nicht öffentlich — und trotzdem von außen lesbar.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein öffentlich lesbarer Bucket, auch nicht kurzzeitig
- kein VPC, kein Subnetz, kein Endpoint, keine Security Group
- kein privater Netzwerkpfad zwischen CloudFront und S3
- kein Server, der TLS terminiert
- kein eigener DDoS-Schutz — Shield Standard ist enthalten
- keine Zugriffskontrolle über ACLs, die sind mit `Bucket owner enforced` abgeschaltet
- kein Deployment-Weg; die Karte zeigt nur den Lesepfad

Übrig bleiben: eine Distribution, zwei Resource-based Policies und ein DNS-Record.

## Wenn du dir eine Sache merkst

**OAC ist eine Signaturbeziehung, kein Netzwerkweg.**

CloudFront erreicht den Bucket über das ganz normale öffentliche S3-Endpoint. Privat wird der Zugriff durch die Unterschrift und die Bucket Policy, nicht durch eine Leitung.

Ein VPC Endpoint schafft einen Pfad und sagt nichts darüber, wer lesen darf. Eine Bucket Policy ohne `SourceArn` sagt, wer lesen darf, und meint dabei versehentlich alle. Ein Website-Endpoint hebt die Frage ganz auf, weil er den Bucket zum Custom Origin macht.

## Prüfungsknackpunkte

**Signalwörter:** „the S3 bucket must not be publicly accessible" plus „only the CloudFront distribution should be able to read the objects". Kommt „objects are encrypted with SSE-KMS" dazu, ist die Antwort ohne weiteres Nachdenken OAC — OAI kann SSE-KMS nicht bedienen, das ist der härteste Ausschluss der Karte.

**Warum OAI hier verliert:** Nicht, weil es alt ist, sondern weil es SSE-KMS nicht unterstützt. Sobald KMS im Fragetext steht, ist OAI keine schwächere Option, sondern gar keine.

**Warum ein VPC Endpoint hier verliert:** Er beantwortet die falsche Frage. CloudFront ist ein globaler Edge-Dienst und sitzt in keinem deiner Subnetze. Ein Gateway Endpoint für S3 wirkt auf Traffic aus deinem VPC — der Origin-Request kommt aber von einer Edge Location.

**Warum Bucket-ACLs hier verlieren:** Mit `Bucket owner enforced` sind ACLs abgeschaltet. Eine Antwort, die Zugriff per ACL gewährt, widerspricht der Voraussetzung, die OAC selbst mitbringt.

**Warum Signed URLs hier verlieren:** Sie schützen den Weg **Viewer → CloudFront**, nicht **CloudFront → S3**. Die Frage zielt auf den zweiten — als Antwort auf „only the distribution may read the bucket" ist es die falsche Schicht.

**Die stille Falle:** Eine Bucket Policy, die nur `Service: cloudfront.amazonaws.com` erlaubt, sieht in jedem Audit sauber aus. Block Public Access ist an, kein `Principal: "*"`, kein öffentliches Statement. Und trotzdem darf jede fremde CloudFront-Distribution lesen. Wenn eine Antwortoption die `SourceArn`-Condition weglässt, ist sie deshalb falsch — auch wenn sie sonst identisch aussieht.
