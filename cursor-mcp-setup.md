# VERSATIL MCP Setup for Cursor

## Current Status
- ✅ MCP Server: Production binary `bin/versatil-mcp.js`
- ✅ VS Code configuration: `.vscode/settings.json`
- ✅ Cursor configuration: `.cursor/settings.json` (cleaned)
- ✅ Framework integration: Complete OPERA agent system

## Recommended MCP Configuration

### Primary: VS Code Settings
The framework uses `.vscode/settings.json` for MCP server configuration:
```json
"mcp.servers": {
    "versatil-sdlc-framework": {
        "command": "node",
        "args": ["./bin/versatil-mcp.js", "${workspaceFolder}"],
        "cwd": "${workspaceFolder}",
        "env": {
            "NODE_ENV": "production",
            "VERSATIL_MCP_MODE": "true"
        }
    }
}
```

### Alternative: Claude Desktop Configuration
For use with Claude Desktop:
```json
{
    "mcpServers": {
        "versatil-sdlc-framework": {
            "command": "node",
            "args": ["./bin/versatil-mcp.js", "."],
            "cwd": "/Users/nissimmenashe/VERSATIL SDLC FW"
        }
    }
}
```

## Available MCP Tools

1. **versatil_activate_agent** - Activate specific OPERA agents
2. **versatil_orchestrate_sdlc** - Manage SDLC phases
3. **versatil_quality_gate** - Execute quality checks
4. **versatil_framework_status** - Get framework status

## Testing MCP Server

Test the production MCP server:
```bash
cd "/Users/nissimmenashe/VERSATIL SDLC FW"
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node bin/versatil-mcp.js .
```

## Available OPERA Agents via MCP

The production server provides access to all OPERA agents:
- **enhanced-maria**: Quality assurance and testing
- **enhanced-james**: Frontend development and UI
- **enhanced-marcus**: Backend architecture and APIs
- **devops-dan**: Deployment and infrastructure
- **security-sam**: Security analysis and compliance
- **architecture-dan**: System design and patterns

## Usage Instructions

1. **Restart IDE** - Essential for MCP settings to take effect
2. **Verify Connection** - Check MCP server status in IDE
3. **Activate Agents** - Use MCP tools to activate specific agents
4. **Test Tools** - Try `versatil_activate_agent` with different agents

## MCP Tool Examples

```json
// Activate Enhanced Maria for testing
{
    "tool": "versatil_activate_agent",
    "agentId": "enhanced-maria",
    "context": "Review test coverage for authentication module"
}

// Get framework status
{
    "tool": "versatil_framework_status"
}
```