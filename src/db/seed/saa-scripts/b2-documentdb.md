---
service: Amazon DocumentDB
seedKey: saa-c03-script-documentdb
batch: B2
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/documentdb/latest/devguide/compatibility.html
  - https://docs.aws.amazon.com/documentdb/latest/devguide/docdb-using-elastic-clusters.html
status: draft
---

# Amazon DocumentDB

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> DocumentDB = die **managed Dokumenten-Datenbank mit MongoDB-Anschluss**: JSON-Dokumente, angesprochen mit bestehenden MongoDB-Treibern und -Tools. AWS betreibt, repliziert über drei AZs, skaliert Compute und Storage getrennt. Signalwort: „**MongoDB** migrieren".

Der SAA vertieft: **Warum sieht DocumentDB unter der Haube aus wie Aurora, wie geht global und wie geht riesig — und wann ist trotz „NoSQL mit JSON" DynamoDB die richtige Antwort?**

---

## 🎯 SAA-Vertiefung

### Aurora-DNA: Dieselbe Architektur, anderes Protokoll

**Das Problem:** Ein Unternehmen betreibt MongoDB selbst auf EC2 — Patching, Replica Sets, Backups, Skalierung, alles Handarbeit. Die App soll **nicht** umgeschrieben werden, aber der Betrieb soll weg.

**Die Lösung:** **DocumentDB** ist im Kern „Aurora für Dokumente": derselbe Bauplan mit **getrenntem, verteiltem Storage-Layer** (bis 128 TiB, über 3 AZs repliziert) und Compute-Instanzen obendrauf — **bis 15 Read Replicas** mit Reader Endpoint, Failover durch Replica-Beförderung. Nach außen spricht es das **MongoDB-Wire-Protokoll** (Versionen 3.6/4.0/5.0, neu auch 8.0): Treiber, Shell und Tools funktionieren weiter, die App zieht per Connection-String um (Datenmigration: DMS).

Eine ehrliche Fußnote, die als Distraktor auftaucht: DocumentDB ist **API-kompatibel, kein echtes MongoDB** — einzelne exotische MongoDB-Features fehlen. Für die Prüfung gilt trotzdem: „MongoDB-Workload nach AWS, managed" → DocumentDB.

> **💡 Merksatz:** DocumentDB = **Aurora-Architektur + MongoDB-API**: 6-fach-Storage-Denke, 15 Replicas, Reader Endpoint — nur das Protokoll ist ein anderes.

### Global und riesig: Die zwei Ausbaustufen

**Das Problem 1 — Geografie:** Nutzer weltweit, DR-Pflicht über Regionen.
**Die Lösung:** **Global Clusters** — das Pendant zu Aurora Global Database: eine Primär-Region, bis zu **5 Sekundär-Regionen** für lokale Reads, Recovery aus einem Regionsausfall in **unter 60 Sekunden**.

**Das Problem 2 — Schiere Masse:** Die Write-Last sprengt, was ein einzelner Writer schafft.
**Die Lösung:** **Elastic Clusters** — managed **Sharding**: Millionen Reads/Writes pro Sekunde, Petabyte-Speicher, ohne dass jemand Shard-Keys auf EC2-Clustern jongliert. Merke die Richtung: Mehr **Reads** → Replicas; mehr **Writes** → Sharding (Elastic Clusters). Dazu gibt es eine **Serverless**-Option für schwankende Last.

> **💡 Merksatz:** Global lesen + Region-DR → **Global Clusters** (< 60 s Recovery). Write-Skalierung über den einzelnen Writer hinaus → **Elastic Clusters (Sharding)**.

### Die Kernabgrenzung: MongoDB-Anschluss oder AWS-nativ?

Die eigentliche Prüfungsfrage ist fast nie „Was kann DocumentDB?", sondern „**DocumentDB oder DynamoDB?**" — und der Entscheider ist ein einziges Wort:

- Steht **„MongoDB"** (Treiber, API, bestehende App) im Szenario → **DocumentDB**. Punkt.
- Greenfield-NoSQL ohne MongoDB-Vorgabe, serverless, extreme Skalierung, AWS-Integration (Streams, DAX, Global Tables) → **DynamoDB**.
- Kleines JSON in relationaler Welt → PostgreSQL mit JSONB ist der leise Distraktor — richtig nur, wenn das Szenario ausdrücklich relational bleibt.

> **💡 Merksatz:** Das Wort **„MongoDB" ist der Schalter**: steht es da → DocumentDB; fehlt es → DynamoDB ist fast immer die bessere NoSQL-Antwort.

---

## ⚠️ Prüfungs-Knackpunkte

- Self-managed MongoDB → managed, App unverändert → **DocumentDB** (+ DMS für die Daten).
- Architektur wie Aurora: getrennter Storage (128 TiB, 3 AZs), **bis 15 Read Replicas**, Reader Endpoint, Failover = Replica-Beförderung.
- Global + DR → **Global Clusters** (bis 5 Sekundär-Regionen, Recovery < 60 s).
- Write-/Größen-Skalierung → **Elastic Clusters (Sharding)**; Reads → Replicas.
- API-kompatibel ≠ echtes MongoDB (Feature-Lücken als Distraktor-Material).
- Ohne MongoDB-Anforderung → **DynamoDB**; JSON in relational → PostgreSQL JSONB (nur bei explizit relationalem Kontext).

## 💡 Der eine Satz zum Mitnehmen

**DocumentDB ist Aurora mit MongoDB-Stecker** — es gewinnt genau die Szenarien, in denen das Wort „MongoDB" fällt und der Betrieb verschwinden soll; fällt das Wort nicht, gehört der Punkt meist DynamoDB.
