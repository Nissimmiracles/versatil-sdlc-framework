/**
 * VERSATIL Framework - Epic Conversation Analyzer
 * NLP-based epic detection from user conversations
 *
 * Features:
 * - Detects epic-level requests in natural language conversations
 * - Extracts objectives, requirements, and constraints
 * - Identifies technical stack and architecture hints
 * - Determines priority and complexity
 * - RAG-based context enrichment
 * - Links to PROJECT_MINDSET.md for alignment
 *
 * Triggers Epic Flywheel:
 * Conversation → Epic Detection → Alex-BA (requirements) → Sarah-PM (tasks)
 * → Marcus/James (implementation) → Maria (validation)
 */

import { EventEmitter } from 'events';
import { EnhancedVectorMemoryStore } from '../rag/enhanced-vector-memory-store.js';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface EpicDetectionResult {
  isEpic: boolean;
  confidence: number; // 0-1
  epicType: 'feature' | 'enhancement' | 'refactoring' | 'bugfix' | 'infrastructure' | 'unknown';

  // Extracted information
  title: string;
  description: string;
  objectives: string[];
  requirements: ExtractedRequirement[];
  constraints: string[];
  techStack: string[];

  // Classification
  priority: 'p0-critical' | 'p1-high' | 'p2-medium' | 'p3-low';
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  estimatedEffort: {
    development: number; // Person-days
    testing: number;
    deployment: number;
  };

  // Context
  relatedConversations: string[]; // Conversation IDs
  similarEpics: string[]; // Epic IDs from RAG
  mindsetAlignment?: boolean;

  // Metadata
  detectedKeywords: string[];
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  reasoning: string[];
}

export interface ExtractedRequirement {
  id: string;
  type: 'functional' | 'non-functional' | 'security' | 'performance' | 'ux' | 'business';
  description: string;
  priority: 'must-have' | 'should-have' | 'nice-to-have';
  source: 'explicit' | 'inferred';
  confidence: number; // 0-1
}

export interface AnalysisStats {
  totalConversations: number;
  epicsDetected: number;
  falsePositives: number;
  averageConfidence: number;
  averageProcessingTime: number;
}

export class EpicConversationAnalyzer extends EventEmitter {
  private vectorStore: EnhancedVectorMemoryStore;
  private detectionHistory: Map<string, EpicDetectionResult> = new Map();
  private stats: AnalysisStats = {
    totalConversations: 0,
    epicsDetected: 0,
    falsePositives: 0,
    averageConfidence: 0,
    averageProcessingTime: 0
  };
  private processingTimes: number[] = [];
  private confidenceScores: number[] = [];

  // Epic detection keywords and patterns
  private readonly EPIC_KEYWORDS = {
    high: ['implement', 'create', 'build', 'add feature', 'new feature', 'epic', 'major'],
    medium: ['enhance', 'improve', 'refactor', 'optimize', 'update'],
    low: ['fix', 'bug', 'issue', 'small', 'minor', 'quick']
  };

  private readonly URGENCY_KEYWORDS = {
    critical: ['urgent', 'critical', 'asap', 'emergency', 'production', 'blocking'],
    high: ['important', 'needed', 'required', 'priority'],
    medium: ['should', 'would like', 'want'],
    low: ['nice to have', 'someday', 'eventually', 'consider']
  };

  private readonly TECH_STACK_PATTERNS = [
    // Frontend
    /\b(react|vue|angular|svelte|next\.?js|nuxt)\b/gi,
    // Backend
    /\b(node\.?js|express|fastify|nest\.?js|django|flask|rails|spring)\b/gi,
    // Databases
    /\b(postgres|postgresql|mysql|mongodb|redis|dynamodb|supabase)\b/gi,
    // Cloud
    /\b(aws|azure|gcp|vercel|netlify|heroku)\b/gi,
    // Other
    /\b(docker|kubernetes|graphql|rest\s?api|websocket)\b/gi
  ];

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super();
    this.vectorStore = vectorStore || new EnhancedVectorMemoryStore();
  }

  async initialize(): Promise<void> {
    console.log('🎯 Epic Conversation Analyzer initializing...');

    // Load historical epic patterns from RAG
    await this.loadHistoricalEpics();

    this.emit('analyzer:initialized');
    console.log('✅ Epic Conversation Analyzer ready');
  }

  /**
   * Analyze conversation for epic detection (main method)
   */
  async analyzeConversation(messages: ConversationMessage[]): Promise<EpicDetectionResult> {
    const startTime = Date.now();
    this.stats.totalConversations++;

    console.log(`🎯 Analyzing conversation (${messages.length} messages)...`);

    // Combine all user messages for analysis
    const userMessages = messages.filter(m => m.role === 'user');
    const conversationText = userMessages.map(m => m.content).join('\n');

    // STEP 1: Initial epic detection
    const isEpic = this.detectEpicIntent(conversationText);
    const confidence = this.calculateConfidence(conversationText, isEpic);

    console.log(`   ${isEpic ? '✅' : '❌'} Epic detected: ${isEpic ? 'YES' : 'NO'} (${(confidence * 100).toFixed(1)}% confidence)`);

    if (!isEpic || confidence < 0.5) {
      // Not an epic - return early
      return this.createNonEpicResult(conversationText, confidence);
    }

    // STEP 2: Extract epic details
    const epicType = this.classifyEpicType(conversationText);
    const title = this.extractTitle(conversationText);
    const description = this.extractDescription(conversationText);
    const objectives = this.extractObjectives(conversationText);
    const requirements = this.extractRequirements(conversationText);
    const constraints = this.extractConstraints(conversationText);
    const techStack = this.extractTechStack(conversationText);

    console.log(`   Type: ${epicType}`);
    console.log(`   Title: ${title}`);
    console.log(`   Requirements: ${requirements.length}`);
    console.log(`   Tech stack: ${techStack.join(', ')}`);

    // STEP 3: Classify priority and complexity
    const priority = this.determinePriority(conversationText);
    const complexity = this.estimateComplexity(requirements, techStack);
    const estimatedEffort = this.estimateEffort(complexity, requirements.length);

    console.log(`   Priority: ${priority} | Complexity: ${complexity}`);
    console.log(`   Estimated effort: ${estimatedEffort.development}d dev, ${estimatedEffort.testing}d test`);

    // STEP 4: Enrich with RAG context
    const similarEpics = await this.querySimilarEpics(conversationText);
    const relatedConversations = await this.queryRelatedConversations(conversationText);

    console.log(`   Similar epics: ${similarEpics.length} | Related conversations: ${relatedConversations.length}`);

    // STEP 5: Check mindset alignment (quick check)
    const mindsetAlignment = await this.checkMindsetAlignment(title, description, techStack);

    console.log(`   Mindset alignment: ${mindsetAlignment ? '✅ ALIGNED' : '⚠️  CONFLICTS'}`);

    // STEP 6: Sentiment analysis
    const sentiment = this.analyzeSentiment(conversationText);
    const detectedKeywords = this.extractKeywords(conversationText);

    // Create result
    const result: EpicDetectionResult = {
      isEpic: true,
      confidence,
      epicType,
      title,
      description,
      objectives,
      requirements,
      constraints,
      techStack,
      priority,
      complexity,
      estimatedEffort,
      relatedConversations,
      similarEpics,
      mindsetAlignment,
      detectedKeywords,
      sentiment,
      reasoning: this.generateReasoning(conversationText, isEpic, confidence, epicType)
    };

    // Store in history and RAG
    const conversationId = messages[0]?.id || `conv-${Date.now()}`;
    this.detectionHistory.set(conversationId, result);
    await this.storeEpicPattern(conversationText, result);

    // Update stats
    const processingTime = Date.now() - startTime;
    this.recordProcessingTime(processingTime);
    this.recordConfidence(confidence);
    this.stats.epicsDetected++;

    this.emit('epic:detected', {
      conversationId,
      epicType,
      confidence,
      processingTime
    });

    console.log(`✅ Epic analysis complete (${processingTime}ms)`);

    return result;
  }

  /**
   * Detect epic intent using keyword patterns
   */
  private detectEpicIntent(text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check for high-confidence epic keywords
    const highKeywords = this.EPIC_KEYWORDS.high.filter(k => lowerText.includes(k));
    if (highKeywords.length >= 2) return true;

    // Check for medium keywords with sufficient context
    const mediumKeywords = this.EPIC_KEYWORDS.medium.filter(k => lowerText.includes(k));
    if (mediumKeywords.length >= 1 && text.length > 100) return true;

    // Check for explicit "epic" mention
    if (lowerText.includes('epic')) return true;

    // Check for feature request patterns
    const featurePatterns = [
      /\bi want to (add|create|build|implement)/i,
      /\bwe need (a|an|to) (new|implement|add)/i,
      /\bcan (you|we) (add|create|build|implement)/i,
      /\blet's (add|create|build|implement)/i
    ];

    return featurePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(text: string, isEpic: boolean): number {
    if (!isEpic) return 0.1;

    let confidence = 0.5; // Base confidence

    const lowerText = text.toLowerCase();

    // Factor 1: Epic keywords (max +0.3)
    const epicKeywordCount = this.EPIC_KEYWORDS.high.filter(k => lowerText.includes(k)).length;
    confidence += Math.min(0.3, epicKeywordCount * 0.1);

    // Factor 2: Length (longer = more detail = higher confidence)
    if (text.length > 200) confidence += 0.1;
    if (text.length > 500) confidence += 0.1;

    // Factor 3: Structure (objectives, requirements mentioned)
    if (/\b(objectives?|goals?|requirements?|must\s?have)\b/i.test(text)) {
      confidence += 0.1;
    }

    // Factor 4: Tech stack mentioned
    if (this.TECH_STACK_PATTERNS.some(p => p.test(text))) {
      confidence += 0.1;
    }

    return Math.min(1, confidence);
  }

  /**
   * Classify epic type
   */
  private classifyEpicType(text: string): EpicDetectionResult['epicType'] {
    const lowerText = text.toLowerCase();

    if (/(new|add|create|build)\s+(feature|functionality)/i.test(text)) return 'feature';
    if (/(enhance|improve|optimize|update|upgrade)/i.test(text)) return 'enhancement';
    if (/(refactor|restructure|reorganize|clean\s?up)/i.test(text)) return 'refactoring';
    if (/(fix|bug|issue|problem|error)/i.test(text)) return 'bugfix';
    if (/(infrastructure|deployment|ci\/cd|pipeline|docker|kubernetes)/i.test(text)) return 'infrastructure';

    return 'unknown';
  }

  /**
   * Extract title from conversation
   */
  private extractTitle(text: string): string {
    // Try to find explicit title
    const titleMatch = text.match(/^title:\s*(.+)$/im) || text.match(/^#\s+(.+)$/m);
    if (titleMatch) return titleMatch[1].trim();

    // Extract from first sentence
    const firstSentence = text.split(/[.!?]/)[0];
    if (firstSentence.length < 100) {
      return firstSentence.trim();
    }

    // Generate from key actions
    const actionMatch = text.match(/\b(implement|create|add|build|enhance)\s+(.{1,50})/i);
    if (actionMatch) {
      return `${actionMatch[1]} ${actionMatch[2]}`.trim();
    }

    return 'Untitled Epic';
  }

  /**
   * Extract description from conversation
   */
  private extractDescription(text: string): string {
    // Remove common prefixes
    let description = text.replace(/^(please|can you|i want|we need|let's)/gi, '').trim();

    // Take first 500 characters
    if (description.length > 500) {
      description = description.substring(0, 500) + '...';
    }

    return description;
  }

  /**
   * Extract objectives
   */
  private extractObjectives(text: string): string[] {
    const objectives: string[] = [];

    // Look for explicit objectives
    const objectiveSection = text.match(/objectives?:?\s*\n([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i);
    if (objectiveSection) {
      const lines = objectiveSection[1].split('\n');
      objectives.push(...lines.filter(l => l.trim().startsWith('-') || l.trim().startsWith('*')).map(l => l.replace(/^[-*]\s*/, '').trim()));
    }

    // Look for goal patterns
    const goalMatches = text.matchAll(/\b(goal|objective|aim)\s+is\s+to\s+([^.!?]+)/gi);
    for (const match of goalMatches) {
      objectives.push(match[2].trim());
    }

    // If no objectives found, infer from requirements
    if (objectives.length === 0) {
      const actionMatch = text.match(/\b(implement|create|add|build|enhance)\s+([^.!?]+)/i);
      if (actionMatch) {
        objectives.push(actionMatch[0].trim());
      }
    }

    return objectives.slice(0, 5); // Max 5 objectives
  }

  /**
   * Extract requirements
   */
  private extractRequirements(text: string): ExtractedRequirement[] {
    const requirements: ExtractedRequirement[] = [];
    let reqId = 1;

    // Explicit requirements
    const reqSection = text.match(/requirements?:?\s*\n([\s\S]+?)(?:\n\n|\n[A-Z]|$)/i);
    if (reqSection) {
      const lines = reqSection[1].split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          requirements.push({
            id: `req-${reqId++}`,
            type: this.classifyRequirementType(line),
            description: line.replace(/^[-*]\s*/, '').trim(),
            priority: 'must-have',
            source: 'explicit',
            confidence: 0.9
          });
        }
      }
    }

    // Infer from "must", "should", "need" statements
    const mustHaveMatches = text.matchAll(/\b(must|need\s+to|required\s+to)\s+([^.!?]+)/gi);
    for (const match of mustHaveMatches) {
      requirements.push({
        id: `req-${reqId++}`,
        type: 'functional',
        description: match[2].trim(),
        priority: 'must-have',
        source: 'inferred',
        confidence: 0.7
      });
    }

    const shouldHaveMatches = text.matchAll(/\bshould\s+([^.!?]+)/gi);
    for (const match of shouldHaveMatches) {
      requirements.push({
        id: `req-${reqId++}`,
        type: 'functional',
        description: match[1].trim(),
        priority: 'should-have',
        source: 'inferred',
        confidence: 0.6
      });
    }

    // Performance requirements
    const perfMatches = text.matchAll(/\b(latency|response\s+time|throughput|performance).+?(\d+)\s*(ms|seconds?|req\/s)/gi);
    for (const match of perfMatches) {
      requirements.push({
        id: `req-${reqId++}`,
        type: 'performance',
        description: match[0].trim(),
        priority: 'must-have',
        source: 'explicit',
        confidence: 0.8
      });
    }

    // Security requirements
    if (/\b(auth|authentication|authorization|security|encrypt|oauth|jwt)\b/i.test(text)) {
      requirements.push({
        id: `req-${reqId++}`,
        type: 'security',
        description: 'Implement secure authentication and authorization',
        priority: 'must-have',
        source: 'inferred',
        confidence: 0.7
      });
    }

    return requirements;
  }

  /**
   * Classify requirement type
   */
  private classifyRequirementType(text: string): ExtractedRequirement['type'] {
    const lowerText = text.toLowerCase();

    if (/\b(performance|latency|speed|throughput|scalability)\b/i.test(text)) return 'performance';
    if (/\b(security|auth|encrypt|permission|access\s?control)\b/i.test(text)) return 'security';
    if (/\b(ui|ux|user\s?experience|usability|accessibility)\b/i.test(text)) return 'ux';
    if (/\b(business|revenue|customer|value|roi)\b/i.test(text)) return 'business';
    if (/\b(availability|reliability|uptime|backup|disaster\s?recovery)\b/i.test(text)) return 'non-functional';

    return 'functional';
  }

  /**
   * Extract constraints
   */
  private extractConstraints(text: string): string[] {
    const constraints: string[] = [];

    // Look for "cannot", "must not", "avoid" patterns
    const cannotMatches = text.matchAll(/\b(cannot|can't|must\s+not|avoid|don't)\s+([^.!?]+)/gi);
    for (const match of cannotMatches) {
      constraints.push(match[0].trim());
    }

    // Look for deadline constraints
    const deadlineMatches = text.matchAll(/\b(deadline|due\s+by|needed\s+by)\s+([^.!?]+)/gi);
    for (const match of deadlineMatches) {
      constraints.push(match[0].trim());
    }

    // Look for budget constraints
    if (/\b(budget|cost|expensive|cheap)\b/i.test(text)) {
      constraints.push('Budget constraints apply');
    }

    return constraints;
  }

  /**
   * Extract tech stack
   */
  private extractTechStack(text: string): string[] {
    const techStack: string[] = [];

    for (const pattern of this.TECH_STACK_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const tech = match[0].toLowerCase().replace(/\./g, '');
        if (!techStack.includes(tech)) {
          techStack.push(tech);
        }
      }
    }

    return techStack;
  }

  /**
   * Determine priority
   */
  private determinePriority(text: string): EpicDetectionResult['priority'] {
    const lowerText = text.toLowerCase();

    // Check urgency keywords
    const hasCritical = this.URGENCY_KEYWORDS.critical.some(k => lowerText.includes(k));
    if (hasCritical) return 'p0-critical';

    const hasHigh = this.URGENCY_KEYWORDS.high.some(k => lowerText.includes(k));
    if (hasHigh) return 'p1-high';

    const hasLow = this.URGENCY_KEYWORDS.low.some(k => lowerText.includes(k));
    if (hasLow) return 'p3-low';

    return 'p2-medium'; // Default
  }

  /**
   * Estimate complexity
   */
  private estimateComplexity(requirements: ExtractedRequirement[], techStack: string[]): EpicDetectionResult['complexity'] {
    let complexityScore = 0;

    // Factor 1: Number of requirements
    if (requirements.length >= 10) complexityScore += 3;
    else if (requirements.length >= 5) complexityScore += 2;
    else complexityScore += 1;

    // Factor 2: Tech stack diversity
    if (techStack.length >= 5) complexityScore += 2;
    else if (techStack.length >= 3) complexityScore += 1;

    // Factor 3: Security/performance requirements
    const hasSecurityReqs = requirements.some(r => r.type === 'security');
    const hasPerfReqs = requirements.some(r => r.type === 'performance');
    if (hasSecurityReqs) complexityScore += 1;
    if (hasPerfReqs) complexityScore += 1;

    // Classify
    if (complexityScore >= 6) return 'very-high';
    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Estimate effort
   */
  private estimateEffort(complexity: string, requirementCount: number): EpicDetectionResult['estimatedEffort'] {
    const baseEffort = {
      'low': { development: 5, testing: 2, deployment: 1 },
      'medium': { development: 15, testing: 5, deployment: 2 },
      'high': { development: 30, testing: 10, deployment: 5 },
      'very-high': { development: 60, testing: 20, deployment: 10 }
    }[complexity] || { development: 15, testing: 5, deployment: 2 };

    // Adjust by requirement count
    const multiplier = Math.max(1, requirementCount / 5);

    return {
      development: Math.ceil(baseEffort.development * multiplier),
      testing: Math.ceil(baseEffort.testing * multiplier),
      deployment: Math.ceil(baseEffort.deployment * multiplier)
    };
  }

  /**
   * Query similar epics from RAG
   */
  private async querySimilarEpics(text: string): Promise<string[]> {
    try {
      const results = await this.vectorStore.queryMemory(text, 'epic-patterns', 5);
      return results.map(r => r.metadata?.epicId || r.metadata?.title || 'unknown');
    } catch (error) {
      return [];
    }
  }

  /**
   * Query related conversations from RAG
   */
  private async queryRelatedConversations(text: string): Promise<string[]> {
    try {
      const results = await this.vectorStore.queryMemory(text, 'conversations', 3);
      return results.map(r => r.metadata?.conversationId || 'unknown');
    } catch (error) {
      return [];
    }
  }

  /**
   * Quick mindset alignment check
   */
  private async checkMindsetAlignment(title: string, description: string, techStack: string[]): Promise<boolean> {
    // TODO: Integrate with MindsetContextEngine for full check
    // For now, simple keyword-based check
    const text = `${title} ${description} ${techStack.join(' ')}`.toLowerCase();

    // Red flags (common anti-patterns)
    const redFlags = ['legacy', 'monolith', 'manual deployment', 'no tests'];
    const hasRedFlags = redFlags.some(flag => text.includes(flag));

    return !hasRedFlags; // Aligned if no red flags
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(text: string): EpicDetectionResult['sentiment'] {
    const lowerText = text.toLowerCase();

    // Urgent
    if (this.URGENCY_KEYWORDS.critical.some(k => lowerText.includes(k))) {
      return 'urgent';
    }

    // Negative
    const negativeWords = ['problem', 'issue', 'broken', 'failing', 'slow', 'bad'];
    if (negativeWords.some(w => lowerText.includes(w))) {
      return 'negative';
    }

    // Positive
    const positiveWords = ['excited', 'great', 'awesome', 'love', 'perfect'];
    if (positiveWords.some(w => lowerText.includes(w))) {
      return 'positive';
    }

    return 'neutral';
  }

  /**
   * Extract keywords
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Extract all epic keywords found
    for (const [level, words] of Object.entries(this.EPIC_KEYWORDS)) {
      for (const word of words) {
        if (text.toLowerCase().includes(word)) {
          keywords.push(word);
        }
      }
    }

    // Extract urgency keywords
    for (const [level, words] of Object.entries(this.URGENCY_KEYWORDS)) {
      for (const word of words) {
        if (text.toLowerCase().includes(word)) {
          keywords.push(word);
        }
      }
    }

    return [...new Set(keywords)]; // Deduplicate
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(text: string, isEpic: boolean, confidence: number, epicType: string): string[] {
    const reasoning: string[] = [];

    if (!isEpic) {
      reasoning.push('No epic-level intent detected (likely a question or small task)');
      return reasoning;
    }

    reasoning.push(`Classified as ${epicType} with ${(confidence * 100).toFixed(0)}% confidence`);

    const epicKeywords = this.EPIC_KEYWORDS.high.filter(k => text.toLowerCase().includes(k));
    if (epicKeywords.length > 0) {
      reasoning.push(`Epic keywords detected: ${epicKeywords.join(', ')}`);
    }

    if (text.length > 200) {
      reasoning.push('Detailed description provided (indicates epic-level scope)');
    }

    if (/\b(requirements?|objectives?|goals?)\b/i.test(text)) {
      reasoning.push('Explicit requirements/objectives mentioned');
    }

    return reasoning;
  }

  /**
   * Create non-epic result
   */
  private createNonEpicResult(text: string, confidence: number): EpicDetectionResult {
    return {
      isEpic: false,
      confidence,
      epicType: 'unknown',
      title: '',
      description: text.substring(0, 200),
      objectives: [],
      requirements: [],
      constraints: [],
      techStack: [],
      priority: 'p3-low',
      complexity: 'low',
      estimatedEffort: { development: 0, testing: 0, deployment: 0 },
      relatedConversations: [],
      similarEpics: [],
      detectedKeywords: [],
      sentiment: 'neutral',
      reasoning: ['No epic-level intent detected']
    };
  }

  /**
   * Store epic pattern in RAG
   */
  private async storeEpicPattern(text: string, result: EpicDetectionResult): Promise<void> {
    const pattern = {
      epicType: result.epicType,
      title: result.title,
      priority: result.priority,
      complexity: result.complexity,
      requirementsCount: result.requirements.length,
      techStack: result.techStack,
      confidence: result.confidence,
      timestamp: Date.now()
    };

    try {
      await this.vectorStore.storeMemory(text, 'epic-patterns', pattern);
    } catch (error) {
      console.warn('Failed to store epic pattern in RAG:', error);
    }
  }

  /**
   * Load historical epics from RAG
   */
  private async loadHistoricalEpics(): Promise<void> {
    try {
      const epics = await this.vectorStore.queryMemory('epic patterns', 'epic-patterns', 100);
      console.log(`   📚 Loaded ${epics.length} historical epic patterns from RAG`);
    } catch (error) {
      console.warn('   ⚠️  Failed to load historical epics (starting fresh)');
    }
  }

  /**
   * Record processing time
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    if (this.processingTimes.length > 100) this.processingTimes.shift();

    const sum = this.processingTimes.reduce((a, b) => a + b, 0);
    this.stats.averageProcessingTime = sum / this.processingTimes.length;
  }

  /**
   * Record confidence
   */
  private recordConfidence(confidence: number): void {
    this.confidenceScores.push(confidence);
    if (this.confidenceScores.length > 100) this.confidenceScores.shift();

    const sum = this.confidenceScores.reduce((a, b) => a + b, 0);
    this.stats.averageConfidence = sum / this.confidenceScores.length;
  }

  /**
   * Get statistics
   */
  getStatistics(): AnalysisStats {
    return { ...this.stats };
  }

  /**
   * Get detection result
   */
  getResult(conversationId: string): EpicDetectionResult | undefined {
    return this.detectionHistory.get(conversationId);
  }

  /**
   * Shutdown analyzer
   */
  async shutdown(): Promise<void> {
    this.detectionHistory.clear();
    this.emit('analyzer:shutdown');
    console.log('🛑 Epic Conversation Analyzer shut down');
  }
}

// Export singleton instance
export const globalEpicConversationAnalyzer = new EpicConversationAnalyzer();
