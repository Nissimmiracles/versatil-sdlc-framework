# 🚀 Using VERSATIL v1.2.0 in Cursor AI

## Quick Setup

### 1. **Install VERSATIL in Your Project**
```bash
# In your Cursor project directory
npm install versatil-sdlc-framework@latest

# Or link local development version
npm link /path/to/VERSATIL-SDLC-FW
```

### 2. **Create Cursor Rules File**
Create `.cursorrules` in your project root:

```yaml
# VERSATIL-Enhanced Cursor Rules
system_prompt: |
  You have access to the VERSATIL SDLC Framework v1.2.0 with:
  - Enhanced BMAD agents (Maria, Marcus, James, etc.)
  - RAG memory system for learning
  - Opera autonomous orchestrator
  - Introspective self-testing
  
  When I ask for code:
  1. First query VERSATIL memories for similar patterns
  2. Apply learned best practices
  3. Consider security (Sam) and architecture (Dan) perspectives
  4. Include comprehensive tests (Maria)
  5. Add monitoring capabilities

context_providers:
  - versatil_memories
  - project_patterns
  - agent_recommendations

tools:
  - versatil_memory_query
  - versatil_archon_goal
  - versatil_agent_activate
```

### 3. **Initialize VERSATIL in Project**
```bash
# Create VERSATIL configuration
mkdir .versatil
npx versatil-sdlc init

# Or manually create .versatil/config.json
```

```json
{
  "version": "1.2.0",
  "features": {
    "rag": { "enabled": true },
    "archon": { "enabled": true },
    "enhancedAgents": { "enabled": true },
    "introspection": { "enabled": true }
  },
  "cursor": {
    "autoActivateAgents": true,
    "memorySuggestions": true,
    "contextWindow": 5
  }
}
```

## Using VERSATIL Features in Cursor

### 1. **Activate Specific Agents**

In Cursor chat:
```
@maria Check this code for bugs and test coverage

@marcus Review this backend implementation

@sam Security audit this authentication flow

@dan Validate the architecture of this module
```

### 2. **Query VERSATIL Memory**

```
@versatil What patterns do we have for authentication?

@memory Show similar implementations of rate limiting

@rag Find all security best practices we've learned
```

### 3. **Set Autonomous Goals**

```
@archon Build a REST API for user management with:
- JWT authentication
- Rate limiting
- Full test coverage
- OpenAPI documentation

@goal Fix the memory leak in production (critical)
```

### 4. **Trigger Introspective Testing**

```
@introspect Check framework health

@test Run self-validation on this module

@health Show current system status
```

## Cursor Keyboard Shortcuts

Add to Cursor settings:
```json
{
  "keyboard.shortcuts": {
    "versatil.maria": "cmd+shift+m",
    "versatil.marcus": "cmd+shift+b", 
    "versatil.archon": "cmd+shift+a",
    "versatil.memory": "cmd+shift+r"
  }
}
```

## Real-World Workflows

### Workflow 1: Building New Feature
```bash
# 1. Set goal in Cursor terminal
npx versatil-sdlc goal "Build user profile feature with avatar upload"

# 2. Opera creates plan
# 3. Agents activate automatically
# 4. You see suggestions in Cursor as you code
# 5. Tests generated automatically
# 6. Deployment handled by DevOps-Dan
```

### Workflow 2: Debugging Production Issue
```bash
# 1. Report issue
@archon Production API timeout on /users endpoint

# 2. Opera coordinates:
#    - Maria analyzes logs
#    - Marcus checks code
#    - Dan reviews infrastructure
#    - Sam validates security wasn't compromised

# 3. Solution implemented autonomously
# 4. Pattern stored to prevent recurrence
```

### Workflow 3: Code Review Enhancement
```javascript
// Before writing code, ask:
@versatil Show best practices for this type of component

// While coding:
// - Real-time suggestions from agents
// - Memory-based pattern matching
// - Automatic error prevention

// After coding:
@maria Generate comprehensive tests
@sam Security review
@dan Architecture validation
```

## Cursor AI Integration Tips

### 1. **Context Management**
```javascript
// Add to cursor settings
{
  "versatil.context": {
    "includeMemories": true,
    "memoryDepth": 10,
    "agentSuggestions": true
  }
}
```

### 2. **Custom Commands**
Create `.cursor/commands.json`:
```json
{
  "commands": [
    {
      "name": "VERSATIL: Full Analysis",
      "command": "versatil.fullAnalysis",
      "when": "editorTextFocus"
    },
    {
      "name": "VERSATIL: Apply Memory Pattern",
      "command": "versatil.applyPattern",
      "when": "editorHasSelection"
    }
  ]
}
```

### 3. **Automated Workflows**
```javascript
// .cursor/workflows/versatil.js
module.exports = {
  onFileSave: async (file) => {
    // Activate appropriate agent
    const agent = getAgentForFile(file);
    const result = await versatil.activate(agent, file);
    
    // Show inline suggestions
    if (result.suggestions.length > 0) {
      cursor.showInlineSuggestions(result.suggestions);
    }
  },
  
  onCommit: async (files) => {
    // Run quality checks
    const results = await versatil.runQualityGates(files);
    return results.passed;
  }
};
```

## Best Practices

### 1. **Let Agents Learn**
- Every bug fixed is a pattern learned
- Every successful feature is a template stored
- Share learnings across projects

### 2. **Trust Autonomous Mode**
- Set high-level goals, not step-by-step tasks
- Let Opera handle orchestration
- Review and approve, don't micromanage

### 3. **Use Memory Effectively**
- Query before implementing
- Store successful patterns
- Learn from failures too

### 4. **Continuous Improvement**
- Run introspective tests regularly
- Review agent performance metrics
- Adjust confidence thresholds as needed

## Troubleshooting

### Issue: Agents not activating
```bash
# Check configuration
cat .versatil/config.json

# Test agent manually
npx versatil-sdlc agent-test enhanced-maria
```

### Issue: Memory not working
```bash
# Check memory store
ls -la .versatil/rag/vector-index/

# Test memory operations
npx versatil-sdlc memory-test
```

### Issue: Cursor not recognizing commands
```bash
# Reload Cursor window
# Check .cursorrules file
# Ensure VERSATIL is in node_modules
```

## Advanced Integration

### Custom Cursor Extension
```javascript
// Create cursor-versatil extension
const vscode = require('vscode');
const versatil = require('versatil-sdlc-framework');

function activate(context) {
  // Register VERSATIL commands
  context.subscriptions.push(
    vscode.commands.registerCommand('versatil.activate', async () => {
      const editor = vscode.window.activeTextEditor;
      const result = await versatil.analyzeFile(editor.document.fileName);
      // Show results in Cursor
    })
  );
}
```

---

## Quick Start Example

```bash
# 1. In your project
npm install versatil-sdlc-framework@latest

# 2. Initialize
npx versatil-sdlc init

# 3. In Cursor, type:
@archon Build a todo API with authentication

# 4. Watch the magic happen!
```

The framework will now enhance your Cursor AI experience with learning agents, memory, and autonomous development capabilities! 🚀
