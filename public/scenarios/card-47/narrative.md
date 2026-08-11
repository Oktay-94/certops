---
cardNumber: 47
slug: macie-automated-discovery-targeted-job-immenried-versicherung-sampling-vor-vollscan
title: "Amazon Macie · Sensitive Data Discovery — erst breit sampeln, dann gezielt tief"
services:
  - Amazon Macie
  - Amazon S3
  - Amazon EventBridge
  - AWS Lambda
  - AWS Organizations
domains:
  - D1
badgeCount: 6
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-asdd-how-it-works.html"
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-asdd-account-enable.html"
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-asdd-account-configure.html"
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-scoring-s3.html"
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-results-repository-s3.html"
  - "https://docs.aws.amazon.com/macie/latest/user/discovery-asdd-results-s3-findings.html"
  - "https://docs.aws.amazon.com/macie/latest/user/allow-lists-options.html"
  - "https://docs.aws.amazon.com/macie/latest/user/custom-data-identifiers.html"
  - "https://docs.aws.amazon.com/macie/latest/user/findings.html"
  - "https://docs.aws.amazon.com/cli/latest/reference/macie2/create-custom-data-identifier.html"
  - "https://aws.amazon.com/about-aws/whats-new/2022/11/amazon-macie-automated-sensitive-data-discovery"
  - "https://aws.amazon.com/blogs/security/use-amazon-macie-for-automatic-continual-and-cost-effective-discovery-of-sensitive-data-in-s3/"
---

## Die Grundidee zuerst

Die Immenried Versicherung betreibt rund 1.400 S3-Buckets in 30 Accounts. Vor einem DSGVO-Audit stellt die Aufsicht zwei Fragen: Wo liegen personenbezogene Daten, und sind diese Buckets öffentlich erreichbar? Niemand im Haus kann das beantworten.

**Weg eins:** Du willst wissen, in welchen deiner 1.400 Umzugskisten Personalakten liegen. Also packst du jede Kiste aus, liest jedes Blatt, sortierst alles zurück. Das Ergebnis ist vollständig und richtig. Es dauert Monate, und du bezahlst nach gelesenen Seiten.

**Weg zwei:** Du öffnest jede Kiste, greifst blind drei Blätter heraus und schaust sie an. Danach weißt du nicht, was genau in Kiste 812 liegt — aber du weißt, dass dort dreimal etwas Personenbezogenes obenauf lag und in Kiste 44 dreimal nichts. Jetzt packst du **die vierzig auffälligen Kisten** vollständig aus.

Der zweite Weg findet dasselbe. Er kostet einen Bruchteil, weil er die teure Arbeit erst macht, nachdem er weiß, wo sie sich lohnt.

**Automated Discovery sagt dir, wo du suchen musst. Der Targeted Job sagt dir, was dort liegt.** Diese Reihenfolge ist die ganze Karte, und sie ist auch die Antwort auf die Kostenfrage im Untertitel: Macie rechnet nach inspizierter Datenmenge ab.

## Was es eigentlich ist — der Custom Data Identifier

Der zentrale Datensatz dieser Karte ist kein Job und kein Scan, sondern eine Erkennungsregel. Interne Versicherungsnummern im Format `VS-DE-########` kennt kein eingebauter Identifier — also definierst du einen:

```json
{
  "name": "vs-nummer-de",
  "regex": "VS-DE-[0-9]{8}",
  "keywords": ["Versicherungsnummer", "Policennummer", "VSNR"],
  "maximumMatchDistance": 50,
  "ignoreWords": ["VS-DE-00000000"],
  "severityLevels": [
    { "occurrencesThreshold": 1,   "severity": "LOW" },
    { "occurrencesThreshold": 100, "severity": "HIGH" }
  ]
}
```

Zeile für Zeile: `regex` ist das Muster, bis zu 512 Zeichen. `keywords` sind bis zu 50 Kontextwörter — eines davon **muss** vor dem Treffer stehen, Groß- und Kleinschreibung egal. `maximumMatchDistance` ist der erlaubte Abstand zwischen Kontextwort und Treffer, 1 bis 300 Zeichen, Standardwert 50.

Ohne die Proximity-Regel schlägt jede Zeichenkette im passenden Format an — auch die in einer Beispieldatei der Entwicklungsabteilung. Mit ihr nur dort, wo tatsächlich ein Kontextwort in Reichweite steht.

`ignoreWords` sind bis zu zehn Ausnahmen, hier groß- und kleinschreibungsempfindlich. Und `severityLevels` bindet die Schwere an die Trefferzahl; ohne diesen Block vergibt Macie **allen** Funden dieses Identifiers die Severity Medium, unabhängig davon, ob eine oder zehntausend Nummern in der Datei stehen.

## Der Weg durch die Karte

### Kasten — der S3-Bestand

Grün, ganz links, mit drei Zeilen, die zusammen das Problem beschreiben: 1.400 Buckets, 30 Accounts, Inhalt unbekannt. Der letzte Punkt ist der teure.

Zwei Dinge muss man über die Ausgangslage wissen, bevor der erste Pfeil Sinn ergibt. Macie arbeitet **pro Region**: Was in `eu-central-1` aktiviert ist, sagt nichts über `eu-west-1`. Und über 30 Accounts hinweg läuft es über den Macie-Administrator der Organization — der aktiviert, konfiguriert und sieht die Ergebnisse; ein Mitgliedskonto sieht nur die eigenen.

### Pfeil 1 — Bucket-Posture, die kostenlose Hälfte

Sobald Macie aktiviert ist, inventarisiert es alle S3-Buckets der Region und bewertet sie fortlaufend: öffentlich zugänglich, unverschlüsselt, geteilt oder repliziert mit Accounts außerhalb der Organization.

**Das beantwortet die zweite Audit-Frage vollständig, ohne ein einziges Objekt zu lesen.** Diese Bewertung ist von der Datenanalyse getrennt und erzeugt keine Inspektionsgebühr. Wer nur wissen will, welche Buckets offen stehen, braucht überhaupt keinen Scan.

Das ist auch der Grund, warum diese Box im Ablauf vor allen anderen kommt: Sie ist die einzige, die sofort etwas liefert und nichts kostet.

### Pfeil 2 — Automated Discovery, breit und billig

Macie wählt per Sampling repräsentative Objekte aus jedem Bucket, analysiert sie und baut daraus eine Data Map plus einen **Sensitivity Score** je Bucket. Um die zu scannende Menge klein zu halten, gruppiert es Ressourcen nach Merkmalen wie Bucket-Name, Dateityp und Präfix und bevorzugt Objekte, die neu sind oder sich geändert haben.

Die Skala ist wichtiger, als sie aussieht. Beim ersten Einschalten bekommt **jeder** Bucket den Wert 50 und das Label *Not yet analyzed* — 50 heißt nicht „mittelsensibel", sondern „noch nichts gesehen". Leere Buckets bekommen 1 und *Not sensitive*. Findet Macie etwas, steigt der Wert, findet es nichts, sinkt er. Und wenn Berechtigungen Macie den Zugriff verwehren, setzt es den Bucket **zurück auf 50** — ein Bucket, den Macie nicht lesen darf, sieht aus wie ein Bucket, den Macie noch nicht gelesen hat.

Die Kartenzeile „startet in 48 h" ist belegt: Statistiken und Ergebnisse beginnen binnen 48 Stunden zu erscheinen.

### Pfeil 3 — Custom Data Identifier verfeinert die Kriterien

Die eingebauten Managed Data Identifiers decken Kreditkartennummern, AWS-Zugangsschlüssel, Pass- und Steuernummern vieler Länder ab — deutsche Versicherungsnummern nicht. Der Identifier aus dem Abschnitt oben schließt genau diese Lücke.

Er **ersetzt** die Managed Identifiers nicht, er kommt dazu. In der Konfiguration verlangt Macie mindestens einen von beiden; die Listen existieren nebeneinander.

### Pfeil 4 — die Allow List sticht alles

Die Testdaten-Buckets enthalten synthetische Namen, die als personenbezogen gemeldet werden und jeden Report fluten würden. Dagegen hilft eine Allow List: entweder eine zeilenweise Textdatei in S3 oder ein Regex, der direkt in Macie liegt.

Der prüfungsrelevante Satz steht so im User Guide: Trifft Text auf einen Eintrag der Allow List, meldet Macie ihn **nicht** — auch dann nicht, wenn er die Kriterien eines Managed oder Custom Data Identifier erfüllt.

Das Bild dazu: Die Allow List ist kein weiterer Filter in der Reihe, sondern der Stempel „geprüft, kein Fall" auf dem Umschlag, der die ganze Prüfung dahinter überstimmt.

Eine Falle steckt darin: Liegt die Liste in S3 und Macie kann sie nicht lesen oder nicht entschlüsseln, benutzt Macie sie **nicht** — und meldet dann genau die Testdaten, die sie unterdrücken sollte. Die Liste ist damit eine Abhängigkeit, kein reines Regelwerk.

### Pfeil 5 — Findings ohne die Daten selbst

Macie meldet, *dass* und *wo* etwas gefunden wurde. Der sensible Inhalt steht nicht im Finding; je nach Dateityp enthält es die **Position von bis zu 15 Fundstellen**, nicht deren Inhalt.

Parallel entstehen die *Sensitive Data Discovery Results* — Analyseprotokolle für jedes untersuchte Objekt, auch für solche ohne Fund und solche, die sich nicht lesen ließen. Macie hält Findings und Ergebnisse **90 Tage**. Für Langzeitspeicherung konfigurierst du einen eigenen S3-Bucket plus KMS-Schlüssel; erst dann sind die Protokolle dauerhaft abrufbar. Für ein Audit ist genau dieser Bucket die Evidenz, nicht die Konsole.

Von den Findings geht es über EventBridge weiter: Ein öffentlicher Bucket mit einem Personendaten-Fund löst eine Lambda aus, die Public Access blockiert. Das ist die orange Box rechts — Reaktion, nicht Erkennung.

### Kasten — EventBridge und Lambda

Die einzige orange Box der Karte, und die einzige, die etwas verändert. Alles links davon beobachtet.

Der Auslöser ist bewusst eng: nicht „irgendein Finding", sondern die Kombination aus Personendaten-Fund **und** öffentlichem Bucket. Ein sensibler Bucket, der korrekt verschlossen ist, darf keine automatische Reaktion auslösen — sonst schließt die Lambda irgendwann einen Bucket, den ein Fachbereich absichtlich geöffnet hat.

Was die Lambda tut, ist eine bewusst kleine Handlung: `PutPublicAccessBlock` auf den betroffenen Bucket. Nicht löschen, nicht verschieben, nicht verschlüsseln. Der Zustand vor dem Fund lässt sich wiederherstellen, die Daten bleiben unangetastet, und der Fachbereich merkt es, weil sein Zugriff nicht mehr geht — was in einem Audit-Kontext die gewünschte Nebenwirkung ist.

Dass die Regel an EventBridge hängt und nicht direkt an Macie, hat einen praktischen Grund: An dieselbe Regel lässt sich ein zweites Ziel hängen — eine SNS-Benachrichtigung an den Datenschutzbeauftragten — ohne dass jemand die Lambda anfasst.

### Pfeil 6 — der Targeted Job auf die hohen Scores

Erst jetzt, auf den Buckets mit hohem Sensitivity Score, läuft ein Sensitive Data Discovery Job: gezielt und vollständig statt stichprobenartig. Beide Verfahren dürfen gleichzeitig laufen.

Das ist die Evidenz, die dem Prüfer vorgelegt wird — und der einzige Schritt der Karte, der wirklich nach Datenmenge abgerechnet wird. Vierzig Buckets vollständig zu lesen ist bezahlbar. Vierzehnhundert nicht.

### Der verworfene Weg — Vollscan über alle 1.400 Buckets

Ein Discovery Job über den gesamten Bestand liefert dasselbe Ergebnis wie der zweistufige Weg, nur zum Vielfachen des Preises. Er ist nicht falsch — er ist unnötig. Sampling existiert genau dafür.

Deshalb steht am roten X das Wort **Kosten**: Diese Option scheitert nicht an der Technik.

## Die entscheidende Unterscheidung

| | Automated Sensitive Data Discovery | Sensitive Data Discovery Job |
|---|---|---|
| Auswahl | Stichprobe, von Macie gesteuert | von dir festgelegte Buckets |
| Tiefe | repräsentativ | vollständig |
| Zeitverhalten | laufend | einmalig oder geplant |
| Ergebnis | Data Map und Sensitivity Score | Fundliste je Objekt |
| Rolle im Audit | Wegweiser | Beweis |
| Kostentreiber | kleine, gleichmäßige Menge | gesamte Bucketgröße |

## Die ehrliche Feinheit

**„Default an" gilt pro Account, nicht pro Bestand.** Für einen frisch aktivierten Macie-Account ist Automated Discovery eingeschaltet, und in einer Organization ist es standardmäßig für alle vorhandenen und alle neu hinzukommenden Mitgliedskonten aktiv — aber erst, nachdem der Macie-Administrator es für die Organization eingeschaltet hat. Wer Macie seit Jahren in einem Account laufen hat, muss es dort aktiv nachziehen.

Dazu kommt die Regionalität. Dreißig Accounts mit Buckets in drei Regionen sind neunzig Aktivierungen, nicht eine. Die Karte zeigt einen Strang; die Wirklichkeit ist ein Raster aus Accounts und Regionen. Für die Prüfung reicht der Satz: **Macie ist regional, die Organization-Sicht kommt vom Administrator-Account.**

Der zweite Punkt betrifft die Aufbewahrung. Der User Guide sagt an drei Stellen 90 Tage für Findings; die Dokumentationsübersicht auf `aws.amazon.com` sagt 30. Zwei AWS-Quellen, ein Widerspruch — deshalb steht die Zahl nicht auf der Karte. Nach der Regel „User Guide vor Übersichtsseite" gilt 90, und wer die Zahl in einer Prüfung braucht, sollte sie am Wort *retention* im aktuellen User Guide festmachen, nicht am Gedächtnis.

Der dritte Punkt ist der, den Kostenrechnungen übersehen: Der Sensitivity Score ist **keine Vollständigkeitsaussage**. Ein Bucket mit Score 20 kann trotzdem eine einzige Datei mit zehntausend Versicherungsnummern enthalten, wenn die Stichprobe sie nicht getroffen hat. Automated Discovery priorisiert nach Wahrscheinlichkeit, nicht nach Garantie. Wer dem Prüfer „in diesem Bucket liegt nichts" sagen will, braucht den Targeted Job — beim Wegweiser bleibt es beim „hier ist bisher nichts aufgefallen".

Das ist keine Schwäche der Umsetzung, sondern der Preis, den die Stichprobe kostet, und er ist bewusst bezahlt. Die Auswahl läuft täglich weiter und bevorzugt Buckets, über die Macie am wenigsten weiß — ein neu angelegter Bucket oder einer aus einem gerade beigetretenen Mitgliedskonto rückt nach vorn. Über Wochen wird das Bild dichter, aber es wird nie vollständig, und es soll es auch nicht werden. Für die Prüfung lohnt sich der Satz: **Der Score ist eine Aussage über die bisherige Beobachtung, nicht über den Bucketinhalt.**

## Syntax lesen

Ein Finding ist ein JSON-Dokument, und die zwei Felder, an denen Automatisierung hängt, stehen weit auseinander:

```json
{
  "type": "SensitiveData:S3Object/Personal",
  "severity": { "description": "High", "score": 3 },
  "resourcesAffected": {
    "s3Bucket": { "name": "vertraege-2024", "publicAccess": { "effectivePermission": "PUBLIC" } },
    "s3Object": { "key": "policen/2024-q3.csv" }
  },
  "classificationDetails": {
    "result": { "customDataIdentifiers": { "detections": [ { "name": "vs-nummer-de", "count": 4120 } ] } }
  }
}
```

Beachte, was **nicht** darin steht: keine einzige Versicherungsnummer. Nur `count`, `name`, Bucket und Key.

`severity` trägt eine Beschreibung *und* einen numerischen Score — Filterregeln in EventBridge greifen sicherer am `type`-Präfix `SensitiveData:` als an einer Zahl, deren Zuordnung man nachschlagen muss.

Und `resourcesAffected.s3Bucket.publicAccess` ist der Grund, warum die Reaktion überhaupt automatisierbar ist: Erst die Kombination aus „enthält Personendaten" und „ist öffentlich" rechtfertigt, dass eine Lambda ungefragt den Zugriff schließt.

## Was du dadurch nicht baust

Keinen Schutz. Macie findet und meldet; es verschlüsselt nichts, es sperrt nichts. Alles, was danach passiert, hängt an EventBridge und eigenem Code.

Keine Abdeckung außerhalb von S3. RDS, DynamoDB und EFS analysiert Macie nicht. Man erreicht sie nur, indem man Auszüge nach S3 legt — ein Umweg, keine Funktion.

Keine Einsicht in die Fundstellen aus dem Finding heraus. Es gibt einen eigenen, bewusst abgesicherten Vorgang, um Beispiele temporär abzurufen; er verlangt einen kundenverwalteten KMS-Schlüssel und funktioniert nur, wenn Objekt, Finding und Analyseprotokoll in derselben Region liegen.

Keine dauerhafte Beweiskette ohne Zutun. Ohne konfigurierten Ergebnis-Bucket sind die Protokolle nach 90 Tagen weg.

## Wenn du dir eine Sache merkst

**Erst breit und billig, dann tief und teuer — nie umgekehrt und nie beides in einem Schritt.**

Steht in der Frage „where does sensitive data reside" oder „across the entire estate", ist es Automated Discovery.

Steht dort „complete inventory of a specific bucket" oder „evidence for the auditor", ist es der Targeted Job.

Steht dort „reduce false positives" oder „ignore our test data", ist es die Allow List — und die schlägt jeden Identifier.

## Prüfungsknackpunkte

**Signalwörter für Macie:** *discover sensitive data*, *personally identifiable information*, *GDPR*, *where does sensitive data reside*, *proprietary data format*.

**Warum ein Vollscan über alles verliert:** Er ist technisch richtig und wirtschaftlich falsch. Fragen, die *cost-effective* enthalten, verlangen die zweistufige Reihenfolge.

**Warum „Custom Data Identifier statt Managed" verliert:** Der Custom Identifier ergänzt, er ersetzt nicht. Für ein Eigenformat ist er zwingend, für Kreditkarten ist er überflüssige Arbeit.

**Warum „Suppression Rule" nicht dasselbe ist wie eine Allow List:** Eine Suppression Rule verbirgt Findings **nachdem** sie entstanden sind, und du bezahlst die Analyse trotzdem. Eine Allow List verhindert, dass der Fund überhaupt gemeldet wird.

**Warum „Macie zeigt die gefundenen Nummern" verliert:** Findings enthalten Ort, Typ und Anzahl. Der Inhalt bleibt draußen — das ist Absicht, kein Mangel.

**Warum „GuardDuty" oder „Inspector" hier verlieren:** Inspector fragt, ob die Software verwundbar ist. GuardDuty fragt, ob sich jemand auffällig verhält. Macie fragt als einziges, ob der **Inhalt** schützenswert ist.

**Die Score-Falle:** Ein Bucket, den Macie nicht lesen darf, steht auf 50 — genau wie ein noch nicht analysierter. Wer nach hohen Scores filtert, übersieht ihn; wer nach dem Label *Not yet analyzed* sucht, findet ihn.
