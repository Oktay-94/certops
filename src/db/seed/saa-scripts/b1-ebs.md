---
service: Amazon EBS
seedKey: saa-c03-script-ebs
batch: B1
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html
  - https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volumes-multi.html
  - https://docs.aws.amazon.com/ebs/latest/userguide/ebs-snapshots.html
status: draft
---

# Amazon EBS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EBS = die **persistente USB-Festplatte für EC2**: AZ-gebunden, klassisch 1 Volume ↔ 1 Instanz, live vergrößerbar, Snapshots landen in S3. SSD-Familie (gp3/gp2/io2/io1) für IOPS, HDD-Familie (st1/sc1) für sequenziellen Durchsatz — HDD nie als Boot-Volume. gp3 ist der moderne Standard.

Das war das CLF-Niveau. Der SAA will wissen: **Welcher Volume-Typ genau, warum, und was tust du, wenn die Performance einbricht oder das Volume die AZ wechseln muss?**

---

## 🎯 SAA-Vertiefung

### Das Burst-Credit-Drama: Warum gp2 nachmittags müde wird

**Das Problem:** Ein Kunde beschwert sich: „Unsere Datenbank ist morgens schnell, aber nach ein paar Stunden Dauerlast wird sie kriechend langsam — und am nächsten Morgen ist sie wieder schnell!" Kein Neustart hilft, die Instanz ist nicht ausgelastet. Was ist da los?

**Die Lösung:** Das ist das klassische **gp2-Burst-Credit-Problem**. gp2 funktioniert wie ein **Prepaid-Handy**: Die Baseline-Leistung hängt an der Volume-Größe (3 IOPS pro GB), und für Lastspitzen gibt es ein **Guthaben-Konto (Burst Credits)**. Solange Guthaben da ist, darf das Volume auf bis zu 3.000 IOPS „bursten". Bei Dauerlast ist das Konto irgendwann **leer** — und das Volume fällt hart auf seine magere Baseline zurück. Nachts (wenig Last) lädt sich das Guthaben wieder auf. Daher: morgens schnell, nachmittags müde.

**Der Ausweg heißt gp3:** gp3 hat **kein Credit-System**. Es liefert eine feste Baseline von **3.000 IOPS und 125 MB/s — unabhängig von der Größe** — und ist dabei auch noch günstiger als gp2. Brauchst du mehr, buchst du IOPS (bis 16.000) und Durchsatz (bis 1.000 MB/s) einfach dazu, ohne das Volume aufzublähen.

> **💡 Merksatz:** „Performance bricht nach Stunden ein und erholt sich über Nacht" = **leere gp2-Burst-Credits** → Antwort: **auf gp3 migrieren.** Wer bei gp2 stattdessen das Volume vergrößert, kuriert nur das Symptom (höhere Baseline) und zahlt für Speicher, den er nicht braucht.

### Die Volume-Typen als Entscheidung, nicht als Liste

Die Prüfung fragt nie „Was ist io2?", sondern gibt dir ein Szenario. So denkst du dich durch:

- **„Standard-Workload, bestes Preis-Leistungs-Verhältnis"** → **gp3.** Die Default-Antwort, wenn nichts Extremes gefordert ist.
- **„Geschäftskritische Datenbank, garantierte hohe IOPS, höchste Haltbarkeit"** → **io2 (Block Express)**: bis 256.000 IOPS und 99,999 % Durability (tausendmal haltbarer als gp3 mit 99,8–99,9 %). Das zahlst du — deshalb ist io2 nur richtig, wenn das Szenario die Anforderung wirklich nennt.
- **„Big-Data-Verarbeitung, große Dateien sequenziell, günstig"** → **st1** (Throughput-HDD). Denk an Logverarbeitung, ETL-Staging, Kafka-Broker.
- **„Kalte Daten, seltenster Zugriff, billigster Block-Speicher"** → **sc1**.
- **Falle:** st1 und sc1 können **kein Boot-Volume** sein — wenn eine Antwortoption „sc1 als Root-Volume" anbietet, ist sie automatisch falsch.

**Und der heimliche fünfte Kandidat — Instance Store:** Der ist **kein EBS**, sondern die physisch im Host verbaute NVMe-Platte: die höchste I/O-Leistung überhaupt, aber **ephemeral** — bei Stop oder Terminate sind die Daten weg (ein Reboot überlebt sie). Signalwörter: „temporärer Cache", „Scratch-Daten", „Daten sind anderweitig repliziert". Sobald das Szenario **Persistenz** verlangt, ist Instance Store raus.

> **💡 Merksatz:** gp3 = Allrounder ohne Launen · io2 = Garantie & 5 Neunen für kritische DBs · st1/sc1 = billige HDD für sequenziell (nie booten) · Instance Store = Formel 1 ohne Sicherheitsgurt.

### Multi-Attach: Die Ausnahme, die fast immer ein Distraktor ist

**Das Problem:** „Mehrere Instanzen brauchen gleichzeitigen Zugriff auf dieselben Daten" — und in den Antwortoptionen taucht verlockend **EBS Multi-Attach** auf.

**Die Wahrheit:** Multi-Attach existiert, aber mit drei harten Fesseln: nur **io1/io2**, nur bis **16 Nitro-Instanzen**, nur **innerhalb derselben AZ** — und die Anwendung braucht zwingend ein **cluster-aware Filesystem** (GFS2, OCFS2). Mountest du ein normales XFS/EXT4 von zwei Instanzen gleichzeitig, **korrumpieren sich die Daten**, weil sich die Dateisysteme nicht über Schreibzugriffe abstimmen.

Deshalb gilt: Multi-Attach ist die richtige Antwort **nur**, wenn das Szenario explizit Cluster-Software mit eigener Koordination beschreibt (z. B. eine Failover-Cluster-Lösung). Für alles andere — „geteiltes Verzeichnis", „mehrere Webserver, gemeinsame Dateien" — ist die Antwort **EFS** (oder FSx).

> **💡 Merksatz:** Multi-Attach = Spezialwerkzeug für Cluster-Software in **einer** AZ. „Geteilte Dateien für viele Server" = **EFS**, nicht Multi-Attach.

### Snapshots: Die Zeitmaschine — und ihre drei SAA-Feinheiten

Snapshots kennst du vom CLF: inkrementelle Backups in S3, der Weg über AZ- und Regionsgrenzen. Der SAA legt drei Schichten drauf:

1. **Lazy Loading & Fast Snapshot Restore (FSR):** Ein aus einem Snapshot wiederhergestelltes Volume ist sofort *nutzbar*, aber nicht sofort *schnell* — die Blöcke werden erst beim ersten Zugriff aus S3 nachgeladen (spürbare Latenz). **FSR** eliminiert genau das: Das Volume liefert ab Sekunde 1 volle Leistung. Signalwort: „Volumes aus Snapshots müssen **sofort volle Performance** liefern" (z. B. DR-Übungen, schnelles Hochfahren von Test-Flotten).
2. **Snapshot Archive:** Alte Monats-Snapshots, die du aus Compliance-Gründen behältst, aber nie anfasst? Das Archive-Tier ist deutlich günstiger — der Haken: Restore dauert **24–72 Stunden**. Damit ist es perfekt für Aufbewahrung, aber **tödlich für DR mit kurzem RTO** (beliebte Falle!).
3. **Verschlüsselung nachrüsten:** Ein unverschlüsseltes Volume kann nicht einfach „verschlüsselt geschaltet" werden. Der Weg: **Snapshot → Copy mit Encryption → neues Volume aus der Kopie.** (Dasselbe Muster wie bei RDS — merk es dir einmal, es kommt zweimal.)

Dazu Betriebshygiene: **Recycle Bin** schützt vor versehentlichem Snapshot-Löschen, **Data Lifecycle Manager (DLM)** automatisiert Snapshot-Pläne — und sobald mehrere Dienste zentral gesichert werden sollen, übernimmt **AWS Backup** (eigenes Skript).

> **💡 Merksatz:** Restore ist lazy → **FSR** für Sofort-Performance. **Archive** = billig, aber 24–72 h (nie für kurzes RTO). Verschlüsseln geht nur über den **Snapshot-Copy-Trick**.

### 🛑 Aktualität

**RDS magnetic Storage ist abgekündigt** (Bestände zu gp3 migriert; ab 01.07.2026 kein Snapshot-Restore auf magnetic). „Magnetic" ist in keiner neuen Frage mehr die richtige Antwort — taucht es auf, ist es ein Distraktor.

---

## ⚠️ Prüfungs-Knackpunkte

- Performance bricht unter Dauerlast ein, erholt sich in Ruhephasen → **gp2-Burst-Credits leer → gp3-Migration** (nicht: Volume vergrößern).
- Garantierte IOPS / 99,999 % Durability / kritische DB → **io2 Block Express**.
- HDD (st1/sc1) = sequenziell + billig, **niemals Boot-Volume**.
- Geteilter Speicher für viele Instanzen → **EFS**; Multi-Attach nur bei Cluster-Software (io1/io2, 1 AZ, 16 Nitro, cluster-aware FS).
- Volume in andere AZ/Region → **Snapshot** (ggf. Cross-Region Copy) → Restore.
- Sofortige volle Performance nach Snapshot-Restore → **Fast Snapshot Restore**.
- Snapshot Archive = günstig, Restore 24–72 h → ungeeignet bei kurzem RTO.
- Nachträgliche Verschlüsselung → **Snapshot → Encrypted Copy → Restore**.
- Temporär + maximale lokale I/O + Datenverlust ok → **Instance Store**.

## 💡 Der eine Satz zum Mitnehmen

**gp3 ist die Antwort, bis das Szenario dir einen Grund gibt, es nicht zu sein** — und dieser Grund heißt entweder „Garantie & fünf Neunen" (io2), „sequenziell & billig" (st1/sc1) oder „temporär & brutal schnell" (Instance Store).
