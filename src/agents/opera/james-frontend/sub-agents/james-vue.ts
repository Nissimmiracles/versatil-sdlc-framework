/**
 * James-Vue: Vue 3 Frontend Specialist
 *
 * Language-specific sub-agent for Vue 3 development.
 * Specializes in Composition API, Pinia, VeeValidate, and modern Vue patterns.
 *
 * Auto-activates on: Vue components (*.vue), Composition API patterns, Vue directives
 *
 * @module james-vue
 * @version 6.6.0
 * @parent james-frontend
 */

import { EnhancedJames } from '../enhanced-james.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';

export interface VueBestPractices {
  compositionAPIPatterns: string[];
  reactivityPatterns: string[];
  componentCommunication: string[];
  performanceOptimizations: string[];
  testingStrategies: string[];
}

export class JamesVue extends EnhancedJames {
  name = 'James-Vue';
  id = 'james-vue';
  specialization = 'Vue 3 Frontend Specialist';
  systemPrompt = `You are James-Vue, a specialized Vue 3 frontend expert with deep knowledge of:
- Vue 3 Composition API (setup, ref, reactive, computed, watch)
- Reactivity system (ref, reactive, toRefs, unref)
- Component lifecycle (onMounted, onUnmounted, watchEffect)
- Pinia for state management
- VeeValidate for form validation
- Vue Router for navigation
- Teleport, Suspense, and advanced features
- TypeScript integration with Vue
- Testing with Vitest and Vue Test Utils`;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to add Vue-specific validation
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // Run base James activation
    const response = await super.activate(context);

    // Add Vue-specific analysis
    const vueAnalysis = await this.analyzeVuePatterns(context);

    // Enhance response with Vue insights
    response.suggestions = response.suggestions || [];
    response.suggestions.push(...vueAnalysis.suggestions);

    if (response.context) {
      response.context.vueAnalysis = vueAnalysis;
    }

    return response;
  }

  /**
   * Analyze Vue-specific patterns
   */
  public async analyzeVuePatterns(context: AgentActivationContext): Promise<{
    score: number;
    suggestions: Array<{ type: string; message: string; priority: string }>;
    bestPractices: VueBestPractices;
    recommendations?: string[];
  }> {
    return this.internalAnalyzeVuePatterns(context);
  }

  private async internalAnalyzeVuePatterns(context: AgentActivationContext): Promise<{
    score: number;
    suggestions: Array<{ type: string; message: string; priority: string }>;
    bestPractices: VueBestPractices;
  }> {
    const content = context.content || '';
    const suggestions: Array<{ type: string; message: string; priority: string }> = [];
    const bestPractices: VueBestPractices = {
      compositionAPIPatterns: [],
      reactivityPatterns: [],
      componentCommunication: [],
      performanceOptimizations: [],
      testingStrategies: []
    };

    let score = 100;

    // Check for Options API (anti-pattern in Vue 3)
    if (this.usesOptionsAPI(content)) {
      score -= 15;
      suggestions.push({
        type: 'api-migration',
        message: 'Options API detected. Migrate to Composition API for better TypeScript support and reusability.',
        priority: 'medium'
      });
      bestPractices.compositionAPIPatterns.push('Use Composition API instead of Options API in Vue 3');
    }

    // Check for improper reactivity
    if (this.hasReactivityIssues(content)) {
      score -= 20;
      suggestions.push({
        type: 'reactivity',
        message: 'Potential reactivity loss detected. Use ref() for primitives, reactive() for objects.',
        priority: 'high'
      });
      bestPractices.reactivityPatterns.push('Always wrap reactive data in ref() or reactive()');
    }

    // Check for missing watch cleanup
    if (this.hasMissingWatchCleanup(content)) {
      score -= 15;
      suggestions.push({
        type: 'lifecycle',
        message: 'watch() or watchEffect() without cleanup. Store return value and call on unmount.',
        priority: 'high'
      });
      bestPractices.compositionAPIPatterns.push('Always cleanup watchers using returned function');
    }

    // Check for v-for without key
    if (this.hasMissingVForKeys(content)) {
      score -= 15;
      suggestions.push({
        type: 'vue-directives',
        message: 'v-for without :key binding. Add unique key for each item.',
        priority: 'high'
      });
      bestPractices.componentCommunication.push('Always provide :key with v-for directives');
    }

    // Check for ref unwrapping issues
    if (this.hasRefUnwrappingIssues(content)) {
      score -= 10;
      suggestions.push({
        type: 'reactivity',
        message: 'Accessing ref without .value. Use .value to access ref values in <script>.',
        priority: 'medium'
      });
      bestPractices.reactivityPatterns.push('Access ref values with .value in script, auto-unwrapped in template');
    }

    // Check for proper TypeScript usage
    if (!this.hasProperTypeScript(content)) {
      score -= 5;
      suggestions.push({
        type: 'type-safety',
        message: 'Component props not properly typed. Use defineProps with TypeScript interface.',
        priority: 'medium'
      });
      bestPractices.compositionAPIPatterns.push('Use defineProps<Props>() for type-safe props');
    }

    // Check for script setup usage
    if (!this.usesScriptSetup(content)) {
      score -= 5;
      suggestions.push({
        type: 'syntax-sugar',
        message: 'Not using <script setup>. Consider using for less boilerplate.',
        priority: 'low'
      });
      bestPractices.compositionAPIPatterns.push('Use <script setup> for cleaner component syntax');
    }

    // Check for computed vs methods
    if (this.hasComputedAsMethods(content)) {
      score -= 10;
      suggestions.push({
        type: 'performance',
        message: 'Expensive calculations in methods. Use computed() for cached calculations.',
        priority: 'medium'
      });
      bestPractices.performanceOptimizations.push('Use computed() for derived state, methods for actions');
    }

    // Check for Pinia best practices
    if (this.usesPinia(content)) {
      if (!this.hasProperStoreUsage(content)) {
        score -= 5;
        suggestions.push({
          type: 'state-management',
          message: 'Pinia store not properly destructured. Use storeToRefs() for reactive props.',
          priority: 'low'
        });
        bestPractices.reactivityPatterns.push('Use storeToRefs() when destructuring Pinia stores');
      }
    }

    // Check for teleport usage
    if (this.hasModalOrOverlay(content) && !content.includes('Teleport')) {
      suggestions.push({
        type: 'component-structure',
        message: 'Modal/overlay component should use Teleport to render outside parent DOM.',
        priority: 'low'
      });
      bestPractices.componentCommunication.push('Use Teleport for modals, tooltips, and overlays');
    }

    // Check for suspense with async setup
    if (content.includes('async setup') && !content.includes('Suspense')) {
      score -= 8;
      suggestions.push({
        type: 'async-components',
        message: 'Async setup without Suspense. Wrap component with <Suspense>.',
        priority: 'high'
      });
      bestPractices.compositionAPIPatterns.push('Wrap async setup components in Suspense');
    }

    // Check for proper emit usage
    if (this.hasImproperEmits(content)) {
      score -= 5;
      suggestions.push({
        type: 'component-communication',
        message: 'Component emits not declared. Use defineEmits for type-safe events.',
        priority: 'medium'
      });
      bestPractices.componentCommunication.push('Declare emits using defineEmits for type safety');
    }

    // Check for v-model modifiers
    if (content.includes('v-model') && this.hasCustomVModel(content)) {
      if (!this.usesVModelModifiers(content)) {
        suggestions.push({
          type: 'component-communication',
          message: 'Custom v-model should support modifiers (lazy, number, trim).',
          priority: 'low'
        });
        bestPractices.componentCommunication.push('Support v-model modifiers in custom inputs');
      }
    }

    // Check for provide/inject best practices
    if (this.usesProvideInject(content)) {
      if (!this.hasInjectionKeys(content)) {
        score -= 5;
        suggestions.push({
          type: 'dependency-injection',
          message: 'provide/inject without InjectionKey. Use typed injection keys for type safety.',
          priority: 'medium'
        });
        bestPractices.componentCommunication.push('Use InjectionKey for type-safe provide/inject');
      }
    }

    // Check for accessibility
    if (!this.hasAccessibilityAttributes(content)) {
      score -= 10;
      suggestions.push({
        type: 'accessibility',
        message: 'Missing accessibility attributes. Add aria-* and role attributes.',
        priority: 'high'
      });
      bestPractices.componentCommunication.push('Always include accessibility attributes');
    }

    // Check for test coverage
    if (!this.hasTestFile(context.filePath)) {
      suggestions.push({
        type: 'testing',
        message: 'No test file found. Create .spec.ts file with Vue Test Utils.',
        priority: 'medium'
      });
      bestPractices.testingStrategies.push('Write tests using Vue Test Utils and Vitest');
    }

    return {
      score: Math.max(score, 0),
      suggestions,
      bestPractices
    };
  }

  // API Pattern Detection Methods
  public hasOptionsAPI(content: string): boolean {
    return this.usesOptionsAPI(content);
  }

  public hasCompositionAPI(content: string): boolean {
    return /setup\s*\(/.test(content) || /<script\s+setup/.test(content);
  }

  public hasScriptSetup(content: string): boolean {
    return this.usesScriptSetup(content);
  }

  // Reactivity System Methods
  public hasRefUsage(content: string): boolean {
    return /ref\s*\(/.test(content);
  }

  public hasReactiveUsage(content: string): boolean {
    return /reactive\s*\(/.test(content);
  }

  public hasComputedUsage(content: string): boolean {
    return /computed\s*\(/.test(content);
  }

  public hasMissingValueAccess(content: string): boolean {
    const hasRef = this.hasRefUsage(content);
    const scriptSection = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptSection && hasRef) {
      const script = scriptSection[1];
      return /const\s+\w+\s*=\s*ref\(/.test(script) && !script.includes('.value');
    }
    return false;
  }

  public hasReactiveDestructuring(content: string): boolean {
    return /const\s*\{[^}]+\}\s*=\s*reactive\s*\(/.test(content);
  }

  // Lifecycle Hooks
  public hasLifecycleHook(content: string, hookName: string): boolean {
    return new RegExp(`${hookName}\\s*\\(`).test(content);
  }

  public hasWatchEffect(content: string): boolean {
    return /watchEffect\s*\(/.test(content);
  }

  public hasWatch(content: string): boolean {
    return /watch\s*\(/.test(content);
  }

  // Component Best Practices
  public hasDefineProps(content: string): boolean {
    return /defineProps/.test(content);
  }

  public hasDefineEmits(content: string): boolean {
    return /defineEmits/.test(content);
  }

  public hasMissingVForKey(content: string): boolean {
    return this.hasMissingVForKeys(content);
  }

  // Composables
  public hasComposableUsage(content: string): boolean {
    return /use[A-Z]\w+\s*\(/.test(content);
  }

  public hasProperComposableNaming(content: string): boolean {
    return /function\s+use[A-Z]\w+/.test(content);
  }

  // Template Patterns
  public hasVIf(content: string): boolean {
    return /v-if/.test(content);
  }

  public hasVModel(content: string): boolean {
    return /v-model/.test(content);
  }

  public hasSlot(content: string): boolean {
    return /<slot/.test(content);
  }

  public hasScopedSlot(content: string): boolean {
    return /<slot\s+[^>]*:[\w]+/.test(content) || /#[\w]+="/.test(content);
  }

  // Performance
  public hasUnnecessaryReactive(content: string): boolean {
    return /reactive\s*\(\s*\{[^}]*API_URL|CONFIG|CONST/.test(content);
  }

  /**
   * Detect Options API usage
   */
  private usesOptionsAPI(content: string): boolean {
    return content.includes('export default {') &&
           (content.includes('data()') || content.includes('methods:') || content.includes('computed:'));
  }

  /**
   * Detect reactivity issues
   */
  private hasReactivityIssues(content: string): boolean {
    // Check for direct object assignment without reactive/ref
    return /const\s+\w+\s*=\s*\{/.test(content) && !content.includes('reactive(') && !content.includes('ref(');
  }

  /**
   * Check for missing watch cleanup
   */
  private hasMissingWatchCleanup(content: string): boolean {
    const hasWatch = content.includes('watch(') || content.includes('watchEffect(');
    const hasCleanup = content.includes('onBeforeUnmount') || content.includes('onUnmounted');
    return hasWatch && !hasCleanup;
  }

  /**
   * Check for missing v-for keys
   */
  private hasMissingVForKeys(content: string): boolean {
    const hasVFor = /v-for=/.test(content);
    const hasKey = /:key=/.test(content);
    return hasVFor && !hasKey;
  }

  /**
   * Check for ref unwrapping issues
   */
  private hasRefUnwrappingIssues(content: string): boolean {
    // Look for ref access without .value in <script>
    const scriptSection = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptSection) {
      const script = scriptSection[1];
      return /const\s+\w+\s*=\s*ref\(/.test(script) && !script.includes('.value');
    }
    return false;
  }

  /**
   * Check for proper TypeScript usage
   */
  private hasProperTypeScript(content: string): boolean {
    return content.includes('defineProps<') && content.includes('interface');
  }

  /**
   * Check if using script setup
   */
  private usesScriptSetup(content: string): boolean {
    return content.includes('<script setup');
  }

  /**
   * Check for computed used as methods
   */
  private hasComputedAsMethods(content: string): boolean {
    // This is a heuristic - real implementation would need AST analysis
    return content.includes('const ') && content.includes('() =>') && !content.includes('computed(');
  }

  /**
   * Check if using Pinia
   */
  private usesPinia(content: string): boolean {
    return content.includes('usePinia') || content.includes('defineStore') || content.includes('useStore');
  }

  /**
   * Check for proper store usage
   */
  private hasProperStoreUsage(content: string): boolean {
    return content.includes('storeToRefs');
  }

  /**
   * Check for modal/overlay components
   */
  private hasModalOrOverlay(content: string): boolean {
    return content.includes('Modal') || content.includes('Dialog') || content.includes('Tooltip');
  }

  /**
   * Check for improper emits
   */
  private hasImproperEmits(content: string): boolean {
    return content.includes('$emit') && !content.includes('defineEmits');
  }

  /**
   * Check for custom v-model
   */
  private hasCustomVModel(content: string): boolean {
    return content.includes('modelValue') || content.includes('update:modelValue');
  }

  /**
   * Check for v-model modifiers
   */
  private usesVModelModifiers(content: string): boolean {
    return content.includes('modelModifiers');
  }

  /**
   * Check for provide/inject usage
   */
  private usesProvideInject(content: string): boolean {
    return content.includes('provide(') || content.includes('inject(');
  }

  /**
   * Check for injection keys
   */
  private hasInjectionKeys(content: string): boolean {
    return content.includes('InjectionKey');
  }

  /**
   * Check for accessibility attributes
   */
  private hasAccessibilityAttributes(content: string): boolean {
    return content.includes('aria-') || content.includes('role=') || content.includes('alt=');
  }

  /**
   * Check for test file
   */
  private hasTestFile(filePath?: string): boolean {
    if (!filePath) return false;
    const testPath = filePath.replace(/\.vue$/, '.spec.ts');
    return false; // In real implementation, check if file exists
  }

  /**
   * Generate Vue-specific recommendations
   */
  generateVueRecommendations(content: string): string[] {
    const recommendations: string[] = [];

    // Composition API
    if (!content.includes('composables')) {
      recommendations.push('Extract reusable logic into composables for better code organization');
    }

    // State management
    if (content.includes('reactive(') && content.includes('toRefs')) {
      recommendations.push('Use Pinia for complex state management across components');
    }

    // Routing
    if (content.includes('router.push') && !content.includes('useRouter')) {
      recommendations.push('Use useRouter() composable instead of this.$router');
    }

    // Forms
    if (content.includes('<form') && !content.includes('VeeValidate')) {
      recommendations.push('Use VeeValidate for form validation with Yup or Zod schemas');
    }

    // Styling
    if (!content.includes('<style scoped>')) {
      recommendations.push('Use scoped styles to prevent CSS leakage');
    }

    return recommendations;
  }

  /**
   * Override RAG configuration for Vue domain
   */
  protected getDefaultRAGConfig() {
    return {
      ...super.getDefaultRAGConfig(),
      agentDomain: 'frontend-vue',
      maxExamples: 5
    };
  }

  /**
   * Detect Vue version
   */
  detectVueVersion(content: string): string {
    if (content.includes('createApp')) return 'Vue 3';
    if (content.includes('new Vue')) return 'Vue 2';
    if (content.includes('Composition API') || content.includes('setup()')) return 'Vue 3 (Composition API)';
    return 'Vue (version unknown)';
  }

  /**
   * Detect state management solution
   */
  detectStateManagement(content: string): string {
    if (content.includes('pinia')) return 'Pinia';
    if (content.includes('vuex')) return 'Vuex';
    if (content.includes('provide') && content.includes('inject')) return 'Provide/Inject';
    return 'Local State (ref/reactive)';
  }
}
