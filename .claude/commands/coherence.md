# /coherence - User Version Coherence Validation

**Purpose**: Validate framework installation health, version alignment, and project setup for users of VERSATIL framework.

**Context**: PROJECT_CONTEXT only (for users who installed `@versatil/sdlc-framework`)

## Usage

```bash
/coherence              # Full health check
/coherence --quick      # Version + critical checks only
/coherence --fix        # Auto-fix common issues (if available)
```

## What It Checks

### 1. Version Alignment
- **Installed version** vs **latest npm version**
- Identifies if user is >1 minor version behind
- Shows breaking changes since installed version
- Recommends update path (major/minor/patch)

### 2. Framework Installation Integrity
- Critical files present (agents, commands, skills, hooks)
- File count validation (expected vs actual)
- Directory structure correctness
- Compilation status (dist/ exists and current)

### 3. Agent Configuration
- All 18 agents operational (8 core + 10 sub-agents)
- Agent definition validity (syntax, required fields)
- Auto-activation patterns configured
- Priority settings correct

### 4. MCP Server Connections
- 29 MCP tools accessible
- Server health status
- Connection latency (<100ms expected)
- Tool availability (Read, Write, Bash, etc.)

### 5. RAG Connectivity
- GraphRAG (Neo4j) connection status
- Vector store (Supabase) connection status
- RAG Router operational
- Pattern search service functional

### 6. Dependencies Health
- No critical security vulnerabilities
- Peer dependencies installed correctly
- Version compatibility (TypeScript, Node.js)
- Lock file integrity (package-lock.json)

### 7. Project Context Detection
- Correct context identified (FRAMEWORK_CONTEXT vs PROJECT_CONTEXT)
- Isolation boundaries enforced
- Context-specific configurations loaded
- No context mixing detected

## Output Format

```markdown
# 🔍 VERSATIL Coherence Check

## Overall Health: 94/100 ✅ (Excellent)

### Version Status
- **Installed**: v7.8.0
- **Latest**: v7.8.0
- **Status**: ✅ Up to date

### Installation Integrity: ✅ 100%
- Critical files: 1,247/1,247 present
- Directory structure: Valid
- Compilation: Current

### Agent Configuration: ✅ 100%
- Operational agents: 18/18
- Auto-activation: Configured
- Priority settings: Valid

### MCP Servers: ✅ 100%
- Tools accessible: 29/29
- Connection latency: 47ms (excellent)
- Server health: All operational

### RAG Connectivity: ⚠️ 85%
- GraphRAG: ❌ Connection timeout
- Vector store: ✅ Operational (52ms)
- RAG Router: ✅ Operational (fallback to vector)
- Pattern search: ✅ Operational

### Dependencies: ✅ 100%
- Security vulnerabilities: 0 critical, 0 high
- Peer dependencies: All installed
- Version compatibility: Valid

### Context Detection: ✅ 100%
- Current context: PROJECT_CONTEXT
- Isolation: Enforced
- Configuration: Loaded correctly

---

## Issues Detected (1)

### ⚠️ Medium - GraphRAG Connection Timeout
- **Impact**: Slower pattern search (fallback to vector store)
- **Root Cause**: Neo4j container not running or connection timeout
- **Recommendation**: Run `npm run rag:start` to restart GraphRAG
- **Auto-fix available**: Yes

---

## Recommendations

1. **Fix GraphRAG connection** - Run `npm run rag:start` (1 minute)
2. **Optional**: Update to v7.9.0 when available (no breaking changes expected)

---

## Quick Fixes Available

Run `/coherence --fix` to automatically:
- Restart GraphRAG connection
- Rebuild missing dist/ files
- Fix common configuration issues

**Estimated fix time**: 2-3 minutes
```

## Auto-Fix Capabilities

When run with `--fix` flag, automatically remediates:
- GraphRAG connection issues (restart container)
- Missing dist/ files (rebuild TypeScript)
- Outdated package-lock.json (npm install)
- Agent configuration syntax errors (apply defaults)

**Confidence threshold**: 90%+ confidence required for auto-fix (otherwise shows manual fix instructions)

## Integration with Guardian

- Uses Guardian's health monitoring infrastructure
- Shares health check logic with `/monitor` and `/assess`
- Logged to `~/.versatil/logs/coherence/coherence-check-*.log`
- Results stored for trend analysis

## Performance

- **Quick check**: <5 seconds
- **Full check**: <15 seconds
- **Auto-fix**: 2-3 minutes (depending on issues)
- **Overhead**: <50ms (in-memory checks)

## Related Commands

- `/assess` - Readiness assessment before work (includes version check)
- `/monitor` - Real-time framework monitoring (continuous health)
- `/guardian` - Guardian control and health management
- `versatil doctor` - CLI version (outside Claude sessions)

## Examples

### Check before starting work
```bash
/coherence
```

### Quick version check only
```bash
/coherence --quick
```

### Auto-fix detected issues
```bash
/coherence --fix
```

## Documentation

- **Complete Guide**: [docs/USER_COHERENCE_GUIDE.md](../../docs/USER_COHERENCE_GUIDE.md)
- **Troubleshooting**: [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md)
- **Guardian Integration**: [docs/GUARDIAN_INTEGRATION.md](../../docs/GUARDIAN_INTEGRATION.md)

## Implementation

**Handler**: `src/coherence/user-coherence-check.ts`
**CLI Version**: `bin/versatil-doctor.js`
**Guardian Module**: `src/agents/guardian/user-coherence-monitor.ts`

---

**Version**: 7.9.0
**Category**: Health & Validation
**Priority**: High (user-facing quality of life)
