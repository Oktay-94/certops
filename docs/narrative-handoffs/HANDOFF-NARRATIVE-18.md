# HANDOFF-NARRATIVE-18 — Narrativ-Batch 17, **Teil 2 von 2** (Karten 50, 51)

> **Erstellt:** 11.08.2026 · **Spec:** NARRATIVE-SPEC **v1.1** (§4-Patch in HANDOFF-05 §5.1, weiterhin nicht im Project-Knowledge-Text; §6 seit 10.08. im Repo unter `docs/`) + Konventionen aus HANDOFF-02 §2 bis -17 §2
> **Ablage empfohlen:** `~/Projekte/certops/docs/narrative-handoffs/`

> ✅ **Batch 17 ist abgeschlossen.** Karten 49, 50 und 51 sind geschrieben und guard-grün. Der Faktencheck aus HANDOFF-17 §4.2/§4.3 wurde nicht wiederholt, die drei offenen Punkte (i) bis (iii) sind geschlossen.

---

## 1. Stand

| | |
|---|---|
| Geschrieben | **51 von 100** (Karten 1–51) |
| Dieser Batch, Teil 2 | Karten 50 (WAF Bot Control) und 51 (Kinesis vs. SQS) |
| Guard-Tests §7 | **0 Befunde** |
| Wortzahl | 50: 2.316 · 51: 2.272 |
| Repo-Integration | Narrative 1–49 sind live; 50 und 51 nachzuziehen |
| Kartenbefunde | 6 neue (151–156), davon **zwei Vorwarnungen**, **keiner schwer** |
| Kartenfixe | **keine** — Oktay hat alle drei Entscheidungen auf „nur ins Narrativ" gesetzt |
| Punkte (i)–(iii) | alle drei geschlossen, (ii) mit offengelegter Grenze |
| Service-Availability | 🚨 **Neue Sammelseite vom 30.06.2026** gefunden, gegen den gesamten Masterplan gegriffen |

---

## 2. Konventionen aus diesem Batch

### 2.1 🚨🚨 Der Faustwert überschätzt auch mit vollständiger H3-Planung — Gegenbefund zu HANDOFF-17 §2.1

HANDOFF-17 §2.1 hielt fest, der Faustwert `Kästen × 175 + Badges × 120 + 900` treffe „auf rund 10 % genau", sobald jedes Kartenelement ein H3 bekommt, und der Text müsse dann **gekürzt** werden. Karte 50 widerlegt das deutlich:

| | Karte 46 | Karte 49 | **Karte 50** |
|---|---|---|---|
| H3 geplant | 9 (+1 nachgereicht) | 12 | **14** |
| Prognose | 2.725 | 2.725 | **3.020** |
| Erstdurchgang | 2.169 | 2.456 | **1.837** |
| Abweichung | −556 | −269 | **−1.183** |

Die Planung war diesmal maximal — vierzehn H3 für acht Kästen, sechs Pfeile, Randnotiz und verworfenen Weg, also lückenlos ein H3 je Element. Trotzdem lag der Erstdurchgang 39 % unter der Prognose und **unter** der Pflichtmarke. Der Text musste um rund 480 Wörter **ergänzt** werden.

Damit ist klar: Die Formel misst nicht die H3-Zahl. Sie misst, wie viel je H3 zu sagen ist, und das schwankt stark mit dem Thema. Karte 49 (CloudTrail-Forensik) trug pro Element mehr als Karte 50, weil dort jeder Kasten eine eigene Mechanik hatte; auf Karte 50 sind fünf der acht Kästen Teal-Regelinstanzen mit je zwei Sätzen Inhalt.

> **Konvention: Die H3-Planung nach HANDOFF-17 §2.1 bleibt Pflicht — sie sichert die Vollständigkeit. Aber die Prognose sagt die Richtung des Nachbearbeitens NICHT vorher. Nach dem Erstdurchgang wird gemessen, und erst die Messung entscheidet, ob gekürzt oder ergänzt wird. Wer der Prognose vertraut und auf Kürzen einstellt, schreibt zu knapp.**

Ergänzt wurde in dieser Reihenfolge, jeweils ohne Redundanz: der optionale Abschnitt `Syntax lesen` (rund 200 Wörter), dann drei H3 um je ein Bild oder eine Konsequenz, zuletzt ein fünfter Punkt in `Die ehrliche Feinheit`. Ergänzen an optionalen Abschnitten ist besser als Strecken an bestehenden — es erzeugt neuen Inhalt statt Wiederholung.

### 2.2 🚨 Die Service-Availability-Seite muss gesucht werden, nicht aus dem Handoff gefetcht

HANDOFF-17 §2.3 notierte die URL vom 31.03.2026 als „zuletzt geprüft". Diese Seite war zum Zeitpunkt dieses Batches **überholt**: Es gibt eine Sammelankündigung vom **30.06.2026** mit rund zwanzig weiteren Diensten und Features.

Wäre die notierte URL gefetcht worden, wären die Befunde 151 und 152 nicht aufgefallen. Die Seiten haben ein Datum im Pfad (`/2026/03/`, `/2026/06/`) und ersetzen einander nicht — es sind eigenständige Ankündigungen.

> **Konvention: Der Service-Availability-Grep beginnt mit einer Suche nach der aktuellsten Sammelankündigung, nicht mit der im Vorhandoff notierten URL. Die notierte URL dient nur dazu, den bereits abgearbeiteten Stand zu kennen. Ein Zyklus von rund drei Monaten ist zu erwarten — die nächste Seite ist um Ende September 2026 fällig.**

### 2.3 ⚠️ R19 braucht ein relatives Kriterium, kein absolutes

Der Vorschlag aus HANDOFF-17 §2.5 (Schwellwert 120 px zwischen Pfeil-Label und Badge) wurde auf beiden Karten testweise gerechnet. Ergebnis:

| Label | Karte | Abstand zum eigenen Badge | zum nächsten fremden |
|---|---|---|---|
| `Falle` | 50 | **170,1** | **145,1** (Badge 2, teal) |
| `alle Kunden` | 50 | 194,3 | 218 |
| alle Pfeil-Labels | 51 | ≤ 87,1 | — |

Der absolute Schwellwert von 120 px meldet auf Karte 50 zusätzlich **drei Randnotizzeilen und `verworfen`** — Texte, die zu gar keinem Badge gehören und deshalb Fehlalarme sind.

`Falle` ist dagegen ein echter Fall, und zwar derselbe wie Beobachtung A auf Karte 49: Das Label steht **näher am fremden Badge als am eigenen**, und direkt darüber steht `Rest` in Teal, das zu einem dritten Pfeil gehört. Die Zuordnung hängt allein an der Farbe.

> **Vorschlag R19, geschärft: Ein Pfeil-Label ist ein Befund, wenn es näher an einem fremden Badge liegt als an seinem eigenen. Das trifft den tatsächlichen Lesefehler, ist skalenunabhängig und produziert keine Fehlalarme bei freien Randnotizen. Karte 51 zeigt mit ≤ 87 px, dass der saubere Zustand erreichbar ist.**

**Oktays Entscheidung 11.08.: nur dokumentieren.** Keine Kalibrierung an 1–48 in diesem Batch.

### 2.4 🚨 Der Footer muss mit `tspan`-Gewichtung gemessen werden

Die erste Messung ergab für beide Karten exakt **13,1 px weniger** als die jeweilige `status_note`. Ursache: `Merksätze:` steht als `<tspan font-weight="bold">` im Footer-Element. Wer den gesamten Footer mit einem einzigen Font misst, bekommt reproduzierbar zu wenig — und zwar auf jeder Karte gleich viel, was den Fehler wie eine systematische Renderdivergenz aussehen lässt.

Mit korrekter Gewichtung stimmen beide Werte **auf die Nachkommastelle** mit der `status_note` überein (1268,0 und 1354,1). Die Renderdivergenz aus HANDOFF-17 §2.7 betrifft die Rasterung, nicht die PIL-Messung.

> **Konvention: Footer-Nachmessungen trennen den Bold-`tspan` vom Rest und addieren beide Teilbreiten. Eine Abweichung, die auf mehreren Karten identisch ist, ist ein Messfehler und keine Eigenschaft der Karten.**

### 2.5 Der Umlaut-Grep war zum dritten Mal in Folge leer

0 Großumlaut-Kandidaten auf beiden Karten, Stufe 2 entfiel. Regel aus HANDOFF-15 §2.3 unverändert.

### 2.6 `collide.py` und `r2.py` bestätigen die Kartenfixe aus Teil 1

Beide Skripte melden auf beiden Karten 0 Befunde. Textelemente: **52** (Karte 50) und **36** (Karte 51). Badge 6 auf Karte 51 sitzt bei (1150, 140), sein Label 22,0 px daneben — die musterhafte Umsetzung des Fixes zu Befund 141.

---

## 3. Slugs und Nummern nach diesem Batch (51 Stück)

| Nr | Slug |
|---|---|
| 50 | `waf-bot-control-challenge-captcha-ostwall-sneaker-drop-scalper` |
| 51 | `kinesis-data-streams-sqs-replay-kirnau-clickstream-drei-konsumenten` |

**Die mitgelieferte `check.py` enthält bereits Batch 17 Teil 1 (Slug *und* Nummer 49).** Der Nachtrag wurde selbst getestet: eine Dummy-`card-49-narrative.md` gegen die gepatchte Fassung ergab die zwei geforderten Kollisionsbefunde (Nummer *und* Slug), Exit 1. Für Batch 18 sind zusätzlich die beiden Zeilen oben plus `50: "Batch 17", 51: "Batch 17"` nachzutragen.

**Firmennamen — zwei neu, kollisionsfrei:** „Ostwall" (50, Sneaker-Händler) und „Kirnau" (51, Online-Modehändler). Präfixe `Ost-` und `Kirn-`, Suffixe `-wall` und `-au` sind alle vier neu.

⚠️ **Branchendublette, wie in HANDOFF-17 §7 vorhergesagt und unvermeidbar.** Beide Karten sind Einzelhandel, weil die Branche im Kartenszenario steht. Zweite unvermeidbare Dublette nach 44/47. **Bei der nächsten frei wählbaren Branche gegensteuern** — gemieden gehören inzwischen: Einzelhandel/Mode (50, 51), Versicherung (44, 47), Finanz/Zahlung (39, 45, 46), Logistik/Spedition (31, 32, 41), Pharma/Klinik (38, 43), Maschinenbau (48), Energie (49).

Bei der Namenswahl zusätzlich gemieden: `Nord*`, `Falke*`, `Berg*`, `Tal*`, `Weiß-`, `Immen-`, `Uhlen-`, `Eich-`, sowie `-dorn`, `-ried`, `-brook`, `-kamp`, `*bach`, `*kontor`, `*stein`, `*werk`, `*bank`, `* Payments`.

---

## 4. Kartenbefunde dieses Batches (Nr. 151–156)

### 4.1 🚨 Kartenübergreifend — die Sammelankündigung vom 30.06.2026

Gegen den **gesamten** Masterplan gegriffen, nicht nur gegen die Batchkarten.

**151 🚨🚨 Vorwarnung Karte 69 — Amazon Kendra.** Masterplan-Zeile 69: „Kendra · Intelligente Enterprise-Suche über Confluence, SharePoint, S3". **Der Dienst geht als Ganzes in Maintenance**, für Neukunden gesperrt ab dem 30.07.2026.

Das ist eine andere Größenordnung als die Befunde 149 und 150. Dort waren Teilfeatures betroffen (Rekognition Batch Image Content Moderation, Comprehend Topic Modeling); hier ist der Dienst identisch mit der Karte. Der empfohlene Migrationspfad ist Bedrock Managed Knowledge Base, und zwischen den 32 Kendra-Connectors und den derzeit 7 der Knowledge Base klafft eine Lücke — betroffen sind genau Confluence und SharePoint, also der Inhalt der Masterplan-Zeile. Für nicht unterstützte Quellen bleibt der Umweg über S3.

**Vor dem Zeichnen von Karte 69 grundsätzlich klären, ob die Karte überhaupt bleibt.** Falls 69 bereits gezeichnet ist, gegen die vorhandene `battle_card_69.md` prüfen, ob dort ein Service-Status-Abschnitt steht — wie bei Karte 5, wo sich der Befund dadurch erledigte.

**152 Vorwarnung Karte 76 — AWS Mainframe Modernization.** Betroffen ist ausschließlich die **Self-Managed Experience**, nicht der Managed Runtime. Die Masterplan-Zeile („COBOL-Batch schrittweise ablösen, Replatform vs Refactor") beschreibt Migrationsmuster, keine Betriebsart — vermutlich unbetroffen. Vor dem Zeichnen klären, welche Betriebsart die Karte zeigt.

**Geprüft und nicht getroffen**, mit jeweils benannter Trennlinie:

| Kandidat | Betroffen ist | Masterplan-Zeile zeigt | Ergebnis |
|---|---|---|---|
| Karte 42 | Cognito **Sync** | User Pools + Identity Pools | nicht betroffen |
| Karte 67 | 9 SageMaker-Features, Profiler im Sunset | Training, Endpoints | nicht betroffen |
| Karte 68 | Bedrock **Agents** Classic | Knowledge Bases (RAG) | nicht betroffen |
| Karten 91, 92 | IoT Device Defender – **Detect** | IoT Core/Rules, Greengrass | nicht betroffen |
| Karte 14 | Directory Service – **Simple AD** | FSx for Windows mit AD | nicht betroffen |

⚠️ **Alle fünf Einordnungen stammen aus der Masterplan-Zeile, nicht aus der Karte.** Nach der Konvention aus HANDOFF-17 §4.4 sind das deshalb keine Freigaben, sondern nur „kein Anlass zur Vertiefung". Karte 68 verdient trotzdem einen zweiten Blick, weil Kendra (69) künftig auf Bedrock Knowledge Bases zeigt und die beiden Karten damit thematisch zusammenrücken.

**Ebenfalls im Masterplan, nicht Teil dieser Ankündigung, aber auffällig:** Zeile 66 (Amazon Forecast) und Zeile 75 (VMware Cloud on AWS). Beide Dienste haben eigene, ältere Verfügbarkeitsgeschichten. **Nicht als Befund gemeldet** — die Karten wurden nicht gelesen, und die Ableitung aus der Masterplan-Zeile allein war bei Befund 148 genau der Fehler. Als Prüfauftrag notiert.

### 4.2 Karte 51 — drei Befunde, keiner schwer

**153 (mittel) Der Merksatz ist ungenauer als die Boxzeile derselben Karte.**

Die Box sagt präzise „Nachricht nach Delete weg". Der Footer sagt „SQS löscht nach Konsum, Kinesis behält nach Zeit". Zwei Ungenauigkeiten:

1. **Nicht der Konsum löscht, sondern der Delete.** Eine empfangene Nachricht bleibt in der Queue und wird nur für andere Konsumenten unsichtbar; entfernt wird sie erst durch `DeleteMessage` oder durch das automatische Löschen, das manche SDKs nach erfolgreicher Verarbeitung übernehmen.
2. **SQS hat ebenfalls eine Zeitachse.** Message Retention: Default **4 Tage**, Spanne 1 Minute bis 14 Tage. Damit hält SQS per Voreinstellung **viermal länger** als Kinesis mit 24 Stunden. Der Kontrast „Konsum gegen Zeit" trifft die Achse nicht — die Achse ist, ob das Lesen verbraucht.

Für Karte 51 trägt die Verkürzung. Für Karte 89 (Idempotenz, Retry, mindestens-einmal) ist sie die falsche mentale Karte.

Gemessene Fixvarianten (R3-Arbeitsgrenze ~1400 px, Stil-Guide ~1420):

| Variante | Breite | Reserve zu 1400 |
|---|---|---|
| IST: „SQS löscht nach Konsum, Kinesis behält nach Zeit" | 1354,1 | 45,9 |
| „SQS löscht beim Delete, Kinesis behält nach Zeit" | 1343,5 | 56,5 |
| „SQS löscht auf Befehl, Kinesis behält nach Zeit" | 1326,3 | 73,7 |
| „Delete löscht bei SQS, Kinesis behält nach Zeit" | 1326,9 | 73,1 |
| „SQS braucht den Delete, Kinesis behält trotz Lesen" | 1362,2 | 37,8 |
| „Lesen verbraucht bei SQS, nicht bei Kinesis" | 1297,5 | 102,5 |

**Oktays Entscheidung 11.08.: Karte bleibt, geht nur ins Narrativ.** Steht dort unter `Die ehrliche Feinheit` als erster Punkt, mit der Kontrasttabelle unter `Die entscheidende Unterscheidung`. **Die Varianten bleiben gemessen und einsatzbereit**, falls Karte 89 den Konflikt später verschärft.

**155 (klein) „Parquet-Ablage" gegen „Rohdaten-Ablage".** Pfeil-Label 5 sagt Parquet, die Zielbox sagt Rohdaten, die `.md` schreibt „schreibt die Rohdaten nach S3". Verteidigbar, wenn „roh" als *unaggregiert* gelesen wird — Parquet ist dann nur das Speicherformat der einzelnen Events.

**Oktays Entscheidung 11.08.: kein Befund, nur ins Narrativ.** Im H3 zu Pfeil 5 aufgelöst, mit dem Satz „Roh heißt hier nicht unverarbeitet, sondern unzusammengefasst" plus dem Hinweis, dass die Parquet-Umwandlung der Konsument selbst leistet — Data Streams kann sie nicht, Firehose könnte sie, verliert aber den Replay.

**156 (klein) `.md`-Präzisierung: „Die Feature-Seite nennt weiterhin bis zu 20".** Der Faktencheck-Punkt 2 der `battle_card_51.md` unterstellt einen Dokumentationsrückstand. Für den **Developer Guide gibt es ihn nicht**: `enhanced-consumers.html` führt beide Zahlen sauber attribuiert („mit On-demand Advantage bis zu 50, mit On-demand Standard und Provisioned bis zu 20"), die `RegisterStreamConsumer`-Referenz wortgleich.

Das ist der Gegenfall zu Befund 128 und 140: eine Zahlenänderung, bei der AWS die Doku **vollständig nachgezogen** hat. Für die `.md` bedeutet das nur eine Formulierungsschärfung — die Aussage „beide Zahlen sind richtig, je nach Modus" bleibt korrekt und ist der Grund, warum keine Zahl auf der Karte steht. Kein Kartenfix.

### 4.3 Karte 50 — ein Befund

**154 (klein) `.md`: `status_note` nennt 51 Textelemente, es sind 52.** Bestätigt den offenen Punkt aus HANDOFF-17 §8. `collide.py` zählt 52, `r2.py` ebenfalls. Zu korrigieren wären außerdem im selben Feld die R8-Zeile („Bildobjekt ohne lesbaren Inhalt" gilt seit dem Neurendern nicht mehr) und die Fixe zu Befund 142 und 143. Sammelkorrektur der `status_note` empfohlen, analog zu `md-fix-49.py`.

---

## 5. Systematische Befunde

### 5.1 Die Punkte (i) bis (iii) aus HANDOFF-17 §7 — geschlossen

**(i) On-demand Advantage und 50 EFO-Konsumenten — beide belegt.** On-demand Advantage seit dem 4.11.2025: Einstellung auf **Kontoebene**, gilt für alle On-demand-Streams **einer Region**, entfernt die feste Gebühr je Stream, erlaubt das Vorwärmen von Schreibkapazität. AWS nennt drei Eignungskriterien, darunter ausdrücklich „Fan-out auf mehr als zwei Konsumenten-Anwendungen" — **Karte 51 hat drei**. Damit ist der Modus für dieses Szenario nicht nur eine Randnotiz, sondern trifft es genau. Er steht trotzdem nicht auf der Karte, weil er den gezeigten Weg nicht ändert und die Begründung Kostencharakter hat.

50 EFO-Konsumenten seit dem 20.11.2025, ausschließlich für On-demand-Advantage-Streams. Siehe Befund 156 zur Dokumentationslage.

**(ii) Karte 55 (MSK) — geprüft, mit offengelegter Grenze.** Masterplan-Zeile 55 lautet „MSK (Kafka) · Bestehende Kafka-Anwendungen managed betreiben — **wann MSK statt Kinesis**". Das ist deckungsgleich mit der Abgrenzung 51 ↔ 55 in der `battle_card_51.md` („der Unterschied ist nicht fachlich, sondern operativ"). Fachlich trifft Kafka dieselbe Replay-Aussage: Records nach Zeit, unabhängige Consumer Groups mit eigenen Offsets.

⚠️ **Nicht abschließend prüfbar:** `battle_card_55.md` lag in diesem Chat nicht vor. Die Gegenprobe lief nur gegen den Masterplan. Dieselbe Bauart wie HANDOFF-17 §5.2 zu Karte 40. Das Narrativ 51 formuliert die Abgrenzung deshalb aus der eigenen Sicht heraus und behauptet nichts über den Inhalt von Karte 55.

**(iii) Karten 7 und 89 — kein Widerspruch, aber Befund 153 fiel dabei ab.** Karte 7 (Lambda, SQS, DLQ) ist konfliktfrei: genau einmal durch einen Verarbeiter gegen mehrfach durch mehrere. Die Prüfung gegen Karte 89 (Idempotenz, mindestens-einmal) förderte dagegen die Ungenauigkeit im Merksatz zutage. Auch hier gilt die Grenze: Weder `battle_card_7.md` noch `battle_card_89.md` lagen vor.

### 5.2 Keine Masterplan-Schuld für die Batchkarten — vierter Batch in Folge

| Karte | Masterplan-Zeile gleicher Nr. | Thema woanders? | Typ |
|---|---|---|---|
| 50 | WAF Bot Control, CAPTCHA · Sneaker-Shop gegen Scalper-Bots | nein | deckungsgleich |
| 51 | Kinesis Data Streams vs SQS · Clickstream, mehrere Konsumenten, Replay | nein | deckungsgleich |

Stufe 2 über den gesamten Masterplan: `WAF`, `CAPTCHA` und `Bot` stehen ausschließlich in Zeile 50. `Kinesis` steht zusätzlich in 52 (Firehose, dort als Namensänderungs-Schuld dokumentiert) und 59 (Managed Service for Apache Flink), `SQS` in 7 und 89 — beide in §5.1 (iii) geprüft.

### 5.3 Der 30-Tage-Transitionskonflikt (Karte 11) wurde erneut nicht geprüft

Stand unverändert offen seit HANDOFF-05 §5.5. Weder Karte 50 noch 51 berühren S3 Lifecycle. **Achter Batch in Folge ohne Prüfung** — der Punkt sollte entweder aktiv terminiert oder als dauerhaft vertagt geschlossen werden.

---

## 6. Was in den Narrativen steht, aber nicht auf den Karten

**Karte 50:** Das vollständige `ManagedRuleGroupStatement` mit `InspectionLevel` und `ScopeDownStatement` als JSON; die fünf Werte von `PositionalConstraint` und warum `CONTAINS` die statischen Dateien wieder hereinholt; dass Common auf Anfragemerkmale prüft und ein vollständiger Chrome-Fingerabdruck sie unterläuft; das Bild vom selbstgemalten roten Strich für den Unterschied zwischen Rate-based und dynamischer Ratenbegrenzung; dass eine ausgelieferte Challenge-Antwort auch dann abgerechnet wird, wenn der Nutzer sie nicht versucht; die SDK-Voraussetzung (mindestens eine Managed Rule aus Targeted Bot Control oder Fraud Control) und der Verlust des Sitzungszusammenhangs ohne SDK; die HTTP-405-Mechanik samt fehlender CORS-Header als stiller SPA-Fehler; das Bild vom Stempel auf dem Handrücken für `Count`-Verhalten und Labels; die Einordnung, dass Bot Control eine Kostenverschiebung ist und keine Bot-Freiheit.

**Karte 51:** Der `GetShardIterator`-Aufruf mit `AT_TIMESTAMP` als vollständige Antwort auf die Aufgabe; alle fünf `ShardIteratorType`-Werte und warum `LATEST` beim Wiederanlauf still Daten überspringt und `TRIM_HORIZON` mit der Retention mitwandert; dass Enhanced Fan-out eine kostenpflichtige Registrierung ist (Befund 147) und die drei Konsumenten ohne EFO rechnerisch je rund 667 KB/s bekommen; die Modusabhängigkeit 50 gegen 20; On-demand Advantage samt Kontoebene, Regionsgeltung und dem Kriterium „mehr als zwei Konsumenten-Anwendungen"; die SQS-Retention von 4 Tagen Default und die daraus folgende Kontrasttabelle; die Präzisierung des Merksatzes (Befund 153); die Auflösung von Parquet gegen Rohdaten (Befund 155); dass der Zonenrahmen die Kettenfehllesart verhindert; dass eine Retention-Erhöhung nur nach vorn wirkt.

---

## 7. Zu prüfen vor Batch 18 (Karten 52, 53, 54)

**Vorrangig, weil Karte 52 unmittelbar daran hängt:**

- **(j) aus HANDOFF-17:** Trägt `card-40-narrative.md` die Athena-Partitionierungs- und Kostenmechanik? Narrativ 49 verweist darauf, ohne dass gegengelesen werden konnte. **Narrativ 51 verweist zusätzlich auf Karte 52** („von dort arbeiten Athena und Glue weiter"). Beide Verweise bei Karte 52 gegenlesen und gegebenenfalls korrigieren.
- **Masterplan-Schuld Zeile 52:** „Kinesis Data Firehose" heißt seit dem 9.2.2024 **Amazon Data Firehose**. Die Masterplan-Zeile ist entsprechend veraltet.
- **Masterplan-Schuld Zeile 53:** **Karte 53 ist IPv6, nicht Athena** (Oktays Entscheidung 11.08.). Die Masterplan-Zeile ist veraltet und bleibt dokumentierte Schuld.

**Aus diesem Batch neu:**

- **Befund 151 (Karte 69, Kendra)** — grundsätzlich klären, ob die Karte bleibt.
- **Befund 152 (Karte 76, Mainframe Modernization)** — Betriebsart klären.
- **Karte 68 (Bedrock Knowledge Bases)** — zweiter Blick, weil Kendra künftig dorthin zeigt.
- **Prüfauftrag ohne Befundstatus:** Masterplan-Zeile 66 (Forecast) und 75 (VMware Cloud on AWS) haben eigene Verfügbarkeitsgeschichten außerhalb der Sammelankündigungen. Erst die Karten lesen, dann bewerten.
- **`battle_card_50.md`** — Sammelkorrektur der `status_note` (Befund 154, plus R8 und die Fixe 142/143).
- **`battle_card_51.md`** — Formulierungsschärfung im Faktencheck-Punkt 2 (Befund 156).

**Unverändert offen aus früheren Batches:**

- (a) S3 30-Tage-Transitionsregel, Karte 11 hängt daran — seit HANDOFF-05 §5.5, achter Batch ohne Prüfung
- (b) 50-Listener-Grenze bei PrivateLink-NLBs — unbelegt
- (c) Regionsumfang Cross-Region PrivateLink
- (d) „Provisioned"-Modus des Regional NAT Gateway
- (e) Sekundärregionen-Limit Aurora Global Database: 10 gegen 5
- (g) Gegenprobe R2-Fehlalarm Karte 41: `python3 r2.py 41`
- (h) KMS-FAQ 10 gegen CLI-Referenz 25
- (i) Macie „bis zu zehn Beispiele" beim Sample-Abruf — unbelegt
- **Vertagt:** Befund 99 (Karte 38), 102 (39), 114 (41), 118 (43), 121 (44), 129 (46), 133 (48), 146 (49), 147 (51 — **im Narrativ 51 geschlossen**, Kartenstatus unverändert)
- **Renderfehler Karte 41:** zwei Textkollisionen (Befund 112), Fix gemessen und verifiziert — `CreateSession` y=395 → y=428, `Key gelöscht` x=630 → x=415. Kartenkette, vorrangig
- **Laufender Fix:** Umlaut-Defekt Karten 6–10, 27, 30
- **Farb-Debt:** Teal als „Regel-/Konfigurationsinstanz" siebzehnmal in Folge (34–50), Karte 50 nutzt es für **fünf** Boxen. Festschreibungsvorschlag aus Karte 38 überreif. Rot-Pink `#B0084D` doppelt belegt (relationale Engine gegen SCP)
- **`zones.py`** mit seinem 1,2-%-Puffer gegen den neuen Renderstand nachmessen, **bevor die nächste Karte gezeichnet wird** (HANDOFF-17 §2.7)

**Umfangsprognose für Batch 18** — nach §2.1 dieses Handoffs mit Vorsicht zu behandeln. H3-Liste je Karte lückenlos aufstellen, Erstdurchgang messen, **dann** entscheiden, ob gekürzt oder ergänzt wird.

**Riskante Kategorie für Batch 18:** Speicherformate und Abrechnungsmodelle. Karte 52 (Firehose) berührt Pufferintervalle, Formatkonvertierung und die Abrechnung je 5 KB — alles Zahlen vom Typ „Default, Limit oder wählbare Option" (Zahlenkonvention HANDOFF-17 §2.2). Karte 53 (IPv6) berührt Adressvergabe und Dual-Stack-Voreinstellungen.

---

## 8. Repo-Fakten aus der Integration vom 11.08. — vier Korrekturen

Alle vier wurden **nach** dem Schreiben der Abschnitte 1 bis 7 festgestellt.

**8.1 Szenario-Ordner sind zweistellig mit führender Null.** `public/scenarios/card-01` bis `card-09`, danach `card-10` bis `card-100`. Ein Sammelbefehl mit `card-$n` schlägt für 1–9 **stillschweigend** fehl: `test -f` bricht ab, bevor `cp` läuft, es kommt keine Fehlermeldung. Das sah zunächst nach neun fehlenden Narrativen aus. Es fehlt keines.

Richtig ist `printf "card-%02d" $n` oder `card-$(printf %02d $n)`.

**8.2 `check.py` liegt im Repo unter `./scripts/check.py`**, nicht unter `scripts/narrative/`. Der Nachtrag aus §3 dieses Handoffs ist am 11.08. **nicht** ins Repo gelangt — der `cp`-Befehl lief gegen einen nicht existierenden Pfad und brach ab. **Vor dem ersten Guard-Lauf in Batch 18 prüfen, ob `./scripts/check.py` die Slugs und Nummern 49, 50 und 51 kennt.**

**8.3 Die gelieferte `check.py` ist ein Batch-Guard, kein Repo-Guard.** Sie trägt die Slugs und Nummern 1–51 fest eingebaut. Legt man alle 51 Narrative in ein Verzeichnis, kollidiert jede Datei mit dem eingebauten Set — rund 100 Befunde, alle falsch. Sie prüft immer nur die **neuen** Dateien eines Batches.

HANDOFF-17 nannte `check.py` eine „Deploy-Vorbedingung". In dieser Bauform kann sie das nicht leisten. Entweder existiert im Repo eine zweite Variante mit leeren `BELEGTE_*`-Sets, oder die Vorbedingung ist nie repo-weit gelaufen. **Ungeklärt — im nächsten Claude-Code-Plan aufnehmen, nicht nebenbei reparieren.**

**8.4 Befund 157 (offen) — Code-Blöcke rendern zeilenweise statt als Block.** Im Smoke-Test auf `localhost:3002/saa/szenarien/50?v=lang` sichtbar: Der ASCII-Aufriss unter `Syntax lesen` zeigt korrektes Monospace und korrekte Ausrichtung (`│` steht sauber untereinander), aber **jede Zeile hat einen eigenen grauen Hintergrund**, der am letzten Zeichen endet, statt eines durchgehenden Blocks. Sieht nach `code`-Styling aus, das auf die Zeilen greift statt auf das umschließende `pre`.

⚠️ **Nicht abschließend geprüft, ob es alle Narrative betrifft.** Der cron-Aufriss in `narrative-reference-scheduler.md` und der SQL-Block in Narrativ 49 klären das. Sehen die genauso aus, ist es ein CSS-Thema der Szenarien-Seite und **kein Kartenbefund** — dann gehört es in die Schuldenliste. Die Browser-Verbindung brach vorher ab.

**Ebenfalls offen aus dem Smoke-Test:** JSON-Block in `Was es eigentlich ist`, die 14 H3 unter `Der Weg durch die Karte`, die Markdown-Tabelle, und Karte 51 vollständig. Verifiziert sind: Umschalter erscheint und schaltet auf `?v=lang`, alle neun H2 in kanonischer Reihenfolge, Klappzustand nach Spec §6 korrekt, Suffixe nach „ — " werden mitgerendert, Fett und Kursiv funktionieren.

**Nebenbefund ohne Bezug zu den Narrativen:** Next.js 16.2.6 meldet beim Build `middleware` als deprecated, Nachfolger ist `proxy`. Kandidat für die Schuldenliste, bevor es beim nächsten Major bricht.

---

## 9. Paste-Block für den Folgechat

```
Narrativ-Batch 18. Lies NARRATIVE-SPEC.md und
narrative-reference-scheduler.md aus dem Project Knowledge, bevor du schreibst.

STAND
Spec:            NARRATIVE-SPEC.md v1.1 (§4 geändert 29.07.2026) + Konventionen
                 aus HANDOFF-NARRATIVE-02 §2 bis -18 §2
                 ACHTUNG: der Spec-Patch liegt in -05 §5.1 und ist noch NICHT
                 im Project-Knowledge-Text. check.py erzwingt die neue Marke.
                 §6 (Renderer) liegt seit 10.08.2026 im Repo unter docs/
Referenz:        narrative-reference-scheduler.md (Maßstab ist die Referenz,
                 nicht der letzte Text)
Geschrieben:     51 von 100  (Karten 1-51)
Dieser Chat:     Karten 52, 53, 54. KARTE 53 IST IPv6, NICHT ATHENA
                 (Oktays Entscheidung 11.08.) - Masterplan-Zeile 53 veraltet.
                 Karte 52: Masterplan sagt "Kinesis Data Firehose", der Dienst
                 heisst seit 09.02.2024 Amazon Data Firehose
Ablage:          public/scenarios/card-NN/narrative.md - battle_card_N.md bleibt.
                 Narrative sind LIVE, readNarrative() liest sie, check.py ist
                 Deploy-Vorbedingung. Nicht erst am Ende laufen lassen
Frontmatter:     correctAnswer wird ausgelassen (kein Aufgaben-Track)
                 sources MUSS YAML-Blockliste sein ("  - url"), kein Inline-Array
Code-Blöcke:     KEINE Zeile darf mit "# " beginnen - Guard-Test 5 wertet das
                 auch im Code-Block als H1 (HANDOFF-08 §2.2)
H2-Namen:        nur die neun kanonischen aus Spec §3. Variable Suffixe nach
                 " — " sind erlaubt (HANDOFF-09 §2.3)
Länge:           2.200-2.500 Wörter, VERBINDLICH, Guard-Test Nr. 9.
                 Intern 2.250 bis 2.450.
H3-PLANUNG:      Lückenlos ein H3 je Kartenelement, VOR dem ersten Absatz.
                 ABER: die Prognose Kästen x 175 + Badges x 120 + 900 sagt die
                 RICHTUNG NICHT vorher (HANDOFF-18 §2.1). Karte 50 hatte 14 H3,
                 Prognose 3.020, Erstdurchgang 1.837 - Abweichung -1.183.
                 Erstdurchgang MESSEN, dann entscheiden ob kürzen oder ergänzen.
                 Ergänzt wird an optionalen H2 (Syntax lesen, Die entscheidende
                 Unterscheidung), nicht durch Strecken bestehender Absätze
Kollisionscheck: collide.py im ZIP
R2-Check:        r2.py im ZIP. Zu breites Pfeil-Label zuerst auf ZERLEGBARKEIT
                 prüfen; Korridormitte immer neu rechnen
Footer messen:   NEU (HANDOFF-18 §2.4). Bold-tspan "Merksätze:" getrennt vom
                 Rest messen und addieren. Sonst fehlen reproduzierbar 13,1 px
                 auf JEDER Karte - sieht wie Renderdivergenz aus, ist Messfehler
Umlaut-Grep:     läuft in JEDEM Batch, ZWEISTUFIG. Drei Batches in Folge
                 0 Kandidaten - das hebt die Regel nicht auf
GANZHEITSDURCH-
GANG:            DREI Fragen. (a) Widerspricht sich die Karte selbst?
                 (b) Welche Default-Einstellung muss wahr sein?
                 (c) Hängt eine Kartenaussage an einer FUNKTION, die jünger ist
                 als das übrige Kartenmaterial?
ZAHLEN:          Bei jeder Zahl klären, ob DEFAULT, LIMIT oder WÄHLBARE OPTION
Belegketten:     Jede .md-Aussage gegen die genannte Seite öffnen. Auch Aussagen
                 unter "NICHT BESTÄTIGT" gegenprüfen
SERVICE-
AVAILABILITY:    NEU UND WICHTIG (HANDOFF-18 §2.2). Erst SUCHEN, welche
                 Sammelankündigung die aktuellste ist - NICHT die im Handoff
                 notierte URL fetchen. Zuletzt abgearbeitet: 30.06.2026
                 (aws.amazon.com/about-aws/whats-new/2026/06/aws-service-availability).
                 Davor 31.03.2026. Zyklus rund drei Monate, naechste um Ende
                 September 2026 faellig. Gegen den GESAMTEN Masterplan greppen
check.py:        Slugs UND Nummern nachtragen, beides, immer. Für Batch 18:
                 50 und 51 aus HANDOFF-18 §3. Nachtrag selbst testen, es MÜSSEN
                 2 Befunde kommen.
                 REPO-PFAD ist ./scripts/check.py - NICHT scripts/narrative/.
                 Der Nachtrag fuer 49 ist am 11.08. NICHT im Repo angekommen,
                 der cp lief gegen einen falschen Pfad. ZUERST pruefen, ob
                 ./scripts/check.py die Nummern 49, 50, 51 kennt (HANDOFF-18 §8.2).
                 ACHTUNG Bauform: check.py ist ein BATCH-Guard, kein Repo-Guard.
                 Alle 51 Dateien in einem Verzeichnis geben ~100 FALSCHE
                 Kollisionsbefunde. Immer nur die neuen Dateien pruefen (§8.3)
Ordnernamen:     public/scenarios/card-01 bis card-09 sind ZWEISTELLIG mit
                 fuehrender Null. "card-$n" scheitert fuer 1-9 STILLSCHWEIGEND,
                 weil test -f abbricht bevor cp laeuft - es kommt KEINE
                 Fehlermeldung. printf "card-%02d" benutzen (HANDOFF-18 §8.1)
Prüfungsknack-
punkte:          Abgrenzungen statt Distraktoren, Format "Warum X hier verliert:"
Kartenfehler:    im Narrativ explizit benennen, immer mit GEMESSENEM Fixvorschlag.
                 Gibt es mehrere Wege, Oktay entscheiden lassen
Masterplan:      ZWEISTUFIG. Erst die Zeile gleicher Nummer, dann das Kartenthema
                 über den GESAMTEN Masterplan greppen
Offene Karten-
befunde:         156 Stück, vollständig in HANDOFF-02 §4 bis -18 §4
Vertagt:         99 (38), 102 (39), 114 (41), 118 (43), 121 (44), 129 (46),
                 133 (48), 146 (49), 147 (51 - im Narrativ geschlossen)
NEU AUS 18:      151 Karte 69 Kendra geht als GANZER DIENST in Maintenance -
                 grundsätzlich klären ob die Karte bleibt.
                 152 Karte 76 Mainframe Modernization Self-Managed Experience.
                 153 Karte 51 Merksatz "SQS löscht nach Konsum" verkürzt -
                 Fixvarianten gemessen, Oktay hat Karte unverändert gelassen.
                 154 battle_card_50.md status_note 51 statt 52 Textelemente.
                 155 Parquet gegen Rohdaten - kein Befund, im Narrativ gelöst.
                 156 battle_card_51.md Formulierung zur EFO-Doku schärfen.
                 157 OFFEN, KEIN Kartenbefund: Code-Bloecke rendern zeilenweise
                 statt als Block - jede Zeile eigener grauer Hintergrund.
                 Monospace und Ausrichtung stimmen. NICHT geprueft ob es alle
                 Narrative betrifft. Gegenprobe: cron-Aufriss in der Referenz
                 und SQL-Block in Narrativ 49. Wenn dort gleich -> CSS-Schuld
                 der Szenarien-Seite, kein Kartenbefund (HANDOFF-18 §8.4)
Smoke-Test 50/51: TEILWEISE. Verifiziert: Umschalter erscheint und schaltet auf
                 ?v=lang, neun H2 kanonisch, Klappzustand nach Spec §6 korrekt,
                 Suffixe nach " — " werden gerendert, Fett und Kursiv gehen.
                 OFFEN: JSON-Block, die 14 H3, die Tabelle, Karte 51 komplett
RENDERFEHLER:    Karte 41 hat ZWEI Textkollisionen im PNG (Befund 112). Fix
                 gemessen UND verifiziert: CreateSession y=395 -> y=428,
                 Key gelöscht x=630 -> x=415. Kartenkette, vorrangig
Laufender Fix:   Umlaut-Defekt. Karten 6-10, Karte 27, Karte 30
Farb-Debt:       Teal als "Regel-/Konfigurationsinstanz" SIEBZEHNMAL in Folge
                 (34-50). Karte 50 nutzt es für FÜNF Boxen. Festschreibungs-
                 vorschlag aus Karte 38 überreif.
                 Rot-Pink #B0084D doppelt belegt (relationale Engine vs. SCP)
R19:             Vorschlag geschärft (HANDOFF-18 §2.3): Befund ist, wenn ein
                 Pfeil-Label NÄHER an einem FREMDEN Badge liegt als am eigenen.
                 Absoluter Schwellwert 120 px produziert Fehlalarme bei
                 Randnotizen. Oktay: nur dokumentieren, keine Kalibrierung
Branchen:        gemieden: Einzelhandel/Mode (50,51), Versicherung (44,47),
                 Finanz/Zahlung (39,45,46), Logistik (31,32,41),
                 Pharma/Klinik (38,43), Maschinenbau (48), Energie (49)
Nachprüfen:      (a) S3 30-Tage-Transitionsregel, Karte 11 - ACHTER Batch ohne
                     Prüfung, entweder terminieren oder schliessen
                 (b) 50-Listener-Grenze bei PrivateLink-NLBs - unbelegt
                 (c) Regionsumfang Cross-Region PrivateLink
                 (d) "Provisioned"-Modus des Regional NAT Gateway
                 (e) Sekundärregionen-Limit Aurora Global Database: 10 gegen 5
                 (g) Gegenprobe R2-Fehlalarm Karte 41: "python3 r2.py 41"
                 (h) KMS-FAQ 10 gegen CLI-Referenz 25
                 (i) Macie "bis zu zehn Beispiele" - unbelegt
                 (j) VORRANGIG: trägt card-40-narrative.md die Athena-
                     Partitionierungsmechanik? Narrativ 49 UND 51 verweisen
                     darauf bzw. auf Karte 52, ohne Gegenlesen. Bei 52 klären
                 (l) NEU: Masterplan-Zeile 66 (Forecast) und 75 (VMware Cloud
                     on AWS) - eigene Verfügbarkeitsgeschichten. ERST die
                     Karten lesen, dann bewerten (Lehre aus Befund 148)
                 (m) NEU: Karte 68 (Bedrock Knowledge Bases) zweiter Blick,
                     weil Kendra künftig dorthin zeigt
zones.py:        1,2-%-Puffer gegen den neuen Renderstand nachmessen, BEVOR die
                 nächste Karte gezeichnet wird (HANDOFF-17 §2.7)

ABLAUF
Karten lesen → bestehende .md lesen → H3-LISTE AUFSTELLEN → Kollisions- und
R2-Check → Umlaut-Grep zweistufig → Masterplan zweistufig →
Service-Availability SUCHEN und greppen → Faktencheck → GANZHEITSDURCHGANG mit
DREI Fragen → etwaige neue Kartenbefunde melden BEVOR Text entsteht →
schreiben → Erstdurchgang MESSEN → kürzen oder ergänzen → check.py →
ZIP + HANDOFF-NARRATIVE-19.md + Sammelbefehle.

Kein Repo-Schreiben, kein SCENARIO_COUNT, keine Commits.
```
