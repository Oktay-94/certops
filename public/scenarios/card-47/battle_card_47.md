---
nr: 47
title: "Amazon Macie · Sensitive Data Discovery über 1.400 S3-Buckets"
services:
  - Amazon Macie
  - Amazon S3
  - Amazon EventBridge
  - AWS Lambda
  - AWS Organizations
domains:
  - D1
signalwords:
  - "discover sensitive data"
  - "personally identifiable information (PII)"
  - "GDPR / HIPAA compliance"
  - "where does sensitive data reside"
  - "cost-effective across the entire estate"
  - "proprietary data format"
  - "reduce false positives"
assets:
  - battle_card_47.svg
  - battle_card_47.png
  - battle_card_47.pdf
status_note: |
  QC (qc.py): 0 Befunde. 9 Boxen, 49 Texte, 19 Segmente, 6 Badges.
  Segmente aufgeschlüsselt (R5): 19 gemeldet − 8 Phantom-Segmente aus
  4 Marker-Definitionen (je 2) = 11 echte Segmente: 4 Linienpfeile (1–4)
  + 3 Segmente aus dem rechtwinkligen Pfad 5 + 1 Pfeil 6 + 1 verworfener
  Pfad + 2 Striche des roten X.
  Badges aufgeschlüsselt (R6): 6 gezählt. Das rote X (r=20, weiß gefüllt,
  roter Rand) wurde von Prüfung (d) korrekt ausgenommen.

  Korrekturrunden:
  1. Titelvariante A ("… DSGVO-Audit über 1.400 Buckets") bei 1507,8 px
     gemessen — passt rechnerisch in die 1540 px, aber ohne Reserve.
     Verworfen zugunsten der kürzeren Variante B (1323,0 px).
  2. Geometrieplan: Segment "auto → tj" lief diagonal quer durch die
     Custom-Data-Identifier-Box (Kollisionsprüfung vor dem Zeichnen).
     Zwei rechtwinklige Umleitungen geprüft: unten herum (0 Kollisionen,
     aber endet an der falschen Box) und oben herum (1 Kollision mit
     Bucket-Posture). Beide verworfen. Stattdessen den Ablauf begradigt:
     Posture → CDI und Automated Discovery → Allow List laufen als zwei
     parallele Stränge, Pfad 5 führt unten herum zusammen. Das ist auch
     fachlich richtiger — der Sprung Automated → Targeted war eine
     Abkürzung, die die Rolle der Kriterien unterschlagen hätte.
  Beide Befunde vor dem Zeichnen abgefangen; keine Korrekturrunde am
  fertigen SVG.

  Render-Sanity (R7): sieben geometrisch abgeleitete Freizonen, am Ende
  alle rein weiß. Drei Zonen mussten nachgeschnitten werden — jedes Mal
  war die Zone falsch, nicht die Grafik:
    a) Zone x900..1080 y488..538 traf Badge 5 (Kreis cy=545, r=15, also
       ab y=530). Zone auf y≤528 gekürzt.
    b) Zone x700..860 traf das Label "Ausnahmen" (89,1 px breit, anchor
       middle bei x=676, also bis x=720,6). Zone auf x≥730 verschoben.
    c) Zone x644..858 y536..606 traf die X-Labels "Kosten" (x 625..675)
       und "verworfen" (x 612..688). Zone auf x≥700, y≥540 gesetzt.
  Alle vierzehn geprüften Palettenfarben im PNG nachweisbar
  (Teal 23486 px, Grün 6804 px, Orange 2629 px, Rot 4967 px, Füllungen
  und dunkle Textfarben je > 0).

  Schwarz-Prüfung (R13): reines Schwarz (0,0,0) = 0 px. Der rechtwinklige
  Pfad 5 (drei Segmente, zwei Knicke) trägt explizit fill="none" — genau
  der Fall, der in Batch 9 fünf Karten gekostet hat.

  Footer von Hand gemessen (R3): 1205,4 px. Unter Stil-Guide (~1420 px)
  und unter der R3-Warnschwelle (~1400 px). Die längere Variante A lag
  bei 1358,4 px und wäre ebenfalls zulässig gewesen.

  Sichtprüfung (R8): versucht. Zurück kam ein leerer Platzhalter ohne
  Bildinhalt. Rechnerisch geprüft ist nicht gesehen. Die Karte ist visuell
  unbestätigt und braucht einen Blick von Oktay.
---

## Szenario

Ein Versicherer betreibt rund 1.400 S3-Buckets in 30 Accounts. Vor einem
DSGVO-Audit stellt die Aufsicht zwei Fragen: Wo liegen personenbezogene
Daten, und sind diese Buckets öffentlich erreichbar? Niemand im Haus kann
das beantworten.

Ein vollständiger Scan über den gesamten Bestand wurde durchgerechnet und
liegt im sechsstelligen Bereich — Macie rechnet nach inspizierten Datenmengen
ab. Erschwerend kommt zweierlei hinzu: Interne Versicherungsnummern im Format
`VS-DE-########` erkennt kein eingebauter Identifier, und die Testdaten-Buckets
enthalten synthetische Namen, die als PII gemeldet werden und jeden Report
fluten würden.

## Ablauf

**1 — Bucket-Posture: die kostenlose Hälfte.** Sobald Macie aktiviert ist,
inventarisiert es alle S3-Buckets der Region und bewertet sie kontinuierlich:
öffentlich zugänglich, unverschlüsselt, geteilt oder repliziert mit Accounts
außerhalb der Organization. Das beantwortet die zweite Audit-Frage
vollständig — **ohne ein einziges Objekt zu lesen**. Diese Bewertung ist von
der Datenanalyse getrennt und kostet keine Inspektionsgebühr. Wer nur wissen
will, welche Buckets offen stehen, braucht gar keinen Scan.

**2 — Automated Sensitive Data Discovery: breit und billig.** Macie wählt per
Sampling repräsentative Objekte aus jedem Bucket aus, analysiert sie und baut
daraus eine interaktive Data Map plus einen Sensitivity Score je Bucket. Es
gruppiert Ressourcen nach Merkmalen wie Bucket-Name, Dateityp und Präfix, um
die zu scannende Datenmenge klein zu halten. Das Ergebnis ist keine
Vollständigkeitsaussage, sondern eine Landkarte: *hier liegt wahrscheinlich
etwas*. Bei Erstaktivierung von Macie ist Automated Discovery standardmäßig
eingeschaltet und liefert binnen 48 Stunden erste Bewertungen.

**3 — Custom Data Identifier für das eigene Format.** Die eingebauten Managed
Data Identifiers decken Kreditkartennummern, AWS-Secret-Keys, Pass- und
Steuernummern vieler Länder ab — deutsche Versicherungsnummern nicht. Ein
Custom Data Identifier besteht aus einem Regex plus optional Keywords, die in
der Nähe stehen müssen, und Ignore-Words. Ohne die Proximity-Regel würde jede
Zeichenkette im passenden Format anschlagen; mit ihr nur dort, wo auch ein
Kontextwort steht. Standard-Severity ist Medium, konfigurierbar nach
Trefferanzahl.

**4 — Allow List gegen die Testdaten.** Eine Allow List definiert Text oder
Textmuster, die Macie ignorieren soll. Entscheidend für die Prüfung: Ein
Treffer in der Allow List wird **nicht gemeldet, selbst wenn er die Kriterien
eines Managed oder Custom Data Identifier erfüllt**. Die Allow List steht also
über beiden. Zwei Typen: eine zeilenweise Textdatei in S3 oder ein Regex,
der direkt in Macie gespeichert wird.

**5 — Findings ohne die Daten selbst.** Macie meldet, *dass* und *wo* etwas
gefunden wurde — die sensiblen Inhalte stehen nicht im Finding. Detaillierte
Analyse-Protokolle (Sensitive Data Discovery Results) entstehen für jedes
untersuchte Objekt, auch für solche ohne Fund und solche, die nicht lesbar
waren. Diese Ergebnisse hält Macie 90 Tage und liefert sie ausschließlich
verschlüsselt in einen selbst konfigurierten S3-Bucket — weder Konsole noch
API geben sie direkt heraus. Für ein Audit ist genau dieser Bucket das
Langzeitarchiv.

**6 — Targeted Job auf die Treffer.** Erst jetzt, auf den Buckets mit hohem
Sensitivity Score, läuft ein Sensitive Data Discovery Job: gezielt und
vollständig statt stichprobenartig. Das ist die Evidenz, die dem Prüfer
vorgelegt wird. Beide Verfahren dürfen gleichzeitig laufen.

**Reaktion — EventBridge und Lambda.** Alle Macie-Findings gehen an
EventBridge und können nach Security Hub veröffentlicht werden. Ein
öffentlicher Bucket mit PII-Fund löst eine Lambda aus, die Public Access
blockiert.

**Verworfen — Vollscan über alle 1.400 Buckets.** Ein Discovery Job über den
gesamten Bestand liefert dasselbe Ergebnis wie der zweistufige Weg, nur zum
Vielfachen des Preises. Die Abrechnung erfolgt nach inspizierter Datenmenge;
Sampling existiert genau deshalb.

## Prüfungs-Kernsatz

**Automated Discovery sagt, wo man suchen muss. Der Targeted Job sagt, was
dort liegt.** Erst breit und billig, dann tief und teuer — nie umgekehrt und
nie beides in einem Schritt.

## Abgrenzungen

**47 ↔ 46:** Inspector fragt *ist die Software verwundbar*, Macie fragt *ist
der Inhalt schützenswert*. Inspector schaut auf Pakete und CVEs, Macie auf
Objektinhalte. Beide liefern an EventBridge und Security Hub.

**47 ↔ 43:** KMS verschlüsselt, Macie findet. Macie sagt einem überhaupt
erst, *welche* Buckets Verschlüsselung dringend brauchen — die
Posture-Bewertung meldet unverschlüsselte Buckets, ohne dass ein Scan läuft.

**Automated Discovery ↔ Discovery Job:** Sampling gegen Vollanalyse; laufend
gegen punktuell; Landkarte gegen Beweis. Kein Ersatz füreinander.

**Managed ↔ Custom Data Identifier ↔ Allow List:** Managed ist eingebaut,
Custom ist selbst definiert, Allow List ist die Ausnahme, die beide sticht.

## Klassiker-Fallen

**"Macie zeigt mir die gefundenen Kreditkartennummern."** Nein. Findings
enthalten Ort und Typ, nicht den Inhalt. Es gibt eine separate Funktion zum
temporären Abruf von bis zu zehn Beispielen, die über einen
kundenverwalteten KMS-Schlüssel verschlüsselt wird — das ist ein eigener,
bewusst abgesicherter Vorgang, kein Bestandteil des Findings.

**"Macie scannt auch RDS, DynamoDB und EFS."** Macie analysiert S3. Andere
Datenquellen erreicht man nur, indem man Auszüge nach S3 legt — etwa
Snapshots oder Glue-Exporte. Das ist ein Umweg, keine Funktion.

**"Ich aktiviere Automated Discovery zusätzlich."** Bei Erstaktivierung von
Macie ist es bereits an. Wer Macie schon länger nutzt, muss es im
Administrator-Account einschalten.

**"Custom Data Identifier ersetzt die Managed Identifiers."** Er ergänzt sie.
In der Konfiguration wird mindestens ein Managed oder Custom Identifier
verlangt; beide Listen existieren nebeneinander.

## Faktencheck — Divergenzen zu älterem Kursmaterial

**Macie wurde im Mai 2020 vollständig neu gebaut.** Die Neuauflage senkte den
Preis um 80 bis über 90 Prozent und band den Dienst direkt an S3 an. Ein
sichtbarer Nebeneffekt: Das Aktivieren von S3-Datenereignissen in CloudTrail
ist **keine Voraussetzung mehr**. Kursmaterial, das CloudTrail-Data-Events als
Macie-Vorbedingung nennt oder mit den alten Preisen rechnet, beschreibt die
Vorgängerversion.
*Quelle: aws.amazon.com/about-aws/whats-new/2020/05/announcing-major-enhancements-to-amazon-macie-an-80-percent-plus-price-reduction-and-global-region-expansion,
aws.amazon.com/blogs/aws/new-enhanced-amazon-macie-now-available/*

**Automated Sensitive Data Discovery kam erst am 28.11.2022.** Älteres
Material kennt nur Classification Jobs und stellt Macie deshalb als
grundsätzlich teuer dar. Die Kostenaussage stimmt für den Vollscan, nicht
mehr für den Einstieg.
*Quelle: aws.amazon.com/about-aws/whats-new/2022/11/amazon-macie-automated-sensitive-data-discovery*

**Macie ist inzwischen Signalquelle des neuen Security Hub.** Security Hub
aggregiert und korreliert automatisch Signale aus GuardDuty, Inspector,
Security Hub CSPM und Macie; sensible Datenfunde erscheinen dort als eigene
Kategorie und fließen in die Exposure-Analyse ein. Das knüpft direkt an die
in Batch 9 dokumentierte Aufspaltung an: *Security Hub CSPM* ist der alte
Dienst, *Security Hub* der neue Korrelations-Layer darüber.
*Quelle: aws.amazon.com/blogs/aws/aws-security-hub-now-generally-available-with-near-real-time-analytics-and-risk-prioritization/,
aws.amazon.com/macie/features/*

**Widerspruch zwischen zwei AWS-Quellen — Preview oder GA?** Der AWS-News-Blog
meldet Security Hub als allgemein verfügbar (Ankündigung vom Dezember 2025,
Preview zuvor auf der re:Inforce 2025). Die Macie-Feature-Seite spricht
weiterhin von "AWS Security Hub (Preview)". Nach der Batch-9-Regel steht
deshalb **kein Verfügbarkeitsstatus auf der Karte**; die Karte nennt Security
Hub gar nicht, sondern zeigt nur EventBridge als Abzweig. Wer den aktuellen
Stand braucht, prüft die Service-Seite direkt.

**Preventative Control Monitoring bis 10.000 Buckets (06.12.2024)** und
**VPC Interface Endpoints für Macie (02.07.2025)** sind neuere Erweiterungen,
die in älterem Material fehlen. Der Endpoint-Punkt ist prüfungsrelevant, wenn
eine Frage verlangt, dass kein Traffic das AWS-Netz verlässt.
*Quelle: docs.aws.amazon.com/macie/latest/user/doc-history.html*

**Managed Data Identifiers wachsen laufend.** Im März 2025 kamen nationale
Identifikationsnummern für Argentinien, Chile, Kolumbien und Mexiko hinzu.
Jede feste Liste in Kursmaterial ist eine Momentaufnahme; maßgeblich ist
`ListManagedDataIdentifiers`.
*Quelle: docs.aws.amazon.com/macie/latest/user/doc-history.html*

## Nicht bestätigt

**Konkrete Macie-Preise.** Eine Drittquelle nennt für US East (N. Virginia)
0,10 $ pro Bucket und Monat, 0,01 $ pro 100.000 überwachte Objekte und
1,00 $ pro inspiziertem GB. Diese Zahlen wurden nicht gegen die AWS-Preisseite
verifiziert und stehen deshalb **nicht auf der Karte**. Die Karte sagt zu
Kosten nur "Preis pro GB inspiziert" — die Abrechnungslogik ist durch
AWS-Quellen gedeckt, die Beträge sind es nicht.

**"Sechsstellig" im Szenario** ist eine erzählerische Setzung für einen
Bestand dieser Größe, keine belegte Rechnung. Sie steht im Untertitel und in
der verworfenen Box als Szenario-Annahme, nicht als AWS-Aussage.

**Freikontingente.** AWS nennt an verschiedenen Stellen 30 Tage kostenlos für
Bucket-Inventar und Posture-Bewertung sowie ein Freikontingent für Sensitive
Data Discovery. Die genauen Grenzen unterscheiden sich zwischen den Quellen
und sind nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

**Posture und Automated Discovery stehen als zwei getrennte Boxen**, sind aber
Funktionen desselben Dienstes. Die Trennung ist didaktisch: Sie macht sichtbar,
dass die eine Hälfte ohne Objektzugriff arbeitet und die andere nicht — genau
die Unterscheidung, an der Kostenfragen hängen.

**Der Sensitivity Score ist als Zeile geführt, nicht als eigenes Element.**
Die Data Map als interaktives Artefakt lässt sich in einem statischen Diagramm
nicht sinnvoll darstellen.

**Der 90-Tage-Aufbewahrungs-Bucket für Discovery Results fehlt im Diagramm.**
Er ist fachlich wichtig für Audits und steht deshalb im Fließtext, hätte aber
eine zehnte Box gekostet, ohne den Prüfungskern zu schärfen.

**Pfeil 5 führt von der Allow List nach EventBridge**, obwohl Findings
konzeptuell aus der gesamten Analysekette entstehen, nicht aus der Allow List
allein. Die Allow List ist der letzte Filter vor dem Finding — der Pfeil zeigt
die Reihenfolge, nicht die Urheberschaft.

**Der Targeted Job speist ebenfalls Findings ein.** Gezeichnet ist nur der
gestrichelte Pfeil 6, der den Auslöser markiert (hoher Score → Job). Der
Rückweg der Job-Findings nach EventBridge ist implizit.

## Farbkonventionen dieser Karte

**Grün #3F8624** — S3 als Datenbestand und Quelle. Stil-Guide-Original
(S3, Ziel, erlaubt).

**Teal #0F7C8C** — Macie in allen fünf Ausprägungen: Bucket-Posture,
Automated Discovery, Custom Data Identifier, Allow List, Targeted Job. Der
Stil-Guide führt Macie ausdrücklich unter Teal ("Config, Macie"), und die
Batch-9-Konvention "Regel- und Konfigurationsinstanz" trägt hier ebenfalls:
Identifier und Allow Lists sind Regelwerke.

**Orange #D97706** — EventBridge + Lambda als Reaktionsschicht.
Stil-Guide-Original (Lambda).

**Rot #C7161D** — ausschließlich der verworfene Vollscan: Box-Rand und rotes X.

**Kein Gold, obwohl es ein Kostenargument ist.** Im Szenario-Vorschlag war
Gold + Rot gemeinsam geplant (Gold sagt *warum*, Rot sagt *dass* verworfen).
Beim Zeichnen zeigte sich: Es gibt keine eigene Box für "Kosten", die Gold
tragen könnte — der Kostengrund steht als Zeile **in** der verworfenen Box.
Eine Box mit rotem Rand und goldener Zeile wäre eine neue Konvention gewesen.
Stattdessen trägt das Label am roten X das Wort "Kosten" in Rot-dunkel. Wenn
Gold und Rot künftig auf einer Karte kombiniert werden sollen, braucht es
zwei getrennte Boxen; das ist hier bewusst nicht erzwungen worden.

**Keine neue Farbkategorie eingeführt.**
