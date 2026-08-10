---
cardNumber: 27
slug: timestream-liveanalytics-influxdb-nordwerk-zeitreihen
title: "Timestream — IoT-Zeitreihen zwischen Prüfungsstand und Produktstand"
services: ["Amazon Timestream for LiveAnalytics", "Amazon Timestream for InfluxDB", "AWS IoT Core"]
domains: ["D3", "D4"]
badgeCount: 7
narrativeVersion: 1
factCheckedAt: "2026-07-30"
sources:
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/AmazonTimestreamForLiveAnalytics-availability-change.html"
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/API_RetentionProperties.html"
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/doc-history.html"
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/influxdb3.html"
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/core-and-enterprise-versions.html"
  - "https://docs.aws.amazon.com/timestream/latest/developerguide/influxdb3-faq.html"
  - "https://aws.amazon.com/about-aws/whats-new/2025/10/amazon-timestream-influxdb-3"
  - "https://aws.amazon.com/blogs/database/features-and-workflows-with-amazon-timestream-for-influxdb-3/"
---

## Die Grundidee zuerst

Stell dir zwei Arten vor, ein Lager für Messwerte zu betreiben.

**Art eins:** Eine große, klimatisierte Halle direkt an der Verladerampe. Alles liegt dort — die Vibrationswerte von heute Morgen und die von Mai 2023, nebeneinander, gleich griffbereit. Wer etwas braucht, geht rein und holt es. Funktioniert tadellos und ruiniert dich, weil du für drei Jahre alter Daten dieselbe Rampenmiete zahlst wie für die letzten zehn Minuten.

**Art zwei:** Vorne eine schmale Werkbank, auf der nur die letzten Stunden liegen. Dahinter ein einfaches Regallager für drei Jahre, billig, etwas langsamer, selten betreten. Und — das ist der Teil, der leicht untergeht — **ein Lagerist, dem du nicht sagen musst, wo er suchen soll.** Du fragst „alle Lagertemperaturen von Maschine 4711 seit Januar", er geht nach vorne, nach hinten oder in beide Bereiche und bringt dir eine Liste.

Nordwerk Antriebstechnik hat 40.000 Maschinen im Feld, drei Millionen Messwerte pro Minute und zwei Fragen, die sich widersprechen: Die Leitwarte will die letzten zehn Minuten in Millisekunden, die Konstruktion will drei Jahre über eine ganze Baureihe. Art eins beantwortet beide und ist unbezahlbar. Art zwei beantwortet beide und rechnet sich.

Das ist eine Zeitreihen-Datenbank: **Die Zeit ist nicht eine Spalte unter vielen, sondern die Ordnung, nach der alles abgelegt wird** — und deshalb kann der Dienst anhand des Alters entscheiden, wo etwas liegt.

## Was es eigentlich ist — zwei Zahlen

Das Data-Lifecycle-Management, für das man anderswo Lambdas, Lifecycle-Regeln und Archivierungsjobs baut, besteht hier aus zwei Feldern an der Tabelle:

```json
{
  "TableName": "getriebe_telemetrie",
  "RetentionProperties": {
    "MemoryStoreRetentionPeriodInHours": 12,
    "MagneticStoreRetentionPeriodInDays": 1095
  },
  "MagneticStoreWriteProperties": {
    "EnableMagneticStoreWrites": true
  }
}
```

Zwölf Stunden auf der Werkbank, drei Jahre im Regal. Danach ist der Wert weg — nicht verschoben, weg.

Die erlaubten Spannen sind in der API-Referenz eindeutig: der Memory Store nimmt 1 bis 8.766 Stunden, der Magnetic Store 1 bis 73.000 Tage. Beides ist Pflichtangabe, es gibt keinen stillen Standardwert, den man übersehen könnte. 8.766 Stunden sind übrigens genau ein Jahr — die Obergrenze der schnellen Stufe ist damit großzügiger, als der Name „Memory" vermuten lässt, und der Preis pro GB-Stunde sorgt dafür, dass niemand sie ausreizt.

Das dritte Feld gehört zu einer Falle, die weiter unten steht. Merk es dir vorerst nur als vorhanden.

## Der Weg durch die Karte

### Die beiden Zonen — warum diese Karte doppelt ist

Bevor du einem Pfeil folgst, sieh dir die zwei gestrichelten Rahmen an. Keine andere Karte dieser Reihe hat zwei gleichwertige Zonen, und das ist kein Layoutspleen.

Die obere Zone zeigt, was die SAA-C03-Prüfung abfragt. Die untere zeigt, was ein Team im Jahr 2026 tatsächlich aufsetzen würde. Beide beginnen bei derselben IoT-Core-Box, beide enden bei einem Dashboard — dazwischen liegen zwei verschiedene Produkte.

**Das ist keine Alternativen-Darstellung im üblichen Sinn.** Sonst zeigt eine Karte einen richtigen Weg und einen verworfenen mit rotem X. Hier ist keiner der beiden Wege falsch: Der obere ist die richtige Prüfungsantwort, der untere die richtige Praxisentscheidung. Wer das zusammenwirft, lernt entweder die falsche Antwort oder baut das falsche System.

Halte die beiden getrennt, während du die Pfeile durchgehst. Badge 2 gehört nach oben, Badge 3 nach unten, und sie starten an derselben Stelle.

### Badge 1 — Sensoren → IoT Core, per MQTT

40.000 Getriebe sprechen MQTT gegen AWS IoT Core. MQTT ist für Geräte gebaut, die wenig Strom haben und eine wackelige Verbindung: Eine Sitzung wird einmal aufgebaut und bleibt offen, Nachrichten sind winzig.

Das Bild dazu: Ein HTTP-Request pro Messwert wäre, als würdest du für jeden Satz einen eigenen Brief mit Umschlag, Briefmarke und Anschrift verschicken. MQTT ist ein Telefonat, das offen bleibt.

### Badge 2 — IoT Core → Memory Store, per Rule Action

Eine **Rule Action** in IoT Core schreibt direkt nach Timestream. Kein Lambda, kein Kleber, kein eigener Code.

Das ist das Muster, das die Prüfung abfragt: IoT Core routet per Regel in die Zieldatenbank. Wenn eine Antwortoption eine Lambda zwischen IoT Core und die Datenbank stellt, um „die Daten zu transformieren", ist das in dieser Frage der Umweg — genau die undifferenzierte Schwerarbeit, die der Dienst abnimmt.

### Badge 3 — IoT Core → Timestream for InfluxDB

Derselbe Ursprung, dieselbe Regel, ein anderes Ziel. Der Pfeil trägt bewusst kein eigenes Label, weil er dieselbe Aussage wie Badge 2 hätte.

Was in der unteren Zone steht, ist keine Alternative im Sinne von „geht auch", sondern der Weg, den ein neu startendes Team heute nehmen **muss**. Warum, steht weiter unten unter der zentralen Divergenz.

### Badge 4 — Memory Store → Magnetic Store

Nach Ablauf der Memory-Retention wandern die Werte automatisch in den Magnetic Store. Kein Job, keine Lifecycle-Regel, kein Skript.

**Das ist der eigentliche Verkaufsgrund des Dienstes, und er ist leiser als jede Latenzzahl:** Du beschreibst den gewünschten Zustand in zwei Zahlen, und der Übergang passiert.

Was auf der Karte nicht steht, weil es die Zonenlogik gestört hätte: Beide Stufen werden innerhalb der Region automatisch über mehrere Availability Zones repliziert. Der Magnetic Store ist keine Kaltarchiv-Stufe mit Wiederherstellungszeit — er ist nur billiger und für analytische Abfragen ausgelegt statt für Punktabfragen.

### Badge 5 — Magnetic Store → SQL-Abfrage

Hier landet die Drei-Jahres-Frage der Konstruktion. Der Magnetic Store ist auf Langzeitspeicherung, spät eintreffende Schreibvorgänge mit geringerem Durchsatz und schnelle analytische Abfragen ausgelegt.

Abgerechnet wird nach gescannter Datenmenge. Das ist der Grund, warum die Zeitfenster-Bedingung in einer Timestream-Abfrage nicht nur fachlich, sondern finanziell zählt: Eine Abfrage ohne Zeitgrenze scannt drei Jahre und bezahlt drei Jahre.

### Badge 6 — Memory Store → dieselbe Abfrage

Der gestrichelte Pfeil ist der Trick der ganzen Architektur. Die **adaptive Query-Engine** greift über beide Stufen hinweg zu, ohne dass die Abfrage sagt, wo die Daten liegen.

**Es gibt kein `FROM memory_store`.** Du schreibst eine SQL-Abfrage über einen Zeitraum, und die Engine entscheidet, aus welcher Stufe sie liest — oder aus beiden, wenn der Zeitraum die Grenze überschreitet.

Das ist der Lagerist aus der Grundidee. Und es ist der Punkt, an dem die meisten Distraktoren scheitern: Jede Antwortoption, die zwei getrennte Abfragen baut, einen `UNION` bildet oder die Anwendung entscheiden lässt, welcher Speicher zuständig ist, beschreibt Arbeit, die es hier nicht gibt.

### Badge 7 — InfluxDB → SQL und InfluxQL

Der Realitätspfad endet ebenfalls bei einem Dashboard, meist Grafana. Aber mit einem zweiten Abfragedialekt daneben: InfluxDB 3 versteht SQL **und** InfluxQL.

Zwei Sprachen sind keine Bequemlichkeit, sondern eine Migrationsentscheidung. Wer aus der InfluxDB-Welt kommt, bringt InfluxQL-Abfragen mit. Wer von LiveAnalytics kommt, bringt SQL mit — und stellt fest, dass „SQL hier" und „SQL dort" nicht dieselben Funktionen bedeuten. Die Zeitreihenfunktionen von LiveAnalytics wandern nicht mit.

### Der Bestandskunden-Kasten — und was daran heute wackelt

Auf der Karte steht „LiveAnalytics läuft unverändert weiter". Diese Zeile gibt die AWS-Doku korrekt wieder: Die Availability-Change-Seite sagt, laufende Workloads seien nicht betroffen und AWS investiere weiterhin in Sicherheit, Verfügbarkeit und Performance. Bestandskunden mit aktivem Payer-Account dürfen unter diesem Payer weiterhin neue Nutzer und Linked Accounts anlegen.

**Inzwischen gibt es dazu eine zweite offizielle AWS-Aussage, die anders klingt.** Der AWS-Database-Blog vom Mai 2026 bezeichnet LiveAnalytics als derzeit im *maintenance mode* und InfluxDB 3 als dessen idealen Ersatz. Beide Quellen stammen von AWS, beide sind aktuell, und sie widersprechen sich in der Tendenz: aktive Investition auf der einen, Wartungsmodus auf der anderen Seite.

Für dich heißt das zweierlei. Für die Prüfung: irrelevant, LiveAnalytics ist nicht abgeschaltet. Für eine Architekturentscheidung: Ein Dienst, den der Hersteller selbst „maintenance mode" nennt, ist keine Grundlage für ein neues System — unabhängig davon, dass die Doku freundlicher formuliert.

## Die entscheidende Unterscheidung — Prüfungsstand gegen Produktstand

**AWS hat den Zugang für Neukunden zu Timestream for LiveAnalytics zum 20.06.2025 geschlossen.** Angekündigt am 20.05.2025, geführt auf der AWS-Produktlebenszyklus-Seite in der Kategorie „closing access to new customers" — ausdrücklich nicht unter „end of support".

| | Prüfungsstand | Produktstand |
|---|---|---|
| Erwartete Antwort | „Amazon Timestream" | LiveAnalytics nur für Bestandskunden |
| Architektur | serverless, Memory + Magnetic Store | InfluxDB 3, Cluster, S3 als Speicher |
| Abfragesprache | SQL | SQL **und** InfluxQL |
| Empfehlung | — | Neukunden sollen InfluxDB evaluieren |

Für die Prüfung antwortest du weiter „Timestream". Die SAA-C03-Frage zielt auf das Muster „Zeitreihen brauchen eine Zeitreihen-Datenbank", nicht auf den Vertriebsstatus eines Produkts.

Und jetzt zu dem, was die Karte an dieser Stelle nicht genau genug sagt.

**Auf der Karte steht „managed InfluxDB 3" — richtig ist: Timestream for InfluxDB führt zwei Engine-Linien.** Die 2.7-Linie läuft weiter, InfluxDB 3 kam am 16.10.2025 dazu. „Core und Enterprise" sind die beiden Editionen von **InfluxDB 3**, nicht von Timestream for InfluxDB insgesamt. Fixvorschlag: `managed InfluxDB 2.7 und 3`.

**Auf der Karte steht „Instanzen statt Serverless" — richtig ist: Cluster.** Die AWS-Doku stellt den DB-Cluster als Grundbaustein von Timestream for InfluxDB 3 vor und grenzt ihn ausdrücklich gegen traditionelle Datenbankinstanzen ab: Compute und Storage sind getrennt, die Daten liegen in Parquet-Dateien auf S3. Die `.md` der Karte weiß das und schreibt es unter „Bewusste Vereinfachungen" korrekt — die Kartenzeile widerspricht ihrem eigenen Begleittext. Fixvorschlag: `Cluster statt Serverless`.

Der Kern der Kartenaussage bleibt trotzdem richtig, und darauf kommt es an: Du wählst hier eine Kapazität und bezahlst sie, statt dass ein Dienst sie unsichtbar für dich regelt. Genau das unterscheidet den unteren vom oberen Pfad.

## Die ehrliche Feinheit

**Spät eintreffende Messwerte sind bei IoT kein Randfall, sondern der Normalfall.** Ein Getriebe in einer Werkshalle ohne Empfang sammelt zwei Tage lang Werte und schickt sie nach, wenn die Verbindung zurück ist. Diese Werte tragen alte Zeitstempel.

Liegt der Zeitstempel vor der Memory-Store-Retention, wird der Schreibvorgang **abgelehnt** — es sei denn, an der Tabelle steht `EnableMagneticStoreWrites`. Das ist das dritte Feld aus dem JSON-Block oben. Mit ihm nimmt die Tabelle Werte an, die älter als die Memory-Retention, aber jünger als die Magnetic-Retention sind.

Bei zwölf Stunden Memory-Retention und Sensoren im Feld heißt das: Ohne dieses Flag verlierst du still jeden Messwert, dessen Gerät länger als einen halben Tag offline war. Das Diagramm zeigt es nicht, und der Fehler meldet sich nicht bei dir, sondern nur in einem Rejection-Report, den du selbst nach S3 schreiben lassen musst.

**Retention ist kein Backup.** Läuft die Magnetic-Retention ab, sind die Daten weg. Wer zehn Jahre aufbewahren muss — bei Industriegetrieben eine realistische Gewährleistungsfrage — setzt entweder die Retention entsprechend oder exportiert nach S3.

**Scheduled Queries sind ein Kostenwerkzeug, keine Bequemlichkeit.** Sie rechnen Aggregate vorab aus und schreiben sie in abgeleitete Tabellen mit **eigener, entkoppelter Retention**. Damit darf die Quelltabelle kurz aufbewahren, während die Stundenmittelwerte drei Jahre bleiben — zu einem Bruchteil der Speicherkosten. Ein Dashboard, das dieselbe Aggregation bei jedem Aufruf neu berechnet, bezahlt jeden Aufruf mit einem Scan.

## Syntax lesen — die Abfrage, die nicht weiß, wo sie liest

Die Leitwarten-Frage „was hat Maschine 4711 in den letzten zehn Minuten gemeldet" sieht so aus:

```
SELECT bin(time, 1m) AS minute,
       avg(measure_value::double) AS temperatur
FROM   "nordwerk"."getriebe_telemetrie"
WHERE  device_id = 'M-4711'
  AND  time > ago(10m)
GROUP  BY bin(time, 1m)
ORDER  BY minute DESC
```

Drei Stellen sind Timestream-eigen, der Rest ist gewöhnliches SQL.

```
ago(10m)                    bin(time, 1m)         measure_value::double
   │                             │                        │
   │                             │                        └─ Messwert mit
   │                             │                           explizitem Typ
   │                             └─ fasst Zeitstempel in feste
   │                                Intervalle zusammen
   └─ „vor 10 Minuten", relativ zu jetzt
```

`ago()` und die Intervall-Literale wie `10m` sind Bequemlichkeit mit Wirkung: Sie machen die Zeitgrenze zum Normalfall statt zur Fleißaufgabe. `bin()` ist der Grund, warum du für ein Diagramm keine Fensterfunktion schreiben musst. Und `measure_value::double` erinnert dich daran, dass ein Messwert hier keinen festen Typ am Schema hat, sondern beim Lesen gedeutet wird.

**Und jetzt zähl, was in dieser Abfrage fehlt: eine Angabe, aus welchem Speicher gelesen werden soll.** Die AWS-Doku beschreibt genau das als Aufgabe der adaptiven Query-Engine — sie greift mit einer einzigen SQL-Anweisung über die Speicherstufen hinweg zu und kombiniert sie, ohne dass du den Ort angibst.

Ändere `ago(10m)` in `ago(400d)`, und dieselbe Abfrage liest plötzlich aus dem Magnetic Store. Du hast eine Ziffer geändert, nicht die Architektur.

## Was du dadurch nicht baust

- keinen Archivierungsjob, der nachts Daten von schnell nach billig schaufelt
- keine Lifecycle-Regel und keinen Lambda-Timer dafür
- keine zweite Datenbank für die historischen Werte
- keine Logik in der Anwendung, die entscheidet, welchen Speicher sie fragt
- keine selbstgebaute Aggregationstabelle mit eigenem Aufräumjob
- kein Kapazitätsmanagement — im oberen Pfad. Im unteren schon.

Übrig bleiben: eine Tabelle, zwei Zahlen und eine SQL-Abfrage, die nicht wissen muss, wo etwas liegt.

## Wenn du dir eine Sache merkst

**Bei Zeitreihen ist die Zeit der Index, nicht eine Spalte — und deshalb kann der Dienst das Alter zum Speicherort machen, ohne dass du es programmierst.**

DynamoDB kennt einen Schlüssel und kein Tiering. S3 kennt Tiering und keine Abfragesprache über Zeitfenster. OpenSearch kennt Text und keine Interpolation. Timestream kennt beides, weil es nur eine Sache kann.

## Prüfungsknackpunkte

**Signalwörter:** „time-series data", „IoT sensor readings", „millions of data points per minute", „query by time window", „recent data fast, historical data cheap", „data lifecycle". Zeitfenster plus Messwertmengen ist Timestream.

**Warum DynamoDB hier verliert:** Technisch ginge es mit Zeitstempel als Sort Key, wirtschaftlich nicht. Es rechnet pro Schreibvorgang, kennt kein automatisches Tiering — heiße und kalte Daten kosten dasselbe — und hat keine eingebauten Zeitreihenfunktionen. TTL löscht, statt zu verbilligen. Signal für DynamoDB ist der Zugriff über einen Schlüssel, für Timestream das Zeitfenster.

**Warum RDS oder Aurora hier verlieren:** Drei Millionen Schreibvorgänge pro Minute sind kein relationales Lastprofil, und der Speicher kennt keine Stufen.

**Warum S3 mit Athena hier verliert:** Für die Konstruktionsfrage wäre es passend. Für die Leitwarte nicht — Punktabfragen in Millisekunden liefert ein Objektspeicher mit Abfrageschicht nicht.

**Warum OpenSearch hier verliert:** Es ist für Volltextsuche über Logs gebaut. Steht „Kibana" oder „search across log messages" im Fragetext, ist es OpenSearch; steht dort Aggregation über die Zeit, ist es Timestream.

**Warum Kinesis Data Streams hier verliert:** Das ist Transport mit Replay, keine Datenbank. Ein Stream beantwortet keine Frage über drei Jahre.

**Die Speicherort-Falle.** Jede Antwort, die die Abfrage wissen lässt, in welcher Stufe die Daten liegen, ist falsch.

**Die Vertriebsstatus-Falle.** Die Schließung für Neukunden ändert die Prüfungsantwort nicht. Wer „Timestream ist abgekündigt" denkt und deshalb DynamoDB ankreuzt, verliert einen Punkt an einer Nachricht, die in der Frage gar nicht vorkommt.
