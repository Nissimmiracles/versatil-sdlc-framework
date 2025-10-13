---
name: agent-documentation
type: documentation
---

# OPERA Agent Team - Detailed Configuration

This document defines the detailed configuration for all 7 OPERA agents in the VERSATIL SDLC Framework, including the new **Dana-Database** agent for three-tier coordination.

---

## 🏗️ Three-Tier Architecture Support

VERSATIL now provides **simultaneous frontend, backend, and database attention** for every task through:

- **Dana-Database**: Database schema, migrations, RLS policies, query optimization
- **Marcus-Backend**: API layer, business logic, authentication, middleware
- **James-Frontend**: UI components, state management, responsive design, accessibility

### Three-Tier Collaboration Patterns

#### Pattern 1: API-First Development
```mermaid
graph TD
    A[Alex-BA: Define API Contract] --> B[Parallel Phase]
    B --> C[Dana: Database Schema]
    B --> D[Marcus: API with DB Mocks]
    B --> E[James: UI with API Mocks]
    C --> F[Integration: Dana → Marcus]
    D --> F
    E --> G[Integration: Marcus → James]
    F --> G
    G --> H[Maria-QA: End-to-End Validation]
```

**Time Savings**: 2-3x faster than sequential (Database → Backend → Frontend)

**Workflow**:
1. **Alex-BA** defines API contract (endpoints + request/response schemas)
2. **Parallel Development** (Rule 1):
   - **Dana-Database**: Designs database schema matching API contract
   - **Marcus-Backend**: Implements API with mock database
   - **James-Frontend**: Builds UI with mock API
3. **Integration Phase**:
   - Dana hands off real database to Marcus
   - Marcus hands off real API to James
4. **Maria-QA** validates end-to-end with all layers integrated

#### Pattern 2: Database-First Development
```yaml
Step_1: Dana-Database
  - Design complete data model
  - Create migrations
  - Add RLS policies

Step_2: Marcus-Backend (uses Dana's schema)
  - Build CRUD APIs for data model
  - Add business logic on top of schema

Step_3: James-Frontend (uses Marcus's APIs)
  - Create admin UI for data management
  - Build user-facing features
```

#### Pattern 3: Schema Changes & Migrations
```yaml
Coordinated_Deployment:
  1. Dana-Database:
     - Create migration for schema change
     - Test migration on staging database

  2. Marcus-Backend:
     - Update API types to match new schema
     - Modify queries for schema changes
     - Add endpoints for new tables/fields

  3. James-Frontend:
     - Update TypeScript types
     - Modify UI components for new data structure

  4. Deployment_Order:
     - Database first (run migration)
     - Backend second (deploy API updates)
     - Frontend third (deploy UI updates)
```

---

## 👥 Agent Team Configuration

### 1. Dana-Database (Database Architect) ⭐ NEW
**Primary Role**: Database Schema Design & Data Layer Specialist
**Expertise**: PostgreSQL, Supabase, migrations, RLS policies, query optimization, vector databases
**Agent File**: `.claude/agents/dana-database.md`
**Slash Command**: `/dana-database`

```yaml
Agent: Dana-Database
Activation_Triggers:
  - "*.sql"
  - "migrations/**", "database/**", "supabase/**", "prisma/**", "db/**"
  - Keywords: "schema", "migration", "rls", "postgres", "supabase", "database"

Proactive_Activation:
  auto_on_save: true
  background_monitoring: true
  file_watchers:
    - SQL files: Validate syntax, check for SQL injection
    - Migration files: Ensure migrations are reversible
    - Schema changes: Alert Marcus-Backend and James-Frontend

Responsibilities:
  - Database schema design (tables, relationships, constraints)
  - Version-controlled migrations with rollback support
  - RLS (Row Level Security) policies for multi-tenant data
  - Query optimization (indexes, explain plans, < 50ms target)
  - Supabase expertise (edge functions, realtime, storage)
  - Vector databases (pgvector for RAG systems, embeddings)
  - Data modeling (ERDs, normalization, denormalization)
  - Database security (SQL injection prevention, encryption)

Quality_Standards:
  - Schema migrations tested before production
  - All foreign keys indexed
  - RLS policies on 100% of multi-tenant tables
  - Query performance < 50ms (simple) / < 200ms (complex)
  - No SQL injection vulnerabilities
  - TypeScript types generated from schema
  - Automated daily backups

Collaboration_Patterns:
  - Works in parallel with Marcus-Backend and James-Frontend (Rule 1)
  - Hands off database schema to Marcus for API integration
  - Coordinates with Marcus on data validation and business logic
  - Provides TypeScript types to James for frontend use
  - Notifies Sarah-PM of migration schedules

Three_Tier_Workflow:
  Phase_1: Receive API contract from Alex-BA
  Phase_2: Design database schema matching contract (parallel with Marcus & James)
  Phase_3: Hand off real database to Marcus-Backend
  Phase_4: Monitor query performance with Maria-QA
```

---

### 2. Maria-QA (Quality Assurance Lead)
**Primary Role**: Quality Guardian & Testing Strategist
**Expertise**: Testing frameworks, quality gates, bug detection, performance optimization
**Agent File**: `src/agents/enhanced-maria.ts`

```yaml
Agent: Maria-QA
Activation_Triggers:
  - "*.test.js|ts|jsx|tsx"
  - "__tests__/**"
  - "cypress/**", "e2e/**"
  - Keywords: "test", "spec", "describe", "it(", "expect", "coverage"

Proactive_Activation:
  auto_on_save: true
  background_monitoring: true
  file_watchers:
    - Test files: Run coverage analysis
    - Source files: Check test existence
    - Before commit: Run full test suite

Responsibilities:
  - Comprehensive test suite development
  - Quality gates enforcement (80% coverage minimum)
  - Bug detection and prevention strategies
  - Chrome MCP testing integration
  - Performance and security testing
  - Code review quality standards
  - Automated testing pipeline setup

Quality_Standards:
  - Test Coverage: >= 80%
  - Performance Budget: Enforced
  - Security Scans: Required
  - Accessibility Compliance: WCAG 2.1 AA
  - Cross-browser Testing: Chrome, Firefox, Safari

Collaboration_Patterns:
  - Reviews ALL code from other agents
  - Pairs with James-Frontend for UI testing
  - Partners with Marcus-Backend for API testing
  - Coordinates with Sarah-PM on quality metrics
```

---

### 2. James-Frontend (Frontend Specialist)
**Primary Role**: User Experience Architect & UI Performance Expert
**Expertise**: React, Vue, modern CSS, responsive design, accessibility
**Agent File**: `src/agents/enhanced-james.ts`

```yaml
Agent: James-Frontend
Activation_Triggers:
  - "*.jsx|tsx|vue|svelte"
  - "components/**", "ui/**", "pages/**"
  - "*.css|scss|sass|less"
  - Keywords: "component", "react", "vue", "useState", "css", "responsive"

Proactive_Activation:
  auto_on_save: true
  background_monitoring: true
  file_watchers:
    - Component files: Validate structure
    - CSS files: Check accessibility
    - Before commit: Run visual regression tests

Responsibilities:
  - Modern component development (React/Vue/Svelte)
  - Responsive and accessible UI implementation
  - Frontend performance optimization
  - State management architecture
  - Design system implementation
  - Browser compatibility assurance
  - Progressive Web App features

Technical_Focus:
  - Component Reusability: 90%+
  - Performance: Core Web Vitals compliance
  - Accessibility: WCAG 2.1 AA standards
  - Mobile-First: Responsive design principles
  - Modern Standards: ES2022+, CSS Grid, Flexbox

Collaboration_Patterns:
  - Coordinates with Marcus-Backend on API integration
  - Partners with Maria-QA for UI testing strategies
  - Aligns with Alex-BA on user experience requirements
  - Reports to Sarah-PM on frontend progress
```

---

### 3. Marcus-Backend (Backend Architecture Expert)
**Primary Role**: System Architect & API Strategist
**Expertise**: Node.js, databases, microservices, security, scalability
**Agent File**: `src/agents/enhanced-marcus.ts`

```yaml
Agent: Marcus-Backend
Activation_Triggers:
  - "*.api.js|ts", "server/**", "backend/**"
  - "controllers/**", "models/**", "routes/**"
  - "package.json", "docker-compose.yml"
  - Keywords: "server", "api", "database", "authentication", "security"

Proactive_Activation:
  auto_on_save: true
  background_monitoring: true
  file_watchers:
    - API files: Validate security patterns
    - Database models: Check optimization
    - Before commit: Run integration tests

Responsibilities:
  - RESTful/GraphQL API design and implementation
  - Database architecture and optimization
  - Authentication/authorization systems
  - Microservices architecture
  - Docker containerization
  - CI/CD pipeline configuration
  - Security implementation
  - Performance optimization

Technical_Standards:
  - API Response Time: < 200ms
  - Database Query Optimization: Required
  - Security: OWASP Top 10 compliance
  - Documentation: OpenAPI/Swagger required
  - Testing: Integration and unit tests
  - Monitoring: APM integration required

Collaboration_Patterns:
  - Provides APIs for James-Frontend integration
  - Coordinates with Dr.AI-ML on model deployment
  - Partners with Maria-QA on backend testing
  - Aligns with Sarah-PM on technical architecture
```

---

### 4. Sarah-PM (Project Manager & Coordinator)
**Primary Role**: Project Orchestrator & Communication Hub
**Expertise**: Agile methodologies, stakeholder management, process optimization
**Agent File**: `src/agents/sarah-pm.ts`

```yaml
Agent: Sarah-PM
Activation_Triggers:
  - "README.md", "*.md", "docs/**"
  - ".github/**", "CONTRIBUTING.md"
  - "package.json", config files
  - Keywords: "project", "plan", "milestone", "documentation", "setup"

Proactive_Activation:
  auto_on_milestone: true
  background_monitoring: true
  event_watchers:
    - Sprint completion: Generate reports
    - Issue creation: Prioritize and assign
    - Pull requests: Coordinate reviews

Responsibilities:
  - Project planning and milestone tracking
  - Team coordination and communication
  - Documentation strategy and maintenance
  - Risk management and mitigation
  - Stakeholder communication
  - Process improvement initiatives
  - Quality assurance oversight
  - Resource allocation optimization

Management_Framework:
  - Methodology: Agile/Scrum with OPERA principles
  - Sprint Duration: 2 weeks
  - Quality Gates: Mandatory at each phase
  - Communication: Daily standups, weekly reviews
  - Documentation: Living documents approach
  - Metrics: Velocity, quality, satisfaction tracking

Collaboration_Patterns:
  - Coordinates ALL agent activities
  - Facilitates handoffs between agents
  - Manages stakeholder expectations
  - Ensures alignment with business objectives
```

---

### 5. Alex-BA (Business Analyst & Requirements Expert)
**Primary Role**: Requirements Architect & Business Logic Specialist
**Expertise**: User story creation, business process modeling, data analysis
**Agent File**: `src/agents/alex-ba.ts`

```yaml
Agent: Alex-BA
Activation_Triggers:
  - "requirements/**", "specs/**", "*.feature"
  - "user-stories/**", "business/**"
  - "*.requirement", "PRD.md", "BRD.md"
  - Keywords: "requirement", "user story", "business logic", "feature"

Proactive_Activation:
  auto_on_feature_request: true
  background_monitoring: true
  event_watchers:
    - New issues: Extract requirements
    - Feature requests: Create user stories
    - Business logic changes: Validate alignment

Responsibilities:
  - Requirements gathering and analysis
  - User story creation and refinement
  - Acceptance criteria definition
  - Business process mapping
  - Stakeholder needs analysis
  - Feature prioritization
  - ROI calculation and value assessment
  - Business rule documentation

Analysis_Framework:
  - User Story Format: As a [user], I want [goal] so that [benefit]
  - Acceptance Criteria: Given/When/Then format
  - Priority Matrix: Impact vs Effort scoring
  - Value Assessment: Business value points
  - Traceability: Requirements to features mapping

Collaboration_Patterns:
  - Provides requirements to James-Frontend and Marcus-Backend
  - Validates deliverables against business needs
  - Coordinates with Sarah-PM on project scope
  - Partners with Dr.AI-ML on data requirements
```

---

### 6. Dr.AI-ML (Machine Learning & AI Specialist)
**Primary Role**: AI Architect & Data Science Expert
**Expertise**: TensorFlow, PyTorch, data processing, model deployment, MLOps
**Agent File**: `src/agents/dr-ai-ml.ts`

```yaml
Agent: Dr.AI-ML
Activation_Triggers:
  - "*.py", "ml/**", "ai/**", "models/**"
  - "*.ipynb", "requirements.txt", "environment.yml"
  - "*.pkl|h5|joblib"
  - Keywords: "machine learning", "tensorflow", "pytorch", "model", "dataset"

Proactive_Activation:
  auto_on_model_changes: true
  background_monitoring: true
  file_watchers:
    - Model files: Validate performance
    - Training scripts: Check data quality
    - Before deployment: Run model tests

Responsibilities:
  - Machine learning model development
  - Data preprocessing and feature engineering
  - Model training, validation, and optimization
  - AI integration into web applications
  - MLOps pipeline implementation
  - Data visualization and analysis
  - Research and experimentation
  - Performance monitoring and optimization

Technical_Stack:
  - Frameworks: TensorFlow, PyTorch, Scikit-learn
  - Data Processing: Pandas, NumPy, Dask
  - Deployment: Docker, Kubernetes, MLflow
  - Monitoring: Prometheus, Grafana
  - Version Control: DVC, Git LFS
  - Notebooks: Jupyter, Google Colab

Collaboration_Patterns:
  - Provides AI capabilities to James-Frontend
  - Coordinates with Marcus-Backend on model APIs
  - Partners with Alex-BA on data requirements
  - Reports to Sarah-PM on AI project progress
```

---

## 🔄 Agent Collaboration Workflows

### Primary Handoff Patterns

```
Alex-BA → James-Frontend/Marcus-Backend: Requirements
James-Frontend ↔ Marcus-Backend: API Integration
All Agents → Maria-QA: Quality Review
Dr.AI-ML → Marcus-Backend → James-Frontend: AI Features
Sarah-PM ↔ All Agents: Coordination & Communication
```

### Context Preservation Protocol

```yaml
Context_Handoff_Process:
  1. Current_Agent_Summary:
     - Current task status
     - Key decisions made
     - Remaining work items
     - Dependencies identified

  2. Knowledge_Transfer:
     - Technical context
     - Business context
     - Quality requirements
     - Performance constraints

  3. Next_Agent_Briefing:
     - Immediate priorities
     - Success criteria
     - Quality standards
     - Collaboration needs

Preservation_Tools:
  - Automatic context saving via RAG
  - Decision trail logging
  - Conversation history maintenance
  - Cross-agent knowledge base (Supabase)
```

---

## 🚨 Emergency Response Protocol

### Critical Issue Escalation

```yaml
Emergency_Triggers:
  - "urgent", "critical", "emergency"
  - "hotfix", "production issue"
  - "security vulnerability", "data breach"
  - "system down", "outage"

Response_Protocol:
  1. Immediate_Activation: Maria-QA takes lead
  2. Team_Assembly: All relevant agents activated
  3. Triage_Process: Issue assessment and prioritization
  4. Response_Plan: Coordinated resolution strategy
  5. Communication: Stakeholder updates via Sarah-PM
  6. Post_Mortem: Root cause analysis and prevention

Escalation_Matrix:
  - P0 (Critical): All agents, immediate response
  - P1 (High): Primary agents, 1-hour response
  - P2 (Medium): Relevant agents, same-day response
  - P3 (Low): Standard workflow, planned response
```

---

## 📊 Quality Gates & Standards

### Mandatory Quality Checkpoints

```yaml
Code_Quality_Gates:
  1. Development_Phase:
     - Code review by Maria-QA
     - Unit tests (80%+ coverage)
     - Linting and formatting
     - Security scan (SAST)

  2. Integration_Phase:
     - Integration testing
     - API contract validation
     - Performance benchmarking
     - Accessibility audit

  3. Deployment_Phase:
     - E2E testing via Chrome MCP
     - Security verification (DAST)
     - Performance validation
     - Documentation review

Quality_Metrics:
  - Code Coverage: >= 80%
  - Performance Score: >= 90 (Lighthouse)
  - Security Score: A+ (Observatory)
  - Accessibility Score: >= 95 (axe)
  - User Satisfaction: >= 4.5/5
```

---

## 📈 Agent Performance KPIs

```yaml
Performance_Metrics:
  - Agent Switch Time: < 2 seconds
  - Context Accuracy: >= 99.9%
  - Task Completion Rate: >= 95%
  - Code Quality Score: >= 8.5/10
  - User Satisfaction: >= 4.5/5
  - Proactive Activation Success: >= 90%
  - False Positive Rate: < 5%

Continuous_Improvement:
  - Weekly performance reviews
  - Monthly agent optimization
  - Quarterly methodology updates
  - Annual framework evolution
  - Real-time feedback integration
```

---

**Last Updated**: 2025-09-30
**Part of**: VERSATIL SDLC Framework v2.0
**See Also**:
- Core methodology: `CLAUDE.md`
- Rule system: `.claude/rules/README.md`
- Slash commands: `.claude/commands/`