#!/bin/bash
# Hook runner script that ensures proper PATH for Claude Code CLI hooks
# This solves the "npx not found" issue in subprocess environments

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

HOOK_NAME="$1"
shift

if [ -z "$HOOK_NAME" ]; then
  echo "Usage: run-hook.sh <hook-name> [args...]"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK_PATH="$SCRIPT_DIR/$HOOK_NAME.ts"

if [ ! -f "$HOOK_PATH" ]; then
  echo "Hook not found: $HOOK_PATH"
  exit 1
fi

# Run the hook with tsx
exec npx tsx "$HOOK_PATH" "$@"
