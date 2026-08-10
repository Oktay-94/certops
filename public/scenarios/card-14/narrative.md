---
cardNumber: 14
slug: fsx-windows-active-directory-bergmann-fileserver
title: "Windows-Fileserver in die Cloud — FSx for Windows mit Active Directory"
services:
  - "Amazon FSx for Windows File Server"
  - "Active Directory (self-managed / AWS Managed Microsoft AD)"
  - "AWS Direct Connect"
  - "Windows Shadow Copies"
  - "AWS Backup"
domains: ["D1", "D2", "D3"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-07-29"
sources:
  - "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/high-availability-multiAZ.html"
  - "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/shadow-copies-fsxW.html"
  - "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/shadow-copy-ts.html"
  - "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/data-protection.html"
  - "https://docs.aws.amazon.com/fsx/latest/WindowsGuide/supported-fsx-clients.html"
  - "https://docs.aws.amazon.com/sdk-for-kotlin/api/latest/fsx/aws.sdk.kotlin.services.fsx.model/-self-managed-active-directory-configuration"
  - "https://aws.amazon.com/fsx/windows/faqs/"
  - "https://aws.amazon.com/fsx/windows/features/"
  - "https://aws.amazon.com/blogs/storage/enabling-microsoft-shadow-copies-with-amazon-fsx-for-windows-file-server"
---

## Die Grundidee zuerst

Stell dir vor, eine Firma zieht mit ihrem Archiv in ein anderes Gebäude um. Es gibt zwei Arten, das zu tun.

**Weg eins:** Neues Gebäude, neue Regale, neue Schließanlage. Jeder Mitarbeiter bekommt einen neuen Schlüssel, jede Abteilung muss neu eintragen lassen, wer welchen Raum betreten darf. Die Akten sind dieselben, aber alles drumherum wird noch einmal von Hand aufgebaut — und drei Monate lang findet niemand etwas.

**Weg zwei:** Neues Gebäude, aber die alte Schließanlage wird übernommen. Dieselben Schlüssel, dieselbe Liste, wer wohin darf. Der Hausmeister ist ein anderer, und man merkt es nur daran, dass niemand mehr die Heizung reparieren muss. Für die Mitarbeiter ändert sich genau eine Sache: die Adresse.

Der zweite Weg ist FSx for Windows File Server.

**Der Schlüsselbund ist das Active Directory, und der wird nicht neu ausgegeben — er wird weiterbenutzt.** Genau darum geht es auf dieser Karte: Der Fileserver zieht um, die Identitäten bleiben stehen, und die Anwender merken vom Umzug nichts außer einem anderen Pfad im Login-Skript.

## Was es eigentlich ist — ein Windows Server, den du nicht besitzt

Das zentrale Objekt ist ein Dateisystem, das beim Anlegen einer Domäne beitritt. Beides passiert in einem einzigen Aufruf:

```json
{
  "FileSystemType": "WINDOWS",
  "StorageCapacity": 8192,
  "StorageType": "SSD",
  "SubnetIds": ["subnet-0dortmund-a", "subnet-0dortmund-b"],
  "WindowsConfiguration": {
    "DeploymentType": "MULTI_AZ_1",
    "PreferredSubnetId": "subnet-0dortmund-a",
    "ThroughputCapacity": 64,
    "AutomaticBackupRetentionDays": 30,
    "SelfManagedActiveDirectoryConfiguration": {
      "DomainName": "bergmann.local",
      "OrganizationalUnitDistinguishedName": "OU=FSx,OU=Server,DC=bergmann,DC=local",
      "FileSystemAdministratorsGroup": "FSxAdmins",
      "UserName": "svc-fsx-join",
      "DnsIps": ["10.20.0.10", "10.20.0.11"]
    }
  }
}
```

Lies die letzten sechs Zeilen besonders langsam, denn dort steckt die Prüfungsaussage der ganzen Karte. Es gibt kein Feld „Benutzer migrieren" und kein Feld „Gruppen übernehmen". Es gibt einen Domänennamen, eine Organisationseinheit, ein Dienstkonto und zwei DNS-Server.

**Das Dateisystem wird Mitglied einer bestehenden Domäne — es ersetzt sie nicht und kopiert nichts aus ihr heraus.** `DnsIps` zeigt auf die Domain Controller im Werk Dortmund; die stehen weiterhin dort und entscheiden weiterhin, wer wer ist.

Zwei Zeilen weiter oben stehen die zwei Subnetze und `PreferredSubnetId`. Das ist Multi-AZ in seiner ganzen Konfiguration: zwei Subnetze in zwei AZs, eines davon bevorzugt.

## Der Weg durch die Karte

### Der Clients-Kasten — 450 Leute, die nichts umlernen sollen

Links oben stehen die eigentlichen Auftraggeber: 450 Mitarbeiter, Laufwerk `Z:`, 8 TB Abteilungs- und CAD-Shares. Der wichtigste Satz im Kasten ist der leiseste: *merken vom Umzug nichts*.

Das ist keine Bequemlichkeit, sondern die Anforderung, an der die meisten Alternativen scheitern. Eine Lösung, die Schulungen, neue Clients oder eine Umstellung der Anwendungen erfordert, hat die Aufgabe nicht gelöst, egal wie elegant sie technisch ist.

### Badge 1 — SMB, nur mit einem anderen Ziel

Aus `\\fileserver\shares` wird `\\fsx.bergmann.local\shares`. Das ist die vollständige Änderung auf der Clientseite — eine Zeile im Login-Skript oder eine angepasste Gruppenrichtlinie.

Das funktioniert, weil nichts nachgebaut wird. FSx spricht SMB in den Versionen 2.0 bis 3.1.1 und läuft auf echtem Windows Server, mit NTFS-ACLs, DFS Namespaces, Datei-Sperren und Volumeschattenkopien. Ein SMB-Client kann nicht unterscheiden, ob am anderen Ende ein Server im Keller oder ein verwaltetes Dateisystem steht.

Nebenbei verschlüsselt FSx den Verkehr automatisch mit SMB-Kerberos-Sitzungsschlüsseln, sobald der Client SMB 3.0 oder neuer spricht. Das ist der Fall für alles ab Windows 8 und Windows Server 2012 sowie für Linux-Clients mit Samba ab 4.2.

### Badge 2 — der Weg ins VPC ist privat, nicht öffentlich

SMB über das offene Internet ist keine Option, und FSx macht diese Entscheidung nicht verhandelbar: Der Zugriff aus dem oder ins öffentliche Internet wird nicht unterstützt. Hängt jemand eine Elastic IP an die Netzwerkkarte des Dateisystems, entfernt AWS sie automatisch wieder.

Bleibt der private Weg — Direct Connect oder Site-to-Site VPN. Wichtig für die Prüfung: **Ein FSx-Dateisystem ist aus dem Rechenzentrum erreichbar, nicht nur aus dem VPC.** Genau deshalb funktioniert eine schrittweise Migration, bei der Abteilung für Abteilung umgestellt wird, statt an einem Wochenende alles auf einmal.

### Badge 3 — Domain Join und Authentifizierung, dieselbe Leitung

Der gestrichelte violette Pfeil trägt zwei Vorgänge, die auf der Karte zu einem zusammengefasst sind: den einmaligen Beitritt zur Domäne beim Anlegen des Dateisystems und die laufende Authentifizierung jedes einzelnen Anwenders danach.

Beides läuft über dieselbe private Leitung zu den Domain Controllern in Dortmund. Und das ist der Punkt, an dem die Architektur eine unangenehme Eigenschaft bekommt: **Die WAN-Leitung wird zur Abhängigkeit für Anmeldungen, nicht nur für Dateizugriffe.**

### Der AD-Kasten — die Quelle der Wahrheit bleibt stehen

`bleibt die Quelle der Wahrheit` und `wird NICHT migriert` sind die beiden Zeilen, die auf dieser Karte am häufigsten geprüft werden. Die NTFS-ACLs auf den Dateien verweisen auf AD-Gruppen; FSx wertet diese Verweise aus, indem es dieselbe Domäne fragt wie der alte Server. Deshalb gelten die bestehenden Berechtigungen unverändert weiter, ohne dass irgendjemand sie neu setzt.

Das Bild dazu: Der Umzug tauscht das Gebäude, nicht das Melderegister.

### Der Alternative-Kasten — AWS Managed Microsoft AD

Der gestrichelte Kasten rechts zeigt den zweiten gangbaren Weg, und er ist die Antwort auf die Abhängigkeit aus Badge 3. Statt gegen Dortmund zu authentifizieren, betreibt man einen AWS Managed Microsoft AD im VPC — entweder als Ersatz oder, häufiger, zusätzlich mit einer Vertrauensstellung zum bestehenden Wald.

Die Doku ist an dieser Stelle präziser als der Kasten: Für die Windows-Authentifizierung in FSx genügt eine **einseitige** Forest-Trust-Beziehung, in der die AWS-verwaltete Domäne der Unternehmensdomäne vertraut. Die Unternehmensdomäne ist die vertraute, die AWS-Domäne die vertrauende Seite.

### Der Preferred-Kasten — ein echter Windows Server

`echter Windows Server — von AWS gepatcht` ist die Zusammenfassung des Geschäftsmodells. Du bekommst kein Nachbau-Protokoll, sondern Windows Server, und du bekommst ihn ohne die Arbeit, die daran hängt: Patchen, Kapazitätsplanung, Failover-Cluster-Konfiguration, Backup-Einrichtung.

### Badge 4 — synchron repliziert

Multi-AZ ist ein Hochverfügbarkeitscluster aus Windows-Dateiservern über zwei AZs, technisch auf Basis von Windows Server Failover Clustering. Die Daten werden **synchron** repliziert, und zwar sowohl innerhalb jeder AZ als auch zwischen den beiden.

Synchron ist hier das entscheidende Wort: Ein Schreibvorgang gilt erst als abgeschlossen, wenn er auf beiden Seiten liegt. Deshalb kostet ein Failover keine Daten.

### Der Standby-Kasten — gestrichelt, weil er nichts tut

Der Standby trägt keinen Verkehr, bis er gebraucht wird. Ausgelöst wird der Wechsel in drei Fällen: AZ-Ausfall, Ausfall des bevorzugten Dateiservers, oder planmäßige Wartung an ihm.

Der Failover ist typischerweise in weniger als 30 Sekunden abgeschlossen, gerechnet von der Erkennung des Fehlers bis zur Übernahme durch den Standby. Der Rückschwenk dauert ebenfalls weniger als 30 Sekunden und passiert erst, wenn der bevorzugte Server vollständig wiederhergestellt ist.

### Der DNS-Kasten — ein Name über den Failover hinweg

Der Failover tauscht den Dateiserver aus, nicht den Namen. Windows-Clients folgen dem DNS-Wechsel selbständig und nehmen die Verbindung wieder auf; für Windows-Anwendungen ist der Vorgang transparent.

### Der Kasten „Schutz & Betrieb"

Drei Zeilen, aber sie haben nicht denselben Status — dazu gleich mehr in der ehrlichen Feinheit. Shadow Copies geben den Anwendern den Reiter „Vorgängerversionen" im Explorer: Rechtsklick auf die Datei, *Vorgängerversionen wiederherstellen*, fertig. Kein Ticket, keine IT.

Dazu kommen automatische tägliche Backups nach S3 sowie das Patchen des Windows Servers durch AWS im gewählten Wartungsfenster. Bei Multi-AZ läuft dieses Patchen über einen Failover — also ohne Ausfall für Windows-Clients.

## Die entscheidende Unterscheidung

Single-AZ und Multi-AZ klingen wie zwei Preisstufen. Sie sind zwei verschiedene Verfügbarkeitsversprechen:

| | Single-AZ | Multi-AZ |
|---|---|---|
| Aufbau | ein Dateiserver, ein Subnetz | HA-Cluster über zwei AZs, WSFC |
| Replikation | innerhalb einer AZ | synchron innerhalb *und* zwischen den AZs |
| Bei Ausfall | Wiederherstellung, typischerweise rund 30 Minuten offline | automatischer Failover, in der Regel unter 30 Sekunden |
| Bei Wartung | Ausfallzeit im Wartungsfenster | Failover, für Windows-Clients unterbrechungsfrei |
| Ressourcen | 1 Subnetz, 1 ENI | 2 Subnetze, 2 ENIs, 4 IP-Adressen |

**Datenredundanz ist nicht Hochverfügbarkeit.** Single-AZ repliziert gegen Komponentenfehler; es hat trotzdem keinen zweiten Server, der übernehmen könnte.

## Die ehrliche Feinheit

**Erstens ein Kartenbefund, der eine Betriebssystemfamilie zu viel nennt.** Auf der Karte steht „Linux- und macOS-SMB-Clients tun das nicht automatisch". Richtig belegt ist davon die Hälfte: Der User Guide führt einen eigenen Abschnitt „Failover experience on Linux clients" und sagt, Linux-Clients unterstützten kein automatisches DNS-basiertes Failover; die FAQ wiederholt das wortgleich für Linux. macOS taucht in keiner der beiden Quellen an dieser Stelle auf — wohl aber in der Liste der unterstützten Clients. Fixvorschlag für die Karte: `Linux-SMB-Clients tun das nicht automatisch`.

Die Aussage selbst bleibt wichtig: Ein Linux-Client hängt nach einem Failover, bis zurückgeschwenkt wurde. Bei einer Wartung, die planmäßig über einen Failover läuft, heißt das: Die Windows-Arbeitsplätze merken nichts, der Linux-Buildserver steht.

**Zweitens: Shadow Copies sind kein Schalter, der bereits umgelegt ist.** Der Kasten „Schutz & Betrieb" stellt drei Dinge nebeneinander, von denen zwei ab Werk laufen und eines nicht. Die Doku ist unmissverständlich: Shadow Copies sind auf FSx for Windows nicht standardmäßig aktiviert; sie müssen eingeschaltet und mit einem Zeitplan versehen werden, und das geht über PowerShell-Befehle gegen den Windows-Remote-Endpunkt des Dateisystems. Fixvorschlag: `Shadow Copies (einzuschalten)`.

Wer die Anforderung „Anwender sollen versehentlich gelöschte Dateien selbst zurückholen" mit „FSx kann das" beantwortet und dann nichts konfiguriert, hat sie nicht erfüllt.

Dazu gehört auch die Einschränkung, die AWS selbst betont: **Shadow Copies sind kein Ersatz für Backups.** Sie liegen im Dateisystem und verbrauchen dessen Speicherkapazität — nur für die geänderten Teile der Dateien, aber eben dort. Geht das Dateisystem verloren, gehen sie mit.

Bei der Obergrenze widersprechen sich zwei Seiten desselben User Guide: Die Feature-Seite nennt eine Zahl, die Troubleshooting-Seite eine andere, und beide beschreiben denselben Mechanismus — ist das Limit erreicht, ersetzt die nächste Momentaufnahme die älteste. Deshalb steht hier keine Zahl. Merken solltest du nur die Mechanik: Es gibt ein Limit, und wenn es greift, verschwindet still die älteste Version.

**Drittens eine Namensverwechslung, die man der Karte nicht ansieht.** Im Preferred-Kasten steht `DFS Namespaces` — und das ist bewusst nicht `DFS Replication`. Die Feature-Tabelle des User Guide trennt beides: Namespaces unterstützen alle drei Deployment-Typen, also auch Multi-AZ. DFS Replication dagegen führt die Tabelle ausschließlich für Single-AZ 1. Auf Multi-AZ gibt es sie nicht, weil die Replikation dort ohnehin synchron durch den Cluster erledigt wird. Wer aus einer bestehenden DFSR-Landschaft migriert, gibt genau diesen Mechanismus ab und bekommt Multi-AZ dafür.

**Viertens, was Multi-AZ nicht abdeckt:** Während Failover und Failback kann I/O pausieren, und die Schreibvorgänge aus dieser Phase müssen anschließend zwischen den beiden Dateiservern abgeglichen werden. Bei HDD-Speicher und schreibintensiven Lasten kann dieser Abgleich laut Doku mehrere Stunden dauern. „Unter 30 Sekunden" beschreibt den Schwenk, nicht die vollständige Rückkehr zum Normalzustand.

## Syntax lesen — der Distinguished Name

Die eine Zeile in der Konfiguration, die regelmäßig falsch gesetzt wird, ist keine AWS-Syntax, sondern LDAP:

```
OU=FSx, OU=Server, DC=bergmann, DC=local
│       │          │            │
│       │          └────────────┴─ Domäne, in Bestandteile zerlegt:
│       │                          bergmann.local
│       └─ übergeordnete Organisationseinheit
└─ die OU, in der das Computerkonto angelegt wird
```

**Ein Distinguished Name wird von rechts nach links gelesen.** Rechts steht die Wurzel, links das konkrete Objekt. `DC` ist ein Bestandteil des Domänennamens — `bergmann.local` zerfällt in `DC=bergmann,DC=local`. `OU` ist eine Organisationseinheit, und die Reihenfolge bildet die Verschachtelung ab.

Praktische Folge: Das Dienstkonto aus `UserName` braucht genau in dieser OU das Recht, Computerkonten anzulegen und in die Domäne aufzunehmen. Nicht irgendwo in der Domäne — dort. Ein Beitritt, der mit „access denied" scheitert, scheitert fast immer an dieser Delegierung und nicht an den Anmeldedaten.

Zwei Grenzen aus der Doku gehören daneben: Domänennamen im Single-Label-Format werden nicht unterstützt, und für Single-AZ 2 sowie alle Multi-AZ-Dateisysteme darf der AD-Domänenname 47 Zeichen nicht überschreiten.

## Was du dadurch nicht baust

- kein Windows-Patching, kein Neustartfenster, das jemand plant
- keinen Failover-Cluster, den jemand konfiguriert und testet
- keine Sicherungssoftware und keinen Sicherungsserver
- keine Migration von Benutzern, Gruppen oder Berechtigungen
- keine Umstellung der Clients, keine Schulung, kein neuer Laufwerksbuchstabe
- kein Ticket für jede versehentlich gelöschte Datei — sofern Shadow Copies eingeschaltet sind

Übrig bleibt: eine geänderte Zeile im Login-Skript und ein zweiköpfiges IT-Team, das wieder Zeit für anderes hat.

## Wenn du dir eine Sache merkst

**SMB, NTFS-ACLs und Active Directory heißen immer FSx for Windows File Server — NFS und POSIX heißen immer EFS.**

Und der zweite Halbsatz, der genauso oft geprüft wird: FSx tritt der bestehenden Domäne bei, statt sie zu ersetzen.

## Prüfungsknackpunkte

**Signalwörter:** *SMB-Freigabe*, *NTFS-Berechtigungen*, *Active-Directory-Gruppen*, *Laufwerksbuchstabe*, *Vorgängerversionen*, *Windows-Anwendung*, *vollständig verwaltet*. Dazu die Namen, die dasselbe bedeuten: SQL Server, IIS, SharePoint, Home Directories, WorkSpaces-Profile.

**Warum EFS hier verliert:** EFS spricht NFS. Windows unterstützt NFS bestenfalls als Zusatzrolle, und es gibt weder NTFS-ACLs noch AD-Integration noch DFS. Sobald ein Laufwerksbuchstabe oder eine AD-Gruppe im Text steht, ist EFS raus.

**Warum ein Windows Server auf EC2 hier verliert:** Technisch möglich, beantwortet aber die Anforderung nicht. Patching, Backups, Failover-Cluster und Kapazitätsplanung bleiben beim Team. „Minimaler Verwaltungsaufwand" ist die Formel, mit der diese Option ausgeschlossen wird.

**Warum Single-AZ hier verliert:** Es repliziert innerhalb einer AZ und hat keinen automatischen Failover. Steht „muss den Ausfall einer Availability Zone überstehen" in der Frage, ist Single-AZ raus, egal wie attraktiv der Preis ist.

**Warum die anderen drei FSx-Varianten hier verlieren:** FSx for Lustre ist HPC und ML mit S3-Anbindung. FSx for NetApp ONTAP ist Multiprotokoll mit Snapshots und Deduplizierung — die Antwort, sobald „NetApp" im Text steht. FSx for OpenZFS ist NFS mit ZFS-Snapshots. Das Reizwort in der Frage bestimmt die Antwort, nicht die Datenmenge.

**Die AD-Falle.** Eine beliebte Antwortoption lautet sinngemäß „Active Directory nach AWS migrieren". Das ist nicht nötig und auf dieser Karte ausdrücklich nicht gewollt. Der Managed Microsoft AD ist eine *Alternative* für die Authentifizierungslatenz, keine Voraussetzung — und wenn er kommt, kommt er über eine einseitige Vertrauensstellung, nicht über einen Umzug der Benutzerkonten.
