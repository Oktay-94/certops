---
nr: 83
title: "Pilot Light vs Warm Standby vs Active/Active"
services: ["AWS Elastic Disaster Recovery", "Amazon Route 53", "AWS CloudFormation", "Amazon RDS", "Amazon S3", "AWS Backup"]
domains: [D2]
signalwords:
  - "lowest cost while still meeting an RTO of"
  - "scaled-down but fully functional copy"
  - "cannot serve requests without additional action"
  - "always running in the recovery Region"
  - "serving traffic from multiple Regions"
assets: ["battle_card_83.svg", "battle_card_83.png", "battle_card_83.pdf"]
status_note: |
  qc.py: 0 Befunde. 19 Boxen, 49 Texte, 2 Segmente, 0 Badges, 1 X-Kreis.
  Segmente aufgeschlüsselt: 2 X-Diagonalen. Keine Pfeile, daher kein Marker
  und keine Phantom-Segmente — die einzige Karte des Batches ohne <defs>.
  Badges: bewusst keine (Matrixkarte ohne Ablauf, laut Stil-Guide zulässig).
  Korrekturrunde (VOR dem Zeichnen durch svgkit-assert gefunden):
    1. Die DRS-Einordnungsbox lief mit zwei Textzeilen 4,3 px unten heraus.
       Behoben über title_dy=28 / line_gap=22, Boxgeometrie unverändert.
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde.
  R12-Gegencheck: 0 gestrokte <path> ohne fill="none".
  R16: engster gemessener Abstand eines freien Labels zu einer Boxkante
  20,0 px (Zeilenkopf „Daten"). Die vier Zeilenkopf-Labels sind rechtsbündig
  an x=290 gesetzt, die Matrixspalten beginnen bei x=310.
  Footer von Hand gemessen: 1380 px (Grenze 1420 px).
  Sichtprüfung: AUSSTEHEND. Erfolgt lokal durch Oktay vor dem Repo-Einbau.
  Inhaltliche Abweichung vom Masterplan: Die Themenzeile nennt drei Muster.
  Aufgenommen wurden vier (Backup & Restore ergänzt), nach ausdrücklicher
  Freigabe durch Oktay am 23.07.2026. Begründung: Ohne Backup & Restore hat
  die Kosten-RTO-Skala keinen Nullpunkt, und AWS führt durchgehend vier
  Strategien.
---

# Battle Card 83 — Pilot Light vs Warm Standby vs Active/Active

**Szenario:** Ein SaaS-Anbieter muss die RTO-Zusage gegenüber seinem größten Kunden von vier Stunden auf 15 Minuten senken, ohne die DR-Kosten zu verdreifachen.

## Ablauf

Die Karte ist eine Matrix, kein Ablauf. Gelesen wird sie spaltenweise; die drei Zeilen beantworten für jede Strategie dieselben drei Fragen.

- **Backup & Restore:** In der DR-Region läuft nichts. Die Infrastruktur wird im Ernstfall neu ausgerollt, die Daten aus Backups wiederhergestellt. RPO in Stunden, RTO bis zu 24 Stunden. Mit Point-in-Time-Recovery sinkt der RPO auf bis zu 5 Minuten. Günstigste Variante — und AWS hält ausdrücklich fest, dass sie für eine gut gebaute, hochverfügbare Anwendung ausreicht, solange „Desaster" den Verlust eines Rechenzentrums meint und nicht den einer Region.

- **Pilot Light:** Die Kern-Infrastruktur steht, die Daten werden repliziert und sind immer verfügbar — aber es laufen **keine Compute-Instanzen**. Das Bild ist die Zündflamme: Sie brennt dauerhaft und kostet fast nichts, aber sie heizt das Haus nicht. Erst wenn jemand aufdreht, wird daraus Wärme. RPO in Minuten, RTO in Zehnerminuten.

- **Warm Standby:** Eine verkleinerte, aber **voll funktionsfähige** Kopie läuft dauerhaft in der DR-Region. Sie kann sofort Verkehr annehmen, nur eben nicht in Produktionsmenge. Im Ernstfall wird hochskaliert, mehr nicht. RPO in Sekunden, RTO in Minuten. Wenn die DR-Region in voller Größe läuft, heißt dieselbe Bauform Hot Standby.

- **Active/Active:** Beide Regionen nehmen produktiven Verkehr an. RPO nahe null, RTO potenziell null. Der Preis steht in derselben AWS-Quelle: Daten müssen über Regionen synchronisiert werden, und Schreibkonflikte auf denselben Datensatz in zwei Regionen müssen vermieden oder behandelt werden — was komplex ist.

- **Einordnung von Karte 78 (Transport):** AWS Elastic Disaster Recovery sitzt zwischen den Spalten. Der Reliability Pillar empfiehlt es ausdrücklich für den Fall, dass die Kosten drücken, man aber RPO und RTO auf Warm-Standby-Niveau braucht: DRS arbeitet nach dem Pilot-Light-Muster, erreicht aber durch kontinuierliche Datenreplikation einen RPO in Sekunden und einen RTO in Minuten. Dauerhaft laufen nur die Replikations-Ressourcen.

- **✗ Verworfen — Active/Active als Standardwahl:** AWS nennt es die operativ komplexeste der DR-Strategien und schreibt, sie solle nur gewählt werden, wenn die Geschäftsanforderung es verlangt. Für das Szenario mit 15 Minuten RTO ist Warm Standby die Antwort — Active/Active würde die Vorgabe übererfüllen und dafür Komplexität und Kosten einkaufen, die niemand bestellt hat.

## Prüfungs-Kernsatz

**Der Unterschied zwischen Pilot Light und Warm Standby ist nicht die Datenreplikation — beide replizieren — sondern ob die DR-Region ohne zusätzlichen Schritt bereits Anfragen beantworten kann.**

## Abgrenzungen

- **83 ↔ 78 (DRS):** Karte 78 erklärt den Dienst, Karte 83 ordnet ihn in die Landkarte ein. Auf Karte 83 steht DRS bewusst nicht als fünfte Spalte, sondern als Zeile darunter — es ist keine eigene Strategie, sondern eine Umsetzung, die zwei Spalten überbrückt.
- **83 ↔ 81:** Karte 81 klärt, *ob* eine zweite Region nötig ist. Karte 83 klärt, *wie voll* sie sein muss.
- **83 ↔ 84:** Karte 83 endet bei „die DR-Region ist bereit". Wie der Verkehr dorthin kommt, steht auf Karte 84.

## Klassiker-Fallen

1. **Pilot Light und Warm Standby verwechseln.** → AWS beschreibt den Unterschied selbst als schwer greifbar und löst ihn so auf: Pilot Light kann ohne zusätzliche Handlung keine Anfragen verarbeiten, Warm Standby kann es sofort — nur mit weniger Kapazität. Pilot Light verlangt Einschalten *und* Hochskalieren, Warm Standby nur Hochskalieren.
2. **Die strengste Strategie wählen.** → AWS warnt ausdrücklich davor, eine strengere Strategie umzusetzen als nötig, weil das unnötige Kosten erzeugt. Prüfungsfragen mit „most cost-effective" und einer RTO-Vorgabe wollen die *knapp ausreichende* Strategie.
3. **Control-Plane-Abhängigkeiten im Failover.** → AWS empfiehlt, für maximale Widerstandsfähigkeit im Failover nur Data-Plane-Operationen zu verwenden. Eine Strategie, die im Ernstfall erst neue Ressourcen anlegen muss, hängt an der Control Plane — genau deshalb hat Warm Standby einen niedrigeren RTO als Pilot Light.
4. **Replikation für Backup halten.** → Gilt in allen vier Spalten: Ohne Versionierung oder Point-in-Time-Recovery schützt Replikation nicht gegen Datenverfälschung oder Löschung.

## Faktencheck-Notizen (23.07.2026)

- **Alle vier RPO/RTO-Wertepaare** — Well-Architected Reliability Pillar, REL13-BP02, wörtlich: Backup & Restore (RPO in Stunden, RTO 24 Stunden oder weniger, mit PITR RPO bis herunter zu 5 Minuten), Pilot Light (RPO in Minuten, RTO in Zehnerminuten), Warm Standby (RPO in Sekunden, RTO in Minuten), Multi-Region Active/Active (RPO nahe null, RTO potenziell null). Eine Primärquelle für alle vier — keine Zusammenstückelung aus verschiedenen Quellen.
- **Abgrenzung Pilot Light / Warm Standby** — identischer Wortlaut in zwei AWS-Quellen: REL13-BP02 und dem Whitepaper „Disaster Recovery of Workloads on AWS". Konsistent.
- **Hot Standby** — REL13-BP02: voll hochskaliertes Warm Standby heißt Hot Standby.
- **DRS-Einordnung** — REL13-BP02: DRS bietet RPO und RTO ähnlich Warm Standby bei niedrigem Pilot-Light-Kostenansatz, RPO in Sekunden, RTO in Minuten.
- **Active/Active nur bei echter Anforderung** — REL13-BP02, wörtlich.

### Divergenz zur Masterplan-Themenzeile

Die Zeile 83 des Masterplans nennt drei Muster. AWS führt vier. Nach Freigabe wurde Backup & Restore als vierte Spalte aufgenommen; ohne sie fehlt der Skala der linke Rand, und die Aussage „nie strenger als nötig" verliert ihren Bezugspunkt.

### Nicht bestätigt / bewusst weggelassen

- **Konkrete Kostenzahlen oder -faktoren.** Es gibt keine belastbare AWS-Primärquelle, die etwa „Warm Standby kostet das X-fache von Pilot Light" sagt. Auf der Karte steht deshalb nur eine ordinale Skala (am niedrigsten / niedrig / mittel / am höchsten). Wer Zahlen braucht, rechnet mit dem AWS Pricing Calculator für die konkrete Landschaft.
- **Failback** ist nicht dargestellt, obwohl der Reliability Pillar ihn ausführlich behandelt. Er hätte die Matrix gesprengt.

### Bewusste Vereinfachungen im Diagramm

- Die Zeile „Daten" fasst Datenbank, Objektspeicher und Dateisysteme zusammen.
- Die Matrix zeigt keine Architektur, sondern Eigenschaften. Es gibt bewusst keine Pfeile und keine Regionen-Zonen — dafür ist Karte 81 zuständig.
- „Active/Active" ist die gekürzte Form; AWS schreibt „Multi-Site Active/Active". Der volle Name passte bei 22 px Bold nicht in die Spaltenbreite von 290 px (291,6 px gemessen bei 274 px zulässig).

### Farbkonventionen dieser Karte

Bewusst rollenkonform gelöst, im Gegensatz zu Karte 80: Die Rollenfarben liegen auf den **Zeilen** — Orange für die Compute-Zeile, Grün für die Daten-Zeile, Gold für die Kennzahlen-Zeile — und nicht auf den Strategien. Die vier Strategienamen stehen einheitlich in Navy. Damit bleibt die Palette eine Rollenpalette und wird nicht zur Intensitätsskala. Teal für die DRS-Einordnung (Replikation = Transport), Rot für den verworfenen Pfad.
