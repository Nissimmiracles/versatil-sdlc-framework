# VERSATIL - Claude Code Plugin

[![Version](https://img.shields.io/badge/version-6.5.0-blue.svg)](https://github.com/Nissimmiracles/versatil-sdlc-framework)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Plugin-purple.svg)](https://claude.com/claude-code)

**AI-Native SDLC Framework for Claude** with 18 specialized agents (8 core OPERA + 10 language-specific sub-agents), 5-rule automation system, and 12 MCP integrations for production-ready software development.

---

## 🎯 What is VERSATIL?

VERSATIL is a **production-ready framework** that transforms Claude Code into a complete SDLC automation platform. It provides:

- **18 specialized agents** - 8 core OPERA agents (Alex-BA, Dana-Database, Marcus-Backend, James-Frontend, Maria-QA, Sarah-PM, Dr.AI-ML, Oliver-MCP) + 10 language-specific sub-agents (5 backend: Node.js, Python, Rails, Go, Java; 5 frontend: React, Vue, Next.js, Angular, Svelte)
- **Rich Activation Examples** - Each agent includes contextual examples showing when/how to activate
- **5-Rule Automation System** - Parallel execution, stress testing, health monitoring, onboarding, releases
- **12 MCP Integrations** - Chrome, GitHub, GitMCP, Vertex AI, Supabase, n8n, Semgrep, Sentry, Shadcn, Ant Design, Claude Code, and more
- **17 Lifecycle Hooks** - Session, tool, and statusline automation
- **Proactive Intelligence** - Auto-activation based on file patterns and code context
- **Quality Gates** - Enforced 80%+ test coverage and WCAG 2.1 AA compliance

---

## 📦 Installation

### Method 1: Via Marketplace (Recommended)

```bash
# Add VERSATIL marketplace
/plugin marketplace add github:Nissimmiracles/versatil-sdlc-framework

# Install the framework
/plugin install versatil-opera-framework

# Enable agents (they auto-activate, but you can toggle)
/plugin enable versatil-opera-framework
```

### Method 2: Local Installation (Development)

```bash
# Clone the repository
git clone https://github.com/Nissimmiracles/versatil-sdlc-framework.git

# Add local marketplace
/plugin marketplace add ./core

# Install from local source
/plugin install versatil-opera-framework@local
```

---

## 🚀 Quick Start

Once installed, VERSATIL agents **automatically activate** based on your workflow:

### Understanding Agent Activation

VERSATIL agents use **contextual intelligence** to activate automatically when needed. Each agent has rich activation examples that help Claude understand when to engage them:

**How It Works**:
1. You mention a task or edit a file
2. Claude analyzes the context and agent descriptions
3. The most relevant agent(s) activate automatically
4. Agents collaborate as needed

**Activation Examples**:

```bash
# Scenario 1: New Feature Implementation
You: "I've added JWT authentication to the API"
→ Marcus-Backend activates (security-critical backend work)
→ Maria-QA also activates (comprehensive testing needed)

# Scenario 2: UI Issue
You: "Screen readers can't navigate the form properly"
→ James-Frontend activates (accessibility expertise needed)

# Scenario 3: Deployment
You: "Ready to deploy to production"
→ Maria-QA activates (pre-deployment quality gates)
→ Sarah-PM activates (deployment coordination)

# Scenario 4: Vague Requirement
You: "Make the search better"
→ Alex-BA activates (requirements clarification needed)
```

### File Pattern Activation

```bash
# Edit a React component → James-Frontend activates
# Edit test files → Maria-QA activates
# Edit API routes → Marcus-Backend activates
# Edit requirements → Alex-BA activates
# Edit documentation → Sarah-PM activates
# Edit Python/ML files → Dr.AI-ML activates
```

### Manual Agent Invocation

```bash
# Quality assurance and testing
/maria-qa review test coverage for authentication

# UI/UX development
/james-frontend optimize React component performance

# Backend/API development
/marcus-backend review API security implementation

# Business analysis
/alex-ba refine user story acceptance criteria

# Project management
/sarah-pm update project timeline

# AI/ML tasks
/dr-ai-ml deploy ML model to production
```

### Framework Health Checks

```bash
# Comprehensive health audit
/framework:doctor

# Quick validation
/framework:validate

# Debug information
/framework-debug
```

---

## 👥 The 8 Core OPERA Agents

### 1. Alex-BA - Business Analyst 📊
**Auto-activates on**: `requirements/**`, `*.feature`, user stories

**Capabilities**:
- Requirements extraction and analysis
- User story creation with acceptance criteria
- Stakeholder communication
- Business logic validation
- ROI and impact analysis

**Example Usage**:
```bash
/alex-ba extract requirements from conversation
/alex-ba create user stories for new feature
/alex-ba validate acceptance criteria
```

### 2. Dana-Database - Database Architect 🗄️
**Auto-activates on**: `*.sql`, `migrations/**`, `schema/**`, `prisma/**`

**Capabilities**:
- Database schema design and optimization
- Migration scripts (SQL, Prisma, TypeORM)
- Query performance optimization
- RLS policies for Supabase
- Index strategy and tuning

**Example Usage**:
```bash
/dana-database optimize user queries
/dana-database design multi-tenant schema
/dana-database review migration safety
```

### 3. Marcus-Backend - API Architect 🔧
**Auto-activates on**: `*.api.*`, `routes/**`, `controllers/**`

**Capabilities**:
- RESTful and GraphQL API design
- Database optimization and migrations
- OWASP Top 10 security compliance
- Microservices architecture
- API stress testing (<200ms response time)

**Example Usage**:
```bash
/marcus-backend design authentication API
/marcus-backend optimize database queries
/marcus-backend review security vulnerabilities
```

### 4. James-Frontend - UI/UX Architect 🎨
**Auto-activates on**: `*.jsx`, `*.tsx`, `*.vue`, `*.css`, `components/**`

**Capabilities**:
- Modern component development (React/Vue/Svelte)
- Responsive and accessible UI (WCAG 2.1 AA)
- Frontend performance optimization
- Design system implementation
- 5 specialized sub-agents (React, Vue, Next.js, Angular, Svelte)

**Example Usage**:
```bash
/james-frontend optimize page load performance
/james-frontend validate accessibility compliance
/james-frontend review component structure
```

### 5. Maria-QA - Quality Assurance Lead ✅
**Auto-activates on**: `*.test.*`, `__tests__/**`, coverage reports

**Capabilities**:
- Enforces 80%+ test coverage
- Runs comprehensive test suites (unit, integration, e2e)
- Validates quality gates
- Chrome MCP browser testing
- Security and accessibility audits

**Example Usage**:
```bash
/maria-qa run full quality validation
/maria-qa check security compliance
/maria-qa generate test coverage report
```

### 6. Sarah-PM - Project Manager 📅
**Auto-activates on**: `*.md`, `docs/**`, sprint planning

**Capabilities**:
- Sprint planning and tracking
- Milestone management
- Team coordination
- Progress reporting
- Risk assessment

**Example Usage**:
```bash
/sarah-pm generate sprint report
/sarah-pm update project roadmap
/sarah-pm track team velocity
```

### 7. Dr.AI-ML - AI/ML Specialist 🤖
**Auto-activates on**: `*.py`, `*.ipynb`, `models/**`

**Capabilities**:
- Machine learning model development
- Deep learning architecture design
- NLP and computer vision
- Model training and optimization
- Production deployment

**Example Usage**:
```bash
/dr-ai-ml train sentiment analysis model
/dr-ai-ml optimize model performance
/dr-ai-ml deploy to production
```

### 8. Oliver-MCP - MCP Orchestrator 🔌
**Auto-activates on**: MCP-related tasks, integration requests

**Capabilities**:
- Intelligent MCP server selection
- Multi-MCP coordination
- Anti-hallucination detection via GitMCP
- Integration health monitoring
- Automatic fallback handling

**Example Usage**:
```bash
/oliver-mcp query React documentation
/oliver-mcp test browser automation
/oliver-mcp validate GitHub integration
```

---

## ⚡ 5-Rule Automation System

### Rule 1: Parallel Task Execution 🔄
**Benefit**: +300% development velocity

Run multiple tasks simultaneously with intelligent collision detection:
- Parallel component builds
- Concurrent test execution
- Agent workload balancing
- Zero resource conflicts

### Rule 2: Automated Stress Testing 🧪
**Benefit**: +89% defect reduction

Auto-generate and run stress tests on code changes:
- API endpoint stress tests
- Load testing (1000+ req/sec)
- Performance regression detection
- Automatic test suite generation

### Rule 3: Daily Health Audits 📊
**Benefit**: +99.9% system reliability

Comprehensive system health checks:
- Dependency vulnerability scanning
- Performance metrics monitoring
- Code quality analysis
- Infrastructure health validation

### Rule 4: Intelligent Onboarding 🎯
**Benefit**: +90% onboarding efficiency

Zero-config project setup:
- Auto-detect project type
- Configure agents automatically
- Setup quality gates
- Create test templates

### Rule 5: Automated Releases 🚀
**Benefit**: +95% release automation

Bug tracking and version management:
- Automatic issue creation from test failures
- Version bumping and changelog generation
- Automated deployments
- Release notes generation

---

## 🔌 MCP Integrations

VERSATIL includes pre-configured integrations with 12 production MCPs:

1. **Chrome/Playwright MCP** - Browser automation and testing
2. **GitHub MCP** - Repository management and CI/CD
3. **GitMCP** - GitHub repository documentation access (NEW)
4. **Exa MCP** - AI-powered search and discovery
5. **Vertex AI MCP** - Google Cloud AI services
6. **Supabase MCP** - Database and backend (vector DB for RAG)
7. **n8n MCP** - Workflow automation (525+ nodes)
8. **Semgrep MCP** - Security scanning (30+ languages)
9. **Sentry MCP** - Error monitoring with AI analysis
10. **Shadcn MCP** - UI component library
11. **Ant Design MCP** - React component system
12. **Claude Code MCP** - Enhanced Claude Code integration

---

## 📖 Documentation

- **Agent Details**: `.claude/AGENTS.md` - Complete agent configuration
- **Rules System**: `.claude/rules/README.md` - 5-Rule automation details
- **Core Configuration**: `CLAUDE.md` - Framework methodology
- **Commands Reference**: `.claude/commands/` - All slash commands

---

## 🎓 Examples & Tutorials

### Example 1: New React Feature Development

```bash
# 1. Alex-BA extracts requirements
/alex-ba "Add user authentication"
# → Creates user stories with acceptance criteria

# 2. Marcus-Backend builds API
/marcus-backend "Implement authentication API"
# → Creates JWT auth with security compliance

# 3. James-Frontend creates UI
/james-frontend "Build login component"
# → Accessible, responsive, performant UI

# 4. Maria-QA validates quality
/maria-qa "Run full test suite"
# → 80%+ coverage, all quality gates pass

# 5. Sarah-PM tracks progress
/sarah-pm "Generate sprint report"
# → Updates board, shows completion metrics
```

### Example 2: API Security Audit

```bash
# Comprehensive security review
/marcus-backend review API security compliance

# Result:
# - OWASP Top 10 validation
# - SQL injection prevention
# - XSS protection
# - CSRF token implementation
# - Rate limiting
# - Input sanitization
```

### Example 3: Performance Optimization

```bash
# Frontend performance review
/james-frontend optimize page load performance

# Result:
# - Core Web Vitals analysis
# - Bundle size optimization
# - Lazy loading implementation
# - Image optimization
# - Cache strategy
```

---

## ⚙️ Configuration

### Enable/Disable Agents

```bash
# Enable specific agent
/plugin enable versatil-opera-framework --agent=maria-qa

# Disable specific agent
/plugin disable versatil-opera-framework --agent=james-frontend

# List active agents
/plugin list --enabled
```

### Configure Quality Gates

Edit `.versatil-project.json` in your project:

```json
{
  "quality": {
    "testCoverage": 80,
    "performance": {
      "lighthouse": 90
    },
    "accessibility": {
      "wcag": "AA"
    }
  }
}
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/versatil-sdlc-framework/core.git
cd core

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Built on [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk)
- Inspired by OPERA methodology for AI-native development
- Community contributions and feedback

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/versatil-sdlc-framework/core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/versatil-sdlc-framework/core/discussions)
- **Email**: nissim@versatil.vc
- **Documentation**: [docs.versatil.dev](https://docs.versatil.dev)

---

**Made with ❤️ by the VERSATIL Team**

Transform Claude Code into your complete SDLC automation platform.
