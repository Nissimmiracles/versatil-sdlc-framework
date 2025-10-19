# Percy Visual Regression Testing

**VERSATIL Framework Integration Guide**

Percy (by BrowserStack) provides automated visual regression testing to catch UI changes that traditional tests miss. This guide covers the complete Percy integration with the VERSATIL Framework.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup & Configuration](#setup--configuration)
3. [Writing Visual Tests](#writing-visual-tests)
4. [Running Tests](#running-tests)
5. [CI/CD Integration](#cicd-integration)
6. [Maria-QA Integration](#maria-qa-integration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)
9. [Percy Dashboard](#percy-dashboard)
10. [Advanced Usage](#advanced-usage)

---

## Overview

### What is Percy?

Percy is a visual regression testing platform that:
- **Captures snapshots** of your UI at different breakpoints
- **Compares snapshots** across commits to detect visual changes
- **Highlights differences** with pixel-perfect precision
- **Integrates with CI/CD** for automated visual testing
- **Provides approval workflow** for visual changes

### Why Percy for VERSATIL?

1. **Catch UI Regressions**: Traditional tests miss visual bugs (CSS changes, layout shifts, font issues)
2. **Responsive Testing**: Test all breakpoints (mobile, tablet, desktop) automatically
3. **Theme Testing**: Validate light/dark themes and accessibility
4. **Maria-QA Integration**: Auto-trigger Percy on component changes
5. **Quality Gates**: Block PRs with visual regressions

### Percy Free Tier

- **5,000 snapshots/month** (sufficient for most projects)
- **Unlimited team members**
- **7-day snapshot retention**
- **Parallel test execution**
- **GitHub integration**

---

## Setup & Configuration

### 1. Percy Account Setup

```bash
# Sign up at percy.io
# Create new project: "VERSATIL SDLC Framework"
# Get Percy token from project settings
```

### 2. Environment Variables

Add to `~/.versatil/.env` (framework isolation):

```bash
# Percy Configuration
PERCY_TOKEN=your_percy_token_here
PERCY_BRANCH=main  # Auto-detected in CI
```

**Security**: Never commit `PERCY_TOKEN` to git. Store in `~/.versatil/.env` only.

### 3. Install Dependencies

Percy dependencies are already in `package.json`:

```json
{
  "devDependencies": {
    "@percy/cli": "^1.31.4",
    "@percy/playwright": "^1.0.9"
  }
}
```

```bash
npm install
```

### 4. Percy Configuration

File: `.percy.yml` (already configured)

```yaml
version: 2

snapshot:
  widths:
    - 320   # Mobile
    - 768   # Tablet
    - 1024  # Desktop
    - 1920  # Desktop Large

  enable-javascript: true

  percy-css: |
    /* Hide dynamic content */
    [data-testid="timestamp"],
    .loading {
      visibility: hidden !important;
    }

comparison:
  threshold: 0.01  # 1% difference threshold
```

**Key Settings**:
- `widths`: Responsive breakpoints to test
- `enable-javascript`: Required for React/Vue components
- `percy-css`: Hide dynamic content (timestamps, animations)
- `threshold`: Pixel difference tolerance (0.01 = 1%)

---

## Writing Visual Tests

### Percy Helper Utilities

File: `tests/utils/percy-helpers.ts`

```typescript
import { createPercyHelper } from '../utils/percy-helpers.js';

test('Button Component - Visual Test', async ({ page }) => {
  const percy = createPercyHelper(page);

  await page.goto('http://localhost:3000/components/button');
  await percy.waitForSnapshotReady(); // Wait for images/fonts

  // Simple snapshot
  await percy.snapshot('Button - Default');

  // Responsive snapshot (all breakpoints)
  await percy.snapshotResponsive('Button - Responsive');

  // Theme snapshot (light + dark)
  await percy.snapshotThemes('Button - Themes');

  // State snapshot (hover, focus, disabled)
  await percy.snapshotStates('Button', '[data-testid="button"]', [
    'default', 'hover', 'focus', 'disabled'
  ]);
});
```

### Available Helper Methods

| Method | Description | Example |
|--------|-------------|---------|
| `snapshot()` | Basic snapshot | `percy.snapshot('Homepage')` |
| `snapshotResponsive()` | All breakpoints | `percy.snapshotResponsive('Homepage')` |
| `snapshotThemes()` | Light + dark themes | `percy.snapshotThemes('Homepage')` |
| `snapshotStates()` | Component states | `percy.snapshotStates('Button', selector, ['hover'])` |
| `snapshotAtViewport()` | Specific viewport | `percy.snapshotAtViewport('Modal', 375, 667)` |
| `snapshotComponent()` | Scoped snapshot | `percy.snapshotComponent('Card', selector)` |
| `freezeAnimations()` | Stop animations | `percy.freezeAnimations()` |
| `waitForSnapshotReady()` | Wait for images/fonts | `percy.waitForSnapshotReady()` |

### Component Visual Tests

File: `tests/visual/component-visual-regression.spec.ts`

```typescript
import { test } from '@playwright/test';
import { createPercyHelper } from '../utils/percy-helpers.js';

test.describe('Button Components', () => {
  test('All Button States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/button');
    await percy.waitForSnapshotReady();

    // Test all states
    const states = ['default', 'hover', 'focus', 'active', 'disabled'];
    await percy.snapshotStates('Primary Button', '[data-testid="btn-primary"]', states);
  });

  test('Button Themes', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/button');
    await percy.snapshotThemes('Button Themes');
  });
});
```

### Responsive Visual Tests

File: `tests/visual/responsive-visual-regression.spec.ts`

```typescript
test('Homepage - All Breakpoints', async ({ page }) => {
  const percy = createPercyHelper(page);

  await page.goto('http://localhost:3000');
  await percy.waitForSnapshotReady();

  // Test all responsive breakpoints
  await percy.snapshotResponsive('Homepage');
});

test('Dashboard - Mobile Menu', async ({ page }) => {
  const percy = createPercyHelper(page);

  await page.goto('http://localhost:3000/dashboard');

  // Mobile view
  await percy.snapshotAtViewport('Dashboard - Mobile', 375, 667);

  // Tablet view
  await percy.snapshotAtViewport('Dashboard - Tablet', 768, 1024);

  // Desktop view
  await percy.snapshotAtViewport('Dashboard - Desktop', 1920, 1080);
});
```

---

## Running Tests

### Local Development

```bash
# Run all Percy visual tests
npm run test:visual:percy

# Run component tests only
npm run test:visual:percy:components

# Run responsive tests only
npm run test:visual:percy:responsive

# Dry run (no snapshots uploaded)
npm run test:visual:percy:dry-run
```

### First Run (Baseline Creation)

```bash
# Set Percy token
export PERCY_TOKEN=your_token_here

# Run tests to create baseline
npm run test:visual:percy
```

**Output**:
```
[percy] Percy has started!
[percy] Build created: https://percy.io/your-org/project/builds/123
[percy] Snapshot uploaded: Button - Default
[percy] Snapshot uploaded: Homepage - Responsive
[percy] Build finished! https://percy.io/your-org/project/builds/123
```

### Subsequent Runs (Comparison)

```bash
npm run test:visual:percy
```

Percy will:
1. Capture new snapshots
2. Compare with baseline
3. Highlight visual differences
4. Show results in Percy dashboard

---

## CI/CD Integration

### GitHub Actions

File: `.github/workflows/quality-gates.yml`

```yaml
visual-regression:
  name: Visual Regression Tests (Percy)
  runs-on: ubuntu-latest

  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Install Playwright browsers
      run: npx playwright install --with-deps chromium

    - name: Run Percy visual regression tests
      env:
        PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        PERCY_BRANCH: ${{ github.head_ref || github.ref_name }}
        PERCY_PULL_REQUEST: ${{ github.event.pull_request.number }}
      run: npm run test:visual:percy
```

### GitHub Secrets Setup

1. Go to GitHub repo settings
2. Navigate to **Secrets and variables** > **Actions**
3. Add new secret:
   - Name: `PERCY_TOKEN`
   - Value: Your Percy token from percy.io

### Percy Status Checks

Percy automatically posts status checks to GitHub:
- **Build Created**: Percy build started
- **Build Uploading**: Snapshots being uploaded
- **Build Processing**: Comparing snapshots
- **Build Approved**: All changes approved
- **Build Failed**: Unapproved visual changes detected

### PR Comments

Percy bot automatically comments on PRs:

```
📸 Percy Visual Regression Results

Visual snapshots have been captured for this PR.

🔍 View Percy Build

Percy detected 3 visual changes:
- Button - Hover State: 2% difference
- Homepage - Mobile: 1.5% difference
- Modal - Dark Theme: 0.5% difference

Review the snapshots on Percy dashboard before merging.
```

---

## Maria-QA Integration

Maria-QA automatically triggers Percy snapshots on UI component changes.

### Auto-Trigger Logic

File: `src/agents/opera/maria-qa/enhanced-maria.ts`

```typescript
async activateWithVisualTesting(context: AgentActivationContext) {
  const response = await this.activate(context);

  // Check if Percy snapshot should be triggered
  const percyTriggered = await this.triggerPercySnapshot(context);

  if (percyTriggered) {
    response.suggestions.push({
      type: 'visual-regression',
      message: 'UI component changed. Run Percy visual regression.',
      priority: 'medium',
      action: 'npm run test:visual:percy:components'
    });
  }

  return response;
}
```

### Trigger Conditions

Maria-QA triggers Percy when:
- **Component files** changed: `*.tsx`, `*.jsx`, `*.vue`, `*.svelte`
- **Component directories**: `/components/`, `/ui/`, `/views/`, `/pages/`
- **Global styles** changed: `global.css`, theme files

### Manual Trigger

```bash
# Trigger Percy for specific component
npm run test:visual:percy:components

# Trigger Percy for responsive layouts
npm run test:visual:percy:responsive
```

---

## Best Practices

### 1. Snapshot Naming

**Good Names** (descriptive and unique):
```typescript
await percy.snapshot('Homepage - Hero Section');
await percy.snapshot('Button - Primary - Hover State');
await percy.snapshot('Dashboard - Sidebar Collapsed');
```

**Bad Names** (vague or duplicate):
```typescript
await percy.snapshot('Test 1');
await percy.snapshot('Homepage'); // Too generic
await percy.snapshot('Button'); // Duplicate possible
```

### 2. Hide Dynamic Content

**Problem**: Timestamps, random IDs, live data cause false positives.

**Solution 1**: Use Percy CSS (`.percy.yml`)
```yaml
percy-css: |
  [data-testid="timestamp"],
  .loading-spinner {
    visibility: hidden !important;
  }
```

**Solution 2**: Use helper method
```typescript
await percy.hideElements([
  '[data-testid="timestamp"]',
  '.random-id',
  '.live-update'
]);
```

**Solution 3**: Add `data-percy-ignore` attribute
```html
<div data-percy-ignore>
  Last updated: {timestamp}
</div>
```

### 3. Freeze Animations

**Problem**: Animations mid-frame cause inconsistent snapshots.

**Solution**:
```typescript
await percy.freezeAnimations(); // Stop all animations
await percy.snapshot('Modal - Animated');
```

### 4. Wait for Stability

**Problem**: Images/fonts loading causes snapshot differences.

**Solution**:
```typescript
await percy.waitForSnapshotReady(); // Waits for:
// - Network idle
// - Images loaded
// - Fonts loaded
```

### 5. Snapshot Scope

**Problem**: Full-page snapshots are slow and expensive.

**Solution**: Scope to component
```typescript
// Good: Scoped to component
await percy.snapshotComponent('Card Component', '[data-testid="card"]');

// Bad: Full page when only testing card
await percy.snapshot('Page with Card');
```

### 6. Responsive Testing

**Test all breakpoints**:
```typescript
await percy.snapshotResponsive('Homepage'); // Tests:
// - 320px (mobile)
// - 768px (tablet)
// - 1024px (desktop)
// - 1920px (desktop large)
```

### 7. Theme Testing

**Test light and dark themes**:
```typescript
await percy.snapshotThemes('Dashboard'); // Tests:
// - Dashboard - Light
// - Dashboard - Dark
```

---

## Troubleshooting

### Issue: Percy Token Not Found

**Error**:
```
Error: PERCY_TOKEN was not provided
```

**Solution**:
```bash
# Add token to ~/.versatil/.env
echo "PERCY_TOKEN=your_token_here" >> ~/.versatil/.env

# Or export temporarily
export PERCY_TOKEN=your_token_here
```

### Issue: Snapshot Differences Every Run

**Cause**: Dynamic content (timestamps, random IDs, animations)

**Solution 1**: Hide dynamic elements
```typescript
await percy.hideElements(['.timestamp', '.random-id']);
```

**Solution 2**: Freeze animations
```typescript
await percy.freezeAnimations();
```

**Solution 3**: Wait for stability
```typescript
await percy.waitForSnapshotReady();
```

### Issue: Slow Snapshot Uploads

**Cause**: Too many snapshots or large viewport sizes

**Solution 1**: Reduce viewport sizes
```typescript
// Instead of 4K resolution
await percy.snapshotAtViewport('Page', 3840, 2160); // ❌ Slow

// Use standard desktop
await percy.snapshotAtViewport('Page', 1920, 1080); // ✅ Faster
```

**Solution 2**: Scope snapshots
```typescript
// Instead of full page
await percy.snapshot('Full Page'); // ❌ Slow

// Scope to component
await percy.snapshotComponent('Header', 'header'); // ✅ Faster
```

### Issue: Percy Build Failed

**Error**:
```
Percy build failed with status: failed
```

**Check**:
1. Percy dashboard for error details
2. Network connectivity
3. Percy service status: https://status.percy.io

### Issue: Playwright Timeout

**Error**:
```
Test timeout of 30000ms exceeded
```

**Solution**:
```typescript
test('Slow page', async ({ page }) => {
  test.setTimeout(60000); // Increase timeout to 60s

  const percy = createPercyHelper(page);
  await page.goto('http://localhost:3000/slow-page');
  await percy.waitForSnapshotReady();
  await percy.snapshot('Slow Page');
});
```

---

## Percy Dashboard

### Accessing Dashboard

```
https://percy.io/your-org/versatil-sdlc-framework
```

### Dashboard Features

1. **Build Overview**
   - Build status (pending, processing, approved, failed)
   - Snapshot count
   - Visual changes detected
   - Approvals needed

2. **Snapshot Comparison**
   - Side-by-side comparison
   - Diff highlighting
   - Zoom and pan
   - Responsive width selector

3. **Approval Workflow**
   - Approve all changes
   - Approve individual snapshots
   - Reject and request changes
   - Leave comments

4. **Build History**
   - Past builds
   - Baseline snapshots
   - Change timeline
   - Performance metrics

### Approving Changes

**Scenario**: You intentionally changed button color.

**Steps**:
1. Go to Percy build for your PR
2. Review snapshot: "Button - Primary"
3. See color change highlighted
4. Click **"Approve"**
5. Percy updates status check on GitHub
6. PR can now be merged

### Requesting Changes

**Scenario**: Unintended layout shift detected.

**Steps**:
1. Review snapshot: "Homepage - Mobile"
2. See layout shift (not intended)
3. Click **"Request changes"**
4. Add comment: "Layout shift detected, please fix"
5. Percy fails status check
6. Developer fixes issue and pushes new commit

---

## Advanced Usage

### Percy CLI Commands

```bash
# Create build manually
npx percy build:create

# Upload snapshots
npx percy upload snapshots/

# Finalize build
npx percy build:finalize

# Check build status
npx percy build:status <build-id>
```

### Percy API Integration

```typescript
import axios from 'axios';

async function getPercyBuild(buildId: string) {
  const response = await axios.get(
    `https://percy.io/api/v1/builds/${buildId}`,
    {
      headers: {
        Authorization: `Token ${process.env.PERCY_TOKEN}`
      }
    }
  );
  return response.data;
}
```

### Parallel Test Execution

Percy supports parallel test execution in CI/CD:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]

steps:
  - name: Run Percy tests
    env:
      PERCY_PARALLEL_TOTAL: 4
      PERCY_PARALLEL_NONCE: ${{ github.run_id }}
    run: npm run test:visual:percy -- --shard=${{ matrix.shard }}/4
```

### Custom Widths

```typescript
// Override default widths
await percy.snapshot('Custom Widths', {
  widths: [414, 768, 1440] // iPhone Pro, iPad, MacBook
});
```

### Percy CSS Injection

```typescript
// Inject custom CSS for this snapshot
await percy.snapshot('Modal', {
  percyCSS: `
    .modal-overlay {
      background: rgba(0, 0, 0, 0.5) !important;
    }
  `
});
```

---

## Snapshot Budget

Percy free tier: **5,000 snapshots/month**

### Estimate Snapshot Usage

```typescript
// Component tests: ~50 components × 5 states = 250 snapshots
await percy.snapshotStates('Button', selector, ['default', 'hover', 'focus', 'active', 'disabled']);

// Responsive tests: ~20 pages × 4 breakpoints = 80 snapshots
await percy.snapshotResponsive('Homepage');

// Theme tests: ~30 pages × 2 themes = 60 snapshots
await percy.snapshotThemes('Dashboard');

// Total: 250 + 80 + 60 = 390 snapshots per run
// Budget: 5,000 / 390 = ~12 runs per month
```

### Optimize Snapshot Usage

1. **Selective Testing**: Only test changed components
2. **Scoped Snapshots**: Use `snapshotComponent()` instead of full page
3. **Conditional Runs**: Skip Percy on draft PRs
4. **Batch Changes**: Combine related changes in one PR

---

## Percy + Accessibility

Percy includes basic accessibility checks (contrast, font size).

For comprehensive accessibility testing, use:
- **WCAG 2.1 AA tests**: `npm run test:accessibility`
- **axe-core integration**: `tests/accessibility/wcag-2.1-aa-enforcement.a11y.spec.ts`

---

## Resources

- **Percy Documentation**: https://www.percy.io/docs
- **Playwright Integration**: https://www.percy.io/docs/end-to-end/playwright
- **Percy CLI**: https://github.com/percy/cli
- **VERSATIL Percy Helpers**: `tests/utils/percy-helpers.ts`
- **Percy Configuration**: `.percy.yml`

---

## Support

### VERSATIL Framework Issues

- GitHub Issues: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Discussion: Tag `@maria-qa` or `visual-regression`

### Percy Issues

- Percy Support: https://www.percy.io/support
- Percy Status: https://status.percy.io
- Percy Community: https://www.percy.io/community

---

**Last Updated**: 2025-10-19
**VERSATIL Version**: v6.4.0
**Percy Integration**: Phase 3 (Task 3.2)
