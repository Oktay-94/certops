---
service: AWS License Manager
seedKey: saa-c03-script-license-manager
batch: B10
domains: [D1, D4]
sourceRef:
  - https://docs.aws.amazon.com/license-manager/latest/userguide/license-manager.html
  - https://docs.aws.amazon.com/license-manager/latest/userguide/license-configurations.html
status: draft
---

# AWS License Manager

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> License Manager = der **Lizenz-Polizist für BYOL** (Bring Your Own License). Teure Oracle-/SQL-Server-/SAP-Lizenzen sind oft an **physische Kerne/Sockets** gebunden; startet man zu viele Instanzen, drohen **Audit-Strafen**. License Manager definiert Lizenzregeln („max. 16 Kerne"), überwacht und **verhindert** das Starten weiterer Instanzen bei erreichtem Limit. SAA-relevant: oft mit **Dedicated Hosts**.

Der SAA vertieft: **die Counting-Types, den Hard-Limit-Enforcement, den Dedicated-Host-Zwang — und die Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Counting-Types und Hard-Limit-Enforcement

**Das Problem:** Eine Oracle-Lizenz erlaubt maximal 16 physische Cores. Wird versehentlich eine 17. Core-Instanz gestartet, verletzt die Firma die Lizenz — teuer bei einem Audit.

**Die Lösung:** In einer **License Configuration** legt man einen **Counting-Type** fest — **vCPU, Instance, Core** oder **Socket** — und ein Limit. License Manager verfolgt die Nutzung. Setzt man `LicenseCountHardLimit`, **blockiert** der Dienst das Starten neuer Instanzen über dem Limit (hard enforcement); ohne Hard-Limit läuft nur Tracking (soft). Automatische Discovery erfasst Windows Server, SQL Server, RDS for Oracle/Db2. „Lizenznutzung erzwingen / Überschreitung verhindern" → License Manager mit Hard-Limit.

> **💡 Merksatz:** **License Configuration** mit Counting-Type **vCPU/Instance/Core/Socket** + Limit. **Hard-Limit blockiert** neue Instanzen über dem Limit; ohne Hard-Limit nur Tracking.

### Der Dedicated-Host-Zwang bei Core/Socket

**Das Problem:** Eine Lizenz ist an **physische** Cores gebunden (Windows Server, SQL Server, Oracle). Auf normalen Shared-Tenancy-Instanzen sieht man die physische Hardware aber nicht.

**Die Lösung:** Bei Counting-Type **Core oder Socket** sind **Dedicated Hosts erforderlich** — nur dort ist die physische Hardware (Cores/Sockets) sichtbar und der Lizenz zuweisbar. Das ist die klassische SAA-Kopplung: „an physische Cores gebundene BYOL-Lizenz" → License Manager **+ Dedicated Hosts**. Die License-affinity-to-host lässt sich für 1–180 Tage binden.

> **💡 Merksatz:** **Core/Socket-Counting → Dedicated Hosts erforderlich** (physische Hardware sichtbar). „physisch gebundene BYOL-Lizenz" → License Manager + Dedicated Hosts.

### Die Abgrenzung

**Das Problem:** Dedicated Instances, Dedicated Hosts und License Manager klingen ähnlich.

**Die Lösung:**
- **License Manager** = **Lizenz-Tracking und -Enforcement** (Regeln, Limits, Reporting).
- **Dedicated Hosts** = **physische Server** mit sichtbaren Cores/Sockets (die Voraussetzung für hardware-gebundene Lizenzen), zentral über Organizations verwaltbar.
- **Dedicated Instances** = isolierte Instanzen ohne sichtbare physische Core-Zuordnung → **nicht** ausreichend für Core/Socket-Lizenzen.

Reflex: „Lizenzen verwalten/erzwingen" → License Manager; „physische Cores für Lizenz sichtbar machen" → Dedicated Hosts.

> **💡 Merksatz:** **License Manager (Tracking/Enforcement) + Dedicated Hosts (physische Cores/Sockets).** **Dedicated Instances** reichen für Core/Socket-Lizenzen **nicht**.

---

## ⚠️ Prüfungs-Knackpunkte

- **License Configuration** mit Counting-Type **vCPU/Instance/Core/Socket** + Limit; **Hard-Limit blockiert** Überschreitung.
- **Core/Socket-Counting → Dedicated Hosts erforderlich** (physische Hardware); License affinity 1–180 Tage.
- **Dedicated Instances reichen NICHT** für hardware-gebundene Lizenzen.
- Auto-Discovery: Windows Server, SQL Server, RDS for Oracle/Db2; Integration mit Organizations/Marketplace/CloudFormation.
- Abgrenzung: **License Manager (Enforcement) vs. Dedicated Hosts (physische Server)**.

## 💡 Der eine Satz zum Mitnehmen

**License Manager trackt und erzwingt BYOL-Lizenzen über Counting-Types und Hard-Limits — und weil an physische Cores oder Sockets gebundene Lizenzen die Hardware sehen müssen, gehört bei Core/Socket-Counting zwingend ein Dedicated Host dazu, nicht eine bloße Dedicated Instance.**
