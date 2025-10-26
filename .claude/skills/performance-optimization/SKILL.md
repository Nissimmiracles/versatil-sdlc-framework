---
name: performance-optimization
description: Frontend performance optimization using Lighthouse, Core Web Vitals monitoring, and React performance patterns. Use when optimizing load times, fixing LCP/CLS/INP issues, implementing code splitting, or setting up performance budgets. Achieves 30-50% improvement in Core Web Vitals scores through systematic optimization.
---

# Performance Optimization

## Overview

Optimize frontend performance using Lighthouse audits, Core Web Vitals monitoring (LCP, CLS, INP), and React-specific optimization patterns. Combines lab testing with Real User Monitoring (RUM) for production performance tracking.

**Goal**: Lighthouse score ≥ 90, Core Web Vitals "Good" for 75%+ of users

## When to Use This Skill

Use this skill when:
- Lighthouse score < 90 or Core Web Vitals failing
- Optimizing initial load time (Time to Interactive > 3s)
- Implementing code splitting and lazy loading
- Setting up performance budgets for CI/CD
- Analyzing bundle size and dependencies
- Monitoring real user performance (RUM)

**Triggers**: "optimize performance", "Lighthouse audit", "Core Web Vitals", "slow loading", "bundle size"

---

## Quick Start: 4-Step Optimization Workflow

### Step 1: Run Lighthouse Audit

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run audit
lhci autorun --collect.url=http://localhost:3000

# Or use script
node .claude/skills/performance-optimization/scripts/lighthouse-audit.js http://localhost:3000
```

**Core Web Vitals Thresholds** (2025):
- **LCP** (Largest Contentful Paint): < 2.5s (Good), < 4.0s (Needs Improvement)
- **CLS** (Cumulative Layout Shift): < 0.1 (Good), < 0.25 (Needs Improvement)
- **INP** (Interaction to Next Paint): < 200ms (Good), < 500ms (Needs Improvement)

**Reference**: See `references/core-web-vitals.md` for optimization strategies

### Step 2: Analyze Bundle Size

```bash
# Vite: Rollup Visualizer
npm install --save-dev rollup-plugin-visualizer
npm run build

# Webpack: Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/stats.json

# Or use script
node .claude/skills/performance-optimization/scripts/bundle-analyzer.js
```

**Performance Budgets** (Recommended):
- Total bundle: < 200KB gzipped
- Initial JS: < 150KB gzipped
- Main CSS: < 50KB gzipped
- Images: WebP/AVIF, lazy loaded

**Reference**: See `assets/lighthouse-budgets.json` for budget templates

### Step 3: Apply React Performance Patterns

**Code Splitting with React.lazy**:
```tsx
import { lazy, Suspense } from 'react';

// ❌ BAD: Import everything upfront
import Dashboard from './Dashboard';
import Settings from './Settings';

// ✅ GOOD: Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

**React.memo for Expensive Components**:
```tsx
// ❌ BAD: Re-renders on every parent update
function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
}

// ✅ GOOD: Only re-renders when items change
const ExpensiveList = memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});
```

**useMemo for Expensive Calculations**:
```tsx
function Chart({ data }) {
  // ❌ BAD: Recalculates on every render
  const processedData = expensiveCalculation(data);

  // ✅ GOOD: Only recalculates when data changes
  const processedData = useMemo(
    () => expensiveCalculation(data),
    [data]
  );

  return <ChartComponent data={processedData} />;
}
```

**Reference**: See `references/react-performance.md` for 20+ patterns

### Step 4: Setup Performance Monitoring

**Real User Monitoring (RUM)**:
```tsx
// web-vitals library
import { onCLS, onINP, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  fetch('/analytics', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
}

onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
```

**CI/CD Performance Gates**:
```yaml
# .github/workflows/performance.yml
name: Performance Budget

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
      - name: Check budgets
        run: |
          # Fails if Lighthouse score < 90
          # Or bundle size > 200KB
```

---

## Core Web Vitals Optimization

### LCP (Largest Contentful Paint) < 2.5s

**Common Issues**:
- Large images not optimized
- Render-blocking JavaScript/CSS
- Slow server response time

**Solutions**:
```tsx
// ✅ Optimize images
<img
  src="/hero.webp"
  alt="Hero image"
  loading="eager"  // Critical image
  fetchPriority="high"
  width={1200}
  height={600}
/>

// ✅ Preload critical resources
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/hero.webp" as="image" />

// ✅ Use Next.js Image component
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority  // LCP image
/>
```

### CLS (Cumulative Layout Shift) < 0.1

**Common Issues**:
- Images without dimensions
- Dynamic content injection
- Web fonts causing FOUT/FOIT

**Solutions**:
```css
/* ✅ Reserve space for images */
img {
  aspect-ratio: 16 / 9;
  width: 100%;
  height: auto;
}

/* ✅ Use font-display: swap */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/custom.woff2');
  font-display: swap;  /* Prevents FOIT */
}

/* ✅ Skeleton loaders for dynamic content */
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  animation: shimmer 1.5s infinite;
}
```

### INP (Interaction to Next Paint) < 200ms

**Common Issues**:
- Long JavaScript tasks blocking main thread
- Expensive event handlers
- Large re-renders

**Solutions**:
```tsx
// ✅ Debounce expensive operations
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const debouncedSearch = useDebouncedCallback(
    (value) => performSearch(value),
    300  // 300ms debounce
  );

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}

// ✅ Use Web Workers for heavy computation
const worker = new Worker('/heavy-calc.worker.js');
worker.postMessage(data);
worker.onmessage = (e) => setResult(e.data);
```

---

## Bundle Optimization

**Dynamic Imports**:
```tsx
// ✅ Split vendor chunks
const Chart = lazy(() => import(/* webpackChunkName: "chart" */ 'chart.js'));

// ✅ Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: lazy(() => import('./pages/Dashboard'))
  },
  {
    path: '/settings',
    component: lazy(() => import('./pages/Settings'))
  }
];
```

**Tree Shaking**:
```tsx
// ❌ BAD: Imports entire library
import _ from 'lodash';

// ✅ GOOD: Import specific functions
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';

// ✅ BETTER: Use tree-shakeable alternative
import { debounce } from 'lodash-es';
```

---

## Performance Budgets

**Template** (`assets/lighthouse-budgets.json`):
```json
{
  "budgets": [{
    "resourceSizes": [{
      "resourceType": "script",
      "budget": 150
    }, {
      "resourceType": "stylesheet",
      "budget": 50
    }, {
      "resourceType": "image",
      "budget": 300
    }, {
      "resourceType": "total",
      "budget": 500
    }],
    "timings": [{
      "metric": "interactive",
      "budget": 3000
    }, {
      "metric": "first-contentful-paint",
      "budget": 1500
    }]
  }]
}
```

---

## Resources

### scripts/
- `lighthouse-audit.js` - Automated Lighthouse CI runner
- `bundle-analyzer.js` - Bundle size analysis and reporting

### references/
- `core-web-vitals.md` - LCP/CLS/INP optimization strategies
- `react-performance.md` - 20+ React optimization patterns
- `image-optimization.md` - WebP/AVIF conversion, lazy loading

### assets/
- `lighthouse-budgets.json` - Performance budget templates

## Related Skills

- `accessibility-audit` - Performance impacts accessibility (keyboard lag, screen reader)
- `visual-regression` - Prevent performance regressions with snapshot testing
- `component-patterns` - Templates include performance best practices
