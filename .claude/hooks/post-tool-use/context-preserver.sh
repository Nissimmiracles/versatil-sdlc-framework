#!/bin/bash
# VERSATIL Context Preserver Hook
# Saves agent context after tool execution

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
AGENT_NAME=$(echo "$HOOK_INPUT" | jq -r '.agent_name // "default"')
CONTEXT_DIR="$HOME/.versatil/context"

mkdir -p "$CONTEXT_DIR"

# Save context snapshot
cat > "$CONTEXT_DIR/${AGENT_NAME}-last-context.json" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agent": "$AGENT_NAME",
  "tool": "$TOOL_NAME",
  "working_directory": "${CLAUDE_PROJECT_DIR:-$(pwd)}",
  "tool_input": $(echo "$HOOK_INPUT" | jq -r '.tool_input'),
  "tool_output_summary": "$(echo "$HOOK_INPUT" | jq -r '.tool_output' | head -c 500)"
}
EOF

echo '{"decision": "allow"}'