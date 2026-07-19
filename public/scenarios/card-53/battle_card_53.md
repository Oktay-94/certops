---
nr: 53
title: "Athena · Glue Data Catalog · S3 — Ad-hoc-SQL auf dem Data Lake ohne Cluster"
services:
  - Amazon Athena
  - AWS Glue Data Catalog
  - Amazon S3
domains:
  - D3
  - D4
signalwords:
  - "run SQL directly against data in S3"
  - "no cluster to provision or manage"
  - "pay only for the queries you run"
  - "highly partitioned table, queries are slow"
  - "reduce the amount of data scanned"
  - "the same query runs several times a day"
assets:
  - battle_card_53.svg
  - battle_card_53.png
  - battle_card_53.pdf
status_note: >
  QC (scripts/qc.py): 0 Befunde. Gemeldet 8 Boxen, 42 Texte, 20 Segmente,
  6 Badges. Segmentzahl aufgeschluesselt nach R5: 20 gemeldet minus 10
  Phantom-Segmente aus fuenf Marker-Definitionen in <defs> = 10 tatsaechlich
  gezeichnete Segmente (8 <line>, 2 Teilsegmente des einen rechtwinkligen
  <path>). Badge-Zahl nach R6: 6 gemeldete Badges = die sechs Nummern-Badges;
  der weiss gefuellte Kreis mit rotem Rand bei (180,555) ist das rote X des
  verworfenen Pfades und wird von Pruefung (d) korrekt nicht als Badge
  gezaehlt.
  Korrekturrunden: null. Der Geometrieplan lief im ersten Durchlauf sauber
  durch — 0 Texte unter der 20-px-Reserve aus R4, 0 Kollisionen bei der
  Liang-Barsky-Pruefung aller geplanten Segmente gegen alle Boxen (6 px
  Inset). Footer in drei Varianten gemessen, V3 mit 1114,4 px uebernommen.
  Schwarz-Pruefung nach R13: 0 px reines Schwarz (0,0,0) im PNG. Alle acht
  Palettenfarben nachweisbar (#2E6BE6 5213 px, #7A3FE0 14863 px, #D97706
  3935 px, #3F8624 5316 px, #232F3E 3354 px, #B0084D 1416 px, #C7161D
  2379 px, #9A9A9A 2494 px). R12-Gegencheck: genau ein <path> mit stroke
  (Result Reuse -> Ergebnis, rechtwinklig), traegt fill="none".
  Render-Sanity: neun Freizonen aus der Elementgeometrie abgeleitet, EINE
  musste nachgeschnitten werden — Zonenfehler nach R7, kein Grafikfehler.
  Z2 reichte von y=180 bis y=330 und schnitt damit das Label "liest Praefixe"
  (87,3 px breit, text-anchor=middle auf x=790, belegt 746,4..833,6, Baseline
  322, Oberkante ~310); neu bei y=305 geschnitten. Danach 9 von 9 Zonen frei.
  Methodisch geaendert gegenueber Karte 52: die im Geometrieplan gemessenen
  Labelgrenzen wurden diesmal direkt in die Zonendefinition uebernommen statt
  danebengerechnet. Die Zahl der Zonen-Nachbesserungen fiel damit von vier
  (K52) auf eine.
  Footer von Hand mit PIL gemessen: 1114,4 px (Stil-Guide ~1420,
  R3-Arbeitsgrenze ~1400).
  Sichtpruefung nach R8: versucht. Der view-Aufruf lieferte ein Bildobjekt
  ohne lesbaren Inhalt zurueck — die Karte konnte NICHT gesehen werden.
  Damit dreimal von dreimal in dieser Sitzung. Rechnerisch geprueft ist nicht
  gesehen. Sichtpruefung durch Oktay steht aus.
---

# Battle Card 53 — Athena · Glue Data Catalog · S3

## Szenario

Ein Versicherer legt Schadensmeldungen als Parquet in S3 ab, partitioniert
nach `jahr=/monat=/tag=`. Nach vier Jahren stehen dort **über 40.000
Partitionen**. Die Analysten klagen, dass selbst eine Abfrage über einen
einzigen Tag spürbar lange braucht — obwohl das gelesene Datenvolumen klein
ist. Zusätzlich läuft eine tägliche Standardauswertung jeden Morgen **fünfmal
identisch**, weil mehrere Abteilungen dieselbe Kennzahl ziehen. Ein
Redshift-Cluster stand als Alternative im Raum.

## Ablauf

**1 — Der Analyst schickt Standard-SQL an Athena.**
Es gibt nichts zu provisionieren und nichts, was zwischen zwei Abfragen
weiterläuft. Athena arbeitet nach **schema-on-read**: die Dateien in S3
bleiben, wie sie sind, und die Tabellendefinition legt bloß fest, wie sie
gelesen werden.

**2 — Ohne Partition Projection ruft Athena `GetPartitions` bei Glue ab.**
Das ist der Umweg, den die Karte gestrichelt zeigt. Bei 40.000 Partitionen
wird dieser Abruf selbst zum Engpass — **bevor** überhaupt eine Datei
gelesen wurde. Genau das erklärt den Widerspruch aus dem Szenario: die
Abfrage ist langsam, obwohl sie wenig Daten liest. Die Zeit vergeht in der
Partitionsverwaltung, nicht im Scan.

**Mit Partition Projection entfällt dieser Schritt vollständig.**
In den Tabelleneigenschaften stehen Wertebereiche und Projektionstypen je
Partitionsspalte. Athena **berechnet** die Partitionen daraus, statt sie
abzurufen. Der Nebeneffekt ist wichtig und wird oft übersehen: sobald
Projection aktiv ist, **ignoriert Athena die im Glue-Katalog registrierten
Partitions-Metadaten**. Beides parallel zu pflegen ist verlorene Arbeit.

**3 — Athena liest ausschließlich die passenden Präfixe aus S3.**
Zwei Hebel wirken hier getrennt und multiplizieren sich: **Partitionierung
spart Zeilen** (der Tagesordner wird geöffnet, die übrigen 39.999 nicht),
**Parquet spart Spalten** (nur die in der Abfrage genannten Felder werden
gelesen). Wer nur eines von beidem tut, verschenkt die Hälfte.

**4 — Das Ergebnis geht an den Analysten.**
Abgerechnet wird nach gescanntem Volumen — nicht nach Laufzeit, nicht nach
Ergebnisgröße. Ein `SELECT *` über eine unpartitionierte Tabelle kostet
dasselbe, ob es zehn Zeilen zurückgibt oder zehn Millionen.

**5 und 6 — Query Result Reuse bedient die vier Wiederholungen.**
Läuft dieselbe Abfrage erneut, kann Athena das gespeicherte Ergebnis
ausliefern, statt neu zu scannen. Die Bedingungen sind eng: **exakt
derselbe Query-String**, dieselbe Datenbank und derselbe Katalog, dieselbe
Workgroup, und das Ergebnis darf nicht älter sein als das angegebene
Höchstalter — maximal sieben Tage, ohne Angabe 60 Minuten. Das Feature ist
**pro Abfrage opt-in** und standardmäßig aus.

**Verworfen — der Redshift-Cluster.**
Redshift wäre die richtige Antwort bei dauerhaft hoher Abfragelast mit
vielen gleichzeitigen Nutzern. Hier passt er nicht: die Last ist
sporadisch, und ein Cluster läuft auch nachts und am Wochenende weiter —
er kostet, wenn niemand fragt. Athena kostet nichts, wenn niemand fragt.

## Prüfungs-Kernsatz

**Athena zahlt pro gescanntem Volumen — also entscheidet das Layout, nicht
das SQL.** Partitionen sparen Zeilen, Parquet spart Spalten, Projection
spart den Katalog-Lookup, Result Reuse spart den Scan komplett.

## Abgrenzungen

- **53 ↔ 52:** Auf 52 geht es darum, **wie die Daten in den Lake kommen** und
  in welcher Form sie landen (Firehose schreibt Parquet und legt Präfixe an).
  Auf 53 geht es darum, **was die Abfrage darauf kostet**. Die beiden Karten
  sind zwei Hälften derselben Pipeline: 52 baut das Layout, 53 profitiert
  davon.
- **53 ↔ 26 (Redshift Spectrum):** Beide lesen S3-Daten per SQL und beide
  nutzen den **Glue Data Catalog** als gemeinsames Register. Der Unterschied
  ist die Rechenschicht: Athena ist serverless, Spectrum setzt einen
  **laufenden Redshift-Cluster** voraus. Wer „no cluster" liest, ist bei
  Athena; wer bereits einen Cluster betreibt und dessen Reichweite auf S3
  ausdehnen will, ist bei Spectrum.
- **53 ↔ 40 ↔ 49:** Dieselbe Engine, andere Datenquelle. Auf 49 liest Athena
  CloudTrail-Logs zur Forensik, hier fachliche Bestandsdaten. Der Glue Data
  Catalog ist allen gemeinsam.
- **53 ↔ 57 (Glue ETL):** Der **Data Catalog** ist ein Register und speichert
  keine Daten. **Glue ETL** ist ein davon getrennter Dienst, der Daten
  tatsächlich transformiert. Beide heißen „Glue" und werden regelmäßig
  verwechselt — auf dieser Karte kommt nur der Katalog vor.
- **53 ↔ 58 (Lake Formation):** Sobald feingranulare Rechte auf Zeilen- oder
  Spaltenebene im Spiel sind, ändert sich das Bild: solche Tabellen sind von
  Query Result Reuse **ausgeschlossen**. Die Karten widersprechen sich nicht,
  sie beschreiben verschiedene Regime.
- **53 ↔ 60 (Redshift Serverless):** Auch Redshift gibt es ohne feste
  Cluster-Kosten. Die Abgrenzung verschiebt sich damit von „Cluster ja/nein"
  auf das Abrechnungsmodell und die Art der Last — hier gescanntes Volumen
  je Ad-hoc-Abfrage, dort Rechenkapazität für anhaltende Warehouse-Last.

## Klassiker-Fallen

1. **Partitionen werden gepflegt, obwohl Projection aktiv ist.** Sobald
   Partition Projection eingeschaltet ist, ignoriert Athena die im Katalog
   registrierten Partitions-Metadaten vollständig. Wer weiter `MSCK REPAIR`
   oder `ALTER TABLE ADD PARTITION` fährt, pflegt Einträge, die niemand mehr
   liest — und wundert sich, dass neue Partitionen trotzdem gefunden werden
   (oder umgekehrt nicht, wenn der Wertebereich in der Projektion zu eng
   gesetzt ist).
2. **Result Reuse wird für einen automatischen Cache gehalten.** Es ist
   **opt-in pro Abfrage** und standardmäßig aus. Außerdem greift es nur bei
   exaktem Textmatch: ein zusätzliches Leerzeichen, ein anderer Alias oder
   eine andere Workgroup — und es wird neu gescannt. Wer damit Kosten plant,
   muss die Bedingungen einhalten.
3. **Athena wird für ein Data Warehouse gehalten.** Es ist eine Abfrage-Engine
   ohne eigenen Speicher und ohne eigene Indizes. Für viele gleichzeitige
   Nutzer mit anhaltender Last und wiederkehrenden komplexen Joins ist ein
   Warehouse die passendere Antwort — Athena glänzt bei sporadischen
   Ad-hoc-Fragen.
4. **„Parquet reicht."** Spaltenformat allein liest weiterhin jede Partition,
   nur schmaler. Erst die Kombination aus Partitionierung und Spaltenformat
   bringt den vollen Effekt.

## Faktencheck — Divergenzen zu älterem Kursmaterial

1. **Partition Projection ersetzt den `GetPartitions`-Aufruf vollständig.**
   Athena ruft normalerweise vor dem Partition Pruning `GetPartitions` beim
   Glue Data Catalog ab; bei vielen Partitionen belastet das die Performance.
   Mit Projection entfällt der Aufruf, weil die Konfiguration Athena alle
   nötigen Informationen liefert, um die Partitionen selbst zu bilden.
   *Quelle: AWS Doku, „Use partition projection with Amazon Athena".*

2. **Aktivierte Projection lässt Athena die Katalog-Partitionen ignorieren.**
   Das steht ausdrücklich in derselben Doku-Seite und ist der Punkt, den
   Kursmaterial fast durchgängig auslässt: Projection ist kein Zusatz zur
   Katalogpflege, sondern ihr Ersatz.
   *Quelle: AWS Doku, „Use partition projection with Amazon Athena".*

3. **Query Result Reuse setzt Athena Engine Version 3 voraus.** Kursmaterial,
   das vor der breiten Verfügbarkeit von v3 entstand, kennt das Feature nicht
   und rechnet jede Wiederholung als vollen Scan.
   *Quelle: AWS Doku, „Reuse query results in Athena".*

4. **Höchstalter für wiederverwendete Ergebnisse: sieben Tage, Default 60
   Minuten.** Angebbar in Minuten, Stunden oder Tagen; die API-Referenz nennt
   `MaxAgeInMinutes` mit einem gültigen Bereich von 0 bis 10080 (= 7 Tage),
   Default 60.
   *Quelle: AWS Doku, „Reuse query results in Athena"; AWS API-Referenz,
   „ResultReuseByAgeConfiguration".*

5. **Result Reuse hat harte Ausschlüsse.** Nicht unterstützt: externe
   Hive-Metastores, föderierte Kataloge, Lake-Formation-governed Tables,
   Tabellen mit Zeilen- oder Spaltenfilterung sowie S3-Speicherorte, die als
   Datenort in Lake Formation registriert sind. Ebenso nur `SELECT` und
   `EXECUTE`. Wer das Feature pauschal als Kostenhebel einplant, übersieht,
   dass genau die stark regulierten Umgebungen ausgenommen sind.
   *Quelle: AWS Doku, „Reuse query results in Athena".*

## Nicht bestätigt

- **Sämtliche Preisangaben.** Verbreitet genannt werden 5 US-Dollar je
  gescanntem Terabyte, ein Mindestbetrag von 10 MB je Abfrage, kostenlose
  DDL-Anweisungen und Provisioned Capacity ab etwa 0,40 US-Dollar je
  DPU-Stunde bei mindestens 24 DPUs. **Alle diese Angaben stammen hier aus
  Drittquellen**; die AWS-Preisseite wurde nicht direkt gegengelesen. Preise
  gehören nach der in Batch 10 gesetzten Regel ohnehin nicht auf die Karte.
  Auf der Karte steht „pro gescanntem Volumen" ohne Betrag.
- **Engine v3 ist strenger im ANSI-SQL als v2** und einzelne v2-Abfragen
  brechen beim Umstieg (genannt werden u. a. `CONCAT` mit mindestens zwei
  Argumenten und geänderte Iceberg-Time-Travel-Syntax). Plausibel und passend
  zum AWS-Bild, aber nur über eine Drittquelle belegt. Nicht auf der Karte.
- **Empfohlene Dateigröße 128 MB bis 1 GB.** Mehrfach in Drittquellen
  genannt, in der AWS-Doku nicht gegengeprüft. Nicht auf der Karte.
- **Konkrete Einsparquoten** (90 %, 95 %, 99 %) aus Fallbeispielen von
  Drittanbietern. Nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Der Glue-Pfad ist als Umweg gezeichnet, nicht als Alternative.** In der
  Realität existiert der Katalog auch bei aktiver Projection weiter — er hält
  Tabellendefinition und Spalten. Nur die **Partitions**-Metadaten werden
  ignoriert. Die gestrichelte Box mit dem Hinweis „bei Projection nicht
  gefragt" bildet das ab, ohne den Katalog fälschlich als überflüssig
  darzustellen.
- **Der Glue Crawler fehlt.** Wie auf Karte 52 zeigt die Karte nur, dass der
  Katalog die Definition hält, nicht wie sie entsteht.
- **Der Ergebnis-Bucket ist nicht gezeichnet.** Athena legt Abfrageergebnisse
  in S3 ab; genau darauf greift Result Reuse zurück. Die „Ergebnis"-Box steht
  für den Rückfluss an den Analysten, nicht für den technischen Speicherort.
- **Die Zahl 40.000 ist gesetzt, nicht gemessen.** Sie steht für „so viele,
  dass die Partitionsverwaltung selbst zum Engpass wird" — eine harte Schwelle
  nennt AWS nicht.
- **Compression ist nicht dargestellt.** Sie wirkt in dieselbe Richtung wie
  Parquet, hätte aber eine weitere Zeile gekostet, ohne die Kernaussage zu
  schärfen.

## Farbkonventionen dieser Karte

- **Lila #7A3FE0 — Athena.** Konsistent mit Karte 40, 49 und 52. Trägt hier
  zusätzlich die Box „Query Result Reuse", weil es sich um ein Athena-Feature
  handelt und nicht um einen eigenen Dienst.
- **Orange #D97706 — Glue Data Catalog.** Der Stil-Guide führt Glue unter
  Orange; die Entscheidung wurde für Karte 52 bestätigt und gilt hier
  unverändert.
- **Grün #3F8624 — S3 und Datenbestände.**
- **Blau #2E6BE6 — Nutzer und Clients.** Trägt den Analysten.
- **Navy #232F3E — neutral-wichtig.** Trägt die Ergebnis-Box; sie ist kein
  AWS-Dienst, sondern das Resultat, und bekommt daher den neutralen Ton.
- **Rot-Pink #B0084D — relationale DB-Engine.** Trägt den verworfenen
  Redshift-Cluster. **Hinweis zur offenen Doppelbelegung:** #B0084D trägt laut
  Batch-9-Konvention relationale Engines, laut Stil-Guide aber SCP. Auf dieser
  Karte kommt kein SCP vor, der Konflikt tritt also nicht auf — die
  Entscheidung bleibt offen und wird fällig, sobald eine Karte beides zeigt.
- **Rot #C7161D — ausschließlich „verworfen".** Nur das rote X und der Pfad
  dorthin; der Box-Rand des Redshift-Clusters trägt Rot-Pink, weil er den
  Dienst kennzeichnet, während Rot die Ablehnung markiert. **Gold und Rot
  getrennt zu halten ist hier nicht nötig**, weil kein Gold vorkommt: der
  Kostenaspekt steht als Text in der Box, nicht als eigene Farbe.
- **Grau #9A9A9A — Zonenrahmen.** Zwei Zonen: „SERVERLESS — kein Cluster" und
  „ABFRAGE — pro Volumen".
