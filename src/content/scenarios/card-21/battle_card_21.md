---
nr: 21
title: "DynamoDB · DAX — Gaming-Leaderboard mit Mikrosekunden-Reads"
services:
  - Amazon DynamoDB
  - DynamoDB Accelerator (DAX)
signalwords:
  - microseconds
  - read-heavy, same items repeatedly
  - no application logic changes
  - in-memory cache for DynamoDB
  - hot partition
domain: D3
domain_secondary: D4
assets:
  png: battle_card_21.png
  pdf: battle_card_21.pdf
  svg: battle_card_21.svg
status_note: >
  QC-Skript: 0 Befunde (Textbreiten, Label/Segment, Segment/Box, Badges).
  Render-Sanity bestanden (alle Palettenfarben im PNG nachweisbar, drei
  definierte Freizonen rein weiß). SICHTPRÜFUNG DURCH CHAT-CLAUDE NICHT
  MÖGLICH — das view-Tool lieferte auf das PNG kein auswertbares Bild
  (Regel F9). Sichtprüfung liegt bei Oktay.
---

# Battle Card 21 — DynamoDB · DAX

## Szenario

*PixelForge Studios* betreibt das Mobile-Battle-Royale **„Nova Arena"** mit 4,2 Mio.
täglich aktiven Spielern. Das Leaderboard erscheint im HUD nach jedem Match, und in
den Abendstunden treffen rund **900.000 Reads/s** auf immer dieselben Top-100-Einträge
einer Season. Geschrieben wird nur bei Match-Ende. DynamoDB liefert p99 bei 9 ms —
das Produktteam will **Mikrosekunden**, damit die Rangliste beim Öffnen bereits steht.

Zwei Randbedingungen: Die Leseflut erzeugt eine **hot partition** auf dem aktuellen
Season-Key, und das Team hat weder Zeit noch Budget, Cache-Invalidierung und
Cache-Population selbst zu programmieren.

## Ablauf

**1 — Client fragt die Rangliste ab.** Der Spiel-Client ruft das Backend an, sobald das
HUD geöffnet wird. Fachlich unspektakulär, aber der Grund für das Lastprofil: Millionen
Clients fragen dieselben wenigen Items ab, nicht Millionen verschiedene.

**2 — Backend liest über den DAX-Cluster-Endpoint.** Die Anwendung ruft weiterhin
`GetItem` und `Query` auf — nur eben gegen den DAX-Client statt gegen den
DynamoDB-Client. Der Endpoint sieht aus wie `daxs://cluster.xxxxx.dax-clusters.eu-central-1.amazonaws.com`,
TCP-Port **8111**. Genau hier liegt der Unterschied zu einem generischen Cache: Es gibt
keinen zweiten Datenpfad, keinen Schlüsselschema-Entwurf, keine Invalidierungsregeln.

**3 — Cache Hit: Antwort in Mikrosekunden.** Liegt das Item im Item Cache, antwortet DAX
direkt aus dem Arbeitsspeicher — DynamoDB wird gar nicht erst angesprochen. Das ist
der ganze Zweck der Übung und zugleich der Grund, warum die RCU-Last einbricht.

**4 — Cache Miss: DAX liest eventually consistent nach.** Fehlt das Item, stellt DAX
selbst eine **eventually consistent** Leseanfrage an die Tabelle. Wichtig für das
Verständnis: Der Cache-Inhalt ist per Konstruktion eventually consistent — DAX kann
gar nichts anderes liefern.

**5 — Item landet im Item Cache, TTL läuft an.** DynamoDB antwortet, DAX legt das Item
mit einem Zeitstempel ab und gibt es an die Anwendung weiter. Der **Item Cache hat
standardmäßig 5 Minuten TTL**, danach gilt das Item als Miss. Zusätzlich räumt LRU auf,
wenn der Speicher voll ist. Bei mehreren Nodes repliziert der Primary das Item an die
Replicas (unter einer Sekunde, ebenfalls eventually consistent).

**6 — Match-Ende: Schreiben geht ebenfalls über DAX.** Das Backend ruft `PutItem` bzw.
`UpdateItem` gegen den DAX-Client auf. Nur so kann DAX vom Schreibvorgang überhaupt
erfahren.

**7 — Write-through: erst die Tabelle, dann der Cache.** DAX schreibt zuerst in
DynamoDB und aktualisiert **danach** den Item Cache. Der Aufruf gilt nur als
erfolgreich, wenn beides geklappt hat. Deshalb ist DAX für schreiblastige Workloads
die falsche Wahl: Jeder Write zahlt einen zusätzlichen Hop, ohne einen Vorteil zu
bekommen.

**8 — Der Bypass (rot).** Alles, was an DAX vorbeischreibt — ein Admin-Skript mit dem
normalen DynamoDB-Client, eine Lambda ohne DAX-SDK, oder die **Replikation einer
Global Table** — aktualisiert die Tabelle, aber nicht den Cache. Der Cache liefert bis
zum Ablauf des TTL veraltete Werte, und niemand bemerkt es, weil beide Antworten
technisch „gültig" aussehen.

## Prüfungs-Kernsatz

> **DAX ist der einzige Cache, der die DynamoDB-API selbst spricht — deshalb entfällt
> die Invalidierungslogik, nicht der Client-Wechsel. Gecacht wird ausschließlich
> eventually consistent.**

## Klassiker-Fallen

**1. „No application logic changes" ist Marketing, nicht Nulldiff.** Die AWS-Produktseite
schreibt wörtlich, man müsse die Anwendungslogik nicht ändern. Real ist: Das
**DAX-Client-SDK muss eingebunden und der Endpoint gesetzt werden**. Was entfällt, ist
das Schreiben von Cache-Population, Invalidierung und Cluster-Verwaltung. In der
Prüfung ist „minimal application changes" trotzdem die erwartete Antwort — dort ist der
Kontrast zu ElastiCache gemeint.

**2. `ConsistentRead=true` macht DAX wirkungslos.** Strongly consistent Reads werden
**durchgereicht und nicht gecacht**; `TransactGetItems` behandelt DAX genauso. Wer eine
strong-consistency-Anforderung im Fragetext liest und trotzdem DAX ankreuzt, hat die
Falle nicht gesehen. Die Latenz fällt dann auf DynamoDB-Niveau zurück.

**3. Global Tables + DAX = stille Staleness.** Die AWS-Doku sagt explizit: Writes an
Global-Table-Replicas **umgehen DAX**; der Cache erfährt erst beim TTL-Ablauf davon.
Das ist die direkte Brücke zu Karte 25 — dort steht dieselbe Aussage von der anderen
Seite.

**4. Cluster-Grenzen werden falsch zitiert.** Verbreitetes Kursmaterial nennt „bis 10
Nodes". Die aktuelle Doku sagt **bis 11 Nodes (1 Primary + max. 10 Read Replicas)**.
Weiter gilt: **min. 3 Nodes in 3 AZs** für Fault Tolerance (1–2 Nodes sind nicht
fehlertolerant), max. **500 Tabellen** pro Cluster, **VPC-only** (kein Zugriff aus dem
Internet), und ein Cluster bedient **nur Tabellen der eigenen Region**.

**5. Kostenrichtung.** DAX kostet **Node-Stunden**, DynamoDB kostet **pro Request**. Der
Break-even hängt an der Trefferquote; seit der On-Demand-Preissenkung (Nov 2024,
eventually consistent Reads bei 0,125 $ pro Mio. RRU) liegt er höher als in älteren
Rechenbeispielen. Für die Prüfung bleibt „DAX senkt die Leselast und damit die
RCU-Kosten" die erwartete Antwort — im Betrieb ist es eine Rechnung, keine
Selbstverständlichkeit.

## Abgrenzung zu Karte 24 (ElastiCache Redis)

| | **DAX (Karte 21)** | **ElastiCache Redis (Karte 24)** |
|---|---|---|
| Datenquelle | **nur** DynamoDB | beliebig (RDS, Aurora, API, berechnete Werte) |
| API | spricht die DynamoDB-API | eigene Redis-Befehle |
| Cache-Logik | im Dienst (write-through, TTL, LRU) | **in der Anwendung** (Cache-Aside: lesen, bei Miss DB, dann `SET`) |
| Invalidierung | erledigt der Dienst bei Writes über DAX | muss die Anwendung selbst auslösen |
| Signalwort | „microseconds", „no cache invalidation code" | „cache-aside", „95 % reads", „relational database" |

**Merksatz für das Paar:** DAX ist *transparent und DynamoDB-gebunden*, ElastiCache ist
*generisch und verlangt Cache-Aside-Code*.

## Bewusste Vereinfachungen im Diagramm

- **Der Pass-through-Pfad für `ConsistentRead=true` ist nicht als Pfeil gezeichnet,
  sondern als Textzeile in der DAX-Box plus eigene Hinweisbox.** Fachlich läuft er
  **durch** DAX hindurch zu DynamoDB — ein eigener Pfeil hätte suggeriert, die
  Anwendung würde DAX dabei umgehen. Das wäre falsch.
- **Der Query Cache ist nur als Zeile benannt, nicht als zweiter Speicher gezeichnet.**
  Real sind es zwei getrennte Caches; `Query`/`Scan`-Ergebnisse landen **nie** im Item
  Cache.
- **Die Replikation Primary → Replicas ist nicht als Pfeil dargestellt.** Sie ist
  eventually consistent und dauert typischerweise unter einer Sekunde.
- **Die IAM-Rolle, die DAX für den Zugriff auf die Tabelle annimmt, fehlt im Bild.**
  Ohne sie funktioniert kein Cluster.
- **Der Bypass-Pfeil (8) mündet direkt in die Tabelle**, ohne dass eine Gegenrichtung
  zu DAX gezeichnet ist — genau das ist die Aussage: Es gibt keinen Rückkanal.
- **Farbzuordnung (neu vergeben):** Lila = In-Memory-Cache-Schicht. Diese Kategorie
  gilt ab hier auch für ElastiCache auf Karte 24; DynamoDB bleibt Dunkelblau.

## Faktencheck

Geprüft am 18.07.2026 gegen die aktuelle AWS-Doku: `DAX.concepts.cluster`
(Node-Zahl, AZ-Empfehlung, 500-Tabellen-Limit, Port 8111, Cluster-Endpoint),
`DAX.consistency` (Item/Query Cache, write-through, Pass-through bei
`ConsistentRead=true` und `TransactGetItems`), `DAX.concepts` (TTL-Default 5 Minuten,
LRU), `V2globaltables_HowItWorks` (Global-Table-Writes umgehen DAX).
Drei Divergenzen zum gängigen Kursmaterial oben als Fallen 1, 3 und 4 dokumentiert.
