# VERSATIL v1.2.0 - Opera MCP and Auto-Update

## Overview

The Opera Model Context Protocol (MCP) integration provides a standardized interface for interacting with the VERSATIL Opera orchestrator, enabling seamless integration with AI assistants, IDEs, and other MCP-compatible tools. The system includes automatic update capabilities to ensure you're always running the latest version.

## Key Features

### 1. Opera MCP Server

- **Standardized Interface**: Full MCP-compliant server exposing Opera functionality
- **Tool Suite**: Comprehensive tools for goal management, planning, and execution
- **Resource Access**: Direct access to Opera state, metrics, and context
- **Real-time Updates**: Live access to orchestration status and results

### 2. Automatic Updates

- **Self-Updating**: Automatically checks and applies updates
- **Multiple Channels**: Support for stable, beta, and dev update channels
- **Backup & Rollback**: Automatic backups before updates with rollback capability
- **Version Management**: Semantic versioning with compatibility checks

### 3. MCP Auto-Discovery

- **Intelligent Detection**: Automatically discovers and suggests relevant MCPs
- **Project Analysis**: Analyzes your project to recommend appropriate MCPs
- **Seamless Integration**: Auto-configures discovered MCPs for your project
- **Knowledge Base**: Stores MCP capabilities in RAG for future reference

## Installation

```bash
# Install VERSATIL with MCP support
npm install versatil-sdlc-fw@1.2.0

# Initialize with Opera MCP
node init-opera-mcp.js
```

## Configuration

Create a `.env` file with:

```bash
# Opera MCP Configuration
OPERA_MCP_PORT=3000
OPERA_UPDATE_CHANNEL=stable  # stable, beta, or dev
OPERA_AUTO_UPDATE=true
OPERA_UPDATE_INTERVAL=86400000  # 24 hours in milliseconds

# Optional: Custom update registry
OPERA_UPDATE_REGISTRY=https://registry.versatil.dev/mcp
```

## Usage

### Starting the Opera MCP Server

```javascript
const { versatilMCP } = require('./init-opera-mcp');

// Initialize VERSATIL with Opera MCP
await versatilMCP.initialize();

// The server is now running and ready for connections
```

### Using Opera MCP Tools

The following tools are available via MCP:

#### 1. Goal Management

```javascript
// Create a new goal
await mcp.call('archon_create_goal', {
  type: 'feature',
  description: 'Implement user authentication',
  priority: 'high',
  criteria: [
    'OAuth2 integration',
    'JWT token management',
    'Role-based access control'
  ]
});
```

#### 2. Project Analysis

```javascript
// Analyze project comprehensively
await mcp.call('archon_analyze_project', {
  depth: 'comprehensive'  // basic, detailed, or comprehensive
});
```

#### 3. Update Management

```javascript
// Check for updates
await mcp.call('archon_check_updates', {
  channel: 'stable'
});

// Apply an update
await mcp.call('archon_apply_update', {
  version: '1.2.1',
  backup: true
});

// Rollback if needed
await mcp.call('archon_rollback', {
  version: '1.2.0'
});
```

### Accessing Opera Resources

```javascript
// Get active goals
const goals = await mcp.read('archon://goals');

// View execution plans
const plans = await mcp.read('archon://plans');

// Check performance metrics
const metrics = await mcp.read('archon://metrics');

// Review environmental context
const context = await mcp.read('archon://context');

// View update history
const updates = await mcp.read('archon://updates');
```

## Auto-Update Process

### How It Works

1. **Scheduled Checks**: The system checks for updates at configured intervals
2. **Version Comparison**: Compares current version with available updates
3. **Compatibility Check**: Ensures update is compatible with your VERSATIL version
4. **Backup Creation**: Creates a backup of current installation
5. **Download & Verify**: Downloads update and verifies checksum
6. **Apply Update**: Installs the update and restarts services
7. **Rollback Ready**: Maintains backups for easy rollback if needed

### Update Channels

- **Stable**: Production-ready releases (recommended)
- **Beta**: Pre-release versions with new features
- **Dev**: Development builds (use with caution)

### Manual Update Control

```bash
# Check for updates manually
node test-opera-mcp.js --check-updates

# Apply specific version
node test-opera-mcp.js --apply-update 1.2.1

# Rollback to previous version
node test-opera-mcp.js --rollback 1.2.0
```

## MCP Auto-Discovery

### Discovered MCPs

The system automatically discovers and suggests MCPs based on your project:

1. **Development MCPs**
   - GitHub MCP (version control)
   - TypeScript MCP (language support)
   - ESLint MCP (code quality)

2. **Testing MCPs**
   - Jest MCP (unit testing)
   - Playwright MCP (e2e testing)
   - Chrome MCP (browser automation)

3. **Integration MCPs**
   - Supabase MCP (database)
   - n8n MCP (workflow automation)
   - Vercel MCP (deployment)

4. **Specialized MCPs**
   - BMAD MCP (methodology)
   - Cursor MCP (IDE integration)
   - Docker MCP (containerization)

### Discovery Process

```javascript
// Trigger manual MCP discovery
await mcp.call('mcp_discover', {
  scanDepth: 'comprehensive'
});

// Install recommended MCPs
await mcp.call('mcp_install_recommended', {
  category: 'testing'  // or 'development', 'integration', etc.
});
```

## Best Practices

### 1. Update Management

- Keep auto-update enabled for security and feature updates
- Use stable channel for production environments
- Test updates in development before production
- Maintain backup retention policy

### 2. MCP Integration

- Let auto-discovery find relevant MCPs
- Review and approve MCP suggestions before installation
- Keep MCP configurations in version control
- Document custom MCP configurations

### 3. Goal Orchestration

- Define clear acceptance criteria for goals
- Use appropriate priority levels
- Monitor execution plans and metrics
- Update context as project evolves

## Troubleshooting

### Common Issues

1. **Update Failures**
   ```bash
   # Check update logs
   cat .versatil/logs/opera-mcp-updates.log
   
   # Rollback to previous version
   node init-opera-mcp.js --rollback
   ```

2. **MCP Connection Issues**
   ```bash
   # Check server status
   curl http://localhost:3000/mcp/status
   
   # Restart MCP server
   node init-opera-mcp.js --restart
   ```

3. **Discovery Problems**
   ```bash
   # Clear MCP cache
   rm -rf .versatil/mcp/cache
   
   # Re-run discovery
   node test-opera-mcp.js --rediscover
   ```

## API Reference

### Opera MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `archon_create_goal` | Create new orchestration goal | type, description, priority, criteria |
| `archon_execute_plan` | Execute generated plan | planId, async |
| `archon_get_status` | Get current status | - |
| `archon_update_context` | Update environmental context | context |
| `archon_analyze_project` | Analyze project | depth |
| `archon_check_updates` | Check for updates | channel |
| `archon_apply_update` | Apply update | version, backup |
| `archon_rollback` | Rollback version | version |

### Opera MCP Resources

| URI | Description | Format |
|-----|-------------|--------|
| `archon://goals` | Active goals | JSON |
| `archon://plans` | Execution plans | JSON |
| `archon://metrics` | Performance metrics | JSON |
| `archon://context` | Environmental context | JSON |
| `archon://updates` | Update history | JSON |

## Security Considerations

1. **Update Verification**: All updates are checksum-verified
2. **Backup Encryption**: Backups can be encrypted (configure in .env)
3. **MCP Authentication**: Support for MCP auth tokens
4. **Secure Channels**: HTTPS for update downloads

## Roadmap

### Upcoming Features

- **v1.2.1**: Enhanced MCP discovery algorithms
- **v1.2.2**: Multi-tenant support for Opera MCP
- **v1.3.0**: AI-powered update recommendations
- **v1.4.0**: Distributed Opera orchestration

## Support

For issues or questions:
- GitHub: [VERSATIL Issues](https://github.com/versatil/sdlc-fw/issues)
- Docs: [Full Documentation](https://versatil.dev/docs)
- Discord: [VERSATIL Community](https://discord.gg/versatil)
