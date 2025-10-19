# WCAG 2.1 AA Accessibility Testing

This directory contains automated accessibility tests that enforce WCAG 2.1 AA compliance across all UI components in the VERSATIL SDLC Framework.

## Overview

The accessibility test suite validates:
- ✅ Color contrast ratios (4.5:1 for text, 3:1 for UI components)
- ✅ Keyboard navigation (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys)
- ✅ Screen reader support (ARIA labels, roles, landmarks)
- ✅ Focus management (visible indicators, logical order, trap handling)
- ✅ Form labels and input associations
- ✅ Alternative text for images
- ✅ Semantic HTML structure and heading hierarchy

## Test Files

### 1. `wcag-2.1-aa-enforcement.a11y.spec.ts`
Comprehensive WCAG 2.1 AA compliance tests using axe-core:
- Tests all pages and components
- Enforces WCAG AA rules
- Generates detailed violation reports (JSON + HTML)
- Fails build if violations found
- ~400 lines

**Test Categories:**
- Color contrast validation
- Keyboard accessibility
- Screen reader support
- Semantic HTML structure
- Focus management

### 2. `keyboard-navigation.a11y.spec.ts`
Keyboard navigation accessibility tests:
- Tab order validation
- Keyboard trap detection
- Button/link activation (Enter/Space)
- Arrow key navigation in menus/lists
- Escape key functionality (modals, dropdowns)
- Focus visibility and restoration
- ~300 lines

### 3. `accessibility-compliance.a11y.ts`
Legacy accessibility tests (basic checks):
- Page structure validation
- Form accessibility
- Basic keyboard navigation
- Visual accessibility
- Screen reader compatibility
- ~100 lines

## Running Tests

### Local Testing

```bash
# Full test suite with HTML report (recommended)
npm run test:accessibility

# Quick accessibility checks
npm run test:accessibility:quick

# Keyboard navigation tests only
npm run test:accessibility:keyboard

# WCAG 2.1 AA enforcement tests only
npm run test:accessibility:wcag

# Using script directly
./scripts/run-accessibility-tests.sh --full --report
```

### CI/CD Testing

Tests run automatically in CI/CD via `.github/workflows/quality-gates.yml`:
- On every pull request
- On push to main/develop branches
- Violations block the build
- Detailed reports uploaded as artifacts

```bash
# CI mode (no browser opening)
npm run test:accessibility:ci
```

## Test Reports

### JSON Report
Location: `test-results/accessibility-violations.json`

Contains:
- All violations with details
- Affected elements
- Impact levels (critical, serious, moderate, minor)
- WCAG reference links
- Summary statistics

### HTML Report
Location: `test-results/accessibility-violations.html`

Interactive report with:
- Color-coded violations by severity
- Expandable violation details
- Direct links to WCAG documentation
- Affected HTML elements
- Failure summaries

### Playwright Report
Location: `playwright-report/index.html`

Standard Playwright test report with:
- Test execution details
- Screenshots on failure
- Trace files
- Test timing

## Understanding Violations

### Impact Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Severe issue blocking users | Fix immediately |
| **Serious** | Major barrier for users | Fix before release |
| **Moderate** | Noticeable difficulty | Fix in next sprint |
| **Minor** | Small inconvenience | Fix when possible |

### Common Violations

#### 1. Color Contrast
**Issue**: Text doesn't meet 4.5:1 ratio
```html
<!-- ❌ Bad -->
<p style="color: #777; background: #fff;">Low contrast text</p>

<!-- ✅ Good -->
<p style="color: #333; background: #fff;">High contrast text</p>
```

#### 2. Missing Alt Text
**Issue**: Images without alternative text
```html
<!-- ❌ Bad -->
<img src="logo.png">

<!-- ✅ Good -->
<img src="logo.png" alt="Company Logo">
```

#### 3. Form Labels
**Issue**: Inputs without labels
```html
<!-- ❌ Bad -->
<input type="text" name="email">

<!-- ✅ Good -->
<label for="email">Email</label>
<input type="text" id="email" name="email">
```

#### 4. Button Names
**Issue**: Buttons without accessible names
```html
<!-- ❌ Bad -->
<button><i class="icon-close"></i></button>

<!-- ✅ Good -->
<button aria-label="Close dialog">
  <i class="icon-close"></i>
</button>
```

#### 5. Keyboard Trap
**Issue**: Focus can't escape element
```javascript
// ❌ Bad: Modal traps focus permanently
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault(); // Blocks all tab navigation
  }
});

// ✅ Good: Modal traps focus but allows escape
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal(); // Allow escape
  }
  if (e.key === 'Tab') {
    // Trap focus within modal only
    cycleFocusWithinModal(e);
  }
});
```

## WCAG 2.1 AA Standards

### Level A (Basic)
All content must meet these requirements:
- 1.1.1: Non-text Content (alt text)
- 2.1.1: Keyboard accessibility
- 3.1.1: Language of page

### Level AA (Enhanced)
Additional requirements for better accessibility:
- 1.4.3: Contrast (Minimum) - 4.5:1 for text
- 2.4.7: Focus Visible
- 3.2.3: Consistent Navigation
- 4.1.2: Name, Role, Value

Full standard: https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa

## Tools Used

### axe-core
Industry-standard accessibility testing engine:
- 50+ WCAG rules
- High accuracy (low false positives)
- Detailed violation reporting
- https://github.com/dequelabs/axe-core

### axe-playwright
Playwright integration for axe-core:
- Seamless browser testing
- Automatic rule configuration
- Multiple output formats
- https://github.com/abhinaba-ghosh/axe-playwright

### Playwright
Modern browser automation:
- Cross-browser testing
- Keyboard simulation
- Focus management validation
- https://playwright.dev

## Configuration

### Playwright Config
File: `playwright.config.ts`

Accessibility project configuration:
```typescript
{
  name: 'accessibility',
  use: {
    ...devices['Desktop Chrome']
  },
  testMatch: [
    '**/accessibility/**/*.{test,spec}.{ts,js}',
    '**/*.a11y.{ts,js}'
  ]
}
```

### WCAG Rules
File: `wcag-2.1-aa-enforcement.a11y.spec.ts`

Rules enforced:
- Color contrast (1.4.3)
- Keyboard accessibility (2.1.1, 2.1.2)
- Focus management (2.4.3, 2.4.7)
- Form labels (1.3.1, 3.3.2)
- ARIA attributes (4.1.2)
- Semantic HTML (1.3.1, 2.4.6)
- And more...

## Troubleshooting

### Tests Fail Locally
1. Check if Playwright browsers are installed:
   ```bash
   npx playwright install chromium
   ```

2. Verify dependencies are up to date:
   ```bash
   npm install
   ```

3. Check for existing violations:
   ```bash
   npm run test:accessibility:wcag
   ```

### CI/CD Failures
1. Check artifacts for detailed reports:
   - Go to GitHub Actions run
   - Download `accessibility-violations-*` artifact
   - Open HTML report

2. Review PR comment for summary

3. Fix violations locally and push

### Script Permissions
If script doesn't run:
```bash
chmod +x scripts/run-accessibility-tests.sh
```

## Best Practices

### 1. Test Early and Often
Run accessibility tests during development:
```bash
npm run test:accessibility:quick
```

### 2. Fix Critical Issues First
Focus on critical/serious violations before moderate/minor.

### 3. Use HTML Reports
Visual reports make it easier to understand issues:
```bash
npm run test:accessibility  # Auto-opens HTML report
```

### 4. Test Real User Flows
Add pages to `TEST_PAGES` array in `wcag-2.1-aa-enforcement.a11y.spec.ts`:
```typescript
const TEST_PAGES = [
  { url: '/', name: 'Homepage' },
  { url: '/dashboard', name: 'Dashboard', requiresAuth: true },
  { url: '/new-page', name: 'New Page' },  // Add your page
];
```

### 5. Document Exceptions
If a violation can't be fixed immediately, document why:
```typescript
test('Exception: Legacy component', async ({ page }) => {
  // TODO: Fix legacy component in v2.0
  // Issue: https://github.com/org/repo/issues/123
  test.skip(true, 'Known legacy issue');
});
```

## Resources

### WCAG Documentation
- [Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Techniques](https://www.w3.org/WAI/WCAG21/Techniques/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome audit tool

### Learning Resources
- [WebAIM](https://webaim.org/) - Accessibility tutorials
- [A11y Project](https://www.a11yproject.com/) - Accessibility checklist
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - Technical guides

## Support

For questions or issues with accessibility testing:
1. Check this README
2. Review violation reports
3. Consult WCAG documentation
4. Open an issue on GitHub

## Version History

- **v1.0.0** (2025-10-19):
  - Initial WCAG 2.1 AA enforcement suite
  - Comprehensive keyboard navigation tests
  - CI/CD integration
  - Local testing script
  - HTML + JSON reporting
