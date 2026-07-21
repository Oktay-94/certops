---
nr: 69
title: "Kendra → Bedrock Managed Knowledge Base — Enterprise-Suche im Wartungsmodus"
services:
  - Amazon Kendra (Maintenance Mode)
  - Amazon Bedrock Managed Knowledge Base (BMKB)
  - Amazon S3
  - AWS Lambda / AWS Step Functions / Amazon EventBridge Scheduler
  - Amazon OpenSearch Service (verworfen)
domains:
  - D3
signalwords:
  - "enterprise search across Confluence, SharePoint, S3"
  - "natural language search over company documents"
  - "faceted search / autocomplete / synonyms"
  - "connector not supported"
  - "migrate off a service in maintenance mode"
assets:
  - battle_card_69.svg
  - battle_card_69.png
  - battle_card_69.pdf
status_note: |
  qc.py: 0 Befunde im ERSTEN Lauf.
  Gemeldet: 10 Boxen, 54 Texte, 18 Segmente, 6 Badges, 1 X-Kreis.
  Segment-Aufschlüsselung nach R5: 5 Marker in <defs> erzeugen 10
  Phantom-Segmente -> 18 - 10 = 8 echte Segmente (6 Pfeile + 2 X-Striche).
  Zehnte "Box" ist die gestrichelte Kendra-Statusleiste.

  Korrekturrunden — ALLE VOR dem Zeichnen:
  (1) 1 R16-Befund: Label 'exportieren' (86,6 px) ragte über die Kante der
      nosrc-Box; Korridor misst 90 px, für beidseitige Luft sind höchstens
      82 px zulässig. Behoben durch 'abziehen' (68,2 px).
      VIERTE Karte in Folge mit derselben Ursachenklasse (K66 'Model
      anlegen', K67 'Model anlegen', K68 Titelbreite, jetzt K69).
      Die Korridorbreite ist die harte Schranke, nicht die Lesbarkeit.
  (2) Footer-Variante 1 mit 1.427,1 px über dem Stil-Guide-Maß (~1.420).
      Variante 2 mit 1.239,2 px genommen.

  NEU IN DIESEM PLAN — Konsequenz aus dem K68-Befund:
  (a) Prüfblock G ergänzt: BOX-GEGEN-BOX. Prüft alle Boxpaare auf
      Überlappung und auf mindestens 20 px Luft, zusätzlich jede Box gegen
      den Footer. Auf dieser Karte 0 Befunde. Bisher prüfte der Plan nur
      Boxen gegen Footer, nicht Boxen gegeneinander — die hohe
      Feature-Lücken-Box (220 px) machte das nötig.
  (b) Schwellen werden jetzt AUS DEN BOXMASSEN BERECHNET
      (FOOTER_INNEN, NOTE_INNEN als Variablen), nicht als Zahl notiert.
      Auf Karte 68 hatte eine hart notierte Schwelle nach einer
      Breitenänderung still gegen ein totes Maß geprüft.

  NACH dem Zeichnen: keine Korrektur nötig.

  Render-Sanity: 11 Freizonen aus der Elementgeometrie abgeleitet
  (36 belegte Rechtecke automatisch eingesammelt).
  Planvorhersage 0 — PNG 0. Keine Zone nachgeschnitten.

  R13: 0 px reines (0,0,0). Merksatz-y = 863 AUS DEM SVG gelesen;
  Band y 843..871 ebenfalls 0 px.
  R18 Titelband: 0 px Kanaldivergenz.
  R12: NULL <path> mit stroke — alle 8 Verbindungen als <line>.
  Palettenfarben: Quelle 8.182 · Transport 4.965 · Compute 8.171 ·
  Storage 4.674 · Governance 9.811 · Verworfen 2.470 px. Alle sechs.
  Footer: 1.239,2 px. Statusleiste: 1.192,8 px in 1.494 px.

  Sichtprüfung: VERSUCHT, FEHLGESCHLAGEN. Der Viewer gab '[image]' ohne
  lesbaren Inhalt zurück. ACHTER Fehlschlag in Folge.
  RECHNERISCH GEPRÜFT, NICHT GESEHEN.
---

# Battle Card 69 — Kendra → Bedrock Managed Knowledge Base

## Szenario

Ein Konzern betreibt seit drei Jahren eine Kendra-basierte Enterprise-Suche über
Confluence, SharePoint, S3, ServiceNow und Salesforce. Die Suchmaske hat
Autocomplete, Facettenfilter nach Abteilung und Dokumenttyp und ein gepflegtes
Synonymverzeichnis für Hausbegriffe.

Kendra geht am 30.06.2026 in den Wartungsmodus, ab 30.07.2026 werden keine
Neukunden mehr aufgenommen. Die Architektin soll bewerten, was eine Migration
auf Bedrock Managed Knowledge Base kostet — und stellt fest, dass die Rechnung
in **beide** Richtungen geht.

## Die Pointe: das ist keine Aufwärts-Migration

BMKB ist kein besseres Kendra. Es ist ein anderes Werkzeug mit anderem
Schwerpunkt:

- **BMKB kann mehr als Kendra bei RAG:** native `RetrieveAndGenerate`
  (Antwort mit Zitaten in einem Aufruf) und Agentic Retrieval (mehrstufige
  Suche über mehrere Knowledge Bases). Kendra braucht für beides ein extern
  angebundenes LLM.
- **BMKB kann weniger als Kendra bei klassischer Suche:** 7 statt 32+
  Konnektoren, keine Facetten, kein Autocomplete, keine Synonyme, keine
  Rechtschreibkorrektur, kein Lernen aus Klickverhalten, keine
  Lambda-Hooks bei der Ingestion.

Wer eine Suchmaske betreibt, verliert. Wer einen Chatbot bauen will, gewinnt.

## Ablauf

**1 — Sieben Konnektoren ziehen direkt.**
S3, Confluence, SharePoint, Web Crawler, Google Drive, OneDrive und ein Custom
Connector. Kendra hatte über 32.

**2 — BMKB Ingestion mit Smart Parsing.**
Die Chunking-Strategie muss jetzt **explizit gewählt** werden — Kendra erledigte
das intern. Verfügbar sind Default (fixed-size, rund 300 Tokens), Fixed-size mit
konfigurierbarem `maxTokens` und `overlapPercentage`, Hierarchical und No
Chunking. Semantisches Chunking gibt es für Managed Knowledge Bases nicht.
Für Migrationen empfiehlt AWS als Startpunkt Fixed-size mit 200 Tokens und 30 %
Overlap.

**3 — Managed Vector Store.**
Bedrock betreibt ihn vollständig; OpenSearch oder Aurora müssen nicht mehr
provisioniert werden. Die Suche ist **immer hybrid** (Keyword plus semantisch) —
einen reinen Semantic-Modus gibt es nicht, Kendra hatte die Wahl zwischen
Keyword, semantisch und hybrid.

**4 — Nicht unterstützte Quellen abziehen.**
ServiceNow und Salesforce haben keinen BMKB-Konnektor.

**5 — Umweg über S3.**
Der von AWS empfohlene Weg: eine eigene Pipeline aus Lambda, Step Functions
oder EventBridge Scheduler zieht periodisch über die API des Quellsystems,
schreibt die Dokumente mit `.metadata.json`-Sidecar-Dateien nach S3 und stößt
einen Ingestion Job an. Das repliziert das Sync-Verhalten der
Kendra-Konnektoren — **selbst gebaut und selbst betrieben.**

**6 — Verworfen: Selbstbau auf OpenSearch.**
Wer schon migriert, könnte gleich alles selbst bauen. Dann trägt man Chunking,
Embedding-Aufrufe, Indexpflege, Synchronisation und Ranking dauerhaft selbst —
dieselbe Abwägung wie auf Karte 68.

## Die Gold-Box: was BMKB nicht kann

Sechs Kendra-Features fehlen in BMKB und brauchen Workarounds:

| Fehlt | Workaround laut AWS |
|---|---|
| **Query Suggestions** (Autocomplete) | Eigener OpenSearch-Index mit Suggester-Funktion, oder LLM-basierte Query-Vervollständigung |
| **Faceted Search** | Metadatenfilter simulieren über `.metadata.json`-Sidecars; Filteroptionen fest in der UI, keine dynamischen Facettenzähler |
| **Custom Synonyms** | Synonym-Expansionsdienst vor der Query; Thesaurus in DynamoDB oder S3, Query vor dem Aufruf erweitern |
| **Spell Checking** | Lambda-Vorstufe mit SymSpell/TextBlob oder LLM-Korrektur |
| **Incremental Learning** (`SubmitFeedback`) | Reranking-Modelle plus eigener Feedback-Loop in DynamoDB |
| **Custom Document Enrichment** (Lambda-Hooks) | Vorverarbeitungs-Pipeline über Step Functions oder Lambda, bevor die Dokumente in S3 landen |

Keiner dieser Workarounds ist geschenkt — jeder ist zusätzlicher Code, der
betrieben werden muss.

## Prüfungs-Kernsatz

**Kendra 32+ Konnektoren, BMKB 7. Was BMKB nicht anbinden kann, geht über S3.**

## Abgrenzungen

- **Kendra ↔ BMKB:** Kendra ist Enterprise-Suche (Facetten, Autocomplete,
  Synonyme, viele Konnektoren). BMKB ist RAG (Antwortgenerierung, Zitate,
  Agentic Retrieval). Beide indexieren Dokumente, aber für verschiedene Zwecke.
- **BMKB ↔ Bedrock Knowledge Bases mit eigenem Vector Store (Karte 68):**
  Karte 68 zeigt Knowledge Bases mit selbst gewähltem Vector Store
  (OpenSearch Serverless, Aurora, Pinecone). BMKB ist die *managed* Variante,
  bei der Bedrock den Store vollständig betreibt. Der Typ heißt in der API
  `MANAGED`.
- **Kendra ↔ OpenSearch:** OpenSearch ist eine Suchmaschine, die man betreibt.
  Kendra war ein Suchdienst, den man konfiguriert. Wer nach der Migration
  Facetten braucht, landet oft bei OpenSearch — und übernimmt den Betrieb.
- **Maintenance Mode ↔ Sunset:** Kendra hat **kein Enddatum**. Bestandskunden
  bekommen weiter Bugfixes und Security-Updates. Dieselbe Unterscheidung wie
  bei Forecast (K66), Model Monitor (K67) und Agents Classic (K68).

## Klassiker-Fallen

1. **Kendra als Antwort auf "Enterprise-Suche" in einem Neubau-Szenario.** Seit
   30.07.2026 für Neukunden zu. Bei Bestandskunden-Szenarien bleibt Kendra
   korrekt.
2. **Annehmen, die Migration sei ein reiner Konfigurationswechsel.** AWS nennt
   zwei Aufwände ausdrücklich: Daten neu ingestieren **und** Anwendungscode
   umschreiben.
3. **Facetten für selbstverständlich halten.** BMKB kann sie architektonisch
   nicht. Ein Szenario mit "Filter nach Abteilung mit Trefferzahlen" ist mit
   BMKB allein nicht lösbar.
4. **Semantic-only-Suche erwarten.** BMKB ist immer hybrid.
5. **Q Business als Ausweichlösung nennen.** Q Business ist seit dem
   30.06.2026 ebenfalls im Wartungsmodus — die naheliegende Alternative ist
   selbst eine Sackgasse. Der von AWS benannte Weg führt auf BMKB.
6. **`batch_put_document` suchen.** Gibt es in BMKB nicht; der Ersatz ist
   S3-Upload plus Ingestion Job.

## Faktencheck

- **Kendra Maintenance Mode:** wirksam ab 30.06.2026, keine neue
  Feature-Entwicklung; ab 30.07.2026 keine Neukunden mehr. Während des
  Wartungsmodus bleibt der Dienst voll unterstützt, AWS liefert weiter
  Bugfixes und Security-Updates, neue Feature-Wünsche werden nicht mehr
  berücksichtigt.
  *Quelle: AWS-Doku, "Amazon Kendra availability change".*
- **Empfohlenes Migrationsziel:** Bedrock Managed Knowledge Base, für
  vergleichbare Fähigkeiten und zusätzlich generative sowie agentische
  Anwendungsfälle.
  *Quelle: ebenda.*
- **Konnektoren-Lücke 32+ gegen 7.** Die AWS-Vergleichstabelle nennt für
  Kendra "32+ connectors" und für BMKB "7 connectors": S3, Confluence,
  SharePoint, Web Crawler, Google Drive, OneDrive und Custom.
  *Quelle: ebenda, Abschnitt "Amazon Bedrock Managed Knowledge Base Features"
  und Architekturvergleichstabelle.*
- **Weg für nicht unterstützte Quellen:** Inhalte nach S3 exportieren und dort
  eine S3-Data-Source konfigurieren; automatisierte Pipeline über Lambda,
  Step Functions oder EventBridge Scheduler, die periodisch über die API des
  Quellsystems zieht, mit Metadaten-Sidecars nach S3 schreibt und einen
  Ingestion Job auslöst.
  *Quelle: ebenda, Abschnitt "Connector Coverage Gap".*
- **Immer Hybrid-Suche:** BMKB führt stets Keyword- plus semantische Suche aus
  und bietet keinen reinen Semantic-Modus. Kendra bot Keyword, semantisch oder
  hybrid.
  *Quelle: ebenda, Architekturvergleichstabelle.*
- **RAG-Unterschied:** Kendra benötigt für RAG die Anbindung eines externen
  LLM; BMKB hat `RetrieveAndGenerate` nativ und beherrscht Agentic Retrieval
  über mehrere Iterationen, was Kendra nicht anbietet.
  *Quelle: ebenda.*
- **Sechs Feature-Lücken mit Workarounds:** Query Suggestions, Faceted Search,
  Custom Synonyms, Spell Checking, Incremental Learning und Custom Document
  Enrichment.
  *Quelle: ebenda, Abschnitt "Feature Gaps and Workarounds".*
- **Chunking-Strategien in BMKB:** Default (fixed-size, rund 300 Tokens),
  Fixed-size (konfigurierbar), Hierarchical und No Chunking; semantisches
  Chunking wird für Managed Knowledge Bases nicht unterstützt. Für Migrationen
  empfiehlt AWS Fixed-size mit 200 Tokens und 30 % Overlap als Startpunkt.
  *Quelle: ebenda.*
- **Metadaten:** In BMKB über `.metadata.json`-Sidecar-Dateien neben den
  Quelldokumenten in S3, maximal 10 KB je Datei, Attributtypen STRING, NUMBER
  oder BOOLEAN.
  *Quelle: ebenda, Abschnitt "Metadata Migration".*
- **Filter-Einschränkung:** `startsWith` und `stringContains` gibt es für
  Managed Knowledge Bases nicht; Wildcard- oder Teilstring-Filter aus Kendra
  müssen auf exakte Treffer oder Mengenzugehörigkeit umgebaut werden.
  *Quelle: ebenda, Abschnitt "Metadata Filter Syntax Translation".*
- **Amazon Q Business ist ebenfalls seit 30.06.2026 im Wartungsmodus.**
  *Quelle: AWS General Reference, "Services in Maintenance"; bestätigt in der
  AWS-Sammelankündigung vom 30.06.2026.*

## Korrektur einer Vorgabe aus dem Batch-Start-Dokument

Das Batch-Dokument nennt "32 Kendra-Connectoren gegen 7 bei BMKB". Die
AWS-Doku formuliert **"32+"**, nicht "32" — die Zahl ist eine Untergrenze.
Auf der Karte steht deshalb "Kendra hatte 32+".

Zusätzlich gab es einen Quellenwiderspruch: Die AWS-Ankündigung zur
BMKB-Verfügbarkeit vom Juni 2026 nennt **sechs** native Konnektoren (S3,
SharePoint, Confluence, Google Drive, OneDrive, Web Crawler), die
Migrationsdokumentation nennt **sieben**. Die Differenz ist der **Custom
Connector**, den die Ankündigung nicht mitzählt. Da beide Quellen von AWS
stammen und sich auflösen lassen, steht die 7 auf der Karte — mit der
Migrationsdokumentation als maßgeblicher Quelle, weil sie die jüngere und
speziellere ist.

## Nicht bestätigt

- **Ein Enddatum für Kendra.** Es gibt keines.
- **Ob die 32+ Kendra-Konnektoren vollständig dokumentiert sind.** AWS nennt
  nur die Untergrenze.
- **Ob Q Business jemals als Kendra-Nachfolger gedacht war.** Beide sind nun
  im Wartungsmodus; ein kausaler Zusammenhang ist plausibel, aber nicht
  belegt. Auf der Karte steht Q Business deshalb nicht.
- **Die Aussage "Migration ist für die meisten Workloads machbar".** AWS sagt
  das ausdrücklich mit dem Zusatz "mit sorgfältiger Planung" — eine
  Einschätzung, keine Garantie. Sie steht nicht auf der Karte.

## Bewusste Vereinfachungen im Diagramm

- **Die Kendra-Seite ist nicht als eigener Fluss gezeichnet.** Die Karte zeigt
  den Zielzustand mit Kendra als Referenzpunkt in den Kursivzeilen ("Kendra
  hatte 32+", "kann Kendra nicht"). Ein zweiter vollständiger Fluss hätte die
  Karte verdoppelt.
- **Der Chatbot beziehungsweise die Suchmaske als Konsument fehlt.** Die Karte
  endet bei `RetrieveAndGenerate`, weil die Migrationsentscheidung dort fällt.
- **Die Feature-Lücken-Box hängt an keinem Pfeil.** Sie ist eine Bilanz, kein
  Ablaufschritt.
- **Die Metadaten-Sidecars sind nicht dargestellt**, obwohl sie für Filterung
  nötig sind.
- **Smart Parsing und Chunking stehen in einer Box**, obwohl es zwei Schritte
  der Ingestion-Konfiguration sind.

## Farbkonventionen dieser Karte

| Knoten | Rolle | Begründung |
|---|---|---|
| 7 Konnektoren | **Quelle** (Blau) | Einstieg der Daten |
| BMKB Ingestion | **Compute** (Orange) | Parst und zerlegt |
| Managed Vector Store | **Storage** (Grün) | Hier liegen die Embeddings |
| RetrieveAndGenerate | **Compute** (Orange) | Rechnet: Suche plus Generierung |
| ServiceNow, Salesforce | **Quelle** (Blau), gestrichelt | Quellen, aber nicht direkt anbindbar |
| Export nach S3 | **Transport** (Teal) | Befördert, ohne fachlich zu verändern — Präzedenz Event Tracker K65, Data Source Sync K68 |
| Was BMKB nicht kann | **Governance** (Gold) | Bilanz und Einschränkung, kein Ablaufschritt |
| Kendra-Statusleiste | **Governance** (Gold), gestrichelt | Statushinweis |
| Selbstbau OpenSearch | **Compute-Rand** (Orange), verworfen über X | Rollenfarbe bleibt, abgelehnt über X und roten Pfad |

**Zum Gegenlesen:** Die gestrichelte ServiceNow/Salesforce-Box behält
**Quelle-Blau**, obwohl sie eine Einschränkung darstellt. Begründung: Es sind
echte Datenquellen im Fluss — sie werden nicht verworfen, sondern nur auf einem
Umweg angebunden. Der gestrichelte Rand markiert "nicht direkt", nicht
"abgelehnt". Das rote X bleibt dem Selbstbau vorbehalten.

**Zweite Rollenentscheidung:** Die Feature-Lücken-Box ist **Governance**, nicht
Verworfen-Rot. Sie beschreibt, was das gewählte Zielsystem nicht leistet — eine
Eigenschaft der Architektur, keine abgelehnte Alternative.
