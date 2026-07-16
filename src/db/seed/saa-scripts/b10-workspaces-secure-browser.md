---
service: Amazon WorkSpaces Secure Browser (früher WorkSpaces Web)
seedKey: saa-c03-script-workspaces-secure-browser
batch: B10
domains: [D1, D3]
sourceRef:
  - https://docs.aws.amazon.com/workspaces-web/latest/adminguide/what-is-workspaces-secure-browser.html
  - https://aws.amazon.com/about-aws/whats-new/2024/05/amazon-workspaces-web-amazon-workspaces-secure-browser/
status: draft
---

# Amazon WorkSpaces Secure Browser

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Secure Browser (früher „WorkSpaces Web") ist im CLF-Kurs nicht vertieft — hier die Einordnung: ein **fully managed, gehosteter Browser** für sicheren Zugriff auf **interne Websites und SaaS-Web-Apps** — aus einem „disposable container", **ohne VPN**. Web-Content wird als **Pixel-Stream** an den lokalen Browser geliefert; **kein HTML/DOM/keine sensiblen Daten** landen auf dem Endgerät. Im EUC-Trio: **nur der Browser** (nicht ganzer Desktop wie WorkSpaces, nicht einzelne App wie AppStream).

Der SAA vertieft: **das Browser-Isolation-Prinzip, die Anti-Exfiltrations-Story — und die EUC-Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Browser-Isolation ohne VPN

**Das Problem:** Externe Contractors und BYOD-Nutzer sollen auf eine interne SaaS-Web-App zugreifen — aber ohne VPN-Rollout auf fremden Geräten und ohne dass sensible Daten auf diese (ungemanagten) Geräte gelangen.

**Die Lösung:** **Secure Browser** ist ein cloud-nativer, **gehosteter Chrome** in einem wegwerfbaren Container. Der Nutzer sieht die Web-App über seinen **vorhandenen lokalen Browser** — übertragen wird aber nur ein **Pixel-Stream**; **kein HTML, kein DOM, keine Dateien** landen lokal (Remote Browser Isolation). Jede Session startet mit frischer, gepatchter Browser-Instanz. Kein VPN, keine Client-Installation nötig. „sicherer Zugriff auf interne Websites/SaaS ohne VPN, keine Daten aufs Gerät" → Secure Browser.

> **💡 Merksatz:** Secure Browser = **gehosteter Chrome im Wegwerf-Container**, nur **Pixel-Stream** (kein HTML/DOM/Datei lokal), **kein VPN**, frische Session je Login. „interne Web-App ohne VPN, keine lokale Daten" → Secure Browser.

### Anti-Exfiltration und die EUC-Abgrenzung

**Das Problem:** Man will nicht nur den Zugriff ermöglichen, sondern Datenabfluss aktiv verhindern — und den Dienst korrekt von WorkSpaces/AppStream abgrenzen.

**Die Lösung:**
- **Policy-Kontrollen**: URL-Allow/Block, Steuerung von Clipboard/Datei-Transfer/Drucken, IP Access Controls, SAML-2.0-Föderation — gezielt gegen Datenexfiltration. Ideal für BYOD, Contractors, Callcenter-Agenten.
- **EUC-Abgrenzung**: **Secure Browser** = nur **Browser** (Web-Zugriff); **WorkSpaces** = ganzer **Desktop**; **AppStream** = einzelne **App**.

Reflex: „nur interne Websites/SaaS im Browser, ohne Daten aufs Gerät" → Secure Browser; „vollständiger Desktop" → WorkSpaces; „einzelne (Nicht-Web-)App" → AppStream.

🛑 **Aktualität:** „WorkSpaces Web" wurde 2024 in **„WorkSpaces Secure Browser"** umbenannt (Namespace/URLs unverändert). Beide Namen können vorkommen.

> **💡 Merksatz:** **Policy-Kontrollen** (Clipboard/Datei/Druck/URL) gegen Exfiltration. **Secure Browser (nur Browser) vs. WorkSpaces (Desktop) vs. AppStream (App)**. 🛑 früher „WorkSpaces Web".

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „sicherer Browser-Zugriff auf interne Websites/SaaS", „kein VPN", „BYOD", „keine Daten aufs Endgerät", „isolierter Browser" → Secure Browser.
- **Pixel-Stream** (kein HTML/DOM lokal), wegwerfbarer Container, frische Session; **Policy-Kontrollen** gegen Exfiltration.
- EUC-Trio: **Secure Browser (nur Browser) vs. WorkSpaces (Desktop) vs. AppStream (App)**.
- 🛑 früher „WorkSpaces Web" (beide Namen).

## 💡 Der eine Satz zum Mitnehmen

**WorkSpaces Secure Browser gibt sicheren, VPN-losen Zugriff auf interne Websites und SaaS über einen gehosteten Chrome, der nur Pixel streamt — kein HTML oder Datei landet auf dem Gerät — und ist im EUC-Trio der reine Browser, abzugrenzen vom ganzen Desktop (WorkSpaces) und der einzelnen App (AppStream).**
