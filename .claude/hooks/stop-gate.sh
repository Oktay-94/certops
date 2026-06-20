#!/usr/bin/env bash
# Stop gate — verification must be green before Claude stops.
# FAIL-CLOSED: lint/typecheck/test red → exit 2 (forces Claude to keep working).
# Loop-safe: if already in a stop-hook continuation, exit 0 to avoid infinite loop.
# NOTE: 'pnpm build' is intentionally excluded here (too slow per stop) → belongs in CI.
set -uo pipefail

input=$(cat 2>/dev/null) || true

if command -v jq >/dev/null 2>&1; then
  active=$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null) || active="false"
  [ "$active" = "true" ] && exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || { echo "stop-gate: cannot cd to project dir" >&2; exit 2; }

if ! pnpm lint; then
  echo "stop-gate: 'pnpm lint' failed — fix before stopping." >&2
  exit 2
fi
if ! pnpm typecheck; then
  echo "stop-gate: 'pnpm typecheck' failed — fix before stopping." >&2
  exit 2
fi
if ! pnpm test:run; then
  echo "stop-gate: 'pnpm test:run' failed — fix before stopping." >&2
  exit 2
fi

exit 0
