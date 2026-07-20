---
nr: 65
title: "Webshop-Empfehlungen — Personalize, S3, Event Tracker"
services: ["Amazon Personalize", "Amazon S3"]
domains: ["D3"]
signalwords:
  - "product recommendations for our online store"
  - "customers who bought this also bought"
  - "no machine learning team"
  - "recommendations should reflect what the user just clicked"
  - "without building or training a model ourselves"
assets:
  svg: "battle_card_65.svg"
  png: "battle_card_65.png"
  pdf: "battle_card_65.pdf"
status_note: |
  QC (scripts/qc.py inkl. Prüfung (e)): 0 Befunde.
  Gemeldet: 7 Boxen, 43 Texte, 19 Segmente, 5 Badges, 1 X-Kreis.
  Aufschlüsselung R5: 19 gemeldete Segmente = 9 reale + 10 Phantom
  (5 Marker in <defs> × 2). Die 9 realen = 7 Pfeilsegmente (davon 2
  Teilstücke des rechtwinkligen Rücklaufs) + 2 X-Striche.
  7 Boxen = 6 Knoten + Footer-Leiste.

  **Zweite Planänderung dieses Batches:** Abschnitt 10 des Geometrieplans
  leitet die belegten Flächen jetzt **automatisch** aus der
  Elementgeometrie ab — Boxen inkl. stroke/2, Segmente inkl. stroke/2,
  Marker als x_ende ± 15 nach R14, Badges cy ± 15, X-Kreis r + stroke/2,
  alle gemessenen Labelgrenzen, Footer-Leiste und Titelband. Insgesamt
  35 Rechtecke. Zonenkandidaten werden gegen alle 35 geprüft, bevor
  gerendert wird.
  Anlass: In den Karten 62, 63 und 64 musste **je eine Zone**
  nachgeschnitten werden, jedes Mal aus derselben Ursache — ich schnitt
  von Hand gegen die Mittelkoordinate statt gegen die Außenkante
  (Badge-Radius auf K62, Marker-Belegung auf K63, Segmentachse auf K64).
  **Ergebnis auf dieser Karte: Der Plan sagte 0 Kollisionen für alle elf
  Zonen voraus, das PNG bestätigte 0. Keine Nachbesserung.**

  Korrekturrunde — eine, VOR dem Zeichnen:
  1. "trainiert" ragte in die Dataset-Group-Box (Korridor 96 px).
     Von x=660 auf x=680 verschoben.
  Footer-Varianten: alle drei unter der Grenze; Variante 1 mit 1356,6 px
  gewählt, weil sie die Domain-/Custom-Unterscheidung mitnimmt.
  **Anmerkung: 1356,6 px ist der knappste Footer dieses Batches**
  (131,4 px Luft bis zum Leistenende). Unter der Stil-Guide-Grenze von
  ~1420 px, aber ohne Reserve für längere Fassungen.

  Render-Sanity: 11 Freizonen, alle im ersten Lauf frei.
  Alle fünf verwendeten Farben im PNG nachweisbar (Quelle 11077 px,
  Transport 4934, Compute 7245, Governance 5117, Verworfen 2189).

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855, aus dem
  SVG gelesen.

  R12-Gegencheck: **null <path> mit stroke.** Alle sieben Verbindungen
  sind <line>; die fünf <path> sind Marker-Dreiecke in <defs>.

  R18 Titelband-Kanaldivergenz: 0 px.

  R16 von Hand: elf Spalte geprüft, **alle 0 px** — erstmals in diesem
  Batch ohne Scheinbefund. Grund: Die Streifen wurden konsequent hinter
  den gemessenen Labelgrenzen angesetzt, nicht innerhalb.

  Sichtprüfung (R8): **versucht, fehlgeschlagen.** Zurück kam ein
  Bildobjekt ohne lesbaren Inhalt. Rechnerisch vollständig geprüft, aber
  **nicht gesehen**. Freigabe durch Oktay steht aus.
---

# Battle Card 65 — Webshop-Empfehlungen ohne ML-Team

## Szenario

Ein Webshop will „Kunden kauften auch"-Empfehlungen auf jeder Produktseite.
Historische Bestell- und Klickdaten liegen in S3. Was ein Kunde gerade
anschaut, soll die Empfehlung sofort beeinflussen. Ein ML-Team gibt es nicht,
und niemand will ein Modell von Hand trainieren.

## Ablauf

**1 — Die Rohdaten kommen per Dataset Import Job aus S3.** Personalize kennt
drei Datensatztypen: **Item Interactions** (wer hat was angesehen oder
gekauft), **Items** (Produktstammdaten) und **Users**. Interactions sind der
Kern — ohne sie gibt es keine Empfehlungen; die anderen beiden verbessern das
Ergebnis.

**2 — Die Dataset Group ist der Container und zugleich die Weichenstellung.**
Wer beim Anlegen eine Domäne angibt (`ECOMMERCE` oder `VIDEO_ON_DEMAND`),
bekommt eine **Domain Dataset Group** mit vorkonfigurierten Recommendern und
Standard-Schemas. Wer keine angibt, bekommt eine **Custom Dataset Group** und
muss Solution, Solution Version und Campaign selbst bauen. **Die Richtung ist
nicht umkehrbar:** In eine Domain-Gruppe kann man Custom-Ressourcen
nachrüsten, in eine Custom-Gruppe aber keine vorkonfigurierten Recommender.

**3 — Der Recommender liefert die Empfehlungen und trainiert selbst nach.**
Das ist der Grund für die Domain-Gruppe: kein Rezept auswählen, keine
Solution Version anstoßen, kein Retraining planen. Das Frontend ruft
`GetRecommendations` mit der Recommender-ARN und der User-ID.

**4 und 5 — Klicks fließen über den Event Tracker zurück.** `PutEvents`
schreibt die Interaktion in den Datensatz und macht sie **den Empfehlungen
sofort verfügbar** — bei Rezepten mit Echtzeit-Personalisierung wirkt sie
innerhalb von Sekunden, ohne dass ein neues Training läuft. Pro Dataset Group
gibt es **genau einen** Event Tracker.

**Verworfen — ein eigenes Modell in SageMaker.** Fachlich möglich und für
Sonderfälle richtig. Für „Kunden kauften auch" bedeutet es Monate Arbeit für
ein Ergebnis, das Personalize in Tagen liefert. Das Signalwort „no machine
learning team" schließt diesen Weg aus.

## Prüfungs-Kernsatz

**Domain-Gruppe gibt Recommender, Custom-Gruppe gibt Campaign — und
`PutEvents` wirkt ohne Retraining.**

## Abgrenzungen

- **Domain Dataset Group ↔ Custom Dataset Group:** vorkonfigurierte
  **Recommender** mit automatischem Training gegen selbstgebaute **Solution →
  Solution Version → Campaign** mit manuellem Training. Die Domäne bestimmt
  die verfügbaren Use Cases und die Standard-Schemas.
- **Recommender ↔ Campaign:** Beides sind Bereitstellungen für
  Echtzeit-Empfehlungen, aber nur die Campaign gehört zum Custom-Weg. Ein
  Recommender existiert nur in einer Domain-Gruppe.
- **Campaign ↔ Batch Inference Job:** Die Campaign hält Kapazität vor und
  **kostet, solange sie aktiv ist**; `minProvisionedTPS` setzt die
  Mindestabrechnung und skaliert nach oben. Ein Batch-Job braucht **keine
  Campaign** — wer Empfehlungen nur nächtlich in eine Tabelle schreibt, zahlt
  keine vorgehaltene Kapazität.
- **`GetRecommendations` ↔ `GetPersonalizedRanking`:** Ersteres liefert eine
  Liste, letzteres sortiert eine **vorgegebene** Liste nach Relevanz.
  Re-Ranking gibt es nur über Custom-Ressourcen.
- **Nur mit Custom-Ressourcen möglich:** Re-Ranking, User Segments und Next
  Best Action. Wer eines davon braucht, kommt an der Custom-Seite nicht
  vorbei — auch innerhalb einer Domain-Gruppe.
- **65 ↔ 63:** Beide vermeiden eigenes Modelltraining. Auf 63 braucht ein
  Teil der Aufgabe trotzdem ein trainiertes Modell (firmeneigene Klassen),
  hier nicht — Personalize trainiert selbst auf den eigenen Daten.

## Klassiker-Fallen

1. **SageMaker für Standard-Empfehlungen.** Der klassische Overkill. „No ML
   expertise", „within weeks", „without training a model" sind die
   Signalwörter dagegen.
2. **Retraining für frische Klicks.** Der häufigste Denkfehler bei dieser
   Karte: Man muss **nicht** neu trainieren, damit ein gerade angesehenes
   Produkt die Empfehlung beeinflusst — dafür ist der Event Tracker da.
3. **Campaign für Batch-Empfehlungen.** Wer Empfehlungen nur einmal täglich
   berechnet, braucht keine vorgehaltene Kapazität. Antworten mit
   Batch Inference Job sind dann günstiger.
4. **Custom-Gruppe für einen Standard-Webshop.** Funktioniert, verschenkt aber
   die vorkonfigurierten Recommender und das automatische Retraining — und
   lässt sich nachträglich nicht in eine Domain-Gruppe umwandeln.
5. **`minProvisionedTPS` großzügig setzen.** AWS warnt in der Doku
   ausdrücklich zweimal davor; der Wert setzt die Mindestabrechnung, und
   Auto-Scaling erledigt Spitzen ohnehin.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Personalize ist von keiner Lifecycle-Änderung betroffen.** Geprüft gegen
  die AWS-Maintenance-, Sunset- und End-of-Support-Listen (Stand Juni 2026).
  Das ist in diesem Batch keine Selbstverständlichkeit — die Karten 61, 62 und
  63 enthielten jeweils einen betroffenen Dienst.
- **Aber: Amazon Forecast ist seit dem 29.07.2024 im Wartungsmodus**, mit
  Migrationsempfehlung auf SageMaker Canvas. **Das betrifft Thema 66 dieses
  Masterplans direkt** und ist beim nächsten Batch zu berücksichtigen.
  *Quelle: AWS-Doku „Services in Maintenance".*
- **Die Unterscheidung Domain- gegen Custom-Gruppe fehlt in vielen
  Kursdarstellungen**, die Personalize noch über die alte Kette
  Dataset Group → Solution → Campaign erklären. Domain Dataset Groups mit
  vorkonfigurierten Recommendern sind seit 2021 der empfohlene Einstieg für
  E-Commerce und Video-on-Demand.
- **Anonyme Nutzer** lassen sich über die `sessionId` als `userId` bedienen;
  sobald einmal ein Event mit beiden IDs geschrieben wurde, verknüpft
  Personalize die anonyme Historie beim nächsten Volltraining mit dem
  Benutzerkonto. Diese Cold-Start-Mechanik fehlt in den meisten Übersichten.
  *Quelle: AWS-Doku „Recording real-time events to influence
  recommendations".*

## Nicht bestätigt

- **Konkrete Latenz der Echtzeit-Personalisierung.** Die AWS-Doku sagt
  „within seconds"; ein AWS-Beispiel-Repository nennt 1–2 Sekunden. Die
  präzisere Zahl stammt nicht aus der Dokumentation, deshalb steht auf der
  Karte nur „wirkt in Sekunden".
- **Preise** für Training, Campaign-TPS und Recommender stehen grundsätzlich
  nicht auf der Karte. Die prüfungsrelevante Aussage ist, **dass** die
  Campaign im Stand kostet.
- **Mindestmenge an Interaktionen** für brauchbare Empfehlungen: In Blogs
  kursieren Zahlen, die ich in der AWS-Dokumentation nicht in dieser Form
  bestätigt gefunden habe.

## Bewusste Vereinfachungen im Diagramm

- **Die Weiche Domain ↔ Custom ist nicht als Verzweigung gezeichnet.** Sie
  steht als Zeile in der Dataset-Group-Box („Domain oder Custom, nicht beides
  zurück") und im Recommender-Kasten („Campaign nur custom"), weil sie eine
  Konfigurationsentscheidung ist und kein Datenfluss.
- **Der Dataset Import Job ist als Pfeil dargestellt**, nicht als eigener
  Kasten. Er ist ein Vorgang, kein Dienst.
- **Solution und Solution Version fehlen**, weil die Karte den Domain-Weg
  zeigt. Auf dem Custom-Weg lägen sie zwischen Dataset Group und Campaign.
- **Der Rücklauf vom Shop zum Event Tracker ist gestrichelt**, weil er ein
  Signal transportiert und keinen Verarbeitungsschritt startet.
- **Keine IAM-Rollen, keine Filter, keine Metadaten-Spalten.**

## Farbkonventionen dieser Karte

| Element | Rolle | Farbe |
|---|---|---|
| S3 Rohdaten | **Quelle** | Blau `#2E6BE6` |
| Dataset Group | **Governance/Control** | Gold `#A16E00` |
| Recommender | **Compute** | Orange `#D97706` |
| Shop-Frontend | **Quelle** | Blau `#2E6BE6` |
| Event Tracker | **Transport** | Teal `#0F7C8C` |
| SageMaker (verworfen) | Compute-Rand, Ablehnung via X | Orange + Rot `#C7161D` |

Drei Zuordnungen sind erklärungsbedürftig:

**Die Dataset Group ist Governance, nicht Storage.** Sie enthält zwar
Datensätze, ist aber vor allem **Container, Schema und Konfigurationsrahmen** —
sie entscheidet über verfügbare Use Cases und Ressourcentypen. Diese Karte
erklärt genau diese Entscheidung, deshalb Gold. Auf einer Karte, die den
Datenbestand selbst zum Thema hätte, könnte dieselbe Box grün sein.

**S3 und Shop-Frontend tragen beide Blau.** Beide sind Quellen: S3 ist die
Quelle der historischen Daten, das Frontend die Quelle der Live-Signale und
der Anfragen. Dass zwei so verschiedene Dinge dieselbe Farbe tragen, ist
gewollt — die Farbe beantwortet die Rollenfrage, nicht die Frage, welcher
Dienst das ist.

**Der Event Tracker ist Transport, nicht Compute.** Er rechnet nicht, er
nimmt Ereignisse entgegen und reicht sie in den Datenbestand weiter. Es gibt
ein Danach, und dort liegen die Daten dann — das ist die
Transport-Definition des Stil-Guides.
