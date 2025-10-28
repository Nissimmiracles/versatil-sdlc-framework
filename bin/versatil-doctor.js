#!/usr/bin/env node

/**
 * VERSATIL Doctor - CLI Health Check
 *
 * Comprehensive health check for VERSATIL framework installations
 * Runs outside of Claude sessions (terminal-only)
 *
 * Usage:
 *   npx versatil doctor              # Full health check
 *   npx versatil doctor --quick      # Quick check (version + critical only)
 *   npx versatil doctor --fix        # Auto-fix issues
 *
 * @version 7.9.0
 */

const { getUserCoherenceCheckService } = require('../dist/coherence/user-coherence-check.js');
const path = require('path');
const chalk = require('chalk');

// ANSI color codes (if chalk not available)
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
};

async function main() {
  const args = process.argv.slice(2);
  const quick = args.includes('--quick');
  const fix = args.includes('--fix');

  console.log(colors.bold('\n🔍 VERSATIL Doctor - Health Check\n'));

  try {
    // Get project root (current working directory)
    const projectRoot = process.cwd();

    console.log(colors.gray(`Project: ${projectRoot}\n`));

    // Create coherence check service
    const coherenceService = getUserCoherenceCheckService(projectRoot);

    // Run health check
    console.log(quick ? 'Running quick check...\n' : 'Running full check...\n');
    const startTime = Date.now();

    const result = await coherenceService.performCoherenceCheck(quick);

    const duration = Date.now() - startTime;
    console.log(colors.gray(`\nCompleted in ${duration}ms\n`));

    // Display results
    displayResults(result);

    // Apply auto-fixes if requested
    if (fix && result.auto_fixes_available.length > 0) {
      console.log(colors.bold('\n🔧 Applying Auto-Fixes\n'));

      const fixResult = await coherenceService.applyAutoFixes(result.auto_fixes_available);

      for (const message of fixResult.results) {
        if (message.startsWith('✅')) {
          console.log(colors.green(message));
        } else if (message.startsWith('❌')) {
          console.log(colors.red(message));
        } else if (message.startsWith('⚠️')) {
          console.log(colors.yellow(message));
        } else {
          console.log(message);
        }
      }

      if (fixResult.success) {
        console.log(colors.green('\n✅ Auto-fixes applied successfully'));
        console.log(colors.gray('Run `npx versatil doctor` again to verify\n'));
      } else {
        console.log(colors.red('\n❌ Some fixes failed - see messages above\n'));
      }
    }

    // Exit with appropriate code
    if (result.overall_health >= 75) {
      process.exit(0);
    } else if (result.overall_health >= 50) {
      process.exit(1);
    } else {
      process.exit(2);
    }
  } catch (error) {
    console.error(colors.red('\n❌ Health check failed:\n'));
    console.error(error);
    process.exit(3);
  }
}

/**
 * Display health check results
 */
function displayResults(result) {
  // Overall health
  console.log(colors.bold('═'.repeat(60)));
  console.log(colors.bold(`Overall Health: ${result.overall_health}/100 ${getHealthEmoji(result.overall_health)}`));
  console.log(colors.bold(`Status: ${getStatusText(result.status)}`));
  console.log(colors.bold('═'.repeat(60)));
  console.log('');

  // Version check
  displayVersionCheck(result.checks.version);

  // Installation check
  displayInstallationCheck(result.checks.installation);

  // Agent check
  displayAgentCheck(result.checks.agents);

  // MCP check
  displayMCPCheck(result.checks.mcp);

  // RAG check
  displayRAGCheck(result.checks.rag);

  // Dependency check
  displayDependencyCheck(result.checks.dependencies);

  // Context check
  displayContextCheck(result.checks.context);

  // Issues
  if (result.issues.length > 0) {
    console.log(colors.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(colors.bold(`Issues Detected (${result.issues.length})`));
    console.log(colors.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    for (const issue of result.issues) {
      displayIssue(issue);
    }
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    console.log(colors.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(colors.bold('Recommendations'));
    console.log(colors.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    for (const rec of result.recommendations) {
      console.log(`  ${rec}`);
    }
  }

  // Auto-fixes available
  if (result.auto_fixes_available.length > 0) {
    console.log(colors.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(colors.bold('Auto-Fixes Available'));
    console.log(colors.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    console.log(colors.green(`${result.auto_fixes_available.length} issue(s) can be auto-fixed\n`));
    console.log(colors.blue('Run with --fix flag to apply auto-fixes:'));
    console.log(colors.gray('  npx versatil doctor --fix\n'));
  }
}

/**
 * Display version check
 */
function displayVersionCheck(check) {
  console.log(colors.bold('\n📦 Version Status'));
  console.log(`  Installed: ${check.installed_version}`);
  console.log(`  Latest:    ${check.latest_version}`);
  console.log(`  Status:    ${getVersionStatusText(check.status)}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);
}

/**
 * Display installation check
 */
function displayInstallationCheck(check) {
  console.log(colors.bold('\n📁 Installation Integrity'));
  console.log(`  Files:     ${check.files_present}/${check.files_expected} present`);
  console.log(`  Structure: ${check.directory_structure === 'valid' ? colors.green('✓ Valid') : colors.red('✗ Invalid')}`);
  console.log(`  Build:     ${getCompilationStatusText(check.compilation_status)}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);

  if (check.critical_missing.length > 0) {
    console.log(colors.red(`  Missing:   ${check.critical_missing.join(', ')}`));
  }
}

/**
 * Display agent check
 */
function displayAgentCheck(check) {
  console.log(colors.bold('\n🤖 Agent Configuration'));
  console.log(`  Agents:    ${check.operational_agents}/${check.total_agents} operational`);
  console.log(`  Auto-Act:  ${check.auto_activation_configured ? colors.green('✓ Configured') : colors.yellow('⚠ Not configured')}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);

  if (check.invalid_definitions.length > 0) {
    console.log(colors.yellow(`  Issues:    ${check.invalid_definitions.join(', ')}`));
  }
}

/**
 * Display MCP check
 */
function displayMCPCheck(check) {
  console.log(colors.bold('\n🔌 MCP Servers'));
  console.log(`  Tools:     ${check.tools_accessible}/${check.total_tools} accessible`);
  console.log(`  Latency:   ${check.connection_latency_ms}ms`);
  console.log(`  Status:    ${getMCPStatusText(check.server_health)}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);
}

/**
 * Display RAG check
 */
function displayRAGCheck(check) {
  console.log(colors.bold('\n🧠 RAG Connectivity'));
  console.log(`  GraphRAG:  ${getRAGStatusText(check.graphrag_status)}`);
  console.log(`  Vector:    ${getRAGStatusText(check.vector_status)}`);
  console.log(`  Router:    ${check.router_status === 'operational' ? colors.green('✓ Operational') : colors.red('✗ Failed')}`);
  console.log(`  Search:    ${check.pattern_search_status === 'operational' ? colors.green('✓ Operational') : colors.red('✗ Failed')}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);
}

/**
 * Display dependency check
 */
function displayDependencyCheck(check) {
  console.log(colors.bold('\n📦 Dependencies'));
  console.log(`  Security:  ${getDependencySecurityText(check)}`);
  console.log(`  Peers:     ${check.peer_dependencies_installed ? colors.green('✓ Installed') : colors.red('✗ Missing')}`);
  console.log(`  Compat:    ${check.version_compatibility === 'valid' ? colors.green('✓ Valid') : colors.red('✗ Invalid')}`);
  console.log(`  Lock:      ${check.lock_file_integrity === 'valid' ? colors.green('✓ Valid') : colors.yellow('⚠ Invalid')}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);
}

/**
 * Display context check
 */
function displayContextCheck(check) {
  console.log(colors.bold('\n🔒 Context Detection'));
  console.log(`  Context:   ${getContextText(check.current_context)}`);
  console.log(`  Isolation: ${check.isolation_enforced ? colors.green('✓ Enforced') : colors.yellow('⚠ Not enforced')}`);
  console.log(`  Config:    ${check.configuration_loaded ? colors.green('✓ Loaded') : colors.yellow('⚠ Not loaded')}`);
  console.log(`  Mixing:    ${check.context_mixing_detected ? colors.red('✗ Detected') : colors.green('✓ None')}`);
  console.log(`  Health:    ${getHealthBar(check.health_score)}`);
}

/**
 * Display issue
 */
function displayIssue(issue) {
  const severityColor = {
    critical: colors.red,
    high: colors.red,
    medium: colors.yellow,
    low: colors.blue
  }[issue.severity];

  console.log(severityColor(`  ${getSeverityEmoji(issue.severity)} ${issue.severity.toUpperCase()} - ${issue.description}`));
  console.log(`     Impact: ${issue.impact}`);
  console.log(`     Fix: ${issue.recommendation}`);
  if (issue.auto_fix_available) {
    console.log(colors.green(`     🔧 Auto-fix available`));
  }
  console.log('');
}

/**
 * Helper functions for display
 */

function getHealthEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 75) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

function getStatusText(status) {
  const statusMap = {
    excellent: colors.green('Excellent'),
    good: colors.green('Good'),
    degraded: colors.yellow('Degraded'),
    critical: colors.red('Critical')
  };
  return statusMap[status] || status;
}

function getVersionStatusText(status) {
  const statusMap = {
    up_to_date: colors.green('✓ Up to date'),
    patch_available: colors.blue('⚠ Patch available'),
    minor_available: colors.yellow('⚠ Minor update available'),
    major_available: colors.red('⚠ Major update available'),
    unknown: colors.gray('? Unknown')
  };
  return statusMap[status] || status;
}

function getCompilationStatusText(status) {
  const statusMap = {
    current: colors.green('✓ Current'),
    outdated: colors.yellow('⚠ Outdated'),
    missing: colors.red('✗ Missing')
  };
  return statusMap[status] || status;
}

function getMCPStatusText(status) {
  const statusMap = {
    all_operational: colors.green('✓ All operational'),
    some_down: colors.yellow('⚠ Some down'),
    all_down: colors.red('✗ All down')
  };
  return statusMap[status] || status;
}

function getRAGStatusText(status) {
  const statusMap = {
    connected: colors.green('✓ Connected'),
    timeout: colors.yellow('⚠ Timeout'),
    failed: colors.red('✗ Failed')
  };
  return statusMap[status] || status;
}

function getDependencySecurityText(check) {
  if (check.critical_vulnerabilities > 0) {
    return colors.red(`✗ ${check.critical_vulnerabilities} critical`);
  }
  if (check.high_vulnerabilities > 0) {
    return colors.yellow(`⚠ ${check.high_vulnerabilities} high`);
  }
  return colors.green('✓ No issues');
}

function getContextText(context) {
  const contextMap = {
    FRAMEWORK_CONTEXT: colors.blue('Framework Development'),
    PROJECT_CONTEXT: colors.green('User Project'),
    unknown: colors.gray('Unknown')
  };
  return contextMap[context] || context;
}

function getSeverityEmoji(severity) {
  const emojiMap = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵'
  };
  return emojiMap[severity] || '⚪';
}

function getHealthBar(score) {
  const barLength = 20;
  const filled = Math.round((score / 100) * barLength);
  const empty = barLength - filled;

  let color = colors.green;
  if (score < 90) color = colors.yellow;
  if (score < 75) color = colors.yellow;
  if (score < 50) color = colors.red;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return color(`${bar} ${score}/100`);
}

// Run main
main().catch((error) => {
  console.error(colors.red('\n❌ Unexpected error:\n'));
  console.error(error);
  process.exit(3);
});
