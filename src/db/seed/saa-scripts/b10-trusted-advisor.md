---
service: AWS Trusted Advisor
seedKey: saa-c03-script-trusted-advisor
batch: B10
domains: [D1, D3, D4]
sourceRef:
  - https://docs.aws.amazon.com/awssupport/latest/user/trusted-advisor.html
  - https://aws.amazon.com/premiumsupport/technology/trusted-advisor/
status: draft
---

# AWS Trusted Advisor

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Trusted Advisor = der **kostenlose Unternehmensberater, der ungefragt dein Konto durchleuchtet** — ein Dashboard mit grün/gelb/rot gegen AWS-Best-Practices. **Fünf Kategorien (auswendig!):** Cost Optimization, Performance, Security, Fault Tolerance, Service Limits. Der Haken, den die Prüfung liebt: Der **volle Check-Umfang** kommt erst mit **Business/Enterprise Support**; Basic/Developer nur Kern-Checks.

Der SAA vertieft: **die fünf Kategorien, die Support-Plan-Abhängigkeit, Priority — und die Abgrenzung zu Config/Compute Optimizer.**

---

## 🎯 SAA-Vertiefung

### Die fünf Kategorien

**Das Problem:** Läuft das Konto nicht nur, sondern auch *gut*? Überteuerte Idle-Server, ein öffentlicher S3-Bucket, fehlendes Root-MFA, ein nahes Service-Limit — niemand prüft das ständig manuell.

**Die Lösung:** Trusted Advisor scannt kontinuierlich in **fünf Kategorien** (das prüfbare Kernwissen — beliebte Frage „welche ist KEINE Kategorie?"):
- **Cost Optimization**: „diese EC2 ist kaum ausgelastet — verkleinern."
- **Performance**: „dieses EBS-Volume bremst die Instanz."
- **Security**: „S3-Bucket öffentlich!", „Root-MFA fehlt!".
- **Fault Tolerance**: „DB ohne Multi-AZ."
- **Service Limits**: „80 % des EC2-Limits erreicht."

> **💡 Merksatz:** Fünf Kategorien: **Cost Optimization, Performance, Security, Fault Tolerance, Service Limits**. „welche ist KEINE?" — auswendig.

### Die Support-Plan-Abhängigkeit

**Das Problem:** Ein Team wundert sich, warum es nur eine Handvoll Checks sieht.

**Die Lösung:** Der Umfang hängt am **Support-Plan** — die klassische Prüfungsfrage:
- **Basic/Developer**: nur ein Kern-Satz (alle **Service-Limit-Checks** + ausgewählte Security-/Fault-Tolerance-Checks) — 🔴 aktuell **56 Checks**.
- **Business Support+ / Enterprise**: der **volle Umfang** — 🔴 insgesamt **482 Checks** (Stand 2026).
- **Trusted Advisor Priority**: nur Enterprise Support.

„voller Trusted-Advisor-Umfang" → Business/Enterprise Support. (🛑 Business Support Legacy läuft 1.1.2027 aus, Migration zu Business Support+.)

> **💡 Merksatz:** Voller Check-Umfang nur mit **Business/Enterprise Support** (🔴 56 free → 482 total). Basic/Developer nur Kern-Checks. Priority = Enterprise.

### Die Abgrenzung: Trusted Advisor vs. Config vs. Compute Optimizer vs. Well-Architected

**Das Problem:** Mehrere Dienste „bewerten" das Konto.

**Die Lösung — die Rollen:**
- **Trusted Advisor** = **generische** Best-Practice-Checks über 5 Kategorien (AWS-vordefiniert, breit).
- **Config** = **deine eigenen** Compliance-Regeln über Konfigurationszustand.
- **Compute Optimizer** = tiefes **ML-Rightsizing** einzelner Ressourcen.
- **Well-Architected Tool** = frage-basiertes **Säulen-Review** (6 Säulen) für ein formales Architektur-Assessment.
- **Inspector** = Schwachstellen/CVEs.

Reflex: „generische Best-Practice-Checks über Cost/Security/Performance/…" → Trusted Advisor; „eigene Compliance-Regeln" → Config; „optimale Instanzgröße" → Compute Optimizer; „formales 6-Säulen-Review" → Well-Architected.

> **💡 Merksatz:** **Trusted Advisor (generische Checks, 5 Kategorien) vs. Config (eigene Regeln) vs. Compute Optimizer (ML-Rightsizing) vs. Well-Architected Tool (6-Säulen-Review) vs. Inspector (Schwachstellen)**.

---

## ⚠️ Prüfungs-Knackpunkte

- Fünf Kategorien: **Cost Optimization, Performance, Security, Fault Tolerance, Service Limits** (auswendig).
- Voller Umfang nur mit **Business/Enterprise Support** (🔴 56 free → 482 total); Priority = Enterprise.
- Abgrenzung: **Trusted Advisor (generisch) vs. Config (eigene Regeln) vs. Compute Optimizer (Rightsizing) vs. Well-Architected (6 Säulen) vs. Inspector (Schwachstellen)**.
- 🛑 Business Support (Legacy) endet 1.1.2027.

## 💡 Der eine Satz zum Mitnehmen

**Trusted Advisor prüft das Konto generisch gegen Best Practices in fünf Kategorien — Cost, Performance, Security, Fault Tolerance und Service Limits — aber den vollen Check-Umfang gibt es erst mit Business- oder Enterprise-Support, und für eigene Regeln, Rightsizing oder ein 6-Säulen-Review sind Config, Compute Optimizer bzw. das Well-Architected Tool zuständig.**
