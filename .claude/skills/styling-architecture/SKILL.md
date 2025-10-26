---
name: styling-architecture
description: Modern CSS-in-JS and styling architectures using Panda CSS (zero-runtime), Vanilla Extract (type-safe), and CVA (component variants). Use when implementing design systems, theming, or optimizing CSS bundle size. Reduces runtime overhead by 100% (zero-runtime) and provides full TypeScript safety.
---

# Styling Architecture

## Overview

Modern styling architectures with zero-runtime CSS-in-JS (Panda CSS), type-safe styling (Vanilla Extract), and component variant systems (CVA). Eliminates runtime overhead while maintaining developer experience and type safety.

**Goal**: Type-safe, performant styling with design token integration and minimal bundle size

## When to Use This Skill

Use this skill when:
- Implementing design systems with type-safe tokens
- Migrating from runtime CSS-in-JS (styled-components, Emotion)
- Optimizing CSS bundle size and runtime performance
- Creating themeable component libraries
- Building variant-based component APIs
- Implementing responsive design patterns
- Reducing CSS specificity conflicts

**Triggers**: "styling system", "CSS-in-JS", "Panda CSS", "Vanilla Extract", "design tokens", "theming", "component variants"

---

## Quick Start: Styling Library Decision Tree

### When to Use Panda CSS vs Vanilla Extract vs CVA

**Panda CSS** (Zero-runtime, utility-first):
- ✅ Zero runtime overhead (styles extracted at build time)
- ✅ Utility-first with type-safe props
- ✅ Automatic atomic CSS generation
- ✅ Design token integration (colors, spacing, typography)
- ✅ Responsive variants (`{ base: '16px', md: '18px', lg: '20px' }`)
- ✅ Best for: New projects, performance-critical apps

**Vanilla Extract** (Zero-runtime, CSS Modules++):
- ✅ Zero runtime overhead (compiles to CSS Modules)
- ✅ Full TypeScript safety (types for all CSS properties)
- ✅ Scoped styles (no global namespace pollution)
- ✅ Theme contracts (typed theme variables)
- ✅ CSS utility integration (Tailwind, Sprinkles)
- ✅ Best for: Component libraries, design systems

**CVA (Class Variance Authority)** (Variant API):
- ✅ Component variant API (size, color, intent)
- ✅ Compound variants (combine multiple variants)
- ✅ Default variants
- ✅ Works with any CSS solution (Tailwind, Panda, Vanilla Extract)
- ✅ Best for: UI component libraries (buttons, cards, badges)

**Use Multiple** when:
- Panda CSS for app styling + CVA for component variants
- Vanilla Extract for component library + CVA for variant API

---

## Panda CSS Patterns

### 1. Basic Styling

```typescript
import { css } from '../styled-system/css';

function Button({ children }) {
  return (
    <button className={css({
      bg: 'blue.500',
      color: 'white',
      px: 4,
      py: 2,
      rounded: 'md',
      _hover: { bg: 'blue.600' },
      _active: { bg: 'blue.700' }
    })}>
      {children}
    </button>
  );
}
```

### 2. Responsive Design

```typescript
import { css } from '../styled-system/css';

function ResponsiveCard() {
  return (
    <div className={css({
      // Mobile-first responsive design
      fontSize: { base: '14px', md: '16px', lg: '18px' },
      padding: { base: 4, md: 6, lg: 8 },
      display: { base: 'block', md: 'flex' },
      gap: { md: 4, lg: 6 }
    })}>
      Content
    </div>
  );
}
```

### 3. Design Tokens

```typescript
// panda.config.ts
import { defineConfig } from '@pandacss/dev';

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: '#3b82f6' },
          secondary: { value: '#8b5cf6' },
          danger: { value: '#ef4444' }
        },
        spacing: {
          xs: { value: '0.25rem' },
          sm: { value: '0.5rem' },
          md: { value: '1rem' },
          lg: { value: '1.5rem' },
          xl: { value: '2rem' }
        },
        fonts: {
          heading: { value: 'Inter, sans-serif' },
          body: { value: 'system-ui, sans-serif' }
        }
      }
    }
  }
});

// Usage with full type safety
import { css } from '../styled-system/css';

const heading = css({
  color: 'primary',
  fontFamily: 'heading',
  fontSize: '2xl',
  mb: 'lg'
});
```

### 4. Recipes (Reusable Styles)

```typescript
// recipes/button.ts
import { cva } from '../styled-system/css';

export const buttonRecipe = cva({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    rounded: 'md',
    fontWeight: 'medium',
    transition: 'all 0.2s'
  },
  variants: {
    visual: {
      solid: { bg: 'blue.500', color: 'white', _hover: { bg: 'blue.600' } },
      outline: { border: '1px solid', borderColor: 'blue.500', color: 'blue.500' },
      ghost: { bg: 'transparent', color: 'blue.500', _hover: { bg: 'blue.50' } }
    },
    size: {
      sm: { px: 3, py: 1.5, fontSize: 'sm' },
      md: { px: 4, py: 2, fontSize: 'md' },
      lg: { px: 6, py: 3, fontSize: 'lg' }
    }
  },
  defaultVariants: {
    visual: 'solid',
    size: 'md'
  }
});

// Usage
function Button({ visual, size, children }) {
  return <button className={buttonRecipe({ visual, size })}>{children}</button>;
}
```

### 5. Patterns (Layout Helpers)

```typescript
import { stack, hstack, vstack } from '../styled-system/patterns';

function LayoutExample() {
  return (
    <div className={vstack({ gap: 4, align: 'stretch' })}>
      <header className={hstack({ justify: 'between', p: 4 })}>
        <h1>Title</h1>
        <button>Action</button>
      </header>
      <main className={stack({ gap: 6, p: 6 })}>
        Content
      </main>
    </div>
  );
}
```

---

## Vanilla Extract Patterns

### 1. Basic Styles

```typescript
// button.css.ts
import { style } from '@vanilla-extract/css';

export const button = style({
  backgroundColor: '#3b82f6',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: '#2563eb'
  }
});

// Button.tsx
import * as styles from './button.css';

export function Button({ children }) {
  return <button className={styles.button}>{children}</button>;
}
```

### 2. Theme Contracts (Typed Themes)

```typescript
// theme.css.ts
import { createThemeContract, createTheme } from '@vanilla-extract/css';

// Define theme structure with type safety
export const vars = createThemeContract({
  color: {
    primary: null,
    secondary: null,
    background: null,
    text: null
  },
  space: {
    small: null,
    medium: null,
    large: null
  },
  font: {
    body: null,
    heading: null
  }
});

// Light theme
export const lightTheme = createTheme(vars, {
  color: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    background: '#ffffff',
    text: '#1f2937'
  },
  space: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  font: {
    body: 'system-ui, sans-serif',
    heading: 'Inter, sans-serif'
  }
});

// Dark theme
export const darkTheme = createTheme(vars, {
  color: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    background: '#111827',
    text: '#f3f4f6'
  },
  space: {
    small: '8px',
    medium: '16px',
    large: '24px'
  },
  font: {
    body: 'system-ui, sans-serif',
    heading: 'Inter, sans-serif'
  }
});

// Usage
import { style } from '@vanilla-extract/css';
import { vars } from './theme.css';

export const card = style({
  backgroundColor: vars.color.background,
  color: vars.color.text,
  padding: vars.space.medium,
  borderRadius: '8px'
});
```

### 3. Sprinkles (Utility System)

```typescript
// sprinkles.css.ts
import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: { '@media': 'screen and (min-width: 768px)' },
    desktop: { '@media': 'screen and (min-width: 1024px)' }
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex', 'block', 'inline'],
    flexDirection: ['row', 'column'],
    justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
    alignItems: ['flex-start', 'center', 'flex-end', 'stretch'],
    paddingTop: ['4px', '8px', '16px', '24px', '32px'],
    paddingBottom: ['4px', '8px', '16px', '24px', '32px'],
    paddingLeft: ['4px', '8px', '16px', '24px', '32px'],
    paddingRight: ['4px', '8px', '16px', '24px', '32px']
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom']
  }
});

export const sprinkles = createSprinkles(responsiveProperties);
export type Sprinkles = Parameters<typeof sprinkles>[0];

// Usage
function Card() {
  return (
    <div className={sprinkles({
      display: 'flex',
      flexDirection: { mobile: 'column', tablet: 'row' },
      padding: { mobile: '8px', tablet: '16px', desktop: '24px' },
      justifyContent: 'space-between'
    })}>
      Content
    </div>
  );
}
```

### 4. Style Variants

```typescript
// button.css.ts
import { styleVariants } from '@vanilla-extract/css';

const base = style({
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer'
});

export const buttonVariants = styleVariants({
  primary: [base, {
    backgroundColor: '#3b82f6',
    color: 'white'
  }],
  secondary: [base, {
    backgroundColor: '#8b5cf6',
    color: 'white'
  }],
  outline: [base, {
    backgroundColor: 'transparent',
    border: '1px solid #3b82f6',
    color: '#3b82f6'
  }]
});

// Usage
import { buttonVariants } from './button.css';

function Button({ variant = 'primary', children }) {
  return <button className={buttonVariants[variant]}>{children}</button>;
}
```

---

## CVA (Class Variance Authority) Patterns

### 1. Basic Variants

```typescript
import { cva } from 'class-variance-authority';

const button = cva('px-4 py-2 rounded font-medium', {
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white hover:bg-blue-600',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
      danger: 'bg-red-500 text-white hover:bg-red-600'
    },
    size: {
      small: 'text-sm px-3 py-1.5',
      medium: 'text-base px-4 py-2',
      large: 'text-lg px-6 py-3'
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium'
  }
});

// Usage
function Button({ intent, size, children }) {
  return <button className={button({ intent, size })}>{children}</button>;
}

// Examples:
<Button intent="primary" size="small">Small Primary</Button>
<Button intent="danger" size="large">Large Danger</Button>
<Button>Medium Primary (defaults)</Button>
```

### 2. Compound Variants

```typescript
import { cva } from 'class-variance-authority';

const button = cva('px-4 py-2 rounded', {
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-900'
    },
    outlined: {
      true: 'bg-transparent border-2'
    }
  },
  compoundVariants: [
    {
      intent: 'primary',
      outlined: true,
      className: 'border-blue-500 text-blue-500 hover:bg-blue-50'
    },
    {
      intent: 'secondary',
      outlined: true,
      className: 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }
  ]
});

// Usage
<Button intent="primary" outlined>Outlined Primary</Button>
```

### 3. TypeScript Integration

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const button = cva('px-4 py-2 rounded', {
  variants: {
    intent: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-900',
      danger: 'bg-red-500 text-white'
    },
    size: {
      small: 'text-sm px-3 py-1.5',
      medium: 'text-base px-4 py-2',
      large: 'text-lg px-6 py-3'
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'medium'
  }
});

// Extract types from CVA definition
type ButtonProps = VariantProps<typeof button> & {
  children: React.ReactNode;
};

function Button({ intent, size, children }: ButtonProps) {
  return <button className={button({ intent, size })}>{children}</button>;
}

// Full type safety:
<Button intent="primary" size="small">Typed</Button>
// @ts-expect-error - "invalid" is not a valid intent
<Button intent="invalid">Error</Button>
```

---

## Migration Patterns

### From styled-components to Panda CSS

**Before (styled-components)**:
```typescript
import styled from 'styled-components';

const Button = styled.button`
  background-color: ${props => props.primary ? '#3b82f6' : '#8b5cf6'};
  color: white;
  padding: 8px 16px;
  border-radius: 6px;

  &:hover {
    background-color: ${props => props.primary ? '#2563eb' : '#7c3aed'};
  }
`;

// Runtime: Styles generated on mount (~2-5ms overhead per component)
```

**After (Panda CSS)**:
```typescript
import { css, cva } from '../styled-system/css';

const button = cva({
  base: {
    color: 'white',
    px: 4,
    py: 2,
    rounded: 'md'
  },
  variants: {
    variant: {
      primary: { bg: 'blue.500', _hover: { bg: 'blue.600' } },
      secondary: { bg: 'purple.500', _hover: { bg: 'purple.600' } }
    }
  }
});

function Button({ variant = 'primary', children }) {
  return <button className={button({ variant })}>{children}</button>;
}

// Zero runtime: All styles extracted at build time
```

**100% runtime overhead eliminated** (0ms vs 2-5ms per component)

### From Emotion to Vanilla Extract

**Before (Emotion)**:
```typescript
import { css } from '@emotion/react';

function Card() {
  return (
    <div css={css`
      background-color: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `}>
      Content
    </div>
  );
}
```

**After (Vanilla Extract)**:
```typescript
// card.css.ts
import { style } from '@vanilla-extract/css';

export const card = style({
  backgroundColor: 'white',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
});

// Card.tsx
import * as styles from './card.css';

export function Card() {
  return <div className={styles.card}>Content</div>;
}
```

---

## Performance Optimization

### 1. Zero-Runtime CSS

```typescript
// ✅ Good - Zero runtime (Panda CSS)
import { css } from '../styled-system/css';

const button = css({ bg: 'blue.500', px: 4, py: 2 });

// Compiled to static CSS at build time:
// .css-button { background: #3b82f6; padding-left: 1rem; padding-right: 1rem; }
```

```typescript
// ❌ Bad - Runtime overhead (styled-components)
import styled from 'styled-components';

const Button = styled.button`
  background: #3b82f6;
  padding: 1rem;
`;

// Styles generated on mount (~2-5ms overhead + CSS injection)
```

### 2. Atomic CSS

```typescript
// Panda CSS automatically generates atomic classes
import { css } from '../styled-system/css';

const card1 = css({ bg: 'white', p: 4, rounded: 'md' });
const card2 = css({ bg: 'white', p: 4, rounded: 'lg' });

// Compiled to:
// .bg-white { background: white; }
// .p-4 { padding: 1rem; }
// .rounded-md { border-radius: 0.375rem; }
// .rounded-lg { border-radius: 0.5rem; }

// CSS reused across components → smaller bundle size
```

### 3. Tree-Shaking

```typescript
// Only import what you use
import { css } from '../styled-system/css';
import { hstack } from '../styled-system/patterns';

// Unused patterns/recipes automatically tree-shaken
// Final bundle only includes css() and hstack()
```

---

## Resources

### scripts/
- `migrate-to-panda.js` - styled-components → Panda CSS migration script
- `generate-design-tokens.js` - Figma → Panda tokens script

### references/
- `references/panda-patterns.md` - Recipes, patterns, responsive design
- `references/vanilla-extract-patterns.md` - Themes, sprinkles, style variants
- `references/cva-patterns.md` - Component variants, compound variants
- `references/zero-runtime-migration.md` - styled-components/Emotion → Panda/Vanilla Extract

### assets/
- `assets/design-tokens/` - Theme token examples
- `assets/component-variants/` - CVA variant templates

## Related Skills

- `design-tokens` - Design token automation with Figma sync
- `component-patterns` - Component composition and API design
- `performance-optimization` - CSS bundle size optimization
- `testing-strategies` - Visual regression testing for styles
