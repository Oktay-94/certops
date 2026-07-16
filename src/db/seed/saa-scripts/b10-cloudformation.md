---
service: AWS CloudFormation
seedKey: saa-c03-script-cloudformation
batch: B10
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
  - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/what-is-cfnstacksets.html
  - https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html
status: draft
---

# AWS CloudFormation

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> CloudFormation = **Infrastructure as Code**: Man beschreibt die gesamte Infrastruktur in einem **Template** (YAML/JSON) → CloudFormation erstellt daraus einen **Stack** (alle Ressourcen). Reproduzierbar, versionierbar, per Klick löschbar. Abgrenzung: **CloudFormation = du baust Infrastruktur als Code; CDK = Programmiersprache, kompiliert zu CloudFormation; Beanstalk = nur App-Code, AWS baut.**

Der SAA vertieft: **StackSets für Multi-Account/Region, Change Sets und Drift Detection, Nested Stacks/DeletionPolicy — und die IaC-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### StackSets: ein Template über viele Accounts und Regionen

**Das Problem:** Eine Baseline (z. B. eine IAM-Rolle + Config-Setup) soll identisch in 50 Accounts und 3 Regionen ausgerollt werden. 150 Stacks einzeln zu deployen ist nicht wartbar.

**Die Lösung:** **StackSets** deployen **ein** Template mit **einer** Operation über **mehrere Accounts UND Regionen**. Mit **Organizations**-Integration erfolgt das **Auto-Deployment** auch für neu hinzukommende Accounts automatisch. Das ist die Antwort auf „konsistentes Deployment über viele Accounts/Regionen" (im Gegensatz zu einzelnen Stacks, die man pro Ziel manuell pflegen müsste). Drift lässt sich auf StackSet-Ebene erkennen.

> **💡 Merksatz:** **StackSets** = ein Template über **viele Accounts + Regionen** mit einer Operation; mit Organizations **Auto-Deployment** für neue Accounts. „konsistent über viele Accounts/Regionen" → StackSets.

### Change Sets und Drift Detection

**Das Problem 1:** Ein Update an einem produktiven Stack könnte versehentlich eine Datenbank ersetzen. Man will die Auswirkungen **vorher** sehen.

**Die Lösung 1:** Ein **Change Set** zeigt eine **Vorschau** der Änderungen, bevor man sie ausführt — welche Ressourcen geändert, ersetzt oder gelöscht würden. „Auswirkungen eines Stack-Updates vorab prüfen" → Change Set.

**Das Problem 2:** Jemand hat eine von CloudFormation verwaltete Security Group manuell in der Konsole geändert — der Stack „weiß" davon nichts mehr.

**Die Lösung 2:** **Drift Detection** erkennt Abweichungen zwischen dem erwarteten (Template-)Zustand und dem tatsächlichen Zustand. Wichtige Feinheit: Drift in **Nested Stacks** wird **nicht** automatisch miterkannt — man führt die Detection direkt auf dem Nested Stack aus; nicht unterstützte Ressourcen erscheinen als NOT_CHECKED. „manuelle Änderung an CFN-Ressource erkennen" → Drift Detection.

> **💡 Merksatz:** **Change Set** = Vorschau vor dem Update; **Drift Detection** = erkennt manuelle Abweichungen (Nested Stacks nicht automatisch — direkt prüfen).

### Nested Stacks, DeletionPolicy und die IaC-Abgrenzung

Drei prüfbare Bausteine:
- **Nested Stacks** zerlegen große Templates in wiederverwendbare Module (ein Root Stack referenziert Child Stacks). Termination Protection wird auf Nested Stacks vererbt.
- **DeletionPolicy** (`Retain`/`Snapshot`/`Delete`) steuert, was beim Stack-Löschen mit einer Ressource passiert — `Retain`/`Snapshot` schützt Daten (z. B. RDS-Snapshot beim Löschen). **Stack Policy** schützt Ressourcen **während Updates** (keine IAM-Zugriffskontrolle).
- Die **IaC-Abgrenzung**: **CloudFormation** = deklaratives AWS-IaC; **CDK** = imperativer Code (Python/TypeScript), der CloudFormation **generiert**; **Terraform** = multi-cloud IaC; **Elastic Beanstalk** = PaaS (App-Deployment, keine freie Infrastrukturbeschreibung); **Service Catalog** = kuratierte, genehmigte CFN-Produkte für Self-Service.

> **💡 Merksatz:** **Nested Stacks** (Module), **DeletionPolicy** Retain/Snapshot schützt Daten, **Stack Policy** schützt bei Updates. **CFN (deklarativ) vs. CDK (Code→CFN) vs. Terraform (multi-cloud) vs. Beanstalk (PaaS)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **StackSets** = ein Template über viele Accounts + Regionen; mit Organizations Auto-Deployment.
- **Change Set** = Update-Vorschau; **Drift Detection** = manuelle Abweichungen (Nested Stacks nicht automatisch).
- **Nested Stacks** (Module); **DeletionPolicy** Retain/Snapshot (Datenschutz beim Löschen); **Stack Policy** (Schutz bei Updates).
- IaC-Abgrenzung: **CFN (deklarativ) · CDK (Code→CFN) · Terraform (multi-cloud) · Beanstalk (PaaS) · Service Catalog (kuratierte CFN-Produkte)**.
- Sections: Resources (Pflicht), Parameters, Mappings, Outputs, Conditions.

## 💡 Der eine Satz zum Mitnehmen

**CloudFormation baut Infrastruktur deklarativ als Code — StackSets rollen ein Template über viele Accounts und Regionen aus, Change Sets zeigen Updates vorab, Drift Detection findet manuelle Abweichungen, und DeletionPolicy schützt Daten beim Löschen; CDK generiert CloudFormation, Beanstalk und Service Catalog spielen auf anderen Ebenen.**
