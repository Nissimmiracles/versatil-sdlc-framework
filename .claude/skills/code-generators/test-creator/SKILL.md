---
name: test-creator
description: Generate unit and integration tests with AAA pattern (Arrange, Act, Assert) and 80%+ coverage. Use when creating tests, implementing test patterns, or ensuring Maria-QA standards. Provides unit-test-template.ts and integration-test-template.ts for fast test generation.
tags: [code-generation, testing, jest, aaa-pattern, maria-qa]
---

# test-creator - Test Generator

**Purpose**: Generate unit and integration tests following Enhanced Maria-QA standards

## When to Use

- Creating unit tests with AAA pattern (Arrange, Act, Assert)
- Writing integration tests for multi-service workflows
- Ensuring 80%+ test coverage (Enhanced Maria-QA standard)
- Following Jest + ts-jest patterns

## Quick Start

### Unit Test
1. **Copy template**: `cp .claude/skills/code-generators/test-creator/assets/unit-test-template.ts tests/unit/your-test.test.ts`
2. **Replace placeholders**: `{{CLASS_NAME}}`, `{{METHOD_1}}`, `{{TEST_1_DESC}}`, etc.
3. **Run test**: `npm test -- your-test.test.ts`

### Integration Test
1. **Copy template**: `cp .claude/skills/code-generators/test-creator/assets/integration-test-template.ts tests/integration/your-integration.test.ts`
2. **Replace placeholders**: `{{SERVICE_1}}`, `{{WORKFLOW_1}}`, `{{INTEGRATION_TEST_1_DESC}}`, etc.
3. **Run test**: `npm test -- --selectProjects=INTEGRATION`

## AAA Pattern (Required)

All tests must follow Arrange, Act, Assert:

```typescript
it('should return patterns above similarity threshold', async () => {
  // Arrange - Setup test data
  const query = { description: 'auth', min_similarity: 0.75 };

  // Act - Execute function
  const result = await service.searchSimilarFeatures(query);

  // Assert - Verify results
  expect(result.patterns.length).toBeGreaterThan(0);
  expect(result.patterns[0].similarity_score).toBeGreaterThanOrEqual(0.75);
});
```

## Coverage Requirements

- **Minimum**: 80% (Enhanced Maria-QA standard)
- **Critical paths**: 90%+ (authentication, payment, security)
- **Focus**: Happy path + error cases + edge cases

## Template Locations

- [assets/unit-test-template.ts](assets/unit-test-template.ts)
- [assets/integration-test-template.ts](assets/integration-test-template.ts)

## Real Examples

- [tests/unit/framework-self-test.test.ts](../../../tests/unit/framework-self-test.test.ts)
- [tests/integration/library-context-injection.test.ts](../../../tests/integration/library-context-injection.test.ts)
