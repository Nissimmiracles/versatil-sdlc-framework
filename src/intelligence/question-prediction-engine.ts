/**
 * VERSATIL SDLC Framework - Question Prediction Engine
 *
 * Predicts user's next question based on conversation flow patterns.
 * Uses Markov chains to model question sequences.
 *
 * @version 7.13.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { GuardianLogger } from '../agents/guardian/guardian-logger.js';
import type { QuestionCategory } from './conversation-pattern-detector.js';

export interface QuestionSequence {
  id: string;
  sequence: QuestionCategory[];
  occurrences: number;
  first_seen: string;
  last_seen: string;
  completion_rate: number;  // How often sequence completes (0-100)
}

export interface QuestionPrediction {
  next_question: QuestionCategory;
  probability: number;  // 0-100
  confidence: number;   // 0-100
  based_on_sequences: number;
}

/**
 * Question Prediction Engine
 */
export class QuestionPredictionEngine {
  private logger: GuardianLogger;
  private sequencesFile: string;
  private sequences: Map<string, QuestionSequence> = new Map();
  private transitionMatrix: Map<QuestionCategory, Map<QuestionCategory, number>> = new Map();

  constructor() {
    this.logger = GuardianLogger.getInstance();

    const versatilHome = path.join(os.homedir(), '.versatil');
    const sequencesDir = path.join(versatilHome, 'learning', 'user-questions');

    if (!fs.existsSync(sequencesDir)) {
      fs.mkdirSync(sequencesDir, { recursive: true});
    }

    this.sequencesFile = path.join(sequencesDir, 'sequences.jsonl');
    this.loadSequences();
    this.buildTransitionMatrix();
  }

  /**
   * Record question in sequence
   */
  public recordQuestion(_category: QuestionCategory, _conversationId: string): void {
    // Implementation would track questions in active conversations
    // For now, we'll build from historical patterns
  }

  /**
   * Predict next question
   */
  public predictNext(currentCategory: QuestionCategory): QuestionPrediction | null {
    const transitions = this.transitionMatrix.get(currentCategory);

    if (!transitions || transitions.size === 0) {
      return null;
    }

    // Find most likely next question
    let maxCount = 0;
    let mostLikely: QuestionCategory | null = null;

    for (const [nextCategory, count] of transitions.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostLikely = nextCategory;
      }
    }

    if (!mostLikely) return null;

    // Calculate probability and confidence
    const totalTransitions = Array.from(transitions.values()).reduce((sum, count) => sum + count, 0);
    const probability = Math.round((maxCount / totalTransitions) * 100);
    const confidence = probability > 70 ? 90 : probability > 50 ? 70 : 50;

    return {
      next_question: mostLikely,
      probability,
      confidence,
      based_on_sequences: maxCount
    };
  }

  /**
   * Get common sequences
   */
  public getCommonSequences(limit: number = 10): QuestionSequence[] {
    return Array.from(this.sequences.values())
      .sort((a, b) => b.occurrences - a.occurrences)
      .slice(0, limit);
  }

  /**
   * Load sequences from file
   */
  private loadSequences(): void {
    if (!fs.existsSync(this.sequencesFile)) {
      // Bootstrap with common sequences
      this.bootstrapSequences();
      return;
    }

    try {
      const content = fs.readFileSync(this.sequencesFile, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        const sequence = JSON.parse(line) as QuestionSequence;
        const key = sequence.sequence.join('->');
        this.sequences.set(key, sequence);
      }

      this.logger.info(`[Question Prediction] Loaded ${this.sequences.size} sequences`);
    } catch (error) {
      this.logger.error('Failed to load question sequences', { error });
      this.bootstrapSequences();
    }
  }

  /**
   * Bootstrap with common question sequences
   */
  private bootstrapSequences(): void {
    const commonSequences: Array<{ sequence: QuestionCategory[]; occurrences: number }> = [
      {
        sequence: ['status', 'availability', 'verification'],
        occurrences: 5
      },
      {
        sequence: ['status', 'verification'],
        occurrences: 8
      },
      {
        sequence: ['implementation', 'documentation'],
        occurrences: 3
      },
      {
        sequence: ['status', 'availability'],
        occurrences: 7
      }
    ];

    for (const { sequence, occurrences } of commonSequences) {
      const seq: QuestionSequence = {
        id: `seq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sequence,
        occurrences,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        completion_rate: 90
      };

      const key = sequence.join('->');
      this.sequences.set(key, seq);
    }

    this.saveSequences();
  }

  /**
   * Build transition matrix from sequences
   */
  private buildTransitionMatrix(): void {
    this.transitionMatrix.clear();

    for (const sequence of this.sequences.values()) {
      for (let i = 0; i < sequence.sequence.length - 1; i++) {
        const current = sequence.sequence[i];
        const next = sequence.sequence[i + 1];

        if (!this.transitionMatrix.has(current)) {
          this.transitionMatrix.set(current, new Map());
        }

        const transitions = this.transitionMatrix.get(current)!;
        transitions.set(next, (transitions.get(next) || 0) + sequence.occurrences);
      }
    }
  }

  /**
   * Save sequences to file
   */
  private saveSequences(): void {
    try {
      const lines = Array.from(this.sequences.values()).map(seq => JSON.stringify(seq));
      const content = lines.join('\n') + '\n';
      fs.writeFileSync(this.sequencesFile, content);
    } catch (error) {
      this.logger.error('Failed to save question sequences', { error });
    }
  }
}
