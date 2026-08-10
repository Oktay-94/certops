---
cardNumber: 7
slug: lambda-sqs-dlq-bestellungen-entkoppeln
title: "Battle Card 7 — Lambda · SQS · DLQ"
services: ["AWS Lambda", "Amazon SQS", "SQS Dead-Letter Queue", "Amazon DynamoDB", "Event Source Mapping"]
domains: ["D2"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/lambda/latest/dg/services-sqs-configure.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/invocation-retries.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/invocation-async-retain-records.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-lambda-function-trigger.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/services-ddb-batchfailurereporting.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, in einem vollen Restaurant Bestellungen in die Küche zu bringen.

**Art eins:** Der Kellner nimmt die Bestellung von Tisch 4 auf, geht in die Küche, stellt sich neben den Koch und wartet. Er wartet, bis das Gericht fertig ist. Erst dann dreht er sich um und geht zurück in den Saal, wo inzwischen sechs Gäste winken. Wenn der Koch krank wird, steht der Kellner in der Küche und der ganze Saal steht still.

**Art zwei:** Der Kellner schreibt den Bon, spießt ihn auf die Schiene über dem Pass, dreht sich um und geht. Fertig. Zwei Sekunden. Die Küche arbeitet die Schiene ab, in ihrem Tempo. Bei Ansturm wird die Schiene länger. Wird sie kürzer, geht es dem Koch gerade gut.

Die Schiene ist die Queue. Sie tut genau eine Sache, und die tut sie vollständig: **Sie entkoppelt die Geschwindigkeit des Bestellens von der Geschwindigkeit des Kochens.**

Und dann gibt es den Bon, den niemand entziffern kann. Kaffeefleck, Krakelschrift, ein Gericht, das es nicht gibt. Der Koch nimmt ihn viermal in die Hand, legt ihn viermal zurück, und jedes Mal blockiert er die Schiene. Beim fünften Mal wandert er in einen Kasten neben dem Pass, auf dem „Klärfälle" steht. Die Schiene läuft weiter. Der Bon ist nicht weg — er ist nur aus dem Weg.

Dieser Kasten ist die Dead-Letter Queue. Sie ist kein Mülleimer. Sie ist ein Ablagefach, das verhindert, dass ein einziger kaputter Auftrag den Betrieb aufhält.

## Was es eigentlich ist — die Redrive Policy

Der Prüfungskern dieser Karte ist kein Service. Er ist ein Ort. Genauer: die Frage, **an welchem Objekt die DLQ-Konfiguration hängt**.

Sie hängt an der Queue:

```json
{
  "QueueName": "order-queue",
  "Attributes": {
    "VisibilityTimeout": "180",
    "MessageRetentionPeriod": "345600",
    "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:eu-central-1:1234:order-dlq\",\"maxReceiveCount\":5}"
  }
}
```

Lies das von oben nach unten. `QueueName` — das ist die Order Queue, der türkise Kasten links. `VisibilityTimeout` — wie lange eine gezogene Nachricht unsichtbar bleibt, hier 180 Sekunden. `RedrivePolicy` — und hier steht alles, was mit der DLQ zu tun hat: wohin (`deadLetterTargetArn`) und ab wann (`maxReceiveCount`).

Zwei Details, die beim ersten Lesen untergehen und in der Praxis Zeit kosten:

**Erstens ist die Redrive Policy ein String, kein Objekt.** Beachte die maskierten Anführungszeichen. SQS erwartet an dieser Stelle JSON *innerhalb* eines JSON-Werts. Wer sie als verschachteltes Objekt schreibt, bekommt einen Fehler, der nicht erklärt, was los ist.

**Zweitens taucht das Wort „Lambda" in dieser Konfiguration nirgends auf.** Die Funktion weiß nichts von der DLQ. Sie kann nichts dazu beitragen und nichts daran ändern. Die Queue allein entscheidet, wann eine Nachricht umzieht.

Und zum Vergleich der Datensatz, um den es hier ausdrücklich **nicht** geht — die Konfiguration an der Lambda-Funktion:

```json
{
  "FunctionName": "processOrder",
  "DeadLetterConfig": { "TargetArn": "arn:aws:sqs:eu-central-1:1234:async-dlq" }
}
```

Anderes Objekt, anderes Feld, anderer Zweck. Beide heißen im Gespräch „die DLQ". Das ist die ganze Falle.

## Der Weg durch die Karte

### Kasten links — der Bestell-Service

„Lastspitzen zur Peak-Zeit" steht darunter, und das ist die Begründung für alles, was rechts davon folgt.

Am Black Friday um 20:00 gehen nicht doppelt so viele Bestellungen ein wie sonst, sondern für zwanzig Minuten das Fünfzigfache. Danach fällt die Kurve wieder ab. Du hast zwei Möglichkeiten: die Verarbeitung so dimensionieren, dass sie die Spitze aushält — und den Rest des Jahres dafür bezahlen. Oder die Spitze in einen Puffer laufen lassen.

Der Bestell-Service schreibt und geht. Er wartet nie auf die Verarbeitung. Für den Kunden ist die Bestellung in dem Moment angenommen, in dem sie in der Queue liegt.

### Badge 1 — send

Ein `SendMessage`-Aufruf, und der Producer ist fertig. Er bekommt eine `MessageId` zurück und ein „liegt drin".

Wichtig für das Verständnis der ganzen Karte: **Ab hier ist der Producer aus dem Spiel.** Er erfährt nie, ob die Bestellung verarbeitet wurde, ob es geklappt hat, ob sie in der DLQ gelandet ist. Wenn dein Kunde eine Bestätigung sehen soll, muss die aus einem anderen Weg kommen — nicht aus diesem Pfeil.

### Kasten — SQS Order Queue

`Buffer · entkoppelt` und `maxReceiveCount = 5 → DLQ`.

Die Queue ist das einzige Element auf dieser Karte, das ohne Zutun funktioniert. Sie skaliert nicht, weil sie nichts zu skalieren hat — sie nimmt an, was kommt. Eine Standard-Queue hat kein Durchsatzlimit, das du in einem Bestellsystem erreichen würdest.

Was sie dir dafür nicht gibt: **Reihenfolge.** Eine Standard-Queue liefert best-effort-geordnet, nicht garantiert geordnet. Wenn Bestellung `#4711` vor `#4712` eingeht, kann `#4712` trotzdem zuerst verarbeitet werden. Für „Bestellung schreiben" ist das egal. Für „erst anlegen, dann stornieren" wäre es fatal — dann brauchst du eine FIFO-Queue, und die kostet dich Durchsatz.

Das Bild dazu: Die Bon-Schiene über dem Pass hat keine Sortierung. Der Koch nimmt, was er greift.

### Badge 2 — poll Batch

Hier steht auf der Karte `Event Source Mapping`, und dieses Detail trägt mehr Gewicht, als seine Schriftgröße vermuten lässt.

**Das Event Source Mapping ist kein Teil deiner Funktion.** Es ist eine eigene Ressource, die AWS für dich betreibt. Sie pollt die Queue, sammelt Nachrichten zu einem Batch und ruft deine Funktion auf. Du schreibst keine Zeile Polling-Code.

Und sie ruft **synchron** auf. Das ist die technische Wurzel der gesamten DLQ-Frage weiter unten, und es lohnt sich, den Satz einmal bewusst zu lesen: Lambda pollt die Queue und invoked deine Funktion synchron, mit einem Batch als Event.

Die Concurrency wächst mit der Queue-Tiefe. Bleibt die Schiene lang, stellt AWS mehr Köche an den Pass.

### Kasten — Lambda

`pollt Batches · idempotent`.

Das zweite Wort ist eine Anforderung an deinen Code, keine Eigenschaft von Lambda. SQS liefert **at-least-once**. Nicht „genau einmal". Mindestens einmal.

Das heißt konkret: Deine Funktion wird dieselbe Bestellung `#4711` unter Umständen zweimal sehen. Nicht weil etwas kaputt ist, sondern weil verteilte Systeme so funktionieren. Wenn dein Code stumpf `INSERT` macht, hast du die Bestellung doppelt in der Datenbank und den Kunden doppelt belastet.

Der Ausweg steht nicht auf der Karte, weil er in deinem Code liegt: Schreib mit der `MessageId` oder einer fachlichen Bestellnummer als Primärschlüssel, dann ist der zweite Schreibvorgang ein No-Op statt einer zweiten Bestellung.

### Badge 3 — write

Die Bestellung geht nach DynamoDB. Das ist der einzige fachliche Schritt auf der ganzen Karte; alles andere ist Infrastruktur.

Und in dem Moment, in dem deine Funktion ohne Fehler zurückkehrt, löscht das Event Source Mapping die Nachricht aus der Queue. Nicht dein Code — das Mapping. Der Bon kommt von der Schiene, weil das Gericht rausgegangen ist.

### Badge 4 — Fehler zurück in die Queue

Deine Funktion wirft eine Exception. Oder sie wird gedrosselt und kommt gar nicht erst dran.

Dann passiert: **nichts.** Genau das ist der Mechanismus. Die Nachricht wird nicht gelöscht. Sie ist noch da, nur unsichtbar — für die Dauer des Visibility Timeout. Läuft der ab, wird sie wieder sichtbar, und der nächste Poll zieht sie erneut.

Das Bild dazu: Der Koch nimmt den Bon von der Schiene, versteht ihn nicht, legt ihn zurück. Solange er ihn in der Hand hat, sieht ihn kein anderer Koch. Legt er ihn zurück, hängt er wieder da.

**Und hier die Feinheit, die den Standardfall vom Sonderfall trennt:** Ohne weitere Konfiguration kehrt bei einem Fehler der *gesamte* Batch zurück. Zehn Nachrichten, neun davon einwandfrei verarbeitet, eine kaputt — alle zehn werden erneut zugestellt. Die neun guten laufen ein zweites Mal durch deinen Code. Genau deshalb ist Idempotenz keine Kür.

`ReportBatchItemFailures` ist der Schalter, der das ändert. Damit meldet deine Funktion zurück, welche einzelnen Nachrichten gescheitert sind, und nur die kommen zurück.

### Badge 5 — nach fünf Fehl-Zustellungen in die DLQ

Jede Nachricht in SQS trägt einen Zähler mit: wie oft wurde ich schon ausgeliefert. Erreicht dieser Zähler den `maxReceiveCount` aus der Redrive Policy, verschiebt SQS die Nachricht in die Dead-Letter Queue.

Auf der Karte steht `5`, und AWS empfiehlt für den Lambda-Fall mindestens diesen Wert. Die Begründung ist nicht Großzügigkeit, sondern Erfahrung: Wenn deine Funktion einen Fehler wirft oder wegen Maximum Concurrency nicht aufgerufen werden kann, gelingt die Verarbeitung mit weiteren Versuchen oft doch. Ein `maxReceiveCount` von 1 oder 2 sortiert dir bei einer Lastspitze kerngesunde Bestellungen aus, weil sie einmal in ein Throttling gelaufen sind.

**Der Zähler zählt Zustellungen, nicht Fehler.** Diese Unterscheidung ist prüfungsrelevant und wird gern überlesen. Eine Nachricht, die fünfmal empfangen wurde, geht in die DLQ — auch wenn dein Code sie nie zu Gesicht bekommen hat, weil das Konto jedes Mal am Concurrency-Limit stand.

Im DLQ-Kasten steht `Retention 14 Tage` und `Alarm auf Queue-Depth`. Beides ist bewusst gesetzt. 14 Tage ist das SQS-Maximum, und für eine DLQ willst du das Maximum — du brauchst Zeit, den Fehler zu finden und die Nachrichten erneut einzuspielen. Der Alarm ist der eigentliche Punkt: **Eine DLQ, auf die niemand schaut, ist ein stiller Datenverlust mit vierzehn Tagen Verzögerung.**

### Der graue Kasten rechts — Lambda Async-DLQ

Dieser Kasten steht nicht auf der Karte, weil er zur Lösung gehört. Er steht da, weil er die häufigste falsche Antwort ist.

Lambda hat eine eigene DLQ-Einstellung, `DeadLetterConfig`. Sie fängt Events, die bei **asynchronen** Invokes nach allen Retries nicht durchkommen. SNS löst asynchron aus, EventBridge auch, ein direkter Aufruf mit `InvocationType: Event` ebenso. In all diesen Fällen greift sie.

Bei einem SQS-Trigger greift sie nie. Das ist keine Einschränkung und kein Bug, sondern eine logische Folge: Das Event Source Mapping invoked **synchron**. Es gibt keinen asynchronen Invoke, also gibt es nichts, was diese Einstellung abfangen könnte.

Wer es noch schärfer belegt haben will: AWS listet ausdrücklich auf, für welche Event-Source-Mapping-Typen sich Aufzeichnungen fehlgeschlagener Invocations konfigurieren lassen — Kinesis, DynamoDB und Apache Kafka. SQS steht nicht auf dieser Liste.

## Die entscheidende Unterscheidung

Zwei Dinge heißen „DLQ", und sie haben außer dem Namen nichts gemeinsam:

| | DLQ der Source-Queue | Lambda Async-DLQ |
|---|---|---|
| Konfiguriert an | der SQS-Queue (`RedrivePolicy`) | der Lambda-Funktion (`DeadLetterConfig`) |
| Greift bei | Poll-basierten Triggern (SQS) | asynchronen Invokes (SNS, EventBridge) |
| Auslöser | `maxReceiveCount` erreicht | alle Lambda-Retries erschöpft |
| Wer verschiebt | SQS | Lambda |
| Bei SQS-Trigger | **das ist die richtige** | **greift nie** |

Wenn in einer Prüfungsfrage „SQS triggert Lambda" und „fehlgeschlagene Nachrichten sollen isoliert werden" zusammen vorkommen, ist die Antwort immer die linke Spalte.

## Die ehrliche Feinheit

**Beim Visibility Timeout gibt es zwei Schranken, und nur eine davon ist verhandelbar.**

Die weiche: AWS empfiehlt, den Visibility Timeout auf mindestens das Sechsfache des Function Timeout zu setzen. Der Puffer gibt Lambda Gelegenheit, es erneut zu versuchen, wenn die Funktion beim vorigen Batch gedrosselt wurde. Nutzt du ein Batch Window, kommt dessen Wert obendrauf.

Die harte: Das Function Timeout muss kleiner oder gleich dem Visibility Timeout sein. Lambda prüft das beim Anlegen oder Ändern des Event Source Mapping und lehnt es mit einem Fehler ab, wenn das Function Timeout größer ist.

Sechsfach ist also eine Empfehlung, einfach ist eine Bedingung. **Die Altdatei `battle_card_7.md` schreibt an dieser Stelle „muss ≥ 6× Lambda-Timeout sein" — das ist zu streng.** Ein Verhältnis von 3× wird angelegt, funktioniert und ist trotzdem eine schlechte Idee. Auf der Karte selbst steht dieser Satz nicht.

**Zweite Feinheit: `ReportBatchItemFailures` ist scharf, wenn man es falsch bedient.** Der Schalter muss am Event Source Mapping aktiviert sein — ein Rückgabewert allein reicht nicht, Lambda ignoriert ihn sonst. Ist er aktiv, gilt: leeres Array oder fehlender Key bedeutet „alles gut, alles löschen". Ungültiges JSON oder ein leerer `itemIdentifier` bedeutet dagegen, dass Lambda den **kompletten Batch** als gescheitert behandelt. Ein Tippfehler im Response-Objekt schaltet dich also nicht auf das alte Verhalten zurück, sondern verschlechtert es: Jetzt scheitert alles, auch wenn nur eine Nachricht kaputt war.

**Dritte Feinheit, die die Karte bewusst weglässt:** SQS ist hier nicht der einzige Weg, Lastspitzen zu puffern. Kinesis Data Streams könnte es auch. Der Unterschied ist die Semantik. SQS ist eine Arbeitsschlange — jede Nachricht gehört genau einem Consumer, und danach ist sie weg. Kinesis ist ein Protokoll — die Daten bleiben liegen, mehrere Consumer lesen dieselben Records unabhängig voneinander, und die Reihenfolge innerhalb eines Shards ist garantiert. Für „Bestellungen abarbeiten" willst du eine Arbeitsschlange.

## Syntax lesen — die Partial-Batch-Response

Der Rückgabewert, den deine Funktion liefern muss, wenn `ReportBatchItemFailures` aktiv ist:

```json
{
  "batchItemFailures": [
    { "itemIdentifier": "059f36b4-87a3-44ab-83d2-661975830a7d" },
    { "itemIdentifier": "2e1424d4-f796-459a-8184-9c92662be6da" }
  ]
}
```

```
{ "batchItemFailures": [ { "itemIdentifier": "..." } ] }
        │                       │
        │                       └─ bei SQS: die messageId der Nachricht
        └─ leeres Array = alles erfolgreich, alles löschen
```

Bei SQS ist der `itemIdentifier` die `messageId`, und nur die aufgeführten Nachrichten kehren in die Queue zurück. Bei Streams — DynamoDB oder Kinesis — ist an derselben Stelle eine Sequence Number gemeint, und das Verhalten ist ein anderes: Enthält das Array mehrere Einträge, nimmt Lambda den Record mit der niedrigsten Sequence Number als Checkpoint und wiederholt alles ab dort.

Gleiche Feldnamen, gleiche Struktur, unterschiedliche Bedeutung. Bei einer Queue meldest du einzelne Nachrichten. Bei einem Stream meldest du eine Position.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur nicht existiert:

- kein Polling-Loop, den jemand schreiben und betreiben müsste
- kein Retry-Code in deiner Funktion — die Wiederholung entsteht dadurch, dass du die Nachricht nicht löschst
- keine Tabelle „fehlgeschlagene Aufträge", die jemand pflegt
- kein Scheduler, der eine Wiedervorlage anstößt
- kein Backpressure-Mechanismus zwischen Producer und Consumer
- keine Skalierungslogik — die Concurrency folgt der Queue-Tiefe von selbst
- kein Zustand in der Funktion; sie ist reine Verarbeitung zwischen Queue und Tabelle

Übrig bleiben: zwei Queues, eine Redrive Policy, ein Event Source Mapping und eine Funktion, die einen Batch nach DynamoDB schreibt.

## Wenn du dir eine Sache merkst

**Die DLQ hängt an der Queue, nicht an der Funktion.**

SNS verteilt sofort an alle Abonnenten und puffert nichts — wer nicht zuhört, verpasst die Nachricht. Kinesis puffert zwar, ist aber ein Protokoll für mehrere Leser, keine Arbeitsschlange für einen. Und Lambdas eigene Async-DLQ existiert zwar, wird hier aber nie angefasst, weil das Event Source Mapping synchron aufruft.

## Prüfungsknackpunkte

**Signalwörter:** „entkoppeln", „Lastspitzen puffern", „Producer soll nicht warten" plus „wiederholt fehlschlagende Nachrichten isolieren". Puffern plus Isolieren ist SQS mit Redrive Policy.

**Warum die Lambda-Async-DLQ hier verliert:** Sie greift ausschließlich bei asynchronen Invokes. Das Event Source Mapping für SQS ruft synchron auf, also gibt es keinen asynchronen Invoke, den sie abfangen könnte. Diese Antwortoption ist in Fragen zu SQS-Triggern fast immer vorhanden und fast immer falsch.

**Warum SNS hier verliert:** SNS ist Fan-out, kein Puffer. Es stellt sofort zu und wiederholt begrenzt; ein Abonnent, der gerade überlastet ist, bekommt die Nachricht nicht später, sondern gar nicht. „Lastspitze abfangen" ist genau das, was SNS nicht tut. SNS wird richtig, sobald *mehrere* Systeme *jede* Nachricht brauchen — dann typischerweise als SNS vor mehreren SQS-Queues.

**Warum Kinesis Data Streams hier verliert:** Technisch könnte es puffern. Aber es ist auf mehrere unabhängige Leser und geordnete Wiedergabe ausgelegt, mit Shards, Sequence Numbers und Retention. Für „jede Bestellung genau einmal abarbeiten, dann ist sie erledigt" ist das der falsche Zuschnitt und der teurere Betrieb.

**Warum Step Functions hier verliert:** Ein Workflow orchestriert Schritte. Hier gibt es einen Schritt. Und Step Functions bräuchte selbst einen Auslöser — es puffert nicht.

**Warum „maxReceiveCount auf 1 setzen" verliert:** Klingt nach schnellem Aussortieren, sorgt aber dafür, dass eine einzelne Drosselung eine gesunde Nachricht in die DLQ schiebt. Der Zähler misst Zustellungen, nicht Fehler.
