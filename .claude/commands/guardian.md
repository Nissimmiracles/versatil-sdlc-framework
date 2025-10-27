---
name: "guardian"
description: "Iris-Guardian health monitoring and auto-remediation control"
usage: "/guardian [action] [options]"
tags:
  - "monitoring"
  - "health"
  - "auto-fix"
  - "framework-meta"
category: "monitoring"
---

# 🛡️ Iris-Guardian Control

**Iris-Guardian** is VERSATIL's meta-framework intelligence agent that monitors system health, coordinates agents, and auto-remediates issues.

## 🎯 Actions

### `/guardian status`
Show current Guardian health status and metrics

**Output**:
- Overall health score (0-100)
- Component health (build, tests, agents, RAG, hooks)
- Active issues and recommendations
- Auto-remediation history (last 24h)
- Context mode (FRAMEWORK_CONTEXT vs PROJECT_CONTEXT)

**Example**:
```bash
/guardian status
```

---

### `/guardian health`
Run comprehensive health check (all components)

**What it checks**:

**FRAMEWORK_CONTEXT**:
- Framework build status
- TypeScript compilation
- Test suite (coverage ≥80%)
- Dependencies (security vulnerabilities)
- RAG system (GraphRAG + Vector store)
- Agent registry (18 agents)
- Lifecycle hooks (4 hooks)
- Documentation completeness

**PROJECT_CONTEXT**:
- Project configuration (.versatil-project.json)
- Framework installation and version
- Agent activation status
- Project build/tests
- RAG usage and pattern count

**Example**:
```bash
/guardian health
```

---

### `/guardian auto-fix`
Attempt automatic remediation of detected issues

**What it fixes** (22 scenarios):

**Framework Context**:
1. Build failure → `npm run build`
2. Missing dependencies → `npm install`
3. Security vulnerabilities → `npm audit fix`
4. Missing hooks → `npm run build:hooks`
5. Supabase connection lost → Auto-reconnect
6. GraphRAG query failure → Fallback to vector store

**Project Context**:
7. Missing config → Create `.versatil-project.json`
8. Outdated framework → `npm update versatil-sdlc-framework`
9. No agents configured → Add default agents
10. RAG not initialized → Create `~/.versatil/rag/`

**Shared**:
11. Agent timeout → Suggest optimization
12. Vector store connection lost → Auto-reconnect

**Confidence Threshold**: ≥90% confidence required for auto-fix

**Example**:
```bash
/guardian auto-fix
```

---

### `/guardian agents`
Show agent health and activation statistics

**Output**:
- Total agents: 18 (8 core + 10 sub-agents)
- Healthy agents count
- Failed/degraded agents
- Activation success rates
- Average activation duration
- Recent failures (last 24h)

**Example**:
```bash
/guardian agents
```

---

### `/guardian rag`
Show RAG system health and pattern statistics

**Output**:
- GraphRAG status (Firestore)
- Vector store status (Supabase pgvector)
- RAG Router health
- Pattern search performance
- Pattern count by category
- Recent query latency

**Example**:
```bash
/guardian rag
```

---

### `/guardian learnings [category]`
View Guardian learnings stored in RAG

**Categories**:
- `health-check` - Health check patterns
- `auto-remediation` - Successful auto-fixes
- `issue-resolution` - Critical issue resolutions
- `agent-coordination` - Multi-agent workflows

**Output**:
- Top 10 learnings by success rate
- Times reused
- Average duration
- Success rate trend

**Examples**:
```bash
/guardian learnings
/guardian learnings auto-remediation
```

---

### `/guardian metrics`
Show Guardian telemetry and performance metrics

**Output**:
- Health checks performed/passed/failed
- Auto-fixes attempted/successful (success rate)
- Agent activations tracked (success rate)
- Learnings stored/reused
- Context breakdown (framework vs project operations)
- Time period and uptime

**Example**:
```bash
/guardian metrics
```

---

### `/guardian version`
Show framework version info and roadmap progress

**FRAMEWORK_CONTEXT ONLY**

**Output**:
- Current version
- Next version (from roadmap)
- Commits since last release
- Roadmap progress percentage
- Upcoming features (top 5)
- Breaking changes since version

**Example**:
```bash
/guardian version
```

---

### `/guardian release [major|minor|patch]`
Create new framework release

**FRAMEWORK_CONTEXT ONLY**

**Steps**:
1. Validate working directory is clean
2. Bump version (npm version)
3. Generate release notes from commits
4. Update CHANGELOG.md
5. Create git tag
6. Display next steps (npm publish, git push --tags)

**Examples**:
```bash
/guardian release patch  # 7.7.0 → 7.7.1
/guardian release minor  # 7.7.0 → 7.8.0
/guardian release major  # 7.7.0 → 8.0.0
```

---

## ⚙️ Options

### `--context [framework|project]`
Force specific context mode (overrides auto-detection)

**Example**:
```bash
/guardian status --context framework
```

### `--verbose`
Show detailed output with debug information

**Example**:
```bash
/guardian health --verbose
```

### `--json`
Output results in JSON format (for scripting)

**Example**:
```bash
/guardian metrics --json
```

---

## 🔄 Auto-Remediation Confidence Levels

Guardian uses confidence scoring to determine if issues can be auto-fixed:

| Confidence | Action | Example |
|------------|--------|---------|
| **95-100%** | Auto-fix immediately | Missing hooks → rebuild |
| **85-94%** | Auto-fix with logging | Build failure → npm run build |
| **70-84%** | Suggest fix only | TypeScript errors → manual review |
| **<70%** | Manual investigation | Complex agent failures |

---

## 📊 Integration Points

Guardian integrates with:

1. **before-prompt.ts hook** - Injects critical health alerts before each prompt
2. **post-file-edit.ts hook** - Tracks file edits for agent activation monitoring
3. **session-codify.ts hook** - Stores Guardian learnings in RAG
4. **AutomationMetrics** - Feeds telemetry data
5. **RAG System** - Queries patterns, stores learnings
6. **Agent Registry** - Monitors all 18 agents

---

## 🎓 Examples

**Daily health check** (framework development):
```bash
/guardian health
```

**Fix issues before committing**:
```bash
/guardian auto-fix
```

**Check agent performance**:
```bash
/guardian agents
```

**View successful auto-fix patterns**:
```bash
/guardian learnings auto-remediation
```

**Track Guardian performance**:
```bash
/guardian metrics
```

**Prepare new release**:
```bash
/guardian version           # Check roadmap progress
/guardian health            # Ensure all checks pass
/guardian release minor     # Create v7.8.0
```

---

## 🚨 Critical Alerts

When Guardian detects critical issues, alerts are injected into context via before-prompt hook:

```
🚨 Guardian Critical Alerts

The following critical issues were detected:

1. Framework not built - run npm run build
2. 3 TypeScript errors detected
3. Agent Maria-QA failing (5 recent failures)

Action Required: These issues may affect functionality.
Quick Fix: Use /guardian auto-fix to attempt remediation.
```

---

## 📖 Related Commands

- `/monitor` - Real-time framework monitoring dashboard
- `/guardian-logs` - View Guardian activity logs
- `/assess` - Quality gates validation
- `/health` - Project health check (legacy)

---

## 💡 Best Practices

1. **Run `/guardian health` before major work** - Catch issues early
2. **Use `/guardian auto-fix` liberally** - 90%+ confidence is safe
3. **Check `/guardian agents` after errors** - Agent failures are tracked
4. **Review `/guardian learnings`** - See what Guardian has learned
5. **Monitor `/guardian metrics`** - Track improvement over time

---

**Guardian operates in two modes**:

- **🛠️ FRAMEWORK_CONTEXT**: Framework development (manages releases, evolution)
- **👤 PROJECT_CONTEXT**: User projects (helps leverage framework features)

Context is auto-detected via `.versatil-framework-repo` (framework) or `.versatil-project.json` (project).
