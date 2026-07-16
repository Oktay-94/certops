---
service: Amazon QuickSight
seedKey: saa-c03-script-quicksight
batch: B8
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/quicksight/latest/user/welcome.html
  - https://docs.aws.amazon.com/quicksight/latest/user/spice.html
status: draft
---

# Amazon QuickSight

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> QuickSight = das **Dashboard-Studio, das nackte Zahlen in klickbare Diagramme verwandelt** — der **BI**-Dienst von AWS. Serverlos, verbindet sich mit Athena/Redshift/RDS/S3. **SPICE** = die superschnelle In-Memory-Engine für blitzschnelle Dashboards; **Q** = Fragen in natürlicher Sprache (heute „Amazon Q in QuickSight"). QuickSight ist **immer das letzte Glied der Kette**: Glue → Athena → QuickSight. Signalwort: **„Dashboard/Visualisierung/BI" → QuickSight**.

Der SAA vertieft: **SPICE vs. Direct Query, die Editions, Amazon Q — und die Rolle am Ketten-Ende.**

---

## 🎯 SAA-Vertiefung

### SPICE vs. Direct Query: Snapshot oder live

**Das Problem:** Ein Dashboard soll für tausende gleichzeitige Nutzer blitzschnell laden — ein anderes muss immer den absolut aktuellen Stand zeigen. Die falsche Wahl bremst entweder die Nutzer oder die Datenquelle.

**Die Lösung — die zwei Query-Modi:**
- **SPICE** (In-Memory-Engine): lädt einen **Snapshot** der Daten in einen superschnellen In-Memory-Cache. Dashboards laden blitzschnell und **entlasten die Datenquelle** (die Query läuft nicht bei jedem Aufruf gegen Athena/Redshift). Preis: Die Daten sind ein **Snapshot** (per Refresh aktualisiert), nicht live. Ideal für **viele gleichzeitige Nutzer** und konsistente Performance. Kapazität bis 🔴 1 Mrd. Zeilen / 1 TB pro Dataset.
- **Direct Query**: schickt bei **jedem** Laden eine Query an die **Quelle** — immer **live/aktuell**, verbraucht keine SPICE-Kapazität, aber erzeugt **Quell-Last und Latenz**. Für Echtzeit-Anforderungen.

Reflex: „schnell, viele Nutzer, Quelle entlasten" → **SPICE**; „Daten müssen immer live/aktuell sein" → **Direct Query**.

> **💡 Merksatz:** **SPICE** = In-Memory-Snapshot (schnell, viele Nutzer, entlastet Quelle, nicht live). **Direct Query** = live gegen die Quelle (aktuell, aber Quell-Last/Latenz).

### Editions, Amazon Q und die Rolle am Ketten-Ende

**Editions:** **Standard** und **Enterprise** — prüfungsrelevante Enterprise-only-Features: **Row-Level- und Column-Level-Security**, **VPC-Connectivity**, **Embedded Analytics** und **Amazon Q in QuickSight**. „RLS / VPC / Embedded / NLP" → Enterprise Edition.

**Amazon Q in QuickSight** (Generative BI) beantwortet Fragen in **natürlicher Sprache** („Zeig mir den Umsatz in Berlin letzten Monat"), erzeugt Executive Summaries und Data Stories und baut Dashboards per Prompt. „BI-Fragen in normaler Sprache / generative Dashboards" → Amazon Q in QuickSight.

**Die Rolle am Ketten-Ende:** QuickSight **visualisiert**, es fragt nicht ab und rechnet nicht — das machen Athena/Redshift. Der Reflex: „Diagramme/Dashboards für Geschäftsentscheidungen" → QuickSight; „die Daten abfragen/aggregieren" → Athena/Redshift. Damit schließt sich die Analytik-Kette: **Glue putzt → Athena/Redshift fragt ab → QuickSight macht das Management-Dashboard.** Für pixelgenaue, mehrseitige Berichte gibt es **Paginated Reports**.

> **💡 Merksatz:** **Enterprise** = RLS/CLS, VPC, Embedded, Amazon Q. **Amazon Q** = NLP/generative BI. QuickSight **visualisiert** (letztes Glied), fragt nicht ab — das tun Athena/Redshift.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Dashboard", „Visualisierung", „BI", „Berichte fürs Management" → QuickSight.
- **SPICE** (In-Memory-Snapshot: schnell, viele Nutzer, entlastet Quelle) vs. **Direct Query** (live, aber Quell-Last/Latenz).
- **Enterprise-only**: RLS/CLS, VPC-Connectivity, Embedded, Amazon Q.
- **Amazon Q in QuickSight** = NLP/generative BI.
- **Paginated Reports** für pixelgenaue mehrseitige Berichte.
- Rolle: QuickSight **visualisiert** (letztes Glied), Athena/Redshift fragen ab.

## 💡 Der eine Satz zum Mitnehmen

**QuickSight ist das BI-Dashboard am Ende der Analytik-Kette — SPICE liefert schnelle Snapshots für viele Nutzer, Direct Query hält es live, Enterprise bringt RLS/VPC/Embedded/Amazon Q; visualisieren ist QuickSights Job, abfragen bleibt Athena und Redshift überlassen.**
