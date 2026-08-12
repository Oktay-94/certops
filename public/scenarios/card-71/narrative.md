---
cardNumber: 71
slug: mgn-lift-and-shift-cutover-minuten
title: "Application Migration Service (MGN) — Lift-and-Shift mit Cutover in Minuten"
services: ["AWS Transform MGN", "Application Migration Service", "Amazon EC2", "Amazon EBS", "AWS Server Migration Service"]
domains: ["D3", "D2"]
correctAnswer: "B"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/mgn/latest/ug/what-is-mgn.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/migration_at_scale.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/adding-servers.html"
  - "https://docs.aws.amazon.com/en_us/mgn/latest/ug/preparing-environments.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/source-servers.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/installing-vcenter-overview-mgn.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/Agentless-Replication-Related-FAQ.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/finalizing-cutover-2.html"
  - "https://docs.aws.amazon.com/mgn/latest/APIReference/API_FinalizeCutover.html"
  - "https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/govcloud-sms.html"
  - "https://aws.amazon.com/de/server-migration-service/faqs/"
  - "https://aws.amazon.com/application-migration-service/faqs/"
  - "https://aws.amazon.com/about-aws/whats-new/2026/06/aws-transform-mgn-rebrand/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Möbelhaus in ein neues Gebäude zu verlegen.

**Weg eins:** Du schließt am Freitagabend den Laden. Ein Team packt die Ware in Kisten, fotografiert die Regale, fährt alles quer durch die Stadt, baut neu auf. Montagfrüh sperrst du auf und hoffst. Das Zeitfenster, in dem der Laden zu ist, ist genau so lang wie der gesamte Umzug — zwei Tage, wenn nichts schiefgeht.

**Weg zwei:** Im neuen Gebäude steht bereits ein zweiter, identischer Laden. Er ist über Monate entstanden, während der alte durchgehend geöffnet war: Jedes Mal, wenn im alten Laden ein Karton umgeräumt wird, räumt jemand den Karton im neuen Laden genauso um. Nachts, unbemerkt, ohne dass ein Kunde etwas merkt. Am Umzugstag machst du nur noch eines — du drehst das Schild um. Der Kopiervorgang war der Umzug. Das Umdrehen des Schilds dauert Minuten.

Der zweite Weg ist MGN. Und der erste Weg ist nicht bloß langsamer, er ist eine andere Kategorie von Risiko: Beim ersten Weg findest du heraus, ob das neue Gebäude funktioniert, genau in dem Moment, in dem du keinen Rückweg mehr hast.

Das erklärt die Aufgabenstellung. „50 VMs mit minimaler Downtime" ist keine Bitte um Geschwindigkeit. Es ist die Bitte, den Kopiervorgang aus dem Wartungsfenster herauszuziehen.

## Was es eigentlich ist — die Staging Area

Der Dienst, den du bedienst, ist kein Kopierprogramm. Er ist eine Vorlage, nach der AWS in deinem Zielkonto eine Zwischenwelt baut: billige Replikationsserver mit billigen Platten, an denen die Agenten der Quellserver andocken.

```json
{
  "stagingAreaSubnetId": "subnet-0ab12c34d56ef7890",
  "replicationServerInstanceType": "t3.small",
  "useDedicatedReplicationServer": false,
  "defaultLargeStagingDiskType": "ST1",
  "replicatedDisks": [
    { "deviceName": "/dev/sda1", "isBootDisk": true,  "stagingDiskType": "GP3" },
    { "deviceName": "/dev/sdb",  "isBootDisk": false, "stagingDiskType": "ST1" }
  ],
  "ebsEncryption": "DEFAULT",
  "bandwidthThrottling": 200,
  "dataPlaneRouting": "PRIVATE_IP",
  "createPublicIP": false
}
```

Lies das von oben nach unten, es ist die halbe Karte. Wo die Zwischenwelt liegt (`stagingAreaSubnetId`), wie klein die Replikationsserver sein dürfen (`replicationServerInstanceType`), ob sich mehrere Quellserver einen davon teilen (`useDedicatedReplicationServer: false` — genau deshalb steht „günstig" im grünen Kasten), welche Platten überhaupt mitkommen (`replicatedDisks`), ob verschlüsselt wird (`ebsEncryption`), und — der Punkt, den man in echten Projekten am häufigsten braucht — wie viel Bandbreite die Sache aus deiner Standleitung nehmen darf (`bandwidthThrottling`, hier 200 Mbit/s).

Was in diesem Objekt **nicht** steht: die Zielinstanz. Welchen Instanztyp die Produktion später bekommt, steht in einem eigenen Launch Template. Replikation und Start sind zwei getrennte Konfigurationen — das ist der Grund, warum du testen kannst, ohne die Replikation anzufassen.

## Der Weg durch die Karte

### Kasten links — 50 VMs, die weiterlaufen

Auf jedem der 50 Quellserver installierst du den AWS Replication Agent. Er ist kein Backup-Programm; er hängt sich unter das Dateisystem und liest Blöcke.

Die Netzanforderung dazu ist knapp und prüfungsfähig: Die Quellserver brauchen ausgehend **TCP 1500** zu den Replikationsservern im Staging-Subnetz und **TCP 443** zum MGN-Endpunkt. Zwei Ports, keine eingehende Verbindung. Wer im Kundengespräch gefragt wird, was die Firewall aufmachen muss, hat damit die vollständige Antwort.

Der Agent kann auf physischen Servern, vSphere, Hyper-V und Instanzen anderer Clouds laufen. Für MGN sieht das alles gleich aus: eine Menge Blöcke mit einem Betriebssystem darin.

### Badge 1 — Block-Replikation

Der Agent schickt kontinuierlich jede geänderte Blockposition nach drüben, TLS-verschlüsselt. Nicht einmal pro Nacht, nicht in Zyklen — laufend. AWS nennt das Continuous Data Protection.

**Und hier steckt die Eigenschaft, um die es im ganzen Szenario geht: Der Datenstrom hat nichts mit dem Umschalttermin zu tun.**

Die Quelle läuft dabei unverändert weiter. Kein Freeze, kein Snapshot, keine Anwendung, die kurz stillstehen muss. Das Bild dazu: Du fotografierst kein Regal ab, du hast einen zweiten Menschen daneben stehen, der jede Handbewegung mitmacht.

Nach der Erstsynchronisation ist der Rückstand ein Wert in Sekunden — die Konsole zeigt ihn als Lag an. Bei 50 Servern ist genau dieser Wert die Ampel: Solange er klein ist, kannst du jederzeit umschalten.

### Kasten Mitte — die Staging Area

Hier liegt der Zwilling. Billige Replikationsserver, billige EBS-Volumes, sonst nichts.

Der wichtigste Satz auf diesem Kasten ist der kursive: **keine Produktionsinstanzen.** Es läuft dort kein Betriebssystem deiner Anwendung, es horcht kein Port, es kostet keine Produktionsgröße. Es sind Platten, auf die geschrieben wird.

Kostenseitig gilt zweierlei, und es wird gern verwechselt: Der **Dienst** MGN ist pro migriertem Server 2.160 Stunden kostenlos, das sind 90 Tage bei durchgehender Nutzung. Die **Infrastruktur** in der Staging Area — EC2 und EBS — kostet vom ersten Tag an. „MGN ist kostenlos" ist deshalb nur die halbe Wahrheit, und in einer Kostenfrage die falsche Hälfte.

### Badge 2 — der Test-Launch

Aus dem aktuellen Stand der Staging-Platten startest du eine Testinstanz. MGN konvertiert dabei automatisch: Treiber, Bootloader, alles, was ein fremdes Blech-Image braucht, um auf EC2 zu starten.

Der Kasten ist gestrichelt, weil er temporär ist. Und er ist der Grund, warum diese Migrationsart überhaupt planbar ist: **Der Test rührt weder die Quelle noch die laufende Replikation an.** Du kannst am Dienstag testen, am Mittwoch nochmal, und dazwischen läuft die Produktion und die Replikation ungestört weiter.

Wer diesen Schritt überspringt, verlegt sein Bootproblem in die Nacht des Cutovers. Das ist keine theoretische Warnung: Genau die Fehler, die der Test findet — falscher Treiber, hartkodierte IP, Lizenz an Hardware gebunden —, findest du sonst mit 50 Servern gleichzeitig.

### Der gestrichelte Kasten — was die Testinstanz ist und was nicht

Die Testinstanz ist eine echte EC2-Instanz mit echten Kosten, die in dem Subnetz startet, das im Launch Template steht. Sie ist keine Simulation.

Genau deshalb braucht sie ein eigenes Netz. Startest du eine Kopie eines Domänencontrollers oder eines Servers mit fester IP in dasselbe Netz wie die Quelle, hast du zwei Maschinen mit derselben Identität. Der Test soll die Migration prüfen, nicht die Produktion sabotieren — ein isoliertes Testsubnetz ist die Standardantwort darauf.

Und sie ist Wegwerfware. Vor dem Cutover terminierst du sie; die Konsole verlangt das sogar, indem sie in der Spalte „Next step" erst „Terminate launched instance" verlangt, bevor sie „Launch cutover instance" anbietet. Der Fortschritt der Migration wird nicht an der Testinstanz gemessen, sondern am Status des Quellservers.

### Badge 3 — Final Sync und Cutover

Der Umschalttermin. Anwendung auf der Quelle stoppen, letzte Deltas laufen durch, Cutover-Instanz starten.

Warum dauert das Minuten und nicht Stunden? Weil zu diesem Zeitpunkt bereits alles drüben ist. Übertragen wird nur noch, was seit ein paar Sekunden anders ist. AWS beschreibt Cutover-Fenster für den agentenbasierten Weg ausdrücklich als „gemessen in Minuten".

Das Bild: Du ziehst nicht um. Du schaltest um.

### Kasten rechts — EC2 Produktion

Was ankommt, ist eine 1:1-Kopie: dasselbe Betriebssystem, dieselben Anwendungen, dieselben Daten, dieselben Konfigurationsdateien mit denselben Fehlern. Das ist die Definition von **Rehost**. Nichts wird umgebaut, nichts wird cloud-nativer.

Das ist Absicht, und es ist die häufigste Enttäuschung in echten Projekten: MGN macht aus deinem Monolithen keine Microservices. Es macht aus deinem Server einen EC2-Server. Modernisierung ist ein zweiter Schritt, den du danach gehen kannst — nicht dieser hier.

### Badge 4 — die Quelle stilllegen

Der Pfeil ist grau und gestrichelt, weil hier keine Daten mehr fließen. Er markiert eine Entscheidung, keinen Transport.

Nach dem Cutover läuft die Replikation zunächst weiter. Solange sie läuft, hast du einen Rückweg: die alte VM steht noch, du kannst sie wieder anwerfen. Erst wenn du **Finalize cutover** drückst, endet das. Dann verwirft MGN die replizierten Daten, beendet alle Replikationsressourcen — laut API-Referenz binnen 90 Minuten — und schickt dem Agenten den Befehl, sich selbst zu deinstallieren, binnen 10 Minuten. Die gestarteten Instanzen bleiben davon unberührt.

Danach markierst du den Server als archiviert, und er verschwindet aus der Liste. Bei 50 Servern in Wellen ist das kein Kosmetikschritt, sondern der einzige Weg, den Überblick zu behalten.

### Kasten unten — AWS SMS, der verworfene Weg

Der Vorgänger arbeitete anders: inkrementelle, **snapshotbasierte** Replikation, aus jedem Zyklus entstand ein AMI, und die Cutover-Fenster maß AWS in **Stunden**. Diese Gegenüberstellung stammt nicht von einem Kursanbieter, sie steht so in AWS' eigenem SMS-FAQ.

Der Dienst ist eingestellt. Die AWS-GovCloud-Dokumentation nennt den 31. März 2022 als Datum der Einstellung; die SDK-Hinweise nennen März 2023 als letzten Zeitpunkt für die Nutzung der SMS-APIs. Das ist kein Widerspruch, sondern die übliche Zweistufigkeit: erst kein Neugeschäft, dann APIs aus.

Historisch abgelöst wurden damals zwei Dienste gleichzeitig: SMS und CloudEndure Migration. AWS hat beide im selben Zug ausgemustert und MGN als empfohlenen Nachfolger benannt. Wenn dir in älteren Unterlagen „CloudEndure" begegnet, ist das dieselbe Ecke des Portfolios — und ebenfalls kein gültiger Antwortkandidat mehr.

## Die entscheidende Unterscheidung

| | MGN (agentenbasiert) | AWS SMS |
|---|---|---|
| Replikation | kontinuierlich, Block-Ebene | inkrementell, Snapshot-Zyklen |
| Cutover-Fenster | Minuten | Stunden |
| Zwischenprodukt | EBS-Volumes in der Staging Area | AMI je Zyklus |
| Test vor Cutover | jederzeit, ohne Störung | über gestartetes AMI, zyklusgebunden |
| Status | aktueller Dienst, 2026 zu AWS Transform MGN umbenannt | eingestellt |

## Die ehrliche Feinheit

Die saubere Trennung „Snapshot ist der alte, schlechte Weg, Block-Replikation der neue, gute" hält der Dokumentation nicht ganz stand. **MGN kann selbst Snapshot-Versand.**

Für vCenter-Umgebungen gibt es agentenlose Replikation über den MGN vCenter Client: VMware-Snapshot, Changed Block Tracking, VDDK, und am Ende eine Gruppe konsistenter EBS-Snapshots im Zielkonto. AWS empfiehlt diesen Weg ausdrücklich nur dann, wenn Firmenrichtlinien die Agenteninstallation verbieten oder das Betriebssystem nur so unterstützt wird — und sagt im selben Atemzug, dass beim Cutover unter Umständen auf einen aktuellen Snapshot gewartet werden muss und das Fenster länger ausfällt.

Für die Prüfung ändert das nichts: Wenn „Cutover in Minuten" in der Aufgabe steht, ist der agentenbasierte Weg gemeint. Für das Verständnis ändert es viel. Nicht „Snapshot" ist das Problem, sondern der Abstand zwischen zwei Snapshots. Der ist bei SMS Teil des Verfahrens; bei MGN ist er der Notausgang.

Zweite Feinheit, die auf der Karte nur als Wort steht: „Rollback-Fenster". Die Karte legt sich auf keine Dauer fest, und das ist richtig so — AWS dokumentiert keine. Das Fenster endet nicht nach einer Frist, es endet, wenn du den Knopf drückst. Die einzige harte Zahl in der Nähe ist die kostenlose Nutzung von 2.160 Stunden je Server; wer die Quelle Monate stehen lässt, bezahlt irgendwann für die Replikation, nicht für das Zögern.

## Syntax lesen — die Spalte „Migration lifecycle"

Bei 50 Servern arbeitest du nicht mit Servern, sondern mit einer Tabelle. Die einzige Spalte, die dabei zählt, ist der Lebenszyklus — und ihre Werte sind keine Beschreibung, sondern eine Zustandsmaschine mit genau einer erlaubten Richtung:

```
Not ready ──► Ready for testing ──► Test in progress ──► Ready for cutover
                     ▲                                          │
                     └──────────── (Revert) ◄───────────────────┘
                                                                │
                                                                ▼
                                                     Cutover in progress
                                                                │
                                                                ▼
                                                      Cutover complete ──► archiviert
     │            │                    │                    │
     │            │                    │                    └─ Replikation gestoppt,
     │            │                    │                       Daten verworfen
     │            │                    └─ Testinstanz läuft, Quelle unberührt
     │            └─ Erstsynchronisation fertig
     └─ Agent installiert, Erstkopie läuft noch
```

Zwei Dinge liest du daraus ab, die man sonst mühsam erfragt.

**Erstens:** „Ready for cutover" ist kein automatischer Zustand, sondern eine Erklärung, die du abgibst — du markierst den Server als getestet. MGN prüft deine Anwendung nicht.

**Zweitens:** Bis „Cutover complete" ist jeder Schritt umkehrbar. Es gibt eine Revert-Aktion zurück auf „Ready for testing" beziehungsweise „Ready for cutover". Der einzige Einbahnschritt ist das Finalisieren.

Daneben steht in der Konsole die Spalte „Data replication status" mit dem Lag. Beide zusammen sind das ganze Steuerpult: Wo im Ablauf steht dieser Server, und wie weit ist seine Kopie hinterher.

## Was du dadurch nicht baust

Zähl durch, was in dieser Migration **nicht** entsteht:

- keine neue Anwendungsarchitektur, kein Refactoring, kein Container
- keine manuellen Images, keine per Hand gepflegten AMIs
- kein Skript, das nachts Snapshots zieht und irgendwohin schiebt
- kein langes Wartungsfenster, in dem 50 Systeme gleichzeitig still sind
- keine Umstellung der Anwendung auf verwaltete Dienste
- keine Datenbankmigration im eigentlichen Sinn — die DB kommt als Datei auf einer Platte mit, nicht als Datenbank

Übrig bleiben: ein Agent je Server, zwei offene Ports, eine Zwischenwelt aus billigen Platten und ein Termin, an dem jemand einen Knopf drückt.

## Wenn du dir eine Sache merkst

**MGN entkoppelt das Kopieren vom Umschalten — deshalb misst sich das Cutover-Fenster in Minuten und nicht in der Größe der Daten.**

SMS koppelt beides über Snapshot-Zyklen und ist eingestellt. DMS bewegt Datenbankinhalte, keine Server. DataSync bewegt Dateien, kein Betriebssystem. Keiner der drei liefert dir eine bootfähige Maschine.

## Prüfungsknackpunkte

**Signalwörter:** „lift and shift", „rehost", „without changing the application", „continuous block-level replication", „cutover window of minutes", „non-disruptive test". Sobald „ganze Server" und „minimale Downtime" zusammen auftreten, ist MGN die Antwort.

**Die Namensfalle.** AWS hat den Dienst am 8. Juni 2026 in **AWS Transform MGN** umbenannt — er ist jetzt die Replikations-Engine innerhalb von AWS Transform. Funktionalität, APIs und Konsole bleiben. Prüfungsfragen laufen weiter unter „Application Migration Service (MGN)"; wenn dir in der Dokumentation der neue Name begegnet, ist es derselbe Dienst.

**A — AWS SMS:** Snapshot-Zyklen, Cutover in Stunden, eingestellt. Steht in Aufgaben fast nur als Distraktor. Wenn MGN daneben steht, ist SMS falsch.

**B — Application Migration Service (MGN):** richtig. Der einzige Dienst in der Auswahl, der einen ganzen Server bootfähig überträgt und dabei die Quelle produktiv lässt.

**C — AWS DMS:** migriert Datenbanken, nicht Server. Die Falle greift, wenn im Szenario nebenbei eine Datenbank erwähnt wird. „Die VM samt allem, was darauf läuft" bleibt MGN.

**D — Snowball Edge:** Transportgerät für Datenmengen, die nicht durch die Leitung passen. Liefert dir Objekte oder Volumes, keine laufende Maschine — und ist seit dem 7. November 2025 nur noch für Bestandskunden verfügbar.
