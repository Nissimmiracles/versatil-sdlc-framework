# Remediation Playbook

**Purpose**: Auto-remediation patterns with confidence scores and rollback procedures

---

## Auto-Remediation Decision Tree

```
Issue Detected
    ↓
Check Confidence Score
    ↓
≥90%? → Auto-apply immediately
    ↓
80-89%? → Apply with user notification
    ↓
70-79%? → Suggest only, require approval
    ↓
<70%? → Manual intervention required
```

---

## High Confidence Fixes (90%+ - Always Auto-Apply)

### 1. Restart GraphRAG (93% confidence)

**Issue**: `ECONNREFUSED` when connecting to Neo4j

**Symptoms**:
- RAG health score = 0 or 70 (GraphRAG down, Vector ok)
- Error: "Connection refused to localhost:7687"

**Fix**:
```bash
npm run rag:start
# Or manually:
docker start versatil-neo4j
```

**Validation**:
```typescript
const graphrag = await testGraphRAGConnection();
if (graphrag.status === 'connected' && graphrag.latency < 500) {
  return { success: true, message: 'GraphRAG reconnected' };
}
```

**Rollback**: N/A (idempotent, safe to retry)

**Why High Confidence**: GraphRAG restart is non-destructive, well-tested, fixes 93% of connection issues

---

### 2. npm audit fix (94% confidence)

**Issue**: Critical or high security vulnerabilities

**Symptoms**:
- Dependency health score = 0 (critical) or 40 (high)
- `npm audit` shows vulnerabilities

**Fix**:
```bash
npm audit fix
```

**Validation**:
```bash
npm audit --json | jq '.metadata.vulnerabilities.critical'
# Should return 0
```

**Rollback**:
```bash
git checkout package-lock.json
npm install
```

**Why High Confidence**: npm's official fix command, safe automated patches, preserves functionality

---

### 3. npm install --force (92% confidence)

**Issue**: Missing framework files (installation integrity <90%)

**Symptoms**:
- Installation health score <80
- File count <1,122 (90% of 1,247)

**Fix**:
```bash
npm install @versatil/sdlc-framework --force
```

**Validation**:
```typescript
const fileCount = countFrameworkFiles();
if (fileCount >= 1235) {  // 99%+ coverage
  return { success: true, message: `${fileCount}/1247 files present` };
}
```

**Rollback**: Previous version still in node_modules/.cache if needed

**Why High Confidence**: Official npm reinstall, preserves user data, fixes 92% of partial installations

---

### 4. Clear npm Cache (95% confidence)

**Issue**: Corrupted cache causing install failures

**Symptoms**:
- Installation repeatedly fails
- npm warnings about corrupted cache

**Fix**:
```bash
npm cache clean --force
npm install
```

**Validation**:
```bash
npm cache verify
# Should show "Verified" with no errors
```

**Rollback**: N/A (cache is rebuilt automatically)

**Why High Confidence**: Completely safe, no data loss, recommended by npm docs

---

## Medium Confidence Fixes (80-89% - Apply with Logging)

### 5. npm audit fix --force (80% confidence)

**Issue**: High vulnerabilities that require breaking changes

**Symptoms**:
- `npm audit fix` didn't resolve all issues
- High vulnerabilities remain

**Fix**:
```bash
npm audit fix --force
```

**Validation**: Same as fix #2

**Rollback**: Same as fix #2

**Why Medium Confidence**: May introduce breaking changes (80% safe), requires testing after

**User Notification**:
```
⚠️  Applied npm audit fix --force
    This may have updated dependencies with breaking changes.
    Please test your application after this fix.
    Rollback: git checkout package-lock.json && npm install
```

---

### 6. Rebuild Framework (88% confidence)

**Issue**: Outdated or missing dist/ files

**Symptoms**:
- Build health "outdated" or "missing"
- Runtime errors from stale code

**Fix**:
```bash
cd node_modules/@versatil/sdlc-framework
npm run build
```

**Validation**:
```typescript
const distMtime = fs.statSync('dist/index.js').mtime;
const srcMtime = fs.statSync('src/index.ts').mtime;
if (distMtime > srcMtime) {
  return { success: true, message: 'Build up-to-date' };
}
```

**Rollback**: Previous dist/ still in backup if build fails

**Why Medium Confidence**: Requires TypeScript compilation (may fail), but safe to retry

**User Notification**:
```
🔧 Rebuilding framework...
    This may take 30-60 seconds
```

---

### 7. Reinstall All Dependencies (85% confidence)

**Issue**: Dependency tree corrupted, peer dependency warnings

**Symptoms**:
- Multiple dependency issues
- Conflicting peer dependencies

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Validation**: Check for peer dependency warnings

**Rollback**: Restore package-lock.json from git

**Why Medium Confidence**: Destructive (deletes node_modules), may change versions if package-lock.json removed

**User Notification**:
```
⚠️  Reinstalling all dependencies...
    This will remove node_modules/ and package-lock.json
    Backup created at: .versatil/backups/package-lock-[timestamp].json
    This may take 2-5 minutes
```

---

## Low Confidence Fixes (70-79% - Suggest Only)

### 8. Create Missing Config (75% confidence)

**Issue**: CLAUDE.md or .versatil-project.json missing

**Symptoms**:
- Context health score <100
- "Configuration not loaded" warning

**Fix**:
```bash
cat > CLAUDE.md << 'EOF'
# Your Project

Generated by VERSATIL Framework
EOF
```

**Validation**: File exists and is valid markdown

**Rollback**: Delete created file

**Why Low Confidence**: May overwrite user's intended setup, requires user context

**User Prompt**:
```
❓ Missing CLAUDE.md configuration file
   Would you like me to create a template? (yes/no)

   This will create a basic configuration file.
   You can customize it later.
```

---

### 9. Fix YAML Frontmatter (72% confidence)

**Issue**: Agent definitions have invalid YAML

**Symptoms**:
- Agent health score <100
- Specific agents marked "invalid"

**Fix**:
```yaml
# Common fixes:
# 1. Add missing fields
role: "Your role here"
context: "Your context here"
tools: ["Read", "Write"]

# 2. Fix indentation (must be 2 spaces)
# 3. Quote special characters
# 4. Fix array syntax
```

**Validation**: Parse YAML successfully

**Rollback**: Restore from git

**Why Low Confidence**: YAML syntax errors vary widely, auto-fix may introduce new issues

**User Prompt**:
```
❓ Invalid YAML detected in .claude/agents/example.md
   Suggested fix:
   [show diff]

   Apply this fix? (yes/no)
```

---

## Manual Only Fixes (<70% - Never Auto-Apply)

### 10. Fix Context Mixing (50% confidence)

**Issue**: Framework source files in user project

**Symptoms**:
- Context health shows "mixing detected"
- src/agents/guardian/ found in user project

**Fix**: **MANUAL ONLY** - Too dangerous to auto-delete

**User Warning**:
```
⚠️  CRITICAL: Context mixing detected!

    Framework source files found in your project:
    - src/agents/guardian/
    - .claude/agents/iris-guardian.md

    This should NOT be in user projects.

    Manual fix required:
    1. Verify these are not YOUR files
    2. Remove framework files: rm -rf src/agents/guardian/
    3. Keep only YOUR project files

    ❌ Auto-fix disabled (too dangerous)
```

**Why Manual Only**: Deleting user files is irreversible, requires human verification

---

### 11. Major Version Update (30% confidence)

**Issue**: Framework version 2+ majors behind (e.g., v5.x installed, v8.x available)

**Symptoms**:
- Version health score = 50
- Major version gap detected

**Fix**: **MANUAL ONLY** - Breaking changes likely

**User Warning**:
```
⚠️  Major version update available: v5.3.0 → v8.0.0

    This is a MAJOR version jump with breaking changes.

    Manual steps required:
    1. Review breaking changes: https://github.com/.../CHANGELOG.md#800
    2. Read migration guide: docs/MIGRATION_V5_TO_V8.md
    3. Backup your project: cp -r . ../project-backup
    4. Update: npm install @versatil/sdlc-framework@latest
    5. Fix breaking changes in your code
    6. Test thoroughly

    ❌ Auto-fix disabled (breaking changes)
```

**Why Manual Only**: Breaking changes require code updates, may break user's application

---

## Auto-Fix Selection Algorithm

```typescript
function selectAutoFixes(
  issues: CoherenceIssue[],
  threshold: number = 90
): AutoFix[] {
  const fixes: AutoFix[] = [];

  for (const issue of issues) {
    const fix = REMEDIATION_MAP[issue.type];

    if (!fix) continue;  // No known fix

    if (fix.confidence >= threshold) {
      fixes.push({
        issue_id: issue.id,
        fix_name: fix.name,
        command: fix.command,
        confidence: fix.confidence,
        auto_apply: true
      });
    } else if (fix.confidence >= 70) {
      fixes.push({
        issue_id: issue.id,
        fix_name: fix.name,
        command: fix.command,
        confidence: fix.confidence,
        auto_apply: false,  // Suggest only
        requires_approval: true
      });
    }
  }

  return fixes;
}
```

---

## Remediation Map

```typescript
const REMEDIATION_MAP: Record<string, Remediation> = {
  'graphrag_connection_failed': {
    name: 'restart_graphrag',
    command: 'npm run rag:start',
    confidence: 93,
    duration_seconds: 5,
    prerequisites: ['docker installed'],
    rollback: null
  },

  'critical_vulnerabilities': {
    name: 'npm_audit_fix',
    command: 'npm audit fix',
    confidence: 94,
    duration_seconds: 30,
    prerequisites: ['npm ≥6.0.0'],
    rollback: 'git checkout package-lock.json && npm install'
  },

  'missing_framework_files': {
    name: 'npm_install_force',
    command: 'npm install @versatil/sdlc-framework --force',
    confidence: 92,
    duration_seconds: 60,
    prerequisites: ['npm installed'],
    rollback: 'Use node_modules/.cache backup'
  },

  'corrupted_npm_cache': {
    name: 'clear_npm_cache',
    command: 'npm cache clean --force && npm install',
    confidence: 95,
    duration_seconds: 45,
    prerequisites: ['npm installed'],
    rollback: null  // Cache auto-rebuilds
  },

  'high_vulnerabilities': {
    name: 'npm_audit_fix_force',
    command: 'npm audit fix --force',
    confidence: 80,
    duration_seconds: 40,
    prerequisites: ['npm ≥6.0.0'],
    rollback: 'git checkout package-lock.json && npm install'
  },

  'outdated_build': {
    name: 'rebuild_framework',
    command: 'cd node_modules/@versatil/sdlc-framework && npm run build',
    confidence: 88,
    duration_seconds: 60,
    prerequisites: ['TypeScript ≥5.0.0'],
    rollback: 'Restore dist/ from backup'
  },

  'dependency_tree_corrupted': {
    name: 'reinstall_dependencies',
    command: 'rm -rf node_modules package-lock.json && npm install',
    confidence: 85,
    duration_seconds: 180,
    prerequisites: ['npm installed'],
    rollback: 'git checkout package-lock.json && npm install'
  }
};
```

---

## Best Practices

1. **Always validate after fix** - Check health score improved
2. **Log all auto-fixes** - Audit trail for debugging
3. **Backup before destructive operations** - Enable rollback
4. **Notify user of medium-confidence fixes** - Transparency builds trust
5. **Never auto-apply <70% confidence** - Too risky
6. **Provide rollback instructions** - Even for high-confidence fixes
7. **Test in isolation first** - Verify fix works before production
8. **Update confidence scores** - Based on real-world success rates
