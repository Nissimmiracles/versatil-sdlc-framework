---
name: ui-library
description: React UI components for VERSATIL dashboard with WCAG 2.1 AA accessibility and responsive design. Use when building UI components, implementing atomic design (atoms → molecules → organisms), ensuring accessibility with axe-core, or managing state with React Context. Mobile-first responsive design.
tags: [ui, react, accessibility, wcag, responsive]
---

# ui/ - User Interface Components

**Priority**: LOW
**Agent(s)**: James-Frontend (primary owner)
**Last Updated**: 2025-10-26

## When to Use

- Building React components for VERSATIL dashboard
- Implementing atomic design (atoms → molecules → organisms)
- Ensuring WCAG 2.1 AA accessibility compliance
- Implementing responsive design (mobile-first)
- Managing state with React Context (AuthContext, ThemeContext)
- Testing accessibility with axe-core and keyboard navigation

## What This Library Provides

- **Component Architecture**: Atomic design pattern
- **State Management**: React Context (AuthContext, ThemeContext)
- **Accessibility**: WCAG 2.1 AA compliance (tested with axe-core)
- **Responsive Design**: Mobile-first with CSS Grid/Flexbox
- **Semantic HTML**: nav, main, article, section elements

## Core Conventions

### DO ✓
- ✓ Use semantic HTML (nav, main, article)
- ✓ Add ARIA labels for screen readers
- ✓ Test with keyboard navigation
- ✓ Implement mobile-first responsive design

### DON'T ✗
- ✗ Don't skip focus management
- ✗ Don't use div for buttons (use <button>)
- ✗ Don't ignore color contrast ratios (4.5:1 minimum)

## Quick Start

```tsx
import React from 'react';

// Accessible button component
function SubmitButton({ isLoading, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label="Submit authentication form"
      aria-busy={isLoading}
      disabled={isLoading}
      className="btn-primary"
    >
      {isLoading ? 'Submitting...' : 'Submit'}
    </button>
  );
}

// Semantic article component
function BlogPost({ title, content }: Props) {
  return (
    <article>
      <h2>{title}</h2>
      <section>
        <p>{content}</p>
      </section>
    </article>
  );
}
```

## Atomic Design Structure

```
atoms/
├── Button.tsx          # Basic button component
├── Input.tsx           # Form input component
└── Icon.tsx            # Icon component

molecules/
├── SearchBar.tsx       # Input + Button
├── FormField.tsx       # Label + Input + Error
└── Card.tsx            # Container with header/body

organisms/
├── Header.tsx          # Logo + Nav + SearchBar
├── Sidebar.tsx         # Nav links + User profile
└── DataTable.tsx       # Complex table with sorting/filtering
```

## Accessibility Checklist

- ✓ All interactive elements are keyboard accessible
- ✓ ARIA labels provided for screen readers
- ✓ Color contrast ratio ≥ 4.5:1 for normal text
- ✓ Focus indicators visible on all interactive elements
- ✓ Semantic HTML used (nav, main, article, etc.)
- ✓ Forms have associated labels
- ✓ Images have alt text

## React Context Pattern

```tsx
import { createContext, useContext } from 'react';

// Create context
const ThemeContext = createContext<Theme>('light');

// Provider
export function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Consumer hook
export function useTheme() {
  return useContext(ThemeContext);
}
```

## Related Documentation

- [references/atomic-design.md](references/atomic-design.md) - Atomic design patterns
- [references/accessibility-testing.md](references/accessibility-testing.md) - WCAG 2.1 AA testing
- [docs/COMPONENT_LIBRARY.md](../../../docs/COMPONENT_LIBRARY.md) - Component library guide
- [docs/ACCESSIBILITY.md](../../../docs/ACCESSIBILITY.md) - Accessibility guide

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/ui/**`
