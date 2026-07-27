---
nr: 85
title: "Savings Plans vs Reserved Instances vs Spot"
services: ["AWS Savings Plans", "Amazon EC2 Reserved Instances", "Amazon EC2 Spot Instances", "AWS Fargate", "AWS Lambda", "Amazon EC2 Auto Scaling"]
domains: [D4]
signalwords:
  - "most cost-effective purchasing option"
  - "commitment of one or three years"
  - "interruption-tolerant / fault-tolerant batch"
  - "capacity reservation"
  - "flexibility to change instance family"
assets: ["battle_card_85.svg", "battle_card_85.png", "battle_card_85.pdf"]
status_note: |
  qc.py: 0 Befunde. 15 Boxen, 36 Texte, 2 Segmente, 0 Badges, 1 X-Kreis.
  Segmente aufgeschlüsselt: 2 X-Diagonalen. Keine Pfeile, kein Marker,
  keine Phantom-Segmente.
  Badges: bewusst keine (Matrixkarte ohne Ablauf).
  Korrekturrunde (VOR dem Zeichnen durch svgkit-assert gefunden):
    1. Die Verworfen-Box lief mit drei Textzeilen 18 px unten heraus. Statt
       die Zeilenführung weiter zu quetschen auf zwei Zeilen gekürzt; die
       dritte Aussage („Rabatt ist keine Kapazität") stand ohnehin schon im
       Footer und wäre eine Dopplung gewesen.
  render.py: R13 reine Schwarzpixel 0, Titelband-Kanaldivergenz 0.
  zones.py (R7): 0 Befunde.
  R12-Gegencheck: 0 gestrokte <path> ohne fill="none".
  R16: engster gemessener Abstand eines freien Labels zu einer Boxkante
  12,3 px (Spaltenkopf „Kaufoption" zur Zeile 1). Der engste Wert des
  Batches, aber deutlich über der 9-px-Konvention des Stil-Guides und ohne
  Überlappung.
  Footer von Hand gemessen: 1366 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
  ACHTUNG Farbschuld: Diese Karte setzt Grau erstmals semantisch ein
  (Realitätsstand außerhalb des Prüfungsstands). Siehe Abschnitt
  „Farbkonventionen dieser Karte" — beim Sammelpass gemeinsam mit der
  Intensitätsskala auf Karte 80 zu bewerten.
---

# Battle Card 85 — Savings Plans vs Reserved Instances vs Spot

**Szenario:** Ein Handelsunternehmen fährt konstante Grundlast auf EC2 und Fargate, nächtliches Batch-Rendering und einen RDS-Cluster. FinOps soll 30 % senken, ohne die für das nächste Quartal terminierte Graviton-Migration zu blockieren.

## Ablauf

Die Karte ist eine Matrix. Gelesen wird sie zeilenweise: vom Lastprofil zur passenden Kaufoption.

- **Konstante Grundlast, Architektur noch in Bewegung → Compute Savings Plans:** Bis 66 % Rabatt. Man verpflichtet sich auf einen Betrag pro Stunde, nicht auf eine Instanz. Der Rabatt greift unabhängig von Instanzfamilie, Größe, Betriebssystem, Tenancy und Region — und er greift auch auf Fargate und Lambda. Genau das ist im Szenario entscheidend: Der Wechsel von m5 auf m7g lässt die Bindung unberührt. Laufzeit 1 oder 3 Jahre.

- **Stabile Familie in stabiler Region → EC2 Instance Savings Plans:** Bis 72 %. Man legt sich auf eine Instanzfamilie in einer Region fest, bleibt aber bei Größe und Betriebssystem flexibel. Sechs Prozentpunkte mehr Rabatt gegen deutlich weniger Bewegungsfreiheit — lohnt sich nur, wenn die Auslastung der gebundenen Familie wirklich hoch bleibt.

- **Unterbrechbarer Batch → Spot Instances:** Bis 90 %. Es ist freie Kapazität, die AWS zurückholen kann; man bekommt zwei Minuten Vorwarnung. Die Rebalance Recommendation meldet erhöhtes Unterbrechungsrisiko oft schon vorher — aber eben nicht garantiert vorher, sie kann auch gleichzeitig mit der Zwei-Minuten-Warnung eintreffen. Das Rendering passt dazu: zustandslos, wiederholbar, nicht zeitkritisch.

- **Datenbanken → Reserved Instances (Prüfungsstand):** Bis 72 %, gebunden an Instanzklasse, Engine und Region. Und der Punkt, den man sich merken muss: Nur eine **zonale** RI, die einer bestimmten Availability Zone zugewiesen ist, liefert zusätzlich eine Kapazitätsreservierung.

- **Realitätsstand (grau):** Seit dem 2. Dezember 2025 gibt es Database Savings Plans. AWS führt damit vier Savings-Plans-Typen. Siehe Faktencheck.

- **✗ Verworfen — Standard RI auf m5, während die Graviton-Migration terminiert ist:** Die Reservierung hängt an Familie, Größe und Region. Nach dem Wechsel auf m7g läuft sie ins Leere und wird trotzdem bis zum Laufzeitende bezahlt. Das ist die teuerste Art, Geld sparen zu wollen.

## Prüfungs-Kernsatz

**Savings Plans und Reserved Instances kaufen Rabatt gegen Bindung — ein Kapazitätsversprechen ist beides nicht. Kapazität reserviert nur die zonale Reserved Instance oder eine On-Demand Capacity Reservation.**

## Abgrenzungen

- **Compute SP ↔ EC2 Instance SP:** Der erste ist regions- und familienfrei und deckt zusätzlich Fargate und Lambda; der zweite ist an eine Familie in einer Region gebunden. 66 % gegen 72 %.
- **EC2 Instance SP ↔ Standard RI:** Beide erreichen bis 72 %. Der Savings Plan ist einfacher zu verwalten und etwas flexibler; die RI kann als zonale Variante Kapazität reservieren, der Savings Plan nie.
- **Standard RI ↔ Convertible RI:** Die konvertierbare Variante liegt bei bis zu 66 % — auf demselben Niveau wie Compute Savings Plans — verlangt aber einen manuellen Tauschvorgang, während Savings Plans automatisch greifen.
- **85 ↔ 86 (Cost Explorer, Budgets):** Karte 85 beantwortet „welche Kaufoption", Karte 86 „wie merke ich rechtzeitig, dass die Kosten davonlaufen".

## Klassiker-Fallen

1. **Savings Plan für eine Kapazitätsgarantie halten.** → Häufigste Falle des Themas. Wenn eine Frage „muss die Kapazität in dieser AZ sicher verfügbar sein" enthält, ist die Antwort eine zonale RI oder eine On-Demand Capacity Reservation, kein Savings Plan.
2. **Binden, während umgebaut wird.** → Erst rechtsdimensionieren und migrieren, dann binden. Eine Bindung auf einen Verbrauch, der in sechs Monaten nicht mehr existiert, ist gestrandetes Geld.
3. **Spot für zustandsbehaftete Dienste.** → AWS empfiehlt Spot für zustandslose, fehlertolerante und flexible Anwendungen: Big Data, Container, CI/CD, zustandslose Webserver, HPC, Rendering. Eine Datenbank gehört nicht dazu.
4. **Fargate und Lambda vergessen.** → Der Compute Savings Plan deckt beide mit ab. Wer nur EC2 optimiert, lässt bei containerisierten und serverlosen Lasten Rabatt liegen.

## Faktencheck-Notizen (23.07.2026)

- **Compute SP bis 66 %, gilt auch für Fargate und Lambda** — AWS-Whitepaper „Cost Optimization: Reservation Models", Abschnitt Savings Plans: Compute Savings Plans bieten die größte Flexibilität und senken die Kosten um bis zu 66 %, ausdrücklich „genau wie Convertible RIs". Primärquelle.
- **Bis 72 % für EC2 Instance SP und Standard RI** — AWS-Seite „Reserved Instances Purchase Options / Pricing": Savings Plans bieten bis zu 72 % gegenüber On-Demand; Reserved Instances ebenfalls bis zu 72 %. Primärquelle.
- **Zonale RI liefert Kapazitätsreservierung** — dieselbe AWS-Seite, wörtlich: Reserved Instances, die einer bestimmten Availability Zone zugewiesen sind, liefern eine Kapazitätsreservierung. Primärquelle. Das ist der Beleg für den Kernsatz.
- **Spot bis 90 %, zwei Minuten Vorwarnung** — AWS-Dokumentation „Best practices for Amazon EC2 Spot": bis zu 90 % Ersparnis, der einzige Unterschied zu On-Demand ist die Unterbrechbarkeit mit zwei Minuten Vorlauf. Primärquelle.
- **Rebalance Recommendation** — AWS-Dokumentation „EC2 instance rebalance recommendations": Das Signal kann früher als die Zwei-Minuten-Warnung eintreffen, es ist AWS aber nicht immer möglich, es vorher zu senden — es kann zusammen mit der Warnung ankommen. Die Karte formuliert deshalb „oft früher", nicht „immer früher".
- **Spot-Eignung** — AWS-Dokumentation „Best practices for Amazon EC2 Spot": empfohlen für zustandslose, fehlertolerante, flexible Anwendungen.

### Divergenz Prüfungsstand ↔ Realität: Database Savings Plans

Am **2. Dezember 2025** hat AWS Database Savings Plans angekündigt — bis zu 35 % Ersparnis für eine einjährige Bindung ohne Vorauszahlung, für Aurora, RDS, DynamoDB, ElastiCache, DocumentDB, Neptune, Keyspaces, Timestream und DMS (Quelle: AWS „What's New", 02.12.2025). Die Savings-Plans-FAQ von AWS führt seither **vier** Typen: Compute, EC2 Instance, Database und SageMaker. Der AWS News Blog schlüsselt die Rabatte weiter auf: bis 35 % für Serverless-Bereitstellungen, bis 20 % für provisionierte Instanzen, bei DynamoDB und Keyspaces bis 18 % für On-Demand-Durchsatz und bis 12 % für provisionierte Kapazität. Database Savings Plans und RDS Reserved Instances beziehungsweise reservierte DynamoDB-Kapazität lassen sich für dieselbe Last nicht kombinieren.

**Konsequenz für die Karte:** Die klassische Prüfungsaussage „Savings Plans decken Compute, für Datenbanken gibt es Reserved Instances" ist in der Realität seit Dezember 2025 nicht mehr vollständig. Der SAA-C03-Fragenpool bildet das mit hoher Wahrscheinlichkeit noch nicht ab. Nach Handoff-Regel lehrt die Matrix den **Prüfungsstand** (Zeile 4: Reserved Instances, ausdrücklich so gekennzeichnet), und der Realitätsstand steht als eigener, grau gesetzter Block darunter. Wer in der Prüfung eine Frage nach der günstigsten Option für RDS sieht, antwortet mit Reserved Instances.

### Nicht bestätigt / bewusst weggelassen

- **Der Break-even zwischen Compute SP und EC2 Instance SP** (in Drittquellen mit rund 92 % Auslastung beziffert) steht nicht auf der Karte. Es gibt dafür keine AWS-Primärquelle, und die Zahl hängt vom konkreten Preisverhältnis ab.
- **Convertible Reserved Instances** stehen nur im Abschnitt Abgrenzungen, nicht auf der Karte. Sie hätten eine fünfte Zeile gebraucht und tragen für die Szenarioentscheidung nichts bei.
- **SageMaker Savings Plans** sind für dieses Szenario ohne Belang und nur im Realitätsstand-Block erwähnt.
- **Redshift** ist in Zeile 4 als Beispiel genannt, wird aber von Database Savings Plans nicht abgedeckt — Redshift hat sein eigenes Reservierungsmodell. Das ist beim Prüfungsstand konsistent und bleibt es auch im Realitätsstand.

### Bewusste Vereinfachungen im Diagramm

- „bis X %" sind Höchstwerte, die typischerweise nur bei dreijähriger Bindung mit vollständiger Vorauszahlung erreicht werden. Die Karte zeigt keine Zahlungsoptionen (No Upfront, Partial, All Upfront).
- On-Demand als Referenzpunkt ist nicht als eigene Zeile dargestellt; alle Prozentwerte beziehen sich darauf.
- Die Kombination mehrerer Optionen in einer Landschaft (Compute SP als Basis, darüber EC2 Instance SP, darüber Spot) ist die Praxis, aber nicht gezeichnet — die Matrix beantwortet die Zuordnungsfrage.

### Farbkonventionen dieser Karte

Weitgehend rollenkonform: Navy für die Lastprofile (Struktur), Orange für die drei Compute-Kaufoptionen, Grün für die datenbankbezogene Zeile, Gold für Rabatt und Bindung (Governance), Rot für den verworfenen Pfad.

**Abweichung, bewusst gesetzt und freigegeben:** Der Block zu den Database Savings Plans steht in **Grau**. Der Stil-Guide belegt Grau bisher nicht mit einer Bedeutung; hier steht es für „real gültig, aber außerhalb des Prüfungsstands". Das ist nach der Intensitätsskala auf Karte 80 die zweite Abweichung von der reinen Rollenlogik in diesem Kartenabschnitt. Beide gehören beim Sammelpass gemeinsam entschieden: Entweder wird Grau eine offizielle Konvention für Realitätsstand-Hinweise und wandert in den Stil-Guide, oder beide Karten werden zurückgebaut.
