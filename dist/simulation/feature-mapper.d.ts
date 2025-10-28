/**
 * Feature Mapping Engine - Promise to Reality Converter
 *
 * Parses CLAUDE.md and documentation to extract all framework promises,
 * then maps them to specific testable scenarios that can expose vapor-ware.
 */
export interface FrameworkPromise {
    id: string;
    category: 'agent-activation' | 'mcp-integration' | 'opera-methodology' | 'context-preservation' | 'quality-gates' | 'testing-integration';
    featureName: string;
    description: string;
    source: string;
    claims: string[];
    testableScenarios: TestableScenario[];
    confidence: 'high' | 'medium' | 'low';
}
export interface TestableScenario {
    id: string;
    name: string;
    description: string;
    userAction: string;
    expectedBehavior: string;
    measurableCriteria: string[];
    category: string;
}
export declare class FeatureMapper {
    private logger;
    private projectRoot;
    private promises;
    constructor(projectRoot?: string);
    /**
     * Map all framework promises to testable scenarios
     */
    mapFrameworkPromises(): Promise<FrameworkPromise[]>;
    /**
     * Parse CLAUDE.md for agent activation and OPERA methodology promises
     */
    private parseClaudeConfiguration;
    /**
     * Extract agent activation promises from CLAUDE.md
     */
    private extractAgentActivationPromises;
    /**
     * Extract OPERA methodology promises
     */
    private extractOPERAPromises;
    /**
     * Extract context preservation specific promises
     */
    private extractContextPreservationPromises;
    /**
     * Parse package.json for capability claims
     */
    private parsePackageCapabilities;
    /**
     * Parse documentation for feature claims
     */
    private parseDocumentationClaims;
    /**
     * Parse MCP server for tool integration claims
     */
    private parseMCPIntegrationClaims;
    /**
     * Categorize promises for analysis
     */
    private categorizePromises;
    /**
     * Get all promises for a specific category
     */
    getPromisesByCategory(category: string): FrameworkPromise[];
    /**
     * Export promises to file for analysis
     */
    exportPromises(filePath?: string): Promise<string>;
}
