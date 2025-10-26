---
name: micro-frontends
description: Micro-frontend architecture using Module Federation (Webpack/Rspack) and single-spa. Use when building large-scale applications with independent teams, enabling independent deployments and technology flexibility. Reduces deployment coupling and enables team autonomy.
---

# Micro-Frontends

## Overview

Micro-frontend architecture patterns using Module Federation and single-spa for building large-scale applications with independent teams. Enables independent deployments, technology flexibility, and team autonomy while maintaining a cohesive user experience.

**Goal**: Independent frontend deployments with shared runtime integration

## When to Use This Skill

Use this skill when:
- Large teams need independent deployments
- Multiple framework versions needed (React 17 + React 18)
- Gradual migration from legacy code
- Team autonomy required
- Independent feature development
- Shared component libraries across apps
- Different release cycles per team

**Triggers**: "micro-frontends", "Module Federation", "single-spa", "independent deployments", "monorepo alternatives"

---

## Quick Start: Architecture Decision Tree

### When to Use Module Federation vs single-spa vs Monorepo

**Module Federation** (Runtime Integration):
- ✅ Share code at runtime (no duplication)
- ✅ Independent deployments
- ✅ Version compatibility (load multiple React versions)
- ✅ Dynamic imports (load on demand)
- ✅ Best for: Webpack/Rspack apps, shared libraries, independent teams

**single-spa** (Framework-Agnostic):
- ✅ Mix frameworks (React + Vue + Angular)
- ✅ Gradual migration
- ✅ Lifecycle management
- ✅ Framework independence
- ✅ Best for: Legacy migration, polyglot frontends

**Monorepo** (Build-Time Integration):
- ✅ Shared TypeScript types
- ✅ Atomic commits across apps
- ✅ Easier refactoring
- ✅ Coordinated releases
- ✅ Best for: Single team, coordinated releases

---

## Module Federation Patterns

### 1. Basic Setup (Host + Remote)

```javascript
// Remote app (products): webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/components/ProductList',
        './ProductDetail': './src/components/ProductDetail'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' }
      }
    })
  ]
};

// Host app (shell): webpack.config.js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        products: 'products@http://localhost:3001/remoteEntry.js'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' }
      }
    })
  ]
};

// Host app: Use remote component
import React, { lazy, Suspense } from 'react';

const ProductList = lazy(() => import('products/ProductList'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductList />
    </Suspense>
  );
}
```

### 2. Dynamic Remote Loading

```typescript
// Load remote at runtime (URL from environment/API)
async function loadRemote(url: string, module: string) {
  await __webpack_init_sharing__('default');

  const container = await import(/* webpackIgnore: true */ url);
  await container.init(__webpack_share_scopes__.default);

  const factory = await container.get(module);
  return factory();
}

// Usage: Load remote dynamically
const ProductList = await loadRemote(
  'http://cdn.example.com/products/remoteEntry.js',
  './ProductList'
);
```

### 3. Shared State Management

```typescript
// Shared store in host
// Host: Expose shared store
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      exposes: {
        './store': './src/store'
      },
      shared: {
        zustand: { singleton: true }
      }
    })
  ]
};

// Remote: Import shared store
import { useStore } from 'shell/store';

function ProductList() {
  const user = useStore(state => state.user);
  return <div>Welcome {user.name}</div>;
}
```

---

## single-spa Patterns

### 1. Root Config

```typescript
// root-config.ts
import { registerApplication, start } from 'single-spa';

// Register micro-frontends
registerApplication({
  name: '@org/navbar',
  app: () => import('@org/navbar'),
  activeWhen: '/' // Always active
});

registerApplication({
  name: '@org/products',
  app: () => import('@org/products'),
  activeWhen: '/products'
});

registerApplication({
  name: '@org/checkout',
  app: () => import('@org/checkout'),
  activeWhen: '/checkout'
});

start();
```

### 2. React Micro-Frontend

```typescript
// products/src/root.component.tsx
import React from 'react';
import ReactDOM from 'react-dom';
import singleSpaReact from 'single-spa-react';
import App from './App';

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: App,
  errorBoundary(err, info, props) {
    return <div>Error loading products</div>;
  }
});

export const { bootstrap, mount, unmount } = lifecycles;
```

### 3. Framework Migration

```typescript
// Gradual migration: Angular to React
registerApplication({
  name: '@org/legacy-angular',
  app: () => import('@org/legacy-angular'), // Angular app
  activeWhen: '/admin'
});

registerApplication({
  name: '@org/new-react',
  app: () => import('@org/new-react'), // React app
  activeWhen: ['/dashboard', '/settings']
});

// Both can coexist and share routing
```

---

## Communication Patterns

### 1. CustomEvents (Decoupled)

```typescript
// Remote: Emit event
function ProductList() {
  const handleClick = (product) => {
    window.dispatchEvent(new CustomEvent('product:selected', {
      detail: { productId: product.id }
    }));
  };

  return <ProductCard onClick={handleClick} />;
}

// Host: Listen for event
useEffect(() => {
  const handler = (e) => {
    console.log('Product selected:', e.detail.productId);
    navigate(`/product/${e.detail.productId}`);
  };

  window.addEventListener('product:selected', handler);
  return () => window.removeEventListener('product:selected', handler);
}, []);
```

### 2. Shared EventBus

```typescript
// Shared event bus (exposed by host)
// host/src/eventBus.ts
import { EventEmitter } from 'events';

export const eventBus = new EventEmitter();

// Remote: Use event bus
import { eventBus } from 'shell/eventBus';

eventBus.emit('cart:add', { productId: '123', quantity: 1 });

// Host: Listen
eventBus.on('cart:add', (data) => {
  updateCart(data);
});
```

### 3. Shared Store (Zustand/Redux)

```typescript
// Host exposes store
export const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] }))
}));

// Remote imports and uses
import { useCartStore } from 'shell/store';

function AddToCart({ product }) {
  const addItem = useCartStore(state => state.addItem);

  return <button onClick={() => addItem(product)}>Add to Cart</button>;
}
```

---

## Deployment Patterns

### 1. Independent Deployments

```yaml
# products/.github/workflows/deploy.yml
name: Deploy Products
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - run: aws s3 sync ./dist s3://cdn.example.com/products/
      - run: aws cloudfront create-invalidation
```

### 2. Import Map (Runtime Configuration)

```html
<!-- index.html -->
<script type="importmap">
{
  "imports": {
    "products": "https://cdn.example.com/products/v1.2.3/remoteEntry.js",
    "checkout": "https://cdn.example.com/checkout/v2.1.0/remoteEntry.js"
  }
}
</script>
```

### 3. Versioning Strategy

```typescript
// Semantic versioning for remotes
const remotes = {
  products: 'products@https://cdn.example.com/products/latest/remoteEntry.js',
  checkout: 'checkout@https://cdn.example.com/checkout/v2/remoteEntry.js'
};

// Blue-green deployment: Switch versions instantly
const remotes = {
  products: process.env.PRODUCTS_VERSION === 'blue'
    ? 'products@https://cdn.example.com/products/blue/remoteEntry.js'
    : 'products@https://cdn.example.com/products/green/remoteEntry.js'
};
```

---

## Performance Optimization

### 1. Lazy Loading

```typescript
// Load remotes only when needed
const ProductDetail = lazy(() => import('products/ProductDetail'));

function App() {
  return (
    <Routes>
      <Route path="/product/:id" element={
        <Suspense fallback={<Skeleton />}>
          <ProductDetail />
        </Suspense>
      } />
    </Routes>
  );
}
```

### 2. Shared Dependencies

```javascript
// Share common libraries (load once)
shared: {
  react: { singleton: true, eager: true },
  'react-dom': { singleton: true, eager: true },
  'react-router-dom': { singleton: true },
  lodash: { singleton: false } // Allow duplicates if versions differ
}
```

### 3. Preloading

```html
<!-- Preload critical remotes -->
<link rel="preload" href="https://cdn.example.com/products/remoteEntry.js" as="script">
<link rel="prefetch" href="https://cdn.example.com/checkout/remoteEntry.js" as="script">
```

---

## Testing Strategies

### 1. Component Testing (Isolated)

```typescript
// Test remote component in isolation
import { render } from '@testing-library/react';
import ProductList from './ProductList';

test('renders products', () => {
  const { getByText } = render(<ProductList />);
  expect(getByText('Product 1')).toBeInTheDocument();
});
```

### 2. Integration Testing

```typescript
// Test host + remote integration
import { mount } from 'cypress';

cy.visit('/products');
cy.wait('@loadRemote'); // Wait for remote to load
cy.get('[data-testid="product-card"]').should('exist');
```

---

## Resources

### scripts/
- `create-micro-frontend.js` - Scaffold new micro-frontend
- `analyze-bundle.js` - Analyze shared dependencies

### references/
- `references/module-federation.md` - Module Federation patterns
- `references/single-spa.md` - single-spa lifecycle and routing
- `references/communication-patterns.md` - Inter-app communication
- `references/deployment-strategies.md` - CI/CD for micro-frontends

### assets/
- `assets/templates/` - Micro-frontend boilerplate templates

## Related Skills

- `state-management` - Shared store patterns
- `testing-strategies` - Testing micro-frontends
- `api-design` - Backend-for-frontend (BFF) pattern
- `microservices` - Backend microservices architecture
