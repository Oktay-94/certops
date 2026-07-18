---
nr: 25
title: "DynamoDB Global Tables — Schreibzugriffe in jeder Region"
services:
  - Amazon DynamoDB
  - DynamoDB Global Tables (MREC / MRSC)
signalwords:
  - users around the world
  - write locally in every Region
  - active-active / multi-active
  - regional failure, RPO
  - low latency for global users
domains: [D2, D3]
assets:
  png: battle_card_25.png
  pdf: battle_card_25.pdf
  svg: battle_card_25.svg
status_note: >
  QC-Skript (reparierte Fassung): 0 Befunde. Ein knapp platziertes Label
  (unterer Replikationspfad zwischen Zonenrand und Linie) wurde zusätzlich
  von Hand gekürzt und neu gesetzt. Render-Sanity bestanden. SICHTPRÜFUNG
  DURCH CHAT-CLAUDE NICHT MÖGLICH (Regel F9) — liegt bei Oktay.
---

# Battle Card 25 — DynamoDB Global Tables

## Szenario

*Kestrel Mobility* betreibt eine Roller-Sharing-App mit Nutzern in **Berlin, São Paulo
und Singapur**. Fahrtstatus, Positionen und Nutzerprofile liegen heute in einer einzigen
DynamoDB-Tabelle in `eu-central-1`. Für einen Nutzer in Singapur kostet jeder
Schreibvorgang — Fahrt starten, Fahrt beenden, Position melden — rund **180 ms
Round-Trip** nach Frankfurt.

Zwei Anforderungen: Schreibzugriffe sollen **lokal in jeder Region** möglich sein, und
der Ausfall einer Region darf den Dienst nicht anhalten.

## Ablauf

**1 — Schreiben in Berlin, lokal.** Die App in `eu-central-1` schreibt mit einem ganz
normalen `PutItem` gegen den **lokalen** DynamoDB-Endpoint. Global Tables benötigen
**keine Anwendungsänderung** — dieselben APIs, derselbe Tabellenname, nur ein anderer
regionaler Endpoint. Das Muster dahinter: Eine Anwendung, die in einer Region beheimatet
ist, spricht ausschließlich deren lokalen Endpoint an.

**2 — Asynchrone Replikation.** DynamoDB gibt die Änderung an die anderen Replicas
weiter, typischerweise **unter einer Sekunde**. Entscheidend: Der Schreibvorgang gilt
schon als erfolgreich, **bevor** die anderen Regionen ihn gesehen haben. Die
Replikation läuft über DynamoDB Streams, aber als vom Dienst verwaltete Mechanik — nicht
als etwas, das man selbst baut oder sieht.

**3 — Lesen in Singapur, lokal.** Der Nutzer dort liest aus `ap-southeast-1`, ohne die
halbe Welt zu überqueren. Das ist der eigentliche Gewinn: **Reads und Writes sind
überall lokal.**

**4 — Schreiben in São Paulo, gleichzeitig.** Auch diese Replica nimmt Writes an. Es
gibt **keine Primary-Region**, keine Rolle, die man promoten müsste, keine Richtung.
Jede Replica ist vollwertig.

**5 — Jede Region repliziert mit jeder.** Der untere Pfad zeigt, dass Berlin und
Singapur direkt austauschen — es gibt keinen zentralen Knoten, über den alles läuft.
Fällt eine Region aus, sind die Daten in den anderen bereits vorhanden; der Verkehr
wird auf einen anderen Anwendungs-Endpoint umgeleitet.

## Prüfungs-Kernsatz

> **Global Table = multi-active: jede Region liest und schreibt, die Replikation ist
> asynchron, und bei gleichzeitigen Schreibvorgängen gewinnt der jüngste Zeitstempel.
> Starke Konsistenz über Regionen gibt es nur mit MRSC.**

## Klassiker-Fallen

**1. Last Writer Wins ist ein stiller Datenverlust.** Schreiben zwei Regionen im selben
Moment dasselbe Item, gewinnt der Schreibvorgang mit dem jüngeren Zeitstempel. Der
andere **verschwindet ohne Fehlermeldung**. Beide Anwendungen haben ein „OK" bekommen.
Das ist kein Bug, sondern das dokumentierte Konfliktmodell — und der Grund, warum
Global Tables für Zähler, Kontostände oder „letzter Schreibvorgang zählt nicht"-Semantik
ungeeignet sind, solange man nicht dafür sorgt, dass **dasselbe Item nur in einer Region
geschrieben wird** (z. B. indem die Region Teil des Partitionsschlüssels ist).

**2. „Strongly consistent" gilt nur innerhalb einer Region.** `ConsistentRead=true`
garantiert den aktuellen Stand **der Replica, die man fragt** — nicht den globalen
Stand. Ein Read in São Paulo kann eine Sekunde alte Daten liefern, obwohl er als
„strongly consistent" markiert war.

**3. MRSC ist die Ausnahme — und sie ist teuer erkauft.** Seit dem **30.06.2025** gibt
es **multi-Region strong consistency**: RPO 0, strongly consistent reads aus jeder
Region, 99,999 % Verfügbarkeit. Die Bedingungen sind streng:
- **Exakt drei Regionen** — entweder drei Replicas oder **zwei Replicas plus einen
  Witness**. Ein Witness hält aktuelle Daten für die Quorum-Bildung, ist aber **nicht
  les- oder beschreibbar** und verursacht **keine Storage- und Write-Kosten**.
- **Keine Transaktions-APIs.**
- Konflikte werden **nicht** still aufgelöst, sondern werfen eine retrybare
  `ReplicatedWriteConflictException`.
- Höhere Schreib- und Leselatenz (Quorum über Regionen hinweg).
- Nur innerhalb **eines** AWS-Kontos, und der **Konsistenzmodus ist nach Erstellung
  nicht mehr änderbar**.

Prüfungssignal: Tauchen „RPO of zero" **und** „strongly consistent across Regions"
gemeinsam auf, ist MRSC gemeint. Steht dort nur „global", „low latency" oder
„multi-active", ist der Standardmodus MREC gemeint — und damit Last Writer Wins.

**4. Abgrenzung zu Karte 22 (Read Replicas).** Das ist die Verwechslung, die diese
Karte auflösen soll:

| | **RDS Read Replica (Karte 22)** | **DynamoDB Global Table (Karte 25)** |
|---|---|---|
| Schreibpunkte | **genau einer** (der Primary) | **jede Region** |
| Replikate | nur lesbar | vollwertig les- **und** schreibbar |
| Rollenwechsel | Promotion, manuell, irreversibel | gibt es nicht — es gibt keine Rolle |
| Konflikte | können nicht entstehen | **Last Writer Wins** |
| Zweck | Lesekapazität, DR-Baustein | globale Latenz + regionale Ausfallsicherheit |

**Merksatz:** *Read Replica = eine Schreibquelle, viele Lesekopien. Global Table = viele
Schreibquellen, keine Quelle ist die erste.*

**5. Abgrenzung zu Karte 21 (DAX) — die Rückseite derselben Medaille.** Karte 21 nennt
als Falle, dass Writes an Global-Table-Replicas **DAX umgehen**. Von hier aus gesehen:
Wer eine Global Table mit DAX kombiniert, hat in jeder Region einen Cache, der die
Schreibvorgänge **der anderen Regionen** nicht mitbekommt. Der Cache bleibt bis zum
Ablauf des TTL veraltet — und zwar genau in dem Szenario, für das man Global Tables
gebaut hat.

**6. Neu und im Kursmaterial nicht vorhanden: multi-account Global Tables.** Replicas
können inzwischen über **mehrere AWS-Konten** verteilt sein (getrennte Teams,
Sicherheitsgrenzen). Für MRSC gilt das **nicht** — dort müssen alle Replicas im selben
Konto liegen.

## Bewusste Vereinfachungen im Diagramm

- **Die Replikation ist als bidirektionaler Pfeil gezeichnet.** Real sind es
  **unidirektionale Replikatoren pro Richtung und Regionspaar**; ein Doppelpfeil ist die
  lesbare Kurzform derselben Aussage.
- **DynamoDB Streams sind nicht als eigenes Element dargestellt.** Sie sind die Mechanik
  unter der Replikation, aber nichts, was man in dieser Architektur konfiguriert oder
  konsumiert.
- **Der Konfliktfall ist nicht als Zeitachse gezeichnet**, sondern als Box erklärt. Zwei
  gleichzeitige Writes auf dasselbe Item lassen sich in einem statischen Diagramm nicht
  ehrlich darstellen — der springende Punkt ist ja gerade die Gleichzeitigkeit.
- **MRSC ist als Textbox erklärt, nicht gezeichnet.** Ein zweites Topologie-Diagramm mit
  Witness-Region hätte die Karte überladen; die Karte zeigt den Standardfall MREC, weil
  der die Prüfungsantwort ist.
- **Der Regionsausfall ist nur als Aussage im Ablauf enthalten**, ohne eigenes
  Ausfall-Symbol.
- **Die Replikationskosten fehlen.** Replizierte Schreibvorgänge werden als eigene
  Kapazitätseinheiten berechnet — eine Global Table über drei Regionen kostet Writes
  mehrfach.
- **Farbzuordnung:** Dunkelblau = DynamoDB (konsistent mit Karte 21), Blau = Anwendung,
  Rot gestrichelt = Falle, Grün = die Ausnahme MRSC, Grau gestrichelt = Abgrenzung.

## Faktencheck

Geprüft am 18.07.2026 gegen: `GlobalTables` (multi-active, MREC/MRSC, same-account vs.
multi-account, keine Anwendungsänderung nötig), `bp-global-table-design` (MRSC seit Juni
2025, exakt drei Regionen, Witness ohne Storage-/Write-Kosten, keine Transaktions-APIs,
Latenzverhalten), AWS-Ankündigung vom 30.06.2025 (MRSC GA, verfügbare Regionen, RPO 0)
sowie vom 28.01.2026 (FIS-Unterstützung für MRSC), und die re:Invent-Sessions DAT425
(2024) / DAT440 (2025) zur Konfliktauflösung per Zeitstempel und zum Verhalten bei
Netzwerkpartitionen.
