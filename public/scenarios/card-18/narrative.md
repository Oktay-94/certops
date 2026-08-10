---
cardNumber: 18
slug: s3-transfer-acceleration-multipart-cinelab-upload
title: "S3 Transfer Acceleration + Multipart Upload — große Dateien von überall"
services: ["Amazon S3", "S3 Transfer Acceleration", "S3 Multipart Upload", "Amazon API Gateway", "AWS Lambda", "S3 Lifecycle"]
domains: ["D3", "D4", "D1"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/qfacts.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/transfer-acceleration-examples.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html"
  - "https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html"
  - "https://aws.amazon.com/s3/faqs/"
---

## Die Grundidee zuerst

Ein Umzug von Sydney nach Frankfurt, und zwei Dinge gehen schief.

**Das erste Problem:** Du packst alles in einen einzigen Container. Auf halber Strecke geht etwas kaputt, und der ganze Container fährt zurück. Beim dritten Versuch fragst du dich, ob das je ankommt.

**Das zweite Problem:** Die ersten dreihundert Kilometer sind Landstraße mit Ortsdurchfahrten und Ampeln. Erst danach beginnt die Autobahn. Die Fracht ist nicht zu langsam — der Weg zur Autobahn ist es.

Das sind **zwei verschiedene Probleme**, und sie brauchen zwei verschiedene Lösungen.

Multipart Upload zerlegt die Fracht: viele kleine Ladungen, die unabhängig fahren, und wenn eine ausfällt, wird nur sie wiederholt. Transfer Acceleration verlegt die Autobahnauffahrt vor die Haustür: Der Transport verlässt das öffentliche Netz nach wenigen Millisekunden und fährt den Rest über die AWS-eigene Strecke.

Wer die beiden verwechselt, beantwortet in der Prüfung die falsche Frage. **Multipart löst Zuverlässigkeit und Parallelität. Transfer Acceleration löst Distanz.**

## Was es eigentlich ist — ein Upload in drei Akten

Ein Multipart Upload ist kein Dateitransfer, sondern eine **Transaktion mit einer Identität**. `CreateMultipartUpload` gibt dir eine `UploadId`. Von da an gehört jeder Part zu dieser Id. Und erst der letzte Call macht daraus ein Objekt:

```xml
<CompleteMultipartUpload>
  <Part>
    <PartNumber>1</PartNumber>
    <ETag>"a54357aff0632cce46d942af68356b38"</ETag>
  </Part>
  <Part>
    <PartNumber>2</PartNumber>
    <ETag>"0c78aef83f66abc1fa1e8477f296d394"</ETag>
  </Part>
  <!-- ... 1.248 weitere ... -->
</CompleteMultipartUpload>
```

Lies, was hier steht: eine **Liste**. Nummer und ETag, sonst nichts. Der Client sagt S3 nicht „hier sind die Daten", sondern „die Teile, die du schon hast, gehören in dieser Reihenfolge zusammen".

Daraus folgt fast alles Weitere. Die Parts können in beliebiger Reihenfolge und gleichzeitig hochgeladen werden, weil die Reihenfolge erst hier entsteht. Ein einzelner Part kann wiederholt werden, ohne dass die anderen etwas merken. Und **vor diesem Call ist im Bucket nichts sichtbar** — kein halbes Video, kein Platzhalter.

Die Grenzen, die dazugehören und die in der Prüfung abgefragt werden: **maximal 10.000 Parts**, Partnummern 1 bis 10.000, **Partgröße 5 MiB bis 5 GiB**, und für den letzten Part gibt es keine Untergrenze. Empfohlen wird Multipart ab etwa 100 MB Objektgröße; über 5 GB führt kein Weg daran vorbei, weil ein einzelnes `PUT` dort endet.

## Der Weg durch die Karte

### Badge 1 — Der Client holt presigned URLs

Der Browser fragt bei API Gateway und Lambda an. Lambda startet den Upload mit `CreateMultipartUpload` und erzeugt **pro Part eine presigned URL**.

Zwei Dinge gewinnst du damit gleichzeitig. Die **AWS-Credentials bleiben serverseitig** — der Browser bekommt nur zeitlich befristete Schreibrechte auf genau einen Part. Und die Nutzdaten laufen anschließend **nicht** über den eigenen Webserver: Er sieht die Metadaten, nicht die 80 GB.

Das Bild dazu: Der Pförtner stellt Tagesausweise für einzelne Räume aus. Er trägt die Kisten nicht selbst.

### Badge 2 — Die Datei wird zerlegt und parallel gesendet

Der Client schneidet die Datei in Blöcke, hier 64 MB. Diese Zahl ist eine **Beispielwahl**, kein Standardwert — der richtige Wert ergibt sich aus Objektgröße, Bandbreite und der 10.000er-Grenze.

Der Geschwindigkeitsgewinn kommt aus der Parallelität. Statt einer TCP-Verbindung laufen zehn. Eine langsame Verbindung bremst nicht mehr den gesamten Transfer, sondern nur ihren eigenen Part. Auf einer langen Strecke ist das oft der größere Hebel als alles andere — auch größer als das, was in Badge 3 dazukommt.

### Badge 3 — Transfer Acceleration bringt die Parts über die Edge

Statt an `bucket.s3.eu-central-1.amazonaws.com` gehen die PUTs an `bucket.s3-accelerate.amazonaws.com`. Der Part landet damit an der **nächstgelegenen CloudFront Edge Location** und reist von dort über das optimierte AWS-Backbone nach Frankfurt.

Der Weg wird nicht kürzer. Er verlässt nur das öffentliche Internet fast sofort — und dort verliert TCP seinen Durchsatz: nicht wegen fehlender Bandbreite, sondern wegen Round-Trip-Zeit und Paketverlust auf einer langen, unruhigen Strecke.

Einschalten ist eine Bucket-Einstellung, die Anwendung ändert nur den Endpoint-Namen. Zwei Einschränkungen gehören dazu und stehen auf keiner Karte: Nach dem Aktivieren kann es **bis zu 20 Minuten** dauern, bis die Beschleunigung greift. Und TA ist **nicht in allen Regionen verfügbar** — die Doku listet derzeit fünfzehn. Frankfurt ist dabei, dieses Szenario trägt also.

Drei weitere Voraussetzungen, die zusammen die häufigste Fehlersuche erklären. Transfer Acceleration funktioniert **nur mit virtual-hosted-style Requests** — der Bucketname steht im Hostnamen, nicht im Pfad. Das Umschalten am Bucket darf nur der Bucket-Eigentümer, delegierbar über `s3:PutAccelerateConfiguration`; der Zustand heißt dann `Enabled` oder `Suspended`. Und für IPv6 gibt es einen eigenen Endpoint auf `.s3-accelerate.dualstack.amazonaws.com`.

Wie viel es bringt, hängt an drei Größen: verfügbarer Bandbreite, Distanz und Paketverlust. AWS nennt zwei gemessene Fälle — einmal etwa halbierte Zeit beim Hochladen von 300-MB-Dateien aus verteilten Standorten nach Sydney, einmal eine Verbesserung um mehr als das Fünffache für Nutzer in Südostasien und Australien, die 250-MB-Dateien in 50-MB-Parts nach Nord-Virginia schickten. Zwei Kunden, zwei Größenordnungen. Das ist der Grund, warum Messen vor Aktivieren steht.

### Badge 4 — Ein fehlgeschlagener Part wird einzeln wiederholt

Das ist der Kern von Multipart und der Grund, warum die drei Abbrüche kein Problem mehr sind. Jeder Part ist ein eigener Request mit eigenem Erfolg. Reißt die Leitung bei Part 812 von 1.250, wird **nur Part 812** neu gesendet — nicht die 70 GB davor.

Damit ist der Upload nebenbei auch **pausierbar**. Solange die `UploadId` lebt, kann ein Client später weitermachen, sogar von einem anderen Rechner.

### Badge 5 — CompleteMultipartUpload setzt das Objekt zusammen

Erst hier entsteht in S3 **ein** Objekt. Auf der Karte geht dieser Pfeil bewusst nicht über den Accelerate-Pfad: Der Call transportiert keine Nutzdaten, und der separate Weg macht sichtbar, dass das Objekt genau an dieser Stelle entsteht.

Technisch könnte auch dieser Call beschleunigt werden — Transfer Acceleration unterstützt alle Bucket-Features einschließlich Multipart Upload. Die Trennung im Bild ist Didaktik, keine Vorschrift.

### Badge 6 — Die Lifecycle-Regel räumt auf

Hier kam die mysteriöse Rechnung her. Parts hochgeladener, aber nie abgeschlossener Uploads **belegen Speicher und kosten Geld** — und sie tauchen in der normalen Objektliste nicht auf. Niemand findet sie, alle zahlen dafür.

```json
{
  "Rules": [{
    "ID": "abort-stale-uploads",
    "Status": "Enabled",
    "Filter": { "Prefix": "" },
    "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
  }]
}
```

AWS empfiehlt diese Regel ausdrücklich als Best Practice und führt in der Doku genau dieses Sieben-Tage-Beispiel. Zwei Feinheiten dazu: Die Regel löscht **keine Objekte**, nur Parts unfertiger Uploads. Und für das Aufräumen fallen **keine Early-Delete-Gebühren** an.

Aufspüren lassen sich die Altlasten über `ListMultipartUploads`, und die Parts eines einzelnen Uploads über `ListParts`. Beide Aufrufe liefern **maximal 1.000 Einträge je Anfrage** — bei einem Bucket, in dem sich Uploads über Monate angesammelt haben, blätterst du also. Genau deshalb ist die Lifecycle-Regel der bessere Weg als ein Aufräumskript.

Ist die Regel gesetzt, gibt `CreateMultipartUpload` die Header `x-amz-abort-date` und `x-amz-abort-rule-id` zurück. Der Upload weiß von Anfang an, wann er verfällt.

### Der verworfene Pfad — Long-Haul über das öffentliche Internet

Der graue, durchgestrichene Weg ist der Ist-Zustand: eine einzelne PUT-Verbindung von Sydney quer über das öffentliche Internet nach Frankfurt. Langsam, weil viele Hops. Alles-oder-nichts, weil ein Request. Er scheitert an beiden Problemen gleichzeitig — und genau deshalb braucht die Lösung beide Werkzeuge.

### Der Kasten „Nicht verwechseln"

Vier Dienste, die alle „schneller" versprechen und dabei verschiedene Richtungen meinen. Die Tabelle im nächsten Abschnitt sortiert sie — eine Zeile darin verdient aber schon hier einen Satz, weil sie in Antwortoptionen gern als scheinbare Lösung auftaucht.

**Multi-Region Access Points** geben dir einen einzigen globalen Endpoint über mehrere Buckets in mehreren Regionen. Das klingt nach der Antwort auf „Nutzer in aller Welt", ist es hier aber nicht: Cinelab hat *einen* Bucket in Frankfurt und will genau das behalten. Ein Multi-Region-Setup würde bedeuten, dass Rohmaterial je nach Standort in verschiedenen Regionen liegt und anschließend repliziert werden muss — mehr Speicher, mehr Kosten, ein zerlegter Bestand. Transfer Acceleration löst dasselbe Distanzproblem, ohne die Datenhaltung anzufassen.

### Der Kasten „Freelancer weltweit"

Er beschreibt nicht Technik, sondern die Randbedingung, aus der alles folgt: Browser-Upload statt FTP, 40 bis 80 GB je Datei, und Netzabbrüche als Normalfall, nicht als Störung. Wer diese drei Zeilen ernst nimmt, kommt zwangsläufig bei presigned URLs plus Multipart heraus — ein FTP-Server wäre ein zusätzlicher Dienst, den jemand betreiben, absichern und skalieren müsste, und er würde am Alles-oder-nichts-Problem nichts ändern.

## Die entscheidende Unterscheidung

| | Richtung | Cached? | Wofür |
|---|---|---|---|
| **S3 Transfer Acceleration** | hinein, ein Bucket | nein | Uploads über große Distanz |
| **CloudFront** | heraus, zu den Nutzern | ja | Auslieferung, Streaming |
| **Global Accelerator** | beliebiges TCP/UDP | nein | statische Anycast-IPs, Failover |
| **Multi-Region Access Points** | hinein und heraus | nein | ein Endpoint über mehrere Bucket-Regionen |

Transfer Acceleration nutzt dieselben Edge-Standorte wie CloudFront — aber **nur als Eintrittspunkt**. An der Edge wird nichts gespeichert.

## Die ehrliche Feinheit

**Wenn Transfer Acceleration nichts bringt, kostet es nichts.** AWS prüft bei jedem Upload, ob der beschleunigte Weg voraussichtlich schneller ist als der normale. Ist er es nicht, wird die TA-Gebühr für diesen Transfer nicht berechnet — und AWS umgeht das TA-System für diesen Upload gegebenenfalls einfach.

Das ist ein fairer Mechanismus, aber keine Entscheidungshilfe. Die eigentliche Frage lautet nicht „schadet es?", sondern „lohnt es sich?". Dafür gibt es das **Speed Comparison Tool**, das denselben Test mit und ohne Beschleunigung gegen verschiedene Regionen fährt — und das dabei selbst per Multipart Upload aus dem Browser überträgt, also genau den Weg misst, den die Anwendung später gehen soll. Bei einer „Was tun Sie zuerst?"-Frage ist Messen oft die richtige Antwort.

Die zweite Feinheit ist eine Namensfrage mit harten Folgen: **Der Bucketname darf keinen Punkt enthalten.** Ein Bucket `cinelab.global.media` lässt sich nicht beschleunigen, weil das Wildcard-Zertifikat für `*.s3-accelerate.amazonaws.com` nur eine Ebene abdeckt. Umbenennen geht in S3 nicht. Das ist eine der wenigen Stellen, an denen eine Namenswahl eine Feature-Entscheidung dauerhaft blockiert.

Die dritte betrifft eine Zahl, die du in Prüfungsvorbereitungen ständig siehst — die **maximale Objektgröße**. Hier widersprechen sich AWS-Seiten offen: Die Multipart-Limits-Tabelle im User Guide nennt 48,8 TiB, die S3-FAQ nennt 50 TB als Maximum je Objekt. Das sind nicht dieselben Werte in anderen Einheiten. Klassische Kursmaterialien rechnen zudem weiterhin mit 5 TB. Deshalb steht hier keine Zahl als Tatsache. Merke dir stattdessen die Mechanik: **Die Partgröße muss mit der Objektgröße mitwachsen**, weil 10.000 Parts die harte Grenze sind. Eine 5-TB-Datei mit 100-MB-Parts bräuchte 50.000 Parts — das geht nicht auf.

## Syntax lesen — das ETag eines Multipart-Objekts

Am ETag erkennst du, wie ein Objekt entstanden ist. Bei einem einfachen `PUT` steht dort das MD5 der Datei. Bei Multipart steht etwas anderes:

```
"9b2cf535f27731c974343645a3985328-1250"
 └───────────────┬────────────────┘ └┬─┘
                 │                   │
                 │                   └─ Anzahl der Parts
                 │
                 └─ MD5 über die aneinandergehängten
                    MD5-Summen aller Parts — NICHT
                    das MD5 der Gesamtdatei
```

Der Bindestrich ist das Erkennungszeichen. Steht er da, war es Multipart, und die Zahl dahinter sagt dir, in wie viele Teile die Datei zerlegt wurde.

Daraus folgt eine Konsequenz, die in der Praxis regelmäßig Menschen kostet: **Du kannst ein Multipart-Objekt nicht per lokalem `md5sum` verifizieren.** Wer die Datei nochmal hochlädt und dabei eine andere Partgröße wählt, bekommt ein anderes ETag für denselben Inhalt. Das ETag ist eine Eigenschaft des Uploads, nicht nur des Inhalts.

Für echte Integritätsprüfung gibt es deshalb den separaten Weg über Checksum-Algorithmen, die S3 pro Part und für das Gesamtobjekt mitführt und die über `GetObjectAttributes` oder einen Inventory-Report abrufbar sind. Wenn eine Prüfungsfrage nach *Verifikation* fragt und eine Antwortoption das ETag als MD5 der Datei behandelt, ist sie falsch.

## Was du dadurch nicht baust

- keinen Webserver, der 80 GB durchreicht und dabei zum Flaschenhals wird
- keine AWS-Credentials im Browser
- keinen Upload, der nach einem Abbruch von vorn beginnt
- kein Wartezeitfenster, in dem halbfertige Objekte im Bucket sichtbar wären
- keinen zweiten Bucket in Sydney und keine Replikation
- keinen CDN-Cache — TA speichert an der Edge nichts

Übrig bleiben: eine Lambda, die URLs ausstellt, ein Endpoint-Name mit `-accelerate` darin und eine Lifecycle-Regel.

## Wenn du dir eine Sache merkst

**Multipart löst das Zuverlässigkeits- und Parallelitätsproblem, Transfer Acceleration das Distanzproblem — plus eine Abort-Lifecycle-Regel gegen die unsichtbaren Kosten.**

CloudFront beschleunigt den Weg nach draußen, nicht nach innen. Global Accelerator gibt dir feste Anycast-IPs für beliebige Protokolle, aber keinen S3-Upload-Vorteil. Ein zweiter Bucket in Sydney löst das Problem, erzeugt aber zwei Datenbestände. Und ein größerer Webserver macht den falschen Weg schneller.

## Prüfungsknackpunkte

**Signalwörter:** „Nutzer auf der ganzen Welt", „große Dateien hochladen", „der Upload bricht ab und beginnt von vorn", „der Bucket liegt in einer einzigen Region", „möglichst wenig Änderung an der Anwendung". Abbruch und Wiederaufnahme → Multipart. Distanz und Durchsatz → TA.

**Warum CloudFront hier verliert:** Es ist die Antwort auf „Nutzer laden herunter" oder „Videos streamen". Bei Objekten **unter 1 GB** empfiehlt AWS allerdings umgekehrt CloudFront mit PUT/POST statt TA — bei tausend kleinen Dateien ist Parallelität wirksamer als Beschleunigung.

**Warum Global Accelerator hier verliert:** Statische Anycast-IPs für beliebige TCP/UDP-Anwendungen, ohne Caching. Löst kein S3-Upload-Problem. Siehe Karte 35.

**Warum ein zweiter Bucket in Sydney hier verliert:** Er zerlegt den Bestand in zwei Regionen. Die Postproduktion arbeitet aber auf einem Bestand.

**Warum ein größerer Webserver hier verliert:** Er macht den falschen Weg schneller. Die Nutzdaten sollen gar nicht über ihn laufen — presigned URLs nehmen ihn aus dem Datenpfad, statt ihn zu vergrößern.

**Die Kostenfrage.** „Woher kommen Speicherkosten für Daten, die niemand im Bucket findet?" Die Antwort ist immer: unvollständige Multipart-Uploads, und die Lösung ist `AbortIncompleteMultipartUpload`. Diese Regel gehört in jeden Bucket, in den per Multipart geschrieben wird — Querverweis auf Karte 11.

**Die ETag-Frage.** Ein Multipart-Objekt hat kein MD5 der Gesamtdatei als ETag. Antwortoptionen, die eine MD5-Prüfung der ganzen Datei über das ETag vorschlagen, sind bei Multipart falsch.
