---
nr: 78
title: "Elastic Disaster Recovery (DRS) — RPO in Sekunden ohne zweites Rechenzentrum"
services:
  - "AWS Elastic Disaster Recovery (DRS)"
  - "Amazon EC2"
  - "Amazon EBS"
  - "AWS Backup (verworfen — Aufbewahrung statt Betriebsfortführung)"
domains: [D2, D4]
signalwords:
  - "recovery point objective in seconds"
  - "without paying for a second data center"
  - "non-disruptive recovery drills"
  - "pilot light staging area"
  - "continuous block-level replication for failover"
assets: [battle_card_78.svg, battle_card_78.png, battle_card_78.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 78 — Elastic Disaster Recovery

**Szenario:** Ein Klinikrechenzentrum mit 120 physischen und virtuellen Servern verliert seinen Vertrag über den externen DR-Standort; gefordert ist ein Datenverlust im Sekundenbereich, ohne ein zweites laufendes Rechenzentrum zu bezahlen.

## Ablauf
- **1 — Replikation:** Auf jedem Quellserver läuft der AWS Replication Agent und schickt Blockänderungen kontinuierlich, komprimiert und verschlüsselt nach AWS. Block-Level heißt: Betriebssystem, Systemzustand, Datenbanken und Dateien werden als exaktes Abbild mitgeführt, nicht als Dateikopie. Quelle kann physisch, virtuell oder eine andere Cloud sein.
- **2 — Drill:** Recovery-Drills laufen nicht-disruptiv — die laufende Replikation wird dabei nicht unterbrochen, und es lässt sich auf einen früheren Zeitpunkt zurückgehen. Ein DR-Plan, der nie geprobt wurde, ist eine Vermutung, keine Zusage.
- **3 — Failover:** Im Ernstfall startet DRS Recovery-Instances im Zielsubnetz und konvertiert die Volumes dabei so, dass sie nativ auf AWS booten. Danach führt der Weg über Failback zurück ins eigene RZ.
- **Staging als Pilot Light:** Der Zwischenschritt ist das Sparmodell der Lösung. Im Staging-Subnetz laufen nur kleine Replication Server auf günstigen EBS-Volumes — die Kopie liegt bereit, sie läuft nicht. Wie ein Ersatzwagen, der in der Garage steht statt neben dir herzufahren.
- **✗ — Tägliche Snapshots:** AWS Backup und EBS-Snapshots als DR-Ersatz decken Aufbewahrung ab, nicht Betriebsfortführung. RPO 24 Stunden, RTO Stunden — für eine Klinik keine Option.

## Prüfungs-Kernsatz
**DRS repliziert kontinuierlich block-level in einen günstigen Staging-Bereich: RPO in Sekunden, RTO in Minuten, ohne ein zweites Rechenzentrum vorzuhalten.**

## Klassiker-Fallen
1. **DRS und MGN verwechseln** → Gleiche Technik, anderer Zweck. Application Migration Service (MGN) migriert einmalig mit Cutover, DRS hält den Dauerbetrieb der Replikation für den Wiederholungsfall.
2. **RPO und RTO vertauschen** → RPO (Datenverlust) ist bei DRS in Sekunden, RTO (Ausfallzeit) in Minuten. Wer „Minuten-RPO" liest, sitzt schon in der falschen Antwort.
3. **DRS für RDS einplanen** → DRS schützt server-gehostete Anwendungen und Datenbanken. Für RDS gelten die eigenen Mechanismen (Multi-AZ, Read Replica, Snapshots).
4. **Staging mit dem Zielzustand verwechseln** → Im Staging läuft nichts in Produktionsgröße; die vollen Instanzen entstehen erst beim Failover.

## Faktencheck-Notizen (23.07.2026)
- RPO Sekunden / RTO in Minuten bestätigt durch `docs.aws.amazon.com/drs/latest/userguide/CloudEndure-Concepts.html`: crash-konsistenter RPO von Sekunden, RTO **typisch 5–20 Minuten**, stark abhängig von der Bootzeit (Linux ~5 min, Windows ~20 min).
- Das AWS-Whitepaper „Disaster Recovery of Workloads on AWS" ordnet DRS ausdrücklich der **Pilot-Light**-Strategie zu.
- **Abweichung vom Masterplan:** Die Themenzeile nannte „Minuten-RPO". Das ist falsch herum und wurde korrigiert (Freigabe Oktay, 23.07.2026).
- Die konkreten 5–20 Minuten stehen **nicht** auf der Karte: die Produktseite spricht allgemein von „RTOs of minutes", die Doku nennt die Spanne. Kein Widerspruch, aber die Karte bleibt bei der robusteren Aussage „RTO Minuten".
