---
name: design-tokens
description: Design token automation from Figma to code using Token Studio, Specify, and Style Dictionary. Use when building design systems, synchronizing Figma variables with code, generating multi-platform tokens (CSS/SCSS/JS/Swift/Kotlin), or implementing theme switching. Achieves 300% ROI through automated token workflows.
---

# Design Tokens Automation

## Overview

Automate design token extraction, transformation, and synchronization between Figma and code. Supports Token Studio plugin, Specify sync, and Style Dictionary transformation for multi-platform output (web, iOS, Android).

**ROI**: 300%+ within 2 years for mid-sized teams (eliminates manual color/spacing updates)

## When to Use This Skill

Use this skill when:
- Building or maintaining a design system
- Synchronizing Figma variables with codebase
- Generating tokens for multiple platforms (CSS, SCSS, JavaScript, Swift, Kotlin)
- Implementing light/dark themes or brand variants
- Automating design → code handoff
- Ensuring design-code consistency

**Triggers**: Design system setup, theme implementation, Figma variable sync, token generation

---

## Quick Start: 3-Step Automation Workflow

### Step 1: Define Token Structure in Figma

Use Figma Variables or Token Studio plugin:

**Figma Native Variables** (Recommended for 2025):
```
Figma → Variables → Collections:

Collection: "Primitives" (base values)
  ├─ color/blue/100: #E3F2FD
  ├─ color/blue/500: #2196F3
  ├─ color/blue/900: #0D47A1
  ├─ spacing/xs: 4px
  ├─ spacing/sm: 8px
  └─ spacing/md: 16px

Collection: "Semantic" (contextual meaning)
  ├─ color/primary: {color/blue/500}
  ├─ color/text/primary: {color/gray/900}
  ├─ color/bg/default: {color/white}
  └─ spacing/button: {spacing/md}
```

**Token Studio Plugin** (for advanced features):
```
Plugins → Token Studio → Create tokens:

{
  "color": {
    "primary": { "value": "#2196F3", "type": "color" },
    "secondary": { "value": "#757575", "type": "color" }
  },
  "spacing": {
    "sm": { "value": "8px", "type": "spacing" },
    "md": { "value": "16px", "type": "spacing" }
  }
}
```

**Reference**: See `references/token-architecture.md` for semantic vs component token patterns

### Step 2: Extract Tokens to Repository

**Option A: Token Studio + GitHub Sync**

```bash
# In Figma:
1. Plugins → Token Studio → Settings
2. Connect to GitHub repository
3. Select branch (e.g., "design-tokens")
4. Click "Push to GitHub"

# In repository: tokens/ directory created
tokens/
  ├─ global.json        # Primitive tokens
  ├─ semantic.json      # Semantic tokens
  └─ themes/
      ├─ light.json
      └─ dark.json
```

**Option B: Specify Sync** (automated CI/CD)

```bash
# Install Specify CLI
npm install -g @specify/cli

# Configure in specify.config.json
{
  "repository": "@your-org/design-tokens",
  "figma": {
    "fileId": "abc123",
    "accessToken": "$FIGMA_ACCESS_TOKEN"
  },
  "output": {
    "path": "tokens/",
    "format": "json"
  }
}

# Sync from Figma (runs in CI/CD)
specify pull
```

**Reference**: See `references/extraction-methods.md` for comparison of methods

### Step 3: Transform Tokens with Style Dictionary

Style Dictionary converts JSON tokens to platform-specific formats:

```bash
# Install Style Dictionary
npm install style-dictionary

# Use configuration from assets/
cp .claude/skills/design-tokens/assets/style-dictionary.config.js ./

# Build tokens
npx style-dictionary build
```

**Output** (multi-platform):
```
build/
  ├─ css/
  │   ├─ variables.css          # CSS custom properties
  │   └─ themes/light.css
  ├─ scss/
  │   └─ _variables.scss        # Sass variables
  ├─ js/
  │   ├─ tokens.js              # JavaScript module
  │   └─ tokens.d.ts            # TypeScript types
  ├─ ios/
  │   └─ Tokens.swift           # Swift color/spacing
  └─ android/
      └─ tokens.xml             # Android resources
```

**Reference**: See `references/style-dictionary-guide.md` for platform configurations

---

## Token Architecture Best Practices

### Three-Tier Token System

**1. Primitive Tokens** (base values, never change):
```json
{
  "color": {
    "blue": {
      "100": { "value": "#E3F2FD" },
      "500": { "value": "#2196F3" },
      "900": { "value": "#0D47A1" }
    }
  }
}
```

**2. Semantic Tokens** (contextual meaning, reference primitives):
```json
{
  "color": {
    "primary": { "value": "{color.blue.500}" },
    "text": {
      "primary": { "value": "{color.gray.900}" },
      "secondary": { "value": "{color.gray.600}" }
    }
  }
}
```

**3. Component Tokens** (specific to component, reference semantic):
```json
{
  "button": {
    "background": { "value": "{color.primary}" },
    "text": { "value": "{color.white}" },
    "padding": { "value": "{spacing.md}" }
  }
}
```

**Why Three Tiers**:
- Primitive: Brand refresh? Change blue.500 once
- Semantic: Rebrand primary color? Update one reference
- Component: Button changes? Isolated to button tokens

**Reference**: See `references/token-architecture.md` for detailed patterns

---

## Theme Switching Implementation

### Light/Dark Mode with Token Modes

**Figma Setup**:
```
Collection: "Semantic" → Modes:
  ├─ Light Mode
  │   ├─ color/bg/default: white
  │   └─ color/text/primary: gray-900
  └─ Dark Mode
      ├─ color/bg/default: gray-900
      └─ color/text/primary: white
```

**CSS Output** (automatic):
```css
:root {
  /* Light mode (default) */
  --color-bg-default: #ffffff;
  --color-text-primary: #212529;
}

[data-theme="dark"] {
  /* Dark mode overrides */
  --color-bg-default: #212529;
  --color-text-primary: #ffffff;
}
```

**React Implementation**:
```tsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

---

## CI/CD Integration

Automate token sync in GitHub Actions:

```yaml
# .github/workflows/design-tokens.yml
name: Sync Design Tokens

on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
  workflow_dispatch:  # Manual trigger

jobs:
  sync-tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Pull tokens from Figma
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
        run: npx @specify/cli pull

      - name: Transform tokens with Style Dictionary
        run: npm run build:tokens

      - name: Commit changes
        run: |
          git config user.name "Design Token Bot"
          git config user.email "bot@example.com"
          git add .
          git commit -m "chore: sync design tokens from Figma" || exit 0
          git push

      - name: Create PR for review
        uses: peter-evans/create-pull-request@v5
        with:
          title: "Design Tokens Update"
          body: "Automated sync from Figma"
          branch: "design-tokens/sync"
```

**Benefits**:
- Designers update Figma → Tokens auto-sync overnight
- Developers review PR next morning
- No manual copy-paste of color values

---

## Multi-Brand Support

Manage multiple brand tokens from single source:

**Figma Structure**:
```
Collections:
  ├─ Brand A
  │   ├─ color/primary: #2196F3 (blue)
  │   └─ font/family: "Inter"
  └─ Brand B
      ├─ color/primary: #F44336 (red)
      └─ font/family: "Roboto"
```

**Style Dictionary Config**:
```js
// style-dictionary.config.js
module.exports = {
  source: ['tokens/brand-a/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/brand-a/css/',
      files: [{
        destination: 'variables.css',
        format: 'css/variables'
      }]
    }
  }
};

// Repeat for brand-b
```

**Output**:
```
build/
  ├─ brand-a/
  │   └─ css/variables.css    # --color-primary: #2196F3
  └─ brand-b/
      └─ css/variables.css    # --color-primary: #F44336
```

---

## Common Workflows

### Designer Workflow
1. Update Figma variables (colors, spacing, typography)
2. Token Studio → Push to GitHub (or wait for nightly sync)
3. Notify developers via Slack bot

### Developer Workflow
1. Pull latest from `design-tokens/sync` branch
2. Run `npm run build:tokens`
3. Review generated CSS/SCSS/JS
4. Merge to main after validation

### CI/CD Workflow (Automated)
1. Cron job runs nightly (12am)
2. Pull tokens from Figma API
3. Transform with Style Dictionary
4. Create PR for review
5. Auto-merge if tests pass + approved

---

## Metrics to Track

1. **Sync Frequency**: Daily, weekly, or on-demand
2. **Token Coverage**: % of hardcoded values replaced with tokens
3. **Build Time Impact**: Token generation overhead (<5s acceptable)
4. **Bundle Size**: Token overhead in production (2-5KB typical)
5. **Manual Updates Eliminated**: 300% ROI comes from zero manual syncs

**Goal**: 100% design-code consistency, zero manual color updates

---

## Resources

### assets/
- `style-dictionary.config.js` - Multi-platform transformation config
- `token-templates/` - Starter token structures for common use cases

### references/
- `token-architecture.md` - Three-tier token system (primitive → semantic → component)
- `extraction-methods.md` - Token Studio vs Specify comparison
- `style-dictionary-guide.md` - Platform transformation patterns
- `theme-switching.md` - Light/dark mode implementation

## Related Skills

- `accessibility-audit` - Validates token contrast ratios (WCAG 2.2)
- `visual-regression` - Detects unintended token changes
- `component-patterns` - Applies tokens to accessible component templates
