#!/usr/bin/env node

/**
 * Agent Count Verification Script
 *
 * Verifies that documentation accurately reflects the correct agent count:
 * - 8 core OPERA agents (Alex-BA, Dana, Marcus, James, Maria, Sarah, Dr.AI, Oliver)
 * - 10 language-specific sub-agents (5 Marcus backend + 5 James frontend)
 * - Total: 18 agents
 *
 * This script:
 * 1. Counts registered agents in code
 * 2. Counts documented agents in CLAUDE.md
 * 3. Searches for outdated "17 agents" or "7 core" references
 * 4. Reports discrepancies and exits with error if found
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Expected agent counts
const EXPECTED = {
  core: 8,
  subAgents: 10,
  total: 18,
  coreAgents: [
    'Alex-BA',
    'Dana-Database',
    'Marcus-Backend',
    'James-Frontend',
    'Maria-QA',
    'Sarah-PM',
    'Dr.AI-ML',
    'Oliver-MCP',
  ],
  subAgents: {
    marcus: ['marcus-node', 'marcus-python', 'marcus-rails', 'marcus-go', 'marcus-java'],
    james: ['james-react', 'james-vue', 'james-nextjs', 'james-angular', 'james-svelte'],
  },
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(80)}`, 'cyan');
  log(`  ${message}`, 'bold');
  log('='.repeat(80), 'cyan');
}

function checkFile(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    log(`⚠️  Warning: Could not read ${filePath}: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Verify CLAUDE.md documentation
 */
function verifyCLAUDEmd() {
  header('📄 Verifying CLAUDE.md');

  const claudePath = path.join(process.cwd(), 'CLAUDE.md');
  if (!checkFile(claudePath)) {
    log('❌ CLAUDE.md not found!', 'red');
    return false;
  }

  const content = readFile(claudePath);
  if (!content) return false;

  const issues = [];

  // Check for correct header
  if (!content.includes('## 👥 18 OPERA Agents (8 Core + 10 Sub-Agents)')) {
    issues.push('Header should be: "## 👥 18 OPERA Agents (8 Core + 10 Sub-Agents)"');
  }

  // Check for "18 fully implemented agents"
  if (!content.includes('18 fully implemented agents')) {
    issues.push('Should mention "18 fully implemented agents"');
  }

  // Check for "8 Core OPERA Agents"
  if (!content.includes('8 Core OPERA Agents')) {
    issues.push('Should mention "8 Core OPERA Agents"');
  }

  // Check for all core agents
  EXPECTED.coreAgents.forEach((agent) => {
    if (!content.includes(agent)) {
      issues.push(`Missing core agent: ${agent}`);
    }
  });

  // Check for all Marcus sub-agents
  EXPECTED.subAgents.marcus.forEach((agent) => {
    if (!content.includes(agent)) {
      issues.push(`Missing Marcus sub-agent: ${agent}`);
    }
  });

  // Check for all James sub-agents
  EXPECTED.subAgents.james.forEach((agent) => {
    if (!content.includes(agent)) {
      issues.push(`Missing James sub-agent: ${agent}`);
    }
  });

  // Check for outdated references
  const outdatedPatterns = [
    /\b17\s+fully implemented agents?/i,
    /\b7\s+core.*agents?/i,
    /\(7\s+core\s+\+\s+10/i,
  ];

  outdatedPatterns.forEach((pattern) => {
    if (pattern.test(content)) {
      issues.push(`Found outdated pattern: ${pattern}`);
    }
  });

  if (issues.length === 0) {
    log('✅ CLAUDE.md correctly documents 18 agents (8 core + 10 sub-agents)', 'green');
    return true;
  } else {
    log('❌ CLAUDE.md has issues:', 'red');
    issues.forEach((issue) => log(`   - ${issue}`, 'red'));
    return false;
  }
}

/**
 * Search for outdated agent count references in all documentation
 */
function searchOutdatedReferences() {
  header('🔍 Searching for Outdated Agent Count References');

  const patterns = [
    { pattern: '17 agents', correct: '18 agents' },
    { pattern: '7 core', correct: '8 core' },
    { pattern: '(7 core + 10', correct: '(8 core + 10' },
    { pattern: '17 specialized agents', correct: '18 specialized agents' },
    { pattern: '17 OPERA agents', correct: '18 OPERA agents' },
  ];

  let foundIssues = false;

  patterns.forEach(({ pattern, correct }) => {
    try {
      // Use grep to search (case-insensitive)
      const cmd = `grep -rni "${pattern}" --include="*.md" --include="*.ts" --include="*.json" . 2>/dev/null || true`;
      const result = execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() });

      if (result.trim()) {
        // Filter out completion reports (they document the fix, so they reference old values)
        const lines = result.trim().split('\n').filter((line) => {
          return (
            !line.includes('.jest-cache') &&
            !line.includes('node_modules') &&
            !line.includes('dist/') &&
            !line.includes('AGENT_COUNT_FIX_COMPLETE.md') && // This file documents the before/after
            !line.includes('PHASE_2_COMPLETE.md') // This file also documents fixes
          );
        });

        if (lines.length > 0) {
          foundIssues = true;
          log(`\n⚠️  Found "${pattern}" (should be "${correct}"):`, 'yellow');
          lines.slice(0, 10).forEach((line) => {
            const [file, ...rest] = line.split(':');
            if (file) {
              log(`   ${file}`, 'yellow');
            }
          });
          if (lines.length > 10) {
            log(`   ... and ${lines.length - 10} more`, 'yellow');
          }
        }
      }
    } catch (error) {
      // grep returns non-zero when no matches found, which is good
    }
  });

  if (!foundIssues) {
    log('✅ No outdated agent count references found', 'green');
  }

  return !foundIssues;
}

/**
 * Verify agent definitions in code
 */
function verifyAgentDefinitions() {
  header('💻 Verifying Agent Definitions in Code');

  const agentDefsPath = path.join(process.cwd(), 'src/agents/sdk/agent-definitions.ts');

  if (!checkFile(agentDefsPath)) {
    log('⚠️  Warning: src/agents/sdk/agent-definitions.ts not found', 'yellow');
    return true; // Not a failure, just a warning
  }

  const content = readFile(agentDefsPath);
  if (!content) return true;

  let foundAgents = 0;
  const missingAgents = [];

  // Check for core agents
  EXPECTED.coreAgents.forEach((agent) => {
    const patterns = [
      new RegExp(`'${agent.toLowerCase().replace('-', '_')}'`, 'i'),
      new RegExp(`"${agent.toLowerCase().replace('-', '_')}"`, 'i'),
      new RegExp(agent.replace('-', ''), 'i'),
    ];

    const found = patterns.some((pattern) => pattern.test(content));
    if (found) {
      foundAgents++;
    } else {
      missingAgents.push(agent);
    }
  });

  // Check for sub-agents
  [...EXPECTED.subAgents.marcus, ...EXPECTED.subAgents.james].forEach((agent) => {
    const patterns = [
      new RegExp(`'${agent.replace('-', '_')}'`, 'i'),
      new RegExp(`"${agent.replace('-', '_')}"`, 'i'),
      new RegExp(agent.replace(/-/g, ''), 'i'),
    ];

    const found = patterns.some((pattern) => pattern.test(content));
    if (found) {
      foundAgents++;
    } else {
      missingAgents.push(agent);
    }
  });

  log(`Found ${foundAgents}/${EXPECTED.total} agents in code`, 'cyan');

  if (missingAgents.length > 0) {
    log('⚠️  Potentially missing agents in code:', 'yellow');
    missingAgents.forEach((agent) => log(`   - ${agent}`, 'yellow'));
  } else {
    log('✅ All agents found in code definitions', 'green');
  }

  return true; // Don't fail on this check, just inform
}

/**
 * Generate summary report
 */
function generateReport(results) {
  header('📊 Verification Summary');

  const allPassed = Object.values(results).every((r) => r === true);

  log(`\nResults:`, 'cyan');
  log(`  CLAUDE.md verification: ${results.claudeMd ? '✅ PASS' : '❌ FAIL'}`, results.claudeMd ? 'green' : 'red');
  log(`  Outdated references check: ${results.outdatedRefs ? '✅ PASS' : '❌ FAIL'}`, results.outdatedRefs ? 'green' : 'red');
  log(`  Agent definitions check: ${results.agentDefs ? '✅ PASS' : '⚠️  WARNING'}`, results.agentDefs ? 'green' : 'yellow');

  log(`\nExpected Agent Count:`, 'cyan');
  log(`  Core Agents: ${EXPECTED.core}`, 'cyan');
  log(`  Sub-Agents: ${EXPECTED.subAgents} (${EXPECTED.subAgents.marcus.length} Marcus + ${EXPECTED.subAgents.james.length} James)`, 'cyan');
  log(`  Total: ${EXPECTED.total}`, 'bold');

  if (allPassed) {
    log('\n🎉 All checks passed! Agent count is correctly documented as 18 agents.', 'green');
    return 0;
  } else {
    log('\n❌ Some checks failed. Please update documentation to reflect 18 agents (8 core + 10 sub-agents).', 'red');
    return 1;
  }
}

/**
 * Main execution
 */
function main() {
  log('🚀 VERSATIL Agent Count Verification', 'bold');
  log('Ensuring documentation matches actual agent count (18 agents)\n', 'cyan');

  const results = {
    claudeMd: verifyCLAUDEmd(),
    outdatedRefs: searchOutdatedReferences(),
    agentDefs: verifyAgentDefinitions(),
  };

  const exitCode = generateReport(results);
  process.exit(exitCode);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EXPECTED, verifyCLAUDEmd, searchOutdatedReferences, verifyAgentDefinitions };
