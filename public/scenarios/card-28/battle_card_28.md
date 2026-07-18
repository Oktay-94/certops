---
nr: 28
title: "RDS Proxy — wenn der Lambda-Schwarm die Datenbankverbindungen auffrisst"
services:
  - Amazon RDS Proxy
  - AWS Lambda
  - Amazon RDS for PostgreSQL
  - AWS Secrets Manager
signalwords:
  - too many connections
  - thousands of concurrent Lambda functions
  - connection pooling
  - unpredictable spiky traffic against a relational database
  - reduce failover time
  - no hard-coded database credentials
domains: [D3, D2]
assets:
  png: battle_card_28.png
  pdf: battle_card_28.pdf
  svg: battle_card_28.svg
status_note: >
  QC-Skript (gepatchte Fassung): 0 Befunde — 8 Boxen, 43 Texte, 15 Segmente,
  3 Badges. Footer 1191 px. Alle Palettenfarben im PNG nachweisbar, fünf
  definierte Freizonen rein weiß. SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT
  MÖGLICH (Regel F9) — liegt bei Oktay.
---

# Battle Card 28 — RDS Proxy · AWS Lambda

## Szenario

**Almhof Direktversand**, Lebensmittelhändler. Die Bestell-API läuft auf
Lambda gegen RDS for PostgreSQL. Im Alltag trägt das mühelos — bis zum Black
Friday: **9.000 Requests pro Sekunde**, Lambda skaliert auf **900
gleichzeitige Ausführungen**, und die Datenbank steht bei
`max_connections = 200`.

Der Fehler kommt binnen Sekunden: `FATAL: sorry, too many clients already`.
Die Datenbank ist dabei nicht ausgelastet — CPU bei 30 %, I/O entspannt. Sie
hat schlicht keine Verbindungsplätze mehr.

**Das ist der Kern des Problems und der Grund für die Karte:** Lambda skaliert
über die Anzahl der Instanzen, und jede Instanz baut ihre eigene
Datenbankverbindung auf. Eine relationale Datenbank kostet jede Verbindung
Arbeitsspeicher und einen eigenen Serverprozess. Zwei Skalierungsmodelle, die
nicht zusammenpassen — eins in die Breite ohne Grenze, eins mit einer harten
Obergrenze.

## Ablauf

Die Karte zeigt zwei Zonen mit derselben Last.

### Zone oben — ohne Proxy

Der Ansturm trifft Lambda, Lambda skaliert auf 900 Instanzen, **jede öffnet
ihre eigene Verbindung**. 900 Anfragen auf 200 Plätze. Das rote X sitzt
bewusst genau dort, wo in der unteren Zone der Proxy steht — die Lücke im
Bild ist die Lücke in der Architektur.

Was hier **nicht** hilft: `max_connections` hochsetzen. Jede Verbindung
kostet in PostgreSQL Arbeitsspeicher und einen Prozess; bei 900 Prozessen
kippt die Instanz in Speicherdruck und Lock-Overhead. Man verschiebt die
Wand, statt sie zu entfernen.

### Zone unten — mit RDS Proxy

**1 — Derselbe Ansturm.** An der Last ändert sich nichts.

**2 — Lambda → Proxy.** Lambda verbindet sich gegen den **Proxy-Endpoint**
statt gegen den DB-Host. Das ist die einzige Änderung in der Anwendung: eine
andere Adresse in der Umgebungsvariablen. AWS beschreibt den Proxy
ausdrücklich als für die meisten Anwendungen ohne Codeänderung aktivierbar,
und es ist keine zusätzliche Infrastruktur zu betreiben.

**3 — Proxy → Datenbank.** Der Proxy hält einen kleinen Satz dauerhafter
Verbindungen offen und verteilt die 900 Client-Verbindungen darauf. Die
Datenbank sieht 40 statt 900. Der Mechanismus heißt **Multiplexing**: Am Ende
jeder Transaktion gibt der Proxy die Datenbankverbindung frei, und die nächste
Lambda-Instanz bekommt dieselbe.

Zwei Dinge kommen gratis dazu: Die Zugangsdaten liegen im **Secrets Manager**
statt im Code, optional erzwingt der Proxy **IAM-Authentifizierung**. Und bei
einem Failover hält der Proxy die Anwendungsverbindungen und routet die
Anfragen direkt auf die neue Instanz — **die Failover-Zeit sinkt um bis zu
66 %**.

## Prüfungs-Kernsatz

> **Der Pool entkoppelt die Anzahl der Lambda-Instanzen von der Anzahl der
> Datenbankverbindungen. Sobald „tausende gleichzeitige Funktionen" und
> „relationale Datenbank" in derselben Frage stehen, ist RDS Proxy die
> Antwort — nicht ein höheres `max_connections`.**

Merkhilfe: Der Proxy ist die Garderobe vor dem Theatersaal. Es kommen 900
Gäste, aber es gibt 200 Plätze. Ohne Garderobe drängen alle gleichzeitig
hinein. Die Garderobe lässt jeden kurz an seinen Platz und nimmt ihn danach
wieder heraus.

## Klassiker-Fallen

**1. Pinning — die Falle, an der die Architektur still scheitert.**
Multiplexing funktioniert nur, wenn eine Anfrage nicht auf Zustand aus einer
vorherigen angewiesen ist. Erkennt der Proxy eine Zustandsänderung, die für
andere Sessions unpassend wäre, **pinnt** er die Client-Verbindung fest an
eine Datenbankverbindung. Ab dann nutzt jede weitere Transaktion dieselbe
Verbindung, und **kein anderer Client kann sie mehr verwenden**, bis die
Session endet.

Praktisch: **Ein einziges `SET` beim Verbindungsaufbau macht den Proxy
wirkungslos.** Ein dokumentierter PostgreSQL-Fall aus 2026 zeigt genau das —
ein Toggle bei jeder Verbindungsinitialisierung pinnte jede einzelne
Verbindung und hebelte den Zweck des Proxys komplett aus. Das Tückische: Es
gibt keine Fehlermeldung. Die Verbindungen laufen weiter, nur eben ungepoolt,
und die Wand kommt zurück.

Ausgenommen sind wenige getrackte Variablen wie `TRANSACTION_ISOLATION` und
`TRANSACTION_READ_ONLY` — und auch die nur im Session-Scope, nicht im
Next-Transaction-Scope. **SQL Server pinnt besonders leicht**; dort ist
Pinning eher Regel als Ausnahme.

**2. Der Zielkonflikt zu Karte 23.**
Karte 23 nennt als Falle, dass RDS Proxy die Auto-Pause von Aurora Serverless
v2 verhindert. Das ist **kein Widerspruch zu dieser Karte, sondern dieselbe
Eigenschaft von der anderen Seite**: Der Proxy hält dauerhaft Verbindungen
offen. Für einen Lambda-Schwarm ist genau das der Nutzen. Für eine Dev-DB, die
nachts auf 0 ACU fallen soll, ist genau das der Schaden — denn eine offene
Verbindung zählt als Aktivität.

**Regel:** Proxy und Skalierung-auf-null schließen einander aus. Vor einer
Produktions-DB mit Lambda-Schwarm gehört ein Proxy. Vor eine Dev-DB, die
pausieren soll, gehört keiner.

**3. „Der Proxy macht die Datenbank schneller."**
Nein. Er ändert nichts an CPU, IOPS oder Abfragezeit und cached **keine
Ergebnisse**. Er verwaltet ausschließlich Verbindungen. Wer ein Leseproblem
hat, braucht Read Replicas (Karte 22) oder einen Cache (Karte 24).

**4. Der Preis wird übersehen.**
Der Proxy kostet **0,015 USD pro vCPU-Stunde der darunterliegenden
Datenbankinstanz**, zusätzlich zu deren eigenen Kosten. Bei 16 vCPU sind das
rund 44 USD im Monat — abhängig also von der Instanzgröße, nicht von der Zahl
der Verbindungen. Auf einer kleinen Instanz kostet er wenige Euro und
verhindert eine ganze Klasse von Produktionsvorfällen; auf einer sehr großen
Instanz ist er eine bewusste Ausgabe.

**5. „RDS Proxy ist öffentlich erreichbar."**
Nein — der Proxy lebt in der VPC. Eine Lambda, die ihn erreichen soll, muss
selbst in der VPC hängen.

## Abgrenzung

| Problem in der Frage | Antwort | Warum nicht das andere |
|---|---|---|
| „too many connections", tausende gleichzeitige Funktionen | **RDS Proxy** | Verbindungsproblem, kein Kapazitätsproblem |
| Leselast erdrückt die Produktions-DB | **Read Replica** (Karte 22) | mehr Leseknoten, nicht weniger Verbindungen |
| 95 % identische Lesezugriffe | **ElastiCache** (Karte 24) | Ergebnisse zwischenspeichern, nicht Verbindungen |
| Dev-DB soll nachts nichts kosten | **Aurora Serverless v2 ohne Proxy** (Karte 23) | ein Proxy verhindert hier die Pause |
| Verbindungslose Abfrage aus Lambda gewünscht | **RDS Data API** | HTTP-Endpoint statt Verbindung — anderer Ansatz, engere Engine-Unterstützung |

## Bewusste Vereinfachungen im Diagramm

- **Der Pool ist als Zahl dargestellt, nicht als Mechanismus.** „bündelt auf
  40" steht in der Box; wie Multiplexing eine Verbindung nach jeder
  Transaktion freigibt, steht nur im Text.
- **Pinning ist nicht gezeichnet.** Es ist die wichtigste Falle der Karte,
  aber ein dritter Zustand hätte die Zwei-Zonen-Logik gesprengt. Als
  Merksatz im Footer und als Falle 1 dokumentiert.
- **Secrets Manager und IAM sind keine eigenen Boxen**, sondern eine Zeile in
  der Proxy-Box.
- **Die VPC ist nicht als Rahmen gezeichnet**, obwohl Proxy und Lambda darin
  liegen müssen.
- **Multi-AZ und Failover fehlen als Elemente.** Der 66-%-Vorteil steht als
  Textzeile in der Proxy-Box; ein Failover-Pfeil hätte eine zweite Geschichte
  erzählt.
- **Die Zahlen 900 und 40 sind plausibel gewählt**, nicht aus einer Messung.
  Die tatsächliche Poolgröße hängt von `MaxConnectionsPercent` und der
  Instanzgröße ab.

## ⚠️ Farbkonvention — bitte gegenlesen

**RDS Proxy bekommt auf dieser Karte Lila.** Damit erweitere ich die
Batch-5-Zuordnung „Lila = In-Memory-Cache-Schicht" auf „**Lila = Schicht davor,
die etwas warm hält**" — DAX hält Items warm (Karte 21), ElastiCache hält
Ergebnisse warm (Karte 24), der Memory Store hält junge Messwerte warm
(Karte 27), RDS Proxy hält Verbindungen warm.

**Das Risiko dieser Entscheidung benenne ich ausdrücklich:** Wer die Farbe als
„Cache" liest, könnte glauben, der Proxy speichere Abfrageergebnisse. **Er tut
das nicht** — siehe Falle 3. Wenn dir das zu nah beieinander liegt, sag es;
dann bekommt der Proxy eine eigene Kategorie und ich zeichne die Karte neu.

RDS/Aurora bleibt Navy — in beiden Zonen dieselbe Farbe, weil es dieselbe
Datenbank ist. Die Überlastung wird über das rote X und den Text ausgedrückt,
nicht über eine andere Farbe: Die Datenbank ist nicht kaputt, sie ist voll.

## Faktencheck-Quellen (geprüft 18.07.2026)

- AWS-Produktseite Amazon RDS Proxy — ohne Codeänderung aktivierbar, keine
  zusätzliche Infrastruktur, Failover-Zeiten bis zu 66 % kürzer, IAM-Zwang
  optional, Secrets-Manager-Integration
- AWS-Doku, „Avoiding pinning an RDS Proxy" (RDS- und Aurora-Fassung) —
  Multiplexing, Pinning bei Session-State-Änderung, getrackte Variablen
  `TRANSACTION_ISOLATION` und `TRANSACTION_READ_ONLY`, Session-Scope vs.
  Next-Transaction-Scope
- AWS-Preisseite RDS Proxy — 0,015 USD pro vCPU-Stunde der darunterliegenden
  Instanz, geprüft Juni 2026
- Praxisbericht PostgreSQL, März 2026 — Toggle bei der
  Verbindungsinitialisierung pinnt sämtliche Verbindungen
- Praxisleitfaden Lambda + RDS Proxy, Dezember 2025 — SQL Server pinnt
  besonders leicht, `SET`-Statements in die Initialization Query verlagern
