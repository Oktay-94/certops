---
service: Amazon Kinesis & Managed Service for Apache Flink (Analytics)
seedKey: saa-c03-script-kinesis-analytics
batch: B8
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/streams/latest/dev/introduction.html
  - https://docs.aws.amazon.com/firehose/latest/dev/what-is-this-service.html
  - https://docs.aws.amazon.com/managed-flink/latest/java/what-is.html
status: draft
---

# Amazon Kinesis & Managed Service for Apache Flink (Analytics-Einordnung)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Kinesis = das **Förderband für Datenströme, die nie aufhören** (data in motion vs. data at rest). **Data Streams** = rohes Förderband, Echtzeit + eigene Logik (Shards). **Data Firehose** = Auto-Auslieferer, ohne Code near-real-time nach S3/Redshift/OpenSearch. **Data Analytics** = SQL/Flink auf dem laufenden Strom. 🛑 Neue Namen: **Firehose → Amazon Data Firehose**, **Data Analytics → Managed Service for Apache Flink**.

Die Mechanik von Streams/Firehose steckt im Integration-Batch (B7); hier die **Analytics-Einordnung**: wie Ingestion, Delivery und Processing zusammenspielen und wann welches.

---

## 🎯 SAA-Vertiefung

### Die drei Rollen: Ingestion, Delivery, Processing

**Das Problem:** „Streaming-Daten verarbeiten" ist unspezifisch — je nachdem, ob man puffern, ausliefern oder in Echtzeit analysieren will, ist ein anderer Kinesis-Dienst richtig.

**Die Lösung — die drei Rollen sauber getrennt:**
- **Kinesis Data Streams = Ingestion/Puffer**: Daten strömen in **Shards**, stehen in Echtzeit für **mehrere** eigene Consumer bereit, **Replay** möglich. „Echtzeit + eigene Logik + mehrere Consumer + Replay" → Data Streams.
- **Amazon Data Firehose = Delivery/Load**: nimmt den Strom und liefert ihn **ohne Code** near-real-time nach **S3/Redshift/OpenSearch/Splunk** (optional Lambda-Transform, z. B. nach Parquet). „einfachste Lösung, Streaming-Daten irgendwo zu speichern" → Firehose. Kein Replay.
- **Managed Service for Apache Flink = Processing**: **SQL/Flink** auf dem laufenden Strom — Windows, Aggregationen, Anomalien in Echtzeit, exactly-once, durable state. „Echtzeit-Aggregation/Windowing auf dem Stream" → Managed Flink.

Der Klassiker als Kette: Data Streams (Ingestion) → Managed Flink (Processing) → Firehose (Delivery nach S3/OpenSearch).

> **💡 Merksatz:** **Data Streams = Ingestion/Puffer (Shards, Replay, mehrere Consumer)** · **Firehose = codelose Delivery (S3/Redshift/OpenSearch, kein Replay)** · **Managed Flink = Echtzeit-Processing (Windows/SQL/Flink)**.

### Das Log-Analytics-Traumpaar und die Betrugserkennung

**Zwei prüfungstypische Muster:**
- **Echtzeit-Log-Analytics**: Anwendungen loggen → **Firehose** sammelt und schiebt automatisch nach **OpenSearch** → Team durchsucht live. Das ist das „Traumpaar" Firehose → OpenSearch — Signalwort „Streaming-Logs ohne Code nach OpenSearch/S3" → Firehose.
- **Betrugserkennung**: Kartenzahlungen → **Data Streams** → Lambda/Flink prüft jedes Event in Millisekunden gegen Muster → verdächtige Transaktion sofort blockiert; parallel schiebt **Firehose** alles zur Archivierung nach S3, wo **Athena** später auswertet. Echtzeit und Batch Hand in Hand.

Die SQS-Abgrenzung bleibt wichtig: **SQS = Briefkasten zum Entkoppeln** (1 Consumer, delete-after-read), **Kinesis = Wasserleitung** (Streaming, mehrere Consumer, Replay).

> **💡 Merksatz:** **Firehose → OpenSearch** = Echtzeit-Log-Analytics (kein Code). **Data Streams + Lambda/Flink** = Echtzeit-Reaktion (Betrug). **SQS (Entkopplung) ≠ Kinesis (Streaming/Replay)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Data Streams** = Ingestion (Shards, mehrere Consumer, Replay); **Firehose** = codelose Delivery (S3/Redshift/OpenSearch, kein Replay); **Managed Flink** = Echtzeit-Processing (Windows/SQL/Flink).
- 🛑 Namen: **Firehose → Amazon Data Firehose**, **Data Analytics → Managed Service for Apache Flink**; **Kinesis Data Analytics for SQL** wird 27.01.2026 eingestellt.
- Traumpaar **Firehose → OpenSearch** (Log-Analytics); **Data Streams + Lambda** (Echtzeit-Reaktion).
- **SQS (Entkopplung, 1 Consumer) ≠ Kinesis (Streaming, mehrere Consumer, Replay)**.
- „einfachstes Laden nach S3, kein Code" → Firehose; „eigene Echtzeit-Logik" → Data Streams; „Windowing/SQL auf Stream" → Managed Flink.

## 💡 Der eine Satz zum Mitnehmen

**Die Kinesis-Familie teilt sich in Ingestion (Data Streams), codelose Delivery (Firehose) und Echtzeit-Processing (Managed Flink) — Firehose→OpenSearch ist das Log-Analytics-Traumpaar, Data Streams+Lambda die Echtzeit-Reaktion, und gegenüber SQS gilt immer: Streaming und Replay heißt Kinesis.**
