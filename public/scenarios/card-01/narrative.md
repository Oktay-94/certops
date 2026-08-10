---
cardNumber: 1
slug: serverless-rest-api-ticketwave
title: "Battle Card 1 — API Gateway · Lambda · DynamoDB"
services: ["Amazon API Gateway", "AWS Lambda", "Amazon DynamoDB"]
domains: ["D3", "D4"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-execution-service-limits-table.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/06/amazon-api-gateway-integration-timeout-limit-29-seconds/"
  - "https://docs.aws.amazon.com/lambda/latest/dg/scaling-behavior.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/warm-throughput-scenarios.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/on-demand-capacity-mode-max-throughput.html"
  - "https://aws.amazon.com/about-aws/whats-new/2020/12/aws-lambda-changes-duration-billing-granularity-from-100ms-to-1ms"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, einen Ticketschalter für ein Konzert zu betreiben.

**Weg eins:** Du mietest eine Halle und stellst 40 Schalter auf, weil am Launch-Tag vielleicht 40 gebraucht werden. Am Morgen kommen drei Leute. 37 Schalterbeamte stehen herum und werden bezahlt. Am Abend geht der Post viral, es kommen 4.000 Leute, und deine 40 Schalter sind zu wenig. Neue aufzustellen dauert Tage — Möbel bestellen, Personal einstellen, einarbeiten.

**Weg zwei:** Es gibt keine Schalter. Jeder Kunde, der die Halle betritt, bringt seinen eigenen mit. Er stellt ihn hin, kauft sein Ticket, und wenn er geht, verschwindet der Schalter wieder. Drei Kunden, drei Schalter. 4.000 Kunden, 4.000 Schalter. Leer stehende Schalter gibt es nicht, weil ein Schalter ohne Kunden gar nicht erst existiert.

Weg eins ist EC2. Weg zwei ist die Kombination aus dieser Karte.

Das ist die ganze Idee hinter dem Szenario: TicketWave weiß vorher nicht, ob am Launch-Tag 10 oder 100.000 Requests pro Minute kommen. Also baut es eine Architektur, in der die Frage schlicht nicht beantwortet werden muss.

## Was es eigentlich ist — der Proxy-Vertrag

Das zentrale Objekt dieser Architektur ist kein Server und keine Konfigurationsdatei. Es ist ein **Vertrag über zwei JSON-Formate**: Was API Gateway an Lambda übergibt, und was Lambda zurückgeben muss.

Was reinkommt (gekürzt auf das Wesentliche):

```json
{
  "resource": "/orders",
  "path": "/orders",
  "httpMethod": "POST",
  "headers": { "Content-Type": "application/json" },
  "queryStringParameters": { "event": "konzert-4711" },
  "pathParameters": null,
  "requestContext": {
    "requestId": "c6af9ac6-7b61-11e6-9a41-93e8deadbeef",
    "identity": { "sourceIp": "84.132.11.7" }
  },
  "body": "{\"ticketId\":\"TW-88123\",\"menge\":2,\"preis\":89}",
  "isBase64Encoded": false
}
```

Und was zurück muss — exakt diese vier Felder, sonst antwortet API Gateway dem Client mit `502 Bad Gateway`:

```json
{
  "statusCode": 201,
  "headers": { "Content-Type": "application/json" },
  "body": "{\"orderId\":\"TW-88123\",\"status\":\"bestaetigt\"}",
  "isBase64Encoded": false
}
```

Lies das zweite Objekt genau. `body` ist ein **String**, kein Objekt. Wer dort versehentlich ein JSON-Objekt zurückgibt statt `JSON.stringify(...)`, bekommt einen 502 und sucht den Fehler stundenlang in der falschen Ecke — nämlich in der Business-Logik statt im Rückgabeformat.

Das ist es, was „Proxy-Integration" bedeutet: API Gateway schaut nicht in den Inhalt hinein, mappt nichts um und validiert nichts. Es reicht durch. Der Preis für diese Einfachheit ist, dass die Funktion das Format selbst korrekt bedienen muss.

## Der Weg durch die Karte

### Kasten links — Web / Mobile App

Der Startpunkt ist bewusst blau und außerhalb von AWS: die TicketWave-Kunden. Die Zahl darunter ist die eigentliche Aufgabenstellung — **10 auf 100.000 Requests pro Minute**.

Rechne das kurz um, weil die Zahl sonst nur groß aussieht: 100.000 pro Minute sind rund **1.667 Requests pro Sekunde**. Merk dir die Zahl, sie kommt in „Die ehrliche Feinheit" wieder.

### Badge 1 — HTTPS-Request an die Front Door

Der erste Pfeil endet nicht bei deinem Code, sondern bei einer Wand davor.

API Gateway macht an dieser Stelle vier Dinge, bevor irgendetwas von dir läuft: TLS terminieren, den Aufrufer authentifizieren, gegen das Throttling-Limit prüfen, und anhand von Pfad und Methode entscheiden, wohin es geht.

Das Bild dazu: der Empfang eines Bürogebäudes. Ausweis zeigen, Besucherliste, Stockwerk. Wer hier abgewiesen wird, hat das Büro nie von innen gesehen — und du zahlst auch keine Lambda-Laufzeit dafür.

### Kasten — Amazon API Gateway

Auf der Karte steht „managed Front Door der Anwendung". Der entscheidende Teil daran ist das Wort **managed**: Es gibt keinen Load Balancer zu dimensionieren, keine Zielgruppe zu pflegen, keine Instanz, die den Endpunkt hostet.

Was du stattdessen hast, ist eine Ressource mit einer URL. Skalierung ist kein Thema, das du löst, sondern eines, das nicht auftritt.

### Badge 2 — Proxy-Event

Hier passiert die Umwandlung: Aus einem HTTP-Request wird das JSON-Objekt von oben, und Lambda bekommt es als Argument.

Und hier passiert das, was den viralen Spike überhaupt abfängt: Kommen 500 Requests gleichzeitig an, entstehen bis zu 500 **Ausführungsumgebungen** nebeneinander. Nicht 500 Requests in einer Warteschlange vor einem Prozess — 500 parallele Instanzen desselben Codes, die nichts voneinander wissen.

Deshalb steht auf der Karte „skaliert pro Request" und nicht „skaliert pro Instanz". Der Unterschied ist die ganze Karte.

### Kasten — AWS Lambda

Drei Zeilen stehen im Kasten, und die dritte ist die interessanteste: „Abrechnung pro ms".

Seit Dezember 2020 rechnet Lambda die Laufzeit auf die volle **Millisekunde** auf, nicht mehr auf 100 ms. Eine Funktion, die 28 ms braucht, kostet 28 ms. Vorher kostete sie 100 ms — also das Vierfache für dieselbe Arbeit.

Für TicketWave heißt das: Eine schlanke Bestell-Funktion ist nicht nur schneller, sie ist direkt proportional billiger. Bei EC2 gibt es diese Kopplung nicht — dort kostet eine Instanz gleich viel, ob dein Code 28 ms oder 280 ms braucht.

Was du dafür aufgibst: Die Funktion hat kein Gedächtnis. Sie startet, arbeitet, gibt zurück, stirbt. Alles, was zwischen zwei Requests überleben soll, muss woandershin.

### Badge 3 — PutItem/Query

Genau deshalb steht DynamoDB auf der Karte: **weil die Funktion keinen Zustand halten kann.**

Die Bestellung `TW-88123` über 2 Tickets zu je 89 € muss irgendwo landen, wo sie den Tod des Containers überlebt. Ein `PutItem` schreibt sie, ein `Query` holt sie später zurück.

Das ist kein Zusatz zur Architektur, das ist die Bedingung dafür, dass die Architektur funktioniert. Zustand gehört in einen Speicher, nicht in eine Funktion.

### Kasten — Amazon DynamoDB

„On-Demand Capacity Mode: skaliert automatisch mit Last" — der Gegenentwurf ist Provisioned Capacity, bei der du vorher RCU und WCU festlegst.

Der Denkfehler, den man beim ersten Mal macht: Provisioned wirkt sicherer, weil man eine Zahl einträgt. Tatsächlich ist die eingetragene Zahl genau das Problem. Zu niedrig geraten heißt Throttling am Launch-Tag; zu hoch geraten heißt, nachts für Kapazität zu zahlen, die niemand braucht. On-Demand nimmt dir die Wette ab.

Die Grenze davon steht weiter unten — sie ist realer, als die Karte vermuten lässt.

### Badge 4 — der Rückpfeil, und was daran nicht stimmt

**Dieser Pfeil zeigt einen Weg, den es so nicht gibt.**

Auf der Karte startet der gestrichelte Pfeil „JSON-Antwort in Millisekunden" an der **DynamoDB**-Box und endet bei der App. Gelesen wie ein Ablaufdiagramm bedeutet das: Die Datenbank antwortet dem Browser. Das tut sie nie. DynamoDB kennt den Client nicht, hat keine öffentliche Route zu ihm und würde ihm auch kein HTTP sprechen.

Der reale Rückweg ist:

```
DynamoDB → Lambda → API Gateway → Client
```

Drei Übergaben, nicht eine. Und jede davon kann eigene Fehler produzieren — Lambda kann nach dem erfolgreichen Schreiben immer noch eine Exception werfen, und API Gateway kann nach 29 Sekunden aufgeben, obwohl die Bestellung längst in der Tabelle steht.

Der Pfeil auf der Karte ist ein **Sammelpfeil**: eine Linie für den gesamten Response-Pfad, gezeichnet, damit die Karte nicht drei zusätzliche Linien bekommt. Als Vereinfachung ist das in Ordnung. Als Lernbild ist es gefährlich, wenn man es für den Ablauf hält. Merk dir die Linie als „und dann geht die Antwort denselben Weg zurück, den sie gekommen ist" — nicht als eigenen Weg.

### Die drei gestrichelten Kästen unten — Pay-per-Request auf jeder Ebene

Diese Kästen sind kein Ablauf, sondern eine Aussage über die Rechnung. Sie stehen unter jedem der drei Dienste, weil der Punkt genau die Vollständigkeit ist:

Wenn eine einzige Ebene eine Grundgebühr hätte, wäre das Versprechen „nur zahlen, was genutzt wird" gebrochen. Ein ALB kostet pro Stunde, ob Traffic kommt oder nicht. Eine RDS-Instanz kostet pro Stunde. Eine provisionierte DynamoDB-Tabelle kostet pro Stunde.

Hier kostet nichts pro Stunde. Bei null Requests ist die Rechnung für diese drei Dienste null.

## Die entscheidende Unterscheidung

In dieser Architektur gibt es **zwei Drosselungs-Ebenen**, und beide antworten mit demselben HTTP-Status `429`. Wer sie verwechselt, sucht den Fehler eine Ebene zu tief:

| | Ebene 1 | Ebene 2 |
|---|---|---|
| Wer drosselt? | API Gateway | Lambda |
| Wogegen? | Requests pro Sekunde am Endpunkt | gleichzeitige Ausführungsumgebungen |
| Stellschraube | Throttling-Einstellung pro Stage/Methode | Account-Concurrency, Reserved Concurrency |
| Erreicht deinen Code? | nein — abgewiesen vor der Funktion | ja/nein — Umgebung wird gar nicht erst erzeugt |
| Metrik zum Nachsehen | `4XXError`, `Count` in `AWS/ApiGateway` | `Throttles` in `AWS/Lambda` |

Faustregel: Wird am Gateway gedrosselt, siehst du in den Lambda-Logs **gar nichts**. Wird bei Lambda gedrosselt, siehst du in der Lambda-Metrik `Throttles` einen Ausschlag, aber ebenfalls keine Log-Zeile — die Umgebung ist nie entstanden. Leere Logs sind hier kein Beweis für „alles ruhig".

## Die ehrliche Feinheit

Die Karte sagt „skaliert automatisch". Das stimmt — aber nicht unbegrenzt und nicht sofort. Drei Grenzen, die im Bild fehlen:

**Erstens: Lambda hat ein Account-Limit von standardmäßig 1.000 gleichzeitigen Ausführungen pro Region.** Das ist ein weiches Limit, per Ticket erhöhbar, aber es gilt **für alle Funktionen im Account zusammen**. Bei 1.667 Requests pro Sekunde und einer Funktion, die 100 ms braucht, liegst du rechnerisch bei etwa 167 gleichzeitigen Umgebungen — komfortabel. Braucht dieselbe Funktion aber 800 ms, weil sie synchron auf einen Zahlungsdienstleister wartet, sind es rund 1.334, und du bist am Limit. **Die Laufzeit deiner Funktion entscheidet mit darüber, ob dein Konto skaliert.**

**Zweitens: Auch die Geschwindigkeit des Hochskalierens ist begrenzt.** Laut aktueller Doku beträgt die Skalierungsrate 1.000 zusätzliche Ausführungsumgebungen pro 10 Sekunden — und zwar pro Funktion.

An dieser Stelle ist Vorsicht geboten: Der oft zitierte AWS-Blogbeitrag „Understanding AWS Lambda scaling and throughput" beschreibt im Fließtext noch das **alte** Modell (Initialburst von 500 bis 3.000, danach +500 pro Minute, kontowert). Er trägt oben einen Update-Hinweis, dass Funktionen seit Dezember 2023 zwölfmal schneller skalieren. Beide Texte stehen auf aws.amazon.com und widersprechen sich im Wortlaut. Maßgeblich ist die Developer-Guide-Seite `scaling-behavior`, weil sie den aktuellen Stand als Referenz führt und der Blog sich selbst als überholt markiert. Wenn eine Prüfungsfrage die alten Zahlen abfragt, kennst du jetzt beide.

**Drittens, und das ist die schärfste Grenze: DynamoDB On-Demand skaliert nicht aus dem Stand beliebig hoch.** Eine **neue** On-Demand-Tabelle startet mit einem sogenannten Warm Throughput von 12.000 Lese- und **4.000 Schreibeinheiten pro Sekunde**. Bis dahin trägt sie sofort. Darüber wächst der Wert automatisch nach — aber nicht beliebig schnell: Verdoppelt sich der Verkehr innerhalb kurzer Zeit über den bisherigen Höchstwert hinaus, kann es zu Throttling kommen.

Für TicketWave ist das die eigentliche Launch-Tag-Frage. 1.667 Schreibvorgänge pro Sekunde liegen unter 4.000 — es passt. Bei 400.000 Requests pro Minute passt es nicht mehr, und AWS bietet für genau diesen Fall seit November 2024 das **Pre-Warming** an: Du hebst den Warm-Throughput-Wert vor dem Event an, statt zu hoffen, dass die automatische Anpassung schnell genug ist.

Eine vierte Kleinigkeit, die die Karte gar nicht zeigt: Es gibt zusätzlich ein Limit **pro Partition** von 1.000 Schreib- und 3.000 Leseeinheiten pro Sekunde. Wenn alle Käufe desselben Konzerts denselben Partition Key tragen, hilft dir die Gesamtkapazität der Tabelle nichts. Das ist die klassische Hot-Partition, und beim Ticketverkauf für **ein** Konzert ist sie kein theoretisches Risiko.

**Zum 29-Sekunden-Timeout:** Der Standardwert für die Integration liegt bei 29 Sekunden, und seit Juni 2024 lässt er sich für regionale und private REST APIs per Service Quota anheben. Was dabei fast immer unterschlagen wird: AWS weist darauf hin, dass eine Erhöhung eine **Reduktion des kontoweiten Throttle-Kontingents** erfordern kann. Du tauschst also Wartezeit gegen Durchsatz. Für eine API, die auf viralen Traffic ausgelegt ist, ist das ein schlechter Tausch.

## Was du dadurch nicht baust

Zähl durch, was in dieser Architektur **nicht** existiert:

- keine EC2-Instanz, kein Betriebssystem, kein Patch-Zyklus
- kein Load Balancer, den jemand dimensionieren müsste
- keine Auto Scaling Group, keine Mindest- und Höchstzahl von Instanzen
- kein Connection Pool zur Datenbank und keine Datenbank-Instanz, die Wartungsfenster hat
- keine RCU/WCU-Planung, keine Kapazitätsschätzung vor dem Launch
- keine Kosten in der Nacht, wenn niemand ein Ticket kauft
- kein Kapazitätsgespräch vor dem Launch-Tag

Übrig bleiben: eine API-Definition, eine Funktion und eine Tabelle.

## Wenn du dir eine Sache merkst

**Bei null Requests kostet diese Architektur null — und genau deshalb muss vor dem Launch niemand raten, wie viel Traffic kommt.**

Fargate ist ebenfalls serverless, aber der Container läuft dauerhaft und kostet auch nachts. EC2 mit Auto Scaling kann den Spike bedienen, braucht dafür aber Minuten und eine Grundlast, die immer mitläuft. RDS zwingt dich zurück in die Instanzgrößen-Entscheidung, die du gerade loswerden wolltest.

## Prüfungsknackpunkte

**Signalwörter:** „unvorhersehbarer Traffic", „viral", „keine Server verwalten", „Pay-per-Request", „minimaler operativer Aufwand". Diese Kombination ist praktisch immer API Gateway + Lambda + DynamoDB. Kommt zusätzlich „bestehender Docker-Container" vor, kippt die Antwort zu Fargate.

**Die On-Demand-Falle.** Das Prüfungswort ist *predictable*. „Unvorhersehbar/spiky" → On-Demand. „Stabil und planbar" → Provisioned mit Auto Scaling, weil dann günstiger. Die Frage testet nicht, welcher Modus besser ist, sondern ob du das Adjektiv im Aufgabentext gelesen hast.

**Die Timeout-Falle.** Langlaufende Verarbeitung gehört nicht hinter eine synchrone API. Sobald im Szenario „Videoverarbeitung", „Report-Generierung" oder „mehrere Minuten" auftaucht, lautet die Antwort entkoppeln — SQS oder Step Functions dahinter, API Gateway gibt sofort eine Job-ID zurück. Dass sich das Timeout inzwischen anheben lässt, ändert an dieser Prüfungslogik nichts.

**Lambda gegen Fargate.** Beide serverless. Der Trenner ist die Laufzeit: kurzlebig und request-getrieben mit Null-Grundlast → Lambda. Langlaufender Webdienst oder fertiger Container → Fargate. Das 15-Minuten-Limit von Lambda ist dabei der härteste Ausschlusstest.

**Warum EC2 hier verliert:** nicht weil es nicht funktionieren würde, sondern weil vor dem Launch jemand eine Kapazitätszahl nennen müsste — und die Aufgabe sagt ausdrücklich, dass niemand sie kennt.

**Warum RDS hier verliert:** eine relationale Instanz hat eine feste Größe und eine Verbindungsobergrenze. Tausende gleichzeitige Lambda-Umgebungen, die jeweils eine Verbindung öffnen, sind für RDS der Worst Case und für DynamoDB ein normaler Dienstag.

**Warum ein ALB hier verliert:** er kostet pro Stunde und braucht Ziele, die dauerhaft existieren. Beides widerspricht dem Pay-per-Request-Versprechen der Aufgabe.
