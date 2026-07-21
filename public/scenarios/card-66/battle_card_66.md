---
nr: 66
title: "SageMaker Canvas (Time Series Forecasting) — Absatzprognose für Filial-Nachschub"
services:
  - Amazon SageMaker Canvas
  - Amazon SageMaker AI (AutoML / Autopilot)
  - Amazon S3
  - Amazon Forecast (verworfen)
domains:
  - D3
signalwords:
  - "no-code / low-code machine learning"
  - "time series forecasting"
  - "demand forecasting for replenishment"
  - "no ML expertise on the team"
  - "real-time inference endpoint"
  - "closed to new customers"
assets:
  - battle_card_66.svg
  - battle_card_66.png
  - battle_card_66.pdf
status_note: |
  qc.py: 0 Befunde im ERSTEN Lauf.
  Gemeldet: 9 Boxen, 51 Texte, 14 Segmente, 6 Badges, 1 X-Kreis.
  Segment-Aufschlüsselung nach R5: 3 Marker in <defs> erzeugen 6
  Phantom-Segmente -> 14 - 6 = 8 echte Segmente (6 Pfeile + 2 X-Striche).
  Badge-Zahl 6 = Ablaufschritte 1-6. Der X-Kreis (weiß gefüllt, roter Rand)
  ist nach R6 kein Badge und fällt korrekt aus Prüfung (d) heraus.

  Korrekturrunden — ALLE VOR dem Zeichnen im Geometrieplan gefunden:
  (1) Fassung 1: vier Boxtitel zu breit bzw. unter 20 px Reserve
      ('Canvas Data Flow' 13,3 · 'Real-time Endpoint' -4,0 ·
      'Warenwirtschaft' -1,7 · 'SageMaker Domain' -5,9). Ursache: Boxbreite
      250 gegen 22-px-Bold-Titel. Behoben durch Verbreiterung auf 280.
  (2) Fassung 2: 7 R16-Befunde — jedes Korridor-Label ragte über die
      Kanten BEIDER Nachbarboxen. Ursache strukturell: Korridore nur 30 px
      breit, Labels 69-73 px. R17 (Label über das Segment) reicht bei
      30 px Korridor nicht aus. Behoben durch Korridorbreite 90 px
      (Boxen bei x=40/380/720/1060, je 250 breit).
      Zusätzlich 1 (e)-Befund: 'für Neukunden geschlossen' überlappte den
      X-Kreis. Behoben durch Verlagerung unter die Forecast-Box (y=770/790).
  (3) Fassung 3: 2 Titelbefunde verblieben ('Canvas Data Flow',
      'Real-time Endpoint'). Behoben durch ZWEIZEILIGE Titel statt
      Kürzung — der Fachbegriff bleibt vollständig lesbar.
      1 Zonenbefund: Z4 war gegen die Mittelkoordinate statt hinter das
      gemessene Labelende geschnitten (Label 'Prognose' endet x=1274,0).
      Zone auf x=1280..1310 nachgezogen (R15).
  NACH dem Zeichnen: keine Korrektur nötig.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie abgeleitet
  (36 belegte Rechtecke automatisch eingesammelt: Boxen inkl. stroke/2,
  Segmente inkl. stroke/2, Marker x/y_ende ± 15 nach R14, Badges cx/cy ± 15,
  X-Kreis r + stroke/2, alle PIL-gemessenen Labelgrenzen, Footer, Titelband).
  Planvorhersage 0 Zonenbefunde — PNG 0 Zonenbefunde. Übereinstimmung wie
  auf Karte 65. KEINE Zone musste nach dem Rendern nachgeschnitten werden.

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 855 AUS DEM SVG
  gelesen (nicht angenommen); im Band y 835..863 ebenfalls 0 px.
  R18 Titelband-Kanaldivergenz (y 38..104, x 60..1500): 0 px. Der
  Gray-AA-Monkey-Patch auf cairocffi.Context greift.
  R12-Gegencheck: NULL <path> mit stroke — alle 8 Verbindungen als <line>.
  Zielzustand erreicht, der Fehler kann strukturell nicht auftreten.
  Palettenfarben im PNG nachweisbar: Quelle 8.238 px · Compute 16.957 px ·
  Storage 2.149 px · Governance 2.329 px · Verworfen 3.618 px.
  Footer von Hand mit PIL gemessen: 1.257,0 px (Stil-Guide ~1.420 px).
  Drei Varianten gemessen, die kürzeste tragfähige genommen.

  Sichtprüfung: VERSUCHT, FEHLGESCHLAGEN. Der Viewer gab ein Bildobjekt
  ohne für Claude lesbaren Inhalt zurück — dasselbe Muster wie fünfmal von
  fünf in Batch 13. Die Karte ist RECHNERISCH GEPRÜFT, NICHT GESEHEN.
  Freigabe steht bei Oktay aus.

  Toolchain: CairoSVG 2.9.0, Pillow 12.3.0 (von 12.1.1 hochgezogen und
  verifiziert), cairocffi 1.7.1 mit erzwungenem ANTIALIAS_GRAY.
---

# Battle Card 66 — SageMaker Canvas (Time Series Forecasting)

## Szenario

Eine Handelskette mit 180 Filialen plant den Nachschub bisher nach Bauchgefühl.
Drei Jahre Kassendaten liegen in S3: Verkäufe je Artikel und Filiale,
Preisaktionen und Filialstammdaten. Ein Analystenteam **ohne ML-Erfahrung**
soll wöchentliche Absatzprognosen je Artikel und Filiale erzeugen; die
Warenwirtschaft muss die Zahlen automatisiert abrufen können.

Ein Architekt schlägt Amazon Forecast vor — den Dienst, der genau dafür
gebaut wurde. Der Weg ist versperrt: **Amazon Forecast ist seit dem
29.07.2024 für Neukunden geschlossen.**

## Ablauf

**1 — Drei Dateien liegen in S3.**
Verkaufshistorie, Preisaktionen und Filialstammdaten liegen als getrennte
Dateien. Diese Dreiteilung ist kein Zufall: sie entspricht exakt den drei
Datensatztypen, die Amazon Forecast erwartet — target time series (Pflicht),
related time series (optional) und item metadata (optional). Wer aus einem
Kurs kommt, hat die Daten genau so vorbereitet.

**2 — Canvas Data Flow führt sie zu EINEM Dataset zusammen.**
SageMaker Canvas verlangt einen einzigen Datensatz mit Timestamp-Spalte,
Item-ID-Spalte und Zielspalte. Der Data Flow ist eine Drag-and-drop-Oberfläche,
die den Join ohne Code erledigt; alternativ geht das per Python-Skript. **Genau
hier liegt der Migrationsaufwand** — nicht im Modellieren, sondern im
Umbau der Datenablage.

**3 — Canvas AutoML trainiert ein Ensemble und deployt das beste Modell.**
Canvas baut Basismodelle aus mehreren statistischen und Neural-Network-
Algorithmen, bewertet sie und kombiniert die besten zu einem Ensemble. Ein
Leaderboard zeigt die Kandidaten mit ihren Metriken; man kann Algorithmen
gezielt aus- oder abwählen. Feiertagskalender lassen sich per Option
einbinden. Das gewählte Modell wird auf einen Endpoint deployed.

**4 — Die Modellartefakte liegen in S3.**
Canvas legt trainierte Modelle, Datasets und Anwendungsdaten in einem
konfigurierbaren S3-Bucket ab. Der Zugriff darauf ist einer der Gründe, warum
die Execution Role der SageMaker Domain nicht nachträglich zusammengeklickt
werden sollte.

**5 — Die Warenwirtschaft ruft den Real-time Endpoint per HTTPS auf.**
Der Endpoint ist aus der Anwendung mit wenigen Zeilen Code abfragbar. **Das ist
der zweite große Unterschied zu Forecast:** dort musste man erst einen Forecast
erzeugen und ihn anschließend abfragen — zwei Schritte, zwei Objekte. Bei
Canvas ruft man direkt den Endpoint auf, auf dem das Modell liegt.

**6 — Verworfen: Amazon Forecast.**
Fachlich wäre Forecast passend gewesen. Der Zugang für Neukunden ist seit dem
29.07.2024 geschlossen. Bestandskunden nutzen den Dienst normal weiter; AWS
investiert weiter in Security, Verfügbarkeit und Performance, plant aber keine
neuen Features.

## Prüfungs-Kernsatz

**Forecast: drei Datasets, erst erzeugen dann abfragen. Canvas: ein Dataset,
Endpoint aufrufen.**

## Abgrenzungen

- **Canvas ↔ SageMaker Training/Endpoints (Karte 67):** Canvas ist der
  No-Code-Weg über AutoML für Analysten. Karte 67 zeigt den Weg für ein Team,
  das ein *eigenes* Modell mit eigenem Trainingscode braucht. Beide enden auf
  einem SageMaker-Endpoint — der Unterschied liegt davor, nicht dahinter.
- **Canvas-UI ↔ AutoML-API:** derselbe Motor. Die UI ist für Analysten, die
  SageMaker-AutoML-API (Autopilot) für programmatische Nutzung. Ein Szenario,
  das "ohne Code" oder "Analysten ohne ML-Erfahrung" sagt, meint die UI.
- **Forecast ↔ Canvas ist keine Fähigkeitsfrage.** Beide bilden ein Ensemble
  aus statistischen und Neural-Network-Algorithmen. Die Entscheidung fällt über
  die Verfügbarkeit und über die Datenaufbereitung, nicht über die
  Prognosequalität.
- **Wartungsmodus ≠ Abschaltung.** Anders als bei Kinesis Data Analytics for
  SQL (abgeschaltet am 27.01.2026, siehe Karte 59) gibt es für Forecast
  **kein angekündigtes Abschaltdatum**. Wer den Dienst hat, behält ihn.

## Klassiker-Fallen

1. **"Amazon Forecast" als Antwortoption bei einem Neubau-Szenario.** In
   Kursmaterial von vor Mitte 2024 ist Forecast die Standardantwort auf
   "demand forecasting". Bei einem Szenario, das ein *neues* Projekt
   beschreibt, ist der Dienst nicht mehr verfügbar. Vorsicht in beide
   Richtungen: bei einem Bestandskunden-Szenario bleibt Forecast korrekt.
2. **Die Zahl der Datasets.** "Wir haben target time series, related time
   series und item metadata" ist ein Forecast-Signal. Wer nach Canvas
   migriert, muss zusammenführen — das ist eine Aufgabe, kein Automatismus.
3. **Erzeugen-dann-abfragen gegen Endpoint-Aufruf.** Ein Szenario, das
   "die Anwendung soll die Prognose direkt abrufen" sagt, beschreibt einen
   Real-time Endpoint, kein Forecast-Objekt.
4. **Canvas braucht eine SageMaker Domain.** Ohne Domain und Execution Role
   kein Canvas. Das wird in Szenarien gern als "warum schlägt der Zugriff auf
   den S3-Bucket fehl" verpackt.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Amazon Forecast ist seit dem 29.07.2024 für Neukunden geschlossen.**
  Bestandskunden können den Dienst normal weiternutzen; AWS investiert
  weiterhin in Security, Verfügbarkeit und Performance, führt aber keine neuen
  Features ein.
  *Quellen: AWS General Reference, "Services in Maintenance" (Eintrag Amazon
  Forecast, Announcement Date 29.07.2024) · AWS Machine Learning Blog,
  "Transition your Amazon Forecast usage to Amazon SageMaker Canvas",
  29.07.2024.*
- **Der Unterschied in der Datensatzstruktur ist der eigentliche
  Migrationsaufwand.** Forecast nutzt target time series, related time series
  (optional) und item metadata (optional); Canvas verlangt einen einzigen
  Datensatz. AWS stellt dafür ein Workshop-Angebot und ein Jupyter-Notebook
  bereit.
  *Quelle: AWS Machine Learning Blog, ebenda, Abschnitt "Transitioning from
  Forecast to SageMaker Canvas".*
- **Das Aufrufmodell unterscheidet sich.** Forecast verlangt, erst einen
  Forecast zu erzeugen und ihn dann abzufragen. Canvas ruft den Endpoint auf,
  auf dem das Modell deployed ist — per UI oder API, für einen einzelnen
  Datensatz oder als Batch.
  *Quelle: AWS Machine Learning Blog, ebenda, Abschnitt "Model invocation".*
- **Definition des Wartungsmodus.** AWS formuliert für alle Dienste dieser
  Liste einheitlich: kein Onboarding neuer Kunden, Bestandsnutzung läuft
  weiter, Betrieb und Support bleiben, keine Funktionserweiterung.
  *Quelle: AWS General Reference, "Services in Maintenance", Kopftext.*

## Nicht bestätigt

- **Ein Abschaltdatum für Amazon Forecast.** In der AWS-Doku steht keines. Die
  Abwesenheit einer Ankündigung ist ein Argument, kein Beweis — der Dienst
  könnte künftig in die Sunset-Liste wandern. Auf der Karte steht deshalb
  "für Neukunden geschlossen", nicht "wird abgeschaltet".
- **Die Leistungsangaben "bis zu 50 % schnelleres Model Building" und "bis zu
  45 % schnellere Predictions".** AWS nennt sie im Transitions-Blog, sie
  stammen aus AWS-eigenen Benchmarks über nicht näher benannte Datensätze.
  Sie stehen **nicht** auf der Karte — Benchmarkwerte sind kein Prüfungsstoff
  und können sich ändern.
- **Die genaue Zahl der von Canvas verwendeten Algorithmen.** Eine
  AWS-Ankündigung vom 28.06.2024 nennt "bis zu sechs eingebaute Algorithmen",
  die aktuelle Doku-Seite zu Time Series Forecasts nennt keine Zahl. Auf der
  Karte steht deshalb "Ensemble mehrerer Algorithmen" ohne Ziffer.

## Bewusste Vereinfachungen im Diagramm

- **Der Rückfluss vom Endpoint zur Warenwirtschaft ist im Request implizit.**
  Pfeil 5 zeigt in eine Richtung; tatsächlich ist der Endpoint-Aufruf ein
  Request-Response-Paar.
- **Die SageMaker Domain steht ohne Verbindungslinie da.** Sie ist die
  Voraussetzung für Canvas insgesamt, kein Schritt im Datenfluss. Eine Linie
  hätte suggeriert, die Daten liefen durch sie hindurch.
- **Der Data Flow ist als eigener Knoten gezeichnet**, obwohl er Teil der
  Canvas-Anwendung ist. Die Trennung ist didaktisch: sie macht sichtbar, dass
  die Zusammenführung der drei Dateien ein eigener Arbeitsschritt ist.
- **Modellartefakte als eigene Box.** Canvas legt sie in einem konfigurierbaren
  S3-Bucket ab; im Diagramm ist das ein Endpunkt, kein Durchgangsknoten.

## Farbkonventionen dieser Karte

| Knoten | Rolle | Begründung |
|---|---|---|
| Kassendaten S3 | **Quelle** (Blau) | Hier betreten die Daten den erklärten Fluss |
| Canvas Data Flow | **Compute** (Orange) | Transformiert — Join dreier Dateien zu einer |
| Canvas AutoML | **Compute** (Orange) | Trainiert und wertet aus |
| Real-time Endpoint | **Compute** (Orange) | Rechnet die Prognose bei jedem Aufruf |
| Modellartefakte | **Storage** (Grün) | Hier liegen die Modelle und bleiben liegen |
| Warenwirtschaft | **Quelle** (Blau) | Origin des Requests, nicht Ziel des Datenflusses |
| SageMaker Domain | **Governance** (Gold) | Execution Role, Rechte, Konfiguration |
| Amazon Forecast | **Quelle-Rand** (Blau), verworfen über X | Nach Stil-Guide behält die verworfene Alternative ihre Rollenfarbe; abgelehnt wird über X und roten Pfad |

**Präzedenzfall für spätere Karten:** Die Verarbeitungskette ist durchgehend
orange (Data Flow, AutoML, Endpoint). Das ist nach der Rollenkonvention
korrekt und kein Fehler — dieselbe Beobachtung wie auf den Karten 63 und 64.

**Zweite Rollenentscheidung zum Gegenlesen:** Die Warenwirtschaft ist **Quelle**,
nicht Storage, obwohl sie am Ende des Diagramms steht. Begründung: Der Pfeil
zeigt zwar auf sie, aber sie ist der Auslöser des Aufrufs — der Fluss endet
fachlich im Endpoint, nicht in ihr. Nach Stil-Guide entscheidet, welche Rolle
die Karte erklärt.
