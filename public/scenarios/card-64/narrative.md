---
cardNumber: 64
slug: transcribe-call-analytics-translate-polly-callcenter
title: "Callcenter-Pipeline — Transcribe, Translate, Polly"
services: ["Amazon Transcribe Call Analytics", "Amazon Translate", "Amazon Polly", "Amazon S3"]
domains: ["D3"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/transcribe/latest/dg/call-analytics.html"
  - "https://docs.aws.amazon.com/transcribe/latest/dg/call-analytics-batch.html"
  - "https://docs.aws.amazon.com/transcribe/latest/dg/call-analytics-streaming.html"
  - "https://docs.aws.amazon.com/transcribe/latest/dg/tca-post-call.html"
  - "https://docs.aws.amazon.com/transcribe/latest/dg/feature-matrix.html"
  - "https://docs.aws.amazon.com/translate/latest/dg/what-is-limits.html"
  - "https://docs.aws.amazon.com/translate/latest/APIReference/API_TranslateText.html"
  - "https://docs.aws.amazon.com/polly/latest/dg/limits.html"
  - "https://docs.aws.amazon.com/polly/latest/dg/generative-voices.html"
---

## Die Grundidee zuerst

Ein Kundengespräch liegt als Aufnahme vor, und daraus soll etwas werden. Es gibt zwei Arten, das zu organisieren.

**Weg eins — die Kette der Spezialisten:** Du gibst das Band einer Schreibkraft, die tippt es ab. Das Getippte gibst du einem Psychologen, der beurteilt die Stimmung. Das Getippte gibst du außerdem einem Zensor mit schwarzem Filzstift, der streicht Kreditkartennummer und Adresse durch. Drei Leute, drei Übergaben, dreimal die Möglichkeit, dass jemand etwas übersieht.

Und ein Problem bleibt: **Auf dem Band steht die Nummer weiterhin drauf.** Der Filzstift schwärzt Papier. Wer die Aufnahme aufhebt — und Callcenter heben Aufnahmen auf — hat die Kreditkartennummer weiter im Haus, laut vorgelesen.

**Weg zwei — der Spezialist für genau diese Sorte Band:** Einer, der ausschließlich Kundengespräche bearbeitet. Er tippt ab, beurteilt die Stimmung im selben Durchgang, und die Nummer schwärzt er in beidem: im Text **und** im Ton. Wo sie gesagt wurde, ist auf der Aufnahme jetzt Stille.

Das ist Transcribe Call Analytics. Der Preis für die Bequemlichkeit steht gleich mit im Vertrag: Er arbeitet nach seinen Regeln. Eigene Stimmungskategorien nimmt er nicht an.

## Was es eigentlich ist — der Call-Analytics-Job

Kein Modell, kein Endpoint. Eine Job-Definition, die zwei Dinge festlegt, die reguläres Transcribe nicht kennt:

```json
{
  "CallAnalyticsJobName": "call-2026-08-11-0917",
  "Media": { "MediaFileUri": "s3://calls-raw/2026/08/11/0917.wav" },
  "OutputLocation": "s3://calls-processed/",
  "DataAccessRoleArn": "arn:aws:iam::1234:role/TranscribeCallAccess",
  "ChannelDefinitions": [
    { "ChannelId": 0, "ParticipantRole": "AGENT" },
    { "ChannelId": 1, "ParticipantRole": "CUSTOMER" }
  ],
  "Settings": {
    "ContentRedaction": {
      "RedactionType": "PII",
      "RedactionOutput": "redacted_and_unredacted"
    }
  }
}
```

Lies `ChannelDefinitions` zweimal. Das ist der Unterschied zwischen „Transkription" und „Call Analytics": Der Dienst will wissen, **wer wer ist**. Ohne diese Zuordnung gäbe es keine Aussage über Agenten- gegen Kundenstimmung, keine Unterbrechungen, keine Sprechzeitverteilung — nur Text.

Und `RedactionOutput` ist eine echte Entscheidung, keine Einstellung: `redacted` erzeugt nur die geschwärzte Fassung, `redacted_and_unredacted` beide. Wer beide behält, hat die Kreditkartennummer weiterhin im Bucket — dann aber wenigstens absichtlich.

## Der Weg durch die Karte

### Kasten — Anruf-Audio

Ein Kundengespräch, mehrsprachig, zwei Kanäle. In der Box steht „Stream oder Datei", und das ist die zentrale Weiche der ganzen Karte.

Ein **Audio-Stream** ergibt eine Realtime-Analyse, eine **Datei in S3** eine Post-Call-Analyse. Beide Wege erreichen denselben Dienst — sie unterscheiden sich nicht in Geschwindigkeit, sondern in dem, was hinten herauskommt.

Was in der Box nicht steht, aber technisch davorliegt: **Agent und Kunde müssen trennbar sein.** Entweder liefert die Telefonanlage zwei Kanäle, oder du überlässt die Sprechertrennung dem Dienst. Zwei Kanäle sind die verlässlichere Variante, und ob deine Anlage sie liefert, entscheidet sich lange vor dem ersten API-Aufruf. Das ist die klassische Stelle, an der ein Callcenter-Projekt Wochen verliert.

### Pfeil 1 — Audio an Call Analytics

Ein Aufruf, keine Vorverarbeitung. Kein Zerschneiden, kein Konvertieren, kein eigenes Voice-Activity-Erkennen.

Das Bild dazu: Du reichst das Band über den Tresen und bekommst eine Mappe zurück. Was in der Mappe liegt, hängt davon ab, welchen Tresen du gewählt hast.

### Kasten — Call Analytics

Der Dienst liefert Transkript, Sentiment und PII-Redaktion in einem Schritt. Genau das ist der Punkt der Karte: Er ist auf Kundengespräche zugeschnitten und bringt die Analyse mit, statt sie einem zweiten Dienst zu überlassen.

Dazu kommen Dinge, die man in einer allgemeinen Transkription selbst bauen müsste: Issue Detection, Kategorien auf Basis von Schlüsselphrasen, Gesprächscharakteristik — Unterbrechungen, Sprechtempo, Lautstärke, Nicht-Sprechzeit — und generative Zusammenfassungen.

Der Preis steht ebenfalls in der Doku, wörtlich: Die Sentiment-Analyse „works out-of-the-box and thus doesn't support customization". Kein Training, keine eigenen Kategorien.

Das ist der Handel, den diese Karte erklärt: Du bekommst sehr viel Analyse für einen Aufruf und gibst dafür jede Einflussnahme auf ihre Definition ab. Was AWS als negative Stimmung erkennt, ist ab jetzt die Definition eurer Firma für negative Stimmung. Bei Callcenter-Gesprächen ist das meistens tragbar. In einer Branche mit eigenem Ton — Inkasso, Notrufannahme, Seelsorge — ist es das nicht.

### Pfeil 2 — Transkript an Translate

Der Pfeil trägt Text, nicht Ton. Ab hier ist das Gespräch ein String, und alles Akustische — Tempo, Lautstärke, Pausen — bleibt in der Mappe zurück.

Das ist keine Nebensache: Die Qualitätssicherung liest später eine Übersetzung, in der kein Ärger mehr hörbar ist. Deshalb wandert der Sentiment-Wert als Zahl mit und nicht als Gefühl im Text.

### Kasten — Translate

`TranslateText` arbeitet synchron bis **10.000 Bytes** je Aufruf. Ein zehnminütiges Gespräch liegt darüber — Transkripte werden also aufgeteilt oder laufen als asynchroner Batch-Job.

**Custom Terminology** sorgt dafür, dass Produktnamen und Fachbegriffe stehen bleiben. Eine Terminologieliste fasst bis zu 256 Einträge, und pro Anfrage ist genau eine erlaubt. Ohne sie wird aus eurem Produkt „CertOps" im Zweifel „Zertifikatsbetrieb".

Zwei weitere Stellschrauben gehören zum Bild, auch wenn sie nicht auf die Karte passen: `Formality` steuert die Anrede — für deutsche Texte der Unterschied zwischen Du und Sie, und bei einer Qualitätssicherung, die Gesprächsprotokolle liest, keine Kosmetik. `Brevity` kürzt die Ausgabe. Beide sind optionale Settings des Aufrufs, keine eigenen Modelle.

Der asynchrone Batch-Weg wiederum ist großzügig dimensioniert: bis 1.000.000 Zeichen je Dokument und bis zu zehn Zielsprachen in einem Job. Für ein Archiv aus zehntausend Gesprächen ist das der Weg, nicht zehntausend Einzelaufrufe.

### Pfeil 3 — übersetzt an Polly

Der Text geht weiter, jetzt in der Zielsprache. Was gesprochen wird, entscheidet an dieser Stelle in der Praxis eine Anwendungslogik — die Karte zeigt den Datenweg, nicht die Entscheidung.

### Kasten — Polly

`SynthesizeSpeech` liefert die Audiodaten direkt im Antwort-Stream. Die Grenzen: **6.000 Zeichen** gesamt, davon höchstens **3.000 abgerechnete**; SSML-Tags zählen nicht als abgerechnete Zeichen, und der erzeugte Audiostrom ist auf **10 Minuten** begrenzt.

Für lange Texte gibt es `StartSpeechSynthesisTask` — asynchron, bis 200.000 Zeichen, Ausgabe nach S3, optional Meldung per SNS. Die Engine-Wahl (standard, neural, long-form, generative) bestimmt Natürlichkeit und verfügbare Stimmen.

### Pfeil 4 — MP3 in die Ablage

Polly schreibt das Ergebnis als Audiodatei weg. Ein Detail mit Sparpotenzial: AWS berechnet nichts für das erneute Abspielen einer bereits erzeugten Datei. Standardsätze — Begrüßung, Warteansage, Verabschiedung — synthetisiert man einmal und legt sie ab, statt sie bei jedem Anruf neu zu erzeugen.

### Kasten — Ablage

S3 hält Transkript und Audio nebeneinander. Von hier liest die Qualitätssicherung.

Wichtig ist, was hier **zusätzlich** liegt, wenn du Post-Call aus einem Stream mit angefordert hast: Transcribe zeichnet den Stream dann auf und legt ihn als WAV ab — bei aktivierter Redaktion in geschwärzter und optional ungeschwärzter Fassung. Aus einem Anruf werden zwei bis vier Dateien. Das ist Aufbewahrungspflicht und Datenschutzrisiko in einem Ordner.

### Kasten — Comprehend, verworfen

Der Reflex „Sentiment, also Comprehend" ist auf Karte 63 richtig und hier falsch.

Fachlich funktioniert es: Man könnte das Transkript an `DetectSentiment` schicken und bekäme ein Ergebnis. Es wäre nur das zweite Ergebnis zur selben Frage, aus einem zweiten Dienst, mit einer zweiten Rechnung — und ohne die Trennung nach Agent und Kunde, weil Comprehend den Text sieht und nicht das Gespräch.

Die Karte zeigt die Ablehnung als rotes X und nicht als Fehler. Comprehend ist ein guter Dienst, hier nur überflüssig — und genau diese Sorte Distraktor ist in der Prüfung die gefährlichste: Sie funktioniert, sie ist teurer, und sie klingt nach der Antwort, die man aus der vorigen Aufgabe schon kennt.

## Die entscheidende Unterscheidung

Stream gegen Datei ist nicht schnell gegen langsam, sondern **andere Insights**:

| | Realtime (Stream) | Post-Call (Datei) |
|---|---|---|
| Sentiment | qualitativ je Sprechsegment | zusätzlich quantitativ, Skala 5 bis −5 |
| Bezugsgröße | Segment | je Viertel des Anrufs und gesamt |
| Gesprächscharakteristik | nein | ja |
| Kategorien | Echtzeit-Events, Alarme möglich | nachträgliche Einordnung |
| Typischer Zweck | Agent-Assist im Gespräch | Auswertung, Training, Stichprobe |
| PII-Redaktion Text | ja | ja |

Und eine Zeile, die viele überrascht: Post-Call lässt sich **aus einem Realtime-Request mitbestellen**, über `PostCallAnalyticsSettings`. Du musst dich also nicht entscheiden — du musst nur wissen, dass du beides bestellen kannst.

## Die ehrliche Feinheit

**Die Sprachfrage bricht dieses Szenario auf, und zwar hart.** Die Karte sagt „mehrsprachig", und für Transkription und Übersetzung stimmt das. Für die PII-Redaktion stimmt es nicht: In der Post-Call-Variante ist sie laut Doku **nur für US-Englisch** unterstützt, in der Realtime-Variante für australisches, britisches und US-Englisch sowie US-Spanisch. Issue Detection und Call Summarization sind ebenfalls auf englische Dialekte begrenzt. Ein deutschsprachiges Callcenter bekommt also Transkript und Sentiment — aber genau die Funktion, mit der die Karte wirbt, greift für seine deutschen Anrufe nicht. Wer diese Architektur baut, muss das vorher wissen und nicht nach dem ersten Datenschutz-Audit.

**Bei Polly widersprechen sich die AWS-Quellen nicht, sie werden nur falsch gelesen.** Die eine Seite nennt 3.000 Zeichen, die andere 6.000 — beide stimmen: 6.000 gesamt, davon höchstens 3.000 abgerechnet, SSML-Tags zählen nicht mit. Wer nur eine der beiden Seiten liest, merkt sich die Hälfte einer Regel.

**Bei Translate widersprechen sie sich wirklich.** Die Amazon-Translate-FAQ nennt weiterhin 5.000 Bytes für Echtzeitaufrufe, während Quota-Seite, API-Referenz und die Ankündigung vom 29.12.2022 übereinstimmend 10.000 Bytes nennen. Nach der Quellenrangfolge — User Guide und API-Referenz des besitzenden Dienstes vor FAQ — gilt 10.000. Die FAQ ist schlicht nicht nachgezogen worden. Nimm den Fall als Muster mit: Eine veraltete FAQ ist der häufigste Grund für widersprüchliche AWS-Angaben.

**„Realtime" ist nicht bei allem Realtime.** Die Transcribe-Preisseite sagt es unumwunden: Bei der Echtzeit-Analyse werden einige Fähigkeiten **nachgelagert** verarbeitet — die Audio-Redaktion der personenbezogenen Daten und die Gesprächscharakteristik wie Nicht-Sprechzeit, Unterbrechungen, Lautstärke und Sprechtempo. Sie sind im Preis enthalten, aber nicht während des Gesprächs verfügbar. Wer eine Architektur damit begründet, dass die Aufnahme „live geschwärzt" wird, beschreibt etwas, das erst nach dem Auflegen fertig ist.

**Post-Call aus einem Stream hat eigene Kanten.** Die Doku nennt zwei, die man erst im Betrieb entdeckt: Bei FLAC- oder OPUS-OGG-Medien entfällt der `loudnessScore`, und es werden **keine Audioaufnahmen** des Streams erzeugt. Und für Streams, die länger als **90 Minuten** laufen, kann Transcribe die Post-Call-Analyse möglicherweise nicht liefern. Für ein Callcenter mit langen Beratungsgesprächen ist das kein Detail, sondern eine Anforderung an das Aufzeichnungsformat.

**Für „Antwort vorlesen" gibt es inzwischen einen dritten Weg.** Neben `SynthesizeSpeech` und `StartSpeechSynthesisTask` führt die Polly-Doku `StartSpeechSynthesisStream` — eine bidirektionale Streaming-Operation über HTTP/2, bei der du Text einreichst, während schon Audio zurückkommt. Sie hat keine Textgrenze je Anfrage, verlangt aber die generative Engine und unterstützt keine Speech Marks. Für einen Bot, dessen Antwort erst entsteht, während er sie spricht, ist das der passende Weg. Auf der Karte steht er nicht.

**Und eine Grenze der generativen Stimmen, die bei Untertiteln wehtut:** Speech Marks — die Zeitmarken für Wort- und Satzgrenzen — gibt es dort nicht, und der Newscaster-Stil ebenfalls nicht.

## Syntax lesen — die Terminologiedatei

Custom Terminology ist die kleinste Datei dieser ganzen Architektur und die mit dem größten Effekt je Zeile. CSV, kein Modell, kein Training:

```
de,en,fr
CertOps,CertOps,CertOps
Prüfungssimulator,exam simulator,simulateur d'examen
Karteikarte,flashcard,fiche
```

```
de,en,fr          ← Kopfzeile: Sprachcodes, eine Spalte je Sprache
 │  │
 │  └─ Zielsprache(n)
 └─ erste Spalte = Quellsprache dieses Eintrags
```

Drei Dinge, die man an diesem Häufchen Text nicht sieht und trotzdem wissen muss:

**Erstens ist die Datei mehrdirektional nutzbar.** Enthält sie Deutsch, Englisch und Französisch, deckt sie alle sechs Sprachpaare zwischen diesen dreien ab — jede Sprache in der Datei kann Quelle sein. Der Alternativweg wären drei einzelne, gerichtete Dateien.

**Zweitens greift nur der exakte Treffer.** Amazon Translate setzt den hinterlegten Begriff ein, wenn er den Quelltext genau so findet, und der Quelltext ist **case-sensitive**. „CertOps" trifft, „certops" nicht. Bei transkribierter Sprache ist das kein Randfall, sondern der Normalfall: Was der Kunde ausspricht, schreibt Transcribe so, wie es der Dienst hört.

**Drittens ist die Liste gedeckelt** — bis zu 256 Einträge, und je Übersetzungsanfrage darfst du genau eine Terminologie verwenden. Das reicht für Produktnamen und Fachvokabular, nicht für ein Firmenwörterbuch.

Für die Prüfung ist der Punkt kleiner und klarer: Custom Terminology ist die Antwort auf „unsere Produktnamen dürfen nicht übersetzt werden", nicht auf „die Übersetzung ist zu ungenau".

## Was du dadurch nicht baust

- keinen zweiten Dienst für Stimmung und keine zweite Rechnung dafür
- kein eigenes Schwärzen von Audio, keine Erkennung von Kreditkartennummern per Regex
- keine Sprechererkennung von Hand — die Kanaldefinition erledigt das
- kein Modelltraining, keinen Endpoint, keine Inference Units
- keine Aufteilung des Transkripts, solange du unter den Grenzen bleibst
- keine eigene Stimme, kein Audio-Schnitt, kein Studio

Übrig bleiben drei API-Aufrufe, ein Bucket und die Entscheidung, welche Fassung der Aufnahme du behältst.

## Wenn du dir eine Sache merkst

**Transcribe Call Analytics bringt Sentiment und PII-Redaktion mit — Stream heißt Realtime, Datei heißt Post-Call.**

Comprehend wäre für Anruf-Sentiment ein zweiter Dienst für ein bereits gelöstes Problem. Standard-Transcribe plus Eigenbau liefert dasselbe Ergebnis mit mehr Teilen. Und Contact Lens ist dieselbe Idee, aber nur innerhalb von Amazon Connect — Call Analytics ist die API für fremde Contact Center.

## Prüfungsknackpunkte

**Signalwörter:** „agent and customer sentiment during the call" plus „our existing contact center" ist Call Analytics. „Redact personally identifiable information from the recording" — das Wort *recording* — ist der Hinweis auf die Audio-Redaktion, nicht nur auf den Text.

**Warum Comprehend hier verliert:** Die Stimmungsanalyse liegt bereits im Ergebnis. Ein zweiter Dienst kostet extra und kennt die Rollentrennung Agent/Kunde nicht.

**Warum Standard-Transcribe hier verliert:** Es liefert das Transkript und sonst nichts. Sentiment, Kategorien und Redaktion müsstest du selbst zusammensetzen — mehr Teile, gleiches Ergebnis.

**Warum Contact Lens hier verliert:** Es ist die in Amazon Connect eingebaute Variante. Steht in der Aufgabe ein fremdes Contact Center, ist die API gefragt.

**Warum „nur den Text schwärzen" zu kurz greift:** Wird die Aufnahme aufbewahrt, ist die Nummer weiterhin im Haus. Antworten, die ausschließlich das Transkript erwähnen, lösen das Problem nur halb.

**Warum eigene Stimmungskategorien hier verlieren:** Sie sind in Call Analytics nicht vorgesehen. Wer firmeneigene Klassen braucht, nimmt zusätzlich Custom Classification (Karte 63) oder die Kategorienfunktion auf Basis von Schlüsselphrasen.
