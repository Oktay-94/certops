---
service: Amazon Redshift (Analytics-Vertiefung)
seedKey: saa-c03-script-redshift-analytics
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/redshift/latest/mgmt/welcome.html
  - https://docs.aws.amazon.com/redshift/latest/dg/c-using-spectrum.html
  - https://aws.amazon.com/redshift/features/concurrency-scaling/
status: draft
---

# Amazon Redshift (Analytics-Vertiefung)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Redshift = das **Data Warehouse** von AWS (petabyte-scale, MPP, kolumnar, OLAP) — das „fest eingerichtete Kriminallabor" gegenüber Athenas spontaner Detektivarbeit. Grunddienst wurde im Datenbank-Batch behandelt; hier die **Analytics-Vertiefung**: Spectrum, Serverless, Concurrency Scaling, Data Sharing, Zero-ETL. Kern-Abgrenzung: **Athena = ad-hoc/serverless auf S3; Redshift = geladene Daten, komplexe Joins, häufige BI-Queries**.

Der SAA vertieft: **RA3/Managed Storage, Spectrum, Concurrency Scaling, Data Sharing — und die Zero-ETL-Neuerung.**

---

## 🎯 SAA-Vertiefung

### RA3 + Managed Storage: Compute und Storage entkoppeln

**Das Problem:** Ein Warehouse wächst — man braucht mehr Speicher, aber nicht mehr Rechenleistung. Bei alten Node-Typen musste man beides zusammen skalieren (und für ungenutzte Compute zahlen).

**Die Lösung:** **RA3-Nodes mit Managed Storage (RMS)** **entkoppeln Compute und Storage**: Man skaliert (und zahlt) beides **getrennt**. Hot Data liegt auf lokalem SSD, kalte Daten automatisch in S3 — man zahlt Storage nach **tatsächlich gespeicherten Daten**, unabhängig von der Compute-Größe. Das ist die Antwort auf „Storage wächst, Compute nicht" → RA3/RMS. Darauf bauen mehrere Features auf (Data Sharing, AQUA).

**Redshift Serverless** geht noch weiter: kein Cluster-Management, Auto-Scaling, Abrechnung in **RPUs** pro Sekunde — für schwankende/unvorhersehbare Workloads, bei denen ein dauerhaft provisionierter Cluster Verschwendung wäre.

> **💡 Merksatz:** **RA3 + Managed Storage** entkoppelt Compute/Storage (getrennt skalieren/zahlen, kalt→S3). **Serverless** (RPUs/Sekunde) für schwankende Workloads.

### Spectrum und Concurrency Scaling

**Das Problem 1:** Man will kalte Daten in S3 abfragen, ohne sie erst ins Warehouse zu laden — und sie direkt mit den geladenen Redshift-Tabellen joinen.

**Die Lösung 1:** **Redshift Spectrum** fragt Daten **direkt in S3** ab (External Tables), ohne Laden/ETL, und **joint sie mit Cluster-Tabellen** — über einen separaten, managed Compute-Pool. Voraussetzung: **Cluster und S3-Bucket in derselben Region**. Das ist die Antwort auf „S3-Daten mit Warehouse-Daten joinen ohne Laden" (im Gegensatz zu Athena, das standalone/serverless ist, aber nicht mit Redshift-Tabellen joint).

**Das Problem 2:** Morgens stürmen hunderte Nutzer gleichzeitig aufs Dashboard, und Queries stauen sich.

**Die Lösung 2:** **Concurrency Scaling** startet automatisch **temporäre Zusatz-Cluster** für Query-Bursts und fährt sie danach herunter — konsistente Performance bei Lastspitzen ohne dauerhaftes Überprovisionieren. Jeder Cluster sammelt **bis zu 1 h kostenlose Concurrency-Scaling-Credits pro Tag** (deckt laut AWS die Concurrency-Bedürfnisse der meisten Kunden).

> **💡 Merksatz:** **Spectrum** = S3 direkt abfragen + mit Cluster-Tabellen joinen (gleiche Region). **Concurrency Scaling** = temporäre Cluster für Query-Bursts (1 h/Tag gratis).

### Data Sharing und 🛑 Zero-ETL

**Data Sharing** (baut auf RMS) teilt Daten **read-only zwischen isolierten Clustern ohne Kopie** — Consumer-Queries belasten den Producer nicht. Ideal, um z. B. ein Analytics-Team lesend auf Produktionsdaten zugreifen zu lassen, ohne ETL-Kopien und ohne den Produktions-Cluster zu bremsen.

🛑 **Zero-ETL-Integration** (GA Okt 2024) ist die prüfungsrelevante Neuerung: **Aurora (MySQL/PostgreSQL), RDS for MySQL und DynamoDB** replizieren **near-real-time** nach Redshift — **ohne** eigene ETL-Pipeline (kein Glue-Job, kein DMS). Das ersetzt den klassischen Distraktor „nutze Glue/DMS, um Aurora→Redshift zu spiegeln": Wenn „near-real-time Analytics auf Transaktionsdaten ohne ETL-Pipeline" gefragt ist → **Zero-ETL**.

> **💡 Merksatz:** **Data Sharing** = read-only zwischen Clustern ohne Kopie (Producer unbelastet). 🛑 **Zero-ETL** (Aurora/RDS/DynamoDB→Redshift, near-real-time, keine Pipeline) ersetzt Glue/DMS-Spiegelung.

---

## ⚠️ Prüfungs-Knackpunkte

- **RA3 + Managed Storage** entkoppelt Compute/Storage; **Serverless** (RPUs) für schwankende Last.
- **Spectrum** = S3 direkt + Join mit Cluster-Tabellen (Cluster+S3 gleiche Region); **Athena** = standalone/serverless, kein Redshift-Join.
- **Concurrency Scaling** = temporäre Cluster für Bursts (1 h/Tag gratis).
- **Data Sharing** = read-only zwischen Clustern ohne Kopie.
- 🛑 **Zero-ETL** (Aurora/RDS/DynamoDB→Redshift, Okt 2024) ersetzt Glue/DMS-Pipelines für near-real-time Analytics.
- **AQUA**, **Materialized Views**, **Redshift ML** als weitere Vertiefungen.

## 💡 Der eine Satz zum Mitnehmen

**Redshift ist das Warehouse für häufige, komplexe Queries — RA3 entkoppelt Compute/Storage, Spectrum joint S3-Daten direkt mit Cluster-Tabellen, Concurrency Scaling fängt Bursts ab, und Zero-ETL bringt Transaktionsdaten near-real-time hinein, ohne dass man je eine ETL-Pipeline baut.**
