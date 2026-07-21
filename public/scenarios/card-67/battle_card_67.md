---
nr: 67
title: "SageMaker Training & Real-time Endpoints — eigenes Modell trainieren und skalierbar betreiben"
services:
  - Amazon SageMaker AI (Model Training)
  - Amazon SageMaker AI (Real-time Inference Endpoints)
  - Application Auto Scaling
  - Amazon S3
  - Amazon SageMaker Model Monitor (Randhinweis, Neukunden-Stopp)
  - Amazon SageMaker Canvas / AutoML (verworfen)
domains:
  - D3
signalwords:
  - "custom training code / own container"
  - "bring your own model"
  - "real-time inference at scale"
  - "traffic spikes / variable load"
  - "scale the endpoint automatically"
  - "InvocationsPerInstance"
assets:
  - battle_card_67.svg
  - battle_card_67.png
  - battle_card_67.pdf
status_note: |
  qc.py: 0 Befunde im ERSTEN Lauf.
  Gemeldet: 10 Boxen, 59 Texte, 19 Segmente, 7 Badges, 1 X-Kreis.
  Segment-Aufschlüsselung nach R5: 5 Marker in <defs> erzeugen 10
  Phantom-Segmente -> 19 - 10 = 9 echte Segmente (7 Pfeile + 2 X-Striche).
  Badge-Zahl 7 = Ablaufschritte 1-7. Zehnte "Box" ist die gestrichelte
  Model-Monitor-Leiste; sie trägt Text und ist deshalb als echte Box
  geführt, nicht als Zone.

  Korrekturrunden — ALLE VOR dem Zeichnen im Geometrieplan gefunden:
  (1) 2 R16-Befunde: Label 'Model anlegen' (110,1 px) ragte über die
      Kanten BEIDER Nachbarboxen (art und cfg), weil der Korridor nur
      90 px misst. Behoben durch Kürzung auf 'anlegen' (60,3 px).
      Dieselbe Ursachenklasse wie auf Karte 66 — Korridorbreite ist die
      harte Schranke für Labellänge, nicht die Lesbarkeit.
  (2) 1 Footer-Abstandsbefund: Model-Monitor-Leiste stand bei y=760 mit
      nur 12,8 px Luft zum Footer (Mindestmaß 20 px, Lehre aus K63).
      Behoben durch Verlagerung auf y=744 und Verschiebung nach x=620;
      die verworfen-Labels wanderten dafür auf y=692/712 unter die
      Canvas-Box.
  (3) Footer-Variante 1 mit 1.468,0 px über dem Stil-Guide-Maß (~1.420).
      Drei Varianten gemessen, Variante 2 mit 1.263,6 px genommen.

  NACH dem Zeichnen geändert und nach R6 NEU GEMESSEN:
  'InvocationsPerInstance' passte nicht in die 160 px schmale
  Auto-Scaling-Box und wurde beim Zeichnen zu 'InvocationsPerInst.'
  gekürzt. Nachmessung: 123,2 px bei Boxinnenmaß 144 -> Reserve 20,8 px,
  zentriert 1418,4..1541,6 innerhalb 1408..1552. Knapp über der Schwelle,
  aber sauber. Der volle Begriff steht im Footer.

  Render-Sanity: 12 Freizonen aus der Elementgeometrie abgeleitet
  (41 belegte Rechtecke automatisch eingesammelt).
  Planvorhersage 0 Zonenbefunde — PNG 0 Zonenbefunde. Übereinstimmung.
  KEINE Zone nach dem Rendern nachgeschnitten.

  R13 Schwarz-Prüfung: 0 px reines (0,0,0). Merksatz-y = 863 AUS DEM SVG
  gelesen; im Band y 843..871 ebenfalls 0 px.
  R18 Titelband-Kanaldivergenz (y 38..104, x 60..1500): 0 px.
  R12-Gegencheck: NULL <path> mit stroke — alle 9 Verbindungen als <line>.
  Palettenfarben im PNG: Quelle 7.218 px · Compute 10.518 px ·
  Storage 4.792 px · Governance 11.257 px · Verworfen 3.691 px.
  Footer gemessen: 1.263,6 px. Model-Monitor-Leiste: 618,7 px in 654 px.

  Sichtprüfung: VERSUCHT, FEHLGESCHLAGEN. Der Viewer gab lediglich einen
  leeren Bildplatzhalter ohne lesbaren Inhalt zurück. Sechster
  Fehlschlag in Folge (fünf in Batch 13, Karte 66, Karte 67).
  Die Karte ist RECHNERISCH GEPRÜFT, NICHT GESEHEN.
---

# Battle Card 67 — SageMaker Training & Real-time Endpoints

## Szenario

Ein Versicherer hat ein Data-Science-Team mit **eigenem Trainingscode**: ein
PyTorch-Modell zur Schadensbewertung, das auf einer selbst entwickelten
Feature-Logik aufsetzt. Trainingsdaten liegen in S3. Das Modell soll aus der
Schadensmeldungs-Anwendung heraus in Echtzeit aufgerufen werden — Lastspitzen
morgens, nachts fast keine Anfragen.

Canvas kommt nicht in Frage: Das Team hat eigenen Code und ein eigenes
Framework, kein AutoML-Problem.

## Ablauf

**1 — Trainingsdaten in S3 lesen.**
Der Training Job bekommt den S3-Pfad als Input-Channel.

**2 — Training Job mit eigenem Container.**
Das Team bringt seinen PyTorch-Code mit. SageMaker stellt die
Trainingsinstanz **nur für die Laufzeit des Jobs** bereit und fährt sie danach
wieder ab. Das ist der ökonomische Kernpunkt gegenüber einer dauerhaft
laufenden EC2-Instanz.

**3 — Modellartefakte in S3, dann Model anlegen.**
Der Job schreibt `model.tar.gz` nach S3. Daraus entsteht ein
SageMaker-Model-Objekt — die Klammer aus Artefakt-Pfad und Inferenz-Container.

**4 — Endpoint Config erzeugt den Endpoint.**
Die Config legt Instanztyp und Initial Instance Count fest. **Hier fällt die
Dimensionierungsentscheidung, nicht beim Training.** Wer beim Training eine
große GPU-Instanz nimmt, zahlt für Stunden; wer beim Endpoint falsch
dimensioniert, zahlt dauerhaft oder liefert zu langsam.

**5 — Die Anwendung ruft den Endpoint per HTTPS auf.**
Harte Grenzen: **Payload maximal 6 MB, Timeout 60 Sekunden.** Beides ist
prüfungsrelevant, weil es die Abgrenzung zu Asynchronous Inference und Batch
Transform trägt.

**6 — Auto Scaling regelt über Target Tracking.**
Die empfohlene Metrik ist `InvocationsPerInstance`. Man setzt einen Zielwert
(etwa 70 Invocations je Instanz), Application Auto Scaling fährt Instanzen hoch
und runter. AWS empfiehlt Lasttests, um den Zielwert zu bestimmen — er ist
keine Konstante, sondern hängt an den Latenzanforderungen.

**7 — Verworfen: Canvas / AutoML.**
Fachlich möglich, aber das Team hat eigenen Trainingscode. Canvas ist der
No-Code-Weg für Analysten (siehe Karte 66); wer ein eigenes Framework und eine
eigene Feature-Logik mitbringt, braucht den Training Job.

## Randhinweis auf der Karte: Model Monitor

Die gestrichelte Leiste unten ist **kein Schritt im Ablauf**, sondern eine
Prüfungsfalle. Die Lehrbuchantwort auf "wie merke ich, dass mein Modell in
Produktion driftet" lautet SageMaker Model Monitor. Genau dieses Feature ist
**ab dem 30.07.2026 für Neukunden geschlossen**.

Wichtig für die Einordnung: Das betrifft **nicht** die Kette dieser Karte.
Training, Inference/Endpoints, Studio, Canvas und Pipelines laufen unverändert
weiter. Betroffen sind Model Monitor, Clarify, Debugger, Profiler, Ground
Truth, Augmented AI (A2I), Geospatial, Role Manager, Mechanical Turk und
Studio Lab.

## Prüfungs-Kernsatz

**Training Job = Rechenzeit auf Abruf. Endpoint = Dauerbetrieb, kostet auch
ohne Last.**

## Abgrenzungen

- **Canvas ↔ Training Job (Karte 66 ↔ 67):** Canvas ist No-Code über AutoML,
  der Training Job ist eigener Code im eigenen Container. Beide enden auf
  demselben Endpoint-Typ — der Unterschied liegt davor, nicht dahinter.
- **Real-time ↔ Serverless Inference:** Real-time läuft dauerhaft und kostet
  auch bei null Anfragen. Serverless skaliert auf null, hat aber Cold Starts.
  Ein Szenario mit "nachts fast keine Last" ist ein Serverless-Kandidat —
  hier gewinnt Real-time, weil morgens niedrige Latenz gefordert ist.
- **Real-time ↔ Asynchronous Inference:** Async ist für große Payloads und
  lange Verarbeitungszeiten. Ein Szenario, das Payloads über 6 MB oder
  Verarbeitung über 60 Sekunden nennt, kann kein Real-time-Endpoint sein.
- **Real-time ↔ Batch Transform:** Batch verarbeitet einen ganzen Datensatz
  ohne stehenden Endpoint. Signalwort ist "einmal nachts über alle Fälle
  laufen lassen", nicht "in Echtzeit beim Anlegen des Schadens".
- **Single-Model ↔ Multi-Model Endpoint:** MME hostet viele Modelle auf einer
  Instanzflotte. Sinnvoll bei vielen ähnlich großen Modellen mit ähnlicher
  Latenz; bei stark abweichenden TPS- oder Latenzanforderungen empfiehlt AWS
  dedizierte Endpoints.

## Klassiker-Fallen

1. **Kosten dem Training zuschreiben.** Der Training Job ist ein
   Kostenpunkt auf Zeit. Der Endpoint ist der Dauerläufer. Szenarien, die
   nach unerwartet hohen ML-Kosten fragen, meinen fast immer den Endpoint.
2. **6 MB / 60 s übersehen.** Diese beiden Zahlen entscheiden die Frage
   Real-time vs. Async in vielen Prüfungsfragen.
3. **Auto Scaling mit CPU-Metrik.** Möglich, aber AWS empfiehlt für Endpoints
   ausdrücklich `InvocationsPerInstance`. Wer nach der "empfohlenen" Metrik
   gefragt wird, antwortet nicht mit CPUUtilization.
4. **Eine Instanz je Endpoint.** AWS empfiehlt für Produktions-Endpoints
   mehrere Instanzen, verteilt über AZs; bei VPC-Anbindung mindestens zwei
   Subnetze in verschiedenen AZs. Ein Szenario mit HA-Anforderung und einer
   einzelnen Instanz ist eine Falle.
5. **Model Monitor als selbstverständliche Antwort.** Ab 30.07.2026 nicht mehr
   für Neukunden verfügbar.

## Faktencheck — Divergenzen zu älterem Kursmaterial

- **Zehn SageMaker-AI-Features werden zum 30.07.2026 für Neukunden
  geschlossen:** Mechanical Turk, Ground Truth, Augmented AI (A2I), Studio Lab,
  Model Monitor, Clarify, Debugger, Role Manager, Geospatial und Profiler. Wer
  sie nutzen will, muss sich vorher registrieren.
  *Quelle: AWS, Amazon SageMaker AI Features (Hinweisbanner).*
- **Model Monitor im Wortlaut:** Neukundenzugang endet zum 30.07.2026;
  Bestandskunden nutzen den Dienst normal weiter; AWS investiert weiter in
  Security und Verfügbarkeit, plant aber keine neuen Features.
  *Quelle: AWS-Doku, "Data and model quality monitoring with Amazon SageMaker
  Model Monitor".*
- **SageMaker Ground Truth Plus ist zum 30.06.2026 bereits eingestellt** —
  nicht nur geschlossen. Das ist eine andere Kategorie als der Wartungsmodus.
  *Quelle: AWS, Amazon SageMaker AI Features (Hinweisbanner).*
- **Die Kern-Services sind nicht betroffen.** Training, Inference, Studio und
  Canvas laufen unverändert.
  *Quelle: AWS, Amazon SageMaker AI Features: der Hinweis endet ausdrücklich
  mit der Feststellung, dass die Verfügbarkeit anderer SageMaker-AI-Features
  unberührt bleibt.*
- **Payload-Grenze 6 MB und Timeout 60 s für Real-time Endpoints.**
  *Quelle: AWS-Doku zu Real-time Inference / Endpoint-Typen.*
- **`InvocationsPerInstance` ist die für Endpoints empfohlene
  Target-Tracking-Metrik**; SageMaker-Endpoint-Metriken stehen in
  Minutengranularität zur Verfügung. AWS empfiehlt Lasttests zur Bestimmung
  des Zielwerts.
  *Quelle: AWS-Doku, "Set Auto Scaling Policies" und "Auto scaling policy
  overview".*
- **Mehrere Instanzen je Produktions-Endpoint, verteilt über AZs**; bei VPC
  mindestens zwei Subnetze in verschiedenen AZs.
  *Quelle: AWS Machine Learning Blog, "Configuring autoscaling inference
  endpoints in Amazon SageMaker" (aktualisiert August 2025).*

## Korrektur einer Aussage aus der Karte-66-Sitzung

In der Sitzung zu Karte 66 hatte ich behauptet, die SageMaker-Features gingen
"mit Announcement Date 30.06.2026" in den Wartungsmodus und das
Batch-Dokument mit seinem Datum 30.07.2026 sei falsch. **Das war meine
Fehldeutung einer Tabellenspalte.** Beide Daten sind korrekt und bezeichnen
Verschiedenes:

- **30.06.2026** = Tag der Ankündigung (Spalte "Announcement Date" in der
  Maintenance-Liste der AWS General Reference)
- **30.07.2026** = Stichtag, ab dem keine Neukunden mehr onboarden können

Das Batch-Dokument hatte recht. Für Karte 66 hatte die Verwechslung keine
Auswirkung, weil dort Amazon Forecast mit dem 29.07.2024 behandelt wird.

## Nicht bestätigt

- **Ein Enddatum für Model Monitor.** Es gibt keines. "Für Neukunden
  geschlossen" ist nicht "wird abgeschaltet" — dieselbe Unterscheidung wie
  bei Amazon Forecast auf Karte 66.
- **Der genaue empfohlene Zielwert für `InvocationsPerInstance`.** Die
  AWS-Doku nennt 70 als Beispielwert in einer Beispielkonfiguration, nicht als
  Empfehlung. Auf der Karte steht deshalb keine Zahl.
- **Ob Profiler in allen AWS-Quellen einheitlich geführt wird.** Die
  Feature-Seite nennt ihn, das Batch-Start-Dokument nicht. Auf der Karte steht
  keine Aufzählung der zehn Features, nur Model Monitor als konkretes Beispiel.

## Bewusste Vereinfachungen im Diagramm

- **Das Model-Objekt ist nicht als eigene Box gezeichnet.** Zwischen Artefakt
  und Endpoint Config liegt formal noch `CreateModel`. Pfeil 3 trägt die
  Beschriftung "anlegen" und deckt diesen Schritt ab; eine eigene Box hätte
  die Karte überladen, ohne Prüfungswissen zu transportieren.
- **Pfeil 5 zeigt vom Endpoint zur Anwendung**, obwohl der Request von der
  Anwendung ausgeht. Gezeichnet ist die Antwort, weil die Karte den Datenfluss
  des Modells erklärt, nicht den Aufrufweg.
- **Auto Scaling ist als Box neben dem Endpoint gezeichnet**, obwohl
  Application Auto Scaling ein eigener Service ist, der von außen auf den
  Endpoint wirkt. Der Pfeil "regelt" bildet das ab.
- **Der Trainings-Container und der Inferenz-Container sind nicht getrennt.**
  In der Praxis können das zwei verschiedene Images sein.

## Farbkonventionen dieser Karte

| Knoten | Rolle | Begründung |
|---|---|---|
| Trainingsdaten S3 | **Quelle** (Blau) | Einstieg der Daten in den Fluss |
| Training Job | **Compute** (Orange) | Rechnet, Instanz auf Zeit |
| Modellartefakte | **Storage** (Grün) | Liegt in S3 und bleibt liegen |
| Endpoint Config | **Governance** (Gold) | Konfiguration, rechnet nicht |
| Real-time Endpoint | **Compute** (Orange) | Rechnet bei jedem Aufruf |
| Schadens-Anwendung | **Quelle** (Blau) | Origin des Requests |
| Auto Scaling | **Governance** (Gold) | Regelt, rechnet nicht |
| Model Monitor | **Governance** (Gold), gestrichelt | Überwachung; gestrichelt, weil kein Ablaufschritt |
| Canvas / AutoML | **Compute-Rand** (Orange), verworfen über X | Rollenfarbe bleibt, abgelehnt wird über X und roten Pfad |

**Präzedenzfall:** Endpoint Config ist **Governance**, nicht Compute — sie
beschreibt, womit gerechnet wird, rechnet aber selbst nicht. Analog zu
Step Functions auf Karte 62 (orchestriert, rechnet nicht) und Dataset Group
auf Karte 65 (Container und Konfiguration).

**Zweiter Präzedenzfall:** Ein Pfeil kann die Farbe seines **Ausgangsknotens**
tragen, auch wenn der Zielknoten eine andere Rolle hat — Pfeil 3 ist grün
(von Modellartefakte kommend), Pfeil 4 gold (von Endpoint Config kommend).
Das hält den Blickfluss an die Rollen gebunden statt an die Richtung.
