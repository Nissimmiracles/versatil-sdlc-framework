#!/usr/bin/env -S npx tsx
/**
 * VERSATIL Framework - Session Start Hook
 *
 * Auto-starts Guardian background monitoring when Claude Code session begins.
 * Ensures Guardian is always running to provide:
 * - Automatic health checks (every 5 minutes)
 * - Proactive answer generation (v7.13.0+)
 * - TODO generation for detected issues (v7.10.0+)
 * - Enhancement detection (v7.12.0+)
 *
 * @version 7.13.0
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface SessionStartInput {
  session_id: string;
  hook_event_name: 'SessionStart';
  source: 'startup' | 'resume' | 'clear' | 'compact';
}

async function main() {
  try {
    // Read stdin for hook input
    const input = await readStdin();
    const hookData: SessionStartInput = JSON.parse(input);

    // Only start Guardian on actual session startup (not resume/clear/compact)
    if (hookData.source !== 'startup') {
      process.exit(0);
    }

    const cwd = process.cwd();
    const logDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logFile = path.join(logDir, 'session-start.log');
    const timestamp = new Date().toISOString();

    // Check if we're in a VERSATIL project
    const isVersatilProject =
      fs.existsSync(path.join(cwd, 'package.json')) &&
      fs.existsSync(path.join(cwd, 'src', 'agents', 'guardian'));

    if (!isVersatilProject) {
      // Not a VERSATIL project, skip Guardian start
      fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Not a VERSATIL project, skipping Guardian\n`);
      process.exit(0);
    }

    // Check if Guardian is already running
    try {
      const guardianStatus = execSync('launchctl list | grep versatil.guardian', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      if (guardianStatus && guardianStatus.includes('com.versatil.guardian')) {
        // Guardian already running, trigger a health check instead
        fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Guardian already running, triggering health check\n`);

        try {
          execSync('npm run guardian:health-check', {
            cwd,
            stdio: 'ignore',
            timeout: 30000
          });
          fs.appendFileSync(logFile, `[${timestamp}] Health check completed\n`);
        } catch (healthCheckError) {
          fs.appendFileSync(logFile, `[${timestamp}] Health check failed: ${(healthCheckError as Error).message}\n`);
        }

        process.exit(0);
      }
    } catch {
      // Guardian not running, proceed to start it
    }

    // Start Guardian background monitoring
    fs.appendFileSync(logFile, `[${timestamp}] Session ${hookData.session_id}: Starting Guardian background monitoring...\n`);

    try {
      execSync('npm run guardian:start', {
        cwd,
        stdio: 'pipe',
        timeout: 30000
      });

      fs.appendFileSync(logFile, `[${timestamp}] ✅ Guardian started successfully\n`);
      fs.appendFileSync(logFile, `[${timestamp}] - Health checks: Every 5 minutes\n`);
      fs.appendFileSync(logFile, `[${timestamp}] - Proactive answers: Enabled (v7.13.0+)\n`);
      fs.appendFileSync(logFile, `[${timestamp}] - TODO generation: Enabled (v7.10.0+)\n`);
      fs.appendFileSync(logFile, `[${timestamp}] - Enhancement detection: Enabled (v7.12.0+)\n`);

      // Output a brief notification to Claude (will be injected into context)
      console.log('🛡️  Guardian background monitoring started (5-minute health checks)');

    } catch (error) {
      const errorMsg = (error as Error).message;
      fs.appendFileSync(logFile, `[${timestamp}] ❌ Failed to start Guardian: ${errorMsg}\n`);

      // Non-blocking error - session can continue without Guardian
      console.log('⚠️  Guardian failed to start (session can continue normally)');
    }

  } catch (error) {
    // Catch-all to prevent hook from blocking session start
    const logDir = path.join(os.homedir(), '.versatil', 'logs', 'guardian');
    const logFile = path.join(logDir, 'session-start.log');
    const timestamp = new Date().toISOString();

    if (fs.existsSync(logDir)) {
      fs.appendFileSync(logFile, `[${timestamp}] ❌ Hook error: ${(error as Error).message}\n`);
    }
  }

  process.exit(0);
}

async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

main();
