#!/bin/bash
# VERSATIL Proactive Agent Coordinator Hook
# Automatically activates appropriate BMAD agent based on context

set -euo pipefail

TOOL_NAME=$(echo "$HOOK_INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$HOOK_INPUT" | jq -r '.tool_input.file_path // ""')
FILE_CONTENT=$(echo "$HOOK_INPUT" | jq -r '.tool_input.content // ""')

# Check if proactive agents are enabled
PROACTIVE_ENABLED=${VERSATIL_PROACTIVE_AGENTS:-true}

if [[ "$PROACTIVE_ENABLED" != "true" ]]; then
  # Fallback to suggestion mode if proactive disabled
  cat <<EOF
{
  "decision": "allow",
  "systemMessage": "💡 Proactive agents disabled. Use slash commands: /maria, /james, /marcus, etc."
}
EOF
  exit 0
fi

# Determine agent and actions based on file patterns
AGENT_ID=""
AGENT_NAME=""
PROACTIVE_ACTIONS=""

if [[ "$FILE_PATH" =~ \.test\.(ts|js|tsx|jsx)$ ]] || [[ "$FILE_PATH" =~ /__tests__/ ]] || [[ "$FILE_PATH" =~ \.spec\. ]]; then
  AGENT_ID="maria-qa"
  AGENT_NAME="Maria-QA"
  PROACTIVE_ACTIONS="Running test coverage analysis • Checking for missing test cases • Validating assertions"
elif [[ "$FILE_PATH" =~ \.(tsx|jsx|vue|svelte|css|scss)$ ]]; then
  AGENT_ID="james-frontend"
  AGENT_NAME="James-Frontend"
  PROACTIVE_ACTIONS="Validating component structure • Checking WCAG 2.1 AA accessibility • Verifying responsive design"
elif [[ "$FILE_PATH" =~ \.(api|route|controller)\.(ts|js)$ ]] || [[ "$FILE_PATH" =~ /routes/ ]] || [[ "$FILE_PATH" =~ /controllers/ ]]; then
  AGENT_ID="marcus-backend"
  AGENT_NAME="Marcus-Backend"
  PROACTIVE_ACTIONS="Validating OWASP security patterns • Checking response time < 200ms • Generating stress tests"
elif [[ "$FILE_PATH" =~ \.(md|README|CHANGELOG)$ ]] || [[ "$FILE_PATH" =~ /docs/ ]]; then
  AGENT_ID="sarah-pm"
  AGENT_NAME="Sarah-PM"
  PROACTIVE_ACTIONS="Checking documentation consistency • Updating project tracking"
elif [[ "$FILE_PATH" =~ \.(py|ipynb)$ ]] || [[ "$FILE_PATH" =~ /models/ ]] || [[ "$FILE_PATH" =~ /ml/ ]]; then
  AGENT_ID="dr-ai-ml"
  AGENT_NAME="Dr.AI-ML"
  PROACTIVE_ACTIONS="Validating model performance • Checking data quality"
else
  # No specific agent match - allow without activation
  cat <<EOF
{
  "decision": "allow",
  "systemMessage": ""
}
EOF
  exit 0
fi

# Return proactive agent activation response
cat <<EOF
{
  "decision": "allow",
  "systemMessage": "🤖 $AGENT_NAME auto-activated\n\n$PROACTIVE_ACTIONS\n\nFile: $FILE_PATH\nStatusline: Watch bottom bar for real-time progress",
  "metadata": {
    "agent_id": "$AGENT_ID",
    "agent_name": "$AGENT_NAME",
    "proactive_mode": true,
    "background_analysis": true,
    "file_path": "$FILE_PATH"
  }
}
EOF