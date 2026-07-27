---
nr: 94
title: "Amazon IVS, Live-Streaming"
services: ["Amazon Interactive Video Service", "AWS Elemental MediaLive", "AWS Elemental MediaPackage"]
domains: ["D3", "D4"]
signalwords:
  - "live streaming to a large audience"
  - "without building streaming infrastructure"
  - "interactive live video"
  - "hosts and viewers"
  - "managed live video service"
assets: ["battle_card_94.svg", "battle_card_94.png", "battle_card_94.pdf"]
status_note: |
  qc.py: 0 Befunde. 7 Boxen = 3 Ablaufboxen + 2 Betriebsart-Boxen +
  1 verworfene Box + 1 Footer-Rect.
  15 Segmente = 2 Hauptpfeile + 3 Segmente im oberen Gabelarm (Stamm, Senkrechte,
  Einlauf) + 2 Segmente im unteren Gabelarm + 2 Bypass-Segmente +
  2 X-Diagonalen + 4 Phantome aus 2 Marker-IDs (mfluss, mverw).
  3 Badges, 1 X-Kreis.
  Korrekturrunden: keine. precheck.py 0 Befunde bei 25 Texten, qc.py 0 Befunde
  im ersten Durchlauf.
  Gabelung vorab gerechnet: Stamm von x=1147 bis x=1225 (78 px). Badge 3 sitzt
  bei x=1182, Aussenkante 1197, also 28 px vor dem Knick. Die Einlaufsegmente
  in die Betriebsart-Boxen sind 75 px lang, der Markerbereich belegt davon
  30 px — ueber der 45-px-Grenze fuer Segmente ohne Badge.
  Render-Sanity: 2400x1350, Titelband-Kanaldivergenz 0.
  R13 reine Schwarzpixel: 0.
  zones.py (R7): 0 Befunde.
  R16 engster Label-zu-Boxkante-Abstand: 97.0 px, der grosszuegigste Wert des
  Batches (Grenze 9 px).
  R12-Gegencheck: 0 Verstoesse.
  Footer von Hand gemessen: 879.8 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 94 — Amazon IVS, Live-Streaming

## Szenario

Eine Plattform will Live-Video mit Zuschauerinteraktion anbieten. Das Team hat
weder Encoder-Know-how noch Lust, eine Auslieferungskette zu betreiben. Es soll
in Tagen live gehen, nicht in Quartalen.

## Ablauf

**1 — Broadcaster sendet.** IVS nimmt ueber gaengige Ingest-Protokolle entgegen:
RTMP, das gesicherte RTMPS und SRT. Als Sender genuegt eine handelsuebliche
Streaming-Software oder das Broadcast-SDK im Browser.

**2 — IVS nimmt nahe am Sender an.** Der Dienst hat eine Eigenheit, die man
kennen sollte: **Datenebene global, Steuerebene regional**. Streamen und
Zuschauen laufen weltweit ueber das IVS-Netz, waehrend Channels, Stream Keys und
Recording-Konfigurationen an einer Region haengen. Ein Channel in einer Region
ist unabhaengig von Channels in anderen Regionen — gestreamt und zugesehen wird
trotzdem von ueberall.

**3 — IVS transkodiert und verteilt.** Die Rendition-Ladder entsteht im Dienst.
Es gibt keinen Encoder-Pool zu dimensionieren und keine Origin-Konfiguration zu
pflegen.

**4 — Zwei Betriebsarten, eine Entscheidung.** **Channels** senden an ein
Publikum; abgerechnet wird nach Video-Eingangsdauer und ausgelieferter
Zuschauerdauer. **Stages** verbinden Teilnehmer miteinander; abgerechnet wird
nach Teilnehmerstunden. Wer die falsche Betriebsart waehlt, zahlt nicht nur
anders, sondern baut auch das falsche Produkt.

## Pruefungs-Kernsatz

Live plus interaktiv plus „ohne eigene Streaming-Infrastruktur" fuehrt zu IVS.
Sobald Broadcast-Anforderungen dazukommen — DRM, redundante Pipelines,
formatspezifisches Packaging — kippt es zu MediaLive und MediaPackage.

## Abgrenzungen

- **MediaLive + MediaPackage + CloudFront:** die Bauteil-Variante. Mehr
  Kontrolle, mehr Entscheidungen, mehr Betrieb. Richtig, wenn die Anforderungen
  ueber das hinausgehen, was IVS fest verdrahtet anbietet.
- **MediaConvert (Karte 93):** dateibasiert. Der Trennpunkt ist, ob der Inhalt
  vor der Auslieferung vollstaendig vorliegt.
- **Eigener RTMP-Server auf EC2:** die klassische Falschantwort, wenn „fully
  managed" in der Frage steht.
- **IVS Chat:** eigener Baustein neben dem Video, nicht Teil der Video-Kette.

## Klassiker-Fallen

- **Channels und Stages werden gern in einen Topf geworfen.** Sie sind zwei
  getrennte Produktlinien mit getrennten Abrechnungsmodellen. Eine Formulierung
  wie „Teilnehmer koennen auf die Buehne geholt werden" zeigt auf Stages, „viele
  tausend Zuschauer sehen einem zu" auf Channels. Ein Stage laesst sich in einen
  Channel ausspielen — dann bekommen die Channel-Zuschauer die Channel-Latenz,
  nicht die des Stage.
- **Die Latenzzahl ist ein Minenfeld.** Siehe unten unter Faktencheck; auf dieser
  Karte steht bewusst keine.
- **Regionalitaet wird unterschaetzt.** Weil Streaming und Zusehen global sind,
  vergisst man leicht, dass der Channel selbst in einer Region liegt und dort
  verwaltet werden muss.

## Faktencheck-Notizen

- Ingest ueber RTMP, RTMPS und SRT; globale Datenebene bei regionaler
  Steuerebene: Amazon IVS Low-Latency Streaming User Guide, „What is Amazon IVS
  Low-Latency Streaming?"
  (https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/what-is.html).
  Direkt geprueft, kein Einstellungshinweis auf der Seite.
- Zwei Betriebsarten und ihre Abrechnung — Channels nach Video-Eingangs- und
  Ausgabedauer, Stages nach Teilnehmerstunden: Amazon IVS Pricing
  (https://aws.amazon.com/ivs/pricing/).
- Stages fassen Hosts und Zuschauer, Zuschauer koennen zu Hosts befoerdert
  werden: AWS-Announcement „Amazon Interactive Video Service announces Real-Time
  Streaming"
  (https://aws.amazon.com/about-aws/whats-new/2023/08/amazon-interactive-video-service-real-time-streaming).

### Quellenkonflikt bei der Latenz — Grund fuer die fehlende Zahl

Zwei offizielle AWS-Quellen nennen fuer **Low-Latency-Channels** verschiedene
Werte:

| Quelle | Aussage |
|---|---|
| IVS Low-Latency Streaming User Guide (Doku, direkt abgerufen) | Latenz unter **5 Sekunden**; derselbe Wert steht auch in der Meta-Beschreibung der Seite |
| AWS-Announcement zum Real-Time-Launch, August 2023 | zuvor unterstuetzte IVS Channels mit unter **3 Sekunden** vom Encoder zum Viewer |

Nach der Projektregel bei widersprechenden AWS-Quellen: **keine Zahl auf die
Karte.** Die Masterplan-Zeile 91–100 nannte „< 3 s Latenz" und stuetzt sich
damit auf die schwaechere der beiden Quellen.

Der Wert fuer **Stages** ist dagegen konfliktfrei: Doku und Announcement nennen
beide unter 300 Millisekunden, das Announcement zusaetzlich bis zu 10.000
Zuschauer je Stage. Diese Zahl haette auf die Karte gedurft. Oktay hat sich
gegen die Aufnahme entschieden, damit die Karte nicht eine Zahl zeigt und die
andere verschweigt — eine halb bezifferte Karte wirft beim Lernen die Frage auf,
warum die zweite Zahl fehlt. Dokumentierte Entscheidung, keine Nachlaessigkeit.

**Kosten dieser Entscheidung, offen benannt:** „unter 300 ms" ist die
Formulierung, an der man Stages in einer Pruefungsfrage erkennt. Die Karte
ersetzt dieses Signal durch die Interaktionsrichtung, was das schwaechere
Merkmal ist. Wer nach Latenzformulierungen sucht, muss diese Notiz lesen.

## Nicht bestaetigt / bewusst weggelassen

- **Alle Latenzangaben**, aus den oben genannten Gruenden.
- **Multitrack Video** und andere neuere Funktionen. Auf einer AWS-eigenen
  Demo-Seite beworben, aber fuer SAA-C03 ohne Belang.
- **Zuschauerobergrenzen** ausser der im Announcement genannten Stage-Zahl, die
  ebenfalls nicht auf der Karte steht.
- **IVS Chat** wird nicht gezeigt.

## Bewusste Vereinfachungen im Diagramm

- **Der Player ist keine eigene Box.** Die Auslieferung an den Zuschauer steckt
  in den beiden Betriebsart-Boxen.
- **Die Aufzeichnung nach S3 fehlt.** IVS kann Streams automatisch aufzeichnen,
  was die Bruecke zu Karte 93 waere. Bewusst weggelassen, damit sich die beiden
  Karten nicht gegenseitig erklaeren — die Trennung live/on demand ist ihr
  gemeinsamer Sinn.
- **Die Gabelung suggeriert eine Reihenfolge**, die es so nicht gibt: man waehlt
  die Betriebsart am Anfang, nicht nach dem Transcoding.

## Farbkonventionen dieser Karte

- Broadcaster = **Quelle** (blau).
- IVS Ingest = **Transport** (teal), IVS Transcoding = **Compute** (orange).
- Beide Betriebsart-Boxen = **Transport** (teal). Sie sind Auslieferungswege,
  und dass sie dieselbe Farbe tragen, zeigt richtigerweise, dass sie
  gleichrangige Alternativen sind und keine Abfolge.
- Die verworfene Box behaelt **Transport/Teal**, weil MediaLive und MediaPackage
  Auslieferungsbausteine sind. Abgelehnt durch X-Kreis und roten Pfad, nicht
  durch rote Fuellung — konsistent mit Batch 18, wo alle fuenf verworfenen Boxen
  ihre Rollenfarbe behielten.
- **Kein Grau.** Die offene Frage aus Karte 85 bleibt unberuehrt.
