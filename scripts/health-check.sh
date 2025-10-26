#!/bin/bash
# VERSATIL OPERA Health Check Script
# Monitors CLI/MCP server processes (NOT HTTP endpoints)

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏥 VERSATIL Health Check - CLI/MCP Tool"
echo "========================================"

# 1. Check CPU Usage
echo -n "CPU Usage: "
CPU_USAGE=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
if (( $(echo "$CPU_USAGE < 80" | bc -l) )); then
    echo -e "${GREEN}✓${NC} ${CPU_USAGE}% (healthy)"
else
    echo -e "${YELLOW}⚠${NC} ${CPU_USAGE}% (high)"
fi

# 2. Check Memory Usage
echo -n "Memory Free: "
MEM_FREE=$(top -l 1 | grep "PhysMem" | awk '{print $6}' | sed 's/M\.//')
if (( $(echo "$MEM_FREE > 500" | bc -l) )); then
    echo -e "${GREEN}✓${NC} ${MEM_FREE}MB (healthy)"
elif (( $(echo "$MEM_FREE > 200" | bc -l) )); then
    echo -e "${YELLOW}⚠${NC} ${MEM_FREE}MB (low)"
else
    echo -e "${RED}✗${NC} ${MEM_FREE}MB (critical)"
fi

# 3. Check Disk Usage
echo -n "Disk Usage: "
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
if (( $DISK_USAGE < 80 )); then
    echo -e "${GREEN}✓${NC} ${DISK_USAGE}% (healthy)"
else
    echo -e "${YELLOW}⚠${NC} ${DISK_USAGE}% (high)"
fi

# 4. Check MCP Server Processes
echo -n "MCP Server Instances: "
MCP_COUNT=$(ps aux | grep -i "versatil-mcp" | grep -v grep | wc -l | tr -d ' ')
if [ "$MCP_COUNT" -eq 2 ]; then
    echo -e "${GREEN}✓${NC} ${MCP_COUNT} (healthy)"
elif [ "$MCP_COUNT" -lt 2 ]; then
    echo -e "${YELLOW}⚠${NC} ${MCP_COUNT} (low)"
else
    echo -e "${YELLOW}⚠${NC} ${MCP_COUNT} (too many)"
fi

# 5. Check TypeScript Compilation
echo -n "TypeScript: "
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo -e "${RED}✗${NC} Compilation errors found"
else
    echo -e "${GREEN}✓${NC} No errors"
fi

# 6. Check Git Status
echo -n "Git Status: "
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${GREEN}✓${NC} Clean"
else
    CHANGES=$(git status --porcelain | wc -l | tr -d ' ')
    echo -e "${YELLOW}⚠${NC} ${CHANGES} uncommitted changes"
fi

# 7. Check Security Vulnerabilities
echo -n "Security Audit: "
VULNS=$(npm audit --audit-level=moderate 2>&1 | grep -c "vulnerabilities" || echo "0")
if [ "$VULNS" -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No vulnerabilities"
else
    echo -e "${RED}✗${NC} Vulnerabilities found"
fi

echo ""
echo "========================================"
echo "Health Check Complete"
