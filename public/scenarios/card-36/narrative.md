---
cardNumber: 36
slug: route53-routing-policies-vermeer-legal-vier-record-ebenen
title: "Route 53 Routing Policies — vier Ebenen in einer DNS-Antwort"
services:
  - Amazon Route 53
  - Route 53 Health Checks
  - Application Load Balancer
  - Amazon S3
domains:
  - D2
  - D3
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resource-record-sets-values-geo-alias.html"
  - "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-policy-geo-phz.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/01/amazon-route-53-expands-geoproximity-routing"
  - "https://aws.amazon.com/about-aws/whats-new/2023/10/amazon-route-53-traffic-flow-geoproximity-routing-local-zones"
---

## Die Grundidee zuerst

Stell dir eine Telefonzentrale in einer Kanzlei vor.

**Die alte Zentrale** hat eine Liste mit einer Nummer. Wer anruft, wird dorthin durchgestellt. Ist die Leitung tot, klingelt es ins Leere. Das ist ein einzelner A-Record.

**Die neue Zentrale** hat kein Buch, sondern vier Fragen, die sie in fester Reihenfolge stellt. Erstens: Aus welchem Land kommt der Anruf? Deutsche Mandanten dürfen nur mit dem europäischen Büro sprechen, das ist eine Vorschrift, keine Empfehlung. Zweitens: Steht Europa überhaupt? Drittens: Welches der beiden europäischen Büros antwortet gerade schneller? Viertens: Bekommt dieser Anrufer den alten Apparat oder den neuen, der seit gestern im Test ist?

Vier Fragen, eine Antwort, und die Antwort ist eine Nummer — **nicht das Gespräch selbst.** Nachdem die Zentrale die Nummer genannt hat, wählt der Anrufer, und die Zentrale hört nichts mehr davon.

Das ist der Satz, an dem die ganze Karte hängt. Route 53 gibt eine Adresse zurück und ist danach aus dem Spiel. Alles, was die vier Ebenen tun, passiert in den Millisekunden der Namensauflösung. **Der eigentliche Anwendungs-Traffic fließt nie durch Route 53.**

## Was es eigentlich ist — verschachtelte Record-Sets

Die vier Kästen auf der Karte sind keine Server und keine Dienste. Es sind **Record-Sets in derselben Hosted Zone**, die per Alias aufeinander zeigen:

```text
app.vermeer.eu   A  GEOLOCATION  continent=EU   -> alias eu.app.vermeer.eu
app.vermeer.eu   A  GEOLOCATION  continent=NA   -> alias us-east-1-alb
app.vermeer.eu   A  GEOLOCATION  country=*      -> alias us-east-1-alb

eu.app.vermeer.eu  A  FAILOVER  PRIMARY    -> alias lat.app.vermeer.eu
                                              EvaluateTargetHealth: true
eu.app.vermeer.eu  A  FAILOVER  SECONDARY  -> alias s3-wartungsseite-eu

lat.app.vermeer.eu  A  LATENCY  eu-central-1 -> alias wgt.app.vermeer.eu
lat.app.vermeer.eu  A  LATENCY  eu-west-1    -> alias eu-west-1-alb

wgt.app.vermeer.eu  A  WEIGHTED  90  TTL 60 -> alias alb-v42
wgt.app.vermeer.eu  A  WEIGHTED  10  TTL 60 -> alias alb-v43
```

Lies die rechte Spalte von oben nach unten: Jede Ebene zeigt auf den Namen der nächsten. Der Client fragt einmal, Route 53 löst die Kette intern auf und antwortet mit **einer** IP.

Der Schlüssel steht in Zeile 5: `EvaluateTargetHealth: true`. Ohne dieses Flag würde die Failover-Ebene den Gesundheitszustand der darunterliegenden Latency-Gruppe nicht sehen. Sie hielte den Primary für gesund, weil der Alias ja existiert — und schaltete nie um.

## Der Weg durch die Karte

### Badge 1 und der Nutzer-Kasten

`München, DE`, `app.vermeer.eu`. Ein Rechner in München stellt eine DNS-Anfrage. Genauer: Sein Resolver stellt sie — meist der des Providers oder ein öffentlicher.

Diese Unterscheidung ist prüfungsrelevant, weil Route 53 den Nutzer nie sieht. Es sieht die Adresse des **Resolvers**. Route 53 unterstützt zwar die EDNS0-Erweiterung `edns-client-subnet`, mit der ein Resolver einen Teil der Client-Adresse weiterreicht; ob er das tut, entscheidet er selbst.

### Badge 2 und der Geolocation-Kasten — die Compliance-Grenze

`Europa → EU-Baum`, `N-Amerika → us-east-1`, `Default (*) ist Pflicht`.

Die äußerste Ebene ist bewusst keine Performance-Entscheidung, sondern eine Regel. Anfragen aus Europa gehen in den EU-Baum, Anfragen aus Nordamerika nach `us-east-1`. Geolocation ist **deterministisch**: Ein Nutzer in Deutschland landet immer im EU-Baum, auch wenn `us-east-1` in diesem Moment schneller antworten würde.

Genau das will man bei Datenresidenz. Eine Regel, die sich nicht von Messwerten umstimmen lässt.

Überlappen sich Regionen — ein Record für Europa und einer für die Niederlande —, **gewinnt die kleinere geografische Einheit.** Das ist nützlich für Ausnahmen: Kontinent grob, einzelne Länder fein.

### Der rote Pfeil nach links unten — ohne Default-Record ist nichts

`unbekannte IP` führt auf einen roten Kasten: `Ohne Default (*)`, `NOERROR, aber ANSWER-Sektion leer`.

Geolocation ordnet IP-Adressen Orten zu. Manche Adressen lassen sich nicht zuordnen — VPNs, Satellitenanbindungen, frisch vergebene Blöcke. Selbst wenn du Records für alle sieben Kontinente anlegst, kommen Anfragen an, die in keinen davon fallen.

Der Default-Record mit `CountryCode: *` fängt beide Fälle ab: nicht zuordenbare Adressen und Orte, für die du keinen Record gebaut hast. **Ohne ihn antwortet Route 53 mit „no answer".**

Und das ist die perfide Variante eines Ausfalls: kein Fehler, kein `NXDOMAIN`, kein Alarm. Der Statuscode ist `NOERROR`, die ANSWER-Sektion ist leer. Die Anwendung wirkt tot, obwohl jede Region gesund ist und jeder Health Check grün steht.

Das Bild dazu: eine Telefonzentrale, die bei unbekannter Vorwahl kommentarlos auflegt, statt „kein Anschluss" zu sagen.

**Sonderfall, der oft in Fragen steckt:** Wer Records für alle US-Bundesstaaten anlegt, braucht **zusätzlich** einen Record für „United States". Manche US-Adressen sind dem Land, aber keinem Bundesstaat zugeordnet.

### Der us-east-1-Kasten und die gestrichelte Zone

`Nordamerika + Default`, `eigene Datenbasis` — außerhalb des Kastens `EU-DATENGRENZE — DATENRESIDENZ`.

Der gestrichelte Rahmen ist keine AWS-Konstruktion. Er ist eine juristische Linie, die auf der Karte sichtbar gemacht wird, weil sie jede technische Entscheidung darin einsperrt. Nordamerikanische Mandanten werden aus `us-east-1` mit eigener Datenbasis bedient; die beiden Welten teilen keinen Datenbestand.

### Badge 3 und der Failover-Kasten — die Grenze halten, auch im Ausfall

`Primary: EU-Latenzsatz`, `Secondary: Wartung`, `Evaluate Target Health`.

Der Primary ist ein Alias auf die darunterliegende Latency-Gruppe. Fallen **beide** EU-Regionen aus, gilt der Primary als unhealthy und der Secondary greift: eine statische Wartungsseite in S3, **in der EU**.

Der rote Pfad mit dem X und der Beschriftung `Compliance-Bruch` zeigt, was hier fast passiert wäre. Ein Failover nach `us-east-1` wäre technisch trivial, verfügbarkeitstechnisch besser und rechtlich ein Verstoß. Mandantendaten dürfen die EU nicht verlassen — auch nicht für zwanzig Minuten Ausfall.

**Der Merkwert dieser Ebene: Der Secondary muss innerhalb derselben Grenze liegen wie der Primary.** Eine schlechtere, aber konforme Antwort schlägt eine bessere, die den Rahmen sprengt.

### Der Wartungsseiten-Kasten — warum ausgerechnet S3

`S3, eu-central-1`, `Secondary, passiv`, gestrichelt gezeichnet.

Der gestrichelte Rand heißt: steht bereit, trägt im Normalbetrieb nichts. Und die Wahl von S3 ist kein Zufall, sondern folgt aus einer Frage, die man beim Failover-Entwurf leicht überspringt: **Wovon hängt der Notfallplan selbst ab?**

Wäre die Wartungsseite eine kleine EC2-Instanz oder ein Container, hinge sie an derselben Compute-Schicht, die gerade ausgefallen ist. Ein statisches S3-Website-Endpoint hat diese Abhängigkeit nicht. Es braucht keine Instanz, keinen Load Balancer und keine Datenbank.

Für die Prüfung ist das ein wiederkehrendes Muster: Der Secondary eines Failover-Records soll möglichst wenig mit dem Primary gemeinsam haben — außer der Region, wenn eine Compliance-Grenze das verlangt.

### Der eu-west-1-Kasten — der zweite Sieger

`nur v4.2`, `höhere Latenz`. Dublin ist kein Standby, das im Ausfall angeschaltet wird. Es läuft dauerhaft und bedient auch im Normalbetrieb alle Anfragen, für die es der schnellere Endpunkt ist — irische, britische und westfranzösische Resolver zum Beispiel.

Das ist der Unterschied zwischen der Latency-Ebene und der Failover-Ebene darüber, und er wird oft verwechselt: **Latency verteilt permanent, Failover schaltet um.** Die eine Ebene arbeitet im Alltag, die andere nur in der Ausnahme.

Deshalb steht Dublin auch bewusst auf v4.2. Es ist eine produktive Region mit echtem Verkehr, kein Testgelände.

### Badge 4 und der Latency-Kasten — jetzt darf Tempo entscheiden

`eu-central-1 gewinnt`, `eu-west-1 als zweiter`, `Health Check je Record`.

Erst jetzt, wo die Compliance gesichert ist, kommt Performance ins Spiel. Route 53 vergleicht **gemessene** Netzlatenzen zwischen dem Netz des anfragenden Resolvers und den beteiligten Regionen. Für München gewinnt in aller Regel Frankfurt.

Jeder Latency-Record trägt einen eigenen Health Check. Fällt Frankfurt allein aus, antwortet diese Ebene mit Dublin, ohne dass die Failover-Ebene darüber überhaupt anspringt. Erst wenn **beide** unhealthy sind, meldet die Gruppe nach oben.

### Badges 5 und 6 mit den beiden ALB-Kästen — der dosierte Rollout

`90 Blue / 10 Green`, `TTL 60 s`, `Canary nur in Frankfurt`. Darunter `ALB v4.2` mit `90 % Traffic` und, gestrichelt gezeichnet, `ALB v4.3` mit `10 % Canary`.

Route 53 verteilt Antworten im Verhältnis der Gewichte. Der gestrichelte Rand des v4.3-Kastens markiert ihn als temporär: Er steht nur, solange der Canary läuft.

Dublin fährt bewusst nur v4.2. Ein Canary in beiden Regionen gleichzeitig verdoppelt die Fehlerquellen, ohne den Erkenntnisgewinn zu verdoppeln.

Die **TTL von 60 Sekunden** ist der eigentliche Hebel dieser Ebene, und zwar für den Rückweg — siehe unten.

### Die Merksätze-Fußzeile

`Geolocation = Regel (Compliance) · Latency = Messung (Tempo) · Failover-Secondary bleibt in der EU · ohne Default-Record: „no answer"`.

Vier Sätze, die die vier Ebenen in ihrer Reihenfolge spiegeln. Wer sie in dieser Ordnung im Kopf hat, baut die Kaskade in der Prüfung von außen nach innen richtig auf.

## Die entscheidende Unterscheidung

| | **Geolocation** | **Latency** | **Geoproximity** |
|---|---|---|---|
| Grundlage | Regel: wo sitzt der Nutzer | Messung: Netzlatenz | Entfernung Nutzer ↔ Ressource |
| Ergebnis | deterministisch | schwankt mit dem Netz | geometrisch, per Bias verzerrbar |
| Zweck | Compliance, Sprache, Lizenzen | Performance | Lastverteilung nach Geografie |
| Health Checks | ja | ja | ja |
| Typischer Fehler | fehlender Default-Record | für Datenresidenz benutzt | mit Geolocation verwechselt |

**Geolocation ist eine Regel, Latency ist eine Messung.** Wo beides gefordert ist, liegt die Regel außen und die Messung innen. Andersherum wäre die Compliance-Grenze verhandelbar — und damit keine Grenze.

## Die ehrliche Feinheit

Die Karte legt nahe, dass diese Kaskade die natürliche Lösung ist. Sie ist eine von zweien, und die andere ist in der Praxis häufiger.

**Blue/Green als zwei ALBs ist die DNS-Variante.** Praktisch wird ein Canary meist in **einem** ALB über zwei Target Groups gewichtet. Dann ist es ALB-Weighting statt Route-53-Weighting — die Verteilung passiert pro Request statt pro DNS-Antwort, und die gesamte TTL-Problematik entfällt. Die DNS-Variante hat trotzdem ihren Platz: Sie funktioniert über Regionsgrenzen hinweg, wo ein einzelner ALB nicht hinreicht.

**Die TTL bestimmt das Rollback-Tempo, nicht das Gewicht.** Ein Gewicht auf 0 zu setzen entfernt einen Endpunkt sofort aus **neuen** Antworten. Bereits ausgelieferte Antworten leben bis zum TTL-Ablauf weiter. Wer Blue/Green über DNS fährt und eine TTL von 86.400 Sekunden stehen lässt, hat einen Rollback von einem Tag.

Und selbst 60 Sekunden sind eine Untergrenze, keine Zusage. Resolver dürfen TTLs verkürzen, manche runden sie auf, und Anwendungen mit eigenem DNS-Cache — Java-Runtimes sind berüchtigt — halten Antworten mitunter für die gesamte Prozesslaufzeit. **„DNS-Failover ist schnell" ist der Satz, den Kursmaterial am freundlichsten formuliert.** Er ist schnell im Vergleich zu manuellem Eingreifen. Er ist langsam im Vergleich zu allem, was hinter einer festen Adresse umschaltet.

Dritte Feinheit: Auf der Karte fehlen die Health-Check-Pfeile. Route 53 Health Checks prüfen die Endpunkte **von außen**, aus verteilten AWS-Standorten. Sie als eigene Pfeilschar zu zeichnen hätte die vier Ebenen unlesbar gemacht — beim Lesen musst du sie mitdenken.

## Syntax lesen — die acht Policies und ihre Auslöser

Kursmaterial nennt oft fünf oder sechs. Es sind acht:

```text
Simple             ein Ziel, keine Bedingung
Weighted           Anteile, "gradually shift traffic"
Latency            gemessene Netzlatenz, "lowest latency"
Failover           Primary/Secondary, "if the Region becomes unavailable"
Geolocation        Herkunft des Nutzers, "data must remain in"
Geoproximity       Distanz Nutzer<->Ressource, mit Bias -99..+99
Multivalue Answer  bis zu 8 gesunde Records, "improve availability"
IP-based           eigene CIDR-Zuordnung, "a specific ISP"
```

Zwei Zeilen davon sind Prüfungsfallen:

**Geoproximity** war bis zum **10.01.2024** nur über Traffic Flow konfigurierbar. Seitdem ist es eine ganz normale Routing Policy für Records in public **und** private Hosted Zones, über Console, API, SDK und CLI. Sehr viele Cheat Sheets tragen den alten Stand.

**IP-based** gibt es seit Juni 2022 und fehlt in vielen Übersichten. Es routet nach CIDR-Blöcken, die du selbst pflegst — der Fall für „ein bestimmter ISP soll auf einen bestimmten Endpunkt".

## Was du dadurch nicht baust

Mit dieser Kaskade entsteht ausdrücklich **nicht**:

- keine Lastverteilung nach Auslastung — DNS kennt keine Server-Metriken
- keine Session Affinity und kein Connection Draining
- kein sofortiges Rollback; die TTL setzt die Untergrenze
- keine Datenreplikation zwischen EU und `us-east-1`
- keine Durchsetzung der Grenze auf Paketebene; wer die IP kennt, ruft sie direkt
- kein Schutz vor Resolvern, die TTLs ignorieren
- keine Beschleunigung des Datenverkehrs; Route 53 liegt nicht im Datenpfad

Übrig bleiben neun Record-Sets in einer Hosted Zone und eine Antwort, die vier Bedingungen erfüllt.

## Wenn du dir eine Sache merkst

**Geolocation ist eine Regel, Latency ist eine Messung — die Regel liegt außen, die Messung innen, und der Failover-Secondary bleibt innerhalb derselben Grenze wie der Primary.**

Latency-Routing allein hält keine Datengrenze, weil es sich von Messwerten überzeugen lässt. Geolocation allein wählt keinen schnellen Endpunkt. Multivalue Answer verteilt, kennt aber keine Last. Und ein Failover nach `us-east-1` löst den Ausfall und bricht die Compliance im selben Zug.

## Prüfungsknackpunkte

**Signalwörter:** „customer data must remain in the EU" → Geolocation · „lowest latency" → Latency · „automatically fail over if the Region becomes unavailable" → Failover · „gradually shift a small percentage" → Weighted · „some users receive an empty response" → fehlender Default-Record.

**Warum „Latency-Routing" bei Datenresidenz verliert:** Es entscheidet nach Messwerten. Ist die US-Region an einem Tag schneller, schickt es europäische Nutzer dorthin — und bricht die Vorschrift, ohne dass jemand etwas ändert.

**Warum „Multivalue Answer" bei „distribute traffic across instances" verliert:** Route 53 antwortet mit bis zu **acht** gesunden Records und wählt bei mehr als acht zufällig aus. Sind alle unhealthy, kommen bis zu acht **unhealthy** Records zurück. Keine Lastkenntnis, keine Session Affinity, kein Draining. Die Antwort ist ein ALB oder NLB.

**Warum „Geoproximity geht nur über Traffic Flow" veraltet ist:** Seit dem 10.01.2024 nicht mehr. Der Unterschied zu Geolocation bleibt aber: Geolocation fragt „wo sitzt der Nutzer", Geoproximity rechnet die Entfernung zwischen Nutzer und **Ressource** und lässt sich per Bias verzerren.

**Warum „TTL auf 0 setzen" kein Rollback-Ersatz ist:** Ein Gewicht von 0 wirkt sofort auf neue Antworten, nicht auf ausgelieferte. Und eine TTL von 0 respektiert nicht jeder Resolver.

**Warum „Latency-Routing = geografisch nächster Endpunkt" falsch ist:** Route 53 nutzt gemessene Latenzdaten, keine Luftlinie. Bei schlechtem Peering kann Dublin für einen deutschen Provider schneller sein als Frankfurt.

**Die Abgrenzung zu Karte 35:** Dort steht Route 53 Latency-Routing als *verworfene* Alternative zu Global Accelerator, weil DNS nur die Auflösung steuert und die Pakete danach weiter über das öffentliche Internet reisen. Das widerspricht dieser Karte nicht. **DNS entscheidet, wohin ein Client sich verbindet — nicht, wie die Pakete reisen.** Für Datenresidenz, Failover-Logik und Rollout-Steuerung ist genau diese Entscheidung das richtige Werkzeug; für stabile Anycast-IPs und Jitter ist sie das falsche.
