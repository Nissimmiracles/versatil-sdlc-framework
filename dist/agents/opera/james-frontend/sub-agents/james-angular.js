/**
 * James-Angular: Angular 17+ Frontend Specialist
 *
 * Language-specific sub-agent for Angular 17+ development.
 * Specializes in Standalone Components, Signals, RxJS, and modern Angular patterns.
 *
 * Auto-activates on: Angular components (*.component.ts), services, modules, Angular templates
 *
 * @module james-angular
 * @version 6.6.0
 * @parent james-frontend
 */
import { EnhancedJames } from '../enhanced-james.js';
export class JamesAngular extends EnhancedJames {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'James-Angular';
        this.id = 'james-angular';
        this.specialization = 'Angular 17+ Frontend Specialist';
        this.systemPrompt = `You are James-Angular, a specialized Angular 17+ expert with deep knowledge of:
- Standalone Components (no NgModule required)
- Signals API for reactive state management
- RxJS for asynchronous operations
- Dependency Injection with inject() function
- OnPush Change Detection strategy
- Smart/Dumb component architecture
- Angular Router with guards and resolvers
- Angular Forms (Reactive Forms preferred)
- Testing with Jasmine/Karma and Cypress`;
    }
    /**
     * Override activate to add Angular-specific validation
     */
    async activate(context) {
        // Run base James activation
        const response = await super.activate(context);
        // Add Angular-specific analysis
        const angularAnalysis = await this.analyzeAngularPatterns(context);
        // Enhance response with Angular insights
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...angularAnalysis.suggestions);
        if (response.context) {
            response.context.angularAnalysis = angularAnalysis;
        }
        return response;
    }
    /**
     * Analyze Angular-specific patterns
     */
    async analyzeAngularPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
        const bestPractices = {
            componentPatterns: [],
            reactivePatterns: [],
            dependencyInjection: [],
            performanceOptimizations: [],
            testingStrategies: []
        };
        let score = 100;
        // Check for NgModule usage in Angular 17+
        if (this.usesNgModules(content)) {
            score -= 15;
            suggestions.push({
                type: 'architecture',
                message: 'Using NgModule in Angular 17+. Migrate to Standalone Components.',
                priority: 'medium'
            });
            bestPractices.componentPatterns.push('Use standalone: true for all components in Angular 14+');
        }
        // Check for default change detection
        if (this.hasDefaultChangeDetection(content)) {
            score -= 10;
            suggestions.push({
                type: 'performance',
                message: 'Using default change detection. Switch to OnPush for better performance.',
                priority: 'medium'
            });
            bestPractices.performanceOptimizations.push('Use OnPush change detection strategy');
        }
        // Check for constructor injection instead of inject()
        if (this.usesConstructorInjection(content)) {
            score -= 5;
            suggestions.push({
                type: 'dependency-injection',
                message: 'Using constructor injection. Consider inject() function for cleaner code.',
                priority: 'low'
            });
            bestPractices.dependencyInjection.push('Use inject() function instead of constructor injection');
        }
        // Check for missing Signals usage
        if (this.shouldUseSignals(content) && !this.usesSignals(content)) {
            score -= 10;
            suggestions.push({
                type: 'reactivity',
                message: 'Component state could use Signals. Migrate from traditional properties.',
                priority: 'medium'
            });
            bestPractices.reactivePatterns.push('Use Signals for reactive state management');
        }
        // Check for unsubscribed observables
        if (this.hasUnsubscribedObservables(content)) {
            score -= 20;
            suggestions.push({
                type: 'memory-leak',
                message: 'Observable subscriptions without unsubscribe. Use async pipe or takeUntilDestroyed.',
                priority: 'critical'
            });
            bestPractices.reactivePatterns.push('Always unsubscribe from observables or use async pipe');
        }
        // Check for improper async pipe usage
        if (this.hasImproperAsyncPipe(content)) {
            score -= 8;
            suggestions.push({
                type: 'template',
                message: 'Multiple async pipes on same observable. Use single subscription with alias.',
                priority: 'medium'
            });
            bestPractices.reactivePatterns.push('Use (observable$ | async) as alias for multiple references');
        }
        // Check for template-driven forms
        if (this.usesTemplateDrivenForms(content)) {
            score -= 5;
            suggestions.push({
                type: 'forms',
                message: 'Using template-driven forms. Prefer Reactive Forms for complex validation.',
                priority: 'low'
            });
            bestPractices.componentPatterns.push('Use Reactive Forms for better type safety and testability');
        }
        // Check for missing trackBy in *ngFor
        if (this.hasMissingTrackBy(content)) {
            score -= 10;
            suggestions.push({
                type: 'performance',
                message: '*ngFor without trackBy function. Add trackBy to prevent unnecessary re-renders.',
                priority: 'high'
            });
            bestPractices.performanceOptimizations.push('Always provide trackBy function for *ngFor');
        }
        // Check for smart/dumb component pattern
        if (this.isContainerComponent(content) && this.hasBusinessLogic(content)) {
            suggestions.push({
                type: 'architecture',
                message: 'Container component with business logic. Extract to service.',
                priority: 'low'
            });
            bestPractices.componentPatterns.push('Keep container components thin, move logic to services');
        }
        // Check for proper input/output naming
        if (this.hasImproperInputOutputNaming(content)) {
            score -= 5;
            suggestions.push({
                type: 'naming',
                message: 'Input/Output properties not following naming conventions.',
                priority: 'low'
            });
            bestPractices.componentPatterns.push('Use descriptive names for @Input/@Output, suffix outputs with Event');
        }
        // Check for missing OnDestroy implementation
        if (this.hasSubscriptions(content) && !this.implementsOnDestroy(content)) {
            score -= 15;
            suggestions.push({
                type: 'lifecycle',
                message: 'Component with subscriptions missing OnDestroy. Implement for cleanup.',
                priority: 'high'
            });
            bestPractices.componentPatterns.push('Implement OnDestroy to clean up subscriptions');
        }
        // Check for proper router usage
        if (this.hasRouterUsage(content) && !this.usesRouterService(content)) {
            score -= 5;
            suggestions.push({
                type: 'routing',
                message: 'Direct window.location usage. Use Angular Router for navigation.',
                priority: 'medium'
            });
            bestPractices.componentPatterns.push('Use Router service for all navigation');
        }
        // Check for accessibility
        if (!this.hasAccessibilityAttributes(content)) {
            score -= 10;
            suggestions.push({
                type: 'accessibility',
                message: 'Missing accessibility attributes. Add aria-* attributes.',
                priority: 'high'
            });
            bestPractices.componentPatterns.push('Add ARIA attributes for accessibility');
        }
        // Check for lazy loading
        if (this.isRouteModule(content) && !this.usesLazyLoading(content)) {
            suggestions.push({
                type: 'performance',
                message: 'Routes not lazy loaded. Use loadComponent for better initial load time.',
                priority: 'low'
            });
            bestPractices.performanceOptimizations.push('Lazy load routes with loadComponent/loadChildren');
        }
        // Check for test coverage
        if (!this.hasTestFile(context.filePath)) {
            suggestions.push({
                type: 'testing',
                message: 'No test file found. Create .spec.ts file with Jasmine/Jest.',
                priority: 'medium'
            });
            bestPractices.testingStrategies.push('Write unit tests for all components and services');
        }
        return {
            score: Math.max(score, 0),
            suggestions,
            bestPractices
        };
    }
    // Component Patterns
    hasStandaloneComponent(content) {
        return /standalone:\s*true/.test(content);
    }
    hasModuleBasedComponent(content) {
        return content.includes('@NgModule') && content.includes('declarations:');
    }
    // Signals API
    hasSignal(content) {
        return /signal\s*\(/.test(content);
    }
    hasComputedSignal(content) {
        return /computed\s*\(/.test(content);
    }
    hasEffect(content) {
        return /effect\s*\(/.test(content);
    }
    // Dependency Injection
    hasInjectFunction(content) {
        return /inject\s*\(/.test(content);
    }
    hasConstructorInjection(content) {
        return this.usesConstructorInjection(content);
    }
    // RxJS Patterns
    hasObservableSubscription(content) {
        return /\.subscribe\s*\(/.test(content);
    }
    hasMissingUnsubscribe(content) {
        return this.hasUnsubscribedObservables(content);
    }
    hasAsyncPipe(content) {
        return /\|\s*async/.test(content);
    }
    hasTakeUntil(content) {
        return /takeUntil\s*\(/.test(content) || /takeUntilDestroyed\s*\(/.test(content);
    }
    // NgRx
    hasNgRxStore(content) {
        return /Store</.test(content) || content.includes('this.store');
    }
    hasNgRxAction(content) {
        return /createAction\s*\(/.test(content) || /props</.test(content);
    }
    hasNgRxEffect(content) {
        return /@Effect\(\)/.test(content) || /createEffect\s*\(/.test(content);
    }
    hasNgRxSelector(content) {
        return /createSelector\s*\(/.test(content) || /createFeatureSelector/.test(content);
    }
    // Performance
    hasOnPushChangeDetection(content) {
        return /ChangeDetectionStrategy\.OnPush/.test(content);
    }
    hasTrackBy(content) {
        return /trackBy/.test(content);
    }
    hasMissingTrackBy(content) {
        return this.detectMissingTrackBy(content);
    }
    detectMissingTrackBy(content) {
        const hasNgFor = /\*ngFor/.test(content);
        const hasTrackBy = this.hasTrackBy(content);
        return hasNgFor && !hasTrackBy;
    }
    // Directives and Templates
    hasStructuralDirective(content) {
        return /\*ng(If|For|Switch)/.test(content);
    }
    hasNewControlFlow(content) {
        return /@(if|for|switch)\s*\(/.test(content);
    }
    hasTemplateReference(content) {
        return /#\w+/.test(content);
    }
    // Lifecycle Hooks
    hasLifecycleHook(content, hookName) {
        return new RegExp(`${hookName}\\s*\\(`).test(content) || new RegExp(`implements\\s+[^{]*${hookName.replace('ng', '')}`).test(content);
    }
    // Testing
    hasTestBed(content) {
        return /TestBed\./.test(content);
    }
    hasComponentFixture(content) {
        return /ComponentFixture</.test(content);
    }
    /**
     * Check for NgModule usage
     */
    usesNgModules(content) {
        return content.includes('@NgModule') || content.includes('imports: [');
    }
    /**
     * Check for default change detection
     */
    hasDefaultChangeDetection(content) {
        return content.includes('@Component') && !content.includes('changeDetection: ChangeDetectionStrategy.OnPush');
    }
    /**
     * Check for constructor injection
     */
    usesConstructorInjection(content) {
        return /constructor\s*\([^)]*private\s+[^)]+\)/.test(content);
    }
    /**
     * Check if component should use Signals
     */
    shouldUseSignals(content) {
        // Components with state that changes frequently
        return content.includes('private ') && (content.includes(' = ') || content.includes('this.'));
    }
    /**
     * Check if using Signals
     */
    usesSignals(content) {
        return content.includes('signal(') || content.includes('computed(') || content.includes('effect(');
    }
    /**
     * Check for unsubscribed observables
     */
    hasUnsubscribedObservables(content) {
        const hasSubscribe = content.includes('.subscribe(');
        const hasUnsubscribe = content.includes('unsubscribe()') || content.includes('takeUntilDestroyed') || content.includes('async');
        return hasSubscribe && !hasUnsubscribe;
    }
    /**
     * Check for improper async pipe usage
     */
    hasImproperAsyncPipe(content) {
        // Multiple async pipes on same observable without alias
        const asyncPipes = content.match(/\|\s*async/g);
        return (asyncPipes && asyncPipes.length > 1) && !content.includes(' as ');
    }
    /**
     * Check for template-driven forms
     */
    usesTemplateDrivenForms(content) {
        return content.includes('ngModel') || content.includes('FormsModule');
    }
    /**
     * Check if component is a container
     */
    isContainerComponent(content) {
        return content.includes('Container') || content.includes('Page') || content.includes('View');
    }
    /**
     * Check for business logic in component
     */
    hasBusinessLogic(content) {
        return content.includes('http.') || content.includes('.pipe(') || content.includes('map(');
    }
    /**
     * Check for improper input/output naming
     */
    hasImproperInputOutputNaming(content) {
        // Outputs should end with Event or similar suffix
        return content.includes('@Output()') && !content.includes('Event') && !content.includes('Change');
    }
    /**
     * Check for subscriptions
     */
    hasSubscriptions(content) {
        return content.includes('.subscribe(');
    }
    /**
     * Check if implements OnDestroy
     */
    implementsOnDestroy(content) {
        return content.includes('implements OnDestroy') || content.includes('ngOnDestroy()');
    }
    /**
     * Check for router usage
     */
    hasRouterUsage(content) {
        return content.includes('router.navigate') || content.includes('window.location');
    }
    /**
     * Check if uses Router service
     */
    usesRouterService(content) {
        return content.includes('Router') && content.includes('navigate');
    }
    /**
     * Check for accessibility attributes
     */
    hasAccessibilityAttributes(content) {
        return content.includes('aria-') || content.includes('role=') || content.includes('[attr.aria-');
    }
    /**
     * Check if route module
     */
    isRouteModule(content) {
        return content.includes('RouterModule') || content.includes('Routes');
    }
    /**
     * Check for lazy loading
     */
    usesLazyLoading(content) {
        return content.includes('loadComponent') || content.includes('loadChildren');
    }
    /**
     * Check for test file
     */
    hasTestFile(filePath) {
        if (!filePath)
            return false;
        const testPath = filePath.replace(/\.ts$/, '.spec.ts');
        return false; // In real implementation, check if file exists
    }
    /**
     * Generate Angular-specific recommendations
     */
    generateAngularRecommendations(content) {
        const recommendations = [];
        // Signals
        if (!content.includes('signal(')) {
            recommendations.push('Adopt Signals for simpler reactivity compared to RxJS');
        }
        // State management
        if (content.includes('.subscribe(') && content.includes('BehaviorSubject')) {
            recommendations.push('Consider NgRx or Akita for complex state management');
        }
        // Performance
        if (!content.includes('OnPush')) {
            recommendations.push('Use OnPush change detection with Signals or async pipe');
        }
        // Forms
        if (content.includes('FormGroup')) {
            recommendations.push('Use typed Reactive Forms for better type safety');
        }
        // Testing
        if (!content.includes('.spec.ts')) {
            recommendations.push('Use Spectator for simplified Angular testing');
        }
        return recommendations;
    }
    /**
     * Override RAG configuration for Angular domain
     */
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'frontend-angular',
            maxExamples: 5
        };
    }
    /**
     * Detect Angular version
     */
    detectAngularVersion(content) {
        if (content.includes('standalone: true'))
            return 'Angular 14+ (Standalone Components)';
        if (content.includes('signal('))
            return 'Angular 16+ (Signals)';
        if (content.includes('@NgModule'))
            return 'Angular (Module-based)';
        return 'Angular (version unknown)';
    }
    /**
     * Detect state management solution
     */
    detectStateManagement(content) {
        if (content.includes('@ngrx/store'))
            return 'NgRx';
        if (content.includes('akita'))
            return 'Akita';
        if (content.includes('signal('))
            return 'Signals';
        if (content.includes('BehaviorSubject'))
            return 'RxJS Services';
        return 'Component State';
    }
}
//# sourceMappingURL=james-angular.js.map