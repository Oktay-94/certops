---
cardNumber: 99
slug: device-farm-echte-geraete
title: "Echte Geräte statt Emulatoren"
services: ["AWS Device Farm", "Amazon VPC"]
domains: ["D2", "D3"]
correctAnswer: "B"
badgeCount: 2
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/devicefarm/latest/developerguide/welcome.html"
  - "https://docs.aws.amazon.com/devicefarm/latest/developerguide/limits.html"
  - "https://docs.aws.amazon.com/devicefarm/latest/developerguide/test-types.html"
  - "https://docs.aws.amazon.com/devicefarm/latest/developerguide/custom-test-environment-test-spec.html"
  - "https://docs.aws.amazon.com/devicefarm/latest/developerguide/devices.html"
  - "https://aws.amazon.com/device-farm/"
  - "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-out-of-scope-services.html"
---

## Die Grundidee zuerst

Zwei Arten, ein Auto vor der Auslieferung zu prüfen.

**Weg eins:** Ein Fahrsimulator. Der Sitz steht auf Hydraulik, die Straße läuft auf einem Bildschirm, und alles, was du erfährst, hat vorher jemand programmiert. Lenkung, Bremsweg, Motorgeräusch — plausibel, aber gerechnet. Was der Simulator nie zeigt: dass die Beifahrertür bei minus fünf Grad klemmt. Das ist der Emulator auf dem Entwicklerlaptop.

**Weg zwei:** Eine Halle mit vierzig echten Fahrzeugen verschiedener Hersteller, und jemand fährt dein Testprogramm auf jedem einzelnen davon ab. Du besitzt die Halle nicht, du buchst sie. Du bekommst je Fahrzeug ein Protokoll, Fotos und eine Videoaufzeichnung.

AWS Device Farm ist die Halle.

Und der Grund, warum es sie überhaupt braucht, steht in der Aufgabe: „device-specific rendering issues". Ein Emulator führt Android aus. Er führt nicht *Samsungs* Android auf *diesem* Bildschirm mit *dieser* Schriftskalierung aus. Genau dort entstehen die Fehler, die im Store als Ein-Sterne-Bewertung ankommen und sich lokal nicht nachstellen lassen.

Halte für den Rest des Textes ein konkretes Team im Kopf: sechs Leute, eine Android- und iOS-App, Release alle zwei Wochen, und ein Fehlerbericht, der nur auf einem bestimmten Modell auftritt.

Der Weg, den dieses Team ohne den Dienst geht, ist bekannt: Man kauft zwölf Telefone. Nach einem Jahr sind vier davon veraltet, zwei haben einen kaputten Akku, und eines liegt seit dem Sommer in der Schublade einer Kollegin, die inzwischen woanders arbeitet. Der Aufwand steckt nicht im Kauf. Er steckt im Laden, Aktualisieren, Zurücksetzen und Nachkaufen — jedes Quartal, dauerhaft, für immer.

## Was es eigentlich ist — die Test-Spezifikation

Das zentrale Objekt ist nicht das Telefon. Es ist eine YAML-Datei, die beschreibt, **wie der Test-Host vorbereitet wird**, der das Telefon fernsteuert:

```yaml
version: 0.1
android_test_host: amazon_linux_2
phases:
  install:
    commands:
      - devicefarm-cli use node 22
      - devicefarm-cli use appium 3
  pre_test:
    commands:
      - appium --base-path=$APPIUM_BASE_PATH --log-timestamp >> $DEVICEFARM_LOG_DIR/appium.log 2>&1 &
  test:
    commands:
      - cd $DEVICEFARM_TEST_PACKAGE_PATH
      - java org.testng.TestNG -testjar *-tests.jar
  post_test:
    commands: []
artifacts:
  - $DEVICEFARM_LOG_DIR
```

Vier Phasen in fester Reihenfolge: `install` richtet Werkzeuge ein, `pre_test` startet Hintergrundprozesse, `test` führt aus, `post_test` räumt zusammen. `artifacts` sagt, welche Verzeichnisse eingesammelt werden.

Lies die Datei einmal daraufhin, was **fehlt**: kein Gerätename, keine Seriennummer, keine Android-Version. Die Datei beschreibt den Host, nicht das Gerät. Welche Geräte den Lauf bekommen, entscheidest du getrennt über den Device Pool, und die gerätespezifischen Werte reicht der Dienst zur Laufzeit als Umgebungsvariablen herein.

**Das ist die eigentliche Trennung, die dieser Dienst verkauft:** Deine Testanweisung ist einmal geschrieben und gilt für jedes Gerät. Die Vervielfältigung ist Sache des Dienstes.

## Der Weg durch die Karte

### Die linke Zone — Automatisiert aus der Pipeline

Die gestrichelte Zone ist keine Technik, sondern eine Betriebsart. Alles darin läuft ohne Menschen: Ein Build löst aus, der Dienst arbeitet ab, am Ende liegt ein Bericht vor. AWS nennt diese Bauform in der Dokumentation **service-side execution**.

### CI-Pipeline — App-Paket und Tests hochladen

Zwei Pakete gehen hoch, nicht eines: die Anwendung und das Testpaket. Beide landen in einem vom Dienst verwalteten S3-Bucket, den du nicht anlegst und nicht siehst.

Die Obergrenze für die Anwendung liegt bei 4 GB. Ein Detail, über das Android-Teams stolpern: Das `.aab`-Format wird nicht angenommen. Wer im Play Store ein App Bundle veröffentlicht, muss für den Test also ein `.apk` erzeugen — das ist kein Hindernis, aber es steht im Build-Skript und nicht in der Doku, die man beim Debuggen zuerst aufschlägt.

### Badge 1 — Device Farm fährt die Infrastruktur hoch

Jetzt entsteht, was vorher nicht existierte. Der Dienst startet die Test-Hosts nach deiner Spezifikation, verbindet sie mit den Geräten des gewählten Pools und führt aus.

Ein Host steht physisch nah am Gerät. Das klingt nach einer Fußnote und ist der Grund, warum die Konstruktion überhaupt funktioniert: Ein Appium-Befehl, der über den Atlantik läuft, wäre bei tausenden Befehlen je Testlauf unbrauchbar langsam.

### Device Farm — parallel auf echten Geräten

Hier lohnt es, die Begriffe des Dienstes zu sortieren, weil Prüfungsfragen sie benutzen:

- Ein **run** ist ein Build deiner App mit einem Satz Tests auf einer Menge Geräte.
- Ein **job** ist der Test dieser App auf **einem** Gerät.
- Ein **device pool** ist die Gerätemenge, auf die sich der run verteilt.

Ein Lauf über zwölf Geräte ist also ein run mit zwölf jobs. Und genau an dieser Stelle steht die Zahl, die man kennen sollte — sie kommt gleich in der Feinheit.

Der Device Pool ist dabei die eigentliche fachliche Entscheidung. Der Dienst bringt kuratierte Pools mit, etwa für die meistgenutzten Modelle; du kannst eigene Pools zusammenstellen und darin öffentliche und private Geräte mischen. Die Frage „welche Geräte" ist damit keine Beschaffungsfrage mehr, sondern eine Konfigurationszeile — und sie lässt sich vor jedem Release anders beantworten, ohne dass jemand etwas kauft.

### Badge 2 — der Bericht wächst mit

Der Testbericht entsteht nicht am Ende, sondern während des Laufs. Du musst nicht warten, bis das letzte Gerät fertig ist, um zu sehen, dass auf dem ersten schon etwas schiefgeht.

### Testbericht — Logs, Screenshots, Video, je Gerät einzeln

Je Gerät entstehen Ergebnisse, Gerätelogs, Screenshots, ein Video und Leistungsdaten. Das Video ist auf 1 GB begrenzt, das Gerätelog ebenfalls; darüber wird abgeschnitten. Überschreiten alle Artefakte eines Laufs zusammen 4 GB, können einzelne wegfallen.

Das Bild dazu: Die Werkstatt filmt jede Probefahrt. Bei vierzig Fahrzeugen ist die Festplatte irgendwann voll, und dann fehlt ausgerechnet das Video, das du sehen wolltest.

Wichtig für die Fehlersuche ist die Aufteilung: Der Bericht ist **je Gerät einzeln** gegliedert, nicht als Gesamtergebnis. Ein Test, der auf neunzehn von zwanzig Geräten grün ist und auf einem roten, erzeugt genau einen auffälligen Eintrag samt Screenshot des Moments, in dem es schiefging. Das ist der Unterschied zwischen „unsere Tests sind rot" und „auf diesem Modell bricht der Zahlungsdialog um."

### Die rechte Zone — Interaktiv am Einzelgerät

Die zweite Betriebsart, und der zweite Teil der Prüfungsfrage. Eine **remote access session** schaltet ein einzelnes echtes Gerät live in deinen Browser. Du wischst, tippst, drehst — an einem Telefon, das in einem Rechenzentrum in Oregon liegt.

### Remote Access — Gerät live im Browser

Dazu kommt ein verwalteter Appium-Endpunkt: Du fährst deine Tests aus der eigenen Entwicklungsumgebung gegen das entfernte Gerät, mit Haltepunkten, Live-Video und Live-Logs. Die Sprache und die IDE sind deine.

Eine Sitzung ist auf **150 Minuten** begrenzt, hart. Innerhalb dieser 150 Minuten darfst du so oft ausführen, wie du willst. Ein einzelner Appium-Befehl bricht nach vier Minuten ab; und die Befehle laufen der Reihe nach ab, nicht gleichzeitig.

Für unser Team ist das der Weg zum gemeldeten Fehler: Statt zu raten, welches Modell der Nutzer meinte, öffnet jemand eine Sitzung auf genau diesem Gerät, installiert den Stand, in dem der Fehler auftrat, und tippt die Schritte nach. Während der Sitzung protokolliert der Dienst mit; am Ende liegen Log und Videoaufzeichnung vor. Aus „lässt sich bei uns nicht nachstellen" wird damit ein Ticket mit Beweisstück.

### Rahmenbedingungen — us-west-2 und die Gerätewahl

Der navyfarbene Kasten enthält die zwei Tatsachen, die häufiger geprüft werden als der Ablauf.

Erstens: **Device Farm gibt es ausschließlich in us-west-2 (Oregon).** Nicht in Frankfurt, nicht in Irland. Wer den Dienst in seiner Heimatregion sucht, findet ihn nicht — und das ist kein Fehler in der Konsole.

Zweitens: Neben dem öffentlichen Gerätepool gibt es Private Devices. Das sind physische Geräte, die AWS für dich in einem Rechenzentrum bereitstellt und die exklusiv dir gehören, mit deiner Konfiguration zwischen Sitzungen — bis hin zu Sonderfällen wie gerooteten Android-Geräten. Beendest du das Abonnement, wird die Hardware wieder ausgebaut.

Test-Hosts und Geräte können sich sicher mit deiner VPC verbinden, um private Endpunkte zu erreichen. Deshalb steht VPC auf der Karte: Eine App, die im Test gegen eine interne API sprechen muss, braucht keinen öffentlich erreichbaren Testserver.

### Der rote Pfad — Emulatoren auf EC2

Emulatoren sind billig, sofort verfügbar und für die ersten neunzig Prozent der Testfälle völlig ausreichend. Sie zeigen nur nicht, was das Szenario sehen will: herstellerspezifisches Rendering, echte Sensorik, Funkmodems, Energieverhalten.

Die Karte lehnt die Box deshalb über X-Kreis und roten Pfad ab, behält aber ihre Rollenfarbe Compute. Emulatoren sind kein Fehler. Sie sind nur keine Antwort auf diese Frage.

In der Praxis stehen beide nebeneinander: Emulatoren laufen bei jedem Commit, weil sie in Sekunden starten und nichts kosten. Der Lauf auf echten Geräten hängt am Release-Zweig, weil er länger dauert und je Gerätminute abgerechnet wird. Wer beides an dieselbe Stelle der Pipeline hängt, bezahlt entweder zu viel oder wartet zu lange.

## Die entscheidende Unterscheidung

Der ganze Dienst hängt an einer Achse, und Prüfungsfragen leben davon, sie zu verwechseln:

| | Automatisiert (service-side) | Interaktiv (remote access) |
|---|---|---|
| Wer startet? | die Pipeline | ein Mensch im Browser |
| Wo läuft der Testcode? | auf dem verwalteten Test-Host | auf deinem Rechner, gegen das Gerät |
| Wie viele Geräte? | viele, verteilt auf jobs | genau eines |
| Wofür? | Regression vor jedem Release | einen gemeldeten Fehler nachstellen |
| Harte Grenze | 150 Minuten je Testlauf | 150 Minuten je Sitzung |

Der eine Modus skaliert über die Breite. Der andere gibt dir ein Gerät in die Hand. Beides ist derselbe Dienst.

## Die ehrliche Feinheit

Jetzt die Zahl, auf die alles zuläuft, und sie widerspricht dem ersten Eindruck der Karte.

„Parallel auf echten Geräten" ist wahr, aber begrenzt: Die Dokumentation nennt **fünf** Geräte, die während eines Testlaufs gleichzeitig getestet werden, und fünf als voreingestellte Nebenläufigkeit je Konto für metered use. Beides ist auf Anfrage erhöhbar, die Nebenläufigkeit bei unmetered use entspricht der Zahl gebuchter Slots.

**Der Gerätepool hat hunderte Geräte. Dein Lauf hat standardmäßig fünf gleichzeitig.** Das ist kein Widerspruch: Ein run über 40 Geräte ist erlaubt — die Zahl der Geräte in einem Lauf ist nicht begrenzt —, er arbeitet sie nur in Wellen ab. Wer im Kopf rechnet „40 Geräte, 8 Minuten je Gerät, also 8 Minuten Gesamtdauer", plant den Release-Tag falsch.

Zweite Feinheit: Der Testlauf selbst hat dieselbe harte Grenze von 150 Minuten wie die Remote-Sitzung. Auf der Karte steht die Zahl nur im Remote-Access-Kasten. Sie gilt für beide Betriebsarten.

Dritte Feinheit, ein dokumentierter Quellenkonflikt: Die Produktseite nennt weiterhin eine breite Auswahl an Test-Frameworks. Der Developer Guide listet für automatisierte Läufe Appium für Android, iOS und Web, dazu Instrumentation für Android sowie XCTest und XCTest UI für iOS, und als eingebauten Test nur noch den Fuzz-Test. Zwei AWS-Seiten, zwei Detailtiefen. Für die Prüfung reicht: Appium ist der plattformübergreifende Weg, XCTest und Instrumentation sind die nativen.

Vierte Feinheit: Läufe stehen bis zu 24 Stunden in der Warteschlange, danach verfallen sie. Und ein automatisierter Lauf ohne eigene Testumgebung verträgt höchstens 250 einzelne Testfälle, sonst wird er übersprungen.

Fünfte Feinheit, die nur auf den ersten Blick nach einer Nebensache aussieht: Der Gerätebestand ist keine feste Zahl. AWS pflegt die Liste laufend, Modelle kommen dazu und fallen weg. Deshalb steht auf der Karte bewusst keine Gerätezahl im Bild — sie wäre am Tag des Drucks richtig und ein halbes Jahr später falsch. Wer für eine Architekturentscheidung wissen muss, ob ein bestimmtes Modell dabei ist, schaut in die Geräteliste der Konsole, nicht in eine Präsentation.

## Syntax lesen — die `$DEVICEFARM_`-Variablen

Der Test-Host bekommt zur Laufzeit alles Gerätespezifische hereingereicht. Das ist der Mechanismus, der eine Datei für vierzig Geräte funktionieren lässt:

```
$DEVICEFARM_DEVICE_NAME          ── Modellbezeichnung
$DEVICEFARM_DEVICE_UDID          ── eindeutige Gerätekennung
$DEVICEFARM_DEVICE_PLATFORM_NAME ── Android oder iOS
$DEVICEFARM_DEVICE_OS_VERSION    ── Betriebssystemstand
$DEVICEFARM_APP_PATH             ── deine hochgeladene App
$DEVICEFARM_TEST_PACKAGE_PATH    ── dein entpacktes Testpaket
$DEVICEFARM_LOG_DIR              ── hier eingesammelte Artefakte
```

Namen, die mit `$DEVICEFARM_` beginnen, sind reserviert. Eigene Variablen darfst du bis zu 32 Stück je Projekt oder Lauf setzen, Name und Wert je höchstens 256 Zeichen.

Wer diese Liste einmal gelesen hat, versteht, warum die Test-Spezifikation kein Gerät nennt: Sie *kann* keines nennen. Sie wird für jedes Gerät neu mit anderen Werten ausgeführt.

## Was du dadurch nicht baust

- keinen Schrank mit Telefonen, die jemand lädt, aktualisiert und ersetzt
- keine USB-Hubs und keine Rechner, die daran hängen
- keinen eigenen Appium-Grid und keine Test-Runner-Instanzen
- keine Videoaufzeichnung und keine Log-Sammlung von Hand
- keinen Beschaffungsvorgang, sobald ein neues Modell erscheint
- keinen öffentlich erreichbaren Testserver, nur damit die App eine interne API erreicht

Übrig bleiben: zwei hochgeladene Pakete, eine YAML-Datei und die Auswahl, auf welchen Geräten das laufen soll.

## Wenn du dir eine Sache merkst

**Echte Hardware aus der Pipeline heraus ist Device Farm; ein einzelnes Gerät live im Browser ist derselbe Dienst in der anderen Betriebsart.**

Emulatoren auf EC2 zeigen kein herstellerspezifisches Rendering — genau das, wonach das Szenario fragt. Ein eigenes Gerätelabor ist exakt der Investitions- und Pflegeaufwand, den die Frage vermeiden will. Und CodeBuild als vermeintlicher Testrunner steht für dieses Examen ohnehin außerhalb des Prüfungsstoffs.

## Prüfungsknackpunkte

**Signalwörter:** „real devices" oder „physical devices" plus „from the CI pipeline" führt zur automatisierten Betriebsart. „Interactively reproduce a bug on one device" führt zu Remote Access. Steht „hundreds of devices" da, ist das eine Aussage über den Pool, nicht über die Gleichzeitigkeit.

**Die Regionsfalle.** Eine Frage beschreibt eine Anwendung in eu-central-1 und fragt nach Gerätetests. Device Farm gibt es nur in us-west-2. Das ist kein Ausschlusskriterium für die Antwort — es ist ein Planungsdetail, und Antwortoptionen, die den Dienst in einer anderen Region versprechen, sind falsch.

**Die Verwechslungsfalle.** Wer „einen Fehler auf genau diesem Modell nachstellen" liest und mit „automatisierte Testläufe" antwortet, hat den richtigen Dienst und den falschen Modus gewählt.

**A — Emulatoren und Simulatoren auf EC2:** Bilden das Betriebssystem nach, nicht die Hardware und nicht die Anpassungen der Hersteller.

**C — Ein eigenes Gerätelabor im Büro:** Löst das Problem fachlich, erzeugt aber Anschaffung, Lagerung und Pflege — also genau die Kosten, die das Szenario nennt.

**D — Eine Flotte von EC2-Instanzen mit eigenem Appium-Grid:** Verlagert die Testinfrastruktur zurück zu dir. Die Test-Hosts stellt der Dienst bereits.

**E — Nur manuelle Tests auf den Geräten der Teammitglieder:** Deckt eine Handvoll Modelle ab, ist nicht wiederholbar und liefert keine Artefakte, mit denen sich ein Fehler belegen lässt.
