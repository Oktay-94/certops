---
nr: 91
title: "IoT Core, Rules Engine, DynamoDB"
services: ["AWS IoT Core", "AWS IoT Rules Engine", "Amazon DynamoDB", "Amazon CloudWatch Logs"]
domains: ["D3", "D4"]
signalwords:
  - "hundreds of thousands of devices"
  - "MQTT"
  - "without managing any servers"
  - "route device messages to a database"
  - "minimize messaging costs"
assets: ["battle_card_91.svg", "battle_card_91.png", "battle_card_91.pdf"]
status_note: |
  qc.py: 0 Befunde. 6 Boxen = 4 Ablaufboxen + 1 verworfene Box + 1 Footer-Rect.
  11 Segmente = 3 Hauptpfeile + 2 Bypass-Segmente + 2 X-Diagonalen + 4 Phantome
  aus 2 Marker-IDs (mfluss, mverw; Phantome zaehlen je ID, nicht je Pfeil).
  3 Badges, 1 X-Kreis.
  Korrekturrunden:
    (1) VOR dem Zeichnen, precheck.py: "IoT Core Message Broker" 309 px > 286 px
        Limit der 302er-Box. Titel auf "IoT Core Broker" gekuerzt.
    (2) NACH dem Zeichnen, qc.py (b): Label "native Action genuegt" kreuzte das
        senkrechte Bypass-Segment bei x=996. Ursache: Korridor 154 px breit,
        Label 157 px. Behoben durch Verschieben der verworfenen Box von
        x=1150 auf x=1200 (Korridor 204 px), nicht durch Kuerzen des Labels.
    (3) NACH dem Zeichnen, redaktionell: ae/ue-Umschrift auf echte
        Kleinumlaute umgestellt. Kleine Umlaute sind fuer text_bbox unkritisch.
  Render-Sanity: 2400x1350, Titelband-Kanaldivergenz 0.
  R13 reine Schwarzpixel: 0.
  zones.py (R7): 0 Befunde.
  R16 engster Label-zu-Boxkante-Abstand: 23.8 px (Grenze 9 px).
  R12-Gegencheck: 0 Verstoesse.
  Footer von Hand gemessen: 973.7 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 91 — IoT Core, Rules Engine, DynamoDB

## Szenario

Ein Anlagenhersteller schliesst 100.000 Sensoren an. Jeder Sensor meldet in
kurzen Abstaenden einen Messwert. Die Werte sollen in einer Tabelle landen,
ohne dass jemand eine Serverflotte betreibt oder Verbindungscode schreibt.

## Ablauf

**1 — Sensor publiziert per MQTT.** Jedes Geraet authentifiziert sich mit einem
eigenen X.509-Client-Zertifikat und veroeffentlicht auf einem Topic wie
`sensors/<id>/data`. MQTT ist hier kein Zufall: die Verbindung bleibt stehen,
der Protokoll-Overhead je Nachricht ist klein, und genau das ist bei
batteriebetriebenen oder schmalbandig angebundenen Geraeten der Unterschied
zwischen machbar und nicht machbar.

**2 — IoT Core nimmt an.** Der Message Broker terminiert die TLS-Verbindungen
und prueft anhand der IoT Policy, ob dieses Geraet auf dieses Topic schreiben
darf. Autorisierung haengt am Zertifikat, nicht an einem geteilten Schluessel —
ein kompromittiertes Geraet laesst sich einzeln sperren, ohne die Flotte
anzufassen.

**3 — Rules Engine filtert und schreibt.** Eine Regel formuliert ein
SQL-aehnliches Statement gegen den Topic-Stream und haengt daran eine Action.
Die Action `dynamoDBv2` schreibt das Ergebnis direkt in die Tabelle und legt
dabei jedes Attribut der Payload in eine eigene Spalte. Zwischen MQTT-Nachricht
und Tabellenzeile steht damit **kein eigener Code**.

## Pruefungs-Kernsatz

Viele Geraete plus MQTT plus „ohne Server" fuehrt zu IoT Core. Sobald in der
Frage steht, dass die Daten „in einen Datenspeicher geroutet" werden sollen,
ist die Rules-Engine-Action gemeint — nicht eine Lambda-Funktion, die dasselbe
von Hand tut.

## Abgrenzungen

- **Eigener MQTT-Broker auf EC2:** technisch moeglich, aber dann traegt man
  Skalierung, Zertifikatsverwaltung und Verfuegbarkeit selbst. In der Pruefung
  fast immer die falsche Antwort, wenn „fully managed" in der Frage steht.
- **API Gateway + Lambda statt MQTT:** verliert die stehende Verbindung und die
  Geraeteidentitaet. Passt fuer gelegentliche HTTP-Aufrufe, nicht fuer eine
  Sensorflotte im Sekundentakt.
- **Kinesis Data Streams als Ziel:** richtig, wenn die Daten *vor* dem Ablegen
  noch aggregiert oder mehrfach ausgewertet werden sollen. DynamoDB ist das
  Ziel, wenn der Einzelwert direkt per Key abgefragt wird.
- **IoT Analytics / Timestream:** Zeitreihen-Auswertung ist ein anderes Thema
  (siehe Karte 27, Timestream).

## Klassiker-Fallen

- **`dynamoDB` und `dynamoDBv2` sind zwei verschiedene Actions.** Die aeltere
  schreibt die Payload in eine einzelne Spalte, die neuere splittet sie
  spaltenweise auf. Ein AWS-Tutorial weist ausdruecklich darauf hin, in seinem
  Fall die alte Variante zu waehlen — die Namen sind also keine Versionsstufe,
  aus der man blind die hoehere nimmt.
- **Basic Ingest** nimmt den Publish/Subscribe-Broker aus dem Ingestion-Pfad und
  spart damit Messaging-Kosten; Topics beginnen dafuer mit
  `$aws/rules/<rule_name>`. Der Preis: kein Fan-out. Wer die Nachricht ausser an
  die Regel auch an andere Subscriber verteilen muss, braucht den Broker weiter.
- **Fehlgeschlagene Actions verschwinden still.** Ohne konfiguriertes
  `errorAction` landet der Fehler nur in CloudWatch Logs, wenn Logging aktiv
  ist. Die Nachricht selbst wird nach den Wiederholungsversuchen verworfen.

## Faktencheck-Notizen

- Rules Engine, Aktionsliste und Basic Ingest: AWS IoT Core Developer Guide,
  „Rules for AWS IoT"
  (https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules.html).
- Basic Ingest im Detail, Topic-Praefix und fehlendes Fan-out: AWS IoT Core
  Developer Guide, „Reducing messaging costs with Basic Ingest"
  (https://docs.aws.amazon.com/iot/latest/developerguide/iot-basic-ingest.html).
- Unterschied `dynamoDB` / `dynamoDBv2`: AWS IoT API Reference, `Action`
  (https://docs.aws.amazon.com/iot/latest/apireference/API_Action.html) und
  Developer Guide, „DynamoDBv2"
  (https://docs.aws.amazon.com/iot/latest/developerguide/dynamodb-v2-rule-action.html).
  Der ausdrueckliche Hinweis, im Tutorial die alte Action zu waehlen, steht in
  „Tutorial: Storing device data in a DynamoDB table"
  (https://docs.aws.amazon.com/iot/latest/developerguide/iot-ddb-rule.html).
- Wiederholungsversuche und Error Action: AWS IoT Core Developer Guide,
  „AWS IoT rule actions"
  (https://docs.aws.amazon.com/iot/latest/developerguide/iot-rule-actions.html).

## Nicht bestaetigt / bewusst weggelassen

- **Keine Zahl zu Verbindungs- oder Nachrichtenquoten.** Die „100.000 Sensoren"
  im Szenario stammen aus der Masterplan-Zeile und beschreiben die Groessen-
  ordnung, nicht ein dokumentiertes Limit. Ein hartes Kontingent haette eine
  Primaerquelle gebraucht; die wurde fuer diese Karte nicht geprueft, also steht
  keine solche Zahl darauf.
- **Device Shadow** ist nicht auf der Karte. Es gehoert zum Zustandsabgleich,
  nicht zum Ingestion-Pfad, und haette die Kernaussage verwaessert.
- **Preise** stehen nirgends. Basic Ingest wird qualitativ als guenstiger
  beschrieben, ohne Betrag.

## Bewusste Vereinfachungen im Diagramm

- **Der `errorAction`-Zweig fehlt.** In der freigegebenen Skizze war er als
  vierter Schritt vorgesehen. Beim Geometrieplan haette er als dritter
  ausgehender Pfeil an der Rules Engine gehangen, neben Hauptfluss und
  verworfenem Bypass — das haette die Box optisch ueberladen. Der Ablauf auf der
  Karte hat deshalb **drei** nummerierte Schritte statt vier; die Fehlerbehandlung
  steht nur hier unter „Klassiker-Fallen". Dokumentierte Schuld, kein Versehen.
- **Basic Ingest ist nicht gezeichnet**, obwohl es der zweite Ingestion-Pfad
  waere. Es steht im dritten Merksatz und in den Fallen.
- Zwischen Sensor und Broker fehlt die Darstellung der TLS-Terminierung und der
  Policy-Auswertung als eigener Schritt; beides steckt in der Broker-Box.

## Farbkonventionen dieser Karte

- Sensorflotte = **Quelle** (blau).
- IoT Core Broker **und** Rules Engine = **Transport** (teal). Zwei benachbarte
  Boxen in derselben Farbe ist Absicht: beide bewegen Nachrichten, und die
  Rollenpalette bildet Rollen ab, nicht Abwechslung. Die Versuchung, die Rules
  Engine als Governance/Gold zu setzen, wurde verworfen — sie steht im Datenpfad,
  nicht daneben.
- DynamoDB = **Storage** (gruen).
- Die verworfene Lambda-Box behaelt **Compute/Orange** am Rand und ist
  gestrichelt; abgelehnt wird sie durch X-Kreis und roten Pfad, nicht durch rote
  Fuellung. Stil-Guide-konform.
