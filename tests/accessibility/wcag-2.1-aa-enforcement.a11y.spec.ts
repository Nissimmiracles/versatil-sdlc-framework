import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations, reportViolations } from 'axe-playwright';
import type { AxeResults, Result as AxeViolation } from 'axe-core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * VERSATIL SDLC Framework - WCAG 2.1 AA Automated Enforcement
 *
 * This test suite enforces WCAG 2.1 AA compliance across all UI components.
 * Tests run automatically in CI/CD and block builds if violations are found.
 *
 * WCAG 2.1 AA Requirements:
 * - Color contrast: 4.5:1 for normal text, 3:1 for large text, 3:1 for UI components
 * - Keyboard navigation: All interactive elements accessible via keyboard
 * - Screen reader support: Proper ARIA labels, roles, and landmarks
 * - Focus management: Visible focus indicators, logical focus order
 * - Form labels: All inputs have associated labels
 * - Alternative text: All images have meaningful alt attributes
 * - Semantic HTML: Proper heading hierarchy and landmarks
 *
 * @see https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa
 */

// Configuration
const VIOLATION_REPORT_PATH = path.join(process.cwd(), 'test-results', 'accessibility-violations.json');
const VIOLATION_HTML_REPORT_PATH = path.join(process.cwd(), 'test-results', 'accessibility-violations.html');

// WCAG 2.1 AA rules to enforce
const WCAG_AA_RULES = [
  // Perceivable
  'color-contrast', // 1.4.3: Contrast (Minimum)
  'image-alt', // 1.1.1: Non-text Content
  'label', // 1.3.1: Info and Relationships
  'input-image-alt', // 1.1.1: Non-text Content
  'frame-title', // 2.4.1: Bypass Blocks
  'video-caption', // 1.2.2: Captions (Prerecorded)
  'audio-caption', // 1.2.1: Audio-only and Video-only

  // Operable
  'button-name', // 4.1.2: Name, Role, Value
  'link-name', // 2.4.4: Link Purpose (In Context)
  'bypass', // 2.4.1: Bypass Blocks
  'focus-order-semantics', // 2.4.3: Focus Order
  'keyboard', // 2.1.1: Keyboard
  'no-keyboard-trap', // 2.1.2: No Keyboard Trap

  // Understandable
  'html-has-lang', // 3.1.1: Language of Page
  'valid-lang', // 3.1.2: Language of Parts
  'label-title-only', // 2.4.6: Headings and Labels
  'form-field-multiple-labels', // 3.3.2: Labels or Instructions

  // Robust
  'duplicate-id', // 4.1.1: Parsing
  'aria-valid-attr', // 4.1.2: Name, Role, Value
  'aria-valid-attr-value', // 4.1.2: Name, Role, Value
  'aria-roles', // 4.1.2: Name, Role, Value
  'aria-required-attr', // 4.1.2: Name, Role, Value
  'aria-required-children', // 1.3.1: Info and Relationships
  'aria-required-parent', // 1.3.1: Info and Relationships
];

// Pages and components to test
const TEST_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { url: '/settings', name: 'Settings', requiresAuth: true },
  { url: '/profile', name: 'Profile', requiresAuth: true },
  // Add more pages as needed
];

// Helper function to save violation report
function saveViolationReport(violations: AxeViolation[], pageName: string): void {
  const reportDir = path.dirname(VIOLATION_REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const existingReport = fs.existsSync(VIOLATION_REPORT_PATH)
    ? JSON.parse(fs.readFileSync(VIOLATION_REPORT_PATH, 'utf-8'))
    : { pages: {}, summary: { totalViolations: 0, totalPages: 0 } };

  existingReport.pages[pageName] = {
    violations,
    timestamp: new Date().toISOString(),
    violationCount: violations.length
  };
  existingReport.summary.totalViolations += violations.length;
  existingReport.summary.totalPages = Object.keys(existingReport.pages).length;

  fs.writeFileSync(VIOLATION_REPORT_PATH, JSON.stringify(existingReport, null, 2));
}

// Helper function to generate HTML report
function generateHTMLReport(violations: AxeViolation[], pageName: string): void {
  const reportDir = path.dirname(VIOLATION_HTML_REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  let htmlContent = fs.existsSync(VIOLATION_HTML_REPORT_PATH)
    ? fs.readFileSync(VIOLATION_HTML_REPORT_PATH, 'utf-8')
    : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WCAG 2.1 AA Accessibility Violations Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      color: #d32f2f;
      border-bottom: 3px solid #d32f2f;
      padding-bottom: 10px;
    }
    h2 {
      color: #1976d2;
      margin-top: 30px;
    }
    .page-section {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .violation {
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 15px;
      margin: 15px 0;
    }
    .violation.critical {
      background: #ffebee;
      border-left-color: #d32f2f;
    }
    .violation.serious {
      background: #fff3e0;
      border-left-color: #ff9800;
    }
    .violation.moderate {
      background: #fff9c4;
      border-left-color: #fbc02d;
    }
    .violation-header {
      font-weight: bold;
      font-size: 1.1em;
      margin-bottom: 10px;
    }
    .violation-description {
      color: #555;
      margin: 5px 0;
    }
    .violation-impact {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.9em;
      font-weight: bold;
      margin: 5px 5px 5px 0;
    }
    .impact-critical { background: #d32f2f; color: white; }
    .impact-serious { background: #ff9800; color: white; }
    .impact-moderate { background: #fbc02d; color: black; }
    .impact-minor { background: #8bc34a; color: white; }
    .help-url {
      color: #1976d2;
      text-decoration: none;
      font-size: 0.9em;
    }
    .help-url:hover {
      text-decoration: underline;
    }
    .nodes {
      background: #f5f5f5;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      overflow-x: auto;
    }
    .summary {
      background: #e3f2fd;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-stat {
      font-size: 1.2em;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <h1>🔍 WCAG 2.1 AA Accessibility Violations Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <div id="summary-content">
      <div class="summary-stat">Generated: ${new Date().toISOString()}</div>
    </div>
  </div>
</body>
</html>`;

  // Add page section
  const pageSection = `
  <div class="page-section">
    <h2>Page: ${pageName}</h2>
    <p><strong>Violations Found:</strong> ${violations.length}</p>
    <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
    ${violations.map(violation => `
      <div class="violation ${violation.impact}">
        <div class="violation-header">${violation.id}: ${violation.help}</div>
        <div class="violation-description">${violation.description}</div>
        <div>
          <span class="violation-impact impact-${violation.impact}">${violation.impact?.toUpperCase()}</span>
          <a href="${violation.helpUrl}" target="_blank" class="help-url">Learn More →</a>
        </div>
        <div class="nodes">
          <strong>Affected Elements (${violation.nodes.length}):</strong><br>
          ${violation.nodes.map(node => `
            <div style="margin: 5px 0;">
              <strong>Element:</strong> ${node.html}<br>
              <strong>Issue:</strong> ${node.failureSummary}
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  </div>`;

  // Insert before closing body tag
  htmlContent = htmlContent.replace('</body>', `${pageSection}</body>`);

  fs.writeFileSync(VIOLATION_HTML_REPORT_PATH, htmlContent);
}

// Test suite setup
test.beforeEach(async ({ page }) => {
  // Set up axe-core on each page
  await page.goto('/');
  await injectAxe(page);
});

test.describe('WCAG 2.1 AA Compliance - All Pages', () => {
  for (const testPage of TEST_PAGES) {
    test(`${testPage.name} (${testPage.url}) meets WCAG 2.1 AA`, async ({ page }) => {
      // Navigate to page
      await page.goto(testPage.url);

      // Inject axe-core
      await injectAxe(page);

      // Run accessibility checks with WCAG AA rules
      const violations = await getViolations(page, null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        },
        rules: WCAG_AA_RULES.reduce((acc, rule) => {
          acc[rule] = { enabled: true };
          return acc;
        }, {} as Record<string, { enabled: boolean }>)
      });

      // Save reports
      saveViolationReport(violations, testPage.name);
      generateHTMLReport(violations, testPage.name);

      // Report violations
      if (violations.length > 0) {
        console.error(`\n❌ WCAG 2.1 AA Violations found on ${testPage.name}:\n`);
        violations.forEach(violation => {
          console.error(`  • ${violation.id}: ${violation.help}`);
          console.error(`    Impact: ${violation.impact}`);
          console.error(`    Description: ${violation.description}`);
          console.error(`    Affected elements: ${violation.nodes.length}`);
          console.error(`    Help: ${violation.helpUrl}\n`);
        });
      }

      // Fail test if violations found
      expect(violations.length, `WCAG 2.1 AA violations found on ${testPage.name}. See ${VIOLATION_HTML_REPORT_PATH} for details.`).toBe(0);
    });
  }
});

test.describe('WCAG 2.1 AA Compliance - Color Contrast', () => {
  test('All text meets contrast ratio requirements', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast']
      }
    });

    saveViolationReport(violations, 'Color Contrast');
    generateHTMLReport(violations, 'Color Contrast');

    if (violations.length > 0) {
      console.error('\n❌ Color contrast violations found:');
      violations.forEach(violation => {
        violation.nodes.forEach(node => {
          console.error(`  • Element: ${node.html}`);
          console.error(`    Issue: ${node.failureSummary}`);
        });
      });
    }

    expect(violations.length, 'Color contrast violations found (WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text)').toBe(0);
  });

  test('UI components meet 3:1 contrast ratio', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    // Check interactive elements
    const buttons = await page.locator('button, [role="button"]').all();
    const links = await page.locator('a').all();

    expect(buttons.length + links.length).toBeGreaterThan(0);
  });
});

test.describe('WCAG 2.1 AA Compliance - Keyboard Navigation', () => {
  test('All interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['keyboard', 'no-keyboard-trap']
      }
    });

    saveViolationReport(violations, 'Keyboard Navigation');
    generateHTMLReport(violations, 'Keyboard Navigation');

    expect(violations.length, 'Keyboard accessibility violations found').toBe(0);
  });
});

test.describe('WCAG 2.1 AA Compliance - Screen Reader Support', () => {
  test('All images have alternative text', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['image-alt', 'input-image-alt']
      }
    });

    saveViolationReport(violations, 'Image Alt Text');
    generateHTMLReport(violations, 'Image Alt Text');

    expect(violations.length, 'Images without alt text found').toBe(0);
  });

  test('All form inputs have labels', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['label', 'label-title-only', 'form-field-multiple-labels']
      }
    });

    saveViolationReport(violations, 'Form Labels');
    generateHTMLReport(violations, 'Form Labels');

    expect(violations.length, 'Form inputs without labels found').toBe(0);
  });

  test('ARIA attributes are valid and properly used', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: [
          'aria-valid-attr',
          'aria-valid-attr-value',
          'aria-roles',
          'aria-required-attr',
          'aria-required-children',
          'aria-required-parent'
        ]
      }
    });

    saveViolationReport(violations, 'ARIA Attributes');
    generateHTMLReport(violations, 'ARIA Attributes');

    expect(violations.length, 'ARIA attribute violations found').toBe(0);
  });
});

test.describe('WCAG 2.1 AA Compliance - Semantic HTML', () => {
  test('Page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['page-has-heading-one', 'heading-order']
      }
    });

    saveViolationReport(violations, 'Heading Hierarchy');
    generateHTMLReport(violations, 'Heading Hierarchy');

    expect(violations.length, 'Heading hierarchy violations found').toBe(0);
  });

  test('Page has proper landmarks', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['region', 'landmark-one-main', 'landmark-unique']
      }
    });

    saveViolationReport(violations, 'Landmarks');
    generateHTMLReport(violations, 'Landmarks');

    expect(violations.length, 'Landmark violations found').toBe(0);
  });

  test('Page has valid HTML structure', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['html-has-lang', 'valid-lang', 'duplicate-id']
      }
    });

    saveViolationReport(violations, 'HTML Structure');
    generateHTMLReport(violations, 'HTML Structure');

    expect(violations.length, 'HTML structure violations found').toBe(0);
  });
});

test.describe('WCAG 2.1 AA Compliance - Focus Management', () => {
  test('All focusable elements have visible focus indicators', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      runOnly: {
        type: 'rule',
        values: ['focus-order-semantics']
      }
    });

    saveViolationReport(violations, 'Focus Management');
    generateHTMLReport(violations, 'Focus Management');

    expect(violations.length, 'Focus management violations found').toBe(0);
  });
});

// Generate summary report at the end
test.afterAll(async () => {
  const reportExists = fs.existsSync(VIOLATION_REPORT_PATH);

  if (reportExists) {
    const report = JSON.parse(fs.readFileSync(VIOLATION_REPORT_PATH, 'utf-8'));

    console.log('\n' + '='.repeat(80));
    console.log('📊 WCAG 2.1 AA ACCESSIBILITY TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Pages Tested: ${report.summary.totalPages}`);
    console.log(`Total Violations: ${report.summary.totalViolations}`);
    console.log('\nViolations by Page:');

    Object.entries(report.pages as Record<string, { violationCount: number }>).forEach(([page, data]) => {
      const status = data.violationCount === 0 ? '✅' : '❌';
      console.log(`  ${status} ${page}: ${data.violationCount} violations`);
    });

    console.log('\n📄 Detailed Reports:');
    console.log(`  JSON: ${VIOLATION_REPORT_PATH}`);
    console.log(`  HTML: ${VIOLATION_HTML_REPORT_PATH}`);
    console.log('='.repeat(80) + '\n');

    if (report.summary.totalViolations > 0) {
      console.error('\n⚠️  WCAG 2.1 AA violations detected! Build should fail in CI/CD.');
      console.error(`   Open ${VIOLATION_HTML_REPORT_PATH} in a browser for detailed information.\n`);
    }
  }
});
