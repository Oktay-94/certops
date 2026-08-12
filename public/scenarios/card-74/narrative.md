---
cardNumber: 74
slug: migration-hub-application-discovery-portfolio
title: "Migration Hub + Application Discovery Service — erst erfassen, dann in Wellen migrieren"
services: ["AWS Migration Hub", "AWS Application Discovery Service", "Agentless Collector", "Discovery Agent", "AWS Application Migration Service", "AWS Database Migration Service"]
domains: ["D4", "D3"]
correctAnswer: "C"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/what-is-appdiscovery.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/agentless-collector.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-agent.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/doc-history.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/ads_service_limits.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/discovery-import.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/userguide/application-discovery-service-availability-change.html"
  - "https://docs.aws.amazon.com/application-discovery/latest/APIReference/Welcome.html"
  - "https://docs.aws.amazon.com/migrationhub/latest/ug/home-region.html"
  - "https://docs.aws.amazon.com/migrationhub/latest/ug/select-home-region.html"
  - "https://docs.aws.amazon.com/migrationhub/latest/ug/change-home-region.html"
  - "https://docs.aws.amazon.com/mhj/latest/userguide/migrationhub-availability-change.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/11/network-connections-aws-application-discovery-service-agentless-collector/"
  - "https://aws.amazon.com/blogs/migration-and-modernization/deprecation-of-aws-application-discovery-service-discovery-connector/"
  - "https://aws.amazon.com/migration-hub/faqs/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Bürogebäude zu räumen.

**Weg eins:** Ihr fangt am Montag im Erdgeschoss an und tragt raus, was euch in die Hände fällt. Am Dienstag stellt jemand fest, dass der Server im Keller, den ihr gestern abgeschaltet habt, die Zeitkonten für vier Abteilungen geführt hat. Niemand wusste das, weil es nirgends aufgeschrieben stand. Es stand nur in den Kabeln.

**Weg zwei:** Bevor irgendetwas bewegt wird, geht ihr durch jeden Raum und schreibt zwei Dinge auf. Erstens: was steht hier, wie groß ist es, wie stark wird es benutzt. Zweitens — und das ist das Teure — welche Kabel gehen aus diesem Raum heraus und wohin.

Das erste ist ein Inventar. Das zweite ist eine Abhängigkeitskarte. Nur das zweite sagt dir, welche Räume gemeinsam umziehen müssen.

Application Discovery Service ist das Aufschreiben, Migration Hub das Blatt Papier, auf dem alles zusammenläuft. Und wie bei jedem Umzug gibt es zwei Arten zu schauen: durch die offene Tür — schnell, alle Räume, aber du siehst nur, was von der Schwelle aus sichtbar ist. Oder du gehst hinein und öffnest die Schubladen — langsam, ein Raum nach dem anderen, dafür siehst du alles.

Diese eine Unterscheidung trägt die ganze Karte.

## Was es eigentlich ist — ein Server-Datensatz

Migration Hub ist kein Werkzeug, das etwas tut. Es ist ein Speicher, in dem jeder Server deines Rechenzentrums zu einem **Datensatz** wird. Am schnellsten begreift man das an der CSV-Vorlage, die AWS für den Datei-Import bereitstellt — sie zeigt in einer einzigen Zeile, was ein Server für diesen Dienst überhaupt ist:

```csv
ExternalId,HostName,IPAddress,MACAddress,VMware.VMName,OS.Name,OS.Version,
CPU.NumberOfCores,CPU.UsagePct.Avg,CPU.UsagePct.Max,
RAM.TotalSizeInMB,RAM.UsedSizeInMB.Avg,RAM.UsedSizeInMB.Max,
Applications,Tags

INV-4711,payments-db-01.corp.local,10.12.31.233,00:1B:44:11:3A:B7,VM-PAY-01,
Linux,16.04.3,
8,23.9,55.3,
64128,41022,58110,
"Zahlungsverkehr","zone:1, critical:yes"
```

Lies das von links nach rechts, dann hast du den Dienst verstanden.

`ExternalId` ist dein eigener Schlüssel — die Inventarnummer aus eurer CMDB. Danach kommen die vier Identitätsfelder. Ein Datensatz braucht **mindestens eines** aus dieser Gruppe: `ExternalId`, `HostName`, `IPAddress`, `MACAddress` oder das Paar `VMware.MoRefId` plus `VMware.VCenterId`. Fehlt jedes davon, wird die Zeile abgewiesen, weil der Import den Server nicht von einem anderen unterscheiden kann.

Dann die Paare, auf die es wirklich ankommt: `CPU.UsagePct.Avg` und `.Max`, `RAM.UsedSizeInMB.Avg` und `.Max`. **Jede EC2-Empfehlung, die später herauskommt, steht auf genau diesen Zahlen.** Ein Server mit 64 GB RAM, der im Schnitt 41 GB benutzt und in der Spitze 58 GB, bekommt eine andere Instanz vorgeschlagen als einer, der bei denselben 64 GB nie über 6 GB kommt. Ohne Auslastungsdaten empfiehlt dir der Hub nichts Besseres als „gleich groß wie vorher" — und genau das ist der teuerste Umzug, den man machen kann.

`Applications` ist kein Klick in der Konsole, sondern ein Feld. Gruppierung ist Daten, nicht Bedienung.

Was in dieser Zeile **nicht** steht: keine Prozesse, keine Ports, keine Gegenstelle. Die Abhängigkeiten sind nicht Teil des Serverdatensatzes. Sie sind ein eigener Datenstrom, und er kommt aus einer anderen Quelle. Deshalb gibt es überhaupt zwei Collector.

## Der Weg durch die Karte

### Der Kasten links oben — die Server-Landschaft

Physische Server und VMware-vCenter nebeneinander, und das ist kein Zufall der Zeichnung. Es ist der Grund für die Zweiteilung darunter.

Der Agentless Collector spricht mit vCenter. Was nicht in vCenter steht — die alte physische Maschine im Nebenraum, der Server unter dem Schreibtisch der Buchhaltung — sieht er nicht. Für den Rest brauchst du entweder einen Agent oder einen Datei-Import.

Die drei Zeilen im Kasten sind die drei Datenarten: Konfiguration (was ist es), Auslastung (wie stark wird es benutzt), Abhängigkeiten (mit wem redet es). Merk dir die Reihenfolge — die Schwierigkeit steigt von Zeile zu Zeile, und der Preis auch.

### Badge 1 — tief: je Server

Der Discovery Agent ist Software, die du auf jeder einzelnen Maschine installierst. Windows und Linux, physisch, virtuell, auch auf EC2-Instanzen.

Der Preis steht in der Formulierung „je Server": Paketverteilung, Änderungsfenster, Freigaben, ein Betriebsteam, das nicht begeistert ist. Bei zwölf Servern ist das ein Nachmittag. Bei achthundert ist es ein Projekt vor dem Projekt.

### Der Kasten — Discovery Agent

Dafür bekommst du, was nur von innen sichtbar ist: laufende Prozesse, ein- und ausgehende Netzverbindungen, und Performance-Daten als **Zeitreihe** statt als Mittelwert.

Der Unterschied zwischen Zeitreihe und Mittelwert ist der Unterschied zwischen „der Server ist zu 20 % ausgelastet" und „der Server langweilt sich 23 Stunden und rechnet nachts um drei eine Stunde lang volle Kanne". Für die Instanzwahl ist das dieselbe Zahl. Für die Frage, ob du den Job überhaupt noch als Server brauchst, ist es die ganze Antwort.

Und dann die Zahl, die niemand auf dem Schirm hat: **1.000 aktive Agents pro Konto.** Aktiv heißt: sammelt und sendet. Für inaktive Agents liegt die Grenze bei 10.000. Ein Rechenzentrum mit 1.500 Servern kann also gar nicht alle gleichzeitig tief vermessen. Der Agent ist ein Skalpell, kein Flächenwerkzeug — und die Quote sagt dir das mit einer Zahl.

### Badge 2 — breit: vCenter

Eine einzige OVA-Datei, in vCenter ausgerollt, und du bist fertig. Kein Zugriff auf die Gast-Betriebssysteme, keine Paketverteilung, kein Änderungsfenster pro Maschine.

Das Bild dazu: Der Agent klingelt an jeder Wohnungstür. Der Agentless Collector fragt den Hausmeister, der ohnehin alle Schlüssel hat.

### Der Kasten — Agentless Collector

Er inventarisiert, was vCenter über die VMs weiß: Hostnamen, IP- und MAC-Adressen, Disk-Zuteilung, dazu Datenbank-Engine-Versionen und Schemata. Und er berechnet für jede VM Durchschnitt und Spitze für CPU, RAM und Disk-I/O — also genau die Avg/Max-Paare aus dem Datensatz oben.

Der Collector ist modular aufgebaut, und ein Modul ist für die Karte entscheidend: Seit dem **8. November 2024** gibt es das Network Data Collection Module, mit dem auch der agentenlose Weg Verbindungen zwischen Servern sieht. Vorher war Abhängigkeits-Mapping ausschließlich Agent-Gebiet. Ein zweites Modul erfasst Datenbanken und ist an DMS angebunden.

Damit ist die alte Merkregel „agentenlos = keine Abhängigkeiten" faktisch überholt — was sie für die Prüfung leider nicht ist. Dazu unten mehr.

Am Rande, weil es in Kursmaterial noch herumgeistert: Der frühere **Discovery Connector** ist am **17. November 2025** aus dem Support gefallen. Wenn eine Quelle ihn dir noch als Option verkauft, ist die Quelle alt.

### Badge 3 — Daten in die Home Region

Beide Collector schicken ihre Daten an einen einzigen Ort, und dieser Ort wird **vorher** festgelegt.

Die Home Region ist kein Detail der Konsole. Sie ist der Speicherort für dein gesamtes Discovery- und Planungswissen. Schreibende API-Aufrufe von außerhalb der Home Region werden abgewiesen — mit einer ausdrücklichen Ausnahme, die man kennen sollte: Agents und Collector dürfen sich auch von außerhalb registrieren. Lesende Aufrufe sind ohnehin überall erlaubt.

Die Konsequenz steht in der Doku in einem Nebensatz und ist trotzdem die härteste Aussage der ganzen Karte: **Wechselst du die Home Region, musst du alles neu erfassen. Bereits gesammelte Daten wandern nicht mit.**

Wer nach drei Monaten Discovery merkt, dass er die falsche Region gewählt hat, fängt bei null an.

### Der Kasten — AWS Migration Hub

Hier liegt alles zusammen, und hier passieren drei Dinge.

**Gruppieren:** Aus Servern werden Anwendungen. Bis zu 1.000 Anwendungen pro Konto, bis zu 400 Server je Anwendung. Wer darüber liegt, schneidet anders oder löscht.

**Importieren:** Der Weg ohne Collector. CSV in einen S3-Bucket legen, `aws discovery start-import-task --import-url s3://bucket/ImportFile.csv --name Erfassung-Q3` aufrufen, fertig. Maximal 10 MB je Datei, 25.000 importierte Datensätze pro Konto. Auch RVTools-Exporte aus vSphere lassen sich direkt einlesen. Das ist der Grund, warum die Kursivzeile „auch Import per Datei möglich" auf der Karte steht: Wenn in der Aufgabe „wir haben schon ein Inventar" vorkommt, ist das die Antwort — nicht ein weiterer Collector.

**Tracken:** MGN und DMS melden ihren Fortschritt hierher. Der Hub selbst rührt keinen Server an.

### Badge 4 — planen

Der Pfeil nach rechts ist der einzige Schritt, in dem aus Daten eine Entscheidung wird.

Aus Spezifikation plus Auslastung errechnet der Hub die günstigste EC2-Instanz, die den Workload noch trägt. Aus den Netzverbindungen ergibt sich, welche Server gemeinsam in eine Welle müssen. Aus beidem entsteht der Wellenplan.

### Der Kasten rechts — das Ergebnis

Drei Zeilen, drei verschiedene Dinge — und nur die ersten beiden sind Erkenntnis.

EC2-Empfehlungen sind eine Rechnung. Wellen nach Abhängigkeit sind eine Interpretation deiner Netzdaten. „Tracking: MGN, DMS" dagegen ist gar kein Ergebnis, sondern ein Zustand: Die eigentlichen Migrationswerkzeuge melden hierher zurück.

Und daran hängt die Falle, die auf jeder zweiten Prüfungsfrage steht: **Der Hub sieht die Migration. Er macht sie nicht.**

## Die entscheidende Unterscheidung — Agent gegen Agentless

| | Discovery Agent | Agentless Collector |
|---|---|---|
| Installation | auf jedem Server einzeln | eine OVA in vCenter |
| Reichweite | physisch, virtuell, EC2 | was in vCenter steht |
| Betriebssystem-Zugriff | nötig | nicht nötig |
| Prozesse | ja | nein |
| Performance | Zeitreihe | Durchschnitt und Spitze |
| Netzverbindungen | ja, von Anfang an | ja, über ein eigenes Modul seit 11/2024 |
| Datenbank-Inventar | nein | ja, mit DMS-Anbindung |
| Harte Grenze | 1.000 aktive Agents pro Konto | — |

## Die ehrliche Feinheit

**Erstens: Die Netzfrage ist in der AWS-Doku selbst nicht entschieden.** Der User Guide und die Ankündigung vom November 2024 beschreiben das Network Data Collection Module des Agentless Collector. Die API Reference desselben Dienstes behauptet bis heute das Gegenteil — dort steht, agentenlose Erfassung sammle keine Netzabhängigkeiten, das könne nur der Agent.

Zwei offizielle Seiten, zwei Aussagen. Nach der Quellenrangfolge gewinnt der User Guide, weil er dem Dienst gehört und die Ankündigung ihn stützt. Für die Prüfung gilt trotzdem die ältere Trennung: Steht in der Frage „dependency mapping", ist die erwartete Antwort der **Agent**. Das ist keine Ausrede, sondern eine Beobachtung darüber, wie Fragenpools altern.

**Zweitens: Auch die Home Region widerspricht sich.** Eine Seite des Migration-Hub-Guides sagt, die Home Region lasse sich nach dem Setzen nur noch über den AWS Support ändern. Die Seite direkt daneben — verlinkt von der ersten — beschreibt eine vollständige Selbstbedienungs-Prozedur: in den Einstellungen „Remove" wählen, bestätigen, neue Region setzen; oder per CLI `delete-home-region-control` und danach `create-home-region-control`. Beides derselbe Guide.

Praktisch ist das egal, weil beide Wege dich dieselbe Sache kosten: das erneute Einsammeln aller Daten. Didaktisch ist es der bessere Merksatz — nicht „unveränderlich", sondern „umsonst gesammelt".

**Drittens, und das steht auf der Karte nur halb:** Nicht nur Migration Hub ist seit dem **7. November 2025** für Neukunden geschlossen — **Application Discovery Service ist es genauso.** Beide Dienste laufen für Bestandskunden weiter, bekommen aber keine neuen Funktionen mehr. Neue Projekte führt AWS über **AWS Transform**, das seit Mai 2025 verfügbar ist und Discovery, Abhängigkeits-Mapping und Wellenplanung mit übernimmt.

Die Karte lehrt den Prüfungsstand. Dieser Absatz ist der Stand der Welt.

## Syntax lesen — die Identitätsfelder

Der häufigste Importfehler ist kein Tippfehler, sondern eine Zeile ohne Identität. Die Regel als Aufriss:

```
Ein Datensatz wird angenommen, wenn MINDESTENS EINES gefüllt ist:

  ExternalId ─────────── dein eigener Schlüssel (CMDB, Inventarnummer)
  HostName ───────────── am besten als FQDN
  IPAddress ──────────── mehrere in Anführungszeichen: "10.12.31.233, 10.12.32.11"
  MACAddress ─────────── ebenso
  VMware.MoRefId  ┐
  VMware.VCenterId┘ ──── nur ZUSAMMEN gültig, nie einzeln
```

Zwei Dinge stecken darin. Erstens: `VMware.MoRefId` und `VMware.VCenterId` sind ein Paar, nicht zwei Optionen — eines allein identifiziert nichts, weil eine Managed-Object-Referenz nur innerhalb ihres vCenter eindeutig ist.

Zweitens, und das ist die eigentliche Empfehlung: Setz `ExternalId`, auch wenn du nicht musst. Gibst du keinen eigenen Schlüssel an, bildet der Import selbst einen aus IP, Hostname, MAC und dem VMware-Paar. Das funktioniert — bis jemand einer Maschine eine neue IP gibt und derselbe Server beim nächsten Import als zweiter Server auftaucht. Mit `ExternalId` bleibt Server INV-4711 über alle Importe hinweg derselbe Server.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** entsteht:

- keine CMDB — es gibt kein Änderungsmanagement, keine Historie, keinen Genehmigungsworkflow
- keine Anwendungserkennung aus dem Nichts: Der Dienst zeigt dir Verbindungen, die Gruppierung zu „Zahlungsverkehr" machst du
- keine automatische Wellenplanung, die auf Knopfdruck einen Terminplan ausspuckt
- keine Migration: kein Byte wandert durch diesen Dienst
- keine Lizenz- oder Vertragsbetrachtung — die Kostenrechnung endet bei der Instanzgröße
- kein Blick in die Anwendung: Der Agent sieht, dass ein Prozess läuft, nicht was er fachlich tut
- keine Dauerlösung: Discovery-Projekte haben laut AWS typischerweise etwa vier Monate Lebensdauer

Übrig bleibt eine Landkarte. Gefahren wird woanders.

## Wenn du dir eine Sache merkst

**Der Hub bewegt nichts. Er weiß nur, wo alles steht und wer es gerade bewegt.**

MGN repliziert Server blockweise nach EC2 — es migriert, aber es plant nicht. DMS bewegt Datenbanken — es kennt keine Server. Migration Evaluator liefert einen Geschäftsfall, keinen Wellenplan. Keiner der drei ist die Klammer.

## Prüfungsknackpunkte

**Signalwörter.** „Dependency mapping before migration waves" plus „install agents" → Discovery **Agent**. „Inventory hundreds of VMs without installing anything on them" → **Agentless Collector**. „Right-sized EC2 recommendations" → Migration Hub auf Basis der Auslastungsdaten. „Track migration status centrally across multiple tools" → **Migration Hub**. „We already have an inventory from our CMDB" → **Datei-Import**, kein Collector.

**Die Home-Region-Falle.** Sie wird selten direkt gefragt und fast immer indirekt: „Warum sieht das Team keine Statusmeldungen?" Antwort in der Reihenfolge der Wahrscheinlichkeit — keine Home Region gesetzt, oder man schaut in die falsche Region.

**Die Reihenfolge-Falle.** „Erst migrieren, dann gruppieren" klingt nach Zeitverschwendung, ist aber ein von AWS ausdrücklich vorgesehener Weg. Frage: Wenn die Aufgabe „dependency mapping" verlangt, geht das nicht — dann muss die Erfassung vorne stehen.

**A — MGN sofort starten:** Migriert einzelne Server sauber und weiß nichts über deren Abhängigkeiten. Genau der Server, der nachts die Zeitkonten rechnet, fällt hier durch.

**B — nur Agentless Collector, kein Hub:** Der Collector ist ein Sammler ohne Oberfläche. Ohne Migration Hub gibt es kein Portfolio, keine Gruppierung, keine Empfehlung.

**D — DMS Fleet Advisor:** Bewertet Datenbanken für die Datenbankmigration. Von Servern, Prozessen und Wellen weiß er nichts.

**E — CloudWatch und Systems Manager Inventory:** Zeigen dir AWS-Ressourcen. Das Rechenzentrum, um das es hier geht, steht noch nicht in AWS.
