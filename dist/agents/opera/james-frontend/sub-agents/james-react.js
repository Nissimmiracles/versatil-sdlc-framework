/**
 * James-React: React 18+ Frontend Specialist
 *
 * Language-specific sub-agent for React 18+ development.
 * Specializes in Hooks, TypeScript, TanStack Query, and modern React patterns.
 *
 * Auto-activates on: React components (*.tsx, *.jsx), hooks patterns, React Context
 *
 * @module james-react
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
export class JamesReact extends EnhancedJames {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'James-React';
        this.id = 'james-react';
        this.specialization = 'React 18+ Frontend Specialist';
        this.systemPrompt = `You are James-React, a specialized React frontend expert with deep knowledge of:
- React 18+ features (Suspense, Concurrent Rendering, Transitions)
- Modern Hooks (useState, useEffect, useMemo, useCallback, useRef, custom hooks)
- TypeScript integration with React (FC, ReactNode, PropsWithChildren)
- TanStack Query (React Query) for data fetching and caching
- State management (Context API, Zustand, Jotai)
- Component composition and reusability
- Performance optimization (memo, useMemo, lazy loading)
- Testing with React Testing Library`;
    }
    /**
     * Override activate to add React-specific validation
     */
    async activate(context) {
        // Run base James activation
        const response = await super.activate(context);
        // Add React-specific analysis
        const reactAnalysis = await this.analyzeReactPatterns(context);
        // Enhance response with React insights
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...reactAnalysis.suggestions);
        if (response.context) {
            response.context.reactAnalysis = reactAnalysis;
        }
        return response;
    }
    /**
     * Analyze React-specific patterns
     */
    async analyzeReactPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        const bestPractices = {
            hooksPatterns: [],
            componentStructure: [],
            performanceOptimizations: [],
            stateManagement: [],
            testingStrategies: []
        };
        let score = 100;
        // Check for class components (anti-pattern in modern React)
        if (this.hasClassComponents(content)) {
            score -= 15;
            suggestions.push({
                type: 'component-structure',
                message: 'Class components detected. Migrate to functional components with Hooks.',
                priority: 'medium'
            });
            bestPractices.componentStructure.push('Use functional components with Hooks instead of class components');
        }
        // Check for improper Hook usage
        if (this.hasConditionalHooks(content)) {
            score -= 25;
            suggestions.push({
                type: 'hooks-rules',
                message: 'Hooks called conditionally. Hooks must be called at the top level of components.',
                priority: 'critical'
            });
            bestPractices.hooksPatterns.push('Always call Hooks at the top level (not inside conditions/loops)');
        }
        // Check for missing dependency arrays in useEffect
        if (this.hasMissingDependencies(content)) {
            score -= 20;
            suggestions.push({
                type: 'hooks-dependencies',
                message: 'useEffect missing dependency array. Add dependencies or use [] for mount-only effects.',
                priority: 'high'
            });
            bestPractices.hooksPatterns.push('Always specify dependency array in useEffect/useCallback/useMemo');
        }
        // Check for unnecessary re-renders
        if (this.hasUnnecessaryRerenders(content)) {
            score -= 10;
            suggestions.push({
                type: 'performance',
                message: 'Component may re-render unnecessarily. Consider React.memo, useMemo, or useCallback.',
                priority: 'medium'
            });
            bestPractices.performanceOptimizations.push('Use React.memo for expensive components, useMemo for computed values, useCallback for stable functions');
        }
        // Check for inline object/array creation in JSX
        if (this.hasInlineObjectsInJSX(content)) {
            score -= 8;
            suggestions.push({
                type: 'performance',
                message: 'Inline objects/arrays in JSX cause unnecessary re-renders. Move to useMemo or constants.',
                priority: 'low'
            });
            bestPractices.performanceOptimizations.push('Avoid inline object/array literals in JSX props');
        }
        // Check for proper TypeScript prop types
        if (!this.hasProperPropTypes(content)) {
            score -= 5;
            suggestions.push({
                type: 'type-safety',
                message: 'Component props not properly typed. Define interface for props.',
                priority: 'medium'
            });
            bestPractices.componentStructure.push('Define TypeScript interfaces for all component props');
        }
        // Check for key prop in lists
        if (this.hasMissingKeys(content)) {
            score -= 15;
            suggestions.push({
                type: 'react-rules',
                message: 'Missing key prop in list items. Add unique key for each list item.',
                priority: 'high'
            });
            bestPractices.componentStructure.push('Always provide unique key prop when rendering lists');
        }
        // Check for state management patterns
        if (this.hasComplexLocalState(content)) {
            score -= 5;
            suggestions.push({
                type: 'state-management',
                message: 'Complex local state detected. Consider using useReducer or external state management.',
                priority: 'low'
            });
            bestPractices.stateManagement.push('Use useReducer for complex state logic, Context API for global state');
        }
        // Check for accessibility in components
        if (!this.hasAccessibilityAttributes(content)) {
            score -= 10;
            suggestions.push({
                type: 'accessibility',
                message: 'Missing accessibility attributes (aria-label, role, etc.). Add for better a11y.',
                priority: 'high'
            });
            bestPractices.componentStructure.push('Add ARIA attributes and semantic HTML for accessibility');
        }
        // Check for error boundaries
        if (this.isContainerComponent(content) && !this.hasErrorBoundary(content)) {
            suggestions.push({
                type: 'error-handling',
                message: 'Container component should be wrapped in Error Boundary.',
                priority: 'medium'
            });
            bestPractices.componentStructure.push('Wrap container components in Error Boundaries');
        }
        // Check for suspense usage with lazy loading
        if (content.includes('React.lazy') && !content.includes('Suspense')) {
            score -= 8;
            suggestions.push({
                type: 'code-splitting',
                message: 'React.lazy used without Suspense. Wrap lazy components in <Suspense>.',
                priority: 'high'
            });
            bestPractices.performanceOptimizations.push('Always wrap lazy-loaded components in Suspense');
        }
        // Check for TanStack Query best practices
        if (this.usesTanStackQuery(content)) {
            if (!this.hasProperQueryKeys(content)) {
                score -= 5;
                suggestions.push({
                    type: 'data-fetching',
                    message: 'TanStack Query keys not properly structured. Use array keys with hierarchy.',
                    priority: 'low'
                });
                bestPractices.stateManagement.push('Use structured query keys: [\'resource\', id, filter]');
            }
        }
        // Check for proper loading/error states
        if (!this.hasLoadingErrorStates(content)) {
            score -= 5;
            suggestions.push({
                type: 'ux',
                message: 'Component missing loading/error states. Add for better UX.',
                priority: 'medium'
            });
            bestPractices.componentStructure.push('Always handle loading, error, and empty states');
        }
        // Check for test coverage indicators
        if (!this.hasTestFile(context.filePath)) {
            suggestions.push({
                type: 'testing',
                message: 'No test file found. Create .test.tsx file with React Testing Library.',
                priority: 'medium'
            });
            bestPractices.testingStrategies.push('Write tests using React Testing Library with user-centric queries');
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            bestPractices
        };
    }
    /**
     * Detect class components
     */
    hasClassComponents(content) {
        return content.includes('extends React.Component') || content.includes('extends Component');
    }
    /**
     * Detect conditional Hook calls
     */
    hasConditionalHooks(content) {
        const lines = content.split('\n');
        let inCondition = false;
        for (const line of lines) {
            if (line.trim().startsWith('if') || line.trim().startsWith('for') || line.trim().startsWith('while')) {
                inCondition = true;
            }
            if (inCondition && (line.includes('useState') || line.includes('useEffect') || line.includes('useCallback'))) {
                return true;
            }
            if (line.includes('}')) {
                inCondition = false;
            }
        }
        return false;
    }
    /**
     * Detect missing dependency arrays
     */
    hasMissingDependencies(content) {
        // Check for useEffect without second argument
        const useEffectWithoutDeps = /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\}\s*\)/g;
        return useEffectWithoutDeps.test(content);
    }
    /**
     * Detect unnecessary re-renders
     */
    hasUnnecessaryRerenders(content) {
        // Check for expensive computations without useMemo
        return content.includes('.map(') && !content.includes('useMemo') && !content.includes('React.memo');
    }
    /**
     * Detect inline objects in JSX
     */
    hasInlineObjectsInJSX(content) {
        // Look for inline object literals in JSX attributes
        return /(?:style|className)=\{\{/g.test(content) || /(?:style)=\{\s*\{/g.test(content);
    }
    /**
     * Check for proper prop types
     */
    hasProperPropTypes(content) {
        return content.includes('interface') && content.includes('Props') || content.includes('type') && content.includes('Props');
    }
    /**
     * Check for missing keys in lists
     */
    hasMissingKeys(content) {
        const hasMap = content.includes('.map(');
        const hasKey = content.includes('key=');
        return hasMap && !hasKey;
    }
    /**
     * Detect complex local state
     */
    hasComplexLocalState(content) {
        const stateCount = (content.match(/useState/g) || []).length;
        return stateCount > 5;
    }
    /**
     * Check for accessibility attributes
     */
    hasAccessibilityAttributes(content) {
        return content.includes('aria-') || content.includes('role=') || content.includes('alt=');
    }
    /**
     * Check if component is a container
     */
    isContainerComponent(content) {
        return content.includes('Provider') || content.includes('Layout') || content.includes('App');
    }
    /**
     * Check for error boundary
     */
    hasErrorBoundary(content) {
        return content.includes('ErrorBoundary') || content.includes('componentDidCatch');
    }
    /**
     * Check if using TanStack Query
     */
    usesTanStackQuery(content) {
        return content.includes('useQuery') || content.includes('useMutation') || content.includes('QueryClient');
    }
    /**
     * Check for proper query keys
     */
    hasProperQueryKeys(content) {
        // Query keys should be arrays
        return /queryKey:\s*\[/g.test(content);
    }
    /**
     * Check for loading/error states
     */
    hasLoadingErrorStates(content) {
        return (content.includes('isLoading') || content.includes('loading')) &&
            (content.includes('error') || content.includes('isError'));
    }
    /**
     * Check for test file
     */
    hasTestFile(filePath) {
        if (!filePath)
            return false;
        const testPath = filePath.replace(/\.(tsx?|jsx?)$/, '.test.$1');
        // In real implementation, check if file exists
        return false;
    }
    /**
     * Generate React-specific recommendations
     */
    generateReactRecommendations(content) {
        const recommendations = [];
        // Component patterns
        if (!content.includes('export default')) {
            recommendations.push('Export components as named exports for better tree-shaking');
        }
        // Performance
        if (content.includes('useState') && content.includes('.length > 100')) {
            recommendations.push('For large lists, use react-window or react-virtualized for virtual scrolling');
        }
        // Data fetching
        if (content.includes('fetch(') || content.includes('axios')) {
            recommendations.push('Consider TanStack Query for automatic caching, refetching, and state management');
        }
        // Styling
        if (content.includes('className') && !content.includes('tailwind') && !content.includes('styled')) {
            recommendations.push('Consider Tailwind CSS for utility-first styling or styled-components for CSS-in-JS');
        }
        // Forms
        if (content.includes('<form') && !content.includes('react-hook-form')) {
            recommendations.push('Use react-hook-form for performant form validation');
        }
        // Animation
        if (content.includes('transition') || content.includes('animation')) {
            recommendations.push('Consider Framer Motion for declarative animations');
        }
        return recommendations;
    }
    /**
     * Override RAG configuration for React domain
     */
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'frontend-react',
            maxExamples: 5
        };
    }
    /**
     * Detect React version from content
     */
    detectReactVersion(content) {
        if (content.includes('createRoot'))
            return 'React 18+';
        if (content.includes('ReactDOM.render'))
            return 'React 17 or earlier';
        if (content.includes('Suspense') && content.includes('Concurrent'))
            return 'React 18+ (Concurrent Mode)';
        return 'React (version unknown)';
    }
    /**
     * Detect state management solution
     */
    detectStateManagement(content) {
        if (content.includes('useContext') && content.includes('Provider'))
            return 'Context API';
        if (content.includes('zustand'))
            return 'Zustand';
        if (content.includes('jotai'))
            return 'Jotai';
        if (content.includes('redux'))
            return 'Redux Toolkit';
        if (content.includes('recoil'))
            return 'Recoil';
        return 'Local State (useState)';
    }
}
//# sourceMappingURL=james-react.js.map