---
nr: 39
title: "Aurora Global Database — RPO und RTO über Regionsgrenzen"
services:
  - Amazon Aurora Global Database
  - Aurora PostgreSQL
  - Aurora MySQL
  - Amazon Application Recovery Controller
domains: [D2, D3]
signalwords:
  - "recover from a Region-wide outage"
  - "RPO of seconds and RTO of minutes"
  - "low-latency reads for users in other Regions"
  - "test the disaster recovery plan without data loss"
  - "the secondary Region must not accept writes"
assets:
  png: battle_card_39.png
  pdf: battle_card_39.pdf
  svg: battle_card_39.svg
status_note: >
  QC 0 Befunde nach einer Korrekturrunde (9 Boxen, 41 Texte, 18 gemeldete
  Segmente — davon 8 Phantom-Segmente aus den vier Marker-Definitionen, also
  10 gezeichnet, 5 Badges). Erste Fassung hatte 2 Befunde: der Failover-Pfad
  lief rueckwaerts in die Secondary-Box hinein, weil y=460 faelschlich als
  "unterhalb" der Box (300..500) angenommen wurde; behoben durch einen
  Y-Split rechts der Box. Render-Sanity bestanden: fuenf aus der
  Elementgeometrie abgeleitete Freizonen rein weiss, alle 13 Palettenfarben
  nachweisbar. Footer von Hand gemessen: 1255,7 px (Stil-Guide ~1420).
  Sichtpruefung: Bildansicht lieferte einen leeren Platzhalter — visuell
  NICHT geprueft, Oktay muss draufschauen.
---

# Battle Card 39 — Aurora Global Database · RPO und RTO

## Szenario

**Kestrel Payments** wickelt Kartenzahlungen ab. Die Datenbank läuft als Aurora
PostgreSQL in `eu-central-1`. Die Aufsicht verlangt einen dokumentierten
Wiederanlaufplan mit belegten Zielwerten und einen **quartalsweisen DR-Test im
Produktivsystem**. Gleichzeitig sollen Lesezugriffe aus Nordamerika nicht mehr
über den Atlantik laufen.

Zwei Anforderungen, die man leicht verwechselt: **Der DR-Test darf keine Daten
kosten. Der echte Ausfall darf welche kosten.** Aurora Global Database hat für
beides eine eigene Operation — und genau diese Unterscheidung ist der Kern der
Karte.

## Ablauf

**1 — Alle Schreibvorgänge gehen in die Primärregion.** Ein Aurora Global
Database hat **genau eine** Schreibregion. Das ist keine Einschränkung der
Konfiguration, sondern die Bauart: Es gibt eine einzige Quelle der Wahrheit.

**2 — Die Replikation läuft auf der Storage-Ebene.** Aurora repliziert nicht
über Binlog oder logische Replikation, sondern unterhalb der Datenbank-Engine
im verteilten Speichersystem. Deshalb kostet die Replikation den Writer der
Primärregion kaum Rechenleistung, und deshalb liegt die typische Verzögerung
**unter einer Sekunde**. Metapher: Es wird nicht das Vorlesen wiederholt,
sondern das Papier durchgepaust.

**3 — Weitere Sekundärregionen bekommen dieselbe Kopie.** Jede Sekundärregion
hält einen vollständigen Datenbestand und bedient lokale Lesezugriffe. Sie ist
**read-only**.

**4 — Switchover: der geplante Rollentausch.** Aurora stoppt die Schreibvorgänge
auf dem Primary, wartet, **bis alle Sekundärcluster aufgeholt haben**,
befördert dann einen Sekundärcluster zum Primary und degradiert den alten
Primary zum Secondary. Ergebnis: **RPO = 0**, kein Datenverlust, in etwa einer
Minute. Voraussetzung: **alle beteiligten Cluster müssen erreichbar sein** —
deshalb taugt Switchover für den Quartalstest und die Wartungsrotation, aber
nicht für den Ernstfall. API: `SwitchoverGlobalCluster`. Der alte Name
*managed planned failover* steht noch in vielen Kursunterlagen.

**5 — Failover: der ungeplante Weg.** Fällt die Primärregion aus, wird ein
Sekundärcluster befördert, ohne dass er aufholen kann. Was zum Zeitpunkt des
Ausfalls noch unterwegs war, ist weg. **RPO liegt im Sekundenbereich** und
hängt direkt an der Replikationsverzögerung; **RTO liegt im Minutenbereich**.
Das AWS-Resilienz-Whitepaper nennt als Richtwert einen effektiven **RPO von
1 Sekunde und RTO von 1 Minute**. API: `FailoverGlobalCluster`. Als Rückfallweg
bleibt das manuelle *detach and promote*, etwa wenn die Engine-Versionen
zwischen den Clustern nicht zusammenpassen.

## Prüfungs-Kernsatz

**Switchover kostet Zeit, Failover kostet Daten.** Wer in der Frage „no data
loss" oder „planned Regional rotation" liest, meint Switchover. Wer „Region
becomes unavailable" oder „minimize data loss" liest, meint Failover — und die
richtige Antwort enthält dann ein RPO **größer als null**.

## Abgrenzung zu Karte 34 (DynamoDB Global Tables)

Die beiden sehen auf Folien ähnlich aus und sind gegensätzlich gebaut:

| | Aurora Global Database | DynamoDB Global Tables |
|---|---|---|
| Schreibregionen | **eine** | **alle** |
| Konfliktlösung | entfällt (nur eine Quelle) | **Last Writer Wins** |
| Konsistenz | stark innerhalb der Primärregion | eventual zwischen Regionen |
| Replikation | Storage-Ebene | Streams je Tabelle |
| DR-Charakter | Promotion nötig | kein Failover nötig |

**Der entscheidende Satz:** Global Tables brauchen kein Failover, weil jede
Region schon schreibt — dafür muss die Anwendung mit *Last Writer Wins* leben
können. Aurora Global Database braucht ein Failover, liefert dafür aber
relationale Konsistenz und Transaktionen. Wer beides „Multi-Region-Datenbank"
nennt, verliert genau die Unterscheidung, auf die die Prüfung zielt.

**Seit 2025 gibt es einen dritten Fall:** **Aurora DSQL** ist
PostgreSQL-kompatibel und tatsächlich **aktiv-aktiv über Regionen** mit starker
Konsistenz — das, was Global Database ausdrücklich nicht ist. Für SAA-C03 ist
DSQL noch kein Standard-Antwortkandidat, aber wenn eine Frage „active-active
relational across Regions" verlangt, ist Global Database **falsch**.

## Klassiker-Fallen

**1. Global Database ist nicht Multi-AZ.** Multi-AZ schützt vor dem Ausfall
einer Availability Zone **innerhalb** einer Region und failt automatisch um.
Global Database schützt vor dem Ausfall einer **ganzen Region** und braucht
eine ausdrückliche Promotion. Beides ergänzt sich, keins ersetzt das andere.

**2. Write Forwarding macht kein aktiv-aktiv.** Die Anwendung darf Schreibbefehle
an einen Reader in der Sekundärregion schicken; Aurora leitet sie über einen
verwalteten Kanal an den Writer der Primärregion weiter. Der Primary bleibt die
einzige Quelle der Wahrheit, und der Schreibvorgang zahlt weiterhin die volle
Netzlatenz. Der Gewinn ist Bequemlichkeit im Anwendungscode, nicht
Schreibkapazität. Verfügbar für Aurora MySQL (seit 2020) und Aurora PostgreSQL
(seit dem 09.11.2023).

**3. `rds.global_db_rpo` erkauft die RPO-Garantie mit Bremswirkung.** Bei Aurora
PostgreSQL lässt sich eine RPO-Obergrenze setzen. Überschreitet die
Replikationsverzögerung diesen Wert, **blockiert Aurora Transaktionen auf dem
Writer**, bis die Sekundärregionen wieder aufgeholt haben. Wer den Wert zu eng
setzt, hat kein DR-Problem mehr, sondern ein Durchsatzproblem — und zwar im
Normalbetrieb. Für Aurora MySQL gibt es diesen Parameter nicht.

**4. Switchover setzt gesunde Cluster voraus.** Der häufigste Denkfehler: „Wir
nehmen im Ernstfall einfach Switchover, dann haben wir RPO 0." Geht nicht — im
Ernstfall ist die Primärregion nicht erreichbar, und Switchover braucht sie.

**5. Der DR-Test muss die Rückrichtung mitdenken.** Nach einem Switchover ist
die alte Sekundärregion die neue Primärregion. Anwendungen, Endpunkte und
Connection-Strings müssen das mitmachen — sonst ist die Datenbank umgezogen und
die Anwendung schreibt ins Leere. Dafür gibt es im Amazon Application Recovery
Controller einen fertigen Ausführungsblock für Aurora Global Database.

## Nicht bestätigt

**Wie viele Sekundärregionen sind möglich? Zwei AWS-Quellen widersprechen
einander.**

- Die aktuelle Aurora-Doku (*Using Amazon Aurora Global Database*) schreibt von
  einem Primärcluster und **bis zu 10** Sekundärclustern in anderen Regionen.
- Der AWS Database Blog und die ursprüngliche Ankündigung von 2019 nennen
  **bis zu 5** Sekundärregionen. Die Zahl 5 steht in praktisch allen
  Kursmaterialien und Cheat Sheets.

Beides sind AWS-Quellen. Möglich, dass das Limit angehoben wurde und der Blog
nicht nachgezogen hat — belegen lässt sich das aus dem vorliegenden Material
**nicht**. Deshalb steht auf der Karte **keine Zahl**, sondern „mehrere
Regionen möglich". **Vor Verwendung im Unterricht im Service-Quotas-Bereich der
Konsole nachsehen** — das ist die einzige Quelle, die für das eigene Konto
verbindlich ist.

**Zweiter Punkt:** Eine Drittquelle (OneUptime, Februar 2026) beschreibt, dass
Aurora nach einem verwalteten Failover die alte Primärregion **automatisch als
Sekundärcluster wieder einhängt**, sobald sie zurück ist. Die AWS-Doku
formuliert das nicht so. Vor Verwendung gegenprüfen.

## Bewusste Vereinfachungen im Diagramm

- **Nur eine Sekundärregion ist ausgezeichnet**, die übrigen stehen als eine
  gestrichelte Sammelbox. Real ist jede Sekundärregion gleichwertig, und
  **jede** von ihnen kann Ziel von Switchover oder Failover sein — die beiden
  Pfeile hängen im Diagramm nur aus Platzgründen an `us-east-1`.
- **Die Cluster sind als eine Box gezeichnet.** Real steckt in jeder Region ein
  Cluster mit Writer- und Reader-Instanzen über mehrere Availability Zones plus
  der geteilten Storage-Schicht.
- **Switchover und Failover sind Operationen, keine Orte.** Sie stehen als Boxen
  da, weil ihre Kennzahlen der eigentliche Karteninhalt sind — nicht, weil dort
  Infrastruktur läge.
- **Der Leseverkehr aus den Sekundärregionen ist nicht gezeichnet**, obwohl er
  der zweite Hauptgrund für Global Database ist. Die Karte konzentriert sich auf
  RPO/RTO.
- **Keine konkreten Sekunden- oder Minutenwerte auf der Karte.** RPO und RTO
  hängen an Last, Distanz und Lag; harte Zahlen wären eine Scheingenauigkeit.
  Die Richtwerte aus dem AWS-Whitepaper stehen im Text.

## Farbkonventionen dieser Karte

- **Rot-Pink (#B0084D) = relationale Datenbank-Engine** — alle Aurora-Cluster
  und der Replikationsfluss. Das folgt der Stil-Guide-Kategorie „Redshift,
  Oracle", also Datenbank-Engines. ⚠️ **Neue Festlegung, zum Gegenlesen.**
  Relationale Datenbanken hatten im Stil-Guide bisher keine eigene Farbe.
- **Grün = Switchover**, der verlustfreie Weg. **Gold (#A16E00) = Failover.**
  Gold steht im Stil-Guide für „Kosten/Cost Protection"; hier ist es zu „hat
  einen Preis" verallgemeinert — der Preis sind Daten statt Geld. ⚠️ Ebenfalls
  eine Umdeutung, zum Gegenlesen.
- **Teal = Regel-/Steuerungsinstanz** für `rds.global_db_rpo` — konsistent mit
  Karte 37 (OAC) und Karte 38 (Firewall Policy). Damit ist Teal in dieser
  Bedeutung dreimal in Folge verwendet; der Vorschlag aus Karte 38, das
  festzuschreiben, gilt weiter.
- **Rot (#C7161D) = Falle**, **Blau = Anwendung**: unverändert.
- ⚠️ **Rot-Pink und Rot stehen auf derselben Karte.** Sie sind räumlich getrennt
  (Datenbanken oben und links, Falle unten rechts) und farblich klar
  unterscheidbar, aber es ist die erste Karte, auf der beide vorkommen. Wenn das
  im Druck zu nah beieinander liegt, ist die saubere Lösung, für Datenbanken
  einen eigenen Ton zu vergeben.
