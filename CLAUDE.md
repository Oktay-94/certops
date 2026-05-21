# CLAUDE.md — CertOps

> Projekt-spezifische Anweisungen für Claude Code (Terminal).
> Globale Regeln aus `~/.claude/CLAUDE.md` gelten zusätzlich.

## Projekt
- **Zweck:** Persönliche Lern-App für AWS-Zertifizierungen (CLF-C02 zuerst, SAA-C03 später).
- **Stack:** Next.js 16 (App Router), React 19, Tailwind 4, SQLite via Drizzle ORM, TypeScript strict, Vitest.
- **Stand:** 64 verifizierte CLF-C02-Fragen, Quiz-Modul lauffähig, Tests grün.

## 🚨 Workflow-Regeln (verbindlich)
- **Plan-Mode IMMER vor nicht-trivialen Tasks.** Plan zurückgeben, auf User-Feedback warten.
- **Browser-Smoke-Test PFLICHT vor Commit.** Tests grün ≠ fertig.
- **Faktencheck via Web-Search PFLICHT** bei AWS-Inhalten (Services ändern sich).
- **Schlanke Outputs:** kein "ich erkläre dir jetzt was ich mache" — direkt liefern.
- **Token-bewusst arbeiten:** Reads auf große Files minimal halten, `view_range` nutzen, `/clear` nach abgeschlossenen Tasks.

## Design
- **Bestehender Stil bleibt:** schlank, monochrom (zinc), Tailwind utilities, hell-Modus.
- **Kein OLED/Glassmorphism/Bento-Grid-Refactor.** Nicht jetzt.
- **Lucide-react für Icons** sparsam wenn nötig.
- **Tastatur-Navigation** muss erhalten bleiben (siehe `QuestionCard`).

## Architektur-Konventionen
- DB-Schema-Änderungen via Drizzle-Migrations (`pnpm db:generate` + `pnpm db:migrate`).
- Tests gegen `:memory:`-SQLite, nicht Mocks.
- Server Components default, Client nur bei echter Interaktivität.
- Server Actions für DB-Schreibvorgänge, keine internen API Routes.
- Cookies via `next/headers` in Server Components/Actions/Middleware.

## Bekannte Schuld (priorisiert)
- `src/db/seed.ts` zu groß (~1360 Zeilen) → splitten in `src/db/seed/{cloud-concepts,security,cloud-tech,billing,index}.ts`. **Task 1 der Roadmap.**
- Section-Banner mit veralteten Counts → mit Split mit-aufräumen.
- `source_ref`-Upsert statt TRUNCATE+INSERT → ab Stats-Session.
- `proxy.ts`-Migration (Next.js 16) → kosmetisch.

## Out of Scope (bewusst nicht jetzt)
- 195 Fragen pro Zertifikat in einem Lauf
- 150 Karteikarten in einem Lauf
- UI-Premium-Refactor
- Autonomer Modus ohne Plan-Review