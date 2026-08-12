---
cardNumber: 86
slug: cost-explorer-budgets-anomaly-detection
title: "Cost Explorer, Budgets, Anomaly Detection"
services: ["AWS Cost Explorer", "AWS Budgets", "AWS Cost Anomaly Detection", "Amazon SNS", "AWS Systems Manager", "AWS Organizations"]
domains: ["D4"]
correctAnswer: "C"
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_AnomalySubscription.html"
  - "https://aws.amazon.com/aws-cost-management/aws-cost-anomaly-detection/faqs/"
  - "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html"
  - "https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-best-practices.html"
  - "https://aws.amazon.com/aws-cost-management/aws-budgets/pricing/"
  - "https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_budgets_SsmActionDefinition.html"
  - "https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_budgets_CreateBudgetAction.html"
  - "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-api-best-practices.html"
  - "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-chart.html"
  - "https://aws.amazon.com/aws-cost-management/aws-cost-explorer/pricing/"
  - "https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostForecast.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, einen defekten Heizlüfter im Keller zu bemerken.

**Weg eins:** Du klebst einen Zettel an den Stromzähler. „Bei 300 Kilowattstunden bitte anrufen." Das funktioniert — aber nur, wenn du vorher weißt, wo die Grenze liegt. Und der Anruf kommt an dem Tag, an dem das Geld schon ausgegeben ist. Steht der Zettel auf 300, und der Lüfter frisst in vier Tagen 290, klingelt nie ein Telefon.

**Weg zwei:** Jemand schaut sich drei Wochen lang an, wie dein Haushalt Strom verbraucht. Montags viel, sonntags wenig, nachts fast nichts. Danach braucht er keine Zahl mehr. Er meldet sich, wenn Dienstagnacht plötzlich das Dreifache durch die Leitung geht — auch wenn das absolut betrachtet noch weit unter jeder Grenze liegt.

Weg eins ist AWS Budgets: eine Grenze, die du setzt, und daran hängt eine Hand am Schalter. Weg zwei ist AWS Cost Anomaly Detection: ein gelerntes Muster, gegen das jeder Tag verglichen wird.

Und dann gibt es noch die dritte Person — die, die anschließend in den Keller geht und nachsieht, *welches* Gerät es war. Das ist Cost Explorer.

Drei Werkzeuge, drei Verben: **erkennen, erklären, erzwingen.** Wer im Examen nur eines davon nennt, hat die Frage meist nur zu einem Drittel beantwortet.

Das Szenario der Karte ist der Heizlüfter in AWS-Form: Ein Dev-Konto liegt seit Monaten bei etwa 41 Euro Tagesausgabe. Freitagabend setzt jemand eine Route falsch, der komplette Egress-Verkehr läuft ab da über ein NAT Gateway, und die Tagesausgabe springt auf rund 130 Euro. Absolut ist das keine Katastrophe. Es fällt nur bis zur Monatsrechnung niemandem auf — und bis dahin sind aus drei Tagen Wochenende etwa 270 Euro geworden, die niemand bestellt hat.

## Was es eigentlich ist — ein Datensatz, der auf Muster horcht

Cost Anomaly Detection ist kein Agent, kein Prozess und kein Dienst, der irgendwo läuft. Es sind zwei Datensätze: ein **Monitor**, der sagt, welcher Ausschnitt deiner Rechnung beobachtet wird, und eine **Subscription**, die sagt, wer davon erfährt und ab wann.

```json
{
  "SubscriptionName": "dev-checkout-sofort",
  "MonitorArnList": [
    "arn:aws:ce::123456789012:anomalymonitor/services-monitor"
  ],
  "Subscribers": [
    { "Type": "SNS", "Address": "arn:aws:sns:eu-central-1:123456789012:cost-alerts" }
  ],
  "Frequency": "IMMEDIATE",
  "ThresholdExpression": {
    "Dimensions": {
      "Key": "ANOMALY_TOTAL_IMPACT_ABSOLUTE",
      "Values": ["100"],
      "MatchOptions": ["GREATER_THAN_OR_EQUAL"]
    }
  }
}
```

Lies das von oben nach unten. Welcher Monitor (`MonitorArnList`), wer wird benachrichtigt (`Subscribers`), wie schnell (`Frequency`), und ab welchem Schaden überhaupt (`ThresholdExpression`).

Und jetzt die Zeile, die im Examen zählt: `Frequency` und `Type` sind nicht frei kombinierbar. `IMMEDIATE` wird über SNS zugestellt, `DAILY` und `WEEKLY` über E-Mail. Wer „sofort" will, braucht ein SNS-Topic — eine E-Mail-Adresse allein liefert bestenfalls die Tageszusammenfassung.

Der Threshold ist kein Erkennungs-Schwellwert. Er filtert nur die Benachrichtigung. Eine Anomalie unter 100 US-Dollar wird trotzdem erkannt und steht in der Konsole — sie löst nur keinen Alarm aus.

## Der Weg durch die Karte

### Kasten — Kosten- und Nutzungsdaten

Ganz links steht kein Werkzeug, sondern eine Quelle. Billing and Cost Management sammelt die Kosten- und Nutzungsdaten ein, und **alle drei goldenen Kästen auf dieser Karte lesen aus genau diesem einen Strom.** Keines der drei misst selbst irgendetwas.

Das erklärt die wichtigste Eigenschaft der ganzen Karte: Diese Daten werden mindestens einmal täglich aktualisiert. Die Best-Practice-Seite zur Cost-Explorer-API präzisiert das auf bis zu dreimal täglich. Was daraus folgt, steht weiter unten unter „Die ehrliche Feinheit" — es ist der Punkt, an dem die meisten Leute diese Karte falsch lesen.

### Badge 1 — Cost Anomaly Detection erkennt

Der Dienst lernt per Machine Learning, wie dein Ausgabenmuster aussieht, und meldet Abweichungen. **Es muss vorher keine Schwelle definiert werden.** Genau das ist der Unterschied zu allem anderen auf dieser Karte.

Vier Arten von Monitoren stehen zur Wahl: über alle AWS-Services, über Linked Accounts, über Cost Categories oder über Cost Allocation Tags. Ein Service-Monitor plus bis zu 500 eigene sind möglich.

Zwei Voraussetzungen, die gern übersehen werden: Ein Monitor braucht mindestens 10 Tage historische Nutzungsdaten, bevor er überhaupt etwas erkennen kann, und nach dem Anlegen vergehen bis zu 24 Stunden bis zur ersten möglichen Erkennung. Ein frisch aufgesetztes Konto ist also blind — und zwar genau in der Phase, in der die meisten teuren Anfängerfehler passieren.

Seit März 2023 richtet AWS für neue Cost-Explorer-Kunden automatisch einen Service-Monitor mit täglicher E-Mail ein. Dessen Voreinstellung meldet, was gleichzeitig mehr als 40 Prozent über der erwarteten Ausgabe liegt **und** mindestens 100 US-Dollar Wirkung hat. Der Dienst kostet nichts.

### Badge 2 — die Alert-Zustellung

Der Alarm geht raus: entweder sofort an ein SNS-Topic oder als Tages- beziehungsweise Wochenzusammenfassung per E-Mail. Pro Subscription sind bis zu 10 E-Mail-Empfänger oder genau ein SNS-Topic erlaubt.

Im Alarm steckt bereits eine erste Diagnose: AWS nennt bis zu 10 Root Causes mit geschätzter Dollar-Zuordnung — Service, Konto, Region, Usage Type. Das ist eine Fährte, keine Erklärung. Die Summe der genannten Ursachen kann kleiner *oder größer* sein als die Gesamtwirkung der Anomalie, weil die Anomalie eine Netto-Änderung ist und die Root Causes nur die Anstiege zeigen.

Das Bild dazu: Der Alarm sagt dir, dass im Haus jemand zu viel Strom zieht, und zeigt in Richtung Keller. Er sagt nicht, dass es der Heizlüfter ist.

### Badge 3 — der Zeilenumbruch

Der türkise Pfeil, der vom Alert nach links unten in das zweite Band führt, ist kein Automatismus. Er ist der Moment, in dem ein Mensch — oder eine Automatisierung, die jemand gebaut hat — die Mail öffnet und beschließt, nachzusehen.

Auf der Karte sieht das aus wie eine Kette. In Wirklichkeit ist es eine Bruchstelle. Alles links davon passiert von allein. Alles rechts davon musst du vorher eingerichtet haben.

Das ist auch die Antwort auf die naheliegende Frage, warum Anomaly Detection nicht einfach selbst abschaltet: Es hat keine Aktionen. Der Dienst kann erkennen und benachrichtigen, mehr nicht. Wer eine automatische Reaktion will, hängt sie an das SNS-Topic — oder er baut die Grenze, die zuverlässig stoppt, mit AWS Budgets. Die Karte wählt bewusst den zweiten Weg, weil er ohne eine Zeile eigenen Code auskommt.

### Kasten — Cost Explorer erklärt das Warum

Jetzt die Diagnose. Cost Explorer gruppiert rückblickend: nach Service, Usage Type, Region, Linked Account oder Cost Allocation Tag. Bei unserem Dev-Konto führt das in drei Klicks zum Ziel. Gruppiert nach Service steht plötzlich EC2-Other ganz oben statt EC2-Instances; ein zweites Group-by nach Usage Type zeigt `NatGateway-Bytes`, und damit ist klar, dass nicht mehr Rechenleistung, sondern durchgeleiteter Verkehr das Geld frisst.

Genau diese zwei Achsen sind der Grund, warum Cost Explorer auf der Karte steht: Der Alarm hat auf den Keller gezeigt, die Gruppierung zeigt auf das Gerät.

Zwei Zahlen dazu: Die Oberfläche ist kostenlos. Die API kostet 0,01 US-Dollar **pro paginiertem Request** — eine Abfrage, die zehn Seiten zurückgibt, kostet zehn Cent. Und stündliche Auflösung ist ein kostenpflichtiges Opt-in mit 14 Tagen Rückblick.

**Cost Explorer alarmiert nicht.** Es hat keinen Auslöser, keine Aktion, keinen Empfänger. Wer es in einer Prüfungsantwort als Alarmwerkzeug sieht, hat den Kasten falsch gelesen.

### Badge 4 — AWS Budgets zieht die Grenze

Ein Budget feuert auf `ACTUAL` oder auf `FORECASTED` Kosten. Der Unterschied ist prüfungsrelevant und hat eine unangenehme Konsequenz: Für eine Prognose braucht AWS rund fünf Wochen Nutzungsdaten. Ein forecast-basierter Alarm in einem zwei Wochen alten Konto feuert nie.

Zweiter Unterschied: Ein `ACTUAL`-Alarm kommt genau einmal pro Budgetperiode, beim ersten Überschreiten. Ein `FORECASTED`-Alarm kann mehrfach kommen, wenn die Prognose die Schwelle überschreitet, wieder darunter fällt und erneut übersteigt.

Ein Budget muss außerdem nicht auf Geld zeigen. AWS Budgets kennt Kosten-, Nutzungs- und Abdeckungs-Budgets: Du kannst genauso auf die Auslastung deiner Reserved Instances oder auf die Coverage deiner Savings Plans budgetieren. Für diese Karte zählt der Kostenfall, aber die Frage „welche Art von Budget passt zur Frage" taucht im Examen auf.

Reines Monitoring ist kostenlos. Bezahlt wird erst die Aktion: Die ersten zwei action-enabled Budgets sind pro Monat frei, danach kostet jedes weitere 0,10 US-Dollar pro Tag — unabhängig davon, wie viele Aktionen daran hängen und ob sie je auslösen. Budgets-Reports per E-Mail kosten separat 0,01 US-Dollar je zugestelltem Report.

### Badge 5 — die Ressource wird gestoppt

Drei Aktionstypen, mehr gibt es nicht: eine IAM-Policy anhängen, eine SCP anwenden, oder EC2- beziehungsweise RDS-Instanzen über Systems Manager stoppen. Bis zu 100 Instanz-IDs pro Aktion.

Die Einschränkung, die AWS ausdrücklich als Hinweis in die Doku geschrieben hat: Aus dem Management Account kannst du eine SCP auf ein anderes Konto anwenden — **EC2- oder RDS-Instanzen in einem fremden Konto kannst du nicht stoppen.** Die Execution Role muss im selben Konto liegen wie die Aktion.

Und `ApprovalModel` entscheidet, ob das automatisch läuft oder erst nach Freigabe durch einen Menschen. Für ein Dev-Konto am Wochenende ist `AUTOMATIC` der Punkt der ganzen Übung.

### Der verworfene Kasten — nur die Budget-Mail bei 100 Prozent

Der rote Pfad. Ein Budget ohne Aktion, das bei 100 Prozent eine Mail schickt.

Rechne nach, was das im Szenario leistet: Die Route wird Freitagabend falsch gesetzt. Die Mail kommt, wenn das Monatsbudget aufgebraucht ist — also nachdem das Geld weg ist. Und sie landet Samstagmorgen in einem Postfach, in das bis Montag niemand schaut. Das ist kein Schutz, das ist ein Protokoll.

Beachte: Der Kasten bleibt auf der Karte golden. Ein schlechtes Governance-Werkzeug ist immer noch ein Governance-Werkzeug — rot ist nur der Weg dorthin.

## Die entscheidende Unterscheidung

| | Cost Anomaly Detection | AWS Budgets | Cost Explorer |
|---|---|---|---|
| Frage | Ist das ungewöhnlich? | Ist die Grenze erreicht? | Woher kommt das? |
| Schwelle vorher nötig | nein | ja | entfällt |
| Blickrichtung | gelerntes Muster gegen heute | Ist oder Prognose gegen Grenze | rückwärts |
| Kann eingreifen | nein | ja, drei Aktionstypen | nein |
| Kosten | keine | Monitoring frei, Aktionen ab dem dritten Budget | Oberfläche frei, API pro Request |

## Die ehrliche Feinheit

Drei Dinge, die die Karte aus Platzgründen glattzieht.

**Erstens: „IMMEDIATE" heißt nicht sofort.** Cost Anomaly Detection läuft ungefähr dreimal täglich, nachdem die Abrechnungsdaten verarbeitet wurden, und diese Daten haben laut AWS bis zu 24 Stunden Latenz. `IMMEDIATE` bedeutet also: sofort nach der *Erkennung* — nicht sofort nach der *Ausgabe*. Der Wochenend-Vorfall aus dem Szenario wird realistisch am Samstag oder Sonntag sichtbar, nicht Freitag um 18:42. Die Karte verspricht „am selben Tag sichtbar"; ehrlicher ist „innerhalb eines Tages, nachdem AWS die Daten verarbeitet hat".

**Zweitens: Der Stopp hält nicht immer.** AWS schreibt in den Best Practices zu Budgets ausdrücklich: Stoppt eine Budget Action eine EC2-Instanz, die zu einer Auto Scaling Group gehört, startet Auto Scaling sie wieder — oder ersetzt sie durch eine neue. Die Aktion ist dann wirkungslos, solange du nicht eine zweite Aktion danebenstellst, die der Rolle hinter der ASG die Rechte entzieht. Eine Karte mit dem Kasten „Ressource gestoppt" suggeriert eine Endgültigkeit, die es so nicht gibt.

**Drittens: Die drei sind nicht gleichrangig.** Cost Anomaly Detection ist ohne Cost Explorer nicht zu haben — AWS schreibt in den FAQ ausdrücklich, dass es keinen Weg gibt, das eine ohne das andere zu aktivieren. Auf der Karte stehen drei goldene Kästen nebeneinander, als wären es drei Optionen; tatsächlich ist einer davon die Voraussetzung für einen anderen. Und Cost Explorer selbst lässt sich nach dem Aktivieren nicht wieder abschalten. Das ist keine Falle, aber es ist eine Einbahnstraße, und in einer Prüfungsfrage nach „welcher Dienst muss zuerst eingeschaltet werden" ist es die Antwort.

**Viertens: Zu Cost Explorer steht bewusst keine Zahl auf der Karte.** Die AWS-Dokumentation widerspricht sich selbst. Die Seite „Analyzing your costs and usage" nennt 13 Monate Historie und 18 Monate Forecast. Die Seite zum Cost-Explorer-Chart nennt 13 Monate und 12 Monate. Die API-Best-Practices nennen 3 Monate täglich und 12 Monate monatlich. Und innerhalb derselben API-Referenz nennt `GetCostForecast` 18 Monate monatlich, während `GetUsageForecast` an gleicher Stelle 12 Monate nennt. Nach Projektregel steht damit keine dieser Zahlen im Text. Für die Prüfung reicht: gut ein Jahr rückwärts, etwa ein Jahr vorwärts.

## Syntax lesen — die Budget Action

Die Aktion aus Badge 5, so wie sie tatsächlich angelegt wird:

```json
{
  "ActionType": "RUN_SSM_DOCUMENTS",
  "NotificationType": "FORECASTED",
  "ActionThreshold": {
    "ActionThresholdType": "PERCENTAGE",
    "ActionThresholdValue": 90.0
  },
  "ApprovalModel": "AUTOMATIC",
  "ExecutionRoleArn": "arn:aws:iam::123456789012:role/BudgetsActionRole",
  "Definition": {
    "SsmActionDefinition": {
      "ActionSubType": "STOP_EC2_INSTANCES",
      "Region": "eu-central-1",
      "InstanceIds": ["i-0a1b2c3d4e5f6a7b8"]
    }
  }
}
```

Vier Felder tragen die ganze Entscheidung:

```
ActionType        →  IAM-Policy | SCP | SSM-Dokument
NotificationType  →  ACTUAL (schon passiert) | FORECASTED (wird passieren)
ApprovalModel     →  AUTOMATIC | MANUAL
ExecutionRoleArn  →  in wessen Namen gehandelt wird
```

`FORECASTED` plus `AUTOMATIC` plus 90 Prozent ist die Kombination, die im Szenario greift: Es wird gestoppt, *bevor* das Budget voll ist, ohne dass jemand wach sein muss. `ACTUAL` plus `MANUAL` bei 100 Prozent ist der rote Pfad mit zusätzlichen Schritten.

Und `ExecutionRoleArn` ist der Grund, warum das nicht im fremden Konto funktioniert: Rolle und Aktion müssen im selben Konto liegen.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein hartes Ausgabenlimit — AWS kappt dein Konto nicht bei einer Summe
- keine Echtzeit-Kostenmessung, weil die Datenquelle täglich aktualisiert wird
- kein Schutz vor der ersten teuren Nacht in einem neuen Konto: 10 Tage Historie für Anomalien, rund 5 Wochen für Prognosen
- keine Löschung von Ressourcen — gestoppt heißt gestoppt, nicht weg
- kein Eingriff in fremde Konten außer per SCP aus dem Management Account
- kein Ersatz für CloudWatch-Alarme auf technischen Metriken; hier geht es ausschließlich um Geld

## Wenn du dir eine Sache merkst

**Anomaly Detection erkennt ohne Schwelle, Budgets erzwingt eine Grenze mit Aktion, Cost Explorer erklärt das Warum — und keines der drei ersetzt die anderen zwei.**

Ein CloudWatch-Billing-Alarm kennt nur eine feste Zahl und kann nichts stoppen. Ein Cost and Usage Report ist eine Datei, kein Alarm. Trusted Advisor prüft Empfehlungen, nicht dein Ausgabenmuster.

## Prüfungsknackpunkte

**Signalwörter:** „detect unusual spending automatically" und „without defining a threshold" zeigen immer auf Cost Anomaly Detection. „Automatically stop resources when the budget is exceeded" zeigt auf AWS Budgets mit Budget Action. „Identify the root cause of a cost increase" zeigt auf Cost Explorer. Steht „least operational overhead" dabei, ist die Eigenbau-Lösung aus Lambda plus Cost-Explorer-API garantiert falsch.

**Die SNS-Falle.** Ein Szenario verlangt sofortige Benachrichtigung und nennt nur E-Mail-Adressen. Sofort geht ausschließlich über SNS.

**Die SCP-Falle.** Ein Budget im Management Account soll Instanzen in einem Mitgliedskonto stoppen. Geht nicht — die SCP schon, die Instanzen nicht.

**Die Auto-Scaling-Falle.** „Stop EC2 instances" in einer ASG ist wirkungslos ohne zweite Aktion.

**A — CloudWatch-Billing-Alarm:** Feste Schwelle, keine Aktion, älterer Weg. Existiert weiterhin, ist aber bei „least operational overhead" nie die erwartete Antwort.

**B — Täglicher Cost-Explorer-Report:** Erklärt rückblickend und alarmiert nicht. Jemand muss ihn lesen.

**D — Cost and Usage Report nach Athena und QuickSight:** Technisch mächtiger, operativ das Gegenteil von wenig Aufwand. Bei „root cause" ohne Zusatzaufwand gewinnt Cost Explorer.

**E — Trusted Advisor:** Liefert Optimierungs-Checks, keine Anomalie-Erkennung auf deinem Ausgabenmuster und keine Stopp-Aktion.
