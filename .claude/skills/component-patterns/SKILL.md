---
name: component-patterns
description: Accessible component templates using shadcn/ui and Radix primitives. Use when scaffolding new components, ensuring WCAG 2.2 compliance, implementing ARIA patterns (Dialog, Menu, Tabs, Combobox), or building design system components. Includes 50+ copy-paste ready templates with full keyboard navigation and screen reader support.
---

# Accessible Component Patterns

## Overview

Copy-paste accessible component templates built on shadcn/ui and Radix primitives. All patterns are WCAG 2.2 AA compliant with full keyboard navigation, screen reader support, and focus management.

**Philosophy**: Own the code (no installation) + Battle-tested patterns (Radix primitives)

## When to Use This Skill

Use this skill when:
- Building new components from scratch
- Ensuring WCAG 2.2 compliance (24x24px targets, focus management)
- Implementing WAI-ARIA design patterns
- Creating design system components
- Needing keyboard navigation and screen reader support
- Avoiding common accessibility mistakes

**Triggers**: "accessible component", "dialog pattern", "shadcn template", "ARIA pattern", "keyboard navigation"

---

## Quick Start: Pattern Selection

### Step 1: Choose Pattern Category

**Interactive Widgets** (High complexity ARIA):
- Dialog, Menu, Combobox, Tabs, Accordion

**Form Controls** (Data entry):
- Input, Select, Checkbox, Radio, Switch, Slider

**Feedback** (User notifications):
- Toast, Alert, Progress, Skeleton

**Navigation** (Site structure):
- Breadcrumb, Pagination, Command Palette

**Layout** (Content organization):
- Card, Table, List, Drawer

**Reference**: See `references/pattern-catalog.md` for all 50+ patterns

### Step 2: Copy Template

Templates in `assets/templates/` are copy-paste ready:

```bash
# Example: Copy Dialog template
cp .claude/skills/component-patterns/assets/templates/dialog.tsx ./src/components/Dialog.tsx
```

### Step 3: Customize & Validate

1. Update props/styles for your design system
2. Run accessibility audit: `node .claude/skills/accessibility-audit/scripts/axe-audit.js`
3. Test keyboard navigation manually
4. Capture visual baseline (visual-regression skill)

---

## Top 10 Essential Patterns

### 1. Dialog (Modal/Non-Modal)

**WCAG Requirements**: Focus trap, Escape to close, Return focus on close, aria-modal

**Template** (`assets/templates/dialog.tsx`):
```tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function AccessibleDialog({
  title,
  description,
  children,
  trigger
}: DialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />

        <Dialog.Content
          className="dialog-content"
          aria-describedby="dialog-description"
        >
          <Dialog.Title className="dialog-title">
            {title}
          </Dialog.Title>

          <Dialog.Description id="dialog-description">
            {description}
          </Dialog.Description>

          {children}

          <Dialog.Close asChild>
            <button className="dialog-close" aria-label="Close dialog">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Keyboard Navigation**:
- `Tab` - Move focus within dialog
- `Escape` - Close dialog
- `Shift+Tab` - Reverse focus direction

**A11y Features**:
- ✅ Focus trap (can't tab outside dialog)
- ✅ `aria-modal="true"` for screen readers
- ✅ Return focus to trigger on close
- ✅ `aria-labelledby` links title
- ✅ `aria-describedby` links description

---

### 2. Dropdown Menu

**WCAG Requirements**: Arrow key navigation, typeahead, focus management

**Template** (`assets/templates/menu.tsx`):
```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function AccessibleMenu({ trigger, items }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu-content">
          {items.map((item) => (
            item.separator ? (
              <DropdownMenu.Separator key={item.id} />
            ) : (
              <DropdownMenu.Item
                key={item.id}
                onSelect={item.onSelect}
                disabled={item.disabled}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="menu-shortcut">{item.shortcut}</span>
                )}
              </DropdownMenu.Item>
            )
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

**Keyboard Navigation**:
- `ArrowDown` / `ArrowUp` - Navigate items
- `Enter` / `Space` - Select item
- `Escape` - Close menu
- `Type character` - Jump to item (typeahead)

---

### 3. Tabs

**WCAG Requirements**: Arrow key navigation, automatic/manual activation, focus management

**Template** (`assets/templates/tabs.tsx`):
```tsx
import * as Tabs from '@radix-ui/react-tabs';

export function AccessibleTabs({ tabs, defaultValue }: TabsProps) {
  return (
    <Tabs.Root defaultValue={defaultValue} className="tabs-root">
      <Tabs.List aria-label="Manage your account" className="tabs-list">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="tabs-trigger"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Content
          key={tab.value}
          value={tab.value}
          className="tabs-content"
        >
          {tab.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
```

**Keyboard Navigation**:
- `ArrowLeft` / `ArrowRight` - Navigate tabs
- `Home` / `End` - First/last tab
- `Tab` - Move focus into panel

---

### 4. Combobox (Autocomplete)

**WCAG Requirements**: ARIA 1.2 combobox pattern, listbox role, keyboard navigation

**Template** (`assets/templates/combobox.tsx`):
```tsx
import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export function AccessibleCombobox({
  options,
  value,
  onValueChange,
  placeholder
}: ComboboxProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className="combobox-trigger">
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown size={16} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="combobox-content">
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="combobox-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={16} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
```

**Keyboard Navigation**:
- `ArrowDown` / `ArrowUp` - Navigate options
- `Enter` - Select option
- `Type character` - Filter options (typeahead)
- `Escape` - Close dropdown

---

### 5. Accordion

**WCAG Requirements**: Button role for headers, aria-expanded, single/multiple expand modes

**Template** (`assets/templates/accordion.tsx`):
```tsx
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

export function AccessibleAccordion({ items, type = "single" }: AccordionProps) {
  return (
    <Accordion.Root type={type} collapsible className="accordion-root">
      {items.map((item) => (
        <Accordion.Item key={item.value} value={item.value}>
          <Accordion.Header>
            <Accordion.Trigger className="accordion-trigger">
              {item.title}
              <ChevronDown className="accordion-chevron" aria-hidden />
            </Accordion.Trigger>
          </Accordion.Header>

          <Accordion.Content className="accordion-content">
            {item.content}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
```

**Modes**:
- `type="single"` - Only one item expanded
- `type="multiple"` - Multiple items can be expanded

---

### 6. Toast (Notification)

**WCAG Requirements**: ARIA live region, dismissible, sufficient display time

**Template** (`assets/templates/toast.tsx`):
```tsx
import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      {children}
      <Toast.Viewport className="toast-viewport" />
    </Toast.Provider>
  );
}

export function AccessibleToast({
  title,
  description,
  open,
  onOpenChange
}: ToastProps) {
  return (
    <Toast.Root
      open={open}
      onOpenChange={onOpenChange}
      className="toast-root"
    >
      <Toast.Title className="toast-title">{title}</Toast.Title>
      {description && (
        <Toast.Description className="toast-description">
          {description}
        </Toast.Description>
      )}
      <Toast.Close aria-label="Close" className="toast-close">
        <X size={16} />
      </Toast.Close>
    </Toast.Root>
  );
}
```

**A11y Features**:
- ✅ `role="status"` (ARIA live region)
- ✅ Screen reader announcement
- ✅ Dismissible with close button
- ✅ Auto-dismiss after timeout (configurable)

---

### 7. Form with Validation

**WCAG Requirements**: Explicit labels, error identification, aria-invalid

**Template** (`assets/templates/form.tsx`):
```tsx
export function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="email">Email address *</label>
        <input
          type="email"
          id="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <p id="email-error" className="form-error" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
```

**A11y Features**:
- ✅ Explicit `<label for="id">` association
- ✅ `aria-invalid` on error
- ✅ `aria-describedby` links error message
- ✅ `role="alert"` announces errors

---

### 8. Table (Sortable, Accessible)

**WCAG Requirements**: Semantic table markup, sort indicators, keyboard navigation

**Template** (`assets/templates/table.tsx`):
```tsx
export function AccessibleTable({ columns, data }: TableProps) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.id} scope="col">
              {col.sortable ? (
                <button
                  onClick={() => handleSort(col.id)}
                  aria-sort={
                    sortBy === col.id
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                >
                  {col.label}
                  {sortBy === col.id && (
                    <span aria-hidden>{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ) : (
                col.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.id}>{row[col.id]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**A11y Features**:
- ✅ `<th scope="col">` for headers
- ✅ `aria-sort` indicates sort direction
- ✅ Button for sortable headers (keyboard accessible)

---

### 9. Tooltip

**WCAG Requirements**: Dismissible, hoverable, persistent

**Template** (`assets/templates/tooltip.tsx`):
```tsx
import * as Tooltip from '@radix-ui/react-tooltip';

export function AccessibleTooltip({
  children,
  content
}: TooltipProps) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            className="tooltip-content"
            sideOffset={5}
          >
            {content}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
```

**WCAG 2.2 Compliance** (1.4.13):
- ✅ Dismissible (Escape key)
- ✅ Hoverable (cursor can move to tooltip)
- ✅ Persistent (doesn't disappear on hover)

---

### 10. Breadcrumb

**WCAG Requirements**: nav element, aria-label, aria-current

**Template** (`assets/templates/breadcrumb.tsx`):
```tsx
import { ChevronRight } from 'lucide-react';

export function AccessibleBreadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => (
          <li key={item.href}>
            {index < items.length - 1 ? (
              <>
                <a href={item.href}>{item.label}</a>
                <ChevronRight size={16} aria-hidden />
              </>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

**A11y Features**:
- ✅ `<nav aria-label="Breadcrumb">`
- ✅ `aria-current="page"` for current item
- ✅ `aria-hidden` on decorative icons

---

## shadcn/ui Integration

### Installation

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
```

### Why shadcn/ui?

1. **Own the code** - No npm installation, copy to your project
2. **Radix primitives** - Battle-tested accessibility
3. **Customizable** - Full control over styles
4. **WCAG compliant** - AA/AAA by default

**Reference**: See `references/shadcn-integration.md` for complete setup

---

## Pattern Catalog (50+ Patterns)

**Interactive Widgets**: Dialog, Menu, Combobox, Tabs, Accordion, Popover, Hover Card, Context Menu, Navigation Menu

**Form Controls**: Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider, Date Picker, Color Picker

**Feedback**: Toast, Alert, Alert Dialog, Progress, Skeleton, Spinner, Badge

**Navigation**: Breadcrumb, Pagination, Command Palette, Sidebar, Tabs

**Layout**: Card, Avatar, Separator, Aspect Ratio, Drawer, Sheet, Collapsible

**Data Display**: Table, List, Calendar, Chart

**Reference**: See `references/pattern-catalog.md` for complete list with code examples

---

## Resources

### assets/templates/
- `dialog.tsx` - Modal/non-modal dialog
- `menu.tsx` - Dropdown menu with keyboard nav
- `tabs.tsx` - Tab panels with arrow navigation
- `combobox.tsx` - Autocomplete (ARIA 1.2)
- `accordion.tsx` - Collapsible sections
- `toast.tsx` - Notifications (ARIA live)
- `form.tsx` - Form with validation
- `table.tsx` - Sortable accessible table
- `tooltip.tsx` - WCAG 2.2 compliant tooltip
- `breadcrumb.tsx` - Navigation breadcrumb
- ... (40 more patterns in references/pattern-catalog.md)

### references/
- `pattern-catalog.md` - All 50+ patterns with code
- `shadcn-integration.md` - shadcn/ui setup guide
- `radix-primitives.md` - Radix UI primitive documentation
- `aria-patterns.md` - WAI-ARIA authoring practices
- `keyboard-patterns.md` - Keyboard interaction patterns

## Related Skills

- `accessibility-audit` - Validate generated components with axe-core
- `design-tokens` - Style templates with design system tokens
- `visual-regression` - Capture baselines for template stories
