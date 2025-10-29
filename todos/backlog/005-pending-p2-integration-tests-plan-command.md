# Integration Tests for Enhanced /plan Command - P2

## Status
- [ ] Pending
- **Priority**: P2 (High - Quality gate)
- **Created**: 2025-10-26
- **Assigned**: Maria-QA
- **Estimated Effort**: Small (2 hours)

## Description

Create comprehensive integration tests for the enhanced `/plan` command that validate the full workflow: pattern search → template matching → plan generation → dual todo creation → enhanced output. This ensures all three services work together correctly.

## Acceptance Criteria

- [ ] Create `tests/integration/plan-command-e2e.test.ts`
- [ ] Test with template match scenario ("Add user authentication")
- [ ] Test with historical patterns scenario (if RAG has data)
- [ ] Test with no template match (custom feature)
- [ ] Test dual todo creation (TodoWrite + files)
- [ ] Test enhanced output format (confidence, risk, alternatives)
- [ ] Test explicit template selection (`--template=auth-system`)
- [ ] Test `--dry-run` flag (no file creation)
- [ ] Achieve 80%+ code coverage for plan workflow

## Context

- **Related Issue**: #001 - Enhance /plan Command
- **Related PR**: TBD
- **Files Involved**:
  - `tests/integration/plan-command-e2e.test.ts` (new - ~300 lines)
  - `src/rag/pattern-search.ts` (test integration)
  - `src/templates/template-matcher.ts` (test integration)
  - `src/planning/todo-file-generator.ts` (test integration)
  - `.claude/commands/plan.md` (command being tested)
- **References**:
  - Existing integration tests: `tests/integration/`
  - Jest configuration: `config/jest.config.cjs`

## Dependencies

- **Depends on**:
  - 002 - Pattern Search Service (must exist to test)
  - 003 - Template Matcher Service (must exist to test)
  - 004 - Todo File Generator (must exist to test)
- **Blocks**:
  - 006 - Plan command integration (should be tested first)
- **Related to**: 001 - Master enhancement task

## Implementation Notes

### Test Scenarios

1. **Scenario: Template Match - Auth System**
   ```typescript
   test('matches "Add user authentication" to auth-system template', async () => {
     const result = await planCommand('Add user authentication');
     expect(result.template_used).toBe('auth-system.yaml');
     expect(result.match_score).toBeGreaterThanOrEqual(80);
     expect(result.estimated_effort).toBe(28);
     expect(result.confidence).toBeGreaterThanOrEqual(80);
   });
   ```

2. **Scenario: Template Match - CRUD Endpoint**
   ```typescript
   test('matches "Add products API" to crud-endpoint template', async () => {
     const result = await planCommand('Add products API');
     expect(result.template_used).toBe('crud-endpoint.yaml');
     expect(result.estimated_effort).toBe(8);
   });
   ```

3. **Scenario: No Template Match**
   ```typescript
   test('handles custom feature without template', async () => {
     const result = await planCommand('Unique custom quantum feature');
     expect(result.template_used).toBeNull();
     expect(result.search_method).toBe('agent-research');
   });
   ```

4. **Scenario: Historical Patterns**
   ```typescript
   test('finds similar historical features via pattern search', async () => {
     // Mock GraphRAG with 3 historical auth features
     mockGraphRAG.addPattern({ feature: 'User login', hours: 24 });
     mockGraphRAG.addPattern({ feature: 'OAuth integration', hours: 32 });

     const result = await planCommand('Add authentication');
     expect(result.historical_patterns.length).toBeGreaterThan(0);
     expect(result.avg_effort).toBe(28); // Average of 24 and 32
   });
   ```

5. **Scenario: Dual Todo Creation**
   ```typescript
   test('creates both TodoWrite and persistent files', async () => {
     const result = await planCommand('Add user profile');

     // Check TodoWrite items
     expect(result.todowrite_items.length).toBeGreaterThan(0);

     // Check persistent files created
     expect(fs.existsSync('todos/002-pending-p1-*.md')).toBe(true);

     // Check link between TodoWrite and files
     expect(result.todowrite_items[0].file_path).toMatch(/todos\/\d+-pending/);
   });
   ```

6. **Scenario: Enhanced Output Format**
   ```typescript
   test('generates plan with confidence, risks, alternatives', async () => {
     const result = await planCommand('Build analytics dashboard');

     expect(result.confidence.score).toBeGreaterThan(0);
     expect(result.confidence.score).toBeLessThanOrEqual(100);
     expect(result.risks.high).toBeDefined();
     expect(result.risks.medium).toBeDefined();
     expect(result.risks.low).toBeDefined();
     expect(result.alternative_approaches.length).toBeGreaterThan(0);
   });
   ```

7. **Scenario: Explicit Template Selection**
   ```typescript
   test('uses explicitly selected template via --template flag', async () => {
     const result = await planCommand('Custom auth', { template: 'auth-system' });
     expect(result.template_used).toBe('auth-system.yaml');
     expect(result.match_score).toBe(100); // Explicit selection = 100%
   });
   ```

8. **Scenario: Dry Run (No File Creation)**
   ```typescript
   test('dry-run mode does not create files', async () => {
     const beforeFiles = fs.readdirSync('todos/');

     const result = await planCommand('Test feature', { dryRun: true });

     const afterFiles = fs.readdirSync('todos/');
     expect(beforeFiles.length).toBe(afterFiles.length);
     expect(result.dry_run).toBe(true);
   });
   ```

### Mock Setup Required

```typescript
// Mock GraphRAG store
const mockGraphRAG = {
  patterns: new Map(),
  addPattern(pattern: any) { /* add to patterns */ },
  search(query: string) { /* return matching patterns */ }
};

// Mock Vector store
const mockVectorStore = {
  memories: [],
  searchMemories(query: string) { /* return similar memories */ }
};

// Mock file system (for dry-run tests)
const mockFS = {
  createdFiles: [],
  writeFile(path: string, content: string) { /* track without writing */ }
};
```

### Suggested Approach

1. **Setup test environment**
   - Create temporary `todos/` directory for test files
   - Mock GraphRAG and Vector stores
   - Load real YAML templates
   - Clean up test files after each test

2. **Test each service independently**
   - Pattern Search: Mock historical data, test search results
   - Template Matcher: Test keyword matching with real templates
   - Todo Generator: Test file creation and numbering

3. **Test integrated workflow**
   - End-to-end plan generation
   - Service coordination (pattern search → template match → todo creation)
   - Output format validation

4. **Test edge cases**
   - No templates match
   - No historical patterns
   - Empty RAG store
   - Conflicting dependencies
   - Invalid feature descriptions

### Potential Challenges

- **Challenge**: Tests depend on real template files
  - **Mitigation**: Copy templates to test fixtures, or use real templates

- **Challenge**: File system operations in tests (cleanup)
  - **Mitigation**: Use `afterEach` to clean up test files, use temp directories

- **Challenge**: Mocking complex RAG stores
  - **Mitigation**: Create lightweight mock implementations, or use in-memory stores

## Testing Requirements

- [ ] Unit test: Each service in isolation (pattern search, template matcher, todo generator)
- [ ] Integration test: Full /plan workflow with all services
- [ ] Integration test: Template matching accuracy (all 5 templates)
- [ ] Integration test: Historical pattern search (with mock data)
- [ ] Integration test: Dual todo creation (TodoWrite + files)
- [ ] Integration test: Enhanced output format validation
- [ ] Integration test: Explicit template selection
- [ ] Integration test: Dry-run mode
- [ ] Clean up all test files after tests
- [ ] Achieve 80%+ code coverage

## Documentation Updates

- [ ] Add test documentation explaining scenarios
- [ ] Add inline comments for complex mock setups
- [ ] Document test fixtures and data
- [ ] Update testing guide with integration test patterns

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 9 acceptance criteria met
2. ✅ All 8 test scenarios passing
3. ✅ 80%+ code coverage achieved
4. ✅ No test file leaks (all cleaned up)
5. ✅ Tests run in CI environment
6. ✅ All edge cases covered

**Resolution Steps**:
```bash
# Run integration tests
npm run test:integration -- plan-command-e2e.test.ts

# Check coverage
npm run test:coverage -- plan-command-e2e.test.ts

# Verify cleanup
ls todos/*test* # Should be empty

# Mark as resolved
mv todos/005-pending-p2-integration-tests-plan-command.md todos/005-resolved-integration-tests-plan-command.md
```

---

## Notes

**Implementation Priority**: HIGH - Quality gate ensures all services work together before integration into /plan command.

**Test Data Strategy**:
- Use real YAML templates (already exist)
- Mock GraphRAG with 3-5 sample patterns per category
- Mock Vector store with simple in-memory array
- Clean up test todos after each test

**Coverage Target**: 80%+ for:
- `src/rag/pattern-search.ts`
- `src/templates/template-matcher.ts`
- `src/planning/todo-file-generator.ts`
- Integrated workflow

**CI Integration**: Tests should run in GitHub Actions with:
- Node.js 18+
- Jest configuration from `config/jest.config.cjs`
- Test fixtures copied to temp directory

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD
