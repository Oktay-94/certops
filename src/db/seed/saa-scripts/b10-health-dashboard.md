---
service: AWS Health Dashboard
seedKey: saa-c03-script-health-dashboard
batch: B10
domains: [D2]
sourceRef:
  - https://docs.aws.amazon.com/health/latest/ug/what-is-aws-health.html
status: draft
---

# AWS Health Dashboard

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AWS Health Dashboard = die **Arztpraxis für dein AWS-Konto**. Zwei Varianten: **Service Health** (öffentlich, allgemeiner Status aller Dienste/Regionen — „läuft alles?", **nicht** kontospezifisch) und **Your account health** (früher Personal Health Dashboard — Ereignisse, die **speziell deine** Ressourcen betreffen, z. B. „eine deiner EC2 läuft auf Hardware, die gewartet werden muss"). Merksatz: **Service Health = AWS allgemein; Your account health = dein Konto persönlich.**

Der SAA vertieft: **die zwei Ansichten, die account-spezifischen Event-Typen, EventBridge-Integration — und die API-Support-Plan-Abhängigkeit.**

---

## 🎯 SAA-Vertiefung

### Öffentlich vs. account-spezifisch

**Das Problem:** Eine App hakt. Liegt es an AWS oder an den eigenen Ressourcen? Und wenn AWS: betrifft die Störung *meine* Region/Dienste?

**Die Lösung — die zwei Ansichten:**
- **Service health**: der **öffentliche**, generische Status aller AWS-Dienste in allen Regionen — für jeden ohne Login zugänglich, **nicht** kontospezifisch. Antwort auf „gibt es gerade eine allgemeine AWS-Störung".
- **Your account health**: **personalisiert** — zeigt nur Ereignisse, die **deine** Konten/Ressourcen betreffen: offene/kürzliche Issues, **Scheduled changes** (z. B. anstehendes **EC2-Instance-Retirement** oder Hardware-Wartung deiner Instanzen) und sonstige Benachrichtigungen — inklusive der konkret betroffenen Ressourcen.

Reflex: „allgemeiner AWS-weiter Status" → Service health; „Benachrichtigung über bevorstehendes Retirement/Wartung **meiner** Instanzen" → Your account health.

> **💡 Merksatz:** **Service health** = öffentlich/generisch (alle Dienste/Regionen); **Your account health** = personalisiert (deine Ressourcen, Scheduled changes wie EC2-Retirement). „meine Instanzen betroffen" → Your account health.

### EventBridge-Integration und API-Zugang

**Das Problem:** Man will automatisch reagieren, wenn AWS ein Retirement für eine eigene Instanz ankündigt — nicht manuell ins Dashboard schauen.

**Die Lösung:** Health-Events lassen sich über **EventBridge** empfangen (kostenlos für alle) und automatisiert verarbeiten (z. B. SNS-Benachrichtigung, Lambda-Reaktion). Die **AWS Health API** (programmatischer Zugriff, Organizational View über alle Accounts) ist jedoch nur mit **Business Support+/Enterprise** verfügbar — ohne höheren Support-Plan gibt es eine `SubscriptionRequiredException`. Das Dashboard selbst und der EventBridge-Empfang sind kostenlos. „automatisch auf account-spezifische Health-Events reagieren" → Health via EventBridge; „programmatischer org-weiter Zugriff" → Health API (Business Support+).

> **💡 Merksatz:** Health-Events via **EventBridge** (gratis, automatisierbar); **Health API** (org-weit/programmatisch) nur mit **Business Support+/Enterprise**.

---

## ⚠️ Prüfungs-Knackpunkte

- **Service health** (öffentlich, generisch) vs. **Your account health** (personalisiert, deine Ressourcen).
- „bevorstehendes EC2-Retirement/Wartung **meiner** Instanzen" → Your account health (Scheduled changes).
- Health-Events via **EventBridge** (gratis) automatisierbar; **Health API** nur mit **Business Support+/Enterprise**.
- Dashboard + EventBridge-Empfang kostenlos.

## 💡 Der eine Satz zum Mitnehmen

**Das AWS Health Dashboard trennt den öffentlichen Service-Status von der personalisierten Account-Sicht — Letztere warnt vor anstehenden Retirements und Wartungen deiner konkreten Ressourcen, lässt sich über EventBridge automatisieren, und der programmatische org-weite Zugriff braucht Business-Support-Plus.**
