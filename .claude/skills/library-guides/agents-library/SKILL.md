---
name: agents-library
description: OPERA agent definitions and coordination patterns. Use when creating agents, implementing handoff contracts, working with agent metadata (YAML frontmatter), or coordinating multi-agent workflows. Covers agent specialization, role definitions, and communication protocols.
tags: [agents, opera, handoff, coordination, specialization]
---

# agents/ - OPERA Agent Definitions

**Priority**: HIGH
**Agent(s)**: Sarah-PM (primary owner), all agents (consumers)
**Last Updated**: 2025-10-26

## When to Use

- Creating new OPERA agents or sub-agents
- Implementing handoff contracts between agents
- Working with agent metadata (YAML frontmatter)
- Defining agent roles and specializations
- Coordinating multi-agent workflows
- Understanding agent communication protocols
- Debugging agent activation issues

## What This Library Provides

### Core Components
- **Agent Definitions**: 18 total (8 core + 10 sub-agents) in `.claude/agents/*.md`
- **Handoff Contracts**: Formal protocols for agent-to-agent work delegation
- **Metadata System**: YAML frontmatter (name, role, description, model, tools, triggers)
- **Sub-Agent Routing**: Confidence-based routing to specialized agents
- **Agent Specializations**: Domain expertise (frontend, backend, QA, ML, DB, etc.)

### Key Abstractions
- **Agent**: Autonomous unit with role, tools, allowed directories, triggers
- **Handoff Contract**: Structured data passed between agents (context, requirements, acceptance criteria)
- **Trigger System**: file_patterns, code_patterns, keywords for auto-activation
- **Sub-Agent**: Specialized variant (e.g., james-react-frontend under James-Frontend)
- **Confidence Levels**: High (0.8-1.0), Medium (0.5-0.79), Low (<0.5) for routing decisions

## Core Conventions

### DO ✓
- ✓ Use YAML frontmatter for all agent metadata
- ✓ Define clear triggers (file patterns, code patterns, keywords)
- ✓ Implement handoff contracts with structured data
- ✓ Document sub-agent routing confidence thresholds
- ✓ Specify allowed directories for tool restrictions
- ✓ Include examples section with context/user/response/commentary

### DON'T ✗
- ✗ Don't create agents without clear specialization
- ✗ Don't skip handoff contract validation
- ✗ Don't hardcode agent names in workflows (use routing)
- ✗ Don't overlap agent responsibilities (causes conflicts)

## Common Patterns

### Pattern 1: Agent Definition (YAML Frontmatter)
```yaml
---
name: "Marcus-Backend"
role: "Backend Engineer"
description: "Use PROACTIVELY when designing REST/GraphQL APIs..."
model: "sonnet"
tools:
  - "Read"
  - "Write"
  - "Edit"
  - "Grep"
  - "Glob"
  - "Bash(npm:*)"
allowedDirectories:
  - "src/api/"
  - "src/routes/"
  - "src/services/"
maxConcurrentTasks: 4
priority: "high"
tags:
  - "backend"
  - "api"
  - "opera"
sub_agents:
  - "marcus-nodejs-backend"
  - "marcus-python-backend"
---
```

### Pattern 2: Handoff Contract (Agent → Agent)
```typescript
interface HandoffContract {
  from_agent: string;
  to_agent: string;
  context: {
    feature_description: string;
    user_requirements: string[];
    existing_implementation?: string;
  };
  requirements: string[];
  acceptance_criteria: string[];
  estimated_effort?: string;
  priority: 'p0' | 'p1' | 'p2' | 'p3';
  dependencies?: string[];
  files_involved?: string[];
}

// Example: Alex-BA → Marcus-Backend
const handoff: HandoffContract = {
  from_agent: 'Alex-BA',
  to_agent: 'Marcus-Backend',
  context: {
    feature_description: 'User authentication system',
    user_requirements: ['OAuth2 support', 'JWT tokens', '24h expiry'],
  },
  requirements: [
    'POST /auth/signup endpoint',
    'POST /auth/login endpoint',
    'JWT token generation with 24h expiry'
  ],
  acceptance_criteria: [
    '/auth/signup returns 201 with user object',
    '/auth/login returns 200 with JWT token',
    'Token validates correctly with middleware'
  ],
  estimated_effort: 'Large',
  priority: 'p1',
  files_involved: ['src/api/auth.ts', 'src/middleware/jwt.ts']
};
```

### Pattern 3: Sub-Agent Routing (Confidence-Based)
```typescript
interface RoutingDecision {
  confidence: number;
  sub_agent: string;
  reasoning: string;
  action: 'auto-route' | 'suggest' | 'stay-parent';
}

// Example: James-Frontend detecting React patterns
function detectFramework(fileContent: string, filePath: string): RoutingDecision {
  const hasReactImports = /import .* from ['"]react['"]/.test(fileContent);
  const hasHooks = /useState|useEffect|useMemo/.test(fileContent);
  const isTsxFile = filePath.endsWith('.tsx');

  const confidence = (hasReactImports ? 0.4 : 0) +
                     (hasHooks ? 0.3 : 0) +
                     (isTsxFile ? 0.3 : 0);

  if (confidence >= 0.8) {
    return {
      confidence,
      sub_agent: 'james-react-frontend',
      reasoning: 'React imports, hooks, .tsx file detected',
      action: 'auto-route'
    };
  } else if (confidence >= 0.5) {
    return {
      confidence,
      sub_agent: 'james-react-frontend',
      reasoning: 'Some React patterns detected',
      action: 'suggest'
    };
  } else {
    return {
      confidence,
      sub_agent: '',
      reasoning: 'Insufficient framework indicators',
      action: 'stay-parent'
    };
  }
}
```

## Important Gotchas

### Gotcha 1: Agent Responsibility Overlap
**Problem**: Two agents both claim ownership of same file patterns → activation conflicts

**Example**:
```yaml
# James-Frontend triggers
file_patterns: ["*.tsx", "*.jsx"]

# Marcus-Backend triggers (CONFLICT!)
file_patterns: ["*.tsx"] # API route files also .tsx!
```

**Solution**: Use more specific patterns + code_patterns
```yaml
# James-Frontend (UI components)
file_patterns: ["**/components/**/*.tsx", "**/pages/**/*.tsx"]

# Marcus-Backend (API routes)
file_patterns: ["**/api/**/*.tsx", "**/routes/**/*.tsx"]
code_patterns: ["NextApiRequest", "NextApiResponse"]
```

### Gotcha 2: Handoff Contract Validation
**Problem**: Agent receives incomplete handoff, missing critical context

**Solution**: Always validate contract before accepting
```typescript
function validateHandoff(contract: HandoffContract): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!contract.context.feature_description) {
    errors.push('Missing feature_description in context');
  }
  if (contract.requirements.length === 0) {
    errors.push('No requirements specified');
  }
  if (contract.acceptance_criteria.length === 0) {
    errors.push('No acceptance criteria specified');
  }

  return { valid: errors.length === 0, errors };
}
```

### Gotcha 3: Sub-Agent Confidence Thresholds
**Problem**: Hard-coded confidence thresholds don't adapt to different contexts

**Solution**: Configurable thresholds per agent
```yaml
# In agent metadata
sub_agent_routing:
  confidence_thresholds:
    auto_route: 0.8  # Auto-route without asking
    suggest: 0.5     # Suggest and confirm
    stay_parent: 0.0 # Stay as parent agent
  frameworks:
    react:
      indicators: ["import.*react", "useState", "useEffect"]
      weights: [0.4, 0.3, 0.3]
    vue:
      indicators: ["import.*vue", "ref\\(", "computed\\("]
      weights: [0.4, 0.3, 0.3]
```

## Agent Roster

### Core Agents (8)
1. **Maria-QA** - Quality assurance, testing, 80%+ coverage enforcement
2. **James-Frontend** - UI/UX, React/Vue/Svelte, WCAG 2.1 AA accessibility
3. **Marcus-Backend** - API design, authentication, OWASP security
4. **Alex-BA** - Requirements analysis, user stories, acceptance criteria
5. **Dana-Database** - Schema design, migrations, RLS policies
6. **Dr.AI-ML** - ML pipelines, RAG systems, model training
7. **Sarah-PM** - Project coordination, OPERA orchestration
8. **Oliver-MCP** - MCP servers, protocol handling

### Sub-Agents (10)
- **james-react-frontend** - React 18+ hooks, Server Components
- **james-vue-frontend** - Vue 3 Composition API, Pinia
- **james-nextjs-frontend** - Next.js 14+ App Router, SSR
- **james-angular-frontend** - Angular 17+ standalone, signals
- **james-svelte-frontend** - Svelte/SvelteKit, stores
- **marcus-nodejs-backend** - Node.js/Express, TypeScript
- **marcus-python-backend** - FastAPI, Flask, Django
- **marcus-rails-backend** - Ruby on Rails, ActiveRecord
- **marcus-go-backend** - Go, Gin, GORM
- **marcus-java-backend** - Spring Boot, Hibernate

## Related Documentation

For detailed agent specifications:
- [references/agent-metadata-schema.md](references/agent-metadata-schema.md) - Complete YAML schema
- [references/handoff-protocol.md](references/handoff-protocol.md) - Handoff contract specification
- [references/trigger-system.md](references/trigger-system.md) - Auto-activation patterns

For agent implementations:
- [.claude/agents/*.md](../../.claude/agents/) - Full agent definition files
- [docs/AGENT_COMPOUNDING_INTEGRATION.md](../../../docs/AGENT_COMPOUNDING_INTEGRATION.md) - Integration guide

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `.claude/agents/**`
