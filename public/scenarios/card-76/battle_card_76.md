---
nr: 76
title: "Mainframe Modernization — Replatform oder Refactor statt Big Bang"
services:
  - "AWS Mainframe Modernization"
  - "AWS Mainframe Modernization (AWS Blu Age, Refactor)"
  - "AWS Database Migration Service (DMS)"
  - "Amazon Aurora"
  - "Amazon S3"
domains: [D3, D4]
signalwords:
  - "COBOL batch workload on z/OS"
  - "phase out the data center in waves, not a big bang"
  - "keep the code but change the platform"
  - "automatically convert COBOL to Java"
  - "no lift and shift for mainframe architecture"
assets: [battle_card_76.svg, battle_card_76.png, battle_card_76.pdf]
status_note: |
  Ohne qc.py-Statuszeile geliefert. Frontmatter beim Einbau am 27.07.2026 aus
  Kartentext, SVG und Masterplan-Zeile abgeleitet, von Oktay freigegeben.
  Karten 71–75 zusätzlich ohne didaktische Szenario-Freigabe entstanden.
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---
# Battle Card 76 — Mainframe Modernization

**Szenario:** Ein Versicherer rechnet Policen nachts als COBOL-Batch auf z/OS ab; der Hardware-Wartungsvertrag endet, die letzten COBOL-Entwickler gehen in Rente, und die Ablösung soll in Wellen statt als Big Bang laufen.

## Ablauf
- **1 — Analyse & Plan:** Der M2 Analyzer liest den Bestand: Programme, JCL-Jobs, Copybooks und ihre Abhängigkeiten. Erst daraus entsteht der Wellenplan. Wie beim Altbau-Umbau misst man die tragenden Wände, bevor man die erste einreißt — eine einzige Copybook-Definition hängt oft an zwanzig Programmen gleichzeitig.
- **2 — Daten & Artefakte:** DB2 und VSAM wandern über AWS DMS nach Aurora oder RDS. JCL-Dateien und Batch-Binaries kommen nach S3; die Laufzeitumgebung erwartet beides genau dort und liest die Pfade aus der Application-Definition.
- **3 — Replatform:** Der COBOL-Code bleibt COBOL und läuft auf einer Runtime von Rocket Software (früher Micro Focus) auf AWS. Wenig Risiko, schneller RZ-Ausstieg — das Personalproblem bleibt aber bestehen, es braucht weiter Leute, die COBOL lesen können.
- **4 — Refactor:** AWS Blu Age wandelt COBOL automatisiert in Java-Services. Teurer und langsamer, dafür kann danach ein normales Java-Team weiterarbeiten. Beide Wege setzen auf demselben Datenstand auf, deshalb kann Welle 1 replatformen und Welle 3 refactoren.
- **✗ — Manueller Rewrite als Big Bang:** Alles auf einmal neu schreiben, mit einem Stichtag. Die Fachlogik existiert meist nur im Code und nicht in Dokumenten; ein abgebrochener Rewrite hinterlässt ein halb totes Altsystem ohne Rückweg.

## Prüfungs-Kernsatz
**Replatform tauscht die Plattform und behält den Code, Refactor tauscht den Code — wer schnell aus dem Rechenzentrum muss, replatformt zuerst und modernisiert danach.**

## Klassiker-Fallen
1. **„Den Mainframe einfach auf EC2 rehosten"** → Für z/Architecture gibt es kein Lift-and-Shift auf x86. Rehost ist bei Mainframes keine Antwortoption; die Wahl steht zwischen Replatform und Refactor.
2. **Daten zuletzt migrieren** → Ohne migrierte Daten lässt sich keine der beiden Runtimes testen. Daten und Artefakte kommen vor der ersten Welle.
3. **Refactor als Standardweg, weil „cloud-native"** → Unter Zeitdruck ist Refactor die riskanteste Wahl (siehe Karte 80).

## Faktencheck-Notizen (23.07.2026)
- **Managed Runtime Environment:** seit 07.11.2025 keine Neukunden mehr (docs.aws.amazon.com/m2, „AWS Mainframe Modernization availability change"). Bestandskunden laufen weiter.
- **Self-Managed Experience:** im AWS Service Availability Update vom 30.06.2026 als „moving to Maintenance" geführt — ab 30.07.2026 keine Neukunden mehr.
- **Prüfungsstand vs. Realität:** SAA-C03 fragt den Service als Replatform-/Refactor-Werkzeug ab, die Karte lehrt diesen Stand. In der Praxis führt AWS Neukunden inzwischen über **AWS Transform for mainframe**; Teile von Blu Age sind dort aufgegangen (AWS re:Post, Migrationsleitfaden 2026).
- Die Replatform-Runtime hieß früher Micro Focus, heute Rocket Software.
- Auf der Karte steht keine einzige Zahl, daher war kein Quellenkonflikt aufzulösen.
