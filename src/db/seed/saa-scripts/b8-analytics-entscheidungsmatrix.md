---
service: Analytics-Entscheidungsmatrix (übergreifend)
seedKey: saa-c03-script-analytics-decision-matrix
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/whitepapers/latest/big-data-analytics-options/welcome.html
status: draft
---

# Analytics-Entscheidungsmatrix

## 📋 Einordnung

> Das Analytics-Kapitel ist ein Verwechslungs-Minenfeld: Athena/Redshift/EMR/Glue/OpenSearch/QuickSight klingen alle nach „Daten verarbeiten", Streams/Firehose/Flink/MSK/Kinesis nach „Streaming", und Athena vs. Redshift Spectrum ist die feinste Falle. Dieses Skript bündelt die sieben Entscheidungstabellen. Die große Analytics-Abgrenzung (1) ist die meistgeprüfte.

---

## 🎯 Matrix 1: Die große Analytics-Abgrenzung

| Das Szenario sagt … | Antwort |
|---|---|
| „ad-hoc SQL", „Logs in S3", „serverless", „keine Infrastruktur" | **Athena** |
| „Data Warehouse", „komplexe Joins", „häufige BI-Queries", „geladene Daten" | **Redshift** |
| „Hadoop", „Spark", „HBase", „Custom-Framework", „Cluster" | **EMR** |
| „ETL", „Data Catalog", „Crawler", „serverlose Datenintegration" | **Glue** |
| „Volltextsuche", „Log-Analytics", „Elasticsearch", „Dashboards/Kibana" | **OpenSearch** |
| „Visualisierung", „Dashboard", „BI", „Bericht fürs Management" | **QuickSight** |

## 🎯 Matrix 2: Athena vs. Redshift Spectrum (beide SQL auf S3)

| | **Athena** | **Redshift Spectrum** |
|---|---|---|
| Cluster nötig? | **nein** (serverless) | **ja** (laufender Redshift) |
| Use Case | Ad-hoc/Exploration | S3-Daten **mit Cluster-Tabellen joinen** |
| Preis | $5/TB gescannt | $5/TB gescannt |
| Signalwort | „kein Cluster, ad-hoc" | „schon Redshift + Join mit S3" |

## 🎯 Matrix 3: Glue vs. EMR

| Bedarf | Antwort |
|---|---|
| serverless ETL, wenig Ops, Standard-Transformation | **Glue** |
| Hadoop/Spark/HBase explizit, Custom-Libs, Cluster-Kontrolle | **EMR** |

## 🎯 Matrix 4: Streaming (Ingestion / Delivery / Processing / Kafka)

| Bedarf | Antwort |
|---|---|
| Ingestion/Puffer, mehrere Consumer, Replay, eigene Logik | **Kinesis Data Streams** |
| codelose Delivery nach S3/Redshift/OpenSearch | **Amazon Data Firehose** |
| Echtzeit-Aggregation/Windowing (SQL/Flink) | **Managed Service for Apache Flink** |
| bestehendes Kafka / „Kafka" gefordert | **Amazon MSK** |
| simple Entkopplung, 1 Consumer, kein Streaming | **SQS** (nicht Kinesis) |

## 🎯 Matrix 5: Data-Lake-Governance

| Bedarf | Antwort |
|---|---|
| feingranular (Spalten-/Zeilenebene), zentral über Athena/Redshift/EMR | **Lake Formation** |
| ganzen Bucket/Prefix freigeben | **IAM / S3-Bucket-Policy** |
| fremde/gekaufte Datensätze beziehen | **AWS Data Exchange** |
| Metadaten zentral für Athena/EMR/Spectrum | **Glue Data Catalog** |

## 🎯 Matrix 6: QuickSight SPICE vs. Direct Query

| Bedarf | Antwort |
|---|---|
| schnell, viele Nutzer, Quelle entlasten (Snapshot ok) | **SPICE** |
| immer live/aktuell | **Direct Query** |

## 🎯 Matrix 7: Media

| Bedarf | Antwort |
|---|---|
| Video von Kameras/Geräten für Analyse/ML | **Kinesis Video Streams** (+ Rekognition) |
| bidirektionales Ultra-low-latency-Video | **KVS WebRTC** |
| Video transcodieren (SAA-Scope) | **Elastic Transcoder** (🛑 praktisch abgelöst) |

## ⚠️ Die zehn häufigsten Analytics-Fehlgriffe

1. **Redshift** trotz „ad-hoc, keine Infrastruktur" (→ Athena).
2. **Athena** trotz „Join S3-Daten mit Redshift-Tabellen" (→ Spectrum).
3. **Glue** trotz „Hadoop/Spark-Cluster explizit" (→ EMR).
4. **EMR** trotz „serverless ETL, wenig Ops" (→ Glue).
5. **Athena** trotz „Volltextsuche / Log-Dashboards" (→ OpenSearch).
6. **Firehose** trotz „mehrere Consumer / Replay" (→ Data Streams).
7. **Kinesis** trotz „bestehendes Kafka" (→ MSK).
8. **IAM/S3-Policy** trotz „Spalten-/Zeilen-Level" (→ Lake Formation).
9. **eigene ETL-Pipeline** trotz „Third-Party-Daten abonnieren" (→ Data Exchange).
10. **Direct Query** trotz „viele Nutzer, Quelle entlasten" (→ SPICE).

## 💡 Der eine Satz zum Mitnehmen

**Analytics-Fragen beantworten sich über das Signalwort: ad-hoc SQL auf S3 (Athena), Warehouse (Redshift), Hadoop/Spark (EMR), ETL (Glue), Volltextsuche (OpenSearch), Dashboard (QuickSight), Streaming (Kinesis/MSK), feingranulare Governance (Lake Formation) — fast immer zeigt genau ein Wort auf genau eine Zeile.**
