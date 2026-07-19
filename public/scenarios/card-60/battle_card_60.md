---
nr: 60
title: "Data Warehouse fuer schubweise Quartalslast mit Redshift Serverless und Zero-ETL"
services:
  - Amazon Redshift Serverless
  - Amazon Aurora PostgreSQL (Zero-ETL)
  - Amazon Redshift Spectrum
  - Amazon S3
  - Amazon QuickSight
domains:
  - D1
  - D3
  - D4
signalwords:
  - "no clusters to manage"
  - "pay only for what you use"
  - "usage is highly intermittent"
  - "complex joins and aggregations across large tables"
  - "hard monthly spending cap"
  - "near real-time data from the operational database without building ETL pipelines"
  - "automatically pauses when idle"
assets:
  - battle_card_60.svg
  - battle_card_60.png
  - battle_card_60.pdf
status_note: |
  QC (scripts/qc.py): 0 Befunde.
  Gegenzaehlung R5: 9 Boxen gemeldet = 8 fachliche Boxen + 1 Footer-Rect (wie
  Karte 59, eine weniger als 56–58). Die gestrichelte Zone zaehlt qc.py korrekt
  nicht mit. 58 Texte. 7 Segmente = 7 gezeichnete <path>-Pfeile, alle
  geradlinig. 7 Badges, randlos und in Linienfarbe gefuellt. Keine weiss
  gefuellten Kreise mit Rand (R6 nicht einschlaegig).

  Korrekturrunden — nur EINE, vor dem Zeichnen:
  (1) Label "bleibt extern" (96,1 px) sprengte den 82,5 px breiten Korridor
      zwischen S3 und der Max-Box und beruehrte beide. Gekuerzt auf "extern"
      (48,9 px), zentriert ueber dem Segment. Die vollstaendige Aussage steht
      ohnehin in der S3-Box ("bleibt, wo es liegt").
  **Nur eine Korrekturrunde, weil die in Karte 59 gefundene Konvention von
  Anfang an angewendet wurde:** Bei engen Korridoren gehoert das Label UEBER
  das Segment (anchor=middle, rund 9 px Luft zur Badge-Oberkante), nicht
  daneben. Diese Regel hat auf Karte 60 vier weitere Label-Kollisionen
  verhindert, bevor sie entstehen konnten.

  Render-Sanity: 12 Freizonen aus der Elementgeometrie, **0 belegte Pixel im
  ERSTEN Durchgang, kein Nachschnitt** — dritte Karte in Folge nach 58 und 59.
  Alle fuenf Palettenfarben im PNG nachweisbar (blau 1664, gruen 1387,
  rot 5855, pink 2793, Zonengrau 1908 px).

  Schwarz-Pruefung R13: 3804 dunkle Punkte im Sample, ausnahmslos im Titel
  (y 40..80) und im Footer-Merksatz (y 722..746) — beide laut Stil-Guide
  #111111. 0 Punkte ausserhalb. Kein schwarz gefuellter Pfad.

  R12-Gegencheck: 7 <path>-Elemente mit stroke, davon 7 mit fill="none".
  Erfuellt. Die vier Marker-<path> tragen fill und keinen stroke — korrekt.

  Footer von Hand gemessen: Merksatz 1028,7 px bei 16 px bold (Grenze 1480) —
  der breiteste Merksatz dieses Batches. Zeile 2 822,5 px, Zeile 3 804,8 px bei
  15 px. Zonenlabel "AMAZON REDSHIFT SERVERLESS" 330,2 px, zentriert auf x=730
  in einer 660 px breiten Zone (Innengrenzen 408..1052) — 157 px Reserve je Seite.

  Sichtpruefung: VERSUCHT, NICHT GELUNGEN. `view` gab einen leeren Platzhalter
  zurueck. Damit 25. erfolgloser Versuch in Folge (R8). Diese Karte ist
  RECHNERISCH GEPRUEFT, ABER NICHT GESEHEN. Freigabe durch Oktay steht aus.
---

# Battle Card 60 — Redshift Serverless, Zero-ETL, S3

## Szenario

Ein Moebelhersteller betreibt sein Bestellsystem auf **Aurora PostgreSQL**. Das
Controlling braucht ein Data Warehouse fuer Quartalsauswertungen: **komplexe
Joins ueber Bestellungen, Lieferanten und Retouren**, dazu Abfragen gegen sieben
Jahre Historie in S3.

Die Nutzung ist **stark ungleich verteilt** — an drei Tagen im Quartal arbeiten
zwanzig Analysten gleichzeitig, dazwischen liegt das System **tagelang still**.
Ein rund um die Uhr laufender Cluster waere die meiste Zeit unbeschaeftigt. Die
Finanzabteilung verlangt eine **harte Obergrenze** fuer die monatlichen Kosten.
Niemand im Team will Knotentypen dimensionieren.

## Ablauf 1–7

**1 — Aurora → Zero-ETL.** Das Bestellsystem laeuft unveraendert weiter. Aurora
ist eine OLTP-Datenbank: gut fuer viele kleine Transaktionen, ungeeignet fuer
Joins ueber Millionen Zeilen mit zwanzig gleichzeitigen Analysten. Genau deshalb
braucht es ein Warehouse daneben — nicht statt dessen.

**2 — Zero-ETL → Redshift.** Die Integration repliziert die Daten **innerhalb
von Sekunden nach dem Schreiben** nach Redshift. Kein Glue-Job, kein Zeitplan,
keine Bookmarks. Das ist der Unterschied zu Karte 57: Dort war die naechtliche
Transformation die Aufgabe, hier soll gar keine Pipeline entstehen.

**3 — RPU statt Knotentypen.** Redshift Serverless misst Kapazitaet in **Redshift
Processing Units**; ein RPU liefert 16 GB Speicher. Statt Knotentyp und
Knotenzahl festzulegen, setzt man eine Basiskapazitaet — oder ueberlaesst das
der KI-gestuetzten Skalierung, die den Bedarf vorhersagt und die Kapazitaet
anpasst, **bevor** Abfragen in die Warteschlange laufen.

**4 — Max deckelt das Budget.** Die Max-Einstellung wird in **RPU-Stunden je
Tag, Woche oder Monat** gesetzt. Wird die Grenze erreicht, fuehrt Redshift eine
hinterlegte Aktion aus. Damit ist die Forderung der Finanzabteilung erfuellt,
ohne die Skalierung zu beschneiden, solange Budget da ist.

**5 — S3 bleibt, wo es ist.** Die sieben Jahre Historie werden **nicht geladen**.
Sie liegen weiter als Parquet im Data Lake.

**6 — Spectrum verbindet beide Welten.** Redshift Spectrum liest die S3-Daten
mit und erlaubt Joins zwischen Warehouse-Tabellen und Data-Lake-Dateien in einer
einzigen Abfrage. Bei Serverless wird das ueber dieselben RPU abgerechnet — kein
getrennter Posten wie beim provisionierten Cluster.

**7 — QuickSight und Analysten.** Das Controlling bekommt seine
Quartalsauswertung, die Analysten arbeiten drei Tage lang per SQL. Danach liegt
die Last wieder bei null — und die Kapazitaet faehrt herunter, statt weiter
abgerechnet zu werden.

## Pruefungs-Kernsatz

**Anhaltende Warehouse-Last mit Joins und vielen gleichzeitigen Nutzern ist
Redshift — und wenn diese Last schubweise auftritt, ist es Redshift Serverless.**

## Abgrenzungen

**60 ↔ 53 (Athena).** Die wichtigste Abgrenzung dieser Karte, und sie ist
feiner, als es scheint: **Beide kommen ohne festen Cluster aus.** Die Trennlinie
ist nicht "Cluster ja/nein", sondern **Abrechnungsmodell und Lastart**. Athena
rechnet nach **gescanntem Volumen je Ad-hoc-Abfrage** — ideal fuer gelegentliche
Fragen an den Data Lake. Redshift Serverless rechnet nach **Rechenkapazitaet fuer
anhaltende Warehouse-Last** — Joins ueber mehrere grosse Tabellen, Aggregationen,
zwanzig gleichzeitige Nutzer ueber Stunden. Steht "complex joins", "concurrent
users" oder "data warehouse" im Text, ist es Redshift; steht "ad hoc", "occasional"
oder "query data in S3 directly", ist es Athena.

**60 ↔ Redshift Provisioned.** Provisioned lohnt bei **stetiger, vorhersagbarer
Last**, besonders mit Reserved Instances. Serverless lohnt bei **variabler,
periodischer oder schubweiser Last** und in Test- und Entwicklungsumgebungen.
Formulierungen wie "runs 24/7", "predictable workload" oder "committed usage"
deuten auf Provisioned; "intermittent", "spiky" oder "idle for days" auf
Serverless.

**60 ↔ 57 (Glue ETL).** Wenn transformiert werden muss — Format aendern,
bereinigen, zusammenfuehren —, ist es Glue ETL. Wenn Daten nur **ankommen**
sollen, ist Zero-ETL der kuerzere Weg. Das Szenario sagt ausdruecklich "ohne
Pipelines zu bauen".

**60 ↔ 59 (Flink).** Redshift beantwortet Fragen ueber **gespeicherte** Daten,
Flink ueber **fliessende**. "Quartalsauswertung" ist gespeichert.

## Klassiker-Fallen

**Falle 1 — Athena fuer Warehouse-Last waehlen.** Verlockend, weil "serverlos"
und "keine Cluster" auf beide passt. Bei zwanzig gleichzeitigen Analysten, die
stundenlang komplexe Joins fahren, ist das Abrechnungsmodell nach gescanntem
Volumen aber der teurere und langsamere Weg.

**Falle 2 — Provisioned mit Reserved Instances vorschlagen.** Rechnerisch
attraktiv, im Szenario falsch: Reserved Instances zahlen sich bei stetiger Last
aus. Bei tagelangem Leerlauf zahlt man eine Kapazitaet, die niemand nutzt.

**Falle 3 — "Max" als Skalierungslimit missverstehen.** Max ist eine
**Budgetgrenze in RPU-Stunden**, keine Obergrenze fuer die Kapazitaet. Wer es
verwechselt, glaubt, die Skalierung zu begrenzen, und begrenzt die Ausgaben — oder
umgekehrt.

**Falle 4 — eine ETL-Pipeline bauen, wo Zero-ETL genuegt.** Die Antwortoption
"Glue-Job schreibt naechtlich aus Aurora nach Redshift" klingt solide und ist bei
"near real-time" und "ohne Pipelines" die falsche Wahl.

**Falle 5 — Kaltstart nicht einplanen.** Nach laengerem Leerlauf braucht die
erste Abfrage spuerbar laenger, weil Kapazitaet wieder hochgefahren wird. Fuer
ein Quartalsreporting unerheblich, fuer eine interaktive Anwendung mit
Latenzzusage nicht. Ein Szenario, das strenge Antwortzeiten **auch nach
Leerlauf** fordert, deutet auf Provisioned.

## Faktencheck — Divergenzen zu aelterem Kursmaterial

**(1) KI-gestuetzte Skalierung ist seit April 2026 Voreinstellung fuer neue
Workgroups.** Sie sagt den Rechenbedarf mit maschinellem Lernen voraus und passt
die Ressourcen an, **bevor Abfragen in die Warteschlange laufen**. Mit demselben
Release wurde der unterstuetzte Bereich fuer AI-Scaling von 32–512 auf **8–512
RPU** erweitert, was die Einstiegskosten senkt. Dazu kommen ein
Preis-Leistungs-Schieberegler und automatische Optimierungen wie materialisierte
Sichten und Tabellendesign. Angekuendigt wurde die Funktion im Oktober 2024.
*Quellen: AWS What's New, "Amazon Redshift Serverless AI-driven scaling is now the
default for new workgroups", April 2026; AWS What's New, "Announcing Amazon
Redshift Serverless with AI-driven scaling and optimization", 30.10.2024.*

**(2) Der Kapazitaetsbereich hat sich an beiden Enden verschoben.** Ein RPU
liefert 16 GB Speicher; die Basiskapazitaet reicht laut aktueller Preisseite von
**4 bis 1024 RPU**. Die Obergrenze stieg im **September 2024** von 512 auf 1024
(zunaechst drei US-Regionen, ab November 2024 auch Frankfurt und Irland), die
Untergrenze fiel im **Juni 2025** von 8 auf 4 und wurde bis **November 2025** auf
viele weitere Regionen ausgeweitet. Aeltere Kurse nennen 8–512 oder 32–512.
*Quellen: AWS-Preisseite Amazon Redshift; AWS What's New vom 13.09.2024,
08.11.2024, 30.06.2025 und 20.11.2025.*

**(3) "Max" ist eine Budgetgrenze, kein Kapazitaetslimit.** Die AWS-Preisseite
beschreibt Max als Nutzungsgrenze in **RPU-Stunden**, verknuepft mit einem
taeglichen, woechentlichen oder monatlichen Zeitraum, samt automatischer Aktion
bei Erreichen. Kursmaterial stellt Max haeufig als Gegenstueck zur
Basiskapazitaet dar, also als Obergrenze der Skalierung — das ist irrefuehrend.
*Quelle: AWS-Preisseite Amazon Redshift, Abschnitt Redshift Serverless.*

**(4) Zero-ETL aus Aurora PostgreSQL ist seit Oktober 2024 allgemein verfuegbar
und zielt ausdruecklich auch auf Serverless-Workgroups.** Daten stehen
**innerhalb von Sekunden** nach dem Schreiben in Aurora fuer Analysen in Redshift
bereit; als Ziel kommen Redshift-Serverless-Workgroups oder provisionierte
Cluster mit RA3-Instanztypen in Frage. Quellseitig werden sowohl
Aurora-provisioned-Cluster als auch Aurora Serverless v2 unterstuetzt.
*Quelle: AWS What's New, "Amazon Aurora PostgreSQL zero-ETL integration with
Amazon Redshift now generally available", 15.10.2024.*

**(5) Beide Betriebsarten koennen dasselbe und lassen sich wechselseitig
migrieren.** Der AWS Big Data Blog stellt klar: Provisioned und Serverless bieten
**dieselben Funktionen** einschliesslich SQL, Zero-ETL und Federated Query, und
eine Migration ist in beide Richtungen moeglich. Die Wahl ist eine Frage des
Lastprofils, nicht des Funktionsumfangs — anders, als es Kursmaterial
gelegentlich nahelegt.
*Quelle: AWS Big Data Blog, "Amazon Redshift DC2 migration approach with a
customer case study".*

## Nicht bestaetigt

- **Konkrete Preise und Rabattsaetze** (Stundensaetze je RPU, Ersparnis durch
  Reserved Instances oder Serverless Reservations) stehen weder auf der Karte
  noch hier als Zahl. Die auffindbaren Angaben stammen ueberwiegend aus
  Drittquellen, widersprechen einander teilweise und aendern sich. Gesichert und
  fuer die Pruefung ausreichend ist die **Struktur**: Abrechnung nach
  RPU-Sekunden bei aktiver Last, Budgetdeckel ueber Max.
- **Die Dauer des Kaltstarts** nach Leerlauf ist in den geprueften AWS-Quellen
  nicht beziffert. Eine Drittquelle nennt eine Groessenordnung von Sekunden; das
  ist nicht bestaetigt. Falle 5 nennt deshalb nur das Phaenomen, keine Zahl.
- **Die Aussage, Provisioned liefere bei gut optimierten Lasten spuerbar bessere
  Abfrageleistung**, stammt aus einem Vergleichsartikel, nicht von AWS. Nicht
  auf der Karte; in der Abgrenzung ist nur das von AWS gedeckte Kriterium
  genannt (stetige gegenueber variabler Last).
- **Eine Obergrenze von 512 RPU fuer Serverless**, wie sie eine Drittquelle
  nennt, widerspricht der AWS-Preisseite (1024). Bei zwei sich widersprechenden
  Angaben kommt **keine Zahl auf die Karte** — dort steht der von AWS selbst
  genannte Bereich 4 bis 1024.

## Bewusste Vereinfachungen im Diagramm

- **Zero-ETL ist als eigene Box gezeichnet.** Real ist es eine Integration
  zwischen zwei Diensten, kein eigenstaendiger Baustein mit eigener Oberflaeche.
  Die Box macht sichtbar, dass hier **kein** ETL-Job steht — didaktisch
  wichtiger als die technische Genauigkeit.
- **"RPU + AI-Scaling" und "Max" sind zwei Boxen.** Beide sind Einstellungen
  derselben Workgroup, keine getrennten Komponenten. Getrennt gezeichnet, weil
  ihre Verwechslung Falle 3 ist.
- **Der Weg von Aurora zu QuickSight ist verkuerzt.** Zwischen Redshift und
  QuickSight steht real ein Dataset mit SPICE oder Direct Query — das ist Thema
  von Karte 56, worauf die QuickSight-Box ausdruecklich verweist.
- **Der Kaltstart ist nicht gezeichnet.** Er steht nur in Falle 5. Ein eigenes
  Element haette dem Bild eine Warnung hinzugefuegt, die im Szenario
  (Quartalsreporting) nicht traegt.
- **Die Analysten-Box steht fuer die Last, nicht fuer Personen.** "20 Analysten,
  drei Tage im Quartal" ist die Kurzform des Lastprofils, das die ganze
  Entscheidung traegt.

## Farbkonventionen dieser Karte

| Farbe | Bedeutung auf dieser Karte |
|---|---|
| Blau `#1F5C99` | Aurora — operative Datenbank als Quelle |
| Gruen `#1B7F5A` | S3 — Data-Lake-Speicher |
| Rot `#A33A2A` | Redshift-Bausteine: Zero-ETL, RPU/AI-Scaling, Max, Spectrum |
| Pink `#B03060` | Konsumenten: QuickSight und Analysten |
| Zonengrau `#888888` | Rahmen und Beschriftung der Redshift-Serverless-Zone |
| Gestrichelt `4,4` | Zonenrahmen Amazon Redshift Serverless |

**Anmerkung zu den Doppelbelegungen:** Rot ist auf dieser Karte **neu** und
ausschliesslich fuer Redshift-Bausteine reserviert. Blau traegt hier Aurora als
**Datenquelle** — auf Karte 59 trug Blau Kinesis als **Transport**, auf Karte 57
den EventBridge Scheduler als **Ausloeser**. Das ist die dritte unterschiedliche
Bedeutung von Blau in diesem Batch und verschaerft die seit Karte 57 offene
Farbfrage. Gruen fuer S3 und Pink fuer Konsumenten sind dagegen ueber alle fuenf
Karten dieses Batches konsistent.
