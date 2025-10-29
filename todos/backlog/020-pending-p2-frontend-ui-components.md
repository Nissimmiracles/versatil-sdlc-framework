# Frontend UI Components - ML Workflow Automation

**Status**: Pending
**Priority**: P2 (Important - Non-blocking)
**Assigned**: James-Frontend
**Estimated**: 56h
**Wave**: 3 (User-Facing Components)
**Created**: 2025-10-29

## Mission

Build comprehensive React-based UI for ML workflow automation with 5 major components: WorkflowCanvas, DatasetManager, TrainingDashboard, ResultsViewer, and CloudRunMonitor. Ensure WCAG 2.1 AA accessibility, responsive design, and <3 second load times.

## Context

**Validation Finding**: ❌ NOT FOUND (0% implementation)
- No React frontend code in project
- No UI components for ML features
- Framework has minimal UI (CLI-focused)

**Why This is Important**:
- Visual workflow design improves UX significantly
- Non-technical users need dashboards (not CLI)
- Real-time monitoring requires live UI updates
- Data exploration needs interactive visualizations

**Not Critical Path**: Backend/ML features work without UI, but UI is essential for adoption

## Requirements

### Tech Stack

**Framework**: React 18+ with TypeScript
**State Management**: Zustand or Redux Toolkit
**UI Library**: shadcn/ui (Radix primitives + Tailwind CSS)
**Data Fetching**: TanStack Query (React Query)
**Charts**: Recharts or Chart.js
**Forms**: React Hook Form + Zod validation
**Routing**: React Router v6

**Rationale**:
- React 18: Best-in-class performance, Server Components ready
- shadcn/ui: Accessible by default (Radix UI), customizable, lightweight
- TanStack Query: Caching, optimistic updates, real-time sync
- TypeScript: Type safety for API contracts

### Components (5 Major)

#### 1. WorkflowCanvas
**Purpose**: Visual workflow designer (drag-and-drop nodes)

**Features**:
- Node palette (Dataset, Training, Deployment, etc.)
- Canvas with drag-and-drop
- Node connections (edge drawing)
- Zoom, pan, minimap
- Save/load workflows
- Execute workflow (trigger button)

**Libraries**:
- React Flow (workflow canvas)
- React DnD (drag-and-drop)

**Accessibility**:
- Keyboard navigation (Tab, Arrow keys)
- Screen reader announcements for node connections
- ARIA labels for all interactive elements

#### 2. DatasetManager
**Purpose**: Upload, version, and explore datasets

**Features**:
- Dataset list with search/filter
- Upload interface (drag-and-drop files)
- Dataset preview (first 100 rows, column stats)
- Version history timeline
- Delete/archive datasets

**Accessibility**:
- File upload with keyboard support
- Table navigation with arrow keys
- Color contrast ratio ≥4.5:1

#### 3. TrainingDashboard
**Purpose**: Monitor training jobs with real-time metrics

**Features**:
- Job list (running, completed, failed)
- Real-time metrics charts (loss, accuracy over epochs)
- Logs viewer (streaming logs via SSE)
- Hyperparameter display
- Cancel job button
- Compare multiple runs (side-by-side charts)

**Accessibility**:
- Live region for status updates
- Chart descriptions for screen readers
- Keyboard shortcuts (j/k for navigation)

#### 4. ResultsViewer
**Purpose**: Visualize model predictions and explanations

**Features**:
- Prediction input form (text/image/tabular)
- Result display with confidence scores
- Explanation visualizations (SHAP, attention maps)
- Batch prediction results table
- Export results (CSV, JSON)

**Accessibility**:
- Form validation with clear error messages
- High contrast mode toggle
- Focus management on form submission

#### 5. CloudRunMonitor
**Purpose**: Monitor deployed Cloud Run services

**Features**:
- Service list with status indicators
- Metrics dashboard (request rate, latency, error rate)
- Logs viewer (last 1000 lines)
- Deployment history
- Rollback button

**Accessibility**:
- Status indicators with text labels (not just color)
- Keyboard shortcuts for actions
- Focus trap in modals

## Acceptance Criteria

- [ ] All 5 components implemented and functional
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] WCAG 2.1 AA compliance (verified with axe-core)
- [ ] <3 second initial load time (Lighthouse performance ≥90)
- [ ] Dark mode support
- [ ] API integration with backend (todos/017)
- [ ] Unit tests for all components (85%+ coverage)
- [ ] E2E tests with Playwright
- [ ] Storybook documentation for components
- [ ] Bundle size <500KB (gzipped)

## Technical Approach

### Project Structure

```
src/frontend/
├── components/
│   ├── WorkflowCanvas/
│   │   ├── WorkflowCanvas.tsx
│   │   ├── NodePalette.tsx
│   │   ├── CanvasNode.tsx
│   │   └── WorkflowCanvas.test.tsx
│   ├── DatasetManager/
│   │   ├── DatasetManager.tsx
│   │   ├── DatasetList.tsx
│   │   ├── DatasetUpload.tsx
│   │   ├── DatasetPreview.tsx
│   │   └── DatasetManager.test.tsx
│   ├── TrainingDashboard/
│   ├── ResultsViewer/
│   └── CloudRunMonitor/
├── hooks/
│   ├── useWorkflows.ts
│   ├── useDatasets.ts
│   ├── useTrainingJobs.ts
│   └── usePredictions.ts
├── api/
│   ├── client.ts (Axios instance)
│   ├── workflows.api.ts
│   ├── datasets.api.ts
│   └── ... (API clients)
├── store/
│   ├── workflowStore.ts
│   ├── datasetStore.ts
│   └── ... (Zustand stores)
├── types/
│   ├── workflows.types.ts
│   ├── datasets.types.ts
│   └── ... (TypeScript types)
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── ... (utility functions)
└── App.tsx
```

### Example Component: WorkflowCanvas

```tsx
// src/frontend/components/WorkflowCanvas/WorkflowCanvas.tsx
import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodePalette } from './NodePalette';
import { useWorkflows } from '../../hooks/useWorkflows';

interface WorkflowCanvasProps {
  workflowId?: string;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({ workflowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { saveWorkflow, executeWorkflow } = useWorkflows();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow');
      const position = { x: event.clientX, y: event.clientY };

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { label: `${nodeType} node` }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onSave = async () => {
    await saveWorkflow({
      id: workflowId,
      nodes,
      edges
    });
  };

  const onExecute = async () => {
    if (workflowId) {
      await executeWorkflow(workflowId);
    }
  };

  return (
    <div className="h-screen flex">
      <NodePalette />
      <div className="flex-1" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            aria-label="Save workflow"
          >
            Save
          </button>
          <button
            onClick={onExecute}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            aria-label="Execute workflow"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Example Hook: useDatasets

```typescript
// src/frontend/hooks/useDatasets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { datasetsApi } from '../api/datasets.api';
import { Dataset, CreateDatasetInput } from '../types/datasets.types';

export const useDatasets = () => {
  const queryClient = useQueryClient();

  const { data: datasets, isLoading } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list()
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateDatasetInput) => datasetsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    }
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      datasetsApi.upload(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
    }
  });

  return {
    datasets: datasets?.data || [],
    isLoading,
    create: createMutation.mutate,
    upload: uploadMutation.mutate,
    isCreating: createMutation.isPending,
    isUploading: uploadMutation.isPending
  };
};
```

### Example API Client

```typescript
// src/frontend/api/datasets.api.ts
import { apiClient } from './client';
import { Dataset, CreateDatasetInput } from '../types/datasets.types';

export const datasetsApi = {
  list: async (): Promise<{ data: Dataset[] }> => {
    const response = await apiClient.get('/api/v1/datasets');
    return response.data;
  },

  getById: async (id: string): Promise<{ data: Dataset }> => {
    const response = await apiClient.get(`/api/v1/datasets/${id}`);
    return response.data;
  },

  create: async (input: CreateDatasetInput): Promise<{ data: Dataset }> => {
    const response = await apiClient.post('/api/v1/datasets', input);
    return response.data;
  },

  upload: async (id: string, files: File[]): Promise<void> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    await apiClient.post(`/api/v1/datasets/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/datasets/${id}`);
  }
};
```

## Dependencies

**Required Libraries**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.10.0",
    "zustand": "^4.4.0",
    "reactflow": "^11.10.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@radix-ui/react-*": "latest",
    "recharts": "^2.10.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@playwright/test": "^1.40.0",
    "@storybook/react": "^7.6.0",
    "@testing-library/react": "^14.1.0",
    "vite": "^5.0.0"
  }
}
```

**Blocks**: None

**Depends On**:
- 017-backend-api-development.md (needs API endpoints)

**Parallel with**: 019 (n8n Workflows)

## Testing Requirements

### Unit Tests
```typescript
// src/frontend/components/DatasetManager/DatasetManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatasetManager } from './DatasetManager';

describe('DatasetManager', () => {
  it('should display datasets list', async () => {
    render(<DatasetManager />);

    await waitFor(() => {
      expect(screen.getByText('Training Dataset')).toBeInTheDocument();
    });
  });

  it('should upload dataset files', async () => {
    const user = userEvent.setup();
    render(<DatasetManager />);

    const file = new File(['test'], 'dataset.csv', { type: 'text/csv' });
    const input = screen.getByLabelText('Upload files');

    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(screen.getByText('Upload successful')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/workflow-creation.spec.ts
import { test, expect } from '@playwright/test';

test('create and execute workflow', async ({ page }) => {
  await page.goto('http://localhost:3000/workflows');

  // Create new workflow
  await page.click('text=New Workflow');
  await page.fill('[name="name"]', 'Test Workflow');
  await page.click('text=Save');

  // Add nodes
  await page.dragAndDrop('[data-node-type="dataset"]', '.react-flow-canvas');
  await page.dragAndDrop('[data-node-type="training"]', '.react-flow-canvas');

  // Connect nodes
  // ... (complex interaction)

  // Execute
  await page.click('text=Execute');
  await expect(page.locator('text=Workflow executing')).toBeVisible();
});
```

### Accessibility Tests
```typescript
// tests/a11y/components.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { WorkflowCanvas } from '../src/components/WorkflowCanvas';

expect.extend(toHaveNoViolations);

test('WorkflowCanvas should have no accessibility violations', async () => {
  const { container } = render(<WorkflowCanvas />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Target Coverage**: 85%+

## Performance Requirements

| Metric | Target | Method |
|--------|--------|--------|
| Initial load time | <3 seconds | Code splitting, lazy loading |
| Time to Interactive | <5 seconds | Server-side rendering (future) |
| Bundle size | <500KB gzipped | Tree shaking, minification |
| Lighthouse Performance | ≥90 | Image optimization, caching |
| FCP | <1.8 seconds | Critical CSS inline |
| LCP | <2.5 seconds | Prioritize above-the-fold content |

## Files to Create

1. `src/frontend/components/WorkflowCanvas/*.tsx` (4 files)
2. `src/frontend/components/DatasetManager/*.tsx` (4 files)
3. `src/frontend/components/TrainingDashboard/*.tsx` (5 files)
4. `src/frontend/components/ResultsViewer/*.tsx` (3 files)
5. `src/frontend/components/CloudRunMonitor/*.tsx` (4 files)
6. `src/frontend/hooks/*.ts` (5 files)
7. `src/frontend/api/*.api.ts` (5 files)
8. `tests/frontend/**/*.test.tsx` (30+ files)
9. `tests/e2e/*.spec.ts` (10+ files)
10. `docs/frontend-components.md`

## Success Metrics

- [ ] All 5 components functional
- [ ] WCAG 2.1 AA compliant (axe-core: 0 violations)
- [ ] Lighthouse performance ≥90
- [ ] 85%+ test coverage
- [ ] Bundle size <500KB gzipped
- [ ] Dark mode working
- [ ] Documentation complete

## Related Todos

- **Blocks**: None
- **Part of**: Wave 3 (User-Facing Components)
- **Depends on**: Todo 017 (Backend API)

---

**Agent**: James-Frontend
**Auto-Activate**: YES (UI/UX expertise required)
**Estimated**: 56 hours
**Priority**: P2 (Important but not critical path)
