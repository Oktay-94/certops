# NARRATIVE-SPEC

> **Zustand dieser Datei (10.08.2026).** Die Spec entstand im Project Knowledge
> und lag bis heute nicht im Repo. Neu angelegt wurde sie, weil §6 durch die
> Narrative-Integration inhaltlich überholt war und die korrigierte Fassung
> versioniert neben dem Code liegen soll.
>
> **§6 ist vollständig, maßgeblich und auf dem Stand des gebauten Renderers.**
> Alle übrigen Abschnitte sind Platzhalter: ihr Text liegt im Project Knowledge
> und ist von dort zu übertragen. Sie sind hier bewusst leer statt
> rekonstruiert — eine erfundene Spec, die aussieht wie die echte, wäre
> schädlicher als eine sichtbare Lücke.
>
> **Offener Spec-Patch:** die Fassung v1.1 von §4 (Wortkorridor) steht bis
> heute nur in `HANDOFF-NARRATIVE-05` §5.1 und ist beim Übertragen
> einzuarbeiten. Weitere nachzuziehende Spec-Änderungen sind in
> `docs/narrative-handoffs/HANDOFF-NARRATIVE-01.md` §2 vermerkt.

---

## 1. Zweck und Abgrenzung

> **Platzhalter — Text im Project Knowledge.**
> Nicht rekonstruiert. Beim Übertragen hier einsetzen.

## 2. Zielgruppe und Tonfall

> **Platzhalter — Text im Project Knowledge.**

## 3. Aufbau eines Narrativs

> **Platzhalter — Text im Project Knowledge.**
>
> Der Renderer setzt aus diesem Abschnitt genau eines voraus: die neun
> kanonischen H2 in fester Reihenfolge (siehe §6.2 und
> `NARRATIVE_SECTION_KEYS` in `src/lib/scenario-content.ts`). Sieben davon sind
> Pflicht; `Die entscheidende Unterscheidung` und `Syntax lesen` dürfen fehlen.

## 4. Umfang und Wortkorridor

> **Platzhalter — Text im Project Knowledge.**
> **Achtung:** Die geltende Fassung ist v1.1 aus `HANDOFF-NARRATIVE-05` §5.1,
> nicht die ursprüngliche v1.

## 5. Frontmatter

> **Platzhalter — Text im Project Knowledge.**
>
> Der Leser `readNarrative()` erzwingt diese Pflichtfelder: `cardNumber`
> (muss zur Kartennummer passen), `slug`, `title`, `services`, `domains`
> (D1–D4), `badgeCount`, `narrativeVersion`, `factCheckedAt`, `sources`.
> Ein Verstoß lässt den Build scheitern, nicht nur `check.py`.
>
> **`correctAnswer` gehört nicht dazu.** Die Fassung im Project Knowledge
> führt das Feld als Pflicht; keines der 99 Narrative hat es, seit Batch 01
> nicht. Weder `readNarrative()` noch `check.py` lesen es — `check.py`
> dokumentiert die Auslassung als Batch-Entscheidung vom 28.07. Beim
> Übertragen aus dem Project Knowledge ist der Patch aus
> `docs/narrative-handoffs/HANDOFF-NARRATIVE-01.md` §2 einzuarbeiten
> („Pflicht" → „Pflicht ab Aufgaben-Track"), damit die Divergenz nicht
> wieder einwandert.

---

## 6. Rendering-Vertrag

**Stand 10.08.2026: gebaut und live.** Die ursprüngliche Fassung dieses
Abschnitts beschrieb das Narrativ als einzigen Seiteninhalt. Tatsächlich
umgesetzt ist eine zweistufige Ansicht.

### 6.1 Zwei Fassungen, ein Umschalter

Die Szenario-Seite `/[exam]/szenarien/[nr]` zeigt zwei Fassungen desselben
Szenarios:

- **Kurz** (Default): der gefilterte Body aus `battle_card_N.md`.
- **Ausführlich**: das Narrativ aus `narrative.md`.

Umgeschaltet wird über den URL-Parameter `?v=lang`. Jeder andere Wert und ein
fehlender Parameter bedeuten *kurz*. Die URL ist der einzige Zustand — kein
`useState`, kein Sync-Effect.

**Der Umschalter erscheint nur, wenn `narrative.md` existiert.** Bei Karten ohne
Narrativ wird er nicht gerendert — keine deaktivierte Schaltfläche, kein
Hinweistext, und `?v=lang` bleibt dort wirkungslos.

Gemeinsam für beide Fassungen und nur einmal im DOM: Breadcrumb, Titel,
Signalwörter, PDF-Link, **die Battle Card** und der Prev/Next-Pager. Umgeschaltet
wird ausschließlich der Sektionsbereich darunter. Damit steht die Karte in beiden
Fassungen oben, und das SVG wird nicht doppelt ausgeliefert.

### 6.2 Aufbau der langen Ansicht

Unverändert gegenüber der ursprünglichen Fassung:

- **Standardmäßig offen:** `Die Grundidee zuerst` und
  `Wenn du dir eine Sache merkst`.
- **Eingeklappt:** alle übrigen, mit dem vollen H2-Text als Klapp-Titel —
  inklusive der variablen Suffixe nach `" — "`.
- **`Der Weg durch die Karte`** klappt als Ganzes auf, die H3 bleiben darin
  sichtbar.

Technisch native `<details>`/`<summary>`: kein JavaScript, Tastatur- und
Screenreader-Verhalten kommen vom Browser.

### 6.3 Der Notizfilter

`battle_card_N.md` enthält neben Lernstoff auch Produktionsnotizen —
Farbkonventionen, Faktencheck-Notizen, bewusste Vereinfachungen, „Nicht
bestätigt". Diese wandern **nicht** ins Frontend. Die Dateien bleiben
unangetastet, nur das Rendering filtert.

`classifySection()` in `src/lib/scenario-content.ts` klassifiziert jede H2 als
`learn`, `note` oder `unknown`. Die Prüfreihenfolge ist **Allow vor Block** und
bindend: `Faktencheck — Divergenzen zu älterem Kursmaterial` ist Lernstoff und
würde sonst vom Block-Präfix `faktencheck` verschluckt.

Bei `unknown` wird **gerendert** (fail-open, damit nie Lernstoff verschwindet);
stattdessen bricht der Guard-Test in `scenario-content.test.ts` und nennt
Kartennummer und Überschrift. Ein neuer Kartenbatch mit unbekannter Überschrift
erzwingt so eine bewusste Einordnung.

Stand 10.08.2026: 68 verschiedene H2-Namen über 100 Karten, davon 24 Namen mit
238 Sektionen als `note`, 44 Namen mit 479 Sektionen als `learn`, 0 `unknown`.

### 6.4 Bekannte Eigenschaft, kein Fehler

Der Umschalter liegt hinter einer `<Suspense>`-Grenze — ohne sie kippt
`useSearchParams()` die gesamte Route ins Client-Side-Rendering und die 100
prerenderten SSG-Pfade gehen verloren. Konsequenz: Im statischen HTML steht der
**Fallback**, also die Kurzfassung. Wer `?v=lang` direkt aufruft, sieht kurz die
kurze Fassung, bevor die lange erscheint.

Die Alternative wäre ein eigenes Route-Segment (`/szenarien/37/lang`) mit echtem
SSG für beide Fassungen. Bewusst nicht gebaut: zwei Routen und doppelte
`generateStaticParams` für ein kosmetisches Detail.

Ohne JavaScript ist die Kurzfassung sichtbar und die `<details>` klappbar.

---

## 7. Qualitätssicherung (`check.py`)

> **Platzhalter — Text im Project Knowledge.**
>
> **Wichtig seit 10.08.2026:** `check.py` ist nicht mehr nur
> Qualitätssicherung, sondern Vorbedingung fürs Deploy. Die App liest die
> Narrative direkt; ein Narrativ mit fehlender Pflicht-H2 oder falscher
> `cardNumber` lässt `readNarrative()` werfen und bricht den Build.

## 8. Weitere Abschnitte

> **Platzhalter — Text im Project Knowledge.**
> Die ursprüngliche Spec hat über §7 hinaus weitere Abschnitte (u. a. eine
> Selbstprüfungs-Checkliste, gegen die `HANDOFF-NARRATIVE-01` §6 prüft). Umfang
> und Nummerierung sind beim Übertragen aus dem Project Knowledge zu
> übernehmen.
