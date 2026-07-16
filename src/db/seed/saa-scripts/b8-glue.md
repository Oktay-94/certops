---
service: AWS Glue
seedKey: saa-c03-script-glue
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/glue/latest/dg/what-is-glue.html
  - https://aws.amazon.com/glue/faqs/
  - https://aws.amazon.com/glue/pricing/
status: draft
---

# AWS Glue

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Glue = der **Kleber, der rohe Datenberge putzt, sortiert und analysetauglich zusammenfügt** — der serverlose **ETL**-Dienst. Zwei Herzstücke: **Data Catalog** (Crawler inferieren automatisch Schema/Format → zentraler Metadaten-Katalog, den auch Athena nutzt) und **ETL-Jobs** (Spark-basiert, säubern/umformen, z. B. CSV→Parquet). Signalwort: **„ETL" → Glue. Punkt.** Serverlos (Abgrenzung zu EMR).

Der SAA vertieft: **den Data Catalog als zentrale Metadatenschicht, DataBrew und Schema Registry, Job Bookmarks — und die Abgrenzung zu EMR.**

---

## 🎯 SAA-Vertiefung

### Der Data Catalog: Eine Metadatenschicht für alle Query-Engines

**Das Problem:** Athena, EMR und Redshift Spectrum sollen alle dieselben S3-Daten abfragen — aber jedes Tool sein eigenes Schema pflegen zu lassen, führt zu Drift und Doppelarbeit.

**Die Lösung:** Der **Glue Data Catalog** ist die **zentrale, Hive-kompatible Metadatenschicht** — ein Katalog pro Account/Region, den **Athena, EMR und Redshift Spectrum gemeinsam** nutzen. **Crawler** durchforsten Quellen (S3 u. a.), erkennen Schema, Format und **Partitionen** automatisch und schreiben sie in den Katalog. So ist die Tabellendefinition **Single Source of Truth** für alle Engines: Ein Crawler-Lauf, und Athena wie Spectrum sehen dieselbe Struktur. Das ist die Antwort auf „zentrale Metadaten für mehrere Analytics-Dienste" → Glue Data Catalog (nicht ein selbstbetriebener Hive-Metastore auf EC2, den man sonst pflegen müsste).

> **💡 Merksatz:** **Glue Data Catalog = zentrale Hive-kompatible Metadatenschicht** (1/Account/Region) für **Athena, EMR, Redshift Spectrum**. **Crawler** inferieren Schema + Partitionen automatisch.

### DataBrew, Schema Registry und Job Bookmarks

Drei Features, die als gezielte Antwortoptionen auftauchen:
- **Glue DataBrew**: **visuelle**, point-and-click Datenaufbereitung mit 250+ eingebauten Transformationen — **kein Code**. Für Analysten/Data-Scientists, die Daten säubern wollen, ohne Spark zu schreiben. „visuelle Datenaufbereitung ohne Code" → DataBrew (nicht Glue Studio, das mehr Spark-Nähe hat).
- **Glue Schema Registry**: validiert und kontrolliert **Schema-Evolution** (Avro, JSON Schema) für Streaming — integriert mit **Kafka/MSK, Kinesis Data Streams, Flink**. „Schema-Evolution für Streams kontrollieren" → Schema Registry (nicht Data Catalog, der Tabellen-Metadaten hält).
- **Job Bookmarks**: merken sich, welche Daten ein ETL-Job bereits verarbeitet hat, und verhindern so **Reprocessing** bei inkrementellen Läufen — ein Kosten- und Korrektheitshebel.

> **💡 Merksatz:** **DataBrew** = visuelle Aufbereitung ohne Code; **Schema Registry** = Schema-Evolution für Streams (MSK/Kinesis/Flink); **Job Bookmarks** verhindern Reprocessing.

### Glue vs. EMR: Serverless-ETL vs. Big-Data-Cluster

**Das Problem:** Beide transformieren Daten mit Spark. Wann Glue, wann EMR?

**Die Lösung:** Die Frage ist **managed/serverless vs. volle Cluster-Kontrolle**:
- **Glue**: **serverless**, kein Cluster, pay-per-DPU-second, schnellstartend, minimaler Betrieb — für Standard-ETL und Data-Catalog-Aufgaben.
- **EMR**: echter **Cluster** (EC2/EKS/Serverless) mit vollem Zugriff auf **Hadoop/Spark/Hive/HBase/Presto**, Custom-Bibliotheken und Instance-/JVM-Tuning — für sehr große oder framework-spezifische Big-Data-Jobs.

Der Reflex: „ETL, serverless, wenig Ops" → **Glue**; „Hadoop/Spark/HBase explizit, Custom-Frameworks, Cluster-Kontrolle" → **EMR**. Sobald **„Hadoop" oder „Spark-Cluster"** im Text steht → EMR; sobald **„ETL/serverless/Catalog"** steht → Glue.

> **💡 Merksatz:** **Glue = serverless ETL ohne Infrastruktur** (Standard). **EMR = Big-Data-Cluster mit Custom-Frameworks** (Hadoop/Spark explizit). „ETL/serverless" → Glue, „Hadoop/Spark-Cluster" → EMR.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwort **„ETL" → Glue**; serverlos, kein Cluster.
- **Data Catalog** = zentrale Metadatenschicht (1/Account/Region, Hive-kompatibel) für **Athena/EMR/Redshift Spectrum**; **Crawler** inferieren Schema+Partitionen.
- **DataBrew** (visuell, kein Code) vs. **Glue Studio** (Spark-nah); **Schema Registry** (Schema-Evolution für Streams); **Job Bookmarks** (kein Reprocessing).
- Abgrenzung: **Glue (serverless ETL) vs. EMR (Big-Data-Cluster, Hadoop/Spark)**.
- 🛑 Glue 5.0 (Spark 3.5.4) seit Dez 2024; Zero-ETL kann klassische Glue-ETL-Distraktoren für Aurora→Redshift ersetzen.
- Dreamteam: Glue → Athena → QuickSight.

## 💡 Der eine Satz zum Mitnehmen

**Glue ist serverloses ETL mit einem zentralen Data Catalog, der als Single Source of Truth für Athena, EMR und Redshift Spectrum dient — DataBrew macht Aufbereitung ohne Code, und sobald „Hadoop/Spark-Cluster" gefordert ist, gewinnt EMR statt Glue.**
