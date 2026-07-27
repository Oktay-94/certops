---
nr: 90
title: "Well-Architected Review"
services: ["AWS Well-Architected Tool", "AWS Well-Architected Framework"]
domains: ["D1", "D2", "D3", "D4"]
signalwords:
  - "review the workload against best practices"
  - "identify high risk issues"
  - "measure improvement over time"
  - "structured architecture assessment"
  - "which pillar addresses this concern"
assets:
  - battle_card_90.svg
  - battle_card_90.png
  - battle_card_90.pdf
status_note: |
  qc.py: 0 Befunde. 7 Boxen (6 Karten-Boxen + Footer-Rect), 27 Texte, 18 Segmente,
  4 Badges, 1 X-Kreis.
  Segmentaufschluesselung (R5): 10 echte Segmente = 3 gerade Kettenpfeile + 1 Zulauf
  der Saeulen-Box + 3 Segmente des Ruecksprungs + 1 roter Pfad + 2 X-Diagonalen; dazu
  8 Phantom-Segmente aus 4 Marker-<defs> (mblau, mnavy, mgold, mrot, je 2).
  Badge 4 sitzt auf dem waagerechten Stueck des Ruecksprungs und markiert damit den
  Zyklusschluss; der Zulauf der Saeulen-Box traegt bewusst keinen Badge, weil er kein
  Ablaufschritt ist, sondern eine Zulieferung.
  Korrekturrunden: keine. precheck.py meldete vor dem Zeichnen 0 Befunde.
  Render-Sanity: PNG 2400x1350, Titelband-Kanaldivergenz 0.
  R13 (reine Schwarzpixel): 0.
  R12-Gegencheck: 0 Verstoesse.
  R16: 53.7 px, Label "nächster Review-Zyklus". Grenze ist 9 px; das ist der
  komfortabelste Wert des Batches.
  Footer-Breite von Hand gemessen: 1138 px (Grenze 1420 px).
  Sichtpruefung: AUSSTEHEND, erfolgt lokal durch Oktay. Bildbetrachter lieferte einen
  leeren Platzhalter (R8).
---

# Battle Card 90 — Well-Architected Review

## Szenario

Nach dem Go-Live soll das Team belegen, wo die Architektur Risiken traegt — und ein
Quartal spaeter zeigen, dass sie kleiner geworden sind. Diese Karte fasst die Domaene
zusammen, ohne eine der Karten 81 bis 89 nachzuerzaehlen: Sie zeigt den
**Bewertungsvorgang**, nicht die Bausteine.

## Ablauf

**1 — Workload definieren.** Ein Workload ist eine Sammlung aus Ressourcen und Code,
die einen Geschaeftswert liefert. Er kann eine Teilmenge eines einzelnen Accounts
sein oder sich ueber mehrere Accounts erstrecken. Der Zuschnitt ist die erste
Entscheidung des Reviews — zu gross gefasst, wird das Ergebnis unbrauchbar.

**2 — Lens waehlen und Fragen beantworten.** Standard ist die Well-Architected
Framework Lens; fuer spezielle Workloads gibt es weitere Lenses. Die Fragen sind nach
den sechs Saeulen sortiert, und sie werden ehrlich beantwortet — ein
geschoentes Review erzeugt ein geschoentes Ergebnis und sonst nichts.

**3 — Risiken ergeben sich aus den Antworten.** Das Werkzeug leitet daraus **High Risk
Issues (HRIs)** und **Medium Risk Issues (MRIs)** ab. HRIs sind laut AWS
architektonische und operative Entscheidungen, die erheblichen negativen Einfluss auf
das Geschaeft haben koennen. Daraus entsteht der Improvement Plan.

**4 — Milestone speichern und von vorn.** Ein Milestone haelt den Zustand des Workloads
zu einem Zeitpunkt fest. Nach jeder Verbesserung wird ein weiterer gesetzt — erst
dadurch wird Fortschritt ueberhaupt messbar. Der Ruecksprung auf Schritt 2 macht aus
dem Review einen Regelkreis.

**Die sechs Saeulen** stehen als eigener Block unter Schritt 2, weil sie die
Bewertungsdimension liefern: Operational Excellence, Security, Reliability,
Performance Efficiency, Cost Optimization, Sustainability.

**Verworfener Pfad** — ein einziges Review vor dem Go-Live: Ohne zweiten Milestone
gibt es keinen Vergleichspunkt. Die Risiken bleiben unbeobachtet, und der Review wird
zur Ablage statt zum Regelkreis.

## Pruefungs-Kernsatz

Well-Architected ist ein **wiederholter Bewertungsvorgang mit Milestones** — kein
Architekturdiagramm, keine Zertifizierung und keine Checkliste zum Abhaken.

## Abgrenzungen

- **Gegen alle Karten 81 bis 89:** Diese Karte erklaert kein einziges Muster neu. Sie
  beschreibt, wie man die eigene Architektur systematisch gegen Best Practices prueft.
- **Gegen Trusted Advisor:** Trusted Advisor prueft automatisiert konkrete Ressourcen
  gegen feste Regeln. Der Well-Architected Review ist ein
  Frage-und-Antwort-Vorgang ueber Entwurfsentscheidungen, den Menschen fuehren.
- **Gegen Config und Security Hub:** beides kontinuierliche Konformitaetspruefung auf
  Ressourcenebene, kein Architekturreview.
- **Gegen die Saeulen als Wissensfrage:** In der Pruefung wird eher gefragt, welche
  Saeule ein bestimmtes Anliegen adressiert, als die Saeulen aufzuzaehlen.

## Klassiker-Fallen

- **Einmal-Review.** Der verworfene Pfad.
- **Sustainability vergessen.** Die sechste Saeule kam 2021 hinzu und faellt in aelteren
  Lernmaterialien noch weg.
- **HRI mit Ausfall verwechseln.** Ein High Risk Issue ist eine Entwurfsentscheidung
  mit Schadenspotenzial, kein laufender Incident.
- **Das Tool fuer kostenpflichtig halten.** Das Well-Architected Tool selbst kostet
  nichts.

## Faktencheck-Notizen

- *Sechs Saeulen und ihre Namen:* AWS Well-Architected Framework, Security Pillar,
  "Welcome" — dort steht ausdruecklich, dass das Framework auf sechs Saeulen beruht.
  Bestaetigt durch mehrere Lens-Dokumente (Migration Lens, Machine Learning Lens),
  die dieselbe Aufzaehlung fuehren. Die Masterplan-Zeile war damit korrekt; die
  Pruefung war noetig, weil sich die Zahl 2021 zuletzt geaendert hatte.
- *Definition Workload:* AWS Well-Architected Tool User Guide, "Workloads" — Sammlung
  aus Ressourcen und Code, die Geschaeftswert liefert, ueber einen oder mehrere
  Accounts.
- *HRI und MRI:* dieselbe Seite, Abschnitt "High Risk Issues (HRIs) and Medium Risk
  Issues (MRIs)".
- *Milestone-Definition und Best Practice, nach jeder Verbesserung einen zu setzen:*
  AWS Well-Architected Tool User Guide, "Milestones".
- *Improvement Plan je Risiko:* AWS Well-Architected Tool User Guide,
  "Well-Architected Framework issues per workload".
- *Sustainability kam 2021 dazu:* Drittquelle, deckt sich aber mit dem Umstand, dass
  aeltere AWS-Dokumente (Framework-Fassung 2022-03-31) bereits sechs Saeulen fuehren.
  Auf der Karte steht kein Jahr.

## Nicht bestaetigt / bewusst weggelassen

- **Lens-Katalog, Custom Lenses und Sharing** (unter anderem an bis zu 300 IAM-Nutzer):
  steht auf der Produktseite, ist fuer SAA-C03 aber Detailwissen. Weggelassen.
- **Maximale Anzahl Lenses je Workload** (kursiert als 20): nur Drittquelle.
- **Well-Architected Tool API und Profile/Prioritized View:** weggelassen.
- **Der Improvement Status** (None, Not Started, In Progress, Complete, Risk
  Acknowledged): dokumentiert, aber auf der Karte nicht gezeigt, weil er den Zyklus
  nicht veraendert.
- **Die Frage, ob das Framework als Ganzes noch "sechs Saeulen" heisst, falls AWS eine
  siebte ergaenzt:** Stand der Pruefung ist sechs; sollte sich das aendern, lehrt die
  Karte weiterhin den Pruefungsstand und die Realitaet gehoert hierher.

## Bewusste Vereinfachungen im Diagramm

- Der Zyklus hat vier Stationen. Real haengen zwischen Improvement Plan und naechstem
  Review Wochen an Umsetzungsarbeit.
- Die sechs Saeulen stehen als zwei Textzeilen in einer Box statt als sechs eigene
  Elemente. Das haelt die Karte lesbar, verliert aber die Gleichrangigkeit der
  Einzelsaeulen.
- Der Ruecksprung fuehrt auf Schritt 2 zurueck, nicht auf Schritt 1 — der Workload wird
  in der Regel nicht neu definiert.
- HRIs und MRIs stehen in einer Box, obwohl sie unterschiedliche Dringlichkeit haben.

## Farbkonventionen dieser Karte

- **Blau (Quelle):** der Workload als Ausgangspunkt.
- **Navy (Struktur):** Lens/Fragen und die Saeulen-Box. Damit folgt die Karte der
  Konvention von Karte 83: Die verglichenen beziehungsweise bewerteten Dimensionen
  stehen einheitlich in Navy, damit die Rollenpalette eine *Rollen*palette bleibt und
  nicht als Bedeutungsskala missbraucht wird. Die sechs Saeulen sind ausdruecklich
  **keine** Architekturrollen.
- **Gold (Governance):** HRI/MRI, Milestone und der Ruecksprung — der gesamte
  Steuerungsteil des Zyklus.
- **Rot:** nur der Abbruchpfad mit X-Kreis und Label. Die verworfene Box bleibt Gold.
- **Kein Grau:** Die auf Karte 85 eingefuehrte semantische Verwendung von Grau
  ("real gueltig, aber ausserhalb des Pruefungsstands") wird hier bewusst **nicht**
  aufgegriffen, solange die Farbfrage aus Batch 17 offen ist. Sonst waere aus einer
  offenen Frage stillschweigend eine Konvention geworden.
