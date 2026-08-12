---
cardNumber: 93
slug: mediaconvert-vod-kette-cloudfront
title: "MediaConvert, S3, CloudFront"
services: ["AWS Elemental MediaConvert", "Amazon S3", "Amazon CloudFront"]
domains: ["D3", "D4"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/mediaconvert/latest/ug/auto-abr.html"
  - "https://docs.aws.amazon.com/mediaconvert/latest/ug/choosing-your-streaming-output-groups.html"
  - "https://docs.aws.amazon.com/mediaconvert/latest/ug/feature-restrictions-for-automated-abr.html"
  - "https://docs.aws.amazon.com/mediaconvert/latest/ug/example-job-settings.html"
  - "https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html"
  - "https://aws.amazon.com/elastictranscoder/faqs/"
  - "https://aws.amazon.com/blogs/media/migrating-workflows-from-amazon-elastic-transcoder-to-aws-elemental-mediaconvert/"
---

## Die Grundidee zuerst

Stell dir einen Verlag vor, der ein fertiges Manuskript bekommen hat.

**Weg eins:** Du druckst genau eine Ausgabe. Eine Schriftgröße, ein Papier, ein Format. Sie liegt in einem einzigen Lager, und von dort wird sie in alle Welt verschickt. Wer schlecht sieht, kommt nicht zurecht. Wer weit weg wohnt, wartet. Wer sie unterwegs lesen will, schleppt einen Ziegel mit sich herum. Du hast Arbeit gespart und den Leser dafür bezahlen lassen.

**Weg zwei:** Das Manuskript geht einmal in die Setzerei. Von dort kommen Taschenbuch, Großdruckausgabe und E-Book zurück — dieselbe Geschichte, verschiedene Verpackungen. Und du legst alle Fassungen in Regionallager, damit der Weg vom Regal zum Leser kurz ist.

MediaConvert ist die Setzerei, CloudFront sind die Regionallager. Das Manuskript ist die Datei im ersten Bucket, und der entscheidende Punkt an ihr steht schon in Schritt eins der Karte: **sie ist fertig**. Sie hat einen Anfang, ein Ende und eine bekannte Länge. Genau das erlaubt die Setzerei — man kann nicht setzen, was noch geschrieben wird.

## Was es eigentlich ist — der Job

MediaConvert kennt keine Server, die du startest, und keine Cluster, die du dimensionierst. Es kennt **Jobs**: eine Beschreibung dessen, was aus einer Eingangsdatei werden soll. Hier gekürzt auf die Zeilen, die für dieses Szenario zählen — die Konsole erzeugt für einen echten Job ein Vielfaches davon, und AWS empfiehlt auch genau das:

```json
{
  "Role": "arn:aws:iam::1234:role/MediaConvert_Default_Role",
  "Settings": {
    "TimecodeConfig": { "Source": "ZEROBASED" },
    "Inputs": [
      { "FileInput": "s3://vod-source-1234/uploads/clip-4711.mov" }
    ],
    "OutputGroups": [
      {
        "Name": "Apple HLS",
        "OutputGroupSettings": {
          "Type": "HLS_GROUP_SETTINGS",
          "HlsGroupSettings": {
            "Destination": "s3://vod-output-1234/clip-4711/"
          }
        },
        "Outputs": [
          {
            "ContainerSettings": { "Container": "M3U8" },
            "VideoDescription": {
              "CodecSettings": {
                "Codec": "H_264",
                "H264Settings": {
                  "RateControlMode": "QVBR",
                  "QualityTuningLevel": "MULTI_PASS_HQ"
                }
              }
            }
          }
        ]
      }
    ]
  }
}
```

Von oben nach unten: mit welchem Recht (`Role`), was hinein (`Inputs.FileInput`), in welches Paketformat (`OutputGroupSettings.Type`), wohin das Ergebnis (`Destination`), und wie codiert werden soll (`CodecSettings`).

Die beiden letzten Zeilen sind kein Zufall. `QVBR` und `MULTI_PASS_HQ` sind exakt die zwei Werte, die AWS verlangt, sobald du **Automated ABR** benutzt und den Job programmatisch abschickst. In der Konsole setzt AWS sie stillschweigend; wer JSON von Hand schreibt, muss sie selbst eintragen, sonst wird der Job abgelehnt.

## Der Weg durch die Karte

### Kasten 1 — S3 Source-Bucket

Ein Nutzer lädt hoch, die Datei liegt. Mehr passiert hier nicht, und das ist die Aussage.

Der Bucket ist an dieser Stelle kein Speicher im Sinn von „Archiv", sondern ein **Übergabepunkt**. Die Datei muss vollständig angekommen sein, bevor der nächste Schritt überhaupt Sinn ergibt — ein halb hochgeladenes Video ist kein Eingangsmaterial, sondern ein Fehler.

Das ist die eine Eigenschaft, die dieses Szenario von jedem Live-Szenario trennt, und die Prüfung testet genau sie.

### Pfeil 1 — der Job wird ausgelöst

Auf der Karte ist das ein Pfeil mit einer Zahl darauf. In der Praxis steckt dahinter ein Mechanismus, den die Karte bewusst nicht zeichnet: Der Upload erzeugt ein S3-Event, das Event startet eine Lambda-Funktion oder eine Step-Functions-Ausführung, und die schickt den Job oben an MediaConvert.

Warum nicht auf der Karte? Weil sie sonst von vier auf zehn Kästen gewachsen wäre und der Blick auf die eigentliche Kette verloren gegangen wäre. Merk dir aber: **MediaConvert holt sich nichts.** Es wartet auf einen Auftrag. Ohne den Auslöser liegt die Datei für immer im ersten Bucket.

### Kasten 2 — MediaConvert

Hier passiert die Arbeit, und hier liegt der Grund, warum niemand das selbst baut.

Aus einer Eingangsdatei entsteht eine **Rendition-Ladder**: mehrere Fassungen desselben Videos in unterschiedlichen Auflösungen und Bitraten. Der Player des Zuschauers wählt daraus, was seine Leitung gerade hergibt, und wechselt mitten im Abspielen, wenn sie sich ändert.

Mit **Automated ABR** entscheidet MediaConvert selbst, wie viele Stufen diese Leiter braucht. Es analysiert den Inhalt und wirft Stufen weg, die mehr Bandbreite kosten, ohne besser auszusehen. Die Zahlen dahinter stehen in der Doku: Die Obergrenze für die Stufenzahl liegt zwischen **3 und 15**, voreingestellt sind 15. Die höchste Stufe bekommt standardmäßig maximal **8 Mbit/s**, die niedrigste mindestens **600 kbit/s**.

Das Bild dazu: Ein Zeichentrickfilm und ein Fußballspiel brauchen nicht dieselbe Leiter. Bei der Zeichentricksequenz sähen zwei benachbarte Stufen identisch aus — du zahltest für Codierung, Speicher und Auslieferung von etwas, das niemand unterscheiden kann.

### Pfeil 2 — Renditions und Manifeste werden geschrieben

Was herauskommt, sind zwei Sorten Dateien: die Videosegmente selbst und die **Manifeste**, also Textdateien, die auflisten, welche Stufen es gibt und wo ihre Segmente liegen. Das Manifest ist die Datei, die der Player zuerst abruft.

Bei HLS ist das eine `.m3u8`-Datei, und es gibt sie zweistöckig: ein übergeordnetes Manifest, das die verfügbaren Stufen mit ihrer jeweiligen Bandbreite nennt, und je Stufe ein untergeordnetes, das deren Segmente in Reihenfolge auflistet. Der Player liest oben, entscheidet sich für eine Stufe, liest deren Liste und beginnt zu laden. Ändert sich die Leitung, springt er in eine andere Liste — mitten im Film, ohne dass der Zuschauer etwas merkt.

Das ist auch der Grund, warum ein einzelnes Segment nie „das Video" ist. Die Kette ist ohne Manifest nicht abspielbar, und ein Manifest ohne die Segmente, auf die es zeigt, ist eine leere Inhaltsangabe.

### Kasten 3 — S3 Output-Bucket

Getrennt vom Original, und das aus einem praktischen Grund: Original und Ergebnis haben verschiedene Lebensdauern, verschiedene Zugriffsmuster und verschiedene Schutzbedürfnisse. Das Original wird nie ausgeliefert, die Renditions werden fast nur ausgeliefert.

Und der Bucket bleibt **privat**. Er ist Origin, nicht Website. Auf der Karte steht „Privat, kein Public Read" — das ist keine Empfehlung, sondern der Punkt, an dem die meisten Prüfungsfragen zu dieser Architektur entschieden werden.

Der Unterschied zwischen beiden Begriffen ist technisch und nicht bloß sprachlich: Ein S3-Bucket kann als *Website-Endpoint* auftreten, dann spricht er HTTP, kennt Index- und Fehlerdokumente und ist naturgemäß öffentlich. Oder er tritt als *REST-Endpoint* auf, dann ist er ein Objektspeicher hinter einer Berechtigungsprüfung. Nur die zweite Variante lässt sich mit Origin Access Control verriegeln. Wer die Website-Variante konfiguriert und sich dann wundert, warum die Verriegelung nicht greift, hat den falschen von zwei Endpunkten eingetragen — ein Fehler, der sich im Konsolenformular fast von selbst macht, weil beide Adressen in derselben Auswahlliste stehen.

### Pfeil 3 — CloudFront zieht vom Origin

Der einzige Weg aus dem Bucket heraus. Kein Zuschauer spricht je direkt mit S3.

Und das ist eine Richtungsaussage, keine bloße Zeichnung: CloudFront **holt** beim ersten Zugriff auf ein Segment, legt es im Standort ab und liefert es beim nächsten Mal von dort. Der Bucket sieht deshalb nicht die Zuschauerlast, sondern nur die Fehlversuche im Cache. Bei einem Video, das zehntausend Leute sehen, sind das statt zehntausend Abrufen je Segment eine Handvoll.

### Kasten 4 — CloudFront

Der Player fragt zuerst das Manifest ab, dann Segment für Segment. Beides kommt aus dem CloudFront-Standort, der dem Zuschauer am nächsten liegt.

Die Verriegelung heißt **Origin Access Control**. CloudFront signiert seine Anfragen an S3 mit SigV4 und tritt gegenüber dem Bucket als AWS-Service-Principal auf. Der Bucket erlaubt genau diesem Principal den Lesezugriff, und nur, wenn die Anfrage von deiner Distribution stammt. Alles andere prallt ab.

Die ältere Variante, die **Origin Access Identity**, tut Ähnliches, gilt aber laut CloudFront-Doku als Legacy und wird nicht mehr empfohlen — unter anderem, weil sie mit SSE-KMS-verschlüsselten Objekten nicht ohne Umwege zurechtkommt und nicht alle Regionen abdeckt.

### Der gestrichelte Kasten — eigene FFmpeg-Flotte

Der abgelehnte Weg ist der, den fast jedes Team einmal andenkt: EC2-Instanzen mit FFmpeg, eine Queue davor, fertig.

Er funktioniert. Er kostet nur an einer Stelle, die im Entwurf unsichtbar ist: Skalierung bei Lastspitzen, Codec-Pflege über Jahre, Wiederholung bei Fehlern, Ausfall einzelner Instanzen mitten im Transcode. Nichts davon ist Videotechnik, alles davon ist Betrieb. Der rote Pfad mit dem X sagt nicht „geht nicht", sondern „das ist der Teil, den du gerade eingekauft hättest".

Der Vollständigkeit halber: Für sehr kurze Clips ist FFmpeg in einer Lambda-Funktion durchaus gängig. An echten Videos scheitert es an der Laufzeitgrenze.

## Die entscheidende Unterscheidung

Die Achse dieser Karte ist nicht das Ausgabeformat. Beide Dienste können HLS. Die Achse ist, **ob es ein Ende der Datei gibt**:

| | AWS Elemental MediaConvert | AWS Elemental MediaLive |
|---|---|---|
| Eingang | eine Datei, vollständig vorhanden | ein laufender Stream |
| Arbeitseinheit | ein Job je Datei | ein laufender Channel |
| Endet | wenn die Datei durch ist | wenn du ihn stoppst |
| Signalwort in der Frage | „uploaded", „on-demand", „library" | „live", „broadcast", „as it happens" |
| Abrechnung | je Minute transkodierter Ausgabe | je Laufzeit des Channels |

Steht „live" in der Aufgabe, ist MediaConvert falsch — egal wie gut der Rest passt. Steht „users upload video files", ist MediaLive falsch, aus demselben Grund.

## Die ehrliche Feinheit

**Abgerechnet wird je Ausgabeminute, nicht je Job.** Das ist die Zeile, die die Karte auf D4 verankert, und sie hat eine unbequeme Folge für genau das, was auf der Karte steht. „HLS und DASH parallel" heißt: zwei Output Groups, also **doppelte Transcoding-Kosten** bei identischen Einstellungen. Die AWS-Doku sagt das offen und empfiehlt für alles, was nicht auf Apple-Geräte von vor etwa 2013 zielt, stattdessen eine einzelne **CMAF**-Ausgabe — ein Paket, das moderne Apple- wie Android-Player abspielen, und damit auch nur ein Satz Dateien, den du speichern und ausliefern musst.

Die Karte zeigt trotzdem HLS und DASH, weil das die Kombination ist, die in Prüfungsfragen und älteren Referenzarchitekturen auftaucht. Wenn du eine echte Plattform baust, ist CMAF fast immer die bessere Antwort. Wenn du eine Prüfungsfrage liest, ist „HLS und DASH" das erwartete Vokabular. Der Unterschied ist dokumentiert, damit du ihn kennst, statt ihn zu erben.

**Bei Automated ABR weißt du vorher nicht, was du bekommst.** Die Doku beantwortet das direkt und ohne Beschönigung: Es gibt keine Möglichkeit, die Zahl der Renditions vor dem Lauf zu kennen, weil die Entscheidung vom Inhalt abhängt. Abgerechnet wird nur, was tatsächlich geschrieben wurde — setzt du das Maximum auf 12 und MediaConvert findet acht sinnvolle Stufen, zahlst du acht. Dafür läuft jede Stufe im teureren 2-Pass-Tarif, weil Automated ABR ein Professional-Tier-Merkmal mit Zwei-Pass-Codierung ist.

**Automated ABR schließt reservierte Kapazität aus.** Jobs mit Automated ABR laufen ausschließlich in einer On-Demand-Queue, nie in einer reservierten. Wer beides will — planbare Kosten durch Reservierung *und* automatische Leiter —, kann das nicht haben. Außerdem muss der Codec H.264 oder H.265 sein.

**Automated ABR ohne Beschleunigung ist langsam.** Die Doku empfiehlt, Automated ABR immer mit **Accelerated Transcoding** zu kombinieren, und begründet das damit, dass der Job sonst deutlich länger läuft als eine handgebaute Leiter mit vergleichbaren Ausgaben. Bemerkenswert an der Empfehlung ist die Kostenseite: Beschleunigung kostet hier nichts extra, weil Automated ABR ohnehin im 2-Pass-Tarif abgerechnet wird. Das ist einer der seltenen Fälle, in denen AWS eine Option empfiehlt, die man nicht gegen Geld abwägen muss — nur gegen das Vergessen.

**Elastic Transcoder ist als Antwortoption tot.** AWS hat den Dienst am **13. November 2025** abgeschaltet; seitdem sind Konsole und Ressourcen nicht mehr erreichbar. Kurios genug: Die AWS-Produktseiten tragen die Ankündigung bis heute im Futur („will discontinue"), obwohl das Datum längst vergangen ist. Der Fragenpool könnte die alte Gegenüberstellung „Elastic Transcoder oder MediaConvert?" noch enthalten — die Antwort ist dann trotzdem MediaConvert, inzwischen aus einem zweiten Grund.

## Syntax lesen — die Bucket-Policy für OAC

Die Verriegelung des Output-Buckets ist eine einzige Policy-Anweisung, und jede Zeile darin trägt Gewicht:

```
{
  "Effect":    "Allow",
  "Principal": { "Service": "cloudfront.amazonaws.com" },   ← wer darf
  "Action":    "s3:GetObject",                              ← was darf er
  "Resource":  "arn:aws:s3:::vod-output-1234/*",            ← woran
  "Condition": {
    "StringEquals": {
      "AWS:SourceArn":
        "arn:aws:cloudfront::1234:distribution/E1B2C3D4E5"  ← aus welcher Distribution
    }
  }
}
```

Der `Principal` ist bemerkenswert: kein Nutzer, keine Rolle, sondern **der Dienst selbst**. CloudFront handelt hier nicht in deinem Namen, sondern in seinem eigenen — und die `Condition` ist das, was diese Erlaubnis überhaupt erträglich macht.

Ohne die Bedingung dürfte *jede* CloudFront-Distribution der Welt aus deinem Bucket lesen, auch die eines Fremden. Der `SourceArn`-Vergleich schnürt die Erlaubnis auf deine eine Distribution zusammen. Wer die Zeile vergisst, hat den Bucket nicht privat gemacht, sondern nur umständlich öffentlich.

## Was du dadurch nicht baust

- keine EC2-Flotte für Transcoding, kein Auto Scaling dafür
- keine FFmpeg-Version, die jemand pflegen muss
- keine Wiederholungslogik für abgebrochene Transcodes
- keinen Webserver, der Videos ausliefert
- keine Bandbreitenplanung für den Ursprungsspeicher
- keine handgeschriebene Rendition-Ladder je Videotyp

Übrig bleiben: zwei Buckets, ein Job-JSON, eine Distribution und eine Bucket-Policy mit vier Zeilen Inhalt.

## Wenn du dir eine Sache merkst

**Liegt die Datei fertig vor, ist es MediaConvert — und der Bucket dahinter bleibt privat, weil CloudFront ihn mit OAC im Namen des Dienstes ausliest.**

MediaLive verarbeitet einen laufenden Stream, nicht eine Datei. MediaPackage verpackt und schützt Ausgaben, ist für eine reine VOD-Kette aber optional und wird erst nötig, wenn DRM oder Just-in-time-Packaging dazukommen. Eine eigene FFmpeg-Flotte löst dieselbe Aufgabe und verkauft dir dafür einen Betriebsvertrag.

## Prüfungsknackpunkte

**Signalwörter:** „users upload video files", „transcode into multiple formats and bitrates", „adaptive bitrate streaming", „on-demand video library", „deliver to a global audience". Das Wort „upload" allein entscheidet oft schon die Frage.

**Die Public-Read-Falle.** Der Output-Bucket öffentlich zu machen, ist der bequeme Weg und in der Prüfung praktisch immer die falsche Option — nicht nur wegen der Sicherheit, sondern weil damit der Cache umgangen werden kann und die Kostenrechnung der Architektur kippt. OAC ist die erwartete Antwort, OAI die veraltete.

**„Alle Formate" ist Marketingsprache.** MediaConvert deckt eine breite, aber endliche Menge an Ein- und Ausgabeformaten ab. Aufgaben, die ein exotisches Format nennen, meinen das meist als Nebengeräusch — prüf trotzdem, ob die Frage auf eine Formatgrenze zielt.

**A — eigene FFmpeg-Flotte auf EC2:** Löst das Problem und schafft ein zweites, nämlich den Betrieb der Flotte.

**B — MediaLive und MediaPackage:** Die Live-Kette. Falsche Eingangsseite für eine fertige Datei.

**D — S3 direkt ausliefern, ohne CDN:** Funktioniert, kostet aber Latenz für entfernte Zuschauer und macht den Bucket zum Flaschenhals.
