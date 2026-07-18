---
nr: 23
title: "Aurora Serverless v2 — Dev/Test-Kapazität, die bis auf null atmet"
services:
  - Amazon Aurora Serverless v2 (PostgreSQL-compatible)
  - Aurora Cluster Volume
signalwords:
  - unpredictable / intermittent workload
  - development and test databases
  - capacity adjusts automatically
  - pay only for what you use
  - cold start is acceptable
domains: [D4, D3]
assets:
  png: battle_card_23.png
  pdf: battle_card_23.pdf
  svg: battle_card_23.svg
status_note: >
  QC-Skript: 0 Befunde. WICHTIG: Das QC-Skript wurde während dieser Karte
  repariert — Texte innerhalb gestrichelter Zonen wurden zuvor weder von
  Prüfung (a) noch von (b) erfasst. In der ersten Fassung liefen dadurch drei
  Legendenzeilen quer durch die Kapazitätskurve (12 Kollisionen). Nach der
  Reparatur gefunden und behoben. Render-Sanity bestanden. SICHTPRÜFUNG DURCH
  CHAT-CLAUDE NICHT MÖGLICH (Regel F9) — liegt bei Oktay.
---

# Battle Card 23 — Aurora Serverless v2

## Szenario

*Helix Diagnostics* in Heidelberg entwickelt Software für Labordiagnostik. **14
Entwicklungsteams** brauchen je eine eigene Aurora-PostgreSQL-Datenbank für
Feature-Branches und Integrationstests. Das Nutzungsprofil ist zerklüftet: Werktags
zwischen 9 und 18 Uhr läuft alle 40 Minuten ein CI-Job, der die Datenbank **zwei
Minuten lang unter Volllast** setzt und danach nichts mehr tut. Nachts und am
Wochenende passiert gar nichts.

Heute laufen dafür 14 provisionierte `db.r6g.xlarge`-Instanzen rund um die Uhr.
**Rund 85 % der Compute-Rechnung ist Leerlauf.** Gesucht ist eine Lösung, bei der die
Entwickler nichts umkonfigurieren müssen und ein CI-Lauf nicht am Kaltstart scheitert.

## Ablauf

**1 — Die CI verbindet sich wie gegen jede andere Aurora-Datenbank.** Der Cluster-Endpoint
bleibt derselbe, der Treiber bleibt derselbe. „Serverless" ist bei v2 eine
**Instanzklasse** (`db.serverless`) innerhalb eines ganz normalen Aurora-Clusters — kein
anderes Produkt, keine andere API. Man kann in einem Cluster sogar provisionierte und
serverlose Instanzen mischen.

**2 — Compute und Storage sind getrennt.** Die Rechenschicht arbeitet auf dem
**Cluster Volume**, das sechs Kopien über drei AZs hält und in 10-GB-Schritten bis
128 TiB wächst. Diese Trennung ist der Grund, warum die Rechenkapazität überhaupt auf
null gehen kann, ohne dass Daten verschwinden — und zugleich der Grund, warum eine
pausierte Datenbank **trotzdem Geld kostet**.

**3 — Resume in etwa 15 Sekunden.** Trifft morgens die erste Verbindung ein, fährt die
Instanz aus dem Pause-Zustand hoch. Für einen CI-Lauf ist das unkritisch — vorausgesetzt,
die Client-Timeouts sind größer als die Resume-Zeit. AWS nennt hier ausdrücklich
`connectTimeout` und `sslResponseTimeout` beim JDBC-Treiber.

**4 — Skalierung im laufenden Betrieb.** Beim CI-Lauf steigt die Kapazität in
**0,5-ACU-Schritten** binnen Sekunden auf die benötigte Spitze und fällt danach wieder.
Entscheidend: Das passiert **in-place** — kein Failover, kein Verbindungsabbruch, keine
neue Instanz. Die Skalierungsgeschwindigkeit wächst mit der aktuellen Größe: Eine
Instanz bei 64 ACU legt schneller zu als eine bei 1 ACU.

**5 — Auto-Pause nach dem Idle-Timeout.** Steht die Mindestkapazität auf **0 ACU** und
liegt für die konfigurierte Dauer (**300 s bis 86.400 s**) keine Nutzerverbindung an,
pausiert die Instanz. Die Compute-Abrechnung stoppt, der Cluster bleibt im Status
`Available`, `ACUUtilization` meldet 0 %. Für die 14 Dev-Datenbanken heißt das: Nachts,
am Wochenende und in jeder längeren Pause zwischen zwei CI-Läufen fällt kein
Compute-Preis an.

## Prüfungs-Kernsatz

> **Aurora Serverless v2 regelt Kapazität, nicht Verfügbarkeit. Die ACU atmet zwischen
> 0 und 256 — der Storage atmet nicht mit und wird immer berechnet.**

## Klassiker-Fallen

**1. „Auto-Pause kann nur v1" — seit November 2024 falsch.** Die verbreitete
Merkregel „v1 pausiert, v2 nicht" stammt aus der Zeit, als v2 eine Mindestkapazität von
**0,5 ACU** hatte. Seit dem 20.11.2024 ist **0 ACU** möglich (Aurora PostgreSQL
13.15+/14.12+/15.7+/16.3+, Aurora MySQL 3.08+). Wer heute wegen Auto-Pause zu v1 greift,
greift zu einem Produkt, das es nicht mehr gibt.

**2. Aurora Serverless v1 ist tot.** EOL war der **31.03.2025** (verlängert vom
31.12.2024). Seit dem 01.09.2024 lassen sich keine neuen v1-Cluster mehr anlegen, und
ab dem 07.04.2025 migriert AWS verbliebene v1-Cluster im Wartungsfenster automatisch
auf v2 — schlägt das fehl, wird der Cluster in einen provisionierten umgewandelt. In
Prüfungsfragen taucht v1 noch auf; in der Realität ist die Antwort immer v2.

**3. Die Pause findet nicht statt, wenn etwas dranhängt.** Das ist die
praxisrelevanteste Falle: **RDS Proxy hält eine offene Verbindung zur Instanz** und
verhindert damit das Pausieren komplett. Dasselbe gilt für offene Nutzerverbindungen
(ein vergessener BI-Client, ein Monitoring-Job mit Dauerverbindung) und für aktivierte
logische bzw. Binlog-Replikation. Signalwort im Fragetext: taucht „RDS Proxy" **und**
„scale to zero" gemeinsam auf, ist mindestens eine der beiden Anforderungen nicht
erfüllbar. *(Querverweis: Karte 28 behandelt RDS Proxy von der anderen Seite.)*

**4. „Serverless löst mein Verfügbarkeitsproblem" — nein.** Serverless v2 ist eine
Kapazitätsentscheidung. Hochverfügbarkeit entsteht daraus, dass man **weitere Instanzen
in anderen AZs** in den Cluster stellt (die ebenfalls serverlos sein dürfen), nicht
daraus, dass eine Instanz serverlos ist. Das ist die saubere Abgrenzung zu Karte 22:
dort ging es um Verfügbarkeit und Lesekapazität, hier ausschließlich um Kapazität.

**5. Die Obergrenze ist ein Kostenschutz, kein Wunschwert.** Max-ACU wirkt wie eine
Sicherung: Eine entlaufene Abfrage bei 256 ACU ist ein teurer Vorfall. Die Obergrenze
gehört dorthin, wo die Last je legitim war — plus Reserve. Ältere Materialien nennen
hier noch **128 ACU** als Maximum; aktuell sind es **256**.

**6. Der Speicherbedarf setzt den echten Boden.** Nicht die CPU, sondern der
Arbeitsspeicher bestimmt meist die Mindest-ACU: Buffer Pool, große Sortierungen und
viele Verbindungen fressen ACUs. Eine Datenbank, die 8 GiB Working Set braucht, wird
nicht sinnvoll bei 1 ACU (≈ 2 GiB) betrieben.

## Bewusste Vereinfachungen im Diagramm

- **Der Kapazitätsverlauf ist illustrativ, keine Messkurve.** Die drei CI-Spitzen und
  die Nachtpause zeigen das Muster, nicht reale Telemetrie. Die y-Achse ist bei 8 ACU
  abgeschnitten, obwohl 256 möglich wären — sonst wäre der Dev/Test-Bereich unsichtbar.
- **Achsen und Kurve sind bewusst unterschiedlich modelliert:** Die Achsen sind
  `polyline` (Darstellungselement), die Kurve ist `path` (wird von der
  Kollisionsprüfung erfasst). So prüft das QC-Skript die Kurve gegen alle Labels mit,
  ohne die Achsen als Pfeile misszuverstehen.
- **Nur eine Instanz ist gezeichnet.** Real sind es 14 Datenbanken; für die Aussage
  ändert die Anzahl nichts.
- **Der Cluster-Endpoint und ein möglicher Reader-Endpoint sind nicht dargestellt** —
  das gehört zur Verfügbarkeits-Achse von Karte 22.
- **Die Kostenrechnung fehlt als eigenes Element.** Sie steckt implizit in der Fläche
  unter der Kurve: Was nicht unter der Kurve liegt, wird nicht als Compute berechnet.
  Der Storage-Anteil ist als Zeile in der Volume-Box benannt.
- **Farbzuordnung:** Navy = relationale Datenbank-Compute-Schicht (konsistent mit
  Karte 22), Grün = Storage/Kapazitätskurve, Rot gestrichelt = Falle.

## Faktencheck

Geprüft am 18.07.2026 gegen: `aurora-serverless-v2-auto-pause` (0 ACU, Idle-Fenster
300–86.400 s, Verhinderungsgründe), `aurora-serverless-v2.setting-capacity`
(0,5 vs. 0 ACU, `max_connections`-Verhalten), AWS-Ankündigung vom 20.11.2024
(Scale to Zero, unterstützte Engine-Versionen), AWS Database Blog „Introducing scaling
to 0 capacity" (256 ACU), sowie `aurora-serverless.relnotes` und
`aurora-serverless.html` (EOL v1 am 31.03.2025, Zwangsmigration ab 07.04.2025).
