---
nr: 51
title: "Kinesis Data Streams vs. SQS — Clickstream mit mehreren Konsumenten und Replay"
services:
  - Amazon Kinesis Data Streams
  - Amazon SQS
  - AWS Lambda
  - Amazon S3
domains:
  - D3
signalwords:
  - "multiple consumers must process the same records"
  - "replay the last N hours"
  - "reprocess events after a faulty deployment"
  - "real-time clickstream analytics"
  - "ordered per session"
  - "each team needs its own copy of the stream"
assets:
  - battle_card_51.svg
  - battle_card_51.png
  - battle_card_51.pdf
status_note: >
  QC (scripts/qc.py): 0 Befunde. Gemeldet 8 Boxen, 36 Texte, 23 Segmente,
  6 Badges. Segmentzahl aufgeschluesselt nach R5: 23 gemeldet minus 10
  Phantom-Segmente aus fuenf Marker-Definitionen in <defs> = 13 tatsaechlich
  gezeichnete Segmente (10 <line>, 3 Teilsegmente des einen Replay-<path>).
  Badge-Zahl nach R6: 6 gemeldete Badges = die sechs Nummern-Badges; der weiss
  gefuellte Kreis mit rotem Rand bei (185,515) ist das rote X des verworfenen
  Pfades und wird von Pruefung (d) korrekt nicht als Badge gezaehlt.
  Korrekturrunden: zwei, beide VOR dem Zeichnen im Geometrieplan gefunden.
  (1) Footer-Erstfassung 1796,8 px — weit ueber der R3-Grenze; drei Varianten
  gemessen, V2 mit 1354,1 px uebernommen. (2) Box "Kinesis Data Streams" hatte
  bei 300 px Breite nur 18,3 px Titelreserve — unter der 20-px-Schwelle aus R4;
  Box auf 310 px verbreitert, Reserve jetzt 28,3 px. Kollisionspruefung im
  Plan (Liang-Barsky ueber alle geplanten Segmente gegen alle Boxen, 6 px
  Inset): 0 Kollisionen vor der ersten SVG-Zeile.
  Schwarz-Pruefung nach R13: 0 px reines Schwarz (0,0,0) im PNG. Alle sieben
  Palettenfarben im PNG nachweisbar (#3B3B98 11174 px, #2E6BE6 4518 px,
  #D97706 13470 px, #3F8624 5341 px, #E7157B 1868 px, #C7161D 2580 px,
  #9A9A9A 1857 px). R12-Gegencheck: genau ein <path> mit stroke im SVG
  (der rechtwinklige Replay-Weg), traegt fill="none".
  Render-Sanity: neun Freizonen aus der Elementgeometrie abgeleitet, zwei
  mussten nachgeschnitten werden — beide Zonenfehler nach R7, kein
  Grafikfehler. Z2 endete bei x=800 und traf damit die Mitte des
  Zonenrand-Strichs (stroke-width 1,5 belegt 798,75..801,25); neu bei x=796
  geschnitten. Z4 begann bei x=1150 und lag 13,4 px im Zonenlabel
  "KONSUMENTEN — parallel, unabhaengig" (396,8 px breit, text-anchor=middle
  auf x=965, belegt also 766,6..1163,4); neu bei x=1170 geschnitten. Danach
  9 von 9 Zonen frei.
  Footer von Hand mit PIL gemessen: 1354,1 px (Grenze Stil-Guide ~1420,
  R3-Arbeitsgrenze ~1400).
  Sichtpruefung nach R8: versucht. Der view-Aufruf lieferte ein Bildobjekt
  ohne lesbaren Inhalt zurueck — die Karte konnte NICHT gesehen werden.
  Rechnerisch geprueft ist nicht gesehen. Sichtpruefung durch Oktay steht aus.
---

# Battle Card 51 — Kinesis Data Streams vs. SQS

## Szenario

Ein Online-Modehändler wertet den Clickstream seines Shops aus. Drei Teams
brauchen dieselben Events **gleichzeitig**: die Personalisierung für
Echtzeit-Empfehlungen, die Betrugserkennung für Sitzungsmuster und das
BI-Team für die nächtliche Ladung in den Data Lake. Nach einem fehlerhaften
Deployment hat der Personalisierungs-Konsument drei Stunden lang falsch
verarbeitet und muss **dieselben Events noch einmal lesen**. Der erste
Entwurf sah eine SQS-Queue vor.

## Ablauf

**1 — Das Shop-Frontend schreibt Klick-Events in den Stream.**
Als Partition Key dient die Session-ID. Das ist die eigentliche
Design-Entscheidung dieses Schritts: Kinesis garantiert Reihenfolge
**je Partition Key**, nicht über den ganzen Stream. Alle Events einer Sitzung
landen damit im selben Shard und werden in der Reihenfolge gelesen, in der
sie passiert sind — was die Betrugserkennung braucht, um „erst Warenkorb
gefüllt, dann Adresse geändert" von der umgekehrten Reihenfolge zu
unterscheiden.

**2, 3, 4 — Drei Konsumenten lesen denselben Stream unabhängig voneinander.**
Jeder hat seinen eigenen Iterator und seine eigene Position im Stream. Das
Lesen durch die Personalisierung entfernt nichts und blockiert nichts für die
Betrugserkennung. Mit Enhanced Fan-out bekommt jeder registrierte Konsument
zusätzlich einen eigenen Lesedurchsatz je Shard, statt sich den geteilten
Durchsatz mit den anderen zu teilen — relevant, sobald mehrere Konsumenten
gleichzeitig Last erzeugen.

**5 — Der BI-Konsument schreibt die Rohdaten nach S3.**
Von dort aus arbeiten Athena und Glue weiter (Karte 52/53). Dieser Pfad ist
der einzige, der den Stream verlässt — die beiden anderen Konsumenten
reagieren in Echtzeit und persistieren nichts.

**6 — Replay: der Personalisierungs-Konsument setzt seinen Iterator zurück.**
Er liest dieselben Records noch einmal ab einem Zeitpunkt innerhalb der
Retention. Nichts wurde neu geschrieben, niemand musste die Events aufheben.
Der Replay ist möglich, weil Kinesis Records **nach Zeit** verwirft und nicht
nach Konsum: 24 Stunden per Default, bis 7 Tage mit extended retention, bis
365 Tage mit long-term retention.

**Verworfen — die SQS-Queue.**
Eine SQS-Nachricht verschwindet, sobald ein Konsument sie verarbeitet und
löscht. Ein zweiter Leser bekommt sie nicht, und ein dritter Stunden später
schon gar nicht. Für drei parallele Konsumenten bräuchte man drei Queues
plus ein SNS-Topic davor — und selbst dann gäbe es kein Replay, weil die
Nachricht in jeder Queue nach dem Löschen weg ist.

## Prüfungs-Kernsatz

**SQS löscht nach Konsum, Kinesis behält nach Zeit.** Wer „replay",
„reprocess" oder „mehrere Konsumenten lesen dieselben Records" liest, ist
bei Kinesis — nicht bei SQS, auch nicht mit Fan-out über SNS.

## Abgrenzungen

- **51 ↔ 55 (MSK):** Beide behalten Records nach Zeit und erlauben Replay
  durch mehrere unabhängige Konsumenten. Der Unterschied ist nicht fachlich,
  sondern operativ: MSK ist die Antwort, wenn **bestehender Kafka-Code**
  weiterlaufen soll. Ein Greenfield-Projekt ohne Kafka-Bindung nimmt Kinesis.
- **51 ↔ 52 (Firehose):** Data Streams ist ein Puffer, aus dem Konsumenten
  **holen**. Firehose **liefert** selbstständig ab und kennt kein Replay
  durch Dritte. Firehose kann einen Data Stream als Quelle haben — die beiden
  sind gestapelt, nicht alternativ.
- **51 ↔ 7 (SQS + Lambda + DLQ):** Dort ist SQS die richtige Antwort, weil
  jede Bestellung **genau einmal** von **einem** Verarbeiter bearbeitet werden
  soll und Lastspitzen gepuffert werden. Hier ist SQS die falsche Antwort,
  weil dieselben Events von **mehreren** gelesen werden müssen. Die Frage ist
  nie „welcher Dienst ist besser", sondern „wie viele lesen dasselbe".

## Klassiker-Fallen

1. **„SNS-Fan-out löst das."** Es löst das Fan-out-Problem, nicht das
   Replay-Problem. Drei Queues hinter einem Topic geben drei Konsumenten
   ihre eigene Kopie — aber sobald eine Nachricht gelöscht ist, ist sie in
   dieser Queue weg. Der Kandidat, der nach dem Deployment-Fehler drei
   Stunden neu lesen will, steht ohne da.
2. **Reihenfolge wird global gelesen.** Kinesis garantiert Ordnung **je
   Partition Key**, nicht über den Stream. Wer als Partition Key etwas
   Zufälliges wählt, verteilt eine Session über mehrere Shards und verliert
   genau die Reihenfolge, die die Betrugserkennung braucht.
3. **Retention wird rückwirkend gedacht.** Eine Erhöhung der Retention macht
   bereits abgelaufene Records **nicht** wieder zugänglich. Wer von 24 auf
   168 Stunden erhöht, erreicht Daten, die älter als 24 Stunden sind, damit
   nicht mehr — die Erhöhung wirkt nur nach vorn.

## Faktencheck — Divergenzen zu älterem Kursmaterial

1. **Kinesis Data Streams hat seit dem 04.11.2025 einen dritten
   Kapazitätsmodus: On-demand Advantage.** Er ist eine Einstellung auf
   Account-Ebene, erlaubt das Vorwärmen von Schreibkapazität für sofortige
   Durchsatzsprünge und entfernt die feste Gebühr je Stream.
   Kursmaterial, das vor Ende 2025 entstanden ist, kennt nur Provisioned und
   On-demand und stellt die Wahl als Zweierentscheidung dar.
   *Quelle: AWS What's New, „Amazon Kinesis Data Streams launches On-demand
   Advantage mode", 04.11.2025; AWS Big Data Blog zur selben Ankündigung.*

2. **Enhanced Fan-out: die verbreitete Zahl 20 ist nicht mehr die einzige.**
   Seit dem 20.11.2025 unterstützen On-demand-Advantage-Streams bis zu 50
   Enhanced-Fan-out-Konsumenten. Die Feature-Seite nennt weiterhin bis zu 20
   mit eigenem Lesedurchsatz — das ist der Fall außerhalb von Advantage.
   **Beide Zahlen sind richtig, je nach Modus.** Genau deshalb steht auf der
   Karte keine Zahl, sondern nur „eigener Lesedurchsatz".
   *Quelle: AWS What's New, „Amazon Kinesis Data Streams now supports up to
   50 enhanced fan-out consumers", 20.11.2025; AWS Feature-Seite Kinesis Data
   Streams.*

3. **SQS FIFO: das In-Flight-Limit ist 120.000, nicht 20.000.** Es wurde im
   November 2024 von 20K auf 120K angehoben. Viele Cheat-Sheets und
   Kursfolien nennen noch die alte Zahl.
   *Quelle: AWS What's New, „Amazon SQS increases in-flight limit for FIFO
   queues from 20K to 120K", November 2024; AWS SQS Developer Guide,
   „Amazon SQS FIFO queue quotas".*

4. **SQS FIFO: „3.000 Nachrichten/Sekunde" ist keine Obergrenze mehr.**
   Ohne High-Throughput-Modus sind es 300 Operationen/Sekunde bzw. 3.000
   Nachrichten mit Batching; mit High-Throughput-Modus bis zu 70.000
   Nachrichten pro Sekunde ohne Batching und mehr mit Batching. Die
   Steigerung lief in mehreren Schritten seit 2021.
   *Quelle: AWS SQS FAQs; AWS News Blog, „Announcing throughput increase and
   dead letter queue redrive support for Amazon SQS FIFO queues".*

5. **AWS selbst zieht die Abgrenzung in der SQS-FAQ.** Dort steht, dass
   Kinesis Streams das Lesen und **erneute Abspielen** von Records durch
   mehrere Anwendungen erlaubt — das ist die Trennlinie dieser Karte,
   formuliert von der Quelle, gegen die geprüft wird.
   *Quelle: AWS SQS FAQs.*

## Nicht bestätigt

- **Preisbeträge.** Die AWS-Ankündigung nennt konkrete Beträge je GB für
  On-demand Advantage und eine Ersparnis von 60 % gegenüber On-demand
  Standard. Preise gehören nach der in Batch 10 gesetzten Regel **nicht auf
  die Karte** — sie ändern sich und sind kein Prüfungsstoff. Auf der Karte
  steht kein Betrag.
- **Der Schwellenwert „ab etwa 10 MB/s aggregiert lohnt Advantage"** stammt
  aus AWS-eigener Ankündigung und Blog, ist aber eine Empfehlung mit
  Kostencharakter, keine technische Grenze. Nicht auf der Karte.
- **Die Angabe, On-demand skaliere anhand des Durchsatz-Höchstwerts der
  letzten 30 Tage**, stammt aus einer Drittquelle (Medium, 2023) und wurde in
  der AWS-Doku nicht in dieser Form gegengeprüft. Nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Shards sind nicht gezeichnet.** Der Stream erscheint als eine Box. In
  Wirklichkeit besteht er aus Shards, und Enhanced Fan-out gibt Durchsatz
  **je Shard und Konsument**. Die Karte zeigt das Konsummodell, nicht die
  Kapazitätsstruktur.
- **Die Konsumenten sind als fachliche Rollen gezeichnet, nicht als
  Laufzeitumgebung.** Ob dahinter Lambda, KCL auf EC2 oder Managed Flink
  steckt, ist für die Abgrenzung zu SQS ohne Belang; die Orange-Färbung folgt
  der Konvention für die Reaktionsschicht.
- **Der Replay-Pfeil zeigt zurück auf den Stream.** Technisch fließen dabei
  keine Daten vom Konsumenten zum Stream — der Konsument setzt seinen
  Iterator zurück und liest erneut. Der Pfeil stellt die Absicht dar, nicht
  die Flussrichtung der Daten. Deshalb gestrichelt.
- **Der verworfene SQS-Pfad zeigt eine einzelne Queue.** Die realistische
  SQS-Variante wäre SNS mit drei Queues; sie ist im Text unter „Klassiker-
  Fallen" behandelt, aber nicht gezeichnet, weil die Karte sonst die falsche
  Architektur prominenter zeigt als die richtige.

## Farbkonventionen dieser Karte

- **Indigo #3B3B98 — NEUE KATEGORIE: Streaming-Transport.** Trägt Kinesis
  Data Streams. Semantik: Puffer mit Zeitachse — Daten liegen dort, bis ein
  Konsument sie holt, und bleiben danach liegen. Bewusst abgegrenzt von Teal
  (Regel- und Konfigurationsinstanz) und von Navy (Infrastruktur-
  Eintrittspunkt). Der Ton wurde gegen Dunkelblau #2E27AD (DynamoDB) geprüft
  und dunkler/grauer gewählt, um die Verwechslung zu vermeiden.
  **Von Oktay am 19.07.2026 freigegeben. Gilt ab hier auch für MSK (Karte 55).**
- **Pink #E7157B — Messaging-Familie**, wie SNS. Trägt hier SQS auf dem
  verworfenen Pfad.
- **Rot #C7161D — ausschließlich „verworfen".** Rand der SQS-Box
  (gestrichelt, weil abgelehnte Alternative) und das rote X auf dem Pfad
  dorthin.
- **Blau #2E6BE6 — externes System / Client.** Trägt das Shop-Frontend.
- **Orange #D97706 — Reaktionsschicht.** Trägt die drei Konsumenten und den
  Replay-Weg, der von einem Konsumenten ausgeht.
- **Grün #3F8624 — S3 und Datenbestände.** Unverändert.
- **Grau #9A9A9A — Zonenrahmen.** Gruppierung der Konsumenten, keine
  Semantik über den Dienst.
