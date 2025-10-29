/**
 * VERSATIL SDLC Framework - IDE Configuration Generator
 *
 * Generates optimal IDE configuration files to prevent crashes:
 * - .cursorignore (Cursor IDE ignore patterns)
 * - .vscode/settings.json (VSCode performance optimizations)
 * - .idea/.gitignore (JetBrains ignore patterns)
 *
 * Uses template-based generation with project-specific customization
 *
 * Part of Guardian's proactive IDE optimization system (v7.15.0+)
 *
 * @version 7.15.0
 */
import type { IDEType, DirectorySize } from './ide-performance-detector.js';
export interface IDEConfigGenerationResult {
    success: boolean;
    files_created: string[];
    files_updated: string[];
    errors: string[];
    duration_ms: number;
}
export interface ProjectDetectionResult {
    type: 'node' | 'python' | 'rust' | 'go' | 'java' | 'mixed' | 'unknown';
    technologies: string[];
    package_managers: string[];
}
/**
 * IDE Configuration Generator
 * Creates optimal ignore files and settings for IDE performance
 */
export declare class IDEConfigGenerator {
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Generate optimal IDE configurations
     * Creates .cursorignore, .vscode/settings.json, etc.
     */
    generateOptimalConfigs(ideType: IDEType, largeDirectories?: DirectorySize[]): Promise<IDEConfigGenerationResult>;
    /**
     * Detect project type from file structure
     */
    private detectProjectType;
    /**
     * Generate .cursorignore file
     */
    private generateCursorIgnore;
    /**
     * Build .cursorignore content
     */
    private buildCursorIgnoreContent;
    /**
     * Generate .vscode/settings.json file
     */
    private generateVSCodeSettings;
    /**
     * Build VSCode settings object
     */
    private buildVSCodeSettings;
    /**
     * Generate .idea/.gitignore file (JetBrains)
     */
    private generateIdeaGitignore;
    /**
     * Build .idea/.gitignore content
     */
    private buildIdeaGitignoreContent;
}
