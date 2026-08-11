---
cardNumber: 49
slug: cloudtrail-organization-trail-athena-partition-projection-eichkamp-energie-forensik-nach-vier-monaten
title: "AWS CloudTrail · Organization Trail und Athena — Forensik, wenn der Vorfall vier Monate her ist"
services:
  - AWS CloudTrail
  - Amazon S3
  - Amazon Athena
  - AWS Glue Data Catalog
  - AWS Organizations
domains:
  - D1
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake-service-availability-change.html"
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/logging-insights-events-with-cloudtrail.html"
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/insights-events-enable.html"
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/insights-events-costs.html"
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-concepts.html"
  - "https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-events.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/cloudtrail-logs.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/capacity-management.html"
  - "https://docs.aws.amazon.com/athena/latest/ug/capacity-management-editing-capacity-reservations.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/11/cloudtrail-insights-data-events-detect-anomalies-access/"
  - "https://aws.amazon.com/about-aws/whats-new/2026/02/amazon-athena-one-minute-capacity-reservations"
  - "https://aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability"
---

## Die Grundidee zuerst

Eichkamp Energie betreibt 30 AWS-Accounts. An einem Montagmorgen ist ein Produktions-Bucket mit sechs Monaten Netzauslastungsdaten leer. Niemand meldet sich. Die Rekonstruktion ergibt, dass die Löschung rund vier Monate zurückliegt. Die Revision will drei Dinge wissen: welcher Principal, von welcher IP, und was sonst noch in derselben Sitzung passiert ist.

**Weg eins:** Jede Filiale führt ihr eigenes Kassenbuch, und im Foyer der Zentrale hängt ein Bildschirm, der die Buchungen der letzten drei Monate anzeigt. Der Bildschirm ist bequem, er ist immer an, und er kostet nichts. Wer wissen will, was vor vier Monaten in Filiale siebzehn passiert ist, steht davor und sieht nichts. Der Bildschirm hat nichts aufgehoben — er hat nur angezeigt.

**Weg zwei:** Jede Filiale schickt ihre Belege täglich in ein zentrales Archiv. Dort liegen sie in Regalen, sortiert nach Filiale, dann nach Region, dann nach Jahr, Monat und Tag. Wer etwas sucht, geht in genau ein Regal und zieht genau einen Ordner. Wer die Sortierung ignoriert, muss jedes Regal öffnen — und bezahlt das Öffnen jedes Regals.

Der Unterschied ist nicht, wie genau protokolliert wird. Beide protokollieren dasselbe. Der Unterschied ist, ob das Protokoll aufgehoben wird und ob es sortiert ist.

## Was es eigentlich ist — ein Trail ist eine Lieferung, keine Ansicht

Die Verwechslung, aus der die meisten Prüfungsfragen dieser Familie gebaut sind, steckt schon im Wort. „CloudTrail" klingt nach einer Sache, die man anschaut. Tatsächlich sind es zwei Sachen mit demselben Namen im Konsolenmenü.

Die **Event History** ist eine Ansicht. Sie zeigt die Management Events der letzten 90 Tage, sie ist kostenlos, sie ist ohne jede Konfiguration da. Sie liefert nichts nach S3, sie hängt an keinem CloudWatch-Log, und Athena kann sie nicht abfragen. Sie ist ein Fenster, kein Speicher.

Ein **Trail** ist eine Lieferung. Man legt ihn an, gibt einen Ziel-Bucket an, und ab diesem Zeitpunkt schreibt CloudTrail die Events dort als komprimierte JSON-Dateien hinein. Der entscheidende Satz für die Prüfung: Ein Trail wirkt nur nach vorn. Er sammelt ab dem Moment seiner Anlage. Wer ihn nach dem Vorfall anlegt, hat für den Vorfall nichts.

Ein **Organization Trail** ist derselbe Mechanismus, im Management Account definiert und für alle Mitgliedskonten wirksam. Alle 30 Accounts von Eichkamp liefern in einen Bucket, typischerweise im Log-Archive-Account. Ohne ihn liegt jede Spur im jeweiligen Account, und die Frage „wer war das" lässt sich accountübergreifend gar nicht stellen.

Und schließlich die Unterscheidung, an der das ganze Szenario hängt: **Management Events** protokollieren die Kontrollebene und sind der Standard. **Data Events** protokollieren die Datenebene — S3-Objektzugriffe, Lambda-Invocations — sind ein Opt-in über Event Selectors und kosten je Event.

## Der Weg durch die Karte

### Kasten — der Organization Trail

Der linke Kasten trägt die Zeile „ohne Trail keine Forensik". Das ist keine Zuspitzung, sondern die Voraussetzung für alles rechts davon. Eichkamp hat den Trail vor dem Vorfall angelegt — sonst wäre die Karte nach dem ersten Kasten zu Ende.

Ein Detail, das in Prüfungsfragen mit accountübergreifendem Zugriff gern versteckt wird: Ein `AssumeRole`-Aufruf erscheint im CloudTrail des Accounts, dem die **Rolle** gehört, nicht dem des Aufrufers. Wer eine Kette über zwei Accounts rekonstruieren will, muss an beiden Enden schauen — und genau das macht die zentrale Sammlung so wertvoll.

### Pfeil 1 — liefert

Ein Trail liefert nicht sofort. Zwischen dem API-Aufruf und der Datei im Bucket vergehen typischerweise Minuten, nicht Sekunden. Für Forensik nach vier Monaten spielt das keine Rolle. Für die Frage „warum sehe ich meinen gerade eben getätigten Aufruf noch nicht" spielt es sehr wohl eine — und sie ist ein beliebter Distraktor.

### Kasten — das S3 Log-Archive

Hier steht die wichtigste Zeile der ganzen Karte, und sie sieht aus wie eine Nebensächlichkeit: **Struktur = Partitionsschema.**

CloudTrail legt seine Dateien unter `AWSLogs/<account-id>/CloudTrail/<region>/<yyyy>/<mm>/<dd>/` ab. Diese Struktur ist nicht dekorativ. Account, Region und Tag stehen bereits im Schlüssel, und genau das macht sie zu Partitionsspalten, sobald Athena darüber liest. Der Speicher hat die Sortierung schon mitgeliefert — man muss sie nur benutzen.

### Pfeil 2 — die Tabelle darauf

Athena speichert nichts. Es legt eine Tabellendefinition über Dateien, die schon da liegen. Die Definition landet im Glue Data Catalog; die Daten bleiben, wo sie sind. Das ist dieselbe Mechanik wie auf Karte 40, nur mit CloudTrail-Logs statt eines allgemeinen Data Lake als Quelle — die Herleitung des Speicherlayouts steht dort und wird hier nicht wiederholt.

### Kasten — Amazon Athena mit Partition Projection

Der Kasten nennt drei Dinge, und alle drei sind dieselbe Aussage aus drei Richtungen: Partition Projection, kein Glue-Crawler nötig, kein `MSCK REPAIR TABLE`.

Normalerweise muss Athena wissen, welche Partitionen es gibt. Diese Liste steht im Glue Data Catalog und muss gepflegt werden — durch einen Crawler, der regelmäßig läuft, oder durch `ALTER TABLE ADD PARTITION` von Hand. Bei CloudTrail entstehen pro Account, Region und Tag neue Partitionen. Bei 30 Accounts und zwei Regionen sind das 60 neue Partitionen täglich.

Partition Projection dreht das um: Statt die Partitionen nachzuschlagen, **berechnet** Athena sie aus einem hinterlegten Muster. Man beschreibt einmal, wie die Schlüssel aussehen, und Athena leitet daraus zur Laufzeit ab, welche Präfixe es lesen muss. Kein Crawler, keine Metadaten-Abfrage vor jeder Query. Der Katalog bleibt trotzdem im Spiel — er hält weiterhin die Tabellendefinition. Ersetzt wird nur die laufende Partitionsverwaltung darin.

### Pfeil 3 — Sekunden statt Stunden

Die Zeitangabe auf dem Pfeil beschreibt keinen Dienst, sondern einen Unterschied. Eine Abfrage mit Partitionsprädikaten liest die Dateien eines Tages in einem Account. Dieselbe Abfrage ohne sie liest sechs Monate mal 30 Accounts. Die Laufzeit ist dabei das kleinere Problem.

### Kasten — die SQL-Antwort

`userIdentity.arn`, `sourceIPAddress`, `eventTime`, dazu die Request-Parameter. Über die Session-ID im ARN lässt sich anschließend rekonstruieren, was derselbe Principal im selben Zeitfenster sonst noch getan hat — die dritte Frage der Revision, und die, für die sich der ganze Aufwand lohnt.

Wenn die Rollen aus IAM Identity Center stammen, erscheinen sie hier als `AWSReservedSSO_<PermissionSet>_<Suffix>`. Das ist die praktische Verbindung zu Karte 48: Dort wird Zugriff gewährt und begrenzt, hier wird nachgesehen, was damit getan wurde.

### Pfeil 4 — parallel

Der gestrichelte Pfeil nach unten sagt „parallel". Er meint: Was jetzt kommt, ist keine Fortsetzung der Kette, sondern etwas, das gleichzeitig hätte laufen können.

### Kasten — CloudTrail Insights, und die Zeile, die korrigiert werden musste

Insights ist die eingebaute Anomalieerkennung. Sie bildet aus den Events der zurückliegenden 28 Tage eine Baseline und meldet, wenn die aktuelle Rate deutlich davon abweicht. Zwei Typen sind wählbar: **API call rate** für ungewöhnliche Aufrufmengen und **API error rate** für ungewöhnliche Fehlerraten.

Die Karte trug ursprünglich die Zeile „hätte gemeldet". Sie steht dort nicht mehr, und der Grund ist der wichtigste Lerninhalt dieser Karte. Er steht unter „Die ehrliche Feinheit".

### Pfeil 5 und der Goldkasten — ohne Partitionsfilter

Der goldene Pfeil zeigt nach oben auf Athena und trägt kein Datum und keinen Datenfluss, sondern eine Warnung über eine Eigenschaft.

Athena rechnet im Standardmodell nach **gescannten Bytes** ab, nicht nach Laufzeit. Eine Abfrage ohne Partitionsprädikate liest die gesamte Historie. Der Kasten nennt den Hebel: Tag und Account gehören als Predicate in die `WHERE`-Klausel. Zwei weitere Hebel stehen nicht auf der Karte, gehören aber dazu — nur die benötigten Spalten selektieren statt `SELECT *`, und für wiederkehrende Auswertungen die JSON-Logs per `CREATE TABLE AS SELECT` in ein spaltenorientiertes Format überführen.

### Der verworfene Weg — Event History

Das rote X sitzt auf dem Pfad von der Event History nach oben, und das Label daneben sagt, warum: „Vorfall 4 Monate her". Die Event History reicht 90 Tage. Selbst wenn der Vorfall gestern gewesen wäre, bliebe der zweite Ausschlussgrund: Sie zeigt ausschließlich Management Events. Objektlöschungen in einem Bucket sind Data Events und stehen dort grundsätzlich nicht drin — unabhängig vom Datum.

### Die Randnotiz — CloudTrail Lake

Die drei Zeilen ohne Kasten sind bewusst kein verworfener Pfad. CloudTrail Lake ist der Dienst, der genau diese Aufgabe ohne Athena gelöst hätte: SQL auf Audit-Logs, ohne eigenen Bucket und ohne Tabellendefinition. Seit dem 31.05.2026 nimmt er keine neuen Kunden mehr an. Bestandskunden nutzen ihn normal weiter, er erhält aber nur noch kritische Bugfixes und Sicherheitsupdates; AWS verweist für vergleichbare Fähigkeiten auf CloudWatch.

Für eine neu aufzubauende Umgebung ist damit der Athena-Weg nicht die umständlichere Alternative, sondern der verbleibende Standardweg.

## Die entscheidende Unterscheidung

**Insights erkennt, dass etwas passiert. Ein Trail plus Athena rekonstruiert, was passiert ist.**

Das ist keine Frage der Qualität, sondern der Zeitachse. Insights ist ein Alarm: Es läuft mit und meldet Abweichungen von der Baseline. Es weiß nicht, wer etwas getan hat — es weiß, dass ungewöhnlich viel getan wurde. Ein Trail ist ein Archiv: Er weiß nichts über normal oder ungewöhnlich, aber er hat jede Zeile aufgehoben.

Daraus folgt die Arbeitsteilung, die auf der Karte als gestrichelter Pfeil steht: Insights verkürzt die Zeit, bis jemand hinschaut. Athena beantwortet, was er dann sieht. Die Karte, auf der Insights die Hauptrolle spielt, ist 45.

## Die ehrliche Feinheit

Die Karte behauptete in ihrer ersten Fassung, Insights hätte das Massenlöschen gemeldet. Diese Zeile war in jedem einzelnen Wort korrekt und für das Szenario trotzdem falsch.

Der Grund: Ein geleerter Bucket besteht aus `DeleteObject`- und `DeleteObjects`-Aufrufen. Das sind **Data Events**. Der CloudTrail User Guide beschreibt Insights an mehreren Stellen als Analyse von Management Events — API call rate misst write-only Management-Aufrufe, API error rate misst Management-Aufrufe mit Fehlercodes. Nach dieser Beschreibung hätte Insights von der Löschung nie etwas mitbekommen.

Am 20.11.2025 hat AWS Insights auf Data Events erweitert. Bis dahin analysierte es ausschließlich Management Events. Die Zeile trägt also — aber erst seit acht Monaten, und nur unter zwei Bedingungen, die nicht auf der Karte standen: Der Trail muss Data Events loggen, und Insights muss für Data Events eingeschaltet sein. Beides ist Opt-in, beides kostet zusätzlich, und beides ist bei einem Trail, der aus Kostengründen nur Management Events sammelt, nicht der Fall.

Deshalb steht auf der Karte jetzt „meldet nur mit Data Events".

Zwei Nachträge, die dieselbe Vorsicht verdienen. Erstens ist der Dokumentationsstand uneinheitlich: Die Konsolen-Anleitung kennt die Wahl zwischen Management und Data Events, drei Übersichtsseiten des User Guide beschreiben Insights weiterhin als reine Management-Event-Analyse. Zweitens ist Insights nicht sofort da — nach dem Einschalten kann CloudTrail bis zu 36 Stunden brauchen, bis Insights-Events für einen Trail geliefert werden, bei einem Event Data Store bis zu sieben Tage.

Und eine Feinheit zur Gold-Box: „Abrechnung nach Bytes" gilt für das Standardmodell. Seit dem 10.02.2026 lassen sich Athena-Kapazitätsreservierungen ab 4 DPU und ab einer Minute buchen — vorher waren es 24 DPU und 60 Minuten. Wer reserviert, zahlt nach DPU und hat keine Gebühren für gescannte Daten mehr. Die Kostenfalle auf der Karte ist also die des Default-Modells. Nebenbei ein Beispiel dafür, wie schnell Doku veraltet: Die Seite *Edit capacity reservations* nennt weiterhin 24 als Minimum, während die Ankündigung ausdrücklich von einer Senkung spricht.

## Syntax lesen

Partition Projection wird nicht programmiert, sondern in Tabelleneigenschaften beschrieben. Für eine CloudTrail-Tabelle mit den drei Partitionsspalten `account`, `region` und `day` sieht der Kern so aus:

```sql
TBLPROPERTIES (
  'projection.enabled' = 'true',
  'projection.account.type' = 'enum',
  'projection.account.values' = '111122223333,444455556666',
  'projection.region.type' = 'enum',
  'projection.region.values' = 'eu-central-1,eu-west-1',
  'projection.day.type' = 'date',
  'projection.day.range' = '2025/01/01,NOW',
  'projection.day.format' = 'yyyy/MM/dd',
  'projection.day.interval' = '1',
  'projection.day.interval.unit' = 'DAYS',
  'storage.location.template' =
    's3://eichkamp-log-archive/AWSLogs/${account}/CloudTrail/${region}/${day}/'
)
```

Drei Stellen sind es wert, gelesen zu werden. `projection.enabled` schaltet das Ganze ein — fehlt es, bleibt die Tabelle auf Katalog-Partitionen angewiesen, und die sind leer. `NOW` in `projection.day.range` verschiebt das Ende des Bereichs täglich mit; ein festes Enddatum wäre der Fehler, den man ein halbes Jahr später bemerkt. Und `storage.location.template` ist die Stelle, an der die Prefix-Struktur des Buckets tatsächlich abgebildet wird — die Platzhalter müssen exakt die Partitionsspalten sein.

Die Abfrage selbst zeigt dann, wo der Unterschied zwischen billig und teuer liegt:

```sql
SELECT useridentity.arn, sourceipaddress, eventtime, requestparameters
FROM cloudtrail_logs
WHERE account   = '444455556666'
  AND region    = 'eu-central-1'
  AND day BETWEEN '2026/04/01' AND '2026/04/30'
  AND eventname IN ('DeleteObject', 'DeleteObjects')
ORDER BY eventtime
```

Die ersten drei Bedingungen filtern auf Partitionsspalten und entscheiden, welche Dateien überhaupt geöffnet werden. Die vierte filtert innerhalb der geöffneten Dateien. Verschöbe man die Datumsbedingung von `day` auf `eventtime`, bliebe das Ergebnis identisch und die Rechnung stiege um den Faktor der gesamten Historie — weil `eventtime` eine Spalte im Datensatz ist und keine Partitionsspalte.

## Was du dadurch nicht baust

Du baust keine Echtzeitüberwachung. Zwischen Aufruf und Datei im Bucket liegen Minuten, und die Abfrage startet jemand von Hand. Wer eine Reaktion in Sekunden braucht, nimmt EventBridge auf CloudTrail-Events oder GuardDuty — beides steht auf Karte 45.

Du baust keine Protokollierung von Dingen, die CloudTrail nicht sieht. SSH- und RDP-Sitzungen auf EC2-Instanzen protokolliert der Session Manager. Netzwerkverkehr innerhalb einer VPC gehört in VPC Flow Logs, DNS-Abfragen ins Route 53 Resolver Query Logging. Und der **Inhalt** eines S3-Objekts steht nirgends in CloudTrail. Die Frage lautet immer „wer hat welchen API-Aufruf gemacht", nie „was stand in der Datei".

Du baust auch keine Spur, die es vorher nicht gab. Ein Trail, der nur Management Events sammelt, hat die Objektlöschungen nicht — und keine noch so gute Abfrage holt sie zurück. Der teuerste Satz dieser Karte lautet: Data Events müssen vor dem Vorfall eingeschaltet gewesen sein.

## Wenn du dir eine Sache merkst

**Event History ist kein Trail.** Sie zeigt 90 Tage, nur Management Events, liefert nichts nach S3 und ist nicht abfragbar. Alles, was Forensik heißt, setzt einen Trail voraus, der vor dem Vorfall existierte — und alles, was Objekte betrifft, setzt zusätzlich Data Events voraus.

## Prüfungsknackpunkte

**Warum Event History hier verliert:** Der Zeitbezug ist der auffällige Grund, aber nicht der einzige. Steht in einer Frage ein Zeitraum jenseits von 90 Tagen, ist sie raus. Steht dort ein Objektzugriff, ist sie auch bei zwei Tagen raus.

**Warum CloudTrail Lake hier verliert:** Fachlich verliert es nicht — es wäre der bequemere Weg. Für neu aufzubauende Umgebungen ist es seit dem 31.05.2026 nicht mehr verfügbar. In Prüfungsfragen aus älterem Material steht es weiterhin als empfohlene Antwort; wer die Verfügbarkeitsänderung kennt, erkennt solche Fragen als veraltet.

**Warum ein Glue-Crawler hier verliert:** Er funktioniert, kostet aber laufend Zeit und Geld für eine Partitionsliste, die sich aus dem Schlüsselmuster berechnen lässt. Sobald in einer Frage „täglich neue Partitionen" oder „ohne zusätzliche Verwaltung" steht, ist Partition Projection gemeint.

**Warum ein Filter auf `eventTime` hier verliert:** Er liefert das richtige Ergebnis zum falschen Preis. Nur Filter auf Partitionsspalten verhindern das Scannen.

**Warum Insights allein hier verliert:** Es meldet Abweichungen, es nennt keine Principals. Und es meldet Objektlöschungen nur, wenn Data Events geloggt werden und Insights dafür eingeschaltet ist.

**Die Signalwörter:** „who deleted", „after the fact", „across all accounts", „older than 90 days", „query logs with SQL", „minimize query cost". Die ersten drei zeigen auf den Organization Trail, die vierte schließt Event History aus, die letzten beiden zeigen auf Athena mit Partitionsfilter.
