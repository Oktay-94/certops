---
cardNumber: 58
slug: lake-formation-lf-tags-data-filters
title: "Data Lake mit Zeilen- und Spaltenrechten für drei Teams via Lake Formation"
services: ["AWS Lake Formation", "AWS Glue Data Catalog", "Amazon S3", "Amazon Athena", "Amazon Redshift Spectrum"]
domains: ["D1", "D3"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/access-control-underlying-data.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/storage-permissions.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/tag-based-access-control.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/data-filters-about.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/data-filtering-notes.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/hybrid-access-mode.html"
  - "https://docs.aws.amazon.com/lake-formation/latest/dg/lf-tag-considerations.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/reusing-query-results.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/lf-athena-limitations.html"
  - "https://aws.amazon.com/blogs/big-data/deprecation-of-lake-formations-governed-tables-feature/"
---

## Die Grundidee zuerst

Stell dir einen Aktenkeller mit Versichertenakten vor und zwei Arten, drei Abteilungen daraus bedienen zu lassen.

**Weg eins:** Du legst drei Kopien an. In der ersten sind die Akten fremder Regionen entfernt, in der zweiten die Namensfelder geschwärzt, die dritte ist vollständig. Das funktioniert genau so lange, bis ein Feld hinzukommt — dann schwärzt du dreimal. Und bis jemand eine Kopie eine Woche später zieht als die andere. Ab da hast du nicht drei Sichten auf einen Bestand, sondern drei Bestände, die auseinanderlaufen.

**Weg zwei:** Es gibt weiterhin genau eine Akte. Am Tresen sitzt jemand, der beim Ausgeben zusammenstellt, was du bekommst — er lässt Zeilen weg, die dich nichts angehen, und Felder, die du nicht sehen darfst. Was er dir reicht, sieht aus wie deine eigene Akte. Es ist ein Auszug aus derselben.

Der Mann am Tresen ist Lake Formation. Er kopiert nicht, er redigiert bei der Ausgabe.

Und jetzt der Punkt, an dem in der Prüfung die halben Antworten fallen: **Der Tresen ist kein Schloss.** Wer noch seinen alten Schlüssel zum Keller hat, geht über die Hintertreppe und nimmt das Original. Es ist keine Sicherheitslücke im Bild — es ist die Bauart. Wer Lake Formation einführt und die alten Schlüssel liegen lässt, hat einen sehr höflichen Tresen und keine Zugangskontrolle.

## Was es eigentlich ist — der Data Filter

Das zentrale Objekt ist kein Dienst und kein Bucket. Es ist ein **Data Filter**, der zu genau einer Tabelle im Data Catalog gehört und aus zwei Teilen besteht:

```json
{
  "TableName": "versicherte",
  "Name": "abrechnung_sued",
  "ColumnWildcard": { "ExcludedColumnNames": [] },
  "RowFilter": { "FilterExpression": "region = 'sued'" }
}
```

```json
{
  "TableName": "versicherte",
  "Name": "analytics_ohne_pii",
  "ColumnWildcard": { "ExcludedColumnNames": ["klarname", "versichertennr"] },
  "RowFilter": { "AllRowsWildcard": {} }
}
```

Zwei Filter, dieselbe Tabelle. Der erste nimmt alle Spalten und schränkt die Zeilen ein — **Zeilenebene**. Der zweite nimmt alle Zeilen und schneidet Spalten weg — **Spaltenebene**. Setzt du beide Einschränkungen in einen Filter, bekommst du **Zellenebene**.

Die `FilterExpression` hat mit Einschränkungen die Syntax einer `WHERE`-Klausel in PartiQL. Für „alle Zeilen" schreibst du nicht `1=1`, sondern setzt `AllRowsWildcard` — in der Konsole heißt das „Access to all rows".

Ausgewählt wird der Filter nicht beim Anlegen der Tabelle, sondern **beim Grant**: Du erteilst `SELECT` auf die Tabelle und gibst dabei an, welcher Filter gilt.

## Der Weg durch die Karte

### Der grüne Kasten plus Badge 1 — eine Kopie, und ihr Steckbrief

Die Versichertendaten liegen einmal in S3. Der Data Catalog beschreibt sie: Tabellen, Spalten, Typen. Der Katalog hält **Metadaten, keine Daten** — auf der Karte steht deshalb „Register, kein Wächter".

Das ist wichtiger, als es klingt. Die LF-Tags werden gleich an Katalogobjekte geheftet, nicht an S3-Objekte. Der Katalog ist die Fläche, auf der die Rechteverwaltung überhaupt stattfinden kann.

### Der Ausruf in der S3-Box — „S3-Rechte entziehen!"

Streng genommen ist das eine Handlungsanweisung und keine Diensteigenschaft. Sie steht trotzdem da, weil AWS sie selbst so formuliert: Das Lake-Formation-Berechtigungsmodell **verhindert den Zugriff auf S3-Speicherorte über die S3-API oder die Konsole nicht**, wenn IAM- oder S3-Richtlinien ihn erlauben. Um das zu unterbinden, muss man IAM-Policies an die Principals hängen, die genau das blockieren.

Das ist die Hintertreppe aus dem Bild, wörtlich aus der Doku.

### Der Registrierungsschritt, den die Karte nur andeutet

Damit Lake Formation überhaupt etwas zu sagen hat, wird der S3-Ort **registriert** — mit einer IAM-Rolle, die Lese- und Schreibrechte darauf hat. Danach arbeitet der Mechanismus, der die ganze Konstruktion trägt: **Credential Vending.**

Fragt Athena im Namen eines Nutzers Daten an, nimmt Lake Formation diese Rolle an und gibt der Engine kurzlebige, auf die Ressource eingeschränkte Anmeldedaten zurück. Die Folge, die AWS ausdrücklich hervorhebt: Nutzer müssen weder ihre S3-Bucket-Policies noch ihre IAM-Policies anpassen, und sie brauchen **keinen direkten S3-Zugriff**.

Das Bild dazu: Du bekommst nicht den Kellerschlüssel, sondern der Mann am Tresen geht für dich hinunter.

### Badge 2 — getaggt: von Ressourcen zu Merkmalen

Statt jede Tabelle einzeln zu berechtigen, werden **LF-Tags** an Datenbanken, Tabellen, Views und einzelne Spalten geheftet. Ein LF-Tag ist ein Schlüssel-Wert-Paar wie `classification=pii` oder `region=sued`, und ein Schlüssel darf mehrere Werte haben.

Die Vererbung geht dabei nach unten: Ein Tag an der Tabelle gilt für alle ihre Spalten, ein Tag an der Datenbank für alle ihre Tabellen. Platzhalter gibt es nicht — genau deshalb ist Vererbung der Weg, „alles darunter" zu meinen.

### Der Gold-Kasten — LF-Tags, und woher die 17 kommen

AWS rechnet den Nutzen an einem Beispiel vor: drei Principals, drei Datenbanken, sieben Tabellen. Über benannte Ressourcen wären das **17 einzelne Grants**. Tag-basiert sind es wenige, und sie bleiben wenige, wenn die achte Tabelle dazukommt — sie bekommt beim Anlegen ihr Tag und ist damit abgedeckt.

Die Zeile „nicht IAM-, nicht S3-Tags" ist keine Fußnote. Die Doku sagt es als eigene Warnung: LF-Tags sind nicht dasselbe wie IAM-Tags und nicht austauschbar. IAM-Tags steuern IAM-Policies, LF-Tags steuern Lake-Formation-Berechtigungen. Wer für Spaltenrechte eine IAM-Tag-Policy vorschlägt, hat die falsche Ebene erwischt.

### Badge 3 — präzisiert: wo Tags nicht reichen

Ein Tag ist ein Merkmal. Es kann sagen „diese Spalte ist PII", aber nicht „diese Zeile gehört zur Region Süd", weil eine Zeile kein Katalogobjekt ist. Deshalb ergänzen Data Filters, was Tags nicht ausdrücken können.

Die Karte legt eine strengere Reihenfolge nahe, als es sie gibt: Beides sind Wege zum selben Ziel, und beide werden beim Grant kombiniert.

### Der zweite Gold-Kasten plus Badge 4 — Athena prüft je Abfrage

Stellt ein Analyst eine SQL-Abfrage, prüft Lake Formation die Berechtigung und übergibt die Filter. Zwei Randbedingungen stehen auf der Karte, und beide sind belegt:

**Engine v3.** Seit November 2022 wirken feingranulare Regeln in Athena für alle unterstützten Datei- und Tabellenformate einschließlich Iceberg, Hudi und Hive — vorausgesetzt, die Athena Engine läuft in Version 3.

**Kein Result Reuse.** Die Athena-Doku führt gleich zwei Ausschlussgründe: Ergebniswiederverwendung ist nicht möglich, wenn der S3-Ort der Tabellenquelle als Data Location in Lake Formation registriert ist, und sie ist nicht möglich für Tabellen mit Zeilen- oder Spaltenrechten. Der Grund liegt auf der Hand — ein zwischengespeichertes Ergebnis kennt die Rechte dessen nicht, der es später abruft.

### Badge 5 — Redshift Spectrum, dieselben Regeln

Hier steht der eigentliche Gewinn gegenüber engine-spezifischen Lösungen: keine zweite Konfiguration. Dieselben Grants gelten ebenso für EMR und Glue ETL. **Eine Quelle der Wahrheit für Rechte**, nicht eine pro Werkzeug.

### Badge 6 — Sicht A und Sicht B aus derselben Tabelle

Die Abrechnung bekommt alle Spalten, aber nur Zeilen der Region Süd — der Zeilenfilter greift. Analytics bekommt alle Regionen, aber ohne Klarname und Versichertennummer — der Spaltenfilter greift. Zwei Teams, eine Tabelle, keine Kopie.

Beide sehen etwas, das sich anfühlt wie eine eigene Tabelle. Es ist dieselbe Datei in S3.

### Badge 7 — Sicht C: die Revision

Ein eigener Grant ohne Filter. Auch die Vollsicht ist eine Berechtigung und kein zweiter Datenbestand. Genau das ist der Unterschied zum Vorher-Zustand: Früher war „alles sehen" eine dritte Kopie, jetzt ist es die Abwesenheit eines Filters.

## Die entscheidende Unterscheidung

Drei Mechanismen werden in Prüfungsfragen gegeneinandergestellt, und sie arbeiten auf drei verschiedenen Ebenen:

| | IAM-Policy | S3-Bucket-Policy | Lake Formation |
|---|---|---|---|
| Kleinste Einheit | API-Aktion, Bucket, Präfix | Bucket, Präfix, Objekt | Datenbank, Tabelle, **Spalte, Zeile, Zelle** |
| Kennt Tabellen? | nein | nein | ja |
| Kann Spalten ausblenden? | nein | nein | ja |
| Gilt engineübergreifend? | nur als Objektzugriff | nur als Objektzugriff | ja, über Athena, Redshift Spectrum, EMR, Glue ETL |
| Greift bei direktem `s3:GetObject`? | ja | ja | **nein** |

Die letzte Zeile ist die Pointe: Lake Formation ist stärker, wo IAM zu grob ist, und wirkungslos, wo IAM einen Umweg offenlässt. Die beiden ersetzen sich nicht — sie werden mit UND verknüpft. Wer eine Lake-Formation-Berechtigung hat, aber keine IAM-Erlaubnis, die Abfrage-API aufzurufen, kommt nicht durch. Wer breite IAM-Rechte hat, aber keinen Grant, sieht auf registrierten Orten nichts.

## Die ehrliche Feinheit

**Erstens: `IAMAllowedPrincipals` ist der Grund, warum es „nicht wirkt".** Aus Rückwärtskompatibilität trägt Lake Formation auf bestehenden Katalog-Ressourcen die virtuelle Gruppe `IAMAllowedPrincipals` mit **Super**-Berechtigung. Solange die dranhängt, entscheidet IAM allein und die feingranularen Regeln greifen nicht. Die Doku formuliert es als Voraussetzung: Man muss diese Berechtigung entfernen — **oder** Principals und Ressourcen in den Hybrid Access Mode aufnehmen.

**Zweitens: Hybrid Access Mode ist kein Halbzustand, sondern ein Umschaltweg.** Er lässt zwei Pfade auf dieselben Katalogobjekte zu: ausgewählte, per Opt-in benannte Principals werden über Lake Formation autorisiert, alle übrigen laufen weiter über ihre IAM-Policies für S3 und Glue. Beim Registrieren eines S3-Ortes in diesem Modus werden standardmäßig nur `CREATE_TABLE`, `CREATE_PARTITION` und `UPDATE_TABLE` erzwungen. Für einen laufenden Betrieb heißt das: umstellen, ohne alle gleichzeitig auszusperren. AWS rät ausdrücklich davon ab, einen bereits von Lake Formation verwalteten Ort *zurück* in den Hybridmodus zu drehen.

**Drittens: Lake Formation filtert nicht selbst.** Es berechnet die erlaubte Spalten- und Zeilenmenge und übergibt sie; das eigentliche Wegschneiden macht die Abfrage-Engine. Daraus folgt die Grenze der ganzen Konstruktion: Wer nicht über eine der integrierten Engines geht, ist außerhalb des Wirkungskreises. Das ist dieselbe Aussage wie „S3-Rechte entziehen", nur eine Ebene abstrakter.

**Viertens: Spaltenrechte verstecken nicht immer die Metadaten.** Die Athena-Doku nennt einen Fall, in dem Nutzer ohne Datenrechte auf eine Spalte deren **Beschreibung** trotzdem sehen — nämlich wenn Spaltenmetadaten in den Table Properties liegen, was bei Apache Avro und bei eigenen SerDes vorkommt. AWS empfiehlt, die Table Properties daraufhin durchzusehen. Die Daten sind geschützt, der Spaltenname unter Umständen nicht.

**Fünftens: Governed Tables gibt es nicht mehr.** Cell-Level Security und Governed Tables wurden 2021 gemeinsam allgemein verfügbar und stehen in Kursmaterial fast immer nebeneinander. Der Support für Governed Tables endete zum **31.12.2024**; seitdem sind keine Transaktionen, keine Schreibvorgänge und keine Athena-Abfragen darauf mehr möglich, und ab dem 17.02.2025 scheitern die zugehörigen APIs. AWS nennt als Grund die Kundenpräferenz für offene Transaktionsformate — Iceberg, Hudi, Delta Lake — und als Migrationsweg ein `CREATE TABLE AS SELECT` nach Iceberg. **Geblieben ist die Sicherheitsfunktion.** Wer die beiden im Gedächtnis gekoppelt hat, wählt eine Option, die es nicht mehr gibt.

**Sechstens, als Grenzwerte:** Auf einer Tabelle darf es beliebig viele Data Filters geben, aber **ein Principal kann höchstens 100 davon** auf einer Tabelle nutzen. Zellenebene funktioniert nicht auf verschachtelten Spalten, Views und Resource Links, und `SELECT INTO` wird nicht unterstützt. Auf der Tag-Seite gilt: Ein Konto darf bis zu **1.000 LF-Tag-Expressions** anlegen, und einem einzelnen Principal lassen sich höchstens **50 davon** für einen Grant zuweisen.

**Siebtens, und das ist die unauffälligste Regel der ganzen Karte:** Führt eine LF-Tag-Expression dazu, dass ein Principal nur einen **Teil** der Spalten erreicht, dann werden Berechtigungen, die vollen Spaltenzugriff voraussetzen — `Alter`, `Drop`, `Insert`, `Delete` — gar nicht erteilt. Stattdessen bleibt `Describe` übrig. Und `All` beziehungsweise `Super` schrumpft in diesem Fall auf `Select` und `Describe` zusammen. Wer also `classification=pii` von einem Team fernhält und demselben Team gleichzeitig Schreibrechte auf die Tabelle geben will, bekommt beides nicht zusammen. Das ist kein Fehler, sondern die logische Folge daraus, dass man eine Zeile nicht schreiben kann, deren Spalten man nicht kennt.

## Syntax lesen — die eine IAM-Zeile, die niemand vergessen darf

Lake Formation ersetzt IAM nicht, es setzt darauf auf. Diese Policy braucht der Principal zusätzlich zu seinem Grant:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "lakeformation:GetDataAccess",
      "Resource": "*"
    }
  ]
}
```

```
lakeformation:GetDataAccess  ->  "hol mir die temporären Anmeldedaten"
Resource: "*"                ->  MUSS "*" sein; etwas anderes wird nicht unterstützt
```

Bei Athena braucht **der Nutzer selbst** diese Berechtigung. Bei den übrigen integrierten Diensten braucht sie deren Ausführungsrolle. Ohne sie kommt kein Zugriff zustande, egal wie sauber die Grants sitzen — der Tresen greift nach dem Schlüssel und darf ihn nicht anfassen.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- keine zweite und keine dritte Kopie des Datensatzes
- kein ETL-Job, der maskierte Auszüge erzeugt und nachts synchron hält
- keine Views je Team, die bei jeder Schemaänderung nachgezogen werden müssen
- keine Bucket-Policy je Abteilung und kein Präfix je Region
- keine zweite Rechtekonfiguration für Redshift Spectrum
- kein Sichtschutz im Dashboard, der beim Export verschwindet

Übrig bleiben: eine Tabelle, ein paar Tags, zwei Filter und drei Grants.

## Wenn du dir eine Sache merkst

**Feingranulare Rechte über alle Engines: Lake Formation filtert an der Quelle, nicht im Dashboard — und es wirkt erst, wenn `IAMAllowedPrincipals` weg ist und die direkten S3-Rechte entzogen sind.**

IAM kennt Buckets und Präfixe, aber keine Spalten. Eine Bucket-Policy kennt Objekte, aber keine Zeilen. Ein ETL-Job kann drei Sichten erzeugen — genau die drei Kopien, die abgeschafft werden sollen. Und QuickSight-RLS filtert im Dataset, gilt für ein Werkzeug und nicht für vier.

## Prüfungsknackpunkte

**Signalwörter:** „column-level and row-level permissions", „without duplicating the dataset", „the same permissions must apply across Athena and Redshift Spectrum", „centrally manage access as the number of tables grows", „mask personally identifiable columns for one team". Sobald „column-level" oder „row-level" fällt, ist jede reine IAM-Antwort erledigt.

**Warum eine reine IAM-Antwort hier verliert:** IAM-Policies geben Buckets und Präfixe frei oder sperren sie. Sie können keine Spalte ausblenden und keine Zeile filtern, weil sie die Tabelle gar nicht kennen.

**Warum eine S3-Bucket-Policy hier verliert:** Dieselbe Ebene, dasselbe Problem — Objekte statt Spalten. Sie könnte höchstens Regionen in getrennte Präfixe zwingen, und dann sind wir wieder bei drei Beständen.

**Warum ein Glue-ETL-Job hier verliert:** Er erzeugt genau die Kopien, die das Szenario abschaffen will. Steht „ohne den Datensatz zu duplizieren" im Text, ist jede Transformationsantwort aussortierbar.

**Warum QuickSight-RLS hier verliert:** Es filtert im Dataset eines BI-Werkzeugs. Gefragt sind gleiche Rechte für Athena **und** Redshift Spectrum — QuickSight-RLS gilt für keinen von beiden. Umgekehrt gilt: Fragt ein Szenario nach eingebetteten Dashboards für Nutzer ohne AWS-Login, ist es Karte 56 und nicht diese hier.

**Warum Governed Tables hier verliert:** Die Funktion ist seit dem 31.12.2024 abgeschaltet. Sie klingt richtig, weil sie im Kursmaterial neben Cell-Level Security steht, und sie existiert nicht mehr.

**Die Falle, die keine Antwortoption ist:** Alles korrekt eingerichtet, `IAMAllowedPrincipals` nicht entfernt — und alle sehen weiterhin alles. In der Praxis der häufigste Grund für „Lake Formation läuft, wirkt aber nicht".
