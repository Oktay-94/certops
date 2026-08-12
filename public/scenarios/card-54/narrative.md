---
cardNumber: 54
slug: opensearch-dashboards-bank-correlation-id
title: "OpenSearch Service · OpenSearch Dashboards — zentrale Log-Suche über 60 Microservices"
services: ["Amazon OpenSearch Service", "Amazon OpenSearch Serverless", "OpenSearch Dashboards", "Amazon CloudWatch Logs", "Amazon Data Firehose"]
domains: ["D3"]
badgeCount: 5
narrativeVersion: 1
factCheckedAt: "2026-08-11"
sources:
  - "https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless-comparison.html"
  - "https://docs.aws.amazon.com/opensearch-service/latest/developerguide/creating-opensearch-service-pipeline.html"
  - "https://docs.aws.amazon.com/opensearch-service/latest/developerguide/remote-reindex.html"
  - "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/SubscriptionFilters.html"
  - "https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/subscription-concepts.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/Message_extraction.html"
  - "https://docs.aws.amazon.com/firehose/latest/dev/enabling-decompression-existing-stream-console.html"
  - "https://aws.amazon.com/about-aws/whats-new/2024/02/amazon-data-firehose-message-extraction-cloudwatch-logs/"
  - "https://aws.amazon.com/about-aws/whats-new/2020/10/amazon-cloudwatch-logs-now-supports-two-subscription-filters-per-log-group"
  - "https://aws.amazon.com/blogs/big-data/use-amazon-opensearch-ingestion-to-migrate-to-amazon-opensearch-serverless"
  - "https://github.com/awsdocs/amazon-opensearch-service-developer-guide/blob/master/doc_source/serverless-overview.md"
---

## Die Grundidee zuerst

Zwei Wege, in einer Bibliothek mit 60 Regalen den einen Satz zu finden, in dem das Wort „Blindschleiche" vorkommt.

**Weg eins:** Du nimmst Regal 1, Buch 1, Seite 1 und liest. Dann Seite 2. Nach vier Tagen bist du bei Regal 12. Du wirst den Satz finden — du liest garantiert alles, also auch ihn. Die Methode ist vollständig, korrekt und für einen Bereitschaftsdienst um 3 Uhr nachts vollkommen wertlos.

**Weg zwei:** Hinten in der Bibliothek liegt ein Zettelkasten, in dem **jedes Wort** aus allen Büchern einmal steht, dahinter die Liste der Stellen, an denen es vorkommt. Du schlägst „Blindschleiche" auf und liest drei Zeilen. Zeitaufwand: Sekunden.

Der Zettelkasten heißt **invertierter Index**, und jemand musste ihn anlegen. Das ist der ganze Handel: Du bezahlst dauerhaft dafür, dass die Umkehrung vorgehalten wird — und bekommst dafür Antworten in Sekunden statt in Stunden.

Athena ist Weg eins mit einer sehr guten Abkürzung (es überspringt Regale, deren Beschriftung nicht passt). OpenSearch ist Weg zwei. Wenn die Aufgabe „innerhalb von Sekunden" und „Freitext über alle Services" sagt, ist die Abkürzung nicht genug.

## Was es eigentlich ist — der Datensatz, der ankommt

Das zentrale Objekt dieser Karte ist nicht der Cluster. Es ist der **Umschlag**, in dem CloudWatch Logs die Ereignisse weitergibt. So sieht ein Record aus, nachdem Firehose ihn dekomprimiert hat:

```json
{
  "owner": "111111111111",
  "logGroup": "/zahlung/authorisierung",
  "logStream": "111111111111_/zahlung/authorisierung_eu-central-1",
  "subscriptionFilters": ["nach-opensearch"],
  "messageType": "DATA_MESSAGE",
  "logEvents": [
    { "id": "3195310660696698337880902507980421114328961542429822156",
      "timestamp": 1772712000000,
      "message": "{\"corr\":\"c-8f21ab\",\"svc\":\"auth\",\"status\":\"TIMEOUT\"}" },
    { "id": "3195310660696698337880902507980421114328961542429822157",
      "timestamp": 1772712000420,
      "message": "{\"corr\":\"c-8f21ab\",\"svc\":\"ledger\",\"status\":\"OK\"}" }
  ]
}
```

Drei Dinge stehen darin, die auf der Karte keinen Platz haben.

**Erstens:** Ein Firehose-Record ist **nicht** ein Log-Ereignis, sondern ein Bündel davon — `logEvents` ist ein Array. **Zweitens:** Der eigentliche Inhalt steckt eine Ebene tiefer in `message`, umgeben von Kopfdaten. **Drittens:** So kommt er gar nicht an. Was CloudWatch Logs über einen Subscription Filter herausgibt, ist base64-kodiert und gzip-komprimiert; obiges Bild entsteht erst, wenn in Firehose die Dekomprimierung eingeschaltet ist.

**„Ohne Code" heißt hier: ohne eigenen Code — nicht ohne Konfiguration.**

## Der Weg durch die Karte

### Der Kasten links — 60 Microservices mit Correlation-ID

Der wichtigste Teil des Szenarios steht in der dritten Zeile: `Correlation-ID je Request`. Ohne sie gäbe es nichts zu korrelieren, und die ganze Karte wäre gegenstandslos.

Eine Correlation-ID ist ein Wert wie `c-8f21ab`, der beim ersten Kontakt erzeugt und danach über jeden Aufruf weitergereicht wird. Sie ist die einzige Klammer, die 60 unabhängige Dienste zu einem Vorgang zusammenbindet.

Sie erklärt auch, warum hier gesucht und nicht abgefragt wird. Eine Correlation-ID ist zum Zeitpunkt des Störfalls **unbekannt** — niemand hat vorher eine Spalte dafür angelegt, niemand kennt den Wert, bis der Kunde anruft. Genau dafür ist ein invertierter Index gebaut: Er beantwortet Fragen nach Werten, die beim Anlegen der Struktur noch niemand kannte.

### Badge 1 — Anwendungslogs nach CloudWatch Logs

Der Standardweg, oft ohne bewusste Entscheidung: Wer auf Lambda, ECS oder EC2 mit Agent läuft, schreibt ohnehin dorthin.

Das ist der **Ausgangszustand**, nicht die Lösung. Er ist nicht falsch — er ist nur an der falschen Stelle sortiert.

### Der Kasten — CloudWatch Logs mit Log-Gruppe je Service

CloudWatch Logs speichert zuverlässig, dauerhaft und **getrennt**: eine Log-Gruppe je Service, darin Streams je Instanz oder Container.

Genau diese Trennung ist das Problem. 60 Services sind 60 Orte, an denen `c-8f21ab` stehen könnte. Der Bereitschaftsdienst klickt sich heute durch Log-Gruppen und macht dabei nichts falsch — er macht es nur sechzigmal.

### Badge 2 — der Subscription Filter

Ein Subscription Filter ist ein stehender Auftrag an der Log-Gruppe: „Alles, was auf dieses Muster passt, gib sofort weiter." Kein Polling, kein Export, kein nächtlicher Job. Die Log-Ereignisse verlassen die Gruppe im Fluss, sobald sie eintreffen.

Zum Filter gehören ein Zielort, ein Muster und eine IAM-Rolle, mit der CloudWatch Logs beim Ziel schreiben darf. Als Ziele nennt die Dokumentation vier: Kinesis Data Streams, Lambda, Amazon Data Firehose und Amazon OpenSearch Service.

Und eine harte Grenze, die Architekturen prägt: **zwei Subscription Filter je Log-Gruppe.** Wer an drei Ziele verteilen will, hängt einen Data Stream davor und fächert dahinter auf.

### Der Kasten — Data Firehose

Dieselbe Rolle wie auf Karte 52, anderes Ziel: puffern, schreiben, ohne Anwendungscode. Firehose ist hier weder Sucher noch Speicher, sondern die Lieferschicht dazwischen.

Der Kasten trägt zwei Optionen, die auf der Karte fehlen und ohne die der Weg nicht sauber ist: **Decompression** entpackt den gzip-Strom aus CloudWatch Logs, und **Message Extraction** wirft die Kopfdaten weg und liefert nur den Inhalt der `message`-Felder aus. Beides sind Schalter, kein Code — für die Message Extraction stellt AWS ausdrücklich fest, dass sie beim Einsatz der CloudWatch-Dekomprimierung keine zusätzlichen Kosten verursacht.

### Badge 3 — indexiert in eine Domain

Der Pfeil endet in einem vorprovisionierten Cluster. Ab hier zahlst du für Rechenkapazität, ob jemand sucht oder nicht.

### Der Kasten — Domain (managed)

Eine Domain **ist** ein Cluster aus Nodes. Du wählst Instanztypen, rechnest den Speicherbedarf aus, entscheidest über dedizierte Master-Nodes und dimensionierst selbst. Volle Kontrolle, volle Verantwortung — und volle Sichtbarkeit: Du siehst Shards, Nodes und Heap, weil es sie gibt.

### Badge 4 — indexiert in eine Collection

Derselbe Pfeil, anderes Ziel. Zwischen Badge 3 und Badge 4 liegt die eigentliche Prüfungsfrage dieser Karte — und das Label dazwischen sagt es unmissverständlich: **entweder oder**.

### Der Kasten — Collection (Serverless)

Eine Collection ist eine **logische Gruppe von Indizes** für einen Anwendungsfall. Die Vergleichsseite von AWS formuliert den Kern in einem Satz: OpenSearch Serverless kennt das Konzept eines Clusters oder Nodes **nicht**.

Es gibt also nichts zu dimensionieren, aber auch nichts zu inspizieren. Kapazität wird in OCUs bereitgestellt und automatisch skaliert; abgerechnet wird in OCU-Stunden für Ingestion-Compute, Search-Compute und den in S3 vorgehaltenen Speicher. Verschlüsselung im Ruhezustand ist hier **Pflicht**, bei Domains optional.

Bemerkenswert ist die Trennung dahinter: Indizierung und Suche skalieren getrennt. Ein nächtlicher Log-Ansturm treibt die Ingestion-Seite hoch, ohne dass jemand sucht — bei einer Domain teilen sich beide Lasten dieselben Nodes und konkurrieren um denselben Speicher.

Das Bild dazu: Die Domain ist ein Mietwagen — du wählst Modell und Tankgröße und stehst für beides gerade. Die Collection ist ein Taxi — du sagst das Ziel, jemand anderes entscheidet über Motor und Sprit.

### Badge 5 — Suche

Der Bereitschaftsdienst tippt `c-8f21ab` in ein Feld und sieht den Verlauf über alle 60 Services, chronologisch. Der Pfeil geht auf der Karte von der Collection aus; er gilt für beide Varianten gleichermaßen und ist eine Layoutentscheidung, keine fachliche Aussage.

### Der Kasten — OpenSearch Dashboards

Der Dienst hieß früher Kibana. Nach dem Fork heißt er OpenSearch Dashboards, und der Endpunkt wechselte von `/_plugin/kibana` auf `/_dashboards`. Auch die Standardrollen wurden umbenannt — aus `kibana_user` wurde `opensearch_dashboards_user`.

Das ist keine Kosmetik: IAM-Policies und SAML-URLs, die den alten Pfad enthalten, greifen ins Leere.

### Der verworfene Kasten — Athena auf S3

Fachlich funktioniert es: Logs nach S3, Tabelle darüber, SQL. Für viele Fragen ist das die bessere Antwort, weil es nichts kostet, wenn niemand fragt.

Hier verliert es an einem einzigen Wort: **Volltext**. Athena scannt, es sucht nicht. Es gibt keinen invertierten Index, keine Analyse in Tokens, kein Ranking. Eine Suche nach einer beliebigen Zeichenkette in einem beliebigen Feld wird zu `LIKE '%c-8f21ab%'` über alles, was der Partitionsfilter übrig lässt — und der Partitionsfilter hilft nur, wenn du weißt, wann es passiert ist.

Der rote Boxrand fehlt hier bewusst: Der Kasten trägt die Athena-Farbe, damit der Dienst erkennbar bleibt. Verworfen wird er durch das rote X, nicht durch Umfärben. Die Aussage der Karte ist nicht „Athena ist schlecht", sondern „Athena ist hier das falsche Werkzeug" — und der Unterschied zwischen diesen beiden Sätzen ist in Prüfungsfragen regelmäßig der Unterschied zwischen zwei Antwortoptionen.

### Die zwei Zonen — Ingestion und die eine Entscheidung

Links „ohne Code": Der Weg von der Log-Gruppe zum Index kommt ohne eigene Anwendung aus. Rechts „eine Entscheidung": Domain und Collection stehen nebeneinander, obwohl nur eines gewählt wird. Die Karte zeigt beide, weil die Abgrenzung der Lerninhalt ist.

## Die entscheidende Unterscheidung

| | Domain (managed) | Collection (Serverless) |
|---|---|---|
| Einheit | vorprovisionierter Cluster aus Nodes | logische Gruppe von Indizes |
| Kapazität | Instanztyp und Speicher selbst wählen | automatisch, skaliert in OCUs |
| Abrechnung | Instanzstunden plus EBS-Volumen | OCU-Stunden plus S3-Speicher |
| Verschlüsselung ruhend | optional | verpflichtend |
| Zugriff auf Daten | IAM plus Fine-Grained Access Control | Data Access Policies |
| Versionswechsel | du aktualisierst selbst | erfolgt automatisch |
| API-Umfang | eine Teilmenge der OpenSearch-API | eine **andere** Teilmenge |
| Request-Signatur | Servicename `es` | Servicename `aoss` |
| Dashboards-Anmeldung | Benutzername und Passwort | angemeldete Konsolensitzung |

Die letzten drei Zeilen sind die praktisch teuersten. Ein Client, der gegen eine Domain signiert, signiert nicht gegen eine Collection.

## Die ehrliche Feinheit

**Der Wechsel ist kein Umschalter.** Die Dokumentation zu den Grenzen von Serverless sagt klar: Es gibt keinen automatischen Weg, Daten von einer Domain in eine Collection zu übernehmen — du musst neu indizieren. Der Merksatz auf der Karte trifft das.

Er ist inzwischen aber **unvollständig**: „neu indizieren" heißt nicht mehr „Eigenbau". AWS dokumentiert Amazon OpenSearch Ingestion als Pipeline mit Domain als Quelle und Collection als Ziel, mit eigener Doku-Seite und Grenzen (etwa: nur VPC-Collections, keine öffentlichen). Der Mechanismus bleibt ein Neuaufbau des Index — der Aufwand ist nicht mehr derselbe. Wer in einer Prüfungsfrage „no automatic migration, reindex required" liest, kreuzt trotzdem richtig an.

**Serverless ist nicht Domain mit weniger Arbeit.** Es ist ein anderes Modell mit eigenen Lücken: Nicht alle API-Operationen und nicht alle Plugins werden unterstützt, eigene Plugins gar nicht, Snapshots der Collection lassen sich nicht ziehen oder einspielen, und kontoübergreifender Zugriff auf Collections existiert nicht. Wer Serverless als reine Bequemlichkeitsvariante einplant, stolpert nicht über die Kosten, sondern über fehlende Funktionen.

**Der Kostenpfad ist gegenläufig.** Athena kostet nichts, wenn niemand fragt, und viel, wenn oft und breit gefragt wird. Ein OpenSearch-Index kostet konstant, weil er vorgehalten wird, und die zusätzliche Suche kostet fast nichts. Für eine Bereitschaft, die zwölfmal im Monat sucht, klingt das nach Verschwendung — bis man den Fall einrechnet, in dem die Suche zwanzig Minuten statt vier Stunden dauert.

**Der Index ist kein Archiv.** Ein invertierter Index ist eine Suchstruktur; er kostet, solange er existiert. Die revisionssichere Langzeitablage gehört nach S3. In der Praxis entscheidet die Aufbewahrungsdauer im Index über den größten Posten der Rechnung — auf der Karte ist davon nichts zu sehen, weil es sonst eine weitere Box gekostet hätte.

**Und eine Zahl, die hier bewusst fehlt:** Wie viele OCUs eine Collection mindestens kostet, geben AWS-Quellen unterschiedlich an — die Vergleichsseite nennt gar keine Untergrenze, andere AWS-Texte nennen unterschiedliche Werte. Deshalb steht auf der Karte nur „skaliert in OCUs" und in diesem Text keine Zahl.

## Syntax lesen — warum die Suchanfrage entscheidet

Zwei Anfragen, die dasselbe zu wollen scheinen:

```
POST /logs-2026.03.03/_search
{ "query": { "term":  { "svc":      "auth"     } } }

POST /logs-2026.03.03/_search
{ "query": { "match": { "message":  "c-8f21ab" } } }
```

```
term   → exakter Vergleich gegen den gespeicherten Token, unverändert
match  → die Suchanfrage wird analysiert, dann gegen den Index gehalten
```

Der Unterschied liegt im **Mapping** des Feldes, nicht in der Abfrage. Ein Feld vom Typ `keyword` wird beim Indizieren als ein einziger Token abgelegt — dafür ist `term` richtig. Ein Feld vom Typ `text` wird zerlegt, kleingeschrieben und normalisiert — dafür ist `match` richtig.

Wer `term` gegen ein `text`-Feld stellt, bekommt oft **null Treffer**, obwohl der Wert sichtbar in den Daten steht: Gespeichert wurde der zerlegte Token, verglichen wird die ganze Zeichenkette. Das ist der häufigste erste Frust mit OpenSearch — und zugleich der beste Beweis, dass hier ein Index arbeitet und kein Scan.

## Was du dadurch nicht baust

- keinen zweiten Speicher für Compliance — der Index ersetzt keine Ablage in S3
- keine SQL-Datenbank; Aggregationen ja, Joins über Tabellen nein
- keine Lösung, die nichts kostet, wenn niemand sucht
- keine Migration zwischen Domain und Collection per Knopfdruck
- keinen automatischen Lebenszyklus — Index-Rotation und Löschregeln bleiben deine Aufgabe
- keinen Ersatz für CloudWatch Logs; die Log-Gruppen bleiben bestehen und Quelle

## Wenn du dir eine Sache merkst

**Volltextsuche braucht einen Index, Analyse braucht einen Scan.**

Athena ist richtig, wenn du eine strukturierte Frage an ruhende Daten stellst und pro Abfrage zahlen willst. OpenSearch ist richtig, wenn du einen unbekannten Begriff im Freitext suchst und die Antwort sofort brauchst. CloudWatch Logs Insights liegt dazwischen und reicht für wenige Log-Gruppen ohne laufenden Index.

## Prüfungsknackpunkte

**Signalwörter:** „centralized log search across all services", „full-text search", „find a correlation ID in seconds", „visualize in dashboards", „no cluster to size or manage", „operational analytics on log data". Suche plus Sekunden plus Dashboards ist immer OpenSearch.

**Die Kibana-Falle.** Kibana ist in diesem Kontext der alte Name. Er lebt nur noch für Domains auf Elasticsearch 7.10 oder früher. Eine Antwortoption, die „Kibana" schreibt, ist nicht automatisch falsch — der Masterplan-Titel dieses Themas selbst war es lange —, aber sie stammt aus altem Material.

**Die Serverless-Falle.** „No cluster to manage" zeigt auf Collection. „We need a specific plugin" oder „we take snapshots" zeigt zurück auf Domain.

**Warum Athena auf S3 hier verliert:** scannt statt zu suchen — ohne invertierten Index wird jede Freitextsuche zum Vollscan über den Zeitraum.

**Warum CloudWatch Logs Insights hier verliert:** stark für wenige Log-Gruppen und bekannte Muster, aber die Aufgabe verlangt eine Sicht über 60 Services mit Dashboards.

**Warum ein Athena-Query über exportierte Logs hier verliert:** der Export ist ein Batch-Vorgang, das Szenario verlangt Sekunden im Störungsfall.

**Warum eine relationale Datenbank hier verliert:** Volltext über halbstrukturierte Felder ist nicht ihr Modell, und die Schemaänderung je Servicelog wäre laufende Arbeit.

**Warum „Lambda schreibt selbst nach OpenSearch" hier verliert:** funktioniert, ist aber Anwendungscode — genau das, was Firehose als Lieferschicht überflüssig macht.
