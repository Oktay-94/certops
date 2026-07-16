---
service: AWS AppConfig
seedKey: saa-c03-script-appconfig
batch: B10
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/appconfig/latest/userguide/what-is-appconfig.html
  - https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-creating-deployment-strategy.html
status: draft
---

# AWS AppConfig

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AppConfig (Teil von Systems Manager) ist im CLF-Kurs nicht vertieft — hier die Einordnung: AppConfig verwaltet **dynamische Laufzeit-Konfiguration** und **Feature Flags** getrennt vom Code. Man ändert Konfiguration/Features **ohne Redeploy** — mit **sicheren, überwachten Rollouts** und automatischem Rollback. Abgrenzung: **Parameter Store = einfache Key-Value-Speicherung; AppConfig = sichere, gesteuerte Ausrollung von Config-Änderungen.**

Der SAA vertieft: **Feature Flags, Deployment-Strategien mit Validierung/Rollback, Alarm-basierten Rollback — und die Parameter-Store-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Feature Flags und dynamische Konfiguration

**Das Problem:** Ein neues Feature soll zur Laufzeit für ausgewählte Nutzer aktiviert werden — ohne die Anwendung neu zu deployen, und mit der Möglichkeit, es sofort wieder abzuschalten, falls es Probleme macht.

**Die Lösung:** **AppConfig** trennt **Konfiguration von Code**. Man definiert **Feature Flags** oder Freeform-Konfiguration (Application → Environment → Configuration Profile); die Anwendung holt die aktuelle Config zur Laufzeit über den **AppConfig Agent**. So schaltet man Features um oder ändert Parameter **ohne Neu-Deployment** — und kann sie bei Bedarf sofort zurücknehmen. „Feature zur Laufzeit umschalten ohne Redeploy" → AppConfig.

> **💡 Merksatz:** **AppConfig** = Feature Flags + dynamische Config getrennt vom Code (Application→Environment→Profile), zur Laufzeit über den **AppConfig Agent** — ändern **ohne Redeploy**.

### Sichere Rollouts: Validierung, Strategie, Rollback

**Das Problem:** Eine fehlerhafte Config-Änderung könnte die ganze Flotte auf einmal lahmlegen.

**Die Lösung — die Sicherheitsmechanik:**
- **Validators** (JSON Schema oder Lambda) prüfen die Konfiguration **vor** dem Ausrollen — verhindern kaputte Configs.
- **Deployment-Strategien** (all-at-once, linear, gradual) mit **Deployment time** + **Bake time** rollen die Änderung **schrittweise** aus statt auf einen Schlag.
- **Automatischer Rollback**: Geht ein zugeordneter **CloudWatch-Alarm** während des Deployments in **ALARM** (oder INSUFFICIENT_DATA), rollt AppConfig automatisch zurück.

Das ist der Kernunterschied zu Parameter Store: nicht nur speichern, sondern **kontrolliert und sicher ausrollen**. „Config-Änderung schrittweise mit Rollback bei Alarm" → AppConfig.

> **💡 Merksatz:** **Validators** (Schema/Lambda) prüfen vorab; **Deployment-Strategien** (linear/gradual, Bake time) rollen schrittweise aus; **automatischer Rollback** bei CloudWatch-Alarm. Sicher statt „auf einen Schlag".

### Die Parameter-Store-Abgrenzung

**Das Problem:** Parameter Store und AppConfig speichern beide Konfigurationswerte.

**Die Lösung:**
- **Parameter Store** = einfache **Key-Value-Speicherung** (auch SecureString) — kein Rollout-Konzept.
- **AppConfig** = **gesteuertes Ausrollen** von Config-Änderungen mit Validierung, schrittweisem Deployment und Alarm-basiertem Rollback.

Reflex: „Config-Wert einfach speichern/abrufen" → Parameter Store; „Feature Flags / Config-Änderung sicher und schrittweise ausrollen" → AppConfig.

> **💡 Merksatz:** **Parameter Store (einfache Speicherung) vs. AppConfig (sicheres, schrittweises Ausrollen mit Validierung + Rollback)**.

---

## ⚠️ Prüfungs-Knackpunkte

- **AppConfig** (Teil von SSM) = Feature Flags + dynamische Config, ändern **ohne Redeploy** (Agent).
- **Validators** (JSON Schema/Lambda) prüfen vorab; **Deployment-Strategien** (linear/gradual, Bake time); **Rollback bei CloudWatch-Alarm**.
- Abgrenzung: **Parameter Store (Speicherung) vs. AppConfig (gesteuertes Ausrollen)**.
- Struktur: Application → Environment → Configuration Profile.

## 💡 Der eine Satz zum Mitnehmen

**AppConfig rollt Feature Flags und Laufzeit-Konfiguration sicher aus, ohne die App neu zu deployen — mit Vorab-Validierung, schrittweisem Deployment und automatischem Rollback bei CloudWatch-Alarm; Parameter Store speichert nur, AppConfig steuert die Ausrollung.**
