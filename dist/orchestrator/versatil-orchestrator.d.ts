/**
 * VERSATIL Main Orchestrator
 */
export declare class VERSATILOrchestrator {
    private logger;
    private agentRegistry;
    constructor();
    initialize(): Promise<void>;
    start(): Promise<void>;
}
