/**
 * Automatic Roadmap Generator
 *
 * Analyzes project structure and generates personalized development roadmaps
 * with agent recommendations, weekly milestones, and quality gates.
 *
 * Part of VERSATIL SDLC Framework v6.4.0
 */
export interface ProjectAnalysis {
    projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ml' | 'unknown';
    technologies: string[];
    framework: string | null;
    languages: string[];
    hasTests: boolean;
    hasCI: boolean;
    teamSize: 'solo' | 'small' | 'medium' | 'large';
    complexity: 'simple' | 'moderate' | 'complex';
}
export interface AgentRecommendation {
    agentName: string;
    agentPath: string;
    reason: string;
    priority: 'critical' | 'recommended' | 'optional';
}
export interface WeeklyMilestone {
    week: number;
    title: string;
    description: string;
    tasks: string[];
    agents: string[];
    qualityGates: string[];
}
export interface ProjectRoadmap {
    projectName: string;
    analysis: ProjectAnalysis;
    recommendedAgents: AgentRecommendation[];
    milestones: WeeklyMilestone[];
    qualityStrategy: string[];
    deploymentChecklist: string[];
}
export declare class RoadmapGenerator {
    private projectPath;
    constructor(projectPath: string);
    /**
     * Main entry point: Analyze project and generate complete roadmap
     */
    generateRoadmap(): Promise<ProjectRoadmap>;
    /**
     * Analyze project structure and detect technologies
     */
    private analyzeProjectStructure;
    /**
     * Detect which OPERA agents and sub-agents should be used
     */
    private detectRecommendedAgents;
    /**
     * Generate weekly milestones based on project analysis
     */
    private generateWeeklyMilestones;
    /**
     * Generate Week 2 tasks based on project type
     */
    private generateWeek2Tasks;
    /**
     * Generate Week 3 tasks based on project type
     */
    private generateWeek3Tasks;
    /**
     * Generate quality strategy recommendations
     */
    private generateQualityStrategy;
    /**
     * Generate deployment checklist
     */
    private generateDeploymentChecklist;
    /**
     * Helper: Get relevant agent names from recommendations
     */
    private getRelevantAgents;
    /**
     * Helper: Get project name from package.json or directory name
     */
    private getProjectName;
    /**
     * Helper: Count files in project (excluding node_modules, .git, etc.)
     */
    private countFiles;
    /**
     * Generate markdown roadmap document
     */
    generateMarkdown(): Promise<string>;
}
