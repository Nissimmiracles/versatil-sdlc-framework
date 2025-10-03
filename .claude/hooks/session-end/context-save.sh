#!/bin/bash
# VERSATIL Context Save Hook
# Preserves session context for /resume

set -euo pipefail

CONTEXT_DIR="$HOME/.versatil/context"
SESSION_ID=$(date +%Y%m%d_%H%M%S)

mkdir -p "$CONTEXT_DIR/sessions"

# Save session summary
cat > "$CONTEXT_DIR/sessions/${SESSION_ID}.json" <<EOF
{
  "session_id": "$SESSION_ID",
  "ended_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_dir": "${CLAUDE_PROJECT_DIR:-$(pwd)}",
  "total_tools_used": $(echo "$HOOK_INPUT" | jq -r '.session_stats.tools_used // 0'),
  "active_agent": "$(echo "$HOOK_INPUT" | jq -r '.active_agent // "none"')"
}
EOF

echo '{"systemMessage": "💾 Session context saved for /resume"}'