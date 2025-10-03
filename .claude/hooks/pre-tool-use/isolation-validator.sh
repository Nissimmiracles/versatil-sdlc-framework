#!/bin/bash
# VERSATIL Isolation Validator Hook
# Prevents framework pollution in user projects

set -euo pipefail

# Parse hook input (JSON from Claude Code)
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
TOOL_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.path // ""')

# Framework forbidden paths in user projects
FORBIDDEN_PATHS=(
  ".versatil/"
  "versatil/"
  "supabase/"
  ".versatil-memory/"
  ".versatil-logs/"
)

# Check if tool is trying to create forbidden paths
for forbidden in "${FORBIDDEN_PATHS[@]}"; do
  if [[ "$TOOL_PATH" == *"$forbidden"* ]]; then
    # Output JSON with blocking decision
    cat <<EOF
{
  "decision": "block",
  "reason": "Isolation violation: Cannot create '$forbidden' in user project",
  "suggestion": "Framework files must be in ~/.versatil/ instead",
  "systemMessage": "⚠️  ISOLATION VIOLATION PREVENTED\n\nAttempted: $TOOL_PATH\nViolation: Framework path in user project\nCorrect location: ~/.versatil/\n\nThe VERSATIL framework must remain isolated from user projects."
}
EOF
    exit 0
  fi
done

# Allow tool execution
echo '{"decision": "allow"}'