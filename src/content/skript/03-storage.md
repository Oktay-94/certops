# Kapitel 3 — Storage

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Es gibt in AWS **drei fundamentale Speicher-Arten**, und die häufigste Prüfungsfrage ist schlicht: *„Welche passt zu diesem Szenario?"*

| Typ | Dienst | Bild | Zugriff |
|---|---|---|---|
| **Block Storage** | **EBS** | USB-Festplatte am Server | 1 Instanz, wie eine echte Platte |
| **File Storage** | **EFS** (Linux/NFS), **FSx** (Windows/Lustre) | Firmen-Netzlaufwerk | viele Instanzen gleichzeitig |
| **Object Storage** | **S3** | unendlicher Internet-Tresor | über Web-Links (URL), von überall |

Merk dir diese drei Zeilen — daran hängt die halbe Storage-Domäne.

---

## Amazon S3 (Simple Storage Service) 🛑 *(neue Karte — Kern-Dienst, meistgeprüfter Storage)*

**Architektonische Einordnung**

S3 ist das **Fundament der AWS-Datenwelt** und taucht in fast jeder Architektur auf: als **Data Lake** (Analytik: Athena, Glue, EMR lesen direkt aus S3), als Ablage für **statische Website-Inhalte** (+ CloudFront davor), als Ziel für **Backups/Snapshots** (EBS-Snapshots, AWS Backup), als **Event-Quelle** (Upload → Lambda) und als Landing Zone für Migrationen (DataSync, Snow, Storage Gateway). Kein Server, keine Verbindung — man spricht S3 über **HTTPS-Endpunkte** an.

**Metapher / Konzept**

> **Amazon S3 (Der Online-Aktenschrank):** Ist wie eine riesige Dropbox. Du kannst dort kein Windows installieren, aber dafür kannst du Milliarden von Fotos, Videos oder Backups dort reinwerfen. Das Geniale: Auf S3 können Millionen Menschen oder Tausende Server gleichzeitig über das Internet zugreifen. **(Object Storage):** Der unendliche Internet-Tresor. Keine Server-Verbindung nötig, man greift über Web-Links (URLs) von überall auf der Welt darauf zu.

**Das Problem & Die Lösung**

Du willst beliebig viele Dateien — Bilder, Videos, Logs, Backups, Datensätze — dauerhaft, hochverfügbar und weltweit erreichbar ablegen, ohne dich je um Festplatten, Kapazität oder Server zu kümmern.

**S3** ist **Object Storage**: Du legst **Objekte** (Datei + Metadaten) in **Buckets** (Container) ab. Kernpunkte:

- **Praktisch unbegrenzt:** beliebig viele Objekte, ein Objekt bis **5 TB** groß.
- **Flacher Namensraum:** kein echtes Dateisystem — der „Ordnerpfad" ist nur Teil des **Objekt-Schlüssels (Key)**. Zugriff per URL: `https://bucket.s3.region.amazonaws.com/key`.
- **Regional gespeichert, global benannt:** Daten liegen in *einer* Region (Datenhoheit!), aber der **Bucket-Name ist global eindeutig**.

🛑 **Pro-Tipp CLF/SAA — die Fakten, die Fragen entscheiden:**
- **Haltbarkeit (Durability): 99,999999999 % (11 Neunen)** — praktisch unzerstörbar; S3 repliziert intern über **≥ 3 AZs** (außer One-Zone-Klassen).
- **Starke Konsistenz (strong read-after-write):** Seit 2020 siehst du nach einem Upload **sofort** die aktuelle Version — kein „eventual consistency"-Warten mehr (veraltete Prüfungsfrage!).
- **Static Website Hosting:** S3 kann eine reine HTML/CSS/JS-Website direkt ausliefern (kein Server) — Signalwort „statische Website günstig hosten" (+ CloudFront für HTTPS/Cache).
- **Upload-Grenzen:** einzelner PUT bis **5 GB**; darüber **Multipart Upload** (Pflicht für große Dateien, robuster).
- **Sicherheit:** standardmäßig **privat** + **Block Public Access** aktiv (siehe Karte 152). Das häufigste reale Datenleck ist ein *versehentlich* öffentlicher Bucket.

**💡 Merksatz**

S3 = **Objekte in Buckets, über URL, unendlich, 11 Neunen Haltbarkeit, kein Server.** Wenn eine Frage „Millionen Dateien / Backups / Data Lake / statische Website / weltweiter Zugriff" sagt → S3.

---

## S3 Speicherklassen

**Architektonische Einordnung**

Die **Kostenoptimierungs-Achse** von S3: dieselbe hohe Haltbarkeit, aber unterschiedliche Zugriffsgeschwindigkeit/Preis. Zusammen mit **Lifecycle Policies** (Karte 138) der wichtigste Kosten-Hebel im Storage.

**Metapher / Konzept**

> Sieben verschiedene Lagerregale — vom teuren Schnellzugriff-Regal direkt an der Tür bis zum spottbilligen Tiefenlager im Keller.

**Das Problem & Die Lösung**

Nicht alle Daten brauchen denselben (teuren) Zugriff. **Faustregel: Je schneller/häufiger der Zugriff, desto teurer der Speicher — aber desto billiger der Abruf.** Von „häufig/teuer" zu „selten/billig":

- **S3 Standard:** häufig genutzte Daten. Schnellster Zugriff, höchste Speicherkosten, kein Abrufaufpreis. Für aktive Daten (Website-Inhalte, aktuelle Dateien).
- **S3 Intelligent-Tiering:** der **Automatik-Modus**. AWS verschiebt jede Datei automatisch zwischen Stufen, je nach Nutzung — du sparst, ohne selbst entscheiden zu müssen. Ideal bei **unbekannten/wechselnden Zugriffsmustern**. (Kleine Monitoring-Gebühr.)
- **S3 Standard-IA (Infrequent Access):** selten genutzt, aber sofort verfügbar. Günstigerer Speicher, aber Abrufgebühr. Über mehrere AZs. (Backups, ältere Daten.)
- **S3 One Zone-IA:** wie Standard-IA, aber nur in **einer AZ** → noch billiger, aber kein Schutz bei AZ-Ausfall. Für leicht reproduzierbare Daten (wiederherstellbare Thumbnails).
- **S3 Glacier Instant Retrieval:** Archiv mit **sofortigem** Abruf (Millisekunden). Für selten gebrauchte Daten, die im Bedarfsfall sofort da sein müssen (medizinische Bilder).
- **S3 Glacier Flexible Retrieval:** günstiges Archiv, Abruf in Minuten bis Stunden. Für echte Archive, bei denen Wartezeit okay ist.
- **S3 Glacier Deep Archive:** das **billigste** Tiefenlager. Abruf ~12 h. Für Langzeit-Archivierung (gesetzliche 10-Jahres-Archive).

**Praxis:** Übergänge oft via **S3 Lifecycle Policies** automatisiert („nach 30 Tagen IA, nach 90 Glacier, nach 365 Deep Archive").

🛑 **Pro-Tipp SAA — die 8. Klasse, die deine Karte noch nicht hatte:** **S3 Express One Zone** (seit re:Invent 2023). Eine **Hochleistungs-Klasse in einer einzigen AZ** mit **konsistent einstelliger Millisekunden-Latenz, bis zu 10× schneller** als Standard und ~80 % geringeren Request-Kosten. Nutzt einen neuen Bucket-Typ (**Directory Bucket**, bis 2 Mio. Requests/s), den man mit EC2/ECS/EKS/SageMaker **in derselben AZ co-locieren** kann. Für **ML-Training, Echtzeit-Analytik, Media-Processing**. Achtung: Single-AZ (kein Multi-AZ-Schutz) und **keine Lifecycle-Transitions**. Signalwort „**höchste Performance / niedrigste Latenz / hot data**" → Express One Zone; „**billigstes Archiv**" → Deep Archive.

**⚠️ Die Prüfungs-Knackpunkte**
- Unbekannte Zugriffsmuster → **Intelligent-Tiering** (DIE häufige Antwort!).
- Billigstes Langzeitarchiv / Compliance → **Glacier Deep Archive**.
- One Zone-IA spart, opfert aber AZ-Redundanz — nur für reproduzierbare Daten.
- Lifecycle Policies = automatischer Übergang zwischen Klassen.
- **Wichtig:** Alle Klassen haben dieselbe hohe Haltbarkeit (11×9 Durability) — Unterschied ist Geschwindigkeit/Verfügbarkeit/Preis, nicht die Sicherheit der Speicherung.

---

## S3 Features & Datenschutz

**Metapher / Konzept**

> Das Schweizer Taschenmesser von S3 — die Schutz- und Komfortfunktionen, die einen einfachen Bucket sicher und mächtig machen.

**Die Features (deine Karte, wortgetreu):**

- **S3 Versioning:** speichert jede Version einer Datei. Überschreiben/Löschen → alte Versionen bleiben, du kannst jederzeit zurück. Ein „Löschen" setzt nur einen **Delete Marker**, die Daten sind noch da.
- **S3 Object Lock:** macht Objekte unveränderbar/unlöschbar für einen Zeitraum (**WORM**). Selbst Admins können nicht ändern/löschen. Für Compliance und Ransomware-Schutz. **Braucht Versioning.**
- **MFA Delete:** dauerhaftes Löschen von Objektversionen erfordert einen **MFA-Code**. Schützt vor endgültigem Löschen durch gestohlene Credentials.
- **S3 Transfer Acceleration:** beschleunigt Uploads über weite Strecken via nächstgelegenem **CloudFront-Edge** → schnelles AWS-Netz zum Bucket. Für geografisch weit entfernte Nutzer.
- **S3 Replication:** kopiert Objekte automatisch in einen anderen Bucket. **CRR (Cross-Region)** für DR/Latenz/Compliance; **SRR (Same-Region)** für Log-Zusammenführung/getrennte Konten. **Braucht Versioning.**
- **Pre-Signed URLs:** zeitlich begrenzte URL für temporären Zugriff auf ein **privates** Objekt — ohne den Bucket öffentlich zu machen. (Kunde darf gekaufte Datei 15 Min laden.)

**⚠️ Prüfungs-Knackpunkte**
- Versehentliches Löschen verhindern → **Versioning** (+ MFA Delete für hart).
- Unveränderbar/Compliance/WORM/Ransomware → **Object Lock**.
- Schnellere weltweite Uploads → **Transfer Acceleration**.
- In andere Region kopieren (DR) → **CRR**.
- Temporärer Zugriff auf private Datei → **Pre-Signed URL**.

---

## S3 Lifecycle & Backup Vault Lock

**Metapher / Konzept**

> Die Automatik, die Daten von selbst ins billigere Regal wandern lässt — plus der unzerstörbare Tresor für Backups.

**Die Bausteine (deine Karte, wortgetreu):**

- **S3 Lifecycle Rules:** Regeln, die Objekte automatisch nach Alter verschieben/löschen. **Transition** („nach 30 Tagen IA, nach 90 Glacier, nach 365 Deep Archive") und **Expiration** („nach X Tagen endgültig löschen", auch alte Versionen/unvollständige Uploads aufräumen). Nutzen: automatische Kostenoptimierung. *(Querverweis: Klassen aus Karte 128.)*
- **S3 Object Lock (Vertiefung):** macht einzelne Objekte unveränderbar (WORM). **Governance Mode** (Sonderrechte können eingreifen) vs. **Compliance Mode** (niemand, auch kein Root — die härteste Stufe).
- **AWS Backup:** zentraler, verwalteter Backup-Dienst für viele Services (EBS, RDS, DynamoDB, EFS, EC2 u. v. m.). Eine zentrale Strategie statt Einzelsicherung. Unterstützt **Cross-Region und Cross-Account** (DR).
- **Backup Vault Lock:** schützt Backups mit einer **WORM-Sperre** — einmal gesperrt, nicht mehr löschbar/verkürzbar (auch nicht Admin/Root). Das Backup-Pendant zu S3 Object Lock.

**⚠️ Prüfungs-Knackpunkte**
- Daten automatisch nach Alter ins günstigere Regal / aufräumen → **Lifecycle Rules** (Transition/Expiration).
- Zentrale Backups über viele Dienste / Cross-Region / Cross-Account → **AWS Backup**.
- Backups unlöschbar (WORM, auch gegen Admins/Root) → **Vault Lock** bzw. **Object Lock Compliance Mode**.
- **Merke:** Lifecycle = Kosten sparen durch Automatik; Lock = unzerstörbar für Compliance/Ransomware.

---

## S3 Erweiterte Features

**Metapher / Konzept**

> Die versteckten Superkräfte von S3 — die Funktionen jenseits des reinen Speicherns.

**Die Features (deine Karte, wortgetreu):**

- **S3 Event Notifications:** S3 löst bei Ereignissen („neue Datei", „gelöscht") automatisch eine **Lambda-Funktion**, **SQS**- oder **SNS**-Nachricht aus. Grundlage serverloser Pipelines (Bild hoch → Lambda erstellt Thumbnail). Kann auch über **EventBridge** laufen.
- **S3 Access Points:** eigene benannte Zugangspunkte mit je eigener Richtlinie für denselben Bucket. Statt einer riesigen Bucket-Policy bekommt jede App/jedes Team einen eigenen Access Point. Vereinfacht Zugriffsverwaltung bei großen, geteilten Buckets.
- **CORS (Cross-Origin Resource Sharing):** erlaubt einer Webseite von Domain A, Ressourcen aus einem S3-Bucket auf Domain B zu laden. Ohne CORS-Konfig blockiert der Browser fremde Zugriffe.
- **Server Access Logging:** protokolliert detaillierte Bucket-Zugriffe in einen anderen Bucket — für Audit/Analyse.
- **Requester Pays:** der **Anfragende** (Downloader) zahlt die Transfer-/Abrufkosten statt des Besitzers. Sinnvoll beim öffentlichen Teilen großer Datensätze.

**⚠️ Prüfungs-Knackpunkte**
- Bei S3-Upload automatisch etwas auslösen → **S3 Event Notifications** (→ Lambda/SQS/SNS).
- Zugriff auf großen, geteilten Bucket vereinfachen → **Access Points**.
- Webseite lädt aus S3 anderer Domain, Browser blockiert → **CORS**.
- Downloader soll Transferkosten tragen → **Requester Pays**.
- Wer greift wie zu (Audit) → **Server Access Logging**.

---

## CORS, Bucket Policy & S3-Sicherheit

**Metapher / Konzept**

> Wer darf auf S3 — und von wo: die Zugriffssteuerung und Schutzmechanismen von S3.

**Die Mechanismen (deine Karte, wortgetreu):**

- **Bucket Policy:** eine **JSON-Richtlinie direkt am Bucket** (ressourcenbasiert). Regelt Zugriff für ganze Konten, Nutzer, IP-Bereiche oder Bedingungen („nur HTTPS", „nur über VPC Endpoint"). Der Standard-Weg.
- **ACL (Access Control List):** der ältere, einfachere Mechanismus. AWS empfiehlt heute **Bucket Policies statt ACLs**; ACLs werden deaktiviert (Stichwort „Object Ownership: Bucket owner enforced"). Bei Neuanlagen: Bucket Policy.
- **Block Public Access:** übergeordnete Sicherheitssperre, die öffentlichen Zugriff blockiert — **selbst wenn eine Policy/ACL ihn versehentlich erlaubt**. Standardmäßig aktiv. Die wichtigste Schutzfunktion gegen das klassische Datenleck.
- **CORS (Wiederholung):** erlaubt domänenübergreifende Browser-Zugriffe.
- **Reihenfolge der Bewertung (vereinfacht):** Ein **expliziter Deny** gewinnt immer. **Block Public Access** überschreibt erlaubende Policies/ACLs für öffentlichen Zugriff. Ansonsten greifen IAM-Policies (Nutzerseite) + Bucket Policy/ACL (Ressourcenseite) zusammen.

**⚠️ Prüfungs-Knackpunkte**
- Bucket-Zugriff zentral per JSON → **Bucket Policy** (statt ACL).
- Versehentlichen öffentlichen Zugriff verhindern → **Block Public Access** (überschreibt alles Öffentliche).
- Browser blockiert Cross-Domain-Zugriff → **CORS**.
- ACLs = veraltet → heute Bucket Policy.
- **Merke:** Block Public Access ist das Sicherheitsnetz gegen das häufigste S3-Datenleck.

---

## Datenverschlüsselung & SSE-Arten

**Metapher / Konzept**

> Vier verschiedene Schlösser für S3 — der Unterschied ist immer: Wer hält und verwaltet den Schlüssel?

**Server-Side Encryption (SSE)** = Verschlüsselung der Daten **at rest** in S3. Die Frage ist immer: **Wer kontrolliert den Schlüssel?**

- **SSE-S3:** AWS verwaltet die Schlüssel komplett — du musst dich um nichts kümmern. Der einfachste Standard. (API-Stichwort: **AES256**.)
- **SSE-KMS:** Schlüssel im **KMS** (Karte 37). Mehr Kontrolle: eigene Schlüssel (Customer Managed Keys), feine Rechte, und vor allem **Audit** — jede Nutzung in **CloudTrail** protokolliert. Für Compliance/Nachvollziehbarkeit.
- **SSE-C (Customer-Provided Keys):** du lieferst den Schlüssel bei jedem Upload/Download selbst; AWS speichert ihn **nicht**. Volle Eigenverantwortung. Für Firmen, die Schlüssel außerhalb AWS halten müssen.
- **DSSE-KMS (Dual-Layer):** **doppelte** Verschlüsselung mit KMS. Für extrem strenge Vorgaben (Behörden/Militär).

**Abgrenzung:** Es gibt auch **Client-Side Encryption** — du verschlüsselst *vor* dem Upload selbst; AWS sieht nur verschlüsselten Inhalt.

🛑 **Pro-Tipp SAA — aktuelle Änderung:** S3 verschlüsselt seit **Januar 2023 alle neuen Objekte standardmäßig** mit **SSE-S3** (kostenlos, automatisch). Die Frage ist heute nicht mehr *„ob"* verschlüsselt wird, sondern *„mit wessen Schlüssel"* — genau deine Kernfrage.

**⚠️ Prüfungs-Knackpunkte**
- Einfach, AWS regelt alles → **SSE-S3**.
- Kontrolle + Audit über CloudTrail + eigene Schlüssel → **SSE-KMS**.
- Kunde liefert/verwaltet eigene Schlüssel, AWS speichert sie nicht → **SSE-C**.
- Doppelte Schicht, höchste Compliance → **DSSE-KMS**.
- Die Kernfrage: **Wer hält den Schlüssel?** (AWS / KMS / Kunde).
- **Querverweis:** at rest = SSE/KMS; **in transit** = HTTPS/ACM (Karte 44).

---

## Amazon EBS (Elastic Block Store)

**Architektonische Einordnung**

EBS ist die **persistente Festplatte für EC2** — der Standard-Speicher für Boot-Volumes, Datenbanken und alles, was eine „echte" Platte pro Server braucht. **AZ-gebunden**: ein Volume lebt in *einer* AZ und hängt (klassisch) an *einer* Instanz. **Snapshots** landen in S3 und sind der Weg, Daten über AZs/Regionen zu bewegen.

**Metapher / Konzept**

> Amazon EBS ist im Grunde die Festplatte für einen EC2-Server! Man könnte es als **„Die externe USB-Festplatte für dein Cloud-Gehirn"** bezeichnen.

**Das Problem & Die Lösung**

Ein EC2-Server ist quasi nur das nackte „Gehirn" (Prozessor + Arbeitsspeicher). Schaltest du ihn aus oder er stürzt ab, **vergisst er alle Daten**. Für ein Betriebssystem oder eine Datenbank brauchst du **dauerhaften** Speicher.

**EBS** liefert virtuelle Festplatten, die du digital an deinen EC2-Server „ansteckst":

- **Dauerhaft (Persistent):** Brennt der Server ab oder wird gelöscht, bleibt die EBS-Platte unversehrt — du steckst sie an einen neuen Server, der genau da weitermacht.
- **Flexibel („Elastic"):** volle 50-GB-Platte? Per Mausklick im laufenden Betrieb auf 500 GB vergrößern oder von HDD auf SSD umstellen, ohne Neustart.
- **Snapshots (Zeitmaschine):** auf Knopfdruck ein „Foto" der Platte — ein komplettes Backup, sicher in **S3** abgelegt. Versehentlich gelöscht? In Sekunden wiederherstellen.

**Der Klassiker — EBS vs. S3:** **EBS** ist extrem schnell, für Betriebssysteme/Datenbanken; der Haken: eine EBS-Platte hängt (in der Regel) immer nur an **einem einzigen** EC2-Server. **S3** ist der Internet-Aktenschrank für Milliarden Objekte, auf den Millionen gleichzeitig zugreifen.

🛑 **Pro-Tipp SAA — Nuancen, die deine Karte nicht hatte:**
- **Multi-Attach:** Die „nur eine Instanz"-Regel hat eine Ausnahme — **io1/io2** können per Multi-Attach an **mehrere Instanzen in derselben AZ** hängen (für Cluster-Software). Standardfall bleibt aber „1 Volume ↔ 1 Instanz".
- **EBS ist AZ-gebunden:** Um ein Volume in eine **andere AZ oder Region** zu bringen → **Snapshot erstellen** und dort wiederherstellen (Snapshots sind regional/kopierbar).
- **Volume-Typen** (gp3, io2 …) siehe die nächste Karte.

---

## EBS Volume-Typen

**Metapher / Konzept**

> Sechs Festplattentypen für EC2 — von blitzschnell und teuer bis langsam und billig, je nach Aufgabe.

**Zwei Familien: SSD** (schnell, wahlfreier Zugriff) und **HDD** (günstig, große sequenzielle Datenmengen).

**SSD-basiert (Datenbanken, Boot-Volumes, IOPS-lastig):**
- **gp3 (General Purpose SSD):** der **moderne Standard** und Allrounder. Gutes Preis/Leistung; Performance **unabhängig von der Größe** einstellbar. Erste Wahl für die meisten Workloads.
- **gp2:** der ältere General-Purpose-SSD — Performance **hängt an der Größe** (mehr GB = mehr IOPS). Wird von gp3 abgelöst.
- **io2 / io1 (Provisioned IOPS SSD):** Hochleistungs-SSDs mit gezielt gebuchten, garantierten IOPS. Für kritische, IOPS-intensive Datenbanken. **io2 Block Express** = die schnellste Variante. Teurer.

**HDD-basiert (günstig, sequenziell, NICHT als Boot-Volume):**
- **st1 (Throughput Optimized HDD):** günstig, auf **Durchsatz** optimiert. Für große, sequenziell gelesene Daten: Big Data, Data Warehouses, Logs.
- **sc1 (Cold HDD):** das **billigste** Volume. Für selten zugegriffene, „kalte" Daten.

**⚠️ Prüfungs-Knackpunkte**
- Allround-Standard, bestes Preis/Leistung → **gp3** (Default-Antwort).
- Höchste/garantierte IOPS, kritische DB → **io2 (Block Express)**.
- Großer Durchsatz, sequenziell (Big Data/Logs), günstig → **st1**.
- Billigste, kalte Daten → **sc1**.
- **HDD (st1/sc1) können KEIN Boot-Volume sein — beliebte Falle!** Boot immer SSD.
- **Merke die Achsen:** SSD = viele kleine wahlfreie Zugriffe (**IOPS**), HDD = große sequenzielle Datenmengen (**Throughput**).

🛑 **Pro-Tipp SAA:** gp3 liefert eine **Baseline von 3.000 IOPS / 125 MB/s** unabhängig von der Größe (und ist meist günstiger als gp2) — der klassische „Warum von gp2 auf gp3 wechseln?"-Punkt: mehr Performance, weniger Kosten.

---

## Amazon EFS (Elastic File System)

**Architektonische Einordnung**

EFS ist das **gemeinsame Netzlaufwerk (NFS) für viele Linux-Instanzen gleichzeitig** — die Lösung, wenn mehrere EC2-Server (oder Container/Lambda) **dieselben Dateien** brauchen. Elastisch, über mehrere AZs erreichbar.

**Metapher / Konzept**

> Wenn EBS deine persönliche, ansteckbare USB-Festplatte ist, dann ist Amazon EFS **„Das gemeinsame Netzlaufwerk für all deine Server"** — wie das klassische „Laufwerk Z:" aus dem Büro, auf das alle gleichzeitig zugreifen.

**Das Problem & Die Lösung**

Eine EBS-Platte hängt nur an **einem** Server. Betreibst du 10 EC2-Server und ein Nutzer lädt sein Profilbild auf Server 1, wissen die anderen 9 nichts davon → Chaos.

**EFS** löst das:
- **Gemeinsame Nutzung:** an Hunderte/Tausende EC2-Server **gleichzeitig** anschließbar. Speichert Server 1 ein Bild, sehen es Server 2–1000 in derselben Millisekunde.
- **Vollkommen elastisch (ohne Limit):** keine feste Größe — wächst automatisch in den Petabyte-Bereich und schrumpft wieder. Du zahlst nur, was gerade drinliegt.
- **Linux-Fokus:** EFS ist speziell für **Linux** gebaut. (Fürs Gleiche unter Windows → **FSx**.)

**Der ultimative Speicher-Vergleich:** **EBS** (Block Storage) = der USB-Stick, extrem schnell, für Betriebssysteme, klebt an *einem* Server. **EFS** (File Storage) = das Firmen-Netzlaufwerk, gemeinsame Dateien, Tausende Server gleichzeitig. **S3** (Object Storage) = der unendliche Internet-Tresor, keine Server-Verbindung, Zugriff über URLs von überall.

---

## EFS Details – Klassen & Durchsatz-Modi

**Metapher / Konzept**

> Das gemeinsame Netzwerklaufwerk für viele Server gleichzeitig — in vier Geschmacksrichtungen.

**Grundlage:** EFS = ein **NFS-Dateisystem**, das sich mehrere EC2-Instanzen teilen (vs. EBS = nur eine). Wächst/schrumpft automatisch, Linux.

**Speicherklassen (analog zu S3):**
- **EFS Standard:** häufig genutzt, über mehrere AZs (hochverfügbar).
- **EFS One Zone:** nur eine AZ → billiger, kein AZ-Ausfallschutz. Für unkritische/reproduzierbare Daten.
- **EFS Infrequent Access (IA):** selten genutzt, deutlich günstiger, kleine Abrufgebühr (+ **Archive** für noch seltener).
- **Lifecycle Management** verschiebt selten genutzte Dateien automatisch nach IA (wie S3 Lifecycle).

**Durchsatz-/Performance-Modi:**
- **Bursting Throughput:** Standard — skaliert mit der Dateisystemgröße, kann kurz „bursten".
- **Provisioned Throughput:** gezielt gebuchter Durchsatz, unabhängig von der Größe (viel Durchsatz bei wenig Daten).
- **Elastic Throughput:** skaliert vollautomatisch nach Bedarf; du zahlst nur, was du nutzt. Ideal bei unvorhersehbaren Lasten (der moderne Modus).

**⚠️ Prüfungs-Knackpunkte**
- Mehrere EC2 teilen sich dasselbe Dateisystem → **EFS** (EBS = nur 1 Instanz!).
- Billiger, nur 1 AZ, unkritisch → **EFS One Zone**.
- Selten genutzte Dateien günstiger → **EFS IA** (+ Lifecycle Management).
- Unvorhersehbarer Durchsatz, automatisch → **Elastic Throughput**.
- **Abgrenzung Storage-Typen:** EBS = Block (1 Instanz), EFS = File (viele Linux-Instanzen, NFS), FSx = File für Windows/Lustre, S3 = Objekt.

---

## Amazon FSx

**Architektonische Einordnung**

FSx bringt **fertige, hochspezialisierte Dateisysteme** als Managed Service — vor allem die **Windows-Welt** (SMB/NTFS/Active Directory) und **High-Performance Computing** (Lustre), die EFS nicht abdeckt.

**Metapher / Konzept**

> Wenn EFS das gemeinsame Laufwerk für die Linux-Welt ist, dann ist Amazon FSx **„Das maßgeschneiderte Spezial-Laufwerk (besonders für Windows)"**.

**Das Problem & Die Lösung**

EFS ist tief im Inneren ein reines **Linux**-System. Zwei Fälle, bei denen es kapituliert:
- **Die Windows-Welt:** Hunderte Microsoft-Windows-Server (SMB-Protokoll, NTFS) können mit EFS nicht kommunizieren — sie sprechen nicht dieselbe Sprache.
- **Der Formel-1-Bedarf:** Supercomputer/HPC (Wettersimulation, riesige ML-Modelle) brauchen ein Speichersystem so schnell wie ein Rennwagen.

**Die FSx-Familie** — nicht ein Dienst, sondern **vier** hochspezialisierte Dateisysteme (AWS hat die weltbesten Speichersysteme als schlüsselfertigen Service verpackt). Die **zwei wichtigsten**:

1. **Amazon FSx for Windows File Server (Der Büro-Arbeiter):** das exakte Gegenstück zu EFS, für **Windows**. Waschechtes Windows-Dateisystem, nahtlose Integration in **Active Directory**, Windows-Zugriffsrechte, alle Windows-Server greifen gleichzeitig zu.
2. **Amazon FSx for Lustre (Der Formel-1-Wagen):** „Lustre" = extrem schnelles Dateisystem für **HPC**. Für Hollywood-Rendering oder KI-Datenverarbeitung — speist Daten blitzschnell in Server (oder **AWS Batch**). Das Geniale: verknüpft sich direkt mit deinem **S3**-Aktenschrank, verarbeitet blitzschnell und legt Ergebnisse zurück in S3.

🛑 **Pro-Tipp SAA — die anderen zwei der „Familie von vier" (fürs Zuordnen):**
- **FSx for NetApp ONTAP:** das Enterprise-NAS von NetApp als Managed Service — kann **NFS, SMB und iSCSI gleichzeitig**, Multi-Protokoll (Linux *und* Windows), mit ONTAP-Features (Snapshots, Deduplizierung). Signalwort „bestehende NetApp/ONTAP-Umgebung migrieren, Multi-Protokoll".
- **FSx for OpenZFS:** das leistungsstarke Open-Source-Dateisystem ZFS als Managed Service (**NFS**), für Linux-Workloads mit ZFS-Features. Signalwort „ZFS / Umzug von on-prem ZFS/NAS".
- **Kurz:** Windows → **FSx for Windows**; HPC/ML → **FSx for Lustre**; Multi-Protokoll/NetApp → **ONTAP**; ZFS → **OpenZFS**.

---

## AWS Backup

**Architektonische Einordnung**

Die **zentrale Backup-Steuerung** über alle Storage- und Datenbank-Dienste hinweg — statt jeden Dienst einzeln zu sichern. Der Ort, an dem eine **firmenweite, prüfbare** Backup-Strategie entsteht (inkl. WORM-Schutz).

**Metapher / Konzept**

> Die zentrale Kommandozentrale für all deine Rettungsringe — ein einziger Dirigent für alles.

**Das Problem & Die Lösung**

Es gibt viele Speicherdienste (EBS, EFS, FSx), dazu Datenbanken (RDS, DynamoDB) und EC2. Früher war Sichern ein **administrativer Albtraum**: jeder Dienst mit eigenem Backup-Menü. Fragte der Chef nach der „firmenweiten Backup-Strategie", musste man durch zehn Konsolen klicken und hoffen, nichts vergessen zu haben.

**AWS Backup** vereinheitlicht und automatisiert:
- **Ein Fahrplan (Backup Plans):** einmal definieren — „Sichere jede Nacht 3:00 Uhr alles mit dem Namen 'Produktion', halte es 30 Tage." AWS Backup läuft automatisch los: EBS, EFS, FSx, Datenbanken → Kopien erstellen und sicher ablegen.
- **Zentrale Übersicht:** ein Dashboard, das auf einen Blick zeigt, ob alle Backups erfolgreich waren.
- **Vault Lock:** deine wichtigste Waffe gegen **Ransomware** — Backups nach **WORM (Write Once, Read Many)** einsperren. Einmal abgelegt, kann es niemand vorzeitig löschen — **nicht einmal ein Hacker mit gestohlenem Passwort, und nicht einmal du selbst mit Root-Rechten** —, bis die Ablaufzeit erreicht ist.

**Zusammenfassung:** AWS Backup ist der zentrale Ort, um Sicherungen für die **gesamte** AWS-Umgebung firmenweit zu planen, zu überwachen und manipulationssicher zu schützen.

---

## AWS Storage Gateway

**Architektonische Einordnung**

Die **dauerhafte Brücke** zwischen einem lokalen Rechenzentrum (on-premises) und AWS-Speicher — für **Hybrid-Szenarien**, in denen alte Anwendungen ein normales lokales Laufwerk erwarten, die Daten aber in der Cloud liegen sollen.

**Metapher / Konzept**

> Das magische Verlängerungskabel zwischen deinem eigenen Keller und der Cloud.

**Das Problem & Die Lösung**

Du hast ein eigenes kleines Rechenzentrum (On-Premises) mit alten Anwendungen, die stur auf ein lokales Laufwerk speichern. Der Platz wird knapp — neue Festplatten kaufen und einschrauben, immer wieder. Du würdest die Daten gerne in **S3** werfen, aber die alten Anwendungen verstehen S3 nicht; sie verlangen ein normales Netzwerklaufwerk.

**Storage Gateway** ist eine **Software**, die du auf einem Server im eigenen Gebäude installierst. Für die alten Anwendungen sieht sie aus wie eine riesige lokale Festplatte — in Wahrheit ist sie ein **Portal**, das die Dateien entgegennimmt, heimlich übersetzt und in die AWS-Cloud schiebt. Plötzlich hast du unendlich Speicher „im Keller", ohne eine einzige echte Platte gekauft zu haben.

**Die 3 Varianten (extrem wichtig):**
1. **Amazon S3 File Gateway (Der Dateiserver):** *Illusion:* normales Netzwerklaufwerk (**SMB/NFS**). *Realität:* schiebt alle Dateien in **S3**. Perfekt, um lokale Dateiserver auszulagern.
2. **Amazon EBS Volume Gateway (Die System-Festplatte):** *Illusion:* nackte Festplatte (**iSCSI**). *Realität:* speichert Volumes in AWS, sichert als **EBS-Snapshots**. Trick: **Cached Volume** = nur aktuellste Daten lokal, Rest in der Cloud; **Stored Volume** = komplette Kopie lokal + Backup in der Cloud.
3. **AWS Tape Gateway (Der Kassetten-Ersatz):** *Illusion:* physischer Kassetten-Roboter (**Virtual Tape Library**). *Realität:* friert Backups im billigen **S3 Glacier** ein — nie wieder echte Kassetten wechseln.

**Storage Gateway vs. Outposts:** **Outposts** = Amazon liefert echte **Hardware** (Schrank) zu dir für Rechenleistung vor Ort. **Storage Gateway** = meist nur eine **Software** als Brücke, die deinen lokalen Servern unendlichen Cloud-Speicher vorgaukelt.

---

## AWS DataSync

**Architektonische Einordnung**

Der **Hochgeschwindigkeits-Umzugsdienst** für große Datenmengen — von on-premises in die Cloud oder zwischen AWS-Speichern. Anders als Storage Gateway (Dauerbrücke) geht es hier um **Transport/Migration** mit Integritätsgarantie.

**Metapher / Konzept**

> Das vollautomatische Hochgeschwindigkeits-Umzugsunternehmen.

**Das Problem & Die Lösung**

Du willst z. B. **50 TB** vom alten Server in **S3** umziehen. Über eine normale Internetverbindung: dauert Wochen/Monate, die Verbindung bricht ab (von vorne anfangen), und am Ende weißt du nicht, ob jede Datei unbeschädigt ankam. Früher schrieb man dafür wochenlang eigene Skripte.

**DataSync:** kleinen **Agenten** auf dem lokalen Server installieren, Quelle (alte Platten) → Ziel (**S3** oder **EFS**) wählen, Start drücken.
- **Brutale Geschwindigkeit:** eigenes Amazon-Protokoll, **bis zu 10× schneller** als normales Kopieren.
- **Vollautomatisch & zuverlässig:** Internet fällt aus → pausiert und macht danach genau weiter.
- **Mathematische Endkontrolle:** gleicht nach dem Umzug ab und **garantiert, dass jedes Bit exakt kopiert** wurde.
- **Auch innerhalb der Cloud:** z. B. Millionen Dateien von **S3 auf FSx** kopieren.

**⚠️ Der Prüfungs-Klassiker — Storage Gateway vs. DataSync:**
- **Storage Gateway (Dauerzustand):** du **behältst** deine lokalen Server; das Gateway ist die **dauerhafte Brücke** für täglichen Cloud-Speicher-Zugriff.
- **DataSync (Transport):** ein **Umzugsservice** — riesige Datenmengen **einmalig** migrieren (alter Server wird danach evtl. entsorgt) oder regelmäßig von A nach B kopieren.

---

*Ende Kapitel 3 — Storage.*
