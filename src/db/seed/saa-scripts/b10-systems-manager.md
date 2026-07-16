---
service: AWS Systems Manager (SSM)
seedKey: saa-c03-script-systems-manager
batch: B10
domains: [D1, D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html
  - https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html
  - https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-advanced-parameters.html
status: draft
---

# AWS Systems Manager (SSM)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Systems Manager = die **zentrale Werkzeugkiste für die Server-Flotte**. Auf jedem Server läuft der **SSM Agent**. Werkzeuge: **Run Command** (Befehl auf hunderten Servern ohne Login), **Patch Manager** (OS-Updates nach Zeitplan, das Signal-Feature), **Session Manager** (Terminal im Browser **ohne SSH, ohne Port 22, ohne Schlüssel**, protokolliert), **Parameter Store** (Konfig/Passwörter, kostenlos, **ohne** Auto-Rotation), **Inventory**. Funktioniert **hybrid** (on-prem).

Der SAA vertieft: **Session Manager vs. Bastion Host, Parameter Store Standard vs. Advanced, Parameter Store vs. Secrets Manager — und die Netzwerk-Voraussetzungen.**

---

## 🎯 SAA-Vertiefung

### Session Manager statt Bastion Host

**Das Problem:** Ein Team betreibt einen Bastion Host, um auf private EC2-Instanzen zuzugreifen — mit offenem Port 22, verteilten SSH-Keys und einem zusätzlichen zu patchenden Server, der selbst eine Angriffsfläche ist.

**Die Lösung:** **Session Manager** gibt eine Shell zu jeder Instanz **ohne offenen Inbound-Port, ohne SSH-Keys und ohne Bastion Host** — der SSM Agent baut eine **ausgehende** HTTPS-Verbindung auf. Zugriff wird per **IAM** gesteuert, jede Session per **CloudTrail** (StartSession) auditiert und der Output optional nach S3/CloudWatch Logs geschrieben. Das ist die **Best-Practice-Antwort** für sicheren EC2-Zugriff: „Zugriff auf private Instanzen ohne Bastion/ohne Port 22" → Session Manager.

Netzwerk-Voraussetzung (prüfbar): In privaten Subnets ohne Internet braucht man **VPC-Endpoints** (ssm, ssmmessages, ec2messages) oder einen NAT-Weg, und die Instanz die Rolle `AmazonSSMManagedInstanceCore`.

> **💡 Merksatz:** **Session Manager** = Shell ohne Port 22 / ohne Keys / ohne Bastion (Agent → ausgehend HTTPS), IAM-gesteuert, CloudTrail-auditiert. Privat ohne Internet → VPC-Endpoints (ssm/ssmmessages/ec2messages).

### Parameter Store: Standard vs. Advanced

**Das Problem:** Man will mehr als 10.000 Parameter oder größere Werte mit Ablauf-Policies speichern.

**Die Lösung — zwei Tiers:**
- **Standard**: bis **10.000** Parameter/Region, **4 KB** Wert, keine Zusatzkosten, keine Policies.
- **Advanced**: **8 KB**, **Parameter Policies** (z. B. Expiration), **~$0,05 pro Parameter/Monat**.

Typen: **String**, **StringList**, **SecureString** (KMS-verschlüsselt). Ein Advanced-Parameter lässt sich nicht auf Standard zurückstufen. „mehr als 10.000 / >4 KB / Ablauf-Policy" → Advanced.

> **💡 Merksatz:** **Standard** (10.000/Region, 4 KB, gratis) vs. **Advanced** (8 KB, Policies, ~$0,05/Param/Monat). Typen: String/StringList/**SecureString** (KMS).

### Parameter Store vs. Secrets Manager

**Das Problem:** DB-Credentials sollen automatisch alle 30 Tage rotiert werden. Reicht ein SecureString-Parameter?

**Die Lösung:** Nein — das ist die geprüfte Abgrenzung:
- **Parameter Store SecureString**: einfache, KMS-verschlüsselte Speicherung, **keine** automatische Rotation, günstig/kostenlos. Für Konfigurationswerte und einfache Geheimnisse.
- **Secrets Manager**: purpose-built für Secrets mit **automatischer Rotation** (RDS/Redshift/DocumentDB integriert), Cross-Region-Replikation, fein-granularem Audit — kostenpflichtig pro Secret.

Reflex: „automatische Rotation / DB-Credentials / Cross-Region-Secret" → **Secrets Manager**; „einfacher verschlüsselter Konfigwert, Kosten sparen" → **Parameter Store SecureString**.

> **💡 Merksatz:** **Parameter Store SecureString** = einfach/günstig, **keine** Rotation. **Secrets Manager** = **automatische Rotation** (DB-integriert), Cross-Region, teurer. „Rotation" → Secrets Manager.

---

## ⚠️ Prüfungs-Knackpunkte

- **Session Manager** = Zugriff ohne Port 22 / Keys / Bastion (Agent → ausgehend HTTPS), IAM + CloudTrail-Audit; privat → VPC-Endpoints (ssm/ssmmessages/ec2messages) + Rolle `AmazonSSMManagedInstanceCore`.
- **Parameter Store Standard** (10.000/4 KB/gratis) vs. **Advanced** (8 KB/Policies/~$0,05); **SecureString** = KMS.
- **Parameter Store (keine Rotation) vs. Secrets Manager (automatische Rotation, DB-integriert)**.
- **Patch Manager** (Signal-Feature), **Run Command**, **Inventory**; funktioniert **hybrid/on-prem**.
- **AppConfig** (Feature Flags/dynamische Config) ist Teil von SSM.

## 💡 Der eine Satz zum Mitnehmen

**Systems Manager verwaltet die Server-Flotte zentral — Session Manager ersetzt den Bastion Host (kein Port 22, keine Keys, IAM + Audit), Parameter Store speichert Konfig günstig ohne Rotation, und sobald automatische Secret-Rotation gefragt ist, übernimmt Secrets Manager statt eines SecureString-Parameters.**
