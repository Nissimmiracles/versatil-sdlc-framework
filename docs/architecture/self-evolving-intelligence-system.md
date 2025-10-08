# VERSATIL Self-Evolving Intelligence System
## Real-Time R&D + CTO Support Framework

**Version**: 1.0.0
**Date**: 2025-10-08
**Status**: Architecture Design
**Vision**: Transform VERSATIL into a continuously evolving "Contextual Engineering & Intelligence Agent" that acts as both R&D department and CTO

---

## 🎯 Executive Vision

### The Problem: Traditional Frameworks Don't Evolve

Most SDLC frameworks are **static snapshots**:
- ❌ Plans written once, never updated
- ❌ Architecture docs become stale
- ❌ PRDs don't reflect actual implementation
- ❌ Context lost between sessions
- ❌ No automated learning from project evolution

### The VERSATIL Solution: Self-Evolving Intelligence

VERSATIL becomes a **living, learning organism** that:
- ✅ **Continuously updates** plans, epics, architecture, PRDs
- ✅ **Never loses context** - complete project history in RAG
- ✅ **Self-organizing** - clear routing, roots, references
- ✅ **Auto-migrates** - detects breaking changes, proposes migrations
- ✅ **CTO-level intelligence** - strategic decisions, architecture reviews
- ✅ **R&D mindset** - experiments, learns, improves autonomously

---

## 🏗️ Architecture Overview

### Three-Layer Intelligence System

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: CONTEXTUAL MEMORY ENGINE                               │
│  Zero Context Loss - Complete Project History                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ RAG Memory   │  │ Conversation │  │ Git History  │          │
│  │ (Supabase)   │  │ Backup       │  │ Analysis     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Every decision, code change, architecture choice → RAG          │
│  Queries retrieve full context: "Why was this decision made?"    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: LIVING DOCUMENTATION ENGINE                            │
│  Auto-Updating Plans, PRDs, Architecture Docs                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Epic Manager │  │ PRD Generator│  │ Architecture │          │
│  │              │  │              │  │ Documenter   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Watches code changes → Updates docs automatically               │
│  New feature added → PRD updated with implementation details     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: STRATEGIC INTELLIGENCE ENGINE                          │
│  CTO-Level Decision Making & R&D Experimentation                 │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Migration    │  │ Tech Debt    │  │ Innovation   │          │
│  │ Planner      │  │ Detector     │  │ Lab          │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Detects breaking changes → Proposes migration path              │
│  Identifies tech debt → Creates refactor epics                   │
│  Experiments with new patterns → Documents learnings             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 File Organization & Routing System

### Intelligent File Hierarchy

VERSATIL maintains a **self-organizing file system** with clear routing and references:

```
~/.versatil/                           # Framework home (isolated)
├── memory/                            # RAG + context storage
│   ├── vectors/                       # Supabase pgvector embeddings
│   ├── conversations/                 # Conversation history
│   └── decisions/                     # Architecture decision records
│
├── intelligence/                      # Strategic intelligence
│   ├── migration-plans/               # Auto-generated migration strategies
│   ├── tech-debt-reports/             # Automated tech debt analysis
│   └── innovation-experiments/        # R&D experiments + results
│
└── routing/                           # Smart routing + references
    ├── project-registry.json          # All projects managed by VERSATIL
    ├── epic-routing-table.json        # Epic → Project → Agents mapping
    └── cross-references.json          # Doc → Code → Epic links

[USER PROJECT]/                        # User's actual project
├── .versatil-project.json             # ONLY framework file (minimal config)
│
├── docs/                              # Living documentation (auto-updated)
│   ├── epics/                         # Epic documentation
│   │   ├── EPIC-001-auth-system.md    # Auto-generated, continuously updated
│   │   └── EPIC-002-payment-flow.md
│   │
│   ├── architecture/                  # Architecture docs (self-evolving)
│   │   ├── current-architecture.md    # Updated on every significant change
│   │   ├── decision-records/          # ADRs (Architecture Decision Records)
│   │   │   ├── ADR-001-use-nextjs.md  # Auto-created when Next.js chosen
│   │   │   └── ADR-002-adopt-prisma.md
│   │   └── migration-guides/          # Auto-generated migrations
│   │       └── v1-to-v2-migration.md
│   │
│   ├── prd/                           # Product Requirements (living docs)
│   │   ├── feature-auth.md            # Updated as implementation evolves
│   │   └── feature-payments.md
│   │
│   └── roadmaps/                      # Strategic roadmaps
│       ├── 2025-q4-roadmap.md         # Quarterly roadmap (auto-adjusted)
│       └── tech-debt-roadmap.md       # Tech debt priorities
│
└── [user's code]                      # User's actual project files
```

### Smart Reference System

Every document has **bidirectional cross-references**:

```markdown
<!-- EPIC-001-auth-system.md -->
# Epic: User Authentication System

**Status**: In Progress (Phase: Development)
**Created**: 2025-10-05 (Auto-generated from conversation)
**Last Updated**: 2025-10-08 14:32 (Auto-sync)

## 🔗 Cross-References

### Linked Documents
- [PRD: Authentication Feature](../prd/feature-auth.md) - Product requirements
- [ADR-003: OAuth Provider Selection](../architecture/decision-records/ADR-003-oauth-provider.md) - Why we chose Auth0
- [Migration Guide: v1 to v2 Auth](../architecture/migration-guides/auth-v1-to-v2.md)

### Linked Code
- [src/auth/oauth-handler.ts:42](../../src/auth/oauth-handler.ts#L42) - OAuth callback implementation
- [src/auth/session-manager.ts:88](../../src/auth/session-manager.ts#L88) - Session management
- [tests/auth/oauth.test.ts](../../tests/auth/oauth.test.ts) - Test suite

### Linked Conversations
- [Conversation: conv-ldx7a9-k3m2p1](~/.versatil/conversations/conv-ldx7a9-k3m2p1.json) - Initial epic creation
- [Conversation: conv-me8b4f-n5q3r2](~/.versatil/conversations/conv-me8b4f-n5q3r2.json) - Migration discussion

### Linked Agents
- Alex-BA: Generated 6 user stories
- Marcus-Backend: Implemented 12 tasks
- James-Frontend: Created 4 UI components
- Maria-QA: Validated 24 test cases

## 📊 Epic Progress (Auto-Updated)

- **Stories**: 6 total (4 completed, 2 in progress)
- **Tasks**: 24 total (18 completed, 4 in progress, 2 blocked)
- **Code Coverage**: 87% (threshold: 80%) ✅
- **Security Score**: A+ (OWASP compliant) ✅
- **Performance**: All endpoints < 200ms ✅

## 🔄 Recent Updates (Auto-Generated)

**2025-10-08 14:32** - Marcus-Backend completed task "OAuth token refresh"
  - File: `src/auth/token-manager.ts` (new)
  - Tests: Added 4 test cases
  - Quality: Coverage 92%, OWASP compliant

**2025-10-08 12:15** - Architecture Decision: Migrating to Auth0
  - Decision: ADR-003-oauth-provider.md created
  - Reason: Better SAML support, enterprise SSO
  - Impact: Migration plan auto-generated

**2025-10-07 16:45** - Epic entered "Development" phase
  - Quality gates: All passed
  - Sub-agents: 4 activated (marcus-task-1, marcus-task-2, james-task-5, maria-task-18)
```

---

## 🧠 Layer 1: Contextual Memory Engine

### RAG-Powered Complete History

**File**: `src/intelligence/contextual-memory-engine.ts`

```typescript
export class ContextualMemoryEngine {
  /**
   * Store EVERY project event with rich context
   */
  async storeProjectEvent(event: ProjectEvent): Promise<void> {
    const enrichedEvent = {
      ...event,
      timestamp: Date.now(),
      context: {
        // Code context
        filesModified: await this.getModifiedFiles(),
        gitCommit: await this.getCurrentCommit(),
        gitBranch: await this.getCurrentBranch(),

        // Epic context
        activeEpics: await this.getActiveEpics(),
        currentPhase: await this.getCurrentSDLCPhase(),

        // Decision context
        architectureDecisions: await this.getRecentADRs(),
        techStack: await this.getCurrentTechStack(),

        // Conversation context
        relatedConversations: await this.findRelatedConversations(event),
        userIntent: event.userRequest
      }
    };

    // Store in RAG with rich metadata
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(enrichedEvent),
      metadata: {
        eventType: event.type,
        projectId: event.projectId,
        epicId: event.epicId,
        timestamp: enrichedEvent.timestamp,
        tags: this.generateEventTags(enrichedEvent),

        // Routing information
        routing: {
          documentPaths: this.findRelatedDocs(event),
          codePaths: this.findRelatedCode(event),
          agentIds: event.involvedAgents
        }
      }
    });
  }

  /**
   * Query context: "Why was this decision made?"
   */
  async queryDecisionHistory(query: string): Promise<DecisionHistory> {
    const results = await vectorMemoryStore.queryMemories({
      query,
      topK: 10,
      filters: {
        eventType: ['decision', 'architecture_choice', 'tech_selection'],
        tags: ['adr', 'architecture', 'strategic']
      }
    });

    return {
      decisions: results.documents.map(doc => JSON.parse(doc.content)),
      rationale: this.extractRationale(results),
      impact: this.analyzeImpact(results),
      relatedChanges: this.findCodeChanges(results)
    };
  }

  /**
   * Zero context loss: Reconstruct complete project timeline
   */
  async reconstructProjectTimeline(projectId: string): Promise<Timeline> {
    const allEvents = await vectorMemoryStore.queryMemories({
      query: '', // Empty query = get all
      topK: 10000,
      filters: { projectId }
    });

    // Organize by epic → phase → event
    const timeline = this.organizeTimeline(allEvents);

    return {
      epics: this.groupByEpic(timeline),
      phases: this.groupByPhase(timeline),
      decisions: this.extractDecisions(timeline),
      codeEvolution: this.trackCodeEvolution(timeline),
      conversationFlow: this.reconstructConversations(timeline)
    };
  }
}
```

### Conversation → Code → Doc Linking

**Auto-Linking System**:

1. **User conversation detected** → Store in `~/.versatil/conversations/`
2. **Epic created from conversation** → Link conversation ID to epic
3. **Code changes made** → Link file paths to epic + conversation
4. **Documentation generated** → Link doc path to epic + conversation + code
5. **Architecture decision made** → Create ADR, link to all above

**Result**: Complete traceability

```
Conversation: "Add OAuth authentication"
    ↓
Epic: EPIC-001-auth-system
    ↓
Stories: 6 user stories (Alex-BA)
    ↓
Tasks: 24 tasks (Sarah-PM)
    ↓
Code: src/auth/oauth-handler.ts (Marcus)
    ↓
Tests: tests/auth/oauth.test.ts (Maria)
    ↓
Docs: docs/epics/EPIC-001-auth-system.md (auto-generated)
    ↓
ADR: docs/architecture/decision-records/ADR-003-oauth-provider.md (auto-created)
    ↓
PRD: docs/prd/feature-auth.md (auto-updated)
```

**Every link stored in RAG** → Query any point, get full context

---

## 📝 Layer 2: Living Documentation Engine

### Auto-Updating Documentation System

**File**: `src/intelligence/living-documentation-engine.ts`

```typescript
export class LivingDocumentationEngine extends EventEmitter {
  /**
   * Watch project events and update docs automatically
   */
  async initialize(): Promise<void> {
    // Listen to code changes
    this.watchCodeChanges();

    // Listen to epic events
    this.watchEpicEvents();

    // Listen to architecture decisions
    this.watchArchitectureDecisions();

    // Listen to git commits
    this.watchGitCommits();
  }

  /**
   * AUTO-UPDATE: Epic documentation on every change
   */
  private async updateEpicDocumentation(epic: Epic, event: EpicEvent): Promise<void> {
    const epicDocPath = `docs/epics/EPIC-${epic.id.substr(-3)}-${this.slugify(epic.title)}.md`;

    // Read existing doc (or create template)
    let content = await this.readOrCreateEpicDoc(epicDocPath, epic);

    // Update progress section
    content = this.updateProgressSection(content, epic);

    // Update recent updates section
    content = this.addRecentUpdate(content, event);

    // Update cross-references
    content = this.updateCrossReferences(content, epic);

    // Write updated doc
    await fs.promises.writeFile(epicDocPath, content);

    // Store update event in RAG
    await this.storeDocUpdate(epicDocPath, event, 'epic_documentation_updated');

    console.log(`���� Auto-updated: ${epicDocPath}`);
  }

  /**
   * AUTO-CREATE: Architecture Decision Record (ADR)
   */
  async createArchitectureDecisionRecord(decision: ArchitectureDecision): Promise<void> {
    const adrNumber = await this.getNextADRNumber();
    const adrPath = `docs/architecture/decision-records/ADR-${adrNumber}-${this.slugify(decision.title)}.md`;

    const content = `# ADR-${adrNumber}: ${decision.title}

**Date**: ${new Date().toISOString().split('T')[0]}
**Status**: ${decision.status}
**Deciders**: ${decision.deciders.join(', ')}
**Auto-Generated**: Yes (from ${decision.source})

## Context

${decision.context}

## Decision

${decision.decision}

## Rationale

${decision.rationale.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Consequences

### Positive
${decision.consequences.positive.map(c => `- ${c}`).join('\n')}

### Negative
${decision.consequences.negative.map(c => `- ${c}`).join('\n')}

### Risks
${decision.consequences.risks.map(r => `- ${r}`).join('\n')}

## Implementation

### Code Changes
${decision.implementation.codeChanges.map(c => `- [\`${c.file}\`](../../${c.file})`).join('\n')}

### Migration Required
${decision.implementation.migrationRequired ? `
See: [Migration Guide: ${decision.implementation.migrationGuide}](../migration-guides/${decision.implementation.migrationGuide})
` : 'No migration required'}

## 🔗 Cross-References

- **Epic**: [${decision.epic.title}](../../epics/${decision.epic.docPath})
- **Conversation**: [View conversation](~/.versatil/conversations/${decision.conversationId}.json)
- **Related ADRs**: ${decision.relatedADRs.map(adr => `[ADR-${adr}](./ADR-${adr}.md)`).join(', ')}

## Monitoring

- **Performance Impact**: ${decision.monitoring.performanceImpact || 'TBD'}
- **Security Impact**: ${decision.monitoring.securityImpact || 'TBD'}
- **Cost Impact**: ${decision.monitoring.costImpact || 'TBD'}

---

**Last Updated**: ${new Date().toISOString()} (Auto-sync)
**Auto-Update Frequency**: On every related code change
`;

    await fs.promises.writeFile(adrPath, content);

    // Store ADR in RAG
    await vectorMemoryStore.storeMemory({
      content,
      metadata: {
        documentType: 'adr',
        adrNumber,
        decision: decision.title,
        status: decision.status,
        tags: ['architecture', 'decision', 'adr'],
        routing: {
          epic: decision.epic.id,
          conversation: decision.conversationId,
          codeFiles: decision.implementation.codeChanges.map(c => c.file)
        }
      }
    });

    console.log(`📋 Created ADR: ${adrPath}`);
    this.emit('adr_created', { adrPath, decision });
  }

  /**
   * AUTO-UPDATE: PRD when implementation changes
   */
  async updatePRD(feature: string, changes: CodeChange[]): Promise<void> {
    const prdPath = `docs/prd/feature-${this.slugify(feature)}.md`;

    // Read existing PRD
    let content = await fs.promises.readFile(prdPath, 'utf-8');

    // Add "Implementation Details" section
    const implSection = `
## Implementation Details (Auto-Generated)

**Last Updated**: ${new Date().toISOString()}

### Code Files
${changes.map(c => `- [\`${c.file}\`](../../${c.file}) - ${c.description}`).join('\n')}

### Technical Decisions
${changes.flatMap(c => c.decisions).map(d => `- ${d}`).join('\n')}

### Performance Characteristics
- Response Time: ${await this.measureResponseTime(changes)}
- Memory Usage: ${await this.measureMemoryUsage(changes)}
- Database Queries: ${await this.countDatabaseQueries(changes)}

### Security Considerations
${await this.analyzeSecurityImpact(changes)}

### Test Coverage
- Unit Tests: ${await this.getUnitTestCoverage(changes)}
- Integration Tests: ${await this.getIntegrationTestCoverage(changes)}
- E2E Tests: ${await this.getE2ETestCoverage(changes)}
`;

    // Replace or append implementation section
    if (content.includes('## Implementation Details')) {
      content = content.replace(/## Implementation Details[\s\S]*?(?=##|$)/, implSection);
    } else {
      content += `\n${implSection}`;
    }

    await fs.promises.writeFile(prdPath, content);

    console.log(`📄 Auto-updated PRD: ${prdPath}`);
  }

  /**
   * AUTO-UPDATE: Current architecture diagram
   */
  async updateArchitectureDiagram(): Promise<void> {
    const archPath = 'docs/architecture/current-architecture.md';

    // Analyze current codebase structure
    const structure = await this.analyzeCodebaseStructure();

    // Generate Mermaid diagram
    const diagram = this.generateMermaidDiagram(structure);

    const content = `# Current Architecture

**Last Auto-Update**: ${new Date().toISOString()}
**Generated From**: Live codebase analysis

## System Overview

\`\`\`mermaid
${diagram}
\`\`\`

## Component Breakdown

${structure.components.map(c => `
### ${c.name}

- **Type**: ${c.type}
- **Files**: ${c.files.length}
- **Dependencies**: ${c.dependencies.join(', ')}
- **Description**: ${c.description}
`).join('\n')}

## Technology Stack

${structure.techStack.map(t => `- **${t.category}**: ${t.technologies.join(', ')}`).join('\n')}

## Recent Changes (Auto-Tracked)

${await this.getRecentArchitecturalChanges()}

---

**Note**: This document is auto-generated and auto-updated on every significant architectural change.
`;

    await fs.promises.writeFile(archPath, content);
    console.log(`🏗️  Updated architecture diagram: ${archPath}`);
  }
}
```

### Auto-Generated Document Types

1. **Epic Documentation** (`docs/epics/EPIC-XXX-*.md`)
   - Created: When epic detected in conversation
   - Updated: On every task completion, phase transition, quality gate
   - Includes: Progress, cross-refs, recent updates, agent activity

2. **Architecture Decision Records** (`docs/architecture/decision-records/ADR-XXX-*.md`)
   - Created: When significant architecture choice detected
   - Includes: Context, decision, rationale, consequences, migration
   - Linked: To epic, conversation, code files

3. **PRD** (`docs/prd/feature-*.md`)
   - Created: When feature epic created
   - Updated: On implementation progress, tech decisions, performance metrics
   - Includes: Requirements, acceptance criteria, implementation details

4. **Migration Guides** (`docs/architecture/migration-guides/*.md`)
   - Created: When breaking change detected
   - Auto-generates: Step-by-step migration instructions
   - Includes: Code snippets, before/after examples, risk analysis

5. **Roadmaps** (`docs/roadmaps/*.md`)
   - Created: From epic priorities and tech debt analysis
   - Updated: Quarterly, or when priorities shift
   - Includes: Timeline, dependencies, resource allocation

---

## 🚀 Layer 3: Strategic Intelligence Engine

### CTO-Level Decision Making

**File**: `src/intelligence/strategic-intelligence-engine.ts`

```typescript
export class StrategicIntelligenceEngine {
  /**
   * AUTO-DETECT: Breaking changes and generate migration plan
   */
  async detectBreakingChanges(): Promise<MigrationPlan[]> {
    // Analyze recent code changes
    const changes = await this.getRecentChanges();

    const breakingChanges: BreakingChange[] = [];

    for (const change of changes) {
      // Detect breaking changes
      if (await this.isBreakingChange(change)) {
        breakingChanges.push({
          file: change.file,
          type: change.type, // 'api', 'database', 'interface', etc.
          impact: await this.analyzeImpact(change),
          affectedFiles: await this.findAffectedFiles(change)
        });
      }
    }

    if (breakingChanges.length === 0) return [];

    // Generate migration plans
    const migrationPlans: MigrationPlan[] = [];

    for (const breakingChange of breakingChanges) {
      const plan = await this.generateMigrationPlan(breakingChange);
      migrationPlans.push(plan);

      // Auto-create migration guide document
      await this.createMigrationGuide(plan);

      // Create migration epic
      await this.createMigrationEpic(plan);
    }

    console.log(`🔄 Detected ${breakingChanges.length} breaking changes, created ${migrationPlans.length} migration plans`);

    return migrationPlans;
  }

  /**
   * AUTO-CREATE: Migration guide document
   */
  private async createMigrationGuide(plan: MigrationPlan): Promise<void> {
    const guidePath = `docs/architecture/migration-guides/${plan.version}-migration.md`;

    const content = `# Migration Guide: ${plan.title}

**Version**: ${plan.fromVersion} → ${plan.toVersion}
**Breaking Changes**: ${plan.breakingChanges.length}
**Estimated Effort**: ${plan.estimatedEffort} hours
**Auto-Generated**: ${new Date().toISOString()}

## Overview

${plan.overview}

## Breaking Changes

${plan.breakingChanges.map((bc, i) => `
### ${i + 1}. ${bc.title}

**Type**: ${bc.type}
**Impact**: ${bc.impact}
**Affected Files**: ${bc.affectedFiles.length}

#### Before
\`\`\`typescript
${bc.before}
\`\`\`

#### After
\`\`\`typescript
${bc.after}
\`\`\`

#### Migration Steps
${bc.steps.map((s, j) => `${j + 1}. ${s}`).join('\n')}
`).join('\n')}

## Automated Migration

VERSATIL can automate ${plan.automationPercentage}% of this migration.

### Run Auto-Migration
\`\`\`bash
npm run versatil:migrate -- --plan=${plan.id}
\`\`\`

### Manual Steps Required
${plan.manualSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

## Testing Strategy

${plan.testingStrategy}

## Rollback Plan

${plan.rollbackPlan}

## 🔗 Related

- **Epic**: [${plan.epic.title}](../../epics/${plan.epic.docPath})
- **ADR**: [ADR-${plan.adr}](../decision-records/ADR-${plan.adr}.md)

---

**Status**: ${plan.status}
**Last Updated**: ${new Date().toISOString()} (Auto-sync)
`;

    await fs.promises.writeFile(guidePath, content);

    // Store in RAG
    await vectorMemoryStore.storeMemory({
      content,
      metadata: {
        documentType: 'migration_guide',
        version: plan.toVersion,
        breakingChanges: plan.breakingChanges.length,
        tags: ['migration', 'breaking_change', 'architecture']
      }
    });

    console.log(`📘 Created migration guide: ${guidePath}`);
  }

  /**
   * AUTO-DETECT: Tech debt and create refactor epics
   */
  async detectTechDebt(): Promise<TechDebtReport> {
    console.log('🔍 Analyzing codebase for tech debt...');

    const debt: TechDebtItem[] = [];

    // 1. Code complexity analysis
    const complexFiles = await this.analyzeCodeComplexity();
    debt.push(...complexFiles.map(f => ({
      type: 'complexity',
      file: f.path,
      severity: f.complexity > 20 ? 'high' : 'medium',
      description: `Cyclomatic complexity: ${f.complexity}`,
      suggestedAction: 'Refactor into smaller functions'
    })));

    // 2. Outdated dependencies
    const outdatedDeps = await this.checkOutdatedDependencies();
    debt.push(...outdatedDeps.map(d => ({
      type: 'outdated_dependency',
      package: d.name,
      severity: d.security ? 'critical' : 'low',
      description: `${d.name}: ${d.current} → ${d.latest}`,
      suggestedAction: `Update to ${d.latest}`
    })));

    // 3. Duplicate code
    const duplicates = await this.findDuplicateCode();
    debt.push(...duplicates.map(dup => ({
      type: 'duplication',
      files: dup.files,
      severity: 'medium',
      description: `${dup.lines} lines duplicated`,
      suggestedAction: 'Extract to shared utility'
    })));

    // 4. Missing tests
    const untested = await this.findUntestedCode();
    debt.push(...untested.map(u => ({
      type: 'missing_tests',
      file: u.path,
      severity: 'high',
      description: `${u.coverage}% coverage (threshold: 80%)`,
      suggestedAction: 'Add unit tests'
    })));

    // Generate report
    const report: TechDebtReport = {
      totalItems: debt.length,
      byType: this.groupByType(debt),
      bySeverity: this.groupBySeverity(debt),
      estimatedEffort: this.estimateEffort(debt),
      prioritizedList: this.prioritizeDebt(debt),
      suggestedEpics: []
    };

    // Auto-create refactor epics for high-priority debt
    for (const item of report.prioritizedList.slice(0, 5)) {
      if (item.severity === 'critical' || item.severity === 'high') {
        const epic = await this.createRefactorEpic(item);
        report.suggestedEpics.push(epic);
      }
    }

    // Save report
    await this.saveTechDebtReport(report);

    console.log(`✅ Tech debt analysis complete: ${debt.length} items, ${report.suggestedEpics.length} epics created`);

    return report;
  }

  /**
   * R&D: Innovation Lab - Experiment with new patterns
   */
  async runInnovationExperiment(experiment: Experiment): Promise<ExperimentResult> {
    console.log(`🧪 Running innovation experiment: ${experiment.name}`);

    const result: ExperimentResult = {
      experimentId: experiment.id,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      startTime: Date.now(),
      status: 'running'
    };

    try {
      // 1. Setup experiment environment
      await this.setupExperimentEnv(experiment);

      // 2. Run experiment code
      const outcome = await this.runExperimentCode(experiment);

      // 3. Measure results
      const metrics = await this.measureExperimentMetrics(outcome);

      // 4. Compare with baseline
      const comparison = await this.compareWithBaseline(metrics, experiment.baseline);

      result.status = 'completed';
      result.outcome = outcome;
      result.metrics = metrics;
      result.comparison = comparison;
      result.endTime = Date.now();

      // 5. Document learnings
      await this.documentExperimentLearnings(result);

      // 6. If successful, create adoption epic
      if (comparison.improvement > 20) {
        const adoptionEpic = await this.createAdoptionEpic(experiment, result);
        result.adoptionEpic = adoptionEpic;
      }

    } catch (error: any) {
      result.status = 'failed';
      result.error = error.message;
      result.endTime = Date.now();
    }

    // Store experiment in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(result),
      metadata: {
        experimentId: result.experimentId,
        status: result.status,
        tags: ['innovation', 'experiment', 'r&d']
      }
    });

    console.log(`${result.status === 'completed' ? '✅' : '❌'} Experiment ${result.name}: ${result.status}`);

    return result;
  }

  /**
   * Document experiment learnings
   */
  private async documentExperimentLearnings(result: ExperimentResult): Promise<void> {
    const docPath = `docs/innovation/experiments/${result.experimentId}.md`;

    const content = `# Experiment: ${result.name}

**ID**: ${result.experimentId}
**Status**: ${result.status}
**Duration**: ${result.endTime! - result.startTime}ms
**Date**: ${new Date(result.startTime).toISOString()}

## Hypothesis

${result.hypothesis}

## Methodology

${result.outcome?.methodology || 'N/A'}

## Results

### Metrics
${Object.entries(result.metrics || {}).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

### Comparison with Baseline
${result.comparison ? `
- **Improvement**: ${result.comparison.improvement}%
- **Performance**: ${result.comparison.performance > 0 ? '+' : ''}${result.comparison.performance}%
- **Code Simplicity**: ${result.comparison.codeSimplicity > 0 ? '+' : ''}${result.comparison.codeSimplicity}%
` : 'No baseline comparison'}

## Learnings

${result.outcome?.learnings || 'N/A'}

## Recommendation

${result.comparison?.improvement > 20 ? `
✅ **Adopt**: This pattern shows significant improvement.
[Adoption Epic Created](../../epics/${result.adoptionEpic?.docPath})
` : `
⚠️ **Do Not Adopt**: Improvement not significant enough to justify adoption.
`}

## Code Samples

\`\`\`typescript
${result.outcome?.codeSnapshot || ''}
\`\`\`

---

**Auto-Generated**: ${new Date().toISOString()}
`;

    await fs.promises.writeFile(docPath, content);
    console.log(`📚 Documented experiment: ${docPath}`);
  }
}
```

---

## 🔄 Continuous Evolution Cycle

### How VERSATIL Evolves Without Losing Context

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTINUOUS EVOLUTION CYCLE                                      │
│  (Runs 24/7, triggered by events)                                │
└─────────────────────────────────────────────────────────────────┘

1. CODE CHANGE EVENT
   ↓
   User commits code → Git hook triggers VERSATIL
   ↓
   ContextualMemoryEngine.storeProjectEvent({
     type: 'code_change',
     files: ['src/auth/oauth.ts'],
     commit: 'a3b5c7d',
     epic: 'EPIC-001'
   })
   ↓
   RAG stores: Code change + Epic link + Conversation link

2. DOCUMENTATION UPDATE
   ↓
   LivingDocumentationEngine detects code change
   ↓
   Auto-updates:
   - docs/epics/EPIC-001-auth-system.md (progress section)
   - docs/prd/feature-auth.md (implementation details)
   - docs/architecture/current-architecture.md (component diagram)
   ↓
   All updates linked in RAG → Cross-references maintained

3. BREAKING CHANGE DETECTION
   ↓
   StrategicIntelligenceEngine.detectBreakingChanges()
   ↓
   Finds: API endpoint changed from /auth to /api/v2/auth
   ↓
   Auto-creates:
   - Migration guide: docs/architecture/migration-guides/v1-to-v2-api.md
   - ADR: docs/architecture/decision-records/ADR-004-api-versioning.md
   - Migration epic: EPIC-003-api-v2-migration
   ↓
   All documents cross-linked in RAG

4. TECH DEBT ANALYSIS
   ↓
   StrategicIntelligenceEngine.detectTechDebt() (runs daily)
   ↓
   Finds:
   - 3 files with complexity > 20
   - 5 outdated dependencies (2 security issues)
   - 120 lines of duplicate code
   ↓
   Auto-creates:
   - Tech debt report: docs/roadmaps/tech-debt-roadmap.md
   - Refactor epics: EPIC-004-reduce-complexity, EPIC-005-update-deps
   ↓
   Prioritizes by severity → Adds to roadmap

5. INNOVATION EXPERIMENT
   ↓
   StrategicIntelligenceEngine.runInnovationExperiment({
     name: 'Test React Server Components',
     hypothesis: 'RSC will reduce client bundle by 40%'
   })
   ↓
   Runs experiment → Measures: 43% bundle reduction
   ↓
   Auto-creates:
   - Experiment doc: docs/innovation/experiments/EXP-001-rsc.md
   - Adoption epic: EPIC-006-adopt-rsc
   ↓
   Learnings stored in RAG → Future projects benefit

6. CROSS-SESSION CONTINUITY
   ↓
   User runs: /resume conversation
   ↓
   ConversationBackupManager.generateEpicAwareResumeContext()
   ↓
   Loads:
   - Conversation history
   - Linked epics (EPIC-001, EPIC-003, EPIC-006)
   - All related docs (ADRs, PRDs, migration guides)
   - RAG context (every decision, code change, experiment)
   ↓
   User continues EXACTLY where they left off → Zero context loss

7. STRATEGIC ROADMAP UPDATE
   ↓
   Every epic completion triggers roadmap update
   ↓
   LivingDocumentationEngine.updateRoadmap()
   ↓
   Adjusts:
   - Quarterly roadmap (shifts priorities based on completion)
   - Tech debt roadmap (removes completed, adds new debt)
   - Innovation roadmap (adds experiments, tracks adoptions)
   ↓
   All roadmaps version-controlled + RAG-stored
```

---

## 🎯 CTO-Level Intelligence Features

### 1. Strategic Decision Support

```typescript
// User asks: "Should we migrate to Next.js 15?"
const decision = await ctoIntelligence.analyzeStrategicDecision({
  question: "Migrate to Next.js 15?",
  context: {
    currentStack: 'Next.js 14',
    projectPhase: 'growth',
    teamSize: 5
  }
});

// VERSATIL analyzes:
// - RAG: Past migration experiences
// - Current codebase: Breaking changes impact
// - Tech debt: Opportunity to fix debt during migration
// - Innovation experiments: RSC benefits from EXP-001

// Outputs:
// - ADR: ADR-005-nextjs-15-migration.md
// - Migration epic: EPIC-007-nextjs-15
// - Cost/benefit analysis
// - Risk assessment
// - Recommended timeline
```

### 2. Automated Architecture Reviews

```typescript
// Runs weekly
const review = await ctoIntelligence.runArchitectureReview();

// Analyzes:
// - Code structure evolution
// - Dependency graph changes
// - Performance regression
// - Security vulnerabilities
// - Scalability bottlenecks

// Outputs:
// - Architecture review report: docs/architecture/reviews/2025-10-week-41.md
// - Identified issues → Creates epics
// - Updates architecture diagram
// - Proposes improvements
```

### 3. R&D Experimentation Pipeline

```typescript
// VERSATIL continuously experiments with new patterns
const pipeline = [
  { name: 'Test Server Components', priority: 'high' },
  { name: 'Evaluate Edge Runtime', priority: 'medium' },
  { name: 'Benchmark Bun vs Node', priority: 'low' }
];

for (const experiment of pipeline) {
  const result = await innovationLab.runExperiment(experiment);

  if (result.improvement > 20) {
    // Auto-create adoption epic
    // Document learnings
    // Update roadmap
  }
}
```

---

## 🗂️ Routing & Reference System

### Smart Routing Table

**File**: `~/.versatil/routing/epic-routing-table.json`

```json
{
  "epics": {
    "EPIC-001": {
      "title": "User Authentication System",
      "project": "/Users/user/my-app",
      "docs": [
        "/Users/user/my-app/docs/epics/EPIC-001-auth-system.md",
        "/Users/user/my-app/docs/prd/feature-auth.md",
        "/Users/user/my-app/docs/architecture/decision-records/ADR-003-oauth-provider.md"
      ],
      "code": [
        "/Users/user/my-app/src/auth/oauth-handler.ts",
        "/Users/user/my-app/src/auth/session-manager.ts",
        "/Users/user/my-app/tests/auth/oauth.test.ts"
      ],
      "conversations": [
        "~/.versatil/conversations/conv-ldx7a9-k3m2p1.json"
      ],
      "agents": ["alex-ba", "marcus-backend", "james-frontend", "maria-qa"],
      "ragTags": ["epic_001", "auth", "oauth"],
      "status": "in_progress",
      "phase": "development"
    }
  },
  "crossReferences": {
    "/Users/user/my-app/src/auth/oauth-handler.ts": {
      "epics": ["EPIC-001"],
      "docs": ["docs/epics/EPIC-001-auth-system.md"],
      "adrs": ["ADR-003-oauth-provider"],
      "conversations": ["conv-ldx7a9-k3m2p1"]
    }
  }
}
```

### Query Examples

```typescript
// Find all docs for epic
const docs = routingTable.getDocsForEpic('EPIC-001');
// → [epic doc, PRD, ADR]

// Find epic for code file
const epic = routingTable.getEpicForFile('src/auth/oauth-handler.ts');
// → EPIC-001

// Find conversation that created epic
const conv = routingTable.getConversationForEpic('EPIC-001');
// → conv-ldx7a9-k3m2p1

// Find all related documents
const related = routingTable.getAllRelated('EPIC-001');
// → { docs: [...], code: [...], conversations: [...], adrs: [...] }
```

---

## 🎓 Summary: Self-Evolving Intelligence

### What Makes VERSATIL Unique

1. **Zero Context Loss**
   - Every event stored in RAG with rich context
   - Complete project timeline reconstruction
   - Cross-session continuity (resume anywhere)

2. **Living Documentation**
   - Auto-updates on every code change
   - Epic docs, PRDs, architecture, ADRs
   - Always in sync with codebase

3. **CTO-Level Strategy**
   - Breaking change detection + migration plans
   - Tech debt analysis + refactor epics
   - Architecture reviews + improvements

4. **R&D Mindset**
   - Continuous innovation experiments
   - Pattern learning + adoption
   - Best practice evolution

5. **Smart Organization**
   - Clear file hierarchy (framework vs project)
   - Routing table (epic → docs → code → conversation)
   - Bidirectional cross-references

### The Result

VERSATIL becomes a **"Contextual Engineering & Intelligence Agent"** that:

- ✅ Remembers every decision (why, when, who)
- ✅ Updates documentation automatically
- ✅ Detects problems proactively (breaking changes, tech debt)
- ✅ Experiments continuously (innovation lab)
- ✅ Evolves strategically (CTO-level intelligence)
- ✅ Never loses context (RAG + routing)

**It's not just a framework - it's your R&D department and CTO, working 24/7.**

---

**Architecture Version**: 1.0.0
**Last Updated**: 2025-10-08
**Next Review**: 2025-10-15
**Status**: Design Complete - Ready for Implementation
