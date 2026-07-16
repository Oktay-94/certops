---
service: AWS Resource Access Manager (RAM)
seedKey: saa-c03-script-ram
batch: B5
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/ram/latest/userguide/what-is.html
  - https://aws.amazon.com/ram/
status: draft
---

# AWS Resource Access Manager (RAM)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> RAM = **Ressourcen über Konten teilen, ohne sie zu duplizieren**. Eine Ressource einmal erstellen, in mehreren Konten der Organisation nutzen — statt in jedem Konto dasselbe nachzubauen.

Der SAA vertieft: **Was genau teilbar ist (v. a. VPC-Subnetze), das Owner-vs-Participant-Modell — und die Abgrenzung zu Resource Policies und Organizations.**

---

## 🎯 SAA-Vertiefung

### VPC Sharing: Der Klassiker

**Das Problem:** Ein Konzern will die Netzwerk-Infrastruktur zentral halten: Ein Netzwerk-Team verwaltet **eine** VPC mit sauberen Subnetzen, Route Tables und Firewall-Regeln. Zehn App-Teams in eigenen Konten sollen ihre Server aber **in genau diesen Subnetzen** betreiben — ohne dass jedes Team seine eigene VPC baut (was VPC-Peering-Chaos und Adress-Wildwuchs bedeutet).

**Die Lösung:** Mit **RAM** teilt das Netzwerk-Team seine **Subnetze** direkt mit den App-Konten. Die geteilten Subnetze erscheinen in deren VPC-Konsole, **als wären sie eigene** — die App-Teams starten dort EC2, RDS, Lambda. Die Rollenverteilung ist prüfungsrelevant:
- Der **Owner** verwaltet Subnetz, Route Tables und NACLs — und behält die volle Kontrolle darüber.
- Der **Participant** darf Ressourcen **hineinlegen** (EC2 etc.) und seine **eigenen Security Groups** verwalten, aber die geteilten Subnetze **nicht ändern oder löschen**.

Ein häufiger Distraktor: „RAM verbindet zwei VPCs" — nein. **RAM teilt Ressourcen, es routet nichts.** Für VPC-zu-VPC-Verbindungen bleiben Peering / Transit Gateway zuständig. Neben Subnetzen sind u. a. **Transit Gateways, Route-53-Resolver-Regeln, License-Manager-Konfigurationen, Private CA und Outposts** teilbar.

> **💡 Merksatz:** **RAM teilt VPC-Subnetze** (u. a.): Owner behält Route Tables/NACLs, Participant legt nur Ressourcen hinein (eigene SGs). RAM **teilt Ressourcen, routet aber nicht** (dafür Peering/TGW).

### Das Zusammenspiel mit Organizations

**Das Problem:** Jede geteilte Ressource einzeln per Einladung freizugeben und im Zielkonto bestätigen zu lassen, ist bei 60 Konten mühsam.

**Die Lösung:** Ist **Sharing innerhalb der Organisation** aktiviert, werden Shares an Konten oder ganze OUs **ohne Einladung automatisch akzeptiert** — man teilt einmal an die OU, und alle Konten darin haben Zugriff. Externe Konten (außerhalb der Org) durchlaufen dagegen einen **Einladungs-Prozess**. Das ist der Grund, warum RAM und Organizations in Multi-Account-Szenarien zusammen auftreten.

> **💡 Merksatz:** Mit **Organizations-Sharing** werden Shares an Konten/OUs **ohne Einladung** aktiv; externe Konten brauchen eine Einladung.

### Die Abgrenzung: Ressourcen vs. Zugriff vs. Konten

Drei Dienste klingen nach „teilen", meinen aber Verschiedenes — das ist die eigentliche Prüfungsunterscheidung:
- **RAM** teilt **Ressourcen** (die Ressource selbst wird in anderen Konten nutzbar: Subnetz, TGW, Resolver Rule).
- **Resource-based Policy** teilt **Zugriff** auf **eine** Ressource (fremder Principal darf auf *meinen* Bucket zugreifen — die Ressource bleibt in meinem Konto).
- **Organizations** strukturiert **Konten** und Billing (der Rahmen, in dem RAM ohne Einladung funktioniert).

Reflex: „Subnetz/Transit Gateway/Resolver Rule mehreren Konten bereitstellen" → **RAM**. „Fremdes Konto darf auf meinen S3-Bucket/meine SQS" → **Resource-based Policy**. „Konten gruppieren, Guardrails, Billing" → **Organizations**.

> **💡 Merksatz:** **RAM = Ressource teilen · Resource Policy = Zugriff auf eine Ressource · Organizations = Konten strukturieren.**

---

## ⚠️ Prüfungs-Knackpunkte

- **RAM teilt Ressourcen ohne Duplikation:** v. a. **VPC-Subnetze**, Transit Gateways, Route-53-Resolver-Rules, License Manager, Private CA, Outposts.
- **VPC Sharing:** Owner verwaltet Subnetz/Route Tables/NACLs; Participant legt Ressourcen hinein + eigene Security Groups, kann Subnetz nicht ändern/löschen.
- **RAM routet nicht** — VPC-zu-VPC-Verbindung bleibt Peering/TGW.
- Mit **Organizations-Sharing**: Shares an Konten/OUs ohne Einladung; externe Konten per Einladung.
- Abgrenzung: **RAM (Ressourcen) · Resource-based Policy (Zugriff auf eine Ressource) · Organizations (Konten)**.

## 💡 Der eine Satz zum Mitnehmen

**RAM beantwortet „wie stelle ich dieselbe Infrastruktur mehreren Konten bereit, ohne sie zu duplizieren?" — meist geht es um geteilte VPC-Subnetze, bei denen der Owner das Netz kontrolliert und die Participants nur ihre Workloads hineinstellen.**
