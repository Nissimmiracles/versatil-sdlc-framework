# templates/ - Plan Template System

**Priority**: HIGH
**Agent(s)**: Sarah-PM (primary owner), Alex-BA
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Provides pre-built plan templates for common feature types (auth, CRUD, dashboard, etc.). Automatically matches feature descriptions to templates using keyword scoring (70% threshold). Includes effort estimation and template customization.

## 🎯 Core Concepts

### Key Abstractions
- **TemplateMatcher**: Keyword-based template matching (auto-selects best template)
- **PlanTemplate**: YAML structure with phases, effort estimates, success metrics
- **TemplateMatchResult**: Match score, matched keywords, recommended template

### Design Patterns
- **Template Pattern**: Pre-built structures for common features
- **Scoring Algorithm**: Keyword overlap + exact name boost + category boost
- **Fallback Pattern**: If no match >70%, use agent research instead

## ✅ Development Rules

### DO ✓
- ✓ **Use YAML for templates** - structured, human-readable format
- ✓ **Set 70% match threshold** - below this, use agent research
- ✓ **Include effort estimates** - hours + range + confidence
- ✓ **Document success metrics** - clear validation criteria

### DON'T ✗
- ✗ **Don't hardcode templates in code** - use YAML files in templates/plan-templates/
- ✗ **Don't skip keywords** - templates without keywords won't match
- ✗ **Don't create too many templates** - start with 5-10 common patterns

## 🔧 Common Patterns

### Pattern: Auto-Match Feature to Template
```typescript
import { templateMatcher } from '@/templates/template-matcher.js';

const result = await templateMatcher.matchTemplate({
  description: 'Add user authentication with JWT tokens'
});

if (result.use_template) {
  console.log(`Matched: ${result.best_match.template_name}`);
  console.log(`Score: ${result.best_match.match_score}%`);
  console.log(`Effort: ${result.best_match.estimated_effort.hours}h`);
} else {
  console.log('No template match - using agent research');
}
```

### Existing Templates (6 available)
1. **auth-system.yaml**: JWT authentication, bcrypt passwords, session management
2. **crud-api.yaml**: RESTful CRUD endpoints with validation
3. **dashboard.yaml**: Admin dashboard with charts, metrics
4. **integration.yaml**: Third-party API integration patterns
5. **migration.yaml**: Database migration best practices
6. **api-gateway.yaml**: API gateway, rate limiting, caching

## ⚠️ Gotchas

### Gotcha: Template Match Below Threshold
**Problem**: Best match is 65% (below 70% threshold), but still useful
**Solution**: Present match to user, let them decide

```typescript
const result = await templateMatcher.matchTemplate({ description });
if (!result.use_template && result.all_matches.length > 0) {
  console.log(`Close match: ${result.all_matches[0].template_name} (${result.all_matches[0].match_score}%)`);
  console.log('Use --template=NAME to force this template');
}
```

## 📚 Related Documentation
- [Plan Templates Directory](../../templates/plan-templates/)
- [Template Creation Guide](../../templates/plan-templates/README.md)
- [/plan Command](.claude/commands/plan.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('templates')`
