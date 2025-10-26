# intelligence/ - AI/ML Decision Engine

**Priority**: HIGH
**Agent(s)**: Dr.AI-ML (primary owner)
**Last Updated**: 2025-10-26

## 📋 Library Purpose

AI-powered decision making for model selection (o1 vs claude-sonnet), ML pipeline orchestration, feature engineering, and model evaluation. Integrates with RAG system for context-aware predictions.

## 🎯 Core Concepts

- **ModelSelector**: Chooses optimal AI model based on task complexity
- **MLPipeline**: Orchestrates training, evaluation, deployment
- **FeatureEngineering**: Extracts features from code/commits for ML models

## ✅ Rules

### DO ✓
- ✓ Use o1 for complex reasoning, claude-sonnet for speed
- ✓ Cache model responses (15-minute TTL)
- ✓ Monitor token usage and costs

### DON'T ✗
- ✗ Don't use o1 for simple tasks (expensive)
- ✗ Don't skip model evaluation metrics

## 🔧 Pattern: Model Selection
```typescript
import { modelSelector } from '@/intelligence/model-selector.js';

const model = await modelSelector.select({
  task: 'Plan three-tier auth feature',
  complexity: 'high',
  contextSize: 'large'
});
// Returns: 'o1' for high complexity, 'claude-sonnet-4-5' for low
```

## 📚 Docs
- [ML Pipeline Guide](../../docs/ML_PIPELINE.md)
- [Dr.AI-ML Agent](../agents/opera/dr-ai-ml/)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('intelligence')`
