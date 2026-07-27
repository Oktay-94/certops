---
nr: 72
title: "DMS homogen — warum hier kein Schema Conversion Tool nötig ist"
services:
  - "AWS Database Migration Service (DMS)"
  - "Amazon RDS for MySQL"
  - "AWS Schema Conversion Tool (SCT, verworfen — nur heterogen)"
domains: [D3, D2]
signalwords:
  - "the source database remains fully operational"
  - "same database engine, no conversion needed"
  - "change data capture keeps target in sync"
  - "near-zero downtime cutover"
  - "migrate a database, not the whole server"
assets: [battle_card_72.svg, battle_card_72.png, battle_card_72.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
---
# Battle Card 72 — DMS (homogen) + SCT-Abgrenzung

**Szenario:** MySQL on-prem → RDS for MySQL. Warum hier KEIN Schema Conversion Tool nötig ist.

## Ablauf

- **1 — Full Load:** DMS liest den Bestand aus der on-prem MySQL und lädt ihn in die Replikationsinstanz. Die Quelle bleibt dabei voll betriebsfähig — kein Freeze, kein Wartungsfenster. Das ist der zentrale DMS-Verkaufssatz: „the source database remains fully operational".
- **2 — Anwenden:** Die Replikationsinstanz schreibt die Daten nach RDS for MySQL. Weil Quelle und Ziel dieselbe Engine sind (**homogen**), kommen Schema, Datentypen und Code 1:1 an — nichts muss konvertiert werden.
- **3 — CDC (Change Data Capture):** Während und nach dem Full Load fängt DMS laufende Änderungen der Quelle ab (gestrichelt = fortlaufender Nebenfluss). Dadurch driftet das Ziel nicht weg, obwohl die Quelle weiter Schreiblast bekommt.
- **4 — Synchron bis Cutover:** CDC hält das Ziel aktuell, bis die Anwendung umgeschaltet wird — Downtime nahe null.
- **Verworfen — AWS SCT:** Das Schema Conversion Tool konvertiert Schemata, Stored Procedures und Code zwischen **verschiedenen** Engines (heterogen, z. B. Oracle → Aurora PostgreSQL). Bei gleicher Engine gibt es nichts zu konvertieren — SCT einzusetzen wäre reine Arbeitsbeschaffung. Der Boxrand bleibt in der Rollenfarbe (Compute): der Dienst ist nicht schlecht, er ist hier nur falsch.

## Prüfungs-Kernsatz

**SCT = Schema, DMS = Daten. Gleiche Engine → nur DMS. Engine-Wechsel → erst SCT, dann DMS.**

## Klassiker-Fallen

1. **„MySQL → RDS MySQL, welches Tool zusätzlich zu DMS?"** — Keins. „SCT" ist die Falle.
2. **Lage-Pflicht:** Quelle **oder** Ziel muss in AWS liegen (RDS/EC2). On-prem → on-prem unterstützt DMS nicht.
3. **DMS vs. MGN:** DMS migriert Datenbanken, MGN ganze Server. „Die ganze VM samt DB umziehen" → MGN.

## Faktencheck-Notizen (22.07.2026)

- Bestätigt via AWS DMS FAQ/Features: homogene Migration = Engine gleich, Schema/Datentypen kompatibel, kein SCT; seit 2023 gibt es dafür sogar einen serverlosen Modus mit nativem DB-Tooling (MySQL/PostgreSQL → RDS/Aurora).
- SCT existiert als Download-Tool und als integriertes „DMS Schema Conversion".
