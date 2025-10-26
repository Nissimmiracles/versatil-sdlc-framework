# Figma Accessibility Plugin Workflow

Integrate accessibility validation into design phase using Figma plugins.

**Why Design Phase Matters**: Fixing accessibility issues in design is 40x cheaper than fixing in production.

---

## Recommended Plugins (2025)

### 1. Stark (Most Comprehensive)
- **Users**: 40,000+ designers, 28,000+ companies
- **Price**: Free tier + paid plans
- **Link**: https://www.getstark.co/figma/

### 2. Able (Real-time Contrast)
- **Best for**: Quick contrast checks during design
- **Price**: Free
- **Link**: Figma Community → "Able Accessibility"

### 3. BrowserStack A11y Toolkit
- **Best for**: WCAG 2.2 comprehensive validation
- **Price**: Free with BrowserStack account
- **Link**: Figma Community → "BrowserStack Accessibility"

---

## Stark Plugin Workflow

### Installation
1. Figma → Plugins → Browse all plugins
2. Search "Stark - Contrast & Accessibility Checker"
3. Install (40,000+ installs, 4.9★ rating)

### Step 1: Run Automated Scan

```
1. Select artboard or frame
2. Plugins → Stark → "Scan for issues"
3. Wait 10-30 seconds (scans all layers)
```

**What it checks**:
- Color contrast (text, UI components)
- Touch target sizes (24x24px minimum for WCAG 2.2)
- Focus order and landmarks
- Alternative text for images

**Output**:
- Violations list with severity (Critical → Minor)
- Affected layers highlighted in red
- One-click navigation to each issue

### Step 2: Fix Contrast Violations

Stark provides **automatic color suggestions**:

```
1. Click on contrast violation
2. Review suggested colors (AA or AAA compliant)
3. Click suggestion to apply to layer
4. Re-scan to verify
```

**Example**:
```
Violation: Text #999999 on #FFFFFF (3.2:1 - FAIL)
Suggestions:
  → #767676 (4.6:1 - AA) ✓
  → #595959 (7.0:1 - AAA) ✓
```

### Step 3: Simulate Vision Impairments

Stark supports **8 vision simulations**:

**Color Blindness**:
- Protanopia (red-blind, 1% of men)
- Deuteranopia (green-blind, 1% of men)
- Tritanopia (blue-blind, 0.001%)
- Achromatopsia (total color blindness, 0.003%)

**Visual Impairments**:
- Blurred vision (cataracts, near/farsighted)
- Loss of contrast (aging, glaucoma)
- Ghosting (astigmatism)
- Yellowing (aging lens)

**Workflow**:
```
1. Plugins → Stark → "Vision Simulator"
2. Select simulation type
3. Stark overlays simulated view on canvas
4. Verify UI still readable and usable
```

### Step 4: Check Focus Order

```
1. Plugins → Stark → "Focus Order"
2. Stark numbers interactive elements (1, 2, 3...)
3. Verify tab order matches visual hierarchy
4. Drag numbers to reorder if needed
```

**Best Practice**: Tab order should follow:
1. Logo/home link
2. Primary navigation
3. Search
4. Main content
5. Secondary content
6. Footer

### Step 5: Generate Accessibility Report

```
1. Plugins → Stark → "Generate Report"
2. Export as PDF or shareable link
3. Share with developers and stakeholders
```

**Report includes**:
- WCAG 2.2 compliance score
- Violations by severity
- Screenshots of affected areas
- Recommendations for fixes

---

## Able Plugin Workflow (Real-Time Contrast)

### Best Use Case
Quick contrast checks while designing (no scan required).

### Workflow

```
1. Select text layer
2. Select background layer (or frame)
3. Plugins → Able → "Check Contrast"
```

**Output (real-time)**:
```
Contrast Ratio: 4.6:1
WCAG AA (text): ✓ PASS
WCAG AAA (text): ✗ FAIL
```

**Key Feature**: Updates **as you adjust colors** in real-time
- Drag color picker → Able updates ratio instantly
- Finds compliant color in seconds

---

## BrowserStack A11y Toolkit Workflow

### Best for WCAG 2.2 Validation

```
1. Select artboard
2. Plugins → BrowserStack A11y → "Run Audit"
3. Review violations categorized by WCAG criterion
```

**Unique Features**:
- WCAG 2.2 success criterion mapping (e.g., "2.5.8 Target Size")
- Links to W3C documentation for each violation
- Severity + impact score (1-10)

---

## Design Token Integration

### Export Accessible Color Palette

After validation, export color tokens for design system:

**Stark Export**:
```
1. Plugins → Stark → "Export Tokens"
2. Choose format: CSS Variables, SCSS, JSON
3. Import into design system
```

**Output Example (CSS Variables)**:
```css
:root {
  /* Primary colors (AA compliant on white) */
  --color-primary: #005fcc;      /* 4.6:1 */
  --color-secondary: #6c757d;    /* 4.5:1 */
  --color-success: #28a745;      /* 3.1:1 UI, large text only */
  --color-danger: #dc3545;       /* 4.5:1 */

  /* Text colors */
  --text-primary: #212529;       /* 16.1:1 */
  --text-secondary: #767676;     /* 4.6:1 AA */
  --text-muted: #6c757d;         /* 4.5:1 AA */

  /* Background colors */
  --bg-default: #ffffff;
  --bg-secondary: #f8f9fa;       /* Use text-primary for contrast */
}
```

---

## Common Workflows by Role

### Designer (Daily Use)
1. Design component in Figma
2. Run Able contrast check (real-time)
3. Adjust colors until AA compliance
4. Run Stark automated scan before handoff
5. Fix violations or document exceptions

### Design Lead (Weekly Review)
1. Run Stark scan on entire design system
2. Generate accessibility report
3. Review with team in design critique
4. Track violations over time (regression)

### Developer Handoff
1. Designer runs Stark scan
2. Exports token palette (CSS variables)
3. Shares accessibility report with dev team
4. Developer implements with tokens
5. Re-validates with axe-core in code

---

## Integration with Design System

### Step 1: Create Accessible Color Tokens

```
Figma Variables → Color → Create base palette:
  - Primary: #005fcc (4.6:1 on white)
  - Secondary: #767676 (4.6:1 on white)
  - Success: #28a745 (3.1:1 UI only)
  - Danger: #dc3545 (4.5:1 on white)
  - Warning: #ffc107 (1.8:1 - requires dark text)
```

### Step 2: Document Contrast Ratios

Add contrast ratio to color token descriptions:

```
Token: color/text/secondary
Value: #767676
Description: "Secondary text (4.6:1 on white - AA compliant)"
```

### Step 3: Export to Code

Use Figma API or plugins:
- Token Studio (JSON export)
- Specify (GitHub sync)
- Style Dictionary (multi-platform)

**See**: `design-tokens` skill for automation workflow

---

## WCAG 2.2 Focus Areas in Design Phase

| Success Criterion | Figma Check | Tool |
|-------------------|-------------|------|
| 1.4.3 Contrast (Minimum) | Text contrast 4.5:1 | Stark, Able |
| 1.4.11 Non-text Contrast | UI contrast 3:1 | Stark |
| 2.4.7 Focus Visible | Focus indicator design | Manual |
| 2.4.13 Focus Appearance | 2px minimum outline | Manual |
| 2.5.8 Target Size | 24x24px minimum | Stark |
| 3.2.6 Consistent Help | Help in same location | Manual |

**Manual Checks** (Stark doesn't automate):
- Focus indicator design (2px minimum, high contrast)
- Consistent help mechanism placement
- Reading order and heading hierarchy

---

## Common Gotchas

### 1. Figma ≠ Production
**Problem**: Colors look different in browser vs Figma (color profiles, gamma)

**Solution**:
- Always re-validate with axe-core in code
- Use Stark's "Browser Preview" to simulate rendering

### 2. Overlays and Transparency
**Problem**: Figma layers with opacity affect contrast calculation

**Solution**:
- Flatten overlays before contrast check
- Or manually calculate effective color after blending

### 3. Gradient Backgrounds
**Problem**: Gradients have varying contrast across surface

**Solution**:
- Check contrast at darkest point of gradient
- Or use solid background for text areas

### 4. Dark Mode
**Problem**: Design validated in light mode only

**Solution**:
- Run Stark scan on both light and dark variants
- Maintain separate color tokens for each theme

---

## Metrics to Track

1. **Violations per Artboard**: Track over time (should decrease)
2. **WCAG Compliance Score**: Stark reports 0-100%
3. **Critical Violations**: Block handoff if any critical issues
4. **Time to Fix**: Measure design → compliant design time

**Goal**: 100% WCAG 2.2 AA compliance before developer handoff

---

## Related References

- `wcag-2.2-checklist.md` - Full WCAG criteria
- `remediation-patterns.md` - Code fixes for violations
- `../design-tokens/SKILL.md` - Token automation workflow
