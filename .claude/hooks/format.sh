#!/usr/bin/env bash
# PostToolUse(Edit|Write) — auto-fix formatting on the changed file.
# FAIL-OPEN: a formatting failure must never block work. Always exits 0.
# NOTE: prettier is not installed in this project → eslint --fix only.
set -uo pipefail

input=$(cat 2>/dev/null) || exit 0
command -v jq >/dev/null 2>&1 || exit 0

path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[ -n "$path" ] || exit 0
[ -f "$path" ] || exit 0

case "$path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json)
    # Best-effort; ignore all failures (fail-open).
    pnpm exec eslint --fix "$path" >/dev/null 2>&1 || true
    ;;
esac

exit 0
