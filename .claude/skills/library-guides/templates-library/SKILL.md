---
name: templates-library
description: Plan template system for common feature types (auth, CRUD, dashboard, integrations). Use when matching feature descriptions to pre-built templates, implementing keyword scoring (70% threshold), customizing plan templates, or creating new templates. Auto-selects best template using keyword overlap + category + name boost scoring.
tags: [templates, planning, matching, scoring, yaml]
---

# templates/ - Plan Template System

**Priority**: MEDIUM
**Agent(s)**: Sarah-PM (primary owner), Alex-BA
**Last Updated**: 2025-10-26

## When to Use

- Matching feature descriptions to pre-built plan templates
- Auto-selecting templates using keyword scoring (70% threshold)
- Customizing plan templates for specific features
- Creating new YAML plan templates for common patterns
- Estimating effort based on template historical data
- Implementing fallback patterns (template vs agent research)
- Validating template match scores
- Forcing specific template usage with --template flag

## What This Library Provides

### Core Services
- **TemplateMatcher**: Keyword-based template matching (auto-selects best template)
- **PlanTemplate**: YAML structure with phases, effort estimates, success metrics
- **TemplateMatchResult**: Match score, matched keywords, recommended template

### Key Features
- **Auto-Matching**: Keyword-based scoring (70% threshold for auto-use)
- **Scoring Algorithm**: Keyword overlap + exact name boost (30%) + category boost (20%)
- **6 Pre-Built Templates**: auth-system, crud-api, dashboard, integration, migration, api-gateway
- **Effort Estimation**: Historical effort hours + range + confidence intervals
- **Fallback Pattern**: Below 70% threshold → use agent research instead

### File Structure
```
src/templates/
├── template-matcher.ts              # Template matching service
├── template-loader.ts               # YAML template loading
├── template-customizer.ts           # Template customization
└── types.ts                         # Template interfaces

templates/plan-templates/
├── auth-system.yaml                 # JWT auth, sessions (28h)
├── crud-api.yaml                    # REST CRUD endpoints (8h)
├── dashboard.yaml                   # Admin dashboard, charts (16h)
├── integration.yaml                 # Third-party API (12h)
├── migration.yaml                   # Database migrations (6h)
└── api-gateway.yaml                 # Gateway, rate limiting (20h)
```

## Core Conventions

### DO ✓
- ✓ **Use YAML for templates** - Structured, human-readable format
- ✓ **Set 70% match threshold** - Below this, use agent research
- ✓ **Include effort estimates** - Hours + range + confidence
- ✓ **Document success metrics** - Clear validation criteria
- ✓ **Add keywords to templates** - Required for matching

### DON'T ✗
- ✗ **Don't hardcode templates in code** - Use YAML files in templates/plan-templates/
- ✗ **Don't skip keywords** - Templates without keywords won't match
- ✗ **Don't create too many templates** - Start with 5-10 common patterns
- ✗ **Don't force templates below 50%** - Too low match = poor fit

## Quick Start Patterns

### Pattern 1: Auto-Match Feature to Template
```typescript
import { templateMatcher } from '@/templates/template-matcher.js';

const result = await templateMatcher.matchTemplate({
  description: 'Add user authentication with JWT tokens'
});

if (result.use_template) {
  console.log(`Matched: ${result.best_match.template_name}`);
  console.log(`Score: ${result.best_match.match_score}%`);
  console.log(`Effort: ${result.best_match.estimated_effort.hours}h`);
  console.log(`Keywords: ${result.best_match.matched_keywords.join(', ')}`);
} else {
  console.log('No template match - using agent research');
}

// Example output:
// Matched: auth-system
// Score: 88%
// Effort: 28h
// Keywords: authentication, JWT, tokens, user
```

### Pattern 2: Force Specific Template
```typescript
import { templateMatcher } from '@/templates/template-matcher.js';

// Force template even if match score is low
const result = await templateMatcher.matchTemplate({
  description: 'Build custom auth system',
  forceTemplate: 'auth-system'
});

console.log(`Using forced template: ${result.best_match.template_name}`);
```

### Pattern 3: Handle Below-Threshold Match
```typescript
const result = await templateMatcher.matchTemplate({ description });

if (!result.use_template && result.all_matches.length > 0) {
  const closestMatch = result.all_matches[0];
  console.log(`Close match: ${closestMatch.template_name} (${closestMatch.match_score}%)`);
  console.log('Use --template=NAME to force this template');

  // Let user decide
  const useTemplate = await promptUser(`Use ${closestMatch.template_name}?`);
  if (useTemplate) {
    return templateMatcher.matchTemplate({
      description,
      forceTemplate: closestMatch.template_name
    });
  }
}
```

## Important Gotchas

### Gotcha 1: Template Match Below Threshold
**Problem**: Best match is 65% (below 70% threshold), but template still useful

**Solution**: Present match to user, let them decide
```typescript
// ✅ Good - Inform user about close match
if (!result.use_template && result.all_matches.length > 0) {
  console.warn(`Close match: ${result.all_matches[0].template_name} (${result.all_matches[0].match_score}%)`);
  console.log('Consider using --template flag to force this template');
}
```

### Gotcha 2: Multiple High-Score Matches
**Problem**: Two templates both score 75%+, unclear which to use

**Solution**: Use category boost to differentiate
```typescript
// ✅ Good - Category matching provides tiebreaker
const result = await templateMatcher.matchTemplate({
  description: 'Add user authentication',
  category: 'Security' // Boosts auth-system template by 20%
});
```

### Gotcha 3: Missing Keywords in Template
**Problem**: Template has no keywords, never matches regardless of description

**Solution**: Always include keywords in template YAML
```yaml
# ✅ Good - Template with keywords
name: auth-system
keywords:
  - authentication
  - login
  - signup
  - JWT
  - session
  - password
  - bcrypt
```

## Template Scoring Algorithm

### Score Calculation
```typescript
score = (keyword_overlap_score * 0.5) +
        (exact_name_boost * 0.3) +
        (category_boost * 0.2)

// Example: "Add JWT authentication"
// - keyword_overlap: 6 matches / 8 total = 75%
// - exact_name_boost: "authentication" in description = +30%
// - category_boost: category = "Security" = +20%
// Total: (75 * 0.5) + (30 * 0.3) + (20 * 0.2) = 37.5 + 9 + 4 = 50.5%
```

### Threshold Rules
- **≥ 70%**: Auto-use template (high confidence)
- **50-69%**: Present to user, let them decide
- **< 50%**: Skip template, use agent research

## Available Templates

### 1. auth-system.yaml (28h)
**Keywords**: authentication, login, signup, JWT, session, password, bcrypt
**Phases**: Database setup → API endpoints → Middleware → Frontend forms → Testing
**Success metrics**: Signup works, Login works, Protected routes enforce auth

### 2. crud-api.yaml (8h)
**Keywords**: CRUD, REST, API, create, read, update, delete, endpoints
**Phases**: Model definition → API routes → Validation → Testing
**Success metrics**: All CRUD operations work, Validation enforced, 80%+ test coverage

### 3. dashboard.yaml (16h)
**Keywords**: dashboard, admin, charts, metrics, visualization, analytics
**Phases**: Data aggregation → Chart components → Real-time updates → Testing
**Success metrics**: Charts render, Data updates in real-time, Mobile responsive

### 4. integration.yaml (12h)
**Keywords**: integration, API, third-party, webhook, OAuth, external
**Phases**: API client → Authentication → Error handling → Testing
**Success metrics**: API calls work, Rate limiting handled, Retry logic implemented

### 5. migration.yaml (6h)
**Keywords**: migration, database, schema, ALTER, versioning
**Phases**: Migration files → Rollback strategy → Testing → Documentation
**Success metrics**: Migrations run successfully, Rollback works, Zero downtime

### 6. api-gateway.yaml (20h)
**Keywords**: gateway, proxy, routing, rate-limit, cache, load-balancer
**Phases**: Gateway setup → Routing rules → Rate limiting → Caching → Testing
**Success metrics**: Routes work, Rate limiting enforced, Cache hit ratio >80%

## Related Documentation

For detailed template guides:
- [references/template-schema.md](references/template-schema.md) - YAML template structure
- [references/scoring-algorithm.md](references/scoring-algorithm.md) - Match score calculation
- [references/template-creation.md](references/template-creation.md) - Creating new templates

For template files:
- [templates/plan-templates/](../../../templates/plan-templates/) - All template YAML files
- [templates/plan-templates/README.md](../../../templates/plan-templates/README.md) - Template creation guide

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/templates/**`
