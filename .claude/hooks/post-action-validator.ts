#!/usr/bin/env -S npx tsx
/**
 * Post-Action Validator Hook (Phase 6B - Wave 3)
 *
 * Validates that automation directives (autoApply, autoActivate) were followed
 * Logs violations to .versatil/automation-audit.log
 *
 * SDK Hook: SubagentStop (runs after Task tool completes)
 *
 * Purpose: Enforcement layer to detect when Claude ignores automation rules
 */

import * as fs from 'fs';
import * as path from 'path';

interface HookInput {
  toolName: string;
  result?: {
    content?: string;
    output?: string;
  };
  workingDirectory: string;
  sessionId: string;
  timestamp?: number;
}

interface AutomationViolation {
  timestamp: string;
  sessionId: string;
  violationType: string;
  directive: string;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Check if Task tool invocation was appropriate
 * For now, this is a placeholder - full validation requires tracking context
 */
function validateTaskExecution(input: HookInput): AutomationViolation | null {
  // Placeholder: In production, this would:
  // 1. Check if context had autoActivate: true
  // 2. Verify Task tool was invoked
  // 3. Log violation if directive was ignored

  // For now, just log that validator ran
  return null;
}

/**
 * Write violation to audit log
 */
function logViolation(violation: AutomationViolation, workingDir: string): void {
  const auditDir = path.join(workingDir, '.versatil');
  const auditFile = path.join(auditDir, 'automation-audit.log');

  // Ensure directory exists
  if (!fs.existsSync(auditDir)) {
    fs.mkdirSync(auditDir, { recursive: true });
  }

  const logEntry = `[${violation.timestamp}] ${violation.severity.toUpperCase()} - ${violation.violationType}
  Session: ${violation.sessionId}
  Directive: ${violation.directive}
  Expected: ${violation.expected}
  Actual: ${violation.actual}
---\n`;

  fs.appendFileSync(auditFile, logEntry, 'utf-8');
}

async function main() {
  try {
    const input: HookInput = JSON.parse(fs.readFileSync(process.stdin.fd, 'utf-8'));

    const workingDir = input.workingDirectory || process.cwd();

    // Validate if automation directives were followed
    const violation = validateTaskExecution(input);

    if (violation) {
      logViolation(violation, workingDir);

      // Output warning to user (stderr for visibility, doesn't affect Claude's context)
      console.error(`⚠️  Automation violation detected: ${violation.violationType}`);
      console.error(`   Expected: ${violation.expected}`);
      console.error(`   Actual: ${violation.actual}`);
      console.error(`   Logged to: .versatil/automation-audit.log`);
    }

    // No stdout output needed - this hook is for logging only

  } catch (error) {
    // Fail gracefully - don't block execution
    console.error(`Post-action validator error: ${error}`);
  }

  process.exit(0);
}

main();
