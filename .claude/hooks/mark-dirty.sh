#!/usr/bin/env bash
# PostToolUse hook: after Claude edits a code file, leave a marker so the Stop hook
# knows it has to verify. Edits to docs (.md/.mdx/.txt) don't count.
input="$(cat)"
if printf '%s' "$input" | grep -Eq '"file_path"[[:space:]]*:[[:space:]]*"[^"]*\.(md|mdx|txt)"'; then
  exit 0
fi
touch "${CLAUDE_PROJECT_DIR:-.}/.claude/.dirty"
exit 0
