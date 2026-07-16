---
service: AWS DataSync
seedKey: saa-c03-script-datasync
batch: B1
domains: [D3, D4]
sourceRef:
  - https://aws.amazon.com/datasync/faqs/
  - https://aws.amazon.com/datasync/features/
status: draft
---

# AWS DataSync

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> DataSync = das **vollautomatische Hochgeschwindigkeits-Umzugsunternehmen** für Dateien und Objekte: Agent auf dem Quellserver, Quelle → Ziel wählen, Start. Eigenes beschleunigtes Protokoll, pausiert bei Leitungsausfall und macht weiter, prüft am Ende mathematisch, dass jedes Bit angekommen ist. Gegenstück zur Dauerbrücke Storage Gateway.

Der SAA vertieft: **Wann braucht der Umzugswagen gar keinen Fahrer (Agent), wie migriert man bei laufendem Betrieb — und gegen welche vier Nachbarn muss DataSync abgegrenzt werden?**

---

## 🎯 SAA-Vertiefung

### Der Werkzeugkasten: Was DataSync wirklich kann

**Das Problem:** „50 TB vom alten NAS nach S3" klingt simpel — bis man an Integritätsnachweis, Bandbreitenschonung im Tagesbetrieb, Metadaten-Erhalt und laufende Änderungen denkt. Ein selbstgebautes `aws s3 sync`-Skript kann kopieren, aber wer beweist dem Auditor, dass nichts verloren ging?

**Die Lösung:** DataSync bringt genau diese Betriebsfähigkeiten mit:
- **Quellen und Ziele:** NFS, SMB, HDFS, self-managed Object Storage, sogar Google Cloud Storage und Azure Files/Blob — nach **S3, EFS und FSx (alle Typen)** und zurück.
- **Verifikation eingebaut:** TLS in transit, **Checksums in-transit und at-rest** — die „mathematische Endkontrolle" ist der Auditoren-Beweis.
- **Betriebsfreundlich:** **Scheduling** (z. B. nächtlich), **Bandbreiten-Throttling** (tagsüber gedrosselt), **inkrementelle Läufe** (nur Deltas), Include/Exclude-Filter, Erhalt von Metadaten und Permissions.
- **Netzwerkwege:** übers Internet, über **Direct Connect** oder komplett privat via **VPC Endpoints**.
- 🔴 Der oft zitierte Durchsatz „~10 Gbps pro Agent" ist nur ein Drittquellen-Richtwert — nie als harte Zahl lernen.

Und die Detail-Frage, die gern getestet wird: Der **Agent** ist nur für On-Prem- und Fremd-Cloud-Quellen nötig. **AWS-zu-AWS** (gleiche Region, gleiches Konto — etwa S3 → EFS oder S3 → FSx) läuft **ganz ohne Agent**.

> **💡 Merksatz:** DataSync = Kopieren **mit Beweis** (Checksums), Zeitplan und Drossel. Agent nur für on-prem/fremde Clouds — **AWS-zu-AWS agentless**.

### Migration bei laufendem Betrieb: Das Delta-Muster

**Das Problem:** Der Fileserver kann für die Migration nicht wochenlang eingefroren werden — während der Übertragung ändern sich Dateien weiter.

**Die Lösung:** Das Standard-Muster heißt **Vollkopie + inkrementelle Läufe + kurzes Cutover**: Erst die initiale Vollkopie (dauert, egal), dann regelmäßige Delta-Läufe, die immer kleiner werden — und zum Umschalttermin nur noch ein letztes Mini-Delta im kurzen Wartungsfenster. Genau so formuliert es die Prüfung: „migrate with minimal downtime" bei **Dateien** → DataSync inkrementell. (Achtung, Falle: Bei **Datenbanken** heißt dasselbe Muster **DMS mit Full Load + CDC** — Dateien fließen durch DataSync, Datenbanken durch DMS.)

> **💡 Merksatz:** Datei-Migration mit minimaler Downtime = **Vollkopie → Deltas → Cutover** via DataSync. Datenbanken → **DMS + CDC**, nicht DataSync.

### Die Abgrenzung: Das Transfer-Quintett

Die eigentliche SAA-Kunst ist, DataSync von seinen vier Nachbarn zu unterscheiden — jede Zeile dieser Tabelle ist eine potenzielle Prüfungsfrage:

| Das Szenario will … | Dienst |
|---|---|
| Dateien/Objekte **bewegen** (einmalig oder geplant), mit Integritätsnachweis | **DataSync** |
| Laufenden hybriden **Zugriff** auf Cloud-Daten (App bleibt on-prem) | **Storage Gateway** |
| **Externe Partner** liefern per SFTP/FTPS/AS2 an | **Transfer Family** |
| **Datenbanken** migrieren (Schema, CDC) | **DMS** |
| PB-Mengen bei zu kleiner Leitung → **offline** per Gerät | **Snow Family** *(nur noch Bestandskunden — Neukunden: DataSync, Data Transfer Terminal oder Partner)* |

Dazu zwei feinere Distraktoren:
- **S3 Transfer Acceleration** beschleunigt einzelne S3-**Uploads** über Edge-Locations — DataSync bewegt **ganze Datasets aus Dateisystemen** mit Verifikation. Verschiedene Jobs.
- Das **`aws s3 sync`-Skript** „funktioniert", ist aber der klassische „operativ teure Eigenbau"-Distraktor: keine integrierte Verifikation, kein Retry-Management, kein Throttling, kein Monitoring.

Und die Bandbreiten-Realität als Rechenprobe: Bei **600 TB über eine 100-Mbit/s-Leitung** rechnet die Prüfung darauf, dass du erkennst: Das dauert *Monate* — hier ist DataSync der Distraktor und physischer Transport die Antwort.

> **💡 Merksatz:** Bewegen → DataSync · Zugreifen → Gateway · Partner-Anlieferung → Transfer Family · Datenbank → DMS · Leitung zu klein → physisch. Wer das Quintett sortieren kann, hat die halbe Transfer-Domäne.

---

## ⚠️ Prüfungs-Knackpunkte

- Datei-/Objekt-Migration mit Integritätsnachweis, Scheduling, Throttling, inkrementell → **DataSync**.
- **Agent** nur für on-prem/Fremd-Cloud; **AWS-zu-AWS (gleiche Region/Konto) agentless**.
- Minimal-Downtime-Migration = Vollkopie → inkrementelle Deltas → Cutover; für DBs gilt stattdessen **DMS + CDC**.
- Laufender File-/Block-Zugriff statt Transfer → **Storage Gateway**; Partner-SFTP → **Transfer Family**.
- Zu wenig Bandbreite für die Datenmenge (TB–PB, dünne Leitung) → physischer Transfer; **Snowball nur noch Bestandskunden** (Neukunden: DataSync / Data Transfer Terminal / Partner).
- `aws s3 sync`-Skript = Eigenbau-Distraktor (keine Verifikation/Retry/Drossel); Transfer Acceleration = einzelne S3-Uploads, kein Dataset-Umzug.
- Private Übertragung ohne Internet → DataSync über **VPC Endpoints / Direct Connect**.
- 🔴 „10 Gbps pro Agent" ist kein offizieller Wert.

## 💡 Der eine Satz zum Mitnehmen

**DataSync ist der beweissichere Umzugswagen für Dateien — er gewinnt jede Frage, in der Daten *bewegt* werden sollen, und verliert jede, in der weiter *zugegriffen*, eine *Datenbank* migriert oder eine viel zu dünne Leitung ignoriert wird.**
