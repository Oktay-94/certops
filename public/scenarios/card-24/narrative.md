---
cardNumber: 24
slug: elasticache-cache-aside-bergmann-produktkatalog
title: "ElastiCache · RDS — Cache-Aside für einen Produktkatalog mit 95 % Reads"
services: ["Amazon ElastiCache", "Amazon RDS for MySQL", "Amazon ECS Fargate", "Valkey"]
domains: ["D3", "D4"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/Strategies.html"
  - "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/supported-engine-versions.html"
  - "https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/extended-support-versions.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.consistency.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/evaluate-dax-suitability.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/10/amazon-elasticache-valkey"
  - "https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-elasticache-valkey-8-1"
  - "https://aws.amazon.com/elasticache/pricing/"
---

## Die Grundidee zuerst

Stell dir einen Werkzeuggroßhandel vor, mit einer Theke vorne und einer Lagerhalle
hinten.

**Weg eins:** Jedes Mal, wenn ein Einkäufer nach dem Preis einer Bohrmaschine
fragt, läuft jemand nach hinten, sucht den Artikel im Regal, liest das Schild ab
und kommt zurück. Bei den fünfhundert meistgefragten Artikeln läuft dieser Jemand
den ganzen Tag denselben Weg. Mittags schafft er es nicht mehr, und die Schlange
an der Theke wird lang.

**Weg zwei:** An der Theke hängt ein Zettelkasten. Wer einen Preis abgefragt hat,
schreibt ihn auf einen Zettel und hängt ihn hinein. Die nächste Anfrage nach
derselben Bohrmaschine wird an der Theke beantwortet, ohne dass jemand nach hinten
läuft.

Und jetzt die beiden Sätze, um die es auf dieser Karte geht. **Erstens: Der
Zettelkasten schreibt sich nicht selbst.** Er hängt da und ist leer, bis jemand
Zettel hineinsteckt. **Zweitens: Er räumt sich auch nicht auf.** Ändert das Lager
morgens die Einkaufspreise, hängen an der Theke immer noch die alten Zettel — und
sie sehen aus wie richtige Zettel. Niemand bekommt einen Fehler. Der Laden
verkauft einfach zum falschen Preis, bis jemand die Zettel wechselt.

Der Zettelkasten ist ElastiCache. Das Hin- und Herlaufen mit den Zetteln ist
Cache-Aside, und es ist Arbeit, die in deinem Code steht, nicht im Dienst.

## Was es eigentlich ist

Der Cache ist ein Key-Value-Speicher im Arbeitsspeicher. Er kennt drei Befehle,
und mit diesen dreien ist das gesamte Muster gebaut:

```
GET produkt:4711
   Treffer   ->  Wert zurückgeben, fertig
   nichts    ->  SELECT preis, name FROM artikel WHERE id = 4711
                 SET produkt:4711 "<wert>" EX 300
                 Wert zurückgeben

DEL produkt:4711
   nach jedem UPDATE auf denselben Datensatz
```

Lies das von oben nach unten — es ist die vollständige Lösung der Aufgabe, und es
ist vollständig Anwendungscode. Der Cache steuert davon nichts bei. Er beantwortet
`GET`, er nimmt `SET` entgegen, er führt `DEL` aus. Er weiß nicht, dass hinter ihm
eine Datenbank steht, er weiß nicht, was SQL ist, und er wird nie von selbst
nachschauen, ob sich etwas geändert hat.

Deshalb ist die Zeile „der Dienst tut nichts davon von allein" der wichtigste Satz
im Kasten der Anwendung. Vergisst ein Entwickler das `SET`, funktioniert alles
weiter — nur eben ohne jeden Nutzen, weil jeder Zugriff ein Miss bleibt und
niemand einen Fehler sieht. Vergisst er das `DEL`, funktioniert ebenfalls alles
weiter, und der Katalog verkauft zu alten Preisen.

## Der Weg durch die Karte

### 1 — Anfrage trifft die Anwendung

Ein Einkäufer öffnet eine Artikelseite. Fachlich unspektakulär, aber es erklärt
das Lastprofil: **95 % aller Requests sind Lesezugriffe**, und die fünfhundert
gefragtesten Artikel machen 60 % der Abrufe aus. Es sind nicht viele
verschiedene Anfragen — es sind dieselben, sehr oft.

Genau dieses Profil entscheidet, ob ein Cache überhaupt hilft. Wären es 240.000
gleich häufig abgerufene Artikel, wäre die Trefferquote miserabel und der Cache
teurer Zierrat.

### 2 — Die Anwendung fragt zuerst den Cache

`GET produkt:4711` gegen den ElastiCache-Endpoint. Und hier ist die Zeile, die
diese Karte von Karte 21 trennt: Das ist ein **eigener Client** mit **eigenen
Befehlen**, neben der bestehenden JDBC-Verbindung. Die Anwendung unterhält ab
jetzt zwei Verbindungen zu zwei Systemen und muss in jeder Codezeile selbst
wissen, welche davon gemeint ist.

Auf der Karte steht das als „zwei Verbindungen" im Anwendungskasten, und die
beiden Pfeilbündel zeigen es: Von der Anwendung gehen zwei Wege weg, nicht einer.

### 3 — Cache Hit

Liegt der Wert im Arbeitsspeicher, geht er direkt zurück, in Millisekunden. Die
Datenbank hat von dieser Anfrage nie erfahren.

Das ist die eigentliche Entlastung, und sie ist größer, als die Trefferquote
vermuten lässt: Nicht nur die Antwortzeit fällt, sondern auch alles, was die
Anfrage in der Datenbank ausgelöst hätte — Verbindung, Parsing, Planung, Zugriff
auf den Buffer Pool. Bei 60 % Trefferquote auf den heißen Artikeln verschwindet
der Großteil der Leselast, und die CPU der Datenbank fällt von 90 % zurück.

### 4 — Cache Miss: SELECT gegen RDS

Fehlt der Schlüssel, fragt die **Anwendung** die Datenbank. Nicht der Cache.

Dieser Satz klingt banal und ist der häufigste Denkfehler beim Einstieg. Der Cache
hat keine Verbindungsdaten zur Datenbank, kein Schema, keine Zugangsdaten und kein
SQL. Er ist eine Hashmap mit Netzwerkanschluss. Ein Miss ist für ihn kein
Ereignis, das etwas auslöst — es ist einfach eine leere Antwort.

Das Bild dazu: Der Zettelkasten schickt niemanden ins Lager. Er sagt nur „hier
hängt nichts".

### 5 — Die Anwendung schreibt das Ergebnis zurück

`SET produkt:4711 … EX 300`. Erst dieser Schritt füllt den Cache.

AWS nennt dieses Muster **lazy loading** und benennt seinen Vorteil klar: Weil nur
das im Cache landet, was auch angefragt wurde, füllt er sich nicht mit Daten, die
niemand liest. Und ein Node-Ausfall ist nicht fatal — ein neuer, leerer Node
führt zu Misses und höherer Latenz, aber nicht zu Fehlern.

Der Preis dafür steht in derselben Doku: Jeder Miss kostet drei Wege — Cache
fragen, Datenbank fragen, Cache schreiben. Und die Daten können veralten, weil der
Cache bei Änderungen in der Datenbank eben nicht aktualisiert wird.

### 6 — Der Preis-Batch schreibt in die Datenbank

Täglich um 6 Uhr laufen die `UPDATE`s auf RDS. Die Wahrheit hat sich geändert.

Der Batch ist auf der Karte gestrichelt gezeichnet, weil er periodisch läuft und
nicht Teil des Anfragepfads ist. Er ist trotzdem der Grund, warum diese Karte
existiert: Ohne den täglichen Preisimport wäre eine TTL von fünf Minuten die ganze
Antwort, und es gäbe nichts zu erklären.

### 7 — Und derselbe Batch muss den Cache aufräumen

`DEL` auf die betroffenen Schlüssel — oder `SET` mit den neuen Werten.

**Passiert das nicht, verkauft der Katalog bis zum Ablauf der TTL zu alten
Preisen, und niemand bekommt einen Fehler zu sehen.**

Die Gabelung im Diagramm ist der Kern der ganzen Karte: Ein Schreibvorgang muss
**zwei** Systeme bedienen, und diese Kopplung existiert nur im Code. Es gibt
keinen Mechanismus, der sie erzwingt. Kein Foreign Key, kein Constraint, keine
Transaktion, die beide umfasst. Nur ein Entwickler, der daran gedacht hat.

Das ist der Punkt, an dem Cache-Aside teuer wird — nicht in der Rechnung, sondern
im Betrieb.

### Der Kasten „Amazon ElastiCache"

Engine, Topologie, Datenmodell, Befehle — und darunter zwei Zeilen, die
zusammengehören: *weiß nichts von der Datenbank dahinter — und nichts von SQL.*

Der Kasten nennt Primary und Replica über mehrere AZs. Real ist es eine
Replication Group, wahlweise mit Cluster Mode und mehreren Shards. Für die
Cache-Aside-Logik ändert das nichts, weshalb die Karte es zu einer Box zusammenzieht.
Wichtig ist nur die eine Eigenschaft: Der Cache ist ein eigenständiges System mit
eigenem Endpoint, nicht eine Erweiterung der Datenbank.

### Der Kasten „RDS for MySQL"

Single-Writer, Multi-AZ, Quelle der Wahrheit — die Verbindung zu Karte 22 ist
absichtlich sichtbar. Und die Zeile darunter beschreibt, was der Cache mit der
Datenbank macht: *sieht nur noch die Misses und die Schreibvorgänge.*

Das ist die präziseste Formulierung dessen, was ein Cache leistet. Er senkt nicht
die Last pro Anfrage, er senkt die **Anzahl** der Anfragen, die überhaupt ankommen.
Die Antwortzeit von 800 ms auf 40 ms ist eine Folge davon, keine eigene Leistung.

### Die zwei Randkästen

Links unten stehen die beiden Kästen, die nicht zum Datenpfad gehören.

„**DAX ≠ ElastiCache**" ist grau, weil es ein Querverweis ist und keine Komponente:
DAX trägt die Cache-Logik im Dienst, ElastiCache im Code. Die vollständige
Abgrenzung steht im nächsten Abschnitt.

„**Was schiefgeht**" ist rot und nennt die beiden Fehler, die diese Architektur
produziert: vergessene Invalidierung und gleichzeitig ablaufende TTLs. Beide sind
keine Konfigurationsfehler, sondern Entwurfsfehler — und beide melden sich nicht
von selbst.

## Die entscheidende Unterscheidung

|  | **DAX (Karte 21)** | **ElastiCache (diese Karte)** |
|---|---|---|
| Datenquelle | ausschließlich DynamoDB | beliebig: RDS, Aurora, API, Rechenergebnisse |
| API | spricht die DynamoDB-API | eigene Befehle: `GET` / `SET` / `DEL` |
| Cache-Population | erledigt der Dienst | die Anwendung |
| Invalidierung | bei Writes über DAX automatisch | die Anwendung muss auslösen, immer |
| Codeänderung | Client-SDK und Endpoint | vollständige Cache-Aside-Logik |
| Datenpfad | App → DAX → DynamoDB, eine Kette | App → Cache **und** App → DB, zwei Wege |
| Datenstrukturen | Items und Query-Ergebnisse | Listen, Sets, Sorted Sets, Pub/Sub |

Eine Zeile davon wird regelmäßig missverstanden, und zwar in beide Richtungen.
**„Spricht die DynamoDB-API" heißt: dieselben Aufrufe, nicht derselbe Client.**
Bei DAX bleiben `GetItem` und `Query` stehen, aber das DAX-Client-SDK muss
eingebunden und der Endpoint gesetzt werden. Was entfällt, ist die
Cache-Logik — nicht die Änderung am Code. Karte 21 hat darauf eine eigene Falle
gebaut; wer beide Karten liest, sollte den Satz in dieser Form mitnehmen.

Die Zeile, die Prüfungsfragen entscheidet, ist trotzdem die erste: **DAX kann
ausschließlich DynamoDB.** Steht „relationale Datenbank" im Fragetext, ist DAX
raus, bevor über Latenz geredet wird. Sichtbar ist das an der Gabelung: Bei DAX
führt **ein** Pfad durch den Cache hindurch, hier gehen **zwei** Pfade von der
Anwendung aus.

## Die ehrliche Feinheit

**Die TTL ist keine Optimierungsschraube, sondern die Notbremse.** AWS führt
„Adding TTL" als eigene Strategie neben Lazy Loading und Write-Through und
begründet sie mit den Nachteilen beider. Für diese Karte heißt das konkret: Die
300 Sekunden begrenzen, wie lange ein vergessenes `DEL` wirken kann. Sie
verhindern den Fehler nicht, sie deckeln seinen Schaden. Wer die TTL als
Performance-Einstellung behandelt und auf 24 Stunden hochsetzt, hat die Notbremse
gelöst.

**Thundering Herd.** Werden nach dem 6-Uhr-Batch zehntausend Schlüssel
gleichzeitig geschrieben, laufen ihre TTLs auch gleichzeitig ab — und die
Datenbank bekommt in einer Sekunde alles zurück, wovon sie den ganzen Tag verschont
blieb. Gegenmittel: die TTL streuen (etwa 300 s ± 60 s), beim Nachladen sperren,
oder nach dem Batch gezielt vorwärmen. Das steht auf der Karte als „TTL streuen
(Jitter)".

**Cache-Aside ist nicht die einzige Wahl.** Die Alternative heißt Write-Through:
bei jedem Schreibvorgang zusätzlich in den Cache schreiben. AWS beschreibt den
Handel offen — die Daten im Cache sind nie veraltet, aber jeder Write kostet
doppelt, und der Cache füllt sich mit Daten, die niemand liest. Für einen Katalog
mit 240.000 Artikeln und 500 heißen wäre das Verschwendung. Die Karte kombiniert
deshalb Cache-Aside mit TTL, und der Preis-Batch ist faktisch ein gezieltes
Write-Through für genau die Datensätze, die sich geändert haben.

**Der Cache ist keine Datenbank.** Er hält Kopien, keine Wahrheit. Wer Daten nur
im Cache hält, verliert sie beim Node-Ausfall — auch mit eingeschalteter
Persistenz. Auf der Karte steht deshalb „Quelle der Wahrheit" bei RDS und nicht
beim Cache.

**Die Engine heißt inzwischen anders, die Prüfung noch nicht.** Nach der
Redis-Lizenzänderung im März 2024 wurde AWS Gründungsmitglied von Valkey unter der
Linux Foundation. Seit dem 8. Oktober 2024 gibt es ElastiCache for Valkey: 33 %
günstiger im Serverless-Modus, 20 % bei Node-Clustern, Serverless-Mindestgröße
100 MB statt 1 GB, Upgrade ohne Ausfallzeit. Der Wartungsstand von Redis OSS ist
festgeschrieben — **ElastiCache-Version 7.1 ist die letzte**, alles ab 7.2 gibt
es nur noch als Valkey. Für die SAA-C03-Prüfung bleibt „ElastiCache for Redis" die
erwartete Antwort; die Engine-Wahl ist eine Betriebsentscheidung, keine
Architekturänderung. Die Karte schreibt deshalb „Valkey (oder Redis OSS)".

## Syntax lesen — der Schlüssel und die TTL

```
SET  produkt:4711  "{...}"  EX 300
     │       │       │       │  └─ Sekunden bis zum Ablauf
     │       │       │       └─ Expire-Option
     │       │       └─ der Wert, meist serialisiert
     │       └─ die ID aus der Datenbank
     └─ der Namensraum
```

Der Doppelpunkt ist keine Syntax, sondern Konvention. Der Cache hat keine
Tabellen, keine Schemata und keine Ordner — er hat einen einzigen flachen
Schlüsselraum. `produkt:4711` und `warenkorb:4711` liegen darin gleichberechtigt
nebeneinander und werden nur dadurch unterscheidbar, dass jemand sich auf ein
Präfix geeinigt hat.

Daraus folgt eine Betriebsregel, die man erst spät zu spüren bekommt: Ein
Schlüsselschema ist eine Entwurfsentscheidung, die man kaum noch ändern kann.
Wer heute `produkt:4711` schreibt und morgen den Preis je Kundengruppe
unterscheiden muss, braucht `produkt:4711:gruppe-b` — und muss beim Umstellen
entweder beide Formen parallel bedienen oder den Cache leeren.

`EX 300` ist der Grund, warum diese Karte überhaupt funktioniert. Ohne die Option
liegt der Wert unbegrenzt im Speicher, bis er verdrängt wird oder jemand ihn
löscht.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine Invalidierung, die von selbst geschieht
- keine Transaktion, die Datenbank und Cache gemeinsam umfasst
- keine Garantie, dass der Cache und die Datenbank übereinstimmen
- keine Entlastung bei Schreibvorgängen — die gehen unverändert an RDS
- keine Beschleunigung für Anfragen, die jedes Mal anders sind
- keine Fehlermeldung, wenn die Cache-Logik falsch ist

Übrig bleiben ein zweiter Endpoint, ein zweiter Client und vier Zeilen Logik, die
an jeder Lese- und jeder Schreibstelle richtig stehen müssen.

## Wenn du dir eine Sache merkst

**Cache-Aside heißt: Die Anwendung fragt erst den Cache, lädt bei einem Miss
selbst aus der Datenbank nach, schreibt selbst zurück und räumt selbst auf. Der
Cache übernimmt davon nichts.**

DAX übernähme es — aber nur für DynamoDB. Eine Read Replica verteilt die Leselast,
beschleunigt aber dieselbe Abfrage nicht. Eine größere Instanz verschiebt die
Grenze, statt die Anfragen zu vermeiden. Und Memcached kann das Muster ebenfalls,
nur ohne Replikation, Failover und Persistenz.

## Prüfungsknackpunkte

**Signalwörter:** „95 % read traffic", „same data requested repeatedly",
„relational database under load", „reduce database load", „in-memory cache",
„cache-aside" oder „lazy loading". Das Wort „relational" ist dabei das
trennschärfste — es schließt DAX aus.

**Redis oder Memcached.** Verlangt die Frage Replikation, Multi-AZ-Failover,
Persistenz, Sortierung für ein Leaderboard oder Pub/Sub, ist die Antwort
Valkey beziehungsweise Redis OSS. Memcached bleibt richtig für einfaches,
horizontal geteiltes Caching mit mehreren Threads — ohne Replikation, ohne
Failover, ohne Persistenz.

**Die Invalidierungsfrage.** Steht im Fragetext „without writing cache
invalidation code" oder „no application changes", ist ElastiCache genau die
falsche Antwort — dann ist DAX gemeint, sofern die Quelle DynamoDB ist.

**Warum „DAX" hier verliert:** Die Quelle ist RDS for MySQL. DAX kann
ausschließlich DynamoDB, unabhängig von jeder Latenzanforderung.

**Warum „Read Replica" hier verliert:** Sie verteilt Leselast auf mehr Instanzen,
aber jede einzelne Abfrage läuft weiterhin als SQL gegen eine Datenbank. Bei
tausendfach identischen Abfragen auf dieselben 500 Artikel ist das die teure
Antwort auf eine Frage, die man gar nicht stellen müsste.

**Warum „größere RDS-Instanz" hier verliert:** Vertikale Skalierung kauft Zeit bis
zum nächsten Mittag. Das Lastprofil — dieselben Daten, sehr oft — bleibt
unberührt.

**Warum „ElastiCache ohne TTL" hier verliert:** Ohne Ablauf hängt die Korrektheit
des Katalogs vollständig am `DEL` des Preis-Batches. Ein einziger Fehler dort
wirkt unbegrenzt lange.
