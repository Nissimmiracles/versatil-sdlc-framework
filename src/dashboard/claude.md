# dashboard/ - Metrics & Visualization

**Priority**: MEDIUM
**Agent(s)**: James-Frontend (primary owner), Sarah-PM
**Last Updated**: 2025-10-26

## 📋 Library Purpose

Admin dashboard for monitoring framework health, test coverage, agent performance, and deployment metrics. Uses recharts for visualization and React Query for data fetching.

## 🎯 Core Concepts

- **MetricsCollector**: Gathers health, coverage, performance data
- **ChartComponents**: recharts-based visualizations (line, bar, pie)
- **RealTimeUpdates**: WebSocket-based live metric updates

## ✅ Rules

### DO ✓
- ✓ Cache metrics data (5min TTL)
- ✓ Use skeleton loaders for loading states
- ✓ Make charts accessible (ARIA labels)

### DON'T ✗
- ✗ Don't fetch metrics on every render
- ✗ Don't skip loading states

## 🔧 Pattern: Display Coverage Metric
```tsx
import { useCoverageMetric } from '@/dashboard/hooks.js';

function CoverageWidget() {
  const { data, isLoading } = useCoverageMetric();

  if (isLoading) return <Skeleton />;

  return (
    <div>
      <h3>Test Coverage</h3>
      <Progress value={data.percentage} />
      <span>{data.percentage}% ({data.lines}/{data.total} lines)</span>
    </div>
  );
}
```

## 📚 Docs
- [Dashboard Guide](../../docs/DASHBOARD.md)
- [Metrics API](../../docs/METRICS_API.md)

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → `loadLibraryContext('dashboard')`
