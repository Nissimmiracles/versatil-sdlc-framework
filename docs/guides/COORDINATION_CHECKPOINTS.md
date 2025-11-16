# Coordination Checkpoints Guide

## Overview

**Coordination Checkpoints** are quality gates between waves that validate deliverables, enforce standards, and coordinate agent handoffs. They prevent defects from propagating through the development pipeline and ensure each wave meets quality requirements before proceeding.

## Why Checkpoints Matter

### Problem: Defects Compound Across Waves

Without checkpoints:
```
Wave 1: Build API (tests failing) ❌
  ↓
Wave 2: Build UI (depends on broken API) ❌
  ↓
Wave 3: Deploy (broken system goes to production) ❌
  ↓
Result: 3 waves of wasted work, production incident
```

### Solution: Checkpoints Catch Issues Early

With checkpoints:
```
Wave 1: Build API
  ↓
✓ Checkpoint: "API Quality Gate"
  - All tests passing ✓
  - Code coverage >= 80% ✓
  ❌ Security scan FAILED (vulnerability detected)

⛔ EXECUTION STOPPED - Fix security issue before continuing
  ↓
Result: Issue caught early, fix in Wave 1, prevent cascade
```

## Checkpoint Structure

### Basic Configuration

```typescript
coordination_checkpoint: {
  checkpoint_name: string;        // Descriptive name
  location: string;               // "After Wave N"
  blocking: boolean;              // Stop execution if failed?
  quality_gates: string[];        // Gates to validate
  validation_steps: string[];     // Commands to execute
  handoff_agents?: HandoffSpec[]; // Optional agent coordination
}
```

### Example Checkpoint

```typescript
{
  checkpoint_name: 'Pre-Deployment Quality Gate',
  location: 'After Wave 2',
  blocking: true,  // STOP if failed
  quality_gates: [
    'All tests passing',
    'Code coverage >= 80%',
    'Security scan clean',
    'Build successful',
    'TypeScript compilation',
  ],
  validation_steps: [
    'pnpm test',
    'pnpm test:coverage',
    'pnpm audit --audit-level moderate',
    'pnpm build',
    'pnpm typecheck',
  ],
  handoff_agents: [
    {
      from: 'Marcus-Backend',
      to: 'Maria-QA',
      context: 'API endpoints ready for testing',
    },
  ],
}
```

## Quality Gates

### Common Quality Gates

| Quality Gate | Purpose | Validation Step | Threshold |
|-------------|---------|-----------------|-----------|
| **All tests passing** | Verify functionality | `pnpm test` | 100% pass |
| **Code coverage** | Ensure test coverage | `pnpm test:coverage` | >= 80% |
| **Security scan** | Detect vulnerabilities | `pnpm audit` | 0 critical/high |
| **Build successful** | Verify compilation | `pnpm build` | Exit code 0 |
| **Lint check** | Code quality | `pnpm lint` | 0 errors |
| **Type check** | TypeScript validity | `pnpm typecheck` | 0 errors |
| **Performance** | Benchmark performance | `pnpm test:perf` | < threshold |
| **Accessibility** | WCAG compliance | `pnpm test:a11y` | AA standard |

### Gate Validation Logic

The CheckpointValidator executes each validation step and parses output:

```typescript
// Execute validation command
const output = execSync(validationStep, {
  encoding: 'utf8',
  timeout: 120000,  // 2 minute timeout
});

// Parse output for pass/fail
const passed = parseValidationOutput(gate, output);

// Result
{
  gate: 'All tests passing',
  passed: true,
  message: 'Validation passed',
  execution_time: 1523,  // ms
}
```

### Output Parsing Rules

**Success Indicators**:
- Contains: `passed`, `success`, `ok`, `✅`, `✓`, `all tests passed`
- Exit code: 0
- No failure indicators present

**Failure Indicators**:
- Contains: `failed`, `error`, `fail`, `❌`, `✗`, `vulnerability`, `critical`
- Exit code: Non-zero
- Coverage below threshold

**Coverage Gates** (special handling):
```bash
# Output: "Coverage: 85%"
gate: "Coverage >= 80%"
result: PASS (85% >= 80%)

# Output: "Coverage: 75%"
gate: "Coverage >= 80%"
result: FAIL (75% < 80%)
```

## Blocking vs Warning Checkpoints

### Blocking Checkpoints (`blocking: true`)

**Purpose**: Enforce critical quality requirements

**Behavior**:
```
✅ Checkpoint Passed → Continue to next wave
❌ Checkpoint Failed → STOP execution, display errors
```

**Use Cases**:
- Pre-production deployments
- Security validations
- Critical functionality tests
- Breaking changes

**Example**:
```typescript
{
  checkpoint_name: 'Production Readiness',
  blocking: true,  // ⛔ STOP if failed
  quality_gates: [
    'All tests passing',
    'Security scan clean',
    'Performance benchmarks met',
  ],
  validation_steps: [
    'pnpm test',
    'pnpm audit',
    'pnpm test:perf',
  ],
}
```

**Report Output**:
```
═══════════════════════════════════════════════════════════════
CHECKPOINT VALIDATION: Production Readiness
═══════════════════════════════════════════════════════════════

⛔ Status: FAILED (BLOCKING)
   Blocking: YES
   Execution Time: 5234ms

Quality Gates:
✅ 1. All tests passing
   Validation passed (1523ms)
✅ 2. Security scan clean
   Validation passed (2341ms)
❌ 3. Performance benchmarks met
   Validation failed (1370ms)
   Error: Benchmark exceeded threshold: 2.5s > 2.0s

❌ Errors:
   - Quality gate failed: Performance benchmarks met - Validation failed

⛔ Wave 3 BLOCKED - Fix errors to continue
```

### Warning Checkpoints (`blocking: false`)

**Purpose**: Provide feedback without stopping execution

**Behavior**:
```
✅ Checkpoint Passed → Continue to next wave
⚠️  Checkpoint Failed → Log warning, continue anyway
```

**Use Cases**:
- Optional optimizations
- Non-critical recommendations
- Performance insights
- Code quality suggestions

**Example**:
```typescript
{
  checkpoint_name: 'Code Quality Recommendations',
  blocking: false,  // ⚠️ Warn but allow continuation
  quality_gates: [
    'Code complexity acceptable',
    'Documentation coverage',
    'Performance optimization opportunities',
  ],
  validation_steps: [
    'pnpm analyze:complexity',
    'pnpm analyze:docs',
    'pnpm analyze:perf',
  ],
}
```

**Report Output**:
```
═══════════════════════════════════════════════════════════════
CHECKPOINT VALIDATION: Code Quality Recommendations
═══════════════════════════════════════════════════════════════

⚠️  Status: FAILED (WARNING)
   Blocking: NO
   Execution Time: 3456ms

Quality Gates:
✅ 1. Code complexity acceptable
   Validation passed (1234ms)
❌ 2. Documentation coverage
   Validation failed (1122ms)
⚠️  3. Performance optimization opportunities
   Validation passed (1100ms)

⚠️  Warnings:
   - Quality gate failed (non-blocking): Documentation coverage - Validation failed

✓ Continuing to next wave despite warnings
```

## Agent Handoffs

### Purpose

Agent handoffs validate that:
- Required context is transferred between agents
- Dependencies are clearly documented
- Artifacts are ready for next agent

### Handoff Structure

```typescript
handoff_agents: [
  {
    from: string;    // Source agent
    to: string;      // Destination agent
    context: string; // What's being handed off
  },
]
```

### Example: Full-Stack Feature

```typescript
{
  wave_number: 1,
  wave_name: 'Database Layer',
  agents: ['Dana-Database'],
  coordination_checkpoint: {
    checkpoint_name: 'Database Ready',
    location: 'After Wave 1',
    blocking: true,
    quality_gates: ['Schema created', 'Migrations validated'],
    validation_steps: ['pnpm db:validate', 'pnpm db:test'],
    handoff_agents: [
      {
        from: 'Dana-Database',
        to: 'Marcus-Backend',
        context: 'Database schema, connection details, RLS policies',
      },
    ],
  },
},
{
  wave_number: 2,
  wave_name: 'API Layer',
  agents: ['Marcus-Backend'],
  dependencies: [1],
  coordination_checkpoint: {
    checkpoint_name: 'API Ready',
    location: 'After Wave 2',
    blocking: true,
    quality_gates: ['API tests passing', 'Documentation generated'],
    validation_steps: ['pnpm test:api', 'pnpm docs:api'],
    handoff_agents: [
      {
        from: 'Marcus-Backend',
        to: 'James-Frontend',
        context: 'API endpoints, authentication flow, data models',
      },
    ],
  },
},
{
  wave_number: 3,
  wave_name: 'UI Layer',
  agents: ['James-Frontend'],
  dependencies: [2],
  coordination_checkpoint: {
    checkpoint_name: 'UI Ready',
    location: 'After Wave 3',
    blocking: true,
    quality_gates: ['Component tests passing', 'Accessibility validated'],
    validation_steps: ['pnpm test:components', 'pnpm test:a11y'],
    handoff_agents: [
      {
        from: 'James-Frontend',
        to: 'Maria-QA',
        context: 'UI components, user flows, integration points',
      },
    ],
  },
}
```

**Handoff Report**:
```
Agent Handoffs:
✅ Dana-Database → Marcus-Backend
   Context: Database schema, connection details, RLS policies
   Handoff from Dana-Database to Marcus-Backend validated successfully

✅ Marcus-Backend → James-Frontend
   Context: API endpoints, authentication flow, data models
   Handoff from Marcus-Backend to James-Frontend validated successfully

✅ James-Frontend → Maria-QA
   Context: UI components, user flows, integration points
   Handoff from James-Frontend to Maria-QA validated successfully
```

## Checkpoint Patterns

### Pattern 1: Pre-Production Gate

**Use Case**: Validate before deploying to production

```typescript
{
  checkpoint_name: 'Production Readiness',
  location: 'Before Final Wave (Deployment)',
  blocking: true,
  quality_gates: [
    'All tests passing (unit + integration + E2E)',
    'Code coverage >= 80%',
    'Security audit clean (0 high/critical)',
    'Performance benchmarks met',
    'Accessibility WCAG AA compliant',
    'Build successful',
    'Environment variables validated',
  ],
  validation_steps: [
    'pnpm test:all',
    'pnpm test:coverage',
    'pnpm audit --audit-level high',
    'pnpm test:perf',
    'pnpm test:a11y',
    'pnpm build',
    'pnpm validate:env',
  ],
}
```

### Pattern 2: Development Checkpoint

**Use Case**: Validate development quality during feature work

```typescript
{
  checkpoint_name: 'Development Quality',
  location: 'After Development Wave',
  blocking: true,
  quality_gates: [
    'All tests passing',
    'Lint check',
    'Type check',
    'Build successful',
  ],
  validation_steps: [
    'pnpm test',
    'pnpm lint',
    'pnpm typecheck',
    'pnpm build',
  ],
}
```

### Pattern 3: Continuous Quality

**Use Case**: Monitor quality throughout waves without blocking

```typescript
{
  checkpoint_name: 'Continuous Quality Monitoring',
  location: 'After Each Wave',
  blocking: false,  // Non-blocking
  quality_gates: [
    'Code complexity metrics',
    'Technical debt assessment',
    'Performance insights',
    'Bundle size check',
  ],
  validation_steps: [
    'pnpm analyze:complexity',
    'pnpm analyze:debt',
    'pnpm analyze:perf',
    'pnpm analyze:bundle',
  ],
}
```

### Pattern 4: Security Gate

**Use Case**: Enforce security requirements

```typescript
{
  checkpoint_name: 'Security Validation',
  location: 'Before Deployment',
  blocking: true,
  quality_gates: [
    'No critical/high vulnerabilities',
    'OWASP Top 10 mitigation verified',
    'Secrets not committed',
    'Authentication/authorization tested',
  ],
  validation_steps: [
    'pnpm audit --audit-level high',
    'pnpm test:security:owasp',
    'pnpm validate:secrets',
    'pnpm test:auth',
  ],
}
```

## Validation Step Best Practices

### ✅ DO

1. **Use specific commands**
   ```typescript
   ✅ 'pnpm test --run'
   ❌ 'npm test'  // May hang waiting for input
   ```

2. **Set appropriate timeouts**
   ```typescript
   // CheckpointValidator uses 2-minute timeout
   // For longer operations, split into multiple steps
   ✅ 'pnpm test:unit'   // Fast
   ✅ 'pnpm test:e2e'    // Separate step
   ❌ 'pnpm test:all'    // May exceed timeout
   ```

3. **Provide clear output**
   ```bash
   # ✅ Clear pass/fail indicators
   echo "✅ Tests: PASSED"
   echo "Coverage: 85%"

   # ❌ Ambiguous output
   echo "done"
   ```

4. **Handle errors gracefully**
   ```typescript
   ✅ 'pnpm test || echo "Tests failed"'
   ✅ 'pnpm build --no-bail'
   ```

### ❌ DON'T

1. **Don't use interactive commands**
   ```typescript
   ❌ 'npm test'  // May prompt for input
   ❌ 'git commit -i'  // Interactive mode
   ```

2. **Don't assume environment**
   ```typescript
   ❌ 'test'  // Ambiguous command
   ❌ './scripts/validate.sh'  // May not be executable
   ```

3. **Don't skip error codes**
   ```typescript
   ❌ 'pnpm test; exit 0'  // Masks failures
   ```

## Checkpoint Execution Flow

### Step-by-Step Process

```
1. Wave Completes
   ↓
2. Check for Coordination Checkpoint
   ↓
3. Execute Quality Gates (sequential)
   ├─ Gate 1: Execute validation step
   │  ├─ Run command (with timeout)
   │  ├─ Capture output
   │  └─ Parse pass/fail
   ├─ Gate 2: Execute validation step
   │  └─ ...
   └─ Gate N: Execute validation step
   ↓
4. Validate Agent Handoffs
   ├─ Handoff 1: Verify context transfer
   └─ Handoff N: Verify context transfer
   ↓
5. Aggregate Results
   ├─ All gates passed? → PASS
   └─ Any gate failed?
      ├─ Blocking? → FAIL (stop execution)
      └─ Warning? → WARN (continue)
   ↓
6. Generate Report
   ↓
7. Decide Next Action
   ├─ PASS → Continue to next wave
   ├─ FAIL (blocking) → Stop execution
   └─ WARN → Log warning, continue
```

### Example Execution

```typescript
const checkpointResult = await checkpointValidator.validate(checkpoint);

if (!checkpointResult.passed && checkpoint.blocking) {
  console.log(`\n⛔ Wave ${wave.wave_number + 1} BLOCKED`);
  console.log(`   Checkpoint "${checkpoint.checkpoint_name}" failed`);
  console.log(`   Fix errors before continuing:\n`);

  checkpointResult.errors.forEach(error => {
    console.log(`   ❌ ${error}`);
  });

  // STOP execution
  break;
}
```

## Monitoring and Debugging

### Checkpoint Logs

```typescript
[CheckpointValidator] INFO: Validating checkpoint: Production Readiness
[CheckpointValidator] DEBUG: Validating quality gate: All tests passing
[CheckpointValidator] DEBUG: Executing validation step: pnpm test
[CheckpointValidator] INFO: Checkpoint validation complete: Production Readiness
```

### Detailed Report

```typescript
const report = checkpointValidator.generateReport(result);
console.log(report);
```

**Output**:
```
═══════════════════════════════════════════════════════════════
CHECKPOINT VALIDATION: Production Readiness
═══════════════════════════════════════════════════════════════

✅ Status: PASSED
   Blocking: YES
   Execution Time: 8234ms

Quality Gates:
✅ 1. All tests passing
   Validation passed (2341ms)
✅ 2. Code coverage >= 80%
   Validation passed (3456ms)
   Coverage: 85%
✅ 3. Security scan clean
   Validation passed (1234ms)
   No vulnerabilities detected
✅ 4. Build successful
   Validation passed (1203ms)

Agent Handoffs:
✅ Marcus-Backend → Maria-QA
   Context: API ready for integration testing
   Handoff validated successfully

═══════════════════════════════════════════════════════════════
```

### Debugging Failed Gates

```typescript
// Access detailed gate results
checkpointResult.quality_gate_results.forEach(gate => {
  if (!gate.passed) {
    console.log(`❌ Gate: ${gate.gate}`);
    console.log(`   Message: ${gate.message}`);
    console.log(`   Error: ${gate.error}`);
    console.log(`   Output: ${gate.output}`);
  }
});
```

## Integration with Wave Execution

### Automatic Checkpoint Validation

```typescript
// WaveExecutor automatically validates checkpoints
for (const wave of waves) {
  // Execute wave tasks...

  // Check for checkpoint
  if (wave.coordination_checkpoint) {
    const checkpointResult = await this.runCheckpoint(wave.coordination_checkpoint);

    if (!checkpointResult.passed && wave.coordination_checkpoint.blocking) {
      // BLOCK next wave
      break;
    }
  }
}
```

### Checkpoint Events

```typescript
executor.on('checkpoint:start', (checkpoint) => {
  console.log(`🔍 Validating: ${checkpoint.checkpoint_name}`);
});

executor.on('checkpoint:complete', (checkpoint, result) => {
  if (result.passed) {
    console.log(`✅ Checkpoint passed: ${checkpoint.checkpoint_name}`);
  } else {
    console.log(`❌ Checkpoint failed: ${checkpoint.checkpoint_name}`);
  }
});
```

## Advanced Topics

### Custom Validation Logic

For complex validation beyond shell commands:

```typescript
// Custom validator
class CustomCheckpointValidator extends CheckpointValidator {
  async validateQualityGate(gate: string, validationSteps: string[]): Promise<QualityGateResult> {
    if (gate === 'Custom Business Logic') {
      // Custom validation
      const passed = await this.validateBusinessLogic();
      return {
        gate,
        passed,
        message: passed ? 'Business logic valid' : 'Business logic failed',
        execution_time: 0,
      };
    }

    return super.validateQualityGate(gate, validationSteps);
  }
}
```

### Conditional Checkpoints

```typescript
// Enable checkpoint based on environment
const checkpoint = {
  checkpoint_name: 'Production Validation',
  blocking: process.env.NODE_ENV === 'production',  // Only block in prod
  quality_gates: ['Security scan'],
  validation_steps: ['pnpm audit'],
};
```

### Checkpoint Rollback

When checkpoint fails:

```typescript
if (!checkpointResult.passed && checkpoint.blocking) {
  console.log('⚠️  Rolling back changes...');

  // Execute rollback steps
  await rollbackWave(currentWave);

  // Reset state
  this.currentWave = null;
}
```

## Summary

Coordination Checkpoints provide:

✅ **Quality enforcement** at critical transitions
✅ **Early defect detection** before issues cascade
✅ **Agent coordination** with validated handoffs
✅ **Flexible blocking** (hard stops vs warnings)
✅ **Comprehensive reporting** with execution metrics
✅ **Production safety** through automated validation

**Next Steps**:
- [Wave Execution Guide](./WAVE_EXECUTION.md)
- [Conflict Detection Guide](./CONFLICT_DETECTION.md)
- [Quality Gates Reference](/docs/features/quality-gates.md)
