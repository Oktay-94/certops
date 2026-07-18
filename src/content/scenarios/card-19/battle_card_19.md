---
nr: 19
title: "EBS gp3 vs. io2 Block Express — garantierte IOPS und schneller Restore"
services:
  - Amazon EBS gp3
  - Amazon EBS io2 Block Express
  - EBS Snapshots
  - Fast Snapshot Restore (FSR)
  - Amazon Data Lifecycle Manager / AWS Backup
signalwords:
  - "garantierte / vorhersagbare IOPS"
  - "sub-Millisekunden-Latenz"
  - "konsistente Performance, keine Burst-Credits"
  - "höchste Durability für eine Datenbank"
  - "Volume an mehrere Instanzen (Multi-Attach)"
  - "Restore muss sofort volle Leistung bringen"
domain: D3
domains_secondary: [D2, D4]
assets:
  png: battle_card_19.png
  pdf: battle_card_19.pdf
  svg: battle_card_19.svg
status_note: "Sichtprüfung des PNG durch Chat-Claude nicht möglich (Regel F9) — rechnerische QC bestanden (0 Befunde), Render-Sanity ok. Faktencheck 18.07.2026 gegen EBS-Features-Seite und EBS-User-Guide."
---

# Battle Card 19 — EBS gp3 vs. io2 Block Express · Snapshots

## Szenario

Der Zahlungsdienstleister **Payflow** betreibt seine Transaktionsdatenbank als
**selbst verwaltetes PostgreSQL auf EC2** — nicht auf RDS, weil zwei
Spezial-Extensions gebraucht werden, die RDS nicht anbietet. Die Kennzahlen:

- **4 TiB** Datenbestand, OLTP-Profil, viele kleine zufällige Schreibvorgänge.
- Tagesmittel **12.000 IOPS**, Lastspitzen um 17:30 Uhr bei **22.000 IOPS**.
- SLA gegenüber den Händlern: **p99-Antwortzeit unter 10 ms**.
- Aufsichtsrechtlich: **tägliches Backup**, und im Störfall muss die Datenbank
  binnen 30 Minuten wieder **mit voller Leistung** laufen — "läuft schon, ist
  aber noch langsam" gilt als Ausfall.

Heute liegt alles auf einem **gp2**-Volume mit 4 TiB. Das liefert rechnerisch
12.000 IOPS (3 IOPS pro GiB), aber die Spitzen werden aus dem Burst-Guthaben
bedient — und wenn das Guthaben leer ist, fällt die Datenbank auf die
Basisleistung zurück. Genau das ist zweimal passiert, jeweils zur Spitzenzeit.

Zusätzlich gibt es eine **Reporting-Replica**, auf der nachts Auswertungen
laufen: unkritisch, tolerant gegenüber Latenzausreißern, aber groß.

## Ablauf 1–5

**1 — Die Reporting-Replica bekommt gp3.**
gp3 ist der Standardgriff und hier völlig ausreichend. Der entscheidende
Unterschied zu gp2: Bei gp3 sind **IOPS, Durchsatz und Kapazität voneinander
entkoppelt**. Jedes gp3-Volume bringt unabhängig von seiner Größe **3.000 IOPS
und 125 MiB/s inklusive**; mehr wird gegen Aufpreis dazugebucht (Doku-Stand
2026: bis **80.000 IOPS und 2.000 MB/s**). Man muss also kein Volume mehr
künstlich vergrößern, nur um IOPS zu bekommen — der klassische gp2-Trick, der
Geld verbrennt. Und: **gp3 hat kein Burst-Modell**, die Leistung ist konstant.

**2 — Die Primary-Datenbank bekommt io2 Block Express.**
Für die Primary sind zwei Anforderungen ausschlaggebend, die gp3 nicht sauber
erfüllt: die **Latenz-Konstanz** (io2 Block Express liegt im Mittel unter
500 µs für 16-KiB-I/Os und hat deutlich weniger Ausreißer) und die
**Durability von 99,999 %** — hundertfach besser als die 99,8–99,9 % von gp3.
Dazu kommt der Kopfraum: bis **256.000 IOPS, 4.000 MB/s und 64 TiB** pro
Volume. Für einen Zahlungsdienstleister mit p99-SLA ist nicht die
Durchschnittsleistung das Problem, sondern der Ausreißer — und genau dafür
zahlt man bei io2.

**3 — Täglich ein EBS Snapshot.**
Der Zeitplan läuft über den **Amazon Data Lifecycle Manager** (oder AWS Backup,
wenn man mehrere Services zentral sichern will). Snapshots sind
**inkrementell**: Nur die seit dem letzten Snapshot geänderten Blöcke werden neu
gespeichert; trotzdem ist **jeder Snapshot für sich vollständig
wiederherstellbar** — man kann einen alten Snapshot löschen, ohne die neueren zu
beschädigen. Snapshots liegen **regional**, nicht in einer AZ. Das ist der
eigentliche DR-Wert: Ein Volume lebt in genau einer AZ, ein Snapshot lässt sich
in **jeder** AZ der Region (und per Copy in jeder anderen Region) zu einem neuen
Volume machen.

**4 — Fast Snapshot Restore einschalten.**
Hier liegt die eigentliche Prüfungspointe. Ein aus einem Snapshot erzeugtes
Volume ist **sofort verfügbar, aber nicht sofort schnell**: Die Blöcke werden
**lazy** aus dem Snapshot-Speicher nachgeladen, und der erste Zugriff auf jeden
Block ist deutlich langsamer. Für ein 4-TiB-Datenbankvolume heißt das: Die
Datenbank ist nach zwei Minuten "oben" und danach eine Stunde lang zäh — was das
30-Minuten-SLA reißt. **Fast Snapshot Restore** erzeugt vollständig
initialisierte Volumes, die **ab der ersten Sekunde die provisionierte Leistung
liefern**. FSR wird **pro Snapshot und pro AZ** aktiviert und **pro DSU-Stunde
abgerechnet** — es ist teuer, deshalb aktiviert man es gezielt für die
DR-relevanten Snapshots und Ziel-AZs, nicht pauschal.

**5 — Restore in die Ziel-AZ.**
Im Störfall entsteht aus dem FSR-aktivierten Snapshot ein neues
io2-Block-Express-Volume in der gewünschten AZ, das sofort seine 22.000 IOPS
bringt. Die Instanz wird gestartet, das Volume angehängt, die Datenbank fährt
hoch. Wichtig: FSR hat ein **Credit-Guthaben je AZ**, das begrenzt, wie viele
Volumes pro Minute sofort-initialisiert erzeugt werden können — bei einem
Massen-Restore muss man das einplanen.

**Verworfen — bei gp2 bleiben.**
Der durchgestrichene Pfad: gp2 koppelt IOPS an die Größe (3 IOPS/GiB) und
bedient alles darüber aus Burst-Credits. Läuft das Guthaben leer, bricht die
Latenz ein — genau das Verhalten, das die beiden Störungen verursacht hat. gp2
ist kein "billigeres gp3", sondern ein anderes Leistungsmodell.

## Prüfungs-Kernsatz

> **gp3 ist der Standard: 3.000 IOPS Basis, IOPS und Durchsatz unabhängig von
> der Größe buchbar. io2 Block Express nimmt man nur, wenn eines davon
> gefordert ist: mehr IOPS als gp3 kann, konstante sub-ms-Latenz, 99,999 %
> Durability oder Multi-Attach. Und: Ein Restore ohne FSR ist verfügbar, aber
> nicht leistungsfähig.**

## Klassiker-Fallen

**Falle 1 — "Mehr IOPS brauche ich, also größeres Volume."**
Das gilt für **gp2** (3 IOPS/GiB) und ist bei **gp3 falsch**. Bei gp3 bucht man
IOPS separat. Antwortoptionen, die ein gp3-Volume vergrößern, um IOPS zu
gewinnen, sind Distraktoren — sie kosten Geld ohne Wirkung.

**Falle 2 — "Verfügbar" ist nicht "leistungsfähig" (FSR).**
Die häufigste Formulierung: "Nach dem Restore aus dem Snapshot ist die Datenbank
für mehrere Stunden langsam. Was tun?" Falsche Antworten: größere Instanz,
mehr IOPS provisionieren, io2 statt gp3. Richtige Antwort: **Fast Snapshot
Restore** (bzw. das Volume vorher initialisieren). Der Engpass ist das
Lazy-Loading, nicht die Volume-Konfiguration.

**Falle 3 — io1 vs. io2 vs. io2 Block Express.**
**io1** ist die Vorgängergeneration: maximal 64.000 IOPS, Durability wie gp3
(99,8–99,9 %). **io2** bringt 99,999 % Durability bei gleichem Preis pro IOPS
wie io1 — es gibt praktisch keinen Grund mehr, io1 neu anzulegen.
**Block Express** ist die Architektur darunter, die io2 auf 256.000 IOPS,
4.000 MB/s und 64 TiB hebt. Wenn eine Frage "höchste Durability für ein
Blockvolume" sagt, ist io2 gemeint — nicht gp3, und nicht S3.

**Falle 4 — Snapshots sind kein Multi-AZ-Ersatz.**
Ein Snapshot ist ein **Backup**, keine Replikation. Zwischen zwei Snapshots
liegt ein RPO von 24 Stunden. Wer "Ausfall einer AZ ohne Datenverlust" braucht,
kommt mit Snapshots nicht hin, sondern braucht synchrone Replikation
(RDS Multi-AZ, Aurora, oder Anwendungsebene) — siehe Karten 22 und 81.

**Falle 5 — Multi-Attach ist kein Cluster-Dateisystem.**
io2 unterstützt Multi-Attach an bis zu 16 Nitro-Instanzen **in derselben AZ**.
Das ersetzt kein EFS: Ohne ein cluster-fähiges Dateisystem (z. B. GFS2) zerstören
sich zwei Instanzen gegenseitig die Daten. Signalwort "mehrere Server brauchen
dasselbe Dateisystem" → **EFS** (Karte 13), nicht Multi-Attach.

**Falle 6 — Snapshot Archive ist kein Schnellzugriff.**
Für Snapshots, die man aus Aufbewahrungsgründen jahrelang hält, gibt es die
Archive-Stufe: deutlich billiger, aber **Mindestlaufzeit 90 Tage** und
**Restore-Dauer 24–72 Stunden**. Ein Archive-Snapshot taugt für die Revision,
nicht für den Störfall.

## Bewusste Vereinfachungen im Diagramm

- **gp3 und io2 sind als "Auswahl" gezeichnet, nicht als zwei gleichzeitig
  angehängte Volumes.** Real hängen an der Primary-Instanz mehrere Volumes
  (Boot, Daten, WAL); das Diagramm zeigt die Typ-Entscheidung, nicht das
  Volume-Layout.
- **Die Reporting-Replica hat keine eigene Instanz-Box.** Sie ist über den
  gp3-Pfad angedeutet; eine zweite EC2-Box hätte die Karte um eine Aussage
  erweitert, die nicht ihr Thema ist.
- **Der Snapshot-Speicher ist als ein Kasten gezeichnet.** Technisch liegen
  EBS-Snapshots in einem von AWS verwalteten S3-Speicher, der **nicht** in den
  eigenen Buckets sichtbar ist — deshalb bewusst kein S3-Symbol.
- **Snapshot Archive hat keine eigene Box**, sondern steht als Zeile im
  Snapshot-Kasten. Es ist eine Speicherstufe desselben Objekts, kein eigener
  Knoten im Datenfluss.
- **Die Ziel-AZ des Restores ist nicht gezeichnet.** Der Rückpfeil zeigt auf das
  io2-Volume, obwohl real ein **neues** Volume in einer möglicherweise anderen AZ
  entsteht. Ein AZ-Raster hätte die Karte überladen; die AZ-Logik steht im
  Snapshot-Kasten ("regional, AZ-unabhängig").
- **Die Zahlen 80.000 IOPS / 2.000 MB/s für gp3 sind der aktuelle Doku-Stand.**
  Ältere Prüfungsfragen und Kursmaterialien rechnen weiterhin mit **16.000 IOPS
  und 1.000 MiB/s** — dieser Wert gilt heute noch für gp3 **auf Outposts**. Wenn
  eine Prüfungsfrage die 16.000 als gp3-Obergrenze behandelt, ist das die
  erwartete Antwort; die Argumentationslogik (io2 bei sub-ms, Durability,
  Multi-Attach) bleibt in beiden Fällen dieselbe.
