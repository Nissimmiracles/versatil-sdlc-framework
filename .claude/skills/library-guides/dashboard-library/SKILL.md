---
name: dashboard-library
description: Admin dashboard for monitoring framework health, test coverage, agent performance, and deployment metrics. Use when building dashboards, creating chart visualizations with recharts, implementing real-time updates, or ensuring accessibility (WCAG 2.1 AA). Includes metrics collection and React Query data fetching.
tags: [dashboard, metrics, visualization, recharts, react-query]
---

# dashboard/ - Metrics & Visualization

**Priority**: LOW
**Agent(s)**: James-Frontend (primary owner), Sarah-PM
**Last Updated**: 2025-10-26

## When to Use

- Building admin dashboards for framework monitoring
- Creating chart visualizations (line, bar, pie) with recharts
- Implementing real-time metric updates via WebSocket
- Ensuring dashboard accessibility (ARIA labels, keyboard nav)
- Fetching metrics data with React Query caching
- Displaying test coverage, agent performance, deployment metrics

## What This Library Provides

- **MetricsCollector**: Gathers health, coverage, performance data
- **ChartComponents**: recharts-based visualizations
- **RealTimeUpdates**: WebSocket-based live updates
- **5-min cache TTL** for metrics data
- **Skeleton loaders** for loading states

## Core Conventions

### DO ✓
- ✓ Cache metrics data (5min TTL)
- ✓ Use skeleton loaders for loading states
- ✓ Make charts accessible (ARIA labels)
- ✓ Use React Query for data fetching

### DON'T ✗
- ✗ Don't fetch metrics on every render
- ✗ Don't skip loading states
- ✗ Don't ignore accessibility

## Quick Start

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

## Related Documentation

- [references/metrics-api.md](references/metrics-api.md) - Metrics collection API
- [references/chart-components.md](references/chart-components.md) - Chart component library
- [docs/DASHBOARD.md](../../../docs/DASHBOARD.md) - Dashboard guide

---

**Auto-injected via**: `.claude/hooks/before-prompt.ts` → Skill notification when editing `src/dashboard/**`
