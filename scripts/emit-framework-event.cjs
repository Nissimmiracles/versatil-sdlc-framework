#!/usr/bin/env node
/**
 * Framework Event Emitter
 * Triggers statusline updates and other observability hooks
 *
 * Usage:
 *   node scripts/emit-framework-event.cjs agent_activated maria-qa
 *   node scripts/emit-framework-event.cjs test_running "Running tests" 45
 *   node scripts/emit-framework-event.cjs operation_complete "Build successful"
 *
 * Events:
 *   - agent_activated <agent_name>
 *   - agent_completed <agent_name>
 *   - agent_failed <agent_name>
 *   - test_running <operation> <progress>
 *   - build_running <operation> <progress>
 *   - operation_complete <operation>
 *   - health_check
 *   - error <message>
 *   - clear
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const eventType = args[0];
const eventData = args.slice(1);

if (!eventType) {
  console.error('Usage: emit-framework-event.cjs <event_type> [args...]');
  process.exit(1);
}

// Find project root
const PROJECT_ROOT = process.cwd();
const HOOKS_DIR = path.join(PROJECT_ROOT, '.claude/hooks');

// Check if statusline hook exists
const statuslineHook = path.join(HOOKS_DIR, 'statusline-update.sh');

if (!fs.existsSync(statuslineHook)) {
  // Silently exit if hook doesn't exist (not an error)
  process.exit(0);
}

// Build environment variables for hook
const env = {
  ...process.env,
  VERSATIL_EVENT_TYPE: eventType
};

// Parse event-specific data
switch (eventType) {
  case 'agent_activated':
  case 'agent_completed':
  case 'agent_failed':
    env.VERSATIL_AGENT_NAME = eventData[0] || 'unknown';
    break;

  case 'test_running':
  case 'build_running':
    env.VERSATIL_OPERATION = eventData[0] || eventType;
    env.VERSATIL_PROGRESS = eventData[1] || '0';
    break;

  case 'operation_complete':
  case 'error':
    env.VERSATIL_OPERATION = eventData[0] || eventType;
    break;

  case 'health_check':
  case 'clear':
    // No additional data needed
    break;

  default:
    env.VERSATIL_OPERATION = eventData.join(' ');
}

// Execute statusline hook
try {
  const output = execSync(statuslineHook, {
    cwd: PROJECT_ROOT,
    env,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Output to stdout for Claude Code to capture
  if (output.trim()) {
    console.log(output.trim());
  }
} catch (error) {
  // Hook execution failed - log but don't fail
  if (process.env.DEBUG) {
    console.error(`Statusline hook failed: ${error.message}`);
  }
}

process.exit(0);