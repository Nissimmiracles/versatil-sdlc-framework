#!/bin/bash
# VERSATIL Metrics Report Hook
# Generates session performance summary

set -euo pipefail

TOOLS_USED=$(echo "$HOOK_INPUT" | jq -r '.session_stats.tools_used // 0')
DURATION=$(echo "$HOOK_INPUT" | jq -r '.session_stats.duration_seconds // 0')
FILES_MODIFIED=$(echo "$HOOK_INPUT" | jq -r '.session_stats.files_modified // 0')

cat <<EOF
{
  "systemMessage": "📊 VERSATIL Session Summary\n\nDuration: ${DURATION}s\nTools Used: $TOOLS_USED\nFiles Modified: $FILES_MODIFIED\n\nThank you for using VERSATIL! 🚀"
}
EOF