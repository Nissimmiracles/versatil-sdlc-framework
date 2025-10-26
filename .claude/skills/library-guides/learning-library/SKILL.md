---
name: learning-library
description: Pattern codification system that converts feedback into reusable patterns. Use when codifying successful implementations, enabling Compounding Engineering (40% speedup), extracting lessons from git commits, or tracking pattern effectiveness. Stores patterns in .versatil/learning/patterns/*.yaml for future reuse.
tags: [learning, pattern-codification, compounding-engineering, feedback, yaml]
---

# learning/ - Pattern Codification System

**Priority**: LOW
**Agent(s)**: Dr.AI-ML (primary owner), all agents (pattern consumers)
**Last Updated**: 2025-10-26

## When to Use

- Codifying successful implementations into reusable patterns
- Enabling Compounding Engineering (40% faster development)
- Extracting lessons from git commits and PR comments
- Tracking pattern effectiveness scores (0-100)
- Storing patterns for future feature planning
- Measuring time saved by pattern reuse

## What This Library Provides

- **PatternCodifier**: Converts feedback → structured YAML patterns
- **PatternStore**: 44 patterns in `.versatil/learning/patterns/`
- **FeedbackAnalyzer**: Extracts lessons from git history
- **EffectivenessTracker**: Measures pattern success rates
- **Compounding Engineering**: 40% speedup per feature

## Core Conventions

### DO ✓
- ✓ Codify successful patterns immediately
- ✓ Include code examples with file:line references
- ✓ Track effectiveness score (0-100)
- ✓ Measure time saved by pattern reuse

### DON'T ✗
- ✗ Don't codify one-off solutions
- ✗ Don't skip effectiveness tracking
- ✗ Don't forget code examples

## Quick Start

```typescript
import { patternCodifier } from '@/learning/pattern-codifier.js';

// Codify successful pattern
await patternCodifier.codify({
  pattern: 'JWT Authentication with httpOnly Cookies',
  category: 'Security',
  description: 'Store JWT in httpOnly cookie to prevent XSS attacks',
  code: 'res.cookie("token", jwt, { httpOnly: true, secure: true })',
  file: 'src/api/auth.ts:42',
  effectiveness: 95,
  timeSaved: 4 // hours
});

// Creates: .versatil/learning/patterns/jwt-auth-cookies.yaml
```

## Compounding Engineering Formula

```
Feature 1: 100% effort (baseline)
Feature 2:  83% effort (17% faster)
Feature 3:  74% effort (26% faster)
Feature 4:  69% effort (31% faster)
Feature 5:  60% effort (40% faster) ← Target achieved!
```

## Pattern Storage

```yaml
# .versatil/learning/patterns/jwt-auth-cookies.yaml
name: JWT Authentication with httpOnly Cookies
category: Security
description: Store JWT in httpOnly cookie to prevent XSS attacks
code_example: |
  res.cookie("token", jwt, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
effectiveness_score: 95
time_saved_hours: 4
file_references:
  - src/api/auth.ts:42
  - src/middleware/jwt.ts:18
```

## Related Documentation

- [references/codification-rules.md](references/codification-rules.md) - When to codify patterns
- [references/effectiveness-tracking.md](references/effectiveness-tracking.md) - Measuring pattern success
- [docs/PATTERN_CODIFICATION.md](../../../docs/PATTERN_CODIFICATION.md) - Pattern codification guide
- [docs/guides/compounding-engineering.md](../../../docs/guides/compounding-engineering.md) - 40% speedup methodology

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/learning/**`
