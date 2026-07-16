---
service: Amazon Detective
seedKey: saa-c03-script-detective
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/detective/latest/userguide/what-is-detective.html
status: draft
---

# Amazon Detective

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Detective = der **Ermittler, der nach dem Alarm das Warum und Wie rekonstruiert**. Nach einem GuardDuty-Finding beginnen die echten Fragen: Wie kam der Angreifer rein? Wann? Was hat er berührt? Detective sammelt automatisch CloudTrail, VPC Flow Logs und GuardDuty-Findings und baut per ML **visuelle Behavior Graphs**. Merksatz: **GuardDuty ist die Alarmanlage (es piept), Detective ist der Kriminalkommissar (rekonstruiert den Tathergang)**.

Der SAA vertieft: **was Behavior Graphs leisten, die Rolle im Incident-Ablauf — und die klare Trennung „erkennen vs. verstehen".**

---

## 🎯 SAA-Vertiefung

### Behavior Graphs: Die Punkte verbinden

**Das Problem:** GuardDuty meldet „diese EC2 kommuniziert mit einem Schad-Server". Um den Vorfall zu verstehen, müsste ein Analyst sich durch Millionen CloudTrail- und Flow-Log-Einträge wühlen — über Tage, unter Zeitdruck, und die Zusammenhänge im Kopf zusammensetzen.

**Die Lösung:** Detective baut automatisch **Behavior Graphs** — es zieht kontinuierlich die relevanten Logs (CloudTrail, VPC Flow Logs, GuardDuty-, Security-Hub-Findings, EKS Audit Logs) zusammen und modelliert per ML und Graphentheorie, **wie Ressourcen, IPs, Konten und Nutzer zusammenhängen und sich über die Zeit verhalten haben**. Statt Rohlogs sieht der Analyst eine visuelle Karte: „Dieses ungewöhnliche Verhalten begann Dienstag 3 Uhr, ausgehend von diesem Konto, und berührte diese Ressourcen." Bis zu **einem Jahr** historische Daten stehen zur Verfügung. Was manuell Tage dauert, liefert Detective in Minuten.

Ein prüfbares Detail: **Finding Groups** gruppieren automatisch zusammengehörige Findings und betroffene Entitäten und mappen sie auf MITRE ATT&CK — die Untersuchung startet also nicht bei null, sondern bei einer bereits zusammengestellten Fallakte.

> **💡 Merksatz:** Detective baut **Behavior Graphs** aus CloudTrail/Flow-Logs/GuardDuty (bis 1 Jahr) → visuelle Ursachen-/Umfangsanalyse in Minuten statt Tage Log-Wühlen.

### Die Rolle im Incident-Ablauf

**Das Problem:** GuardDuty, Detective und Security Hub klingen alle nach „Security-Untersuchung". Wann welches?

**Die Lösung:** Sie bilden eine **Kette**, und die Reihenfolge ist die Prüfungslogik:
1. **GuardDuty** *detektiert* die Bedrohung → Alarm (Finding).
2. **Security Hub** *aggregiert* das Finding neben allen anderen (Überblick).
3. **Detective** *untersucht* nach dem Finding die **Ursache und den Umfang** (warum, wie, seit wann, was betroffen).

Die entscheidende Trennung: **„erkennen" → GuardDuty**, **„verstehen/ermitteln" → Detective**. Und wie GuardDuty **behebt Detective nichts** — es ist reiner Ermittlungsdienst, kein Remediation-Tool. Der bequeme Einstieg: Aus einem GuardDuty- oder Security-Hub-Finding kann man direkt nach Detective pivotieren.

> **💡 Merksatz:** Ablauf: **GuardDuty erkennt → Security Hub aggregiert → Detective untersucht (Ursache/Umfang).** „verstehen/Root Cause" → Detective; es behebt nichts.

---

## ⚠️ Prüfungs-Knackpunkte

- **Behavior Graphs** aus CloudTrail, VPC Flow Logs, GuardDuty-/Security-Hub-Findings, EKS Audit Logs (bis **1 Jahr** Historie).
- **Finding Groups** + MITRE-ATT&CK-Mapping für zusammengestellte Fallakten.
- Signalwörter: „Root Cause / Ursache untersuchen / forensische Analyse / Umfang eines Vorfalls" → **Detective**.
- „erkennen" → GuardDuty · „verstehen/ermitteln" → Detective; Detective **behebt nichts**.
- Direkter Pivot aus GuardDuty/Security Hub in Detective.

## 💡 Der eine Satz zum Mitnehmen

**Detective ist der Kriminalkommissar nach dem Alarm: Es verwandelt Millionen Logzeilen in einen visuellen Behavior Graph, der Ursache und Umfang eines Vorfalls in Minuten zeigt — GuardDuty erkennt, Detective versteht.**
