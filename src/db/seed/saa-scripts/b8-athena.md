---
service: Amazon Athena
seedKey: saa-c03-script-athena
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/athena/latest/ug/what-is.html
  - https://aws.amazon.com/athena/pricing/
  - https://docs.aws.amazon.com/athena/latest/ug/workgroups-setting-control-limits-cloudwatch.html
status: draft
---

# Amazon Athena

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Athena = die **Detektivin, die Dateiberge in S3 direkt per SQL verhört** — serverlos, nichts zu starten. Man zahlt **pro gescannter Datenmenge**; versteht CSV/JSON/Parquet/ORC. Lieblingsfall: **Log-Analyse** (CloudTrail/ELB-Logs liegen eh in S3). Trio: **Glue katalogisiert → Athena fragt → QuickSight visualisiert**. Kostenhebel: **Parquet/ORC + Partitionierung**. Abgrenzung: **Athena = spontane Detektivin am Tatort (S3), Redshift = das fest eingerichtete Kriminallabor**.

Der SAA vertieft: **die Kostenmechanik genau, Workgroups zur Kostenkontrolle, CTAS und Federated Queries — und die feine Abgrenzung zu Redshift Spectrum.**

---

## 🎯 SAA-Vertiefung

### Die Kostenmechanik: Weniger scannen = weniger zahlen

**Das Problem:** Ein Team feuert dieselbe Query täglich auf ein 2-TB-CSV in S3 und wundert sich über die Rechnung. Warum ist das teuer, und wie senkt man es um 90 %?

**Die Lösung:** Athena kostet 🔴 **~$5 pro gescanntem TB** (US-Listenpreis) — abgerechnet wird die **gescannte**, nicht die zurückgegebene Datenmenge. Drei Hebel senken das drastisch (offiziell 30–90 %):
- **Kolumnare Formate (Parquet/ORC)** statt CSV/JSON: Athena liest nur die **benötigten Spalten** statt der ganzen Zeile — bei „SELECT zwei Spalten aus 50" ein enormer Unterschied.
- **Partitionierung** (z. B. nach Datum): `WHERE date='2026-06'` scannt nur diesen Ordner statt aller Jahre. Partition Projection automatisiert das.
- **Kompression** (Snappy/GZIP): weniger Bytes zu scannen.

Wichtig für Fragen: **DDL** (CREATE/ALTER/DROP), Partitionsverwaltung und **fehlgeschlagene Queries** sind kostenlos; abgebrochene Queries kosten nur die bis dahin gescannten Daten. Signalwort „Athena-Kosten/Performance optimieren" → **Parquet + Partitionierung + Kompression**.

> **💡 Merksatz:** Athena zahlt pro **gescanntem** TB (🔴 ~$5). Senken via **Parquet/ORC (Spalten) + Partitionierung (Ordner) + Kompression** — 30–90 % möglich. DDL/fehlgeschlagene Queries kostenlos.

### Workgroups: Kosten hart deckeln

**Das Problem:** Ein Analyst schreibt versehentlich eine Query ohne Filter und scannt 50 TB — die Rechnung explodiert. Wie verhindert man das strukturell?

**Die Lösung:** **Workgroups** trennen Nutzer/Teams/Workloads und bringen **Cost Controls**: Ein **per-query Datenlimit** **cancelt** eine Query automatisch, sobald sie die erlaubte Scan-Menge überschreitet — die Kostenexplosion wird verhindert, nicht nur gemeldet. Ein **per-workgroup-Limit** dagegen löst nur einen **SNS-Alarm** aus (Benachrichtigung, kein Abbruch). Der Unterschied ist prüfbar: „Query hart stoppen bei zu viel Scan" → per-query Limit; „Team-Budget überwachen" → per-workgroup + SNS. Workgroups legen außerdem Query-Engine und S3-Ergebnisort fest.

> **💡 Merksatz:** **Workgroup per-query Datenlimit = cancelt die Query** (harte Bremse); **per-workgroup Limit = nur SNS-Alarm**. Kostenkontrolle + Team-Trennung.

### CTAS, Federated Queries — und Redshift Spectrum

**CTAS** (`CREATE TABLE AS SELECT`) schreibt Query-Ergebnisse als neues, optimiertes Dataset nach S3 (Default Parquet) — ideal, um oft genutzte Aggregate einmal zu materialisieren und danach günstig abzufragen. **Federated Queries** erweitern Athena über S3 hinaus: via Lambda-Connectoren fragt man **DynamoDB, DocumentDB, CloudWatch, HBase** u. a. in derselben SQL-Query ab.

Die feine Abgrenzung, die geprüft wird — **Athena vs. Redshift Spectrum** (beide SQL auf S3, gleicher $5/TB-Preis, read-only):
- **Athena**: standalone, **serverless, kein Cluster** — für Ad-hoc/Exploration ohne bestehende Infrastruktur.
- **Redshift Spectrum**: ein **Feature von Redshift**, braucht einen **laufenden Cluster** — sinnvoll, wenn man S3-Daten **direkt mit Redshift-Tabellen joinen** und den MPP-Query-Planner für komplexe Joins nutzen will.

Reflex: „kein Redshift-Cluster vorhanden, ad-hoc" → **Athena**; „schon Redshift + Join mit S3-Daten" → **Spectrum**.

> **💡 Merksatz:** **CTAS** materialisiert Aggregate nach S3; **Federated Queries** fragen Nicht-S3-Quellen via Lambda. **Athena (serverless, kein Cluster) vs. Redshift Spectrum (braucht Cluster, joint mit Redshift-Tabellen)**.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwort-Fingerabdruck: **„SQL" + „direkt auf S3" + „serverlos" → Athena**.
- Kosten pro **gescanntem** TB (🔴 ~$5) → **Parquet/ORC + Partitionierung + Kompression** (30–90 %); DDL/fehlgeschlagene Queries gratis.
- **Workgroup per-query Limit cancelt** (harte Bremse); per-workgroup Limit = **SNS-Alarm**.
- **CTAS** materialisiert Aggregate; **Federated Queries** (Lambda-Connectoren) für DynamoDB/CloudWatch etc.
- **Athena (kein Cluster) vs. Redshift Spectrum (braucht Cluster, joint mit Redshift-Tabellen)**; beide $5/TB.
- Trio: Glue (Catalog) → Athena (Query) → QuickSight (Viz).

## 💡 Der eine Satz zum Mitnehmen

**Athena ist serverloses SQL direkt auf S3 — die Rechnung hängt an der gescannten Datenmenge, also gewinnen Parquet, Partitionierung und Workgroup-Limits jede Kostenfrage; gegenüber Redshift Spectrum gilt: kein Cluster nötig heißt Athena, Join mit Redshift-Tabellen heißt Spectrum.**
