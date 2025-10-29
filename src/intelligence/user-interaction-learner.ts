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
import type { ConversationPattern, QuestionCategory } from './conversation-pattern-detector.js';

export interface UserPreferencePattern {
  user_id: string;
  preference_type: 'answer_format' | 'information_detail' | 'verification_frequency' | 'communication_style';
  pattern: string;
  confidence: number;  // 0-100
  examples: string[];
  learned_from_interactions: number;
  last_updated: string;
}

export interface AnswerFormatPreferences {
  // Structure preferences
  structure: string[];  // Order of sections in answer
  include_tables: boolean;
  include_code_snippets: boolean;
  include_file_paths: boolean;
  include_line_counts: boolean;
  include_verification_commands: boolean;
  include_git_status: boolean;

  // Evidence preferences
  proof_first: boolean;  // Show proof before explanation
  always_verify_with_commands: boolean;  // wc -l, grep, etc.
  show_file_existence: boolean;
  show_integration_proof: boolean;  // grep for cross-references
}

export interface DetailLevelPreferences {
  overall_detail_level: 'minimal' | 'standard' | 'comprehensive' | 'exhaustive';
  technical_depth: 'surface' | 'moderate' | 'deep';
  code_examples: 'none' | 'minimal' | 'extensive';
  explanation_style: 'brief' | 'detailed' | 'teaching';
}

export interface VerificationPreferences {
  verification_frequency: 'never' | 'occasional' | 'frequent' | 'always';
  double_checks_claims: boolean;  // Asks "sure?" after assertions
  asks_for_proof: boolean;
  wants_file_verification: boolean;
  wants_git_status: boolean;
  trust_level: 'low' | 'medium' | 'high';  // How much user trusts AI claims
}

export interface CommunicationStylePreferences {
  prefers_direct: boolean;  // Gets to point quickly
  prefers_technical: boolean;  // Technical language vs layman
  prefers_actionable: boolean;  // Action items vs theory
  prefers_concise: boolean;  // Short answers vs long
  emoji_tolerance: 'none' | 'minimal' | 'moderate' | 'heavy';
}

export interface InformationPriorities {
  // What user always wants to know (in order)
  always_include: string[];  // e.g., ["status", "file_locations", "git_status"]
  never_include: string[];   // e.g., ["theory", "history"]
  show_first: string[];      // Top priority information
  show_last: string[];       // Lower priority (can be at end)
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

  // Pattern tracking
  frequent_questions: {
    question: string;
    category: QuestionCategory;
    count: number;
  }[];

  // Behavior patterns
  typical_question_sequences: string[][];  // Common question flows
  average_questions_per_session: number;
  prefers_proactive_answers: boolean | null;  // null = not yet determined
}

/**
 * User Interaction Learner
 */
export class UserInteractionLearner {
  private logger: GuardianLogger;
  private profilesDir: string;
  private userId: string;
  private profileFile: string;
  private profile: UserProfile | null = null;

  constructor(userId?: string) {
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
  public async learnFromPattern(pattern: ConversationPattern, answerProvided?: string): Promise<void> {
    if (!this.profile) return;

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
  public getProfile(): UserProfile | null {
    return this.profile;
  }

  /**
   * Get answer format preferences
   */
  public getAnswerFormatPreferences(): AnswerFormatPreferences {
    return this.profile?.answer_format || this.getDefaultAnswerFormat();
  }

  /**
   * Get detail level preferences
   */
  public getDetailLevelPreferences(): DetailLevelPreferences {
    return this.profile?.detail_level || this.getDefaultDetailLevel();
  }

  /**
   * Get verification preferences
   */
  public getVerificationPreferences(): VerificationPreferences {
    return this.profile?.verification || this.getDefaultVerification();
  }

  /**
   * Should show proactive answers?
   */
  public shouldShowProactive(questionCategory: QuestionCategory): boolean {
    if (!this.profile) return false;

    // Check if user has asked this category 3+ times
    const categoryCount = this.profile.frequent_questions
      .filter(q => q.category === questionCategory)
      .reduce((sum, q) => sum + q.count, 0);

    return categoryCount >= 3;
  }

  /**
   * Update frequent questions
   */
  private updateFrequentQuestions(pattern: ConversationPattern): void {
    if (!this.profile) return;

    const existing = this.profile.frequent_questions.find(
      q => q.question === pattern.question_normalized
    );

    if (existing) {
      existing.count++;
    } else {
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
  private updateAnswerFormatPreferences(pattern: ConversationPattern): void {
    if (!this.profile) return;

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
  private updateVerificationPreferences(pattern: ConversationPattern): void {
    if (!this.profile) return;

    if (pattern.question_category === 'verification') {
      this.profile.verification.double_checks_claims = true;
      this.profile.verification.asks_for_proof = true;
      this.profile.verification.verification_frequency = 'frequent';

      // Lower trust level if asking verification questions
      if (pattern.occurrences >= 3) {
        this.profile.verification.trust_level = 'low';
      } else if (pattern.occurrences >= 2) {
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
  private updateDetailLevelPreferences(pattern: ConversationPattern): void {
    if (!this.profile) return;

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
  private updateInformationPriorities(pattern: ConversationPattern): void {
    if (!this.profile) return;

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
        priorities.show_first = priorities.show_first.slice(0, 5);  // Keep top 5
      }
    }
  }

  /**
   * Load or create user profile
   */
  private loadOrCreateProfile(): void {
    if (fs.existsSync(this.profileFile)) {
      try {
        const content = fs.readFileSync(this.profileFile, 'utf-8');
        this.profile = JSON.parse(content);
        this.logger.info(`[User Interaction Learner] Loaded profile for ${this.userId}`);
        return;
      } catch (error) {
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
  private async saveProfile(): Promise<void> {
    if (!this.profile) return;

    this.profile.last_updated = new Date().toISOString();

    try {
      const content = JSON.stringify(this.profile, null, 2);
      fs.writeFileSync(this.profileFile, content);
    } catch (error) {
      this.logger.error('Failed to save user profile', { error });
    }
  }

  /**
   * Create default profile
   */
  private createDefaultProfile(): UserProfile {
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
  private getDefaultAnswerFormat(): AnswerFormatPreferences {
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
  private getDefaultDetailLevel(): DetailLevelPreferences {
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
  private getDefaultVerification(): VerificationPreferences {
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
  private getDefaultCommunicationStyle(): CommunicationStylePreferences {
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
  private getDefaultInformationPriorities(): InformationPriorities {
    return {
      always_include: [],
      never_include: [],
      show_first: [],
      show_last: []
    };
  }
}
