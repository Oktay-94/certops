---
service: AWS Config
seedKey: saa-c03-script-config
batch: B10
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html
  - https://docs.aws.amazon.com/config/latest/developerguide/evaluate-config.html
  - https://docs.aws.amazon.com/config/latest/developerguide/remediation.html
status: draft
---

# AWS Config

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Config = der **penibelste Inventar-Prüfer mit fotografischem Gedächtnis**. Zwei Dinge: **Inventar mit Verlauf** (jede Konfigurationsänderung wird gespeichert → „diese SG hatte Port 22 offen vom 3.–17. Mai, geändert von User X" → beantwortet „**WIE ist/war meine Ressource konfiguriert**") und **Config Rules** (permanente Compliance-Prüfung, markiert **non-compliant**, optional **Auto-Remediation**). Trio: „War der Server jemals unverschlüsselt?" → **Config**.

Der SAA vertieft: **Configuration Items, managed vs. custom Rules, Conformance Packs, Remediation via SSM, Aggregators — und die CloudTrail-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Configuration Items und Rules

**Das Problem:** Eine Firma muss nachweisen, dass alle S3-Buckets durchgehend verschlüsselt waren — und automatisch gegensteuern, wenn jemand eine Regel verletzt.

**Die Lösung:** Der **Configuration Recorder** erfasst kontinuierlich **Configuration Items (CI)** — Snapshots des Zustands jeder Ressource bei jeder Änderung. Darauf laufen **Config Rules**:
- **Managed Rules**: AWS-vordefiniert (z. B. `s3-bucket-server-side-encryption-enabled`, `restricted-ssh`).
- **Custom Rules**: eigene Logik via Lambda oder Guard.
- Modi: **detective** (nach der Änderung bewerten) und **proactive** (schon vor dem Deployment prüfen).

Kostenrelevant (🔴): Abgerechnet wird pro CI (continuous ~$0,003, periodic ~$0,012) — hochfrequente Ressourcen (ENIs, Security Groups, ASG-Instanzen) treiben die Kosten. Anders als die CloudTrail-Grundfunktion ist Config **nicht kostenlos** und muss aktiviert werden.

> **💡 Merksatz:** **Configuration Recorder** erfasst **Configuration Items**; **Config Rules** (managed/custom, detective/proactive) prüfen Compliance. Abgerechnet pro CI (🔴); Config ist nicht gratis.

### Conformance Packs und Remediation

**Das Problem:** Man will nicht dutzende Rules einzeln pflegen, sondern ein komplettes Compliance-Framework (z. B. PCI-DSS) als Einheit — und Verstöße automatisch beheben.

**Die Lösung:**
- **Conformance Packs** bündeln viele Rules + Remediation-Aktionen als **eine** deploybare Einheit (vorgefertigt für PCI-DSS, CIS, HIPAA u. a.) — das skaliert Governance über Accounts.
- **Auto-Remediation** hängt an eine Rule ein **SSM Automation Document**: Wird eine Ressource non-compliant, korrigiert Config sie automatisch (z. B. Verschlüsselung nachziehen, offene SG schließen). „Verstoß automatisch rückgängig machen" → Config Rule + SSM Automation.

> **💡 Merksatz:** **Conformance Packs** = Rules + Remediation als eine Einheit (PCI/CIS/HIPAA). **Auto-Remediation** via **SSM Automation Document** korrigiert non-compliant Ressourcen automatisch.

### Aggregators und die CloudTrail-Abgrenzung

**Aggregators** sammeln Compliance-/Config-Daten über **mehrere Accounts und Regionen** in einer Sicht — die Antwort auf „org-weite Compliance-Übersicht" (analog zum Organization Trail bei CloudTrail, aber für Konfigurationszustand statt API-Events).

Die **CloudTrail-Abgrenzung** ist die geprüfte Feinheit: **Config** zeigt, *dass* sich eine Konfiguration geändert hat und *wie* sie zu jedem Zeitpunkt aussah; **CloudTrail** zeigt, *wer* den auslösenden API-Aufruf gemacht hat. Frage „ist die Ressource compliant / wie war ihr Zustand" → Config; „wer hat sie geändert" → CloudTrail. Und gegen Trusted Advisor/Inspector: Config prüft **deine eigenen** Regeln, Trusted Advisor gibt generische Best-Practice-Checks, Inspector findet Schwachstellen.

> **💡 Merksatz:** **Aggregators** = Multi-Account/Region-Compliance-Sicht. **Config (Zustand/compliant) vs. CloudTrail (wer rief auf)**; Config = deine Regeln, Trusted Advisor = generische Checks, Inspector = Schwachstellen.

---

## ⚠️ Prüfungs-Knackpunkte

- **Configuration Recorder** → **Configuration Items**; **Config Rules** (managed/custom, detective/proactive).
- **Conformance Packs** (Rules + Remediation als Einheit); **Auto-Remediation** via **SSM Automation Document**.
- **Aggregators** für Multi-Account/Region-Compliance.
- Trio: **Config (Konfigurationszustand/compliant) vs. CloudTrail (wer) vs. CloudWatch (Performance)**.
- Config ist **nicht kostenlos** (🔴 pro CI), muss aktiviert werden; Kostentreiber = hochfrequente Ressourcen.
- Config = eigene Regeln; **Trusted Advisor** = generische Checks; **Inspector** = Schwachstellen.

## 💡 Der eine Satz zum Mitnehmen

**Config ist das Gedächtnis für Konfigurationszustand und Compliance: Configuration Items zeichnen jede Änderung auf, Rules und Conformance Packs bewerten sie, SSM-Remediation korrigiert automatisch — und es beantwortet „wie war/ist die Ressource konfiguriert", während CloudTrail beantwortet, wer sie geändert hat.**
