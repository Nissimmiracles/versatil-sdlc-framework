#!/bin/bash
# VERSATIL Framework Initialization Hook
# Runs at the start of each Claude Code session

set -euo pipefail

VERSATIL_HOME="$HOME/.versatil"

# Ensure framework directories exist
mkdir -p "$VERSATIL_HOME/"{logs,context,rag-memory,config}

# Check framework installation
if ! command -v versatil-sdlc &> /dev/null; then
  cat <<EOF
{
  "systemMessage": "⚠️  VERSATIL Framework Not Found\n\nInstall: npm install -g versatil-sdlc-framework\nOr run: npm run init\n\nSession will continue with limited functionality."
}
EOF
  exit 0
fi

# Load framework configuration
if [[ -f ".versatil-project.json" ]]; then
  PROJECT_CONFIG=$(cat .versatil-project.json)
  PROJECT_NAME=$(echo "$PROJECT_CONFIG" | jq -r '.name')

  cat <<EOF
{
  "systemMessage": "🚀 VERSATIL Framework Initialized\n\nProject: $PROJECT_NAME\nFramework: v$(versatil-sdlc --version 2>/dev/null || echo '1.2.1')\nAgents: 6 OPERA agents ready\nRules: 1-5 enabled\n\n✨ Ready for AI-native development!"
}
EOF
else
  cat <<EOF
{
  "systemMessage": "💡 VERSATIL Quick Setup\n\nNo .versatil-project.json found.\nRun: /init or 'npx versatil-sdlc init'\n\nContinuing with default configuration..."
}
EOF
fi