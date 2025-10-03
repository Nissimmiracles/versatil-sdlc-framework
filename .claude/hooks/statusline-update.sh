#!/bin/bash
# Statusline Update Hook - Integrates with Claude Code statusline
# Updates statusline with real-time framework activity
#
# Triggered: On framework events (agent activation, test runs, builds)
# Output: Formatted for Claude Code statusline display

set -euo pipefail

# Get event data from environment
EVENT_TYPE="${VERSATIL_EVENT_TYPE:-unknown}"
AGENT_NAME="${VERSATIL_AGENT_NAME:-}"
OPERATION="${VERSATIL_OPERATION:-}"
PROGRESS="${VERSATIL_PROGRESS:-0}"
STATUS="${VERSATIL_STATUS:-pending}"

# Status file for persistence across invocations
STATUS_FILE="${HOME}/.versatil/statusline.json"
mkdir -p "$(dirname "$STATUS_FILE")"

# Initialize status file if not exists
if [[ ! -f "$STATUS_FILE" ]]; then
  cat > "$STATUS_FILE" <<EOF
{
  "timestamp": $(date +%s),
  "active_agents": [],
  "current_operation": "Idle",
  "health": "healthy",
  "progress": 0
}
EOF
fi

# Function to update statusline with formatted message
update_statusline() {
  local emoji="$1"
  local message="$2"
  local color="${3:-blue}"

  # Read current status
  local current_status=$(cat "$STATUS_FILE")

  # Update status with new info
  local timestamp=$(date +%s)
  echo "$current_status" | jq --arg msg "$message" --arg ts "$timestamp" \
    '.timestamp = ($ts | tonumber) | .last_message = $msg' > "$STATUS_FILE"

  # Output to stdout for Claude Code statusline
  # Format: emoji + message (will appear in bottom status bar)
  echo "$emoji $message"
}

# Function to format agent status
format_agent_status() {
  local agent="$1"
  local status="$2"

  case "$status" in
    "active")
      echo "🟢 $agent"
      ;;
    "running")
      echo "🔵 $agent running..."
      ;;
    "completed")
      echo "✅ $agent done"
      ;;
    "failed")
      echo "❌ $agent failed"
      ;;
    *)
      echo "⚪ $agent"
      ;;
  esac
}

# Function to get progress bar
progress_bar() {
  local progress=$1
  local width=10
  local filled=$((progress * width / 100))
  local empty=$((width - filled))

  printf "█%.0s" $(seq 1 $filled)
  printf "░%.0s" $(seq 1 $empty)
}

# Main event handling
case "$EVENT_TYPE" in
  "agent_activated")
    agent_status=$(format_agent_status "$AGENT_NAME" "active")
    update_statusline "🤖" "$agent_status" "green"

    # Add to active agents list
    jq --arg agent "$AGENT_NAME" '.active_agents += [$agent] | .active_agents |= unique' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "agent_completed")
    agent_status=$(format_agent_status "$AGENT_NAME" "completed")
    update_statusline "✅" "$agent_status" "green"

    # Remove from active agents list
    jq --arg agent "$AGENT_NAME" '.active_agents -= [$agent]' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "agent_failed")
    agent_status=$(format_agent_status "$AGENT_NAME" "failed")
    update_statusline "❌" "$agent_status" "red"

    # Remove from active agents and mark health warning
    jq --arg agent "$AGENT_NAME" '.active_agents -= [$agent] | .health = "warning"' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "test_running")
    progress_display=$(progress_bar "$PROGRESS")
    update_statusline "🧪" "Tests: $progress_display ${PROGRESS}%" "blue"

    jq --arg op "$OPERATION" --arg prog "$PROGRESS" \
      '.current_operation = $op | .progress = ($prog | tonumber)' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "build_running")
    progress_display=$(progress_bar "$PROGRESS")
    update_statusline "🔨" "Build: $progress_display ${PROGRESS}%" "yellow"

    jq --arg op "Build" --arg prog "$PROGRESS" \
      '.current_operation = $op | .progress = ($prog | tonumber)' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "operation_complete")
    update_statusline "✅" "$OPERATION complete" "green"

    jq '.current_operation = "Idle" | .progress = 0' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "health_check")
    # Read current status
    active_count=$(jq '.active_agents | length' "$STATUS_FILE")
    health=$(jq -r '.health' "$STATUS_FILE")

    if [[ "$health" == "healthy" && $active_count -gt 0 ]]; then
      update_statusline "💚" "Framework active ($active_count agents)" "green"
    elif [[ "$health" == "healthy" ]]; then
      update_statusline "💙" "Framework ready" "blue"
    else
      update_statusline "⚠️" "Framework: $health" "yellow"
    fi
    ;;

  "error")
    update_statusline "🔴" "Error: $OPERATION" "red"

    jq --arg op "$OPERATION" '.health = "error" | .last_error = $op' \
      "$STATUS_FILE" > "${STATUS_FILE}.tmp" && mv "${STATUS_FILE}.tmp" "$STATUS_FILE"
    ;;

  "clear")
    # Clear all status, reset to idle
    update_statusline "⚪" "Framework idle" "white"

    cat > "$STATUS_FILE" <<EOF
{
  "timestamp": $(date +%s),
  "active_agents": [],
  "current_operation": "Idle",
  "health": "healthy",
  "progress": 0
}
EOF
    ;;

  *)
    # Unknown event - show generic status
    if [[ -n "$OPERATION" ]]; then
      update_statusline "ℹ️" "$OPERATION" "blue"
    fi
    ;;
esac

# Always output current summary for statusline
# This appears in bottom status bar of Claude Code
current_summary=$(jq -r '
  if .active_agents | length > 0 then
    "🤖 \(.active_agents | length) active │ \(.current_operation)"
  else
    "💙 Framework ready │ \(.health)"
  end
' "$STATUS_FILE")

echo "$current_summary"

exit 0