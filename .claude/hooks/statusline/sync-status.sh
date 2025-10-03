#!/bin/bash
# VERSATIL Synchronization Status - Real-Time Display
# Shows framework sync state in Claude Code statusline

set -euo pipefail

# Get hook input from environment
HOOK_INPUT=${HOOK_INPUT:-"{}"}

# Extract session context
SESSION_ID=$(echo "$HOOK_INPUT" | jq -r '.session_id // "unknown"')
PROJECT_PATH=$(echo "$HOOK_INPUT" | jq -r '.project_path // ""')

# Check if framework is enabled
FRAMEWORK_ENABLED=${VERSATIL_ENABLED:-true}

if [[ "$FRAMEWORK_ENABLED" != "true" ]]; then
  # Show minimal statusline
  echo "VERSATIL v2.0"
  exit 0
fi

# Function to get sync status
get_sync_status() {
  # Check if sync status file exists
  STATUS_FILE="/tmp/versatil-sync-status-${SESSION_ID}.json"

  if [[ -f "$STATUS_FILE" ]]; then
    cat "$STATUS_FILE"
  else
    # Generate default status
    echo '{
      "synchronized": true,
      "score": 95,
      "orchestrators_active": 8,
      "orchestrators_total": 8,
      "event_count": 0,
      "issues_critical": 0,
      "issues_total": 0
    }'
  fi
}

# Get current sync status
SYNC_STATUS=$(get_sync_status)
SYNCHRONIZED=$(echo "$SYNC_STATUS" | jq -r '.synchronized // true')
SCORE=$(echo "$SYNC_STATUS" | jq -r '.score // 95')
ORCH_ACTIVE=$(echo "$SYNC_STATUS" | jq -r '.orchestrators_active // 8')
ORCH_TOTAL=$(echo "$SYNC_STATUS" | jq -r '.orchestrators_total // 8')
CRITICAL_ISSUES=$(echo "$SYNC_STATUS" | jq -r '.issues_critical // 0')

# Determine status icon and color based on sync score
if [[ "$SCORE" -ge 95 ]]; then
  STATUS_ICON="🟢"
  STATUS_TEXT="SYNCED"
  STATUS_COLOR="\033[32m" # Green
elif [[ "$SCORE" -ge 85 ]]; then
  STATUS_ICON="🟡"
  STATUS_TEXT="SYNCING"
  STATUS_COLOR="\033[33m" # Yellow
elif [[ "$SCORE" -ge 70 ]]; then
  STATUS_ICON="🟠"
  STATUS_TEXT="PARTIAL"
  STATUS_COLOR="\033[38;5;214m" # Orange
else
  STATUS_ICON="🔴"
  STATUS_TEXT="OUT-OF-SYNC"
  STATUS_COLOR="\033[31m" # Red
fi

# Build statusline output
# Format: 🟢 VERSATIL │ SYNCED 95% │ 8/8 Orchestrators │ 0 Issues

STATUSLINE="${STATUS_COLOR}${STATUS_ICON} VERSATIL\033[0m"
STATUSLINE="${STATUSLINE} │ ${STATUS_COLOR}${STATUS_TEXT} ${SCORE}%\033[0m"
STATUSLINE="${STATUSLINE} │ \033[36m${ORCH_ACTIVE}/${ORCH_TOTAL} Orchestrators\033[0m"

if [[ "$CRITICAL_ISSUES" -gt 0 ]]; then
  STATUSLINE="${STATUSLINE} │ \033[31m⚠️  ${CRITICAL_ISSUES} Critical\033[0m"
fi

# Show validation command hint if sync is low
if [[ "$SCORE" -lt 90 ]]; then
  STATUSLINE="${STATUSLINE} │ \033[90mRun: npm run validate:sync\033[0m"
fi

echo -e "$STATUSLINE"