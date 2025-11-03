#!/usr/bin/env node
/**
 * VERSATIL Framework - Stop Background Monitor
 *
 * Stops the background monitoring service gracefully
 *
 * Usage:
 *   pnpm run dashboard:stop
 *   node scripts/stop-background-monitor.cjs
 */

const fs = require('fs');

const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const PID_FILE = `/tmp/versatil-monitor-${SESSION_ID}.pid`;

console.log('🛑 Stopping VERSATIL background monitor...\n');

if (!fs.existsSync(PID_FILE)) {
  console.log('❌ Background monitor is not running (no PID file found)');
  console.log(`   Expected PID file: ${PID_FILE}\n`);
  process.exit(1);
}

try {
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'));

  console.log(`Found background monitor (PID: ${pid})`);
  console.log('Sending SIGTERM...');

  // Try to kill the process
  try {
    process.kill(pid, 'SIGTERM');
    console.log('✅ Background monitor stopped successfully\n');

    // Wait a bit then remove PID file
    setTimeout(() => {
      try {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
      } catch (error) {
        // Ignore
      }
    }, 1000);

  } catch (killError) {
    if (killError.code === 'ESRCH') {
      console.log('⚠️  Process not found (already stopped)');
      fs.unlinkSync(PID_FILE);
    } else {
      throw killError;
    }
  }

} catch (error) {
  console.error(`❌ Error stopping monitor: ${error.message}\n`);
  process.exit(1);
}