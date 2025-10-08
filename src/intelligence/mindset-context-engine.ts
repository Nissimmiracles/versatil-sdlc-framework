/**
 * Mindset Context Engine
 * Preserves project strategy, business goals, and design philosophy
 * Ensures all work aligns with strategic vision
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { vectorMemoryStore, RAGQuery } from '../rag/vector-memory-store.js';

export interface ProjectMindset {
  vision: string;
  businessGoals: string[];
  targetUsers: string[];
  successMetrics: string[];
  constraints: string[];
  designPrinciples: string[];
  techPhilosophy: string[];
  strategicDecisions: StrategyDecision[];
}

export interface StrategyDecision {
  id: string;
  title: string;
  decision: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: number;
  category: 'technical' | 'business' | 'design' | 'architecture';
}

export interface AlignmentCheck {
  aligned: boolean;
  confidence: number;
  conflicts: MindsetConflict[];
  suggestions: string[];
  autoReject: boolean;
}

export interface MindsetConflict {
  type: 'strategic' | 'technical' | 'design' | 'business';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  conflictingDecision: StrategyDecision;
  suggestedAlternative: string;
}

export class MindsetContextEngine extends EventEmitter {
  private mindset: ProjectMindset | null = null;
  private mindsetPath: string;

  constructor(projectPath: string = process.cwd()) {
    super();
    this.mindsetPath = join(projectPath, 'docs', 'context', 'PROJECT_MINDSET.md');
  }

  /**
   * Initialize mindset engine by loading project mindset
   */
  async initialize(): Promise<void> {
    try {
      await this.loadMindset();

      if (!this.mindset) {
        console.log('📋 No PROJECT_MINDSET.md found, creating template...');
        await this.createMindsetTemplate();
      }

      console.log('🧠 Mindset Context Engine initialized');
      this.emit('initialized', { mindset: this.mindset });
    } catch (error: any) {
      console.error('❌ Failed to initialize Mindset Context Engine:', error.message);
      throw error;
    }
  }

  /**
   * Load project mindset from markdown file
   */
  async loadMindset(): Promise<ProjectMindset | null> {
    try {
      const content = await fs.readFile(this.mindsetPath, 'utf-8');
      this.mindset = this.parseMindsetFromMarkdown(content);

      // Store in RAG for querying
      await vectorMemoryStore.storeMemory({
        content: JSON.stringify(this.mindset),
        metadata: {
          documentType: 'mindset',
          timestamp: Date.now(),
          tags: ['mindset', 'strategy', 'vision', 'critical'],
          priority: 'critical'
        }
      });

      return this.mindset;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if proposed work aligns with project mindset
   */
  async checkAlignment(
    workDescription: string,
    workType: 'epic' | 'task' | 'decision' | 'architecture',
    context?: any
  ): Promise<AlignmentCheck> {
    if (!this.mindset) {
      await this.loadMindset();
    }

    if (!this.mindset) {
      return {
        aligned: true,
        confidence: 0,
        conflicts: [],
        suggestions: ['No mindset defined - create PROJECT_MINDSET.md'],
        autoReject: false
      };
    }

    console.log(`🔍 Checking alignment: ${workDescription}`);

    // Query RAG for similar past decisions
    const similarDecisions = await this.queryRelevantDecisions(workDescription);

    // Analyze conflicts
    const conflicts: MindsetConflict[] = [];

    // Check constraints
    for (const constraint of this.mindset.constraints) {
      if (this.violatesConstraint(workDescription, constraint)) {
        conflicts.push({
          type: 'strategic',
          severity: 'critical',
          description: `Violates project constraint: ${constraint}`,
          conflictingDecision: {
            id: 'constraint',
            title: 'Project Constraint',
            decision: constraint,
            rationale: 'Core project constraint',
            priority: 'critical',
            createdAt: Date.now(),
            category: 'business'
          },
          suggestedAlternative: this.suggestAlternative(workDescription, constraint)
        });
      }
    }

    // Check strategic decisions
    for (const decision of this.mindset.strategicDecisions) {
      if (this.conflictsWithDecision(workDescription, decision)) {
        conflicts.push({
          type: this.mapCategory(decision.category),
          severity: decision.priority,
          description: `Conflicts with strategic decision: ${decision.title}`,
          conflictingDecision: decision,
          suggestedAlternative: decision.decision
        });
      }
    }

    // Check tech philosophy
    for (const philosophy of this.mindset.techPhilosophy) {
      if (this.violatesPhilosophy(workDescription, philosophy)) {
        conflicts.push({
          type: 'technical',
          severity: 'high',
          description: `Violates tech philosophy: ${philosophy}`,
          conflictingDecision: {
            id: 'philosophy',
            title: 'Technical Philosophy',
            decision: philosophy,
            rationale: 'Core technical principle',
            priority: 'high',
            createdAt: Date.now(),
            category: 'technical'
          },
          suggestedAlternative: this.suggestPhilosophyAlternative(workDescription, philosophy)
        });
      }
    }

    // Calculate alignment
    const aligned = conflicts.length === 0;
    const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
    const autoReject = criticalConflicts.length > 0;

    const confidence = this.calculateConfidence(workDescription, conflicts, similarDecisions);

    const suggestions = this.generateSuggestions(conflicts, similarDecisions);

    const result: AlignmentCheck = {
      aligned,
      confidence,
      conflicts,
      suggestions,
      autoReject
    };

    // Store alignment check in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify({
        workDescription,
        workType,
        result,
        timestamp: Date.now()
      }),
      metadata: {
        documentType: 'alignment_check',
        aligned,
        conflictCount: conflicts.length,
        tags: ['alignment', 'mindset', workType],
        timestamp: Date.now()
      }
    });

    this.emit('alignment_checked', { workDescription, result });

    return result;
  }

  /**
   * Add strategic decision to mindset
   */
  async addStrategicDecision(decision: Omit<StrategyDecision, 'id' | 'createdAt'>): Promise<void> {
    if (!this.mindset) {
      await this.loadMindset();
    }

    if (!this.mindset) {
      throw new Error('Mindset not loaded');
    }

    const newDecision: StrategyDecision = {
      ...decision,
      id: `decision-${Date.now()}`,
      createdAt: Date.now()
    };

    this.mindset.strategicDecisions.push(newDecision);

    // Update mindset file
    await this.saveMindset();

    // Store in RAG
    await vectorMemoryStore.storeMemory({
      content: JSON.stringify(newDecision),
      metadata: {
        documentType: 'strategic_decision',
        category: decision.category,
        priority: decision.priority,
        tags: ['decision', 'strategy', decision.category],
        timestamp: Date.now()
      }
    });

    console.log(`📝 Strategic decision added: ${decision.title}`);
    this.emit('decision_added', newDecision);
  }

  /**
   * Query relevant decisions from RAG
   */
  private async queryRelevantDecisions(query: string): Promise<any[]> {
    const results = await vectorMemoryStore.queryMemories({
      query,
      topK: 5,
      filters: {
        tags: ['decision', 'strategy', 'mindset']
      }
    });

    return results.documents.map(doc => {
      try {
        return JSON.parse(doc.content);
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Check if work violates constraint
   */
  private violatesConstraint(work: string, constraint: string): boolean {
    const workLower = work.toLowerCase();
    const constraintLower = constraint.toLowerCase();

    // Example: "No jQuery" constraint
    if (constraintLower.includes('no jquery') && workLower.includes('jquery')) {
      return true;
    }

    // Example: "React-only" constraint
    if (constraintLower.includes('react-only') &&
        (workLower.includes('vue') || workLower.includes('angular'))) {
      return true;
    }

    // Example: "No inline styles" constraint
    if (constraintLower.includes('no inline styles') &&
        workLower.includes('inline style')) {
      return true;
    }

    // Example: "Auth0 only" constraint
    if (constraintLower.includes('auth0') &&
        (workLower.includes('oauth') || workLower.includes('google auth'))) {
      return true;
    }

    return false;
  }

  /**
   * Check if work conflicts with strategic decision
   */
  private conflictsWithDecision(work: string, decision: StrategyDecision): boolean {
    const workLower = work.toLowerCase();
    const decisionLower = decision.decision.toLowerCase();

    // Simple keyword matching
    const conflictKeywords = this.extractConflictKeywords(decisionLower);

    for (const keyword of conflictKeywords) {
      if (workLower.includes(keyword)) {
        // Found potential conflict - verify it's actually conflicting
        return this.isActualConflict(workLower, decisionLower);
      }
    }

    return false;
  }

  /**
   * Check if work violates tech philosophy
   */
  private violatesPhilosophy(work: string, philosophy: string): boolean {
    const workLower = work.toLowerCase();
    const philosophyLower = philosophy.toLowerCase();

    // Example: "Favor composition over inheritance"
    if (philosophyLower.includes('composition over inheritance') &&
        workLower.includes('extends') && workLower.includes('class')) {
      return true;
    }

    // Example: "Functional programming preferred"
    if (philosophyLower.includes('functional') &&
        workLower.includes('class') && workLower.includes('stateful')) {
      return true;
    }

    return false;
  }

  /**
   * Extract conflict keywords from decision
   */
  private extractConflictKeywords(decision: string): string[] {
    const keywords: string[] = [];

    // Extract technology names
    const techPattern = /(react|vue|angular|jquery|auth0|google|stripe|vercel)/gi;
    const matches = decision.match(techPattern);
    if (matches) {
      keywords.push(...matches.map(m => m.toLowerCase()));
    }

    return keywords;
  }

  /**
   * Verify if it's an actual conflict
   */
  private isActualConflict(work: string, decision: string): boolean {
    // If decision says "use Auth0" and work mentions "Google OAuth", it's a conflict
    if (decision.includes('auth0') && work.includes('google')) {
      return true;
    }

    // If decision says "React-only" and work mentions "Vue", it's a conflict
    if (decision.includes('react') && (work.includes('vue') || work.includes('angular'))) {
      return true;
    }

    return false;
  }

  /**
   * Suggest alternative that aligns with constraint
   */
  private suggestAlternative(work: string, constraint: string): string {
    if (constraint.toLowerCase().includes('auth0')) {
      return 'Use Auth0 for authentication (aligns with enterprise strategy)';
    }

    if (constraint.toLowerCase().includes('react-only')) {
      return 'Use React instead (project constraint)';
    }

    if (constraint.toLowerCase().includes('no inline styles')) {
      return 'Use Tailwind CSS classes instead of inline styles';
    }

    return `Modify approach to align with: ${constraint}`;
  }

  /**
   * Suggest alternative that aligns with philosophy
   */
  private suggestPhilosophyAlternative(work: string, philosophy: string): string {
    if (philosophy.toLowerCase().includes('composition')) {
      return 'Use composition pattern with React hooks instead of class inheritance';
    }

    if (philosophy.toLowerCase().includes('functional')) {
      return 'Use functional components and hooks instead of class components';
    }

    return `Refactor to align with: ${philosophy}`;
  }

  /**
   * Calculate alignment confidence score
   */
  private calculateConfidence(
    work: string,
    conflicts: MindsetConflict[],
    similarDecisions: any[]
  ): number {
    if (conflicts.length === 0) {
      return 0.95; // High confidence, no conflicts
    }

    const criticalConflicts = conflicts.filter(c => c.severity === 'critical').length;
    const highConflicts = conflicts.filter(c => c.severity === 'high').length;

    if (criticalConflicts > 0) {
      return 0.1; // Very low confidence, critical conflicts
    }

    if (highConflicts > 0) {
      return 0.4; // Low confidence, high severity conflicts
    }

    return 0.7; // Medium confidence, only medium/low conflicts
  }

  /**
   * Generate alignment suggestions
   */
  private generateSuggestions(
    conflicts: MindsetConflict[],
    similarDecisions: any[]
  ): string[] {
    const suggestions: string[] = [];

    if (conflicts.length === 0) {
      suggestions.push('✅ Work aligns with project mindset - proceed');

      if (similarDecisions.length > 0) {
        suggestions.push(`💡 Similar past decision: ${similarDecisions[0].title}`);
      }

      return suggestions;
    }

    // Add conflict-specific suggestions
    for (const conflict of conflicts) {
      suggestions.push(`⚠️ ${conflict.description}`);
      suggestions.push(`💡 Alternative: ${conflict.suggestedAlternative}`);
    }

    // Add RAG-based suggestions
    if (similarDecisions.length > 0) {
      suggestions.push(`📚 Learn from past: ${similarDecisions[0].title} - ${similarDecisions[0].decision}`);
    }

    return suggestions;
  }

  /**
   * Map category to conflict type
   */
  private mapCategory(category: string): 'strategic' | 'technical' | 'design' | 'business' {
    switch (category) {
      case 'technical':
      case 'architecture':
        return 'technical';
      case 'design':
        return 'design';
      case 'business':
        return 'business';
      default:
        return 'strategic';
    }
  }

  /**
   * Parse mindset from markdown file
   */
  private parseMindsetFromMarkdown(content: string): ProjectMindset {
    const mindset: ProjectMindset = {
      vision: '',
      businessGoals: [],
      targetUsers: [],
      successMetrics: [],
      constraints: [],
      designPrinciples: [],
      techPhilosophy: [],
      strategicDecisions: []
    };

    // Extract vision
    const visionMatch = content.match(/##\s+🎯\s+Strategic Vision\s+([\s\S]*?)(?=\n##|$)/);
    if (visionMatch) {
      mindset.vision = visionMatch[1].trim();
    }

    // Extract business goals
    const goalsMatch = content.match(/##\s+📈\s+Business Goals\s+([\s\S]*?)(?=\n##|$)/);
    if (goalsMatch) {
      mindset.businessGoals = this.extractListItems(goalsMatch[1]);
    }

    // Extract target users
    const usersMatch = content.match(/##\s+👥\s+Target Users\s+([\s\S]*?)(?=\n##|$)/);
    if (usersMatch) {
      mindset.targetUsers = this.extractListItems(usersMatch[1]);
    }

    // Extract success metrics
    const metricsMatch = content.match(/##\s+📊\s+Success Metrics\s+([\s\S]*?)(?=\n##|$)/);
    if (metricsMatch) {
      mindset.successMetrics = this.extractListItems(metricsMatch[1]);
    }

    // Extract constraints
    const constraintsMatch = content.match(/##\s+🚫\s+Constraints\s+([\s\S]*?)(?=\n##|$)/);
    if (constraintsMatch) {
      mindset.constraints = this.extractListItems(constraintsMatch[1]);
    }

    // Extract design principles
    const designMatch = content.match(/##\s+🎨\s+Design Principles\s+([\s\S]*?)(?=\n##|$)/);
    if (designMatch) {
      mindset.designPrinciples = this.extractListItems(designMatch[1]);
    }

    // Extract tech philosophy
    const techMatch = content.match(/##\s+💻\s+Technical Philosophy\s+([\s\S]*?)(?=\n##|$)/);
    if (techMatch) {
      mindset.techPhilosophy = this.extractListItems(techMatch[1]);
    }

    return mindset;
  }

  /**
   * Extract list items from markdown section
   */
  private extractListItems(section: string): string[] {
    const items: string[] = [];
    const lines = section.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        items.push(trimmed.substring(2).trim());
      }
    }

    return items;
  }

  /**
   * Save mindset to file
   */
  private async saveMindset(): Promise<void> {
    if (!this.mindset) return;

    const content = this.formatMindsetToMarkdown(this.mindset);
    await fs.mkdir(join(this.mindsetPath, '..'), { recursive: true });
    await fs.writeFile(this.mindsetPath, content, 'utf-8');

    console.log(`💾 Mindset saved: ${this.mindsetPath}`);
  }

  /**
   * Format mindset to markdown
   */
  private formatMindsetToMarkdown(mindset: ProjectMindset): string {
    return `# Project Mindset

**Last Updated**: ${new Date().toISOString()}

## 🎯 Strategic Vision

${mindset.vision}

## 📈 Business Goals

${mindset.businessGoals.map(g => `- ${g}`).join('\n')}

## 👥 Target Users

${mindset.targetUsers.map(u => `- ${u}`).join('\n')}

## 📊 Success Metrics

${mindset.successMetrics.map(m => `- ${m}`).join('\n')}

## 🚫 Constraints

${mindset.constraints.map(c => `- ${c}`).join('\n')}

## 🎨 Design Principles

${mindset.designPrinciples.map(p => `- ${p}`).join('\n')}

## 💻 Technical Philosophy

${mindset.techPhilosophy.map(t => `- ${t}`).join('\n')}

## 🎯 Strategic Decisions

${mindset.strategicDecisions.map(d => `
### ${d.title}

- **Decision**: ${d.decision}
- **Rationale**: ${d.rationale}
- **Priority**: ${d.priority}
- **Category**: ${d.category}
- **Date**: ${new Date(d.createdAt).toISOString().split('T')[0]}
`).join('\n')}

---

**Auto-Generated by VERSATIL Mindset Context Engine**
`;
  }

  /**
   * Create mindset template
   */
  private async createMindsetTemplate(): Promise<void> {
    const template: ProjectMindset = {
      vision: 'Define your strategic vision here',
      businessGoals: [
        'Increase user engagement by 50%',
        'Reduce churn rate to <5%',
        'Achieve product-market fit in Q4 2025'
      ],
      targetUsers: [
        'Developers building AI-native applications',
        'CTOs seeking autonomous SDLC frameworks',
        'Teams requiring zero-context-loss development'
      ],
      successMetrics: [
        'Daily Active Users (DAU)',
        'Feature adoption rate',
        'Customer satisfaction score (CSAT)',
        'Time to value (TTV)'
      ],
      constraints: [
        'No jQuery (React-only)',
        'No inline styles (Tailwind CSS only)',
        'Authentication via Auth0 (enterprise SSO required)',
        'All API calls must be authenticated'
      ],
      designPrinciples: [
        'Mobile-first responsive design',
        'WCAG 2.1 AA accessibility minimum',
        'Consistent spacing scale (4px base)',
        'Component-driven architecture'
      ],
      techPhilosophy: [
        'Favor composition over inheritance',
        'Functional programming preferred',
        'Type safety first (TypeScript)',
        'Zero runtime errors tolerance'
      ],
      strategicDecisions: []
    };

    this.mindset = template;
    await this.saveMindset();

    console.log(`✅ Created mindset template: ${this.mindsetPath}`);
  }

  /**
   * Get current mindset
   */
  getMindset(): ProjectMindset | null {
    return this.mindset;
  }
}

// Export singleton
export const mindsetContextEngine = new MindsetContextEngine();
