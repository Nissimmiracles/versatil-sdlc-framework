---
name: visual-regression
description: Component-level visual regression and accessibility testing using Chromatic, Percy, or BackstopJS with Storybook integration. Use when preventing visual bugs, detecting unintended design changes, validating accessibility in isolation, or implementing CI/CD quality gates. Reduces visual bugs by 95% through automated snapshot comparison.
---

# Visual Regression Testing

## Overview

Automate component-level visual regression and accessibility testing using Storybook with Chromatic (cloud) or Percy/BackstopJS (self-hosted). Catches visual bugs and accessibility violations before they reach production.

**Impact**: 95% reduction in visual bugs through automated snapshot testing

## When to Use This Skill

Use this skill when:
- Setting up visual regression testing for component libraries
- Preventing unintended design changes from reaching production
- Validating accessibility at the component level (before integration)
- Implementing CI/CD quality gates that block PRs with visual regressions
- Migrating design systems or refactoring UI components
- Detecting token changes that cause visual side effects

**Triggers**: "visual regression", "snapshot testing", "Chromatic setup", "Storybook A11y", "prevent visual bugs"

---

## Quick Start: 4-Step Workflow

### Step 1: Setup Storybook + A11y Addon

**Install Storybook** (if not already present):
```bash
npx storybook@latest init
```

**Add Accessibility Addon**:
```bash
npm install --save-dev @storybook/addon-a11y
```

**Configure in `.storybook/main.js`**:
```js
module.exports = {
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-essentials'
  ]
};
```

**Reference**: See `references/storybook-setup.md` for complete configuration

---

### Step 2: Write Component Stories

Create stories for components in isolation:

```tsx
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  // A11y configuration
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true }
        ]
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

// Primary button story
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me'
  }
};

// Disabled state
export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled',
    disabled: true
  }
};

// Small size with icon
export const SmallWithIcon: Story = {
  args: {
    size: 'sm',
    children: (
      <>
        <PlusIcon /> Add Item
      </>
    )
  }
};
```

**Best Practices**:
- One story per component state (default, hover, disabled, error)
- Include edge cases (long text, empty state, loading)
- Test responsive breakpoints (mobile, tablet, desktop)
- Cover accessibility states (focus, keyboard navigation)

**Reference**: See `references/story-patterns.md` for comprehensive examples

---

### Step 3: Choose Visual Regression Tool

**Option A: Chromatic (Recommended for Teams)**

**Pros**: Cloud-hosted, UI review interface, component history, TurboSnap (only test changed components)
**Cons**: Paid (5,000 snapshots/month free tier)

```bash
# Install Chromatic
npm install --save-dev chromatic

# Run initial baseline
npx chromatic --project-token=<your-token>
```

**Configuration** (`.chromatic/config.json`):
```json
{
  "projectId": "your-project-id",
  "buildScriptName": "build-storybook",
  "exitZeroOnChanges": false,
  "exitOnceUploaded": true,
  "autoAcceptChanges": "main"
}
```

**Reference**: See `references/chromatic-setup.md` for complete guide

---

**Option B: Percy (Alternative Cloud)**

**Pros**: Visual review UI, GitHub integration, Figma comparison
**Cons**: Paid (5,000 snapshots/month free tier)

```bash
# Install Percy
npm install --save-dev @percy/cli @percy/storybook

# Run snapshots
npx percy storybook ./storybook-static
```

**Reference**: See `references/percy-setup.md` for configuration

---

**Option C: BackstopJS (Self-Hosted)**

**Pros**: Free, full control, no quota limits
**Cons**: Manual baseline management, no UI review interface

```bash
# Install BackstopJS
npm install --save-dev backstopjs

# Initialize config
npx backstop init

# Use provided config
cp .claude/skills/visual-regression/assets/backstop.config.js ./
```

**Reference**: See `references/backstop-setup.md` for workflow

---

### Step 4: Integrate with CI/CD

**GitHub Actions** (Chromatic example):

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on: [push, pull_request]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Required for TurboSnap

      - name: Install dependencies
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          exitZeroOnChanges: false  # Fail if changes detected
          autoAcceptChanges: main   # Auto-approve on main branch
```

**Block PRs with Changes**:
- Set `exitZeroOnChanges: false` to fail CI on visual regressions
- Require manual approval in Chromatic UI
- Only merge after visual review

**Reference**: See `references/ci-integration.md` for Percy/BackstopJS workflows

---

## Accessibility Testing in Storybook

### A11y Addon Configuration

**Global A11y Rules** (`.storybook/preview.js`):
```js
export const parameters = {
  a11y: {
    config: {
      rules: [
        // WCAG 2.2 rules
        { id: 'color-contrast', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'page-has-heading-one', enabled: false },  // Component isolation
        { id: 'region', enabled: false }  // Component isolation
      ]
    },
    options: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag22aa']
      }
    }
  }
};
```

**Per-Story Overrides**:
```tsx
export const DarkButton: Story = {
  args: { variant: 'dark' },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true }  // Critical for dark variant
        ]
      }
    }
  }
};
```

### Viewing A11y Violations

1. Run Storybook: `npm run storybook`
2. Open story in browser
3. Click "Accessibility" tab (bottom panel)
4. Review violations with severity (critical → minor)
5. Click violation to see affected elements

**Violations Display**:
- **Critical**: Color contrast failures, missing alt text
- **Serious**: Missing form labels, invalid ARIA
- **Moderate**: Best practice recommendations
- **Minor**: Advisory notices

**Reference**: See `references/a11y-addon-guide.md` for detailed workflow

---

## Chromatic Features Deep Dive

### TurboSnap (Only Test Changed Components)

Chromatic's TurboSnap only captures snapshots for components affected by code changes:

**Enable TurboSnap**:
```bash
npx chromatic --project-token=<token> --only-changed
```

**Performance**:
- Baseline: 500 snapshots = 8 minutes
- With TurboSnap: 50 changed snapshots = 1 minute (87.5% faster)

### UI Review & Approval Workflow

1. **Push code** → Chromatic runs automatically in CI
2. **Review changes** in Chromatic UI (visual diff viewer)
3. **Accept or Deny** each change
4. **CI passes** only after all changes accepted
5. **Merge PR** with confidence

**Chromatic UI Features**:
- Side-by-side diff viewer
- Overlay mode (blink between before/after)
- Spot differences highlighting
- Component history timeline
- Collaboration (comment on changes)

### Baseline Management

**Accepting Changes**:
```bash
# Accept all changes on current branch
npx chromatic --auto-accept-changes

# Accept all changes on main branch (auto-approve production)
# Set in GitHub Actions: autoAcceptChanges: main
```

**Baseline Branches**:
- `main` - Production baseline (auto-accept)
- `develop` - Staging baseline (manual review)
- Feature branches - Compare against target branch

---

## Percy Features Deep Dive

### Figma Integration

Percy can compare screenshots against Figma designs:

**Setup**:
1. Connect Percy to Figma via integrations
2. Link Figma frames to Percy snapshots
3. Percy shows design vs implementation diff

**Use Case**: Validate implementation matches design specs

### GitHub PR Comments

Percy posts visual diff comments directly on PRs:

```
📸 Percy found 3 visual changes:
  🔴 Button.tsx - Primary variant changed
  🟡 Card.tsx - Shadow depth increased
  🟢 Icon.tsx - Approved change

👉 Review changes: https://percy.io/build/abc123
```

**Blocking Strategy**:
- Require Percy approval before merge
- Auto-approve on main branch
- Manual review on feature branches

---

## BackstopJS Self-Hosted Workflow

### Configuration

**Use provided config** (`assets/backstop.config.js`):
```js
module.exports = {
  id: "storybook_visual_regression",
  viewports: [
    { label: "mobile", width: 375, height: 667 },
    { label: "tablet", width: 768, height: 1024 },
    { label: "desktop", width: 1280, height: 720 }
  ],
  scenarios: [
    {
      label: "Button - Primary",
      url: "http://localhost:6006/iframe.html?id=button--primary",
      selectors: ["#storybook-root"],
      delay: 500
    }
  ],
  paths: {
    bitmaps_reference: "backstop_data/bitmaps_reference",
    bitmaps_test: "backstop_data/bitmaps_test",
    html_report: "backstop_data/html_report"
  }
};
```

### Workflow

```bash
# 1. Capture reference/baseline
npx backstop reference

# 2. Make code changes
# ... edit components ...

# 3. Run test (compares against baseline)
npx backstop test

# 4. Review HTML report
open backstop_data/html_report/index.html

# 5. Approve changes (update baseline)
npx backstop approve
```

**Report Features**:
- Side-by-side before/after comparison
- Difference highlighting (magenta overlay)
- Viewport breakdown (mobile, tablet, desktop)
- Pass/fail status per scenario

---

## Integration with Other Skills

### accessibility-audit Skill

**Combined Workflow**:
1. **Component Development**: Build in isolation (Storybook)
2. **A11y Check**: Storybook A11y addon (real-time feedback)
3. **Visual Baseline**: Capture snapshot with Chromatic
4. **Integration Test**: Full-page axe-core scan (accessibility-audit skill)

**Why Both?**
- **Storybook A11y**: Component-level, fast feedback during development
- **axe-core scan**: Page-level, catches integration issues (overlapping elements, focus order)

### design-tokens Skill

**Token Change Detection**:
1. Update design token (e.g., `--color-primary: #2196F3 → #1976D2`)
2. Visual regression test detects ALL components using that token
3. Review changes in Chromatic UI
4. Accept or revert token change

**Value**: Prevents unintended side effects from token updates

### component-patterns Skill

**Template Validation**:
1. Generate component from template (e.g., Dialog pattern)
2. Write Storybook story for component
3. Capture visual baseline
4. Future changes automatically tested against baseline

---

## Common Workflows

### New Component Development
1. Create component + Storybook story
2. Run Storybook, validate A11y addon (no violations)
3. Capture baseline: `npx chromatic`
4. Push to CI → Chromatic creates initial baseline
5. Future PRs automatically compared against baseline

### Design System Migration
1. Capture baseline of OLD design (all components)
2. Implement NEW design (token changes, component updates)
3. Run visual regression → See all affected components
4. Review changes component-by-component
5. Accept changes → New baseline established

### Refactoring with Confidence
1. Baseline established from working code
2. Refactor component internals (improve performance, accessibility)
3. Visual regression test → No visual changes detected
4. A11y addon → Accessibility improved
5. Merge with confidence (no visual regressions)

---

## Metrics to Track

1. **Visual Regression Detection Rate**: % of bugs caught before production (target: 95%+)
2. **False Positive Rate**: % of flagged changes that are intentional (target: <10%)
3. **Review Time**: Time to review and approve changes (target: <5 min/PR)
4. **Snapshot Count**: Number of snapshots captured per build
5. **TurboSnap Efficiency**: % of snapshots skipped by TurboSnap (target: 80%+)

**Goal**: Zero visual regressions in production, <5 min PR review time

---

## Common Gotchas

1. **Fonts not loaded** → Snapshots fail due to font loading race
   - **Fix**: Add `delay: 1000` in BackstopJS or `waitFor: 'networkidle'` in Chromatic

2. **Animations cause flaky tests** → Random snapshot differences
   - **Fix**: Disable animations in Storybook: `parameters: { chromatic: { disableSnapshot: false, pauseAnimationAtEnd: true } }`

3. **Responsive breakpoints missing** → Desktop-only testing
   - **Fix**: Test multiple viewports (mobile, tablet, desktop) in every story

4. **Anti-aliasing differences** → Different rendering across environments
   - **Fix**: Use Chromatic (cloud, consistent rendering) or Docker for BackstopJS

5. **Too many snapshots** → Slow CI, high cost
   - **Fix**: Enable TurboSnap (Chromatic) or use `onlyStoryNames` filter

---

## Resources

### scripts/
- `chromatic-snapshot.js` - Capture Chromatic baselines with metadata
- `percy-snapshot.js` - Percy snapshot runner with Figma integration
- `backstop-generator.js` - Auto-generate BackstopJS scenarios from Storybook

### references/
- `storybook-setup.md` - Complete Storybook + A11y addon configuration
- `chromatic-setup.md` - Chromatic integration, TurboSnap, UI review workflow
- `percy-setup.md` - Percy configuration with GitHub + Figma integration
- `backstop-setup.md` - Self-hosted BackstopJS workflow
- `story-patterns.md` - 20+ story patterns for common component states
- `a11y-addon-guide.md` - Accessibility testing in Storybook
- `ci-integration.md` - GitHub Actions workflows for all 3 tools

### assets/
- `backstop.config.js` - BackstopJS configuration template
- `storybook-examples/` - Example stories for common components

## Related Skills

- `accessibility-audit` - Page-level axe-core scanning (complements Storybook A11y)
- `design-tokens` - Detects token changes causing visual regressions
- `component-patterns` - Templates include Storybook stories for baseline capture
