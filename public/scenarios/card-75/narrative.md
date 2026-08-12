---
cardNumber: 75
slug: vmware-cloud-on-aws-sddc-heben
title: "VMware Cloud on AWS — vSphere-Landschaft heben, ohne umzubauen"
services: ["VMware Cloud on AWS", "VMware HCX", "Amazon EVS", "Amazon VPC", "Amazon EC2 (Bare Metal)", "AWS Application Migration Service"]
domains: ["D3", "D4"]
correctAnswer: "B"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://aws.amazon.com/vmware/vmwarecloudonaws/"
  - "https://aws.amazon.com/blogs/apn/vmware-cloud-on-aws-hybrid-network-design-patterns/"
  - "https://aws.amazon.com/about-aws/whats-new/2025/08/aws-general-availability-amazon-elastic-evs"
  - "https://aws.amazon.com/about-aws/whats-new/2024/12/amazon-elastic-vmware-service-preview"
  - "https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-evs-available-in-additional-regions"
  - "https://docs.aws.amazon.com/evs/latest/userguide/getting-started.html"
  - "https://docs.aws.amazon.com/evs/latest/userguide/evs-host-maintenance.html"
  - "https://docs.aws.amazon.com/evs/latest/userguide/evs-env-create-host.html"
  - "https://docs.aws.amazon.com/evs/latest/APIReference/API_Host.html"
  - "https://docs.aws.amazon.com/general/latest/gr/evs.html"
  - "https://techdocs.broadcom.com/us/en/vmware-cis/cloud/vmware-cloud-on-aws/SaaS/vmware-cloud-on-aws-release-notes.html"
---

## Die Grundidee zuerst

Stell dir eine Schreinerei vor, die umziehen muss, weil der Mietvertrag ausläuft.

**Weg eins:** Neue Halle, neue Maschinen, andere Hersteller, andere Bedienung. Die Werkbänke stehen anders, die Absauganlage funktioniert anders, jeder Geselle muss neu eingewiesen werden. Nach einem halben Jahr läuft es wieder — vielleicht sogar besser. Bis dahin ist die Produktion langsamer, und zwei Leute haben gekündigt, weil sie keine Lust auf die Umschulung hatten.

**Weg zwei:** Ein Kran hebt die komplette Werkstatt an — Maschinen, Werkbänke, die Beschriftungen an den Schubladen, sogar die Kaffeemaschine — und setzt sie in eine gemietete Halle. Am Montag stehen dieselben Leute an denselben Maschinen. Sie merken den Umzug an der Aussicht aus dem Fenster.

VMware Cloud on AWS ist Weg zwei. Nicht die Anwendungen ziehen um, sondern die **Plattform**, auf der sie stehen: vSphere, vSAN, NSX, dieselben Runbooks, dasselbe Team.

Und jetzt der Teil, den die Karte nicht zeigt: Die gemietete Halle hat inzwischen einen anderen Vermieter. Das Gebäude steht noch, die Maschinen laufen, aber der Vertrag wird woanders unterschrieben. Das ist keine Fußnote — es ist der Grund, warum diese Karte heute anders gelesen werden muss als vor zwei Jahren.

## Was es eigentlich ist — eine ENI in deinem Konto

Der schwierigste Satz zu diesem Dienst lautet: **Das SDDC läuft nicht in deinem AWS-Konto.**

Es läuft in einem vom Anbieter verwalteten Konto — in AWS-Kreisen „Shadow Account" genannt. Du siehst darin keine EC2-Instanzen, keine Rechnungsposten pro Host, keine Security Groups. Du siehst dein SDDC in der VMware-Konsole, nicht in der AWS-Konsole.

Was du in deinem eigenen Konto siehst, ist genau eine Sache — und daran erkennt man die Architektur:

```
Netzwerkschnittstellen (EC2 → Network Interfaces), dein Konto:

  eni-0a1b2c3d4e5f6a7b8   Beschreibung: "VMware VMC Interface"   in-use
  eni-0b2c3d4e5f6a7b8c9   Beschreibung: "VMware VMC Interface"   available
  eni-0c3d4e5f6a7b8c9d0   Beschreibung: "VMware VMC Interface"   available

Routing-Tabelle des connected VPC:

  Ziel                Target                    Herkunft
  10.0.0.0/16         local                     dein VPC
  192.168.10.0/24     eni-0a1b2c3d4e5f6a7b8     Segment im SDDC
  192.168.20.0/24     eni-0a1b2c3d4e5f6a7b8     Segment im SDDC
```

Lies das Zeile für Zeile, dann hast du die ganze Anbindung.

Die Schnittstellen heißen **Cross-Account ENI** (X-ENI): Sie leben in einem Subnetz deines VPC, hängen aber an Hosts im Anbieter-Konto. Beim Aufbau des SDDC führst du eine CloudFormation-Vorlage aus, die dem Anbieter genau die Rechte gibt, diese ENIs und Routen bei dir anzulegen.

Nur **eine** ENI ist aktiv, weil der gesamte Verkehr aus dem SDDC über die aktive NSX-Edge-Appliance läuft, und die liegt auf einem bestimmten ESXi-Host. Fällt der Host aus, wandert die Appliance per vMotion auf einen anderen, und die Routing-Tabelle in deinem Konto wird auf die neue ENI umgebogen. Die weiteren ENIs sind Vorrat für Erweiterung und Wartung.

Die Routen zu `192.168.10.0/24` hast du nicht angelegt. Sie entstehen, sobald jemand im SDDC ein Segment erzeugt.

Und daraus folgt der einzige Satz zur Anbindung, den du dir merken musst: **Liegt das SDDC in derselben Availability Zone wie der angebundene Dienst, kostet der Datenverkehr dorthin keine Egress-Gebühren.** Über AZ-Grenzen hinweg gelten die normalen Sätze. Deshalb wählst du beim Aufbau bewusst das Subnetz — mit ihm wählst du die AZ des SDDC.

## Der Weg durch die Karte

### Der Kasten links — die vSphere-Landschaft

vCenter, vSAN, NSX, dazu eingespielte Admins und Runbooks. Die vierte Zeile, kursiv, ist die eigentliche Anforderung: *Refactoring nicht gewollt*.

In Prüfungsfragen steht das nie so nackt da. Es steht als „the team's existing VMware skills must be preserved", „minimal changes to applications", „fastest path out of the data center". Drei Formulierungen, eine Anforderung.

### Badge 1 — die HCX-Verbindung

VMware HCX koppelt das On-Premise-vCenter mit dem SDDC. Es ist kein Kopierwerkzeug, sondern eine Netzbrücke: Es kann Layer-2-Segmente strecken, sodass eine VM nach dem Umzug **dieselbe IP-Adresse behält**.

Das ist der unterschätzte Teil. Nicht die VM ist das Problem beim Umzug, sondern alles, was ihre IP-Adresse aufgeschrieben hat: Firewall-Regeln, Monitoring, ein Skript von 2013 mit einer hartkodierten Adresse. Wer die Adressen behalten kann, muss das alles nicht anfassen.

### Badge 2 — vMotion und Bulk

Zwei Verfahren für zwei Situationen.

**vMotion** verschiebt eine laufende VM ohne Abschaltung. Ideal für die eine Datenbank, die nicht stehen darf. Langsam, einzeln, teuer an Bandbreite.

**Bulk Migration** verschiebt ganze Wellen in einem Wartungsfenster, mit einem kurzen Neustart am Ende. Das ist der Arbeitsweg — vMotion ist die Ausnahme für die Handvoll Systeme, bei denen sich niemand einen Neustart traut.

Kein Image-Umbau in beiden Fällen. Die VM auf der anderen Seite ist dieselbe VM.

### Der Kasten — vSphere/ESXi auf Bare Metal

Hier steht die Zeile, über die die meisten stolpern: „Bare-Metal-Hosts, dedizierte EC2".

Gemeint ist: kein Hypervisor unter dem Hypervisor. Echtes ESXi auf blankem Blech, damit vMotion, DRS und HA so funktionieren wie zu Hause. **Nicht** gemeint sind EC2 Dedicated Hosts, das AWS-Feature für eigene Instanzen und Lizenzen. Die Hardware unter dem SDDC gehört dem VMware-Stack; du kannst darauf keine eigene AMI starten.

Die Instanztypen ändern sich weiter — die aktuellen SDDC-Versionen unterstützen unter anderem `i7i.metal-24xl`. Der Dienst ist erkennbar in Pflege, nicht im Auslauf.

### Der Kasten — vSAN

Lokale NVMe-Laufwerke der Hosts werden zu einem verteilten Datastore. Kein SAN, keine LUNs, keine Fibre-Channel-Verkabelung.

Für die Prüfung reicht: Der Speicher kommt aus den Hosts. Für die Praxis zählt daran, dass Speicher und Rechenleistung gekoppelt sind — mehr Platz bedeutet einen weiteren Host, auch wenn die CPUs sich langweilen. Genau deshalb gibt es externe Speicheranbindungen wie FSx for NetApp ONTAP.

### Der Kasten — NSX

Netz und Firewall innerhalb des SDDC. Segmente, verteilte Firewall, Gateways — dieselben Konstrukte, die das Team on-premise kennt.

Wichtig fürs Verständnis der Karte: NSX ist der Grund, warum der gesamte ausgehende Verkehr über die Edge-Appliance und damit über genau eine ENI läuft. Die Architektur oben ist eine Folge dieses Kastens.

### Der goldene Kasten — Betrieb durch den Anbieter

Patching, Host-Tausch, Lifecycle des SDDC. „Nicht dein Pager."

**Das ist der Kasten, an dem die ganze Karte hängt.** Alles darüber — vSphere, vSAN, NSX — bekommst du auch anders. Nur dieser Kasten unterscheidet „VMware Cloud on AWS" von „wir betreiben ESXi selbst auf Bare-Metal-Instanzen".

Merk ihn dir gut. Er ist gleichzeitig die Trennlinie zur Nachfolgeoption, die es 2024 noch nicht gab.

### Badge 3 — direkt angebunden

Der Pfeil nach unten ist die X-ENI aus dem Abschnitt oben. S3, RDS, FSx sind mit niedriger Latenz erreichbar, ohne Umweg über das Internet.

Das ist der eigentliche Hebel des ganzen Ansatzes: erst 1:1 herüber, dann Stück für Stück modernisieren. Die Datenbank wandert nach RDS, während die Anwendung noch als VM läuft. Man muss nicht alles auf einmal entscheiden.

### Der Kasten — native AWS-Services

Steht nicht auf der Karte, weil er hübsch ist, sondern weil er die Kostenrechnung verschiebt: Datenverkehr innerhalb derselben AZ kostet nichts. Ein Backup nach S3 aus dem SDDC ist deshalb eine andere Rechnung als dasselbe Backup über das Internet.

### Der rote Pfeil — Refactor auf EC2-nativ, verworfen

Technisch möglich, in vielen Fällen langfristig günstiger, und trotzdem hier falsch.

Nicht wegen der Technik, sondern wegen der Anforderung. Umbau der Anwendungen plus Neuschulung des Betriebsteams ist exakt das Gegenteil von „gleiche Tools, gleiche Admins". In der Prüfung ist das die Antwort, die dich holt, wenn du nach Eleganz statt nach der Aufgabenstellung entscheidest.

## Die entscheidende Unterscheidung — VMC gegen Amazon EVS

Seit August 2025 gibt es eine AWS-eigene Antwort auf dieselbe Anforderung. Der Unterschied ist nicht das Werkzeug, sondern die Verantwortung:

| | VMware Cloud on AWS | Amazon EVS |
|---|---|---|
| Was läuft darauf | VMware SDDC | VMware Cloud Foundation |
| Wo läuft es | Konto des Anbieters, per X-ENI angebunden | **in deinem VPC** |
| Wer patcht und tauscht Hosts | der Anbieter | **du** |
| Vertrieb | ausschließlich Broadcom | AWS |
| Lizenz | im Abonnement enthalten | eigene VCF-Lizenz mitbringen |
| Verfügbarkeitszonen | auch Stretched Cluster über zwei AZ | derzeit nur Single-AZ |
| Verfügbar seit | 2017 | allgemein verfügbar seit 5. August 2025 |

Der Satz dazu: Beide geben dir dieselben Werkzeuge. Nur eines von beiden gibt dir auch den Feierabend.

## Die ehrliche Feinheit

**Der Statuswechsel, vollständig.** Seit dem **30. April 2024** verkauft AWS VMware Cloud on AWS nicht mehr — weder AWS selbst noch AWS-Channel-Partner. Der Dienst existiert weiter und wird von Broadcom vertrieben; Broadcom hat im Mai 2024 zugesagt, ihn wie bisher fortzuführen.

Die Feinheit, die auf der Karte fehlt und die man bei einer Bestandsumgebung als Erstes prüft: Kunden, die über AWS gekauft haben, können dort **keine neuen Abonnements abschließen, keine Zusatzleistungen buchen und nicht verlängern**. Laufende Ein- oder Dreijahresverträge werden bis zum Ende der Laufzeit weiter von AWS abgerechnet — danach ist Schluss, und die Verlängerung läuft über Broadcom oder einen autorisierten Reseller.

Wichtig ist, was das **nicht** heißt: Der Dienst ist nicht abgekündigt. Die Release Notes zeigen laufende Arbeit — neue SDDC-Versionen, neue Instanztypen, HCX-Wartungsreleases, Verbesserungen an Stretched Clustern. Das ist ein Vertriebswechsel, kein Ende.

**Was daraus praktisch folgt.** Wer heute eine gewachsene vSphere-Landschaft aus dem Rechenzentrum holen will, steht vor drei Wegen statt vor einem. Erstens: VMware Cloud on AWS, beschafft über Broadcom — dieselbe Architektur wie auf der Karte, der Betrieb bleibt beim Anbieter. Zweitens: Amazon EVS, beschafft über AWS, mit eigener VCF-Lizenz und eigenem Betrieb. Drittens: der Umbau, den die Aufgabe hier ausdrücklich ausschließt. Die Frage, die zwischen eins und zwei entscheidet, ist keine technische — sie lautet, ob das Team den Stack betreiben will oder nur benutzen.

Und Amazon EVS ist dabei kein Papierprodukt mehr: Nach der allgemeinen Verfügbarkeit in sechs Regionen im August 2025 kamen im November und Dezember 2025 weitere hinzu, unter anderem Sydney, Mumbai, Paris, Mailand und São Paulo. Auch die unterstützten VCF-Versionen sind weitergezogen. Wer die Karte heute liest, sollte den zweiten Weg mitdenken, auch wenn die Prüfung ihn noch nicht kennt.

**Die Zahl, die hier nicht steht.** Wie viele Hosts ein Amazon-EVS-Environment aufnehmen kann, findest du in der AWS-Doku zweimal — und zweimal verschieden. Die API-Referenz nennt eine andere Obergrenze als der User Guide desselben Dienstes. Einig sind sich beide nur darin, dass bei der Erstellung vier Hosts entstehen. Deshalb steht in diesem Text keine Obergrenze: Bei zwei widersprechenden offiziellen Quellen ist die richtige Zahl keine.

**Und die Feinheit, die im Prüfungsalltag wirklich weh tut:** Das Signalwort, das diese Karte lehrt — „vorhandenes VMware-Know-how weiternutzen" — unterscheidet heute nicht mehr zwischen den beiden Optionen. Es passt auf VMC und auf EVS gleich gut. Was unterscheidet, ist der goldene Kasten: Wer den Betrieb abgeben will, meint VMC; wer volle Kontrolle über den Stack will und den Betrieb selbst übernimmt, meint EVS. Die AWS-Doku ist an dieser Stelle unmissverständlich: Bei EVS bist **du** für Wartung, Überwachung und Host-Austausch verantwortlich.

Der SAA-C03-Fragenpool bildet das nicht ab. Bei „bestehende VMware-Umgebung, kein Umbau" bleibt **VMware Cloud on AWS** die erwartete Antwort.

## Syntax lesen — ein Host bei Amazon EVS

Was „selbst betreiben" konkret bedeutet, zeigt kein Diagramm so gut wie dieser Aufruf aus der AWS-Doku:

```
aws evs create-environment-host \
  --environment-id "env-abcde12345" \
  --host '{
      "hostName":     "esxi-host-05",
      "keyName":      "your-ec2-keypair-name",
      "instanceType": "i4i.metal",
      "esxVersion":   "ESXi-8.0U3g-24859861"
  }'
             │             │              │
             │             │              └─ du wählst die ESXi-Version
             │             └─ du wählst den Instanztyp
             └─ SSH-Schlüssel: du kommst auf den Host
```

Und dann kommt der Teil, der nicht im CLI-Aufruf steht: Danach gehst du in den **SDDC Manager**, nimmst den Host in Betrieb („commission") und fügst ihn dem Cluster hinzu. Das Root-Passwort des ESXi-Hosts holst du dir aus dem Secrets Manager.

Drei Handgriffe, die dir bei VMware Cloud on AWS niemand zumutet. Genau das ist der Unterschied zwischen den beiden Spalten der Tabelle oben — und der Grund, warum „gleiche Tools" nicht dasselbe ist wie „gleiche Arbeitslast für das Team".

## Was du dadurch nicht baust

Zähl durch, was bei diesem Weg **nicht** entsteht:

- keine umgebauten Anwendungen — der Code bleibt unberührt
- keine neuen Betriebsprozesse, keine Umschulung, keine neuen Runbooks
- keine EC2-Instanzen, die du verwalten könntest: Die Hosts gehören dem VMware-Stack
- keine AWS-Konsolensicht auf das SDDC — Kapazität, Cluster und Hosts siehst du beim Anbieter
- kein Kostenvorteil gegenüber Refactoring: VMC ist der schnelle Weg, nicht der billige
- keine unbefristete Beschaffungssicherheit über AWS — der Vertrieb liegt bei Broadcom

Übrig bleibt: dieselbe Werkstatt, andere Halle, fremder Hausmeister.

## Wenn du dir eine Sache merkst

**Nicht die Anwendungen ziehen um, sondern die Plattform unter ihnen — und den Betrieb der Plattform übernimmt jemand anderes.**

MGN repliziert einzelne Server blockweise in native EC2-Instanzen; die VMware-Werkzeuge sind danach weg. Refactoring liefert die beste Zielarchitektur und verletzt jede Anforderung dieser Aufgabe. EC2 Dedicated Hosts geben dir dedizierte Hardware, aber keinen betreuten vSphere-Stack darauf. Amazon EVS gibt dir denselben Stack in deinem eigenen VPC — mit dem Pager wieder bei dir.

## Prüfungsknackpunkte

**Signalwörter.** „Existing VMware tooling and skills stay in use", „no refactoring of applications", „migrate with vMotion or bulk migration", „fastest migration without rebuilding" → VMware Cloud on AWS. Kommt zusätzlich „full control over the VCF stack" oder „within our own VPC" vor, ist Amazon EVS gemeint.

**Die Dedicated-Hosts-Falle.** „Dedizierte Hosts" im Kartentext und „EC2 Dedicated Hosts" im AWS-Produktkatalog sind zwei verschiedene Dinge. Wer sie verwechselt, wählt eine Antwort, bei der man das Betriebssystem selbst installiert.

**Die Kostenfalle.** Fragt die Aufgabe nach den niedrigsten langfristigen Kosten, ist Refactoring gemeint. Fragt sie nach der schnellsten Migration ohne Umbau, ist VMC gemeint. Beide Fragen lassen sich mit denselben Optionen stellen — die Antwort steckt im Adjektiv.

**A — MGN Rehost auf EC2:** Migriert Server, nicht die Plattform. Danach kennt niemand mehr vCenter, und die Runbooks sind Altpapier.

**C — Anwendungen auf Container umbauen:** Die beste Architektur und die klarste Verletzung der Anforderung „kein Refactoring".

**D — EC2 Dedicated Hosts mit selbst installiertem ESXi:** Dedizierte Hardware ja, betreuter SDDC-Lifecycle nein. Der goldene Kasten fällt weg.

**E — Direct Connect und alles on-premise lassen:** Löst das Anbindungsproblem und nicht das Problem der Aufgabe — das Rechenzentrum soll geräumt werden.
