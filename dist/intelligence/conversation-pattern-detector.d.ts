/**
 * VERSATIL SDLC Framework - Conversation Pattern Detector
 *
 * Extracts semantic fingerprints from user questions to detect recurring patterns.
 * Enables Guardian to learn user's question patterns and provide proactive answers.
 *
 * Key Features:
 * - Question fingerprinting with semantic hashing
 * - Category classification (status, implementation, docs, availability, verification)
 * - Context extraction (feature name, user intent)
 * - Pattern storage in ~/.versatil/learning/user-questions/patterns.jsonl
 *
 * @version 7.13.0
 */
export type QuestionCategory = 'status' | 'implementation' | 'documentation' | 'availability' | 'verification' | 'comparison' | 'action_required';
export type UserIntent = 'verify_implementation' | 'verify_confidence' | 'check_public_availability' | 'quick_status_check' | 'understand_impact' | 'get_proof' | 'understand_next_steps';
export interface ConversationPattern {
    id: string;
    question_fingerprint: string;
    question_text: string;
    question_normalized: string;
    question_category: QuestionCategory;
    context: {
        feature?: string;
        user_intent: UserIntent;
        urgency: 'low' | 'medium' | 'high';
        conversation_turn: number;
        follows_feature_claim: boolean;
    };
    occurrences: number;
    first_asked: string;
    last_asked: string;
    typical_answer_components: string[];
    answer_provided?: string;
    user_satisfaction?: 'unknown' | 'satisfied' | 'asked_again';
}
export interface QuestionMatch {
    pattern: ConversationPattern;
    similarity: number;
    exact_match: boolean;
}
/**
 * Conversation Pattern Detector
 */
export declare class ConversationPatternDetector {
    private logger;
    private patternsFile;
    private patternsCache;
    private readonly commonPatterns;
    constructor();
    /**
     * Detect pattern from user question
     */
    detectPattern(questionText: string, conversationContext?: {
        turn: number;
        previous_message?: string;
        feature_mentioned?: string;
    }): ConversationPattern;
    /**
     * Find matching pattern for question
     */
    findMatch(questionText: string): QuestionMatch | null;
    /**
     * Get all patterns for category
     */
    getPatternsByCategory(category: QuestionCategory): ConversationPattern[];
    /**
     * Get most frequent patterns
     */
    getFrequentPatterns(limit?: number): ConversationPattern[];
    /**
     * Normalize question text
     */
    private normalizeQuestion;
    /**
     * Generate semantic fingerprint for question
     */
    private generateFingerprint;
    /**
     * Classify question into category
     */
    private classifyQuestion;
    /**
     * Detect user intent from question
     */
    private detectIntent;
    /**
     * Detect urgency from question
     */
    private detectUrgency;
    /**
     * Detect expected answer components
     */
    private detectExpectedAnswerComponents;
    /**
     * Check if question follows feature claim
     */
    private followsFeatureClaim;
    /**
     * Calculate similarity between two strings (Levenshtein distance)
     */
    private calculateSimilarity;
    /**
     * Levenshtein distance algorithm
     */
    private levenshteinDistance;
    /**
     * Find matching pattern in cache
     */
    private findMatchingPattern;
    /**
     * Store pattern to file and cache
     */
    private storePattern;
    /**
     * Update existing pattern
     */
    private updatePattern;
    /**
     * Load patterns from file into cache
     */
    private loadPatternsCache;
}
