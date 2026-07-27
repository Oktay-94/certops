---
nr: 99
title: Echte Geräte statt Emulatoren
services: [AWS Device Farm, Amazon VPC]
domains: [D2, D3]
signalwords:
  - "test on hundreds of real devices"
  - "automated tests from the CI pipeline"
  - "interactively reproduce a bug on one device"
  - "device-specific rendering issues"
assets: [battle_card_99.svg, battle_card_99.png, battle_card_99.pdf]
status_note: |
  qc.py 0 Befunde. Gemeldet: 7 Boxen, 24 Texte, 10 Segmente, 2 Badges,
  1 X-Kreis. Aufschlüsselung Boxen: 3 Boxen der Testkette + 1 Remote-Access-
  Box + 1 Rahmenband + 1 verworfene Box + 1 Footer-Rect = 7. Die beiden
  gestrichelten Zonen zählt qc.py konventionsgemäß NICHT als Boxen mit.
  Segmente: 2 Kettenpfeile + 2 Segmente des Bypass + 2 X-Diagonalen = 6
  gezeichnete, dazu 4 Phantomsegmente aus zwei Marker-IDs ("kette",
  "verworfen") = 10.
  Korrekturrunden: keine. Untertitel vor dem Zeichnen gegen den echten
  Render gemessen (Reserve 15,6 px).
  Zonengeometrie: Zonenoberkante y=150, Zonenlabel bei y=178, erste Boxreihe
  bei y=225 — 75 px Abstand, deutlich über den im Handoff geforderten 45 px.
  precheck.py vor dem Zeichnen: 16 Texte, 0 Befunde, engste Reserve 41,1 px
  ("Emulatoren auf EC2" 245/286 px).
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde. R12-Gegencheck: 0 Verstöße.
  r16.py: 43,0 px am Zonenlabel "Automatisiert aus der Pipeline".
  Footer von Hand gemessen: 832 px.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

## Szenario

Ein Team veröffentlicht eine mobile Anwendung und muss vor jedem Release
wissen, ob sie auf den tatsächlich verbreiteten Geräten funktioniert — nicht
auf einem Referenzgerät, sondern quer über Hersteller, Bildschirmgrößen und
Betriebssystemstände. Ein eigenes Gerätelabor wäre Anschaffung, Lagerung und
Pflege.

## Ablauf

Die Karte zeigt zwei Betriebsarten nebeneinander, weil Device Farm in
Prüfungsfragen genau an dieser Unterscheidung hängt.

**Automatisiert aus der Pipeline (server-side execution)**

1. **CI-Pipeline.** Anwendungspaket und Testpaket werden hochgeladen.
2. **Device Farm führt aus.** Die Tests laufen parallel auf den Geräten des
   gewählten Pools, auf verwalteten Test-Hosts nach einer
   Test-Spezifikationsdatei. Eigene Testinfrastruktur entfällt.
3. **Testbericht.** Je Gerät entstehen Logs, Screenshots, ein Video und
   Leistungsdaten — der Bericht wird während des Laufs fortgeschrieben.

**Interaktiv am Einzelgerät (remote access)**

Eine Sitzung schaltet ein einzelnes echtes Gerät live in den Browser. Das
ist der Weg, um einen gemeldeten Fehler auf genau dem Modell nachzustellen.
Über einen verwalteten Appium-Endpunkt lassen sich Tests aus der eigenen
Entwicklungsumgebung gegen das entfernte Gerät fahren, mit Haltepunkten,
Live-Video und Live-Logs. Eine Sitzung ist auf 150 Minuten begrenzt.

**Rahmenbedingungen**, die häufiger prüfungsrelevant sind als der Ablauf:
Device Farm gibt es ausschließlich in us-west-2. Neben dem öffentlichen
Gerätepool sind Private Devices buchbar, die exklusiv einem Konto zugeordnet
sind und ihre Konfiguration zwischen Sitzungen behalten.

## Prüfungs-Kernsatz

Echte Hardware, parallel, aus der Pipeline heraus führt zu Device Farm; ein
einzelnes Gerät live im Browser ist die Remote-Access-Sitzung desselben
Dienstes.

## Abgrenzungen

- **Emulatoren und Simulatoren auf EC2.** Billiger und schnell verfügbar,
  zeigen aber weder herstellerspezifisches Rendering noch echte Sensorik,
  Funkmodems oder Energieverhalten.
- **Eigenes Gerätelabor.** Genau das Investitions- und Pflegeproblem, das
  der Dienst ablöst.
- **Private Devices mit VPC-Anbindung.** Wenn die Anwendung im Test gegen
  private Endpunkte sprechen muss, führt der Weg über die VPC-Anbindung der
  Testumgebung, nicht über ein öffentliches Testsystem.

## Klassiker-Fallen

- Die Regionsbindung übersehen. Wer Device Farm in seiner Heimatregion
  sucht, findet den Dienst nicht.
- Server-side execution und Remote Access verwechseln. Der eine Modus
  skaliert über viele Geräte, der andere gibt ein Gerät in die Hand.
- Annehmen, ein Testlauf brauche eigene Test-Runner-Infrastruktur. Die
  Test-Hosts stellt der Dienst.

## Faktencheck-Notizen

- Zwei Betriebsarten, parallele Ausführung auf mehreren Geräten, verwaltete
  Test-Hosts, Testbericht mit Logs, Screenshots, Video und Leistungsdaten,
  150-Minuten-Grenze der Remote-Sitzung, ausschließliche Verfügbarkeit in
  us-west-2: AWS Device Farm Developer Guide, „What is AWS Device Farm?".
- Verwalteter Appium-Endpunkt mit Live-Video, Live-Logs und Haltepunkten:
  Developer Guide, „Appium testing in AWS Device Farm".
- Private Devices zur exklusiven Nutzung mit erhaltenen Einstellungen:
  Produktseite AWS Device Farm.
- Device Farm ist im SAA-C03-Exam-Guide unter „Front-End Web and Mobile" als
  in-scope gelistet.

## Nicht bestätigt / bewusst weggelassen

- **Test-Framework-Liste.** Die Produktseite nennt weiterhin Appium,
  Calabash und Espresso; der Developer Guide führt praktisch nur noch Appium
  sowie eingebaute Tests. Zwei AWS-Quellen, zwei Aussagen — nach
  Projektregel steht deshalb nur Appium auf der Karte, das in beiden
  Quellen gedeckt ist.
- **Gerätezahl.** Weder „hunderte" noch eine konkrete Zahl steht im Bild;
  der Gerätebestand ändert sich laufend und wird von AWS nicht als feste
  Zahl dokumentiert. Die Masterplan-Formulierung „hunderte" bleibt damit
  bewusst im Szenariotext und nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- Der Gerätepool ist nicht als eigenes Element gezeichnet, sondern als
  Eigenschaft im Rahmenband geführt.
- Die VPC-Anbindung privater Geräte an eigene Endpunkte ist erwähnt, aber
  nicht als Netzweg dargestellt.

## Farbkonventionen dieser Karte

Pfeilfarbe orange, weil die Kette dem Weg des Testlaufs folgt, also der
Verarbeitung. Die Remote-Access-Box ist gold (Governance), weil sie eine
Betriebsart und keinen Schritt der automatisierten Kette zeigt. Das
Rahmenband ist navy (Struktur). Die verworfene Box behält ihre Rollenfarbe
Compute (orange), abgelehnt über X-Kreis und roten Pfad — keine rote
Füllung.
