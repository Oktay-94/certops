---
cardNumber: 4
slug: lambda-snapstart-payfast-coldstart
title: "Battle Card 4 — Lambda Cold Start: SnapStart vs. Provisioned Concurrency"
services: ["AWS Lambda", "Lambda SnapStart", "Provisioned Concurrency", "Amazon API Gateway"]
domains: ["D3"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-07-28"
sources:
  - "https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html"
  - "https://docs.aws.amazon.com/lambda/latest/dg/provisioned-concurrency.html"
  - "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-execution-service-limits-table.html"
  - "https://aws.amazon.com/blogs/aws/aws-lambda-snapstart-for-python-and-net-functions-is-now-generally-available/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/06/amazon-api-gateway-integration-timeout-limit-29-seconds/"
---

## Die Grundidee zuerst

Stell dir drei Zustände deines Laptops vor, wenn du morgens ins Büro kommst.

**Zustand eins:** Der Rechner ist aus. Du drückst den Knopf, das BIOS meldet sich, das Betriebssystem lädt, dann startet dein Editor, deine Datenbankverbindung, dein Passwort-Manager. Nach zwei Minuten kannst du arbeiten. Kosten über Nacht: null.

**Zustand zwei:** Der Rechner war im Ruhezustand. Beim Zuklappen hat er den kompletten Arbeitsspeicher auf die Platte geschrieben — jedes offene Fenster, jede geladene Bibliothek, jeden Zwischenstand. Beim Aufwachen kopiert er dieses Abbild zurück. Nach ein paar Sekunden steht alles da wie gestern. Kosten über Nacht: der Plattenplatz für das Abbild.

**Zustand drei:** Du hast den Rechner einfach durchlaufen lassen. Du klappst ihn auf und tippst. Kosten über Nacht: Strom, die ganze Nacht.

Das sind die drei Optionen dieser Karte, und zwar nicht als Vergleich, sondern als Beschreibung. Zustand eins ist der **Cold Start**. Zustand zwei ist **SnapStart** — AWS macht einen Snapshot der fertig initialisierten Umgebung und kopiert ihn zurück, statt neu hochzufahren. Zustand drei ist **Provisioned Concurrency** — die Umgebung läuft einfach weiter.

Und weil das Bild so genau passt, trägt es auch die Kostenfrage, um die es in der Prüfung fast immer geht: **Ruhezustand kostet Speicherplatz. Durchlaufen kostet Strom.** Merk dir diesen Satz, er kommt weiter unten in seiner AWS-Fassung wieder.

## Was es eigentlich ist — zwei Schalter an derselben Funktion

Weder SnapStart noch Provisioned Concurrency ist ein eigener Service. Es sind zwei Einstellungen an einer Lambda-Funktion, die du auch wieder ausschalten kannst. Der erste:

```json
{
  "FunctionName": "payfast-api",
  "SnapStart": { "ApplyOn": "PublishedVersions" }
}
```

Das ist alles. `ApplyOn: PublishedVersions` heißt: Immer wenn du eine neue Version veröffentlichst, initialisiert Lambda deinen Code einmal, friert die Umgebung ein und legt den Snapshot in einen Cache. Der zweite Schalter:

```json
{
  "FunctionName": "payfast-api",
  "Qualifier": "PROD",
  "ProvisionedConcurrentExecutions": 20
}
```

Zwanzig Umgebungen, vorinitialisiert, dauerhaft bereit — gebunden an den Alias `PROD`.

Lies die beiden Blöcke nebeneinander, dann siehst du das Detail, das die meisten übersehen: **Beide Schalter greifen nur auf einer veröffentlichten Version oder einem Alias, der auf eine Version zeigt.** Auf `$LATEST` funktioniert keiner von beiden. Das ist kein Randfall, das ist der häufigste Praxisfehler: Jemand schaltet die Option ein, die API zeigt aber weiter auf `$LATEST`, und die Cold Starts bleiben, wo sie waren.

## Der Weg durch die Karte

### Kasten links — Client, und was „p99 ≤ 200 ms" wirklich verlangt

Die PayFast-API muss ein Latenz-SLA von p99 ≤ 200 ms halten. p99 heißt: Von hundert Anfragen dürfen neunundneunzig unter 200 ms bleiben, eine darf länger dauern.

Das klingt großzügig. Bei 500.000 Anfragen am Tag sind 5.000 Ausreißer erlaubt — reichlich Puffer für ein paar langsame Starts.

Der Haken liegt in der Verteilung. **Cold Starts kommen nicht einzeln, sie kommen in Trauben.** Wenn morgens um 9:00 der Traffic anspringt, braucht Lambda nicht eine neue Umgebung, sondern dreißig — und dreißig Anfragen hintereinander sehen dieselben zwei Sekunden. Das Budget ist nicht über den Tag verteilt, es wird in wenigen Minuten am Stück verbraucht.

### Badge 1 — Request

Der Client ruft den REST-Endpunkt auf und wartet. Synchron. Das ist die Voraussetzung für das ganze Problem: Es sitzt ein Mensch oder ein aufrufendes System am anderen Ende und zählt Millisekunden. Bei einem nächtlichen Batch-Job wäre der Cold Start völlig gleichgültig.

### Kasten — API Gateway: 29 Sekunden, die hier nichts zur Sache tun

Auf der Karte steht „29 s Integr.-Timeout". Das ist korrekt als **Default-Quota** für REST-APIs, und für Regional- und Private-REST-APIs lässt es sich über Service Quotas anheben.

Wichtiger ist, warum die Zahl überhaupt auf der Karte steht: **als Distraktor-Impfung.** Timeout und Latenz sind zwei verschiedene Krankheiten. Ein Timeout beendet eine Anfrage, die zu *lange rechnet*. Hier rechnet nichts zu lange — hier braucht der *Start* zu lange. Zwei Sekunden reißen kein 29-Sekunden-Timeout, aber sie reißen ein 200-Millisekunden-SLA. Wenn in einer Prüfungsfrage „Timeout erhöhen" als Antwort steht, ist sie deshalb falsch, egal wie plausibel sie klingt.

### Badge 2 — Weiterreichen

API Gateway ruft die Funktion auf. Existiert bereits eine warme Umgebung, ist die Sache in Millisekunden erledigt und diese Karte hätte kein Thema.

### Kasten — AWS Lambda (Java): warum ausgerechnet die JVM

Lambda muss vor deinem ersten Codepfad drei Dinge tun: dein Deployment-Paket laden, die Runtime starten und deinen Initialisierungscode ausführen — alles außerhalb des Handlers.

Bei einer schlanken Node-Funktion ist das ein Wimpernschlag. Bei der JVM ist es Arbeit: Klassen laden, verifizieren, Spring-Kontext aufbauen, Connection Pools anlegen, JIT-Compiler warmlaufen lassen. Genau das meint „JVM-Init dauert" auf der Karte.

Und genau hier setzen beide Lösungen an — an derselben Stelle, mit völlig verschiedenen Mitteln.

### Badge 3 — Der Riss: der eine Request nach der Pause

Der rot gestrichelte Kasten ist bewusst kein Service, sondern ein Befund. Nach einer Ruhephase gibt es keine warme Umgebung mehr, Lambda muss eine neue bauen, und dieser eine Request zahlt die volle Rechnung.

Das Bild dazu: Ein Restaurant, das nur bei Bedarf einen Koch einstellt. Der zweite Gast des Abends wird gut bedient. Der erste wartet, bis jemand die Küche aufgeschlossen, den Herd angeheizt und die Messer geschärft hat.

### Der grüne Kasten A — Lambda SnapStart

AWS initialisiert deine Funktion beim Veröffentlichen einer Version, nimmt einen verschlüsselten Firecracker-microVM-Snapshot von Speicher und Plattenzustand und cacht ihn. Beim Start wird die Umgebung aus diesem Snapshot **wiederhergestellt statt neu initialisiert**.

Unterstützt sind laut Doku **Java 11 und neuer, Python 3.12 und neuer, .NET 8 und neuer**. Node.js und Ruby nicht, OS-only-Runtimes nicht, Container-Images nicht.

AWS beziffert das Ergebnis mit „as low as sub-second" — unter einer Sekunde, im optimalen Fall. Die Karte schreibt „einige Dutzend ms". Das ist optimistischer als die Dokumentation; halte dich an *unter einer Sekunde*.

### Der blaue Kasten B — Provisioned Concurrency

Hier gibt es keinen Snapshot und keine Wiederherstellung. Lambda hält N Umgebungen dauerhaft vorinitialisiert. Kommt ein Request, ist die Umgebung schon da.

Zwei Zahlen dazu, die in Prüfungsfragen auftauchen. **Die Obergrenze:** Du kannst höchstens die unreservierte Konto-Concurrency minus 100 als Provisioned Concurrency konfigurieren — bei einem Kontolimit von 1.000 also maximal 900 für eine einzelne Funktion. Die letzten 100 bleiben für alles andere im Konto. **Die Abrechnung:** Lambda führt deinen Initialisierungscode bei der Allokation aus und stellt diese Initialisierung in Rechnung, auch wenn die Umgebung danach nie einen Request bearbeitet. Vorgehaltene Kapazität kostet, ob sie arbeitet oder nicht — das ist der Strom aus der Metapher.

**Und hier steht auf der Karte etwas Falsches, das du nicht auswendig lernen sollst.** Die Karte sagt an drei Stellen „0 ms Cold Start". Die AWS-Dokumentation formuliert es anders: Provisioned Concurrency ist *designed to make functions available with double-digit millisecond response times* — zweistellige Millisekunden, nicht null. Der Unterschied ist in der Praxis winzig und in der Prüfung entscheidend, weil AWS-Fragen mit AWS-Formulierungen arbeiten. Richtig ist: **Provisioned Concurrency beseitigt die Initialisierung, nicht die Physik.**

## Die entscheidende Unterscheidung

| | SnapStart | Provisioned Concurrency |
|---|---|---|
| Mechanik | Snapshot beim Publish, Restore beim Start | Umgebungen laufen dauerhaft vorinitialisiert |
| Latenzversprechen (AWS-Wortlaut) | „as low as sub-second" | „double-digit millisecond response times" |
| Kosten im Leerlauf | Java: keine · Python/.NET: Cache-Gebühr je Version | immer, pro vorgehaltener Umgebung |
| Runtimes | Java 11+, Python 3.12+, .NET 8+ | alle |
| Skaliert mit Last | ja, automatisch | nur bis N, danach normale Cold Starts |
| Passt zu | schwankendem, unvorhersehbarem Traffic | planbarer Dauerlast, härtestem SLA |
| Gemeinsam nutzbar | **nein** | **nein** |

Die letzte Zeile ist wichtig: Die Doku listet Provisioned Concurrency ausdrücklich unter dem, was SnapStart *nicht* unterstützt — zusammen mit EFS und Ephemeral Storage über 512 MB. Es ist ein Entweder-oder.

## Die ehrliche Feinheit

**Erstens, die Kostenaussage auf der Karte gilt nicht allgemein.** Im grünen Kasten steht „keine Standing-Kosten" direkt neben der Runtime-Liste „Java 11+, Python 3.12+, .NET 8". Für Java stimmt das: Für die Java-Runtimes berechnet AWS keinen Aufpreis für SnapStart. Für Python und .NET berechnet AWS zwei zusätzliche Posten — **Caching** je veröffentlichter Version mit SnapStart, mindestens drei Stunden und weiterlaufend, solange die Version aktiv ist, plus eine **Restore-Gebühr** bei jeder Wiederherstellung. Das ist der Ruhezustand aus der Metapher: Der Plattenplatz kostet. Für das gezeichnete Java-Szenario ist die Karte richtig; als allgemeiner Satz ist sie es nicht.

**Zweitens: Provisioned Concurrency ist erschöpfbar.** Sind alle zwanzig Umgebungen belegt, bedient Lambda den einundzwanzigsten Request mit einer normalen On-Demand-Umgebung — also mit Cold Start. Deine Funktion kann im selben Moment beide Verhaltensweisen zeigen. Woran du das erkennst: an der Umgebungsvariable `AWS_LAMBDA_INITIALIZATION_TYPE`, die entweder `provisioned-concurrency` oder `on-demand` enthält. Wer das nicht weiß, sucht den Fehler im Code.

**Drittens: Das Nachregeln ist träger, als man hofft.** Application Auto Scaling kann Provisioned Concurrency nach Zeitplan oder per Target Tracking anpassen. Für planbare Muster ist Scheduled Scaling der richtige Weg. Target Tracking dagegen braucht laut Doku eine anhaltende Last von rund drei Minuten und drei Datenpunkte, bevor es reagiert — bei kurzen Bursts kommt die Kapazität zu spät. Und bei Inaktivität sendet Lambda die Auslastungsmetrik gar nicht, die Alarme gehen auf `INSUFFICIENT_DATA`, und die Kapazität bleibt stehen, wo sie ist. Inklusive Rechnung.

**Viertens: SnapStart teilt einen Zustand, den dein Code für einmalig hält.** Ein Snapshot wird zur Startbasis *vieler* Umgebungen. Alles, was deine Init-Phase erzeugt und als eindeutig annimmt — Zufallswerte, IDs, Entropie, Zeitstempel, offene Netzwerkverbindungen — ist danach in allen Kopien identisch beziehungsweise veraltet. AWS nennt das explizit als Kompatibilitätsthema. Eindeutiges gehört hinter die Initialisierung, nicht davor.

**Fünftens: Auch eine eingefrorene Umgebung altert.** Lambda hält mehrere Kopien deines Snapshots vor und patcht sie mit Runtime- und Sicherheitsupdates. Jedes Mal, wenn dafür dein Initialisierungscode erneut ausgeführt wird, fällt Laufzeit an. Und der abgerechnete Umfang ist bei SnapStart größer als sonst: Neben dem Handler zählen auch der Init-Code außerhalb des Handlers, die Ladezeit der Runtime und alles, was in einem Runtime Hook läuft. Für Regionsfragen noch ein Randfall: SnapStart ist in allen kommerziellen Regionen verfügbar — außer Asia Pacific (New Zealand) und Asia Pacific (Taipei).

**Sechstens, für die Aktenlage:** Die alte `battle_card_4.md` behauptet in Falle 1, SnapStart und Provisioned Concurrency ließen sich „seit 2026 sogar kombinieren". Das ist falsch — die Doku schließt die Kombination aus. Die Karte selbst sagt das nicht, nur die Begleitdatei.

## Syntax lesen — der qualifizierte ARN

Beide Optionen hängen an einer Version. Deshalb musst du diesen String lesen können:

```
arn:aws:lambda:eu-central-1:123456789012:function:payfast-api:PROD
 │   │    │         │             │          │         │        │
 │   │    │         │             │          │         │        └─ Qualifier
 │   │    │         │             │          │         └─ Funktionsname
 │   │    │         │             │          └─ Ressourcentyp
 │   │    │         │             └─ Account-ID
 │   │    │         └─ Region
 │   │    └─ Service
 │   └─ Partition
 └─ Präfix
```

Der Qualifier ganz rechts entscheidet alles. Fehlt er, zeigt der ARN auf `$LATEST` — und `$LATEST` kennt weder SnapStart noch Provisioned Concurrency. Steht dort `PROD`, muss dieser Alias auch auf die Version zeigen, für die du die Option eingeschaltet hast.

Das ist der Grund, warum ein Team die Option aktiviert, die Rechnung steigt und die Latenz gleich bleibt: Die Integration in API Gateway zeigt noch auf die unqualifizierte Funktion.

## Was du dadurch nicht baust

Zähl durch, was in diesem Szenario **nicht** existiert:

- kein zweiter Service, der die Latenz löst — beides sind Schalter an der vorhandenen Funktion
- kein Cron-Job, der die Funktion warmhält
- kein Umschreiben der Anwendung auf eine andere Sprache
- kein Container, kein Cluster, keine Task-Definition
- kein Load Balancer und keine Instanz, die zwischen den Anfragen etwas tut
- keine Änderung am Timeout, weil das Timeout nie das Problem war

Übrig bleibt: dieselbe Java-Funktion hinter demselben API Gateway, mit einer einzigen zusätzlichen Konfigurationszeile.

## Wenn du dir eine Sache merkst

**SnapStart friert die fertige Umgebung ein und taut sie auf — Provisioned Concurrency lässt sie laufen. Das eine zahlst du beim Aufwachen, das andere rund um die Uhr.**

Ein Warm-Ping hält genau eine Umgebung wach und bricht beim ersten parallelen Request zusammen. Mehr Speicher gibt der Funktion mehr CPU-Anteil und verkürzt den Start, beseitigt ihn aber nicht. Ein anderes Compute-Modell löst das Problem, indem es das Szenario auswechselt — das ist keine Antwort auf die gestellte Frage.

## Prüfungsknackpunkte

**Signalwörter für SnapStart:** „unregelmäßiger Traffic", „Spitzen zu unvorhersehbaren Zeiten", „Kosten niedrig halten", „Java-Anwendung", „ohne Kapazität vorzuhalten".

**Signalwörter für Provisioned Concurrency:** „vorhersehbare Lastspitze", „jeden Werktag um 9:00", „strengstes Latenz-SLA", „Budget ist vorhanden", „garantiert schnelle Antwort".

**Die Kernachse:** Steht Kostenoptimierung bei schwankender Last im Vordergrund → SnapStart. Steht die härteste Latenzgarantie bei planbarer Last im Vordergrund → Provisioned Concurrency.

**Warum ein CloudWatch-/EventBridge-Warm-Ping hier verliert:** Ein Zeitplan, der die Funktion alle fünf Minuten aufruft, hält eine einzige Umgebung warm. Beim zweiten gleichzeitigen Request beginnt derselbe Cold Start wie vorher. Als SLA-Zusage ist das nicht haltbar, und AWS führt beide echten Mechanismen genau deshalb im Angebot.

**Warum „Speicher der Funktion erhöhen" hier verliert:** Mehr Speicher bedeutet bei Lambda mehr CPU-Anteil, und die Init-Phase wird tatsächlich schneller. Sie verschwindet nicht. Aus zwei Sekunden wird vielleicht eine — das SLA liegt bei 0,2.

**Warum „Integrationstimeout im API Gateway erhöhen" hier verliert:** Das Timeout begrenzt die Wartezeit, es verkürzt sie nicht. Die Antwort käme weiterhin nach zwei Sekunden, nur ohne Fehlermeldung. Das Latenz-SLA ist trotzdem gerissen.

**Warum „Funktion auf Node.js umschreiben" hier verliert:** Es adressiert das Symptom über einen Monatsplan Entwicklungsarbeit, und die Frage lautet, wie die *bestehende* Java-Funktion ihr SLA hält. In der Prüfung ist die Antwort mit dem geringsten Änderungsaufwand bei gleicher Wirkung die richtige.

**Warum „auf ECS Fargate migrieren" hier verliert:** Ein dauerhaft laufender Container hat keine Cold Starts — und wirft dafür Serverless-Betrieb, Skalierung auf null und das Abrechnungsmodell weg. Wer die Frage so beantwortet, hat das Szenario ausgetauscht statt gelöst.

**Der Klassiker zum Schluss:** Eine Frage behauptet, SnapStart gehe nur mit Java. Das war bis November 2024 richtig. Seitdem gilt: Java 11+, Python 3.12+, .NET 8+.
