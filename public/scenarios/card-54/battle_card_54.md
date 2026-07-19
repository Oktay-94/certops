---
nr: 54
title: "OpenSearch Service · OpenSearch Dashboards — zentrale Log-Suche über 60 Microservices"
services:
  - Amazon OpenSearch Service
  - Amazon OpenSearch Serverless
  - OpenSearch Dashboards
  - Amazon CloudWatch Logs
  - Amazon Data Firehose
domains:
  - D3
signalwords:
  - "centralized log search across all services"
  - "full-text search over log data"
  - "find a correlation ID in seconds"
  - "visualize the results in dashboards"
  - "no cluster to size or manage"
  - "operational analytics on log data"
assets:
  - battle_card_54.svg
  - battle_card_54.png
  - battle_card_54.pdf
status_note: >
  QC (scripts/qc.py): 0 Befunde. Gemeldet 8 Boxen, 35 Texte, 19 Segmente,
  5 Badges. Segmentzahl aufgeschluesselt nach R5: 19 gemeldet minus 10
  Phantom-Segmente aus fuenf Marker-Definitionen in <defs> = 9 tatsaechlich
  gezeichnete Segmente, allesamt <line>. Badge-Zahl nach R6: 5 gemeldete
  Badges = die fuenf Nummern-Badges; der weiss gefuellte Kreis mit rotem Rand
  bei (175,570) ist das rote X des verworfenen Pfades und wird von Pruefung
  (d) korrekt nicht als Badge gezaehlt.
  Korrekturrunden: eine, VOR dem Zeichnen im Geometrieplan gefunden, mit drei
  Befunden. (1) Der Titel "Battle Card 54 — OpenSearch Service · OpenSearch
  Dashboards" mass 1443,9 px und liess nur 56,1 px Reserve; auf "Battle Card
  54 — OpenSearch Service · Dashboards" gekuerzt (1156,9 px, 343,1 px
  Reserve). (2) "Collection (Serverless)" war mit 255,7 px bei 254 px Limit
  1,7 px zu breit. (3) "OpenSearch Dashboards" war mit 263,5 px 9,5 px zu
  breit. Fuer (2) und (3) wurde die rechte Boxspalte von 270 auf 300 px
  verbreitert und auf x=1010 verschoben; Reserven danach 28,3 bzw. 20,5 px.
  Kollisionspruefung nach der Aenderung wiederholt: weiterhin 0 Kollisionen.
  Footer in drei Varianten gemessen, V3 mit 1269,7 px uebernommen.
  Schwarz-Pruefung nach R13: 0 px reines Schwarz (0,0,0) im PNG. Alle sieben
  Palettenfarben nachweisbar (#2E6BE6 7382 px, #232F3E 5953 px, #D97706
  6767 px, #0F7C8C 7723 px, #7A3FE0 1236 px, #C7161D 3068 px, #9A9A9A
  3454 px). R12-Gegencheck: NULL <path> mit stroke im SVG — alle neun
  Verbindungen sind <line>-Elemente. Damit ist der Fehler aus R12 auf dieser
  Karte strukturell ausgeschlossen, nicht nur vermieden.
  Render-Sanity: neun Freizonen aus der Elementgeometrie abgeleitet, ALLE
  NEUN im ersten Anlauf frei — null Nachbesserungen. Das im Verlauf des
  Batches geaenderte Verfahren (gemessene Label- und Randgrenzen direkt in die
  Zonendefinition statt danebengerechnet) ist damit durchgetragen: vier
  Nachbesserungen auf Karte 52, eine auf Karte 53, null auf Karte 54.
  Zusaetzlich wurde das gegenueber dem Plan geaenderte Label "indexiert —
  entweder oder" nach dem Zeichnen neu gemessen (200,9 px, belegt
  729,5..930,5) und gegen die Boxgrenzen geprueft, bevor die Zonen geschnitten
  wurden.
  Footer von Hand mit PIL gemessen: 1269,7 px (Stil-Guide ~1420,
  R3-Arbeitsgrenze ~1400).
  Sichtpruefung nach R8: versucht. Der view-Aufruf lieferte ein Bildobjekt
  ohne erkennbaren Inhalt zurueck — die Karte konnte NICHT gesehen werden.
  Viermal von viermal in dieser Sitzung. Rechnerisch geprueft ist nicht
  gesehen. Sichtpruefung durch Oktay steht aus.
---

# Battle Card 54 — OpenSearch Service · OpenSearch Dashboards

## Szenario

Eine Bank betreibt 60 Microservices, deren Logs in CloudWatch Logs landen.
Im Störungsfall muss der Bereitschaftsdienst **innerhalb von Sekunden** eine
Correlation-ID über alle Services hinweg finden und den Verlauf einer
Transaktion rekonstruieren. Heute klickt sich jemand durch einzelne
Log-Gruppen. Gesucht ist zentrale Volltextsuche mit Dashboards — und die
Entscheidung, ob eine Domain oder eine Collection das Richtige ist.

## Ablauf

**1 — Die Microservices schreiben nach CloudWatch Logs.**
Das ist der Ausgangszustand, nicht die Lösung. CloudWatch Logs speichert
zuverlässig und getrennt je Log-Gruppe — und genau diese Trennung ist das
Problem: 60 Services bedeuten 60 Orte, an denen dieselbe Correlation-ID
stehen könnte.

**2 — Ein Subscription Filter leitet die Logs weiter.**
CloudWatch Logs kann Log-Ereignisse an ein Ziel streamen, sobald sie
eintreffen. Damit muss niemand pollen und niemand exportieren; die Logs
verlassen die Log-Gruppe im Fluss.

**3 und 4 — Firehose liefert an OpenSearch — und hier fällt die Entscheidung.**
Firehose puffert und schreibt ohne Anwendungscode (siehe Karte 52). Das Ziel
ist **entweder** eine Domain **oder** eine Collection — beides ist
OpenSearch Service, aber sie verhalten sich grundverschieden:

- **Domain (managed):** Die Indizes liegen in einem vorprovisionierten
  Cluster aus Nodes. Man wählt Instanztypen, berechnet den Speicherbedarf
  und dimensioniert selbst. Volle Kontrolle, volle Verantwortung.
- **Collection (Serverless):** Die Indizes liegen in einer Collection, einer
  logischen Gruppe von Indizes für einen Anwendungsfall. **Es gibt weder
  Cluster noch Node** — AWS stellt Rechenkapazität automatisch bereit und
  skaliert sie in OCUs. Verschlüsselung im Ruhezustand ist hier **Pflicht**,
  bei Domains ist sie optional.

**5 — OpenSearch Dashboards macht die Suche bedienbar.**
Der Bereitschaftsdienst tippt die Correlation-ID in ein Suchfeld und sieht
den Verlauf über alle Services. Der Dienst hieß früher Kibana; nach dem
Fork heißt er OpenSearch Dashboards, und der Endpunkt änderte sich von
`/_plugin/kibana` auf `/_dashboards`.

**Verworfen — Athena auf S3-Logs.**
Fachlich funktioniert es: Logs nach S3, Tabelle darüber, SQL. Aber Athena
**scannt**, es sucht nicht. Für eine Freitextsuche über beliebige Felder mit
Antwort in Sekunden ist ein invertierter Index das richtige Werkzeug, kein
Full-Scan mit Partitionsfilter. **Das ist bewusst die Gegenrichtung zu
Karte 53**, wo Athena die richtige Antwort war.

## Prüfungs-Kernsatz

**Volltextsuche braucht einen Index, Analyse braucht einen Scan.** Wer
„search", „correlation ID", „sub-second lookup" oder „dashboards" liest, ist
bei OpenSearch. Wer „ad-hoc SQL", „pay per query" oder „data lake" liest, ist
bei Athena.

## Abgrenzungen

- **54 ↔ 53:** Dieselbe Datenlage, entgegengesetzte Antwort. Athena ist
  richtig, wenn man **strukturierte Fragen mit SQL** an ruhende Daten stellt
  und pro Abfrage zahlen will. OpenSearch ist richtig, wenn man **unbekannte
  Begriffe im Freitext** sucht und die Antwort sofort braucht. Der Kostenpfad
  unterscheidet sich entsprechend: Athena kostet nichts, wenn niemand fragt;
  ein OpenSearch-Index kostet, weil er ständig vorgehalten wird.
- **54 ↔ 52:** Firehose erscheint auf beiden Karten in derselben Rolle — als
  Lieferschicht ohne Anwendungscode. Auf 52 liefert es nach S3, hier nach
  OpenSearch. Das ist kein Widerspruch, sondern dieselbe Eigenschaft mit
  anderem Ziel.
- **Domain ↔ Collection:** Die zentrale Abgrenzung *innerhalb* dieser Karte.
  Domain heißt Cluster, Nodes, eigene Dimensionierung. Collection heißt kein
  Cluster, kein Node, automatische Skalierung in OCUs. Wichtig für die
  Prüfung: **es gibt keinen automatischen Migrationsweg von Domain zu
  Collection** — man muss neu indizieren.
- **54 ↔ 49 (CloudTrail + Athena):** Dort geht es um **API-Aufrufe** und
  nachträgliche Forensik, hier um **Anwendungslogs** und akute Störungssuche.
  Verschiedene Datenquellen, verschiedene Zeithorizonte.
- **54 ↔ 69 (Kendra):** Beide durchsuchen Text. Kendra ist auf
  **natürlichsprachliche Fragen an Dokumente** ausgelegt („Wie beantrage ich
  Urlaub?"), OpenSearch auf **Suchanfragen an strukturierte und
  halbstrukturierte Daten** mit Filtern, Aggregationen und Dashboards.

## Klassiker-Fallen

1. **Kibana wird als aktueller Name verwendet.** Bei OpenSearch-Domains heißt
   das Werkzeug **OpenSearch Dashboards**. Kibana existiert in diesem Kontext
   nur noch für Domains, die auf einer Elasticsearch-Version 7.10 oder
   früher laufen. Auch Rollennamen änderten sich (`kibana_user` wurde zu
   `opensearch_dashboards_user`).
2. **Serverless wird für „Domain ohne Aufwand" gehalten.** Es ist ein anderes
   Modell mit eigenen Grenzen: nicht alle API-Operationen und nicht alle
   Plugins werden unterstützt, und es gibt keine automatische Migration von
   einer Domain — die Daten müssen neu indiziert werden. Wer Serverless als
   reine Bequemlichkeitsvariante plant, stolpert über fehlende Funktionen.
3. **CloudWatch Logs Insights wird übersehen.** Für einfache Abfragen über
   wenige Log-Gruppen reicht es oft und kostet keinen laufenden Index. Die
   Karte wählt OpenSearch, weil 60 Services, Freitextsuche und Dashboards
   zusammenkommen — nicht, weil CloudWatch grundsätzlich zu schwach wäre.
4. **Der Index wird als Speicher missverstanden.** Ein OpenSearch-Index ist
   eine Suchstruktur, kein Archiv. Die revisionssichere Langzeitablage gehört
   nach S3; der Index hält, was durchsuchbar sein muss.

## Faktencheck — Divergenzen zu älterem Kursmaterial

1. **Amazon Elasticsearch Service heißt seit dem 08.09.2021 Amazon OpenSearch
   Service.** Anlass war Elastics Lizenzwechsel: nach Elasticsearch 7.10.2
   und Kibana 7.10.2 erschienen keine neuen Versionen mehr unter der Apache
   License 2.0. OpenSearch ist der daraus entstandene Fork. Kursmaterial vor
   2022 nennt durchgängig den alten Namen.
   *Quelle: AWS Open-Source-Blog zur Umbenennung, 08.09.2021; AWS Developer
   Guide, „Amazon OpenSearch Service rename — Summary of changes".*

2. **Kibana heißt in diesem Kontext OpenSearch Dashboards.** Der Endpunkt
   änderte sich von `/_plugin/kibana` auf `/_dashboards`; OpenSearch Service
   leitet Anfragen um, aber IAM-Policies und SAML-URLs mussten angepasst
   werden. Die Standardrollen `kibana_read_only` und `kibana_user` wurden zu
   `opensearch_dashboards_read_only` und `opensearch_dashboards_user`.
   **Der Titel dieses Themas im Masterplan lautet „OpenSearch,
   Kibana-Dashboards" und ist damit selbst veraltet** — die Karte verwendet
   die aktuelle Bezeichnung.
   *Quelle: AWS Developer Guide, „Amazon OpenSearch Service rename".*

3. **Domains und Collections sind verschiedene Konzepte, nicht zwei
   Preismodelle.** Laut der AWS-Vergleichsseite hat OpenSearch Serverless
   **nicht das Konzept eines Clusters oder Nodes**. Indizes liegen in
   Domains (vorprovisionierte Cluster) oder in Collections (logische Gruppen
   von Indizes für einen Anwendungsfall). Abgerechnet wird bei Domains nach
   EC2-Instanzstunden plus EBS-Volumen, bei Serverless in **OCU-Stunden** für
   Ingestion-Compute, Search-Compute und in S3 vorgehaltenen Speicher.
   *Quelle: AWS Doku, „Comparing OpenSearch Service and OpenSearch
   Serverless".*

4. **Es gibt keinen automatischen Migrationsweg von Domain zu Collection.**
   Die Daten müssen neu indiziert werden. Ebenso werden nicht alle
   OpenSearch-API-Operationen und nicht alle Plugins von Serverless
   unterstützt.
   *Quelle: AWS Developer Guide, „Serverless overview" (Abschnitt
   Limitations).*

5. **Verschlüsselung im Ruhezustand ist bei Collections verpflichtend**, bei
   Domains optional. Ein Detail, das in Vergleichstabellen älteren Datums
   fehlt.
   *Quelle: AWS Doku, „Comparing OpenSearch Service and OpenSearch
   Serverless".*

6. **Collection Groups sind ein neueres Kostenmerkmal.** Sie organisieren
   mehrere Collections und erlauben, Rechenressourcen und OCU-Speicherraum
   **auch über unterschiedliche KMS-Schlüssel hinweg zu teilen**, statt je
   Schlüssel eigene OCUs vorzuhalten. In Kursmaterial praktisch nicht
   vorhanden.
   *Quelle: AWS Doku, „Amazon OpenSearch Serverless collection groups".*

## Nicht bestätigt

- **Die OCU-Mindestzahl.** Hier widersprechen sich die Quellen deutlich, und
  deshalb steht auf der Karte keine Zahl. Der Doku-Spiegel im
  awsdocs-Repository nennt eine Abrechnung von **mindestens 4 OCUs** je
  Collection. Eine Drittquelle nennt **2 OCUs** als Minimum für die erste
  Collection mit redundanten aktiven Replicas und **1 OCU** ohne. Ein
  AWS-Big-Data-Blogbeitrag beschreibt zusätzlich **halbe OCUs** (0,5 vCPU,
  3 GB RAM, 60 GB Speicher) als neue Untergrenze, von der aus zunächst auf
  eine volle OCU und dann in Ein-OCU-Schritten skaliert wird. Nach der in
  Batch 10 gesetzten Regel kommt bei widersprüchlichen Quellen **kein Wert
  auf die Karte**; dort steht nur „skaliert in OCUs".
- **Der Inhalt einer vollen OCU** (1 vCPU, 6 GB RAM, 120 GB Speicher) stammt
  aus dem AWS-Blog und wurde nicht gegen die Produktdokumentation geprüft.
  Nicht auf der Karte.
- **Sämtliche Preisangaben** (etwa 0,24 US-Dollar je OCU-Stunde, rund 350
  US-Dollar Monatsminimum) stammen aus Drittquellen und gehören ohnehin nicht
  auf eine Karte.
- **Die drei Collection-Typen** (Search, Time-Series, Vector) sind in
  Drittquellen und im AWS-Blog beschrieben; die Typenliste wurde nicht
  vollständig gegen die Produktdokumentation geprüft und ist für die
  Kernaussage nicht nötig. Nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Domain und Collection stehen nebeneinander, obwohl nur eines gewählt
  wird.** Die gestrichelte Zone „EINE ENTSCHEIDUNG" und das Label „indexiert
  — entweder oder" machen das kenntlich. Die Karte zeigt beide, weil die
  Abgrenzung der eigentliche Lerninhalt ist.
- **Der Pfeil zu den Dashboards geht von der Collection aus.** Er gilt für
  beide Varianten gleichermaßen; er von einer der beiden Boxen aus zu
  zeichnen war eine Layoutentscheidung, keine fachliche Aussage.
- **Der Weg über Lambda fehlt.** CloudWatch-Subscription-Filter können auch
  eine Lambda-Funktion als Ziel haben, die dann selbst nach OpenSearch
  schreibt. Firehose ist der Weg ohne Anwendungscode und passt zum Szenario.
- **Index-Lifecycle und Datenaufbewahrung sind nicht dargestellt.** In der
  Praxis entscheidet die Aufbewahrungsdauer maßgeblich über die Größe und
  damit die Kosten. Das hätte eine weitere Box gekostet.
- **Die S3-Ablage hinter dem verworfenen Athena-Pfad ist nicht gezeichnet.**
  Die Box „Athena auf S3" fasst beides zusammen, weil der Pfad ohnehin
  abgelehnt wird.

## Farbkonventionen dieser Karte

- **Teal #0F7C8C — Regel- und Konfigurationsinstanz.** Trägt Domain und
  Collection. Begründung: ein OpenSearch-Index ist eine Struktur mit
  Zugriffsrichtlinien und Konfiguration, keine reine Datenablage. **Am
  19.07.2026 im Vorfeld dieses Batches so festgelegt.**
- **Navy #232F3E — Infrastruktur-Sammelpunkt.** Trägt CloudWatch Logs. Teal
  wäre hier eine Doppelung mit OpenSearch gewesen; CloudWatch Logs tritt auf
  dieser Karte als Sammelstelle auf, nicht als Regelinstanz.
- **Orange #D97706 — Lieferschicht.** Trägt Firehose, konsistent mit Karte 52.
- **Blau #2E6BE6 — Nutzer, Clients und externe Systeme.** Trägt die
  Microservices als Quelle und die Dashboards als Nutzeroberfläche.
- **Lila #7A3FE0 — Athena.** Konsistent mit Karte 40, 49, 52 und 53. Hier
  gestrichelt, weil verworfen. **Der Boxrand trägt Lila und nicht Rot**,
  damit der Dienst identifizierbar bleibt; die Ablehnung markieren das rote X
  und der rote Pfad.
- **Rot #C7161D — ausschließlich „verworfen".** Pfad und X.
- **Grau #9A9A9A — Zonenrahmen.** Zwei Zonen: „INGESTION — ohne Code" und
  „EINE ENTSCHEIDUNG".
