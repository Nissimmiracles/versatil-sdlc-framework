# mcp/ - Model Context Protocol Integration

**Priority**: HIGH
**Agent(s)**: Oliver-MCP (primary owner)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Integrates MCP (Model Context Protocol) servers for external tool access - Chrome browser automation, GitHub API, file system operations, database queries. Provides anti-hallucination patterns via GitMCP verification and intelligent server selection.

## 🎯 Core Concepts

### Key Abstractions
- **MCPServerRegistry**: Registers and manages MCP servers (Chrome, GitHub, Postgres, etc.)
- **MCPSelectionEngine**: Intelligently routes requests to appropriate server
- **AntiHallucinationDetector**: Verifies AI responses against ground truth (GitMCP)
- **GitMCPQueryGenerator**: Generates queries for codebase verification

### Design Patterns
- **Registry Pattern**: Central MCP server registration
- **Strategy Pattern**: Different servers for different tool types
- **Verification Pattern**: Cross-check AI responses with GitMCP

## ✅ Development Rules

### DO ✓
- ✓ **Always verify with GitMCP** - validate AI-generated code references
- ✓ **Register servers at startup** - load MCP servers during framework init
- ✓ **Handle server failures gracefully** - MCP server unavailable should not crash
- ✓ **Use Chrome MCP for browser testing** - Playwright integration via MCP

### DON'T ✗
- ✗ **Don't trust AI responses blindly** - always verify file paths/function names
- ✗ **Don't skip error handling** - MCP servers can timeout/fail
- ✗ **Don't hardcode server URLs** - use configuration files

## 🔧 Common Patterns

### Pattern: Verify Code Reference with GitMCP
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

## ⚠️ Gotchas

### Gotcha: MCP Server Not Running
**Problem**: MCP server unavailable causes timeouts
**Solution**: Check server status before requests, fallback to local execution

```typescript
// ❌ Bad - Blocks forever if server down
const result = await mcpClient.request('chrome', { action: 'screenshot' });

// ✅ Good - Timeout + fallback
try {
  const result = await mcpClient.request('chrome', { action: 'screenshot', timeout: 5000 });
} catch (error) {
  console.warn('Chrome MCP unavailable, using Playwright directly');
  // Fallback logic
}
```

## 📚 Related Documentation
- [MCP Specification](https://modelcontextprotocol.io)
- [Oliver-MCP Agent](../agents/mcp/)
- [Chrome MCP Integration](../../docs/CHROME_MCP.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('mcp')`
