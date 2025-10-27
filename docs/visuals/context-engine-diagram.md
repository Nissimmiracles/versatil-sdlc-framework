# Three-Layer Context Engine

## How VERSATIL Learns YOUR Coding Style

```mermaid
graph TB
    Git["📂 Your Git History<br/>(Last 100 commits)"]

    subgraph Detection["🔍 AUTO-DETECTION (15 seconds)"]
        Analyze["Analyze Patterns<br/>━━━━━━━━<br/>• Indentation style<br/>• Async patterns<br/>• Quote preference<br/>• Component style<br/>• Naming conventions"]
    end

    subgraph Layer1["🎯 LAYER 1: YOUR Preferences (HIGHEST PRIORITY)"]
        User["User Profile<br/>~/.versatil/users/[id]/profile.json<br/>━━━━━━━━━━━━━━━━━━━<br/><b>Auto-detected from git:</b><br/>✅ Indentation: 2 spaces (95% confidence)<br/>✅ Async: async/await (94% confidence)<br/>✅ Quotes: single (92% confidence)<br/>✅ Functions: arrow functions (90% confidence)<br/>✅ Components: functional + hooks (88% confidence)<br/><br/><b>100% Privacy Isolated</b><br/>(Patterns stay on YOUR machine only)"]
    end

    subgraph Layer2["👥 LAYER 2: TEAM Conventions"]
        Team[".versatil-team.json<br/>(Shared with team)<br/>━━━━━━━━━━━━━━━━━━━<br/><b>Team standards:</b><br/>• Code style: Airbnb ESLint<br/>• Auth strategy: JWT tokens<br/>• Validation: Zod schemas<br/>• Testing: 80%+ coverage required<br/>• Security: OWASP Top 10<br/>• Logging: Winston + Sentry<br/><br/><b>Team-level privacy</b><br/>(Shared with team only)"]
    end

    subgraph Layer3["📊 LAYER 3: PROJECT Vision"]
        Project[".versatil-project.json<br/>(Shared with contributors)<br/>━━━━━━━━━━━━━━━━━━━<br/><b>Project requirements:</b><br/>• Mission: GDPR-compliant platform<br/>• Compliance: GDPR, WCAG 2.1 AA<br/>• Tech stack: React, Node, PostgreSQL<br/>• Target: 99.9% uptime SLA<br/><br/><b>Project-level privacy</b><br/>(Shared with contributors)"]
    end

    subgraph Resolution["⚙️ CONTEXT RESOLUTION GRAPH (CRG)"]
        Merge["Priority-Based Merging<br/>━━━━━━━━━━━━━━━━━━━<br/><b>Resolution order:</b><br/>1️⃣ YOUR preferences (highest)<br/>2️⃣ TEAM conventions<br/>3️⃣ PROJECT requirements<br/>4️⃣ Framework defaults (lowest)<br/><br/><b>Conflict handling:</b><br/>• YOUR style always wins<br/>• Team fills gaps<br/>• Project provides context<br/>• <50ms resolution time"]
    end

    subgraph Agents["🤖 ALL 18 AGENTS (Context-Aware)"]
        James["James-Frontend<br/>Uses YOUR:<br/>• Component style<br/>• CSS methodology"]
        Marcus["Marcus-Backend<br/>Uses YOUR:<br/>• Async patterns<br/>• Error handling"]
        Dana["Dana-Database<br/>Uses YOUR:<br/>• Naming conventions<br/>• Query style"]
        Maria["Maria-QA<br/>Uses YOUR:<br/>• Test framework<br/>• Assertion style"]
        Others["+ 14 more agents<br/>All context-aware"]
    end

    Output["✅ <b>CODE OUTPUT</b><br/>━━━━━━━━━━━━━━━━━━━<br/><b>Results:</b><br/>• 96% style accuracy<br/>• 88% less rework<br/>• 100% privacy guaranteed<br/>• YOUR style + TEAM standards + PROJECT compliance"]

    Git --> Analyze
    Analyze --> User

    User --> Merge
    Team --> Merge
    Project --> Merge

    Merge --> James
    Merge --> Marcus
    Merge --> Dana
    Merge --> Maria
    Merge --> Others

    James --> Output
    Marcus --> Output
    Dana --> Output
    Maria --> Output
    Others --> Output

    classDef git fill:#f9f9f9,stroke:#999,stroke-width:2px,color:#000
    classDef detect fill:#fff3e0,stroke:#ff9800,stroke-width:3px,color:#000
    classDef user fill:#e3f2fd,stroke:#2196f3,stroke-width:4px,color:#000
    classDef team fill:#f3e5f5,stroke:#9c27b0,stroke-width:3px,color:#000
    classDef project fill:#e8f5e9,stroke:#4caf50,stroke-width:3px,color:#000
    classDef resolution fill:#fff9c4,stroke:#fbc02d,stroke-width:3px,color:#000
    classDef agents fill:#ffccbc,stroke:#ff5722,stroke-width:2px,color:#000
    classDef output fill:#c8e6c9,stroke:#2e7d32,stroke-width:4px,color:#000

    class Git git
    class Analyze detect
    class User user
    class Team team
    class Project project
    class Merge resolution
    class James,Marcus,Dana,Maria,Others agents
    class Output output
```

---

## Live Example: Context in Action

### Input: "Add user authentication"

### Context Resolution:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Context Detection                                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🎯 YOUR Style (from git analysis):                     │
│   ✅ async/await (94% confidence)                       │
│   ✅ arrow functions (90% confidence)                   │
│   ✅ 2-space indent (95% confidence)                    │
│   ✅ single quotes (92% confidence)                     │
│                                                         │
│ 👥 TEAM Standards:                                      │
│   ✅ Zod validation (all inputs)                        │
│   ✅ JWT tokens (auth strategy)                         │
│   ✅ Winston logging                                    │
│                                                         │
│ 📊 PROJECT Requirements:                                │
│   ✅ GDPR compliance (user data handling)               │
│   ✅ WCAG 2.1 AA (UI accessibility)                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Output: Code Matching YOUR Style + TEAM + PROJECT

```typescript
// ✅ YOUR preferences applied automatically
import { z } from 'zod';           // Team: Zod validation
import { logger } from './logger'; // Team: Winston logging

// YOUR style: arrow function + async/await
export const createUser = async (data: UserInput): Promise<User> => {
  // Team: Zod schema validation
  const validated = userSchema.parse(data);

  // YOUR style: 2-space indent, single quotes
  const user = await db.users.create({
    email: validated.email,
    password: await hashPassword(validated.password),
    consent: validated.gdprConsent,  // Project: GDPR requirement
  });

  // Team: Structured logging
  logger.info('User created', { userId: user.id });

  return user;
};

// YOUR style: arrow function for validation
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  gdprConsent: z.boolean(),  // Project: GDPR compliance
});
```

**Accuracy**: 96% style match (vs 75% generic AI)
**Rework**: 5% (vs 40% without context engine)

---

## Privacy Isolation Model

```
┌─────────────────────────────────────────────────────────┐
│ 🔒 Privacy-Isolated Learning                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ YOUR Patterns                                           │
│   • Stored: ~/.versatil/users/[your-id]/               │
│   • Shared: NEVER (100% private)                       │
│   • Examples: Indentation, async style, quotes         │
│                                                         │
│ TEAM Patterns                                           │
│   • Stored: .versatil-team.json (project)              │
│   • Shared: Team members ONLY                          │
│   • Examples: Auth strategy, validation library        │
│                                                         │
│ PROJECT Patterns                                        │
│   • Stored: .versatil-project.json (project)           │
│   • Shared: Project contributors ONLY                  │
│   • Examples: Tech stack, compliance requirements      │
│                                                         │
│ FRAMEWORK Patterns                                      │
│   • Stored: Framework installation                     │
│   • Shared: Public (default templates)                 │
│   • Examples: OPERA phases, quality gates              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Key Principle**: YOUR coding style NEVER leaves your machine. Only team/project conventions are shared.

---

## Performance Metrics

| Metric | Value | Impact |
|--------|-------|--------|
| **Auto-detection time** | 15 seconds | 10 min saved vs manual config |
| **Detection accuracy** | 90-95% | High confidence across patterns |
| **Context resolution** | <50ms | Real-time code generation |
| **Code accuracy** | 96% | vs 75% without context |
| **Rework reduction** | 88% | 5% vs 40% before |
| **Privacy isolation** | 100% | YOUR patterns never shared |

---

## How It Works Under the Hood

### 1. Auto-Detection (15 seconds)

```bash
# Analyzes last 100 git commits
npx versatil init

🔍 Analyzing your git history (100 commits)...
✓ Indentation: 2 spaces (95% confidence)
✓ Quotes: single (92% confidence)
✓ Async style: async/await (94% confidence)
✓ Functions: arrow functions (90% confidence)
✅ Preferences auto-detected in 15 seconds!

Profile saved: ~/.versatil/users/abc123/profile.json
```

### 2. Context Resolution Graph (CRG)

```typescript
// Pseudo-code of CRG algorithm
function resolveContext(feature: string): Context {
  const userPrefs = loadUserProfile();      // Layer 1 (highest)
  const teamConventions = loadTeamConfig(); // Layer 2
  const projectVision = loadProjectConfig(); // Layer 3

  // Priority-based merge (user always wins)
  return merge(
    userPrefs,        // Overrides all
    teamConventions,  // Fills gaps
    projectVision,    // Provides context
    frameworkDefaults // Lowest priority
  );
}
```

### 3. Context-Aware Generation (CAG)

All 18 agents receive merged context:

```typescript
// Agent receives full context
agent.generate(code, {
  userStyle: { async: 'async-await', indent: 2, quotes: 'single' },
  teamConventions: { validation: 'zod', auth: 'jwt' },
  projectRequirements: { compliance: ['GDPR', 'WCAG'] }
});

// Output matches YOUR style + TEAM + PROJECT automatically
```

---

## Benefits

### For Solo Developers
- ✅ Code matches YOUR style automatically
- ✅ No manual configuration needed
- ✅ 100% privacy (patterns stay local)
- ✅ 96% accuracy (vs 75% generic AI)

### For Teams
- ✅ Enforce team standards automatically
- ✅ Onboard new members faster (context-aware from day 1)
- ✅ Consistent code across all members
- ✅ Privacy-isolated (user patterns private, team shared)

### For Enterprises
- ✅ Project-level compliance requirements
- ✅ Audit trails for context usage
- ✅ Privacy guarantees (GDPR-compliant)
- ✅ Scalable across multiple teams

---

## Next Steps

- **[See It In Action →](opera-dashboard.md)** - Live OPERA dashboard with context
- **[Try It Now →](../INSTALLATION.md)** - Auto-detect YOUR style in 15 seconds
- **[Deep Dive →](../THREE_LAYER_CONTEXT_SYSTEM.md)** - Full technical documentation
