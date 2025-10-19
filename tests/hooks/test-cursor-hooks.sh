#!/bin/bash
# Test script for VERSATIL Cursor Hooks
# Tests all 5 hooks with sample inputs

set -e

HOOKS_DIR="$HOME/.versatil/hooks"
LOGS_DIR="$HOME/.versatil/logs"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing VERSATIL Cursor Hooks"
echo "================================"

# Test 1: afterFileEdit hook
echo -e "\n${YELLOW}Test 1: afterFileEdit hook${NC}"
echo '{"file_path": "/tmp/test.ts", "agent": "test-agent"}' | "$HOOKS_DIR/afterFileEdit.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ afterFileEdit: PASSED${NC}"
else
  echo -e "${RED}❌ afterFileEdit: FAILED${NC}"
  cat /tmp/hook-output.json
fi

# Test 2: afterFileEdit - isolation violation
echo -e "\n${YELLOW}Test 2: afterFileEdit - isolation violation${NC}"
echo '{"file_path": "/tmp/project/.versatil/test.ts", "agent": "test-agent"}' | "$HOOKS_DIR/afterFileEdit.sh" > /tmp/hook-output.json
if grep -q '"allowed": false' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Isolation violation: BLOCKED (correct)${NC}"
else
  echo -e "${RED}❌ Isolation violation: NOT BLOCKED (incorrect)${NC}"
  cat /tmp/hook-output.json
fi

# Test 3: beforeShellExecution - safe command
echo -e "\n${YELLOW}Test 3: beforeShellExecution - safe command${NC}"
echo '{"command": "npm test", "cwd": "/tmp", "agent": "test-agent"}' | "$HOOKS_DIR/beforeShellExecution.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Safe command: ALLOWED${NC}"
else
  echo -e "${RED}❌ Safe command: BLOCKED (incorrect)${NC}"
  cat /tmp/hook-output.json
fi

# Test 4: beforeShellExecution - destructive command
echo -e "\n${YELLOW}Test 4: beforeShellExecution - destructive command${NC}"
echo '{"command": "rm -rf /", "cwd": "/tmp", "agent": "test-agent"}' | "$HOOKS_DIR/beforeShellExecution.sh" > /tmp/hook-output.json
if grep -q '"allowed": false' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Destructive command: BLOCKED (correct)${NC}"
else
  echo -e "${RED}❌ Destructive command: NOT BLOCKED (incorrect)${NC}"
  cat /tmp/hook-output.json
fi

# Test 5: beforeReadFile - normal file
echo -e "\n${YELLOW}Test 5: beforeReadFile - normal file${NC}"
echo '{"file_path": "/tmp/test.ts", "agent": "test-agent", "purpose": "reading"}' | "$HOOKS_DIR/beforeReadFile.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json && ! grep -q '"sensitive": true' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Normal file: ALLOWED (not sensitive)${NC}"
else
  echo -e "${RED}❌ Normal file: Incorrect sensitivity${NC}"
  cat /tmp/hook-output.json
fi

# Test 6: beforeReadFile - sensitive file
echo -e "\n${YELLOW}Test 6: beforeReadFile - sensitive file${NC}"
echo '{"file_path": "/tmp/.env", "agent": "test-agent", "purpose": "reading"}' | "$HOOKS_DIR/beforeReadFile.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json && grep -q '"sensitive": true' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Sensitive file: WARNING shown (correct)${NC}"
else
  echo -e "${RED}❌ Sensitive file: No warning${NC}"
  cat /tmp/hook-output.json
fi

# Test 7: beforeSubmitPrompt - agent detection
echo -e "\n${YELLOW}Test 7: beforeSubmitPrompt - agent detection${NC}"
echo '{"prompt": "write tests for authentication", "context": [], "files": []}' | "$HOOKS_DIR/beforeSubmitPrompt.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json && grep -q 'Maria-QA' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Agent detection: Maria-QA suggested${NC}"
else
  echo -e "${RED}❌ Agent detection: Maria-QA not suggested${NC}"
  cat /tmp/hook-output.json
fi

# Test 8: stop hook
echo -e "\n${YELLOW}Test 8: stop hook${NC}"
echo '{"session_id": "test-123", "agent": "test-agent", "duration": 120, "actions": []}' | "$HOOKS_DIR/stop.sh" > /tmp/hook-output.json
if grep -q '"allowed": true' /tmp/hook-output.json && grep -q 'session_logged' /tmp/hook-output.json; then
  echo -e "${GREEN}✅ Stop hook: Session logged${NC}"
else
  echo -e "${RED}❌ Stop hook: Session not logged${NC}"
  cat /tmp/hook-output.json
fi

# Test 9: Check log files created
echo -e "\n${YELLOW}Test 9: Log files${NC}"
if [ -f "$LOGS_DIR/hooks.log" ]; then
  echo -e "${GREEN}✅ hooks.log created${NC}"
  echo "Last 3 entries:"
  tail -3 "$LOGS_DIR/hooks.log"
else
  echo -e "${RED}❌ hooks.log not created${NC}"
fi

# Test 10: Check metrics directory
echo -e "\n${YELLOW}Test 10: Metrics directory${NC}"
if [ -d "$HOME/.versatil/metrics" ]; then
  echo -e "${GREEN}✅ Metrics directory created${NC}"
else
  echo -e "${RED}❌ Metrics directory not created${NC}"
fi

# Cleanup
rm -f /tmp/hook-output.json

echo -e "\n================================"
echo -e "${GREEN}All hook tests completed!${NC}"
