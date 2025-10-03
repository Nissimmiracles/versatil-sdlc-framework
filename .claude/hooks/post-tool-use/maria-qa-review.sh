#!/bin/bash
# VERSATIL Maria-QA Auto-Review Hook
# Triggers quality review after significant changes

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
CHANGES_COUNT=$(echo "$HOOK_INPUT" | jq -r '.tool_output.changes_count // 0')

# Trigger Maria-QA review for significant changes
if [[ $CHANGES_COUNT -gt 50 ]]; then
  cat <<EOF
{
  "decision": "allow",
  "systemMessage": "🤖 Maria-QA Review Recommended\n\nChanges: $CHANGES_COUNT lines\nSuggestion: Run '@maria-qa review recent changes' for quality validation\n\nLarge changesets benefit from comprehensive testing."
}
EOF
else
  echo '{"decision": "allow"}'
fi