/**
 * VERSATIL SDLC Framework - Proactive Answer Generator
 *
 * Generates answers BEFORE user asks, based on learned question patterns.
 * Anticipates user's next questions and pre-generates comprehensive answers.
 *
 * @version 7.13.0
 */
import { type QuestionCategory } from './conversation-pattern-detector.js';
export interface ProactiveAnswer {
    trigger: 'feature_completion' | 'code_change' | 'health_check_result' | 'git_commit';
    anticipated_questions: {
        question: string;
        category: QuestionCategory;
        probability: number;
    }[];
    pregenerated_answers: Map<string, string>;
    confidence: number;
    should_show_proactively: boolean;
    evidence: {
        files_verified: string[];
        commands_run: string[];
        integration_checked: boolean;
    };
}
export interface FeatureContext {
    feature_name: string;
    version?: string;
    files_created: string[];
    files_modified: string[];
    total_lines: number;
    documentation_files: string[];
    git_status: {
        uncommitted: boolean;
        files_count: number;
        latest_commit?: string;
        remote_status?: string;
    };
}
/**
 * Proactive Answer Generator
 */
export declare class ProactiveAnswerGenerator {
    private logger;
    private patternDetector;
    private interactionLearner;
    constructor();
    /**
     * Generate proactive answer for feature completion
     */
    generateForFeatureCompletion(context: FeatureContext): Promise<ProactiveAnswer | null>;
    /**
     * Format proactive answer for display
     */
    formatProactiveAnswer(answer: ProactiveAnswer, context: FeatureContext): string;
    /**
     * Anticipate questions based on patterns
     */
    private anticipateQuestions;
    /**
     * Get representative question for category
     */
    private getCategoryQuestion;
    /**
     * Generate answer for specific question category
     */
    private generateAnswerForCategory;
    /**
     * Generate status answer
     */
    private generateStatusAnswer;
    /**
     * Generate availability answer
     */
    private generateAvailabilityAnswer;
    /**
     * Generate verification answer
     */
    private generateVerificationAnswer;
    /**
     * Generate implementation answer
     */
    private generateImplementationAnswer;
    /**
     * Generate documentation answer
     */
    private generateDocumentationAnswer;
    /**
     * Get line count for file
     */
    private getLineCount;
}
