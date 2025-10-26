# validation/ - Schema & Contract Validation

**Priority**: MEDIUM
**Agent(s)**: Maria-QA (primary owner), Victor-Verifier
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Schema validation (Zod, JSON Schema) and contract validation for agent handoffs. Enforces quality gates (score ≥90) and data integrity checks.

## 🎯 Core Concepts

- **SchemaValidator**: Validates inputs against Zod schemas
- **ContractValidator**: Validates three-tier handoff contracts (≥90 score)
- **ErrorFormatter**: Formats validation errors for user display

## ✅ Rules

### DO ✓
- ✓ Validate all external inputs
- ✓ Use Zod for runtime validation
- ✓ Format errors with context

### DON'T ✗
- ✗ Don't skip validation in production
- ✗ Don't expose raw validation errors to users

## 🔧 Pattern: Zod Validation
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const result = UserSchema.safeParse(input);
if (!result.success) {
  console.error('Validation failed:', result.error.issues);
}
```

## 📚 Docs
- [Validation Guide](../../docs/VALIDATION.md)
- [Contract Validation](../agents/contracts/)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('validation')`
