---
cardNumber: 19
slug: ebs-gp3-io2-block-express-fsr-payflow
title: "EBS gp3 vs. io2 Block Express — garantierte IOPS und schneller Restore"
services: ["Amazon EBS gp3", "Amazon EBS io2 Block Express", "EBS Snapshots", "Fast Snapshot Restore", "Amazon Data Lifecycle Manager", "AWS Backup"]
domains: ["D3", "D2", "D4"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html"
  - "https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html"
  - "https://docs.aws.amazon.com/ebs/latest/userguide/what-is-ebs.html"
  - "https://docs.aws.amazon.com/ebs/latest/userguide/volume-creation-credits.html"
  - "https://docs.aws.amazon.com/ebs/latest/userguide/snapshot-archive-considerations.html"
  - "https://aws.amazon.com/ebs/features/"
  - "https://aws.amazon.com/ebs/snapshots/faqs/"
---

## Die Grundidee zuerst

Stell dir zwei Verträge für dieselbe Werkhalle vor.

**Vertrag eins:** Du zahlst für Quadratmeter. Wie viele Arbeiter du beschäftigen
darfst, ergibt sich aus der Fläche — drei je zehn Quadratmeter, feste Formel.
Für Spitzen gibt es ein Guthabenheft: Solange Stempel drin sind, dürfen
zusätzliche Leute mitarbeiten. Ist es leer, stehen sie draußen. Du merkst das
nicht am Vertrag, sondern daran, dass die Halle langsam wird — genau dann, wenn
viel zu tun ist.

**Vertrag zwei:** Du zahlst Fläche und Personal getrennt. Zwölf Arbeiter kommen
ohne Aufpreis, zweihundert sind buchbar. Kein Guthabenheft, keine Rückstufung,
keine Überraschung um halb sechs.

Vertrag eins ist **gp2**. Vertrag zwei ist **gp3**.

Das ist die ganze Bewegung dieser Karte, und sie erklärt, warum Payflow zweimal
ausgefallen ist, ohne dass jemand etwas falsch konfiguriert hatte. Ein
4-TiB-gp2-Volume liefert rechnerisch 12.000 IOPS. Der Tagesdurchschnitt liegt
bei 12.000 IOPS. Auf dem Papier passt das. Um 17:30 Uhr braucht die Datenbank
22.000 IOPS, und die Differenz kam aus dem Guthabenheft — bis es leer war.

Der zweite Teil der Karte ist eine andere Sorte Erkenntnis. Sie betrifft nicht
die Leistung im Betrieb, sondern die Leistung **direkt nach einem Restore**. Und
sie ist die eigentliche Prüfungspointe, weil sie einer Intuition widerspricht:
Ein Volume kann verfügbar sein und trotzdem nicht leistungsfähig.

## Was es eigentlich ist

Ein EBS-Volume ist kein Gerät. Es ist ein Datensatz mit Leistungsparametern, die
du unabhängig voneinander setzt. So sieht die Entscheidung dieser Karte in der
API aus — zwei Aufrufe, ein Unterschied:

```json
// Die Reporting-Replica
{
  "VolumeType": "gp3",
  "Size": 4096,
  "Iops": 3000,
  "Throughput": 125,
  "AvailabilityZone": "eu-central-1a",
  "Encrypted": true
}

// Die Primary-Datenbank
{
  "VolumeType": "io2",
  "Size": 4096,
  "Iops": 24000,
  "AvailabilityZone": "eu-central-1a",
  "Encrypted": true,
  "MultiAttachEnabled": false
}
```

Lies die Felder einzeln, denn jedes ist eine Aussage.

`Iops` steht **neben** `Size`, nicht darin — das ist der Bruch mit gp2, wo es das
Feld gar nicht gibt, weil die Größe die IOPS bestimmt. `Throughput` ist bei gp3
ein eigenes Feld und bei io2 keines: io2 leitet den Durchsatz aus IOPS und
I/O-Größe ab. Und `Iops: 24000` bei erwarteten Spitzen von 22.000 ist bewusst
kein Punktlanden — Provisioned IOPS sind eine Obergrenze, die du dauerhaft
ziehen darfst, kein Ziel, das du treffen musst.

Auffällig ist, was **nicht** in diesen Blöcken steht: `io2` ohne den Zusatz
„Block Express". Block Express ist kein eigener Volume-Typ, den du bestellst. Es
ist die Architektur unter io2, und ob dein Volume sie nutzt, entscheidet die
Instanz, an der es hängt. Du kaufst io2 und bekommst Block Express, wenn die
Instanzgeneration passt.

## Der Weg durch die Karte

### Verworfen — bei gp2 bleiben (X-Kreis)

Der durchgestrichene Pfad ist der Status quo, und er ist nicht deshalb falsch,
weil gp2 alt ist. Er ist falsch, weil gp2 ein **anderes Leistungsmodell** hat.
gp2 koppelt drei IOPS an jedes GiB und bedient alles darüber aus Burst-Credits.
Ein Guthaben, das sich füllt, wenn du unter der Basislinie bleibst, und leert,
wenn du darüber gehst.

Payflows Lastprofil ist der Worst Case dafür: Der Tagesdurchschnitt liegt genau
auf der Basislinie, es gibt also kaum Nachfüllzeit, und die Spitze liegt fast
zweifach darüber. Das Guthaben reicht ein paar Minuten. Danach bricht die Latenz
ein, und zwar mitten in der Spitzenzeit. Das Bild dazu: Ein Sparbuch, von dem du
jeden Monat genau so viel abhebst, wie eingeht — bis eine große Rechnung kommt.

### 1 — Die Reporting-Replica bekommt gp3

Der Standardgriff, und hier reicht er vollständig. gp3 liefert
eine konstante Basisleistung von 3.000 IOPS, die im Speicherpreis enthalten ist;
zusätzliche IOPS bis maximal 80.000 sind gegen Aufpreis buchbar, im Verhältnis
500 IOPS je GiB Volumegröße. Das Maximum ist ab 160 GiB erreichbar. Der
Basisdurchsatz von 125 MiB/s ist ebenfalls enthalten, zusätzlicher Durchsatz bis
2.000 MiB/s im Verhältnis 0,25 MiB/s je provisionierter IOPS.

Zwei Sätze, die den gp2-Trick beerdigen: Du musst kein Volume mehr aufblasen, um
IOPS zu bekommen. Und gp3 nutzt keine Burst-Performance —
diese Volumes können ihre volle provisionierte Leistung unbegrenzt
halten.

Für die nächtlichen Auswertungen heißt das: 3.000 IOPS inklusive, keine Credits,
keine Rückstufung um vier Uhr morgens. Die Reporting-Replica ist groß und
unkritisch. Genau das Profil, für das man nicht extra zahlt.

### 2 — Die Primary-Datenbank bekommt io2 Block Express

Für die Primary sind zwei Anforderungen ausschlaggebend, und **beide** liegen
außerhalb dessen, was gp3 zusagt.

Die erste ist Latenz-Konstanz. io2 Block Express ist auf eine
durchschnittliche Latenz unter 500 Mikrosekunden für 16-KiB-I/Os ausgelegt und
liefert bessere Ausreißerlatenzen als General-Purpose-Volumes — I/Os über 800
Mikrosekunden treten über zehnmal seltener auf. Der zweite Halbsatz ist
der wichtige. Payflows SLA ist ein p99-Wert. Bei einem p99 ist nicht der
Durchschnitt das Problem, sondern das oberste Prozent. Genau dafür zahlt man
bei io2 — nicht für schnellere Durchschnitte, für weniger Ausreißer.

Die zweite ist Durability. io2 Block Express bietet 99,999 %
Durability bei einer jährlichen Ausfallrate von 0,001 %; die übrigen
Volume-Typen liegen bei 99,8 % bis 99,9 % mit einer Ausfallrate von 0,1 % bis
0,2 %. Das ist ein Faktor von rund hundert — bei einer
Transaktionsdatenbank eines Zahlungsdienstleisters ist das kein Feinschliff,
sondern ein Argument, das man aufschreiben kann.

Der Kopfraum kommt dazu: 256.000 IOPS, 4.000 MiB/s, 64 TiB je Volume.

### 3 — Täglich ein EBS Snapshot

Der Zeitplan läuft über den **Amazon Data Lifecycle Manager** oder über AWS
Backup, wenn mehrere Services zentral gesichert werden sollen. Die Prüfung kennt
beide: DLM ist EBS-nah, AWS Backup die serviceübergreifende Klammer.

Snapshots sind **inkrementell** — nur geänderte Blöcke werden neu gespeichert.
Trotzdem ist jeder für sich vollständig wiederherstellbar: Du kannst einen alten
löschen, ohne die neueren zu beschädigen. AWS verwaltet die Blockreferenzen, du
siehst nur vollständige Snapshots.

Der entscheidende Satz steht klein in der Box: **regional, AZ-unabhängig.** Ein
Volume lebt in genau einer Availability Zone. Ein Snapshot nicht. Aus ihm
entsteht in jeder AZ der Region ein neues Volume, und per Copy in jeder anderen
Region. Das ist der DR-Wert von Snapshots — nicht die Sicherung gegen
Datenverlust, sondern die **Beweglichkeit über AZ-Grenzen**.

### 4 — Fast Snapshot Restore einschalten

Hier liegt die Pointe. Ein aus einem Snapshot erzeugtes Volume ist sofort
verfügbar, aber nicht sofort schnell. Die Blöcke werden **lazy** aus dem
Snapshot-Speicher nachgeladen; der erste Zugriff auf jeden Block zahlt den
Nachladeweg.

Das Bild dazu: Du ziehst um, alle Kartons stehen in der neuen Wohnung. Die ist
bezugsfertig — du kannst rein. Aber jedes Mal, wenn du eine Gabel brauchst,
musst du erst einen Karton öffnen. Für ein 4-TiB-Volume sind diese zwei Wochen
Auspacken eine gute Stunde zähen Betriebs — und Payflows Vorgabe lautet: binnen
30 Minuten **mit voller Leistung**, „läuft schon, ist aber noch langsam" gilt
als Ausfall.

**Fast Snapshot Restore** erzeugt vollständig initialisierte Volumes, die ab der
ersten Sekunde die provisionierte Leistung liefern. FSR muss
explizit pro Snapshot aktiviert werden. Erzeugt man einen neuen Snapshot von
einem Volume, das aus einem FSR-aktivierten Snapshot wiederhergestellt wurde, ist
der neue Snapshot nicht automatisch FSR-aktiviert. Das ist der Grund, warum
FSR auf der Karte einen eigenen Badge hat und keine Zeile in der Snapshot-Box
ist: Es ist eine Einschaltentscheidung, kein Serviceverhalten.

Abgerechnet wird pro **DSU-Stunde**, je Snapshot und je Availability Zone. Wer
FSR auf alle täglichen Snapshots in drei AZs legt, zahlt es dreißigfach für
einen Nutzen, der einmal im Jahr eintritt.

### 5 — Restore in die Ziel-AZ

Im Störfall entsteht aus dem FSR-aktivierten Snapshot ein neues
io2-Block-Express-Volume in der gewünschten AZ, das sofort seine 22.000 IOPS
bringt. Instanz starten, Volume anhängen, Datenbank hochfahren.

Und hier kommt eine Grenze, die die Karte nur andeutet.
Es gibt einen Credit-Bucket je Snapshot und je Availability
Zone. Jedes Volume, das du aus einem FSR-aktivierten Snapshot erzeugst,
verbraucht ein Credit. Mindestens ein Credit muss im Bucket sein, um ein
initialisiertes Volume zu erhalten — ist weniger als eines vorhanden, entsteht
das Volume ohne FSR-Vorteil. Kein Fehler, keine Meldung. Nur ein langsames
Volume.

### Der Entscheidungskasten — wann io2 statt gp3

Der graue Kasten ist die Kurzfassung für die Prüfung: Mindestens eine der vier
Bedingungen muss zutreffen — mehr IOPS als gp3 liefert, konstante
sub-Millisekunden-Latenz, 99,999 % Durability, oder Multi-Attach. Trifft keine
zu, ist gp3 die Antwort, und zwar deutlich billiger.

io1 steht dort als Vorgänger: auf 99,8 % bis 99,9 % Durability ausgelegt, io2
dagegen auf 99,999 %. Bei vergleichbarem Preis je IOPS gibt es keinen Grund, io1
neu anzulegen.

## Die entscheidende Unterscheidung

| | **gp3** | **io2 Block Express** |
|---|---|---|
| Basisleistung | 3.000 IOPS + 125 MiB/s inklusive | keine, alles provisioniert |
| Maximum je Volume | 80.000 IOPS · 2.000 MiB/s | 256.000 IOPS · 4.000 MiB/s |
| IOPS-Verhältnis zur Größe | max. 500 IOPS je GiB | max. 1.000 IOPS je GiB |
| Größe | 1 GiB – 16 TiB | 4 GiB – 64 TiB |
| Durability | 99,8–99,9 % | 99,999 % |
| Latenzzusage | einstellige Millisekunden | Ø unter 500 µs bei 16 KiB |
| Multi-Attach | nicht unterstützt | bis 16 Nitro-Instanzen, dieselbe AZ |
| Burst | keiner, dauerhaft volle Leistung | keiner |

Die Zeile, die Prüfungsfragen entscheidet, ist nicht das IOPS-Maximum. Es ist
**Multi-Attach**: Es gibt keine gp3-Variante davon. Steht „ein Volume an
mehreren Instanzen" im Fragetext, ist gp3 raus, ohne dass über Leistung geredet
werden muss.

## Die ehrliche Feinheit

**Archivierte Snapshots sind keine inkrementellen Snapshots mehr.** Die Karte
sagt oben „inkrementell — nur geänderte Blöcke" und weiter unten „Snapshot
Archive". Beides stimmt, aber nicht gleichzeitig für dasselbe Objekt.
Archivierte Snapshots sind immer Voll-Snapshots. Ein
Voll-Snapshot enthält alle Blöcke, die zum Zeitpunkt der Erstellung auf das
Volume geschrieben waren, und ist damit wahrscheinlich größer als der
inkrementelle Snapshot, aus dem er entstanden ist. Wer einen 200-GiB-Snapshot
archiviert, der inkrementell nur 12 GiB belegte, zahlt im Archiv für 200 GiB.
Der Archiv-Tarif ist billiger je GB, die GB-Zahl aber größer. Bei kleinen
Inkrementen kann Archivieren teurer sein als Liegenlassen.

**Die Mindestlaufzeit ist eine Kostenfalle, keine technische Sperre.**
Die Mindest-Archivdauer beträgt 90 Tage; löschst oder holst du
einen archivierten Snapshot vorher dauerhaft zurück, werden die Resttage im
Archiv-Tier berechnet, auf die Stunde gerundet. Und für die Rückholdauer
gibt es zwei AWS-Formulierungen, die sich ergänzen statt widersprechen: Der EBS
User Guide nennt bis zu 72 Stunden, abhängig von der
Snapshot-Größe, die EBS-FAQ nennt typischerweise 24 bis
72 Stunden, abhängig von Größe und weiteren Faktoren. Für die Prüfung
reicht die Größenordnung: Archiv ist Tagesgeschäft, nicht Störfallgeschäft.

**Die FSR-Credits sind bei großen Volumes bitter.** Die Doku gibt die Formel an,
und angewandt auf Payflow ergibt sie etwas Unangenehmes:
Bucketgröße und Nachfüllrate richten sich nach der
Snapshot-Größe, also der Größe des Quell-Volumes, nicht nach der Datenmenge im
Snapshot. Bei einem 4-TiB-Volume — 4096 GiB — liefert die Formel
`MAX(1, MIN(10, 1024 ÷ 4096))` genau **ein Credit pro Stunde**, und der Bucket
hält maximal ein Credit. Ein Sofort-Volume je Stunde je AZ. Für einen einzelnen
Datenbank-Restore genügt das. Für einen Massen-Restore nach einem AZ-Ausfall
nicht, und das merkt man erst im Störfall.

**„Sub-Millisekunde" ist ein Durchschnitt, kein SLA.** Die 500 Mikrosekunden
sind ein Auslegungswert für 16-KiB-I/Os. Bei größeren I/O-Größen verschiebt sich
das, und AWS gibt keine garantierte Obergrenze. Die belastbare Aussage ist die
über die Ausreißer, nicht die über den Mittelwert.

**Ein Prüfungsstand, der vom Doku-Stand abweicht.** Die Karte nennt 80.000 IOPS
als gp3-Maximum, und das ist der aktuelle Stand des EBS User Guide. Älteres
Kursmaterial und viele Prüfungsfragen rechnen weiterhin mit 16.000 IOPS und
1.000 MiB/s. Dieser Wert ist nicht falsch, sondern nur enger:
Auf Outposts unterstützt gp3 Größen bis 16 TiB, IOPS bis
16.000 und Durchsatz bis 1.000 MiB/s. Behandelt eine Frage 16.000 als
gp3-Obergrenze, kreuze das an — die Argumentationslogik dahinter (io2 bei
sub-ms, Durability, Multi-Attach) ändert sich dadurch nicht.

## Syntax lesen

Die FSR-Credit-Formel ist die einzige Stelle dieser Karte, an der du rechnen
musst. Sie steht so in der Doku:

```
Nachfüllrate pro Stunde = MIN (10, (1024 ÷ Snapshot-Größe in GiB))
Bucket-Maximum          = MAX (1, Nachfüllrate)

      1024  ──────────► fester Zähler, in GiB
         ÷
    Größe   ──────────► Größe des QUELL-VOLUMES, nicht der Daten
         │
    MIN(10, …) ───────► Deckel: nie mehr als 10 Credits/Stunde
         │
    MAX(1, …)  ───────► Boden: nie weniger als 1 Credit
```

Drei Beispiele, damit die Kurve sichtbar wird:

- **128 GiB:** `1024 ÷ 128 = 8` → 8 Credits/Stunde, Bucket 8
- **1024 GiB:** `1024 ÷ 1024 = 1` → 1 Credit/Stunde, Bucket 1
- **4096 GiB:** `1024 ÷ 4096 = 0,25` → durch den Boden auf 1 Credit/Stunde

Die Formel belohnt kleine Volumes. Genau bei den großen Datenbanken, bei denen
Lazy-Loading am meisten schmerzt, ist der Durchsatz an Sofort-Volumes am
geringsten.

## Was du dadurch nicht baust

- **Keine Hochverfügbarkeit.** Das io2-Volume liegt in einer AZ. Fällt die AZ
  aus, ist die Datenbank weg, und der Snapshot ist ein Restore-Weg, kein
  Failover.
- **Kein RPO unter 24 Stunden.** Zwischen zwei täglichen Snapshots liegen
  vierundzwanzig Stunden möglicher Datenverlust. Wer weniger braucht, braucht
  Replikation — RDS Multi-AZ, Aurora, oder Logversand auf Anwendungsebene.
- **Keine Point-in-Time-Recovery.** Snapshots sind diskrete Zeitpunkte. „Stand
  von 14:37 Uhr" gibt es damit nicht.
- **Kein gemeinsames Dateisystem.** Multi-Attach hängt dasselbe Blockgerät an
  mehrere Instanzen. Ohne cluster-fähiges Dateisystem zerstören sich zwei
  Schreiber gegenseitig die Daten. io2 Block Express
  unterstützt Multi-Attach mit I/O-Fencing für bis zu sechzehn Nitro-basierte
  EC2-Instanzen innerhalb derselben Availability Zone. I/O-Fencing ist ein
  Baustein für Cluster-Software, kein Ersatz dafür.
- **Keine anwendungskonsistente Sicherung.** Ein Snapshot friert Blöcke ein,
  nicht Transaktionen — ein Crash-konsistenter Stand, aus dem PostgreSQL zwar
  recovert, der aber keinen abgestimmten Backup-Lauf ersetzt.

## Wenn du dir eine Sache merkst

**gp3 ist der Default, io2 Block Express die Ausnahme mit Begründung — und ein
Restore ohne Fast Snapshot Restore ist verfügbar, aber nicht leistungsfähig.**

Warum gp2 hier verliert: Es koppelt IOPS an die Größe und bedient Spitzen aus
Credits. Payflows Durchschnitt liegt auf der Basislinie — das Guthaben füllt
sich nie auf.

Warum „größeres gp3-Volume" hier verliert: Bei gp3 bucht man IOPS separat.
Vergrößern kostet Geld und bringt keine IOPS.

Warum „größere Instanz" nach dem Restore verliert: Der Engpass ist das
Lazy-Loading im Volume, nicht die Rechenleistung.

## Prüfungsknackpunkte

**Signalwörter für io2 Block Express:** „garantierte", „vorhersagbare" oder
„konsistente" IOPS · „sub-Millisekunden-Latenz" · „höchste Durability für eine
Datenbank" · „Volume an mehrere Instanzen" · „mehr als 64.000 IOPS".

**Signalwörter für gp3:** „Kosten senken bei gleicher Leistung" · „gp2
migrieren" · „IOPS unabhängig von der Größe".

**Signalwörter für FSR:** „nach dem Restore stundenlang langsam" · „muss sofort
volle Leistung bringen".

**Warum „Snapshot statt Multi-AZ" verliert:** Ein Snapshot ist ein Backup, keine
Replikation. Auf „AZ-Ausfall ohne Datenverlust" antwortet nur synchrone
Replikation.

**Warum „io2 statt FSR" verliert:** Die Volume-Klasse bestimmt die Leistung nach
der Initialisierung. Der lahme Restore kommt vom Nachladen, und den behebt kein
Volume-Typ.

**Warum „Snapshot Archive" im Störfall verliert:** Mindestens 90 Tage
Bindung und bis zu 72 Stunden Rückholzeit. Archiv ist für die Revision, nicht
für den Wiederanlauf.

**Warum „Multi-Attach statt EFS" verliert:** Multi-Attach ist Blockzugriff in
**einer** AZ und braucht Cluster-Software. „Mehrere Server brauchen dasselbe
Dateisystem" ist EFS.

**Warum „gp3 mit 100.000 IOPS" verliert:** Das Maximum liegt bei 80.000 IOPS je
Volume. Darüber führt der Weg über io2 Block Express oder über RAID 0 aus
mehreren Volumes.
