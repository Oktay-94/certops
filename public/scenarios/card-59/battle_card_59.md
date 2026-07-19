---
nr: 59
title: "Betrugsmuster im Zahlungsstrom mit gleitenden Fenstern in Managed Service for Apache Flink"
services:
  - Amazon Managed Service for Apache Flink
  - Amazon Kinesis Data Streams
  - Amazon SNS
  - Amazon S3
domains:
  - D1
  - D3
signalwords:
  - "sliding window over the last five minutes, evaluated every minute"
  - "detect patterns across multiple events"
  - "events arrive out of order"
  - "exactly-once processing semantics"
  - "stateful stream processing"
  - "real-time anomaly detection"
  - "migrate away from a discontinued service"
assets:
  - battle_card_59.svg
  - battle_card_59.png
  - battle_card_59.pdf
status_note: |
  QC (scripts/qc.py): 0 Befunde.
  Gegenzaehlung R5: 9 Boxen gemeldet = 8 fachliche Boxen + 1 Footer-Rect. Das
  ist EINE WENIGER als bei den Karten 56–58, weil diese Karte acht statt neun
  Bausteine zeigt — beim Gegenzaehlen nicht mit den Vorgaengerkarten
  verwechseln. Die gestrichelte Zone (dasharray 4,4) zaehlt qc.py korrekt nicht
  mit. 59 Texte. 8 Segmente = 8 gezeichnete <path>-Pfeile, alle geradlinig.
  7 Badges, randlos und in Linienfarbe gefuellt. Keine weiss gefuellten Kreise
  mit Rand (R6 nicht einschlaegig).

  Korrekturrunden — alle DREI vor dem Zeichnen im Geometrieplan gefunden:
  (1) Boxtitel "Kinesis Data Streams" 241,6 px > 227 px Innenbreite. Gekuerzt
      auf "Kinesis Streams" (181,4 px); der volle Dienstname steht jetzt in der
      ersten Sachzeile "Data Streams, transportiert".
  (2) R16-Pruefung: Die Labels "sortiert" und "speist" ragten in die Boxen keyby
      bzw. pattern. Ursache: Der Korridor zwischen den Flink-Boxen war nur
      50 px breit und wurde von Badge 3 bzw. 7 zusaetzlich geteilt.
  (3) Der erste Loesungsversuch — kuerzere Woerter suchen — wurde VERWORFEN,
      weil er die Labels zu Fragmenten verstuemmelt haette ("je Zeit", "Zeit").
      Stattdessen LAYOUT VERBREITERT: keyby und pattern von x=750 auf x=790,
      sns und s3 von x=1120 auf x=1160, Zone von 660 auf 700 px Breite. Damit
      wuchs der Korridor von 50 auf 87,5 px. Zusaetzlich wurden alle vier
      betroffenen Labels von "neben dem Badge" auf "ueber dem Segment,
      zentriert" umgestellt — vertikale statt horizontaler Trennung, 9 px Luft
      zur Badge-Oberkante. Diese Loesung ist auf kuenftige Karten uebertragbar:
      Wo ein Korridor eng ist, gehoert das Label ueber das Segment, nicht daneben.
  Nach dem Zeichnen wurden keine Labels verschoben; Plangrenzen gingen
  unveraendert in die Zonendefinition (R15).

  Render-Sanity: 12 Freizonen aus der Elementgeometrie, **0 belegte Pixel im
  ERSTEN Durchgang, kein Nachschnitt** — zweite Karte in Folge nach Karte 58.
  Jede Zone wurde von vornherein gegen Label-Endkoordinaten, Badge-Aussenkanten
  (cy ± 15) und Segment-stroke (± 1,25) geschnitten.
  Alle fuenf Palettenfarben im PNG nachweisbar (blau 2191, teal 6804,
  pink 3076, grau 2152, Zonengrau 1830 px).

  Schwarz-Pruefung R13: 3814 dunkle Punkte im Sample, ausnahmslos im Titel
  (y 40..80) und im Footer-Merksatz (y 722..746) — beide laut Stil-Guide
  #111111. 0 Punkte ausserhalb. Kein schwarz gefuellter Pfad.

  R12-Gegencheck: 8 <path>-Elemente mit stroke, davon 8 mit fill="none".
  Erfuellt. Die drei Marker-<path> tragen fill und keinen stroke — korrekt.

  Footer von Hand gemessen: Merksatz 936,4 px bei 16 px bold (Grenze 1480),
  Zeile 2 791,9 px und Zeile 3 755,8 px bei 15 px. Zonenlabel
  "AMAZON MANAGED SERVICE FOR APACHE FLINK" 489,5 px, zentriert auf x=735 in
  einer 700 px breiten Zone (Innengrenzen 393..1077) — passt mit 97 px Reserve
  je Seite.

  Badge-Reihenfolge im SVG: Badge 7 steht in der Zeichenreihenfolge vor 5 und 6,
  weil es geometrisch zwischen den Flink-Boxen liegt. Die inhaltliche Nummerierung
  1–7 folgt dem Ablauf, nicht der Position im Dokument.

  Sichtpruefung: VERSUCHT, NICHT GELUNGEN. `view` gab ein leeres Bildobjekt
  zurueck. Damit 24. erfolgloser Versuch in Folge (R8). Diese Karte ist
  RECHNERISCH GEPRUEFT, ABER NICHT GESEHEN. Freigabe durch Oktay steht aus.
---

# Battle Card 59 — Managed Service for Apache Flink

## Szenario

Ein Zahlungsdienstleister verarbeitet Kartentransaktionen in **Kinesis Data
Streams**. Die Betrugsabwehr fordert eine Regel, die **ueber einzelne Ereignisse
hinweg** rechnet: Alarm, wenn eine Karte **in einem beliebigen
Fuenf-Minuten-Zeitraum mehr als fuenf Transaktionen** ausloest — geprueft **jede
Minute**, nicht nur zu vollen Fuenf-Minuten-Bloecken.

Zusaetzlich soll ein Alarm greifen, wenn dieselbe Karte innerhalb von zehn
Minuten in zwei weit entfernten Laendern auftaucht. Ereignisse treffen wegen
Netzverzoegerungen **nicht in der richtigen Reihenfolge** ein. Das Team hat eine
bestehende Loesung auf Kinesis Data Analytics for SQL — die **abgeschaltet
wurde**.

## Ablauf 1–7

**1 — Terminals → Kinesis Data Streams.** Die Zahlungsterminals schreiben jede
Transaktion in den Stream. Wichtig fuer das Verstaendnis der ganzen Karte:
Kinesis **transportiert und puffert**, es rechnet nichts. Die Reihenfolge bleibt
je Shard erhalten, aber zwischen den Shards und ueber die Netzwege hinweg kommen
die Ereignisse unsortiert an.

**2 — Kinesis → Flink.** Die Flink-Anwendung liest den Stream als Quelle. Ab hier
verlaesst die Verarbeitung die Ebene "ein Ereignis nach dem anderen" und beginnt,
Zustand zu halten.

**3 — Watermarks ordnen nach Ereigniszeit.** Flink arbeitet mit der Zeit, zu der
eine Transaktion **stattgefunden** hat, nicht mit der Zeit, zu der sie
**ankommt**. Watermarks sind die Aussage "alles vor diesem Zeitpunkt duerfte da
sein" und loesen die Fensterberechnung aus. Wer stattdessen Verarbeitungszeit
waehlt, ordnet eine verspaetete Transaktion dem falschen Fenster zu — und die
Betrugsregel rechnet falsch.

**4 — keyBy(Kartennummer) gruppiert den Zustand.** Jede Karte bekommt ihren
eigenen Zustand; die Verarbeitung laeuft trotzdem parallel. Der Zustand ist
dauerhaft und wird bei einem Neustart wiederhergestellt — Grundlage der
Exactly-once-Semantik.

**5 — Sliding Window: fuenf Minuten, ein Minute Versatz.** Das ist der Kern der
Karte. Alle sechzig Sekunden entsteht ein neues Fenster, das die letzten fuenf
Minuten umfasst; die Fenster **ueberlappen**, jedes Ereignis liegt in mehreren.
Damit wird die Regel "hoechstens fuenf Transaktionen in einem beliebigen
Fuenf-Minuten-Zeitraum" tatsaechlich lueckenlos geprueft.

**6 — Mustererkennung ueber Ereignisse hinweg.** Die Laenderregel braucht kein
Zeitfenster im engeren Sinn, sondern Zustand: Flink merkt sich das zuletzt
gesehene Land je Karte und schlaegt an, wenn innerhalb von zehn Minuten ein weit
entferntes zweites Land auftaucht. Ein Lambda-Konsument koennte das nicht — er
sieht immer nur ein Ereignis oder einen Stapel, ohne dauerhaften Zustand darueber
hinaus.

**7 — Ergebnisse: SNS und S3.** Treffer gehen sofort per SNS an die
Betrugsabwehr. Unabhaengig davon landen **alle** Ereignisse in S3, damit die
Revision spaeter per Athena nachvollziehen kann, warum ein Alarm ausgeloest wurde
— oder warum nicht.

## Pruefungs-Kernsatz

**Sobald ueber mehrere Ereignisse hinweg gerechnet werden muss — Fensteraggregate
oder Muster —, ist die Antwort Managed Service for Apache Flink. Kinesis und MSK
transportieren nur.**

## Abgrenzungen

**59 ↔ 51/52 (Kinesis Data Streams, Amazon Data Firehose).** Streams und Firehose
**bewegen** Daten. Flink **rechnet** ueber sie. Firehose kann pro Record
transformieren, aber keine Aggregation ueber ein Zeitfenster bilden und kein
Muster ueber mehrere Ereignisse erkennen.

**59 ↔ 55 (MSK).** Dieselbe Trennung: MSK ist der Transport (Kafka), Flink die
Rechenschicht darueber. Beide treten oft gemeinsam auf. Fragt das Szenario nach
"Kafka-kompatibel betreiben", ist es MSK; fragt es nach "Fensteraggregat" oder
"Muster", ist es Flink.

**59 ↔ Lambda.** Lambda ist der klassische Verfuehrer in dieser Frage, weil es
ebenfalls aus Kinesis liest. Es verarbeitet aber **je Ereignis oder je Stapel**,
ohne dauerhaften Zustand ueber die Aufrufe hinweg. Regeln der Form "X-mal
innerhalb von Y Minuten" oder "erst A, dann B" sind mit Lambda allein nicht
sauber umsetzbar.

**59 ↔ 60 (Redshift Serverless).** Redshift beantwortet Fragen ueber
**gespeicherte** Daten. Flink beantwortet Fragen ueber **fliessende** Daten,
bevor sie gespeichert sind. Steht "in real time" oder "as transactions occur" im
Text, ist Redshift die falsche Antwort.

## Klassiker-Fallen

**Falle 1 — Tumbling statt Sliding Window.** Die gefaehrlichste Falle dieser
Karte, weil beide Antworten plausibel klingen. Tumbling-Fenster sind fest und
ueberlappen nicht: Ein Betrueger verteilt zehn Transaktionen so ueber eine
Fenstergrenze, dass in keinem einzelnen Fenster mehr als fuenf liegen — der
Alarm bleibt aus. Formulierungen wie "in **any** five-minute period" oder
"evaluated every minute" verlangen ueberlappende Fenster.

**Falle 2 — Kinesis Data Analytics for SQL nennen.** Der Dienst ist zum
27.01.2026 **geloescht**, nicht nur abgekuendigt. Aeltere Kurse zeigen ihn
prominent als den einfachen SQL-Weg fuer Streaming-Analysen.

**Falle 3 — Verarbeitungszeit statt Ereigniszeit.** Wenn Ereignisse unsortiert
ankommen — und das steht ausdruecklich im Szenario —, fuehrt Verarbeitungszeit zu
falschen Fensterzuordnungen. Ereigniszeit plus Watermarks ist die richtige Wahl.

**Falle 4 — allowedLateness nicht gesetzt.** Der Standardwert ist **null**:
Elemente, die hinter dem Watermark eintreffen, werden **verworfen**. Kein Fehler,
keine Meldung — die Transaktion fehlt einfach in der Auswertung. Wer verspaetete
Daten braucht, muss `allowedLateness` setzen und kann sehr spaete Ereignisse
zusaetzlich ueber einen Side Output auffangen.

**Falle 5 — Lambda fuer zustandsbehaftete Regeln.** Siehe Abgrenzung oben. Die
Option ist in Pruefungsfragen fast immer dabei und fast immer falsch, wenn das
Szenario "ueber mehrere Ereignisse hinweg" verlangt.

## Faktencheck — Divergenzen zu aelterem Kursmaterial

**(1) Kinesis Data Analytics for SQL wurde zum 27.01.2026 abgeschaltet — die
Anwendungen werden geloescht.** AWS baute den Dienst ueber fuenfzehn Monate in
drei Stufen zurueck: ab **01.09.2025** keine Bugfixes mehr, ab **15.10.2025**
keine neuen Anwendungen, ab **27.01.2026** werden verbliebene Kundenanwendungen
geloescht; sie lassen sich weder starten noch betreiben, und der Support entfaellt.
Als Grund nennt AWS, dass Kunden die Flink-Angebote bevorzugen. Der Dienst war
seit **2021** auf den Marketing-Seiten, in der Konsole und in der Doku als
Legacy-Angebot markiert und erhielt in dieser Zeit weder neue Funktionen noch
neue Regionen.
**Das ist die wichtigste Divergenz dieser Karte**, weil Kursmaterial bis etwa
2023 Kinesis Data Analytics for SQL als den einfachen, SQL-basierten Weg fuer
Streaming-Analysen praesentiert — eine Option, die es nicht mehr gibt.
*Quellen: AWS-Dokumentation, "Amazon Kinesis Data Analytics for SQL Applications
discontinuation"; AWS Big Data Blog, "Migrate from Amazon Kinesis Data Analytics
for SQL to Amazon Managed Service for Apache Flink and Amazon Managed Service for
Apache Flink Studio", Oktober 2024; AWS-FAQ zu Kinesis Data Analytics for SQL.*

**(2) Der Dienst heisst seit dem 30.08.2023 anders.** Amazon Kinesis Data
Analytics wurde in **Amazon Managed Service for Apache Flink** umbenannt.
Kursmaterial vermischt beide Namen haeufig und legt nahe, "Kinesis Data
Analytics" sei ein Oberbegriff mit den zwei Varianten SQL und Flink. Tatsaechlich
ist die SQL-Variante abgeschaltet und die Flink-Variante traegt heute den neuen
Namen. **Merksatz fuer die Pruefung:** Taucht "Kinesis Data Analytics" in einer
Antwortoption auf, ist entweder der alte Name gemeint oder es ist eine Falle.
*Quelle: Hinweisblock im AWS Big Data Blog, Kategorie Kinesis Data Analytics.*

**(3) Fenstertypen — exakt, weil pruefungsrelevant.** Apache Flink kennt
**Tumbling** (feste Groesse, keine Ueberlappung, jedes Element in genau einem
Fenster), **Sliding** (feste Groesse mit Ueberlappung, ein Element in mehreren
Fenstern) und **Session** (keine feste Grenze, schliesst nach einer Lueckenzeit
ohne Ereignisse). Fuer Geschwindigkeitsregeln wie "hoechstens fuenf in fuenf
Minuten" ist Sliding die richtige Wahl, weil sonst ein Betrug ueber die
Fenstergrenze rutscht.
*Quellen: Apache-Flink-Dokumentation, "Windows" und "Timely Stream Processing".*

**(4) Allowed Lateness steht standardmaessig auf null.** Die Flink-Doku ist hier
eindeutig: Elemente, die hinter dem Watermark ankommen, werden per Voreinstellung
**verworfen**. Ein Fenster wird angelegt, sobald das erste zugehoerige Element
eintrifft, und erst entfernt, wenn das Watermark das Fensterende plus die
erlaubte Verspaetung ueberschreitet.
*Quelle: Apache-Flink-Dokumentation, "Windows" (Abschnitt Allowed Lateness).*

**(5) Was Managed Service for Apache Flink laut AWS mitbringt.** Natives
Skalieren, **Exactly-once-Semantik**, Mehrsprachigkeit einschliesslich SQL,
**ueber vierzig Quell- und Zielkonnektoren** sowie dauerhaften
Anwendungszustand. Der Hinweis auf SQL ist fuer die Pruefung nuetzlich: Der
SQL-Zugang ist nicht verschwunden, er lebt in Flink und Flink Studio weiter.
*Quelle: AWS-FAQ zu Kinesis Data Analytics for SQL, Abschnitt zur Einstellung.*

## Nicht bestaetigt

- Die Aussage, ein Betrueger koenne "zehn Transaktionen ueber eine
  Tumbling-Fenstergrenze verteilen und nie einen Alarm ausloesen", stammt aus
  einem Community-Beitrag, nicht aus AWS- oder Flink-Dokumentation. Die zugrunde
  liegende Mechanik — Tumbling-Fenster ueberlappen nicht, Sliding-Fenster schon —
  ist dagegen durch die Flink-Doku gedeckt. Auf der Karte steht deshalb nur die
  gesicherte Eigenschaft ("Tumbling waere lueckenhaft an der Grenze"), das
  Zahlenbeispiel bleibt dieser `.md` vorbehalten.
- Preise sind bewusst nicht genannt. Ein in den Suchergebnissen aufgetauchter
  KPU-Stundensatz stammt aus einer Drittquelle, betrifft den abgeschalteten
  SQL-Dienst und ist kein Pruefungsstoff.
- Zur genauen Umsetzung der Laenderregel (Flink CEP als Bibliothek gegenueber
  einer selbst geschriebenen ProcessFunction) wurde keine AWS-Quelle geprueft.
  Die Karte nennt deshalb nur "zustandsbehaftete Mustererkennung" ohne
  Bibliotheksnamen.

## Bewusste Vereinfachungen im Diagramm

- **Watermarks, keyBy, Sliding Window und Mustererkennung sind als vier Boxen
  gezeichnet.** Real sind das vier Schritte **einer** Flink-Anwendung, nicht vier
  Dienste. Die gestrichelte Zone haelt sie zusammen; die Aufteilung ist
  didaktisch, weil drei der fuenf Fallen an genau diesen Stellen sitzen.
- **Die Reihenfolge keyBy vor Sliding Window ist im Bild nur angedeutet.** Real
  wird zuerst gruppiert und dann gefenstert; das Diagramm zeigt beide Wege aus
  der oberen Reihe nach unten, ohne die Reihenfolge streng zu erzwingen.
- **Der Weg der Rohdaten nach S3 ist verkuerzt.** Real laeuft die Archivierung
  meist ueber Firehose direkt aus dem Stream, nicht durch die Flink-Anwendung.
  Im Diagramm ist es ein Pfeil aus dem Flink-Block, damit keine zusaetzliche
  Box noetig ist. **Diese Vereinfachung ist bewusst und fachlich unscharf** —
  wer die Karte spaeter verfeinert, sollte hier Firehose ergaenzen.
- **Kein Checkpointing gezeichnet.** Exactly-once beruht auf Checkpoints in einen
  dauerhaften Speicher; das steht nur als Sachzeile "durable state" in der
  keyBy-Box.
- **Zwei Regeln statt einer Regelsammlung.** Eine reale Betrugsabwehr hat
  Dutzende Regeln mit unterschiedlichen Fenstern; zwei genuegen, um den
  Unterschied zwischen Fensteraggregat und Zustandsmuster zu zeigen.

## Farbkonventionen dieser Karte

| Farbe | Bedeutung auf dieser Karte |
|---|---|
| Blau `#1F5C99` | Transport: Kinesis Data Streams und die Pfeile dorthin |
| Teal `#0F766E` | Flink-Verarbeitung: Watermarks, keyBy, Sliding Window, Muster |
| Pink `#B03060` | Ziele: SNS und S3 |
| Grau `#555555` | Externe Beteiligte: die Zahlungsterminals |
| Zonengrau `#888888` | Rahmen und Beschriftung der Flink-Zone |
| Gestrichelt `7,5` | Zahlungsterminals — ausserhalb von AWS |
| Gestrichelt `4,4` | Zonenrahmen Managed Service for Apache Flink |

**Anmerkung zu den Doppelbelegungen:** Teal ist auf dieser Karte **neu** und
ausschliesslich fuer die Flink-Verarbeitungsschritte reserviert. Blau traegt hier
Kinesis als **Transport** — auf Karte 57 trug Blau den EventBridge Scheduler als
**Ausloeser**. Beide Male ist es "etwas, das Daten oder Signale bewegt, ohne
selbst zu rechnen", die Zuordnung ist also verwandt, aber nicht identisch. Das
ist eine fuenfte offene Doppelbelegung und gehoert zu der Farbentscheidung, die
seit Karte 57 aussteht. Pink traegt hier wie auf den Karten 56 und 58 die
Konsumenten beziehungsweise Ziele — dort konsistent.
