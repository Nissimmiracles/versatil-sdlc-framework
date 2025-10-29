/**
 * VERSATIL SDLC Framework - Context-Aware Response Formatter
 *
 * Formats answers based on user's learned preferences.
 * Adapts structure, detail level, and content based on user profile.
 *
 * @version 7.13.0
 */
export interface ResponseContext {
    question_category: string;
    feature_name?: string;
    implementation_details?: {
        files: string[];
        lines: number;
        documented: boolean;
    };
    git_status?: {
        uncommitted: boolean;
        files_count: number;
    };
    verification_evidence?: {
        files_exist: boolean;
        integration_verified: boolean;
        commands_run: string[];
    };
}
/**
 * Context-Aware Response Formatter
 */
export declare class ContextResponseFormatter {
    private logger;
    private interactionLearner;
    constructor();
    /**
     * Format response based on user preferences
     */
    formatResponse(rawAnswer: string, context: ResponseContext): string;
    /**
     * Build section based on type
     */
    private buildSection;
    /**
     * Build direct answer section
     */
    private buildDirectAnswer;
    /**
     * Build evidence section
     */
    private buildEvidence;
    /**
     * Build details section
     */
    private buildDetails;
    /**
     * Build table
     */
    private buildTable;
    /**
     * Build file paths section
     */
    private buildFilePaths;
    /**
     * Build action items section
     */
    private buildActionItems;
}
