# Integrate Todo File Generator into /plan Command - P1

## Status
- [ ] Pending
- **Priority**: P1 (Critical - Wave 3 integration)
- **Created**: 2025-10-26
- **Assigned**: Sarah-PM + Marcus-Backend
- **Estimated Effort**: Small (30 minutes)

## Description

Integrate the TodoFileGenerator service into `.claude/commands/plan.md` to enable dual todo system (TodoWrite + persistent todos/*.md files) with auto-numbering, dependency graphs, and execution wave detection.

## Acceptance Criteria

- [ ] Import `todoFileGenerator` from `src/planning/todo-file-generator.js`
- [ ] Create TodoFileSpec array from plan breakdown
- [ ] Call `generateTodos()` to create persistent files
- [ ] Display "Dual Todo System" section with results
- [ ] Show Mermaid dependency graph
- [ ] Display execution waves (parallel vs sequential)
- [ ] Link TodoWrite items to persistent file paths

## Dependencies

- **Depends on**: 004 - Todo File Generator Service (implemented ✅)
- **Blocks**: 011 - Enhanced Output Format
- **Parallel with**: 008, 009

## Files Involved

- `.claude/commands/plan.md` (modify lines 350-400)
- `src/planning/todo-file-generator.ts` (import and use)
