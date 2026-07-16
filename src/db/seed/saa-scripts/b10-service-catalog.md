---
service: AWS Service Catalog
seedKey: saa-c03-script-service-catalog
batch: B10
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/servicecatalog/latest/adminguide/introduction.html
  - https://docs.aws.amazon.com/servicecatalog/latest/adminguide/constraints.html
status: draft
---

# AWS Service Catalog

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Service Catalog = der **genehmigte Bestellkatalog der IT**. Admins definieren erlaubte **Produkte** als CloudFormation-Templates („Standard-Webserver"), Mitarbeiter starten sie per Klick — **ohne volle Konsolen-Rechte** und ohne Detailwissen. **Self-Service mit Governance**, Standardisierung, Compliance. Abgrenzung: **CloudFormation = du baust; Service Catalog = Admins kuratieren erlaubte CFN-Produkte für Endnutzer.**

Der SAA vertieft: **Products/Portfolios, die Constraints (v. a. Launch Constraint), Organizations-Sharing — und die Rolle im Governance-Stack.**

---

## 🎯 SAA-Vertiefung

### Products, Portfolios und der Launch Constraint

**Das Problem:** Entwickler sollen sich selbst eine standardkonforme Datenbank erstellen können — aber ohne die breiten IAM-Rechte, die zum Provisionieren einer RDS-Instanz nötig wären (und die man ihnen nicht geben will).

**Die Lösung:** Ein **Product** ist ein Blueprint (auf CloudFormation-Template basierend), ein **Portfolio** bündelt Produkte + Zugriffssteuerung, ein **Provisioned Product** ist der erzeugte Stack. Der entscheidende Mechanismus ist der **Launch Constraint**: Er hinterlegt eine **IAM-Rolle**, mit der das Produkt provisioniert wird — der Endnutzer braucht dadurch **keine** eigenen breiten Rechte, sondern nur die Berechtigung, das Produkt zu starten. So bekommt man Self-Service **ohne** Rechte-Wildwuchs. „Nutzer sollen Ressourcen erstellen können, ohne selbst volle IAM-Rechte zu haben" → Service Catalog mit Launch Constraint.

> **💡 Merksatz:** **Product** (CFN-Blueprint) · **Portfolio** (Bündel + Zugriff) · **Provisioned Product** (Stack). **Launch Constraint** = IAM-Rolle fürs Provisioning → Nutzer brauchen keine breiten Rechte.

### Weitere Constraints und Sharing

**Das Problem:** Nutzer sollen nur bestimmte Instance-Typen wählen dürfen, und der Katalog soll org-weit verfügbar sein.

**Die Lösung — die übrigen Constraints und das Sharing:**
- **Template Constraints** schränken erlaubte Parameter ein (z. B. nur `t3.micro`/`t3.small`) — Governance über die Ausprägung.
- **Notification Constraints** senden Events an SNS.
- Der **restriktivste** Constraint gewinnt.
- **Portfolios** lassen sich über **Organizations** teilen — ein zentraler Katalog für die ganze Firma. (Die Control-Tower **Account Factory** ist selbst ein Service-Catalog-Produkt.)

„erlaubte Instance-Typen erzwingen" → Template Constraint; „Katalog org-weit teilen" → Organizations-Sharing.

> **💡 Merksatz:** **Template Constraints** (erlaubte Parameter/Instance-Typen), **Notification Constraints** (SNS); restriktivster gewinnt. Portfolios via **Organizations** teilbar.

### Die Rolle im Governance-Stack

**Das Problem:** CloudFormation, Service Catalog und Beanstalk klingen alle nach „Ressourcen bereitstellen".

**Die Lösung — die Rollen:**
- **CloudFormation** = das **IaC-Werkzeug** selbst (Templates → Stacks).
- **Service Catalog** = die **Governance-/Self-Service-Schicht** darüber: Admins kuratieren genehmigte CFN-Produkte, Endnutzer wählen nur daraus.
- **Elastic Beanstalk** = **PaaS** (App-Code deployen).

Reflex: „genehmigte Produkte für Self-Service ohne volle Rechte" → Service Catalog; „Infrastruktur selbst als Code definieren" → CloudFormation; „App einfach deployen" → Beanstalk.

> **💡 Merksatz:** **CloudFormation = IaC-Werkzeug; Service Catalog = kuratierte Self-Service-Governance darüber; Beanstalk = PaaS.** „genehmigte Produkte ohne volle Rechte" → Service Catalog.

---

## ⚠️ Prüfungs-Knackpunkte

- **Product** (CFN-Blueprint), **Portfolio** (Bündel + Zugriff), **Provisioned Product** (Stack).
- **Launch Constraint** (IAM-Rolle fürs Provisioning) → Nutzer ohne breite Rechte — das Kernfeature.
- **Template Constraints** (erlaubte Parameter), **Notification Constraints** (SNS); restriktivster gewinnt.
- Portfolios via **Organizations** teilbar; Account Factory ist ein Service-Catalog-Produkt.
- Abgrenzung: **CloudFormation (IaC) · Service Catalog (kuratierte Self-Service-Governance) · Beanstalk (PaaS)**.

## 💡 Der eine Satz zum Mitnehmen

**Service Catalog ist der genehmigte Self-Service-Katalog: Admins kuratieren CloudFormation-Produkte, der Launch Constraint provisioniert sie mit einer IAM-Rolle, sodass Endnutzer Ressourcen erstellen können, ohne selbst breite Rechte zu besitzen — Governance über dem reinen IaC-Werkzeug CloudFormation.**
