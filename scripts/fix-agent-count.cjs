#!/usr/bin/env node

/**
 * Agent Count Fix Script
 *
 * Automatically updates all documentation from 17 agents (7 core + 10 sub) to 18 agents (8 core + 10 sub)
 * This script performs bulk find-and-replace operations across all markdown, TypeScript, and JSON files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.jest-cache',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
];

// Replacements to make
const REPLACEMENTS = [
  // Agent count references
  { from: /\b17\s+agents/gi, to: '18 agents' },
  { from: /\b17\s+specialized\s+agents/gi, to: '18 specialized agents' },
  { from: /\b17\s+OPERA\s+agents/gi, to: '18 OPERA agents' },
  { from: /\b17\s+fully\s+implemented\s+agents/gi, to: '18 fully implemented agents' },

  // Core agent count
  { from: /\b7\s+core\s+agents?/gi, to: '8 core agents' },
  { from: /\b7\s+core\s+OPERA/gi, to: '8 core OPERA' },

  // Combined references
  { from: /\(7\s+core\s+\+\s+10/gi, to: '(8 core + 10' },
  { from: /7\s+core.*10\s+sub-?agents/gi, to: '8 core + 10 sub-agents' },
  { from: /7\s+core.*10\s+language-?specific/gi, to: '8 core + 10 language-specific' },

  // Badge URLs
  { from: /OPERA-17%20agents/g, to: 'OPERA-18%20agents' },
  { from: /17%20agents/g, to: '18%20agents' },

  // Math expressions
  { from: /7\s+→\s+17\s+agents/g, to: '8 → 18 agents' },
  { from: /Agent\s+Count:\s+7\s+→\s+17/g, to: 'Agent Count: 8 → 18' },
];

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);

    if (shouldExclude(filePath)) {
      return;
    }

    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (
      file.endsWith('.md') ||
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.json')
    ) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    let changesMade = [];

    REPLACEMENTS.forEach(({ from, to }) => {
      const regex = new RegExp(from.source, from.flags);
      const matches = content.match(regex);

      if (matches && matches.length > 0) {
        content = content.replace(regex, to);
        modified = true;
        changesMade.push(`  ${from.source} → ${to} (${matches.length} occurrences)`);
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { filePath, changesMade };
    }

    return null;
  } catch (error) {
    log(`⚠️  Error processing ${filePath}: ${error.message}`, 'yellow');
    return null;
  }
}

function main() {
  log('🔧 Agent Count Fix Script', 'bold');
  log('Updating documentation from 17 agents to 18 agents (8 core + 10 sub-agents)\n', 'cyan');

  const rootDir = process.cwd();
  log(`Scanning files in: ${rootDir}`, 'cyan');

  const files = getAllFiles(rootDir);
  log(`Found ${files.length} files to check\n`, 'cyan');

  const modifiedFiles = [];

  files.forEach((file) => {
    const result = processFile(file);
    if (result) {
      modifiedFiles.push(result);
    }
  });

  if (modifiedFiles.length === 0) {
    log('✅ No files needed updating. All agent counts are already correct!', 'green');
  } else {
    log(`\n✅ Updated ${modifiedFiles.length} files:\n`, 'green');

    modifiedFiles.forEach(({ filePath, changesMade }) => {
      log(`📝 ${path.relative(rootDir, filePath)}`, 'cyan');
      changesMade.forEach((change) => log(change, 'yellow'));
      log('');
    });

    log(`\n🎉 Successfully updated ${modifiedFiles.length} files!`, 'bold');
    log('Run "node scripts/verify-agent-count.cjs" to verify all changes.', 'cyan');
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { processFile, getAllFiles };
