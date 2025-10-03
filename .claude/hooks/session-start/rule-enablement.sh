#!/bin/bash
# VERSATIL Rule Enablement Hook
# Checks and enables framework Rules 1-5

set -euo pipefail

SETTINGS_FILE=".claude/settings.local.json"

if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo '{"systemMessage": "⚠️  Settings file not found. Using default configuration."}'
  exit 0
fi

# Check Rule 1-3 enablement (Rules 4-5 not in settings yet)
RULE1=$(jq -r '.versatil.rules.rule1_parallel_execution.enabled' "$SETTINGS_FILE" 2>/dev/null || echo "null")
RULE2=$(jq -r '.versatil.rules.rule2_stress_testing.enabled' "$SETTINGS_FILE" 2>/dev/null || echo "null")
RULE3=$(jq -r '.versatil.rules.rule3_daily_audit.enabled' "$SETTINGS_FILE" 2>/dev/null || echo "null")

ENABLED_RULES=0
[[ "$RULE1" == "true" ]] && ((ENABLED_RULES++))
[[ "$RULE2" == "true" ]] && ((ENABLED_RULES++))
[[ "$RULE3" == "true" ]] && ((ENABLED_RULES++))

cat <<EOF
{
  "systemMessage": "📊 VERSATIL Rules Status\n\nRule 1 (Parallel Execution): ${RULE1}\nRule 2 (Stress Testing): ${RULE2}\nRule 3 (Daily Audit): ${RULE3}\n\nActive Rules: $ENABLED_RULES/3\n\nManage rules: /parallel, /stress-test, /audit"
}
EOF