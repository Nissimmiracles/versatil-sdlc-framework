#!/bin/bash

###############################################################################
# VERSATIL SDLC Framework - Local Accessibility Testing Script
#
# This script runs WCAG 2.1 AA accessibility tests locally and generates
# comprehensive reports. Use this before committing to catch violations early.
#
# Usage:
#   ./scripts/run-accessibility-tests.sh [options]
#
# Options:
#   --quick         Run quick accessibility checks only
#   --full          Run full WCAG 2.1 AA test suite (default)
#   --keyboard      Run keyboard navigation tests only
#   --report        Generate and open HTML report
#   --ci            Run in CI mode (no browser opening)
#   --help          Show this help message
#
# Examples:
#   ./scripts/run-accessibility-tests.sh                    # Full test suite
#   ./scripts/run-accessibility-tests.sh --quick --report   # Quick tests + report
#   ./scripts/run-accessibility-tests.sh --keyboard         # Keyboard tests only
#
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${PROJECT_ROOT}/test-results"
VIOLATION_REPORT="${REPORT_DIR}/accessibility-violations.json"
VIOLATION_HTML="${REPORT_DIR}/accessibility-violations.html"
PLAYWRIGHT_REPORT="${PROJECT_ROOT}/playwright-report"

# Default options
MODE="full"
OPEN_REPORT=false
CI_MODE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --quick)
      MODE="quick"
      shift
      ;;
    --full)
      MODE="full"
      shift
      ;;
    --keyboard)
      MODE="keyboard"
      shift
      ;;
    --report)
      OPEN_REPORT=true
      shift
      ;;
    --ci)
      CI_MODE=true
      shift
      ;;
    --help)
      grep "^#" "$0" | grep -v "#!/bin/bash" | sed 's/^# //' | sed 's/^#//'
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Print header
print_header() {
  echo ""
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo "  ♿ VERSATIL SDLC Framework - WCAG 2.1 AA Accessibility Testing"
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo ""
}

# Print section
print_section() {
  echo ""
  echo -e "${BLUE}▶ $1${NC}"
  echo "────────────────────────────────────────────────────────────────────────────────"
}

# Check prerequisites
check_prerequisites() {
  print_section "Checking prerequisites"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js: https://nodejs.org/"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ npm $(npm --version)${NC}"

  # Check if node_modules exists
  if [ ! -d "${PROJECT_ROOT}/node_modules" ]; then
    echo -e "${YELLOW}⚠ node_modules not found, installing dependencies...${NC}"
    cd "${PROJECT_ROOT}"
    npm install
  fi
  echo -e "${GREEN}✓ Dependencies installed${NC}"

  # Check Playwright browsers
  if ! npx playwright --version &> /dev/null; then
    echo -e "${RED}✗ Playwright not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Playwright installed${NC}"

  # Install browsers if needed
  if [ ! -d "$HOME/.cache/ms-playwright" ] && [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo -e "${YELLOW}⚠ Installing Playwright browsers...${NC}"
    npx playwright install chromium
  fi
  echo -e "${GREEN}✓ Playwright browsers ready${NC}"
}

# Clean previous reports
clean_reports() {
  print_section "Cleaning previous reports"

  if [ -d "${REPORT_DIR}" ]; then
    rm -rf "${REPORT_DIR}"
    echo -e "${GREEN}✓ Cleaned test-results directory${NC}"
  fi

  if [ -d "${PLAYWRIGHT_REPORT}" ]; then
    rm -rf "${PLAYWRIGHT_REPORT}"
    echo -e "${GREEN}✓ Cleaned playwright-report directory${NC}"
  fi

  mkdir -p "${REPORT_DIR}"
}

# Run WCAG 2.1 AA tests
run_wcag_tests() {
  print_section "Running WCAG 2.1 AA compliance tests"

  cd "${PROJECT_ROOT}"

  if [ "$CI_MODE" = true ]; then
    npx playwright test tests/accessibility/wcag-2.1-aa-enforcement.a11y.spec.ts --project=accessibility --reporter=list,json,html
  else
    npx playwright test tests/accessibility/wcag-2.1-aa-enforcement.a11y.spec.ts --project=accessibility --reporter=list,html
  fi

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ All WCAG 2.1 AA tests passed${NC}"
  else
    echo -e "${RED}✗ Some WCAG 2.1 AA tests failed${NC}"
  fi

  return $exit_code
}

# Run keyboard navigation tests
run_keyboard_tests() {
  print_section "Running keyboard navigation tests"

  cd "${PROJECT_ROOT}"

  if [ "$CI_MODE" = true ]; then
    npx playwright test tests/accessibility/keyboard-navigation.a11y.spec.ts --project=accessibility --reporter=list,json,html
  else
    npx playwright test tests/accessibility/keyboard-navigation.a11y.spec.ts --project=accessibility --reporter=list,html
  fi

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ All keyboard navigation tests passed${NC}"
  else
    echo -e "${RED}✗ Some keyboard navigation tests failed${NC}"
  fi

  return $exit_code
}

# Run quick accessibility checks
run_quick_tests() {
  print_section "Running quick accessibility checks"

  cd "${PROJECT_ROOT}"

  if [ "$CI_MODE" = true ]; then
    npx playwright test tests/accessibility/ --project=accessibility --grep="@quick" --reporter=list,html || true
  else
    npx playwright test tests/accessibility/accessibility-compliance.a11y.ts --project=accessibility --reporter=list,html || true
  fi

  echo -e "${GREEN}✓ Quick accessibility checks completed${NC}"
}

# Generate summary report
generate_summary() {
  print_section "Test Summary"

  if [ -f "${VIOLATION_REPORT}" ]; then
    # Use jq if available, otherwise use basic parsing
    if command -v jq &> /dev/null; then
      local total_pages=$(jq '.summary.totalPages' "${VIOLATION_REPORT}")
      local total_violations=$(jq '.summary.totalViolations' "${VIOLATION_REPORT}")

      echo ""
      echo "Total Pages Tested: ${total_pages}"
      echo "Total Violations:   ${total_violations}"
      echo ""

      if [ "$total_violations" -eq 0 ]; then
        echo -e "${GREEN}✓ All pages meet WCAG 2.1 AA standards!${NC}"
      else
        echo -e "${RED}✗ WCAG 2.1 AA violations detected${NC}"
        echo ""
        echo "Violations by Page:"
        jq -r '.pages | to_entries[] | "  \(.value.violationCount == 0 and "✓" or "✗") \(.key): \(.value.violationCount) violations"' "${VIOLATION_REPORT}"
      fi
    else
      echo -e "${YELLOW}⚠ jq not installed, cannot parse JSON report${NC}"
      echo "Install jq for detailed summary: brew install jq (macOS) or apt-get install jq (Linux)"
    fi
  else
    echo -e "${YELLOW}⚠ No violation report found${NC}"
  fi

  echo ""
  echo "Reports:"
  if [ -f "${VIOLATION_JSON}" ]; then
    echo "  JSON: ${VIOLATION_REPORT}"
  fi
  if [ -f "${VIOLATION_HTML}" ]; then
    echo "  HTML: ${VIOLATION_HTML}"
  fi
  if [ -d "${PLAYWRIGHT_REPORT}" ]; then
    echo "  Playwright: ${PLAYWRIGHT_REPORT}/index.html"
  fi
}

# Open report in browser
open_report() {
  if [ "$OPEN_REPORT" = true ] && [ "$CI_MODE" = false ]; then
    print_section "Opening report in browser"

    local report_to_open=""

    # Prefer HTML violation report if it exists
    if [ -f "${VIOLATION_HTML}" ]; then
      report_to_open="${VIOLATION_HTML}"
    elif [ -f "${PLAYWRIGHT_REPORT}/index.html" ]; then
      report_to_open="${PLAYWRIGHT_REPORT}/index.html"
    fi

    if [ -n "$report_to_open" ]; then
      if command -v open &> /dev/null; then
        # macOS
        open "${report_to_open}"
      elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "${report_to_open}"
      elif command -v start &> /dev/null; then
        # Windows
        start "${report_to_open}"
      else
        echo -e "${YELLOW}⚠ Cannot open browser automatically${NC}"
        echo "Please open: ${report_to_open}"
      fi
      echo -e "${GREEN}✓ Report opened in browser${NC}"
    else
      echo -e "${YELLOW}⚠ No report found to open${NC}"
    fi
  fi
}

# Main execution
main() {
  local overall_exit_code=0

  print_header
  check_prerequisites
  clean_reports

  case $MODE in
    quick)
      run_quick_tests || overall_exit_code=$?
      ;;
    keyboard)
      run_keyboard_tests || overall_exit_code=$?
      ;;
    full)
      run_wcag_tests || overall_exit_code=$?
      run_keyboard_tests || overall_exit_code=$?
      ;;
  esac

  generate_summary
  open_report

  # Print footer
  echo ""
  echo "════════════════════════════════════════════════════════════════════════════════"
  if [ $overall_exit_code -eq 0 ]; then
    echo -e "  ${GREEN}✓ Accessibility testing completed successfully${NC}"
  else
    echo -e "  ${RED}✗ Accessibility testing completed with failures${NC}"
  fi
  echo "════════════════════════════════════════════════════════════════════════════════"
  echo ""

  exit $overall_exit_code
}

# Run main function
main
