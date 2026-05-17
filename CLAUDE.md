# CLAUDE.md – [PROJEKT-NAME]

> Projekt-spezifische Anweisungen. Globale Regeln gelten zusätzlich
> aus `~/.claude/CLAUDE.md` und müssen hier nicht wiederholt werden.

## Projekt-Steckbrief

- **Name:**
- **Zweck (1 Satz):**
- **Stadium:** _Prototyp / MVP / Production / Maintenance_
- **Repo:**
- **Deployment-Ziele:** _z.B. AWS account 1234..., eu-central-1_

## Stack

- **Sprache(n):**
- **Framework(s):**
- **Datenbank:**
- **Cloud / Services:**
- **IaC:** _Terraform / CDK / SAM / manuell_
- **CI/CD:** _GitHub Actions / CodePipeline / ..._

## Architektur (kurz)

[2-5 Sätze zur Topologie. Wenn das Projekt komplex genug ist,
ein ASCII-Diagramm hier oder Verweis auf `docs/architecture.md`.]

## Wichtige Befehle

```bash
# Setup
make install              # einmaliges Setup

# Development
make dev                  # lokaler Server / watch

# Tests
make test                 # alle Tests
make test-unit
make test-integration
make lint
make typecheck

# Infrastructure
make plan                 # terraform plan / cdk diff
make deploy-staging
make deploy-prod          # NUR mit Doppel-Bestätigung

# DB
make db-migrate
make db-seed
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
