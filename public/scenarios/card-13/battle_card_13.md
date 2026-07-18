---
nr: 13
title: "Gemeinsames Dateisystem für mehrere Webserver — EFS über drei AZs"
services:
  - Amazon EFS
  - EC2 Auto Scaling
  - ALB
  - EFS Mount Targets
  - EFS Lifecycle Management
signalwords:
  - "mehrere Instanzen brauchen dieselben Dateien"
  - "shared file system / NFS"
  - "POSIX-Rechte und File Locking"
  - "gleichzeitiger Zugriff aus mehreren AZs"
  - "Kapazität soll automatisch wachsen"
domains: [D2, D3, D4]
assets:
  - battle_card_13.svg
  - battle_card_13.png
  - battle_card_13.pdf
status_note: "Sichtprüfung des gerenderten PNG durch Chat-Claude nicht möglich (view liefert leeres Bild) — rechnerische QC grün, optische Freigabe durch Oktay ausstehend."
---

# Battle Card 13 — Amazon EFS · EC2 Multi-AZ

**Services:** Amazon EFS (Regional), EFS Mount Targets, EC2 Auto Scaling, Application Load Balancer, EFS Lifecycle Management — zur Abgrenzung: EBS, EBS Multi-Attach, S3

**Szenario:**
Die **Nordpresse Digital GmbH** betreibt ein Redaktions-CMS auf einer Auto Scaling Group mit **3 bis 12 EC2-Instanzen in drei Availability Zones** hinter einem ALB. Redakteure laden Bilder und PDFs hoch, die sofort auf der Website erscheinen sollen. Heute landen die Uploads auf der **lokalen EBS-Platte der Instanz**, die den Request zufällig bearbeitet hat — der nächste Request trifft eine andere Instanz und liefert **404**. Skaliert die Gruppe abends herunter, verschwinden die Dateien dieser Instanz mit ihr. Die Anwendung ist ein klassisches PHP-CMS und erwartet ein **normales Dateisystem mit Pfaden, Rechten und Locking**; sie auf Objektspeicher umzuschreiben, steht nicht zur Debatte. Die Medienbibliothek umfasst rund 3 TB und wächst monatlich.

Signalwörter der Prüfung: *shared file system* · *mehrere Instanzen gleichzeitig* · *NFS* · *POSIX* · *AZ-übergreifend* · *Kapazität wächst automatisch*.

---

## Ablauf

**1 — Der ALB verteilt Requests auf Instanzen in allen drei AZs.**
Das ist der Ausgangspunkt des Problems, nicht die Lösung: Genau weil **jeder Request auf einer anderen Instanz landen kann**, darf der Zustand nicht auf einer Instanz liegen. Die Auto Scaling Group verschärft es zusätzlich — Instanzen entstehen und verschwinden, und mit ihnen ihre lokalen Volumes. Die Architekturregel dahinter ist älter als AWS: **Zustand raus aus der Compute-Schicht.**

**2 — Jede Instanz mountet EFS über den Mount Target ihrer eigenen AZ.**
Ein **Mount Target ist eine ENI mit einer IP-Adresse in genau einem Subnetz einer AZ** — und man legt **genau einen pro AZ** an. Die Instanz mountet per NFS gegen den DNS-Namen des Dateisystems, und die AZ-lokale Auflösung sorgt dafür, dass der Verkehr die AZ nicht verlässt. Die Zugriffskontrolle auf Netzwerkebene läuft über **Security Groups auf TCP-Port 2049**: Die SG des Mount Targets erlaubt eingehend 2049 von der SG der Webserver. Das ist der häufigste Praxisfehler — das Dateisystem existiert, der Mount hängt, und die Ursache ist eine fehlende SG-Regel oder ein fehlender Mount Target in genau der AZ, in der die neue Instanz gestartet ist.

**3 — Schreiben: die Redakteurin lädt in AZ b ein Bild hoch.**
Der Schreibvorgang geht als normaler Dateisystem-Write über NFS v4.1 an das Dateisystem. Für die Anwendung ist das ein `fopen`/`fwrite` auf `/var/www/media` — **keine SDK-Aufrufe, keine Signaturen, kein Code-Umbau**. Genau das ist der Grund, warum hier EFS und nicht S3 die Antwort ist: Die Anforderung lautet „Dateisystem", nicht „Speicher".

**4 — Lesen: dieselbe Datei ist in AZ a und AZ c sofort da.**
Die beiden gestrichelten Rückpfeile sind der Kern der Karte. Es wird **nichts repliziert, nichts synchronisiert, nichts kopiert** — es gibt nur **ein** Dateisystem, das über die AZ-Grenzen hinweg dasselbe ist. Deshalb liefert auch die frisch hochskalierte Instanz in AZ c ab der ersten Sekunde die vollständige Medienbibliothek aus, ohne Warm-up und ohne Sync-Job. Ein Regional-Dateisystem speichert die Daten zusätzlich redundant über mehrere AZs: Fällt eine AZ aus, arbeiten die anderen weiter.

**Lifecycle Management (gelbe Box): der Kostenhebel.**
EFS Standard liegt auf SSD und liefert Latenzen im Sub-Millisekunden-Bereich — und ist mit Abstand die teuerste Speicherart pro GB in diesem Vergleich. Die empfohlene Standardrichtlinie verschiebt Dateien deshalb nach **30 Tagen ohne Zugriff in EFS IA** und nach **90 Tagen in EFS Archive**. **EFS Intelligent-Tiering** holt eine Datei bei Zugriff automatisch zurück nach Standard. Für ein Medienarchiv ist das ideal: Der Artikel von 2019 wird einmal im Jahr aufgerufen und kostet den Rest der Zeit fast nichts.

---

## Prüfungs-Kernsatz

> **EFS ist das einzige AWS-Dateisystem, das mehrere EC2-Instanzen über AZ-Grenzen hinweg gleichzeitig schreibend teilen können.** EBS ist an eine AZ und (bis auf Multi-Attach) an eine Instanz gebunden, S3 ist kein Dateisystem — sobald „NFS", „POSIX" oder „shared file system" im Text steht, ist EFS die Antwort.

---

## Klassiker-Fallen

**1. „Dann nehmen wir EBS Multi-Attach."**
Multi-Attach gibt es nur für **io1/io2**, nur für Instanzen **in derselben Availability Zone**, und — der eigentliche Killer — es liefert nur ein gemeinsames **Block**-Gerät. Zwei Instanzen, die dasselbe ext4 mounten, zerstören es gegenseitig; man braucht ein **cluster-fähiges Dateisystem** (GFS2, OCFS2). Multi-Attach löst das Szenario also weder über AZ-Grenzen noch ohne zusätzliche Software.

**2. EFS ≠ FSx.**
Die Unterscheidung geht über das Protokoll: **EFS = NFS = Linux**. **FSx for Windows File Server = SMB = Windows/Active Directory** (das ist Karte 14). **FSx for Lustre** ist HPC/ML mit S3-Anbindung, **FSx for NetApp ONTAP** bringt Multiprotokoll und NetApp-Features. Steht im Fragetext „SMB-Share", „NTFS-Berechtigungen" oder „Active Directory", ist EFS falsch — auch wenn „shared file system" dabeisteht.

**3. Ein Mount Target pro AZ — nicht pro Instanz, nicht pro VPC.**
Wer eine vierte AZ zur Auto Scaling Group hinzufügt und den Mount Target vergisst, bekommt Instanzen, die nicht mounten können. Ebenso oft geprüft: **Security Group auf Port 2049**, und dass ein **Regional**-Dateisystem (nicht One Zone) nötig ist, wenn ein AZ-Ausfall überlebt werden soll — One Zone ist billiger, aber wirft genau die Verfügbarkeit weg, um die es hier geht.

**4. „EFS ist billig, weil es elastisch ist."**
Elastisch heißt nur: keine Provisionierung. Pro GB ist EFS Standard ein Vielfaches von S3 Standard und deutlich teurer als EBS gp3. Man bezahlt die **geteilte POSIX-Semantik**. Deshalb gehören Lifecycle-Regeln zu jedem EFS-Design dazu — und deshalb ist EFS die falsche Antwort, wenn die Anwendung mit Objektspeicher zufrieden wäre. Zu beachten: IA und Archive haben **Abrufgebühren pro GB**, und EFS Archive hat eine **Mindestspeicherdauer von 90 Tagen**.

---

## Bewusste Vereinfachungen im Diagramm

- **„Schreiben in AZ b ist in a und c sofort sichtbar" ist die verkürzte Fassung.** Fachlich exakt: EFS liefert die **close-to-open-Konsistenzsemantik**, die Anwendungen von NFS erwarten. Schreibvorgänge werden bei Regional-Dateisystemen dann AZ-übergreifend dauerhaft gespeichert, wenn die Anwendung **synchron schreibt** (`O_DIRECT`, `fsync`) **oder die Datei schließt**. Nur für synchron schreibende, nicht anhängende Zugriffe gilt echte Read-after-Write-Konsistenz. Für das CMS-Szenario (Datei hochladen, schließen, danach ausliefern) ist die Verkürzung zutreffend, für einen gleichzeitig von zwei Instanzen beschriebenen Log wäre sie es nicht.
- **Nur drei EC2-Instanzen sind gezeichnet**, tatsächlich sind es 3 bis 12; EFS unterstützt Tausende gleichzeitiger Verbindungen.
- **Der ALB ist als eine Box dargestellt**, obwohl er selbst über alle AZs verteilt ist. Die Auto Scaling Group ist nicht als eigener Rahmen gezeichnet, sondern in der ALB-Box benannt.
- **Nicht dargestellt:** EFS Access Points, IAM-Autorisierung für NFS-Clients, Verschlüsselung at rest und in transit (TLS über den `amazon-efs-utils`-Mount-Helper), AWS Backup und die EFS-Replikation in eine zweite Region.
- **Die Throughput-Modi sind auf „Elastic (Default)" verkürzt.** Provisioned und Bursting existieren weiter und sind bei bekannter, dauerhaft hoher Last die günstigere Wahl.
