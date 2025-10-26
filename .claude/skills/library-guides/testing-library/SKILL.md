---
name: testing-library
description: Quality assurance framework with 80%+ coverage enforcement, contract validation, and multi-project Jest configuration. Use when writing tests, enforcing quality gates, validating agent contracts, configuring Jest projects, or debugging test failures. Implements Enhanced Maria-QA standards with ts-jest (NO Babel).
tags: [testing, jest, quality-gates, coverage, maria-qa]
---

# testing/ - Quality Assurance Framework

**Priority**: HIGH
**Agent(s)**: Maria-QA (primary owner)
**Last Updated**: 2025-10-26

## When to Use

- Writing unit tests, integration tests, or stress tests
- Enforcing quality gates (80%+ coverage, 90%+ for critical paths)
- Validating agent handoff contracts (ThreeTierHandoffBuilder)
- Configuring Jest test projects (unit/integration/stress)
- Debugging test failures or coverage issues
- Setting up pre-commit hooks for quality enforcement
- Testing OPERA agent activation logic
- Implementing AAA test patterns (Arrange, Act, Assert)

## What This Library Provides

### Core Services
- **ContractValidator**: Validates agent handoff contracts (score ≥90 required)
- **QualityGateEnforcer**: Blocks commits if coverage/quality thresholds not met
- **SmartTestSelector**: Selects relevant tests based on git diff
- **AgentTestingFramework**: Helper utilities for testing OPERA agents
- **StressTestRunner**: High-load scenarios with resource monitoring

### Key Features
- **Enhanced Maria-QA Standards**: 80%+ coverage minimum, 90%+ for critical paths
- **Multi-Project Setup**: Separate Jest projects (unit/integration/stress)
- **ts-jest Only**: Native SDK requires ts-jest, NO Babel
- **Quality Gates**: Pre-commit hooks enforce coverage thresholds
- **Smart Selection**: Only run tests affected by code changes

### File Structure
```
src/testing/
├── stress-test-config.ts              # Stress test config
├── agent-testing-framework.ts         # Agent test utils
├── smart-test-selector.ts             # Git-aware selection
├── quality-gate-enforcer.ts           # Coverage enforcement
└── opera-testing-orchestrator.ts      # Multi-agent test coordination

config/jest.config.cjs                 # Main Jest config
config/jest-unit.config.cjs            # Unit test project
tests/setup.ts                         # Global test setup
```

## Core Conventions

### DO ✓
- ✓ **Use ts-jest, NOT babel-jest** - Native SDK requires ts-jest only
- ✓ **Enforce 80%+ coverage** - Enhanced Maria-QA standard
- ✓ **Separate test projects** - unit/integration/stress in separate Jest projects
- ✓ **Mock external dependencies** - Use jest.mock() for APIs, file system, etc.
- ✓ **Use AAA pattern** - Arrange, Act, Assert structure in all tests
- ✓ **Test contract validation** - Validate ThreeTierHandoffBuilder contracts

### DON'T ✗
- ✗ **Don't use Babel** - Conflicts with Native SDK (ts-node)
- ✗ **Don't skip quality gates** - Never use `git commit --no-verify` for code changes
- ✗ **Don't test implementation details** - Test behavior, not internals
- ✗ **Don't use console.log in tests** - Use expect() assertions
- ✗ **Don't create flaky tests** - Avoid timing-dependent tests, mock Date.now()

## Quick Start Patterns

### Pattern 1: Unit Test with AAA Structure
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
```typescript
import { mariaQA } from '@/agents/opera/maria-qa/enhanced-maria.js';
import { AgentTestingFramework } from '@/testing/agent-testing-framework.js';

describe('agents - EnhancedMaria', () => {
  const testFramework = new AgentTestingFramework();

  it('should detect missing test coverage', async () => {
    // Arrange - Use framework helper
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
```typescript
import { ThreeTierHandoffBuilder } from '@/agents/contracts/three-tier-handoff.js';

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
    expect(contract.validation.score).toBeGreaterThanOrEqual(90);
  });
});
```

## Important Gotchas

### Gotcha 1: Babel vs ts-jest Configuration
**Problem**: Babel auto-activates if @babel/* packages detected, breaks Native SDK

**Solution**: Use ts-jest with babelConfig: false
```typescript
// ✅ Good - Explicit ts-jest, no Babel
module.exports = {
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      isolatedModules: true,
      useESM: false,
      babelConfig: false, // CRITICAL - Disables Babel
      diagnostics: false
    }]
  }
};
```

### Gotcha 2: Test Assertion Exact Values (90 vs <90)
**Problem**: `expect(90).toBeLessThan(90)` fails, should use `toBeLessThanOrEqual(90)`

**Solution**: Use correct comparison operators
```typescript
// ✅ Good - Handles exact value
expect(result.score).toBeLessThanOrEqual(90);
expect(result.score).toBeGreaterThanOrEqual(90);
```

### Gotcha 3: Missing Work Items Causes Validation Failure
**Problem**: ThreeTierHandoffBuilder requires ≥1 work item, but may auto-generate 0

**Solution**: Always add default work item if empty (see agents-library skill for details)

## Coverage Requirements

- **Minimum**: 80% (Enhanced Maria-QA standard)
- **Agents**: 85%+ (src/agents/)
- **Testing library**: 90%+ (src/testing/)
- **Critical paths**: 90%+ (authentication, payment, security)

## Performance Targets

- **Unit tests**: < 1s per test
- **Integration tests**: < 5s per test
- **Stress tests**: Configurable (default 30s)

### Optimization Tips
- Parallel execution (Jest default)
- Smart test selection (SmartTestSelector)
- Mock expensive operations (API calls, file I/O, DB queries)

## Test Commands

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

# Run single test file
npm test -- path/to/test.test.ts
```

## Debugging Tips

### Common Issues
1. **Tests failing with Babel errors**: Remove @babel/* packages, use ts-jest
2. **Coverage not enforced**: Check pre-commit hook configuration
3. **Flaky tests**: Mock Date.now(), setTimeout, network requests

### Debug Logging
```bash
# Run tests with verbose output
npm test -- --verbose

# Enable debug mode
DEBUG=testing:* npm test
```

## Related Documentation

For detailed testing guides:
- [references/jest-configuration.md](references/jest-configuration.md) - Multi-project setup
- [references/aaa-pattern.md](references/aaa-pattern.md) - Arrange, Act, Assert examples
- [references/contract-validation.md](references/contract-validation.md) - Handoff contract testing
- [references/quality-gates.md](references/quality-gates.md) - Coverage enforcement

For test results:
- [.versatil/test-results/](../../.versatil/test-results/) - Test output logs
- [coverage/](../../coverage/) - Coverage reports

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/testing/**` or `tests/**`
