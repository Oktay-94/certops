---
cardNumber: 16
slug: s3-file-gateway-nordwerk-cad-netzlaufwerk
title: "S3 File Gateway — Netzlaufwerk bleibt, Daten landen in S3"
services: ["AWS Storage Gateway", "Amazon S3 File Gateway", "Amazon S3", "S3 Lifecycle", "S3 Glacier Deep Archive", "AWS Lambda", "Amazon Athena"]
domains: ["D2", "D3", "D4"]
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/filegateway/latest/files3/file-gateway-concepts.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/fgw-quotas.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/storage-classes.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/encrypt-objects-stored-by-file-gateway-in-amazon-s3.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/troubleshooting-file-share-issues.html"
  - "https://docs.aws.amazon.com/filegateway/latest/files3/Requirements.html"
  - "https://aws.amazon.com/storagegateway/faqs/"
---

## Die Grundidee zuerst

Das Regal im Konstruktionsbüro ist voll. Es gibt zwei Wege weiter.

**Weg eins:** Du kaufst ein größeres Regal. Es kostet sechsstellig, steht drei Monate später da, und in vier Jahren stellst du dieselbe Frage noch einmal. Außerdem muss jeder, der bisher zum alten Regal gelaufen ist, sich merken, dass es jetzt woanders steht.

**Weg zwei:** Das Regal bleibt stehen, wo es steht. Du baust nur eine neue Rückwand ein. Wer ein Blatt hineinlegt, sieht ein Regal. Hinter der Rückwand fährt ein Aufzug in ein Zentralarchiv, das niemand im Büro je betritt. Die zwanzig Blätter, die gerade in Arbeit sind, liegen weiter vorne im Fach. Der Rest ist unten.

Das ist S3 File Gateway. Das Netzlaufwerk `Z:\` bleibt `Z:\`. Die CAD-Software merkt nichts. Und trotzdem liegen die Daten am Ende als ganz normale Objekte in einem S3-Bucket — nicht als Backup-Blob, nicht als Image, sondern als Dateien, die jeder andere AWS-Service lesen kann.

Genau daran hängt die ganze Karte: **Der Bruch zwischen Dateiwelt und Objektwelt wird im Gateway aufgelöst, nicht in der Anwendung.**

## Was es eigentlich ist — der File Share

Das Gateway selbst ist eine VM. Interessant ist aber nicht die VM, sondern das, was du darauf anlegst: den **File Share**. Er verbindet genau einen Mount-Punkt mit genau einem Bucket:

```json
{
  "ClientToken": "nordwerk-cad-01",
  "GatewayARN": "arn:aws:storagegateway:eu-central-1:1234:gateway/sgw-A1B2C3",
  "LocationARN": "arn:aws:s3:::nordwerk-projekte",
  "Role": "arn:aws:iam::1234:role/StorageGatewayS3Access",
  "DefaultStorageClass": "S3_STANDARD",
  "KMSEncrypted": true,
  "KMSKey": "arn:aws:kms:eu-central-1:1234:key/8f1c-...",
  "CacheAttributes": { "CacheStaleTimeoutInSeconds": 300 },
  "ClientList": ["10.20.0.0/16"],
  "Squash": "RootSquash"
}
```

Lies das von oben nach unten, es ist die halbe Karte. Welches Gateway (`GatewayARN`), welcher Bucket (`LocationARN`), mit welchem Recht (`Role`), in welche Storage-Klasse geschrieben wird (`DefaultStorageClass`), wie verschlüsselt wird (`KMSEncrypted`, `KMSKey`), wie lange der Cache Metadaten für frisch hält (`CacheAttributes`), wer überhaupt mounten darf (`ClientList`).

Zwei Dinge, die du hier siehst und auf der Karte nicht:

Die **Verschlüsselung steht beim Share**, nicht beim Bucket. Ohne `KMSEncrypted` landen die Objekte mit SSE-S3 in S3 — das ist der Zustand, wenn du nichts tust. SSE-KMS und DSSE-KMS sind Einschaltentscheidungen pro Share.

Und die Rolle ist **die des Gateways**, nicht die deiner Nutzer. Der Konstrukteur an `Z:\` hat keinen AWS-Zugang und braucht keinen. Er spricht SMB mit einer VM im eigenen Rechenzentrum. Alles, was danach kommt, macht das Gateway in seinem eigenen Namen.

## Der Weg durch die Karte

### Badge 1 — Der Write kommt über SMB an

Der PDM-Server mountet keine neue Technologie. Er mountet eine SMB-Freigabe des Gateways, und `Z:\` zeigt jetzt dorthin. Für die CAD-Software ändert sich nichts: Sie sieht Ordner und Dateien, keine Buckets und keine Object Keys.

Für Linux-Clients steht NFS bereit. Hier hakt es allerdings in der Doku selbst: Der File-Gateway-User-Guide nennt NFS v3 und v4.1, die Storage-Gateway-FAQ nennt zusätzlich v4.0. Zwei offizielle AWS-Seiten, zwei Listen. Die Karte folgt dem User Guide. Merken solltest du die Mengenaussage, nicht die Versionsliste: **NFS und SMB — beides.** Das unterscheidet S3 File Gateway vom FSx File Gateway, das nur SMB spricht und für Neukunden ohnehin geschlossen ist.

### Der Kasten „S3 File Gateway" — was da eigentlich steht

Bevor der erste Byte fließt, lohnt ein Blick auf die Box selbst. Das Gateway ist eine **VM im eigenen Rechenzentrum** — VMware ESXi, Microsoft Hyper-V oder KVM, alternativ als von AWS gelieferte **Hardware-Appliance** für Standorte ohne Virtualisierung, oder als AMI auf EC2. Die Appliance kann übrigens alle Typen: S3 File Gateway mit NFS und SMB, FSx File Gateway mit SMB, Volume Gateway und Tape Gateway mit iSCSI.

Was das Gateway leisten muss, hängt nicht an der Datenmenge, sondern an der **Zahl der Dateien**. Es hält Metadaten für eine konfigurierbare Menge gleichzeitig vor, gestaffelt in Small, Medium und Large — fünf, zehn oder zwanzig Millionen Dateien. Wer ein Ingenieurbüro mit Millionen kleiner CAD-Referenzdateien anschließt, dimensioniert danach, nicht nach Terabyte.

Und eine Grenze, die im Anlagenbau irgendwann jemand trifft: Die **maximale Einzeldateigröße beträgt 5 TiB**. Wer größer schreibt, bekommt auf Windows gar keine Datei und auf Linux eine mit null Byte.

### Badge 2 — synchron in den Cache, sofortiger ACK

Hier liegt der Grund, warum die Konstrukteure nichts merken. Das Gateway schreibt eingehende Daten **synchron** auf seine lokale Cache-Disk und bestätigt der Anwendung den Schreibvorgang, bevor irgendetwas die WAN-Leitung gesehen hat.

Das Bild dazu: Du gibst ein Paket am Empfang ab und bekommst sofort den Stempel. Wann der Kurier fährt, ist nicht dein Problem.

Der Cache liegt zwischen **150 GiB und 64 TiB**. Auf der Karte steht „bis 64 TB" — hier widersprechen sich AWS-Seiten erneut: Die Limits-Tabelle des User Guides schreibt TiB, Storage-Blog und Produktseite schreiben TB. *Fixvorschlag: `bis 64 TiB`.* Wichtiger als das Maximum ist ohnehin das Minimum: Unter 150 GiB lässt sich kein Gateway betreiben, und die sinnvolle Größe richtet sich nach dem **aktiven Projektbestand**, nicht nach der Gesamtdatenmenge.

### Badge 3 — Upload asynchron, Dateipfad wird Object Key

Im Hintergrund überträgt das Gateway über HTTPS nach S3, optimiert und parallelisiert. Und dabei passiert das, was diese Karte von allen anderen Gateway-Typen trennt: Es entsteht eine **1:1-Abbildung**. Eine Datei wird ein Objekt, der Pfad wird der Key.

Kein Container. Kein Archivformat. Kein Blob, den nur die Backup-Software wieder aufmacht.

Dass der Upload asynchron läuft, hat einen zweiten Nutzen neben der Latenz: Er ist **drosselbar**. Für Volume-, Tape- und S3-File-Gateways lässt sich ein Zeitplan für Bandbreitenlimits hinterlegen — tagsüber wenig, nachts alles. Ohne Zeitplan gibt es keine Begrenzung, das Gateway nimmt sich, was da ist. In einem Büro, in dem gleichzeitig telefoniert und videokonferiert wird, ist das eine der ersten Stellschrauben.

### Badge 4 — Cache-Miss: read-through aus S3

Öffnet jemand eine Datei, die im Cache liegt, kommt sie lokal und sofort. Liegt sie nicht im Cache, holt das Gateway sie transparent aus S3 nach und legt sie ab. Der Anwender merkt nur eine längere Ladezeit beim ersten Zugriff. Übertragen werden dabei nur die angeforderten Teile, nicht zwingend die ganze Datei.

Das Gateway verwaltet den Cache selbst und verdrängt Daten erst, wenn Platz für Neueres gebraucht wird.

### Badge 5 — Lifecycle nach 90 Tagen, und was dann wirklich passiert

Die Kostenoptimierung passiert **im Bucket**, nicht im Gateway. Eine Lifecycle-Regel verschiebt Objekte älter als 90 Tage nach Glacier Deep Archive. Das Gateway weiß davon nichts.

Und genau hier steht auf der Karte etwas Falsches. In der Glacier-Box steht „Restore in Stunden", was klingt, als wäre der Zugriff auf ein Altprojekt eben langsam. Ist er nicht — **er scheitert.** Der User Guide sagt: Ist eine Datei per Lifecycle nach Glacier gewandert und über den Cache noch sichtbar, bekommt der Client beim Zugriff einen I/O-Fehler. AWS empfiehlt, auf diesen Fehler mit CloudWatch zu reagieren und daraufhin einen Restore auszulösen.

Zweitens greift die Regel bei einem Ingenieurbüro womöglich gar nicht auf allem, was du erwartest. Seit September 2024 verhindert S3 per Default, dass **Objekte unter 128 KB überhaupt transitioniert werden** — bei kleinen Dateien übersteigen die Transition-Requests die Ersparnis. Wer sie trotzdem archivieren will, braucht einen Objektgrößen-Filter in der Regel. Dazu kommt ein fixer Overhead von 40 KB je archiviertem Objekt, davon 8 KB zu Standard-Raten. Bei tausenden kleiner CAD-Referenzdateien kann Archivieren also teurer sein als Liegenlassen.

Der Unterschied zwischen Warten und Scheitern ist keine Wortklauberei. „Dauert Stunden" heißt: warten. „Scheitert" heißt: Jemand muss `RestoreObject` aufrufen, und bis dahin sieht der Konstrukteur eine Fehlermeldung. *Fixvorschlag: `Zugriff erst nach Restore` statt `Restore in Stunden`.*

### Badge 6 — direkt lesbar, kein Export nötig

Weil Badge 3 echte S3-Objekte erzeugt hat, kann ein Lambda-Trigger auf `s3:ObjectCreated:*` reagieren, Athena per SQL über die Prüfprotokolle laufen und SageMaker auf denselben Daten trainieren. Ohne Export, ohne zweite Kopie, ohne Umformatierung.

Volume Gateway und Tape Gateway können das nicht. Deren Daten liegen als EBS-Snapshots beziehungsweise als virtuelle Tapes in S3 — für AWS-Analysedienste unlesbar.

### Der Kasten „Nicht verwechseln"

Er hat bewusst keinen Pfeil, weil er kein Datenpfad ist, sondern eine Abgrenzungslegende. Ein rotes X hätte einen Fluss suggeriert, den es nie gab.

Zwei Zeilen darin brauchen eine Korrektur, beide in der S3-Box daneben. „Versioning & Replication nutzbar" stimmt, ist aber unkommentiert irreführend: Jede Dateiänderung erzeugt eine neue Objektversion, und bei großen Dateien lädt das Gateway Teilstücke hoch, bevor der Client fertig geschrieben hat — mehrere Versionen desselben Objekts sind der Normalfall, nicht die Ausnahme. Die Doku warnt ausdrücklich davor, Replication einzuschalten, bevor man weiß, wie viel Speicher Versioning verbraucht. *Fixvorschlag, entschieden: `Versioning & Replication — Versionen kosten mit`.*

Und die Zeile „SSE-S3 / SSE-KMS / DSSE-KMS" steht am falschen Ort. Alle drei sind korrekt, aber sie werden **je File Share** gesetzt, nicht am Bucket. *Fixvorschlag, entschieden: `SSE-S3 default · KMS je File Share`.*

## Die entscheidende Unterscheidung

Die Achse, die dieses Szenario trägt, ist nicht „welcher Speicher", sondern **wo die Anwendung nach dem Projekt läuft**:

| | Anwendung bleibt on-premise | Anwendung zieht um |
|---|---|---|
| Dauerbetrieb | **S3 File Gateway** (NFS/SMB auf S3) | Amazon EFS, FSx for Windows |
| Einmalige Bewegung | AWS DataSync (Kopier-Job) | DataSync, Snowball Edge |
| Was bleibt lokal | Cache mit dem aktiven Set | nichts |

Die CAD-Software bleibt in Hannover stehen. Damit fallen EFS und FSx aus dem Rennen, bevor über Protokolle überhaupt geredet wird.

## Die ehrliche Feinheit

**Der Cache ist kein Backup.** Er ist ein Beschleuniger und eine Zweitkopie nur für die Sekunden zwischen Write und Upload. Die Durability liefert S3. Fällt die Gateway-VM aus, wird sie neu deployt und der Cache füllt sich wieder aus S3 — vorausgesetzt, der Upload war durch. Genau deshalb gibt es die Metrik `CachePercentDirty`: Sie sagt dir, wie viel noch nur lokal liegt. Wer eine EC2-basierte Gateway-Instanz stoppt, während sie nicht null ist, verliert Daten.

Die zweite Feinheit steht nicht auf der Karte und ist eine beliebte Prüfungsformulierung: **Schreibt ein anderer Prozess direkt in den Bucket, sieht der SMB-Client die neuen Objekte nicht.** Das Gateway kennt nur, was es selbst geschrieben oder zuletzt aus S3 geholt hat. Es braucht eine Cache-Aktualisierung — automatisch über `CacheStaleTimeoutInSeconds` oder manuell über `RefreshCache`. Die Antwort auf „Nutzer sehen die von der Lambda erzeugten Dateien nicht im Share" ist nie „Bucket neu mounten".

Dritte Feinheit, die Performance-Tickets erzeugt: Der SMB-Security-Level des Gateways steht standardmäßig auf **Enforce encryption**, erzwingt also Verschlüsselung und Signierung für alle Client-Verbindungen. Der Haken steht in der Doku direkt daneben: Das Gateway begrenzt jede verschlüsselte Client-Verbindung auf **eine vCPU**. Ein einzelner Client wird dadurch nicht schneller, egal wie viele Kerne die VM hat — Durchsatz entsteht über mehrere Clients und mehrere Threads, nicht über eine dicke Verbindung.

Vierte Feinheit, gern übersehen: Glacier **Instant** Retrieval unterstützt das Gateway offiziell nicht. Du kannst Objekte dort hinein legen, aber das Gateway erkennt die Klasse nicht und behandelt sie wie jede andere — bei einem Virenscan über den ganzen Share wird das teuer.

## Syntax lesen — vom Pfad zum Object Key

Die 1:1-Abbildung klingt abstrakt, bis man sie einmal nebeneinander legt. Der Konstrukteur speichert:

```
Z:\projekte\2026\anlage-7\pruefprotokoll.pdf
│  └─────────────────┬─────────────────────────┘
│                    │
└─ Mount-Punkt       └─ alles ab hier wird zum Key
   (verschwindet)

s3://nordwerk-projekte/projekte/2026/anlage-7/pruefprotokoll.pdf
     └───────┬───────┘ └──────────────┬───────────────────────┘
             │                        │
     LocationARN aus dem       Object Key — identisch
     File Share                mit dem Pfad, nur mit /
```

Drei Dinge kannst du daran ablesen.

**Der Mount-Punkt ist nicht Teil des Keys.** `Z:\` ist eine Windows-Fiktion; es zählt der Pfad *innerhalb* des Share. Mountet ein Linux-Client denselben Share unter `/mnt/projekte`, entstehen exakt dieselben Keys.

**Ordner sind keine Objekte, sondern Präfixe.** Das Gateway verwaltet Verzeichnisse als Folder-Objekte in derselben Syntax, die auch die S3-Konsole benutzt — deshalb sieht ein Bucket, in den ein File Gateway schreibt, in der Konsole aus wie ein Dateibaum.

**Und die Richtung gilt auch rückwärts.** Objekte, die bereits im Bucket liegen, erscheinen im Share als Dateien, und der Key wird zum Pfad. Ein File Share auf einen gefüllten Bucket ist damit sofort ein lesbares Laufwerk — kein Import, keine Wartezeit.

Genau deshalb funktioniert Badge 6 überhaupt: Athena sieht `projekte/2026/anlage-7/` als Präfix und kann darauf partitionieren, ohne zu wissen, dass die Datei je über SMB geschrieben wurde.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein neues NAS und keine Kapazitätsplanung auf fünf Jahre
- keine Zeile geänderter CAD- oder PDM-Code
- kein Object-Key-Bewusstsein in der Anwendung
- kein Sync-Job, den jemand einplanen und überwachen müsste
- kein proprietäres Format zwischen dir und deinen Daten
- kein zweiter Datenbestand für die Auswertung

Übrig bleiben: eine VM, ein File Share, ein Bucket und eine Lifecycle-Regel.

## Wenn du dir eine Sache merkst

**File Gateway ist ein dauerhafter NFS/SMB-Mount auf einen Bucket: 1 Datei = 1 Objekt, Dateipfad = Object Key. Write wird synchron aus dem Cache bestätigt und asynchron nach S3 hochgeladen.**

Volume Gateway liefert iSCSI-Blockgeräte und legt EBS-Snapshots ab — keine Dateien. Tape Gateway emuliert eine virtuelle Tape Library für vorhandene Backup-Software. DataSync kopiert nach Plan und ist danach fertig; die Anwendung schreibt weiter aufs alte NAS.

## Prüfungsknackpunkte

**Signalwörter:** „die Anwendung kann nicht umgeschrieben werden", „NFS", „SMB", „Fileserver", „lokales NAS ist voll", „low-latency Zugriff auf die zuletzt genutzten Dateien", „die Daten sollen danach mit Athena oder Lambda nutzbar sein". Der letzte Punkt ist der schärfste Trenner der ganzen Gateway-Familie.

**Warum Volume Gateway hier verliert:** Es spricht iSCSI. Ein PDM-Server, der ein Laufwerk erwartet, bekommt ein Blockgerät — und in S3 landen Snapshots, die Athena nicht lesen kann.

**Warum Tape Gateway hier verliert:** Es ist die Antwort auf „unsere Backup-Software schreibt auf Bänder", nicht auf „unsere Nutzer arbeiten auf einem Laufwerk".

**Warum DataSync hier verliert:** Es ist ein Kopier-Job, kein Mount-Punkt. Nach dem Lauf ist das NAS immer noch voll.

**Warum EFS oder FSx hier verlieren:** Beide setzen voraus, dass die Anwendung in AWS läuft. Sie tut es nicht.

**Die Kombinationsfrage.** Enthält eine Frage *beide* Signalwörter — „500 TB Altbestand *und* danach dauerhaft weiter über SMB arbeiten" — ist die richtige Antwort nicht die Wahl zwischen den Diensten, sondern **Snowball Edge für den Bulk plus File Gateway für den Dauerbetrieb**. Siehe Karte 17.

**Die Cache-Falle.** Wer im Diagramm die Cache-Disk als lokales Backup verkauft, hat die Architektur nicht verstanden. Antwortoptionen, die den Cache als Ausfallsicherung anbieten, sind immer falsch.
