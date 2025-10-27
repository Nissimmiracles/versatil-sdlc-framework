---
name: onboard
description: Interactive onboarding wizard for new users (chat-based GUI experience)
tags: [setup, onboarding, configuration, wizard, gui]
---

# VERSATIL Onboarding Wizard

**Welcome to VERSATIL SDLC Framework!** Let's set up your AI-native development environment in just a few minutes.

This interactive wizard will guide you through:
- 🔍 **Project analysis** - Auto-detect your tech stack
- 👥 **Team setup** - Configure for your workflow
- 🤖 **Agent customization** - Choose which OPERA agents to enable
- 🔧 **MCP tools** - Select integrations you need
- 📍 **Roadmap generation** - Get a personalized 4-week plan

---

## Quick Start (Auto Mode)

If you want automatic setup with smart defaults:

```
I'll run auto-detection now and configure everything based on your project.
```

**Detected**:
- **Project Type**: (will analyze package.json, file structure)
- **Tech Stack**: (will detect React, TypeScript, Node.js, etc.)
- **Recommended Agents**: (will suggest based on tech stack)

---

## Custom Setup (Interactive Mode)

Let's personalize your setup step-by-step:

### Step 1: Project Analysis 🔍

**What type of project are you working on?**

| Option | Project Type | Recommended Agents |
|--------|-------------|-------------------|
| 1 | **Frontend** (React, Vue, Angular) | James-Frontend, Maria-QA |
| 2 | **Backend** (Node.js, Python, Java) | Marcus-Backend, Dana-Database, Maria-QA |
| 3 | **Full-stack** (Frontend + Backend) | All agents |
| 4 | **Mobile** (React Native, Flutter) | James-Frontend, Marcus-Backend |
| 5 | **ML/AI** (Python, TensorFlow) | Dr.AI-ML, Marcus-Backend, Maria-QA |
| 6 | **Enterprise** (Microservices, Complex) | All agents + Sarah-PM, Alex-BA |

**Choose (1-6)**: _[User responds with number]_

---

### Step 2: Team & Experience Setup 👥

**What's your team size?**

- [ ] Solo developer
- [ ] Small team (2-5 people)
- [ ] Medium team (6-15 people)
- [ ] Large team (16+ people)

**Your experience with AI-assisted development?**

- [ ] Beginner (New to AI tools)
- [ ] Intermediate (Some experience with GitHub Copilot, etc.)
- [ ] Expert (Experienced with multiple AI development tools)

**Main development priorities?** (select multiple)

- [ ] Speed/Velocity
- [ ] Code Quality
- [ ] Testing/QA
- [ ] Security
- [ ] Performance
- [ ] Team Collaboration

---

### Step 3: OPERA Agent Customization 🤖

Based on your selections, I'll configure these agents:

#### ✅ Maria-QA (Quality Guardian)
- **Auto-activation**: ✅ Enabled
- **Priority**: 10/10 (High)
- **Triggers**: `*.test.*`, `*.spec.*`, `__tests__/**`
- **Focus**: Automated testing, Visual regression, Performance testing, Accessibility audits

**Customize?** (Y/n): _[User can adjust priority, triggers, focus areas]_

#### ✅ James-Frontend (UI/UX Expert)
- **Auto-activation**: ✅ Enabled
- **Priority**: 7/10 (Medium-High)
- **Triggers**: `*.tsx`, `*.jsx`, `*.vue`, `*.css`
- **Focus**: Component optimization, Performance monitoring, Design system

**Customize?** (Y/n):

#### ✅ Marcus-Backend (API Architect)
- **Auto-activation**: ✅ Enabled
- **Priority**: 7/10 (Medium-High)
- **Triggers**: `*.api.*`, `routes/**`, `server/**`
- **Focus**: API design, Database optimization, Security auditing

**Customize?** (Y/n):

_(Continue for all selected agents...)_

---

### Step 4: MCP Tool Configuration 🔧

**Which MCP tools would you like to enable?**

| MCP Tool | Purpose | Agents Using It | Auto-Enable? |
|----------|---------|----------------|--------------|
| **Playwright/Chrome** | Browser automation, E2E testing | Maria-QA, James | ✅ Recommended |
| **GitHub** | Repository operations, PR reviews | Marcus, Sarah, Alex | ✅ Recommended |
| **Exa Search** | AI-powered research | Alex-BA, Dr.AI-ML | Optional |
| **Vertex AI** | Google Cloud AI, ML deployment | Dr.AI-ML | Optional (ML projects) |
| **Supabase** | Vector database, RAG memory | All agents | ✅ Recommended |
| **n8n** | Workflow automation | Sarah-PM | Optional |
| **Semgrep** | Security scanning | Marcus, Maria | ✅ Recommended |
| **Sentry** | Error monitoring | Maria, Sarah | Optional |

**Select tools** (comma-separated, e.g., "1,2,5,7" or "all" for recommended):

---

### Step 4.5: Service Credentials Setup 🔐

**🔒 Security: Project-Level Encryption**

Credentials will be encrypted with AES-256-GCM and stored at:
`<project>/.versatil/credentials.json`

Each project has its own isolated credentials - no cross-project access!

**Which services need credentials?**

Based on your MCP selections, these services require setup:

| Service | Required By | Priority | Status |
|---------|-------------|----------|--------|
| **GitHub** | Marcus, Sarah, Alex | ✅ High | Auto-detect `GITHUB_TOKEN` |
| **Supabase** | RAG memory, All agents | ✅ High | Check existing config |
| **Vertex AI** | Dr.AI-ML | Medium | GCP service account |
| **Semgrep** | Marcus, Maria | Medium | Auto-detect `SEMGREP_TOKEN` |

**Configure now or later?**
- **[Y] Configure now** (recommended) - 2-3 minutes, guided setup
- **[n] Skip for now** (can run `versatil-credentials setup` later)

**What happens:**
1. Interactive prompts for each credential (with validation)
2. Encrypted storage with AES-256-GCM (project-specific key)
3. Audit logging for all credential access
4. Team export option (password-protected)

---

### Step 4.6: Private RAG Storage Setup (Optional) 🔒

**🌍 Public vs 🔒 Private RAG**

VERSATIL uses two separate RAG stores:

| Type | Purpose | Storage | Data Examples |
|------|---------|---------|---------------|
| **🌍 Public RAG** | Framework patterns for coding excellence | Cloud (managed by VERSATIL) | React patterns, JWT auth, testing best practices |
| **🔒 Private RAG** | Your proprietary project memory | **Your choice** (Firestore/Supabase/Local) | Company-specific code, internal APIs, client work |

**Key Benefits**:
- ✅ **Zero data leaks** - Your private patterns NEVER leave your storage
- ✅ **Privacy first** - Public RAG contains ONLY generic framework patterns
- ✅ **Intelligent routing** - Private patterns prioritized over public
- ✅ **Free tier available** - Firestore (1GB) or Supabase (500MB) or Local ($0)

**Do you want to configure Private RAG storage?**

- **[Y] Yes, configure now** (recommended for proprietary projects) - 3 minutes
- **[n] Skip for now** (use Public RAG only, can add later with `npm run setup:private-rag`)

**If you choose YES, you'll select from:**

#### Option 1: Google Cloud Firestore (Recommended)
- ✅ Free tier: 1GB storage, 50K reads/day, 20K writes/day
- ✅ Best performance with Cloud Run edge acceleration
- ✅ Auto-scaling, 99.9% SLA
- 📦 Cost after free tier: $0.18/GB/month + $0.06/100K reads

**Setup**: Provide your Google Cloud project ID and service account JSON

#### Option 2: Supabase pgvector
- ✅ Free tier: 500MB storage, unlimited API requests
- ✅ Full PostgreSQL database (not just vectors)
- ✅ Built-in auth, real-time subscriptions
- 📦 Cost after free tier: $25/month (Pro plan)

**Setup**: Provide your Supabase URL and anon key

#### Option 3: Local JSON (Offline)
- ✅ 100% free, unlimited storage
- ✅ Works offline, no cloud dependencies
- ✅ Fast for small datasets (<1000 patterns)
- ⚠️ No cross-device sync, manual backups

**Setup**: Automatically uses `~/.versatil/private-rag/` directory

---

**What happens during Private RAG setup:**
1. Interactive wizard guides you through storage selection
2. Credentials saved to `~/.versatil/.env` (encrypted)
3. Connection tested automatically
4. Pattern classification enabled (auto-route to public/private)

**Run setup wizard anytime**:
```bash
npm run setup:private-rag
```

---

### Step 5: Configuration Preview ⚙️

Here's your personalized configuration:

```json
{
  "projectType": "fullstack",
  "teamSize": "small",
  "experience": "intermediate",
  "technologies": ["TypeScript", "React", "Node.js", "Express"],
  "priorities": ["Quality", "Testing", "Speed"],
  "agentCustomizations": {
    "Maria-QA": { "priority": 10, "autoActivate": true },
    "James-Frontend": { "priority": 7, "autoActivate": true },
    "Marcus-Backend": { "priority": 7, "autoActivate": true },
    "Dana-Database": { "priority": 6, "autoActivate": true }
  },
  "mcpPreferences": ["playwright_mcp", "github_mcp", "supabase_mcp", "semgrep"]
}
```

**Confirm and proceed?** (Y/n):

---

### Step 6: Generate Personalized Roadmap ⭐ AGENT-DRIVEN (Sarah-PM)

<thinking>
Use Sarah-PM to generate a strategic 4-week personalized development roadmap based on project type, team size, experience level, and priorities.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Generate personalized development roadmap"`
- `prompt: "Generate 4-week personalized development roadmap based on onboarding configuration. Input: Project type (${project_type}), team size (${team_size}), experience level (${experience}), technologies (${technologies}), priorities (${priorities}), selected agents (${active_agents}). Your strategic PM roadmap design: (1) Analyze project context (what type of development will this team do? what are their pain points based on experience level?), (2) Design Week 1 milestones (initial setup, core workflows, agent familiarization - keep it simple for first week), (3) Design Week 2 milestones (intermediate features, quality gates, testing patterns), (4) Design Week 3 milestones (advanced features, optimization, performance), (5) Design Week 4 milestones (production readiness, deployment, monitoring), (6) Recommend agent usage per week (which agents to focus on each week based on milestones), (7) Define quality gates per week (coverage targets, security benchmarks, performance goals), (8) Estimate effort and complexity (realistic timelines based on team size and experience), (9) Identify potential blockers (what might slow this team down? how to mitigate?), (10) Create success metrics (how to measure progress each week). Return: { roadmap_summary: string, weeks: [{week_number, theme, milestones: [{title, description, agent_recommendations: [], estimated_effort, complexity}], quality_gates: [], success_metrics: [], potential_blockers: []}], agent_focus_by_week: {}, overall_timeline: string, recommendations: [] }"`

**Expected Sarah-PM Output:**

```typescript
interface PersonalizedRoadmap {
  roadmap_summary: string;              // 2-3 sentence overview
  project_context: {
    type: string;                       // e.g., "Full-stack web application"
    team_size: string;
    experience_level: string;
    primary_challenges: string[];       // Based on experience level
    recommended_focus: string;          // What to prioritize first
  };

  weeks: Array<{
    week_number: number;                // 1, 2, 3, 4
    theme: string;                      // e.g., "Foundation & Setup", "Feature Development"
    week_dates: string;                 // e.g., "Week of Oct 28 - Nov 3"

    milestones: Array<{
      milestone_id: string;             // e.g., "week1-milestone1"
      title: string;                    // e.g., "Setup CI/CD Pipeline"
      description: string;              // Detailed explanation
      agent_recommendations: Array<{
        agent: string;                  // e.g., "Marcus-Backend"
        usage: string;                  // How to use this agent
        expected_value: string;         // What agent will help with
      }>;
      estimated_effort: string;         // e.g., "4-6 hours"
      complexity: 'beginner' | 'intermediate' | 'advanced';
      prerequisites: string[];          // What's needed before starting
      deliverables: string[];           // What should be completed
    }>;

    quality_gates: Array<{
      gate_name: string;                // e.g., "Week 1 Quality Check"
      criteria: string[];               // e.g., ["Test coverage >= 70%", "All tests passing"]
      blocking: boolean;                // true = must pass before week 2
      validation_method: string;        // How to check (e.g., "npm run test:coverage")
    }>;

    success_metrics: Array<{
      metric: string;                   // e.g., "Feature velocity"
      target: string;                   // e.g., "2 features completed"
      measurement: string;              // How to measure
    }>;

    potential_blockers: Array<{
      blocker: string;                  // e.g., "Database schema complexity"
      likelihood: 'low' | 'medium' | 'high';
      mitigation: string;               // How to prevent/resolve
    }>;
  }>;

  agent_focus_by_week: {
    week_1: string[];                   // Agents to focus on
    week_2: string[];
    week_3: string[];
    week_4: string[];
  };

  overall_timeline: string;             // e.g., "4 weeks (Nov 1 - Nov 28, 2025)"
  total_estimated_effort: string;       // e.g., "60-80 hours"

  recommendations: Array<{
    category: string;                   // e.g., "Team Collaboration", "Quality"
    recommendation: string;
    rationale: string;
  }>;
}
```

**Personalized Roadmap Examples:**

```typescript
// Example 1: Solo Developer, Intermediate Experience, Full-Stack Project
const project_config = {
  project_type: "fullstack",
  team_size: "solo",
  experience: "intermediate",
  technologies: ["TypeScript", "React", "Node.js", "PostgreSQL"],
  priorities: ["Quality", "Speed"]
};

// Sarah-PM's roadmap:
const roadmap = {
  roadmap_summary: "4-week roadmap for full-stack development focusing on quality and velocity. Emphasis on automated testing (Maria-QA) and rapid feature development with OPERA agents.",

  project_context: {
    type: "Full-stack web application (TypeScript, React, Node.js, PostgreSQL)",
    team_size: "Solo developer",
    experience_level: "Intermediate",
    primary_challenges: [
      "Balancing speed with quality as solo developer",
      "Managing both frontend and backend complexity",
      "Maintaining test coverage without dedicated QA"
    ],
    recommended_focus: "Leverage Maria-QA heavily for automated testing to maintain quality while moving fast"
  },

  weeks: [
    {
      week_number: 1,
      theme: "Foundation & Core Workflows",
      week_dates: "Week of Oct 28 - Nov 3, 2025",

      milestones: [
        {
          milestone_id: "week1-m1",
          title: "Setup Development Environment",
          description: "Configure TypeScript, React, Node.js, PostgreSQL with VERSATIL framework. Ensure all agents activate correctly.",
          agent_recommendations: [
            {
              agent: "Maria-QA",
              usage: "Run /maria-qa after setting up test infrastructure",
              expected_value: "Validates test setup meets 80%+ coverage requirement from day 1"
            },
            {
              agent: "Dana-Database",
              usage: "Use /dana-database for initial schema design",
              expected_value: "Creates optimized PostgreSQL schema with proper indexes and RLS"
            }
          ],
          estimated_effort: "6-8 hours",
          complexity: "beginner",
          prerequisites: ["Node.js 18+", "PostgreSQL installed"],
          deliverables: [
            "TypeScript configured with strict mode",
            "React app bootstrapped with Vite",
            "PostgreSQL database created",
            "Test framework (Jest) configured",
            "VERSATIL agents activated"
          ]
        },
        {
          milestone_id: "week1-m2",
          title: "Build First Feature with OPERA Agents",
          description: "Implement a simple CRUD feature (e.g., User management) using the full OPERA workflow: Plan → Assess → Delegate → Work → Learn.",
          agent_recommendations: [
            {
              agent: "Dana-Database",
              usage: "Design users table schema",
              expected_value: "Proper table structure with RLS policies"
            },
            {
              agent: "Marcus-Backend",
              usage: "Implement REST API endpoints",
              expected_value: "Secure, performant API (<200ms response time)"
            },
            {
              agent: "James-Frontend",
              usage: "Build React components for user list/form",
              expected_value: "Accessible UI components (WCAG 2.1 AA)"
            },
            {
              agent: "Maria-QA",
              usage: "Generate comprehensive test suite",
              expected_value: "80%+ test coverage with E2E tests"
            }
          ],
          estimated_effort: "10-12 hours",
          complexity: "intermediate",
          prerequisites: ["Week 1 Milestone 1 complete"],
          deliverables: [
            "Users table in PostgreSQL",
            "CRUD API endpoints (/api/users)",
            "React components (UserList, UserForm)",
            "Test coverage >= 80%",
            "Feature deployed to dev environment"
          ]
        }
      ],

      quality_gates: [
        {
          gate_name: "Week 1 Foundation Check",
          criteria: [
            "Test coverage >= 70% (learning phase, 80% by Week 2)",
            "All TypeScript strict mode errors resolved",
            "Database migrations run successfully",
            "First feature fully working (CRUD)",
            "All OPERA agents tested and functional"
          ],
          blocking: true,
          validation_method: "npm run test:coverage && npm run build && npm run migrate"
        }
      ],

      success_metrics: [
        {
          metric: "Feature completion",
          target: "1 complete CRUD feature",
          measurement: "User management feature fully tested and deployed"
        },
        {
          metric: "Agent familiarity",
          target: "Used 4+ OPERA agents",
          measurement: "Successfully used Dana, Marcus, James, Maria"
        },
        {
          metric: "Test coverage",
          target: "70%+ (foundation week)",
          measurement: "npm run test:coverage shows >=70%"
        }
      ],

      potential_blockers: [
        {
          blocker: "PostgreSQL setup issues",
          likelihood: "medium",
          mitigation: "Use Docker Compose for PostgreSQL (provided in framework). Dana-Database handles schema complexity."
        },
        {
          blocker: "Test framework configuration",
          likelihood: "low",
          mitigation: "Maria-QA provides test templates. Framework includes Jest config."
        }
      ]
    },

    {
      week_number: 2,
      theme: "Feature Velocity & Quality Patterns",
      week_dates: "Week of Nov 4 - Nov 10, 2025",

      milestones: [
        {
          milestone_id: "week2-m1",
          title: "Implement Authentication System",
          description: "Build secure authentication with JWT tokens, refresh tokens, and session management using OPERA agents.",
          agent_recommendations: [
            {
              agent: "Alex-BA",
              usage: "/alex-ba to define auth requirements and edge cases",
              expected_value: "Complete acceptance criteria, security requirements documented"
            },
            {
              agent: "Marcus-Backend",
              usage: "/marcus-backend for JWT implementation and security",
              expected_value: "OWASP-compliant auth system, no critical vulnerabilities"
            },
            {
              agent: "Maria-QA",
              usage: "/maria-qa for security testing",
              expected_value: "Auth flow tested for common attacks (injection, CSRF, XSS)"
            }
          ],
          estimated_effort: "12-14 hours",
          complexity: "advanced",
          prerequisites: ["Week 1 complete", "User management feature working"],
          deliverables: [
            "JWT-based authentication",
            "Refresh token mechanism",
            "Login/logout API endpoints",
            "Protected route middleware",
            "Security tests passing",
            "Session management"
          ]
        },
        {
          milestone_id: "week2-m2",
          title: "Build Core Business Features (2-3 features)",
          description: "Implement 2-3 core business features using parallel development with OPERA agents.",
          agent_recommendations: [
            {
              agent: "Sarah-PM",
              usage: "/plan for each feature to get effort estimates",
              expected_value: "Accurate time estimates from RAG patterns (Compounding Engineering)"
            },
            {
              agent: "Multiple",
              usage: "/delegate for parallel execution",
              expected_value: "3 features developed in parallel (saves 40% time)"
            }
          ],
          estimated_effort: "16-20 hours",
          complexity: "intermediate",
          prerequisites: ["Authentication complete"],
          deliverables: [
            "3 business features implemented",
            "All features have 80%+ test coverage",
            "API documentation updated",
            "Features integrated with auth"
          ]
        }
      ],

      quality_gates: [
        {
          gate_name: "Week 2 Security & Quality Check",
          criteria: [
            "Test coverage >= 80% (now enforced strictly)",
            "OWASP security scan clean (no critical/high)",
            "All API endpoints < 200ms response time",
            "Authentication tested against common attacks",
            "No TypeScript any types (strict typing enforced)"
          ],
          blocking: true,
          validation_method: "npm run test:coverage && npm run security:scan && npm run lint:strict"
        }
      ],

      success_metrics: [
        {
          metric: "Feature velocity",
          target: "3-4 features completed",
          measurement: "Auth + 2-3 business features fully tested"
        },
        {
          metric: "Test coverage",
          target: "80%+ (enforced)",
          measurement: "Coverage report shows >=80%"
        },
        {
          metric: "Security posture",
          target: "Zero critical/high vulnerabilities",
          measurement: "OWASP scan clean"
        }
      ],

      potential_blockers: [
        {
          blocker: "Authentication complexity",
          likelihood: "medium",
          mitigation: "Use template-matcher to find auth-system.yaml pattern (28h baseline). Marcus-Backend handles JWT complexity."
        },
        {
          blocker: "Parallel feature conflicts",
          likelihood: "low",
          mitigation: "/delegate analyzes dependencies automatically. Prevents file conflicts."
        }
      ]
    },

    {
      week_number: 3,
      theme: "Optimization & Performance",
      week_dates: "Week of Nov 11 - Nov 17, 2025",

      milestones: [
        {
          milestone_id: "week3-m1",
          title: "Performance Optimization",
          description: "Optimize frontend and backend performance using OPERA agents.",
          agent_recommendations: [
            {
              agent: "Marcus-Backend",
              usage: "API performance optimization",
              expected_value: "All endpoints < 200ms, N+1 queries eliminated"
            },
            {
              agent: "James-Frontend",
              usage: "Frontend performance tuning",
              expected_value: "LCP < 2.5s, FID < 100ms, Lighthouse >= 90"
            }
          ],
          estimated_effort: "8-10 hours",
          complexity: "advanced",
          prerequisites: ["Core features complete"],
          deliverables: [
            "Database queries optimized",
            "API caching implemented",
            "Frontend code splitting",
            "Lazy loading for routes",
            "Performance benchmarks met"
          ]
        }
      ],

      quality_gates: [
        {
          gate_name: "Week 3 Performance Check",
          criteria: [
            "All API endpoints < 200ms",
            "Frontend Lighthouse score >= 90",
            "LCP < 2.5s",
            "No N+1 database queries"
          ],
          blocking: false,
          validation_method: "npm run perf:test && npm run lighthouse"
        }
      ],

      success_metrics: [
        {
          metric: "Performance",
          target: "All benchmarks met",
          measurement: "API <200ms, Lighthouse >=90"
        }
      ],

      potential_blockers: []
    },

    {
      week_number: 4,
      theme: "Production Readiness",
      week_dates: "Week of Nov 18 - Nov 24, 2025",

      milestones: [
        {
          milestone_id: "week4-m1",
          title: "Deployment & Monitoring",
          description: "Deploy to production and setup monitoring.",
          agent_recommendations: [
            {
              agent: "Marcus-Backend",
              usage: "Production deployment configuration",
              expected_value: "Secure, scalable deployment setup"
            },
            {
              agent: "Sarah-PM",
              usage: "Documentation and handoff",
              expected_value: "Complete deployment docs, runbooks"
            }
          ],
          estimated_effort: "6-8 hours",
          complexity: "intermediate",
          prerequisites: ["All features complete", "Performance optimized"],
          deliverables: [
            "Production deployment successful",
            "Monitoring dashboard active",
            "Error tracking configured",
            "Deployment documentation",
            "Rollback procedures documented"
          ]
        }
      ],

      quality_gates: [
        {
          gate_name: "Production Readiness Check",
          criteria: [
            "All quality gates from weeks 1-3 passing",
            "Production deployment successful",
            "Monitoring alerts configured",
            "Documentation complete"
          ],
          blocking: true,
          validation_method: "Production deployment checklist"
        }
      ],

      success_metrics: [
        {
          metric: "Production stability",
          target: "Zero critical errors in first 48h",
          measurement: "Error tracking dashboard"
        }
      ],

      potential_blockers: []
    }
  ],

  agent_focus_by_week: {
    week_1: ["Dana-Database", "Marcus-Backend", "James-Frontend", "Maria-QA"],
    week_2: ["Alex-BA", "Marcus-Backend", "Maria-QA", "Sarah-PM"],
    week_3: ["Marcus-Backend", "James-Frontend", "Dr.AI-ML"],
    week_4: ["Marcus-Backend", "Sarah-PM", "Maria-QA"]
  },

  overall_timeline: "4 weeks (Oct 28 - Nov 24, 2025)",
  total_estimated_effort: "60-80 hours (15-20 hours per week)",

  recommendations: [
    {
      category: "Quality",
      recommendation: "Use Maria-QA proactively from Week 1 to maintain 80%+ coverage",
      rationale: "Solo developers often skip tests to move fast. Maria-QA prevents technical debt accumulation."
    },
    {
      category: "Velocity",
      recommendation: "Leverage /delegate for parallel feature development in Week 2",
      rationale: "Parallel execution with OPERA agents can save 40% time vs sequential development."
    },
    {
      category: "Learning",
      recommendation: "Use /learn after each feature to capture patterns",
      rationale: "Compounding Engineering makes Feature 5 40% faster than Feature 1. Learn early, benefit later."
    }
  ]
};
```

**After Sarah-PM Roadmap Generation, Save to File:**

```typescript
// Generate markdown roadmap file
const roadmap_content = `
# ${project_config.project_type.toUpperCase()} Development Roadmap

**Generated**: ${new Date().toISOString().split('T')[0]}
**Timeline**: ${roadmap.overall_timeline}
**Estimated Effort**: ${roadmap.total_estimated_effort}

## Overview

${roadmap.roadmap_summary}

## Project Context

- **Type**: ${roadmap.project_context.type}
- **Team Size**: ${roadmap.project_context.team_size}
- **Experience Level**: ${roadmap.project_context.experience_level}
- **Recommended Focus**: ${roadmap.project_context.recommended_focus}

### Primary Challenges
${roadmap.project_context.primary_challenges.map(c => `- ${c}`).join('\n')}

---

${roadmap.weeks.map(week => `
## Week ${week.week_number}: ${week.theme}
**Dates**: ${week.week_dates}

### Milestones

${week.milestones.map(m => `
#### ${m.title}
${m.description}

**Complexity**: ${m.complexity.toUpperCase()}
**Estimated Effort**: ${m.estimated_effort}

**Agent Recommendations**:
${m.agent_recommendations.map(ar => `- **${ar.agent}**: ${ar.usage}\n  - Value: ${ar.expected_value}`).join('\n')}

**Deliverables**:
${m.deliverables.map(d => `- ${d}`).join('\n')}
`).join('\n')}

### Quality Gates
${week.quality_gates.map(qg => `
#### ${qg.gate_name} ${qg.blocking ? '(BLOCKING)' : ''}
${qg.criteria.map(c => `- [ ] ${c}`).join('\n')}

**Validation**: \`${qg.validation_method}\`
`).join('\n')}

### Success Metrics
${week.success_metrics.map(sm => `- **${sm.metric}**: ${sm.target}\n  - Measurement: ${sm.measurement}`).join('\n')}

${week.potential_blockers.length > 0 ? `
### Potential Blockers
${week.potential_blockers.map(pb => `- **${pb.blocker}** (${pb.likelihood} likelihood)\n  - Mitigation: ${pb.mitigation}`).join('\n')}
` : ''}

---
`).join('\n')}

## Agent Focus by Week

${Object.entries(roadmap.agent_focus_by_week).map(([week, agents]) =>
  `- **${week.replace('_', ' ').toUpperCase()}**: ${agents.join(', ')}`
).join('\n')}

## Recommendations

${roadmap.recommendations.map(r => `
### ${r.category}
**${r.recommendation}**

${r.rationale}
`).join('\n')}

---

**Roadmap generated by Sarah-PM (VERSATIL OPERA Framework)**
**Next**: Start with Week 1, Milestone 1
`;

// Write to docs/VERSATIL_ROADMAP.md
fs.writeFileSync('docs/VERSATIL_ROADMAP.md', roadmap_content);

console.log("✅ Personalized roadmap generated: docs/VERSATIL_ROADMAP.md");
```

---

### Step 7: Installation & Setup 🎉

I'm now:
1. ✅ Creating `.versatil/config.json` with your preferences
2. ✅ Generating agent configurations (`.versatil/agents/`)
3. ✅ Creating `.cursorrules` for IDE integration
4. ✅ Generating `CLAUDE.md` with your customized team
5. ✅ Creating personalized roadmap at `docs/VERSATIL_ROADMAP.md`
6. ✅ Installing selected MCP dependencies

**Progress**:
```
[████████████████████------] 80% - Installing MCPs...
```

---

## ✨ Setup Complete!

Your VERSATIL Framework is configured and ready!

### 📁 Files Created

```
✅ .versatil/config.json          # Main configuration
✅ .versatil/agents/*.json         # Agent definitions (4 agents)
✅ .cursorrules                    # IDE integration
✅ CLAUDE.md                       # OPERA methodology guide
✅ docs/VERSATIL_ROADMAP.md        # 📍 Your 4-week development roadmap
✅ versatil.log                    # Framework activity log
```

### 🚀 Next Steps

1. **Start the proactive daemon** (enables auto-activation):
   ```bash
   versatil-daemon start
   ```

2. **Review your personalized roadmap**:
   - Open `docs/VERSATIL_ROADMAP.md`
   - See your 4-week plan with milestones, agent recommendations, quality gates

3. **Test agent auto-activation**:
   - Edit a `*.test.ts` file → Maria-QA activates
   - Edit a `*.tsx` file → James-Frontend activates
   - Or use slash commands: `/maria-qa`, `/james-frontend`

4. **Check framework health**:
   ```bash
   npm run monitor      # Quick health check
   npm run dashboard    # Interactive TUI dashboard
   ```

### ✨ What's New in v7.1.0+ (You Get This Automatically!)

🚀 **PROACTIVE AUTOMATION**
- Templates auto-apply when you create files (5-10x faster)
- Agents auto-activate based on file edits (no manual commands)
- Patterns auto-suggest from historical learnings (85-95% token savings)

🧠 **94.1% TOKEN SAVINGS**
- Progressive disclosure via Skills-first architecture
- Library guides load only when mentioned
- Code generators use copy-paste templates

📍 **COMPOUNDING ENGINEERING**
- Each feature 40% faster than the last
- Pattern search finds similar work
- Template matching suggests proven approaches

---

### 💡 Daemon Commands

```bash
versatil-daemon status    # Check if running
versatil-daemon stop      # Stop daemon
versatil-daemon logs      # View daemon logs
```

### 🎯 Your OPERA Agents

- ✅ **Maria-QA** - Quality Guardian (priority: 10/10)
- ✅ **James-Frontend** - UI/UX Expert (priority: 7/10)
- ✅ **Marcus-Backend** - API Architect (priority: 7/10)
- ✅ **Dana-Database** - Database Architect (priority: 6/10)

### 📚 Documentation

- **CLAUDE.md** - Your customized OPERA guide
- **docs/VERSATIL_ROADMAP.md** - Your 4-week development plan
- **docs/AUTOMATION_TEST_REPORT.md** - 87.5% automation success rate!
- **docs/INSTALLATION.md** - Complete installation guide

---

**Welcome to VERSATIL!** 🚀

Your agents are ready to assist you proactively as you code. Happy building!

---

## Advanced Options

### Re-run Onboarding
```bash
/onboard --reset          # Start fresh (clears existing config)
```

### Export Configuration
```bash
/onboard --export         # Export config to share with team
```

### Import Configuration
```bash
/onboard --import team-config.json    # Use team config
```

### Validate Setup
```bash
/onboard --validate       # Check if setup is complete
```

---

**Implementation Note for Claude**:

When user invokes `/onboard`, you should:

1. **Auto-detect project** (if possible):
   ```typescript
   // Read package.json, analyze dependencies
   // Detect React, TypeScript, Node.js, etc.
   ```

2. **Ask questions progressively** (one section at a time):
   - Don't overwhelm with all questions at once
   - Show current selection after each step
   - Allow back/edit previous answers

3. **Generate configuration**:
   ```typescript
   // Call onboarding-wizard.ts with chat mode:
   const wizard = new OnboardingWizard({ mode: 'chat' });
   await wizard.startOnboarding();
   ```

4. **Create files** (use Write tool):
   - `.versatil/config.json`
   - `.versatil/agents/*.json`
   - `.cursorrules`
   - `CLAUDE.md` (from template)
   - `docs/VERSATIL_ROADMAP.md` (call RoadmapGenerator)

5. **Confirm completion** with visual summary (markdown tables, checkboxes)

6. **Ask about daemon start** (offer to run `versatil-daemon start`)

---

**Visual Elements to Use**:
- ✅ Checkboxes for completed steps
- 📊 Tables for options/comparisons
- 📁 Code blocks for file previews
- 🎯 Progress bars (`[████----] 60%`)
- 💡 Callout boxes for tips
- 🔗 Clickable links to docs

This creates a **GUI-like experience in chat** without needing a VSCode extension!
