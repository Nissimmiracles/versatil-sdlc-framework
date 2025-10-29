#!/bin/bash

###############################################################################
# Watch and Test Script
#
# Continuous feedback loop for frontend development:
# - Watches frontend files for changes
# - Runs browser tests automatically
# - Captures console/network errors
# - Creates Guardian TODOs
# - Displays live debugging dashboard
#
# Usage:
#   npm run watch-and-test              # Watch all frontend files
#   npm run watch-and-test -- src/      # Watch specific directory
#   npm run watch-and-test -- --help    # Show help
#
# @version 1.0.0
# @since v7.14.0
###############################################################################

set -e

# Configuration
WATCH_DIR="${1:-.}"
BROWSER_ERROR_CAPTURE="${BROWSER_ERROR_CAPTURE:-true}"
BROWSER_ERROR_AUTO_TODO="${BROWSER_ERROR_AUTO_TODO:-true}"
DEV_DASHBOARD_ENABLED="${DEV_DASHBOARD_ENABLED:-true}"
TEST_ON_CHANGE="${TEST_ON_CHANGE:-true}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help message
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
  echo ""
  echo "Watch and Test Script - Continuous Frontend Testing"
  echo ""
  echo "Usage:"
  echo "  npm run watch-and-test              # Watch all frontend files"
  echo "  npm run watch-and-test -- src/      # Watch specific directory"
  echo "  npm run watch-and-test -- --help    # Show this help"
  echo ""
  echo "Environment Variables:"
  echo "  BROWSER_ERROR_CAPTURE=true|false    # Enable real-time error capture"
  echo "  BROWSER_ERROR_AUTO_TODO=true|false  # Auto-create Guardian TODOs"
  echo "  DEV_DASHBOARD_ENABLED=true|false    # Enable live debugging dashboard"
  echo "  TEST_ON_CHANGE=true|false           # Run tests on file change"
  echo ""
  echo "Features:"
  echo "  - Real-time browser error capture"
  echo "  - Automatic Guardian TODO creation"
  echo "  - Live debugging dashboard"
  echo "  - Context-aware E2E tests"
  echo "  - Console/network error tracking"
  echo ""
  exit 0
fi

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  Watch and Test Script                        ║"
echo "║           Continuous Frontend Testing & Debugging             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check dependencies
echo -e "${YELLOW}⏳ Checking dependencies...${NC}"

if ! command -v npx &> /dev/null; then
  echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
  exit 1
fi

if ! command -v fswatch &> /dev/null && ! command -v inotifywait &> /dev/null; then
  echo -e "${YELLOW}⚠️  fswatch/inotifywait not found${NC}"
  echo -e "${YELLOW}   Installing fswatch...${NC}"

  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install fswatch
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get install -y inotify-tools
  fi
fi

echo -e "${GREEN}✅ Dependencies OK${NC}\n"

# Configuration summary
echo -e "${BLUE}📊 Configuration:${NC}"
echo -e "   Watch Directory: ${YELLOW}${WATCH_DIR}${NC}"
echo -e "   Browser Error Capture: ${YELLOW}${BROWSER_ERROR_CAPTURE}${NC}"
echo -e "   Auto Guardian TODOs: ${YELLOW}${BROWSER_ERROR_AUTO_TODO}${NC}"
echo -e "   Live Dashboard: ${YELLOW}${DEV_DASHBOARD_ENABLED}${NC}"
echo -e "   Test on Change: ${YELLOW}${TEST_ON_CHANGE}${NC}"
echo ""

# Start dev server (if not running)
check_dev_server() {
  local BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3000}"

  if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|302"; then
    echo -e "${GREEN}✅ Dev server running${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️  Dev server not running${NC}"
    echo -e "${YELLOW}   Starting dev server...${NC}"
    npm run dev &
    DEV_SERVER_PID=$!

    # Wait for server to start
    for i in {1..30}; do
      sleep 1
      if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|302"; then
        echo -e "${GREEN}✅ Dev server started${NC}"
        return 0
      fi
    done

    echo -e "${RED}❌ Failed to start dev server${NC}"
    return 1
  fi
}

# Start browser monitor dashboard
start_dashboard() {
  if [ "$DEV_DASHBOARD_ENABLED" = "true" ]; then
    echo -e "${BLUE}🚀 Starting browser monitor dashboard...${NC}"
    npx tsx src/dashboard/dev-browser-monitor.ts &
    DASHBOARD_PID=$!
    sleep 2
    echo -e "${GREEN}✅ Dashboard running on ws://localhost:3001${NC}"
  fi
}

# Run browser check on file change
run_browser_check() {
  local FILE_PATH="$1"

  echo -e "\n${BLUE}🌐 File changed: ${FILE_PATH}${NC}"

  # Run post-file-edit hook
  if [ -f ".claude/hooks/post-file-edit-browser-check.ts" ]; then
    echo -e "${YELLOW}⏳ Running browser check...${NC}"

    export FILE_PATH="$FILE_PATH"
    npx tsx .claude/hooks/post-file-edit-browser-check.ts "$FILE_PATH"

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Browser check complete${NC}"
    else
      echo -e "${RED}❌ Browser check failed${NC}"
    fi
  fi

  # Run E2E tests
  if [ "$TEST_ON_CHANGE" = "true" ]; then
    echo -e "${YELLOW}⏳ Running E2E tests...${NC}"
    npm run test:e2e -- --project=context-validation --headed=false --reporter=line

    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ All tests passed${NC}"
    else
      echo -e "${RED}❌ Some tests failed${NC}"
    fi
  fi
}

# Watch files for changes
watch_files() {
  echo -e "\n${GREEN}👀 Watching files in: ${WATCH_DIR}${NC}"
  echo -e "${YELLOW}   Press Ctrl+C to stop${NC}\n"

  # macOS (fswatch)
  if command -v fswatch &> /dev/null; then
    fswatch -0 -r \
      --exclude='node_modules' \
      --exclude='dist' \
      --exclude='.git' \
      --include='\.tsx?$' \
      --include='\.jsx?$' \
      --include='\.vue$' \
      --include='\.svelte$' \
      --include='\.css$' \
      "$WATCH_DIR" | \
    while IFS= read -r -d '' file; do
      run_browser_check "$file"
    done

  # Linux (inotifywait)
  elif command -v inotifywait &> /dev/null; then
    inotifywait -m -r -e modify,create \
      --exclude '(node_modules|dist|\.git)' \
      --format '%w%f' \
      "$WATCH_DIR" | \
    while read file; do
      if [[ "$file" =~ \.(tsx?|jsx?|vue|svelte|css)$ ]]; then
        run_browser_check "$file"
      fi
    done

  else
    echo -e "${RED}❌ No file watcher available${NC}"
    exit 1
  fi
}

# Cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}🛑 Stopping watch-and-test...${NC}"

  # Kill dashboard
  if [ -n "$DASHBOARD_PID" ]; then
    kill $DASHBOARD_PID 2>/dev/null || true
  fi

  # Kill dev server (if started by this script)
  if [ -n "$DEV_SERVER_PID" ]; then
    kill $DEV_SERVER_PID 2>/dev/null || true
  fi

  echo -e "${GREEN}✅ Stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
  # Check dev server
  check_dev_server || exit 1

  # Start dashboard
  start_dashboard

  # Watch files
  watch_files
}

# Run main
main
