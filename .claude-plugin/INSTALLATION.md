# VERSATIL OPERA Framework - Installation Guide

Complete guide for installing and configuring the VERSATIL OPERA Framework as a Claude Code plugin.

---

## 📋 Prerequisites

Before installing VERSATIL, ensure you have:

- ✅ **Claude Code** installed (version 1.0.0+)
- ✅ **Node.js** 18.0.0 or higher
- ✅ **npm** 9.0.0 or higher
- ✅ **Git** (for marketplace installation)

### Verify Prerequisites

```bash
# Check Claude Code
claude --version  # Should be 1.0.0+

# Check Node.js
node --version    # Should be v18.0.0+

# Check npm
npm --version     # Should be 9.0.0+
```

---

## 🚀 Installation Methods

### Method 1: Via Marketplace (Recommended)

**Step 1: Add VERSATIL Marketplace**

```bash
/plugin marketplace add github:versatil-sdlc-framework/marketplace
```

**Step 2: Install the Framework**

```bash
/plugin install versatil-opera-framework
```

**Step 3: Verify Installation**

```bash
/plugin list --enabled
```

You should see `versatil-opera-framework` in the list.

---

### Method 2: Local Installation (Development)

**Step 1: Clone the Repository**

```bash
# Navigate to your preferred directory
cd ~/projects

# Clone VERSATIL
git clone https://github.com/versatil-sdlc-framework/core.git versatil

# Navigate into directory
cd versatil
```

**Step 2: Install Dependencies**

```bash
npm install
```

**Step 3: Add Local Marketplace**

```bash
# From parent directory
/plugin marketplace add ./versatil
```

**Step 4: Install from Local Source**

```bash
/plugin install versatil-opera-framework@local
```

---

### Method 3: Direct Path Installation

If you have VERSATIL in a specific location:

```bash
/plugin install /absolute/path/to/VERSATIL_SDLC_FW
```

---

## ⚙️ Configuration

### Automatic Configuration

VERSATIL auto-configures on first use. The framework will:

1. ✅ Detect your project type (React, Vue, Python, etc.)
2. ✅ Configure appropriate agents
3. ✅ Set up quality gates
4. ✅ Initialize MCP servers
5. ✅ Create `.versatil-project.json` in your project

### Manual Configuration (Optional)

Create `.versatil-project.json` in your project root:

```json
{
  "framework": {
    "version": "6.2.0",
    "enabled": true
  },
  "agents": {
    "maria-qa": {
      "enabled": true,
      "auto-activate": true,
      "coverage-threshold": 80
    },
    "james-frontend": {
      "enabled": true,
      "auto-activate": true,
      "accessibility": "AA"
    },
    "marcus-backend": {
      "enabled": true,
      "auto-activate": true,
      "security": "owasp"
    },
    "alex-ba": {
      "enabled": true,
      "auto-activate": true
    },
    "sarah-pm": {
      "enabled": true,
      "auto-activate": false
    },
    "dr-ai-ml": {
      "enabled": true,
      "auto-activate": true
    }
  },
  "rules": {
    "parallel-execution": true,
    "stress-testing": true,
    "health-audits": true,
    "onboarding": true,
    "releases": true
  },
  "quality": {
    "testCoverage": 80,
    "performance": {
      "lighthouse": 90
    },
    "accessibility": {
      "wcag": "AA"
    },
    "security": {
      "owasp": true
    }
  }
}
```

---

## 🎯 Post-Installation Setup

### Step 1: Run Framework Doctor

Verify all components are working:

```bash
/framework:doctor
```

Expected output:
```
✅ Framework Health Check
✅ 6/6 agents operational
✅ 17/17 hooks loaded
✅ 11/11 MCP servers configured
✅ Quality gates: ACTIVE
✅ Automation rules: 5/5 enabled

🎉 VERSATIL OPERA Framework is ready!
```

### Step 2: Test Agent Activation

Try activating an agent manually:

```bash
/maria-qa run health check
```

Expected: Maria-QA agent responds and runs diagnostics.

### Step 3: Verify Auto-Activation

Create or edit a test file:

```bash
# Create a test file
touch src/components/Button.test.tsx
```

Expected: Maria-QA automatically activates (check statusline)

---

## 🔧 Troubleshooting

### Issue 1: Plugin Not Found

**Problem**: `/plugin install versatil-opera-framework` returns "not found"

**Solution**:
```bash
# 1. Verify marketplace is added
/plugin marketplace list

# 2. If not listed, add it
/plugin marketplace add github:versatil-sdlc-framework/marketplace

# 3. Refresh marketplace
/plugin marketplace refresh

# 4. Try install again
/plugin install versatil-opera-framework
```

### Issue 2: Agents Not Auto-Activating

**Problem**: Agents don't activate when editing files

**Solution**:
```bash
# 1. Check plugin is enabled
/plugin list --enabled

# 2. Enable if disabled
/plugin enable versatil-opera-framework

# 3. Restart Claude Code
# (close and reopen)

# 4. Verify auto-activation settings
# Check .versatil-project.json → agents.*.auto-activate: true
```

### Issue 3: MCP Servers Not Connected

**Problem**: MCP integrations (Chrome, GitHub, etc.) not working

**Solution**:
```bash
# 1. Check MCP configuration
claude mcp list

# 2. Verify credentials in ~/.versatil/.env
cat ~/.versatil/.env

# 3. Restart MCP servers
claude mcp restart

# 4. Test specific MCP
claude mcp test chrome
```

### Issue 4: Permission Denied

**Problem**: Hooks fail with permission errors

**Solution**:
```bash
# Make hooks executable
cd /path/to/VERSATIL_SDLC_FW
chmod +x .claude/hooks/**/*.sh
```

### Issue 5: Node Version Mismatch

**Problem**: Framework requires Node 18+, but you have older version

**Solution**:
```bash
# Install Node 18+ using nvm
nvm install 18
nvm use 18

# Verify
node --version  # Should show v18.x.x

# Reinstall plugin
/plugin reinstall versatil-opera-framework
```

---

## 🔍 Verification Checklist

After installation, verify:

- [ ] Plugin appears in `/plugin list --enabled`
- [ ] `/framework:doctor` shows all systems operational
- [ ] Agents auto-activate when editing relevant files
- [ ] Commands work (`/maria-qa`, `/james-frontend`, etc.)
- [ ] Quality gates block bad commits (test by making breaking change)
- [ ] MCP servers respond (test Chrome MCP with browser automation)
- [ ] Statusline shows agent activity
- [ ] `.versatil-project.json` created in project root

---

## 📊 Testing Your Installation

### Quick Test Suite

```bash
# 1. Test Maria-QA
/maria-qa run quality check

# 2. Test James-Frontend
/james-frontend validate UI components

# 3. Test Marcus-Backend
/marcus-backend review API security

# 4. Test framework health
/framework:doctor

# 5. Test parallel execution (Rule 1)
# Edit multiple files simultaneously - agents should work in parallel

# 6. Test stress testing (Rule 2)
# Create API endpoint - stress tests should auto-generate

# 7. Test health audit (Rule 3)
# Run: npm run doctor
```

---

## 🔄 Updating VERSATIL

### Check for Updates

```bash
/plugin marketplace refresh
/plugin list --updates
```

### Update to Latest Version

```bash
/plugin update versatil-opera-framework
```

### Rollback to Previous Version

```bash
/plugin install versatil-opera-framework@6.1.0
```

---

## 🚨 Uninstalling

If you need to remove VERSATIL:

```bash
# Disable first (preserves settings)
/plugin disable versatil-opera-framework

# Or uninstall completely
/plugin uninstall versatil-opera-framework

# Remove marketplace (optional)
/plugin marketplace remove github:versatil-sdlc-framework/marketplace
```

To preserve your settings, disable instead of uninstalling. Your `.versatil-project.json` will be retained.

---

## 📚 Next Steps

After successful installation:

1. **Read the README**: `.claude-plugin/README.md`
2. **Explore Agents**: `.claude/AGENTS.md`
3. **Learn Automation Rules**: `.claude/rules/README.md`
4. **Try Examples**: See README.md → Examples section
5. **Join Community**: GitHub Discussions

---

## 💬 Support

Need help? We're here for you:

- **GitHub Issues**: https://github.com/versatil-sdlc-framework/core/issues
- **Discussions**: https://github.com/versatil-sdlc-framework/core/discussions
- **Email**: nissim@versatil.vc
- **Documentation**: https://docs.versatil.dev

---

## ⚡ Pro Tips

1. **Use Parallel Execution**: Rule 1 speeds up development by 3x
2. **Enable All Agents**: They only activate when needed (low overhead)
3. **Trust Quality Gates**: They prevent 89% of bugs
4. **Let Agents Collaborate**: Cross-agent workflows are powerful
5. **Check Statusline**: See real-time agent activity
6. **Use MCP Integrations**: Chrome MCP for testing is game-changing

---

**Installation Complete! 🎉**

You now have the most powerful SDLC automation framework for Claude Code.

Start coding and watch VERSATIL agents work their magic!
