---
nr: 95
title: "AppSync (GraphQL), DynamoDB"
services: ["AWS AppSync", "Amazon DynamoDB", "Amazon Cognito", "AWS Amplify"]
domains: ["D3", "D1"]
signalwords:
  - "single endpoint for multiple views"
  - "over-fetching and under-fetching"
  - "real-time updates pushed to clients"
  - "GraphQL API"
  - "mobile application with many screens"
assets: ["battle_card_95.svg", "battle_card_95.png", "battle_card_95.pdf"]
status_note: |
  qc.py: 0 Befunde. 6 Boxen = 4 Ablaufboxen + 1 verworfene Box + 1 Footer-Rect.
  15 Segmente = 2 Hauptpfeile + 3 Segmente im Rueckweg ueber der Reihe
  (hoch, quer, runter) + 2 Bypass-Segmente + 2 X-Diagonalen + 6 Phantome aus
  DREI Marker-IDs (mfluss, msub, mverw) — diese Karte hat eine Marker-ID mehr
  als die uebrigen vier, deshalb 6 statt 4 Phantome.
  3 Badges, 1 X-Kreis.
  Korrekturrunden:
    (1) VOR dem Zeichnen, precheck.py: grosses "Ä" in "Sehen die Änderung
        sofort". Grossumlaute ragen ueber die text_bbox-Heuristik
        (0,80 x Schriftgroesse) hinaus und haetten in zones.py Tintenpixel
        ausserhalb der Geometrie erzeugt — dieselbe Klasse wie Karte 87 in
        Batch 18. Umformuliert zu "Sind sofort auf dem Stand". Das Pruefwerkzeug
        wurde nicht angefasst.
  Rueckweg vorab gerechnet: Badge 3 sitzt bei y=305, also 35 px ueber der
  Boxoberkante (340); die Querstrecke bei y=220 liegt deutlich unter der
  Untertitel-Unterkante (~129).
  Render-Sanity: 2400x1350, Titelband-Kanaldivergenz 0.
  R13 reine Schwarzpixel: 0.
  zones.py (R7): 0 Befunde.
  R16 engster Label-zu-Boxkante-Abstand: 83.8 px (Grenze 9 px).
  R12-Gegencheck: 0 Verstoesse.
  Footer von Hand gemessen: 1157.3 px (Grenze 1420 px).
  Sichtpruefung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter lieferte
  einen leeren Platzhalter (R8/F9).
  INHALTLICHE ABWEICHUNG von der Masterplan-Zeile: siehe Faktencheck-Notizen.
  Die Karte deckt zwei der drei genannten Eigenschaften ab; "Offline-Sync" ist
  kein AppSync-Merkmal und steht deshalb nur in den Abgrenzungen.
---

# Battle Card 95 — AppSync (GraphQL), DynamoDB

## Szenario

Eine Mobile App hat ein Dutzend Ansichten, die sich aus denselben Daten
speisen — jede braucht andere Felder. Zusaetzlich sollen alle Clients eine
Aenderung sofort sehen, ohne zu pollen.

## Ablauf

**1 — Der Client fragt genau das, was er anzeigt.** Statt eines festen
Antwortschemas beschreibt die Query die gewuenschten Felder. Die Listenansicht
holt zwei Felder, die Detailansicht zwoelf — und das ohne einen zweiten
Endpoint. Das ist die eigentliche Antwort auf Over- und Under-Fetching.

**2 — AppSync loest auf.** Ein Endpoint, davor die Autorisierung: Cognito User
Pools, IAM, API Key oder ein Lambda-Authorizer. Dahinter Resolver, die die
Felder auf Datenquellen abbilden. Mehrere Datenquellen in einer Query sind
moeglich — ein Roundtrip statt N.

**3 — Subscriptions verteilen die Aenderung.** Eine Mutation loest die
Subscription aus, AppSync schiebt das Ergebnis ueber WebSocket an alle
angemeldeten Clients. Der Rueckweg auf der Karte laeuft bewusst **von AppSync**
zu den weiteren Clients und nicht von DynamoDB: die Datenbank schiebt hier
nichts, der Push kommt vom Dienst.

**4 — Konflikte werden serverseitig aufgeloest.** AppSync fuehrt eine Version je
Item und erkennt damit, wenn zwei Clients dieselbe Zeile veraendert haben. Fuer
die Aufloesung stehen mehrere Strategien bereit, unter anderem automatisches
Zusammenfuehren, optimistische Nebenlaeufigkeit und eine eigene Lambda-Funktion.
Das ist Server-, nicht Clientlogik.

## Pruefungs-Kernsatz

Viele Ansichten auf denselben Daten, ein Endpoint, Live-Updates ohne Polling —
das ist AppSync. API Gateway bleibt richtig, wenn REST-Semantik, Usage Plans
oder Nicht-GraphQL-Backends gefordert sind.

## Abgrenzungen

- **API Gateway + Lambda:** die Vergleichsantwort. Ein Endpoint je Ansicht oder
  ein ueberladener Endpoint, dazu WebSocket-Verwaltung von Hand.
- **Offline-Faehigkeit gehoert nicht AppSync.** Der lokale Speicher, der
  Schreibvorgaenge im Funkloch puffert, ist **Amplify DataStore** — eine
  Client-Bibliothek. AppSync liefert nur die Serverseite, auf der DataStore
  aufsetzt. Wer in einer Pruefungsfrage „offline" liest, muss diese Trennung
  kennen; die Masterplan-Zeile hatte sie falsch. Erschwerend: Amplify Gen 1, das
  DataStore enthaelt, ist im Maintenance Mode mit End of Life am 1. Mai 2027,
  und Gen 2 unterstuetzt GraphQL-APIs **ohne** DataStore.
- **AppSync Events** ist ein eigenstaendiger Pub/Sub-Dienst fuer serverlose
  WebSocket-APIs, seit Oktober 2024 verfuegbar, ohne GraphQL-Bindung. Er ersetzt
  die GraphQL-Subscriptions nicht, sondern steht daneben. Fuer SAA-C03 mit hoher
  Wahrscheinlichkeit noch nicht relevant.
- **DynamoDB Streams:** Aenderungen abgreifen und weiterverarbeiten. Ein anderes
  Muster als „Client abonniert".

## Klassiker-Fallen

- **„Offline" fuehrt reflexhaft zu AppSync.** Das ist die Falle dieser Karte.
  Richtig ist: AppSync stellt Versionierung und Konfliktaufloesung bereit, der
  lokale Store kommt aus der Client-Bibliothek.
- **GraphQL loest nicht das Datenmodell.** Eine schlecht geschnittene
  DynamoDB-Tabelle bleibt schlecht geschnitten; AppSync verbirgt das nur.
- **Subscriptions brauchen eine Mutation ueber AppSync.** Wer an AppSync vorbei
  direkt in die Tabelle schreibt, loest keine Subscription aus. Ein haeufiger
  Denkfehler bei gemischten Architekturen.

## Faktencheck-Notizen

- Zuordnung des Offline-Teils zu Amplify DataStore, ausdruecklich als
  abfragbarer On-Device-Store fuer Web, Mobile und IoT beschrieben:
  AWS AppSync Documentation Overview
  (https://aws.amazon.com/documentation-overview/appsync/).
- Serverseitige Konfliktbehandlung mit Datenversionierung und mehreren
  Aufloesungsstrategien: AWS AppSync Produktseite
  (https://www.amazonaws.cn/en/appsync/). Dieselbe Seite vermischt in ihrem
  Marketingtext Offline-Zugriff und AppSync — der Grund, warum die
  Masterplan-Zeile plausibel wirkte, aber trotzdem falsch war.
- Amplify Gen 2 ohne DataStore: AWS Amplify Gen 2 Documentation, FAQ
  (https://docs.amplify.aws/react/how-amplify-works/faq/).
- Amplify Gen 1 im Maintenance Mode mit End of Life am 1. Mai 2027:
  Hinweisbanner in der Gen-1-Dokumentation
  (https://docs.amplify.aws/gen1/javascript/prev/build-a-backend/graphqlapi/offline/).
- AppSync Events, Start am 30. Oktober 2024, serverlose WebSocket-APIs ohne
  GraphQL-Bindung: AWS-Announcement
  (https://aws.amazon.com/about-aws/whats-new/2024/10/aws-appsync-websocket-apis-web-mobile-experiences);
  Publizieren ueber die WebSocket-Verbindung kam im Maerz 2025 dazu
  (https://aws.amazon.com/about-aws/whats-new/2025/03/appsync-events-publishing-websocket-real-time-pub-sub).

### Korrektur an der Masterplan-Zeile

Zeile 95 lautete: „Mobile App: ein flexibles API fuer viele Ansichten +
Offline-Sync + Subscriptions". Der mittlere Teil ist **falsch zugeordnet**.
Die Karte deckt die beiden anderen Teile ab und setzt an die Stelle des
Offline-Teils die serverseitige Konfliktaufloesung — das ist der Anteil, den
AppSync tatsaechlich beitraegt. Entscheidung von Oktay nach Vorlage der
Alternativen.

## Nicht bestaetigt / bewusst weggelassen

- **Amplify DataStore ist nicht gezeichnet.** Eine Karte, die ihn zeigt, muesste
  gleichzeitig erklaeren, dass der Baustein auf einer Generation steht, die
  ausserhalb der Pruefungsrealitaet ausläuft. Er steht nur in den Abgrenzungen
  und im dritten Merksatz.
- **Keine Zahlen zu Verbindungs- oder Subscription-Grenzen.** Fuer AppSync Events
  ist eine Client-Rate dokumentiert; fuer GraphQL-Subscriptions wurde keine
  belastbare Zahl geprueft, also steht keine auf der Karte.
- **Caching** (serverseitiger AppSync-Cache) wird nicht gezeigt.
- **Merged APIs** und **Private APIs** kommen nicht vor.

## Bewusste Vereinfachungen im Diagramm

- **„Weitere Clients" steht fuer beliebig viele.** Der Fan-out auf Tausende
  Verbindungen ist als eine Box gezeichnet.
- **Der Resolver ist keine eigene Box.** Er steckt in der AppSync-Box als Zeile.
  In der Praxis ist er das Stueck, an dem die meiste Arbeit haengt.
- **Nur eine Datenquelle.** Der Vorteil „mehrere Datenquellen in einer Query"
  steht im Ablauftext, ist aber nicht gezeichnet — das haette eine zweite
  Storage-Box gebraucht und den Rueckweg optisch erdrueckt.
- **Die Autorisierung ist eine Zeile, kein Schritt.** Fuer eine D1-lastige Karte
  waere das zu wenig; diese Karte ist D3-lastig.

## Farbkonventionen dieser Karte

- Mobile Client **und** "Weitere Clients" = **Quelle** (blau). Beide sind
  Endpunkte derselben Rolle, auch wenn der eine schickt und der andere empfaengt.
- AppSync = **Transport** (teal).
- DynamoDB = **Storage** (gruen).
- Pfeile der Hauptkette und des Rueckwegs = blau, passend zur Quelle, weil die
  Karte den Weg der Client-Anfrage erzaehlt.
- Die verworfene Box behaelt **Transport/Teal**, weil API Gateway ein
  Transportbaustein ist; abgelehnt durch X-Kreis und roten Pfad.
