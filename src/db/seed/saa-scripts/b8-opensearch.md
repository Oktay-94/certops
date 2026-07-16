---
service: Amazon OpenSearch Service
seedKey: saa-c03-script-opensearch
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html
  - https://docs.aws.amazon.com/opensearch-service/latest/developerguide/ultrawarm.html
  - https://docs.aws.amazon.com/opensearch-service/latest/developerguide/cold-storage.html
status: draft
---

# Amazon OpenSearch Service

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> OpenSearch = die **Google-Suchmaschine für eigene Logs und Texte** (Abspaltung von Elasticsearch — alter Name „Amazon Elasticsearch Service" taucht in Fragen auf). **Volltextsuche in Millisekunden** über indexierte Daten, **Log-Analyse in Echtzeit** (Haupteinsatz), **OpenSearch Dashboards** (ex Kibana) zur Visualisierung. Traumpaar: **Kinesis Firehose → OpenSearch**. Abgrenzung: **Athena = Ad-hoc-SQL auf ruhenden S3-Dateien; OpenSearch = Suchindex für Dauersuche + Live-Dashboards**.

Der SAA vertieft: **die Storage-Tiers zur Log-Kostenoptimierung, ISM, Serverless — und die Athena-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Storage-Tiers: Log-Retention bezahlbar machen

**Das Problem:** Logs sollen ein Jahr durchsuchbar bleiben — aber alles im schnellen Hot-Storage zu halten, wird bei Terabytes pro Woche unbezahlbar. Löschen verletzt Compliance, und Glacier ist nicht durchsuchbar.

**Die Lösung:** OpenSearch hat **drei Storage-Tiers**, die genau dieses Retention-Kostenproblem lösen:
- **Hot** (Instance Store / EBS): schnellste Performance für aktive Indizes und Schreiben — für aktuelle Logs.
- **UltraWarm** (S3 + Caching): **read-only**, ideal für **immutable Logs**, die durchsucht, aber nicht mehr geändert werden; deutlich günstiger, weil nur primäre Shards zählen (kein Replica-Overhead).
- **Cold** (S3, kein Compute): geringste Kosten; Indizes sind detached und werden beim Abfragen kurz zurück-attached — für selten gebrauchte Alt-Logs, die durchsuchbar bleiben müssen.

Der Reflex: „Logs lange **durchsuchbar** halten, aber günstig" → **UltraWarm/Cold** (nicht alles Hot, nicht Glacier). Das ist der zentrale Kostenhebel des Dienstes.

> **💡 Merksatz:** **Hot** (schnell, aktiv) → **UltraWarm** (S3, read-only, immutable Logs) → **Cold** (S3, kein Compute, selten). „Logs lange durchsuchbar + günstig" → UltraWarm/Cold, nicht alles Hot.

### ISM und Serverless

**Das Problem:** Die Verschiebung von Hot nach UltraWarm nach Cold und das spätere Löschen von Hand zu machen, ist fehleranfällig.

**Die Lösung:** **Index State Management (ISM)** automatisiert den **Lifecycle**: Policies verschieben Indizes nach Alter automatisch **Hot → UltraWarm → Cold → Delete**. So bleibt die Retention-Strategie günstig, ohne manuelles Eingreifen. Für Teams, die gar keine Kapazität planen wollen, gibt es **OpenSearch Serverless** (Collections für Time-series/Search/Vector, Abrechnung in **OCUs**) — es skaliert Indexing und Search automatisch; kürzere Retention = weniger OCUs = weniger Kosten.

> **💡 Merksatz:** **ISM** automatisiert Hot→UltraWarm→Cold→Delete nach Alter. **OpenSearch Serverless** (OCUs) für Betrieb ohne Kapazitätsplanung.

### Die Athena-Abgrenzung — beide „durchsuchen"

**Das Problem:** Athena und OpenSearch klingen beide nach „Daten durchsuchen". Wann welches?

**Die Lösung:** Der Unterschied ist **Ad-hoc auf Dateien vs. Suchindex**:
- **Athena**: SQL **ad-hoc** auf Dateien in S3 — Daten bleiben liegen, keine Vorbereitung, ideal für gelegentliche Analysen und Aggregationen.
- **OpenSearch**: Daten werden in einen **Suchindex geladen** → blitzschnelle **Volltextsuche**, unscharfe Suche, Relevanz-Ranking und **Live-Dashboards** über kontinuierlich einströmende Logs.

Der Merksatz: **Athena = Detektivin, die bei Bedarf den Aktenschrank durchliest; OpenSearch = Bibliothek mit fertigem Stichwortverzeichnis, die jede Frage sofort beantwortet.** „Volltextsuche / Log-Dashboards / Elasticsearch" → OpenSearch; „gelegentliche SQL-Aggregation auf S3" → Athena.

> **💡 Merksatz:** **Athena** = Ad-hoc-SQL auf ruhenden S3-Dateien. **OpenSearch** = Suchindex für Volltextsuche + Live-Log-Dashboards. „Elasticsearch/Volltextsuche/Log-Dashboard" → OpenSearch.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Volltextsuche", „Logs durchsuchen/analysieren", „Suchmaschine", **„Elasticsearch"** → OpenSearch.
- Storage-Tiers: **Hot** (schnell) · **UltraWarm** (S3, read-only, immutable) · **Cold** (S3, kein Compute) — Kostenhebel für Log-Retention.
- **ISM** automatisiert Lifecycle Hot→UltraWarm→Cold→Delete; **Serverless** (OCUs) ohne Kapazitätsplanung.
- Abgrenzung: **Athena (Ad-hoc-SQL auf S3) vs. OpenSearch (Suchindex, Volltext, Dashboards)**.
- Traumpaar: **Kinesis Firehose → OpenSearch** (Echtzeit-Log-Analytics).

## 💡 Der eine Satz zum Mitnehmen

**OpenSearch ist die Suchmaschine für Logs und Texte mit Live-Dashboards — die Storage-Tiers Hot/UltraWarm/Cold plus ISM machen lange Log-Retention bezahlbar, und gegenüber Athena gilt: Volltextsuche und Dashboards heißen OpenSearch, gelegentliche SQL-Aggregation heißt Athena.**
