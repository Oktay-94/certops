---
nr: 18
title: "S3 Transfer Acceleration + Multipart Upload — große Dateien von überall"
services:
  - Amazon S3 (Transfer Acceleration)
  - S3 Multipart Upload
  - Amazon API Gateway
  - AWS Lambda
  - S3 Lifecycle (AbortIncompleteMultipartUpload)
signalwords:
  - "Nutzer auf der ganzen Welt"
  - "große Dateien hochladen"
  - "Upload dauert zu lange"
  - "Upload bricht ab und muss von vorn beginnen"
  - "Bucket liegt in einer einzigen Region"
  - "möglichst wenig Änderung an der Anwendung"
domains: [D3, D4, D1]
assets:
  png: battle_card_18.png
  pdf: battle_card_18.pdf
  svg: battle_card_18.svg
status_note: "Sichtprüfung des PNG durch Chat-Claude nicht möglich (Regel F9) — rechnerische QC bestanden (0 Befunde), Render-Sanity ok. Faktencheck 18.07.2026 gegen S3-User-Guide (Multipart-Limits) und S3-FAQ (TA-Abrechnung)."
---

# Battle Card 18 — S3 Transfer Acceleration · Multipart Upload

## Szenario

**Cinelab Global** ist eine Postproduktion mit festem Bucket in **eu-central-1**
(Frankfurt), aber mit Cuttern und Coloristen als Freelancer in **Sydney,
São Paulo und Warschau**. Diese laden Rohmaterial hoch: einzelne Dateien
zwischen **40 und 80 GB**.

Der Ist-Zustand:

- Der Upload aus Sydney dauert Stunden und ist quälend langsam, obwohl der
  Anschluss dort schnell ist — die Distanz und die vielen Internet-Hops fressen
  den Durchsatz auf.
- Bricht die Verbindung nach 70 GB ab, fängt der Upload **von vorn** an. Das ist
  bereits dreimal passiert.
- Die Uploads laufen aktuell über den eigenen Webserver, der dabei zum
  Flaschenhals wird und die Dateien zweimal überträgt.
- Der Finanzchef hat gerade eine S3-Rechnung mit Speicherkosten für Daten
  gesehen, die niemand im Bucket findet.

Gesucht: schnellerer Upload, Wiederaufnahme nach Abbruch, direkter Weg vom
Browser in den Bucket — und keine unsichtbaren Kosten.

## Ablauf 1–6

**1 — Der Client holt presigned URLs.**
Der Browser fragt bei API Gateway + Lambda an. Lambda startet mit
`CreateMultipartUpload` einen Upload und erzeugt **pro Part eine presigned URL**.
Der Vorteil: Die **AWS-Credentials bleiben serverseitig**, der Browser bekommt
nur zeitlich befristete, auf genau diesen Part begrenzte Schreibrechte. Und die
Nutzdaten laufen anschließend **nicht** über den Webserver — er sieht nur die
Metadaten, nicht die 80 GB.

**2 — Die Datei wird in Parts zerlegt und parallel hochgeladen.**
Der Client schneidet die Datei in Blöcke — hier 64 MB. Die Regeln, die in der
Prüfung abgefragt werden: **Partgröße 5 MiB bis 5 GiB**, **maximal 10.000 Parts**
pro Objekt, der **letzte Part darf kleiner** als 5 MiB sein. Empfohlen ist
Multipart **ab etwa 100 MB** Objektgröße, Pflicht ab 5 GB. Parallelität ist der
eigentliche Geschwindigkeitsgewinn: statt einer TCP-Verbindung laufen zehn, und
eine langsame Verbindung bremst nicht mehr den ganzen Transfer.

**3 — Transfer Acceleration bringt die Parts über den Edge in die Region.**
Statt an `bucket.s3.eu-central-1.amazonaws.com` gehen die PUTs an
`bucket.s3-accelerate.amazonaws.com`. Der Part landet damit an der
**nächstgelegenen CloudFront Edge Location** — für Sydney ein paar Millisekunden
statt eines Wegs um die halbe Welt — und reist von dort über das **optimierte
AWS-Backbone** nach Frankfurt. Der lange Weg wird also nicht kürzer, aber er
verlässt das öffentliche Internet fast sofort. Einschalten ist eine
Bucket-Einstellung; die Anwendung ändert nur den Endpoint-Namen.

**4 — Ein fehlgeschlagener Part wird einzeln wiederholt.**
Das ist der Kern von Multipart und der Grund, warum die drei Abbrüche kein
Problem mehr sind: Jeder Part ist ein eigener Request mit eigenem Erfolg. Reißt
die Leitung bei Part 812 von 1.250, wird **nur Part 812** neu gesendet, nicht die
70 GB davor. Der Upload ist damit auch **pausierbar und wiederaufnehmbar**.

**5 — CompleteMultipartUpload setzt das Objekt zusammen.**
Erst wenn der Client `CompleteMultipartUpload` mit der Liste aller Parts und
ihrer ETags schickt, entsteht in S3 **ein** Objekt. Vorher ist im Bucket nichts
sichtbar — kein halbes Video, kein Platzhalter. Erkennungsmerkmal eines
Multipart-Objekts: Das ETag endet auf `-N`, wobei N die Anzahl der Parts ist
(und deshalb bei Multipart-Objekten **kein MD5 der Gesamtdatei** ist).

**6 — Eine Lifecycle-Regel räumt abgebrochene Uploads weg.**
Genau hier kam die mysteriöse Rechnung her: Parts hochgeladener, aber nie
abgeschlossener Uploads **belegen Speicher und kosten Geld**, tauchen aber in
der normalen Objektliste nicht auf. Die Regel
**`AbortIncompleteMultipartUpload`** löscht sie nach — hier — sieben Tagen. Diese
Regel gehört in jeden Bucket, in den Multipart hochgeladen wird; sie ist eine
der beliebtesten Kostenfragen der Prüfung.

**Verworfen — der direkte Long-Haul über das öffentliche Internet.**
Der graue, durchgestrichene Pfad ist der Ist-Zustand: eine einzelne
PUT-Verbindung von Sydney quer über das öffentliche Internet nach Frankfurt.
Langsam, weil viele Hops, und alles-oder-nichts, weil ein Request.

## Prüfungs-Kernsatz

> **Multipart löst das Zuverlässigkeits- und Parallelitätsproblem (nur der
> kaputte Part wird wiederholt), Transfer Acceleration löst das
> Distanzproblem (Eintritt an der Edge, dann AWS-Backbone). Beides zusammen,
> plus eine Abort-Lifecycle-Regel gegen die unsichtbaren Kosten.**

## Klassiker-Fallen

**Falle 1 — Transfer Acceleration ist kein CloudFront-Ersatz und umgekehrt.**
CloudFront liefert Inhalte **heraus** zu den Nutzern und cached sie. Transfer
Acceleration beschleunigt den Weg **hinein** in einen einzelnen Bucket und
cached gar nichts — es nutzt nur die Edge-Standorte als Eintrittspunkt. Steht in
der Frage "Nutzer laden hoch" → TA. Steht "Nutzer laden herunter / Videos
streamen" → CloudFront. **Global Accelerator** ist wieder etwas anderes:
statische Anycast-IPs für beliebige TCP/UDP-Anwendungen, ohne Caching
(siehe Karte 35).

**Falle 2 — Wenn TA nichts bringt, kostet TA nichts.**
Beliebte Frage: "Ein Nutzer verwendet S3TA, der Transfer war aber nicht
schneller. Was wird berechnet?" Antwort: die **normalen** S3-Transfergebühren,
**keine** S3TA-Gebühr. AWS erkennt das und umgeht das TA-System gegebenenfalls.
Es gibt außerdem ein **Speed Comparison Tool**, mit dem man den Nutzen vorher
misst — das ist oft die richtige "was tun Sie zuerst"-Antwort.

**Falle 3 — Bei kleinen Dateien ist TA das falsche Werkzeug.**
AWS empfiehlt bei Objekten **unter 1 GB** eher CloudFront mit PUT/POST. TA
entfaltet seinen Nutzen über Distanz **und** Volumen; bei tausend kleinen Dateien
ist Parallelität (viele gleichzeitige Uploads) wirksamer als TA.

**Falle 4 — Multipart-Grenzen im Kopf haben.**
10.000 Parts, 5 MiB–5 GiB pro Part, letzter Part beliebig klein. Daraus folgt
eine typische Rechenfrage: Wer eine 5-TB-Datei mit 100-MB-Parts hochlädt, braucht
50.000 Parts — **zu viele**. Die Partgröße muss also mit der Objektgröße
mitwachsen. Der maximal zulässigen Objektgröße wurde von AWS inzwischen deutlich
angehoben (Doku-Stand 2026: **48,8 TiB**); Prüfungsfragen und ältere Kursmaterialien
rechnen häufig noch mit dem klassischen Wert **5 TB**. Im Zweifel gilt in der
Prüfung die Zahl, die zur Antwortoption passt — im Projekt die Doku.

**Falle 5 — Der Bucketname darf keine Punkte enthalten.**
Transfer Acceleration verlangt einen DNS-konformen Bucketnamen **ohne Punkte**
(wegen des Wildcard-Zertifikats für `*.s3-accelerate.amazonaws.com`). Ein Bucket
`cinelab.global.media` lässt sich nicht beschleunigen. Das ist eine der wenigen
Stellen, an denen die Namenswahl eine Feature-Entscheidung blockiert.

## Bewusste Vereinfachungen im Diagramm

- **Die Edge Location ist als eine Box gezeichnet.** Real geht jeder Freelancer
  an einen *anderen* PoP (Sydney, São Paulo, Warschau). Drei Boxen hätten
  dreimal dieselbe Aussage transportiert.
- **Der Rückweg der presigned URLs fehlt als Pfeil.** Er steckt in Schritt 1;
  ein Antwortpfeil hätte die Request/Response-Beziehung optisch verdoppelt.
- **Die `UploadPart`-Requests laufen im Diagramm über einen einzigen Pfeil**,
  obwohl es pro Part ein eigener HTTPS-Request an eine eigene presigned URL ist.
- **`CompleteMultipartUpload` ist als eigener Pfeil vom Client zu S3 gezeichnet**
  und geht bewusst **nicht** über den Accelerate-Pfad — technisch kann auch dieser
  Call beschleunigt werden, aber er transportiert keine Nutzdaten, und der
  separate Pfeil macht sichtbar, dass das Objekt erst hier entsteht.
- **API Gateway und Lambda sind eine Box.** Für diese Karte ist ihre Trennung
  irrelevant (siehe Karte 1 für die eigentliche Serverless-API).
- **CORS, Bucket Policy und die IAM-Rolle der Lambda fehlen.** Ohne sie
  funktioniert der Browser-Upload nicht, sie tragen aber zur Kernaussage nichts
  bei.
- **Die Zahl "64 MB je Part" ist eine Beispielwahl**, kein Standardwert. Der
  richtige Wert ergibt sich aus Objektgröße, Bandbreite und der 10.000-Grenze.
