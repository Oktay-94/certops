---
nr: 86
title: "Cost Explorer, Budgets, Anomaly Detection"
services: ["AWS Cost Explorer", "AWS Budgets", "AWS Cost Anomaly Detection", "Amazon SNS", "AWS Systems Manager", "AWS Organizations"]
domains: ["D4"]
signalwords:
  - "detect unusual spending automatically"
  - "alert when costs exceed a threshold"
  - "automatically stop resources when the budget is exceeded"
  - "identify the root cause of a cost increase"
  - "least operational overhead cost control"
assets:
  - battle_card_86.svg
  - battle_card_86.png
  - battle_card_86.pdf
status_note: |
  qc.py: 0 Befunde. 8 Boxen (7 Karten-Boxen + Footer-Rect, das qc als Box zaehlt),
  31 Texte, 18 Segmente, 5 Badges, 1 X-Kreis.
  Segmentaufschluesselung (R5): 10 echte Segmente = 2 Baendpfeile oben + 3 Rueckfuehrung
  + 2 Baendpfeile unten + 1 roter Pfad + 2 X-Diagonalen; dazu 8 Phantom-Segmente aus
  4 Marker-<defs> (mblau, mgold, mteal, mrot, je 2).
  Korrekturrunden: keine.
  Render-Sanity: PNG 2400x1350, Titelband-Kanaldivergenz 0.
  R13 (reine Schwarzpixel): 0.
  R12-Gegencheck (gestrokte <path> ohne fill="none"): 0 Verstoesse.
  R16 (engster Abstand freier Labels zu Boxkanten): 13.0 px, Label
  "Erkennen — automatisch, ohne Schwelle". Grenze ist 9 px.
  Footer-Breite von Hand gemessen: 1117 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 86 — Cost Explorer, Budgets, Anomaly Detection

## Szenario

Ein Dev-Account verdreifacht ueber ein Wochenende seine Kosten, weil eine falsch
gesetzte Route den kompletten Egress-Traffic ueber ein NAT Gateway zwingt. Niemand
schaut bis zur Monatsrechnung hin. Die Karte zeigt die Kette, die den Schaden am
selben Tag sichtbar macht und ohne Mensch beendet.

## Ablauf

**1 — Kosten- und Nutzungsdaten laufen ein.** Billing und Cost Management sammelt
Kosten- und Nutzungsdaten laufend ein; die Daten werden mindestens alle 24 Stunden
aktualisiert. Das ist die Datenbasis fuer alle drei Werkzeuge auf dieser Karte —
keines davon misst selbst, alle lesen denselben Datenstrom.

**2 — Cost Anomaly Detection erkennt die Abweichung.** Der Dienst lernt per Machine
Learning das normale Ausgabenmuster und meldet Abweichungen davon. Entscheidend fuer
die Pruefung: Es muss vorher **keine Schwelle** definiert werden. Genau das
unterscheidet ihn von AWS Budgets — er findet auch das, womit niemand gerechnet hat,
und erkennt sowohl den einmaligen Spike als auch den langsamen Schleichanstieg.

**3 — Der Alert geht raus.** Die Zustellung haengt an der gewaehlten Frequenz:
IMMEDIATE laeuft ueber SNS, DAILY und WEEKLY ueber E-Mail. Wer sofortige
Benachrichtigung will, braucht also ein SNS-Topic — eine E-Mail-Adresse allein
liefert bestenfalls die Tageszusammenfassung.

**4 — Cost Explorer erklaert das Warum.** Die Analyse laeuft rueckblickend: gruppieren
nach Service, Usage Type, Region, Linked Account oder Cost Allocation Tag, bis der
Treiber feststeht. Cost Explorer ist das Diagnose-, nicht das Alarmwerkzeug.

**5 — AWS Budgets zieht die Konsequenz.** Ein Budget feuert auf **actual** oder
**forecasted** Kosten und kann drei Arten von Aktionen ausloesen: eine IAM-Policy
anhaengen, eine SCP anwenden oder gezielt EC2- beziehungsweise RDS-Instanzen stoppen.
Die Aktion laeuft automatisch oder erst nach Freigabe durch einen Menschen. Die
Ressource wird gestoppt oder die Neuprovisionierung blockiert.

## Pruefungs-Kernsatz

Anomaly Detection erkennt *Unerwartetes ohne Schwelle*, Budgets erzwingt eine
*definierte Grenze mit Aktion*, Cost Explorer erklaert *warum* — eine Antwort, die
nur eines der drei nennt, beantwortet die Frage meist nicht vollstaendig.

## Abgrenzungen

- **Gegen Karte 85 (Kaufoptionen):** Dort geht es um die Frage, welche Kaufoption
  passt. Die Kaufempfehlungen selbst entstehen in Cost Explorer beziehungsweise im
  Savings Plans Purchase Analyzer — das gehoert hierher, nicht auf 85.
- **Gegen Karte 87 (Rightsizing):** Diese Karte reagiert auf *unerwartete* Kosten.
  Karte 87 arbeitet an dauerhaft *ueberdimensionierten* Ressourcen. Anomalie ist ein
  Ereignis, Overprovisioning ein Zustand.
- **Gegen CloudWatch-Billing-Alarme:** Die gibt es weiterhin, sie sind aber der
  aeltere Weg mit fester Schwelle und ohne Aktion. In Szenarien mit "least
  operational overhead" ist AWS Budgets die erwartete Antwort.

## Klassiker-Fallen

- **Nur ein Budget-Alarm bei 100 Prozent.** Der Alarm kommt an, wenn das Geld weg
  ist, und am Wochenende liest ihn niemand. Auf der Karte ist das der verworfene Pfad.
- **SNS mit E-Mail verwechseln.** IMMEDIATE geht nur ueber SNS.
- **SCP im falschen Account.** Eine SCP kann nur aus dem Management Account auf einen
  anderen Account angewendet werden; EC2- oder RDS-Instanzen in einem *fremden*
  Account lassen sich per Budget Action nicht stoppen.
- **Cost Explorer fuer Alarme halten.** Cost Explorer alarmiert nicht, es erklaert.

## Faktencheck-Notizen

- *Alert-Frequenz und Kanal:* IMMEDIATE ueber SNS, DAILY und WEEKLY ueber E-Mail —
  AWS Cost Management API Reference, `AnomalySubscription`, Feld `Frequency`.
- *Kostenfrei:* Cost Anomaly Detection ist ein kostenloser Dienst — AWS What's New,
  "AWS Cost Anomaly Detection is now generally available" (16.12.2020).
- *Budget-Aktionstypen:* IAM-Policy, SCP, oder gezieltes Stoppen von EC2-/RDS-Instanzen
  — AWS Cost Management User Guide, "Configuring budget actions"
  (`budgets-controls.html`). Dieselbe Seite nennt die Einschraenkung, dass eine SCP nur
  aus dem Management Account auf einen anderen Account wirkt und EC2-/RDS-Instanzen in
  einem fremden Account nicht targetbar sind.
- *SSM-Ausfuehrung:* Der Stopp laeuft technisch ueber Systems Manager —
  `SsmActionDefinition` mit `ActionSubType` `STOP_EC2_INSTANCES` oder
  `STOP_RDS_INSTANCES`, AWS CLI Reference `budgets update-budget-action`.
- *actual vs. forecasted:* Budgets koennen auf beides feuern — AWS Cloud Financial
  Management Blog, "Launch: AWS Budgets Actions".
- *Datenaktualisierung mind. alle 24 h:* AWS Cost Management User Guide,
  "Analyzing your costs and usage with AWS Cost Explorer".

### AWS-interner Widerspruch — deshalb steht keine Zahl zu Cost Explorer auf der Karte

Vier offizielle AWS-Quellen nennen unterschiedliche Werte fuer Historie und Forecast:

| Quelle | Historie | Forecast |
|---|---|---|
| User Guide, "Analyzing your costs and usage" | 13 Monate | 18 Monate |
| User Guide, "Using the Cost Explorer chart" | 13 Monate | 12 Monate |
| User Guide, "Best practices for the Cost Explorer API" | 13 Monate | 3 Monate taeglich / 12 Monate monatlich |
| What's New, 16.11.2023 | 14 Monate Standard, bis 38 Monate optional | — |

Nach Projektregel (zwei offizielle Quellen widersprechen sich bei einer Zahl → keine
Zahl auf die Karte) traegt das Diagramm keinen dieser Werte. Fuer die Pruefung ist die
Groessenordnung "gut ein Jahr rueckwaerts, etwa ein Jahr vorwaerts" ausreichend.

## Nicht bestaetigt / bewusst weggelassen

- **Reset-Verhalten der Budget Actions** (IAM und SCP setzen zum Beginn der neuen
  Budgetperiode zurueck, gestoppte EC2-/RDS-Instanzen nicht): steht so nur in der
  Launch-Ankuendigung von Oktober 2020, nicht im aktuellen User Guide. Didaktisch
  wertvoll, aber nicht auf der Karte.
- **"Bis zu 5 Schwellen mit je bis zu 10 Aktionen":** ebenfalls nur aus der
  Ankuendigung von 2020. Weggelassen.
- **Preis von AWS Budgets** (erste Budgets kostenlos, danach Tagespreis): nicht
  gegengeprueft, weggelassen.
- **Cost Optimization Hub und Billing Conductor:** nicht SAA-C03-Kernstoff.
- **Mindestlaenge der Lernphase von Cost Anomaly Detection** (kursiert als "10 Tage"):
  nur in Drittquellen gefunden, keine AWS-Doku. Weggelassen.

## Bewusste Vereinfachungen im Diagramm

- Der Ablauf ist als zwei Baender gezeichnet, obwohl Cost Explorer und Budgets in der
  Praxis parallel und dauerhaft laufen. Die Kette bildet den *Vorfall*, nicht den
  Dauerbetrieb ab.
- Die Rueckfuehrung vom Alert in Band 2 ist ein Zeilenumbruch, keine
  Zurueck-zum-Anfang-Schleife.
- "Ressource gestoppt" fasst zwei technisch verschiedene Wege zusammen (SSM stoppt
  bestehende Instanzen, SCP verhindert neue).
- Die Kanaele SNS und E-Mail stehen in einer Box, obwohl sie unterschiedliche
  Zustellwege sind.

## Farbkonventionen dieser Karte

Rollenpalette wie im Stil-Guide ab Karte 61, keine Abweichung:

- **Blau (Quelle):** die Kosten- und Nutzungsdaten, aus denen alles Weitere liest.
- **Gold (Governance):** Cost Anomaly Detection, Cost Explorer, AWS Budgets — alle drei
  sind Steuerungs- und Kontrollwerkzeuge, keine Architekturbausteine. Dass drei goldene
  Boxen nebeneinander stehen, ist gewollt und kein Farbfehler.
- **Teal (Transport):** die Alert-Zustellung.
- **Orange (Compute):** die gestoppte Ressource.
- **Rot:** ausschliesslich der verworfene Pfad, gezeichnet als roter Pfad mit X-Kreis.
  Die verworfene Box selbst behaelt ihre Rollenfarbe Gold — sie ist ein
  Governance-Element, nur ein schlechtes.
