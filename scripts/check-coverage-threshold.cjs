#!/usr/bin/env node

/**
 * Coverage Threshold Checker
 *
 * Enforces 80%+ test coverage before allowing commits.
 * Parses Jest/Istanbul coverage reports and validates thresholds.
 *
 * Exit Codes:
 *   0 - Coverage meets threshold (≥80%)
 *   1 - Coverage below threshold (<80%)
 *   2 - Coverage report not found or error
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Coverage threshold configuration
const THRESHOLD = 80;
const COVERAGE_METRICS = ['statements', 'branches', 'functions', 'lines'];

/**
 * Find coverage report file
 * Checks for coverage-summary.json in standard Jest locations
 */
function findCoverageReport() {
  const possiblePaths = [
    path.join(process.cwd(), 'coverage', 'coverage-summary.json'),
    path.join(process.cwd(), 'coverage', 'jest', 'coverage-summary.json'),
    path.join(process.cwd(), '.jest-cache', 'unit', 'coverage-summary.json'),
  ];

  for (const coveragePath of possiblePaths) {
    if (fs.existsSync(coveragePath)) {
      return coveragePath;
    }
  }

  return null;
}

/**
 * Parse coverage report
 * Reads and validates JSON coverage data
 */
function parseCoverageReport(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const coverage = JSON.parse(data);

    // Jest/Istanbul format: { total: { statements: { pct: 85.5 }, ... } }
    if (!coverage.total) {
      throw new Error('Invalid coverage format: missing "total" field');
    }

    return coverage.total;
  } catch (error) {
    console.error(`${colors.red}❌ Error parsing coverage report:${colors.reset}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Check if coverage meets threshold
 * Returns { passed, failedMetrics, metrics }
 */
function checkCoverageThreshold(coverage) {
  const failedMetrics = [];
  const metrics = {};

  for (const metric of COVERAGE_METRICS) {
    if (!coverage[metric] || typeof coverage[metric].pct !== 'number') {
      console.error(`${colors.red}❌ Invalid coverage data for ${metric}${colors.reset}`);
      return null;
    }

    const percentage = coverage[metric].pct;
    metrics[metric] = percentage;

    if (percentage < THRESHOLD) {
      failedMetrics.push({ metric, percentage });
    }
  }

  return {
    passed: failedMetrics.length === 0,
    failedMetrics,
    metrics,
  };
}

/**
 * Format percentage with color
 */
function formatPercentage(percentage, threshold) {
  const color = percentage >= threshold ? colors.green : colors.red;
  return `${color}${percentage.toFixed(2)}%${colors.reset}`;
}

/**
 * Display coverage results
 */
function displayCoverageResults(result) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}Coverage Report${colors.reset}`);
  console.log('='.repeat(60) + '\n');

  console.log('Current Coverage:\n');

  for (const metric of COVERAGE_METRICS) {
    const percentage = result.metrics[metric];
    const formattedPct = formatPercentage(percentage, THRESHOLD);
    const status = percentage >= THRESHOLD ? '✅' : '❌';
    const label = metric.charAt(0).toUpperCase() + metric.slice(1);

    console.log(`  ${status} ${label.padEnd(12)}: ${formattedPct} (threshold: ${THRESHOLD}%)`);
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Display error message when coverage is below threshold
 */
function displayFailureMessage(result) {
  console.error(`${colors.red}${colors.bold}❌ Coverage below ${THRESHOLD}% threshold. Commit blocked.${colors.reset}\n`);

  console.error('Failed Metrics:\n');

  for (const { metric, percentage } of result.failedMetrics) {
    const deficit = (THRESHOLD - percentage).toFixed(2);
    const label = metric.charAt(0).toUpperCase() + metric.slice(1);
    console.error(`  • ${label}: ${percentage.toFixed(2)}% (need ${deficit}% more)`);
  }

  console.error(`\n${colors.yellow}💡 Solutions:${colors.reset}`);
  console.error('  1. Add tests to increase coverage');
  console.error('  2. Run: npm run test:coverage');
  console.error('  3. Check coverage report: coverage/index.html\n');
}

/**
 * Display success message
 */
function displaySuccessMessage() {
  console.log(`${colors.green}${colors.bold}✅ Coverage meets ${THRESHOLD}% threshold. Commit allowed.${colors.reset}\n`);
}

/**
 * Main execution
 */
function main() {
  // Find coverage report
  const coverageReportPath = findCoverageReport();

  if (!coverageReportPath) {
    console.error(`${colors.red}❌ Coverage report not found${colors.reset}`);
    console.error('Expected location: coverage/coverage-summary.json');
    console.error(`\n${colors.yellow}💡 Run tests first: npm run test:coverage${colors.reset}\n`);
    process.exit(2);
  }

  // Parse coverage data
  const coverage = parseCoverageReport(coverageReportPath);
  if (!coverage) {
    process.exit(2);
  }

  // Check threshold
  const result = checkCoverageThreshold(coverage);
  if (!result) {
    process.exit(2);
  }

  // Display results
  displayCoverageResults(result);

  // Pass or fail
  if (result.passed) {
    displaySuccessMessage();
    process.exit(0);
  } else {
    displayFailureMessage(result);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  findCoverageReport,
  parseCoverageReport,
  checkCoverageThreshold,
  THRESHOLD,
  COVERAGE_METRICS,
};
