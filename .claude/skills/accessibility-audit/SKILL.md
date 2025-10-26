---
name: accessibility-audit
description: Automated accessibility scanning and remediation guidance for WCAG 2.2 compliance. Use when auditing React/Vue/HTML components, fixing accessibility issues, validating WCAG AA/AAA conformance, or preparing for EAA 2025 enforcement (June 28). Supports axe-core automation, Figma plugin workflows (Stark/Able), and component-level validation.
---

# Accessibility Audit

## Overview

Automate WCAG 2.2 accessibility audits for UI components and pages using industry-standard tools (axe-core, Figma plugins) and systematic remediation workflows. Ensures compliance with European Accessibility Act (EAA) enforcement deadline: June 28, 2025.

## When to Use This Skill

Use this skill when:
- Auditing React/Vue/Svelte/HTML components for WCAG compliance
- Fixing accessibility violations (contrast, keyboard nav, screen readers)
- Validating AA or AAA conformance levels
- Integrating accessibility into CI/CD pipelines
- Preparing for EAA 2025 enforcement
- Conducting component-level accessibility regression testing

**Triggers**: Accessibility issues, WCAG validation requests, "make this accessible", component audits

## Quick Start: 4-Step Audit Workflow

### Step 1: Automated Scan with axe-core

Run the automated accessibility scanner on target components:

```bash
node .claude/skills/accessibility-audit/scripts/axe-audit.js [file-or-url]
```

**What it checks**:
- Color contrast ratios (WCAG 2.2: 4.5:1 text, 3:1 UI components)
- Keyboard navigation and focus indicators
- ARIA attributes and semantic HTML
- Alternative text for images
- Form labels and error messaging
- **NEW in WCAG 2.2**: 24x24px tap targets (Success Criterion 2.5.8)
- **NEW in WCAG 2.2**: Enhanced focus appearance (Success Criterion 2.4.13)

**Output**: JSONL report with violations categorized by severity (critical, serious, moderate, minor)

### Step 2: Review Violations and Prioritize

Parse the axe-core report and prioritize fixes:

**Priority Matrix**:
1. **Critical** (AA blockers): Color contrast, missing alt text, keyboard traps
2. **Serious** (AA compliance): Form labels, ARIA roles, focus management
3. **Moderate** (AAA or UX): Enhanced contrast, larger tap targets
4. **Minor** (Best practices): Semantic HTML improvements

**Reference**: See `references/wcag-2.2-checklist.md` for complete success criteria

### Step 3: Apply Remediation Patterns

Use verified remediation patterns for common violations:

**Color Contrast (1.4.3)**:
```typescript
// ❌ FAIL: Contrast ratio 3.2:1
<button style={{ color: '#999', background: '#fff' }}>Submit</button>

// ✅ PASS: Contrast ratio 4.6:1
<button style={{ color: '#767676', background: '#fff' }}>Submit</button>
```

**Keyboard Navigation (2.1.1)**:
```typescript
// ❌ FAIL: No keyboard access
<div onClick={handleClick}>Click me</div>

// ✅ PASS: Keyboard accessible
<button onClick={handleClick}>Click me</button>
```

**Touch Target Size (2.5.8 - NEW)**:
```css
/* ❌ FAIL: 20x20px target */
.button { width: 20px; height: 20px; }

/* ✅ PASS: 24x24px minimum */
.button { width: 24px; height: 24px; }
/* OR: 24px hit area with padding */
.button { padding: 12px; /* creates 24px+ hit area */ }
```

**Focus Appearance (2.4.13 - NEW)**:
```css
/* ❌ FAIL: No visible focus indicator */
button:focus { outline: none; }

/* ✅ PASS: Enhanced focus (2px minimum) */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

**Reference**: See `references/remediation-patterns.md` for 30+ verified patterns

### Step 4: Verify with Figma Plugins (Design Phase)

When working with Figma designs, integrate Figma accessibility plugins before implementation:

**Stark Plugin Workflow**:
1. Install Stark in Figma (40,000+ teams use it)
2. Run automated scan: Plugins → Stark → "Scan for issues"
3. Review violations: Contrast, touch targets, focus order
4. Apply Stark's color suggestions for AA/AAA compliance
5. Simulate vision impairments: 4 color blindness types, blur, contrast loss

**Able Plugin Workflow**:
1. Select two design elements
2. Plugins → Able → Check contrast
3. Real-time contrast updates as you adjust colors
4. Ensures AA (4.5:1) or AAA (7:1) compliance

**Reference**: See `references/figma-workflow.md` for complete plugin integration

## WCAG 2.2 New Success Criteria (2025)

Nine new success criteria added since WCAG 2.1:

| Criterion | Level | Requirement |
|-----------|-------|-------------|
| 2.4.11 Focus Not Obscured (Minimum) | AA | Focused element not fully hidden |
| 2.4.12 Focus Not Obscured (Enhanced) | AAA | Focused element not obscured at all |
| 2.4.13 Focus Appearance | AAA | 2px minimum focus indicator |
| 2.5.7 Dragging Movements | AA | Alternative to dragging (single tap) |
| 2.5.8 Target Size (Minimum) | AA | **24x24 CSS pixels** for tap targets |
| 3.2.6 Consistent Help | A | Help in consistent location |
| 3.3.7 Redundant Entry | A | Avoid re-entering data |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive tests for login |
| 3.3.9 Accessible Authentication (Enhanced) | AAA | No cognitive tests at all |

**Critical for 2025**: 24x24px tap targets (2.5.8) affects most mobile interfaces

## Contrast Checker Script

Check color contrast ratios programmatically:

```bash
node .claude/skills/accessibility-audit/scripts/contrast-checker.js '#999999' '#ffffff'
```

**Output**:
```
Contrast Ratio: 3.2:1
WCAG AA (text): ❌ FAIL (requires 4.5:1)
WCAG AAA (text): ❌ FAIL (requires 7:1)
WCAG AA (UI): ✅ PASS (requires 3:1)
Suggestion: Use #767676 for AA compliance (4.6:1)
```

## CI/CD Integration

Integrate axe-core into continuous integration pipelines:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Audit
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run axe-core audit
        run: node .claude/skills/accessibility-audit/scripts/axe-audit.js
      - name: Upload violations report
        uses: actions/upload-artifact@v3
        with:
          name: a11y-violations
          path: axe-violations.jsonl
```

**Block merges** if critical violations detected (configurable threshold)

## EAA 2025 Compliance Checklist

European Accessibility Act enforcement: **June 28, 2025**

**Mandatory Requirements**:
- ✅ WCAG 2.1 AA compliance (baseline)
- ✅ WCAG 2.2 enhancements (24x24px targets, focus appearance)
- ✅ Keyboard navigation for all interactive elements
- ✅ Screen reader compatibility (ARIA + semantic HTML)
- ✅ Alternative text for non-text content
- ✅ Color contrast ratios (4.5:1 text, 3:1 UI)
- ✅ No cognitive tests for authentication

**Reference**: See `references/eaa-2025-requirements.md` for complete legal requirements

## Common Gotchas

1. **axe-core catches ~40% of issues** - Manual testing required for keyboard/screen reader UX
2. **Figma plugins check design** - Re-validate after implementation (design ≠ code)
3. **Focus-visible vs focus** - Use `:focus-visible` to avoid mouse focus indicators
4. **24x24px includes padding** - Hit area, not visual size
5. **ARIA overuse** - Semantic HTML preferred (`<button>` over `<div role="button">`)

## Resources

### scripts/
- `axe-audit.js` - Automated axe-core scanning with JSONL reporting
- `contrast-checker.js` - Color contrast ratio validation
- `ci-integration.js` - CI/CD pipeline integration helpers

### references/
- `wcag-2.2-checklist.md` - Complete WCAG 2.2 success criteria (9 new + original)
- `remediation-patterns.md` - 30+ verified fix patterns for common violations
- `figma-workflow.md` - Stark/Able plugin integration for design phase
- `eaa-2025-requirements.md` - European Accessibility Act legal requirements
- `aria-patterns.md` - WAI-ARIA authoring practices for complex widgets

## Related Skills

- `visual-regression` - Accessibility regression testing with Chromatic
- `component-patterns` - Accessible component templates (shadcn/ui + Radix)
- `design-tokens` - Token-based theming with contrast validation
