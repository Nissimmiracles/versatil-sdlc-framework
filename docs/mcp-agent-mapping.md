# 🎯 MCP-Agent Mapping Guide

> **Version**: 4.2.0 (In Progress)
> **Last Updated**: 2025-10-06
> **Purpose**: Strategic mapping of MCP servers to VERSATIL agents

---

## 📊 Overview

This document defines which MCP (Model Context Protocol) servers each VERSATIL agent uses and why.

---

## 🤖 Agent-MCP Mapping

### 1. Maria-QA (Quality Guardian)

**Primary MCPs:**
- ✅ **Playwright MCP** (`@playwright/mcp`) - Browser automation for E2E testing
- ✅ **Chrome MCP** (custom) - Chromium-based testing
- 🔄 **Semgrep MCP** (planned) - Code security scanning
- 🔄 **Sentry MCP** (planned) - Error monitoring and tracking

**Use Cases:**
- E2E testing across browsers
- Visual regression testing
- Accessibility testing (WCAG 2.1 AA)
- Performance testing
- Security vulnerability scanning
- Error tracking and monitoring

**Example Workflows:**
```typescript
// Maria executes comprehensive test suite
const testResult = await playwrightMCPExecutor.executePlaywrightMCP('navigate', {
  url: 'https://app.example.com'
});

// Take accessibility snapshot
const a11ySnapshot = await playwrightMCPExecutor.executePlaywrightMCP('accessibility_snapshot', {});

// Maria reports results with quality scores
```

---

### 2. James-Frontend (UI/UX Expert)

**Primary MCPs:**
- ✅ **Playwright MCP** (`@playwright/mcp`) - UI testing and validation
- ✅ **Shadcn MCP** (custom) - Component library analysis
- 🔄 **Browserbase MCP** (planned) - Cloud browser automation

**Use Cases:**
- Component testing and validation
- Responsive design verification
- Cross-browser compatibility
- UI performance optimization
- Design system compliance
- Visual regression testing

**Example Workflows:**
```typescript
// James validates component accessibility
const componentTest = await playwrightMCPExecutor.executePlaywrightMCP('click', {
  selector: '.button-primary'
});

// Analyze Shadcn UI usage
const componentAnalysis = await shadcnMCPExecutor.executeShadcnMCP('scan_project', {});
```

---

### 3. Marcus-Backend (System Architect)

**Primary MCPs:**
- ✅ **GitHub MCP** (`@modelcontextprotocol/server-github`) - Repository operations
- ✅ **Supabase MCP** (using existing SDK) - Database management
- 🔄 **Semgrep MCP** (planned) - Code security scanning
- 🔄 **Sentry MCP** (planned) - Backend error monitoring

**Use Cases:**
- API security validation
- Database schema management
- Code review automation
- Performance monitoring
- Error tracking
- CI/CD pipeline integration

**Example Workflows:**
```typescript
// Marcus analyzes repository structure
const repoAnalysis = await githubMCPExecutor.executeGitHubMCP('repository_analysis', {
  owner: 'org',
  repo: 'project'
});

// Check OWASP compliance
const securityScan = await semgrepMCPExecutor.executeSemgrepMCP('scan', {
  path: './src'
});
```

---

### 4. Sarah-PM (Project Coordinator)

**Primary MCPs:**
- ✅ **GitHub MCP** (`@modelcontextprotocol/server-github`) - Project management
- 🔄 **n8n MCP** (planned) - Workflow automation
- 🔄 **Sentry MCP** (planned) - Release health monitoring

**Use Cases:**
- Issue tracking and management
- Sprint planning and tracking
- Release coordination
- Workflow automation
- Team communication
- Progress reporting

**Example Workflows:**
```typescript
// Sarah creates release from issues
const release = await githubMCPExecutor.executeGitHubMCP('create_release', {
  tag: 'v4.2.0',
  notes: 'Auto-generated release notes'
});

// Trigger n8n workflow for deployment
const deployment = await n8nMCPExecutor.executeN8nMCP('trigger_workflow', {
  workflow: 'deploy-production'
});
```

---

### 5. Alex-BA (Requirements Analyst)

**Primary MCPs:**
- ✅ **Exa Search MCP** (`exa-mcp-server`) - Web research and discovery
- ✅ **GitHub MCP** (`@modelcontextprotocol/server-github`) - Requirements tracking
- 🔄 **Perplexity MCP** (planned) - AI-powered research

**Use Cases:**
- Market research and competitive analysis
- Technology stack research
- Best practices discovery
- Requirements gathering
- User story creation
- Competitive intelligence

**Example Workflows:**
```typescript
// Alex researches latest React patterns
const research = await exaMCPExecutor.executeExaMCP('web_search', {
  query: 'React Server Components best practices 2025',
  numResults: 10
});

// Company competitive analysis
const competitorAnalysis = await exaMCPExecutor.executeExaMCP('company_research', {
  company: 'Competitor Inc'
});

// Find code examples
const codeExamples = await exaMCPExecutor.executeExaMCP('get_code_context', {
  library: 'Next.js 15',
  topic: 'App Router'
});
```

---

### 6. Dr.AI-ML (AI/ML Specialist)

**Primary MCPs:**
- ✅ **Exa Search MCP** (`exa-mcp-server`) - ML research and documentation
- 🔄 **Vertex AI MCP** (planned) - Google Cloud ML deployment
- ✅ **Supabase MCP** (using existing SDK) - Vector storage

**Use Cases:**
- ML model research
- Model deployment to cloud
- Vector database operations
- AI/ML documentation discovery
- Performance optimization
- Model monitoring

**Example Workflows:**
```typescript
// Dr.AI-ML researches latest ML models
const mlResearch = await exaMCPExecutor.executeExaMCP('web_search', {
  query: 'GPT-4 Turbo fine-tuning best practices',
  type: 'neural'
});

// Deploy model to Vertex AI
const deployment = await vertexAIMCPExecutor.executeVertexAIMCP('deploy_model', {
  model: 'custom-classifier',
  endpoint: 'production'
});
```

---

## 📊 MCP Coverage Matrix

| MCP Server | Maria-QA | James | Marcus | Sarah | Alex | Dr.AI-ML |
|------------|----------|-------|--------|-------|------|----------|
| Playwright MCP | ✅ Primary | ✅ Primary | - | - | - | - |
| Chrome MCP | ✅ Primary | ✅ Secondary | - | - | - | - |
| GitHub MCP | - | - | ✅ Primary | ✅ Primary | ✅ Secondary | - |
| Shadcn MCP | - | ✅ Primary | - | - | - | - |
| Exa Search MCP | - | - | - | - | ✅ Primary | ✅ Primary |
| Supabase MCP | - | - | ✅ Primary | - | - | ✅ Secondary |
| Semgrep MCP | 🔄 Planned | - | 🔄 Planned | - | - | - |
| Sentry MCP | 🔄 Planned | - | 🔄 Planned | 🔄 Planned | - | - |
| n8n MCP | - | - | - | 🔄 Planned | - | - |
| Vertex AI MCP | - | - | - | - | - | 🔄 Planned |

**Legend:**
- ✅ Implemented
- 🔄 Planned (Phase 2/3)
- `-` Not applicable

---

## 🚀 Implementation Status

### Phase 1: Core MCPs (Week 1) - IN PROGRESS
- ✅ Playwright MCP - Official Microsoft package added
- ✅ GitHub MCP - Official package added
- ✅ Exa Search MCP - Official Exa Labs package added
- 🔄 Update MCP integration layer
- 🔄 Update agent configurations

### Phase 2: AI/ML MCPs (Week 2) - PLANNED
- 🔄 Vertex AI MCP - Google Cloud integration
- 🔄 Supabase MCP - Enhanced database operations

### Phase 3: Automation MCPs (Week 3) - PLANNED
- 🔄 n8n MCP - Workflow automation
- 🔄 Semgrep MCP - Security scanning
- 🔄 Sentry MCP - Error monitoring

### Phase 4: Testing & Release (Week 4) - PLANNED
- 🔄 Integration testing
- 🔄 Documentation updates
- 🔄 v4.2.0 release

---

## 🎯 Benefits by Agent

### Maria-QA
- **+40% testing efficiency** from advanced browser automation
- **Real-time accessibility snapshots** for WCAG compliance
- **Automated security scanning** for vulnerability detection

### James-Frontend
- **Visual regression testing** across browsers
- **Component usage analytics** from Shadcn MCP
- **Performance insights** from browser automation

### Marcus-Backend
- **Automated code review** via GitHub MCP
- **OWASP compliance checking** via Semgrep
- **Real-time error monitoring** via Sentry

### Sarah-PM
- **Automated release management** via GitHub MCP
- **Workflow automation** via n8n (500+ app integrations)
- **Release health tracking** via Sentry

### Alex-BA
- **Real-time market research** via Exa Search
- **Competitive intelligence** from company research
- **Code examples discovery** for requirements

### Dr.AI-ML
- **ML documentation discovery** via Exa Search
- **Cloud deployment automation** via Vertex AI
- **Vector operations** via Supabase

---

## 📚 Configuration Examples

### Playwright MCP (Maria-QA, James-Frontend)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
      }
    }
  }
}
```

### Exa Search MCP (Alex-BA, Dr.AI-ML)
```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      }
    }
  }
}
```

### GitHub MCP (Marcus-Backend, Sarah-PM)
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

---

## 🔗 Resources

- **Playwright MCP**: https://github.com/microsoft/playwright-mcp
- **GitHub MCP**: https://github.com/modelcontextprotocol/servers
- **Exa Search MCP**: https://github.com/exa-labs/exa-mcp-server
- **MCP SDK**: https://github.com/modelcontextprotocol/typescript-sdk

---

**Maintained by**: VERSATIL Development Team
**For Issues**: https://github.com/Nissimmiracles/versatil-sdlc-framework/issues
**Version**: 4.2.0 (In Progress)
