#!/bin/bash
# VERSATIL Security Gate Hook
# Prevents execution of potentially unsafe commands

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
COMMAND=$(echo "$HOOK_INPUT" | jq -r '.tool_input.command // ""')

# Security patterns to block
UNSAFE_PATTERNS=(
  "rm -rf /"
  ":(){ :|:& };:"  # Fork bomb
  "curl.*|.*sh"    # Piping to shell
  "wget.*|.*sh"
  "eval.*\$"       # eval with variables
)

for pattern in "${UNSAFE_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    cat <<EOF
{
  "decision": "block",
  "reason": "Security violation: Potentially dangerous command pattern",
  "systemMessage": "🔒 SECURITY GATE BLOCKED\n\nCommand: $COMMAND\nReason: Matches unsafe pattern: $pattern\nAction: Review and modify command\n\nIf this is intentional, run the command manually."
}
EOF
    exit 0
  fi
done

echo '{"decision": "allow"}'