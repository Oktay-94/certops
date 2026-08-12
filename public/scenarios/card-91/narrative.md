---
cardNumber: 91
slug: iot-core-rules-engine-dynamodb
title: "IoT Core, Rules Engine, DynamoDB"
services: ["AWS IoT Core", "AWS IoT Rules Engine", "Amazon DynamoDB", "Amazon CloudWatch Logs"]
domains: ["D3", "D4"]
badgeCount: 3
narrativeVersion: 1
factCheckedAt: "2026-08-12"
sources:
  - "https://docs.aws.amazon.com/iot/latest/developerguide/iot-rule-actions.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/dynamodb-v2-rule-action.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/iot-ddb-rule.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/iot-basic-ingest.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/rule-error-handling.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/iot-sql-from.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/x509-client-certs.html"
  - "https://docs.aws.amazon.com/iot/latest/developerguide/topicdata.html"
  - "https://docs.aws.amazon.com/whitepapers/latest/designing-mqtt-topics-aws-iot-core/mqtt-design-best-practices.html"
---

## Die Grundidee zuerst

Stell dir zwei Wege vor, 100.000 Postkarten pro Minute in einen Aktenschrank zu bekommen.

**Weg eins:** Du mietest eine Halle, stellst Leute ein, die die Karten annehmen, und weitere Leute, die sie lesen, sortieren und in die richtige Schublade legen. Die Halle muss beheizt werden, auch nachts. Fällt jemand aus, staut sich der Eingang. Wächst die Zahl der Karten, mietest du eine zweite Halle. Und jedes Mal, wenn sich das Format der Karten ändert, schulst du dein Personal um.

**Weg zwei:** Am Eingang steht ein Schlitz. Dahinter eine Maschine, die die Adresszeile liest und die Karte direkt in die passende Schublade fallen lässt. Du hast der Maschine genau einen Satz beigebracht: „Nimm alles, was von den Sensoren kommt, und leg es in den Schrank." Niemand trägt etwas.

AWS IoT Core ist der Schlitz, die Rules Engine ist die Maschine, und der Satz ist ein SQL-Statement.

Und es gibt eine zweite Hälfte dieser Idee, die auf der Karte im ersten Kasten steckt: **Der Schlitz bleibt offen.** Die Geräte klopfen nicht jedes Mal neu an, weisen sich aus, übergeben eine Karte und gehen wieder. Sie haben eine stehende Leitung. Bei einem Sensor, der von einer Batterie lebt oder an einem schmalen Mobilfunkband hängt, ist genau das der Unterschied zwischen machbar und nicht machbar.

## Was es eigentlich ist — die Regel als Datensatz

Zwischen Sensor und Tabelle steht kein Programm. Es steht ein JSON-Objekt, das du einmal anlegst:

```json
{
  "topicRulePayload": {
    "sql": "SELECT temperature, humidity, deviceId FROM 'sensors/+/data'",
    "awsIotSqlVersion": "2016-03-23",
    "ruleDisabled": false,
    "actions": [
      {
        "dynamoDBv2": {
          "putItem": { "tableName": "sensor_readings" },
          "roleArn": "arn:aws:iam::123456789012:role/aws_iot_dynamoDBv2"
        }
      }
    ],
    "errorAction": {
      "s3": {
        "roleArn": "arn:aws:iam::123456789012:role/aws_iot_s3",
        "bucketName": "sensor-ingest-errors",
        "key": "${replace(topic(), '/', '-') + '-' + timestamp() + '-' + newuuid()}"
      }
    }
  }
}
```

Lies das von oben nach unten, dann hast du die ganze Karte. Was wird abonniert und was davon behalten (`sql`), in welcher Dialektfassung (`awsIotSqlVersion`), wohin damit (`actions`), mit welchem Recht (`roleArn`), und was passiert, wenn es schiefgeht (`errorAction`).

Ein knappes Dutzend Zeilen ersetzt die Halle.

## Der Weg durch die Karte

### Kasten — Sensorflotte

100.000 Geräte, jedes mit einem eigenen X.509-Client-Zertifikat. Das ist keine Formalie, sondern die Sicherheitsarchitektur des ganzen Aufbaus.

AWS IoT authentifiziert Client-Zertifikate über den Client-Authentication-Modus von TLS und prüft dabei Status und Account-Zuordnung gegen ein Zertifikatsregister. Ein Zertifikat muss registriert sein, den Status `ACTIVE` haben und darf nicht abgelaufen sein — dann und nur dann kommt die Verbindung zustande.

Der Gewinn zeigt sich am Schadensfall: Ein kompromittiertes Gerät deaktivierst du einzeln, indem du sein Zertifikat inaktiv setzt. Die anderen 99.999 merken nichts davon. Mit einem geteilten Schlüssel wäre dieselbe Situation ein Flottenaustausch.

### Pfeil 1 — MQTT-Publish über TLS

Das Gerät veröffentlicht auf einem Topic, hier `sensors/A-4711/data`, mit einem JSON-Körper:

```json
{ "deviceId": "A-4711", "temperature": 21.4, "humidity": 55, "battery": 87 }
```

Warum MQTT und nicht HTTP? Weil die Verbindung stehen bleibt und der Protokoll-Overhead je Nachricht klein ist. Ein HTTP-Aufruf baut jedes Mal TLS neu auf. Bei einem Messwert alle zwei Sekunden zahlst du diesen Aufbau hunderttausendfach.

Ein Detail, das im Betrieb wehtut: Der Topic-Name darf beim Publish nicht größer sein als 256 Byte in UTF-8. Wer Gerätenamen, Standort und Messtyp in den Topic packt, stößt schneller dagegen als erwartet.

### Kasten — IoT Core Broker

Der Message Broker terminiert die TLS-Verbindungen und wertet die IoT Policy aus: Darf **dieses** Zertifikat auf **dieses** Topic publizieren?

Auch hier ein Detail mit Prüfungsrelevanz: Der Payload einer Publish-Nachricht ist auf 128 KB begrenzt; größere Nachrichten weist AWS IoT Core ab, und das Gerät bekommt einen Client-Fehler mit dem Grund `PAYLOAD_LIMIT_EXCEEDED`. Für einen Messwert ist das großzügig. Für ein Kamerabild ist es das Ende des Weges — dann gehört die Nutzlast nach S3 und nur die Referenz auf das Topic.

### Pfeil 2 — der Topic-Stream erreicht die Rules Engine

Kein Aufruf, keine Anmeldung. Die Regel ist über ihre `FROM`-Klausel auf einen Topic-Filter abonniert; jede passende Nachricht löst sie aus.

### Kasten — Rules Engine

Das SQL-ähnliche Statement läuft gegen die Nachricht, nicht gegen eine Tabelle. `SELECT` bestimmt, was durchkommt, `FROM` bestimmt, worauf gehört wird, und ein optionales `WHERE` filtert.

Hier steckt der eigentliche Hebel dieser Karte: Zwischen MQTT-Nachricht und Tabellenzeile steht **kein eigener Code**. Kein Container, keine Funktion, keine Bibliothek, kein Deployment.

Das `WHERE` ist der unterschätzte Teil. `WHERE temperature > 60` schreibt nur noch die Ausreißer in die Tabelle — und reduziert damit nicht die Zahl der Nachrichten, wohl aber die Zahl der Schreibvorgänge. Bei 100.000 Sensoren ist das der Unterschied zwischen einer Tabelle, die Alarme hält, und einer, die Rauschen hält.

Das Feld `awsIotSqlVersion` legt fest, in welcher Dialektfassung dein Statement gelesen wird — es wird beim Anlegen der Regel ausdrücklich ausgewählt. Dass hier mehr als eine Fassung im Umlauf ist, sieht man in der AWS-Dokumentation selbst: Das Tutorial zur DynamoDB-Regel gibt `2016-03-23` vor, während ein Beispiel auf der `dynamoDBv2`-Seite `2015-10-08` verwendet. Wer eine bestehende Regel als Vorlage kopiert, kopiert die Version mit. Ein Statement, das im Konsolentest anders reagiert als erwartet, ist ein Anlass, zuerst hier hinzusehen.

Auf der Karte trägt die Rules Engine dieselbe Farbe wie der Broker — Teal, also Transport. Das ist Absicht: Sie bewegt Nachrichten, sie steht im Datenpfad. Die naheliegende Versuchung, sie als Governance einzufärben, wäre falsch; sie kontrolliert nicht von außen, sie leitet weiter.

### Pfeil 3 — die Action `dynamoDBv2`

Die Action schreibt das Ergebnis des SQL-Statements in die Tabelle und legt dabei **jedes Attribut der Nutzlast in eine eigene Spalte**. Sie braucht dafür eine IAM-Rolle, die AWS IoT annehmen darf, mit der Berechtigung `dynamodb:PutItem`.

### Kasten — DynamoDB

Aus `{ "deviceId": "A-4711", "temperature": 21.4, "humidity": 55 }` werden drei Attribute im Item, nicht ein JSON-Blob in einem Feld. Genau deshalb ist DynamoDB hier das richtige Ziel: Der Einzelwert wird später per Key abgefragt, nicht über die Menge aggregiert.

Das Key-Design entscheidet dabei über den ganzen Aufbau, und es ist der Teil, den die Karte nicht zeigen kann. Naheliegend wäre ein Zeitstempel als Partition Key — und genau das erzeugt bei 100.000 gleichzeitig sendenden Sensoren eine heiße Partition, weil alle Schreibvorgänge derselben Sekunde auf denselben Wert fallen.

Der tragfähige Zuschnitt dreht das um: `deviceId` als Partition Key, Zeitstempel als Sort Key. Damit verteilen sich die Schreibvorgänge über 100.000 Werte, und die typische Abfrage — „die letzten Messwerte von Sensor A-4711" — ist eine Query auf einer Partition statt eines Scans über die Tabelle.

Das ist auch der Grund, warum `deviceId` im `SELECT` stehen muss und nicht nur im Topic-Namen: Die Action liest den Partition Key aus dem Ergebnis der Regel, nicht aus dem Topic.

### Der gestrichelte Bypass — Lambda als Umweg

Die verworfene Box behält Compute-Orange am Rand und ist gestrichelt — abgelehnt wird sie durch den X-Kreis und den roten Pfad, nicht durch die Füllung. Der Grund: Eine Lambda-Funktion, die eine Nachricht entgegennimmt und unverändert nach DynamoDB schreibt, fügt einen Hop, eine Fehlerquelle, Kosten und Latenz hinzu, ohne fachlich etwas beizutragen.

Sie ist nicht *falsch* — sie ist überflüssig. Sobald in der Nutzlast eine Entscheidung getroffen werden muss, die AWS IoT SQL nicht ausdrücken kann, kippt das Urteil: ein Wert, der gegen eine fremde API geprüft werden muss, eine Umrechnung mit Nachschlagetabelle, ein binäres Protokoll, das erst dekodiert werden will. Der Prüfstein ist immer derselbe — braucht die Nachricht *Wissen von außerhalb*, dann Lambda; braucht sie nur *Auswahl und Umbenennung*, dann die native Action.

## Die entscheidende Unterscheidung

Zwei Rule Actions mit fast identischem Namen tun Verschiedenes. Die Namen sind **keine Versionsstufe**, aus der man blind die höhere nimmt:

| | `dynamoDB` | `dynamoDBv2` |
|---|---|---|
| Schreibt Payload | in eine einzelne Spalte | spaltenweise aufgeteilt |
| Keys | im Rule-Action-Formular gesetzt | müssen aus dem Ergebnis kommen |
| Substitution Templates | für Key-Werte üblich | für `tableName`, nur API und CLI |
| Passt, wenn | die Rohnachricht als Block archiviert wird | einzelne Felder abfragbar sein sollen |

Der beste Beleg dafür, dass hier keine Rangordnung gilt, steht im AWS-Tutorial „Storing device data in a DynamoDB table": Dort weist AWS ausdrücklich darauf hin, **DynamoDB und nicht DynamoDBv2** als Rule Action zu wählen — weil dort ein Zeitstempel als Partition Key gesetzt wird und die Nutzlast als Block in eine Spalte gehört.

## Die ehrliche Feinheit

**„Ohne Glue-Code" hat eine Bedingung, die auf der Karte nicht steht.** Die Dokumentation zu `dynamoDBv2` verlangt, dass die MQTT-Nutzlast einen Schlüssel auf oberster Ebene enthält, der dem Partition Key der Tabelle entspricht — und ebenso einen für den Sort Key, falls es einen gibt. Ein `SELECT *`, dessen Nutzlast den Partition Key nicht mitliefert, schreibt nichts; der Code, den du gespart hast, taucht als Anforderung an das Nachrichtenformat wieder auf. Deshalb steht `deviceId` im Beispiel oben ausdrücklich im `SELECT`.

**Fehlgeschlagene Actions verschwinden leise.** Die Rules Engine unternimmt laut Dokumentation bei sporadischen Fehlern mehrere Versuche. Scheitern alle, wird die Nachricht **verworfen** und der Fehler ist in CloudWatch Logs verfügbar. Wie viele Versuche das sind, dokumentiert AWS nicht — es steht keine Zahl auf der Karte, weil es keine belegte gibt. Die Konsequenz zählt: Ohne `errorAction` gibt es keinen zweiten Ort, an dem die Nachricht landet, und der Messwert ist weg.

**Der `errorAction`-Zweig fehlt auf der Karte.** Das ist eine dokumentierte Schuld, kein Versehen: Als dritter ausgehender Pfeil an der Rules Engine — neben Hauptfluss und verworfenem Bypass — hätte er die Box optisch überladen. Er steht deshalb hier und im JSON-Block oben. Ein Detail dazu ist nützlich: Es entsteht **eine** Fehlermeldung pro Regel und Nachricht. Scheitern zwei Actions derselben Regel, bekommt die Error Action eine Nachricht mit beiden Fehlern, nicht zwei Nachrichten.

**Basic Ingest ist der zweite Ingestion-Pfad und kostet etwas.** Er nimmt den Publish/Subscribe-Broker aus dem Ingestion-Pfad und spart damit Messaging-Kosten. Die Topics beginnen dafür mit `$aws/rules/rule_name`, und diese ersten drei Ebenen zählen weder gegen das Limit von acht Segmenten noch gegen die 256 Zeichen. Der Preis steht ebenfalls klar in der Dokumentation: **kein Fan-out.** Wer die Nachricht außer an die Regel auch an andere Subscriber verteilen muss, braucht den Broker weiter und muss dafür auf einem anderen Topic publizieren. Auf der Karte ist Basic Ingest nicht gezeichnet; es steht im dritten Merksatz.

## Syntax lesen — `SELECT … FROM 'sensors/+/data'`

Die `FROM`-Klausel sieht aus wie SQL und ist ein MQTT-Topic-Filter. Genau da entstehen die meisten Fehler:

```
FROM 'sensors/+/data'
      │        │  │
      │        │  └─ Ebene 3: fester Name
      │        └─ Ebene 2: '+' ersetzt GENAU EINE Ebene
      └─ Ebene 1: fester Name
```

`+` steht für genau eine Ebene. `#` trifft laut AWS-Dokumentation alles auf und unterhalb seiner Ebene — aber ausdrücklich **nicht** das übergeordnete Topic: Ein Abo auf `sensor/#` empfängt `sensor/temperature` und `sensor/temperature/room1`, jedoch nichts, was auf `sensor` veröffentlicht wurde.

Daraus folgt die Regel, die man einmal falsch machen muss, um sie zu behalten:

- `sensors/+` trifft `sensors/A-4711` — und **nicht** `sensors/A-4711/data`
- `sensors/+/data` trifft `sensors/A-4711/data`
- `sensors/#` trifft beide

**An dieser Stelle weicht der Text bewusst von der Karte ab.** Auf der Karte steht `SELECT * FROM 'sensors/+'`, während der Ablauftext ein Topic der Form `sensors/<id>/data` beschreibt. Beides zusammen passt nicht: Der Filter der Karte würde diese Nachrichten nicht treffen. Richtig ist einer von beiden Wegen — `sensors/+/data` als Filter oder `sensors/<id>` als Topic. Der Text hier nimmt die erste Variante. Die Karte wird im nächsten Korrekturdurchgang nachgezogen.

Zwei Dinge kommen dazu. Erstens: **Publishen darf man auf Wildcards nie.** Topic-Filter sind ausschließlich für Abonnements da; ein Gerät veröffentlicht immer auf einem vollständigen Topic-Namen. Zweitens: Topics sind Groß- und Kleinschreibung beachtend. `Sensors/A-4711/data` ist ein anderes Topic als `sensors/A-4711/data`, und die Regel schweigt einfach.

Die Feldnamen im `SELECT` sind ebenfalls Groß-/Kleinschreibung beachtend und müssen exakt denen in der JSON-Nutzlast entsprechen. Eine Regel, die nichts schreibt, hat in der Praxis fast immer eine dieser drei Ursachen: falscher Topic-Filter, falsch geschriebenes Feld, fehlender Partition Key.

## Was du dadurch nicht baust

Zähl durch, was in dieser Lösung **nicht** existiert:

- kein MQTT-Broker, den jemand betreibt, patcht und skaliert
- kein Verbindungscode, keine Session-Verwaltung, kein Reconnect-Handling
- kein Server zwischen Nachricht und Tabelle
- kein Zustandsabgleich mit den Geräten — Device Shadow ist ein anderes Thema
- keine Aggregation, keine Zeitreihenauswertung, kein Fenster über die Werte
- keine Wiedervorlage für verlorene Nachrichten, solange keine `errorAction` konfiguriert ist

Übrig bleiben: ein Zertifikat je Gerät, eine Policy, ein JSON-Datensatz mit einem SQL-Statement und eine Tabelle.

## Wenn du dir eine Sache merkst

**Viele Geräte plus MQTT plus „ohne eigene Server" führt zu IoT Core — und wenn die Daten „in einen Datenspeicher geroutet" werden sollen, ist die Rule Action gemeint, nicht eine Lambda-Funktion, die dasselbe von Hand tut.**

Ein eigener Broker auf EC2 kann alles davon, nur trägst du Skalierung, Zertifikatsverwaltung und Verfügbarkeit selbst. API Gateway mit Lambda verliert die stehende Verbindung und die Geräteidentität. Und Kinesis Data Streams ist die richtige Antwort, sobald *vor* dem Ablegen aggregiert oder mehrfach ausgewertet werden soll — nicht, wenn der Einzelwert per Key abgefragt wird.

## Prüfungsknackpunkte

**Signalwörter:** „hundreds of thousands of devices", „MQTT", „without managing any servers", „route device messages to a database", „minimize messaging costs". Der letzte ist der eindeutigste: Kosten plus Messaging plus IoT ist Basic Ingest.

**Die Lambda-Falle.** In fast jeder Frage dieser Bauart steht eine Option mit Lambda dazwischen. Sie ist genau dann richtig, wenn die Aufgabe eine Transformation nennt, die SQL nicht kann — Anreicherung aus einer fremden API, komplexe Fallunterscheidung, Format-Umbau. Steht dort nur „speichern" oder „routen", ist sie die teurere falsche Antwort.

**Eigener MQTT-Broker auf EC2:** Technisch möglich, in der Prüfung fast immer falsch, sobald „fully managed" in der Frage steht.

**API Gateway plus Lambda:** Passt für gelegentliche HTTP-Aufrufe, nicht für eine Sensorflotte im Sekundentakt. Die stehende Verbindung ist der Punkt.

**Kinesis Data Streams als Ziel:** Richtig bei Aggregation oder mehrfacher Auswertung vor dem Ablegen. Falsch, wenn die Frage nach direktem Key-Zugriff auf den Einzelwert fragt.

**IoT Analytics oder Timestream:** Zeitreihen-Auswertung ist ein anderes Szenario. Prüfe vor der Antwort den aktuellen Verfügbarkeitsstand dieser Dienste — in diesem Feld hat sich zuletzt einiges bewegt.

**Device Shadow:** Kommt als Distraktor, sobald „Gerätezustand" im Text auftaucht. Es gehört zum Zustandsabgleich zwischen Cloud und Gerät, nicht zum Ingestion-Pfad.
