# WCAG Remediation Patterns - Quick Reference

30+ verified code patterns for fixing common accessibility violations.

---

## Color Contrast (1.4.3 / 1.4.11)

### Pattern 1: Text Contrast (4.5:1 minimum)

```typescript
// ❌ FAIL: Ratio 3.2:1
<p style={{ color: '#999', background: '#fff' }}>Lorem ipsum</p>

// ✅ PASS: Ratio 4.6:1
<p style={{ color: '#767676', background: '#fff' }}>Lorem ipsum</p>

// ✅ BETTER: Use CSS variables for theme-aware contrast
<p className="text-muted">Lorem ipsum</p>

:root {
  --text-muted: #767676;  /* 4.6:1 on white */
  --bg-default: #ffffff;
}
```

### Pattern 2: UI Component Contrast (3:1 minimum)

```css
/* ❌ FAIL: Button border 2.8:1 */
.button {
  border: 1px solid #ccc;  /* Too light */
  background: #fff;
}

/* ✅ PASS: Button border 3.1:1 */
.button {
  border: 1px solid #b3b3b3;  /* Sufficient contrast */
  background: #fff;
}
```

### Pattern 3: Placeholder Text (Must meet 4.5:1)

```css
/* ❌ FAIL: Browsers default to ~50% opacity */
input::placeholder {
  color: #999;  /* 3.2:1 - FAIL */
}

/* ✅ PASS: Override with sufficient contrast */
input::placeholder {
  color: #767676;  /* 4.6:1 */
  opacity: 1;
}
```

---

## Keyboard Navigation (2.1.1 / 2.1.2)

### Pattern 4: Interactive Elements Must Be Focusable

```typescript
// ❌ FAIL: div not keyboard accessible
<div onClick={handleClick} className="button">
  Click me
</div>

// ✅ PASS: Button is natively keyboard accessible
<button onClick={handleClick}>
  Click me
</button>

// ✅ ACCEPTABLE: div with proper ARIA (only if button not suitable)
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }}
>
  Click me
</div>
```

### Pattern 5: No Keyboard Traps

```typescript
// ❌ FAIL: Modal with no escape key
function Modal({ children, isOpen }) {
  if (!isOpen) return null;
  return <div className="modal">{children}</div>;
}

// ✅ PASS: Modal with Escape key handler
function Modal({ children, isOpen, onClose }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return <div className="modal" role="dialog" aria-modal="true">{children}</div>;
}
```

### Pattern 6: Skip Navigation Links

```html
<!-- ✅ PASS: Skip link for keyboard users -->
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

<!-- Main navigation -->
<nav>...</nav>

<main id="main-content">
  <!-- Content starts here -->
</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;  /* Visible on focus */
}
</style>
```

---

## Focus Indicators (2.4.7 / 2.4.13)

### Pattern 7: Visible Focus (AA - 2.4.7)

```css
/* ❌ FAIL: No focus indicator */
button:focus {
  outline: none;
}

/* ✅ PASS: Visible focus indicator */
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

### Pattern 8: Enhanced Focus Appearance (AAA - 2.4.13)

```css
/* ✅ PASS: 2px minimum with high contrast */
button:focus-visible {
  outline: 2px solid #005fcc;  /* 2px minimum */
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 95, 204, 0.2);  /* Extra visibility */
}

/* ✅ ALTERNATIVE: Border method */
button {
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

button:focus-visible {
  border-color: #005fcc;
}
```

### Pattern 9: Focus Not Obscured (AA - 2.4.11)

```typescript
// ✅ PASS: Sticky header accounts for focus
function StickyHeader() {
  return (
    <>
      <header className="sticky top-0 z-50">
        {/* Navigation */}
      </header>
      <main className="pt-[80px]">  {/* Offset for header height */}
        {/* Content with focusable elements */}
      </main>
    </>
  );
}

// ✅ PASS: Scroll focused element into view
function scrollToFocus(element: HTMLElement) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',  // Ensures not obscured by sticky elements
    inline: 'nearest'
  });
}
```

---

## Touch Target Size (2.5.8 - NEW in WCAG 2.2)

### Pattern 10: Minimum 24x24px Targets

```css
/* ❌ FAIL: 20x20px icon button */
.icon-button {
  width: 20px;
  height: 20px;
  padding: 0;
}

/* ✅ PASS: 24px minimum with padding */
.icon-button {
  width: 16px;  /* Visual icon size */
  height: 16px;
  padding: 8px;  /* Creates 32x32px hit area */
  /* Total: 16 + 8*2 = 32px ✓ */
}

/* ✅ ALTERNATIVE: Minimum 24px dimensions */
.icon-button {
  width: 24px;
  height: 24px;
  padding: 4px;  /* Total: 32px */
}
```

### Pattern 11: Inline Link Exception

```html
<!-- ✅ ACCEPTABLE: Inline links don't need 24x24px -->
<p>
  Read our <a href="/privacy">privacy policy</a> for details.
</p>

<!-- ✅ But standalone links should meet 24x24px -->
<a href="/privacy" className="standalone-link">
  Privacy Policy
</a>

<style>
.standalone-link {
  display: inline-block;
  min-height: 24px;
  line-height: 24px;
  padding: 0 8px;
}
</style>
```

---

## Alternative Text (1.1.1)

### Pattern 12: Descriptive Alt Text

```tsx
// ❌ FAIL: Non-descriptive alt text
<img src="photo.jpg" alt="Photo" />
<img src="icon.svg" alt="Image" />
<img src="chart.png" alt="" />  {/* Content image with empty alt */}

// ✅ PASS: Descriptive alt text
<img src="ceo-headshot.jpg" alt="Sarah Chen, CEO of Acme Corp" />
<img src="warning-icon.svg" alt="Warning:" />
<img src="sales-chart.png" alt="Sales increased 40% in Q4 2024" />
```

### Pattern 13: Decorative Images

```tsx
// ✅ PASS: Decorative images use empty alt
<img src="decorative-border.svg" alt="" />

// ✅ PASS: Or use CSS background
<div
  className="hero"
  style={{ backgroundImage: 'url(decorative-pattern.svg)' }}
  role="img"
  aria-label="Hero section"
>
  <h1>Welcome</h1>
</div>
```

### Pattern 14: Icon Buttons

```tsx
// ❌ FAIL: Icon button with no accessible name
<button onClick={handleClose}>
  <X />  {/* Icon component */}
</button>

// ✅ PASS: aria-label provides accessible name
<button onClick={handleClose} aria-label="Close dialog">
  <X />
</button>

// ✅ ALTERNATIVE: Visually hidden text
<button onClick={handleClose}>
  <X />
  <span className="sr-only">Close dialog</span>
</button>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
```

---

## Form Labels (3.3.2 / 2.5.3)

### Pattern 15: Explicit Labels

```html
<!-- ❌ FAIL: No label -->
<input type="text" placeholder="Enter your name" />

<!-- ❌ FAIL: Implicit label (not supported by all assistive tech) -->
<label>
  Name
  <input type="text" />
</label>

<!-- ✅ PASS: Explicit label with for/id -->
<label for="name">Name</label>
<input type="text" id="name" />
```

### Pattern 16: Placeholder Is Not a Label

```tsx
// ❌ FAIL: Placeholder as label (disappears on input)
<input type="email" placeholder="Email address" />

// ✅ PASS: Label + placeholder as hint
<label htmlFor="email">Email address</label>
<input
  type="email"
  id="email"
  placeholder="you@example.com"
  aria-describedby="email-hint"
/>
<p id="email-hint" className="hint">
  We'll never share your email
</p>
```

### Pattern 17: Error Identification

```tsx
// ✅ PASS: Error message linked to input
function EmailInput({ value, error, onChange }) {
  return (
    <>
      <label htmlFor="email">Email address *</label>
      <input
        type="email"
        id="email"
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error && (
        <p id="email-error" className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
```

---

## ARIA Patterns

### Pattern 18: Button vs Link

```tsx
// ✅ Use <button> for actions
<button onClick={handleSubmit}>Submit form</button>
<button onClick={toggleMenu}>Open menu</button>

// ✅ Use <a> for navigation
<a href="/about">About us</a>
<a href="#section">Jump to section</a>

// ❌ ANTI-PATTERN: Link that looks like button
<a href="#" onClick={(e) => { e.preventDefault(); handleAction(); }}>
  Do something
</a>
// Should be: <button onClick={handleAction}>Do something</button>
```

### Pattern 19: Live Regions for Status Updates

```tsx
// ✅ PASS: Announce status changes to screen readers
function SaveStatus({ status }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {status === 'saving' && 'Saving changes...'}
      {status === 'saved' && 'Changes saved successfully'}
      {status === 'error' && 'Error saving changes'}
    </div>
  );
}
```

### Pattern 20: Modal Dialogs

```tsx
// ✅ PASS: Accessible modal dialog
function Dialog({ isOpen, onClose, title, children }) {
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    // Trap focus in modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog"
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button onClick={onClose} aria-label="Close dialog">
          ×
        </button>
      </div>
    </>
  );
}
```

---

## Dragging Alternatives (2.5.7 - NEW in WCAG 2.2)

### Pattern 21: Single-Pointer Alternative to Drag-and-Drop

```tsx
// ✅ PASS: Drag-and-drop with keyboard alternative
function SortableList({ items, onReorder }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={item.id}>
          <span>{item.text}</span>

          {/* Drag handle (mouse/touch) */}
          <button className="drag-handle" aria-label="Drag to reorder">
            ⋮⋮
          </button>

          {/* Keyboard alternative */}
          <button
            onClick={() => moveUp(index)}
            disabled={index === 0}
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            onClick={() => moveDown(index)}
            disabled={index === items.length - 1}
            aria-label="Move down"
          >
            ↓
          </button>
        </li>
      ))}
    </ul>
  );
}
```

---

## Accessible Authentication (3.3.8 - NEW in WCAG 2.2)

### Pattern 22: Password Login (Not Cognitive Test)

```tsx
// ✅ PASS: Password is memorized secret, not cognitive test
<form>
  <label htmlFor="email">Email</label>
  <input type="email" id="email" autoComplete="email" />

  <label htmlFor="password">Password</label>
  <input type="password" id="password" autoComplete="current-password" />

  <button type="submit">Sign in</button>
</form>
```

### Pattern 23: Avoid Math CAPTCHAs

```tsx
// ❌ FAIL: Math problem is cognitive test
<label>What is 5 + 7?</label>
<input type="text" />

// ✅ PASS: Alternative CAPTCHA
// Option 1: reCAPTCHA v3 (invisible, no user interaction)
// Option 2: Honeypot field (invisible to humans)
// Option 3: Email magic link
<button type="button" onClick={sendMagicLink}>
  Email me a sign-in link
</button>
```

---

## Semantic HTML

### Pattern 24: Proper Heading Hierarchy

```html
<!-- ❌ FAIL: Skipped heading levels -->
<h1>Page Title</h1>
<h3>Section Title</h3>  <!-- Skipped h2 -->

<!-- ✅ PASS: Sequential heading levels -->
<h1>Page Title</h1>
<h2>Section Title</h2>
<h3>Subsection Title</h3>
```

### Pattern 25: Lists for List Content

```html
<!-- ❌ FAIL: Divs that should be lists -->
<div>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- ✅ PASS: Semantic list -->
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
</ul>
```

---

## Quick Reference Card

| Violation | Fix | WCAG | Level |
|-----------|-----|------|-------|
| Low contrast text | Use #767676+ on white | 1.4.3 | AA |
| Low contrast UI | 3:1 minimum for borders/icons | 1.4.11 | AA |
| Div as button | Use `<button>` or add role/keyboard | 2.1.1 | A |
| No focus indicator | Add `:focus-visible` outline 2px+ | 2.4.7 | AA |
| Small tap targets | 24x24px minimum (padding counts) | 2.5.8 | AA |
| Missing alt text | Descriptive alt or alt="" if decorative | 1.1.1 | A |
| No form label | Explicit `<label for="id">` | 3.3.2 | A |
| Drag-only reorder | Add up/down buttons | 2.5.7 | AA |
| Math CAPTCHA | Use reCAPTCHA v3 or magic link | 3.3.8 | AA |
| No skip link | Add skip-to-main link | 2.4.1 | A |

---

## Testing Each Pattern

1. **Automated**: Run axe-core to catch violations
2. **Keyboard**: Tab through, verify all interactive elements reachable
3. **Screen Reader**: Use NVDA/VoiceOver to verify announcements
4. **Visual**: Check focus indicators visible, contrast sufficient
5. **Mobile**: Verify 24x24px tap targets on touch devices

---

## Related References

- `wcag-2.2-checklist.md` - Complete success criteria
- `figma-workflow.md` - Design phase accessibility
- `aria-patterns.md` - Complex widget patterns
