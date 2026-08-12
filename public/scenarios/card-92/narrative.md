---
cardNumber: 92
slug: greengrass-v2-inferenz-am-edge
title: "IoT Greengrass V2, Inferenz am Edge"
services: ["AWS IoT Greengrass V2", "Amazon S3", "AWS IoT Core", "Amazon SageMaker AI"]
domains: ["D2", "D3"]
correctAnswer: "B"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/what-is-iot-greengrass.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/machine-learning-components.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/choose-local-mqtt-broker.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/stream-manager-component.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/manage-data-streams.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/work-with-streams.html"
  - "https://docs.aws.amazon.com/greengrass/v1/developerguide/maintenance-policy.html"
  - "https://docs.aws.amazon.com/greengrass/v2/developerguide/sagemaker-edge-manager-component.html"
---

## Die Grundidee zuerst

Stell dir eine Sortieranlage vor, an der jedes Werkstück fotografiert und beurteilt wird: gut oder Ausschuss.

**Weg eins:** Neben dem Band steht ein Telefon. Für jedes Werkstück ruft der Mitarbeiter in der Zentrale an, beschreibt das Bild, wartet auf das Urteil, drückt dann den Knopf. Das funktioniert gut — solange die Leitung steht. Fällt sie aus, steht die Anlage. Nicht weil die Maschine kaputt wäre, sondern weil das Urteil woanders wohnt.

**Weg zwei:** Die Zentrale schickt einmal einen Ordner in die Halle. Darin steht dieselbe Entscheidungslogik, nach der der Experte urteilt. Ab jetzt entscheidet die Halle selbst. Die Zentrale schickt gelegentlich einen neuen Ordner, wenn sich die Regeln geändert haben, und bekommt gelegentlich eine Liste der getroffenen Entscheidungen zurück. Zwischen diesen beiden Ereignissen ist die Leitung entbehrlich.

Greengrass V2 ist der Ordner samt Kurierdienst. Das Modell wird in der Cloud trainiert, weil Rechenleistung dort billig und elastisch ist. Ausgeführt wird es dort, wo das Band steht.

Das erklärt die zwei Bedingungen der Aufgabe: „muss auch ohne Verbindung weiterarbeiten" und „Verarbeitung auf dem Gerät". Beide zusammen heißen: das Urteil darf nicht mehr am Telefon hängen.

## Was es eigentlich ist — der lokale Stream

Das ML-Modell ist der offensichtliche Teil dieser Architektur. Der interessantere ist der Puffer, denn er ist es, der aus „läuft weiter" auch „verliert nichts" macht. Der Stream Manager verwaltet ihn, und ein Stream ist nichts weiter als ein Datensatz mit Aufbewahrungsregeln:

```python
client.create_message_stream(MessageStreamDefinition(
    name="klassifikation-linie-3",
    max_size=268435456,                              # Default: 256 MB
    stream_segment_size=16777216,                    # Default: 16 MB
    time_to_live_millis=None,                        # Default: keine TTL
    strategy_on_full=StrategyOnFull.OverwriteOldestData,   # Pflichtfeld
    persistence=Persistence.File,                    # Default: File
    flush_on_write=False,                            # Default: False
    export_definition=ExportDefinition(
        kinesis=None, iot_analytics=None,
        iot_sitewise=None, s3_task_executor=None
    )
))
```

Lies das von oben nach unten, es ist die vollständige Antwort auf „was passiert während des Ausfalls": Wie viel darf sich anstauen (`max_size`), in welchen Häppchen (`stream_segment_size`), wie lange soll es garantiert lesbar bleiben (`time_to_live_millis`), **was passiert, wenn der Platz voll ist** (`strategy_on_full`), überlebt es einen Neustart des Geräts (`persistence`), und wohin geht es, sobald die Leitung wieder steht (`export_definition`).

Kein Feld davon ist Zierde. `strategy_on_full` ist als einziges Pflichtfeld markiert, und genau das ist die Entscheidung, die dir das Szenario abverlangt.

## Der Weg durch die Karte

### Kasten 1 — Modell in S3

Trainiert wird in der Cloud, weil dort Rechenleistung nach Bedarf entsteht und nach der Arbeit wieder verschwindet. Das Ergebnis ist eine Datei: Gewichte, Struktur, ein Format.

Diese Datei wird zur **Model-Komponente**. Eine Komponente ist ein Softwarepaket mit Namen, Version und Abhängigkeiten — das gleiche Prinzip wie bei einem Paketmanager, nur dass das Ziel kein Server ist, sondern ein Gerät in einer Halle.

AWS trennt dabei drei Sorten sauber: die **Model**-Komponente enthält das Modell als Artefakt, die **Runtime**-Komponente enthält das Skript, das das ML-Framework samt Abhängigkeiten auf dem Gerät installiert, und die **Inference**-Komponente enthält den Code, der beides benutzt.

Warum drei statt einer? Weil sie sich unterschiedlich schnell ändern. Das Modell wird nachtrainiert, vielleicht monatlich. Die Runtime bleibt jahrelang gleich. Der Inferenzcode ändert sich, wenn sich der Prozess ändert. Wer alles in ein Paket packt, muss bei jedem neuen Modell auch das Framework neu ausrollen — über eine Leitung, die in diesem Szenario ohnehin das schwächste Glied ist.

### Pfeil 1 — Deployment anlegen

Zwischen Kasten 1 und Kasten 2 passiert etwas, das keine Datenverarbeitung ist: eine Steuerungsentscheidung. Du legst fest, welche Komponenten in welcher Version auf welche Geräte gehören.

Deshalb ist dieser Pfeil auf der Karte gold und nicht orange. Es fließen keine Nutzdaten, es fließt ein Soll-Zustand.

### Kasten 2 — Deployment

Ein Deployment ist keine Aktion, die einmal läuft und dann vorbei ist. Es ist ein **beschriebener Zielzustand**, den Greengrass auf dem Gerät herstellt und hält.

Das Bild dazu: Du gibst nicht die Anweisung „installiere Version 2.4". Du hinterlegst „auf diesen Geräten gilt Version 2.4". Ein Gerät, das drei Wochen offline war und wieder auftaucht, holt sich den Zielzustand ab und gleicht sich an — ohne dass jemand den Ausrollbefehl wiederholt.

Das ist der praktische Unterschied zu V1. V1 dachte in Lambda-Funktionen mit angehängten Ressourcen. V2 denkt in versionierten Komponenten, die einzeln aktualisiert werden können.

### Pfeil 2 — Komponenten landen auf dem Gerät

Der einzige Moment in diesem Szenario, in dem die Leitung wirklich gebraucht wird. Er passiert selten und er darf dauern.

Das ist eine Umkehrung, die man sich klarmachen sollte: In den meisten Cloud-Architekturen ist die Verbindung der Dauerzustand und der Ausfall die Ausnahme. Hier ist die Verbindung das Ereignis. Das Gerät holt sich beim nächsten Kontakt, was es braucht, und läuft danach wieder allein. Deshalb ist es auch kein Problem, wenn ein Deployment eine Stunde nach dem Anlegen erst auf dem letzten von vierzig Geräten ankommt — niemand wartet darauf.

### Kasten 3 — Core-Gerät

Auf dem Gerät läuft der **Greengrass Nucleus**, die Basis, die alle anderen Komponenten startet, überwacht und neu startet. Darüber liegen deine drei ML-Komponenten.

Und daneben liegt der Teil, den man beim ersten Lesen überliest: der **lokale MQTT-Broker**. Kameras und Sensoren im Werk sprechen nicht mit AWS, sie sprechen mit dem Core-Gerät — und dafür braucht es einen Broker in der Halle. Greengrass bietet zwei zur Auswahl: **Moquette** für MQTT 3.1.1, leichtgewichtig, und **EMQX** für MQTT 5, mit mehr Funktionen und mehr Hunger nach Ressourcen (auf Linux verlangt er zusätzlich Docker). Wer keinen davon ausrollt, hat ein Core-Gerät, mit dem niemand redet.

AWS empfiehlt ausdrücklich, **nur einen** Broker auszurollen: MQTT Bridge und IP Detector — die Komponenten, die den lokalen Broker mit AWS IoT Core verbinden beziehungsweise den Geräten sagen, unter welcher Adresse das Core-Gerät erreichbar ist — arbeiten jeweils nur mit einem. Wer trotzdem zwei will, muss ihnen verschiedene Ports geben.

Fällt jetzt die Leitung: Kamera → Broker → Inferenz → Aktor bleibt vollständig innerhalb der Halle. Kein Schritt dieser Kette verlässt das Werksgelände, und deshalb merkt die Linie vom Ausfall nichts. Das ist der Satz, um den herum die ganze Karte gebaut ist.

### Pfeil 3 — Ergebnisse in den Puffer

Jedes Urteil wird in den Stream oben geschrieben. Solange die Leitung steht, wandert es fast sofort weiter. Solange sie weg ist, staut es sich.

### Kasten 4 — Stream Manager

Der Stream Manager ist eine eigene Komponente (`aws.greengrass.StreamManager`), die zusätzlich zur Greengrass-Software mindestens **70 MB RAM** braucht. Deine Komponenten reden über einen lokalen Port mit ihr — standardmäßig **8088** — und zwar über das Stream Manager SDK, nicht über eine Datei oder eine Queue.

Wenn die Verbindung wiederkommt, exportiert er selbstständig. Ziele sind Amazon S3, Kinesis Data Streams und AWS IoT SiteWise. Bei S3 schneidet er große Dateien in Multipart-Teile, deren Mindestgröße bei **5 MB** liegt — dem Minimum, das S3 selbst für Multipart-Uploads erlaubt.

Ohne diesen Baustein wären die Messwerte des Ausfallfensters schlicht weg. Die Anlage hätte weitergearbeitet, aber niemand könnte hinterher sagen, was sie entschieden hat.

### Der gestrichelte Kasten — SageMaker Endpoint

Der abgelehnte Weg ist der aus der Metapher: Rohbilder in die Cloud schicken, dort ein Modell hinter einem Endpoint befragen, Antwort zurück.

Er ist nicht falsch gebaut. Er ist für dieses Szenario falsch **gewählt**: Er macht die Klassifikation von der Leitung abhängig. Der rote Pfad mit dem X sagt genau das — nicht „schlechte Architektur", sondern „scheitert an der Bedingung dieser Aufgabe".

## Die entscheidende Unterscheidung

Was passiert, wenn der Puffer während eines langen Ausfalls volläuft? Das ist die einzige Stelle, an der du wirklich etwas entscheidest — und beide Antworten verlieren Daten, nur an unterschiedlichen Enden:

| | `OverwriteOldestData` | `RejectNewData` |
|---|---|---|
| Bei vollem Stream | die ältesten Sätze werden überschrieben | neue Sätze werden abgewiesen |
| Du verlierst | den Anfang des Ausfalls | das Ende des Ausfalls |
| Passt zu | Messreihen, bei denen der letzte Stand zählt | Vorgängen, bei denen Lücken auffallen müssen |
| Merkt dein Code etwas? | nein, das Schreiben gelingt weiter | ja, das Anhängen schlägt fehl |

Es gibt keine dritte Option „nichts verlieren". Der Speicher des Geräts ist endlich, und ein Ausfall kann länger dauern als jeder Puffer.

## Die ehrliche Feinheit

**„Offline" ist ein Fenster, keine Eigenschaft.** Die Karte sagt „arbeitet ohne Cloud weiter", und das stimmt für die Inferenz uneingeschränkt. Für die Daten stimmt es nur, bis `max_size` erreicht ist — in der Voreinstellung 256 MB. Wie lange das reicht, hängt davon ab, was du hineinschreibst: ein Klassifikationsergebnis pro Werkstück reicht für sehr lange, ein Vorschaubild pro Werkstück für sehr kurz. Die Doku nennt hier bewusst keine Zeitangabe, und die Karte ebenfalls nicht.

**Ein Gerät ohne erste Verbindung kann nichts.** Der Zielzustand muss einmal angekommen sein. „Funktioniert offline" heißt nie „funktioniert von Anfang an ohne Netz".

**`Persistence.File` ist kein Synonym für „sicher".** Die Voreinstellung schreibt den Stream auf die Platte, sodass er einen Neustart des Geräts übersteht — `Persistence.Memory` täte das nicht. Aber `flush_on_write` steht standardmäßig auf `False`: geschrieben wird gepuffert, nicht sofort auf den Datenträger gedrückt. Ein Stromausfall in der Halle — im Gegensatz zum Leitungsausfall, um den es hier geht — kostet dich die letzten Sätze. Und die Persistenz ist das einzige Feld, das sich nachträglich **nicht** ändern lässt: Wer sie korrigieren will, muss den Stream löschen und neu anlegen. Damit ist die Entscheidung zwar reversibel, aber nur unter Verlust des Inhalts.

**Die lokalen Daten sind nicht verschlüsselt.** Die Doku sagt es deutlich: Stream-Daten werden weder im Ruhezustand noch beim lokalen Transport zwischen Komponenten verschlüsselt. AWS verlässt sich auf Dateirechte und, falls vorhanden, Full-Disk-Encryption. Erst der Export in die Cloud läuft über TLS. In einer Werkshalle, in der jemand die SD-Karte ziehen kann, ist das eine Aussage mit Konsequenzen.

**Zwei AWS-Seiten widersprechen sich beim Ziel IoT Analytics.** Die Seite zur Komponente trägt einen Hinweis, dass AWS IoT Analytics am 15. Dezember 2025 eingestellt wurde und der Endpoint nicht mehr funktioniert. Die Übersichtsseite zum Stream Manager listet IoT Analytics weiterhin als Exportziel. Nach der Rangfolge gewinnt die spezifischere Seite mit dem Einstellungshinweis — auf der Karte und in diesem Text steht IoT Analytics deshalb nirgends.

**SageMaker Edge Manager taucht bewusst nicht auf.** Der Dienst wurde am 26. April 2024 eingestellt. Die zugehörige Greengrass-Komponente steht noch in der Dokumentation, aber mit Einstellungshinweis. Wer eine ältere Anleitung findet, findet sie als vollwertigen Baustein beschrieben.

## Syntax lesen — die Bytezahlen im Stream

Die beiden großen Zahlen in der Definition sehen willkürlich aus. Sie sind es nicht:

```
268435456  =  256 × 1024 × 1024   →  256 MB   (max_size)
 16777216  =   16 × 1024 × 1024   →   16 MB   (stream_segment_size)
             │      │      │
             │      │      └─ Byte je Kilobyte
             │      └─ Kilobyte je Megabyte
             └─ die eigentliche Größe
```

Warum überhaupt Segmente? Weil der Stream nicht als eine Datei auf der Platte liegt, sondern in Blöcken. Überschreiben und Löschen passieren **segmentweise**, nicht satzweise. Setzt du `max_size` auf 256 MB und `stream_segment_size` auf 16 MB, dann verwirft `OverwriteOldestData` im Ernstfall 16 MB auf einmal — nicht den einen ältesten Datensatz.

Das ist auch der Grund für die Regel beim Ändern: `max_size` darf nie kleiner werden als die Segmentgröße. Ein Behälter, der kleiner ist als der Eimer, mit dem man ihn füllt, ergibt keinen Sinn.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine dauerhafte Leitung, von der die Produktion abhängt
- kein Rechenzentrum in der Halle, das gekühlt und gewartet werden müsste
- kein eigener Update-Mechanismus für Modelle auf Geräten
- kein Nachbau eines MQTT-Brokers und keine eigene Geräte-Authentifizierung
- kein selbstgeschriebener Puffer mit Retry-Logik, Priorisierung und Bandbreitenbegrenzung
- keine Inferenz-Latenz über das Internet

Übrig bleiben: ein Gerät mit Nucleus, drei versionierte Komponenten, ein Broker und ein Stream mit Aufbewahrungsregeln.

## Wenn du dir eine Sache merkst

**Greengrass verschiebt nicht die Daten zur Logik, sondern die Logik zu den Daten — und der Stream Manager sorgt dafür, dass die Daten trotzdem ankommen.**

Lambda@Edge und CloudFront Functions laufen in AWS-Standorten, nicht auf deiner Hardware; sie helfen gegen Entfernung, nicht gegen Leitungsausfall. Outposts bringt AWS-Hardware ins Rechenzentrum, aber als Rack mit Strom-, Kühlungs- und Anbindungsanspruch, nicht als Kasten an der Linie. Ein SageMaker Endpoint ist genau das Telefon aus der Metapher.

## Prüfungsknackpunkte

**Signalwörter:** „intermittent or unreliable connectivity", „must continue to operate when disconnected", „run inference locally on the device", „sync data when the connection is restored". Erst die Kombination aus *lokal verarbeiten* **und** *ohne Verbindung weiter* zeigt auf Greengrass. Fällt eine der beiden Bedingungen weg, ist es fast immer eine andere Antwort.

**Die V1/V2-Falle ist eine Lernfalle, keine Prüfungsfalle.** Ältere Kursmaterialien beschreiben Greengrass als „Lambda-Funktionen auf dem Gerät". V1 erreicht am **7. Oktober 2026** das End of Support; danach sind Konsole und Ressourcen nicht mehr erreichbar. Die Prüfung fragt Greengrass auf der Ebene „lokal ausführen, offline weiterlaufen, später synchronisieren" — dort ist die Unterscheidung folgenlos.

**Scope-Hinweis, offen benannt:** IoT Greengrass steht im offiziellen SAA-C03-Exam-Guide auf der Liste der ausdrücklich nicht geprüften Dienste. Die Karte bleibt trotzdem nützlich, weil das Muster „Verarbeitung muss am Ort bleiben" in Domain-2-Fragen als Distraktor auftaucht — nur wirst du das Wort Greengrass im Fragenpool wahrscheinlich nicht als richtige Antwort sehen.

**A — SageMaker Endpoint:** Verlagert die Entscheidung wieder ans Ende einer Leitung, die laut Aufgabe ausfällt.

**C — Lambda@Edge:** Läuft in CloudFront-Standorten. Gegen Latenz, nicht gegen Netzausfall.

**D — IoT Core mit Rules Engine:** Bringt Gerätedaten zuverlässig in die Cloud und verteilt sie dort weiter. Das ist der richtige Baustein, solange die Verarbeitung in der Cloud stattfinden darf. Sobald die Aufgabe verlangt, dass sie am Gerät bleibt, kippt es zu Greengrass — das ist der Trennpunkt, an dem die Prüfung diese beiden Dienste gegeneinander stellt.

**Ein Nachtrag zur Formulierung.** Aufgaben in diesem Feld schreiben gern „low latency" statt „offline". Das ist eine andere Anforderung: Latenz löst man auch mit einem näheren Standort, Ausfallsicherheit nicht. Prüf im Zweifel, ob im Text irgendwo steht, dass die Verbindung *wegfällt*, oder nur, dass sie *langsam* ist. Nur das erste zwingt die Verarbeitung ans Gerät.
