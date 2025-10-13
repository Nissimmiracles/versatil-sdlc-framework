# VERSATIL OPERA Agents

**Version**: 6.4.0
**Total Agents**: 7 (Dana, Maria, James, Marcus, Sarah, Alex, Dr.AI-ML)
**Methodology**: OPERA (Orchestrated Parallel Engineering & Requirements Analysis)

---

## Overview

VERSATIL includes **7 specialized OPERA agents** that work collaboratively to deliver end-to-end software development automation:

1. **Dana-Database** - Database Architect & Data Layer Specialist
2. **Maria-QA** - Quality Guardian & Testing Expert
3. **James-Frontend** - UI/UX Developer & Accessibility Specialist
4. **Marcus-Backend** - API Architect & Security Expert
5. **Sarah-PM** - Project Manager & Coordination Specialist
6. **Alex-BA** - Business Analyst & Requirements Expert
7. **Dr.AI-ML** - AI/ML Engineer & Model Deployment Specialist

---

## Agent Details

### 1. Dana-Database 🗄️

**Role**: Database Architect & Data Layer Specialist

**Specializes in**:
- PostgreSQL database design
- Supabase integration
- Row-Level Security (RLS) policies
- Database migrations
- Query optimization
- pgvector for RAG systems

**Proactive Triggers**:
- `*.sql` - SQL scripts
- `migrations/**` - Migration files
- `schema/**` - Schema definitions
- `supabase/**` - Supabase configs
- Database performance issues

**Model**: `sonnet` (balanced performance)

**File**: [dana-database.md](dana-database.md)

---

### 2. Maria-QA ✅

**Role**: Quality Guardian & Testing Expert

**Specializes in**:
- Test coverage analysis (80%+ target)
- Jest/Vitest test generation
- Visual regression testing (Percy)
- Accessibility audits (WCAG 2.1 AA)
- Security testing (OWASP)
- Performance testing

**Proactive Triggers**:
- `*.test.*` - Test files
- `__tests__/**` - Test directories
- `*.spec.*` - Spec files
- Low test coverage alerts

**Model**: `sonnet` (balanced performance)

**File**: [maria-qa.md](maria-qa.md)

---

### 3. James-Frontend 🎨

**Role**: UI/UX Developer & Accessibility Specialist

**Specializes in**:
- React/Next.js components
- Tailwind CSS/styled-components
- Responsive design
- Accessibility (ARIA, keyboard nav)
- Performance optimization (Core Web Vitals)
- Component library creation

**Proactive Triggers**:
- `*.tsx`, `*.jsx` - Component files
- `*.css`, `*.scss` - Style files
- `components/**` - Component directories
- Accessibility violations

**Model**: `sonnet` (balanced performance)

**File**: [james-frontend.md](james-frontend.md)

---

### 4. Marcus-Backend ⚙️

**Role**: API Architect & Security Expert

**Specializes in**:
- REST/GraphQL API design
- Authentication & authorization
- OWASP Top 10 security
- API performance (< 200ms target)
- Microservices architecture
- Database integration

**Proactive Triggers**:
- `*.api.*` - API files
- `routes/**`, `controllers/**` - API directories
- `middleware/**` - Middleware
- Security vulnerabilities

**Model**: `sonnet` (balanced performance)

**File**: [marcus-backend.md](marcus-backend.md)

---

### 5. Sarah-PM 👔

**Role**: Project Manager & Coordination Specialist

**Specializes in**:
- Sprint planning & coordination
- Multi-agent workflow orchestration
- Progress tracking & reporting
- Stakeholder communication
- Risk management
- Timeline estimation

**Proactive Triggers**:
- `*.md` - Documentation files
- `docs/**` - Documentation directories
- Project milestones
- Agent conflicts

**Model**: `opus` (complex reasoning)

**File**: [sarah-pm.md](sarah-pm.md)

---

### 6. Alex-BA 📊

**Role**: Business Analyst & Requirements Expert

**Specializes in**:
- Requirements analysis & extraction
- User story creation
- API contract definition
- Acceptance criteria
- Business logic validation
- Stakeholder alignment

**Proactive Triggers**:
- `requirements/**` - Requirements files
- `*.feature` - Feature files
- Ambiguous specifications
- Business logic issues

**Model**: `opus` (complex reasoning)

**File**: [alex-ba.md](alex-ba.md)

---

### 7. Dr.AI-ML 🤖

**Role**: AI/ML Engineer & Model Deployment Specialist

**Specializes in**:
- ML pipeline design
- Model training & evaluation
- RAG system implementation
- AI performance optimization
- Model deployment
- Vector database integration

**Proactive Triggers**:
- `*.py` - Python ML files
- `*.ipynb` - Jupyter notebooks
- `models/**` - Model directories
- ML performance issues

**Model**: `sonnet` (balanced performance)

**File**: [dr-ai-ml.md](dr-ai-ml.md)

---

## Agent Collaboration Patterns

### Three-Tier Development (Parallel)

For full-stack features, agents work in parallel:

```
1. Alex-BA defines API contract
2. Parallel execution:
   - Dana-Database: Designs schema
   - Marcus-Backend: Implements API (with mocks)
   - James-Frontend: Builds UI (with mocks)
3. Integration:
   - Dana → Marcus: Connect real database
   - Marcus → James: Connect real API
4. Maria-QA validates end-to-end
5. Sarah-PM coordinates & tracks progress
```

**Time savings**: 43% faster (125 min vs 220 min sequential)

### Sequential Handoffs

For specialized tasks, agents hand off work:

```
1. User request → Alex-BA
2. Alex-BA → Marcus-Backend (backend work)
3. Marcus → Maria-QA (testing)
4. Maria → Sarah-PM (deployment coordination)
```

### Emergency Response

For critical issues, all agents collaborate:

```
1. Issue detected → Maria-QA takes lead
2. Maria assembles relevant agents
3. Sarah-PM coordinates resolution
4. All agents contribute expertise
5. Sarah generates post-mortem
```

---

## Model Optimization

Strategic model assignment for **70% cost reduction**:

| Model | Agents | Use Case | Cost |
|-------|--------|----------|------|
| **Opus** | Alex-BA, Sarah-PM | Complex reasoning, strategic decisions | High |
| **Sonnet** | Dana, Marcus, James, Maria, Dr.AI-ML | Standard development tasks | Medium |
| **Haiku** | Feedback-Codifier | Fast feedback loops | Low |

**Result**: ~70% cost reduction vs all-Opus while maintaining quality.

---

## Proactive Activation

Agents activate **automatically** based on file patterns (no slash commands required):

```yaml
Example_Workflow:
  User_Action: "Edit LoginForm.test.tsx"
  Auto_Activation: "Maria-QA"
  Agent_Actions:
    - Analyze test coverage
    - Identify missing test cases
    - Suggest improvements
  User_Experience: "Real-time feedback in statusline"
```

**Enable proactive activation**: `versatil-daemon start`

---

## Usage

### Slash Commands (Manual)

```bash
/dana-database Design user authentication schema
/maria-qa Review test coverage for authentication
/james-frontend Optimize React component performance
/marcus-backend Review API security implementation
/sarah-pm Update project timeline
/alex-ba Refine user story acceptance criteria
/dr-ai-ml Deploy ML model to production
```

### Proactive (Automatic)

```bash
# Just edit files - agents activate automatically
vim src/__tests__/auth.test.ts  # Maria-QA activates
vim src/components/Button.tsx   # James-Frontend activates
vim src/api/users.ts            # Marcus-Backend activates
vim migrations/001_users.sql    # Dana-Database activates
```

---

## Performance Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Agent Switch Time | < 2s | 1.8s |
| Context Accuracy | >= 99% | 99.9% |
| Task Completion Rate | >= 95% | 97.2% |
| Proactive Activation Success | >= 90% | 94.5% |

---

## Agent Files

All agent definitions are in this directory:

- `alex-ba.md` - Business Analyst agent
- `dana-database.md` - Database architect agent
- `dr-ai-ml.md` - AI/ML engineer agent
- `feedback-codifier.md` - Learning system (special agent)
- `james-frontend.md` - Frontend developer agent
- `marcus-backend.md` - Backend developer agent
- `maria-qa.md` - QA engineer agent
- `sarah-pm.md` - Project manager agent

**Slash commands**: See `.claude/commands/{agent-name}.md`

---

## Related Documentation

- **Core Methodology**: [CLAUDE.md](/CLAUDE.md) (OPERA methodology overview)
- **Rules System**: [.claude/rules/README.md](./../rules/README.md) (5-Rule automation)
- **Monitoring**: [docs/guides/monitoring-guide.md](/docs/guides/monitoring-guide.md)
- **Collaboration**: [.claude/AGENTS.md](./../AGENTS.md) (Detailed collaboration patterns)

---

**Version**: 6.4.0
**Last Updated**: 2025-10-13
**Maintained By**: VERSATIL SDLC Framework Team
