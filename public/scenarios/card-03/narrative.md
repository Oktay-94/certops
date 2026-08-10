---
cardNumber: 3
slug: ec2-auto-scaling-dailydeals-tageszyklus
title: "Battle Card 3 — EC2 Auto Scaling · ALB · CloudWatch"
services: ["EC2 Auto Scaling", "Application Load Balancer", "Amazon CloudWatch", "Amazon EC2"]
domains: ["D3", "D4"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scaling-target-tracking.html"
  - "https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-predictive-scaling.html"
  - "https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-default-instance-warmup.html"
  - "https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/manage-detailed-monitoring.html"
  - "https://docs.aws.amazon.com/AutoScaling/latest/APIReference/API_GetPredictiveScalingForecast.html"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-autoscaling-scalingpolicy-predictivescalingmetricspecification.html"
---

## Die Grundidee zuerst

Ein Altbau mit Kohleofen. Es wird kalt, jemand muss in den Keller, Kohlen holen, nachlegen, warten. Wird es zu warm, macht man das Fenster auf. Nachts legt niemand nach, morgens ist es eiskalt. Das System funktioniert nur, solange jemand daran denkt — und derjenige denkt nachts um drei nicht daran.

Dann kommt der **Thermostat**. Du sagst einmal „20 Grad" und gehst. Es wird kälter, er heizt. Es wird wärmer, er drosselt. Niemand geht mehr in den Keller.

Und dann gibt es noch die **Zeitschaltuhr**: Du sagst „ab 6:00 heizen", weil du weißt, dass du um 6:30 aufstehst. Der Thermostat würde erst reagieren, wenn dir schon kalt ist. Die Zeitschaltuhr reagiert nicht — sie handelt vorher.

Merk dir beide Bilder getrennt. Sie sind die zwei Antworten, zwischen denen dieses Szenario entscheidet, und AWS verwendet den Thermostat-Vergleich in der eigenen Dokumentation für Target Tracking.

DailyDeals hat den Kohleofen: nachts reichen 2 Instanzen, mittags braucht der Shop bis zu 40. Bisher schaltet jemand morgens hoch und abends runter — oder vergisst es und zahlt 40 Instanzen über Nacht.

## Was es eigentlich ist — die Scaling Policy

Die Auto Scaling Group ist eine Verwaltungshülle mit drei Zahlen: `min`, `max`, `desired`. Sie skaliert von sich aus nichts. Das Objekt, das tatsächlich handelt, ist die **Scaling Policy**:

```json
{
  "AutoScalingGroupName": "dailydeals-web-asg",
  "PolicyName": "requests-per-target-1000",
  "PolicyType": "TargetTrackingScaling",
  "EstimatedInstanceWarmup": 180,
  "TargetTrackingConfiguration": {
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ALBRequestCountPerTarget",
      "ResourceLabel": "app/dailydeals-alb/50dc6c495c0c9188/targetgroup/dailydeals-tg/943f017f100becff"
    },
    "TargetValue": 1000.0,
    "DisableScaleIn": false
  }
}
```

Lies es wie einen Satz: Halte für die Gruppe `dailydeals-web-asg` den Wert `ALBRequestCountPerTarget` bei **1.000 Requests pro Instanz und Minute**, und gib einer neu gestarteten Instanz 180 Sekunden, bevor du ihre Messwerte ernst nimmst.

Zwei Dinge stehen bemerkenswerterweise **nicht** darin: kein Schwellenwert für „hochskalieren", keine Zahl für „wie viele Instanzen dazu". Du nennst den Zielwert, nicht den Weg dorthin. Die nötigen CloudWatch-Alarme legt EC2 Auto Scaling selbst an und pflegt sie — die Doku warnt sogar ausdrücklich davor, diese Alarme anzufassen, weil der Dienst sie jederzeit ersetzen oder löschen kann.

Das ist der Thermostat in JSON: Du drehst an der Zieltemperatur, nicht am Brenner.

## Der Weg durch die Karte

### Kasten links — Nutzer

„Last schwankt im Tagesverlauf" — das ist nicht Kulisse, das ist die Prüfungsfrage. Merk dir das Wort **Tagesverlauf**. Es kommt in „Die entscheidende Unterscheidung" wieder und entscheidet dort die Antwort.

### Badge 1 — HTTPS an den ALB

Der Load Balancer ist der stabile Punkt in einem System, dessen Inneres sich ständig ändert. Zwischen 2 und 40 Instanzen kann alles laufen; die Adresse, die der Kunde kennt, bleibt dieselbe.

Das Bild dazu: eine Telefonzentrale. Eine Nummer nach außen, dahinter mal drei, mal dreißig Mitarbeiter. Der Anrufer merkt es nicht.

### Kasten — Application Load Balancer

„Verteilt auf alle **gesunden** Instanzen." Das Wort gesund ist hier kein Beiwerk.

Eine neu gestartete EC2-Instanz braucht Zeit: Betriebssystem hochfahren, Anwendung starten, eventuell Daten laden. Bis der Health-Check erfolgreich ist, bekommt sie keinen Traffic — obwohl sie schon läuft und schon Geld kostet. Diese Lücke ist der zentrale Nachteil dieser Architektur gegenüber Karte 1 und 2, und sie ist der Grund für alles, was weiter unten über Reaktionszeit steht.

### Badge 2 — Routing in die Target Group

Der ALB verteilt auf die Zielgruppe. Neue Instanzen der ASG registrieren sich nach bestandenem Health-Check automatisch, entfernte werden abgemeldet.

Wichtig für das Verständnis der ganzen Karte: **Der ALB verteilt nur. Er startet nichts.** Er sieht, dass 40 Instanzen da sind, und verteilt auf 40. Er sieht, dass 2 da sind, und verteilt auf 2. Ob 2 genug sind, ist keine Frage, die er stellt.

### Der gestrichelte Rahmen — Auto Scaling Group (min 2 · max 40)

Der Rahmen ist keine Maschine, sondern eine Regel: *Es laufen mindestens 2 und höchstens 40 Instanzen, und wenn eine stirbt, kommt Ersatz.*

`min = 2` ist dabei keine Sparmaßnahme, sondern eine Verfügbarkeitsentscheidung. Bei `min = 1` würde ein Instanzausfall den Shop offline nehmen, bis Ersatz hochgefahren ist. Zwei Instanzen in zwei Availability Zones überleben den Ausfall einer Zone.

`max = 40` ist die Kostenbremse. Sie schützt nicht vor Last, sondern vor der Rechnung, die entsteht, wenn ein Bot oder eine Endlosschleife die Metrik hochtreibt.

### Der gestrichelte EC2-Kasten — „bei Bedarf"

Zwei durchgezogene Kästen, einer gestrichelt. Das ist die ehrlichste Stelle der Karte: Die zwei durchgezogenen laufen immer und kosten immer. Der gestrichelte existiert nur zeitweise.

Genau hier liegt der Unterschied zu Karte 1. Dort ging der Verbrauch bei null Traffic auf null. Hier ist der Boden `min = 2`. **Diese Architektur hat eine Grundlast, die nie verschwindet — 24 Stunden am Tag, auch um vier Uhr morgens.** Das ist kein Fehler, es ist der Preis für die Kontrolle über die Instanz.

### Badge 3 — „Metriken publizieren": drei Absender, ein Pfeil

Der gestrichelte Pfeil zeigt von den Instanzen nach oben zu CloudWatch. Im CloudWatch-Kasten stehen zwei Metriken: Ø CPU-Auslastung und Requests je Target. **Diese beiden Metriken kommen nicht aus derselben Quelle, und keine der beiden kommt so, wie der Pfeil es nahelegt.**

**`CPUUtilization`** liefert nicht ein Programm auf der Instanz, sondern die EC2-Plattform selbst. Deshalb gibt es diese Metrik ohne jede Installation, direkt nach dem Start. Standardmäßig (Basic Monitoring) landet alle **fünf Minuten** ein Datenpunkt in CloudWatch; mit Detailed Monitoring wird daraus jede Minute, kostenpflichtig pro Metrik.

**`RequestCountPerTarget`** kommt vom **Application Load Balancer** — Namespace `AWS/ApplicationELB`. Der ALB zählt, wie viele Requests er an die Zielgruppe geschickt hat, und teilt durch die Anzahl der Ziele. Die Instanz weiß von dieser Zahl nichts. Ein Pfeil, der bei den Instanzen beginnt, führt für diese Metrik in die Irre — das ist der Grund, warum der vordefinierte Metriktyp `ALBRequestCountPerTarget` heißt und in der Policy oben zwingend ein `ResourceLabel` mit ALB und Target Group braucht.

Und ein dritter Fall, den die Karte gar nicht zeigt: **Arbeitsspeicher und Festplattenbelegung fehlen in beiden Quellen.** Weder die EC2-Plattform noch der ALB kennen sie. Wer nach RAM skalieren will, muss den CloudWatch-Agenten auf der Instanz installieren — und erst *dann* stimmt der Pfeil auf der Karte buchstäblich.

Die Frage, die man sich bei jeder Metrik stellen muss, lautet also nicht „welche Zahl brauche ich", sondern **„wer misst sie eigentlich"**. Drei mögliche Antworten: die Plattform, der Load Balancer, ein Agent von dir.

### Kasten — Amazon CloudWatch

Der Kasten sagt es selbst: CloudWatch **misst**. Es sammelt Datenpunkte, aggregiert sie über Zeitfenster und hält Alarme.

Was es nicht tut: Instanzen starten. CloudWatch hat keine Berechtigung dazu und keine Vorstellung davon, was eine Auto Scaling Group ist. Ein Alarm ist ein Zustand, kein Befehl — er wechselt von `OK` nach `ALARM` und benachrichtigt, wer sich dafür eingetragen hat.

Die zweite Zeile im Kasten, „Target-Tracking-Policy verwaltet ihre Alarme selbst", ist deshalb so wichtig: Diese Alarme hast du nicht gebaut. Du findest sie in der Konsole mit kryptischen generierten Namen und darfst sie nicht anfassen.

### Badge 4 — Alarm → desired capacity

Der letzte Pfeil geht von CloudWatch zurück in die ASG, und er ist der Pfeil, den man am leichtesten falsch liest.

Die Beschriftung rettet ihn: „Alarm → desired capacity anpassen". Es fließt ein **Signal**, keine Handlung. Die Kette lautet in Wahrheit:

```
CloudWatch-Alarm wechselt nach ALARM
        ↓
ruft die Scaling Policy auf
        ↓
Policy berechnet neue desired capacity
        ↓
ASG startet oder terminiert Instanzen (innerhalb min/max)
        ↓
ALB nimmt die neuen Instanzen nach Health-Check auf
```

Fünf Schritte, ein Pfeil. Wenn in der Prüfung gefragt wird, *welcher Dienst Instanzen hinzufügt*, ist die Antwort **EC2 Auto Scaling** — nie CloudWatch. Die Karte zeigt an dieser Stelle die Wirkung, nicht den Akteur.

### Der gelbe Kasten — reaktiv gegen proaktiv

Dieser Kasten steht nicht im Ablauf, weil er kein Schritt ist, sondern ein Einwand gegen das, was darüber gezeichnet ist. Er ist der wichtigste Kasten der Karte. Warum, steht im nächsten Abschnitt.

## Die entscheidende Unterscheidung

Es gibt **zwei Arten zu skalieren**, und sie unterscheiden sich nicht in der Technik, sondern in der Zeitrichtung:

| | Reaktiv | Proaktiv |
|---|---|---|
| Policy-Typ | Target Tracking, Step Scaling | Scheduled Scaling, Predictive Scaling |
| Auslöser | eine Metrik weicht vom Zielwert ab | eine Uhrzeit oder eine Prognose |
| Handelt | **nachdem** die Last da ist | **bevor** die Last da ist |
| Braucht | nur einen Zielwert | ein bekanntes oder erkennbares Muster |
| Passt zu | unregelmäßiger, nicht planbarer Last | wiederkehrendem Tages- oder Wochenmuster |
| Preis | Reaktions-Lag beim Anstieg | Kapazität steht bereit, auch wenn die Last ausbleibt |
| Bild | Thermostat | Zeitschaltuhr |

Und jetzt der Satz, auf den die ganze Karte hinausläuft:

**Die Karte zeichnet die reaktive Lösung, aber die Aufgabe beschreibt ein vorhersehbares Muster — und für vorhersehbare Muster ist die proaktive Lösung die Prüfungsantwort.**

„Nachts 2, mittags 40" ist kein zufälliger Verlauf. Es ist ein Kalender. Wer einen Kalender hat, muss nicht messen.

## Die ehrliche Feinheit

Warum zeigt die Karte dann Target Tracking? Weil es der Standardfall ist und weil man den Mechanismus verstanden haben muss, bevor man beurteilen kann, warum er hier zu langsam ist. Aber es ist die riskanteste Stelle der drei Karten dieses Batches: **Das Bild prägt sich ein, der Einwand im gelben Kasten nicht.**

Rechne den Lag einmal durch, dann bleibt er hängen. Mittags steigt die Last:

1. Der Datenpunkt erreicht CloudWatch — bei Basic Monitoring bis zu **5 Minuten** später.
2. Der Alarm braucht meist mehrere Auswertungsperioden, bevor er umschaltet.
3. Die ASG startet Instanzen — Boot, Anwendungsstart, Health-Check.
4. Der `EstimatedInstanceWarmup` von 180 Sekunden aus der Policy oben sorgt zusätzlich dafür, dass die frische Instanz erst nach Ablauf dieser Zeit in die aggregierte Metrik einfließt.

In Summe können leicht zehn Minuten vergehen, in denen deine zwei Nachtinstanzen den Mittagsansturm allein tragen. Für einen Webshop sind zehn Minuten mit Timeouts kein Schönheitsfehler, sondern verlorener Umsatz. Genau deshalb steht der gelbe Kasten auf der Karte.

Eine Bemerkung zur Kostenseite, die selten gemacht wird: Detailed Monitoring auf 1-Minuten-Takt umzustellen verkürzt Schritt 1 deutlich und kostet pro Instanz und Metrik. Bei 40 Instanzen ist das eine Rechnung, die man aufstellen sollte, statt sie zu übersehen.

**Zu Predictive Scaling kursieren falsche Zahlen.** Man liest häufig, Predictive Scaling brauche mindestens 14 Tage Historie, bevor es benutzbar sei. Die AWS-Dokumentation sagt etwas anderes: Für die ersten Prognosen sind **mindestens 24 Stunden** Daten erforderlich; **14 Tage** Historie führen zu genaueren Prognosen. Prognostiziert wird jeweils zwei Tage im Voraus. Die 14 Tage sind eine Qualitätsangabe, keine Zugangsvoraussetzung — ein Unterschied, der in einer Antwortoption entscheidend sein kann.

**Zwei Zeitbegriffe, die dauernd verwechselt werden:** *Cooldown* ist eine Pause **nach** einer Skalierungsaktivität, in der nichts weiter passiert. *Instance Warmup* ist die Zeit, in der eine neue Instanz **noch nicht** in die aggregierten Metriken einfließt. Die Doku empfiehlt ausdrücklich den Default Instance Warmup auf Gruppenebene; ist er nicht gesetzt, fällt die Policy auf den Default Cooldown zurück. Zwei Uhren, zwei Zwecke.

**Und eine Grenze, die die Karte offenlässt:** `max = 40` ist eine harte Decke. Kommt an einem Aktionstag Last für 60 Instanzen, skaliert die ASG nicht auf 60 — sie bleibt bei 40 und die Antwortzeiten steigen. Die Skalierung ist dann nicht kaputt; sie tut genau das, was du konfiguriert hast. Nur schaut in diesem Moment niemand in die Konfiguration, sondern alle in die Logs.

## Syntax lesen — das `ResourceLabel`

Die längste und unverständlichste Zeile der Policy ist kein Zufallsstring:

```
app/dailydeals-alb/50dc6c495c0c9188/targetgroup/dailydeals-tg/943f017f100becff
 │        │              │              │            │              │
 │        │              │              │            │              └─ ID der Target Group
 │        │              │              │            └─ Name der Target Group
 │        │              │              └─ fester Trenner
 │        │              └─ ID des Load Balancers
 │        └─ Name des Load Balancers
 └─ fester Präfix für Application Load Balancer
```

Warum muss das überhaupt dastehen? Weil `RequestCountPerTarget` **keine Metrik der Auto Scaling Group ist**. Sie gehört einer Target Group an einem Load Balancer. Die Policy braucht daher eine Adresse, um überhaupt zu wissen, wo sie nachschauen soll.

Bei `ASGAverageCPUUtilization` entfällt dieses Feld — die Metrik gehört zur Gruppe selbst. **Wenn ein Feld nur bei einer von zwei Metriken nötig ist, sagt das etwas über die Herkunft der Metrik aus.** Genau die Herkunft, um die es bei Badge 3 ging.

Der praktische Stolperstein: Beide IDs sind Teile der ARNs und lassen sich nicht raten. Wer sie von Hand tippt, bekommt eine Policy, die sich anlegen lässt, aber nie auslöst — weil die referenzierte Metrik nicht existiert.

## Was du dadurch nicht baust

- keinen Menschen, der morgens hochskaliert und abends runter
- keine Kalendererinnerung „18:00 Instanzen abschalten", die im Urlaub niemand liest
- keine 40 Instanzen, die nachts leer mitlaufen
- keine CloudWatch-Alarme von Hand — Target Tracking legt sie an und pflegt sie
- keine manuelle Registrierung neuer Instanzen am Load Balancer
- keinen Ersatz von Hand, wenn eine Instanz stirbt

Was ausdrücklich **nicht** verschwindet, im Unterschied zu Karte 1 und 2: das Betriebssystem, das Patchen, das AMI, die Instanzgröße und die Grundlast von zwei Instanzen rund um die Uhr. Diese Karte automatisiert die Anzahl. Sie automatisiert nicht die Maschine.

## Wenn du dir eine Sache merkst

**CloudWatch misst, die Scaling Policy entscheidet, die Auto Scaling Group handelt — und bei einem vorhersehbaren Tagesmuster darf keiner der drei erst auf die Last warten.**

Der ALB verteilt Traffic auf das, was vorhanden ist, und startet selbst nichts. CloudWatch sieht alles und darf nichts. Eine größere Instanz statt mehrerer kleiner löst das Problem nicht, weil sie nachts genauso groß bleibt wie mittags. Und Target Tracking ist nicht falsch — es ist nur die Antwort auf eine Frage, die diese Aufgabe nicht stellt.

## Prüfungsknackpunkte

**Signalwörter, die zu Scheduled oder Predictive Scaling führen:** „vorhersehbar", „jeden Tag um dieselbe Zeit", „wiederkehrend", „bekanntes Muster", „Geschäftszeiten". Zusätzlich kippt die Antwort zu proaktiv, wenn im Text steht, dass die Anwendung lange zum Starten braucht — dann ist der Reaktions-Lag doppelt teuer.

**Signalwörter, die zu Target Tracking führen:** „unregelmäßig", „nicht planbar", „variabel", „unvorhersehbar". Also genau die Gegenwörter.

**Target Tracking gegen Step Scaling.** Target Tracking hält einen Zielwert und verwaltet seine Alarme selbst. Step Scaling verlangt eigene Alarme und gestufte Anpassungen — mehr Kontrolle, mehr Arbeit. Wenn in der Aufgabe nichts auf feingranulare Kontrolle hindeutet, ist Target Tracking die erwartete Antwort.

**Die CloudWatch-Falle.** „Welcher Service fügt Instanzen hinzu?" → EC2 Auto Scaling. CloudWatch misst und alarmiert, mehr nicht. Diese Frage wird in mehreren Verkleidungen gestellt.

**Die ASG-ist-kein-Load-Balancer-Falle.** Auto Scaling verändert die *Anzahl*, der ALB *verteilt*. Zwei Aufgaben, zwei Dienste. Eine Antwortoption, die dem ALB das Skalieren zuschreibt, ist immer falsch.

**Warum eine größere Instanz hier verliert:** Vertikale Skalierung erfordert einen Neustart, hat eine Obergrenze und spart nachts nichts. Die Aufgabe verlangt ausdrücklich, dass nachts keine Kapazität leer mitläuft.

**Warum ein reines Scheduled Scaling ohne Dynamik riskant ist:** Ein Aktionstag außerhalb des Musters wird davon nicht erfasst. Die AWS-Doku empfiehlt deshalb, proaktive Skalierung mit einer dynamischen Policy zu kombinieren — die Zeitschaltuhr setzt den Boden, der Thermostat fängt den Rest.

**Warum Lambda hier verliert:** Es gibt einen bestehenden Webshop auf Instanzen. Die Aufgabe fragt nach Kapazitätssteuerung, nicht nach einem Architekturwechsel.
