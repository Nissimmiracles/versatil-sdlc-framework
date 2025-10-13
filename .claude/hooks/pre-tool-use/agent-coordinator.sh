#!/bin/bash
# VERSATIL Agent Coordinator Hook
# Auto-activates agents based on file patterns before tool use

# Exit if not in VERSATIL project
if [ ! -f ".versatil-project.json" ] && [ ! -f "CLAUDE.md" ]; then
  exit 0
fi

# Get tool name and file path from environment
TOOL_NAME="${TOOL_NAME:-unknown}"
FILE_PATH="${FILE_PATH:-}"

# Skip if no file path provided
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Get file extension
FILE_EXT="${FILE_PATH##*.}"

# Agent activation patterns (from .cursor/settings.json)
activate_maria_qa() {
  case "$FILE_EXT" in
    test.ts|test.js|spec.ts|spec.js)
      echo "🤖 Maria-QA: Analyzing test file..."
      return 0
      ;;
  esac
  return 1
}

activate_james_frontend() {
  case "$FILE_EXT" in
    tsx|jsx|vue|svelte|css|scss|sass)
      echo "🤖 James-Frontend: Analyzing UI component..."
      return 0
      ;;
  esac
  return 1
}

activate_marcus_backend() {
  case "$FILE_PATH" in
    *api*|*routes*|*controllers*|*server*|*backend*)
      echo "🤖 Marcus-Backend: Analyzing API endpoint..."
      return 0
      ;;
  esac
  return 1
}

activate_dana_database() {
  case "$FILE_EXT" in
    sql|prisma)
      echo "🤖 Dana-Database: Analyzing database schema..."
      return 0
      ;;
  esac
  return 1
}

activate_sarah_pm() {
  case "$FILE_EXT" in
    md)
      if [[ "$FILE_PATH" == *"docs"* ]] || [[ "$FILE_PATH" == "README"* ]]; then
        echo "🤖 Sarah-PM: Analyzing documentation..."
        return 0
      fi
      ;;
  esac
  return 1
}

activate_alex_ba() {
  case "$FILE_PATH" in
    *requirements*|*.feature|*.story|*specs*)
      echo "🤖 Alex-BA: Analyzing requirements..."
      return 0
      ;;
  esac
  return 1
}

activate_dr_ai_ml() {
  case "$FILE_EXT" in
    py|ipynb)
      if [[ "$FILE_PATH" == *"model"* ]] || [[ "$FILE_PATH" == *"ml"* ]] || [[ "$FILE_PATH" == *"ai"* ]]; then
        echo "🤖 Dr.AI-ML: Analyzing ML code..."
        return 0
      fi
      ;;
  esac
  return 1
}

# Try to activate relevant agents
activate_maria_qa && exit 0
activate_james_frontend && exit 0
activate_marcus_backend && exit 0
activate_dana_database && exit 0
activate_sarah_pm && exit 0
activate_alex_ba && exit 0
activate_dr_ai_ml && exit 0

# No agent activated
exit 0
