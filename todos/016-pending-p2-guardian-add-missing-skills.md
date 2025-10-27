# Add Missing Skills to Guardian - P2

## Status
- [ ] Pending
- **Priority**: P2 (High - Completeness)
- **Created**: 2025-10-27
- **Assigned**: Iris-Guardian + Sarah-PM
- **Estimated Effort**: Large (3 hours)

## Description

Add three missing skills to Guardian's skill list and create two new skill definitions that don't currently exist. This addresses Gap #3 from the Guardian audit (Skills Alignment: 85/100) by ensuring Guardian has all the skills it needs to perform its responsibilities effectively.

**Missing Skills**:
1. **native-sdk-integration** (EXISTS - just need to add to Guardian's list)
2. **health-monitoring** (NEW - needs to be created, ~300 lines)
3. **version-management** (NEW - needs to be created, ~250 lines)

## Acceptance Criteria

- [ ] Add `native-sdk-integration` to Guardian's skills list in iris-guardian.md
- [ ] Create `.claude/skills/health-monitoring/SKILL.md` (~300 lines)
- [ ] Create `.claude/skills/health-monitoring/references/` directory with 2-3 reference docs
- [ ] Create `.claude/skills/version-management/SKILL.md` (~250 lines)
- [ ] Create `.claude/skills/version-management/references/` directory with 2-3 reference docs
- [ ] Update Guardian's "Skills You Use" section (lines 285-293) with new skills
- [ ] Add skill usage examples to Guardian's systemPrompt
- [ ] Test Guardian can access all three skills when activated

## Context

- **Related Issue**: Guardian Audit Findings (2025-10-27) - Gap #3 (Skills Alignment 85/100)
- **Related PR**: TBD (include in next Guardian version bump)
- **Files Involved**:
  - `.claude/agents/iris-guardian.md` (modify, add 3 skills to list)
  - `.claude/skills/health-monitoring/SKILL.md` (new, ~300 lines)
  - `.claude/skills/health-monitoring/references/metrics.md` (new, ~150 lines)
  - `.claude/skills/health-monitoring/references/remediation-playbook.md` (new, ~200 lines)
  - `.claude/skills/version-management/SKILL.md` (new, ~250 lines)
  - `.claude/skills/version-management/references/semver.md` (new, ~100 lines)
  - `.claude/skills/version-management/references/release-automation.md` (new, ~150 lines)
- **References**:
  - [Existing skills](.claude/skills/)
  - [Native SDK Integration Skill](.claude/skills/code-generators/native-sdk-integration/SKILL.md)
  - [Skills-First Architecture](../docs/SKILLS_FIRST_ARCHITECTURE_TRANSFORMATION.md)

## Dependencies

- **Depends on**: 014 - Add native SDK to Guardian mission (establishes need for native-sdk-integration skill)
- **Blocks**: None (but improves Guardian's capabilities)
- **Related to**: Skills-First Architecture (v7.0.0), skill-creator code generator

## Implementation Notes

### 1. Add native-sdk-integration to Guardian's Skills List

**Current** (lines 20-30 in iris-guardian.md):
```yaml
skills:
  - "compounding-engineering"
  - "rag-query"
  - "rag-optimization"
  - "quality-gates"
  - "opera-orchestration"
  - "context-injection"
  - "testing-library"
  - "agents-library"
  - "rag-library"
  - "orchestration-library"
```

**Add**:
```yaml
skills:
  - "compounding-engineering"
  - "rag-query"
  - "rag-optimization"
  - "quality-gates"
  - "opera-orchestration"
  - "context-injection"
  - "testing-library"
  - "agents-library"
  - "rag-library"
  - "orchestration-library"
  - "native-sdk-integration"   # NEW
  - "health-monitoring"         # NEW
  - "version-management"        # NEW
```

### 2. Create health-monitoring Skill

**File**: `.claude/skills/health-monitoring/SKILL.md`

**Structure** (~300 lines):
```markdown
# Health Monitoring Skill

## Overview
Framework health monitoring, metrics collection, and auto-remediation for Iris-Guardian agent.

## Purpose
Enable Guardian to continuously monitor VERSATIL framework health across 6 dimensions:
- Agent registry status
- RAG connectivity (GraphRAG + Vector)
- Build status
- Test suite pass rate
- Dependency vulnerabilities
- Native SDK compliance

## When to Use
- **Auto-activate**: Every 5 minutes (background monitoring)
- **On-demand**: `/guardian` command or health check keywords
- **Critical events**: Build failures, test failures, service outages

## Key Capabilities

### 1. Health Score Calculation (0-100%)
```typescript
function calculateHealthScore(): number {
  const weights = {
    agents: 0.20,      // 20% weight
    rag: 0.20,
    build: 0.15,
    tests: 0.15,
    deps: 0.15,
    sdk: 0.15
  };

  return Math.round(
    (agentScore * weights.agents) +
    (ragScore * weights.rag) +
    (buildScore * weights.build) +
    (testScore * weights.tests) +
    (depsScore * weights.deps) +
    (sdkScore * weights.sdk)
  );
}
```

### 2. Alert Thresholds
- **Critical (<70%)**: Immediate alert + auto-pause work
- **Warning (70-89%)**: Alert + suggest fixes
- **Healthy (≥90%)**: Continue monitoring

### 3. Metrics Collection
- Agent registry: 8 agents operational?
- RAG latency: <500ms target
- Build status: TypeScript compile
- Test pass rate: 80%+ coverage
- Dependencies: npm audit (0 high/critical)
- SDK compliance: Zero custom YAML fields

## Common Patterns

### Pattern 1: Background Health Check
```typescript
// Run every 5 minutes via cron or GitHub Actions
const health = await checkFrameworkHealth();
if (health < 70) {
  await alertCritical(health);
  await autoPauseWork();
}
```

### Pattern 2: On-Demand Health Check
```typescript
// User types "/guardian" or "health check"
const health = await checkFrameworkHealth();
console.log(`Framework Health: ${health}%`);
console.log(generateHealthReport());
```

## Edge Cases
- **Health check fails**: Fallback to last known good state
- **Metrics unavailable**: Use conservative defaults
- **Auto-remediation conflicts**: Manual intervention required

## References
- [Metrics Collection Guide](./references/metrics.md)
- [Auto-Remediation Playbook](./references/remediation-playbook.md)
```

**Reference Files**:

**`references/metrics.md`** (~150 lines):
- Detailed metrics definitions
- Collection methods (file reads, git commands, npm commands)
- Scoring algorithms per dimension
- Historical trending

**`references/remediation-playbook.md`** (~200 lines):
- 20+ auto-remediation scenarios
- Confidence thresholds
- Fallback strategies
- Known failure modes

### 3. Create version-management Skill

**File**: `.claude/skills/version-management/SKILL.md`

**Structure** (~250 lines):
```markdown
# Version Management Skill

## Overview
Semantic versioning, release automation, and version bump recommendations for Iris-Guardian agent.

## Purpose
Enable Guardian to manage VERSATIL framework version evolution:
- Recommend version bumps (MAJOR, MINOR, PATCH)
- Generate release notes from commits
- Automate GitHub release creation
- Update CHANGELOG.md, package.json
- Track roadmap progress

## When to Use
- **On-demand**: User asks "should we release?"
- **Automatic**: After major feature completions (≥80% complete)
- **Scheduled**: Weekly release review (if changes accumulated)

## Key Capabilities

### 1. Version Bump Recommendation
```typescript
function recommendVersionBump(
  completeness: number,
  criticalBugs: number,
  breakingChanges: number
): 'MAJOR' | 'MINOR' | 'PATCH' {
  if (breakingChanges > 0) return 'MAJOR';  // v7.0.0 → v8.0.0
  if (completeness >= 80 && criticalBugs === 0) return 'MINOR';  // v7.6.0 → v7.7.0
  if (criticalBugs > 0) return 'PATCH';  // v7.6.0 → v7.6.1
  return 'MINOR';
}
```

### 2. Completeness Tracking
- Scan todos/*.md for pending vs resolved
- Check git commits since last release
- Calculate feature completeness (0-100%)
- Identify gaps (missing features, tech debt)

### 3. Release Automation
```bash
# Update package.json version
npm version minor  # or major/patch

# Generate release notes
gh release create v7.7.0 --generate-notes

# Update CHANGELOG.md
echo "## v7.7.0 ($(date +%Y-%m-%d))" >> CHANGELOG.md
git log v7.6.0..HEAD --oneline >> CHANGELOG.md

# Update roadmap
# (manual step - summarize progress)
```

## Common Patterns

### Pattern 1: Version Bump Analysis
```typescript
const analysis = {
  current_version: '7.6.0',
  commits_since_release: 45,
  features_added: 2,
  critical_bugs_fixed: 3,
  breaking_changes: 0,
  completeness: 88%,
  recommendation: 'MINOR (v7.7.0)',
  confidence: 92%
};
```

### Pattern 2: Release Checklist
- [ ] All P1 todos resolved
- [ ] Test suite passing (80%+ coverage)
- [ ] CHANGELOG.md updated
- [ ] Release notes generated
- [ ] GitHub release created
- [ ] Roadmap updated

## Edge Cases
- **No commits since release**: Skip version bump
- **Breaking changes detected**: Force MAJOR bump (warn user)
- **Tests failing**: Block release until fixed

## References
- [Semantic Versioning Guide](./references/semver.md)
- [Release Automation Workflow](./references/release-automation.md)
```

**Reference Files**:

**`references/semver.md`** (~100 lines):
- Semantic versioning rules (MAJOR.MINOR.PATCH)
- Breaking change detection
- Version bump decision tree
- Examples from VERSATIL history

**`references/release-automation.md`** (~150 lines):
- GitHub CLI commands (`gh release create`)
- Automated CHANGELOG generation
- Roadmap update workflow
- Tag naming conventions

### 4. Update Guardian's "Skills You Use" Section

**Current** (lines 285-293 in iris-guardian.md):
```markdown
## 📚 Skills You Use

All skills listed above, plus:
- **compounding-engineering**: Pattern search for similar historical issues
- **rag-query**: Query RAG for remediation patterns
- **quality-gates**: Validate framework quality before releases
- **opera-orchestration**: Coordinate multi-agent workflows
- **testing-library**: Validate test framework health
```

**Add**:
```markdown
## 📚 Skills You Use

All skills listed above, plus:
- **compounding-engineering**: Pattern search for similar historical issues
- **rag-query**: Query RAG for remediation patterns
- **quality-gates**: Validate framework quality before releases
- **opera-orchestration**: Coordinate multi-agent workflows
- **testing-library**: Validate test framework health
- **native-sdk-integration**: Enforce 100% native Claude SDK compliance
- **health-monitoring**: Continuous framework health monitoring (0-100% score)
- **version-management**: Semantic versioning and release automation
```

### Suggested Approach

1. Add three skills to Guardian's skills list (iris-guardian.md line 20)
2. Create `.claude/skills/health-monitoring/` directory
3. Create `SKILL.md` for health-monitoring (~300 lines)
4. Create `references/metrics.md` and `references/remediation-playbook.md`
5. Create `.claude/skills/version-management/` directory
6. Create `SKILL.md` for version-management (~250 lines)
7. Create `references/semver.md` and `references/release-automation.md`
8. Update Guardian's "Skills You Use" section (line 285)
9. Add skill usage examples to systemPrompt (optional but recommended)
10. Test Guardian can access all three skills when activated

### Potential Challenges

- **Challenge**: Health-monitoring skill overlaps with existing Guardian logic
  - **Mitigation**: Skill provides reference material, Guardian still owns implementation

- **Challenge**: Version-management skill may conflict with manual release process
  - **Mitigation**: Skill provides recommendations, humans make final decision

- **Challenge**: New skills increase token usage
  - **Mitigation**: Skills use progressive disclosure (metadata → full docs → references)

## Testing Requirements

- [ ] Manual test: Activate Guardian → verify native-sdk-integration skill loaded
- [ ] Manual test: Trigger health check → verify health-monitoring skill used
- [ ] Manual test: Ask "should we release?" → verify version-management skill used
- [ ] Manual test: Check skill metadata appears in Guardian context
- [ ] Manual test: Load full SKILL.md for all three skills (no errors)
- [ ] Validation: All reference files render correctly in markdown
- [ ] Validation: Skills follow VERSATIL skill template structure

## Documentation Updates

- [ ] Add inline comments in both new SKILL.md files
- [ ] Update Guardian Integration Guide with new skills
- [ ] Add skill usage examples to VERSATIL architecture docs
- [ ] Update skills-first architecture transformation doc with new skills

---

## Resolution Checklist

When marking as resolved:

1. ✅ All 8 acceptance criteria met
2. ✅ Three skills added to Guardian's list
3. ✅ Two new skill definitions created (health-monitoring, version-management)
4. ✅ Six reference files created (3 per skill)
5. ✅ Guardian's "Skills You Use" section updated
6. ✅ All manual tests passing
7. ✅ Documentation updated

**Resolution Steps**:
```bash
# Add skills to Guardian
code .claude/agents/iris-guardian.md

# Create health-monitoring skill
mkdir -p .claude/skills/health-monitoring/references
touch .claude/skills/health-monitoring/SKILL.md
touch .claude/skills/health-monitoring/references/{metrics,remediation-playbook}.md

# Create version-management skill
mkdir -p .claude/skills/version-management/references
touch .claude/skills/version-management/SKILL.md
touch .claude/skills/version-management/references/{semver,release-automation}.md

# Test skill loading
# (Activate Guardian and check skills appear in context)

# Mark as resolved
mv todos/016-pending-p2-guardian-add-missing-skills.md \
   todos/016-resolved-guardian-add-missing-skills.md
```

---

## Notes

**Implementation Priority**: HIGH - Addresses Gap #3 from Guardian audit (Skills Alignment 85/100 → expected 95/100 after this todo).

**Why This Matters**:
- **Completeness**: Guardian has all skills it needs for its responsibilities
- **Documentation**: Skills provide reference material for Guardian's complex tasks
- **Progressive Disclosure**: Skills reduce initial token usage via metadata
- **Discoverability**: Other agents can benefit from health-monitoring and version-management skills

**Token Impact**:
- **Before**: Guardian loads 10 skills (baseline)
- **After**: Guardian loads 13 skills (+30% metadata, but full docs only load on-demand)
- **Net Impact**: ~+45 tokens per prompt (metadata only), ~+1,500 tokens if all 3 full skill docs loaded

**Audit Context**: This was identified during the 2025-10-27 Guardian audit as Gap #3 - missing native-sdk-integration from skills list, and two non-existent skills (health-monitoring, version-management) that Guardian's responsibilities imply it should have.

**Actual Resolution Date**: TBD
**Resolved By**: TBD
**Time Spent**: TBD (estimated 3 hours: 2h skill creation, 1h reference docs)
