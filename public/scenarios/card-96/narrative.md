---
cardNumber: 96
slug: step-functions-express-gegen-standard
title: "Express oder Standard"
services: ["AWS Step Functions", "Amazon CloudWatch Logs"]
domains: ["D2", "D4"]
correctAnswer: "C"
badgeCount: 0
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/step-functions/latest/dg/choosing-workflow-type.html"
  - "https://docs.aws.amazon.com/step-functions/latest/dg/express-at-least-once-execution.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/serverless-applications-lens/aws-step-functions.html"
  - "https://docs.aws.amazon.com/step-functions/latest/apireference/API_StartSyncExecution.html"
---

## Die Grundidee zuerst

Stell dir vor, du beauftragst einen Kurierdienst — und hast die Wahl zwischen zwei Verträgen.

**Vertrag A.** Du zahlst pro zugestelltem Paket. Der Fahrer quittiert jede einzelne Übergabe, und die Quittungen liegen ein Vierteljahr lang im Ordner; du kannst jederzeit nachschlagen, wer wann was bekommen hat. Wenn beim Empfänger niemand öffnet, wartet er — notfalls monatelang, bis die Unterschrift da ist. Und jedes Paket geht genau einmal raus. Kein Paket kommt zweimal an.

**Vertrag B.** Du zahlst nach Fahrzeit und Fahrzeuggröße, nicht nach Paketen. Der Fahrer ist nach fünf Minuten zurück, egal wie weit er gekommen ist. Er führt kein Buch: Willst du wissen, wo er war, musst du vorher selbst eine Kamera montiert und eingeschaltet haben. Und wenn er sich nicht sicher ist, ob die Übergabe geklappt hat, fährt er lieber noch einmal — es könnte ja sein, dass das Paket nicht angekommen ist.

Das ist der ganze Unterschied zwischen Standard und Express Workflows. Und der Satz, der beide Verträge zusammenhält, steht ganz oben in der AWS-Dokumentation, hervorgehoben in einem eigenen Kasten:

**Der Workflow-Typ lässt sich nach dem Anlegen der State Machine nicht mehr ändern.**

Du unterschreibst einmal. Danach bleibt der Vertrag, was er ist.

Das klingt nach einer Randnotiz und ist es nicht. Eine falsch gewählte Instanzgröße korrigierst du mit einem Neustart, eine falsch gewählte Speicherklasse mit einer Lifecycle-Regel. Einen falsch gewählten Workflow-Typ korrigierst du, indem du eine zweite State Machine anlegst, alle Aufrufer umbiegst und die alte abräumst. Deshalb steht diese Entscheidung auf einer eigenen Karte.

## Was es eigentlich ist — ein Feld beim Anlegen

Es gibt keine zwei Dienste, keine zwei Sprachen, keine zwei Konsolen. Es gibt ein Feld:

```bash
aws stepfunctions create-state-machine \
  --name klickstrom-anreicherung \
  --type EXPRESS \
  --role-arn arn:aws:iam::1234:role/SfnRole \
  --logging-configuration '{
      "level": "ALL",
      "includeExecutionData": true,
      "destinations": [{ "cloudWatchLogsLogGroup": {
        "logGroupArn": "arn:aws:logs:eu-central-1:1234:log-group:/sfn/klick:*" }}]
    }' \
  --definition file://workflow.asl.json
```

Lies das von oben nach unten. Der Name ist beliebig, die Rolle wie immer. Dann `--type EXPRESS` — ein Wort, das mehr entscheidet als alles andere in diesem Aufruf. Und dann ein `--logging-configuration`-Block, der bei Standard optional ist und bei Express faktisch Pflicht: Ohne ihn hast du keinerlei Nachweis, dass irgendetwas gelaufen ist.

Die Datei `workflow.asl.json` bleibt unverändert. **Die Amazon States Language ist für beide Typen dieselbe.** Dieselben States, dieselbe Retry-Syntax, derselbe Catch. Der Unterschied steckt nicht im Ablauf, sondern in der Maschine darunter — und das ist der Grund, warum man ihn beim Lesen einer Definition nicht sieht.

## Der Weg durch die Karte

Die Karte hat keine Ablaufpfeile und keine nummerierten Badges, weil es hier nichts zu durchlaufen gibt. Sie ist eine Matrix: links die Eigenschaft, in der Mitte Standard, rechts Express. Fünf Zeilen sind Eigenschaften, die sechste ist ein Anwendungsfall.

### Maximale Laufzeit — ein Jahr gegen fünf Minuten

Standard läuft bis zu einem Jahr. Express bricht nach fünf Minuten ab. Nicht „wird langsam", nicht „warnt" — die Ausführung endet.

Das ist die Dimension, die in Prüfungsfragen am häufigsten den Ausschlag gibt, weil sie hart und leicht prüfbar ist. Steht in der Aufgabe irgendetwas, das auf einen Menschen wartet — eine Freigabe, eine Unterschrift, eine Prüfung durch die Fachabteilung —, ist Express raus. Ein Jahr ist keine Zahl für Rechenzeit, sondern eine Zahl für Wartezeit.

### Ausführungssemantik — die Zeile, die die Karte trägt

Standard folgt einem *exactly-once*-Modell: Tasks und States laufen nie mehr als einmal, es sei denn, du hast in der ASL selbst ein `Retry` definiert. Genau deshalb eignet sich Standard für **nicht-idempotente** Aktionen — die AWS-Dokumentation nennt als Beispiele das Starten eines EMR-Clusters und das Verarbeiten von Zahlungen.

Express ist zweigeteilt, und das ist die Stelle, an der die verbreitete Merkformel bröckelt. **Asynchrone** Express Workflows sind *at-least-once*: Eine Ausführung kann mehrfach laufen. **Synchrone** Express Workflows sind *at-most-once*: Sie können auch **gar nicht** durchlaufen — tritt eine Ausnahme auf, startet der Workflow nicht neu.

Wer „Express ist at-least-once" auswendig gelernt hat, kennt die Hälfte.

### Abrechnung — Schritte gegen Zeit

Standard zählt State Transitions. Eine State Transition wird jedes Mal gezählt, wenn ein Schritt deiner Ausführung fertig ist. Ein Workflow mit vierzig States kostet vierzig Zähleinheiten, egal ob er zwei Sekunden oder zwei Tage lief.

Express rechnet nach drei Faktoren ab: Anzahl der Ausführungen, Gesamtdauer und verbrauchter Speicher. Die Schrittzahl ist irrelevant. Ein Workflow mit vierzig States, der in 200 Millisekunden fertig ist, kostet dasselbe wie einer mit vier States in derselben Zeit.

Rechne es einmal in Zähleinheiten durch, ohne Preise. Die Klickstrom-Anreicherung läuft 20 Millionen Mal am Tag, jeder Lauf hat zwölf States und dauert 180 Millisekunden. Als Standard Workflow sind das 240 Millionen State Transitions pro Tag. Als Express Workflow sind es 20 Millionen Ausführungen mal 180 Millisekunden mal die zugewiesene Speichergröße — und die zwölf Schritte tauchen in der Rechnung überhaupt nicht auf.

Dreh das Beispiel um: Die Zahlungsfreigabe läuft 400 Mal am Tag, hat sechs States und wartet im Schnitt neun Stunden auf eine Unterschrift. Standard zählt 2.400 State Transitions. Express würde die neun Stunden gar nicht überstehen — und wenn es sie überstünde, würde es sie bezahlen.

Daraus folgt der Kostenfall der Karte: Bei sehr vielen, sehr kurzen Läufen mit vielen Schritten gewinnt Express deutlich. Bei wenigen, langen Läufen mit wenigen Schritten gewinnt Standard.

### Ausführungshistorie — Ordner gegen Kamera

Standard-Ausführungen lassen sich über die Step-Functions-API auflisten und beschreiben und in der Konsole visuell debuggen — der Graph mit den grünen und roten Kästen, an dem man einen Fehler in dreißig Sekunden findet. Die Historie ist bis zu 90 Tage nach Abschluss der Ausführung verfügbar.

Express erfasst im Dienst selbst **keine** Historie. Logging muss über CloudWatch Logs aktiviert sein, sonst ist der Lauf im Nachhinein nicht nachvollziehbar. Die Doku formuliert es als unbegrenzte Historie — was hier bedeutet: so viele Einträge, wie du in fünf Minuten erzeugen kannst, und nur dort, wo du sie hingeschrieben hast.

Der praktische Unterschied zeigt sich am Dienstagmorgen. Bei Standard bekommst du die Meldung „Zahlungslauf `PAY-991` von gestern Abend ist hängengeblieben", öffnest die Ausführung in der Konsole, siehst den roten Kasten und daneben die Eingabe, mit der der State aufgerufen wurde. Bei Express bekommst du dieselbe Meldung — und dann hängt alles davon ab, ob vor Wochen jemand `includeExecutionData: true` gesetzt hat. Wenn nicht, weißt du, dass etwas fehlschlug, aber nicht womit es aufgerufen wurde.

Wer eine Karte mit „Audit-Trail über jeden Schritt" liest, hat damit die Antwort.

### Integrationsmuster — was Express fehlt

Express unterstützt alle Service-Integrationen, aber nicht alle **Muster**. Diese Unterscheidung ist präzise und wird oft verkürzt: Du kannst aus Express heraus ECS ansprechen. Du kannst nur nicht darauf warten.

Konkret fehlen:

- das Job-run-Muster `.sync`, das den State offen hält, bis eine fremde Aufgabe fertig ist
- das Callback-Muster `.waitForTaskToken`, bei dem ein externer Vorgang ein Token zurückgibt — der Mechanismus hinter jeder menschlichen Freigabe
- Distributed Map, also die parallelisierte Verarbeitung sehr großer Datenmengen mit eigenen Kindausführungen
- Activities, also selbstbetriebene Worker, die sich Arbeit abholen und Ergebnisse zurückmelden

Jedes einzelne davon ist ein Warte-Mechanismus. Der Fünf-Minuten-Deckel und diese Liste sind dieselbe Aussage aus zwei Richtungen — und beide gehen auf denselben Grund zurück: Es gibt nichts, worin der Wartezustand gespeichert werden könnte.

### Zahlungslauf steuern — die Zeile mit dem X-Kreis

Die letzte Matrixzeile ist keine Eigenschaft, sondern der Anwendungsfall. Sie steht bewusst in derselben Matrix, weil die Entscheidung erst am konkreten Workload sichtbar wird.

Zahlungslauf `PAY-991` bucht 89 € vom Konto ab. Bei exactly-once wird genau einmal gebucht. Bei at-least-once kann derselbe Lauf mehrfach durchgehen — und ohne Idempotenzschlüssel im Buchungssystem sind das zweimal 89 €. Deshalb der rote Pfad und der X-Kreis nach rechts.

Beachte, was hier **nicht** der Ablehnungsgrund ist: Der Zahlungslauf ist nicht zu lang für Express und hat auch nicht zu viele Schritte. Er scheitert allein an der Semantik. Das ist wichtig, weil Prüfungsfragen die Laufzeit gern als bequemes Ausschlusskriterium anbieten. Ein Workload kann in fünf Minuten fertig sein und trotzdem Standard brauchen.

## Die entscheidende Unterscheidung

Nicht zwei Typen, sondern drei Semantiken:

| | Standard | Express asynchron | Express synchron |
|---|---|---|---|
| Garantie | exactly-once | at-least-once | at-most-once |
| Zustand zwischen State Transitions | wird intern persistiert | wird nicht persistiert | wird nicht persistiert |
| Gleicher Ausführungsname | idempotente Antwort, kein zweiter Lauf | zweiter Lauf startet parallel | zweiter Lauf startet parallel |
| Historie | 90 Tage im Dienst | nur CloudWatch Logs | nur CloudWatch Logs |
| Ergebnis kommt | asynchron, per API abrufbar | nur Startbestätigung | direkt als Rückgabewert |

## Die ehrliche Feinheit

**Die Ursache steht in der zweiten Zeile der Tabelle, nicht in der ersten.** Standard persistiert den Ausführungszustand zwischen den State Transitions — deshalb kann es exactly-once garantieren, deshalb kann es ein Jahr warten, deshalb gibt es eine Historie und deshalb wird nach Schritten abgerechnet. Express persistiert nichts. Alles andere folgt daraus. Wer sich diesen einen Satz merkt, muss die Tabelle nicht auswendig lernen.

**Exactly-once hat ein Sternchen, und es steht im selben Satz.** Die Doku schreibt: Tasks und States laufen nie mehr als einmal — *es sei denn, du hast in der ASL ein `Retry` definiert*. Das ist kein Kleingedrucktes, sondern der Normalfall: Fast jede produktive Definition hat ein `Retry` auf transiente Fehler. Die Garantie besagt also nicht, dass dein Lambda-Code garantiert einmal ausgeführt wird. Sie besagt, dass Step Functions von sich aus nicht wiederholt. Idempotenz im Task bleibt deine Aufgabe, sobald du selbst ein `Retry` hinschreibst — und die Prüfungsantwort „Standard, also brauche ich keinen Idempotenzschlüssel" ist in dieser Schärfe falsch.

**At-most-once heißt nicht „sicherer als at-least-once".** Es heißt: höchstens einmal, möglicherweise keinmal. Für eine Buchung ist „gar nicht gebucht" genauso falsch wie „doppelt gebucht" — nur fällt es später auf.

**Die 90 Tage sind nach unten verhandelbar, nicht nach oben.** Wer aus Compliance-Gründen kürzer aufbewahren muss, kann die Aufbewahrung auf 30 Tage reduzieren — allerdings per Support-Fall im AWS Support Center, nicht per Häkchen in der Konsole.

**Ein Konsolenartefakt, das für ein Produktlimit gehalten wird:** Startest du einen synchronen Express Workflow aus der Konsole, läuft der `StartSyncExecution`-Aufruf nach 60 Sekunden ab. Über SDK oder CLI stehen die vollen fünf Minuten zur Verfügung. „Synchrone Express Workflows können nur eine Minute" ist damit falsch — und trotzdem eine verbreitete Erfahrung.

**Und eine Zahl, die bewusst fehlt.** Kurse und Blogposts nennen gern 2.000 Ausführungen pro Sekunde für Standard und 100.000 für Express. Die AWS-Vergleichstabelle nennt an dieser Stelle **keine** Zahl, sondern verweist auf die Service Quotas; für Express steht bei der State-Transition-Rate schlicht „kein Limit". Eine Zahl, die nur aus Drittquellen kommt, gehört nicht auf die Karte — auch wenn sie überall steht.

## Syntax lesen — die Endung an der Resource-ARN

Ob ein Task wartet, steht nicht im State-Namen, sondern hinten an der ARN:

```
"Resource": "arn:aws:states:::ecs:runTask.sync"
                              │      │       │
                              │      │       └─ Muster: warte auf Abschluss
                              │      └─ API-Aktion
                              └─ Zieldienst
```

Drei Endungen sind zu unterscheiden:

- **ohne Suffix** — Request-Response. Aufrufen, Antwort entgegennehmen, weiter. Läuft in beiden Typen.
- **`.sync`** — Job-run. Der State bleibt offen, bis der ECS-Task, der Batch-Job oder die Glue-Ausführung fertig ist. **Nur Standard.**
- **`.waitForTaskToken`** — Callback. Der State bleibt offen, bis jemand `SendTaskSuccess` mit dem Token aufruft. Das ist der Mechanismus hinter jeder menschlichen Freigabe. **Nur Standard.**

Diese sieben beziehungsweise achtzehn Zeichen sind der Unterschied zwischen einer Definition, die in Express läuft, und einer, die es nie tun wird.

## Was du dadurch nicht baust

Entscheidest du dich für Express, existiert Folgendes nicht mehr:

- kein visuelles Debugging einer abgeschlossenen Ausführung in der Konsole ohne Logging
- kein Warten auf einen ECS-Task, einen Glue-Job oder einen Menschen
- kein Task Token, das ein Fremdsystem zurückgeben könnte
- keine Distributed Map über eine große S3-Inventarliste
- keine Activities, also keine selbstbetriebenen Worker, die Arbeit abholen
- keine automatische Idempotenz über den Ausführungsnamen

Entscheidest du dich für Standard, verschwindet dafür das Kostenmodell, das hochfrequente Kurzläufe billig macht.

## Wenn du dir eine Sache merkst

**Standard merkt sich den Zustand zwischen den Schritten, Express nicht — daraus folgen Laufzeit, Garantie, Historie und Preis.**

Eine direkte Lambda-Verkettung braucht für zwei oder drei Schritte ohne Fehlerbehandlung gar keine State Machine. SQS puffert Nachrichten, orchestriert aber nichts. Und wenn ein langlaufender Prozess einen hochfrequenten Teilschritt enthält, musst du dich nicht entscheiden: Ein Standard Workflow kann Express Workflows als Kindausführungen starten — Wartezeiten und Callbacks bleiben im Elternteil, die Massenverarbeitung wandert nach unten.

## Prüfungsknackpunkte

**Signalwörter für Express:** „high-volume", „short-duration", „idempotent", „Klickstrom", „IoT-Ingest", „Millionen kurzer Läufe", „Kosten pro Ausführung senken".

**Signalwörter für Standard:** „exactly-once", „human approval", „Audit-Trail über jeden Schritt", „langlaufend", „Zahlung", „Bestandsbuchung", „nicht-idempotent".

**Die Kostenfalle.** „Express ist billiger" gilt nicht pauschal. Bei wenigen, langen Ausführungen mit viel zugewiesenem Speicher kann das Dauer-und-Speicher-Modell teurer sein als das Zählen weniger State Transitions. Die Frage ist nie „welcher Typ ist billiger", sondern „welches Kostenmodell passt zu diesem Lastprofil".

**Die Umstellungsfalle.** Eine Aufgabe, in der ein bestehender Express Workflow nachträglich eine Freigabe durch einen Menschen bekommen soll, hat keine Antwort, die „Typ ändern" heißt. Der Typ ist unveränderlich — die Antwort ist eine neue State Machine.

**A — den Typ auf Standard umstellen:** existiert nicht als Operation.

**B — Express mit längerem Timeout konfigurieren:** die fünf Minuten sind eine Diensteigenschaft, kein einstellbarer Wert.

**D — Express plus Idempotenzschlüssel im Zahlungssystem:** technisch tragfähig, aber es löst die Laufzeit und die fehlende Auditierbarkeit nicht.

**E — Standard für alles:** funktioniert überall, verschenkt aber bei Millionen kurzer Läufe genau die Kostenersparnis, nach der die Aufgabe fragt.
