# CertOps Redesign v2 + SAA-Erweiterung — Implementierungsplan

> **Handoff Chat-Claude → Oktay → Code-Claude.** Leitprinzip: **Re-Skin statt Rewrite.**
> Bestehende Logik (quiz-logic, Karten, Statistik-Queries, slugifyHeading, TTS) bleibt UNANGETASTET —
> nur die Präsentationsschicht wechselt auf das neue Token-System.
> Referenz-Mockups: `certops-redesign-v2.html`, `certops-statistik-v3.html`,
> `certops-diagramm-quiz.html`, `certops-weitere-seiten.html` (liegen bei Oktay).
> Jede Phase = eigener PR, Weg A (kein Stapeln). Plan-Mode vor jeder Phase, Browser-Smoke am
> ECHTEN Handy vor Merge, kein Self-Merge.

---

## Phase 0 — Vorarbeiten (VOR allem anderen)

**0a. seed_key-Backfill gegen Live-Turso (HOCH, blockiert Phase 7).**
Live hat das Schema, aber NULL-Werte. Backfill-Script schreiben (Match über bestehende
eindeutige Felder), gegen Live ausführen, danach Test-Reseed verifizieren (kein Duplikat).
Bis dahin gilt weiter: **kein `pnpm db:seed` gegen Live.**

**0b. Terminal-Startverzeichnis fixen (kein Code, 5 min).**
„Neue Fenster öffnen mit" → festes Verzeichnis. Wurzelursache der Session-Verwechsler.
`pwd`-Ritual vor jedem zustandsändernden Befehl bleibt Pflicht.

---

## Phase 1 — Design-Fundament (PR: `feat/design-tokens`)

Kein sichtbarer Seiten-Umbau — nur Fundament. Muss klein und sauber sein.

- **Fonts:** `geist`-Package, Geist Sans + Geist Mono via `next/font` (self-hosted, kein CDN).
- **Token-System:** CSS-Variablen als Single-Source in `src/lib/design-tokens.ts` + globals.css.
  Vier Achsen-Kombis: `data-theme` (light/dark) × `data-exam` (clf/saa).
  Werte 1:1 aus den Mockups übernehmen (Canvas/Surface/Border-Leitern, luminance stacking im
  Dark Mode, Squid-Ink `#141a24`, Blueprint-Grid-Var, Domain-Farben aus `domain-colors.ts`
  WEITERVERWENDEN — keine zweite Farbquelle einführen).
- **Theme-Toggle:** Header-Komponente, Persistenz via Cookie (SSR-lesbar, kein Flash),
  Default = `prefers-color-scheme`. `data-exam` bleibt in Phase 1 hart auf `clf`.
- **DESIGN.md** ins Repo: Tokens, Spacing-/Radius-Leiter (4/8/12/16/24/48; Cards 12px,
  Buttons 8px, Pill), Motion-Timings (120–200ms, nichts bouncy), Anti-Slop-Regeln
  (kein Purple-Gradient, kein Glassmorphism, Orange nur als Signal, hairline-Borders statt Schatten).
- **Gate:** lint · tsc · alle 248 Tests grün · build · SSG-Status aller Seiten UNVERÄNDERT.

## Phase 2 — Dashboard + Bereiche-Kacheln (PR: `feat/dashboard-v2`)

- Bento-Grid-Dashboard nach Mockup: Readiness-Ring (custom SVG mit Maß-Ticks),
  Aktivitäts-Heatmap (custom SVG/CSS, Luminanz-Stufen), Streak-Kachel, Next-up,
  passive Topic-Map (SVG, 2pt, rechte Winkel, Open-Arrow, gestrichelter Gruppen-Container).
- Bereiche-Kacheln mit Live-Mini-Previews (Hover: Quiz-Option färbt, Karte flippt,
  Skript scrollt). Preview-Inhalte statisch/hartkodiert — KEINE Live-Daten nötig.
- **Dependency neu:** `motion` — ausschließlich via `LazyMotion` + `m` (~4.6KB initial).
  Stagger-Reveals, sonst nichts. Begründung im PR-Body.
- Scroll-reaktiver Hintergrund (Grid-Parallaxe + Glow) als CSS-Vars + passiver
  Scroll-Listener; `prefers-reduced-motion` deaktiviert alles.
- CLF-Daten live anbinden (bestehende Queries), CLF-„Bestanden"-Zustand:
  Zertifikats-Kachel + `canvas-confetti` via `next/dynamic` (ssr:false, 0 KB initial).
- **Gate:** wie Phase 1 + Lighthouse-Mobile-Check: Total-JS < 200KB gzipped, LCP < 2s.

## Phase 3 — Statistik-Re-Skin (PR: `feat/stats-v2`)

- **Funktionsumfang = exakt Bestand** (Sparkline-KPI, Beantwortet-Zähler, Nach Bereich mit
  Domain-Farben + Lernziel-70%-Marker, Schwächste Fragen mit Fragentext + Klick-zur-Frage,
  Verlauf R1–R5 mit Ø- und Lernziel-Linie, Letzte Runde/Schnitt, Falsch/Richtig-Tabs).
  Queries/Datenfluss NICHT anfassen — nur Markup/Styling auf Tokens umziehen.
- Charts: custom SVG (wie Mockup). Keine Chart-Library einführen, solange custom reicht.
- Zusätzlich aus v2-Mockup: Hartnäckigste Schwachstellen, Heatmap.
- **Gate:** Statistik-Werte vor/nach Re-Skin identisch (Smoke mit echten Daten).

## Phase 4 — Quiz, Karteikarten, Dienste Re-Skin (3 kleine PRs)

- **Karteikarten: Funktionen 1:1 wie ALT** (Oktays explizite Vorgabe). Bestehende
  Komponente behalten, nur Tokens/Typo/Radien/Borders anwenden. Flip-Verhalten,
  Fortschritt, Bedienung unverändert. Nach Merge: Screenshot an Chat-Claude zum Abgleich.
- Quiz: Setup (Umfang & Fokus) + Fragen-Flow re-skinnen, `quiz-logic.ts` unangetastet.
- Dienste (172, freies Üben): Card-Flip, Battle, Puzzle — nur Optik.
- **Gate je PR:** bestehende Tests grün, kein Verhaltens-Diff.

## Phase 5 — Skript + Übersicht Re-Skin (PR: `feat/skript-v2`)

⚠️ Vorsichtigste Phase. **Invarianten:**
- `slugifyHeading` / h2-id-Kette / `skriptRef`-Deep-Links UNANGETASTET (Anchor-Test = Beweis).
- Emoji-vor-h2-Muster, `lang="de"`-Scope, `[overflow-wrap:anywhere]`-Fixes (#21) erhalten.
- TTS (#22): Buttons/Player nur umstylen, `/api/tts` + Cache-Keys unberührt
  (Content-Hash: Markdown-Text ändert sich nicht → keine Blob-Invalidierung).
- Übersicht: Suchfeld + Zeilen re-skinnen, `uebersicht-search.ts` unangetastet.
- **Gate:** 248 Tests + Anchor-Test grün, SSG-Gate (`● prerendered`, `/api/tts` = ƒ),
  Prod-Smoke am Handy inkl. K3/K9-Overflow-Regression.

## Phase 6 — Exam-Switcher + SAA-Gerüst (PR: `feat/exam-scoping`)

- **Datenmodell:** `exam`-Diskriminator (`'clf' | 'saa'`) an Fragen/Karten/Statistik.
  Migration additiv, Bestandsdaten = `'clf'`. SAA-Domain-Strings EXAKT:
  `Design Secure Architectures`, `Design Resilient Architectures`,
  `Design High-Performing Architectures`, `Design Cost-Optimized Architectures`.
- **Routen:** exam-präfixiert `/clf/*` + `/saa/*` (Redirects von Alt-Pfaden auf `/clf/*`).
  Geteilte Bereiche bleiben präfixfrei: `/skript`, `/uebersicht`.
  **Switcher = Navigation zwischen Präfixen**, nicht globaler Client-State →
  Deep-Links bleiben eindeutig, SSG bleibt SSG.
- View Transition beim Switch (Progressive Enhancement, Fallback ohne).
- CLF-Statistik-Regression = höchstes Risiko dieser Phase → Snapshot-Vergleich vor/nach.

## Phase 7 — SAA-Content + Diagramm-Quiz (mehrere PRs, größter Posten)

- **7a. SAA-Fragenpool** (Ziel ~200, Batches à 50): szenario-basiert, Faktencheck via
  Web-Search PFLICHT pro Frage, `seedKey`-Literale, Seed erst NACH Phase 0a.
- **7b. Diagramm-Quiz:** eigener, sauber geplanter Task (Plan-Mode zwingend).
  Klick-zu-Setzen als primäre Interaktion (touch-sicher), Drag als Enhancement.
  Teilpunkte, Warum-Erklärung, speist dieselbe Statistik wie das Szenario-Quiz
  (Produktentscheidung, abgenommen). Datenformat: Szenario-JSON mit Slots/Lösungen/Ablenkern.
- **7c. SAA-Flashcards** (Confidence-Rating nutzt bestehendes Karten-System + exam-Feld).

## Stufe „Wow" (optional, nach Phase 6, nur wenn Perf-Budget hält)

- `cmdk` Command Palette (⌘K: Track wechseln, Bereiche, Quiz starten).
- R3F/Rive: **NICHT einführen** (Report-Empfehlung: Bundle-Kosten rechtfertigen sich nicht).

---

## Dependencies (abschließend, jede mit Begründung im PR)
`geist` (Fonts) · `motion` (nur LazyMotion+m) · `canvas-confetti` (dynamic import) ·
`cmdk` (optional, Stufe Wow). Sonst NICHTS Neues — Charts/Heatmap/Ring/Topic-Map = custom SVG.

## Offene Schulden, die dieser Plan NICHT löst (bewusst)
Branch-Protection (GitHub Free), Pre-Public-Cleanup (vor Bewerbungen),
Free-Tier-Content-Reseed, ElevenLabs-Plan-Entscheidung, verwaiste TTS-Blobs.

## Abbruchkriterien
Lighthouse-Mobile LCP > 2s oder JS > 200KB gzipped → Motion strikt reduzieren,
Effekte streichen. pnpm-„Moving …"-Warnung → SOFORT Ctrl+C (falsches Projekt!).
