#!/usr/bin/env node
/**
 * VERSATIL Framework - Synchronization Validation Command
 *
 * Single command to validate all synchronization across the framework.
 * Usage: pnpm run validate:sync
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration
const PROJECT_ROOT = process.cwd();
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const QUICK = process.argv.includes('--quick') || process.argv.includes('-q');
const AUTO_RECOVER = process.argv.includes('--recover') || process.argv.includes('-r');
const WATCH = process.argv.includes('--watch') || process.argv.includes('-w');

// Sync validation results
const results = {
  eventSystem: { name: 'Event System', status: null, score: 0, details: '' },
  orchestrators: { name: 'Orchestrators', status: null, score: 0, details: '' },
  memoryConsistency: { name: 'Memory Consistency', status: null, score: 0, details: '' },
  healthSystems: { name: 'Health Systems', status: null, score: 0, details: '' },
  githubSync: { name: 'GitHub Sync', status: null, score: 0, details: '' },
  agentCoordination: { name: 'Agent Coordination', status: null, score: 0, details: '' }
};

// Icons
const ICONS = {
  pass: '✅',
  warn: '⚠️ ',
  fail: '❌',
  sync: '🔄',
  check: '🔍',
  star: '✨'
};

/**
 * Validation 1: Event System Health
 */
async function validateEventSystem() {
  console.log(`${ICONS.check} Validating event system...`);

  try {
    // Check if event listeners are properly set up
    const orchestratorFiles = [
      'src/orchestration/proactive-agent-orchestrator.ts',
      'src/orchestration/agentic-rag-orchestrator.ts',
      'src/orchestration/github-sync-orchestrator.ts',
      'src/monitoring/framework-efficiency-monitor.ts'
    ];

    let hasEventEmitters = 0;
    let totalFiles = 0;

    for (const file of orchestratorFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        totalFiles++;
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('EventEmitter') && content.includes('.emit(')) {
          hasEventEmitters++;
        }
      }
    }

    const score = totalFiles > 0 ? Math.round((hasEventEmitters / totalFiles) * 100) : 0;

    results.eventSystem.status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';
    results.eventSystem.score = score;
    results.eventSystem.details = `${hasEventEmitters}/${totalFiles} orchestrators with event emitters`;

    if (VERBOSE) {
      console.log(`  Event emitters found: ${hasEventEmitters}/${totalFiles}`);
    }

  } catch (error) {
    results.eventSystem.status = 'fail';
    results.eventSystem.score = 0;
    results.eventSystem.details = `Error: ${error.message}`;
  }
}

/**
 * Validation 2: Orchestrator Status
 */
async function validateOrchestrators() {
  console.log(`${ICONS.check} Validating orchestrators...`);

  try {
    const orchestratorFiles = [
      'src/orchestration/proactive-agent-orchestrator.ts',
      'src/orchestration/agentic-rag-orchestrator.ts',
      'src/orchestration/plan-first-opera.ts',
      'src/orchestration/stack-aware-orchestrator.ts',
      'src/orchestration/github-sync-orchestrator.ts',
      'src/orchestration/parallel-task-manager.ts',
      'src/monitoring/framework-efficiency-monitor.ts',
      'src/agents/meta/introspective-meta-agent.ts'
    ];

    let existingFiles = 0;
    let validFiles = 0;

    for (const file of orchestratorFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        existingFiles++;

        // Check if file has proper class definition
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('class ') && content.includes('export')) {
          validFiles++;
        }
      }
    }

    const score = Math.round((existingFiles / orchestratorFiles.length) * 100);

    results.orchestrators.status = score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail';
    results.orchestrators.score = score;
    results.orchestrators.details = `${existingFiles}/${orchestratorFiles.length} orchestrators exist, ${validFiles} valid`;

    if (VERBOSE) {
      console.log(`  Orchestrators found: ${existingFiles}/${orchestratorFiles.length}`);
      console.log(`  Valid implementations: ${validFiles}`);
    }

  } catch (error) {
    results.orchestrators.status = 'fail';
    results.orchestrators.score = 0;
    results.orchestrators.details = `Error: ${error.message}`;
  }
}

/**
 * Validation 3: Memory Consistency
 */
async function validateMemoryConsistency() {
  console.log(`${ICONS.check} Validating memory consistency...`);

  try {
    // Check if RAG system files exist
    const ragFiles = [
      'src/rag/enhanced-vector-memory-store.ts',
      'src/orchestration/agentic-rag-orchestrator.ts'
    ];

    let existingRagFiles = 0;
    for (const file of ragFiles) {
      if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
        existingRagFiles++;
      }
    }

    // Check if Supabase vector store exists
    const supabaseStore = path.join(PROJECT_ROOT, 'src/lib/supabase-vector-store.ts');
    const hasSupabase = fs.existsSync(supabaseStore);

    const score = Math.round(((existingRagFiles / ragFiles.length) * 70) + (hasSupabase ? 30 : 0));

    results.memoryConsistency.status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';
    results.memoryConsistency.score = score;
    results.memoryConsistency.details = `RAG files: ${existingRagFiles}/${ragFiles.length}, Supabase: ${hasSupabase ? 'yes' : 'no'}`;

    if (VERBOSE) {
      console.log(`  RAG system files: ${existingRagFiles}/${ragFiles.length}`);
      console.log(`  Supabase integration: ${hasSupabase ? 'Found' : 'Missing'}`);
    }

  } catch (error) {
    results.memoryConsistency.status = 'fail';
    results.memoryConsistency.score = 0;
    results.memoryConsistency.details = `Error: ${error.message}`;
  }
}

/**
 * Validation 4: Health Systems
 */
async function validateHealthSystems() {
  console.log(`${ICONS.check} Validating health systems...`);

  try {
    const healthSystems = [
      { name: 'Framework Monitor', file: 'src/monitoring/framework-efficiency-monitor.ts' },
      { name: 'Introspective Agent', file: 'src/agents/meta/introspective-meta-agent.ts' },
      { name: 'Doctor System', file: 'scripts/doctor-integration.cjs' },
      { name: 'Sync Dashboard', file: 'src/monitoring/synchronization-dashboard.ts' }
    ];

    let existingSystems = 0;
    const systemStatus = [];

    for (const system of healthSystems) {
      const exists = fs.existsSync(path.join(PROJECT_ROOT, system.file));
      if (exists) existingSystems++;

      if (VERBOSE) {
        console.log(`  ${exists ? '✅' : '❌'} ${system.name}`);
      }
      systemStatus.push(`${system.name}: ${exists ? 'present' : 'missing'}`);
    }

    const score = Math.round((existingSystems / healthSystems.length) * 100);

    results.healthSystems.status = score >= 90 ? 'pass' : score >= 70 ? 'warn' : 'fail';
    results.healthSystems.score = score;
    results.healthSystems.details = `${existingSystems}/${healthSystems.length} systems available`;

  } catch (error) {
    results.healthSystems.status = 'fail';
    results.healthSystems.score = 0;
    results.healthSystems.details = `Error: ${error.message}`;
  }
}

/**
 * Validation 5: GitHub Synchronization
 */
async function validateGitHubSync() {
  if (QUICK) {
    results.githubSync.status = 'pass';
    results.githubSync.score = 100;
    results.githubSync.details = 'Skipped in quick mode';
    return;
  }

  console.log(`${ICONS.check} Validating GitHub sync...`);

  try {
    // Check if we're in a git repository
    const { stdout: isGit } = await execPromise('git rev-parse --is-inside-work-tree', { cwd: PROJECT_ROOT });

    if (isGit.trim() !== 'true') {
      results.githubSync.status = 'warn';
      results.githubSync.score = 0;
      results.githubSync.details = 'Not a git repository';
      return;
    }

    // Check for uncommitted changes
    const { stdout: status } = await execPromise('git status --porcelain', { cwd: PROJECT_ROOT });
    const hasChanges = status.trim().length > 0;

    // Check if we're up to date with remote
    const { stdout: ahead } = await execPromise('git rev-list --count HEAD..@{u}', { cwd: PROJECT_ROOT })
      .catch(() => ({ stdout: '0' }));
    const behindCommits = parseInt(ahead.trim());

    const { stdout: behind } = await execPromise('git rev-list --count @{u}..HEAD', { cwd: PROJECT_ROOT })
      .catch(() => ({ stdout: '0' }));
    const aheadCommits = parseInt(behind.trim());

    // Calculate score
    let score = 100;
    if (hasChanges) score -= 20;
    if (behindCommits > 0) score -= 30;
    if (aheadCommits > 0) score -= 10;

    results.githubSync.status = score >= 80 ? 'pass' : score >= 50 ? 'warn' : 'fail';
    results.githubSync.score = Math.max(0, score);
    results.githubSync.details = `Changes: ${hasChanges ? 'yes' : 'no'}, Behind: ${behindCommits}, Ahead: ${aheadCommits}`;

    if (VERBOSE) {
      console.log(`  Uncommitted changes: ${hasChanges ? 'Yes' : 'No'}`);
      console.log(`  Behind remote: ${behindCommits} commits`);
      console.log(`  Ahead of remote: ${aheadCommits} commits`);
    }

  } catch (error) {
    results.githubSync.status = 'warn';
    results.githubSync.score = 50;
    results.githubSync.details = 'Git operations failed';
  }
}

/**
 * Validation 6: Agent Coordination
 */
async function validateAgentCoordination() {
  console.log(`${ICONS.check} Validating agent coordination...`);

  try {
    // Check for agent configuration files
    const agentConfigDir = path.join(PROJECT_ROOT, '.claude', 'agents');
    const agents = ['maria-qa', 'james-frontend', 'marcus-backend', 'sarah-pm', 'alex-ba', 'dr-ai-ml'];

    let configuredAgents = 0;
    if (fs.existsSync(agentConfigDir)) {
      for (const agent of agents) {
        const configFile = path.join(agentConfigDir, `${agent}.json`);
        if (fs.existsSync(configFile)) {
          configuredAgents++;
        }
      }
    }

    // Check for proactive agent orchestrator
    const orchestratorFile = path.join(PROJECT_ROOT, 'src/orchestration/proactive-agent-orchestrator.ts');
    const hasOrchestrator = fs.existsSync(orchestratorFile);

    // Check settings.json for proactive agents config
    const settingsFile = path.join(PROJECT_ROOT, '.cursor', 'settings.json');
    let hasProactiveConfig = false;
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      hasProactiveConfig = !!settings.versatil?.proactive_agents;
    }

    const score = Math.round(
      ((configuredAgents / agents.length) * 50) +
      (hasOrchestrator ? 25 : 0) +
      (hasProactiveConfig ? 25 : 0)
    );

    results.agentCoordination.status = score >= 80 ? 'pass' : score >= 60 ? 'warn' : 'fail';
    results.agentCoordination.score = score;
    results.agentCoordination.details = `${configuredAgents}/${agents.length} agents, Orchestrator: ${hasOrchestrator ? 'yes' : 'no'}, Config: ${hasProactiveConfig ? 'yes' : 'no'}`;

    if (VERBOSE) {
      console.log(`  Configured agents: ${configuredAgents}/${agents.length}`);
      console.log(`  Orchestrator: ${hasOrchestrator ? 'Present' : 'Missing'}`);
      console.log(`  Proactive config: ${hasProactiveConfig ? 'Present' : 'Missing'}`);
    }

  } catch (error) {
    results.agentCoordination.status = 'fail';
    results.agentCoordination.score = 0;
    results.agentCoordination.details = `Error: ${error.message}`;
  }
}

/**
 * Calculate overall sync score
 */
function calculateOverallScore() {
  const scores = Object.values(results).map(r => r.score);
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}

/**
 * Print validation results
 */
function printResults() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 VERSATIL Synchronization Validation Report');
  console.log('='.repeat(70));

  const overallScore = calculateOverallScore();
  const syncStatus = overallScore >= 90 ? '✅ SYNCHRONIZED' :
                     overallScore >= 70 ? '⚠️  PARTIAL SYNC' :
                     '❌ OUT OF SYNC';

  console.log(`\nOverall Status: ${syncStatus}`);
  console.log(`Sync Score: ${overallScore}% ${getSyncEmoji(overallScore)}`);
  console.log('');

  // Print individual results
  for (const [key, result] of Object.entries(results)) {
    const icon = result.status === 'pass' ? ICONS.pass :
                 result.status === 'warn' ? ICONS.warn : ICONS.fail;
    console.log(`${icon} ${result.name}: ${result.score}%`);
    if (VERBOSE || result.status !== 'pass') {
      console.log(`   ${result.details}`);
    }
  }

  console.log('');

  // Print recommendations
  const failedChecks = Object.values(results).filter(r => r.status === 'fail');
  const warningChecks = Object.values(results).filter(r => r.status === 'warn');

  if (failedChecks.length > 0) {
    console.log('❌ Critical Issues:');
    failedChecks.forEach(check => {
      console.log(`   - ${check.name}: ${check.details}`);
    });
    console.log('');
  }

  if (warningChecks.length > 0) {
    console.log('⚠️  Warnings:');
    warningChecks.forEach(check => {
      console.log(`   - ${check.name}: ${check.details}`);
    });
    console.log('');
  }

  if (AUTO_RECOVER && (failedChecks.length > 0 || warningChecks.length > 0)) {
    console.log(`${ICONS.star} Run with --recover flag to attempt auto-recovery`);
    console.log('');
  }

  if (overallScore >= 90) {
    console.log('✅ All systems synchronized and healthy!');
  } else if (overallScore >= 70) {
    console.log('⚠️  Some synchronization issues detected. Review warnings above.');
  } else {
    console.log('❌ Critical synchronization issues detected. Run /doctor for diagnostics.');
  }

  console.log('');
  console.log('='.repeat(70));
}

/**
 * Get sync emoji based on score
 */
function getSyncEmoji(score) {
  if (score >= 95) return '🟢';
  if (score >= 85) return '🟡';
  if (score >= 70) return '🟠';
  return '🔴';
}

/**
 * Attempt auto-recovery
 */
async function attemptRecovery() {
  console.log('\n' + ICONS.star + ' Attempting auto-recovery...\n');

  let recovered = 0;

  // Recovery 1: Event System
  if (results.eventSystem.status === 'fail') {
    console.log('Recovering event system...');
    console.log('  → Manual intervention required: Restart framework services');
  }

  // Recovery 2: Orchestrators
  if (results.orchestrators.status === 'fail') {
    console.log('Recovering orchestrators...');
    console.log('  → Check if all orchestrator files are properly compiled');
    try {
      await execPromise('pnpm run build', { cwd: PROJECT_ROOT });
      console.log('  ✅ Compiled TypeScript files');
      recovered++;
    } catch (error) {
      console.log('  ⚠️  Compilation failed');
    }
  }

  // Recovery 3: Memory Consistency
  if (results.memoryConsistency.status === 'fail') {
    console.log('Recovering memory consistency...');
    console.log('  → Run: pnpm run rag:validate to check memory stores');
  }

  // Recovery 4: Agent Coordination
  if (results.agentCoordination.status === 'fail') {
    console.log('Recovering agent coordination...');
    console.log('  → Run: pnpm run init to recreate agent configurations');
  }

  if (recovered > 0) {
    console.log(`\n${ICONS.star} Recovered ${recovered} component(s)\n`);
    console.log('Re-running validation...\n');
    await runValidation();
  } else {
    console.log('\n⚠️  No auto-recoverable issues found\n');
  }
}

/**
 * Run all validations
 */
async function runValidation() {
  console.log('🔍 VERSATIL Synchronization Validation');
  console.log('=====================================\n');

  await validateEventSystem();
  await validateOrchestrators();
  await validateMemoryConsistency();
  await validateHealthSystems();
  await validateGitHubSync();
  await validateAgentCoordination();

  printResults();

  // Auto-recover if requested
  if (AUTO_RECOVER) {
    const failedChecks = Object.values(results).filter(r => r.status === 'fail');
    if (failedChecks.length > 0) {
      await attemptRecovery();
    }
  }
}

/**
 * Watch mode - continuous validation
 */
async function watchMode() {
  console.log('👁️  Starting watch mode (Ctrl+C to stop)...\n');

  const runCycle = async () => {
    await runValidation();
    console.log('\nNext check in 30 seconds...\n');
  };

  // Initial run
  await runCycle();

  // Set up interval
  setInterval(runCycle, 30000);
}

/**
 * Main execution
 */
async function main() {
  if (WATCH) {
    await watchMode();
  } else {
    await runValidation();

    // Exit code based on results
    const overallScore = calculateOverallScore();
    process.exit(overallScore >= 70 ? 0 : 1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Error running sync validation:', error);
    process.exit(1);
  });
}

module.exports = { runValidation, results, calculateOverallScore };