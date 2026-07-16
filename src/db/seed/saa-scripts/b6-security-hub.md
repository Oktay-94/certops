---
service: AWS Security Hub
seedKey: saa-c03-script-security-hub
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/securityhub/latest/userguide/what-is-securityhub.html
  - https://aws.amazon.com/security-hub/faqs/
status: draft
---

# AWS Security Hub

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Security Hub = die **zentrale Sicherheits-Leitstelle**: bündelt die **Findings aller anderen Security-Dienste** (GuardDuty, Inspector, Macie & Co.) auf **einem Dashboard** und führt automatische **Compliance-Checks** gegen Standards (CIS, PCI DSS, AWS Best Practices) mit **Security Score** durch. Merksatz: **Die anderen finden, Security Hub sammelt ein.** Multi-Account über die ganze Organisation.

Der SAA vertieft: **was genau aggregiert wird, die Security Standards — und das 2025er-Rebranding (CSPM vs. neuer Security Hub).**

---

## 🎯 SAA-Vertiefung

### Der Aggregator: Ein Dashboard statt fünf Konsolen

**Das Problem:** Ein Security-Team betreibt GuardDuty, Inspector, Macie und mehrere Partner-Tools — jedes mit eigenem Dashboard, eigenem Format. Wichtige Alarme gehen im Konsolen-Wildwuchs unter, und einen Gesamtüberblick „wie sicher sind wir?" gibt es nicht.

**Die Lösung:** Security Hub ist der **Aggregator** — alle anderen Dienste schicken ihre Findings dorthin, normalisiert in ein einheitliches Format (**ASFF**, AWS Security Finding Format), sodass sich Funde aus verschiedenen Quellen vergleichen und gemeinsam priorisieren lassen. Ein Dashboard für GuardDuty-Bedrohungen, Inspector-CVEs, Macie-PII-Funde und Partner-Findings — org-weit über alle Konten. Die Kern-Abgrenzung, die dauernd geprüft wird: **Security Hub erzeugt die Funde nicht selbst** — es sammelt sie ein und korreliert. „Zentraler Überblick / Findings aggregieren / single pane of glass" → Security Hub; „die Bedrohung *erkennen*" → GuardDuty.

Von hier geht es weiter: EventBridge-Integration für **automatische Remediation** und **Automation Rules** zum Anreichern/Weiterleiten von Findings.

> **💡 Merksatz:** Security Hub **aggregiert** (ASFF), erzeugt keine eigenen Funde. „single pane of glass / Findings zentralisieren" → Security Hub; „erkennen" → GuardDuty/Inspector/Macie.

### Security Standards: Automatische Compliance-Checks

**Das Problem:** Ein Unternehmen muss belegen, dass seine AWS-Umgebung dem **CIS Benchmark** und **PCI DSS** entspricht — und laufend erkennen, wenn eine Ressource abweicht.

**Die Lösung:** Security Hub führt **automatische Security-Checks** gegen etablierte **Standards** durch: **AWS Foundational Security Best Practices (FSBP)**, **CIS AWS Foundations Benchmark**, **PCI DSS**, NIST. Jeder Check bewertet Ressourcen kontinuierlich; das Ergebnis fließt in einen **Security Score** (Prozent-Konformität). Das ist die Antwort auf „laufend gegen einen Sicherheits-Benchmark prüfen + Score" → Security Hub. Abzugrenzen von **Audit Manager** (sammelt Evidence für *externe Auditoren*) und **Config** (prüft *Konfigurationsregeln* auf Ressourcenebene) — dazu mehr in den jeweiligen Skripten.

> **💡 Merksatz:** Security Hub prüft automatisch gegen **FSBP/CIS/PCI DSS** + **Security Score**. „laufend gegen Security-Benchmark prüfen" → Security Hub (nicht Audit Manager, nicht Config).

### 🛑 Das Rebranding 2025: Zwei Namen, ein Prüfungs-Reflex

**Das Problem:** In der Konsole tauchen plötzlich **zwei** Produkte auf — „Security Hub CSPM" und „Security Hub". Verwirrung, welches gemeint ist.

**Die Lösung:** Seit Ende 2025 hat AWS aufgeteilt:
- **Security Hub CSPM** (Cloud Security Posture Management) = der **klassische** Dienst, den das CLF-Recap beschreibt: Findings-Aggregation (ASFF) + CIS/PCI-Checks + Security Score.
- **AWS Security Hub** (neu, GA Dez. 2025) = ein **erweiterter** Dienst, der GuardDuty, Inspector, Macie und CSPM **korreliert** — mit **Exposure Findings**, **Attack-Path-Visualisierung** und dem offenen **OCSF**-Schema (statt ASFF), near-real-time Risk Analytics.

Für die SAA-C03-Prüfung bleibt der Reflex simpel: **„zentrale Security-Findings aggregieren / Compliance-Standards prüfen" → Security Hub.** Die neue OCSF-Version ist bislang selten prüfungsrelevant — man sollte sich nur in der Konsole nicht über die zwei Namen wundern.

> **💡 Merksatz:** 🛑 **Security Hub CSPM** = der klassische Aggregator (ASFF, CIS/PCI, Score); **neuer Security Hub** = Korrelation + Attack Path + OCSF. Prüfungsantwort bleibt „Security Hub".

---

## ⚠️ Prüfungs-Knackpunkte

- **Aggregator**, erzeugt keine eigenen Funde; normalisiert via **ASFF**. „single pane of glass / Findings zentralisieren" → Security Hub.
- Quellen: **GuardDuty, Inspector, Macie, Firewall Manager, IAM Access Analyzer** + Partner.
- **Security Standards**: FSBP, **CIS**, **PCI DSS**, NIST → **Security Score**.
- EventBridge-Integration + **Automation Rules** für Remediation; org-weit.
- 🛑 Rebranding: **CSPM** (klassisch, ASFF) vs. **neuer Security Hub** (OCSF, Attack Path) — Prüfungsantwort bleibt „Security Hub".
- Abgrenzung: **aggregiert** (vs. GuardDuty detektiert); **Security-Benchmarks** (vs. Audit Manager = Auditor-Evidence, Config = Konfig-Regeln).

## 💡 Der eine Satz zum Mitnehmen

**Security Hub ist der Knotenpunkt, an dem alle Security-Findings zusammenlaufen und automatisch gegen CIS/PCI/FSBP geprüft werden — es erkennt nichts selbst, sondern aggregiert, was GuardDuty, Inspector und Macie finden (in der Konsole seit 2025 als „CSPM" plus neuer korrelierender Security Hub).**
