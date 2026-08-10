---
cardNumber: 21
slug: dynamodb-dax-nova-arena-leaderboard
title: "DynamoDB · DAX — Gaming-Leaderboard mit Mikrosekunden-Reads"
services: ["Amazon DynamoDB", "DynamoDB Accelerator", "Amazon ElastiCache", "Amazon ECS Fargate"]
domains: ["D3", "D4"]
badgeCount: 8
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.concepts.cluster.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.concepts.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.consistency.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DAX.create-cluster.console.html"
  - "https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_dax_Endpoint.html"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, dieselbe Auskunft schneller zu machen.

**Weg eins:** Du legst dir einen Notizzettel neben das Telefon. Bevor du
anrufst, schaust du auf den Zettel. Steht es drauf, sparst du den Anruf. Steht
es nicht drauf, rufst du an und schreibst die Antwort auf. Und irgendwann musst
du entscheiden, wann der Zettel veraltet ist und weg muss — denn der Zettel weiß
nicht, dass sich etwas geändert hat. Jede dieser Regeln ist Code, den **du**
schreibst: nachsehen, eintragen, wegwerfen.

**Weg zwei:** Du bekommst eine Kollegin, die **dieselbe Durchwahl** hat wie die
Auskunft. Du wählst genau wie vorher. Sie hebt ab, und wenn sie die Antwort im
Kopf hat, sagt sie sie sofort. Wenn nicht, ruft sie selbst bei der Auskunft an,
merkt sich die Antwort und gibt sie dir. Und wenn du etwas **änderst**, sagst du
es ihr — sie leitet es an die Auskunft weiter und aktualisiert ihr Gedächtnis.

Weg eins ist ElastiCache. Weg zwei ist **DAX**.

Der Unterschied ist nicht die Geschwindigkeit — beide sind In-Memory. Der
Unterschied ist, dass DAX dieselbe API spricht wie DynamoDB. Deshalb entfällt
die Invalidierungslogik.

Was **nicht** entfällt: Du musst deiner Anwendung sagen, dass sie jetzt die
andere Durchwahl nutzt. Genau an dieser Stelle wird der AWS-Marketingsatz „no
application logic changes" regelmäßig überdehnt — dazu unten mehr.

## Was es eigentlich ist

Der ganze Umbau bei PixelForge ist ein Client-Tausch. Vorher:

```java
AmazonDynamoDB client = AmazonDynamoDBClientBuilder.standard()
    .withRegion("eu-central-1")
    .build();

GetItemRequest req = new GetItemRequest()
    .withTableName("leaderboard-s7")
    .withKey(Map.of("seasonId", new AttributeValue("s7")));

GetItemResult result = client.getItem(req);
```

Nachher:

```java
AmazonDaxClientBuilder builder = AmazonDaxClientBuilder.standard();
builder.withEndpointConfiguration(
    "dax://nova-arena.abc123.dax-clusters.eu-central-1.amazonaws.com");
AmazonDynamoDB client = builder.build();

// ab hier: identisch
GetItemRequest req = new GetItemRequest()
    .withTableName("leaderboard-s7")
    .withKey(Map.of("seasonId", new AttributeValue("s7")));

GetItemResult result = client.getItem(req);
```

Die untere Hälfte ist Zeichen für Zeichen dieselbe. Der Typ heißt weiterhin
`AmazonDynamoDB` — DAX gibt ein Objekt zurück, das dieselbe Schnittstelle
erfüllt. Das ist der ganze Trick und die ganze Aussage der Karte.

Und die obere Hälfte ist der Preis dafür: eine neue Abhängigkeit im Build, ein
anderer Builder, ein Endpoint als Konfigurationswert. Nicht viel — aber nicht
null.

## Der Weg durch die Karte

### 1 — Der Client fragt die Rangliste ab

Der Spiel-Client ruft das Backend, sobald das HUD aufgeht. Fachlich
unspektakulär, aber der Grund für das gesamte Lastprofil: 4,2 Millionen
Spieler fragen **dieselben** hundert Einträge ab, nicht Millionen verschiedene.

Das ist die Bedingung, unter der ein Cache überhaupt etwas bringt. Bei
gleichverteilten Zugriffen auf Millionen unterschiedlicher Items wäre die
Trefferquote niedrig und DAX ein teurer Umweg. Ein Leaderboard ist das
Gegenteil davon: maximale Konzentration auf wenige Schlüssel.

### 2 — Das Backend liest über den Cluster-Endpoint

Die Anwendung ruft weiterhin `GetItem` und `Query` auf, nur gegen den
DAX-Client. Der **Cluster-Endpoint** ist dabei die richtige Adresse, nicht ein
einzelner Node: Über ihn kennt die Anwendung automatisch alle Nodes, auch wenn
Read Replicas dazukommen oder verschwinden.

Zum Endpoint gehört ein Protokollpräfix, und das ist auf dieser Karte fehlerhaft
— siehe „Die ehrliche Feinheit".

### 3 — Cache Hit: Antwort in Mikrosekunden

Liegt das Item im Item Cache, antwortet DAX direkt aus dem Arbeitsspeicher.
DynamoDB wird gar nicht erst angesprochen. Das ist der Zweck der Übung und
zugleich der Grund, warum die RCU-Last einbricht: Ein Treffer erzeugt **keinen**
DynamoDB-Request und kostet damit auch keine Read Capacity.

Bei Nova Arena ist genau das der Hebel gegen die hot partition. Neunhunderttausend
Reads pro Sekunde auf einen Partition Key würden DynamoDB drosseln — bei hoher
Trefferquote kommt nur ein Bruchteil davon überhaupt an.

### 4 — Cache Miss: DAX liest eventually consistent nach

Fehlt das Item, schickt DAX die Anfrage an DynamoDB. Die Dokumentation ist an
dieser Stelle eindeutig: Bei einem Cache Miss verarbeitet DynamoDB die Anfrage
mit **eventually consistent reads** und liefert die Items an DAX zurück.

Daraus folgt eine Eigenschaft, die keine Konfiguration ändern kann: Der
Cache-Inhalt ist per Konstruktion eventually consistent. DAX kann nichts
Stärkeres in den Cache legen, weil es nichts Stärkeres liest.

### 5 — Das Item landet im Item Cache, die TTL läuft an

DAX legt das Item mit einem Zeitstempel ab und gibt es an die Anwendung weiter.
Der Item Cache hat eine **TTL von standardmäßig fünf Minuten**; danach gilt das
Item als Miss und wird neu geholt. Zusätzlich führt DAX eine
LRU-Liste — ist der Speicher voll, fliegen alte Items raus, auch wenn ihre TTL
noch läuft.

Die fünf Minuten sind der Preis für die Geschwindigkeit, und man sollte ihn
laut aussprechen: Ein Leaderboard, das über DAX gelesen wird, kann bis zu fünf
Minuten alt sein. Für eine Rangliste nach Match-Ende ist das vertretbar. Für
einen Kontostand wäre es das nicht.

### 6 — Match-Ende: Schreiben geht ebenfalls über DAX

Das Backend ruft `PutItem` beziehungsweise `UpdateItem` gegen den DAX-Client
auf. Der Grund ist simpel und wird trotzdem oft übersehen: **Nur so erfährt DAX
überhaupt von der Änderung.** Ein Cache, an dem die Schreibvorgänge vorbeilaufen,
kann nicht wissen, dass er veraltet ist.

### 7 — Write-through: erst die Tabelle, dann der Cache

DAX schreibt zuerst nach DynamoDB und aktualisiert danach den Item Cache. Die
Reihenfolge auf der Karte ist richtig, und die Doku ist bei der Feinheit
präzise: Als Write-through-Cache reicht DAX Schreibvorgänge **synchron** an
DynamoDB durch und repliziert die resultierenden Updates anschließend
**automatisch und asynchron** in den Item Cache über alle Nodes des Clusters.

Das hat eine Konsequenz für schreiblastige Workloads: Jeder Write zahlt den
zusätzlichen Netzwerk-Hop über DAX, ohne dafür schneller zu werden. DAX
beschleunigt Reads. Writes werden dadurch nicht langsamer im Sinne von
gedrosselt, aber sie gewinnen auch nichts.

### 8 — Der Bypass

Alles, was an DAX vorbeischreibt, aktualisiert die Tabelle, aber nicht den
Cache. Die Doku beschreibt den Fall wörtlich: Wenn jemand anderes das Item mit
einem DynamoDB-Client aktualisiert und DAX dabei komplett umgeht, liefert ein
`GetItem` über den DAX-Client andere Ergebnisse als dasselbe `GetItem` über den
DynamoDB-Client — beide Systeme halten inkonsistente Werte für denselben
Schlüssel, bis die TTL des DAX-Items abläuft.

Auf der Karte stehen die drei typischen Verursacher: ein Admin-Skript, eine
Lambda ohne DAX-Client, und die Replikation einer **Global Table**. Der dritte
ist der gefährlichste, weil ihn niemand als Schreibvorgang wahrnimmt.

### Der Cluster: drei Nodes in drei AZs

Die drei kleinen Kästen im DAX-Cluster sind keine Dekoration. Ein DAX-Cluster
unterstützt bis zu **elf Nodes** — einen Primary plus maximal zehn Read
Replicas. Für Produktion empfiehlt AWS nachdrücklich mindestens drei Nodes in
verschiedenen Availability Zones; **drei Nodes sind erforderlich, damit ein
Cluster fehlertolerant ist**. Ein- und Zwei-Node-Cluster sind es ausdrücklich
nicht.

Die Arbeitsteilung: Der Primary bedient Leseanfragen, führt die Schreibvorgänge
gegen DynamoDB aus und wirft Daten nach der Eviction Policy aus dem Cache. Read
Replicas bedienen ebenfalls Leseanfragen, schreiben aber **nicht** nach
DynamoDB. Fällt der Primary aus, macht DAX automatisch eine Replica zum neuen
Primary.

### Die drei Randkästen

Der gelbe Kasten nennt die Kostenrichtung: DAX kostet **Node-Stunden**, DynamoDB
kostet **pro Request**. Der graue Kasten nennt, was DAX nicht beschleunigt. Der
rote Kasten wiederholt den Bypass als eigenständige Warnung — er steht dort,
weil dieser Fall im Betrieb nicht auffällt: Beide Antworten sehen technisch
gültig aus, es gibt keine Fehlermeldung.

## Die entscheidende Unterscheidung

| | **DAX** | **ElastiCache (Redis/Valkey)** |
|---|---|---|
| Datenquelle | ausschließlich DynamoDB | beliebig: RDS, Aurora, API, Rechenergebnisse |
| API | spricht die DynamoDB-API | eigene Redis-Befehle |
| Cache-Population | erledigt der Dienst | die Anwendung |
| Invalidierung | bei Writes über DAX automatisch | die Anwendung muss auslösen |
| Codeänderung | Client-SDK und Endpoint | vollständige Cache-Aside-Logik |
| Datenstrukturen | Items und Query-Ergebnisse | Listen, Sets, Sorted Sets, Pub/Sub |
| Konsistenz | nur eventually consistent | frei wählbar, weil selbstgebaut |

Die Zeile, die Prüfungsfragen entscheidet, ist die erste: **DAX kann
ausschließlich DynamoDB.** Steht „relationale Datenbank" oder „berechnetes
Ergebnis" im Fragetext, ist DAX raus, bevor über Latenz geredet wird.

Die Zeile darunter erklärt, warum Redis trotz mehr Aufwand oft gewinnt: Ein
Leaderboard baut man in Redis mit einem Sorted Set und bekommt Rangberechnung
geschenkt. DAX cacht nur, was DynamoDB ohnehin liefert.

## Die ehrliche Feinheit

**Auf der Karte steht `daxs://… Port 8111` — diese Kombination gibt es nicht.**
Die API-Referenz ist unmissverständlich: Die Standard-Ports sind 8111 für das
`dax`-Protokoll und 9111 für `daxs`. Die Konsolenanleitung sagt dasselbe aus
Netzwerksicht — ein Cluster kommuniziert über TCP-Port 8111 bei unverschlüsselten
und 9111 bei verschlüsselten Clustern. `daxs` ist der verschlüsselte Fall und
gehört zu 9111.

Richtig ist also **eine** der beiden Kombinationen, je nachdem, was die Karte
zeigen soll: `dax://…` mit Port **8111** für einen Cluster ohne Encryption in
Transit, oder `daxs://…` mit Port **9111** mit. Welche der beiden Varianten auf
die Karte kommt, ist eine didaktische Entscheidung für den Sammelpass und hier
bewusst offengelassen. Für die Prüfung genügt das Paar-Wissen: Das `s` und die
`9` gehören zusammen.

**Der Query Cache ist ein zweiter, unabhängiger Speicher — und er wird nicht
invalidiert.** `Query`- und `Scan`-Ergebnisse landen nie im Item Cache, sondern
in einem eigenen Cache, und DAX verwirft gecachte Ergebnismengen **nicht**, wenn
sich einzelne Items ändern. Ein `PutItem` über DAX aktualisiert den Item Cache
sofort — die Query, die dasselbe Item enthält, liefert bis zum TTL-Ablauf
weiterhin den alten Stand. Für Nova Arena heißt das: Die Rangliste als
`Query`-Ergebnis kann älter sein als jedes einzelne Item darin.

**Write-through ist nicht zweiphasig.** Eine verbreitete Verkürzung lautet, der
Schreibaufruf gelte nur als erfolgreich, wenn Tabelle **und** Cache aktualisiert
sind. Das trifft die Doku nicht: Der Durchgriff auf DynamoDB ist synchron, die
Cache-Aktualisierung über die Nodes erfolgt danach asynchron. Der Erfolg hängt
am DynamoDB-Write.

**Die hot partition ist gedämpft, nicht beseitigt.** Solange die Trefferquote
hoch ist, kommt wenig bei der Partition an. Nach einem Cluster-Neustart, nach
einem Wartungsfenster oder nach einem Season-Wechsel ist der Cache leer, und die
volle Last schlägt für einige Sekunden durch. Wer knapp provisioniert, merkt das
genau dann.

**DAX ist eine VPC-Sache und eine Regionssache.** Der Zugriff ist auf
Anwendungen beschränkt, die auf EC2-Instanzen innerhalb einer VPC laufen — es
gibt keinen Weg aus dem Internet. Und ein Cluster kann ausschließlich mit
DynamoDB-Tabellen **derselben Region** arbeiten. Tabellen in anderen Regionen
brauchen dort eigene Cluster. Dazu kommt eine Obergrenze, die selten stört und
gern zitiert wird: maximal **500 Tabellen** je Cluster.

## Syntax lesen

Der Cluster-Endpoint trägt seine halbe Konfiguration im Namen:

```
daxs://nova-arena.abc123.dax-clusters.eu-central-1.amazonaws.com
│      │          │      │            │
│      │          │      │            └─ Region — Tabellen MÜSSEN hier liegen
│      │          │      └────────────── fester Service-Namensraum
│      │          └───────────────────── vergebener Cluster-Suffix
│      └──────────────────────────────── dein Clustername
└─────────────────────────────────────── Protokoll:
                                         dax  → unverschlüsselt, Port 8111
                                         daxs → TLS, Port 9111
```

Zwei Dinge liest man daran ab. Erstens: Die Region steht im Endpoint, und damit
ist die Regionsbindung keine Konfigurationsoption, sondern eine Adresse.
Zweitens: Am Protokollpräfix erkennt man sofort, ob Encryption in Transit
aktiv ist — und ob die Security-Group-Regel auf 8111 oder 9111 stehen muss.

Ein Node-Endpoint sieht anders aus und trägt den Port sichtbar am Ende. Die
Anwendung sollte ihn trotzdem nicht benutzen: Wer einen einzelnen Node adressiert,
verliert Lastverteilung und Failover.

## Was du dadurch nicht baust

- **Keine strong consistency.** Strongly consistent Reads werden durchgereicht
  und **nicht gecacht**; DAX gibt das Ergebnis an den Client weiter, ohne es
  abzulegen. Die Latenz fällt damit auf DynamoDB-Niveau zurück.
- **Keine schnelleren Writes.** Write-through fügt einen Hop hinzu. Wer
  schreiblastig ist, gewinnt nichts.
- **Keinen Multi-Region-Cache.** Global Tables replizieren die Tabelle, nicht
  den Cache. Für mehrere Regionen brauchst du je Region einen Cluster — und die
  Replikationsschreibvorgänge umgehen sie alle.
- **Keine Datenstrukturen.** Sorted Sets, Pub/Sub, Zähler mit atomaren
  Operationen: alles Redis-Territorium.
- **Keine Tabellenverwaltung.** DAX bedient Datenoperationen. `CreateTable` und
  Verwandte gehen weiterhin direkt an DynamoDB.
- **Keine Fehlertoleranz mit weniger als drei Nodes.** Ein Ein-Node-Cluster ist
  ein Testaufbau, kein Produktionsaufbau.

## Wenn du dir eine Sache merkst

**DAX ist der einzige Cache, der die DynamoDB-API selbst spricht — deshalb
entfällt die Invalidierungslogik, nicht der Client-Wechsel. Und gecacht wird
ausschließlich eventually consistent.**

Warum ElastiCache hier verliert: Es verlangt Cache-Aside-Code — nachsehen, bei
Miss lesen, selbst eintragen, selbst invalidieren. Das Team hat für genau diesen
Code weder Zeit noch Budget.

Warum „Read Capacity erhöhen" hier verliert: Die Frage nennt Mikrosekunden. Mehr
RCU macht DynamoDB nicht schneller als einstellige Millisekunden.

Warum „Global Secondary Index" hier verliert: Ein GSI löst ein Zugriffsmuster,
kein Latenzproblem. Dieselben Millisekunden, andere Partition.

## Prüfungsknackpunkte

**Signalwörter für DAX:** „microseconds" · „read-heavy, same items repeatedly" ·
„in-memory cache for DynamoDB" · „no cache invalidation code" · „minimal
application changes" · „hot partition".

**Signalwörter gegen DAX:** „strongly consistent" · „write-heavy" · „relational
database" · „cache-aside" · „multiple data sources".

**Warum „no application logic changes" trotzdem die erwartete Antwort ist:** Der
Satz stammt aus dem AWS-Marketing und meint den Kontrast zu ElastiCache, wo die
gesamte Cache-Logik von Hand entsteht. Real brauchst du das DAX-Client-SDK und
einen neuen Endpoint. In der Prüfung ist „minimal application changes" die
gemeinte Option — im Betrieb ist es ein Ticket.

**Warum `ConsistentRead=true` DAX wirkungslos macht:** Die Anfrage wird
durchgereicht und das Ergebnis nicht gecacht. Wer eine
Strong-Consistency-Anforderung im Fragetext liest und trotzdem DAX ankreuzt, hat
die Falle nicht gesehen.

**Warum „Global Tables plus DAX" eine Falle ist:** Die Replikation schreibt an
DAX vorbei. Der Cache bleibt bis zum TTL-Ablauf veraltet, ohne dass jemand einen
Fehler sieht.

**Warum „bis 10 Nodes" falsch ist:** Elf. Ein Primary plus maximal zehn Read
Replicas. Verbreitetes Kursmaterial nennt hier die Replica-Zahl als
Gesamtzahl.

**Warum „ein Cluster für alle Regionen" verliert:** Ein Cluster bedient nur
Tabellen seiner eigenen Region.

**Warum „DAX senkt garantiert die Kosten" zu kurz greift:** DAX kostet
Node-Stunden unabhängig vom Verkehr, DynamoDB kostet pro Request. Der Break-even
hängt an der Trefferquote. Für die Prüfung bleibt „DAX senkt die Leselast und
damit die RCU-Kosten" die erwartete Antwort — im Betrieb ist es eine Rechnung.
