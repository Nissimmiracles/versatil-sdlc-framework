#!/usr/bin/env node

/**
 * VERSATIL Security Scanner CLI
 * Command-line interface for Mozilla Observatory security scanning
 *
 * Commands:
 * - scan <url>           - Scan a URL for security vulnerabilities
 * - report <url>         - Generate detailed security report
 * - fix-headers          - Auto-fix security headers for your framework
 * - validate-csp <url>   - Validate Content Security Policy
 * - quick-check <url>    - Quick security grade check
 * - watch <url>          - Continuous monitoring mode
 */

const { observatoryScanner } = require('../dist/security/observatory-scanner.js');
const { securityHeaderValidator } = require('../dist/security/security-header-validator.js');
const { securityReportGenerator } = require('../dist/security/security-report-generator.js');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getGradeColor(grade) {
  if (grade === 'A+' || grade === 'A') return 'green';
  if (grade.startsWith('B')) return 'yellow';
  if (grade.startsWith('C')) return 'yellow';
  return 'red';
}

function getSeverityColor(severity) {
  if (severity === 'critical' || severity === 'high') return 'red';
  if (severity === 'medium') return 'yellow';
  return 'cyan';
}

/**
 * Scan command - Full security scan
 */
async function scanCommand(url, options = {}) {
  console.log(colorize('\n🔒 VERSATIL Security Scanner', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan'));
  console.log(`\nScanning: ${colorize(url, 'bright')}\n`);

  try {
    // Run Observatory scan
    const spinner = setInterval(() => {
      process.stdout.write('.');
    }, 500);

    const scanResult = await observatoryScanner.scanUrl(url, {
      rescan: options.rescan,
      hidden: options.hidden
    });

    clearInterval(spinner);
    console.log('\n');

    // Display results
    displayScanResults(scanResult);

    return scanResult;

  } catch (error) {
    console.error(colorize(`\n❌ Scan failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Display scan results
 */
function displayScanResults(result) {
  const gradeColor = getGradeColor(result.grade);

  console.log(colorize('┌─ Security Score ─────────────────────────────────┐', 'cyan'));
  console.log(`│ Grade: ${colorize(result.grade, gradeColor)} │ Score: ${colorize(result.score + '/100', gradeColor)}`);
  console.log(colorize('└──────────────────────────────────────────────────┘', 'cyan'));

  console.log(`\n${colorize('Tests:', 'bright')}`);
  console.log(`  ${colorize('✓', 'green')} Passed: ${colorize(result.tests_passed, 'green')}/${result.tests_total}`);
  console.log(`  ${colorize('✗', 'red')} Failed: ${colorize(result.tests_failed, 'red')}/${result.tests_total}`);

  // Failed tests
  const failedTests = result.test_results.filter(t => !t.pass);
  if (failedTests.length > 0) {
    console.log(`\n${colorize('Failed Tests:', 'red')}`);
    failedTests.forEach(test => {
      console.log(`  ${colorize('•', 'red')} ${test.name}: ${test.expectation}`);
    });
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    console.log(`\n${colorize('Recommendations:', 'yellow')}`);
    result.recommendations.slice(0, 5).forEach(rec => {
      console.log(`  ${colorize('→', 'yellow')} ${rec}`);
    });
  }

  // Pass/Fail status
  const pass = observatoryScanner.meetsMinimumGrade(result.grade, 'A');
  console.log('\n' + colorize('─'.repeat(60), 'cyan'));

  if (pass) {
    console.log(colorize('✅ PASS: Ready for deployment', 'green'));
  } else {
    console.log(colorize('❌ FAIL: Security grade below minimum threshold (A required)', 'red'));
    console.log(colorize('⚠️  Deployment blocked until security issues are resolved', 'red'));
  }

  console.log(colorize('─'.repeat(60), 'cyan') + '\n');
}

/**
 * Report command - Generate comprehensive report
 */
async function reportCommand(url, options = {}) {
  console.log(colorize('\n📊 Generating Security Report', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan') + '\n');

  try {
    // Run scan
    const scanResult = await observatoryScanner.scanUrl(url, options);

    // Validate headers
    const validations = await securityHeaderValidator.validateHeaders(url);

    // Generate report
    const report = await securityReportGenerator.generateReport(scanResult, validations);

    // Export reports
    const jsonPath = await securityReportGenerator.exportJSON(report);
    const mdPath = await securityReportGenerator.exportMarkdown(report);

    console.log(colorize('✅ Report generated successfully!', 'green'));
    console.log(`\nJSON:     ${colorize(jsonPath, 'bright')}`);
    console.log(`Markdown: ${colorize(mdPath, 'bright')}\n`);

    // Display summary
    console.log(colorize('Report Summary:', 'bright'));
    console.log(`  Grade:          ${colorize(report.grade, getGradeColor(report.grade))}`);
    console.log(`  Score:          ${colorize(report.score + '/100', getGradeColor(report.grade))}`);
    console.log(`  Vulnerabilities: ${colorize(report.vulnerabilities.length, report.vulnerabilities.length > 0 ? 'red' : 'green')}`);
    console.log(`  Status:         ${report.pass ? colorize('PASS ✅', 'green') : colorize('FAIL ❌', 'red')}\n`);

    if (report.vulnerabilities.length > 0) {
      console.log(colorize('Top Vulnerabilities:', 'yellow'));
      report.vulnerabilities.slice(0, 3).forEach((v, i) => {
        const severityColor = getSeverityColor(v.severity);
        console.log(`  ${i + 1}. [${colorize(v.severity.toUpperCase(), severityColor)}] ${v.title}`);
      });
      console.log('');
    }

    return report;

  } catch (error) {
    console.error(colorize(`\n❌ Report generation failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Fix headers command - Auto-fix security headers
 */
async function fixHeadersCommand(options = {}) {
  console.log(colorize('\n🔧 Auto-Fix Security Headers', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan') + '\n');

  try {
    // Detect framework
    const framework = await securityHeaderValidator.detectFramework();

    console.log(`Detected framework: ${colorize(framework.framework, 'bright')} (${framework.language})\n`);

    // Get headers to apply
    const headers = options.minimal
      ? securityHeaderValidator.getMinimalHeaders()
      : securityHeaderValidator.getRecommendedHeaders();

    console.log(`Applying ${options.minimal ? 'minimal' : 'recommended'} security headers...\n`);

    // Apply auto-fix
    const result = await securityHeaderValidator.autoFix(headers);

    if (result.success) {
      console.log(colorize('✅ Security headers configured successfully!', 'green') + '\n');

      console.log(colorize('Files Modified:', 'bright'));
      result.filesModified.forEach(file => {
        console.log(`  ${colorize('→', 'green')} ${file}`);
      });

      console.log(`\n${colorize('Headers Added:', 'bright')}`);
      result.headersAdded.forEach(header => {
        console.log(`  ${colorize('✓', 'green')} ${header}`);
      });

      if (result.recommendations.length > 0) {
        console.log(`\n${colorize('Next Steps:', 'yellow')}`);
        result.recommendations.forEach(rec => {
          console.log(`  ${colorize('→', 'yellow')} ${rec}`);
        });
      }

      console.log('');

    } else {
      console.log(colorize(`❌ Auto-fix failed: ${result.error}`, 'red') + '\n');

      if (result.recommendations.length > 0) {
        console.log(colorize('Manual Configuration Required:', 'yellow'));
        result.recommendations.forEach(rec => {
          console.log(`  ${colorize('→', 'yellow')} ${rec}`);
        });
        console.log('');
      }

      process.exit(1);
    }

  } catch (error) {
    console.error(colorize(`\n❌ Fix headers failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Validate CSP command
 */
async function validateCspCommand(url) {
  console.log(colorize('\n🛡️  Validating Content Security Policy', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan') + '\n');

  try {
    const validations = await securityHeaderValidator.validateHeaders(url);
    const csp = validations.find(v => v.header === 'Content-Security-Policy');

    if (!csp) {
      console.log(colorize('❌ CSP validation data not available', 'red'));
      process.exit(1);
    }

    console.log(`CSP Header: ${csp.present ? colorize('Present', 'green') : colorize('Missing', 'red')}`);

    if (csp.present) {
      console.log(`Valid:      ${csp.valid ? colorize('Yes', 'green') : colorize('No', 'red')}`);
      console.log(`Score:      ${colorize(csp.score + '/100', csp.score >= 80 ? 'green' : 'yellow')}`);
      console.log(`\nValue:\n${colorize(csp.value || '', 'bright')}`);

      if (csp.issues.length > 0) {
        console.log(`\n${colorize('Issues:', 'red')}`);
        csp.issues.forEach(issue => {
          console.log(`  ${colorize('•', 'red')} ${issue}`);
        });
      }
    }

    if (csp.recommendations.length > 0) {
      console.log(`\n${colorize('Recommendations:', 'yellow')}`);
      csp.recommendations.forEach(rec => {
        console.log(`  ${colorize('→', 'yellow')} ${rec}`);
      });
    }

    console.log('');

  } catch (error) {
    console.error(colorize(`\n❌ CSP validation failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Quick check command
 */
async function quickCheckCommand(url) {
  console.log(colorize('\n⚡ Quick Security Check', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan') + '\n');

  try {
    const { grade, score } = await observatoryScanner.quickGradeCheck(url);
    const gradeColor = getGradeColor(grade);

    console.log(`URL:   ${colorize(url, 'bright')}`);
    console.log(`Grade: ${colorize(grade, gradeColor)}`);
    console.log(`Score: ${colorize(score + '/100', gradeColor)}`);

    const pass = observatoryScanner.meetsMinimumGrade(grade, 'A');
    console.log(`Status: ${pass ? colorize('PASS ✅', 'green') : colorize('FAIL ❌', 'red')}\n`);

    if (!pass) {
      console.log(colorize('Run full scan for details: pnpm run security:scan ' + url, 'yellow') + '\n');
    }

  } catch (error) {
    console.error(colorize(`\n❌ Quick check failed: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Watch command - Continuous monitoring
 */
async function watchCommand(url, options = {}) {
  const interval = options.interval || 300000; // 5 minutes default

  console.log(colorize('\n👀 Continuous Security Monitoring', 'cyan'));
  console.log(colorize('━'.repeat(60), 'cyan'));
  console.log(`\nURL:      ${colorize(url, 'bright')}`);
  console.log(`Interval: ${colorize(Math.floor(interval / 60000) + ' minutes', 'bright')}\n`);
  console.log(colorize('Press Ctrl+C to stop\n', 'yellow'));

  let iteration = 1;

  const monitor = async () => {
    console.log(colorize(`\n[${new Date().toISOString()}] Scan #${iteration}`, 'cyan'));
    console.log(colorize('─'.repeat(60), 'cyan'));

    try {
      const { grade, score } = await observatoryScanner.quickGradeCheck(url);
      const gradeColor = getGradeColor(grade);

      console.log(`Grade: ${colorize(grade, gradeColor)} | Score: ${colorize(score, gradeColor)}`);

      const pass = observatoryScanner.meetsMinimumGrade(grade, 'A');
      if (!pass) {
        console.log(colorize('⚠️  Security grade below threshold!', 'red'));
        // Could send alert here (email, Slack, etc.)
      }

      iteration++;

    } catch (error) {
      console.error(colorize(`Scan failed: ${error.message}`, 'red'));
    }
  };

  // Initial scan
  await monitor();

  // Schedule recurring scans
  setInterval(monitor, interval);
}

/**
 * Help command
 */
function showHelp() {
  console.log(`
${colorize('VERSATIL Security Scanner CLI', 'cyan')}
${colorize('━'.repeat(60), 'cyan')}

${colorize('USAGE:', 'bright')}
  node scripts/security-scan.cjs <command> [options]

${colorize('COMMANDS:', 'bright')}
  scan <url>              Full security scan with Observatory
  report <url>            Generate comprehensive security report
  fix-headers             Auto-fix security headers for your framework
  validate-csp <url>      Validate Content Security Policy
  quick-check <url>       Quick security grade check
  watch <url>             Continuous monitoring mode
  help                    Show this help message

${colorize('OPTIONS:', 'bright')}
  --rescan                Force rescan (ignore cached results)
  --hidden                Don't include scan in public results
  --minimal               Use minimal security headers (for fix-headers)
  --interval <ms>         Monitoring interval in milliseconds (for watch)

${colorize('EXAMPLES:', 'bright')}
  node scripts/security-scan.cjs scan https://example.com
  node scripts/security-scan.cjs report https://example.com --rescan
  node scripts/security-scan.cjs fix-headers --minimal
  node scripts/security-scan.cjs validate-csp https://example.com
  node scripts/security-scan.cjs quick-check https://example.com
  node scripts/security-scan.cjs watch https://example.com --interval 600000

${colorize('INTEGRATION:', 'bright')}
  ${colorize('pnpm run security:scan <url>', 'cyan')}       - Quick scan
  ${colorize('pnpm run security:report <url>', 'cyan')}     - Full report
  ${colorize('pnpm run security:fix', 'cyan')}              - Auto-fix headers
  ${colorize('pnpm run security:validate <url>', 'cyan')}   - Validate CSP

${colorize('QUALITY GATES:', 'bright')}
  Minimum grade: ${colorize('A', 'green')} (deployment blocked below this threshold)
  Score target:  ${colorize('80+/100', 'green')}
  Auto-runs:     Pre-deployment hook

${colorize('DOCUMENTATION:', 'bright')}
  docs/security/MOZILLA_OBSERVATORY.md

${colorize('━'.repeat(60), 'cyan')}
`);
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const target = args[1];

  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--rescan') options.rescan = true;
    if (args[i] === '--hidden') options.hidden = true;
    if (args[i] === '--minimal') options.minimal = true;
    if (args[i] === '--interval') options.interval = parseInt(args[++i], 10);
  }

  try {
    switch (command) {
      case 'scan':
        if (!target) throw new Error('URL required: security-scan.cjs scan <url>');
        await scanCommand(target, options);
        break;

      case 'report':
        if (!target) throw new Error('URL required: security-scan.cjs report <url>');
        await reportCommand(target, options);
        break;

      case 'fix-headers':
        await fixHeadersCommand(options);
        break;

      case 'validate-csp':
        if (!target) throw new Error('URL required: security-scan.cjs validate-csp <url>');
        await validateCspCommand(target);
        break;

      case 'quick-check':
        if (!target) throw new Error('URL required: security-scan.cjs quick-check <url>');
        await quickCheckCommand(target);
        break;

      case 'watch':
        if (!target) throw new Error('URL required: security-scan.cjs watch <url>');
        await watchCommand(target, options);
        break;

      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;

      default:
        console.error(colorize(`Unknown command: ${command}`, 'red'));
        console.log(colorize('Run "security-scan.cjs help" for usage information', 'yellow'));
        process.exit(1);
    }

  } catch (error) {
    console.error(colorize(`\n❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`\n❌ Fatal error: ${error.message}`, 'red'));
    process.exit(1);
  });
}

module.exports = {
  scanCommand,
  reportCommand,
  fixHeadersCommand,
  validateCspCommand,
  quickCheckCommand,
  watchCommand
};
