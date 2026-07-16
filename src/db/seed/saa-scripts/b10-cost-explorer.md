---
service: AWS Cost Explorer
seedKey: saa-c03-script-cost-explorer
batch: B10
domains: [D4]
sourceRef:
  - https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html
  - https://docs.aws.amazon.com/cost-management/latest/userguide/ce-rightsizing.html
status: draft
---

# AWS Cost Explorer

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Cost Explorer = das **Mikroskop, mit dem du vergangene und aktuelle Kosten in alle Richtungen aufschlüsselst**. Nach Dienst/Region/Zeitraum/**Tags** aufschlüsseln, Trends erkennen, Prognose, Spar-Empfehlungen (RI/Savings Plans). **Rückblickend und analysierend** — es zeigt/versteht, was war, **handelt aber nicht selbst**. Killer-Abgrenzung: **Cost Explorer = analysieren/verstehen (rückblickend), Budgets = Limit + Alarm (vorausschauend).**

Der SAA vertieft: **die Rolle im Kosten-Trio (vs. Budgets vs. CUR), Rightsizing-Empfehlungen, Cost Allocation Tags — die Abgrenzung ist prüfungskritisch.**

---

## 🎯 SAA-Vertiefung

### Analysieren, aufschlüsseln, prognostizieren

**Das Problem:** Die Monatsrechnung ist 47.000 € — aber welcher Dienst, welches Team, warum gestiegen? Man braucht eine visuelle Aufschlüsselung, keine Rohdaten-Tabelle.

**Die Lösung:** Cost Explorer visualisiert Kosten & Usage als Diagramme, beliebig hineinzoombar — nach **Dienst, Region, Zeitraum** oder **Cost Allocation Tags** (pro Projekt/Team/Kostenstelle). Es erkennt **Trends** („EC2-Kosten steigen seit März"), liefert eine trend-basierte **12-Monats-Prognose** (statistisch, keine harte Garantie) und gibt **Rightsizing-Empfehlungen** für EC2 (idle/underutilized). Für Memory-basierte Empfehlungen braucht es Daten des CloudWatch Agent. Der Kernpunkt: Cost Explorer **analysiert und versteht** — es setzt keine Limits und stoppt nichts.

> **💡 Merksatz:** Cost Explorer = **visualisieren/aufschlüsseln** (Dienst/Region/Zeit/Tag) + **Trends/Prognose** + Rightsizing-Empfehlungen. **Rückblickend, handelt nicht selbst.**

### Cost Allocation Tags: Kosten pro Team/Projekt

**Das Problem:** Der CFO will wissen, was „Projekt X" konkret kostet — aber alle Ressourcen laufen im selben Account durcheinander.

**Die Lösung:** Mit **Cost Allocation Tags** (AWS-generiert oder selbst definiert) versieht man Ressourcen mit Schlüsseln wie `Projekt=X` oder `Abteilung=Marketing`. Nach Aktivierung in den Billing-Einstellungen kann Cost Explorer nach diesen Tags **aufschlüsseln** — die Grundlage für Kostenzuordnung pro Team/Projekt/Kostenstelle (Showback/Chargeback). „Kosten pro Projekt/Abteilung aufschlüsseln" → Cost Allocation Tags + Cost Explorer.

> **💡 Merksatz:** **Cost Allocation Tags** (aktivieren!) → Cost Explorer schlüsselt nach Team/Projekt auf (Showback/Chargeback). „Kosten pro Projekt" → Tags.

### Das Kosten-Trio: Cost Explorer vs. Budgets vs. CUR

**Das Problem:** Cost Explorer, Budgets und CUR klingen alle nach „Kosten".

**Die Lösung — die Rollen:**
- **Cost Explorer** = **analysieren/visualisieren/prognostizieren** (rückblickend, du schaust aktiv rein).
- **Budgets** = **Limit setzen + alarmiert werden** (vorausschauend, meldet sich selbst).
- **CUR (Cost and Usage Report)** = **detaillierteste Rohdaten** (Line-Item pro Ressource/Stunde) nach S3 → Athena/QuickSight für custom Analysen.

Der Reflex: „verstehen, wohin das Geld geht" → Cost Explorer; „Alarm bei 80 % des Budgets" → Budgets; „granularste Daten für eigene Analyse" → CUR. Für ungewöhnliche Kostenausschläge per ML gibt es zusätzlich **Cost Anomaly Detection** (ergänzt Budgets, das auf feste Limits alarmiert).

> **💡 Merksatz:** **Cost Explorer (analysieren) · Budgets (Limit + Alarm) · CUR (Rohdaten → Athena/QuickSight)**; **Cost Anomaly Detection** (ML-Ausschläge). „verstehen" → Cost Explorer.

---

## ⚠️ Prüfungs-Knackpunkte

- Cost Explorer = **visualisieren/aufschlüsseln + Trends/Prognose + Rightsizing**; rückblickend, handelt nicht.
- **Cost Allocation Tags** (aktivieren) → Aufschlüsselung pro Team/Projekt.
- Trio: **Cost Explorer (analysieren) vs. Budgets (Limit+Alarm) vs. CUR (Rohdaten)**.
- **Cost Anomaly Detection** (ML) für ungewöhnliche Ausschläge.
- Rightsizing-Empfehlungen brauchen für Memory den CloudWatch Agent.

## 💡 Der eine Satz zum Mitnehmen

**Cost Explorer ist das rückblickende Mikroskop, das Kosten nach Dienst, Region und Tag aufschlüsselt und Trends prognostiziert — es versteht, wohin das Geld fließt, aber es setzt keine Limits (Budgets) und liefert keine Rohdaten (CUR); Cost Allocation Tags machen die Zuordnung pro Team erst möglich.**
