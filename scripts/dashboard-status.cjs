#!/usr/bin/env node
/**
 * VERSATIL Framework - Quick Status Check
 *
 * Non-blocking status display that shows framework health,
 * active agents, and recent activity, then exits immediately.
 *
 * Usage:
 *   pnpm run status
 *   node scripts/dashboard-status.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = process.cwd();
const SESSION_ID = process.env.CLAUDE_SESSION_ID || 'default';
const STATUS_FILE = `/tmp/versatil-sync-status-${SESSION_ID}.json`;
const VERSATIL_LOGS_DIR = path.join(PROJECT_ROOT, '.versatil', 'logs');
const ACTIVITY_LOG = path.join(VERSATIL_LOGS_DIR, 'activity.log');

// ============================================================================
// STATUS READING
// ============================================================================

function readFrameworkStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Ignore
  }
  return {
    synchronized: false,
    score: 0,
    orchestrators_active: 0,
    orchestrators_total: 8,
    event_count: 0,
    issues_critical: 0,
    issues_total: 0,
    last_update: Date.now()
  };
}

function readAgentStatus() {
  // Simulated agent status (in production, would read from agent status files)
  const agents = [
    { name: 'Maria-QA', status: 'idle', progress: 0, activity: 'Waiting for test files' },
    { name: 'James-Frontend', status: 'idle', progress: 0, activity: 'Monitoring UI files' },
    { name: 'Marcus-Backend', status: 'idle', progress: 0, activity: 'Monitoring API files' },
    { name: 'Dana-Database', status: 'idle', progress: 0, activity: 'Monitoring database files' },
    { name: 'Sarah-PM', status: 'idle', progress: 0, activity: 'Monitoring project docs' },
    { name: 'Alex-BA', status: 'idle', progress: 0, activity: 'Monitoring requirements' },
    { name: 'Dr.AI-ML', status: 'idle', progress: 0, activity: 'Monitoring ML models' }
  ];

  // Check if any agent status files exist
  const agentStatusDir = path.join(PROJECT_ROOT, '.versatil', 'agent-status');
  if (fs.existsSync(agentStatusDir)) {
    const statusFiles = fs.readdirSync(agentStatusDir).filter(f => f.endsWith('.json'));
    statusFiles.forEach(file => {
      try {
        const agentData = JSON.parse(fs.readFileSync(path.join(agentStatusDir, file), 'utf8'));
        const agentName = file.replace('.json', '');
        const agent = agents.find(a => a.name.toLowerCase().includes(agentName.toLowerCase()));
        if (agent && agentData.status) {
          agent.status = agentData.status;
          agent.progress = agentData.progress || 0;
          agent.activity = agentData.activity || agent.activity;
        }
      } catch (error) {
        // Ignore parse errors
      }
    });
  }

  return agents;
}

function readRecentActivity() {
  const activities = [];

  // Try to read activity log
  if (fs.existsSync(ACTIVITY_LOG)) {
    try {
      const logContent = fs.readFileSync(ACTIVITY_LOG, 'utf8');
      const lines = logContent.split('\n').filter(l => l.trim());
      // Get last 5 lines
      const recentLines = lines.slice(-5);
      recentLines.forEach(line => {
        // Parse log format: [timestamp] | message
        const match = line.match(/\[([\d:]+)\]\s*\|\s*(.+)/);
        if (match) {
          activities.push({
            timestamp: match[1],
            message: match[2]
          });
        }
      });
    } catch (error) {
      // Ignore read errors
    }
  }

  // If no activity log, show default messages
  if (activities.length === 0) {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    activities.push({
      timestamp,
      message: 'Framework initialized and ready'
    });
  }

  return activities;
}

// ============================================================================
// FORMATTING
// ============================================================================

function getHealthIcon(score) {
  if (score >= 95) return '🟢';
  if (score >= 85) return '🟡';
  if (score >= 70) return '🟠';
  return '🔴';
}

function getStatusIcon(status) {
  switch (status) {
    case 'active':
    case 'processing':
      return '🤖';
    case 'completed':
      return '✅';
    case 'error':
      return '❌';
    case 'warning':
      return '⚠️';
    default:
      return '⚪';
  }
}

function getProgressBar(progress) {
  const filled = Math.floor(progress / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function formatUptime(lastUpdate) {
  const now = Date.now();
  const diff = now - lastUpdate;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s ago`;
  } else {
    return `${seconds}s ago`;
  }
}

// ============================================================================
// DISPLAY
// ============================================================================

function displayStatus() {
  const status = readFrameworkStatus();
  const agents = readAgentStatus();
  const activities = readRecentActivity();

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════╗');
  console.log('║            VERSATIL Framework - Quick Status Check                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Framework Health
  const healthIcon = getHealthIcon(status.score);
  const healthColor = status.score >= 95 ? '\x1b[32m' : status.score >= 85 ? '\x1b[33m' : '\x1b[31m';
  const resetColor = '\x1b[0m';
  console.log(`${healthIcon} Framework Health: ${healthColor}${status.score}%${resetColor}`);
  console.log(`   Orchestrators: ${status.orchestrators_active}/${status.orchestrators_total} active`);
  console.log(`   Last Update: ${formatUptime(status.last_update)}`);

  if (status.issues_critical > 0) {
    console.log(`   ${getStatusIcon('error')} Critical Issues: ${status.issues_critical}`);
  }
  if (status.issues_total > 0) {
    console.log(`   ${getStatusIcon('warning')} Total Issues: ${status.issues_total}`);
  }

  console.log('');

  // Active Agents
  const activeAgents = agents.filter(a => a.status !== 'idle');
  if (activeAgents.length > 0) {
    console.log(`🤖 Active Agents: ${activeAgents.length}/${agents.length}`);
    console.log('');
    activeAgents.forEach(agent => {
      const icon = getStatusIcon(agent.status);
      const bar = getProgressBar(agent.progress);
      const statusColor = agent.status === 'active' ? '\x1b[32m' : '\x1b[33m';
      console.log(`   ${icon} ${agent.name.padEnd(18)} ${bar} ${statusColor}${agent.progress}%${resetColor}`);
      console.log(`      ${agent.activity}`);
    });
  } else {
    console.log(`⚪ Active Agents: 0/${agents.length} (all idle)`);
    console.log('');
    console.log('   Framework is ready. Agents will activate automatically when you:');
    console.log('   • Edit test files (*.test.ts) → Maria-QA');
    console.log('   • Edit UI components (*.tsx, *.jsx) → James-Frontend');
    console.log('   • Edit API files (*api*.ts, routes/*) → Marcus-Backend');
    console.log('   • Edit database files (*.sql, migrations/*) → Dana-Database');
  }

  console.log('');

  // Recent Activity
  if (activities.length > 0) {
    console.log('📊 Recent Activity:');
    console.log('');
    activities.forEach(activity => {
      console.log(`   ${activity.timestamp} │ ${activity.message}`);
    });
  }

  console.log('');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('Commands:');
  console.log('  pnpm run status            Show this quick status check');
  console.log('  pnpm run dashboard         Launch full interactive dashboard');
  console.log('  pnpm run monitor           Run comprehensive health check');
  console.log('  /monitor                  Quick health check (in Claude)');
  console.log('');
  console.log('For full interactive dashboard with real-time updates:');
  console.log('  $ pnpm run dashboard');
  console.log('  (Press \'q\' to exit the interactive dashboard)');
  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================

try {
  displayStatus();
  process.exit(0);
} catch (error) {
  console.error('Error displaying status:', error.message);
  process.exit(1);
}
