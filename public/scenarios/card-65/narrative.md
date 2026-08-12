---
cardNumber: 65
slug: personalize-domain-recommender-event-tracker
title: "Webshop-Empfehlungen — Personalize, S3, Event Tracker"
services: ["Amazon Personalize", "Amazon S3", "Amazon SageMaker AI"]
domains: ["D3"]
correctAnswer: "C"
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/personalize/latest/dg/ECOMMERCE-use-cases.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/domain-use-cases.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/interactions-datasets.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/recording-events.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/recording-item-interaction-events.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/event-get-tracker.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/API_CreateEventTracker.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/API_CreateCampaign.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/maintaining-relevance.html"
  - "https://docs.aws.amazon.com/personalize/latest/dg/frequently-asked-questions.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/personalize/create-recommender.html"
  - "https://docs.aws.amazon.com/general/latest/gr/maintenance_services.html"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, einem Kunden zu sagen, was noch zu seinem Einkauf passt.

**Weg eins:** Du stellst einen Warenkundler ein. Er liest drei Jahre Kassenbons, findet Muster, schreibt Regeln auf — „wer die gusseiserne Pfanne kauft, kauft den Pfannenwender" — und pflegt daraus eine Liste. Die Liste ist gut. Sie ist auch vier Wochen alt. Der Kunde, der gerade eben Pfanne `pfanne-32cm` angesehen hat, kommt darin nicht vor, weil er sie vor zwanzig Sekunden angesehen hat und die Liste vom letzten Monat ist.

**Weg zwei:** Du gibst dieselben Bons ab und bekommst zwei Dinge zurück, die zusammengehören. Erstens ein System, das die Muster selbst findet und sie **alle sieben Tage von Grund auf neu bildet**, ohne dass jemand einen Knopf drückt. Zweitens ein Ohr an der Ladentür: Was dieser eine Kunde in dieser einen Sitzung anschaut, wirkt **innerhalb von Sekunden** auf seine nächste Empfehlung — und zwar ohne dass dafür irgendetwas neu trainiert wird.

Amazon Personalize ist Weg zwei. Und der zweite Teil ist der, den man beim ersten Lesen überliest.

Das erklärt beide Sätze aus der Aufgabe. „No machine learning team" heißt: niemand baut ein Modell. „Recommendations should reflect what the user just clicked" heißt: es gibt einen zweiten, schnellen Kanal neben dem Training. Zwei Zeitachsen, ein Dienst.

Halte diese Zweiteilung fest, sie trägt die ganze Karte. Alles, was auf der oberen Linie des Diagramms passiert — S3, Import, Dataset Group, Recommender —, arbeitet auf **Wochenrhythmus**. Alles, was unten herum zurückläuft — Klick, Event Tracker, frische Signale —, arbeitet auf **Sekundenrhythmus**. Die beiden Linien treffen sich im Recommender, und genau deshalb ist er der einzige Kasten, in den zwei Pfeile hineinzeigen.

## Was es eigentlich ist — der Recommender

Kein Modell, das du besitzt. Kein Notebook. Kein Container. Eine **Ressource mit drei Feldern**, die du anlegst und danach benutzt:

```json
{
  "name": "kunden-kauften-auch",
  "datasetGroupArn": "arn:aws:personalize:eu-central-1:1234:dataset-group/shop",
  "recipeArn": "arn:aws:personalize:::recipe/aws-ecomm-frequently-bought-together",
  "recommenderConfig": { "minRecommendationRequestsPerSecond": 1 }
}
```

Lies das von oben nach unten, es ist die halbe Lösung der Aufgabe. Wie heißt das Ding (`name`), auf welchen Daten arbeitet es (`datasetGroupArn`), welchen Anwendungsfall soll es erfüllen (`recipeArn`), wie viel Durchsatz hältst du vor (`minRecommendationRequestsPerSecond`).

Schau dir die Recipe-ARN genau an: `arn:aws:personalize:::recipe/…` — zwischen den Doppelpunkten fehlen Region und Konto. Das ist kein Tippfehler. Das Rezept gehört **AWS**, nicht dir. Du wählst aus einer Liste aus, du schreibst nichts.

`aws-ecomm-frequently-bought-together` ist genau das Rezept für „Kunden kauften auch". Es verlangt mindestens 1.000 `Purchase`-Events, und in der Anfrage ist die `itemId` Pflicht — logisch, denn die Frage lautet „was passt zu *diesem* Artikel".

## Der Weg durch die Karte

### Kasten — S3 Rohdaten: drei Typen, einer davon Pflicht

Personalize kennt drei Datensatztypen: **Item interactions** (wer hat was angesehen, gekauft), **Items** (Produktstammdaten) und **Users**. Nur der erste ist Pflicht. Ohne Interaktionen gibt es keine Empfehlung, weil es nichts zu lernen gibt.

Und hier steht die Zahl, die über Erfolg oder Scheitern des ganzen Projekts entscheidet: Für **jeden** Use Case brauchst du mindestens **1.000 Item-Interaktionen** und mindestens **25 verschiedene User-IDs mit je zwei Interaktionen**. Für brauchbare Empfehlungen empfiehlt AWS **50.000 Interaktionen von mindestens 1.000 Nutzern**.

Die Konsequenz ist unangenehm und wird in Kursen selten gesagt: Ein Shop mit 300 Bestellungen im Jahr bekommt hier kein Modell. Nicht weil der Dienst zu schwach wäre, sondern weil die Daten zu dünn sind.

Wozu dann die beiden optionalen Datensätze? Items und Users tragen **Metadaten** — Kategorie, Marke, Preisklasse, Region. Sie verbessern das Ergebnis, und sie sind die Grundlage für Filter („nur lieferbare Artikel", „nichts aus der Erwachsenenabteilung"). Ohne sie funktioniert die Empfehlung, aber du kannst sie nicht fachlich einschränken.

### Pfeil 1 — Import: ein Vorgang, kein Dienst

Der Dataset Import Job zieht die Dateien aus S3 in den Datensatz. Er ist deshalb als Pfeil gezeichnet und nicht als Kasten: Er läuft, er endet, danach gibt es ihn nicht mehr. Die 1.000 Interaktionen dürfen aus Bulk-Import kommen, aus gestreamten Events, oder aus beidem gemischt.

### Kasten — Dataset Group: die Weiche, die nur in eine Richtung steht

Beim Anlegen der Dataset Group gibst du eine Domäne an — `ECOMMERCE` oder `VIDEO_ON_DEMAND` — oder du lässt sie weg. Das ist die folgenreichste Entscheidung der ganzen Karte.

Mit Domäne bekommst du eine **Domain Dataset Group**: vorkonfigurierte Recommender, fertige Standard-Schemas, automatisches Retraining. Ohne Domäne bekommst du eine **Custom Dataset Group** und baust Solution, Solution Version und Campaign selbst.

Das Bild dazu: eine Weiche kurz hinter dem Bahnhof. Von der Domain-Seite kannst du später auf das Custom-Gleis wechseln und dort zusätzlich eigene Ressourcen bauen. Von der Custom-Seite gibt es keinen Weg zurück — vorkonfigurierte Recommender kannst du dort **nicht** nachrüsten. Wer sich falsch entscheidet, legt die Gruppe neu an und importiert alles noch einmal.

### Pfeil 2 — trainiert: was „automatisch" hier genau bedeutet

Personalize trainiert die Modelle hinter deinem Recommender **alle sieben Tage** komplett neu, auf dem gesamten Datenbestand. Änderst du die Spalten, die ins Training eingehen, startet ein Volltraining sofort.

Während das läuft, bleibt der Recommender **antwortfähig** — er bedient weiter mit der bisherigen Konfiguration, bis das neue Modell fertig ist. Für den Shop gibt es also kein Wartungsfenster.

### Kasten — Recommender: eine Zeile Konfiguration statt einer Pipeline

Das ist der eigentliche Grund für die Domain-Gruppe. Kein Rezept vergleichen, keine Solution Version anstoßen, kein Retraining planen. Du wählst den Use Case, Personalize baut den Rest.

Der Use Case bestimmt dabei mehr, als der Name vermuten lässt: Er legt fest, **welche Event-Typen du liefern musst** und **was in der Anfrage Pflicht ist**. Für „Frequently bought together" sind es mindestens 1.000 `Purchase`-Events und eine `itemId` in jeder Anfrage. Für „Best sellers" sind es ebenfalls `Purchase`-Events, aber dort ist die `userId` Pflicht und die `itemId` wird gar nicht ausgewertet. Wer die Events falsch typisiert, bekommt kein Modell — und die Fehlermeldung kommt erst beim Anlegen des Recommenders, nicht beim Import.

### Pfeil 3 — Empfehlungen: `GetRecommendations`

Das Frontend ruft `GetRecommendations` mit der Recommender-ARN und der `itemId` der Produktseite. Zurück kommt eine **Liste von Item-IDs mit Scores** — mehr nicht. Keine Bilder, keine Preise, keine Beschreibungen. Die holt dein Shop aus seinem eigenen Katalog. Personalize kennt deine Produkte nur als IDs.

Daneben gibt es `GetPersonalizedRanking`, und der Unterschied ist eine typische Prüfungsachse: `GetRecommendations` **erzeugt** eine Liste, `GetPersonalizedRanking` **sortiert eine Liste, die du mitschickst**. Ein Szenario, in dem eine Suchergebnisseite nutzerindividuell umsortiert werden soll, meint das zweite — und das gibt es nur über Custom-Ressourcen, nicht über einen Domain-Recommender.

### Pfeil 4 und Kasten — Event Tracker: genau einer je Dataset Group

Der Klick des Kunden geht nicht an den Recommender, sondern an den Event Tracker. Den legst du einmal an und bekommst eine `trackingId` zurück.

**Pro Dataset Group gibt es genau einen Event Tracker.** Ein zweiter `CreateEventTracker`-Aufruf auf dieselbe Gruppe wirft einen Fehler. Das ist eine harte Regel, kein Richtwert, und sie eignet sich hervorragend als Prüfungsfrage.

Der Tracker durchläuft dabei Zustände wie jede andere Ressource — `CREATE PENDING`, `CREATE IN_PROGRESS`, `ACTIVE` — und die `trackingId` funktioniert erst im Zustand `ACTIVE`. Wer sie sofort nach dem Anlegen ins Frontend kopiert, wirft in den ersten Minuten Klicks weg, ohne dass irgendwo ein Alarm angeht.

Ruft dein Backend `PutEvents` aus einer Lambda-Funktion auf, braucht deren Execution Role die Berechtigung `personalize:PutEvents` — und zwar mit `*` im `Resource`-Element, weil der Tracker in der Aktion selbst adressiert wird und nicht über die ARN.

### Pfeil 5 — frische Signale: der Kanal, der ohne Training auskommt

`PutEvents` hängt das Ereignis an den Item-interactions-Datensatz an. Unterstützt dein Use Case Real-time Personalization, nutzt Personalize das neue Ereignis **innerhalb von Sekunden nach dem Import** für die nächste Antwort.

Das ist die Pointe der Karte, gestrichelt gezeichnet, weil hier ein Signal fließt und kein Verarbeitungsschritt startet: **Der schnelle Kanal umgeht das Training vollständig.** Sekunden hier, sieben Tage dort.

### Der verworfene Kasten — SageMaker AI

Ein eigenes Empfehlungsmodell in SageMaker AI zu bauen ist fachlich möglich und für Sonderfälle richtig. Für „Kunden kauften auch" bedeutet es Feature Engineering, Trainingscode, Deployment und einen selbstgebauten Retraining-Zyklus. Das Signalwort „no machine learning team" schneidet diesen Weg ab, bevor er anfängt.

Der Kasten ist gestrichelt und trägt ein rotes X, aber er ist **orange** wie die anderen Compute-Knoten. Das ist Absicht: Die verworfene Alternative behält ihre Rolle. Abgelehnt wird sie über das X und den roten Pfad, nicht über eine graue Farbe — sonst würde die Karte suggerieren, SageMaker AI sei für Empfehlungen grundsätzlich ungeeignet. Ist es nicht. Es ist hier nur unverhältnismäßig.

## Die entscheidende Unterscheidung

| | Domain Dataset Group | Custom Dataset Group |
|---|---|---|
| Angabe beim Anlegen | `domain` gesetzt | `domain` weggelassen |
| Bereitstellung heißt | **Recommender** | **Campaign** |
| Rezept | fertiger Use Case von AWS | selbst gewählt |
| Training | automatisch alle 7 Tage | Solution Version selbst anstoßen |
| Schemas | Standard vorgegeben | selbst definiert |
| Re-Ranking, User Segments | nicht verfügbar | verfügbar |
| Wechsel möglich | Custom-Ressourcen nachrüstbar | Recommender **nicht** nachrüstbar |

## Die ehrliche Feinheit

Die Karte sagt „Die Campaign kostet, solange sie steht". Das stimmt — und es ist die halbe Wahrheit.

Die Campaign hat `minProvisionedTPS`, Standardwert 1, Mindestwert 1. Der Wert setzt den vorgehaltenen Durchsatz und damit die **Mindestabrechnung, solange die Campaign aktiv ist**. Steigt die Last darüber, skaliert Personalize hoch und wieder herunter, aber nie unter `minProvisionedTPS`. AWS warnt in der Doku ausdrücklich davor, den Wert großzügig zu setzen.

Der Recommender hat dieselbe Mechanik unter anderem Namen: `minRecommendationRequestsPerSecond`, ebenfalls Standardwert 1, ebenfalls mit derselben Warnung. **Der Domain-Weg ist also nicht der kostenlose Weg**, er ist der Weg ohne eigene Trainingsarbeit. Wer aus der Kartenzeile „Campaign nur custom" ableitet, ein Recommender koste im Leerlauf nichts, liegt falsch.

Zweite Feinheit: „wirkt in Sekunden" steht so auf der Karte, weil die AWS-Dokumentation genau so formuliert — *within seconds*. Eine belastbare Zahl gibt es nicht, und Real-time Personalization gilt nicht für jeden Use Case, sondern nur für die, bei denen die Doku sie ausweist.

Dritte Feinheit, die man erst im Betrieb merkt: Beim Filtern berücksichtigt Personalize **höchstens 100 Item-Interaktionen je Nutzer und Event-Typ**, und wenn für einen Nutzer drei Monate lang keine Interaktionen mehr importiert werden, fließt seine Historie nicht mehr in die Filter ein. Der automatische Filter „zeig nichts, was der Kunde schon gekauft hat" hat also ein Gedächtnis mit Rand. Bei einem Vielkäufer taucht ein alter Kauf irgendwann wieder in den Empfehlungen auf.

Vierte Feinheit, für die Kartenpflege: Amazon Personalize steht auf **keiner** der AWS-Lifecycle-Listen — weder Maintenance noch Sunset (Stand 11.08.2026). Das ist bei Machine-Learning-Diensten inzwischen keine Selbstverständlichkeit mehr.

## Syntax lesen — der `PutEvents`-Aufruf

```
PutEvents
├─ trackingId ── "a1b2c3d4-…"      vom Event Tracker, nicht vom Recommender
├─ userId ────── "kundin-4711"     wer; darf bei anonymen Sitzungen fehlen
├─ sessionId ─── "s-88f21"         die Klammer um alles in dieser Sitzung
└─ eventList
   └─ [0]
      ├─ eventType ── "View"       Pflicht; steuert, welcher Use Case es sieht
      ├─ itemId ───── "pfanne-32cm"
      └─ sentAt ───── 1786512000   Unix-Zeit in Sekunden
```

Zwei Felder verdienen einen zweiten Blick.

**`trackingId`** ist der häufigste Verwechslungspunkt. Sie kommt vom Event Tracker, nicht von der Dataset Group und nicht vom Recommender. Wer hier die falsche ARN einsetzt, bekommt keinen Fehler, den ein Frontend-Entwickler versteht — er bekommt schlicht keine Wirkung.

**`sessionId`** erzeugt deine Anwendung selbst, beim ersten Seitenaufruf, und hält sie über die ganze Sitzung konstant. Sie ist der Grund, warum ein **nicht angemeldeter** Besucher überhaupt personalisierte Empfehlungen bekommen kann: Personalize hängt die Ereignisse an die Sitzung, nicht an ein Konto, und verknüpft sie mit dem Nutzer, sobald er sich anmeldet.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Trainingsskript, kein Notebook, kein Container
- kein Feature Engineering und keine Hyperparameter
- kein Retraining-Zeitplan, den jemand pflegen müsste
- keine Solution und keine Solution Version — die gibt es nur auf dem Custom-Weg
- keine Campaign, obwohl in jedem älteren Kurs eine vorkommt
- kein Produktkatalog in Personalize; nur IDs

Übrig bleiben: drei Dateien in S3, eine Dataset Group mit Domänenangabe, ein Recommender, ein Event Tracker.

## Wenn du dir eine Sache merkst

**Domain-Gruppe gibt Recommender, Custom-Gruppe gibt Campaign — und `PutEvents` wirkt ohne Retraining.**

SageMaker AI kann das auch, verlangt dafür aber ein Team, das ein Modell baut. Ein nächtlicher Batch-Job liefert die Empfehlung von gestern und sieht den Klick von eben nie. Und wer den Recommender nach jedem Klick neu trainieren will, hat den Event Tracker nicht verstanden — genau dafür ist er da.

## Prüfungsknackpunkte

**Signalwörter:** „no machine learning team", „without building or training a model ourselves", „within weeks" — das ist Personalize statt SageMaker AI. „Should reflect what the user just clicked" — das ist der Event Tracker, nicht ein häufigeres Training.

**Die Retraining-Falle.** Der häufigste Denkfehler bei dieser Karte: Ein gerade angesehenes Produkt beeinflusse die Empfehlung erst nach dem nächsten Training. Falsch. `PutEvents` wirkt in Sekunden, das Volltraining läuft davon unabhängig alle sieben Tage.

**Die Campaign-Falle in beide Richtungen.** Wer Empfehlungen nur einmal nächtlich in eine Tabelle schreibt, braucht keine vorgehaltene Kapazität — dann ist ein Batch Inference Job günstiger. Wer aber live antworten muss, braucht Recommender oder Campaign, und beide kosten im Stand.

**Die Datenmengen-Falle.** Ein Szenario, das einen frisch gestarteten Shop ohne nennenswerte Historie beschreibt, meint nicht Personalize. Unter 1.000 Interaktionen und 25 aktiven Nutzern entsteht kein Recommender — dann bleibt nur, erst Events zu sammeln und später zu trainieren.

**A — Ein eigenes Modell in SageMaker AI trainieren und als Endpoint betreiben:** technisch korrekt, verletzt aber „kein ML-Team" und „ohne eigenes Modell".

**B — Nächtlicher Batch-Job, der Empfehlungen in DynamoDB schreibt:** billig und für Newsletter richtig, kann aber den Klick von vor zwanzig Sekunden nicht berücksichtigen.

**D — Custom Dataset Group mit Solution und Campaign:** funktioniert, verschenkt vorkonfigurierte Recommender und automatisches Retraining, und lässt sich nachträglich nicht in eine Domain-Gruppe umwandeln.

**E — Regelbasierte Empfehlungen aus einer Warenkorbanalyse in der eigenen Datenbank:** keine ML, kein Cold-Start-Verhalten, keine Reaktion auf Live-Signale — das ist Weg eins aus der Grundidee.
