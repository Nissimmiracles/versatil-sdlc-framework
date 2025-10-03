#!/bin/bash
# VERSATIL Build Validation Hook
# Updates sync status after builds

set -euo pipefail

# Get hook input
HOOK_INPUT=${HOOK_INPUT:-"{}"}
TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name // "unknown"')

# Only run for build-related operations
if [[ "$TOOL_NAME" == "Bash" ]]; then
  COMMAND=$(echo "$HOOK_INPUT" | jq -r '.parameters.command // ""')

  if [[ "$COMMAND" == *"tsc"* ]] || [[ "$COMMAND" == *"build"* ]]; then
    echo "✅ VERSATIL Framework build complete"
    echo "   Updating sync status..."

    # Update sync status
    node scripts/show-framework-active.cjs --silent 2>&1 || true
  fi
fi

# Return success
echo '{"decision": "allow"}' | jq -c