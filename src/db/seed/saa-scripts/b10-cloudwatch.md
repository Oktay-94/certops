---
service: Amazon CloudWatch
seedKey: saa-c03-script-cloudwatch
batch: B10
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html
  - https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Unified-Cross-Account-Setup.html
  - https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Install-CloudWatch-Agent.html
status: draft
---

# Amazon CloudWatch

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> CloudWatch = der **Wachhund mit Fitness-Tracker** — der Monitoring-Dienst, der „**WIE läuft mein System?**" (Performance) beantwortet. Vier Werkzeuge: **Metrics** (CPU/Netzwerk), **Alarms** (Schwellenwerte → SNS/Auto Scaling, Zustände OK/ALARM/INSUFFICIENT_DATA), **Logs** (Log Groups→Streams, Logs Insights, Metric Filter), **Dashboards**. **CloudWatch Agent** für RAM/Disk (keine Standard-Metrik!). Killer-Abgrenzung: **CloudWatch = Performance (WIE?), CloudTrail = Aktivität (WER hat WAS?), Config = Konfiguration**.

Der SAA vertieft: **Metrik-Auflösungen, den Agent-Zwang bei RAM/Disk, Composite Alarms, Cross-Account Observability — und die Trio-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Metrik-Auflösung: Standard, Detailed, High-Resolution

**Das Problem:** Ein Auto-Scaling-Ereignis soll in Sekunden statt Minuten reagieren — aber die Default-Metriken kommen nur alle 5 Minuten.

**Die Lösung — die Auflösungsstufen:**
- **Basic Monitoring** (EC2 default): **5-Minuten**-Auflösung, kostenlos.
- **Detailed Monitoring**: **1-Minuten**-Auflösung, kostenpflichtig — für schnellere Alarme/Scaling.
- **High-Resolution Custom Metrics**: bis **1-Sekunden**-Auflösung; High-Resolution-Alarme mit Periode **10 s oder 30 s** (Standard-Alarme nur Vielfache von 60 s).

Retention läuft gestaffelt: Sub-Minuten-Daten 3 Stunden, 1-Min-Daten 15 Tage, 5-Min-Daten 63 Tage, 1-Stunden-Daten 15 Monate (automatische Aggregation). Signalwort „jede Minute statt alle 5" → Detailed Monitoring; „Sekunden-Granularität" → High-Resolution.

> **💡 Merksatz:** **Basic 5 Min (gratis) · Detailed 1 Min (kostet) · High-Resolution bis 1 Sek** (Alarm 10/30 s). „jede Minute" → Detailed, „Sekunden" → High-Resolution.

### Der Agent-Zwang: RAM und Disk

**Das Problem:** Ein Alarm soll bei Memory-Nutzung > 90 % feuern — aber der Alarm bleibt still, obwohl der Server swappt.

**Die Lösung:** EC2 liefert **nativ keine Memory- und keine internen Disk-Metriken** — der AWS/EC2-Namespace sieht nur von außen (CPU, Netzwerk, Disk-I/O der Volumes), **nicht ins Betriebssystem**. Für RAM- und Filesystem-Nutzung muss der **CloudWatch Agent** auf der Instanz installiert werden; die Metriken erscheinen dann im **CWAgent**-Namespace. Das ist eine der meistgeprüften Fallen: „Memory/Disk-Space einer EC2 überwachen" → **CloudWatch Agent** (nicht eine Standard-Metrik, die es nicht gibt). Der Agent läuft auch **on-premises** (hybrides Monitoring).

> **💡 Merksatz:** EC2 liefert **kein RAM/keinen Disk-Space** nativ → **CloudWatch Agent** (CWAgent-Namespace). Meistgeprüfte Falle. Agent läuft auch on-prem.

### Composite Alarms, Logs Insights und Cross-Account

Drei Vertiefungen:
- **Composite Alarms** kombinieren mehrere Alarme per AND/OR — reduzieren Alarm-Rauschen (nur feuern, wenn mehrere Bedingungen zugleich zutreffen), statt für jede Metrik einzeln zu benachrichtigen.
- **Logs Insights** durchsucht Logs mit einer Abfragesprache; **Metric Filter** zählt Muster in Logs (z. B. „ERROR") und macht daraus eine Metrik/einen Alarm. „Log-Muster zählen und alarmieren" → Metric Filter; „Logs interaktiv durchsuchen" → Logs Insights.
- **Cross-Account Observability** (via Observability Access Manager) zentralisiert Metriken/Logs/Traces mehrerer Accounts in einem **Monitoring Account** (bis 🔴 100.000 Source Accounts; jeder Source Account teilt mit bis zu 5 Monitoring Accounts), pro Region. „zentrale Sicht über viele Accounts" → Cross-Account Observability.

> **💡 Merksatz:** **Composite Alarms** (AND/OR, weniger Rauschen); **Metric Filter** zählt Log-Muster → Alarm, **Logs Insights** durchsucht; **Cross-Account Observability** zentralisiert mehrere Accounts.

---

## ⚠️ Prüfungs-Knackpunkte

- **CloudWatch = Performance (WIE?)**, nicht WER (CloudTrail) oder Konfiguration (Config).
- **Basic 5 Min / Detailed 1 Min / High-Resolution 1 Sek** (Alarm 10/30 s).
- **RAM/Disk-Space → CloudWatch Agent** (keine Standard-Metrik) — meistgeprüfte Falle; Agent auch on-prem.
- Alarm-Zustände OK/ALARM/INSUFFICIENT_DATA; **Composite Alarms** (AND/OR); Alarm → SNS / Auto Scaling / EC2-Aktion.
- **Metric Filter** (Log-Muster zählen) vs. **Logs Insights** (durchsuchen).
- **Cross-Account Observability** (OAM) für zentrale Multi-Account-Sicht.

## 💡 Der eine Satz zum Mitnehmen

**CloudWatch beantwortet „wie läuft mein System" über Metriken, Alarme und Logs — die Auflösung reicht von 5 Minuten bis 1 Sekunde, RAM und Disk-Space liefert nur der CloudWatch Agent, und in der großen Verwechslung gilt: Performance heißt CloudWatch, nicht CloudTrail (wer) oder Config (Konfiguration).**
