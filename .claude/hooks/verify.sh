#!/usr/bin/env bash
# Stop hook: if code was edited since the last successful check, run `make check test`.
# On failure, exit 2 so Claude keeps working with the error output.
# After 3 failed attempts in a row it gives up and warns the user instead of looping.
set -u
cat >/dev/null # hook input (unused)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

marker=".claude/.dirty"
counter=".claude/.verify-attempts"
[ -f "$marker" ] || exit 0
[ -f Makefile ] || exit 0

if out="$(make check test 2>&1)"; then
  rm -f "$marker" "$counter"
  exit 0
fi

attempts=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
if [ "$attempts" -gt 3 ]; then
  rm -f "$counter"
  printf '{"systemMessage": "make check/test still failing after 3 attempts. Stopping so you can look."}\n'
  exit 0
fi
echo "$attempts" > "$counter"
{
  echo "make check/test failed (attempt $attempts of 3). Fix it before finishing:"
  printf '%s\n' "$out" | tail -n 60
} >&2
exit 2
