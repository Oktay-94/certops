---
service: AWS Well-Architected Tool
seedKey: saa-c03-script-well-architected-tool
batch: B10
domains: [D1, D2, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/wellarchitected/latest/userguide/intro.html
  - https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html
status: draft
---

# AWS Well-Architected Tool

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Well-Architected = der **Architektur-TÜV** gegen die offiziellen AWS-Best-Practices. Wichtig: **Framework** = die Best-Practice-Lehre selbst, organisiert in **sechs Säulen** (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability); **Tool** = das Konsolen-Werkzeug, das deine Architektur per **geführtem Fragenkatalog** bewertet und **Risiken** (High/Medium) + Verbesserungen liefert. Eselsbrücke: „**O**hne **S**orgfalt **R**ennt **P**erformance **C**oole **S**achen".

Der SAA vertieft: **die sechs Säulen, Framework vs. Tool, Lenses — und die Abgrenzung zu Resilience Hub/Trusted Advisor.**

---

## 🎯 SAA-Vertiefung

### Die sechs Säulen und Framework vs. Tool

**Das Problem:** Eine App läuft — aber hält sie einem AZ-Ausfall stand, ist sie sicher, verschwendet sie Geld? Ohne strukturiertes Review zeigt sich das erst beim ersten Vorfall.

**Die Lösung:** Das **Well-Architected Framework** bündelt Best Practices in **sechs Säulen**:
- **Operational Excellence** (Betrieb/Automatisierung), **Security**, **Reliability** (Ausfallsicherheit), **Performance Efficiency**, **Cost Optimization**, **Sustainability** (Nachhaltigkeit, 🛑 sechste Säule seit Dez 2021).

Das **Tool** ist das Konsolen-Werkzeug: Man beantwortet einen **geführten Fragenkatalog** zu einem Workload, und das Tool identifiziert **High-Risk-** und **Medium-Risk-Issues (HRIs/MRIs)**, gibt konkrete Verbesserungsvorschläge und dokumentiert einen Bericht mit Verlauf. Der prüfbare Punkt: **Framework = die Lehre (6 Säulen), Tool = das Werkzeug, das bewertet.** Beliebte Frage: „welche ist KEINE Säule?".

> **💡 Merksatz:** **Framework = 6 Säulen** (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, **Sustainability**); **Tool** = fragen-basiertes Assessment → HRIs + Verbesserungen. Sustainability seit Dez 2021.

### Lenses und der Anwendungsfall

**Das Problem:** Das generische Framework passt nicht perfekt auf spezielle Workloads (Serverless, ML, SaaS).

**Die Lösung:** **Lenses** erweitern das Framework um domänenspezifische Best Practices (Serverless Lens, Machine Learning Lens, SaaS Lens u. a.). Der typische Anwendungsfall: **vor dem Go-Live** macht das Team ein **Well-Architected Review** → „hohes Risiko bei Reliability — deine DB läuft nur in einer AZ" → Umbau auf Multi-AZ, bevor der erste Ausfall kommt. Das Tool ist **kostenlos**. „Architektur formal gegen Best Practices dokumentieren/bewerten" → Well-Architected Tool.

> **💡 Merksatz:** **Lenses** = domänenspezifische Best Practices (Serverless/ML/SaaS). Anwendungsfall: **Review vor Go-Live** deckt HRIs auf. Tool kostenlos.

### Die Abgrenzung zu Resilience Hub und Trusted Advisor

**Das Problem:** Well-Architected Tool, Resilience Hub und Trusted Advisor „bewerten" alle.

**Die Lösung — die Rollen:**
- **Well-Architected Tool** = breites, **frage-basiertes** Review über **alle 6 Säulen** (qualitativ, dokumentiert).
- **Resilience Hub** = spezialisiert nur auf **Reliability/Resilienz**, misst konkret **RTO/RPO** und testet Ausfallszenarien (quantitativ).
- **Trusted Advisor** = **automatische** Best-Practice-Checks (5 Kategorien, kein Fragebogen).

Reflex: „formales 6-Säulen-Review dokumentieren" → Well-Architected Tool; „RTO/RPO messen/validieren" → Resilience Hub; „automatische Konto-Checks" → Trusted Advisor.

> **💡 Merksatz:** **Well-Architected Tool (6-Säulen-Review, fragen-basiert) vs. Resilience Hub (RTO/RPO messen, nur Reliability) vs. Trusted Advisor (automatische Checks)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **6 Säulen**: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, **Sustainability** (seit Dez 2021). „welche ist KEINE?".
- **Framework** (die Lehre) vs. **Tool** (das bewertende Werkzeug, fragen-basiert → HRIs).
- **Lenses** (Serverless/ML/SaaS); Review vor Go-Live; Tool kostenlos.
- Abgrenzung: **Well-Architected Tool (6 Säulen, fragen-basiert) vs. Resilience Hub (RTO/RPO) vs. Trusted Advisor (auto-Checks)**.

## 💡 Der eine Satz zum Mitnehmen

**Das Well-Architected Tool bewertet Workloads per geführtem Fragenkatalog gegen die sechs Säulen — Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization und Sustainability — und liefert High-Risk-Issues vor dem Go-Live; für konkrete RTO/RPO-Messung ist Resilience Hub zuständig, für automatische Checks Trusted Advisor.**
