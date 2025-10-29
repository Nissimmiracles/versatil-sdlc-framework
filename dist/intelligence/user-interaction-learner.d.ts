/**
 * VERSATIL SDLC Framework - User Interaction Learner
 *
 * Learns user preferences from conversation history to provide personalized responses.
 * Analyzes question patterns, answer preferences, and communication style.
 *
 * Key Features:
 * - Answer format preferences (tables, code, proof-first)
 * - Detail level preferences (brief vs comprehensive)
 * - Verification requirements (always wants proof)
 * - Communication style (technical, direct, etc.)
 * - Information priorities (what to show first)
 *
 * @version 7.13.0
 */
import type { ConversationPattern, QuestionCategory } from './conversation-pattern-detector.js';
export interface UserPreferencePattern {
    user_id: string;
    preference_type: 'answer_format' | 'information_detail' | 'verification_frequency' | 'communication_style';
    pattern: string;
    confidence: number;
    examples: string[];
    learned_from_interactions: number;
    last_updated: string;
}
export interface AnswerFormatPreferences {
    structure: string[];
    include_tables: boolean;
    include_code_snippets: boolean;
    include_file_paths: boolean;
    include_line_counts: boolean;
    include_verification_commands: boolean;
    include_git_status: boolean;
    proof_first: boolean;
    always_verify_with_commands: boolean;
    show_file_existence: boolean;
    show_integration_proof: boolean;
}
export interface DetailLevelPreferences {
    overall_detail_level: 'minimal' | 'standard' | 'comprehensive' | 'exhaustive';
    technical_depth: 'surface' | 'moderate' | 'deep';
    code_examples: 'none' | 'minimal' | 'extensive';
    explanation_style: 'brief' | 'detailed' | 'teaching';
}
export interface VerificationPreferences {
    verification_frequency: 'never' | 'occasional' | 'frequent' | 'always';
    double_checks_claims: boolean;
    asks_for_proof: boolean;
    wants_file_verification: boolean;
    wants_git_status: boolean;
    trust_level: 'low' | 'medium' | 'high';
}
export interface CommunicationStylePreferences {
    prefers_direct: boolean;
    prefers_technical: boolean;
    prefers_actionable: boolean;
    prefers_concise: boolean;
    emoji_tolerance: 'none' | 'minimal' | 'moderate' | 'heavy';
}
export interface InformationPriorities {
    always_include: string[];
    never_include: string[];
    show_first: string[];
    show_last: string[];
}
export interface UserProfile {
    user_id: string;
    created_at: string;
    last_updated: string;
    total_interactions: number;
    answer_format: AnswerFormatPreferences;
    detail_level: DetailLevelPreferences;
    verification: VerificationPreferences;
    communication_style: CommunicationStylePreferences;
    information_priorities: InformationPriorities;
    frequent_questions: {
        question: string;
        category: QuestionCategory;
        count: number;
    }[];
    typical_question_sequences: string[][];
    average_questions_per_session: number;
    prefers_proactive_answers: boolean | null;
}
/**
 * User Interaction Learner
 */
export declare class UserInteractionLearner {
    private logger;
    private profilesDir;
    private userId;
    private profileFile;
    private profile;
    constructor(userId?: string);
    /**
     * Learn from a conversation pattern
     */
    learnFromPattern(pattern: ConversationPattern, answerProvided?: string): Promise<void>;
    /**
     * Get user profile
     */
    getProfile(): UserProfile | null;
    /**
     * Get answer format preferences
     */
    getAnswerFormatPreferences(): AnswerFormatPreferences;
    /**
     * Get detail level preferences
     */
    getDetailLevelPreferences(): DetailLevelPreferences;
    /**
     * Get verification preferences
     */
    getVerificationPreferences(): VerificationPreferences;
    /**
     * Should show proactive answers?
     */
    shouldShowProactive(questionCategory: QuestionCategory): boolean;
    /**
     * Update frequent questions
     */
    private updateFrequentQuestions;
    /**
     * Update answer format preferences
     */
    private updateAnswerFormatPreferences;
    /**
     * Update verification preferences
     */
    private updateVerificationPreferences;
    /**
     * Update detail level preferences
     */
    private updateDetailLevelPreferences;
    /**
     * Update information priorities
     */
    private updateInformationPriorities;
    /**
     * Load or create user profile
     */
    private loadOrCreateProfile;
    /**
     * Save user profile
     */
    private saveProfile;
    /**
     * Create default profile
     */
    private createDefaultProfile;
    /**
     * Get default answer format
     */
    private getDefaultAnswerFormat;
    /**
     * Get default detail level
     */
    private getDefaultDetailLevel;
    /**
     * Get default verification
     */
    private getDefaultVerification;
    /**
     * Get default communication style
     */
    private getDefaultCommunicationStyle;
    /**
     * Get default information priorities
     */
    private getDefaultInformationPriorities;
}
