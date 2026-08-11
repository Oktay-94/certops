# Auftrag: Narrative-Integration + Notizfilter (Plan-Mode)

Bitte zuerst Plan-Mode. Nichts implementieren, bevor der Plan bestätigt ist.

## Ausgangslage (verifiziert, nicht annehmen — bereits geprüft)

- `SCENARIO_COUNT` ist **100**, alle 100 Pfade werden prerendert (SSG).
- `public/scenarios/card-NN/narrative.md` existiert für **Karten 1–39**. Karten 40–100 haben **keine** Datei. Das ist der Normalzustand, kein Fehler.
- `src/lib/scenario-content.ts` (135 Zeilen) liest `battle_card_N.md` mit gray-matter, strippt die H1 und gibt `{ meta, body }` zurück. Es gibt dort **kein** Sektions-Splitting.
- `src/app/[exam]/szenarien/[nr]/page.tsx` (180 Zeilen) ruft `splitChapter` aus `@/lib/skript-content` auf den Body und rendert jede Sektion als `<article>` mit `SkriptMarkdown`. **Es wird nichts gefiltert.**
- Damit sind aktuell 238 Sektionen mit reinen Produktionsnotizen im Frontend sichtbar (Farbkonventionen, Faktencheck-Notizen, Bewusste Vereinfachungen usw.).
- Hausstil in `scenario-content.ts`: ungültiges Frontmatter wirft, damit der Build laut scheitert.

## Vier Phasen

Phase 1 (Dateien ins Repo) ist **bereits erledigt** — 39 `narrative.md` liegen im Repo, Build ist grün.

---

### Phase 2 — Notizfilter in `scenario-content.ts`

Ziel: Produktionsnotizen erscheinen nicht mehr im Frontend. Sie bleiben unverändert in den `.md`-Dateien — nur das Rendering ändert sich. Gleiches Prinzip wie bei `status_note`.

**Neue exportierte Funktion**, z. B. `classifySection(heading: string): "learn" | "note" | "unknown"`.

Normalisierung vor dem Vergleich, in dieser Reihenfolge:
1. trimmen
2. führende Nicht-Wort-Zeichen entfernen (Emoji/Warnzeichen wie `🔴`, `⚠️`, `⚠`) — Klammern dabei nicht entfernen
3. lowercase
4. Umlaute falten: `ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`
5. Em-Dash `—` und En-Dash `–` zu `-`
6. Mehrfach-Whitespace zu einem Space

**Reihenfolge der Prüfung ist bindend: Allow vor Block.** Andernfalls verschluckt das Präfix `faktencheck` die Divergenz-Sektion, die Lernstoff ist.

```
ALLOW_PREFIX = ["szenario", "ablauf", "pruefungs-kernsatz", "klassiker-fallen",
  "abgrenzung", "faktencheck - divergenzen", "nachtrag zur abgrenzung", "rand",
  "die ", "pflicht-abgrenzung", "divergenzen", "aktueller service-status",
  "vorbemerkung"]

BLOCK_EXACT = ["faktencheck"]

BLOCK_PREFIX = ["bewusste vereinfachungen", "farbkonvention", "farben",
  "faktencheck-notizen", "faktencheck-quellen", "faktenlage geprueft",
  "nicht bestaetigt", "korrektur", "werkzeug-learning", "vorschlag fuer batch",
  "abweichung vom masterplan", "technische notiz", "ausblick, bewusst nicht"]
```

Regel: Allow-Präfix trifft → `learn`. Sonst Block-Exact oder Block-Präfix → `note`. Sonst → `unknown`.

**Verhalten bei `unknown`: rendern wie `learn`.** Zur Laufzeit fail-open, damit nie versehentlich Lernstoff verschwindet. Der Guard-Test schlägt dafür fehl (siehe Phase 5).

Diese Listen sind gegen alle 69 real vorkommenden H2-Namen über alle 100 Karten getestet: 0 unbekannt, 24 Namen mit 238 Sektionen als `note`, 44 Namen mit 479 Sektionen als `learn`.

Die Filterung greift dort, wo `page.tsx` heute `splitChapter` auswertet. Ob der Filter in `scenario-content.ts` oder in der Seite sitzt, entscheidest du — er darf nur an **einer** Stelle stehen.

---

### Phase 3 — Narrativ-Leser

**Neue Funktion** `readNarrative(nr: number): Narrative | null` in `scenario-content.ts`.

- Datei `public/scenarios/card-NN/narrative.md` (zweistellig gepolstert wie bei den Assets, Karte 100 dreistellig — die vorhandene `scenarioSlug`-Logik wiederverwenden, keinen zweiten Padding-Weg bauen).
- **Datei fehlt → `null` zurückgeben. Niemals werfen.** `fs.existsSync` oder `try/catch` auf `ENOENT`; andere Fehler durchreichen.
- **Datei vorhanden, Frontmatter ungültig → werfen**, im Stil der bestehenden `requireString`-Helfer. Pflichtfelder: `cardNumber`, `slug`, `title`, `services`, `domains`, `badgeCount`, `narrativeVersion`, `factCheckedAt`, `sources`.
- `cardNumber` im Frontmatter muss dem `nr`-Argument entsprechen, sonst werfen.
- Body in Sektionen zerlegen. Die neun kanonischen H2 sind garantiert vorhanden und in fester Reihenfolge (durch `check.py` erzwungen), variable Suffixe nach `" — "` werden beim Key-Vergleich abgeschnitten:

```
Die Grundidee zuerst · Was es eigentlich ist · Der Weg durch die Karte ·
Die entscheidende Unterscheidung · Die ehrliche Feinheit · Syntax lesen ·
Was du dadurch nicht baust · Wenn du dir eine Sache merkst · Prüfungsknackpunkte
```

Zwei davon sind optional und können fehlen: `Die entscheidende Unterscheidung` und `Syntax lesen`. Die anderen sieben sind Pflicht.

Die H3 unter `Der Weg durch die Karte` bleiben im Markdown der Sektion — nicht separat zerlegen, `SkriptMarkdown` rendert sie.

**Wichtig:** `listScenarios()` iteriert über alle 100 und wird von `generateStaticParams` benutzt. Wenn `readNarrative` bei Karte 40 wirft, bricht der Build im Prerendering. Der Test dazu ist Pflicht.

---

### Phase 4 — UI

**Die Seite bleibt Server Component und SSG.** Keine `searchParams` in der Server Component lesen — das macht die Route dynamisch und kostet alle 100 prerenderten Pfade (derselbe Fehlertyp wie damals bei den SAA-Detailseiten unter `next start`).

Stattdessen:
- Server Component rendert **beide** Fassungen ins HTML, die inaktive versteckt.
- Kleine Client-Komponente liest `useSearchParams()` und schaltet die Sichtbarkeit um. **Zwingend in `<Suspense>` gewrappt**, sonst kippt der Build die Seite ins Client-Rendering.
- Parameter: `?v=lang`. Ohne Parameter oder bei jedem anderen Wert gilt kurz.
- Umschalten aktualisiert die URL per `router.replace` mit `scroll: false`.

**Der Umschalter wird nur gerendert, wenn `narrative !== null`.** Bei Karten 40–100 erscheint er nicht — keine deaktivierte Schaltfläche, kein Hinweistext.

**Kurze Ansicht:** wie heute, aber ohne die `note`-Sektionen.

**Lange Ansicht** nach NARRATIVE-SPEC §6:
- offen: `Die Grundidee zuerst` und `Wenn du dir eine Sache merkst`
- eingeklappt: alle übrigen, H2 als Klapp-Titel
- `Der Weg durch die Karte` klappt als Ganzes auf, die H3 bleiben darin sichtbar
- die Battle Card steht über dem Narrativ

Bestehende Bausteine wiederverwenden: `SkriptMarkdown` für das Rendering, `anchorPrefix` gegen Anker-Kollisionen zwischen den beiden Fassungen. Keine neuen Farben — die Token aus dem bestehenden `data-theme × data-exam`-System.

---

### Phase 5 — Guard-Tests

In `src/lib/scenario-content.test.ts` erweitern, gegen `:memory:` bzw. als reine Dateiprüfung, keine Mocks.

1. **Kein `unknown`:** Über alle 100 `battle_card_N.md` klassifiziert jede H2 als `learn` oder `note`. Bei `unknown` schlägt der Test fehl und nennt Kartennummer und Überschrift. Das ist die Verrottungsbremse — der nächste Kartenbatch mit neuer Notiz-Überschrift wird zur Einordnung gezwungen.
2. **Filter greift:** Keine gerenderte Sektion trägt eine als `note` klassifizierte Überschrift, über alle 100 Karten.
3. **Fehlende Datei:** `readNarrative(40)` gibt `null` zurück und wirft nicht. Für alle Nummern ohne Datei.
4. **Vorhandene Datei:** `readNarrative(1..39)` liefert ein Objekt, `cardNumber` passt zur Nummer, die sieben Pflicht-H2 sind vorhanden.
5. **Slug-Kollisionen:** Die 39 Narrativ-Slugs sind untereinander eindeutig und kollidieren mit keinem `seed_key` anderer Content-Arten (questions, flashcards, scripts) — dasselbe Muster wie beim Skript-Track.
6. **Build-Sicherheit:** `listScenarios()` läuft über alle 100 durch, ohne zu werfen.

---

## Was nicht gemacht wird

- Keine DB-Migration, keine neue Tabelle, kein Seed. Dateibasiert bleibt dateibasiert.
- Kein Anfassen der `.md`-Dateien. Notizen bleiben drin, sie werden nur nicht gerendert.
- Kein Ändern von `SCENARIO_COUNT`.
- Keine neue Dependency.
- Kein zweiter Slugger und kein zweiter Padding-Weg.

## Reihenfolge und Commits

Phase 2 ist unabhängig vom Rest und für sich wertvoll — sie räumt die Seite auf, die heute schon benutzt wird. Deshalb als **eigener Commit zuerst**, danach Phase 3 + 4 + 5 zusammen.

Nach jeder Phase `pnpm build` und prüfen, dass unter `/[exam]/szenarien/[nr]` weiterhin **100 Pfade** prerendert werden. Fällt die Zahl, ist die Route dynamisch geworden — dann stoppen, nicht weiterbauen.

## Browser-Smoke vor Commit-Akzeptanz

- `/saa/szenarien/37` — Umschalter da, kurze Fassung ohne Farbkonventionen und ohne Faktencheck-Notizen
- `/saa/szenarien/37?v=lang` — lange Fassung, Grundidee und Merksatz offen, Rest eingeklappt
- `/saa/szenarien/45` — kein Umschalter, Seite lädt normal
- `/saa/szenarien/100` — kein Umschalter, dreistellige Nummer funktioniert
- 360px Fensterbreite: kein horizontaler Overflow, Umschalter tappbar
