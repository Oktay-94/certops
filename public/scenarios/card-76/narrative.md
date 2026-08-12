---
cardNumber: 76
slug: mainframe-modernization-replatform-refactor
title: "Mainframe Modernization — Replatform oder Refactor statt Big Bang"
services: ["AWS Mainframe Modernization", "AWS Transform for mainframe", "AWS Blu Age", "AWS Database Migration Service", "Amazon Aurora", "Amazon RDS", "Amazon S3"]
domains: ["D3", "D4"]
correctAnswer: "B"
badgeCount: 4
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/m2/latest/userguide/what-is-m2.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/mainframe-modernization-availability-change.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/applications-m2-definition.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/datasets-m2-definition.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/concept-m2.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/modernization-m2.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/ba-release-notes.html"
  - "https://docs.aws.amazon.com/m2/latest/userguide/mf-runtime-setup.html"
  - "https://aws.amazon.com/mainframe-modernization/capabilities/replatform-rocketsoftware/"
---

## Die Grundidee zuerst

Stell dir ein Archiv vor, dessen gesamter Bestand in einer Kurzschrift geschrieben ist, die nur noch drei Leute im Haus lesen können. Zwei davon gehen nächstes Jahr in Rente.

**Weg eins:** Ihr setzt einen Stichtag. Bis dahin schreibt ein Team alles in normaler Schrift neu, aus dem Verständnis heraus, was drinsteht. Am Stichtag wird umgeschaltet. Das Problem ist nicht die Schrift — es ist, dass in den Randnotizen Regeln stehen, die nie jemand ins Handbuch übertragen hat. Der Vorgang von 1987, bei dem eine Police anders berechnet wird, weil damals ein Gesetz geändert wurde. Das steht in keinem Dokument. Das steht im Text.

**Weg zwei:** Ihr baut einen Leseapparat, der die Kurzschrift versteht, und stellt das Archiv unverändert hinein. Die Schrift bleibt, das Gebäude wechselt. Ihr braucht immer noch jemanden, der die Kurzschrift liest — aber ihr habt Zeit gekauft.

**Weg drei:** Ihr lasst eine Maschine übersetzen. Zeichen für Zeichen, nachprüfbar, ohne dass jemand raten muss, was gemeint war. Langsamer als Weg zwei, aber danach kann jeder lesen.

Weg zwei heißt **Replatform**, Weg drei **Refactor**, Weg eins ist der manuelle Rewrite. Und Rehost — das Gebäude einfach woanders hinstellen, so wie man einen Windows-Server nach EC2 schiebt — gibt es hier nicht. Die z/Architecture ist keine x86-Maschine; es gibt kein Lift-and-Shift für einen Mainframe.

Das ist die ganze Karte: eine Wahl zwischen zwei Wegen, wo die meisten Leute drei oder vier vermuten.

## Was es eigentlich ist — eine Application Definition

Nach der Migration ist deine COBOL-Anwendung auf AWS ein **JSON-Dokument**. Nicht bildlich gesprochen — buchstäblich. Die Laufzeitumgebung liest diese Datei und weiß danach, wo alles liegt:

```json
{
  "template-version": "2.0",
  "source-locations": [{
      "source-id": "s3-source",
      "source-type": "s3",
      "properties": {
        "s3-bucket": "mainframe-deployment-bucket",
        "s3-key-prefix": "v1"
      }
  }],
  "definition": {
    "listeners": [{ "port": 5101, "type": "tn3270" }],
    "dataset-location": {
      "db-locations": [{
        "name": "Database1",
        "secret-manager-arn": "arn:aws:secrets:1234:us-east-1:secret:123456"
      }]
    },
    "batch-settings": {
      "initiators": [{ "classes": ["A", "B"], "description": "Nachtlauf" }],
      "jcl-file-location": "${s3-source}/batch/jcl",
      "system-procedure-libraries": "SYS1.PROCLIB;SYS2.PROCLIB"
    },
    "cics-settings": {
      "binary-file-location": "${s3-source}/cics/binaries",
      "system-initialization-table": "BNKCICV"
    }
  }
}
```

Lies das von oben nach unten, dann siehst du, warum Schritt 2 der Karte vor Schritt 3 kommt.

`source-locations` ist ein S3-Bucket mit einem Präfix. Alles, was die Anwendung an Artefakten braucht, liegt dort. Der Platzhalter `${s3-source}` weiter unten verweist auf genau diesen Eintrag — die Pfade sind relativ zu einem Bucket, nicht absolut.

`listeners` mit Typ `tn3270` auf Port 5101: Das grüne Terminal von 1985 ist keine Metapher. Es ist ein Protokoll, und es hat einen Port.

`jcl-file-location` zeigt dorthin, wo die Job-Control-Language-Dateien liegen — **in S3**. `binary-file-location` zeigt auf die kompilierten CICS-Programme, ebenfalls in S3.

`system-procedure-libraries` ist die Zeile, an der man merkt, dass hier nichts umgeschrieben wurde: `SYS1.PROCLIB` ist ein Datasetname aus der Mainframe-Welt, unverändert, mit Semikolon getrennt, in einer JSON-Datei auf AWS.

Und `dataset-location` verweist nicht auf Dateien, sondern auf eine Datenbank mit einem Secrets-Manager-ARN. Die VSAM-Dateien von damals sind jetzt Tabellenzeilen.

**Das ist der Kern der ganzen Karte: Der Code ist unverändert. Nur alles um ihn herum ist es nicht mehr.**

## Der Weg durch die Karte

### Der Kasten links — Mainframe z/OS

COBOL-Batch, JCL, DB2 und VSAM. Vier Wörter, vier verschiedene Probleme.

COBOL ist das Personalproblem. JCL ist die Ablaufsteuerung — was in welcher Reihenfolge nachts läuft. DB2 ist die relationale Datenbank, die sich noch am leichtesten übersetzen lässt. VSAM ist der schwierigste Teil: satzorientierte Dateien mit einem eigenen Aufbau, für die es in der relationalen Welt keine direkte Entsprechung gibt.

Wer den Umfang eines Mainframe-Projekts schätzen will, zählt nicht Codezeilen. Er zählt VSAM-Dateien.

### Badge 1 — vom Bestand zum Plan

Der Pfeil sagt: Es wird nichts bewegt, bevor gelesen wurde. Der Grund steht im nächsten Kasten.

### Der Kasten — Analyse und Plan

Der Analyzer liest den Bestand: Programme, JCL-Jobs, Copybooks und deren Abhängigkeiten untereinander.

Copybooks sind der Punkt. Ein Copybook ist eine Datensatzdefinition, die von vielen Programmen eingebunden wird — dieselbe Struktur, an zwanzig Stellen benutzt. Wer ein Programm anfasst, das ein Copybook teilt, hat neunzehn andere mit angefasst und weiß es nicht.

Das Bild dazu: Man misst die tragenden Wände, bevor man die erste einreißt. Die Analyse ist nicht die Vorbereitung des Plans — sie ist der Plan. Aus ihr ergibt sich, welche Programme zwingend in dieselbe Welle müssen.

### Badge 2 — Daten und Artefakte zuerst

Der zweite Pfeil trägt die Aussage, die in Prüfungsfragen am häufigsten als Falle auftaucht: Die Daten kommen **vor** der ersten Welle, nicht danach.

### Der Kasten — Daten und Artefakte

Zwei getrennte Wege für zwei getrennte Dinge.

**Daten:** DB2 und VSAM wandern über AWS DMS nach Aurora oder RDS. Für VSAM gilt eine Einschränkung, die man nur in der Doku findet: Die Rocket-Laufzeit unterstützt derzeit Datasets aus genau **einer** VSAM-Datenbank — und die Dateien müssen vorher in das Format der Laufzeit konvertiert werden, mit einem Werkzeug namens DFCONV. Der Blusam-Speicher auf der Refactor-Seite verlangt sogar eine bestimmte Engine: Aurora PostgreSQL.

**Artefakte:** JCL-Dateien und Batch-Binaries kommen nach S3. Genau dorthin, wo die Application Definition sie erwartet.

Dass Daten hier mehr Arbeit machen als anderswo, sieht man an der zweiten JSON-Datei, die dieses Projekt braucht — der Dataset Definition. Sie beschreibt je Datensatz vier Dinge: Name, Organisation, **Satzlänge** und **Kodierung**. Die letzten beiden gibt es in der relationalen Welt gar nicht. Ein Mainframe-Satz hat eine feste Breite, und seine Zeichen liegen nicht in UTF-8 vor. Wer diese Felder falsch setzt, bekommt keine Fehlermeldung, sondern Zahlen, die aussehen wie Zahlen und falsch sind.

Und daraus folgt der Grund für die Reihenfolge: **Ohne migrierte Daten kannst du keine der beiden Laufzeiten testen.** Eine Runtime ohne Datenbestand startet zwar, rechnet aber nichts. Wer die Daten ans Ende schiebt, merkt am Tag der Umschaltung zum ersten Mal, ob es funktioniert.

### Badge 3 — Replatform

Der obere Abzweig. Ab hier trennen sich die Wege — und beide setzen auf demselben Datenstand auf. Das ist die eigentliche Nachricht der Verzweigung: Du musst dich nicht einmal für alles entscheiden.

### Der Kasten — Replatform

Der COBOL-Code bleibt COBOL. Er wird für die Zielplattform neu kompiliert und läuft auf einer Laufzeitumgebung von **Rocket Software**, das die Enterprise-Suite von Micro Focus übernommen hat.

Der Gewinn: wenig Risiko, schneller Ausstieg aus dem Rechenzentrum. Kein Programm ändert sein Verhalten, weil kein Programm geändert wurde.

Der Preis steht in derselben Zeile: Du brauchst weiterhin Menschen, die COBOL lesen können. Das Rechenzentrum ist gelöst, das Personalproblem nicht. Replatform kauft Zeit — es löst nichts.

### Badge 4 — Refactor

Der untere Abzweig, gestrichelt gezeichnet, weil er die Option und nicht den Standardweg darstellt.

### Der Kasten — Refactor

Ein Transformationswerkzeug wandelt COBOL automatisiert in Java. Heraus kommt keine Blackbox, sondern eine mehrschichtige Anwendung: Angular-Oberfläche, Java-Backend mit API, Datenzugriff auf moderne Datenspeicher — bei funktionaler Äquivalenz zum Original.

Das ist der Weg, der das Personalproblem tatsächlich löst. Danach arbeitet ein normales Java-Team weiter.

Zum Namen: Das Werkzeug hieß **AWS Blu Age**, und so steht es auf der Karte. In der aktuellen AWS-Doku heißt das Refactor-Muster inzwischen **AWS Transform for mainframe**. Die Blu-Age-Herkunft ist nicht verschwunden, sie ist nur nach unten gerutscht — in der Application Definition heißen die Schlüssel weiterhin `ba-application` und `blusam`, und die Runtime bekommt eigene Release Notes. Zwei Namen, ein Werkzeug.

### Der rote Pfeil — manueller Rewrite als Big Bang

Alles auf einmal neu schreiben, mit einem Stichtag.

Warum das die schlechteste Wahl ist, steht in der Grundidee: Die Fachlogik existiert meist nur im Code, nicht in Dokumenten. Ein Rewrite ist deshalb kein Übersetzungsprojekt, sondern ein Ausgrabungsprojekt mit Abgabetermin.

Und der Satz auf der Karte — „kein Rückweg bei Abbruch" — ist der eigentliche Grund. Ein abgebrochener Rewrite hinterlässt ein halb totes Altsystem, an dem zwei Jahre lang niemand gearbeitet hat, und ein Neusystem, das nichts kann. Bei Replatform und Refactor in Wellen kannst du nach jeder Welle aufhören.

## Die entscheidende Unterscheidung — Replatform gegen Refactor

| | Replatform | Refactor |
|---|---|---|
| Was passiert mit dem Code | bleibt COBOL, wird neu kompiliert | wird automatisiert nach Java gewandelt |
| Laufzeit | Rocket Software (früher Micro Focus) | AWS Transform for mainframe / Blu Age Runtime |
| Ergebnis | dieselbe Anwendung, andere Plattform | mehrschichtige Java-Anwendung mit API |
| Löst das Rechenzentrums-Problem | ja | ja |
| Löst das Personal-Problem | nein | ja |
| Risiko je Welle | niedrig, weil nichts geändert wird | höher, weil alles geändert wird |
| Typischer Einsatz | erste Wellen, Zeitdruck | spätere Wellen, Zielarchitektur |

Beide Wege setzen auf demselben migrierten Datenstand auf. Deshalb kann Welle 1 replatformen und Welle 3 refactoren — und deshalb ist die Verzweigung auf der Karte eine Gabelung und keine Weiche.

## Die ehrliche Feinheit

**Die Doku widerspricht sich beim Datum.** AWS Mainframe Modernization gibt es in zwei Ausprägungen, und beide sind für Neukunden geschlossen. Für die **Managed Runtime Environment** ist der Fall klar: seit dem 7. November 2025 keine Neukunden mehr, neue Projekte werden auf die selbstverwaltete Variante gelenkt.

Bei der **Self-Managed Experience** nennt der User Guide auf der Einstiegsseite ein Datum, das eine Seite weiter — auf der Seite, die von genau diesem Hinweis verlinkt wird — um einen Monat abweicht. Zwei Seiten desselben Guides, zwei Stichtage. Deshalb steht hier keiner von beiden: Bei zwei widersprüchlichen offiziellen Quellen gehört keine Zahl in den Text. Was gesichert ist: Beide Stichtage liegen im Sommer 2026 und damit hinter uns. Die selbstverwaltete Variante ist heute ebenfalls für Neukunden geschlossen, und das betrifft nicht nur Rocket, sondern auch die Partnerangebote für Datenreplikation, Assembler-Konvertierung und SPARC-Virtualisierung.

**Woran man erkennt, dass hier zwei Firmen im Spiel sind.** Dieselbe Doku-Seite nennt das Replatform-Muster in der Feature-Liste „powered by the Micro Focus Enterprise solution" und zwei Absätze später „powered by Rocket Software (formerly Micro Focus)". Beides derselbe Text. Wer in einem Kurs oder einer Prüfungsfrage auf „Micro Focus" trifft, liest denselben Sachverhalt unter dem alten Namen — das ist kein Fehler der Frage.

**Was das für ein neues Projekt bedeutet.** AWS führt Neukunden inzwischen über **AWS Transform for mainframe**, und die Bestandteile des Refactor-Wegs sind dorthin gewandert. Für Replatform verweist AWS auf die Angebote der Hersteller direkt. Der Dienst, den diese Karte beschreibt, läuft für Bestandskunden weiter und bekommt Sicherheitsupdates, aber keine neuen Funktionen.

**Und eine Zahl, die auf der Karte fehlt, weil es sie nicht gibt:** Die Karte nennt Refactor „teurer und langsamer". Das ist die Erfahrung aus Projekten, nicht eine Aussage von AWS. In der Doku steht dazu nichts. Nimm es als Faustregel, nicht als belegte Größe.

## Syntax lesen — der `batch-settings`-Block

Vier Zeilen, in denen zwei Welten aufeinandertreffen:

```
"batch-settings": {
  "initiators": [{"classes": ["A","B"]}],   ← Job-Klassen, wie auf z/OS
  "jcl-file-location":  "${s3-source}/batch/jcl",
       │                     │
       │                     └─ relativ zum Bucket aus source-locations
       └─ hier liegt die Ablaufsteuerung — als Dateien in S3

  "program-path": "/m2/mount/libs/loadlib:$EFS_MOUNT/emergency/loadlib",
       └─ Doppelpunkt getrennt, wie eine Unix-PATH-Variable; nur EFS erlaubt

  "system-procedure-libraries": "SYS1.PROCLIB;SYS2.PROCLIB",
       └─ Semikolon getrennt, weil Datasetnamen selbst Punkte enthalten

  "aliases": [{"alias": "FDSSORT", "program": "SORT"}]
       └─ das JCL ruft FDSSORT auf; hier wird daraus SORT
}
```

Drei Trennzeichen in einem Block — Komma im JSON, Doppelpunkt im Pfad, Semikolon in den Bibliotheken. Das ist kein Designfehler, sondern Archäologie: Jede Konvention stammt aus der Welt, in der sie entstanden ist.

Am meisten steckt in `aliases`. Dein JCL ruft ein Sortierprogramm unter dem Namen auf, den es seit dreißig Jahren aufruft. Auf AWS heißt das Programm anders. Statt tausend JCL-Dateien anzufassen, legst du eine Zuordnung an. **Das ist Replatform in einer Zeile: nicht den Code ändern, sondern die Umgebung so einrichten, dass der Code recht behält.**

## Was du dadurch nicht baust

Zähl durch, was hier **nicht** entsteht:

- kein Mainframe auf EC2 — es gibt keinen z/Architecture-Emulator als Antwortoption
- keine Microservices durch Replatform: Aus einem Batch-Monolithen wird ein Batch-Monolith auf anderer Hardware
- keine neue Fachlogik: Beide Wege zielen auf funktionale Äquivalenz, nicht auf Verbesserung
- keine Ablösung des COBOL-Wissens durch Replatform
- keine Ein-Schritt-Migration: Ohne Datenmigration keine Testbarkeit, ohne Analyse kein Wellenplan
- kein Weg zurück, wenn du den Big Bang wählst

Übrig bleibt ein Wellenplan, ein S3-Bucket voller Artefakte und eine Datenbank, die vorher VSAM hieß.

## Wenn du dir eine Sache merkst

**Replatform tauscht den Boden unter dem Code, Refactor tauscht den Code — und Rehost gibt es nicht, weil die Architektur eine andere ist.**

MGN repliziert x86-Server blockweise nach EC2 und kann mit z/OS nichts anfangen. DMS bewegt die Daten und lässt die Programme stehen. Ein manueller Rewrite ist kein AWS-Dienst, sondern ein Projektrisiko mit Stichtag.

## Prüfungsknackpunkte

**Signalwörter.** „COBOL batch workload on z/OS" plus „phase out the data center in waves, not a big bang" → Mainframe Modernization, Replatform zuerst. „Keep the code but change the platform" → **Replatform**. „Automatically convert COBOL to Java" oder „the last COBOL developers are retiring" → **Refactor**. „No lift and shift for mainframe architecture" ist keine Falle, sondern eine Tatsache.

**Die Reihenfolge-Falle.** Antworten, die mit der ersten Migrationswelle beginnen und die Datenmigration später einplanen, sind falsch — ohne Daten ist keine Laufzeit testbar. Ebenso falsch: die Analyse überspringen, weil man den Bestand ja kenne.

**Die Cloud-native-Falle.** Refactor klingt nach der richtigen Antwort, weil es moderner klingt. Wenn die Aufgabe Zeitdruck betont — auslaufender Wartungsvertrag, Kündigung des Rechenzentrums —, ist Replatform gemeint. Erst raus, dann modernisieren.

**A — Rehost per MGN auf EC2:** Setzt x86-Quellserver voraus. Für z/OS existiert diese Option schlicht nicht.

**C — Refactor für den gesamten Bestand in einem Zug:** Die richtige Technik zum falschen Zeitpunkt; unter Zeitdruck die riskanteste Wahl.

**D — Manueller Rewrite mit Stichtag:** Verlangt eine Dokumentation der Fachlogik, die es nicht gibt, und hat keinen Rückweg.

**E — Mainframe behalten, nur Daten nach AWS replizieren:** Ein legitimes Muster für Analytik. Es räumt aber kein Rechenzentrum und löst kein Personalproblem.
