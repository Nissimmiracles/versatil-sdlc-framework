# 🚀 VERSATIL Opera MCP Quick Start Guide

Get up and running with VERSATIL's Opera MCP in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- VERSATIL SDLC Framework v1.2.0+

## Quick Installation

```bash
# Clone the repository
git clone https://github.com/versatil/sdlc-fw.git
cd versatil-sdlc-fw

# Install dependencies
npm install

# Copy configuration
cp .env.example .env

# Start Opera MCP
npm run archon:start
```

## 🎯 Quick Examples

### 1. Create Your First Goal

```javascript
// Create a feature goal
const goal = await callMCPTool('archon_create_goal', {
  type: 'feature',
  description: 'Build user registration API',
  priority: 'high',
  criteria: [
    'Email validation',
    'Password strength check',
    'Database integration',
    'Unit tests'
  ]
});
```

### 2. Check for Updates

```javascript
// Check for updates
const updates = await callMCPTool('archon_check_updates', {
  channel: 'stable'
});

// Apply update if available
if (updates) {
  await callMCPTool('archon_apply_update', {
    version: updates.version,
    backup: true
  });
}
```

### 3. Analyze Your Project

```javascript
// Quick project analysis
const analysis = await callMCPTool('archon_analyze_project', {
  depth: 'basic'
});

console.log('Project type:', analysis.projectType);
console.log('Suggestions:', analysis.suggestions);
```

## 🔧 Basic Configuration

Edit `.env` file with your settings:

```env
# Essential settings
OPERA_MCP_PORT=3000
OPERA_AUTO_UPDATE=true
OPERA_UPDATE_CHANNEL=stable

# Optional: Enable MCP discovery
MCP_AUTO_DISCOVERY=true
```

## 📡 Using with Cursor/Claude

1. **Start the MCP server:**
   ```bash
   npm run archon:start
   ```

2. **In Cursor, configure MCP:**
   ```json
   {
     "mcp": {
       "servers": {
         "archon": {
           "command": "node",
           "args": ["init-opera-mcp.js"],
           "env": {}
         }
       }
     }
   }
   ```

3. **Use in your IDE:**
   - Type: `@archon create a new feature`
   - The AI will use Opera MCP tools automatically

## 🎮 Interactive Demo

Try the interactive demo to see all features:

```bash
npm run demo:opera-mcp
```

## 🛠️ Common Commands

```bash
# Start Opera MCP
npm run archon:start

# Check health status
npm run archon:health

# Check for updates
npm run archon:update

# Discover MCPs
npm run mcp:discover

# View MCP status
npm run mcp:status
```

## 📊 Monitoring

Access Opera resources:

```javascript
// View active goals
const goals = await readMCPResource('archon://goals');

// Check metrics
const metrics = await readMCPResource('archon://metrics');

// Review context
const context = await readMCPResource('archon://context');
```

## 🔍 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Use different port
OPERA_MCP_PORT=3001 npm run archon:start
```

### Updates failing
```bash
# Disable auto-update temporarily
OPERA_AUTO_UPDATE=false npm run archon:start

# Manual rollback
npm run archon:rollback -- --version=1.2.0
```

### MCP not discovered
```bash
# Force discovery
npm run mcp:discover -- --force

# Check discovery logs
tail -f .versatil/logs/mcp-discovery.log
```

## 🚀 Next Steps

1. **Explore Documentation**: Read [OPERA_MCP_DOCUMENTATION.md](./OPERA_MCP_DOCUMENTATION.md)
2. **Join Community**: [Discord Server](https://discord.gg/versatil)
3. **Watch Tutorial**: [YouTube - Opera MCP Setup](https://youtube.com/@versatil)
4. **Enterprise Support**: [enterprise@versatil.com](mailto:enterprise@versatil.com)

## 💡 Pro Tips

1. **Enable Learning Mode**: Set `OPERA_LEARNING_MODE=adaptive` for smarter orchestration
2. **Use Update Channels**: Stay on `stable` for production, try `beta` for new features
3. **Monitor Performance**: Check `archon://metrics` regularly
4. **Backup Strategy**: Keep `OPERA_MAX_BACKUPS=5` for safe rollbacks
5. **Integrate MCPs**: Let auto-discovery find tools for your stack

---

**Need help?** Open an issue on [GitHub](https://github.com/versatil/sdlc-fw) or contact support@versatil.com
