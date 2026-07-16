---
service: AWS Storage Gateway
seedKey: saa-c03-script-storage-gateway
batch: B1
domains: [D3, D4]
sourceRef:
  - https://aws.amazon.com/storagegateway/faqs/
  - https://aws.amazon.com/storagegateway/features/
status: draft
---

# AWS Storage Gateway

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Storage Gateway = das **magische Verlängerungskabel zwischen Keller und Cloud**: eine Software/Appliance on-prem, die für lokale Anwendungen wie normaler Speicher aussieht, die Daten aber in AWS ablegt. Drei Gesichter: **File Gateway** (NFS/SMB → S3), **Volume Gateway** (iSCSI → EBS-Snapshots), **Tape Gateway** (virtueller Bandroboter → Glacier). Abgrenzung: Gateway = **Dauerbrücke**, DataSync = **Umzugsdienst**.

Der SAA verlangt die Feinmechanik: **Cached oder Stored? Welche Illusion für welches Protokoll? Und wann ist das Gateway trotz Hybrid-Signalwort die falsche Antwort?**

---

## 🎯 SAA-Vertiefung

### S3 File Gateway: Das Netzlaufwerk, das heimlich ein Bucket ist

**Das Problem:** Eine gewachsene On-Prem-Anwendung schreibt stur per **NFS/SMB** auf den Fileserver — aber die Analytics-Abteilung will dieselben Daten als **S3-Objekte** für Athena und Glue. Zwei Kopien pflegen? Die App umschreiben?

**Die Lösung:** Das **S3 File Gateway** präsentiert on-prem ein ganz normales NFS/SMB-Share — und legt jede Datei **1:1 als S3-Objekt** ab. Die App merkt nichts, die Cloud sieht echte Objekte (kein proprietäres Format!), und ein lokaler **Cache** hält die heißen Dateien für schnelle Zugriffe vor Ort. Klassische Einsätze: Fileserver-Auslagerung bei vollem NAS, Datenbank-Dumps (SQL Server/Oracle/SAP) nach S3, Data-Lake-Zulauf bei weiterlaufendem lokalem Zugriff.

🛑 **Aktualität:** Das Schwester-Produkt **FSx File Gateway** (SMB-Cache vor FSx for Windows) ist seit **28.10.2024 für Neukunden geschlossen** — in neuen Szenarien keine gültige Antwort mehr.

> **💡 Merksatz:** „On-prem-App spricht NFS/SMB, Daten sollen als **echte S3-Objekte** nutzbar sein, lokaler Zugriff bleibt" → **S3 File Gateway**. Die 1:1-Objekt-Abbildung ist sein Alleinstellungsmerkmal.

### Volume Gateway: Cached oder Stored — wo wohnen die Primärdaten?

**Das Problem:** Anwendungen, die kein Dateisystem, sondern eine **nackte Festplatte (iSCSI/Block)** erwarten — und die Frage: Der lokale Speicher ist knapp *oder* die Latenz muss lokal bleiben. Was zuerst?

**Die Lösung:** Der Volume Gateway hat zwei Modi, und die Prüfung testet genau diese eine Unterscheidung:

- **Cached Volumes:** Die **Primärdaten liegen in S3**, nur die heißen Blöcke bleiben im lokalen Cache. Antwort auf: „lokaler Speicher wird knapp, Apps brauchen weiter Block-Zugriff" — quasi unendliche Platte mit lokalem Turbolader.
- **Stored Volumes:** Die **Primärdaten bleiben komplett on-prem** (volle lokale Latenz), und asynchron wandern Snapshots als **EBS-Snapshots** nach AWS. Antwort auf: „niedrigste lokale Latenz zwingend + Offsite-Backup in der Cloud".

Ein Detail für Restore-Fragen: Weil die Sicherungen **EBS-Snapshots** sind, kann man daraus im DR-Fall direkt EBS-Volumes für EC2 erzeugen — die on-prem-Platte lässt sich in der Cloud „wiederbeleben".

> **💡 Merksatz:** **Cached = primär Cloud** (Platzproblem lösen), **Stored = primär on-prem** (Latenz behalten, Cloud als Backup). Merke: Der Name beschreibt, was *lokal* passiert.

### Tape Gateway: Der Kassettenroboter, den es nicht gibt

**Das Problem:** Die Firma hat jahrzehntealte Backup-Prozesse mit **Veeam/NetBackup/Commvault** auf physische Tapes — Kassetten wechseln, auslagern, testen. Die Tapes sollen weg, aber die Backup-Software (und ihre Prozesse, Audits, Verträge) soll bleiben.

**Die Lösung:** Der **Tape Gateway** emuliert eine **Virtual Tape Library (VTL)** über iSCSI — die Backup-Software glaubt, sie schreibe auf Bänder, in Wahrheit landen die „Tapes" in S3 und werden zur Archivierung nach **Glacier / Deep Archive** ausgelagert. Kein Software-Wechsel, keine physischen Kassetten mehr.

Allen drei Typen gemeinsam: ein **Write-Back-Cache** — Schreibzugriffe werden lokal bestätigt und asynchron hochgeladen. Die Apps spüren die Cloud-Latenz nicht.

> **💡 Merksatz:** „Physische Tapes ablösen, **Backup-Software behalten**" → **Tape Gateway (VTL)** → Deep Archive für die Langzeit-Kosten.

### Die Abgrenzungen — hier fallen die Punkte

Das Gateway hat drei Nachbarn, mit denen es die Prüfung systematisch verwechseln lässt:

- **vs. DataSync:** Das Gateway ist der **Dauerzustand** (laufender hybrider *Zugriff*); DataSync ist der **Transport** (Daten *bewegen*, einmalig oder geplant). Fragt das Szenario „App greift weiter zu" → Gateway; „Daten migrieren/kopieren" → DataSync.
- **vs. Transfer Family:** Das Gateway bedient die **eigene** Infrastruktur über NFS/SMB/iSCSI; Transfer Family bedient **externe Partner** über SFTP/FTPS/AS2. Wer liefert an — du oder Dritte?
- **vs. Outposts:** Gateway = Software-Brücke zu Cloud-*Speicher*; Outposts = echte AWS-*Hardware* (Compute + Storage) im eigenen RZ. „AWS-Dienste müssen lokal laufen" → Outposts, nicht Gateway.
- **vs. EFS/FSx über Direct Connect:** Direktes Mounten über die Leitung funktioniert, aber bei begrenzter Bandbreite/Latenz ist der lokale **Gateway-Cache** die bessere Antwort — und meist die günstigere.

---

## ⚠️ Prüfungs-Knackpunkte

- NFS/SMB on-prem, Daten als echte S3-Objekte, Zugriff bleibt → **S3 File Gateway** (1:1-Objekt-Mapping).
- 🛑 **FSx File Gateway:** seit 10/2024 keine Neukunden — in neuen Szenarien Distraktor.
- iSCSI/Block: **Cached** = primär S3 (Platz), **Stored** = primär lokal (Latenz) + EBS-Snapshots als Backup.
- Tapes ablösen ohne Backup-Software-Wechsel → **Tape Gateway (VTL)** → Glacier/Deep Archive.
- Alle Gateways: Write-Back-Cache — lokal committen, asynchron hochladen.
- Laufender Zugriff → **Gateway**; Daten bewegen → **DataSync**; externe Partner per SFTP → **Transfer Family**; AWS-Hardware vor Ort → **Outposts**.

## 💡 Der eine Satz zum Mitnehmen

**Storage Gateway beantwortet immer die Frage „Wie sieht meine On-Prem-App Cloud-Speicher, ohne es zu merken?"** — das Protokoll (NFS/SMB, iSCSI, Tape) wählt den Typ, und Cached vs. Stored entscheidet nur, ob die Primärdaten in der Cloud oder im Keller wohnen.
