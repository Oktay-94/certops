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
- **Kein** Glassmorphism / Bento / OLED / Premium-Refactor.
- lucide-react für Icons, sparsam. Tastatur-Navigation muss erhalten bleiben.

## Architektur-Konventionen
- DB-Schema-Änderungen via Drizzle-Migrations (`pnpm db:generate` + `pnpm db:migrate`).
- Tests gegen `:memory:`-SQLite, keine Mocks.
- Server Components default; Client nur bei echter Interaktivität.
- Server Actions für DB-Schreibvorgänge, keine internen API Routes.
- Cookies via `next/headers`.

## Bekannte Schuld (dokumentiert, niedrig-Prio)
- `source_ref`-Upsert statt TRUNCATE+INSERT (Stats-Reset bei Reseed).
- Dashboard-Karteikarten-Untertitel „Compute & Storage" veraltet.
- Stale Round-Cookie bei Reseed → notFound (akzeptabler Dev-Edge-Case).
- proxy.ts-Migration (kosmetisch).

## Out of Scope (bewusst nicht jetzt)
- Riesen-Batches (195 Fragen / 150 Karten in einem Lauf).
- UI-Premium-Refactor. Autonomer Modus ohne Plan-Review.
