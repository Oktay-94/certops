---
service: Amazon Neptune
seedKey: saa-c03-script-neptune
batch: B2
domains: [D3]
sourceRef:
  - https://aws.amazon.com/neptune/features/
  - https://docs.aws.amazon.com/neptune/latest/userguide/intro.html
status: draft
---

# Amazon Neptune

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Neptune = die **managed Graphdatenbank**: Knoten und Kanten statt Tabellen — die *Beziehungen* zwischen Daten stehen im Zentrum. Use Cases: Social Graphs, Betrugserkennung, Empfehlungen, Knowledge Graphs. Signalwörter: „highly connected data", „relationships".

Der SAA vertieft: **Warum scheitern relationale DBs an Beziehungsfragen, welche zwei Graph-Welten spricht Neptune — und wann ist der Graph selbst der Overkill-Distraktor?**

---

## 🎯 SAA-Vertiefung

### Warum SQL an „Freunde von Freunden" erstickt

**Das Problem:** „Zeige alle Konten, die über gemeinsame Geräte, Zahlungsmethoden oder Adressen mit einem bekannten Betrüger verbunden sind — über bis zu vier Ecken, in Echtzeit." In einer relationalen DB wird daraus ein Ungetüm aus **selbst-verknüpfenden JOINs**, das mit jeder „Ecke" exponentiell teurer wird. Bei Hop 3 raucht der Query-Planner, bei Hop 4 das Budget.

**Die Lösung:** In einer **Graphdatenbank** sind Beziehungen keine berechneten JOINs, sondern **gespeicherte Kanten** — das Traversieren („folge den Kanten") kostet pro Hop fast nichts. Neptune ist genau dafür gebaut: Milliarden Beziehungen, Traversierung in Millisekunden, über 100.000 Queries/s.

Die klassischen Erkennungsmuster im Szenario-Text:
- **Fraud Detection:** Betrugsringe über geteilte Attribute finden — DER Neptune-Use-Case.
- **Empfehlungen:** „Kunden, die X kauften und Y folgen, mögen Z."
- **Social Graph / Knowledge Graph / Netzwerk-Topologie:** überall, wo die Verbindung die eigentliche Information ist.

> **💡 Merksatz:** Mehrstufige Beziehungsfragen („Freunde von Freunden", Betrugsringe) = **rekursive-JOIN-Hölle in SQL** → **Neptune**. Die Kante ist gespeichert, nicht berechnet.

### Zwei Graph-Welten, drei Sprachen

**Das Problem:** „Graph" ist nicht gleich „Graph" — und die Prüfung streut die Fachbegriffe als Zuordnungstest.

**Die Lösung:** Neptune spricht **beide** etablierten Modelle:
- **Property Graph** — Knoten/Kanten mit Eigenschaften, abgefragt per **Gremlin** (Apache TinkerPop) oder **openCypher**. Die Wahl für App-Entwicklung (Fraud, Social, Recommendations).
- **RDF (Triple Store)** — Subjekt-Prädikat-Objekt-Tripel, abgefragt per **SPARQL**. Die Wahl für semantische **Knowledge Graphs** und Standards-getriebene Datenintegration.

Ein Cluster kann beide Modelle *speichern*, aber die Welten mischen sich nicht: Gremlin läuft nicht über RDF-Daten und umgekehrt. Fürs Erkennen reicht: **SPARQL/RDF/Triple** im Text → RDF-Welt; **Gremlin/openCypher** → Property Graph — beides landet bei Neptune.

Unter der Haube gilt die vertraute Aurora-DNA: verteilter Storage 6-fach über 3 AZs (bis 128 TiB), **bis 15 Read Replicas**, Failover per Replica-Beförderung, ACID. Dazu **Neptune Serverless** (NCUs) für schwankende Last und **Global Database** (bis 5 Sekundär-Regionen). 🛑 Randnotiz: **Neptune Analytics** ist ein *separater* In-Memory-Dienst für Graph-Algorithmen (PageRank, Community Detection) — nicht mit der Neptune-Datenbank verwechseln.

> **💡 Merksatz:** **Gremlin/openCypher = Property Graph**, **SPARQL = RDF** — beide heißen Neptune. Architektur = Aurora-Muster (15 Replicas, Serverless, Global).

### Wann der Graph der Distraktor ist

**Das Problem:** Nicht jede Beziehung braucht eine Graphdatenbank — und die Prüfung testet auch die Gegenrichtung.

**Die Lösung:** Ein simples „Nutzer hat Bestellungen" (1:n, ein Hop) ist mit RDS oder DynamoDB bestens bedient — Neptune wäre hier der **Overkill-Distraktor**. Der Graph gewinnt erst, wenn **mehrstufige Traversierung** oder **Beziehungs-Analytik** gefordert ist. Umgekehrt sind Redshift (Batch-OLAP, keine Traversierung) und OpenSearch (Volltextsuche, keine Semantik) die falschen Nachbarn, wenn das Szenario nach Echtzeit-Beziehungsabfragen ruft.

> **💡 Merksatz:** Ein Hop → RDS/DynamoDB reicht. Viele Hops in Echtzeit → Neptune. Batch-Aggregation → Redshift. Volltext → OpenSearch.

---

## ⚠️ Prüfungs-Knackpunkte

- Betrugsringe, Empfehlungen, Social/Knowledge Graphs, mehrstufige Traversierung → **Neptune** (SQL-JOINs skalieren dort nicht).
- **Gremlin/openCypher** = Property Graph; **SPARQL** = RDF — ein Cluster, getrennte Welten.
- Aurora-DNA: 6-fach/3 AZs, bis **15 Read Replicas**, Failover via Replica; **Serverless** und **Global Database** vorhanden.
- 🛑 **Neptune Analytics** = separater Analytics-Dienst (Randnotiz, nicht die DB).
- Einfache 1:n-Beziehungen → RDS/DynamoDB (Neptune = Overkill-Distraktor); Batch-Analytik → Redshift; Suche → OpenSearch.

## 💡 Der eine Satz zum Mitnehmen

**Neptune gewinnt, sobald die Frage den Kanten folgt statt den Zeilen** — mehrstufige Beziehungen in Echtzeit sind sein Revier, und die Sprach-Signalwörter (Gremlin, openCypher, SPARQL) zeigen in der Prüfung wie Leuchtpfeile auf ihn.
