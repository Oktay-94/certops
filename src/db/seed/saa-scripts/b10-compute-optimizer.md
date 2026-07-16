---
service: AWS Compute Optimizer
seedKey: saa-c03-script-compute-optimizer
batch: B10
domains: [D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/compute-optimizer/latest/ug/what-is-compute-optimizer.html
status: draft
---

# AWS Compute Optimizer

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Compute Optimizer = der **Rightsizing-Berater, der per ML die optimale Instanzgröße ausrechnet** — nicht zu groß, nicht zu klein. Analysiert die **tatsächliche Auslastung aus CloudWatch-Metriken** und empfiehlt für **EC2, Auto-Scaling-Gruppen, EBS-Volumes, Lambda** konkrete Konfigurationen mit erwarteter Ersparnis + Performance-Auswirkung. Abgrenzung: **Trusted Advisor = grober Rundum-Check; Compute Optimizer = präzises ML-Rightsizing.**

Der SAA vertieft: **den ML-Rightsizing-Ansatz, die unterstützten Ressourcen, den CloudWatch-Agent-Bedarf — und die Abgrenzung zu Trusted Advisor/Cost Explorer.**

---

## 🎯 SAA-Vertiefung

### ML-Rightsizing statt Rätselraten

**Das Problem:** Beim Start wählt man Instanzgrößen „großzügig". Ergebnis: eine `m5.xlarge` dümpelt bei 8 % CPU, ist aber für viel RAM bezahlt — über hunderte Instanzen enorme Verschwendung. Zu klein bremst dagegen die App. Von Hand pro Ressource nicht zu entscheiden.

**Die Lösung:** Compute Optimizer analysiert mit **Machine Learning** die reale Auslastung (aus **CloudWatch-Metriken** über einen Default-Zeitraum von 14 Tagen) und liefert **konkrete Empfehlungen** mit Zahlen: „diese `m5.xlarge` ist überdimensioniert → `m5.large`, ~40 % Ersparnis" oder Hinweise auf **under-provisioned** (Performance-Risiko). Unterstützt: **EC2, EC2 Auto Scaling Groups, EBS-Volumes, Lambda**, zudem ECS on Fargate und RDS/Aurora sowie idle-Empfehlungen (u. a. NAT Gateways). „optimale Instanzgröße / über-/unterdimensioniert / Rightsizing" → Compute Optimizer.

> **💡 Merksatz:** Compute Optimizer = **ML-Rightsizing** aus **CloudWatch-Metriken** (Default 14 Tage) für **EC2/ASG/EBS/Lambda** (+ ECS Fargate, RDS); konkrete Empfehlung mit Ersparnis. „Rightsizing" → Compute Optimizer.

### Der CloudWatch-Agent-Bedarf und Enhanced Metrics

**Das Problem:** Die Empfehlungen berücksichtigen die Memory-Auslastung nicht — obwohl gerade RAM oft der Engpass ist.

**Die Lösung:** Wie bei allen Auslastungsanalysen gilt: **Memory-Metriken liefert EC2 nicht nativ** — für memory-basierte Empfehlungen muss der **CloudWatch Agent** laufen. Wer einen längeren Analysezeitraum will (statt 14 Tage), aktiviert **Enhanced Infrastructure Metrics** (kostenpflichtig) für bis zu 93 Tage Lookback bei EC2/RDS. Compute Optimizer selbst braucht ein **Opt-In**; die Basisfeatures sind kostenlos.

> **💡 Merksatz:** Memory-Empfehlungen brauchen den **CloudWatch Agent** (EC2 liefert RAM nicht nativ). **Enhanced Infrastructure Metrics** (kostenpflichtig) = bis 93 Tage Lookback. Opt-In nötig, Basis gratis.

### Die Abgrenzung zu Trusted Advisor und Cost Explorer

**Das Problem:** Trusted Advisor, Compute Optimizer und Cost-Explorer-Rightsizing überschneiden sich scheinbar.

**Die Lösung — die Rollen:**
- **Compute Optimizer** = tiefes **ML-Rightsizing** einzelner Ressourcen (EC2/ASG/EBS/Lambda) mit präzisen Empfehlungen.
- **Trusted Advisor** = breiter **Best-Practice-Check** über 5 Kategorien (inkl. grober Cost-Optimization-Hinweise), nicht ML-tief.
- **Cost Explorer Rightsizing** = EC2-fokussierte Rightsizing-Empfehlung im Kostenkontext.

Reflex: „präzise optimale Instanzgröße per ML" → Compute Optimizer; „grober Rundum-Check über alle Bereiche" → Trusted Advisor; „Kosten analysieren + EC2-Rightsizing" → Cost Explorer.

> **💡 Merksatz:** **Compute Optimizer (ML-Rightsizing einzelner Ressourcen) vs. Trusted Advisor (grober Best-Practice-Check) vs. Cost Explorer (Kostenanalyse + EC2-Rightsizing)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **ML-Rightsizing** aus **CloudWatch-Metriken** (Default 14 Tage) für **EC2/ASG/EBS/Lambda** (+ ECS Fargate, RDS, idle-Empfehlungen).
- Konkrete Empfehlungen mit Ersparnis + Performance-Risiko (over-/under-provisioned).
- **Memory-Empfehlungen → CloudWatch Agent** nötig; **Enhanced Infrastructure Metrics** (kostenpflichtig) = bis 93 Tage; Opt-In, Basis gratis.
- Abgrenzung: **Compute Optimizer (ML-Rightsizing) vs. Trusted Advisor (grober Check) vs. Cost Explorer (Kostenanalyse)**.

## 💡 Der eine Satz zum Mitnehmen

**Compute Optimizer berechnet per ML aus CloudWatch-Metriken die richtige Größe für EC2, Auto-Scaling-Gruppen, EBS und Lambda — präziser als Trusted Advisors grober Rundum-Check, aber für Memory-Empfehlungen ist wie immer der CloudWatch Agent Voraussetzung.**
