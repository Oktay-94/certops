---
service: AWS Backup
seedKey: saa-c03-script-aws-backup
batch: B1
domains: [D1, D2]
sourceRef:
  - https://docs.aws.amazon.com/aws-backup/latest/devguide/whatisbackup.html
  - https://docs.aws.amazon.com/aws-backup/latest/devguide/vault-lock.html
status: draft
---

# AWS Backup

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AWS Backup = die **zentrale Kommandozentrale für alle Rettungsringe**: ein Backup Plan (Zeitplan + Retention, Zuordnung per Tag) sichert EBS, EC2, RDS, Aurora, DynamoDB, EFS, FSx, Storage Gateway u. v. m. in Backup Vaults — mit Cross-Region- und Cross-Account-Copy und dem WORM-Schutz **Vault Lock**.

Der SAA vertieft an drei Stellen: **Wie hart ist Vault Lock wirklich, wie schützt man Backups vor einem Angreifer mit Admin-Rechten, und wie erzwingt man eine Backup-Strategie über 100 Accounts?**

---

## 🎯 SAA-Vertiefung

### Vault Lock: Der Zaun und der Beton — dasselbe Muster wie bei S3

**Das Problem:** Ransomware-Angreifer haben gelernt: Erst die **Backups zerstören**, dann verschlüsseln — wer keine Sicherung mehr hat, zahlt. Ein Angreifer mit gestohlenen Admin-Credentials löscht also zuerst die Recovery Points. Wie macht man Backups selbst gegen Administratoren unzerstörbar?

**Die Lösung:** **Backup Vault Lock** in zwei Härtegraden — dieselbe Governance/Compliance-Logik wie bei S3 Object Lock, nur für Recovery Points statt Objekte:

- **Governance Mode** = der Zaun: Nutzer mit ausreichenden IAM-Rechten können den Lock wieder **entfernen**. Schützt vor Versehen und normalen Nutzern — nicht vor dem Angreifer mit Admin-Rechten.
- **Compliance Mode** = der Beton: Nach Ablauf der **Grace Period (mindestens 3 Tage / 72 h)** ist der Vault **unveränderlich für jeden** — kein Nutzer, nicht Root, nicht einmal AWS kann Backups vorzeitig löschen oder die Retention verkürzen. AWS formuliert es wörtlich: Auch ein Root-Löschversuch wird verweigert. Der einzige „Ausweg" ist die Schließung des gesamten Kontos. (Das Ganze ist Cohasset-assessed für SEC 17a-4/FINRA/CFTC — das Compliance-Argument für Auditoren.)

Die Grace Period ist übrigens kein Bug, sondern das Sicherheitsnetz: 72 Stunden Bedenkzeit, bevor der Beton aushärtet — danach gibt es kein Zurück.

> **💡 Merksatz:** „Backups unlöschbar, **auch für Admins und Root**" → **Vault Lock Compliance Mode** (Grace Period min. 72 h, dann unumkehrbar). Governance Mode ist nur der Zaun.

### Konto-Isolation: Der Tresor im Nachbarhaus

**Das Problem:** Selbst der härteste Vault Lock nützt begrenzt, wenn Angreifer und Backups **im selben Konto** wohnen — ein kompromittierter Prod-Account ist die falsche Nachbarschaft für die letzte Verteidigungslinie.

**Die Lösung:** Das SAA-Muster heißt **Cross-Account Copy in einen dedizierten, isolierten Backup-Account** — dort zusätzlich Vault Lock, und der Prod-Account hat schlicht keine Rechte auf den fremden Vault. Der Angreifer müsste zwei getrennte Konten gleichzeitig kompromittieren. Cross-**Region** allein ist dafür der Distraktor: Es schützt vor Regionsausfall, aber nicht vor dem Angreifer, denn der hat im selben Konto auch auf die andere Region Zugriff.

Die moderne Abkürzung dafür: **Logically Air-Gapped Vaults** — von AWS verwaltete Vaults, die automatisch compliance-gelockt sind und per **RAM** cross-account geteilt werden können, sodass ein Wiederherstellungs-Konto im Ernstfall direkt und schnell restoren kann.

> **💡 Merksatz:** Ransomware-Frage = **Konto-Trennung + Vault Lock** (bzw. Logically Air-Gapped Vault). Cross-Region schützt vor Regionsausfall, **nicht** vor dem Angreifer im eigenen Konto.

### Organisationsweite Erzwingung: Ein Plan für 100 Konten

**Das Problem:** „Die Firma hat 100 AWS-Accounts. Sicherheitsrichtlinie: *Jede* Ressource mit Tag `backup=prod` wird täglich gesichert, 35 Tage Retention — und kein Team darf das abschalten."

**Die Lösung:** **Backup Policies über AWS Organizations**: Der Backup Plan wird zentral definiert und auf OUs ausgerollt — die Mitgliedskonten *erben* die Policy und können sie nicht deaktivieren. Das ist der Unterschied zu „in jedem Konto einen Plan anlegen" (nicht erzwingbar, driftet) oder CloudFormation StackSets (verteilt zwar, erzwingt aber nicht — ein Admin im Zielkonto kann den Stack ändern).

Zur Einordnung im Werkzeugkasten: **DLM** automatisiert nur EBS-Snapshots — sobald *mehrere* Dienste, zentrale Governance oder Vault Lock gefragt sind, ist AWS Backup die Antwort. Und die Architektur-Wahrheit zum Schluss: Ein Backup ist die *unterste* DR-Stufe (**Backup & Restore** = billigste Strategie, längstes RTO) — für kleinere RTO/RPO-Anforderungen geht es im DR-Skript (B9) weiter mit Pilot Light, Warm Standby und Active-Active.

> **💡 Merksatz:** „Über viele Accounts **erzwingen**" → **Organizations Backup Policies**. Nur-EBS-Automatik → DLM; alles andere zentral → AWS Backup.

---

## ⚠️ Prüfungs-Knackpunkte

- Backups unlöschbar auch für Admins/Root → **Vault Lock Compliance Mode**; Grace Period **min. 72 h**, danach unumkehrbar; Governance Mode = per IAM entfernbar.
- Ransomware-Szenario → **Cross-Account Copy in isolierten Backup-Account + Vault Lock** oder **Logically Air-Gapped Vault** (RAM-Sharing für schnellen Fremd-Konto-Restore).
- Cross-Region ≠ Angreiferschutz — Region löst Geografie, Konto löst Kompromittierung.
- Firmenweite Backup-Pflicht über viele Konten → **Organizations Backup Policies** (erzwungen, nicht abschaltbar).
- Nur EBS-Snapshots automatisieren → **DLM**; multi-service/zentral/Compliance → **AWS Backup**.
- Backup & Restore = billigste DR-Strategie mit dem längsten RTO — Backup ersetzt keine DR-Architektur.

## 💡 Der eine Satz zum Mitnehmen

**AWS Backup beantwortet drei Fragen mit je einem Feature: „unlöschbar?" → Vault Lock Compliance, „angreifersicher?" → isolierter Account/Air-Gapped Vault, „firmenweit erzwungen?" → Organizations Backup Policies.**
