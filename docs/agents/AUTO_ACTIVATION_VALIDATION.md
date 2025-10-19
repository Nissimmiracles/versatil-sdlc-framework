# Agent Auto-Activation Validation System

**Version**: 1.0.0
**Last Updated**: 2025-01-19

## Overview

VERSATIL Framework's Agent Auto-Activation Validation System ensures that all 18 agents (8 core OPERA agents + 10 language-specific sub-agents) activate correctly based on file patterns, code content, and context triggers.

**Success Criteria**:
- ✅ Activation accuracy >90% for all agents
- ✅ Activation latency <2 seconds per agent
- ✅ False positive rate <5%
- ✅ Correct sub-agent routing >85%

---

## Architecture

### Components

```
validation-system/
├── src/agents/
│   ├── activation-tracker.ts       # Real-time event tracking & metrics
│   └── activation-validator.ts     # Validation logic & test utilities
├── tests/agents/
│   ├── auto-activation.test.ts     # Core agent activation tests
│   └── sub-agent-activation.test.ts # Sub-agent routing tests
├── tests/integration/
│   └── agent-auto-activation-e2e.test.ts  # E2E workflow tests
└── scripts/
    └── validate-activation.cjs     # CLI validation dashboard
```

### Data Flow

```
File Change → Trigger Detection → Agent Selection → Activation → Metrics Tracking
                                         ↓
                                  Sub-Agent Routing
                                         ↓
                                  Validation & Reporting
```

---

## Agents Validated

### Core OPERA Agents (8)

| Agent ID | Trigger Patterns | Sub-Agents |
|----------|------------------|------------|
| `maria-qa` | `*.test.*`, `__tests__/**`, test code patterns | None |
| `dana-database` | `*.sql`, `migrations/**`, `prisma/**`, `supabase/**` | None |
| `marcus-backend` | `*.api.*`, `routes/**`, `controllers/**` | 5 sub-agents |
| `james-frontend` | `*.tsx`, `*.jsx`, `*.vue`, `*.css` | 5 sub-agents |
| `alex-ba` | `requirements/**`, `*.feature` | None |
| `sarah-pm` | `*.md`, `docs/**` | None |
| `dr-ai-ml` | `*.py`, `*.ipynb`, `models/**` | None |
| `oliver-mcp` | `**/mcp/**`, `*.mcp.*` | None |

### Marcus Backend Sub-Agents (5)

| Sub-Agent ID | Detection Pattern | Confidence Threshold |
|--------------|-------------------|----------------------|
| `marcus-node` | `package.json`, Express/Fastify/NestJS imports | >70% |
| `marcus-python` | `*.py`, FastAPI/Django/Flask imports | >60% |
| `marcus-rails` | `*.rb`, Rails/ActiveRecord patterns | >60% |
| `marcus-go` | `*.go`, Gin/Echo imports | >60% |
| `marcus-java` | `*.java`, Spring Boot annotations | >60% |

### James Frontend Sub-Agents (5)

| Sub-Agent ID | Detection Pattern | Confidence Threshold |
|--------------|-------------------|----------------------|
| `james-react` | `*.tsx`, React imports, hooks | >50% |
| `james-vue` | `*.vue`, Vue imports, Composition API | >70% |
| `james-nextjs` | Next.js imports (`next/link`, `next/image`) | >70% |
| `james-angular` | Angular decorators (`@Component`, `@NgModule`) | >70% |
| `james-svelte` | `*.svelte`, Svelte stores | >70% |

---

## Usage

### Running Validation Tests

```bash
# Run all activation tests
npm test -- tests/agents/auto-activation.test.ts

# Run sub-agent tests
npm test -- tests/agents/sub-agent-activation.test.ts

# Run E2E workflow tests
npm test -- tests/integration/agent-auto-activation-e2e.test.ts

# Run all validation tests
npm test -- tests/agents/ tests/integration/agent-auto-activation-e2e.test.ts
```

### Validation Dashboard

```bash
# Run tests and display dashboard
node scripts/validate-activation.cjs --run-tests

# Display dashboard only (uses existing metrics)
node scripts/validate-activation.cjs

# Export results
node scripts/validate-activation.cjs --json --csv
```

**Dashboard Output**:

```
╔════════════════════════════════════════════════════════════╗
║     VERSATIL Agent Auto-Activation Validator v1.0.0       ║
╚════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────┐
│                    VALIDATION SUMMARY                      │
└────────────────────────────────────────────────────────────┘

  Overall Accuracy     94.5%
  Overall Latency      850ms
  Total Activations    127

Core OPERA Agents (8):

  ✓ maria-qa            95% 650ms (42 activations)
  ✓ dana-database       92% 720ms (18 activations)
  ✓ marcus-backend      93% 890ms (31 activations)
  ✓ james-frontend      96% 780ms (24 activations)
  ✓ alex-ba             91% 600ms (5 activations)
  ✓ sarah-pm            90% 550ms (3 activations)
  ✓ dr-ai-ml            94% 900ms (2 activations)
  ✓ oliver-mcp          98% 400ms (2 activations)

Backend Sub-Agents (5):

  ✓ marcus-node         88% 450ms (12 activations)
  ✓ marcus-python       86% 520ms (8 activations)
  ✓ marcus-rails        No data
  ✓ marcus-go           No data
  ✓ marcus-java         No data

Frontend Sub-Agents (5):

  ✓ james-react         92% 380ms (18 activations)
  ✓ james-vue           89% 420ms (6 activations)
  ✓ james-nextjs        No data
  ✓ james-angular       No data
  ✓ james-svelte        No data

✓ All agents passing validation requirements!
```

---

## Activation Tracker API

### Tracking Events

```typescript
import { getActivationTracker } from './src/agents/activation-tracker';

const tracker = getActivationTracker();

// Track activation event
tracker.trackActivation({
  agentId: 'maria-qa',
  trigger: {
    type: 'file_pattern',
    pattern: '*.test.*',
    filePath: 'src/LoginForm.test.tsx'
  },
  latency: 650,
  accuracy: 'correct',
  confidence: 95
});
```

### Querying Metrics

```typescript
// Get metrics for specific agent
const mariaMetrics = tracker.getAgentMetrics('maria-qa');
console.log(`Accuracy: ${mariaMetrics.accuracy}%`);
console.log(`Avg Latency: ${mariaMetrics.averageLatency}ms`);

// Get all metrics
const allMetrics = tracker.getAllMetrics();

// Generate validation report
const report = tracker.generateReport();
console.log(report.summary);

// Export data
const csv = tracker.exportCSV();
const json = tracker.exportReportJSON();
```

---

## Activation Validator API

### Validating Triggers

```typescript
import { ActivationValidator } from './src/agents/activation-validator';

// Validate file pattern trigger
const shouldActivate = ActivationValidator.validateFilePattern(
  'maria-qa',
  'src/component.test.tsx'
);
// Returns: true

// Validate code pattern trigger
const hasTestCode = ActivationValidator.validateCodePattern(
  'maria-qa',
  'describe("test", () => {})'
);
// Returns: true

// Run validation test
const result = await ActivationValidator.validateActivation({
  testId: 'test-1',
  agentId: 'maria-qa',
  filePath: 'src/LoginForm.test.tsx',
  content: 'describe("LoginForm", () => {})',
  expectedActivation: true
});

console.log(result.message); // "✓ Correct activation"
console.log(result.latency);  // 15ms
```

### Batch Testing

```typescript
import { ActivationValidator, SAMPLE_VALIDATION_TESTS } from './src/agents/activation-validator';

// Run batch tests
const batchResult = await ActivationValidator.runBatchTests(
  SAMPLE_VALIDATION_TESTS['maria-qa'],
  projectPath
);

console.log(`Accuracy: ${batchResult.accuracy}%`);
console.log(`Avg Latency: ${batchResult.averageLatency}ms`);

// Generate report
const report = ActivationValidator.generateValidationReport(batchResult);
console.log(report);
```

---

## Test Structure

### Unit Tests (Auto-Activation)

```typescript
describe('Maria-QA Auto-Activation', () => {
  it('should activate on *.test.* files', async () => {
    const context: AgentActivationContext = {
      trigger: 'file_edit',
      filePath: 'src/example.test.ts',
      content: 'describe("test", () => {})',
      timestamp: new Date()
    };

    const shouldActivate = await shouldActivateMaria(context);
    const latency = Date.now() - startTime;

    expect(shouldActivate).toBe(true);
    expect(latency).toBeLessThan(2000);

    tracker.trackActivation({
      agentId: 'maria-qa',
      trigger: { type: 'file_pattern', pattern: '*.test.*', filePath: context.filePath },
      latency,
      accuracy: 'correct',
      confidence: 95
    });
  });
});
```

### Integration Tests (E2E)

```typescript
describe('Full-Stack Feature Workflow', () => {
  it('should activate multiple agents for authentication feature', async () => {
    const files = [
      { path: '001_create_users.sql', expectedAgent: 'dana-database' },
      { path: 'auth.api.ts', expectedAgent: 'marcus-backend' },
      { path: 'LoginForm.tsx', expectedAgent: 'james-frontend' },
      { path: 'auth.test.ts', expectedAgent: 'maria-qa' }
    ];

    for (const file of files) {
      await writeFile(file.path, content);
      await waitForActivation();
      // Verify correct agent activated
    }
  });
});
```

---

## Metrics & Reporting

### Stored Metrics

Location: `~/.versatil/metrics/activation/activation-events.json`

```json
[
  {
    "eventId": "activation-1737312000000-abc123",
    "timestamp": "2025-01-19T10:00:00.000Z",
    "agentId": "maria-qa",
    "trigger": {
      "type": "file_pattern",
      "pattern": "*.test.*",
      "filePath": "src/LoginForm.test.tsx"
    },
    "latency": 650,
    "accuracy": "correct",
    "confidence": 95
  }
]
```

### Accuracy Types

- **`correct`**: Agent activated correctly (true positive)
- **`incorrect`**: Wrong agent activated (misrouting)
- **`false_positive`**: Agent activated when it shouldn't have
- **`false_negative`**: Agent didn't activate when it should have

### Performance Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Accuracy | >90% | 80-90% | <80% |
| Latency (avg) | <2000ms | 2000-3000ms | >3000ms |
| False Positive Rate | <5% | 5-10% | >10% |
| Sub-Agent Routing | >85% | 75-85% | <75% |

---

## Troubleshooting

### Low Activation Accuracy (<90%)

**Possible Causes**:
1. Trigger patterns too broad (causing false positives)
2. Trigger patterns too narrow (causing false negatives)
3. Conflicting patterns between agents

**Solutions**:
1. Review trigger patterns in `src/agents/sdk/agent-definitions.ts`
2. Add more specific file/code patterns
3. Test with edge cases using `ActivationValidator`
4. Check for pattern overlap between agents

### High Activation Latency (>2s)

**Possible Causes**:
1. Complex regex patterns
2. Slow sub-agent selection
3. RAG memory queries not optimized

**Solutions**:
1. Pre-compile regex patterns
2. Cache sub-agent selection results (5-minute TTL)
3. Optimize RAG queries
4. Use agent pool warm-up for faster initialization

### False Positives

**Example**: Maria-QA activates on non-test files

**Solution**:
```typescript
// Before: Too broad
filePatterns: ['*.ts', '*.tsx']

// After: More specific
filePatterns: ['*.test.ts', '*.test.tsx', '**/__tests__/**']
```

### False Negatives

**Example**: Dana-Database doesn't activate on Prisma files

**Solution**:
```typescript
// Add missing pattern
filePatterns: [
  '*.sql',
  '/migrations/',
  '/supabase/',
  '/prisma/' // Add this
]
```

---

## Continuous Validation

### CI/CD Integration

```yaml
# .github/workflows/validate-activation.yml
name: Validate Agent Activation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- tests/agents/ tests/integration/agent-auto-activation-e2e.test.ts
      - run: node scripts/validate-activation.cjs --json --csv
      - uses: actions/upload-artifact@v3
        with:
          name: activation-reports
          path: |
            activation-validation-report.json
            activation-validation-report.csv
```

### Pre-Commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Run activation validation before commits that modify agent definitions
if git diff --cached --name-only | grep -q "agent-definitions.ts"; then
  echo "Agent definitions changed, running validation..."
  node scripts/validate-activation.cjs --run-tests

  if [ $? -ne 0 ]; then
    echo "❌ Activation validation failed. Please fix issues before committing."
    exit 1
  fi
fi
```

---

## Best Practices

### 1. Test-Driven Trigger Development

When adding new trigger patterns:

```typescript
// 1. Write test first
it('should activate on new pattern', async () => {
  const result = await validateActivation({
    testId: 'new-pattern-1',
    agentId: 'maria-qa',
    filePath: 'src/integration.test.ts',
    content: 'integration test code',
    expectedActivation: true
  });

  expect(result.passed).toBe(true);
});

// 2. Add trigger pattern
// src/agents/sdk/agent-definitions.ts
filePatterns: [..., '/integration/', '*.integration.*']

// 3. Run validation
// node scripts/validate-activation.cjs --run-tests
```

### 2. Monitor Activation Metrics

```typescript
// In production code
import { getActivationTracker } from './activation-tracker';

const tracker = getActivationTracker();

// Track every activation
orchestrator.on('agent-activated', (event) => {
  tracker.trackActivation({
    agentId: event.agentId,
    trigger: event.trigger,
    latency: event.latency,
    accuracy: 'correct', // Validate this
    confidence: event.confidence
  });
});

// Generate daily reports
setInterval(() => {
  const report = tracker.generateReport();
  if (report.failedAgents.length > 0) {
    console.warn('⚠️ Some agents have low accuracy:', report.failedAgents);
  }
}, 24 * 60 * 60 * 1000); // Daily
```

### 3. False Positive Prevention

```typescript
// Add negative test cases
it('should NOT activate on similar but different files', async () => {
  const result = await validateActivation({
    testId: 'false-positive-check',
    agentId: 'maria-qa',
    filePath: 'src/testimony.ts', // Contains "test" but not a test file
    content: 'export const testimony = "...";',
    expectedActivation: false
  });

  expect(result.passed).toBe(true);
  expect(result.accuracy).toBe('correct');
});
```

---

## Future Enhancements

### Planned Features (v1.1.0)

- [ ] Machine learning-based trigger optimization
- [ ] A/B testing for trigger patterns
- [ ] Real-time activation visualization dashboard (web UI)
- [ ] Automated pattern suggestion based on historical data
- [ ] Integration with Claude Memory Tool for pattern storage
- [ ] Activation heatmaps (which files trigger which agents most)

### Research Areas

- **Adaptive Triggers**: Learn optimal patterns from user behavior
- **Context-Aware Activation**: Use AST parsing for more accurate code triggers
- **Multi-Agent Coordination**: Validate agent handoff accuracy
- **Performance Profiling**: Identify slow activation paths

---

## References

- [Agent Definitions](../../src/agents/sdk/agent-definitions.ts)
- [Activation Tracker Source](../../src/agents/activation-tracker.ts)
- [Activation Validator Source](../../src/agents/activation-validator.ts)
- [Auto-Activation Tests](../../tests/agents/auto-activation.test.ts)
- [Sub-Agent Tests](../../tests/agents/sub-agent-activation.test.ts)
- [E2E Tests](../../tests/integration/agent-auto-activation-e2e.test.ts)

---

## Support

For issues or questions:
1. Run validation dashboard: `node scripts/validate-activation.cjs`
2. Check metrics: `cat ~/.versatil/metrics/activation/activation-events.json | jq`
3. Review trigger patterns: `src/agents/sdk/agent-definitions.ts`
4. Report issues with validation report attached

---

**Last Updated**: 2025-01-19
**Version**: 1.0.0
**Maintained By**: VERSATIL Framework Team
