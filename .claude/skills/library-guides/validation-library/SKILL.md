---
name: validation-library
description: Schema and contract validation with Zod and JSON Schema. Use when validating external inputs, enforcing quality gates (score ≥90), validating three-tier handoff contracts, or formatting validation errors. Ensures data integrity and runtime type safety.
tags: [validation, zod, json-schema, contracts, quality-gates]
---

# validation/ - Schema & Contract Validation

**Priority**: LOW
**Agent(s)**: Maria-QA (primary owner), Victor-Verifier
**Last Updated**: 2025-10-26

## When to Use

- Validating external inputs (API requests, user forms, config files)
- Enforcing quality gates (contract score ≥90)
- Validating three-tier handoff contracts between agents
- Formatting validation errors for user display
- Runtime type checking with Zod
- Ensuring data integrity at system boundaries

## What This Library Provides

- **SchemaValidator**: Validates inputs against Zod schemas
- **ContractValidator**: Validates three-tier handoff contracts (≥90 score)
- **ErrorFormatter**: Formats validation errors with context
- **Zod integration**: Runtime type safety
- **JSON Schema support**: For external tool integrations

## Core Conventions

### DO ✓
- ✓ Validate all external inputs
- ✓ Use Zod for runtime validation
- ✓ Format errors with context
- ✓ Enforce ≥90 score for contracts

### DON'T ✗
- ✗ Don't skip validation in production
- ✗ Don't expose raw validation errors to users
- ✗ Don't bypass quality gates

## Quick Start

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// Validate input
const result = UserSchema.safeParse(input);
if (!result.success) {
  console.error('Validation failed:', result.error.issues);
  // Format errors for user display
}
```

## Contract Validation

```typescript
import { ContractValidator } from '@/validation/contract-validator.js';

const validator = new ContractValidator();
const result = await validator.validate(handoffContract);

if (result.score < 90) {
  throw new Error(`Contract validation failed: ${result.score}/100`);
}
```

## Related Documentation

- [references/zod-patterns.md](references/zod-patterns.md) - Common Zod validation patterns
- [references/contract-validation.md](references/contract-validation.md) - Handoff contract rules
- [docs/VALIDATION.md](../../../docs/VALIDATION.md) - Validation guide

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/validation/**`
