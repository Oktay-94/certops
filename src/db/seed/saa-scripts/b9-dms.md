---
service: AWS DMS (Database Migration Service)
seedKey: saa-c03-script-dms
batch: B9
domains: [D2, D3]
sourceRef:
  - https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Introduction.Components.html
  - https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.html
  - https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Serverless.html
status: draft
---

# AWS DMS (Database Migration Service)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> DMS = der **Umzugsdienst, der die Datenbank in die Cloud verfrachtet, während das Geschäft weiterläuft**. Es kopiert erst die bestehenden Daten und führt dann **alle laufenden Änderungen kontinuierlich nach (Change Data Capture)**, bis Quelle und Ziel synchron sind — erst dann schaltet man um, minimale Downtime. **Homogen** (gleiche Engine) = direkt mit DMS; **heterogen** (andere Engine, z. B. Oracle→Aurora PostgreSQL) = **SCT + DMS**. Merksatz: **SCT übersetzt die Struktur, DMS transportiert die Daten.**

Der SAA vertieft: **die Migrationstypen (Full Load/CDC), was DMS *nicht* automatisch migriert, Multi-AZ, DMS Serverless — und die Tool-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Full Load, CDC — und was DMS nicht mitnimmt

**Das Problem:** Eine 2-TB-Produktionsdatenbank soll nach Aurora migrieren, ohne dass das Geschäft steht. Ein einmaliges Kopieren würde alle Schreibvorgänge verpassen, die während der stundenlangen Übertragung anfallen.

**Die Lösung — die drei Migrationstypen:**
- **Full Load**: kopiert nur die bestehenden Daten (einmalig).
- **CDC (Change Data Capture)**: liest die Transaktionsprotokolle (binlog/WAL/redo log) und überträgt nur laufende Änderungen — hält das Ziel synchron.
- **Full Load + CDC**: bestehende Daten **plus** kontinuierliche Änderungen → Migration mit minimaler Downtime. Das ist der Standardfall für „online umziehen, dann umschalten".

Der prüfungskritische Haken: DMS migriert **nur die Daten**, **nicht automatisch** sekundäre Indizes, Sequenzen, Stored Procedures, Trigger, Synonyme und Views. Diese Schema-Objekte konvertiert man mit **SCT** — auch bei homogenen Migrationen, wenn man diese Objekte mit übernehmen will. Ein Distraktor ist deshalb „DMS allein migriert die komplette DB inkl. Prozeduren" — tut es nicht.

> **💡 Merksatz:** **Full Load** (bestehende Daten) · **CDC** (laufende Änderungen via Transaktionslog) · **Full Load + CDC** (beides → minimale Downtime). DMS migriert **nicht** autom. Indizes/Sequenzen/Procedures/Trigger/Views → **SCT**.

### Homogen vs. heterogen und Multi-AZ

**Das Problem:** Eine teure Oracle-DB soll auf Aurora PostgreSQL wechseln — andere Engine, anderes Schema-Format. Und die Replication Instance darf kein Single Point of Failure sein.

**Die Lösung:**
- **Homogen** (gleiche Engine, z. B. MySQL→Aurora MySQL): kein SCT nötig, DMS migriert direkt.
- **Heterogen** (Engine-Wechsel, z. B. Oracle→Aurora PostgreSQL): zweistufig — erst **SCT** (bzw. **DMS Schema Conversion**, die managed Variante in der Konsole) für Schema/Code, dann **DMS** für die Daten. „Engine-Wechsel" → immer SCT.
- **Replication Instance**: führt die Migration aus. Die **Multi-AZ-Option** hält einen synchronen Standby in einer zweiten AZ mit automatischem Failover — für hochverfügbare, langlaufende Migrationen/Replikationen. „DMS-Migration ausfallsicher gegen AZ-Ausfall" → Multi-AZ.

> **💡 Merksatz:** **Homogen = DMS allein; heterogen (Engine-Wechsel) = SCT + DMS.** **Replication Instance Multi-AZ** = synchroner Standby, HA gegen AZ-Ausfall.

### DMS Serverless und die Tool-Abgrenzung

**DMS Serverless** (🛑 seit 2023) provisioniert und skaliert die Kapazität automatisch — gemessen in **DCU** (1 DCU = 2 GB RAM), Single- oder Multi-AZ, für Full Load/CDC/beides. Signalwort „DB-Migration ohne Instance-Sizing/Kapazitätsplanung, schwankende Last" → DMS Serverless (statt manuell dimensionierter Replication Instance).

Die Tool-Abgrenzung im Migrations-Kapitel: **DMS = Datenbanken** (online, mit CDC). **MGN = ganze Server** (OS + App, Lift-and-Shift). **DataSync = Dateien/Objekte** (online, Bulk). **Snow = offline** (keine Bandbreite). Reflex: „Datenbank migrieren, Quelle bleibt online" → DMS; „ganzen Server umziehen" → MGN; „Dateien synchronisieren" → DataSync.

> **💡 Merksatz:** 🛑 **DMS Serverless** (DCU, autoskalierend) statt Instance-Sizing. Tool-Wahl: **DMS = DB, MGN = Server, DataSync = Dateien, Snow = offline.**

---

## ⚠️ Prüfungs-Knackpunkte

- **Full Load / CDC / Full Load + CDC**; CDC liest Transaktionslogs; „online migrieren, minimale Downtime" → Full Load + CDC.
- DMS migriert **nicht** autom. Indizes/Sequenzen/Stored Procedures/Trigger/Views → **SCT**.
- **Homogen** (gleiche Engine, kein SCT) vs. **heterogen** (Engine-Wechsel → SCT/DMS Schema Conversion + DMS).
- **Replication Instance Multi-AZ** = synchroner Standby, HA.
- 🛑 **DMS Serverless** (DCU = 2 GB RAM, autoskalierend) ohne Kapazitätsplanung.
- Tool-Abgrenzung: **DMS (DB) · MGN (Server) · DataSync (Dateien) · Snow (offline)**.

## 💡 Der eine Satz zum Mitnehmen

**DMS migriert Datenbanken online — Full Load + CDC hält die Quelle bis zum Umschalten synchron, heterogene Engine-Wechsel brauchen zusätzlich SCT für das Schema, und Multi-AZ macht die Replication Instance ausfallsicher; für ganze Server ist es MGN, für Dateien DataSync.**
