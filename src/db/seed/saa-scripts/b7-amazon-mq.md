---
service: Amazon MQ
seedKey: saa-c03-script-amazon-mq
batch: B7
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/welcome.html
  - https://docs.aws.amazon.com/amazon-mq/latest/developer-guide/active-standby-broker-deployment.html
status: draft
---

# Amazon MQ

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Amazon MQ = der **verwaltete klassische Briefkasten** für Apps, die bereits einen Standard-Message-Broker sprechen. Managed **ActiveMQ / RabbitMQ** mit Industrie-Protokollen (**JMS, AMQP, MQTT, STOMP, OpenWire**). Kernfall: bestehende App **1:1 migrieren, ohne Umschreiben**. Merksatz: **Neue App in AWS → SQS/SNS. Alte App mit ActiveMQ/RabbitMQ ohne Umbau migrieren → Amazon MQ.**

Der SAA vertieft: **das Migrations-Kriterium, die HA-Deployments — und die klare Abgrenzung zu SQS/SNS.**

---

## 🎯 SAA-Vertiefung

### Das Migrations-Kriterium: Protokoll-Kompatibilität

**Das Problem:** Ein Unternehmen zieht eine langjährige Java-Enterprise-App nach AWS. Sie kommuniziert über **JMS** mit einem ActiveMQ-Broker. SQS/SNS wären moderner — aber die App spricht deren proprietäre APIs nicht, und ein Umschreiben ist im Lift-and-Shift weder geplant noch budgetiert.

**Die Lösung:** **Amazon MQ** betreibt die **echte, vertraute Broker-Software** (ActiveMQ oder RabbitMQ) als Managed Service. Die App zieht **fast unverändert** um — nur die Broker-Adresse ändert sich —, weil MQ die Industrie-Standard-Protokolle (**JMS, AMQP, MQTT, STOMP, OpenWire, WebSocket**) direkt spricht. Das ist das eindeutige Signalwort-Muster: „**ActiveMQ / RabbitMQ**", „**Standard-Protokolle (JMS/AMQP/MQTT/STOMP)**", „**bestehenden Broker migrieren ohne die Anwendung umzuschreiben**" → Amazon MQ. Es ist dasselbe Muster wie Keyspaces↔DynamoDB oder DocumentDB↔MongoDB: „bestehende Open-Source-/Standard-Technik behalten" → der kompatible Managed Service.

> **💡 Merksatz:** **ActiveMQ/RabbitMQ + Standard-Protokolle (JMS/AMQP/MQTT/STOMP) + Migration ohne Umschreiben → Amazon MQ.** Managed Broker mit echter Broker-Software.

### Hochverfügbarkeit: Active/Standby und Cluster

**Das Problem:** Der migrierte Broker darf kein Single Point of Failure sein — fällt eine AZ aus, muss das Messaging weiterlaufen.

**Die Lösung — je nach Engine:**
- **ActiveMQ**: **Single-Instance** (ein Broker, eine AZ — nicht HA) oder **Active/Standby** (ein redundantes Broker-Paar über **zwei AZs** mit gemeinsamem Amazon EFS; automatischer Failover in Sekunden).
- **RabbitMQ**: Single-Instance oder **Cluster Deployment** (drei Broker-Nodes über AZs).

Der Reflex: „hochverfügbarer Broker" → **Active/Standby** (ActiveMQ) bzw. **Cluster** (RabbitMQ); Single-Instance nur für Dev/Test. Das ist dieselbe AZ-Verteilungslogik wie bei RDS Multi-AZ.

> **💡 Merksatz:** HA: **ActiveMQ = Active/Standby über 2 AZs** (EFS, Sekunden-Failover); **RabbitMQ = Cluster (3 Nodes)**. Single-Instance = kein HA (nur Dev/Test).

### Die Abgrenzung zu SQS/SNS

**Das Problem:** MQ, SQS und SNS sind alle „Messaging". Wann welches?

**Die Lösung:** Die Frage ist **neu vs. bestehend**:
- **SQS/SNS** = cloud-native, AWS-proprietär, **nahezu unbegrenzt skalierbar**, serverlos — erste Wahl für **neue** Anwendungen.
- **Amazon MQ** = für **bestehende** Apps mit klassischem Broker/Standard-Protokollen, die **ohne Code-Umbau** migrieren sollen — nicht für neue Cloud-native-Designs.

Distraktoren in MQ-Fragen sind darum immer „SQS/SNS nutzen" (würde Umschreiben erfordern) und „selbstverwalteter Broker auf EC2" (Betriebsaufwand, den MQ gerade abnimmt). Umgekehrt ist in „neue Anwendung"-Fragen MQ der Distraktor — es skaliert nicht so grenzenlos wie SQS und bringt Broker-Verwaltungsmodell mit.

> **💡 Merksatz:** **Neu & cloud-native → SQS/SNS** (unbegrenzt skalierbar). **Bestehende Broker-App migrieren → Amazon MQ.** Selbstverwalteter Broker auf EC2 = unnötiger Aufwand.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: **ActiveMQ/RabbitMQ, JMS/AMQP/MQTT/STOMP/OpenWire, bestehenden Broker migrieren ohne Umschreiben** → Amazon MQ.
- HA: **ActiveMQ Active/Standby (2 AZs, EFS)**; **RabbitMQ Cluster (3 Nodes)**; Single-Instance = kein HA.
- Abgrenzung: **SQS/SNS (neu, cloud-native, unbegrenzt) vs. Amazon MQ (bestehend, Standard-Protokolle, Migration)**.
- Distraktoren: SQS/SNS (Umschreiben nötig), selbstverwalteter Broker auf EC2 (Betriebsaufwand).
- Muster wie Keyspaces↔DynamoDB / DocumentDB↔MongoDB: kompatibler Managed Service für bestehende Technik.

## 💡 Der eine Satz zum Mitnehmen

**Amazon MQ ist die Lift-and-Shift-Antwort fürs Messaging: Wenn eine bestehende App bereits ActiveMQ/RabbitMQ mit Standard-Protokollen spricht und ohne Umschreiben in die Cloud soll, ist MQ richtig — für neue, grenzenlos skalierbare Cloud-Designs bleiben SQS/SNS erste Wahl.**
