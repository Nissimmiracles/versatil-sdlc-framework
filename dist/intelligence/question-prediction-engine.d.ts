/**
 * VERSATIL SDLC Framework - Question Prediction Engine
 *
 * Predicts user's next question based on conversation flow patterns.
 * Uses Markov chains to model question sequences.
 *
 * @version 7.13.0
 */
import type { QuestionCategory } from './conversation-pattern-detector.js';
export interface QuestionSequence {
    id: string;
    sequence: QuestionCategory[];
    occurrences: number;
    first_seen: string;
    last_seen: string;
    completion_rate: number;
}
export interface QuestionPrediction {
    next_question: QuestionCategory;
    probability: number;
    confidence: number;
    based_on_sequences: number;
}
/**
 * Question Prediction Engine
 */
export declare class QuestionPredictionEngine {
    private logger;
    private sequencesFile;
    private sequences;
    private transitionMatrix;
    constructor();
    /**
     * Record question in sequence
     */
    recordQuestion(_category: QuestionCategory, _conversationId: string): void;
    /**
     * Predict next question
     */
    predictNext(currentCategory: QuestionCategory): QuestionPrediction | null;
    /**
     * Get common sequences
     */
    getCommonSequences(limit?: number): QuestionSequence[];
    /**
     * Load sequences from file
     */
    private loadSequences;
    /**
     * Bootstrap with common question sequences
     */
    private bootstrapSequences;
    /**
     * Build transition matrix from sequences
     */
    private buildTransitionMatrix;
    /**
     * Save sequences to file
     */
    private saveSequences;
}
