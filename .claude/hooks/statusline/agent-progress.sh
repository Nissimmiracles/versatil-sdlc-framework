#!/bin/bash
# VERSATIL Statusline Integration
# Shows real-time agent activity and progress

set -euo pipefail

# Get hook input from environment
HOOK_INPUT=${HOOK_INPUT:-"{}"}

# Extract session context
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // "unknown"')
PROJECT_PATH=$(echo "$HOOK_INPUT" | jq -r '.project_path // ""')

# Check if proactive agents are enabled
PROACTIVE_ENABLED=${VERSATIL_PROACTIVE_AGENTS:-true}

if [[ "$PROACTIVE_ENABLED" != "true" ]]; then
  # Show minimal statusline
  echo "VERSATIL Framework v2.0"
  exit 0
fi

# Function to get active agents status
get_active_agents() {
  # In production, this would query the ProactiveAgentOrchestrator
  # For now, return mock data structure

  # Check if there's a temp file with agent status
  STATUS_FILE="/tmp/versatil-agent-status-${SESSION_ID}.json"

  if [[ -f "$STATUS_FILE" ]]; then
    cat "$STATUS_FILE"
  else
    echo '{"active_agents":[],"quality_score":0}'
  fi
}

# Get current agent status
AGENT_STATUS=$(get_active_agents)
ACTIVE_AGENTS=$(echo "$AGENT_STATUS" | jq -r '.active_agents // []')
AGENT_COUNT=$(echo "$ACTIVE_AGENTS" | jq 'length')
QUALITY_SCORE=$(echo "$AGENT_STATUS" | jq -r '.quality_score // 0')

# Build statusline output with ANSI colors
if [[ "$AGENT_COUNT" -gt 0 ]]; then
  # Agents are active - show detailed status
  AGENT_NAMES=$(echo "$ACTIVE_AGENTS" | jq -r '.[].name' | head -3 | tr '\n' ',' | sed 's/,$//')
  PROGRESS=$(echo "$ACTIVE_AGENTS" | jq -r '.[0].progress // 0')

  # Create progress bar (10 chars)
  FILLED=$((PROGRESS / 10))
  EMPTY=$((10 - FILLED))
  PROGRESS_BAR=$(printf '█%.0s' $(seq 1 $FILLED))$(printf '░%.0s' $(seq 1 $EMPTY))

  # Determine status icon and color
  if [[ "$PROGRESS" -eq 100 ]]; then
    STATUS_ICON="✅"
    STATUS_COLOR="\033[32m" # Green
  elif [[ "$PROGRESS" -ge 50 ]]; then
    STATUS_ICON="🤖"
    STATUS_COLOR="\033[33m" # Yellow
  else
    STATUS_ICON="⏳"
    STATUS_COLOR="\033[36m" # Cyan
  fi

  # Format: 🤖 Active: Maria, James │ ████████░░ 80% │ Quality: 92%
  echo -e "${STATUS_COLOR}${STATUS_ICON} Active: ${AGENT_NAMES}\033[0m │ ${PROGRESS_BAR} ${PROGRESS}% │ \033[32mQ: ${QUALITY_SCORE}%\033[0m"
else
  # No agents active - show framework ready status
  if [[ "$QUALITY_SCORE" -gt 0 ]]; then
    echo -e "\033[32m✅ VERSATIL\033[0m │ \033[36mReady\033[0m │ \033[32mQ: ${QUALITY_SCORE}%\033[0m"
  else
    echo -e "\033[36m🤖 VERSATIL\033[0m │ \033[36mReady\033[0m │ Proactive agents enabled"
  fi
fi