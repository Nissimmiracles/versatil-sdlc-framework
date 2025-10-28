/**
 * VERSATIL Proactive Daemon
 * Background process that monitors files and auto-activates agents
 */
declare class ProactiveDaemon {
    private orchestrator;
    private vectorStore;
    private agentPool;
    private mcpHealthMonitor;
    private eventOrchestrator;
    private statusline;
    private projectPath;
    private activationCount;
    private versionWatcher;
    private versionCheckDebounce;
    private lastVersionCheckResult;
    private logFile;
    private parallelTaskManager;
    private stressTestGenerator;
    private dailyAuditSystem;
    private onboardingSystem;
    private bugReleaseSystem;
    private storyGenerator;
    private requirementExtractor;
    private repositoryAnalyzer;
    private structureOptimizer;
    private lastAnalysisTime;
    constructor(projectPath: string);
    start(): Promise<void>;
    /**
     * Initialize and start all 5-Rule automation systems
     */
    private initialize5RuleSystem;
    /**
     * Schedule weekly repository analysis
     */
    private scheduleRepositoryAnalysis;
    /**
     * Run repository analysis and optionally generate migration plan
     */
    runRepositoryAnalysis(generatePlan?: boolean): Promise<void>;
    /**
     * Public method: Manually extract requirements from a message
     * This can be called by external tools or user commands
     */
    extractRequirements(message: string): Promise<void>;
    private reportStatus;
    /**
     * Start real-time version consistency monitoring (Phase 5)
     * Watches package.json and related version files for changes
     */
    private startVersionMonitoring;
    /**
     * Check version consistency using version-check.cjs script
     * Provides immediate alerts for version conflicts
     */
    private checkVersionConsistency;
    /**
     * Attempt to automatically fix version inconsistencies
     */
    private autoFixVersions;
    private shutdown;
    private printStatusline;
    private log;
}
export { ProactiveDaemon };
