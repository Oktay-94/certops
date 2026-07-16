---
service: Amazon Inspector
seedKey: saa-c03-script-inspector
batch: B6
domains: [D1]
sourceRef:
  - https://docs.aws.amazon.com/inspector/latest/user/what-is-inspector.html
  - https://aws.amazon.com/inspector/faqs/
status: draft
---

# Amazon Inspector

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Inspector = der **Sicherheits-TÜV**, der Server und Container auf **bekannte Schwachstellen (CVEs)** abklopft, bevor ein Angreifer sie findet. Scannt **EC2, Container-Images in ECR und Lambda** — automatisch und kontinuierlich, mit **Risk Score** pro Fund. Merksatz: **Inspector = der TÜV prüft das Auto auf Mängel (vorher), GuardDuty = die Alarmanlage meldet den Einbrecher (währenddessen)**.

Der SAA vertieft: **das kontinuierliche Rescanning, den Risk Score — und die scharfe Trennung zu GuardDuty und Macie.**

---

## 🎯 SAA-Vertiefung

### Kontinuierlich, nicht als Momentaufnahme

**Das Problem:** Ein Team scannt seine Instanzen einmal, alles ist sauber. Zwei Wochen später wird eine neue kritische CVE für eine installierte Bibliothek veröffentlicht — aber niemand scannt erneut, die Lücke bleibt unbemerkt.

**Die Lösung:** Der heutige Inspector (v2, nicht mehr der alte „Classic" mit manuellen Assessment-Templates) scannt **automatisch und kontinuierlich**. Entscheidend: Er **rescannt bei jedem relevanten Ereignis** — neues Paket, Patch, **und auch, wenn eine neue CVE veröffentlicht wird**, ohne dass sich am System etwas geändert hat. Wird eine Lücke behoben, setzt Inspector das Finding **automatisch auf „Closed"**. Das ist der Kernvorteil gegenüber einem einmaligen Scan: die Abdeckung bleibt aktuell, während sich die Bedrohungslage ändert. Signalwort „kontinuierlich / automatisch bei neuer CVE" → Inspector.

Die drei Scan-Ziele sind auswendig zu können: **EC2** (Software-CVEs + Netzwerk-Exposition), **Container-Images in ECR** (Lücken **schon vor dem Deployment**) und **Lambda** (Code + Abhängigkeiten). Neuere Erweiterungen decken auch CI/CD-Image-Scanning ab.

> **💡 Merksatz:** Inspector scannt **kontinuierlich**, rescannt **auch bei neuer CVE** ohne Systemänderung; Ziele: **EC2, ECR-Images, Lambda**. Behoben → Finding automatisch „Closed".

### Der Risk Score: Nicht alle Lücken sind gleich

**Das Problem:** Ein Scan findet 400 Schwachstellen. Welche zuerst? Alle gleich zu behandeln, verschwendet Zeit an harmlose und lässt gefährliche liegen.

**Die Lösung:** Inspector berechnet einen **Risk Score**, der die CVE-Schwere **mit dem Kontext** kombiniert: Ist die betroffene Ressource **über das Netzwerk erreichbar**? Gibt es einen bekannten **Exploit**? Eine kritische CVE auf einer isolierten Instanz ist weniger dringend als eine mittlere auf einem öffentlich erreichbaren Server. So landet oben, was wirklich gefährlich ist — Priorisierung statt Panik über die reine CVSS-Zahl.

> **💡 Merksatz:** **Risk Score = CVE-Schwere + Netzwerk-Erreichbarkeit + Exploitability** → Priorisierung, nicht nur CVSS.

### Die Trennung: Schwachstellen vs. Bedrohungen vs. Daten

Die meistgeprüfte Verwechslung des Batches — Inspector sauber eingeordnet:
- **Inspector** = **Schwachstellen/CVEs**, vorbeugend, schaut **in die Software** („wo bin ich verwundbar?").
- **GuardDuty** = **aktive Bedrohungen**, während es passiert, schaut auf **Verhalten/Logs** („werde ich angegriffen?").
- **Macie** = **sensible Daten in S3** („liegen hier Geheimnisse offen?").

Die schärfste Einzel-Abgrenzung: **Malware scannen ist NICHT Inspector** — CVEs sind keine Malware. „Malware auf EC2" → **GuardDuty Malware Protection**. Inspector findet die *Lücke*, durch die Malware reinkäme, nicht die Malware selbst.

> **💡 Merksatz:** **Inspector = CVEs/Schwachstellen (Software), GuardDuty = aktive Bedrohungen (Verhalten), Macie = sensible S3-Daten.** Malware → GuardDuty, nicht Inspector.

---

## ⚠️ Prüfungs-Knackpunkte

- **Kontinuierliches Scannen** (v2), rescannt **auch bei neuer CVE**; behoben → automatisch „Closed".
- Ziele: **EC2, ECR-Container-Images (vor Deployment), Lambda** (+ CI/CD).
- **Risk Score** = CVE-Schwere + Erreichbarkeit + Exploitability → Priorisierung.
- Integration mit **Security Hub** + EventBridge; Delegated Administrator (org-weit).
- Abgrenzung: **Inspector (CVEs) ≠ GuardDuty (Threats/Malware) ≠ Macie (S3-Daten)**.
- „Malware scannen" → GuardDuty, **nicht** Inspector.

## 💡 Der eine Satz zum Mitnehmen

**Inspector ist der kontinuierliche Schwachstellen-TÜV für EC2, ECR und Lambda — er findet die CVE-Lücken (und rescannt sogar, wenn eine neue CVE erscheint), während GuardDuty die aktiven Angriffe meldet und Macie die sensiblen S3-Daten aufspürt.**
