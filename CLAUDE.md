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
- **SAA-Skript-Kategorie-Palette (Mockup, freigegeben):** zentral in `src/lib/saa-script-categories.ts` (accent/bg-Hex verbatim). compute #7c3aed · storage #059669 · db #4f46e5 · net #2563eb · sec #dc2626 · int #db2777 · ana #0d9488 · mgmt #d97706 · mig #0891b2 · cost #65a30d.
- **Kein** Glassmorphism / Bento / OLED / Premium-Refactor.
- lucide-react für Icons, sparsam. Tastatur-Navigation muss erhalten bleiben.

## Architektur-Konventionen
- DB-Schema-Änderungen via Drizzle-Migrations (`pnpm db:generate` + `pnpm db:migrate`).
- Tests gegen `:memory:`-SQLite, keine Mocks.
- Server Components default; Client nur bei echter Interaktivität.
- Server Actions für DB-Schreibvorgänge, keine internen API Routes.
- Cookies via `next/headers`.

## Architektur-Entscheidungen (bewusst)
- **Skript-Speichermodell-Split:** CLF-Skript bleibt dateibasiert (13 Kapitel, `src/content/skript/`, voll statisch); SAA-Skripte liegen als DB-Content in der `scripts`-Tabelle (137 Dienst-Skripte, geseedet aus `src/db/seed/saa-scripts/*.md` via seed_key-Upsert) — sie teilen Lifecycle/Tooling mit dem übrigen SAA-Seed-Content, nicht mit dem CLF-Kapitel-Buch.
- **SAA-Skript-Navigation = Kategorie-Kapitel (Schema B, freigegeben 2026-07-16):** bewusste Abkehr von der Blueprint-Notiz „CLF-Kategorienstruktur nicht kopieren". 10 Kategorien als Navigation (`/saa/skript` Grid → `/saa/skript/kategorie/<catKey>`), Prüfungs-Domänen D1–D4 bleiben als Chips AM Dienst. Mapping + Kategorie-Metadaten statisch in `src/lib/saa-script-categories.ts` (kein DB-Column — YAGNI, solange DB-seitig nicht gefiltert wird); Partition guard-getestet.

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
