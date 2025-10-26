---
name: intelligence-library
description: AI/ML decision engine for model selection (o1 vs claude-sonnet), ML pipeline orchestration, feature engineering, and model evaluation. Use when choosing optimal models, orchestrating training pipelines, monitoring token usage/costs, or integrating with RAG for context-aware predictions.
tags: [intelligence, ai, ml, model-selection, pipeline]
---

# intelligence/ - AI/ML Decision Engine

**Priority**: LOW
**Agent(s)**: Dr.AI-ML (primary owner)
**Last Updated**: 2025-10-26

## When to Use

- Choosing optimal AI model based on task complexity (o1 vs claude-sonnet)
- Orchestrating ML training, evaluation, and deployment pipelines
- Extracting features from code/commits for ML models
- Monitoring token usage and API costs
- Implementing context-aware predictions with RAG integration
- Evaluating model performance metrics

## What This Library Provides

- **ModelSelector**: Chooses optimal AI model (o1 for complex, sonnet for speed)
- **MLPipeline**: Orchestrates training, evaluation, deployment
- **FeatureEngineering**: Extracts features from code/commits
- **15-minute cache** for model responses
- **Token usage monitoring** and cost tracking

## Core Conventions

### DO ✓
- ✓ Use o1 for complex reasoning, claude-sonnet for speed
- ✓ Cache model responses (15-minute TTL)
- ✓ Monitor token usage and costs
- ✓ Evaluate model performance metrics

### DON'T ✗
- ✗ Don't use o1 for simple tasks (expensive)
- ✗ Don't skip model evaluation metrics
- ✗ Don't ignore cost monitoring

## Quick Start

```typescript
import { modelSelector } from '@/intelligence/model-selector.js';

// Automatic model selection
const model = await modelSelector.select({
  task: 'Plan three-tier auth feature',
  complexity: 'high', // high, medium, low
  contextSize: 'large'
});

// Returns: 'o1' for high complexity
// Returns: 'claude-sonnet-4-5' for low complexity

console.log(`Selected model: ${model}`);
console.log(`Estimated cost: ${model.estimatedCost}`);
```

## Model Selection Rules

| Task Complexity | Context Size | Reasoning Depth | Model |
|----------------|-------------|-----------------|-------|
| High | Large | Deep | o1 |
| High | Small | Deep | o1 |
| Medium | Large | Moderate | claude-sonnet-4-5 |
| Medium | Small | Moderate | claude-sonnet-4-5 |
| Low | Any | Shallow | claude-sonnet-4-5 |

## Cost Optimization

```typescript
import { tokenMonitor } from '@/intelligence/token-monitor.js';

// Track token usage
const usage = await tokenMonitor.getUsage({
  timeRange: 'last_24h'
});

console.log(`Tokens used: ${usage.total}`);
console.log(`Cost: $${usage.cost}`);
console.log(`Model breakdown:`, usage.byModel);
```

## Related Documentation

- [references/model-selection.md](references/model-selection.md) - Model selection algorithm
- [references/ml-pipeline.md](references/ml-pipeline.md) - ML pipeline orchestration
- [docs/ML_PIPELINE.md](../../../docs/ML_PIPELINE.md) - ML pipeline guide
- [.claude/agents/dr-ai-ml.md](../../.claude/agents/dr-ai-ml.md) - Dr.AI-ML agent

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/intelligence/**`
