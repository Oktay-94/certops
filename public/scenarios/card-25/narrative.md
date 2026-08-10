---
cardNumber: 25
slug: dynamodb-global-tables-kestrel-multi-active
title: "DynamoDB Global Tables — Schreibzugriffe in jeder Region"
services: ["Amazon DynamoDB", "DynamoDB Global Tables", "DynamoDB Streams"]
domains: ["D2", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-global-table-design.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/globaltables-security.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/V2globaltables_versions.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/globaltables.V1.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/example_dynamodb_Scenario_MRSCGlobalTables_section.html"
  - "https://aws.amazon.com/blogs/aws/build-the-highest-resilience-apps-with-multi-region-strong-consistency-in-amazon-dynamodb-global-tables"
  - "https://aws.amazon.com/about-aws/whats-new/2024/12/amazon-dynamodb-global-tables-previews-multi-region-strong-consistency"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Kassenbuch für ein Unternehmen mit drei Standorten zu führen.

**Art eins:** Das Buch liegt in Frankfurt im Tresor. Es gibt genau eines. Wer in Singapur eine Fahrt eintragen will, ruft in Frankfurt an, sagt die Zeile durch, wartet, bis der Kollege sie geschrieben hat, und bekommt dann „steht drin". Der Anruf dauert. Nicht weil jemand langsam wäre, sondern weil die Erde eine bestimmte Größe hat. Für Kestrel Mobility sind das 180 Millisekunden pro Schreibvorgang aus Singapur — bei einer Roller-App, die alle paar Sekunden eine Position meldet.

**Art zwei:** Jeder Standort führt sein eigenes vollwertiges Kassenbuch. Nicht eine Kopie zum Nachlesen, sondern ein Buch, in das man schreiben darf. Die Bücher gleichen sich ständig gegenseitig ab, im Hintergrund, ohne dass jemand telefoniert. Der Eintrag in Singapur ist fertig, sobald er in Singapur steht.

DynamoDB Global Tables ist Art zwei. Es gibt kein Original und keine Kopien — es gibt drei gleichwertige Bücher.

Und genau daraus folgt der Preis, den die halbe Karte behandelt: Wenn zwei Standorte im selben Moment dieselbe Zeile beschreiben, muss irgendjemand entscheiden, welche der beiden Fassungen gilt. Bei einem Buch im Tresor kann das nicht passieren. Bei drei Büchern schon.

## Was es eigentlich ist — eine Tabelle mit Replicas

Global Tables ist kein eigener Dienst, den man danebenstellt. Es ist eine **Eigenschaft deiner Tabelle**. Du hast weiterhin eine Tabelle namens `rides`, sie existiert nur jetzt in drei Regionen gleichzeitig. So sieht das im `DescribeTable`-Ergebnis aus:

```json
{
  "TableName": "rides",
  "MultiRegionConsistency": "EVENTUAL",
  "Replicas": [
    { "RegionName": "eu-central-1",   "ReplicaStatus": "ACTIVE" },
    { "RegionName": "sa-east-1",      "ReplicaStatus": "ACTIVE" },
    { "RegionName": "ap-southeast-1", "ReplicaStatus": "ACTIVE" }
  ],
  "GlobalTableWitnesses": []
}
```

Drei Zeilen, drei Regionen, und ein Feld, das den ganzen Rest bestimmt. `MultiRegionConsistency` steht hier auf `EVENTUAL` — das ist der Standardfall, den die Karte zeigt, und in AWS-Vokabular heißt er **MREC**, multi-Region eventual consistency. Der andere mögliche Wert ist `STRONG`, dann heißt es **MRSC**. Der grüne Kasten auf der Karte gehört zu diesem einen Feld.

Was du in dieser Ausgabe **nicht** siehst: eine Primary-Region, eine Rolle, eine Richtung, eine Reihenfolge. `Replicas` ist eine Liste ohne Rangordnung. Das ist keine Auslassung in der Doku, das ist die Aussage.

Der Anwendungscode ändert sich dabei nicht. `PutItem` bleibt `PutItem`, der Tabellenname bleibt `rides`. Was sich ändert, ist eine Zeile in der Client-Konfiguration:

```python
ddb = boto3.client("dynamodb", region_name="ap-southeast-1")
ddb.put_item(TableName="rides", Item={
    "ride_id": {"S": "R-4711"},
    "status":  {"S": "started"}
})
```

Der regionale Endpoint ist die ganze Anpassung.

## Der Weg durch die Karte

### Badge 1 — PutItem lokal in Berlin

Die App in `eu-central-1` startet eine Fahrt und schreibt gegen den Frankfurter Endpoint. Aus Sicht dieser Anwendung ist überhaupt nichts besonders: ein `PutItem` gegen eine Tabelle in der eigenen Region, Antwortzeit im einstelligen Millisekundenbereich.

Wichtig ist, was **nicht** passiert. Berlin wartet nicht auf São Paulo. Berlin fragt niemanden um Erlaubnis. Das „OK" kommt aus der eigenen Region und bedeutet: In Frankfurt steht die Fahrt.

Das ist der Unterschied zu jedem Konsens-Verfahren, das du sonst kennst. Es wird nicht abgestimmt, es wird geschrieben.

### Badge 2 — asynchron, unter 1 s

Jetzt fließt der Eintrag zu den anderen beiden Replicas. Typischerweise ist er in unter einer Sekunde dort.

**Der entscheidende Satz steht in der Reihenfolge der beiden Vorgänge: Berlin hat das „OK" schon bekommen, bevor São Paulo den Eintrag gesehen hat.**

Das Bild dazu: Du wirfst einen Brief in den Briefkasten und gehst weiter. Der Brief ist unterwegs, aber du wartest nicht am Kasten, bis der Empfänger ihn gelesen hat. „Asynchron" heißt genau das und nichts anderes.

Unter der Haube läuft die Replikation über DynamoDB Streams — die Karte zeichnet das bewusst nicht, weil du daran nichts konfigurierst und nichts konsumierst. Die Mechanik ist Betriebsgeheimnis des Dienstes, das Verhalten nicht.

### Badge 3 — GetItem lokal in Singapur

Der Nutzer in Singapur liest aus `ap-southeast-1`. Kein Umweg über Frankfurt, keine 180 ms.

Und hier lohnt es sich, genau hinzusehen, wofür die Latenz eigentlich fällt: Nicht nur Schreibvorgänge sind lokal geworden, sondern auch Lesevorgänge. Das ist der leise Gewinn der Karte. Eine reine Read-Replica-Lösung hätte das auch gekonnt — der Rest der Karte handelt davon, was sie nicht gekonnt hätte.

### Badge 4 — PutItem lokal in São Paulo, gleichzeitig

Dieselbe Operation wie Badge 1, an einem anderen Ort, im selben Moment erlaubt. Es gibt keine Wartezeit zwischen den beiden, keine Sperre, keinen Token, der herumgereicht wird.

Fällt eine Region komplett aus, gibt es hier nichts zu befördern und nichts umzuschalten. Die anderen beiden Replicas haben die Daten bereits und nehmen bereits Schreibvorgänge an. Was du umleiten musst, ist der Verkehr deiner **Anwendung** — die Datenbank ist schon da, wo sie sein muss.

Das ist der Grund, warum Global Tables in Prüfungsfragen zu Disaster Recovery auftaucht und nicht nur in Fragen zu Latenz.

### Badge 5 — Berlin ↔ Singapur direkt

Der untere Pfeil sagt etwas, das man leicht überliest: Es gibt **keinen Sternpunkt**. Berlin schickt nicht an São Paulo, damit São Paulo an Singapur weiterreicht. Jedes Regionspaar tauscht direkt aus.

Deshalb hat der Ausfall einer Region auch keinen Dominoeffekt auf die Replikation zwischen den beiden übrigen. Es gibt keine Region, deren Ausfall den Rest lahmlegt, weil es keine gibt, durch die alles hindurchmuss.

Auf der Karte ist der Pfeil doppelköpfig gezeichnet. Real sind es gerichtete Replikatoren, einer je Richtung und Paar — die `.md` weist unter „Bewusste Vereinfachungen" selbst darauf hin. Für das Verständnis ändert das nichts, für die Kostenrechnung schon (siehe unten).

### Der rote Kasten — Konflikt: Last Writer Wins

Zwei Regionen schreiben dasselbe Item im selben Moment. Beide bekommen ein „OK". Danach gleichen sich die Repliken ab, und **der Schreibvorgang mit dem jüngeren Zeitstempel gewinnt**. Der andere ist weg. Kein Fehler, keine Meldung, kein Eintrag in irgendeinem Log, das du im Alltag liest.

Das Bild dazu: Zwei Leute schreiben mit Bleistift in ihr jeweiliges Kassenbuch. Beim Abgleich radiert der Spätere den Eintrag des Früheren aus, ohne ihn vorher gelesen zu haben.

Das ist kein Fehler des Dienstes, sondern sein dokumentiertes Konfliktmodell. Es macht Global Tables aber untauglich für alles, was auf dem Vorzustand aufbaut: Zähler, Kontostände, Bestandsmengen. `UpdateItem` mit `SET counter = counter + 1` ist in zwei Regionen gleichzeitig eine Einladung zum stillen Datenverlust.

Das Gegenmittel steht im Kasten und ist eine Architekturentscheidung, keine Einstellung: **Sorge dafür, dass ein bestimmtes Item nur in einer Region geschrieben wird.** Bei Kestrel liegt das nahe — ein Roller steht in genau einer Stadt. Nimm die Region in den Partition Key auf, und der Konflikt kann nicht entstehen, weil sich zwei Regionen nie um dieselbe Zeile streiten.

### Der grüne Kasten — MRSC seit 30.06.2025

Für die Fälle, in denen das nicht geht, gibt es seit dem 30.06.2025 multi-Region strong consistency. Preview war auf der re:Invent im Dezember 2024, allgemein verfügbar seit Ende Juni 2025.

Was du bekommst: RPO 0. Du darfst aus jeder der beteiligten Regionen strongly consistent lesen und bekommst den global aktuellen Stand.

Was du dafür aufgibst, steht ebenfalls im Kasten, und die Liste ist unbequem:

- **Exakt drei Regionen.** Nicht zwei, nicht fünf. Entweder drei volle Replicas oder zwei Replicas plus einen **Witness**.
- Ein Witness hält aktuelle Änderungsdaten für die Mehrheitsbildung, ist aber **nicht les- und nicht beschreibbar** — und verursacht weder Storage- noch Write-Kosten.
- **Keine Transaktions-APIs.** `TransactWriteItems` und `TransactGetItems` fallen weg.
- Konflikte werden nicht mehr still aufgelöst, sondern werfen eine Exception, die du wiederholen musst.
- Höhere Latenz bei Schreib- und starken Lesevorgängen, weil ein Quorum über Regionen hinweg gebildet wird. Eventually consistent Reads bleiben davon unberührt.
- Der Modus ist nach der Erstellung nicht mehr änderbar.

### Der graue Kasten — Nicht verwechseln

Der Kasten fasst die zwei Karten zusammen, mit denen diese hier am häufigsten verwechselt wird.

**Gegen Karte 22, RDS Read Replica:** Dort gibt es genau eine Schreibquelle und beliebig viele Lesekopien. Ein Rollenwechsel heißt Promotion, ist ein manueller Eingriff und irreversibel. Hier gibt es keine Rolle, also auch keine Promotion. Wer in einer Prüfungsfrage „promote the replica in the other Region" liest, liest RDS, nicht DynamoDB.

**Gegen Karte 21, DAX:** Schreibvorgänge, die über die Global-Table-Replikation in eine Region kommen, gehen **an DAX vorbei**. Der Cache in Singapur erfährt vom Berliner Write nichts und liefert bis zum Ablauf seiner TTL — standardmäßig fünf Minuten — den alten Wert. Karte 21 nennt dieselbe Sache von der anderen Seite; die beiden Karten sind hier deckungsgleich, das ist kein Widerspruch, sondern Absicht.

## Die entscheidende Unterscheidung

Die eine Achse, an der das ganze Szenario hängt:

| | **MREC** (Standard) | **MRSC** |
|---|---|---|
| Regionen | beliebig viele | **exakt drei** |
| Witness möglich | nein | ja, statt der dritten Replica |
| Konflikt | Last Writer Wins, still | Exception, retrybar |
| RPO | Sekundenbereich | **0** |
| Lesen über Regionen | eventually consistent | strongly consistent |
| Transaktionen | ja | **nein** |
| Konten | auch kontenübergreifend | nur **ein** Konto |
| Signalwort | „multi-active", „low latency" | „RPO of zero" |

## Die ehrliche Feinheit

Drei Punkte, die auf der Karte keinen Platz hatten und in Tutorials selten stehen.

**Erstens: MRSC lässt sich nur auf einer leeren Tabelle einschalten.** Die AWS-Doku zeigt den Ablauf ausdrücklich mit einer frisch angelegten, noch datenlosen Tabelle. Das ist praktisch die härteste Einschränkung von allen — eine bestehende Produktionstabelle bekommt keine starke Multi-Region-Konsistenz nachgerüstet. Zusammen mit „der Modus ist danach nicht mehr änderbar" heißt das: Diese Entscheidung fällt am ersten Tag oder gar nicht.

**Zweitens: „Strongly consistent" bedeutet in MREC etwas anderes, als du denkst.** Setzt du `ConsistentRead=true` gegen die Replica in São Paulo, bekommst du den aktuellen Stand **dieser Replica**. Nicht den globalen. Ein Berliner Schreibvorgang von vor 300 Millisekunden kann fehlen, und die Antwort trägt trotzdem das Etikett „strongly consistent". Das Flag garantiert Konsistenz innerhalb einer Region, und der Name verrät nicht, wo diese Grenze verläuft.

**Drittens: Die Rechnung.** Ein Schreibvorgang in Berlin wird in Singapur und São Paulo erneut als Kapazität berechnet, als replicated write. Drei Regionen heißen näherungsweise dreifache Schreibkosten plus dreifache Speicherkosten — dazu kommt der regionsübergreifende Datentransfer. Die Karte zeigt das nicht, und in Prüfungsfragen taucht es selten auf. In der Rechnung deines Arbeitgebers schon.

Ein Randfall am Rande: Es gibt Global Tables in zwei Versionen. Die aktuelle heißt 2019.11.21, die alte 2017.11.29 und trägt in der Doku durchgängig den Zusatz „Legacy". Die Legacy-Version verlangt, dass alle Repliken leer sind, bevor eine Region hinzukommt; die aktuelle erlaubt das Hinzufügen und Entfernen von Replicas bei Tabellen, die bereits Daten enthalten. Abgeschaltet ist Legacy nicht, empfohlen auch nicht. Für die Prüfung gilt schlicht die aktuelle.

## Syntax lesen — `update-table` mit Witness

Der Aufruf, mit dem aus einer einzelnen Tabelle eine MRSC-Global-Table wird, enthält den gesamten grünen Kasten in wenigen Zeilen:

```
aws dynamodb update-table \
    --table-name rides \
    --replica-updates '[{"Create": {"RegionName": "us-east-1"}}]' \
    --global-table-witness-updates '[{"Create": {"RegionName": "us-west-2"}}]' \
    --multi-region-consistency STRONG \
    --region us-east-2
```

Lies die Regionen zusammen: `us-east-2` ist die Region, gegen die du den Aufruf absetzt, `us-east-1` wird volle Replica, `us-west-2` wird Witness. Das sind drei — die vorgeschriebene Zahl, und sie steht nirgends als eigener Parameter, sondern ergibt sich aus dem, was du aufzählst.

Zwei Parameter, ein Unterschied: `--replica-updates` legt eine lesbare und beschreibbare Kopie an, `--global-table-witness-updates` legt einen Teilnehmer an, der ausschließlich an der Mehrheitsbildung mitwirkt. Deshalb kostet der eine Storage und Writes und der andere nicht.

Und `--multi-region-consistency STRONG` ist genau das Feld, das im `DescribeTable`-Ergebnis oben auf `EVENTUAL` stand. Lässt du es weg, bekommst du MREC — mit allem, was der rote Kasten dazu sagt. Diese eine Option ist die Grenze zwischen den beiden Hälften der Karte.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur **nicht** existiert:

- keine Primary-Region und kein Failover-Verfahren auf Datenbankebene
- kein Promotion-Schritt, kein Runbook dafür, kein Test dafür
- keine selbstgebaute Replikation über Streams und Lambda
- kein Konflikt-Handling im Code — solange du MREC fährst und die Konflikte fachlich ausschließt
- keine Anwendungsänderung außer dem regionalen Endpoint
- keine Regionsliste im Code, die gepflegt werden müsste

Übrig bleiben: eine Tabelle, drei Endpoints und eine Entscheidung darüber, wer welches Item schreiben darf.

## Wenn du dir eine Sache merkst

**Jede Region schreibt. Keine ist die erste. Und deshalb entscheidet bei Gleichzeitigkeit der jüngere Zeitstempel — leise.**

Read Replicas haben eine Schreibquelle und viele Lesekopien. Aurora Global Database hat eine schreibende Primary-Region und Sekundärregionen, die man befördern muss. Global Tables hat drei Bücher und keinen Tresor.

## Prüfungsknackpunkte

**Signalwörter:** „users around the world", „write locally in every Region", „active-active" oder „multi-active", „regional failure". Weltweit plus lokal schreiben ist immer Global Tables.

**Warum RDS Read Replicas hier verlieren:** Sie lösen die Lesestrecke, nicht die Schreibstrecke. Der Nutzer in Singapur läse schnell und schriebe weiterhin 180 ms nach Frankfurt. Steht im Fragetext „write locally", ist jede Read-Replica-Antwort erledigt.

**Warum Aurora Global Database hier verliert:** Sie repliziert regionsübergreifend, aber es gibt genau eine schreibende Region; die anderen sind Lesekopien mit einem Promotion-Pfad. Das ist ein DR-Werkzeug, kein Multi-Active-Werkzeug. Achte im Fragetext darauf, ob nach Ausfallsicherheit *oder* nach lokalen Schreibvorgängen gefragt wird.

**Warum DAX hier verliert:** DAX beschleunigt Reads innerhalb **einer** Region und macht die Sache in einem Multi-Region-Aufbau sogar schlechter, weil er die Writes der anderen Regionen nicht mitbekommt.

**Warum „CloudFront vor der API" hier verliert:** Das verkürzt den Weg zur Anwendung, nicht den Weg zur Datenbank. Der Schreibvorgang landet weiterhin in Frankfurt.

**Die Zeitstempel-Falle.** Wenn eine Antwortoption „conflicts are resolved by the application" oder „DynamoDB returns an error on conflicting writes" sagt, ist sie im Standardmodus falsch. Es gibt keinen Fehler. Diese Formulierung ist nur unter MRSC richtig — und dann steht „RPO of zero" oder „strongly consistent across Regions" im Fragetext.

**Die Konsistenz-Falle.** „Enable strongly consistent reads to see data from all Regions" klingt plausibel und ist falsch. Das Flag wirkt regional.

**Die MRSC-Falle.** Sobald eine Antwortoption vier oder fünf Regionen mit starker Konsistenz anbietet, ist sie falsch — es sind exakt drei.
