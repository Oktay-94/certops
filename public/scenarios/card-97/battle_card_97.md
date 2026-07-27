---
nr: 97
title: Millionen Einmal-Timer
services: [Amazon EventBridge Scheduler, AWS Lambda, Amazon SNS, Amazon EventBridge]
domains: [D2, D3]
signalwords:
  - "millions of individual reminders"
  - "one-time schedule at a specific future time"
  - "without managing a scheduling table"
  - "time zone and daylight saving support"
assets: [battle_card_97.svg, battle_card_97.png, battle_card_97.pdf]
status_note: |
  qc.py 0 Befunde. Gemeldet: 7 Boxen, 24 Texte, 14 Segmente, 3 Badges,
  1 X-Kreis. Aufschlüsselung Boxen: 4 Boxen der Hauptkette + 1
  Governance-Box + 1 verworfene Box + 1 Footer-Rect = 7; keine Zonen.
  Segmente: 3 Kettenpfeile + 1 gestrichelter Governance-Pfeil + 2 Segmente
  des Bypass + 2 X-Diagonalen = 8 gezeichnete, dazu 6 Phantomsegmente aus
  drei Marker-IDs ("kette", "gov", "verworfen") = 14.
  Korrekturrunden: eine, NACH dem Zeichnen gefunden. zones.py meldete 17
  Tintenpixel bei x=832 im Untertitelband. Erster Erklärungsversuch (das
  Em-Dash im Untertitel) war falsch — nach dem Entfernen wanderte der Befund
  nur auf x=811 und blieb bestehen. Die tatsächliche Messung ergab: der
  Untertitel rendert 12,80 px breiter als PIL misst (1,73 % der Textbreite),
  während zones.py mit PAD_TEXT_REL 1,2 % plus 3 px rechnet. Behoben durch
  Kürzen des Untertitels auf einen Text, dessen echter Render vorab gegen
  die erlaubte Grenze gemessen wurde (Reserve 4,8 px). zones.py wurde nicht
  angefasst. Details unter "Fallen für den Sammelpass" in EINBAU-61-100.md.
  precheck.py vor dem Zeichnen: 18 Texte, 0 Befunde, engste Reserve 53,4 px
  ("Service legt einen Schedule an" 233/286 px).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde nach der Korrektur. R12-Gegencheck: 0 Verstöße.
  r16.py: 16,7 px am freien Label "10 Mio Schedules je Region".
  Korridorbreite des Bypass 1.025 px gegen ein 323 px breites Label, vor dem
  Zeichnen per assert im Generator geprüft.
  Footer von Hand gemessen: 783 px.
  Sichtprüfung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter
  lieferte einen leeren Platzhalter.
---

## Szenario

Ein Buchungsdienst soll jedem Kunden zu einem individuellen Zeitpunkt eine
Erinnerung schicken — „erinnere Kunde X am 3. Mai um 9 Uhr". Es gibt keinen
gemeinsamen Takt, jeder Termin ist einzeln. Die Bastellösung wäre eine
eigene Timer-Tabelle plus ein Poller, der jede Minute nachsieht.

## Ablauf

1. **Buchung.** Der Service legt beim Buchen einen One-time-Schedule an,
   mit Zielzeitpunkt und Zeitzone. EventBridge Scheduler kennt Zeitzonen
   samt Sommerzeitumstellung, die Umrechnung muss die Anwendung nicht
   selbst leisten.
2. **Scheduler hält den Termin.** Ein Schedule hat genau ein Ziel. Die
   Voreinstellung liegt bei zehn Millionen Schedules je Region und lässt
   sich auf Milliarden erhöhen — „Millionen" aus der Aufgabenstellung ist
   also gedeckt, ohne dass ein Quota-Antrag nötig wäre.
3. **Lambda baut die Erinnerung.** Zur Zielzeit ruft Scheduler das Ziel auf.
   Lambda holt die Kundendaten und formuliert die Nachricht.
4. **Zustellung über SNS.** Der Versand ist ein eigener Schritt, damit
   Kanäle austauschbar bleiben.

Dazu die Governance-Ecke: abgelaufene One-time-Schedules zählen weiter gegen
die Quota. `ActionAfterCompletion` löscht sie automatisch nach der letzten
Ausführung — ohne diese Einstellung läuft ein Account mit Millionen
Einmal-Terminen langsam voll.

## Prüfungs-Kernsatz

Ein Zeitpunkt und ein Ziel führen zu EventBridge Scheduler; ein Ablauf mit
mehreren Schritten führt zu Step Functions, das der Scheduler dann auslöst.

## Abgrenzungen

- **EventBridge Rules mit `schedule`-Expression.** Der ältere Mechanismus.
  AWS bezeichnet Scheduled Rules in der eigenen Doku inzwischen als
  Legacy-Feature und empfiehlt Scheduler. Rules sind an einen Event Bus
  gebunden, standardmäßig auf 300 je Bus begrenzt und kennen keine
  Einmal-Auslösung zu einem festen Zeitpunkt.
- **SQS Delay Queues.** Verzögern eine Nachricht, aber nur bis 15 Minuten.
  Für einen Termin in drei Wochen untauglich.
- **DynamoDB TTL.** Löscht Einträge irgendwann nach Ablauf, ohne
  Zeitgarantie. Als Auslöser für terminierte Aktionen unbrauchbar, auch wenn
  das Muster über TTL-Streams verbreitet ist.
- **Step Functions Wait State.** Kann lange warten, kostet aber eine
  laufende Ausführung je Termin und ist für Millionen Einzeltermine der
  teurere Weg.

## Klassiker-Fallen

- Scheduler und EventBridge Rules in einer Antwort vermischen. Der Scheduler
  braucht keinen Event Bus, die Rule schon.
- Vergessen, dass ein Schedule genau ein Ziel hat. Wer mehrere Ziele
  braucht, schickt an SNS oder an eine State Machine und fächert dort auf.
- Erledigte Schedules nicht aufräumen und dann an der Quota anstehen.

## Faktencheck-Notizen

- Zehn Millionen Schedules je Region als Voreinstellung, erhöhbar auf
  Milliarden, sowie der Hinweis, dass abgeschlossene One-time-Schedules
  mitzählen und `ActionAfterCompletion` empfohlen wird: „Quotas for Amazon
  EventBridge Scheduler", Zeile *Number of schedules*.
- One-time- und Recurring-Schedules, Zeitzonen und Sommerzeit, mehr als 270
  Dienste und über 6.000 API-Operationen als Ziele, ein Ziel je Schedule:
  „What is Amazon EventBridge Scheduler?" und die API-Referenz zu *Target*.
- Scheduled Rules als Legacy-Feature und die Empfehlung, Scheduler zu
  verwenden: Amazon EventBridge User Guide, „Rules in Amazon EventBridge"
  und „Creating a scheduled rule (legacy)".
- 300 Rules je Event Bus als Voreinstellung: EventBridge User Guide,
  „Event bus concepts".

## Nicht bestätigt / bewusst weggelassen

- **Scheinbarer Quellenkonflikt aufgelöst, nicht verschwiegen.** Ein
  AWS-Compute-Blog nennt weiterhin eine Million Schedules je Account. Das
  ist kein Widerspruch zwischen zwei gültigen Quellen, sondern ein Beitrag
  von vor der Quota-Erhöhung; ein AWS-Announcement vom August 2024
  dokumentiert die Anhebung auf zehn Millionen. Auf der Karte steht der
  Wert aus der aktuellen Quota-Doku.
- **Invocations-Durchsatz** (1.000 pro Sekunde in den Primärregionen) steht
  nicht auf der Karte, weil er regionsabhängig ist und die Karte sonst zwei
  Zahlen tragen müsste, die leicht verwechselt werden.

## Bewusste Vereinfachungen im Diagramm

- Retry-Policy und Dead-Letter-Queue je Schedule sind nicht gezeichnet,
  obwohl sie zur produktiven Konfiguration gehören.
- Flexible Time Windows fehlen im Bild. Sie sind für die Abgrenzung
  unwichtig, für die Lastverteilung aber relevant.

## Farbkonventionen dieser Karte

Pfeilfarbe teal, weil die Kette ein Auslöseweg ist und keine Nutzdaten
transportiert. Die Aufräum-Box ist gold (Governance) und über einen
gestrichelten Pfeil angebunden, weil sie eine Konfigurationsentscheidung
zeigt und keinen Ablaufschritt. Die verworfene EventBridge-Rule-Box behält
ihre Rollenfarbe teal; abgelehnt wird sie durch X-Kreis und roten Pfad.
