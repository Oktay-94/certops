#!/usr/bin/env bash
# PreToolUse(Bash) guard — Layer 2 of defense-in-depth (deny-rules are Layer 1).
# FAIL-CLOSED: any uncertainty (missing jq, unparsable JSON, empty command) blocks.
# Exit 2 + reason on stderr = Claude Code blocks the tool call.
set -uo pipefail

block() {
  echo "bash-guard: BLOCKED — $1" >&2
  exit 2
}

# Read stdin once.
input=$(cat)

# jq must exist (fail-closed if not).
command -v jq >/dev/null 2>&1 || block "jq not found (fail-closed)"

# Extract the command; -e makes jq exit non-zero on null/missing → fail-closed.
cmd=$(printf '%s' "$input" | jq -er '.tool_input.command' 2>/dev/null) \
  || block "stdin JSON has no .tool_input.command (fail-closed)"

# --- rm with recursive + force (any order, long/short, case-insensitive R for macOS) ---
# Short flags clustered, e.g. -rf / -Rf / -fr — recursive then force OR force then recursive.
if printf '%s' "$cmd" | grep -Eiq '(^|[^[:alnum:]_])rm[[:space:]]+(-[[:alnum:]]*r[[:alnum:]]*f|-[[:alnum:]]*f[[:alnum:]]*r)'; then
  block "destructive 'rm' with recursive+force flags"
fi
# Separate short flags, e.g. rm -r -f / rm -f -r
if printf '%s' "$cmd" | grep -Eiq '(^|[^[:alnum:]_])rm[[:space:]].*(-r[[:space:]].*-f|-f[[:space:]].*-r)([[:space:]]|$)'; then
  block "destructive 'rm' with separate recursive+force flags"
fi
# Long flags, e.g. rm --recursive --force / --force --recursive
if printf '%s' "$cmd" | grep -Eiq '(^|[^[:alnum:]_])rm[[:space:]].*--recursive' \
   && printf '%s' "$cmd" | grep -Eiq '(^|[^[:alnum:]_])rm[[:space:]].*--force'; then
  block "destructive 'rm' with long recursive+force flags"
fi

# --- git push --force / -f / --force-with-lease (position-independent) ---
if printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_])git[[:space:]]+push([[:space:]]|$)'; then
  if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]])(--force|--force-with-lease|-f)([[:space:]=]|$)'; then
    block "git push with force flag"
  fi
fi

# --- drizzle-kit push (schema straight to DB without migration) ---
if printf '%s' "$cmd" | grep -Eq 'drizzle-kit[[:space:]]+push([[:space:]]|$)'; then
  block "drizzle-kit push (use db:generate + db:migrate)"
fi

# --- raw remote DB shell ---
if printf '%s' "$cmd" | grep -Eq 'turso[[:space:]]+db[[:space:]]+shell([[:space:]]|$)'; then
  block "raw 'turso db shell' (use guarded script)"
fi

# --- seed: pnpm script form ---
if printf '%s' "$cmd" | grep -Eq 'db:seed'; then
  block "db:seed disabled (destructive; manual Oktay step until idempotent)"
fi
# --- seed: direct runner form (tsx/ts-node/node ... db/seed) — NOT naive seed.ts (would hit cat/git add) ---
if printf '%s' "$cmd" | grep -Eq '(tsx|ts-node|node)[[:space:]]+[^[:space:]]*db/seed'; then
  block "direct seed runner disabled (destructive; manual Oktay step until idempotent)"
fi

# --- .env access via shell ---
if printf '%s' "$cmd" | grep -Eq '(^|[[:space:]<>|])(cat|less|more|head|tail|cp|mv|nano|vi|vim|code|open|source|\.)[[:space:]]+[^[:space:]]*\.env' \
   || printf '%s' "$cmd" | grep -Eq '[<>][[:space:]]*[^[:space:]]*\.env'; then
  block ".env access via shell (secrets are toxic)"
fi

exit 0
