---
nr: 71
title: "Application Migration Service (MGN) — Lift-and-Shift mit Cutover in Minuten"
services:
  - "AWS Application Migration Service (MGN)"
  - "Amazon EC2"
  - "AWS Server Migration Service (SMS, verworfen — eingestellt)"
domains: [D3, D2]
signalwords:
  - "lift and shift with minimal downtime"
  - "continuous block-level replication"
  - "cutover window of minutes"
  - "rehost without changing the application"
  - "test launch without disrupting replication"
assets: [battle_card_71.svg, battle_card_71.png, battle_card_71.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 71 — Application Migration Service (MGN)

**Szenario:** 50 VMs (vSphere/Hyper-V/Bare-Metal) sollen per Lift-and-Shift nach EC2 — mit minimaler Downtime.

## Ablauf

- **1 — Block-Replikation:** Auf jedem Quellserver läuft der leichtgewichtige MGN-Agent. Er repliziert die Disks kontinuierlich auf Block-Ebene (TLS-verschlüsselt) in eine Staging Area im Ziel-Account. Die Produktion läuft dabei ungestört weiter — das ist der Grund, warum MGN keine Wartungsfenster für die Replikationsphase braucht.
- **2 — Test-Launch:** Aus dem Staging-Stand lässt sich jederzeit eine Test-Instanz starten, ohne die Quelle oder die laufende Replikation zu berühren. Deshalb ist die Box gestrichelt: temporär, non-disruptiv. Wer den Test auslässt, entdeckt Boot- und Treiberprobleme erst im Cutover.
- **3 — Final Sync + Cutover:** Zum gewählten Zeitpunkt wird final synchronisiert und die Produktions-EC2-Instanz gestartet. Das Cutover-Fenster misst sich in **Minuten**, weil die Daten längst drüben sind — nur der letzte Delta-Sync und der Start passieren jetzt. OS, Anwendungen und Daten kommen 1:1 an, nichts wird umgebaut (Rehost).
- **4 — Quelle stilllegen:** Die Quellserver bleiben ein Rollback-Fenster lang stehen (typisch 1–2 Wochen) und werden erst dann außer Betrieb genommen. Der Pfeil ist grau gestrichelt: nachgelagert, kein Datenfluss.
- **Verworfen — AWS SMS:** Der Vorgänger arbeitete Snapshot-basiert mit Cutover-Fenstern in Stunden und ist eingestellt. In der Prüfung ist „SMS" fast immer die falsche Antwort, wenn MGN zur Auswahl steht.

## Prüfungs-Kernsatz

**MGN = kontinuierliche Block-Replikation + Cutover in Minuten — die Standard-Antwort für Rehost/Lift-and-Shift.**

## Klassiker-Fallen

1. **MGN vs. SMS:** Snapshot-Zyklen und „Stunden" deuten auf SMS — veraltet. Block-Replikation und „Minuten" = MGN.
2. **MGN vs. DMS:** MGN migriert ganze Server, DMS migriert Datenbanken. „VMs umziehen" ≠ „Datenbank umziehen".
3. **Test-Launch:** Kandidaten glauben oft, Tests unterbrechen die Replikation — tun sie nicht. Genau das ist das Verkaufsargument.

## Faktencheck-Notizen (22.07.2026)

- AWS hat den Dienst 2026 in **„AWS Transform MGN"** umbenannt (Replikations-Engine innerhalb von AWS Transform). Funktionalität, APIs und Konsole unverändert; die Karte behält den prüfungsrelevanten Namen MGN. Quellen: aws.amazon.com/application-migration-service, docs.aws.amazon.com/mgn.
- CloudEndure Migration (Basis von MGN) ist seit Ende 2022 in den meisten Regionen abgeschaltet; SMS-APIs liefen bis März 2023.
- Container-Abweichung dokumentiert: Pillow 12.1.1 statt gepinnter 12.3.0 (qc.py-Messungen, OVERLAP_TOL fängt Rauschen ab). Fontconfig musste auf `rgba=none` gesetzt werden (Graustufen-AA), sonst Farbsäume im Titelband.
