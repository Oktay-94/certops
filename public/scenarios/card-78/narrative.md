---
cardNumber: 78
slug: drs-elastic-disaster-recovery-pilot-light
title: "Elastic Disaster Recovery (DRS) — RPO in Sekunden ohne zweites Rechenzentrum"
services: ["AWS Elastic Disaster Recovery", "Amazon EC2", "Amazon EBS", "AWS Backup", "AWS Transform MGN"]
domains: ["D2", "D4"]
correctAnswer: "C"
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/drs/latest/userguide/CloudEndure-Concepts.html"
  - "https://docs.aws.amazon.com/drs/latest/userguide/Replication-Related-FAQ.html"
  - "https://docs.aws.amazon.com/drs/latest/userguide/point-in-time-faq.html"
  - "https://docs.aws.amazon.com/drs/latest/userguide/point-in-time.html"
  - "https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html"
  - "https://docs.aws.amazon.com/mgn/latest/ug/General-Questions-FAQ.html"
  - "https://docs.aws.amazon.com/guidance/latest/deploying-cross-region-disaster-recovery-with-aws-elastic-disaster-recovery/core-concepts.html"
  - "https://aws.amazon.com/disaster-recovery/when-to-choose-aws-drs/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein handschriftliches Protokoll zu sichern.

**Weg eins:** Du gehst jeden Abend um 22 Uhr zum Kopierer und legst alles ein, was tagsüber geschrieben wurde. Brennt der Schreibtisch um 21:30, ist ein ganzer Tag weg. Und die Kopien liegen als Stapel im Schrank — daraus wieder ein arbeitsfähiges Büro zu machen, kostet dich einen Vormittag Sortieren.

**Weg zwei:** Unter jedes Blatt legst du Durchschlagpapier. Du kopierst nichts mehr; die zweite Fassung entsteht in derselben Sekunde wie die erste, Strich für Strich. Brennt der Schreibtisch, liegt im Nebenraum ein Stapel, der bis zum letzten geschriebenen Wort mitgeht.

Das ist der Unterschied zwischen einem Backup und einer Replikation, und es ist der ganze Kern dieser Karte. Ein Backup ist eine Kopie zu einem Zeitpunkt. Eine Replikation ist eine zweite Feder, die mitschreibt.

Das Szenario verlangt genau das: Ein Klinikrechenzentrum mit 120 physischen und virtuellen Servern verliert seinen Vertrag über den externen DR-Standort. Gefordert ist ein Datenverlust im Sekundenbereich — und niemand will ein zweites laufendes Rechenzentrum bezahlen.

**Der Trick besteht darin, dass Durchschlagpapier billig ist. Ein zweites Büro wäre teuer.**

## Was es eigentlich ist — die Replikationskonfiguration

Das zentrale Objekt ist keine Instanz und kein Snapshot-Plan, sondern eine Konfiguration je Quellserver, die beschreibt, **wohin** repliziert wird und **wie lange** die Zwischenstände aufgehoben werden:

```bash
aws drs update-replication-configuration \
  --source-server-id s-123456789abcdefgh \
  --staging-area-subnet-id subnet-0a1b2c3d \
  --replication-server-instance-type t3.small \
  --default-large-staging-disk-type GP3 \
  --ebs-encryption DEFAULT \
  --pit-policy \
      enabled=true,interval=10,retentionDuration=60,ruleID=1,units="MINUTE" \
      enabled=true,interval=1,retentionDuration=24,ruleID=2,units="HOUR" \
      enabled=true,interval=1,retentionDuration=7,ruleID=3,units="DAY"
```

Lies das von oben nach unten, dann hast du die ganze Lösung: Welcher Server (`source-server-id`), wohin die Kopie geht (`staging-area-subnet-id`), wie klein die Maschine sein darf, die sie entgegennimmt (`t3.small`), welche Platten das Ziel benutzt, ob verschlüsselt wird — und wie eng das Netz der Zwischenstände geknüpft ist.

Auf dem Quellserver selbst läuft nur eines: der **AWS Replication Agent**. Kein Konnektor, keine Appliance, keine Änderung an der Anwendung.

## Der Weg durch die Karte

### Kasten links — Quellserver

120 Maschinen, physisch und virtuell. DRS interessiert nicht, worauf sie laufen: Blech im eigenen Rack, VMware vSphere, Microsoft Hyper-V, eine andere Cloud oder EC2 in einer anderen Region. Der Agent setzt eine Ebene tiefer an als die Anwendung — er liest Blöcke, nicht Dateien.

Das ist der Grund, warum auf der Karte „Betriebssystem, Systemzustand, Datenbanken" in einem Atemzug stehen. **Wer Blöcke kopiert, kopiert alles, was auf der Platte liegt — auch das, was ein Dateibackup nie erwischt:** Registry, Dienstkonfiguration, halb geöffnete Datenbankdateien, Bootsektor.

Für die Klinik hat das eine unbequeme Konsequenz, die im Szenario mitschwingt: 120 Server heißt 120 Installationen. Der Agent muss auf jede Maschine, und jede Maschine braucht ausgehende Konnektivität in die Zielregion. Was DRS dir abnimmt, ist der Aufbau eines DR-Standorts; was es dir nicht abnimmt, ist ein Rollout. Dafür ist der Agent an der Anwendung selbst vollkommen uninteressiert — kein Datenbank-Plugin, kein Anwendungsstillstand, keine Anpassung am Code.

### Badge 1 — Block-Level in die Staging Area

Nach der ersten vollständigen Synchronisation schickt der Agent nur noch, was sich ändert. Der Verkehr ist verschlüsselt und mit LZ4 komprimiert; AWS nennt je nach Datentyp 60 bis 70 Prozent Kompression.

Ist alles übertragen, was geschrieben wurde, ist der Server in **Continuous Data Protection**. Fällt er aus diesem Zustand — weil die Leitung stockt oder ein Batchlauf massenhaft schreibt — zeigt die Konsole drei Werte, die man kennen sollte: *Lag* (wie lange der Server nicht mehr synchron war), *Backlog* (wie viele Daten noch fehlen) und *ETA* (wann er wieder aufgeholt hat).

**Der RPO ist nichts, was du einstellst. Er ist das, was Lag gerade anzeigt.**

### Kasten Mitte — das Staging-Subnetz ist das Pilot Light

Hier steht das Sparmodell, und hier fällt die Entscheidung gegen ein zweites Rechenzentrum.

Im Staging-Subnetz laufen keine Kopien deiner Server. Es laufen **Replication Server** — standardmäßig `t3.small`, mit den Staging-Volumes daran. AWS nennt als typisches Verhältnis 15 Volumes je Replication Server. Für die Klinik heißt das überschlägig: 120 Server mit im Schnitt drei Platten ergeben rund 360 Volumes, also etwa zwei Dutzend kleine Maschinen — statt 120 Produktionsinstanzen.

Das Bild dazu: Der Ersatzwagen steht in der Garage, vollgetankt, Papiere im Handschuhfach. Er fährt nicht neben dir her. Deshalb kostet er auch nichts außer Stellplatz.

Das Whitepaper „Disaster Recovery of Workloads on AWS" ordnet DRS ausdrücklich der **Pilot-Light**-Strategie zu: eine Kopie der Daten und „ausgeschaltete" Ressourcen in einer VPC. Der Unterschied zu Warm Standby steht dort ebenfalls präzise — Pilot Light kann ohne einen zusätzlichen Schritt keine Anfragen bearbeiten, Warm Standby kann es sofort, wenn auch mit weniger Kapazität.

### Badge 2 — der Drill

Ein DR-Plan, der nie geprobt wurde, ist eine Vermutung, keine Zusage. Deshalb hat der Drill auf dieser Karte einen eigenen Pfeil.

Entscheidend ist das Wörtchen **nicht-disruptiv**: Während du Drill-Instanzen startest und darin arbeitest, läuft die Replikation der Quellserver weiter. Du musst nichts anhalten, nichts abkoppeln, kein Wartungsfenster mit der Klinikleitung verhandeln. Für ein Haus, in dem der Betrieb nie stillsteht, ist das der Punkt, an dem DR überhaupt erst probbar wird.

Und der Drill beweist mehr, als die meisten erwarten. Er beantwortet nicht nur „sind die Daten da", sondern die Fragen, an denen echte Wiederanläufe scheitern: Bootet die Maschine nach der Konvertierung? Findet der Anwendungsserver seine Datenbank unter der neuen IP? Sind die Security Groups im Zielsubnetz so gesetzt, dass die Systeme miteinander reden dürfen? Reicht die Lizenz für den Betrieb in der Cloud? Das alles steht in keinem Replikationsstatus. Es zeigt sich nur, wenn man einmal startet.

### Kasten unten Mitte — Recovery-Drill und Point in Time

Du wählst beim Start nicht nur „wiederherstellen", sondern **wann**. DRS führt einen Fahrplan von Zwischenständen:

- alle 10 Minuten für die letzte Stunde
- einmal pro Stunde für die letzten 24 Stunden
- einmal pro Tag für die letzten 7 Tage, einstellbar zwischen 1 und 365 Tagen

Die Aufbewahrung darfst du ändern, den Takt nicht — die Frequenz der Snapshots ist nicht konfigurierbar.

Das ist der Grund, warum DRS auch gegen Ransomware und Datenkorruption zählt und nicht nur gegen Feuer: **Ein Verschlüsselungstrojaner repliziert sich in Sekunden mit. Ein Zeitpunkt von gestern Mittag tut es nicht.**

Startest du dagegen ohne Zeitpunktangabe — etwa per CLI —, versucht DRS einen frischen Snapshot „Use most recent data" anzulegen, der einem Sub-Sekunden-RPO entspricht. Klappt das nicht innerhalb von 10 Minuten, greift es auf den letzten konsistenten Stand der Replication Server zurück.

### Badge 3 — Failover

Im Ernstfall startet DRS Recovery-Instances im Zielsubnetz. Dabei passiert der Schritt, der die ganze Übung überhaupt möglich macht: Ein **Conversion Server** legt Klone der Staging-Volumes an und baut sie so um, dass sie nativ auf AWS booten — Treiber, Bootloader, Netzwerkkonfiguration.

Denn eine Platte aus einem Hyper-V-Server startet nicht einfach als EC2-Instanz. Sie muss übersetzt werden. Diese Übersetzung passiert erst beim Wiederanlauf, nicht bei jedem replizierten Block — genau deshalb bleibt das Staging so billig.

### Kasten rechts — Recovery-Instances

Jetzt und erst jetzt entstehen Maschinen in Produktionsgröße. Die Doku nennt als typischen RTO **5 bis 20 Minuten**, ganz überwiegend Bootzeit: ein Linux-Server startet im Mittel in etwa 5 Minuten, ein Windows-Server in etwa 20. Auch Instanztyp und Volume-Typ schlagen durch — wer beim Recovery-Template spart, verlängert seinen eigenen RTO.

Danach führt der Weg über **Failback** zurück ins eigene Rechenzentrum, sobald es wieder steht. Und das ist keine Nebenbemerkung, sondern der Unterschied zwischen einem DR-Werkzeug und einem Migrationswerkzeug: Die Replikationsrichtung dreht sich um. Was in der Zwischenzeit in AWS geschrieben wurde, fließt zurück auf die wiederhergestellte Hardware, und erst dann schaltest du um.

Wer das ausblendet, plant unfreiwillig eine Migration. Die Klinik will nach dem Stromausfall nicht dauerhaft in der Cloud sitzen — sie will drei Wochen später wieder dort sein, wo ihre Netzwerkanschlüsse, ihre Medizingeräte und ihr Betriebskonzept liegen. Genau diese Rückfahrkarte kauft man mit DRS mit.

### ✗ — Tägliche Snapshots

Der durchgestrichene Pfeil zeigt auf die Lösung, die man zuerst vorschlägt, weil sie billig aussieht: AWS Backup und EBS-Snapshots.

Sie sind nicht falsch, sie beantworten eine andere Frage. Snapshots decken **Aufbewahrung** ab — Compliance, versehentlich gelöschte Dateien, „wie sah das im März aus". DRS deckt **Betriebsfortführung** ab. Bei einem Tagesrhythmus liegt der Datenverlust im Bereich von Stunden bis zu einem Tag und die Wiederanlaufzeit ebenfalls. Für eine Klinik, die ihre Behandlungsdokumentation braucht, ist das keine Option.

## Die entscheidende Unterscheidung

| | Tägliche Snapshots | Elastic Disaster Recovery |
|---|---|---|
| Zweck | Aufbewahrung | Betriebsfortführung |
| Was wird erfasst | Volumes zum Zeitpunkt X | jeder Blockschreibvorgang |
| RPO | Stunden bis ein Tag | Sekunden |
| RTO | Stunden | Minuten |
| Kosten im Ruhezustand | Snapshot-Speicher | kleine Replication Server plus Staging-Volumes |
| Probe möglich | nur durch echtes Restore | nicht-disruptiver Drill |
| Zurück nach on-prem | manuell | Failback |

Die Achse ist nicht „gut gegen schlecht", sondern **Aufbewahrung gegen Fortführung**. Eine gut gebaute Klinik-IT hat beides: Snapshots für die siebenjährige Aufbewahrungspflicht, DRS für den Dienstagvormittag, an dem der Stromverteiler durchbrennt.

## Die ehrliche Feinheit

**RPO und RTO sind nicht dasselbe Versprechen.** Für den RPO nennt die DRS-Doku typischerweise den Sub-Sekunden-Bereich und einen crash-konsistenten Wiederherstellungspunkt „von Sekunden". Für den RTO nennt sie 5 bis 20 Minuten. Die Produktseite spricht allgemeiner von „RTOs of minutes". Die Karte bleibt deshalb bei der robusten Formulierung „RPO Sekunden, RTO Minuten" — sie widerspricht keiner Quelle und bleibt richtig, egal welche du in der Prüfung im Kopf hast.

**Der RPO gilt für Blöcke, nicht für Transaktionen.** Crash-konsistent heißt: Der wiederhergestellte Server sieht aus wie eine Maschine, der man den Stecker gezogen hat. Eine Datenbank darauf fährt hoch und rollt ihr Log zurück — das kann sie, dafür ist sie gebaut. Aber DRS gibt dir keine applikationskonsistente Sicherung im Sinne eines Datenbank-Backups. Wer beides braucht, kombiniert.

**DRS ist nicht für RDS.** Das Whitepaper sagt es wörtlich: für AWS-eigene Workloads nur, wenn sie ausschließlich aus Anwendungen und Datenbanken auf EC2 bestehen — also nicht RDS. Für RDS gelten die eigenen Mechanismen: Multi-AZ, Read Replicas, automatische Backups.

**Der Vorgänger ist tot, der Name lebt in der URL weiter.** CloudEndure Disaster Recovery wurde am 31. März 2024 in allen Regionen außer China und GovCloud eingestellt, in GovCloud am 29. September 2025; China-Lizenzen laufen bis zum 29. August 2026. DRS ist der Nachfolger. Amüsanterweise liegt die Konzeptseite der DRS-Doku bis heute unter dem Dateinamen `CloudEndure-Concepts.html`. Wenn dir eine Prüfungsantwort CloudEndure anbietet, ist sie falsch — nicht wegen der Technik, sondern weil es den Dienst nicht mehr gibt.

**Die Replication Server sind Wegwerfware.** DRS tauscht sie automatisch alle 14 Tage gegen frische aus dem aktuellen AMI. Du patchst sie nicht. Du siehst sie in deiner EC2-Konsole und darfst sie nicht anfassen.

**Der teuerste Tag ist der erste.** Die Sekunden-RPO gilt für den laufenden Betrieb — für Änderungen. Davor steht die vollständige Erstsynchronisation, und die überträgt jeden belegten Block jeder Platte einmal komplett. Bei 120 Servern ist das kein Rundungsfehler in der WAN-Rechnung. DRS bietet deshalb eine Bandbreitendrosselung als Einstellung an, mit dem üblichen Zielkonflikt: Wer drosselt, schont die Leitung für den Klinikbetrieb und verlängert die Zeit, bis der erste Server überhaupt geschützt ist. Für die Prüfung ist das eine Randnotiz. Für die Projektplanung ist es die erste Frage, die der Netzbetrieb stellt.

## Syntax lesen — die PIT-Policy

Der unhandlichste Teil der Konfiguration, Feld für Feld:

```
enabled=true,interval=10,retentionDuration=60,ruleID=1,units="MINUTE"
        │            │                  │            │            │
        │            │                  │            │            └─ Einheit
        │            │                  │            └─ Regelnummer (1, 2, 3)
        │            │                  └─ wie lange aufheben
        │            └─ Abstand zwischen zwei Ständen
        └─ Regel aktiv
```

Also: alle 10 Minuten ein Stand, 60 Minuten lang aufgehoben. Regel 2 macht dasselbe im Stundentakt für 24 Stunden, Regel 3 im Tagestakt für 7 Tage.

**Die Stolperfalle:** `retentionDuration` bei Regel 3 ist der einzige Wert, den du sinnvoll drehst — 1 bis 365 Tage. Wer `interval` verstellt, um „öfter" zu sichern, ändert nichts: Der Takt ist vom Dienst vorgegeben.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein zweiter Standort mit Miete, Strom, Klima und Wachdienst
- keine 120 laufenden Ersatzserver, die auf einen Ernstfall warten
- keine Backup-Software, die man zusätzlich lizenziert
- kein Konvertierungsprojekt für Hyper-V- oder vSphere-Images
- kein Wartungsfenster, um DR zu proben
- kein Skript, das Snapshots wegräumt — DRS löscht nicht mehr benötigte Stände selbst

Übrig bleiben: ein Agent je Server, ein Subnetz mit kleinen Maschinen und ein Startknopf, den du gefahrlos drücken darfst.

## Wenn du dir eine Sache merkst

**DRS repliziert kontinuierlich block-level in einen günstigen Staging-Bereich: RPO in Sekunden, RTO in Minuten, ohne ein zweites Rechenzentrum vorzuhalten.**

AWS Backup bewahrt auf, es führt nicht fort. Ein zweites Rechenzentrum führt fort, aber du bezahlst es rund um die Uhr. AWS Transform MGN benutzt dieselbe Replikationstechnik, hört aber nach dem Cutover auf — es kennt keinen Failback.

## Prüfungsknackpunkte

**Signalwörter:** „recovery point objective in seconds", „without paying for a second data center", „non-disruptive recovery drills", „continuous block-level replication". Sekunden-RPO plus Kostendruck ist immer DRS.

**RPO und RTO vertauschen.** RPO ist der Datenverlust und liegt bei DRS in Sekunden; RTO ist die Ausfallzeit und liegt in Minuten. Wer „Minuten-RPO" liest und nickt, sitzt schon in der falschen Antwort.

**DRS und Migration verwechseln.** Gleiche Technik, anderer Zweck: AWS Transform MGN — bis Juni 2026 als AWS Application Migration Service bekannt — migriert einmalig mit Cutover, DRS hält die Replikation dauerhaft und kann zurück. Beide Agents auf demselben Server gleichzeitig gehen übrigens nicht.

**Staging mit dem Zielzustand verwechseln.** Im Staging läuft nichts in Produktionsgröße. Wer dort Instanztypen wie in der Produktion einplant, hat das Sparmodell weggerechnet.

**A — AWS Backup mit täglichen EBS-Snapshots:** Löst die Aufbewahrung, nicht den Wiederanlauf. RPO und RTO liegen um Größenordnungen daneben.

**B — Warm Standby in einer zweiten Region:** Erfüllt die RPO-Vorgabe, verletzt aber die Kostenvorgabe — es ist genau das zweite laufende Rechenzentrum, das die Klinik nicht bezahlen will.

**D — AWS Transform MGN:** Bringt die Server einmalig nach AWS und ist danach fertig. Ohne Failback und ohne Dauerbetrieb der Replikation ist es kein DR-Plan, sondern ein Umzug.
