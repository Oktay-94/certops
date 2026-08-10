---
cardNumber: 28
slug: rds-proxy-lambda-almhof-verbindungspool
title: "RDS Proxy — wenn der Lambda-Schwarm die Datenbankverbindungen auffrisst"
services: ["Amazon RDS Proxy", "AWS Lambda", "Amazon RDS for PostgreSQL", "AWS Secrets Manager"]
domains: ["D3", "D2"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-pinning.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-creating.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-modifying-proxy.html"
  - "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy-iam-migration.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/09/amazon-rds-proxy-end-to-end-iam-authentication"
  - "https://aws.amazon.com/rds/proxy/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, Handwerker in ein Haus zu lassen.

**Art eins:** Jeder bekommt beim Ankommen seinen eigenen Hausschlüssel, den er behält, solange er da ist. Das funktioniert bei fünf Handwerkern. Am Tag, an dem neunhundert kommen, brauchst du neunhundert Schlüssel. Du hast zweihundert. Ab dem 201. steht jemand vor der Tür, und zwar nicht, weil das Haus voll wäre — drinnen ist massenhaft Platz —, sondern weil der Schlüsselbrett-Vorrat leer ist.

**Art zwei:** Im Flur hängt ein Kasten mit vierzig Schlüsseln. Wer hinein will, nimmt einen, erledigt seine Sache, hängt ihn zurück. Neunhundert Handwerker kommen durch, weil nie alle gleichzeitig drinnen sind und weil **keiner den Schlüssel behält**.

Genau darum geht es auf dieser Karte. Die Datenbank von Almhof Direktversand ist am Black Friday nicht überlastet — die CPU liegt bei 30 Prozent, die Platten langweilen sich. Ihr sind die Schlüssel ausgegangen.

Und der Satz, der die ganze Karte trägt: **Lambda skaliert über die Anzahl der Instanzen, eine relationale Datenbank begrenzt die Anzahl der Verbindungen.** Zwei Skalierungsmodelle, die nicht zueinander passen — eins wächst in die Breite ohne Grenze, das andere hat eine harte Wand. Der Proxy ist die Übersetzung zwischen beiden.

Merk dir schon hier die Rückseite der Metapher, weil sie später die wichtigste Falle wird: Sobald ein Handwerker das Schloss umbaut, kann er den Schlüssel nicht mehr zurückhängen. Er passt ja nur noch zu ihm.

## Was es eigentlich ist — ein Endpoint mit einer Poolkonfiguration

Der Proxy ist kein Server, den du betreibst, und kein Code, den du schreibst. Er ist ein verwalteter Endpoint in deiner VPC plus einer Handvoll Zahlen:

```json
{
  "DBProxyName": "almhof-orders",
  "EngineFamily": "POSTGRESQL",
  "DefaultAuthScheme": "NONE",
  "RoleArn": "arn:aws:iam::1234:role/AlmhofProxyRole",
  "RequireTLS": true,
  "IdleClientTimeout": 1800,
  "ConnectionPoolConfiguration": {
    "MaxConnectionsPercent": 90,
    "MaxIdleConnectionsPercent": 50,
    "ConnectionBorrowTimeout": 120,
    "InitQuery": "SET application_name = 'orders-api'"
  }
}
```

Lies das von oben nach unten, es ist die komplette Lösung.

`EngineFamily` entscheidet, welches Netzwerkprotokoll der Proxy versteht — `MYSQL`, `POSTGRESQL` oder `SQLSERVER`. Aurora MySQL und RDS for MariaDB laufen unter `MYSQL`, Aurora PostgreSQL und RDS for PostgreSQL unter `POSTGRESQL`.

`DefaultAuthScheme` ist der Punkt, an dem Kursmaterial veraltet ist. `NONE` heißt: Der Proxy holt die Zugangsdaten aus Secrets Manager. Das ist der Default und der Stand, den fast alle Lernunterlagen beschreiben.

`MaxConnectionsPercent: 90` ist die Zahl, aus der die **40** auf der Karte entsteht. Der Proxy darf 90 Prozent von `max_connections` belegen; der Rest bleibt für Wartung und Monitoring. Die tatsächliche Poolgröße ist also keine feste Zahl, sondern ein Prozentsatz der Datenbank.

`InitQuery` sieht harmlos aus und ist der wichtigste Eintrag im ganzen Block. Wenn deine Anwendung beim Verbindungsaufbau ein `SET` absetzt, gehört es hierher und nicht in den Anwendungscode — sonst hebelst du den Pool aus. Warum, steht weiter unten.

Kein `max_connections`-Wert taucht in dieser Konfiguration auf. Die Datenbank bleibt unverändert. Das ist der Kern: **Du änderst nichts an der Datenbank, du stellst etwas davor.**

## Der Weg durch die Karte

### Warum die Karte zwei Zonen hat

Oben und unten steht dieselbe Last: 9.000 Requests pro Sekunde, 900 gleichzeitige Lambda-Ausführungen, 20 Minuten Spitze. Nichts an der Anforderung ändert sich zwischen den Zonen. Der einzige Unterschied ist ein Kasten in der Mitte.

Das ist kein Layout-Zufall, sondern die Aussage der Karte: Der Ausfall oben ist kein Kapazitätsproblem. Wer glaubt, die Lösung sei eine größere Instanz, hat die Karte nicht gelesen.

### Zone oben — jede Instanz öffnet ihre eigene Verbindung

Der Kasten `AWS Lambda` trägt die Zeile `jede öffnet 1 Verbindung`, und das ist der ganze Mechanismus. Eine Lambda-Instanz ist eine eigene Ausführungsumgebung mit eigenem Speicher. Sie kann sich keine Verbindung mit ihren 899 Geschwistern teilen, weil sie nichts von ihnen weiß.

Bei PostgreSQL kostet jede Verbindung Arbeitsspeicher **und einen eigenen Serverprozess**. Neunhundert Prozesse sind nicht neunhundert Zeilen in einer Liste, sondern neunhundert Prozesse, die der Kernel verwalten muss.

### Das rote X — es sitzt an einer bestimmten Stelle

Vergleich die beiden Zonen an genau einer Stelle: Das rote X oben steht dort, wo unten der Proxy steht. Die Lücke im Bild ist die Lücke in der Architektur.

Der Fehler ist `FATAL: sorry, too many clients already`. Nicht Timeout, nicht Deadlock, nicht Speichermangel. Die Datenbank sagt: Ich nehme keine weiteren Anmeldungen an.

Was hier **nicht** hilft: `max_connections` hochsetzen. Du verschiebst die Wand von 200 auf 900 und tauschst einen sauberen Ablehnungsfehler gegen 900 konkurrierende Prozesse, die sich in Speicherdruck und Lock-Overhead gegenseitig ausbremsen. Die Wand ist dann nicht weg, sie steht nur woanders und tut mehr weh.

### Badge 1 — dieselbe Last

Der Kasten unten links wiederholt sich wortgleich, mit der Zusatzzeile `nichts geändert`. Die Karte betont das, weil die häufigste Falschantwort in Prüfungsfragen dieser Art lautet: Lambda-Concurrency drosseln.

Das würde funktionieren und wäre falsch. Du löst ein Verbindungsproblem, indem du Umsatz wegwirfst.

### Badge 2 — Lambda spricht den Proxy-Endpoint an

`Proxy-Endpoint statt DB` steht im Lambda-Kasten, und mehr ist es nicht: eine andere Adresse in der Umgebungsvariablen. AWS beschreibt den Proxy ausdrücklich als für die meisten Anwendungen ohne Codeänderung nutzbar, und es ist keine zusätzliche Infrastruktur zu betreiben.

Das Bild dazu: Du schreibst nicht mehr an die Privatadresse, sondern an ein Postfach. Der Brief kommt trotzdem an, du weißt nur nicht mehr, welchen Weg er nimmt.

Eine Bedingung, die die Karte nicht zeichnet und die in der Prüfung gern als Distraktor auftaucht: Die Lambda muss dafür **selbst in der VPC hängen**. Der Proxy hat keinen öffentlichen Endpoint.

### Badge 3 — der Proxy bündelt 900 auf 40

`bündelt auf 40` steht im Proxy-Kasten, `40 von 200 belegt` in der Datenbank. Der Mechanismus heißt **Multiplexing**: Am Ende jeder Transaktion gibt der Proxy die Datenbankverbindung frei, und die nächste Lambda-Instanz bekommt dieselbe.

Beachte die Einheit, in der das passiert. Nicht pro Request, nicht pro Lambda-Aufruf — **pro Transaktion**. Zwischen `COMMIT` und der nächsten Anweisung gehört die Verbindung niemandem.

Die Datenbank sieht davon nichts. Sie hat 40 Clients, die ununterbrochen arbeiten, und weiß nicht, dass dahinter 900 stehen.

### Der Proxy-Kasten trägt zwei Zeilen, die nicht zum Pool gehören

`IAM + Secrets Manager` und `Failover bis 66 % schneller` sind zwei Nebenprodukte, die in Prüfungsfragen oft der eigentliche Aufhänger sind.

Der Failover-Punkt ist der wichtigere und der weniger bekannte: Bei einem Failover hält der Proxy die Verbindungen der Anwendung offen und routet die Anfragen auf die neue Instanz. Deine Anwendung sieht eine Pause, keinen Verbindungsabbruch — sie braucht also keine Reconnect-Logik. AWS beziffert die Verkürzung der Failover-Zeit mit bis zu 66 Prozent.

Steht in einer Frage „Failover-Zeit verkürzen, ohne die Anwendung anzufassen", ist das der Proxy und nicht Multi-AZ. Multi-AZ macht den Failover möglich, der Proxy macht ihn kurz.

### Die Fußzeile — der Zielkonflikt zu Karte 23

`der offene Pool verhindert Auroras Auto-Pause`. Karte 23 nennt genau das als Nachteil, diese Karte als Nutzen. Das ist kein Widerspruch, sondern **dieselbe Eigenschaft von zwei Seiten**: Der Proxy hält dauerhaft Verbindungen offen.

Für einen Lambda-Schwarm ist das der Sinn der Sache. Für eine Dev-Datenbank, die nachts auf 0 ACU fallen soll, ist es der Schaden — eine offene Verbindung zählt als Aktivität.

## Die entscheidende Unterscheidung — Multiplexing gegen Pinning

Der Proxy hat zwei Betriebszustände. Die Karte zeigt nur den guten.

| | Multiplexing | Pinning |
|---|---|---|
| Wann | Anfragen brauchen keinen Zustand aus vorherigen | Der Proxy sieht eine Zustandsänderung, die für andere Sessions nicht passt |
| Die Verbindung | wird nach jeder Transaktion freigegeben | bleibt bis Sessionende an diesen einen Client gebunden |
| Andere Clients | bekommen sie | bekommen sie nicht |
| Fehlermeldung | — | **keine** |
| Sichtbar über | — | CloudWatch, `DatabaseConnectionsCurrentlySessionPinned` |

Die Zeile, die zählt, ist die vorletzte. Pinning wirft keinen Fehler. Die Anwendung läuft weiter, nur eben ohne Pool — und die Wand kommt zurück, ohne dass irgendwo etwas rot wird.

## Die ehrliche Feinheit

**Auf der Karte steht `IAM + Secrets Manager` — das gibt den Stand vor September 2025 wieder.** Seit dem 12.09.2025 gibt es End-to-End-IAM-Authentifizierung für MySQL und PostgreSQL: Mit `DefaultAuthScheme: IAM_AUTH` verbindet sich der Proxy per IAM zur Datenbank, und es müssen **gar keine Zugangsdaten mehr in Secrets Manager liegen**. Die Kartenzeile liest sich als festes Paar, real ist es ein Entweder-oder. Für die Prüfung bleibt „Secrets Manager statt Zugangsdaten im Code" die erwartete Antwort — der Prüfungsleitfaden ist älter als die Funktion. Kein Fixvorschlag: Die Zeile ist nicht falsch, nur nicht mehr vollständig.

**Die zweite Feinheit ist die, an der die Architektur still scheitert, und sie ist engine-abhängig.** Die `.md` dieser Karte nennt `TRANSACTION_ISOLATION` und `TRANSACTION_READ_ONLY` als getrackte Ausnahmen, bei denen der Proxy nicht pinnt. Das stimmt — **für MariaDB und MySQL**. Diese Karte spielt auf PostgreSQL, und dort steht in der AWS-Doku das Gegenteil: Das Setzen einer Variablen führt zu Session-Pinning, `SET`-Kommandos stehen wörtlich in der PostgreSQL-Pinning-Liste, und Session-Pinning-Filter, mit denen man einzelne Operationen ausnehmen könnte, gibt es für PostgreSQL überhaupt nicht.

**Für PostgreSQL gilt also ohne Einschränkung: Ein einziges `SET` beim Verbindungsaufbau macht den Proxy wirkungslos.** Dazu kommen `PREPARE`/`EXECUTE`, temporäre Tabellen, Cursor, `LISTEN`, `nextval`, `pg_advisory_lock` und ein als Reset-Query konfiguriertes `DISCARD ALL` — genau das, was Connection-Pooling-Bibliotheken standardmäßig tun. Und für alle Engines: Jede Anweisung, deren Text größer als 16 KB ist, pinnt ebenfalls.

Der Ausweg steht in derselben Doku und in der Konfiguration oben: Die Initialisierungs-Statements wandern in `InitQuery`. Der Proxy wendet sie beim Aufbau jeder Poolverbindung an, dein Code setzt sie nicht mehr, das Multiplexing bleibt erhalten.

**Dritte Feinheit, offen: der Preis.** Der Proxy kostet 0,015 USD pro vCPU-Stunde der darunterliegenden Instanz, zusätzlich zu deren eigenen Kosten, mit einer Mindestabrechnung von 2 vCPU. Die `.md` dieser Karte rechnet „bei 16 vCPU rund 44 USD im Monat", und diese Rechnung geht nicht auf. Beide möglichen Fassungen stehen hier, weil die Entscheidung vertagt ist: Entweder gelten **4 vCPU, dann sind es rund 44 USD im Monat** (0,015 × 4 × 730), oder es gelten **16 vCPU, dann sind es rund 175 USD**. Für Aurora Serverless v2 wird ohnehin nach ACU statt vCPU abgerechnet. Merk dir die Struktur, nicht den Betrag: Der Preis hängt an der **Instanzgröße**, nicht an der Zahl der Verbindungen.

## Syntax lesen — die Logzeile, die dir sagt, dass der Pool tot ist

Pinning wirft keinen Fehler, aber es schreibt eine Zeile. Mit aktiviertem Enhanced Logging sieht sie so aus:

```
The client session was pinned to the database connection
[dbConnection=25] for the remainder of the session.
Reason: SQL changed session settings that the proxy doesn't track.
Digest: "set application_name = $1"
 │                    │                      │
 │                    │                      └─ das Statement, normalisiert
 │                    └─ der Grund
 └─ ab hier gehört diese DB-Verbindung nur noch diesem Client
```

Drei Dinge stehen darin, und alle drei sind prüfungsrelevant.

`for the remainder of the session` — nicht für diese Transaktion, nicht für eine Minute. Bis der Client die Verbindung schließt. Bei einer Lambda mit warmem Container kann das Minuten dauern.

`settings that the proxy doesn't track` — die Formulierung verrät, dass es eine Trackingliste gibt. Sie existiert für SQL Server und für MySQL/MariaDB. Für PostgreSQL ist sie leer.

`Digest` — das normalisierte Statement mit Platzhalter statt Wert. Daran findest du die Stelle im Code. In der Praxis ist es fast immer der Verbindungsinitialisierer eines Frameworks oder Treibers, nicht dein eigener Code.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein selbst betriebener PgBouncer auf einer EC2-Instanz
- kein Connection-Pool im Anwendungscode, der über Lambda-Instanzen hinweg ohnehin nicht funktioniert
- kein erhöhtes `max_connections` und keine größere Instanz
- kein Reconnect-Handling für den Failover
- keine Zugangsdaten im Code oder in Umgebungsvariablen
- **kein Cache** — der Proxy speichert keine Abfrageergebnisse

Übrig bleiben: eine geänderte Adresse in einer Umgebungsvariablen und ein Prozentsatz in einer Poolkonfiguration.

## Wenn du dir eine Sache merkst

**Der Pool entkoppelt die Anzahl der Lambda-Instanzen von der Anzahl der Datenbankverbindungen — und ein einziges `SET` hebelt ihn aus.**

Read Replicas verteilen Leselast, nicht Verbindungen; die Verbindungsgrenze gilt pro Instanz und bleibt bestehen. ElastiCache spart Abfragen, aber die verbleibenden brauchen weiterhin eine Verbindung. Ein höheres `max_connections` tauscht eine Ablehnung gegen Speicherdruck.

## Prüfungsknackpunkte

**Signalwörter:** „too many connections", „thousands of concurrent Lambda functions", „connection pooling", „unpredictable spiky traffic against a relational database", „reduce failover time", „no hard-coded database credentials". Tausende gleichzeitige Funktionen plus relationale Datenbank ist immer RDS Proxy.

**Die Kapazitätsfalle.** Der Distraktor lautet „Instanzgröße erhöhen" oder „`max_connections` anheben". Beide klingen plausibel, weil die Frage von Ausfall unter Last spricht. Achte auf die CPU-Angabe in der Aufgabe — steht dort eine niedrige Auslastung, ist es ein Verbindungsproblem.

**Die Pinning-Falle.** Fortgeschrittene Fragen liefern eine Architektur mit Proxy, die trotzdem scheitert. Gesucht ist dann nicht ein anderer Dienst, sondern die Ursache: ein `SET` beim Verbindungsaufbau, temporäre Tabellen oder Prepared Statements. Die Antwort heißt Initialization Query, nicht „größerer Pool".

**Proxy gegen Skalierung auf null.** Steht in der Frage „Dev-Datenbank, nachts keine Kosten", ist der Proxy die **falsche** Antwort — er hält Verbindungen offen und verhindert damit die Auto-Pause von Aurora Serverless v2. Dieselbe Eigenschaft, anderer Kontext.

**Read Replica:** löst Leselast, nicht Verbindungsknappheit — jede Replica hat ihr eigenes Verbindungslimit.

**ElastiCache:** speichert Ergebnisse, nicht Verbindungen. Richtig bei „95 Prozent identische Lesezugriffe", falsch bei „too many clients".

**RDS Data API:** der einzige Distraktor, der thematisch trifft — ein HTTP-Endpoint statt einer Verbindung. Anderer Ansatz mit engerer Engine-Unterstützung; taucht er neben RDS Proxy auf, gewinnt der Proxy, sobald die Frage „ohne Anwendungsänderung" enthält.

**Öffentlicher Endpoint:** existiert nicht. Der Proxy lebt in der VPC, und die Lambda muss dort ebenfalls hängen.
