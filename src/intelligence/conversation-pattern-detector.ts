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

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { GuardianLogger } from '../agents/guardian/guardian-logger.js';

export type QuestionCategory =
  | 'status'           // "documented or built?", "r built?"
  | 'implementation'   // "how does it work?", "where is the code?"
  | 'documentation'    // "where is the docs?", "is it documented?"
  | 'availability'     // "accessible via /update?", "public?"
  | 'verification'     // "sure?", "are you certain?"
  | 'comparison'       // "before vs after", "what changed?"
  | 'action_required'; // "what do I need to do?", "next steps?"

export type UserIntent =
  | 'verify_implementation'
  | 'verify_confidence'
  | 'check_public_availability'
  | 'quick_status_check'
  | 'understand_impact'
  | 'get_proof'
  | 'understand_next_steps';

export interface ConversationPattern {
  id: string;
  question_fingerprint: string;  // Semantic hash for matching
  question_text: string;
  question_normalized: string;   // Lowercased, trimmed
  question_category: QuestionCategory;
  context: {
    feature?: string;           // e.g., "v7.12.0 approval workflow"
    user_intent: UserIntent;
    urgency: 'low' | 'medium' | 'high';
    conversation_turn: number;  // Position in conversation
    follows_feature_claim: boolean;
  };
  occurrences: number;
  first_asked: string;
  last_asked: string;
  typical_answer_components: string[];  // What user expects in answer
  answer_provided?: string;  // Last answer given
  user_satisfaction?: 'unknown' | 'satisfied' | 'asked_again';
}

export interface QuestionMatch {
  pattern: ConversationPattern;
  similarity: number;  // 0-100
  exact_match: boolean;
}

/**
 * Conversation Pattern Detector
 */
export class ConversationPatternDetector {
  private logger: GuardianLogger;
  private patternsFile: string;
  private patternsCache: Map<string, ConversationPattern> = new Map();

  // Common question patterns (for bootstrap)
  private readonly commonPatterns = new Map<string, {
    category: QuestionCategory;
    intent: UserIntent;
    typical_answer_components: string[];
  }>([
    ['documented or built', {
      category: 'status',
      intent: 'verify_implementation',
      typical_answer_components: ['implementation_status', 'file_locations', 'line_counts', 'documentation_status']
    }],
    ['r built', {
      category: 'status',
      intent: 'quick_status_check',
      typical_answer_components: ['yes_no_answer', 'quick_evidence']
    }],
    ['sure', {
      category: 'verification',
      intent: 'verify_confidence',
      typical_answer_components: ['verification_proof', 'file_existence', 'code_integration']
    }],
    ['accessible via update', {
      category: 'availability',
      intent: 'check_public_availability',
      typical_answer_components: ['public_status', 'github_status', 'action_needed']
    }],
    ['accessible via /update', {
      category: 'availability',
      intent: 'check_public_availability',
      typical_answer_components: ['public_status', 'github_status', 'action_needed']
    }],
    ['in public repo', {
      category: 'availability',
      intent: 'check_public_availability',
      typical_answer_components: ['public_status', 'github_status']
    }],
    ['where is', {
      category: 'implementation',
      intent: 'get_proof',
      typical_answer_components: ['file_locations', 'directory_structure']
    }],
    ['how does it work', {
      category: 'implementation',
      intent: 'understand_impact',
      typical_answer_components: ['architecture', 'workflow_diagram', 'examples']
    }],
    ['what do i need to do', {
      category: 'action_required',
      intent: 'understand_next_steps',
      typical_answer_components: ['action_items', 'commands', 'configuration']
    }]
  ]);

  constructor() {
    this.logger = GuardianLogger.getInstance();

    const versatilHome = path.join(os.homedir(), '.versatil');
    const patternsDir = path.join(versatilHome, 'learning', 'user-questions');

    if (!fs.existsSync(patternsDir)) {
      fs.mkdirSync(patternsDir, { recursive: true });
    }

    this.patternsFile = path.join(patternsDir, 'patterns.jsonl');
    this.loadPatternsCache();
  }

  /**
   * Detect pattern from user question
   */
  public detectPattern(
    questionText: string,
    conversationContext?: {
      turn: number;
      previous_message?: string;
      feature_mentioned?: string;
    }
  ): ConversationPattern {
    const normalized = this.normalizeQuestion(questionText);
    const fingerprint = this.generateFingerprint(normalized);

    // Check if pattern exists
    const existing = this.findMatchingPattern(normalized, fingerprint);

    if (existing) {
      // Update existing pattern
      existing.occurrences++;
      existing.last_asked = new Date().toISOString();
      existing.user_satisfaction = 'asked_again';  // User asked same question again

      this.updatePattern(existing);
      return existing;
    }

    // Create new pattern
    const category = this.classifyQuestion(normalized);
    const intent = this.detectIntent(normalized, category);
    const urgency = this.detectUrgency(normalized, conversationContext);
    const answerComponents = this.detectExpectedAnswerComponents(normalized, category);

    const pattern: ConversationPattern = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      question_fingerprint: fingerprint,
      question_text: questionText,
      question_normalized: normalized,
      question_category: category,
      context: {
        feature: conversationContext?.feature_mentioned,
        user_intent: intent,
        urgency,
        conversation_turn: conversationContext?.turn || 1,
        follows_feature_claim: this.followsFeatureClaim(conversationContext?.previous_message)
      },
      occurrences: 1,
      first_asked: new Date().toISOString(),
      last_asked: new Date().toISOString(),
      typical_answer_components: answerComponents,
      user_satisfaction: 'unknown'
    };

    this.storePattern(pattern);
    return pattern;
  }

  /**
   * Find matching pattern for question
   */
  public findMatch(questionText: string): QuestionMatch | null {
    const normalized = this.normalizeQuestion(questionText);
    const fingerprint = this.generateFingerprint(normalized);

    // Check exact fingerprint match
    const exactMatch = this.patternsCache.get(fingerprint);
    if (exactMatch) {
      return {
        pattern: exactMatch,
        similarity: 100,
        exact_match: true
      };
    }

    // Check fuzzy match (Levenshtein distance)
    let bestMatch: { pattern: ConversationPattern; similarity: number } | null = null;

    for (const pattern of this.patternsCache.values()) {
      const similarity = this.calculateSimilarity(normalized, pattern.question_normalized);

      if (similarity >= 70 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { pattern, similarity };
      }
    }

    if (bestMatch) {
      return {
        pattern: bestMatch.pattern,
        similarity: bestMatch.similarity,
        exact_match: false
      };
    }

    return null;
  }

  /**
   * Get all patterns for category
   */
  public getPatternsBy Category(category: QuestionCategory): ConversationPattern[] {
    return Array.from(this.patternsCache.values())
      .filter(p => p.question_category === category)
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Get most frequent patterns
   */
  public getFrequentPatterns(limit: number = 10): ConversationPattern[] {
    return Array.from(this.patternsCache.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, limit);
  }

  /**
   * Normalize question text
   */
  private normalizeQuestion(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[?!.,;]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\b(the|a|an|is|are|was|were)\b/g, '')  // Remove common words
      .trim();
  }

  /**
   * Generate semantic fingerprint for question
   */
  private generateFingerprint(normalizedQuestion: string): string {
    // Use first 100 chars and hash for consistency
    const key = normalizedQuestion.slice(0, 100);
    return crypto.createHash('md5').update(key).digest('hex').slice(0, 16);
  }

  /**
   * Classify question into category
   */
  private classifyQuestion(normalized: string): QuestionCategory {
    // Check common patterns first
    for (const [pattern, config] of this.commonPatterns.entries()) {
      if (normalized.includes(pattern)) {
        return config.category;
      }
    }

    // Keyword-based classification
    if (/\b(documented|built|implemented|created|written|coded)\b/.test(normalized)) {
      return 'status';
    }

    if (/\b(sure|certain|confident|verified|confirmed)\b/.test(normalized)) {
      return 'verification';
    }

    if (/\b(accessible|available|public|update|install|download)\b/.test(normalized)) {
      return 'availability';
    }

    if (/\b(where|location|path|file|directory)\b/.test(normalized)) {
      return 'implementation';
    }

    if (/\b(docs|documentation|readme|guide|tutorial)\b/.test(normalized)) {
      return 'documentation';
    }

    if (/\b(before|after|changed|difference|compare)\b/.test(normalized)) {
      return 'comparison';
    }

    if (/\b(need|do|action|next|steps|required)\b/.test(normalized)) {
      return 'action_required';
    }

    return 'status';  // Default
  }

  /**
   * Detect user intent from question
   */
  private detectIntent(normalized: string, category: QuestionCategory): UserIntent {
    // Check common patterns
    for (const [pattern, config] of this.commonPatterns.entries()) {
      if (normalized.includes(pattern)) {
        return config.intent;
      }
    }

    // Intent by category
    switch (category) {
      case 'status':
        return normalized.length < 10 ? 'quick_status_check' : 'verify_implementation';
      case 'verification':
        return 'verify_confidence';
      case 'availability':
        return 'check_public_availability';
      case 'implementation':
        return 'get_proof';
      case 'action_required':
        return 'understand_next_steps';
      default:
        return 'verify_implementation';
    }
  }

  /**
   * Detect urgency from question
   */
  private detectUrgency(
    normalized: string,
    context?: { turn: number; previous_message?: string }
  ): 'low' | 'medium' | 'high' {
    // High urgency indicators
    if (/\b(urgent|asap|immediately|now|critical)\b/.test(normalized)) {
      return 'high';
    }

    // Question length (shorter = more urgent)
    if (normalized.length < 10) {
      return 'high';  // "sure?", "r built?"
    }

    // Asked early in conversation
    if (context && context.turn <= 2) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Detect expected answer components
   */
  private detectExpectedAnswerComponents(
    normalized: string,
    category: QuestionCategory
  ): string[] {
    // Check common patterns
    for (const [pattern, config] of this.commonPatterns.entries()) {
      if (normalized.includes(pattern)) {
        return config.typical_answer_components;
      }
    }

    // Default components by category
    switch (category) {
      case 'status':
        return ['implementation_status', 'file_locations', 'line_counts'];
      case 'verification':
        return ['verification_proof', 'file_existence', 'code_integration'];
      case 'availability':
        return ['public_status', 'github_status', 'action_needed'];
      case 'implementation':
        return ['file_locations', 'code_snippets'];
      case 'documentation':
        return ['doc_locations', 'doc_completeness'];
      case 'action_required':
        return ['action_items', 'commands'];
      default:
        return ['comprehensive_answer'];
    }
  }

  /**
   * Check if question follows feature claim
   */
  private followsFeatureClaim(previousMessage?: string): boolean {
    if (!previousMessage) return false;

    const claimPatterns = [
      /implemented/i,
      /created/i,
      /built/i,
      /added/i,
      /completed/i,
      /finished/i
    ];

    return claimPatterns.some(pattern => pattern.test(previousMessage));
  }

  /**
   * Calculate similarity between two strings (Levenshtein distance)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const distance = this.levenshteinDistance(longer, shorter);
    return Math.round(((longer.length - distance) / longer.length) * 100);
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Find matching pattern in cache
   */
  private findMatchingPattern(normalized: string, fingerprint: string): ConversationPattern | undefined {
    return this.patternsCache.get(fingerprint);
  }

  /**
   * Store pattern to file and cache
   */
  private storePattern(pattern: ConversationPattern): void {
    this.patternsCache.set(pattern.question_fingerprint, pattern);

    try {
      const line = JSON.stringify(pattern) + '\n';
      fs.appendFileSync(this.patternsFile, line);

      this.logger.info(`[Conversation Pattern] New pattern detected: ${pattern.question_text}`, {
        category: pattern.question_category,
        intent: pattern.context.user_intent,
        occurrences: pattern.occurrences
      });
    } catch (error) {
      this.logger.error('Failed to store conversation pattern', { error });
    }
  }

  /**
   * Update existing pattern
   */
  private updatePattern(pattern: ConversationPattern): void {
    this.patternsCache.set(pattern.question_fingerprint, pattern);

    // Rewrite entire file (small file, acceptable performance)
    try {
      const patterns = Array.from(this.patternsCache.values());
      const content = patterns.map(p => JSON.stringify(p)).join('\n') + '\n';
      fs.writeFileSync(this.patternsFile, content);

      this.logger.info(`[Conversation Pattern] Pattern updated: ${pattern.question_text}`, {
        occurrences: pattern.occurrences
      });
    } catch (error) {
      this.logger.error('Failed to update conversation pattern', { error });
    }
  }

  /**
   * Load patterns from file into cache
   */
  private loadPatternsCache(): void {
    if (!fs.existsSync(this.patternsFile)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.patternsFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const pattern = JSON.parse(line) as ConversationPattern;
        this.patternsCache.set(pattern.question_fingerprint, pattern);
      }

      this.logger.info(`[Conversation Pattern] Loaded ${this.patternsCache.size} patterns from cache`);
    } catch (error) {
      this.logger.error('Failed to load conversation patterns cache', { error });
    }
  }
}
