---
name: approve
description: Approve, reject, or defer Guardian enhancement suggestions
usage: |
  /approve <enhancement-id> - Approve and implement enhancement
  /approve reject <enhancement-id> "reason" - Reject enhancement with reason
  /approve defer <enhancement-id> - Defer decision for later review
  /approve list - Show pending approvals
  /approve history - Show past approval decisions
examples:
  - /approve enhancement-auto-remediation-high-1234-ab3f
  - /approve reject enhancement-monitoring-medium-5678-cd9e "Not needed for current priority"
  - /approve defer enhancement-performance-low-9012-ef3g
  - /approve list
  - /approve history
category: Guardian
version: 7.12.0
---

# /approve Command

Manage Guardian enhancement approvals with human-in-the-loop workflow.

## Purpose

The `/approve` command provides explicit control over Guardian's enhancement suggestions. It allows you to:
- Approve and implement enhancements (Tier 2 and 3)
- Reject enhancements with documented reasoning
- Defer decisions for later review
- View pending and historical approval decisions

## Usage

### Approve Enhancement

```bash
/approve <enhancement-id>
```

**What it does**:
1. Validates enhancement ID exists
2. Checks approval tier (Tier 1 already auto-applied)
3. Executes enhancement via Auto-Remediation Engine
4. Stores approval decision in `~/.versatil/approvals/decisions.jsonl`
5. Updates Guardian telemetry

**Example**:
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

---

### Reject Enhancement

```bash
/approve reject <enhancement-id> "reason"
```

**What it does**:
1. Validates enhancement ID exists
2. Stores rejection with reason in approvals history
3. Removes TODO file (if exists)
4. Logs rejection to telemetry

**Example**:
```bash
/approve reject enhancement-monitoring-medium-1730123456790-cd9e "Already monitoring via external service"
```

**Output**:
```
❌ Enhancement rejected: Add memory threshold monitoring
   Reason: Already monitoring via external service
💾 Rejection decision stored
🗑️  TODO file removed: todos/enhancement-monitoring-medium-1730123456790-cd9e.md
```

---

### Defer Enhancement

```bash
/approve defer <enhancement-id>
```

**What it does**:
1. Validates enhancement ID exists
2. Stores deferral decision in approvals history
3. Keeps TODO file for later review
4. Logs deferral to telemetry

**Example**:
```bash
/approve defer enhancement-performance-low-1730123456791-ef3g
```

**Output**:
```
⏸️  Enhancement deferred: Optimize query performance
📝 TODO remains for later review: todos/enhancement-performance-low-1730123456791-ef3g.md
💡 Tip: Run `/approve list` to see all deferred enhancements
```

---

### List Pending Approvals

```bash
/approve list
```

**What it does**:
1. Reads `~/.versatil/approvals/decisions.jsonl`
2. Filters for deferred decisions
3. Displays summary with enhancement details

**Output**:
```
📋 Pending Approvals (3)

1. 🟡 Auto-restart Neo4j on memory threshold
   ID: enhancement-auto-remediation-high-1730123456789-ab3f
   Priority: high
   ROI: 3h implementation → 1.5h/week saved (break-even: 2 weeks)
   Deferred: 2025-10-29T10:30:00Z (2 hours ago)

2. 🟡 Add memory threshold monitoring
   ID: enhancement-monitoring-medium-1730123456790-cd9e
   Priority: medium
   ROI: 4h implementation → 2h/week saved (break-even: 2 weeks)
   Deferred: 2025-10-29T09:15:00Z (3 hours ago)

3. 🔴 Optimize query performance
   ID: enhancement-performance-low-1730123456791-ef3g
   Priority: low
   ROI: 6h implementation → 1h/week saved (break-even: 6 weeks)
   Deferred: 2025-10-28T14:00:00Z (1 day ago)

💡 Tip: Run `/approve <enhancement-id>` to implement
```

---

### Show Approval History

```bash
/approve history
```

**What it does**:
1. Reads `~/.versatil/approvals/decisions.jsonl`
2. Displays all approval decisions (approved, rejected, deferred)
3. Shows timestamps, users, and reasons

**Output**:
```
📜 Approval History (12 decisions)

✅ APPROVED - Auto-fix security vulnerabilities
   ID: enhancement-security-critical-1730123456788-yz1w
   User: username
   Timestamp: 2025-10-29T11:00:00Z (1 hour ago)
   Result: Implemented successfully (duration: 5.2s)

❌ REJECTED - Add latency monitoring
   ID: enhancement-monitoring-medium-1730123456787-uv2x
   User: username
   Timestamp: 2025-10-29T10:30:00Z (2 hours ago)
   Reason: Already using external APM tool

⏸️  DEFERRED - Optimize build process
   ID: enhancement-performance-low-1730123456786-st3y
   User: username
   Timestamp: 2025-10-29T09:00:00Z (3 hours ago)

[... 9 more entries ...]

💡 Tip: Run `/approve list` to see only pending approvals
```

---

## Integration with Guardian Workflow

### Three-Tier Approval System

```
┌─────────────────────────────────────────────┐
│ TIER 1: Auto-Apply (≥95% confidence)       │
│ → Auto-applied immediately, no /approve    │
│ → Creates audit trail TODO only            │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TIER 2: Prompt for Approval (80-95%)       │
│ → Interactive prompt during health check   │
│ → OR use /approve command for manual       │
│ → Creates TODO if deferred                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ TIER 3: Manual Review Required (<80%)      │
│ → Creates TODO automatically               │
│ → Requires /approve command after review   │
│ → OR use /work command with agent          │
└─────────────────────────────────────────────┘
```

### Approval Modes (Configuration)

Set `GUARDIAN_APPROVAL_MODE` environment variable:

#### Interactive (Default)
```bash
export GUARDIAN_APPROVAL_MODE=interactive
```
- Tier 1: Auto-apply
- Tier 2: Interactive prompt
- Tier 3: Manual review

#### Auto
```bash
export GUARDIAN_APPROVAL_MODE=auto
```
- Tier 1: Auto-apply
- Tier 2: Auto-apply (treat as Tier 1)
- Tier 3: Manual review

#### Manual
```bash
export GUARDIAN_APPROVAL_MODE=manual
```
- Tier 1: Create TODO (no auto-apply)
- Tier 2: Create TODO
- Tier 3: Create TODO (all require explicit /approve)

---

## Configuration

### Approval Tier Thresholds

```bash
# Tier 1 confidence threshold (default: 95)
export GUARDIAN_TIER1_CONFIDENCE_THRESHOLD=95

# Tier 2 confidence threshold (default: 80)
export GUARDIAN_TIER2_CONFIDENCE_THRESHOLD=80
```

### Approval Timeout

```bash
# Interactive prompt timeout in seconds (default: 300 = 5 minutes)
export GUARDIAN_APPROVAL_TIMEOUT_SECONDS=300
```

---

## Error Handling

### Enhancement ID Not Found

```bash
/approve enhancement-invalid-id
```

**Output**:
```
❌ Error: Enhancement not found
   Enhancement ID: enhancement-invalid-id

💡 Tip: Run `/approve list` to see available enhancements
```

### Enhancement Already Approved

```bash
/approve enhancement-auto-remediation-high-1234-ab3f
```

**Output**:
```
⚠️  Enhancement already approved
   Enhancement ID: enhancement-auto-remediation-high-1234-ab3f
   Approved: 2025-10-29T10:00:00Z (2 hours ago)
   Status: Implemented successfully

💡 Tip: Run `/approve history` to see past decisions
```

### Implementation Failed

```bash
/approve enhancement-auto-remediation-high-1234-ab3f
```

**Output**:
```
⚠️  Enhancement implementation failed
   Enhancement ID: enhancement-auto-remediation-high-1234-ab3f
   Error: npm install failed (exit code 1)

📝 Creating TODO for manual implementation...
✅ TODO created: todos/enhancement-auto-remediation-high-1234-ab3f.md

💡 Tip: Use `/work <todo-file>` with assigned agent for manual implementation
```

---

## Files and Locations

### Approval Decisions
- **Location**: `~/.versatil/approvals/decisions.jsonl`
- **Format**: One JSON object per line (JSONL)
- **Retention**: Unlimited (manual cleanup if needed)

**Example Entry**:
```json
{
  "enhancement_id": "enhancement-auto-remediation-high-1730123456789-ab3f",
  "decision": "approved",
  "reason": null,
  "timestamp": "2025-10-29T10:00:00.000Z",
  "user": "username"
}
```

### Enhancement TODOs
- **Location**: `<project-root>/todos/enhancement-*.md`
- **Format**: Markdown with YAML frontmatter
- **Lifecycle**: Created on detection → Removed on approval/rejection → Kept on deferral

---

## Best Practices

### 1. Review Before Approving
- Read implementation steps carefully
- Validate estimated effort matches reality
- Check for potential side effects

### 2. Document Rejections
- Always provide reason when rejecting
- Helps Guardian learn what NOT to suggest

### 3. Use Deferral Strategically
- Defer low-priority enhancements during busy periods
- Review deferred list weekly via `/approve list`

### 4. Configure Approval Mode Per Project
- Development: Use `auto` mode for faster iteration
- Production: Use `interactive` or `manual` for safety

### 5. Audit Approval History
- Run `/approve history` monthly
- Identify patterns in rejections
- Adjust confidence thresholds if needed

---

## Related Commands

- `/work <todo-file>` - Manually implement enhancement with agent
- `/learn "message"` - Store pattern after manual implementation
- `/guardian` - View Guardian health and configuration

---

## Implementation Details

### Tool: Task (agent invocation)
When you see `/approve <enhancement-id>`, you should:

1. **Find Enhancement TODO**
   - Search `todos/` for `enhancement-*.md` with matching ID in frontmatter
   - Parse YAML frontmatter to extract `EnhancementSuggestion` details

2. **Validate Approval Tier**
   - Tier 1: Already applied, show audit trail only
   - Tier 2/3: Proceed with approval workflow

3. **Execute Enhancement**
   - Import `EnhancementApprovalService`
   - Call `approvalService.executeEnhancement(suggestion)`
   - Handle success/failure cases

4. **Store Decision**
   - Call `approvalService.storeDecision(result)`
   - Appends to `~/.versatil/approvals/decisions.jsonl`

5. **Update TODO**
   - Approved + success: Remove TODO file
   - Approved + failure: Keep TODO, update status
   - Rejected: Remove TODO file
   - Deferred: Keep TODO unchanged

### Example Implementation Flow

```typescript
// 1. Parse enhancement ID from command
const enhancementId = args[0]; // e.g., "enhancement-auto-remediation-high-1234-ab3f"

// 2. Find TODO file
const todoFiles = glob('todos/enhancement-*.md');
const todoFile = todoFiles.find(file => {
  const content = fs.readFileSync(file, 'utf-8');
  return content.includes(`id: "${enhancementId}"`);
});

// 3. Parse TODO frontmatter
const suggestion = parseTodoFrontmatter(todoFile);

// 4. Execute enhancement
const approvalService = new EnhancementApprovalService();
const result = await approvalService.executeEnhancement(suggestion);

// 5. Store decision
await approvalService.storeDecision({
  enhancement_id: enhancementId,
  decision: 'approved',
  timestamp: new Date().toISOString(),
  user: os.userInfo().username
});

// 6. Remove TODO if successful
if (result.success) {
  fs.unlinkSync(todoFile);
}
```

---

**Generated by VERSATIL Guardian v7.12.0**
**Root Cause Learning + Human-in-the-Loop Approval Workflow**
