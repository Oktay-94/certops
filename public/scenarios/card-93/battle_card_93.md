---
nr: 93
title: "MediaConvert, S3, CloudFront"
services: ["AWS Elemental MediaConvert", "Amazon S3", "Amazon CloudFront"]
domains: ["D3", "D4"]
signalwords:
  - "users upload video files"
  - "transcode into multiple formats and bitrates"
  - "adaptive bitrate streaming"
  - "deliver video to a global audience"
  - "on-demand video library"
assets: ["battle_card_93.svg", "battle_card_93.png", "battle_card_93.pdf"]
status_note: |
  qc.py: 0 Befunde. 6 Boxen = 4 Ablaufboxen + 1 verworfene Box + 1 Footer-Rect.
  11 Segmente = 3 Hauptpfeile + 2 Bypass-Segmente + 2 X-Diagonalen + 4 Phantome
  aus 2 Marker-IDs (mfluss, mverw). 3 Badges, 1 X-Kreis.
  Korrekturrunden: keine. precheck.py meldete 0 Befunde bei 22 Texten, qc.py
  0 Befunde im ersten Durchlauf. Das Layout ist das erprobte Vierer-Muster aus
  Batch 18 (Breite 302, Luecken 90, x = 61/453/845/1237), die verworfene Box
  haengt als Bypass unter der Reihe.
  Render-Sanity: 2400x1350, Titelband-Kanaldivergenz 0.
  R13 reine Schwarzpixel: 0.
  zones.py (R7): 0 Befunde.
  R16 engster Label-zu-Boxkante-Abstand: 69.5 px (Grenze 9 px).
  R12-Gegencheck: 0 Verstoesse.
  Footer von Hand gemessen: 1112.6 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 93 — MediaConvert, S3, CloudFront

## Szenario

Eine Plattform nimmt Videos von Nutzern entgegen. Jedes hochgeladene Video muss
in mehrere Aufloesungen und Bitraten gewandelt werden, damit es auf Telefon,
Fernseher und im Browser laeuft — und es soll weltweit schnell abspielen.

## Ablauf

**1 — Upload landet im Source-Bucket.** Der entscheidende Punkt steht schon
hier: die Datei liegt **vollstaendig** vor, bevor irgendetwas passiert. Genau
das trennt diese Karte von Karte 94.

**2 — MediaConvert transkodiert.** Der Dienst arbeitet dateibasiert: ein Job je
Eingangsdatei, daraus eine Rendition-Ladder mit mehreren Aufloesungen und
Bitraten, ausgegeben als HLS und DASH parallel. Skalierung, Codec-Pflege und
Wiederholung bei Fehlern liegen beim Dienst.

**3 — Ergebnisse gehen in den Output-Bucket.** Renditions und Manifeste liegen
getrennt vom Original. Der Bucket bleibt privat — er ist Origin, nicht Website.

**4 — CloudFront liefert aus.** Der Player fragt das Manifest ab und waehlt die
passende Bitrate. Origin Access Control sorgt dafuer, dass der Bucket nur ueber
die Distribution erreichbar ist; ohne OAC koennte jemand die Renditions direkt
aus S3 ziehen und der Cache waere umgangen.

## Pruefungs-Kernsatz

Der Inhalt liegt vor der Auslieferung vollstaendig vor — also dateibasierte
Transkodierung, also MediaConvert. Steht in der Frage „live", ist es MediaLive.
Der Trennpunkt ist nicht das Ausgabeformat, sondern ob es ein Ende der Datei
gibt.

## Abgrenzungen

- **MediaLive:** verarbeitet einen laufenden Stream in Echtzeit. Dieselbe
  Aufgabe, andere Eingangsseite.
- **MediaPackage:** verpackt und schuetzt Ausgaben und macht Just-in-time-
  Packaging. Fuer eine reine VOD-Kette optional; noetig, sobald DRM oder
  formatspezifische Auslieferung on demand gefordert ist.
- **Lambda mit FFmpeg:** funktioniert fuer sehr kurze Clips, scheitert an der
  Laufzeitgrenze und an der Codec-Pflege, sobald es echte Videos sind.
- **S3 direkt ausliefern, ohne CDN:** funktioniert, kostet aber Latenz fuer
  entfernte Zuschauer und macht den Bucket zum Flaschenhals.

## Klassiker-Fallen

- **Elastic Transcoder ist als Antwortoption tot.** AWS hat den Dienst zum
  13. November 2025 abgeschaltet; Konsole und Ressourcen sind seitdem nicht mehr
  erreichbar. Die klassische Pruefungsfrage „Elastic Transcoder oder
  MediaConvert?" kann im Fragenpool noch stehen — die Antwort ist dann trotzdem
  MediaConvert, und zwar inzwischen aus einem zweiten Grund.
- **Der Output-Bucket wird gern oeffentlich gemacht.** Public Read ist der
  bequeme Weg und in der Pruefung praktisch immer die falsche Option; OAC ist
  die erwartete Antwort.
- **„Alle Formate" ist Marketingsprache.** MediaConvert deckt eine breite, aber
  endliche Menge an Ein- und Ausgabeformaten ab. Wer ein exotisches Format
  braucht, muss in der Dokumentation nachsehen.

## Faktencheck-Notizen

- Referenzarchitektur aus MediaConvert, S3 und CloudFront, mit MediaPackage als
  optionalem Baustein: AWS-Loesung „Video on Demand on AWS", Implementation
  Guide
  (https://s3.amazonaws.com/solutions-reference/video-on-demand-on-aws/latest/video-on-demand-on-aws.pdf).
- Abschaltung von Elastic Transcoder zum 13. November 2025 und Verweis auf
  MediaConvert als Nachfolger: AWS for M&E Blog, „Migrating workflows from
  Amazon Elastic Transcoder to AWS Elemental MediaConvert"
  (https://aws.amazon.com/blogs/media/migrating-workflows-from-amazon-elastic-transcoder-to-aws-elemental-mediaconvert/),
  bestaetigt durch das Hinweisbanner im Elastic Transcoder Developer Guide
  (https://docs.aws.amazon.com/elastictranscoder/latest/developerguide/api-reference.html).
  Zwei AWS-Quellen, gleiche Aussage, gleiches Datum — kein Konflikt.
- MediaConvert-Merkmale (Aufloesungen, Codec-Breite, Feature-Paritaet zu Elastic
  Transcoder): derselbe Migrationsartikel.
- Rollenteilung MediaLive fuer Live, MediaConvert fuer Dateien: AWS-Loesungen
  „Live Streaming on AWS with Amazon S3"
  (https://docs.aws.amazon.com/solutions/latest/live-streaming-on-aws-with-amazon-s3/solution-overview.html)
  im Gegensatz zur VOD-Loesung oben.

## Nicht bestaetigt / bewusst weggelassen

- **Keine Preise auf der Karte.** Der Migrationsartikel nennt einen
  Einstiegspreis je Minute; solche Werte aendern sich und gehoeren nicht auf eine
  Lernkarte.
- **Keine Codec-Liste.** HEVC, AV1, ProRes und andere werden in der Quelle
  genannt, sind fuer SAA-C03 aber irrelevant.
- **Kein Step-Functions-Workflow.** Die AWS-Referenzloesung orchestriert mit
  Step Functions, Lambda, DynamoDB, SQS und SNS. Das ist die
  Produktionsausbaustufe und haette die Karte auf zehn Boxen aufgeblaeht; die
  Ausloesung des Jobs steckt in Schritt 2.

## Bewusste Vereinfachungen im Diagramm

- **Die Job-Ausloesung ist nicht als eigener Schritt gezeichnet.** Zwischen
  Upload und Transkodierung liegt in der Praxis ein S3-Event mit einer
  Lambda-Funktion oder einer Step-Functions-Ausfuehrung. Auf der Karte ist das
  der Pfeil mit Badge 1.
- **Ein Output-Bucket statt mehrerer.** Getrennte Buckets fuer Mezzanine,
  Renditions und Archiv sind ueblich.
- **Kein Glacier-Zweig** fuer das Originalmaterial, obwohl die AWS-Loesung ihn
  vorsieht.

## Farbkonventionen dieser Karte

- Beide S3-Buckets = **Storage** (gruen). Dass Quelle und Ziel dieselbe Farbe
  tragen, ist gewollt: es ist zweimal dieselbe Rolle.
- MediaConvert = **Compute** (orange), und die Pfeile der Hauptkette ebenfalls
  orange — die Kette ist ein Verarbeitungsweg, das ist ihr Schwerpunkt.
- CloudFront = **Transport** (teal).
- Die verworfene FFmpeg-Flotte behaelt **Compute/Orange**, weil sie Compute ist;
  abgelehnt durch X-Kreis und roten Pfad, nicht durch rote Fuellung.
