# Chrome MCP Testing Configuration

## VERSATIL SDLC Framework - Chrome MCP Primary Testing Standards

This document establishes Chrome as the **Primary Testing Framework** for the VERSATIL SDLC Framework, implementing comprehensive browser-based testing through the Model Context Protocol (MCP).

---

## 🎯 Chrome MCP Overview

**Chrome MCP** serves as our primary testing environment, providing:
- **Real Browser Testing** - Actual Chrome browser execution
- **Visual Regression Detection** - Pixel-perfect UI validation
- **Performance Monitoring** - Core Web Vitals tracking
- **Accessibility Auditing** - WCAG compliance verification
- **Security Testing** - XSS, CSP, and vulnerability detection

---

## 🔧 Configuration Setup

### 1. Chrome MCP Installation

```bash
# Install Chrome MCP server
npm install -g @modelcontextprotocol/server-chrome

# Verify installation
chrome-mcp --version

# Initialize configuration
chrome-mcp init --project=versatil-sdlc
```

### 2. Framework Integration

```json
{
  "name": "VERSATIL Chrome MCP Config",
  "mcpServers": {
    "chrome-testing": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-chrome",
        "--headless=false",
        "--viewport=1920x1080",
        "--timeout=30000"
      ],
      "env": {
        "CHROME_ENABLE_ACCESSIBILITY": "true",
        "CHROME_ENABLE_PERFORMANCE": "true",
        "CHROME_ENABLE_SECURITY": "true"
      }
    }
  },
  "testing": {
    "primary_browser": "chrome",
    "fallback_browsers": ["firefox", "safari"],
    "mobile_testing": true,
    "accessibility_required": true,
    "performance_budget_enforced": true
  }
}
```

### 3. Maria-QA Integration

```yaml
Agent: Maria-QA
Chrome_MCP_Responsibilities:
  - Execute all browser-based tests
  - Monitor visual regression testing
  - Validate accessibility compliance
  - Track performance metrics
  - Report security vulnerabilities

Testing_Workflow:
  1. Pre-deployment validation
  2. Cross-browser compatibility checks
  3. Performance budget verification
  4. Accessibility audit execution
  5. Security vulnerability scanning
  6. Visual regression analysis
```

---

## 🧪 Testing Standards

### 1. Visual Regression Testing

```javascript
// Chrome MCP Visual Testing Configuration
const visualTestConfig = {
  baseline_directory: './tests/visual/baselines',
  diff_directory: './tests/visual/diffs',
  threshold: 0.1,
  ignore_regions: [
    { selector: '.timestamp', type: 'element' },
    { selector: '.dynamic-content', type: 'element' }
  ],
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ]
};

// Maria-QA Visual Test Commands
await chrome.goto('http://localhost:3000');
await chrome.screenshot({
  path: 'current-screenshot.png',
  fullPage: true
});
await chrome.compareVisual('baseline.png', 'current-screenshot.png');
```

### 2. Performance Monitoring

```javascript
// Chrome MCP Performance Configuration
const performanceConfig = {
  metrics: {
    first_contentful_paint: { max: 1500 }, // ms
    largest_contentful_paint: { max: 2500 }, // ms
    first_input_delay: { max: 100 }, // ms
    cumulative_layout_shift: { max: 0.1 },
    total_blocking_time: { max: 300 } // ms
  },
  budget: {
    javascript: { max: '500kb' },
    css: { max: '100kb' },
    images: { max: '1mb' },
    fonts: { max: '200kb' }
  },
  audits: ['accessibility', 'performance', 'seo', 'best-practices']
};

// Maria-QA Performance Test Execution
const lighthouse = await chrome.lighthouse({
  url: 'http://localhost:3000',
  config: performanceConfig
});

if (lighthouse.performance < 90) {
  throw new Error('Performance budget exceeded');
}
```

### 3. Accessibility Testing

```javascript
// Chrome MCP Accessibility Configuration
const accessibilityConfig = {
  standard: 'WCAG21AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  rules: {
    'color-contrast': { enabled: true, impact: 'serious' },
    'keyboard-navigation': { enabled: true, impact: 'critical' },
    'screen-reader': { enabled: true, impact: 'critical' },
    'focus-management': { enabled: true, impact: 'serious' }
  },
  ignore: [],
  include: ['main', '[role=main]', '[role=navigation]']
};

// Maria-QA Accessibility Audit
const axeResults = await chrome.axe({
  config: accessibilityConfig,
  analyze: true
});

if (axeResults.violations.length > 0) {
  throw new Error(`Accessibility violations found: ${axeResults.violations.length}`);
}
```

### 4. Security Testing

```javascript
// Chrome MCP Security Configuration
const securityConfig = {
  checks: {
    content_security_policy: true,
    mixed_content: true,
    insecure_requests: true,
    xss_protection: true,
    clickjacking_protection: true,
    secure_cookies: true
  },
  headers: {
    'Content-Security-Policy': 'required',
    'X-Frame-Options': 'required',
    'X-Content-Type-Options': 'required',
    'Referrer-Policy': 'required',
    'Permissions-Policy': 'optional'
  }
};

// Maria-QA Security Audit
const securityAudit = await chrome.security({
  config: securityConfig,
  deep_scan: true
});

if (securityAudit.vulnerabilities.length > 0) {
  throw new Error('Security vulnerabilities detected');
}
```

---

## 📋 Test Execution Workflows

### 1. Pre-Deployment Testing

```bash
# Maria-QA Pre-deployment Checklist
chrome-mcp test --suite=pre-deploy --config=.versatil/chrome-mcp-config.json

Test Sequence:
1. ✅ Visual regression baseline comparison
2. ✅ Performance budget validation
3. ✅ Accessibility compliance check
4. ✅ Security vulnerability scan
5. ✅ Cross-browser compatibility
6. ✅ Mobile responsiveness
7. ✅ SEO optimization validation
```

### 2. Continuous Integration Testing

```yaml
# GitHub Actions Chrome MCP Integration
name: VERSATIL Chrome MCP Testing
on: [push, pull_request]

jobs:
  chrome-mcp-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Chrome MCP
        run: npm install -g @modelcontextprotocol/server-chrome

      - name: Maria-QA Visual Tests
        run: chrome-mcp test --visual --baseline

      - name: Maria-QA Performance Tests
        run: chrome-mcp test --performance --budget

      - name: Maria-QA Accessibility Tests
        run: chrome-mcp test --accessibility --wcag21aa

      - name: Maria-QA Security Tests
        run: chrome-mcp test --security --full-scan

      - name: Generate Test Report
        run: chrome-mcp report --format=html --output=test-results/
```

### 3. Local Development Testing

```bash
# Maria-QA Local Development Commands
alias mcp-test='chrome-mcp test --config=.versatil/chrome-mcp-config.json'
alias mcp-visual='chrome-mcp test --visual --watch'
alias mcp-performance='chrome-mcp test --performance --live'
alias mcp-accessibility='chrome-mcp test --accessibility --fix'

# Quick test commands
mcp-test --quick          # Essential tests only
mcp-test --full           # Comprehensive test suite
mcp-test --debug          # Detailed debugging output
mcp-test --fix            # Auto-fix minor issues
```

---

## 🎨 Visual Testing Standards

### 1. Screenshot Standards

```javascript
// Chrome MCP Screenshot Configuration
const screenshotStandards = {
  format: 'png',
  quality: 100,
  fullPage: true,
  omitBackground: false,
  encoding: 'base64',
  clip: null, // Full viewport
  animations: 'disabled',
  caret: 'hidden'
};

// Responsive Testing Viewports
const responsiveViewports = [
  { name: 'desktop-large', width: 1920, height: 1080 },
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'mobile-large', width: 414, height: 896 },
  { name: 'mobile', width: 375, height: 667 },
  { name: 'mobile-small', width: 320, height: 568 }
];
```

### 2. Visual Diff Analysis

```javascript
// Maria-QA Visual Comparison
const visualDiffConfig = {
  threshold: 0.1, // 0.1% pixel difference tolerance
  includeAA: false,
  alpha: 0.2,
  aaColor: [255, 128, 0],
  diffColor: [255, 0, 0],
  diffColorAlt: null,
  ignoreAreasColoredWith: {
    r: 0, g: 255, b: 0, a: 255
  }
};

// Automated Visual Testing Pipeline
async function mariaQAVisualPipeline(urls) {
  for (const url of urls) {
    for (const viewport of responsiveViewports) {
      await chrome.setViewport(viewport);
      const screenshot = await chrome.screenshot(url);
      const baseline = await loadBaseline(url, viewport.name);
      const diff = await compareImages(screenshot, baseline, visualDiffConfig);

      if (diff.mismatchPercentage > 0.1) {
        await reportVisualRegression({
          url,
          viewport: viewport.name,
          mismatch: diff.mismatchPercentage,
          diffImage: diff.diffImage
        });
      }
    }
  }
}
```

---

## 🚀 Performance Budget Configuration

### 1. Core Web Vitals Standards

```javascript
// Maria-QA Performance Standards
const performanceBudget = {
  // Core Web Vitals Thresholds
  first_contentful_paint: {
    good: 1800,
    needs_improvement: 3000,
    poor: 3001
  },
  largest_contentful_paint: {
    good: 2500,
    needs_improvement: 4000,
    poor: 4001
  },
  first_input_delay: {
    good: 100,
    needs_improvement: 300,
    poor: 301
  },
  cumulative_layout_shift: {
    good: 0.1,
    needs_improvement: 0.25,
    poor: 0.26
  },
  interaction_to_next_paint: {
    good: 200,
    needs_improvement: 500,
    poor: 501
  }
};

// Resource Budget Limits
const resourceBudget = {
  total_size: '2MB',
  javascript: '500KB',
  css: '150KB',
  images: '1MB',
  fonts: '200KB',
  other: '150KB',
  requests: 50
};
```

### 2. Performance Monitoring

```javascript
// Real-time Performance Tracking
class MariaQAPerformanceMonitor {
  async monitorWebVitals(url) {
    const metrics = await chrome.getWebVitals(url);

    // Alert on budget violations
    Object.entries(performanceBudget).forEach(([metric, thresholds]) => {
      if (metrics[metric] > thresholds.good) {
        this.alertPerformanceViolation(metric, metrics[metric], thresholds);
      }
    });

    return {
      passed: this.evaluateOverallPerformance(metrics),
      metrics,
      recommendations: await this.getOptimizationRecommendations(metrics)
    };
  }

  async generatePerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: await this.collectAllMetrics(),
      trends: await this.analyzeTrends(),
      alerts: await this.getActiveAlerts(),
      recommendations: await this.getActionableRecommendations()
    };
  }
}
```

---

## 🔒 Security Testing Framework

### 1. Security Headers Validation

```javascript
// Maria-QA Security Headers Check
const requiredSecurityHeaders = {
  'Content-Security-Policy': {
    required: true,
    pattern: /^.*default-src.*$/,
    score: 10
  },
  'X-Frame-Options': {
    required: true,
    values: ['DENY', 'SAMEORIGIN'],
    score: 8
  },
  'X-Content-Type-Options': {
    required: true,
    values: ['nosniff'],
    score: 6
  },
  'Referrer-Policy': {
    required: true,
    values: ['strict-origin-when-cross-origin', 'no-referrer'],
    score: 5
  },
  'Permissions-Policy': {
    required: false,
    score: 3
  }
};

async function validateSecurityHeaders(url) {
  const response = await chrome.goto(url, { waitUntil: 'networkidle0' });
  const headers = response.headers();
  const results = [];

  for (const [header, config] of Object.entries(requiredSecurityHeaders)) {
    const headerValue = headers[header.toLowerCase()];
    const result = {
      header,
      present: !!headerValue,
      value: headerValue,
      required: config.required,
      score: config.score,
      passed: false
    };

    if (headerValue && config.values) {
      result.passed = config.values.includes(headerValue);
    } else if (headerValue && config.pattern) {
      result.passed = config.pattern.test(headerValue);
    } else {
      result.passed = !!headerValue;
    }

    results.push(result);
  }

  return results;
}
```

### 2. XSS and Injection Testing

```javascript
// Maria-QA XSS Testing Suite
const xssTestPayloads = [
  '<script>alert("XSS")</script>',
  'javascript:alert("XSS")',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  '"><script>alert("XSS")</script>'
];

async function testXSSVulnerabilities(url, inputSelectors) {
  const vulnerabilities = [];

  for (const payload of xssTestPayloads) {
    await chrome.goto(url);

    for (const selector of inputSelectors) {
      try {
        await chrome.type(selector, payload);
        await chrome.keyboard.press('Enter');

        // Check if payload executed
        const alertFired = await chrome.evaluate(() => {
          return window.xssDetected || false;
        });

        if (alertFired) {
          vulnerabilities.push({
            type: 'XSS',
            severity: 'HIGH',
            location: selector,
            payload: payload,
            url: url
          });
        }
      } catch (error) {
        // Input validation prevented injection - good!
      }
    }
  }

  return vulnerabilities;
}
```

---

## 📊 Reporting and Analytics

### 1. Test Report Generation

```javascript
// Maria-QA Comprehensive Test Report
class VersatilTestReporter {
  async generateComprehensiveReport() {
    const report = {
      metadata: {
        framework: 'VERSATIL SDLC',
        agent: 'Maria-QA',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },

      visual_testing: {
        total_screenshots: await this.countScreenshots(),
        regressions_detected: await this.countRegressions(),
        baseline_updates: await this.countBaselineUpdates(),
        pass_rate: await this.calculateVisualPassRate()
      },

      performance: {
        core_web_vitals: await this.getWebVitalsResults(),
        resource_budget: await this.getResourceBudgetResults(),
        lighthouse_score: await this.getLighthouseScores(),
        trends: await this.getPerformanceTrends()
      },

      accessibility: {
        wcag_compliance: await this.getWCAGResults(),
        violations: await this.getAccessibilityViolations(),
        automated_fixes: await this.getAutomatedFixes(),
        manual_review_required: await this.getManualReviewItems()
      },

      security: {
        vulnerability_scan: await this.getSecurityScanResults(),
        header_validation: await this.getHeaderValidationResults(),
        ssl_analysis: await this.getSSLAnalysisResults(),
        penetration_test: await this.getPenetrationTestResults()
      },

      recommendations: await this.generateActionableRecommendations()
    };

    await this.saveReport(report);
    await this.notifyTeam(report);

    return report;
  }
}
```

### 2. Dashboard Integration

```javascript
// Real-time Chrome MCP Dashboard
const dashboardConfig = {
  refresh_interval: 30000, // 30 seconds
  charts: {
    performance_trends: {
      type: 'line',
      metrics: ['fcp', 'lcp', 'fid', 'cls'],
      timeframe: '24h'
    },
    visual_regression_tracking: {
      type: 'bar',
      metrics: ['regressions', 'fixes', 'baselines'],
      timeframe: '7d'
    },
    accessibility_compliance: {
      type: 'gauge',
      target: 100,
      current: 'live'
    },
    security_score: {
      type: 'radial',
      max_score: 100,
      current: 'live'
    }
  },
  alerts: {
    performance_budget_exceeded: { enabled: true, threshold: 'budget' },
    visual_regression_detected: { enabled: true, threshold: 0.1 },
    accessibility_violation: { enabled: true, severity: 'serious' },
    security_vulnerability: { enabled: true, severity: 'medium' }
  }
};
```

---

## 🔧 Troubleshooting Guide

### 1. Common Chrome MCP Issues

```bash
# Chrome MCP Troubleshooting Commands
chrome-mcp doctor                    # System health check
chrome-mcp reset --config           # Reset configuration
chrome-mcp clear --cache            # Clear test cache
chrome-mcp verify --installation    # Verify installation
chrome-mcp update --latest          # Update to latest version

# Debug Mode
chrome-mcp test --debug --verbose   # Detailed debugging
chrome-mcp test --slow-mo=250      # Slow motion execution
chrome-mcp test --headed            # Show browser window
```

### 2. Performance Issues

```yaml
Performance_Optimization:
  - Use headless mode for CI/CD: --headless=true
  - Optimize screenshot size: --viewport=1366x768
  - Reduce timeout values: --timeout=15000
  - Parallel test execution: --parallel=4
  - Cache optimization: --cache-enabled=true

Memory_Management:
  - Restart browser between tests: --restart-browser=true
  - Limit concurrent instances: --max-instances=2
  - Clear browser data: --clear-data=true
```

---

## 📚 Best Practices

### 1. Maria-QA Testing Guidelines

```yaml
Testing_Best_Practices:
  Visual_Testing:
    - Always use consistent viewport sizes
    - Disable animations for stable screenshots
    - Use data-testid attributes for element selection
    - Maintain separate baselines for each environment

  Performance_Testing:
    - Test on throttled networks (3G, slow 3G)
    - Include mobile device testing
    - Monitor third-party script impact
    - Set realistic performance budgets

  Accessibility_Testing:
    - Test with screen readers
    - Verify keyboard navigation
    - Check color contrast ratios
    - Validate ARIA labels and roles

  Security_Testing:
    - Regular vulnerability scans
    - Validate all user inputs
    - Check for exposed sensitive data
    - Monitor third-party dependencies
```

### 2. Integration with Other Agents

```yaml
Agent_Collaboration:
  James_Frontend:
    - Share performance optimization recommendations
    - Coordinate visual regression testing
    - Validate responsive design implementations

  Marcus_Backend:
    - Coordinate API security testing
    - Share performance bottleneck analysis
    - Validate authentication flows

  Sarah_PM:
    - Provide quality metrics and reports
    - Share testing progress and blockers
    - Coordinate release readiness
```

---

*This Chrome MCP configuration ensures comprehensive, automated testing as the foundation of the VERSATIL SDLC Framework, with Maria-QA as the primary quality guardian leveraging Chrome's testing capabilities.*

**Configuration Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained By**: Maria-QA Agent & VERSATIL Team