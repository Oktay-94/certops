---
service: Amazon MSK (Managed Streaming for Apache Kafka)
seedKey: saa-c03-script-msk
batch: B8
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/msk/latest/developerguide/what-is-msk.html
  - https://aws.amazon.com/msk/faqs/
status: draft
---

# Amazon MSK (Managed Streaming for Apache Kafka)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> MSK = **echtes Apache Kafka als vollständig verwalteter Dienst**. Kafka ist der Industriestandard fürs Streaming, aber selbst betrieben berüchtigt komplex. MSK betreibt die Broker, es bleibt originales Kafka mit gewohnten APIs — bestehende Kafka-Apps laufen **ohne Umbau**. Killer-Frage wie MQ vs. SQS/SNS: **Neues Streaming-Projekt → Kinesis. Bestehende Kafka-App / „Kafka" gefordert → MSK.**

Der SAA vertieft: **die Kinesis-Abgrenzung mit Kriterien, MSK Serverless — und das Muster „bestehende Open-Source-Technik behalten".**

---

## 🎯 SAA-Vertiefung

### Kafka behalten statt umschreiben

**Das Problem:** Ein Unternehmen betreibt on-prem seit Jahren Kafka mit dutzenden Producern/Consumern und will in die Cloud — aber die Apps sprechen die Kafka-API, nicht Kinesis. Ein Umschreiben aller Clients ist weder geplant noch bezahlbar.

**Die Lösung:** **MSK** ist **echtes Kafka**: dieselben APIs, dasselbe Ökosystem (Kafka Connect, Schema Registry, MirrorMaker), dieselben Client-Bibliotheken. Die Apps ziehen **ohne Code-Umbau** um — nur die Broker-Adresse (Bootstrap-Server) ändert sich. AWS übernimmt Broker-Provisioning, Patching, Skalierung und Monitoring. Das ist das eindeutige Signalwort-Muster: „**Apache Kafka**", „**bestehende Kafka-Anwendung**", „**verwaltetes Kafka**" → MSK. Das Wort „Kafka" in der Frage zeigt fast immer auf MSK — nicht auf Kinesis.

> **💡 Merksatz:** **MSK = echtes Kafka managed** — bestehende Kafka-Apps laufen ohne Umbau (nur Bootstrap-Adresse ändert sich). „Kafka" im Fragetext → MSK.

### MSK vs. Kinesis: Dasselbe Muster wie MQ vs. SQS

**Das Problem:** MSK und Kinesis Data Streams machen beide „Streaming". Wann welches?

**Die Lösung:** Die Frage ist **bestehende Technik vs. cloud-native neu** — exakt das Muster von Amazon MQ vs. SQS/SNS und Keyspaces vs. DynamoDB:
- **Kinesis Data Streams** = die **cloud-native AWS-Eigenlösung**, serverless-nah, tief in AWS integriert, minimaler Betrieb — erste Wahl für **neue** Streaming-Projekte.
- **MSK** = wenn **bereits Kafka** genutzt wird oder Kafka-spezifische Features/Ökosystem explizit gefordert sind und man **ohne Umschreiben** migrieren will.

Zusätzlich gibt es **MSK Serverless** — Kafka ohne Kapazitätsplanung, das automatisch skaliert; für variable Workloads ohne Broker-Dimensionierung. Reflex: „neu, AWS-nativ, einfach" → Kinesis; „Kafka behalten/migrieren" → MSK.

> **💡 Merksatz:** **Neu & cloud-native → Kinesis; bestehendes Kafka / „Kafka" gefordert → MSK.** Gleiches Muster wie MQ↔SQS und Keyspaces↔DynamoDB. **MSK Serverless** für variable Last ohne Dimensionierung.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: **„Apache Kafka", „bestehende Kafka-App", „verwaltetes Kafka" → MSK**.
- **MSK = echtes Kafka** (APIs/Ökosystem), Migration ohne Code-Umbau.
- Abgrenzung: **Kinesis (neu, cloud-native) vs. MSK (bestehendes Kafka)** — Muster wie MQ↔SQS/SNS, Keyspaces↔DynamoDB.
- **MSK Serverless** für variable Workloads ohne Kapazitätsplanung.
- „Kafka" im Fragetext → fast immer MSK, nicht Kinesis.

## 💡 Der eine Satz zum Mitnehmen

**MSK ist echtes Kafka als Managed Service — die Antwort, sobald „Kafka" oder eine bestehende Kafka-Anwendung im Szenario steht; für neue, cloud-native Streaming-Projekte bleibt Kinesis erste Wahl, nach demselben Muster wie MQ gegen SQS.**
