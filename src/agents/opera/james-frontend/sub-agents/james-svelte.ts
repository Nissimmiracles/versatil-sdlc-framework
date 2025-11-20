/**
 * James-Svelte: Svelte 4/5 Frontend Specialist
 *
 * Language-specific sub-agent for Svelte 4/5 development.
 * Specializes in SvelteKit, stores, reactive patterns, and modern Svelte.
 *
 * Auto-activates on: Svelte components (*.svelte), SvelteKit routes, stores
 *
 * @module james-svelte
 * @version 6.6.0
 * @parent james-frontend
 */

import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';

export interface SvelteBestPractices {
  reactivePatterns: string[];
  storePatterns: string[];
  componentCommunication: string[];
  performanceOptimizations: string[];
  testingStrategies: string[];
}

export class JamesSvelte extends EnhancedJames {
  name = 'James-Svelte';
  id = 'james-svelte';
  specialization = 'Svelte 4/5 Frontend Specialist';
  systemPrompt = `You are James-Svelte, a specialized Svelte 4/5 expert with deep knowledge of:
- Svelte reactivity ($: reactive statements, stores)
- SvelteKit for full-stack applications
- Svelte stores (writable, readable, derived)
- Component lifecycle (onMount, onDestroy, beforeUpdate, afterUpdate)
- Actions and transitions
- Context API for dependency injection
- Svelte 5 runes ($state, $derived, $effect)
- TypeScript integration with Svelte
- Testing with Vitest and Testing Library`;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to add Svelte-specific validation
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // Run base James activation
    const response = await super.activate(context);

    // Add Svelte-specific analysis
    const svelteAnalysis = await this.analyzeSveltePatterns(context);

    // Enhance response with Svelte insights
    response.suggestions = response.suggestions || [];
    response.suggestions.push(...svelteAnalysis.suggestions);

    if (response.context) {
      response.context.svelteAnalysis = svelteAnalysis;
    }

    return response;
  }

  /**
   * Analyze Svelte-specific patterns
   */
  public async analyzeSveltePatterns(context: AgentActivationContext): Promise<{
    score: number;
    suggestions: Array<{ type: string; message: string; priority: string }>;
    bestPractices: SvelteBestPractices;
  }> {
    const content = context.content || '';
    const suggestions: Array<{ type: string; message: string; priority: string }> = [];
    const bestPractices: SvelteBestPractices = {
      reactivePatterns: [],
      storePatterns: [],
      componentCommunication: [],
      performanceOptimizations: [],
      testingStrategies: []
    };

    let score = 100;

    // Check for improper reactive statements
    if (this.hasImproperReactiveStatements(content)) {
      score -= 15;
      suggestions.push({
        type: 'reactivity',
        message: 'Reactive statement depends on itself or has circular dependency.',
        priority: 'high'
      });
      bestPractices.reactivePatterns.push('Avoid circular dependencies in reactive statements');
    }

    // Check for missing store subscription cleanup
    if (this.hasMissingStoreCleanup(content)) {
      score -= 20;
      suggestions.push({
        type: 'memory-leak',
        message: 'Store subscription without cleanup. Use auto-subscription $ prefix or unsubscribe.',
        priority: 'critical'
      });
      bestPractices.storePatterns.push('Use $store auto-subscription or manually unsubscribe in onDestroy');
    }

    // Check for direct store mutation
    if (this.hasDirectStoreMutation(content)) {
      score -= 15;
      suggestions.push({
        type: 'store-usage',
        message: 'Direct store mutation detected. Use store.set() or store.update() methods.',
        priority: 'high'
      });
      bestPractices.storePatterns.push('Never mutate stores directly, use set/update methods');
    }

    // Check for missing key in each blocks
    if (this.hasMissingEachKeys(content)) {
      score -= 15;
      suggestions.push({
        type: 'rendering',
        message: '{#each} block without key. Add (item.id) for better performance.',
        priority: 'high'
      });
      bestPractices.reactivePatterns.push('Always provide keys in {#each} blocks');
    }

    // Check for Svelte 5 runes in Svelte 4 project
    if (this.usesSvelte5Runes(content) && !this.isSvelte5(content)) {
      score -= 20;
      suggestions.push({
        type: 'version-mismatch',
        message: 'Using Svelte 5 runes in Svelte 4 project. Upgrade to Svelte 5 or use Svelte 4 syntax.',
        priority: 'critical'
      });
      bestPractices.reactivePatterns.push('Use correct syntax for your Svelte version');
    }

    // Check for missing TypeScript
    if (!this.checkTypeScript(content)) {
      score -= 5;
      suggestions.push({
        type: 'type-safety',
        message: 'Component not using TypeScript. Add lang="ts" to <script> tag.',
        priority: 'low'
      });
      bestPractices.componentCommunication.push('Use TypeScript for better type safety');
    }

    // Check for improper component communication
    if (this.hasImproperPropBinding(content)) {
      score -= 10;
      suggestions.push({
        type: 'props',
        message: 'Missing export keyword for component props. Add export let prop.',
        priority: 'medium'
      });
      bestPractices.componentCommunication.push('Export all component props with export let');
    }

    // Check for unused reactive statements
    if (this.hasUnusedReactiveStatements(content)) {
      score -= 5;
      suggestions.push({
        type: 'code-quality',
        message: 'Reactive statement with unused dependencies. Remove or fix.',
        priority: 'low'
      });
      bestPractices.reactivePatterns.push('Ensure all reactive statement dependencies are used');
    }

    // Check for SvelteKit load function patterns
    if (this.isSvelteKitRoute(content)) {
      if (!this.hasProperLoadFunction(content)) {
        score -= 10;
        suggestions.push({
          type: 'sveltekit',
          message: 'Route missing load function. Add +page.ts/+page.server.ts for data loading.',
          priority: 'medium'
        });
        bestPractices.reactivePatterns.push('Use load functions for data fetching in SvelteKit');
      }
    }

    // Check for actions usage
    if (this.hasFormHandling(content) && !this.usesActions(content)) {
      suggestions.push({
        type: 'form-handling',
        message: 'Form handling could use actions. Add use:action directive.',
        priority: 'low'
      });
      bestPractices.componentCommunication.push('Use actions for reusable DOM manipulation');
    }

    // Check for transitions
    if (this.hasConditionalRendering(content) && !this.usesTransitions(content)) {
      suggestions.push({
        type: 'ux',
        message: 'Conditional rendering without transitions. Add transition:fade or similar.',
        priority: 'low'
      });
      bestPractices.performanceOptimizations.push('Use transitions for smooth UI changes');
    }

    // Check for context API usage
    if (this.hasDeepPropDrilling(content)) {
      score -= 8;
      suggestions.push({
        type: 'component-architecture',
        message: 'Deep prop drilling detected. Use context API with setContext/getContext.',
        priority: 'medium'
      });
      bestPractices.componentCommunication.push('Use context API to avoid prop drilling');
    }

    // Check for proper store derivation
    if (this.hasDerivedStores(content) && !this.usesProperDerived(content)) {
      score -= 10;
      suggestions.push({
        type: 'store-patterns',
        message: 'Computed store values not using derived(). Use derived() for reactive computations.',
        priority: 'medium'
      });
      bestPractices.storePatterns.push('Use derived() stores for computed values');
    }

    // Check for two-way binding misuse
    if (this.hasTwoWayBinding(content) && this.hasComplexTwoWayBinding(content)) {
      score -= 5;
      suggestions.push({
        type: 'binding',
        message: 'Complex two-way binding detected. Consider one-way data flow with events.',
        priority: 'low'
      });
      bestPractices.componentCommunication.push('Prefer one-way data flow for complex state');
    }

    // Check for accessibility
    if (!this.hasAccessibilityAttributes(content)) {
      score -= 10;
      suggestions.push({
        type: 'accessibility',
        message: 'Missing accessibility attributes. Add aria-* attributes.',
        priority: 'high'
      });
      bestPractices.componentCommunication.push('Add ARIA attributes for accessibility');
    }

    // Check for SSR considerations
    if (this.usesBrowserAPIs(content) && !this.hasSSRGuards(content)) {
      score -= 10;
      suggestions.push({
        type: 'ssr',
        message: 'Browser APIs used without SSR guards. Wrap in onMount or check for browser environment.',
        priority: 'medium'
      });
      bestPractices.performanceOptimizations.push('Guard browser-specific code with onMount or typeof window checks');
    }

    // Check for test coverage
    if (!this.hasTestFile(context.filePath)) {
      suggestions.push({
        type: 'testing',
        message: 'No test file found. Create .test.ts file with Vitest.',
        priority: 'medium'
      });
      bestPractices.testingStrategies.push('Write tests using Vitest and Svelte Testing Library');
    }

    return {
      score: Math.max(score, 0),
      suggestions,
      bestPractices
    };
  }

  // Svelte 5 Runes Detection Methods
  public hasStateRune(content: string): boolean {
    return /\$state\s*\(/.test(content);
  }

  public hasDerivedRune(content: string): boolean {
    return /\$derived\s*\(/.test(content);
  }

  public hasEffectRune(content: string): boolean {
    return /\$effect\s*\(/.test(content);
  }

  public hasPropsRune(content: string): boolean {
    return /\$props\s*\(/.test(content);
  }

  // Legacy Reactivity Detection
  public hasReactiveDeclaration(content: string): boolean {
    return /\$:\s*\w+\s*=/.test(content);
  }

  public hasReactiveStatement(content: string): boolean {
    return /\$:\s+/.test(content) && !/:=/.test(content);
  }

  public hasReactiveBlock(content: string): boolean {
    return /\$:\s*\{/.test(content);
  }

  // Component Patterns
  public hasScript(content: string): boolean {
    return /<script/.test(content);
  }

  public hasTypeScript(content: string): boolean {
    return this.checkTypeScript(content);
  }

  private checkTypeScript(content: string): boolean {
    return /<script\s+lang=["']ts["']/.test(content);
  }

  public hasEventHandler(content: string): boolean {
    return /on:\w+/.test(content);
  }

  public hasEventDispatcher(content: string): boolean {
    return /createEventDispatcher/.test(content);
  }

  // Store Patterns
  public hasWritableStore(content: string): boolean {
    return /writable\s*\(/.test(content);
  }

  public hasReadableStore(content: string): boolean {
    return /readable\s*\(/.test(content);
  }

  public hasDerivedStore(content: string): boolean {
    return /derived\s*\(/.test(content);
  }

  public hasStoreSubscription(content: string): boolean {
    return /\.subscribe\s*\(/.test(content);
  }

  // SvelteKit Routing
  public isPageFile(filePath: string): boolean {
    return /\+page\.svelte$/.test(filePath);
  }

  public isLayoutFile(filePath: string): boolean {
    return /\+layout\.svelte$/.test(filePath);
  }

  public isServerFile(filePath: string): boolean {
    return /\+page\.server\.(ts|js)$/.test(filePath) || /\+layout\.server\.(ts|js)$/.test(filePath);
  }

  public hasLoadFunction(content: string): boolean {
    return /export\s+(async\s+)?function\s+load/.test(content) || /export\s+const\s+load/.test(content);
  }

  public hasFormAction(content: string): boolean {
    return /export\s+const\s+actions/.test(content);
  }

  // Template Syntax
  public hasIfBlock(content: string): boolean {
    return /\{#if\s/.test(content);
  }

  public hasEachBlock(content: string): boolean {
    return /\{#each\s/.test(content);
  }

  public hasAwaitBlock(content: string): boolean {
    return /\{#await\s/.test(content);
  }

  public hasKeyBlock(content: string): boolean {
    return /\{#key\s/.test(content);
  }

  public hasMissingKeyedEach(content: string): boolean {
    const hasEach = this.hasEachBlock(content);
    const hasKey = /\{#each\s+[^}]+\([^)]+\)/.test(content);
    return hasEach && !hasKey;
  }

  // Lifecycle and Special Elements
  public hasOnMount(content: string): boolean {
    return /onMount\s*\(/.test(content);
  }

  public hasOnDestroy(content: string): boolean {
    return /onDestroy\s*\(/.test(content);
  }

  public hasBeforeUpdate(content: string): boolean {
    return /beforeUpdate\s*\(/.test(content);
  }

  public hasAfterUpdate(content: string): boolean {
    return /afterUpdate\s*\(/.test(content);
  }

  public hasSvelteWindow(content: string): boolean {
    return /<svelte:window/.test(content);
  }

  public hasSvelteComponent(content: string): boolean {
    return /<svelte:component/.test(content);
  }

  // Performance
  public hasImmutable(content: string): boolean {
    return /<svelte:options\s+immutable/.test(content);
  }

  /**
   * Check for improper reactive statements
   */
  private hasImproperReactiveStatements(content: string): boolean {
    // Check for reactive statement that depends on itself
    const reactiveStatements = content.match(/\$:\s*(\w+)\s*=.*\1/g);
    return reactiveStatements !== null && reactiveStatements.length > 0;
  }

  /**
   * Check for missing store cleanup
   */
  private hasMissingStoreCleanup(content: string): boolean {
    const hasSubscribe = content.includes('.subscribe(');
    const hasUnsubscribe = content.includes('unsubscribe()') || content.includes('$store');
    return hasSubscribe && !hasUnsubscribe;
  }

  /**
   * Check for direct store mutation
   */
  private hasDirectStoreMutation(content: string): boolean {
    // Look for patterns like: store.value = x instead of store.set(x)
    return /\$\w+\.\w+\s*=/.test(content) && !content.includes('.set(') && !content.includes('.update(');
  }

  /**
   * Check for missing each keys
   */
  private hasMissingEachKeys(content: string): boolean {
    const hasEach = /\{#each/.test(content);
    const hasKey = /\((\w+)\)/.test(content);
    return hasEach && !hasKey;
  }

  /**
   * Check for Svelte 5 runes
   */
  private usesSvelte5Runes(content: string): boolean {
    return content.includes('$state') || content.includes('$derived') || content.includes('$effect');
  }


  /**
   * Check for improper prop binding
   */
  private hasImproperPropBinding(content: string): boolean {
    // Check for let variables that look like props but aren't exported
    return /let\s+(\w+)\s*;/.test(content) && !content.includes('export let');
  }

  /**
   * Check for unused reactive statements
   */
  private hasUnusedReactiveStatements(content: string): boolean {
    // Heuristic: reactive statement with no references to the variable
    const reactiveVars = content.match(/\$:\s*(\w+)\s*=/g);
    if (!reactiveVars) return false;

    return reactiveVars.some(stmt => {
      const varName = stmt.match(/\$:\s*(\w+)\s*=/)?.[1];
      if (!varName) return false;
      const regex = new RegExp(`\\b${varName}\\b`, 'g');
      const matches = content.match(regex);
      return matches && matches.length <= 1; // Only appears in declaration
    });
  }

  /**
   * Check if SvelteKit route
   */
  private isSvelteKitRoute(content: string): boolean {
    return content.includes('+page.svelte') || content.includes('+layout.svelte');
  }

  /**
   * Check for proper load function
   */
  private hasProperLoadFunction(content: string): boolean {
    return content.includes('export const load') || content.includes('export async function load');
  }

  /**
   * Check for form handling
   */
  private hasFormHandling(content: string): boolean {
    return content.includes('<form') || content.includes('on:submit');
  }

  /**
   * Check for actions usage
   */
  private usesActions(content: string): boolean {
    return content.includes('use:');
  }

  /**
   * Check for conditional rendering
   */
  private hasConditionalRendering(content: string): boolean {
    return content.includes('{#if') || content.includes('{:else');
  }

  /**
   * Check for transitions
   */
  private usesTransitions(content: string): boolean {
    return content.includes('transition:') || content.includes('in:') || content.includes('out:');
  }

  /**
   * Check for deep prop drilling
   */
  private hasDeepPropDrilling(content: string): boolean {
    const exportLets = (content.match(/export let/g) || []).length;
    return exportLets > 5;
  }

  /**
   * Check for derived stores
   */
  private hasDerivedStores(content: string): boolean {
    return content.includes('$:') && content.includes('$store');
  }

  /**
   * Check for proper derived usage
   */
  private usesProperDerived(content: string): boolean {
    return content.includes('derived(');
  }

  /**
   * Check for two-way binding
   */
  private hasTwoWayBinding(content: string): boolean {
    return content.includes('bind:');
  }

  /**
   * Check for complex two-way binding
   */
  private hasComplexTwoWayBinding(content: string): boolean {
    return content.includes('bind:') && content.includes('$:') && content.includes('=');
  }

  /**
   * Check for accessibility attributes
   */
  private hasAccessibilityAttributes(content: string): boolean {
    return content.includes('aria-') || content.includes('role=') || content.includes('alt=');
  }

  /**
   * Check for browser API usage
   */
  private usesBrowserAPIs(content: string): boolean {
    return content.includes('window.') || content.includes('document.') || content.includes('localStorage');
  }

  /**
   * Check for SSR guards
   */
  private hasSSRGuards(content: string): boolean {
    return content.includes('onMount') || content.includes('typeof window');
  }

  /**
   * Check for test file
   */
  private hasTestFile(filePath?: string): boolean {
    if (!filePath) return false;
    const testPath = filePath.replace(/\.svelte$/, '.test.ts');
    return false; // In real implementation, check if file exists
  }

  /**
   * Generate Svelte-specific recommendations
   */
  generateSvelteRecommendations(content: string): string[] {
    const recommendations: string[] = [];

    // Svelte 5
    if (!content.includes('$state')) {
      recommendations.push('Consider upgrading to Svelte 5 for runes and improved reactivity');
    }

    // SvelteKit
    if (!content.includes('SvelteKit')) {
      recommendations.push('Use SvelteKit for full-stack Svelte applications with SSR/SSG');
    }

    // Stores
    if (content.includes('writable') && !content.includes('derived')) {
      recommendations.push('Use derived() for computed store values to prevent unnecessary updates');
    }

    // Performance
    if (!content.includes('svelte:window')) {
      recommendations.push('Use svelte:window for window event listeners to auto-cleanup');
    }

    return recommendations;
  }

  /**
   * Override RAG configuration for Svelte domain
   */
  protected getDefaultRAGConfig() {
    return {
      ...super.getDefaultRAGConfig(),
      agentDomain: 'frontend-svelte',
      maxExamples: 5
    };
  }

  /**
   * Detect Svelte version
   */
  detectSvelteVersion(content: string): string {
    return this.checkSvelteVersion(content);
  }

  private checkSvelteVersion(content: string): string {
    if (content.includes('$state') || content.includes('$derived')) return 'Svelte 5 (Runes)';
    if (content.includes('SvelteKit')) return 'Svelte 4 (SvelteKit)';
    if (content.includes('$:')) return 'Svelte 4';
    return 'Svelte (version unknown)';
  }

  /**
   * Detect state management solution
   */
  detectStateManagement(content: string): string {
    if (content.includes('$state')) return 'Svelte 5 Runes';
    if (content.includes('writable') || content.includes('readable')) return 'Svelte Stores';
    if (content.includes('context')) return 'Context API';
    return 'Component State';
  }

  private isSvelte5(content: string): boolean {
    // Check for Svelte 5 runes ($state, $derived, $effect, $props)
    return content.includes('svelte@5') ||
           /\$state\(|\$derived\(|\$effect\(|\$props\(/.test(content);
  }
}
