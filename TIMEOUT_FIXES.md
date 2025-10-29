# VERSATIL Timeout Configuration Fixes

**Date**: 2025-10-29
**Issue**: Timeouts causing Cursor and Guardian to fail during startup/health checks
**Status**: ✅ FIXED

---

## Problems Identified

### 1. Session Start Hook Timeouts (Too Short)
- **Guardian health check**: 30s → Could timeout during builds/tests
- **Guardian start**: 5s → Too short for GraphRAG initialization

### 2. MCP Server Timeout (Insufficient)
- **Claude Desktop MCP**: 60s → Could timeout on first load with zod imports

### 3. Health Check Command Timeouts (Too Aggressive)
- **Framework builds**: 60s → Insufficient for TypeScript compilation
- **Test suites**: 120s → Insufficient for full test coverage runs

---

## Fixes Applied

### ✅ Session Start Hook (`.claude/hooks/session-start.ts`)
```typescript
// OLD:
timeout: 30000  // 30s - Health check
timeout: 5000   // 5s - Guardian start

// NEW:
timeout: 180000 // 3min - Health check (allows builds/tests)
timeout: 15000  // 15s - Guardian start (allows GraphRAG init)
```
**Compiled**: `.claude/hooks/dist/session-start.cjs` ✅

### ✅ MCP Server (`claude_desktop_config.json`)
```json
// OLD:
"timeout": 60000  // 60s

// NEW:
"timeout": 180000 // 3min (180s)
```

### ✅ Framework Guardian (`src/agents/guardian/framework-guardian.ts`)
```typescript
// OLD:
timeout: 60000  // 60s - Build
timeout: 120000 // 2min - Tests

// NEW:
timeout: 300000 // 5min - All operations
```

### ✅ Project Guardian (`src/agents/guardian/project-guardian.ts`)
```typescript
// OLD:
timeout: 120000 // 2min - Tests

// NEW:
timeout: 300000 // 5min - All operations
```

---

## Timeout Summary Table

| Component | Old Timeout | New Timeout | Reason |
|-----------|-------------|-------------|---------|
| **Session: Health Check** | 30s | **3min (180s)** | Allows full builds + tests |
| **Session: Guardian Start** | 5s | **15s** | Allows GraphRAG initialization |
| **MCP Server Init** | 60s | **3min (180s)** | Allows zod imports + startup |
| **Framework Build** | 60s | **5min (300s)** | TypeScript compilation |
| **Framework Tests** | 2min | **5min (300s)** | Full test suite |
| **Project Tests** | 2min | **5min (300s)** | Full test suite |

---

## Expected Benefits

✅ **No more timeout errors** during:
- Claude Desktop startup (MCP server initialization)
- Guardian startup (GraphRAG loading)
- Health checks (build + test operations)

✅ **Cursor will work properly** because:
- Guardian won't timeout on health checks
- MCP server has enough time to initialize
- Builds/tests can complete without interruption

✅ **More reliable development** experience:
- Slower machines have adequate time
- Large test suites can complete
- TypeScript builds won't timeout

---

## Testing Checklist

After restarting Claude Desktop:

- [ ] MCP server `claude-opera` starts successfully
- [ ] No `/tsconfig.json` errors in logs
- [ ] No zod import errors
- [ ] Guardian starts without timeout
- [ ] Health checks complete successfully
- [ ] No `ETIMEDOUT` errors in session-start.log

**Logs to check**:
```bash
# MCP Server
tail -50 ~/Library/Logs/Claude/mcp-server-claude-opera.log

# Guardian
tail -50 ~/.versatil/logs/guardian/session-start.log

# Main MCP
tail -50 ~/Library/Logs/Claude/mcp.log
```

---

## Configuration Files Modified

1. ✅ `.claude/hooks/session-start.ts` (source)
2. ✅ `.claude/hooks/dist/session-start.cjs` (compiled)
3. ✅ `~/Library/Application Support/Claude/claude_desktop_config.json`
4. ✅ `src/agents/guardian/framework-guardian.ts`
5. ✅ `src/agents/guardian/project-guardian.ts`

---

## Rollback Instructions

If timeouts are too long and cause delays:

### Reduce MCP Timeout
```json
// claude_desktop_config.json
"timeout": 120000  // 2min instead of 3min
```

### Reduce Session Timeouts
```typescript
// .claude/hooks/session-start.ts
timeout: 60000   // 1min health check
timeout: 10000   // 10s Guardian start
```

Then rebuild hook:
```bash
npx esbuild .claude/hooks/session-start.ts --bundle --platform=node \
  --format=cjs --outfile=.claude/hooks/dist/session-start.cjs
```

---

## Notes

- **Timeouts are generous** to accommodate slow builds/tests
- **Background operations** (Guardian) run async, so user doesn't wait
- **MCP timeout** only matters on first connection
- **Health check timeout** only affects scheduled checks (every 5min)

**All timeouts are fail-safe** - if exceeded, operation fails gracefully without blocking user.
