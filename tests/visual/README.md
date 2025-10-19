# Visual Regression Tests

**Percy Visual Regression Testing for VERSATIL Framework**

This directory contains Percy-powered visual regression tests for UI components and responsive layouts.

---

## Quick Start

```bash
# Install dependencies (if not already)
npm install

# Set Percy token (get from percy.io)
export PERCY_TOKEN=your_percy_token_here

# Run all Percy visual tests
npm run test:visual:percy

# Run component tests only
npm run test:visual:percy:components

# Run responsive tests only
npm run test:visual:percy:responsive
```

---

## Test Files

### 1. Component Visual Regression
**File**: `component-visual-regression.spec.ts`

Tests critical UI components in various states:
- Buttons (primary, secondary, icon)
- Forms (inputs, textareas, selects, checkboxes, radios)
- Cards (default, with image, with actions)
- Modals (light/dark themes, responsive)
- Navigation (default, active, dropdown)
- Toasts/Alerts (success, error, warning, info)
- Loading states (spinners, skeletons, progress bars)
- Tables (default, sorted, selected row)
- Tooltips (top, bottom, left, right)
- Badges, Pagination, Avatars, Accordions, Tabs, Breadcrumbs

**Snapshots**: ~250 per run

### 2. Responsive Visual Regression
**File**: `responsive-visual-regression.spec.ts`

Tests page layouts at different breakpoints:
- Homepage (all breakpoints, light/dark themes)
- Dashboard (desktop, tablet, mobile, sidebar states)
- Grid layouts (4-column, 3-column, 2-column, 1-column)
- Forms (side-by-side → stacked → full-width)
- Navigation (full → condensed → hamburger menu)
- Data tables (full → horizontal scroll → card layout)
- Product grids, footers, hero sections, pricing pages

**Snapshots**: ~80 per run

---

## Responsive Breakpoints

Tests run at these widths (configured in `.percy.yml`):

| Width | Device | Description |
|-------|--------|-------------|
| 320px | Mobile (small) | iPhone SE |
| 375px | Mobile (iPhone) | iPhone 12/13/14 |
| 768px | Tablet | iPad |
| 1024px | Desktop (small) | Laptop |
| 1366px | Desktop (medium) | MacBook Air |
| 1920px | Desktop (large) | Full HD |

---

## Helper Utilities

**File**: `../utils/percy-helpers.ts`

### Quick Snapshot
```typescript
import { quickSnapshot } from '../utils/percy-helpers.js';

await quickSnapshot(page, 'Homepage');
```

### Responsive Snapshot
```typescript
import { quickResponsiveSnapshot } from '../utils/percy-helpers.js';

await quickResponsiveSnapshot(page, 'Homepage');
// Captures at: 320px, 768px, 1024px, 1920px
```

### Theme Snapshot
```typescript
import { quickThemeSnapshot } from '../utils/percy-helpers.js';

await quickThemeSnapshot(page, 'Dashboard');
// Captures: Dashboard - Light, Dashboard - Dark
```

### Advanced Usage
```typescript
import { createPercyHelper } from '../utils/percy-helpers.js';

const percy = createPercyHelper(page);

// Wait for page to be ready
await percy.waitForSnapshotReady();

// Freeze animations
await percy.freezeAnimations();

// Hide dynamic content
await percy.hideElements(['.timestamp', '.loading']);

// Snapshot component states
await percy.snapshotStates('Button', '[data-testid="button"]', [
  'default', 'hover', 'focus', 'disabled'
]);

// Snapshot at specific viewport
await percy.snapshotAtViewport('Modal', 375, 667);
```

---

## Writing New Visual Tests

### Example: New Component Test

```typescript
import { test } from '@playwright/test';
import { createPercyHelper } from '../utils/percy-helpers.js';

test.describe('New Component Visual Tests', () => {
  test('Component States', async ({ page }) => {
    const percy = createPercyHelper(page);

    // Navigate to component
    await page.goto('http://localhost:3000/components/my-component');
    await percy.waitForSnapshotReady();

    // Snapshot all states
    await percy.snapshotStates(
      'My Component',
      '[data-testid="my-component"]',
      ['default', 'hover', 'focus', 'disabled', 'error']
    );
  });

  test('Responsive Behavior', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/my-component');
    await percy.snapshotResponsive('My Component - Responsive');
  });

  test('Theme Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/my-component');
    await percy.snapshotThemes('My Component - Themes');
  });
});
```

---

## Best Practices

### 1. Descriptive Snapshot Names
```typescript
// Good ✅
await percy.snapshot('Homepage - Hero Section');
await percy.snapshot('Button - Primary - Hover State');

// Bad ❌
await percy.snapshot('Test 1');
await percy.snapshot('Button');
```

### 2. Hide Dynamic Content
```typescript
// Method 1: Percy CSS (global, in .percy.yml)
percy-css: |
  [data-testid="timestamp"] {
    visibility: hidden !important;
  }

// Method 2: Helper method (per test)
await percy.hideElements(['.timestamp', '.random-id']);

// Method 3: HTML attribute (in component)
<div data-percy-ignore>Dynamic content</div>
```

### 3. Wait for Stability
```typescript
// Wait for images, fonts, network idle
await percy.waitForSnapshotReady();

// Freeze animations for consistent snapshots
await percy.freezeAnimations();
```

### 4. Scope Snapshots
```typescript
// Good ✅ - Scoped to component
await percy.snapshotComponent('Card', '[data-testid="card"]');

// Bad ❌ - Full page when only testing card
await percy.snapshot('Page with Card');
```

---

## CI/CD Integration

Percy runs automatically in GitHub Actions:

```yaml
# .github/workflows/quality-gates.yml
visual-regression:
  runs-on: ubuntu-latest
  steps:
    - name: Run Percy visual regression tests
      env:
        PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
      run: npm run test:visual:percy
```

### GitHub Secrets

Add `PERCY_TOKEN` to GitHub repo secrets:
1. GitHub repo → Settings → Secrets → Actions
2. Add new secret: `PERCY_TOKEN`
3. Value: Your Percy token from percy.io

---

## Percy Dashboard

View visual regression results:
```
https://percy.io/your-org/versatil-sdlc-framework
```

### Workflow
1. **Developer**: Pushes PR with UI changes
2. **CI/CD**: Runs Percy tests automatically
3. **Percy**: Captures snapshots, compares with baseline
4. **Percy Bot**: Comments on PR with results
5. **Reviewer**: Reviews visual changes on Percy dashboard
6. **Approve**: Approves changes → Percy status check passes
7. **Merge**: PR can be merged

---

## Troubleshooting

### Percy Token Not Found
```bash
# Add to ~/.versatil/.env
echo "PERCY_TOKEN=your_token_here" >> ~/.versatil/.env

# Or export temporarily
export PERCY_TOKEN=your_token_here
```

### Snapshot Differences Every Run
```typescript
// Hide dynamic content
await percy.hideElements(['.timestamp', '.random-id']);

// Freeze animations
await percy.freezeAnimations();

// Wait for stability
await percy.waitForSnapshotReady();
```

### Slow Uploads
```typescript
// Scope snapshots to components (faster)
await percy.snapshotComponent('Header', 'header');

// Use standard viewport sizes (not 4K)
await percy.snapshotAtViewport('Page', 1920, 1080);
```

---

## Snapshot Budget

**Percy Free Tier**: 5,000 snapshots/month

**Current Usage** (per full test run):
- Component tests: ~250 snapshots
- Responsive tests: ~80 snapshots
- **Total**: ~330 snapshots/run

**Budget**: 5,000 / 330 = ~15 runs per month

### Optimize Usage
1. Run Percy only on UI changes (Maria-QA auto-triggers)
2. Scope snapshots to components
3. Skip Percy on draft PRs
4. Combine related changes in one PR

---

## Resources

- **Percy Documentation**: https://www.percy.io/docs
- **VERSATIL Percy Guide**: `../../docs/testing/PERCY_VISUAL_REGRESSION.md`
- **Percy Helpers**: `../utils/percy-helpers.ts`
- **Percy Configuration**: `../../.percy.yml`
- **Percy Dashboard**: https://percy.io

---

**VERSATIL Framework v6.4.0**
**Percy Integration**: Phase 3 (Task 3.2)
**Last Updated**: 2025-10-19
