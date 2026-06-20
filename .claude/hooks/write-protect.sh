#!/usr/bin/env bash
# PreToolUse(Edit|Write) guard — protects sensitive files from edits.
# FAIL-CLOSED: missing jq / unparsable JSON → block.
set -uo pipefail

block() {
  echo "write-protect: BLOCKED — $1" >&2
  exit 2
}

input=$(cat)
command -v jq >/dev/null 2>&1 || block "jq not found (fail-closed)"

path=$(printf '%s' "$input" | jq -er '.tool_input.file_path' 2>/dev/null) \
  || block "stdin JSON has no .tool_input.file_path (fail-closed)"

base=$(basename "$path")

case "$base" in
  .env|.env.*) block "writing .env files is forbidden (secrets are toxic)" ;;
  pnpm-lock.yaml) block "pnpm-lock.yaml is managed by pnpm, not hand-edited" ;;
esac

# Anything inside a .git/ directory.
if printf '%s' "$path" | grep -Eq '(^|/)\.git/'; then
  block "writing inside .git/ is forbidden"
fi

exit 0
