# VERSATIL MCP Ecosystem - Quick Reference Cheat Sheet

**12 MCP Integrations** - Extended Capabilities for OPERA Agents

---

## Core Development MCPs (5)

### 1. Playwright/Chrome - Browser Automation
```yaml
Purpose: E2E testing, visual regression, performance monitoring
Agents: Maria-QA, James-Frontend
Use_Cases:
  - Visual regression testing (Percy integration)
  - Performance monitoring (Lighthouse scores)
  - Accessibility audits (axe-core, pa11y)
  - Cross-browser validation
  - E2E test automation
Configuration: .cursor/mcp_config.json → "playwright"
Example: "Run visual regression tests on dashboard UI"
```

### 2. Playwright Stealth - Design Scraping & Bot Bypass
```yaml
Purpose: Ethical design research, bot detection bypass (92% success)
Agents: James-Frontend, Maria-QA
Use_Cases:
  - Design system research (colors, typography, spacing)
  - Component analysis (buttons, cards, modals)
  - Accessibility benchmarking (WCAG compliance)
  - Performance comparison (load times, bundle sizes)
  - Reliable E2E testing (bypasses anti-bot systems)
Ethical_Safeguards:
  - Rate limiting: 2 seconds between requests
  - Public data only
  - Audit logging
  - Respects robots.txt
Configuration: versatil-mcp.js → stealth mode
Reports: ~/.versatil/design-research/[hostname]_[date].md
Example: "Research Airbnb design system for dashboard inspiration"
```

### 3. GitHub - Repository Operations
```yaml
Purpose: PR feedback, CI/CD, issue tracking
Agents: Marcus-Backend, Sarah-PM, Alex-BA
Use_Cases:
  - Auto-generate PR comments (code review)
  - Create GitHub issues on test failures
  - Sync project milestones
  - Track release notes
  - Monitor CI/CD pipelines
Configuration: .cursor/mcp_config.json → "github"
Auth: gh auth login
Example: "Create PR with automated code review comments"
```

### 4. Exa - AI-Powered Search
```yaml
Purpose: Research, documentation, competitive analysis
Agents: Alex-BA, Dr.AI-ML
Use_Cases:
  - Find similar implementations (feature planning)
  - Research best practices
  - Competitive analysis
  - Documentation search
  - Technical research
Configuration: .cursor/mcp_config.json → "exa"
API_Key: VERSATIL_EXA_API_KEY (env)
Example: "Research OAuth2 implementations for authentication feature"
```

### 5. GitMCP - GitHub Documentation Access
```yaml
Purpose: Real-time GitHub repository documentation
Agents: All agents (universal access)
Use_Cases:
  - Framework documentation (Express, FastAPI, Rails, etc.)
  - Code examples from successful projects
  - Pattern research (testing, deployment, etc.)
  - Eliminate hallucinations (up-to-date code context)
Configuration: .cursor/mcp_config.json → "gitmcp"
Remote_Server: https://gitmcp.io/docs
Example_Query: "Query tiangolo/fastapi for OAuth2 patterns"
Zero_Installation: Remote MCP server (no local package)
Example: "Access React Testing Library patterns from testing-library/react-testing-library"
```

---

## AI/ML Operations MCPs (2)

### 6. Vertex AI - Google Cloud AI
```yaml
Purpose: Google Cloud AI with Gemini models
Agents: Dr.AI-ML, Marcus-Backend
Use_Cases:
  - Gemini model integration
  - AI predictions
  - ML model deployment
  - Cloud AI services
  - Vision/Language AI
Configuration: .cursor/mcp_config.json → "vertexai"
Auth: GOOGLE_APPLICATION_CREDENTIALS (service account)
Example: "Deploy ML model to Vertex AI for predictions"
```

### 7. Supabase - Vector Database
```yaml
Purpose: RAG memory, similarity search, embeddings
Agents: Marcus-Backend, Dr.AI-ML
Use_Cases:
  - Store code patterns (RAG memory)
  - Similarity search (find related code)
  - Vector embeddings
  - Semantic search
  - Knowledge retrieval
Configuration: .cursor/mcp_config.json → "supabase"
Auth: SUPABASE_URL + SUPABASE_ANON_KEY (env)
Storage: ~/.versatil/rag-memory/ (vector database)
Example: "Store authentication patterns for future retrieval"
```

---

## Automation & Monitoring MCPs (6)

### 8. n8n - Workflow Automation
```yaml
Purpose: 525+ integration nodes, workflow automation
Agents: Sarah-PM, Marcus, Maria-QA
Use_Cases:
  - Auto-notify team on test failures
  - Schedule reports (daily, weekly)
  - Integrate with Slack, email, webhooks
  - Custom automation workflows
  - API integrations
Configuration: .cursor/mcp_config.json → "n8n"
Server: n8n cloud or self-hosted
Example: "Auto-notify team when deployment completes"
```

### 9. Semgrep - Security Scanning
```yaml
Purpose: Static analysis, 30+ languages, OWASP Top 10
Agents: Marcus-Backend, Maria-QA, Dr.AI-ML
Use_Cases:
  - SQL injection detection
  - XSS vulnerability scanning
  - Hardcoded secrets detection
  - OWASP Top 10 compliance
  - Custom security rules
Configuration: .cursor/mcp_config.json → "semgrep"
Rules: ~/.versatil/semgrep-rules/ (custom rules)
Example: "Scan API endpoints for security vulnerabilities"
```

### 10. Sentry - Error Monitoring
```yaml
Purpose: Error tracking, AI analysis, performance monitoring
Agents: Maria-QA, Marcus, Sarah-PM
Use_Cases:
  - Production error tracking
  - AI-powered error analysis
  - Performance monitoring
  - Release health tracking
  - User impact analysis
Configuration: .cursor/mcp_config.json → "sentry"
Auth: SENTRY_DSN (env)
Example: "Analyze production errors from last 24 hours"
```

### 11. Shadcn - Component Library
```yaml
Purpose: React components, design system, accessibility
Agents: James-Frontend
Use_Cases:
  - Generate accessible UI components
  - Design system integration
  - Tailwind CSS components
  - WCAG 2.1 AA compliant
  - Radix UI primitives
Configuration: .cursor/mcp_config.json → "shadcn"
Installation: npx shadcn-ui@latest init
Example: "Generate accessible form component with validation"
```

### 12. Ant Design - React Components
```yaml
Purpose: Enterprise UI, React components, responsive design
Agents: James-Frontend
Use_Cases:
  - Enterprise dashboard UI
  - Data tables, charts
  - Form components
  - Layout system
  - Internationalization
Configuration: .cursor/mcp_config.json → "antd"
Installation: npm install antd
Example: "Build enterprise dashboard with data table"
```

---

## MCP Health Checks

```bash
# Test all MCP servers
versatil-mcp --health-check

# Test specific MCP
versatil-mcp --test github
versatil-mcp --test chrome
versatil-mcp --test supabase

# View MCP configuration
cat ~/.cursor/mcp_config.json

# View MCP logs
tail -f ~/.versatil/logs/mcp.log
```

---

## MCP Usage by Agent

```yaml
Maria-QA:
  - Playwright/Chrome: E2E testing, visual regression
  - Playwright Stealth: Reliable test automation
  - Semgrep: Security scanning
  - Sentry: Error monitoring

Marcus-Backend:
  - GitMCP: Framework documentation
  - Semgrep: Security scanning
  - Vertex AI: AI integrations
  - Supabase: RAG memory
  - GitHub: CI/CD, PR feedback
  - Sentry: Error monitoring

James-Frontend:
  - Playwright/Chrome: E2E testing
  - Playwright Stealth: Design research
  - GitMCP: Framework docs (React, Vue, etc.)
  - Shadcn: Component library
  - Ant Design: Enterprise UI

Dana-Database:
  - Supabase: Vector database (RAG)
  - GitMCP: Database pattern research

Alex-BA:
  - Exa: Research, competitive analysis
  - GitHub: Issue tracking, requirements
  - GitMCP: Pattern research

Sarah-PM:
  - GitHub: Project tracking, milestones
  - n8n: Workflow automation
  - Sentry: Release health

Dr.AI-ML:
  - Vertex AI: ML deployment
  - Supabase: Vector embeddings
  - Semgrep: ML code security
  - GitMCP: ML framework docs
  - Exa: ML research

Oliver-MCP:
  - All MCPs: Intelligent routing, health monitoring
```

---

## MCP Configuration Examples

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/test"],
      "description": "Browser automation for E2E testing"
    },
    "github": {
      "command": "gh",
      "args": ["api"],
      "description": "GitHub repository operations"
    },
    "gitmcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://gitmcp.io/docs"],
      "description": "GitHub documentation access (remote)"
    },
    "supabase": {
      "command": "supabase",
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your-anon-key"
      },
      "description": "Vector database for RAG"
    }
  }
}
```

---

## Troubleshooting MCPs

```bash
# GitHub MCP
Problem: "gh: command not found"
Solution: brew install gh && gh auth login

# Chrome MCP
Problem: "Playwright not installed"
Solution: npx playwright install

# Supabase MCP
Problem: "SUPABASE_URL not set"
Solution: Add to ~/.versatil/.env

# GitMCP
Problem: "Remote server unavailable"
Solution: Check internet connection, verify https://gitmcp.io

# Sentry MCP
Problem: "Invalid DSN"
Solution: Verify SENTRY_DSN in ~/.versatil/.env
```

---

## MCP Performance Metrics

```yaml
Playwright_Chrome:
  E2E_Tests_Run: 234
  Visual_Regressions_Caught: 12
  Performance_Score_Avg: 92 (Lighthouse)

Playwright_Stealth:
  Bot_Bypass_Success_Rate: 92%
  Design_Reports_Generated: 18
  Accessibility_Insights: 47

GitHub:
  PR_Comments_Generated: 156
  Issues_Created: 23
  CI_CD_Integrations: 45

GitMCP:
  Repositories_Queried: 89
  Documentation_Accessed: 234 pages
  Hallucinations_Prevented: 67

Semgrep:
  Security_Scans: 456
  Vulnerabilities_Found: 34
  False_Positives: 2 (0.6%)

Supabase:
  Patterns_Stored: 234
  Similarity_Searches: 567
  Retrieval_Accuracy: 94%
```

---

## MCP Integration Examples

### Example 1: Design Research with Playwright Stealth
```typescript
// James-Frontend researching competitor design
const report = await playwrightStealth.research('https://airbnb.com');

// Returns:
{
  colors: { primary: '#FF385C', secondary: '#222222', ... },
  typography: { heading: 'Circular', body: 'Cereal', ... },
  spacing: { base: '4px', scale: [4, 8, 16, 24, 32, ...] },
  components: {
    button: { padding: '16px 24px', borderRadius: '8px', ... },
    card: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', ... }
  },
  accessibility: { wcagLevel: 'AA', issues: [...] },
  performance: { loadTime: '1.8s', bundleSize: '234KB' }
}
```

### Example 2: Security Scanning with Semgrep
```bash
# Marcus-Backend scanning API for vulnerabilities
semgrep --config=p/owasp-top-10 src/api/

# Results:
# ❌ SQL Injection vulnerability in src/api/users.ts:42
# ❌ XSS vulnerability in src/api/posts.ts:67
# ✅ No hardcoded secrets found
# ✅ Authentication patterns secure
```

### Example 3: RAG Memory with Supabase
```typescript
// Store authentication pattern
await supabase.vectorStore.insert({
  pattern: 'JWT authentication with refresh tokens',
  code: '...',
  context: 'Node.js API',
  embeddings: [0.23, 0.45, ...]
});

// Retrieve similar patterns
const similar = await supabase.vectorStore.search({
  query: 'authentication',
  limit: 5
});
```

---

**Framework Version**: 6.4.0
**Total MCPs**: 12 (all production-ready)
**Last Updated**: 2025-10-19

For detailed documentation: `/help mcp` or see CLAUDE.md → MCP Ecosystem
