/**
 * VERSATIL Framework - MCP Auto-Configurator
 * Automatically configures VERSATIL MCP Server in Claude Desktop and Cursor
 *
 * Features:
 * - Auto-detects Claude Desktop and Cursor installations
 * - Backs up existing configurations
 * - Adds VERSATIL MCP Server configuration
 * - Cross-platform support (macOS, Linux, Windows)
 */
export interface DetectionResult {
    claudeDesktop: boolean;
    claudeConfigPath: string | null;
    cursor: boolean;
    cursorConfigPath: string | null;
}
export interface ConfigurationResult {
    success: boolean;
    configPath: string;
    backupPath?: string;
    error?: string;
}
export declare class MCPAutoConfigurator {
    private claudeConfigPaths;
    private cursorConfigPaths;
    /**
     * Detect Claude Desktop and Cursor installations
     */
    detectInstallations(): Promise<DetectionResult>;
    /**
     * Configure VERSATIL MCP Server in Claude Desktop
     */
    configureClaude(projectPath: string): Promise<ConfigurationResult>;
    /**
     * Configure VERSATIL MCP Server in Cursor
     */
    configureCursor(projectPath: string): Promise<ConfigurationResult>;
    /**
     * Get path to VERSATIL MCP Server binary
     */
    private getVERSATILMCPPath;
    /**
     * Auto-configure MCP Server in all detected IDEs
     */
    autoConfigureAll(projectPath?: string): Promise<void>;
    /**
     * Print manual setup instructions
     */
    private printManualInstructions;
    /**
     * Print available MCP tools
     */
    private printAvailableTools;
}
export declare const mcpAutoConfigurator: MCPAutoConfigurator;
