#!/usr/bin/env node
/**
 * VERSATIL V2.0 Quick Demo - 30 Second Value Proof
 *
 * Demonstrates that v2.0 infrastructure works and provides value
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log(`
╔══════════════════════════════════════════════════════════════╗
║       VERSATIL V2.0 Framework - Quick Demo                  ║
║         Proving v2.0 Works in 30 Seconds                    ║
╚══════════════════════════════════════════════════════════════╝
`);

function runCommand(description, command) {
  console.log(`\n📋 ${description}`);
  console.log(`   Command: ${command}\n`);

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    console.log(output);
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

function checkFiles(description, files) {
  console.log(`\n📋 ${description}`);

  let found = 0;
  let total = files.length;

  files.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`);
      found++;
    } else {
      console.log(`   ❌ ${file} (missing)`);
    }
  });

  console.log(`\n   Result: ${found}/${total} files found`);
  return found === total;
}

// Demo Flow
let score = 0;
const maxScore = 5;

console.log('\n🎯 Starting V2.0 Demo...\n');

// Test 1: Slash Commands Infrastructure
if (checkFiles('Test 1: Slash Commands Infrastructure', [
  '.claude/commands/maria-qa.md',
  '.claude/commands/james-frontend.md',
  '.claude/commands/marcus-backend.md',
  '.claude/commands/sarah-pm.md',
  '.claude/commands/alex-ba.md',
  '.claude/commands/dr-ai-ml.md'
])) {
  score++;
  console.log('\n   ✅ PASS: All 6 OPERA agent slash commands exist');
} else {
  console.log('\n   ❌ FAIL: Missing slash command files');
}

// Test 2: Agent Configurations
if (checkFiles('Test 2: Agent Configurations', [
  '.claude/agents/maria-qa.json',
  '.claude/agents/james-frontend.json',
  '.claude/agents/marcus-backend.json'
])) {
  score++;
  console.log('\n   ✅ PASS: Agent configurations exist');
} else {
  console.log('\n   ❌ FAIL: Missing agent configurations');
}

// Test 3: Hooks System
if (checkFiles('Test 3: Hooks System', [
  '.claude/hooks/pre-tool-use/isolation-validator.sh',
  '.claude/hooks/post-tool-use/quality-validator.sh',
  '.claude/hooks/session-start/framework-init.sh'
])) {
  score++;
  console.log('\n   ✅ PASS: Hooks system exists');
} else {
  console.log('\n   ❌ FAIL: Missing hooks');
}

// Test 4: Doctor Health Check
if (runCommand('Test 4: Doctor Health Check', 'node scripts/doctor-integration.cjs --quick')) {
  score++;
  console.log('   ✅ PASS: Doctor health check works');
} else {
  console.log('   ❌ FAIL: Doctor health check failed');
}

// Test 5: Isolation Validation
if (runCommand('Test 5: Isolation Validation', 'npm run validate:isolation')) {
  score++;
  console.log('   ✅ PASS: Isolation validation works');
} else {
  console.log('   ❌ FAIL: Isolation validation failed');
}

// Results
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     Demo Results                            ║
╚══════════════════════════════════════════════════════════════╝

Score: ${score}/${maxScore} tests passed

${score === maxScore ? '🎉 PERFECT SCORE! V2.0 infrastructure is fully operational!' :
  score >= 4 ? '✅ GOOD! Most v2.0 features working, minor issues to fix' :
  score >= 3 ? '🟡 PARTIAL! V2.0 foundation exists but needs fixes' :
  '❌ NEEDS WORK! Critical v2.0 components missing or broken'}

Next Steps:
${score === maxScore ?
  '• Test slash commands in Cursor UI (type /maria)\n  • Test @-mentions activation\n  • Proceed to v3.0 planning with confidence' :
  '• Fix failing tests above\n  • Run demo again until 5/5 score\n  • Then test in Cursor UI'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentation:
• Reality Check: VERSATIL_V2_REALITY_CHECK.md
• V2→V3 Bridge: VERSATIL_V2_TO_V3_BRIDGE.md
• V3 Vision: VERSATIL_V3_CONTEXT_ENGINEERING_VISION.md
• V3 Specs: VERSATIL_V3_TECHNICAL_SPECIFICATIONS.md

Time to Complete: ~30 seconds ⏱️

`);

process.exit(score === maxScore ? 0 : 1);