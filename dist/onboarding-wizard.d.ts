/**
 * VERSATIL Framework Onboarding Wizard
 * Interactive setup experience for new developers with OPERA agent customization
 */
export interface OnboardingResponse {
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ml' | 'enterprise';
    teamSize: 'solo' | 'small' | 'medium' | 'large';
    experience: 'beginner' | 'intermediate' | 'expert';
    technologies: string[];
    priorities: string[];
    agentCustomizations: Map<string, AgentCustomization>;
    mcpPreferences: string[];
}
export interface AgentCustomization {
    agentName: string;
    priority: number;
    autoActivate: boolean;
    customTriggers: string[];
    specialFocus: string[];
}
export declare class OnboardingWizard {
    private rl;
    private responses;
    constructor();
    /**
     * Start the interactive onboarding experience
     */
    startOnboarding(): Promise<OnboardingResponse>;
    /**
     * Analyze existing project structure and detect patterns
     */
    private analyzeProject;
    /**
     * Setup team context and experience level
     */
    private setupTeamContext;
    /**
     * Customize OPERA agents based on user preferences
     */
    private customizeOPERAAgents;
    /**
     * Customize individual agent
     */
    private customizeAgent;
    /**
     * Configure MCP tool preferences
     */
    private configureMCPTools;
    /**
     * Generate final configuration
     */
    private generateConfiguration;
    /**
     * Complete setup and create project files
     */
    private completeSetup;
    private parseProjectType;
    private parseTeamSize;
    private parseExperience;
    private parsePriorities;
    private parseMCPPreferences;
    private detectProjectType;
    private detectTechnologies;
    private createProjectStructure;
    private generateCursorRules;
    private generateClaudeGuide;
    /**
     * Generate personalized project roadmap
     */
    private generateProjectRoadmap;
    private askQuestion;
    private askYesNo;
    private waitForEnter;
    private delay;
}
export declare function runOnboardingWizard(): Promise<void>;
