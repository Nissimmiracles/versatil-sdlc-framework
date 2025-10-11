#!/bin/bash
# Repository Structure Migration Script
# Generated: 2025-10-11T23:43:55.754Z
# Total Operations: 4

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting repository migration...${NC}"
echo "Total operations: 4"
echo ""

# Create backup
BACKUP_DIR=".versatil-backups/backup-2025-10-11T23-43-55-753Z"
echo -e "${YELLOW}Creating backup at $BACKUP_DIR...${NC}"
mkdir -p "$BACKUP_DIR"

# Operation 1: delete - safe
echo -e "${YELLOW}[1/4] Found 3 files that should be ignored${NC}"
cp -r "/Users/nissimmenashe/VERSATIL SDLC FW/.DS_Store" "$BACKUP_DIR/$(basename "/Users/nissimmenashe/VERSATIL SDLC FW/.DS_Store")" 2>/dev/null || true
rm -rf "/Users/nissimmenashe/VERSATIL SDLC FW/.DS_Store"

# Operation 2: delete - safe
echo -e "${YELLOW}[2/4] Found 8 backup files in root${NC}"
cp -r "/Users/nissimmenashe/VERSATIL SDLC FW/.!75742!.DS_Store" "$BACKUP_DIR/$(basename "/Users/nissimmenashe/VERSATIL SDLC FW/.!75742!.DS_Store")" 2>/dev/null || true
rm -rf "/Users/nissimmenashe/VERSATIL SDLC FW/.!75742!.DS_Store"

# Operation 3: delete - safe
echo -e "${YELLOW}[3/4] Found 8 backup files in root${NC}"
cp -r "/Users/nissimmenashe/VERSATIL SDLC FW/.!77293!.DS_Store" "$BACKUP_DIR/$(basename "/Users/nissimmenashe/VERSATIL SDLC FW/.!77293!.DS_Store")" 2>/dev/null || true
rm -rf "/Users/nissimmenashe/VERSATIL SDLC FW/.!77293!.DS_Store"

# Operation 4: delete - safe
echo -e "${YELLOW}[4/4] Found 8 backup files in root${NC}"
cp -r "/Users/nissimmenashe/VERSATIL SDLC FW/.!78842!.DS_Store" "$BACKUP_DIR/$(basename "/Users/nissimmenashe/VERSATIL SDLC FW/.!78842!.DS_Store")" 2>/dev/null || true
rm -rf "/Users/nissimmenashe/VERSATIL SDLC FW/.!78842!.DS_Store"

echo -e "${GREEN}Migration completed successfully!${NC}"
echo ""
echo "Operations executed: 4"
echo "Backup available at: $BACKUP_DIR"
echo "To rollback, run: bash scripts/migrations/rollback-2025-10-11T23-43-55-753Z.sh"

exit 0
