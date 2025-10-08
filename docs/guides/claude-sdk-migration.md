# Claude SDK Migration Guide

**Migration from `@anthropic-ai/claude-code` to `@anthropic-ai/claude-agent-sdk`**

---

## Overview

The Claude SDK package has been renamed from `@anthropic-ai/claude-code` to `@anthropic-ai/claude-agent-sdk`. This guide helps you migrate your code to use the new package.

---

## Installation

### Remove Old Package (if installed)
```bash
npm uninstall @anthropic-ai/claude-code
```

### Install New Package
```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Current Version in VERSATIL**: `@anthropic-ai/claude-agent-sdk@0.1.10` ✅

---

## Import Statement Migration

### Before (Old Package)
```typescript
import { query, tool, createSdkMcpServer } from "@anthropic-ai/claude-code";
```

### After (New Package)
```typescript
import {
  query,
  tool,
  createSdkMcpServer,
} from "@anthropic-ai/claude-agent-sdk";
```

---

## API Compatibility

The API remains **100% compatible**. All functions, types, and methods work identically:

### Available Exports

```typescript
// Query functions
import { query } from "@anthropic-ai/claude-agent-sdk";

// Tool creation
import { tool } from "@anthropic-ai/claude-agent-sdk";

// MCP server creation
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

// Full import
import * as ClaudeSDK from "@anthropic-ai/claude-agent-sdk";
```

---

## Migration Steps

### 1. Update Imports

**Find and Replace**:
- Find: `"@anthropic-ai/claude-code"`
- Replace: `"@anthropic-ai/claude-agent-sdk"`

### 2. Update package.json

```json
{
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.10"
  }
}
```

### 3. Reinstall Dependencies

```bash
npm install
```

### 4. Verify Build

```bash
npm run build
npm test
```

---

## Example Code Migration

### Query Example

**Before:**
```typescript
import { query } from "@anthropic-ai/claude-code";

const result = await query({
  model: "claude-3-5-sonnet-20241022",
  prompt: "Analyze this code",
  context: codeContext,
});
```

**After:**
```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const result = await query({
  model: "claude-3-5-sonnet-20241022",
  prompt: "Analyze this code",
  context: codeContext,
});
```

*Note: Only the import changed, the API is identical*

---

### Tool Definition Example

**Before:**
```typescript
import { tool } from "@anthropic-ai/claude-code";

const analyzeCodeTool = tool({
  name: "analyze_code",
  description: "Analyzes code quality and suggests improvements",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string" },
      language: { type: "string" },
    },
  },
  execute: async ({ code, language }) => {
    // Tool implementation
    return { analysis: "..." };
  },
});
```

**After:**
```typescript
import { tool } from "@anthropic-ai/claude-agent-sdk";

const analyzeCodeTool = tool({
  name: "analyze_code",
  description: "Analyzes code quality and suggests improvements",
  parameters: {
    type: "object",
    properties: {
      code: { type: "string" },
      language: { type: "string" },
    },
  },
  execute: async ({ code, language }) => {
    // Tool implementation
    return { analysis: "..." };
  },
});
```

*Note: Only the import changed, the tool definition is identical*

---

### MCP Server Example

**Before:**
```typescript
import { createSdkMcpServer } from "@anthropic-ai/claude-code";

const server = createSdkMcpServer({
  name: "versatil-mcp",
  version: "1.0.0",
  tools: [analyzeCodeTool, testGeneratorTool],
});

server.start();
```

**After:**
```typescript
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";

const server = createSdkMcpServer({
  name: "versatil-mcp",
  version: "1.0.0",
  tools: [analyzeCodeTool, testGeneratorTool],
});

server.start();
```

*Note: Only the import changed, the server creation is identical*

---

## TypeScript Types

All TypeScript types remain the same:

```typescript
import type {
  QueryOptions,
  ToolDefinition,
  MCPServerConfig,
  AgentContext,
} from "@anthropic-ai/claude-agent-sdk";
```

---

## Breaking Changes

**None!** The migration is a simple package rename with no API changes.

---

## Verification Checklist

After migration, verify:

- [ ] All imports updated to `@anthropic-ai/claude-agent-sdk`
- [ ] `npm install` completed successfully
- [ ] `npm run build` passes without errors
- [ ] `npm test` all tests passing
- [ ] TypeScript compilation successful
- [ ] No runtime errors in development
- [ ] MCP servers start correctly
- [ ] Tools execute as expected

---

## VERSATIL Framework Status

**Current Package**: `@anthropic-ai/claude-agent-sdk@0.1.10` ✅

**Installation Date**: 2025-10-08

**Commit**: 79ca223

**No migration needed** - VERSATIL already uses the correct package!

---

## Support

If you encounter issues during migration:

1. Check import statements match the new package name
2. Verify package.json has `@anthropic-ai/claude-agent-sdk`
3. Run `npm install` to ensure correct package is installed
4. Clear node_modules and reinstall if needed:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## Related Documentation

- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)
- [VERSATIL MCP Integration](../features/mcp-ecosystem.md)
- [Agent Development Guide](../agents/overview.md)

---

**Last Updated**: 2025-10-08
**Framework Version**: 5.1.0
