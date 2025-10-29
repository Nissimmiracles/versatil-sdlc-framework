# Guardian Root Cause Learning System

**Version**: 7.12.0+ (Human-in-the-Loop Approval)
**Status**: Production Ready
**Last Updated**: 2025-10-29

## Overview

Guardian's Root Cause Learning System enables continuous intelligence improvement through:
- **Pattern Detection**: Identifies recurring issues (3+ occurrences in 24h)
- **Root Cause Analysis**: Determines underlying causes with confidence scoring
- **Enhancement Suggestions**: Auto-generates improvement TODOs with ROI calculations
- **Human-in-the-Loop Approval** (v7.12.0+): Three-tier approval workflow before implementation
- **Auto-Remediation Learning**: Stores successful fixes for future automation

**Key Benefit**: Same issue never requires manual fix twice, with human oversight for quality assurance.

---

## Architecture

### Four Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     Health Check History                        │
│                  (Last 100 checks in memory)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│           1. Root Cause Learner (root-cause-learner.ts)         │
│   • Detects recurring patterns (3+ occurrences)                 │
│   • Generates root cause hypotheses with confidence             │
│   • Queries RAG for similar historical issues                   │
│   • Stores verified patterns in ~/.versatil/learning/           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│        2. Enhancement Detector (enhancement-detector.ts)         │
│   • Analyzes patterns for improvement opportunities             │
│   • Priority scoring (critical → low)                           │
│   • ROI calculation (hours saved per week)                      │
│   • Agent assignment for implementation                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│   3. Enhancement TODO Generator (enhancement-todo-generator.ts)  │
│   • Creates markdown TODO files                                 │
│   • Format: enhancement-[category]-[timestamp].md               │
│   • Includes implementation steps + ROI + evidence              │
│   • Deduplication (no duplicate suggestions)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│       4. Pattern Correlator (pattern-correlator.ts)              │
│   • Cross-health check metric correlation                       │
│   • Degradation trend detection                                 │
│   • Predictive alerts (threshold breach ETA)                    │
│   • Correlation cascade detection                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Enable Root Cause Learning (Default: ON)

```bash
# Already enabled by default in v7.12.0+
# To explicitly enable:
export GUARDIAN_LEARN_FROM_ISSUES=true
export GUARDIAN_CREATE_ENHANCEMENT_TODOS=true

# Human-in-the-loop approval mode (default: interactive)
export GUARDIAN_APPROVAL_MODE=interactive  # interactive | auto | manual
```

### How It Works (v7.12.0+ with Approval Workflow)

1. **Automatic Detection** (Every 5 Minutes)
   ```
   Guardian Health Check → Detect Issues → Store in History
   ```

2. **Pattern Analysis** (When ≥3 Checks Available)
   ```
   Analyze History → Detect Recurring Patterns → Generate Root Cause
   ```

3. **Enhancement Suggestions** (When Confidence ≥80%)
   ```
   Detect Enhancements → Calculate ROI → Determine Approval Tier
   ```

4. **Human-in-the-Loop Approval** (Three-Tier System)
   ```
   ┌─────────────────────────────────────────────┐
   │ TIER 1: Auto-Apply (≥95% confidence)       │
   │ → Execute immediately, notify user         │
   └─────────────────────────────────────────────┘
       OR
   ┌─────────────────────────────────────────────┐
   │ TIER 2: Prompt for Approval (80-95%)       │
   │ → Interactive prompt: "Approve? (y/n/defer)"│
   └─────────────────────────────────────────────┘
       OR
   ┌─────────────────────────────────────────────┐
   │ TIER 3: Manual Review Required (<80%)      │
   │ → Create TODO only, require /approve       │
   └─────────────────────────────────────────────┘
   ```

5. **Implementation** (After Approval)
   ```
   Execute Enhancement → Verify Success → Store Pattern → Update Success Rate
   ```

6. **Compounding Learning** (When Pattern Verified)
   ```
   Issue Occurs Again → Match Pattern → Auto-Remediate → Faster Resolution
   ```

---

## Example: GraphRAG Timeout Learning

### Day 1: Detection Phase

**08:00 - Issue Detected**
```
Issue: GraphRAG timeout 10308ms (occurrence 1)
→ Stored in health history
```

**08:05 - Issue Detected**
```
Issue: GraphRAG timeout 11234ms (occurrence 2)
→ Stored in health history
```

**08:10 - Pattern Detected!**
```
Issue: GraphRAG timeout 9876ms (occurrence 3)
→ Root Cause Learner: "GraphRAG timeout recurring"
→ Hypothesis: "Neo4j memory exhaustion"
→ Confidence: 65% (not enough for enhancement yet)
→ Pattern stored in ~/.versatil/learning/root-causes/
```

### Day 1: Verification Phase

**08:15 - Manual Investigation**
```
User: docker restart versatil-neo4j
Result: Issue resolved
```

**08:20 - Pattern Updated**
```
→ Root Cause Learner: Update confidence → 85%
→ Enhancement Detector: Generate suggestion
→ Enhancement TODO created:
  todos/enhancement-auto-remediation-high-1730123456789-ab3f.md
```

**Enhancement TODO Contents**:
```markdown
# 🚀 Enhancement Suggestion - Auto-restart Neo4j on memory threshold

## Pattern Detected
**Issue**: GraphRAG timeout >5s
**Occurrences**: 3 times in past 1h
**Root Cause**: Neo4j memory exhaustion (95%+ usage)

## Current Impact
- **Manual Interventions**: 6 per week
- **Time Spent**: 1.5h per week on manual restarts
- **Reliability Impact**: 5% improvement possible

## Implementation Steps
1. Add memory monitoring to RAG health check (rag-health-monitor.ts)
2. Implement auto-restart logic at 90% memory threshold
3. Add cooldown period (5 minutes) to prevent restart loops
4. Log remediation action to telemetry with success tracking
5. Add unit tests for auto-restart logic

## Expected Benefits
- ✅ Reduce manual intervention: 6 interventions/week → 0
- ✅ Save time: 1.5h/week freed for feature development
- ✅ Improve reliability: 5% reliability improvement
- ✅ Auto-remediation: YES - Can be automated

## ROI Calculation
Implementation Time: 3h
Time Saved per Week: 1.5h
Break-even: 2 weeks
Annual Savings: 78h/year
```

### Day 2: Auto-Remediation Phase

**09:00 - Issue Occurs Again**
```
Issue: GraphRAG timeout 10512ms (occurrence 4)
→ Root Cause Learner: Match pattern (85% confidence)
→ Guardian: Auto-remediate → docker restart versatil-neo4j
→ Duration: 2 seconds
→ Result: SUCCESS
```

**09:01 - Pattern Learning Updated**
```
→ Success Rate: 100% (2/2 successful)
→ Avg Duration: 2 seconds
→ Confidence: 90% (increased from 85%)
→ Pattern stored in Private RAG
```

### Day 3: Enhancement Implemented

**After Enhancement TODO Completed**:
```
Enhancement: Auto-restart on 90% memory threshold → IMPLEMENTED
New Monitoring: Memory alerts at 85% threshold
Result: GraphRAG timeouts drop from 6/day → 0/week
Time Saved: 1.5h/week on manual debugging
```

**Compounding Intelligence**:
```
Similar Issue: "PostgreSQL timeout" detected
→ Guardian: Match similar pattern to GraphRAG
→ Auto-suggest: "Add memory monitoring for PostgreSQL"
→ Confidence: 88% (learned from GraphRAG pattern)
→ Implementation: 40% faster (2h instead of 3h)
```

---

## Human-in-the-Loop Approval Workflow (v7.12.0+)

### Why Human Approval?

**Problem**: Auto-applying all enhancements without approval can lead to:
- Unexpected production changes
- Untested implementations
- Lack of ROI awareness before commitment

**Solution**: Three-tier approval system balances automation with human oversight.

### Three Approval Tiers

#### TIER 1: Auto-Apply (≥95% Confidence)

**Criteria**:
- Verification confidence ≥95%
- Success rate ≥95% (from historical fixes)
- Non-critical priority
- Simple change (≤1h effort)
- ≤1 secondary root cause (simple issue)

**Behavior**:
```
Enhancement Detected → Execute Immediately → Notify User → Create Audit Trail TODO
```

**Example**: `npm install` for missing dependencies

**User Experience**:
```
✅ Guardian Auto-Applied: Auto-fix security vulnerabilities
   npm audit fix --force
   ROI: 15 vulnerabilities fixed, 0.5h/week saved

📝 Audit trail: todos/enhancement-security-critical-1234-ab3f.md
```

---

#### TIER 2: Prompt for Approval (80-95% Confidence)

**Criteria**:
- Verification confidence 80-95%
- Success rate 70-95%
- Non-critical priority
- Moderate effort (1-8h)
- ROI ratio ≥5:1 (or moderate ROI with high priority)

**Behavior**:
```
Enhancement Detected → Show Interactive Prompt → Wait for User Decision

┌─────────────────────────────────────────────────────────┐
│ 🚀 Guardian Enhancement Detected                        │
├─────────────────────────────────────────────────────────┤
│ 📋 Auto-restart Neo4j on memory threshold               │
│                                                          │
│ 📊 Impact:                                               │
│    • Pattern: GraphRAG timeout >5s                      │
│    • Occurrences: 3 times in 1h                         │
│    • Priority: HIGH                                     │
│                                                          │
│ 💰 ROI:                                                  │
│    • Implementation Time: 3h                            │
│    • Time Saved per Week: 1.5h                          │
│    • ROI Ratio: 26:1                                    │
│    • Break-even: 2 weeks                                │
│    • Annual Savings: 78h/year                           │
│                                                          │
│ 🎯 Confidence:                                           │
│    • Verification: 85%                                  │
│    • Expected Success Rate: 90%                         │
│                                                          │
│ 🔧 Assigned Agent: Marcus-Backend                       │
│                                                          │
│ ⏱️  Timeout: 300s (auto-defer if no response)           │
│                                                          │
│ Approve this enhancement?                               │
│   [Y]es  - Approve and implement now                    │
│   [N]o   - Reject (requires reason)                     │
│   [D]efer - Review later (creates TODO)                 │
│   [I]nfo  - Show full details                           │
└─────────────────────────────────────────────────────────┘
```

**User Response**:
- **Y (Yes)**: Execute enhancement immediately
- **N (No)**: Reject with reason (stored in approval history)
- **D (Defer)**: Create TODO for later review
- **I (Info)**: Show full implementation steps, then re-prompt

**Timeout Behavior** (default: 5 minutes):
- If no response within timeout → Auto-defer → Create TODO

---

#### TIER 3: Manual Review Required (<80% Confidence)

**Criteria**:
- Verification confidence <80%
- OR critical priority
- OR ≥3 secondary root causes (complex issue)
- OR success rate <70%
- OR high effort (>8h)

**Behavior**:
```
Enhancement Detected → Create TODO Only → Notify User

📝 Created 1 enhancement TODO for manual review
   Location: todos/enhancement-performance-low-1234-cd5e.md
   Use /work <todo-file> or /approve <enhancement-id> to implement
```

**User Actions**:
1. Review TODO file carefully
2. Validate implementation steps
3. Check for risks/side effects
4. Run `/approve <enhancement-id>` to implement
5. OR run `/work <todo-file>` for agent-assisted implementation

---

### Approval Modes

Set `GUARDIAN_APPROVAL_MODE` to control approval behavior:

#### Interactive (Default)

```bash
export GUARDIAN_APPROVAL_MODE=interactive
```

| Tier | Behavior |
|------|----------|
| Tier 1 | Auto-apply immediately |
| Tier 2 | Show interactive prompt |
| Tier 3 | Create TODO only |

**Best for**: Most users - balances automation with control

---

#### Auto

```bash
export GUARDIAN_APPROVAL_MODE=auto
```

| Tier | Behavior |
|------|----------|
| Tier 1 | Auto-apply immediately |
| Tier 2 | **Auto-apply immediately** (no prompt) |
| Tier 3 | Create TODO only |

**Best for**: Development environments, CI/CD pipelines, high-trust scenarios

---

#### Manual

```bash
export GUARDIAN_APPROVAL_MODE=manual
```

| Tier | Behavior |
|------|----------|
| Tier 1 | **Create TODO** (no auto-apply) |
| Tier 2 | Create TODO |
| Tier 3 | Create TODO |

**Best for**: Production environments, high-risk projects, cautious users

---

### Approval Commands

#### `/approve <enhancement-id>`

Approve and implement enhancement.

```bash
/approve enhancement-auto-remediation-high-1730123456789-ab3f
```

**Output**:
```
✅ Enhancement approved: Auto-restart Neo4j on memory threshold
🚀 Implementing now...
   • Added memory monitoring to RAG health check
   • Implemented auto-restart logic at 90% threshold
   • Added cooldown period (5 minutes)
   • Logged remediation to telemetry
✅ Implementation complete (duration: 2.3s)
💾 Approval decision stored
```

#### `/approve reject <enhancement-id> "reason"`

Reject enhancement with documented reason.

```bash
/approve reject enhancement-monitoring-medium-1730123456790-cd9e "Already monitoring via external service"
```

#### `/approve defer <enhancement-id>`

Defer decision for later review.

```bash
/approve defer enhancement-performance-low-1730123456791-ef3g
```

#### `/approve list`

Show all pending (deferred) approvals.

```bash
/approve list
```

**Output**:
```
📋 Pending Approvals (3)

1. 🟡 Auto-restart Neo4j on memory threshold
   ID: enhancement-auto-remediation-high-1730123456789-ab3f
   Priority: high
   ROI: 3h → 1.5h/week saved (break-even: 2 weeks)
   Deferred: 2 hours ago

2. 🟡 Add memory threshold monitoring
   ID: enhancement-monitoring-medium-1730123456790-cd9e
   Priority: medium
   ROI: 4h → 2h/week saved
   Deferred: 3 hours ago

3. 🔴 Optimize query performance
   ID: enhancement-performance-low-1730123456791-ef3g
   Priority: low
   ROI: 6h → 1h/week saved
   Deferred: 1 day ago
```

#### `/approve history`

Show past approval decisions (approved, rejected, deferred).

---

### Approval Decision Storage

**Location**: `~/.versatil/approvals/decisions.jsonl`

**Format**: One JSON object per line (JSONL)

**Example**:
```json
{"enhancement_id":"enhancement-auto-remediation-high-1730123456789-ab3f","decision":"approved","reason":null,"timestamp":"2025-10-29T10:00:00.000Z","user":"username"}
{"enhancement_id":"enhancement-monitoring-medium-1730123456790-cd9e","decision":"rejected","reason":"Already monitoring via external service","timestamp":"2025-10-29T10:30:00.000Z","user":"username"}
{"enhancement_id":"enhancement-performance-low-1730123456791-ef3g","decision":"deferred","reason":null,"timestamp":"2025-10-29T11:00:00.000Z","user":"username"}
```

**Retention**: Unlimited (manual cleanup if needed)

**Audit Trail**: Complete history of all approval decisions for compliance

---

## Configuration

### Environment Variables

```bash
# Root Cause Learning
GUARDIAN_LEARN_FROM_ISSUES=true                   # Enable learning (default: true)
GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN=3            # Min occurrences to detect pattern (default: 3)
GUARDIAN_PATTERN_TIMESPAN_HOURS=24                # Time window for pattern detection (default: 24h)

# Enhancement Detection
GUARDIAN_CREATE_ENHANCEMENT_TODOS=true            # Enable enhancement TODOs (default: true)
GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT=80        # Min confidence to suggest enhancement (default: 80%)

# Pattern Storage
GUARDIAN_STORE_ROOT_CAUSES_IN_RAG=true            # Store learned patterns (default: true)
GUARDIAN_RAG_STORAGE_DESTINATION=private          # private | public | both (default: private)
```

### Configuration Examples

#### Scenario 1: Default (Recommended)
```bash
# All features enabled, balanced sensitivity
GUARDIAN_LEARN_FROM_ISSUES=true
GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN=3
GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT=80
```
**Result**: Detects patterns after 3 occurrences, suggests enhancements with 80%+ confidence

#### Scenario 2: Aggressive Learning
```bash
# Lower thresholds for faster pattern detection
GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN=2            # Detect after 2 occurrences
GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT=70        # Suggest with 70%+ confidence
```
**Result**: More enhancement suggestions, potentially more false positives

#### Scenario 3: Conservative Learning
```bash
# Higher thresholds for fewer but higher-confidence suggestions
GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN=5            # Detect after 5 occurrences
GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT=90        # Suggest only with 90%+ confidence
```
**Result**: Fewer enhancement suggestions, higher confidence

#### Scenario 4: Disabled (Fallback to v7.10.0)
```bash
# Disable root cause learning entirely
GUARDIAN_LEARN_FROM_ISSUES=false
```
**Result**: No pattern detection, no enhancement TODOs (Guardian works as before)

---

## File Locations

### Generated Files

```
~/.versatil/learning/root-causes/
└── patterns.jsonl              # All detected root cause patterns (JSONL format)

todos/
├── enhancement-auto-remediation-high-*.md   # Auto-remediation enhancements
├── enhancement-monitoring-medium-*.md       # Monitoring enhancements
├── enhancement-performance-high-*.md        # Performance enhancements
└── enhancement-security-critical-*.md       # Security enhancements
```

### Source Files

```
src/agents/guardian/
├── root-cause-learner.ts           # Pattern detection + root cause analysis
├── enhancement-detector.ts         # Enhancement opportunity detection
├── enhancement-todo-generator.ts   # Markdown TODO file generation
├── pattern-correlator.ts           # Metric correlation + trend detection
└── iris-guardian.ts                # Main orchestrator (integrated)
```

---

## Pattern Format

### Root Cause Pattern (JSONL)

```json
{
  "id": "root-cause-1730123456789-ab3f",
  "issue_fingerprint": "graphrag timeout xms",
  "issue_description": "GraphRAG timeout 10308ms",
  "occurrences": 6,
  "first_seen": "2025-10-28T08:00:00.000Z",
  "last_seen": "2025-10-28T17:56:04.914Z",
  "timespan_hours": 24,
  "root_cause": {
    "primary": "Neo4j memory exhaustion",
    "secondary": ["Docker resource limits", "Query complexity"],
    "confidence": 85,
    "evidence": [
      "6 occurrences in 24h",
      "2 similar historical patterns found",
      "Known pattern for rag"
    ]
  },
  "remediation": {
    "manual_fix": "docker restart versatil-neo4j",
    "success_rate": 100,
    "avg_duration_ms": 2000,
    "last_success": "2025-10-28T09:01:00.000Z"
  },
  "enhancement_candidate": true,
  "enhancement_priority": "high",
  "estimated_roi_hours_per_week": 1.5,
  "context": "FRAMEWORK_CONTEXT",
  "layer": "framework",
  "component": "rag",
  "severity": "high"
}
```

---

## Integration with Existing Systems

### 1. RAG Storage Integration

```typescript
// Root cause patterns stored in Private RAG
~/.versatil/learning/root-causes/patterns.jsonl

// Queried during:
// - New pattern detection (similar historical issues)
// - Enhancement detection (similar fixes)
// - Auto-remediation (matching patterns)
```

### 2. Guardian Telemetry Integration

```typescript
// All learning events logged to:
~/.versatil/logs/guardian/guardian-2025-10-29.log

// Metrics tracked:
// - patterns_detected
// - enhancements_suggested
// - auto_remediation_success_rate
// - learning_confidence_avg
```

### 3. Todo System Integration

```typescript
// Enhancement TODOs created alongside existing TODOs:
todos/
├── 001-pending-p1-feature.md         // Manual /plan TODOs
├── guardian-combined-*.md            // Guardian issue TODOs (v7.10.0)
└── enhancement-*.md                  // Guardian enhancement TODOs (v7.11.0)
```

### 4. Auto-Remediation Engine Integration

```typescript
// Root cause patterns used by:
src/agents/guardian/auto-remediation-engine.ts

// When issue detected:
// 1. Check root cause patterns for match
// 2. If match found with ≥90% confidence → auto-fix
// 3. Update pattern success rate
// 4. Store learning in RAG
```

---

## Metrics & Analytics

### Learning Metrics

```bash
# View learning statistics
/guardian:stats

# Output:
Root Cause Learning Statistics:
- Patterns Detected: 12
- New Patterns (Last 24h): 3
- Updated Patterns (Last 24h): 9
- Enhancement Candidates: 5
- Avg Confidence: 87%
- Total Occurrences Analyzed: 156
```

### Enhancement Metrics

```bash
# View enhancement statistics
/guardian:enhancements

# Output:
Enhancement Detection Statistics:
- Enhancements Suggested: 5
- High Priority: 2
- Total ROI (hours/week): 8.5h
- Avg Confidence: 85%
- Auto-Applicable: 3
- Manual Review Required: 2
```

### Pattern Correlation Metrics

```bash
# View correlation analysis
/guardian:correlations

# Output:
Pattern Correlation Analysis:
- Correlations Detected: 8
- Degradation Trends: 3
- Predictive Alerts: 2
- Analysis Window: 24h
- Health Checks Analyzed: 288
```

---

## Troubleshooting

### No Patterns Detected

**Symptom**: Guardian runs but no root cause patterns detected

**Solution**:
1. Check health history size: `this.healthHistory.length` (need ≥3)
2. Verify environment variable: `GUARDIAN_LEARN_FROM_ISSUES=true`
3. Check logs: `~/.versatil/logs/guardian/guardian-2025-10-29.log`

### No Enhancement TODOs Created

**Symptom**: Patterns detected but no enhancement TODOs generated

**Solution**:
1. Check confidence threshold: patterns need ≥80% confidence (default)
2. Verify environment variable: `GUARDIAN_CREATE_ENHANCEMENT_TODOS=true`
3. Check for duplicates: enhancement TODOs are deduplicated

### Enhancement TODOs Spam

**Symptom**: Too many enhancement TODOs created

**Solution**:
1. Increase confidence threshold: `GUARDIAN_MIN_CONFIDENCE_FOR_ENHANCEMENT=90`
2. Increase occurrence threshold: `GUARDIAN_MIN_OCCURRENCES_FOR_PATTERN=5`
3. Delete false positives: Guardian will deduplicate and not recreate

### Pattern Confidence Too Low

**Symptom**: Patterns detected with low confidence (<70%)

**Solution**:
1. Wait for more occurrences: confidence increases with data
2. Provide manual fixes: manual fix success increases confidence
3. Check RAG: similar historical patterns boost confidence

---

## Performance Impact

| Metric | Value | Notes |
|--------|-------|-------|
| **Health Check Overhead** | <200ms | Pattern analysis only runs when ≥3 checks |
| **Pattern Detection** | ~50ms | Per health check with 100 history items |
| **Enhancement Detection** | ~100ms | Per pattern analyzed |
| **TODO Generation** | ~10ms | Per enhancement TODO |
| **Total Impact** | ~300ms | Negligible for 5-minute health check intervals |

**Memory Usage**: ~5MB additional for pattern cache and health history

---

## Limitations

### Current Limitations (v7.11.0)

1. **Pattern Detection**: Only analyzes last 100 health checks (~8.3 hours at 5-min intervals)
2. **Root Cause Inference**: Rule-based, not ML-powered (ML planned for v8.0.0)
3. **Cross-Project Learning**: Patterns are project-specific (not shared across user projects)
4. **Auto-Remediation**: Requires manual fix to be proven successful first
5. **Enhancement Implementation**: Enhancement TODOs require manual implementation

### Planned Improvements (v7.12.0+)

- **ML-Powered Root Cause**: Use embeddings + clustering for better root cause inference
- **Cross-Project Patterns**: Share anonymized patterns across user projects (opt-in)
- **Automatic Enhancement Implementation**: Guardian implements high-confidence enhancements automatically
- **Predictive Maintenance**: Alert before issues occur based on degradation trends

---

## FAQ

### Q1: Does Guardian learn from ALL health checks?

**A**: Yes, but pattern analysis only runs when ≥3 health checks are available in history. Guardian stores the last 100 health checks (~8.3 hours at 5-min intervals).

### Q2: Will Guardian suggest enhancements for every recurring issue?

**A**: No. Enhancements are only suggested when:
- Confidence ≥80% (configurable)
- Occurrences ≥3 (configurable)
- Pattern is enhancement candidate (based on root cause analysis)

### Q3: Can I disable enhancement TODOs but keep pattern learning?

**A**: Yes:
```bash
export GUARDIAN_LEARN_FROM_ISSUES=true           # Keep learning
export GUARDIAN_CREATE_ENHANCEMENT_TODOS=false   # Disable TODOs
```

### Q4: Are root cause patterns shared across projects?

**A**: Not currently (v7.11.0). Patterns are stored per-project in `~/.versatil/learning/root-causes/`. Cross-project learning is planned for v7.12.0 (opt-in).

### Q5: How does Guardian handle false positive patterns?

**A**:
1. Confidence scoring: Low confidence patterns (<80%) are not suggested
2. Manual review: Enhancement TODOs can be deleted (won't recreate due to deduplication)
3. Success rate: Patterns with low success rates are deprioritized

### Q6: Can Guardian implement enhancements automatically?

**A**: Not yet (v7.11.0). Guardian creates enhancement TODOs for human implementation. Automatic enhancement implementation is planned for v7.12.0 for high-confidence suggestions.

### Q7: What happens if I disable learning mid-session?

**A**:
- Existing patterns: Preserved in `~/.versatil/learning/root-causes/`
- New patterns: Not detected
- Existing enhancement TODOs: Remain in `todos/` directory

### Q8: How does pattern correlator work?

**A**: Pattern correlator analyzes metrics across health checks to detect:
- **Metric correlations**: memory ↑ → latency ↑ (Pearson correlation)
- **Degradation trends**: Linear regression on metric time series
- **Predictive alerts**: ETA until threshold breach based on trend

---

## Related Documentation

- [Guardian Health System](./GUARDIAN_HEALTH_SYSTEM.md)
- [Guardian TODO System](./GUARDIAN_TODO_SYSTEM.md)
- [Chain-of-Verification (CoVe)](../architecture/VICTOR_VERIFIER.md)
- [Auto-Remediation Engine](./AUTO_REMEDIATION.md)
- [Compounding Engineering](../guides/compounding-engineering.md)

---

**Questions or Issues?**

- GitHub Issues: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
- Documentation: [CLAUDE.md](../../CLAUDE.md)
- Guardian Logs: `~/.versatil/logs/guardian/`

**Generated by VERSATIL Documentation System**
**Version**: 7.11.0
**Last Updated**: 2025-10-29
