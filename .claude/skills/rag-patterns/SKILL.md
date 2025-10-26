---
name: rag-patterns
description: Historical implementation patterns from VERSATIL framework. This skill should be used when researching similar features, estimating implementation effort, learning from past mistakes, or finding proven solutions to common problems.
---

# RAG Patterns - Historical Implementation Learnings

**5 Production Patterns** | **Success Rate: 94% avg** | **Compounding Engineering**

## What Are RAG Patterns?

RAG (Retrieval-Augmented Generation) Patterns are **historical implementations codified into reusable knowledge**. Each pattern captures:

- ✅ What was built
- ✅ How long it took (actual vs estimated)
- ✅ Lessons learned (gotchas, warnings, best practices)
- ✅ Code examples with file:line references
- ✅ Validation rules and tests

**Key Benefit**: Learn from YOUR past work, not generic LLM knowledge

## Available Patterns

### 1. Native SDK Integration
**When**: Implementing hooks, working with Claude SDK, settings.json configuration
**Success**: 98% | **Effort**: 28h (estimated 40h) - 70% accuracy
**Key Learning**: Use ONLY SDK-supported fields - custom YAML fields are silently ignored

→ See `native-sdk-integration` skill for details

---

### 2. Victor-Verifier Anti-Hallucination (v2.0 - Improved)
**When**: Implementing verification, detecting hallucinations, validating tool outputs
**Success**: 95% | **Effort**: 22h (estimated 24h) - 92% accuracy
**Key Learning**: 40% hallucination reduction through Chain-of-Verification

**v2.0 Improvements** (October 2025):
- Enhanced file path extraction (supports .tsx, .jsx, .sql)
- Line count verification with context
- Relaxed cross-check logic (60% threshold)
- Framework risk detection via Oliver-MCP
- Stress tested with 180 test cases (100% pass rate)

→ See `victor-verifier` skill for implementation details
→ See `stress-testing` skill for validation methodology

---

### 3. Assessment Engine
**When**: Quality gates, security audits, coverage requirements, accessibility checks
**Success**: 93% | **Effort**: 26h (estimated 30h) - 87% accuracy
**Key Learning**: Security code needs 90%+ coverage (not 80% like standard code)

→ See `assessment-engine` skill for details

---

### 4. Session CODIFY
**When**: Session-end codification, automatic learning, compounding engineering
**Success**: 90% | **Effort**: 18h (estimated 20h) - 90% accuracy
**Key Learning**: Stop hook captures learnings → 40% faster by feature 5

→ See `session-codify` skill for details

---

### 5. Marketplace Organization
**When**: Marketplace prep, plugin metadata, repository cleanup
**Success**: 95% | **Effort**: 12h (estimated 16h) - 75% accuracy
**Key Learning**: .claude.plugin.json required for marketplace distribution

→ See `marketplace-organization` skill for details

---

## How to Use RAG Patterns

### Step 1: Identify Similar Work

**Ask yourself**:
- Have we built something like this before?
- What category does this fall into? (auth, verification, quality, learning, distribution)
- What problems might we encounter?

### Step 2: Load Relevant Pattern

Claude will automatically load the relevant pattern skill when keywords match:

| Keywords | Pattern Loaded |
|----------|----------------|
| hook, sdk, settings.json | native-sdk-integration |
| verification, hallucination, cove | victor-verifier |
| quality, security, coverage, audit | assessment-engine |
| codify, learning, compounding | session-codify |
| marketplace, plugin, distribution | marketplace-organization |

### Step 3: Apply Learnings

Each pattern provides:
- ✅ **When to use it** (trigger conditions)
- ✅ **What it solves** (problem → solution)
- ✅ **How to implement** (step-by-step)
- ✅ **Common gotchas** (avoid mistakes)
- ✅ **Success metrics** (what good looks like)

### Step 4: Contribute New Patterns

After completing a feature:
1. Use `/learn` command to codify session
2. Pattern auto-generated from session data
3. Stored in `.versatil/learning/patterns/`
4. Available for future retrieval

---

## Progressive Disclosure

**Level 1** (Always loaded): This index (which patterns exist)
**Level 2** (On-demand): Individual pattern SKILL.md (~500 tokens each)
**Level 3** (As-needed): Pattern references/ with detailed code (~2k tokens each)

**Token Savings**: 85-95% reduction vs loading all patterns upfront

---

## Compounding Engineering Impact

**Without RAG Patterns**:
- Feature 1: 100% effort
- Feature 2: 100% effort (repeat mistakes)
- Feature 3: 100% effort (still no learning)

**With RAG Patterns**:
- Feature 1: 100% effort (baseline)
- Feature 2: 83% effort (17% faster) ← Learn from Feature 1
- Feature 3: 74% effort (26% faster) ← Learn from Features 1+2
- Feature 4: 69% effort (31% faster)
- Feature 5: **60% effort** (40% faster) ← **Target achieved!**

**Formula**: Better patterns + More features = Exponential productivity

---

## Pattern Statistics

| Pattern | Success | Effort Accuracy | Hallucination Reduction |
|---------|---------|-----------------|-------------------------|
| native-sdk-integration | 98% | 70% | N/A |
| victor-verifier | 95% | 92% | 40% |
| assessment-engine | 93% | 87% | N/A |
| session-codify | 90% | 90% | N/A |
| marketplace-organization | 95% | 75% | N/A |
| **Average** | **94%** | **83%** | **40%** |

**Effort Accuracy**: How close actual hours were to estimated hours
**83% accuracy** = Estimates within ±17% of actual (vs ±50% without patterns)

---

## When NOT to Use RAG Patterns

RAG patterns are historical learnings. Don't use them for:

- ❌ New technologies not in your stack
- ❌ Features completely unlike anything built before
- ❌ Quick research questions (use general knowledge instead)
- ❌ Debugging live issues (use logs, not patterns)

For novel features, start fresh and create a NEW pattern afterward via `/learn`

---

## Related Skills

- `compounding-engineering` - Pattern search, template matching, todo generation
- `rag-query` - Query and store RAG memories
- Skills will auto-coordinate when planning features with `/plan`

---

## Quick Reference

**Find similar features**: Ask "Have we built auth/verification/quality systems before?"
**Estimate effort**: Pattern metrics show actual vs estimated hours
**Avoid gotchas**: Warnings section in each pattern
**See code**: references/ files have complete implementations

**Your patterns improve over time** - each session makes the next one faster.
