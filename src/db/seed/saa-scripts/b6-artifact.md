---
service: AWS Artifact
seedKey: saa-c03-script-artifact
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/artifact/latest/ug/what-is-aws-artifact.html
  - https://aws.amazon.com/artifact/faq/
status: draft
---

# AWS Artifact

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Artifact = das **Download-Portal für AWS' eigene Compliance-Zertifikate**. Kostenlos, alle Konten haben Zugriff. Hier lädt man **AWS'** Audit-Nachweise herunter (SOC-Reports, ISO-Zertifikate, PCI-Attestierung) — die **AWS-Seite** der Shared Responsibility. Merksatz aus der Vierergruppe: **Audit Manager bereitet DEIN Audit vor, Artifact liefert AWS' eigene Zertifikate zum Download.**

Der SAA vertieft: **Reports vs. Agreements, die Shared-Responsibility-Einordnung — und die Abgrenzung zu Audit Manager.**

---

## 🎯 SAA-Vertiefung

### Reports: AWS' Compliance-Nachweise auf Abruf

**Das Problem:** Der eigene Auditor verlangt einen Nachweis, dass die **AWS-Infrastruktur** SOC-2- und ISO-27001-konform ist. Man kann AWS' Rechenzentren nicht selbst auditieren — aber der Prüfer will das Dokument sehen.

**Die Lösung:** **AWS Artifact Reports** ist das Self-Service-Portal, aus dem man **AWS' eigene Audit-Artefakte** on-demand herunterlädt: **SOC 1/2/3**, **ISO-Zertifizierungen**, **PCI DSS Attestation of Compliance**, C5, FedRAMP u. a. Das belegt gegenüber dem eigenen Auditor, dass die von AWS verantworteten Ebenen (Rechenzentren, Hardware, Hypervisor) zertifiziert sind — die **AWS-Seite** der Shared Responsibility. Die Reports sind vertraulich/gewässerzeichnet und nur mit vertrauenswürdigen Parteien zu teilen. Signalwort: „AWS' SOC-2-Report / Compliance-Nachweis von AWS herunterladen" → Artifact.

> **💡 Merksatz:** **Artifact Reports = AWS' eigene Zertifikate/Reports** (SOC, ISO, PCI) on-demand herunterladen — Nachweis für die **AWS-Seite** der Shared Responsibility.

### Agreements: BAA, DPA und Co.

**Das Problem:** Ein Gesundheits-Startup verarbeitet Patientendaten und muss für **HIPAA** ein **Business Associate Agreement (BAA)** mit AWS abschließen — org-weit für alle Konten.

**Die Lösung:** **AWS Artifact Agreements** ist der zweite Teil: Hier akzeptiert und verwaltet man rechtliche Vereinbarungen mit AWS — **BAA** (HIPAA), **DPA** (GDPR/Datenschutz), NDA. Das Management-Konto einer Organisation kann ein Agreement **org-weit für alle (auch künftige) Member-Konten** akzeptieren. Das ist die Antwort auf „BAA für HIPAA abschließen / DPA akzeptieren" → Artifact Agreements (nicht Audit Manager, nicht ein SCP).

> **💡 Merksatz:** **Artifact Agreements = rechtliche Vereinbarungen mit AWS** (BAA/HIPAA, DPA/GDPR, NDA); org-weit über das Management-Konto akzeptierbar.

### Die entscheidende Abgrenzung: Artifact vs. Audit Manager

**Das Problem:** Beide klingen nach „Compliance-Dokumente" — und stehen gern nebeneinander in den Antworten.

**Die Lösung:** Die Richtung entscheidet — es ist die **Shared-Responsibility-Grenze**:
- **Artifact** = **AWS'** Compliance-Nachweise **herunterladen** (was AWS für dich compliant macht — die Provider-Seite).
- **Audit Manager** = **deine eigene** Compliance-Evidence **sammeln** + Reports für Auditoren (deine Seite in der Cloud).

Merksatz: **Artifact liefert dir AWS' Hausaufgaben, Audit Manager erledigt deine.** „AWS' Report ziehen" → Artifact. „meine eigene Evidence sammeln" → Audit Manager.

> **💡 Merksatz:** **Artifact = AWS' Nachweise herunterladen (Provider-Seite), Audit Manager = eigene Evidence sammeln (Kunden-Seite).** Die Shared-Responsibility-Grenze entscheidet.

---

## ⚠️ Prüfungs-Knackpunkte

- **Artifact Reports**: AWS' eigene Zertifikate/Reports on-demand (SOC 1/2/3, ISO, PCI DSS AoC, FedRAMP) — AWS-Seite der Shared Responsibility.
- **Artifact Agreements**: **BAA** (HIPAA), **DPA** (GDPR), NDA; org-weit über Management-Konto akzeptierbar.
- Kostenlos, alle Konten; Reports vertraulich/gewässerzeichnet.
- Abgrenzung: **Artifact (AWS' Nachweise laden) ≠ Audit Manager (eigene Evidence sammeln)**; „AWS' SOC-2-Report" → Artifact, „BAA abschließen" → Artifact.

## 💡 Der eine Satz zum Mitnehmen

**Artifact ist der Download-Schalter für AWS' eigene Compliance-Welt: SOC-/ISO-/PCI-Reports als Nachweis der Provider-Seite und BAA/DPA-Agreements zum Akzeptieren — während Audit Manager spiegelbildlich deine eigene Evidence sammelt.**
