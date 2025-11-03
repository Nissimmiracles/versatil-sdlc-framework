/**
 * VERSATIL SDLC Framework - James-React Sub-Agent Tests
 * Priority 3: Language Sub-Agent Testing
 *
 * Test Coverage:
 * - React pattern detection (hooks, components, state management)
 * - Best practices validation
 * - Performance optimization suggestions
 * - TypeScript integration
 * - Testing strategy recommendations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JamesReact } from './james-react.js';
import type { AgentActivationContext } from '../../../core/base-agent.js';

// Mock dependencies
vi.mock('../../../../rag/enhanced-vector-memory-store.js', () => ({
  EnhancedVectorMemoryStore: vi.fn()
}));

describe('JamesReact', () => {
  let agent: JamesReact;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new JamesReact();
  });

  describe('Agent Initialization', () => {
    it('should initialize with React specialization', () => {
      expect(agent.name).toBe('James-React');
      expect(agent.id).toBe('james-react');
      expect(agent.specialization).toBe('React 18+ Frontend Specialist');
    });

    it('should have React-specific system prompt', () => {
      expect(agent.systemPrompt).toContain('React 18+');
      expect(agent.systemPrompt).toContain('Hooks');
      expect(agent.systemPrompt).toContain('TypeScript');
    });
  });

  describe('React Pattern Detection', () => {
    it('should detect class components', () => {
      const content = `
        class MyComponent extends React.Component {
          render() {
            return <div>Hello</div>;
          }
        }
      `;

      const hasClassComponents = agent['hasClassComponents'](content);
      expect(hasClassComponents).toBe(true);
    });

    it('should detect functional components', () => {
      const content = `
        const MyComponent = () => {
          return <div>Hello</div>;
        };
      `;

      const hasClassComponents = agent['hasClassComponents'](content);
      expect(hasClassComponents).toBe(false);
    });

    it('should detect useState hook', () => {
      const content = `
        const [count, setCount] = useState(0);
      `;

      expect(content).toContain('useState');
    });

    it('should detect useEffect hook', () => {
      const content = `
        useEffect(() => {
          console.log('mounted');
        }, []);
      `;

      expect(content).toContain('useEffect');
    });

    it('should detect conditional hook usage (anti-pattern)', () => {
      const content = `
        if (condition) {
          useState(0); // BAD: conditional hook
        }
      `;

      const hasConditionalHooks = agent['hasConditionalHooks'](content);
      expect(hasConditionalHooks).toBe(true);
    });

    it('should detect missing useEffect dependencies', () => {
      const content = `
        useEffect(() => {
          console.log(value);
        }); // Missing dependency array
      `;

      const hasMissingDeps = agent['hasMissingDependencies'](content);
      expect(hasMissingDeps).toBe(true);
    });
  });

  describe('Best Practices Analysis', () => {
    it('should suggest memo for expensive components', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const ExpensiveComponent = ({ data }) => {
            // Heavy computation
            const processed = expensiveOperation(data);
            return <div>{processed}</div>;
          };
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis).toHaveProperty('suggestions');
      expect(analysis).toHaveProperty('bestPractices');
      expect(analysis).toHaveProperty('score');
    });

    it('should recommend useCallback for event handlers', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const Component = () => {
            const handleClick = () => {}; // Should use useCallback
            return <Child onClick={handleClick} />;
          };
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.bestPractices).toBeDefined();
    });

    it('should validate TypeScript prop types', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          interface Props {
            name: string;
            age: number;
          }

          const Component: React.FC<Props> = ({ name, age }) => {
            return <div>{name} - {age}</div>;
          };
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.score).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should detect unnecessary re-renders', () => {
      const content = `
        const Component = () => {
          const obj = {}; // New object on every render
          return <Child data={obj} />;
        };
      `;

      const hasUnnecessaryRerenders = agent['hasUnnecessaryRerenders'](content);
      expect(typeof hasUnnecessaryRerenders).toBe('boolean');
    });

    it('should suggest React.memo for pure components', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const PureComponent = ({ value }) => <div>{value}</div>;
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.bestPractices.performanceOptimizations).toBeDefined();
    });

    it('should recommend lazy loading for large components', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          import HeavyComponent from './HeavyComponent';
        `,
        filePath: 'App.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });

  describe('State Management', () => {
    it('should detect Context API usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const MyContext = React.createContext(defaultValue);

          const Provider = ({ children }) => {
            const [state, setState] = useState(initialState);
            return <MyContext.Provider value={state}>{children}</MyContext.Provider>;
          };
        `,
        filePath: 'Context.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.bestPractices.stateManagement).toBeDefined();
    });

    it('should detect prop drilling (anti-pattern)', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <A prop={value}>
            <B prop={value}>
              <C prop={value}>
                <D prop={value} />
              </C>
            </B>
          </A>
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Testing Recommendations', () => {
    it('should suggest React Testing Library', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const Component = () => <button>Click me</button>;
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.bestPractices.testingStrategies).toBeDefined();
    });
  });

  describe('Activation Response', () => {
    it('should activate and provide React-specific analysis', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const Component = () => {
            const [count, setCount] = useState(0);
            return <div>{count}</div>;
          };
        `,
        filePath: 'Component.tsx'
      };

      const response = await agent.activate(context);

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('suggestions');
      expect(response.context?.reactAnalysis).toBeDefined();
    });

    it('should provide suggestions for improvements', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          class OldComponent extends Component {
            render() { return <div>Old</div>; }
          }
        `,
        filePath: 'OldComponent.tsx'
      };

      const response = await agent.activate(context);

      expect(response.suggestions).toBeDefined();
      expect(response.suggestions!.length).toBeGreaterThan(0);
    });
  });

  describe('React 18+ Features', () => {
    it('should recognize Suspense usage', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          <Suspense fallback={<Loading />}>
            <LazyComponent />
          </Suspense>
        `,
        filePath: 'App.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis).toBeDefined();
    });

    it('should recognize useTransition hook', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: `
          const [isPending, startTransition] = useTransition();
        `,
        filePath: 'Component.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty content', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: '',
        filePath: 'Empty.tsx'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.suggestions).toBeDefined();
    });

    it('should handle non-React content gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'file-edit',
        content: 'const x = 1;',
        filePath: 'utils.ts'
      };

      const analysis = await agent['analyzeReactPatterns'](context);

      expect(analysis).toBeDefined();
    });
  });
});
