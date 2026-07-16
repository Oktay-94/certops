---
service: Amazon EFS
seedKey: saa-c03-script-efs
batch: B1
domains: [D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/efs/latest/ug/performance.html
  - https://docs.aws.amazon.com/efs/latest/ug/storage-classes.html
  - https://docs.aws.amazon.com/efs/latest/ug/efs-access-points.html
status: draft
---

# Amazon EFS

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EFS = das **gemeinsame Netzlaufwerk (NFS) für die Linux-Welt**: Tausende EC2-Instanzen (und Container/Lambda) mounten dasselbe elastische Dateisystem, das automatisch bis in den Petabyte-Bereich wächst und schrumpft. Klassen analog zu S3 (Standard/One Zone/IA/Archive) mit Lifecycle Management. Für Windows → FSx.

Der SAA will mehr: **Welcher Durchsatz-Modus, warum ist das kleine EFS langsam, wie kommt Lambda da rein — und wann ist EFS trotz „geteiltes Dateisystem" die falsche Antwort?**

---

## 🎯 SAA-Vertiefung

### Das Rätsel des langsamen kleinen Dateisystems

**Das Problem:** Ein Team legt ein neues EFS an, kopiert 5 GB Konfigurationsdaten hinein — und wundert sich, dass der Durchsatz unterirdisch ist. „EFS soll doch skalieren?!"

**Die Lösung:** Der klassische Durchsatz-Modus **Bursting** koppelt die Leistung an die *Größe* des Dateisystems: Baseline **50 MiB/s pro gespeichertem TiB** (Burst bis 100 MiB/s pro TiB). Ein 5-GB-Dateisystem hat also fast keine Baseline — es lebt von Burst-Credits und bricht danach ein. Dasselbe Prepaid-Muster wie bei gp2-Volumes, nur auf Dateisystem-Ebene.

Zwei Auswege:
- **Elastic Throughput** (der moderne Default für Neues): skaliert vollautomatisch mit der tatsächlichen Last, du zahlst nach Nutzung — ideal bei unvorhersehbaren oder spitzen Workloads.
- **Provisioned Throughput:** fester, gebuchter Durchsatz unabhängig von der Größe — „viel Durchsatz, wenige Daten" als planbarer Sonderfall.

Und der Performance-Modus daneben ist eine eigene Falle: **General Purpose** ist der Default mit der niedrigsten Latenz, und AWS empfiehlt ihn ausdrücklich **für alle** Dateisysteme. **Max I/O** ist offiziell „previous generation" — höhere Latenz, inkompatibel mit One Zone und Elastic Throughput. Altes Kursmaterial sagt noch „viele Clients → Max I/O"; in neuen Szenarien ist Max I/O praktisch immer der **veraltete Distraktor**.

> **💡 Merksatz:** Kleines EFS + Bursting = wenig Baseline → **Elastic Throughput** ist die moderne Antwort. **General Purpose immer**, Max I/O ist Vorgänger-Generation.

### Klassen & Verfügbarkeit: Das Multi-AZ-Laufwerk und sein günstiger Bruder

**Standard ist regional** — das Dateisystem lebt über mehrere AZs, und genau das macht EFS zur richtigen Antwort für hochverfügbare Architekturen: Eine Auto-Scaling-Gruppe über drei AZs mountet aus jeder AZ dasselbe Laufwerk. **One Zone** ist der günstige Bruder in einer einzigen AZ — für Dev/Test und reproduzierbare Daten, aber ohne AZ-Ausfallschutz.

Der Kostenhebel heißt wie bei S3 **Lifecycle Management**: selten genutzte Dateien wandern automatisch nach **IA**, die kältesten nach **Archive** — bei typischen Workloads liegt der Großteil der Daten kalt, und genau dort spart man. Für DR über Regionen gibt es **EFS Replication** (managed, Ziel read-only bis zum Failover).

> **💡 Merksatz:** HA-Architektur über AZs → **EFS Standard** (regional). Kosten senken → **Lifecycle nach IA/Archive** — nicht One Zone für Prod-Daten opfern.

### Zugriff: Mount Targets, die Security-Group-Falle und der Lambda-Trick

**Das Problem:** „Die EC2-Instanz kann das EFS nicht mounten — Timeout." Die häufigste Ursache ist banal und ein Prüfungsklassiker.

**Die Lösung:** EFS wird pro AZ über ein **Mount Target** (eine ENI) angesprochen, und diese ENI hat eine **Security Group**. Erlaubt die nicht **NFS-Port 2049** von der Instanz-SG aus, gibt es exakt dieses Timeout. „EFS-Mount schlägt fehl" → zuerst SG auf 2049 prüfen.

Darauf bauen zwei SAA-Muster auf:
- **EFS Access Points:** benannte Eintrittspunkte, die pro Anwendung eine **POSIX-Identität und ein Root-Verzeichnis erzwingen** — saubere Mandantentrennung auf einem geteilten Dateisystem. Und: **Lambda mountet EFS ausschließlich über einen Access Point** (Lambda muss dafür in der VPC laufen). Das ist die Antwort auf „Lambda braucht mehr als die 10 GB /tmp" oder „mehrere Lambdas teilen sich persistente Dateien".
- **Hybrid:** EFS ist über **Direct Connect/VPN auch on-prem mountbar** — das geteilte Laufwerk reicht bis ins eigene RZ.

Sicherheit rundet ab: Encryption at rest (KMS), in transit per TLS-Mount-Option, plus IAM-Autorisierung für NFS-Clients.

> **💡 Merksatz:** Mount-Probleme = fast immer **Security Group / Port 2049**. Lambda + Dateisystem = **EFS via Access Point** (VPC-Pflicht).

### Die Abgrenzung, an der alles hängt

„Geteiltes Dateisystem" ist das Signalwort — aber vier Nachbarn lauern als Distraktoren:
- **EBS Multi-Attach?** Nur eine AZ, nur Block, braucht Cluster-Filesystem → für „viele Webserver, gemeinsame Dateien" falsch.
- **FSx for Windows?** Richtig, sobald **SMB/Windows/Active Directory** im Text steht — EFS ist NFS/Linux.
- **FSx for Lustre?** Richtig bei **HPC/ML/maximalem Durchsatz** — EFS ist das Allzweck-Laufwerk, nicht der Rennwagen.
- **S3?** Richtig, wenn die App per API/URL zugreifen kann — EFS nur, wenn sie ein **POSIX-Dateisystem** erwartet.

> **💡 Merksatz:** EFS = „viele **Linux**-Instanzen, ein **Dateisystem**, über **AZs**". Windows → FSx Windows, HPC → Lustre, API reicht → S3.

---

## ⚠️ Prüfungs-Knackpunkte

- Auto-Scaling-Gruppe über AZs braucht gemeinsames Verzeichnis → **EFS Standard** (regional/Multi-AZ).
- Kleines Dateisystem, Durchsatz bricht ein → Bursting-Baseline zu klein → **Elastic Throughput** (oder Provisioned).
- **General Purpose** für alles; **Max I/O = previous generation** (Distraktor), inkompatibel mit One Zone/Elastic.
- Mount schlägt fehl → **Security Group, NFS-Port 2049** am Mount Target.
- Lambda braucht großes/geteiltes persistentes Dateisystem → **EFS + Access Point**, Lambda in der VPC.
- Kosten: **Lifecycle → IA/Archive**; One Zone nur für unkritische/reproduzierbare Daten.
- DR über Regionen → **EFS Replication**.
- Windows/SMB/AD → **FSx Windows**, nicht EFS; HPC/ML → **FSx Lustre**; App kann API → **S3**.

## 💡 Der eine Satz zum Mitnehmen

**EFS ist die Antwort, wenn viele Linux-Instanzen dasselbe POSIX-Dateisystem über mehrere AZs brauchen** — sobald das Szenario stattdessen Windows, HPC-Extremdurchsatz oder bloßen API-Zugriff beschreibt, gehört einer der Nachbarn aufs Antwortfeld.
