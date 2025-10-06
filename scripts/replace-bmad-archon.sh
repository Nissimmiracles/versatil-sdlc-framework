#!/bin/bash

# Script to replace all BMAD/Archon references with OPERA
# This script handles all remaining files in the repository

echo "🔄 Starting BMAD/Archon → OPERA replacement..."

# Define the directories to search (excluding node_modules, .git, dist, .jest-cache)
SEARCH_DIRS="./tests ./types ./test ./CHANGELOG.md ./V4.1.0_*.md"

# Counter
COUNT=0

# Function to replace in a file
replace_in_file() {
    local file="$1"

    # Check if file contains BMAD or Archon (case-insensitive)
    if grep -qi "BMAD\|Archon" "$file"; then
        echo "  📝 Processing: $file"

        # Create backup
        cp "$file" "$file.bak"

        # Perform replacements
        sed -i.tmp '
            s/BMAD/OPERA/g
            s/BMad/OPERA/g
            s/bmad/opera/g
            s/Archon/OPERA/g
            s/archon/opera/g
        ' "$file"

        # Remove temporary file
        rm -f "$file.tmp"

        COUNT=$((COUNT + 1))
    fi
}

# Export function so it can be used by find
export -f replace_in_file
export COUNT

# Find and process all relevant files
find ./tests ./types ./test -type f \( -name "*.ts" -o -name "*.js" -o -name "*.md" \) -not -path "*/node_modules/*" -exec bash -c 'replace_in_file "$0"' {} \;

# Process specific files in root
for file in ./CHANGELOG.md ./V4.1.0_COMPLETE_VICTORY.md ./V4.1.0_FIRST_USER_GAPS_RESOLVED.md; do
    if [ -f "$file" ]; then
        replace_in_file "$file"
    fi
done

echo ""
echo "✅ Replacement complete!"
echo "📊 Files modified: $COUNT"
echo ""
echo "ℹ️  Backup files created with .bak extension"
echo "ℹ️  Review changes with: git diff"
echo "ℹ️  Clean backups with: find . -name '*.bak' -delete"
