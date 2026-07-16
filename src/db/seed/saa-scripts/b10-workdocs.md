---
service: Amazon WorkDocs (abgekündigt)
seedKey: saa-c03-script-workdocs
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/workdocs/latest/userguide/what_is.html
status: draft
---

# Amazon WorkDocs (abgekündigt)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> WorkDocs war ein **Dokumentenspeicher/-Kollaborationsdienst** (wie Dropbox/Google Drive) — Dateien speichern, teilen, gemeinsam kommentieren. 🛑 **Der Dienst ist eingestellt** (End of Support 25.04.2025, keine Neukunden ab 26.04.2024). Er ist heute **keine wählbare Lösung** mehr, sondern nur noch ein **veralteter Distraktor**.

Der SAA vertieft: **den Abkündigungs-Status und was stattdessen zu wählen ist — kurz, weil out.**

---

## 🎯 SAA-Vertiefung

### Was WorkDocs war — und warum es nicht mehr gewählt wird

**Das Problem:** In älteren Materialien taucht WorkDocs als „AWS-Dropbox" auf — man könnte versucht sein, es für Dokumenten-Kollaboration zu wählen.

**Die Lösung:** 🛑 **WorkDocs ist tot.** End of Support **25. April 2025**; danach wurden Site, APIs, Drive und alle Daten permanent gelöscht (AWS bot ein Migrations-Tool nach S3). In jeder Frage nach **Dokumenten-Kollaboration/Datei-Sharing** ist WorkDocs heute ein **falscher, veralteter Distraktor**. Richtige Alternativen je nach Bedarf:
- **Dateispeicher/Sharing** → **S3** (mit Presigned URLs) oder Drittanbieter (Dropbox/Google Drive/SharePoint).
- **Gemeinsames Dateisystem** → **EFS** (Linux) / **FSx** (Windows).

„Dokumenten-Kollaboration wie Dropbox in AWS" → **nicht** WorkDocs (tot) → S3/Drittanbieter.

> **💡 Merksatz:** 🛑 WorkDocs = **eingestellt** (EoS 25.04.2025). In Fragen ein **veralteter Distraktor**; für Datei-Sharing → **S3**, für gemeinsames Dateisystem → **EFS/FSx**.

---

## ⚠️ Prüfungs-Knackpunkte

- 🛑 **WorkDocs ist abgekündigt** (EoS 25.04.2025, keine Neukunden ab 26.04.2024) — **keine** gültige Lösung mehr.
- In „Dokumenten-Kollaboration/Datei-Sharing"-Fragen ein **veralteter Distraktor**.
- Alternativen: **S3** (Sharing via Presigned URLs), **EFS/FSx** (gemeinsames Dateisystem), Drittanbieter.

## 💡 Der eine Satz zum Mitnehmen

**WorkDocs war die AWS-Dropbox, ist aber seit April 2025 eingestellt — in Prüfungsfragen heute nur noch ein veralteter Distraktor, den man zugunsten von S3 (Datei-Sharing) oder EFS/FSx (gemeinsames Dateisystem) verwirft.**
