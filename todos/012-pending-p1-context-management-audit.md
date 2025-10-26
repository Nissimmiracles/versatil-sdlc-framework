# Context Management Audit & Library claude.md Design - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical for context system improvement)
- **Created**: 2025-10-26
- **Updated**: 2025-10-26
- **Assigned**: Oliver-MCP + Victor-Verifier
- **Estimated Effort**: Medium (4 hours)

## Description

Audit the current context usage across all 50+ libraries in `src/` and design a standardized `claude.md` template for per-library context injection. This enables agents to have library-specific rules, conventions, and usage guidelines automatically injected when working with that code.

## Acceptance Criteria

- [ ] **Context Audit Report Created** - Analyze all 50 libraries in src/ for:
  - Current context needs (what would help agents work better?)
  - Existing conventions/patterns (coding style, naming, architecture)
  - Common mistakes or footguns
  - Dependencies and interactions

- [ ] **Library `claude.md` Template Designed** - Create standard template with sections:
  - Library purpose and scope
  - Key conventions and rules
  - Common usage patterns with code examples
  - Important gotchas and anti-patterns
  - Related libraries and dependencies
  - Testing requirements

- [ ] **Priority Libraries Identified** - Rank top 15 libraries by:
  - Complexity (how hard to use correctly?)
  - Frequency (how often touched?)
  - Risk (what breaks if done wrong?)

- [ ] **Context Injection Hook Validated** - Ensure `before-prompt` hook can load library-specific context:
  - Detect which library user is working in (via file path)
  - Load corresponding `src/[library]/claude.md`
  - Inject context into system message
  - Verify 44 existing RAG patterns still work

## Context

**Three-Layer Context System** (v6.6.0):
- **User preferences**: Personal coding style (already working)
- **Team conventions**: Project-wide standards (CLAUDE.md exists)
- **Library context**: **NEW** - Per-library rules and patterns

**Current State**:
- ✅ Root CLAUDE.md exists (747 lines, project-wide)
- ✅ RAG system operational (44 patterns in `.versatil/learning/patterns/`)
- ✅ before-prompt hook working (inject

s context via JSON)
- ❌ No library-specific claude.md files (0/50)

**Libraries to Audit** (50 directories in src/):
```
agents, analytics, audit, automation, caching, cli, collaboration,
config, context, core, daemon, dashboard, documentation, environment,
feedback, flywheel, hooks, intelligence, isolation, language-adapters,
learning, lib, mcp, memory, migration, monitoring, onboarding, opera,
orchestration, orchestrator, orchestrators, planning, project, rag,
research, scripts, security, simulation, stubs, tasks, team, templates,
testing, tracking, types, ui, update, user, utils, validation, visualization, workflows
```

## Dependencies

- **Depends on**: None (can start immediately)
- **Blocks**:
  - 013 (Create library claude.md files)
  - 014 (Validate context injection)

## Implementation Notes

### Step 1: Audit Current Context Needs (2 hours)

**Approach**: For each of the 50 libraries, analyze:

```bash
# For each library
for lib in src/*; do
  echo "## Library: $(basename $lib)"

  # Count files and complexity
  find $lib -name "*.ts" | wc -l

  # Check if there are existing docs
  find $lib -name "README.md" -o -name "*.md"

  # Look for common patterns
  grep -r "export class\|export interface\|export function" $lib | head -5

  # Check git activity (frequency)
  git log --oneline --since="3 months ago" -- $lib | wc -l
done
```

**Output**: `docs/context/LIBRARY_AUDIT_REPORT.md` with:
- Library complexity scores (1-10)
- Frequency scores (commits in last 3 months)
- Risk assessment (based on tests, type safety, dependencies)
- Context needs (what would help?)

### Step 2: Design claude.md Template (1 hour)

**Standard Template Structure**:

```markdown
# [Library Name] - Context Guide

## Purpose
[1-2 sentence description of what this library does]

## Key Concepts
- **[Concept 1]**: Description
- **[Concept 2]**: Description

## Conventions & Rules
1. **[Convention 1]**: Why it matters
2. **[Convention 2]**: Example

## Common Usage Patterns

### Pattern 1: [Name]
\`\`\`typescript
// Example code
\`\`\`
**When to use**: ...
**When NOT to use**: ...

## Important Gotchas
⚠️ **[Gotcha 1]**: What breaks and how to avoid
⚠️ **[Gotcha 2]**: Common mistake

## Related Libraries
- **[Library A]**: How they interact
- **[Library B]**: When to use together

## Testing Requirements
- [ ] Unit tests required for ...
- [ ] Integration tests when ...
- [ ] E2E tests for ...

## Examples
[Link to example files or tests]
```

**Location**: `templates/context/library-claude.md.template`

### Step 3: Identify P1 Libraries (30 minutes)

**Scoring Matrix**:
```
Priority Score = (Complexity × 3) + (Frequency × 2) + (Risk × 5)
```

**Complexity** (1-10):
- Lines of code
- Number of exports
- Cyclomatic complexity
- Dependencies count

**Frequency** (1-10):
- Git commits (last 3 months)
- File edits
- Agent mentions in prompts

**Risk** (1-10):
- Test coverage (low = high risk)
- Type safety (any usage = higher risk)
- Production impact
- Breaking change potential

**Expected Top 15**:
1. `agents/` - Core functionality, high complexity
2. `rag/` - RAG system, critical for context
3. `orchestration/` - Workflow coordination
4. `planning/` - Feature planning logic
5. `templates/` - Template system
6. `hooks/` - Event system, high risk
7. `mcp/` - MCP integration
8. `context/` - Context management (meta!)
9. `intelligence/` - AI/ML features
10. `learning/` - Learning system
11. `memory/` - Memory management
12. `testing/` - Test infrastructure
13. `validation/` - Quality gates
14. `ui/` - UI components
15. `dashboard/` - Dashboard features

### Step 4: Validate Hook Integration (30 minutes)

**Test Plan**:

```typescript
// Test: before-prompt hook loads library context
// Given: User is editing src/rag/pattern-search.ts
// When: Prompt submitted
// Then: Hook should inject src/rag/claude.md context

// Pseudo-code test
const testInput = {
  prompt: "How do I use pattern search?",
  workingDirectory: "/Users/nissimmenashe/VERSATIL SDLC FW",
  activeFile: "src/rag/pattern-search.ts"
};

// Hook should detect library from path
const library = detectLibrary(testInput.activeFile); // "rag"
const contextFile = `src/${library}/claude.md`;

// Load library context if exists
if (fs.existsSync(contextFile)) {
  const libraryContext = fs.readFileSync(contextFile, 'utf-8');
  // Inject into system message
  systemMessage += `\n\n# Library Context: ${library}\n${libraryContext}`;
}
```

**Validation Checklist**:
- [ ] Hook detects library from file path
- [ ] Loads claude.md from correct directory
- [ ] Injects context without breaking existing RAG patterns
- [ ] Handles missing claude.md gracefully
- [ ] Performance: <50ms overhead

## Files Involved

**To Create**:
- `docs/context/LIBRARY_AUDIT_REPORT.md` (audit results)
- `templates/context/library-claude.md.template` (template)
- `docs/context/PRIORITY_LIBRARIES.md` (top 15 ranked)

**To Modify**:
- `.claude/hooks/before-prompt.ts` (add library context loading logic)
- `.claude/hooks/dist/before-prompt.cjs` (recompile)

## Testing Requirements

- [ ] Manual test: Edit file in each P1 library, verify context loads
- [ ] Unit test: Library detection from file path
- [ ] Unit test: Template validation
- [ ] Integration test: Full hook with library context + RAG patterns
- [ ] Performance test: Context loading <50ms

## Potential Challenges

1. **Challenge**: 50 libraries = massive audit effort
   **Mitigation**: Focus on P1 (top 15), do P2/P3 incrementally

2. **Challenge**: Library boundaries unclear (what is "one library"?)
   **Mitigation**: Use directory structure, one claude.md per src/ subdirectory

3. **Challenge**: Hook performance degradation
   **Mitigation**: Lazy loading, cache library contexts, <50ms budget

4. **Challenge**: Context conflicts (library vs team vs user)
   **Mitigation**: Priority order: User > Library > Team > Framework

## Success Metrics

- [ ] All 50 libraries audited
- [ ] Template created and validated
- [ ] Top 15 libraries prioritized
- [ ] Hook integration tested and passing
- [ ] Performance: <50ms context loading overhead
- [ ] Documentation: Clear guide for future library claude.md creation

---

**Next**: After completion, proceed to 013 (Create library claude.md files for top 15)

**Related**:
- Three-Layer Context System: `docs/THREE_LAYER_CONTEXT_SYSTEM.md`
- before-prompt hook: `.claude/hooks/before-prompt.ts`
- RAG patterns: `.versatil/learning/patterns/`

**Generated**: 2025-10-26
**Assigned to**: Oliver-MCP (lead), Victor-Verifier (validation support)
