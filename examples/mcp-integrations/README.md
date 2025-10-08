# Community MCP Integration Examples
## Ant Design MCP Server Integration for VERSATIL Framework

**Production-Tested**: VERSSAI Enterprise VC Platform
**Part of**: VERSATIL Framework v5.3.0

---

## 📋 Quick Start

### 1. Install Ant Design MCP Server

Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "antd-components": {
      "command": "/opt/homebrew/bin/npx",
      "args": ["@jzone-mcp/antd-components-mcp"],
      "env": { "NODE_ENV": "production" },
      "disabled": false
    }
  }
}
```

###  2. Restart Claude Desktop

```bash
killall "Claude" && open -a "Claude"
```

### 3. Run Health Check

```bash
node ../../tools/mcp/community-mcp-health-monitor.cjs
```

Expected output:
```
✅ antd-components is healthy (500-1000ms)
Success Rate: 100.00%
```

---

## 📁 Examples

### **`antd-mcp-example.ts`**
Basic Ant Design MCP integration with health monitoring

### **`mcp-config.json`**
Configuration template for multiple community MCP servers

### **`package.json.template`**
NPM scripts for MCP health monitoring

---

## 🔧 Integration Steps

### Add NPM Scripts

Copy from `package.json.template` to your project's `package.json`:

```json
{
  "scripts": {
    "mcp:health": "node ../../tools/mcp/community-mcp-health-monitor.cjs",
    "mcp:watch": "node ../../tools/mcp/community-mcp-health-monitor.cjs --watch"
  }
}
```

### Custom Configuration

Copy `mcp-config.json` and customize:

```bash
cp examples/mcp-integrations/mcp-config.json my-mcp-config.json
node ../../tools/mcp/community-mcp-health-monitor.cjs --config my-mcp-config.json
```

---

## 📊 Production Evidence

Successfully deployed in **VERSSAI**:
- ✅ **100% uptime** after initial setup
- ✅ **~500-1000ms** avg response time
- ✅ **Zero production incidents**
- ✅ **Automated failure detection**

---

## 📚 Documentation

**Complete Guide**: `docs/guides/antd-mcp-integration.md`

**Key Sections**:
- Installation & Configuration
- Health Monitoring
- Framework Integration
- Troubleshooting
- Security Assessment

---

## 🚀 Other Community MCPs

This pattern works for **any community MCP**:

- **Material-UI**: `@example/mui-components-mcp`
- **Chakra UI**: `@example/chakra-components-mcp`
- **Tailwind**: `@example/tailwind-mcp`
- **Svelte**: `@example/svelte-components-mcp`

Just update `mcp-config.json` with your MCP package name!

---

## ✅ Checklist

- [ ] Added MCP to Claude Desktop config
- [ ] Restarted Claude Desktop
- [ ] Ran health check (`npm run mcp:health`)
- [ ] Health check passed (100% success rate)
- [ ] Tested component queries in Claude Code
- [ ] Set up continuous monitoring (optional)

---

**Questions?** See `docs/guides/antd-mcp-integration.md`
**Issues?** Run `npm run mcp:health` for diagnostics
