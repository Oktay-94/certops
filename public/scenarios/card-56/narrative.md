---
cardNumber: 56
slug: quicksight-spice-rls-embedding
title: "Self-Service-BI und eingebettete Händler-Dashboards mit QuickSight"
services: ["Amazon QuickSight", "Amazon Athena", "Amazon RDS for PostgreSQL", "Amazon S3", "AWS Glue Data Catalog"]
domains: ["D1", "D3"]
badgeCount: 8
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/quick/latest/userguide/spice.html"
  - "https://docs.aws.amazon.com/quick/latest/userguide/row-level-security.html"
  - "https://docs.aws.amazon.com/quick/latest/userguide/restrict-access-to-a-data-set-using-row-level-security.html"
  - "https://docs.aws.amazon.com/quick/latest/userguide/quicksight-dev-rls-tags.html"
  - "https://docs.aws.amazon.com/quick/latest/userguide/refreshing-data.html"
  - "https://aws.amazon.com/blogs/business-intelligence/reimagine-business-intelligence-amazon-quicksight-evolves-to-amazon-quick-suite/"
  - "https://docs.aws.amazon.com/cli/latest/reference/quicksight/generate-embed-url-for-anonymous-user.html"
  - "https://aws.amazon.com/athena/pricing/"
---

## Die Grundidee zuerst

Stell dir ein Zeitungsarchiv im Keller vor und zwei Arten, damit zu arbeiten.

**Weg eins:** Jeder, der etwas wissen will, geht selbst hinunter. Der Archivar zieht das ganze Regal heraus, blättert es durch und rechnet nach Seiten ab, die er dafür anfassen musste — nicht nach dem, was am Ende auf dem Zettel steht. Zehn Leute, zehn Gänge, zehn Rechnungen. Und wer eine Frage zweimal stellt, zahlt zweimal.

**Weg zwei:** Einmal in der Nacht trägt der Archivar die Mappen hoch in den Lesesaal. Am nächsten Tag lesen alle im Lesesaal. Der Keller bleibt zu. Egal wie oft jemand umblättert — es entsteht kein neuer Gang nach unten.

Der Lesesaal ist SPICE. Der Keller ist Athena auf S3, und der Archivar rechnet nach gescanntem Volumen ab, nicht nach Ergebniszeilen.

Und dann kommt die zweite Hälfte der Aufgabe dazu: 300 Händler sollen mitlesen dürfen, aber jeder nur seine eigenen Mappen. Der Lesesaal löst das nicht dadurch, dass er den Leuten sagt, sie sollen wegschauen. Er löst es dadurch, dass die fremden Seiten **gar nicht erst auf dem Tisch liegen**. Das ist Row-Level Security: kein Sichtschutz auf der Anzeige, sondern eine Filterung im Dataset.

## Was es eigentlich ist — das Dataset mit Tag-Regeln

Das zentrale Objekt dieser Karte ist kein Dashboard. Es ist ein **Dataset**, an dem zwei Dinge hängen: ein Importmodus und eine Regelkonfiguration. Genau das steht in `CreateDataSet`:

```json
{
  "ImportMode": "SPICE",
  "RowLevelPermissionTagConfiguration": {
    "Status": "ENABLED",
    "TagRules": [
      {
        "TagKey": "tag_haendler_id",
        "ColumnName": "haendler_id",
        "TagMultiValueDelimiter": ",",
        "MatchAllValue": "*"
      }
    ]
  }
}
```

Lies das von oben nach unten. `ImportMode: SPICE` heißt: Die Daten werden einmal hereingeholt und liegen danach im Speicher — die Alternative wäre `DIRECT_QUERY`. `TagKey` ist der Name, unter dem dein Backend später einen Wert mitgibt. `ColumnName` ist die Spalte im Dataset, auf die dieser Wert angewendet wird. `TagMultiValueDelimiter` erlaubt mehrere Werte in einem Aufruf, `MatchAllValue` ist das Zeichen, mit dem du „alle Werte dieser Spalte" meinst, ohne sie aufzuzählen.

Sechs Zeilen JSON ersetzen 300 Datasets. Das ist der ganze Trick.

## Der Weg durch die Karte

### Der Kasten links oben — S3 als Ablage, nicht als Antwortgeber

Sieben Jahre Verkaufshistorie liegen als Parquet im Bucket, partitioniert. S3 kann diese Dateien halten, verteilen und versionieren. Was S3 **nicht** kann: sie beantworten. Ein Bucket hat keine SQL-Schnittstelle.

Das Bild dazu: ein Regal voller Ordner ohne Register. Alles ist da, aber niemand weiß, was drinsteht.

### Badge 1 — Crawler oder DDL: das Register entsteht

Ein Glue Crawler liest Stichproben und trägt Tabelle plus Partitionen in den Data Catalog ein, oder jemand schreibt das DDL von Hand. Ab jetzt existiert ein Eintrag „Tabelle `verkaeufe`, Spalten so und so, Partitionen nach Jahr und Monat".

Ohne diesen Schritt gäbe es im Bucket nur Bytes. Danach gibt es eine Tabelle.

### Der lila Kasten — Data Catalog: Register, kein Speicher

Der Data Catalog beschreibt, wo etwas liegt und wie es aufgebaut ist. Er speichert die Daten selbst nicht — keine einzige Verkaufszeile liegt darin. Er ist das Findbuch des Archivs, nicht das Archiv.

Das ist die Verwechslung, die auf Karte 57 als eigene Falle wiederkehrt: Der Katalog **weiß**, er **macht** nichts.

### Badge 2 — Athena bekommt das Schema

Athena holt sich die Tabellendefinition aus dem Katalog und kann damit SQL auf die S3-Objekte anwenden. Kein Cluster, keine vorgehaltene Kapazität.

Und hier steht die Zahl, die alles Weitere erklärt: Abgerechnet werden **die gescannten Bytes, aufgerundet auf das nächste Megabyte, mit 10 MB Minimum pro Abfrage**. DDL-Anweisungen, Partitionsverwaltung und fehlgeschlagene Abfragen kosten nichts — **abgebrochene** Abfragen dagegen schon, nach dem, was bis zum Abbruch gescannt wurde.

Dass die Historie als Parquet und partitioniert vorliegt, ist deshalb keine Kosmetik. AWS rechnet es auf der Preisseite selbst vor: Eine Tabelle mit drei gleich großen Spalten, 3 TB als unkomprimierter Text, zwingt Athena bei einer Abfrage auf eine einzige Spalte trotzdem, alle 3 TB zu lesen — Textformate lassen sich nicht aufteilen. Mit GZIP bei 3:1 wird daraus 1 TB. Mit GZIP **und** Parquet liest Athena nur die eine gefragte Spalte und scannt 0,33 TB. AWS beziffert die Ersparnis durch Komprimieren, Partitionieren und Spaltenformat mit 30 bis 90 Prozent.

Merk dir die Richtung: Athena rechnet, QuickSight zeigt. Ein Dashboard-Klick ist keine Athena-Abfrage — es sei denn, du baust ihn dazu.

### Badge 3 — Dataset A: das Ergebnis wandert in SPICE

Die Historienabfrage läuft **einmal beim Anlegen des Datasets und danach bei jedem geplanten Refresh**. Genau so steht es in der Doku: Wer eine Quelle nutzt, die pro Abfrage abrechnet, zahlt beim Erstimport und beim Refresh — und sonst nicht.

Das ist der Moment, in dem der Archivar die Mappen hochträgt.

### Der Kasten unten links plus Badge 4 — Dataset B aus RDS

Die tagesaktuellen Aufträge kommen aus der operativen PostgreSQL-Datenbank. Auch hier wird importiert, aber aus einem anderen Grund: RDS ist eine OLTP-Datenbank. Sie beantwortet kurze Transaktionen für das Tagesgeschäft. Dreißig Leute, die gleichzeitig Kreuztabellen über sieben Jahre aufziehen, sind keine Transaktionslast — das ist ein Scan-Gewitter auf einer Maschine, die dafür nicht ausgelegt ist.

Import entkoppelt hier nicht Kosten, sondern **Verfügbarkeit**.

### Der orange Kasten — SPICE, und die eine Entscheidung darin

SPICE steht für Super-fast, Parallel, In-memory Calculation Engine. Beide Datasets liegen darin als Momentaufnahme. In der Enterprise Edition sind sie im Ruhezustand verschlüsselt.

Zwei Details, die selten irgendwo stehen:

**Während eines Refresh zeigt das Dashboard weiter die vorherige Momentaufnahme.** Es gibt kein Loch, in dem Nutzer eine leere Seite sehen.

**SPICE-Kapazität gehört zu einer Region, nicht zum Konto.** Sie wird von allen geteilt, die in dieser Region arbeiten; andere Regionen haben null Kapazität, bis jemand dort welche kauft. Ein Administrator sieht den Verbrauch je Region und kann nachkaufen oder ungenutzte Kapazität freigeben.

Der Refresh selbst kennt zwei Formen. Ein **Full Refresh** holt alles neu und steht in beiden Editionen zur Verfügung. Ein **Incremental Refresh** holt nur ein definiertes Rückblickfenster und ersetzt darin alles — Einfügungen, Löschungen, Änderungen. Er ist der Enterprise Edition vorbehalten und nur für SQL-basierte Quellen möglich. Für dieses Szenario passt Full Refresh nach dem nächtlichen ETL: Das Fenster wäre der ganze neue Tag, und der Aufwand, es sauber abzugrenzen, spart nichts.

Die Alternative steht kursiv auf der Karte: Direct Query. Dann fragt jedes Visual bei jedem Laden die Quelle — beim Öffnen eines Datasets, einer Analyse oder eines Dashboards, und auch beim Aktualisieren der Seite. Frisch, aber jeder Klick des Managements wird zu einem neuen Athena-Scan. Nebenbei: Filtersteuerelemente aktualisieren sich auch im Direct-Query-Modus nur alle 24 Stunden. „Direct Query" heißt also nicht „alles ist immer live".

### Badge 5 — SPICE speist Analyse und Dashboard

Die Geschäftsführung filtert selbst, baut eigene Visuals, wartet auf kein IT-Ticket. Das ist der Self-Service-Teil der Anforderung, und er kostet zwischen zwei Refreshes nichts Zusätzliches — weder Athena-Scan noch RDS-Last.

### Badge 6 — dasselbe Dataset, jetzt gefiltert

Auf das Dataset werden Row-Level-Security-Regeln gelegt. Entscheidend ist die Reihenfolge: **erst filtern, dann liefern.** Wer nicht berechtigt ist, bekommt die Zeilen nicht ausgeblendet, sondern gar nicht erst.

Ein Dashboard bedient damit alle 300 Händler. Nicht 300 Dashboards, nicht 300 Datasets.

Warum die Wirkstelle so wichtig ist: Ein Filter, den du im Visual setzt, ist eine Anzeigeeinstellung. Jemand, der die Filterleiste aufklappt oder das Visual als CSV exportiert, hebt ihn auf. Eine RLS-Regel sitzt eine Ebene tiefer — sie entscheidet, welche Zeilen das Dataset überhaupt herausgibt. Export, Drilldown und Umsortieren arbeiten danach nur noch auf dem, was übrig geblieben ist. Auf der Karte steht deshalb „filtert im Dataset" und nicht „filtert im Dashboard".

### Badge 7 — das Management als Author

Die Geschäftsführung hat einen AWS-Zugang und arbeitet als Author direkt im Werkzeug. Für sie ist nichts eingebettet und nichts anonym.

### Badge 8 — das Händlerportal ohne AWS-Login

Das Portal authentifiziert seine 300 Händler selbst. Sein Backend ruft `GenerateEmbedUrlForAnonymousUser` auf und gibt dabei `SessionTags` mit — den Wert der Händler-ID. Zurück kommt eine URL, die eine begrenzte Zeit gültig ist; die Sitzungsdauer ist auf einen Bereich von 15 bis 600 Minuten begrenzt.

Der Händler sieht sein Dashboard und hat nie einen AWS- oder QuickSight-Login besessen.

## Die entscheidende Unterscheidung

Es gibt **zwei Arten von RLS-Regeln**, und sie sind nicht austauschbar:

| | User-based Rules | Tag-based Rules |
|---|---|---|
| Wofür | registrierte Nutzer und Gruppen | eingebettete Dashboards für nicht registrierte Nutzer |
| Woher kommt der Wert | aus einem Permissions-Dataset (`UserName` / `GroupName` / ARN) | zur Laufzeit aus `SessionTags` |
| Erlaubte API | alle | **nur** `GenerateEmbedUrlForAnonymousUser` |
| Nicht unterstützt | — | `GenerateEmbedUrlForRegisteredUser`, `GetDashboardEmbedUrl`, IAM- und Quick-Identity-Typ |
| Wer nichts sieht | wer keine Regel hat | wer keinen passenden Tag-Wert mitbringt |

Die Zeile „wer keine Regel hat, sieht keine Zeile" ist wörtlich so dokumentiert und in der Prüfung Gold wert: RLS ist **fail-closed**. Ein vergessener Nutzer bekommt kein Zuviel, sondern ein Nichts.

## Die ehrliche Feinheit

Vier Punkte, die auf keiner Folie stehen.

**Erstens: RLS wirkt nur auf Textfeldern.** Die Doku sagt es ohne Umweg — string, char, varchar und Vergleichbares, nicht Datums- und nicht numerische Felder. Die Händlernummer als `int` zu modellieren wirkt sauber und macht die Regel unbrauchbar. Auf RLS-Datasets wird zusätzlich Anomaly Detection nicht unterstützt.

**Zweitens: Der Author sieht plötzlich nichts mehr.** Sobald tag-basierte Regeln auf einem Dataset aktiv sind, weist die Doku ausdrücklich darauf hin, dass man den Authors **zusätzlich** über ein user-based Permissions-Dataset Rechte geben muss, damit sie beim Bauen des Dashboards überhaupt Daten sehen. Auf der Karte steht nur der tag-basierte Weg — real hängen an diesem Dataset beide Regelarten.

Dazu kommen drei Grenzen, die man erst im Betrieb trifft. Ein RLS-geschütztes Feld in SPICE fasst **2.047 Unicode-Zeichen**; was länger ist, wird bei der Ingestion abgeschnitten. Die Summe der Regelsätze je Nutzer — direkt zugewiesene plus über Gruppen geerbte — darf **999** nicht überschreiten. Und ein Kind-Dataset, das von einem Dataset mit aktiven RLS-Regeln abgeleitet wird, erbt diese Regeln unwiderruflich und kann **nur als Direct Query** angelegt werden; in SPICE wird es nicht unterstützt. Wer also die Historie noch einmal aggregiert weiterverarbeiten will, verliert an dieser Stelle genau den Effekt, um dessentwillen die ganze Karte gebaut ist.

**Drittens: Session-Tags sind Zugangsdaten.** AWS formuliert das als Anweisung: nicht an Endnutzer oder Client-Code herausgeben, ausschließlich vom vertrauenswürdigen Backend setzen, und dafür sorgen, dass ein Mandant die Tag-Werte eines anderen nicht erraten kann. Wer die Händler-ID aus einem Query-Parameter übernimmt, den der Browser geschickt hat, hat die gesamte Absicherung an den Angreifer delegiert.

**Viertens: Der Name ist zweimal gewandert.** Aus Amazon QuickSight wurde am 09.10.2025 Amazon Quick Suite, der BI-Teil darin heißt Quick Sight. Im Lauf des Jahres 2026 hat AWS auf **Amazon Quick** verkürzt; die Nutzerdokumentation führt inzwischen „Amazon Quick" als Produktnamen. Die API heißt unverändert `quicksight`, ARNs lauten weiter `arn:aws:quicksight:…`, und im Prüfungsstoff ist **QuickSight** der gefragte Begriff. Verlass dich hier auf die Funktion, nicht auf das Etikett.

## Syntax lesen — der Embed-Aufruf

```json
{
  "Namespace": "default",
  "SessionLifetimeInMinutes": 60,
  "SessionTags": [
    { "Key": "tag_haendler_id", "Value": "H-4711" }
  ],
  "AuthorizedResourceArns": ["arn:aws:quicksight:eu-central-1:1234:dashboard/haendler"],
  "ExperienceConfiguration": {
    "Dashboard": { "InitialDashboardId": "haendler" }
  }
}
```

```
SessionTags[].Key    ->  muss exakt dem TagKey im Dataset entsprechen
SessionTags[].Value  ->  wird gegen ColumnName gefiltert
       "H-4711"      ->  genau ein Händler
       "H-1,H-2"     ->  zwei, getrennt durch TagMultiValueDelimiter
       "*"           ->  alle, wenn MatchAllValue so definiert wurde
AuthorizedResourceArns -> was diese Sitzung überhaupt öffnen darf
```

Drei Stellen müssen zusammenpassen: der `TagKey` im Dataset, der `Key` im Aufruf und der Spaltentyp. Stimmt einer nicht, kommt kein Fehler — es kommt eine leere Tabelle.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein BI-Server, kein Reporting-Cluster, keine Lizenzverwaltung auf einer Maschine
- keine 300 QuickSight-Benutzerkonten und keine Einladungs-Mails an Händler
- keine 300 Datasets und keine 300 Dashboards
- keine Kopie der Verkaufshistorie je Händler
- keine Athena-Abfrage pro Klick — und damit keine Kostenkurve, die an der Klickrate hängt
- keine analytische Dauerlast auf der Auftragsdatenbank

Übrig bleiben: zwei Datasets, ein Dashboard, eine Tag-Regel und ein Backend, das eine URL erzeugt.

## Wenn du dir eine Sache merkst

**SPICE trennt den Klick von der Abfrage — und bei anonym eingebetteten Dashboards filtert ausschließlich tag-basierte Row-Level Security, und die nur auf Textfeldern.**

Athena ist die Rechenmaschine und keine Anzeige. RDS ist die Buchhaltung des Tagesgeschäfts und kein Warehouse. Der Data Catalog beschreibt und speichert nicht. Und user-based RLS braucht einen Nutzer, den es bei anonymem Embedding definitionsgemäß nicht gibt.

## Prüfungsknackpunkte

**Signalwörter:** „self-service", „embedded dashboards in a customer portal", „without requiring users to sign in to AWS", „each customer must only see their own data", „minimize per-query cost for frequently accessed dashboards". Die letzten beiden zusammen sind die eigentliche Frage: Zugriffsmuster plus Abrechnungsform, nicht Aktualität.

**Die teuerste Fehlentscheidung — Direct Query, weil „die Daten aktuell sein sollen".** Aktualität steht in diesem Szenario nirgends als Anforderung. Es stehen zwei andere Dinge da: hohe Interaktionsrate und eine Quelle, die pro Abfrage abrechnet. Sobald beides zusammentrifft, ist SPICE die Antwort; die Aktualität regelt der geplante Refresh.

**Warum user-based RLS hier verliert:** Bei anonymem Embedding existiert kein QuickSight-Nutzer, auf den eine benutzerbasierte Regel greifen könnte. Die Regel läuft nicht falsch — sie läuft ins Leere.

**Warum eine numerische Händler-ID hier verliert:** Row-Level Security arbeitet nicht auf numerischen Feldern. Die ID muss als Text im Dataset stehen.

**Warum Athena als Antwort auf „Dashboard" hier verliert:** Athena führt SQL aus. Es zeigt nichts an, es filtert nichts pro Nutzer und es hat keine Oberfläche für einen Fachbereich.

**Warum ein Dashboard je Händler hier verliert:** Funktioniert bei drei Händlern und ist bei 300 ein Pflegeproblem — und es beantwortet die Frage nach dem Mechanismus nicht, sondern umgeht sie.

**Warum Lake Formation hier verliert:** Lake Formation filtert an der Quelle für **authentifizierte Principals** über mehrere Engines hinweg. Für Nutzer ohne AWS-Identität gibt es keinen Principal, auf den eine Regel zeigen könnte. Umgekehrt gilt: Fragt ein Szenario nach gleichen Zeilen- und Spaltenrechten für Athena *und* Redshift Spectrum, ist es Karte 58 und nicht diese hier.
