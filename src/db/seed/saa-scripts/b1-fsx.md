---
service: Amazon FSx (alle Typen)
seedKey: saa-c03-script-fsx
batch: B1
domains: [D2, D3, D4]
sourceRef:
  - https://aws.amazon.com/fsx/
  - https://docs.aws.amazon.com/fsx/latest/LustreGuide/what-is.html
  - https://docs.aws.amazon.com/fsx/latest/WindowsGuide/what-is.html
status: draft
---

# Amazon FSx

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> FSx = **vier maßgeschneiderte Spezial-Dateisysteme** als Managed Service: **Windows File Server** (SMB/NTFS/Active Directory — der Büro-Arbeiter), **Lustre** (HPC/ML — der Formel-1-Wagen mit S3-Anschluss), **NetApp ONTAP** (Multi-Protokoll) und **OpenZFS** (ZFS/NFS). EFS bleibt das allgemeine Linux-Laufwerk.

Der Exam Guide sagt wörtlich **„Amazon FSx (for all types)"** — alle vier sind prüfbar. Der SAA fragt nicht „was ist FSx", sondern lässt dich **zwischen den vieren (und EFS) wählen** — plus Detailwissen zu Lustre-Deployment-Typen und Windows-HA.

---

## 🎯 SAA-Vertiefung

### FSx for Windows File Server: Das AD-integrierte Firmenlaufwerk

**Das Problem:** Hunderte Windows-Server und -Clients brauchen ein gemeinsames Firmenlaufwerk mit den gewohnten **Windows-Berechtigungen** — und die Fachabteilung will ihre gelöschte Datei bitte selbst wiederherstellen, ohne ein Ticket zu schreiben.

**Die Lösung:** FSx for Windows ist ein **echtes Windows-Dateisystem** aus der Steckdose: natives **SMB**, NTFS-ACLs, nahtlose **Active-Directory-Integration** (AWS Managed Microsoft AD *oder* das eigene on-prem AD), DFS-Namespaces für gewohnte Pfade. Für die Selbsthilfe der Nutzer: **Shadow Copies** („Vorgängerversionen" im Explorer-Rechtsklick). Für Ernstfälle: **Multi-AZ-Deployment** mit automatischem Failover — die HA-Antwort für Windows-Fileshares. Erreichbar auch on-prem über DX/VPN, und Deduplizierung drückt die Kosten.

> **💡 Merksatz:** **SMB, NTFS, Active Directory** — sobald eines dieser drei Wörter im Szenario steht, ist die Antwort FSx for Windows, nie EFS.

### FSx for Lustre: Der Rennwagen mit S3-Tank

**Das Problem:** Ein ML-Team trainiert auf einem Terabyte-Datensatz, der im S3-Data-Lake liegt. S3 direkt ist für das Training zu langsam, und die Zwischenergebnisse sind sowieso nur temporär. Wie bekommt man Formel-1-Durchsatz, ohne den Data Lake zu duplizieren?

**Die Lösung:** FSx for Lustre liefert **hunderte GB/s, Millionen IOPS und Sub-Millisekunden-Latenz** — und sein Trumpf ist die **Data Repository Association (DRA)** zu S3: Das Dateisystem präsentiert die S3-Objekte als Dateien und lädt sie **lazy** beim ersten Zugriff; Ergebnisse schreibt es zurück nach S3. Der Data Lake bleibt die Quelle, Lustre ist die heiße Verarbeitungsschicht.

Die Deployment-Frage entscheidet über Geld und Risiko:
- **Scratch:** keine Replikation — fällt ein Storage-Server aus, sind die Daten weg. Dafür billig. Für **temporäre** Verarbeitung, deren Input in S3 sicher liegt.
- **Persistent:** innerhalb der AZ repliziert und selbstheilend, für länger laufende Workloads. Persistent-2 skaliert bis 1.000 MB/s pro TiB.

Wichtig: Lustre ist **Linux-only** — Windows-Clients können nicht mounten.

> **💡 Merksatz:** **HPC/ML/Rendering + S3-Daten** → Lustre mit **DRA (Lazy Loading)**. Daten reproduzierbar/temporär → **Scratch** (billig); Verlust inakzeptabel → **Persistent**.

### FSx for NetApp ONTAP: Der Dolmetscher für beide Welten

**Das Problem:** Eine Firma migriert ihr on-prem NetApp-NAS — an dem hängen **Linux-Server per NFS und Windows-Clients per SMB gleichzeitig**, dazu ein paar Systeme per iSCSI. EFS kann kein SMB, FSx Windows kein NFS. Zwei Systeme parallel hieße getrennte Datenbestände.

**Die Lösung:** FSx for NetApp ONTAP ist das **einzige Multi-Protokoll-FSx**: **NFS, SMB und iSCSI auf denselben Daten**. Und weil es echtes ONTAP ist, funktioniert **SnapMirror** — die native NetApp-Replikation — als Migrationspfad vom on-prem-System in die Cloud, plus die gewohnten ONTAP-Features (Snapshots, Clones, Deduplizierung, automatisches Tiering auf einen günstigen Capacity Pool).

> **💡 Merksatz:** **„NFS und SMB gleichzeitig"** oder **„NetApp/ONTAP/SnapMirror"** im Text → FSx ONTAP. Es ist der einzige, der beide Welten auf einem Datenbestand spricht.

### FSx for OpenZFS: Der ZFS-Umzugswagen

Kurz und schmerzlos: On-prem läuft ein **ZFS**-basiertes Linux-NAS, und die ZFS-Features (Snapshots, Clones) sollen erhalten bleiben → **FSx for OpenZFS** (NFS, sehr niedrige Latenz). Das Signalwort ist schlicht „ZFS".

### Die Entscheidungsmatrix — die eigentliche Prüfungsfrage

| Das Szenario sagt … | Antwort |
|---|---|
| Windows, SMB, Active Directory, NTFS-Rechte | **FSx for Windows File Server** |
| HPC, ML-Training, Rendering, maximaler Durchsatz, S3-Daten | **FSx for Lustre** |
| NFS **und** SMB gleichzeitig / NetApp-Migration / iSCSI | **FSx for NetApp ONTAP** |
| ZFS-Workload/Migration | **FSx for OpenZFS** |
| „Einfach ein geteiltes Linux-NFS, elastisch" | **EFS** — FSx wäre hier der Overkill-Distraktor |

---

## ⚠️ Prüfungs-Knackpunkte

- SMB/AD/Windows-ACLs → **FSx Windows**; HA über AZs → **Multi-AZ-Deployment**; Nutzer-Selbsthilfe → **Shadow Copies**.
- HPC/ML auf S3-Daten → **Lustre + DRA** (Lazy Loading aus S3, Ergebnisse zurückschreiben).
- Lustre **Scratch** = unrepliziert/billig/temporär; **Persistent** = repliziert/selbstheilend. Lustre ist **Linux-only**.
- NFS + SMB + iSCSI auf denselben Daten / SnapMirror-Migration → **ONTAP**.
- ZFS → **OpenZFS**.
- Simples geteiltes Linux-NFS → **EFS**, nicht FSx.

## 💡 Der eine Satz zum Mitnehmen

**FSx-Fragen sind Zuordnungsfragen: Das Protokoll- oder Technologie-Signalwort im Szenario (SMB/AD, HPC+S3, NFS+SMB, ZFS) zeigt eindeutig auf genau einen der vier Typen** — und fehlt jedes Spezial-Signal, ist die Antwort EFS.
