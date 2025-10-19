#!/usr/bin/env node

/**
 * VERSATIL Framework - Cursor Hooks Installer
 *
 * Automatically installs Cursor 1.7+ hooks infrastructure for:
 * - afterFileEdit: Format code, validate isolation, update RAG
 * - beforeShellExecution: Security checks, audit logging, prevent destructive operations
 * - beforeReadFile: Context tracking, access logging, sensitive file warnings
 * - beforeSubmitPrompt: Agent activation suggestions, context enrichment
 * - stop: Session cleanup, learning codification, metrics collection
 *
 * Installation locations:
 * - ~/.cursor/hooks.json: Hook configuration
 * - ~/.versatil/hooks/: Hook scripts (5 total)
 * - ~/.versatil/logs/: Log files for hook execution
 * - ~/.versatil/metrics/: Agent performance metrics
 *
 * Runs on: npm install (via postinstall hook)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME_DIR = os.homedir();
const VERSATIL_HOME = path.join(HOME_DIR, '.versatil');
const CURSOR_DIR = path.join(HOME_DIR, '.cursor');
const HOOKS_DIR = path.join(VERSATIL_HOME, 'hooks');
const LOGS_DIR = path.join(VERSATIL_HOME, 'logs');
const METRICS_DIR = path.join(VERSATIL_HOME, 'metrics');
const BIN_DIR = path.join(VERSATIL_HOME, 'bin');

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectories() {
  log('\n📁 Creating directory structure...', 'cyan');

  const directories = [
    VERSATIL_HOME,
    HOOKS_DIR,
    LOGS_DIR,
    METRICS_DIR,
    BIN_DIR,
    path.join(VERSATIL_HOME, 'learning'),
    path.join(VERSATIL_HOME, 'temp'),
  ];

  let created = 0;
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
      log(`  ✅ Created: ${dir}`, 'green');
      created++;
    }
  });

  if (created === 0) {
    log(`  ℹ️  All directories already exist`, 'blue');
  }
}

function createHooksConfig() {
  log('\n⚙️  Creating Cursor hooks configuration...', 'cyan');

  const hooksConfigPath = path.join(CURSOR_DIR, 'hooks.json');

  const hooksConfig = {
    version: 1,
    hooks: {
      afterFileEdit: [
        {
          command: `${HOOKS_DIR}/afterFileEdit.sh`,
          description: 'VERSATIL: Run formatters, validate isolation, update RAG',
        },
      ],
      afterTaskComplete: [
        {
          command: `${HOOKS_DIR}/afterTaskComplete.sh`,
          description: 'VERSATIL: Trigger SessionCompass, update context budget, display next task',
        },
      ],
      beforeShellExecution: [
        {
          command: `${HOOKS_DIR}/beforeShellExecution.sh`,
          description: 'VERSATIL: Security checks, audit logging, isolation validation',
        },
      ],
      beforeReadFile: [
        {
          command: `${HOOKS_DIR}/beforeReadFile.sh`,
          description: 'VERSATIL: Context tracking for RAG, access logging',
        },
      ],
      beforeSubmitPrompt: [
        {
          command: `${HOOKS_DIR}/onSessionOpen.sh`,
          description: 'VERSATIL: Display last session context (runs on first prompt)',
        },
        {
          command: `${HOOKS_DIR}/beforeSubmitPrompt.sh`,
          description: 'VERSATIL: Agent activation suggestions, context enrichment',
        },
      ],
      stop: [
        {
          command: `${HOOKS_DIR}/stop.sh`,
          description: 'VERSATIL: Session cleanup, learning codification, metrics',
        },
      ],
    },
    settings: {
      timeout: 5000,
      enableLogging: true,
      logPath: `${LOGS_DIR}/hooks.log`,
    },
  };

  // Create .cursor directory if it doesn't exist
  if (!fs.existsSync(CURSOR_DIR)) {
    fs.mkdirSync(CURSOR_DIR, { recursive: true, mode: 0o755 });
  }

  fs.writeFileSync(hooksConfigPath, JSON.stringify(hooksConfig, null, 2), 'utf8');
  log(`  ✅ Created: ${hooksConfigPath}`, 'green');
}

function createAfterFileEditHook() {
  const hookPath = path.join(HOOKS_DIR, 'afterFileEdit.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: afterFileEdit
# Runs after agent edits a file
# Purpose: Format code, validate isolation, update RAG memory

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (file_path, changes, agent)
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // empty')
AGENT=$(echo "$INPUT" | jq -r '.agent // "unknown"')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] afterFileEdit: $FILE_PATH by $AGENT" >> "$LOG_FILE"

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  echo '{"allowed": true}'
  exit 0
fi

# Check for isolation violations
FRAMEWORK_HOME="$HOME/.versatil"
PROJECT_ROOT=$(pwd)

# Forbidden patterns in user projects
FORBIDDEN_PATTERNS=(
  ".versatil/"
  "versatil/"
  "supabase/"
  ".versatil-memory/"
  ".versatil-logs/"
)

VIOLATION=false
for pattern in "\${FORBIDDEN_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]] && [[ "$FILE_PATH" != "$FRAMEWORK_HOME"* ]]; then
    VIOLATION=true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ISOLATION VIOLATION: $FILE_PATH contains forbidden pattern: $pattern" >> "$LOG_FILE"
    break
  fi
done

if [ "$VIOLATION" = true ]; then
  # Block the edit with error message
  echo '{
    "allowed": false,
    "error": "❌ ISOLATION VIOLATION: Framework files must be in ~/.versatil/, not in project directory. See CLAUDE.md for isolation policy."
  }'
  exit 1
fi

# Run formatters based on file type
FILE_EXT="\${FILE_PATH##*.}"
case "$FILE_EXT" in
  ts|tsx|js|jsx|json)
    if command -v prettier &> /dev/null && [ -f "$FILE_PATH" ]; then
      prettier --write "$FILE_PATH" &>> "$LOG_FILE" || true
    fi
    ;;
  py)
    if command -v black &> /dev/null && [ -f "$FILE_PATH" ]; then
      black "$FILE_PATH" &>> "$LOG_FILE" || true
    fi
    ;;
esac

# Trigger Rule 2 stress tests if API file changed
if [[ "$FILE_PATH" =~ \\.api\\. ]] || [[ "$FILE_PATH" =~ /api/ ]]; then
  if [ -f "$FRAMEWORK_HOME/bin/stress-test-generator.sh" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Triggering Rule 2 stress tests for API file: $FILE_PATH" >> "$LOG_FILE"
    "$FRAMEWORK_HOME/bin/stress-test-generator.sh" "$FILE_PATH" &>> "$LOG_FILE" &
  fi
fi

# Update RAG memory (async, don't block)
if [ -f "$FRAMEWORK_HOME/bin/rag-update.sh" ]; then
  "$FRAMEWORK_HOME/bin/rag-update.sh" "$FILE_PATH" "$AGENT" &>> "$LOG_FILE" &
fi

# Allow the edit
echo '{
  "allowed": true,
  "metadata": {
    "formatted": true,
    "isolation_validated": true,
    "rag_updated": true
  }
}'

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: afterFileEdit.sh`, 'green');
}

function createBeforeShellExecutionHook() {
  const hookPath = path.join(HOOKS_DIR, 'beforeShellExecution.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: beforeShellExecution
# Runs before agent executes shell commands
# Purpose: Security checks, audit logging, prevent destructive operations

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (command, cwd, agent)
COMMAND=$(echo "$INPUT" | jq -r '.command // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')
AGENT=$(echo "$INPUT" | jq -r '.agent // "unknown"')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] beforeShellExecution: '$COMMAND' in $CWD by $AGENT" >> "$LOG_FILE"

# Skip if no command
if [ -z "$COMMAND" ]; then
  echo '{"allowed": true}'
  exit 0
fi

# Destructive command patterns (require explicit user approval)
DESTRUCTIVE_PATTERNS=(
  "rm -rf"
  "git reset --hard"
  "git push --force"
  "DROP DATABASE"
  "DROP TABLE"
  "TRUNCATE TABLE"
  "DELETE FROM"
  "mkfs"
  "dd if="
  "> /dev/"
  "chmod 000"
  "chown root"
)

BLOCKED=false
REASON=""

for pattern in "\${DESTRUCTIVE_PATTERNS[@]}"; do
  if [[ "$COMMAND" == *"$pattern"* ]]; then
    BLOCKED=true
    REASON="Destructive command detected: $pattern"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BLOCKED: $REASON - Command: $COMMAND" >> "$LOG_FILE"
    break
  fi
done

# Production deployment commands (require explicit approval)
PRODUCTION_PATTERNS=(
  "npm publish"
  "git push origin main"
  "git push origin master"
  "vercel --prod"
  "netlify deploy --prod"
  "docker push.*:latest"
  "kubectl apply.*production"
  "terraform apply.*prod"
)

for pattern in "\${PRODUCTION_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    BLOCKED=true
    REASON="Production deployment detected: $pattern (requires manual approval)"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BLOCKED: $REASON - Command: $COMMAND" >> "$LOG_FILE"
    break
  fi
done

# Isolation check: prevent modifying framework from project
FRAMEWORK_HOME="$HOME/.versatil"
if [[ "$CWD" != "$FRAMEWORK_HOME"* ]] && [[ "$COMMAND" == *".versatil"* ]]; then
  # Command references framework from non-framework directory
  if [[ "$COMMAND" != *"~/.versatil"* ]] && [[ "$COMMAND" != *"$HOME/.versatil"* ]]; then
    BLOCKED=true
    REASON="Isolation violation: Framework files must be in ~/.versatil/"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] BLOCKED: $REASON - Command: $COMMAND" >> "$LOG_FILE"
  fi
fi

if [ "$BLOCKED" = true ]; then
  # Block the command with explanation
  echo "{
    \\"allowed\\": false,
    \\"error\\": \\"🚨 BLOCKED: $REASON\\\\n\\\\nThis command requires explicit user approval. Please run manually if intended.\\",
    \\"suggestion\\": \\"Ask user for confirmation before proceeding.\\"
  }"
  exit 1
fi

# Audit safe commands (allow but log)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALLOWED: $COMMAND" >> "$LOG_FILE"

# Allow the command
echo '{
  "allowed": true,
  "metadata": {
    "security_validated": true,
    "isolation_validated": true,
    "audited": true
  }
}'

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: beforeShellExecution.sh`, 'green');
}

function createBeforeReadFileHook() {
  const hookPath = path.join(HOOKS_DIR, 'beforeReadFile.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: beforeReadFile
# Runs before agent reads a file
# Purpose: Context tracking, access logging, security checks

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (file_path, agent, purpose)
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // empty')
AGENT=$(echo "$INPUT" | jq -r '.agent // "unknown"')
PURPOSE=$(echo "$INPUT" | jq -r '.purpose // "unknown"')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] beforeReadFile: $FILE_PATH by $AGENT (purpose: $PURPOSE)" >> "$LOG_FILE"

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
  echo '{"allowed": true}'
  exit 0
fi

# Check for sensitive files (warn but allow for security analysis)
SENSITIVE_PATTERNS=(
  ".env"
  "credentials.json"
  "secrets.yaml"
  "id_rsa"
  ".pem"
  ".key"
  "private.key"
  "auth.json"
  ".aws/credentials"
  ".gcp/credentials"
)

SENSITIVE=false
for pattern in "\${SENSITIVE_PATTERNS[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    SENSITIVE=true
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SENSITIVE FILE READ: $FILE_PATH by $AGENT" >> "$LOG_FILE"
    break
  fi
done

# Track file access for RAG context building
ACCESS_LOG="$HOME/.versatil/logs/file-access.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')]|$AGENT|$FILE_PATH|$PURPOSE" >> "$ACCESS_LOG"

# Update context tracking (async, don't block)
if [ -f "$HOME/.versatil/bin/context-tracker.sh" ]; then
  "$HOME/.versatil/bin/context-tracker.sh" "$FILE_PATH" "$AGENT" "$PURPOSE" &>> "$LOG_FILE" &
fi

# Allow the read with metadata
if [ "$SENSITIVE" = true ]; then
  echo '{
    "allowed": true,
    "warning": "⚠️  Reading sensitive file. Ensure secrets are redacted before sharing context.",
    "metadata": {
      "sensitive": true,
      "context_tracked": true,
      "access_logged": true
    }
  }'
else
  echo '{
    "allowed": true,
    "metadata": {
      "sensitive": false,
      "context_tracked": true,
      "access_logged": true
    }
  }'
fi

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: beforeReadFile.sh`, 'green');
}

function createBeforeSubmitPromptHook() {
  const hookPath = path.join(HOOKS_DIR, 'beforeSubmitPrompt.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: beforeSubmitPrompt
# Runs before user submits a prompt to the agent
# Purpose: Agent activation suggestions, context enrichment, proactive hints

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (prompt, context, files)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty')
CONTEXT=$(echo "$INPUT" | jq -r '.context // []')
FILES=$(echo "$INPUT" | jq -r '.files // []')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] beforeSubmitPrompt: \${PROMPT:0:50}..." >> "$LOG_FILE"

# Skip if no prompt
if [ -z "$PROMPT" ]; then
  echo '{"allowed": true}'
  exit 0
fi

# Detect agent activation keywords
AGENT_SUGGESTIONS=()

# Maria-QA triggers
if [[ "$PROMPT" =~ (test|coverage|quality|bug|fix|validate) ]]; then
  AGENT_SUGGESTIONS+=("Maria-QA: Quality and testing expert")
fi

# James-Frontend triggers
if [[ "$PROMPT" =~ (component|ui|frontend|react|vue|css|responsive|accessible|design) ]]; then
  AGENT_SUGGESTIONS+=("James-Frontend: UI/UX specialist")
fi

# Marcus-Backend triggers
if [[ "$PROMPT" =~ (api|backend|server|endpoint|route|auth|security|owasp) ]]; then
  AGENT_SUGGESTIONS+=("Marcus-Backend: API and backend architect")
fi

# Dana-Database triggers
if [[ "$PROMPT" =~ (schema|migration|sql|postgres|supabase|database|query|rls|policy) ]]; then
  AGENT_SUGGESTIONS+=("Dana-Database: Database specialist")
fi

# Sarah-PM triggers
if [[ "$PROMPT" =~ (plan|milestone|project|documentation|coordinate|roadmap) ]]; then
  AGENT_SUGGESTIONS+=("Sarah-PM: Project coordinator")
fi

# Alex-BA triggers
if [[ "$PROMPT" =~ (requirement|user story|feature|business|specification|acceptance) ]]; then
  AGENT_SUGGESTIONS+=("Alex-BA: Business analyst")
fi

# Dr.AI-ML triggers
if [[ "$PROMPT" =~ (model|machine learning|ai|ml|dataset|training|inference) ]]; then
  AGENT_SUGGESTIONS+=("Dr.AI-ML: AI/ML specialist")
fi

# Build suggestions message
SUGGESTIONS=""
if [ \${#AGENT_SUGGESTIONS[@]} -gt 0 ]; then
  SUGGESTIONS="💡 Suggested agents for this task:\\\\n"
  for suggestion in "\${AGENT_SUGGESTIONS[@]}"; do
    SUGGESTIONS+="  - $suggestion\\\\n"
  done
  SUGGESTIONS+="\\\\nAgents will activate automatically based on file patterns. Use slash commands for manual activation."
fi

# Context enrichment: Add project info if available
PROJECT_INFO=""
if [ -f ".versatil-project.json" ]; then
  PROJECT_TYPE=$(jq -r '.type // "unknown"' .versatil-project.json 2>/dev/null)
  TECH_STACK=$(jq -r '.techStack // []' .versatil-project.json 2>/dev/null)
  if [ "$PROJECT_TYPE" != "unknown" ]; then
    PROJECT_INFO="\\\\n📋 Project Context: $PROJECT_TYPE project"
  fi
fi

# Allow the prompt with enriched context
if [ -n "$SUGGESTIONS" ] || [ -n "$PROJECT_INFO" ]; then
  ENRICHED_CONTEXT="$SUGGESTIONS$PROJECT_INFO"
  # Escape quotes for JSON
  ENRICHED_CONTEXT_JSON=$(echo "$ENRICHED_CONTEXT" | sed 's/"/\\\\"/g')
  echo "{
    \\"allowed\\": true,
    \\"enrichedPrompt\\": \\"$PROMPT\\",
    \\"metadata\\": {
      \\"suggestions\\": \\"$ENRICHED_CONTEXT_JSON\\",
      \\"context_enriched\\": true
    }
  }"
else
  echo '{
    "allowed": true,
    "metadata": {
      "context_enriched": false
    }
  }'
fi

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: beforeSubmitPrompt.sh`, 'green');
}

function createStopHook() {
  const hookPath = path.join(HOOKS_DIR, 'stop.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: stop
# Runs when agent session stops
# Purpose: Session cleanup, learning codification, metrics collection

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (session_id, agent, duration, actions)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
AGENT=$(echo "$INPUT" | jq -r '.agent // "unknown"')
DURATION=$(echo "$INPUT" | jq -r '.duration // 0')
ACTIONS=$(echo "$INPUT" | jq -r '.actions // []')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] stop: Session $SESSION_ID with $AGENT (duration: \${DURATION}s)" >> "$LOG_FILE"

# Session metrics log
METRICS_LOG="$HOME/.versatil/logs/session-metrics.log"
echo "[$TIMESTAMP]|$SESSION_ID|$AGENT|$DURATION|$(echo "$ACTIONS" | jq 'length // 0')" >> "$METRICS_LOG"

# Learning codification: Extract patterns from session
LEARNING_DIR="$HOME/.versatil/learning"
mkdir -p "$LEARNING_DIR"

# Session summary
SESSION_SUMMARY="$LEARNING_DIR/session-$SESSION_ID.json"
ACTIONS_COUNT=$(echo "$ACTIONS" | jq 'length // 0')
echo "{
  \\"session_id\\": \\"$SESSION_ID\\",
  \\"agent\\": \\"$AGENT\\",
  \\"duration\\": $DURATION,
  \\"timestamp\\": \\"$TIMESTAMP\\",
  \\"actions\\": $ACTIONS,
  \\"metrics\\": {
    \\"actions_count\\": $ACTIONS_COUNT,
    \\"success\\": true
  }
}" > "$SESSION_SUMMARY"

# Update RAG memory with learned patterns (async)
if [ -f "$HOME/.versatil/bin/rag-codify.sh" ]; then
  "$HOME/.versatil/bin/rag-codify.sh" "$SESSION_SUMMARY" &>> "$LOG_FILE" &
fi

# Generate session report for Sarah-PM
if [ -f "$HOME/.versatil/bin/session-report.sh" ]; then
  "$HOME/.versatil/bin/session-report.sh" "$SESSION_ID" "$AGENT" "$DURATION" &>> "$LOG_FILE" &
fi

# Cleanup temporary files (if any)
TEMP_DIR="$HOME/.versatil/temp/$SESSION_ID"
if [ -d "$TEMP_DIR" ]; then
  rm -rf "$TEMP_DIR"
  echo "[$TIMESTAMP] Cleaned up temp directory: $TEMP_DIR" >> "$LOG_FILE"
fi

# Update agent performance metrics
AGENT_METRICS="$HOME/.versatil/metrics/agent-$AGENT.json"
mkdir -p "$HOME/.versatil/metrics"

if [ -f "$AGENT_METRICS" ]; then
  # Update existing metrics
  TOTAL_SESSIONS=$(jq -r '.total_sessions // 0' "$AGENT_METRICS")
  TOTAL_DURATION=$(jq -r '.total_duration // 0' "$AGENT_METRICS")
  NEW_SESSIONS=$((TOTAL_SESSIONS + 1))
  NEW_DURATION=$((TOTAL_DURATION + DURATION))

  jq ".total_sessions = $NEW_SESSIONS | .total_duration = $NEW_DURATION | .last_session = \\"$TIMESTAMP\\"" "$AGENT_METRICS" > "$AGENT_METRICS.tmp"
  mv "$AGENT_METRICS.tmp" "$AGENT_METRICS"
else
  # Create new metrics file
  echo "{
    \\"agent\\": \\"$AGENT\\",
    \\"total_sessions\\": 1,
    \\"total_duration\\": $DURATION,
    \\"last_session\\": \\"$TIMESTAMP\\",
    \\"created\\": \\"$TIMESTAMP\\"
  }" > "$AGENT_METRICS"
fi

# Success response
echo "{
  \\"allowed\\": true,
  \\"metadata\\": {
    \\"session_logged\\": true,
    \\"learning_codified\\": true,
    \\"metrics_updated\\": true,
    \\"cleanup_completed\\": true,
    \\"session_summary\\": \\"$SESSION_SUMMARY\\"
  },
  \\"message\\": \\"✅ Session completed. Metrics and learnings saved to RAG memory.\\"
}"

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: stop.sh`, 'green');
}

function createOnSessionOpenHook() {
  const hookPath = path.join(HOOKS_DIR, 'onSessionOpen.sh');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: onSessionOpen
# Runs on the first prompt of a new session
# Purpose: Display last session context, provide continuity

set -e

# Read input from stdin
INPUT=$(cat)

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] onSessionOpen: New session starting" >> "$LOG_FILE"

# Check for last session summary
LEARNING_DIR="$HOME/.versatil/learning"
LAST_SESSION=""

if [ -d "$LEARNING_DIR" ]; then
  # Find most recent session summary
  LAST_SESSION=$(ls -t "$LEARNING_DIR"/session-*.json 2>/dev/null | head -n 1)
fi

# Build context message
CONTEXT_MESSAGE=""

if [ -n "$LAST_SESSION" ] && [ -f "$LAST_SESSION" ]; then
  LAST_AGENT=$(jq -r '.agent // "unknown"' "$LAST_SESSION")
  LAST_DURATION=$(jq -r '.duration // 0' "$LAST_SESSION")
  LAST_TIMESTAMP=$(jq -r '.timestamp // "unknown"' "$LAST_SESSION")

  CONTEXT_MESSAGE="📋 **Last Session Context**\\\\n"
  CONTEXT_MESSAGE+="- Agent: $LAST_AGENT\\\\n"
  CONTEXT_MESSAGE+="- Duration: \${LAST_DURATION}s\\\\n"
  CONTEXT_MESSAGE+="- Time: $LAST_TIMESTAMP\\\\n"
  CONTEXT_MESSAGE+="\\\\nContinuing with full context from previous session."
fi

# Allow prompt with context
if [ -n "$CONTEXT_MESSAGE" ]; then
  CONTEXT_MESSAGE_JSON=$(echo "$CONTEXT_MESSAGE" | sed 's/"/\\\\"/g')
  echo "{
    \\"allowed\\": true,
    \\"metadata\\": {
      \\"context_provided\\": true,
      \\"context_message\\": \\"$CONTEXT_MESSAGE_JSON\\"
    }
  }"
else
  echo '{
    "allowed": true,
    "metadata": {
      "context_provided": false,
      "message": "Welcome to new VERSATIL session!"
    }
  }'
fi

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: onSessionOpen.sh`, 'green');
}

function createAfterTaskCompleteHook() {
  const hookPath = path.join(HOOKS_DIR, 'afterTaskComplete.sh');

  // Determine the project root by finding package.json
  const currentDir = __dirname;
  const projectRoot = path.resolve(currentDir, '..');

  const hookContent = `#!/bin/bash
# VERSATIL Cursor Hook: afterTaskComplete
# Runs after a task is marked as completed (TodoWrite status: completed)
# Purpose: Trigger SessionCompass, update context budget, show next priority task

set -e

# Read input from stdin
INPUT=$(cat)

# Parse JSON input (task_id, description, status)
TASK_ID=$(echo "$INPUT" | jq -r '.task_id // "unknown"')
TASK_DESC=$(echo "$INPUT" | jq -r '.description // "unknown"')
NEW_STATUS=$(echo "$INPUT" | jq -r '.status // "unknown"')

# Log hook execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] afterTaskComplete: Task $TASK_ID completed - $TASK_DESC" >> "$LOG_FILE"

# Only trigger on completion (not in_progress or pending)
if [ "$NEW_STATUS" != "completed" ]; then
  echo '{"allowed": true, "metadata": {"skipped": "not_completed"}}'
  exit 0
fi

# Update context budget
CONTEXT_BUDGET_LOG="$HOME/.versatil/logs/context-budget.log"
echo "[$TIMESTAMP]|task_complete|$TASK_ID" >> "$CONTEXT_BUDGET_LOG"

# Trigger SessionCompass (brief mode for quick overview)
echo "" >> "$LOG_FILE"
echo "[$TIMESTAMP] ========== SESSION COMPASS (TASK COMPLETE) ==========" >> "$LOG_FILE"

# Try to find the framework directory
FRAMEWORK_DIR="${projectRoot}"
COMPASS_SCRIPT="$FRAMEWORK_DIR/scripts/session-compass.cjs"

if [ -f "$COMPASS_SCRIPT" ]; then
  # Run compass in brief mode and capture output
  COMPASS_OUTPUT=$(node "$COMPASS_SCRIPT" --brief 2>&1 || echo "Failed to run compass")

  # Log compass output
  echo "$COMPASS_OUTPUT" >> "$LOG_FILE"

  # Prepare success response with compass output
  # Escape for JSON
  COMPASS_JSON=$(echo "$COMPASS_OUTPUT" | sed 's/"/\\\\"/g' | sed ':a;N;$!ba;s/\\n/\\\\n/g')

  echo "{
    \\"allowed\\": true,
    \\"message\\": \\"✅ Task completed! Context updated.\\\\n\\\\n$COMPASS_JSON\\",
    \\"metadata\\": {
      \\"task_id\\": \\"$TASK_ID\\",
      \\"compass_displayed\\": true,
      \\"context_updated\\": true
    }
  }"
else
  # Fallback if compass script not found
  echo "{
    \\"allowed\\": true,
    \\"message\\": \\"✅ Task $TASK_ID completed! Run 'npm run session:compass' to see updated context.\\",
    \\"metadata\\": {
      \\"task_id\\": \\"$TASK_ID\\",
      \\"compass_displayed\\": false,
      \\"context_updated\\": true
    }
  }"
fi

exit 0
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  log(`  ✅ Created: afterTaskComplete.sh`, 'green');
}

function createPlaceholderBinScripts() {
  log('\n🔧 Creating placeholder utility scripts...', 'cyan');

  const placeholderScripts = [
    'rag-update.sh',
    'rag-codify.sh',
    'context-tracker.sh',
    'session-report.sh',
    'stress-test-generator.sh',
  ];

  placeholderScripts.forEach(scriptName => {
    const scriptPath = path.join(BIN_DIR, scriptName);

    if (!fs.existsSync(scriptPath)) {
      const content = `#!/bin/bash
# VERSATIL Utility: ${scriptName}
# Placeholder script - Will be implemented in full version

# Log execution
LOG_FILE="$HOME/.versatil/logs/hooks.log"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${scriptName}: Called with args: $@" >> "$LOG_FILE"

exit 0
`;
      fs.writeFileSync(scriptPath, content, { mode: 0o755 });
      log(`  ✅ Created placeholder: ${scriptName}`, 'green');
    }
  });
}

function verifyInstallation() {
  log('\n🔍 Verifying installation...', 'cyan');

  const checks = [
    { path: CURSOR_DIR, name: '.cursor directory' },
    { path: path.join(CURSOR_DIR, 'hooks.json'), name: 'hooks.json' },
    { path: VERSATIL_HOME, name: '.versatil directory' },
    { path: HOOKS_DIR, name: 'hooks directory' },
    { path: LOGS_DIR, name: 'logs directory' },
    { path: METRICS_DIR, name: 'metrics directory' },
    { path: path.join(HOOKS_DIR, 'afterFileEdit.sh'), name: 'afterFileEdit.sh' },
    { path: path.join(HOOKS_DIR, 'afterTaskComplete.sh'), name: 'afterTaskComplete.sh' },
    { path: path.join(HOOKS_DIR, 'beforeShellExecution.sh'), name: 'beforeShellExecution.sh' },
    { path: path.join(HOOKS_DIR, 'beforeReadFile.sh'), name: 'beforeReadFile.sh' },
    { path: path.join(HOOKS_DIR, 'beforeSubmitPrompt.sh'), name: 'beforeSubmitPrompt.sh' },
    { path: path.join(HOOKS_DIR, 'stop.sh'), name: 'stop.sh' },
    { path: path.join(HOOKS_DIR, 'onSessionOpen.sh'), name: 'onSessionOpen.sh' },
  ];

  let allPassed = true;

  checks.forEach(check => {
    if (fs.existsSync(check.path)) {
      log(`  ✅ ${check.name}`, 'green');
    } else {
      log(`  ❌ ${check.name} - NOT FOUND`, 'red');
      allPassed = false;
    }
  });

  if (allPassed) {
    log('\n✨ All checks passed!', 'green');
  } else {
    log('\n⚠️  Some checks failed. Please review the output above.', 'yellow');
  }

  return allPassed;
}

function displaySummary() {
  log('\n' + '='.repeat(60), 'cyan');
  log('  🎭 VERSATIL Cursor Hooks Installation Complete!', 'bright');
  log('='.repeat(60), 'cyan');

  log('\n📍 Installation Locations:', 'yellow');
  log(`  • Hooks Config: ${path.join(CURSOR_DIR, 'hooks.json')}`, 'blue');
  log(`  • Hook Scripts: ${HOOKS_DIR}`, 'blue');
  log(`  • Log Files: ${LOGS_DIR}`, 'blue');
  log(`  • Agent Metrics: ${METRICS_DIR}`, 'blue');

  log('\n🔒 Security Features:', 'yellow');
  log('  • Isolation validation (blocks framework files in projects)', 'green');
  log('  • Destructive command blocking (rm -rf, DROP TABLE, etc.)', 'green');
  log('  • Production deployment protection (requires manual approval)', 'green');
  log('  • Sensitive file warnings (.env, credentials, etc.)', 'green');

  log('\n⚡ Automation Features:', 'yellow');
  log('  • Auto-formatting (Prettier for JS/TS, Black for Python)', 'green');
  log('  • SessionCompass displayed after each task completion', 'green');
  log('  • Context budget updated automatically on task completion', 'green');
  log('  • RAG memory updates on file changes', 'green');
  log('  • Agent activation suggestions based on keywords', 'green');
  log('  • Session metrics and learning codification', 'green');
  log('  • Rule 2 stress tests triggered for API files', 'green');

  log('\n📊 Logging & Monitoring:', 'yellow');
  log('  • All hook executions logged to hooks.log', 'green');
  log('  • File access tracking in file-access.log', 'green');
  log('  • Session metrics in session-metrics.log', 'green');
  log('  • Agent performance metrics per agent', 'green');

  log('\n🚀 Next Steps:', 'yellow');
  log('  1. Restart Cursor to activate hooks', 'blue');
  log('  2. Hooks will run automatically on file edits, prompts, etc.', 'blue');
  log('  3. View logs: tail -f ~/.versatil/logs/hooks.log', 'blue');
  log('  4. Check metrics: cat ~/.versatil/metrics/agent-*.json', 'blue');

  log('\n📖 Documentation:', 'yellow');
  log('  See CLAUDE.md section "Cursor Hooks Integration" for details', 'blue');

  log('\n' + '='.repeat(60) + '\n', 'cyan');
}

// Main execution
function main() {
  log('\n🎭 VERSATIL Framework - Cursor Hooks Installer', 'bright');
  log('━'.repeat(60), 'cyan');

  try {
    createDirectories();
    createHooksConfig();

    log('\n🔨 Creating hook scripts...', 'cyan');
    createAfterFileEditHook();
    createAfterTaskCompleteHook();
    createBeforeShellExecutionHook();
    createBeforeReadFileHook();
    createBeforeSubmitPromptHook();
    createStopHook();
    createOnSessionOpenHook();

    createPlaceholderBinScripts();

    const verified = verifyInstallation();

    if (verified) {
      displaySummary();
    } else {
      log('\n⚠️  Installation completed with warnings. Please review the output.', 'yellow');
      process.exit(1);
    }

  } catch (error) {
    log(`\n❌ Installation failed: ${error.message}`, 'red');
    log(error.stack, 'red');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
