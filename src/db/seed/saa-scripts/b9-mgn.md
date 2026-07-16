---
service: AWS Application Migration Service (MGN)
seedKey: saa-c03-script-mgn
batch: B9
domains: [D2, D3]
sourceRef:
  - https://aws.amazon.com/application-migration-service/
  - https://docs.aws.amazon.com/mgn/latest/ug/migration-workflow-gs.html
  - https://docs.aws.amazon.com/mgn/latest/ug/launching-target-servers.html
status: draft
---

# AWS Application Migration Service (MGN)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> MGN = der **automatische Umzugshelfer, der komplette Server samt allem in die Cloud verfrachtet** — der empfohlene Hauptdienst für **Lift-and-Shift/Rehost**. Ein kleiner **Agent** repliziert den ganzen Server (OS, App, Daten) **block-level und live** nach AWS, während er weiterläuft; beim **Cutover** wird er automatisch in eine lauffähige **EC2-Instanz** umgewandelt — kein manuelles Nachbauen. Merksatz: **MGN zieht ganze Server um, DMS nur Datenbanken, Snow transportiert Datenmassen.**

Der SAA vertieft: **die Replikations-/Cutover-Mechanik, die 7 Rs, die Abgrenzung zu DMS und DRS — und den SMS-Deprecation-Hinweis.**

---

## 🎯 SAA-Vertiefung

### Staging Area, Test und Cutover

**Das Problem:** Hunderte Server sollen nach AWS — ohne lange Ausfälle und ohne dass man erst nach dem Umschalten merkt, dass etwas nicht bootet.

**Die Lösung — die MGN-Mechanik:**
- Der **AWS Replication Agent** liest initial alle Blöcke und dann laufend die Änderungen; repliziert in eine **kostengünstige Staging Area** (günstige EBS-Volumes + kleine Replication-Server) → near-zero RPO, weil kontinuierlich.
- **Test-Instanzen** lassen sich **jederzeit nicht-disruptiv** starten, ohne Produktion oder Replikation zu stören — man verifiziert vorab, dass der migrierte Server läuft.
- Beim **Cutover** macht MGN einen finalen Sync und wandelt den Server automatisch in eine bootfähige EC2-Instanz um (Treiber, Bootloader, Netzwerk). Lifecycle: Not ready → Ready for testing → Test → Ready for cutover → Cutover complete. **90 Tage kostenlos** pro Server (nur die AWS-Infrastruktur kostet).

Der Reflex: „ganze Server/VMs mit minimaler Downtime nach EC2, vorher testen" → MGN.

> **💡 Merksatz:** MGN repliziert block-level in eine günstige **Staging Area** (near-zero RPO), erlaubt **nicht-disruptive Tests** und wandelt beim **Cutover** automatisch in EC2 um. 90 Tage gratis.

### Die 7 Rs — MGN als Rehost-Antwort

**Das Problem:** Die Prüfung fragt oft nicht „welches Tool", sondern „welche Migrationsstrategie".

**Die Lösung — die 7 Rs (Komplexität aufsteigend):**
- **Retire** (abschalten), **Retain** (vorerst behalten), **Relocate** (verschieben ohne Redesign, z. B. VMware→VMware Cloud on AWS), **Rehost** (Lift-and-Shift, unverändert → **MGN**), **Repurchase** (auf SaaS wechseln, „Drop and Shop"), **Replatform** (kleine Optimierungen, z. B. self-managed MySQL→RDS), **Refactor** (cloud-native neu bauen, für große Migrationen zu komplex).

MGN ist die typische Antwort für **Rehost** — „schnellster Umzug ohne Änderungen". Signalwort-Beispiele: „self-managed DB → RDS" = Replatform; „Monolith → Lambda/DynamoDB" = Refactor; „Server unverändert → EC2" = Rehost → MGN.

> **💡 Merksatz:** **Rehost (Lift-and-Shift, unverändert) → MGN.** Replatform = kleine Optimierung (→RDS), Repurchase = SaaS-Wechsel, Refactor = cloud-native Neubau, Relocate = VMware-Umzug.

### Abgrenzung zu DMS und DRS — plus SMS-Hinweis

- **MGN vs. DMS**: ganze **Server** (OS + App) → MGN; nur **Datenbanken** → DMS.
- **MGN vs. DRS**: **MGN = einmalige Migration** (Server dauerhaft nach AWS umziehen, danach fertig). **DRS = laufende DR-Absicherung** (Server bleiben am Ursprung, AWS hält eine startbereite Reserve). Beide nutzen dieselbe Block-Level-Replikationstechnik — der Zweck unterscheidet sie. Merksatz: **MGN zieht dauerhaft um, DRS hält eine Notfall-Kopie bereit.**

🛑 **Aktualität:** MGN hat den alten **Server Migration Service (SMS)** abgelöst (SMS eingestellt 2022) und ist auch Nachfolger von CloudEndure Migration. „SMS" in einer Frage ist heute ein veralteter Distraktor → MGN.

> **💡 Merksatz:** **MGN (Server) vs. DMS (DB).** **MGN (einmalige Migration) vs. DRS (laufende DR-Reserve)** — gleiche Technik, anderer Zweck. 🛑 MGN ersetzt SMS/CloudEndure Migration.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Server/VM migrieren", „Lift-and-Shift/Rehost", „komplette Anwendung in die Cloud", „minimale Downtime beim Server-Umzug" → MGN.
- Mechanik: Agent → **Staging Area** (near-zero RPO), **nicht-disruptive Tests**, **Cutover** → EC2; 90 Tage gratis.
- **7 Rs**: Rehost→MGN, Replatform→RDS, Repurchase→SaaS, Refactor→cloud-native, Relocate→VMware.
- **MGN (Server) vs. DMS (DB)**; **MGN (Migration) vs. DRS (DR-Reserve)**.
- 🛑 MGN ersetzt **SMS** (eingestellt 2022) und CloudEndure Migration.

## 💡 Der eine Satz zum Mitnehmen

**MGN ist der Lift-and-Shift-Dienst für ganze Server: block-level in eine günstige Staging Area repliziert, vorab testbar, beim Cutover automatisch als EC2 gebootet — die Rehost-Antwort der 7 Rs, abzugrenzen von DMS (nur DB) und DRS (laufende DR statt einmaliger Migration).**
