# CLAUDE.md – CertOps

> Projekt-spezifische Anweisungen. Globale Regeln gelten zusätzlich
> aus `~/.claude/CLAUDE.md` und müssen hier nicht wiederholt werden.

## Projekt-Steckbrief

- **Name:** CertOps
- **Zweck (1 Satz):** Persönliche Lern-App zur Vorbereitung auf AWS-Zertifizierungen (CLF-C02, dann SAA-C03) mit Quiz, Schwachstellen-Tracking, Lab-Tagebuch und Karteikarten.
- **Stadium:** Greenfield / Prototyp — Single-User (nur Oktay) in Phase 1
- **Repo:** lokal (noch kein Remote)
- **Deployment-Ziele:** später Vercel Free Tier; lokal-only bis MVP steht
- **Roadmap-Hinweis:** spätere Optionen offenhalten: Multi-User, weitere Cert-Pfade, KI-generierte Fragen, evtl. SaaS — Phase 1 bewusst klein halten, aber keine Datenmodell-Sackgassen.
- **Timeline:** ~47 Tage bis CLF-C02 (Ziel: 2026-07-03), danach SAA-C03

## Stack

- **Sprache(n):** TypeScript (strict)
- **Framework(s):** Next.js 14+ (App Router), React, Tailwind CSS
- **Datenbank:** SQLite lokal via Drizzle ORM — Schema so halten, dass Postgres-Migration später schmerzfrei ist (keine SQLite-only Tricks)
- **Cloud / Services:** keiner aktiv; AWS-Lernen läuft über Whizlabs + Canvas Labs (kein eigener AWS-Account)
- **IaC:** entfällt in Phase 1
- **CI/CD:** entfällt; später ggf. GitHub Actions + Vercel
- **Tests:** Vitest
- **Package Manager:** pnpm

## Architektur (kurz)

Monolithische Next.js-App (App Router) — Server Components + Route Handlers für API, React Client Components nur wo nötig (Quiz-Interaktion, Karteikarten-Flip). Drizzle ORM spricht lokal gegen eine SQLite-Datei; das Schema ist so generisch gehalten, dass ein späterer Wechsel auf Postgres (Neon/Supabase/RDS) nur Connection-String + Driver-Tausch bedeutet. Keine separate Backend-Schicht in Phase 1 — Server Actions und Route Handlers reichen für Single-User.

## Wichtige Befehle

```bash
# Setup
pnpm install

# Development
pnpm dev                  # Next.js dev server (http://localhost:3000)
pnpm build                # Production build
pnpm start                # Production server lokal

# Tests & Qualität
pnpm test                 # Vitest (watch)
pnpm test:run             # Vitest single run (CI-Modus)
pnpm lint                 # next lint / eslint
pnpm typecheck            # tsc --noEmit

# Datenbank (Drizzle)
pnpm db:generate          # Migrations aus Schema generieren
pnpm db:migrate           # Migrations anwenden
pnpm db:studio            # Drizzle Studio (DB-GUI)
pnpm db:seed              # Seed-Daten (z.B. CLF-C02 Fragen-Stamm)
```

## Konventionen in DIESEM Projekt

- **Branches:** `feat/<ticket>-kurz-beschreibung`, `fix/...`, `chore/...`
- **Commits:** Conventional Commits
- **PRs:** Squash-Merge, Titel = Conventional Commit Summary
- **Code-Style:** [Verweis auf `.editorconfig`, `ruff.toml`, etc.]

## Domain-Wissen & Gotchas

[Sachen, die NICHT aus dem Code offensichtlich sind. Beispiele:]

- Die `user_id`-Spalte ist NICHT der Primary Key – der heißt `id`.
  `user_id` ist die externe Kennung aus Cognito.
- Das `notifications`-Modul nutzt SQS, nicht direkt SNS – wegen
  Retry-Logik und DLQ.
- Lokale Entwicklung braucht `LOCALSTACK_ENDPOINT=http://localhost:4566`
  in der `.env.local`.
- Die Lambda-Bundle-Größe MUSS unter 5MB bleiben (Cold-Start).

## Was wir hier explizit NICHT tun

[Sachen, die in diesem Projekt vermieden werden, mit Grund]

- Keine direkten SQL-Queries in Handlern – alles über Repository-Layer.
- Kein `console.log` in Lambda – nur strukturiertes Logging via `pino`.
- Keine synchronen Cross-Service-Aufrufe – immer über Events.

## Aktuelle Baustellen

[Was gerade in Arbeit ist. Hilft dem nächsten Session-Start.
Updaten oder löschen, wenn nicht mehr relevant.]

- [ ]
- [ ]
