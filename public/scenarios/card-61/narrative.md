---
cardNumber: 61
slug: rekognition-a2i-bildmoderation-marktplatz
title: "Bildmoderation im Marktplatz — Rekognition, Lambda, S3, A2I"
services: ["Amazon Rekognition", "AWS Lambda", "Amazon S3", "Amazon Augmented AI (A2I)"]
domains: ["D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/rekognition/latest/APIReference/API_DetectModerationLabels.html"
  - "https://docs.aws.amazon.com/rekognition/latest/APIReference/API_ModerationLabel.html"
  - "https://docs.aws.amazon.com/rekognition/latest/dg/rekognition-availability-changes.html"
  - "https://docs.aws.amazon.com/rekognition/latest/dg/document-history.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-use-augmented-ai-a2i-human-review-loops.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-getting-started-core-components.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-api-references.html"
  - "https://docs.aws.amazon.com/sagemaker/latest/dg/a2i-json-humantaskactivationconditions-rekognition-example.html"
  - "https://aws.amazon.com/about-aws/whats-new/2026/06/aws-service-availability/"
  - "https://aws.amazon.com/about-aws/whats-new/2024/10/aws-lambda-detects-stops-recursive-loops-lambda-s3/"
  - "https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-lambda-eventinvokeconfig.html"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, Koffer am Flughafen zu prüfen.

**Weg eins:** Jeder Koffer wird geöffnet und von Hand durchsucht. Das ist gründlich und es funktioniert — bei zwölf Passagieren. Bei zwölftausend braucht es entweder eine Halle voller Personal oder eine Schlange, die bis zum Parkhaus reicht. Das ist Bildmoderation, bei der ein Mensch jedes hochgeladene Foto anschaut.

**Weg zwei:** Ein Röntgengerät. Die allermeisten Koffer laufen durch, ohne dass jemand hinsieht. Ein paar landen auf einem Nebenband, weil das Bild unklar war — und **nur diese** öffnet ein Mensch. Niemand baut deshalb ein eigenes Röntgengerät; man stellt eines auf, das es schon gibt.

Genau das ist die Architektur dieser Karte.

Und darin steckt der Satz aus der Aufgabe, den man leicht überliest: „kein ML-Know-how im Team" und „ohne ein Modell zu trainieren". Es geht nicht darum, ein Modell zu bauen, sondern eine **fertige API** an der richtigen Stelle in einen Ablauf zu hängen. **Die eigentliche Entwurfsarbeit ist nicht die Erkennung, sondern die Schwelle** — wo endet das Automatische und wo beginnt der Mensch.

## Was es eigentlich ist — ein Aufruf mit zwei Schwellen

Kein Modell, kein Training, kein Endpunkt. Ein API-Aufruf:

```json
{
  "Image": {
    "S3Object": { "Bucket": "marktplatz-upload", "Name": "haendler-4711/lampe.jpg" }
  },
  "MinConfidence": 60,
  "HumanLoopConfig": {
    "HumanLoopName": "review-lampe-4711",
    "FlowDefinitionArn": "arn:aws:sagemaker:eu-central-1:1234:flow-definition/bildpruefung"
  }
}
```

Und die Antwort:

```json
{
  "ModerationLabels": [
    { "Name": "Suggestive", "ParentName": "", "Confidence": 71.4, "TaxonomyLevel": 1 }
  ],
  "ModerationModelVersion": "7.0",
  "HumanLoopActivationOutput": { "HumanLoopArn": "arn:aws:sagemaker:...:human-loop/review-lampe-4711" }
}
```

Drei Dinge stehen darin, die die ganze Karte tragen.

`Image.S3Object` — das Bild wird **nicht übertragen**, sondern referenziert. Bucket und Key genügen; die Lambda schiebt keine Bytes durch ihren Arbeitsspeicher. Alternativ ginge `Bytes` mit base64, das ist hier aber der schlechtere Weg.

`MinConfidence` — die Schwelle, unterhalb derer Rekognition ein Label gar nicht erst zurückgibt. Ohne diesen Parameter liefert die API alles ab **50 Prozent**.

`HumanLoopActivationOutput` — dieses Feld ist der Beweis, dass A2I keine nachgelagerte Integration ist, sondern in der Antwort derselben API steckt.

## Der Weg durch die Karte

### Badge 1 — S3 Event: der private Bucket weckt die Lambda

Ein Händler lädt `lampe.jpg` in den Upload-Bucket. Der Bucket ist privat, Public Access ist blockiert — und das ist keine Nebensache, sondern die Kernanforderung: **Ein Bild, das noch nicht geprüft ist, darf nicht erreichbar sein.**

Die S3 Event Notification auf `s3:ObjectCreated:*` ruft die Lambda auf, und zwar **asynchron**. Das hat Folgen, die man kennen muss: Lambda wiederholt bei einem Fehler in der Funktion standardmäßig **zweimal** und hält Ereignisse bis zu sechs Stunden in einer internen Warteschlange. Wer nichts weiter tut, verliert ein Bild nach drei gescheiterten Versuchen still. Eine Dead-Letter Queue oder ein On-Failure-Ziel fängt es auf.

### Der Kasten Lambda — Orchestrierung, nicht Bildverarbeitung

Die Funktion tut vier Dinge: Sie liest Bucket und Key aus dem Ereignis, ruft Rekognition auf, wertet die Antwort aus und kopiert das Objekt weiter. Sie **öffnet das Bild nicht**.

Das Bild dazu: Die Lambda ist der Mitarbeiter, der den Koffer aufs Band stellt und das Ergebnis abliest. Sie ist kein zweites Röntgengerät.

Daraus folgt eine Größenordnung, die in Prüfungsfragen als Distraktor auftaucht: Speicher und Timeout dieser Funktion hängen nicht an der Bildgröße, sondern an der Antwortzeit von Rekognition.

### Badge 2 — Bild-Key: was tatsächlich übergeben wird

Über diesen Pfeil geht eine Zeichenkette, kein Bild. Rekognition holt sich das Objekt selbst aus S3 — weshalb die Ausführungsrolle der Funktion Rekognition erlauben muss, was sie tut, und Rekognition Lesezugriff auf den Bucket braucht.

Hier setzt die Lambda auch `MinConfidence`. Diese Zeile gehört in die Konfiguration, nicht in eine `if`-Abfrage im Code: Wer die Schwelle im Code zieht, holt sich erst alle Labels ab 50 Prozent und wirft dann die Hälfte weg. Die API kann das schon.

### Der Kasten Rekognition — `DetectModerationLabels`

Der Aufruf ist **synchron**: ein Bild, eine Antwort, kein Job, kein Warten. Akzeptiert werden JPEG und PNG.

Jedes zurückgegebene Label trägt drei Angaben: einen Namen, eine Confidence und seit dem 01.02.2024 ein Feld `TaxonomyLevel` mit Werten **von 1 bis 3**. Die Moderations-Taxonomie ist also dreistufig geworden — Kursmaterial nennt oft noch den zweistufigen Stand von 2021 mit „10 Kategorien und 35 Unterkategorien". Dasselbe Update brachte 26 neue Labels und die Erkennung animierter und illustrierter Inhalte.

`ParentName` ist bei Labels der obersten Ebene leer. Wer ein Label wie `Suggestive` filtern will, muss wissen, auf welcher Ebene er filtert — sonst filtert er entweder zu grob oder greift ins Leere.

### Badge 3 — Confidence hoch: der zweite Bucket

Ist die Sache eindeutig, kopiert die Lambda das Objekt in den **Public-Bucket**. Das ist die Antwort auf eine konkrete Falle: Schriebe sie das Ergebnis in denselben Bucket zurück, der sie ausgelöst hat, würde sie sich selbst erneut auslösen.

AWS nennt in seinem Compute-Blog vier Wege daraus; der bevorzugte ist der einfachste — **zwei Buckets**. Hier zieht diese Trennung gleichzeitig die Sichtbarkeitsgrenze: geprüft und öffentlich ist ein anderer Ort als ungeprüft und privat. Ein Prefix-Filter im Event würde die Rekursion ebenfalls verhindern, aber nicht die zweite Frage beantworten.

### Badge 4 — Graubereich: der Human Loop öffnet sich

Liegt die Confidence in dem Bereich, in dem weder Freigabe noch Ablehnung sicher ist, öffnet A2I einen Human Loop. Rekognition ist direkt mit A2I integriert; für die Bildmoderation gibt es einen vorgefertigten Workflow-Typ.

Entscheidend für das Verständnis: **Nicht die Lambda entscheidet das.** Du hinterlegst die Bedingungen einmal in der Flow Definition, und die API wertet sie bei jedem Aufruf aus. Deshalb steht im Antwort-JSON ein `HumanLoopArn`, ohne dass dein Code eine Warteschlange angelegt hätte.

### Badge 5 — Urteil zurück: der gestrichelte Rückweg

Die Prüfer kommen aus einer **Private Workforce** (eigene Mitarbeiter), aus Mechanical Turk oder von vorgeprüften Vendoren. Das Ergebnis landet in S3 und steuert von dort die Freigabe.

Diese Auswahl ist keine Formalie. Wer Grenzfälle einer Moderation an eine öffentliche Crowd gibt, gibt genau die Bilder heraus, die möglicherweise problematisch sind — deshalb steht auf der Karte „Private Workforce" und nicht die billigste Option. Für Inhalte, die Menschen zugemutet werden, kennt der Aufruf zusätzlich `DataAttributes.ContentClassifiers`, mit denen du kennzeichnest, dass ein Bild frei von personenbezogenen Daten oder frei von Erwachseneninhalten ist.

Der Pfeil ist gestrichelt, weil er ein Ergebnis transportiert und keine neue Aktion auslöst. Und er ist eine bewusste Vereinfachung: Im Bild führt er zur Rekognition-Box zurück, real schreibt A2I nach S3, von wo eine weitere Verarbeitung übernimmt. Lies ihn als „das Urteil kehrt in den Fluss zurück", nicht als API-Rückruf.

### Der verworfene Kasten — Batch Image Content Moderation

„Viele Bilder, also ein Stapeljob" ist ein guter Reflex, der hier ins Leere läuft. Der Weg heißt `StartMediaAnalysisJob` und ist für **neue Kunden seit dem 30.04.2026 gesperrt** — zusammen mit Rekognition Streaming Video Analysis. Konten, die diese Funktionen in den letzten zwölf Monaten genutzt haben, behalten den Zugriff; alle übrigen Rekognition-Funktionen, insbesondere `DetectModerationLabels`, sind nicht betroffen.

Fachlich wäre der Stapelweg ohnehin falsch: Er ist asynchron. Ein Bild, das erst in der nächsten Sammelverarbeitung geprüft wird, ist bis dahin entweder unsichtbar oder ungeprüft sichtbar. Beides widerspricht der Aufgabe.

## Die entscheidende Unterscheidung

Auf dieser Karte gibt es **zwei** Schwellen, und wer sie verwechselt, baut eine Moderation, die entweder nie oder immer einen Menschen ruft:

| | `MinConfidence` | Human-Loop-Aktivierungsbedingung |
|---|---|---|
| Wo konfiguriert | im `DetectModerationLabels`-Aufruf | in der A2I Flow Definition |
| Was sie steuert | welche Labels zurückkommen | wann ein Mensch übernimmt |
| Voreinstellung | 50 Prozent | keine, sie ist Pflicht |
| Bezugsgröße | jedes Label einzeln | benannte Labels oder Stichprobe |
| Wirkung bei Unterschreitung | Label wird gar nicht genannt | Human Loop wird geöffnet |

Die zweite Zeile ist der Kern: **Die erste Schwelle entscheidet, was du siehst; die zweite entscheidet, wer hinsieht.** Ein zu hoher Wert bei `MinConfidence` schaltet dabei stillschweigend auch A2I ab — ein Label, das nie zurückgegeben wird, kann keine Bedingung erfüllen.

## Die ehrliche Feinheit

**Die wichtigste Feinheit dieser Karte ist ihr Ablaufdatum.** Amazon Augmented AI ist seit dem **30.07.2026 für neue Kunden geschlossen**. Die AWS-Dokumentation sagt es unverblümt: Bestandskunden können den Dienst normal weiternutzen, AWS investiert weiter in Sicherheit und Verfügbarkeit, **neue Funktionen sind nicht geplant**. In derselben Ankündigung vom 30.06.2026 steht auch Mechanical Turk — also die zweite der drei Belegschaftsoptionen aus Badge 5.

Was heißt das für dich? **Für die Prüfung nichts, für einen Neubau alles.** Die SAA-C03-Prüfung fragt weiter nach dem Muster „automatische Erkennung plus menschliche Prüfung im Graubereich", und A2I ist darin die erwartete Antwort. Baust du dieses System heute in einem neuen Konto, ist der Human Loop kein Baustein mehr, den du bestellen kannst — dann tritt an seine Stelle eine eigene Review-Anwendung: eine Warteschlange, eine Oberfläche, eine Rechteverwaltung für Prüfer und eine Rückschreibelogik. Genau die Arbeit, die A2I abgenommen hat.

**Zweitens ist die Endlosschleife keine mehr — aber trotzdem ein Fehler.** Seit Oktober 2024 erkennt Lambda rekursive Schleifen auch zwischen sich und S3 und bricht sie nach ungefähr **16 Aufrufen** in derselben Kette ab; es verwirft das Ereignis, meldet es über das AWS Health Dashboard und zählt es in der Metrik `RecursiveInvocationsDropped`. Wer also einen Bucket verwendet, bekommt keine Rechnung über eine Million Aufrufe — er bekommt sechzehn falsch geschriebene Objekte und eine Architektur, die nicht tut, was sie soll. Die Antwortoption „ein Bucket" bleibt falsch, nur ist die Begründung „unendlich teuer" seit anderthalb Jahren überholt.

**Drittens hat der Human Loop ein Kontingent.** `DetectModerationLabels` kann mit `HumanLoopQuotaExceededException` antworten, wenn zu viele Prüfungen gleichzeitig offen sind. In einem Aufbau, der bei jedem Grenzfall einen Menschen ruft, ist das kein theoretischer Fehlerfall, sondern der erste, der in Produktion auftritt.

## Syntax lesen — die Aktivierungsbedingungen

Der Block, den man in der Flow Definition hinterlegt, sieht harmloser aus, als er ist:

```
{ "Conditions": [ {
    "Or": [                                  <- Or | And, beliebig verschachtelt
      { "ConditionType": "ModerationLabelConfidenceCheck",
        "ConditionParameters": {
          "ModerationLabelName": "Suggestive",   <- exakter Name, Gross-/Kleinschreibung zaehlt
          "ConfidenceLessThan": 98 } },          <- ...LessThan | ...GreaterThan | ...Equals
      { "ConditionType": "Sampling",
        "ConditionParameters": {
          "RandomSamplingPercentage": 2 } }      <- 0,01 bis 100
    ] } ] }
```

Zwei Dinge zum Entziffern.

`ModerationLabelName` verlangt den **exakten** Namen aus der Rekognition-Antwort, Groß- und Kleinschreibung eingeschlossen; `*` steht als Platzhalter für jedes Moderationslabel. Ein Tippfehler führt nicht zu einem Fehler, sondern zu einer Bedingung, die nie zutrifft — die stillste aller Fehlerarten.

`Sampling` ist die zweite Bedingungsart und in Prüfungsfragen unterschätzt. Sie schickt einen Prozentsatz **aller** Ergebnisse zur Prüfung, unabhängig von der Confidence. Damit prüfst du nicht die Bilder, sondern das Modell: Ohne Stichprobe merkst du nie, dass die automatische Freigabe seit drei Wochen zu großzügig ist.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** vorkommt:

- kein Trainingsdatensatz, kein Labeling, kein Modell
- kein Inferenz-Endpunkt, der bereitgehalten und bezahlt wird
- keine eigene Review-Oberfläche für die Prüfer
- keine Warteschlange und keine Zuteilung von Aufgaben an Menschen
- kein Server, der auf neue Uploads wartet
- kein Stapeljob und kein Zeitplan

Übrig bleiben zwei Buckets, eine Funktion, ein API-Aufruf und eine Flow Definition.

## Wenn du dir eine Sache merkst

**Ein Bild, ein synchroner Aufruf — der Schwellwert trennt, A2I entscheidet den Rest.**

Ein eigenes Modell wäre die Antwort, wenn firmeneigene Kategorien gefragt wären; hier reicht die vortrainierte API. Ein Stapeljob wäre die Antwort, wenn niemand auf das Ergebnis wartet; hier hängt die Sichtbarkeit daran. Und ein Mensch für jedes Bild wäre die Antwort, wenn es keine Schwelle gäbe — die gibt es aber, und sie ist der ganze Punkt.

## Prüfungsknackpunkte

**Signalwörter:** „must be reviewed before they are visible", „no machine learning expertise", „without training a model", „flag inappropriate content automatically", „borderline cases should be reviewed by a human". Der letzte Halbsatz ist der eindeutigste — „borderline" plus „human" ist immer A2I.

**Warum ein Bucket hier verliert:** Die Lambda, die in denselben Bucket zurückschreibt, der sie ausgelöst hat, ruft sich selbst auf. Zwei Buckets oder ein Prefix-Filter; zwei Buckets sind hier besser, weil sie zugleich die Sichtbarkeitsgrenze ziehen.

**Warum „Schwelle im Anwendungscode" hier verliert:** `MinConfidence` gehört in den Aufruf. Antwortoptionen, die alle Labels abholen und danach im Code filtern, verlagern Logik nach oben, die die API bereits hat.

**Warum ein Batch-Job hier verliert:** `StartMediaAnalysisJob` ist asynchron und für neue Konten seit dem 30.04.2026 gesperrt. Die intuitive Antwort auf „viele Bilder" ist hier gleich doppelt falsch.

**Warum „jedes Bild durch Menschen prüfen" hier verliert:** A2I ist für den Graubereich gebaut, nicht für den Regelfall. Eine Option, die alle Uploads in die manuelle Prüfung schickt, verfehlt den Zweck der automatischen Moderation und die Kostenaussage der Aufgabe.

**Warum SageMaker mit eigenem Modell hier verliert:** Es ist die richtige Antwort, sobald aus „welche Kategorien" ein „unsere firmeneigene Kategorie" wird. Dann ist Custom Moderation über einen Adapter oder ein eigenes Modell im Spiel. Das Szenario sagt aber ausdrücklich: kein ML-Know-how, kein Training.

**Warum EventBridge statt S3 Event Notification hier verliert:** Beide könnten die Lambda auslösen. Die Notification ist Teil der Bucket-Konfiguration und filtert nach Prefix und Suffix; EventBridge ist eine eigene Ressource, kann an mehrere Ziele verteilen und komplexere Muster auswerten — muss aber erst ausdrücklich aktiviert werden und schickt dann **alle** Ereignisse des Buckets. Für einen einzigen Empfänger ist das Aufwand ohne Gegenwert.

**Zur Abgrenzung gegen Textract:** Beide holen bei Unsicherheit einen Menschen über denselben Dienst. Der Unterschied ist der Gegenstand — Rekognition beurteilt **Bildinhalt**, Textract liest **Struktur aus Dokumenten**. A2I ist beide Male dieselbe Mechanik mit einem anderen Built-in-Workflow.
