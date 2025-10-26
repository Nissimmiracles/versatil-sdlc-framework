# ui/ - User Interface Components

**Priority**: MEDIUM
**Agent(s)**: James-Frontend (primary owner)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

React components for VERSATIL dashboard, status displays, and configuration UI. Implements WCAG 2.1 AA accessibility and responsive design (mobile-first).

## 🎯 Core Concepts

- **Component Architecture**: Atomic design (atoms → molecules → organisms)
- **State Management**: React Context (AuthContext, ThemeContext)
- **Accessibility**: WCAG 2.1 AA compliance (tested with axe-core)

## ✅ Rules

### DO ✓
- ✓ Use semantic HTML (nav, main, article)
- ✓ Add ARIA labels for screen readers
- ✓ Test with keyboard navigation

### DON'T ✗
- ✗ Don't skip focus management
- ✗ Don't use div for buttons (use <button>)

## 🔧 Pattern: Accessible Button
```tsx
<button
  onClick={handleClick}
  aria-label="Submit authentication form"
  disabled={isLoading}
>
  {isLoading ? 'Submitting...' : 'Submit'}
</button>
```

## 📚 Docs
- [Component Library](../../docs/COMPONENT_LIBRARY.md)
- [Accessibility Guide](../../docs/ACCESSIBILITY.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('ui')`
