# CLAUDE.md — CertOps

> Projekt-spezifische Regeln für Claude Code. Globale Regeln aus `~/.claude/CLAUDE.md` gelten zusätzlich.
> **Aktueller Projekt-Stand steht im Handoff (CHAT-CONTEXT.md), nicht hier** — damit diese Datei nicht veraltet.

## Projekt
Persönliche Lern-App für AWS-Zertifizierungen (CLF-C02 zuerst, SAA-C03 später).
Stack: Next.js 16 (App Router), React 19, Tailwind 4, SQLite via Drizzle ORM, TypeScript strict, Vitest, pnpm.

## 🚨 Workflow (verbindlich)
- **Plan-Mode vor nicht-trivialen Tasks.** Plan zurückgeben, auf Freigabe warten.
- **Browser-Smoke-Test PFLICHT vor Commit.** Tests grün ≠ fertig.
- **Faktencheck via Web-Search PFLICHT** bei AWS-Inhalten (Services ändern sich).
- **Schlanke Outputs:** direkt liefern, kein "ich erkläre jetzt was ich mache".

## 💸 Token-Disziplin
- **`/clear` nach jedem abgeschlossenen + committeten Task.** Größter Spar-Hebel.
- **`/compact` früh** bei langen zusammenhängenden Tasks (nicht erst am Auto-Limit).
- **Präzise Prompts:** Datei + Zeilenbereich nennen, nicht explorieren lassen.
- **Reads minimal:** `view_range` nutzen, große Files nie komplett lesen.

## Design (nicht ändern ohne expliziten Auftrag)
- Schlank, monochrom zinc als Default, Tailwind utilities, hell-Modus.
- Akzent-Ausnahmen bewusst: gelbes Warndreieck (Schwache-zuerst), grüner/emerald Auswahl-Ring (ausgewählt), Stats-Farben rose/amber/emerald.
- **Domain-Farben (Karteikarten):** zentral in `src/lib/domain-colors.ts`. Klassen als explizite Strings (Tailwind-Purge).
  - Cloud Concepts → blue
  - Security and Compliance → rose
  - Cloud Technology and Services → violet
  - Billing, Pricing, and Support → amber
- **SAA-Skript-Kategorie-Palette (Mockup, freigegeben):** zentral in `src/lib/saa-script-categories.ts` (Accent-Hex verbatim; Tints theme-reaktiv via color-mix — Mockup-Pastell-bg bewusst verworfen, Dark-Mode-Kontrast). compute #7c3aed · storage #059669 · db #4f46e5 · net #2563eb · sec #dc2626 · int #db2777 · ana #0d9488 · mgmt #d97706 · mig #0891b2 · cost #65a30d.
- **Kein** Glassmorphism / Bento / OLED / Premium-Refactor.
- lucide-react für Icons, sparsam. Tastatur-Navigation muss erhalten bleiben.

## Architektur-Konventionen
- DB-Schema-Änderungen via Drizzle-Migrations (`pnpm db:generate` + `pnpm db:migrate`).
- Tests gegen `:memory:`-SQLite, keine Mocks.
- Server Components default; Client nur bei echter Interaktivität.
- Server Actions für DB-Schreibvorgänge, keine internen API Routes.
- Cookies via `next/headers`.

## Render-Toolchain (Battle Cards)
Die Battle-Card-Assets unter `public/scenarios/card-NN/` bestehen je Karte aus
`.svg` (Quelle), `.png` (2400 px breit) und `.pdf`. PNG und PDF werden aus der SVG
generiert, nicht von Hand gepflegt.

- **Setup:** `brew install cairo` (cairocffi linkt gegen die native Lib), dann
  `python3 -m venv .venv && .venv/bin/pip install -r requirements-render.txt`.
- **Versionen gepinnt** in `requirements-render.txt`: CairoSVG 2.9.0, Pillow 12.3.0.
- **Pillow ist bewusst mitgepinnt**, nicht nur als cairosvg-Abhängigkeit:
  `scripts/qc.py` misst Textbreiten über PIL (`text_bbox`). Eine andere
  Pillow-Version kann Bounding-Boxen verschieben und damit QC-Befunde erzeugen
  oder verschwinden lassen. qc.py deshalb über denselben Interpreter laufen
  lassen wie den Renderer.
- **`.venv/` ist ignoriert** und gehört nicht ins Repo.
- **Render:** `cairosvg.svg2png(url=..., output_width=2400)` + `svg2pdf(...)`.
  Danach R13 prüfen: reines `(0,0,0)` muss 0 px sein (Merksatz-y je Karte aus der
  SVG lesen, er liegt nicht immer gleich).

**Antialiasing-Stand (2026-07-19, abgeschlossen):** Alle 60 Karten sind mit
CairoSVG 2.9.0 gerendert und nutzen durchgängig **Graustufen-Antialiasing**.
Eine ältere Toolchain hatte mit Subpixel-AA gerendert, was farbige Glyphensäume
erzeugte (im Titelband ~9–10 % farbige Pixel, max. Kanaldivergenz 153). Das ist
bereinigt: Farbsaum-Endstand 0 von 60. Graustufen-AA ist für skalierte und
gedruckte Assets das korrektere Verhalten, weil Subpixel-Säume auf ein
bestimmtes Panel-Layout optimiert sind und beim Skalieren zu Farbartefakten
werden. Der Renderer ist bit-deterministisch — gleiche SVG plus gleiche Pins
ergibt dasselbe PNG.

**Neue oder neu gerenderte Karten prüfen:** Abmessung 2400×1350, R13 = 0 px,
und Kanaldivergenz im Titelband = 0 (Subpixel-AA-Regression). Titelband ist
SVG y 38–104, x 60–1500 — dort steht nur dunkler Text auf Weiß. Die Untergrenze
104 ist nicht beliebig: Karte 51 hat oranges `Replay ab Zeitpunkt` bei y=118
(Oberkante 106), Karte 22 rotes `Failover 60–120 s…` bei y=127 (Oberkante 115).
Ein weiteres Band schlägt auf diesen beiden fälschlich an.

## Architektur-Entscheidungen (bewusst)
- **Skript-Speichermodell-Split:** CLF-Skript bleibt dateibasiert (13 Kapitel, `src/content/skript/`, voll statisch); SAA-Skripte liegen als DB-Content in der `scripts`-Tabelle (137 Dienst-Skripte, geseedet aus `src/db/seed/saa-scripts/*.md` via seed_key-Upsert) — sie teilen Lifecycle/Tooling mit dem übrigen SAA-Seed-Content, nicht mit dem CLF-Kapitel-Buch.
- **SAA-Skript-Navigation = Kategorie-Kapitel (Schema B, freigegeben 2026-07-16):** bewusste Abkehr von der Blueprint-Notiz „CLF-Kategorienstruktur nicht kopieren". 10 Kategorien als Navigation (`/saa/skript` Grid → `/saa/skript/kategorie/<catKey>`), Prüfungs-Domänen D1–D4 bleiben als Chips AM Dienst. Mapping + Kategorie-Metadaten statisch in `src/lib/saa-script-categories.ts` (kein DB-Column — YAGNI, solange DB-seitig nicht gefiltert wird); Partition guard-getestet.
- **Zwei SAA-Lese-Oberflächen (bewusst, reversibel):** Die Kategorie-Seite (`/saa/skript/kategorie/<catKey>`) ist eine gestapelte CLF-artige Leseseite (alle Skripte der Kategorie voll gerendert, TOC mit In-Page-Ankern; Sektion-IDs unter dem Dienst-Slug genamespaced via `stackedAnchorId`, guard-getestet). Die Standalone-Detailseiten `/saa/skript/<slug>` bleiben zusätzlich bestehen (Deep-Links + dynamic-params-Fix). Falls eine der beiden Oberflächen wegfallen soll: additiv gebaut, unabhängig entfernbar.

## Bekannte Schuld (dokumentiert, niedrig-Prio)
- SAA-Skripte ohne TTS (bewusst verschoben). Nachrüst-Skizze: `resolveSegmentMarkdown` um einen DB-Zweig für SAA-Slugs erweitern (Abuse-Guard bleibt „nur geseedeter Content erreichbar"), Cache-Pfad `tts/saa/{slug}/{section}-{hash}.mp3`, content-addressed Hash unverändert.
- `source_ref`-Upsert statt TRUNCATE+INSERT (Stats-Reset bei Reseed).
- Dashboard-Karteikarten-Untertitel „Compute & Storage" veraltet.
- Stale Round-Cookie bei Reseed → notFound (akzeptabler Dev-Edge-Case).
- proxy.ts-Migration (kosmetisch).
- Switcher-Pill nutzt blue (sonst Cloud-Concepts) / rose (sonst Security) bewusst doppelt — Profil-Branding-Kontext, nicht Domain-Farbe (`src/lib/profile-branding.ts`).

## Out of Scope (bewusst nicht jetzt)
- Riesen-Batches (195 Fragen / 150 Karten in einem Lauf).
- UI-Premium-Refactor. Autonomer Modus ohne Plan-Review.
