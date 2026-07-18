---
nr: 16
title: "S3 File Gateway — Netzlaufwerk bleibt, Daten landen in S3"
services:
  - AWS Storage Gateway (Amazon S3 File Gateway)
  - Amazon S3
  - S3 Lifecycle / S3 Glacier Deep Archive
  - AWS Lambda
  - Amazon Athena
signalwords:
  - "Anwendung kann nicht umgeschrieben werden"
  - "NFS / SMB"
  - "lokales NAS ist voll"
  - "minimale Änderung an der Anwendung"
  - "Daten sollen als Objekte in S3 nutzbar sein"
  - "low-latency Zugriff auf die zuletzt genutzten Dateien"
domain: D2
domains_secondary: [D3, D4]
assets:
  png: battle_card_16.png
  pdf: battle_card_16.pdf
  svg: battle_card_16.svg
status_note: "Sichtprüfung des PNG durch Chat-Claude nicht möglich (Regel F9) — rechnerische QC bestanden (0 Befunde), Render-Sanity ok, visuelle Freigabe durch Oktay."
---

# Battle Card 16 — S3 File Gateway · Amazon S3

## Szenario

Das Ingenieurbüro **Nordwerk** (180 Mitarbeiter, Standort Hannover) konstruiert
Anlagenbau-Projekte in einer CAD-Umgebung mit vorgeschaltetem PDM-Server. Alle
Arbeitsplätze greifen seit fünfzehn Jahren auf das Netzlaufwerk `Z:\` zu — ein
NAS mit 40 TB, das zu 94 % voll ist. Ein neues NAS würde eine sechsstellige
Investition bedeuten, und die Projektdaten müssen nach Abschluss **zehn Jahre**
aufbewahrt werden, obwohl sie nach wenigen Monaten nie wieder geöffnet werden.

Die Anforderungen der Geschäftsführung:

- Die **CAD-Software darf nicht angefasst werden** — sie spricht ausschließlich
  SMB und kennt keine Objekt-APIs. Ein Rewrite auf das S3-SDK ist ausgeschlossen.
- Die Konstrukteure dürfen beim Öffnen der **aktuellen** Projekte keine
  spürbare Verzögerung bemerken.
- Abgeschlossene Projekte sollen automatisch in eine **billige Archivklasse**
  wandern.
- Die Qualitätssicherung möchte künftig per **Lambda und Athena** über die
  abgelegten Prüfprotokolle auswerten, ohne sie vorher zu exportieren.

Gesucht ist die AWS-Lösung, die den Dateizugriff unverändert lässt und die Daten
trotzdem als **native S3-Objekte** bereitstellt.

## Ablauf 1–6

**1 — Die Anwendung schreibt weiter über SMB.**
Der PDM-Server mountet keine neue Technologie, sondern eine SMB-Freigabe des
Gateways; `Z:\` zeigt jetzt dorthin. Für die CAD-Software ändert sich nichts —
sie sieht Ordner und Dateien, keine Buckets und keine Object Keys. Genau das ist
der Grund, warum File Gateway hier gewinnt: Der Protokollbruch zwischen Datei-
und Objektwelt wird **im Gateway** aufgelöst, nicht in der Anwendung. NFS v3 und
v4.1 stehen alternativ zur Verfügung, für Linux-Clients.

**2 — Der Write geht synchron in den lokalen Cache, der ACK kommt sofort.**
Das Gateway ist eine VM im eigenen Rechenzentrum (VMware ESXi, Hyper-V, KVM;
alternativ als Hardware-Appliance oder auf EC2). Es schreibt eingehende Daten
zuerst auf seine lokale Cache-Disk und bestätigt der Anwendung den Schreibvorgang
**bevor** irgendetwas die WAN-Leitung gesehen hat. Dadurch entkoppelt der Cache
die Anwendung von der Internet-Latenz und von Bandbreitenschwankungen — eine
CAD-Datei zu speichern fühlt sich weiter wie ein lokaler Vorgang an. Der Cache
kann bis zu **64 TB** groß sein und hält damit den kompletten aktiven
Projektbestand vor.

**3 — Der Upload nach S3 läuft asynchron, 1 Datei = 1 Objekt.**
Im Hintergrund überträgt das Gateway die Daten über HTTPS nach S3 — optimiert,
parallelisiert und bandbreitengedrosselt, wenn gewünscht. Entscheidend für die
Prüfung: Der **Dateipfad wird zum Object Key**. Aus
`Z:\projekte\2026\anlage-7\pruefprotokoll.pdf` wird das Objekt
`projekte/2026/anlage-7/pruefprotokoll.pdf`. Es entsteht **kein proprietäres
Format**, kein Container, kein Blob — deshalb ist jedes Objekt danach für jeden
AWS-Service direkt brauchbar. Verschlüsselt wird serverseitig mit SSE-S3,
SSE-KMS oder DSSE-KMS.

**4 — Beim Lesen greift der Read-Through-Cache.**
Öffnet ein Konstrukteur eine Datei, die im Cache liegt, kommt sie lokal und
sofort. Liegt sie nicht im Cache (altes Projekt), holt das Gateway sie
transparent aus S3 nach und legt sie im Cache ab. Der Anwender merkt davon nur
eine längere Ladezeit beim ersten Zugriff. Übertragen werden dabei nur die
tatsächlich angeforderten Teile, nicht zwingend die ganze Datei.

**5 — Eine Lifecycle-Regel schiebt Altprojekte ins Archiv.**
Die Kostenoptimierung passiert **im Bucket**, nicht im Gateway: Eine
S3-Lifecycle-Regel verschiebt Objekte, die älter als 90 Tage sind, nach S3
Glacier Deep Archive. Das ist der Punkt, an dem sich die zehnjährige
Aufbewahrungspflicht bezahlbar erfüllen lässt. Preis dafür: Ein Zugriff auf
archivierte Projekte braucht einen Restore und dauert Stunden — für ein
abgeschlossenes Projekt akzeptabel.

**6 — Lambda, Athena und SageMaker lesen die Objekte direkt.**
Weil Schritt 3 echte S3-Objekte erzeugt hat, kann ein Lambda-Trigger auf
`s3:ObjectCreated:*` reagieren, Athena per SQL über die Prüfprotokolle laufen und
SageMaker auf denselben Daten trainieren — **ohne Export, ohne zweite Kopie,
ohne Umformatierung**. Genau diese Fähigkeit fehlt bei Volume Gateway und Tape
Gateway, deren Daten in einem für AWS-Services unlesbaren Format liegen.

## Prüfungs-Kernsatz

> **S3 File Gateway = dauerhafter NFS/SMB-Mount auf einen S3-Bucket mit
> 1:1-Abbildung: 1 Datei = 1 Objekt, Dateipfad = Object Key. Der Write wird
> synchron aus dem lokalen Cache bestätigt und asynchron nach S3 hochgeladen.**

## Klassiker-Fallen

**Falle 1 — File Gateway vs. Volume Gateway vs. Tape Gateway.**
Alle drei heißen "Storage Gateway", lösen aber verschiedene Probleme. *File
Gateway* liefert **NFS/SMB** und legt **lesbare Objekte** in S3 ab. *Volume
Gateway* liefert **iSCSI-Blockgeräte** und legt EBS-Snapshots ab — das sind
keine Dateien in S3, sondern Blöcke. *Tape Gateway* emuliert eine **virtuelle
Tape Library (VTL)** für bestehende Backup-Software. Signalwort-Test: steht
"NFS", "SMB", "Fileserver" oder "die Daten sollen danach mit Athena/Lambda
nutzbar sein" in der Frage → File Gateway. Steht "iSCSI" oder "Blockspeicher" →
Volume Gateway. Steht "Backup-Software schreibt auf Bänder" → Tape Gateway.

**Falle 2 — File Gateway vs. DataSync (Abgrenzung zu Karte 73).**
DataSync ist ein **Kopier-Job**: Er synchronisiert NFS/SMB-Quellen nach
S3/EFS/FSx, geplant und inkrementell, und ist danach fertig. Die Anwendung
schreibt weiterhin auf das alte NAS. File Gateway ist ein **dauerhafter
Mount-Punkt**: Die Anwendung schreibt *in* AWS hinein, das lokale NAS wird
abgelöst. Signalwort: "wiederkehrende Synchronisation" → DataSync;
"Anwendung soll weiter auf ein Laufwerk schreiben" → File Gateway.

**Falle 3 — File Gateway vs. Snowball Edge (Abgrenzung zu Karte 17).**
Snowball Edge ist ein **einmaliger Massentransport** per Gerät, wenn die Leitung
für die Datenmenge zu langsam ist. Danach ist das Gerät weg. File Gateway ist
laufender Betrieb. Eine Frage, die *beide* Signalwörter enthält ("500 TB Altdaten
+ danach dauerhaft weiter über SMB arbeiten"), verlangt die **Kombination**:
Snowball für die Altdaten, File Gateway für den Dauerbetrieb.

**Falle 4 — Out-of-band-Änderungen im Bucket.**
Schreibt ein *anderer* Prozess direkt in den Bucket (nicht über das Gateway),
sieht der SMB-Client die neuen Objekte nicht automatisch — das Gateway muss
seinen Cache aktualisieren (automatische Cache-Aktualisierung oder
`RefreshCache`). Prüfungsformulierung: "Nutzer sehen die von der Lambda-Funktion
erzeugten Dateien nicht im Share." Die Antwort ist nie "Bucket neu mounten".

**Falle 5 — Der Cache ist kein Backup.**
Der lokale Cache ist ein Beschleuniger, keine Zweitkopie. Die Durability liefert
S3 (elf Neunen). Wer im Diagramm die Cache-Disk als "lokales Backup" verkauft,
hat die Architektur nicht verstanden — fällt die Gateway-VM aus, wird sie neu
deployt und der Cache füllt sich wieder aus S3.

## Bewusste Vereinfachungen im Diagramm

- **Der ACK an die Anwendung ist kein eigener Pfeil.** Er steckt in Schritt 2
  ("→ sofortiger ACK"). Ein Rückpfeil hätte den Schreibpfad optisch verdoppelt,
  ohne fachlich etwas hinzuzufügen.
- **Der lokale Cache ist als eigene Box gezeichnet**, obwohl er physisch eine
  Disk *derselben* Gateway-VM ist. Die Trennung dient der Erklärung des
  synchron/asynchron-Bruchs, nicht der Topologie.
- **Der Netzweg ist nicht dargestellt.** Ob der Upload über das Internet, über
  Site-to-Site VPN oder über Direct Connect (optional mit VPC Endpoint für S3)
  läuft, ist eine separate Entscheidung — siehe Karten 32 und 34.
- **IAM-Rolle, Gateway-Aktivierung und CloudWatch-Monitoring fehlen.** Sie sind
  betrieblich Pflicht, tragen aber zur Kernaussage der Karte nichts bei.
- **Die Lifecycle-Regel ist als Pfeil vom Bucket gezeichnet**, ist aber eine
  Bucket-Konfiguration und **kein Gateway-Feature** — das Gateway weiß nichts
  davon.
- **Die Box "Nicht verwechseln" hat bewusst keinen Pfeil.** Sie ist eine
  Abgrenzungslegende, kein abgelehnter Datenpfad; ein rotes X hätte einen
  Datenfluss suggeriert, den es nie gab.
