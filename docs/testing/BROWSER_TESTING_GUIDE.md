# Browser Testing Guide - Real-Time Frontend Validation

**Version**: 7.14.0+
**Status**: Production Ready

## Overview

VERSATIL's browser testing system provides **real-time frontend validation** with automatic error capture, context-aware E2E tests, and live debugging dashboards. This enables a productive compounding debugging cycle where you iterate until perfect outcomes.

### Key Features

✅ **Real-Time Error Capture**: Console and network errors captured automatically on file edit
✅ **Guardian Integration**: Auto-creates TODOs for detected issues
✅ **Context-Aware Testing**: Tests validate user stories and acceptance criteria
✅ **Live Debugging Dashboard**: WebSocket-powered real-time error monitoring
✅ **Compounding Learning**: Same error never requires manual fix twice
✅ **Perfect Outcomes**: Iterate until zero errors remain

---

## Quick Start

### 1. Start Dev Server

```bash
pnpm run dev
# Dev server runs on http://localhost:3000
```

### 2. Enable Browser Error Capture

```bash
# .env or environment
BROWSER_ERROR_CAPTURE=true              # Enable real-time error capture
BROWSER_ERROR_AUTO_TODO=true            # Auto-create Guardian TODOs
BROWSER_ERROR_SEVERITY_THRESHOLD=warn   # Capture warn+ (log|warn|error)
```

### 3. Watch and Test (Continuous Feedback)

```bash
pnpm run watch-and-test
# Watches frontend files
# Runs browser tests automatically
# Captures console/network errors
# Creates Guardian TODOs
```

### 4. View Live Dashboard (Optional)

```bash
npx tsx src/dashboard/dev-browser-monitor.ts
# Opens terminal dashboard at ws://localhost:3001
# Real-time console output
# Network request panel
# Error aggregation
```

---

## Architecture

### Components

1. **Post-File-Edit Hook** (`.claude/hooks/post-file-edit-browser-check.ts`)
   - Triggers on frontend file edits
   - Launches headless browser (Playwright)
   - Captures console/network errors
   - Creates Guardian TODO if errors detected

2. **Browser Error Detector** (`src/agents/guardian/browser-error-detector.ts`)
   - Parses browser check results
   - Chain-of-Verification (CoVe) methodology
   - Agent assignment (James-Frontend/Marcus-Backend)
   - Priority determination

3. **Dev Browser Monitor** (`src/dashboard/dev-browser-monitor.ts`)
   - WebSocket server on port 3001
   - Terminal UI (blessed-contrib)
   - Real-time error streaming
   - Message history (last 1000)

4. **Context-Validation Tests** (`tests/e2e/context-validation/user-flow.spec.ts`)
   - User story validation
   - Visual regression testing
   - Accessibility compliance (WCAG 2.1 AA)
   - Performance validation (Core Web Vitals)

5. **Watch and Test Script** (`scripts/watch-and-test.sh`)
   - File watcher (fswatch/inotifywait)
   - Continuous feedback loop
   - Auto-runs browser checks
   - Coordinates dashboard

---

## Workflow

### Before (Manual Debugging)

```
1. Edit Button.tsx
2. Save file
3. Switch to browser
4. Refresh page
5. Open DevTools
6. See console error
7. Copy error message
8. Search code for fix
9. Repeat
```

**Time**: 5-10 minutes per error

### After (Automated Browser Testing)

```
1. Edit Button.tsx
2. Save file → Hook fires automatically
3. Browser test runs (headless)
4. Console errors captured
5. Guardian TODO created: "Button.tsx: Uncaught TypeError at line 42"
6. Dashboard shows error + stack trace
7. James-Frontend suggests fix
8. Apply fix → /learn → Pattern stored
9. Next time: Auto-fix
```

**Time**: 30 seconds per error (10x faster)

---

## Configuration

### Environment Variables

```bash
# Browser Testing
BROWSER_ERROR_CAPTURE=true              # Enable real-time error capture
BROWSER_ERROR_AUTO_TODO=true            # Auto-create Guardian TODOs
BROWSER_ERROR_SEVERITY_THRESHOLD=warn   # Capture warn+ (log|warn|error)

# Network Monitoring
NETWORK_ERROR_CAPTURE=true              # Capture network failures
NETWORK_ERROR_STATUS_CODES=400,401,403,404,500,502,503  # Which status codes

# Dashboard
DEV_DASHBOARD_ENABLED=true              # Enable live debugging dashboard
DEV_DASHBOARD_PORT=3001                 # WebSocket server port
DEV_DASHBOARD_UI=terminal               # terminal | web

# Playwright
PLAYWRIGHT_BASE_URL=http://localhost:3000  # Dev server URL
PLAYWRIGHT_HEADLESS=true                # Headless browser (true | false)
PLAYWRIGHT_SLOW_MO=0                    # Slow down actions (ms)
```

### package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "watch-and-test": "./scripts/watch-and-test.sh",
    "test:context-validation": "playwright test --project=context-validation",
    "dashboard:browser": "npx tsx src/dashboard/dev-browser-monitor.ts"
  }
}
```

---

## Usage Examples

### Example 1: Manual Browser Check

```bash
# Trigger browser check manually
export FILE_PATH="src/components/Button.tsx"
npx tsx .claude/hooks/post-file-edit-browser-check.ts src/components/Button.tsx

# Output:
# 🌐 Running browser check for: Button.tsx
# 📊 Browser Check Results:
#    Console Errors: 1
#    Console Warnings: 0
#    Network Errors: 0
# ✅ Guardian TODO created: guardian-browser-check-james-frontend-critical-*.md
```

### Example 2: Continuous Feedback Loop

```bash
pnpm run watch-and-test

# Watches frontend files in src/
# On file change:
# 1. Runs browser check
# 2. Captures console/network errors
# 3. Creates Guardian TODO (if errors)
# 4. Runs E2E tests
# 5. Displays results in terminal
```

### Example 3: Live Debugging Dashboard

```bash
npx tsx src/dashboard/dev-browser-monitor.ts

# Opens terminal dashboard:
# ┌─ Console Output ──────┐ ┌─ Network Requests ──┐
# │ [ERROR] Uncaught...   │ │ GET /api/users  200 │
# │ [WARN] Deprecated...  │ │ POST /api/auth  401 │
# └───────────────────────┘ └─────────────────────┘
# ┌─ Errors ──────────────────────┐ ┌─ Statistics ─┐
# │ [10:30] TypeError at line 42  │ │ Total: 1234  │
# │ [10:31] Network timeout       │ │ Errors: 5    │
# └───────────────────────────────┘ └──────────────┘
```

### Example 4: Context-Aware User Flow Test

```bash
pnpm run test:context-validation

# Runs context-validation tests:
# - Validates homepage user flow
# - Checks form submission flow
# - Tests responsive design (mobile/tablet/desktop)
# - Validates keyboard navigation
# - Tests dark mode toggle
# - Component-level validation
```

---

## Guardian TODO Format

When browser errors are detected, Guardian creates a TODO file:

### Example: `todos/guardian-browser-check-james-frontend-critical-*.md`

```markdown
---
id: "James-Frontend-critical-1730123456789"
created: "2025-10-29T10:30:00.000Z"
type: "guardian-browser-check"
assigned_agent: "James-Frontend"
priority: "critical"
layer: "project"
file: "src/components/Button.tsx"
verified_by: "Browser Check Hook"
---

# 🌐 Browser Check - Frontend Errors Detected

**File**: `src/components/Button.tsx`

## Summary

- **Console Errors**: 1
- **Console Warnings**: 0
- **Network Errors**: 0
- **Priority**: **CRITICAL**
- **Assigned Agent**: **James-Frontend**

---

## Console Errors

### 1. Uncaught TypeError: Cannot read properties of undefined (reading 'name')

- **Type**: error
- **Timestamp**: 2025-10-29T10:30:00.000Z
- **Location**: http://localhost:3000/static/js/main.chunk.js:42:15

---

## 🎯 Recommended Actions

1. Open browser DevTools and reproduce errors
2. Check browser compatibility (Chrome/Firefox/Safari)
3. Validate JavaScript bundle integrity
4. Review network request configurations
5. Fix errors and verify in browser

---

## 📊 Next Steps

1. Fix detected issues
2. Run `pnpm run test:e2e` to verify
3. Run `/learn "Fixed browser errors in Button.tsx"` to store pattern
```

---

## Agent Integration

### Maria-QA Responsibilities

When Guardian browser-check TODOs are created, Maria-QA:

1. **Reviews** browser errors by severity (critical first)
2. **Validates** error fixes with E2E tests
3. **Verifies** no regression in test coverage
4. **Stores** fix patterns using `/learn`

### James-Frontend Responsibilities

For console errors, James-Frontend:

1. **Analyzes** error stack traces
2. **Identifies** root cause in frontend code
3. **Applies** fix (React patterns, state management, etc.)
4. **Tests** fix in browser

### Marcus-Backend Responsibilities

For network errors, Marcus-Backend:

1. **Analyzes** API failures (4xx, 5xx)
2. **Identifies** backend issues
3. **Fixes** API endpoints
4. **Validates** with integration tests

---

## Context-Aware Testing

### User Story Validation

Tests automatically validate user stories from context:

```json
// .versatil/context/user-stories.json
[
  {
    "id": "US-001",
    "title": "User can submit contact form",
    "description": "As a user, I want to submit a contact form...",
    "acceptanceCriteria": [
      "Form has name, email, message fields",
      "Submit button is visible and clickable",
      "Success message appears after submission"
    ],
    "components": ["ContactForm", "SubmitButton"],
    "route": "/contact",
    "mockupUrl": "https://figma.com/..."
  }
]
```

### Test Generation

Context-validation tests dynamically generate tests from user stories:

```typescript
// tests/e2e/context-validation/user-flow.spec.ts
test('User Story: US-001', async ({ page }) => {
  // Navigate to route
  await page.goto('/contact');

  // Validate components exist
  await expect(page.locator('[data-component="ContactForm"]')).toBeVisible();
  await expect(page.locator('[data-component="SubmitButton"]')).toBeVisible();

  // Validate acceptance criteria
  await page.fill('input[name="name"]', 'Test User');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('textarea[name="message"]', 'Test message');
  await page.click('button[type="submit"]');

  // Validate success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

  // Visual comparison
  await expect(page).toHaveScreenshot('user-story-US-001.png');

  // Accessibility validation
  await checkA11y(page);
});
```

---

## Performance Impact

| Metric | Value | Notes |
|--------|-------|-------|
| **Browser Check Duration** | 2-5 seconds | Depends on page complexity |
| **Hook Overhead** | <200ms | File detection + validation |
| **Dashboard Latency** | <50ms | WebSocket streaming |
| **Total Impact** | <3 seconds | Per file edit (headless) |

**Negligible impact** on development velocity - runs in background.

---

## Troubleshooting

### No Errors Captured

**Symptom**: Browser check runs but no errors captured

**Solution**:
1. Check `BROWSER_ERROR_SEVERITY_THRESHOLD` (default: `warn`)
2. Lower threshold to `log` to capture all console messages
3. Verify dev server is running (`http://localhost:3000`)

```bash
export BROWSER_ERROR_SEVERITY_THRESHOLD=log
```

### Dev Server Not Responding

**Symptom**: Hook shows "Dev server not available"

**Solution**:
1. Start dev server: `pnpm run dev`
2. Verify port: `curl http://localhost:3000`
3. Check `PLAYWRIGHT_BASE_URL` matches dev server

```bash
export PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### Dashboard Not Showing Errors

**Symptom**: Dashboard starts but no errors appear

**Solution**:
1. Check WebSocket port (default: 3001)
2. Verify `DEV_DASHBOARD_ENABLED=true`
3. Trigger browser check manually to test connection

```bash
export DEV_DASHBOARD_PORT=3001
npx tsx src/dashboard/dev-browser-monitor.ts
```

### Too Many Guardian TODOs

**Symptom**: Spam of browser-check TODOs

**Solution**:
1. Increase `BROWSER_ERROR_SEVERITY_THRESHOLD` to `error`
2. Disable auto-TODO: `BROWSER_ERROR_AUTO_TODO=false`
3. Use dashboard for real-time monitoring instead

```bash
export BROWSER_ERROR_SEVERITY_THRESHOLD=error
export BROWSER_ERROR_AUTO_TODO=false
```

---

## Advanced Usage

### Custom Error Filtering

Filter specific error types:

```typescript
// .claude/hooks/post-file-edit-browser-check.ts
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();

  // Ignore warnings about specific libraries
  if (text.includes('React DevTools') || text.includes('Download the React DevTools')) {
    return;
  }

  // Only capture application errors
  if (messageLevel >= thresholdLevel) {
    consoleMessages.push({
      type,
      text,
      location: msg.location()?.url,
      timestamp: new Date().toISOString()
    });
  }
});
```

### Integration with CI/CD

Run browser checks in CI:

```yaml
# .github/workflows/browser-tests.yml
name: Browser Tests

on: [push, pull_request]

jobs:
  browser-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2

      - run: npm install
      - run: pnpm run dev &
      - run: sleep 10  # Wait for dev server

      - name: Run browser checks
        run: |
          pnpm run test:context-validation
        env:
          BROWSER_ERROR_CAPTURE: true
          PLAYWRIGHT_HEADLESS: true

      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: browser-check-results
          path: test-results/
```

---

## Compounding Learning

### Pattern Storage

After fixing browser errors, store patterns:

```bash
/learn "Fixed console error 'Cannot read properties of undefined' by adding optional chaining operator (?.) in Button.tsx"

# Guardian stores:
# - Error fingerprint
# - Fix pattern
# - File location
# - Success rate

# Next occurrence:
# - Guardian suggests auto-fix
# - Shows historical context
# - Confidence score (0-100%)
```

### Auto-Remediation (v7.11.0+)

After 3+ occurrences, Guardian auto-remediates:

```
Occurrence 1: Manual fix (Browser check TODO created)
Occurrence 2: Manual fix (Guardian learns pattern)
Occurrence 3: AUTO-FIX (≥80% confidence)
   Guardian applies fix automatically
   Creates verification TODO
   Notifies user: "✅ Auto-fixed: Optional chaining added"
```

---

## Related Documentation

- [Guardian Health System](../guardian/GUARDIAN_HEALTH_SYSTEM.md)
- [Maria-QA Agent](../../.claude/agents/maria-qa.md)
- [James-Frontend Agent](../../.claude/agents/james-frontend.md)
- [Playwright Configuration](../../config/playwright.config.ts)
- [Context-Aware Testing](../guides/CONTEXT_AWARE_TESTING.md)

---

## Version History

| Version | Change | Date |
|---------|--------|------|
| **7.14.0** | Browser testing system with real-time error capture | 2025-10-29 |
| **7.13.0** | User interaction learning (proactive answers) | 2025-10-28 |
| **7.11.0** | Root cause learning and auto-remediation | 2025-10-27 |
| **7.10.0** | Guardian automatic TODO generation | 2025-10-26 |

---

## Frequently Asked Questions

### Q1: Do I need to run dev server manually?

**A**: No, `watch-and-test` script starts dev server automatically if not running.

---

### Q2: Can I disable browser error capture temporarily?

**A**: Yes, set `BROWSER_ERROR_CAPTURE=false` in your environment.

---

### Q3: How do I capture network errors only (not console)?

**A**: Set `BROWSER_ERROR_SEVERITY_THRESHOLD=error` and `NETWORK_ERROR_CAPTURE=true`.

---

### Q4: Can I customize which status codes create TODOs?

**A**: Yes, set `NETWORK_ERROR_STATUS_CODES=500,502,503` (comma-separated).

---

### Q5: Does browser testing work with Vue/Svelte?

**A**: Yes, hook detects `.vue`, `.svelte` files and tests them the same way as React.

---

### Q6: Can I run browser tests in headful mode?

**A**: Yes, set `PLAYWRIGHT_HEADLESS=false` to see browser during tests.

---

### Q7: How do I integrate with existing E2E tests?

**A**: Context-validation tests run alongside existing tests. Use `--project=context-validation` to run separately.

---

### Q8: Can I use WebStorm/IntelliJ instead of VSCode?

**A**: Yes, all tools are CLI-based and work with any IDE.

---

### Q9: Does dashboard work on Windows?

**A**: Yes, dashboard uses blessed-contrib which supports Windows terminal.

---

### Q10: Can I deploy dashboard to production?

**A**: No, dashboard is dev-only. For production monitoring, use Sentry/LogRocket.

---

**Questions or Issues?**

- GitHub Issues: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Documentation: [CLAUDE.md](../../CLAUDE.md)
