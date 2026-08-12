---
cardNumber: 88
slug: fis-chaos-engineering-az-ausfall
title: "Chaos Engineering mit FIS"
services: ["AWS Fault Injection Service", "Amazon CloudWatch", "Amazon EC2", "Amazon EBS", "Amazon RDS", "Amazon ElastiCache", "AWS IAM"]
domains: ["D2"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/fis/latest/userguide/az-availability-scenario.html"
  - "https://docs.aws.amazon.com/fis/latest/userguide/scenario-library-scenarios.html"
  - "https://docs.aws.amazon.com/fis/latest/userguide/experiment-templates.html"
  - "https://docs.aws.amazon.com/fis/latest/userguide/stop-conditions.html"
  - "https://docs.aws.amazon.com/fis/latest/APIReference/API_CreateExperimentTemplate.html"
  - "https://aws.amazon.com/fis/pricing/"
  - "https://aws.amazon.com/blogs/aws/use-aws-fault-injection-service-to-demonstrate-multi-region-and-multi-az-application-resilience/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/09/aws-fault-injection-service-additional-safety-control/"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/initiate-a-spot-instance-interruption.html"
---

## Die Grundidee zuerst

Zwei Arten, sicher zu sein, dass ein Gebäude im Brandfall funktioniert.

**Weg eins:** Du baust zwei Fluchttreppen statt einer. Du hängst Schilder auf, schreibst einen Evakuierungsplan und heftest ihn ab. Auf dem Papier ist das Haus jetzt redundant. Ob die Tür zur zweiten Treppe klemmt, ob jemand davor Kartons gestapelt hat, ob die Notbeleuchtung im zweiten Stock noch angeschlossen ist — weiß niemand. Die Treppe wurde nie benutzt.

**Weg zwei:** An einem Dienstag um 10:15 drückt jemand den Alarm. Angekündigt, mit einem Verantwortlichen an der Tür und einem Zeitnehmer im Hof. Alle gehen raus. Und dabei stellt sich heraus: Die zweite Tür klemmt tatsächlich, die Liste an der Pinnwand ist zwei Jahre alt, und zwei Leute wussten gar nicht, dass es eine zweite Treppe gibt.

Weg eins ist alles, was auf den Karten 81 bis 84 steht: zwei Availability Zones, Auto Scaling, RDS Multi-AZ, Health Checks. Weg zwei ist diese Karte.

**AWS Fault Injection Service baut keine Resilienz. Er beweist sie.** Das ist keine Wortklauberei, sondern die Trennlinie, an der die Prüfungsfragen hängen: Wenn ein Szenario nach *mehr* Ausfallsicherheit fragt, ist FIS nie die Antwort. Wenn es nach dem *Nachweis* fragt, dass das Vorhandene funktioniert, ist es fast immer die Antwort.

Und der Unterschied zwischen einer Übung und einem selbstverschuldeten Schaden ist genau eine Sache: dass jemand die Hand am Abbruchschalter hat.

## Was es eigentlich ist — ein Bauplan mit Abbruchleine

Ein FIS-Experiment ist kein Skript und kein Werkzeug, das du startest. Es ist ein Datensatz mit vier tragenden Feldern:

```json
{
  "description": "AZ power interruption, eu-central-1a",
  "targets": { },
  "actions": { },
  "stopConditions": [
    {
      "source": "aws:cloudwatch:alarm",
      "value": "arn:aws:cloudwatch:eu-central-1:123456789012:alarm:checkout-5xx-hoch"
    }
  ],
  "roleArn": "arn:aws:iam::123456789012:role/AllowFISActions"
}
```

Lies es von unten nach oben, dann ergibt es die Reihenfolge der Karte. `roleArn` ist die Erlaubnis: FIS handelt nicht mit eigener Macht, sondern in deinem Namen — ohne diese Rolle darf der Dienst deine Instanzen nicht anfassen. `stopConditions` ist die Abbruchleine und immer ein CloudWatch-Alarm. `actions` ist, was passiert. `targets` ist, womit es passiert.

Zwei Dinge daran sind prüfungsrelevant und beide stehen in der API-Referenz.

Erstens: `stopConditions` ist ein **Pflichtfeld**. Du kommst an dieser Entscheidung nicht vorbei.

Zweitens — und das ist der Haken, den die Karte nicht zeigt: Es gibt einen legalen Wert für „keine Abbruchleine".

```json
{ "stopConditions": [ { "source": "none" } ] }
```

Das Feld ist Pflicht, der Schutz ist es nicht. Ein Experiment mit `none` ist kein Fehler und keine Warnung — es ist eine gültige Konfiguration, die AWS akzeptiert. Der verworfene Pfad dieser Karte ist also keine Nachlässigkeit, für die es eine Fehlermeldung gäbe. Er ist eine Zeile, die jemand bewusst so geschrieben hat.

## Der Weg durch die Karte

### Kasten — Steady State

Vor dem Experiment steht kein Werkzeug, sondern eine Zahl. Welche Fehlerrate, welche Latenz, welcher Durchsatz gilt als „gesund"?

Chaos Engineering beginnt mit einer Hypothese, nicht mit einem Knopfdruck. Die Hypothese hat eine Form: „Bei 20 Anfragen pro Sekunde bleibt die p90-Latenz unter 3 Sekunden, auch wenn eine AZ ausfällt, und der Verkehr verlagert sich in die andere Zone."

Ohne diesen Satz ist das Experiment nicht auswertbar. Nach 30 Minuten Störung wirst du sonst in einem Dashboard stehen, in dem sich Kurven bewegen, und niemand kann sagen, ob das gut oder schlecht ist. **Der Steady State ist gleichzeitig die Messlatte und der Rohstoff für die Abbruchbedingung** — der CloudWatch-Alarm, der das Experiment stoppt, wird aus derselben Metrik gebaut.

Ein Detail, an dem viele Teams scheitern: Der Steady State ist eine *fachliche* Größe, keine Infrastrukturmetrik. „Alle Instanzen healthy" ist kein Steady State — während eines AZ-Ausfalls sind per Definition nicht alle Instanzen healthy, und trotzdem kann die Anwendung tadellos funktionieren. Brauchbar sind Größen, die der Nutzer spürt: Bestellungen pro Minute, Fehlerquote an der API, Ladezeit der Startseite.

Deshalb ist der Kasten blau: Er ist die Quelle, nicht der erste Schritt.

### Badge 1 — das Experiment Template

Jetzt der Bauplan. AWS nennt vier Bestandteile: **Actions** (was passiert), **Targets** (womit), **Stop Conditions** (wann abgebrochen wird) und die **Experiment Role** (mit welchem Recht). Dazu kommen optional Logging, Report-Konfiguration und Experiment-Optionen.

Targets werden nicht einzeln aufgezählt, sondern beschrieben: über ARNs oder — der übliche Weg — über Resource Tags plus einen Auswahlmodus. Das ist der Blast-Radius-Regler. Wer `COUNT(3)` schreibt, trifft drei zufällige passende Ressourcen; wer `ALL` schreibt, trifft alle.

Seit März 2024 gibt es dafür eine Vorschau: FIS führt ein Experiment aus, das alle Actions überspringt, und zeigt dir die ARNs, die getroffen worden wären. Das ist der Probelauf ohne Schaden — und es ist der Schritt, den man vor dem ersten echten Lauf in Produktion nimmt.

Zwei weitere Eigenschaften des Templates lohnen sich zu kennen, weil sie erklären, wie aus einer einmaligen Übung eine Routine wird. Erstens lassen sich Experimente planen, einmalig oder wiederkehrend, ohne dass man dafür eine eigene Infrastruktur betreibt — die Feuerübung im Quartalsrhythmus ist damit eine Einstellung, kein Kalendereintrag. Zweitens kann ein Experiment aus einem Orchestrator-Konto heraus Ressourcen in anderen Konten treffen; für eine Landing Zone mit Workload-Konten ist das der Normalfall und nicht die Ausnahme.

Die IAM-Rolle steht auf der Karte nur als Textzeile im Template-Kasten. Sie verdient mehr Aufmerksamkeit, als diese Zeile hergibt: Sie ist gleichzeitig die Erlaubnis und die Begrenzung. Was in der Rolle nicht erlaubt ist, kann ein Experiment auch dann nicht anrichten, wenn es im Template steht.

### Badge 2 — das Szenario läuft

Aus der Scenario Library kommt „AZ Availability: Power Interruption", ein von AWS gepflegtes Szenario. Es erzeugt nicht *einen* Fehler, sondern das Symptombild eines kompletten Stromausfalls in einer Zone:

- zonale Compute-Kapazität fällt weg — EC2, und darüber EKS-Pods und ECS-Tasks
- in der betroffenen AZ wird nicht nachskaliert
- die Subnet-Konnektivität bricht weg
- EBS-Volumes reagieren nicht mehr
- RDS und ElastiCache schwenken auf die andere Zone
- der Zugriff auf S3-Express-One-Zone-Directory-Buckets ist beeinträchtigt

**Der Standardablauf injiziert 30 Minuten lang die Ausfallsymptome und danach 30 Minuten lang die Symptome der Wiederherstellungsphase.** Die zweite halbe Stunde ist der Teil, den selbstgebaute Tests fast immer weglassen — und sie ist oft die interessantere: Ein System, das den Ausfall übersteht, kann trotzdem daran scheitern, dass alles gleichzeitig zurückkommt.

Ausgewählt wird über Tags. Voreingestellt ist der Tag-Schlüssel `AzImpairmentPower`; die EC2-Aktion sucht den Wert `StopInstances`, die Subnetz-Aktion den Wert `DisruptSubnet`. Findet die Subnetz-Aktion kein passendes Subnetz, wird sie standardmäßig übersprungen statt zu scheitern. Das ist bequem und gefährlich zugleich: Ein Tippfehler im Tag führt zu einem Experiment, das grün durchläuft und nichts getestet hat.

### Badge 3 — die Auswertung

Blieb die Fehlerrate unter der Schwelle? Hat die Stop Condition gefeuert? Wie lange hat das Failover tatsächlich gedauert?

Das Ergebnis ist eine Erkenntnis über das eigene System, keine Vermutung — und typischerweise eine Liste von Dingen, die im Failover doch nicht automatisch liefen. Ein Health Check mit zu langem Intervall. Ein Connection Pool, der die alte Datenbank-IP eine Viertelstunde festhält. Ein Cron-Job, den es nur in einer Zone gab.

Genau deshalb ist dieser Kasten türkis und nicht golden: Er beschreibt den Rückweg der Beobachtung zum Team. Die Karte endet hier, die Praxis nicht — daraus folgt eine Änderung und ein erneuter Lauf.

Für den Fall, dass die Erkenntnis nicht nur intern gebraucht wird, kennt FIS einen Experiment-Report: eine Zusammenfassung der ausgeführten Aktionen zusammen mit dem Verlauf eines von dir benannten CloudWatch-Dashboards. Das ist der Beleg, den ein Auditor sehen will — dass die Resilienz nicht behauptet, sondern nachgewiesen wurde.

Und das Szenario aus der Library ist nur eines von mehreren. Daneben stehen „AZ: Application Slowdown" für zusätzliche Latenz innerhalb einer Zone, „Cross-AZ: Traffic Slowdown" für Paketverlust zwischen Zonen und „Cross-Region: Connectivity", das den Verkehr in eine andere Region blockiert und die regionsübergreifende Replikation anhält. Die Karte zeigt eines davon, weil es das schärfste ist — die Auswahl gehört aber zur Antwort auf die Frage, was genau man beweisen will.

### Der rote Bypass — ohne Stop Condition in Produktion

Der verworfene Pfad zweigt am Template ab und geht direkt in die Produktion, mit `"source": "none"`.

Was dann fehlt, ist nicht die Sicherheit, sondern die *Reaktionsfähigkeit*. Das Experiment läuft seine 30 plus 30 Minuten ab, egal was währenddessen passiert. Wenn der Verkehr in der überlebenden AZ die Kapazität sprengt, weil die Auto Scaling Group dort ein zu niedriges Maximum hat, sieht das niemand kommen und nichts stoppt es automatisch.

Aus dem Test wird dann ein Incident, den man sich selbst gebaut hat — mit dem zusätzlichen Nachteil, dass man ihn im Postmortem erklären muss.

## Die entscheidende Unterscheidung

Drei Verfahren, die alle behaupten, etwas über Ausfallsicherheit zu sagen:

| | Lasttest | FIS-Experiment | Redundanz bauen |
|---|---|---|---|
| Was wird zugeführt | Last | Fehler | nichts |
| Was wird beantwortet | Skaliert es? | Übersteht es Ausfälle? | Könnte es überstehen? |
| Ergebnis | Kurven | eine bestätigte oder widerlegte Hypothese | eine Architektur |
| Braucht Abbruchleine | selten | ja | entfällt |
| Ändert das System | nein | nein | ja |

Die letzte Zeile ist der Kern: FIS ändert deine Architektur nicht. Wer nach dem Experiment resilienter ist, ist es wegen der Änderungen, die er *danach* gemacht hat.

## Die ehrliche Feinheit

**Das AWS-Szenario bringt keine Stop Conditions mit.** Die Dokumentation zu „AZ Availability: Power Interruption" schreibt es wörtlich: Dieses Szenario enthält keine Abbruchbedingungen, die passenden müsse man selbst in das Experiment Template eintragen. Der verworfene Pfad der Karte ist damit nicht der exotische Sonderfall — er ist der Auslieferungszustand. Wer das Szenario aus der Library kopiert und startet, hat genau die Konfiguration, die auf der Karte rot durchgestrichen ist. Die Karte suggeriert, man müsse aktiv etwas weglassen. Man muss aktiv etwas hinzufügen.

**Es gibt eine zweite Bremse, die die Karte nicht zeigt.** Seit September 2024 kennt FIS den Safety Lever: einen Hebel, der alle laufenden Experimente in einem Konto und einer Region stoppt und neue verhindert, bis ihn jemand von Hand wieder löst. Gedacht ist er für Verkaufsaktionen, Produkt-Launches oder eine ohnehin kranke Anwendung. Das ist eine andere Ebene als die Stop Condition: Die Stop Condition gehört zu *einem* Experiment, der Safety Lever gilt für das gesamte Konto.

**Ein gestopptes Experiment lässt sich nicht fortsetzen.** Weder nach einer Stop Condition noch nach einem manuellen Abbruch. Man startet neu — und dann beginnt auch die Uhr des Szenarios wieder von vorn.

**Und das kostet Geld.** FIS rechnet nach Action-Minuten ab: 0,10 US-Dollar je Action-Minute, plus 0,10 US-Dollar je Action-Minute für jedes zusätzliche Zielkonto bei Multi-Account-Experimenten. Das AZ-Szenario bündelt mehrere Aktionen über eine Stunde — die Summe ist überschaubar, aber sie ist nicht null, und sie skaliert mit der Zahl der Aktionen, nicht mit der Zahl der getroffenen Ressourcen. Ein Experiment-Report kostet zusätzlich 5 US-Dollar.

## Syntax lesen — Action-IDs und die Abbruchleine

FIS-Actions folgen einem festen Dreiklang. Wer ihn kennt, kann Action-IDs in einer Prüfungsfrage lesen, ohne sie auswendig zu können:

```
aws : ec2 : stop-instances
 │     │      └─ was getan wird
 │     └─ auf welchem Dienst
 └─ Namensraum, immer "aws"

aws:ec2:send-spot-instance-interruptions   →  Spot-Unterbrechung auslösen
aws:ec2:stop-instances                     →  Instanzen anhalten (Teil des AZ-Szenarios)
```

Die Spot-Action ist der Grund, warum FIS auch auf einer Kostenkarte auftaucht: Sie ist der offizielle Weg, Spot-Toleranz zu prüfen. AWS geht dabei so weit, dass der Knopf „Spot-Unterbrechung auslösen" in der EC2-Konsole intern FIS verwendet — die EC2-Dokumentation nennt FIS ausdrücklich als den ausführenden Dienst darunter.

Und die Abbruchleine hat nur zwei mögliche Formen:

```
"stopConditions": [ { "source": "aws:cloudwatch:alarm", "value": "<Alarm-ARN>" } ]
"stopConditions": [ { "source": "none" } ]
```

Mehr gibt es nicht. Kein Schwellwert im Template, keine Fehlerrate, kein Timeout — die Intelligenz der Abbruchbedingung steckt vollständig im CloudWatch-Alarm. Wer den Alarm schlecht baut, hat eine Leine, an der niemand zieht.

## Was du dadurch nicht baust

Zähl durch, was ein FIS-Experiment **nicht** liefert:

- keine zusätzliche Verfügbarkeit — es entsteht keine einzige neue Ressource
- keinen echten AZ-Ausfall, sondern dessen Symptombild auf deinen getaggten Ressourcen
- keine Aussage über regionale Dienste: S3 und DynamoDB sind gegen den Ausfall einer einzelnen AZ ausgelegt und stehen nicht im Zielbereich des Szenarios
- keine Lastprüfung; wer wissen will, ob das System skaliert, braucht einen Lasttest
- keinen Schutz vor sich selbst, wenn `stopConditions` auf `none` steht
- keine Fortsetzung nach Abbruch

## Wenn du dir eine Sache merkst

**FIS beweist Resilienz, es baut sie nicht — und die Stop Condition ist der einzige Unterschied zwischen einem Experiment und einem Incident.**

Eine dritte Availability Zone erhöht die Redundanz und beantwortet die Frage nicht. Ein Lasttest zeigt Skalierung, nicht Fehlertoleranz. Ein Architektur-Review beurteilt den Plan, nicht das laufende System. Und CloudWatch allein misst nur — es erzeugt nichts, was zu messen wäre.

## Prüfungsknackpunkte

**Signalwörter:** „test the resilience", „simulate an Availability Zone failure", „validate that failover actually works", „controlled experiment". Vor allem das Wort **validate** ist der Schalter: Es fragt nach einem Nachweis, nicht nach einer Verbesserung.

**Die Namensfalle.** Der Dienst hieß bis 2023 AWS Fault Injection *Simulator* und heißt seitdem AWS Fault Injection *Service*. Ältere Blogposts, Workshops und Kursmaterialien verwenden weiterhin den alten Namen, die Abkürzung FIS blieb gleich. In einer Prüfungsfrage können beide Schreibweisen auftauchen — gemeint ist derselbe Dienst. AWS selbst hat die Umbenennung in einem News-Blog-Beitrag als Nebensatz vermerkt.

**Die Guardrail-Falle.** Eine Antwortoption, die ein Experiment in Produktion ohne Abbruchbedingung vorschlägt, ist falsch, auch wenn sie technisch funktioniert.

**Die Baseline-Falle.** Ein Experiment ohne definierten Steady State liefert kein interpretierbares Ergebnis. Steht im Szenario nichts über Metriken, gehört „vorher Baseline messen" in die Antwort.

**A — einen Lasttest fahren:** Zeigt, ob das System bei Last skaliert. Sagt nichts darüber, was beim Wegfall einer Zone passiert.

**B — eine AZ in der Konsole abschalten:** Gibt es nicht. Availability Zones sind kein Schalter, den ein Kunde umlegen kann — genau diese Lücke füllt FIS.

**D — eine dritte Availability Zone hinzufügen:** Baut Redundanz, beweist nichts. Die Frage nach Validierung bleibt unbeantwortet, jetzt nur teurer.

**E — ein Assessment durchführen lassen:** Bewertet die Konfiguration gegen Ziele wie RTO und RPO. Das ist eine Analyse des Entwurfs, kein Ausfall im laufenden Betrieb.
