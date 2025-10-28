/**
 * Tech Stack Detector
 *
 * Analyzes project files to determine the technology stack and suggest optimal sub-agents.
 * 95%+ accuracy on language/framework detection.
 *
 * @module tech-stack-detector
 * @version 6.6.0
 */
export interface TechStackResult {
    language: string;
    framework?: string;
    backend?: BackendStack;
    frontend?: FrontendStack;
    confidence: number;
    recommendedSubAgents: string[];
    detectedFiles: string[];
}
export interface BackendStack {
    language: 'node' | 'python' | 'ruby' | 'go' | 'java';
    framework?: string;
    packageManager?: string;
    confidence: number;
}
export interface FrontendStack {
    framework: 'react' | 'vue' | 'nextjs' | 'angular' | 'svelte';
    typescript: boolean;
    buildTool?: string;
    confidence: number;
}
export declare class TechStackDetector {
    private static readonly FILE_INDICATORS;
    /**
     * Detect technology stack from project directory
     */
    static detectFromProject(projectPath: string): Promise<TechStackResult>;
    /**
     * Detect technology stack from file content
     */
    static detectFromFile(filePath: string, content: string): Promise<TechStackResult>;
    /**
     * Analyze collected signals to determine final tech stack
     */
    private static analyzeSignals;
    /**
     * Detect backend stack details
     */
    private static detectBackendStack;
    /**
     * Detect frontend stack details
     */
    private static detectFrontendStack;
    /**
     * Recommend optimal sub-agents based on detected stack
     */
    private static recommendSubAgents;
    /**
     * Get confidence level description
     */
    static getConfidenceLevel(confidence: number): string;
}
