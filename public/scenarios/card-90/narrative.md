---
cardNumber: 90
slug: well-architected-review-milestones
title: "Well-Architected Review"
services: ["AWS Well-Architected Tool", "AWS Well-Architected Framework"]
domains: ["D1", "D2", "D3", "D4"]
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/milestones.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/milestones-save.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/details-review.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/identify-and-understand-risks.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/implement-and-track-improvements.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/userguide/definitions.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/APIReference/API_PillarReviewSummary.html"
  - "https://docs.aws.amazon.com/wellarchitected/latest/APIReference/API_Milestone.html"
  - "https://aws.amazon.com/architecture/well-architected/"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, zu wissen, ob ein Gebäude sicher ist.

**Weg eins:** Vor der Eröffnung kommt ein Sachverständiger, geht einmal durch, hakt eine Liste ab und unterschreibt. Das Blatt kommt in einen Ordner. Fünf Jahre später will jemand wissen, ob das Haus besser oder schlechter geworden ist. Er findet ein Blatt von 2021 und nichts, womit er es vergleichen könnte. Das Blatt beweist nur, dass an einem Tag jemand da war.

**Weg zwei:** Das Haus bekommt ein Prüfbuch. Jede Begehung schreibt eine datierte Seite hinein — mit einer Mängelliste, die nach Schwere sortiert ist. Nach der nächsten Begehung liegen zwei Seiten nebeneinander, und plötzlich steht dort etwas, das keine einzelne Seite je enthalten konnte: **eine Richtung**.

Der Well-Architected Review ist das Prüfbuch. Der Milestone ist die datierte Seite. Und der eigentliche Wert entsteht erst ab der zweiten.

Das erklärt auch, warum diese Karte anders aussieht als die 89 davor. Sie zeigt keine Architektur. Sie zeigt den **Vorgang, mit dem du eine Architektur bewertest** — und dieser Vorgang ist ein Kreis, kein Pfeil.

## Was es eigentlich ist — der Workload als Datensatz

Ein Workload ist in der AWS-Dokumentation keine Metapher, sondern eine Definition: eine Sammlung aus Ressourcen und Code, die Geschäftswert liefert — etwa eine kundenseitige Anwendung oder ein Hintergrundprozess. Er kann eine Teilmenge eines einzigen Accounts sein oder sich über mehrere Accounts erstrecken.

Im Werkzeug ist er ein Datensatz. Verkürzt sieht er so aus:

```json
{
  "WorkloadName": "checkout-eu",
  "Environment": "PRODUCTION",
  "AccountIds": ["111122223333", "444455556666"],
  "AwsRegions": ["eu-central-1"],
  "Lenses": ["wellarchitected", "serverless"],
  "PillarPriorities": ["security", "reliability", "costOptimization"],
  "ImprovementStatus": "IN_PROGRESS",
  "RiskCounts": {
    "HIGH": 7, "MEDIUM": 12, "NONE": 24, "UNANSWERED": 3, "NOT_APPLICABLE": 5
  }
}
```

Lies das von oben nach unten, dann hast du den ganzen Review: Was wird bewertet (`WorkloadName`, `AccountIds`), womit (`Lenses`), in welcher Reihenfolge (`PillarPriorities`), wie weit bist du (`ImprovementStatus`), und was ist herausgekommen (`RiskCounts`).

Die letzte Zeile ist das Ergebnis. Sieben High Risk Issues, zwölf Medium Risk Issues, drei unbeantwortete Fragen. Genau diese Zahlen friert ein Milestone ein.

## Der Weg durch die Karte

### Kasten — Workload

Der Zuschnitt ist die erste und folgenreichste Entscheidung. Nimmst du „unsere gesamte AWS-Landschaft", bekommst du Antworten, die für keinen Teil davon stimmen: Die Reliability-Fragen werden für den Batch-Job anders beantwortet als für die Checkout-Strecke, und was du am Ende siehst, ist ein Mittelwert ohne Adressat.

Nimmst du dagegen `checkout-eu` — eine Sache, ein Owner, ein Geschäftswert — dann ist jede Antwort eine Aussage über etwas, das jemand verantwortet.

Der Owner ist dabei nicht nur eine Beschriftung. Die Dokumentation hält fest, dass nur der Eigentümer des Workloads ihn löschen kann, dass das Löschen nicht rückgängig zu machen ist und dass dabei **alle zugehörigen Milestones mitgelöscht werden**. Die Zeitreihe hängt also am Workload-Datensatz, nicht daneben. Wer den Workload neu anlegt, weil der Zuschnitt beim ersten Versuch daneben lag, fängt die Messung bei null an — ein weiterer Grund, den Zuschnitt vor dem ersten Milestone zu klären und nicht danach.

### Pfeil 1 — die Lens auswählen

Eine Lens ist der Fragenkatalog. Der Standard ist die AWS Well-Architected Framework Lens; für spezielle Domänen gibt es weitere — AWS nennt unter anderem Machine Learning, Data Analytics, Serverless, High Performance Computing, IoT, SAP, Streaming Media, die Spielebranche, hybride Netzwerke und Finanzdienstleistungen. Eigene Lenses lassen sich anlegen, fremde teilen.

Der wichtige Satz dazu steht auf der AWS-Produktseite: Um einen Workload vollständig zu bewerten, wendest du die passenden Lenses **zusammen mit** dem Framework und seinen sechs Säulen an — nicht statt seiner. Eine Serverless Lens ersetzt die Security-Fragen nicht, sie ergänzt sie um Fragen, die nur bei Serverless auftauchen.

Das erklärt auch, warum die Lens auf der Karte in Navy steht und nicht in einer Rollenfarbe: Sie ist keine Architekturrolle, sondern eine Bewertungsdimension.

### Kasten — Lens + Fragen

Jetzt wird gearbeitet, und zwar von Menschen. Der Review ist ein Gespräch: Fragen vorlesen, Best Practices ankreuzen oder eben nicht, Notizen schreiben.

Der einzige Weg, das kaputtzumachen, ist Schönfärberei. Ein Häkchen, das nicht der Realität entspricht, erzeugt ein Ergebnis, das nicht der Realität entspricht — und der Milestone friert es ein, sodass niemand später merkt, wo der Fehler saß.

Die Dokumentation gibt dafür einen Ausweg vor, der besser ist als das falsche Häkchen: Wenn technische oder geschäftliche Gründe gegen eine Best Practice sprechen, kann das tatsächliche Risiko niedriger sein als angezeigt — und AWS empfiehlt ausdrücklich, diese Gründe und ihre Auswirkung in den Workload-Notizen festzuhalten. Eine dokumentierte Ausnahme ist eine Antwort. Ein stilles Häkchen ist keine.

Wenn eine Best Practice nicht passt, gibt es dafür einen dokumentierten Weg — die Frage lässt sich als nicht anwendbar markieren, mit einer Begründung aus einer festen Liste. Weglassen ist etwas anderes als „nicht zutreffend", und das Werkzeug unterscheidet beides.

Wie das konkret aussieht: Unter Reliability steht eine Frage danach, wie du deine Daten sicherst. Darunter hängen mehrere Best Practices — Backups automatisiert durchführen, Wiederherstellung regelmäßig testen, Aufbewahrungsfristen an den Anforderungen ausrichten. Für `checkout-eu` sind die automatisierten RDS-Backups aktiv, also Häkchen. Ein Restore-Test wurde nie durchgeführt, also kein Häkchen — und in die Notizen kommt der Satz, dass der Plattform-Team-Ticket dafür existiert. Genau diese eine fehlende Auswahl erzeugt später einen Eintrag im Improvement Plan.

Das ist die ganze Mechanik: kein Scan, kein Agent, keine Metrik. Ein Häkchen oder keins, und daraus ein Risiko.

### Der Zulauf — die sechs Säulen

Der Kasten unten hängt an Schritt 2 und trägt bewusst **keinen Badge**: Er ist kein Ablaufschritt, sondern eine Zulieferung. Die Säulen sind die Dimensionen, nach denen die Fragen sortiert sind.

Es sind sechs: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.

Diese Zahl ist der Grund, warum die Karte überhaupt geprüft wurde. Lange waren es fünf. Sustainability kam als sechste dazu, und ältere Lernmaterialien — auch manche Kursvideos — führen bis heute fünf. Wer die Fünf im Kopf hat, hakt in der Prüfung eine falsche Antwort ab, ohne es zu merken.

### Pfeil 2 — aus Antworten werden Risiken

Kein Analysevorgang, keine Messung an echten Ressourcen. Das Werkzeug leitet die Risiken direkt aus den angekreuzten und nicht angekreuzten Best Practices ab.

### Kasten — HRI und MRI

Ein **High Risk Issue** ist laut AWS eine architektonische oder betriebliche Entscheidung, die einen erheblichen negativen Einfluss auf das Geschäft haben kann — auf Betrieb, auf Werte, auf Personen. Ein **Medium Risk Issue** kann ebenfalls schaden, in geringerem Maß.

Die AWS-Doku gibt Beispiele, die den Unterschied greifbar machen: Den AWS-Account nicht abzusichern, ist ein HRI aus der Security-Säule. Zugangsdaten nicht regelmäßig zu prüfen und zu rotieren, ist ein MRI aus derselben Säule. Das eine ist eine fehlende Grundlage, das andere eine fehlende Verbesserung.

Aus dieser Liste entsteht der Improvement Plan — die konkrete Empfehlung je Risiko, mit Verweis auf die zugehörige Best Practice.

### Pfeil 3 — Milestone speichern

Ein Klick. Und ein irreversibler: Milestones sind laut Dokumentation **unveränderlich**. Nach dem Speichern lassen sich die erfassten Workload-Daten nicht mehr ändern.

### Kasten — Milestone

Ein Milestone hält den Zustand des Workloads zu einem Zeitpunkt fest. Die Dokumentation nennt zwei Regeln dazu: einen nach dem ersten vollständigen Durchgang speichern — und dann als Best Practice **jedes Mal, wenn du den Workload verbesserst**.

Damit ist der Milestone kein Archiv, sondern ein Messpunkt. Für `checkout-eu` sieht das so aus: Milestone 1 heißt „2026-04-11 Erstbewertung" und hält sieben HRIs fest. Das Team baut in den folgenden Wochen Multi-AZ für die Datenbank, richtet den Restore-Test ein und schaltet Alarme scharf. Milestone 2 heißt „2026-08-01 nach Reliability-Paket" und hält zwei HRIs fest.

Fünf HRIs weniger ist jetzt keine Behauptung mehr, sondern eine Differenz zwischen zwei unveränderlichen Datensätzen — und weil zu jedem Milestone ein Bericht erzeugbar ist, lässt sie sich vorzeigen, ohne dass jemand nachträglich an den Antworten drehen könnte. Genau das ist der Grund für die Unveränderlichkeit: Ein Fortschrittsmaß, das sich rückwirkend anpassen lässt, misst nichts.

Ein Hinweis für die Benennung, der aus der Praxis kommt: Milestone-Namen müssen innerhalb des Workloads eindeutig sein, und Groß-/Kleinschreibung sowie Leerzeichen werden dabei ignoriert. Ein Datum am Anfang macht die Liste sortierbar und die Eindeutigkeit zum Selbstläufer.

### Pfeil 4 — der Rücksprung

Der goldene Pfeil führt zurück auf Schritt 2, nicht auf Schritt 1. Der Workload wird in der Regel nicht neu definiert; die Fragen werden neu beantwortet.

Zwischen Milestone und nächstem Review liegt die eigentliche Arbeit, und die AWS-Doku nennt dafür eine Spanne: Für die Umsetzungsphase empfiehlt sie **90 bis 180 Tage**. Dauert deine Liste länger, ist der Rat, sie zu kürzen und mit einer kleineren Auswahl zu starten, statt den Kreis nie zu schließen.

### Der rote Abbruch — „Einmal vor Go-Live, nie wieder"

Ohne zweiten Milestone gibt es genau eine Seite im Prüfbuch. Die Risiken sind dokumentiert und niemand weiß, ob sie noch da sind. Der Review ist zur Ablage geworden.

Die verworfene Box bleibt Gold, weil auch der Einmal-Review ein Governance-Vorgang ist — nur ein wirkungsloser. Verworfen wird sie durch X-Kreis und roten Pfad.

## Die entscheidende Unterscheidung

Drei AWS-Dienste klingen nach „prüft meine Umgebung" und tun Verschiedenes:

| | Well-Architected Review | Trusted Advisor | Config / Security Hub |
|---|---|---|---|
| Prüft was? | Entwurfsentscheidungen | konkrete Ressourcen | konkrete Ressourcen |
| Wie? | Menschen beantworten Fragen | automatisierte Checks | kontinuierliche Regelauswertung |
| Ergebnis | HRIs, MRIs, Improvement Plan | Empfehlungen je Check | Konformitätsstatus je Ressource |
| Wann? | punktuell, wiederholt | laufend | laufend |
| Historie | Milestones | Verlauf je Check | Konfigurationshistorie |

Die Merkregel: Der Review fragt „habt ihr darüber nachgedacht?", die anderen beiden fragen „ist es so eingestellt?". Eine Architektur kann in Config zu 100 % konform sein und trotzdem sieben HRIs haben.

## Die ehrliche Feinheit

**Das Werkzeug ist kostenlos, der Review ist es nicht.** AWS beschreibt das Well-Architected Tool als in der Konsole ohne Zusatzkosten verfügbar. Was es kostet, sind Personentage — und die anschließenden 90 bis 180 Tage Umsetzung. Wer den Review als Klickaufgabe plant, plant den teuren Teil nicht ein.

**Ein HRI ist kein Vorfall.** Das ist die häufigste Fehlübersetzung. Ein High Risk Issue beschreibt eine Entscheidung mit Schadenspotenzial, keinen laufenden Ausfall. Deine Anwendung kann fehlerfrei laufen und trotzdem zwölf HRIs tragen — das ist sogar der Normalfall, denn genau davon lebt der Review.

**Risikoeinstufungen sind Leitlinien, keine Urteile.** Die Dokumentation sagt ausdrücklich, dass Kunden selbst bewerten sollen, welche Auswirkung eine nicht umgesetzte Best Practice für ihr Geschäft hätte — und dass das Risiko niedriger sein kann, wenn technische oder geschäftliche Gründe dagegenstehen. Der dokumentierte Weg ist dann eine Notiz im Workload, nicht ein stilles Häkchen.

**Milestones sind begrenzt.** Die API-Referenz nennt maximal 100 je Workload, und Milestone-Namen müssen zwischen 3 und 100 Zeichen lang und innerhalb des Workloads eindeutig sein. Bei einem quartalsweisen Rhythmus reicht das für 25 Jahre; bei einem Milestone je Sprint wird es in vier Jahren eng. Wer die Grenze absehbar reißt, hat den Milestone als Commit-Log missbraucht statt als Messpunkt.

**Und die Zahl Sechs ist ein Momentaufnahme-Wert.** Sie hat sich schon einmal geändert. Diese Karte lehrt den Prüfungsstand; ändert AWS sie erneut, ist die Karte veraltet, nicht der Kandidat.

## Syntax lesen — `RiskCounts`

Die Ergebnisstruktur ist eine Map, und ihre fünf erlaubten Schlüssel erklären den Review besser als jede Beschreibung:

```
"RiskCounts": {
   "HIGH":           7,   ← muss adressiert werden
   "MEDIUM":        12,   ← sollte adressiert werden
   "NONE":          24,   ← Best Practice ist umgesetzt
   "UNANSWERED":     3,   ← Frage nicht beantwortet
   "NOT_APPLICABLE": 5    ← Frage bewusst ausgeschlossen
}
```

Zwei Schlüssel sind die interessanten. **`UNANSWERED`** ist kein Nullwert — es ist eine sichtbare Lücke. Solange dort etwas steht, ist der Review unvollständig, und die Summe der Risiken untertreibt.

**`NOT_APPLICABLE`** ist der ehrliche Ausweg, und er trägt eine Begründung aus einer festen Liste: `OUT_OF_SCOPE`, `BUSINESS_PRIORITIES`, `ARCHITECTURE_CONSTRAINTS`, `OTHER` oder `NONE`. Genau das ist der Unterschied zwischen „passt für uns nicht, weil wir keine Multi-Region-Anforderung haben" und „haben wir übersprungen".

## Was du dadurch nicht baust

Zähl durch, was der Review **nicht** ist:

- keine Zertifizierung und kein Audit
- keine Prüfung, die AWS für dich durchführt
- keine automatische Messung an laufenden Ressourcen
- kein Architekturdiagramm und kein Zielbild
- keine Änderung an deiner Umgebung — das Werkzeug schreibt nichts
- keine Aussage darüber, ob heute Nacht etwas ausfällt

Übrig bleibt: ein strukturiertes Gespräch, eine sortierte Mängelliste und eine Zeitreihe.

## Wenn du dir eine Sache merkst

**Well-Architected ist ein wiederholter Bewertungsvorgang mit Milestones — der Wert liegt in der Differenz, nicht im einzelnen Ergebnis.**

Trusted Advisor prüft Ressourcen gegen feste Regeln und kennt deine Entwurfsgründe nicht. Config beantwortet, ob eine Einstellung stimmt, nicht ob die Architektur trägt. Und das Framework selbst ist ein Dokument — erst das Tool macht daraus einen wiederholbaren Vorgang mit Gedächtnis.

## Prüfungsknackpunkte

**Signalwörter:** „review the workload against best practices", „identify high risk issues", „measure improvement over time", „structured architecture assessment". Sobald „systematisch bewerten" und „über die Zeit vergleichen" zusammen auftreten, ist es der Well-Architected Review.

**Die Säulenfrage kommt selten als Aufzählung.** Gefragt wird meist andersherum: Welche Säule adressiert ein bestimmtes Anliegen? Datenverschlüsselung → Security. Auto Scaling gegen Lastspitzen → Performance Efficiency. Multi-AZ gegen Ausfall → Reliability. Reserved Instances → Cost Optimization. Runbooks und Deployment-Automatisierung → Operational Excellence. Auslastung erhöhen, um Ressourcen zu sparen → Sustainability.

**Reliability gegen Performance Efficiency** ist die häufigste Verwechslung. Beide lieben Skalierung. Die Frage entscheidet: Geht es um *Verfügbarkeit trotz Ausfall*, ist es Reliability. Geht es um *passende Ressourcen für die Last*, ist es Performance Efficiency.

**Trusted Advisor:** Automatisierte Checks auf Ressourcenebene. Findet ungenutzte Volumes, nicht fragwürdige Entwurfsentscheidungen.

**AWS Config:** Beantwortet, ob eine Ressource einer Regel entspricht. Kein Architekturreview.

**Security Hub:** Aggregiert Findings gegen Standards. Sicherheitsseite, nicht sechs Säulen.

**Ein einmaliges Assessment vor Go-Live:** Die klassische Falschantwort. Ohne zweiten Milestone gibt es keinen Fortschritt, nur eine Momentaufnahme.
