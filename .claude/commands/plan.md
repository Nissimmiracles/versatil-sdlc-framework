---
description: "Plan feature implementation with OPERA agents and create structured todos"
argument-hint: "[feature description]"
model: "claude-sonnet-4-5"
allowed-tools:
  - "Task"
  - "TodoWrite"
  - "Read"
  - "Write"
  - "Grep"
  - "Glob"
---

# Plan Feature Implementation with OPERA Agents

## Introduction

Transform feature requests, bugs, or improvements into well-structured implementation plans using VERSATIL's OPERA agents. This command breaks down work into actionable tasks with dual todo tracking (TodoWrite + todos/*.md files).

## Flags

- `--validate`: Run `/validate-workflow` after planning (5-10 min validation)
- `--dry-run`: Simulate execution without creating todos or making changes
- `--template=NAME`: Use specific plan template (auth-system, crud-endpoint, dashboard, etc.)

## Usage Examples

```bash
# Basic planning (default)
/plan "Add user authentication"

# Planning with validation (recommended for large features)
/plan --validate "Add user authentication"

# Dry-run planning (test before committing)
/plan --dry-run "Add analytics dashboard"

# Use specific template
/plan --template=auth-system "Implement login system"
```

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

## Main Tasks

### 0. Initialize VELOCITY Workflow (NEW)

<thinking>
Start the VELOCITY Workflow Orchestrator to track this planning session through all 5 phases (Plan → Assess → Delegate → Work → Codify). This enables automatic phase detection, state persistence, and compounding engineering benefits.
</thinking>

**Initialize Workflow:**

Call velocity CLI to start workflow tracking:
```bash
velocity plan "<feature_description>"
```

This creates:
- Workflow ID and state file (`~/.versatil/state/current-workflow.json`)
- Plan phase tracking
- Automatic transition to Assess phase when ready
- Historical context loading from RAG

**Benefits:**
- ✅ Phase auto-detection (file edits → WORK, builds → ASSESS, session end → CODIFY)
- ✅ Cross-session state persistence
- ✅ Compounding engineering (next feature 40% faster)
- ✅ Automatic learning codification

**Note**: If `velocity plan` fails (orchestrator not available), continue with TodoWrite-only approach (backward compatible).

### 1. Pre-Planning Assessment (ASSESS Phase)

<thinking>
Before planning, ensure the environment is ready for implementation. Check framework health, dependencies, and prerequisites to catch blockers early.
</thinking>

**Quality Gates Check:**

Run `/assess` command to validate readiness:
- [ ] Framework health ≥ 80% (npm run monitor)
- [ ] Git working tree clean (no uncommitted changes blocking)
- [ ] Dependencies installed (node_modules exists, npm audit clean)
- [ ] Database connected (Supabase or local PostgreSQL)
- [ ] Environment variables set (.env file valid)
- [ ] Build passing (npm run build succeeds)
- [ ] Tests passing (npm test succeeds)

**Readiness Thresholds:**
- ✅ **90-100%**: GO - Ready to proceed with planning
- ⚠️ **70-89%**: CAUTION - Can proceed with warnings
- ❌ **< 70%**: NO-GO - Fix blockers first (show specific issues)

**Override Option:**
If assessment shows warnings but user wants to proceed:
```bash
/plan --force "feature description"
```

### 2. Learn from Past Features (CODIFY Phase) ⭐ NEW

<thinking>
Use the PatternSearchService to query historical implementations via GraphRAG (preferred) or Vector store. This makes plans 40% more accurate by leveraging past experience - the core of Compounding Engineering.
</thinking>

**Automated Pattern Search:**

Import and use the pattern search service:
```typescript
import { patternSearchService } from '@/rag/pattern-search';

const searchResult = await patternSearchService.searchSimilarFeatures({
  description: feature_description,
  category: detected_category, // auth, crud, dashboard, integration, file-upload
  min_similarity: 0.75,
  limit: 5
});

// Extract insights
const avgEffort = searchResult.average_effort;
const consolidatedLessons = searchResult.consolidated_lessons;
const confidence = searchResult.confidence_score;
const topPatterns = searchResult.patterns; // Top 5 similar features
```

**Historical Context Output:**
```markdown
## Historical Context (Codified Learnings) 🎓
- ✅ Similar feature #123: "${pattern.feature_name}" took ${pattern.effort_hours}h (${pattern.similarity_score}% similar)
- ⚠️ Common pitfall: ${consolidatedLessons.high_priority[0]}
- ✅ Proven pattern: ${consolidatedLessons.medium_priority[0]}
- 📚 Code examples: ${pattern.code_examples[0].file}:${pattern.code_examples[0].lines}
- 📊 Effort estimate: ${avgEffort.mean}h ± ${avgEffort.std}h (${searchResult.patterns.length} similar features)
- 🎯 Confidence: ${confidence}% (${searchResult.search_method})
```

**Search Strategy:**
1. Try GraphRAG first (no API quota, works offline)
2. Fallback to Vector store if GraphRAG unavailable
3. If no historical data: Proceed to templates (Step 3)

**Benefits:**
- 40% faster planning (Every Inc Compounding Engineering)
- Accurate effort estimates (±10-20% vs ±50% without history)
- Avoid past mistakes (consolidated lessons from similar features)
- Code reuse (direct file:line references to proven patterns)

### 3. Check Plan Templates ⭐ NEW

<thinking>
Use the TemplateMatcher service to automatically match feature descriptions to pre-built templates with proven patterns, effort estimates, and success metrics.
</thinking>

**Automated Template Matching:**

Import and use the template matcher:
```typescript
import { templateMatcher } from '@/templates/template-matcher';

const matchResult = await templateMatcher.matchTemplate({
  description: feature_description,
  explicit_template: flags.template // From --template=NAME flag
});

if (matchResult.best_match && matchResult.best_match.match_score >= 70) {
  const template = matchResult.best_match;
  // Use template as starting point
  // Adjust effort based on complexity_adjustment
}
```

**Available Templates:**
- `auth-system.yaml` - OAuth2, JWT, password hashing (28 hours)
- `crud-endpoint.yaml` - REST API with database CRUD (8 hours)
- `dashboard.yaml` - Analytics dashboard with charts (16 hours)
- `api-integration.yaml` - Third-party API integration (12 hours)
- `file-upload.yaml` - Secure file upload with S3 (10 hours)

**Matching Algorithm:**
1. **Keyword extraction**: Parse description for auth, crud, dashboard, api, upload keywords
2. **Scoring**: Base score from keyword overlap + category boost (20%) + name boost (30%)
3. **Threshold**: 70% match required to use template (else custom planning)
4. **Complexity adjustment**: Multiply base effort by 0.8-1.5 based on requirements

**Template Match Output:**
```markdown
## Template Applied 📋
**Template**: ${template.template_name} (${template.match_score}% match)
**Matched Keywords**: ${template.matched_keywords.join(', ')}
**Base Effort**: ${template.estimated_effort.hours}h (${template.complexity})
**Adjusted Effort**: ${adjustedEffort}h (complexity factor: ${complexityFactor})
**Customizations**: [Project-specific adaptations based on context]
```

**Override Option:**
User can force specific template: `/plan --template=auth-system "My feature"`

### 4. Repository Research & Context Gathering

<thinking>
Understand the project's architecture, patterns, and conventions using parallel OPERA agents for comprehensive analysis.
</thinking>

Run these agents in parallel for **three-tier analysis**:

- Task alex-ba(feature_description) - Requirements analysis, API contract definition
- Task dana-database(feature_description) - Database architecture research, data modeling
- Task marcus-backend(feature_description) - Backend API patterns research
- Task james-frontend(feature_description) - Frontend component patterns research

**Research Outputs:**

- [ ] Document all findings with file paths (e.g., `src/services/auth.ts:42`, `supabase/migrations/001_users.sql`)
- [ ] Include external documentation URLs and best practices
- [ ] Reference similar implementations (e.g., `#123`, `PR #456`)
- [ ] Note team conventions from CLAUDE.md or docs/
- [ ] Identify database schema patterns and migration strategies

### 5. Feature Planning & Task Breakdown

<thinking>
Think like Alex-BA (Business Analyst) - what makes this feature clear and actionable? Consider user needs, technical constraints, and quality requirements.
</thinking>

**Requirements Analysis (Alex-BA):**

- [ ] Create user stories with acceptance criteria
- [ ] Identify stakeholders and their needs
- [ ] Define success metrics
- [ ] Document edge cases and error scenarios

**Technical Planning (Three-Tier Coordination):**

**Database Layer (Dana-Database):**
- [ ] Design database schema (tables, relationships, constraints)
- [ ] Plan migrations strategy (versioning, rollback)
- [ ] Define RLS policies for multi-tenant data
- [ ] Identify indexes for query performance
- [ ] Plan vector storage if RAG/embeddings needed

**API Layer (Marcus-Backend):**
- [ ] Define API contracts and endpoints
- [ ] Design request/response schemas matching database
- [ ] Plan authentication/authorization middleware
- [ ] Identify security considerations (OWASP Top 10)
- [ ] Estimate performance requirements (< 200ms API response)

**Frontend Layer (James-Frontend):**
- [ ] Plan UI components and layouts
- [ ] Design state management strategy
- [ ] Plan form validation and error handling
- [ ] Identify accessibility requirements (WCAG 2.1 AA)
- [ ] Design responsive breakpoints

**Quality Strategy (Maria-QA):**

- [ ] Define test coverage requirements (80%+ minimum)
- [ ] Plan unit, integration, and e2e test suites
- [ ] Identify accessibility requirements (WCAG 2.1 AA)
- [ ] List security validation checkpoints

### 6. Choose Implementation Detail Level

Select planning depth based on feature complexity:

#### 📄 MINIMAL (Quick Feature)

**Best for:** Simple bugs, small enhancements, clear requirements

**Includes:**
- Feature description
- Basic acceptance criteria
- Essential tasks only

**TodoWrite Structure:**
```markdown
1. Implement [feature]
2. Add tests (80%+ coverage)
3. Update documentation
```

**todos/*.md File:**
```markdown
# [Feature Name] - P2

## Status
- [x] Pending
- **Priority**: P2 (High)
- **Assigned**: Marcus-Backend + James-Frontend
- **Estimated**: Small

## Acceptance Criteria
- [ ] Core functionality working
- [ ] Tests passing (80%+ coverage)

## Implementation Steps
1. Update API endpoint in src/api/users.ts
2. Create UI component in src/components/UserProfile.tsx
3. Add tests in __tests__/UserProfile.test.tsx
```

#### 📋 MORE (Standard Feature)

**Best for:** Most features, complex bugs, team collaboration

**Includes everything from MINIMAL plus:**
- Detailed requirements breakdown
- Technical architecture decisions
- Dependencies and risks
- Phased implementation approach

**TodoWrite Structure:**
```markdown
1. Phase 1: Requirements & Design (Alex-BA + Sarah-PM)
2. Phase 2: Backend Implementation (Marcus-Backend)
3. Phase 3: Frontend Implementation (James-Frontend)
4. Phase 4: Testing & QA (Maria-QA)
5. Phase 5: Documentation & Release (Sarah-PM)
```

**todos/*.md Files:**
Multiple files created (001-pending-p1-backend-api.md, 002-pending-p1-frontend-ui.md, etc.)

#### 📚 A LOT (Comprehensive Planning)

**Best for:** Major features, architectural changes, multi-sprint work

**Includes everything from MORE plus:**
- Detailed phased implementation plan
- Alternative approaches evaluated
- Resource requirements and timeline
- Risk mitigation strategies
- Future extensibility considerations
- Cross-agent collaboration choreography

**TodoWrite Structure:**
```markdown
1. Research Phase (All Agents Parallel)
   - Alex-BA: Requirements gathering
   - Marcus: Backend feasibility study
   - James: Frontend architecture design
   - Maria: Test strategy planning

2. Design Phase (Collaborative)
   - API contract definition
   - Data model design
   - Component architecture
   - Integration points

3. Implementation Phase 1: Backend (Marcus)
4. Implementation Phase 2: Frontend (James)
5. Integration Phase (Marcus + James)
6. QA Phase (Maria)
7. Release Phase (Sarah)
```

**todos/*.md Files:**
Comprehensive set with dependencies tracked (e.g., 002 depends on 001)

### 7. Create Dual Todo System ⭐ NEW

<thinking>
Use the TodoFileGenerator service to automatically create both TodoWrite items (in-session) and todos/*.md files (cross-session persistence) with dependency tracking and execution wave detection.
</thinking>

**Automated Todo Generation:**

Import and use the todo file generator:
```typescript
import { todoFileGenerator } from '@/planning/todo-file-generator';

// Prepare todo specifications from plan breakdown
const todoSpecs = phases.map(phase => ({
  title: phase.name,
  priority: phase.priority, // p1, p2, p3, p4
  assigned_agent: phase.agent,
  estimated_effort: phase.effort, // Small, Medium, Large, XL
  acceptance_criteria: phase.acceptance_criteria,
  dependencies: {
    depends_on: phase.depends_on || [],
    blocks: phase.blocks || []
  },
  implementation_notes: phase.notes,
  files_involved: phase.files,
  context: {
    feature_description: feature_description,
    related_issue: issue_number,
    related_pr: pr_number
  }
}));

// Generate dual todos
const result = await todoFileGenerator.generateTodos(todoSpecs);

// Use result.todowrite_items for TodoWrite
// Files automatically created in todos/ directory
```

**Generated Output:**

**TodoWrite (In-Session Tracking):**
```markdown
✅ 1. ${result.todowrite_items[0].content}
🔄 2. ${result.todowrite_items[1].content} - IN PROGRESS
⏳ 3. ${result.todowrite_items[2].content}
⏳ 4. ${result.todowrite_items[3].content}
```

**todos/*.md Files (Persistent Tracking):**
```
Created ${result.files_created.length} todo files:
- ${result.files_created[0]} (${specs[0].assigned_agent})
- ${result.files_created[1]} (${specs[1].assigned_agent}, depends on ${specs[0].number})
- ${result.files_created[2]} (${specs[2].assigned_agent}, depends on ${specs[0].number}+${specs[1].number})

Dependency Graph (Mermaid):
${result.dependency_graph}

Execution Waves:
${result.execution_waves.map(w => `Wave ${w.wave}: ${w.tasks.join(', ')} (${w.type})`).join('\n')}
```

**File Naming Convention:**
```
[NUMBER]-[STATUS]-[PRIORITY]-[SHORT-DESCRIPTION].md

Auto-generated examples:
001-pending-p1-implement-auth-api.md (Marcus-Backend)
002-pending-p1-create-login-ui.md (James-Frontend, depends on 001)
003-pending-p2-add-test-coverage.md (Maria-QA, depends on 001+002)
```

**Benefits:**
- Auto-numbering (finds next available number)
- Dependency visualization (Mermaid graphs)
- Parallel detection (execution waves)
- Zero manual file creation
- TodoWrite sync (both systems always in sync)

### 8. Implementation Plan Output ⭐ ENHANCED

**Enhanced Plan Structure with Confidence Scoring:**

```markdown
## Executive Summary
[2-3 sentence overview]

**🎯 Confidence Score: ${confidence}%** (based on ${historicalCount} similar implementations)
**📊 Estimated Effort**: ${avgEffort.mean}h ± ${avgEffort.std}h (${confidenceInterval}% confidence)
**🎬 Ready to Execute**: ${readinessScore >= 90 ? '✅ YES' : readinessScore >= 70 ? '⚠️ WITH CAUTION' : '❌ FIX BLOCKERS FIRST'}

---

## Assessment Results (ASSESS Phase)
- ✅ Framework Health: ${healthScore}%
- ${gitClean ? '✅' : '❌'} Git Status: ${gitStatus}
- ${depsOk ? '✅' : '❌'} Dependencies: ${depStatus}
- ${dbConnected ? '✅' : '⚠️'} Database: ${dbStatus}
- ${envValid ? '✅' : '❌'} Environment: ${envStatus}
- ${buildPassing ? '✅' : '❌'} Build/Tests: ${buildStatus}
- **Readiness Score**: ${readinessScore}% - ${readinessVerdict}

---

## Historical Context (CODIFY Phase) 🎓
${searchResult.patterns.length > 0 ? `
- ✅ Similar feature "${searchResult.patterns[0].feature_name}": ${searchResult.patterns[0].effort_hours}h (${searchResult.patterns[0].similarity_score}% similar)
- ⚠️ High-priority lessons: ${searchResult.consolidated_lessons.high.join(', ')}
- ✅ Proven patterns: ${searchResult.consolidated_lessons.medium.join(', ')}
- 📚 Code examples: ${searchResult.patterns[0].code_examples[0].file}:${searchResult.patterns[0].code_examples[0].lines}
- 📊 Historical accuracy: ±${searchResult.effort_variance}% (${searchResult.patterns.length} features analyzed)
- 🎯 Confidence: ${searchResult.confidence_score}% (via ${searchResult.search_method})
` : `
⚠️ No historical data found - using template-based estimates
📊 Estimated effort has ±50% confidence interval (conservative)
💡 Recommendation: Start with small MVP to build historical data for future features
`}

---

## Template Applied 📋
**Template**: ${matchResult.best_match?.template_name || 'None (custom planning)'}
${matchResult.best_match ? `
**Match Score**: ${matchResult.best_match.match_score}% (keywords: ${matchResult.best_match.matched_keywords.join(', ')})
**Base Effort**: ${matchResult.best_match.estimated_effort.hours}h (${matchResult.best_match.complexity})
**Complexity Adjustment**: ${complexityFactor}x → Adjusted effort: ${adjustedEffort}h
**Customizations**: [Project-specific adaptations based on repository context]
` : `
**Reason**: No template matched above 70% threshold
**Approach**: Custom agent-driven research and planning
`}

---

## Alternative Approaches 🔀
${alternatives.map(alt => `
### Option ${alt.number}: ${alt.name} (Effort: ${alt.effort}h)
**Pros**: ${alt.pros.join(', ')}
**Cons**: ${alt.cons.join(', ')}
**Risk Level**: ${alt.risk}
`).join('\n')}

**Recommended**: Option ${recommendedOption} (best balance of effort vs. risk)

---

## Risk Assessment ⚠️

### High Priority Risks 🔴
${risks.high.map(r => `- ${r.description} (Mitigation: ${r.mitigation})`).join('\n')}

### Medium Priority Risks 🟡
${risks.medium.map(r => `- ${r.description} (Mitigation: ${r.mitigation})`).join('\n')}

### Low Priority Risks 🟢
${risks.low.map(r => `- ${r.description}`).join('\n')}

---

## User Stories (Alex-BA)
${userStories.map(story => `
- **As a** ${story.role}, **I want** ${story.goal} **so that** ${story.benefit}
  - Acceptance: ${story.acceptance.join(', ')}
`).join('\n')}

---

## Technical Approach

### Backend (Marcus-Backend)
- **API Endpoints**: ${apiEndpoints.map(e => `${e.method} ${e.route}`).join(', ')}
- **Data Models**: ${dataModels.join(', ')}
- **Security**: ${securityConsiderations.join(', ')}
- **Performance Target**: < 200ms API response time

### Frontend (James-Frontend)
- **Components**: ${components.join(', ')}
- **State Management**: ${stateManagement}
- **Accessibility**: WCAG 2.1 AA compliant (${a11yRequirements.join(', ')})
- **Responsive**: ${breakpoints.join(', ')}

### Testing (Maria-QA)
- **Unit Tests**: 80%+ coverage required
- **Integration Tests**: ${integrationScenarios.join(', ')}
- **E2E Tests**: ${e2eFlows.join(', ')}
- **Security Tests**: OWASP Top 10 validation

---

## Implementation Phases

${phases.map((phase, i) => `
### Phase ${i+1}: ${phase.name} (${phase.agent})
- **Effort**: ${phase.effort} (${effortHours[phase.effort]}h)
- **Tasks**: ${phase.tasks.join(', ')}
- **Deliverables**: ${phase.deliverables.join(', ')}
- **Acceptance**: ${phase.acceptance.join(', ')}
- **Dependencies**: ${phase.depends_on.length > 0 ? `Depends on Phase ${phase.depends_on.join(', ')}` : 'None'}
`).join('\n')}

---

## Dual Todo System 📝

**TodoWrite (In-Session)**:
${todowriteItems.map((item, i) => `${item.status === 'completed' ? '✅' : item.status === 'in_progress' ? '🔄' : '⏳'} ${i+1}. ${item.content}`).join('\n')}

**Persistent Files Created**:
${createdFiles.map(f => `- ${f.filename} (${f.agent}, ${f.effort})`).join('\n')}

**Dependency Graph**:
\`\`\`mermaid
${dependencyGraph}
\`\`\`

**Execution Waves** (for parallel execution):
${executionWaves.map(w => `- Wave ${w.wave}: ${w.tasks.join(', ')} (${w.type === 'parallel' ? '⚡ parallel' : '🔗 sequential'})`).join('\n')}

---

## Success Metrics 🎯
- **User Satisfaction**: ${successMetrics.userSatisfaction}
- **Performance**: ${successMetrics.performance}
- **Quality**: ${successMetrics.quality}
- **Timeline**: ${successMetrics.timeline}

---

## References 📚
- **Similar Code**: ${references.code.map(r => `${r.file}:${r.line}`).join(', ')}
- **Documentation**: ${references.docs.join(', ')}
- **Related PRs**: ${references.prs.join(', ')}

---

## Next Steps ▶️
1. Review and approve plan (confidence: ${confidence}%)
2. Execute Phase 1: ${phases[0].name}
3. Run `/work` to begin implementation with OPERA agents
```

### 9. Parallel Agent Execution Pattern

**OPERA Collaboration Workflow:**

```yaml
Request: "Add user authentication"

Parallel_Research (Step 1):
  Alex-BA:
    - Analyze security requirements
    - Define user stories
    - Create acceptance criteria

  Marcus-Backend:
    - Research auth patterns in codebase
    - Evaluate JWT vs session approach
    - Check existing security middleware

  James-Frontend:
    - Find login component examples
    - Check form validation patterns
    - Review accessibility standards

Sequential_Implementation (Step 2):
  Marcus-Backend (Phase 1):
    - Implement /api/auth/login endpoint
    - Add JWT token generation
    - OWASP security validation
    - Auto-generate stress tests (Rule 2)

  James-Frontend (Phase 2, depends on Marcus):
    - Create LoginForm.tsx component
    - Add form validation
    - Implement WCAG 2.1 AA accessibility
    - Integrate with Marcus's API

  Maria-QA (Phase 3, watches both):
    - Validate 80%+ test coverage
    - Run security compliance checks
    - Visual regression testing
    - Quality gate enforcement

Coordination (Throughout):
  Sarah-PM:
    - Track progress in TodoWrite
    - Update todos/*.md files
    - Generate status reports
    - Manage dependencies
```

### 10. Final Review & Output

**Pre-Output Checklist:**

- [ ] All OPERA agents consulted
- [ ] Requirements clearly defined (Alex-BA)
- [ ] Technical approach validated (Marcus + James)
- [ ] Testing strategy complete (Maria-QA)
- [ ] TodoWrite list created
- [ ] todos/*.md files generated
- [ ] Dependencies mapped
- [ ] Success metrics defined

## Output Format

Present the complete plan with:

1. **Executive Summary** (2-3 sentences)
2. **TodoWrite List** (top-level tasks)
3. **todos/*.md File Previews** (show created files)
4. **Implementation Plan** (detailed breakdown)
5. **Next Steps** (immediate actions)

**Example TodoWrite Output:**
```markdown
I've created an implementation plan for [feature]:

TodoWrite (In-Session):
✅ 1. Research phase completed (Alex-BA, Marcus, James parallel)
🔄 2. Backend implementation (Marcus-Backend) - IN PROGRESS
⏳ 3. Frontend implementation (James-Frontend)
⏳ 4. QA validation (Maria-QA)
⏳ 5. Documentation & release (Sarah-PM)

Created todos/*.md files:
- 001-pending-p1-auth-api-implementation.md (Marcus)
- 002-pending-p1-login-ui-component.md (James, depends on 001)
- 003-pending-p2-test-coverage.md (Maria, depends on 001+002)
- 004-pending-p2-documentation.md (Sarah, depends on all)

Ready to proceed with backend implementation?
```

## Thinking Approaches

- **Analytical (Alex-BA):** Break down requirements into user stories
- **Technical (Marcus + James):** Evaluate architecture and feasibility
- **Quality-First (Maria-QA):** Plan for 80%+ coverage from the start
- **Collaborative (All OPERA):** Parallel research, sequential implementation
- **Persistent (TodoWrite + .md):** Dual tracking for zero context loss

## Quality Gates Integration

**Automatic Enforcement:**

- **Before Implementation**: Requirements approval (Alex-BA)
- **During Development**: Real-time test coverage (Maria-QA)
- **Before Commit**: 80%+ coverage required (Maria-QA)
- **Before Merge**: Security + accessibility validation (Marcus + James)
- **Before Release**: Full QA validation (Maria-QA)

## AI-Era Considerations

- [ ] Account for accelerated development with AI pair programming
- [ ] Include OPERA agent prompts that worked during research
- [ ] Note which agents were most effective for exploration
- [ ] Emphasize comprehensive testing given rapid implementation
- [ ] Document agent-generated code that needs human review
- [ ] Use parallel agent execution to maximize velocity (Rule 1)

---

**Framework Integration:**
- **Rule 1**: Parallel agent execution for research phase
- **Rule 2**: Auto-generate stress tests during implementation
- **Rule 3**: Daily health audits ensure plan stays on track
- **Rule 4**: Zero-config agent activation based on file patterns
- **Rule 5**: Automated release orchestration after QA approval
