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
  - "Bash"
skills:
  - "compounding-engineering"
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

## ⚠️ CRITICAL: Agent Invocation Requirements

**YOU MUST INVOKE THESE AGENTS - THIS IS MANDATORY, NOT OPTIONAL:**

When executing this `/plan` command, you are REQUIRED to use the Task tool to invoke agents at these steps:

- **Step 2 (Pattern Search)**: MUST invoke `dr-ai-ml` AND `oliver-mcp` agents using Task tool
- **Step 3 (Template Selection)**: MUST invoke `sarah-pm` AND `alex-ba` agents using Task tool
- **Step 4 (Context Research)**: MUST invoke 5-6 agents in parallel using Task tool (marcus, james, dana, maria, alex, optionally dr-ai-ml)
- **Step 7 (Todo Creation)**: MUST invoke `sarah-pm` agent using Task tool
- **Step 8 (Verification)**: MUST invoke `victor-verifier` agent using Task tool

**How to invoke agents:**
```typescript
// Example for Step 2:
Task("dr-ai-ml", `Search RAG for similar features to: "${feature_description}"...`)
Task("oliver-mcp", `Route pattern search to optimal RAG store...`)
```

**Do NOT skip agent invocations**. The examples in the steps below are NOT just documentation - they are workflows you MUST execute using the Task tool.

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

### 2. Learn from Past Features (CODIFY Phase) ⭐ AGENT-DRIVEN

<thinking>
Use Dr.AI-ML + Oliver-MCP agents to query historical implementations via GraphRAG (preferred) or Vector store. Agents provide ML-powered similarity scoring and intelligent RAG routing. This makes plans 40% more accurate by leveraging past experience - the core of Compounding Engineering.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE THESE AGENTS USING THE TASK TOOL:**

**ACTION 1: Invoke Dr.AI-ML Agent**
Call the Task tool with:
- `subagent_type: "Dr.AI-ML"`
- `description: "Search RAG for similar patterns"`
- `prompt: "Search RAG for similar features to '${feature_description}'. Use ML-powered similarity scoring, query GraphRAG via Oliver-MCP's routing, calculate similarity scores (min 75%), consolidate lessons learned by priority, provide confidence intervals for effort estimates, and extract code examples with file:line references. Return format: { patterns: [], total_found, avg_effort, avg_confidence, consolidated_lessons: {high, medium, low}, recommended_approach }"`

**STOP AND WAIT for Dr.AI-ML agent to complete before proceeding.**

**ACTION 2: Invoke Oliver-MCP Agent**
Call the Task tool with:
- `subagent_type: "Oliver-MCP"`
- `description: "Route RAG search with anti-hallucination"`
- `prompt: "Route the pattern search to the optimal RAG store with anti-hallucination validation. Try GraphRAG first (no API quota, offline), fallback to Vector store if needed, detect hallucinations in historical data, validate pattern quality, and return the search method used (graphrag/vector/local/none). Ensure patterns from Dr.AI-ML are validated and not hallucinated."`

**STOP AND WAIT for Oliver-MCP agent to complete before proceeding.**

**⛔ CHECKPOINT: You MUST have BOTH agent outputs before Step 3. If either agent failed, retry or use fallback estimates.**

**Agent-Driven Pattern Search:**

Invoke Dr.AI-ML and Oliver-MCP for collaborative RAG search:
```typescript
// Agent Task 1: Dr.AI-ML searches patterns with ML-powered similarity
Task dr-ai-ml: `Search RAG for similar features to: "${feature_description}"

**Your Expertise Needed:**
- Use semantic similarity analysis (embeddings-based)
- Query GraphRAG via Oliver-MCP's intelligent routing
- Calculate similarity scores using ML models (min 75%)
- Consolidate lessons learned by priority (high/medium/low)
- Provide confidence intervals for effort estimates
- Extract code examples with file:line references

**Context:**
- Category: ${detected_category || 'auto-detect from description'}
- Target: Top 5 most similar features
- Min Similarity: 0.75 (75%)

**Return Format:**
{
  patterns: [{ feature_name, effort_hours, similarity_score, lessons_learned, code_examples }],
  total_found: number,
  avg_effort: number,
  avg_confidence: number,
  consolidated_lessons: { high: [], medium: [], low: [] },
  recommended_approach: string
}

**If no patterns found:** Return empty array with graceful message - this becomes the first pattern!`

// Agent Task 2: Oliver-MCP routes to optimal RAG store
Task oliver-mcp: `Route pattern search to optimal RAG store with anti-hallucination

**Your Routing Strategy:**
1. **Try GraphRAG first** (preferred: no API quota, works offline)
   - Check Neo4j connection health
   - Query knowledge graph for similar features
   - Validate returned patterns for completeness

2. **Detect hallucinations in historical data:**
   - Verify feature IDs actually exist
   - Check effort data is not zero/null
   - Validate code examples reference real files
   - Flag low-quality patterns (<50% complete)

3. **Fallback to Vector store if needed:**
   - GraphRAG unavailable → try Supabase pgvector
   - Vector store empty → try local in-memory store
   - All failed → return empty (graceful degradation)

4. **Log search method used:**
   - Return: 'graphrag' | 'vector' | 'local' | 'none'
   - Track success rate for optimization

**Quality Gates:**
- Patterns must have: feature_name, effort_hours, lessons_learned
- Similarity scores must be >0 and <=1
- Code examples must include valid file paths

**If all stores fail:** Log warning, return empty array, don't throw error`
```

**Actual Implementation (Skill Integration):**

Use the `compounding-engineering` skill to execute PatternSearchService:

```bash
! npx tsx .claude/skills/compounding-engineering/scripts/execute-pattern-search.ts \
  --description "${feature_description}" \
  --category "${detected_category}" \
  --min-similarity 0.75 \
  --limit 5
```

The skill returns JSON with pattern search results:

```typescript
// Parse JSON output from skill execution
const searchResult = JSON.parse(skillOutput);
const hasHistoricalContext = searchResult.patterns.length > 0;

// Graceful degradation on error (skill returns error JSON, not throws)
if (searchResult.error) {
  console.warn('Pattern search failed:', searchResult.error);
  // searchResult will have empty patterns array and fallback structure
}
```

**Historical Context Output:**

Display results based on whether patterns were found:

```markdown
## Historical Context (Codified Learnings) 🎓

${hasHistoricalContext ? `
Found **${searchResult.total_found} similar features** via ${searchResult.search_method}

**Top Matches:**
${searchResult.patterns.slice(0, 3).map((p, i) =>
  `${i + 1}. "${p.feature_name}" (${Math.round(p.similarity_score * 100)}% similar)
   - Effort: ${p.effort_hours}h (range: ${p.effort_range.min}-${p.effort_range.max}h)
   - Success: ${p.success_score}% | Agent: ${p.agent}`
).join('\n')}

**Aggregated Insights:**
- 📊 Average Effort: ${searchResult.avg_effort || 'N/A'}h across ${searchResult.patterns.length} features
- 🎯 Confidence: ${searchResult.avg_confidence || 'N/A'}%
- ⚠️ Common Pitfalls: ${searchResult.consolidated_lessons.slice(0, 2).join('; ') || 'None identified'}

💡 **Recommendation:** ${searchResult.recommended_approach || 'Proceed with template-based planning'}
` : `
No historical patterns found - this is a novel feature. Planning will use templates and agent research.

📝 After implementation, this becomes a pattern for future similar features!
`}
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

### 3. Check Plan Templates ⭐ AGENT-DRIVEN

<thinking>
Use Sarah-PM + Alex-BA agents to collaboratively select templates. Sarah makes strategic decisions on template selection vs custom planning, while Alex assesses complexity and validates effort estimates. This provides transparent reasoning instead of black-box scoring.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE THESE AGENTS USING THE TASK TOOL:**

**ACTION 1: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Template selection decision"`
- `prompt: "Review available templates and decide whether to use a template or proceed with custom planning for '${feature_description}'. Analyze match scores, provide strategic reasoning for your decision, consider complexity factors, and recommend template selection or custom approach. Templates available: ${list_available_templates}. Return: { recommended_template: string|null, match_score: number, reasoning: string, should_use_template: boolean }"`

**STOP AND WAIT for Sarah-PM agent to complete before proceeding.**

**ACTION 2: Invoke Alex-BA Agent**
Call the Task tool with:
- `subagent_type: "Alex-BA"`
- `description: "Complexity assessment"`
- `prompt: "Assess complexity of '${feature_description}' against ${recommended_template || 'baseline'}. Extract requirements from description, compare to template base requirements, calculate complexity factor (0.8x-1.5x), validate acceptance criteria, and provide confidence score. Sarah-PM recommended: ${sarah_decision}. Return: { complexity_factor: number, confidence: number, requirements: [], validation_notes: string, should_adjust_estimate: boolean }"`

**STOP AND WAIT for Alex-BA agent to complete before proceeding.**

**⛔ CHECKPOINT: You MUST have BOTH agent outputs before proceeding. Use their reasoning to decide on template usage.**

**Do this before continuing to Step 4.**

**Agent-Driven Template Selection:**

Invoke Sarah-PM and Alex-BA for collaborative template evaluation:
```typescript
// Agent Task 1: Sarah-PM makes strategic template decision
Task sarah-pm: `Select optimal template for: "${feature_description}"

**Available Templates (5):**
1. auth-system.yaml - OAuth2, JWT, passwords (28h base)
2. crud-endpoint.yaml - REST API + CRUD (8h base)
3. dashboard.yaml - Analytics + charts (16h base)
4. api-integration.yaml - Third-party API (12h base)
5. file-upload.yaml - Secure upload + S3 (10h base)

**Your Strategic Analysis:**
- Analyze feature category from description
- Review templateMatcher scores (70% threshold)
- Consider historical patterns from Step 2
- Decide: Use template OR custom planning
- Override if --template=NAME flag provided

**Decision Criteria:**
- Score ≥70%: Recommend template
- Score 50-69%: Template with heavy customization
- Score <50%: Custom agent planning
- User flag: Override with specified template

**Return:** { decision, template_selected, match_score, reasoning, customizations_needed }`

// Agent Task 2: Alex-BA validates complexity and effort
Task alex-ba: `Assess complexity for template: ${sarah_decision.template_selected}

**Your Analysis:**
- Extract requirements from: "${feature_description}"
- Compare to template baseline: ${template.requirements}
- Calculate complexity factor (0.8x - 1.5x):
  • 0.8x: Simpler than baseline (basic implementation)
  • 1.0x: Matches baseline (standard)
  • 1.2-1.5x: More complex (additional features)

**Requirements Coverage:**
- What's covered by template?
- What needs customization?
- What's out of scope?

**Confidence Assessment:**
- High (90%+): Template closely matches
- Medium (70-89%): Fits with customization
- Low (<70%): Template may not be ideal

**Return:** { complexity_factor, adjusted_effort, confidence, requirements_analysis, risks }`

// Sequential execution: Sarah decides, then Alex validates
const sarahDecision = await waitForAgent('sarah-pm');

let finalTemplate = null;
if (sarahDecision.decision === 'use_template') {
  const alexAssessment = await waitForAgent('alex-ba');
  finalTemplate = { ...sarahDecision, ...alexAssessment };
}
```

**Actual Implementation (Skill Integration):**

Use the `compounding-engineering` skill to execute TemplateMatcher:

```bash
! npx tsx .claude/skills/compounding-engineering/scripts/execute-template-matcher.ts \
  --description "${feature_description}" \
  ${flags.template ? `--template "${flags.template}"` : ''}
```

The skill returns JSON with template matching results:

```typescript
// Parse JSON output from skill execution
const matchResult = JSON.parse(skillOutput);
let templateUsed = null;

// Use template if score ≥70% (or explicit flag provided)
if (matchResult.use_template && matchResult.best_match) {
  templateUsed = matchResult.best_match;
}

// Graceful degradation on error
if (matchResult.error) {
  console.warn('Template matching failed:', matchResult.error);
  // Proceed with custom planning (agent-driven)
}
```

**Available Templates:**
- `auth-system.yaml` - OAuth2, JWT, password hashing (28 hours)
- `crud-endpoint.yaml` - REST API with database CRUD (8 hours)
- `dashboard.yaml` - Analytics dashboard with charts (16 hours)
- `api-integration.yaml` - Third-party API integration (12 hours)
- `file-upload.yaml` - Secure file upload with S3 (10 hours)

**Template Match Output:**
```markdown
## Template Match 📋

${templateUsed ? `
**Template Applied:** ${templateUsed.template_name} (${templateUsed.match_score}% match)
**Matched Keywords:** ${templateUsed.matched_keywords.join(', ')}
**Base Effort:** ${templateUsed.estimated_effort.hours}h
**Category:** ${templateUsed.category}

**Adjustment Factors:**
- Historical Data: ${hasHistoricalContext ? `Average ${searchResult.avg_effort}h from similar features` : 'No historical baseline'}
- Complexity: Standard (1.0x) - adjust based on requirements
- Confidence: ${templateUsed.match_score}%

**Template Structure:**
- Database: ${templateUsed.phases?.database?.length || 0} tasks
- API: ${templateUsed.phases?.api?.length || 0} tasks
- Frontend: ${templateUsed.phases?.frontend?.length || 0} tasks
- Testing: ${templateUsed.phases?.testing?.length || 0} tasks

**Next Steps:** Using template phases as foundation, customizing based on specific requirements
` : `
**No template match** - Using custom agent research
**Reason:** ${matchResult?.all_matches?.[0] ? `Best match only ${matchResult.all_matches[0].match_score}% (threshold: 70%)` : 'No template available for this feature category'}
**Next:** Proceed to Step 4 - Repository Research with all agents
`}
```

**Override Option:**
User can force template: `/plan --template=auth-system "My feature"` (Sarah validates but uses specified template)

### 4. Repository Research & Context Gathering ⭐ CONTEXT-AWARE

<thinking>
Pass historical context to all agents so they start research with proven patterns, not blank slate. This is Compounding Engineering Step 4 - every agent benefits from past implementations.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE 5-6 AGENTS IN PARALLEL USING THE TASK TOOL:**

First, prepare the historical context bundle from Step 2 results:
```typescript
const historicalContext = {
  patterns: searchResult.patterns,
  lessons: searchResult.consolidated_lessons,
  code_examples: searchResult.patterns.flatMap(p => p.code_examples),
  avg_effort: searchResult.avg_effort
};
```

Then invoke ALL agents IN PARALLEL using multiple Task tool calls in a SINGLE message:

**ACTION 1-6: Invoke All 6 Agents Simultaneously**

For each agent below, call the Task tool with the specified parameters. Send all 6 Task calls in parallel:

1. **Alex-BA**: `subagent_type: "Alex-BA"`, `description: "Analyze requirements with historical context"`, `prompt: "Analyze requirements for '${feature_description}'. Historical lessons (high priority): ${historicalContext.lessons.high}. Extract functional/non-functional requirements, map to user stories, incorporate lessons learned to avoid past pitfalls, define acceptance criteria. Return: { requirements, user_stories, acceptance_criteria, lessons_incorporated }"`

2. **Marcus-Backend**: `subagent_type: "Marcus-Backend"`, `description: "Research backend patterns"`, `prompt: "Research backend patterns for '${feature_description}'. Historical code examples: ${historicalContext.code_examples.filter(backend)}. Begin research at proven implementations, identify API patterns, review security, check database patterns, learn from historical mistakes. Return: { api_patterns, security_findings, code_references, lessons_applied }"`

3. **James-Frontend**: `subagent_type: "James-Frontend"`, `description: "Research frontend patterns"`, `prompt: "Research frontend patterns for '${feature_description}'. Historical UI examples: ${historicalContext.code_examples.filter(frontend)}. Review historical components, check accessibility (WCAG 2.1 AA), identify reusable patterns, avoid UI mistakes from lessons. Return: { ui_patterns, accessibility_findings, component_references, lessons_applied }"`

4. **Dana-Database**: `subagent_type: "Dana-Database"`, `description: "Research database patterns"`, `prompt: "Research database patterns for '${feature_description}'. Historical migration examples: ${historicalContext.code_examples.filter(database)}. Review schema patterns, analyze indexes from past pitfalls, check RLS policies, identify proven migration strategies. Return: { schema_patterns, index_recommendations, migration_strategy, lessons_applied }"`

5. **Maria-QA**: `subagent_type: "Maria-QA"`, `description: "Plan test coverage"`, `prompt: "Plan test coverage for '${feature_description}'. Historical test gaps: ${historicalContext.lessons.filter(test_related)}. Review historical coverage gaps, plan comprehensive test suites addressing past mistakes, identify edge cases from history, define quality gates. Return: { test_strategy, coverage_targets, edge_cases, lessons_applied }"`

6. **Dr.AI-ML** (optional, only if ML/analytics detected): `subagent_type: "Dr.AI-ML"`, `description: "Research ML patterns"`, `prompt: "Research ML patterns for '${feature_description}'. Historical ML implementations: ${historicalContext.code_examples.filter(ml)}. Review model architectures, analyze performance requirements, identify data pipeline patterns. Return: { ml_patterns, model_recommendations, pipeline_strategy, lessons_applied }"`

**STOP AND WAIT for ALL agents to complete before proceeding to Step 5.**

**⛔ CHECKPOINT: You MUST have outputs from all agents before continuing. Use their findings to build the implementation plan.**

**Context-Aware Agent Research:**

Invoke 6 agents in parallel, each receiving historical patterns + lessons learned from Step 2:

```typescript
// Prepare context bundle from Step 2
const historicalContext = {
  patterns: searchResult.patterns,           // Top 5 similar features
  lessons: searchResult.consolidated_lessons, // High/medium/low priority lessons
  code_examples: searchResult.patterns.flatMap(p => p.code_examples),
  avg_effort: searchResult.avg_effort,
  confidence: searchResult.avg_confidence
};

// Agent Task 1: Alex-BA analyzes requirements using historical lessons
Task alex-ba: `Analyze requirements for: "${feature_description}"

**Historical Context (from ${historicalContext.patterns.length} similar features):**
- Lessons Learned (High Priority):
${historicalContext.lessons.high.map(l => `  • ${l}`).join('\n')}

- Average Effort: ${historicalContext.avg_effort}h across ${historicalContext.patterns.length} features
- Confidence: ${historicalContext.confidence}%

**Your Task:**
- Extract functional + non-functional requirements
- Map to user stories (As a [user], I want [goal] so that [benefit])
- **Incorporate lessons learned** into requirements (avoid past pitfalls)
- Define acceptance criteria (Given/When/Then)
- Identify security/compliance requirements from history

**Use History to:**
- ✅ Include requirements that were missed in past features (e.g., "forgot to include rate limiting")
- ✅ Add edge cases discovered in previous implementations
- ✅ Incorporate proven success criteria

**Return:** { requirements, user_stories, acceptance_criteria, lessons_incorporated }`

// Agent Task 2: Marcus-Backend researches patterns, starts at historical examples
Task marcus-backend: `Research backend patterns for: "${feature_description}"

**Historical Code Examples (start here):**
${historicalContext.code_examples.filter(ex => ex.layer === 'backend').map(ex =>
  `- ${ex.file_path}:${ex.line_start}-${ex.line_end} (${ex.description})`
).join('\n')}

**Your Task:**
- Begin research at proven implementations above (Read files at file:line references)
- Identify API patterns, middleware, error handling
- Review security implementations (authentication, authorization)
- Check database queries + connection patterns
- **Learn from historical mistakes** (e.g., "missing error handling caused 500s")

**Use History to:**
- ✅ Start with working implementation, not blank slate
- ✅ Validate current codebase matches proven patterns
- ✅ Identify improvements based on lessons learned

**Return:** { api_patterns, security_findings, code_references, lessons_applied }`

// Agent Task 3: James-Frontend researches UI patterns using historical components
Task james-frontend: `Research frontend patterns for: "${feature_description}"

**Historical UI Examples (start here):**
${historicalContext.code_examples.filter(ex => ex.layer === 'frontend').map(ex =>
  `- ${ex.file_path}:${ex.line_start}-${ex.line_end} (${ex.description})`
).join('\n')}

**Historical Lessons (Accessibility/UX):**
${historicalContext.lessons.high.filter(l => l.includes('accessibility') || l.includes('UX')).join('\n')}

**Your Task:**
- Review historical component implementations
- Check accessibility compliance (WCAG 2.1 AA) from past features
- Identify reusable components and patterns
- **Avoid UI mistakes documented in lessons** (e.g., "missing keyboard navigation")

**Use History to:**
- ✅ Reuse validated accessible components
- ✅ Apply proven responsive patterns
- ✅ Incorporate UX improvements from feedback

**Return:** { component_patterns, accessibility_checklist, reusable_components, lessons_applied }`

// Agent Task 4: Dana-Database researches schema patterns using historical migrations
Task dana-database: `Research database patterns for: "${feature_description}"

**Historical Schema Examples (start here):**
${historicalContext.code_examples.filter(ex => ex.layer === 'database').map(ex =>
  `- ${ex.file_path}:${ex.line_start}-${ex.line_end} (${ex.description})`
).join('\n')}

**Historical Lessons (Performance/Schema):**
${historicalContext.lessons.high.filter(l => l.includes('index') || l.includes('migration') || l.includes('RLS')).join('\n')}

**Your Task:**
- Review historical schema patterns
- Identify proven index strategies (avoid past N+1 queries)
- Check RLS policies from past implementations
- **Incorporate lessons learned** (e.g., "forgot to add index on foreign key, caused slow queries")

**Use History to:**
- ✅ Include indexes that were missing in past features
- ✅ Apply proven RLS patterns
- ✅ Avoid migration pitfalls from history

**Return:** { schema_patterns, index_strategy, rls_policies, lessons_applied }`

// Agent Task 5: Maria-QA plans tests using historical coverage gaps
Task maria-qa: `Plan test coverage for: "${feature_description}"

**Historical Test Lessons:**
${historicalContext.lessons.high.filter(l => l.includes('test') || l.includes('coverage') || l.includes('bug')).join('\n')}

**Historical Coverage Gaps:**
- Features with <80% coverage: ${historicalContext.patterns.filter(p => p.test_coverage < 80).map(p => p.feature_name).join(', ')}
- Common untested scenarios: ${historicalContext.lessons.medium.filter(l => l.includes('untested')).join('; ')}

**Your Task:**
- Define test coverage requirements (80%+ minimum)
- Plan unit, integration, e2e test suites
- **Address historical coverage gaps** (e.g., "forgot to test error cases")
- Include accessibility tests (WCAG 2.1 AA)
- Add security validation checkpoints

**Use History to:**
- ✅ Test scenarios that were missed in past features
- ✅ Avoid coverage blind spots
- ✅ Include regression tests for historical bugs

**Return:** { test_strategy, coverage_requirements, test_cases, lessons_applied }`

// Agent Task 6: (Optional) Dr.AI-ML for ML/AI features (if relevant)
// Only invoke if feature includes ML, RAG, embeddings, analytics
if (feature_description.includes('search') || feature_description.includes('recommendation') || feature_description.includes('analytics')) {
  Task dr-ai-ml: `Research ML patterns for: "${feature_description}"

  **Historical ML Patterns:**
  ${historicalContext.code_examples.filter(ex => ex.layer === 'ml').map(ex =>
    `- ${ex.file_path} (${ex.description})`
  ).join('\n')}

  **Your Task:**
  - Identify ML/AI requirements (embeddings, RAG, training)
  - Review historical model performance metrics
  - Plan data pipeline architecture
  - **Learn from past ML lessons** (e.g., "embedding model choice affected search quality")

  **Return:** { ml_requirements, data_pipeline, model_recommendations, lessons_applied }`
}

// Wait for all agents to complete (parallel execution)
const [alexAnalysis, marcusFindings, jamesPatterns, danaSchema, mariaTests, draiML] =
  await Promise.all([
    waitForAgent('alex-ba'),
    waitForAgent('marcus-backend'),
    waitForAgent('james-frontend'),
    waitForAgent('dana-database'),
    waitForAgent('maria-qa'),
    feature_requires_ml ? waitForAgent('dr-ai-ml') : null
  ]);
```

**Context-Aware Research Outputs:**

Each agent returns findings + lessons_applied:

- [x] **Alex-BA**: Requirements with incorporated lessons (avoid past pitfalls)
- [x] **Marcus-Backend**: API patterns starting from historical code examples
- [x] **James-Frontend**: UI patterns with proven accessibility compliance
- [x] **Dana-Database**: Schema patterns with indexes from past pitfalls
- [x] **Maria-QA**: Test strategy covering historical gaps
- [x] **Dr.AI-ML** (optional): ML patterns with proven model choices

**Key Benefits:**
- 🚀 Research starts with 3-5 relevant examples (not blank slate)
- ✅ Avoid past mistakes documented in lessons learned
- 📂 Code reuse from historical file:line references
- 🎯 Focus research on proven areas (faster, more accurate)

**Research Output Format:**
```markdown
## Repository Analysis 🔍

### Requirements (Alex-BA)
${alexAnalysis.requirements.map(req => `- ${req}`).join('\n')}

**Lessons Incorporated:**
${alexAnalysis.lessons_incorporated.map(lesson => `✅ ${lesson}`).join('\n')}

### Backend Patterns (Marcus-Backend)
- **Starting Point:** ${marcusFindings.code_references[0].file_path}
- **API Patterns:** ${marcusFindings.api_patterns.join(', ')}
- **Security:** ${marcusFindings.security_findings.join('; ')}

**Lessons Applied:**
${marcusFindings.lessons_applied.map(lesson => `✅ ${lesson}`).join('\n')}

### Frontend Patterns (James-Frontend)
- **Reusable Components:** ${jamesPatterns.reusable_components.join(', ')}
- **Accessibility:** ${jamesPatterns.accessibility_checklist.join(', ')}

**Lessons Applied:**
${jamesPatterns.lessons_applied.map(lesson => `✅ ${lesson}`).join('\n')}

### Database Schema (Dana-Database)
- **Schema Patterns:** ${danaSchema.schema_patterns.join('; ')}
- **Indexes:** ${danaSchema.index_strategy.join('; ')}
- **RLS Policies:** ${danaSchema.rls_policies.join('; ')}

**Lessons Applied:**
${danaSchema.lessons_applied.map(lesson => `✅ ${lesson}`).join('\n')}

### Test Strategy (Maria-QA)
- **Coverage Target:** 80%+
- **Test Types:** ${mariaTests.test_strategy.join(', ')}
- **Key Scenarios:** ${mariaTests.test_cases.slice(0, 5).join('; ')}

**Historical Gaps Addressed:**
${mariaTests.lessons_applied.map(lesson => `✅ ${lesson}`).join('\n')}
```

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

### 7. Create Dual Todo System ⭐ AGENT-DRIVEN

<thinking>
Sarah-PM orchestrates dual todo creation using her PM expertise for dependency detection, agent assignments, and execution wave planning. This provides transparent reasoning instead of black-box service calls.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE SARAH-PM USING THE TASK TOOL:**

**ACTION: Invoke Sarah-PM Agent**
Call the Task tool with:
- `subagent_type: "Sarah-PM"`
- `description: "Generate dual todo system with dependencies"`
- `prompt: "Generate dual todo system for '${feature_description}'. Input: Phase breakdown from Steps 2-5, historical patterns, template selection, agent research findings. Your strategic planning: (1) Create todo specs from phases with title/priority/agent/effort/acceptance_criteria, (2) Detect dependencies automatically (frontend→backend, tests→all, migrations→API), (3) Assign optimal agents by expertise, (4) Identify execution waves (parallel Wave 1, sequential Wave 2/3), (5) Generate Mermaid dependency graph, (6) Link historical patterns to todos, (7) Create TodoWrite specs + todos/*.md file specs. Return: { todos_for_todowrite: [], todos_files: [], dependency_graph_mermaid: string, execution_waves: {wave1: [], wave2: [], wave3: []}, reasoning: string }"`

**STOP AND WAIT for Sarah-PM agent to complete before proceeding.**

**⛔ CHECKPOINT: You MUST have Sarah-PM's todo orchestration output before Step 8. Use her strategic planning to create the dual todo system.**

**Agent-Driven Todo Orchestration:**

Invoke Sarah-PM to generate dual todo system with strategic planning:

```typescript
// Agent Task: Sarah-PM orchestrates todo creation with dependencies
Task sarah-pm: `Generate dual todo system for: "${feature_description}"

**Input from Previous Steps:**
- Phase breakdown from Steps 2-5
- Historical patterns + lessons learned
- Template selection (if applicable)
- Agent research findings (Alex, Marcus, James, Dana, Maria)

**Your Strategic Planning:**
1. **Create Todo Specifications** from phase breakdown:
   - Title, priority (P1-P4), assigned agent, estimated effort
   - Acceptance criteria from Alex-BA research
   - Implementation notes from agent findings
   - Files involved from Marcus/James/Dana research

2. **Detect Dependencies Automatically**:
   ```typescript
   detectDependencies(phases):
     - Frontend depends on backend API completion
     - Tests depend on all implementation phases
     - Database migrations must complete before API
     - Documentation depends on all features complete

     Example:
     001: Backend API (Marcus-Backend) - No dependencies
     002: Frontend UI (James-Frontend) - Depends on 001
     003: Database Schema (Dana-Database) - No dependencies (parallel with 001)
     004: Tests (Maria-QA) - Depends on 001, 002, 003
     005: Docs (Sarah-PM) - Depends on all
   ```

3. **Assign Optimal Agents** based on expertise:
   - Backend API → Marcus-Backend
   - Frontend UI → James-Frontend
   - Database → Dana-Database
   - Tests → Maria-QA
   - Docs/Planning → Sarah-PM (you)

4. **Identify Execution Waves** (parallel vs sequential):
   ```typescript
   detectWaves(todos_with_dependencies):
     Wave 1 (parallel): Todos with no dependencies
       → Run simultaneously for speed
       → Example: Backend API + Database Schema

     Wave 2 (sequential): Todos depending on Wave 1
       → Run after Wave 1 completes
       → Example: Frontend UI (needs API)

     Wave 3 (sequential): Todos depending on Waves 1+2
       → Run after all implementation done
       → Example: Tests, Docs
   ```

5. **Generate Mermaid Dependency Graph**:
   ```mermaid
   graph TD
     001[Backend API<br/>Marcus<br/>8h] -->|API ready| 002[Frontend UI<br/>James<br/>6h]
     003[Database<br/>Dana<br/>4h] -->|Schema ready| 001
     001 -->|Code ready| 004[Tests<br/>Maria<br/>4h]
     002 -->|UI ready| 004
     004 -->|Tests pass| 005[Docs<br/>Sarah<br/>2h]
   ```

6. **Link Historical Patterns to Todos**:
   - Attach relevant code_examples to each todo
   - Include lessons_learned for agent reference
   - Provide context from Step 2 RAG search

**Return Format:**
```typescript
return {
  todowrite_items: [
    { content: 'Implement backend API', status: 'pending', activeForm: 'Implementing backend API' }
  ],
  files_created: [
    'todos/001-pending-p1-backend-api.md',
    'todos/002-pending-p1-frontend-ui.md',
    ...
  ],
  dependency_graph: '<mermaid graph>',
  execution_waves: [
    { wave_number: 1, can_run_parallel: true, todos: ['001', '003'], estimated_hours: 12 },
    { wave_number: 2, can_run_parallel: false, todos: ['002'], estimated_hours: 6 },
    { wave_number: 3, can_run_parallel: false, todos: ['004', '005'], estimated_hours: 6 }
  ],
  total_estimated_hours: 24,
  agent_assignments: {
    '001': 'Marcus-Backend',
    '002': 'James-Frontend',
    '003': 'Dana-Database',
    '004': 'Maria-QA',
    '005': 'Sarah-PM'
  },
  reasoning: 'Strategic explanation of assignments and wave detection'
}`

**Dependencies Detection Rules:**
- Frontend always depends on backend (API contract)
- Tests always depend on all implementation (nothing to test without code)
- Database migrations should complete before backend (schema needed)
- Docs depend on everything (document complete features only)

**Parallel Execution Strategy:**
- Wave 1: Backend + Database (independent, run parallel)
- Wave 2: Frontend (depends on backend, sequential)
- Wave 3: Tests + Docs (depend on all, sequential but can run parallel with each other)

**Use TodoFileGenerator Service** to create files, but YOU provide the strategic planning:
- Service handles file I/O (writing todos/*.md)
- You provide: specs, dependencies, waves, assignments, reasoning`

// Wait for Sarah to complete planning
const todoOrchestration = await waitForAgent('sarah-pm');

// Use compounding-engineering skill to generate todos
! npx tsx .claude/skills/compounding-engineering/scripts/execute-todo-generator.ts \
  --specs-json '${JSON.stringify(todoOrchestration.todo_specs)}'

// Parse JSON output from skill execution
const todoResult = JSON.parse(skillOutput);
```

**Generated Output:**

Display dual todo system results:

```markdown
## Dual Todo System 📝

${todosCreated ? `
**Created ${todoResult.files_created.length} persistent todo files** + TodoWrite items

**TodoWrite (In-Session Tracking):**
${todoResult.todowrite_items.map((item, i) =>
  `${i + 1}. ${item.content} → ${item.file_path || 'in-memory'}`
).join('\n')}

**Persistent Files (Cross-Session):**
${todoResult.files_created.map((file, i) =>
  `- \`${file}\` (${todoSpecs[i].assigned_agent})`
).join('\n')}

**Dependency Graph:**
${todoResult.dependency_graph}

**Execution Strategy:**
${todoResult.execution_waves.map(wave =>
  `Wave ${wave.wave_number} (${wave.can_run_parallel ? 'PARALLEL' : 'SEQUENTIAL'}): ${wave.todos.join(', ')} - ${wave.estimated_hours}h`
).join('\n')}

**Total Estimated Effort:** ${todoResult.total_estimated_hours} hours
` : `
**TodoWrite Only** - Using in-session tracking (persistent files disabled)

${phases.map((phase, i) => `${i + 1}. ${phase.name} (${phase.agent})`).join('\n')}
`}
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

### 8. Implementation Plan Output ⭐ VERIFIED

<thinking>
Before sending plan to user, invoke Victor-Verifier to validate all factual claims (historical patterns, effort math, code examples, todo files). This prevents hallucinations in planning phase.
</thinking>

**⛔ BLOCKING STEP - YOU MUST INVOKE VICTOR-VERIFIER USING THE TASK TOOL BEFORE SENDING PLAN TO USER:**

**ACTION: Invoke Victor-Verifier Agent**
Call the Task tool with:
- `subagent_type: "Victor-Verifier"`
- `description: "Verify all plan claims before output"`
- `prompt: "Verify ALL factual claims in the plan before sending to user. Claims to verify: (1) Historical Patterns - confirm ${searchResult.patterns.length} features exist in RAG, validate effort hours match, (2) Effort Math - recalculate averages and complexity adjustments within 5%, (3) Template Match - re-run matcher, confirm score within 5%, (4) Code Examples - read files, confirm lines exist and contain expected code, (5) Todo Files - check todos/ directory, confirm files exist, (6) Agent Assignments - read todo files, confirm assigned_agent matches claims. Verification Process: For each claim, verify against ground truth, calculate confidence score (100 = verified, 90 = within tolerance, 0 = hallucination). Return: { verified: boolean, confidence: number 0-100, hallucinations: [{claim, actual, severity}], warnings: [{claim, actual, severity}], corrections: [{original_claim, corrected_claim}] }. Threshold: confidence ≥95% to approve, <95% flag corrections."`

**STOP AND WAIT for Victor-Verifier agent to complete before displaying plan to user.**

**⛔ CHECKPOINT: If Victor reports hallucinations (confidence <95%), CORRECT all flagged claims before showing plan. If verified (≥95%), proceed to display.**

**Pre-Output Verification:**

Invoke Victor-Verifier before displaying plan to user:

```typescript
// Agent Task: Victor-Verifier validates all plan claims
Task victor-verifier: `Verify all factual claims in plan before sending to user

**Claims to Verify:**

1. **Historical Patterns** (from Step 2):
   - Claim: "${searchResult.patterns.length} similar features found"
   - Verify: Query RAG independently, confirm count matches
   - Claim: "Feature '${searchResult.patterns[0].feature_name}' took ${searchResult.patterns[0].effort_hours}h"
   - Verify: RAG lookup, confirm effort data exists and matches

2. **Effort Math** (from Steps 2-3):
   - Claim: "Average ${searchResult.avg_effort}h based on ${searchResult.patterns.length} features"
   - Verify: Recalculate average from pattern efforts, confirm within 5%
   - Claim: "Adjusted effort ${adjustedEffort}h (complexity ${complexityFactor}x)"
   - Verify: Recalculate baseEffort * complexityFactor, confirm matches

3. **Template Match** (from Step 3):
   - Claim: "${template.name} matched at ${matchScore}%"
   - Verify: Re-run templateMatcher independently, confirm score within 5%

4. **Code Examples** (from Step 4):
   - Claim: "${codeExample.file_path}:${codeExample.line_start}-${codeExample.line_end}"
   - Verify: Read file, confirm lines exist and contain expected code

5. **Todo Files** (from Step 7):
   - Claim: "Created ${todoResult.files_created.length} todo files"
   - Verify: Check todos/ directory, confirm all files exist

6. **Agent Assignments** (from Step 7):
   - Claim: "Todo 001 assigned to Marcus-Backend"
   - Verify: Read todos/001-*.md, confirm assigned_agent matches

**Verification Process:**
```typescript
verifyPlan(plan):
  confidence_scores = []

  for each claim in plan:
    result = verify_against_ground_truth(claim)

    if result.verified:
      confidence_scores.push(100)
    else if result.within_tolerance (±5%):
      confidence_scores.push(90)
      flag_warning(claim, result.actual_value)
    else:
      confidence_scores.push(0)
      flag_hallucination(claim, result.actual_value)

  overall_confidence = average(confidence_scores)

  if overall_confidence >= 95:
    return { verified: true, confidence: overall_confidence }
  else if overall_confidence >= 85:
    return { verified: true, warnings: flagged_warnings, confidence: overall_confidence }
  else:
    return { verified: false, hallucinations: flagged_claims, confidence: overall_confidence }
```

**Return Format:**
```typescript
return {
  verified: boolean,
  confidence: number, // 0-100
  hallucinations: [
    { claim: 'Feature X took 24h', actual: 'Feature X took 28h', severity: 'high' }
  ],
  warnings: [
    { claim: 'Average 27h', actual: '26.8h', severity: 'low' }
  ],
  corrections: [
    { original_claim: '...', corrected_claim: '...' }
  ]
}
```

**If hallucinations detected** (confidence <95%):
- Correct claims before sending to user
- Log hallucination for training
- Flag in output: "⚠️ Claims verified, minor corrections applied"

**If verified** (confidence ≥95%):
- Send plan to user as-is
- Log success for metrics`

// Wait for verification
const verification = await waitForAgent('victor-verifier');

// Apply corrections if needed
if (!verification.verified) {
  plan = applyCorrections(plan, verification.corrections);
}
```

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
