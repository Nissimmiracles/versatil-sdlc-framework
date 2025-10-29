# Validate Library Context Injection System - P2

## Status
- [ ] Pending
- **Priority**: P2 (Important - ensures system works correctly)
- **Created**: 2025-10-26
- **Updated**: 2025-10-26
- **Assigned**: Victor-Verifier + Maria-QA
- **Estimated Effort**: Small (2 hours)

## Description

Validate that the library-specific `claude.md` files are properly loaded and injected by the `before-prompt` hook when users work with code in those libraries. Ensure the three-layer context system (User → Library → Team → Framework) works correctly.

## Acceptance Criteria

- [ ] **Hook detects library from file path** - When editing `src/rag/pattern-search.ts`, hook knows to load `src/rag/claude.md`

- [ ] **Context injection works** - Library context appears in system message:
  ```json
  {
    "role": "system",
    "content": "# Library Context: rag\n\n[Contents of src/rag/claude.md]\n\n# RAG Patterns\n\n[Existing 44 patterns still work]"
  }
  ```

- [ ] **All 15 libraries tested** - Manual test editing a file in each of the 15 priority libraries

- [ ] **No performance degradation** - Context loading adds <50ms overhead

- [ ] **Graceful fallback** - If library has no claude.md, continues without error

- [ ] **Priority system works** - User preferences override library context when conflicting

- [ ] **Integration with RAG** - Library context AND RAG patterns both inject correctly

## Dependencies

- **Depends on**:
  - 012 (Audit and template creation)
  - 013 (15 claude.md files created)
- **Blocks**: None (final validation task)

## Implementation Notes

### Test Plan

#### Test 1: Library Detection from File Path

```typescript
// Test cases
const testCases = [
  {
    file: 'src/rag/pattern-search.ts',
    expected: 'rag'
  },
  {
    file: 'src/agents/opera/alex-ba/enhanced-alex.ts',
    expected: 'agents'
  },
  {
    file: 'tests/unit/rag/pattern-search.test.ts',
    expected: 'rag'  // Detect from src/ path even if in tests/
  },
  {
    file: 'src/lib/graphrag-store.ts',
    expected: 'lib'
  },
  {
    file: 'README.md',
    expected: null  // No library context for root files
  }
];

// Implementation
function detectLibraryFromPath(filePath: string): string | null {
  const match = filePath.match(/src\/([^\/]+)\//);
  return match ? match[1] : null;
}
```

#### Test 2: Context File Loading

```bash
# Manual test for each of 15 libraries
echo "Testing library context injection..."

for lib in agents rag orchestration planning templates hooks mcp context intelligence learning memory testing validation ui dashboard; do
  echo "Testing $lib..."

  # Create test input
  echo "{
    \"prompt\": \"How do I use this library?\",
    \"workingDirectory\": \"/Users/nissimmenashe/VERSATIL SDLC FW\",
    \"activeFile\": \"src/$lib/index.ts\"
  }" | .claude/hooks/dist/before-prompt.cjs > output.json

  # Check output contains library context
  if grep -q "Library Context: $lib" output.json; then
    echo "  ✅ $lib context loaded"
  else
    echo "  ❌ $lib context NOT loaded"
  fi
done
```

#### Test 3: Performance Measurement

```typescript
// Measure context loading overhead
const start = performance.now();

// Load library context
const library = detectLibraryFromPath(activeFile);
let libraryContext = '';

if (library) {
  const contextPath = `src/${library}/claude.md`;
  if (fs.existsSync(contextPath)) {
    libraryContext = fs.readFileSync(contextPath, 'utf-8');
  }
}

const end = performance.now();
const overhead = end - start;

console.log(`Context loading overhead: ${overhead.toFixed(2)}ms`);
expect(overhead).toBeLessThan(50); // Must be under 50ms
```

#### Test 4: Priority System (User > Library > Team)

```typescript
// Test scenario: User prefers camelCase, Library suggests snake_case

// User preferences (from ~/.versatil/users/[id]/profile.json)
const userPrefs = {
  naming_convention: 'camelCase'
};

// Library context (from src/api/claude.md)
const libraryContext = `
## Conventions
- Use snake_case for API routes
`;

// Expected: User preference wins
// Inject both, but note priority
const systemMessage = `
# User Preferences (HIGHEST PRIORITY)
- Naming: camelCase

# Library Context: api
${libraryContext}

When preferences conflict, USER PREFERENCES always win.
`;
```

#### Test 5: Integration with RAG Patterns

```bash
# Test that both library context AND RAG patterns inject
echo "{
  \"prompt\": \"How do I implement pattern search with GraphRAG?\",
  \"workingDirectory\": \"/Users/nissimmenashe/VERSATIL SDLC FW\",
  \"activeFile\": \"src/rag/pattern-search.ts\"
}" | .claude/hooks/dist/before-prompt.cjs > output.json

# Should contain BOTH:
# 1. Library context from src/rag/claude.md
grep -q "Library Context: rag" output.json && echo "✅ Library context present"

# 2. RAG pattern (if matched)
grep -q "RAG Patterns Auto-Activated" output.json && echo "✅ RAG patterns present"

# Verify both sections in output
cat output.json | jq -r '.content' | grep -A 5 "Library Context"
cat output.json | jq -r '.content' | grep -A 5 "RAG Patterns"
```

### Modified Hook Logic (before-prompt.ts)

```typescript
// Add library context loading to existing hook
// Location: .claude/hooks/before-prompt.ts

// ... existing code ...

// NEW: Detect library from active file path
function detectLibrary(filePath: string): string | null {
  if (!filePath) return null;
  const match = filePath.match(/src\/([^\/]+)\//);
  return match ? match[1] : null;
}

// NEW: Load library context
function loadLibraryContext(library: string): string | null {
  try {
    const contextPath = path.join(process.cwd(), 'src', library, 'claude.md');

    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf-8');
    }
  } catch (error) {
    console.warn(`Failed to load library context for ${library}:`, error);
  }

  return null;
}

// In main hook logic, after loading RAG patterns:
const library = detectLibrary(input.activeFile);
let libraryContextSection = '';

if (library) {
  const libContext = loadLibraryContext(library);
  if (libContext) {
    libraryContextSection = `
# Library Context: ${library}

${libContext}

---
`;
  }
}

// Inject in priority order: User > Library > Team > RAG
const systemMessage = {
  role: 'system',
  content: `
${userPreferencesSection}

${libraryContextSection}

${teamConventionsSection}

${ragPatternsSection}
`.trim()
};
```

## Files Involved

**To Modify**:
- `.claude/hooks/before-prompt.ts` - Add library context loading
- `.claude/hooks/dist/before-prompt.cjs` - Recompile after changes

**To Test**:
- All 15 `src/*/claude.md` files

**To Create**:
- `tests/integration/context-injection.test.ts` - Automated validation tests
- `docs/context/VALIDATION_REPORT.md` - Test results documentation

## Testing Requirements

### Automated Tests

```typescript
// tests/integration/context-injection.test.ts

describe('Library Context Injection', () => {
  it('should detect library from file path', () => {
    expect(detectLibrary('src/rag/pattern-search.ts')).toBe('rag');
    expect(detectLibrary('src/agents/core/base-agent.ts')).toBe('agents');
    expect(detectLibrary('README.md')).toBeNull();
  });

  it('should load library context file', () => {
    const context = loadLibraryContext('rag');
    expect(context).toContain('# RAG');
    expect(context).toContain('## Purpose');
    expect(context).toContain('## Key Concepts');
  });

  it('should inject library context in system message', async () => {
    const input = {
      prompt: 'test',
      activeFile: 'src/rag/pattern-search.ts'
    };

    const output = await executeHook(input);
    expect(output.content).toContain('Library Context: rag');
  });

  it('should handle missing claude.md gracefully', async () => {
    const input = {
      prompt: 'test',
      activeFile: 'src/nonexistent/file.ts'
    };

    // Should not crash, just skip library context
    const output = await executeHook(input);
    expect(output).toBeDefined();
  });

  it('should load context in under 50ms', () => {
    const start = performance.now();
    const context = loadLibraryContext('rag');
    const end = performance.now();

    expect(end - start).toBeLessThan(50);
  });

  it('should integrate with RAG patterns', async () => {
    const input = {
      prompt: 'How do I use GraphRAG?',
      activeFile: 'src/rag/pattern-search.ts'
    };

    const output = await executeHook(input);

    // Should have both library context AND RAG pattern
    expect(output.content).toContain('Library Context: rag');
    expect(output.content).toMatch(/RAG Pattern|GraphRAG/);
  });
});
```

### Manual Test Checklist

- [ ] Test each of 15 libraries
  - [ ] agents
  - [ ] rag
  - [ ] orchestration
  - [ ] planning
  - [ ] templates
  - [ ] hooks
  - [ ] mcp
  - [ ] context
  - [ ] intelligence
  - [ ] learning
  - [ ] memory
  - [ ] testing
  - [ ] validation
  - [ ] ui
  - [ ] dashboard

- [ ] Test priority system (User > Library > Team)
- [ ] Test graceful fallback (missing claude.md)
- [ ] Test performance (<50ms)
- [ ] Test with RAG patterns (both inject)

## Potential Challenges

1. **Challenge**: Hook becomes too complex with multiple context layers
   **Mitigation**: Keep logic simple, extract to helper functions

2. **Challenge**: Performance degrades with large claude.md files
   **Mitigation**: Enforce 200-line limit per file, cache loaded contexts

3. **Challenge**: Context conflicts (library says one thing, team says another)
   **Mitigation**: Clear priority order, document in system message

4. **Challenge**: Hard to debug when context doesn't appear
   **Mitigation**: Add debug logging, create troubleshooting guide

## Success Metrics

- [ ] All 15 libraries tested manually - ✅
- [ ] All automated tests passing - ✅
- [ ] Performance: <50ms overhead - ✅
- [ ] Graceful fallback verified - ✅
- [ ] RAG integration working - ✅
- [ ] Priority system validated - ✅
- [ ] Documentation complete - ✅

---

**Next**: System is production-ready for library-specific context injection

**Timeline**: 2 hours
- Hour 1: Modify hook, add library detection and loading
- Hour 2: Run tests, validate all 15 libraries, document results

**Generated**: 2025-10-26
**Assigned to**: Victor-Verifier (lead), Maria-QA (testing support)
