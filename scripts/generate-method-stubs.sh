#!/bin/bash
# Script to generate method stubs from test failures
# Extracts methods accessed via agent['methodName'] pattern and generates stub implementations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Method Stub Generator ===${NC}"
echo ""

# Function to extract methods from a test file
extract_methods() {
    local test_file=$1
    local impl_file=$2

    echo -e "${YELLOW}Analyzing: ${test_file}${NC}"

    # Extract methods accessed via agent['methodName'] or agent["methodName"] pattern
    local methods=$(grep -oE "agent\[['\"][^'\"]+['\"]" "$test_file" 2>/dev/null | sed -E "s/agent\[['\"]([^'\"]+)['\"].*/\1/" | sort -u || true)

    if [ -z "$methods" ]; then
        echo -e "${RED}  No methods found${NC}"
        return
    fi

    echo -e "${GREEN}  Found methods:${NC}"
    echo "$methods" | while read -r method; do
        echo "    - $method"
    done

    # Generate stub file
    local stub_file="/tmp/stubs-$(basename "$test_file" .test.ts).ts"
    echo "" > "$stub_file"

    echo "$methods" | while read -r method; do
        cat >> "$stub_file" <<EOF
  protected ${method}(content: string, ...args: any[]): boolean {
    // TODO: Implement ${method}
    // Generated stub from test expectations
    return false;
  }

EOF
    done

    echo -e "${GREEN}  Generated stubs: ${stub_file}${NC}"
}

# Function to analyze all sub-agent tests and generate stubs
analyze_all_subagents() {
    echo -e "${GREEN}Analyzing James Frontend Sub-Agents...${NC}"
    for test_file in src/agents/opera/james-frontend/sub-agents/james-*.test.ts; do
        if [ -f "$test_file" ]; then
            impl_file="${test_file%.test.ts}.ts"
            extract_methods "$test_file" "$impl_file"
        fi
    done

    echo ""
    echo -e "${GREEN}Analyzing Marcus Backend Sub-Agents...${NC}"
    for test_file in src/agents/opera/marcus-backend/sub-agents/marcus-*.test.ts; do
        if [ -f "$test_file" ]; then
            impl_file="${test_file%.test.ts}.ts"
            extract_methods "$test_file" "$impl_file"
        fi
    done

    echo ""
    echo -e "${GREEN}Stub files generated in /tmp/${NC}"
    echo -e "${YELLOW}Review stubs and copy them into implementation files${NC}"
}

# Main execution
analyze_all_subagents

echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo "Stub files are in /tmp/stubs-*.ts"
echo ""
echo "Next steps:"
echo "1. Review generated stubs in /tmp/"
echo "2. Copy stub methods into implementation files"
echo "3. Implement actual logic for each TODO method"
echo "4. Run tests to verify fixes"
