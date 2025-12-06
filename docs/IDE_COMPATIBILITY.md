# VERSATIL Framework - IDE Compatibility Guide

**Version**: 7.16.2
**Last Updated**: 2024-12-04

---

## IDE Compatibility Matrix

| IDE/Tool | Integration Method | Status | Features Available |
|----------|-------------------|--------|-------------------|
| **Claude Code CLI** | Native SDK | ✅ Full Support | All features |
| **Cursor IDE** | Daemon + Settings | ✅ Full Support | All features |
| **VS Code** | Extension + MCP | 🔶 Partial | Commands, Skills |
| **Windsurf** | API/Extension | 🔶 Partial | Commands via API |
| **Replit** | AI Agent API | 🔶 Partial | Core agents only |
| **GitHub Codespaces** | Claude CLI | ✅ Full Support | All features |
| **JetBrains IDEs** | Plugin + API | 🟡 Planned | TBD |
| **Neovim** | LSP + CLI | 🔶 Partial | CLI-based |
| **Zed** | Extension | 🟡 Planned | TBD |

---

## Integration Methods

### 1. Claude Code CLI (Native) - FULL SUPPORT

**How it works**: Native Claude Agent SDK integration with hooks and settings.

**Configuration**:
```
.claude/
├── settings.json     # Hook configuration
├── hooks/            # TypeScript hooks
├── agents/           # Agent definitions
├── commands/         # Slash commands
└── skills/           # Specialized skills
```

**Features**:
- ✅ All 12 primary agents
- ✅ All 10 sub-agents
- ✅ 78 skills
- ✅ 34 slash commands
- ✅ Hooks (SessionStart, UserPromptSubmit, PostToolUse, etc.)
- ✅ RAG pattern learning
- ✅ Quality gates enforcement
- ✅ Multi-agent orchestration

**Setup**:
```bash
# Already configured - just run Claude Code in the project directory
cd your-project
claude
```

---

### 2. Cursor IDE - FULL SUPPORT

**How it works**: Daemon-based file watching + IDE integration.

**Configuration**:
```
.cursor/
├── settings.json     # Proactive agent triggers
├── mcp_config.json   # MCP servers
└── commands/         # Cursor-specific commands
```

**Features**:
- ✅ All agents via proactive triggers
- ✅ File-based auto-activation
- ✅ Background monitoring
- ✅ Inline suggestions
- ✅ Statusline updates

**Setup**:
1. Open project in Cursor
2. Enable AI features
3. Framework auto-detects via `.cursor/settings.json`

---

### 3. VS Code - PARTIAL SUPPORT

**Integration Options**:

#### Option A: Claude Extension + MCP
```json
// .vscode/settings.json
{
  "claude.mcpServers": {
    "versatil": {
      "command": "npx",
      "args": ["tsx", ".claude/mcp/versatil-server.ts"],
      "env": {
        "VERSATIL_PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

#### Option B: Tasks + Terminal Integration
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "VERSATIL: Run Maria-QA",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "/maria-qa ${input:task}"],
      "problemMatcher": []
    },
    {
      "label": "VERSATIL: Plan Feature",
      "type": "shell",
      "command": "claude",
      "args": ["-p", "/plan ${input:feature}"],
      "problemMatcher": []
    }
  ],
  "inputs": [
    {
      "id": "task",
      "type": "promptString",
      "description": "Task for Maria-QA"
    },
    {
      "id": "feature",
      "type": "promptString",
      "description": "Feature to plan"
    }
  ]
}
```

**Features Available**:
- ✅ Slash commands (via terminal/tasks)
- ✅ Skills (via MCP)
- 🔶 Agents (manual invocation)
- ❌ Auto-activation (no daemon)
- ❌ Hooks (not supported)
- ❌ Proactive suggestions

---

### 4. Windsurf (Codeium) - PARTIAL SUPPORT

**Integration Method**: API-based custom AI backend

**Configuration**:
```javascript
// windsurf.config.js
module.exports = {
  ai: {
    provider: 'custom',
    endpoint: 'https://api.versatil.dev/v1/assist',
    headers: {
      'Authorization': 'Bearer ${VERSATIL_API_KEY}'
    }
  }
};
```

**Features Available**:
- ✅ Agent invocation via API
- ✅ Pattern matching
- 🔶 Limited context (no full project awareness)
- ❌ Hooks
- ❌ File-based triggers

**Integration Steps**:
1. Deploy VERSATIL API (Cloud Run on your GCP)
2. Configure Windsurf to use custom AI endpoint
3. Agent keywords trigger via API

---

### 5. Replit - PARTIAL SUPPORT

**Integration Method**: Replit AI Agent API + Secrets

**Configuration**:
```bash
# .replit secrets
VERSATIL_API_KEY=your-api-key
CLAUDE_API_KEY=your-claude-key
```

```python
# .replit/ai_config.py
AI_CONFIG = {
    "custom_instructions": """
    You are using VERSATIL SDLC Framework.
    Available agents: Maria-QA, James-Frontend, Marcus-Backend, Dana-Database, Dr.AI-ML

    When user asks about testing, invoke: /maria-qa [task]
    When user asks about frontend, invoke: /james-frontend [task]
    When user asks about backend, invoke: /marcus-backend [task]
    """
}
```

**Features Available**:
- ✅ Agent keywords (via instructions)
- ✅ Slash commands (if supported)
- 🔶 Skills (limited)
- ❌ Hooks
- ❌ Full orchestration

---

### 6. GitHub Codespaces - FULL SUPPORT

**How it works**: Claude Code CLI runs in Codespace terminal.

**Configuration**:
```json
// .devcontainer/devcontainer.json
{
  "name": "VERSATIL SDLC",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:18",
  "postCreateCommand": "npm install && npm run setup:versatil",
  "customizations": {
    "vscode": {
      "extensions": [
        "anthropic.claude-code"
      ]
    }
  },
  "secrets": {
    "ANTHROPIC_API_KEY": {
      "description": "Claude API key for VERSATIL agents"
    }
  }
}
```

**Features**:
- ✅ All features (same as local Claude Code CLI)
- ✅ Cloud-based development
- ✅ Team collaboration

---

### 7. JetBrains IDEs (IntelliJ, WebStorm, PyCharm) - PLANNED

**Planned Integration**: Plugin + Terminal

**Status**: 🟡 In Development

**Planned Features**:
- Plugin for agent invocation
- Terminal integration for CLI
- Inspection integration for quality gates

---

### 8. Neovim - PARTIAL SUPPORT

**Integration Method**: Claude CLI + Custom commands

```lua
-- lua/versatil.lua
local M = {}

function M.invoke_agent(agent, task)
  local cmd = string.format('claude -p "/%s %s"', agent, task)
  vim.fn.system(cmd)
end

-- Keybindings
vim.keymap.set('n', '<leader>vq', function()
  M.invoke_agent('maria-qa', vim.fn.input('QA Task: '))
end)

vim.keymap.set('n', '<leader>vf', function()
  M.invoke_agent('james-frontend', vim.fn.input('Frontend Task: '))
end)

vim.keymap.set('n', '<leader>vb', function()
  M.invoke_agent('marcus-backend', vim.fn.input('Backend Task: '))
end)

return M
```

**Features Available**:
- ✅ CLI-based agent invocation
- ✅ Slash commands
- ❌ Auto-activation
- ❌ Inline suggestions

---

## API Integration (Universal)

For any IDE/tool that supports custom AI backends, use the VERSATIL API:

### API Endpoint Structure

```typescript
// POST /v1/contextual-assist
interface VERSATILRequest {
  // User query
  query: string;

  // Code context
  context: {
    language: string;
    framework?: string;
    currentFile?: string;
    selectedCode?: string;
    projectStructure?: string[];
  };

  // Platform info
  platform: 'vscode' | 'windsurf' | 'replit' | 'neovim' | 'other';

  // User preferences
  preferences?: {
    verbosity?: 'concise' | 'detailed';
    includeTests?: boolean;
  };
}

interface VERSATILResponse {
  answer: string;
  code?: string;
  agent_used: string;
  pattern?: {
    name: string;
    confidence: number;
  };
  suggestions?: string[];
}
```

### Deploy API (Cloud Run)

```bash
# Deploy to your GCP project
cd infrastructure/api
gcloud run deploy versatil-api \
  --source . \
  --region us-central1 \
  --project centering-vine-454613-b3 \
  --allow-unauthenticated
```

---

## Feature Comparison by IDE

| Feature | Claude Code | Cursor | VS Code | Windsurf | Replit | Codespaces |
|---------|-------------|--------|---------|----------|--------|------------|
| **Primary Agents** | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 | ✅ 12 |
| **Sub-Agents** | ✅ 10 | ✅ 10 | 🔶 Manual | 🔶 API | ❌ | ✅ 10 |
| **Skills** | ✅ 78 | ✅ 78 | 🔶 MCP | 🔶 API | ❌ | ✅ 78 |
| **Slash Commands** | ✅ 34 | ✅ 34 | ✅ Tasks | 🔶 API | 🔶 | ✅ 34 |
| **Auto-Activation** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Hooks** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **RAG Learning** | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Quality Gates** | ✅ | ✅ | 🔶 | 🔶 | ❌ | ✅ |
| **Multi-Agent** | ✅ | ✅ | 🔶 | 🔶 | ❌ | ✅ |

---

## Recommended Setup by Use Case

### Individual Developer
1. **Primary**: Claude Code CLI or Cursor
2. **Fallback**: VS Code with tasks

### Team Development
1. **Primary**: GitHub Codespaces (consistency)
2. **Alternative**: Cursor with shared settings

### Enterprise/Custom
1. **Deploy**: VERSATIL API on GCP/AWS
2. **Integrate**: Any IDE via API

### Quick Prototyping
1. **Use**: Replit with custom instructions
2. **Limitation**: Manual agent invocation

---

## Migration Guides

### From Cursor to Claude Code CLI
1. Copy `.cursor/commands/` to `.claude/commands/`
2. Settings already compatible
3. Run `claude` in terminal

### From VS Code to Claude Code CLI
1. Install Claude Code CLI
2. Configure `.claude/settings.json`
3. Use terminal or VS Code tasks

### Adding VERSATIL to Existing Project
```bash
# Initialize VERSATIL in any project
npx @versatil/init
# or
git clone https://github.com/versatil/framework .versatil-setup
cp -r .versatil-setup/.claude .
```

---

## Troubleshooting

### Issue: Agents not auto-activating
**Solution**: Ensure CLAUDE.md exists and contains trigger rules

### Issue: Hooks not running
**Solution**: Check `.claude/settings.json` hook paths and permissions

### Issue: Skills not loading
**Solution**: Verify skill exists in `.claude/skills/` with SKILL.md

### Issue: API integration failing
**Solution**: Check API key and endpoint configuration

---

## Roadmap

### Q1 2025
- [ ] VS Code extension (native)
- [ ] JetBrains plugin
- [ ] Zed integration

### Q2 2025
- [ ] Windsurf native integration
- [ ] Replit AI Agent API support
- [ ] Web-based VERSATIL dashboard

---

**Questions?** Run `/help` in Claude Code or Cursor for assistance.
