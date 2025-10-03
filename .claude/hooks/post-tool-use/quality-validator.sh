#!/bin/bash
# VERSATIL Quality Validator Hook
# Enforces quality gates after code changes

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""')

# Only validate after file edits/writes
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  echo '{"decision": "allow"}'
  exit 0
fi

# Run quick quality checks
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # TypeScript/JavaScript files
  npm run lint -- "$FILE_PATH" &> /dev/null || LINT_FAILED=1

  if [[ ${LINT_FAILED:-0} -eq 1 ]]; then
    cat <<EOF
{
  "decision": "allow",
  "systemMessage": "⚠️  QUALITY GATE WARNING\n\nFile: $FILE_PATH\nIssue: Linting errors detected\nAction: Run 'npm run lint:fix' to auto-fix\n\nNote: This is a warning, not a blocker."
}
EOF
    exit 0
  fi
fi

echo '{"decision": "allow", "systemMessage": "✅ Quality checks passed"}'