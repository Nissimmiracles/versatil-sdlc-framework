# VERSATIL MCP Module Integration Guide

## Overview
Your VERSATIL framework now has an MCP orchestration layer that can integrate external MCP servers as modules.

## Architecture
```
Claude/Cursor
    ↓
versatil-mcp.js (Entry Point)
    ↓
VERSATILMCPServerV2
    ↓
MCPModuleManager (New)
    ├→ Context7 MCP (Documentation)
    ├→ Filesystem MCP (File Operations)
    ├→ Enrichr MCP (Bioinformatics)
    ├→ PDF Tools MCP (PDF Manipulation)
    └→ Chrome Control MCP (Browser Automation)
```

## Integration Steps

### Step 1: Import MCPModuleManager in VERSATILMCPServerV2

Edit `dist/mcp/versatil-mcp-server-v2.js`:
```javascript
import { MCPModuleManager } from '../mcp/mcp-module-manager.js';

class VERSATILMCPServerV2 {
  constructor(config) {
    // ... existing code
    
    // Add MCP Module Manager
    this.mcpModules = new MCPModuleManager(config.projectPath);
  }

  async start() {
    // ... existing start code
    
    // Initialize MCP modules based on context
    const profile = this.determineProfile();
    await this.mcpModules.initializeProfile(profile);
    
    // ... rest of start code
  }

  determineProfile() {
    // Smart profile selection based on context
    if (this.contextIdentity?.role === 'developer') {
      return 'coding';
    } else if (this.contextIdentity?.role === 'researcher') {
      return 'research';
    }
    return 'coding'; // default
  }

  async handleToolCall(toolName, params) {
    // Try internal tools first
    if (this.internalTools.has(toolName)) {
      return await this.executeInternalTool(toolName, params);
    }
    
    // Route to external MCP modules
    return await this.mcpModules.routeToolCall(toolName, params);
  }
}
```

### Step 2: Configure Profiles

Edit `mcp-modules.config.json` to enable modules you need:

**For Coding (Cursor):**
```json
"coding": {
  "enabled_modules": ["context7", "filesystem"]
}
```

**For Research:**
```json
"research": {
  "enabled_modules": ["context7", "enrichr", "pdf-tools"]
}
```

### Step 3: Install MCP Server Dependencies
```bash
# Context7 (documentation)
npm install @context7/mcp

# Filesystem (already in your dependencies)
# Uses @modelcontextprotocol/server-filesystem via npx

# Optional: Install others as needed
# npm install enrichr-mcp-server
# npm install pdf-tools-mcp
# npm install chrome-control-mcp
```

### Step 4: Test Integration
```bash
# Test with coding profile (minimal)
node bin/versatil-mcp.js /Users/nissimmenashe/VERSATIL\ SDLC\ FW

# Check logs
tail -f ~/.versatil/mcp-server.log
```

## Usage Patterns

### Pattern 1: Context-Aware Loading
VERSATIL automatically loads appropriate MCP modules based on detected context.

### Pattern 2: Manual Profile Selection
Set via environment variable:
```bash
VERSATIL_MCP_PROFILE=research node bin/versatil-mcp.js
```

### Pattern 3: On-Demand Module Loading
```javascript
// Load module dynamically when needed
await mcpModules.loadModule('enrichr');
```

## Benefits

1. **Single MCP Connection**: Claude/Cursor connects to one server (VERSATIL)
2. **Resource Efficiency**: Lazy-load only needed modules
3. **Smart Routing**: Automatic tool routing based on patterns
4. **Unified Configuration**: All MCP settings in one place
5. **Profile-Based**: Different module sets for different tasks
6. **Isolation**: Each module runs independently

## Performance Tips

1. Keep `coding` profile minimal (context7 + filesystem only)
2. Use `lazy: true` for heavy modules
3. Enable full profile only when needed
4. Monitor `~/.versatil/mcp-server.log` for issues

## Troubleshooting

**Issue**: Module fails to load
- Check module is enabled in config
- Verify npm package is installed
- Check logs: `tail -f ~/.versatil/mcp-server.log`

**Issue**: Tool routing fails
- Verify routing rules in config
- Check tool name matches pattern
- Add explicit routing rule if needed

**Issue**: Memory/CPU high
- Reduce enabled modules in active profile
- Disable unused modules
- Use lazy loading
