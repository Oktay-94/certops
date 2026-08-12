---
cardNumber: 67
slug: sagemaker-training-realtime-endpoint-autoscaling
title: "SageMaker Training & Real-time Endpoints — eigenes Modell trainieren und skalierbar betreiben"
services: ["Amazon SageMaker AI", "Application Auto Scaling", "Amazon S3", "Amazon CloudWatch"]
domains: ["D3"]
correctAnswer: "C"
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/deploy-model-options.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/hosting-faqs.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_runtime_InvokeEndpoint.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/serverless-endpoints-invoke.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/async-inference-invoke-endpoint.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/endpoint-auto-scaling-policy.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/endpoint-scaling-loadtest.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/multi-model-endpoints-autoscaling.html"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-sagemaker-endpointconfig-productionvariant.html"
  - "https://docs.aws.amazon.com/en_en/sagemaker/latest/dg/whatis.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/model-monitor-availability-change.html"
  - "https://docs.aws.amazon.com/general/latest/gr/maintenance_services.html"
  - "https://aws.amazon.com/sagemaker/ai/features/"
  - "https://aws.amazon.com/blogs/machine-learning/amazon-sagemaker-inference-launches-faster-auto-scaling-for-generative-ai-models/"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, eine Werkstatt zu betreiben, in der zwei völlig verschiedene Arbeiten anfallen.

**Weg eins:** Du kaufst eine große Fräse und stellst sie in die Halle. Sie steht dort das ganze Jahr. Vier Tage im Quartal fräst sie ein Werkstück, an den übrigen 87 Tagen steht sie und kostet Miete, Strom und Wartung. Daneben steht ein Verkaufstresen, an dem den ganzen Tag Kunden auftauchen — und weil du nur eine Halle hast, hast du für beides denselben Vertrag.

**Weg zwei:** Du trennst die beiden Verträge. Die Fräse mietest du **für die Dauer des Auftrags**; sie wird angeliefert, sie fräst, sie wird abgeholt. Den Verkaufstresen mietest du **dauerhaft**, weil jederzeit jemand kommen kann und niemand warten will.

Das ist die ganze Karte. Der Training Job ist die gemietete Fräse, der Real-time Endpoint ist der Tresen. Beides heißt Amazon SageMaker AI, beides läuft auf ML-Instanzen — aber die Kostenmodelle sind gegensätzlich, und wer sie verwechselt, wundert sich am Monatsende.

**Der Training Job ist ein Kostenpunkt auf Zeit. Der Endpoint ist der Dauerläufer.**

Merke dir schon hier, wo die zweite Falle liegt: Die teure Entscheidung fällt nicht beim Training, sondern beim Endpoint. Eine GPU-Instanz, die vier Stunden trainiert, kostet vier Stunden. Eine falsch dimensionierte Endpoint-Instanz kostet, bis jemand sie abschaltet.

Und noch eine Lesehilfe für das Diagramm, weil sie hier zum ersten Mal konsequent durchgehalten wird: Die Pfeile tragen die Farbe ihres **Ausgangsknotens**, nicht die des Ziels. Pfeil 3 ist grün, weil er von den Modellartefakten kommt; Pfeil 4 ist gold, weil er von der Endpoint Config kommt. Der Blick folgt damit den Rollen und nicht der Leserichtung — wer die Karte einmal so liest, sieht sofort, wo Speicher aufhört und Konfiguration anfängt.

## Was es eigentlich ist — die Endpoint Config

Der Endpoint selbst hat fast keine Eigenschaften. Alles, was ihn ausmacht, steht in einem Konfigurationsobjekt, das du **vorher** anlegst:

```json
{
  "EndpointConfigName": "schaden-bewertung-v3",
  "ProductionVariants": [
    {
      "VariantName": "AllTraffic",
      "ModelName": "schaden-pytorch-2026-08",
      "InstanceType": "ml.m5.xlarge",
      "InitialInstanceCount": 2,
      "InitialVariantWeight": 1.0
    }
  ]
}
```

Lies es von oben nach unten. Wie heißt die Konfiguration (`EndpointConfigName`), welches Model-Objekt wird gehostet (`ModelName`), auf welcher Hardware (`InstanceType`), mit wie vielen Maschinen zum Start (`InitialInstanceCount`), und mit welchem Anteil am Verkehr (`InitialVariantWeight`).

Zwei Beobachtungen, die man leicht überliest.

`ProductionVariants` ist eine **Liste**. Genau daraus entsteht die Fähigkeit, zwei Modellstände parallel hinter einer Adresse zu betreiben und den Verkehr über die Gewichte zu verschieben — A/B-Test und Canary, ohne dass die Anwendung etwas merkt.

Und `InitialInstanceCount` heißt *initial*, nicht *fix*. Die Zahl ist der Startwert. Was danach passiert, entscheidet Auto Scaling — und das ist ein anderer Dienst.

Bemerkenswert ist auch, was in derselben Struktur **nicht** steht: Gibst du statt `InstanceType` und `InitialInstanceCount` ein `ServerlessConfig` mit Speichergröße und maximaler Nebenläufigkeit an, ist aus demselben Objekt ein Serverless-Endpoint geworden. Die Wahl der Betriebsart ist also keine andere API, sondern ein anderes Feld im selben Variantenblock.

## Der Weg durch die Karte

### Kasten — Trainingsdaten S3

Schadensfälle mit Bewertung, dazu die selbst gebaute Feature-Logik des Teams. Die Daten liegen in S3 und bleiben dort. SageMaker AI kopiert sie für die Dauer des Jobs auf die Trainingsinstanz.

### Pfeil 1 — lesen: der Input-Channel

Der Training Job bekommt den S3-Pfad als benannten **Input-Channel** mit. Das ist keine Datenbankverbindung und kein Mount, den jemand pflegt — es ist ein Parameter im Job.

### Kasten — Training Job: der eigene Container

Hier steckt der Grund, warum diese Karte existiert und nicht die Nachbarkarte 66 reicht. Das Team bringt **eigenen PyTorch-Code** in einem eigenen Container mit. Es hat kein AutoML-Problem, es hat ein Modell.

SageMaker AI stellt die Trainingsinstanz **nur für die Laufzeit des Jobs** bereit und fährt sie danach wieder ab. Das Bild dazu: Du mietest die Fräse, sie kommt, sie arbeitet, sie geht. Es gibt keinen Zustand „Trainingsserver läuft gerade nicht" — es gibt ihn schlicht nicht.

### Pfeil 2 — ablegen: `model.tar.gz`

Der Job schreibt sein Ergebnis als Archiv nach S3. Von da an ist das trainierte Modell eine **Datei**, kein Prozess.

### Kasten — Modellartefakte: der billigste Kasten der Karte

Ein paar hundert Megabyte in S3. Verglichen mit allem anderen auf dieser Karte kostet das nichts, und es kostet auch dann nichts, wenn nie wieder jemand darauf zugreift. Das ist der Grund, alte Modellstände aufzuheben statt zu löschen — Rollback ist damit eine Konfigurationsänderung, keine Wiederholung des Trainings.

### Pfeil 3 — anlegen: das Objekt, das nicht gezeichnet ist

Zwischen Artefakt und Endpoint Config liegt formal noch ein Schritt: `CreateModel`. Das Model-Objekt ist die **Klammer aus zwei Dingen** — dem Pfad zum Artefakt und dem Inferenz-Container, der es ausführt.

Die Karte spart diesen Kasten und beschriftet stattdessen den Pfeil mit „anlegen". Wissen sollte man ihn trotzdem, denn in der Praxis sind Trainings- und Inferenz-Container oft **zwei verschiedene Images**: Zum Trainieren brauchst du Optimizer und Datenpipeline, zum Antworten nicht.

### Kasten — Endpoint Config: hier fällt die Dimensionierung

Instanztyp und Startanzahl. **Das ist die Entscheidung, die Geld kostet.**

Wer beim Training zu groß greift, zahlt für Stunden. Wer beim Endpoint zu groß greift, zahlt dauerhaft; wer zu klein greift, liefert zu langsam. Deshalb ist dieser Kasten golden und nicht orange: Er beschreibt, womit gerechnet wird, aber er rechnet nicht selbst.

### Pfeil 4 — erzeugt: warum Config und Endpoint getrennt sind

Die Trennung wirkt wie Bürokratie und ist der Kern des Betriebsmodells. Die Config ist **unveränderlich**. Ein neuer Modellstand bedeutet: neue Config anlegen, dann den bestehenden Endpoint darauf umstellen. SageMaker AI zieht die neue Konfiguration hoch, prüft sie und schwenkt um — die Adresse, die deine Anwendung kennt, bleibt dieselbe.

### Kasten und Pfeil 5 — Real-time Endpoint und die Anwendung

Die Schadensmeldungs-Anwendung ruft per HTTPS auf, der Endpoint antwortet. Gezeichnet ist die Antwort, weil die Karte den Weg des Modells erklärt, nicht den Weg des Requests.

Und hier stehen die zwei Zahlen, die in Prüfungen die Antwort entscheiden: **Payload bis 25 MB, Verarbeitungszeit bis 60 Sekunden.** Bei Streaming-Antworten sind es 8 Minuten. Der Modellcontainer muss innerhalb dieser 60 Sekunden antworten; AWS empfiehlt, den Socket-Timeout des SDK auf 70 Sekunden zu setzen, wenn dein Modell an die Grenze geht.

### Pfeil 6 und Kasten — Auto Scaling: ein fremder Dienst, der von außen wirkt

Application Auto Scaling ist nicht Teil des Endpoints. Es ist ein eigener Dienst, der ihn von außen regelt — deshalb steht der Kasten daneben und nicht im Fluss.

AWS empfiehlt für die meisten Fälle **Target Tracking**: Du nennst eine Metrik und einen Zielwert, Auto Scaling legt die CloudWatch-Alarme selbst an und hält den Wert. Die vordefinierte Metrik heißt `SageMakerVariantInvocationsPerInstance` — die durchschnittliche Zahl der Aufrufe je Instanz und Minute.

Ein Sonderfall lohnt sich zu merken: **Von null aktiven Instanzen hochzuskalieren geht nur mit Step Scaling**, nicht mit Target Tracking.

Zwei weitere Details, die im Betrieb auffallen. Zwischen zwei Skalierungsvorgängen liegen **Cooldown-Zeiten**, damit die Flotte nicht im Minutentakt auf- und abschwingt; sie sind konfigurierbar. Und die Endpoint-Metriken stehen in **Minutengranularität** zur Verfügung — feiner misst CloudWatch hier nicht, was die Untergrenze für die Reaktionszeit setzt.

Betreibst du statt eines Modells viele hinter derselben Adresse — ein Multi-Model Endpoint —, empfiehlt AWS dieselbe Metrik. Sinnvoll ist ein MME bei vielen ähnlich großen Modellen mit ähnlichem Antwortverhalten. Weichen Durchsatz oder Latenzanforderungen stark voneinander ab, rät AWS zu dedizierten Endpoints: Ein selten gefragtes, aber langsames Modell würde sonst die Instanzen der anderen blockieren.

### Die gestrichelte Leiste — Model Monitor

Kein Schritt im Ablauf, sondern eine Prüfungsfalle. Die Lehrbuchantwort auf „wie merke ich, dass mein Modell in Produktion driftet" lautet SageMaker Model Monitor. Genau dieses Feature ist **seit dem 30.07.2026 für Neukunden geschlossen** — der Stichtag liegt inzwischen hinter uns.

Bestandskunden nutzen es unverändert weiter. Als Ersatz nennt AWS die Kombination aus quelloffenen SageMaker-AI-Monitoring-Lösungen, QuickSight und CloudWatch. Betroffen sind neben Model Monitor unter anderem Clarify, Debugger, Ground Truth, Augmented AI, Geospatial, Role Manager und Studio Lab.

**Die Kette dieser Karte ist nicht betroffen.** Training, Inference, Endpoints, Studio und Canvas laufen unverändert.

Und noch eine Unterscheidung, die AWS sauber trennt und Prüfungsfragen gern vermischen: „für Neukunden geschlossen" ist **nicht** „wird abgeschaltet". Für Model Monitor gibt es kein Enddatum. Wie das andere aussieht, zeigt derselbe Produktbereich: SageMaker Ground Truth Plus ist zum 30.06.2026 tatsächlich eingestellt worden.

### Pfeil 7 — Verworfen: Canvas / AutoML

Fachlich möglich, hier aber falsch. Canvas ist der No-Code-Weg für Analysten (Karte 66). Wer ein eigenes Framework und eine eigene Feature-Logik mitbringt, braucht den Training Job. Der Kasten behält seine orange Rollenfarbe; abgelehnt wird über das X, nicht über eine graue Fläche.

## Die entscheidende Unterscheidung

| | Payload | Verarbeitung | Skaliert auf 0 |
|---|---|---|---|
| **Real-time** | bis 25 MB | 60 s (8 min bei Streaming) | nein |
| **Serverless** | bis 4 MB | bis 60 s | ja, mit Cold Start |
| **Asynchronous** | bis 1 GB | bis 1 Stunde | ja |
| **Batch Transform** | Datensätze in GB | Stunden bis Tage | kein Endpoint |

Diese Tabelle beantwortet die meisten Endpoint-Fragen allein. Ein Szenario mit Videodateien und Minuten Rechenzeit ist Asynchronous. Ein Szenario mit „einmal nachts über alle Fälle" ist Batch Transform. Ein Szenario mit „nachts fast keine Last" **klingt** nach Serverless — hier gewinnt Real-time trotzdem, weil morgens niedrige Latenz gefordert ist und Cold Starts das verhindern würden.

## Die ehrliche Feinheit

**Erstens: Die verbreitete Zahl 6 MB ist überholt.** In älterem Kursmaterial — und auf dieser Battle Card — steht als Payload-Grenze für Real-time Inference 6 MB. Die aktuelle AWS-Dokumentation nennt an zwei Stellen übereinstimmend **25 MB**: auf der Übersichtsseite zu den Inference-Optionen und in den Model-Hosting-FAQs. Die 60 Sekunden gelten unverändert. Die Abgrenzung zu Asynchronous Inference verschiebt sich damit: Sie entscheidet sich in der Praxis eher an der **Verarbeitungszeit** als an der Payload-Größe.

**Zweitens: Der Dienst heißt seit dem 3. Dezember 2024 Amazon SageMaker AI.** „Amazon SageMaker" bezeichnet seitdem die größere Plattform — Unified Studio, Lakehouse, Data and AI Governance, SQL Analytics — und SageMaker AI ist der Teil darin, der Modelle baut, trainiert und ausrollt; er ist auch weiterhin eigenständig nutzbar.

Für die Prüfung wichtiger als der Name ist, was sich **nicht** geändert hat: Der API-Namespace `sagemaker` bleibt, die CLI-Kommandos bleiben, Managed Policies mit dem Präfix `AmazonSageMaker` bleiben, CloudFormation-Ressourcen `AWS::SageMaker::…` bleiben, die Service-linked Role `AWSServiceRoleForSageMaker` bleibt, Konsolen- und Doku-URLs bleiben. Eine Antwortoption, die `AWS::SageMaker::EndpointConfig` schreibt, ist also nicht deshalb falsch, weil dort „AI" fehlt.

**Drittens: `InvocationsPerInstance` ist eine Empfehlung mit Verfallsdatum.** Für klassische Modelle ist sie die richtige Metrik. Seit Ende 2024 gibt es zusätzlich nebenläufigkeitsbasierte Metriken, die die tatsächlich gleichzeitig bearbeiteten Anfragen messen und dadurch deutlich schneller auslösen. AWS nennt sie ausdrücklich für generative Modelle, bei denen eine einzelne Anfrage viele Sekunden dauern kann — dort misst „Aufrufe je Minute" die Last zu spät.

**Viertens, zu den Quellen:** Die Liste der zum 30.07.2026 geschlossenen SageMaker-AI-Features ist nicht deckungsgleich. Die Produkt-Feature-Seite führt zehn Einträge einschließlich Profiler, die Maintenance-Tabelle der AWS General Reference führt neun **ohne** Profiler. Deshalb steht auf der Karte keine Zahl, sondern nur Model Monitor als Beispiel.

## Syntax lesen — die Target-Tracking-Policy

```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "InvocationsPerInstance"
  }
}
```

Drei Zeilen, und die Zahl darin ist der einzige Wert, über den man wirklich nachdenken muss.

```
SageMakerVariantInvocationsPerInstance = (MAX_RPS × SAFETY_FACTOR) × 60
                                           │          │              │
                                           │          │              └─ Sekunden → Minute
                                           │          └─ Sicherheitsabschlag, Start bei 0,5
                                           └─ per Lasttest ermittelt, nicht geschätzt
```

Die 70 aus der Doku ist ein **Beispielwert in einer Beispielkonfiguration**, keine Empfehlung. Der richtige Wert hängt am Instanztyp, an der typischen Payload und an deiner Latenzanforderung. AWS beschreibt deshalb ausdrücklich das Vorgehen: Endpoint mit **einer** Instanz aufsetzen, Last hochfahren, bis Antwortzeiten oder Fehlerquote kippen, den so gefundenen Spitzenwert mit dem Sicherheitsfaktor multiplizieren.

Der Faktor 0,5 wirkt großzügig. Er ist es nicht: Zwischen dem Überschreiten des Zielwerts und der zusätzlichen Instanz vergeht Zeit, und in dieser Zeit muss die vorhandene Flotte die Spitze allein tragen.

## Was du dadurch nicht baust

- keine dauerhaft laufende Trainingsinstanz
- kein Betriebssystem, kein Patchen, kein Kapazitätsmanagement der Maschinen
- keinen eigenen Load Balancer und keine eigene Health-Check-Logik
- keinen Skalierungs-Cron und keine selbstgeschriebenen CloudWatch-Alarme
- keine Warteschlange vor dem Modell — die bräuchtest du erst bei Asynchronous Inference
- keine Drift-Überwachung; die steht bewusst gestrichelt daneben

Übrig bleiben: ein Container mit deinem Code, ein Archiv in S3, ein Konfigurationsobjekt und eine HTTPS-Adresse.

## Wenn du dir eine Sache merkst

**Training Job = Rechenzeit auf Abruf. Endpoint = Dauerbetrieb, kostet auch ohne Last.**

Serverless Inference wäre der Kandidat für „nachts nichts los", scheitert hier an den Cold Starts zur Morgenspitze. Batch Transform braucht gar keinen stehenden Endpoint, kann aber nicht antworten, während ein Sachbearbeiter den Schaden anlegt. Und Canvas nimmt dir das Modellieren ab — aber dieses Team will es gar nicht abgeben.

## Prüfungsknackpunkte

**Signalwörter:** „custom training code", „own container", „bring your own model" — das ist der Training Job, nicht AutoML. „Traffic spikes", „scale the endpoint automatically" — das ist Application Auto Scaling mit Target Tracking.

**Die Kostenfalle.** Fragen nach unerwartet hohen ML-Kosten meinen fast immer den Endpoint, nicht das Training. Ein vergessener Endpoint läuft, bis ihn jemand löscht.

**Die Metrik-Falle.** `CPUUtilization` ist als Skalierungsmetrik möglich, aber wenn nach der **empfohlenen** vordefinierten Metrik gefragt wird, ist die Antwort `InvocationsPerInstance`.

**Die Hochverfügbarkeitsfalle.** Ein Produktions-Endpoint mit genau einer Instanz ist in jedem HA-Szenario die falsche Antwort — mehrere Instanzen, verteilt über Availability Zones.

**A — Eine EC2-GPU-Instanz, die Training und Inferenz übernimmt:** funktioniert, zahlt aber die Trainingshardware rund um die Uhr und bringt Patchen und Skalierung zurück.

**B — SageMaker Canvas:** No-Code über AutoML, passt nicht zu einem Team mit eigenem PyTorch-Code und eigener Feature-Logik.

**D — Asynchronous Inference:** richtig bei großen Payloads oder langer Verarbeitung, hier aber unnötig — der Sachbearbeiter wartet auf die Antwort.

**E — Batch Transform, nächtlich über alle offenen Schäden:** günstig und ohne stehenden Endpoint, beantwortet aber nicht die Anforderung „in Echtzeit beim Anlegen des Schadens".
