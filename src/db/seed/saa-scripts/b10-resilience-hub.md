---
service: AWS Resilience Hub
seedKey: saa-c03-script-resilience-hub
batch: B10
domains: [D2]
sourceRef:
  - https://docs.aws.amazon.com/resilience-hub/latest/userguide/what-is.html
  - https://aws.amazon.com/blogs/mt/validating-and-improving-the-rto-and-rpo-using-aws-resilience-hub/
status: draft
---

# AWS Resilience Hub

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Resilience Hub = der **Belastungstest für deine Architektur** — prüft und **misst**, ob eine Anwendung ihre Ausfall-Ziele (**RTO/RPO**) wirklich erfüllt. Man definiert Resilienz-Ziele; der Dienst **bewertet** die Architektur dagegen, deckt Schwachstellen auf, **gibt Empfehlungen** und **testet mit Fault Injection** (via FIS). Abgrenzung: **Well-Architected Tool = Gesamt-Check aller 6 Säulen; Resilience Hub = Tiefenprüfung speziell für Ausfallsicherheit.**

Der SAA vertieft: **Resiliency Policies (RTO/RPO), das FIS-Testing, die Tiers — und die Well-Architected-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Resiliency Policies: RTO/RPO validieren statt hoffen

**Das Problem:** Man *glaubt*, die App erfüllt ein RTO von 15 Minuten — aber weiß es erst im echten Notfall, wenn die DB-Wiederherstellung plötzlich länger dauert als erlaubt. Zu spät.

**Die Lösung:** In einer **Resiliency Policy** legt man **RTO/RPO-Targets** für vier Disruption-Typen fest (Application/Software, Infrastructure/Hardware, Availability Zone, Region). Resilience Hub **bewertet** die Architektur gegen diese Ziele (auf Basis von Well-Architected-Best-Practices), schätzt das **tatsächlich erreichbare RTO/RPO** und deckt Lücken auf („deine DB-Recovery überschreitet dein RTO"). Man bekommt konkrete **Empfehlungen** + Kostenabschätzung. „RTO/RPO validieren / Resilienz messen" → Resilience Hub (nicht das breite Well-Architected Tool, das qualitativ über alle Säulen geht).

> **💡 Merksatz:** **Resiliency Policy** = RTO/RPO-Targets für 4 Disruption-Typen; Resilience Hub **misst** erreichbares RTO/RPO und deckt Lücken auf. „RTO/RPO validieren" → Resilience Hub.

### FIS-Testing und die Well-Architected-Abgrenzung

**Das Problem:** Eine Bewertung auf dem Papier reicht nicht — man will belegen, dass die App einen echten Ausfall übersteht.

**Die Lösung:** Resilience Hub integriert **AWS FIS (Fault Injection Service)** für **Chaos-Engineering**: Es injiziert simulierte Ausfälle (AZ-Ausfall, Ressourcen weg) und misst das reale Verhalten gegen die RTO/RPO-Ziele. Tiers klassifizieren Apps (Mission Critical … Non-Critical). Die **Well-Architected-Abgrenzung**: Das **Well-Architected Tool** ist ein breites, fragen-basiertes Review über **alle 6 Säulen** (qualitativ); **Resilience Hub** ist die **quantitative Tiefenprüfung nur der Reliability/Resilienz** mit gemessenem RTO/RPO und aktiven Tests. Reflex: „RTO/RPO messen + Ausfall testen" → Resilience Hub; „ganzheitliches 6-Säulen-Review" → Well-Architected Tool.

> **💡 Merksatz:** **FIS-Integration** = Chaos-Engineering (simulierte Ausfälle) gegen RTO/RPO-Ziele. **Resilience Hub (quantitativ, nur Reliability) vs. Well-Architected Tool (qualitativ, alle 6 Säulen)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Resiliency Policy** = RTO/RPO-Targets (4 Disruption-Typen); Resilience Hub **misst** erreichbares RTO/RPO + Empfehlungen.
- **FIS-Integration** für Chaos-Engineering (simulierte Ausfälle testen).
- Abgrenzung: **Resilience Hub (misst RTO/RPO, nur Reliability) vs. Well-Architected Tool (6-Säulen-Review, qualitativ)**.
- SAA-Randthema; Stichwort „Resilienz messen / RTO-RPO validieren" → Resilience Hub.

## 💡 Der eine Satz zum Mitnehmen

**Resilience Hub misst, ob eine Anwendung ihre RTO/RPO-Ziele wirklich erreicht, deckt Lücken auf und testet sie mit Fault Injection — die quantitative Tiefenprüfung der Reliability, während das Well-Architected Tool ein breites, qualitatives Review über alle sechs Säulen bleistet.**
