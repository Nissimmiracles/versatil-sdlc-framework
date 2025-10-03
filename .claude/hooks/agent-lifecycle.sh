#!/bin/bash
# Agent Lifecycle Hook - Monitors agent activation/completion
# Integrates with statusline for real-time feedback
#
# Triggered: When agents activate or complete tasks
# Integration: Calls emit-framework-event.cjs to update statusline

set -euo pipefail

# Get agent information from environment
AGENT_NAME="${AGENT_NAME:-unknown}"
LIFECYCLE_EVENT="${LIFECYCLE_EVENT:-activated}"
TASK_DESCRIPTION="${TASK_DESCRIPTION:-}"

# Project root
PROJECT_ROOT="$(pwd)"
EVENT_EMITTER="$PROJECT_ROOT/scripts/emit-framework-event.cjs"

# Emit event based on lifecycle stage
case "$LIFECYCLE_EVENT" in
  "activated"|"started")
    # Agent just activated
    if [[ -x "$EVENT_EMITTER" ]]; then
      node "$EVENT_EMITTER" agent_activated "$AGENT_NAME"
    fi

    # Log to framework logs
    LOG_DIR="${HOME}/.versatil/logs"
    mkdir -p "$LOG_DIR"
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Agent $AGENT_NAME activated: $TASK_DESCRIPTION" \
      >> "$LOG_DIR/agent-activity.log"
    ;;

  "completed"|"success")
    # Agent completed successfully
    if [[ -x "$EVENT_EMITTER" ]]; then
      node "$EVENT_EMITTER" agent_completed "$AGENT_NAME"
    fi

    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Agent $AGENT_NAME completed: $TASK_DESCRIPTION" \
      >> "${HOME}/.versatil/logs/agent-activity.log"
    ;;

  "failed"|"error")
    # Agent failed
    if [[ -x "$EVENT_EMITTER" ]]; then
      node "$EVENT_EMITTER" agent_failed "$AGENT_NAME"
    fi

    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Agent $AGENT_NAME FAILED: $TASK_DESCRIPTION" \
      >> "${HOME}/.versatil/logs/agent-activity.log"
    ;;

  *)
    # Unknown lifecycle event
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Agent $AGENT_NAME - unknown event: $LIFECYCLE_EVENT" \
      >> "${HOME}/.versatil/logs/agent-activity.log"
    ;;
esac

exit 0