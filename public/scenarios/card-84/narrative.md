---
cardNumber: 84
slug: route53-health-checks-dns-failover
title: "Route 53 Health Checks + Failover"
services: ["Amazon Route 53", "Amazon CloudWatch", "Elastic Load Balancing", "Amazon Application Recovery Controller"]
domains: ["D2"]
correctAnswer: "B"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-determining-health-of-endpoints.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-values-failover.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-types.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-private-hosted-zones.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/health-checks-how-route-53-chooses-records.html"
  - "https://docs.aws.amazon.com/Route53/latest/APIReference/API_CreateHealthCheck.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_planning_for_recovery_disaster_recovery.html"
  - "https://aws.amazon.com/blogs/aws/route-53-health-check-improvements-faster-interval-and-configurable-failover/"
---

## Die Grundidee zuerst

Stell dir vor, ein Restaurant zieht um.

**Der alte Weg:** Die Adresse steht im gedruckten Telefonbuch. Das Buch liegt in einer halben Million Wohnungen. Wenn das Restaurant umzieht, ändert sich am Buch nichts — es ändert sich erst bei der nächsten Auflage. Bis dahin fahren die Leute zur alten Adresse und stehen vor einer verschlossenen Tür. Niemand hat einen Fehler gemacht. Das Buch ist einfach älter als die Wirklichkeit.

**Der neue Weg:** Es gibt keine Bücher mehr, sondern eine Auskunft. Du rufst an, fragst nach der Adresse, bekommst sie — und dazu den Satz: „Diese Auskunft gilt für die nächste Minute." Danach fragst du neu.

Route 53 ist diese Auskunft, die TTL ist der Satz am Ende. Und daraus folgt der ganze Rest dieser Karte, einschließlich der unangenehmen Teile:

Die Auskunft kann ihre Antwort in einer Sekunde ändern. Sie kann niemanden zurückrufen, der schon unterwegs ist. Und wenn jemand sich die Adresse auf einen Zettel geschrieben hat, statt neu anzurufen, fährt er weiter zur alten Tür.

Der Betriebsleiter aus dem Szenario fragt, wie lange es nach einem Ausfall dauert, bis der letzte Kunde in der Standby-Region ankommt. Die ehrliche Antwort besteht aus drei Teilen, und nur zwei davon kann er einstellen.

## Was es eigentlich ist — zwei Objekte, nicht eins

Ein DNS-Failover besteht immer aus **zwei getrennten Dingen**: einem Health Check und mindestens zwei Records, die auf ihn zeigen.

```json
{
  "HealthCheckConfig": {
    "Type": "HTTPS",
    "FullyQualifiedDomainName": "primary.shop.example.com",
    "ResourcePath": "/health",
    "Port": 443,
    "RequestInterval": 30,
    "FailureThreshold": 3,
    "MeasureLatency": true
  }
}
```

```json
[
  { "Name": "shop.example.com", "Type": "A", "SetIdentifier": "eu-central-1",
    "Failover": "PRIMARY",   "TTL": 60,
    "HealthCheckId": "abcd-1111", "ResourceRecords": ["18.196.0.10"] },

  { "Name": "shop.example.com", "Type": "A", "SetIdentifier": "us-west-2",
    "Failover": "SECONDARY", "TTL": 60,
    "HealthCheckId": "abcd-2222", "ResourceRecords": ["54.148.0.20"] }
]
```

Lies den zweiten Block Zeile für Zeile: gleicher `Name`, gleicher `Type`, unterschiedliche `SetIdentifier`, einmal `PRIMARY` und einmal `SECONDARY`. Genau eine Kombination aus beidem ist zulässig — für ein funktionierendes Failover brauchst du einen Primary- und einen Secondary-Record.

`RequestInterval` kennt genau zwei zulässige Werte: 10 oder 30. `FailureThreshold` steht standardmäßig auf 3. Und `TTL: 60` ist keine Zierde: Die Route-53-Dokumentation empfiehlt für Records, die an einem Health Check hängen, eine TTL von 60 Sekunden oder weniger, damit Clients schnell auf Änderungen des Gesundheitszustands reagieren.

Der wichtigste Satz zu diesen zwei Blöcken steht in der Doku unter „Health check" und wird fast immer überlesen: **Route 53 prüft nicht die Adresse, die im Record steht, sondern den Endpoint, der im Health Check steht.** Die `18.196.0.10` oben wird nie angefasst. Geprüft wird `primary.shop.example.com`. Dass beide dasselbe meinen sollen, ist deine Annahme, nicht die von Route 53.

## Der Weg durch die Karte

### Badge 1 — Health Checker: verteilte Prüfstellen im Netz

Route 53 unterhält Health Checker an Standorten rund um die Welt. Sie senden Anfragen an deinen Endpoint, im gewählten Abstand von 10 oder 30 Sekunden.

Jeder einzelne Checker bewertet zwei Dinge: die Antwortzeit und die Frage, ob der Endpoint eine von dir festgelegte Anzahl aufeinanderfolgender Prüfungen nicht beantwortet hat — den Failure Threshold. Der AWS-Blogbeitrag, mit dem dieser Wert eingeführt wurde, nennt den Bereich von 1 bis 10 Beobachtungen; die API setzt ohne Angabe den Wert 3.

Die Antwortzeiten sind nicht verhandelbar und stehen exakt in der Doku:

- **HTTP und HTTPS:** TCP-Verbindung innerhalb von **vier Sekunden**, danach ein Statuscode 2xx oder 3xx innerhalb von **zwei Sekunden**.
- **TCP:** Verbindung innerhalb von **zehn Sekunden**.
- **String-Matching:** wie HTTP/HTTPS, zusätzlich muss der Antwortkörper innerhalb von zwei weiteren Sekunden eintreffen, und die gesuchte Zeichenkette muss vollständig in den ersten **5.120 Bytes** stehen.

Die Prüfstellen stimmen sich untereinander nicht ab. Deshalb siehst du im Log deines Servers mal mehrere Anfragen in einer Sekunde und dann ein paar Sekunden gar nichts — unabhängig davon, welches Intervall du eingestellt hast.

### Badge 2 — Die 18-%-Regel: aus vielen Urteilen wird eins

Route 53 aggregiert die Daten der Health Checker und entscheidet dann: Melden **mehr als 18 %** der Checker den Endpoint als gesund, gilt er als gesund. Melden 18 % oder weniger ihn als gesund, gilt er als ungesund.

Der Wert wirkt willkürlich niedrig, bis man die Begründung liest, die AWS gleich danebenschreibt: Er soll sicherstellen, dass Checker in mehreren Regionen den Endpoint für gesund halten, und verhindern, dass ein Endpoint nur deshalb als tot gilt, weil Netzbedingungen ihn von einigen Prüfstandorten abgeschnitten haben.

Das Bild dazu: Ein Gebäude gilt nicht als eingestürzt, nur weil vier von zwanzig Anrufern es telefonisch nicht erreichen. Erst wenn fast alle draußen bleiben, ist es wirklich zu.

AWS schreibt in denselben Absatz, dass sich dieser Wert in einer künftigen Version ändern kann. Merken solltest du dir also weniger die Zahl als das Prinzip: **Das Urteil entsteht durch Mehrheitsbildung über Standorte, nicht durch einen einzelnen Fehlschlag.**

### Badge 3 — Failover-Record: die Antwort ändert sich, nicht der Verkehr

Ist der Primary ungesund, antwortet Route 53 auf DNS-Anfragen mit dem Secondary-Record. In der Doku steht das für den allgemeinen Fall so: Bei aktiv-passivem Failover liefert Route 53 nur gesunde Primary-Ressourcen aus; sind alle Primary-Ressourcen ungesund, beginnt Route 53, nur noch gesunde Secondary-Ressourcen auszuliefern.

Das ist der eigentliche Umschaltvorgang, und er ist kleiner, als der Begriff „Failover" vermuten lässt: Es ändert sich eine **Antwort**. Route 53 leitet keinen Verkehr um. Eine TCP-Verbindung, die gerade aufgebaut wird, kann Route 53 nicht umbiegen — die Auskunft kann niemanden vom Weg abrufen.

### Badge 4 — Der Client folgt, aber erst nach seiner TTL

Und hier verlässt du deinen Zuständigkeitsbereich. Der Resolver des Kunden hat die alte Antwort zwischengespeichert und fragt erst neu, wenn seine TTL abgelaufen ist. Deshalb die Empfehlung von 60 Sekunden oder weniger.

Die Doku sagt im selben Abschnitt auch, warum niemand die TTL einfach auf 1 setzt: Ein längerer Wert senkt die Zahl der Anfragen an Route 53, reduziert Latenz und Rechnung. TTL ist ein Handel, kein Regler mit einer richtigen Stellung.

Was die Doku nicht verspricht: dass sich jeder daran hält. Manche Resolver und viele Anwendungslaufzeiten halten Antworten länger fest, als die TTL erlaubt. Dieser Teil der Failover-Zeit liegt außerhalb deiner Kontrolle — du kannst ihn nur klein *anfragen*, nicht klein *erzwingen*.

### Der goldene Kasten — die Zeitformel

Failover-Zeit = Intervall × Failure Threshold + Aggregation + TTL.

Mit den Standardwerten sind das 30 × 3 = rund 90 Sekunden allein bis zur Erkennung. Danach kommt die Aggregation über die Prüfstandorte, danach der Ablauf der Zwischenspeicher.

Wer eine RTO von 15 Minuten zugesagt hat, kommt damit bequem hin. Wer 30 Sekunden zugesagt hat, kommt mit DNS-Failover grundsätzlich nicht hin — und zwar nicht, weil AWS zu langsam wäre, sondern weil ein Cache dazwischenliegt.

### Der orange Kasten — die Standby-Region

Am Ende des Pfeils steht der Warm Standby aus Karte 83, der jetzt hochskaliert wird. Die Reihenfolge auf den beiden Karten ist die Reihenfolge im Ernstfall: Karte 83 macht die Region **bereit**, Karte 84 schickt den Verkehr hin.

Beides muss zusammenpassen. Ein Failover, das in 90 Sekunden umschaltet, nützt wenig, wenn die Zielregion erst in zwölf Minuten Last tragen kann — und ein hochskalierter Hot Standby nützt wenig, wenn die TTL bei zwei Tagen steht.

### ✗ Verworfen — Health Check direkt auf eine Instanz im privaten Subnetz

Die Doku ist an dieser Stelle knapp: Route-53-Health-Checker stehen **außerhalb der VPC**. Um die Gesundheit eines Endpoints in einer VPC per IP-Adresse zu prüfen, müsstest du der Instanz eine öffentliche IP-Adresse geben.

Der vorgesehene Weg ist ein anderer: Du legst eine CloudWatch-Metrik an, hängst einen Alarm daran und baust einen Health Check, der auf diesem Alarm beruht. Das AWS-Beispiel dafür ist die EC2-Metrik `StatusCheckFailed`. Genau für Endpunkte, die ein Standard-Health-Check nicht erreicht — etwa Instanzen mit ausschließlich privaten IP-Adressen —, wurde diese Variante eingeführt.

## Die entscheidende Unterscheidung

Es gibt drei Arten, wie ein Health Check zu seinem Urteil kommt, und die Prüfung testet gern, welche in welcher Lage passt:

| | Endpoint | Calculated | CloudWatch-Metrik |
|---|---|---|---|
| Was wird beobachtet | HTTP, HTTPS, TCP gegen einen öffentlich erreichbaren Endpoint | der Status anderer Health Checks | der Datenstrom eines CloudWatch-Alarms |
| Urteil entsteht durch | Antwortzeit + Failure Threshold, dann 18-%-Aggregation | Zahl gesunder Kinder gegen `HealthThreshold` | Alarmzustand OK oder ALARM aus dem Datenstrom |
| Grenzen | erreicht keine privaten IP-Adressen | ein Elternteil überwacht bis zu 255 Kinder | keine kontenübergreifenden Alarme |
| Typischer Einsatz | öffentlicher Web-Endpoint | „mindestens 2 von 3 Servern gesund" | privater Endpoint, fachliche Metrik |

## Die ehrliche Feinheit

**Erstens: Sind beide Records ungesund, bekommst du den Primary.** Die API-Referenz zum `Failover`-Element sagt es direkt: Ist der Secondary-Record ungesund, antwortet Route 53 mit dem Wert des Primary-Records — unabhängig von dessen Gesundheit. Dahinter steht ein allgemeineres Prinzip, das in „How Amazon Route 53 chooses records" beschrieben ist: Ist kein Record einer Gruppe gesund, muss Route 53 trotzdem antworten und hat keinen Grund, einen zu bevorzugen — also behandelt es alle als gesund.

Es gibt keinen Zustand „keine Antwort". Wer auf ausbleibende DNS-Antworten alarmieren will, alarmiert nie. Alarmiert wird auf den Health-Check-Status.

**Zweitens: Ein Secondary ohne Health Check ist immer gesund.** Lässt du am Secondary-Record die `HealthCheckId` weg, antwortet Route 53 bei ungesundem Primary immer mit dem Secondary — unabhängig vom Zustand des dortigen Endpoints. Das ist manchmal genau richtig, etwa wenn der Secondary auf eine statische Wartungsseite zeigt. Bei einer echten Standby-Region ist es ein Loch im Plan.

**Drittens: HTTPS-Health-Checks prüfen keine Zertifikate.** Die Doku hält ausdrücklich fest, dass Prüfungen nicht fehlschlagen, wenn ein Zertifikat ungültig oder abgelaufen ist. Dein Health Check bleibt grün, während Browser die Verbindung verweigern.

**Viertens: Ein neuer Health Check gilt als gesund, bis genug Daten da sind** — und bei aktivierter Invertierung als ungesund. In den ersten Minuten nach dem Anlegen sagt der Status also mehr über die Voreinstellung aus als über den Endpoint.

**Fünftens, und das ist eine Korrektur an der Karte:** Die Kartennotiz schreibt, Intervall *und* Failure Threshold seien nach dem Anlegen unveränderlich. Belegt ist das nur für `RequestInterval` — dort steht der Satz wörtlich in der API-Referenz, ebenso wie für `Type`. `FailureThreshold` dagegen ist Bestandteil von `UpdateHealthCheck` und damit nachträglich änderbar. Für die Prüfung gilt: Intervall und Typ legst du einmal fest, den Threshold darfst du nachziehen.

**Sechstens: Der Health Check darf nicht denselben Namen prüfen wie der Record.** Die Doku setzt an dieser Stelle einen eigenen Wichtig-Kasten: Legst du einen Health Check an, dessen `Domain Name` mit dem Namen der Records übereinstimmt, und hängst ihn dann an genau diese Records, werden die Ergebnisse unvorhersagbar. Der Grund ist ein Kreisschluss — der Health Checker fragt denselben Namen ab, über dessen Auflösung er gerade mitentscheidet. Die Empfehlung lautet, je Endpoint einen eigenen Health Check mit einem eigenen Namen anzulegen, etwa `us-east-2-www.example.com` statt `example.com`. Genau deshalb steht im JSON oben `primary.shop.example.com` und nicht `shop.example.com`.

## Syntax lesen — die Failover-Zeit auseinandernehmen

```
  Ausfall                                                    letzter Client folgt
     │                                                                │
     ▼                                                                ▼
     ├──────────────┬──────────────┬─────────────────────────────────┤
     │ Erkennung    │ Aggregation  │ TTL-Ablauf beim Client           │
     │ Intervall ×  │ 18-%-Regel   │ empfohlen 60 s oder weniger      │
     │ Threshold    │ ohne Zeitwert│ Resolver halten oft länger       │
     │ 30 s × 3     │ in der Doku  │                                  │
     │ = ~90 s      │              │                                  │
     └──────────────┴──────────────┴─────────────────────────────────┘
        du stellst ein    AWS         du empfiehlst — mehr nicht
```

Drei Blöcke, drei verschiedene Besitzer. Der linke gehört dir vollständig: 10 statt 30 Sekunden und Threshold 2 statt 3 drücken die Erkennung auf rund 20 Sekunden. Der mittlere gehört AWS und ist nicht mit einer Zahl dokumentiert — deshalb steht auf der Karte „Aggregation" ohne Zeitangabe. Der rechte gehört dem Client.

Wer eine Failover-Zusage gibt, gibt sie über alle drei Blöcke. Nur über einen davon hat er die volle Kontrolle.

## Was du dadurch nicht baust

- keine Umleitung bestehender Verbindungen — nur neue Auflösungen folgen
- keine garantierte Umschaltzeit, solange fremde Resolver im Spiel sind
- keine Gesundheitsprüfung privater IP-Adressen ohne CloudWatch-Umweg
- keine Zertifikatsüberwachung
- kein Zustand „keine Antwort" bei flächendeckender Störung
- keine Prüfung des Werts, der im Record steht — nur des Endpoints im Health Check
- keinen manuellen Not-Aus; dafür gibt es Amazon Application Recovery Controller mit einer hochverfügbaren Data-Plane-API

## Wenn du dir eine Sache merkst

**Die Failover-Zeit ist Intervall × Failure Threshold plus Aggregation plus TTL — DNS-Failover kann nie schneller sein als der Cache der Clients.**

Ein Load Balancer fällt als Antwort aus, weil er innerhalb einer Region verteilt und keine zweite Region kennt. Eine kürzere TTL allein fällt aus, weil ohne Health Check niemand merkt, dass umgeschaltet werden muss. Und ein zweites Auto-Scaling-Ziel fällt aus, weil das Problem nicht die Kapazität ist, sondern die Adresse.

## Prüfungsknackpunkte

**Signalwörter:** „automatically route traffic to the standby Region" plus zwei Regionen ist Failover-Routing mit Health Checks. „endpoint in a private subnet" ist immer der CloudWatch-Alarm als Health Check. Taucht „TTL" in den Antwortoptionen auf, wird geprüft, ob du weißt, dass der Client-Cache Teil der Failover-Zeit ist.

**Failover-Routing gegen Aktiv-Aktiv.** Failover-Routing ist die aktiv-passive Bauform mit genau einem Primary und einem Secondary. Aktiv-Aktiv baust du mit Weighted-, Latency-, Geolocation-, Geoproximity- oder Multivalue-Answer-Routing und einem Health Check an jedem Record.

**Evaluate Target Health.** Zeigt ein Alias-Record auf einen Load Balancer, kannst du statt eines eigenen Health Checks „Evaluate Target Health" nutzen; dann zählt die Gesundheit der Ziele hinter dem Load Balancer. Sind beide gesetzt, müssen beide zutreffen.

**„Automatisch" heißt nicht „sofort" — und nicht immer „gewollt".** Der Reliability Pillar rät zur Vorsicht bei automatisch ausgelöstem Failover: Ein Failover aus Fehlalarm kostet selbst Verfügbarkeit und Daten. AWS nennt manuell ausgelöstes Failover deshalb einen häufigen Weg, mit vollständig automatisierten Schritten, sodass die Auslösung ein Knopfdruck bleibt.

**A — Elastic Load Balancing zwischen den Regionen:** Ein Load Balancer verteilt innerhalb einer Region über Availability Zones; er kennt die zweite Region nicht und kann sie nicht ansteuern.

**C — Multivalue Answer Routing:** liefert bis zu acht gesunde Records gleichzeitig aus und ist eine Verfügbarkeitsverbesserung, keine Primary-Secondary-Beziehung; ein definiertes „erst A, dann B" gibt es dort nicht.

**D — TTL auf 0 setzen und auf Caching verzichten:** senkt weder Erkennungszeit noch Aggregation, erzeugt maximale Anfragelast — und Resolver halten Antworten in der Praxis ohnehin oft länger, als die TTL erlaubt.
