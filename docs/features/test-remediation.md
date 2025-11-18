# Automated Test Remediation

**Status**: ✅ Production Ready (v7.16.2+)
**Impact**: Automated fixing for 861+ failing tests

---

## 🎯 Overview

VERSATIL's Test Remediation System automatically detects, analyzes, and fixes common test failure patterns. Instead of manually debugging hundreds of failing tests, the system applies proven fix patterns to resolve issues at scale.

### Key Benefits

| Manual Approach | Automated Remediation |
|----------------|----------------------|
| ⏱️ **40 hours** (861 tests × 3 min) | ⏱️ **2 hours** automated |
| 👤 Manual analysis required | 🤖 Pattern-based fixes |
| ❌ Inconsistent fixes | ✅ Standardized solutions |
| 📝 No learning | 🧠 Pattern library grows |

---

## 🔧 Supported Fix Patterns

### 1. Import Resolution Failures

**Pattern**: Module not found errors
```typescript
// Error
Error: Cannot find module '@/utils/helpers'

// Auto-fix
- import { helper } from '@/utils/helpers';
+ import { helper } from '../utils/helpers';
```

**Detection**:
- `TS2307: Cannot find module`
- `Error: Cannot find module`
- Failed dynamic imports

**Fix Strategy**:
1. Scan `tsconfig.json` for path mappings
2. Resolve actual file location
3. Update import with correct relative path
4. Verify module exists

### 2. Async/Await Issues

**Pattern**: Missing await on promises
```typescript
// Error
Unhandled promise rejection

// Auto-fix
- const result = fetchData();
+ const result = await fetchData();
```

**Detection**:
- `UnhandledPromiseRejectionWarning`
- Promise returned in non-async context
- Missing `.then()` or `await`

**Fix Strategy**:
1. Identify promise-returning calls
2. Add `await` keyword
3. Ensure function is `async`
4. Add error handling

### 3. Mock Configuration

**Pattern**: Incomplete or incorrect mocks
```typescript
// Error
TypeError: mockFunction is not a function

// Auto-fix
beforeEach(() => {
-  jest.mock('./service');
+  jest.mock('./service', () => ({
+    fetchData: jest.fn().mockResolvedValue({ data: 'test' })
+  }));
});
```

**Detection**:
- `is not a function` errors
- `undefined` mock returns
- Spy not properly configured

**Fix Strategy**:
1. Identify mocked module
2. Detect expected function signatures
3. Generate appropriate mock implementation
4. Add default return values

### 4. Timeout Issues

**Pattern**: Tests exceeding timeout limits
```typescript
// Error
Timeout - Async callback was not invoked within 5000ms

// Auto-fix
- it('fetches data', async () => {
+ it('fetches data', async () => {
    const data = await fetchLargeDataset();
    expect(data).toBeDefined();
- });
+ }, 10000); // Increased timeout
```

**Detection**:
- Timeout exceeded errors
- Long-running async operations
- Network request tests

**Fix Strategy**:
1. Analyze operation duration
2. Calculate appropriate timeout
3. Add timeout parameter
4. Consider mocking slow operations

### 5. Type Errors

**Pattern**: TypeScript type mismatches
```typescript
// Error
TS2345: Argument of type 'string' is not assignable to parameter of type 'number'

// Auto-fix
- expect(user.age).toBe('25');
+ expect(user.age).toBe(25);
```

**Detection**:
- `TS2345` (type assignment errors)
- `TS2322` (type mismatch)
- `TS2339` (property doesn't exist)

**Fix Strategy**:
1. Analyze expected vs actual types
2. Add type casting if safe
3. Update test data to match types
4. Add type assertions where needed

### 6. Snapshot Mismatches

**Pattern**: Outdated snapshots
```typescript
// Error
Snapshot mismatch

// Auto-fix options
1. Update snapshot (if intentional change)
2. Revert code (if unintentional change)
3. Normalize dynamic values
```

**Detection**:
- Snapshot comparison failures
- Changed component output
- Updated API responses

**Fix Strategy**:
1. Analyze snapshot diff
2. Determine if change is intentional
3. Update snapshot or flag for review
4. Normalize timestamps/IDs

---

## 🚀 Usage

### Automatic Remediation

```bash
# Scan and fix all failing tests
pnpm run test:remediate

# Dry run (show fixes without applying)
pnpm run test:remediate --dry-run

# Fix specific test file
pnpm run test:remediate tests/api/users.test.ts

# Fix specific pattern type
pnpm run test:remediate --pattern=imports
```

### Maria-QA Integration

Maria-QA automatically runs remediation:

```bash
/maria-qa "Fix failing tests"

# Maria will:
# 1. Run test suite
# 2. Identify failures
# 3. Apply remediation patterns
# 4. Re-run tests
# 5. Report results
```

### Guardian Auto-Remediation

Iris-Guardian monitors test health:

```yaml
# .versatil/guardian/config.yml
auto_remediation:
  enabled: true
  triggers:
    - test_failure_threshold: 10  # Auto-fix if >10 tests fail
    - test_failure_rate: 0.05     # Auto-fix if >5% fail
  patterns:
    - imports
    - async_await
    - mocks
    - timeouts
```

---

## 📊 Remediation Report

### Example Output

```
🔧 Test Remediation Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Tests Scanned: 861
❌ Tests Failing: 234 (27.2%)
✅ Tests Fixed: 198 (84.6%)
⚠️  Tests Needs Review: 36 (15.4%)

🎯 Fix Patterns Applied:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Import Resolution    127 fixes (64.1%)
2. Async/Await Issues    45 fixes (22.7%)
3. Mock Configuration    18 fixes (9.1%)
4. Timeout Issues         5 fixes (2.5%)
5. Type Errors            3 fixes (1.5%)

📈 Success Rate: 84.6%
⏱️  Time Saved: ~38 hours (vs manual)

✅ Ready to Commit: 198 files modified
⚠️  Needs Review: tests/edge-cases/*.test.ts
```

### Pattern Library Stats

```typescript
interface RemediationStats {
  totalPatterns: 47;
  successRate: {
    imports: 0.95,        // 95% success
    async_await: 0.89,    // 89% success
    mocks: 0.78,          // 78% success
    timeouts: 0.92,       // 92% success
    types: 0.85,          // 85% success
    snapshots: 0.67       // 67% success (often needs review)
  };
  avgTimePerFix: 2.3;     // seconds
  manualTimePerFix: 180;  // 3 minutes
}
```

---

## 🔍 Pattern Development

### Adding Custom Patterns

```typescript
// .versatil/remediation/custom-patterns.ts
export const customPatterns: RemediationPattern[] = [
  {
    name: 'custom-api-mock',
    detect: (error: TestError) => {
      return error.message.includes('API call failed in test');
    },
    fix: async (testFile: string, error: TestError) => {
      // 1. Find API call
      const apiCall = findApiCall(testFile, error.line);

      // 2. Generate mock
      const mock = generateApiMock(apiCall);

      // 3. Inject mock
      await injectMock(testFile, mock);

      return { success: true, changes: 1 };
    },
    validate: async (testFile: string) => {
      // Run test again to verify fix
      return await runTest(testFile);
    }
  }
];
```

### Pattern Template

```typescript
interface RemediationPattern {
  name: string;
  description: string;
  detect: (error: TestError) => boolean;
  fix: (testFile: string, error: TestError) => Promise<FixResult>;
  validate: (testFile: string) => Promise<boolean>;
  confidence: number; // 0-1, how confident we are in this fix
  manualReview: boolean; // Should human review this?
}
```

---

## 🛡️ Safety Features

### 1. Backup Before Changes

```bash
# Auto-backup before remediation
~/.versatil/backups/test-remediation/
├── 2024-11-18-10-30-00/
│   ├── users.test.ts
│   ├── auth.test.ts
│   └── manifest.json
```

### 2. Confidence Scoring

```typescript
interface FixResult {
  success: boolean;
  confidence: number;  // 0.0 - 1.0
  changes: number;
  manualReview: boolean;
}

// High confidence (>0.9): Auto-apply
// Medium confidence (0.7-0.9): Apply + flag for review
// Low confidence (<0.7): Flag for manual fix
```

### 3. Rollback Support

```bash
# Rollback all changes
pnpm run test:remediate --rollback

# Rollback specific file
pnpm run test:remediate --rollback tests/users.test.ts

# Rollback to specific timestamp
pnpm run test:remediate --rollback --timestamp=2024-11-18-10-30-00
```

---

## 📈 Analytics

### Track Remediation Effectiveness

```bash
# View remediation history
versatil-daemon remediation-stats

# Output
{
  "totalRemediations": 47,
  "successRate": 0.846,
  "avgFixesPerRun": 12.3,
  "mostCommonPattern": "import_resolution",
  "timeSaved": "142 hours",
  "patterns": {
    "imports": { runs: 23, success: 22, rate: 0.95 },
    "async": { runs: 15, success: 13, rate: 0.87 }
  }
}
```

### Learning from Failures

```typescript
// System tracks failed fixes
interface FailedFix {
  pattern: string;
  testFile: string;
  error: Error;
  attemptedFix: string;
  timestamp: Date;
}

// Used to improve patterns
function improvePattern(failures: FailedFix[]) {
  // Analyze common failure modes
  // Update pattern detection
  // Refine fix strategies
  // Increase confidence threshold
}
```

---

## 🎓 Best Practices

### 1. Run Remediation in CI/CD

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: pnpm test

- name: Auto-Remediate Failures
  if: failure()
  run: |
    pnpm run test:remediate --dry-run > remediation-report.txt
    # Review report, apply if safe
```

### 2. Review Low-Confidence Fixes

```bash
# Get list of low-confidence fixes
pnpm run test:remediate --report-low-confidence

# Review these manually
cat ~/.versatil/remediation/low-confidence-fixes.json
```

### 3. Keep Patterns Updated

```bash
# Update pattern library
pnpm run test:update-patterns

# Add project-specific patterns
cp my-patterns.ts .versatil/remediation/custom-patterns.ts
```

---

## 🔧 Configuration

```typescript
// .versatil/config/test-remediation.ts
export default {
  remediation: {
    // Enable/disable
    enabled: true,

    // Auto-apply thresholds
    autoApply: {
      minConfidence: 0.85,     // Only auto-apply if >85% confident
      maxChanges: 50,          // Max files to change automatically
      requireReview: [         // Always review these patterns
        'snapshots',
        'database_mocks'
      ]
    },

    // Backup
    backup: {
      enabled: true,
      retention: 30            // Keep backups for 30 days
    },

    // Patterns to use
    patterns: [
      'imports',
      'async_await',
      'mocks',
      'timeouts',
      'types',
      'snapshots'
    ],

    // Custom patterns
    customPatterns: './remediation/custom-patterns.ts'
  }
}
```

---

## 📚 Related Documentation

- [Maria-QA Testing Guide](../agents/maria-qa/README.md)
- [Test Coverage Requirements](./quality-gates.md#test-coverage)
- [Testing Strategies Skill](../skills/testing-strategies.md)
- [Guardian Auto-Remediation](./guardian-system.md)

---

**Next**: [Quality Gates](./quality-gates.md)
