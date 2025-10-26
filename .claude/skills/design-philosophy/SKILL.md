---
name: design-philosophy
description: Apply design philosophies and brand theming to UI artifacts. Use when styling React artifacts, ensuring brand consistency, implementing design system aesthetics, or avoiding AI-generated "slop" (purple gradients, centered layouts, Inter font). Integrates with canvas-design skill for museum-quality visual design with accessibility validation.
---

# Design Philosophy & Brand Theming

## Overview

Apply sophisticated design philosophies and brand-aware theming to UI components and artifacts. Extends canvas-design skill with React artifact support, design system integration, and anti-AI-slop guidelines.

**Philosophy**: Expert craftsmanship + Brand consistency + Accessibility compliance

## When to Use This Skill

Use this skill when:
- Styling React/Vue artifacts with design philosophy
- Ensuring brand consistency across UI components
- Implementing design system aesthetics (Material, Fluent, Carbon)
- Avoiding generic AI-generated design patterns
- Applying typography with readability + accessibility
- Theming shadcn/ui components with brand tokens

**Triggers**: "apply design philosophy", "brand theming", "style this artifact", "design system aesthetic"

---

## Quick Start: Philosophy → Theme → Apply

### Step 1: Choose Design Philosophy

**5 Core Philosophies**:

1. **Brutalist Joy** - Bold, geometric, high-contrast
   - Massive color blocks, sculptural typography
   - Polish poster energy meets Le Corbusier
   - Best for: Dashboards, data-heavy interfaces

2. **Chromatic Silence** - Color as primary information
   - Minimal text, color zones create meaning
   - Josef Albers interaction meets data viz
   - Best for: Analytics, visualization tools

3. **Organic Systems** - Natural, rounded, modular
   - Clustered layouts, nature-inspired colors
   - Soft edges, breathing room
   - Best for: Content platforms, social apps

4. **Geometric Precision** - Grid-based, Swiss formalism
   - Bold photography, dramatic negative space
   - Perfect alignment, restrained typography
   - Best for: Corporate sites, documentation

5. **Analog Meditation** - Texture, calm, contemplative
   - Paper grain, vast white space, restrained
   - Japanese photobook aesthetic
   - Best for: Reading apps, minimalist tools

**Reference**: See `references/philosophy-catalog.md` for detailed guidelines

### Step 2: Map Philosophy to Design Tokens

Each philosophy maps to token values:

**Brutalist Joy Tokens**:
```json
{
  "color": {
    "primary": "#FF6B35",     // Bold orange
    "secondary": "#004E89",   // Deep blue
    "bg": "#F7F7F2"          // Off-white
  },
  "typography": {
    "heading": "Bebas Neue",  // Condensed, bold
    "body": "Work Sans"       // Geometric sans
  },
  "spacing": "8px grid"       // Rigid grid system
}
```

**Chromatic Silence Tokens**:
```json
{
  "color": {
    "zones": ["#FF6F61", "#6B5B95", "#88B04B", "#F7CAC9"],  // Color coding
    "text": "#2C2C2C"    // Minimal, small
  },
  "typography": {
    "heading": "Futura",      // Geometric precision
    "body": "Helvetica Neue"  // Clean, minimal
  },
  "spacing": "Generous"       // Let color breathe
}
```

**Reference**: See `assets/themes/` for all philosophy token mappings

### Step 3: Apply to React Artifact

**Using with shadcn/ui**:
```tsx
// Apply Brutalist Joy philosophy
import { cn } from '@/lib/utils';

export function BrutalistCard({ title, children }: CardProps) {
  return (
    <div className={cn(
      "brutalist-card",
      // Philosophy: Massive color blocks
      "bg-[#FF6B35] border-4 border-black",
      // Philosophy: Sculptural typography
      "font-['Bebas_Neue'] text-6xl uppercase",
      // Philosophy: Rigid grid
      "p-8 grid gap-8"
    )}>
      <h2>{title}</h2>
      <div className="brutalist-content">
        {children}
      </div>
    </div>
  );
}
```

**Reference**: See `references/react-theming.md` for component examples

---

## Anti-AI-Slop Guidelines

### Common AI Design Mistakes to Avoid

**❌ AI Slop Characteristics**:
1. **Purple Gradients** everywhere (generic, overused)
2. **Centered Layouts** for everything (boring, predictable)
3. **Inter Font** as default (lacks personality)
4. **Uniform rounded corners** (12px on everything)
5. **Generic card grids** (3-column, centered, shadow)
6. **Excessive white space** (30% content, 70% padding)

**✅ Expert Alternatives**:

**Instead of Purple Gradient**:
```css
/* ❌ AI Slop */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* ✅ Philosophy-Driven (Chromatic Silence) */
background: #88B04B;  /* Single, meaningful color from palette */
```

**Instead of Centered Everything**:
```css
/* ❌ AI Slop */
.container { text-align: center; justify-content: center; }

/* ✅ Philosophy-Driven (Geometric Precision) */
.container {
  display: grid;
  grid-template-columns: 2fr 1fr;  /* Asymmetric, intentional */
  align-items: start;               /* Left-aligned */
}
```

**Instead of Inter Font**:
```css
/* ❌ AI Slop */
font-family: 'Inter', sans-serif;

/* ✅ Philosophy-Driven (Brutalist Joy) */
font-family: 'Bebas Neue', 'Arial Black', sans-serif;  /* Character */
```

**Instead of Uniform Corners**:
```css
/* ❌ AI Slop */
border-radius: 12px;  /* Every element */

/* ✅ Philosophy-Driven (Brutalist Joy) */
border-radius: 0;     /* Sharp, architectural */

/* ✅ Philosophy-Driven (Organic Systems) */
border-radius: 24px 8px;  /* Asymmetric, organic */
```

**Reference**: See `references/anti-ai-slop.md` for comprehensive guide

---

## Design System Integration

### Material Design 3 Theming

```tsx
import { ThemeProvider, createTheme } from '@mui/material';

// Apply Chromatic Silence philosophy to Material Design
const chromaticTheme = createTheme({
  palette: {
    primary: { main: '#FF6F61' },    // Color zone 1
    secondary: { main: '#6B5B95' },  // Color zone 2
    background: { default: '#FAFAFA' }
  },
  typography: {
    fontFamily: 'Futura, Helvetica, sans-serif',
    h1: { fontSize: '3rem', fontWeight: 300 },  // Minimal
    body1: { fontSize: '0.875rem', color: '#2C2C2C' }  // Small, restrained
  },
  spacing: 12  // Generous spacing
});

export function App() {
  return (
    <ThemeProvider theme={chromaticTheme}>
      {/* Your Material UI components */}
    </ThemeProvider>
  );
}
```

**Reference**: See `references/material-theming.md`

### Fluent UI 2 Theming

```tsx
import { FluentProvider, webLightTheme } from '@fluentui/react-components';

// Apply Geometric Precision philosophy to Fluent
const geometricTheme = {
  ...webLightTheme,
  colorBrandBackground: '#004E89',
  fontFamilyBase: 'Helvetica Neue, sans-serif',
  borderRadiusNone: '0px',  // Sharp, precise
  spacingHorizontalL: '24px'  // Grid-based spacing
};

export function App() {
  return (
    <FluentProvider theme={geometricTheme}>
      {/* Your Fluent UI components */}
    </FluentProvider>
  );
}
```

**Reference**: See `references/fluent-theming.md`

### Carbon Design System

```tsx
import { Theme } from '@carbon/react';

// Apply Brutalist Joy to Carbon
export function App() {
  return (
    <Theme theme="g100">  {/* Dark theme base */}
      <div className="brutalist-overrides">
        {/* Carbon components with philosophy overrides */}
      </div>
    </Theme>
  );
}
```

---

## Typography + Accessibility

### Font Pairing Guidelines

**Readability Requirements** (WCAG 2.2):
- **Minimum size**: 16px body text (or 14px for 1.5 line-height)
- **Line height**: 1.5× minimum for body text
- **Line length**: 50-75 characters (optimal readability)
- **Contrast**: 4.5:1 for normal text, 3:1 for large text

**Philosophy-Driven Pairings**:

**Brutalist Joy**:
- Heading: Bebas Neue (condensed, architectural)
- Body: Work Sans (geometric, readable)
- Contrast: ✅ 4.8:1 on white

**Chromatic Silence**:
- Heading: Futura (geometric precision)
- Body: Helvetica Neue (clean, minimal)
- Contrast: ✅ 5.2:1 on white

**Organic Systems**:
- Heading: Circular (rounded, friendly)
- Body: Inter (but with custom letter-spacing)
- Contrast: ✅ 4.6:1 on white

**Geometric Precision**:
- Heading: Helvetica (Swiss classic)
- Body: Georgia (serif, readability)
- Contrast: ✅ 7.1:1 on white (AAA)

**Analog Meditation**:
- Heading: Lora (serif, elegant)
- Body: Crimson Text (readable serif)
- Contrast: ✅ 6.8:1 on white (AAA)

**Reference**: See `references/typography-accessibility.md` for complete guide

---

## Integration with canvas-design Skill

**Workflow**:
1. Use `canvas-design` to create visual philosophy (.md file)
2. Use `design-philosophy` to apply philosophy to React artifacts
3. Validate accessibility with `accessibility-audit` skill
4. Capture baseline with `visual-regression` skill

**Example**:
```
User: "Create a Brutalist Joy design for a dashboard"

Step 1 (canvas-design):
→ Generates design philosophy document
→ Creates visual mockup (.png or .pdf)

Step 2 (design-philosophy):
→ Maps philosophy to design tokens
→ Applies tokens to React components
→ Ensures WCAG 2.2 compliance

Step 3 (accessibility-audit):
→ Validates color contrast (4.5:1)
→ Checks typography readability
→ Verifies 24x24px tap targets

Step 4 (visual-regression):
→ Captures baseline snapshot
→ Future changes compared against philosophy
```

---

## Common Workflows

### Styling shadcn/ui Artifact
1. Choose philosophy (e.g., Geometric Precision)
2. Load token mapping from `assets/themes/geometric-precision.json`
3. Apply tokens to shadcn components via Tailwind classes
4. Validate with `accessibility-audit`

### Multi-Brand Support
1. Create philosophy for each brand
2. Store token mappings in `assets/themes/brand-a.json`, `brand-b.json`
3. Switch themes via design-tokens skill
4. Maintain consistent philosophy across brands

### Migrating from Generic Design
1. Audit current design for AI slop patterns
2. Choose appropriate philosophy
3. Systematically replace gradients, fonts, layouts
4. Validate improvements with visual regression

---

## Resources

### assets/themes/
- `brutalist-joy.json` - Bold, geometric, high-contrast tokens
- `chromatic-silence.json` - Color-focused, minimal text tokens
- `organic-systems.json` - Natural, rounded, clustered tokens
- `geometric-precision.json` - Grid-based, Swiss formalism tokens
- `analog-meditation.json` - Texture, calm, contemplative tokens

### references/
- `philosophy-catalog.md` - Detailed philosophy guidelines
- `anti-ai-slop.md` - Comprehensive guide to avoiding generic AI design
- `typography-accessibility.md` - Font pairing + WCAG compliance
- `material-theming.md` - Material Design 3 integration
- `fluent-theming.md` - Fluent UI 2 integration
- `react-theming.md` - React artifact theming patterns

## Related Skills

- `canvas-design` - Visual philosophy creation (extends to React artifacts)
- `accessibility-audit` - Validates philosophy token contrast ratios
- `design-tokens` - Applies philosophy tokens to design system
- `component-patterns` - Styles accessible templates with philosophy
