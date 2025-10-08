# Ant Design MCP Server Integration Guide
## Community MCP Integration Pattern for VERSATIL Framework

**Part of**: VERSATIL SDLC Framework v5.3.0
**Production-Tested**: VERSSAI Enterprise VC Platform

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Testing & Verification](#testing--verification)
5. [Monitoring](#monitoring)
6. [Usage in Development](#usage-in-development)
7. [Framework Integration](#framework-integration)
8. [Troubleshooting](#troubleshooting)
9. [Security & Limitations](#security--limitations)

---

## 🎯 Overview

### What is the Ant Design MCP Server?

The Ant Design Components MCP (Model Context Protocol) server provides Claude Code with comprehensive Ant Design component documentation, enabling:

- ✅ **Accurate code generation** - No hallucinations when generating Ant Design components
- ✅ **API documentation access** - Instant access to component props, methods, and examples
- ✅ **Version-specific docs** - Pre-processed Ant Design v5.27.4 documentation
- ✅ **Code examples** - Real-world component usage patterns
- ✅ **Changelog access** - Component change history and migration guides

### Official Status

⚠️ **Community-Created Server** (Not Anthropic Official)

- **Package**: `@jzone-mcp/antd-components-mcp` by zhixiaoqiang
- **GitHub Stars**: 165 ⭐
- **Weekly Downloads**: ~156
- **License**: MIT (enterprise-safe)
- **Maintenance**: Actively maintained (last update: 4 days ago)
- **Production Readiness**: **8/10** - Well-documented, active development

### Risk Assessment

| Risk Factor | Level | Mitigation |
|------------|-------|-----------|
| **Availability** | LOW | Local NPM package, works offline |
| **Security** | LOW-MEDIUM | Community code, MIT licensed, no network access needed |
| **Maintenance** | MEDIUM | Single maintainer, could be abandoned |
| **Breaking Changes** | LOW | Semantic versioning, documentation server only |
| **Performance Impact** | LOW | Runs on-demand via npx, minimal overhead |

**Recommendation**: ✅ **Safe for development use** with monitoring

---

## 🚀 Installation

### Step 1: Verify Prerequisites

```bash
# Check Node.js version (requires Node 14+)
node --version

# Check npx is available
which npx

# Verify homebrew npx path
which /opt/homebrew/bin/npx
```

### Step 2: Add to Claude Desktop Configuration

Add the MCP server to your Claude Desktop configuration file:

**Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Configuration to Add**:
```json
{
  "mcpServers": {
    "antd-components": {
      "command": "/opt/homebrew/bin/npx",
      "args": [
        "@jzone-mcp/antd-components-mcp"
      ],
      "env": {
        "NODE_ENV": "production"
      },
      "disabled": false
    }
  }
}
```

### Step 3: Restart Claude Desktop

**Required**: Claude Desktop must be restarted to load the new MCP server.

```bash
# Option 1: Manual restart
# Quit Claude Desktop (⌘Q)
# Reopen Claude Desktop

# Option 2: Force quit and restart
killall "Claude" && open -a "Claude"
```

---

## ✅ Configuration

### Disabling the Server Temporarily

If you encounter issues, you can disable the server without removing it:

**Edit**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "antd-components": {
    "command": "/opt/homebrew/bin/npx",
    "args": ["@jzone-mcp/antd-components-mcp"],
    "env": { "NODE_ENV": "production" },
    "disabled": true  // ← Change to true
  }
}
```

### Adjusting Timeout

If the server times out on first run (downloading package):

```json
{
  "antd-components": {
    "command": "/opt/homebrew/bin/npx",
    "args": ["@jzone-mcp/antd-components-mcp"],
    "env": {
      "NODE_ENV": "production",
      "NPM_CONFIG_TIMEOUT": "60000"  // 60 seconds
    },
    "disabled": false
  }
}
```

---

## 🧪 Testing & Verification

### Test 1: Claude Desktop Integration

After restarting Claude Desktop, ask:

```
List all Ant Design components available
```

**Expected**: Claude responds with a list of Ant Design components (Button, Table, Form, etc.)

### Test 2: Component Documentation

Ask:

```
Show me the API documentation for Ant Design Button component
```

**Expected**: Detailed props, methods, and examples for the Button component

### Test 3: Code Generation

Ask:

```
Generate an Ant Design Card component with a title, description, and action button
```

**Expected**: Accurate code with correct props and imports

### Test 4: Health Monitoring Script

Run the monitoring script:

```bash
node scripts/monitor-mcp-health.cjs
```

**Expected Output**:
```
✅ antd-components is healthy (XXXms)
Success Rate: 100.00%
```

---

## 📊 Monitoring

### Automated Health Checks

The monitoring script is located at:
```
scripts/monitor-mcp-health.cjs
```

### One-Time Health Check

```bash
node scripts/monitor-mcp-health.cjs
```

### Continuous Monitoring

```bash
node scripts/monitor-mcp-health.cjs --watch
```

**Features**:
- ✅ Tests server availability every 5 minutes
- ✅ Measures response times
- ✅ Tracks failure counts
- ✅ Sends alerts after 3 consecutive failures
- ✅ Generates detailed health reports
- ✅ Logs to `logs/mcp-health.log`

### Monitoring Logs

View monitoring history:

```bash
cat logs/mcp-health.log
```

View last 50 entries:

```bash
tail -50 logs/mcp-health.log
```

Watch logs in real-time:

```bash
tail -f logs/mcp-health.log
```

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Consecutive Failures** | 3+ | Alert logged |
| **Response Time** | >10s | Timeout error |
| **Success Rate** | <80% | Review server health |

---

## 💻 Usage in Development

### Component Discovery

```
# Ask Claude Code:
"What Ant Design components are available for forms?"
"Show me all Ant Design data display components"
"List Ant Design navigation components"
```

### API Documentation

```
# Ask Claude Code:
"What are the props for Ant Design Table component?"
"Show me the API for Ant Design Form.Item"
"What events does the Ant Design DatePicker support?"
```

### Code Generation

```
# Ask Claude Code:
"Generate a complete Ant Design Form with validation"
"Create a responsive Ant Design Table with sorting and filtering"
"Build an Ant Design Modal with form submission"
```

### Migration Assistance

```
# Ask Claude Code:
"What changed in Ant Design Button between v4 and v5?"
"Show me the changelog for Ant Design Table"
"How do I migrate from Ant Design v4 to v5?"
```

### Best Practices

```
# Ask Claude Code:
"What are Ant Design best practices for forms?"
"Show me Ant Design performance optimization tips"
"What's the recommended way to customize Ant Design themes?"
```

---

## 🏗️ Framework Integration

### Using with VERSATIL Framework

The VERSATIL Framework provides automated health monitoring for community MCP servers.

#### **Health Monitoring Script**

**Location**: `tools/mcp/community-mcp-health-monitor.cjs`

```bash
# One-time health check
node tools/mcp/community-mcp-health-monitor.cjs

# Continuous monitoring (every 5 minutes)
node tools/mcp/community-mcp-health-monitor.cjs --watch

# Custom configuration
node tools/mcp/community-mcp-health-monitor.cjs --config my-config.json
```

#### **NPM Scripts Integration**

Add to your project's `package.json`:

```json
{
  "scripts": {
    "mcp:health": "node ../../tools/mcp/community-mcp-health-monitor.cjs",
    "mcp:watch": "node ../../tools/mcp/community-mcp-health-monitor.cjs --watch"
  }
}
```

#### **Custom Configuration**

Create `mcp-config.json`:

```json
{
  "mcpServers": {
    "antd-components": {
      "package": "@jzone-mcp/antd-components-mcp",
      "timeout": 10000,
      "criticalityLevel": "medium"
    },
    "material-ui-components": {
      "package": "@example/mui-mcp",
      "timeout": 10000,
      "criticalityLevel": "low"
    }
  },
  "checkInterval": 300000,
  "alertThreshold": 3
}
```

#### **Framework Agents Integration**

VERSATIL agents can use Ant Design MCP documentation:

```typescript
import { CommunityMCPHealthMonitor } from '../../tools/mcp/community-mcp-health-monitor.cjs';

// In James (Frontend Development Agent)
const mcpMonitor = new CommunityMCPHealthMonitor();
const healthStatus = await mcpMonitor.checkHealth();

if (healthStatus['antd-components'].available) {
  // Generate Ant Design code with confidence
  console.log('✅ Ant Design MCP is available');
} else {
  // Fallback to generic React code
  console.log('⚠️ Using fallback component generation');
}
```

#### **CI/CD Integration**

Add health check to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Check MCP Server Health
  run: node tools/mcp/community-mcp-health-monitor.cjs
  continue-on-error: true
```

---

## 🔧 Troubleshooting

### Issue 1: Server Not Available

**Symptom**: Health check shows "unavailable" or timeout

**Solutions**:

1. **Check npx is available**:
   ```bash
   which npx
   # Should output: /opt/homebrew/bin/npx
   ```

2. **Manually test the package**:
   ```bash
   npx @jzone-mcp/antd-components-mcp --version
   ```

3. **Check npm cache**:
   ```bash
   npm cache verify
   ```

4. **Clear npx cache**:
   ```bash
   rm -rf ~/.npm/_npx
   ```

### Issue 2: Claude Doesn't Respond to Queries

**Symptom**: Claude doesn't use MCP server data

**Solutions**:

1. **Verify Claude Desktop restarted**:
   - Fully quit (⌘Q)
   - Wait 5 seconds
   - Reopen

2. **Check MCP server status in Claude**:
   - Open Claude Desktop
   - Check bottom left for MCP icon
   - Should show "antd-components" as connected

3. **Review Claude Desktop logs**:
   ```bash
   # macOS
   ~/Library/Logs/Claude/main.log
   ```

### Issue 3: Slow Response Times

**Symptom**: First query takes >10 seconds

**Cause**: NPM downloading package on first run

**Solutions**:

1. **Pre-install the package**:
   ```bash
   npm install -g @jzone-mcp/antd-components-mcp
   ```

2. **Increase timeout** (see Configuration section above)

3. **Use cached version after first run**

### Issue 4: Outdated Documentation

**Symptom**: MCP serves docs for older Ant Design version

**Check Current Version**:
```bash
npx @jzone-mcp/antd-components-mcp --version
```

**Update Package**:
```bash
# Clear npx cache
rm -rf ~/.npm/_npx

# Force fresh download
npx @jzone-mcp/antd-components-mcp --version
```

### Issue 5: Permission Errors

**Symptom**: "Permission denied" when running npx

**Solutions**:

1. **Check npx permissions**:
   ```bash
   ls -la /opt/homebrew/bin/npx
   ```

2. **Fix permissions**:
   ```bash
   sudo chmod +x /opt/homebrew/bin/npx
   ```

3. **Use absolute path** (already configured)

---

## 🔒 Security & Limitations

### Security Considerations

#### ✅ **Safe Aspects**:
- **Local execution**: Runs on your machine via npx
- **No network access**: Pre-processed docs, no external API calls
- **Open source**: Code is reviewable on GitHub
- **MIT licensed**: Enterprise-friendly license
- **No data collection**: Doesn't track usage or send telemetry

#### ⚠️ **Risk Factors**:
- **Community-maintained**: Not audited by Anthropic
- **Dependency risk**: Relies on npm ecosystem
- **Code execution**: Runs JavaScript via npx
- **Update frequency**: May lag behind Ant Design releases

#### 🛡️ **Mitigation Strategies**:
- ✅ **Monitoring**: Automated health checks (implemented)
- ✅ **Disable easily**: `"disabled": true` in config
- ✅ **Offline capable**: Works without internet after first download
- ✅ **Version pinning**: Can pin specific package version
- ✅ **Audit trail**: Logs in `logs/mcp-health.log`

### Limitations

#### **Documentation Scope**:
- ✅ Ant Design v5.27.4 (current at implementation)
- ❌ Doesn't include v6 changes (if released)
- ❌ Doesn't include custom Ant Design themes
- ❌ Doesn't include pro-components documentation

#### **Functionality**:
- ✅ Component API documentation
- ✅ Code examples
- ✅ Changelog access
- ❌ No live code execution
- ❌ No component preview
- ❌ No custom component analysis

#### **Performance**:
- First run: 5-10 seconds (downloading package)
- Subsequent runs: <1 second (cached)
- Memory usage: ~50-100MB (npx process)

### Compliance

#### **Enterprise Use**:
- ✅ **MIT License**: Commercial use allowed
- ✅ **No telemetry**: GDPR compliant
- ✅ **Local-only**: No data leaves your machine
- ⚠️ **No SLA**: Community support only
- ⚠️ **No warranty**: Use at own risk

#### **Audit Trail**:
All MCP server activity is logged to:
```
logs/mcp-health.log
~/Library/Logs/Claude/main.log (Claude Desktop logs)
```

---

## 📚 Additional Resources

### Package Documentation
- **GitHub**: https://github.com/zhixiaoqiang/antd-components-mcp
- **NPM**: https://www.npmjs.com/package/@jzone-mcp/antd-components-mcp
- **Issues**: https://github.com/zhixiaoqiang/antd-components-mcp/issues

### Ant Design Resources
- **Official Docs**: https://ant.design/
- **Components**: https://ant.design/components/overview
- **GitHub**: https://github.com/ant-design/ant-design

### Model Context Protocol
- **Specification**: https://modelcontextprotocol.io/
- **Claude MCP Docs**: https://docs.claude.com/en/docs/mcp
- **Official Servers**: https://github.com/modelcontextprotocol/servers

---

## 🔄 Maintenance Schedule

### Weekly
- [ ] Review health monitoring logs
- [ ] Check for package updates
- [ ] Verify response times <2s

### Monthly
- [ ] Update package to latest version
- [ ] Review Claude Desktop logs for errors
- [ ] Test key component queries

### Quarterly
- [ ] Audit package dependencies
- [ ] Review security advisories
- [ ] Evaluate alternative MCP servers

---

## 📞 Support

### Internal Support
- **Monitoring Logs**: `logs/mcp-health.log`
- **Disable Server**: Edit `claude_desktop_config.json`, set `"disabled": true`
- **Emergency**: Restart Claude Desktop

### Community Support
- **GitHub Issues**: https://github.com/zhixiaoqiang/antd-components-mcp/issues
- **MCP Community**: https://github.com/modelcontextprotocol/servers/discussions

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-08 | 1.0.0 | Initial setup and configuration |
| | | - Configured MCP server in Claude Desktop |
| | | - Created health monitoring script |
| | | - Documented setup and troubleshooting |

---

## ✅ Quick Reference

### Configuration File
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

### Health Check
```bash
node scripts/monitor-mcp-health.cjs
```

### Disable Server
Edit config, set `"disabled": true`

### Restart Claude
```bash
killall "Claude" && open -a "Claude"
```

### View Logs
```bash
tail -f logs/mcp-health.log
```

---

**Status**: ✅ **Installed and Monitored**

**Last Updated**: October 8, 2025
**Maintained By**: VERSSAI Development Team
