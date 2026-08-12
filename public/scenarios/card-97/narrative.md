---
cardNumber: 97
slug: eventbridge-scheduler-einmal-timer
title: "Millionen Einmal-Timer"
services: ["Amazon EventBridge Scheduler", "AWS Lambda", "Amazon SNS", "Amazon EventBridge"]
domains: ["D2", "D3"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html"
  - "https://docs.aws.amazon.com/scheduler/latest/UserGuide/scheduler-quotas.html"
  - "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html"
  - "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is-how-it-works-concepts.html"
  - "https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-quota.html"
  - "https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-delay-queues"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/08/amazon-eventbridge-scheduler-higher-quotas/"
---

## Die Grundidee zuerst

Stell dir eine Poststelle vor, die 400.000 Sendungen zu individuellen Terminen ausliefern soll.

**Verfahren eins:** Es gibt ein großes Heft. In jeder Zeile steht ein Empfänger und ein Zeitpunkt. Jede Minute nimmt jemand das Heft und geht es von vorn bis hinten durch: Ist Zeile 1 jetzt fällig? Nein. Zeile 2? Nein. Zeile 178.394? Nein. In den allermeisten Durchgängen findet er nichts — 1.440 Durchgänge am Tag über 400.000 Zeilen, um vielleicht zweihundert Sendungen zu finden. Und das Heft wird jeden Tag dicker, also dauert jeder Durchgang länger.

**Verfahren zwei:** Für jede Sendung gibt es einen eigenen kleinen Wecker. Du stellst ihn beim Annehmen der Sendung, gibst ihn ab und vergisst ihn. Er klingelt zu seiner Zeit von allein. Niemand liest, niemand sucht, niemand vergleicht. 400.000 Wecker sind nicht anstrengender als vier, weil keiner von ihnen den anderen kennt.

Das erste Verfahren ist eine eigene Timer-Tabelle plus ein Poller. Es funktioniert und es ist die Bastellösung, die in dieser Aufgabe abgeschafft werden soll. Das zweite ist EventBridge Scheduler.

Ein Zusatz, der beim Bild nicht mitgedacht wird: Der abgelaufene Wecker liegt danach immer noch im Regal. Wenn ihn niemand wegräumt, ist das Regal irgendwann voll — nicht mit anstehenden, sondern mit erledigten Terminen.

## Was es eigentlich ist — der One-time-Schedule

Kein Prozess, keine Tabelle, kein Poller. Ein Datensatz je Termin:

```json
{
  "Name": "erinnerung-K-4711-BK-0503",
  "ScheduleExpression": "at(2026-05-03T09:00:00)",
  "ScheduleExpressionTimezone": "Europe/Berlin",
  "ActionAfterCompletion": "DELETE",
  "FlexibleTimeWindow": { "Mode": "OFF" },
  "Target": {
    "Arn": "arn:aws:lambda:eu-central-1:1234:function:buildReminder",
    "RoleArn": "arn:aws:iam::1234:role/SchedulerInvokeRole",
    "Input": "{\"kunde\":\"K-4711\",\"buchung\":\"BK-0503\"}"
  }
}
```

Lies es Zeile für Zeile, dann steht die ganze Karte darin. Der Name ist eindeutig je Kunde und Buchung — er ist der Schlüssel, über den du den Termin später verschieben oder löschen kannst. `ScheduleExpression` sagt *wann*, `ScheduleExpressionTimezone` sagt, *in welcher Zeitrechnung*. `ActionAfterCompletion` sagt, was mit dem Datensatz nach der Ausführung passiert. `Target` sagt *wen*, `RoleArn` sagt *mit welchem Recht*, `Input` sagt *womit*.

Ein einziger `Target`-Block. Nicht drei. Das ist keine Auslassung im Beispiel, sondern eine Eigenschaft des Dienstes: **Ein Schedule hat genau ein Ziel.**

## Der Weg durch die Karte

### Buchung — der Termin entsteht beim Buchen

Kunde `K-4711` bucht am 12. April einen Termin für den 3. Mai, 9 Uhr. Im selben Moment, in dem die Buchung geschrieben wird, legt der Service den Schedule an — ein `CreateSchedule`-Aufruf, mehr nicht. Es gibt keinen Zwischenschritt, in dem ein Termin in eine eigene Tabelle wandert und darauf wartet, entdeckt zu werden.

Skaliert das? Die `CreateSchedule`-Rate liegt in den primären Regionen bei 5.000 Anfragen pro Sekunde und ist auf Zehntausende erhöhbar. Ein Buchungsdienst, der diese Grenze erreicht, hat andere Sorgen.

Und wenn `K-4711` am 20. April umbucht? Dann ist der Name des Schedules der Griff, an dem du ihn packst. `UpdateSchedule` mit demselben Namen und einem neuen `at()`-Ausdruck, oder `DeleteSchedule` bei einer Stornierung. Deshalb ist die Namenskonvention keine Kosmetik: Ein Name, der aus Kunde und Buchung zusammengesetzt ist, macht den Termin ohne zweite Zuordnungstabelle auffindbar. Ein zufällig generierter Name würde dich genau die Tabelle bauen lassen, die diese Architektur abschaffen soll.

### Scheduler — der Datensatz, der wartet

Zwischen dem 12. April und dem 3. Mai läuft nichts. Kein Container, keine Verbindung, keine Abfrage. Es existiert ein Eintrag.

Wenn du in der Konsole nachschaust, steht dort ein nächster Ausführungszeitpunkt. Das ist kein Countdown, der irgendwo tickt — das ist eine Berechnung, die beim Nachschauen stattfindet. Der Unterschied klingt akademisch und ist der ganze Grund, warum die Sache mit 400.000 Terminen genauso gut geht wie mit vieren: Es gibt nichts, das mit der Anzahl der Termine wächst außer der Anzahl der Einträge.

Die Voreinstellung liegt bei **10 Millionen Schedules je Region**, erhöhbar auf Milliarden. „Millionen individueller Einmal-Timer" aus der Aufgabenstellung ist damit ohne Quota-Antrag gedeckt — das ist die Zahl, an der diese Antwort hängt, und der Grund, warum die Alternative auf der Karte durchgestrichen ist.

Das Ziel darf fast alles sein: Scheduler erreicht mehr als 270 AWS-Dienste. Auf der Karte ist es eine Lambda, es könnte genauso eine State Machine sein.

### Lambda — die Nachricht entsteht erst zur Zielzeit

Am 3. Mai um 9 Uhr ruft Scheduler das Ziel auf, in deinem Namen, über die Execution Role. Das ist der Punkt, an dem viele IAM-Fehler entstehen: Scheduler handelt nicht mit eigener Macht, sondern nimmt die Rolle an, die im `RoleArn` steht. Fehlt dort `lambda:InvokeFunction`, passiert am 3. Mai um 9 Uhr — nichts. Kein Fehler im Buchungsdienst, kein Alarm, nur eine Nachricht, die nie ankommt.

Erst jetzt entsteht die Funktion. Wenn seit Stunden keine Erinnerung fällig war, ist sie garantiert kalt: Container hochfahren, Runtime laden, Code initialisieren. Für dieses Szenario ist das gleichgültig, weil niemand wartet — bei einer API, die einem Nutzer antwortet, wäre es ein Thema. Dann holt sie die Kundendaten und formuliert den Text.

Das ist bewusst so herum. Hättest du die fertige Nachricht schon am 12. April in den `Input` geschrieben, würde sie drei Wochen später mit einem veralteten Namen, einer veralteten Adresse und einem veralteten Preis verschickt. Der `Input` trägt Schlüssel, keine Inhalte.

### Zustellung — SNS als eigener Schritt

Der Versand ist eine eigene Box, obwohl Scheduler auch direkt an SNS senden könnte. Der Grund ist Austauschbarkeit: Heute E-Mail, morgen Push, übermorgen beides plus SMS. Solange der Kanal hinter der Lambda liegt, ändert sich am Termin-Mechanismus nichts.

Der zweite Grund ist die Ein-Ziel-Regel. Sobald aus der einen Erinnerung mehrere Dinge werden — Nachricht verschicken, Statusfeld setzen, Kennzahl hochzählen —, brauchst du eine Stelle, die auffächert. SNS mit mehreren Subscriptions ist die einfache Variante, eine State Machine die mächtigere. Was es nicht gibt, ist ein Schedule mit drei Targets.

### Aufräumen — die Governance-Ecke

Die goldene Box hängt an einem gestrichelten Pfeil, weil sie kein Ablaufschritt ist, sondern eine Konfigurationsentscheidung. Und sie ist der eigentliche Betriebsfehler dieser Architektur.

Ein One-time-Schedule zählt **auch nach seiner Ausführung** weiter gegen die Quota. Die AWS-Quota-Dokumentation sagt es in der Zeile *Number of schedules* ausdrücklich und empfiehlt im selben Atemzug die Gegenmaßnahme: `ActionAfterCompletion: DELETE`. Damit löscht Scheduler den Eintrag kurz nach der letzten Ausführung selbst.

Ohne diese Zeile läuft ein Konto mit Millionen Einmal-Terminen langsam voll — und zwar unauffällig, weil bis zum Erreichen der Grenze alles funktioniert.

### EventBridge Rule — die verworfene Box

Der rote Pfad führt zur naheliegenden falschen Antwort: für jeden Kunden eine eigene Regel auf dem Event Bus. Sie ist deshalb naheliegend, weil EventBridge Rules jahrelang *der* Weg für Zeitpläne auf AWS waren und in älteren Kursen noch immer so unterrichtet werden.

Die Box behält auf der Karte ihre Rollenfarbe — sie ist ein gültiger Transportbaustein, nur nicht für diese Aufgabe. Drei Gründe stehen in der Tabelle darunter: die Anzahl, die fehlende Einmal-Auslösung und die Bindung an einen Event Bus. Der erste allein genügt: 300 Regeln je Bus gegen „Millionen von Kunden" ist kein Feinjustierungsproblem, sondern eine Größenordnung daneben.

Bemerkenswert ist, wie deutlich AWS selbst geworden ist. Die Seite zum Anlegen einer Scheduled Rule beginnt mit dem Hinweis, dass es sich um ein Legacy-Feature handelt, und empfiehlt Scheduler ausdrücklich für genau diesen Zweck.

## Die entscheidende Unterscheidung

Beide können Zeitpläne. Sie sind trotzdem nicht austauschbar:

| | EventBridge Scheduler | Scheduled Rule (Legacy) |
|---|---|---|
| Anzahl je Region | 10 Mio. Schedules, erhöhbar auf Milliarden | 300 Rules je Event Bus, erhöhbar |
| Einmal-Termin | `at(...)` als eigener Typ | nicht vorgesehen |
| Event Bus nötig | nein | ja, und nur der Default-Bus |
| Zeitzone und Sommerzeit | ja, IANA-Datenbank | UTC |
| Ziele | ein Ziel je Schedule, über 270 Dienste | bis zu fünf Ziele je Regel |
| Retry-Policy und DLQ | je Schedule konfigurierbar | nicht je Regel |
| AWS-Empfehlung | „We recommend that you use Scheduler" | als Legacy-Feature gekennzeichnet |

Die Zeile mit den 300 ist die tödliche. Bei einer Regel je Kunde ist bei 300 Kunden Schluss — nicht bei Millionen.

## Die ehrliche Feinheit

**„9 Uhr" heißt: irgendwann zwischen 9:00:00 und 9:00:59.** Alle Schedule-Typen rufen ihr Ziel mit 60 Sekunden Präzision auf. Für eine Terminerinnerung ist das gleichgültig. Für ein Auktionsende, eine Ticketfreigabe oder eine Frist, an der ein Vertrag hängt, ist es das nicht — und es steht nicht in der Aufgabenstellung, sondern in einer Notiz der Dokumentation.

**Die zweite Zahl, die niemand einplant, ist der Durchsatz beim Auslösen.** Das Invocations-Limit liegt in den primären Regionen bei 1.000 Transaktionen pro Sekunde, in den übrigen bei 500, und ist erhöhbar. Entscheidend ist, was beim Überschreiten passiert: Die Aufrufe werden **gedrosselt, nicht verworfen** — sie finden statt, aber verzögert. Wenn 50.000 Erinnerungen alle auf 9:00 fallen, bekommen die letzten Kunden ihre Nachricht nicht um 9:00. Das Gegenmittel ist das `FlexibleTimeWindow`, das AWS die Ausführung über ein Fenster verteilen lässt — es kostet dich die Punktgenauigkeit, die du im vorigen Absatz gerade schätzen gelernt hast. Beides gleichzeitig gibt es nicht.

**Warum `ActionAfterCompletion` und nicht ein nächtlicher Aufräumjob?** Weil Aufräumen bedeutet, erst einmal zu finden, was aufzuräumen ist — und `ListSchedules` ist auf 50 Anfragen pro Sekunde begrenzt, während `CreateSchedule` bei 5.000 liegt. Du kannst also deutlich schneller Termine anlegen, als du sie auflisten kannst. Ein Aufräumjob, der über Listen läuft, kommt bei Millionen Einträgen strukturell nicht hinterher. Die Einstellung am Datensatz umgeht das Problem, statt es zu lösen.

**Sommerzeit, wenn du recurring statt one-time nimmst.** Springt die Uhr im Frühjahr vor und fällt der Zeitpunkt in die übersprungene Stunde, wird der Lauf ausgelassen. Fällt die Uhr im Herbst zurück, läuft er nur einmal, nicht zweimal. Für `at()`-Schedules mit Zielzeitpunkt ist das gegenstandslos — aber es ist die Frage, die direkt danach kommt.

**Und ein Quellenkonflikt, der keiner ist.** Ein AWS-Compute-Blog nennt bis heute eine Million Schedules je Konto. Das ist kein Widerspruch zwischen zwei gültigen Quellen, sondern ein Beitrag von vor der Anhebung: Ein AWS-Announcement vom 21. August 2024 dokumentiert die Erhöhung auf 10 Millionen. Bei Statusangaben schlägt das jüngere Dokument das ältere, auch wenn beide von AWS sind — Datum prüfen, bevor du eine Zahl übernimmst.

## Syntax lesen — `at(2026-05-03T09:00:00)`

```
at( 2026 - 05 - 03 T 09 : 00 : 00 )
    │      │    │     │    │    │
    │      │    │     │    │    └─ Sekunde
    │      │    │     │    └─ Minute
    │      │    │     └─ Stunde
    │      │    └─ Tag
    │      └─ Monat
    └─ Jahr
```

Drei Dinge stecken in dieser einen Zeile.

**Es steht keine Zeitzone drin.** Das `T` trennt Datum und Uhrzeit, mehr nicht. Ohne das separate Feld `ScheduleExpressionTimezone` wird der Ausdruck in UTC ausgewertet — der Kunde bekommt seine 9-Uhr-Erinnerung im Sommer um 11 Uhr.

**Es gibt keine Wiederholung.** Kein Wochentag, kein Sternchen, kein Fragezeichen wie bei `cron`. Genau dadurch unterscheidet sich `at()` von `cron()` und `rate()`.

**`StartDate` und `EndDate` werden ignoriert.** Setzt du sie trotzdem, lehnt der Dienst sie nicht ab — er beachtet sie einfach nicht. Ein stiller Fehler, der sich erst beim Ausbleiben der Auslösung zeigt.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung nicht existiert:

- keine eigene Timer-Tabelle mit einem Index auf die Fälligkeit
- keinen Poller, der jede Minute nachsieht, und keine Lambda, die ihn antreibt
- keinen Cron-Server, kein Betriebssystem, keine Crontab
- keine Zeitzonenbibliothek und keine Sonderbehandlung für die Zeitumstellung
- keinen Sperrmechanismus, damit zwei Poller nicht denselben Termin greifen
- keinen Aufräumjob für erledigte Einträge

Übrig bleiben ein JSON-Datensatz je Termin, eine IAM-Rolle und eine Funktion, die zur Zielzeit eine Sekunde lang lebt.

Der Sperrmechanismus verdient dabei einen eigenen Gedanken, weil er in der Bastellösung die unangenehmste Stelle ist: Zwei Poller-Instanzen, die dieselbe Tabelle lesen, greifen ohne Sperre denselben fälligen Termin — und der Kunde bekommt zwei Erinnerungen. Hier stellt sich die Frage nicht, weil kein Poller existiert.

## Wenn du dir eine Sache merkst

**Ein Zeitpunkt und ein Ziel führen zu EventBridge Scheduler; mehrere Schritte führen zu Step Functions, das der Scheduler dann auslöst.**

SQS Delay Queues und Message Timer verzögern eine Nachricht um höchstens 15 Minuten — die SQS-Dokumentation verweist für alles darüber selbst auf EventBridge Scheduler. DynamoDB TTL löscht abgelaufene Einträge typischerweise innerhalb weniger Tage nach ihrem Ablaufzeitpunkt, ohne Zeitgarantie. Und ein Step Functions Wait State kann lange warten, kostet aber eine laufende Ausführung je Termin.

## Prüfungsknackpunkte

**Signalwörter:** „Millionen individueller Erinnerungen", „einmaliger Zeitpunkt in der Zukunft", „ohne eigene Scheduling-Tabelle", „Zeitzone und Sommerzeit". Individueller Zeitpunkt plus serverlos ist Scheduler.

**Die Vermischungsfalle.** Scheduler und EventBridge Rules in einer Antwort zusammenzuwerfen ist der häufigste Fehler. Der Scheduler braucht keinen Event Bus, die Rule schon — und Scheduled Rules gehen nur auf dem Default-Bus.

**Die Ein-Ziel-Falle.** Wer nach dem Termin mehrere Dinge tun will, braucht ein Ziel, das auffächert: SNS mit mehreren Subscriptions oder eine State Machine. Nicht mehrere Targets am Schedule.

**Die Quota-Falle.** Erledigte Einmal-Schedules zählen mit. Eine Architektur ohne `ActionAfterCompletion` läuft Monate gut und fällt dann aus — und der Ausfall zeigt sich nicht als Fehler im Erinnerungsversand, sondern als abgelehnter `CreateSchedule`-Aufruf im Buchungsvorgang. Die Buchung scheitert, nicht die Erinnerung. Wer den Fehler dort sucht, wo die Nachricht ausbleibt, sucht am falschen Ende.

**A — SQS Delay Queue:** 15 Minuten Maximum. Für einen Termin in drei Wochen untauglich.

**B — DynamoDB TTL als Auslöser:** löscht irgendwann nach Ablauf, ohne Zeitgarantie. Als Erinnerungsmechanismus unbrauchbar, auch wenn das Muster über TTL-Streams verbreitet ist.

**D — EventBridge Rule je Kunde:** scheitert bei 300 Regeln je Event Bus und kennt keine Einmal-Auslösung zu einem festen Zeitpunkt.

**E — Step Functions Wait State je Termin:** funktioniert technisch, hält aber Millionen Ausführungen offen und ist der teurere Weg.
