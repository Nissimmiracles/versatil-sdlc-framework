#!/usr/bin/env -S npx tsx
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Check if Task tool invocation was appropriate
 * For now, this is a placeholder - full validation requires tracking context
 */
function validateTaskExecution(input) {
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
function logViolation(violation, workingDir) {
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
        const input = JSON.parse(fs.readFileSync(process.stdin.fd, 'utf-8'));
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
    }
    catch (error) {
        // Fail gracefully - don't block execution
        console.error(`Post-action validator error: ${error}`);
    }
    process.exit(0);
}
main();
