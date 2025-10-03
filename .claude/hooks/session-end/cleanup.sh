#!/bin/bash
# VERSATIL Cleanup Hook
# Cleans up temporary data

set -euo pipefail

# Clean up old context snapshots (> 7 days)
find "$HOME/.versatil/context" -type f -mtime +7 -delete 2>/dev/null || true

# Clean up old logs (> 30 days)
find "$HOME/.versatil/logs" -type f -mtime +30 -delete 2>/dev/null || true

echo '{"systemMessage": "🧹 Temporary data cleaned up"}'