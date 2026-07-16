---
service: AWS Audit Manager
seedKey: saa-c03-script-audit-manager
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/audit-manager/latest/userguide/what-is.html
  - https://docs.aws.amazon.com/audit-manager/latest/userguide/audit-manager-availability-change.html
status: draft
---

# AWS Audit Manager

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Audit Manager = der **automatische Compliance-Buchhalter**, der laufend **Nachweise (Evidence)** für Audits sammelt und prüfungsfertige Berichte erstellt. Fertige **Frameworks** (PCI DSS, GDPR, HIPAA, SOC 2), automatische Beweissammlung aus CloudTrail/Config/Security Hub — kein Screenshot-Sammeln mehr. Merksatz: **Audit Manager bereitet DEIN Audit vor, Config prüft Konfigurationsregeln, Artifact liefert AWS' eigene Zertifikate.**

Der SAA vertieft: **die Evidence-Automatisierung, die Abgrenzung zu Security Hub/Config/Artifact — und den Maintenance-Mode ab 2026.**

---

## 🎯 SAA-Vertiefung

### Evidence sammeln statt Screenshots jagen

**Das Problem:** Vor jedem PCI-DSS-Audit beginnt die Quälerei: manuell Beweise zusammentragen — Screenshots von Einstellungen, Log-Auszüge, Konfigurations-Exporte — und für jede Anforderung belegen, dass sie erfüllt ist. Wochen Arbeit, fehleranfällig, bei jedem Audit von vorn.

**Die Lösung:** Audit Manager **automatisiert die Evidence-Sammlung**: Man wählt ein vorgefertigtes **Framework** (SOC 2, PCI DSS, HIPAA, GDPR, NIST 800-53, CIS u. a.), und Audit Manager sammelt **kontinuierlich** die relevanten Nachweise aus **CloudTrail, AWS Config, Security Hub und License Manager** — automatisch den passenden Controls zugeordnet. Am Ende steht ein **Assessment Report** mit kryptografischer Verifikation (eine Checksum belegt, dass die Evidence unverändert ist), den man dem externen Prüfer direkt übergibt. Manuelle Uploads für Nachweise außerhalb AWS sind möglich. Das ist die Antwort auf „Compliance-Evidence für ein Audit sammeln / prüfungsfertige Berichte" → Audit Manager.

> **💡 Merksatz:** Audit Manager sammelt **kontinuierlich Evidence** (aus CloudTrail/Config/Security Hub) entlang fertiger **Frameworks** → **Assessment Report** für den Auditor. „Evidence sammeln / Audit vorbereiten" → Audit Manager.

### Die Compliance-Vierergruppe: Wer macht was?

**Das Problem:** Audit Manager, Security Hub, Config und Artifact klingen alle nach „Compliance". Die Prüfung stellt sie gegeneinander.

**Die Lösung — die vier sauber getrennt:**
- **Audit Manager** = **eigene** Compliance-Evidence sammeln + Berichte **für externe Auditoren** (deine Seite der Shared Responsibility).
- **Security Hub** = laufende **Security-Posture** gegen Benchmarks (CIS/PCI-Checks + Score) — Betrieb, nicht Audit-Paket.
- **AWS Config** = **Konfigurations-Compliance** auf Ressourcenebene (Config Rules: „ist dieser Bucket verschlüsselt?" + Historie).
- **AWS Artifact** = **AWS' eigene** Compliance-Zertifikate herunterladen (die AWS-Seite der Shared Responsibility).

Der Reflex: „**Evidence für meinen Auditor** sammeln" → Audit Manager. „laufende Security-Checks + Score" → Security Hub. „weicht diese **Ressource** von einer Regel ab?" → Config. „**AWS'** SOC-2-Report herunterladen" → Artifact.

> **💡 Merksatz:** **Audit Manager = eigene Evidence/Auditor-Report · Security Hub = Security-Posture · Config = Ressourcen-Konfig · Artifact = AWS' eigene Zertifikate.**

### 🛑 Maintenance-Mode ab 2026

**Wichtig für aktuelle Fragen:** AWS hat für Audit Manager eine **Availability Change** angekündigt — ab dem **30. April 2026** ist der Dienst **nicht mehr für Neukunden** offen (Übergang in den Maintenance Mode). Bestandskunden können ihn weiter nutzen (auch neue Assessments in bereits eingerichteten Konten/Regionen), aber keine neuen Konten/Regionen/Organisationen hinzufügen. AWS verweist als Ersatz u. a. auf **Config Conformance Packs** und Partner-Tools. Für die Prüfung bleibt die konzeptionelle Rolle (Evidence-Sammlung für Audits) die Antwort — die Verfügbarkeitsänderung ist ein Aktualitäts-Hinweis, kein neues Konzept.

> **💡 Merksatz:** 🛑 Audit Manager ab **30.04.2026 keine Neukunden** (Maintenance Mode); Bestand nutzt weiter. Konzeptionell bleibt es die „Audit-Evidence"-Antwort.

---

## ⚠️ Prüfungs-Knackpunkte

- Automatisiert **Evidence-Sammlung** aus CloudTrail/Config/Security Hub entlang **Frameworks** (SOC 2, PCI DSS, HIPAA, GDPR, NIST, CIS).
- **Assessment Report** mit Checksum → für externe Auditoren.
- Abgrenzung: **Audit Manager (Auditor-Evidence) · Security Hub (Security-Posture/Score) · Config (Ressourcen-Konfig) · Artifact (AWS' Zertifikate)**.
- „Evidence für Audit sammeln / prüfungsfertiger Bericht" → Audit Manager.
- 🛑 **Ab 30.04.2026 keine Neukunden** (Maintenance Mode); Bestand nutzt weiter.

## 💡 Der eine Satz zum Mitnehmen

**Audit Manager sammelt automatisch die Nachweise für dein externes Audit und gießt sie in prüfungsfertige Reports — abzugrenzen von Security Hub (laufende Posture), Config (Ressourcen-Konfiguration) und Artifact (AWS' eigene Zertifikate); ab April 2026 aber nur noch für Bestandskunden.**
