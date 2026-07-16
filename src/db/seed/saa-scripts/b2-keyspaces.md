---
service: Amazon Keyspaces (for Apache Cassandra)
seedKey: saa-c03-script-keyspaces
batch: B2
domains: [D2, D3]
sourceRef:
  - https://aws.amazon.com/keyspaces/features/
  - https://docs.aws.amazon.com/keyspaces/latest/devguide/multiRegion-replication_how-it-works.html
status: draft
---

# Amazon Keyspaces

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Keyspaces = **managed Apache Cassandra**: Die App spricht weiter **CQL** mit ihren gewohnten Cassandra-Treibern — aber statt eines selbst betriebenen Clusters antwortet ein serverloser AWS-Dienst. Abgrenzung: DynamoDB für AWS-natives NoSQL, Keyspaces wenn **Cassandra** gefordert ist.

Der SAA vertieft: **Was genau nimmt Keyspaces dem Cassandra-Betreiber ab, wie funktioniert multi-region — und an welchem einen Wort entscheidet sich Keyspaces vs. DynamoDB?**

---

## 🎯 SAA-Vertiefung

### Der Cluster, der keiner mehr sein will

**Das Problem:** Ein selbst betriebener Cassandra-Cluster ist ein Vollzeitjob: Nodes dimensionieren und patchen, **Compaction**-Läufe babysitten, Replikationsfaktoren planen, kaputte Nodes ersetzen, Kapazität Monate im Voraus raten. Die App selbst ist zufrieden — sie will nur weiter CQL sprechen.

**Die Lösung:** **Amazon Keyspaces** ersetzt den Cluster durch einen **serverlosen** Endpunkt: gleiche CQL-Queries, gleiche Treiber — aber keine Nodes, kein Patching, keine Compaction. Kapazität kommt in den zwei bekannten Modi (**on-demand** und **provisioned** — bewusst dieselbe Denke wie DynamoDB), Durchsatz und Speicher skalieren praktisch unbegrenzt, Daten liegen 3-fach über AZs repliziert, Antwortzeiten single-digit-ms, SLA 99,99 % pro Region. Auch die Familien-Features spiegeln DynamoDB: **PITR bis 35 Tage**, TTL, CDC-Streams.

Das Migrationsmuster ist entsprechend unspektakulär (und genau deshalb die richtige Antwort): Connection-String tauschen, Daten überspielen — die App merkt idealerweise nichts.

> **💡 Merksatz:** Keyspaces = **Cassandra ohne Cluster**: CQL und Treiber bleiben, Betrieb verschwindet, Kapazitätsdenke wie DynamoDB (on-demand/provisioned, PITR 35 Tage).

### Multi-Region: Active-Active mit Cassandra-Genen

**Das Problem:** Die Cassandra-App läuft global — Writes sollen in **jeder** Region lokal landen, nicht erst um die halbe Welt reisen.

**Die Lösung:** **Keyspaces Multi-Region Replication** ist **active-active**: Jede Region liest *und* schreibt lokal (Writes mit LOCAL_QUORUM), die Replikation läuft typisch **unter einer Sekunde**, und Konflikte löst — wie bei DynamoDB Global Tables — **Last Writer Wins** (auf Zell-Ebene per Timestamp). Verfügbarkeit steigt damit auf bis zu 99,999 %.

Damit steht das Trio für globale Schreib-Szenarien: **Aurora Global** (relational, **eine** Writer-Region), **DynamoDB Global Tables** (NoSQL, multi-aktiv), **Keyspaces Multi-Region** (Cassandra, multi-aktiv). Das Szenario verrät mit einem Wort, welches gemeint ist.

> **💡 Merksatz:** Global schreiben + **Cassandra/CQL** im Text → **Keyspaces Multi-Region** (active-active, LWW, < 1 s). Ohne Cassandra-Wort → DynamoDB Global Tables; relational → Aurora Global.

### Das eine Wort, das alles entscheidet

Die eigentliche Prüfungsfrage ist die Abgrenzung — und sie folgt demselben Muster wie überall in der „managed Open-Source"-Familie (MSK ↔ Kinesis, Amazon MQ ↔ SQS):

- Steht **„Cassandra"** oder **„CQL"** im Szenario (bestehender Cluster, bestehende App, Migrationswunsch) → **Keyspaces**. Die Schnittstelle bleibt, der Betrieb geht.
- **Greenfield** ohne Cassandra-Vorgabe → **DynamoDB**: tiefere AWS-Integration (Streams → Lambda, DAX, Global Tables inkl. MRSC) und das größere Ökosystem.
- Cassandra auf EC2 weiterbetreiben = der „Betrieb bleibt dein Problem"-Distraktor; DocumentDB = falsche API (Mongo, nicht Cassandra).

> **💡 Merksatz:** Wie bei MSK und MQ gilt: **Bestehende Open-Source-Schnittstelle behalten → der kompatible Managed Service (Keyspaces). Keine Vorgabe → das AWS-native Original (DynamoDB).**

---

## ⚠️ Prüfungs-Knackpunkte

- Self-managed Cassandra (Compaction, Patching, Kapazitätsraten) → **Keyspaces**: CQL/Treiber unverändert, serverless.
- Kapazität on-demand/provisioned, 3-fach über AZs, single-digit-ms, **PITR 35 Tage**, TTL, Streams — bewusste DynamoDB-Parallelen.
- Global + Cassandra → **Multi-Region Replication**: active-active, LOCAL_QUORUM, Lag < 1 s, **Last Writer Wins**.
- Abgrenzungs-Trio: relational-global → Aurora Global (1 Writer) · NoSQL ohne Vorgabe → DynamoDB Global Tables · Cassandra → Keyspaces.
- Greenfield ohne Cassandra-Wort → **DynamoDB** (Keyspaces wäre der Distraktor).

## 💡 Der eine Satz zum Mitnehmen

**Keyspaces ist die Antwort, wenn „Cassandra" oder „CQL" im Szenario steht und der Cluster-Betrieb verschwinden soll** — fehlt das Wort, gehört der Punkt DynamoDB; das ist dieselbe Schnittstellen-Logik wie bei MSK und Amazon MQ.
