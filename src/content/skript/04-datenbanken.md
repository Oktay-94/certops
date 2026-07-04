# Kapitel 4 — Datenbanken

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Die Prüfung fragt fast nie „Was ist Datenbank X?", sondern **„Welche Datenbank passt zu diesem Workload?"** Die Zuordnungstabelle, an der alles hängt:

| Signalwort im Szenario | Datenbank |
|---|---|
| Tabellen, SQL, Transaktionen (OLTP) | **RDS** / **Aurora** |
| Key-Value/JSON, serverless, ms-Latenz, massive Skalierung | **DynamoDB** |
| Cache / Zwischenspeicher (RAM, flüchtig) | **ElastiCache** (+ **DAX** nur für DynamoDB) |
| In-Memory, aber **dauerhaft** (durable) | **MemoryDB** |
| MongoDB / JSON-Dokumente | **DocumentDB** |
| Beziehungen, Graph, „Freunde von Freunden" | **Neptune** |
| Data Warehouse, Analytik, OLAP, Petabyte | **Redshift** |
| Zeitreihen, IoT-Sensoren, Telemetrie | **Timestream** |
| Cassandra / CQL | **Keyspaces** |
| Ledger, unveränderlich, kryptografisch beweisbar | **QLDB** *(🛑 abgekündigt — siehe Karte)* |

---

## Amazon RDS (Relational Database Service)

**Architektonische Einordnung**

RDS ist der **Standard für relationale Datenbanken** in AWS — der Managed-Service-Gegenentwurf zu „MySQL selbst auf EC2 installieren". Es sitzt typischerweise **hinter** der Compute-Schicht (EC2/Beanstalk/Lambda — bei Lambda mit **RDS Proxy** dazwischen), lebt in **privaten Subnetzen** eines VPC und wird durch **Security Groups** geschützt. Backups laufen automatisch (+ AWS Backup zentral).

**Metapher / Konzept**

> Der vollautomatische Autopilot für deine Tabellen-Datenbanken.

**Das Problem & Die Lösung**

Für eine klassische Datenbank (MySQL, PostgreSQL) könntest du einen EC2-Server mieten und selbst installieren. Aber dann bist du der **„Hausmeister"**: nachts aufstehen für Sicherheits-Updates, selbst um Backups kümmern — und bei einem Hardware-Defekt ist die Datenbank offline und die Kunden sind wütend.

Mit **Amazon RDS** drückst du die Hausmeister-Arbeit an AWS ab: „Ich brauche eine PostgreSQL-Datenbank mit 100 GB" → Start → Minuten später der fertige Verbindungs-Link.

- **Vollautomatischer Betrieb:** AWS übernimmt Installation, Patchen des OS und tägliche Backups. Du konzentrierst dich nur auf deine Daten.
- **Der unsterbliche Zwilling (Multi-AZ):** die wichtigste Funktion für Firmen! Per Mausklick baut AWS eine exakte, unsichtbare Kopie in einem **komplett anderen Rechenzentrum (Availability Zone)**. Fällt das Haupt-RZ aus, schaltet RDS **vollautomatisch in Sekunden** um. Die App läuft weiter, als wäre nichts passiert.
- **Die Lese-Helfer (Read Replicas):** Dein Shop wird im TV erwähnt — Zehntausende wollen gleichzeitig **lesen**, wenige **kaufen**. Das überlastet eine einzelne DB. Also erstellst du **„Lese-Kopien"**: die Hauptdatenbank kümmert sich nur um die Käufe, während 5 Lese-Kopien den Ansturm der schauenden Kunden abfangen.

**Die 6 Motoren von RDS:** RDS ist keine eigene DB-Sprache, sondern betreibt bekannte **Engines**: MySQL · PostgreSQL · MariaDB · Oracle · Microsoft SQL Server · **Amazon Aurora** (Amazons hauseigener, extrem hochgezüchteter Motor, bis zu 5-mal schneller als normales MySQL).

**⚠️ Wichtige Abgrenzung:** Das Wörtchen **„Relational"** ist extrem wichtig — Daten liegen wie in Excel in strengen Tabellen/Zeilen/Spalten (**SQL**). Ändert sich die Struktur ständig oder hast du Milliarden loser Dokumente, ist RDS das falsche Werkzeug → **NoSQL**, berühmtester Vertreter: **DynamoDB**.

🛑 **Pro-Tipp SAA — Multi-AZ vs. Read Replica (DIE RDS-Prüfungsfrage schlechthin):**

| | **Multi-AZ** | **Read Replica** |
|---|---|---|
| Zweck | **Verfügbarkeit** (Failover) | **Lese-Skalierung** (Performance) |
| Replikation | **synchron** | **asynchron** |
| Direkt nutzbar? | Nein — Standby ist unsichtbar, nur für Failover | Ja — Apps lesen aktiv davon |
| Reichweite | andere AZ, gleiche Region | gleiche AZ, andere AZ **oder andere Region** |

Falle: „Datenbank soll Ausfall überleben" → **Multi-AZ**, *nicht* Read Replica. „Lese-Last verteilen / Reporting auslagern" → **Read Replica**. Beides kombinierbar.

🛑 **Pro-Tipp SAA — Amazon Aurora im Detail** *(bei dir nur eine Zeile, aber SAA-Kernstoff; faktengeprüft):*
- **Architektur:** Aurora trennt Compute und Storage radikal — der Speicher repliziert **6 Kopien über 3 AZs** automatisch und heilt sich selbst. Deshalb: höhere Grund-Verfügbarkeit als Standard-RDS.
- **Bis zu 15 Read Replicas** (RDS klassisch: 5), mit Auto-Scaling der Replicas und einem eigenen **Reader Endpoint**, der Lese-Traffic verteilt.
- **Aurora Serverless:** die On-Demand-Variante — Kapazität in **ACUs** (~2 GiB RAM je Einheit), skaliert automatisch hoch/runter und seit Ende 2024 sogar **auf 0 ACUs (Auto-Pause)**: keine Verbindungen → Datenbank pausiert, du zahlst nur Storage; erste neue Verbindung → automatisches Aufwachen (~15 s). Ideal für Dev/Test und stark schwankende Lasten. *(Nur MySQL-/PostgreSQL-kompatibel.)*
- **Aurora Global Database:** repliziert die DB in **andere Regionen** mit unter einer Sekunde Verzögerung — für globale Lese-Latenz und regionsübergreifendes Disaster Recovery. *(Konzeptuell das relationale Gegenstück zu DynamoDB Global Tables — aber: nur die Primär-Region schreibt.)*
- **Signalwörter:** „MySQL/PostgreSQL-kompatibel, aber höchste Performance/Verfügbarkeit" → **Aurora**. „Relationale DB mit stark schwankender/seltener Last, pay-per-use" → **Aurora Serverless**. „Relationale DB global mit DR über Regionen" → **Aurora Global Database**.

---

## Amazon RDS Proxy

**Architektonische Einordnung**

Der **Verbindungs-Stoßdämpfer** zwischen serverloser Compute-Schicht und relationaler DB — das fehlende Glied im Muster **API Gateway → Lambda → RDS Proxy → RDS/Aurora**.

**Metapher / Konzept**

> Der Verbindungs-Verteiler vor der Datenbank, der einen Ansturm vieler kurzer Verbindungen bündelt, damit die Datenbank nicht zusammenbricht.

**Das Problem & Die Lösung**

Eine Datenbank (RDS) verkraftet nur begrenzt viele **gleichzeitige Verbindungen** — jede kostet Arbeitsspeicher. Normalerweise kein Problem. Aber **Lambda**: Bei Lastspitzen starten Hunderte/Tausende Lambda-Instanzen gleichzeitig — und **jede will eine eigene DB-Verbindung**. Die Datenbank wird überflutet, erreicht ihr Limit und bricht ein. Das ständige Auf-/Abbauen kurzer Verbindungen ist zudem extrem ineffizient. Genau das passiert in serverlosen Architekturen ständig.

**RDS Proxy** sitzt zwischen Anwendung (z. B. Lambda) und RDS/Aurora und verwaltet einen **Pool wiederverwendbarer Verbindungen (Connection Pooling)**. Alle reden mit dem Proxy, der eine überschaubare Anzahl echter DB-Verbindungen teilt:

- **Schützt vor Überlastung:** Tausende App-Verbindungen → wenige effiziente DB-Verbindungen.
- **Ideal für Serverless:** löst genau das „zu viele Lambdas"-Problem.
- **Schnelleres Failover:** bei Multi-AZ-Ausfall leitet der Proxy schneller um — die App merkt weniger.
- **Sicherheit:** verwaltet DB-Zugangsdaten via **Secrets Manager** (Karte 38) und kann **IAM-Authentifizierung** nutzen.

**Praxis:** Klassische serverlose App: **API Gateway → Lambda → RDS Proxy → RDS**. Bei einem Verkaufsansturm starten 2.000 Lambdas → ohne Proxy erstickt die RDS an den Verbindungen → der Proxy bündelt auf z. B. 100 echte Verbindungen → die Datenbank bleibt stabil. Der Proxy ist der **„Stoßdämpfer"** zwischen explodierender Last und der empfindlichen Datenbank.

**Bild — die Datenbank als Geschäft mit begrenzten Türen:** Ohne Proxy reißen 2.000 Lambdas 2.000 eigene Türen auf → es gibt nur 100 → DB kollabiert. Mit Proxy ist der Proxy der **Türsteher**, der die 100 Türen verwaltet: Befehle laufen nacheinander durch dieselben offenen Türen — die Tür bleibt offen und wird wiederverwendet. **Wichtig:** Alle Bestellungen landen trotzdem in der DB — sie nehmen nur gemeinsam einen schmalen, effizienten Eingang, statt die Wand mit 800 neuen Türen zu durchlöchern.

**🔑 Kernsatz:** Proxy bündelt **Verbindungen** (Türen), nicht **Anfragen** (Befehle). Viele Anfragen → wenige geteilte Verbindungen.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „zu viele Datenbankverbindungen", „Connection Pooling", „Lambda + RDS skaliert nicht / erschöpft Verbindungen", „DB vor Verbindungsflut schützen", „schnelleres DB-Failover" → **RDS Proxy**.
- Die typische Kombination: **Lambda + RDS** → bei Verbindungsproblemen ist RDS Proxy fast immer die Antwort (Lieblingsthema der SAA).
- Arbeitet gern mit **Secrets Manager** zusammen, verbessert Failover.
- **Eselsbrücke:** Proxy = Vermittler/Stellvertreter → steht vor der Datenbank und verteilt die Verbindungen.

> **🧠 Mini-Merkkasten des Original-Blocks (Karten 109–112, wortgetreu erhalten):** Die wichtigsten Abgrenzungen dieses Blocks — **Identität:** Managed AD (Windows-Verzeichnis) ↔ IAM Identity Center (SSO zu AWS) ↔ IAM (ein Konto) ↔ Cognito (App-Kunden). **Daten-Plattform:** Glue (ETL + Catalog) ↔ Lake Formation (Data-Lake-Aufbau + Governance) ↔ DataZone (Daten-Marktplatz für Teams). **Sprach-KI im Einsatz:** Amazon Connect (Callcenter) nutzt Lex/Polly/Transcribe/Comprehend.

---

## Amazon DynamoDB

**Architektonische Einordnung**

DynamoDB ist die **serverlose NoSQL-Standarddatenbank** von AWS und der natürliche Partner von Lambda im Muster **API Gateway → Lambda → DynamoDB** — beide skalieren von 0 auf Millionen, ohne dass du Server siehst. Erweitert wird sie durch **DAX** (Cache), **Streams** (Events → Lambda), **Kinesis** (Daten-Zufluss) und **AppSync** (GraphQL-Zugriff).

**Metapher / Konzept**

> DynamoDB wirft die strengen Tabellen-Regeln über Bord — die völlig flexible, serverlose NoSQL-Datenbank, die alles schluckt, ohne zu meckern.

**Das Problem & Die Lösung**

*(Das Problem steht am Ende der RDS-Karte:)* Wenn sich die Struktur deiner Daten ständig ändert oder du Milliarden von losen Dokumenten hast, die nicht in Tabellen passen, ist RDS das falsche Werkzeug.

**DynamoDB** ist eine **NoSQL-Datenbank** (nicht-relational):
- **Kein SQL (völlig flexibel):** keine starren Spalten — du speicherst lose **„Dokumente"** (meist JSON) oder **Key-Value-Paare**. Eintrag 1 hat zwei Infos (Name, Alter), Eintrag 2 hat 50 (Name, Alter, Hobbys, Lieblingsfarbe...). DynamoDB schluckt alles ohne zu meckern.
- **Wahnsinnig schnell & skalierbar:** komplett **Serverless** — keine EC2-Server im Hintergrund. Ob 10 Nutzer pro Tag oder **20 Millionen Klicks pro Sekunde** — DynamoDB skaliert automatisch mit und antwortet konstant in **winzigen Millisekunden**.

**Global Tables (die Superkraft):** Normalerweise liegt eine DB in *einem* RZ (z. B. Frankfurt) — wer aus Japan zugreift, hat Verzögerung. Mit **Global Tables** baut AWS per Knopfdruck ein weltweites Netz: Speichert ein Nutzer in Tokio einen Highscore, ist er in einem **Wimpernschlag (Millisekunden)** automatisch in Frankfurt und New York synchronisiert. *(Details → eigene Karte 154 unten.)*

**🤝 Die Partnerdienste:**
- **Lambda (ereignisgesteuert):** DynamoDB **„Streams"** — sobald ein neuer Eintrag geschrieben wird (z. B. eine Bestellung), „stupst" die DB sofort Lambda an → Bestellbestätigung per E-Mail, automatisch.
- **DAX (Beschleuniger):** DynamoDB antwortet in Millisekunden — für Echtzeit-Börsenhandel oder Gaming-Highscores manchmal zu langsam. **DAX** ist der Zwischenspeicher davor → Antwortzeit sinkt auf **Mikrosekunden**!
- **Kinesis (Streams):** Bei 100.000 Sensordaten pro Sekunde bändigt **Kinesis** den Daten-Tsunami und lässt ihn ordentlich in DynamoDB fließen.
- **AppSync (GraphQL):** der clevere Dolmetscher für Handy-Apps — statt fünf Anfragen fragt die App einmal „Gib mir das Profil von Nutzer X", und AppSync holt genau die richtigen Daten passgenau ans Handy.

🛑 **Pro-Tipp SAA — die Betriebs-Details, die gefragt werden:**
- **Kapazitätsmodi:** **On-Demand** (pay-per-request, keine Planung — für unvorhersehbare/spitze Last) vs. **Provisioned** (feste Read/Write Capacity Units, günstiger bei planbarer Dauerlast, mit Auto Scaling kombinierbar). Signalwort „unvorhersehbarer Traffic, kein Capacity-Management" → On-Demand.
- **Primärschlüssel:** **Partition Key** (Pflicht) + optional **Sort Key** — das Abfragemuster bestimmt das Schlüsseldesign (NoSQL denkt „Query-first").
- **TTL (Time to Live):** Einträge mit Ablauf-Zeitstempel werden **automatisch kostenlos gelöscht** — für Sessions, Caches, temporäre Daten.
- **Konsistenz:** Standard ist **eventually consistent** beim Lesen (billiger); **strongly consistent** ist pro Anfrage wählbar.

---

## Amazon DAX (DynamoDB Accelerator)

**Metapher / Konzept**

> Der Turbo-Zwischenspeicher, der DynamoDB von Millisekunden auf Mikrosekunden beschleunigt — speziell und nur für DynamoDB gebaut.

**Das Problem & Die Lösung**

DynamoDB liefert einstellige Millisekunden — blitzschnell. Aber bei einer **extrem lese-lastigen** Anwendung, die **dieselben Daten immer wieder** abfragt (Live-Gaming-Leaderboard mit Millionen Lesezugriffen pro Sekunde; Produktseite, die bei jedem Aufruf denselben Artikel holt), summieren sich selbst Millisekunden — und du fragst dieselben Daten unnötig oft direkt aus der Datenbank ab.

**DAX** ist ein **In-Memory-Cache speziell für DynamoDB**: häufig gelesene Daten liegen im RAM, wiederholte Lesezugriffe kommen aus dem Cache — **Millisekunden → Mikrosekunden** (bis ~10× schneller).
- **Microsecond-Performance** für extrem lese-intensive Anwendungen.
- **Nahtlos integriert:** **API-kompatibel** mit DynamoDB — die App muss kaum umgeschrieben werden.
- **Entlastet die Datenbank** (weniger Last, kann Kosten sparen).

**Die Killer-Frage — DAX vs. ElastiCache (beide sind Caches!):**
- **DAX** = Cache **ausschließlich für DynamoDB** — eingebaut, API-kompatibel, kein eigener Cache-Code.
- **ElastiCache** (Redis/Memcached) = der **allgemeine** Cache für alles Mögliche — RDS cachen, Session-Daten, beliebige Daten.
- **Merksatz:** Geht es um DynamoDB? → **DAX**. Geht es um RDS oder allgemeines Caching? → **ElastiCache**. Das Wort „DynamoDB" im Cache-Kontext zeigt fast immer auf DAX.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „DynamoDB" + „Cache/beschleunigen", „Mikrosekunden-Lesezugriffe", „lese-intensive DynamoDB-Anwendung" → **DAX**.
- DAX vs. ElastiCache: DynamoDB → DAX; allgemein/RDS → ElastiCache.
- DAX bringt **Millisekunden → Mikrosekunden** und ist DynamoDB-spezifisch.

---

## DynamoDB Global Tables

**Metapher / Konzept**

> Die Datenbank, die überall auf der Welt gleichzeitig gelesen UND geschrieben werden kann — automatisch synchron.

**Das Problem & Die Lösung**

Eine globale App (Nutzer in Europa, USA, Asien) braucht überall schnelle DB-Zugriffe. Läge die DB nur in Frankfurt, hätten Nutzer in Asien hohe Latenz — und bei einem Regionsausfall wäre alles weg.

**Global Tables** replizieren deine DynamoDB-Tabelle automatisch über mehrere Regionen — **Multi-Region Active-Active**: in **jeder** Region kann gelesen **und geschrieben** werden, Änderungen werden automatisch repliziert (meist < 1 Sekunde):
- **Multi-Region, Multi-Active:** Schreibzugriff in jeder Region (nicht nur Lesen!) — **das ist der Clou**.
- **Niedrige Latenz weltweit:** Nutzer greifen auf die nächste Region zu.
- **Hohe Ausfallsicherheit:** Fällt eine Region aus, übernehmen die anderen nahtlos (globales DR).
- **Automatische Konfliktlösung:** bei gleichzeitigen Schreibvorgängen gilt meist **„Last Writer Wins"**.

**Wann:** global verteilte Anwendungen mit Nutzern auf mehreren Kontinenten (globale Spiele, weltweite Apps).

**⚠️ Prüfungs-Knackpunkte**
- Weltweit niedrige Latenz + überall schreiben + Multi-Region-Ausfallschutz → **Global Tables**.
- **Multi-Active:** Schreiben in jeder Region (Schlüsselmerkmal!).
- Konfliktlösung: **Last Writer Wins**.
- Abgrenzung: normale DynamoDB-Tabelle = regional; Global Tables = multi-regional. *(Konzeptuell wie Aurora Global Database, aber für NoSQL — 🛑 und mit dem Unterschied: Aurora Global schreibt nur in der Primär-Region, Global Tables überall.)*

---

## Amazon ElastiCache

**Architektonische Einordnung**

Der **generische In-Memory-Cache** vor Datenbanken — das klassische Muster: **EC2/App → ElastiCache → RDS**. Entlastet die DB von wiederholten identischen Anfragen und speichert flüchtige Daten (Sessions) im RAM.

**Metapher / Konzept**

> Der extrem schnelle Notizzettel (Caching) direkt vor der Datenbank.

**Das Problem & Die Lösung**

Ein Nachrichten-Blog/Shop: 100.000 Nutzer öffnen morgens die Startseite, und der EC2-Server fragt **jedes Mal** die Datenbank: „Was sind die Top 10 Produkte?" Die DB wühlt 100.000-mal auf der Festplatte — obwohl die Antwort **für alle exakt dieselbe** ist!

**ElastiCache** wird als **Cache (Zwischenspeicher)** vor die Datenbank geschaltet — Daten liegen nicht auf Festplatten, sondern **komplett im Arbeitsspeicher (RAM)**. Der Ablauf:
1. **EC2:** Nutzer besucht die Website → EC2 fragt zuerst ElastiCache: „Hast du die Top 10 schon?"
2. **RDS:** Beim allerersten Nutzer ist der Notizzettel leer (**Cache Miss**) → EC2 holt die Antwort mühsam aus RDS.
3. **Speichern:** EC2 schreibt eine Kopie der Antwort in ElastiCache.
4. **Der Turbo:** Die restlichen 99.999 Nutzer lesen direkt vom Notizzettel — **Mikrosekunden**. Die „echte" RDS kann entspannt schlafen.

**Die zwei Motoren:**
- **Memcached:** sehr simpel, extrem schnell. Reiner, **flüchtiger** Zwischenspeicher für einfache Texteingaben/Webseiten-Schnipsel.
- **Redis:** der absolute **Platzhirsch** (Prüfungs-Merkkasten!). Viel schlauer: komplexe Datentypen, sortiert automatisch Gaming-Highscore-Listen und kann (im Gegensatz zu Memcached) Daten sogar **absichern**, falls der Server neu startet.

**Zum Button „DynamoDB (beschleunigen)":** Man kann ElastiCache (Redis) auch vor DynamoDB schalten — aber DynamoDB hat mit **DAX** einen eigenen, speziellen Cache, der oft die erste Wahl ist.

🛑 **Aktualität:** ElastiCache unterstützt inzwischen als dritten Motor **Valkey** — den Open-Source-Fork von Redis (günstiger, von AWS aktiv getrieben). Für die Prüfung bleiben **Redis vs. Memcached** die relevanten Signalwörter.

---

## Amazon MemoryDB

**Metapher / Konzept**

> Die extrem schnelle **In-Memory-Datenbank**, die trotzdem nichts vergisst — Redis-kompatibel und **durable**.

**Das Konzept (deine Karte, wortgetreu):**

**„In-Memory"** = Daten liegen nicht auf der Festplatte, sondern direkt im **RAM** → abartig schnelle Geschwindigkeit (**Lesezugriffe im Mikrosekundenbereich** — noch schneller als die Millisekunden von DynamoDB!).

**Der entscheidende Prüfungsfaktor:** Normalerweise gehen RAM-Daten beim Stromausfall verloren. MemoryDB ist aber **„durable" (dauerhaft/ausfallsicher)**: es speichert im Hintergrund ein Backup über mehrere Verfügbarkeitszonen (**Multi-AZ**), sodass **absolut nichts verloren geht**. Es ist eine **echte primäre Datenbank**, nicht nur ein Zwischenspeicher.

**Use Cases:** Echtzeit-Anwendungen, bei denen jede Mikrosekunde zählt · Warenkörbe an Black Friday · Live-Leaderboards in Multiplayer-Spielen.

**Signalwörter:** **In-Memory database** · **Durable** (ganz wichtig!) · **Microsecond read latency** · **Redis-compatible**.

**Der schnelle Unterschied zu ElastiCache:** ElastiCache ist auch extrem schnell und nutzt RAM, dient aber **nur als flüchtiger Cache**, um andere Datenbanken zu entlasten. **MemoryDB ist eine vollwertige, dauerhafte Datenbank.**

---

## Amazon DocumentDB

**Metapher / Konzept**

> Der vollständig verwaltete NoSQL-Dienst für **JSON-Dokumente** — das MongoDB von AWS.

**Das Konzept (deine Karte, wortgetreu):**

DocumentDB speichert Daten nicht in starren Tabellen (wie RDS), sondern als **„Dokumente"** (JSON) — extrem flexibel, wenn sich die Datenstruktur häufig ändert.

**Die vier Kernpunkte für die Prüfung:**
1. **MongoDB-Kompatibilität:** das absolute **Schlüsselwort**. Entwickler nutzen ihre bestehenden MongoDB-Treiber und -Tools einfach weiter.
2. **Vollständig verwaltet:** AWS übernimmt Hardware, Patchen, Backups, Setup.
3. **Hochverfügbar & fehlertolerant:** automatische Replikation über **drei AZs**.
4. **Unabhängige Skalierung:** Compute und Storage sind getrennt → beides skaliert unabhängig und extrem schnell.

**Tipp:** Signalwörter **„MongoDB"**, „Migration einer MongoDB-Workload", „JSON-Dokumentendatenbank" → fast immer **DocumentDB**.

---

## Amazon Neptune

**Metapher / Konzept**

> Die vollständig verwaltete **Graphendatenbank** — es geht nicht um die Datensätze, sondern um die **Beziehungen** zwischen ihnen.

**Das Konzept (deine Karte, wortgetreu):**

Daten werden als Netzwerk aus **Knoten** (Personen, Orte, Produkte) und **Kanten** (Verbindungen: „kennt", „kaufte", „besuchte") gespeichert → komplexe Verzweigungen lassen sich extrem schnell abfragen.

**Use Cases:**
- **Soziale Netzwerke:** „Zeige mir alle Freunde von meinen Freunden, die denselben Sportverein mögen wie ich."
- **Betrugserkennung (Fraud Detection):** Muster erkennen (Kreditkarte plötzlich von verschiedenen Geräten, die mit anderen verdächtigen Konten verknüpft sind).
- **Empfehlungsmaschinen:** „Kunden, die das kauften, interessieren sich auch für..."
- **Wissensgraphen:** Verknüpfung großer Informationsmengen, ähnlich Wikipedia.

**Signalwörter:** **Graph Database** · **Highly connected datasets** · **Relationships** · Social Networking, Fraud Detection, Recommendation Engines.

> Damit du die drei großen NoSQL-Datenbanken nicht verwechselst, merk dir diese Faustregel:

🛑 *(Die Faustregel selbst war im Original eine eingebettete Tabelle, die die Text-Extraktion aus der .pages-Datei nicht erhalten kann — hier sinngemäß rekonstruiert:)* **DynamoDB** = Key-Value/serverless, maximale Skalierung → *„das Standard-NoSQL"*. **DocumentDB** = JSON-Dokumente/MongoDB → *„das Dokumenten-NoSQL"*. **Neptune** = Beziehungen/Graph → *„das Beziehungs-NoSQL"*.

---

## Amazon Keyspaces

**Metapher / Konzept**

> Apache Cassandra als verwalteter Dienst — die bekannte NoSQL-Datenbank, ohne selbst Cluster betreiben zu müssen.

**Das Problem & Die Lösung**

Viele Firmen nutzen **Apache Cassandra** (verbreitete Open-Source-NoSQL-DB, gut für riesige verteilte Datenmengen). Aber einen Cassandra-Cluster selbst zu betreiben — Knoten verwalten, skalieren, patchen, Ausfälle managen — ist aufwendig (der typische „Cluster-Stress").

**Keyspaces** ist der **verwaltete, Cassandra-kompatible** Dienst: vertraute Cassandra-Abfragen (**CQL**) und bestehende Tools/Treiber, aber AWS betreibt alles **serverlos** — keine Cluster-Verwaltung, automatische Skalierung, hochverfügbar.

**Die Abgrenzung — Keyspaces vs. DynamoDB:**
- **DynamoDB** = AWS' eigene NoSQL-DB (erste Wahl für **neue** AWS-Projekte).
- **Keyspaces** = wenn man **bereits Cassandra nutzt** oder CQL-Kompatibilität braucht und migrieren will, ohne umzuschreiben.
- **Merksatz:** DynamoDB für neue NoSQL-Projekte; Keyspaces, wenn Cassandra/CQL gefordert ist. *(Gleiches Muster wie MSK↔Kinesis, MQ↔SQS.)*

**⚠️ Prüfungs-Knackpunkte**
- Apache Cassandra / CQL als Managed Service → **Keyspaces**.
- Keyspaces (Cassandra-kompatibel, Migration) ↔ DynamoDB (AWS-nativ, neue Projekte).
- Reiht sich ins Muster **„bestehende Open-Source-Technik behalten"** ein.

---

## Amazon Timestream

**Metapher / Konzept**

> Die vollständig verwaltete, serverlose **Zeitreihendatenbank** — alles dreht sich um die Zeit.

**Das Konzept (deine Karte, wortgetreu):**

Timestream ist dafür gebaut, **Billionen von Ereignissen pro Tag** zu speichern und abzufragen, die an einen Zeitpunkt gebunden sind. Die Datenbank ist extrem schlau: ganz neue Daten liegen im **schnellen Arbeitsspeicher** (sofortige Analysen), ältere wandern **automatisch auf günstigere Festplatten** — Kosten sparen inklusive.

**Use Cases:** **IoT** (Tausende Fabrik-Sensoren melden sekündlich die Temperatur) · **DevOps/Telemetrie** (CPU-Auslastung im Sekundentakt) · **Aktienkurse** (Finanzdaten im Millisekundentakt).

**Signalwörter:** **Time-series** · **IoT applications / Sensors** · **Telemetry** · Messen von Dingen, die sich über die Zeit ändern.

*(Wichtige Abgrenzung zu **Forecast** — Karte 156: Timestream **speichert** Zeitreihen, Forecast **sagt sie voraus**.)*

---

## Amazon Redshift

**Architektonische Einordnung**

Redshift ist das **Data Warehouse** — der analytische Gegenpol zu RDS/DynamoDB. In der Datenpipeline steht es am Ende: operative Systeme → ETL (**Glue**) / Streaming (**Kinesis**) → **Redshift** → BI-Dashboards (**QuickSight**).

**Metapher / Konzept**

> Das vollständig verwaltete, **Petabyte-skalierbare Data Warehouse** für die Cloud.

**Das Konzept (deine Karte, wortgetreu):**

Während relationale Datenbanken (RDS) für alltägliche schnelle **Transaktionen** gedacht sind („Kunde kauft einen Kaffee" → **OLTP**), ist Redshift für komplexe **Analysen** gedacht (**OLAP**). Es sammelt gigantische Mengen historischer Daten aus verschiedenen Quellen und wertet sie rasend schnell aus — dank **spaltenbasiertem Speicherformat** und **massiver Parallelverarbeitung**.

**Use Cases:** **Business Intelligence** (globale Verkaufszahlen der letzten 5 Jahre analysieren, Trends vorhersagen) · **konzernweite Berichte** (Management-Dashboards über alle Abteilungen).

**Signalwörter:** **Data Warehouse** (das wichtigste Schlagwort!) · **Petabyte-scale** · **Analytics** · **Business Intelligence (BI)** · **OLAP**.

🛑 **Pro-Tipp SAA:** Merke zusätzlich **Redshift Serverless** (Warehouse ohne Cluster-Verwaltung, pay-per-use) und **Redshift Spectrum** (SQL-Abfragen direkt auf S3-Daten, ohne sie zu laden). „Analytik ohne Cluster-Management" → Redshift Serverless; „Warehouse-Abfragen auf Daten, die in S3 bleiben" → Spectrum.

---

## Amazon QLDB (Quantum Ledger Database)

> 🛑 **ABGEKÜNDIGT — wichtig für dich:** AWS hat QLDB eingestellt; **End of Support war der 31.07.2025**, Neukunden wurden schon 2024 nicht mehr angenommen. Offizieller Migrationspfad: **Amazon Aurora PostgreSQL** (mit Ledger-ähnlichen Audit-Funktionen). **Konsequenz für die Prüfungen:** QLDB verschwindet aus aktuellen Fragenpools bzw. taucht höchstens noch als *Distraktor* auf — als **richtige** Antwort auf „unveränderliches Ledger" gilt zunehmend Aurora PostgreSQL (bzw. das Konzept „kryptografisch verifizierbares Journal"). Das Konzept-Wissen unten bleibt trotzdem wertvoll. **→ CertOps: QLDB gehört auf deine Deprecated-Liste (wie Q Developer/CodeCommit/CodeCatalyst).**

**Metapher / Konzept (deine Karte, wortgetreu):**

QLDB ist eine vollständig verwaltete **Ledger-Datenbank** („Kassenbuch"/„Hauptbuch"). Kernmerkmal: **Unveränderlichkeit (Immutability)** — einmal geschrieben, kann ein Datensatz **niemals** gelöscht oder heimlich verändert werden; jede Änderung wird als neues Ereignis angehängt. Zudem **kryptografisch überprüfbar**: du kannst mathematisch beweisen, dass die Historie nicht manipuliert wurde. **Wichtiger Unterschied:** Im Gegensatz zur **Blockchain** (dezentral, viele Teilnehmer) ist QLDB **zentralisiert** und gehört nur deinem Unternehmen.

**Use Cases:** **Finanztransaktionen** (lückenlose Kontobewegungen, Auditoren-Nachweis) · **Lieferketten** (Bauteil von Fabrik bis Endkunde) · **Fahrzeughistorie** (Unfälle, Reparaturen, Besitzerwechsel — niemand fälscht den Kilometerstand).

**Signalwörter:** **Ledger** · **Immutable** · **Cryptographically verifiable** · **Centralized transparent history of changes**.

**Dein Prüfungs-Check (wortgetreu):** „Gigantische Datenanalysen für das Management" → **Redshift**. Auditoren fordern „einen unmanipulierbaren Beweis aller Transaktionen" → **QLDB** *(🛑 in neuen Fragenpools: → Aurora PostgreSQL als Ledger-Ersatz)*.

---

*Ende Kapitel 4 — Datenbanken.*
