# learning/ - Pattern Codification System

**Priority**: HIGH
**Agent(s)**: Dr.AI-ML (primary owner), all agents (pattern consumers)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Codifies feedback into reusable patterns stored in `.versatil/learning/patterns/*.yaml`. Enables Compounding Engineering - each feature makes the next 40% faster by learning from past implementations.

## 🎯 Core Concepts

- **PatternCodifier**: Converts feedback → structured YAML patterns
- **PatternStore**: 44 patterns in `.versatil/learning/patterns/`
- **FeedbackAnalyzer**: Extracts lessons from git commits, PR comments

## ✅ Rules

### DO ✓
- ✓ Codify successful patterns immediately
- ✓ Include code examples with file:line references
- ✓ Track effectiveness score (0-100)

### DON'T ✗
- ✗ Don't codify one-off solutions
- ✗ Don't skip effectiveness tracking

## 🔧 Pattern: Codify Feedback
```typescript
import { patternCodifier } from '@/learning/pattern-codifier.js';

await patternCodifier.codify({
  pattern: 'JWT Authentication with httpOnly Cookies',
  category: 'Security',
  code: 'res.cookie("token", jwt, { httpOnly: true })',
  effectiveness: 95,
  timeSaved: 4 // hours
});
// Creates: .versatil/learning/patterns/jwt-auth-cookies.yaml
```

## 📚 Docs
- [Pattern Codification](../../docs/PATTERN_CODIFICATION.md)
- [Compounding Engineering](../../docs/guides/compounding-engineering.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('learning')`
