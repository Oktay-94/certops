---
nr: 56
title: "Self-Service-BI und eingebettete Haendler-Dashboards mit QuickSight"
services:
  - Amazon QuickSight (Amazon Quick Suite)
  - Amazon Athena
  - Amazon RDS for PostgreSQL
  - Amazon S3
  - AWS Glue Data Catalog
domains:
  - D1
  - D3
signalwords:
  - "self-service business intelligence"
  - "embedded dashboards in a customer portal"
  - "without requiring users to sign in to AWS"
  - "each customer must only see their own data"
  - "minimize per-query cost for frequently accessed dashboards"
  - "no servers to manage"
  - "anonymous embedding"
assets:
  - battle_card_56.svg
  - battle_card_56.png
  - battle_card_56.pdf
status_note: |
  QC (scripts/qc.py): 0 Befunde.
  Gegenzaehlung R5: 10 Boxen gemeldet = 9 fachliche Boxen + 1 Footer-Rect.
  61 Texte. 11 Segmente gemeldet = 8 gezeichnete <path>-Pfeile, aufgeloest in
  11 Teilsegmente (der Glue->Athena-Pfeil hat 3, der RDS->SPICE-Pfeil 2).
  8 Badges, alle randlos und in Linienfarbe gefuellt. Keine weiss gefuellten
  Kreise mit Rand auf dieser Karte (R6 nicht einschlaegig, kein verworfener Pfad).

  Korrekturrunden — alle FUENF vor dem Zeichnen im Geometrieplan gefunden:
  (1) Boxtitel "Amazon RDS PostgreSQL" 281,5 px > 277 px Innenbreite. Geloest
      durch Kuerzung auf "Amazon RDS" (142,8 px); die Engine steht jetzt in der
      ersten Sachzeile "PostgreSQL, Auftraege" — fachlich praeziser als im Titel.
  (2) Zonenlabel "AMAZON QUICK SUITE (ehem. QuickSight)" 426,5 px > 344 px
      Zonenbreite. Geloest durch Zweizeiligkeit: Rahmenlabel "AMAZON QUICK SUITE"
      (224,3 px) plus kursive Zeile "seit 09.10.2025 — ehem. QuickSight". Die
      Umbenennung ist der Kernfund dieser Karte und gehoert sichtbar aufs Diagramm.
  (3) Badge 5 fehlte: das Traegersegment SPICE->Analyse war nicht markiert.
  (4) R16-Ergaenzungspruefung (Labels gegen Badge-Kreise) fand VIER Kollisionen,
      die qc.py strukturell nicht findet: "Crawler / DDL" auf Badge 1,
      "Dataset A" auf Badge 3, "geladen" auf Badge 5, "gefiltert" auf Badge 6.
  (5) Beim Wegruecken der Labels entstanden drei NEUE Kollisionen mit
      Boxaussenkanten (Crawler/DDL in s3, geladen und gefiltert in spice bzw. rls).
      Endgueltig geloest nicht durch weiteres Pixelschieben, sondern durch
      Verschieben der Badges 5 und 6 ans rechte Segmentende (cx 808,5/847,5 -> 900).
      Damit 46 px Luft zum Label und 8,8 px zur Boxkante.
  Nach dem Zeichnen wurden keine Labels mehr verschoben, daher keine erneute
  R16-Runde noetig; die Plangrenzen gingen unveraendert in die Zonendefinition (R15).

  Render-Sanity: 11 Freizonen aus der Elementgeometrie, im ersten Durchgang
  2 belegt. Beide Befunde waren FALSCH GESCHNITTENE ZONEN, nicht Bildfehler:
    - "Korridor S3/Athena oben" reichte bis y=268, Badge 2 (cy=276, r=15) belegt
      aber bereits ab y=261. Nachgeschnitten auf y-Ende 258. Das ist exakt der in
      R7 dokumentierte Wiederholungsfehler "cy ± 15, die Zone darf nicht bis cy
      reichen".
    - "zwischen geladen und gefiltert" begann bei y=470, also auf der Mittellinie
      des Segments SPICE->Analyse (stroke 2,5 -> belegt bis y=471,25).
      Nachgeschnitten auf y-Start 474.
  Nach dem Nachschnitt: 0 belegte Pixel in 11 Freizonen.
  Alle sechs Palettenfarben im PNG nachweisbar (gruen 3306, lila 2264,
  orange 3476, pink 3934, grau 3637, Zonengrau 1602 px).

  Schwarz-Pruefung R13: 3294 dunkle Punkte im Sample, ausnahmslos im Titel
  (y 40..80) und im Footer-Merksatz (y 760..790) — beide laut Stil-Guide #111111.
  0 Punkte ausserhalb. Kein schwarz gefuellter Pfad.

  R12-Gegencheck: 8 <path>-Elemente mit stroke, davon 8 mit fill="none". Erfuellt.
  Die vier Marker-<path> tragen fill und keinen stroke — korrekt, nicht betroffen.

  Footer von Hand gemessen: Merksatz 941,8 px bei 16 px bold (Grenze 1480).
  Zwei Erlaeuterungszeilen darunter bei 15 px.

  Sichtpruefung: VERSUCHT, NICHT GELUNGEN. `view` gab ein Bildobjekt zurueck,
  aber keinen fuer den Chat lesbaren Inhalt — es liess sich daraus nichts ueber
  Textlage oder Kollisionen ableiten. Damit 21. erfolgloser Versuch in Folge (R8).
  Diese Karte ist RECHNERISCH GEPRUEFT, ABER NICHT GESEHEN. Freigabe durch Oktay
  steht aus.
---

# Battle Card 56 — QuickSight, Athena, RDS

## Szenario

Ein mittelstaendischer Fahrradhersteller betreibt seine Auftragsdaten in **Amazon
RDS for PostgreSQL**. Die Verkaufshistorie der letzten sieben Jahre liegt als
Parquet im **S3-Data-Lake** und wird ueber **Athena** abgefragt.

Die Geschaeftsfuehrung fordert Dashboards, die sie **ohne IT-Ticket selbst
filtern** kann. Zusaetzlich sollen **300 Haendler** ihre eigenen Absatzzahlen in
einem **Haendlerportal** sehen — eingebettet, ohne AWS-Login, und **jeder Haendler
ausschliesslich seine eigenen Zeilen**. Das Management-Dashboard wird den ganzen
Tag interaktiv benutzt; die Kosten fuer gescanntes Volumen sollen dabei nicht mit
jedem Klick steigen.

## Ablauf 1–8

**1 — S3 → Glue Data Catalog.** Ein Crawler oder eine DDL-Anweisung registriert
die Parquet-Dateien als Tabelle mit Partitionen. Der Data Catalog ist ein
**Register**: er beschreibt, wo welche Daten liegen und wie sie aufgebaut sind,
speichert die Daten selbst aber nicht. Ohne diesen Schritt weiss Athena nicht,
dass es im Bucket etwas Abfragbares gibt.

**2 — Glue → Athena.** Athena liest das Schema aus dem Katalog und kann damit
SQL auf die S3-Objekte anwenden. Kein Cluster, kein Vorhalten von Kapazitaet:
abgerechnet wird das je Abfrage gescannte Datenvolumen. Genau diese
Abrechnungsform macht den naechsten Schritt zur Kostenfrage.

**3 — Athena → SPICE (Dataset A).** Das Ergebnis der Historienabfrage wird als
Dataset in SPICE importiert, die In-Memory-Engine von QuickSight. Der
entscheidende Effekt: Die Athena-Abfrage laeuft **einmal beim Import und dann
beim geplanten Refresh** — nicht bei jedem Klick eines Managers.

**4 — RDS → SPICE (Dataset B).** Die tagesaktuellen Auftraege kommen direkt aus
der operativen Datenbank ins zweite Dataset. Auch hier gilt der
Entkopplungsgedanke, aus einem anderen Grund: RDS ist eine OLTP-Datenbank fuer
das Tagesgeschaeft. Analytische Dauerlast von dreissig gleichzeitig klickenden
Nutzern gehoert dort nicht hin.

**5 — SPICE → Analyse/Dashboard.** Die Datasets speisen Analysen und Dashboards.
Der geplante Refresh wird nach dem naechtlichen ETL terminiert, damit die Daten
morgens vollstaendig sind. Zwischen zwei Refreshes kostet Interaktion nichts
Zusaetzliches — weder Athena-Scan noch RDS-Last.

**6 — SPICE → Row-Level Security.** Auf dasselbe Dataset werden RLS-Regeln
gelegt. Die Filterung passiert **im Dataset**, nicht in der Visualisierung: Wer
nicht berechtigt ist, bekommt die Zeilen gar nicht erst geliefert. Ein Dashboard
bedient damit alle 300 Haendler, ohne 300 Datasets zu pflegen.

**7 — Analyse → Management.** Die Geschaeftsfuehrung arbeitet als Author direkt
in Quick Suite: eigene Filter, eigene Visuals, kein IT-Ticket. Das ist der
Self-Service-Teil der Anforderung.

**8 — RLS → Haendlerportal.** Das Portal ruft die Embedding-API fuer anonyme
Nutzer und uebergibt dabei **Session-Tags** mit der Haendler-ID. Die tag-basierte
RLS-Regel filtert das Dataset zur Laufzeit auf genau diesen Wert. Der Haendler
sieht ein eingebettetes Dashboard, ohne je einen AWS- oder QuickSight-Login zu
besitzen.

## Pruefungs-Kernsatz

**SPICE trennt den Klick von der Abfrage — und bei anonym eingebetteten
Dashboards filtert ausschliesslich tag-basierte Row-Level Security, und das nur
auf Textfeldern.**

## Abgrenzungen

**56 ↔ 53 (Athena/Glue/S3).** Athena ist die **Query-Engine**, QuickSight die
**Praesentationsschicht**. Beide zusammen ergeben erst das Dashboard. Die
Abgrenzungsfrage in der Pruefung lautet meist nicht "welcher Dienst", sondern
**Direct Query gegen SPICE**: Direct Query heisst, jede Dashboard-Interaktion
loest eine neue Athena-Abfrage aus und kostet gescanntes Volumen. SPICE heisst,
einmal importieren und beliebig oft ansehen. "Management klickt den ganzen Tag"
ist SPICE. "Der Zaehlerstand muss sekundenaktuell sein" ist Direct Query.

**56 ↔ 58 (Lake Formation).** RLS in QuickSight filtert **im Dataset**, Lake
Formation filtert **an der Quelle**. Bei anonymem Embedding existiert kein
Principal, auf den Lake Formation eine Regel anwenden koennte — dort ist
QuickSight-RLS mit Session-Tags der einzige Weg. Sind dagegen alle Nutzer
authentifiziert und sollen die Rechte fuer Athena, Redshift Spectrum und
QuickSight **gemeinsam** gelten, gehoert die Regel nach Lake Formation.

**56 ↔ 60 (Redshift Serverless).** QuickSight ist keine Datenbank und keine
Rechenkapazitaet, sondern die Anzeige davor. Fragt das Szenario nach dem
**Speicher- und Rechenort** anhaltender Warehouse-Last, ist die Antwort Redshift;
fragt es nach dem **Dashboard fuer Menschen**, ist sie QuickSight. Beide koennen
im selben Szenario vorkommen.

## Klassiker-Fallen

**Falle 1 — SPICE gegen Direct Query nach Aktualitaet statt nach Zugriffsmuster
entscheiden.** Die haeufigste Fehlantwort waehlt Direct Query, weil "die Daten
aktuell sein sollen". Das Szenario nennt hier aber ein Kostenkriterium und eine
hohe Interaktionsrate. Sobald ein Dashboard **haeufig angeklickt** wird und die
Quelle **pro Abfrage abrechnet**, ist SPICE die kostenbewusste Antwort; die
Aktualitaet regelt der geplante Refresh.

**Falle 2 — user-based RLS bei anonymem Embedding.** Klingt sauber und ist
falsch: Bei anonymem Embedding gibt es **keinen QuickSight-User**, auf den eine
benutzerbasierte Regel greifen koennte. Die Regel laeuft ins Leere. Richtig sind
tag-basierte Regeln, deren Werte beim Erzeugen der Embed-URL als Session-Tags
uebergeben werden.

**Falle 3 — RLS auf ein numerisches Feld.** Die Haendlernummer als `int` zu
filtern wirkt naheliegend. Row-Level Security arbeitet jedoch nur auf
**Textfeldern** (string, char, varchar) und nicht auf Datums- oder numerischen
Feldern. Die Haendler-ID muss als String modelliert sein. Verwandt: Anomaly
Detection wird auf RLS-Datasets nicht unterstuetzt.

**Falle 4 — Athena und QuickSight verwechseln.** "Serverlos SQL auf S3" ist
Athena. "Dashboard, das ein Fachbereich selbst filtert" ist QuickSight. Antworten,
die QuickSight als Abfrage-Engine oder Athena als Visualisierungswerkzeug
darstellen, sind aussortierbar, ohne den Rest zu lesen.

## Faktencheck — Divergenzen zu aelterem Kursmaterial

**(1) QuickSight heisst seit dem 09.10.2025 Amazon Quick Suite; der BI-Teil
darin heisst "Quick Sight".** Laut AWS Business Intelligence Blog bleiben
Dashboards, Datasets und Analysen unveraendert, ebenso Datenanbindung,
Sicherheitskontrollen, Nutzerrechte und bestehende API-Integrationen; eine
Datenmigration ist nicht noetig. Ab dem 09.10.2025 sehen alle Kunden weltweit die
neue Oberflaeche. Auch bestehende Compliance-Zertifizierungen bleiben gueltig.
Die Nutzerdokumentation liegt inzwischen unter `docs.aws.amazon.com/quick/`.
*Quelle: AWS Business Intelligence Blog, "Reimagine business intelligence: Amazon
QuickSight evolves to Amazon Quick Suite", 09.10.2025; AWS-Dokumentation
docs.aws.amazon.com/quick/latest/userguide/spice.html.*

> **Warum das mehr ist als eine Umbenennung — und was fuer die Pruefung gilt:**
> Bei Amazon Data Firehose (Karte 52) war es ein reiner Namenswechsel. Hier
> kommt eine Produktumklammerung mit neuer Navigation hinzu: die vertrauten
> BI-Funktionen liegen jetzt unter "Quick Sight" innerhalb von Quick Suite,
> daneben stehen neue Bausteine. **Fuer SAA-C03 bleibt "QuickSight" der
> gefragte Begriff** — die Karte fuehrt beide Namen, damit Merve die
> Pruefungsformulierung und die aktuelle Konsole zusammenbringt.

**(2) Embedding-Features, APIs und Integrationen funktionieren unveraendert
weiter.** Wer eine bestehende Einbettung betreibt, muss nichts anpassen. Sichtbar
aendert sich die Optik: neuer Fussleistenhinweis, Farbschema von Blau auf Lila,
neues Logo. Wer das alte Erscheinungsbild braucht, kann es ueber Brand- oder
Theme-Customization erhalten.
*Quelle: AWS Business Intelligence Blog, 09.10.2025.*

**(3) SPICE-Kapazitaet deutlich groesser als in aelteren Kursen.** Am 20.01.2026
hat AWS die Groesse je Dataset von 1 TB auf 2 TB verdoppelt, bei Nutzung der
neuen Data-Preparation-Erfahrung; zugleich wurde die String-Laenge von 2K auf 64K
Unicode-Zeichen erweitert und der unterstuetzte Zeitstempelbereich bis zum Jahr
0001 zurueck ausgedehnt. Zuvor war im Juli 2025 die Zeilengrenze von 1 auf 2
Milliarden Zeilen angehoben worden. Aeltere Kurse nennen haeufig noch die alten
Werte.
*Quellen: AWS What's New, "Amazon Quick Suite launches expanded size, faster
ingestion, and richer data type support for SPICE datasets", 20.01.2026; AWS
What's New, "Amazon QuickSight supports 2B row SPICE dataset", 02.07.2025.*
**Bewusst nicht auf der Karte:** konkrete Groessen- und Zeilenzahlen. Sie aendern
sich und sind kein Pruefungsstoff — gefragt ist das Prinzip Import gegen
Direktabfrage.

**(4) RLS wirkt nur auf Textfeldern.** Row-Level Security funktioniert fuer
string, char, varchar und vergleichbare Typen, nicht fuer Datums- oder
numerische Felder; auf RLS-Datasets wird zudem Anomaly Detection nicht
unterstuetzt. Diese Einschraenkung fehlt in praktisch jedem Kursmaterial und ist
eine saubere Pruefungsfalle.
*Quelle: AWS-Dokumentation, "Using Row-Level Security (RLS) to Restrict Access to
a Dataset", zitiert in AWS re:Post.*

**(5) DENY_ACCESS bei RLS ist Altlast.** Die API-Referenz fuehrt
`PermissionPolicy: DENY_ACCESS` ausdruecklich nur noch aus Gruenden der
Rueckwaertskompatibilitaet; fuer neue RLS-Datasets wird die Option nicht
unterstuetzt. Wer eine aeltere Anleitung folgt, baut ein Muster nach, das fuer
Neuanlagen nicht mehr vorgesehen ist.
*Quelle: AWS API-Referenz, `RowLevelPermissionDataSet`.*

## Nicht bestaetigt

- Ob und wann die Pruefungsziele der SAA-C03 selbst von "QuickSight" auf "Quick
  Suite" umgestellt werden, liess sich nicht belegen. Die Karte fuehrt deshalb
  beide Namen und behandelt "QuickSight" als den weiterhin pruefungsrelevanten
  Begriff.
- Zum Zusammenspiel von Lake-Formation-Berechtigungen und QuickSight-RLS fand
  sich in der AWS-Doku keine eindeutige Aussage darueber, wann Lake-Formation-
  Regeln bis in QuickSight durchgreifen und wann zusaetzlich RLS noetig ist. Die
  auffindbaren Beschreibungen stammen aus einer generativ erzeugten re:Post-
  Antwort und einem Community-Beitrag. Auf der Karte steht deshalb nur die
  gesicherte Aussage: bei **anonymem** Embedding ist tag-basierte RLS noetig,
  weil kein Principal existiert.
- Preise sind bewusst weder auf der Karte noch in dieser Datei genannt. Der Blog
  nennt zwar Betraege fuer Author- und Reader-Rollen, diese aendern sich jedoch
  und sind kein Pruefungsstoff.

## Bewusste Vereinfachungen im Diagramm

- **Der Schritt "Analyse" und "Dashboard" ist zu einer Box zusammengefasst.** In
  Quick Suite sind das getrennte Objekte: die Analyse ist der Arbeitsbereich des
  Authors, das Dashboard die veroeffentlichte, schreibgeschuetzte Fassung fuer
  Leser. Fuer die Kernaussage der Karte spielt die Trennung keine Rolle.
- **Der Embedding-Aufruf ist nicht als eigener Baustein gezeichnet.** Zwischen
  Portal und Dashboard steht real ein Backend, das die Embed-URL fuer anonyme
  Nutzer erzeugt und dabei die Session-Tags setzt; im Diagramm ist das in
  Pfeil 8 zusammengezogen. Die Haendlerportal-Box ist deshalb **gestrichelt** —
  sie liegt ausserhalb von AWS.
- **Der naechtliche ETL-Lauf hat keine eigene Box.** Er wird in der SPICE-Box als
  Sachzeile erwaehnt, weil der Refresh-Zeitpunkt davon abhaengt. Waere er
  gezeichnet, verschoebe sich der Schwerpunkt der Karte von BI zu ETL — das ist
  Thema 57.
- **Nur zwei Datasets.** Eine reale Installation haette mehrere, teils mit
  Dataset-as-a-Source-Verkettung. Zwei genuegen, um den Unterschied zwischen
  Data-Lake-Historie und operativer Datenbank zu zeigen.

## Farbkonventionen dieser Karte

| Farbe | Bedeutung auf dieser Karte |
|---|---|
| Gruen `#1B7F5A` | Datenhaltung: S3, RDS — und die Pfeile, die Daten daraus liefern |
| Lila `#7B5EA7` | Metadaten/Katalog: Glue Data Catalog und die Schema-Pfeile |
| Orange `#C2410C` | Query und Aufbereitung: Athena, SPICE und die Pfeile in die BI-Schicht |
| Pink `#B03060` | BI-Schicht: Analyse/Dashboard, RLS und die Pfeile zu den Konsumenten |
| Grau `#555555` | Konsumenten ausserhalb der BI-Schicht: Management, Haendlerportal |
| Zonengrau `#888888` | Rahmen und Beschriftung der Quick-Suite-Zone |
| Gestrichelt `7,5` | Haendlerportal — extern, ausserhalb von AWS |
| Gestrichelt `4,4` | Zonenrahmen Amazon Quick Suite |

**Anmerkung zu den Doppelbelegungen:** Gruen traegt auf dieser Karte sowohl S3
als auch RDS, weil beide als **Datenquelle** auftreten — die Unterscheidung
Objektspeicher gegen relationale Datenbank leisten die Boxtitel. Orange traegt
Athena und SPICE gemeinsam, weil beide zur **Abfrage-/Aufbereitungsschicht**
gehoeren; der Unterschied zwischen ihnen ist der Kern von Falle 1 und wird im
Text ausgetragen, nicht ueber die Farbe.
