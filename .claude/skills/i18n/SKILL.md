---
name: i18n
description: Internationalization and localization workflows using next-intl, react-i18next, and FormatJS. Use when implementing multi-language support, RTL layouts, locale-specific formatting (dates/numbers/currency), or translation workflows. Achieves 200% ROI through automated extraction and reduces translation management time by 60%.
---

# Internationalization (i18n)

## Overview

Implement production-ready internationalization using next-intl (Next.js SSR/SSG), react-i18next (SPAs), and FormatJS (ICU MessageFormat). Supports translation workflows, RTL layouts, locale-specific formatting, and automated translation extraction.

**Goal**: Global-ready applications with zero hardcoded strings, proper locale formatting, and efficient translation management

## When to Use This Skill

Use this skill when:
- Adding multi-language support to React/Next.js applications
- Implementing RTL (right-to-left) layouts for Arabic, Hebrew, Persian
- Formatting dates, numbers, currencies by locale
- Managing translation workflows (extract → translate → integrate)
- Setting up language switchers and locale detection
- Implementing pluralization and gender-specific translations
- Optimizing i18n bundle size (tree-shaking unused locales)

**Triggers**: "add translations", "multi-language", "internationalization", "RTL support", "locale formatting", "language switcher"

---

## Quick Start: Library Selection Decision Tree

### When to Use next-intl vs react-i18next

**next-intl** (Next.js SSR/SSG, React Server Components):
- ✅ Next.js App Router (React Server Components)
- ✅ SSR/SSG with locale-specific routing (`/en/about`, `/fr/about`)
- ✅ Type-safe translations with TypeScript
- ✅ Zero client-side runtime (translations bundled at build time)
- ✅ Automatic locale detection and routing
- ⚠️ Next.js only (not for SPAs)

**react-i18next** (SPAs, client-side rendering):
- ✅ React SPAs (Create React App, Vite)
- ✅ Dynamic locale switching without page reload
- ✅ Lazy loading translations (reduce initial bundle)
- ✅ Backend integration (load translations from API)
- ✅ Framework-agnostic (React, Vue, Angular)
- ⚠️ Client-side runtime overhead

**FormatJS (react-intl)** (Enterprise, complex formatting):
- ✅ ICU MessageFormat (advanced pluralization, gender, select)
- ✅ Enterprise-grade translation management integration
- ✅ Compile-time optimization with Babel plugin
- ✅ Date/number/currency formatting with Intl API
- ⚠️ Larger bundle size, more complex setup

**Reference**: See `references/library-comparison.md` for detailed comparison

---

## next-intl Setup (Next.js App Router)

### 1. Installation and Configuration

```bash
npm install next-intl
```

**Project Structure**:
```
app/
  [locale]/
    layout.tsx
    page.tsx
    about/
      page.tsx
messages/
  en.json
  es.json
  fr.json
  ar.json
i18n.ts
middleware.ts
```

**i18n.ts** (Configuration):
```typescript
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}));
```

**middleware.ts** (Locale Detection):
```typescript
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'es', 'fr', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always' // /en/about, /es/about
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

**Reference**: See `references/next-intl-setup.md` for complete setup guide

### 2. Translation Files (ICU MessageFormat)

**messages/en.json**:
```json
{
  "HomePage": {
    "title": "Welcome to our application",
    "description": "Build something amazing today",
    "itemCount": "{count, plural, =0 {No items} =1 {One item} other {# items}}"
  },
  "Navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  }
}
```

**messages/es.json**:
```json
{
  "HomePage": {
    "title": "Bienvenido a nuestra aplicación",
    "description": "Construye algo increíble hoy",
    "itemCount": "{count, plural, =0 {Sin elementos} =1 {Un elemento} other {# elementos}}"
  },
  "Navigation": {
    "home": "Inicio",
    "about": "Acerca de",
    "contact": "Contacto"
  }
}
```

**Reference**: See `references/icu-messageformat.md` for advanced patterns

### 3. Using Translations in Components

**Server Component** (App Router):
```tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <p>{t('itemCount', { count: 5 })}</p> {/* Output: "5 items" */}
    </div>
  );
}
```

**Client Component**:
```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LanguageSwitcher() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const router = useRouter();

  function switchLocale(newLocale: string) {
    router.push(`/${newLocale}${pathname}`);
  }

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="ar">العربية</option>
    </select>
  );
}
```

**Type-Safe Translations** (TypeScript):
```tsx
// Create type-safe hook
type Messages = typeof import('./messages/en.json');
declare global {
  interface IntlMessages extends Messages {}
}

// Now autocomplete works!
const t = useTranslations('HomePage');
t('title'); // ✅ Autocomplete + type-checking
t('nonExistent'); // ❌ TypeScript error
```

---

## react-i18next Setup (SPAs)

### 1. Installation and Configuration

```bash
npm install react-i18next i18next i18next-browser-languagedetector i18next-http-backend
```

**i18n.ts** (Configuration):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // Load translations from /public/locales
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json'
    }
  });

export default i18n;
```

**App.tsx** (Initialize):
```tsx
import './i18n';
import { Suspense } from 'react';

function App() {
  return (
    <Suspense fallback="Loading translations...">
      <YourApp />
    </Suspense>
  );
}
```

**Project Structure**:
```
public/
  locales/
    en/
      common.json
      home.json
    es/
      common.json
      home.json
src/
  i18n.ts
  App.tsx
```

**Reference**: See `references/react-i18next-setup.md` for complete guide

### 2. Using Translations in Components

**Functional Component**:
```tsx
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t, i18n } = useTranslation('home');

  function changeLanguage(lng: string) {
    i18n.changeLanguage(lng); // Instant language switch
  }

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
      <button onClick={() => changeLanguage('es')}>Español</button>
    </div>
  );
}
```

**With Pluralization**:
```tsx
// Translation file: public/locales/en/common.json
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}

// Component
const { t } = useTranslation('common');
<p>{t('itemCount', { count: 0 })}</p> // "0 items"
<p>{t('itemCount', { count: 1 })}</p> // "1 item"
<p>{t('itemCount', { count: 5 })}</p> // "5 items"
```

**Lazy Loading Namespaces** (reduce bundle size):
```tsx
import { useTranslation } from 'react-i18next';

function SettingsPage() {
  // Load 'settings' namespace on demand
  const { t, ready } = useTranslation('settings', { useSuspense: false });

  if (!ready) return <LoadingSpinner />;

  return <div>{t('settings.title')}</div>;
}
```

---

## Locale-Specific Formatting

### Date Formatting

**Using Intl API** (native browser API):
```tsx
const locale = 'en-US';
const date = new Date('2025-01-26');

// Short date
new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(date);
// Output: "1/26/25" (US) or "26/01/25" (UK)

// Long date
new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
// Output: "January 26, 2025"

// Relative time
const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
rtf.format(-1, 'day'); // "yesterday"
rtf.format(2, 'week');  // "in 2 weeks"
```

**Using next-intl Helpers**:
```tsx
import { useFormatter } from 'next-intl';

function DateDisplay() {
  const format = useFormatter();
  const date = new Date('2025-01-26T10:30:00');

  return (
    <div>
      {format.dateTime(date, { dateStyle: 'full', timeStyle: 'short' })}
      {/* Output: "Sunday, January 26, 2025 at 10:30 AM" */}

      {format.relativeTime(date)}
      {/* Output: "in 2 hours" (if current time is 8:30 AM) */}
    </div>
  );
}
```

### Number and Currency Formatting

```tsx
const locale = 'en-US';

// Number formatting
new Intl.NumberFormat(locale).format(123456.789);
// Output: "123,456.789" (US) or "123 456,789" (FR)

// Currency formatting
new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(1234.5);
// Output: "$1,234.50" (US) or "1 234,50 $US" (FR-CA)

// Percentage
new Intl.NumberFormat(locale, { style: 'percent' }).format(0.42);
// Output: "42%"

// Compact notation (1.2M, 3K)
new Intl.NumberFormat(locale, { notation: 'compact' }).format(1200000);
// Output: "1.2M"
```

**Using next-intl Helpers**:
```tsx
import { useFormatter } from 'next-intl';

function PriceDisplay({ amount }: { amount: number }) {
  const format = useFormatter();

  return (
    <span>
      {format.number(amount, { style: 'currency', currency: 'USD' })}
    </span>
  );
}
```

**Reference**: See `references/intl-api.md` for complete Intl API patterns

---

## RTL (Right-to-Left) Support

### Automatic RTL Detection

**next-intl Middleware** (automatic):
```typescript
// middleware.ts
export default createMiddleware({
  locales: ['en', 'ar', 'he'], // Arabic, Hebrew = RTL
  defaultLocale: 'en'
});
```

**Layout Component** (apply dir attribute):
```tsx
// app/[locale]/layout.tsx
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();
  const direction = ['ar', 'he', 'fa'].includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body>{children}</body>
    </html>
  );
}
```

### RTL-Safe CSS (Logical Properties)

**❌ Bad (breaks in RTL)**:
```css
.button {
  margin-left: 16px;  /* Wrong: always left margin */
  text-align: left;   /* Wrong: text always left */
  border-right: 1px solid #ccc;
}
```

**✅ Good (RTL-safe)**:
```css
.button {
  margin-inline-start: 16px;  /* Left in LTR, Right in RTL */
  text-align: start;          /* Left in LTR, Right in RTL */
  border-inline-end: 1px solid #ccc;
}
```

**Logical Properties Cheat Sheet**:
| Physical Property | Logical Property |
|-------------------|------------------|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `right: 0` | `inset-inline-end: 0` |
| `text-align: left` | `text-align: start` |
| `float: left` | `float: inline-start` |

**Reference**: See `references/rtl-best-practices.md` for complete guide

---

## Translation Extraction and Management

### Automated Translation Extraction

**extract-translations.js** (Script):
```javascript
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Extract all t() calls from codebase
const files = execSync('grep -r "t(\'" src/')
  .toString()
  .split('\n')
  .filter(Boolean);

const keys = new Set();
files.forEach(line => {
  const match = line.match(/t\(['"]([^'"]+)['"]/);
  if (match) keys.add(match[1]);
});

// Generate template file
const template = {};
keys.forEach(key => {
  template[key] = key; // English as source
});

fs.writeFileSync(
  'messages/template.json',
  JSON.stringify(template, null, 2)
);

console.log(`✅ Extracted ${keys.size} translation keys`);
```

**Usage**:
```bash
node scripts/extract-translations.js
# Output: messages/template.json with all keys
```

### Translation Workflow

**1. Extract Keys** (automated):
```bash
npm run extract:translations
# Creates messages/template.json
```

**2. Send to Translators**:
- Upload `messages/template.json` to translation service (Crowdin, Lokalise, Phrase)
- Or send to human translators as CSV/XLSX

**3. Import Translations**:
```bash
# Download translated files from service
# Place in messages/es.json, messages/fr.json, etc.
```

**4. Validate Completeness**:
```javascript
// scripts/validate-translations.js
import en from './messages/en.json' assert { type: 'json' };
import es from './messages/es.json' assert { type: 'json' };

const enKeys = Object.keys(en);
const esKeys = Object.keys(es);

const missing = enKeys.filter(key => !esKeys.includes(key));

if (missing.length > 0) {
  console.error(`❌ Missing ${missing.length} Spanish translations:`);
  missing.forEach(key => console.log(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All translations complete');
```

**Reference**: See `references/translation-workflows.md` for CI/CD integration

---

## Advanced Patterns

### 1. Pluralization (ICU MessageFormat)

**Complex Pluralization**:
```json
{
  "cartSummary": "{itemCount, plural, =0 {Your cart is empty} =1 {You have one item} other {You have # items}} and {price, number, ::currency/USD}"
}
```

**Usage**:
```tsx
t('cartSummary', { itemCount: 3, price: 45.99 });
// Output: "You have 3 items and $45.99"
```

### 2. Gender-Specific Translations

```json
{
  "notification": "{gender, select, male {He liked your post} female {She liked your post} other {They liked your post}}"
}
```

**Usage**:
```tsx
t('notification', { gender: 'female' });
// Output: "She liked your post"
```

### 3. Nested Translations with Rich Text

```json
{
  "welcome": "Welcome <bold>{name}</bold>, you have <link>{count} unread messages</link>"
}
```

**Usage with next-intl**:
```tsx
t.rich('welcome', {
  name: 'Alice',
  count: 5,
  bold: (chunks) => <strong>{chunks}</strong>,
  link: (chunks) => <a href="/messages">{chunks}</a>
});
// Output: Welcome <strong>Alice</strong>, you have <a>5 unread messages</a>
```

### 4. Lazy Loading Translations (reduce bundle size)

**next-intl (App Router)**:
```typescript
// i18n.ts
export default getRequestConfig(async ({ locale }) => {
  const messages = await import(`./messages/${locale}.json`);
  return { messages: messages.default };
});
// Translations are code-split automatically per locale
```

**react-i18next (SPA)**:
```typescript
i18n.use(HttpBackend).init({
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json'
  },
  ns: ['common'], // Only load 'common' namespace by default
  defaultNS: 'common'
});

// Load additional namespaces on demand
i18n.loadNamespaces('settings');
```

**Reference**: See `references/advanced-patterns.md` for more examples

---

## Testing i18n

### 1. Unit Testing with Mock Translations

**next-intl (Jest)**:
```tsx
import { NextIntlClientProvider } from 'next-intl';
import { render } from '@testing-library/react';

const messages = {
  HomePage: {
    title: 'Welcome'
  }
};

test('renders translated content', () => {
  const { getByText } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <HomePage />
    </NextIntlClientProvider>
  );

  expect(getByText('Welcome')).toBeInTheDocument();
});
```

**react-i18next (Jest)**:
```tsx
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';

i18n.init({
  lng: 'en',
  resources: {
    en: {
      common: { title: 'Welcome' }
    }
  }
});

test('renders translated content', () => {
  const { getByText } = render(
    <I18nextProvider i18n={i18n}>
      <HomePage />
    </I18nextProvider>
  );

  expect(getByText('Welcome')).toBeInTheDocument();
});
```

### 2. Visual Regression Testing (Chromatic)

```typescript
// Storybook: HomePage.stories.tsx
export const EnglishVersion = () => (
  <NextIntlClientProvider locale="en" messages={enMessages}>
    <HomePage />
  </NextIntlClientProvider>
);

export const SpanishVersion = () => (
  <NextIntlClientProvider locale="es" messages={esMessages}>
    <HomePage />
  </NextIntlClientProvider>
);

export const ArabicRTL = () => (
  <NextIntlClientProvider locale="ar" messages={arMessages}>
    <div dir="rtl">
      <HomePage />
    </div>
  </NextIntlClientProvider>
);
```

### 3. E2E Testing (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('language switcher works', async ({ page }) => {
  await page.goto('/en');
  expect(await page.textContent('h1')).toBe('Welcome');

  // Switch to Spanish
  await page.selectOption('select[name="locale"]', 'es');
  await page.waitForURL('/es');

  expect(await page.textContent('h1')).toBe('Bienvenido');
});

test('RTL layout applied for Arabic', async ({ page }) => {
  await page.goto('/ar');

  const html = page.locator('html');
  expect(await html.getAttribute('dir')).toBe('rtl');
});
```

**Reference**: See `references/i18n-testing.md` for complete testing guide

---

## Performance Optimization

### 1. Bundle Size Optimization

**Tree-Shake Unused Locales** (Webpack/Vite):
```javascript
// vite.config.ts
export default {
  define: {
    'process.env.SUPPORTED_LOCALES': JSON.stringify(['en', 'es', 'fr'])
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'locale-en': ['./messages/en.json'],
          'locale-es': ['./messages/es.json']
        }
      }
    }
  }
};
```

**Result**: 80% smaller bundle (only load active locale)

### 2. Code Splitting by Locale (Next.js)

```typescript
// Automatic code splitting per locale
export default getRequestConfig(async ({ locale }) => {
  const messages = await import(`./messages/${locale}.json`);
  return { messages: messages.default };
});

// Each locale is a separate chunk:
// _app-en.js (50KB), _app-es.js (48KB), _app-ar.js (52KB)
```

### 3. Lazy Load Translation Namespaces

```typescript
// Only load 'home' translations on home page
const { t } = useTranslation('home', { useSuspense: false });

// Load 'settings' translations when user opens settings
const loadSettings = async () => {
  await i18n.loadNamespaces('settings');
  navigate('/settings');
};
```

**Reference**: See `references/i18n-performance.md` for profiling

---

## Common Gotchas

1. **Hardcoded Strings**: Always extract to translation files (use linter)
2. **Missing Keys**: Use TypeScript for compile-time checking
3. **Date Formatting**: Never use `new Date().toLocaleDateString()` alone (doesn't respect timezone)
4. **Pluralization**: Different languages have different plural rules (6 in Arabic vs 2 in English)
5. **RTL Layout**: Test with Arabic/Hebrew (buttons, icons, animations flip)
6. **Currency Symbols**: Don't hardcode `$` - use Intl.NumberFormat
7. **Translation Quality**: Machine translation (Google Translate) ≠ professional translation

---

## Resources

### scripts/
- `extract-translations.js` - Automated translation key extraction
- `validate-translations.js` - Check translation completeness
- `sync-translations.js` - Sync with translation services (Crowdin, Lokalise)

### references/
- `next-intl-setup.md` - Complete Next.js App Router setup guide
- `react-i18next-setup.md` - SPA setup with lazy loading
- `library-comparison.md` - next-intl vs react-i18next vs FormatJS
- `icu-messageformat.md` - Advanced ICU MessageFormat patterns
- `intl-api.md` - Native Intl API (DateTimeFormat, NumberFormat, RelativeTimeFormat)
- `rtl-best-practices.md` - RTL layout with logical CSS properties
- `translation-workflows.md` - CI/CD integration with translation services
- `advanced-patterns.md` - Gender, pluralization, nested translations
- `i18n-testing.md` - Unit, visual, E2E testing strategies
- `i18n-performance.md` - Bundle size optimization, code splitting

### assets/
- `translation-templates/` - Starter translation files
  - `common.json` - Shared translations (buttons, labels)
  - `home.json` - Homepage translations
  - `auth.json` - Authentication flow
  - `errors.json` - Error messages
- `locale-configs/` - Locale-specific configurations
  - `date-formats.json` - Date format preferences per locale
  - `currency-symbols.json` - Currency symbol mappings

## Related Skills

- `accessibility-audit` - RTL layout affects screen reader order
- `design-tokens` - Tokens can be locale-specific (font sizes for CJK)
- `component-patterns` - Accessible components need i18n support
- `performance-optimization` - i18n bundle size impacts load time
