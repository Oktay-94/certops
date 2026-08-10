---
cardNumber: 26
slug: neptune-analytics-falkenbank-betrugsring-traversal
title: "Neptune — Betrugsringe über Beziehungsnetzwerke finden"
services: ["Amazon Neptune", "Neptune Analytics", "AWS Lambda", "Amazon S3"]
domains: ["D3", "D2"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/neptune/latest/userguide/feature-overview-storage.html"
  - "https://docs.aws.amazon.com/neptune/latest/userguide/backup-restore-overview-fault-tolerance.html"
  - "https://docs.aws.amazon.com/neptune/latest/userguide/neptune-serverless-configuration.html"
  - "https://docs.aws.amazon.com/neptune/latest/apiref/API_ServerlessV2ScalingConfiguration.html"
  - "https://docs.aws.amazon.com/prescriptive-guidance/latest/neptune-well-architected-framework/reliability-pillar.html"
  - "https://docs.aws.amazon.com/neptune-analytics/latest/userguide/query.html"
  - "https://aws.amazon.com/neptune/features/"
  - "https://aws.amazon.com/about-aws/whats-new/2023/03/amazon-neptune-serverless-scales-down-1-ncu-costs/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, in einem Aktenschrank die Frage zu beantworten: „Wer hängt über höchstens drei Zwischenschritte mit diesem einen Konto zusammen?"

**Art eins:** Du hast eine Kundenkartei, alphabetisch. Du ziehst die Karte des verdächtigen Kontos, liest die Gerätekennung ab, und gehst dann **die gesamte Kartei durch**, um alle anderen Karten mit derselben Kennung zu finden. Das ist Schritt eins. Für Schritt zwei nimmst du die gefundenen Karten und gehst die Kartei erneut komplett durch. Für Schritt drei ein drittes Mal. Bei 3,1 Millionen Karten dauert jeder Durchgang gleich lang — egal, ob du zwei Treffer hast oder zweitausend.

**Art zwei:** Eine Pinnwand. Jeder Kunde eine Stecknadel, jedes gemeinsame Gerät, jede geteilte Adresse ein Faden zwischen zwei Nadeln. Du legst den Finger auf eine Nadel und folgst den Fäden. Drei Schritte weit sind drei Fingerbewegungen. Wie groß die Pinnwand ist, spielt dabei keine Rolle — nur, wie viele Fäden an *deiner* Nadel hängen.

Das ist der Unterschied zwischen einer relationalen Datenbank und einem Graphen, und er ist kein Geschwindigkeitsunterschied, sondern ein Aufwandsunterschied: **Beim Suchen wächst die Arbeit mit der Datenmenge. Beim Traversieren wächst sie mit der Nachbarschaft.**

Und dann gibt es noch die zweite Frage der Falkenbank, die keine Pinnwand-Fingerbewegung mehr ist: „Zeig mir alle Klumpen auf der Wand, die auffällig dicht verfädelt sind." Dafür musst du die ganze Wand auf einmal ansehen. Deshalb stehen auf dieser Karte zwei Dienste und nicht einer.

## Was es eigentlich ist — die Kante als Objekt

In einer relationalen Datenbank ist eine Beziehung ein Fremdschlüssel: eine Spalte, die eine Zeilennummer enthält. In einem Property Graph ist die Beziehung selbst ein Ding, mit Typ und mit Eigenschaften. So sieht die Frage aus Schritt 3 in openCypher aus:

```
MATCH (neu:Kunde {id: 'K-88213'})-[*1..3]-(bekannt:Kunde)
WHERE bekannt.risiko = 'betrug_bestaetigt'
RETURN bekannt.id, bekannt.risiko
```

Der wichtigste Teil ist das Stück in eckigen Klammern. `[*1..3]` heißt: folge Kanten, mindestens eine, höchstens drei, **egal welcher Art**. Kein Join, keine Tabelle, kein Schema, das die Tiefe vorher kennen müsste. Du sagst „bis zu drei Schritte", und die Engine läuft.

Genau das ist in SQL nicht formulierbar. Ein Self-Join beschreibt **einen** Schritt. Für vier Schritte schreibst du vier Joins. Für „so weit, bis nichts mehr kommt" schreibst du gar nichts, weil du zur Schreibzeit nicht weißt, wie oft du joinen musst.

Und die Attribute, die die Verbindung überhaupt herstellen, sind im Graph keine Spalten am Kunden, sondern eigene Knoten:

```
(k1:Kunde)-[:NUTZT]->(g:Gerät {id: 'DEV-7f31'})<-[:NUTZT]-(k2:Kunde)
```

Zwei Kunden, ein Gerät, zwei Hops Abstand. Stünde die Gerätekennung als Spalte in der Kundentabelle, wäre sie ein Wert, den man vergleichen kann. Als Knoten ist sie ein Ort, an dem man ankommt.

## Der Weg durch die Karte

### Badge 1 — Bulk Load: S3 → Neptune Database

Der Altbestand liegt als CSV in S3 und kommt über den Neptune Bulk Loader herein, nicht über Insert-Statements. Der Loader ist ein HTTP-Endpoint der Datenbank selbst; du gibst ihm einen S3-Präfix und eine IAM-Rolle, mit der er dort lesen darf.

Warum nicht zeilenweise? Weil 240 Millionen Kanten einzeln zu schreiben eine Übung in Geduld ist. Der Loader ist der vorgesehene Weg für Erstbefüllung und Massenimport — danach schreibt die Anwendung laufend selbst weiter.

Der Pfeil ist durchgezogen und trägt „einmalig". Das ist der einzige Schritt auf dieser Karte, der genau einmal passiert.

### Badge 2 — Neuer Antrag: Kontoeröffnung → Fraud-Service

Jede der rund 480.000 Kontoeröffnungen im Jahr bringt Gerätekennung, IP und Zustelladresse mit. Für sich genommen ist das unauffällig — jeder Antrag hat solche Daten.

Interessant werden sie erst durch die Modellierung: **Diese drei Attribute sind im Graph eigene Knoten, nicht Felder am Kunden.** Damit zeigen zwei Anträge, die dasselbe Gerät nennen, auf denselben Geräteknoten und sind zwei Hops voneinander entfernt, ohne dass jemand das eingetragen hätte. Die Verbindung entsteht durch die Modellierung, nicht durch eine Regel.

### Badge 3 — Echtzeit-Traversal: Fraud-Service → Neptune Database

Die Lambda stellt die Abfrage von oben und muss in unter 50 Millisekunden fertig sein. Sie schafft das, weil der Traversal den Fäden folgt: Der Aufwand hängt an der Nachbarschaft des Startknotens, nicht an den 240 Millionen Kanten insgesamt.

Auf der Karte stehen an diesem Pfeil zwei Sprachnamen nebeneinander, „openCypher / Gremlin". Das ist kein Entweder-oder auf Architekturebene — beide fragen dasselbe Property-Graph-Modell ab, und du kannst sie sogar auf demselben Graphen mischen. Welche dein Team nimmt, ist eine Team-Entscheidung. openCypher ist SQL-ähnlich und deshalb schneller zugänglich; Gremlin ist eine Traversal-Sprache mit anderem Denkmodell.

### Badge 4 — Graph laden: Database → Neptune Analytics

Gestrichelter Pfeil, und die Strichelung ist die halbe Aussage. Hier fließt kein Datenstrom, hier wird **kopiert** — aus einem Snapshot oder aus S3.

**Die Kopie altert ab der Sekunde, in der sie fertig ist.** Was danach in die Database geschrieben wird, sieht Analytics nicht. Es gibt keinen laufenden Sync, und die Karte zeichnet bewusst keinen.

### Badge 5 — Befund: Neptune Analytics → Ermittlung

Auf der In-Memory-Kopie laufen Algorithmen statt Abfragen. **Community Detection** findet Gruppen, die untereinander dichter verbunden sind als mit dem Rest — genau die Ringstruktur, nach der das Team sucht. **PageRank** gewichtet, welcher Knoten in so einem Ring der Mittelpunkt ist.

Der Unterschied zu Schritt 3 in einem Satz: **Schritt 3 stellt eine Frage über einen Antragsteller, Schritt 5 stellt eine Frage über den ganzen Graphen.** Ein Traversal weiß, wo er anfängt. Ein Algorithmus fängt überall gleichzeitig an.

### Badge 6 — Risiko-Label zurück in den Graph

Die Befunde wandern als Label an die Knoten **in der Database** zurück, nicht in die Analytics-Kopie. Der Kreis schließt sich: Der Echtzeit-Traversal aus Schritt 3 findet ab sofort, was die nächtliche Analyse gefunden hat — denn seine `WHERE`-Bedingung fragt genau dieses Label ab.

Und die Analytics-Kopie bleibt, was sie ist: ein Wegwerf-Arbeitsexemplar. Sie zu pflegen wäre sinnlos, weil sie beim nächsten Lauf ohnehin neu geladen wird.

### Die Database-Box von innen

In der Box steht mehr Betriebswissen als in manchem eigenen Kasten, und drei Zeilen brauchen eine Anmerkung.

**„VPC-only, kein öffentlicher Endpoint" ist wörtlich zu nehmen.** Es gibt keinen Schalter, der das ändert. Zugriff läuft aus der VPC — Lambda in der VPC, Bastion, VPN, Direct Connect. Eine Antwortoption „öffentlicher Endpoint mit IP-Whitelist" beschreibt ein Produkt, das es nicht gibt.

**„Serverless: 1–128 NCU" ist belegt** und die Spanne ist beidseitig hart: Der höchste einstellbare Maximalwert ist 128 NCU, der niedrigste Minimalwert 1 NCU. Eine NCU sind zwei Gibibyte Arbeitsspeicher plus zugehörige CPU und Netzwerkkapazität. Die Karte schreibt vorsichtig „≈ 2 GB" — die `.md` rechnet dagegen „128 NCU = 256 GB" und meint 256 GiB. Kleinbefund, Fixvorschlag: Einheit auf GiB ziehen oder das Näherungszeichen der Karte übernehmen.

**Auf der Karte steht „Storage wächst in 10-GiB-Segmenten" — richtig ist GB.** Der Neptune User Guide beschreibt das Cluster-Volume als Sammlung logischer Blöcke, denen jeweils zehn Gigabyte zugewiesen werden, und repliziert diese sechsfach über drei Availability Zones. Fixvorschlag für Karte und `.md`: `10-GB-Segmenten`. Die sechs Kopien über drei AZs stimmen unverändert.

**Auf der Karte steht „Failover ~30 s" — diese Zahl ist nicht belegbar.** Zwei offizielle AWS-Quellen widersprechen sich für denselben Fall:

| Quelle | Aussage zum Failover mit vorhandener Replica |
|---|---|
| Neptune FAQs, Produktseite Features | typischerweise innerhalb von 30 Sekunden |
| Neptune User Guide, „Fault tolerance for a Neptune DB cluster" | typischerweise unter 120 Sekunden, oft unter 60 |

Es sind nicht zwei Szenarien. Der User Guide behandelt den Fall ohne Replica getrennt und nennt dafür unter zehn Minuten; der 120/60-Satz steht ausdrücklich im Absatz mit Replica. Nach Faktencheck-Regel steht bei Quellenkonflikt keine Zahl im Text. Zwei Fixwege sind offen: **(a)** Zahl streichen und „Failover automatisch" schreiben, **(b)** die Spanne zeigen und „Failover 30–120 s" schreiben. Für die Prüfung ist ohnehin nur die Richtung relevant: Sekunden, nicht Minuten, und automatisch.

### Die Analytics-Box — kein Cache, sondern ein zweiter Dienst

Neptune Analytics ist kein schnellerer Neptune und keine Betriebsart der Datenbank, sondern ein eigenes Produkt mit eigener Datenkopie. Es ersetzt die Database nicht, es wird aus ihr befüllt.

**Und es spricht nur eine Sprache: openCypher.** Die Doku sagt das ohne Einschränkung — Neptune Analytics unterstützt derzeit ausschließlich openCypher für den Zugriff auf einen Graphen. Wer seine Fraud-Abfragen in Gremlin geschrieben hat, schreibt sie für die Analyse neu. Das ist der teuerste Satz auf dieser Karte, und er steht dort in drei Wörtern.

Die Farbe ist Absicht: Analytics trägt bewusst **nicht** das Lila der Cache-Schicht von Karte 21 und 24. Ein Cache invalidiert. Diese Kopie invalidiert nicht — sie altert.

### Der verworfene Pfad — relationale DB mit Self-Joins

Rotes X, gestrichelt: technisch möglich, fachlich falsch. Vier Hops bedeuten vier Self-Joins über eine Tabelle mit 240 Millionen Zeilen, Laufzeit in Minuten.

Aber die Laufzeit ist nicht der eigentliche Einwand. **Der eigentliche Einwand steht in der dritten Zeile der Box: Die Hop-Tiefe ist vorab nicht bekannt.** SQL braucht die Anzahl der Joins zum Zeitpunkt, an dem die Abfrage geschrieben wird. Die Frage „wie weit hängt das zusammen" kennt die Antwort erst zur Laufzeit. Das ist kein Optimierungsproblem, das ist ein Ausdrucksproblem.

## Die entscheidende Unterscheidung

| | **Neptune Database** | **Neptune Analytics** |
|---|---|---|
| Was es ist | Graphdatenbank, Cluster | In-Memory-Analytik-Engine |
| Daten | die Quelle | **eigene Kopie**, altert |
| Sprachen | Gremlin, openCypher, SPARQL | **nur openCypher** |
| Frage | über **einen** Startknoten | über **den ganzen** Graphen |
| Typische Operation | Traversal, 1–n Hops | Community Detection, PageRank |
| Schreibt die App dahin? | ja, laufend | nein, einmal geladen |

## Die ehrliche Feinheit

**Neptune Serverless skaliert nicht auf null.** Das Minimum ist 1 NCU, und diese eine NCU läuft durch und wird bezahlt — auch nachts, auch am Wochenende. Seit dem 01.03.2023 ist es 1 NCU statt vorher 2,5; darunter geht es nicht.

Das ist die direkte Gegenprobe zu Karte 23: Aurora Serverless v2 kann seit November 2024 auf 0 ACU herunterfahren. Neptune kann das nicht. Wer die Regel von der einen Karte auf die andere überträgt, liegt falsch — und diese Übertragung ist genau die Art Fehler, die eine Prüfungsfrage provoziert.

Ein zweiter Punkt, den die Doku eher nebenbei erwähnt: Ein Minimum von 1 NCU ist in vielen Arbeitslasten **zu niedrig**, um nach längerer Ruhe verlässlich anzulaufen. AWS empfiehlt in seiner eigenen Prescriptive Guidance, das Minimum anzuheben, wenn die Anwendung nicht schnell genug hochskaliert. Der niedrigste erlaubte Wert und der sinnvolle Wert sind hier nicht dasselbe.

Und ein dritter, für die Fraud-Architektur wichtiger: Es gibt genau **einen Writer**. Die bis zu 15 Read Replicas teilen sich denselben Storage und erhöhen den Lesedurchsatz. Wer sie nennt, um Schreiblast zu verteilen, hat das Cluster-Modell nicht verstanden — sie tun das nicht, und ihr eigener Reader-Endpoint tut es auch nicht.

## Syntax lesen — `(a)-[*1..3]-(b)`

Die openCypher-Mustersyntax ist die eine Stelle, an der du bei dieser Karte wirklich buchstabieren musst. Sie zeichnet den Pfad, den sie sucht:

```
MATCH (neu:Kunde {id: 'K-88213'})-[*1..3]-(bekannt:Kunde)
       │     │       │              │  │  │
       │     │       │              │  │  └─ höchstens 3 Kanten
       │     │       │              │  └─ mindestens 1 Kante
       │     │       │              └─ beliebiger Kantentyp
       │     │       └─ Eigenschaft, hier der Einstiegspunkt
       │     └─ Label des Knotens
       └─ Variable, unter der du ihn später ansprichst
```

Runde Klammern sind Knoten, eckige Klammern sind Kanten. Das ist die ganze Grundregel — das Muster sieht aus wie das, was es beschreibt.

Zwei Details entscheiden über das Ergebnis. **Der Bindestrich ohne Pfeilspitze** auf beiden Seiten heißt: Richtung egal. Für einen Betrugsring ist das richtig — ob Kunde A das Gerät zuerst benutzt hat oder Kunde B, ändert nichts daran, dass sie es teilen. Schreibst du stattdessen `-[*1..3]->`, verlangst du eine gleichgerichtete Kette und verlierst genau die Fälle, die dich interessieren.

**Und die Spanne `1..3` ist der Teil, der in SQL fehlt.** Sie steht zur Laufzeit fest, nicht zur Schreibzeit. Ändert das Fraud-Team das Budget von drei auf vier Hops, ändert sich eine Ziffer. In der relationalen Variante ändert sich die Abfrage.

## Was du dadurch nicht baust

- kein Schema mit einer Join-Tabelle je Beziehungsart
- keine rekursiven CTEs, die bei unbekannter Tiefe ohnehin nicht helfen
- keinen Batch-Job, der nächtlich Beziehungspaare vorberechnet
- keinen Suchindex über Attributkombinationen
- keinen eigenen Graph-Algorithmus in Anwendungscode
- keine zweite Datenbank für die Ermittlung — Analytics ist genau dafür da

Übrig bleiben: ein Graph, zwei Abfragearten und ein Label, das zwischen ihnen hin- und herwandert.

## Wenn du dir eine Sache merkst

**Neptune ist die Antwort, wenn die Verbindung das Gesuchte ist — nicht, wenn die Daten bloß zusammenhängen.**

Ein Fremdschlüssel verbindet zwei Zeilen. Eine Kante ist selbst ein Objekt, das man zählen, gewichten und beliebig weit verfolgen kann. Sobald in der Frage „wie viele Schritte" oder „über wen" steckt, ist der Fremdschlüssel das falsche Werkzeug.

## Prüfungsknackpunkte

**Signalwörter:** „highly connected data", „relationships between entities", „fraud ring", „multi-hop", „shared device", „identity graph", „recommendation engine", „social network". Sobald die Beziehung im Fragetext das Objekt der Suche ist, ist es Neptune.

**Warum DocumentDB hier verliert:** Es modelliert Struktur *innerhalb* eines Datensatzes. Verweise zwischen Dokumenten sind Felder, keine traversierbaren Kanten. Signalwort dort ist „MongoDB-kompatibel" oder „JSON-Dokumente".

**Warum DynamoDB hier verliert:** Der Zugriff läuft über einen Schlüssel, nicht über einen Pfad. Eine Mehr-Hop-Frage wird dort zu n Roundtrips im Anwendungscode.

**Warum RDS mit rekursivem SQL hier verliert:** Es ist formulierbar, solange die Tiefe feststeht, und wird bei jedem Hop teurer, weil die ganze Tabelle im Spiel bleibt.

**Warum OpenSearch hier verliert:** Es findet Dokumente über Textähnlichkeit. „Beide erwähnen dasselbe Gerät" ist ein Treffer, „beide hängen über drei Ecken zusammen" ist keiner.

**Die Sprachfalle.** Verbreitetes Kursmaterial sagt „Neptune spricht Gremlin und SPARQL". Das ist seit 2021 unvollständig — openCypher gehört dazu. Neptune Database beherrscht alle drei, Neptune Analytics nur openCypher.

**Die Serverless-Falle.** Eine Antwortoption, die Neptune Serverless bei Inaktivität auf null herunterfahren lässt, ist falsch.

**Die Endpoint-Falle.** Alles, was Neptune aus dem Internet erreichbar macht, ist falsch. VPC-only ist keine Empfehlung.

**Und die Prüfungsantwort bleibt einfach:** Graph-Szenario → Neptune. Die Feinheiten oben sind Schutz vor überholten Distraktoren, keine neuen Antwortmuster.
