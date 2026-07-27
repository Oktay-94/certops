---
nr: 80
title: "Die 7 R's der Migration — Wellenplan statt Technologiediskussion"
services:
  - "AWS Application Migration Service (MGN)"
  - "VMware Cloud on AWS"
  - "AWS Database Migration Service (DMS)"
  - "AWS Migration Hub"
domains: [D4, D3]
signalwords:
  - "300 applications and a data center contract ending"
  - "retire, retain, relocate, rehost, repurchase, replatform, refactor"
  - "modernize after the migration, not during"
  - "refactor is the most complex strategy"
  - "which strategy for which application"
assets: [battle_card_80.svg, battle_card_80.png, battle_card_80.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 80 — Die 7 R's der Migration

**Szenario:** 300 Anwendungen, der Rechenzentrumsvertrag endet in 18 Monaten, und der Vorstand will einen Wellenplan sehen statt einer Technologiediskussion.

## Ablauf
Strategie- statt Ablaufkarte: sieben Zeilen, geordnet nach wachsender Änderungstiefe.

- **Retire** — Anwendungen ohne Nutzer abschalten. Die billigste Migration ist die, die nicht stattfindet; in der Praxis fällt hier ein zweistelliger Prozentsatz des Portfolios weg, bevor ein einziger Server bewegt wird. Werkzeug: Portfolio-Assessment.
- **Retain** — Was regulatorisch oder technisch gebunden ist, bleibt vorerst stehen. Eine bewusste Entscheidung mit Wiedervorlage, kein Versäumnis.
- **Relocate** — Die vSphere-Landschaft wandert 1:1, gleiche Werkzeuge, gleiche Admins (siehe Karte 75).
- **Rehost** — Lift-and-Shift auf EC2, ohne Codeänderung. Der Application Migration Service repliziert kontinuierlich und schneidet mit minimaler Ausfallzeit um.
- **Repurchase** — Statt zu migrieren wird gekauft: Exchange-Server abgeben, Microsoft 365 abonnieren. Der Betrieb verschwindet mitsamt dem Server.
- **Replatform** — Umzug mit kleiner Optimierung: die Oracle-Datenbank landet in einem Managed Service statt auf einer selbstverwalteten Instanz. Der Code bleibt weitgehend unangetastet.
- **Refactor** — Architektur ändern, Monolith in Container oder Serverless zerlegen. Der größte Nutzen und der größte Aufwand.
- **✗ — Alles refactoren, weil „cloud-native":** AWS rät bei großen Migrationen ausdrücklich davon ab. Refactor ist die komplexeste Strategie und über hunderte Anwendungen kaum steuerbar; empfohlen wird rehost, relocate oder replatform — und die Modernisierung **nach** der Migration.

## Prüfungs-Kernsatz
**Bei Zeitdruck zuerst Retire und Rehost oder Relocate; Refactor ist die teuerste Strategie und gehört hinter die Migration, nicht davor.**

## Klassiker-Fallen
1. **Refactor mit Replatform verwechseln** → Replatform ändert die Plattform bei weitgehend gleichem Code („lift and reshape"), Refactor ändert die Architektur.
2. **Relocate mit Rehost verwechseln** → Relocate verschiebt eine ganze virtualisierte Umgebung ohne Konvertierung der einzelnen Server; Rehost bewegt Server auf EC2.
3. **Retain als Nichtstun lesen** → Retain ist eine dokumentierte Entscheidung mit Begründung und Wiedervorlage.
4. **Eine einzige Strategie fürs ganze Portfolio wählen** → Reale Migrationen kombinieren mehrere R's; die Frage lautet immer „welches R für diese Anwendung".

## Faktencheck-Notizen (23.07.2026)
- Die sieben Strategien sind in AWS Prescriptive Guidance benannt (`large-migration-guide/migration-strategies.html`): Rehost, Replatform, Relocate, Retain, Retire, Repurchase, Refactor/Re-architect.
- Dieselbe Quelle empfiehlt für große Migrationen ausdrücklich rehost, relocate und replatform und rät von Refactor während der Migration ab. Das ist die Grundlage des verworfenen Pfades.
- **Keine offizielle Aufwandsrangfolge:** Die verbreitete Kette „Retire < Retain < Relocate < Rehost < Repurchase < Replatform < Refactor" stammt aus Drittquellen (u. a. Tutorials Dojo), nicht aus der AWS-Doku. Die Karte zeigt deshalb eine unbeschriftete Achse „wachsende Änderungstiefe" und **keine nummerierte Rangfolge**.
- Prozentzahlen zur Portfolio-Verteilung (etwa „40–50 % rehost") kursieren bei Beratungshäusern, sind nicht AWS-belegt und stehen deshalb nicht auf der Karte.
- **Stilabweichung:** Auf dieser Karte dient die Rollenpalette als Intensitätsskala (grau → blau → gold → orange) statt als Architekturrollen-Zuordnung. Auf einer Strategiekarte gibt es keine Quelle/Transport/Compute-Rollen. Bewusst und hier dokumentiert.
