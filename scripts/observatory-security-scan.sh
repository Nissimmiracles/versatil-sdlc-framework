#!/usr/bin/env bash

################################################################################
# Mozilla Observatory Security Scanner
# Comprehensive web security header and TLS configuration scanning
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
TARGET_URL="${OBSERVATORY_TARGET_URL:-https://localhost:3000}"
OUTPUT_DIR="${OBSERVATORY_OUTPUT_DIR:-./security-reports}"
TARGET_SCORE="${OBSERVATORY_TARGET_SCORE:-90}" # Target A+ grade (90+)
FAIL_ON_BELOW_TARGET="${OBSERVATORY_FAIL_ON_BELOW_TARGET:-true}"
VERBOSE="${OBSERVATORY_VERBOSE:-false}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

################################################################################
# Functions
################################################################################

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  🔒 Mozilla Observatory Security Scanner${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."

    # Check for curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi

    # Check for jq
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed (brew install jq)"
        exit 1
    fi

    log_success "All dependencies available"
}

create_output_directory() {
    mkdir -p "$OUTPUT_DIR"
    log_success "Output directory: $OUTPUT_DIR"
}

scan_with_observatory() {
    local url=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local scan_file="$OUTPUT_DIR/observatory-scan-$timestamp.json"

    log_info "Scanning: $url"
    log_info "This may take 60-90 seconds..."

    # Start scan using Mozilla Observatory API
    local scan_init=$(curl -s -X POST "https://http-observatory.security.mozilla.org/api/v1/analyze?host=$(echo "$url" | sed 's|https\?://||' | cut -d/ -f1)")

    if [ "$VERBOSE" = "true" ]; then
        echo "$scan_init" | jq '.'
    fi

    # Wait for scan to complete
    local scan_id=$(echo "$scan_init" | jq -r '.scan_id // empty')

    if [ -z "$scan_id" ]; then
        log_warning "Scan ID not found, trying direct scan..."
        sleep 5
    fi

    # Poll for results
    local max_attempts=30
    local attempt=0
    local scan_result=""

    while [ $attempt -lt $max_attempts ]; do
        scan_result=$(curl -s "https://http-observatory.security.mozilla.org/api/v1/analyze?host=$(echo "$url" | sed 's|https\?://||' | cut -d/ -f1)")
        local state=$(echo "$scan_result" | jq -r '.state // empty')

        if [ "$state" = "FINISHED" ]; then
            log_success "Scan completed"
            break
        elif [ "$state" = "FAILED" ]; then
            log_error "Scan failed"
            return 1
        fi

        log_info "Scan in progress... (attempt $((attempt + 1))/$max_attempts)"
        sleep 3
        attempt=$((attempt + 1))
    done

    if [ $attempt -eq $max_attempts ]; then
        log_error "Scan timeout after $max_attempts attempts"
        return 1
    fi

    # Save raw scan result
    echo "$scan_result" | jq '.' > "$scan_file"
    log_success "Scan results saved to: $scan_file"

    # Get test results
    local host=$(echo "$url" | sed 's|https\?://||' | cut -d/ -f1)
    local tests_result=$(curl -s "https://http-observatory.security.mozilla.org/api/v1/getScanResults?scan=$(echo "$scan_result" | jq -r '.scan_id')")
    echo "$tests_result" | jq '.' > "$OUTPUT_DIR/observatory-tests-$timestamp.json"

    echo "$scan_file"
}

parse_and_display_results() {
    local scan_file=$1

    if [ ! -f "$scan_file" ]; then
        log_error "Scan file not found: $scan_file"
        return 1
    fi

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  📊 Security Scan Results${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    local score=$(jq -r '.score // 0' "$scan_file")
    local grade=$(jq -r '.grade // "F"' "$scan_file")
    local tests_passed=$(jq -r '.tests_passed // 0' "$scan_file")
    local tests_failed=$(jq -r '.tests_failed // 0' "$scan_file")
    local tests_quantity=$(jq -r '.tests_quantity // 0' "$scan_file")

    # Display score with color
    if [ "$score" -ge 90 ]; then
        echo -e "${GREEN}Score: $score/100 (Grade: $grade)${NC} ✅"
    elif [ "$score" -ge 70 ]; then
        echo -e "${YELLOW}Score: $score/100 (Grade: $grade)${NC} ⚠️"
    else
        echo -e "${RED}Score: $score/100 (Grade: $grade)${NC} ❌"
    fi

    echo ""
    echo -e "Tests Passed:   ${GREEN}$tests_passed${NC}"
    echo -e "Tests Failed:   ${RED}$tests_failed${NC}"
    echo -e "Total Tests:    $tests_quantity"
    echo ""

    # Parse test results from tests file
    local tests_file="${scan_file/observatory-scan/observatory-tests}"

    if [ -f "$tests_file" ]; then
        echo -e "${BLUE}Test Results by Category:${NC}"
        echo ""

        # Extract and display test results
        jq -r 'to_entries[] | "\(.key): \(.value.pass) (Score: \(.value.score_modifier))"' "$tests_file" | while read -r line; do
            if [[ $line == *"true"* ]]; then
                echo -e "  ${GREEN}✓${NC} $line"
            else
                echo -e "  ${RED}✗${NC} $line"
            fi
        done
    fi

    echo ""

    # Return score for script exit code
    echo "$score"
}

generate_html_report() {
    local scan_file=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local html_file="$OUTPUT_DIR/observatory-report-$timestamp.html"

    log_info "Generating HTML report..."

    local score=$(jq -r '.score // 0' "$scan_file")
    local grade=$(jq -r '.grade // "F"' "$scan_file")
    local scan_url=$(jq -r '.scan_id // ""' "$scan_file")

    cat > "$html_file" <<EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mozilla Observatory Security Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
        }
        .score {
            font-size: 72px;
            font-weight: bold;
            margin: 20px 0;
        }
        .grade {
            font-size: 36px;
            opacity: 0.9;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-item {
            padding: 12px;
            margin: 10px 0;
            border-left: 4px solid #ddd;
            background: #f9f9f9;
        }
        .test-item.pass {
            border-left-color: #4caf50;
        }
        .test-item.fail {
            border-left-color: #f44336;
        }
        .metric {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            margin: 5px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Mozilla Observatory Security Report</h1>
        <div class="score">$score</div>
        <div class="grade">Grade: $grade</div>
        <p>Generated: $(date)</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <span class="metric">Score: $score/100</span>
        <span class="metric">Grade: $grade</span>
        <span class="metric">Target URL: $TARGET_URL</span>
    </div>

    <div class="section">
        <h2>Security Headers</h2>
        <pre>$(cat "$scan_file" | jq -r '.response_headers // {}')</pre>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        <p>For detailed recommendations, visit: <a href="https://observatory.mozilla.org">Mozilla Observatory</a></p>
    </div>
</body>
</html>
EOF

    log_success "HTML report: $html_file"
    echo "$html_file"
}

generate_markdown_summary() {
    local scan_file=$1
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local md_file="$OUTPUT_DIR/observatory-summary-$timestamp.md"

    local score=$(jq -r '.score // 0' "$scan_file")
    local grade=$(jq -r '.grade // "F"' "$scan_file")

    cat > "$md_file" <<EOF
# 🔒 Mozilla Observatory Security Report

**Generated**: $(date)
**Target URL**: $TARGET_URL
**Score**: $score/100
**Grade**: $grade

## Summary

- Tests Passed: $(jq -r '.tests_passed // 0' "$scan_file")
- Tests Failed: $(jq -r '.tests_failed // 0' "$scan_file")
- Total Tests: $(jq -r '.tests_quantity // 0' "$scan_file")

## Security Posture

$(if [ "$score" -ge 90 ]; then
    echo "✅ **EXCELLENT** - Site meets A+ security standards"
elif [ "$score" -ge 70 ]; then
    echo "⚠️ **GOOD** - Some improvements recommended"
else
    echo "❌ **NEEDS ATTENTION** - Critical security issues detected"
fi)

## Next Steps

1. Review failed tests in detail
2. Implement missing security headers
3. Configure CSP policies
4. Re-scan after fixes

---

*Report generated by VERSATIL Observatory Integration*
EOF

    log_success "Markdown summary: $md_file"
    echo "$md_file"
}

main() {
    print_header

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --url)
                TARGET_URL="$2"
                shift 2
                ;;
            --target-score)
                TARGET_SCORE="$2"
                shift 2
                ;;
            --output-dir)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE="true"
                shift
                ;;
            --no-fail)
                FAIL_ON_BELOW_TARGET="false"
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --url URL              Target URL to scan (default: $TARGET_URL)"
                echo "  --target-score SCORE   Minimum acceptable score (default: $TARGET_SCORE)"
                echo "  --output-dir DIR       Output directory (default: $OUTPUT_DIR)"
                echo "  --verbose              Verbose output"
                echo "  --no-fail              Don't fail on low score"
                echo "  --help                 Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    check_dependencies
    create_output_directory

    log_info "Target URL: $TARGET_URL"
    log_info "Target Score: $TARGET_SCORE"
    log_info "Output Directory: $OUTPUT_DIR"
    echo ""

    # Run scan
    scan_file=$(scan_with_observatory "$TARGET_URL")

    if [ -z "$scan_file" ] || [ ! -f "$scan_file" ]; then
        log_error "Scan failed to produce results"
        exit 1
    fi

    # Parse and display results
    score=$(parse_and_display_results "$scan_file")

    # Generate reports
    generate_html_report "$scan_file"
    generate_markdown_summary "$scan_file"

    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Check if score meets target
    if [ "$score" -ge "$TARGET_SCORE" ]; then
        log_success "Security score ($score) meets target ($TARGET_SCORE)"
        exit 0
    else
        log_warning "Security score ($score) below target ($TARGET_SCORE)"

        if [ "$FAIL_ON_BELOW_TARGET" = "true" ]; then
            log_error "Build failed due to low security score"
            exit 1
        else
            log_warning "Continuing despite low score (--no-fail enabled)"
            exit 0
        fi
    fi
}

# Run main function
main "$@"
