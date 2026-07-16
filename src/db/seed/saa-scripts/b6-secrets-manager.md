---
service: AWS Secrets Manager
seedKey: saa-c03-script-secrets-manager
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
  - https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html
status: draft
---

# AWS Secrets Manager

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Secrets Manager = der **Passwortmanager für Anwendungen**: DB-Passwörter, API-Keys, Lizenzcodes — damit sie **nie im Code** stehen. Das absolute Signalwort ist **automatische Rotation**: Eine Lambda ändert das Passwort nach Zeitplan direkt in der DB, die App holt beim nächsten Start den neuen Wert. Abgrenzung: **Parameter Store** kann auch Secrets speichern und ist kostenlos — aber „automatische Rotation" → Secrets Manager.

Der SAA vertieft: **wie die Rotation ohne Downtime funktioniert, und die scharfe Parameter-Store-Abgrenzung mit Zahlen.**

---

## 🎯 SAA-Vertiefung

### Rotation ohne Downtime: Der native Weg

**Das Problem:** Das DB-Passwort soll alle 30 Tage wechseln — aber im Moment des Wechsels darf **keine** laufende Anwendung eine abgelehnte Verbindung bekommen.

**Die Lösung:** Für **RDS, Aurora, Redshift und DocumentDB** bietet Secrets Manager **native Managed Rotation** — man klickt sie an, keine eigene Lambda nötig. Im Hintergrund läuft ein sauberer Ablauf über **Staging Labels** (`AWSCURRENT`, `AWSPENDING`, `AWSPREVIOUS`): Das neue Passwort wird erst als `AWSPENDING` gesetzt und getestet, dann atomar auf `AWSCURRENT` umgeschaltet — die alte Version bleibt kurz als `AWSPREVIOUS` gültig. So gibt es keinen Moment, in dem gar kein gültiges Passwort existiert. Die App fragt das Secret einfach bei Bedarf per API ab und bekommt immer die aktuelle Version. Für andere Ziele (nicht die vier nativen) schreibt man eine eigene Rotations-Lambda nach demselben Vier-Schritt-Muster.

Die Verschlüsselung ist immer dabei: Secrets werden **immer via KMS** verschlüsselt (nicht abschaltbar). Cross-Account-Zugriff läuft über eine **Resource Policy** am Secret.

> **💡 Merksatz:** **Native Rotation für RDS/Aurora/Redshift/DocumentDB** (ein Klick), sonst eigene Lambda. Staging Labels (`AWSCURRENT`/`AWSPENDING`) machen den Wechsel **ohne Downtime**. Immer KMS-verschlüsselt.

### Secrets Manager vs. Parameter Store: Die Kostenfrage

**Das Problem:** „Konfigurationswerte und ein paar Secrets speichern" — Secrets Manager und SSM Parameter Store können beides. Was entscheidet?

**Die Lösung — zwei Kriterien: Rotation und Kosten.**
- **Secrets Manager**: kann **automatische Rotation** (nativ für die vier DB-Typen), Cross-Region-Replikation, kostet **~$0,40 pro Secret/Monat** + API-Calls. Nimm es, wenn **Rotation** verlangt wird.
- **SSM Parameter Store**: speichert Config und Secrets (SecureString via KMS), **Standard-Parameter sind kostenlos**, aber **keine native Rotation**. Nimm es, wenn es um **kostenlose Config/Secrets ohne Rotation** geht.

Der Reflex ist eindeutig: Steht **„automatische Rotation von Zugangsdaten"** im Text → **Secrets Manager** (einzige richtige Antwort). Steht **„kostengünstig"** + „keine Rotation nötig" → **Parameter Store**. Der häufige Distraktor ist, Secrets Manager auch dort zu wählen, wo Parameter Store gratis genügt hätte — und umgekehrt Parameter Store zu wählen, wo Rotation gefordert ist.

> **💡 Merksatz:** **Rotation gefordert → Secrets Manager** (kostet). **Kostenlos + keine Rotation → Parameter Store.** Das sind die zwei Entscheidungskriterien.

---

## ⚠️ Prüfungs-Knackpunkte

- **Automatische Rotation** ist das Signalwort → Secrets Manager; **nativ für RDS/Aurora/Redshift/DocumentDB** (sonst eigene Lambda).
- **Staging Labels** (`AWSCURRENT`/`AWSPENDING`/`AWSPREVIOUS`) = Rotation ohne Downtime.
- Immer **KMS-verschlüsselt**; Cross-Account via **Resource Policy**.
- Abgrenzung: **Parameter Store** = kostenlos (Standard), keine native Rotation; „kostengünstig ohne Rotation" → Parameter Store.
- Kosten: ~$0,40/Secret/Monat + API-Calls (Prüfung fragt selten die genaue Zahl, aber „kostet vs. gratis" ist entscheidend).

## 💡 Der eine Satz zum Mitnehmen

**Secrets Manager gewinnt jede Frage mit dem Wort „Rotation" — die Staging Labels machen den Passwortwechsel unterbrechungsfrei, und wo keine Rotation nötig ist, ist der kostenlose Parameter Store die sparsamere Antwort.**
