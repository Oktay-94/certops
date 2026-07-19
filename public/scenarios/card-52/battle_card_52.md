---
nr: 52
title: "Amazon Data Firehose · S3 · Athena — Logs ohne Code in den Data Lake"
services:
  - Amazon Data Firehose
  - Amazon S3
  - Amazon Athena
  - AWS Glue Data Catalog
  - AWS Lambda
domains:
  - D3
signalwords:
  - "no code to write, no consumers to manage"
  - "near real-time delivery into the data lake"
  - "query the logs with standard SQL"
  - "minimize the amount of data scanned"
  - "no cluster to provision"
  - "fully managed delivery to S3"
assets:
  - battle_card_52.svg
  - battle_card_52.png
  - battle_card_52.pdf
status_note: >
  QC (scripts/qc.py): 0 Befunde. Gemeldet 8 Boxen, 43 Texte, 20 Segmente,
  5 Badges. Segmentzahl aufgeschluesselt nach R5: 20 gemeldet minus 10
  Phantom-Segmente aus fuenf Marker-Definitionen in <defs> = 10 tatsaechlich
  gezeichnete Segmente (8 <line>, 2 Teilsegmente des einen rechtwinkligen
  <path>). Badge-Zahl nach R6: 5 gemeldete Badges = die fuenf Nummern-Badges;
  der weiss gefuellte Kreis mit rotem Rand bei (187,535) ist das rote X des
  verworfenen Pfades und wird von Pruefung (d) korrekt nicht als Badge
  gezaehlt.
  Korrekturrunden: eine, VOR dem Zeichnen im Geometrieplan gefunden. Die
  Boxen "40 Microservices" (19,9 px Titelreserve) und "Eigener Consumer"
  (12,9 px) lagen unter der 20-px-Schwelle aus R4; beide von 235 auf 265 px
  verbreitert, Reserve danach 49,9 bzw. 42,9 px. Kollisionspruefung nach der
  Verbreiterung wiederholt: weiterhin 0 Kollisionen. Footer in drei Varianten
  gemessen, V3 mit 1142,7 px uebernommen.
  Schwarz-Pruefung nach R13: 0 px reines Schwarz (0,0,0) im PNG. Alle sieben
  Palettenfarben nachweisbar (#2E6BE6 4632 px, #D97706 13541 px, #ED7100
  1629 px, #3F8624 5134 px, #7A3FE0 5157 px, #C7161D 3669 px, #9A9A9A
  2435 px). R12-Gegencheck: genau ein <path> mit stroke (Glue -> Athena,
  rechtwinklig), traegt fill="none".
  Render-Sanity: neun Freizonen aus der Elementgeometrie abgeleitet, VIER
  mussten nachgeschnitten werden — alle vier Zonenfehler nach R7, kein
  Grafikfehler. Z1: Zone endete bei x=380 und traf den Rand der
  Ingestion-Zone (x=370, stroke 1,5) samt Eckradius rx=10, der nach innen bis
  ~377 reicht; neu bei x=365. Z3: Zone reichte ueber den X-Kreis, dessen
  Aussenkante bei cx-(r+stroke/2) = 187-21,5 = 165,5 liegt; neu bei x=140.
  Z5: Zone begann bei y=480 und schnitt sowohl den Rand der Abfrage-Zone
  (endet y=481,25) als auch den senkrechten Pfadabschnitt bei x=1355; neu
  y=500 und x bis 1330. Z8: Zone begann bei x=1120 und lag im Label
  "Tabellen-Metadaten" (147,6 px breit, text-anchor=middle auf x=1228, belegt
  1154,2..1301,8) — die Breite war vorab gemessen, aber beim Zonenschnitt
  nicht angewendet; neu bei x=1310. Danach 9 von 9 Zonen frei.
  Footer von Hand mit PIL gemessen: 1142,7 px (Stil-Guide ~1420,
  R3-Arbeitsgrenze ~1400).
  Sichtpruefung nach R8: versucht. Der view-Aufruf lieferte ein LEERES
  Bildobjekt zurueck — die Karte konnte NICHT gesehen werden. Rechnerisch
  geprueft ist nicht gesehen. Sichtpruefung durch Oktay steht aus.
---

# Battle Card 52 — Amazon Data Firehose · S3 · Athena

## Szenario

Ein Logistikunternehmen sammelt Anwendungslogs aus 40 Microservices. Die
Betriebsabteilung soll **per SQL** nachsehen können, welche Sendungen an einem
bestimmten Tag in einer bestimmten Region fehlgeschlagen sind. Es gibt **kein
Data-Engineering-Team** — niemand kann einen Consumer schreiben, betreiben,
patchen und überwachen. Die erste Lösung schrieb Rohdaten als JSON ohne
Partitionen nach S3; jede einzelne Abfrage las daraufhin den kompletten Bucket.

## Ablauf

**1 — Die Microservices schreiben direkt in Firehose.**
Über die Direct-PUT-API, ohne einen Stream davor. Das ist die Entscheidung,
die die ganze Karte trägt: Firehose ist ein **Liefer**dienst, kein Puffer zum
Abholen. Es gibt keinen Konsumenten, der pollt, keine Shard-Verwaltung und
keinen Anwendungscode, den jemand betreiben müsste.

**2 — Firehose konvertiert nach Parquet und partitioniert dynamisch.**
Zwei getrennte Funktionen, die zusammen den Kostenhebel bilden. Die **Format
Conversion** macht aus JSON ein spaltenweises Format — Athena liest dann nur
die Spalten, die in der Abfrage vorkommen. Das **Dynamic Partitioning** legt
Präfixe wie `region=/dt=` an, sodass eine Abfrage mit `WHERE region='DE'` die
übrigen Präfixe gar nicht erst öffnet. Ausgeliefert wird, sobald die
Puffergröße **oder** die Pufferzeit erreicht ist — was zuerst eintritt.

**Optional — eine Lambda-Transformation.**
Firehose kann jeden Record vor der Ablage durch eine Lambda-Funktion
schicken, etwa um Felder zu entfernen oder Formate zu vereinheitlichen.
Gestrichelt gezeichnet, weil sie für dieses Szenario nicht nötig ist: die
Partitionsschlüssel lassen sich bei JSON-Daten per Inline-Parsing direkt
extrahieren, ganz ohne Lambda.

**3 — Der Glue Data Catalog kennt Tabelle und Partitionen.**
Er ist kein Speicher, sondern ein Register: er weiß, welche Spalten es gibt,
welchen Typ sie haben und welche Präfixe welche Partitionswerte tragen. Ohne
diesen Eintrag wüsste Athena nicht, dass `region=DE/` eine Partition ist und
nicht bloß ein Ordnername.

**4 — Athena liest das Schema aus dem Katalog.**
Gestrichelt, weil hier Metadaten fließen und keine Nutzdaten. Diese Trennung
ist prüfungsrelevant: Athena holt die Tabellendefinition beim Katalog und die
Daten bei S3, nicht beides an derselben Stelle.

**5 — Die Abfrage liest ausschließlich die passenden Präfixe.**
Damit ist der Ausgangsfehler behoben. Vorher las jede Abfrage den ganzen
Bucket, weil weder Partition noch Spaltenformat existierten; jetzt öffnet
dieselbe Abfrage nur den Tagesordner der gesuchten Region und darin nur die
gefragten Spalten.

**Verworfen — der eigene Consumer auf EC2.**
Fachlich möglich: ein Programm liest aus einem Stream, sammelt, konvertiert
und schreibt nach S3. Praktisch scheitert es an der Voraussetzung des
Szenarios — es gibt niemanden, der diesen Code schreibt und betreibt. Die
Karte lehnt ihn nicht ab, weil er falsch wäre, sondern weil die Anforderung
ausdrücklich „ohne Code" lautet.

## Prüfungs-Kernsatz

**Firehose liefert ab, Data Streams puffern zum Abholen.** Wer „no code",
„fully managed delivery" und „near real-time into S3" liest, ist bei Firehose.
Wer „replay", „multiple independent consumers" oder „reprocess" liest, ist bei
Data Streams (Karte 51).

## Abgrenzungen

- **52 ↔ 51:** Data Streams ist ein Puffer mit Zeitachse, aus dem Konsumenten
  **holen** und aus dem sie erneut lesen können. Firehose **liefert
  selbstständig ab** und kennt kein Replay durch Dritte. Firehose kann einen
  Data Stream als Quelle haben — die beiden sind gestapelt, nicht alternativ.
  Auf dieser Karte fehlt der Stream bewusst, weil Direct PUT genügt.
- **52 ↔ 53:** Auf 52 geht es darum, **wie die Daten in den Lake kommen** und
  in welcher Form sie dort landen. Auf 53 geht es darum, **was die Abfrage
  kostet** und wie Partitionierung, Projection und Dateiformat den gescannten
  Umfang bestimmen. Athena und Glue erscheinen auf beiden Karten — hier als
  Endpunkt, dort als Gegenstand.
- **52 ↔ 57 (Glue ETL):** Firehose transformiert **im Fluss**, Record für
  Record, mit Millisekunden- bis Minutenlatenz. Glue ETL transformiert
  **im Batch**, nach Plan, über bereits abgelegte Daten. „Nächtliche
  Transformation CSV → Parquet" ist Glue ETL, „unterwegs nach Parquet" ist
  Firehose.
- **52 ↔ 59 (Managed Service for Apache Flink):** Firehose kann Records
  umformen, aber nicht über mehrere Records hinweg rechnen. Sobald gleitende
  Fenster, Aggregate über Zeit oder Musterkennung im Strom gefragt sind,
  reicht Firehose nicht.

## Klassiker-Fallen

1. **Firehose wird für einen Stream gehalten, aus dem man lesen kann.**
   Kann man nicht. Es gibt keine Consumer-API, keinen Iterator und keine
   Retention, aus der sich noch einmal lesen ließe. Wer nach dem Fehler von
   gestern die Daten erneut verarbeiten will, muss sie aus S3 holen — nicht
   aus Firehose.
2. **„Zero Buffering macht Firehose echtzeitfähig."** Das Puffer-Intervall
   lässt sich auf null setzen, dann liefert Firehose in etwa fünf Sekunden.
   **Mit Dynamic Partitioning ist Zero Buffering aber nicht verfügbar** — das
   steht ausdrücklich in der AWS-Doku. Wer beides gleichzeitig verspricht,
   liegt falsch.
3. **Das Puffer-Intervall wird für die Latenz gehalten.** Bei aktivem Dynamic
   Partitioning puffert Firehose mehrstufig, um große Objekte zu erzeugen; die
   Ende-zu-Ende-Verzögerung kann daher etwa **das 1,5-fache** der
   konfigurierten Pufferzeit betragen. Wer eine harte Frischegarantie aus der
   Einstellung ableitet, rechnet zu knapp.
4. **Parquet allein senkt die Kosten nicht ausreichend.** Spaltenformat spart
   Spalten, Partitionierung spart Zeilen. Wer nur konvertiert und nicht
   partitioniert, liest weiterhin jeden Tag und jede Region — nur schmaler.

## Faktencheck — Divergenzen zu älterem Kursmaterial

1. **Der Dienst heißt seit dem 09.02.2024 „Amazon Data Firehose".** Der frühere
   Name „Amazon Kinesis Data Firehose" ist in Console, Dokumentation und auf
   den Service-Seiten ersetzt. Geändert hat sich sonst nichts: Endpoints,
   APIs, CLI, IAM-Policies und CloudWatch-Metriken blieben identisch,
   bestehende Anwendungen laufen unverändert weiter. Kursmaterial vor 2024
   verwendet durchgängig den alten Namen; Prüfungsfragen können beide
   Schreibweisen enthalten.
   *Quelle: AWS What's New, „Introducing Amazon Data Firehose, formerly known
   as Amazon Kinesis Data Firehose", 09.02.2024.*

2. **Kinesis Data Analytics for SQL ist seit dem 27.01.2026 abgeschaltet.**
   Der Rückbau lief in drei Stufen: ab 01.09.2025 keine Bugfixes mehr, ab
   15.10.2025 keine neuen Anwendungen, ab 27.01.2026 werden bestehende
   Anwendungen gelöscht und lassen sich nicht mehr starten oder betreiben;
   Support entfällt. AWS empfiehlt Managed Service for Apache Flink bzw.
   Flink Studio als Nachfolge. **Das ist die stärkste Divergenz dieser Karte** —
   „SQL direkt auf dem Stream" war jahrelang eine Standardantwort und ist
   heute keine Option mehr.
   *Quelle: AWS Doku, „Amazon Kinesis Data Analytics for SQL Applications
   discontinuation"; identische Hinweise in Developer Guide, Limits und
   API-Referenz; AWS-Ressourcenseite zu Kinesis Data Analytics for SQL.*

3. **Kinesis Data Analytics (Flink) heißt seit dem 30.08.2023 Amazon Managed
   Service for Apache Flink.** Betrifft die Abgrenzung zu Karte 59.
   Kursmaterial nennt oft noch den alten Namen und suggeriert damit einen
   Dienst, der so nicht mehr existiert.
   *Quelle: AWS News Blog, Umbenennungshinweis vom 30.08.2023, in zahlreichen
   AWS-Blogartikeln als Vorspann eingeblendet.*

4. **Zero Buffering ist mit Dynamic Partitioning nicht verfügbar.** Die
   Kombination „null Sekunden Puffer plus dynamische Partitionierung" wird von
   der AWS-Doku ausdrücklich ausgeschlossen. Ältere Zusammenfassungen führen
   beide Fähigkeiten nebeneinander auf, ohne die Einschränkung zu nennen.
   *Quelle: AWS Doku, „Buffer data for dynamic partitioning" (Amazon Data
   Firehose Developer Guide).*

5. **Mehrstufiges Puffern verlängert die tatsächliche Latenz.** Bei aktivem
   Dynamic Partitioning kann die Ende-zu-Ende-Verzögerung eines
   Record-Batches rund das 1,5-fache der konfigurierten Pufferzeit betragen,
   weil Firehose intern mehrstufig puffert, um große Objekte zu schreiben.
   *Quelle: AWS Doku, „Buffer data for dynamic partitioning".*

## Nicht bestätigt

- **Konkrete Puffergrößen und -intervalle.** Hier widersprechen sich die
  Quellen, deshalb steht auf der Karte keine Zahl. Die Firehose-FAQ nennt für
  S3 eine Puffergröße von 1 bis 128 MB und ein Intervall von 0 bis 900
  Sekunden, schränkt aber ein, dass bei aktivem Parquet **oder** Dynamic
  Partitioning 64 bis 128 MB gelten (Default 128 MB). Die Quota-Seite nennt
  Intervall-Hints von 60 bis 900 Sekunden. Ein AWS-Blogbeitrag von 2021 nennt
  dagegen 1 MB bis 4 GB und ein Intervall von einer Minute bis zu einer
  Stunde. Nach der in Batch 10 gesetzten Regel kommt bei widersprüchlichen
  AWS-Quellen **kein Wert auf die Karte**; dort steht nur „Puffer: Größe ODER
  Zeit".
- **Maximaler Durchsatz je aktiver Partition (25 MB/s).** Stammt aus einem
  AWS-Blogbeitrag von 2021 und wurde in der aktuellen Quota-Dokumentation
  nicht in dieser Form gegengeprüft. Nicht auf der Karte.
- **Die Angabe „~5 Sekunden Lieferzeit bei Zero Buffering"** stammt aus einer
  Drittquelle, die AWS-Dokumentation bestätigt die Verfügbarkeit von Zero
  Buffering, die konkrete Sekundenzahl wurde nicht gegengeprüft. Auf der Karte
  steht keine Zeitangabe.

## Bewusste Vereinfachungen im Diagramm

- **Kein Kinesis Data Stream vor Firehose.** Firehose kann Data Streams, MSK
  und über zwanzig weitere Quellen anzapfen; hier schreiben die Services per
  Direct PUT direkt hinein. Das ist für das Szenario die einfachste korrekte
  Variante und schärft zugleich die Abgrenzung zu Karte 51.
- **Die Fehlerbehandlung fehlt.** Records, die sich nicht transformieren oder
  keiner Partition zuordnen lassen, landen in einem Error-Präfix in S3. Das
  ist für die Kernaussage nicht nötig und hätte eine weitere Box gekostet.
- **Der Glue Crawler ist nicht gezeichnet.** Der Katalogeintrag kann von einem
  Crawler erzeugt oder direkt angelegt werden; die Karte zeigt nur, dass der
  Katalog die Tabellendefinition hält.
- **Das Ergebnis der Athena-Abfrage fließt nicht sichtbar zurück.** Athena legt
  Ergebnisse in einem S3-Bucket ab. Der Rückfluss ist in der Abfrageverbindung
  implizit und wurde weggelassen, um den Lesefluss von links nach rechts nicht
  zu brechen.

## Farbkonventionen dieser Karte

- **Orange #D97706 — Lieferschicht.** Trägt Firehose und den Glue Data
  Catalog. Der Stil-Guide führt Glue ausdrücklich unter Orange. Damit trägt
  Orange auf dieser Karte zwei Rollen (Transport und Katalog); die Alternative
  wäre Teal für Glue gewesen, was eine neue Doppelbelegung mit der
  Regel-/Konfigurationsinstanz erzeugt hätte. **Von Oktay am 19.07.2026
  entschieden: Glue bleibt auf beiden Karten Orange.**
- **Orange #ED7100 — Lambda**, der zweite Orangeton des Stil-Guides, hier für
  die optionale Transformation. Gestrichelt, weil optional.
- **Grün #3F8624 — S3 und Datenbestände.** Unverändert.
- **Lila #7A3FE0 — Athena.** Wie auf Karte 40 und 49.
- **Blau #2E6BE6 — externe Systeme und Clients.** Trägt die Microservices als
  Datenquelle.
- **Rot #C7161D — ausschließlich „verworfen".** Rand der Consumer-Box
  (gestrichelt, weil abgelehnte Alternative) und das rote X auf dem Pfad
  dorthin.
- **Grau #9A9A9A — Zonenrahmen.** Zwei Zonen: „INGESTION — ohne Code" und
  „ABFRAGE — pro Volumen". Keine Semantik über einen Dienst.
