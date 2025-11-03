# Claude Official Documentation via MCP

## Overview

VERSATIL integrates Claude's official documentation through multiple channels for comprehensive access to Memory Tool, Context Editing, and other Claude features.

---

## 📚 Documentation Sources

### 1. Local Clone (Offline Access) ✅

**Location**: `~/.versatil/docs/claude-cookbooks/`

**Contents**:
- Memory Tool implementation guide (`tool_use/memory_cookbook.ipynb`)
- Memory Tool Python reference (`tool_use/memory_tool.py`)
- Memory Tool tests (`tool_use/tests/test_memory_tool.py`)
- Extended thinking examples (`extended_thinking/`)
- Claude Code SDK examples (`claude_code_sdk/`)
- Multimodal capabilities (`capabilities/`)

**Access**:
```bash
# View Memory Tool cookbook
cat ~/.versatil/docs/claude-cookbooks/tool_use/memory_cookbook.ipynb

# Browse all tool_use examples
ls ~/.versatil/docs/claude-cookbooks/tool_use/

# View README for cookbook overview
cat ~/.versatil/docs/claude-cookbooks/README.md
```

**Update**:
```bash
# Pull latest changes
cd ~/.versatil/docs/claude-cookbooks/ && git pull
```

---

### 2. GitHub MCP (Real-Time Access)

**Repository**: `anthropics/claude-cookbooks`

**Access via GitHub MCP**:
```typescript
// Use GitHub MCP to fetch specific files
github.getFile({
  owner: 'anthropics',
  repo: 'claude-cookbooks',
  path: 'tool_use/memory_cookbook.ipynb'
});

// Search for specific topics
github.search({
  q: 'memory tool in:file repo:anthropics/claude-cookbooks',
  type: 'code'
});
```

**Configuration**: Already configured in `.cursor/mcp_config.json` under `github` server.

---

### 3. WebFetch (Official Docs)

**Official Documentation URLs**:

#### Memory Tool
```
https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool
```

**Topics Covered**:
- Memory Tool overview and purpose
- Supported operations (view, create, str_replace, insert, delete, rename)
- Security considerations
- Best practices
- Integration examples

#### Context Editing
```
https://docs.claude.com/en/docs/build-with-claude/context-editing
```

**Topics Covered**:
- Context management beta
- Clearing tool results automatically
- Token thresholds and configuration
- Integration with Memory Tool
- Long-running workflow support

#### Agent SDK
```
https://docs.claude.com/en/docs/build-with-claude/agents
```

**Topics Covered**:
- Agent definition structure
- Tool integration
- Sub-agent patterns
- Workflow orchestration

**Access via WebFetch**:
```typescript
// Fetch latest Memory Tool docs
WebFetch({
  url: 'https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool',
  prompt: 'Extract all implementation details and best practices'
});

// Fetch Context Editing docs
WebFetch({
  url: 'https://docs.claude.com/en/docs/build-with-claude/context-editing',
  prompt: 'Extract configuration options and usage patterns'
});
```

---

## 🎯 Quick Reference

### Memory Tool Implementation

**Key Files in Cookbooks**:
```
tool_use/memory_cookbook.ipynb    # Complete implementation guide
tool_use/memory_tool.py            # Python reference implementation
tool_use/memory_demo/              # Demo examples
tool_use/tests/test_memory_tool.py # Test examples
```

**VERSATIL Implementation**:
```
src/memory/memory-tool-handler.ts  # Handler operations
src/memory/memory-tool-config.ts   # Configuration
src/agents/sdk/context-aware-agent.ts # Agent integration
~/.versatil/memories/              # Agent memory directories
```

**Documentation Flow**:
1. **Research**: WebFetch official docs for latest info
2. **Reference**: Check cookbooks for code examples
3. **Implement**: Apply to VERSATIL with isolation patterns
4. **Store**: Codify learnings to `~/.versatil/memories/`

---

### Context Editing Integration

**Official Documentation**:
- Context editing beta: `context-management-2025-06-27`
- Trigger: 100k input tokens (configurable)
- Keep: Last 3 tool uses (configurable)
- Clear at least: 5k tokens (configurable)

**VERSATIL Configuration**:
```typescript
// src/memory/memory-tool-config.ts
export const MEMORY_TOOL_CONFIG = {
  beta: 'context-management-2025-06-27',
  contextManagement: {
    edits: [{
      type: 'clear_tool_uses_20250919',
      trigger: { type: 'input_tokens', value: 100000 },
      keep: { type: 'tool_uses', value: 3 },
      clearAtLeast: { type: 'input_tokens', value: 5000 }
    }]
  },
  excludeTools: ['memory', 'Read', 'Write', 'TodoWrite', 'Edit', 'Bash']
};
```

---

## 🔍 Search Examples

### Find Memory Tool Examples

**In Cookbooks**:
```bash
# Search for memory tool usage
grep -r "memory tool" ~/.versatil/docs/claude-cookbooks/

# Find all tool_use examples
ls ~/.versatil/docs/claude-cookbooks/tool_use/

# View specific cookbook
jupyter notebook ~/.versatil/docs/claude-cookbooks/tool_use/memory_cookbook.ipynb
```

**Via GitHub MCP**:
```typescript
// Search for memory patterns
github.search({
  q: 'memory.view OR memory.create in:file repo:anthropics/claude-cookbooks',
  type: 'code'
});
```

---

## 📖 Learning Workflow

### When Implementing Claude Features

**Step 1: Research Official Docs**
```typescript
// Fetch latest documentation
WebFetch('https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool');
```

**Step 2: Review Cookbook Examples**
```bash
# Check local cookbooks for code examples
cat ~/.versatil/docs/claude-cookbooks/tool_use/memory_tool.py
```

**Step 3: Check VERSATIL Memories**
```bash
# See if pattern already exists in agent memories
cat ~/.versatil/memories/maria-qa/test-patterns.md
cat ~/.versatil/memories/james-frontend/component-patterns.md
```

**Step 4: Implement with VERSATIL Patterns**
```typescript
// Apply isolation principles
// Store in ~/.versatil/ not in user projects
// Use agent-specific memory directories
```

**Step 5: Codify Learnings**
```bash
# After implementation, run /learn
/learn "Memory Tool implementation - Phase 1"
```

---

## 🔄 Integration with VERSATIL Agents

### Agent Documentation Access Pattern

**All agents follow this workflow**:

1. **Check Memories First**
   ```typescript
   // Agent reads from personal memory directory
   const patterns = await agentMemory.view('patterns.md');
   ```

2. **Fetch Fresh Docs If Needed**
   ```typescript
   // If pattern not found or outdated, fetch latest
   const docs = await WebFetch('https://docs.claude.com/...');
   ```

3. **Apply Pattern**
   ```typescript
   // Use pattern in current implementation
   ```

4. **Update Memories**
   ```typescript
   // Store successful pattern for future use
   await agentMemory.storePattern({ ... });
   ```

---

## 📊 Documentation Metrics

### Cookbook Statistics
- **Repository**: `anthropics/claude-cookbooks`
- **Language**: Primarily Jupyter Notebook (98.4%)
- **License**: MIT
- **Topics**: Tool use, multimodal, finetuning, extended thinking

### Local Cache
- **Location**: `~/.versatil/docs/claude-cookbooks/`
- **Size**: ~10MB (varies)
- **Update Frequency**: Pull when starting new Claude feature work
- **Offline Access**: ✅ Full offline access after clone

### Agent Memories
- **Location**: `~/.versatil/memories/[agent-id]/`
- **Purpose**: Store learned patterns, not raw docs
- **Retention**: Permanent (patterns never expire, docs cache 7 days)

---

## 🛠️ Maintenance

### Update Local Cookbooks

**Frequency**: Before starting new Claude feature implementation

```bash
# Update to latest
cd ~/.versatil/docs/claude-cookbooks/
git pull origin main

# Check for new notebooks
ls -la tool_use/
ls -la capabilities/
```

### Clear Doc Cache

**When**: After major Claude updates or new feature releases

```bash
# Remove cached documentation (not patterns!)
rm ~/.versatil/memories/*/docs-cache-*.md

# Or use npm script
pnpm run memory:cleanup
```

### Verify MCP Access

**Test GitHub MCP**:
```bash
gh repo view anthropics/claude-cookbooks
```

**Test WebFetch**:
```bash
# Use WebFetch tool in Claude conversation
# WebFetch('https://docs.claude.com/en/docs/agents-and-tools/tool-use/memory-tool')
```

---

## 📚 Additional Resources

### Official Claude Documentation
- Main docs: https://docs.claude.com/
- API reference: https://docs.claude.com/en/api
- Agent SDK: https://docs.claude.com/en/docs/build-with-claude/agents
- Tool use: https://docs.claude.com/en/docs/agents-and-tools/tool-use

### Claude Cookbooks
- GitHub: https://github.com/anthropics/claude-cookbooks
- Local: `~/.versatil/docs/claude-cookbooks/`
- README: `~/.versatil/docs/claude-cookbooks/README.md`

### VERSATIL Implementation
- Memory Tool integration: `docs/enhancements/MEMORY_TOOL_INTEGRATION.md`
- Agent definitions: `src/agents/sdk/agent-definitions.ts`
- Memory config: `src/memory/memory-tool-config.ts`
- Agent memories: `~/.versatil/memories/`

---

## ✅ Quick Checklist

Before implementing new Claude features:

- [ ] Update local cookbooks: `cd ~/.versatil/docs/claude-cookbooks/ && git pull`
- [ ] Fetch latest official docs via WebFetch
- [ ] Check agent memories for existing patterns
- [ ] Review cookbook examples for code reference
- [ ] Implement with VERSATIL isolation patterns
- [ ] Run `/learn` to codify new patterns
- [ ] Update agent memories with successful approaches

---

**Last Updated**: October 18, 2025
**Maintained By**: VERSATIL Core Team
**Documentation Version**: 1.0.0

**See Also**:
- [Memory Tool Integration](../enhancements/MEMORY_TOOL_INTEGRATION.md)
- [Agent Definitions](../../src/agents/sdk/agent-definitions.ts)
- [CLAUDE.md](../../CLAUDE.md)
