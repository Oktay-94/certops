---
service: Amazon Redshift
seedKey: saa-c03-script-redshift
batch: B2
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/redshift/latest/dg/c-using-spectrum.html
  - https://docs.aws.amazon.com/redshift/latest/mgmt/serverless-capacity.html
  - https://docs.aws.amazon.com/redshift/latest/mgmt/zero-etl.reqs-lims.html
status: draft
---

# Amazon Redshift

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Redshift = das **Petabyte-Data-Warehouse** (OLAP): spaltenbasiert + massiv-parallel (MPP), am Ende der Analytics-Pipeline (Quellen → Glue/Kinesis → **Redshift** → Amazon Quick). Signalwörter: Data Warehouse, BI, komplexe Analysen über riesige Datenmengen. Serverless-Variante vorhanden; **Spectrum** fragt S3 direkt ab.

Der SAA vertieft: **RA3 und die Storage-Trennung, Serverless-RPUs, das Spectrum-vs.-Athena-Duell — und Zero-ETL als moderner Pipeline-Killer.**

---

## 🎯 SAA-Vertiefung

### OLTP vs. OLAP: Das Regal und der Rechenschieber

**Das Problem:** „Kann unsere Aurora nicht einfach auch die Fünf-Jahres-Umsatzanalysen rechnen?" — Und umgekehrt: „Können wir das App-Backend nicht direkt auf Redshift laufen lassen?"

**Die Lösung:** Zwei Werkzeuge, zwei Physiken. **OLTP** (RDS/Aurora) speichert **zeilenweise** — perfekt für „hole/ändere Bestellung Nr. 4711" tausendfach pro Sekunde. **OLAP** (Redshift) speichert **spaltenweise** — perfekt für „summiere `revenue` über 5 Milliarden Zeilen, gruppiert nach Region": Es liest nur die 2 relevanten Spalten statt jeder kompletten Zeile, und der **MPP**-Ansatz (Leader Node plant, viele Compute Nodes rechnen parallel) zerlegt die Arbeit. Beide Fehlbesetzungen sind Standard-Distraktoren: Aurora fürs DWH quält sich, Redshift als App-Backend ist ein Anti-Pattern.

Bei den Knoten gilt: **RA3 + Redshift Managed Storage (RMS)** ist die moderne Wahl — Compute und Storage skalieren **getrennt** (heiße Daten auf lokalen SSDs, kalte automatisch in S3, ein Preis). Die alten DC2-Nodes mit fest verdrahtetem Storage sind der Legacy-Distraktor. Und seit RA3 gibt es **Multi-AZ** fürs DWH (99,99 % SLA) — die HA-Antwort, wenn das Warehouse geschäftskritisch ist.

Performance-Stellschrauben, die als Begriffe fallen können: **Distribution Styles** (KEY = Join-Partner auf denselben Node, ALL = kleine Dimensionstabellen überallhin, AUTO als Default), **Sort Keys** (Range-Scans), **Materialized Views**, **WLM** — und **Concurrency Scaling**, das bei Lese-Peaks transparent Zusatz-Cluster zuschaltet (die Antwort auf „Dashboards werden am Monatsende langsam").

> **💡 Merksatz:** Viele kleine Transaktionen → **RDS/Aurora**; wenige riesige Analysen → **Redshift (RA3 + RMS, Compute/Storage getrennt)**. Lese-Peaks → **Concurrency Scaling**, HA → **Multi-AZ RA3**.

### Serverless: Das Warehouse nach Feierabend

**Das Problem:** Das Data-Science-Team analysiert dreimal im Monat — der provisionierte Cluster kostet aber 30 Tage.

**Die Lösung:** **Redshift Serverless** rechnet in **RPUs** (1 RPU = 16 GB Memory): Base Capacity default 128 RPU, 🛑 **Minimum 4 RPU** (seit 06/2025 — vorher 8; kleine Workloads wurden damit nochmals günstiger), abgerechnet pro RPU-Sekunde **nur bei aktiver Nutzung**. Sporadische Analysen → Serverless; ein rund um die Uhr befeuertes DWH → Provisioned RA3 mit **Reserved Nodes**. Und die D4-Fußnote aus dem RDS-Skript gilt spiegelbildlich: 🛑 **Database Savings Plans decken Redshift NICHT ab.**

> **💡 Merksatz:** Sporadische Analytik → **Serverless (RPUs, min. 4)**; Dauerlast → RA3 + **Reserved Nodes** — Redshift ist der prominente Nicht-Teilnehmer der Database Savings Plans.

### Spectrum vs. Athena: Zwei SQL-Wege nach S3

**Das Problem:** „SQL auf Daten im S3-Data-Lake" — und plötzlich stehen zwei Dienste in den Antwortoptionen, die exakt das versprechen.

**Die Lösung:** Der Unterschied ist der **Ausgangspunkt**:
- **Redshift Spectrum** ist ein **Anbau ans bestehende Warehouse**: Aus dem laufenden Redshift-Cluster (oder Serverless) heraus fragst du externe S3-Tabellen ab — und **joinst sie mit den lokalen DWH-Tabellen**. Ohne Redshift kein Spectrum.
- **Athena** ist der **freistehende Kiosk**: komplett serverless, kein Cluster, ad-hoc SQL direkt auf S3 (Trino/Presto), bezahlt pro gescanntem Datenvolumen.

Der Prüfungs-Dreisatz: „Bestehendes Redshift soll den Data Lake **mit abfragen** (ohne die Daten zu laden)" → **Spectrum**. „**Keine Infrastruktur**, gelegentliche Ad-hoc-Queries auf S3-Logs" → **Athena**. „Daten erst per COPY laden" → der Distraktor, der „ohne Laden" überliest.

> **💡 Merksatz:** **Spectrum erweitert ein Warehouse, Athena ersetzt keins** — hast du Redshift und willst S3 dazu-joinen → Spectrum; hast du nichts und willst nur fragen → Athena.

### Zero-ETL: Die Pipeline, die niemand mehr baut

**Das Problem:** Die klassische Antwort auf „Bestellungen aus Aurora sollen im DWH analysierbar sein" war jahrelang eine ETL-Pipeline: Glue-Jobs schreiben, scheduled laufen lassen, Fehler behandeln, Latenz von Stunden akzeptieren — oder eine DMS-CDC-Strecke pflegen.

**Die Lösung:** 🛑 **Zero-ETL-Integration**: AWS repliziert **Aurora MySQL/PostgreSQL → Redshift** und **RDS MySQL/PostgreSQL → Redshift** (RDS-PostgreSQL-Weg GA 07/2025) vollautomatisch und near-real-time — keine Pipeline, kein Code, Daten in Minuten analysierbar (Ziel-DB read-only). In modernen Fragen ist die selbstgebaute Glue-/DMS-Pipeline damit vom „richtigen Weg" zum **Distraktor** geworden, sobald „ohne Pipeline-Betrieb / near-real-time" gefordert ist.

Zwei Verwandte fürs Sortiment: **Federated Query** (Redshift fragt *live* in RDS/Aurora hinein — für kleine, aktuelle Lookups, nicht für schwere Dauer-Analytik auf der OLTP-DB) und **Datashares** (Daten zwischen Clustern/Konten teilen **ohne Kopie** — die Antwort auf „Team B braucht Lesezugriff auf unser DWH").

> **💡 Merksatz:** „OLTP-Daten near-real-time im DWH, ohne Pipeline" → 🛑 **Zero-ETL**. Live-Lookup in die OLTP-DB → **Federated Query**; DWH-Daten teilen ohne Kopie → **Datashares**.

---

## ⚠️ Prüfungs-Knackpunkte

- OLAP/DWH/BI über TB–PB → **Redshift**; App-Backend auf Redshift = Anti-Pattern; DWH auf Aurora = Fehlbesetzung.
- **RA3 + Managed Storage** = Compute/Storage getrennt (DC2 = Legacy); geschäftskritisch → **Multi-AZ RA3**.
- Lese-Peaks → **Concurrency Scaling**; Modellierung: Distribution Style KEY/ALL/AUTO, Sort Keys, Materialized Views.
- Sporadische Nutzung → **Serverless** (1 RPU = 16 GB, 🛑 min. 4 RPU seit 06/2025); Dauerlast → Reserved Nodes; 🛑 **keine Database Savings Plans** für Redshift.
- **Spectrum** = S3-Abfragen aus bestehendem Redshift (+ Joins mit DWH-Tabellen); **Athena** = serverless ad-hoc ohne Cluster.
- 🛑 **Zero-ETL** (Aurora/RDS → Redshift) = near-real-time ohne Pipeline — Glue/DMS-Eigenbau wird zum Distraktor.
- Live in OLTP schauen → **Federated Query**; teilen ohne Kopie → **Datashares**.

## 💡 Der eine Satz zum Mitnehmen

**Redshift gewinnt jede Frage, in der wenige große Analysen über riesige Datenmengen laufen** — die Feinheiten entscheiden sich an vier Weichen: RA3 (getrennter Storage), Serverless (sporadisch), Spectrum vs. Athena (Anbau vs. Kiosk) und Zero-ETL (die Pipeline, die keiner mehr baut).
