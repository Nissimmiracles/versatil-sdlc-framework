# VERSATIL MCP Setup Guide v1.0

**Complete guide to setting up and configuring all 12 MCP integrations in VERSATIL Framework**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Core Development MCPs](#core-development-mcps)
   - [Playwright/Chrome MCP](#1-playwrightchrome-mcp)
   - [Playwright Stealth MCP](#2-playwright-stealth-mcp)
   - [GitHub MCP](#3-github-mcp)
   - [Exa Search MCP](#4-exa-search-mcp)
   - [GitMCP.io](#5-gitmcpio)
5. [AI/ML Operations MCPs](#aiml-operations-mcps)
   - [Vertex AI MCP](#6-vertex-ai-mcp)
   - [Supabase MCP](#7-supabase-mcp)
6. [Automation & Monitoring MCPs](#automation--monitoring-mcps)
   - [n8n MCP](#8-n8n-mcp)
   - [Semgrep MCP](#9-semgrep-mcp)
   - [Sentry MCP](#10-sentry-mcp)
   - [Shadcn MCP](#11-shadcn-mcp)
   - [Ant Design MCP](#12-ant-design-mcp)
   - [Claude Code MCP](#13-claude-code-mcp)
7. [Configuration Reference](#configuration-reference)
8. [Health Checks & Validation](#health-checks--validation)
9. [Troubleshooting](#troubleshooting)
10. [Agent-MCP Integration Matrix](#agent-mcp-integration-matrix)

---

## Overview

VERSATIL Framework integrates **12 production-ready MCP servers** across three categories:

- **Core Development MCPs (5)**: Browser automation, GitHub, search, documentation
- **AI/ML Operations MCPs (2)**: Vertex AI, Supabase vector database
- **Automation & Monitoring MCPs (6)**: n8n, Semgrep, Sentry, UI libraries, Claude Code

All MCPs are configured via `.cursor/mcp_config.json` and use environment variables for credentials stored in `~/.versatil/.env`.

---

## Prerequisites

### System Requirements

```yaml
Required:
  - Node.js: ">= 18.0.0"
  - npm: ">= 9.0.0"
  - Cursor IDE: ">= 1.7.0"
  - Git: ">= 2.40.0"

Optional:
  - Python: ">= 3.11" (for Semgrep)
  - Google Cloud SDK (for Vertex AI)
  - Docker (for n8n self-hosted)
```

### Environment Setup

1. **Install VERSATIL Framework**:
   ```bash
   npm install -g versatil-sdlc-framework
   ```

2. **Initialize Framework**:
   ```bash
   versatil init
   ```

3. **Verify Installation**:
   ```bash
   versatil --version
   npm run doctor
   ```

---

## Quick Start

### 1. Copy Environment Template

```bash
cp .env.example ~/.versatil/.env
```

### 2. Configure Credentials

Edit `~/.versatil/.env` with your API keys:

```bash
# GitHub MCP
GITHUB_TOKEN=ghp_your_github_token_here

# Exa Search MCP
EXA_API_KEY=your_exa_api_key_here

# Google Cloud (Vertex AI)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=~/.versatil/credentials/gcp-service-account.json

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# n8n (optional - for workflow automation)
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key_here

# Semgrep (optional - for advanced security features)
SEMGREP_API_KEY=your_semgrep_api_key_here
SEMGREP_APP_URL=https://semgrep.dev

# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-org-slug
```

### 3. Test MCP Health

```bash
npm run mcp:health
```

Expected output:
```
✅ Playwright MCP: Healthy
✅ GitHub MCP: Healthy
✅ Exa MCP: Healthy
✅ GitMCP: Healthy
✅ Vertex AI MCP: Healthy
✅ Supabase MCP: Healthy
...
```

---

## Core Development MCPs

### 1. Playwright/Chrome MCP

**Purpose**: Browser automation for testing (Maria-QA, James-Frontend)

#### Installation

```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
      },
      "description": "Official Microsoft Playwright MCP for browser automation"
    }
  }
}
```

#### Environment Variables

No API keys required. Optional configuration:

```bash
# ~/.versatil/.env (optional)
PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

#### Testing

```bash
# Test browser automation
npx playwright test

# Run specific test
npx playwright test tests/example.spec.ts

# Debug mode
npx playwright test --debug
```

#### Usage with Agents

**Maria-QA**:
- Visual regression testing
- E2E test execution
- Accessibility audits (axe-core)

**James-Frontend**:
- Component testing
- Performance monitoring (Lighthouse)
- Screenshot capture for design review

#### Common Issues

| Issue | Solution |
|-------|----------|
| Browsers not installed | Run `npx playwright install` |
| Timeout errors | Increase `PLAYWRIGHT_TIMEOUT` in `.env` |
| Permission denied | Run `chmod +x node_modules/.bin/playwright` |

---

### 2. Playwright Stealth MCP

**Purpose**: Bot detection bypass + design scraping with 92% effectiveness (James-Frontend, Maria-QA)

#### Installation

```bash
npm install -D playwright-extra puppeteer-extra-plugin-stealth
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "playwright-stealth": {
      "command": "node",
      "args": ["/path/to/versatil-mcp.js"],
      "env": {
        "VERSATIL_STEALTH_MODE": "true",
        "VERSATIL_RATE_LIMIT": "2000"
      },
      "description": "Playwright Stealth for bot detection bypass + design scraping (92% effectiveness)"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
VERSATIL_STEALTH_MODE=true
VERSATIL_RATE_LIMIT=2000  # Milliseconds between requests (ethical rate limiting)
```

#### Testing

```bash
# Test stealth mode
npm run test:stealth

# Test design scraping
node scripts/test-design-scraper.js https://example.com
```

#### Usage with Agents

**James-Frontend** - Design Research:
```typescript
// Research competitor design system
const report = await jamesDesignResearch.research('https://example.com');
// Returns: colors, fonts, spacing, components, accessibility, performance
```

**Maria-QA** - Reliable E2E Testing:
- Bypass anti-bot systems in tests
- 92% vs 60% success rate for bot detection avoidance

#### Ethical Guidelines

```yaml
Legal_Scraping_Only:
  Allowed:
    - Public websites for design research
    - Competitor UIs for inspiration (not copying)
    - Accessibility pattern benchmarking
    - Performance comparison studies

  Prohibited:
    - Bypassing authentication/paywalls
    - Scraping private/proprietary data
    - Direct code copying
    - Excessive requests (DDoS)
    - Ignoring robots.txt directives

Built_In_Protection:
  - Rate limiting enforced (2s/request)
  - User-agent identifies as research bot
  - Audit logs track all scraping activity
  - Public data only validation
```

#### Common Issues

| Issue | Solution |
|-------|----------|
| Bot detection still occurs | Increase rate limit, use residential proxies |
| Design data incomplete | Check if site uses shadow DOM or dynamic loading |
| Rate limit too aggressive | Adjust `VERSATIL_RATE_LIMIT` (minimum 1000ms) |

---

### 3. GitHub MCP

**Purpose**: Repository operations and CI/CD (Marcus-Backend, Sarah-PM, Alex-BA)

#### Installation

```bash
npm install -D @modelcontextprotocol/server-github
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "Official GitHub MCP for repository operations"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
GITHUB_TOKEN=ghp_your_github_token_here
```

**Generate GitHub Token**:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (Full repository access)
   - ✅ `workflow` (Update GitHub Actions)
   - ✅ `read:org` (Read org data)
   - ✅ `read:user` (Read user data)
4. Copy token to `.env`

#### Testing

```bash
# Test repository access
gh repo view owner/repo

# Test API access
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

#### Usage with Agents

**Marcus-Backend**:
- Create pull requests
- Review code changes
- Manage CI/CD workflows

**Sarah-PM**:
- Track issues and milestones
- Generate sprint reports
- Monitor project velocity

**Alex-BA**:
- Extract requirements from issues
- Link user stories to PRs
- Validate acceptance criteria

#### Common Issues

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify token in `.env`, check scopes |
| 403 Forbidden | Token needs additional scopes |
| Rate limit exceeded | Use authenticated requests, implement caching |

---

### 4. Exa Search MCP

**Purpose**: AI-powered search and research (Alex-BA, Dr.AI-ML)

#### Installation

```bash
npm install -D exa-js
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      },
      "description": "Official Exa Labs MCP for AI-powered search and research"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
EXA_API_KEY=your_exa_api_key_here
```

**Get Exa API Key**:
1. Sign up at https://exa.ai/
2. Navigate to API Keys section
3. Generate new API key
4. Copy to `.env`

#### Testing

```bash
# Test search API
node -e "const Exa = require('exa-js'); const exa = new Exa(process.env.EXA_API_KEY); exa.search('Claude AI').then(console.log);"
```

#### Usage with Agents

**Alex-BA**:
- Research similar projects
- Find requirements patterns
- Discover industry best practices

**Dr.AI-ML**:
- Research paper discovery
- Find ML framework documentation
- Benchmark analysis

#### Common Issues

| Issue | Solution |
|-------|----------|
| Invalid API key | Verify key in `.env`, regenerate if needed |
| Rate limit exceeded | Implement caching, upgrade plan |
| Empty results | Refine search query, use filters |

---

### 5. GitMCP.io

**Purpose**: GitHub repository documentation access (Alex-BA, Marcus, James, Dr.AI-ML)

#### Installation

**No local installation required** - Remote MCP server

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "gitmcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://gitmcp.io/docs"],
      "description": "GitMCP for GitHub repository documentation access"
    }
  }
}
```

#### Environment Variables

None required (uses public GitHub API)

#### Testing

```bash
# Test via npx (no installation)
npx -y mcp-remote https://gitmcp.io/docs --test
```

#### Usage with Agents

**Marcus-Backend**:
```yaml
User_Request: "Implement FastAPI authentication"

Marcus-Python_Workflow:
  1. Query GitMCP: "https://gitmcp.io/tiangolo/fastapi"
  2. Extract: OAuth2 patterns, security best practices
  3. Apply: Patterns to current implementation
  4. Store: Learnings in RAG memory
```

**James-Frontend**:
- Study React component patterns from `facebook/react`
- Learn Next.js patterns from `vercel/next.js`
- Reference Vue patterns from `vuejs/core`

**Dr.AI-ML**:
- Access ML framework docs (TensorFlow, PyTorch)
- Find deployment patterns (MLflow, Kubeflow)

#### Common Issues

| Issue | Solution |
|-------|----------|
| Remote server unavailable | Check https://gitmcp.io/status |
| Repository not found | Verify repo exists and is public |
| Rate limit exceeded | Uses GitHub API limits, wait or authenticate |

---

## AI/ML Operations MCPs

### 6. Vertex AI MCP

**Purpose**: Google Cloud AI with Gemini models (Dr.AI-ML, Marcus-Backend)

#### Installation

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud
gcloud init

# Install Vertex AI npm package
npm install -D @google-cloud/vertexai
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "vertex-ai": {
      "command": "npx",
      "args": ["-y", "vertex-ai-mcp-server"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "${GOOGLE_CLOUD_PROJECT}",
        "GOOGLE_CLOUD_LOCATION": "${GOOGLE_CLOUD_LOCATION}",
        "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}"
      },
      "description": "Google Cloud Vertex AI MCP with Gemini models"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=~/.versatil/credentials/gcp-service-account.json
```

#### Setup Service Account

```bash
# Create service account
gcloud iam service-accounts create versatil-mcp \
  --display-name="VERSATIL MCP Service Account"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
  --member="serviceAccount:versatil-mcp@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Generate key file
gcloud iam service-accounts keys create ~/.versatil/credentials/gcp-service-account.json \
  --iam-account=versatil-mcp@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com
```

#### Testing

```bash
# Test Vertex AI access
gcloud ai models list --region=$GOOGLE_CLOUD_LOCATION

# Test Gemini API
curl -X POST \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  "https://$GOOGLE_CLOUD_LOCATION-aiplatform.googleapis.com/v1/projects/$GOOGLE_CLOUD_PROJECT/locations/$GOOGLE_CLOUD_LOCATION/publishers/google/models/gemini-pro:predict" \
  -d '{"instances": [{"prompt": "Hello, Gemini!"}]}'
```

#### Usage with Agents

**Dr.AI-ML**:
- Model training and deployment
- Hyperparameter tuning
- Batch prediction
- Model evaluation

**Marcus-Backend**:
- AI-powered API endpoints
- Content generation
- Sentiment analysis
- Code generation

#### Common Issues

| Issue | Solution |
|-------|----------|
| Authentication failed | Verify service account key path, run `gcloud auth login` |
| Permission denied | Check IAM roles, ensure Vertex AI API is enabled |
| Quota exceeded | Check quotas in GCP console, request increase |
| Model not found | Verify model name and region |

---

### 7. Supabase MCP

**Purpose**: Vector database with pgvector for RAG (Marcus-Backend, Dr.AI-ML)

#### Installation

```bash
npm install -D @supabase/supabase-js
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      },
      "description": "Supabase MCP for database and vector operations"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

**Get Supabase Credentials**:
1. Sign up at https://supabase.com/
2. Create new project
3. Go to Settings > API
4. Copy URL and keys to `.env`

#### Enable pgvector Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE embeddings (
  id BIGSERIAL PRIMARY KEY,
  content TEXT,
  embedding VECTOR(1536),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for similarity search
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

#### Testing

```bash
# Test connection
node -e "const { createClient } = require('@supabase/supabase-js'); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); supabase.from('embeddings').select('*').limit(1).then(console.log);"

# Test vector search
npm run test:rag
```

#### Usage with Agents

**Marcus-Backend**:
- Store code patterns
- Semantic search for similar code
- RAG for API documentation

**Dr.AI-ML**:
- Store ML model embeddings
- Similarity search for training data
- Feature vector storage

#### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Verify URL in `.env`, check project status |
| Permission denied | Use service key for admin operations |
| Vector extension not found | Run `CREATE EXTENSION vector;` in SQL editor |
| Slow similarity search | Create ivfflat index, adjust index parameters |

---

## Automation & Monitoring MCPs

### 8. n8n MCP

**Purpose**: Workflow automation with 525+ nodes (Sarah-PM, Marcus, Maria-QA)

#### Installation

```bash
# Option 1: Self-hosted (Docker)
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Option 2: Cloud (skip installation)
# Sign up at https://n8n.io/
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-nodes-mcp"],
      "env": {
        "N8N_BASE_URL": "${N8N_BASE_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      },
      "description": "n8n MCP for workflow automation"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
N8N_BASE_URL=https://your-n8n-instance.com  # or http://localhost:5678
N8N_API_KEY=your_n8n_api_key_here
```

**Generate n8n API Key**:
1. Open n8n instance
2. Go to Settings > API
3. Generate new API key
4. Copy to `.env`

#### Testing

```bash
# Test n8n API
curl -H "X-N8N-API-KEY: $N8N_API_KEY" $N8N_BASE_URL/api/v1/workflows

# Test workflow execution
npm run test:n8n
```

#### Usage with Agents

**Sarah-PM**:
- Automated sprint reports
- Milestone notifications
- Team status updates

**Marcus-Backend**:
- Deploy webhooks
- CI/CD triggers
- Database backups

**Maria-QA**:
- Test result notifications
- Bug tracking automation
- Quality gate enforcement

#### Common Issues

| Issue | Solution |
|-------|----------|
| n8n not running | Start Docker container, check logs |
| Invalid API key | Regenerate in n8n settings |
| Workflow not found | Verify workflow ID, check permissions |

---

### 9. Semgrep MCP

**Purpose**: Security scanning for 30+ languages (Marcus-Backend, Maria-QA, Dr.AI-ML)

#### Installation

```bash
# Install via pip
pip install semgrep

# Or via Homebrew (macOS)
brew install semgrep
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "semgrep": {
      "command": "npx",
      "args": ["-y", "semgrep-mcp"],
      "env": {
        "SEMGREP_API_KEY": "${SEMGREP_API_KEY}",
        "SEMGREP_APP_URL": "${SEMGREP_APP_URL}"
      },
      "description": "Semgrep MCP for security scanning"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env (optional for cloud features)
SEMGREP_API_KEY=your_semgrep_api_key_here
SEMGREP_APP_URL=https://semgrep.dev
```

**Get Semgrep API Key** (optional):
1. Sign up at https://semgrep.dev/
2. Go to Settings > Tokens
3. Generate new token
4. Copy to `.env`

#### Testing

```bash
# Test local scan (no API key needed)
semgrep --config=auto .

# Test cloud features
semgrep login
semgrep ci
```

#### Usage with Agents

**Marcus-Backend**:
- OWASP Top 10 detection
- SQL injection prevention
- API security validation

**Maria-QA**:
- Pre-commit security scans
- Vulnerability reporting
- Security regression testing

**Dr.AI-ML**:
- ML model security
- Training data validation
- Dependency scanning

#### Common Issues

| Issue | Solution |
|-------|----------|
| Semgrep not found | Install via pip or brew |
| Too many findings | Use `--config=p/security-audit` for fewer rules |
| Slow scans | Use `.semgrepignore`, cache results |

---

### 10. Sentry MCP

**Purpose**: Error monitoring with AI analysis (Maria-QA, Marcus, Sarah-PM)

#### Installation

```bash
npm install -D @sentry/node @sentry/tracing
```

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "sentry-mcp-stdio"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}",
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
        "SENTRY_ORG": "${SENTRY_ORG}"
      },
      "description": "Sentry MCP for error monitoring with AI-powered analysis"
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=your-org-slug
```

**Get Sentry Credentials**:
1. Sign up at https://sentry.io/
2. Create new project
3. Copy DSN from project settings
4. Generate auth token: Settings > API > Auth Tokens
5. Copy to `.env`

#### Testing

```bash
# Test Sentry SDK
node -e "const Sentry = require('@sentry/node'); Sentry.init({ dsn: process.env.SENTRY_DSN }); Sentry.captureMessage('Test from VERSATIL');"

# Check Sentry dashboard for test event
```

#### Usage with Agents

**Maria-QA**:
- Error trend analysis
- Test failure investigation
- Performance regression detection

**Marcus-Backend**:
- Production error monitoring
- API failure tracking
- Performance profiling

**Sarah-PM**:
- Error impact reports
- Sprint retrospective data
- Quality metrics tracking

#### Common Issues

| Issue | Solution |
|-------|----------|
| Events not appearing | Verify DSN, check network connectivity |
| Rate limit exceeded | Upgrade plan, implement sampling |
| Too many events | Add filters, use `beforeSend` hook |

---

### 11. Shadcn MCP

**Purpose**: Component library integration (James-Frontend)

#### Installation

```bash
npx shadcn-ui@latest init
```

Interactive setup:
```
✔ Would you like to use TypeScript? … yes
✔ Which style would you like to use? › Default
✔ Which color would you like to use as base color? › Slate
✔ Where is your global CSS file? … src/styles/globals.css
✔ Would you like to use CSS variables for colors? … yes
✔ Where is your tailwind.config.js located? … tailwind.config.js
✔ Configure the import alias for components? … @/components
✔ Configure the import alias for utils? … @/lib/utils
```

#### Configuration

`.cursor/mcp_config.json` (auto-configured by VERSATIL MCP):
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn-ui@latest"],
      "description": "Shadcn UI component library integration"
    }
  }
}
```

#### Environment Variables

None required (uses local configuration)

#### Testing

```bash
# Add a test component
npx shadcn-ui@latest add button

# Verify component
cat src/components/ui/button.tsx
```

#### Usage with James-Frontend

```typescript
// James auto-suggests Shadcn components
import { Button } from "@/components/ui/button";

export function LoginForm() {
  return (
    <Button variant="default" size="lg">
      Sign In
    </Button>
  );
}
```

#### Common Issues

| Issue | Solution |
|-------|----------|
| Component not found | Run `npx shadcn-ui@latest add <component>` |
| Styling issues | Verify Tailwind config, check CSS variables |
| TypeScript errors | Update `tsconfig.json` paths |

---

### 12. Ant Design MCP

**Purpose**: React component system (James-Frontend)

#### Installation

```bash
npm install antd
```

#### Configuration

`.cursor/mcp_config.json` (auto-configured by VERSATIL MCP):
```json
{
  "mcpServers": {
    "antd": {
      "command": "node",
      "args": ["/path/to/antd-mcp-wrapper.js"],
      "description": "Ant Design React component system"
    }
  }
}
```

#### Environment Variables

None required (uses local configuration)

#### Testing

```bash
# Create test component
cat > src/components/AntdTest.tsx << 'EOF'
import { Button } from 'antd';

export function AntdTest() {
  return <Button type="primary">Ant Design Button</Button>;
}
EOF

# Run dev server
npm run dev
```

#### Usage with James-Frontend

```typescript
import { Button, Form, Input } from 'antd';

export function LoginForm() {
  return (
    <Form>
      <Form.Item name="email" rules={[{ required: true }]}>
        <Input placeholder="Email" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Sign In
      </Button>
    </Form>
  );
}
```

#### Theme Customization

```typescript
// src/styles/antd-theme.ts
export const antdTheme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};
```

#### Common Issues

| Issue | Solution |
|-------|----------|
| Styles not loading | Import `antd/dist/reset.css` in main file |
| Theme not applied | Wrap app in `ConfigProvider` with theme |
| Bundle size large | Use tree-shaking, import specific components |

---

### 13. Claude Code MCP

**Purpose**: Enhanced Claude Code integration

#### Installation

No separate installation required (comes with VERSATIL)

#### Configuration

`.cursor/mcp_config.json`:
```json
{
  "mcpServers": {
    "claude-code-mcp": {
      "command": "npx",
      "args": ["-y", "@steipete/claude-code-mcp@latest"],
      "env": {
        "MCP_CLAUDE_DEBUG": "false"
      }
    }
  }
}
```

#### Environment Variables

```bash
# ~/.versatil/.env (optional)
MCP_CLAUDE_DEBUG=false
```

#### Testing

```bash
# Test Claude Code MCP
npm run test:claude-mcp
```

#### Usage

Automatic integration with all VERSATIL agents. No manual usage required.

---

## Configuration Reference

### Complete .cursor/mcp_config.json

```json
{
  "mcpServers": {
    "claude-opera": {
      "command": "node",
      "args": ["/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil-mcp.js", "/Users/nissimmenashe/VERSATIL SDLC FW"],
      "cwd": "/Users/nissimmenashe/VERSATIL SDLC FW",
      "env": {
        "NODE_ENV": "production",
        "VERSATIL_MCP_MODE": "true",
        "VERSATIL_HOME": "~/.versatil",
        "VERSATIL_PROJECT_PATH": "/Users/nissimmenashe/VERSATIL SDLC FW",
        "VERSATIL_RULES_ENABLED": "true",
        "RULE_1_PARALLEL_EXECUTION": "true",
        "RULE_2_STRESS_TESTING": "true",
        "RULE_3_DAILY_AUDIT": "true",
        "RULE_4_ONBOARDING": "true",
        "RULE_5_RELEASES": "true"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "~/.cache/ms-playwright"
      },
      "description": "Official Microsoft Playwright MCP for browser automation (Maria-QA, James-Frontend)"
    },
    "playwright-stealth": {
      "command": "node",
      "args": ["/Users/nissimmenashe/VERSATIL SDLC FW/bin/versatil-mcp.js"],
      "env": {
        "VERSATIL_STEALTH_MODE": "true",
        "VERSATIL_RATE_LIMIT": "2000"
      },
      "description": "Playwright Stealth for bot detection bypass + design scraping (James-Frontend, Maria-QA). 92% effectiveness, ethical rate limiting, legal scraping only."
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "Official GitHub MCP for repository operations (Marcus-Backend, Sarah-PM, Alex-BA)"
    },
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "${EXA_API_KEY}"
      },
      "description": "Official Exa Labs MCP for AI-powered search and research (Alex-BA, Dr.AI-ML)"
    },
    "vertex-ai": {
      "command": "npx",
      "args": ["-y", "vertex-ai-mcp-server"],
      "env": {
        "GOOGLE_CLOUD_PROJECT": "${GOOGLE_CLOUD_PROJECT}",
        "GOOGLE_CLOUD_LOCATION": "${GOOGLE_CLOUD_LOCATION}",
        "GOOGLE_APPLICATION_CREDENTIALS": "${GOOGLE_APPLICATION_CREDENTIALS}"
      },
      "description": "Google Cloud Vertex AI MCP with Gemini models (Dr.AI-ML, Marcus-Backend)"
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "supabase-mcp"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_ANON_KEY": "${SUPABASE_ANON_KEY}",
        "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}"
      },
      "description": "Supabase MCP for database and vector operations (Marcus-Backend, Dr.AI-ML)"
    },
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-nodes-mcp"],
      "env": {
        "N8N_BASE_URL": "${N8N_BASE_URL}",
        "N8N_API_KEY": "${N8N_API_KEY}"
      },
      "description": "n8n MCP for workflow automation (Sarah-PM, Marcus, Maria-QA)"
    },
    "semgrep": {
      "command": "npx",
      "args": ["-y", "semgrep-mcp"],
      "env": {
        "SEMGREP_API_KEY": "${SEMGREP_API_KEY}",
        "SEMGREP_APP_URL": "${SEMGREP_APP_URL}"
      },
      "description": "Semgrep MCP for security scanning (Marcus-Backend, Maria-QA, Dr.AI-ML)"
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "sentry-mcp-stdio"],
      "env": {
        "SENTRY_DSN": "${SENTRY_DSN}",
        "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}",
        "SENTRY_ORG": "${SENTRY_ORG}"
      },
      "description": "Sentry MCP for error monitoring with AI-powered analysis (Maria-QA, Marcus, Sarah-PM)"
    },
    "claude-code-mcp": {
      "command": "npx",
      "args": ["-y", "@steipete/claude-code-mcp@latest"],
      "env": {
        "MCP_CLAUDE_DEBUG": "false"
      }
    },
    "gitmcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://gitmcp.io/docs"],
      "description": "GitMCP for GitHub repository documentation access (Alex-BA, Marcus, James, Dr.AI-ML)"
    }
  }
}
```

---

## Health Checks & Validation

### Run Health Check

```bash
npm run mcp:health
```

### Expected Output

```
🔍 VERSATIL MCP Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Core Development MCPs:
  ✅ Playwright MCP: Healthy
  ✅ Playwright Stealth MCP: Healthy
  ✅ GitHub MCP: Healthy
  ✅ Exa Search MCP: Healthy
  ✅ GitMCP.io: Healthy (remote)

AI/ML Operations MCPs:
  ✅ Vertex AI MCP: Healthy
  ✅ Supabase MCP: Healthy

Automation & Monitoring MCPs:
  ⚠️  n8n MCP: Not configured (optional)
  ✅ Semgrep MCP: Healthy
  ✅ Sentry MCP: Healthy
  ✅ Shadcn MCP: Healthy
  ✅ Ant Design MCP: Healthy
  ✅ Claude Code MCP: Healthy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 11/12 MCPs healthy (n8n optional)
```

### Validate MCP Configuration

```bash
npm run mcp:validate
```

This runs `scripts/validate-mcp-config.cjs` which:
- Checks `.cursor/mcp_config.json` syntax
- Verifies all environment variables are set
- Tests MCP server connectivity
- Reports missing or invalid configurations

---

## Troubleshooting

See [docs/guides/mcp-troubleshooting.md](./mcp-troubleshooting.md) for detailed troubleshooting guide.

### Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| MCP not appearing in Cursor | Restart Cursor, verify `.cursor/mcp_config.json` |
| Authentication errors | Check `.env` file, verify API keys |
| Timeout issues | Increase timeout in MCP config |
| Permission denied | Check file permissions, use correct service account |
| Rate limit exceeded | Implement caching, upgrade API plan |

### Debugging Commands

```bash
# Check MCP logs
tail -f ~/.versatil/logs/mcp.log

# Test specific MCP
npm run mcp:test playwright

# Validate environment
npm run env:validate

# Reset MCP configuration
npm run mcp:reset
```

---

## Agent-MCP Integration Matrix

See [docs/reference/mcp-agent-matrix.md](../reference/mcp-agent-matrix.md) for complete agent-MCP mapping.

### Quick Reference

| Agent | Primary MCPs | Use Cases |
|-------|-------------|-----------|
| **Maria-QA** | Playwright, Playwright Stealth, Semgrep, Sentry | Testing, security scans, error monitoring |
| **James-Frontend** | Playwright, Playwright Stealth, Shadcn, Ant Design | UI testing, design research, component libraries |
| **Marcus-Backend** | GitHub, Vertex AI, Supabase, Semgrep, n8n, Sentry | API development, security, automation, monitoring |
| **Sarah-PM** | GitHub, n8n, Sentry | Project management, automation, metrics |
| **Alex-BA** | GitHub, Exa, GitMCP | Requirements research, documentation access |
| **Dr.AI-ML** | Vertex AI, Supabase, Semgrep, Exa, GitMCP | ML development, vector search, research |
| **Dana-Database** | Supabase | Database operations, migrations, RLS policies |
| **Oliver-MCP** | All MCPs | MCP orchestration, intelligent routing |

---

## Support & Resources

- **Documentation**: [docs/guides/](../guides/)
- **Troubleshooting**: [docs/guides/mcp-troubleshooting.md](./mcp-troubleshooting.md)
- **GitHub Issues**: https://github.com/versatil-sdlc-framework/issues
- **Community Discord**: https://discord.gg/versatil

---

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Maintained By**: VERSATIL Team
