---
service: AWS Device Farm
seedKey: saa-c03-script-device-farm
batch: B10
domains: [D3]
sourceRef:
  - https://docs.aws.amazon.com/devicefarm/latest/developerguide/welcome.html
  - https://aws.amazon.com/device-farm/
status: draft
---

# AWS Device Farm

## 📋 CLF-Recap *(Wiederholung — nur das Nötigste)*

> Device Farm ist im CLF-Kurs nicht vertieft — hier die Einordnung: App-Testing auf **echten physischen** iOS-/Android-Geräten (und Desktop-Browsern) in der AWS-Cloud, ohne eigene Testgeräte-Sammlung. Zwei Modi: **automatisierte Tests** und **Remote Access** (interaktives manuelles Testen). Use Case: **Kompatibilitätstests** über viele reale Geräte.

Der SAA vertieft: **echte Geräte statt Emulatoren, die zwei Modi — und die Abgrenzung.**

---

## 🎯 SAA-Vertiefung

### Echte Geräte statt Emulatoren

**Das Problem:** Eine Mobile-App soll auf hunderten Geräte-/OS-Kombinationen laufen. Emulatoren bilden reale Faktoren (Speicher, CPU, Hersteller-/Carrier-Firmware) nicht ab — ein Bug, der nur auf einem bestimmten Samsung-Modell auftritt, bleibt unentdeckt. Eine eigene Sammlung hunderter Testgeräte zu pflegen ist unbezahlbar.

**Die Lösung:** **Device Farm** stellt echte, physische iOS-/Android-Geräte (und Desktop-Browser) in der AWS-Cloud bereit — reale Hardware mit echter Firmware. So findet man gerätespezifische Probleme, die Emulatoren verbergen. „App auf vielen echten Geräten testen / Kompatibilität über reale Hardware" → Device Farm. (🔴 Nur in us-west-2/Oregon verfügbar.)

> **💡 Merksatz:** Device Farm = **echte physische Geräte** (iOS/Android) in der Cloud statt Emulatoren → findet gerätespezifische Bugs. 🔴 nur us-west-2.

### Die zwei Modi und die Abgrenzung

**Das Problem:** Man will sowohl automatisierte Test-Suites laufen lassen als auch ein reales Gerät manuell debuggen.

**Die Lösung — zwei Modi:**
- **Automatisierte Tests**: Test-Frameworks (Appium, Espresso, XCUITest) oder eingebaute Fuzz-Tests, parallel über viele Geräte; Videos/Logs/Screenshots als Ergebnis. Integration mit CodePipeline/Jenkins.
- **Remote Access**: interaktives, manuelles Testen/Debuggen eines echten Geräts in Echtzeit über den Browser.

Abgrenzung: Device Farm = **Testen auf echten Geräten**; **AppStream** = App-Streaming an Nutzer (kein Test-Grid); **Amplify** = Build/Deploy (kein Real-Device-Test); **EC2** = keine echten Mobilgeräte. „Mobile-App auf echten Geräten testen" → Device Farm.

> **💡 Merksatz:** **Automatisierte Tests** (Appium/Espresso/XCUITest, parallel, CI) + **Remote Access** (manuell debuggen). Device Farm = **Testen**, nicht Streamen (AppStream) oder Deployen (Amplify).

---

## ⚠️ Prüfungs-Knackpunkte

- Signalwörter: „Mobile-App auf echten Geräten testen", „Geräte-Kompatibilität", „iOS/Android-Testing", „Real-Device-Testing" → Device Farm.
- **Echte physische Geräte** statt Emulatoren; 🔴 nur us-west-2.
- Zwei Modi: **automatisierte Tests** (Appium/Espresso/XCUITest, CI-Integration) + **Remote Access** (manuell).
- Abgrenzung: Device Farm (testen) vs. AppStream (streamen) vs. Amplify (deployen).
- Einer der wenigen **offiziell in-scope** Front-End-Dienste.

## 💡 Der eine Satz zum Mitnehmen

**Device Farm testet Apps auf echten physischen iOS-/Android-Geräten in der Cloud — automatisiert oder per manuellem Remote Access — und findet so gerätespezifische Bugs, die Emulatoren verbergen; es ist ein Test-Grid, kein Streaming- (AppStream) oder Deploy-Dienst (Amplify).**
