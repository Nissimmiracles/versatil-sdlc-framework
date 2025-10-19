# Percy Visual Regression Testing - Integration Summary

**VERSATIL Framework Phase 3 - Task 3.2**
**Completed**: 2025-10-19
**Integration Status**: ✅ Complete

---

## Overview

Percy visual regression testing has been successfully integrated into the VERSATIL Framework, providing automated UI regression detection for all components and responsive layouts.

---

## Files Created

### 1. Configuration Files

#### `.percy.yml` (214 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/.percy.yml`
**Purpose**: Percy configuration for visual regression testing

**Key Features**:
- Responsive breakpoints: 320px, 375px, 768px, 1024px, 1366px, 1920px
- Snapshot widths configured for all device types
- Percy CSS to hide dynamic content (timestamps, animations)
- Comparison threshold: 1% difference tolerance
- Accessibility integration enabled (WCAG AA level)
- Parallel execution support for CI/CD

**Configuration Highlights**:
```yaml
snapshot:
  widths: [320, 375, 768, 1024, 1366, 1920]
  enable-javascript: true
  percy-css: |
    /* Hide dynamic timestamps */
    [data-testid="timestamp"] { visibility: hidden !important; }

comparison:
  threshold: 0.01  # 1% tolerance

accessibility:
  enabled: true
  level: AA  # WCAG 2.1 AA compliance
```

---

### 2. Test Utilities

#### `tests/utils/percy-helpers.ts` (~400 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/tests/utils/percy-helpers.ts`
**Purpose**: Comprehensive Percy helper utilities for visual testing

**Classes & Methods**:

**PercyHelper Class**:
- `snapshot()` - Basic snapshot capture
- `snapshotResponsive()` - All breakpoints (mobile, tablet, desktop)
- `snapshotThemes()` - Light and dark themes
- `snapshotStates()` - Component states (hover, focus, disabled, error, loading)
- `snapshotAtViewport()` - Specific viewport size
- `snapshotComponent()` - Scoped component snapshot
- `setTheme()` - Switch between light/dark themes
- `setComponentState()` - Set component state for testing
- `hideElements()` - Hide dynamic content
- `freezeAnimations()` - Stop animations for consistent snapshots
- `waitForImages()` - Wait for all images to load
- `waitForFonts()` - Wait for fonts to load
- `waitForSnapshotReady()` - Comprehensive wait (network idle + images + fonts)

**Quick Helper Functions**:
- `quickSnapshot()` - No class instantiation needed
- `quickResponsiveSnapshot()` - Quick responsive test
- `quickThemeSnapshot()` - Quick theme test

**Constants**:
```typescript
RESPONSIVE_WIDTHS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1920
}

ComponentState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'error' | 'loading'
ThemeMode = 'light' | 'dark'
```

---

### 3. Visual Test Suites

#### `tests/visual/component-visual-regression.spec.ts` (~450 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/tests/visual/component-visual-regression.spec.ts`
**Purpose**: Percy visual tests for critical UI components

**Test Coverage** (15 test cases):

1. **Button Components**
   - Primary button: All states (default, hover, focus, active, disabled)
   - Secondary button: States (default, hover, disabled)
   - Icon button: States (default, hover, active)
   - Responsive breakpoints
   - Theme variants (light/dark)

2. **Form Components**
   - Text inputs: All states
   - Textareas: All states
   - Select dropdowns: States
   - Checkboxes: Unchecked, checked, disabled
   - Radio buttons: Group states

3. **Card Component**
   - Default card
   - Card with image
   - Card with actions
   - Hover state

4. **Modal Component**
   - Light theme
   - Dark theme
   - Mobile viewport (375x667)
   - Tablet viewport (768x1024)
   - Desktop viewport (1920x1080)

5. **Navigation Component**
   - Default state
   - Active item
   - Mobile navigation (hamburger menu)
   - Dropdown open

6. **Toast/Alert Component**
   - Success, Error, Warning, Info variants

7. **Loading States**
   - Spinner
   - Skeleton
   - Progress bar

8. **Table Component**
   - Default, sorted, selected row
   - Mobile responsive

9. **Tooltip Component**
   - Top, bottom, left, right positions

10. **Badge Component**
    - All variants
    - Theme variations

11. **Pagination Component**
    - First page, middle page, last page
    - Mobile pagination

12. **Avatar Component**
    - With image, initials
    - All sizes

13. **Accordion Component**
    - All collapsed, first expanded, multiple expanded

14. **Tabs Component**
    - First tab, second tab
    - Responsive

15. **Breadcrumb Component**
    - Default, with icons
    - Mobile view

**Estimated Snapshots**: ~250 per run

---

#### `tests/visual/responsive-visual-regression.spec.ts` (~300 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/tests/visual/responsive-visual-regression.spec.ts`
**Purpose**: Percy visual tests for responsive layouts

**Test Coverage** (20 test cases):

1. **Homepage**
   - All breakpoints
   - Light/dark themes at all breakpoints

2. **Dashboard**
   - Desktop view (full sidebar)
   - Tablet view (collapsed sidebar)
   - Mobile view (hamburger menu)
   - Sidebar states (expanded/collapsed)

3. **Grid Layout**
   - 4 columns (1920px)
   - 3 columns (1024px)
   - 2 columns (768px)
   - 1 column (375px)

4. **Form Layout**
   - Desktop: side-by-side fields
   - Tablet: stacked fields
   - Mobile: full-width fields

5. **Navigation**
   - Desktop: full navigation
   - Tablet: condensed navigation
   - Mobile: hamburger menu (closed/open)

6. **Data Table**
   - Desktop: full table
   - Tablet: horizontal scroll
   - Mobile: card layout

7. **Product Card Grid**
   - 4 cards per row (desktop)
   - 3 cards per row (1024px)
   - 2 cards per row (tablet)
   - 1 card per row (mobile)

8. **Footer**
   - Multi-column (desktop)
   - 2-column (tablet)
   - Stacked (mobile)

9. **Hero Section**
   - Responsive images at all breakpoints

10. **Pricing Page**
    - 3 tiers side-by-side (desktop)
    - 3 tiers smaller (tablet)
    - Stacked (mobile)

11-20. **Additional Pages**: Search results, profile, settings, gallery, blog post, 404 page, loading states, empty states, landscape orientations

**Estimated Snapshots**: ~80 per run

---

### 4. Documentation

#### `docs/testing/PERCY_VISUAL_REGRESSION.md` (~500 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/docs/testing/PERCY_VISUAL_REGRESSION.md`
**Purpose**: Comprehensive Percy integration guide

**Sections**:
1. Overview - What is Percy and why use it
2. Setup & Configuration - Account setup, environment variables
3. Writing Visual Tests - Helper utilities, examples
4. Running Tests - Local development, CI/CD
5. CI/CD Integration - GitHub Actions, Percy status checks
6. Maria-QA Integration - Auto-trigger logic
7. Best Practices - Snapshot naming, dynamic content handling
8. Troubleshooting - Common issues and solutions
9. Percy Dashboard - Accessing, approving changes
10. Advanced Usage - Percy CLI, API integration, parallel execution

#### `tests/visual/README.md` (~200 lines)
**Location**: `/Users/nissimmenashe/VERSATIL SDLC FW/tests/visual/README.md`
**Purpose**: Quick reference for visual testing

**Contents**:
- Quick start guide
- Test file overview
- Responsive breakpoints
- Helper utilities
- Writing new visual tests
- Best practices
- CI/CD integration
- Troubleshooting
- Snapshot budget

---

### 5. Updated Files

#### `playwright.config.ts`
**Changes**: Percy integration added

```typescript
reporter: [
  // ... existing reporters
  ...(process.env.CI || process.env.PERCY_TOKEN ? [['@percy/playwright']] : [])
]

projects: [
  {
    name: 'visual-regression',
    use: {
      contextOptions: {
        reducedMotion: 'reduce',  // Reduce flakiness
        forcedColors: 'none'
      }
    },
    fullyParallel: false,  // Sequential for Percy
    retries: process.env.CI ? 1 : 0
  }
]
```

**Impact**: Percy reporter only activated when PERCY_TOKEN is set

---

#### `package.json`
**Changes**: Percy npm scripts added

```json
"scripts": {
  "test:visual:percy": "npx percy exec -- npx playwright test --project=visual-regression",
  "test:visual:percy:components": "npx percy exec -- npx playwright test tests/visual/component-visual-regression.spec.ts",
  "test:visual:percy:responsive": "npx percy exec -- npx playwright test tests/visual/responsive-visual-regression.spec.ts",
  "test:visual:percy:dry-run": "npx percy exec --dry-run -- npx playwright test --project=visual-regression"
}
```

**Dependencies**: Already installed
- `@percy/cli: ^1.31.4`
- `@percy/playwright: ^1.0.9`

---

#### `.github/workflows/quality-gates.yml`
**Changes**: Percy CI/CD integration added

**New Job**: `visual-regression`

```yaml
visual-regression:
  name: Visual Regression Tests (Percy)
  runs-on: ubuntu-latest
  needs: mcp-health

  steps:
    - name: Run Percy visual regression tests
      env:
        PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        PERCY_BRANCH: ${{ github.head_ref || github.ref_name }}
        PERCY_PULL_REQUEST: ${{ github.event.pull_request.number }}
      run: npm run test:visual:percy

    - name: Comment PR with Percy results
      # Auto-comments on PR with Percy build link
```

**Features**:
- Auto-detects PERCY_TOKEN from GitHub secrets
- Posts Percy build link to PR
- Uploads Percy snapshots to dashboard
- Parallel execution support
- Graceful fallback if Percy not configured

---

#### `src/agents/opera/maria-qa/enhanced-maria.ts`
**Changes**: Percy integration methods added (~120 lines)

**New Methods**:

1. **`triggerPercySnapshot(context)`**
   - Checks if file is UI component
   - Determines which Percy test to run
   - Logs recommendation

2. **`isUIComponent(filePath)`**
   - Detects UI files: `.tsx`, `.jsx`, `.vue`, `.svelte`
   - Detects UI paths: `/components/`, `/ui/`, `/views/`, `/pages/`

3. **`determinePercyTest(filePath, content)`**
   - Component files → `test:visual:percy:components`
   - Page files → `test:visual:percy:responsive`
   - Global styles → `test:visual:percy`

4. **`addPercyRecommendation(response, testCommand)`**
   - Adds visual regression suggestion to response

5. **`activateWithVisualTesting(context)`**
   - Enhanced activate method with Percy integration
   - Auto-triggers Percy on UI changes

6. **`validatePercyResults(percyBuildId)`**
   - Validates Percy results from CI/CD
   - Returns passed/failed status

**Example Usage**:
```typescript
const maria = new EnhancedMaria();
const response = await maria.activateWithVisualTesting({
  filePath: 'src/components/Button.tsx',
  content: buttonCode,
  trigger: { type: 'file-save' }
});

// Response includes Percy recommendation:
// "UI component changed. Run Percy visual regression: npm run test:visual:percy:components"
```

---

## Integration Points

### 1. Maria-QA Auto-Trigger

**Trigger Conditions**:
- UI component file edited (`.tsx`, `.jsx`, `.vue`, `.svelte`)
- Component directory changed (`/components/`, `/ui/`, `/views/`, `/pages/`)
- Global styles modified (`global.css`, theme files)

**Action**:
```bash
# Maria-QA suggests:
"UI component changed. Run Percy visual regression: npm run test:visual:percy:components"
```

**User Action**:
```bash
npm run test:visual:percy:components
# Or let CI/CD run automatically
```

---

### 2. CI/CD Pipeline

**Workflow**:
1. Developer pushes PR with UI changes
2. GitHub Actions runs Percy tests automatically
3. Percy captures snapshots and compares with baseline
4. Percy bot comments on PR with build link
5. Reviewer approves visual changes on Percy dashboard
6. Percy status check passes
7. PR can be merged

**Percy Status Checks**:
- ✅ Build Approved
- ⏳ Build Processing
- ❌ Build Failed (unapproved visual changes)

---

### 3. Quality Gates

Percy integrated into quality gate workflow:

```yaml
quality-gate:
  needs: [accessibility-tests, code-quality, test-coverage, security-audit, visual-regression]
```

**Quality Gate Criteria**:
- Accessibility tests: ✅ Pass
- Code quality: ✅ Pass
- Test coverage: ✅ Pass
- Security audit: ✅ Pass
- **Visual regression (Percy)**: ✅ All changes approved

---

## Usage Examples

### Quick Start

```bash
# 1. Set Percy token (get from percy.io)
export PERCY_TOKEN=your_percy_token_here

# 2. Run all Percy visual tests
npm run test:visual:percy

# 3. View results on Percy dashboard
# https://percy.io/your-org/versatil-sdlc-framework
```

### Component Testing

```bash
# Test specific component
npm run test:visual:percy:components

# Dry run (no snapshots uploaded)
npm run test:visual:percy:dry-run
```

### Responsive Testing

```bash
# Test responsive layouts
npm run test:visual:percy:responsive
```

---

## Percy Dashboard

### Access
```
https://percy.io/your-org/versatil-sdlc-framework
```

### Features
- **Build Overview**: Status, snapshot count, visual changes
- **Snapshot Comparison**: Side-by-side with diff highlighting
- **Approval Workflow**: Approve/reject changes with comments
- **Build History**: Past builds and baseline snapshots

### Approving Changes

**Scenario**: Button color intentionally changed

**Steps**:
1. Open Percy build for PR
2. Review snapshot: "Button - Primary"
3. See color change highlighted
4. Click **"Approve"**
5. Percy updates GitHub status check
6. PR can be merged

---

## Snapshot Budget

**Percy Free Tier**: 5,000 snapshots/month

**Current Usage** (per full test run):
- Component tests: ~250 snapshots
- Responsive tests: ~80 snapshots
- **Total**: ~330 snapshots/run

**Budget**: 5,000 / 330 = ~15 runs per month

**Optimization**:
- Maria-QA auto-triggers only on UI changes
- Scoped snapshots to components
- Skip Percy on draft PRs
- Combine related changes in one PR

---

## Environment Variables

### Required

```bash
# Percy project token (get from percy.io)
PERCY_TOKEN=your_percy_token_here
```

**Storage**: `~/.versatil/.env` (framework isolation)

**Security**: Never commit to git

### Optional (Auto-detected in CI)

```bash
# Git branch name
PERCY_BRANCH=main

# Pull request number
PERCY_PULL_REQUEST=123

# Parallel execution
PERCY_PARALLEL_TOTAL=4
PERCY_PARALLEL_NONCE=unique-build-id
```

---

## GitHub Secrets

### Setup

1. Go to GitHub repo settings
2. Navigate to **Secrets and variables** > **Actions**
3. Add new secret:
   - Name: `PERCY_TOKEN`
   - Value: Your Percy token from percy.io

### Usage in Workflow

```yaml
env:
  PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

---

## Best Practices Implemented

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
```yaml
# .percy.yml
percy-css: |
  [data-testid="timestamp"],
  .loading {
    visibility: hidden !important;
  }
```

### 3. Freeze Animations
```typescript
await percy.freezeAnimations();
await percy.snapshot('Modal');
```

### 4. Wait for Stability
```typescript
await percy.waitForSnapshotReady(); // Waits for:
// - Network idle
// - Images loaded
// - Fonts loaded
```

### 5. Scope Snapshots
```typescript
// Good ✅ - Scoped to component
await percy.snapshotComponent('Card', '[data-testid="card"]');

// Bad ❌ - Full page
await percy.snapshot('Page with Card');
```

---

## Troubleshooting

### Percy Token Not Found

**Error**: `PERCY_TOKEN was not provided`

**Solution**:
```bash
echo "PERCY_TOKEN=your_token_here" >> ~/.versatil/.env
# Or export temporarily
export PERCY_TOKEN=your_token_here
```

### Snapshot Differences Every Run

**Cause**: Dynamic content (timestamps, animations)

**Solution**:
```typescript
await percy.hideElements(['.timestamp', '.random-id']);
await percy.freezeAnimations();
await percy.waitForSnapshotReady();
```

### Slow Uploads

**Cause**: Too many snapshots or large viewports

**Solution**:
```typescript
// Scope to components (faster)
await percy.snapshotComponent('Header', 'header');

// Use standard viewport sizes (not 4K)
await percy.snapshotAtViewport('Page', 1920, 1080);
```

---

## Success Criteria

✅ **All criteria met**:

1. ✅ `.percy.yml` configuration complete
2. ✅ `tests/utils/percy-helpers.ts` utilities implemented
3. ✅ `tests/visual/component-visual-regression.spec.ts` (15 test cases)
4. ✅ `tests/visual/responsive-visual-regression.spec.ts` (20 test cases)
5. ✅ `playwright.config.ts` updated with Percy integration
6. ✅ `package.json` updated with Percy scripts
7. ✅ `.github/workflows/quality-gates.yml` updated with Percy job
8. ✅ `src/agents/opera/maria-qa/enhanced-maria.ts` Percy integration methods
9. ✅ `docs/testing/PERCY_VISUAL_REGRESSION.md` comprehensive guide
10. ✅ `tests/visual/README.md` quick reference
11. ✅ Percy dependencies installed (`@percy/cli`, `@percy/playwright`)
12. ✅ Full TypeScript type safety
13. ✅ No breaking changes to existing tests
14. ✅ Framework isolation maintained (token in `~/.versatil/.env`)

---

## Next Steps

### 1. Percy Account Setup

```bash
# Sign up at percy.io
# Create new project: "VERSATIL SDLC Framework"
# Get Percy token from project settings
```

### 2. Add Token to Environment

```bash
echo "PERCY_TOKEN=your_percy_token_here" >> ~/.versatil/.env
```

### 3. Add GitHub Secret

1. GitHub repo → Settings → Secrets → Actions
2. Add secret: `PERCY_TOKEN`
3. Value: Your Percy token

### 4. Run First Percy Test

```bash
export PERCY_TOKEN=your_token_here
npm run test:visual:percy
```

### 5. Review on Percy Dashboard

```
https://percy.io/your-org/versatil-sdlc-framework
```

### 6. Approve Baseline

- First run creates baseline snapshots
- All snapshots need approval
- Click "Approve all" to set baseline

### 7. Test on PR

- Push PR with UI changes
- Percy runs automatically in CI/CD
- Review visual diffs on Percy dashboard
- Approve changes
- Merge PR

---

## Resources

- **Percy Documentation**: https://www.percy.io/docs
- **Playwright Integration**: https://www.percy.io/docs/end-to-end/playwright
- **VERSATIL Percy Guide**: `docs/testing/PERCY_VISUAL_REGRESSION.md`
- **Percy Helpers**: `tests/utils/percy-helpers.ts`
- **Percy Configuration**: `.percy.yml`
- **Percy Dashboard**: https://percy.io

---

## Implementation Metrics

- **Files Created**: 5
- **Files Updated**: 4
- **Lines of Code Added**: ~1,500
- **Test Cases**: 35 (15 component + 20 responsive)
- **Helper Methods**: 20+
- **Documentation Pages**: 2 (500 + 200 lines)
- **Estimated Snapshots**: ~330 per run
- **Integration Time**: ~2 hours

---

**Task Status**: ✅ Complete
**VERSATIL Version**: v6.4.0
**Percy Integration**: Phase 3 (Task 3.2)
**Completed By**: Claude (Maria-QA Agent)
**Date**: 2025-10-19
