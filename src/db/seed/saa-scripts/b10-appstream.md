---
service: Amazon AppStream 2.0 (jetzt WorkSpaces Applications)
seedKey: saa-c03-script-appstream
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/appstream2/latest/developerguide/what-is-appstream.html
  - https://aws.amazon.com/workspaces/applications/
status: draft
---

# Amazon AppStream 2.0 (jetzt WorkSpaces Applications)

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> AppStream 2.0 = die **App-Fernbedienung aus der Cloud** — streamt eine **einzelne Anwendung** in den Browser, ohne lokale Installation. Die App läuft auf AWS-Servern; der Nutzer bedient nur das gestreamte Fenster. Selbst schwere Software (CAD/3D) läuft auf schwacher Hardware, weil die Rechenleistung in der Cloud ist. Pay-per-use. Killer-Abgrenzung: **WorkSpaces = ganzer Desktop; AppStream = nur eine einzelne App gestreamt.**

Der SAA vertieft: **Application Streaming + Non-Persistenz, die Use Cases, das Rebranding — und die WorkSpaces-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Application Streaming und Non-Persistenz

**Das Problem:** Nutzer sollen eine bestimmte schwere Anwendung (CAD, Analyse-Tool) nutzen — aber ohne sie auf jedem Rechner zu installieren (aufwendig, hohe Hardware-Anforderungen, Lizenz-/Update-Chaos), und auf potenziell schwachen Endgeräten.

**Die Lösung:** **AppStream** streamt **einzelne Anwendungen** aus der Cloud in einen HTML5-Browser (oder Client). Die App läuft auf AWS-Compute; der Nutzer braucht nur einen Browser. Wichtig: standardmäßig **non-persistent** — jede Session startet in frischer Umgebung, Nutzerdaten müssen **extern** (S3/EFS/Home Folders) gespeichert werden. Multi-Session, elastisches Auto-Scaling, pay-per-use. „einzelne App im Browser bereitstellen, ohne Installation" → AppStream.

> **💡 Merksatz:** AppStream = **einzelne App gestreamt** in den Browser, App läuft auf AWS-Compute; **non-persistent** (Daten extern in S3/EFS), pay-per-use.

### Use Cases und das Rebranding

**Das Problem:** Wann wählt man App-Streaming statt eines ganzen Desktops?

**Die Lösung — typische Use Cases:** SaaS-/Legacy-App bereitstellen ohne Code-Umschreibung, Software-Trials/Demos, spezialisierte Apps (CAD/3D) für gezielte Nutzergruppen, Schulungsumgebungen. Immer dann, wenn nur **eine App** (nicht ein ganzer Desktop) gebraucht wird und Non-Persistenz akzeptabel ist.

🛑 **Aktualität:** AppStream 2.0 wurde in **„Amazon WorkSpaces Applications"** umbenannt (in die WorkSpaces-Familie konsolidiert). Reine Namensänderung — API/CLI (`appstream`-Namespace) und Console-URL bleiben. In Prüfung/Altmaterial können **beide Namen** vorkommen.

> **💡 Merksatz:** Use Cases: **Legacy-/SaaS-App bereitstellen, Demos, CAD/3D für gezielte Nutzer**. 🛑 Rebranding **AppStream 2.0 = WorkSpaces Applications** (beide Namen kennen).

### Die WorkSpaces-Abgrenzung

**Das Problem:** AppStream und WorkSpaces sind das meistverwechselte EUC-Paar.

**Die Lösung — die Kern-Unterscheidung:**
- **AppStream / WorkSpaces Applications** = **einzelne App** gestreamt, **non-persistent**, pay-per-use.
- **WorkSpaces** = **ganzer, persistenter Desktop** (DaaS).
- **Secure Browser** = **nur** Browser-Zugriff.

Reflex: „nur eine bestimmte App bereitstellen" → AppStream; „vollständiger Arbeits-Desktop" → WorkSpaces; „nur interne Websites/SaaS im Browser" → Secure Browser.

> **💡 Merksatz:** **AppStream (einzelne App, non-persistent) vs. WorkSpaces (ganzer persistenter Desktop) vs. Secure Browser (nur Browser)**. „einzelne App" → AppStream.

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „einzelne App streamen", „App im Browser ohne Installation", „CAD/3D auf schwacher Hardware", „Software-Demo", „non-persistent" → AppStream.
- **Non-persistent** (Daten extern in S3/EFS), pay-per-use, Multi-Session, Auto-Scaling.
- 🛑 Rebranding: **AppStream 2.0 = WorkSpaces Applications** (beide Namen).
- **AppStream (einzelne App) vs. WorkSpaces (ganzer Desktop) vs. Secure Browser (nur Browser)**.

## 💡 Der eine Satz zum Mitnehmen

**AppStream 2.0 (jetzt WorkSpaces Applications) streamt einzelne Anwendungen aus der Cloud in den Browser — non-persistent, pay-per-use, ideal für Legacy-/CAD-Apps auf schwacher Hardware — und ist im EUC-Trio die einzelne App, während WorkSpaces den ganzen persistenten Desktop liefert.**
