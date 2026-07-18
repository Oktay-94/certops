---
nr: 24
title: "ElastiCache · RDS — Cache-Aside für einen Produktkatalog mit 95 % Reads"
services:
  - Amazon ElastiCache (Valkey / Redis OSS)
  - Amazon RDS for MySQL
signalwords:
  - 95 % read traffic
  - relational database under load
  - cache-aside / lazy loading
  - in-memory cache
  - reduce database load
domains: [D3, D4]
assets:
  png: battle_card_24.png
  pdf: battle_card_24.pdf
  svg: battle_card_24.svg
status_note: >
  QC-Skript (reparierte Fassung): 0 Befunde. Render-Sanity bestanden.
  SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT MÖGLICH (Regel F9) — view lieferte auf
  das PNG kein auswertbares Bild. Sichtprüfung liegt bei Oktay.
---

# Battle Card 24 — ElastiCache · RDS · Cache-Aside

## Szenario

*Bergmann & Söhne* in Dortmund betreibt einen B2B-Werkzeuggroßhandel mit einem
Online-Katalog über **240.000 Artikel** auf RDS for MySQL. **95 % aller Requests sind
Lesezugriffe**, und die 500 gefragtesten Artikel machen allein 60 % der Abrufe aus —
dieselben Datensätze werden tausendfach pro Minute frisch aus der Datenbank geholt.
Mittags läuft die DB-CPU auf 90 %, die Antwortzeit steigt von 40 ms auf 800 ms.

Eine Besonderheit prägt die Lösung: **Täglich um 6 Uhr** importiert ein Batch neue
Einkaufspreise. Genau daran entscheidet sich, warum diese Karte nicht Karte 21 ist.

## Ablauf — Cache-Aside (Lazy Loading)

**1 — Anfrage trifft die Anwendung.** Ein Einkäufer öffnet eine Artikelseite.

**2 — Die Anwendung fragt zuerst den Cache.** `GET produkt:4711` gegen den
ElastiCache-Endpoint. Wichtig: Das ist ein **eigener Client** mit **eigenen Befehlen**
neben der bestehenden JDBC-Verbindung. Die Anwendung unterhält ab jetzt **zwei**
Verbindungen und muss selbst wissen, welche sie wann benutzt.

**3 — Cache Hit.** Liegt der Wert im Arbeitsspeicher, geht er direkt zurück. Die
Datenbank hat von der Anfrage nie erfahren. Bei 60 % Trefferquote auf den heißen
Artikeln verschwindet der Großteil der Leselast.

**4 — Cache Miss: SELECT gegen RDS.** Fehlt der Schlüssel, fragt die **Anwendung** die
Datenbank. Nicht der Cache — der Cache kennt weder MySQL noch SQL noch die
Verbindungsdaten. Er ist ein Key-Value-Speicher, der nichts über das weiß, was hinter
ihm liegt.

**5 — Die Anwendung schreibt das Ergebnis zurück.** `SET produkt:4711 … EX 300`. Erst
dieser Schritt füllt den Cache. Er ist Anwendungscode, und wenn ein Entwickler ihn
vergisst, funktioniert alles weiter — nur ohne jeden Nutzen, denn jeder Zugriff bleibt
ein Miss.

**6 — Der Preis-Batch schreibt in die Datenbank.** Um 6 Uhr laufen die `UPDATE`s auf
RDS. Die Wahrheit hat sich geändert.

**7 — Und derselbe Batch muss den Cache aufräumen.** `DEL` auf die betroffenen
Schlüssel (oder `SET` mit den neuen Werten). **Passiert das nicht, verkauft der Katalog
bis zum Ablauf der TTL zu alten Preisen** — und niemand bekommt einen Fehler zu sehen.
Die Gabelung im Diagramm ist der Kern der Karte: Ein Schreibvorgang muss **zwei**
Systeme bedienen, und diese Kopplung existiert nur im Code.

## Prüfungs-Kernsatz

> **Cache-Aside heißt: Die Anwendung fragt erst den Cache, lädt bei einem Miss selbst
> aus der Datenbank nach, schreibt selbst zurück und räumt selbst auf. Der Cache
> übernimmt davon nichts.**

## Abgrenzung zu Karte 21 (DAX) — die Pflichtunterscheidung

| | **DAX (Karte 21)** | **ElastiCache (Karte 24)** |
|---|---|---|
| Datenquelle | ausschließlich DynamoDB | beliebig: RDS, Aurora, API-Antworten, berechnete Werte |
| Protokoll | **DynamoDB-API** — dieselben Aufrufe wie vorher | **eigene Befehle** (GET/SET/DEL), zweiter Client |
| Wer füllt den Cache? | der Dienst (write-through, read-through) | **die Anwendung** |
| Wer invalidiert? | der Dienst, sofern die Writes über DAX laufen | **die Anwendung**, immer |
| Datenpfad | App → DAX → DynamoDB (eine Kette) | App → Cache **und** App → DB (zwei Verbindungen) |
| Signalwort | „microseconds", „no cache invalidation code" | „cache-aside", „95 % reads", „relational" |

**Merksatz:** *DAX ist transparent und an DynamoDB gebunden. ElastiCache ist generisch
und verlangt Cache-Aside-Code.* Visuell erkennbar an der Gabelung: Bei DAX führt **ein**
Pfad durch den Cache hindurch, hier gehen **zwei** Pfade von der Anwendung aus.

## Klassiker-Fallen

**1. Veraltete Daten sind ein stiller Fehler.** Ein vergessenes `DEL` produziert keine
Exception — es produziert falsche Preise. Deshalb ist die TTL keine
Optimierungsschraube, sondern die **Notbremse**: Sie begrenzt, wie lange ein
Invalidierungsfehler wirken kann.

**2. Thundering Herd / Cache Stampede.** Werden 10.000 Schlüssel gleichzeitig
geschrieben, laufen ihre TTLs auch gleichzeitig ab — und die Datenbank bekommt in einer
Sekunde alles zurück, wovon sie den ganzen Tag verschont blieb. Gegenmittel: **TTL
streuen** (Jitter, z. B. 300 s ± 60 s), Locking beim Nachladen, oder gezieltes
Vorwärmen nach dem Batch.

**3. Redis vs. Memcached.** Wenn eine Frage nach Replikation, Multi-AZ-Failover,
Persistenz, Sortierung (Leaderboards) oder Pub/Sub verlangt, ist die Antwort
**Valkey/Redis OSS**. Memcached bleibt sinnvoll für einfaches, horizontal geteiltes
Caching mit mehreren Threads — ohne Replikation, ohne Failover, ohne Persistenz.

**4. Die Engine heißt heute anders.** Nach der Redis-Lizenzänderung im März 2024
(SSPL/RSALv2) wurde AWS Gründungsmitglied von **Valkey** (Linux Foundation, Fork von
Redis 7.2.4). Seit 08.10.2024 gibt es **ElastiCache for Valkey**: Drop-in-Ersatz,
**20 % günstiger** bei Node-Clustern, **33 %** bei Serverless, Serverless-Mindestgröße
100 MB statt 1 GB. „ElastiCache for Redis OSS" endet bei Version 7.1 und ist ein
Wartungspfad. **Für die SAA-C03-Prüfung bleibt „ElastiCache for Redis" die erwartete
Antwort** — die Engine-Wahl ist eine Betriebsentscheidung, keine Architekturänderung.

**5. Der Cache ist keine Datenbank.** Er hält Kopien, keine Wahrheit. Wer Daten nur im
Cache hält, verliert sie beim Node-Ausfall — auch mit aktivierter Persistenz. Die
Quelle der Wahrheit bleibt RDS.

**6. Cache-Aside ≠ Write-Through.** Die dritte Strategie neben Lazy Loading. Bei
Write-Through schreibt die Anwendung bei **jedem** Schreibvorgang zusätzlich in den
Cache: nie veraltet, aber jeder Write kostet doppelt, und der Cache füllt sich mit
Daten, die niemand liest. In der Praxis kombiniert man Cache-Aside mit TTL — genau das
zeigt diese Karte.

## Bewusste Vereinfachungen im Diagramm

- **Der Rückweg von RDS zur Anwendung ist nicht gezeichnet.** Er ist in der
  SELECT-Verbindung implizit; ein eigener Pfeil hätte die Kreuzungsfreiheit zerstört,
  ohne etwas zu erklären. (Derselbe Fall wie „Ergebnis-Rückfluss implizit" im
  Stil-Guide.)
- **Der Cache ist als eine Box gezeichnet.** Real ist es eine Replication Group mit
  Primary und Replicas über mehrere AZs, wahlweise mit Cluster Mode und mehreren Shards.
  Für die Cache-Aside-Logik ändert das nichts.
- **ElastiCache Serverless ist nicht dargestellt.** Es wäre hier eine legitime Wahl
  (keine Node-Verwaltung), verschiebt aber nur die Betriebsfrage, nicht das Muster.
- **Der Batch ist gestrichelt**, weil er periodisch läuft und nicht Teil des
  Anfragepfads ist.
- **Die zwei Verbindungen der Anwendung sind als getrennte Pfeile sichtbar, aber nicht
  als getrennte Connection Pools ausgezeichnet.**
- **Farbzuordnung:** Lila = In-Memory-Cache-Schicht — dieselbe Kategorie wie DAX auf
  Karte 21, damit beim Vergleich der beiden Karten die Farbe nicht die Aussage stört.
  Navy = relationale Datenbank (konsistent mit Karte 22/23), Orange = periodischer Job.

## Faktencheck

Geprüft am 18.07.2026 gegen: ElastiCache-Produktseite und `docs.aws.amazon.com/elasticache`
(drei Engines Valkey / Redis OSS / Memcached, Serverless, Global Datastore),
AWS-Ankündigung vom 08.10.2024 (ElastiCache for Valkey, 20 %/33 % Preisabstand, 100 MB
Mindestgröße, Upgrade ohne Ausfallzeit), `WhatsNew`-Historie (Serverless für Memcached
am 27.11.2023, für Redis OSS am 10.01.2024; Cluster-Mode-Migration), sowie die
Lizenzhistorie Redis 7.4 → SSPL/RSALv2 im März 2024 und der Valkey-Fork aus Redis 7.2.4.
