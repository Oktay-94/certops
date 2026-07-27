---
nr: 81
title: "Multi-AZ vs Multi-Region"
services: ["Amazon RDS Multi-AZ", "Amazon Aurora Global Database", "Elastic Load Balancing", "EC2 Auto Scaling", "Amazon S3 Cross-Region Replication", "Amazon DynamoDB Global Tables"]
domains: [D2]
signalwords:
  - "survive the loss of an entire Region"
  - "protect against an Availability Zone failure"
  - "zero data loss / RPO of zero"
  - "synchronous replication across Availability Zones"
  - "promote a secondary Region"
assets: ["battle_card_81.svg", "battle_card_81.png", "battle_card_81.pdf"]
status_note: |
  qc.py: 0 Befunde. 10 Boxen, 38 Texte, 8 Segmente, 0 Badges, 1 X-Kreis.
  Segmente aufgeschlüsselt: 4 echte Pfeilsegmente + 2 X-Diagonalen + 2
  Phantom-Segmente aus dem einen Marker-<defs>-Pfad (bekannte qc.py-Blindstelle).
  Badges: bewusst keine — Vergleichskarte ohne Ablauf, laut Stil-Guide zulässig.
  Korrekturrunden (beide VOR dem Zeichnen durch svgkit-asserts gefunden):
    1. Argumentreihenfolge von box() vertauscht (Spalten- und Zeilenpaare
       hintereinander übergeben statt x0,y0,x1,y1). Behoben durch Helper R(),
       nicht durch zweite Koordinatendefinition.
    2. Verworfen-Box lief 0,3 px unten heraus. Behoben über title_dy=30 /
       line_gap=24, Boxgeometrie unverändert.
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde, keine Tinte außerhalb der Element-Geometrie.
  R12-Gegencheck: 0 gestrokte <path> ohne fill="none".
  R16 (kein Skript deckt das ab): engster gemessener Abstand eines freien
  Labels zu einer Boxkante 18,0 px — Zonenlabel Band A. Keine Überlappung.
  Footer von Hand gemessen: 1236 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 81 — Multi-AZ vs Multi-Region

**Szenario:** Ein Versicherer betreibt die Schadenmeldung Multi-AZ in eu-central-1; nach einem Brand in einem fremden Rechenzentrum will der Vorstand wissen, ob die Anwendung auch den Ausfall einer ganzen Region überstehen würde.

## Ablauf

- **Band 1 — AZ-Ausfall (Quelle/Struktur):** Eine Availability Zone fällt aus. AWS nennt als typische Auslöser Feuer, Überflutung und größere Stromausfälle. Eine AZ ist kein Serverraum, sondern ein eigener Standort mit eigener Stromversorgung — mehrere AZs fallen selten gemeinsam aus, aber eine einzelne durchaus.

- **Band 1 — Was greift (Compute + Storage):** Elastic Load Balancing und Auto Scaling halten Kapazität in mehreren AZs; die ungesunde AZ fällt aus der Verteilung heraus. RDS Multi-AZ repliziert synchron auf einen Standby in einer zweiten AZ. Das ist die entscheidende Eigenschaft: synchron heißt, eine Transaktion gilt erst als bestätigt, wenn beide Seiten sie haben. Deshalb ist der Datenverlust bei einem Failover null.

- **Band 1 — Was es kostet an Zeit (Governance):** RPO 0, und das Failover läuft ohne Eingriff. Bei der klassischen Multi-AZ **DB Instance** dauert es typischerweise 60 bis 120 Sekunden; beim Multi-AZ **DB Cluster** mit zwei lesbaren Standbys typischerweise unter 35 Sekunden. Wer beide Bauformen für dasselbe hält, verschätzt sich um den Faktor drei.

- **Band 2 — Regions-Ausfall (Quelle/Struktur):** Die gesamte Region ist nicht erreichbar. Kein Multi-AZ-Mechanismus hilft hier, weil alle AZs derselben Region angehören.

- **Band 2 — Was greift (Storage + Transport):** Aurora Global Database repliziert auf Speicherebene in eine zweite Region, mit typischer Latenz unter einer Sekunde und über eine eigene Infrastruktur, die die Datenbank nicht ausbremst. Für Objektdaten übernimmt S3 Cross-Region Replication, für Schlüssel-Wert-Daten DynamoDB Global Tables. Alle drei arbeiten **asynchron** — daher ist der RPO nicht null.

- **Band 2 — Was es kostet an Zeit (Governance):** Effektiv RPO rund 1 Sekunde, RTO rund 1 Minute. Wichtig: Diese Minute ist die *Promotion*, also der Wechsel der Sekundärregion in den Schreibbetrieb. Sie passiert nicht von selbst — jemand oder etwas muss sie auslösen.

- **✗ Verworfen — der Trugschluss:** „Wir sind Multi-AZ, also überstehen wir auch den Ausfall einer Region." Multi-AZ endet an der Regionsgrenze. AWS formuliert es im Reliability Pillar unmissverständlich: Geht die Definition eines Desasters über den Verlust eines Rechenzentrums hinaus zum Verlust einer Region, kommen nur Pilot Light, Warm Standby oder Multi-Site Active/Active in Frage.

## Prüfungs-Kernsatz

**Multi-AZ ist Hochverfügbarkeit innerhalb einer Region mit RPO 0 — gegen den Ausfall einer ganzen Region hilft ausschließlich eine zweite Region.**

## Abgrenzungen

- **81 ↔ 83:** Karte 81 beantwortet „wogegen schützt was", Karte 83 „welches DR-Muster zu welchem RTO und Budget passt". Karte 81 endet bei der Feststellung, dass eine zweite Region nötig ist; Karte 83 beginnt dort.
- **81 ↔ 84:** Die Promotion der Sekundärregion ist auf Karte 81 ein Schritt ohne Mechanik. Wie der Verkehr tatsächlich dorthin findet, steht auf Karte 84.
- **Cross-Region Read Replica vs Aurora Global Database:** Eine Read Replica in einer zweiten Region wird nicht von allein zum Primary. Die Promotion ist eine bewusste Handlung, und danach ist die Replikationsbeziehung aufgelöst. Das steht im Footer, weil es eine sehr häufige Prüfungsfalle ist.

## Klassiker-Fallen

1. **„Multi-AZ ist Disaster Recovery."** → Multi-AZ ist Hochverfügbarkeit. DR beginnt dort, wo der Ausfall größer ist als das, wogegen die In-Region-Redundanz ausgelegt wurde.
2. **Multi-AZ DB Instance und Multi-AZ DB Cluster gleichsetzen.** → 60–120 Sekunden gegenüber unter 35 Sekunden. Fragen, die eine Failover-Zeit nennen, unterscheiden genau hier.
3. **Synchron und asynchron verwechseln.** → Innerhalb der Region synchron, RPO 0. Über Regionen asynchron, RPO größer null. Wer „RPO 0 über zwei Regionen" verspricht, hat die Physik gegen sich.
4. **Replikation mit Backup verwechseln.** → Replikation kopiert auch Datenkorruption und Löschungen mit. Der Reliability Pillar weist ausdrücklich darauf hin, dass Replikation ohne Point-in-Time-Recovery nicht gegen Datenverfälschung schützt.

## Faktencheck-Notizen (23.07.2026)

- **RDS Multi-AZ DB Instance, 60–120 Sekunden** — AWS-Dokumentation „Failing over a Multi-AZ DB instance for Amazon RDS": Failover-Zeiten liegen typischerweise bei 60–120 Sekunden, große Transaktionen oder ein längerer Recovery-Vorgang können das verlängern. Primärquelle, unstrittig.
- **Multi-AZ DB Cluster, unter 35 Sekunden** — AWS-Produktseite „Amazon RDS Multi-AZ deployments": automatisches Failover typischerweise unter 35 Sekunden ohne Datenverlust. Primärquelle.
- **Aurora Global Database, RPO 1 s / RTO 1 min** — AWS-Whitepaper „Amazon Aurora High Availability and Disaster Recovery Features for Global Resilience": typische Erholung in einer Minute, effektiv RPO 1 Sekunde und RTO 1 Minute. Bestätigt durch die Produktseite (Promotion in unter einer Minute, Replikationslatenz typisch unter 1 Sekunde).
- **Multi-AZ schützt gegen Feuer/Flut/Stromausfall** — Reliability Pillar REL13-BP02, wörtlich als Beispiele genannt.

### Nicht bestätigt / bewusst weggelassen

- **Anzahl der sekundären Regionen bei Aurora Global Database.** Das AWS-Whitepaper zur globalen Resilienz nennt bis zu fünf sekundäre Regionen und bis zu 90 Reader-Instanzen. Mehrere Drittquellen nennen zehn oder elf Regionen. Da sich hier eine AWS-Quelle und mehrere Nicht-AWS-Quellen widersprechen und die Zahl für die Kernaussage der Karte ohne Belang ist, steht **keine Zahl auf der Karte**. Wer sie braucht, prüft sie tagesaktuell in „Supported Regions and DB engines for Aurora global databases".
- **RPO-Wert für S3 CRR und DynamoDB Global Tables.** Keine belastbare, allgemein gültige Zahl aus Primärquellen; auf der Karte steht deshalb nur „asynchron".

### Bewusste Vereinfachungen im Diagramm

- Die beiden Bänder zeigen keine Netzwerktopologie. Subnetze, Routing und Endpunkte sind weggelassen, weil die Karte eine Zuordnungsfrage beantwortet, keine Architektur zeichnet.
- „S3 · DynamoDB" fasst zwei Dienste in einer Box zusammen. Sie stehen stellvertretend für „regionsübergreifende Datenreplikation jenseits der relationalen Datenbank".
- Der Weg zurück (Failback) ist nicht dargestellt.

### Farbkonventionen dieser Karte

Rollenkonform nach Stil-Guide ab Karte 61. Navy für die beiden Ausfallereignisse (Struktur, keine Architekturrolle), Orange für Compute, Grün für Storage, Teal für Transport/Replikation, Gold für die RTO/RPO-Kennzahlen (Governance), Rot ausschließlich für den verworfenen Pfad. Keine Abweichung.
