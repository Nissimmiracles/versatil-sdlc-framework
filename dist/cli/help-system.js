/**
 * VERSATIL Help System
 *
 * Interactive help system with context-aware suggestions
 * and comprehensive documentation access.
 *
 * Usage:
 * - parseHelpQuery(query): Parse user's help query
 * - getHelpContent(topic): Get help content for specific topic
 * - suggestRelatedTopics(topic): Get related help topics
 * - searchHelp(query): Search across all help content
 */
/**
 * Help topics organized by category
 */
export const HELP_TOPICS = {
    core: [
        'quick-start',
        'agents',
        'rules',
        'mcp',
        'workflows',
        'commands',
        'troubleshooting',
    ],
    agents: [
        'maria-qa',
        'marcus-backend',
        'james-frontend',
        'dana-database',
        'alex-ba',
        'sarah-pm',
        'dr-ai-ml',
        'oliver-mcp',
    ],
    subAgents: [
        'marcus-node',
        'marcus-python',
        'marcus-rails',
        'marcus-go',
        'marcus-java',
        'james-react',
        'james-vue',
        'james-nextjs',
        'james-angular',
        'james-svelte',
    ],
    rules: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5'],
    workflows: ['every', 'three-tier', 'instinctive-testing'],
    tools: ['monitoring', 'context', 'isolation'],
};
/**
 * Parse user's help query and determine topic
 */
export function parseHelpQuery(query) {
    const normalizedQuery = query.toLowerCase().trim();
    // Direct topic match
    const allTopics = [
        ...HELP_TOPICS.core,
        ...HELP_TOPICS.agents,
        ...HELP_TOPICS.subAgents,
        ...HELP_TOPICS.rules,
        ...HELP_TOPICS.workflows,
        ...HELP_TOPICS.tools,
    ];
    const exactMatch = allTopics.find((topic) => topic === normalizedQuery);
    if (exactMatch) {
        return {
            topic: exactMatch,
            confidence: 1.0,
            suggestions: getSuggestionsForTopic(exactMatch),
        };
    }
    // Fuzzy match with keywords
    const keywordMatches = fuzzyMatchTopics(normalizedQuery);
    if (keywordMatches.length > 0) {
        return {
            topic: keywordMatches[0].topic,
            confidence: keywordMatches[0].score,
            suggestions: keywordMatches.slice(1, 4).map((m) => m.topic),
        };
    }
    // No match
    return {
        topic: '',
        confidence: 0,
        suggestions: ['quick-start', 'agents', 'rules', 'workflows'],
    };
}
/**
 * Fuzzy match topics based on keywords
 */
function fuzzyMatchTopics(query) {
    const keywordMap = {
        'maria-qa': ['test', 'testing', 'quality', 'coverage', 'qa', 'maria'],
        'marcus-backend': ['api', 'backend', 'security', 'server', 'marcus'],
        'james-frontend': ['ui', 'frontend', 'component', 'react', 'vue', 'james'],
        'dana-database': ['database', 'sql', 'schema', 'migration', 'dana'],
        'alex-ba': ['requirements', 'user story', 'business', 'alex'],
        'sarah-pm': ['project', 'planning', 'milestone', 'sarah'],
        'dr-ai-ml': ['ai', 'ml', 'machine learning', 'model', 'doctor', 'dr'],
        'oliver-mcp': ['mcp', 'orchestrator', 'oliver'],
        'rule-1': ['parallel', 'concurrency', 'simultaneous'],
        'rule-2': ['stress test', 'load test', 'performance test'],
        'rule-3': ['audit', 'health check', 'monitoring'],
        'rule-4': ['onboarding', 'setup', 'init', 'configure'],
        'rule-5': ['release', 'deployment', 'version', 'publish'],
        every: ['plan', 'assess', 'delegate', 'work', 'codify', 'workflow'],
        'three-tier': ['parallel', 'frontend', 'backend', 'database'],
        'instinctive-testing': ['tdd', 'test-driven', 'proactive testing'],
        monitoring: ['health', 'dashboard', 'metrics', 'status'],
        context: ['memory', 'context window', 'clear', 'statistics'],
        isolation: ['separation', 'framework-project', 'versatil directory'],
    };
    const matches = [];
    for (const [topic, keywords] of Object.entries(keywordMap)) {
        let score = 0;
        for (const keyword of keywords) {
            if (query.includes(keyword)) {
                score += 1;
            }
            if (keyword.includes(query)) {
                score += 0.5;
            }
        }
        if (score > 0) {
            matches.push({ topic, score });
        }
    }
    return matches.sort((a, b) => b.score - a.score);
}
/**
 * Get related topics for a given topic
 */
function getSuggestionsForTopic(topic) {
    const relatedMap = {
        'quick-start': ['agents', 'rules', 'monitoring'],
        agents: ['maria-qa', 'marcus-backend', 'james-frontend', 'dana-database'],
        'maria-qa': ['rule-2', 'instinctive-testing', 'monitoring'],
        'marcus-backend': ['rule-2', 'dana-database', 'security'],
        'james-frontend': ['accessibility', 'performance', 'design'],
        'dana-database': ['marcus-backend', 'migrations', 'optimization'],
        rules: ['rule-1', 'rule-2', 'rule-3', 'rule-4', 'rule-5'],
        workflows: ['every', 'three-tier', 'instinctive-testing'],
        every: ['plan', 'assess', 'delegate', 'work', 'learn'],
        monitoring: ['dashboard', 'health', 'metrics'],
    };
    return relatedMap[topic] || [];
}
/**
 * Get help content for a specific topic
 */
export function getHelpContent(topic) {
    const helpData = getHelpDatabase();
    return helpData[topic] || null;
}
/**
 * Search across all help content
 */
export function searchHelp(query) {
    const normalizedQuery = query.toLowerCase();
    const helpData = getHelpDatabase();
    const results = [];
    for (const content of Object.values(helpData)) {
        let score = 0;
        // Search in title
        if (content.title.toLowerCase().includes(normalizedQuery)) {
            score += 10;
        }
        // Search in keywords
        for (const keyword of content.keywords) {
            if (keyword.includes(normalizedQuery)) {
                score += 5;
            }
        }
        // Search in content
        if (content.content.toLowerCase().includes(normalizedQuery)) {
            score += 1;
        }
        if (score > 0) {
            results.push({ content, score });
        }
    }
    return results
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((r) => r.content);
}
/**
 * Get help database (extracted from help.md)
 */
function getHelpDatabase() {
    return {
        'quick-start': {
            topic: 'quick-start',
            title: 'Quick Start (5 Minutes)',
            category: 'core',
            keywords: ['getting started', 'setup', 'beginner', 'intro'],
            relatedTopics: ['agents', 'rules', 'monitoring'],
            content: `
# Quick Start (5 Minutes)

1. Check Framework Health: npm run monitor
2. Agents Work Automatically (no commands needed!)
3. Fix Issues: npm run doctor
4. Run Tests: npm run test:coverage
5. Interactive Dashboard: npm run dashboard

**You're ready!** Agents activate as you work.
      `,
            examples: [
                'npm run monitor',
                'npm run doctor',
                'npm run test:coverage',
                'npm run dashboard',
            ],
        },
        agents: {
            topic: 'agents',
            title: 'OPERA Agents (18 Total)',
            category: 'core',
            keywords: ['agent', 'opera', 'team', 'automation'],
            relatedTopics: ['maria-qa', 'marcus-backend', 'james-frontend', 'dana-database'],
            content: `
# OPERA Agents (18 Total)

**8 Core Agents**:
1. Alex-BA - Requirements Analyst
2. Dana-Database - Database Architect
3. Marcus-Backend - API Architect (5 sub-agents)
4. James-Frontend - UI/UX Expert (5 sub-agents)
5. Maria-QA - Quality Guardian
6. Sarah-PM - Project Coordinator
7. Dr.AI-ML - AI/ML Specialist
8. Oliver-MCP - MCP Orchestrator

**10 Sub-Agents**:
- Marcus: node, python, rails, go, java
- James: react, vue, nextjs, angular, svelte

Agents activate automatically based on file patterns!
      `,
        },
        'maria-qa': {
            topic: 'maria-qa',
            title: 'Maria-QA - Quality Guardian',
            category: 'agents',
            keywords: ['test', 'testing', 'quality', 'coverage', 'qa'],
            relatedTopics: ['rule-2', 'instinctive-testing', 'monitoring'],
            content: `
# Maria-QA - Quality Guardian

**Triggers**: *.test.*, __tests__/**

**Capabilities**:
- Test coverage analysis (80%+ required)
- Bug detection
- E2E validation
- Quality gate enforcement

**Examples**:
- Auto-activates when editing test files
- Blocks commits if coverage < 80%
- Generates missing tests automatically

**Manual**: /maria review coverage
      `,
            examples: [
                '/maria review test coverage',
                '/maria generate tests src/api/users.ts',
                'npm run test:coverage',
            ],
        },
        'marcus-backend': {
            topic: 'marcus-backend',
            title: 'Marcus-Backend - API Architect',
            category: 'agents',
            keywords: ['api', 'backend', 'security', 'server'],
            relatedTopics: ['rule-2', 'dana-database', 'marcus-node'],
            content: `
# Marcus-Backend - API Architect

**Triggers**: *.api.*, routes/**, controllers/**

**Capabilities**:
- Security scans (OWASP Top 10)
- Stress test generation (Rule 2)
- API implementation
- Performance validation (< 200ms)

**Sub-Agents** (auto-route by tech stack):
- marcus-node (Node.js 18+, Express/Fastify)
- marcus-python (Python 3.11+, FastAPI/Django)
- marcus-rails (Ruby on Rails 7+)
- marcus-go (Go 1.21+, Gin/Echo)
- marcus-java (Java 17+, Spring Boot 3)

**Manual**: /marcus review security
      `,
            examples: [
                '/marcus review API security',
                '/marcus optimize endpoint /api/users',
                'npm run test:stress',
            ],
        },
        'james-frontend': {
            topic: 'james-frontend',
            title: 'James-Frontend - UI/UX Expert',
            category: 'agents',
            keywords: ['ui', 'frontend', 'component', 'accessibility', 'react'],
            relatedTopics: ['james-react', 'accessibility', 'performance'],
            content: `
# James-Frontend - UI/UX Expert

**Triggers**: *.tsx, *.jsx, *.vue, *.css

**Capabilities**:
- Accessibility checks (WCAG 2.1 AA)
- Performance validation
- Responsive design
- Component optimization

**Sub-Agents** (auto-route by framework):
- james-react (React 18+, hooks, TypeScript)
- james-vue (Vue 3, Composition API)
- james-nextjs (Next.js 14+, App Router)
- james-angular (Angular 17+, signals)
- james-svelte (Svelte 4/5, SvelteKit)

**Manual**: /james optimize performance
      `,
            examples: [
                '/james optimize component performance',
                '/james check accessibility',
                '/james review responsive design',
            ],
        },
        'dana-database': {
            topic: 'dana-database',
            title: 'Dana-Database - Database Architect',
            category: 'agents',
            keywords: ['database', 'sql', 'schema', 'migration'],
            relatedTopics: ['marcus-backend', 'optimization', 'rls'],
            content: `
# Dana-Database - Database Architect

**Triggers**: *.sql, migrations/**, supabase/**, prisma/**

**Capabilities**:
- Schema design
- RLS policies
- Query optimization
- Migration scripts

**Examples**:
- Auto-activates when editing SQL files
- Optimizes slow queries
- Designs normalized schemas
- Creates secure RLS policies

**Manual**: /dana optimize queries
      `,
            examples: [
                '/dana optimize database queries',
                '/dana design schema for users',
                '/dana create migration',
            ],
        },
        'rule-1': {
            topic: 'rule-1',
            title: 'Rule 1: Parallel Task Execution',
            category: 'rules',
            keywords: ['parallel', 'concurrent', 'simultaneous', 'speed'],
            relatedTopics: ['three-tier', 'workflows'],
            content: `
# Rule 1: Parallel Task Execution

**What**: Run multiple tasks simultaneously without conflicts

**Benefits**:
- 3x faster development velocity
- Automatic parallelization
- Collision detection (prevents file conflicts)

**Example**:
Editing 3 files at once:
- src/api/users.ts (Marcus-Backend)
- src/components/UserList.tsx (James-Frontend)
- migrations/add_users.sql (Dana-Database)

All work in parallel, no conflicts!
      `,
        },
        'rule-2': {
            topic: 'rule-2',
            title: 'Rule 2: Automated Stress Testing',
            category: 'rules',
            keywords: ['stress test', 'load test', 'performance', 'testing'],
            relatedTopics: ['maria-qa', 'marcus-backend'],
            content: `
# Rule 2: Automated Stress Testing

**What**: Auto-generate and run stress tests on code changes

**Benefits**:
- 89% reduction in production bugs
- Performance validation (< 200ms)
- Automatic test generation

**Example**:
You write: POST /api/users

Rule 2 generates:
- 100 concurrent requests test
- Rate limiting test
- Error handling test

Auto-runs on save!
      `,
            examples: ['npm run test:stress'],
        },
        every: {
            topic: 'every',
            title: 'EVERY Workflow (5 Phases)',
            category: 'workflows',
            keywords: [
                'plan',
                'assess',
                'delegate',
                'work',
                'codify',
                'compounding',
            ],
            relatedTopics: ['plan', 'assess', 'delegate', 'work', 'learn'],
            content: `
# EVERY Workflow (5 Phases)

**Compounding Engineering**: Each feature makes the next 40% faster.

**Phase 1: PLAN** - /plan "feature"
Research and design with templates + historical context

**Phase 2: ASSESS** - /assess "feature"
Validate readiness before work starts

**Phase 3: DELEGATE** - /delegate "todos"
Distribute work to optimal agents

**Phase 4: WORK** - /work "feature"
Execute implementation with tracking

**Phase 5: CODIFY** - /learn "feature/branch"
Extract and store patterns for future use

**Result**: Future features are 40% faster!
      `,
            examples: [
                '/plan "Add user authentication"',
                '/assess "authentication feature"',
                '/delegate "authentication todos"',
                '/work "authentication feature"',
                '/learn "feature/auth"',
            ],
        },
        'three-tier': {
            topic: 'three-tier',
            title: 'Three-Tier Parallel Development',
            category: 'workflows',
            keywords: ['parallel', 'frontend', 'backend', 'database', 'tier'],
            relatedTopics: ['rule-1', 'every', 'dana-database'],
            content: `
# Three-Tier Parallel Development

**Concept**: Frontend, backend, and database work **simultaneously**.

**Workflow**:
1. Requirements (Alex-BA): 30 minutes
2. **Parallel Development**: 60 minutes
   - Dana-Database: Schema design (45 min)
   - Marcus-Backend: API with mocks (60 min)
   - James-Frontend: UI with mocks (50 min)
3. Integration: 15 minutes
4. Quality (Maria-QA): 20 minutes

**Total**: 125 minutes (2.1 hours)
**Sequential**: 220 minutes (3.7 hours)
**Time Saved**: 95 minutes (43% faster!)

**Key Insight**: Mocks enable parallel work.
      `,
        },
        monitoring: {
            topic: 'monitoring',
            title: 'Framework Monitoring',
            category: 'tools',
            keywords: ['health', 'dashboard', 'metrics', 'status', 'monitor'],
            relatedTopics: ['rule-3', 'troubleshooting'],
            content: `
# Framework Monitoring

**Quick Health Check**: npm run monitor (5 seconds)

**Interactive Dashboard**: npm run dashboard
- Real-time workflow visualization
- Live agent progress bars
- Keyboard navigation

**Monitoring Modes**:
- /monitor          → Quick health check
- /monitor dashboard → Interactive TUI
- /monitor watch    → Continuous (every 60s)
- /monitor report   → Debug report
- /monitor agents   → Agent metrics
- /monitor logs     → Recent logs

**Health Score Interpretation**:
- 90-100%: Excellent
- 75-89%: Good
- 50-74%: Needs attention
- <50%: Run /doctor --fix
      `,
            examples: [
                'npm run monitor',
                'npm run dashboard',
                '/monitor watch',
                '/monitor report',
            ],
        },
        troubleshooting: {
            topic: 'troubleshooting',
            title: 'Troubleshooting Common Issues',
            category: 'core',
            keywords: ['fix', 'error', 'problem', 'debug', 'issue'],
            relatedTopics: ['monitoring', 'doctor', 'isolation'],
            content: `
# Troubleshooting Common Issues

**1. Framework Health Below 80%**
npm run doctor --fix
npm run validate:isolation

**2. Agents Not Activating**
npm run init (re-run onboarding)

**3. Context Loss**
npm run context:stats
Check ~/.versatil/memories/[agent-id]/

**4. MCP Server Errors**
versatil-mcp --health-check
Check ~/.cursor/mcp_config.json

**5. Test Coverage Below 80%**
npm run test:coverage
/maria generate tests [file]

**6. Build Failures**
npm ci
npm run lint --fix

**7. Isolation Violations**
npm run validate:isolation
Remove framework files from project

**8. Performance Issues**
npm run context:cleanup
npm run monitor stress
      `,
            examples: [
                'npm run doctor --fix',
                'npm run monitor report',
                'npm run context:stats',
                'versatil-mcp --health-check',
            ],
        },
    };
}
/**
 * Format help content for display
 */
export function formatHelpContent(content) {
    let output = `\n${content.title}\n`;
    output += '='.repeat(content.title.length) + '\n\n';
    output += content.content.trim() + '\n';
    if (content.examples && content.examples.length > 0) {
        output += '\n\n**Examples**:\n';
        for (const example of content.examples) {
            output += `  ${example}\n`;
        }
    }
    if (content.relatedTopics.length > 0) {
        output += '\n\n**Related Topics**:\n';
        for (const topic of content.relatedTopics) {
            output += `  /help ${topic}\n`;
        }
    }
    return output;
}
/**
 * Get all available help topics
 */
export function getAllTopics() {
    return [
        ...HELP_TOPICS.core,
        ...HELP_TOPICS.agents,
        ...HELP_TOPICS.rules,
        ...HELP_TOPICS.workflows,
        ...HELP_TOPICS.tools,
    ];
}
/**
 * Get help menu (main help display)
 */
export function getHelpMenu() {
    return `
🤖 VERSATIL SDLC Framework v6.4.0
AI-Native Development with OPERA Agents & Compounding Engineering

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Quick Start** (5 Minutes):
1. npm run monitor        → Health check
2. npm run doctor         → Auto-fix issues
3. npm run test:coverage  → Run tests
4. npm run dashboard      → Interactive monitoring

**Help Topics**:
• /help quick-start       → 5-minute getting started
• /help agents            → All 18 OPERA agents
• /help rules             → 5-Rule automation system
• /help mcp               → 12 MCP integrations
• /help workflows         → VELOCITY workflow (5 phases)
• /help commands          → All slash commands
• /help troubleshooting   → Common issues & fixes

**Specific Agents**:
• /help maria-qa          → Quality Guardian
• /help marcus-backend    → API Architect
• /help james-frontend    → UI/UX Expert
• /help dana-database     → Database Architect

**Workflows**:
• /help every             → Plan → Assess → Delegate → Work → Codify
• /help three-tier        → Parallel frontend/backend/database

**Tools**:
• /help monitoring        → Framework health checks
• /help context           → Context management

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Quick Actions**:
• Health check: npm run monitor
• Auto-fix: npm run doctor
• Dashboard: npm run dashboard
• Validate: npm run validate:isolation

Need specific help? Use /help [topic] from above!
  `.trim();
}
//# sourceMappingURL=help-system.js.map