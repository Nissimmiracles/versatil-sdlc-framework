#!/usr/bin/env node

/**
 * Automated Accessibility Auditor using axe-core
 *
 * Usage:
 *   node axe-audit.js <url-or-html-file>
 *   node axe-audit.js http://localhost:3000
 *   node axe-audit.js ./build/index.html
 *
 * Output:
 *   - Console summary with violation counts
 *   - JSONL file (axe-violations.jsonl) with detailed results
 *
 * Dependencies:
 *   npm install axe-core playwright
 */

const { chromium } = require('playwright');
const axe = require('axe-core');
const fs = require('fs');
const path = require('path');

// WCAG 2.2 Rule Configuration
const AXE_CONFIG = {
  runOnly: {
    type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag22a', 'wcag22aa', 'best-practice']
  },
  resultTypes: ['violations', 'incomplete'],
  rules: {
    // WCAG 2.2 new success criteria
    'target-size': { enabled: true }, // 2.5.8 Target Size (Minimum) - 24x24px
    'focus-order-semantics': { enabled: true }, // 2.4.11 Focus Not Obscured
  }
};

// Severity Priority Mapping
const SEVERITY_PRIORITY = {
  critical: 1,
  serious: 2,
  moderate: 3,
  minor: 4
};

async function auditAccessibility(targetUrl) {
  console.log(`\n🔍 Starting accessibility audit for: ${targetUrl}\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Load target page or file
    if (targetUrl.startsWith('http')) {
      await page.goto(targetUrl, { waitUntil: 'networkidle' });
    } else {
      const filePath = path.resolve(targetUrl);
      await page.goto(`file://${filePath}`, { waitUntil: 'load' });
    }

    console.log('✅ Page loaded successfully');
    console.log('⏳ Running axe-core audit (this may take 10-30 seconds)...\n');

    // Inject axe-core and run audit
    await page.addScriptTag({ content: axe.source });
    const results = await page.evaluate((config) => {
      return new Promise((resolve) => {
        axe.run(config, (err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    }, AXE_CONFIG);

    // Process results
    const violations = results.violations;
    const incomplete = results.incomplete;

    // Sort violations by severity
    violations.sort((a, b) =>
      SEVERITY_PRIORITY[a.impact] - SEVERITY_PRIORITY[b.impact]
    );

    // Generate summary
    const summary = generateSummary(violations, incomplete);
    console.log(summary);

    // Write JSONL report
    const jsonlOutput = violations.map(v => JSON.stringify({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      wcagTags: v.tags.filter(t => t.startsWith('wcag')),
      affectedElements: v.nodes.map(n => ({
        html: n.html,
        target: n.target,
        failureSummary: n.failureSummary,
        fixes: n.any.concat(n.all).map(f => f.message)
      }))
    })).join('\n');

    const outputPath = path.resolve('axe-violations.jsonl');
    fs.writeFileSync(outputPath, jsonlOutput);
    console.log(`\n📄 Detailed report saved to: ${outputPath}`);

    // Exit code based on violations
    const criticalCount = violations.filter(v => v.impact === 'critical').length;
    const seriousCount = violations.filter(v => v.impact === 'serious').length;

    if (criticalCount > 0 || seriousCount > 0) {
      console.log('\n❌ Audit FAILED: Critical or serious violations detected');
      process.exit(1);
    } else {
      console.log('\n✅ Audit PASSED: No critical or serious violations');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ Audit failed with error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function generateSummary(violations, incomplete) {
  const bySeverity = {
    critical: violations.filter(v => v.impact === 'critical'),
    serious: violations.filter(v => v.impact === 'serious'),
    moderate: violations.filter(v => v.impact === 'moderate'),
    minor: violations.filter(v => v.impact === 'minor')
  };

  const totalElements = violations.reduce((sum, v) => sum + v.nodes.length, 0);

  let summary = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  summary += '               ACCESSIBILITY AUDIT RESULTS\n';
  summary += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  summary += `Total Violations: ${violations.length}\n`;
  summary += `Affected Elements: ${totalElements}\n`;
  summary += `Incomplete Checks: ${incomplete.length} (requires manual review)\n\n`;

  summary += '📊 By Severity:\n';
  summary += `   🔴 Critical:  ${bySeverity.critical.length} (AA blockers)\n`;
  summary += `   🟠 Serious:   ${bySeverity.serious.length} (AA compliance)\n`;
  summary += `   🟡 Moderate:  ${bySeverity.moderate.length} (AAA or UX)\n`;
  summary += `   🟢 Minor:     ${bySeverity.minor.length} (Best practices)\n\n`;

  if (bySeverity.critical.length > 0) {
    summary += '🔴 CRITICAL VIOLATIONS (must fix):\n';
    bySeverity.critical.forEach(v => {
      summary += `   • ${v.help} (${v.nodes.length} instances)\n`;
      summary += `     ${v.helpUrl}\n`;
    });
    summary += '\n';
  }

  if (bySeverity.serious.length > 0) {
    summary += '🟠 SERIOUS VIOLATIONS (high priority):\n';
    bySeverity.serious.forEach(v => {
      summary += `   • ${v.help} (${v.nodes.length} instances)\n`;
    });
    summary += '\n';
  }

  summary += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

  return summary;
}

// CLI Entry Point
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Usage: node axe-audit.js <url-or-html-file>');
  console.error('Example: node axe-audit.js http://localhost:3000');
  console.error('Example: node axe-audit.js ./build/index.html');
  process.exit(1);
}

auditAccessibility(targetUrl);
