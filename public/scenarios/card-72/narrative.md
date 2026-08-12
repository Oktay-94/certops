---
cardNumber: 72
slug: dms-homogen-ohne-sct
title: "DMS homogen — warum hier kein Schema Conversion Tool nötig ist"
services: ["AWS DMS", "Amazon RDS for MySQL", "AWS Schema Conversion Tool", "DMS Schema Conversion"]
domains: ["D3", "D2"]
correctAnswer: "A"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_BestPractices.html"
  - "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.MySQL.html"
  - "https://docs.aws.amazon.com/dms/latest/userguide/dm-migrating-data-mysql.html"
  - "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Troubleshooting.html"
  - "https://docs.aws.amazon.com/dms/latest/userguide/CHAP_SchemaConversion.html"
  - "https://docs.aws.amazon.com/dms/latest/userguide/schema-conversion.html"
  - "https://docs.aws.amazon.com/SchemaConversionTool/latest/userguide/WhatsNew.html"
  - "https://aws.amazon.com/dms/faqs/"
  - "https://aws.amazon.com/dms/features/"
  - "https://aws.amazon.com/about-aws/whats-new/2023/06/aws-database-migration-service-homogeneous-migration"
---

## Die Grundidee zuerst

Stell dir vor, eine Leihbücherei zieht in ein größeres Gebäude.

**Weg eins:** Am Freitag um 18:00 schließt die Ausleihe. Alle Bücher kommen in Kisten, ein LKW fährt zweimal, am Sonntag räumt ein Team ein. Zwei Tage lang bekommt niemand ein Buch, und wer ein Buch zurückbringt, findet eine verschlossene Tür. Der Betrieb steht genau so lange, wie das Kopieren dauert.

**Weg zwei:** Im neuen Gebäude arbeitet ein Team von Abschreibern. Es geht Regal für Regal durch den alten Bestand und legt drüben ein zweites, identisches Regal an. Der alte Lesesaal bleibt dabei offen. Weil währenddessen weiter ausgeliehen und zurückgegeben wird, läuft parallel ein Bote mit: Jede Ausleihe, jede Rückgabe, jede Neuanschaffung meldet er sofort nach drüben. Am Umzugstag hörst du auf, den alten Saal zu benutzen — der neue ist bereits auf demselben Stand.

Und jetzt die Frage, um die es auf dieser Karte eigentlich geht: **Braucht dieses Team einen Übersetzer?**

Nur dann, wenn drüben in einer anderen Sprache katalogisiert wird. Zieht die Bücherei in ein Haus, das denselben Katalog führt, wäre ein Übersetzer nicht nur überflüssig, er wäre eine Fehlerquelle. Genau das ist die Aufgabenstellung: MySQL geht nach MySQL. Dieselbe Sprache auf beiden Seiten.

## Was es eigentlich ist — der Replikations-Task

Du migrierst keine Datenbank, du legst einen **Task** an. Der Task ist ein Objekt mit vier Verweisen und ein paar Schaltern:

```json
{
  "ReplicationTaskIdentifier": "shop-mysql-nach-rds",
  "SourceEndpointArn":     "arn:aws:dms:eu-central-1:1234:endpoint:ONPREM-MYSQL",
  "TargetEndpointArn":     "arn:aws:dms:eu-central-1:1234:endpoint:RDS-MYSQL",
  "ReplicationInstanceArn":"arn:aws:dms:eu-central-1:1234:rep:SHOP-REPL-01",
  "MigrationType": "full-load-and-cdc",
  "ReplicationTaskSettings": {
    "FullLoadSettings": {
      "TargetTablePrepMode": "DO_NOTHING",
      "MaxFullLoadSubTasks": 8,
      "StopTaskCachedChangesApplied": false
    },
    "Logging": { "EnableLogging": true }
  }
}
```

Zeile für Zeile: Woher (`SourceEndpointArn`), wohin (`TargetEndpointArn`), womit (`ReplicationInstanceArn` — die Maschine, die die Arbeit macht), und in welchem Modus.

`MigrationType` ist der Schalter, der die ganze Karte erklärt. Drei Werte sind möglich: `full-load` überträgt nur den Bestand, `cdc` nur die laufenden Änderungen, `full-load-and-cdc` beides nacheinander. Der dritte Wert ist der einzige, der „Downtime nahe null" ergibt — er ist auf der Karte die Kombination aus den Badges 1 und 3.

`TargetTablePrepMode` steht hier bewusst auf `DO_NOTHING`: DMS soll auf dem Ziel nichts anlegen und nichts löschen, weil das Schema dort bereits steht. Warum es dort schon stehen sollte, ist der wichtigste Punkt dieses Narrativs — er kommt im Abschnitt über die ehrliche Feinheit.

## Der Weg durch die Karte

### Kasten links — MySQL on-prem, im laufenden Betrieb

Der blaue Kasten trägt die Aussage, wegen der DMS überhaupt existiert: Die Quelle bleibt online. Kein Freeze, kein Read-only-Modus, kein Wartungsfenster für die Dauer des Kopierens.

Praktisch bedeutet das eine Vorbedingung, die die Karte nicht zeigt: Auf der Quelle muss das Binärlog aktiv sein, mit Zeilenformat und ausreichender Aufbewahrung, denn genau daraus liest DMS später die Änderungen. Eine MySQL-Instanz, die kein Binlog schreibt, kann man voll laden — aber nicht synchron halten.

Die kursive Zeile „kein Umbau" ist die zweite Hälfte der Kernaussage: An der Anwendung, die auf diese Datenbank zeigt, wird nichts geändert. Sie bekommt am Ende einen anderen Hostnamen. Sonst nichts.

### Badge 1 — Full Load

DMS liest den Bestand tabellenweise aus der Quelle. Standardmäßig laufen mehrere Tabellen parallel — im Beispiel oben acht.

Das Bild dazu: Nicht ein Abschreiber, der sich von Regal eins bis Regal fünfzig durcharbeitet, sondern acht, die sich die Regale aufteilen. Deshalb steht die Größe der Replikationsinstanz in direktem Zusammenhang mit der Ladedauer — sie ist der Engpass, nicht die Leitung.

Der Full Load liest, was **jetzt** in der Quelle steht. Was sich währenddessen ändert, fällt aus diesem Schritt heraus. Genau dafür gibt es Badge 3.

### Kasten Mitte — die Replikationsinstanz

Das ist eine EC2-Instanz, die AWS für dich betreibt: Sie hält die Verbindungen zu beiden Endpunkten, puffert Daten auf ihrer eigenen Platte und wendet sie auf dem Ziel an.

Die kursive Zeile ist die einzige harte Architekturregel auf der Karte, und sie ist prüfungsrelevant: **Quelle oder Ziel muss in AWS liegen** — in RDS oder auf EC2. AWS formuliert das im DMS-FAQ ausdrücklich als Ausschluss: Replikation von on-prem nach on-prem wird nicht unterstützt. DMS ist kein allgemeines Datenbank-Kopierwerkzeug, es ist ein Werkzeug, dessen einer Fuß immer in AWS steht.

### Badge 2 — anwenden

Die Instanz schreibt die gelesenen Zeilen ins Ziel. Weil Quell- und Ziel-Engine identisch sind, gibt es hier keinen Übersetzungsschritt: `INT` bleibt `INT`, `DATETIME` bleibt `DATETIME`, kein Datentyp muss auf ein Gegenstück abgebildet werden.

Das ist die Definition von **homogen** — und der ganze Grund, warum der orangefarbene Kasten unten durchgestrichen ist.

### Badge 3 — CDC, der Nebenfluss

Der gestrichelte Pfeil ist kein zweiter Ladevorgang, sondern ein Abgriff. Change Data Capture liest das Binärlog der Quelle und schickt jede Einfügung, Änderung und Löschung hinterher.

Wichtig ist der Startpunkt: CDC beginnt an der Logposition, die zum Beginn des Full Loads gehört. Sonst entstünde eine Lücke zwischen „Bestand kopiert" und „Änderungen mitgeschnitten". Die Karte zeigt das dadurch, dass Badge 3 nicht hinter Badge 1 steht, sondern daneben.

Das Bild: Der Bote läuft nicht los, wenn die Abschreiber fertig sind. Er läuft los, wenn sie anfangen.

### Badge 4 — synchron bis zum Cutover

Solange CDC läuft, driftet das Ziel nicht weg. Die Lücke zwischen Quelle und Ziel ist nur so groß wie die Verarbeitungsverzögerung — DMS zeigt sie als CDC-Latenz.

Der Cutover ist dann eine Entscheidung über Sekunden, nicht über Stunden: Schreibzugriffe auf der Quelle stoppen, warten, bis die Latenz auf null fällt, Verbindungsstring der Anwendung umstellen, fertig.

Woher weißt du, dass drüben wirklich dasselbe steht? DMS kann das im Task selbst prüfen — die Datenvalidierung vergleicht Zeilen auf beiden Seiten und meldet Abweichungen. Sie hat allerdings eine Bedingung, die zur Feinheit weiter unten passt: Validiert wird über Primärschlüssel oder eindeutigen Index. Tabellen ohne beides fallen aus der Prüfung heraus — und sind zugleich die Tabellen, bei denen CDC ohnehin die meisten Probleme macht.

### Kasten rechts — RDS for MySQL

Was ankommt, ist eine verwaltete Datenbank derselben Engine: Backups, Patches, Multi-AZ und Monitoring übernimmt AWS.

Genau deshalb steht am Ende der Kette RDS und nicht MySQL auf einer EC2-Instanz. Der Betriebsgewinn ist der eigentliche Zweck der Migration; die gleiche Engine ist nur die Bedingung, unter der der Weg dorthin billig bleibt.

Zwei Dinge muss die Zielseite mitbringen, damit der Task überhaupt anläuft: einen Benutzer mit Schreibrechten auf den Zielschemata und ausreichend Speicher. RDS wächst nicht automatisch mit, wenn du Storage Autoscaling nicht eingeschaltet hast — ein Full Load, der die Platte füllt, bringt den Task zum Stehen, nicht die Datenbank zum Wachsen.

Was **nicht** ankommt, steht weiter unten. Die Karte behauptet an dieser Stelle mehr, als der Task leistet.

### Kasten unten — AWS SCT, der verworfene Weg

Das Schema Conversion Tool ist ein Übersetzer für Datenbankstrukturen und Datenbankcode: Tabellen, Views, Stored Procedures, Funktionen, Trigger. Es existiert für den Fall, dass Quelle und Ziel **verschiedene** Engines sind — Oracle nach Aurora PostgreSQL, SQL Server nach MySQL.

Bei gleicher Engine gibt es dafür keinen Auftrag. Ein Übersetzer, der von Deutsch nach Deutsch übersetzt, erzeugt bestenfalls dasselbe Ergebnis und schlimmstenfalls einen Fehler.

Der rote Pfeil trägt deshalb nicht die Beschriftung „SCT ist schlecht", sondern „Engine wechselt nicht". Verworfen wird hier keine Qualität, sondern eine Voraussetzung: Der Auslöser für SCT fehlt schlicht.

## Die entscheidende Unterscheidung

Es gibt drei Dinge, die bei einer Datenbankmigration bewegt werden müssen. Wer sie auseinanderhält, beantwortet jede SCT-Frage in Sekunden:

| Was | Homogen (MySQL → MySQL) | Heterogen (Oracle → Aurora PostgreSQL) |
|---|---|---|
| Zeilen und Werte | DMS | DMS |
| Tabellenstruktur, Datentypen | unverändert übernehmbar | muss konvertiert werden |
| Views, Prozeduren, Trigger, Code | unverändert übernehmbar | muss konvertiert werden |
| Werkzeug für die Struktur | native Werkzeuge der Engine | SCT bzw. DMS Schema Conversion |
| Reihenfolge | Struktur, dann Daten | erst konvertieren, dann DMS |

Die Achse ist nicht „welcher Dienst ist besser". Sie ist: **Muss übersetzt werden, oder muss nur transportiert werden.**

## Die ehrliche Feinheit

Hier weicht das Narrativ von der Karte ab, und zwar in dem Punkt, der in der Praxis am meisten kostet.

Die Karte sagt „Schema kommt unverändert an". Der Task, den die Karte zeichnet, leistet das nicht. AWS schreibt in den DMS-Best-Practices ausdrücklich, dass DMS eine **grundlegende** Schemamigration unterstützt — Tabellen und Primärschlüssel — und Sekundärindizes, Foreign Keys, Benutzerkonten und Ähnliches **nicht** automatisch anlegt. Die Troubleshooting-Seite wird noch deutlicher: keine Sekundärindizes, keine Constraints jenseits des Primärschlüssels, keine Default-Werte.

Wer also nur den Task startet und danach die Anwendung umstellt, bekommt eine Datenbank, die vollständig aussieht und unter Last zusammenbricht, weil jede Abfrage einen Full Table Scan macht.

Und die Reihenfolge ist dabei nicht beliebig. AWS empfiehlt in denselben Best Practices, Sekundärindizes, Referenzintegrität und DML-Trigger **vor** dem Full Load abzuschalten oder gar nicht erst anzulegen — jeder Index verlangsamt das Massenschreiben, jeder Trigger feuert bei jeder eingefügten Zeile. Für einen Task mit anschließendem CDC empfiehlt AWS, die Sekundärindizes **vor** der CDC-Phase anzulegen, weil DMS logische Replikation verwendet und sonst jede einzelne Änderung einen Full Table Scan auslöst. Trigger werden erst unmittelbar vor dem Cutover wieder scharf gestellt.

Daraus wird eine Abfolge, die keine Karte zeigt und die in echten Projekten den Zeitplan bestimmt: Struktur anlegen, Indizes und Trigger aus dem Weg räumen, Full Load, Indizes anlegen, CDC laufen lassen, Trigger einschalten, umschalten.

Die Auflösung steht in derselben Dokumentation: **Bei gleicher Engine legst du die Struktur mit den Bordmitteln der Engine an** — Dump ohne Daten, MySQL Workbench, `mysqldump --no-data` — und lässt DMS nur die Zeilen bewegen. Das ist auch der Grund für `TargetTablePrepMode: DO_NOTHING` weiter oben: Du hast das Ziel selbst vorbereitet und willst nicht, dass DMS es überschreibt.

Und es gibt noch eine Ebene, die die Karte gar nicht kennt. Seit 2023 bietet DMS für genau dieses Szenario einen zweiten Weg an: **homogene Datenmigration** als serverloses Migrationsprojekt, ohne Replikationsinstanz. Dabei benutzt DMS die nativen Werkzeuge der Engine selbst — bei MySQL `mydumper` zum Lesen und `myloader` zum Schreiben, anschließend Binlog-Replikation für CDC — und überträgt dabei auch Sekundärobjekte: Indizes, Prozeduren, Trigger, Partitionen. Die MySQL-Quellseite der DMS-Dokumentation empfiehlt für eine MySQL-nach-MySQL-Migration ausdrücklich dieses Projekt statt des klassischen Wegs.

Für die Prüfung bleibt die Kartenaussage trotzdem richtig: gefragt ist DMS, nicht SCT. Für ein reales Projekt ist die gezeichnete Replikationsinstanz die zweite Wahl.

Dritte Feinheit, zur Sauberkeit: SCT gibt es in zwei Gestalten. Das herunterladbare Desktop-Werkzeug — die Benutzerhandbuch-Historie führt als jüngsten Build 1.0.672 vom Mai 2023 — und **DMS Schema Conversion**, die in die DMS-Konsole eingebaute Variante, die laut Dokumentation auf derselben Conversion-Engine aufsetzt. Eine Prüfungsfrage, die „AWS SCT" als Antwortoption zeigt, meint beides.

## Syntax lesen — Table Mappings

Der Task allein sagt noch nicht, **was** migriert wird. Das steht in einem eigenen JSON-Dokument, den Table Mappings, und es ist der Teil, an dem in echten Projekten die meiste Zeit hängt:

```json
{
  "rules": [
    {
      "rule-type": "selection",
      "rule-id": "1",
      "rule-name": "alle-shop-tabellen",
      "object-locator": { "schema-name": "shop", "table-name": "%" },
      "rule-action": "include"
    },
    {
      "rule-type": "selection",
      "rule-id": "2",
      "rule-name": "audit-raus",
      "object-locator": { "schema-name": "shop", "table-name": "audit_log_%" },
      "rule-action": "exclude"
    }
  ]
}
```

```
"object-locator": { "schema-name": "shop", "table-name": "%" }
                        │                       │
                        │                       └─ Platzhalter: alle Tabellen
                        └─ das Schema, nicht die Datenbankinstanz
```

Zwei Dinge liest du hier ab. Erstens: `%` ist der Platzhalter, nicht `*` — SQL-Konvention, nicht Shell-Konvention. Wer Shell-Denken mitbringt, schreibt hier den ersten Fehler hin.

Zweitens: Regeln werden in Reihenfolge ausgewertet, `exclude` nach `include` verengt die Auswahl. Ein Schema-Platzhalter, der versehentlich `%` statt `shop` enthält, zieht die Systemdatenbanken von MySQL mit — und die Migration scheitert, weil der RDS-Master-Benutzer keine Rechte auf die Systemdatenbanken des Ziels hat.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** vorkommt:

- keine Schemakonvertierung, kein Assessment-Report, kein manueller Code-Umbau
- keine Anwendungsänderung außer dem Verbindungsstring
- kein Wartungsfenster für die Dauer des Ladens
- kein eigenes Skript, das Deltas nachzieht
- keine Serverkopie — das Betriebssystem der alten Maschine bleibt, wo es ist
- kein Betrieb der Zieldatenbank durch dich: Backup, Patch und Failover macht RDS

Übrig bleiben: zwei Endpunkte, eine Replikationsinstanz auf Zeit und eine Entscheidung, wann der Verbindungsstring umgestellt wird.

## Wenn du dir eine Sache merkst

**SCT übersetzt Struktur, DMS transportiert Zeilen. Gleiche Engine heißt: nichts zu übersetzen.**

Deshalb fällt „SCT zusätzlich" hier durch — es gibt keinen Übersetzungsauftrag. Deshalb fällt MGN durch — es zieht ganze Server um, nicht Datenbanken. Und deshalb fällt jeder Weg über Dump und Restore durch, sobald „Downtime nahe null" in der Aufgabe steht: Ein Dump kennt keine Änderungen, die nach dem Dump passieren.

## Prüfungsknackpunkte

**Signalwörter:** „the source database remains fully operational", „same database engine", „change data capture", „near-zero downtime", „minimal downtime cutover". Sobald gleiche Engine plus laufender Betrieb zusammenkommen, ist DMS allein die Antwort.

**Die Lagefalle.** Quelle oder Ziel muss in AWS liegen. Aufgaben, die zwei Rechenzentren beschreiben und DMS als Option anbieten, testen genau das.

**Die Reihenfolgefalle.** Bei heterogenen Migrationen ist die Reihenfolge Teil der Antwort: erst konvertieren, dann Daten bewegen. Eine Option, die DMS vor SCT setzt, ist auch bei Engine-Wechsel falsch.

**A — nur AWS DMS:** richtig. Gleiche Engine, kein Konvertierungsbedarf, CDC hält die Quelle online.

**B — erst AWS SCT, dann DMS:** die Standardfalle. Richtig für Oracle nach Aurora, überflüssig für MySQL nach MySQL.

**C — AWS MGN:** migriert den ganzen Server samt Betriebssystem. Löst die Aufgabe formal, liefert aber kein RDS, sondern wieder eine selbstverwaltete Datenbank auf EC2 — also nicht das Ziel der Aufgabe.

**D — AWS DataSync:** bewegt Dateien und Objekte. Eine laufende Datenbank als Dateikopie zu übertragen, ergibt einen inkonsistenten Stand.
