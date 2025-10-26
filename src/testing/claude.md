# testing/ - Quality Assurance Framework

**Priority**: HIGH
**Agent(s)**: Maria-QA (primary owner)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Provides comprehensive testing infrastructure for VERSATIL framework - unit tests (Jest), integration tests (Jest), stress tests, contract validation, and quality gate enforcement. Implements Enhanced Maria-QA standards (80%+ coverage, 90%+ for critical paths).

## 🎯 Core Concepts

### Key Abstractions
- **ContractValidator**: Validates agent handoff contracts (score ≥90 required)
- **StressTestRunner**: Executes high-load scenarios with resource monitoring
- **QualityGateEnforcer**: Blocks commits if coverage/quality thresholds not met
- **SmartTestSelector**: Selects relevant tests based on file changes (git diff)
- **AgentTestingFramework**: Helper utilities for testing OPERA agents

### Design Patterns Used
- **Test Projects Pattern**: Separate Jest projects for unit/integration/stress tests
- **Quality Gate Pattern**: Pre-commit hooks enforce 80%+ coverage
- **Smart Selection**: Only run tests affected by code changes
- **Fixture Pattern**: Reusable test data factories

## 📁 File Organization

```
src/testing/
├── stress-test-config.ts              # Stress test configuration
├── agent-testing-framework.ts         # Agent test utilities
├── automated-stress-test-generator.ts # Auto-generate stress tests
├── opera-testing-orchestrator.ts      # Multi-agent test coordination
├── smart-test-selector.ts             # Git-aware test selection
├── quality-gate-enforcer.ts           # Coverage/quality enforcement
└── instinctive-testing-engine.ts      # Auto-test generation

config/jest.config.cjs                 # Main Jest configuration
config/jest-unit.config.cjs            # Unit test project
tests/setup.ts                         # Global test setup
```

## ✅ Development Rules

### DO ✓
- ✓ **Use ts-jest, NOT babel-jest** - Native SDK requires ts-jest only
- ✓ **Enforce 80%+ coverage** - Enhanced Maria-QA standard
- ✓ **Separate test projects** - unit/integration/stress in separate Jest projects
- ✓ **Mock external dependencies** - use jest.mock() for APIs, file system, etc.
- ✓ **Use AAA pattern** - Arrange, Act, Assert structure in all tests
- ✓ **Test contract validation** - validate ThreeTierHandoffBuilder contracts

### DON'T ✗
- ✗ **Don't use Babel** - conflicts with Native SDK (ts-node)
- ✗ **Don't skip quality gates** - never use `git commit --no-verify` for code changes
- ✗ **Don't test implementation details** - test behavior, not internals
- ✗ **Don't use console.log in tests** - use expect() assertions
- ✗ **Don't create flaky tests** - avoid timing-dependent tests, mock Date.now()

## 🔧 Common Patterns

### Pattern 1: Unit Test with AAA Structure
**When to use**: Testing individual functions/classes in isolation

```typescript
import { PatternSearchService } from '@/rag/pattern-search.js';

describe('rag - PatternSearchService', () => {
  let service: PatternSearchService;

  beforeEach(() => {
    service = new PatternSearchService();
  });

  describe('searchSimilarFeatures', () => {
    it('should return historical patterns above similarity threshold', async () => {
      // Arrange
      const query = {
        description: 'authentication JWT',
        limit: 5,
        min_similarity: 0.75
      };

      // Act
      const result = await service.searchSimilarFeatures(query);

      // Assert
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns[0].similarity_score).toBeGreaterThanOrEqual(0.75);
      expect(result.search_method).toMatch(/graphrag|vector|local/);
    });
  });
});
```

### Pattern 2: Agent Testing with Framework Helpers
**When to use**: Testing OPERA agent activation logic

```typescript
import { mariaQA } from '@/agents/opera/maria-qa/enhanced-maria.js';
import { AgentTestingFramework } from '@/testing/agent-testing-framework.js';

describe('agents - EnhancedMaria', () => {
  const testFramework = new AgentTestingFramework();

  it('should detect missing test coverage', async () => {
    // Arrange - Use framework helper to create context
    const context = testFramework.createActivationContext({
      filePath: 'src/services/auth.ts',
      content: 'export function login() { /* implementation */ }',
      actionType: 'create'
    });

    // Act
    const response = await mariaQA.activate(context);

    // Assert
    expect(response.shouldActivate).toBe(true);
    expect(response.suggestions).toContainEqual(
      expect.stringContaining('Missing test coverage')
    );
  });
});
```

### Pattern 3: Contract Validation Testing
**When to use**: Testing three-tier handoff contracts

```typescript
import { ThreeTierHandoffBuilder } from '@/agents/contracts/three-tier-handoff.js';
import { ContractValidator } from '@/agents/contracts/contract-validator.js';

describe('contracts - ThreeTierHandoffBuilder', () => {
  it('should validate contract with score ≥90', async () => {
    // Arrange
    const builder = new ThreeTierHandoffBuilder({
      name: 'User Authentication',
      businessRequirements: 'Users can sign up and log in',
      acceptanceCriteria: ['Signup works', 'Login works']
    });

    builder.withDatabaseTier({ schemaDesign: '...', migrations: [] });
    builder.withAPITier({ endpoints: [], securityPatterns: [] });
    builder.withFrontendTier({ components: [], accessibility: '...' });

    // Act
    const contract = await builder.buildAndValidate();

    // Assert
    expect(contract).toBeDefined();
    expect(contract.validation.score).toBeGreaterThanOrEqual(90);
  });
});
```

## ⚠️ Gotchas & Edge Cases

### Gotcha 1: Babel vs ts-jest Configuration
**Problem**: Babel auto-activates if @babel/* packages detected, breaks Native SDK
**Solution**: Use ts-jest with babelConfig: false

```typescript
// ❌ Bad - Uses Babel (breaks Native SDK)
module.exports = {
  preset: 'ts-jest', // Auto-loads babel-jest if @babel/* installed
};

// ✅ Good - Explicit ts-jest, no Babel
module.exports = {
  // NO preset
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      useESM: false,
      babelConfig: false, // CRITICAL
      diagnostics: false
    }]
  }
};
```

### Gotcha 2: Test Assertion Exact Values (90 vs <90)
**Problem**: `expect(90).toBeLessThan(90)` fails, should use `toBeLessThanOrEqual(90)`
**Solution**: Use correct comparison operators

```typescript
// ❌ Bad - Fails if score exactly 90
expect(result.score).toBeLessThan(90);

// ✅ Good - Handles exact value
expect(result.score).toBeLessThanOrEqual(90);
```

### Gotcha 3: Missing Work Items Causes Validation Failure
**Problem**: ThreeTierHandoffBuilder requires ≥1 work item, but may auto-generate 0
**Solution**: Always add default work item if empty (see agents/claude.md for details)

## 🧪 Testing Guidelines

### Test Structure
- **describe**: Group tests by module (e.g., 'rag - PatternSearchService')
- **beforeEach**: Reset state between tests
- **it**: Single behavior assertion per test

### Common Test Patterns
- **Unit tests**: Test individual functions/classes with mocked dependencies
- **Integration tests**: Test multiple modules together with real dependencies
- **Stress tests**: High-load scenarios with resource monitoring

### Coverage Requirements
- **Minimum**: 80% (Enhanced Maria-QA standard)
- **Agents**: 85%+ (src/agents/)
- **Testing library itself**: 90%+ (src/testing/)
- **Critical paths**: 90%+ (authentication, payment, security)

## 🔗 Dependencies

### Internal Dependencies
- **agents/**: Testing agent activation logic
- **utils/logger.js**: VERSATILLogger for test logging

### External Dependencies
- **jest**: 29.7.0 (NOT 30 - breaking changes)
- **ts-jest**: ^29.2.5
- **@types/jest**: ^29.5.14

## 🎨 Code Style Preferences

### Naming Conventions
- **Test files**: `*.test.ts` or `*.spec.ts`
- **Test suites**: `describe('[module] - [class/function]', ...)`
- **Test cases**: `it('should [expected behavior]', ...)`

### Async Patterns
- **Preferred**: async/await in tests
- **Always await**: All async operations in tests

### Error Handling
```typescript
it('should throw error on invalid input', async () => {
  await expect(service.search({ query: '' }))
    .rejects
    .toThrow('Query cannot be empty');
});
```

## 📊 Performance Considerations

### Performance Targets
- Unit tests: < 1s per test
- Integration tests: < 5s per test
- Stress tests: Configurable (default 30s)

### Optimization Tips
- **Parallel execution**: Jest runs tests in parallel by default
- **Smart test selection**: Only run affected tests (SmartTestSelector)
- **Mock expensive operations**: Mock API calls, file I/O, database queries

## 🔍 Debugging Tips

### Common Issues
1. **Tests failing with Babel errors**: Remove @babel/* packages, use ts-jest
2. **Coverage not enforced**: Check pre-commit hook configuration
3. **Flaky tests**: Mock Date.now(), setTimeout, network requests

### Debug Logging
```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test file
npm test -- path/to/test.test.ts

# Run tests in watch mode
npm test -- --watch
```

## 📚 Related Documentation

- [Jest Configuration](../../config/jest.config.cjs)
- [Test Results](.versatil/test-results/)
- [Coverage Reports](../../coverage/)
- [Enhanced Maria-QA Agent](../agents/opera/maria-qa/enhanced-maria.ts)

## 🚀 Quick Start Example

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- --selectProjects=UNIT

# Run integration tests
npm test -- --selectProjects=INTEGRATION

# Run stress tests
npm test -- --selectProjects=STRESS

# Run with coverage
npm test -- --coverage

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

## 🔄 Migration Notes

### From v6.5.0 to v6.6.0
- **Breaking**: Removed Babel support - all tests must use ts-jest
- **Enhanced**: Coverage thresholds increased to 80% (was 50%)
- **New**: Smart test selection based on git diff

### Deprecation Warnings
- **babel-jest**: Removed - use ts-jest only (Native SDK requirement)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('testing')`
**Priority Layer**: User Preferences > **Library Context** > Team Conventions > Framework Defaults
