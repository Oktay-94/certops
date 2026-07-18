---
nr: 17
title: "Snowball Edge — 500 TB, wenn die Leitung zu langsam ist"
services:
  - AWS Snowball Edge Storage Optimized (210 TB)
  - AWS OpsHub
  - Amazon S3
  - AWS KMS
  - AWS DataSync
signalwords:
  - "Petabyte / hunderte Terabyte"
  - "begrenzte Bandbreite"
  - "die Übertragung würde Monate dauern"
  - "harte Deadline / Rechenzentrum wird geschlossen"
  - "einmalige Migration"
  - "physischer Transport"
domains: [D3, D4, D1]
assets:
  png: battle_card_17.png
  pdf: battle_card_17.pdf
  svg: battle_card_17.svg
status_note: "Sichtprüfung des PNG durch Chat-Claude nicht möglich (Regel F9) — rechnerische QC bestanden (0 Befunde), Render-Sanity ok. Faktencheck 18.07.2026: Snow Family seit 07.11.2025 nur noch für Bestandskunden (AWS Storage Blog / Snowball-FAQ)."
---

# Battle Card 17 — Snowball Edge · Amazon S3

## Szenario

Das **Landesmedienarchiv** digitalisiert seit zwölf Jahren Filmbestände. Auf
einem alten SAN liegen **500 TB** unkomprimierte Masterdateien (MXF/ProRes). Der
Mietvertrag für den Serverraum läuft in **acht Wochen** aus, das SAN geht mit
außer Betrieb. Der gesamte Bestand muss vorher nach Amazon S3, wo er anschließend
per Lifecycle ins Archiv wandert.

Der Standort hängt an einer 1-Gbit/s-Leitung, von der im laufenden Betrieb
realistisch **300 Mbit/s** für die Migration frei sind. Die Rechnung, die in der
Prüfung erwartet wird:

```
500 TB = 4.000.000 Gbit
4.000.000 Gbit / 0,3 Gbit/s ≈ 13.300.000 s ≈ 154 Tage
```

**154 Tage gegen 8 Wochen Deadline** — der Online-Weg fällt aus, und zwar nicht
knapp. Gesucht ist der physische Transport, plus ein Weg für die Daten, die
*während* des Transports noch entstehen.

## Ablauf 1–5

**1 — Daten aufs Gerät kopieren.**
Im Snow-Family-Console wird ein **Import-Job nach S3** angelegt: Zielbucket,
Region, KMS-Key, Versandadresse. AWS liefert die Geräte; für 500 TB sind das
**drei Snowball Edge Storage Optimized** mit je 210 TB (630 TB Kapazität, Reserve
für Overhead). Im Rechenzentrum werden sie ans lokale Netz gehängt, und das
Archiv kopiert entweder über einen **NFS-Mount** oder über die **S3-kompatible
API** des Geräts. Die NVMe-Bestückung schafft bis zu **1,5 GB/s** — der Flaschenhals
ist ab hier das eigene LAN und die Leseleistung des SAN, nicht mehr die WAN-Leitung.
Verschlüsselt wird auf dem Gerät, mit dem im Job gewählten KMS-Key; AWS hat den
Schlüssel nie auf dem Gerät.

**2 — Entsperren und überwachen über AWS OpsHub.**
Das Gerät ist im Auslieferungszustand gesperrt. Zum Entsperren braucht man
**zwei getrennte Dinge**: das **Manifest** (Datei aus der Console) und den
**Unlock-Code** (wird in der Console separat angezeigt). Beides zusammen ergibt
erst den Zugriff — deshalb ist ein gestohlenes Gerät wertlos. **AWS OpsHub** ist
das grafische Werkzeug dafür; alternativ geht es über den Snowball-Edge-Client
auf der Kommandozeile. Der Pfeil ist gestrichelt, weil hier Steuerung fließt und
keine Nutzdaten.

**3 — Rückversand.**
Ist das Kopieren fertig, wird das Gerät ausgeschaltet. Das **E-Ink-Versandlabel
schaltet automatisch auf die Rückadresse von AWS um** — es gibt keinen Zettel,
der falsch beschriftet werden kann. Der Carrier holt ab. Die Daten sind auf dem
gesamten Transportweg verschlüsselt; das Gerät selbst ist manipulationsgeschützt
(TPM, Gehäuseüberwachung).

**4 — AWS importiert in den Bucket.**
Im AWS-Rechenzentrum werden die Daten in den Zielbucket importiert, mit der im
Job definierten Verschlüsselung. Es entsteht ein **Job-Report** plus
CloudWatch-Logs, aus denen hervorgeht, welche Objekte importiert wurden und
welche nicht. Danach werden die Geräte nach **NIST-Standard gelöscht**, bevor sie
zum nächsten Kunden gehen. Erst nach dem Report darf das Archiv seine Quelldaten
löschen — nie vorher.

**5 — Delta nachziehen mit DataSync.**
Zwischen dem Kopierstart und dem abgeschlossenen Import vergehen zwei bis drei
Wochen, in denen weiter digitalisiert wird. Diese Differenzmenge ist klein genug
für die Leitung, also übernimmt sie **AWS DataSync**: inkrementell, geplant, mit
Prüfsummenvergleich. Das ist der Punkt, den die meisten Prüfungsfragen als
zweiten Teil der richtigen Antwort erwarten — **Snowball für den Bulk, DataSync
für das Delta**.

**Verworfen — Direktupload über die Leitung.**
Der graue, durchgestrichene Pfad ist die Antwortoption, die in der Prüfung immer
danebensteht: "Kopieren Sie die Daten mit der S3 CLI und Multipart Upload hoch."
Bei 154 Tagen gegen 8 Wochen Deadline ist das keine Alternative, und die Leitung
wäre monatelang für den Regelbetrieb blockiert.

## Prüfungs-Kernsatz

> **Bandbreite × Zeit < Datenmenge → physischer Transport. Ein Snowball Edge
> Storage Optimized fasst 210 TB; das Delta, das während des Transports
> entsteht, holt DataSync nach.**

## Klassiker-Fallen

**Falle 1 — Snowball vs. DataSync.**
Die Trennlinie ist die **Rechnung**, nicht das Gefühl. Passt die Datenmenge
durch die verfügbare Leitung in das gegebene Zeitfenster, ist **DataSync** die
Antwort (online, inkrementell, keine Logistik). Passt sie nicht, ist es
**Snowball**. Prüfungsfragen liefern deshalb fast immer beide Zahlen —
Bandbreite und Deadline. Wer sie nicht ausrechnet, rät.

**Falle 2 — Storage Optimized vs. Compute Optimized.**
Für reine Datenmigration ist **Storage Optimized (210 TB)** richtig.
**Compute Optimized** (bis 104 vCPUs, 416 GB RAM, 28 TB NVMe) ist für
Edge-Verarbeitung gedacht — Vorverarbeitung am entlegenen Standort, EC2-Instanzen
auf dem Gerät. Signalwort "wir wollen die Daten schon unterwegs analysieren" →
Compute Optimized. Signalwort "möglichst viel Kapazität pro Gerät" → Storage
Optimized.

**Falle 3 — Snowball ist keine dauerhafte Anbindung (Abgrenzung zu Karte 16).**
Snowball ist ein **Einmal-Vorgang**: Gerät kommt, Gerät geht. Wer eine
*dauerhafte* Datei-Schnittstelle in die Cloud braucht, nimmt **S3 File Gateway**
(Karte 16). Eine Frage, die beides enthält ("500 TB Altbestand *und* danach
weiter über SMB arbeiten"), verlangt beide Dienste — nicht die Wahl zwischen
ihnen.

**Falle 4 — Manifest und Unlock-Code sind zwei Dinge.**
Beliebte Distraktor-Frage: "Ein Mitarbeiter hat das Manifest, kann das Gerät aber
nicht entsperren." Antwort: Er braucht zusätzlich den Unlock-Code aus der
Console. Die Trennung ist Absicht — sie verhindert, dass ein einzelnes geleaktes
Artefakt reicht.

**Falle 5 — Verfügbarkeit 2026 (Realitäts-Check).**
Seit **7. November 2025** gibt AWS Snowball-Edge-Geräte **nur noch an
Bestandskunden** aus. Neukunden werden auf **AWS DataSync** (online), das **AWS
Data Transfer Terminal** (physische Übergabe an einem AWS-Standort) oder
**Partner-Appliances** aus dem Marketplace verwiesen; für Edge-Compute auf
**Outposts**. Snowcone ist seit 12.11.2024 eingestellt, Snowmobile ebenfalls
zurückgezogen. **Für die SAA-C03-Prüfung ist Snowball weiterhin die erwartete
Antwort** auf "Leitung zu langsam, Petabyte-Migration" — im Projektalltag muss
man aber prüfen, ob man überhaupt bestellen darf. Diese Lücke zwischen
Prüfungsstoff und Produktrealität gehört bewusst benannt.

## Bewusste Vereinfachungen im Diagramm

- **Die drei Geräte sind als eine Box gezeichnet.** Tatsächlich sind es drei
  separate Jobs mit drei Manifesten und drei Unlock-Codes. Drei Boxen hätten
  dreimal denselben Ablauf gezeigt, ohne fachlich etwas hinzuzufügen.
- **AWS KMS hat keine eigene Box.** Die Verschlüsselung steht als Zeile im
  Snowball-Kasten. Ein eigener Knoten hätte einen Datenfluss suggeriert, den es
  nicht gibt — der Schlüssel wird beim Job-Anlegen referenziert, nicht während
  des Kopierens abgerufen.
- **Der Job-Anlage-Schritt in der Console ist nicht gezeichnet.** Er passiert vor
  Schritt 1 und ist reine Steuerung, kein Datenfluss.
- **"Rückversand & Ingest" ist eine Box, obwohl es zwei getrennte Vorgänge sind**
  (Logistik und Import im AWS-Rechenzentrum). Für die Prüfungslogik ist die
  Trennung irrelevant — entscheidend ist, dass der Kunde ab dem Abholen nichts
  mehr tut.
- **Die Zahl 154 Tage ist eine Modellrechnung** bei konstant 300 Mbit/s und ohne
  Protokoll-Overhead. Real wäre es länger. Sie dient der Größenordnung, nicht der
  Kapazitätsplanung.
- **Die Deadline-Logik (SAN-Abschaltung) ist nicht als Knoten dargestellt.** Sie
  steht im Szenario-Text; ein Kalender-Symbol hätte den Datenfluss nicht
  bereichert.
