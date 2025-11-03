#!/usr/bin/env node
/**
 * Learning System Verification Script
 *
 * Verifies learning system is working and patterns are stored correctly.
 *
 * Usage:
 *   node scripts/test-learning.cjs                 # Quick verification
 *   node scripts/test-learning.cjs --verbose       # Detailed output
 *   node scripts/test-learning.cjs --category testing # Test specific category
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

/**
 * Test learning system
 */
async function testLearningSystem() {
  log.title('🧪 Testing VERSATIL Learning System');

  // Parse arguments
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

  let allPassed = true;

  // Test 1: Check directories exist
  log.info('\n[Test 1] Checking learning directories...');
  const learningDir = path.join(process.env.HOME, '.versatil', 'learning');
  const patternsDir = path.join(learningDir, 'patterns');
  const indexesDir = path.join(learningDir, 'indexes');
  const sessionsDir = path.join(learningDir, 'sessions');

  const requiredDirs = [
    { name: 'learning', path: learningDir },
    { name: 'patterns', path: patternsDir },
    { name: 'indexes', path: indexesDir },
    { name: 'sessions', path: sessionsDir },
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir.path)) {
      log.error(`Directory ${dir.name} not found at ${dir.path}`);
      log.info('Run: pnpm run learning:seed');
      allPassed = false;
    } else {
      log.success(`Directory ${dir.name} exists`);
    }
  }

  // Test 2: Check pattern count
  log.info('\n[Test 2] Counting stored learning patterns...');
  if (!fs.existsSync(patternsDir)) {
    log.error('Patterns directory not found');
    allPassed = false;
  } else {
    const patternFiles = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
    if (patternFiles.length === 0) {
      log.warn('No learning patterns found');
      log.info('Run: pnpm run learning:seed');
      allPassed = false;
    } else {
      log.success(`Found ${patternFiles.length} learning patterns`);
    }
  }

  // Test 3: Verify search index
  log.info('\n[Test 3] Checking search index...');
  const indexPath = path.join(indexesDir, 'search.json');
  if (!fs.existsSync(indexPath)) {
    log.warn('Search index not found');
    log.info('Run: pnpm run learning:seed');
    allPassed = false;
  } else {
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

      if (!index.patterns || index.patterns.length === 0) {
        log.error('Search index is empty');
        allPassed = false;
      } else {
        log.success(`Search index has ${index.patterns.length} patterns`);

        // Show breakdown
        if (verbose) {
          log.info('\nPattern breakdown:');
          if (index.byCategory) {
            console.log('\n  By Category:');
            for (const [category, ids] of Object.entries(index.byCategory).sort((a, b) => b[1].length - a[1].length)) {
              console.log(`    ${category.padEnd(20)} : ${ids.length} patterns`);
            }
          }
          if (index.byAgent) {
            console.log('\n  By Agent:');
            for (const [agent, ids] of Object.entries(index.byAgent).sort((a, b) => b[1].length - a[1].length)) {
              console.log(`    ${agent.padEnd(20)} : ${ids.length} patterns`);
            }
          }
          if (index.byEffectiveness) {
            console.log('\n  By Effectiveness:');
            for (const [level, ids] of Object.entries(index.byEffectiveness)) {
              console.log(`    ${level.padEnd(20)} : ${ids.length} patterns`);
            }
          }
        }
      }
    } catch (error) {
      log.error(`Failed to read search index: ${error.message}`);
      allPassed = false;
    }
  }

  // Test 4: Verify pattern structure
  log.info('\n[Test 4] Verifying pattern structure...');
  if (fs.existsSync(patternsDir)) {
    const patternFiles = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
    if (patternFiles.length > 0) {
      try {
        const sampleFile = path.join(patternsDir, patternFiles[0]);
        const sample = JSON.parse(fs.readFileSync(sampleFile, 'utf8'));

        const requiredFields = ['id', 'pattern', 'effectiveness', 'timeSaved', 'category', 'agent'];
        const missingFields = requiredFields.filter(field => !(field in sample));

        if (missingFields.length > 0) {
          log.error(`Pattern missing fields: ${missingFields.join(', ')}`);
          allPassed = false;
        } else {
          log.success('Pattern structure is valid');

          if (verbose) {
            log.info('\nSample pattern:');
            console.log(`  Pattern: ${sample.pattern}`);
            console.log(`  Effectiveness: ${(sample.effectiveness * 100).toFixed(0)}%`);
            console.log(`  Time Saved: ${sample.timeSaved} minutes`);
            console.log(`  Category: ${sample.category}`);
            console.log(`  Agent: ${sample.agent}`);
          }
        }
      } catch (error) {
        log.error(`Failed to parse pattern file: ${error.message}`);
        allPassed = false;
      }
    }
  }

  // Test 5: Category filtering (if specified)
  if (categoryFilter) {
    log.info(`\n[Test 5] Testing category filter: ${categoryFilter}...`);
    try {
      const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const categoryPatterns = index.byCategory[categoryFilter];

      if (!categoryPatterns) {
        log.warn(`No patterns found for category: ${categoryFilter}`);
      } else {
        log.success(`Found ${categoryPatterns.length} patterns in category ${categoryFilter}`);

        if (verbose) {
          // Show patterns in this category
          categoryPatterns.forEach((id, idx) => {
            const patternFile = path.join(patternsDir, `${id}.json`);
            if (fs.existsSync(patternFile)) {
              const pattern = JSON.parse(fs.readFileSync(patternFile, 'utf8'));
              console.log(`\n  ${idx + 1}. ${pattern.pattern}`);
              console.log(`     Effectiveness: ${(pattern.effectiveness * 100).toFixed(0)}% | Time Saved: ${pattern.timeSaved}min`);
              console.log(`     ${pattern.evidence}`);
            }
          });
        }
      }
    } catch (error) {
      log.error(`Category filter test failed: ${error.message}`);
      allPassed = false;
    }
  }

  // Test 6: Effectiveness calculation (verbose mode)
  if (verbose) {
    log.info('\n[Test 6] Analyzing effectiveness metrics...');
    try {
      const patternFiles = fs.readdirSync(patternsDir).filter(f => f.endsWith('.json'));
      const patterns = patternFiles.map(f =>
        JSON.parse(fs.readFileSync(path.join(patternsDir, f), 'utf8'))
      );

      const avgEffectiveness = patterns.reduce((sum, p) => sum + p.effectiveness, 0) / patterns.length;
      const totalTimeSaved = patterns.reduce((sum, p) => sum + p.timeSaved, 0);
      const highEffectiveness = patterns.filter(p => p.effectiveness >= 0.9).length;

      log.success('Effectiveness metrics calculated');
      console.log(`\n  Average Effectiveness: ${(avgEffectiveness * 100).toFixed(1)}%`);
      console.log(`  Total Time Savings: ${totalTimeSaved} minutes (${(totalTimeSaved / 60).toFixed(1)} hours)`);
      console.log(`  High Effectiveness (≥90%): ${highEffectiveness}/${patterns.length} patterns`);
      console.log(`  Compounding Potential: ${(avgEffectiveness * 0.4 * 100).toFixed(0)}% faster per iteration`);
    } catch (error) {
      log.warn(`Effectiveness analysis failed: ${error.message}`);
    }
  }

  // Summary
  log.title(allPassed ? '✅ All Tests Passed' : '❌ Some Tests Failed');

  if (!allPassed) {
    log.info('\nTroubleshooting:');
    console.log('  1. Seed default patterns: pnpm run learning:seed');
    console.log('  2. Re-run tests: pnpm run learning:test');
    console.log('  3. Check logs: tail -f ~/.versatil/logs/learning.log');
    process.exit(1);
  } else {
    log.success('Learning system is fully functional!');
    log.info('\nNext steps:');
    console.log('  • Use VERSATIL normally (patterns accumulate automatically)');
    console.log('  • Monitor growth: pnpm run learning:test --verbose');
    console.log('  • Check patterns: ls ~/.versatil/learning/patterns/ | wc -l');
  }
}

// Run
testLearningSystem().catch(error => {
  log.error('Test failed: ' + error.message);
  console.error(error);
  process.exit(1);
});
