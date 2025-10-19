# 📦 VERSATIL Framework Installation Guide

Complete installation and setup guide for the VERSATIL SDLC Framework v6.4.0.

**NEW in v6.4.0**:
- 📍 **Automatic Roadmap Generation** - Get a personalized 4-week development plan
- 🤖 **18 OPERA agents** - 8 core + 10 language-specific sub-agents
- 🎯 **Smart Agent Matching** - Automatically recommends agents for your tech stack

## 🎯 Prerequisites

### System Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or yarn 1.22.0+)
- **Git**: Latest version
- **OS**: macOS, Linux, or Windows (WSL recommended)

### Development Environment
- **IDE**: VS Code, Cursor, or compatible editor
- **Terminal**: Bash, Zsh, or PowerShell
- **Browser**: Chrome (for MCP integration)

## 🚀 Installation Methods

### Method 1: NPM Global Installation (Recommended)

```bash
# Install globally for system-wide access
npm install -g versatil-sdlc-framework

# Verify installation
versatil --version

# Initialize in new project
mkdir my-project && cd my-project
versatil init

# Or initialize in existing project
cd existing-project
versatil init --existing
```

### Method 2: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/versatil-platform/versatil-sdlc-framework.git
cd versatil-sdlc-framework

# Install dependencies
npm install

# Build the framework
npm run build

# Link for global usage (optional)
npm link

# Test installation
npm test
```

### Method 3: NPX (No Installation)

```bash
# Use directly without installation
npx versatil-sdlc-framework init

# For existing projects
cd your-project
npx versatil-sdlc-framework init --existing
```

## ⚙️ Configuration

### 1. Basic Setup

After installation, initialize VERSATIL in your project:

```bash
# Navigate to your project
cd your-project

# Initialize VERSATIL framework (auto-generates roadmap)
versatil init

# Follow the interactive setup wizard
? Project type: (Frontend/Backend/Full-stack/ML)
? Framework: (React/Vue/Node.js/Python/Other)
? Team size: (Solo/Small/Medium/Large)
? MCP tools: (Chrome/Shadcn/GitHub/All)

# 📍 Automatic Roadmap Generation
# After wizard completes, check your personalized roadmap:
cat docs/VERSATIL_ROADMAP.md
```

### 📍 What Gets Auto-Generated

The `versatil init` command analyzes your project and generates:

1. **Project Analysis Report**
   - Detected technologies (React, Vue, Python, etc.)
   - Project complexity (simple/moderate/complex)
   - Recommended agents for your tech stack

2. **Personalized Roadmap** (`docs/VERSATIL_ROADMAP.md`)
   - 4-week development plan with weekly milestones
   - Agent recommendations (core + sub-agents)
   - Quality gates and success metrics
   - Technology-specific best practices
   - Testing strategy
   - Deployment checklist

3. **Agent Configuration**
   - Core agents: Maria-QA, James-Frontend, Marcus-Backend, Sarah-PM, Alex-BA, Dr.AI-ML, Oliver-DevOps
   - Sub-agents based on your stack:
     - **React project** → James-React
     - **Vue project** → James-Vue
     - **Next.js project** → James-NextJS
     - **Node.js backend** → Marcus-Node
     - **Python backend** → Marcus-Python
     - **Rails backend** → Marcus-Rails
     - **Go backend** → Marcus-Go
     - **Java backend** → Marcus-Java

**Example Roadmaps by Project Type**:
- React + Node.js → [templates/roadmaps/react-node-fullstack.md](../../templates/roadmaps/react-node-fullstack.md)
- Vue + Python → [templates/roadmaps/vue-python-backend.md](../../templates/roadmaps/vue-python-backend.md)
- Next.js Monorepo → [templates/roadmaps/nextjs-monorepo.md](../../templates/roadmaps/nextjs-monorepo.md)
- Python ML → [templates/roadmaps/python-ml.md](../../templates/roadmaps/python-ml.md)

### 2. Framework Structure

VERSATIL creates the following structure:

```
your-project/
├── .versatil/                    # Framework configuration
│   ├── config.json              # Main configuration
│   ├── agents/                  # Agent definitions
│   │   ├── maria-qa.json        # QA agent config
│   │   ├── james-frontend.json  # Frontend agent config
│   │   ├── marcus-backend.json  # Backend agent config
│   │   ├── sarah-pm.json        # PM agent config
│   │   ├── alex-ba.json         # BA agent config
│   │   ├── dr-ai-ml.json        # ML agent config
│   │   └── oliver-devops.json   # DevOps agent config
│   └── mcp/                     # MCP tool configurations
│       ├── chrome-mcp.json      # Chrome MCP settings
│       ├── shadcn-mcp.json      # Shadcn MCP settings
│       └── github-mcp.json      # GitHub MCP settings
├── docs/
│   └── VERSATIL_ROADMAP.md      # 📍 Your personalized 4-week roadmap (auto-generated)
├── .cursorrules                 # Cursor IDE integration
├── CLAUDE.md                    # OPERA methodology guide (includes roadmap reference)
└── versatil.log                 # Framework activity log
```

**Note**: The `docs/VERSATIL_ROADMAP.md` is automatically generated based on your project's detected technologies and contains a complete 4-week development plan customized for your stack.

### 3. Environment Variables

Create a `.env` file in your project root:

```bash
# Framework settings
VERSATIL_LOG_LEVEL=info
VERSATIL_AUTO_ACTIVATE=true
VERSATIL_MCP_ENABLED=true

# Agent settings
VERSATIL_AGENT_TIMEOUT=30000
VERSATIL_CONTEXT_RETENTION=true
VERSATIL_QUALITY_GATES=strict

# MCP tool settings
CHROME_MCP_HEADLESS=false
CHROME_MCP_VIEWPORT=1920x1080
GITHUB_MCP_TOKEN=your_github_token
SHADCN_MCP_REGISTRY=@shadcn/ui
```

## 🎨 Framework Configuration

### Agent Configuration

Each agent can be customized in `.versatil/agents/`:

```json
// .versatil/agents/maria-qa.json
{
  "name": "Maria-QA",
  "role": "Quality Assurance Engineer",
  "autoActivate": true,
  "triggers": {
    "filePatterns": ["*.test.js", "*.spec.ts", "**/__tests__/**"],
    "keywords": ["test", "bug", "quality", "assert"],
    "errorPatterns": ["failed", "error", "exception"]
  },
  "mcpTools": ["chrome_mcp", "playwright_mcp"],
  "collaborators": ["James-Frontend", "Marcus-Backend"],
  "qualityGates": {
    "testCoverage": 80,
    "accessibility": "WCAG-AA",
    "performance": "lighthouse > 90"
  }
}
```

### MCP Tool Configuration

Configure MCP tools in `.versatil/mcp/`:

```json
// .versatil/mcp/chrome-mcp.json
{
  "name": "chrome_mcp",
  "enabled": true,
  "settings": {
    "headless": false,
    "viewport": { "width": 1920, "height": 1080 },
    "timeout": 30000,
    "screenshots": true,
    "networkLogs": true
  },
  "testSuites": {
    "smoke": ["basic-navigation", "core-functionality"],
    "regression": ["full-user-journey", "edge-cases"],
    "accessibility": ["wcag-compliance", "keyboard-navigation"]
  }
}
```

## 🔧 IDE Integration

### VS Code Setup

Install the VERSATIL extension:

```bash
# Install via VS Code marketplace
code --install-extension versatil.versatil-sdlc

# Or via settings.json
{
  "versatil.autoActivate": true,
  "versatil.logLevel": "info",
  "versatil.mcpIntegration": true
}
```

### Cursor IDE Setup

VERSATIL automatically creates `.cursorrules` for Cursor integration:

```yaml
# .cursorrules - Auto-generated by VERSATIL
agent_activation:
  frontend_files: ["*.tsx", "*.jsx", "*.vue"]
    agent: "James-Frontend"
    context: "UI/UX optimization, component design"

  test_files: ["*.test.*", "*.spec.*"]
    agent: "Maria-QA"
    context: "Quality assurance, automated testing"

  backend_files: ["*.api.*", "*.service.*"]
    agent: "Marcus-Backend"
    context: "API design, database optimization"
```

## 🧪 Verification & Testing

### 1. Framework Health Check

```bash
# Run comprehensive health check
versatil health

# Expected output:
✅ Framework Status: OPERATIONAL
✅ Agents: 6/6 configured
✅ MCP Tools: 3/3 connected
✅ IDE Integration: Active
✅ Context System: Ready
✅ Quality Gates: Enforced
```

### 2. Agent Activation Test

```bash
# Test agent auto-activation
echo "describe('test', () => {})" > test.spec.js

# Maria-QA should auto-activate
# Check logs: tail -f versatil.log
```

### 3. MCP Integration Test

```bash
# Test Chrome MCP integration
versatil test mcp --tool=chrome

# Expected output:
🎯 MARIA (QA): Chrome MCP integration test
🚀 Opening browser session...
✅ Navigation successful
✅ Snapshot captured
✅ Test execution complete
```

## 🚨 Troubleshooting

### Common Issues

**Issue**: `versatil: command not found`
```bash
# Solution: Reinstall globally
npm uninstall -g versatil-sdlc-framework
npm install -g versatil-sdlc-framework
```

**Issue**: Agents not auto-activating
```bash
# Check configuration
versatil config --validate

# Reset configuration
versatil init --reset
```

**Issue**: MCP tools not connecting
```bash
# Check MCP status
versatil mcp status

# Restart MCP services
versatil mcp restart
```

**Issue**: Permission errors
```bash
# Fix permissions (macOS/Linux)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Set debug environment
export VERSATIL_DEBUG=true
export VERSATIL_LOG_LEVEL=debug

# Run with verbose output
versatil init --verbose

# Check debug logs
tail -f versatil.debug.log
```

### Support Channels

- 📧 **Email**: support@versatil.vc
- 💬 **Discord**: [VERSATIL Community](https://discord.gg/versatil)
- 🐛 **Issues**: [GitHub Issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)
- 📖 **Docs**: [Full Documentation](https://docs.versatil-platform.com)

## 🎉 Next Steps

After successful installation:

1. **Read the [Quick Start Guide](../README.md#quick-start)**
2. **Explore [Agent Reference](./AGENTS.md)**
3. **Learn [MCP Integration](./MCP.md)**
4. **Try [Example Projects](../examples/)**
5. **Join the [Community](https://discord.gg/versatil)**

---

**Congratulations! 🎉 Your VERSATIL Framework is ready to revolutionize your development workflow.**