---
cardNumber: 79
slug: storage-gateway-tape-volume-vtl
title: "Storage Gateway Tape & Volume — Bandworkflow behalten, Bandroboter ersetzen"
services: ["AWS Storage Gateway", "Tape Gateway", "Volume Gateway", "Amazon S3 Glacier Flexible Retrieval", "Amazon S3 Glacier Deep Archive", "S3 File Gateway"]
domains: ["D2", "D4"]
correctAnswer: "B"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/storagegateway/latest/tgw/StorageGatewayConcepts.html"
  - "https://docs.aws.amazon.com/storagegateway/latest/tgw/archiving-tapes-vtl.html"
  - "https://docs.aws.amazon.com/storagegateway/latest/tgw/retrieving-archived-tapes-vtl.html"
  - "https://docs.aws.amazon.com/storagegateway/latest/tgw/resource-gateway-limits.html"
  - "https://docs.aws.amazon.com/storagegateway/latest/vgw/resource-gateway-limits.html"
  - "https://docs.aws.amazon.com/storagegateway/latest/APIReference/API_Tape.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/al2-to-al2023-migration.html"
  - "https://docs.aws.amazon.com/filegateway/latest/filefsxw/DocumentHistory.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Archiv aus Magnetbändern zu betreiben.

**Weg eins:** Du kaufst einen Schrank mit Greifarm. Darin stecken Kassetten, davor stehen Laufwerke, dazwischen fährt Mechanik. Du kaufst Reinigungskassetten, du tauschst Laufwerke, du hörst dem Greifarm zu, wenn er nachts arbeitet. Alle paar Jahre kommt eine neue Bandgeneration, und dann kopierst du dein gesamtes Archiv von der alten auf die neue — ein Projekt, das niemand freiwillig plant. Und für die Auslagerung fährt zweimal die Woche ein Bote Kisten in ein anderes Gebäude.

**Weg zwei:** Der Schrank verschwindet. An seiner Stelle steht eine Kiste im Rack, die dem Backup-Server erzählt, sie sei genau dieser Schrank — mit Greifarm, mit Laufwerken, mit Kassetten. Von vorn ist der Unterschied nicht zu sehen. Dahinter ist niemand.

Das ist der ganze Trick von Tape Gateway, und es ist auch die ganze Antwort auf das Szenario: Ein Mittelständler sichert seit Jahren mit NetBackup auf LTO-Bänder, der Bandroboter ist am Lebensende, die Aufbewahrungspflicht läuft über sieben Jahre — und an den Backup-Prozessen soll sich nichts ändern.

**Die Kiste ist billiger als der Schrank. Wichtiger ist aber, dass sie die Backup-Software nicht anfassen muss.**

## Was es eigentlich ist — das virtuelle Tape

Das zentrale Objekt ist kein Bucket und kein Dateisystem, sondern ein **Band mit einem Barcode**. Und die wichtigste Eigenschaft wird beim Anlegen festgelegt, nicht später:

```bash
aws storagegateway create-tapes \
  --gateway-arn arn:aws:storagegateway:eu-central-1:1234:gateway/sgw-A1B2C3D4 \
  --tape-size-in-bytes 2748779069440 \
  --num-tapes-to-create 20 \
  --tape-barcode-prefix KLN \
  --pool-id DEEP_ARCHIVE
```

Zwanzig Bänder à 2,5 TiB, Barcodes mit dem Präfix `KLN`, Archivziel Deep Archive. Die Backup-Software sieht diese zwanzig Bänder in ihrem Medienpool, als wären sie eben geliefert worden, und beschriftet sie nach ihren eigenen Regeln.

Der Parameter, an dem alles hängt, ist der letzte. **`pool-id` entscheidet über die spätere Speicherklasse — vor dem ersten geschriebenen Byte.** Nicht eine Lifecycle-Regel, nicht ein Skript, nicht die Konsole irgendwann später.

## Der Weg durch die Karte

### Kasten links oben — die Backup-Software

NetBackup, Veeam, Commvault. Sie schreibt weiter auf Tape, sie kennt weiter Medienpools, Retention-Regeln und Vollsicherung am Wochenende. Sie wird nicht umkonfiguriert, nicht umgeschult, nicht neu zertifiziert.

Das klingt nach einer Randbedingung und ist in Wahrheit die Hauptanforderung. Eine gewachsene Backup-Landschaft ist Prozess, Dokumentation und Prüferwartung — nicht nur Software. Wer sie anfasst, fasst auch die Revision an.

### Badge 1 — iSCSI zum Tape Gateway

Die Storage-Gateway-Appliance im Rechenzentrum meldet sich am Netz als **iSCSI-Ziel** und präsentiert zwei Arten von Geräten: einen Media Changer — den virtuellen Greifarm — und Laufwerke. Die Doku ist hier präzise: Jedes Tape Gateway bringt genau **eine** VTL mit, und jede VTL kommt mit einem Satz von **10 Tape Drives**.

Für die Backup-Software ist das kein Sonderfall. Sie sucht Laufwerke, sie findet zehn, sie belegt sie parallel für ihre Jobs. Genau so hat sie es beim Bandroboter auch gemacht.

Wichtig für die Aufgabenstellung: Diese Appliance ist kein AWS-Gerät, das geliefert werden muss. Sie ist ein Image, das du auf deinem eigenen Hypervisor ausrollst — VMware ESXi, Microsoft Hyper-V, KVM — oder alternativ als EC2-Instanz betreibst, wenn die Backup-Quellen ohnehin in AWS liegen. Für einen Mittelständler, dessen Bandroboter am Lebensende ist, heißt das: Der Ersatz ist eine VM auf vorhandener Virtualisierung, keine Beschaffung.

### Kasten links unten — Cache und Upload Buffer

Hier steckt der Grund, warum die Sicherung nicht plötzlich dreimal so lange dauert.

Die Appliance nimmt den Schreibvorgang **lokal** an und bestätigt ihn sofort. Der Backup-Job wartet nicht auf die WAN-Leitung. Zwei lokale Bereiche machen das möglich: der **Upload Buffer**, in dem noch nicht übertragene Daten zwischenliegen, und der **Cache**, in dem zuletzt geschriebene und gelesene Daten für schnellen Zugriff bleiben.

Die Größen sind dokumentiert: Cache mindestens 150 GiB, höchstens 64 TiB; Upload Buffer mindestens 150 GiB, höchstens 2 TiB.

**Das Verhältnis ist die Betriebsfalle.** Der Puffer ist der kleinere der beiden — läuft er voll, weil die Leitung langsamer ist als die Sicherung, geht das Gateway in einen Zustand, in dem es Schreibvorgänge nicht mehr annimmt. Kein Datenverlust, aber ein Backup-Job, der stehen bleibt. Das Bild dazu: ein Trichter, dessen Auslauf zu eng ist. Man merkt es erst, wenn oben nachgegossen wird.

### Badge 2 — asynchron in die Virtual Tape Library

Was im Puffer liegt, wandert komprimiert und verschlüsselt in die VTL. Die liegt in S3 — aber nicht in deinem S3. **Tape Gateway legt die Bänder in Buckets ab, die der Dienst selbst verwaltet.**

Das ist kein Detail, sondern die Antwort auf die häufigste falsche Idee bei dieser Karte: Du siehst diese Buckets nicht in deiner S3-Konsole. Du kannst darauf keine Lifecycle-Regel schreiben, keine Bucket-Policy hängen, keine Objektliste ziehen. Der Zugang zu einem Band führt ausschließlich über die Bandmechanik.

Die Grenzen der Bibliothek stehen in den Quotas: ein Band zwischen **100 GiB und 15 TiB**, höchstens **1.500 Bänder** oder **1 PiB** gleichzeitig je Gateway. Für das Archiv gilt keine dieser Grenzen — dort ist weder die Zahl der Bänder noch die Gesamtgröße beschränkt.

### Badge 3 — Eject in den Glacier-Pool

Jetzt kommt der Moment, den die Karte in ihren Merksatz hebt. Wenn die Backup-Software ein Band **auswirft**, wandert es aus der Bibliothek ins Archiv — in der Storage-Gateway-Sprache: aus der VTL ins **Virtual Tape Shelf**.

Wohin genau, wurde beim Anlegen entschieden. War es der Glacier Pool, landet es in **S3 Glacier Flexible Retrieval**. Das ist die Klasse für Archive, die noch häufiger gebraucht werden.

Das Bild dazu: Der Eject-Knopf ist kein Knopf, sondern eine Weiche. Und die Weiche wurde gestellt, als das Band produziert wurde.

Ein Detail, über das echte Projekte stolpern: Wie ausgeworfen wird, hängt an der Backup-Software. Manche Produkte verlangen, dass ein Band nach dem Auswurf zusätzlich **exportiert** wird, bevor die Archivierung überhaupt anläuft. Die Doku sagt das ausdrücklich. Wer den Eject im Gateway sucht, sucht an der falschen Stelle — er passiert in NetBackup, Veeam oder Commvault, und Storage Gateway reagiert nur darauf.

Historische Randnotiz, die in Altbeständen auftaucht: Bänder, die vor dem 27. März 2019 angelegt wurden, wandern beim Auswurf grundsätzlich in Glacier Flexible Retrieval — Deep Archive gab es für Tape Gateway damals noch nicht.

### Badge 4 — Eject in den Deep-Archive-Pool

Dieselbe Mechanik, anderes Gleis. Bänder aus dem Deep Archive Pool gehen bei Auswurf in **S3 Glacier Deep Archive** — die Klasse für lange, günstige Aufbewahrung von Daten, die ein- bis zweimal im Jahr angefasst werden.

Für die siebenjährige Aufbewahrungspflicht aus dem Szenario ist das die naheliegende Wahl. Umentscheiden geht nachträglich: Ein Band aus dem Glacier Pool lässt sich später dem Deep Archive Pool zuweisen. Kostenlos ist das nicht — es fällt eine Gebühr für den Umzug an und gegebenenfalls eine Early-Deletion-Gebühr für die Zeit in Glacier.

### Kasten unten — Volume Gateway zum Abgrenzen

Der gestrichelte Kasten steht nicht auf der Karte, weil er hier gebraucht würde, sondern weil er in der Prüfung nebenan sitzt.

Volume Gateway liefert **Block-Volumes über iSCSI**, keine Bänder. In zwei Ausprägungen:

- **Cached:** S3 ist der primäre Speicher, lokal liegt nur der heiße Anteil. Bis 32 TiB je Volume, 32 Volumes je Gateway, in Summe 1.024 TiB.
- **Stored:** Alle Daten liegen lokal, S3 hält Snapshots als EBS-Snapshots. Bis 16 TiB je Volume, 32 Volumes je Gateway, in Summe 512 TiB.

Beides ist Storage Gateway, beides spricht iSCSI — und trotzdem löst keines davon den Fall dieser Karte, weil die Backup-Software Bänder erwartet und keine Platten.

### ✗ — S3 File Gateway

Der rote Pfeil zeigt auf die Lösung, die technisch funktioniert und trotzdem falsch ist.

S3 File Gateway stellt ein NFS- oder SMB-Share bereit und legt die Dateien als native S3-Objekte ab. Man kann eine Backup-Software darauf sichern lassen. Nur muss man dafür die Jobs von Tape- auf Disk-Targets umbauen, die Retention neu organisieren und die geänderten Abläufe dokumentieren.

Genau diese Prozessänderung hat der Kunde ausgeschlossen. Das Kreuz steht nicht am Produkt, sondern an der Anforderung.

## Die entscheidende Unterscheidung

| | Volume Gateway *Cached* | Volume Gateway *Stored* |
|---|---|---|
| Primärdaten liegen | in S3 | lokal |
| Lokal vorgehalten | nur der heiße Anteil | alles |
| In S3 liegt | das Volume selbst | Snapshots davon |
| Max. je Volume | 32 TiB | 16 TiB |
| Volumes je Gateway | 32 | 32 |
| Summe je Gateway | 1.024 TiB | 512 TiB |
| Passt, wenn | mehr Kapazität als lokaler Platz | niedrige Latenz auf den ganzen Bestand |

Die Merkhilfe steckt in den Wörtern selbst: *Cached* heißt „nur ein Ausschnitt liegt hier", *Stored* heißt „alles liegt hier". Wer in einer Aufgabe „low-latency access to the entire dataset" liest, braucht Stored — und darf sich vom größeren Maximalvolumen bei Cached nicht in die Irre führen lassen.

Und genau an diesem größeren Maximum hängt eine Fußnote, die man nur einmal übersieht: Die Quotas-Seite vermerkt, dass ein Snapshot von einem Cached Volume oberhalb von 16 TiB zwar in ein Storage-Gateway-Volume zurückgespielt werden kann, **nicht aber in ein EBS-Volume**. Wer 32 TiB anlegt, weil es geht, verbaut sich damit still den Weg, aus dem Snapshot später eine EC2-Instanz hochzuziehen. Die 16 TiB aus der Stored-Spalte sind also nicht nur ein Limit, sondern auch eine Grenze, hinter der die EBS-Kompatibilität endet.

## Die ehrliche Feinheit

**Abrufen dauert Stunden, nicht Minuten.** Die Doku nennt für ein Band aus S3 Glacier Flexible Retrieval typischerweise **3 bis 5 Stunden** und aus Deep Archive typischerweise **12 Stunden**. Auf der Seite über das Archivieren steht daneben eine Formulierung, die man leicht falsch liest — dort wird Glacier Flexible Retrieval als Klasse für Archive beschrieben, die „in Minuten" gebraucht werden. Das beschreibt den Einsatzzweck der Speicherklasse, nicht die Dauer eines Bandabrufs. Für Tapes gilt die Angabe von der Abrufseite. Wer Tape Gateway für kurze RTOs einplant, hat den falschen Baustein gewählt.

**Abgerufene Bänder sind schreibgeschützt.** Ein Band aus dem Archiv kommt zurück in die VTL, aber nur lesbar. Und es kommt in **ein** Gateway zurück — hast du mehrere in derselben Region, musst du dich entscheiden.

**Die Appliance ist der einzige Weg zu deinen Bändern.** Fällt sie aus, kommst du an die Daten nicht über S3 heran, weil die Buckets dir nicht gehören. Storage Gateway sieht dafür eine Deaktivierung vor: Man erklärt das defekte Gateway für tot und holt seine Bänder in ein neues. Das ist ein dokumentierter Weg — aber eben ein Verfahren mit Wartezeit, kein Failover. Wer den alten Bandroboter durch eine einzelne VM ohne Snapshot-Konzept ersetzt, hat den Single Point of Failure nur virtualisiert.

**Es gibt eine WORM-Variante, und sie ist genau für diesen Fall gebaut.** Neben den beiden Standard-Pools kennt Storage Gateway benutzerdefinierte Tape Pools mit *tape retention lock*. Die API-Referenz führt dazu eigene Felder: ob ein Band als write-once-read-many archiviert ist, wann es in den Pool eingetreten ist und ab wann die Sperrfrist läuft. Für eine siebenjährige Aufbewahrungspflicht mit Prüfernachweis ist das der Unterschied zwischen „wir löschen das nicht" und „wir können das nicht löschen".

**Die Appliance selbst hat gerade eine Frist gerissen.** AWS hat Storage Gateway von Amazon Linux 2 auf AL2023 umgestellt. Betroffen sind S3 File Gateway 1.x, Tape Gateway 2.x und Volume Gateway 2.x; seit dem 5. Januar 2026 sind neue AL2-Aktivierungen eingeschränkt, und seit dem **30. Juni 2026** bekommen AL2-Appliances keine Software-Updates und keinen Support mehr. Einen In-Place-Upgrade-Pfad gibt es nicht — die Appliance wird ersetzt, nicht aktualisiert. Prüfungsrelevant ist das nicht. Für ein Projekt, das heute startet, ist es die erste Frage an den Bestand.

## Syntax lesen — `create-tapes`

Fünf Parameter, von denen zwei irreversibel sind:

```
aws storagegateway create-tapes
    --gateway-arn ...sgw-A1B2C3D4      ← in welche VTL die Bänder gelegt werden
    --tape-size-in-bytes 2748779069440 ← 2,5 TiB, erlaubt: 100 GiB bis 15 TiB
    --num-tapes-to-create 20           ← wie viele auf einmal
    --tape-barcode-prefix KLN          ← Präfix des Barcodes, den die Software sieht
    --pool-id DEEP_ARCHIVE             ← Ziel beim Eject: GLACIER oder DEEP_ARCHIVE
```

Die Größe steht in **Bytes**, nicht in TiB — `2748779069440` sind exakt 2,5 TiB. Und der Barcode ist nicht Kosmetik: Er ist die Kennung, unter der die Backup-Software das Band führt, und damit die Brücke zwischen ihrem Medienkatalog und deiner AWS-Konsole. Wer Barcode-Präfixe nach Abteilung oder Aufbewahrungsklasse vergibt, findet später etwas wieder.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Bandroboter, keine Laufwerke, keine Reinigungskassetten
- keine Bandgenerationswechsel und keine Migration von LTO-7 auf LTO-9
- kein Auslagerungsvertrag und kein Bote mit Kisten
- keine geänderten Backup-Jobs, keine neue Retention-Logik, keine Schulung
- keine eigenen S3-Buckets, keine Lifecycle-Regeln, keine Bucket-Policies
- kein Kapazitätsplan für den Bandschrank — das Archiv hat keine Obergrenze

Übrig bleiben: eine virtuelle Maschine im Rack, ein Medienpool, der aussieht wie immer, und eine monatliche Rechnung statt einer Investition.

## Wenn du dir eine Sache merkst

**Tape Gateway spricht iSCSI-VTL und bewahrt den bestehenden Bandworkflow; welche Archivklasse ein Band bekommt, entscheidet der Pool beim Eject.**

S3 File Gateway ist ein Datei-Share und verlangt den Umbau, den der Kunde ausgeschlossen hat. Volume Gateway liefert Blockspeicher, keine Bänder. Und eine Lifecycle-Regel gibt es hier nirgends, weil die Buckets AWS gehören und nicht dir.

## Prüfungsknackpunkte

**Signalwörter:** „backup software must not be changed", „virtual tape library over iSCSI", „seven year retention", „replace the tape library". Bestehender Bandworkflow plus Wunsch, ihn zu behalten, ist immer Tape Gateway.

**Die Lifecycle-Falle.** Eine Antwort, die Lifecycle-Regeln auf den VTL-Bucket anwendet, ist falsch — die Buckets werden von AWS verwaltet. Gesteuert wird über den Archiv-Pool.

**Die Restore-Falle.** „Wiederherstellung innerhalb einer Stunde" und Tape Gateway passen nicht zusammen. Erst muss das Band aus dem Archiv geholt werden, und das dauert Stunden.

**Cached und Stored vertauschen.** Cached: Primärdaten in S3, lokal nur der heiße Anteil, bis 32 TiB. Stored: alles lokal, S3 hält die Snapshots, bis 16 TiB. Das größere Volumen gehört zur Variante mit *weniger* lokalen Daten — das ist die kontraintuitive Stelle.

**A — S3 File Gateway:** Ein NFS- oder SMB-Share statt eines Bandroboters. Funktioniert nur, wenn die Backup-Jobs auf Disk-Targets umgebaut werden dürfen.

**C — Volume Gateway (Cached):** Liefert iSCSI-Blockspeicher. Die Backup-Software sucht aber ein Bandlaufwerk, kein Volume.

**D — Direkt nach Glacier sichern:** Setzt voraus, dass die Backup-Software S3 als Ziel beherrscht und die Aufbewahrung dort abgebildet wird — wieder der Prozessumbau, der ausgeschlossen war.
