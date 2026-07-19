---
nr: 58
title: "Data Lake mit Zeilen- und Spaltenrechten fuer drei Teams via Lake Formation"
services:
  - AWS Lake Formation
  - AWS Glue Data Catalog
  - Amazon S3
  - Amazon Athena
  - Amazon Redshift Spectrum
  - AWS IAM Identity Center
domains:
  - D1
  - D3
signalwords:
  - "column-level and row-level permissions"
  - "without duplicating the dataset"
  - "same permissions must apply across Athena and Redshift Spectrum"
  - "centrally manage access as the number of tables grows"
  - "mask personally identifiable columns for one team"
  - "cell-level security"
  - "restrict rows based on region"
assets:
  - battle_card_58.svg
  - battle_card_58.png
  - battle_card_58.pdf
status_note: |
  QC (scripts/qc.py): 0 Befunde.
  Gegenzaehlung R5: 10 Boxen gemeldet = 9 fachliche Boxen + 1 Footer-Rect. Die
  gestrichelte Zone (dasharray 4,4) wird von qc.py korrekt NICHT als Box
  gezaehlt. 64 Texte. 8 Segmente = 8 gezeichnete <path>-Pfeile, alle geradlinig.
  7 Badges, alle randlos und in Linienfarbe gefuellt. Keine weiss gefuellten
  Kreise mit Rand (R6 nicht einschlaegig).

  Korrekturrunden — beide vor dem Zeichnen im Geometrieplan gefunden:
  (1) Boxtitel "Redshift Spectrum" 210,2 px > 207 px Innenbreite — nur 3,2 px
      zu breit. BEWUSST NICHT durch Abkuerzen des Servicenamens geloest
      ("Redshift Spectr." waere auf einer Lernkarte schaedlich), sondern durch
      Verschieben der Boxen athena und spectrum um 20 px nach links bei
      gleichzeitiger Verbreiterung auf 250 px (x 770..1020). Die Segmente 4
      und 5 werden dadurch laenger statt kuerzer; Zielkante bleibt sauber.
      Gepruefte, aber verworfene Alternative: Box nur verbreitern auf x 790..1040 —
      dann haette Segment 7 (Start x=1020) INNERHALB der Spectrum-Box begonnen.
  (2) Nach dem Verschieben meldete der Plan zwei Segment-durch-Box-Kollisionen.
      Ursache war kein Layoutfehler, sondern eine TOTE ERSTE SEGS-DEFINITION im
      Planskript: Die Liste war versehentlich zweimal zugewiesen, meine
      Korrektur traf nur die ueberschriebene erste Fassung. Die tote Definition
      wurde entfernt, danach 0 Befunde. Festgehalten, weil derselbe Fehler beim
      naechsten Edit erneut in die Irre gefuehrt haette.
  Nach dem Zeichnen wurden keine Labels verschoben; Plangrenzen gingen
  unveraendert in die Zonendefinition (R15).

  Render-Sanity: 12 Freizonen aus der Elementgeometrie, **0 belegte Pixel im
  ERSTEN Durchgang, kein Nachschnitt noetig**. Das ist die Lehre aus Karte 56
  (Zone bis Badge-Mitte statt cy-15) und Karte 57 (Zone ueber Labels gelegt):
  Diesmal wurden alle Zonen von vornherein gegen Label-Endkoordinaten und
  Badge-Aussenkanten geschnitten, jede mit dem Grund benannt.
  Alle sechs Palettenfarben im PNG nachweisbar (gruen 1375, lila 1164,
  gold 3294, orange 2848, pink 3936, Zonengrau 1462 px).

  Schwarz-Pruefung R13: 3707 dunkle Punkte im Sample, ausnahmslos im Titel
  (y 40..80) und im Footer-Merksatz (y 722..746) — beide laut Stil-Guide
  #111111. 0 Punkte ausserhalb. Kein schwarz gefuellter Pfad.

  R12-Gegencheck: 8 <path>-Elemente mit stroke, davon 8 mit fill="none".
  Erfuellt. Die vier Marker-<path> tragen fill und keinen stroke — korrekt.

  Footer von Hand gemessen: Merksatz 896,7 px bei 16 px bold (Grenze 1480),
  Zeile 2 767,1 px und Zeile 3 873,4 px bei 15 px.
  Zonenlabel "AWS LAKE FORMATION" 231,4 px, zentriert auf x=560 in einer
  340 px breiten Zone (Grenzen 398..722) — passt mit 66 px Reserve je Seite.

  Sichtpruefung: VERSUCHT, NICHT GELUNGEN. `view` gab ein Bildobjekt ohne
  lesbaren Inhalt zurueck. Damit 23. erfolgloser Versuch in Folge (R8). Diese
  Karte ist RECHNERISCH GEPRUEFT, ABER NICHT GESEHEN. Freigabe durch Oktay
  steht aus.
---

# Battle Card 58 — Lake Formation, Data Catalog, S3

## Szenario

Eine Krankenversicherung betreibt einen Data Lake mit Versichertendaten in S3.
Drei Teams greifen darauf zu:

- **Abrechnung** braucht alle Spalten, aber nur Versicherte der eigenen Region
- **Analytics** braucht alle Regionen, aber **keine Klarnamen und keine
  Versichertennummer**
- **Revision** darf alles sehen

Bisher wurden dafuer **drei Kopien des Datensatzes** gepflegt — teuer,
inkonsistent, und bei jeder Schemaaenderung dreifacher Aufwand. Gefordert ist
**eine einzige Tabelle** mit Berechtigungen auf Zeilen- und Spaltenebene, die
**gleichermassen fuer Athena und Redshift Spectrum** gelten. Die Zahl der
Tabellen waechst schnell; tabellenweise Rechtevergabe skaliert nicht.

## Ablauf 1–7

**1 — S3 → Data Catalog.** Die S3-Location wird in Lake Formation registriert.
Damit uebernimmt Lake Formation die Zugriffskontrolle auf diesen Pfad, und der
Data Catalog beschreibt Tabellen und Spalten. Wichtig: Der Katalog ist ein
**Register, kein Waechter** — er haelt die Metadaten, auf die die Regeln zeigen,
setzt aber selbst nichts durch.

**2 — Data Catalog → LF-Tags.** Statt jede Tabelle einzeln zu berechtigen,
werden **LF-Tags** an Datenbanken, Tabellen und einzelne Spalten geheftet, etwa
`classification=pii` an Klarname und Versichertennummer oder `region=sued` an
die regionale Tabelle. Die AWS-Doku rechnet den Nutzen vor: Was mit benannten
Ressourcen 17 einzelne Grants braucht, gelingt tag-basiert mit wenigen.

**3 — LF-Tags → Data Filters.** Wo Tags allein nicht ausreichen, praezisieren
Datenfilter: ein **Zeilenfilter** auf die Region, ein **Spaltenfilter**, der PII
ausschliesst. Beides kombiniert ergibt **Zellenebene** — die feinste Stufe. Der
Filter wirkt **vor der Rueckgabe**: Nicht berechtigte Zeilen und Spalten
erreichen die Abfrage gar nicht erst.

**4 — Lake Formation → Athena.** Stellt ein Analyst eine SQL-Abfrage, prueft
Lake Formation die Berechtigung und wendet die Filter an. Der Analyst sieht ein
Ergebnis, das aussieht wie eine eigene Tabelle — es ist aber dieselbe Datei in S3.

**5 — Lake Formation → Redshift Spectrum.** Dieselben Regeln gelten hier ohne
zweite Konfiguration, ebenso fuer EMR und Glue ETL. Das ist der eigentliche
Gewinn gegenueber engine-spezifischen Loesungen: **eine Quelle der Wahrheit fuer
Rechte**, nicht eine pro Werkzeug.

**6 — Abrechnung und Analytics erhalten ihre Sicht.** Die Abrechnung bekommt
alle Spalten, aber nur Zeilen der Region Sued. Analytics bekommt alle Regionen,
aber ohne die PII-Spalten. Zwei Teams, eine Tabelle, keine Kopie.

**7 — Revision erhaelt die volle Sicht.** Ein eigener Grant ohne Filter. Auch
das laeuft ueber dieselbe Tabelle — die Vollsicht ist eine Berechtigung, kein
zweiter Datenbestand.

## Pruefungs-Kernsatz

**Wenn dieselben Zeilen- und Spaltenrechte fuer mehrere Analytics-Engines gelten
sollen, ohne den Datensatz zu duplizieren, ist die Antwort Lake Formation — und
sie wirkt erst, wenn `IAMAllowedPrincipals` entfernt ist.**

## Abgrenzungen

**58 ↔ 53 (Athena/Glue/S3).** Athena fuehrt die Abfrage aus, Lake Formation
entscheidet, was sie sehen darf. Wichtige Nebenwirkung fuer die Pruefung: Sobald
feingranulare Rechte auf Zeilen- oder Spaltenebene im Spiel sind, ist
**Athena Query Result Reuse ausgeschlossen** — ein zwischengespeichertes Ergebnis
koennte sonst an einen Nutzer mit anderen Rechten geraten.

**58 ↔ 56 (QuickSight RLS).** Lake Formation filtert **an der Quelle** und gilt
fuer **authentifizierte Principals** ueber alle Engines hinweg. QuickSight-RLS
filtert **im Dataset** und ist bei **anonymem Embedding** der einzige Weg, weil
dort kein Principal existiert. Fragt das Szenario nach mehreren Engines, ist es
Lake Formation; fragt es nach eingebetteten Dashboards fuer Nutzer ohne
AWS-Login, ist es QuickSight-RLS.

**58 ↔ IAM allein.** IAM-Policies koennen Buckets und Praefixe freigeben oder
sperren — sie koennen **keine Spalten ausblenden und keine Zeilen filtern**.
Sobald "column-level" oder "row-level" im Szenario steht, ist eine reine
IAM-Antwort falsch.

**58 ↔ 57 (Glue ETL).** Der naheliegende, aber teure Umweg: drei transformierte
Kopien per ETL-Job erzeugen. Genau das soll das Szenario abschaffen. Steht im
Text "ohne den Datensatz zu duplizieren", ist eine ETL-Antwort aussortierbar.

## Klassiker-Fallen

**Falle 1 — `IAMAllowedPrincipals` nicht entfernt.** Zur Rueckwaertskompatibilitaet
haelt Lake Formation auf bestehenden Katalog-Ressourcen die Gruppe
`IAMAllowedPrincipals` mit Super-Berechtigung. Solange das so bleibt,
**entscheidet IAM allein und die feingranularen Regeln greifen nicht**. In der
Praxis ist das der haeufigste Grund fuer "Lake Formation eingerichtet, aber alle
sehen weiterhin alles". Der geordnete Uebergang heisst **Hybrid Access Mode**:
ausgewaehlte Principals nutzen bereits die LF-Autorisierung, der Rest laeuft
weiter ueber IAM.

**Falle 2 — S3-Rechte beim Nutzer belassen.** Wer dem Analysten weiterhin
`s3:GetObject` auf den Rohpfad gibt, kann die Datei **herunterladen oder per S3
Select lesen** — komplett an Lake Formation vorbei, inklusive der ausgeblendeten
Spalten. Die Filterung wirkt nur auf dem Abfrageweg. Deshalb steht auf der Karte
"S3-Rechte entziehen!" in der S3-Box.

**Falle 3 — LF-Tags mit IAM-Tags verwechseln.** LF-Tags sind **nicht**
austauschbar mit IAM-Tags oder S3-Objekt-Tags. Sie werden separat in Lake
Formation angelegt und verwaltet; IAM-Tags dienen IAM-Policies, LF-Tags den
Lake-Formation-Berechtigungen. Antworten, die eine IAM-Tag-Policy fuer
Spaltenrechte vorschlagen, sind falsch.

**Falle 4 — Governed Tables vorschlagen.** Aelteres Kursmaterial nennt Governed
Tables als Lake-Formation-Kernfeature, oft direkt neben Cell-Level Security,
weil beides gemeinsam GA ging. **Governed Tables sind seit dem 31.12.2024
abgeschaltet, Cell-Level Security ist geblieben.** Wer die beiden Dinge im
Gedaechtnis gekoppelt hat, waehlt hier eine Option, die es nicht mehr gibt.

## Faktencheck — Divergenzen zu aelterem Kursmaterial

**(1) Governed Tables wurden zum 31.12.2024 eingestellt.** AWS beendete den
Support zugunsten offener Transaktionsformate — Apache Iceberg, Apache Hudi und
Linux Foundation Delta Lake —, weil Kunden diese bevorzugen und sie
ACID-Transaktionen, Compaction und Time Travel ohnehin mitbringen. Nach dem
31.12.2024 sind keine neuen Transaktionen, keine Schreibvorgaenge und keine
Athena-Abfragen auf Governed Tables mehr moeglich; ab dem 17.02.2025 scheitern
die zugehoerigen APIs. Der von AWS genannte Migrationsweg ist ein
CTAS-Statement nach Iceberg.
**Fuer Merve die wichtigste Divergenz dieser Karte**, weil Governed Tables und
Cell-Level Security 2021 gemeinsam allgemein verfuegbar wurden und in
Kursmaterial fast immer zusammen auftreten. Geblieben ist nur die
Sicherheitsfunktion.
*Quelle: AWS Big Data Blog, "Deprecation of Lake Formation's Governed Tables
Feature", Oktober 2024; AWS News Blog zur GA von Cell-Level Security und
Governed Tables, November 2021.*

**(2) Fuenf Ebenen, nicht zwei.** Lake Formation kontrolliert auf **Datenbank-,
Tabellen-, Spalten-, Zeilen- und Zellenebene**. Aeltere Kurse nennen haeufig nur
Spalten- und Zeilenebene. Durchgesetzt werden die Regeln in Athena, Redshift
Spectrum, EMR fuer Apache Spark, Glue ETL und QuickSight.
*Quelle: AWS-Dokumentation, "What is AWS Lake Formation?".*

**(3) LF-TBAC ist die ausdrueckliche AWS-Empfehlung bei vielen Objekten**, nicht
bloss eine von zwei gleichwertigen Optionen. Die Doku nennt sie die empfohlene
Methode, sobald eine grosse Zahl von Katalog-Objekten im Spiel ist, und
unterstuetzt sie auch fuer foederierte Kataloge von S3 Tables, Redshift und
externen Quellen wie DynamoDB, SQL Server und Snowflake.
*Quelle: AWS-Dokumentation, "Lake Formation tag-based access control".*

**(4) Hybrid Access Mode als Migrationspfad.** Beim Registrieren von
S3-Standorten koennen ausgewaehlte Principals auf die LF-Autorisierung
umgestellt werden, waehrend andere weiter ueber IAM zugreifen. Das entschaerft
genau das Risiko aus Falle 1 — die Umstellung muss nicht auf einen Schlag
erfolgen. In aelterem Material fehlt dieser Modus.
*Quelle: AWS-Dokumentation, "What is AWS Lake Formation?".*

**(5) FGAC gilt inzwischen auch fuer offene Tabellenformate und mehr Engines.**
Seit November 2022 wirken die Regeln in Athena fuer alle unterstuetzten Datei-
und Tabellenformate einschliesslich Iceberg, Hudi und Hive (Athena Engine v3
vorausgesetzt). Seit November 2023 gilt FGAC fuer OTF-Tabellen auf EMR auf EC2,
seit Juli 2024 auch fuer EMR Serverless.
*Quellen: AWS What's New, 14.11.2022, 17.11.2023 und 31.07.2024.*

**(6) Seit Glue 5.0 gibt es zusaetzlich Full Table Access (FTA).** Wer nur
Rechte auf Tabellenebene braucht, muss den FGAC-Modus nicht einschalten — das
spart System-Driver und System-Executors und damit Kosten. Zusaetzlich
unterstuetzt FTA **auch Schreiboperationen** (CREATE, ALTER, DELETE, UPDATE,
MERGE INTO), waehrend der FGAC-Modus auf Lesen beschraenkt ist. FGAC verlangt
den Parameter `--enable-lakeformation-fine-grained-access` und mindestens vier
Worker.
*Quellen: AWS Big Data Blog, "Enforce table level access control on data lake
tables using AWS Glue 5.0 with AWS Lake Formation", Juni 2025; AWS-Dokumentation
"Migrating AWS Glue for Spark jobs to AWS Glue version 5.0".*

## Nicht bestaetigt

- Ob und wie Lake-Formation-Berechtigungen bis in **QuickSight** durchgreifen,
  liess sich in der AWS-Doku nicht eindeutig klaeren. Die Doku listet QuickSight
  unter den Engines, in denen LF-Rechte durchgesetzt werden; die auffindbaren
  Beschreibungen zum genauen Zusammenspiel mit QuickSight-RLS stammen jedoch aus
  einer generativ erzeugten re:Post-Antwort. Auf der Karte steht deshalb nur die
  gesicherte Aussage zu Athena und Redshift Spectrum. Siehe auch den
  entsprechenden Punkt in der `.md` von Karte 56.
- Die genaue Formulierung, dass LF-Tags "17 Grants" ersetzen, stammt aus einem
  Rechenbeispiel der AWS-Doku fuer drei Principals, drei Datenbanken und sieben
  Tabellen. Die Zahl steht auf der Karte als Hinweis auf die Groessenordnung,
  nicht als allgemeine Kennzahl.
- Preise und Limits (Zahl der LF-Tags, Filter je Tabelle) sind bewusst nicht
  genannt — sie aendern sich und sind kein Pruefungsstoff.

## Bewusste Vereinfachungen im Diagramm

- **IAM Identity Center ist nicht als Box gezeichnet.** Die Team-Rollen kommen
  real ueber einen Identitaetsanbieter; im Diagramm stehen nur die drei Teams
  als Ergebnis. Waere die Identitaetsseite gezeichnet, verschoebe sich der
  Schwerpunkt der Karte von Datenrechten zu Foederation — das ist Karte 48.
- **LF-Tags und Data Filters stehen als zwei Boxen nebeneinander.** Real sind
  das zwei Wege zum selben Ziel, die sich ergaenzen: Tags skalieren die
  Rechtevergabe, Filter praezisieren sie auf Zeilen und Spalten. Die Zeichnung
  legt eine strengere Reihenfolge nahe, als es sie gibt.
- **Nur zwei Engines gezeichnet.** Dieselben Regeln gelten ebenso fuer EMR,
  Glue ETL und QuickSight; die Spectrum-Box nennt das in einer Sachzeile, statt
  fuenf Boxen zu zeichnen.
- **Der Vorher-Zustand mit drei Kopien fehlt im Bild.** Er steht nur im
  Szenariotext. Ein durchgestrichener Vorher-Block haette Platz gekostet, den
  die drei Sichten brauchen.
- **Die S3-Box traegt den Warnhinweis "S3-Rechte entziehen!".** Das ist streng
  genommen eine Handlungsanweisung und keine Eigenschaft des Dienstes — bewusst
  gesetzt, weil Falle 2 sonst unsichtbar bliebe.

## Farbkonventionen dieser Karte

| Farbe | Bedeutung auf dieser Karte |
|---|---|
| Gruen `#1B7F5A` | S3 — Datenhaltung |
| Lila `#7B5EA7` | Glue Data Catalog — Metadaten/Register |
| Gold `#9A6700` | Lake-Formation-Bausteine: LF-Tags und Data Filters |
| Orange `#C2410C` | Abfrage-Engines: Athena, Redshift Spectrum |
| Pink `#B03060` | Konsumenten: die drei Teams |
| Zonengrau `#888888` | Rahmen und Beschriftung der Lake-Formation-Zone |
| Gestrichelt `4,4` | Zonenrahmen AWS Lake Formation |

**Anmerkung zu den Doppelbelegungen:** Gold ist auf dieser Karte **neu**
eingefuehrt und ausschliesslich fuer Lake-Formation-Bausteine reserviert — das
war noetig, weil Lila bereits der Data Catalog traegt und die Karte den
Unterschied zwischen Register (Katalog) und Rechtevergabe (Lake Formation) genau
zeigen soll. Orange traegt hier die Abfrage-Engines und ist damit konsistent zu
Karte 56, wo Athena ebenfalls orange war — **nicht** zu Karte 57, wo Athena gruen
als Nutzniesser gezeichnet wurde. Die auf Karte 57 offengelegte Athena-
Doppelbelegung bleibt damit bestehen und wartet auf eine Entscheidung; diese
Karte hat sie nicht aufgeloest, sondern nur nicht verschaerft.
