---
cardNumber: 94
slug: ivs-live-streaming-ohne-eigene-infra
title: "Amazon IVS, Live-Streaming"
services: ["Amazon Interactive Video Service", "AWS Elemental MediaLive", "AWS Elemental MediaPackage"]
domains: ["D3", "D4"]
correctAnswer: "A"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/what-is.html"
  - "https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/channel-types.html"
  - "https://docs.aws.amazon.com/ivs/latest/LowLatencyAPIReference/API_ChannelSummary.html"
  - "https://docs.aws.amazon.com/ivs/latest/LowLatencyUserGuide/streaming-config.html"
  - "https://aws.amazon.com/ivs/pricing/"
  - "https://aws.amazon.com/about-aws/whats-new/2023/08/amazon-interactive-video-service-real-time-streaming"
---

## Die Grundidee zuerst

Stell dir vor, du willst eine Sendung machen. Nicht irgendwann — nächste Woche.

**Weg eins:** Du baust einen Sender. Studio, Regie, Encoder-Racks, Redundanz für den Fall, dass ein Rack ausfällt, Leitungen zu den Verteilstellen, jemand, der nachts Bereitschaft hat. Bis das steht, sind Monate vergangen, und du hast noch keine einzige Minute gesendet. Das Handwerk, das du dabei gelernt hast, ist Sendetechnik. Dein Produkt war eigentlich etwas anderes.

**Weg zwei:** Du gehst in ein bestehendes Studio und steckst dein Kabel in eine Buchse an der Wand. Was hinter der Wand passiert — Encoder, Verteilung, Redundanz, Bereitschaft — gehört jemand anderem. Du bekommst dafür weniger Knöpfe. Du bekommst dafür nächste Woche.

Amazon IVS ist die Buchse in der Wand. Der Dienst nimmt dein Signal entgegen, macht daraus die verschiedenen Qualitätsstufen und liefert sie weltweit aus. Es gibt keinen Encoder-Pool zu dimensionieren und keine Origin-Konfiguration zu pflegen.

Und weil du an dieselbe Wand auch ein zweites Kabel stecken kannst, stellt sich sofort die einzige echte Entscheidung dieses Szenarios: Sendest du **an** ein Publikum, oder sprichst du **mit** ihm?

## Was es eigentlich ist — der Channel

Ein Channel ist ein Datensatz, kein Prozess. Du legst ihn an, er kostet nichts, solange niemand sendet, und er wartet, bis jemand sein Kabel einsteckt:

```json
{
  "arn": "arn:aws:ivs:eu-central-1:1234:channel/AbCdef1G2hij",
  "name": "werkstattfunk-live",
  "type": "STANDARD",
  "latencyMode": "LOW",
  "authorized": false,
  "insecureIngest": false,
  "preset": "",
  "recordingConfigurationArn": "",
  "playbackRestrictionPolicyArn": "",
  "ingestEndpoint": "…global-contribute.live-video.net",
  "playbackUrl": "https://…/index.m3u8",
  "srt": { "endpoint": "…", "passphrase": "…" }
}
```

Lies die Felder als Fragen: Welche Qualitätsstufen entstehen (`type`), wie schnell soll es beim Zuschauer sein (`latencyMode`), muss der Player sich ausweisen (`authorized`), darf unverschlüsselt gesendet werden (`insecureIngest`), wird mitgeschnitten (`recordingConfigurationArn`), wohin sendet der Broadcaster (`ingestEndpoint`), und wo schaut man zu (`playbackUrl`).

Drei Felder sind bemerkenswert leer. `preset` ist nur bei den Advanced-Typen belegt, `recordingConfigurationArn` ist leer, solange nichts aufgezeichnet wird, und `playbackRestrictionPolicyArn` ist leer, solange keine Wiedergabebeschränkung gilt. Leerer String heißt hier durchgängig „Funktion aus" — kein `null`, kein fehlendes Feld.

## Der Weg durch die Karte

### Kasten 1 — Broadcaster

Am Anfang steht etwas, das nicht AWS ist: eine Streaming-Software wie OBS, eine Hardware-Kamera mit Encoder, oder das Broadcast-SDK direkt im Browser.

IVS nimmt über drei Protokolle an: **RTMP**, das seit Jahrzehnten übliche; **RTMPS**, dasselbe über TLS; und **SRT**, ein neueres, offenes Protokoll, das ausdrücklich für unzuverlässige Netze gebaut ist und gegen Jitter, Paketverlust und schwankende Bandbreite arbeitet.

Das Feld `insecureIngest` oben entscheidet, ob das unverschlüsselte RTMP überhaupt erlaubt ist. Voreingestellt ist `false` — also nur die gesicherten Varianten. Bei SRT hängt daran noch etwas: Der Channel bekommt eine automatisch erzeugte `passphrase`, mit der die Übertragung verschlüsselt wird, und dieses Feld existiert nur, solange `insecureIngest` aus ist. Wer den unsicheren Weg öffnet, verliert die Passphrase nicht als Einstellung, sondern als Mechanismus.

Dass der Broadcaster außerhalb von AWS steht, ist übrigens keine Nebensache. Die erste Fehlersuche bei Live-Video führt fast immer dorthin zurück — zur Uploadleitung des Senders, nicht zum Dienst.

### Pfeil 1 — Signal geht raus

Der Broadcaster schickt an den `ingestEndpoint`, und mit ihm geht der **Stream Key** — ein Geheimnis, das zum Channel gehört und beweist, dass hier der Berechtigte sendet. Der Key ist kein Feld des Channels selbst, sondern ein eigenes Objekt mit eigenem ARN; man kann ihn ersetzen, ohne den Channel anzufassen. Genau dafür ist er da: Wer versehentlich einen Screenshot seiner OBS-Einstellungen postet, dreht den Key und behält alles andere.

Was an der Ingest-Adresse auffällt: Sie enthält keine Region.

### Kasten 2 — IVS Ingest

Hier steckt die Eigenheit, die man bei IVS wirklich kennen muss, und die Karte sagt sie in zwei Zeilen: **Datenebene global, Steuerebene regional.**

Die Datenebene ist Senden und Zuschauen. IVS nimmt dein Signal an einem Ort nahe bei dir an, und Zuschauer holen es sich über das IVS-eigene Netz von überall. Niemand von beiden muss wissen oder wählen, wo das passiert.

Die Steuerebene ist alles, was du verwaltest: Channels, Stream Keys, Playback-Schlüsselpaare, Recording-Konfigurationen. Die hängen an einer Region. Ein Channel in Frankfurt ist ein anderes Objekt als ein Channel in Irland — sie wissen nichts voneinander, tauchen nicht in derselben Liste auf, und wenn du in der Konsole die falsche Region eingestellt hast, siehst du deinen Channel schlicht nicht.

Das Bild dazu: Der Sendemast steht überall. Der Aktenschrank mit den Sendegenehmigungen steht in genau einem Büro.

### Pfeil 2 — Signal geht in die Verarbeitung

Ein Sprung, den du nicht konfigurierst und nicht getrennt bezahlst. Er ist auf der Karte, damit die Kette lesbar bleibt.

Bei der Bauteil-Variante am unteren Kartenrand wäre genau dieser Pfeil eine eigene Entscheidung: welcher Encoder, welche Redundanz, welches Zielformat. Hier ist er eine Linie zwischen zwei Kästen. Das ist der ganze Unterschied zwischen „managed" und „selbst gebaut", auf eine Strecke von hundert Pixeln eingedampft.

### Kasten 3 — IVS Transcoding

Aus dem einen Eingangssignal entstehen mehrere Qualitätsstufen, aus denen der Player wählt.

Wie viele — und ob überhaupt — hängt vom `type` ab, und hier ist die Karte bewusst vereinfacht. **STANDARD** und die beiden **ADVANCED**-Typen werden transcodiert: mehrere Stufen aus dem Original. ADVANCED_HD deckelt bei 720p, ADVANCED_SD bei 480p, und beide erlauben die Wahl zwischen zwei Transcode-Presets — eins für schmale Leitungen, eins für höhere Qualität. **BASIC** dagegen wird nur *transmuxed*: eine einzige Fassung, unverändert durchgereicht.

Es gibt also einen Kanaltyp, bei dem die Zeile „Rendition-Ladder managed" auf der Karte nicht zutrifft. Wer eine Prüfungsfrage liest, in der „a single quality is sufficient" oder „lowest cost" steht, sollte an BASIC denken.

### Pfeil 3 — die Gabelung

Der Pfeil teilt sich, und die Karte sagt selbst, dass diese Reihenfolge eine Vereinfachung ist: Man wählt die Betriebsart nicht nach dem Transcoding, sondern ganz am Anfang, weil sie bestimmt, was man überhaupt baut.

### Kasten 4 — Channel

Ein Channel ist Rundfunk. Einer sendet, viele schauen zu. Abgerechnet wird nach zwei Größen: der Dauer des Video-Eingangs und der Dauer des ausgelieferten Videos je Zuschauer.

Diese zweite Größe ist die, die überrascht. Zehntausend Zuschauer, die eine Stunde zusehen, erzeugen zehntausend Ausgabestunden. Die Kosten skalieren mit dem Erfolg, und zwar linear.

Das ist ein anderes Kostenmodell als bei fast allem sonst in diesem Kartensatz. Bei einer Datenbank oder einem Cluster zahlst du Vorhaltung und hoffst auf Auslastung; hier zahlst du nichts, solange niemand sendet, und viel, wenn viele zusehen. Für eine Plattform, die schwankende Reichweite hat, ist das ein Vorteil. Für eine, die dauerhaft ein großes Publikum bedient, wird es irgendwann die Position auf der Rechnung, die man verhandelt.

Für die Prüfung wichtiger als der Tarif ist die Struktur: **Eingang und Ausgang werden getrennt gezählt.** Eine Frage, die nur die Sendedauer nennt, hat die halbe Rechnung aufgemacht.

### Kasten 5 — Stage

Ein Stage ist eine Runde. Teilnehmer sind Hosts oder Zuschauer, und ein Host kann einen Zuschauer **auf die Bühne holen** — aus dem Publikum wird ein Mitwirkender. Abgerechnet wird nach Teilnehmerstunden, unabhängig davon, ob jemand redet oder nur dabei ist.

Der Unterschied zum Channel ist damit nicht nur technisch, sondern kaufmännisch invertiert: Beim Channel kostet ein passiver Zuschauer nach ausgeliefertem Video, beim Stage kostet er nach Anwesenheit. Ein Stage mit vielen stillen Teilnehmern ist deshalb kein Sparmodell.

Beide Kästen sind auf der Karte teal, und das ist Absicht: Sie sind gleichrangige Alternativen, keine Abfolge. Ein Stage lässt sich zusätzlich in einen Channel ausspielen — dann bekommen die Channel-Zuschauer allerdings die Channel-Latenz, nicht die des Stage. Wer eine Talkrunde mit vier Gästen und dreißigtausend Zuschauern bauen will, baut also beides: den Stage für die Gäste, den Channel für das Publikum.

### Der gestrichelte Kasten — eigene Live-Kette

MediaLive für das Encoding, MediaPackage für das Packaging und den Schutz, CloudFront für die Auslieferung. Das ist die Bauteil-Variante: mehr Kontrolle, mehr Entscheidungen, mehr Betrieb.

Sie ist nicht falsch. Sie ist die richtige Antwort, sobald Anforderungen dazukommen, die IVS nicht kennt — DRM, redundante Eingangs-Pipelines, formatspezifisches Just-in-time-Packaging. Der rote Pfad sagt nur: Für „soll in Tagen live gehen, ohne Encoder-Know-how" ist das der Umweg.

## Die entscheidende Unterscheidung

Die eine Achse dieser Karte ist die Richtung der Interaktion:

| | Channel | Stage |
|---|---|---|
| Richtung | einer an viele | viele miteinander |
| Rolle der Zuschauer | zuschauen | zuschauen oder mitmachen |
| Abrechnung | Video-Eingangsdauer plus ausgelieferte Zuschauerdauer | Teilnehmerstunden |
| Formulierung in der Frage | „broadcast to a large audience" | „participants", „bring viewers on stage" |
| Latenzklasse | niedrig | Echtzeit, laut Doku unter 300 ms |

Wer die falsche Betriebsart wählt, zahlt nicht nur nach einem anderen Modell, sondern baut ein anderes Produkt.

## Die ehrliche Feinheit

**Zur Latenz von Channels steht hier bewusst keine Zahl — und der Grund gehört offen benannt.** Zwei offizielle AWS-Quellen widersprechen sich:

| Quelle | Aussage zu Low-Latency-Channels |
|---|---|
| IVS Low-Latency Streaming User Guide | Latenz unter fünf Sekunden |
| AWS-Announcement zum Real-Time-Start, August 2023 | zuvor unterstützte IVS Channels mit unter drei Sekunden vom Encoder zum Viewer |

Nach der Projektregel bei widersprechenden AWS-Quellen kommt keine Zahl in den Text. Der Wert für **Stages** ist dagegen konfliktfrei — Doku und Announcement nennen beide unter 300 Millisekunden —, deshalb steht er in der Tabelle oben. Die Karte selbst zeigt auch diese Zahl nicht; sie sollte nicht eine Zahl tragen und die andere verschweigen. Dieser Text kann den Unterschied erklären, die Karte konnte es nicht.

**Der Preis dieser Entscheidung, ebenfalls offen:** „unter 300 ms" ist die Formulierung, an der man Stages in einer Prüfungsfrage sofort erkennt. Wer nur die Karte lernt, hat dieses Signal nicht.

**`latencyMode` ist ein eigenes Feld, das die Karte nicht zeigt.** Der Wert steht standardmäßig auf `LOW`; `NORMAL` liefert Video bis Full HD aus, dafür ohne die Nähe zur Echtzeit. In der Konsole heißen die beiden „Ultra-low" und „Standard". Die Sekundenzahl aus der Doku bezieht sich auf Channels, nicht auf jede beliebige Einstellung eines Channels.

**Zuschauerobergrenzen sind eine bewegliche Größe.** Das Announcement von August 2023 nannte bis zu 10.000 Zuschauer je Stage. Verbindlich für den heutigen Stand sind die Service Quotas, und die hat dieser Text nicht geprüft — nimm die Zahl als Größenordnung, nicht als Grenze, die du in einer Architektur zusagen kannst.

**Encoder-Einstellungen sind nicht optional.** Die Doku ist an einer Stelle ungewöhnlich direkt: Überschreitet das Eingangssignal die für den Kanaltyp erlaubte Auflösung oder Bitrate, bricht die Verbindung wahrscheinlich sofort ab. Empfohlen werden ein Keyframe-Intervall von zwei Sekunden — oder einer, für noch geringere Latenz — und CBR statt VBR als Ratensteuerung. „Fully managed" heißt hier nicht „egal, was du hineinschickst".

## Syntax lesen — der Channel-ARN

Die Global/Regional-Trennung wird an einer einzigen Zeichenkette greifbar:

```
arn:aws:ivs:eu-central-1:1234:channel/AbCdef1G2hij
 │   │   │       │         │      │        │
 │   │   │       │         │      │        └─ ID des Channels
 │   │   │       │         │      └─ Ressourcentyp
 │   │   │       │         └─ AWS-Konto
 │   │   │       └─ Region  ← hier und nur hier wohnt die Steuerebene
 │   │   └─ Dienst
 │   └─ Partition
 └─ Präfix
```

Der `playbackUrl` desselben Channels trägt dagegen keine Region. Das ist kein Schönheitsfehler in der Namensgebung, sondern die Architektur in zwei Zeichenketten: Verwaltet wird das Objekt in Frankfurt, ausgeliefert wird es überall.

Praktische Folge: Ein Skript, das Channels anlegt, muss die Region mitgeben. Ein Player, der zusieht, muss nichts über Regionen wissen. Und wenn ein Kollege sagt „der Channel ist weg", lautet die erste Rückfrage nicht „was ist passiert", sondern „welche Region hast du eingestellt".

## Was du dadurch nicht baust

- keinen Encoder-Pool, der nach Zuschauerzahl dimensioniert werden müsste
- kein Origin und keine Packaging-Stufe
- keine CDN-Konfiguration für Live-Segmente
- keinen RTMP-Server, der gepatcht und überwacht wird
- keine eigene Rendition-Ladder je Inhaltstyp
- keine Kapazitätsplanung für den Tag, an dem plötzlich alle zusehen

Übrig bleiben: ein Channel-Datensatz, ein Stream Key und ein Player-SDK.

## Wenn du dir eine Sache merkst

**Live plus interaktiv plus „ohne eigene Streaming-Infrastruktur" führt zu IVS — und die zweite Frage lautet dann sofort: senden an viele oder sprechen mit vielen?**

MediaLive mit MediaPackage und CloudFront ist dieselbe Aufgabe in Einzelteilen, richtig ab dem Moment, wo DRM oder redundante Pipelines gefordert sind. MediaConvert arbeitet dateibasiert und scheidet aus, sobald das Wort „live" fällt. Ein eigener RTMP-Server auf EC2 ist die klassische Falschantwort, wenn „fully managed" in der Frage steht.

## Prüfungsknackpunkte

**Signalwörter:** „live streaming to a large audience", „without building streaming infrastructure", „interactive live video", „hosts and viewers", „managed live video service". Die Kombination aus *live* und *keine eigene Infrastruktur* ist der Kern; „hosts and viewers" verschiebt die Antwort von Channel zu Stage.

**Channels und Stages werden gern in einen Topf geworfen.** Es sind zwei Produktlinien mit getrennten Abrechnungsmodellen. „Teilnehmer können auf die Bühne geholt werden" zeigt auf Stages, „viele tausend Zuschauer sehen einem zu" auf Channels.

**Regionalität wird unterschätzt.** Weil Senden und Zusehen global sind, vergisst man, dass der Channel selbst in einer Region liegt und dort verwaltet werden muss.

**Scope-Hinweis, offen benannt:** Amazon IVS steht im offiziellen SAA-C03-Exam-Guide auf der Liste der ausdrücklich nicht geprüften Dienste. Die Karte bleibt nützlich, weil die Abgrenzung live gegen dateibasiert und managed gegen selbstgebaut geprüft wird — nur wirst du IVS im Fragenpool wahrscheinlich nicht als richtige Antwort sehen. MediaLive und MediaConvert dagegen schon.

**B — MediaLive, MediaPackage und CloudFront:** Löst dieselbe Aufgabe mit mehr Teilen. Richtig erst, wenn Broadcast-Anforderungen dazukommen.

**C — eigener RTMP-Server auf EC2:** Genau das, was die Aufgabe ausschließt.

**D — MediaConvert:** Dateibasiert. Falsche Eingangsseite für ein laufendes Signal.
