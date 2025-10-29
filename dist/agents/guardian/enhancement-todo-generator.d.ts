/**
 * VERSATIL SDLC Framework - Enhancement TODO Generator
 *
 * Generates enhancement TODO files in markdown format from enhancement suggestions.
 * Creates files in todos/ directory with format: enhancement-[category]-[timestamp]-[hash].md
 *
 * @version 7.12.0
 */
import type { EnhancementSuggestion } from './enhancement-detector.js';
export interface EnhancementTodoGenerationResult {
    todos_created: number;
    todos_skipped: number;
    file_paths: string[];
}
/**
 * Enhancement TODO Generator
 */
export declare class EnhancementTodoGenerator {
    private logger;
    private todosDir;
    private existingTodoFingerprints;
    constructor(todosDir?: string);
    /**
     * Generate enhancement TODO files from suggestions
     */
    generateTodos(suggestions: EnhancementSuggestion[]): Promise<EnhancementTodoGenerationResult>;
    /**
     * Generate markdown content for enhancement TODO
     */
    private generateMarkdownContent;
    /**
     * Generate filename for enhancement TODO
     */
    private generateFilename;
    /**
     * Generate fingerprint for deduplication
     */
    private generateFingerprint;
    /**
     * Load existing todo fingerprints from todos directory
     */
    private loadExistingTodoFingerprints;
    /**
     * Format category for display
     */
    private formatCategory;
    /**
     * Add approval section to markdown (v7.12.0+)
     */
    private addApprovalSection;
}
