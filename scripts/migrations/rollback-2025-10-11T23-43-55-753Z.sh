#!/bin/bash
# Rollback Script for Migration 2025-10-11T23-43-55-753Z
# Generated: 2025-10-11T23:43:55.754Z

set -e

BACKUP_DIR=".versatil-backups/backup-2025-10-11T23-43-55-753Z"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory not found at $BACKUP_DIR"
  exit 1
fi

echo "Rolling back migration..."
echo "Restoring from: $BACKUP_DIR"

# Restore all files from backup
cp -r "$BACKUP_DIR"/* ./

echo "Rollback completed successfully!"
exit 0
