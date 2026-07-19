---
nr: 37
title: "CloudFront + S3 mit OAC — privater Bucket, globale Auslieferung"
services:
  - Amazon CloudFront
  - Amazon S3
  - CloudFront Origin Access Control
  - AWS KMS
  - Amazon Route 53
domains: [D1, D3]
signalwords:
  - "the S3 bucket must not be publicly accessible"
  - "only the CloudFront distribution should be able to read the objects"
  - "serve static content to users around the world with low latency"
  - "objects are encrypted with SSE-KMS"
  - "users must not be able to bypass the CDN"
assets:
  png: battle_card_37.png
  pdf: battle_card_37.pdf
  svg: battle_card_37.svg
status_note: >
  QC 0 Befunde (9 Boxen, 39 Texte, 21 gemeldete Segmente — davon 8
  Phantom-Segmente aus den vier Marker-Definitionen, also 13 gezeichnet,
  5 Badges). Render-Sanity bestanden: vier aus der Elementgeometrie
  abgeleitete Freizonen rein weiss, alle 15 Palettenfarben im PNG
  nachweisbar. Footer von Hand mit PIL gemessen: 1379,0 px (Stil-Guide
  ~1420). Sichtpruefung: Bildansicht lieferte einen leeren Platzhalter —
  visuell NICHT geprueft, Oktay muss draufschauen.
---

# Battle Card 37 — CloudFront · S3 mit OAC

## Szenario

**Nordwind Robotics**, Maschinenbauer aus Bremen, veröffentlicht seine
Produktdokumentation als statische Site — ein React-Build, weltweit gelesen,
Schwerpunkt Japan und Nordamerika. Die interne Sicherheitsrichtlinie verbietet
öffentlich lesbare S3-Buckets ausnahmslos, und die Objekte liegen
**SSE-KMS-verschlüsselt**. Gefordert ist: niedrige Latenz weltweit, HTTPS mit
eigener Domain, und ein Bucket, den niemand direkt aufrufen kann.

## Ablauf

**1 — Route 53 löst die Domain auf.** `docs.nordwind.io` ist ein **Alias-Record**
auf die CloudFront-Distribution. Der Alias ist hier kein Stilmittel: Auf einem
Apex-Domain (`nordwind.io` ohne Subdomain) wäre ein CNAME nach DNS-Standard gar
nicht erlaubt — Alias-Records lösen genau dieses Problem und sind bei Route 53
für Anfragen auf AWS-Ziele zudem kostenfrei.

**2 — Die Anfrage landet an einer Edge Location.** CloudFront terminiert TLS am
Rand des Netzes, in der Nähe des Nutzers. AWS Shield Standard ist bei jeder
Distribution ohne Aufpreis dabei. Ein `Default Root Object` (`index.html`) sorgt
dafür, dass ein Aufruf der nackten Domain nicht ins Leere läuft.

**3 — Cache Hit: die Antwort kommt gar nicht erst beim Origin an.** Das ist der
eigentliche Zweck des CDN und zugleich die Abgrenzung, die in der Prüfung zählt:
CloudFront **cached**. Bei statischen Assets bedient die Edge den überwiegenden
Teil der Anfragen selbst — der Bucket sieht diesen Traffic nie, und man bezahlt
weder S3-Requests noch Egress aus der Region.

**4 — Cache Miss: CloudFront signiert den Origin-Request.** Erst jetzt greift
**OAC**. CloudFront erzeugt eine **SigV4-Signatur** mit dem Service-Principal
`cloudfront.amazonaws.com` und schickt den Request per HTTPS an den
**REST-Endpoint** des Buckets. Die Bucket Policy erlaubt `s3:GetObject` für
genau diesen Principal, eingeschränkt über die Condition
`AWS:SourceArn` = ARN dieser Distribution. Diese Condition ist der Schutz gegen
den **Confused-Deputy-Angriff**: Ohne sie könnte jede beliebige fremde
CloudFront-Distribution den Bucket lesen, denn der Service-Principal ist für
alle Kunden derselbe.

**5 — KMS entschlüsselt.** Weil die Objekte mit SSE-KMS verschlüsselt sind,
braucht die Key Policy ein eigenes Statement mit `kms:Decrypt` für denselben
Principal und dieselbe `SourceArn`-Condition. Wird das vergessen, ist der Fehler
kein Berechtigungsfehler an S3, sondern einer an KMS — eine typische
Fehlersuche, die an der falschen Stelle beginnt.

**Verworfen (rotes X):** Der direkte Aufruf der S3-Objekt-URL. Block Public
Access ist aktiv, die Bucket Policy enthält kein öffentliches Statement, also
antwortet S3 mit **403 Forbidden**. Genau das ist die Anforderung „users must
not be able to bypass the CDN".

## Prüfungs-Kernsatz

**OAC ist eine Signaturbeziehung, kein Netzwerkweg.** CloudFront erreicht den
Bucket über das normale öffentliche S3-Endpoint — was den Zugriff privat macht,
ist die Signatur plus die Bucket Policy, nicht eine Leitung.

## Abgrenzungen

**Zu Karte 33 (PrivateLink) und Karte 20 (VPC Endpoints).** Interface- und
Gateway-Endpoints sind **Netzwerkkonstrukte**: Sie schaffen einen Pfad, auf dem
Traffic das öffentliche Internet nicht berührt. OAC schafft keinen Pfad. Es legt
fest, **wer** lesen darf, nicht **wo entlang** gelesen wird. Wer die beiden
vermischt, beantwortet Fragen nach „private connectivity" mit OAC — und Fragen
nach „only my distribution may read the bucket" mit einem VPC Endpoint. Beides
ist falsch.

**Zu Karte 35 (Global Accelerator).** Die Entscheidungsachse steht dort bereits
und wird hier nicht neu hergeleitet, sondern benutzt: **CloudFront cached,
Global Accelerator nicht.** Statischer, cachebarer HTTP-Inhalt gehört hinter
CloudFront. Nicht-cachebarer TCP/UDP-Verkehr, der stabile Anycast-IPs braucht,
gehört hinter Global Accelerator.

## Klassiker-Fallen

**1. S3-Website-Endpoint schließt OAC aus.** Ein Bucket hat zwei Adressen: den
**REST-Endpoint** (`bucket.s3.region.amazonaws.com`) und den
**Website-Endpoint** (`bucket.s3-website-region.amazonaws.com`). Nur der
REST-Endpoint zählt für CloudFront als S3-Origin; der Website-Endpoint gilt als
**Custom Origin**, und dann funktioniert **weder OAC noch OAI**. Der Bucket
müsste öffentlich sein. Anleitungen im Netz kombinieren beides trotzdem
regelmäßig. Wer die Komfortfunktionen des Website-Endpoints braucht
(Index-Dokument in Unterordnern, Redirect-Regeln), löst das stattdessen mit
einer CloudFront Function oder Lambda@Edge.

**2. SSE-KMS schließt OAI aus.** OAI unterstützt kein SSE-KMS. Bei einem
verschlüsselten Bucket ist OAC nicht die bessere, sondern die **einzige**
Option. Ebenso unterstützt OAI keine dynamischen Requests (`PUT`, `POST`,
`DELETE`) und keine AWS-Regionen, die nach Januar 2023 gestartet sind.

**3. `AWS:SourceArn` vergessen.** Eine Bucket Policy, die nur
`Service: cloudfront.amazonaws.com` erlaubt, öffnet den Bucket für **jede**
CloudFront-Distribution weltweit, auch fremde. Der Bucket ist dann formal nicht
öffentlich und trotzdem von außen lesbar.

**4. Object Ownership.** OAC verlangt **Bucket owner enforced** (Standard für
neue Buckets, ACLs deaktiviert). Wer ACLs braucht, muss auf **Bucket owner
preferred** wechseln.

**5. HTTPS zwischen CloudFront und S3 ist nicht automatisch.** Nur bei der
Signing-Einstellung **„always"** ist die Verbindung zum S3-Origin garantiert
HTTPS. Bei „do not sign" oder „do not override authorization header" richtet
sich das Protokoll nach der Viewer- bzw. Origin-Protocol-Policy.

**6. Invalidierung ist kein Deployment-Ersatz.** Nach einem neuen Build liefert
die Edge alte Objekte bis zum TTL-Ablauf aus. Entweder man invalidiert
(kostenpflichtig ab einer Freimenge pro Monat) oder man versioniert die
Dateinamen im Build — der übliche und billigere Weg.

## Faktenlage geprüft (Nachrecherche nach Batch 8)

**Die Behauptung, AWS habe die OAI-Erstellung abgeschaltet, ist nicht haltbar.**
Mehrere Drittquellen mit 2026er-Datum schreiben, neue Distributionen könnten
„seit März 2026 nur noch OAC" verwenden. Eine gezielte Nachrecherche fand
**keine AWS-Ankündigung** dieses Inhalts. Dagegen sprechen mehrere AWS-Quellen,
die **nach** dem behaupteten Stichtag aktualisiert wurden:

- Die Developer-Guide-Seite *Restrict access to an Amazon S3 origin* beschreibt
  weiterhin beide Verfahren und enthält eine vollständige OAI-Anleitung.
- Der AWS-re:Post-Artikel zur OAC-Konfiguration, zuletzt am **17.03.2026**
  überarbeitet, zeigt unverändert die Übergangs-Bucket-Policy mit
  OAI-Statement.
- Der AWS-Ankündigungsblog zu OAC sagt ausdrücklich, OAI funktioniere weiter und
  sei auch für neue Distributionen verwendbar.

**Bewertung:** OAI ist *legacy und nicht empfohlen*, aber nach vorliegender
Quellenlage nicht abgeschaltet. Die Einschränkungen sind real und ausreichend —
kein SSE-KMS, keine dynamischen Requests, keine Regionen nach Januar 2023.
Abwesenheit einer Ankündigung ist kein absoluter Beweis, aber die Beweislast
liegt bei den Blogs, nicht bei der Doku. **Für die Prüfung ohne Belang** — die
Antwort ist in jedem Fall OAC.

## Nicht bestätigt

Die S3-Doku empfiehlt inzwischen **AWS Amplify Hosting** als bevorzugten Weg,
statische Websites aus einem S3-Bucket auszuliefern (Integration seit
30.10.2024). Für SAA-C03 bleibt S3 + CloudFront + OAC die kanonische Antwort;
wo eine Frage aber ausdrücklich nach dem **geringsten Verwaltungsaufwand**
fragt, kann Amplify die gemeinte Lösung sein. Diese Differenz zwischen
Prüfungsrealität und aktueller AWS-Empfehlung ist bewusst nicht auf der Karte,
sondern hier notiert.

## Nachtrag zur Abgrenzung: CloudFront VPC Origins

Seit 2024 gibt es **CloudFront VPC Origins** (seit Mai 2026 auch mit
WebSocket-Unterstützung). Damit kann CloudFront direkt vor Ressourcen in
**privaten Subnetzen** stehen, ohne dass diese öffentlich erreichbar sein
müssen.

Das ist für die Abgrenzung dieser Karte nützlich, weil es sie **schärft**
statt sie aufzuweichen: VPC Origins ist tatsächlich ein **Netzwerkkonstrukt** —
es schafft einen Pfad. OAC bleibt eine **Signaturbeziehung** — es legt fest, wer
lesen darf. Beide gehören zu CloudFront, lösen aber verschiedene Probleme. Wer
den Unterschied hier versteht, verwechselt OAC auch nicht mehr mit einem VPC
Endpoint.

## Bewusste Vereinfachungen im Diagramm

- **OAC ist keine Station im Datenweg.** Deshalb steht die OAC-Box **neben**
  dem Pfeil CloudFront → S3 und ist gestrichelt angebunden, nicht in die Kette
  gesetzt. Der Request läuft nicht „durch" OAC.
- **Route 53 ist kein Durchgangs-Gateway.** Schritt 1 ist eine Namensauflösung;
  der HTTPS-Traffic fließt danach direkt zur Edge, nicht durch Route 53.
- **Der Rückweg zum Viewer ist nur für den Cache Hit gezeichnet.** Bei einem
  Cache Miss geht die Antwort denselben Weg zurück; das als zweite Pfeilschar zu
  zeichnen hätte die Karte überladen.
- **Die Bucket Policy und die KMS Key Policy sind als Textzeilen in den Boxen
  abgebildet**, nicht als eigene Objekte. Real sind es zwei getrennte
  Resource-based Policies.
- **Der Deployment-Weg fehlt** (CI/CD lädt den Build in den Bucket). Die Karte
  zeigt den Lesepfad.

## Farbkonventionen dieser Karte

- **Orange = CloudFront** und der gesamte Auslieferungsfluss — direkt aus dem
  Stil-Guide (Orange = Lambda, Glue, CloudFront, DMS).
- **Grün = S3**, **Blau = Viewer/Client**, **Lila = Route 53**, **Rot =
  verworfen/Falle**: alle unverändert aus dem Stil-Guide.
- **Teal = Config** für OAC — ebenfalls die ursprüngliche Stil-Guide-Bedeutung
  (Teal = Config, Macie). ⚠️ Teal trägt seit Karte 26 zusätzlich die Bedeutung
  „Graph-Datenbank" (Neptune). Auf dieser Karte kommt keine Datenbank vor, die
  Doppelbelegung bleibt hier folgenlos — **die Entscheidung steht weiter aus.**
- **Navy = KMS.** Hier im ursprünglichen Stil-Guide-Sinn „neutral-wichtig,
  Sicherheitsinstanz" (wie Shield, Accounts). ⚠️ Das ist **eine dritte
  Navy-Bedeutung** neben „RDS/Aurora-Cluster" (Stil-Guide) und
  „Infrastruktur-Eintrittspunkt" (Batch 7, ebenfalls noch nicht gegengelesen).
  **Ausdrücklich zum Gegenlesen vorgelegt** — wenn das nicht gewollt ist, ist
  eine eigene Farbe für Verschlüsselung/Schlüsselverwaltung die saubere Lösung.
- **Gestrichelter Boxenrand (7,5)** = Falle bzw. verworfener Pfad.
