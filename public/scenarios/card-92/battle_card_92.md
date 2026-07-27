---
nr: 92
title: "IoT Greengrass V2, Inferenz am Edge"
services: ["AWS IoT Greengrass V2", "Amazon S3", "AWS IoT Core", "Amazon SageMaker AI"]
domains: ["D2", "D3"]
signalwords:
  - "intermittent or unreliable connectivity"
  - "must continue to operate when disconnected"
  - "run inference locally on the device"
  - "edge devices in a factory"
  - "sync data when the connection is restored"
assets: ["battle_card_92.svg", "battle_card_92.png", "battle_card_92.pdf"]
status_note: |
  qc.py: 0 Befunde. 6 Boxen = 4 Ablaufboxen + 1 verworfene Box + 1 Footer-Rect.
  Die 2 gestrichelten Zonen zaehlen NICHT als Boxen (dasharray 4,4 wird von
  qc.py ausgenommen), erscheinen aber in den 26 Texten mit ihren 2 Labels.
  11 Segmente = 3 Hauptpfeile + 2 Bypass-Segmente + 2 X-Diagonalen + 4 Phantome
  aus 2 Marker-IDs (mfluss, mverw). 3 Badges, 1 X-Kreis.
  Korrekturrunden:
    (1) VOR dem Zeichnen, gerechnet: die Luecke zwischen Spalte 2 und 3 traegt
        beide Zonenkanten. Mit 90 px waere die Batch-18-Falle eingetreten
        (Badge 30 px + Markerbereich 30 px + zwei Zonenkanten passen nicht).
        Luecke von Anfang an auf 150 px gesetzt, Boxbreite dafuer auf 280 px
        reduziert. Kein Verschieben im Nachhinein.
    (2) VOR dem Zeichnen, precheck.py: "Greengrass Deployment" 300 px > 264 px
        Limit der 280er-Box. Spalten liessen sich nicht weit genug aufziehen,
        weil das 150-px-Fenster gesetzt ist; Titel auf "Deployment" gekuerzt,
        Servicename in die erste Zeile gerettet.
  Zonenkanten geprueft: Zone A endet bei x=785, Badge-Aussenkante bei x=775
  (10 px Luft). Zone B beginnt bei x=840, Markerbereich ab x=845 (5 px Luft).
  Keine Kante schneidet Badge oder Marker.
  Zonenrand-Regel: Zonenoberkante 230, erste Boxreihe 300 -> 70 px, deutlich
  ueber den geforderten 45 px.
  Render-Sanity: 2400x1350, Titelband-Kanaldivergenz 0.
  R13 reine Schwarzpixel: 0.
  zones.py (R7): 0 Befunde.
  R16 engster Label-zu-Boxkante-Abstand: 38.0 px, Traeger ist das Zonenlabel
  "AWS Cloud" (Grenze 9 px).
  R12-Gegencheck: 0 Verstoesse.
  Footer von Hand gemessen: 1182.5 px (Grenze 1420 px).
  Sichtpruefung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter lieferte
  einen leeren Platzhalter (R8/F9).
---

# Battle Card 92 — IoT Greengrass V2, Inferenz am Edge

## Szenario

Eine Fertigungslinie klassifiziert Kamerabilder per ML-Modell und sortiert
Ausschuss aus. Die Anbindung des Werks faellt regelmaessig fuer Minuten aus.
Die Klassifikation darf in dieser Zeit nicht stehenbleiben.

## Ablauf

**1 — Modell liegt in der Cloud.** Trainiert wird dort, wo Rechenleistung
billig und elastisch ist. Das fertige Artefakt liegt in S3 und wird als
Greengrass-Komponente beschrieben, also mit Version und Abhaengigkeiten.

**2 — Deployment schiebt die Komponenten auf das Geraet.** Greengrass V2 rollt
drei Bausteine aus: die **Model**-Komponente mit dem Modell, die
**Runtime**-Komponente mit dem ML-Framework und seinen Abhaengigkeiten, und die
**Inference**-Komponente mit dem Code. Das ist der entscheidende Unterschied zu
V1: nicht eine Lambda-Funktion mit angehaengten Ressourcen, sondern versionierte
Komponenten, die einzeln aktualisiert werden koennen.

**3 — Das Core-Geraet rechnet lokal.** Die Inferenz laeuft auf dem Geraet in der
Halle. Kameras und Sensoren sprechen ueber einen **lokalen MQTT-Broker** mit dem
Core-Geraet — die Kommunikation zwischen den Geraeten im Werk braucht die Cloud
gar nicht. Faellt die Leitung, merkt die Linie davon nichts.

**4 — Stream Manager puffert und holt nach.** Ergebnisse werden lokal
zwischengespeichert und exportiert, sobald die Verbindung wieder steht. Ohne
diesen Baustein waeren die Messwerte waehrend des Ausfalls schlicht weg.

## Pruefungs-Kernsatz

Zwei Bedingungen zusammen zeigen auf Greengrass: „muss auch ohne Verbindung
weiterarbeiten" **und** „Verarbeitung auf dem Geraet". Faellt eine der beiden
weg, ist es meist eine andere Antwort.

## Abgrenzungen

- **Lambda@Edge / CloudFront Functions:** laufen in CloudFront-Standorten, nicht
  auf Kundenhardware. Sie helfen gegen Netzlatenz, nicht gegen Netzausfall.
- **AWS Outposts:** bringt AWS-Hardware ins Rechenzentrum des Kunden, ist aber
  eine Rack-Loesung mit Anspruch an Strom, Kuehlung und Anbindung — nicht das
  Geraet an der Linie.
- **Snowball Edge:** Rechenleistung vor Ort fuer abgeschottete oder mobile
  Einsaetze, projektbezogen. Greengrass ist der Dauerbetrieb auf eigener,
  kleiner Hardware.
- **IoT Core allein (Karte 91):** bringt Daten in die Cloud. Sobald die
  Verarbeitung am Geraet bleiben muss, kippt es zu Greengrass. Das ist der
  Trennpunkt zwischen den Karten 91 und 92.

## Klassiker-Fallen

- **V1 und V2 sind nicht dasselbe Produkt.** V1 ist Lambda-zentriert, V2 denkt in
  Komponenten. Wer eine V1-Anleitung auf V2 uebertraegt, sucht Bausteine, die es
  so nicht mehr gibt. Die Pruefung testet die Unterscheidung mit hoher
  Wahrscheinlichkeit **nicht** — sie fragt Greengrass auf der Ebene „lokal
  ausfuehren, offline weiterlaufen, spaeter synchronisieren".
- **„Offline" heisst nicht „ohne Vorbereitung".** Das Modell muss vorher
  ausgerollt worden sein. Ein Greengrass-Geraet, das noch nie Verbindung hatte,
  kann nichts.
- **Der lokale MQTT-Broker ist ein eigener Baustein.** Er kommt nicht
  automatisch mit; ohne die entsprechende Komponente reden die Client Devices
  nicht mit dem Core-Geraet.

## Faktencheck-Notizen

- Aufbau aus Nucleus und optionalen Komponenten, darunter lokale ML-Inferenz:
  AWS IoT Greengrass V2 Developer Guide, „How AWS IoT Greengrass works"
  (https://docs.aws.amazon.com/greengrass/v2/developerguide/how-it-works.html).
- Dreiteilung in Model-, Runtime- und Inference-Komponente:
  „Machine learning components"
  (https://docs.aws.amazon.com/greengrass/v2/developerguide/machine-learning-components.html).
- Lokaler MQTT-Broker als waehlbare Komponente: „Choose an MQTT broker"
  (https://docs.aws.amazon.com/greengrass/v2/developerguide/choose-local-mqtt-broker.html).
- Stream Manager fuer den Export lokal erzeugter Daten in AWS-Dienste:
  „Stream manager"
  (https://docs.aws.amazon.com/greengrass/v2/developerguide/stream-manager-component.html).
- V1 End of Support am 7. Oktober 2026, Extended-Life-Phase seit 30. Juni 2023:
  Hinweisbanner im V1 Developer Guide und
  „AWS IoT Greengrass Version 1 maintenance policy"
  (https://docs.aws.amazon.com/greengrass/v1/developerguide/maintenance-policy.html).

## Nicht bestaetigt / bewusst weggelassen

- **SageMaker AI Edge Manager kommt nicht vor.** Der Dienst wurde am
  26. April 2024 eingestellt; die zugehoerige Greengrass-Komponente
  `aws.greengrass.SageMakerEdgeManager` steht zwar weiterhin in der
  Dokumentation, traegt dort aber einen Einstellungshinweis
  (https://docs.aws.amazon.com/greengrass/v2/developerguide/sagemaker-edge-manager-component.html).
  Eine Karte, die ihn zeigt, lehrt einen abgeschalteten Dienst.
- **Keine Angabe zu konkreten ML-Frameworks auf der Karte.** Die
  AWS-Beispielkomponenten nennen DLR und TensorFlow Lite; welche Kombination
  zum Pruefungszeitpunkt aktuell ist, hat sich mehrfach geaendert. Auf der Karte
  steht nur „Model, Runtime, Inference".
- **Keine Zahl zur Pufferkapazitaet** des Stream Managers.
- **Kein Hardware-Mindestprofil.** Der Developer Guide nennt Anforderungen, die
  sich je Komponente unterscheiden; eine einzelne Zahl waere irrefuehrend.

## Bewusste Vereinfachungen im Diagramm

- **Die Client Devices sind nicht als eigene Boxen gezeichnet.** Kameras und
  Sensoren, die ueber den lokalen Broker mit dem Core-Geraet sprechen, stecken in
  der Zeile „Lokaler MQTT-Broker".
- **Der Rueckweg in die Cloud ist nur einer.** In der Praxis exportiert Stream
  Manager in mehrere Ziele (S3, Kinesis, IoT SiteWise); die Karte zeigt den
  Export als eine Richtung, ohne Ziel.
- **Die Zonen sind eine Vereinfachung.** „AWS Cloud" und „Werkshalle" sind
  Verstaendnishilfen, keine Netzwerkgrenzen im technischen Sinn.

## Farbkonventionen dieser Karte

- Modell in S3 = **Storage** (gruen), Stream Manager ebenfalls **Storage** —
  beide halten Daten, das ist konsistent.
- Deployment = **Governance/Gold**. Hier faellt die Steuerungsentscheidung, was
  auf welches Geraet kommt; das ist Control Plane, nicht Datenpfad. Aus dem
  gleichen Grund sind auch die Pfeile der Hauptkette gold: der Ablauf ist eine
  Ausrollkette, kein Datenstrom.
- Core-Geraet = **Compute** (orange).
- Die verworfene Box behaelt **Compute/Orange**, weil ein SageMaker Endpoint
  Compute ist. Abgelehnt wird sie durch X-Kreis und roten Pfad.
- **Kein Grau auf dieser Karte.** Die offene Grau-Frage aus Karte 85 wird hier
  nicht angefasst.
