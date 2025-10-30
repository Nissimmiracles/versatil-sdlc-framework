#!/bin/bash
# VERSATIL Todo Cleanup Script
# Archives outdated Guardian and resolved todos

set -e

TODOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/todos"
cd "$TODOS_DIR"

echo "🧹 VERSATIL Todo Cleanup"
echo "========================"
echo ""

# Create archive directories with datestamp
DATESTAMP=$(date +%Y-%m)
GUARDIAN_ARCHIVE="archive/guardian-${DATESTAMP}"
RESOLVED_ARCHIVE="archive/resolved-${DATESTAMP}"

mkdir -p "$GUARDIAN_ARCHIVE" "$RESOLVED_ARCHIVE"

# Count before cleanup
GUARDIAN_COUNT=$(ls guardian-combined-*.md 2>/dev/null | wc -l | tr -d ' ')
RESOLVED_COUNT=$(ls *-resolved-*.md 2>/dev/null | wc -l | tr -d ' ')

echo "📊 Before Cleanup:"
echo "  - Guardian todos: $GUARDIAN_COUNT"
echo "  - Resolved todos: $RESOLVED_COUNT"
echo "  - Total active: $(ls *.md 2>/dev/null | wc -l | tr -d ' ')"
echo ""

# Archive Guardian todos
if [ "$GUARDIAN_COUNT" -gt 0 ]; then
  echo "📦 Archiving Guardian todos..."
  mv guardian-combined-*.md "$GUARDIAN_ARCHIVE/" 2>/dev/null || true
  echo "  ✅ Moved $GUARDIAN_COUNT files to $GUARDIAN_ARCHIVE/"
fi

# Archive resolved todos
if [ "$RESOLVED_COUNT" -gt 0 ]; then
  echo "📦 Archiving resolved todos..."
  mv *-resolved-*.md "$RESOLVED_ARCHIVE/" 2>/dev/null || true
  echo "  ✅ Moved $RESOLVED_COUNT files to $RESOLVED_ARCHIVE/"
fi

echo ""
echo "📊 After Cleanup:"
echo "  - Active todos: $(ls *.md 2>/dev/null | wc -l | tr -d ' ')"
echo "  - Guardian archived: $(ls $GUARDIAN_ARCHIVE/*.md 2>/dev/null | wc -l | tr -d ' ')"
echo "  - Resolved archived: $(ls $RESOLVED_ARCHIVE/*.md 2>/dev/null | wc -l | tr -d ' ')"
echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📁 Archived to:"
echo "  - $TODOS_DIR/$GUARDIAN_ARCHIVE/"
echo "  - $TODOS_DIR/$RESOLVED_ARCHIVE/"
