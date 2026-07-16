---
service: Amazon EMR
seedKey: saa-c03-script-emr
batch: B8
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/emr/latest/ManagementGuide/emr-what-is-emr.html
  - https://aws.amazon.com/emr/faqs/
  - https://docs.aws.amazon.com/emr/latest/EMR-on-EKS-DevelopmentGuide/emr-eks.html
status: draft
---

# Amazon EMR

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> EMR = das **gemietete Großkraftwerk für Big-Data** mit Hadoop und Spark (dazu Hive, Presto, HBase). Verwaltete Plattform: „Ich brauche einen Spark-Cluster mit 50 Knoten" → Minuten später steht er. Elastisch; der **Spar-Trick: Spot-Instanzen** (bis 90 % Rabatt), Cluster nach dem Job abschalten. Signalwort: **„Hadoop"/„Spark" → EMR, hundertprozentig.** Abgrenzung: **Glue = ETL ohne Infrastruktur-Nachdenken, EMR = volles Big-Data-Kraftwerk**.

Der SAA vertieft: **die drei Deployment-Modelle, die Knoten-Typen mit Spot-Strategie — und die TCO-Entscheidung EMR vs. Serverless.**

---

## 🎯 SAA-Vertiefung

### Drei Deployment-Modelle: EC2 vs. Serverless vs. EKS

**Das Problem:** Ein Team hat unregelmäßige, bursty Spark-Jobs und will kein Cluster-Management — ein anderes braucht spezifische Instance-Typen und Custom-Software auf langlebigen Clustern. Ein Modell passt nicht für beide.

**Die Lösung — die drei Modelle:**
- **EMR on EC2**: maximale **Kontrolle** — eigene Instance-Typen, Custom AMI, Custom Software, langlebige Cluster. Für kontinuierliche Verarbeitung mit spezifischer Hardware und feinem Tuning.
- **EMR Serverless**: **kein Cluster-Management**, Auto-Scaling in Sekunden, nur genutzte CPU/Speicher bezahlt. Für **bursty/unvorhersehbare** Jobs, bei denen man weder dimensionieren noch verwalten will.
- **EMR on EKS**: Spark-Jobs auf einem **bestehenden EKS-Cluster**, ohne separaten EMR-Cluster — teilt Ressourcen mit anderen K8s-Workloads. Für Teams, die bereits auf Kubernetes standardisiert sind.

Reflex: „Spark ohne Cluster-Management" → **Serverless**; „spezifische Hardware/Custom-Software/langlebig" → **EC2**; „schon EKS im Einsatz" → **EKS**.

> **💡 Merksatz:** **EC2** = max. Kontrolle (Custom-Hardware/-Software, langlebig); **Serverless** = kein Cluster-Mgmt, bursty; **EKS** = auf bestehendem Kubernetes. „Spark ohne Cluster" → Serverless.

### Knoten-Typen und die Spot-Strategie

**Das Problem:** Ein großer Batch-Job soll billig laufen, aber der Verlust einer Instanz darf nicht die Daten oder den Fortschritt vernichten.

**Die Lösung:** Ein EMR-Cluster hat drei Knoten-Rollen — und die Spot-Strategie folgt daraus:
- **Primary/Master**: koordiniert; Verlust reißt den Cluster — **nicht** auf Spot.
- **Core Nodes**: halten **HDFS-Daten** + führen Tasks aus; Verlust bedeutet Datenverlust — auf Spot **riskant**.
- **Task Nodes**: nur Compute, kein HDFS — **ideal für Spot** (bis 90 % Rabatt): Geht ein Task Node verloren, verteilt das Framework die Arbeit neu, ohne Daten zu verlieren.

Der Klassiker: **Spot für Task Nodes, On-Demand/Reserved für Primary + Core.** Und das übergreifende Kostenmuster: Cluster nach dem Job **terminieren** (Daten persistieren via **EMRFS in S3**), statt ihn leer laufen zu lassen.

> **💡 Merksatz:** **Task Nodes = ideal für Spot** (kein HDFS); Primary + Core auf On-Demand/Reserved. Daten via **EMRFS in S3** persistieren, Cluster danach terminieren.

### Die TCO-Entscheidung: EMR vs. EMR Serverless

**Das Problem:** Lohnt sich für einen bestehenden EC2-Cluster der Wechsel zu Serverless — oder bleibt EC2 günstiger?

**Die Lösung:** AWS nennt konkrete **Auslastungs-Schwellen** (Faustregel, prüfbar):
- Läuft der Cluster auf **On-Demand** und die Auslastung liegt **unter ~70 %**, ist **Serverless** günstiger (man zahlt nur genutzte Kapazität statt Leerlauf).
- Bei **Savings Plans** liegt die Schwelle bei **~50 %**.
- Bei **Spot** bleibt **EMR on EC2/EKS** am günstigsten (Spot schlägt Serverless-Komfort preislich).

Reflex: „niedrig ausgelasteter On-Demand-Cluster" → Serverless prüfen; „Spot-optimiert" → bei EC2/EKS bleiben.

> **💡 Merksatz:** Faustregel: On-Demand-Auslastung **<70 %** → Serverless günstiger; Savings Plans **<50 %**; **Spot** → EC2/EKS bleibt am günstigsten.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwort **„Hadoop"/„Spark"/„HBase"/„Cluster" → EMR**.
- Modelle: **EC2** (Kontrolle/Custom) · **Serverless** (bursty, kein Mgmt) · **EKS** (auf bestehendem Kubernetes).
- Knoten: **Task Nodes = Spot** (kein HDFS); Primary+Core On-Demand/Reserved; Daten via **EMRFS→S3**.
- TCO: On-Demand **<70 %** → Serverless; Savings Plans **<50 %**; **Spot** → EC2/EKS.
- Abgrenzung: **EMR (Big-Data-Cluster/Frameworks) vs. Glue (serverless ETL) vs. Athena (Ad-hoc SQL)**.

## 💡 Der eine Satz zum Mitnehmen

**EMR ist das Big-Data-Kraftwerk für Hadoop/Spark — EC2 für Kontrolle, Serverless für bursty Jobs, EKS für Kubernetes-Teams; Spot gehört auf die Task Nodes, Daten in S3 via EMRFS, und die 70/50-Prozent-Auslastungsregel entscheidet zwischen Cluster und Serverless.**
