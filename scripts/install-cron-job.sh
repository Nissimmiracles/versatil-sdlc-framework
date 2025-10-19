#!/bin/bash

###############################################################################
# VERSATIL SDLC Framework - Install System Cron Job
# Optional alternative to node-cron for users who prefer system cron
#
# Usage:
#   bash scripts/install-cron-job.sh install   - Install cron job
#   bash scripts/install-cron-job.sh uninstall - Remove cron job
#   bash scripts/install-cron-job.sh status    - Check if installed
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CRON_SCHEDULE="0 2 * * *"
CRON_USER="${USER}"
CRON_COMMENT="# VERSATIL Daily Audit (Rule 3)"

# Determine node path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}Error: node not found in PATH${NC}"
    exit 1
fi

# Construct cron command
AUDIT_DAEMON_PATH="${PROJECT_ROOT}/bin/versatil-audit-daemon.js"
CRON_COMMAND="${CRON_SCHEDULE} ${NODE_PATH} ${AUDIT_DAEMON_PATH} _run-daemon '0 2 * * *' 'America/New_York' >> ~/.versatil/logs/daily-audit-cron.log 2>&1"

###############################################################################
# Functions
###############################################################################

# Check if cron job is installed
is_installed() {
    if crontab -l 2>/dev/null | grep -q "VERSATIL Daily Audit"; then
        return 0
    else
        return 1
    fi
}

# Install cron job
install_cron() {
    echo "Installing VERSATIL Daily Audit cron job..."

    # Check if already installed
    if is_installed; then
        echo -e "${YELLOW}Cron job is already installed${NC}"
        echo "Run 'bash $0 uninstall' to remove it first"
        exit 1
    fi

    # Ensure log directory exists
    mkdir -p ~/.versatil/logs

    # Create temporary cron file
    TEMP_CRON=$(mktemp)

    # Export existing crontab
    crontab -l > "$TEMP_CRON" 2>/dev/null || true

    # Add new cron job
    echo "" >> "$TEMP_CRON"
    echo "$CRON_COMMENT" >> "$TEMP_CRON"
    echo "$CRON_COMMAND" >> "$TEMP_CRON"

    # Install new crontab
    crontab "$TEMP_CRON"

    # Clean up
    rm -f "$TEMP_CRON"

    echo -e "${GREEN}✓ Cron job installed successfully${NC}"
    echo ""
    echo "Schedule: Daily at 2:00 AM"
    echo "Log file: ~/.versatil/logs/daily-audit-cron.log"
    echo ""
    echo "View current crontab: crontab -l"
    echo "Check logs: tail -f ~/.versatil/logs/daily-audit-cron.log"
}

# Uninstall cron job
uninstall_cron() {
    echo "Uninstalling VERSATIL Daily Audit cron job..."

    # Check if installed
    if ! is_installed; then
        echo -e "${YELLOW}Cron job is not installed${NC}"
        exit 0
    fi

    # Create temporary cron file
    TEMP_CRON=$(mktemp)

    # Export existing crontab without VERSATIL entries
    crontab -l 2>/dev/null | grep -v "VERSATIL Daily Audit" > "$TEMP_CRON" || true

    # Remove the cron command line as well
    sed -i.bak '/versatil-audit-daemon/d' "$TEMP_CRON"

    # Install cleaned crontab
    crontab "$TEMP_CRON"

    # Clean up
    rm -f "$TEMP_CRON" "$TEMP_CRON.bak"

    echo -e "${GREEN}✓ Cron job uninstalled successfully${NC}"
}

# Show status
show_status() {
    echo "VERSATIL Daily Audit Cron Job Status"
    echo "═══════════════════════════════════════"

    if is_installed; then
        echo -e "Status: ${GREEN}Installed${NC}"
        echo ""
        echo "Current cron configuration:"
        crontab -l | grep -A 1 "VERSATIL Daily Audit"
        echo ""
        echo "Schedule: Daily at 2:00 AM"
        echo "Log file: ~/.versatil/logs/daily-audit-cron.log"
        echo ""
        echo "Recent logs (last 10 lines):"
        echo "───────────────────────────────────────"
        if [ -f ~/.versatil/logs/daily-audit-cron.log ]; then
            tail -n 10 ~/.versatil/logs/daily-audit-cron.log
        else
            echo "(No logs yet)"
        fi
    else
        echo -e "Status: ${YELLOW}Not installed${NC}"
        echo ""
        echo "Install with: bash $0 install"
    fi

    echo ""
    echo "═══════════════════════════════════════"
}

# Show help
show_help() {
    cat << EOF
VERSATIL Daily Audit Cron Job Installer

Usage:
    bash $0 <command>

Commands:
    install     Install the cron job (runs daily at 2 AM)
    uninstall   Remove the cron job
    status      Show installation status and recent logs
    help        Show this help message

Description:
    This script installs a system cron job that runs the VERSATIL
    daily audit at 2:00 AM every day. This is an alternative to
    using the node-cron based daemon.

    The cron job logs to: ~/.versatil/logs/daily-audit-cron.log

Cron vs Daemon:
    - System Cron: Runs as system scheduled task, requires system cron
    - Node Daemon: Runs as background Node.js process, more flexible

    Choose one approach. The daemon (versatil-audit-daemon) is
    recommended for most users as it provides better control and
    logging.

Examples:
    bash $0 install     # Install cron job
    bash $0 status      # Check status
    crontab -l          # View all cron jobs
    bash $0 uninstall   # Remove cron job

EOF
}

###############################################################################
# Main
###############################################################################

COMMAND="${1:-help}"

case "$COMMAND" in
    install)
        install_cron
        ;;
    uninstall)
        uninstall_cron
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Error: Unknown command '$COMMAND'${NC}"
        echo "Run 'bash $0 help' for usage information"
        exit 1
        ;;
esac
