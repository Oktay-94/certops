# HANDOFF-NARRATIVE-19 — Narrativ-Batch 18: **Prüf- und Kartenfix-Chat, kein Narrativ geschrieben**

> **Erstellt:** 11.08.2026 · **Spec:** NARRATIVE-SPEC **v1.1** (§4-Patch weiterhin nur in HANDOFF-05 §5.1; §6 seit 10.08. im Repo unter `docs/`) + Konventionen aus HANDOFF-02 §2 bis -18 §2
> **Ablage empfohlen:** `~/Projekte/certops/docs/narrative-handoffs/`

> ⚠️ **Dieser Chat hat den Ablauf bis „Kartenbefunde melden" durchlaufen und ist dort planmäßig gestoppt.** Es wurde **kein einziges Narrativ geschrieben**. Grund: Befund 158 hat Karte 53 blockiert, und die Auflösung hat den Batch-Zuschnitt geändert. Stattdessen sind **zwei Karten gefixt** und **ein Werkzeugfehler** gefunden worden, der R7 auf einem großen Teil des Kartensatzes unwirksam gemacht hat.

---

## 1. Stand

| | |
|---|---|
| Geschrieben | **51 von 100** (Karten 1–51) — **unverändert** |
| Dieser Batch | keine Narrative. Kartenfixe 52 und 54, QC vollständig grün |
| Kartenbefunde | **11 neue (158–168)**, davon **einer blockierend** und **einer ein Werkzeugbefund** |
| Kartenfixe | **zwei durchgeführt** (52, 54), erstmals seit Batch 13 |
| Karte 53 | 🚨 **wird IPv6** — Oktays Entscheidung vom 11.08. **bestätigt und revidiert-zurück**. Die gezeichnete Athena-Karte ist nicht Karte 53 |
| Service-Availability | keine neue Sammelseite. 30.06.2026 bleibt die aktuellste |
| Umlaut-Grep | 0 Kandidaten, **vierter Batch in Folge** |
| `check.py` | Slugs **und** Nummern 50/51 nachgetragen, Nachtrag selbst getestet |

---

## 2. Konventionen aus diesem Batch

### 2.1 🚨🚨 `zones.py` hat `<line>` nie verarbeitet — R7 war auf vielen Karten wirkungslos

`stroke_widths()` in `zones.py` kennt nur `path` und `circle`. **Jeder Pfeil, der als `<line>` gezeichnet ist, galt damit als Freizone.** Das Skript meldete dann die Pfeillinie selbst und ihre Marker als „Tinte außerhalb der geplanten Geometrie".

Messwerte auf den **unveränderten** Originalkarten:

| Karte | `<line>` | `<path>` mit stroke | Streupixel |
|---|---|---|---|
| 52 | 8 | 1 | 6041 |
| 53 | 8 | 1 | 7216 |
| 54 | 9 | **0** | 3596 |

Karte 54 hat **null** Pfeile als `<path>` — dort war R7 vollständig wirkungslos.

**Fix (im ZIP, `zones.py`):** ein `elif tag == "line"`-Block in `stroke_widths()`, der `x1/y1/x2/y2` und `marker-end` genauso behandelt wie ein Pfadsegment. Danach **0 Befunde auf allen fünf geprüften Karten** (52, 53, 54 Original plus 52, 54 Fix).

**Konsequenz für den Sammelpass:** R7 ist auf allen Karten, die Pfeile als `<line>` zeichnen, **nachzuholen**. Wann die Umstellung von `<path>` auf `<line>` passierte, ist nicht ermittelt — der Sammelpass muss `zones.py` über den gesamten Satz laufen lassen, nicht nur über die neuen Karten.

**Das schließt zugleich HANDOFF-17 §2.7.** Die dort vertagte Frage, ob der 1,2-%-Puffer gegen den neuen Renderstand nachzumessen sei, ist beantwortet: der Puffer stimmt, keine der getesteten Stellschrauben (`PAD_TEXT`, `PAD_TEXT_REL`, `PAD_SEG`, `PAD_BOX`, `MARKER_W/H`) senkte die Zahl nennenswert. Der Fehler lag in der Elementerfassung.

### 2.2 🚨 R8-Sichtprüfung funktioniert — wenn man croppt

Die Sichtprüfung ist in der Kartensitzung **fünfmal von fünfmal** gescheitert („leeres Bildobjekt"). In diesem Chat **zweimal von zweimal erfolgreich**.

**Der Unterschied: selbst rendern, dann einen Ausschnitt speichern und den ansehen.** Ein `view` auf die volle 2400×1350-PNG kommt leer zurück; ein Crop auf ~1200×750 oder eine auf 1400 px Breite herunterskalierte Vollansicht wird sauber geliefert.

```python
Image.open("render.png").crop((980,680,1560,980)).save("sicht.png")   # Detail
im.resize((1400,int(1400*im.height/im.width)), Image.LANCZOS)          # Vollansicht
```

**Ab sofort ist „nicht gesehen" keine akzeptable `status_note` mehr.** Der Weg ist bekannt.

### 2.3 Renderstand ist reproduzierbar — CairoSVG 2.9.0 trifft die gelieferten PNGs

Gegenprobe über alle drei gelieferten PNGs gegen einen eigenen Neurender:

- Versatzoptimum liegt bei **dx=0 / dy=0** (geprüft über ein 5×5-Raster von −2 bis +2 px)
- mittlere absolute Kantendifferenz **3,03 von 255 (1,2 %)**
- abweichende Pixel 3,3 %, Median der Abweichung 79 — ausschließlich Glyphenkanten

**Positionsgleich, nur Antialiasing weicht ab.** Ein Neurender einer einzelnen Karte ist damit unbedenklich. Fontconfig-Fix (`rgba=none`, `antialias=true`) war gesetzt.

### 2.4 Der Footer-Messfehler aus HANDOFF-18 §2.4 ist konstant, nicht variabel

Alle drei Karten mit getrennter `tspan`-Gewichtung nachgemessen — Werte **deckungsgleich** mit den `status_note`-Angaben (1142,7 / 1114,4 / 1269,7 px).

Die Differenz zur naiven Messung ist **exakt +13,1 px auf allen drei Karten, unabhängig vom Text.** Sie entsteht allein aus `Merksätze:` in Bold (106,1 px) gegen Normal (93,0 px). Damit ist es keine Faustregel mehr, sondern eine Konstante: **wer den Footer naiv misst, addiert 13,1 px.**

### 2.5 `qc.py` zählt Boxen anders als `r2.py` — beides korrekt

`qc.py` meldet 8 Boxen, `r2.py` 7 Boxen plus 2 Zonen. Ursache: `r2.py` filtert `height < 60` (der Footer-Balken fällt raus), `qc.py` filtert das Hintergrund-Rect. **Kein Befund, aber nicht als Widerspruch missverstehen.**

---

## 3. Slugs und Nummern

**Keine neuen.** Der Stand bleibt bei 51 belegten Nummern.

Die mitgelieferte `check.py` enthält **Batch 17 Teil 2 nachgetragen** (Slugs *und* Nummern 50 und 51, HANDOFF-18 §3). Nachtrag selbst getestet: Dummy-Dateien `card-50-narrative.md` und `card-51-narrative.md` gegen die gepatchte Fassung ergeben **je zwei Kollisionsbefunde (Nummer *und* Slug), Exit 1**.

⚠️ **Vor dem nächsten Batch prüfen, ob `./scripts/check.py` im Repo diese Fassung ist** — der Nachtrag für 49 war am 11.08. gegen einen falschen Pfad gelaufen:

```
grep -c "waf-bot-control-challenge-captcha-ostwall-sneaker-drop-scalper" ~/Projekte/certops/scripts/check.py
```

Muss `1` ergeben.

---

## 4. Kartenbefunde dieses Batches (Nr. 158–168)

### 4.1 🚨 Befund 158 — Karte 53 ist IPv6, die gezeichnete Athena-Karte braucht eine neue Nummer

HANDOFF-18 hielt an drei Stellen fest: *„Karte 53 ist IPv6, nicht Athena (Oktays Entscheidung 11.08.)"*. Geliefert wurde `battle_card_53` als **Athena · Glue Data Catalog · S3**.

Sachlage, zweistufig gegen den Masterplan geprüft:

| | |
|---|---|
| Masterplan-Zeile 40 | IPv6, Egress-only Internet Gateway |
| **Karte 40 (gebaut)** | `athena-glue-s3-data-lake-falkendorf-telematik-speicherlayout` |
| Masterplan-Zeile 53 | Athena, Glue, S3 — Ad-hoc-SQL, pro Abfrage zahlen |
| **Karte 53 (gezeichnet)** | Athena, Glue, S3 |

Athena/Glue/S3 wurde von Masterplan-Position 53 auf **Karte 40 vorgezogen**, IPv6 fiel aus dem Satz. Die gezeichnete Karte 53 dubliert damit Karte 40.

**Punkt (j) aus HANDOFF-17/-18 ist gegengelesen und bestätigt das.** `card-40-narrative.md` (2.420 Wörter, `badgeCount: 6`) trägt bereits:

- Athena serverless, kein Cluster
- Abrechnung je gescanntem TB
- Parquet (8 Nennungen)
- **Partition Projection samt `GetPartitions` und `MSCK`** — inklusive der Feinheit „schlechter bei vielen leeren Partitionen" und „wirkt nur bei Abfrage über Athena"
- Hive-Layout unter „Syntax lesen"
- **Athena gegen Redshift Spectrum als Tabelle**

Nicht enthalten: **Query Result Reuse (0×), Engine Version 3 (0×)**.

Karte 49 trägt laut Slug zusätzlich `athena-partition-projection`. Partition Projection wäre auf Karte 53 also das **dritte** Mal erschienen.

**Entscheidung Oktay 11.08.: Karte 53 wird IPv6. Die Athena-Karte wird neu nummeriert.**

**Offen und vor dem nächsten Kartenbatch zu klären:**

1. **Welche Nummer bekommt die gezeichnete Athena-Karte?** Der Masterplan-Block 51–60 ist voll belegt. Möglich: sie entfällt ganz (Karte 40 deckt sie ab, Result Reuse wandert als Ergänzung in Narrativ 40), oder sie besetzt einen Slot, dessen Thema seinerseits verdrängt wurde.
2. **Die IPv6-Karte 53 existiert noch nicht.** Sie ist in einem Kartenbatch zu zeichnen, bevor Narrativ 53 möglich ist.
3. **`battle_card_52.md` und `battle_card_54.md` verweisen beide auf „53 = Athena"** (Abgrenzungen „52 ↔ 53" und „54 ↔ 53"). Beide Abschnitte sind zu überarbeiten, sobald Nummer 53 IPv6 trägt.
4. **Repo-Status prüfen:** liegt unter `public/scenarios/card-53/` bereits die Athena-Karte? Wenn ja, ist sie zu entfernen oder umzuhängen, bevor `SCENARIO_COUNT` wieder stimmt.

### 4.2 Befund 159 — Karte 53: die Zahl 40.000 widerspricht dem eigenen Partitionsschema

`jahr=/monat=/tag=` über vier Jahre ergibt **1.461** Leaf-Partitionen, nicht über 40.000. Faktor 27 daneben. Die Zahl steht an drei Stellen: Untertitel, Glue-Boxzeile „GetPartitions bei 40.000", und implizit in der S3-Boxzeile.

Die `.md` deckt das unter „Bewusste Vereinfachungen" mit *„gesetzt, nicht gemessen"* ab. Das trägt nicht — es entschuldigt keine Arithmetik, die dem Schema **auf derselben Karte** widerspricht.

Gemessene Fixvarianten (S3-Box b=290 → Innenlimit 254 px, Glue-Box b=320 → 284 px, alle `font-size` 16):

| Variante | Textänderung | Breite / Limit | Ergibt |
|---|---|---|---|
| V1 | `jahr=/monat=/tag=/sparte=` | 229,7 / 254 px | 4 J × 365 × 27 = **39.420** |
| V2 | `jahr=/monat=/tag=/stunde=` | 233,6 / 254 px | 4 J × 365 × 24 = **35.040** |
| V3 | Zahl auf 1.460 senken | 184,1 / 284 px | didaktisch schwach — 1.460 macht `GetPartitions` kaum zum Engpass |

**Oktay-Entscheidung 11.08.: vertagt in den Sammelpass.** Hängt ohnehin an Befund 158 — solange die Nummer der Karte offen ist, wird die Geometrie nicht angefasst.

### 4.3 ✅ Befund 160 — Karte 52: Pfeil 3 kehrte die Abhängigkeit um · **GEFIXT**

Die Karte zeigte `S3 --(3, "Schema")--> Glue`. Firehose kann Parquet aber nicht schreiben, bevor die Glue-Tabelle existiert:

- `DataFormatConversionConfiguration`: *„SchemaConfiguration — Specifies the AWS Glue Data Catalog table that contains the column information. This parameter is **required** if Enabled is set to true."*
- Developer Guide, Record Format Conversion: *„A schema to determine how to interpret that data — Use AWS Glue to create a schema in the AWS Glue Data Catalog. Firehose then references that schema."*

Badge 3 **nach** Badge 2 implizierte die umgekehrte Reihenfolge. Die `.md`-Begründung („Glue Crawler nicht gezeichnet") trägt nicht: ein Crawler kann das Schema nicht liefern, das vor dem ersten Schreibvorgang schon dastehen muss — Henne-Ei.

**Fix (durchgeführt):**

- Pfeil `S3 → Glue` samt Badge 3 und Label „Schema" **entfernt**
- Neu: `<path d="M820,620 L775,620 L775,490 L726,490" fill="none" stroke="#D97706" stroke-width="3" marker-end="url(#arrO)"/>`
- Badge **2** bei `(775,560)`, `r=15`, Ziffer bei `y=566`
- Label `Schema vorab`, `font-size 15`, `fill #8A4B04`, `x=795 y=522`, anchor `start` (108,0 px)
- Alter Badge 2 (Firehose → S3) wird **3**
- `badgeCount` bleibt **5**

Neue Reihenfolge: 1 Logs rein → 2 Schema vorab → 3 Parquet raus → 4 Metadaten → 5 SQL.

**Nebeneffekt, der die Karte besser macht:** von Glue gehen jetzt zwei Pfeile weg und keiner hinein — genau die Register-Rolle, die die `.md` behauptet („kein Speicher, sondern ein Register").

### 4.4 ✅ Befund 161 — Karte 52: Merksatz widersprach der eigenen Boxzeile · **GEFIXT**

Footer sagte „Firehose liefert, **Streams puffern**", die Firehose-Box sagt „**Puffer:** Größe ODER Zeit". Gleiche Klasse wie Befund 153 (Karte 51). Die tragende Achse ist nicht das Puffern, sondern **ob gelesen werden kann**.

**Fix:** „Firehose liefert **ab**, Streams **halten vor**". Footer 1142,7 → **1194,8 px** (Grenze ~1400).

Verworfene Varianten: „Firehose schiebt, Streams lassen holen" (1199,8), „Firehose liefert ohne Konsument, Streams brauchen einen" (1363,3), „Firehose puffert und liefert ab, Streams halten zum Abholen vor" (1412,0 — zu breit).

### 4.5 ✅ Befund 162 — Karte 54: „keine Migration, nur Reindex" ist ein Quellenkonflikt · **GEFIXT**

Zwei Seiten **desselben** Developer Guide widersprechen sich:

- *Serverless overview*, Limitations: *„There's currently no way to automatically migrate your data from a managed OpenSearch Service domain to a serverless collection. You must reindex your data."*
- *Migrating data between domains and collections using Amazon OpenSearch Ingestion*: OSI-Pipeline mit Domain als Source und Collection als Sink — *„This effectively migrates your data from one domain or collection to the other."* Einschränkung: **nur VPC-Collections**, öffentliche werden nicht unterstützt.

Nach der Batch-10-Regel gehört bei Konflikt zweier AWS-Quellen die Absolutaussage **nicht auf die Karte**. Ganzheitsfrage (c) hat das gefangen: OpenSearch Ingestion ist jünger als der Limitations-Absatz.

**Fix:** „Serverless: **Wechsel nur per Reindex**". Footer 1269,7 → **1237,2 px**.

**Fürs Narrativ 54:** der Konflikt ist zu benennen, nicht zu glätten — inklusive der VPC-Einschränkung von OSI.

### 4.6 Befund 163 — `battle_card_54.md`: Behauptung über den Masterplan ist falsch

Faktencheck-Punkt 2 sagt, die Masterplan-Zeile laute *„OpenSearch, Kibana-Dashboards"*. Masterplan-Zeile 145 lautet tatsächlich **„OpenSearch, OpenSearch Dashboards"**, und Zeile 157 trägt einen eigenen Korrekturblock dazu.

**Der Masterplan ist an dieser Stelle korrigiert — veraltet ist die NARRATIVE-SPEC §5.4**, die „Thema 54 Kibana" und „Thema 59 Kinesis Data Analytics" noch als Beispiele für Masterplan-Fehler führt. Beide sind im Masterplan längst behoben.

Kein Kartenfehler. `.md`-Korrektur plus Spec-Nachtrag.

### 4.7 Befund 164 — `battle_card_52.md`: „~5 Sekunden" steht zu Unrecht unter „Nicht bestätigt"

Die `.md` führt die Angabe als Drittquelle. Sie steht in einer **AWS-Primärquelle**: What's New, 26.12.2023 — *„most streams with no additional processing are delivered within five seconds."*

Zusätzlich benutzt die `.md` die Zahl in **Klassiker-Falle 2**, während sie sie im selben Dokument als unbelegt führt. Selbstwiderspruch.

**Fix für die `.md`:** Eintrag aus „Nicht bestätigt" in den Faktencheck verschieben, Quelle `https://aws.amazon.com/about-aws/whats-new/2023/12/amazon-kinesis-data-firehose-zero-buffering`.

Die Belegkette hat hier funktioniert — **„Nicht bestätigt"-Einträge gegenzuprüfen lohnt sich**, und zwar in beide Richtungen.

### 4.8 Befund 165 — `battle_card_53.md`: Result-Reuse-Ausschlussliste unvollständig

Die Doku führt inzwischen zusätzlich *„Managed query results is not supported"*. Fehlt in der Aufzählung. Kein Kartenfehler.

### 4.9 Befund 166 — Narrativpflicht, kein Kartenfehler: Format Conversion schließt OpenSearch aus

Developer Guide, Record Format Conversion: *„If you enable record format conversion, you can't set your destination to be Amazon OpenSearch Service, Amazon Redshift, or Splunk. With format conversion enabled, Amazon S3 is the only destination."*

Karte 52 (Parquet-Konversion) und Karte 54 (Ziel OpenSearch) sind deshalb **nicht dieselbe Firehose-Konfiguration**. `battle_card_54.md` verweist mit „liefert ohne Code (siehe Karte 52)" pauschal auf 52. **In Narrativ 54 sauber zu trennen** — es ist dieselbe Eigenschaft „ohne Anwendungscode", aber nicht dieselbe Einstellung.

### 4.10 🚨 Befund 167 — Werkzeugbefund `zones.py`

Siehe §2.1. **Der schwerwiegendste Fund dieses Batches**, weil er nicht eine Karte betrifft, sondern die Prüfung eines großen Teils des Satzes.

### 4.11 Befund 168 — `battle_card_53.md`: Abgrenzung verweist auf die falsche Karte

Die `.md` grenzt gegen „**26** (Redshift Spectrum)" ab. **Karte 26 ist Neptune** (`neptune-analytics-falkenbank-betrugsring-traversal`, Batch 09).

**Narrativ 40 hat denselben Fehler bereits dokumentiert** und den Fix formuliert: nicht die Nummer korrigieren, sondern *„den Verweis streichen und die Abgrenzung stehen lassen — sie trägt sich selbst"*. Begründung dort: Redshift Spectrum hat überhaupt keine eigene Karte, der Masterplan führt unter 60 Redshift **Serverless**.

⚠️ **Derselbe Fehlertyp ist in `battle_card_40.md` noch offen.** Beim Sammelpass beide zusammen erledigen.

---

## 5. Was geprüft wurde und grün ist

| Prüfung | K52 Original | K53 Original | K54 Original | K52 Fix | K54 Fix |
|---|---|---|---|---|---|
| `qc.py` | 0 | 0 | 0 | **0** | **0** |
| `collide.py` | 0 | 0 | 0 | **0** | **0** |
| `r2.py` | 0 | 0 | 0 | **0** | **0** |
| `zones.py` (gefixt) | 0 | 0 | 0 | **0** | **0** |
| `r16.py` | — | — | — | **15,7 px** | **28,0 px** |
| R12 | 0 | 0 | 0 | **0** | **0** |
| R13 reines Schwarz | 0 px | 0 px | 0 px | **0 px** | **0 px** |
| R8 Sichtprüfung | — | — | — | **durchgeführt** | **durchgeführt** |
| Footer / Grenze ~1400 | 1142,7 | 1114,4 | 1269,7 | **1194,8** | **1237,2** |

**R19 relativ** (Kriterium aus HANDOFF-18 §2.3: Befund, wenn ein Label näher an einem fremden Badge liegt als am eigenen): Label „Schema vorab" → Badge 2 mit **83,2 px** am nächsten, nächstes fremdes Badge 3 mit **184,7 px**. Kein Befund.

**Umlaut-Grep, zweistufig:** 0 Kandidaten auf allen drei Karten, Stufe 2 entfällt. **Vierter Batch in Folge leer — die Regel bleibt trotzdem.**

**Masterplan, zweistufig:** Zeilen 143 (52) und 145 (54) decken sich mit den Karten, inklusive des Korrekturblocks in Zeile 152–162. Zeile 53 ist Befund 158.

**Service-Availability:** gesucht, **nicht** die im Handoff notierte URL gefetcht. Aktuellste Sammelseite bleibt **30.06.2026**; der AWS Weekly Roundup vom 06.07.2026 bezeichnet sie als die zuletzt aktualisierten Lifecycle-Änderungen. Nichts Neues seit Batch 18, nächste um **Ende September 2026** fällig. Keine der drei Karten betroffen (Firehose, Athena, Glue, OpenSearch stehen auf keiner Liste).

---

## 6. Faktencheck — was verifiziert wurde

Alle Belegketten geöffnet, nicht aus dem Handoff übernommen.

**Karte 52:**
- Zero Buffering nicht verfügbar mit Dynamic Partitioning ✅ — `firehose/latest/dev/buffering.html`
- Ende-zu-Ende-Verzögerung bis 1,5-faches der Pufferzeit durch mehrstufiges Puffern ✅ — dieselbe Seite
- „~5 Sekunden" bei Zero Buffering ✅ **AWS-primärbelegt** (What's New 26.12.2023) → Befund 164
- Format Conversion braucht Glue-Tabelle ✅ — `DataFormatConversionConfiguration`, `SchemaConfiguration` required → Befund 160
- Format Conversion schließt OpenSearch/Redshift/Splunk als Ziel aus ✅ → Befund 166

**Karte 53:**
- Partition Projection vermeidet `GetPartitions` ✅ — `athena/latest/ug/partition-projection.html`
- Projection lässt Athena Katalog-Partitionen ignorieren ✅ — dieselbe Seite, „Important"-Kasten
- Result Reuse braucht Engine v3, opt-in pro Abfrage, Default aus ✅ — `reusing-query-results.html`
- `MaxAgeInMinutes` 0–10080, Default 60 ✅ — API-Referenz `ResultReuseByAgeConfiguration`
- Ausschlussliste ✅, aber unvollständig → Befund 165

**Karte 54:**
- Rename 08.09.2021 ✅ — `opensearch-service/latest/developerguide/rename.html`
- `/_plugin/kibana` → `/_dashboards`, `kibana_user` → `opensearch_dashboards_user` ✅ — dieselbe Seite
- Serverless kennt kein Cluster/Node-Konzept, Domains gegen Collections, OCU-Abrechnung ✅ — `serverless-comparison.html`
- Encryption at rest bei Collections Pflicht, bei Domains optional ✅ — `serverless-security.html`
- Collection Groups teilen Compute über verschiedene KMS-Schlüssel ✅ — `serverless-collection-groups.html`
- „keine automatische Migration" ⚠️ **Quellenkonflikt** → Befund 162

---

## 7. Zu prüfen vor dem nächsten Batch

**Vorrangig — hängt an Befund 158:**

- **Nummer für die gezeichnete Athena-Karte festlegen** (oder sie fallenlassen und Result Reuse in Narrativ 40 nachtragen)
- **IPv6-Karte 53 zeichnen** — Kartenbatch, nicht Narrativbatch
- **Repo-Status `public/scenarios/card-53/` klären**
- **`battle_card_52.md` und `battle_card_54.md`**: Abgrenzungen „↔ 53" überarbeiten

**Werkzeug:**

- 🚨 **`zones.py` über den gesamten Kartensatz laufen lassen** (Befund 167). R7 war auf allen `<line>`-Karten wirkungslos
- **`zones.py` und `r16.py` ins Repo** — sie lagen dort nie. Am 11.08. per `cp` nach `scripts/` gebracht, Herkunft `~/Downloads/certops-battlecards-91-95/`
- **`check.py`-Fassung im Repo verifizieren** (§3)

**`.md`-Korrekturen, gebündelt für den Sammelpass:**

- `battle_card_52.md`: Befund 164 (Zero Buffering aus „Nicht bestätigt" heraus), Befund 160 (Vereinfachungs-Absatz zum Glue Crawler streichen — er begründet einen Fehler), `status_note` neu
- `battle_card_53.md`: Befund 159 (die 40.000), Befund 165, Befund 168 (Verweis auf Karte 26)
- `battle_card_54.md`: Befund 162 (Quellenkonflikt), Befund 163 (Masterplan-Behauptung)
- `battle_card_40.md`: Befund 168 in seiner ursprünglichen Form
- `battle_card_50.md`: Befund 154 plus R8 plus Fixe 142/143
- `battle_card_51.md`: Befund 156
- **NARRATIVE-SPEC §5.4**: Beispiele „Thema 54 Kibana" und „Thema 59 Kinesis Data Analytics" sind veraltet, beide im Masterplan behoben

**Unverändert offen aus früheren Batches:**

- (a) S3 30-Tage-Transitionsregel, Karte 11 — **neunter Batch ohne Prüfung.** Entweder terminieren oder schließen
- (b) 50-Listener-Grenze bei PrivateLink-NLBs — unbelegt
- (c) Regionsumfang Cross-Region PrivateLink
- (d) „Provisioned"-Modus des Regional NAT Gateway
- (e) Sekundärregionen-Limit Aurora Global Database: 10 gegen 5
- (g) Gegenprobe R2-Fehlalarm Karte 41: `python3 r2.py 41`
- (h) KMS-FAQ 10 gegen CLI-Referenz 25
- (i) Macie „bis zu zehn Beispiele" — unbelegt
- (l) Masterplan-Zeile 66 (Forecast) und 75 (VMware Cloud on AWS) — erst die Karten lesen, dann bewerten
- (m) Karte 68 (Bedrock Knowledge Bases) — zweiter Blick, weil Kendra dorthin zeigt
- Befund 151 (Karte 69, Kendra als ganzer Dienst in Maintenance) — grundsätzlich klären, ob die Karte bleibt
- Befund 152 (Karte 76, Mainframe Modernization Self-Managed)
- **Befund 157** (Code-Blöcke rendern zeilenweise) — Gegenprobe muss lokal im Browser laufen, ist in diesem Chat **nicht** erfolgt
- **Vertagt:** 99 (38), 102 (39), 114 (41), 118 (43), 121 (44), 129 (46), 133 (48), 146 (49), 147 (51), **159 (53)**
- **Renderfehler Karte 41:** zwei Textkollisionen (Befund 112), Fix gemessen und verifiziert — `CreateSession` y=395 → y=428, `Key gelöscht` x=630 → x=415. **Kartenkette, vorrangig**
- **Laufender Fix:** Umlaut-Defekt Karten 6–10, 27, 30
- **Farb-Debt:** Teal als „Regel-/Konfigurationsinstanz" jetzt **achtzehnmal** (34–50, 54). Festschreibungsvorschlag aus Karte 38 überreif. Rot-Pink `#B0084D` doppelt belegt (relationale Engine gegen SCP)

**Branchen — gemieden:** Einzelhandel/Mode (50, 51), Versicherung (44, 47, **53**), Finanz/Zahlung (39, 45, 46, **54**), Logistik/Spedition (31, 32, 41, **52**), Pharma/Klinik (38, 43), Maschinenbau (48), Energie (49).

---

## 8. Paste-Block für den Folgechat

```
Narrativ-Batch 19. Lies NARRATIVE-SPEC.md und
narrative-reference-scheduler.md aus dem Project Knowledge, bevor du schreibst.

STAND
Spec:            NARRATIVE-SPEC.md v1.1 (§4-Patch nur in HANDOFF-05 §5.1) +
                 Konventionen aus HANDOFF-02 §2 bis -19 §2
                 §5.4 der Spec ist VERALTET (Befund 163)
Referenz:        narrative-reference-scheduler.md
Geschrieben:     51 von 100 (Karten 1-51). Batch 18 hat KEIN Narrativ
                 geschrieben - es war ein Prüf- und Kartenfix-Chat
Dieser Chat:     Karten 52 und 54. KARTE 53 IST IPv6 UND NOCH NICHT
                 GEZEICHNET (Befund 158, bestätigt 11.08. nach Gegenlesen
                 von card-40-narrative.md). Dritte Karte vor Beginn mit
                 Oktay festlegen
Karte 52/54:     GEFIXT am 11.08. - neue SVG/PNG/PDF im Repo. Der Schema-
                 Pfeil auf 52 geht jetzt von Glue nach Firehose, Badge 2.
                 Alte .md-Absätze zu Pfeil 3 sind falsch (HANDOFF-19 §4.3)
Ablage:          public/scenarios/card-NN/narrative.md
Frontmatter:     correctAnswer ausgelassen; sources MUSS YAML-Blockliste sein
Code-Blöcke:     KEINE Zeile darf mit "# " beginnen (Guard-Test 5)
H2-Namen:        nur die neun kanonischen aus Spec §3, Suffixe nach " — " ok
Länge:           2.200-2.500 Wörter, Guard-Test 9. Intern 2.250 bis 2.450
H3-PLANUNG:      Lückenlos ein H3 je Kartenelement. Faustwert sagt die
                 RICHTUNG NICHT vorher. Erstdurchgang MESSEN, dann kürzen
                 oder ergänzen. Ergänzt wird an optionalen H2
Kollisionscheck: collide.py, r2.py, qc.py im ZIP
zones.py:        GEFIXT (Befund 167) - verarbeitet jetzt <line>. Die alte
                 Fassung hat ALLE line-Pfeile als Freizone behandelt.
                 R7 ist auf dem Gesamtsatz nachzuholen
r16.py:          im ZIP, braucht qc.py im selben Verzeichnis
R8 SICHTPRÜFUNG: FUNKTIONIERT - selbst rendern, dann CROPPEN (~1200x750)
                 oder auf 1400 px Breite skalieren. Ein view auf die volle
                 2400x1350-PNG kommt leer zurück (HANDOFF-19 §2.2).
                 "Nicht gesehen" ist keine akzeptable status_note mehr
Footer messen:   Bold-tspan "Merksätze:" getrennt messen. Die Differenz zur
                 naiven Messung ist KONSTANT +13,1 px, textunabhängig
Renderstand:     CairoSVG 2.9.0 trifft die gelieferten PNGs positionsgleich
                 (dx=0/dy=0, 1,2 % Kantendifferenz). Neurender unbedenklich.
                 Fontconfig-Fix setzen (rgba=none, antialias=true)
Umlaut-Grep:     läuft in JEDEM Batch, ZWEISTUFIG. Vier Batches in Folge
                 0 Kandidaten - das hebt die Regel nicht auf
GANZHEITSDURCH-
GANG:            DREI Fragen. (a) Widerspricht sich die Karte selbst?
                 (b) Welche Default-Einstellung muss wahr sein?
                 (c) Hängt eine Kartenaussage an einer FUNKTION, die jünger
                 ist als das übrige Kartenmaterial?
                 Frage (a) hat in Batch 18 ZWEI Befunde gefunden (159, 161),
                 Frage (c) einen (162). Alle drei waren nicht anders sichtbar
ZAHLEN:          Bei jeder Zahl klären, ob DEFAULT, LIMIT oder OPTION.
                 Zusätzlich: RECHNET DIE ZAHL AUF? Befund 159 war reine
                 Arithmetik gegen das eigene Schema
Belegketten:     Jede .md-Aussage gegen die genannte Seite öffnen. Auch
                 Aussagen unter "NICHT BESTÄTIGT" - Befund 164 war dort zu
                 Unrecht abgelegt, die AWS-Primärquelle existiert
SERVICE-
AVAILABILITY:    Erst SUCHEN, welche Sammelankündigung die aktuellste ist.
                 Zuletzt abgearbeitet: 30.06.2026. Nächste um Ende
                 September 2026 fällig. Gegen den GESAMTEN Masterplan greppen
check.py:        Slugs UND Nummern nachtragen, beides, immer. Für Batch 19
                 gibt es NICHTS nachzutragen - Batch 18 hat nichts
                 geschrieben. ZUERST prüfen, ob ./scripts/check.py die
                 Nummern 49, 50, 51 kennt.
                 BATCH-Guard, kein Repo-Guard - immer nur die neuen Dateien
Ordnernamen:     card-01 bis card-09 sind ZWEISTELLIG. printf "card-%02d"
Prüfungsknack-
punkte:          Abgrenzungen statt Distraktoren, "Warum X hier verliert:"
Kartenfehler:    im Narrativ explizit benennen, mit GEMESSENEM Fixvorschlag
Masterplan:      ZWEISTUFIG. Erst die Zeile gleicher Nummer, dann das
                 Kartenthema über den GESAMTEN Masterplan greppen
Offene Karten-
befunde:         168 Stück, vollständig in HANDOFF-02 §4 bis -19 §4
Vertagt:         99 (38), 102 (39), 114 (41), 118 (43), 121 (44), 129 (46),
                 133 (48), 146 (49), 147 (51), 159 (53)
Nachprüfen:      (a) S3 30-Tage-Transitionsregel, Karte 11 - NEUNTER Batch
                     ohne Prüfung, entweder terminieren oder schliessen
                 (b) 50-Listener-Grenze bei PrivateLink-NLBs
                 (c) Regionsumfang Cross-Region PrivateLink
                 (d) "Provisioned"-Modus des Regional NAT Gateway
                 (e) Sekundärregionen-Limit Aurora Global Database: 10 vs 5
                 (g) Gegenprobe R2-Fehlalarm Karte 41
                 (h) KMS-FAQ 10 gegen CLI-Referenz 25
                 (i) Macie "bis zu zehn Beispiele"
                 (l) Masterplan-Zeile 66 (Forecast) und 75 (VMware Cloud)
                 (m) Karte 68 (Bedrock Knowledge Bases)
                 (n) NEU: Befund 157, Code-Blöcke rendern zeilenweise -
                     lokal im Browser gegenprüfen, cron-Aufriss in der
                     Referenz gegen SQL-Block in Narrativ 49
Branchen:        gemieden: Einzelhandel/Mode (50,51), Versicherung (44,47,53),
                 Finanz/Zahlung (39,45,46,54), Logistik (31,32,41,52),
                 Pharma/Klinik (38,43), Maschinenbau (48), Energie (49)

ABLAUF
Karten lesen → bestehende .md lesen → H3-LISTE AUFSTELLEN → qc/collide/r2/
zones/r16 → Umlaut-Grep zweistufig → Masterplan zweistufig →
Service-Availability SUCHEN und greppen → Faktencheck → GANZHEITSDURCHGANG
mit DREI Fragen → etwaige neue Kartenbefunde melden BEVOR Text entsteht →
schreiben → Erstdurchgang MESSEN → kürzen oder ergänzen → check.py →
ZIP + HANDOFF-NARRATIVE-20.md + Sammelbefehle.

Kein Repo-Schreiben, kein SCENARIO_COUNT, keine Commits.
```
