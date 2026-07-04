# Kapitel 7 — Analytik

> **Konvention:** Normaler Text / Blockquote = **dein Originaltext, wortgetreu erhalten**. **🛑-markiert = meine faktengeprüften Ergänzungen (CLF + SAA).**

**Die Kernidee dieser Domäne:** Alle Analytik-Dienste sind Stationen **einer Daten-Pipeline** — merk dir das Fließband, dann sortiert sich jede Prüfungsfrage von selbst:

`Sammeln (Kinesis/MSK) → Speichern (S3 = Data Lake) → Putzen & Katalogisieren (Glue) → Absichern (Lake Formation) → Abfragen (Athena / Redshift* / EMR / OpenSearch) → Visualisieren (QuickSight) → Teilen (DataZone)`

*\*Redshift (das Data Warehouse) steht im Datenbanken-Kapitel — hier zählt nur seine Rolle als Analyse-Endpunkt.*

---

## Amazon Athena

**Metapher / Konzept**

> Die Detektivin, die deine Dateiberge in S3 direkt per SQL verhört — ohne dass du je einen Server startest.

**Das Problem & Die Lösung**

In deinem S3-Bucket sammeln sich Berge von Daten: Webserver-Logs, CSV-Exporte, CloudTrail-Protokolle — Terabytes. Der Chef fragt: „Wie viele Nutzer aus Deutschland haben sich im Mai eingeloggt?" Tja — **S3 ist nur ein Dateilager**, es kann keine Fragen beantworten. Der klassische Weg (Datenbank aufsetzen, alles hineinladen, ETL, Server bezahlen) = **Wochen Arbeit für eine einzige Frage? Absurd.**

**Athena** ist ein **serverloser, interaktiver Abfragedienst**: Du schreibst normales **SQL**, und Athena führt es **direkt auf deinen Dateien in S3** aus — **die Daten bleiben, wo sie sind**:
- **Serverlos:** nichts zu starten, zu patchen, zu verwalten. Konsole öffnen, SQL tippen, Ergebnis.
- **Bezahlung pro Abfrage:** nur für die **gescannte Datenmenge** (pro Terabyte) — nicht für laufende Server.
- **Versteht gängige Formate:** CSV, JSON, Parquet, ORC.

**Praxis — das Lieblingsbeispiel von AWS (Log-Analyse):** CloudTrail-/Load-Balancer-Logs liegen sowieso in S3. Mit Athena: `SELECT ip_adresse, COUNT(*) FROM logs WHERE status = 403 GROUP BY ip_adresse` — und du siehst sofort, welche IP verdächtig oft abgeblockt wurde. Häufiger Partner: **Glue** katalogisiert, wie die „Tabellen" in S3 aussehen; die Ergebnisse visualisiert **QuickSight**.

**⚠️ Die Prüfungs-Knackpunkte**
- **Die magische Signalwort-Kombination: „SQL" + „direkt auf Daten in S3" + „serverlos" → Athena.** Ein hundertprozentiger Fingerabdruck.
- „Logs in S3 analysieren, ohne Infrastruktur" → **Athena**.
- **Killer-Abgrenzung — Athena vs. Redshift:** Athena = serverlos, ad-hoc, Daten bleiben in S3, zahle pro Abfrage (spontane Analysen). Redshift = vollwertiges Data Warehouse mit Cluster, in das geladen wird (dauerhafte, komplexe Business-Analysen). **Merksatz: Athena = spontane Detektivin am Tatort (S3), Redshift = das fest eingerichtete Kriminallabor.**
- **Trio fürs Gesamtbild:** Glue (katalogisiert) → Athena (fragt ab) → QuickSight (visualisiert).

🛑 **Pro-Tipp SAA — die Kostenfrage:** Athena kostet pro **gescanntem** Datenvolumen → weniger scannen = weniger zahlen. Die zwei Hebel: **spaltenbasierte Formate (Parquet/ORC)** statt CSV (liest nur benötigte Spalten) und **Partitionierung** (z. B. nach Datum — `WHERE date='2026-06'` scannt nur diesen Ordner). Signalwort „Athena-Kosten/Performance optimieren" → Parquet + Partitionen.

---

## AWS Glue

**Metapher / Konzept**

> Der Kleber, der rohe Datenberge putzt, sortiert und analysetauglich zusammenfügt.

**Das Problem & Die Lösung**

Deine Daten liegen verstreut und in furchtbarem Zustand: CSVs aus dem Shop, JSON-Logs, Exporte aus drei Datenbanken. Datumsformate unterschiedlich (12.06.2026 vs. 2026-06-12), Spalten heißen mal `kunde_id`, mal `customerId`, Duplikate überall. Bevor irgendwer analysieren kann, müssen die Daten **herausgeholt, gesäubert, vereinheitlicht und abgelegt** werden — der Prozess heißt **ETL: Extract → Transform → Load**. Früher: eigene ETL-Server, teuer und nervig.

**Glue** ist der vollständig verwaltete, **serverlose ETL-Dienst**. Die zwei Herzstücke:
- **Glue Data Catalog (das Inhaltsverzeichnis):** **Crawler** durchforsten automatisch deine Quellen (z. B. S3): Welche Daten, wo, welche Spalten, welches Format? Ergebnis: ein zentraler **Metadaten-Katalog**. Und hier schließt sich der Kreis: **Genau diesen Katalog benutzt Athena**, um zu wissen, wie deine „Tabellen" aussehen!
- **ETL-Jobs (die Putzkolonne):** Glue generiert und führt Transformations-Jobs aus (technisch auf **Spark**-Basis) — säubern, umformen, z. B. von CSV ins analyse-optimierte **Parquet** konvertieren.

**Praxis — der Standard-Workflow:** Rohdaten in S3 → Crawler katalogisiert → ETL-Job putzt → sauber in zweiten Bucket → Athena fragt ab → QuickSight malt Dashboards. Das ist die klassische **serverlose Data-Lake-Architektur**. *(Ein **Data Lake** = zentrales Sammelbecken, meist S3, für alle Rohdaten einer Firma in jedem Format.)*

**⚠️ Die Prüfungs-Knackpunkte**
- **Das absolute Signalwort: „ETL" → Glue. Punkt.** Diese Gleichung im Schlaf können.
- Weitere: „Daten für Analysen vorbereiten/transformieren", „Data Catalog", „Crawler", „serverlose Datenintegration" → **Glue**.
- **Glue ist serverlos** — keine Infrastruktur (Abgrenzung zu EMR!).
- **Das Dreamteam:** Glue (vorbereiten + katalogisieren) → Athena (abfragen) → QuickSight (visualisieren).

---

## AWS Lake Formation

**Metapher / Konzept**

> Der Baumeister, der einen sicheren Data Lake in Tagen statt Monaten errichtet — inklusive zentraler, fein abgestufter Zugriffsrechte.

**Das Problem & Die Lösung**

Ein Data Lake (das S3-Sammelbecken) von Grund auf aufzubauen ist Handarbeit: Daten aus zig Quellen einsammeln, organisieren, katalogisieren, bereinigen. Das größte Problem ist die **Sicherheit**: Wer darf welche Daten sehen? Mit reinen S3-/IAM-Rechten müsstest du pro Bucket/Ordner steuern — und **„Abteilung A darf nur bestimmte Spalten sehen"** geht so kaum. Berechtigungs-Chaos.

**Lake Formation** vereinfacht Aufbau, Absicherung und Verwaltung des Data Lake — es legt sich **über Glue und S3**:
- **Schneller Aufbau:** geführt Daten einsammeln, organisieren, katalogisieren (via Glue Data Catalog).
- **Zentrale, feingranulare Zugriffsrechte — das Kernstück!** Rechte zentral bis auf **Tabellen-, Spalten- und Zeilenebene**: „Marketing darf diese Tabelle sehen, aber nicht die Gehaltsspalte." Gilt automatisch für **alle** Analyse-Dienste (Athena, Redshift, EMR, QuickSight).
- **Ein Rechte-Modell für alles** statt S3-, Glue- und IAM-Rechte einzeln zu jonglieren.

**Die Abgrenzung zu Glue:** **Glue** = die Werkzeuge (ETL + Catalog). **Lake Formation** = die Governance-/Aufbau-Schicht obendrauf. **Merksatz: Glue liefert die ETL-Werkzeuge und den Katalog. Lake Formation baut daraus den sicheren Data Lake mit zentralen Zugriffsrechten.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Data Lake aufbauen/absichern", „zentrale Zugriffsrechte auf Daten", „feingranular (Spalten-/Zeilenebene)", „Berechtigungen für Athena/Redshift zentral steuern" → **Lake Formation**.
- Kern-Stichwort: **fein abgestufte Zugriffskontrolle auf Tabellen/Spalten** — das Alleinstellungsmerkmal.

**Der Unterschied ist entscheidend (deine Vertiefung, wortgetreu):**
- ❌ Nicht: „Du darfst nur diese eine bestimmte Abfrage ausführen."
- ✅ Sondern: „Du darfst diese Tabelle sehen, aber die Spalte ‚Gehalt' nicht — **egal welche Abfrage du machst**."

Konkret: Marketing tippt `SELECT * FROM mitarbeiter` → die Abfrage läuft normal über Athena — aber weil Lake Formation die Gehaltsspalte gesperrt hat, kommen **alle Spalten außer Gehalt** zurück. **Die Beschränkung sitzt auf den Daten, nicht auf der Abfrage.** **Merksatz: Athena ist das Werkzeug zum Fragen. Lake Formation ist der Türsteher, der entscheidet, welche Daten du beim Fragen überhaupt zu sehen bekommst** — und dieser Türsteher gilt automatisch auch für Redshift, EMR und QuickSight.

---

## AWS DataZone

**Metapher / Konzept**

> Der firmenweite Daten-Marktplatz, auf dem Teams ihre Datenschätze auffindbar machen, teilen und kontrolliert freigeben.

**Das Problem & Die Lösung**

Jedes Team sammelt eigene Daten: Marketing Kampagnendaten, Vertrieb Verkaufszahlen, Produktion Sensordaten — alles in **getrennten Silos**. Ein Data Scientist im Vertrieb würde gern die Marketingdaten nutzen — aber er **weiß nicht mal, dass sie existieren**, geschweige denn wo, oder wen er fragen muss. Wertvolle Daten liegen brach; Zugriff = bürokratischer E-Mail-Marathon.

**DataZone** schafft einen **firmenweiten Daten-Katalog** mit eingebauter **Governance**:
- **Business-Datenkatalog:** Daten mit verständlichen **Geschäftsbegriffen** katalogisiert — durchsuchbar wie ein Shop („Wer hat Umsatzdaten pro Region?").
- **Self-Service mit Kontrolle:** Analyst fragt Zugriff an, Eigentümer genehmigt — geregelt, nachvollziehbar, kein Wildwuchs.
- **Governance & Compliance:** zentrale Richtlinien, wer welche Daten sieht.
- **Projekte & Zusammenarbeit:** Teams arbeiten in abgegrenzten Bereichen.

**Die Abgrenzung — nicht mit dem Glue Data Catalog verwechseln:** **Glue Data Catalog** = **technischer** Metadaten-Katalog (Schema/Struktur) für Maschinen wie Athena. **DataZone** = **organisatorischer/geschäftlicher** Katalog für Menschen und Teams. **Merksatz: Glue-Katalog = technisches Inhaltsverzeichnis für Abfrage-Tools. DataZone = der firmenweite Daten-Marktplatz mit Genehmigungs-Prozess.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Daten teilen über Teams/Abteilungen", „Daten auffindbar machen", „Daten-Governance", „Datensilos aufbrechen", „Zugriff anfragen und genehmigen" → **DataZone**.
- DataZone ist eher SAA-/Analytics-Kontext und vergleichsweise neu — als CLF-Kandidat eher am Rand, aber gut zu kennen.

---

## Amazon EMR

**Metapher / Konzept**

> Das gemietete Großkraftwerk für Big-Data-Verarbeitung mit Hadoop und Spark.

**Das Problem & Die Lösung**

500 Terabyte Klickdaten analysieren, ML-Modelle auf Milliarden Datensätzen trainieren — **selbst der dickste Server der Welt rechnet daran Monate**. Die Lösung der Big-Data-Welt: **verteiltes Rechnen** — hunderte Computer bearbeiten je ein Stück. Die berühmten Frameworks: **Apache Hadoop und Apache Spark** (dazu Hive, Presto, HBase...). Der Haken: Einen 100-Maschinen-Cluster selbst aufzubauen und zu pflegen ist ein Albtraum.

**EMR** ist die **verwaltete Big-Data-Plattform**: „Ich brauche einen Spark-Cluster mit 50 Knoten" → Minuten später steht er:
- **Open-Source-Stars vorinstalliert:** Hadoop, Spark, Hive & Co. — wichtig für Firmen, die bestehende Big-Data-Anwendungen migrieren.
- **Elastisch:** nachts 200 Knoten für den Mammut-Job, tagsüber 10.
- **Der Spar-Trick:** EMR läuft perfekt auf günstigen **Spot-Instanzen** (bis 90 % Rabatt) — geht ein Knoten verloren, verteilt das Framework neu. Cluster nach dem Job **automatisch abschalten**.

**Praxis:** riesige Log-Verarbeitung, wissenschaftliche Simulationen, ML-Trainingsdaten aufbereiten, Genom-Analysen — überall, wo massive verteilte Rechenpower + volle Framework-Kontrolle gebraucht wird.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: **„Hadoop", „Spark"**, „Big Data verarbeiten", „Cluster", „verteilte Datenverarbeitung" → **EMR**. Sobald Hadoop oder Spark im Fragetext steht → EMR, hundertprozentig.
- **Die Abgrenzung — Glue vs. EMR (beliebte Falle):** Beide transformieren Daten! **Glue** = serverlos, einfach, Standard-ETL. **EMR** = echter Cluster mit voller Hadoop/Spark-Kontrolle — mächtiger, mehr Verwaltung. **Merksatz: Glue = ETL ohne Nachdenken über Infrastruktur. EMR = das volle Big-Data-Kraftwerk, wenn Hadoop/Spark explizit gefordert sind.**
- **Eselsbrücke:** **E**lastic **M**ap**R**educe — MapReduce ist das ursprüngliche Hadoop-Rechenverfahren (Arbeit verteilen = Map, Ergebnisse einsammeln = Reduce).

🛑 **Pro-Tipp SAA:** Es gibt auch **EMR Serverless** — Spark/Hive-Jobs ganz ohne Cluster-Dimensionierung. Signalwort „Spark ohne Cluster-Management" → EMR Serverless.

---

## Amazon Kinesis

**Metapher / Konzept**

> Das Förderband für Datenströme, die niemals aufhören zu fließen.

**Das Problem & Die Lösung**

Glue, Athena, EMR arbeiten mit **ruhenden Daten** (Batch-Verarbeitung, z. B. nachts). Aber manche Daten können nicht warten: Sensordaten von 10.000 IoT-Geräten (**jede Sekunde** neue Messwerte!), Klickströme, Aktienkurse, Standortdaten einer Lieferflotte. Diese Daten kommen als **endloser, kontinuierlicher Strom** — und oft musst du **in Sekunden reagieren**: Betrugserkennung muss **während** der Transaktion zuschlagen, nicht morgen früh.

**Kinesis** ist die Dienst-Familie für **Streaming-Daten in Echtzeit**. Die wichtigsten Familienmitglieder:
- **Kinesis Data Streams:** das **rohe Förderband**. Daten strömen rein und stehen in Echtzeit (unter einer Sekunde) für **eigene** Verarbeitungs-Anwendungen bereit (oft Lambda, die am Strom „lauscht"). Maximale Kontrolle.
- **Kinesis Data Firehose:** der **bequeme Auto-Auslieferer**. Nimmt den Strom und kippt ihn fast in Echtzeit, vollautomatisch, **ohne eigenen Code** in ein Ziel: **S3, Redshift oder OpenSearch**. **Merksatz: Firehose = Feuerwehrschlauch, der den Datenstrom direkt ins Ziel-Becken spritzt.**
- **Kinesis Data Analytics:** **SQL auf den laufenden Strom** („Wie viele Klicks in den letzten 60 Sekunden?").

**Praxis — Klassiker Betrugserkennung:** Jede Kartenzahlung → Kinesis Data Stream → Lambda prüft jedes Event in Millisekunden gegen Betrugsmuster → verdächtige Transaktion sofort blockiert. Parallel schiebt Firehose alles zur Langzeit-Archivierung nach S3, wo Athena später auswertet. **Echtzeit und Batch Hand in Hand.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Echtzeit / Real-time", „Streaming-Daten", „kontinuierlicher Datenstrom", „IoT-Sensordaten", „Clickstreams" → **Kinesis**.
- **Streams vs. Firehose (Lieblingsfrage!):** Data Streams = Echtzeit + **eigene Logik**. Firehose = **einfachster Weg ohne Code** direkt nach S3/Redshift/OpenSearch. „Einfachste Lösung, um Streaming-Daten in S3 zu speichern" → **Firehose**.
- **Abgrenzung zu SQS:** SQS = Warteschlange zum **Entkoppeln** von Anwendungskomponenten. Kinesis = **massive Datenströme in Echtzeit analysieren**. **Grobe Eselsbrücke: SQS = Briefkasten, Kinesis = Wasserleitung.**
- **Eselsbrücke zum Namen:** Kinesis = Bewegung (Kinetik) → **data in motion**, im Gegensatz zu ruhenden Daten (**data at rest**) in S3.

---

## Kinesis-Dienste im Detail

**Metapher / Konzept**

> Vier spezialisierte Flüsse für Echtzeit-Daten — jeder für eine andere Aufgabe im Datenstrom.

**Die vier Familienmitglieder (deine Karte, wortgetreu):**

- **Kinesis Data Streams:** das rohe, schnelle Förderband — Echtzeit (**Millisekunden**), eigene Verarbeitung (oft Lambda). **Technik:** Daten in **Shards** (Partitionen); mehr Shards = mehr Durchsatz. Du verwaltest die Kapazität; Daten bleiben standardmäßig **bis zu 24 Std.** (erweiterbar) abrufbar. **Stichwort: Echtzeit + eigene Logik + Kontrolle.**
- **Kinesis Data Firehose:** der Auto-Auslieferer — vollautomatisch, **ohne Code** nach **S3, Redshift, OpenSearch (oder Splunk)**. Serverlos, kein Shard-Management. Kann unterwegs leicht transformieren (via Lambda) und konvertieren (z. B. nach Parquet). **Aber: „near real-time"** (Pufferzeit in Sekunden), nicht millisekundengenau. **Stichwort: einfachste Lösung, um Streaming-Daten irgendwo zu speichern.**
- **Kinesis Data Analytics:** **SQL (oder Apache Flink)** auf den laufenden Strom — „Durchschnitt der letzten 60 Sekunden", Anomalien in Echtzeit. **Stichwort: Echtzeit-Analyse/SQL auf dem Stream.**
- **Kinesis Video Streams:** speziell für **Video-/Audioströme** (Kameras, Webcams, Drohnen) in die Cloud — Wiedergabe, Analyse, ML (z. B. mit Rekognition). **Stichwort: Video-Streaming.**

**⚠️ Prüfungs-Knackpunkte**
- Echtzeit + eigene Verarbeitung/Kontrolle (Shards) → **Data Streams**.
- Einfachstes Laden nach S3/Redshift/OpenSearch ohne Code → **Firehose** (near-real-time!).
- SQL/Analyse auf dem laufenden Strom → **Data Analytics**.
- Video von Kameras → **Video Streams**.
- **Der Klassiker:** Streams = du baust selbst (millisekundengenau) ↔ Firehose = AWS liefert automatisch ab (Sekunden, kein Code).

🛑 **Aktualität — die neuen Namen (alte tauchen in Prüfungen weiter auf):** AWS hat zwei Familienmitglieder umbenannt: **Kinesis Data Firehose → „Amazon Data Firehose"** (2024, das „Kinesis" ist aus dem Namen raus) und **Kinesis Data Analytics → „Amazon Managed Service for Apache Flink"** (2023). Funktional identisch zu deinen Beschreibungen — merk dir beide Namenspaare für Konsole und neuere Fragen.

---

## Amazon MSK (Managed Streaming for Apache Kafka)

**Metapher / Konzept**

> Apache Kafka als verwalteter Dienst — die etablierte Streaming-Plattform, ohne die berüchtigt komplizierten Kafka-Server selbst betreiben zu müssen.

**Das Problem & Die Lösung**

**Apache Kafka** ist der weltweite Industriestandard für Streaming-Daten — sehr viele Firmen nutzen es bereits. Das Problem: Einen Kafka-Cluster selbst zu betreiben ist **berüchtigt komplex** (Broker aufsetzen, vernetzen, absichern, skalieren, patchen). Wer mit bestehenden Kafka-Anwendungen in die Cloud will, möchte **Kafka behalten, aber den Betriebsaufwand loswerden**.

**MSK** ist **echtes Apache Kafka als vollständig verwalteter Dienst**: AWS betreibt die Broker, aber es bleibt originales Kafka mit allen gewohnten APIs:
- **Vertrautes Kafka:** bestehende Anwendungen laufen **ohne Umbau** — dieselben APIs, dasselbe Ökosystem.
- **Kein Betriebsstress:** AWS übernimmt die Cluster-Verwaltung.
- **Streaming in großem Maßstab.**

**Die Killer-Frage MSK vs. Kinesis — das gleiche Muster wie Amazon MQ vs. SQS/SNS:** **Kinesis** = die cloud-native AWS-Lösung, erste Wahl für **neue** Anwendungen. **MSK** = wenn eine Firma **bereits Kafka nutzt** und ohne Umschreiben migrieren will. **Merksatz: Neues Streaming-Projekt? → Kinesis. Bestehende Kafka-Anwendung / Kafka explizit gefordert? → MSK. Das Wort „Kafka" in der Frage zeigt fast immer auf MSK.**

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Apache Kafka", „bestehende Kafka-Anwendung", „verwaltetes Kafka" → **MSK**.
- **Erinnerung an das Muster:** Wie MQ (klassischer Broker) vs. SQS/SNS — „bestehende Open-Source-Technologie behalten" → der verwaltete Dienst (MSK/MQ); „neu und nativ" → die AWS-Eigenlösung (Kinesis/SQS).

---

## Amazon OpenSearch Service

**Metapher / Konzept**

> Die Google-Suchmaschine für deine eigenen Logs und Texte.

**Das Problem & Die Lösung**

Mitternacht, die Website wirft Fehler. 50 Server produzieren **Millionen Log-Einträge pro Stunde**, verteilt über CloudWatch, Dateien, Container. Du musst **sofort** wissen: Wo taucht `NullPointerException` auf? Auf welchen Servern? Seit wann gehäuft? Eine klassische SQL-Datenbank ist für **Volltextsuche über riesige Textmengen** nicht gebaut — sie würde ewig brauchen.

**OpenSearch** ist der verwaltete Dienst für die Open-Source-Suchmaschine OpenSearch (**Abspaltung des berühmten Elasticsearch** — der alte Dienstname „Amazon Elasticsearch Service" kann in älteren Fragen auftauchen!):
- **Volltextsuche in Millisekunden:** alles wird **indexiert** (wie das Stichwortverzeichnis eines Buches) — danach findet die Suche jede Nadel sofort, inkl. Filter, unscharfer Suche, Relevanz-Ranking.
- **Log-Analyse in Echtzeit:** der Haupteinsatzzweck — Logs aller Systeme an einem Ort.
- **OpenSearch Dashboards:** eingebaute Visualisierung (Live-Graphen, z. B. „Fehlerrate pro Minute" im Operations-Center).

**Praxis — der Klassiker-Datenfluss:** Anwendungen loggen → **Kinesis Data Firehose** sammelt die Ströme und schiebt sie automatisch nach **OpenSearch** → das Team durchsucht live. Auch beliebt: die **Produktsuche im Online-Shop** („Ergebnisse während des Tippens") läuft technisch oft über OpenSearch.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Volltextsuche", „Logs durchsuchen/analysieren", „Suchmaschine", „Log-Analytics", **„Elasticsearch"** → **OpenSearch**.
- Taucht **Elasticsearch** in einer Frage auf → gemeint ist OpenSearch Service.
- **Abgrenzung zu Athena (beide „durchsuchen"!):** Athena = SQL **ad-hoc** auf Dateien in S3 (Daten bleiben liegen). OpenSearch = Daten werden in einen **Suchindex geladen** für blitzschnelle Dauersuche + Live-Dashboards. **Merksatz: Athena = die Detektivin, die bei Bedarf den Aktenschrank durchliest. OpenSearch = die Bibliothek mit fertigem Stichwortverzeichnis, die jede Frage sofort beantwortet.**
- **Traumpaar in Prüfungsfragen:** Kinesis Firehose → OpenSearch für Echtzeit-Log-Analyse.

---

## Amazon QuickSight

**Metapher / Konzept**

> Das Dashboard-Studio, das nackte Zahlen in schöne, klickbare Diagramme verwandelt.

**Das Problem & Die Lösung**

Du hast mit Glue geputzt, mit Athena abgefragt, mit Redshift analysiert. Das Ergebnis: **eine Tabelle mit 50.000 Zeilen Rohzahlen**. Der Geschäftsführer will keine SQL-Ergebnisse — er will **auf einen Blick** sehen: „Umsatz pro Region im letzten Quartal" als Grafik. Nach Excel exportieren und Diagramme von Hand bauen? Morgen sind die Daten veraltet.

**QuickSight** ist der **Business-Intelligence-Dienst (BI)** von AWS — interaktive Dashboards und Visualisierungen:
- **Serverlos & verwaltet:** keine Infrastruktur, du baust nur Dashboards.
- **Verbindet sich mit allem:** Athena, Redshift, RDS, S3, sogar außerhalb von AWS.
- **SPICE:** die eingebaute, superschnelle **In-Memory-Engine** — Dashboards laden blitzschnell, auch wenn viele gleichzeitig draufschauen.
- **QuickSight Q:** Fragen in normaler Sprache stellen („Zeig mir den Umsatz in Berlin letzten Monat") → automatisch das passende Diagramm. *(🛑 heute unter dem Namen „Amazon Q in QuickSight" ausgebaut.)*

**Praxis:** Jetzt schließt sich die komplette Analytik-Kette: **Glue putzt und katalogisiert → Athena fragt ab → QuickSight macht das Live-Dashboard für die Chefetage.** QuickSight ist **immer das letzte Glied der Kette** — der Punkt, an dem aus Daten Erkenntnisse für Menschen werden.

**⚠️ Die Prüfungs-Knackpunkte**
- Signalwörter: „Dashboard", „Visualisierung", „BI / Business Intelligence", „Berichte für das Management" → **QuickSight**.
- **Die Rollenverteilung am Ende der Kette:** Athena/Redshift = abfragen/rechnen, QuickSight = **visualisieren**. „Diagramme / Dashboards für Geschäftsentscheidungen" → QuickSight, nicht die Abfrage-Dienste.
- **Eselsbrücke:** Quick **Sight** = „schnell etwas **sehen**" → visuelles Sichtbarmachen.

---

*Ende Kapitel 7 — Analytik.*
