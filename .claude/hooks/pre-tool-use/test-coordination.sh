#!/bin/bash
# VERSATIL Test Coordination Hook
# Shows framework status before tests run

set -euo pipefail

# Get hook input
HOOK_INPUT=${HOOK_INPUT:-"{}"}
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // "unknown"')

# Only run for test-related operations
if [[ "$TOOL_NAME" == "Bash" ]]; then
  COMMAND=$(echo "$HOOK_INPUT" | jq -r '.parameters.command // ""')

  if [[ "$COMMAND" == *"jest"* ]] || [[ "$COMMAND" == *"test"* ]]; then
    echo "🧪 VERSATIL Framework coordinating tests..."
    echo "   Quick sync validation running..."

    # Run quick sync validation in background
    cd "$(pwd)" && node scripts/validate-sync.cjs --quick --silent 2>&1 || true
  fi
fi

# Always allow the operation
echo '{"decision": "allow"}' | jq -c