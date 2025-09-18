#!/usr/bin/env node
export = VersatilAgentSetup;
declare class VersatilAgentSetup {
    projectRoot: string;
    versatilDir: string;
    projectConfig: any;
    packageJson: any;
    loadProjectConfig(): any;
    loadPackageJson(): any;
    showHeader(): void;
    analyzeProject(): Promise<{
        projectType: string;
        framework: string;
        hasTests: boolean;
        hasDocumentation: boolean;
        complexity: number;
        recommendedAgents: never[];
    }>;
    detectProjectType(): "nodejs" | "python" | "rust" | "go" | "unknown";
    detectFramework(): "react" | "none" | "vue" | "express" | "nextjs";
    hasTestingSetup(): boolean;
    hasDocumentation(): boolean;
    estimateComplexity(): number;
    countFiles(patterns: any): number;
    hasDirectory(dirName: any): boolean;
    calculateAgentRelevance(agent: any, analysis: any): number;
    configureAgent(agentId: any, agent: any, enabled?: boolean): Promise<{
        id: any;
        name: any;
        role: any;
        description: any;
        enabled: boolean;
        auto_activate: boolean;
        patterns: any;
        keywords: any;
        tools: any;
        configured_at: string;
    }>;
    createAgentAssets(agentId: any, agent: any, agentDir: any): Promise<void>;
    generateAgentPrompt(agent: any): string;
    getAgentResponsibilities(agentName: any): any;
    generateAgentCommands(agentId: any, agent: any): any;
    createMariaQAAssets(agentDir: any): Promise<void>;
    createJamesFrontendAssets(agentDir: any): Promise<void>;
    createMarcusBackendAssets(agentDir: any): Promise<void>;
    updateProjectConfiguration(configuredAgents: any): Promise<void>;
    generateAgentSummary(analysis: any, configuredAgents: any): Promise<void>;
    run(): Promise<void>;
}
//# sourceMappingURL=setup-agents.d.ts.map