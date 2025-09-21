# VERSATIL MCP Setup for Cursor

## Current Status
- ✅ MCP Server created: `versatil-mcp-server.js`
- ✅ Claude Desktop configured
- ⚠️ Cursor MCP integration needs verification

## Cursor MCP Integration Options

### Option 1: VS Code Extension Approach
Cursor might use VS Code extensions for MCP integration. Check if there's an MCP extension.

### Option 2: Settings Configuration
Added MCP server config to Cursor settings.json:
```json
"mcp.servers": {
    "versatil-sdlc-framework": {
        "command": "node",
        "args": ["/Users/nissimmenashe/VERSATIL SDLC FW/versatil-mcp-server.js"],
        "cwd": "/Users/nissimmenashe/VERSATIL SDLC FW",
        "env": {
            "NODE_ENV": "production",
            "VERSATIL_MCP_MODE": "true"
        }
    }
}
```

### Option 3: Workspace Configuration
Create workspace-specific MCP configuration in `.vscode/settings.json`

### Option 4: Continue Extension Integration
Since you have Continue extension, check if it supports MCP integration.

## Available MCP Tools

1. **versatil_activate_agent** - Activate specific BMAD agents
2. **versatil_orchestrate_sdlc** - Manage SDLC phases
3. **versatil_quality_gate** - Execute quality checks
4. **versatil_framework_status** - Get framework status

## Testing MCP Server

You can test the MCP server directly:
```bash
cd "/Users/nissimmenashe/VERSATIL SDLC FW"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node versatil-mcp-server.js
```

## Next Steps

1. **Restart Cursor** - Essential for settings to take effect
2. **Check Command Palette** - Look for MCP or VERSATIL commands
3. **Verify in Chat** - Try asking about VERSATIL tools
4. **Alternative**: Use Claude Desktop which is already configured

## Manual Activation (Alternative)

If MCP doesn't work in Cursor yet, you can manually activate agents by asking:
- "Activate Enhanced Maria for code review"
- "Run VERSATIL quality gates"
- "Get framework status"

The agents will respond with contextual analysis based on your project type.