#!/usr/bin/env node

/**
 * Session Compass - CLI Script
 *
 * Displays comprehensive session overview on Cursor/Claude tab open
 *
 * Usage:
 *   pnpm run session:compass          # Show full overview
 *   pnpm run session:compass --brief  # Show brief summary
 *   pnpm run session:compass --json   # Output JSON
 *   pnpm run session:compass --watch  # Watch mode (refresh every 60s)
 *
 * Part of VERSATIL Pulse System (Phase 2: Session Opening Hook)
 */

const fs = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Check if we can import SessionCompass (TypeScript module)
async function loadSessionCompass() {
  try {
    // Try to dynamically import the compiled JS version
    const distPath = path.join(__dirname, '../dist/tracking/session-compass.js');

    try {
      await fs.access(distPath);
      const module = await import(distPath);
      return module.SessionCompass;
    } catch {
      // If dist doesn't exist, return null to use mock data
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Fallback: Use mock data if SessionCompass isn't available
async function getMockOverview() {
  const projectName = path.basename(process.cwd());

  // Get git branch
  let branch = 'main';
  try {
    const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD');
    branch = stdout.trim();
  } catch {}

  // Get git status
  let gitStatus = { clean: true, ahead: 0, behind: 0, modified: 0, untracked: 0 };
  try {
    const { stdout: statusOut } = await execAsync('git status --porcelain');
    const lines = statusOut.trim().split('\n').filter(Boolean);
    gitStatus.modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
    gitStatus.untracked = lines.filter(l => l.startsWith('??')).length;
    gitStatus.clean = lines.length === 0;
  } catch {}

  return {
    projectContext: {
      projectName,
      branch,
      gitStatus,
      lastSession: null
    },
    mainPlan: {
      activeFeature: 'Session Compass Implementation',
      status: 'in_progress',
      agentsWorking: ['Sarah-PM', 'Marcus-Backend'],
      phases: [
        {
          number: 1,
          name: 'Session Opening Hook',
          status: 'in_progress',
          progress: 60,
          eta: '1 hour'
        },
        {
          number: 2,
          name: 'Three-Tier Status Tracker',
          status: 'pending',
          progress: 0,
          eta: '3 hours'
        }
      ],
      totalETA: '4 hours'
    },
    taskPriority: {
      high: [
        {
          id: 'COMPASS-2',
          description: 'Create /context command for manual session overview',
          assignedAgent: 'Marcus-Backend',
          canParallel: true,
          dependsOn: ['COMPASS-1'],
          contextNeeded: 5000,
          eta: '20 minutes'
        }
      ],
      medium: [
        {
          id: 'COMPASS-5',
          description: 'Create ThreeTierStatusTracker',
          assignedAgent: 'Dana-Database',
          canParallel: true,
          dependsOn: [],
          contextNeeded: 8000,
          eta: '1.5 hours'
        }
      ],
      low: []
    },
    parallelOpportunities: [
      {
        tasks: ['COMPASS-2', 'COMPASS-3', 'COMPASS-4'],
        agents: ['Marcus-Backend', 'Sarah-PM'],
        timeSaved: '40 minutes',
        contextRequired: 15000
      }
    ],
    contextBudget: {
      available: 200000,
      allocated: 45000,
      reserved: 15000,
      remaining: 140000,
      status: 'healthy',
      message: 'Plenty of context available for all tasks'
    },
    threeTierStatus: {
      backend: {
        progress: 60,
        completed: 3,
        total: 5,
        next: 'Create /context command endpoint',
        recommendation: 'Complete SessionCompass CLI script first'
      },
      database: {
        progress: 0,
        status: 'Not started',
        recommendation: 'No database changes needed for Session Compass'
      },
      frontend: {
        progress: 0,
        completed: 0,
        total: 1,
        next: 'Create Cursor status bar integration',
        recommendation: 'Wait for Phase 2 (Cursor Status Bar Extension)'
      }
    },
    quickStats: {
      frameworkHealth: 87,
      activeAgents: 2,
      pendingTodos: 9,
      gitStatus: gitStatus.clean ? 'clean' : 'uncommitted changes',
      buildStatus: 'passing',
      testStatus: 'passing'
    }
  };
}

// Format overview as text (ANSI colored)
function formatAsText(data, brief = false) {
  const { projectContext, mainPlan, taskPriority, parallelOpportunities, contextBudget, threeTierStatus, quickStats } = data;

  let output = '';

  // Header
  output += `\n${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}\n`;
  output += `${colors.bright}${colors.cyan}║         🧭 VERSATIL Session Compass                       ║${colors.reset}\n`;
  output += `${colors.bright}${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n\n`;

  // Project Context
  output += `${colors.bright}${colors.white}📁 Project:${colors.reset} ${projectContext.projectName}\n`;
  output += `${colors.bright}${colors.white}🌿 Branch:${colors.reset} ${projectContext.branch}\n`;

  const gitEmoji = projectContext.gitStatus.clean ? '✅' : '⚠️';
  const gitColor = projectContext.gitStatus.clean ? colors.green : colors.yellow;
  output += `${colors.bright}${colors.white}📊 Git:${colors.reset} ${gitColor}${gitEmoji} ${projectContext.gitStatus.clean ? 'Clean' : `${projectContext.gitStatus.modified} modified, ${projectContext.gitStatus.untracked} untracked`}${colors.reset}\n`;

  if (projectContext.lastSession) {
    output += `${colors.bright}${colors.white}⏰ Last Session:${colors.reset} ${projectContext.lastSession.when} (saved ${projectContext.lastSession.timeSaved} min, score: ${projectContext.lastSession.impactScore}/10)\n`;
  }
  output += '\n';

  if (brief) {
    // Brief mode: Just show quick stats and next task
    output += `${colors.bright}${colors.white}Quick Status:${colors.reset}\n`;
    output += `  Framework Health: ${getHealthEmoji(quickStats.frameworkHealth)} ${quickStats.frameworkHealth}%\n`;
    output += `  Active Agents: ${quickStats.activeAgents}\n`;
    output += `  Pending Tasks: ${quickStats.pendingTodos}\n`;
    output += `  Context Budget: ${getContextEmoji(contextBudget.status)} ${contextBudget.status}\n\n`;

    if (taskPriority.high.length > 0) {
      const nextTask = taskPriority.high[0];
      output += `${colors.bright}${colors.yellow}⚡ Next Task:${colors.reset}\n`;
      output += `  ${nextTask.description}\n`;
      output += `  ${colors.dim}Agent: ${nextTask.assignedAgent} │ ETA: ${nextTask.eta}${colors.reset}\n\n`;
    }

    return output;
  }

  // Main Plan
  if (mainPlan.activeFeature) {
    output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
    output += `${colors.bright}${colors.white}🎯 Main Plan:${colors.reset} ${mainPlan.activeFeature}\n`;
    output += `${colors.bright}${colors.white}Status:${colors.reset} ${getStatusEmoji(mainPlan.status)} ${mainPlan.status}\n`;
    output += `${colors.bright}${colors.white}Agents:${colors.reset} ${mainPlan.agentsWorking.join(', ')}\n`;
    output += `${colors.bright}${colors.white}Total ETA:${colors.reset} ${mainPlan.totalETA}\n\n`;

    output += `${colors.bright}${colors.white}Phases:${colors.reset}\n`;
    for (const phase of mainPlan.phases) {
      const statusEmoji = getStatusEmoji(phase.status);
      const progressBar = createProgressBar(phase.progress, 30);
      output += `  ${statusEmoji} Phase ${phase.number}: ${phase.name}\n`;
      output += `     ${progressBar} ${phase.progress}% │ ETA: ${phase.eta}\n`;
    }
    output += '\n';
  }

  // Task Priority
  output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
  output += `${colors.bright}${colors.white}📋 Task Prioritization:${colors.reset}\n\n`;

  if (taskPriority.high.length > 0) {
    output += `${colors.bright}${colors.red}🔴 High Priority (${taskPriority.high.length}):${colors.reset}\n`;
    for (const task of taskPriority.high) {
      output += `  • ${task.description}\n`;
      output += `    ${colors.dim}${task.assignedAgent} │ ETA: ${task.eta} │ Context: ${task.contextNeeded} tokens`;
      if (task.canParallel) output += ` │ ✓ Can parallel`;
      if (task.dependsOn.length > 0) output += ` │ Depends on: ${task.dependsOn.join(', ')}`;
      output += `${colors.reset}\n`;
    }
    output += '\n';
  }

  if (taskPriority.medium.length > 0) {
    output += `${colors.bright}${colors.yellow}🟡 Medium Priority (${taskPriority.medium.length}):${colors.reset}\n`;
    for (const task of taskPriority.medium) {
      output += `  • ${task.description}\n`;
      output += `    ${colors.dim}${task.assignedAgent} │ ETA: ${task.eta}${colors.reset}\n`;
    }
    output += '\n';
  }

  if (taskPriority.low.length > 0) {
    output += `${colors.bright}${colors.green}🟢 Low Priority (${taskPriority.low.length}):${colors.reset}\n`;
    for (const task of taskPriority.low) {
      output += `  • ${task.description}\n`;
    }
    output += '\n';
  }

  // Parallel Opportunities
  if (parallelOpportunities.length > 0) {
    output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
    output += `${colors.bright}${colors.white}⚡ Parallel Execution Opportunities:${colors.reset}\n\n`;
    for (const opp of parallelOpportunities) {
      output += `  ${colors.green}✓${colors.reset} Run tasks ${opp.tasks.join(', ')} in parallel\n`;
      output += `    ${colors.dim}Agents: ${opp.agents.join(', ')} │ Time Saved: ${opp.timeSaved} │ Context: ${opp.contextRequired} tokens${colors.reset}\n`;
    }
    output += '\n';
  }

  // Context Budget
  output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
  output += `${colors.bright}${colors.white}🧠 Context Budget:${colors.reset}\n\n`;
  const contextColor = contextBudget.status === 'healthy' ? colors.green : contextBudget.status === 'warning' ? colors.yellow : colors.red;
  const contextEmoji = getContextEmoji(contextBudget.status);
  output += `  ${contextColor}${contextEmoji} ${contextBudget.status.toUpperCase()}${colors.reset} - ${contextBudget.message}\n`;
  output += `  Available: ${formatNumber(contextBudget.available)} tokens\n`;
  output += `  Allocated: ${formatNumber(contextBudget.allocated)} tokens\n`;
  output += `  Reserved:  ${formatNumber(contextBudget.reserved)} tokens\n`;
  output += `  Remaining: ${formatNumber(contextBudget.remaining)} tokens\n\n`;

  const usagePercent = Math.round(((contextBudget.allocated + contextBudget.reserved) / contextBudget.available) * 100);
  const usageBar = createProgressBar(usagePercent, 50);
  output += `  ${usageBar} ${usagePercent}% used\n\n`;

  // Three-Tier Status
  output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
  output += `${colors.bright}${colors.white}🏗️  Three-Tier Architecture Status:${colors.reset}\n\n`;

  // Backend
  output += `  ${colors.cyan}💻 Backend (Marcus):${colors.reset}\n`;
  const backendBar = createProgressBar(threeTierStatus.backend.progress, 30);
  output += `     ${backendBar} ${threeTierStatus.backend.progress}% (${threeTierStatus.backend.completed}/${threeTierStatus.backend.total})\n`;
  output += `     ${colors.dim}Next: ${threeTierStatus.backend.next}${colors.reset}\n`;
  output += `     ${colors.dim}💡 ${threeTierStatus.backend.recommendation}${colors.reset}\n\n`;

  // Database
  output += `  ${colors.blue}🗄️  Database (Dana):${colors.reset}\n`;
  const dbBar = createProgressBar(threeTierStatus.database.progress, 30);
  output += `     ${dbBar} ${threeTierStatus.database.progress}% - ${threeTierStatus.database.status}\n`;
  output += `     ${colors.dim}💡 ${threeTierStatus.database.recommendation}${colors.reset}\n\n`;

  // Frontend
  output += `  ${colors.magenta}🎨 Frontend (James):${colors.reset}\n`;
  const frontendBar = createProgressBar(threeTierStatus.frontend.progress, 30);
  output += `     ${frontendBar} ${threeTierStatus.frontend.progress}% (${threeTierStatus.frontend.completed}/${threeTierStatus.frontend.total})\n`;
  output += `     ${colors.dim}Next: ${threeTierStatus.frontend.next}${colors.reset}\n`;
  output += `     ${colors.dim}💡 ${threeTierStatus.frontend.recommendation}${colors.reset}\n\n`;

  // Quick Stats
  output += `${colors.bright}${colors.magenta}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`;
  output += `${colors.bright}${colors.white}📊 Quick Stats:${colors.reset}\n\n`;
  output += `  Framework Health: ${getHealthEmoji(quickStats.frameworkHealth)} ${quickStats.frameworkHealth}%\n`;
  output += `  Active Agents:    ${quickStats.activeAgents}\n`;
  output += `  Pending Todos:    ${quickStats.pendingTodos}\n`;
  output += `  Git Status:       ${quickStats.gitStatus}\n`;
  output += `  Build Status:     ${getStatusEmoji(quickStats.buildStatus)} ${quickStats.buildStatus}\n`;
  output += `  Test Status:      ${getStatusEmoji(quickStats.testStatus)} ${quickStats.testStatus}\n\n`;

  return output;
}

// Helper: Create progress bar
function createProgressBar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  let color;
  if (percent >= 75) color = colors.green;
  else if (percent >= 50) color = colors.yellow;
  else if (percent >= 25) color = colors.yellow;
  else color = colors.red;

  return `${color}${'█'.repeat(filled)}${colors.dim}${'░'.repeat(empty)}${colors.reset}`;
}

// Helper: Get status emoji
function getStatusEmoji(status) {
  const map = {
    'completed': '✅',
    'in_progress': '🔄',
    'pending': '⏸️',
    'passing': '✅',
    'failing': '❌',
    'clean': '✅'
  };
  return map[status] || '❓';
}

// Helper: Get health emoji
function getHealthEmoji(health) {
  if (health >= 90) return '🟢';
  if (health >= 75) return '🟡';
  if (health >= 50) return '🟠';
  return '🔴';
}

// Helper: Get context emoji
function getContextEmoji(status) {
  const map = {
    'healthy': '🟢',
    'warning': '🟡',
    'critical': '🔴'
  };
  return map[status] || '❓';
}

// Helper: Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const flags = {
    brief: args.includes('--brief'),
    json: args.includes('--json'),
    watch: args.includes('--watch'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (flags.help) {
    console.log(`
${colors.bright}${colors.cyan}VERSATIL Session Compass${colors.reset}

${colors.bright}Usage:${colors.reset}
  pnpm run session:compass          Show full session overview
  pnpm run session:compass --brief  Show brief summary only
  pnpm run session:compass --json   Output as JSON
  pnpm run session:compass --watch  Watch mode (refresh every 60s)
  pnpm run session:compass --help   Show this help

${colors.bright}Description:${colors.reset}
  Displays comprehensive development context on session open:
  - Project status and git state
  - Main plan with phase progress
  - Task prioritization (high/medium/low)
  - Parallel execution opportunities
  - Context budget availability
  - Three-tier architecture status (backend/database/frontend)
  - Quick stats and recommendations

${colors.bright}Examples:${colors.reset}
  pnpm run session:compass                    # Full overview
  pnpm run session:compass --brief            # Quick summary
  pnpm run session:compass --json > state.json  # Export to JSON
  pnpm run session:compass --watch            # Continuous monitoring
    `);
    return;
  }

  async function displayOverview() {
    try {
      // Try to load SessionCompass
      let overview;

      const SessionCompass = await loadSessionCompass();

      if (SessionCompass) {
        const compass = new SessionCompass();
        overview = await compass.generateOverview();
      } else {
        // Fallback to mock data
        console.log(`${colors.dim}(Using mock data - run 'pnpm run build' for real-time data)${colors.reset}\n`);
        overview = await getMockOverview();
      }

      if (flags.json) {
        console.log(JSON.stringify(overview, null, 2));
      } else {
        const output = formatAsText(overview, flags.brief);
        console.log(output);
      }

    } catch (error) {
      console.error(`${colors.red}❌ Error generating session compass:${colors.reset}`, error.message);
      if (!flags.watch) {
        process.exit(1);
      }
    }
  }

  if (flags.watch) {
    console.log(`${colors.cyan}🔄 Watch mode enabled - refreshing every 60 seconds${colors.reset}`);
    console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);

    await displayOverview();

    setInterval(async () => {
      console.clear();
      console.log(`${colors.dim}Last updated: ${new Date().toLocaleTimeString()}${colors.reset}\n`);
      await displayOverview();
    }, 60000);
  } else {
    await displayOverview();
  }
}

// Run
main().catch(error => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});
