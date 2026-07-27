---
nr: 88
title: "Chaos Engineering mit FIS"
services: ["AWS Fault Injection Service", "Amazon CloudWatch", "Amazon EC2", "Amazon EBS", "Amazon RDS", "Amazon ElastiCache", "AWS IAM"]
domains: ["D2"]
signalwords:
  - "test the resilience of the application"
  - "simulate an Availability Zone failure"
  - "validate that failover actually works"
  - "controlled experiment in a production-like environment"
  - "prove the multi-AZ design"
assets:
  - battle_card_88.svg
  - battle_card_88.png
  - battle_card_88.pdf
status_note: |
  qc.py: 0 Befunde. 6 Boxen (5 Karten-Boxen + Footer-Rect), 25 Texte, 16 Segmente,
  3 Badges, 1 X-Kreis.
  Segmentaufschluesselung (R5): 8 echte Segmente = 3 gerade Kettenpfeile + 3 Segmente
  des roten Bypass + 2 X-Diagonalen; dazu 8 Phantom-Segmente aus 4 Marker-<defs>
  (mblau, mgold, mteal, mrot, je 2).
  Korrekturrunden: 1 Runde, gefunden VOR dem Zeichnen durch precheck.py. Der geplante
  Boxtitel "AZ-a: Power Interruption" war mit 309 px breiter als die zulaessigen 286 px
  der 302-px-Box. Gekuerzt auf "Power Interruption", die AZ-Angabe wanderte in die
  erste Textzeile.
  Render-Sanity: PNG 2400x1350, Titelband-Kanaldivergenz 0.
  R13 (reine Schwarzpixel): 0.
  R12-Gegencheck: 0 Verstoesse.
  R16: 13.0 px, Label "Experiment — nur mit Stop Condition". Grenze ist 9 px.
  Footer-Breite von Hand gemessen: 1166 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 88 — Chaos Engineering mit FIS

## Szenario

Die Multi-AZ-Architektur aus den Karten 81 bis 84 steht: zwei Availability Zones,
Auto Scaling, RDS Multi-AZ, Health Checks. Ob das Failover im Ernstfall
funktioniert, weiss niemand — es hat noch nie einen Ernstfall gegeben. Diese Karte
ist der Beweisschritt.

## Ablauf

**1 — Steady State definieren.** Vor dem Experiment steht die Messgroesse: Welche
Fehlerrate, welche Latenz, welcher Durchsatz gilt als "gesund"? Ohne diese Baseline
in CloudWatch ist hinterher nicht entscheidbar, ob das System die Stoerung
weggesteckt hat. Chaos Engineering beginnt mit einer Hypothese, nicht mit einem
Knopfdruck.

**2 — Experiment Template bauen.** Das Template ist der Bauplan des Experiments und
besteht aus drei Teilen: **Actions** (was passiert), **Targets** (womit passiert es)
und **Stop Conditions** (wann wird abgebrochen). Die Stop Condition ist ein
CloudWatch-Alarm und damit die Abbruchleine des Experiments. Dazu kommt eine
IAM-Rolle, mit der FIS im Namen des Kontos handeln darf.

**3 — Szenario laufen lassen.** Aus der FIS Scenario Library kommt "AZ Availability:
Power Interruption" — ein von AWS gepflegtes Szenario, das die Symptome eines
vollstaendigen Stromausfalls einer Availability Zone erzeugt: zonale Compute-Kapazitaet
faellt weg (EC2, EKS, ECS), in der betroffenen AZ wird nicht nachskaliert, die
Subnet-Konnektivitaet bricht weg, EBS-Volumes reagieren nicht mehr, RDS und
ElastiCache schwenken. Der Standardablauf injiziert 30 Minuten lang die
Ausfallsymptome und danach 30 Minuten lang die Symptome der Wiederherstellungsphase.

**4 — Auswerten.** Blieb die Fehlerrate unter der Schwelle? Hat die Stop Condition
gefeuert? Das Ergebnis ist eine Erkenntnis ueber das eigene System, keine Vermutung —
und typischerweise eine Liste von Dingen, die im Failover doch nicht automatisch
liefen.

**Verworfener Pfad** — Experiment ohne Stop Condition direkt in Produktion: Ohne
Abbruchbedingung kann das Experiment nicht gestoppt werden, wenn es aus dem Ruder
laeuft. Aus dem Test wird dann ein selbstverschuldeter Incident. Die Stop Condition
unterscheidet Chaos Engineering von Sabotage.

## Pruefungs-Kernsatz

FIS *beweist* Resilienz, es *baut* sie nicht. Wenn ein Szenario nach einem Weg fragt,
Multi-AZ- oder Multi-Region-Verhalten zu **validieren**, ist FIS die Antwort — nicht
noch eine weitere Redundanzschicht.

## Abgrenzungen

- **Gegen Karte 81 (AZ- vs. Regionsausfall):** Karte 81 ordnet die Ausfallarten zu,
  diese Karte testet sie.
- **Gegen Karte 83 (DR-Muster) und 84 (Umschalten):** 83 vergleicht, 84 baut das
  Failover, 88 weist nach, dass es funktioniert. Die Karte wiederholt bewusst keine
  der drei.
- **Gegen Karte 85 (Spot):** FIS kann Spot-Unterbrechungen ausloesen
  (`aws:ec2:send-spot-instance-interruptions`) und ist damit auch das Werkzeug, um
  Spot-Toleranz zu pruefen. Das steht als Merksatz im Footer, nicht als eigener Pfad.
- **Gegen Lasttests:** FIS injiziert Fehler, keine Last. Ein Lasttest zeigt, ob das
  System skaliert; FIS zeigt, ob es Ausfaelle uebersteht.

## Klassiker-Fallen

- **Experiment ohne Stop Condition.** Der verworfene Pfad.
- **Ohne Baseline testen.** Ohne definierten Steady State ist das Ergebnis nicht
  interpretierbar.
- **FIS fuer ein Resilienzwerkzeug halten.** Es erzeugt Ausfaelle, es verhindert keine.
- **Annehmen, ein AZ-Ausfall treffe alles gleich.** Regionale Dienste wie S3 oder
  DynamoDB sind gegen den Ausfall einer einzelnen AZ ausgelegt; das Szenario zielt auf
  die zonalen Ressourcen.

## Faktencheck-Notizen

- *Szenario "AZ Availability: Power Interruption", Symptome und 30 + 30 Minuten:*
  AWS Fault Injection Service User Guide, "AZ Availability: Power Interruption"
  (`az-availability-scenario.html`). Dieselbe Seite nennt als Symptome den Verlust
  zonaler Compute-Kapazitaet in EC2, EKS und ECS, ausbleibendes Nachskalieren, den
  Verlust der Subnet-Konnektivitaet, RDS- und ElastiCache-Failover, beeintraechtigten
  Zugriff auf S3-Express-One-Zone-Directory-Buckets und nicht reagierende
  EBS-Volumes.
- *Scenario Library allgemein:* AWS FIS User Guide, "Scenarios reference"
  (`scenario-library-scenarios.html`) mit weiteren Szenarien wie "AZ: Application
  Slowdown", "Cross-AZ: Traffic Slowdown" und "Cross-Region: Connectivity".
- *Experiment Template aus Actions, Targets und Stop Conditions; Stop Condition ist
  ein CloudWatch-Alarm:* AWS EC2 Spot Workshop (AWS-eigenes Material),
  "Creating a Spot Interruption Experiment"; die FIS-Feature-Seite beschreibt dasselbe
  als "fine grained safety controls".
- *Spot-Unterbrechung per FIS:* AWS FIS User Guide, "Tutorial: Test Spot Instance
  interruptions using AWS FIS".
- *Zielauswahl im Szenario laeuft ueber Tags* (voreingestellt `AzImpairmentPower`):
  AWS FIS User Guide, `az-availability-scenario.html`. Bewusst nur hier, nicht auf der
  Karte.

## Nicht bestaetigt / bewusst weggelassen

- **Service Quota "maximal 5 Ressourcen je Experiment-Target":** kursiert im
  AWS-Workshop-Material, liess sich in der Service-Quotas-Dokumentation nicht
  bestaetigen. Nicht auf der Karte.
- **Preismodell von FIS** (Abrechnung je Action-Minute): nicht gegengeprueft.
- **Multi-Account-Experimente:** existieren laut AWS-Blog, sind aber fuer SAA-C03 zu
  speziell.
- **Der alte Name "Fault Injection Simulator":** Der Dienst heisst inzwischen Fault
  Injection *Service*. Aeltere AWS-Blogposts und Workshops verwenden noch den alten
  Namen; die Karte lehrt den aktuellen. In Pruefungsfragen koennen beide auftauchen,
  gemeint ist derselbe Dienst.

## Bewusste Vereinfachungen im Diagramm

- Die vier Symptome des AZ-Ausfalls stehen als drei Textzeilen in einer Box. Real
  treten sie gleichzeitig auf, nicht nacheinander — die Box ist ein Zustand, kein
  Ablaufschritt.
- Der Ablauf endet bei der Auswertung. In der Praxis folgt daraus eine Aenderung am
  System und ein erneuter Lauf.
- Die IAM-Rolle steht als Textzeile im Template statt als eigene Box.
- Die Karte zeigt nur ein Szenario aus der Library; die anderen sind in den
  Faktencheck-Notizen genannt.

## Farbkonventionen dieser Karte

Rollenpalette unveraendert:

- **Blau (Quelle):** der Steady State, also die Messdaten, gegen die alles verglichen
  wird.
- **Gold (Governance):** das Experiment Template — ein Steuerungsartefakt.
- **Orange (Compute):** die Power Interruption, weil der sichtbarste Teil der Stoerung
  die zonale Compute-Ebene trifft. Dass die Box auch Storage-Symptome nennt (EBS), ist
  eine bewusste Vereinfachung: die Box steht fuer *das Szenario*, dessen Schwerpunkt
  Compute ist.
- **Teal (Transport):** die Auswertung, weil sie den Weg der Beobachtung zurueck zum
  Team beschreibt.
- **Rot:** nur Bypass, X-Kreis und Label. Die verworfene Box bleibt Gold — ein
  Template ohne Stop Condition ist immer noch ein Template.
