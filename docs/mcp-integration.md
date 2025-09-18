# Chrome MCP Integration Guide

Complete guide for integrating and using Chrome Model Context Protocol (MCP) as the primary testing framework within the VERSATIL SDLC Framework.

## 🎯 Overview

**Chrome MCP** serves as the cornerstone testing technology for VERSATIL, providing:
- **Real browser testing** with actual Chrome instances
- **Visual regression detection** with pixel-perfect accuracy
- **Performance monitoring** using Core Web Vitals
- **Accessibility compliance** with WCAG standards
- **Security validation** through automated scans

Maria-QA leverages Chrome MCP to ensure comprehensive quality assurance across all aspects of web applications.

---

## 🚀 Quick Start

### Installation

```bash
# Install Chrome MCP globally
npm install -g @modelcontextprotocol/server-chrome

# Verify installation
chrome-mcp --version

# Initialize in your project
chrome-mcp init --project=versatil-project
```

### Basic Configuration

```json
// .versatil/chrome-mcp-config.json
{
  "name": "VERSATIL Chrome MCP Configuration",
  "version": "1.0.0",
  "browser": "chrome",
  "headless": true,
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "timeout": 30000,
  "testing": {
    "visual_regression": true,
    "performance_monitoring": true,
    "accessibility_testing": true,
    "security_scanning": true
  }
}
```

### First Test

```bash
# Run basic Chrome MCP test
npm run maria:chrome-test

# Run visual regression test
npm run maria:visual

# Run performance test
npm run maria:performance
```

---

## 🧪 Testing Capabilities

### 1. Visual Regression Testing

Chrome MCP captures screenshots across multiple viewports and compares them against baselines.

#### Configuration
```json
{
  "visual_testing": {
    "enabled": true,
    "threshold": 0.1,
    "baseline_dir": "./tests/visual/baselines",
    "diff_dir": "./tests/visual/diffs",
    "viewports": [
      { "name": "desktop", "width": 1920, "height": 1080 },
      { "name": "tablet", "width": 768, "height": 1024 },
      { "name": "mobile", "width": 375, "height": 667 }
    ],
    "ignore_regions": [
      { "selector": ".timestamp", "type": "element" },
      { "selector": ".dynamic-ads", "type": "element" }
    ]
  }
}
```

#### Usage
```bash
# Capture new baselines
npm run maria:baseline-update

# Run visual regression tests
npm run maria:visual

# Run visual tests for specific viewport
npm run maria:visual -- --viewport=mobile

# Compare specific pages
npm run maria:visual -- --url=/login --url=/dashboard
```

#### Advanced Visual Testing
```javascript
// tests/visual/login.visual.js
const { test, expect } = require('@playwright/test');

test.describe('Login Page Visual Tests', () => {
  test('login form appears correctly', async ({ page }) => {
    await page.goto('/login');

    // Wait for content to load
    await page.waitForSelector('[data-testid="login-form"]');

    // Hide dynamic elements
    await page.addStyleTag({
      content: '.timestamp { visibility: hidden !important; }'
    });

    // Take screenshot
    await expect(page).toHaveScreenshot('login-form.png');
  });

  test('login form responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-form-mobile.png');

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/login');
    await expect(page).toHaveScreenshot('login-form-tablet.png');
  });
});
```

### 2. Performance Testing

Chrome MCP integrates with Lighthouse to provide comprehensive performance analysis.

#### Configuration
```json
{
  "performance": {
    "enabled": true,
    "lighthouse_config": {
      "extends": "lighthouse:default",
      "settings": {
        "onlyCategories": ["performance", "accessibility", "seo"],
        "formFactor": "desktop",
        "throttling": {
          "cpuSlowdownMultiplier": 1,
          "requestLatencyMs": 0,
          "downloadThroughputKbps": 0,
          "uploadThroughputKbps": 0
        }
      }
    },
    "budget": {
      "first_contentful_paint": 1800,
      "largest_contentful_paint": 2500,
      "first_input_delay": 100,
      "cumulative_layout_shift": 0.1,
      "total_blocking_time": 300
    },
    "resource_budget": {
      "total": "2MB",
      "javascript": "500KB",
      "css": "150KB",
      "images": "1MB",
      "fonts": "200KB"
    }
  }
}
```

#### Usage
```bash
# Run performance tests
npm run maria:performance

# Test specific URL
npm run maria:performance -- --url=http://localhost:3000/dashboard

# Mobile performance testing
npm run maria:performance -- --device=mobile

# Generate performance report
npm run maria:performance-report
```

#### Core Web Vitals Monitoring
```javascript
// tests/performance/core-web-vitals.test.js
const { test, expect } = require('@playwright/test');

test.describe('Core Web Vitals', () => {
  test('homepage meets performance budget', async ({ page }) => {
    await page.goto('/');

    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            fcp: entries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
            lcp: entries.find(entry => entry.entryType === 'largest-contentful-paint')?.startTime,
            cls: entries.find(entry => entry.entryType === 'layout-shift')?.value
          });
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      });
    });

    // Assert performance budget
    expect(metrics.fcp).toBeLessThan(1800);
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.cls).toBeLessThan(0.1);
  });
});
```

### 3. Accessibility Testing

Chrome MCP includes comprehensive accessibility testing using axe-core.

#### Configuration
```json
{
  "accessibility": {
    "enabled": true,
    "standard": "WCAG21AA",
    "rules": {
      "color-contrast": { "enabled": true },
      "keyboard-navigation": { "enabled": true },
      "screen-reader": { "enabled": true },
      "focus-management": { "enabled": true }
    },
    "tags": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
    "ignore": [],
    "include": ["main", "[role=main]", "[role=navigation]"]
  }
}
```

#### Usage
```bash
# Run accessibility audit
npm run maria:accessibility

# Test specific pages
npm run maria:accessibility -- --url=/login --url=/dashboard

# Test with specific standards
npm run maria:accessibility -- --standard=WCAG21AAA

# Generate accessibility report
npm run maria:accessibility-report
```

#### Accessibility Test Example
```javascript
// tests/accessibility/navigation.a11y.test.js
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test.describe('Navigation Accessibility', () => {
  test('main navigation is accessible', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="navigation"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation works correctly', async ({ page }) => {
    await page.goto('/');

    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusable = await page.locator(':focus');
    await expect(firstFocusable).toBeVisible();

    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('[href="#main-content"]:focus');
    if (await skipLink.count() > 0) {
      await skipLink.press('Enter');
      const mainContent = await page.locator('#main-content:focus');
      await expect(mainContent).toBeFocused();
    }
  });
});
```

### 4. Security Testing

Chrome MCP performs automated security scans including header validation and vulnerability detection.

#### Configuration
```json
{
  "security": {
    "enabled": true,
    "checks": {
      "content_security_policy": true,
      "mixed_content": true,
      "insecure_requests": true,
      "xss_protection": true,
      "clickjacking_protection": true,
      "secure_cookies": true
    },
    "required_headers": {
      "Content-Security-Policy": "required",
      "X-Frame-Options": "required",
      "X-Content-Type-Options": "required",
      "Referrer-Policy": "required",
      "Permissions-Policy": "optional"
    }
  }
}
```

#### Usage
```bash
# Run security scan
npm run maria:security

# Test security headers
npm run maria:security-headers

# XSS vulnerability testing
npm run maria:xss-test

# Generate security report
npm run maria:security-report
```

---

## 🔧 Advanced Configuration

### Multi-Environment Testing

```json
{
  "environments": {
    "development": {
      "baseURL": "http://localhost:3000",
      "timeout": 30000
    },
    "staging": {
      "baseURL": "https://staging.yourapp.com",
      "timeout": 45000
    },
    "production": {
      "baseURL": "https://yourapp.com",
      "timeout": 60000
    }
  }
}
```

### Cross-Browser Testing

```json
{
  "browsers": [
    {
      "name": "chromium",
      "use": { "viewport": { "width": 1920, "height": 1080 } }
    },
    {
      "name": "firefox",
      "use": { "viewport": { "width": 1920, "height": 1080 } }
    },
    {
      "name": "webkit",
      "use": { "viewport": { "width": 1920, "height": 1080 } }
    }
  ]
}
```

### Mobile Device Testing

```json
{
  "mobile_devices": [
    {
      "name": "iPhone 12",
      "use": {
        "viewport": { "width": 390, "height": 844 },
        "deviceScaleFactor": 3,
        "isMobile": true,
        "hasTouch": true
      }
    },
    {
      "name": "Samsung Galaxy S21",
      "use": {
        "viewport": { "width": 384, "height": 854 },
        "deviceScaleFactor": 2.75,
        "isMobile": true,
        "hasTouch": true
      }
    }
  ]
}
```

---

## 🚀 CI/CD Integration

### GitHub Actions Integration

```yaml
# .github/workflows/chrome-mcp-tests.yml
name: Chrome MCP Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  chrome-mcp-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Install Chrome MCP
      run: npm install -g @modelcontextprotocol/server-chrome

    - name: Install Playwright browsers
      run: npx playwright install --with-deps

    - name: Run Chrome MCP tests
      run: |
        npm run build
        npm run start &
        sleep 10
        npm run maria:chrome-test

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: chrome-mcp-report
        path: |
          test-results/
          playwright-report/
        retention-days: 30
```

### Docker Integration

```dockerfile
# Dockerfile for Chrome MCP testing
FROM mcr.microsoft.com/playwright:v1.39.0-focal

WORKDIR /app

# Install Chrome MCP
RUN npm install -g @modelcontextprotocol/server-chrome

# Copy project files
COPY package*.json ./
RUN npm ci

COPY . .

# Run tests
CMD ["npm", "run", "maria:chrome-test"]
```

---

## 📊 Reporting & Analytics

### HTML Report Generation

```bash
# Generate comprehensive HTML report
npm run maria:report-html

# Open report in browser
npm run maria:report-open
```

### Custom Report Templates

```javascript
// tests/utils/custom-reporter.js
class VersatilReporter {
  onBegin(config, suite) {
    console.log('🧪 Maria-QA: Starting Chrome MCP test suite...');
  }

  onTestEnd(test, result) {
    const status = result.status === 'passed' ? '✅' : '❌';
    console.log(`${status} ${test.title}: ${result.duration}ms`);
  }

  onEnd(result) {
    console.log(`🧪 Maria-QA: Tests completed`);
    console.log(`  Passed: ${result.passed}`);
    console.log(`  Failed: ${result.failed}`);
    console.log(`  Duration: ${result.duration}ms`);
  }
}

module.exports = VersatilReporter;
```

### Performance Metrics Dashboard

```javascript
// Monitor performance trends
const performanceMetrics = {
  timestamp: new Date().toISOString(),
  url: testUrl,
  metrics: {
    fcp: metrics.firstContentfulPaint,
    lcp: metrics.largestContentfulPaint,
    fid: metrics.firstInputDelay,
    cls: metrics.cumulativeLayoutShift,
    tbt: metrics.totalBlockingTime
  },
  budget: {
    passed: allMetricsWithinBudget,
    violations: budgetViolations
  }
};

// Send to monitoring system
await sendMetrics(performanceMetrics);
```

---

## 🔍 Debugging & Troubleshooting

### Debug Mode

```bash
# Run tests in debug mode
npm run maria:debug

# Run with headed browser (visible)
npm run maria:debug -- --headed

# Slow motion execution
npm run maria:debug -- --slow-mo=1000

# Pause on failures
npm run maria:debug -- --debug
```

### Common Issues & Solutions

#### 1. Visual Test Failures
```bash
# Update baselines after legitimate changes
npm run maria:baseline-update

# Ignore specific regions
npm run maria:visual -- --ignore-region=".dynamic-content"

# Adjust threshold for minor differences
npm run maria:visual -- --threshold=0.2
```

#### 2. Performance Test Failures
```bash
# Run performance test with network throttling
npm run maria:performance -- --throttle=3g

# Test on different device
npm run maria:performance -- --device=mobile

# Disable extensions that might affect performance
npm run maria:performance -- --no-extensions
```

#### 3. Accessibility Test Failures
```bash
# Run accessibility test with specific rules
npm run maria:accessibility -- --rules=color-contrast,keyboard-navigation

# Exclude specific elements from testing
npm run maria:accessibility -- --exclude=".third-party-widget"
```

### Logging & Diagnostics

```javascript
// Enable detailed logging
const config = {
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};

// Custom logging
test('with detailed logging', async ({ page }) => {
  page.on('console', msg => console.log('Browser log:', msg.text()));
  page.on('request', request => console.log('Request:', request.url()));
  page.on('response', response => console.log('Response:', response.status(), response.url()));
});
```

---

## 🎯 Best Practices

### 1. Test Organization

```
tests/
├── visual/
│   ├── baselines/
│   ├── diffs/
│   └── specs/
├── performance/
│   ├── budgets/
│   └── specs/
├── accessibility/
│   └── specs/
├── security/
│   └── specs/
└── utils/
    ├── helpers.js
    └── fixtures.js
```

### 2. Page Object Model

```javascript
// tests/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `tests/visual/screenshots/${name}.png`,
      fullPage: true
    });
  }
}

module.exports = LoginPage;
```

### 3. Test Data Management

```javascript
// tests/fixtures/test-data.js
const testData = {
  users: {
    valid: {
      email: 'test@example.com',
      password: 'SecurePass123!'
    },
    invalid: {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    }
  },
  urls: {
    login: '/login',
    dashboard: '/dashboard',
    profile: '/profile'
  }
};

module.exports = testData;
```

### 4. Environment-Specific Configuration

```javascript
// playwright.config.js
const config = {
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry'
  },

  projects: [
    {
      name: 'Maria-QA-Desktop',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'Maria-QA-Mobile',
      use: { ...devices['Pixel 5'] }
    }
  ]
};

module.exports = config;
```

---

## 📈 Performance Optimization

### 1. Test Execution Speed

```javascript
// Parallel test execution
const config = {
  workers: process.env.CI ? 2 : undefined,
  fullyParallel: true,

  use: {
    // Reuse browser contexts
    reuseExistingServer: !process.env.CI,

    // Optimize for speed
    launchOptions: {
      args: ['--disable-dev-shm-usage', '--disable-gpu']
    }
  }
};
```

### 2. Resource Management

```javascript
// Efficient resource usage
test.beforeEach(async ({ page }) => {
  // Block unnecessary resources
  await page.route('**/*', route => {
    const url = route.request().url();

    if (url.includes('analytics') || url.includes('ads')) {
      route.abort();
    } else {
      route.continue();
    }
  });
});
```

---

This comprehensive Chrome MCP Integration Guide provides everything needed to leverage Chrome MCP as the primary testing framework within the VERSATIL SDLC environment. Maria-QA uses these capabilities to ensure the highest quality standards across all web applications.