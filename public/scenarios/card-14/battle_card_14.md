---
nr: 14
title: "Windows-Fileserver in die Cloud — FSx for Windows mit Active Directory"
services:
  - Amazon FSx for Windows File Server
  - Active Directory (self-managed / AWS Managed Microsoft AD)
  - AWS Direct Connect
  - AWS Backup
signalwords:
  - "SMB-Freigaben"
  - "NTFS-Berechtigungen und AD-Gruppen"
  - "Laufwerksbuchstabe bleibt"
  - "Vorgängerversionen selbst wiederherstellen"
  - "kein Windows-Patching mehr"
  - "AZ-Ausfall überstehen"
domains: [D2, D1, D3]
assets:
  - battle_card_14.svg
  - battle_card_14.png
  - battle_card_14.pdf
status_note: "Sichtprüfung des gerenderten PNG durch Chat-Claude nicht möglich (view liefert leeres Bild) — rechnerische QC grün, optische Freigabe durch Oktay ausstehend."
---

# Battle Card 14 — FSx for Windows File Server · Active Directory

**Services:** Amazon FSx for Windows File Server (Multi-AZ), Active Directory (self-managed oder AWS Managed Microsoft AD), AWS Direct Connect / Site-to-Site VPN, Shadow Copies, AWS Backup — zur Abgrenzung: Amazon EFS, Windows-Fileserver auf EC2

**Szenario:**
Die **Bergmann Maschinenbau GmbH** betreibt im Werk Dortmund einen alternden Windows-Fileserver: **8 TB Abteilungs- und CAD-Shares**, an denen **450 Mitarbeiter** über das Laufwerk `Z:` hängen, verbunden mit `\\fileserver\shares`. Die Rechte liegen in **NTFS-ACLs auf Active-Directory-Gruppen**. Der Server soll weg — aber: Die Anwender sollen **nichts umlernen**, die bestehenden **AD-Gruppen und Berechtigungen sollen unverändert weitergelten**, versehentlich gelöschte Dateien sollen Anwender **selbst über „Vorgängerversionen"** zurückholen, das zweiköpfige IT-Team will **kein Windows mehr patchen**, und ein Ausfall einer Availability Zone darf die Produktion nicht stoppen. Das Active Directory bleibt vorerst im Werk stehen.

Signalwörter der Prüfung: *SMB* · *NTFS-Berechtigungen* · *Active-Directory-Integration* · *Windows-Anwendungen* · *hochverfügbar über AZs* · *vollständig verwaltet*.

---

## Ablauf

**1 — Die Clients sprechen weiter SMB — nur mit einem anderen Ziel.**
Statt `\\fileserver\shares` steht künftig `\\fsx.bergmann.local\shares` im Login-Skript. Das ist die gesamte Änderung auf der Client-Seite. Weder Anwendung noch Anwender merken den Umzug, weil FSx **nativ SMB (2.0 bis 3.1.1)** spricht und auf echtem Windows Server läuft — inklusive NTFS-ACLs, DFS Namespaces, Datei-Sperren und Volumeschattenkopien. Genau hier liegt der Unterschied zu jeder Nachbau-Lösung: Es wird nichts emuliert.

**2 — Der Weg ins VPC läuft über Direct Connect (oder Site-to-Site VPN).**
SMB über das offene Internet ist keine Option; die Verbindung ist privat. Über dieselbe Leitung laufen anschließend auch die **AD-Ports** für Authentifizierung und Domain-Beitritt. Für die Prüfung wichtig: Ein FSx-Dateisystem ist **aus dem Rechenzentrum erreichbar**, nicht nur aus dem VPC — genau deshalb funktioniert eine schrittweise Migration ohne Big-Bang.

**3 — Domain Join: FSx tritt der bestehenden Domäne bei.**
Das Dateisystem wird **beim Anlegen** in ein Active Directory eingebunden — hier das **self-managed AD** im Werk. Danach authentifiziert FSx Anwender gegen dieses AD und wertet die **vorhandenen NTFS-ACLs** aus. Der entscheidende Punkt für die Prüfung: **Das AD wird nicht migriert und nicht ersetzt.** Es bleibt die Quelle der Wahrheit, FSx wird nur Mitglied der Domäne. Die gestrichelte Alternativ-Box zeigt den zweiten gangbaren Weg: **AWS Managed Microsoft AD** im VPC — entweder als Ersatz oder über einen **Trust** neben dem bestehenden AD, was Authentifizierungen von der WAN-Leitung unabhängig macht.

**4 — Multi-AZ: Preferred und Standby, synchron repliziert.**
Beim Multi-AZ-Deployment betreibt FSx einen **aktiven Dateiserver in AZ a und einen Standby in AZ b** und repliziert **synchron** dazwischen. Bei Ausfall der aktiven AZ **und** bei der routinemäßigen Windows-Wartung schwenkt FSx automatisch um und später zurück. Der Standby ist deshalb gestrichelt gezeichnet: Er trägt keinen Verkehr, bis er gebraucht wird. Ein Single-AZ-Dateisystem ist billiger, hat aber **keinen** automatischen Failover — das ist die typische Kostenfalle in Prüfungsfragen mit dem Wort „hochverfügbar".

**Ein DNS-Name über den Failover hinweg (untere Box).**
Der Failover tauscht den Dateiserver aus, **nicht den Namen**. Windows-SMB-Clients folgen dem DNS-Wechsel selbständig und nehmen die Verbindung wieder auf — die Anwender bemerken bestenfalls eine kurze Pause. Bewusst mit aufgenommen ist die Kehrseite: **Linux- und macOS-Clients verbinden sich nicht automatisch auf den Standby**; sie nehmen den Betrieb erst wieder auf, wenn zurückgeschwenkt wurde. Wer FSx aus gemischten Umgebungen nutzt, muss das wissen.

**Schutz & Betrieb (rechte Box).**
**Shadow Copies** geben den Anwendern den Reiter „Vorgängerversionen" im Explorer zurück — das erledigt die Anforderung „selbst wiederherstellen" ohne Ticket an die IT. Dazu kommen **tägliche automatische Backups** (und AWS Backup für längere Aufbewahrung). Das **Patching des Windows Servers übernimmt AWS** im gewählten Wartungsfenster; bei Multi-AZ passiert das über einen Failover, also ohne Ausfall für Windows-Clients.

---

## Prüfungs-Kernsatz

> **SMB, NTFS-ACLs und Active Directory heißen immer FSx for Windows File Server — NFS und POSIX heißen immer EFS.** Und: FSx tritt der bestehenden Domäne bei, statt sie zu ersetzen.

---

## Klassiker-Fallen

**1. „EFS geht doch auch für Windows."**
Nein. EFS spricht **NFS**; Windows unterstützt NFS bestenfalls als Zusatzrolle, und es gibt weder NTFS-ACLs noch AD-Integration noch DFS. Sobald im Text „SMB", „Laufwerksbuchstabe", „Active-Directory-Gruppen" oder eine Windows-Anwendung (SQL Server, IIS, Sharepoint, Home Directories, WorkSpaces-Profile) vorkommt, ist EFS die Falschantwort. Umgekehrt gilt genauso: Für Linux-Webserver ist FSx for Windows die Falschantwort.

**2. Single-AZ mit Multi-AZ verwechseln.**
Single-AZ repliziert **innerhalb** einer AZ gegen Komponentenfehler — das ist Datenredundanz, keine Hochverfügbarkeit. Nur **Multi-AZ** stellt einen Standby in einer zweiten AZ bereit und schwenkt automatisch um. Steht in der Frage „muss den Ausfall einer Availability Zone überstehen", ist Single-AZ raus, egal wie attraktiv der Preis ist.

**3. Die FSx-Familie durcheinanderbringen.**
Vier Dateisysteme mit vier Zielgruppen: **FSx for Windows File Server** = SMB/NTFS/AD. **FSx for Lustre** = HPC und ML mit sehr hohem Durchsatz und S3-Anbindung. **FSx for NetApp ONTAP** = Multiprotokoll (NFS *und* SMB und iSCSI) mit Snapshots und Dedup — die Antwort, wenn eine bestehende **NetApp**-Landschaft genannt wird. **FSx for OpenZFS** = NFS mit ZFS-Snapshots. Das Reizwort in der Frage bestimmt die Antwort, nicht die Größe.

**4. „Dann eben Windows Server auf EC2."**
Technisch möglich, aber es beantwortet die Anforderung nicht: Patching, Backups, Failover-Cluster und Kapazitätsplanung bleiben beim Team. Wenn eine Frage „vollständig verwaltet", „ohne operativen Aufwand" oder „minimaler Verwaltungsaufwand" enthält, ist der selbstbetriebene Fileserver auf EC2 die bewusst eingebaute Falschantwort.

---

## Bewusste Vereinfachungen im Diagramm

- **Der Domain Join ist als ein Pfeil gezeichnet.** Tatsächlich sind es zwei getrennte Vorgänge: der einmalige Beitritt zur Domäne beim Anlegen des Dateisystems und die laufende Authentifizierung jedes Anwenders. Auch die konkret nötigen AD-Ports (DNS, Kerberos, LDAP, SMB) sind nur als „plus AD-Ports" zusammengefasst.
- **Der Standby wird nur mit einem Replikationspfeil dargestellt.** Der eigentliche Failover-Mechanismus (DNS-Umschaltung, Übernahme durch den Standby, späteres Failback) steckt in der unteren Box, nicht in einem eigenen Pfeil.
- **Die Alternativ-Box „AWS Managed Microsoft AD" liegt außerhalb der beiden AZ-Rahmen.** In Wirklichkeit läuft auch ein AWS Managed Microsoft AD auf Domain Controllern in zwei AZs.
- **Subnetze, Security Groups, Route Tables und das Direct-Connect-Gateway** sind nicht gezeichnet.
- **Speicher- und Durchsatzkapazität** (SSD oder HDD, konfigurierbarer Durchsatz, Data Deduplication, Benutzerquoten) sind nicht dargestellt — sie ändern die Architektur nicht, wohl aber die Rechnung.
