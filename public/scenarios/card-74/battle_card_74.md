---
nr: 74
title: "Migration Hub + Application Discovery Service — erst erfassen, dann in Wellen migrieren"
services:
  - "AWS Migration Hub"
  - "AWS Application Discovery Service (Agent)"
  - "AWS Application Discovery Service (Agentless Collector)"
  - "AWS Application Migration Service (MGN)"
  - "AWS Database Migration Service (DMS)"
domains: [D4, D3]
signalwords:
  - "dependency mapping before migration waves"
  - "inventory hundreds of VMs without installing agents"
  - "right-sized EC2 recommendations"
  - "track migration status centrally"
  - "set the home region first"
assets: [battle_card_74.svg, battle_card_74.png, battle_card_74.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 74 — Migration Hub + Application Discovery Service

**Szenario:** Migrations-Portfolio erfassen und zentral tracken — erst wissen, was da ist, dann in Wellen migrieren.

## Ablauf

- **1 — Discovery Agent (tief):** Auf jedem Server installiert liefert der Agent, was nur von innen sichtbar ist: laufende Prozesse, ein- und ausgehende Netzverbindungen, Performance-Zeitreihen. Genau diese Daten braucht man für **Abhängigkeits-Mapping** — welche Server müssen in dieselbe Migrationswelle.
- **2 — Agentless Collector (breit):** Eine einzige OVA in vCenter deployt, inventarisiert Hunderte VMs auf einen Schlag: Hostnamen, IPs, Disk-Zuteilung, Ø/Peak-Auslastung (CPU, RAM, Disk-I/O), zusätzlich DB-Inventar (Oracle, SQL Server, MySQL, PostgreSQL) ohne Host-Agent. Seit 11/2024 auch Netzverbindungen. Trade-off: breit statt tief — keine Prozessdetails.
- **3 — Daten in die Home Region:** Beide Collector senden an Migration Hub. Die **Home Region** ist zuerst festzulegen — dort und nur dort landen alle Discovery-Daten. Alternativ geht ein Datei-Import (CSV) ganz ohne Collector.
- **4 — Planen und tracken:** Im Hub werden Server zu Anwendungen gruppiert, EC2-Empfehlungen abgeleitet und der Status der eigentlichen Migrations-Tools (MGN, DMS) zentral verfolgt. Der Hub selbst migriert nichts — er ist die Klammer, nicht der Kran.

## Prüfungs-Kernsatz

**Agent = tief (Prozesse + Netz, pro Server), Agentless = breit (eine OVA in vCenter). Der Hub trackt, migriert aber nicht.**

## Klassiker-Fallen

1. **„Dependency Mapping nötig"** → Discovery **Agent** (oder Agentless Collector mit Netzverbindungs-Feature); „schnelles VM-Inventar ohne Installation" → **Agentless Collector**.
2. **Home Region vergessen:** Ohne gesetzte Home Region registriert sich kein Collector.
3. **Hub als Migrations-Tool:** Falsch — MGN migriert Server, DMS Datenbanken; der Hub aggregiert nur den Status.

## Faktencheck-Notizen (22.07.2026)

- **Status:** AWS Migration Hub ist seit **07.11.2025 für Neukunden geschlossen**; Nachfolger für neue Projekte ist **AWS Transform** (docs.aws.amazon.com/migrationhub). Für Bestandskunden läuft der Dienst weiter, und im SAA-C03-Fragenpool ist Migration Hub weiterhin präsent — die Karte lehrt den Prüfungsstoff, diese Notiz die Realität.
- Collector-Fähigkeiten bestätigt via docs.aws.amazon.com/application-discovery (Agent: Prozesse/Netz/Performance; Agentless: vCenter-OVA, DB-Inventar, seit 11/2024 Netzverbindungen).
