---
name: mcp-library
description: Model Context Protocol (MCP) integration for external tool access - Chrome browser automation, GitHub API, file system operations, database queries. Use when integrating MCP servers, implementing anti-hallucination verification via GitMCP, routing requests to appropriate servers, or handling MCP server failures gracefully.
tags: [mcp, protocol, servers, anti-hallucination, gitmcp]
---

# mcp/ - Model Context Protocol Integration

**Priority**: MEDIUM
**Agent(s)**: Oliver-MCP (primary owner)
**Last Updated**: 2025-10-26

## When to Use

- Integrating MCP (Model Context Protocol) servers
- Accessing external tools (Chrome, GitHub, Postgres, file system)
- Implementing anti-hallucination verification via GitMCP
- Routing requests to appropriate MCP servers
- Browser automation with Chrome MCP + Playwright
- Verifying AI-generated code references against ground truth
- Handling MCP server failures gracefully
- Configuring MCP server registry

## What This Library Provides

### Core Services
- **MCPServerRegistry**: Registers and manages MCP servers (Chrome, GitHub, Postgres, etc.)
- **MCPSelectionEngine**: Intelligently routes requests to appropriate server
- **AntiHallucinationDetector**: Verifies AI responses against ground truth (GitMCP)
- **GitMCPQueryGenerator**: Generates queries for codebase verification

### Key Features
- **Multiple Server Support**: Chrome, GitHub, Postgres, File System, Memory, Fetch
- **Anti-Hallucination**: Cross-check AI responses with GitMCP for code references
- **Intelligent Routing**: Strategy pattern for server selection
- **Graceful Degradation**: Fallback to local execution if MCP unavailable
- **Timeout Handling**: Configurable timeouts to prevent blocking

### File Structure
```
src/mcp/
├── mcp-server-registry.ts           # Central server registration
├── mcp-selection-engine.ts          # Intelligent routing
├── anti-hallucination-detector.ts   # GitMCP verification
├── gitmcp-query-generator.ts        # Query generation
└── types.ts                         # MCP types and interfaces
```

## Core Conventions

### DO ✓
- ✓ **Always verify with GitMCP** - Validate AI-generated code references
- ✓ **Register servers at startup** - Load MCP servers during framework init
- ✓ **Handle server failures gracefully** - MCP unavailable should not crash
- ✓ **Use Chrome MCP for browser testing** - Playwright integration via MCP
- ✓ **Set timeouts on requests** - Prevent infinite blocking

### DON'T ✗
- ✗ **Don't trust AI responses blindly** - Always verify file paths/function names
- ✗ **Don't skip error handling** - MCP servers can timeout/fail
- ✗ **Don't hardcode server URLs** - Use configuration files
- ✗ **Don't block on MCP calls** - Implement timeouts and fallbacks

## Quick Start Patterns

### Pattern 1: Verify Code Reference with GitMCP
```typescript
import { antiHallucinationDetector } from '@/mcp/anti-hallucination-detector.js';

// AI claims function exists at src/auth/jwt.ts:42
const claim = {
  file: 'src/auth/jwt.ts',
  line: 42,
  function: 'generateToken'
};

const verified = await antiHallucinationDetector.verify(claim);
if (verified.valid) {
  console.log('✅ Function exists at claimed location');
} else {
  console.log('❌ Hallucination detected:', verified.actual);
}
```

### Pattern 2: Use Chrome MCP for Browser Testing
```typescript
import { mcpClient } from '@/mcp/mcp-client.js';

// Take screenshot via Chrome MCP
try {
  const result = await mcpClient.request('chrome', {
    action: 'screenshot',
    url: 'http://localhost:3000',
    timeout: 5000
  });

  console.log('Screenshot saved:', result.path);
} catch (error) {
  console.warn('Chrome MCP unavailable, using Playwright directly');
  // Fallback to Playwright
}
```

### Pattern 3: Query GitHub API via MCP
```typescript
import { mcpClient } from '@/mcp/mcp-client.js';

// Get PR details via GitHub MCP
const pr = await mcpClient.request('github', {
  action: 'getPullRequest',
  owner: 'anthropics',
  repo: 'claude-code',
  prNumber: 123
});

console.log(`PR #${pr.number}: ${pr.title}`);
console.log(`Status: ${pr.state}, Mergeable: ${pr.mergeable}`);
```

## Important Gotchas

### Gotcha 1: MCP Server Not Running
**Problem**: MCP server unavailable causes timeouts and blocked requests

**Solution**: Check server status before requests, use timeouts + fallback
```typescript
// ✅ Good - Timeout + fallback
try {
  const result = await mcpClient.request('chrome', {
    action: 'screenshot',
    timeout: 5000 // 5 second timeout
  });
} catch (error) {
  console.warn('Chrome MCP unavailable, using Playwright directly');
  // Fallback to local Playwright execution
}
```

### Gotcha 2: GitMCP False Positives
**Problem**: GitMCP verification fails due to line number shifts (file edited since claim)

**Solution**: Use fuzzy matching with ±5 line tolerance
```typescript
// ✅ Good - Fuzzy line matching
const verified = await antiHallucinationDetector.verify(claim, {
  lineTolerance: 5, // Allow ±5 lines
  fuzzyMatch: true  // Match function name even if line shifted
});
```

### Gotcha 3: Hardcoded Server URLs
**Problem**: Server URLs change, code breaks in different environments

**Solution**: Use configuration files (.mcp/config.json)
```json
{
  "servers": {
    "chrome": "http://localhost:3001",
    "github": "http://localhost:3002",
    "postgres": "http://localhost:3003"
  }
}
```

## MCP Server Types

### Available Servers
- **chrome**: Browser automation (screenshots, clicks, navigation)
- **github**: GitHub API (PRs, issues, commits, files)
- **postgres**: Database queries (Supabase, PostgreSQL)
- **filesystem**: File operations (read, write, search)
- **memory**: Vector store queries (semantic search)
- **fetch**: HTTP requests (web scraping, API calls)

### Server Selection Strategy
```typescript
// Automatic routing based on action type
mcpClient.request('action', { /* params */ });

// Action → Server mapping:
// - 'screenshot' → chrome
// - 'getPullRequest' → github
// - 'query' → postgres
// - 'readFile' → filesystem
// - 'search' → memory
// - 'fetch' → fetch
```

## Anti-Hallucination Patterns

### Chain-of-Verification (CoVe) with GitMCP
1. **AI makes claim**: "Function `generateToken` is at src/auth/jwt.ts:42"
2. **GitMCP verification**: Query codebase for actual location
3. **Compare results**: Match or hallucination?
4. **Confidence score**: 0-100% based on evidence
5. **Proof log**: Store verification for audit trail

### Verification Confidence Levels
- **100%**: Exact match (file, line, function name all correct)
- **80-99%**: Fuzzy match (function exists, line ±5)
- **50-79%**: File exists, function name partial match
- **0-49%**: Hallucination (file missing or function not found)

## Related Documentation

For detailed MCP guides:
- [references/mcp-protocol.md](references/mcp-protocol.md) - MCP specification overview
- [references/server-registry.md](references/server-registry.md) - Server registration patterns
- [references/anti-hallucination.md](references/anti-hallucination.md) - GitMCP verification details

For MCP server implementations:
- [MCP Specification](https://modelcontextprotocol.io) - Official protocol docs
- [.claude/agents/oliver-mcp.md](../../.claude/agents/oliver-mcp.md) - Oliver-MCP agent
- [docs/CHROME_MCP.md](../../../docs/CHROME_MCP.md) - Chrome MCP integration

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/mcp/**`
