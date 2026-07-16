---
service: AWS Serverless Application Repository (SAR)
seedKey: saa-c03-script-serverless-application-repository
batch: B3
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/serverlessrepo/latest/devguide/what-is-serverlessrepo.html
  - https://aws.amazon.com/serverless/serverlessrepo/faqs/
status: draft
---

# AWS Serverless Application Repository

## 📋 CLF-Recap

> *Kein CLF-Skript vorhanden — dieser Dienst ist NEU im SAA-Track.* Kurzeinordnung: **Der App-Store für fertige Serverless-Anwendungen** — SAM-Templates (Lambda + API Gateway + DynamoDB + …) veröffentlichen, finden und mit wenigen Klicks im eigenen Konto ausrollen. Kleiner Dienst, kleines Skript — aber er taucht im Exam Guide auf.

---

## 🎯 SAA-Vertiefung

### Das Rad, das schon jemand gebaut hat

**Das Problem:** Fünf Teams in derselben Firma bauen jeweils ihre eigene Lambda-Funktion, die S3-Uploads virenscannt oder Slack-Benachrichtigungen verschickt. Fünfmal derselbe Code, fünfmal eigene IAM-Rollen, fünfmal ein anderer Reifegrad. Und ein neues Team, das dasselbe braucht, fängt bei null an.

**Die Lösung:** **SAR** ist ein Repository für **fertige, deploybare Serverless-Anwendungen** — beschrieben als **AWS SAM-Templates** (Manifest + Code). Man findet sie, gibt ein paar Parameter an, und die Anwendung wird per **CloudFormation** im eigenen Konto ausgerollt. Zwei Sichtbarkeiten:
- **Public:** von jedem nutzbar (die „öffentliche Bibliothek").
- **Private:** über **Resource-based Policies** nur für bestimmte Konten oder die eigene **AWS Organization** freigegeben — das ist der eigentlich prüfungsrelevante Fall: **wiederverwendbare Serverless-Bausteine firmenintern teilen.**

Der Dienst selbst ist **kostenlos** — bezahlt werden nur die Ressourcen, die die deployte Anwendung erzeugt.

> **💡 Merksatz:** SAR = **Marktplatz für SAM-Templates**. Signalwort: „Serverless-Anwendung firmenintern **teilen und wiederverwenden**" → SAR (privat, per Organization).

### Die Abgrenzung — hier fällt die Entscheidung

Vier Dienste, die alle irgendwie „Vorlagen ausrollen", und die Prüfung liebt die Verwechslung:

| Das Szenario sagt … | Antwort |
|---|---|
| **Serverless**-Anwendungen (SAM) veröffentlichen/finden/teilen | **SAR** |
| Serverless-Apps *entwickeln* und deployen (CLI/Framework) | **AWS SAM** |
| Beliebige Infrastruktur als Code beschreiben | **CloudFormation** (SAR nutzt es zum Deployen) |
| **Kuratierte, IT-genehmigte Produktkataloge** für Fachabteilungen, mit Governance/Freigaben | **Service Catalog** |

Die feine Linie zu **Service Catalog**: Beide „verteilen Vorlagen". Aber Service Catalog ist ein **Governance-Werkzeug** — die IT gibt genehmigte Produkte frei, kontrolliert Berechtigungen und Versionen, für *beliebige* Infrastruktur. SAR ist ein **Katalog für Serverless-Anwendungen** — leichtgewichtig, entwicklerzentriert. Signalwörter „Governance, genehmigte Produkte, Fachabteilungen dürfen nur X starten" → **Service Catalog**, nicht SAR.

> **💡 Merksatz:** **SAR = Serverless-App-Store (Entwickler) · Service Catalog = genehmigter Produktkatalog (Governance) · SAM = das Framework · CloudFormation = die Maschine darunter.**

---

## ⚠️ Prüfungs-Knackpunkte

- Fertige **Serverless-Anwendungen** finden, veröffentlichen, wiederverwenden → **SAR** (SAM-Templates, Deployment via CloudFormation).
- **Privat teilen** über Resource-based Policies mit bestimmten Konten oder der **AWS Organization** — der typische Firmen-Use-Case.
- SAR selbst ist **kostenlos**; bezahlt werden nur die deployten Ressourcen.
- Abgrenzung: **Service Catalog** = kuratierte, genehmigte Produkte + Governance (beliebige Infra); **SAM** = Entwicklungs-Framework; **CloudFormation** = Deployment-Engine.

## 💡 Der eine Satz zum Mitnehmen

**SAR ist der App-Store für Serverless-Bausteine** — die Prüfungsfrage lautet fast immer „teilen und wiederverwenden (SAR)" versus „genehmigen und kontrollieren (Service Catalog)".
