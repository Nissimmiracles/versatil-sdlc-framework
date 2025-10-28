/**
 * VERSATIL SDLC Framework - Intelligent Onboarding System
 * Rule 4: Enhanced onboarding system for new users with automatic setup
 */
import { EventEmitter } from 'events';
export interface OnboardingProfile {
    userId: string;
    experience: 'beginner' | 'intermediate' | 'expert';
    projectType: 'web' | 'mobile' | 'backend' | 'fullstack' | 'ml' | 'enterprise';
    techStack: string[];
    teamSize: number;
    goals: string[];
    preferences: {
        agentActivation: 'auto' | 'manual' | 'smart';
        ruleExecution: 'automatic' | 'guided' | 'manual';
        feedbackLevel: 'minimal' | 'normal' | 'verbose';
    };
}
export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    category: 'setup' | 'configuration' | 'validation' | 'tutorial';
    required: boolean;
    estimated_time: number;
    dependencies: string[];
    validation: () => Promise<boolean>;
    action: () => Promise<OnboardingResult>;
}
export interface OnboardingResult {
    success: boolean;
    message: string;
    nextSteps?: string[];
    errors?: string[];
    recommendations?: string[];
}
export interface ProjectAnalysis {
    detectedTechnologies: string[];
    projectStructure: string;
    complexity: 'simple' | 'moderate' | 'complex';
    recommendedAgents: string[];
    recommendedRules: string[];
    estimatedSetupTime: number;
    hasExistingFramework?: boolean;
    existingFrameworkVersion?: string;
    conflictingFiles?: string[];
    migrationRequired?: boolean;
}
export interface ExistingInstallation {
    version: string;
    installedAt: string;
    agents: Record<string, any>;
    rules: Record<string, any>;
    configPath: string;
}
export interface ConflictReport {
    hasConflicts: boolean;
    existingInstallation: ExistingInstallation | null;
    conflictingFrameworks: string[];
    versionMismatch: boolean;
    corruptedInstallation: boolean;
    recommendations: ('UPGRADE_REQUIRED' | 'DOWNGRADE_WARNING' | 'REPAIR_INSTALLATION' | 'REVIEW_COEXISTENCE' | 'FRESH_INSTALL')[];
    missingFiles: string[];
}
export interface ConflictResolution {
    strategy: 'PROCEED' | 'UPGRADE' | 'REPAIR' | 'MIGRATE' | 'COEXIST' | 'CANCEL';
    actions: string[];
    backupCreated?: boolean;
    backupPath?: string;
}
export declare class IntelligentOnboardingSystem extends EventEmitter {
    private logger;
    private ragOrchestrator?;
    private auditSystem?;
    private projectRoot;
    private onboardingSteps;
    private userProfile?;
    private projectAnalysis?;
    private completedSteps;
    private onboardingProgress;
    private estimatedCompletion;
    constructor(projectRoot: string);
    /**
     * Start intelligent onboarding process
     */
    startOnboarding(profile?: Partial<OnboardingProfile>): Promise<OnboardingResult>;
    /**
     * Analyze current project structure and requirements
     */
    private analyzeProject;
    /**
     * Create user profile with intelligent defaults
     */
    private createUserProfile;
    /**
     * Generate personalized onboarding plan
     */
    private generateOnboardingPlan;
    /**
     * Execute onboarding plan with parallel processing where possible
     */
    private executeOnboardingPlan;
    /**
     * Execute individual onboarding step
     */
    private executeOnboardingStep;
    /**
     * Initialize all available onboarding steps
     */
    private initializeOnboardingSteps;
    /**
     * Validate complete setup
     */
    private validateSetup;
    private fileExists;
    private ensureDirectory;
    private findFiles;
    private configureAgent;
    private saveUserProfile;
    private sortOnboardingSteps;
    private groupStepsByDependencies;
    private updateProgress;
    /**
     * Get current onboarding progress
     */
    getProgress(): {
        progress: number;
        completed: number;
        total: number;
    };
    /**
     * Detect existing framework installations and conflicts
     */
    private detectConflicts;
    /**
     * Handle conflicts based on detected issues
     */
    private handleConflicts;
    /**
     * Perform version upgrade with backup
     */
    private performUpgrade;
    /**
     * Repair corrupted installation
     */
    private performRepair;
    /**
     * Merge old and new configurations
     */
    private mergeConfigs;
    /**
     * Get active agents from configuration
     */
    private getActiveAgents;
    /**
     * Setup credentials for external services with agent awareness
     */
    private setupCredentials;
    /**
     * Generate stable project ID for encryption context
     */
    private generateProjectId;
    /**
     * Resume interrupted onboarding
     */
    resumeOnboarding(): Promise<OnboardingResult>;
}
