---
service: Amazon WorkSpaces
seedKey: saa-c03-script-workspaces
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/workspaces/latest/adminguide/amazon-workspaces.html
  - https://aws.amazon.com/about-aws/whats-new/2016/08/amazon-workspaces-now-offers-hourly-billing/
status: draft
---

# Amazon WorkSpaces

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> WorkSpaces = der **komplette Windows-/Linux-Desktop in der Cloud** — Managed **Desktop-as-a-Service (DaaS)**. Der Mitarbeiter greift per Client (Laptop/Tablet/Browser) zu, übertragen wird quasi nur das **Bild**; **Firmendaten bleiben in AWS**, nicht auf dem Endgerät (geht der Laptop verloren, ist nichts drauf). Von überall, schnell skalierbar, pro Nutzer abgerechnet. Killer-Abgrenzung: **WorkSpaces = ganzer persistenter Desktop; AppStream = einzelne gestreamte App.**

Der SAA vertieft: **Persistenz, die Running Modes (AlwaysOn/AutoStop), die EUC-Abgrenzungen — inkl. Secure Browser.**

---

## 🎯 SAA-Vertiefung

### Persistenter Desktop und die Sicherheits-Story

**Das Problem:** 500 Mitarbeiter, viele im Homeoffice plus externe Dienstleister, brauchen jeweils einen Arbeits-Desktop. 500 physische Laptops zu kaufen/warten/absichern ist teuer — und bei Verlust liegen sensible Daten lokal.

**Die Lösung:** **WorkSpaces** liefert einen **vollständigen, persistenten** virtuellen Desktop (Windows oder Linux) in der Cloud: bei jedem Login derselbe Desktop mit Profil, installierten Apps und gespeicherten Dateien. Das Endgerät ist nur ein Fenster; **keine Firmendaten liegen lokal** — das beliebte Sicherheitsargument. Integration mit **AWS Directory Service** (AD), MFA möglich. „vollständiger persistenter Cloud-Desktop / DaaS / VDI-Ablösung, Daten bleiben in der Cloud" → WorkSpaces.

> **💡 Merksatz:** WorkSpaces = **vollständiger, persistenter** Cloud-Desktop (Win/Linux), Daten bleiben in AWS (nicht lokal), AD-Integration + MFA. „persistenter Cloud-Desktop" → WorkSpaces.

### Running Modes: AlwaysOn vs. AutoStop

**Das Problem:** Ein Vollzeit-Mitarbeiter nutzt seinen Desktop den ganzen Tag; ein Teilzeit-Contractor nur ein paar Stunden. Ein fester Monatspreis für beide wäre für den Contractor Verschwendung.

**Die Lösung — zwei Abrechnungs-/Betriebsmodi:**
- **AlwaysOn**: fester **Monatspreis**, unbegrenzte Nutzung, sofortiger Zugriff — für Vollzeit-Primärdesktops.
- **AutoStop**: **stündliche** Abrechnung; der WorkSpace stoppt nach konfigurierter Inaktivität (Zustand bleibt erhalten), Resume in ~90 Sekunden — für Teilzeit/Contractors/Schulung.

„stundenweise abgerechnete Desktops für Teilzeitnutzer" → AutoStop; „Vollzeit-Primärdesktop" → AlwaysOn.

> **💡 Merksatz:** **AlwaysOn** (Monatspreis, Vollzeit) vs. **AutoStop** (stündlich, stoppt bei Inaktivität, Resume ~90 s, Teilzeit). „stundenweise" → AutoStop.

### Die EUC-Abgrenzungen (das End-User-Computing-Trio)

**Das Problem:** WorkSpaces, AppStream und Secure Browser klingen alle nach „Cloud-Arbeitsplatz".

**Die Lösung:**
- **WorkSpaces** = **ganzer, persistenter Desktop** (DaaS).
- **AppStream 2.0 / WorkSpaces Applications** = **einzelne gestreamte App** (non-persistent).
- **WorkSpaces Secure Browser** = **nur** ein sicherer, isolierter Browser (Zugriff auf interne Websites/SaaS ohne VPN).

Und gegen EC2: **EC2 Windows** ist **nicht** managed als DaaS (kein Broker/Client/Directory-Erlebnis) → bei „managed persistenter Cloud-Desktop" ist WorkSpaces korrekt. Reflex: „ganzer Desktop" → WorkSpaces; „einzelne App" → AppStream; „nur Browser" → Secure Browser.

> **💡 Merksatz:** **WorkSpaces (ganzer Desktop) vs. AppStream/WorkSpaces Applications (einzelne App) vs. Secure Browser (nur Browser)**; **EC2** ist nicht managed als DaaS.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „virtueller Desktop", „DaaS", „VDI", „Cloud-Desktop", „Mitarbeiter greifen von überall zu", „keine lokale Hardware/Daten" → WorkSpaces.
- **Persistent**; Daten bleiben in AWS (Sicherheitsargument); AD-Integration + MFA.
- **AlwaysOn** (Monatspreis) vs. **AutoStop** (stündlich, Resume ~90 s).
- EUC-Trio: **WorkSpaces (ganzer Desktop) vs. AppStream (einzelne App) vs. Secure Browser (nur Browser)**; EC2 ≠ managed DaaS.

## 💡 Der eine Satz zum Mitnehmen

**WorkSpaces liefert einen vollständigen, persistenten Windows-/Linux-Desktop aus der Cloud, bei dem Firmendaten in AWS statt auf dem Endgerät bleiben — mit AlwaysOn (Monatspreis) oder AutoStop (stündlich) — und ist im End-User-Computing-Trio der ganze Desktop, während AppStream einzelne Apps und Secure Browser nur den Browser liefert.**
