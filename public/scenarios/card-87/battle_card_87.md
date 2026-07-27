---
nr: 87
title: "Compute Optimizer, Rightsizing"
services: ["AWS Compute Optimizer", "Amazon CloudWatch", "Amazon EC2", "AWS Cost Explorer", "AWS Savings Plans", "AWS Graviton"]
domains: ["D4", "D3"]
signalwords:
  - "instances are over-provisioned"
  - "right-size the fleet"
  - "reduce cost without impacting performance"
  - "identify idle or oversized resources"
  - "before committing to a Savings Plan"
assets:
  - battle_card_87.svg
  - battle_card_87.png
  - battle_card_87.pdf
status_note: |
  qc.py: 0 Befunde. 6 Boxen (5 Karten-Boxen + Footer-Rect), 24 Texte, 14 Segmente,
  3 Badges, 1 X-Kreis.
  Segmentaufschluesselung (R5): 8 echte Segmente = 3 gerade Kettenpfeile + 3 Segmente
  des roten Bypass + 2 X-Diagonalen; dazu 6 Phantom-Segmente aus 3 Marker-<defs>
  (mblau, mgold, mrot, je 2). Nur 3 Markerfarben, weil zwei Kettenpfeile dieselbe
  goldene Marker-ID teilen.
  Korrekturrunden: 1 Runde, gefunden NACH dem Zeichnen. zones.py meldete 8 Tintenpixel
  bei y ~ 86 im Untertitelband. Ursache war das grosse "Ü" am Zeilenanfang des
  Untertitels: die Umlautpunkte ragen ueber die text_bbox-Heuristik (0,80 x
  Schriftgroesse) hinaus, die qc.py und zones.py verwenden. Behoben durch
  Umformulierung des Untertitels, nicht durch Aufweichen des Pruefwerkzeugs.
  Render-Sanity: PNG 2400x1350, Titelband-Kanaldivergenz 0.
  R13 (reine Schwarzpixel): 0.
  R12-Gegencheck: 0 Verstoesse.
  R16: 18.0 px, Label "Rightsizing zuerst — dann erst binden". Grenze ist 9 px.
  Footer-Breite von Hand gemessen: 1097 px (Grenze 1420 px).
  Sichtprüfung: erteilt am 27.07.2026 durch Oktay, lokal im Browser an der gerenderten Seite.
---

# Battle Card 87 — Compute Optimizer, Rightsizing

## Szenario

Eine Flotte aus 40 `m5.4xlarge` laeuft seit einem Jahr bei durchschnittlich 8 Prozent
CPU-Last. Das Finance-Team draengt auf Savings Plans, weil der Rabatt bis zu 72 Prozent
verspricht. Die Karte zeigt, warum genau diese Reihenfolge falsch ist.

## Ablauf

**1 — CloudWatch liefert die Messgrundlage.** Compute Optimizer liest die
CloudWatch-Metriken der laufenden Ressourcen. Fuer EC2-Instanzen und Auto Scaling
Groups braucht er mindestens 30 Stunden Metrikdaten aus den letzten 14 Tagen.
Zwei Voraussetzungen sind pruefungsrelevant: **Memory** ist keine
Standard-EC2-Metrik — ohne installierten CloudWatch-Agent sieht Compute Optimizer
den Speicherverbrauch nicht. Und **Cost Explorer muss aktiviert sein**, sonst kann
der Dienst keine Sparbetraege ausweisen.

**2 — Compute Optimizer klassifiziert.** Das Ergebnis ist ein Befund je Ressource:
over-provisioned, under-provisioned oder optimized. Wer monatliche oder quartalsweise
Lastmuster hat, aktiviert Enhanced Infrastructure Metrics — ein kostenpflichtiges
Feature, das den Analysezeitraum von 14 auf bis zu 93 Tage verlaengert.

**3 — Die Instanz wird verkleinert.** Entweder ein kleinerer Typ derselben Familie
oder ein Wechsel auf Graviton. Wichtig fuer den naechsten Schritt: Die Baseline sinkt
damit **dauerhaft** — das ist die Zahl, auf die spaeter das Commitment gebaut wird.

**4 — Erst jetzt wird gebunden.** Der Savings Plan laeuft auf die neue, kleinere
Baseline, ueber ein oder drei Jahre. Der Rabatt greift auf einer Flotte, die die
Last tatsaechlich braucht.

**Verworfener Pfad** — die Abkuerzung von Schritt 1 direkt zum Kauf: Ein Savings Plan
auf die Ist-Flotte bindet 40 zu grosse Instanzen fuer ein bis drei Jahre. Der Rabatt
gilt dann fuer Kapazitaet, die niemand nutzt; die Rightsizing-Ersparnis ist verspielt,
solange das Commitment laeuft.

## Pruefungs-Kernsatz

Rightsizing kommt vor Commitment. Und Rightsizing ohne Memory-Metrik ist Raten mit
statistischer Verzierung.

## Abgrenzungen

- **Gegen Karte 85 (Kaufoptionen):** Karte 85 endet bei "welche Option passt" und hat
  die Falle "erst rechtsdimensionieren, dann binden" bereits gesetzt. Diese Karte
  liefert den technischen Schritt, der davor liegt. Der Uebergang zwischen beiden
  Karten *ist* die Reihenfolge.
- **Gegen Karte 86 (Anomalien):** Overprovisioning ist ein Dauerzustand, keine
  Anomalie. Cost Anomaly Detection findet es nicht — die Kosten sind ja stabil, nur
  eben stabil zu hoch.
- **Gegen Auto Scaling:** Auto Scaling passt die *Anzahl* an, Rightsizing die *Groesse*
  der einzelnen Instanz. Beides zusammen ist der Regelfall.

## Klassiker-Fallen

- **Savings Plan vor Rightsizing.** Der verworfene Pfad dieser Karte.
- **CPU-only-Empfehlung uebernehmen.** Ohne CloudWatch-Agent kennt Compute Optimizer
  keinen Memory-Verbrauch. Eine speicherhungrige JVM landet dann auf einer Instanz,
  die rechnerisch passt und praktisch swappt.
- **Compute Optimizer ohne Opt-in erwarten.** Der Dienst muss aktiviert werden, und
  die Analyse braucht anschliessend bis zu 24 Stunden.
- **Monatliche Lastspitzen uebersehen.** Der Standard-Lookback sind 14 Tage. Ein
  Monatsabschluss-Job faellt da systematisch heraus.

## Faktencheck-Notizen

- *30 Stunden Metrikdaten in 14 Tagen, 93 Tage mit Enhanced Infrastructure Metrics:*
  AWS Compute Optimizer User Guide, "Resource requirements" (`requirements.html`).
- *Cost Explorer muss aktiviert sein, damit Sparbetraege berechnet werden:* dieselbe
  Seite. Sie empfiehlt zusaetzlich das Opt-in fuer Cost Optimization Hub, damit
  bestehende Reserved Instances und Savings Plans in die Empfehlung einfliessen.
- *Enhanced Infrastructure Metrics ist kostenpflichtig und gilt fuer EC2, Instanzen in
  Auto Scaling Groups und RDS-DB-Instanzen:* AWS Compute Optimizer User Guide,
  "Enhanced infrastructure metrics".
- *Memory-Metrik nur mit CloudWatch-Agent:* AWS Compute Optimizer User Guide,
  "EC2 instance metrics" (`ec2-metrics-analyzed.html`) sowie API Reference,
  `ProjectedMetric`.
- *Analyse dauert bis zu 24 Stunden, Standard-Lookback 14 Tage:* AWS Compute Optimizer
  User Guide, "Metrics analyzed by AWS Compute Optimizer".
- *Alternative Memory-Quelle:* Externe Metriken aus Datadog, Dynatrace, Instana oder
  New Relic koennen eingespeist werden — AWS Compute Optimizer User Guide,
  "External metrics ingestion". Steht bewusst nicht auf dem Diagramm.

### Namenskonflikt in der AWS-Doku

Die Hauptdokumentation auf `docs.aws.amazon.com` schreibt durchgehend **AWS** Compute
Optimizer, die China-Dokumentation auf `docs.amazonaws.cn` an mehreren Stellen
**Amazon** Compute Optimizer. Die Karte folgt der Hauptdokumentation, weil die Pruefung
sich daran orientiert.

## Nicht bestaetigt / bewusst weggelassen

- **Preis der Enhanced Infrastructure Metrics** (kursiert als rund 0,25 US-Dollar je
  Ressource und Monat): nur in Drittquellen gefunden, nicht auf der AWS-Preisseite
  gegengeprueft. Weggelassen.
- **Vollstaendige Liste der unterstuetzten Ressourcentypen** (neben EC2, ASG, EBS,
  Lambda, ECS on Fargate und RDS nennen Drittquellen auch NAT Gateway, DynamoDB,
  ElastiCache, MemoryDB, DocumentDB, WorkSpaces und SageMaker): einzeln nicht
  gegengeprueft, deshalb keine Liste auf der Karte.
- **Konkrete Ersparnis-Prozentwerte** fuer Graviton oder SQL-Server-Lizenzen:
  weggelassen.
- **Idle-Resource-Empfehlungen** als eigene Kategorie: nicht auf der Karte, weil sie
  den Ablauf nicht aendert.

## Bewusste Vereinfachungen im Diagramm

- Die Kette suggeriert einen einmaligen Durchlauf. In der Praxis ist Rightsizing ein
  wiederkehrender Vorgang.
- "Instanz verkleinert" fasst Typwechsel und Graviton-Migration zusammen, obwohl
  letztere einen Rebuild des Images voraussetzen kann.
- Der verworfene Pfad zweigt bei Schritt 1 ab. Real kauft man Savings Plans ohne
  jeden Blick auf Metriken — die Abzweigung ist also grosszuegig gezeichnet.
- Die Karte nennt keine konkreten Instanzgroessen im Diagramm, um nicht suggerieren
  zu wollen, dass eine bestimmte Verkleinerung "die richtige" ist.

## Farbkonventionen dieser Karte

Rollenpalette unveraendert:

- **Blau (Quelle):** CloudWatch-Metriken als Datengrundlage.
- **Gold (Governance):** Compute Optimizer und der Savings Plan — beide sind
  Steuerungsentscheidungen ueber die Infrastruktur, nicht die Infrastruktur selbst.
- **Orange (Compute):** die verkleinerte Instanz, also das einzige Element, das
  tatsaechlich Rechenleistung darstellt.
- **Rot:** nur der Bypass mit X-Kreis und das zugehoerige Label. Die verworfene Box
  bleibt Gold, weil auch der falsche Kauf eine Governance-Entscheidung ist.
- Die gestrichelte Zone traegt kein Rollen-, sondern nur ein Strukturgrau.
