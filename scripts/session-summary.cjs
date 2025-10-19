#!/usr/bin/env node

/**
 * VERSATIL Session Summary Script
 *
 * Generates human-readable reports of framework usage and impact.
 *
 * Usage:
 *   npm run session:summary         # Show current session
 *   npm run session:summary --week  # Show weekly report
 *   npm run session:summary --all   # Show all-time stats
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

const c = colors;

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const showWeekly = args.includes('--week') || args.includes('-w');
  const showAllTime = args.includes('--all') || args.includes('-a');

  console.log(`${c.bold}${c.cyan}
╔═══════════════════════════════════════════════════════════╗
║         VERSATIL Session Summary                          ║
╚═══════════════════════════════════════════════════════════╝${c.reset}
`);

  try {
    if (showWeekly) {
      await showWeeklyReport();
    } else if (showAllTime) {
      await showAllTimeStats();
    } else {
      await showCurrentSession();
    }
  } catch (error) {
    console.error(`${c.red}Error: ${error.message}${c.reset}`);
    console.error(`${c.gray}${error.stack}${c.reset}`);
    process.exit(1);
  }
}

/**
 * Show current session summary
 */
async function showCurrentSession() {
  const today = new Date().toISOString().split('T')[0];
  const sessionPath = path.join(os.homedir(), '.versatil', 'sessions', `session-${today}.json`);

  let session;
  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    session = JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`${c.yellow}⚠️  No session data for today yet.${c.reset}\n`);
      console.log(`${c.gray}Activate an agent to start logging framework usage.${c.reset}\n`);
      return;
    }
    throw error;
  }

  // Format duration
  const duration = formatDuration(session.duration);
  const date = new Date(session.startTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  console.log(`${c.bold}📅 ${date}${c.reset}`);
  console.log(`${c.gray}Session ID: ${session.sessionId}${c.reset}\n`);

  console.log(`${c.bold}⏱️  Session Duration:${c.reset} ${duration}`);
  console.log(`${c.bold}🤖 Agents Activated:${c.reset} ${session.agentActivations} times\n`);

  // Agent breakdown
  if (Object.keys(session.agentBreakdown).length > 0) {
    console.log(`${c.bold}Agent Activity:${c.reset}\n`);

    for (const [agentId, breakdown] of Object.entries(session.agentBreakdown)) {
      const agentName = formatAgentName(agentId);
      const successRate = Math.round(breakdown.successRate * 100);
      const progressBar = createProgressBar(successRate, 10);

      console.log(`  ${c.cyan}🤖 ${agentName.padEnd(15)}${c.reset} ${breakdown.activations} activation${breakdown.activations > 1 ? 's' : ''} │ ${progressBar} ${successRate}%`);

      if (breakdown.timeSaved > 0) {
        console.log(`     ${c.gray}Time saved: ~${breakdown.timeSaved} minutes${c.reset}`);
      }
    }

    console.log('');
  }

  // Productivity metrics
  console.log(`${c.bold}💰 Productivity Impact:${c.reset}\n`);
  console.log(`  ${c.green}Time Saved:${c.reset}         ~${session.totalTimeSaved} minutes`);
  console.log(`  ${c.green}Productivity Gain:${c.reset}  ${session.productivity.productivityGain}%`);
  console.log(`  ${c.green}Framework Score:${c.reset}    ${session.impactScore}/10 ${getScoreEmoji(session.impactScore)}\n`);

  // Top patterns
  if (session.topPatterns && session.topPatterns.length > 0) {
    console.log(`${c.bold}📚 Top Patterns Used:${c.reset}\n`);
    for (const pattern of session.topPatterns) {
      console.log(`  ${c.gray}•${c.reset} ${pattern}`);
    }
    console.log('');
  }

  // Recommendations
  if (session.recommendations && session.recommendations.length > 0) {
    console.log(`${c.bold}💡 Recommendations:${c.reset}\n`);
    for (const rec of session.recommendations) {
      console.log(`  ${c.yellow}•${c.reset} ${rec}`);
    }
    console.log('');
  }

  // Footer
  console.log(`${c.gray}─────────────────────────────────────────────────────────────${c.reset}\n`);
  console.log(`${c.gray}Commands:${c.reset}`);
  console.log(`  ${c.cyan}npm run session:summary${c.reset}        Show current session`);
  console.log(`  ${c.cyan}npm run session:summary --week${c.reset} Show weekly report`);
  console.log(`  ${c.cyan}npm run session:summary --all${c.reset}  Show all-time stats\n`);
}

/**
 * Show weekly report
 */
async function showWeeklyReport() {
  const sessionsDir = path.join(os.homedir(), '.versatil', 'sessions');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  // Load all sessions
  let files;
  try {
    files = await fs.readdir(sessionsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`${c.yellow}⚠️  No session data available yet.${c.reset}\n`);
      return;
    }
    throw error;
  }

  const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));
  const sessions = [];

  for (const file of sessionFiles) {
    const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
    const session = JSON.parse(content);
    if (session.date >= sevenDaysAgoStr) {
      sessions.push(session);
    }
  }

  if (sessions.length === 0) {
    console.log(`${c.yellow}⚠️  No sessions in the last 7 days.${c.reset}\n`);
    return;
  }

  // Calculate weekly stats
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalTimeSaved = sessions.reduce((sum, s) => sum + s.totalTimeSaved, 0);
  const totalActivations = sessions.reduce((sum, s) => sum + s.agentActivations, 0);
  const avgImpactScore = sessions.reduce((sum, s) => sum + s.impactScore, 0) / sessions.length;

  console.log(`${c.bold}📊 Weekly Report (Last 7 Days)${c.reset}\n`);
  console.log(`${c.gray}${sevenDaysAgoStr} to ${new Date().toISOString().split('T')[0]}${c.reset}\n`);

  console.log(`${c.bold}Summary:${c.reset}\n`);
  console.log(`  ${c.cyan}Sessions:${c.reset}          ${sessions.length}`);
  console.log(`  ${c.cyan}Total Duration:${c.reset}    ${formatDuration(totalDuration)}`);
  console.log(`  ${c.cyan}Time Saved:${c.reset}        ~${totalTimeSaved} minutes (${(totalTimeSaved / 60).toFixed(1)} hours)`);
  console.log(`  ${c.cyan}Agent Activations:${c.reset} ${totalActivations}`);
  console.log(`  ${c.cyan}Avg Impact Score:${c.reset} ${avgImpactScore.toFixed(1)}/10 ${getScoreEmoji(avgImpactScore)}\n`);

  // Top agents (aggregated)
  const agentStats = {};
  for (const session of sessions) {
    for (const [agentId, breakdown] of Object.entries(session.agentBreakdown)) {
      if (!agentStats[agentId]) {
        agentStats[agentId] = { activations: 0, timeSaved: 0 };
      }
      agentStats[agentId].activations += breakdown.activations;
      agentStats[agentId].timeSaved += breakdown.timeSaved;
    }
  }

  const topAgents = Object.entries(agentStats)
    .sort((a, b) => b[1].timeSaved - a[1].timeSaved)
    .slice(0, 5);

  if (topAgents.length > 0) {
    console.log(`${c.bold}Top Agents:${c.reset}\n`);
    for (const [agentId, stats] of topAgents) {
      const agentName = formatAgentName(agentId);
      console.log(`  ${c.cyan}🤖 ${agentName.padEnd(15)}${c.reset} ${stats.activations} uses │ ~${stats.timeSaved} min saved`);
    }
    console.log('');
  }

  console.log(`${c.gray}─────────────────────────────────────────────────────────────${c.reset}\n`);
}

/**
 * Show all-time stats
 */
async function showAllTimeStats() {
  const sessionsDir = path.join(os.homedir(), '.versatil', 'sessions');

  let files;
  try {
    files = await fs.readdir(sessionsDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`${c.yellow}⚠️  No session data available yet.${c.reset}\n`);
      return;
    }
    throw error;
  }

  const sessionFiles = files.filter(f => f.startsWith('session-') && f.endsWith('.json'));
  const sessions = [];

  for (const file of sessionFiles) {
    const content = await fs.readFile(path.join(sessionsDir, file), 'utf-8');
    sessions.push(JSON.parse(content));
  }

  if (sessions.length === 0) {
    console.log(`${c.yellow}⚠️  No sessions recorded yet.${c.reset}\n`);
    return;
  }

  // Calculate all-time stats
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalTimeSaved = sessions.reduce((sum, s) => sum + s.totalTimeSaved, 0);
  const totalActivations = sessions.reduce((sum, s) => sum + s.agentActivations, 0);
  const avgImpactScore = sessions.reduce((sum, s) => sum + s.impactScore, 0) / sessions.length;

  // First and last session dates
  const sortedSessions = sessions.sort((a, b) => a.date.localeCompare(b.date));
  const firstSession = sortedSessions[0].date;
  const lastSession = sortedSessions[sortedSessions.length - 1].date;

  console.log(`${c.bold}📈 All-Time Statistics${c.reset}\n`);
  console.log(`${c.gray}${firstSession} to ${lastSession}${c.reset}\n`);

  console.log(`${c.bold}Overview:${c.reset}\n`);
  console.log(`  ${c.cyan}Total Sessions:${c.reset}    ${sessions.length}`);
  console.log(`  ${c.cyan}Total Duration:${c.reset}    ${formatDuration(totalDuration)}`);
  console.log(`  ${c.cyan}Time Saved:${c.reset}        ~${totalTimeSaved} minutes (${(totalTimeSaved / 60).toFixed(1)} hours)`);
  console.log(`  ${c.cyan}Agent Activations:${c.reset} ${totalActivations}`);
  console.log(`  ${c.cyan}Avg Impact Score:${c.reset} ${avgImpactScore.toFixed(1)}/10 ${getScoreEmoji(avgImpactScore)}\n`);

  // Calculate ROI
  const frameworkOverhead = (totalDuration / 60000) * 0.05; // 5% overhead in minutes
  const roi = frameworkOverhead > 0 ? (totalTimeSaved / frameworkOverhead).toFixed(1) : '∞';

  console.log(`${c.bold}💰 Framework ROI:${c.reset}\n`);
  console.log(`  ${c.green}Return on Investment:${c.reset} ${roi}x`);
  console.log(`  ${c.gray}(Time saved / Framework overhead)${c.reset}\n`);

  console.log(`${c.gray}─────────────────────────────────────────────────────────────${c.reset}\n`);
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format agent name from ID
 */
function formatAgentName(agentId) {
  const names = {
    'maria-qa': 'Maria-QA',
    'james-frontend': 'James-Frontend',
    'marcus-backend': 'Marcus-Backend',
    'sarah-pm': 'Sarah-PM',
    'alex-ba': 'Alex-BA',
    'dana-database': 'Dana-Database',
    'dr-ai-ml': 'Dr.AI-ML',
  };
  return names[agentId] || agentId;
}

/**
 * Create progress bar
 */
function createProgressBar(percent, width = 10) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return `${c.green}${'█'.repeat(filled)}${c.gray}${'░'.repeat(empty)}${c.reset}`;
}

/**
 * Get emoji for impact score
 */
function getScoreEmoji(score) {
  if (score >= 9) return '🔥';
  if (score >= 8) return '🚀';
  if (score >= 7) return '✨';
  if (score >= 6) return '👍';
  if (score >= 5) return '👌';
  return '📊';
}

// Run main
main().catch((error) => {
  console.error(`${c.red}Fatal error:${c.reset}`, error);
  process.exit(1);
});
