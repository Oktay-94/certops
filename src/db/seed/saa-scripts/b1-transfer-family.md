---
service: AWS Transfer Family
seedKey: saa-c03-script-transfer-family
batch: B1
domains: [D2, D4]
sourceRef:
  - https://aws.amazon.com/aws-transfer-family/
  - https://docs.aws.amazon.com/transfer/latest/userguide/what-is-aws-transfer-family.html
status: draft
---

# AWS Transfer Family

## 📋 CLF-Recap

> *Kein CLF-Skript vorhanden — dieser Dienst ist NEU im SAA-Track.* Kurzeinordnung: **Managed SFTP-, FTPS-, FTP- und AS2-Server, deren „Festplatte" direkt S3 oder EFS ist.** Im Exam Guide gleich zweimal namentlich genannt (Task 2.1 „managed services", Task 4.1 „hybrid storage options").

---

## 🎯 SAA-Vertiefung

### Das Problem mit den Partnern, die seit 1998 SFTP sprechen

**Das Problem:** Hunderte Geschäftspartner — Banken, Lieferanten, Logistiker — liefern täglich Dateien an. Ihre Systeme sind alt, zertifiziert und unveränderbar: Sie sprechen **SFTP**, Punkt. Du willst die Dateien in **S3** haben (für Lambda-Verarbeitung, Athena, das ganze Ökosystem). Die Holzhammer-Lösung wäre ein selbstgebauter SFTP-Server auf EC2 — mit allem, was dranhängt: Patching, Hochverfügbarkeit, Skalierung bei Monatsabschluss-Peaks, SSH-Key-Verwaltung für hunderte Nutzer, und ein Cron-Job, der die Dateien nach S3 schaufelt.

**Die Lösung:** **AWS Transfer Family** ist genau dieser Server als Managed Service — die Partner verbinden sich per **SFTP, FTPS, FTP oder AS2** wie immer, aber jede hochgeladene Datei landet **direkt in S3 (oder EFS)**. Kein EC2, kein Patching, Multi-AZ und automatische Skalierung inklusive. Für die Partner ändert sich *nichts* — für dich wird aus einem Legacy-Protokoll ein Event im S3-Ökosystem: **S3 Event Notification → Lambda/Step Functions**, oder direkt eingebaute **Transfer Family Workflows** (Entschlüsseln, Taggen, Weiterkopieren nach dem Upload).

> **💡 Merksatz:** „Partner liefern per **SFTP** an, minimal operational overhead, Ziel **S3**" → Transfer Family. Der EC2-SFTP-Server ist der ewige Distraktor — er funktioniert, aber „minimal overhead" disqualifiziert ihn.

### Die Architektur-Bausteine, die Fragen entscheiden

Drei Stellschrauben tauchen in Szenarien immer wieder auf:

1. **Identity Provider — wer darf rein?** Drei Stufen: **Service-managed** (SSH-Keys direkt im Dienst — einfach, aber Insellösung), **AWS Directory Service / AD** (Firmen-Login), oder **Custom via Lambda/API Gateway** — der Joker, wenn eine *bestehende* Nutzerverwaltung (LDAP, eigene Datenbank) die Logins autorisieren soll, ohne Nutzer zu duplizieren.
2. **Endpoint-Typ — feste IPs für die Partner-Firewall.** Der Klassiker: „Die Firewall des Partners erlaubt nur freigeschaltete Ziel-IP-Adressen." Der öffentliche Endpoint hat wechselnde IPs — die Antwort ist der **VPC-Endpoint (internet-facing) mit Elastic IPs**: feste Adressen zum Whitelisten. (Dritte Variante: VPC-intern für rein private Übertragungen.)
3. **Mandantentrennung:** Jeder Nutzer bekommt eine IAM-Rolle plus ein **Home Directory** — ein logisches Mapping auf „seinen" S3-Prefix/EFS-Pfad. Partner A sieht niemals die Dateien von Partner B, obwohl alles im selben Bucket liegt.

Und das Nischen-Signalwort mit Seltenheitswert: **AS2** — das EDI-Protokoll für B2B-Dokumentenaustausch (Handel, Logistik). Taucht „AS2" in einer Frage auf, gibt es in AWS genau eine Antwort: Transfer Family.

Eine Protokoll-Falle noch: **Unverschlüsseltes FTP wird nur VPC-intern unterstützt** — „Partner über das Internet per FTP" ist keine gültige Architektur (→ SFTP/FTPS).

> **💡 Merksatz:** Feste IPs für Partner-Firewalls → **VPC-Endpoint + Elastic IPs**. Bestehende Nutzerverwaltung → **Custom Identity Provider (Lambda)**. „AS2" → immer Transfer Family. FTP nie übers Internet.

### Die Abgrenzung: Wer bewegt hier eigentlich wen?

Die Transfer-Familie hat zwei Geschwister, mit denen die Prüfung sie kreuzt — der Unterschied liegt in der **Richtung und im Akteur**:

- **Transfer Family:** *Externe* schieben Dateien **aktiv zu dir**, über ihr Standard-Protokoll. Du stellst nur den Briefkasten hin.
- **DataSync:** *Du* bewegst Datasets zwischen Speichern (on-prem ↔ AWS, AWS ↔ AWS) — geplant, verifiziert, in deiner Hand.
- **Storage Gateway:** *Deine eigene* Infrastruktur greift dauerhaft auf Cloud-Speicher zu (NFS/SMB/iSCSI als Illusion).

> **💡 Merksatz:** Fremde liefern an → **Transfer Family** · Ich transportiere → **DataSync** · Meine Apps greifen zu → **Storage Gateway**.

---

## ⚠️ Prüfungs-Knackpunkte

- Partner/Legacy-Systeme liefern per **SFTP/FTPS/AS2**, Ziel S3/EFS, minimaler Betrieb → **Transfer Family** (EC2-SFTP = Overhead-Distraktor).
- Partner-Firewall braucht **feste IPs** → **VPC-Endpoint mit Elastic IPs**.
- Bestehende Nutzerverwaltung (LDAP/custom) → **Custom Identity Provider via Lambda**; Firmen-AD → Directory Service.
- Mandantentrennung über **Home Directories** + IAM-Rollen pro Nutzer.
- Nach dem Upload automatisch verarbeiten → S3 Event → Lambda, oder **Transfer Family Workflows**.
- **AS2** = EDI/B2B-Signalwort mit genau einer Antwort: Transfer Family.
- Unverschlüsseltes **FTP nur VPC-intern** — nie übers Internet.
- Richtung merken: Fremde liefern → Transfer Family; ich bewege → DataSync; meine Apps greifen zu → Storage Gateway.

## 💡 Der eine Satz zum Mitnehmen

**Transfer Family ist der managed Briefkasten für alle, die noch SFTP sprechen** — die Partner ändern nichts, du bekommst S3-Events statt Server-Patching, und „feste IPs" oder „AS2" im Szenario machen die Antwort eindeutig.
