---
cardNumber: 23
slug: aurora-serverless-v2-scale-to-zero-helix-devtest
title: "Aurora Serverless v2 — Dev/Test-Kapazität, die bis auf null atmet"
services: ["Amazon Aurora", "Aurora Serverless v2", "Aurora PostgreSQL", "RDS Proxy"]
domains: ["D4", "D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2-auto-pause.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.how-it-works.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.StorageReliability.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/aurora-serverless.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/amazon-aurora-serverless-v2-scaling-zero-capacity"
  - "https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-aurora-postgresql-database-clusters-256-tib-storage-volume/"
  - "https://aws.amazon.com/blogs/database/introducing-scaling-to-0-capacity-with-amazon-aurora-serverless-v2/"
---

## Die Grundidee zuerst

Stell dir ein Lagerhaus mit einem Gabelstapler vor.

**Weg eins:** Du stellst einen Fahrer fest an. Er kommt morgens, sitzt auf dem
Stapler und wartet. Zweimal am Tag rollt eine Palette an, er braucht zwei
Minuten, dann sitzt er wieder. Nachts geht er heim, aber du bezahlst ihn trotzdem
für den ganzen Tag, weil er fest angestellt ist. Bei vierzehn Lagerhallen hast du
vierzehn Fahrer, die 85 % ihrer Zeit dasitzen.

**Weg zwei:** Du rufst einen Fahrer, wenn eine Palette kommt. Er ist in fünfzehn
Sekunden da, arbeitet die zwei Minuten und geht wieder. Du zahlst die zwei
Minuten.

Und jetzt der Teil, den fast alle überlesen: **Die Halle zahlst du in beiden
Fällen.** Sie steht da, sie ist gemietet, ob jemand drin arbeitet oder nicht. Die
Paletten verschwinden ja nicht, nur weil kein Stapler fährt.

Der Fahrer ist die Rechenkapazität. Die Halle ist der Speicher. Aurora Serverless
v2 macht aus dem festangestellten Fahrer einen, den man ruft — und lässt die Halle
unangetastet. Wer das Bild einmal hat, hat den Merksatz der Karte schon: Die
Kapazität atmet, der Speicher nicht.

## Was es eigentlich ist

Die ganze Konfiguration sind **drei Zahlen** an einem sonst völlig normalen
Aurora-Cluster:

```
aws rds modify-db-cluster \
  --db-cluster-identifier helix-feature-branch-07 \
  --serverless-v2-scaling-configuration \
      MinCapacity=0,MaxCapacity=8,SecondsUntilAutoPause=600
```

Fragst du den Cluster danach ab, antwortet er genau so:

```
{
    "MinCapacity": 0,
    "MaxCapacity": 8.0,
    "SecondsUntilAutoPause": 600
}
```

`MinCapacity=0` ist der Schalter für die Pause. `MaxCapacity=8` ist die
Sicherung nach oben. `SecondsUntilAutoPause=600` ist die Stille, die vergehen
muss, bevor pausiert wird.

Und hier steckt eine Feinheit, die man an der Ausgabe ablesen kann: **Das dritte
Feld existiert nur, solange das erste auf 0 steht.** Setzt du die
Mindestkapazität auf 0,5, verschwindet `SecondsUntilAutoPause` aus der Antwort —
AWS beschreibt das ausdrücklich als zusätzliche Bestätigung, dass die Pause aus
ist. Die API sagt dir also, ob das Feature läuft, indem sie ein Feld weglässt.

Was hier *nicht* steht, ist genauso wichtig: kein Instanztyp, keine Speichergröße,
kein Endpoint. „Serverless" ist bei v2 eine **Instanzklasse** namens
`db.serverless` innerhalb eines gewöhnlichen Aurora-Clusters. Kein anderes
Produkt, keine andere API. Man kann in einem Cluster sogar provisionierte und
serverlose Instanzen mischen.

## Der Weg durch die Karte

### 1 — Die CI verbindet sich wie gegen jede andere Aurora-Datenbank

Der Cluster-Endpoint bleibt derselbe, der JDBC-Treiber bleibt derselbe, das
Connection-String-Format bleibt dasselbe. Für die vierzehn Entwicklungsteams
ändert sich nichts, was sie anfassen müssten.

Das ist der entscheidende Unterschied zu jeder Lösung, die Entwickler
umkonfigurieren müssten — und der Grund, warum diese Karte überhaupt eine
Kostenkarte sein darf. Eine Sparmaßnahme, die vierzehn Teams beschäftigt, spart
nichts.

### 2 — Compute und Storage sind getrennt

Die Rechenschicht arbeitet auf dem **Cluster Volume**. Das ist kein an die Instanz
gehängtes Laufwerk, sondern ein verteiltes System: sechs Kopien über drei
Availability Zones, wachsend in 10-GB-Schritten.

Diese Trennung ist die technische Voraussetzung für alles Folgende. Weil die Daten
nicht in der Instanz liegen, kann die Instanz verschwinden, ohne dass etwas
verlorengeht. Und weil die Daten nicht in der Instanz liegen, **kosten sie weiter,
wenn die Instanz weg ist.**

Das Bild dazu ist die Halle von oben: Der Stapler kann gehen. Die Paletten bleiben
stehen, und die Miete läuft.

### 3 — Resume in etwa fünfzehn Sekunden

Trifft morgens die erste Verbindung ein, fährt die Instanz aus dem Pause-Zustand
hoch. AWS nennt als typische Dauer rund fünfzehn Sekunden und empfiehlt
ausdrücklich, die Client-Timeouts darüber zu legen — beim JDBC-Treiber konkret
`connectTimeout` und `sslResponseTimeout`.

**Auf der Karte steht „Resume ~15 s" — richtig ist: 15 Sekunden gelten nur bis zu
24 Stunden Pause.** Die Doku führt einen zweiten Fall: Bleibt eine Instanz länger
als 24 Stunden pausiert, kann Aurora sie in einen tieferen Schlaf versetzen, und
die Rückkehr dauert dann **30 Sekunden oder länger** — etwa wie ein Neustart. Für
Datenbanken mit Pausen über einen Tag empfiehlt AWS Timeouts von 30 Sekunden
aufwärts.

Und genau dieser Fall ist das Kartenszenario. „Nachts und am Wochenende: nichts"
heißt: Freitagabend bis Montagmorgen sind rund sechzig Stunden. Der erste CI-Lauf
der Woche trifft nie die fünfzehn Sekunden. Er trifft die dreißig. *(Fixvorschlag
für die Karte: die Badge-Legende auf „Resume ~15 s, nach über 24 h Pause 30 s+"
erweitern.)*

Ein zweites Detail derselben Art: Nach dem Aufwachen startet die Instanz mit
**kleiner Kapazität** und skaliert von dort hoch — auch dann, wenn sie vor der
Pause groß war. Die erste Minute nach dem Wochenende ist also nicht nur langsam
beim Verbinden, sondern auch beim Arbeiten.

### 4 — Skalierung im laufenden Betrieb

Beim CI-Lauf steigt die Kapazität binnen Sekunden auf die benötigte Spitze und
fällt danach wieder. Entscheidend ist das Wie: **in-place**. Kein Failover, keine
neue Instanz, kein Verbindungsabbruch.

AWS ist an dieser Stelle ungewöhnlich deutlich: Skalierung passiert, während
Verbindungen offen sind, während SQL-Transaktionen laufen, während Tabellen
gesperrt sind und während temporäre Tabellen in Gebrauch sind. Aurora wartet nicht
auf einen ruhigen Moment.

Das ist der Punkt, an dem sich v2 von allem unterscheidet, was vorher als
„automatische Skalierung" verkauft wurde. Eine Instanzklasse zu ändern heißt bei
provisioniertem Aurora: Ausfallfenster. Hier heißt es: nichts.

### 5 — Auto-Pause nach dem Idle-Timeout

Steht die Mindestkapazität auf 0 und liegt für die konfigurierte Dauer keine
**vom Nutzer initiierte** Verbindung an, pausiert die Instanz. Das Fenster reicht
von 300 Sekunden bis 86.400 Sekunden, Standard sind 300.

Die Formulierung „vom Nutzer initiiert" ist wörtlich zu nehmen und in der Doku
eigens abgegrenzt: Die Verwaltungsverbindungen, die Aurora selbst für Health
Checks nutzt, zählen nicht als Aktivität und verhindern die Pause nicht.

Was danach passiert, ist auf der Karte als Kurve zu sehen und in den Metriken
nachvollziehbar: Die Compute-Abrechnung stoppt, der Cluster-Status bleibt auf
`Available`, und die einzigen Werte, die noch nach CloudWatch gehen, sind
`CPUUtilization` und `ACUUtilization` auf 0 Prozent sowie
`ServerlessDatabaseCapacity` auf 0. Eine pausierte Instanz sieht in einer
Verfügbarkeitsstatistik aus wie eine verfügbare — AWS rechnet die Pausenzeit
ausdrücklich als verfügbar.

### Der Kasten „Cluster Volume"

Sechs Kopien, drei AZs, 10-GB-Schritte — und darunter die Zeile, die den Kasten
rechtfertigt: *wird auch im Pause-Zustand berechnet*.

**Auf der Karte steht „bis 128 TiB" — das ist seit Juli 2025 nur noch die halbe
Wahrheit.** Aurora PostgreSQL und Aurora MySQL unterstützen für passende
Engine-Versionen **256 TiB**; der User Guide formuliert es versionsabhängig. Die
allgemeine Aurora-Übersichtsseite von AWS nennt weiterhin 128 TiB. Das ist kein
echter Quellenkonflikt, sondern derselbe Fall wie auf Karte 20: Der Übersichtstext
ist vereinfacht und veraltet, die präzise Aussage steht im User Guide.
*(Fixvorschlag: „128 / 256 TiB je Engine-Version".)*

Für dieses Szenario ändert die Zahl nichts — vierzehn Feature-Branch-Datenbanken
kommen keiner der beiden Grenzen nahe. Sie steht auf der Karte, weil sie in
Prüfungsfragen als Wiedererkennungsmerkmal für Aurora dient.

### Der rote Kasten „Was die Pause verhindert"

Der praktisch wichtigste Kasten der Karte, und der einzige rote. Drei Gründe
stehen darauf: RDS Proxy, offene Nutzerverbindungen, logische bzw.
Binlog-Replikation.

Der erste ist der, der in Prüfungsfragen auftaucht. Ein RDS Proxy hält zu **jeder**
Instanz im Cluster eine offene Verbindung — damit pausiert keine
Serverless-Instanz in diesem Cluster. Nicht „seltener", sondern gar nicht. Steht
im Fragetext „RDS Proxy" und „scale to zero" nebeneinander, ist mindestens eine
der beiden Anforderungen nicht erfüllbar.

Die Liste auf der Karte ist gekürzt. Die Doku nennt weiter: Cluster in einer
Aurora Global Database, Cluster mit zero-ETL-Integration nach Redshift, und bei
Aurora PostgreSQL zusätzlich Aktivität auf dem T-SQL-Port, wenn Babelfish
eingeschaltet ist. Ebenso pausiert der Serverless-Writer nicht, wenn im selben
Cluster **provisionierte** Instanzen stehen.

### Die Kapazitätskurve

Der untere Bereich ist keine Messung, sondern ein Muster: Nacht auf null, drei
CI-Spitzen über den Tag, abends Idle-Timeout und wieder null. Die y-Achse ist bei
8 ACU abgeschnitten, obwohl 256 möglich wären — bei voller Skala wäre der
Dev/Test-Bereich eine Linie am Boden.

Die Fläche unter der Kurve ist die Rechnung. Was nicht unter der Kurve liegt, wird
nicht als Compute berechnet. Der Storage-Anteil taucht in der Kurve gar nicht auf,
weil er nicht mitatmet — er steht als Zeile im Volume-Kasten.

## Die entscheidende Unterscheidung

|  | **Provisioned** | **Serverless v2** | **Serverless v1** |
|---|---|---|---|
| Kapazität | feste Instanzklasse | 0–256 ACU | 1–256 ACU, grob gestuft |
| Änderung | Instanztausch, Ausfallfenster | in-place, unterbrechungsfrei | Skalierungspunkt nötig |
| Leerlaufkosten | volle Instanz | nur Storage | nur Storage |
| Reader im Cluster | ja | ja, bis 15 über 3 AZs | nein |
| Status | aktuell | aktuell | **EOL 31.03.2025** |

Die Spalte rechts steht nur da, damit man sie ausschließen kann. Aurora Serverless
v1 ist tot: Seit dem 8. Januar 2025 lassen sich keine neuen v1-Cluster mehr
anlegen, das Lebensende war der 31. März 2025, und ab dem 7. April 2025 migriert
AWS verbliebene Cluster im Wartungsfenster — scheitert das, wird der Cluster in
einen provisionierten umgewandelt. *(Diese Korrektur betrifft auch
`battle_card_23.md`, Falle 2: dort steht der 01.09.2024 als Datum für den
Anlagestopp. AWS nennt den 08.01.2025.)*

Die Zeile, die Prüfungsfragen entscheidet, ist trotzdem die erste: **v2 kann
0 ACU.** Die alte Merkregel „nur v1 pausiert" stammt aus der Zeit, als v2 bei
0,5 ACU aufhörte. Seit dem 20. November 2024 stimmt sie nicht mehr.

## Die ehrliche Feinheit

**Der Bereich 0–256 ACU ist keine Eigenschaft des Produkts, sondern eines
Clusters.** Er hängt an zwei Dingen gleichzeitig: der Engine-Version und einer
zweiten Größe namens **Platform Version**, die AWS selbst verwaltet. Es gibt vier
davon; Platform Version 1 kann nur bis 128 ACU. Die Doku sagt dazu einen Satz, den
man sich merken sollte: Maßgeblich ist jeweils die **schwächere** von beiden. Eine
moderne Engine auf einer alten Plattform bekommt den alten Bereich.

**0,5 ACU ist die kleinste Stufe, nicht die Schrittweite.** Die Karte schreibt
„skaliert in 0,5-ACU-Schritten"; die Doku formuliert es als *Stufen, die so klein
wie 0,5 ACU sein können* — und ergänzt, dass die Stufe mit der aktuellen Kapazität
wächst. Praktisch heißt das: Eine Instanz bei 64 ACU legt schneller zu als eine
bei 1 ACU. Wer schnelle Lastspitzen abfangen muss, setzt die Mindestkapazität
bewusst nicht auf null, weil die Skalierung von unten am langsamsten ist. Für
Dev/Test ist das egal, für eine Produktions-API nicht.

**Die Pause bricht geplante Jobs ab, ohne sie nachzuholen.** Aurora weckt eine
pausierte Instanz nicht für engine-eigene Zeitpläne wie `pg_cron` oder den
MySQL Event Scheduler. Läuft ein solcher Job gerade, wenn das Timeout abläuft,
wird er abgebrochen; fällt sein Termin in die Pause, wird er übersprungen und
nicht nachgeholt. Dasselbe gilt für interne Aufräumarbeiten wie Autovacuum. Wer
nächtliche Wartung über `pg_cron` fährt und Auto-Pause einschaltet, hat ab sofort
keine nächtliche Wartung mehr — ohne Fehlermeldung.

**Der Name ist in Bewegung.** In der aktuellen AWS-Dokumentation heißt das Produkt
nur noch **„Aurora serverless"**; das „v2" ist aus den Seitentiteln verschwunden,
seit v1 abgekündigt ist. Die Instanzklasse heißt weiterhin `db.serverless`. Für
die Prüfung bleibt „Aurora Serverless v2" die erwartete Bezeichnung — die
Umbenennung ist eine Dokumentationsentscheidung, keine Produktänderung.

**Speicher, nicht CPU, setzt in der Praxis den Boden.** Buffer Pool, große
Sortierungen und viele Verbindungen fressen ACUs. Eine Datenbank mit 8 GiB
Working Set läuft bei 1 ACU — also rund 2 GiB — nicht sinnvoll. AWS empfiehlt
ausdrücklich, die Mindestkapazität so zu wählen, dass der Buffer Pool in
Leerlaufphasen nicht verworfen wird. Bei 0 ACU wird er zwangsläufig verworfen; das
ist der Preis, den man für die Pause bezahlt.

## Syntax lesen — was in einer ACU steckt

Die Abrechnungseinheit ist keine CPU-Zahl, sondern ein Bündel:

```
1 ACU  ≈  2 GiB Arbeitsspeicher
       +  dazu passende CPU
       +  dazu passendes Netzwerk

Cluster im Leerlauf  ≈  n × MinCapacity
                        └─ n = Anzahl Writer + Reader
```

Die untere Zeile ist die Formel aus der AWS-Doku, und sie lässt sich auf das
Szenario anwenden. *Helix Diagnostics* betreibt vierzehn Cluster mit je einer
Instanz, also `n = 1` je Cluster:

- bei `MinCapacity = 0,5`: 14 × 0,5 = **7 ACU rund um die Uhr**, auch nachts und
  am Wochenende
- bei `MinCapacity = 0`: **0 ACU**, sobald das Idle-Fenster abgelaufen ist

Das ist die gesamte Ersparnis der Karte in zwei Zeilen — und zugleich die
Erklärung, warum vor dem 20. November 2024 dieselbe Architektur ein
Dauergrundpreis war. Die Formel ändert sich nicht, nur der einsetzbare Minimalwert.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine Kapazitätsplanung je Entwicklungsteam
- kein Start/Stopp-Skript und kein Zeitplan, der Datenbanken abends abschaltet
- keine Instanzklassen-Änderung mit Ausfallfenster
- keine Verbindungsabbrüche beim Skalieren
- **keine Hochverfügbarkeit** — dafür braucht es weitere Instanzen in anderen AZs
- **keine Storage-Ersparnis** — das Volume wird durchgehend berechnet
- keine Garantie, dass die Pause tatsächlich eintritt, sobald irgendetwas eine
  Verbindung offen hält

Übrig bleiben drei Zahlen an einem Cluster, den die Entwickler wie vorher
ansprechen.

## Wenn du dir eine Sache merkst

**Aurora Serverless v2 regelt Kapazität, nicht Verfügbarkeit. Die ACU atmet
zwischen 0 und 256 — der Speicher atmet nicht mit und wird immer berechnet.**

Provisioniertes Aurora bezahlt den Leerlauf. Ein Start/Stopp-Zeitplan trifft den
unregelmäßigen CI-Rhythmus nicht und braucht beim Start Minuten statt Sekunden.
Serverless v1 gibt es nicht mehr. Und eine zweite AZ macht die Datenbank nicht
billiger, sondern verfügbar — eine andere Frage.

## Prüfungsknackpunkte

**Signalwörter:** „unpredictable", „intermittent", „variable workload",
„development and test databases", „pay only for what you use", „capacity adjusts
automatically". Wenn dazu noch „a brief delay on first connection is acceptable"
steht, ist Scale-to-Zero gemeint und nicht nur Serverless.

**Die Datumsfalle.** Kursmaterial, das vor 2025 geschrieben wurde, sagt „v2
pausiert nicht" und „Maximum 128 ACU". Beides ist überholt: 0 ACU seit dem
20.11.2024, 256 ACU seit der Erweiterung davor. Wer heute wegen Auto-Pause zu v1
greift, greift zu einem Produkt, das es nicht mehr gibt.

**Die Proxy-Falle.** „RDS Proxy" plus „scale to zero" im selben Fragetext ist ein
Widerspruch, kein Lösungsweg.

**Warum „provisioned Aurora mit kleiner Instanzklasse" hier verliert:** Sie senkt
den Grundpreis, aber sie beseitigt ihn nicht — und beim CI-Lauf fehlt oben die
Kapazität, die eine kleine Klasse gerade nicht hat.

**Warum „Cluster abends stoppen und morgens starten" hier verliert:** Der
Lastrhythmus ist unregelmäßig, nicht abendlich. Und das Starten eines gestoppten
Clusters dauert deutlich länger als ein Resume — AWS nennt das als eigenen Vorteil
der Pause gegenüber Stop/Start.

**Warum „Aurora Serverless v1" hier verliert:** EOL am 31.03.2025.

**Warum „RDS Multi-AZ" hier verliert:** Das ist die Verfügbarkeitsachse aus
Karte 22. Die Frage stellt niemand nach Ausfallsicherheit, sondern nach 85 %
bezahltem Leerlauf.
