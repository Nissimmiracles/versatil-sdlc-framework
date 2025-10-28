/**
 * Multi-Project Manager with Intelligent Isolation
 * Manages separate contexts, RAG systems, and documentation for different projects
 *
 * Features:
 * - Project-specific RAG knowledge bases
 * - Isolated agent configurations per project
 * - Cross-project learning without contamination
 * - Project-specific documentation systems
 * - Intelligent context switching
 * - Shared global learnings (optional)
 */
import { EventEmitter } from 'events';
import { ProjectVision, ProjectHistory, MarketAnalysis } from '../project/project-vision-manager.js';
export interface ProjectContext {
    id: string;
    path: string;
    name: string;
    type: string;
    framework: string;
    version: string;
    signature: string;
    metadata: {
        createdAt: number;
        lastAccessed: number;
        accessCount: number;
        size: number;
        dependencies: string[];
        technologies: string[];
        patterns: string[];
        complexity: 'simple' | 'medium' | 'complex';
    };
    isolation: {
        ragNamespace: string;
        agentConfigs: Record<string, any>;
        documentationPath: string;
        cacheNamespace: string;
        learningPath: string;
    };
    configuration: {
        enabledAgents: string[];
        preferences: Record<string, any>;
        customRules: any[];
        qualityGates: any[];
    };
    vision?: ProjectVision;
    history?: ProjectHistory;
    marketContext?: MarketAnalysis;
}
export interface ProjectIsolationConfig {
    strictIsolation: boolean;
    allowCrossProjectLearning: boolean;
    sharedGlobalKnowledge: boolean;
    automaticContextSwitching: boolean;
    ragPersistence: boolean;
    documentationSeparation: boolean;
    cacheIsolation: boolean;
}
export interface RAGNamespace {
    projectId: string;
    namespace: string;
    vectorStore: string;
    documentPath: string;
    embeddings: any[];
    metadata: {
        documentCount: number;
        lastUpdated: number;
        averageChunkSize: number;
        topics: string[];
    };
}
export interface CrossProjectLearning {
    patterns: Map<string, any>;
    bestPractices: Map<string, any>;
    commonSolutions: Map<string, any>;
    antiPatterns: Map<string, any>;
    performanceInsights: Map<string, any>;
}
export declare class MultiProjectManager extends EventEmitter {
    private projects;
    private currentProject;
    private ragNamespaces;
    private crossProjectLearning;
    private config;
    private frameworkBasePath;
    constructor(config?: Partial<ProjectIsolationConfig>);
    private initializeCrossProjectLearning;
    private initialize;
    registerProject(projectPath: string): Promise<ProjectContext>;
    switchToProject(projectPath: string): Promise<ProjectContext>;
    getCurrentProject(): ProjectContext | null;
    getProjectRAGContext(projectId?: string): Promise<RAGNamespace | null>;
    updateProjectDocumentation(content: string, category: string, projectId?: string): Promise<void>;
    queryProjectKnowledge(query: string, projectId?: string, includeGlobal?: boolean): Promise<any[]>;
    learnFromProject(projectId: string, learningType: 'pattern' | 'best_practice' | 'solution' | 'anti_pattern', data: any): Promise<void>;
    getProjectInsights(projectId?: string): Promise<any>;
    exportProjectData(projectId: string, outputPath: string): Promise<void>;
    importProjectData(inputPath: string): Promise<string>;
    listProjects(): Promise<ProjectContext[]>;
    removeProject(projectId: string, deleteData?: boolean): Promise<void>;
    private generateProjectSignature;
    private createProjectContext;
    private setupProjectIsolation;
    private findProjectByPath;
    private detectProjectType;
    private detectFramework;
    private detectTechnologies;
    private safeReadJson;
    private loadGlobalProjects;
    private saveProjectContext;
    private loadCrossProjectLearning;
    private loadProjectConfigurations;
    private activateProjectRAG;
    private switchAgentConfigurations;
    private updateProjectRAG;
    private queryRAGNamespace;
    private queryCrossProjectKnowledge;
    /**
     * Store project vision
     */
    storeProjectVision(projectId: string, vision: Partial<ProjectVision>): Promise<void>;
    /**
     * Get project vision
     */
    getProjectVision(projectId: string): Promise<ProjectVision | null>;
    /**
     * Update market context for project
     */
    updateProjectMarketContext(projectId: string, market: MarketAnalysis): Promise<void>;
    /**
     * Track project event (feature added, decision made, etc.)
     */
    trackProjectEvent(projectId: string, event: {
        type: string;
        description: string;
        impact: string;
        agent: string;
        metadata?: any;
    }): Promise<void>;
    /**
     * Track milestone
     */
    trackProjectMilestone(projectId: string, milestone: any): Promise<void>;
    /**
     * Get project history (events, milestones, decisions)
     */
    getProjectHistory(projectId: string, limit?: number): Promise<ProjectHistory>;
    /**
     * Get enriched project context (includes vision, history, market)
     */
    getEnrichedProjectContext(projectId: string): Promise<ProjectContext | null>;
    private storeProjectLearning;
    private contributeToCrossProjectLearning;
    private getRAGInsights;
    private getAgentInsights;
    private getDocumentationInsights;
    private getProjectLearningInsights;
    private getProjectRecommendations;
    private exportProjectDocumentation;
    private exportProjectLearnings;
    private exportProjectConfigurations;
    private importProjectDocumentation;
    private importProjectLearnings;
    private deleteProjectData;
}
export default MultiProjectManager;
