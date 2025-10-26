---
name: testing-strategies
description: Modern testing strategies using Vitest (5-20x faster than Jest), Playwright (E2E with auto-wait), and MSW (API mocking). Use when implementing unit tests, integration tests, E2E tests, or API mocking. Achieves 80%+ code coverage with minimal test maintenance. Enforces quality gates before deployment.
---

# Testing Strategies

## Overview

Comprehensive testing strategies covering unit tests (Vitest), end-to-end tests (Playwright), and API mocking (MSW). Provides fast feedback loops, reliable tests, and high code coverage with minimal maintenance overhead.

**Goal**: 80%+ code coverage with fast, reliable, maintainable tests

## When to Use This Skill

Use this skill when:
- Setting up testing infrastructure (Vitest, Playwright, MSW)
- Writing unit tests for components and utilities
- Implementing E2E tests for critical user flows
- Mocking API calls for reliable tests
- Debugging flaky tests
- Optimizing test performance
- Setting up CI/CD quality gates
- Migrating from Jest to Vitest

**Triggers**: "testing", "test coverage", "Vitest", "Playwright", "E2E tests", "API mocking", "MSW", "test flakiness"

---

## Quick Start: Testing Framework Decision Tree

### When to Use Vitest vs Jest vs Playwright vs Cypress

**Vitest** (Unit/Integration Testing):
- ✅ 5-20x faster than Jest (native ESM, Vite-powered)
- ✅ Compatible with Jest API (easy migration)
- ✅ Built-in TypeScript support
- ✅ Watch mode with HMR-like speed
- ✅ Native code coverage (c8/v8)
- ✅ Best for: New projects, Vite/React/Vue apps, unit/integration tests

**Jest** (Unit/Integration Testing):
- ✅ Industry standard (mature ecosystem)
- ✅ Extensive plugin ecosystem
- ✅ Works with any bundler
- ✅ Snapshot testing
- ✅ Best for: Existing Jest projects, non-Vite projects, when ecosystem matters

**Playwright** (E2E Testing):
- ✅ Auto-wait (no manual waits needed)
- ✅ Multi-browser (Chromium, Firefox, WebKit)
- ✅ Network interception
- ✅ Parallel execution
- ✅ Video/screenshot on failure
- ✅ Best for: E2E tests, cross-browser testing, reliable automation

**Cypress** (E2E Testing):
- ✅ Developer-friendly API
- ✅ Time-travel debugging
- ✅ Real-time reloads
- ✅ Built-in retries
- ✅ Best for: Developer experience, visual testing, debugging

**MSW (API Mocking)**:
- ✅ Service Worker-based (no axios/fetch mocking)
- ✅ Works in browser and Node.js
- ✅ Network-level interception
- ✅ Reusable across unit/integration/E2E tests
- ✅ Best for: API mocking, consistent test data, offline development

---

## Vitest Patterns (Unit/Integration Tests)

### 1. Basic Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // Use global test functions (describe, it, expect)
    environment: 'jsdom', // Simulate browser environment
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*'
      ]
    }
  }
});
```

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

### 2. Component Testing (React)

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    const button = container.querySelector('button');

    expect(button).toHaveClass('btn-primary');
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
  });
});
```

### 3. Async Testing

```typescript
// UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    render(<UserProfile userId="123" />);

    // Initially shows loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify all data is displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('shows error message on fetch failure', async () => {
    // Mock failed API call
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Failed to fetch'))
    );

    render(<UserProfile userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 4. Mocking (Spies, Stubs, Mocks)

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock entire module
vi.mock('./api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'John' })),
  createUser: vi.fn()
}));

// Mock specific functions
describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it('fetches user data', async () => {
    const { fetchUser } = await import('./api');

    const user = await fetchUser('123');

    expect(fetchUser).toHaveBeenCalledWith('123');
    expect(user).toEqual({ id: 1, name: 'John' });
  });

  it('handles API errors', async () => {
    const { fetchUser } = await import('./api');
    fetchUser.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchUser('123')).rejects.toThrow('Network error');
  });
});

// Spy on existing function
describe('Analytics', () => {
  it('tracks page views', () => {
    const trackSpy = vi.spyOn(analytics, 'track');

    analytics.pageView('/home');

    expect(trackSpy).toHaveBeenCalledWith('pageview', { path: '/home' });

    trackSpy.mockRestore(); // Restore original implementation
  });
});
```

### 5. Snapshot Testing

```typescript
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from './Card';

describe('Card snapshots', () => {
  it('matches snapshot for default variant', () => {
    const { container } = render(
      <Card title="Test Card" description="Test description" />
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches inline snapshot for primary variant', () => {
    const { container } = render(
      <Card variant="primary" title="Primary Card" />
    );

    expect(container.firstChild).toMatchInlineSnapshot(`
      <div class="card card-primary">
        <h3 class="card-title">Primary Card</h3>
      </div>
    `);
  });
});
```

---

## Playwright Patterns (E2E Tests)

### 1. Basic Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // Collect trace on retry
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### 2. Basic E2E Test

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill form (auto-waits for elements)
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'password123');

    // Click button
    await page.click('button[type="submit"]');

    // Assert redirect to dashboard (auto-waits for navigation)
    await expect(page).toHaveURL('/dashboard');

    // Assert user is logged in
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Assert error message appears
    await expect(page.locator('text=Invalid credentials')).toBeVisible();

    // Assert stays on login page
    await expect(page).toHaveURL('/login');
  });
});
```

### 3. Page Object Model (POM)

```typescript
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[name="email"]');
    this.passwordInput = page.locator('[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// Usage in test
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('login with POM', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');

  await expect(page).toHaveURL('/dashboard');
});
```

### 4. API Mocking with Playwright

```typescript
// e2e/api-mocking.spec.ts
import { test, expect } from '@playwright/test';

test('mocks API response', async ({ page }) => {
  // Intercept API call and return mock data
  await page.route('**/api/users', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ])
    });
  });

  await page.goto('/users');

  // Verify mock data is displayed
  await expect(page.locator('text=John Doe')).toBeVisible();
  await expect(page.locator('text=Jane Smith')).toBeVisible();
});

test('simulates API error', async ({ page }) => {
  await page.route('**/api/users', (route) => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' })
    });
  });

  await page.goto('/users');

  await expect(page.locator('text=Failed to load users')).toBeVisible();
});
```

### 5. Authentication State Management

```typescript
// e2e/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard');

  // Save auth state to file
  await page.context().storageState({ path: authFile });
});

// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

// Reuse authenticated state
test.use({ storageState: 'playwright/.auth/user.json' });

test('view dashboard as logged in user', async ({ page }) => {
  await page.goto('/dashboard');

  // Already authenticated, no login required
  await expect(page.locator('text=Welcome back')).toBeVisible();
});
```

---

## MSW Patterns (API Mocking)

### 1. Basic Setup

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // GET request
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]);
  }),

  // POST request
  http.post('/api/users', async ({ request }) => {
    const newUser = await request.json();

    return HttpResponse.json(
      { id: 3, ...newUser },
      { status: 201 }
    );
  }),

  // Dynamic route params
  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id: Number(id),
      name: 'John Doe',
      email: 'john@example.com'
    });
  }),

  // Simulate error
  http.get('/api/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  })
];
```

```typescript
// src/mocks/server.ts (for Node.js/Vitest)
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/mocks/browser.ts (for browser/Playwright)
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 2. Integration with Vitest

```typescript
// src/test/setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server';

// Start server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Stop server after all tests
afterAll(() => server.close());
```

```typescript
// UserList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import UserList from './UserList';

describe('UserList', () => {
  it('displays users from API', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('handles empty list', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json([]);
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json(
          { error: 'Failed to fetch' },
          { status: 500 }
        );
      })
    );

    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### 3. Advanced Mocking Patterns

```typescript
// Delay response (simulate slow network)
http.get('/api/users', async () => {
  await delay(2000); // 2 second delay
  return HttpResponse.json([...]);
});

// Conditional responses
http.get('/api/users', ({ request }) => {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');

  if (role === 'admin') {
    return HttpResponse.json([{ id: 1, name: 'Admin User' }]);
  }

  return HttpResponse.json([{ id: 2, name: 'Regular User' }]);
});

// Stateful mocking
let users = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Smith' }
];

http.get('/api/users', () => {
  return HttpResponse.json(users);
});

http.post('/api/users', async ({ request }) => {
  const newUser = await request.json();
  const user = { id: users.length + 1, ...newUser };
  users.push(user);
  return HttpResponse.json(user, { status: 201 });
});

http.delete('/api/users/:id', ({ params }) => {
  users = users.filter(u => u.id !== Number(params.id));
  return new HttpResponse(null, { status: 204 });
});
```

---

## Test Coverage & Quality Gates

### 1. Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,tsx}',
        '**/mockData/*'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});
```

### 2. CI/CD Quality Gates

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci

      # Run unit tests with coverage
      - run: npm run test:coverage

      # Fail if coverage below threshold
      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

      # Run E2E tests
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      # Upload coverage report
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Performance Optimization

### 1. Parallel Test Execution

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run tests in parallel (default)
    threads: true,

    // Max number of threads
    maxThreads: 8,

    // Isolate test environment for each file
    isolate: true
  }
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  // Run tests in parallel
  fullyParallel: true,

  // Number of workers
  workers: process.env.CI ? 1 : undefined, // CI: 1, local: CPU cores

  // Timeout
  timeout: 30000
});
```

### 2. Test Sharding (CI Optimization)

```yaml
# .github/workflows/test.yml
strategy:
  matrix:
    shard: [1, 2, 3, 4]
steps:
  - run: npx playwright test --shard=${{ matrix.shard }}/4
```

---

## Resources

### scripts/
- `migrate-jest-to-vitest.js` - Automated Jest → Vitest migration
- `generate-test-stubs.js` - Generate test file boilerplate

### references/
- `references/vitest-patterns.md` - Vitest API examples and best practices
- `references/playwright-selectors.md` - Playwright selector strategies
- `references/msw-patterns.md` - MSW handler patterns and recipes
- `references/coverage-thresholds.md` - Industry-standard coverage targets

### assets/
- `assets/test-templates/` - Test file templates (component, hook, utility)
- `assets/ci-workflows/` - GitHub Actions/GitLab CI test workflows

## Related Skills

- `component-patterns` - Component testing strategies
- `api-design` - API contract testing
- `performance-optimization` - Performance testing with Lighthouse CI
- `accessibility-audit` - Accessibility testing with axe-core
