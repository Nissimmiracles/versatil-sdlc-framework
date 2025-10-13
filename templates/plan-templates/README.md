# Plan Templates

Pre-built feature implementation templates with proven patterns, effort estimates, and historical learnings.

## Overview

Plan templates accelerate feature planning by providing:
- **Proven Patterns**: Battle-tested implementation approaches
- **Accurate Estimates**: Historical effort data with confidence intervals
- **Complete Coverage**: Database, API, Frontend, and Testing phases
- **Risk Mitigation**: Known pitfalls and solutions
- **Code Examples**: Real file paths and patterns

## Available Templates

### 🔐 [auth-system.yaml](./auth-system.yaml)
**Complete authentication system with JWT, OAuth, and RBAC**

- **Estimated Effort**: 28 hours (24-32 hours range)
- **Confidence**: 85%
- **Keywords**: auth, login, signup, jwt, oauth, password, session, authentication
- **Includes**:
  - User/session database schema
  - 8 API endpoints (signup, login, logout, OAuth, password reset)
  - Frontend components (LoginForm, SignupForm, AuthProvider)
  - Security checklist (OWASP Top 10)
  - Performance targets (< 200ms login)

**Use When**: Building user authentication, adding OAuth providers, implementing RBAC

---

### 📝 [crud-endpoint.yaml](./crud-endpoint.yaml)
**Standard REST API endpoint with database CRUD operations**

- **Estimated Effort**: 8 hours (6-10 hours range)
- **Confidence**: 90%
- **Keywords**: crud, api, rest, endpoint, get, post, put, delete, resource
- **Includes**:
  - Resource table schema with RLS policies
  - 5 API endpoints (GET list, GET by ID, POST, PUT, DELETE)
  - Pagination, filtering, sorting
  - Error handling (400, 401, 403, 404, 409, 422, 429, 500)
  - Performance targets (< 100ms for list, < 50ms for single)

**Use When**: Adding new resource endpoints, implementing REST APIs, creating admin panels

---

### 📊 [dashboard.yaml](./dashboard.yaml)
**Analytics dashboard with charts, metrics, and filters**

- **Estimated Effort**: 16 hours (12-20 hours range)
- **Confidence**: 80%
- **Keywords**: dashboard, analytics, charts, metrics, visualization, kpi, reporting
- **Includes**:
  - Metrics/events database schema with aggregation
  - 5 API endpoints (metrics, KPIs, top pages, funnel, export)
  - Frontend components (KPI cards, charts, date picker, filters)
  - Pre-aggregation strategy (materialized views)
  - Performance targets (< 2 seconds dashboard load)

**Use When**: Building analytics dashboards, adding reporting features, visualizing data

---

### 🔌 [api-integration.yaml](./api-integration.yaml)
**Integration with third-party API services (REST, GraphQL, webhooks)**

- **Estimated Effort**: 12 hours (8-16 hours range)
- **Confidence**: 75%
- **Keywords**: api, integration, webhook, rest, graphql, third-party, external
- **Includes**:
  - Integration configs and event logs
  - API client with retry logic and rate limiting
  - OAuth 2.0 flow implementation
  - Webhook signature verification
  - Sync state management for pagination

**Use When**: Integrating with Stripe, GitHub, Slack, or other external APIs

---

### 📁 [file-upload.yaml](./file-upload.yaml)
**Secure file upload with cloud storage (S3), validation, and processing**

- **Estimated Effort**: 10 hours (8-12 hours range)
- **Confidence**: 85%
- **Keywords**: upload, file, s3, storage, image, pdf, document, media
- **Includes**:
  - Files table with checksum and metadata
  - Presigned S3 URLs (direct upload, no server bottleneck)
  - File validation (size, MIME type, malware scanning)
  - Image processing (thumbnails, optimization)
  - Frontend drag-and-drop component

**Use When**: Adding file uploads, building document management, handling images/PDFs

---

## How Templates Are Used

### 1. Automatic Matching (by /plan command)

When you run `/plan "Add user authentication"`, the command:
1. **Searches** template keywords for matches
2. **Loads** the best matching template (e.g., `auth-system.yaml`)
3. **Customizes** the template for your project context
4. **Generates** a complete implementation plan

**Example**:
```
/plan "Add user authentication with Google OAuth"

→ Matches: auth-system.yaml (keywords: auth, login, oauth)
→ Customization: Adds Google OAuth setup, API config
→ Effort Adjustment: Base 28 hours + OAuth 4 hours = 32 hours
```

### 2. Manual Template Selection

You can explicitly specify a template:
```
/plan --template=auth-system "Implement login system"
/plan --template=crud-endpoint "Add products API"
/plan --template=dashboard "Build analytics page"
```

### 3. Template Customization

Templates are starting points, customized based on:
- **Project Tech Stack**: React vs Vue, Node.js vs Python
- **Existing Patterns**: Your project's conventions (CLAUDE.md)
- **Similar Features**: Historical implementations (RAG search)
- **Complexity**: Simple vs complex requirements

**Customization Example**:
```yaml
# Template says: "Use JWT with 15 min expiry"
# Your project: Already uses JWT with 30 min expiry
# Plan Output: "Use existing JWT pattern (30 min expiry)"
```

---

## Template Structure

Each template includes:

### Metadata
```yaml
name: "Feature Name"
category: "Category"
keywords: ["keyword1", "keyword2"]
estimated_effort:
  hours: 16
  range: "12-20"
  confidence: 80
complexity: "Medium|Large|XL"
```

### Phases
```yaml
phases:
  database:
    estimated_hours: 3
    tasks: [...]
    lessons_learned: [...]

  api:
    estimated_hours: 5
    tasks: [...]
    security_checklist: [...]
    performance_requirements: [...]

  frontend:
    estimated_hours: 8
    tasks: [...]
    accessibility_requirements: [...]
    responsive_design: [...]

  testing:
    estimated_hours: 3
    tasks: [...]
    coverage_target: "≥ 80%"
```

### Success Metrics
```yaml
success_metrics:
  user_experience: [...]
  functionality: [...]
  performance: [...]
  quality: [...]
```

### Risks & Alternatives
```yaml
risks:
  high: [...]
  medium: [...]
  low: [...]

alternative_approaches:
  - name: "Alternative 1"
    pros: [...]
    cons: [...]
    recommendation: "..."
```

### Code Examples & References
```yaml
code_examples:
  - file: "src/auth/jwt-service.ts"
    lines: "42-67"
    description: "JWT token generation"

references:
  documentation: [...]
  similar_implementations: [...]

confidence:
  score: 85
  reasoning: "Based on 3 similar implementations..."
```

---

## Creating Custom Templates

### 1. Copy Existing Template
```bash
cp templates/plan-templates/crud-endpoint.yaml templates/plan-templates/my-feature.yaml
```

### 2. Update Metadata
```yaml
name: "My Custom Feature"
category: "Custom Category"
keywords: ["custom", "feature", "specific"]
estimated_effort:
  hours: X
  range: "X-Y"
  confidence: Z
```

### 3. Fill in Phases
- Database: Schema, migrations, indexes
- API: Endpoints, validation, security
- Frontend: Components, state, accessibility
- Testing: Unit, integration, E2E

### 4. Add Historical Context
- Lessons learned from similar features
- Code examples from your codebase
- Performance benchmarks
- Known pitfalls and solutions

### 5. Test Template
```bash
/plan --template=my-feature "Test feature description"
```

---

## Template Categories

### Security & Auth
- `auth-system.yaml` - Full authentication system

### Data & API
- `crud-endpoint.yaml` - Standard REST API
- `api-integration.yaml` - Third-party integrations

### UI & Visualization
- `dashboard.yaml` - Analytics dashboard

### File Management
- `file-upload.yaml` - File upload with S3

### Coming Soon
- `search-system.yaml` - Full-text search with Elasticsearch
- `notification-system.yaml` - Multi-channel notifications
- `payment-integration.yaml` - Stripe/PayPal integration
- `realtime-chat.yaml` - WebSocket chat system
- `email-campaigns.yaml` - Email marketing automation

---

## Best Practices

### 1. Use Templates as Starting Points
Templates provide proven patterns, but customize for your needs:
- Adapt to your tech stack
- Follow your team's conventions
- Scale up/down based on complexity

### 2. Update Templates with Learnings
After completing a feature:
```bash
/learn "Feature: User authentication"
# → Extracts patterns, updates historical data
# → Improves future estimates
```

### 3. Contribute Back
Found a better pattern? Update the template:
- Add lessons learned
- Update effort estimates
- Include code examples
- Document pitfalls

### 4. Validate Estimates
Templates provide baseline estimates. Adjust for:
- Team experience level
- Existing infrastructure
- Project complexity
- Quality requirements

**Example Adjustments**:
- Junior team: Add 50% to estimate
- Existing auth system: Reduce 30%
- High security requirements: Add 40%
- Legacy codebase: Add 60%

---

## Compounding Engineering Integration

Templates are part of the **Codify** phase:

```
Plan → Delegate → Assess → Codify
                              ↓
                    Update Templates
                    (historical learnings)
```

### How It Works:

1. **Complete Feature** using template
2. **Run `/learn`** to extract patterns
3. **Update Historical Data** in RAG store
4. **Next Time**: Template has better estimates, real code examples

**Result**: Each feature makes the next 40% faster

---

## FAQ

**Q: How accurate are effort estimates?**
A: Estimates are based on historical data with confidence scores (75-90%). Actual time may vary ±20% based on team and context.

**Q: Can I use templates without /plan command?**
A: Yes! Templates are YAML files. Read them directly for reference when planning features manually.

**Q: What if no template matches my feature?**
A: `/plan` will work without a template, using parallel agent research. Create a custom template afterward to reuse the pattern.

**Q: How do templates handle different tech stacks?**
A: Templates are framework-agnostic. `/plan` adapts them to your stack (React vs Vue, Node.js vs Python, etc.).

**Q: Should I update templates after each feature?**
A: Run `/learn` after features to update historical data. Update template files quarterly or when patterns significantly change.

---

## Template Versioning

Templates evolve with your project:

- **v1.0**: Initial template (bootstrapped from Every Inc patterns)
- **v1.1**: Updated with first project implementation
- **v1.2**: Refined after 3+ implementations
- **v2.0**: Major pattern change (e.g., switch to different auth library)

Track template versions in commit history:
```bash
git log -- templates/plan-templates/auth-system.yaml
```

---

## Related Documentation

- **[/plan Command](../../.claude/commands/plan.md)** - How to use templates in planning
- **[/learn Command](../../.claude/commands/learn.md)** - Extract patterns from completed work
- **[Compounding Engineering](../../docs/guides/compounding-engineering.md)** - Full workflow explanation
- **[RAG System](../../docs/architecture/rag-system.md)** - How historical data is stored

---

**Last Updated**: 2025-10-13
**Templates Version**: 1.0
**Total Templates**: 5
**Next Additions**: search-system, notification-system, payment-integration
