---
cardNumber: 66
slug: sagemaker-canvas-timeseries-forecast-nachfolge
title: "SageMaker Canvas (Time Series Forecasting) — Absatzprognose für Filial-Nachschub"
services: ["Amazon SageMaker Canvas", "Amazon SageMaker AI", "Amazon S3", "Amazon Forecast"]
domains: ["D3"]
correctAnswer: "B"
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/general/latest/gr/maintenance_services.html"
  - "https://aws.amazon.com/blogs/machine-learning/transition-your-amazon-forecast-usage-to-amazon-sagemaker-canvas/"
  - "https://docs.aws.amazon.com/forecast/latest/dg/retail-domain.html"
  - "https://docs.aws.amazon.com/forecast/latest/dg/related-time-series-datasets.html"
  - "https://docs.aws.amazon.com/forecast/latest/dg/item-metadata-datasets.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/canvas-time-series.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/timeseries-forecasting-algorithms.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/autopilot-create-experiment-timeseries-forecasting.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_TimeSeriesForecastingJobConfig.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_TimeSeriesConfig.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/06/amazon-sagemaker-canvas-capabilities-time-forecasting-models"
  - "https://aws.amazon.com/sagemaker/ai/features/"
---

## Die Grundidee zuerst

Stell dir zwei Werkstätten vor, in denen **dieselben sechs Werkzeuge** an der Wand hängen.

**Werkstatt eins** ist die Spezialwerkstatt. Sie ist für genau eine Arbeit gebaut, und sie ist gut darin. An ihrer Tür hängt seit dem **29. Juli 2024** ein Schild: *Keine neuen Kunden.* Wer vorher einen Schlüssel bekommen hat, arbeitet unverändert weiter — Strom, Heizung und Schlösser werden gewartet. Nur eingerichtet wird nichts mehr, und ausgegeben werden auch keine Schlüssel mehr.

**Werkstatt zwei** ist die große Halle nebenan. Dieselben sechs Werkzeuge hängen dort an der Wand. Aber das Material muss anders angeliefert werden: Wo die Spezialwerkstatt drei getrennte Materialstapel erwartete, nimmt die große Halle nur **einen einzigen**.

Werkstatt eins ist Amazon Forecast. Werkstatt zwei ist Amazon SageMaker Canvas.

Das ist die ganze Karte, und sie beantwortet die Frage, die man bei so einem Szenario zuerst stellt: Ist der Nachfolger schlechter? Nein. Er rechnet mit denselben Algorithmen. Die Arbeit steckt nicht im Modellieren, sondern im **Umbau der Datenablage**.

Bevor es losgeht, ein Wort zum Schild an der Tür, weil dieses Wort auf mehreren Karten wiederkommt. AWS führt drei Lebenszyklus-Stufen: **Maintenance** heißt, es gibt kein Onboarding mehr, Bestandsnutzung läuft weiter, Betrieb und Support bleiben, neue Funktionen kommen nicht. **Sunset** heißt, ein Enddatum ist angekündigt. **End of Support** heißt, es ist vorbei. Amazon Forecast steht seit dem 29.07.2024 auf der ersten Liste — und nur dort. Ein Abschaltdatum ist bis heute, über zwei Jahre später, nicht angekündigt.

## Was es eigentlich ist — der eine Datensatz

Kein Dienst, den du buchst. Eine **Spaltenzuordnung**, die du einmal angibst und die den Rest erklärt:

```json
{
  "TimeSeriesForecastingJobConfig": {
    "ForecastFrequency": "1W",
    "ForecastHorizon": 12,
    "ForecastQuantiles": ["p10", "p50", "p90"],
    "TimeSeriesConfig": {
      "ItemIdentifierAttributeName": "artikel_id",
      "TargetAttributeName": "menge",
      "TimestampAttributeName": "datum",
      "GroupingAttributeNames": ["filiale"]
    },
    "HolidayConfig": [{ "CountryCode": "DE" }]
  }
}
```

Lies das von unten nach oben, dann ergibt es eine Frage: *Sag voraus, welche `menge` je `artikel_id` und `filiale` an welchem `datum` verkauft wird — wöchentlich, zwölf Wochen weit, mit deutschem Feiertagskalender.*

Drei Felder in `TimeSeriesConfig` sind Pflicht: Item-ID, Zielspalte, Zeitstempel. Alles andere ist Zubehör. Genau diese drei sind auch das, was die Canvas-Oberfläche abfragt, wenn man den Weg ohne Code geht — die UI und die AutoML-API sind derselbe Motor mit zwei Bedienpulten.

## Der Weg durch die Karte

### Kasten — Kassendaten S3: drei Dateien, die eine Geschichte erzählen

Verkaufshistorie, Preisaktionen, Filialstammdaten. Diese Dreiteilung ist kein Zufall des Szenarios, sie ist ein **Fingerabdruck**: Sie entspricht exakt den drei Datensatztypen, die Amazon Forecast erwartet.

Wer eine Aufgabe liest, in der Daten genau so vorbereitet sind, sieht in Wahrheit eine Forecast-Installation — oder ein Kursmaterial von vor Mitte 2024.

### Pfeil 1 — 3 Dateien: warum es genau diese drei waren

Bei Forecast hält eine Dataset Group bis zu drei Datensätze, einen je Typ:

- **Target time series** — Pflicht. In der RETAIL-Domäne sind das `item_id`, `timestamp` und `demand`. Das ist die Zeitreihe, die vorhergesagt wird.
- **Related time series** — optional. Preis, Aktion, Wetter. Bis zu zehn Prognosedimensionen und bis zu 13 Merkmale, und die Zielgröße darf hier **nicht** noch einmal auftauchen.
- **Item metadata** — optional und statisch. Farbe, Marke, Kategorie.

Der letzte Punkt ist der, den Kurse gern verschweigen: Item metadata wird bei Forecast **nur von CNN-QR und DeepAR+** überhaupt ausgewertet. Sie dient dort vor allem dem Kaltstart — für einen Artikel ohne Historie sucht Forecast über die Metadaten die nächsten Nachbarn und leitet daraus eine Prognose ab.

### Kasten — Canvas Data Flow: hier liegt der eigentliche Migrationsaufwand

Canvas verlangt **einen** Datensatz. Timestamp-Spalte, Item-ID-Spalte, Zielspalte, alles in einer flachen Tabelle. Aus drei Dateien wird ein Join.

Der Data Flow ist die Drag-and-drop-Oberfläche, die diesen Join ohne Code erledigt; ein Python-Skript täte es genauso. Er ist auf der Karte als eigener Knoten gezeichnet, obwohl er zur Canvas-Anwendung gehört — didaktisch, weil dieser Schritt der ist, den alle unterschätzen.

**Der Aufwand der Migration steckt nicht im Modell. Er steckt in der Zeile, die aus drei Tabellen eine macht.**

Zum Join gehört eine zweite, unscheinbare Entscheidung: Was passiert mit Lücken? Ein Artikel, der in einer Filiale eine Woche lang nicht verkauft wurde, hat für diese Woche keine Zeile. Ist das eine Null oder ein fehlender Wert? Die AutoML-Konfiguration kennt dafür ausdrücklich Füllstrategien — `middlefill` für Lücken innerhalb der Historie, `backfill` für den Anfang, `futurefill` für erklärende Spalten im Prognosezeitraum. Wer sie ignoriert, lässt den Standard entscheiden und wundert sich später über Prognosen, die für Ladenhüter zu hoch liegen.

### Pfeil 2 — 1 Dataset: die Zahl, die die Antwort verrät

Von drei auf eins. Wenn eine Prüfungsfrage die Formulierung „target time series, related time series und item metadata" enthält, ist sie an Forecast gebaut. Steht dort „ein Datensatz mit Zeitstempel-, Artikel- und Mengenspalte", ist es Canvas.

### Kasten — Canvas AutoML: sechs Algorithmen, ein Leaderboard

Canvas trainiert **sechs eingebaute Algorithmen** auf deiner Zeitreihe und kombiniert sie per Stacking-Ensemble zu einem Modell: CNN-QR, DeepAR+, Prophet, NPTS, ARIMA und ETS.

Diese Liste ist wörtlich dieselbe wie bei Amazon Forecast. Genau deshalb ist der Wechsel keine Qualitätsfrage — es sind dieselben Klingen an einer anderen Wand.

Es lohnt sich, sie einmal einzuordnen, weil daran hängt, warum ein Ensemble überhaupt besser ist als ein einzelnes Modell:

- **CNN-QR** und **DeepAR+** sind neuronale Verfahren, die über *viele* Zeitreihen gemeinsam lernen. Sie brauchen große Datenbestände mit hunderten Reihen — 180 Filialen mal einige tausend Artikel sind genau das.
- **Prophet** ist ein lokales Modell und stark, wenn es klare Saisonalitäten über mehrere Jahre gibt. Weihnachtsgeschäft, Grillsaison, Schulanfang.
- **NPTS** ist der Sparsamkeitsfall: Es zieht Stichproben aus der Vergangenheit und ist besonders nützlich bei **dünn besetzten oder sprunghaften** Reihen. Der Artikel, der in einer Filiale dreimal im Quartal verkauft wird, ist ein NPTS-Fall.
- **ARIMA** und **ETS** sind die klassischen statistischen Verfahren. ARIMA ist laut AWS besonders für einfache Datensätze mit unter 100 Zeitreihen geeignet.

Die Mischung ist der Punkt: Ein Sortiment enthält gleichzeitig Schnelldreher und Langsamdreher. Kein einzelner Algorithmus ist für beide der beste.

Seit Juni 2024 zeigt Canvas diese Kandidaten in einem **Leaderboard** mit ihren Metriken, lässt dich einzelne Algorithmen ab- oder anwählen und das gewählte Modell direkt ausrollen. Jeder Kandidat liefert eine **probabilistische** Prognose über Quantile; ohne Angabe rechnet AWS mit p10, p50 und p90.

### Pfeil 4 und Kasten — Modellartefakte: was liegen bleibt

Canvas legt trainierte Modelle, Datasets und Anwendungsdaten in einem konfigurierbaren S3-Bucket ab. Der Kasten ist grün und ein Endpunkt, kein Durchgangsknoten: Hier liegt etwas und bleibt liegen.

### Pfeil 3 und Kasten — Real-time Endpoint: der zweite große Unterschied

Bei Forecast war die Abfrage **zweistufig**: erst einen Forecast erzeugen, dann ihn abfragen. Zwei Objekte, zwei Schritte, und dazwischen eine Wartezeit.

Canvas deployt das gewählte Modell auf einen SageMaker-Endpoint. Die Anwendung ruft per HTTPS auf und bekommt die Antwort. **Kein Forecast-Objekt, das vorher existieren müsste.**

Der Preis dafür steht nicht auf der Karte, gehört aber zur ehrlichen Betrachtung: Ein Real-time Endpoint läuft dauerhaft und kostet auch nachts, wenn keine Filiale etwas abfragt. Für eine **wöchentliche** Absatzprognose ist das eine Entscheidung, die man treffen muss und nicht einfach mitnimmt. Wer wirklich nur einmal pro Woche rechnet, wäre mit einem Batch-Lauf besser bedient — die Aufgabe verlangt hier aber ausdrücklich, dass die Warenwirtschaft die Zahlen selbst abruft.

### Pfeil 5 und Kasten — Warenwirtschaft: Auslöser, nicht Ziel

Der Pfeil zeigt auf die Warenwirtschaft, aber sie ist blau wie eine Quelle. Das ist bewusst: Sie ist der **Auslöser** des Aufrufs. Fachlich endet der Datenfluss im Endpoint; gezeichnet ist die Antwort, weil die Karte den Weg der Prognose erklärt und nicht den Weg des Requests.

### Kasten ohne Linie — SageMaker Domain

Die Domain hängt ohne Verbindung im Bild, und das ist richtig so. Sie ist die **Voraussetzung** für Canvas, kein Schritt im Datenfluss. Ohne Domain und ohne Execution Role gibt es kein Canvas — und wenn der Zugriff auf den S3-Bucket scheitert, liegt es fast immer an dieser Rolle. Eine Linie hätte suggeriert, die Daten liefen durch sie hindurch.

Das ist auch die Form, in der dieser Kasten in Prüfungsfragen auftaucht: nicht als „welchen Dienst brauche ich", sondern als Fehlerbild. „Der Analyst kann das Dataset nicht importieren, obwohl der Bucket existiert" ist eine Frage nach der Execution Role, nicht nach Canvas. Und weil die Domain zugleich Nutzerprofile, Netzwerkanbindung und Verschlüsselung trägt, ist sie golden gezeichnet: Sie regelt, sie rechnet nicht.

### Pfeil 6 — Verworfen: Amazon Forecast

Fachlich wäre Forecast die naheliegende Antwort. Der Zugang ist geschlossen. Der Pfeil endet im X, und darunter steht das Datum, weil das Datum die Antwort trägt.

## Die entscheidende Unterscheidung

| | Amazon Forecast | SageMaker Canvas |
|---|---|---|
| Zugang | seit 29.07.2024 keine Neukunden | offen |
| Datensätze | bis zu **drei** je Dataset Group | **einer**, flach |
| Algorithmen | dieselben sechs | dieselben sechs |
| Abruf | Forecast erzeugen, **dann** abfragen | Endpoint aufrufen |
| Voraussetzung | Forecast-Ressourcen | SageMaker Domain + Execution Role |
| Kaltstart über Metadaten | eingebaut (CNN-QR, DeepAR+) | über zusätzliche Spalten im einen Datensatz |

## Die ehrliche Feinheit

**Wartungsmodus ist keine Abschaltung, und der Unterschied ist prüfungsrelevant.**

Für Amazon Forecast gibt es kein angekündigtes Abschaltdatum. In der AWS-Doku steht: Bestandskunden nutzen den Dienst normal weiter, AWS investiert weiter in Security, Verfügbarkeit und Performance, führt aber keine neuen Funktionen ein. Wie anders das aussehen kann, zeigt derselbe Bereich: **SageMaker Ground Truth Plus ist zum 30.06.2026 tatsächlich eingestellt** — nicht geschlossen, beendet. Zwei Kategorien, zwei Konsequenzen.

Daraus folgt eine Falle in **beide** Richtungen. Bei einem Neubau-Szenario ist Forecast die falsche Antwort. Bei einem Szenario, das ausdrücklich einen Bestandskunden mit laufenden Forecast-Predictors beschreibt, ist Forecast weiterhin korrekt — und „migrieren Sie sofort" wäre die falsche Empfehlung.

Zweite Feinheit, die in Kursmaterial oft fehlt: Dass ein Canvas-**Zeitreihenmodell** direkt auf einen Real-time Endpoint ausgerollt werden kann, ist eine vergleichsweise junge Fähigkeit. Sie kam im Juni 2024 zusammen mit Algorithmenauswahl und Leaderboard. Ältere Darstellungen zeigen Canvas noch als reine Analyse-Oberfläche, aus der man Prognosen exportiert.

Dritte Feinheit, und für Nachschubplanung die wichtigste: Die Prognose ist **kein einzelner Wert**. Sie ist eine Verteilung, aus der du Quantile abfragst. Wer p50 nimmt, plant so, dass die Menge in der Hälfte der Fälle nicht reicht. Wer p90 nimmt, kauft Sicherheit mit Lagerbestand. Diese Entscheidung ist betriebswirtschaftlich, nicht technisch — und sie ist der Grund, warum bis zu fünf Quantile gleichzeitig angefordert werden können.

Vierte Feinheit: Die Karte nennt bewusst keine Leistungszahlen. Im Transitions-Blog stehen Angaben zu schnellerem Model Building und schnelleren Predictions, aber es sind AWS-eigene Benchmarks über nicht benannte Datensätze. Benchmarkwerte sind kein Prüfungsstoff und ändern sich.

## Syntax lesen — `ForecastFrequency` und die flache Tabelle

Zwei Dinge muss man auf dieser Karte entziffern. Erstens das Frequenzkürzel:

```
"1W"        "15min"      "1D"        "1Y"
 │ │          │  │        │ │         │ │
 │ └─ Einheit │  └─ min   │ └─ Tag    │ └─ Jahr
 └─ Anzahl    └─ Anzahl   └─ 1        └─ nur 1 erlaubt

  Y: nur 1   ·  M: 1–11  ·  W: 1–4  ·  D: 1–6  ·  H: 1–23  ·  min: 1–59
```

Die Regel dahinter ist die interessante: Eine Frequenz darf sich **nicht mit der nächstgrößeren überschneiden**. `60min` ist ungültig, weil es `1H` gibt. `7D` ist ungültig, weil es `1W` gibt. Wer das nicht weiß, sucht den Fehler in den Daten statt in einer Zeichenkette.

Zweitens das Tabellenformat. Canvas will eine flache Datei, keine Kreuztabelle:

```
datum       artikel_id  filiale  menge  preis  aktion
2026-06-01  A-4711      F-012     128   24.20  0
2026-06-08  A-4711      F-012      96   19.90  1
```

Der Zeitstempel muss ein vom Dienst akzeptiertes Format haben — `YYYY-MM-DD`, `YYYY-MM-DD HH:MM:SS`, `DD.MM.YYYY` ist **nicht** darunter. Und die Zielspalte endet am Ende der Historie, während erklärende Spalten wie `preis` ruhig in den Prognosezeitraum hineinreichen dürfen.

## Was du dadurch nicht baust

- keinen Predictor und keinen Forecast als eigene Objekte
- keine drei Dataset-Importe und keine Dataset Group
- kein Trainingsskript und keinen eigenen Container
- keine Algorithmenauswahl von Hand, wenn du es nicht willst
- keinen Abfrage-Zwischenschritt zwischen Anwendung und Prognose
- kein Kaufsignal an einen Dienst, den du gar nicht mehr bestellen könntest

Übrig bleiben: eine flache Tabelle, ein AutoML-Lauf, ein Endpoint.

Und eines fehlt bewusst in der Aufzählung, weil es die Karte nicht zeigt: Es entsteht **kein Rückkanal**. Weder Canvas noch der Endpoint erfahren, wie gut die Prognose tatsächlich war. Wer die Treffgenauigkeit über die Zeit beobachten will, baut das selbst — mit den Ist-Zahlen aus der Warenwirtschaft und einem regelmäßigen Vergleich gegen die abgerufenen Quantile.

## Wenn du dir eine Sache merkst

**Forecast: drei Datasets, erst erzeugen, dann abfragen. Canvas: ein Dataset, Endpoint aufrufen.**

Ein eigenes Modell in SageMaker AI zu trainieren wäre möglich, verlangt aber genau das ML-Wissen, das das Team laut Aufgabe nicht hat. QuickSight kann Prognosen zeichnen, aber die Warenwirtschaft nicht automatisiert beliefern. Und Amazon Forecast ist nicht falsch, weil es schlechter wäre — es ist falsch, weil die Tür zu ist.

## Prüfungsknackpunkte

**Signalwörter:** „no ML expertise", „no-code", „demand forecasting for replenishment" — das ist Canvas. „Die Anwendung soll die Prognose direkt abrufen" — das ist ein Real-time Endpoint, kein Forecast-Objekt. „Closed to new customers" — das ist der Prüfstein, ob du den Statuswechsel kennst.

**Die Kursmaterial-Falle.** In jedem Trainingsmaterial von vor Mitte 2024 ist Amazon Forecast die Standardantwort auf „demand forecasting". Prüfe bei jeder Frage zuerst, ob das Szenario ein **neues** Projekt beschreibt.

**Die Datensatz-Falle.** Drei genannte Datensatztypen sind ein Forecast-Signal, kein Canvas-Signal. Wer migriert, muss zusammenführen — das ist Arbeit, kein Automatismus.

**Die Endpoint-Falle.** Ein Real-time Endpoint kostet auch dann, wenn eine Woche lang niemand eine Prognose abruft. Bei einem wöchentlichen Planungslauf ist das eine bewusste Entscheidung für Bequemlichkeit — und ein Szenario, das ausdrücklich nach möglichst geringen laufenden Kosten fragt, meint dann eher einen Batch-Lauf als einen stehenden Endpoint.

**A — Amazon Forecast mit AutoPredictor:** fachlich passend, für ein neues Projekt aber nicht mehr zugänglich.

**C — Ein eigenes Modell mit einem SageMaker-AI-Training-Job:** möglich, verlangt aber eigenen Trainingscode und widerspricht „Analystenteam ohne ML-Erfahrung".

**D — QuickSight-Prognosefunktion auf den Kassendaten:** liefert eine Kurve im Dashboard, aber keine Schnittstelle, die die Warenwirtschaft automatisiert abfragen kann.

**E — Batch-Transform-Job, der nächtlich alle Artikel durchrechnet:** legitim, wenn nur ein Tageslauf gefragt wäre — hier verlangt die Aufgabe aber einen Abruf je Artikel und Filiale aus der Anwendung heraus.
