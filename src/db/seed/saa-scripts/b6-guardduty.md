---
service: Amazon GuardDuty
seedKey: saa-c03-script-guardduty
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html
  - https://aws.amazon.com/guardduty/features/
status: draft
---

# Amazon GuardDuty

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> GuardDuty = der **KI-Detektiv, der nachts durchs Konto patrouilliert**. Ein Klick, **keine Agenten**. Liest **CloudTrail, VPC Flow Logs und DNS-Logs** und schlägt per Machine Learning bei Anomalien Alarm (**Findings**): „EC2 redet mit Krypto-Mining-Server", „Login aus ungewöhnlichem Land". Es **erkennt nur, repariert nicht** — Reaktion via EventBridge + Lambda. Merksatz: **Inspector = „wo bin ich verwundbar?", GuardDuty = „werde ich gerade angegriffen?"**

Der SAA vertieft: **die agentless-Datenquellen, die optionalen Protection Plans — und die scharfe Detection-Suite-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Agentless: Warum GuardDuty ohne Software auskommt

**Das Problem:** Ein Security-Team soll Bedrohungserkennung über hunderte Instanzen und Konten ausrollen — aber ohne auf jeder Instanz einen Agenten zu installieren und zu pflegen.

**Die Lösung:** GuardDuty ist **agentless** für seine drei **Foundational Data Sources**: **CloudTrail-Management-Events** (wer tut was im Konto?), **VPC Flow Logs** (welcher Netzwerk-Traffic fließt wohin?) und **DNS-Query-Logs** (welche Domains werden aufgelöst?). Diese Logs entstehen ohnehin auf AWS-Ebene — GuardDuty liest sie direkt, ohne dass auf einer einzigen Instanz Software läuft. Deshalb ist es „ein Klick" und org-weit sofort aktivierbar. Das ist ein Punkt, den AWS gern betont und der Prüfung gern abfragt: „Threat Detection **ohne Agenten** über viele Konten" → GuardDuty.

Erkannt werden u. a.: kompromittierte Credentials, **Krypto-Mining**, ungewöhnliche API-Calls, **Datenexfiltration**, Kommunikation mit bekannten Malicious IPs/Domains.

> **💡 Merksatz:** GuardDuty ist **agentless** — liest CloudTrail, VPC Flow Logs, DNS-Logs. „Threat Detection ohne Agenten, org-weit" → GuardDuty.

### Protection Plans: Über die Basis hinaus

**Das Problem:** Die Basis-Quellen erkennen viel, aber nicht alles — etwa Malware auf einem EBS-Volume oder verdächtige Login-Muster auf einer Aurora-DB.

**Die Lösung:** GuardDuty hat optionale **Protection Plans**, die zusätzliche Signale erschließen — jeder ein potenzielles Prüfungs-Signalwort:
- **S3 Protection** — verdächtige Zugriffe auf S3-Daten.
- **EKS / Runtime Monitoring** — Bedrohungen in Kubernetes/Container-Runtime.
- **Malware Protection for EC2** — scannt EBS-Volumes verdächtiger Instanzen auf Malware.
- **Malware Protection for S3** — scannt neu hochgeladene Objekte.
- **RDS Protection** — anomale Login-Muster auf Aurora / RDS PostgreSQL.
- **Lambda Protection** — verdächtige Netzwerkaktivität von Funktionen.

🛑 Dazu die **Extended Threat Detection** (automatisch, kostenlos): erkennt **mehrstufige Angriffssequenzen** über Datenquellen und Zeit hinweg und mapped sie auf MITRE ATT&CK — statt nur Einzel-Findings.

Der Reflex: „Malware auf EC2/EBS scannen" → **GuardDuty Malware Protection for EC2** (nicht Inspector — der sucht CVEs, keine Malware). „Anomale DB-Logins auf Aurora" → **RDS Protection**.

> **💡 Merksatz:** Protection Plans = zusätzliche Quellen (S3, EKS, **Malware for EC2/S3**, RDS, Lambda). „Malware scannen" → GuardDuty (nicht Inspector). 🛑 Extended Threat Detection = Angriffsketten.

### GuardDuty im Verbund: Detektieren, dann untersuchen und aggregieren

GuardDuty steht selten allein — die Prüfung liebt das Zusammenspiel:
- GuardDuty **detektiert** → schickt Findings an **Security Hub** (Aggregation) und **EventBridge** (automatische Reaktion via Lambda: z. B. Instanz isolieren).
- Nach einem Finding übernimmt **Detective** die **Ursachenanalyse** (warum/wie/Umfang).

Die Trennung, die geprüft wird: **GuardDuty findet aktive Bedrohungen** (Verhalten, Logs) — im Gegensatz zu **Inspector** (Schwachstellen/CVEs, vorbeugend) und **Macie** (sensible Daten in S3).

> **💡 Merksatz:** GuardDuty **detektiert** → Security Hub aggregiert, EventBridge reagiert, Detective untersucht. GuardDuty = aktive Bedrohungen (nicht CVEs, nicht S3-Daten).

---

## ⚠️ Prüfungs-Knackpunkte

- **Agentless**; Foundational Sources: **CloudTrail, VPC Flow Logs, DNS-Logs**. „ohne Agenten, org-weit" → GuardDuty.
- Erkennt: Krypto-Mining, kompromittierte Credentials, Datenexfiltration, Malicious-IP/Domain-Kontakt.
- **Protection Plans**: S3, EKS/Runtime, **Malware for EC2/S3**, **RDS**, Lambda. „Malware scannen" → GuardDuty (nicht Inspector).
- 🛑 **Extended Threat Detection** = mehrstufige Angriffsketten (MITRE ATT&CK), automatisch.
- **erkennt nur, behebt nicht** → EventBridge + Lambda für Auto-Response.
- Abgrenzung: **GuardDuty (Threats) ≠ Inspector (CVEs) ≠ Macie (S3-Daten) ≠ Detective (Untersuchung)**.

## 💡 Der eine Satz zum Mitnehmen

**GuardDuty ist die agentenlose Alarmanlage, die aus CloudTrail-, Flow- und DNS-Logs aktive Bedrohungen erkennt — von Krypto-Mining bis Datenexfiltration; für CVEs ist Inspector zuständig, für sensible S3-Daten Macie, und für die Ursachenanalyse danach Detective.**
