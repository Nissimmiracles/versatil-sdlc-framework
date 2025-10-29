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
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GuardianLogger } from '../agents/guardian/guardian-logger.js';
/**
 * User Interaction Learner
 */
export class UserInteractionLearner {
    constructor(userId) {
        this.profile = null;
        this.logger = GuardianLogger.getInstance();
        this.userId = userId || os.userInfo().username || 'default';
        const versatilHome = path.join(os.homedir(), '.versatil');
        this.profilesDir = path.join(versatilHome, 'learning', 'user-preferences');
        if (!fs.existsSync(this.profilesDir)) {
            fs.mkdirSync(this.profilesDir, { recursive: true });
        }
        this.profileFile = path.join(this.profilesDir, `${this.userId}.json`);
        this.loadOrCreateProfile();
    }
    /**
     * Learn from a conversation pattern
     */
    async learnFromPattern(pattern, answerProvided) {
        if (!this.profile)
            return;
        this.profile.total_interactions++;
        // Update frequent questions
        this.updateFrequentQuestions(pattern);
        // Update answer format preferences
        this.updateAnswerFormatPreferences(pattern);
        // Update verification preferences
        this.updateVerificationPreferences(pattern);
        // Update detail level preferences
        this.updateDetailLevelPreferences(pattern);
        // Update information priorities
        this.updateInformationPriorities(pattern);
        // Save profile
        await this.saveProfile();
        this.logger.info(`[User Interaction Learner] Learned from pattern`, {
            user_id: this.userId,
            question_category: pattern.question_category,
            occurrences: pattern.occurrences
        });
    }
    /**
     * Get user profile
     */
    getProfile() {
        return this.profile;
    }
    /**
     * Get answer format preferences
     */
    getAnswerFormatPreferences() {
        return this.profile?.answer_format || this.getDefaultAnswerFormat();
    }
    /**
     * Get detail level preferences
     */
    getDetailLevelPreferences() {
        return this.profile?.detail_level || this.getDefaultDetailLevel();
    }
    /**
     * Get verification preferences
     */
    getVerificationPreferences() {
        return this.profile?.verification || this.getDefaultVerification();
    }
    /**
     * Should show proactive answers?
     */
    shouldShowProactive(questionCategory) {
        if (!this.profile)
            return false;
        // Check if user has asked this category 3+ times
        const categoryCount = this.profile.frequent_questions
            .filter(q => q.category === questionCategory)
            .reduce((sum, q) => sum + q.count, 0);
        return categoryCount >= 3;
    }
    /**
     * Update frequent questions
     */
    updateFrequentQuestions(pattern) {
        if (!this.profile)
            return;
        const existing = this.profile.frequent_questions.find(q => q.question === pattern.question_normalized);
        if (existing) {
            existing.count++;
        }
        else {
            this.profile.frequent_questions.push({
                question: pattern.question_normalized,
                category: pattern.question_category,
                count: 1
            });
        }
        // Keep top 50 most frequent
        this.profile.frequent_questions.sort((a, b) => b.count - a.count);
        this.profile.frequent_questions = this.profile.frequent_questions.slice(0, 50);
    }
    /**
     * Update answer format preferences
     */
    updateAnswerFormatPreferences(pattern) {
        if (!this.profile)
            return;
        const expected = pattern.typical_answer_components;
        // Learn what components user expects
        if (expected.includes('file_locations')) {
            this.profile.answer_format.include_file_paths = true;
        }
        if (expected.includes('line_counts')) {
            this.profile.answer_format.include_line_counts = true;
        }
        if (expected.includes('verification_proof')) {
            this.profile.answer_format.always_verify_with_commands = true;
            this.profile.answer_format.proof_first = true;
        }
        if (expected.includes('git_status')) {
            this.profile.answer_format.include_git_status = true;
        }
        if (expected.includes('code_integration')) {
            this.profile.answer_format.show_integration_proof = true;
        }
    }
    /**
     * Update verification preferences
     */
    updateVerificationPreferences(pattern) {
        if (!this.profile)
            return;
        if (pattern.question_category === 'verification') {
            this.profile.verification.double_checks_claims = true;
            this.profile.verification.asks_for_proof = true;
            this.profile.verification.verification_frequency = 'frequent';
            // Lower trust level if asking verification questions
            if (pattern.occurrences >= 3) {
                this.profile.verification.trust_level = 'low';
            }
            else if (pattern.occurrences >= 2) {
                this.profile.verification.trust_level = 'medium';
            }
        }
        if (pattern.context.user_intent === 'verify_implementation') {
            this.profile.verification.wants_file_verification = true;
        }
        if (pattern.context.user_intent === 'check_public_availability') {
            this.profile.verification.wants_git_status = true;
        }
    }
    /**
     * Update detail level preferences
     */
    updateDetailLevelPreferences(pattern) {
        if (!this.profile)
            return;
        // Short questions indicate preference for concise answers
        if (pattern.question_normalized.length < 15) {
            // Don't change - short questions can ask for comprehensive info
        }
        // Questions with "how" suggest wanting detailed explanation
        if (pattern.question_normalized.includes('how')) {
            this.profile.detail_level.explanation_style = 'detailed';
        }
        // Questions asking for implementation details
        if (pattern.question_category === 'implementation') {
            this.profile.detail_level.technical_depth = 'deep';
        }
    }
    /**
     * Update information priorities
     */
    updateInformationPriorities(pattern) {
        if (!this.profile)
            return;
        const priorities = this.profile.information_priorities;
        // Track what user always asks about
        const expected = pattern.typical_answer_components;
        for (const component of expected) {
            if (!priorities.always_include.includes(component)) {
                // Add if asked 3+ times
                if (pattern.occurrences >= 3) {
                    priorities.always_include.push(component);
                }
            }
        }
        // Learn priority order from question sequence
        if (pattern.context.conversation_turn === 1) {
            // First question shows top priority
            if (expected.length > 0 && !priorities.show_first.includes(expected[0])) {
                priorities.show_first.unshift(expected[0]);
                priorities.show_first = priorities.show_first.slice(0, 5); // Keep top 5
            }
        }
    }
    /**
     * Load or create user profile
     */
    loadOrCreateProfile() {
        if (fs.existsSync(this.profileFile)) {
            try {
                const content = fs.readFileSync(this.profileFile, 'utf-8');
                this.profile = JSON.parse(content);
                this.logger.info(`[User Interaction Learner] Loaded profile for ${this.userId}`);
                return;
            }
            catch (error) {
                this.logger.error('Failed to load user profile', { error });
            }
        }
        // Create new profile
        this.profile = this.createDefaultProfile();
        this.saveProfile();
        this.logger.info(`[User Interaction Learner] Created new profile for ${this.userId}`);
    }
    /**
     * Save user profile
     */
    async saveProfile() {
        if (!this.profile)
            return;
        this.profile.last_updated = new Date().toISOString();
        try {
            const content = JSON.stringify(this.profile, null, 2);
            fs.writeFileSync(this.profileFile, content);
        }
        catch (error) {
            this.logger.error('Failed to save user profile', { error });
        }
    }
    /**
     * Create default profile
     */
    createDefaultProfile() {
        return {
            user_id: this.userId,
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            total_interactions: 0,
            answer_format: this.getDefaultAnswerFormat(),
            detail_level: this.getDefaultDetailLevel(),
            verification: this.getDefaultVerification(),
            communication_style: this.getDefaultCommunicationStyle(),
            information_priorities: this.getDefaultInformationPriorities(),
            frequent_questions: [],
            typical_question_sequences: [],
            average_questions_per_session: 0,
            prefers_proactive_answers: null
        };
    }
    /**
     * Get default answer format
     */
    getDefaultAnswerFormat() {
        return {
            structure: ['direct_answer', 'evidence', 'details', 'action_items'],
            include_tables: true,
            include_code_snippets: false,
            include_file_paths: true,
            include_line_counts: true,
            include_verification_commands: true,
            include_git_status: true,
            proof_first: false,
            always_verify_with_commands: false,
            show_file_existence: true,
            show_integration_proof: true
        };
    }
    /**
     * Get default detail level
     */
    getDefaultDetailLevel() {
        return {
            overall_detail_level: 'standard',
            technical_depth: 'moderate',
            code_examples: 'minimal',
            explanation_style: 'detailed'
        };
    }
    /**
     * Get default verification
     */
    getDefaultVerification() {
        return {
            verification_frequency: 'occasional',
            double_checks_claims: false,
            asks_for_proof: false,
            wants_file_verification: true,
            wants_git_status: false,
            trust_level: 'high'
        };
    }
    /**
     * Get default communication style
     */
    getDefaultCommunicationStyle() {
        return {
            prefers_direct: true,
            prefers_technical: true,
            prefers_actionable: true,
            prefers_concise: false,
            emoji_tolerance: 'minimal'
        };
    }
    /**
     * Get default information priorities
     */
    getDefaultInformationPriorities() {
        return {
            always_include: [],
            never_include: [],
            show_first: [],
            show_last: []
        };
    }
}
//# sourceMappingURL=user-interaction-learner.js.map