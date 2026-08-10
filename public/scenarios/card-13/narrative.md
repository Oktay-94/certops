---
cardNumber: 13
slug: efs-mount-targets-nordpresse-cms-multi-az
title: "Gemeinsames Dateisystem für mehrere Webserver — EFS über drei AZs"
services:
  - "Amazon EFS"
  - "EFS Mount Targets"
  - "EFS Lifecycle Management"
  - "EC2 Auto Scaling"
  - "Application Load Balancer"
domains: ["D2", "D3", "D4"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/efs/latest/ug/lifecycle-management-efs.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/availability-durability.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/performance.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/accessing-fs.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/features.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/managing-throughput.html"
  - "https://docs.aws.amazon.com/efs/latest/ug/mounting-fs-mount-cmd-dns-name.html"
  - "https://aws.amazon.com/efs/faq/"
  - "https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-efs-filesystem.html"
---

## Die Grundidee zuerst

Stell dir eine Redaktion mit drei Schreibtischen vor, und zwei Arten, die Fotos abzulegen.

**Weg eins:** Jeder Schreibtisch hat eine eigene abschließbare Schublade. Die Redakteurin am mittleren Tisch legt das Werksfoto hinein. Zwei Minuten später fragt eine Leserin am linken Tisch danach — und der Kollege dort zuckt mit den Schultern. Das Foto existiert, nur nicht da, wo gefragt wird. Abends wird der mittlere Schreibtisch abgebaut, weil weniger Betrieb ist. Die Schublade geht mit.

**Weg zwei:** Die Schreibtische haben gar keine Schubladen. In der Mitte steht ein Aktenzimmer, und von jedem Tisch führt eine eigene Tür hinein. Wer ablegt, legt dort ab. Wer sucht, sucht dort. Es gibt keine Kopien, keinen Abgleich, keine Frage, welcher Stand der richtige ist. Es gibt einen Raum und drei Türen.

EBS ist die Schublade. EFS ist das Aktenzimmer.

**Und das ist der ganze Trick: Nicht die Datei wandert zur Instanz, sondern die Instanz bekommt eine Tür zum Raum.** Der Rest der Karte beschreibt, woraus diese Türen bestehen und was sie kosten.

## Was es eigentlich ist — ein Dateisystem und drei Türen

Zwei Objekte, mehr ist es nicht. Das erste ist das Dateisystem selbst:

```json
{
  "FileSystemId": "fs-0a1b2c3d4e5f6a7b8",
  "PerformanceMode": "generalPurpose",
  "ThroughputMode": "elastic",
  "NumberOfMountTargets": 3,
  "SizeInBytes": {
    "Value": 3298534883328,
    "ValueInStandard": 3298534883328,
    "ValueInIA": 0
  },
  "LifeCycleState": "available"
}
```

Lies das von oben nach unten. `PerformanceMode` und `ThroughputMode` sind die beiden Schalter, die über Latenz und Durchsatz entscheiden. `NumberOfMountTargets: 3` sind die drei Türen — eine je AZ. `SizeInBytes` sind die 3 TB der Nordpresse, aufgeschlüsselt nach Speicherklasse; du hast sie nie provisioniert, sie sind einfach entstanden. Kein Volume, keine Größe, keine Partition.

Das zweite Objekt ist eine Tür:

```json
{
  "MountTargetId": "fsmt-0b7c8d9e0f1a2b3c4",
  "FileSystemId": "fs-0a1b2c3d4e5f6a7b8",
  "AvailabilityZoneName": "eu-central-1b",
  "SubnetId": "subnet-0redaktion1b",
  "IpAddress": "10.0.12.87",
  "NetworkInterfaceId": "eni-0e5d4c3b2a190f8e7"
}
```

Das ist der Punkt, an dem viele Erklärungen zu ungenau werden: **Ein Mount Target ist keine Einstellung, sondern eine Netzwerkkarte mit einer IP-Adresse in genau einem Subnetz.** Es hat eine `eni-`-ID wie jede andere elastic network interface auch. Deshalb hängt es an einer Security Group, deshalb kostet es eine IP aus deinem Subnetz, und deshalb ist es an genau eine AZ gebunden.

## Der Weg durch die Karte

### Der ALB-Kasten — hier steht das Problem, nicht die Lösung

Ganz links stehen der Load Balancer und die Auto Scaling Group mit 3 bis 12 Instanzen. Der Kasten sieht harmlos aus, ist aber die Ursache: Weil jeder Request auf einer beliebigen der Instanzen landet, darf keine Instanz etwas besitzen, das die anderen brauchen.

Die Auto Scaling Group verschärft es. Instanzen entstehen morgens und verschwinden abends, und mit ihnen alles, was nur bei ihnen lag. Ein CMS, das Uploads lokal ablegt, verliert damit nicht nur Verfügbarkeit, sondern Daten.

Das Bild dazu: Du kannst kein Archiv führen, dessen Regale nachts abgeholt werden.

### Badge 1 — verteilt auf alle drei AZs

Der ALB verteilt auf alle drei Availability Zones. Das ist die Anforderung „ein AZ-Ausfall darf nichts umwerfen", übersetzt in Topologie.

Für den Speicher hat das eine unmittelbare Folge: Was immer die drei Instanzen teilen, muss selbst über AZ-Grenzen hinweg dasselbe sein. Ein Speicher, der in einer AZ lebt, ist damit raus — nicht aus Preisgründen, sondern weil er die Aufgabe nicht lösen kann.

### Badge 2 — mount: die Tür in der eigenen AZ

Die Instanz in eu-central-1b mountet gegen den DNS-Namen des Dateisystems, nicht gegen eine IP. AWS löst diesen Namen **auf die IP des Mount Targets in der AZ des anfragenden Clients** auf. Deshalb verlässt der Verkehr die AZ nicht, und deshalb gilt: Ohne Mount Target in der AZ des Clients löst der Name nicht auf, und der Mount schlägt fehl.

Zwei Dinge, die in der Praxis exakt hier scheitern:

**Die Security Group.** Die SG des Mount Targets muss eingehend TCP 2049 von der SG der Webserver erlauben. Fehlt die Regel, hängt der `mount`-Befehl, bis er in einen Timeout läuft — es gibt keine hilfreiche Fehlermeldung, nur Stille.

**Die vierte AZ.** Erweitert jemand die Auto Scaling Group um eine AZ und legt dort kein Mount Target an, starten die neuen Instanzen sauber, bestehen den Health Check der EC2-Ebene und liefern trotzdem nichts aus. Der Fehler sitzt eine Schicht unter dem, was der Load Balancer prüft.

### Badge 3 — Write (NFS): die Redakteurin lädt hoch

Der Upload landet als gewöhnlicher Dateisystem-Schreibvorgang auf `/var/www/media`. Für das PHP-CMS ist das ein `fopen`, ein `fwrite`, ein `fclose`. Keine SDK-Aufrufe, keine Signatur, keine Bibliothek, kein einziger geänderter Codepfad.

**Genau das ist der Grund, warum hier EFS und nicht S3 die Antwort ist.** Die Anforderung lautet nicht „Speicher", sie lautet „Dateisystem mit Pfaden, Rechten und Sperren". S3 kann Objekte hervorragend, aber es hat keine Verzeichnisse, keine POSIX-Rechte und kein `flock`. Ein CMS auf Objektspeicher umzuschreiben ist ein Projekt, kein Mount.

### Badge 4 — Read (NFS): dieselbe Datei in a und c

Die beiden gestrichelten Rückpfeile sind der Kern der Karte, und sie sind bewusst gestrichelt: **Hier passiert nichts.** Es wird nicht repliziert, nicht synchronisiert, nicht kopiert. Es gibt ein Dateisystem, und die Instanzen in a und c schauen in denselben Raum wie die in b.

Die Konsequenz ist die, die im Szenario zählt: Die um 18:40 frisch hochskalierte Instanz in eu-central-1c liefert ab der ersten Sekunde die vollständige Medienbibliothek aus. Kein Warm-up, kein Sync-Job, kein Skript im User Data, das erst 3 TB zieht.

### Der grüne Kasten — Amazon EFS (Regional)

„Regional" ist kein Etikett, sondern die Verfügbarkeitszusage: Die Daten liegen redundant über mehrere geografisch getrennte Availability Zones derselben Region. Fällt eine aus, arbeiten die anderen weiter.

Die Alternative heißt One Zone und ist billiger. Sie wirft aber genau die Eigenschaft weg, um die es in diesem Szenario geht — und sie kann nur ein einziges Mount Target haben, nämlich in ihrer eigenen AZ. Für eine Auto Scaling Group über drei AZs ist One Zone damit nicht bloß riskant, sondern architektonisch unbrauchbar.

### Der gelbe Kasten — Lifecycle Management

Hier liegt der Kostenhebel, und hier liegt auch ein Kartenbefund.

Die beiden Zeitangaben stimmen und sind stärker, als sie aussehen: Nach der Doku werden Dateien, die 30 Tage nicht in der Standard-Klasse angefasst wurden, standardmäßig nach IA verschoben, nach 90 Tagen nach Archive. Das ist der **Default für neue Dateisysteme**, nicht bloß eine Empfehlung. Für ein Medienarchiv ist das ideal: Der Artikel von 2019 wird einmal im Jahr abgerufen und kostet den Rest der Zeit fast nichts.

**Auf der Karte steht „EFS Intelligent-Tiering holt bei Zugriff zurück" zwischen zwei echten Defaults — und liest sich dadurch selbst wie einer. Ist es nicht.** Die Doku sagt ausdrücklich, dass Dateien standardmäßig *nicht* nach Standard zurückbewegt werden; dafür braucht es eine dritte, eigens gesetzte Lifecycle-Policy. Fixvorschlag für die Karte: `EFS Intelligent-Tiering (zuschaltbar) holt bei Zugriff zurück`.

Der Unterschied ist nicht akademisch. Ohne diese dritte Policy bleibt eine wieder aktiv gewordene Bildstrecke in IA liegen und wird bei **jedem** Abruf mit einer Abrufgebühr belegt. Mit der Policy wandert sie beim ersten Zugriff zurück nach Standard und kostet danach nur noch Speicher.

### Der rote Kasten — warum nicht EBS?

Drei Sätze, drei Ausschlussgründe, und alle drei sind Prüfungsstoff.

EBS lebt in einer AZ. Multi-Attach gibt es ausschließlich für Provisioned-IOPS-Volumes (io1, io2), für bis zu 16 Instanzen **in derselben Availability Zone**. Und der eigentliche Killer steht darunter: Es liefert ein gemeinsames *Block*-Gerät, kein Dateisystem. Zwei Instanzen, die dasselbe ext4 mounten, zerstören es gegenseitig; du brauchst ein cluster-fähiges Dateisystem wie GFS2 oder OCFS2 obendrauf.

S3 schließlich ist Objektspeicher. Kein POSIX, keine Sperren, keine Pfade im Dateisystemsinn.

## Die entscheidende Unterscheidung

Vier Kandidaten, eine Achse — und die Achse ist nicht der Preis, sondern *wie viele schreiben dürfen und über wie viele AZs*:

| | Gleichzeitig schreibend | Über AZ-Grenzen | Semantik |
|---|---|---|---|
| EBS (normal) | eine Instanz | nein, eine AZ | Blockgerät |
| EBS Multi-Attach | bis 16, aber nur mit Cluster-FS | nein, gleiche AZ | Blockgerät |
| Amazon EFS | tausende | ja (Regional) | NFS, POSIX |
| Amazon S3 | beliebig | ja | Objekte, kein Dateisystem |

## Die ehrliche Feinheit

**Erstens: „sofort sichtbar" ist die verkürzte Fassung.** Fachlich exakt liefert EFS die close-to-open-Konsistenzsemantik, die Anwendungen von NFS erwarten. Schreibvorgänge werden bei Regional-Dateisystemen dann AZ-übergreifend dauerhaft gespeichert, wenn die Anwendung synchron schreibt oder die Datei schließt. Echte Read-after-Write-Konsistenz gilt nur für synchron schreibende, nicht anhängende Zugriffe.

Für das CMS stimmt die Verkürzung: Die Datei wird hochgeladen, geschlossen, danach ausgeliefert. Für ein Logfile, in das zwei Instanzen gleichzeitig anhängen, stimmt sie nicht.

Nebenbei widersprechen sich hier zwei AWS-Seiten in der Wortwahl, nicht in der Sache: Die Übersichtsseite spricht von „strong data consistency", die Feature-Seite von close-to-open. Die Feature-Seite ist die spezifischere und damit die maßgebliche.

Zur Konsistenz gehört das Locking, das im grünen Kasten der Karte steht. NFS-Clients können Dateisperren nach NFS Version 4 nutzen, einschließlich Byte-Range-Locking. Zwei Grenzen nennt die Doku dazu: EFS unterstützt nur **advisory locking** — Lese- und Schreibvorgänge prüfen vor der Ausführung *nicht*, ob eine widersprechende Sperre existiert —, und eine einzelne Datei kann über alle verbundenen Instanzen hinweg höchstens 512 Sperren tragen. Für ein CMS, das beim Speichern selbst sperrt, reicht das. Für zwei Prozesse, die sich auf eine Sperre verlassen, ohne sie zu setzen, reicht es nicht: Die Sperre ist ein Hinweis, kein Riegel.

**Zweitens, und das ist der ernstere Punkt: `Elastic Throughput (Default)` auf der Karte gilt nur für die Konsole.** Der User Guide sagt, Elastic sei der Default-Throughput-Modus *in der EFS-Konsole*. Die API-, CLI- und CloudFormation-Referenzen sagen dagegen ausdrücklich: Default is `bursting`.

Das ist kein Etikettenstreit, weil daran eine Kette hängt. Die Archive-Speicherklasse wird nur auf Dateisystemen mit Elastic Throughput unterstützt. Ein per Terraform oder CloudFormation angelegtes Dateisystem bekommt ohne explizite Angabe Bursting — und dann existiert die auf der Karte gezeichnete Archive-Stufe schlicht nicht. Fixvorschlag: `Elastic Throughput (Konsolen-Default)`.

**Drittens, für den Kostenteil:** IA hat keine Mindestspeicherdauer, Archive hat 90 Tage. Wer eine Datei vorher löscht oder kürzt, zahlt die Restzeit anteilig. Und beide Klassen rechnen Dateien unter 128 KiB so ab, als wären sie 128 KiB groß. Ein Medienarchiv mit großen JPEGs profitiert; ein Verzeichnis mit Millionen winziger Thumbnails wird durch Lifecycle teurer statt billiger.

## Syntax lesen — die Mountzeile

Die Zeile, die im User Data oder in `/etc/fstab` steht, trägt mehr Bedeutung als sie aussieht:

```
fs-0a1b2c3d4e5f6a7b8.efs.eu-central-1.amazonaws.com:/  /var/www/media  nfs4  nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2,noresvport,_netdev  0 0
```

```
fs-...efs.eu-central-1.amazonaws.com : /
│                                       └─ Pfad IM Dateisystem, nicht auf der Instanz
└─ DNS-Name → löst auf das Mount Target der EIGENEN AZ auf

nfsvers=4.1   Protokollversion (4.0 und 4.1 werden unterstützt)
hard          bei Störung ewig weiterversuchen statt Fehler zurückgeben
noresvport    nach TCP-Reconnect einen neuen Quellport nehmen
_netdev       erst mounten, wenn das Netz steht — sonst hängt der Boot
```

Zwei dieser Optionen sind der Unterschied zwischen „läuft" und „läuft auch nach einem Netzwerkschluckauf": `noresvport` sorgt dafür, dass die Verbindung nach einem Reconnect sauber neu aufgebaut wird, `_netdev` verhindert, dass eine frisch gestartete Instanz beim Booten auf ein Dateisystem wartet, dessen Netzwerk noch nicht existiert. Beides ist bei einer Auto Scaling Group, die ständig neue Instanzen startet, keine Feinheit, sondern Voraussetzung.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein Sync-Job, kein `rsync`, kein Cron, der Instanzen abgleicht
- keine Kapazitätsplanung, kein Volume-Layout, kein Vergrößern
- kein Sonderfall für die frisch gestartete Instanz
- kein Umbau des CMS auf ein SDK
- kein Cluster-Dateisystem und keine Sperrverwaltung in der Anwendung
- kein Datenverlust beim Scale-in

Übrig bleiben: ein Dateisystem, drei Netzwerkkarten, eine Security-Group-Regel und eine Zeile in `/etc/fstab`.

## Wenn du dir eine Sache merkst

**EFS ist das einzige AWS-Dateisystem, das mehrere EC2-Instanzen über AZ-Grenzen hinweg gleichzeitig schreibend teilen können.**

EBS ist an eine AZ und an eine Instanz gebunden. EBS Multi-Attach löst die zweite Bindung, nicht die erste — und gibt dir ein Blockgerät, kein Dateisystem. S3 ist über AZs hinweg verfügbar, aber kein Dateisystem.

## Prüfungsknackpunkte

**Signalwörter:** *shared file system*, *NFS*, *POSIX-Rechte*, *mehrere Instanzen gleichzeitig*, *Kapazität soll automatisch wachsen*, *Linux*. Stehen zwei davon zusammen im Text, ist EFS die Antwort.

**Warum EBS Multi-Attach hier verliert:** Es funktioniert nur innerhalb einer Availability Zone und liefert ein Blockgerät, das ohne cluster-fähiges Dateisystem bei gleichzeitigem Schreiben zerstört wird. Das Szenario braucht beides nicht — es braucht drei AZs und ein fertiges Dateisystem.

**Warum S3 hier verliert:** Die Anwendung erwartet Pfade, Rechte und File Locking. S3 hat davon nichts. „Ändert die Anwendung nicht" schließt Objektspeicher aus, egal wie attraktiv der Preis ist.

**Warum FSx for Windows hier verliert:** Falsches Protokoll und falsches Betriebssystem. FSx for Windows spricht SMB und lebt von NTFS-ACLs und Active Directory; das CMS ist Linux und spricht NFS. Umgekehrt gilt dieselbe Regel — sobald „SMB", „NTFS-Berechtigungen" oder „Active Directory" im Text steht, ist EFS falsch. Das ist Karte 14.

**Warum One Zone hier verliert:** Billiger, aber es kann nur ein Mount Target in einer einzigen AZ haben. Eine Auto Scaling Group über drei AZs kann es gar nicht bedienen — und die Anforderung „AZ-Ausfall überstehen" ist damit ohnehin verfehlt.

**Die Falle mit dem Wort „elastisch".** Elastisch heißt nur: keine Provisionierung. Pro GB ist EFS Standard ein Vielfaches von S3 Standard und deutlich teurer als EBS gp3. Du bezahlst die geteilte POSIX-Semantik. Wenn eine Frage „kostengünstigste Lösung" sagt und die Anwendung mit Objektspeicher zufrieden wäre, ist EFS die eingebaute Falschantwort.

**Der Max-I/O-Reflex.** Max I/O ist eine Vorgängergeneration mit höheren Latenzen je Operation; die Doku empfiehlt General Purpose für alle Dateisysteme und schließt Max I/O für One Zone und für Elastic Throughput ganz aus. Wer in einer Antwortoption „Max I/O für bessere Performance" liest, liest eine veraltete Empfehlung.
