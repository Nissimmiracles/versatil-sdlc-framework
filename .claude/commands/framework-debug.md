---
name: framework:debug
description: Collect comprehensive debug information for troubleshooting framework issues
tags: [framework, debug, support, diagnostics]
---

# Framework Debug Information Collector

You are helping the user collect comprehensive debug information about their VERSATIL SDLC Framework installation for troubleshooting purposes.

## Your Task

Collect the following information and create a debug report:

### 1. Environment Information
- Node.js version
- npm version
- Operating system and version
- Current working directory
- Framework version (from package.json)

### 2. Framework Status
- Framework home directory (~/.versatil/) exists?
- Isolation check - any violations?
- Agent configurations present?
- Required directories present?

### 3. Configuration Files
- .cursor/settings.json status
- .claude/agents/*.json status
- .claude/commands/*.md status
- .claude/hooks/* status
- package.json scripts

### 4. Recent Logs (if available)
- Last 50 lines of any framework logs
- Recent npm install/run output (if relevant)
- Error messages (if any)

### 5. Test Suite Status
- Jest configuration present?
- Tests can run?
- Coverage reports available?

### 6. Git Status (if in git repo)
- Current branch
- Uncommitted changes
- Recent commits (last 3)

### 7. Dependencies
- node_modules present?
- Key dependencies installed (check package.json)?

## Output Format

Create a structured debug report in JSON format and save it to `versatil-debug-report.json`:

```json
{
  "timestamp": "ISO timestamp",
  "environment": { ... },
  "framework": { ... },
  "configuration": { ... },
  "tests": { ... },
  "git": { ... },
  "issues": [ ... ],
  "recommendations": [ ... ]
}
```

Also create a human-readable markdown summary in `VERSATIL_DEBUG_REPORT.md`.

## Important Notes

- **Privacy**: Do NOT include sensitive information (API keys, tokens, passwords)
- **File Size**: Limit log excerpts to last 50 lines
- **Paths**: Use relative paths where possible for portability
- **Sanitize**: Remove any user-specific paths from shared reports

## Actions

1. Use Bash tool to collect system information
2. Use Read tool to check configuration files
3. Use Glob/Grep to find relevant files
4. Use Write tool to create both JSON and Markdown reports
5. Present summary to user with key findings

## Report Sections

### Issues Detected
List any problems found during diagnostic scan:
- Severity (critical/high/medium/low)
- Description
- Suggested fix

### Health Score
- Overall: X/10
- Isolation: ✅/❌
- Configuration: ✅/❌
- Tests: ✅/❌
- Dependencies: ✅/❌

### Recommendations
- Immediate actions required

---

## Step: Auto-Remediation (Iris-Guardian)

**After generating debug report, invoke Iris-Guardian for automatic issue fixing:**

```typescript
await Task({
  subagent_type: "Iris-Guardian",
  description: "Auto-remediation of detected issues",
  prompt: `Analyze debug report and auto-fix critical/high issues. Return remediation results with safe_to_proceed boolean.`
});
```

Process result and execute safe auto-fixes automatically
- Optional improvements
- Contact support with report if issues persist

## Usage

After generating the report:

```bash
# User can share the debug report:
cat versatil-debug-report.json

# Or view the human-readable version:
cat VERSATIL_DEBUG_REPORT.md
```

**Support**: If issues persist after reviewing this report, please:
1. Run `npm run recover` to attempt auto-fix
2. Share `versatil-debug-report.json` on GitHub issues
3. Include the Markdown summary for context