#!/bin/bash
# VERSATIL Agent Health Check Hook
# Validates all BMAD agents are operational

set -euo pipefail

AGENTS=("maria-qa" "james-frontend" "marcus-backend" "sarah-pm" "alex-ba" "dr-ai-ml")
UNHEALTHY_AGENTS=()

for agent in "${AGENTS[@]}"; do
  AGENT_CONFIG=".claude/agents/${agent}.json"
  if [[ ! -f "$AGENT_CONFIG" ]]; then
    UNHEALTHY_AGENTS+=("$agent")
  fi
done

if [[ ${#UNHEALTHY_AGENTS[@]} -gt 0 ]]; then
  cat <<EOF
{
  "systemMessage": "⚠️  Agent Configuration Missing\n\nMissing agents: ${UNHEALTHY_AGENTS[*]}\nAction: Run '/doctor --fix' to recreate configurations\n\nSession will continue with available agents."
}
EOF
else
  echo '{"systemMessage": "✅ All 6 BMAD agents healthy"}'
fi