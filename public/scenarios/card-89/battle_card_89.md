---
nr: 89
title: "SQS, Idempotenz, Retry-Patterns"
services: ["Amazon SQS", "Amazon SQS FIFO", "Amazon DynamoDB", "AWS Lambda"]
domains: ["D2", "D3"]
signalwords:
  - "messages may be processed more than once"
  - "ensure the order is only charged once"
  - "make the consumer idempotent"
  - "exactly-once processing"
  - "duplicate messages in the queue"
assets:
  - battle_card_89.svg
  - battle_card_89.png
  - battle_card_89.pdf
status_note: |
  qc.py: 0 Befunde. 6 Boxen (5 Karten-Boxen + Footer-Rect), 28 Texte, 19 Segmente,
  3 Badges, 1 X-Kreis.
  Segmentaufschluesselung (R5): 11 echte Segmente = 3 gerade Kettenpfeile + 3 Segmente
  der Redelivery-Schleife + 3 Segmente des roten Bypass + 2 X-Diagonalen; dazu
  8 Phantom-Segmente aus 4 Marker-<defs> (mblau, mteal, morange, mrot, je 2). Die
  Schleife teilt sich die teal Marker-ID mit dem zweiten Kettenpfeil.
  Korrekturrunden: 1 Runde, gefunden VOR dem Zeichnen durch precheck.py. Der geplante
  Boxtitel "Idempotenz-Schlüssel" lag mit 272 px um 1 px ueber dem Limit von 271 px
  der 287-px-Box. Gekuerzt auf "Idempotenz"; der Schluessel steht jetzt als erste
  Textzeile ("Schlüssel = Order-ID"), was der Box eine dritte Inhaltszeile erlaubt.
  Layout-Besonderheit: Die mittlere Spaltenluecke ist 150 px statt 90 px breit, damit
  die Grenze zwischen den beiden Zonen weder durch den Badge noch durch den
  Markerbereich laeuft. Das war eine Layout-Entscheidung vor dem Zeichnen, kein Befund.
  Render-Sanity: PNG 2400x1350, Titelband-Kanaldivergenz 0.
  R13 (reine Schwarzpixel): 0.
  R12-Gegencheck: 0 Verstoesse.
  R16: 13.0 px, Label "Duplikat 1 — FIFO löst das". Grenze ist 9 px.
  Footer-Breite von Hand gemessen: 1171 px (Grenze 1420 px).
  Sichtpruefung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter lieferte einen
  leeren Platzhalter (R8).
---

# Battle Card 89 — SQS, Idempotenz, Retry-Patterns

## Szenario

Ein Zahlungs-Worker bucht eine Bestellung zweimal ab. Das Team hatte die Queue
vorher extra von Standard auf FIFO umgestellt, "damit so etwas nicht mehr passiert".
Die Karte zeigt, warum das nur die Haelfte des Problems geloest hat.

## Ablauf

**1 — Der Producer sendet doppelt.** Die Anwendung schickt die Nachricht, bekommt
wegen eines Netzwerk-Timeouts keine Antwort und sendet erneut — mit derselben
Deduplication-ID. Das ist **Duplikatquelle 1**, und sie entsteht *vor* der Queue.

**2 — FIFO faengt genau das ab.** Innerhalb des Deduplizierungsintervalls von
5 Minuten wird die zweite Nachricht zwar angenommen, aber nicht zugestellt. Die
AWS-Dokumentation nennt das ausdruecklich **exactly-once processing**: FIFO-Queues
fuehren keine Duplikate in die Queue ein. Die Deduplication-ID wird entweder explizit
mitgegeben oder per Content-based Deduplication aus einem SHA-256-Hash des
Nachrichtenkoerpers gebildet.

**3 — Der Consumer stirbt zum falschen Zeitpunkt.** Er empfaengt die Nachricht,
fuehrt den Seiteneffekt aus — die Zahlung ist gebucht — und stuerzt ab, bevor er
`DeleteMessage` aufruft. Der Visibility Timeout laeuft ab, die Nachricht wird wieder
sichtbar und wird erneut zugestellt. Das ist **Duplikatquelle 2**, und FIFO deckt sie
nicht ab: Die Deduplizierung wirkt auf das Senden, nicht auf das Wiederzustellen.

**4 — Der Idempotenz-Schluessel rettet die Buchung.** Der Consumer schreibt vor oder
mit dem Seiteneffekt einen Schluessel — typischerweise die Order-ID — per Conditional
Write nach DynamoDB. Findet der zweite Durchlauf den Schluessel bereits vor, bricht er
folgenlos ab. Erst damit ist die fachliche Operation genau einmal wirksam.

**Verworfener Pfad** — "FIFO reicht, Idempotenz sparen wir uns": Die Redelivery aus
Schritt 3 trifft dann ungebremst die Datenbank, und die Bestellung ist doppelt
gebucht und doppelt bezahlt.

## Pruefungs-Kernsatz

FIFO loest Producer-Duplikate innerhalb von fuenf Minuten. Alles danach loest nur der
Consumer — mit einem Idempotenz-Schluessel. "Exactly-once" ist eine Zusage ueber die
*Queue*, keine ueber deine *Datenbank*.

## Abgrenzungen

- **Gegen die Masterplan-Zeile:** Die urspruengliche Formulierung "Exactly-once gibt es
  nicht" ist fachlich falsch — AWS verwendet den Begriff selbst fuer FIFO-Queues. Die
  didaktische Aussage ("baue idempotent") bleibt, die Begruendung wurde korrigiert.
  Sie ist in der korrigierten Fassung sogar schaerfer, weil sie zwei unterscheidbare
  Duplikatquellen benennt statt einer pauschalen Verneinung.
- **Gegen Standard-Queues:** Standard liefert at-least-once mit Best-Effort-Ordering,
  FIFO liefert Reihenfolge je Message Group und Deduplizierung. Beide brauchen einen
  idempotenten Consumer.
- **Gegen SNS FIFO:** Das gleiche Deduplizierungsprinzip mit demselben
  5-Minuten-Fenster gilt auch fuer SNS-FIFO-Topics. Nicht auf der Karte.
- **Gegen Step Functions:** Wo Exactly-once-Semantik wirklich gebraucht wird, ist ein
  Workflow mit Zustand oft die bessere Antwort als eine Queue. Ausserhalb dieser Karte.

## Klassiker-Fallen

- **FIFO waehlen und Idempotenz weglassen.** Der verworfene Pfad.
- **Visibility Timeout fuer eine Sperre halten.** Die AWS-Dokumentation ist hier
  ausdruecklich: Auch innerhalb des Visibility Timeout garantiert SQS bei
  Standard-Queues nicht, dass eine Nachricht nicht mehr als einmal zugestellt wird.
- **Zu kurzer Visibility Timeout.** Dauert die Verarbeitung laenger als das Fenster,
  erzeugt man die Redelivery selbst und zuverlaessig.
- **Loeschen vor dem Verarbeiten.** Wer `DeleteMessage` vor dem Seiteneffekt aufruft,
  verliert die Nachricht beim Absturz. Erst verarbeiten, dann loeschen — und den
  Doppelverbrauch per Idempotenz abfangen.

## Faktencheck-Notizen

- *FIFO fuehrt keine Duplikate ein, Retry innerhalb des 5-Minuten-Intervalls erzeugt
  keine:* Amazon SQS Developer Guide, "Exactly-once processing in Amazon SQS"
  (`FIFO-queues-exactly-once-processing.html`). Dieselbe Seite beschreibt beide Wege
  zur Deduplizierung (explizite ID oder Content-based Deduplication per SHA-256 ueber
  den Nachrichtenkoerper, nicht ueber die Attribute).
- *Standard = at-least-once, FIFO = exactly-once processing:* Amazon SQS FAQs sowie
  SQS Developer Guide, "Amazon SQS queue types".
- *Begruendung der at-least-once-Zustellung* (Kopien auf mehreren Servern, bei
  Nichterreichbarkeit eines Servers wird eine Kopie erneut ausgeliefert): SQS Developer
  Guide, "Amazon SQS at-least-once delivery".
- *Keine Garantie gegen Mehrfachzustellung innerhalb des Visibility Timeout:* SQS
  Developer Guide, "Amazon SQS visibility timeout". Das ist der wichtigste Beleg fuer
  den Kernsatz dieser Karte.
- *5-Minuten-Intervall:* SQS Developer Guide, "FIFO queue and message identifiers".

### Abweichung in der Formulierung

Die SDK-Referenz beschreibt das Fenster als **minimales** Deduplizierungsintervall von
5 Minuten ("5-minute minimum deduplication interval"), der Developer Guide schlicht als
5 Minuten. Die Karte nennt "5 Minuten", weil das der Pruefungsstand ist; die
Abweichung ist hier notiert.

## Nicht bestaetigt / bewusst weggelassen

- **Durchsatzgrenzen von FIFO-Queues** (300 Nachrichten pro Sekunde ohne Batching,
  3.000 mit Batching, hoehere Werte im High-Throughput-Modus): nicht gegengeprueft und
  eher DVA- als SAA-Stoff. Weggelassen.
- **`FifoThroughputScope`** und Deduplizierungs-Scope auf Message-Group-Ebene:
  existiert laut SNS-Dokumentation, fuer SAA-C03 zu speziell.
- **Dead Letter Queue und `maxReceiveCount`:** gehoeren zum Thema, haetten die Karte
  aber um einen zweiten Handlungsstrang erweitert. Bewusst nicht aufgenommen.
- **Konkrete Default-Werte des Visibility Timeout** (30 Sekunden, maximal 12 Stunden):
  nur aus Drittquellen belegt, nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- Producer und Consumer stehen als je eine Box, obwohl beide in der Realitaet
  mehrfach parallel laufen.
- Die Redelivery-Schleife zeigt einen Rueckweg zur Queue. Technisch wandert die
  Nachricht nicht zurueck — sie war die ganze Zeit da und wird nur wieder sichtbar.
- Der Idempotenz-Schluessel ist als DynamoDB-Box gezeichnet. Jeder transaktionale
  Speicher mit Conditional Write taete es.
- Die Karte zeigt den Seiteneffekt (die Zahlung) nicht als eigenes Element, sondern
  als Textzeile im Consumer.

## Farbkonventionen dieser Karte

Rollenpalette unveraendert:

- **Blau (Quelle):** der Producer als Ursprung der Nachricht.
- **Teal (Transport):** die SQS-FIFO-Queue und die Redelivery-Schleife — beides
  Transportvorgaenge. Auch die verworfene Box ist Teal, weil "FIFO reicht" eine
  Aussage ueber den Transport ist.
- **Orange (Compute):** der Consumer.
- **Gruen (Storage):** der Idempotenz-Schluessel in DynamoDB.
- **Rot:** nur Bypass, X-Kreis und Label.
- Die beiden gestrichelten Zonen tragen bewusst **keine** Rollenfarbe: Sie gruppieren
  nach *Duplikatquelle*, nicht nach Architekturrolle, und stehen deshalb im
  Strukturgrau des Stil-Guides.
