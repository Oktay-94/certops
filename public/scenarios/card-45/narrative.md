---
cardNumber: 45
slug: guardduty-security-hub-cspm-eventbridge-skontro-zentrale-erkennung
title: "GuardDuty · Security Hub · EventBridge — zentrale Erkennung und automatische Reaktion"
services:
  - Amazon GuardDuty
  - GuardDuty Extended Threat Detection
  - AWS Security Hub CSPM
  - Amazon EventBridge
  - AWS Lambda
  - Amazon SNS
  - Amazon S3
domains:
  - D1
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/guardduty/latest/ug/guardduty_findings_eventbridge.html"
  - "https://docs.aws.amazon.com/guardduty/latest/ug/findings_management.html"
  - "https://aws.amazon.com/guardduty/faqs/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/12/guardduty-extended-threat-detection-ec2-ecs/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/12/security-hub-near-real-time-risk-analytics/"
  - "https://aws.amazon.com/blogs/aws/unify-your-security-with-the-new-aws-security-hub-for-risk-prioritization-and-response-at-scale-preview/"
  - "https://aws.amazon.com/blogs/security/how-to-develop-an-aws-security-hub-poc/"
---

## Die Grundidee zuerst

Skontro, ein Zahlungsdienstleister, betreibt 30 AWS-Accounts unter einer Organization.

**Weg eins:** In jedem der 30 Räume hängt ein eigener Rauchmelder mit eigener Anzeige. Jeder Melder funktioniert einwandfrei. Nur schaut in Raum 17 gerade niemand hin. Ein kompromittierter EC2-Schlüssel blieb elf Tage unbemerkt — nicht weil die Erkennung versagt hätte, sondern weil im betroffenen Account niemand die Konsole aufmachte.

**Weg zwei:** Dieselben 30 Melder, aber alle Leitungen laufen in eine Brandmeldezentrale, und die Zentrale hat einen direkten Draht zur Sprinkleranlage. Niemand muss hinschauen, damit etwas passiert.

Der Unterschied zwischen den beiden Wegen ist nicht die Erkennung. Die war vorher schon da. Der Unterschied ist, dass es eine Stelle gibt, an der alles zusammenläuft, und einen Weg von dort zu einer Handlung, der ohne Menschen auskommt.

**Erkennung ohne zentrale Sicht ist eine Erkennung, die niemand liest.** Das ist der ganze Punkt der Karte, und die drei Zonen von links nach rechts sind genau das: erkennen, sammeln, handeln.

## Was es eigentlich ist — die EventBridge-Regel

Die Automatik auf der rechten Seite ist kein Dienst, den man einschaltet. Sie ist ein Regel-Dokument mit zwei Hälften: einem Muster, das auf Ereignisse passt, und einem Ziel, das dann angestoßen wird.

```json
{
  "source": ["aws.guardduty"],
  "detail-type": ["GuardDuty Finding"],
  "detail": {
    "type": [{ "prefix": "AttackSequence:" }]
  }
}
```

Vier Zeilen, und jede trifft eine Entscheidung. `source` grenzt auf GuardDuty ein — dieselbe Regel-Mechanik nimmt auch Ereignisse von hundert anderen Diensten entgegen. `detail-type` unterscheidet Findings von anderen GuardDuty-Ereignissen. Und `detail.type` mit `prefix` ist der interessante Teil: EventBridge kann bei Strings auf Präfixe matchen, und **jeder** Findingtyp aus der Extended Threat Detection beginnt mit `AttackSequence:`.

Alternativ filtert man numerisch auf `detail.severity`. Das Feld ist eine Zahl, keine Beschriftung — welche Zahlenbereiche AWS auf „Low", „Medium", „High" und „Critical" abbildet, schlägt man im User Guide nach, statt es zu raten. Der Präfix-Weg ist ohnehin der präzisere: Er trifft genau die korrelierten Angriffsketten und nicht jedes andere Finding, das zufällig dieselbe Stufe trägt.

## Der Weg durch die Karte

### Kasten — GuardDuty

GuardDuty wertet CloudTrail-Ereignisse, VPC Flow Logs und DNS-Abfragen aus. Es ist ein managed Service in einem strengen Sinn: Es gibt keine Regeln zu schreiben, keine Schwellenwerte zu setzen und keine Threat-Intelligence-Feeds zu pflegen. Einschalten und fertig.

Diese drei Quellen sind auch die Grenze. GuardDuty liest keine Anwendungslogs, keine Betriebssystemprotokolle und keine Objektinhalte. Was darüber hinausgeht, kommt aus zusätzlichen Protection Plans, die man einzeln aktiviert — S3 Protection, EKS Protection, Malware Protection, Runtime Monitoring. Der Basisdienst ist also nicht „GuardDuty sieht alles", sondern „GuardDuty sieht, wer welche API aufruft, mit wem eine Instanz spricht und welche Namen sie auflöst". Erstaunlich viele Angriffe hinterlassen genau dort ihre Spur, aber eben nicht alle.

Die Zeile `Findings bleiben 90 Tage` ist die wichtigste Zahl auf der ganzen Karte, und sie kommt gleich zweimal wieder.

### Pfeil 1 — Extended Threat Detection korreliert

Extended Threat Detection sitzt auf GuardDuty auf und verknüpft einzelne Signale über längere Zeiträume. Aus „Credential-Diebstahl" plus „ungewöhnlicher Datenabfluss" wird **ein** Critical-Finding statt zweier Einzelmeldungen, die niemand zusammenbringt.

Das Bild dazu: Drei Nachbarn melden je eine Kleinigkeit — ein fremdes Auto, ein Geräusch, eine offene Tür. Einzeln ist keine Meldung einen Anruf wert. Zusammengelegt und in die richtige Reihenfolge gebracht ergeben sie einen Einbruch.

Das Finding trägt eine Ereignis-Zeitleiste und eine Zuordnung zu MITRE ATT&CK. Seit dem 02.12.2025 gibt es zwei weitere Typen, `AttackSequence:EC2/CompromisedInstanceGroup` und `AttackSequence:ECS/CompromisedCluster`. Kursmaterial von vor 2025 kennt das Konzept „Attack Sequence" nicht.

### Pfeil 2 — Findings laufen im Delegated Admin Account zusammen

In einer Organization wird ein Account zum delegierten Administrator ernannt. Dort landen die Findings aller Mitgliedskonten.

Genau das löst das Problem des ersten Entwurfs: Es gibt eine Stelle zum Hinschauen, nicht dreißig. AWS empfiehlt dafür einen eigenen Security-Tooling-Account, und derselbe Account muss in jeder Region designiert sein.

Der Kasten trägt Navy, weil er eine **Account-Grenze** markiert und nicht einen Dienst. Das ist die Bedeutung, die Navy in dieser Kartenserie neben „Eintrittspunkt" trägt, und hier ihr klarster Fall.

### Pfeil 3 — Security Hub CSPM sammelt und normalisiert

Neben GuardDuty fließen Inspector (Schwachstellen), Macie (sensible Daten) und IAM Access Analyzer (öffentliche oder kontenübergreifende Ressourcen) ein. Alles wird ins AWS Security Finding Format übersetzt — **ASFF** —, damit Findings verschiedener Herkunft vergleichbar werden.

Normalisierung klingt nach Formalität und ist der eigentliche Wert: Ohne gemeinsames Format kann eine Regel nicht „alle kritischen Befunde" filtern, weil jeder Dienst „kritisch" anders benennt.

### Pfeil 4 — was länger bleiben soll, wird weggeschrieben

GuardDuty hält Findings 90 Tage, danach sind sie weg. Die Frist ist ein Kontingent, das sich nicht erhöhen lässt.

Wer für Audits längere Zeiträume nachweisen muss, hat zwei Wege: den eingebauten Export nach S3 oder die Weiterleitung über EventBridge an ein eigenes Ziel. Beide muss man vorher eingerichtet haben — rückwirkend exportieren geht nicht, weil es nach 90 Tagen nichts mehr zu exportieren gibt.

Die beiden Wege sind nicht dasselbe, und die Wahl ist eine Betriebsentscheidung. Der S3-Export ist der bequeme: eingebaut, je Region konfiguriert, ohne eigenen Code, und er legt die Findings dort ab, wo man sie mit Athena abfragen kann. Die EventBridge-Weiterleitung ist der flexible: Sie kann in ein SIEM, in eine eigene Datenbank oder in ein Ticketsystem gehen und dabei filtern, was überhaupt aufbewahrt wird. Wer eine gesetzliche Aufbewahrungsfrist erfüllen muss, nimmt den Export; wer die Findings weiterverarbeiten will, nimmt EventBridge. Nichts hindert daran, beides gleichzeitig zu betreiben — der Kasten auf der Karte trägt deshalb beide Zeilen.

### Pfeil 5 — GuardDuty veröffentlicht jedes Finding an EventBridge

Das läuft **parallel** zur Sammlung in Security Hub, nicht danach. Deshalb geht der Pfeil auf der Karte von GuardDuty aus und nicht aus der zentralen Sicht.

Das ist bewusst so gezeichnet und fachlich der Kern: Die Reaktion hängt nicht davon ab, dass Security Hub das Finding zuerst verarbeitet hat. Ein Pfeil durch Security Hub würde eine Abhängigkeit suggerieren, die es nicht gibt — und in einer Prüfungsfrage nach „schnellstmöglicher automatischer Reaktion" wäre das genau der falsche Gedanke.

### Pfeil 6 — Regel filtert, Lambda isoliert

Die Lambda-Funktion isoliert die betroffene Instanz, typischerweise durch Zuweisen einer Security Group ohne Regeln.

Warum eine leere Security Group und nicht „Instanz stoppen": Stoppen wirft den Arbeitsspeicher weg, und damit den größten Teil der Forensik. Eine Security Group ohne Regeln nimmt der Instanz jede Netzverbindung, lässt sie aber laufen. Das ist der Unterschied zwischen „jemand sieht es irgendwann" und „die Instanz ist in Sekunden vom Netz, und man kann sie hinterher noch untersuchen".

### Pfeil 7 — SNS weckt das Bereitschaftsteam

Automatische Isolierung ersetzt keine Benachrichtigung. Die Automatik gewinnt Zeit, die Entscheidung über das weitere Vorgehen bleibt bei Menschen.

Der Pfeil geht von EventBridge aus, nicht von Lambda. Die Benachrichtigung hängt also nicht daran, dass die Isolierung geklappt hat — sonst wäre ausgerechnet der Fall, in dem die Automatik scheitert, auch der Fall ohne Alarm.

### Der verworfene Weg — jedes Team prüft selbst

Dezentral ohne zentrale Sicht heißt: Erkennung findet statt, Reaktion nicht. Elf Tage sind kein Erkennungsproblem, sie sind ein Organisationsproblem, das mit einer Zeile Konfiguration verschwindet.

Warum das strukturell scheitert und nicht an schlampigen Teams liegt: Bei 30 Accounts ist die Wahrscheinlichkeit, dass an einem beliebigen Tag *jeder* Account bemannt ist, das Produkt aus 30 Einzelwahrscheinlichkeiten. Selbst bei 95 Prozent je Account schaut an jedem zweiten Tag irgendwo niemand hin. Genau in dieses Loch fällt der eine Account, der gerade angegriffen wird — und weil das Team dort das Finding nie sieht, existiert für den Rest der Organisation auch keine Meldung, die man eskalieren könnte.

Der delegierte Administrator dreht die Rechnung um: Statt 30 Stellen, die alle funktionieren müssen, gibt es eine, die funktionieren muss. Das ist die gleiche Logik, aus der auch der Rest der Karte gebaut ist.

## Die entscheidende Unterscheidung

| Dienst | Beantwortet die Frage | Datenquelle |
|---|---|---|
| **GuardDuty** | Tut gerade jemand etwas Verdächtiges? | CloudTrail, VPC Flow Logs, DNS |
| **Inspector** | Ist etwas angreifbar? | Software- und Paketstände |
| **Macie** | Liegt irgendwo etwas Schützenswertes? | S3-Objektinhalte |
| **IAM Access Analyzer** | Ist etwas offen, das zu sein sollte? | Ressourcen-Policies |
| **Security Hub CSPM** | Ist etwas falsch konfiguriert — und wie steht alles zusammen? | die vier oben plus eigene Prüfungen |
| **AWS Config** | In welchem Zustand ist die Ressource? | Ressourcen-Historie |

Drei verschiedene Fragen, ein gemeinsamer Sammelpunkt. Die Verwechslung, die in Prüfungen am häufigsten vorkommt: GuardDuty findet **Verhalten**, keine Fehlkonfiguration. „Ist mein Bucket öffentlich?" beantwortet Security Hub CSPM oder IAM Access Analyzer, nicht GuardDuty.

Die zweite Achse trennt Verteilung von Benachrichtigung: **EventBridge** ist der Verteiler mit Filterlogik, **SNS** die Benachrichtigung. In Fragen nach „automatisch reagieren" ist EventBridge die Antwort; SNS allein benachrichtigt nur.

## Die ehrliche Feinheit

**„Automatisch aktiv, ohne Aufpreis" stimmt — und führt trotzdem zum falschen Schluss.**

Die Kartenzeile stammt wörtlich aus der AWS-Ankündigung: Extended Threat Detection ist für alle GuardDuty-Kunden automatisch aktiv und kostet nichts extra. Zwei Sätze weiter in derselben Ankündigung steht der Rest: Die Erkennungstiefe hängt von den aktivierten **Protection Plans** ab. Für Angriffsketten auf EC2 braucht es Runtime Monitoring für EC2; für kompromittierte ECS-Cluster Runtime Monitoring für Fargate oder EC2, je nach Infrastruktur. Runtime Monitoring ist ein kostenpflichtiger Protection Plan.

Die Korrelation ist also gratis, die Signale, die sie korreliert, sind es nicht. Wer GuardDuty nackt betreibt, bekommt `AttackSequence:IAM/CompromisedCredentials` aus CloudTrail-Signalen — die EC2- und ECS-Ketten aber nicht.

**Oktays Entscheidung 11.08.: Die Karte bleibt unverändert, das Narrativ trägt die Einschränkung.** Für die Prüfung ist die Kartenzeile richtig; in einem Architekturgespräch wäre sie unvollständig.

**Zweite Feinheit: die Benachrichtigungsfrequenz ist zweigeteilt, und nur eine Hälfte lässt sich ändern.** Neue Findings mit eigener Finding-ID gehen nahezu in Echtzeit an EventBridge, und diese Frequenz ist **nicht** einstellbar. Wiederholungen desselben Findingtyps werden aggregiert und standardmäßig erst nach sechs Stunden gemeldet; hier sind 15 Minuten, 1 Stunde oder 6 Stunden wählbar. Zwei Details mit Prüfungspotenzial: Wer nur die Wiederholungen beobachtet, hält EventBridge fälschlich für langsam. Und ändern darf die Frequenz **nur der Administrator-Account** — ein Mitgliedskonto kann sie nicht einmal für sich selbst setzen.

**Dritte Feinheit: „Security Hub" bedeutet heute zwei verschiedene Dinge.** Seit Juni 2025 heißt der bisherige Dienst **AWS Security Hub CSPM**. Der Name „Security Hub" ging an einen neuen, anderen Dienst, der auf CSPM aufsitzt und Signale aus GuardDuty, Inspector und CSPM korreliert und priorisiert. Der neue Dienst wurde am 02.12.2025 allgemein verfügbar; im Februar 2026 kam mit **Security Hub Extended** ein weiterer Plan dazu, der Partnerlösungen einbindet.

Der prüfungsrelevante Unterschied ist das Format: **CSPM normalisiert nach ASFF, der neue Security Hub arbeitet mit OCSF.** Die Formate sind nicht kompatibel. Eine bestehende Automatisierung, die ASFF-Felder auswertet, verarbeitet OCSF-Findings nicht. AWS hat für CSPM keinen Abkündigungszeitpunkt genannt; beide existieren nebeneinander. Jedes Kursmaterial vor Mitte 2025 meint mit „Security Hub" das, was heute Security Hub CSPM heißt — und in SAA-C03-Fragen ist fast immer diese ältere Bedeutung gemeint.

## Syntax lesen

Die vollständige Regel, wie man sie anlegt, macht sichtbar, dass ein Ziel nicht genügt:

```bash
aws events put-rule \
  --name skontro-attack-sequence \
  --event-pattern file://pattern.json

aws events put-targets \
  --rule skontro-attack-sequence \
  --targets \
    'Id=isolate,Arn=arn:aws:lambda:eu-central-1:111122223333:function:isolateInstance' \
    'Id=page,Arn=arn:aws:sns:eu-central-1:111122223333:security-oncall'
```

Zwei Targets an **einer** Regel — das sind die Pfeile 6 und 7 auf der Karte. EventBridge stellt an alle Ziele zu, und zwar unabhängig voneinander. Scheitert die Lambda, geht die SNS-Nachricht trotzdem raus. Genau deshalb hängen beide Pfeile an EventBridge und nicht hintereinander.

Ein Blick in das Finding selbst zeigt, woher die Lambda weiß, was sie isolieren soll:

```json
{
  "detail": {
    "type": "AttackSequence:EC2/CompromisedInstanceGroup",
    "severity": 9,
    "accountId": "444455556666",
    "region": "eu-central-1",
    "resource": { "instanceDetails": { "instanceId": "i-0abc123def4567890" } }
  }
}
```

`accountId` ist der Grund, warum die Lambda im Delegated Admin Account eine Rolle im Mitgliedskonto annehmen muss, bevor sie irgendetwas ändern kann. Das Finding kommt zentral an, die Instanz steht dezentral. Ohne diese Rolle bleibt die Automatik eine Benachrichtigung.

## Was du dadurch nicht baust

- **Keine Aufbewahrung über 90 Tage.** Ohne vorher eingerichteten Export oder EventBridge-Weiterleitung sind die Findings danach weg, und das lässt sich nicht nachholen.
- **Keine Prävention.** GuardDuty erkennt, es blockiert nicht. Alles, was die Karte an Reaktion zeigt, passiert *nach* dem Vorfall.
- **Keine Konfigurationsprüfung durch GuardDuty.** Offene Buckets, fehlende Verschlüsselung, zu weite Policies — das ist CSPM-Gebiet.
- **Keine regionsübergreifende Sicht von allein.** GuardDuty ist regional. Der delegierte Administrator muss in jeder Region derselbe Account sein, und die Zusammenführung über Regionen hinweg läuft über Security Hub oder einen eigenen Sammelpunkt.
- **Keine Übernahme bestehender Automatisierung in den neuen Security Hub.** Wer heute ASFF auswertet, muss für OCSF neu bauen.

## Wenn du dir eine Sache merkst

**GuardDuty findet, Security Hub sammelt, EventBridge handelt — und was länger als 90 Tage bleiben soll, muss weggeschrieben werden.**

Damit fallen drei Distraktoren:

- „GuardDuty in jedem Account einzeln prüfen" ist der verworfene Pfad und der Grund für die elf Tage.
- „SNS-Benachrichtigung einrichten" erfüllt „jemand erfährt davon", nicht „es wird automatisch reagiert".
- „Aufbewahrungsfrist in GuardDuty erhöhen" gibt es nicht. Die 90 Tage sind ein festes Kontingent.

## Prüfungsknackpunkte

**Signalwörter für den delegierten Administrator:** „detect threats across multiple accounts", „centralized view of security findings", „delegated administrator account". Sobald eine Organization mit mehreren Accounts im Text steht, ist der delegierte Administrator der vorgesehene Weg.

**Signalwörter für EventBridge plus Lambda:** „respond automatically without manual intervention", „isolate the compromised instance". Das Wort „automatically" trennt EventBridge von SNS.

**Signalwort für den Export:** „retain findings beyond the default period". Die Antwort ist Export nach S3 oder Weiterleitung über EventBridge — nicht „GuardDuty aktivieren".

**Warum „GuardDuty prüft meine Konfiguration" hier verliert:** GuardDuty findet Verhalten. Die Frage nach einem öffentlichen Bucket beantworten Security Hub CSPM oder IAM Access Analyzer.

**Warum „für jeden Account eine eigene Auswertung" hier verliert:** Es ist genau der Zustand, der die elf Tage erzeugt hat. Erkennung ohne Sammelpunkt ist keine Erkennung.

**Warum „EventBridge ist zu langsam" hier verliert:** Neue Findings gehen nahezu in Echtzeit raus. Die sechs Stunden gelten nur für Wiederholungen desselben Findings — wer das verwechselt, verwirft die richtige Antwort.

**Die Namensfalle:** Steht in einer Frage „Security Hub" und geht es um das Sammeln und Normalisieren von Findings anderer Dienste, ist Security Hub CSPM gemeint. Der Dienst, der heute „Security Hub" heißt, korreliert und priorisiert und arbeitet mit OCSF. Derzeit die gefährlichste Namensverwechslung im gesamten Security-Bereich.
