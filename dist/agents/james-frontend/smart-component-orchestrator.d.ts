import { EventEmitter } from 'events';
import { z } from 'zod';
export declare const ComponentLibrarySchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["ui-primitives", "design-system", "component-collection", "utility-first"]>;
    framework: z.ZodEnum<["react", "vue", "svelte", "angular", "framework-agnostic"]>;
    version: z.ZodString;
    components: z.ZodArray<z.ZodString, "many">;
    features: z.ZodArray<z.ZodString, "many">;
    bundle_size: z.ZodObject<{
        gzipped: z.ZodNumber;
        raw: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        gzipped?: number;
        raw?: number;
    }, {
        gzipped?: number;
        raw?: number;
    }>;
    accessibility_score: z.ZodNumber;
    compatibility: z.ZodObject<{
        typescript: z.ZodBoolean;
        ssr: z.ZodBoolean;
        csr: z.ZodBoolean;
        mobile: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        mobile?: boolean;
        typescript?: boolean;
        ssr?: boolean;
        csr?: boolean;
    }, {
        mobile?: boolean;
        typescript?: boolean;
        ssr?: boolean;
        csr?: boolean;
    }>;
    installation_method: z.ZodEnum<["npm", "cdn", "copy-paste", "cli"]>;
    customization_level: z.ZodEnum<["low", "medium", "high", "complete"]>;
    documentation_quality: z.ZodNumber;
    community_support: z.ZodNumber;
    maintenance_status: z.ZodEnum<["active", "maintenance", "deprecated"]>;
    license: z.ZodString;
    dependencies: z.ZodArray<z.ZodString, "many">;
    peer_dependencies: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    framework?: "react" | "vue" | "svelte" | "angular" | "framework-agnostic";
    type?: "design-system" | "ui-primitives" | "component-collection" | "utility-first";
    name?: string;
    dependencies?: string[];
    features?: string[];
    version?: string;
    components?: string[];
    compatibility?: {
        mobile?: boolean;
        typescript?: boolean;
        ssr?: boolean;
        csr?: boolean;
    };
    bundle_size?: {
        gzipped?: number;
        raw?: number;
    };
    accessibility_score?: number;
    installation_method?: "npm" | "cdn" | "copy-paste" | "cli";
    customization_level?: "low" | "medium" | "high" | "complete";
    documentation_quality?: number;
    community_support?: number;
    maintenance_status?: "active" | "maintenance" | "deprecated";
    license?: string;
    peer_dependencies?: string[];
}, {
    framework?: "react" | "vue" | "svelte" | "angular" | "framework-agnostic";
    type?: "design-system" | "ui-primitives" | "component-collection" | "utility-first";
    name?: string;
    dependencies?: string[];
    features?: string[];
    version?: string;
    components?: string[];
    compatibility?: {
        mobile?: boolean;
        typescript?: boolean;
        ssr?: boolean;
        csr?: boolean;
    };
    bundle_size?: {
        gzipped?: number;
        raw?: number;
    };
    accessibility_score?: number;
    installation_method?: "npm" | "cdn" | "copy-paste" | "cli";
    customization_level?: "low" | "medium" | "high" | "complete";
    documentation_quality?: number;
    community_support?: number;
    maintenance_status?: "active" | "maintenance" | "deprecated";
    license?: string;
    peer_dependencies?: string[];
}>;
export declare const ComponentRequirementSchema: z.ZodObject<{
    component_type: z.ZodString;
    functionality: z.ZodArray<z.ZodString, "many">;
    accessibility_requirements: z.ZodArray<z.ZodString, "many">;
    design_requirements: z.ZodObject<{
        theme_support: z.ZodBoolean;
        responsive: z.ZodBoolean;
        animations: z.ZodBoolean;
        variants: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        responsive?: boolean;
        variants?: string[];
        theme_support?: boolean;
        animations?: boolean;
    }, {
        responsive?: boolean;
        variants?: string[];
        theme_support?: boolean;
        animations?: boolean;
    }>;
    performance_requirements: z.ZodObject<{
        max_bundle_size: z.ZodNumber;
        render_time_ms: z.ZodNumber;
        memory_usage_mb: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        memory_usage_mb?: number;
        max_bundle_size?: number;
        render_time_ms?: number;
    }, {
        memory_usage_mb?: number;
        max_bundle_size?: number;
        render_time_ms?: number;
    }>;
    framework_constraints: z.ZodArray<z.ZodString, "many">;
    browser_support: z.ZodArray<z.ZodString, "many">;
    integration_preferences: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    functionality?: string[];
    component_type?: string;
    accessibility_requirements?: string[];
    design_requirements?: {
        responsive?: boolean;
        variants?: string[];
        theme_support?: boolean;
        animations?: boolean;
    };
    performance_requirements?: {
        memory_usage_mb?: number;
        max_bundle_size?: number;
        render_time_ms?: number;
    };
    framework_constraints?: string[];
    browser_support?: string[];
    integration_preferences?: string[];
}, {
    functionality?: string[];
    component_type?: string;
    accessibility_requirements?: string[];
    design_requirements?: {
        responsive?: boolean;
        variants?: string[];
        theme_support?: boolean;
        animations?: boolean;
    };
    performance_requirements?: {
        memory_usage_mb?: number;
        max_bundle_size?: number;
        render_time_ms?: number;
    };
    framework_constraints?: string[];
    browser_support?: string[];
    integration_preferences?: string[];
}>;
export declare const ComponentRecommendationSchema: z.ZodObject<{
    library: z.ZodString;
    component: z.ZodString;
    match_score: z.ZodNumber;
    reasoning: z.ZodString;
    pros: z.ZodArray<z.ZodString, "many">;
    cons: z.ZodArray<z.ZodString, "many">;
    implementation_complexity: z.ZodEnum<["low", "medium", "high"]>;
    integration_effort: z.ZodEnum<["minimal", "moderate", "significant"]>;
    customization_potential: z.ZodNumber;
    alternative_options: z.ZodArray<z.ZodString, "many">;
    code_example: z.ZodString;
    setup_instructions: z.ZodArray<z.ZodString, "many">;
    dependencies_to_install: z.ZodArray<z.ZodString, "many">;
    estimated_development_time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    component?: string;
    library?: string;
    match_score?: number;
    reasoning?: string;
    pros?: string[];
    cons?: string[];
    implementation_complexity?: "low" | "medium" | "high";
    integration_effort?: "moderate" | "minimal" | "significant";
    customization_potential?: number;
    alternative_options?: string[];
    code_example?: string;
    setup_instructions?: string[];
    dependencies_to_install?: string[];
    estimated_development_time?: string;
}, {
    component?: string;
    library?: string;
    match_score?: number;
    reasoning?: string;
    pros?: string[];
    cons?: string[];
    implementation_complexity?: "low" | "medium" | "high";
    integration_effort?: "moderate" | "minimal" | "significant";
    customization_potential?: number;
    alternative_options?: string[];
    code_example?: string;
    setup_instructions?: string[];
    dependencies_to_install?: string[];
    estimated_development_time?: string;
}>;
export declare const ComponentOrchestrationPlanSchema: z.ZodObject<{
    project_analysis: z.ZodObject<{
        framework: z.ZodString;
        current_libraries: z.ZodArray<z.ZodString, "many">;
        design_system: z.ZodOptional<z.ZodString>;
        accessibility_requirements: z.ZodArray<z.ZodString, "many">;
        performance_budget: z.ZodObject<{
            max_bundle_size: z.ZodNumber;
            target_performance_score: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            max_bundle_size?: number;
            target_performance_score?: number;
        }, {
            max_bundle_size?: number;
            target_performance_score?: number;
        }>;
        browser_targets: z.ZodArray<z.ZodString, "many">;
        device_targets: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        framework?: string;
        design_system?: string;
        browser_targets?: string[];
        accessibility_requirements?: string[];
        current_libraries?: string[];
        performance_budget?: {
            max_bundle_size?: number;
            target_performance_score?: number;
        };
        device_targets?: string[];
    }, {
        framework?: string;
        design_system?: string;
        browser_targets?: string[];
        accessibility_requirements?: string[];
        current_libraries?: string[];
        performance_budget?: {
            max_bundle_size?: number;
            target_performance_score?: number;
        };
        device_targets?: string[];
    }>;
    recommended_libraries: z.ZodArray<z.ZodObject<{
        library: z.ZodString;
        component: z.ZodString;
        match_score: z.ZodNumber;
        reasoning: z.ZodString;
        pros: z.ZodArray<z.ZodString, "many">;
        cons: z.ZodArray<z.ZodString, "many">;
        implementation_complexity: z.ZodEnum<["low", "medium", "high"]>;
        integration_effort: z.ZodEnum<["minimal", "moderate", "significant"]>;
        customization_potential: z.ZodNumber;
        alternative_options: z.ZodArray<z.ZodString, "many">;
        code_example: z.ZodString;
        setup_instructions: z.ZodArray<z.ZodString, "many">;
        dependencies_to_install: z.ZodArray<z.ZodString, "many">;
        estimated_development_time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        component?: string;
        library?: string;
        match_score?: number;
        reasoning?: string;
        pros?: string[];
        cons?: string[];
        implementation_complexity?: "low" | "medium" | "high";
        integration_effort?: "moderate" | "minimal" | "significant";
        customization_potential?: number;
        alternative_options?: string[];
        code_example?: string;
        setup_instructions?: string[];
        dependencies_to_install?: string[];
        estimated_development_time?: string;
    }, {
        component?: string;
        library?: string;
        match_score?: number;
        reasoning?: string;
        pros?: string[];
        cons?: string[];
        implementation_complexity?: "low" | "medium" | "high";
        integration_effort?: "moderate" | "minimal" | "significant";
        customization_potential?: number;
        alternative_options?: string[];
        code_example?: string;
        setup_instructions?: string[];
        dependencies_to_install?: string[];
        estimated_development_time?: string;
    }>, "many">;
    integration_strategy: z.ZodObject<{
        primary_library: z.ZodString;
        supplementary_libraries: z.ZodArray<z.ZodString, "many">;
        custom_components: z.ZodArray<z.ZodString, "many">;
        migration_plan: z.ZodArray<z.ZodString, "many">;
        testing_strategy: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        primary_library?: string;
        supplementary_libraries?: string[];
        custom_components?: string[];
        migration_plan?: string[];
        testing_strategy?: string[];
    }, {
        primary_library?: string;
        supplementary_libraries?: string[];
        custom_components?: string[];
        migration_plan?: string[];
        testing_strategy?: string[];
    }>;
    implementation_roadmap: z.ZodArray<z.ZodObject<{
        phase: z.ZodString;
        components: z.ZodArray<z.ZodString, "many">;
        estimated_time: z.ZodString;
        dependencies: z.ZodArray<z.ZodString, "many">;
        deliverables: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        dependencies?: string[];
        phase?: string;
        components?: string[];
        estimated_time?: string;
        deliverables?: string[];
    }, {
        dependencies?: string[];
        phase?: string;
        components?: string[];
        estimated_time?: string;
        deliverables?: string[];
    }>, "many">;
    quality_gates: z.ZodArray<z.ZodObject<{
        checkpoint: z.ZodString;
        criteria: z.ZodArray<z.ZodString, "many">;
        validation_method: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        checkpoint?: string;
        criteria?: string[];
        validation_method?: string;
    }, {
        checkpoint?: string;
        criteria?: string[];
        validation_method?: string;
    }>, "many">;
    maintenance_plan: z.ZodObject<{
        update_strategy: z.ZodString;
        monitoring_metrics: z.ZodArray<z.ZodString, "many">;
        deprecation_handling: z.ZodString;
        documentation_requirements: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        update_strategy?: string;
        monitoring_metrics?: string[];
        deprecation_handling?: string;
        documentation_requirements?: string[];
    }, {
        update_strategy?: string;
        monitoring_metrics?: string[];
        deprecation_handling?: string;
        documentation_requirements?: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    project_analysis?: {
        framework?: string;
        design_system?: string;
        browser_targets?: string[];
        accessibility_requirements?: string[];
        current_libraries?: string[];
        performance_budget?: {
            max_bundle_size?: number;
            target_performance_score?: number;
        };
        device_targets?: string[];
    };
    recommended_libraries?: {
        component?: string;
        library?: string;
        match_score?: number;
        reasoning?: string;
        pros?: string[];
        cons?: string[];
        implementation_complexity?: "low" | "medium" | "high";
        integration_effort?: "moderate" | "minimal" | "significant";
        customization_potential?: number;
        alternative_options?: string[];
        code_example?: string;
        setup_instructions?: string[];
        dependencies_to_install?: string[];
        estimated_development_time?: string;
    }[];
    integration_strategy?: {
        primary_library?: string;
        supplementary_libraries?: string[];
        custom_components?: string[];
        migration_plan?: string[];
        testing_strategy?: string[];
    };
    implementation_roadmap?: {
        dependencies?: string[];
        phase?: string;
        components?: string[];
        estimated_time?: string;
        deliverables?: string[];
    }[];
    quality_gates?: {
        checkpoint?: string;
        criteria?: string[];
        validation_method?: string;
    }[];
    maintenance_plan?: {
        update_strategy?: string;
        monitoring_metrics?: string[];
        deprecation_handling?: string;
        documentation_requirements?: string[];
    };
}, {
    project_analysis?: {
        framework?: string;
        design_system?: string;
        browser_targets?: string[];
        accessibility_requirements?: string[];
        current_libraries?: string[];
        performance_budget?: {
            max_bundle_size?: number;
            target_performance_score?: number;
        };
        device_targets?: string[];
    };
    recommended_libraries?: {
        component?: string;
        library?: string;
        match_score?: number;
        reasoning?: string;
        pros?: string[];
        cons?: string[];
        implementation_complexity?: "low" | "medium" | "high";
        integration_effort?: "moderate" | "minimal" | "significant";
        customization_potential?: number;
        alternative_options?: string[];
        code_example?: string;
        setup_instructions?: string[];
        dependencies_to_install?: string[];
        estimated_development_time?: string;
    }[];
    integration_strategy?: {
        primary_library?: string;
        supplementary_libraries?: string[];
        custom_components?: string[];
        migration_plan?: string[];
        testing_strategy?: string[];
    };
    implementation_roadmap?: {
        dependencies?: string[];
        phase?: string;
        components?: string[];
        estimated_time?: string;
        deliverables?: string[];
    }[];
    quality_gates?: {
        checkpoint?: string;
        criteria?: string[];
        validation_method?: string;
    }[];
    maintenance_plan?: {
        update_strategy?: string;
        monitoring_metrics?: string[];
        deprecation_handling?: string;
        documentation_requirements?: string[];
    };
}>;
export type ComponentLibrary = z.infer<typeof ComponentLibrarySchema>;
export type ComponentRequirement = z.infer<typeof ComponentRequirementSchema>;
export type ComponentRecommendation = z.infer<typeof ComponentRecommendationSchema>;
export type ComponentOrchestrationPlan = z.infer<typeof ComponentOrchestrationPlanSchema>;
export declare class SmartComponentOrchestrator extends EventEmitter {
    private componentLibraries;
    private projectContext;
    private analysisCache;
    constructor();
    private initializeComponentLibraries;
    private setupEventHandlers;
    analyzeProject(projectPath: string): Promise<any>;
    private detectFramework;
    private detectCurrentLibraries;
    private detectDesignSystem;
    private analyzeAccessibilityNeeds;
    private analyzePerformanceBudget;
    private detectBrowserTargets;
    private detectDeviceTargets;
    private catalogExistingComponents;
    private assessCodeQuality;
    private detectTestingFramework;
    generateComponentRecommendations(requirements: ComponentRequirement[]): Promise<ComponentRecommendation[]>;
    private findMatchingComponents;
    private scoreComponentMatches;
    private generateRecommendationReasoning;
    private generatePros;
    private generateCons;
    private assessImplementationComplexity;
    private assessIntegrationEffort;
    private assessCustomizationPotential;
    private getAlternativeOptions;
    private generateCodeExample;
    private generateSetupInstructions;
    private getDependencies;
    private estimateDevelopmentTime;
    private selectTopRecommendations;
    private generateRecommendations;
    private createOrchestrationPlan;
    private validatePlan;
    createComponentOrchestrationPlan(requirements: ComponentRequirement[]): Promise<ComponentOrchestrationPlan>;
    private selectPrimaryLibrary;
    private selectSupplementaryLibraries;
    private identifyCustomComponents;
    private createMigrationPlan;
    private createTestingStrategy;
    private createImplementationRoadmap;
    private createQualityGates;
    optimizeComponentSelection(projectPath: string): Promise<ComponentOrchestrationPlan>;
    private generateRequirementsFromProject;
    getLibraryComparison(libraryNames: string[]): any;
    generateImplementationGuide(library: string, components: string[]): Promise<any>;
    private generateConfigurationSteps;
    private generatePropsDocumentation;
    private generateComponentExamples;
    private generateAccessibilityGuidelines;
    private generateCustomizationGuide;
    private generateBestPractices;
    private generateMigrationGuide;
    private generateTroubleshootingGuide;
    generateTweakCNIntegration(projectPath: string): Promise<any>;
}
export default SmartComponentOrchestrator;
