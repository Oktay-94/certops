---
service: AWS Budgets
seedKey: saa-c03-script-budgets
batch: B10
domains: [D4]
sourceRef:
  - https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
  - https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-controls.html
status: draft
---

# AWS Budgets

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Budgets = der **Kostenwächter mit Alarmanlage**, der warnt, bevor die Rechnung aus dem Ruder läuft. Kostenlimit setzen („Monatslimit EC2: 5.000 €"), automatisch alarmiert werden (bei 80 %/100 %, per E-Mail/**SNS**), sogar **auf Prognose-Basis** (warnt, wenn die Hochrechnung das Limit sprengt). Budget-Typen: Kosten, Nutzung, RI/Savings-Plan-Auslastung. Killer-Abgrenzung: **Cost Explorer = Mikroskop (Vergangenheit untersuchen), Budgets = Rauchmelder (piept, bevor es brennt).**

Der SAA vertieft: **die Budget-Typen, Budget Actions (automatisches Handeln!), Prognose-Alarme — und die Kosten-Trio-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Vorausschauend alarmieren — auch auf Prognose-Basis

**Das Problem:** Ein Entwickler startet versehentlich eine teure Instanz und vergisst sie. Mit Cost Explorer bemerkt man das erst beim aktiven Nachschauen — vielleicht erst am Monatsende, wenn das Geld weg ist.

**Die Lösung:** **Budgets** setzt ein **Limit** und meldet sich **selbst**, während der Monat läuft — bei Schwellen wie 80 % und 100 %, per E-Mail oder **SNS**. Besonders prüfbar: Budgets kann **auf Prognose-Basis** alarmieren, also warnen, wenn die **Hochrechnung** zeigt, dass das Limit voraussichtlich überschritten wird — nicht erst, wenn es bereits passiert ist. Das ist der vorausschauende Gegenpol zu Cost Explorer (rückblickend). „gewarnt werden, bevor die Kosten zu hoch werden" → Budgets.

> **💡 Merksatz:** **Budgets** = Limit + Selbst-Alarm (80 %/100 %, E-Mail/SNS), auch **auf Prognose-Basis** (warnt vor der Überschreitung). Vorausschauend, meldet sich selbst.

### Budget-Typen und Budget Actions

**Das Problem:** Ein Alarm allein hilft nicht, wenn nachts niemand reagiert — man will, dass bei Budgetüberschreitung **automatisch** etwas passiert.

**Die Lösung:**
- **Budget-Typen**: **Cost** (Geldbetrag), **Usage** (Nutzungsmenge), **RI Utilization/Coverage** und **Savings Plans Utilization/Coverage** (überwacht, ob gekaufte Commitments ausgelastet sind).
- 🛑 **Budget Actions**: automatisches Handeln bei Schwellenüberschreitung — z. B. eine **restriktive IAM-/SCP-Policy anwenden** (weitere teure Aktionen unterbinden) oder **EC2-/RDS-Instanzen stoppen**. Das ist der entscheidende Unterschied zu einem reinen CloudWatch-Billing-Alarm, der nur benachrichtigt. „bei Budgetüberschreitung automatisch gegensteuern" → Budget Actions.

> **💡 Merksatz:** Typen: **Cost/Usage/RI-Utilization/SP-Utilization**. 🛑 **Budget Actions** = automatisch handeln (IAM/SCP anwenden, Instanzen stoppen) — nicht nur benachrichtigen.

### Die Kosten-Trio-Abgrenzung

**Das Problem:** Budgets, Cost Explorer und CloudWatch-Billing-Alarm überschneiden sich scheinbar.

**Die Lösung:**
- **Budgets** = **Limit setzen + alarmieren + Actions** (vorausschauend). Die richtige Antwort für „Alarm/Aktion bei Kostenschwelle".
- **Cost Explorer** = analysieren/verstehen (rückblickend).
- **CUR** = Rohdaten.
- **CloudWatch Billing Alarm** = einfacher Alarm auf die Gesamtrechnung (nur Benachrichtigung, keine Typen/Actions).

Reflex: „Limit + Alarm + automatische Aktion" → Budgets; „nur eine grobe Rechnungswarnung" → CloudWatch Billing Alarm; „analysieren" → Cost Explorer.

> **💡 Merksatz:** **Budgets (Limit+Alarm+Actions, vorausschauend) vs. Cost Explorer (analysieren, rückblickend) vs. CUR (Rohdaten)**; CloudWatch Billing Alarm = nur simple Rechnungswarnung.

---

## ⚠️ Prüfungs-Knackpunkte

- **Budgets** = Limit + Selbst-Alarm (E-Mail/SNS), auch **auf Prognose-Basis**.
- Typen: **Cost / Usage / RI Utilization+Coverage / Savings Plans Utilization+Coverage**.
- 🛑 **Budget Actions** = automatisch handeln (IAM/SCP anwenden, Instanzen stoppen) — mehr als nur Alarm.
- Trio: **Budgets (Limit+Alarm) vs. Cost Explorer (analysieren) vs. CUR (Rohdaten)**.
- Abgrenzung zu **CloudWatch Billing Alarm** (nur simple Benachrichtigung).

## 💡 Der eine Satz zum Mitnehmen

**Budgets ist der vorausschauende Rauchmelder: Es setzt Limits und alarmiert selbst — sogar auf Prognose-Basis, bevor die Grenze fällt — und kann per Budget Actions automatisch gegensteuern, während Cost Explorer nur rückblickend analysiert und CUR die Rohdaten liefert.**
