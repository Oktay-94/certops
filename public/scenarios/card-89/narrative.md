---
cardNumber: 89
slug: sqs-idempotenz-retry-patterns
title: "SQS, Idempotenz, Retry-Patterns"
services: ["Amazon SQS", "Amazon SQS FIFO", "Amazon DynamoDB", "AWS Lambda"]
domains: ["D2", "D3"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-configure-queue-parameters.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ChangeMessageVisibility.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html"
  - "https://aws.amazon.com/sqs/faqs/"
  - "https://aws.amazon.com/sqs/features/"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, eine Überweisung am Bankschalter genau einmal auszuführen.

**Weg eins:** Du schiebst den Zettel durch die Luke und wartest auf ein Nicken. Es kommt keins — vielleicht war der Angestellte kurz abgelenkt, vielleicht ist der Zettel gar nicht angekommen. Also schreibst du den Zettel neu und schiebst ihn nochmal durch. Jetzt liegen möglicherweise zwei Zettel auf demselben Tisch, und die Bank weiß nicht, dass sie dasselbe meinen.

**Weg zwei:** Auf dem Zettel steht oben rechts eine Belegnummer. Der Angestellte führt eine Liste. Kommt ein zweiter Zettel mit derselben Nummer, wirft er ihn weg, ohne zu buchen. Die Nummer ist die ganze Sicherung.

Und jetzt kommt der Teil, den fast alle übersehen: Es gibt noch einen zweiten Weg, wie dieselbe Buchung zweimal passiert. Der Angestellte nimmt den Zettel, stempelt ihn, führt die Buchung aus — und kippt vom Stuhl, bevor er ihn abhaken kann. Nach zehn Minuten kommt eine Kollegin, sieht einen nicht abgehakten Zettel auf dem Tisch und arbeitet ihn ab. Die Buchung läuft ein zweites Mal.

**Die Belegnummer an der Luke hilft hier nicht. Sie schützt den Eingang, nicht die Kasse.**

Genau das ist die Karte. Links das Problem an der Luke — dafür gibt es eine fertige Lösung. Rechts das Problem an der Kasse — dafür gibt es keine, außer der, die du selbst baust.

## Was es eigentlich ist — zwei Schlüssel, nicht einer

Auf dieser Karte stehen zwei Bezeichner, die gleich aussehen und Verschiedenes tun. Der erste steckt im Aufruf, mit dem der Producer die Nachricht loswird:

```json
{
  "QueueUrl": "https://sqs.eu-central-1.amazonaws.com/1234/payments.fifo",
  "MessageBody": "{\"orderId\":\"4711\",\"amount\":8900,\"currency\":\"EUR\"}",
  "MessageGroupId": "kunde-4711",
  "MessageDeduplicationId": "PAY-991"
}
```

`MessageDeduplicationId` ist die Belegnummer an der Luke. Sie gehört zum **Senden**. `MessageGroupId` ist etwas anderes: die Sortierschublade. Innerhalb einer Group wird streng der Reihe nach zugestellt, verschiedene Groups laufen nebeneinander.

Der zweite Schlüssel steckt nicht in SQS, sondern in deiner Datenbank:

```json
{
  "TableName": "processed-payments",
  "Item": { "pk": { "S": "PAY-991" }, "bookedAt": { "N": "1786529463" } },
  "ConditionExpression": "attribute_not_exists(pk)"
}
```

Das ist die Liste des Angestellten. `attribute_not_exists(pk)` heißt: schreibe nur, wenn zu diesem Schlüssel noch nichts da ist. Existiert der Eintrag bereits, lehnt DynamoDB den Schreibvorgang ab und meldet, dass die konditionale Anfrage fehlgeschlagen ist.

Zwei Zeilen Konfiguration, zwei völlig verschiedene Schutzwirkungen. Die Karte trennt sie räumlich in zwei gestrichelte Zonen, weil sie in Prüfungsfragen ständig vermischt werden.

## Der Weg durch die Karte

### Die linke Zone — Duplikat 1 entsteht vor der Queue

Die gestrichelte Umrandung links trägt keine Rollenfarbe, und das ist Absicht. Sie gruppiert nicht nach Architekturrolle, sondern nach **Ursache**. Alles in dieser Zone beschreibt Duplikate, die entstehen, bevor eine Nachricht überhaupt in der Queue liegt.

### Kasten — Producer

Der Producer ruft `SendMessage` auf. Das Netz hängt, die Antwort bleibt aus, sein HTTP-Client läuft in einen Timeout. Er weiß jetzt genau eines nicht: ob die Nachricht angekommen ist.

Ein Producer, der in dieser Lage nichts tut, verliert im Zweifel die Zahlung. Also sendet er erneut — mit **derselben** `MessageDeduplicationId`. Das ist der entscheidende Reflex. Ein frisch erzeugter Zufallswert bei jedem Versuch wäre der häufigste Implementierungsfehler an dieser Stelle: Er macht die Deduplizierung wirkungslos, obwohl das Feld korrekt befüllt aussieht.

### Pfeil 1 — SendMessage, zum zweiten Mal

Zwei Aufrufe, ein fachliches Ereignis. Aus Sicht von SQS zwei Anfragen mit identischem Bezeichner.

### Kasten — SQS FIFO

Die Queue nimmt die zweite Nachricht an — sie antwortet nicht mit einem Fehler — aber sie **stellt sie nicht zu**. Die AWS-Dokumentation formuliert das als Zusage: FIFO-Queues führen keine Duplikate in die Queue ein, und ein Retry von `SendMessage` innerhalb des Deduplizierungsintervalls von fünf Minuten erzeugt keines.

Woher der Bezeichner kommt, ist konfigurierbar. Entweder du gibst ihn explizit mit, wie oben. Oder du schaltest Content-based Deduplication ein, dann bildet SQS ihn als SHA-256-Hash über den **Nachrichtenkörper** — ausdrücklich nicht über die Message Attributes. Wer wichtige Unterscheidungsmerkmale in Attribute auslagert und Content-based Deduplication verwendet, dedupliziert Nachrichten weg, die verschieden sein sollten.

Die `MessageGroupId` steht bewusst nicht auf der Karte, gehört aber in den Kopf, weil sie in Prüfungsfragen mit der Dedup-ID zusammengeworfen wird. Sie entscheidet über die **Reihenfolge**, nicht über Duplikate. Nachrichten derselben Group werden streng nacheinander verarbeitet; verschiedene Groups laufen parallel. Ein konstanter Wert für alle Nachrichten ergibt eine globale Reihenfolge und einen einzigen Verarbeitungsstrang. Ein Zufallswert je Nachricht ergibt maximale Parallelität und keine Reihenfolge mehr. Der brauchbare Zuschnitt liegt dazwischen und folgt der fachlichen Grenze — hier die Kundennummer, weil Buchungen *eines* Kunden geordnet sein müssen, Buchungen verschiedener Kunden nicht.

Auf der Karte steht in diesem Kasten der Begriff **exactly-once processing**. Er stammt wörtlich aus der AWS-Dokumentation. Merk ihn dir mit dem Zusatz, der auf der Karte nicht mehr hinpasste: Es ist eine Zusage über die *Queue*, nicht über deine *Datenbank*.

### Pfeil 2 — die Zustellung an den Consumer

Genau eine Nachricht verlässt die Queue. An dieser Stelle hat FIFO geliefert, was es verspricht. Duplikat 1 ist erledigt.

### Kasten — Consumer

Der Consumer empfängt die Nachricht. Damit startet der Visibility Timeout: Die Nachricht bleibt in der Queue, wird aber für andere Consumer unsichtbar. Der Default ist 30 Sekunden, der Bereich reicht von 0 Sekunden bis 12 Stunden.

Der Consumer bucht 89,00 € ab. Der Seiteneffekt ist damit in der Welt — Geld ist geflossen, eine fremde Datenbank hat einen Eintrag.

Und dann stirbt er. Speicherfehler, Deployment, ein `SIGKILL` vom Orchestrator. `DeleteMessage` wird nie aufgerufen.

**Das ist der Moment, um den es auf dieser ganzen Karte geht.** Der Seiteneffekt ist passiert, die Quittung fehlt.

### Die Schleife — Redelivery nach Visibility Timeout

Nach 30 Sekunden läuft der Timeout ab, die Nachricht wird wieder sichtbar und wird erneut zugestellt. Die AWS-Dokumentation beschreibt das nicht als Störfall, sondern als das gewollte Verhalten: So gehen Nachrichten nicht verloren, wenn ein Consumer ausfällt.

Der Rückpfeil auf der Karte ist eine bewusste Vereinfachung. Technisch wandert nichts zurück in die Queue — die Nachricht war die ganze Zeit dort und wurde nur unsichtbar gehalten.

Das Bild dazu: kein Brief, der zurückkommt, sondern ein Zettel, über dem jemand kurz die Hand hielt und sie dann wegnahm.

### Pfeil 3 — der Conditional Write

Der zweite Durchlauf beginnt, und jetzt greift die zweite Sicherung. Bevor der Consumer bucht, schreibt er den Schlüssel `PAY-991` per Conditional Write nach DynamoDB.

### Kasten — Idempotenz in DynamoDB

Im ersten Durchlauf war der Schlüssel neu, der Write ging durch, die Buchung lief. Im zweiten Durchlauf existiert er, die Bedingung ist falsch, DynamoDB lehnt ab. Der Consumer fängt den Fehler, überspringt den Seiteneffekt und ruft direkt `DeleteMessage` auf.

Die Nachricht wurde zweimal verarbeitet. Die Zahlung ist einmal passiert. **Das ist Idempotenz** — nicht „kommt nur einmal an", sondern „wirkt nur einmal".

Dass hier DynamoDB steht, ist eine Illustration. Jeder Speicher mit einem atomaren „schreibe nur, wenn nicht vorhanden" tut es, auch eine relationale Tabelle mit Unique Constraint.

### Der rote Bypass — „FIFO reicht, Rest egal"

Der Weg, den ein Team geht, das die Umstellung auf FIFO als Lösung des Problems abgehakt hat. Der X-Kreis sitzt zwischen Queue und Ergebnis, weil der Fehler nicht in der Queue liegt — die tut genau, was sie soll. Er liegt in der Schlussfolgerung.

Die verworfene Box ist Teal, nicht Rot, weil „FIFO reicht" eine Aussage über den Transport ist. Abgelehnt wird sie durch X-Kreis und Pfad, nicht durch die Füllung.

## Die entscheidende Unterscheidung

Es gibt **zwei Duplikatquellen**, und nur eine davon löst AWS für dich:

| | Duplikat 1 | Duplikat 2 |
|---|---|---|
| Entsteht wo? | vor der Queue, beim Producer | nach der Zustellung, beim Consumer |
| Auslöser | Retry nach Timeout ohne Antwort | Crash zwischen Seiteneffekt und `DeleteMessage` |
| Gegenmittel | `MessageDeduplicationId` | Idempotenz-Schlüssel im Speicher |
| Wer baut es? | SQS FIFO | du |
| Wirkt wie lange? | 5 Minuten | so lange du den Schlüssel aufhebst |
| Bei Standard-Queues? | gar nicht vorhanden | identisch nötig |

## Die ehrliche Feinheit

Hier widersprechen sich zwei offizielle AWS-Quellen, und der Widerspruch ist nicht kosmetisch.

Die **SQS FAQs** schreiben, FIFO-Queues böten exactly-once processing, und erklären das so, dass jede Nachricht einmal zugestellt wird und verfügbar bleibt, bis ein Consumer sie verarbeitet und löscht. Wörtlich gelesen klingt das nach einer Zustellgarantie.

Der **SQS Developer Guide** sagt auf der Seite zum Visibility Timeout etwas anderes — und zwar ausdrücklich für Standard- **und** FIFO-Queues: Wegen des at-least-once-Zustellmodells gibt es keine absolute Garantie, dass eine Nachricht während des Visibility Timeout nicht mehr als einmal zugestellt wird.

Nach der Quellenrangfolge gewinnt der Developer Guide des besitzenden Dienstes gegen die FAQ. Für die Prüfung heißt das: „exactly-once processing" ist der korrekte Produktbegriff für FIFO, aber er trägt keine Aussage über deinen Seiteneffekt. Wer aus ihm ableitet, der Consumer dürfe nicht-idempotent sein, hat die falsche Zeile gelesen.

Eine zweite Feinheit, kleiner, aber ebenso nützlich: Die SDK- und API-Referenz beschreibt das Fenster als **minimales** Deduplizierungsintervall von fünf Minuten, der Developer Guide schlicht als fünf Minuten. Die Zahl ist in beiden dieselbe, nur der Qualifier fehlt einmal. Prüfungsstand ist „fünf Minuten"; verlass dich im Betrieb nicht auf die Sekunde.

Wichtiger als beide ist aber die Frage, warum AWS Duplikat 2 nicht einfach auch löst. Der Grund ist keine Bequemlichkeit, sondern eine Grenze: Der Seiteneffekt passiert in einem System, das SQS nicht sieht. Zwischen „Zahlung gebucht" und „Nachricht gelöscht" liegen zwei Schreibvorgänge in zwei getrennten Systemen, und es gibt keinen Weg, sie zu einer einzigen atomaren Operation zu machen, ohne beide Systeme in dieselbe Transaktion zu zwingen. Genau deshalb ist der Idempotenz-Schlüssel dort, wo er ist: **im selben Speicher wie der Seiteneffekt.** Wer ihn in eine dritte Datenbank legt, hat das Problem nur verschoben.

Und eine dritte Feinheit, die in Betriebspostmortems auftaucht: Der Visibility Timeout lässt sich mit `ChangeMessageVisibility` verlängern, auch mitten in der Verarbeitung. Aber die Obergrenze von 12 Stunden zählt **ab dem ersten Empfang** und wird durch das Verlängern nicht zurückgesetzt. Wer länger braucht, gehört nicht in einen Consumer, sondern in einen Workflow.

## Syntax lesen — `attribute_not_exists(pk)`

Der Ausdruck ist kurz und trotzdem der Ort, an dem die meiste Verwirrung entsteht:

```
ConditionExpression: "attribute_not_exists(pk)"
                      │                    │
                      │                    └─ das Attribut, hier der Partition Key
                      └─ Funktion: wahr, wenn dieses Attribut fehlt
```

DynamoDB wertet die Bedingung **gegen genau das eine Item aus, das der Key der Anfrage bezeichnet** — nicht gegen die Tabelle. `attribute_not_exists(pk)` ist deshalb nur dann wahr, wenn es zu diesem Key noch kein Item gibt.

Daraus folgt der wichtigste Fallstrick: Die Bedingung prüft keine Eindeutigkeit über andere Attribute. Wer den Idempotenz-Schlüssel als normales Feld ablegt und nicht als Key, bekommt eine Bedingung, die immer wahr ist, und einen Schutz, der nie greift.

Der Schlüssel muss also die Order-ID selbst sein — nicht ein Zeitstempel, nicht eine UUID pro Lauf. Alles, was sich zwischen zwei Verarbeitungen desselben Ereignisses ändert, taugt nicht als Idempotenz-Schlüssel.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine verteilte Transaktion über Queue und Datenbank
- kein Lock, das den Consumer exklusiv macht — der Visibility Timeout ist keins
- keine Garantie, dass der Consumer genau einmal *läuft*
- keine Reihenfolge über die ganze Queue, sondern nur je Message Group
- keine Dead Letter Queue auf dieser Karte, obwohl sie zum Thema gehört
- kein Schutz gegen ein Duplikat, das der Producer nach sechs Minuten erneut sendet

Übrig bleibt: eine Queue, die den Eingang sauber hält, und ein Consumer, der sein eigenes Gedächtnis mitbringt.

## Wenn du dir eine Sache merkst

**FIFO verhindert Duplikate in der Queue. Idempotenz verhindert Duplikate in der Wirkung. Du brauchst beide.**

Ein längerer Visibility Timeout verschiebt die Redelivery, verhindert sie nicht. Eine Dead Letter Queue fängt Nachrichten, die zu oft scheitern, nicht solche, die zu oft gelingen. Und ein Retry mit exponential backoff macht die Sache mathematisch schlimmer, nicht besser — er erhöht die Zahl der Versuche, nicht die Sicherheit.

## Prüfungsknackpunkte

**Signalwörter:** „messages may be processed more than once", „ensure the order is only charged once", „make the consumer idempotent", „duplicate messages in the queue". Sobald in der Frage ein *Seiteneffekt* mit Geldwert oder Außenwirkung steht, ist Idempotenz die Antwort — auch wenn FIFO in den Optionen auftaucht.

**Die Falle mit dem Visibility Timeout.** Er sieht aus wie ein Lock und ist keins. Auch innerhalb des Fensters garantiert SQS nicht, dass keine zweite Zustellung passiert. Ein zu kurz gesetzter Timeout erzeugt die Redelivery zuverlässig selbst.

**Löschen vor dem Verarbeiten.** Der Umkehrfehler: Wer `DeleteMessage` vor dem Seiteneffekt aufruft, hat kein Duplikat mehr, dafür verliert er die Nachricht beim Absturz. Erst verarbeiten, dann löschen, Doppelverbrauch per Schlüssel abfangen.

**Standard-Queue mit längerem Timeout:** Löst die falsche Hälfte. Standard-Queues liefern at-least-once, weil SQS Kopien auf mehreren Servern hält und eine nicht erreichbare Kopie später erneut ausgeliefert wird. Idempotenz brauchst du hier erst recht.

**SNS FIFO statt SQS FIFO:** Dasselbe Deduplizierungsprinzip, aber ein Verteiler löst kein Verarbeitungsproblem.

**Dead Letter Queue mit `maxReceiveCount`:** Behandelt Nachrichten, die dauerhaft scheitern. Unsere Nachricht scheitert nicht — sie gelingt zu oft.

**Step Functions:** Die richtige Antwort, wenn die Frage nach einem mehrstufigen Ablauf mit Zustand fragt. Für eine einzelne Buchung hinter einer Queue ist es der teurere Weg zum selben Ziel.

**Durchsatz als Nebenfalle.** Die AWS-Feature-Seite nennt für FIFO-Queues bis zu 3.000 Nachrichten pro Sekunde mit Batching und bis zu 300 ohne. Wenn eine Frage Ordering *und* extremen Durchsatz verlangt, ist das der Punkt, an dem FIFO die falsche Wahl wird — nicht die Idempotenz.
