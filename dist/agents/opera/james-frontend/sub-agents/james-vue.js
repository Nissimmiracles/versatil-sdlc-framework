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
export class JamesVue extends EnhancedJames {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'James-Vue';
        this.id = 'james-vue';
        this.specialization = 'Vue 3 Frontend Specialist';
        this.systemPrompt = `You are James-Vue, a specialized Vue 3 frontend expert with deep knowledge of:
- Vue 3 Composition API (setup, ref, reactive, computed, watch)
- reactivity system (ref, reactive, toRefs, unref)
- Component lifecycle (onMounted, onUnmounted, watchEffect)
- Pinia for state management
- VeeValidate for form validation
- Vue Router for navigation
- Teleport, Suspense, and advanced features
- TypeScript integration with Vue
- Testing with Vitest and Vue Test Utils`;
    }
    /**
     * Override activate to add Vue-specific validation
     */
    async activate(context) {
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
    async analyzeVuePatterns(context) {
        return this.internalAnalyzeVuePatterns(context);
    }
    async internalAnalyzeVuePatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        const bestPractices = {
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
        // Generate recommendations based on best practices
        const recommendations = [];
        if (bestPractices.compositionAPIPatterns.length > 0) {
            recommendations.push(...bestPractices.compositionAPIPatterns);
        }
        if (bestPractices.reactivityPatterns.length > 0) {
            recommendations.push(...bestPractices.reactivityPatterns);
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            bestPractices,
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }
    // API Pattern Detection Methods
    hasOptionsAPI(content) {
        return this.usesOptionsAPI(content);
    }
    hasCompositionAPI(content) {
        return /setup\s*\(/.test(content) || /<script\s+setup/.test(content);
    }
    hasScriptSetup(content) {
        return this.usesScriptSetup(content);
    }
    // Reactivity System Methods
    hasRefUsage(content) {
        return /ref\s*\(/.test(content);
    }
    hasReactiveUsage(content) {
        return /reactive\s*\(/.test(content);
    }
    hasComputedUsage(content) {
        return /computed\s*\(/.test(content);
    }
    hasMissingValueAccess(content) {
        const hasRef = this.hasRefUsage(content);
        const scriptSection = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (scriptSection && hasRef) {
            const script = scriptSection[1];
            return /const\s+\w+\s*=\s*ref\(/.test(script) && !script.includes('.value');
        }
        return false;
    }
    hasReactiveDestructuring(content) {
        return /const\s*\{[^}]+\}\s*=\s*reactive\s*\(/.test(content);
    }
    // Lifecycle Hooks
    hasLifecycleHook(content, hookName) {
        return new RegExp(`${hookName}\\s*\\(`).test(content);
    }
    hasWatchEffect(content) {
        return /watchEffect\s*\(/.test(content);
    }
    hasWatch(content) {
        return /watch\s*\(/.test(content);
    }
    // Component Best Practices
    hasDefineProps(content) {
        return /defineProps/.test(content);
    }
    hasDefineEmits(content) {
        return /defineEmits/.test(content);
    }
    hasMissingVForKey(content) {
        return this.hasMissingVForKeys(content);
    }
    // Composables
    hasComposableUsage(content) {
        return /use[A-Z]\w+\s*\(/.test(content);
    }
    hasProperComposableNaming(content) {
        return /function\s+use[A-Z]\w+/.test(content);
    }
    // Template Patterns
    hasVIf(content) {
        return /v-if/.test(content);
    }
    hasVModel(content) {
        return /v-model/.test(content);
    }
    hasSlot(content) {
        return /<slot/.test(content);
    }
    hasScopedSlot(content) {
        return /<slot\s+[^>]*:[\w]+/.test(content) || /#[\w]+="/.test(content);
    }
    // Performance
    hasUnnecessaryReactive(content) {
        return /reactive\s*\(\s*\{[^}]*API_URL|CONFIG|CONST/.test(content);
    }
    /**
     * Detect Options API usage
     */
    usesOptionsAPI(content) {
        return content.includes('export default {') &&
            (content.includes('data()') || content.includes('methods:') || content.includes('computed:'));
    }
    /**
     * Detect reactivity issues
     */
    hasReactivityIssues(content) {
        // Check for direct object assignment without reactive/ref
        return /const\s+\w+\s*=\s*\{/.test(content) && !content.includes('reactive(') && !content.includes('ref(');
    }
    /**
     * Check for missing watch cleanup
     */
    hasMissingWatchCleanup(content) {
        const hasWatch = content.includes('watch(') || content.includes('watchEffect(');
        const hasCleanup = content.includes('onBeforeUnmount') || content.includes('onUnmounted');
        return hasWatch && !hasCleanup;
    }
    /**
     * Check for missing v-for keys
     */
    hasMissingVForKeys(content) {
        const hasVFor = /v-for=/.test(content);
        const hasKey = /:key=/.test(content);
        return hasVFor && !hasKey;
    }
    /**
     * Check for ref unwrapping issues
     */
    hasRefUnwrappingIssues(content) {
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
    hasProperTypeScript(content) {
        return content.includes('defineProps<') && content.includes('interface');
    }
    /**
     * Check if using script setup
     */
    usesScriptSetup(content) {
        return content.includes('<script setup');
    }
    /**
     * Check for computed used as methods
     */
    hasComputedAsMethods(content) {
        // This is a heuristic - real implementation would need AST analysis
        return content.includes('const ') && content.includes('() =>') && !content.includes('computed(');
    }
    /**
     * Check if using Pinia
     */
    usesPinia(content) {
        return content.includes('usePinia') || content.includes('defineStore') || content.includes('useStore');
    }
    /**
     * Check for proper store usage
     */
    hasProperStoreUsage(content) {
        return content.includes('storeToRefs');
    }
    /**
     * Check for modal/overlay components
     */
    hasModalOrOverlay(content) {
        return content.includes('Modal') || content.includes('Dialog') || content.includes('Tooltip');
    }
    /**
     * Check for improper emits
     */
    hasImproperEmits(content) {
        return content.includes('$emit') && !content.includes('defineEmits');
    }
    /**
     * Check for custom v-model
     */
    hasCustomVModel(content) {
        return content.includes('modelValue') || content.includes('update:modelValue');
    }
    /**
     * Check for v-model modifiers
     */
    usesVModelModifiers(content) {
        return content.includes('modelModifiers');
    }
    /**
     * Check for provide/inject usage
     */
    usesProvideInject(content) {
        return content.includes('provide(') || content.includes('inject(');
    }
    /**
     * Check for injection keys
     */
    hasInjectionKeys(content) {
        return content.includes('InjectionKey');
    }
    /**
     * Check for accessibility attributes
     */
    hasAccessibilityAttributes(content) {
        return content.includes('aria-') || content.includes('role=') || content.includes('alt=');
    }
    /**
     * Check for test file
     */
    hasTestFile(filePath) {
        if (!filePath)
            return false;
        const testPath = filePath.replace(/\.vue$/, '.spec.ts');
        return false; // In real implementation, check if file exists
    }
    /**
     * Generate Vue-specific recommendations
     */
    generateVueRecommendations(content) {
        const recommendations = [];
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
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'frontend-vue',
            maxExamples: 5
        };
    }
    /**
     * Detect Vue version
     */
    detectVueVersion(content) {
        if (content.includes('createApp'))
            return 'Vue 3';
        if (content.includes('new Vue'))
            return 'Vue 2';
        if (content.includes('Composition API') || content.includes('setup()'))
            return 'Vue 3 (Composition API)';
        return 'Vue (version unknown)';
    }
    /**
     * Detect state management solution
     */
    detectStateManagement(content) {
        if (content.includes('pinia'))
            return 'Pinia';
        if (content.includes('vuex'))
            return 'Vuex';
        if (content.includes('provide') && content.includes('inject'))
            return 'Provide/Inject';
        return 'Local State (ref/reactive)';
    }
}
//# sourceMappingURL=james-vue.js.map