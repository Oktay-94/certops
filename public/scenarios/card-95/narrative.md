---
cardNumber: 95
slug: appsync-graphql-viele-ansichten
title: "AppSync (GraphQL), DynamoDB"
services: ["AWS AppSync", "Amazon DynamoDB", "Amazon Cognito", "AWS Amplify"]
domains: ["D3", "D1"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/appsync/latest/devguide/aws-appsync-real-time-data.html"
  - "https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-resolution.html"
  - "https://docs.aws.amazon.com/appsync/latest/devguide/conflict-detection-and-sync.html"
  - "https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html"
  - "https://docs.aws.amazon.com/appsync/latest/APIReference/API_SyncConfig.html"
  - "https://docs.amplify.aws/react/how-amplify-works/faq/"
  - "https://docs.amplify.aws/gen1/react/build-a-backend/more-features/datastore/how-it-works/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/10/aws-appsync-websocket-apis-web-mobile-experiences"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, an einem Schalter etwas zu bestellen.

**Schalter eins** hat zwölf feste Knöpfe. Jeder Knopf wirft ein fertig geschnürtes Paket aus. Du wolltest nur den Namen und den Preis? Du bekommst trotzdem das ganze Paket, inklusive Beschreibung, Bildern und Bewertungshistorie — und wirfst neun Zehntel weg. Du brauchst zusätzlich noch die Lieferadresse, die in keinem Paket steckt? Dann drückst du einen zweiten Knopf und wartest ein zweites Mal.

**Schalter zwei** hat keinen einzigen Knopf. Er hat einen Zettel. Du schreibst darauf, was auf dem Teller landen soll, gibst ihn ab und bekommst genau das zurück. Nicht mehr, nicht weniger, in einem Gang.

Das ist der ganze Unterschied zwischen einem festen Antwortschema und GraphQL. Der erste Schalter verschickt zu viel und gleichzeitig zu wenig — over-fetching und under-fetching in einem. Der zweite lässt den Fragenden entscheiden.

Und dann kommt der zweite Teil der Aufgabe dazu: Der Zettel-Schalter merkt sich, wer gerade wartet. Ändert sich etwas an einer Ware, ruft er von sich aus zurück. Beim Knopf-Schalter müsstest du alle dreißig Sekunden hingehen und fragen, ob es Neuigkeiten gibt — und zwar mit jedem Gerät einzeln.

Der dritte Teil kommt erst zum Vorschein, wenn zwei Leute gleichzeitig am Schalter stehen und denselben Eintrag ändern wollen. Dann muss jemand entscheiden, welche der beiden Änderungen gilt. Diese Entscheidung trifft in unserem Bild der Schalter, nicht der Kunde — und genau das ist der Punkt, an dem die Aufgabenstellung dieser Karte gern falsch gelesen wird.

## Was es eigentlich ist — das Schema

Der zentrale Gegenstand dieser Karte ist kein Server und kein Container. Es ist ein Textdokument, das AppSync kennt und das der Client kennt:

```graphql
type Buchung {
  id: ID!
  kundeName: String!
  preis: Float!
  status: String!
  hinweis: String
}

type Mutation {
  updateBuchung(id: ID!, status: String!): Buchung
}

type Subscription {
  onBuchungGeaendert: Buchung
    @aws_subscribe(mutations: ["updateBuchung"])
}
```

Lies das von unten nach oben, dann ergibt es die Karte. Ganz unten steht die Direktive `@aws_subscribe`. Sie ist der einzige Grund, warum es auf dieser Karte einen Rückweg gibt. Sie sagt: Wann immer `updateBuchung` läuft, wird jeder Client benachrichtigt, der `onBuchungGeaendert` abonniert hat.

Darüber steht die Mutation — die einzige Art von Operation, die Daten verändert. Queries lesen nur.

Und ganz oben steht der Typ, aus dem sich jede Ansicht selbst bedient. Die Kachelliste auf dem Startbildschirm fragt so:

```graphql
query { buchungen { id kundeName } }
```

Die Detailseite nach dem Antippen fragt so:

```graphql
query { buchung(id: "BK-4711") {
  id kundeName preis status hinweis } }
```

Zwei Ansichten, zwei Feldlisten, **ein Endpoint**. Die Antwort auf die erste Anfrage enthält zwei Felder je Eintrag, die Antwort auf die zweite fünf — und zwar deshalb, weil der Client es so hingeschrieben hat, nicht weil jemand serverseitig eine zweite Route gebaut hätte. Kommt morgen ein Bildschirm dazu, der `status` und sonst nichts braucht, ändert sich am Backend nichts.

## Der Weg durch die Karte

### Mobile Client — eine Ansicht, ein Query

Die App hat ein Dutzend Bildschirme. Auf dem Startbildschirm stehen zwölf Buchungen als Kacheln: Name und Preis, sonst nichts. Tippt der Nutzer auf Buchung `BK-4711`, öffnet sich eine Detailseite mit zwölf Feldern.

Bei einem festen Antwortschema hättest du jetzt eine unangenehme Wahl: entweder eine Route je Bildschirm — und damit zwölf Routen, die alle gepflegt werden wollen — oder eine überladene Route, die immer alles liefert und die Kacheln mit Daten füttert, die niemand anzeigt. Über Mobilfunk ist das kein akademisches Problem, sondern Ladezeit.

Hier schreibt jeder Bildschirm seine eigene Feldliste. Der Client bestimmt die Form der Antwort, nicht der Server.

### Pfeil 1 — eine Anfrage, ein Endpoint

Das Query geht als HTTPS-Anfrage an genau eine URL. Es gibt keinen zweiten Endpoint, den die App kennen müsste, und keine Versionsnummer im Pfad, die irgendwann auf `/v3/` steht.

### AppSync — Autorisierung und Resolver

Auf der Karte steht AppSync in der Mitte, mit drei Zeilen im Kasten. Die mittlere ist die wichtigste für Domäne D1: Autorisierung passiert **vor** dem Resolver.

Fünf Typen stehen zur Wahl: `API_KEY`, `AWS_LAMBDA`, `AWS_IAM`, `OPENID_CONNECT` und `AMAZON_COGNITO_USER_POOLS`. Sie lassen sich mischen — ein API mit Cognito User Pools als Standard und IAM als zusätzlichem Modus ist der Normalfall, wenn Nutzer und Backend-Dienste dasselbe API benutzen: Die App hängt ihr JWT an die Anfrage, der nächtliche Abgleichjob signiert mit Signature Version 4. Beide reden mit demselben Endpoint, und einzelne Schemafelder lassen sich je Modus freigeben oder sperren.

Was nicht geht: derselbe Typ zweimal, und mehr als ein Lambda-Authorizer je API. Der API-Key ist dabei kein Authentifizierungsmerkmal, sondern eine Drossel für öffentliche Daten — wer ihn für „geschützt" hält, hat die erste D1-Frage schon verloren.

Dahinter sitzt der Resolver. Er ist das Stück, das ein Feld auf eine Datenquelle abbildet. Ein UNIT-Resolver spricht mit genau einer Quelle. Ein PIPELINE-Resolver hängt mehrere Functions hintereinander und kann damit in **einer** Query mehrere Datenquellen bedienen — die Tabelle für die Buchung, eine zweite für das Nutzerprofil. Der Client merkt davon nichts. Er bekommt ein Ergebnis, nicht drei.

### Pfeil 2 — vom Resolver in die Tabelle

Der Resolver übersetzt das Feld in eine DynamoDB-Operation. Die Karte zeigt eine Datenquelle, weil zwei den Rückweg optisch erschlagen hätten. Die Fähigkeit gilt trotzdem.

### DynamoDB — Versionierung je Item

Hier passiert der Teil, den man auf der Karte am leichtesten überliest. Ist die Datenquelle als **versioned data source** konfiguriert, schreibt AppSync jedem Item Versions-Metadaten mit, führt eine Delta-Tabelle über die Änderungen und legt für gelöschte Einträge sogenannte *tombstones* an. Die Aufbewahrungsdauer beider ist konfigurierbar.

Die Version zählt **AppSync** hoch, nicht der Client. Die Doku ist an dieser Stelle ungewöhnlich deutlich: Wer die Version außerhalb eines Resolvers verändert, ändert das Konsistenzverhalten des Systems und riskiert Datenverlust.

Darauf setzt die Konfliktbehandlung auf. `conflictDetection: VERSION` schaltet die Erkennung ein, der `conflictHandler` bestimmt, was dann passiert. Beides steht in der `SyncConfig` des Resolvers — es ist eine Resolver-Einstellung, keine Tabelleneigenschaft.

Die Delta-Tabelle ist dabei mehr als Buchhaltung: Sie macht die Sync-Operation möglich, bei der ein Client nicht den ganzen Datenbestand neu zieht, sondern nur die Änderungen seit seinem letzten Stand. Die tombstones sorgen dafür, dass auch **Löschungen** ankommen — ein gelöschter Eintrag, der einfach verschwindet, ist für einen synchronisierenden Client nicht von „war nie da" zu unterscheiden.

### Pfeil 3 — der Rückweg über WebSocket

Zwei Mitarbeiter ändern `BK-4711` zur selben Sekunde. Die Mutation läuft, und jetzt zeigt der Pfeil auf der Karte nach oben und quer: **von AppSync** zu den weiteren Clients.

Das ist keine zeichnerische Freiheit, sondern der Kern. Subscriptions werden von Mutations ausgelöst, und AppSync schiebt das Ergebnis über WebSocket an die angemeldeten Clients. Die Datenbank schiebt nichts. Sie weiß nicht einmal, dass jemand zuhört.

Daraus folgt unmittelbar: Wer an AppSync vorbei direkt in die Tabelle schreibt — aus einer Lambda, per SDK, über einen Batch-Job — löst **keine** Subscription aus. Der Client sitzt mit veralteten Daten da und niemand sieht einen Fehler.

### Weitere Clients — der Fan-out

Die eine Box steht für beliebig viele Verbindungen. AppSync verwaltet sie, skaliert sie und verteilt — das ist der Teil, den du bei einer selbstgebauten Lösung schreiben, betreiben und überwachen müsstest: eine Tabelle mit offenen Verbindungs-IDs, ein Aufräumjob für tote Verbindungen, eine Wiederverbindungslogik im Client.

Autorisiert wird auch hier, und zwar beim Verbindungsaufbau: IAM, Lambda, Cognito Identity Pools oder Cognito User Pools. Wer feiner steuern will, hängt einen Resolver an das Subscription-Feld und entscheidet anhand der Identität des Aufrufers, wer welchen Datensatz überhaupt abonnieren darf. Ohne diesen Schritt abonniert jeder angemeldete Nutzer jede Änderung — auch die an fremden Buchungen.

Was dabei fließt, hat eine Grenze: Über die reinen WebSockets, die Clients ab November 2019 standardmäßig benutzen, liegt die Payload-Größe bei 240 KB.

### REST je Ansicht — die verworfene Box

Der rote Pfad führt zur Vergleichsantwort: ein Endpoint je Ansicht, dazu WebSocket-Verwaltung von Hand. Sie ist nicht falsch, sie ist teurer in Pflege. Sie bleibt richtig, wenn REST-Semantik, Usage Plans oder ein Backend gefordert sind, das kein GraphQL spricht.

## Die entscheidende Unterscheidung

Die Achse dieser Karte ist nicht GraphQL gegen REST. Es ist die Frage, **wer den Offline-Speicher hält** — denn genau hier verrutscht die Prüfungsantwort:

| | Serverseite | Clientseite |
|---|---|---|
| Baustein | AWS AppSync | Amplify DataStore |
| Wo läuft es | im Dienst | auf dem Gerät |
| Leistet | Versionierung, Konflikterkennung, Konfliktauflösung, Subscriptions | lokale Datenbank, Schreibpuffer im Funkloch, Sync bei Rückkehr |
| Ist ein | verwalteter Dienst | Client-Bibliothek |
| Status | aktiv | Teil von Amplify Gen 1, End of Life am 1. Mai 2027 |

## Die ehrliche Feinheit

Drei Dinge, die Tutorials überspringen.

**Erstens: Das Selection Set der Subscription muss eine Teilmenge des Selection Sets der Mutation sein.** Deine Subscription fragt `{ kundeName preis }`. Die Mutation, die sie auslöst, holt aber nur `{ id status }`. Ergebnis: Der Abonnent bekommt für `kundeName` und `preis` einen Nullwert — oder einen Fehler, wenn die Felder im Schema als nicht-null deklariert sind. Der Fehler steckt in der Mutation, gesucht wird er in der Subscription.

**Zweitens: Konfliktauflösung ist eine Server-Entscheidung mit drei sehr unterschiedlichen Folgen.** `OPTIMISTIC_CONCURRENCY` weist die Mutation ab und gibt dem Client das aktuelle Item mit; der Client muss selbst neu versuchen. `AUTOMERGE` führt zusammen, nach festen Regeln: Listen werden angehängt, Sets vereinigt, vorhandene Skalarwerte bleiben stehen — nicht-konfliktbehaftete Felder verschmelzen also, aber zwei konkurrierende Preisangaben werden nicht sinnvoll „verhandelt". `LAMBDA` gibt dir die Entscheidung in eigenen Code. Wer „Konfliktauflösung ist eingeschaltet" liest und daraus „die Daten sind korrekt" ableitet, hat die Automerge-Regeln nicht gelesen.

**Drittens: Der Rückweg skaliert linear und wird selten mitgerechnet.** Eine Mutation an einem viel beachteten Datensatz erzeugt so viele ausgehende Nachrichten, wie Clients abonniert haben. Bei 5.000 gleichzeitig geöffneten Apps sind das 5.000 Zustellungen für einen Statuswechsel. AppSync verwaltet die Verbindungen und den Fan-out, es verschenkt sie nicht. Die Gegenmaßnahme steht im Schema, nicht in der Infrastruktur: möglichst kleine Selection Sets in den Subscriptions, damit jede der 5.000 Nachrichten klein bleibt. Die harte Grenze liegt bei 240 KB Payload; weit vorher wird es eine Kostenfrage.

**Viertens, und das ist die unangenehme Wahrheit hinter der Aufgabenstellung:** Der Offline-Baustein wird abgebaut. Amplify Gen 1 ist im Maintenance Mode, erhält seit dem 1. Mai 2026 nur noch kritische Fehler- und Sicherheitskorrekturen und erreicht am 1. Mai 2027 sein End of Life. Amplify Gen 2 bietet Auth, Data, Storage und Functions — und beantwortet die Frage nach DataStore in der eigenen FAQ damit, dass Gen 2 GraphQL-APIs **ohne** DataStore unterstützt. In der Gen-1-Dokumentation steht inzwischen ein Leitfaden, wie man von DataStore weg migriert. Für die Prüfung heißt das: Die Trennung Server/Client musst du kennen. Auf DataStore als Antwortbaustein solltest du nicht bauen.

## Syntax lesen — `@aws_subscribe`

```
onBuchungGeaendert: Buchung @aws_subscribe(mutations: ["updateBuchung"])
│                   │        │                          │
│                   │        │                          └─ Auslöser: diese Mutation
│                   │        └─ AppSync-eigene Direktive, kein GraphQL-Standard
│                   └─ Rückgabetyp, bewusst OHNE "!"
└─ Name des Abonnements, so ruft der Client es auf
```

Zwei Fallen stecken in dieser Zeile.

Das fehlende Ausrufezeichen ist Pflicht: Der Rückgabetyp einer Subscription muss optional sein. Steht dort `Buchung!`, schlägt die Subscription fehl — obwohl die Mutation, die sie auslöst, sehr wohl `Buchung!` zurückgeben darf.

Und in der Klammer steht eine **Liste**. Eine Subscription kann auf mehrere Mutations hören. Was sie nicht kann: auf eine Änderung hören, die keine Mutation war.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung nicht existiert:

- kein WebSocket-Server und keine Verbindungstabelle
- kein Endpoint je Ansicht und keine API-Version im Pfad
- kein Polling-Timer im Client
- keine selbst gepflegte Versionsspalte und kein handgeschriebener Merge
- keine zweite Anfrage, nur weil ein Feld fehlte

Und ausdrücklich **auch nicht**: ein lokaler Speicher, der Schreibvorgänge im Funkloch puffert. Der steckt in der Client-Bibliothek, nicht im Dienst.

## Wenn du dir eine Sache merkst

**AppSync ist der eine Endpoint, an dem jeder Client genau die Felder holt, die er anzeigt — und der ihn danach von selbst benachrichtigt. Den Offline-Speicher hält der Client.**

API Gateway kann viele Ansichten bedienen, aber nur mit vielen Routen oder einer überladenen. DynamoDB Streams meldet Änderungen an ein Backend, nicht an ein Endgerät. AppSync Events ist seit dem 30. Oktober 2024 ein eigenständiger Pub/Sub-Dienst für serverlose WebSocket-APIs ohne GraphQL-Bindung — er steht neben den GraphQL-Subscriptions, nicht an ihrer Stelle, und ist für SAA-C03 mit hoher Wahrscheinlichkeit noch nicht relevant.

## Prüfungsknackpunkte

**Signalwörter:** „viele Ansichten auf denselben Daten", „over-fetching und under-fetching", „ein einziger Endpoint", „Echtzeit-Updates ohne Polling", „mobile App mit vielen Bildschirmen". Flexible Feldauswahl plus Push ist immer AppSync.

**Die Offline-Falle.** Steht „offline" in der Frage, greift der Reflex zu AppSync. Prüf zwei Dinge: Geht es um das **Puffern von Schreibvorgängen ohne Netz**, ist die Antwort eine Client-Bibliothek. Geht es um **gleichzeitige Änderungen von zwei Geräten**, ist es AppSync mit Versionierung und Konfliktauflösung. Nur der zweite Fall ist Serverarbeit.

**Die Subscription-Falle.** Eine Architektur, in der ein Batch-Job direkt in die Tabelle schreibt und Clients trotzdem Live-Updates erwarten sollen, funktioniert nicht. Ohne Mutation über AppSync keine Subscription.

**GraphQL löst nicht das Datenmodell.** Eine schlecht geschnittene DynamoDB-Tabelle bleibt schlecht geschnitten. AppSync verbirgt den Schnitt vor dem Client, es repariert ihn nicht.

**A — API Gateway mit einer Route je Ansicht:** funktioniert, erzeugt aber genau die Endpoint-Vermehrung, die die Aufgabe abschaffen will.

**B — API Gateway mit einer Sammel-Route:** löst die Vermehrung, nicht das over-fetching. Die Kachelansicht lädt weiterhin alles.

**D — DynamoDB Streams plus Lambda:** greift Änderungen ab und verarbeitet sie weiter. Ein Backend-Muster, kein Client-Abonnement.

**E — API Gateway WebSocket API:** liefert den Push, aber nichts von der Feldauswahl — und die Verbindungsverwaltung baust du selbst.
