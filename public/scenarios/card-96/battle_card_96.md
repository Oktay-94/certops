---
nr: 96
title: Express oder Standard
services: [AWS Step Functions, Amazon CloudWatch Logs]
domains: [D2, D4]
signalwords:
  - "high-volume, short-duration workflows"
  - "exactly-once execution"
  - "idempotent"
  - "audit trail of every step"
  - "cost per state transition"
assets: [battle_card_96.svg, battle_card_96.png, battle_card_96.pdf]
status_note: |
  qc.py 0 Befunde. Gemeldet: 15 Boxen, 39 Texte, 5 Segmente, 0 Badges,
  1 X-Kreis. Aufschlüsselung Boxen: 2 Kopfboxen + 12 Matrixzellen +
  1 Footer-Rect = 15; keine gestrichelten Zonen auf dieser Karte.
  Segmente: 1 gezeichneter Pfeil + 2 X-Diagonalen + 2 Phantomsegmente aus
  der einen Marker-ID ("ablehn") = 5. Badges bewusst 0 — Matrixkarte ohne
  Ablauf, laut Stil-Guide zulässig.
  Korrekturrunden: keine. Alle Prüfungen liefen im ersten Durchlauf grün;
  precheck.py hatte vor dem Zeichnen 36 Texte gemessen, 0 Befunde, engste
  Reserve 108,9 px ("Ausführungssemantik" 210/319 px).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde. R12-Gegencheck: 0 Verstöße.
  r16.py: 20,0 px am Zeilenlabel "Abrechnung" (Grenze 9 px).
  Footer von Hand gemessen: 724 px (Grenze 1.420 px).
  Untertitel real gerendert bis x=897,3 bei erlaubten 908,7 px — Reserve
  11,4 px, nachträglich gegen den echten CairoSVG-Render nachgemessen,
  nachdem Karte 97 an derselben Stelle einen Befund hatte.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

## Szenario

Ein Team orchestriert zwei sehr verschiedene Workloads mit Step Functions:
eine Zahlungsfreigabe mit menschlicher Genehmigung und eine
Klickstrom-Anreicherung mit Millionen kurzer Läufe. Der Workflow-Typ wird
beim Anlegen der State Machine festgelegt und lässt sich danach nicht mehr
ändern — die Entscheidung fällt also einmal und dauerhaft.

## Die fünf Unterschiede

1. **Maximale Laufzeit.** Standard läuft bis zu ein Jahr und überbrückt
   Wartezeiten auf Menschen oder Fremdsysteme. Express bricht nach fünf
   Minuten ab. Das ist die Dimension, die in Prüfungsfragen am häufigsten
   den Ausschlag gibt.
2. **Ausführungssemantik.** Standard garantiert exactly-once, jeder Schritt
   läuft genau einmal, sofern kein Retry definiert ist. Asynchrone Express
   Workflows sind at-least-once, synchrone at-most-once. Damit ist Express
   nur für idempotente Aktionen unbedenklich.
3. **Abrechnung.** Standard zählt State Transitions, also abgeschlossene
   Schritte. Express rechnet nach Anzahl der Ausführungen, deren Dauer und
   dem verbrauchten Speicher ab. Bei sehr vielen sehr kurzen Läufen ist das
   der günstigere Modus — genau der Fall, den die Masterplan-Zeile meint.
4. **Ausführungshistorie.** Standard-Ausführungen lassen sich über die
   Step-Functions-API auflisten und in der Konsole visuell debuggen, die
   Historie ist bis 90 Tage nach Abschluss verfügbar. Express erfasst keine
   Historie im Dienst selbst; ohne aktiviertes CloudWatch-Logging ist der
   Lauf im Nachhinein nicht nachvollziehbar.
5. **Integrationsmuster.** Express unterstützt weder das Job-run-Muster
   (`.sync`) noch Callback (`.waitForTaskToken`), weder Distributed Map noch
   Activities. Wer auf einen ECS-Task warten oder ein Task Token einlösen
   will, braucht Standard.

## Prüfungs-Kernsatz

Hochfrequent, kurz und idempotent führt zu Express; langlaufend,
auditierbar und nicht-idempotent führt zu Standard. Der Typ ist nach dem
Anlegen unveränderlich.

## Abgrenzungen

- **Express Sync gegen Express Async.** Synchron wartet auf das Ergebnis und
  ist at-most-once, asynchron bestätigt nur den Start und ist at-least-once.
  Die verbreitete Merkformel „Express ist at-least-once" ist damit nur die
  halbe Wahrheit.
- **Standard mit Express verschachteln.** Ein Standard Workflow kann
  Express Workflows als Kindausführungen starten. Das ist das Muster, wenn
  ein langlaufender Prozess einen hochfrequenten Teilschritt enthält.
- **Direkte Lambda-Verkettung.** Für zwei oder drei Schritte ohne
  Fehlerbehandlung braucht es keine State Machine.

## Klassiker-Fallen

- Express für Zahlungen, Bestandsbuchungen oder andere nicht-idempotente
  Aktionen. At-least-once bedeutet, dass eine Ausführung mehrfach laufen
  kann; ohne Idempotenzschlüssel wird doppelt gebucht.
- Express wählen und später eine Freigabe durch einen Menschen einbauen
  wollen. Ohne Callback-Muster und mit fünf Minuten Deckel geht das nicht,
  und der Typ lässt sich nicht umstellen.
- Annehmen, Express sei immer billiger. Bei wenigen, langen Ausführungen mit
  viel Speicher kann das Dauer-und-Speicher-Modell teurer sein als das
  Zählen weniger State Transitions.

## Faktencheck-Notizen

- Laufzeit, Semantik, Abrechnung, Historie und Integrationsmuster: AWS Step
  Functions Developer Guide, „Choosing workflow type in Step Functions",
  inklusive der Vergleichstabelle und der Tabelle zu Ausführungsgarantien.
- Ein Jahr gegen fünf Minuten zusätzlich bestätigt durch den AWS
  Well-Architected Serverless Applications Lens (zweite AWS-Quelle).
- 90 Tage Historie und die Möglichkeit, die Aufbewahrung auf 30 Tage zu
  reduzieren: dieselbe Doku-Seite, Abschnitt Ausführungsgarantien.

## Nicht bestätigt / bewusst weggelassen

- **Durchsatzzahlen.** Verbreitete Angaben wie 2.000 Ausführungen pro
  Sekunde für Standard und 100.000 für Express stammen aus Drittquellen. Die
  AWS-Vergleichstabelle verweist an dieser Stelle ausschließlich auf die
  Service Quotas und nennt selbst keine Zahl. Deshalb steht keine
  Durchsatzzahl auf der Karte.
- **Konkrete Preise.** Preis je Million State Transitions oder je GB-Sekunde
  ist regionsabhängig und ändert sich; die Karte nennt nur das Modell.

## Bewusste Vereinfachungen im Diagramm

- Die Matrix zeigt fünf Unterscheidungsdimensionen, nicht alle. Weggelassen
  sind unter anderem die Unterschiede beim Zustandsübergangs-Limit und die
  Details der Konsolendarstellung.
- Die letzte Zeile ist keine Eigenschaft, sondern ein Anwendungsfall. Sie
  steht bewusst in derselben Matrix, weil die Entscheidung erst am konkreten
  Workload sichtbar wird.

## Farbkonventionen dieser Karte

Alle Eigenschaftszeilen sind einheitlich in Navy (Struktur) gehalten. Die
Rollenpalette wird hier **nicht** als Bedeutungs- oder Intensitätsskala
verwendet — das wäre die Wiederholung der offenen Farbfrage von Karte 80.
Der Stil-Guide verlangt bei Matrixkarten Farbe auf den Zeilen statt auf den
verglichenen Objekten; eine einheitliche Zeilenfarbe erfüllt das, weil keine
Farbe auf die Spalten (Standard/Express) fällt. Die Ablehnung des
Express-Wegs für den Zahlungslauf erfolgt konventionsgemäß über X-Kreis und
roten Pfad, nicht über eine rote Füllung.
