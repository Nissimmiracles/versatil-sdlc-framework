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
/**
 * Question Prediction Engine
 */
export class QuestionPredictionEngine {
    constructor() {
        this.sequences = new Map();
        this.transitionMatrix = new Map();
        this.logger = GuardianLogger.getInstance();
        const versatilHome = path.join(os.homedir(), '.versatil');
        const sequencesDir = path.join(versatilHome, 'learning', 'user-questions');
        if (!fs.existsSync(sequencesDir)) {
            fs.mkdirSync(sequencesDir, { recursive: true });
        }
        this.sequencesFile = path.join(sequencesDir, 'sequences.jsonl');
        this.loadSequences();
        this.buildTransitionMatrix();
    }
    /**
     * Record question in sequence
     */
    recordQuestion(_category, _conversationId) {
        // Implementation would track questions in active conversations
        // For now, we'll build from historical patterns
    }
    /**
     * Predict next question
     */
    predictNext(currentCategory) {
        const transitions = this.transitionMatrix.get(currentCategory);
        if (!transitions || transitions.size === 0) {
            return null;
        }
        // Find most likely next question
        let maxCount = 0;
        let mostLikely = null;
        for (const [nextCategory, count] of transitions.entries()) {
            if (count > maxCount) {
                maxCount = count;
                mostLikely = nextCategory;
            }
        }
        if (!mostLikely)
            return null;
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
    getCommonSequences(limit = 10) {
        return Array.from(this.sequences.values())
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, limit);
    }
    /**
     * Load sequences from file
     */
    loadSequences() {
        if (!fs.existsSync(this.sequencesFile)) {
            // Bootstrap with common sequences
            this.bootstrapSequences();
            return;
        }
        try {
            const content = fs.readFileSync(this.sequencesFile, 'utf-8');
            const lines = content.trim().split('\n').filter(Boolean);
            for (const line of lines) {
                const sequence = JSON.parse(line);
                const key = sequence.sequence.join('->');
                this.sequences.set(key, sequence);
            }
            this.logger.info(`[Question Prediction] Loaded ${this.sequences.size} sequences`);
        }
        catch (error) {
            this.logger.error('Failed to load question sequences', { error });
            this.bootstrapSequences();
        }
    }
    /**
     * Bootstrap with common question sequences
     */
    bootstrapSequences() {
        const commonSequences = [
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
            const seq = {
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
    buildTransitionMatrix() {
        this.transitionMatrix.clear();
        for (const sequence of this.sequences.values()) {
            for (let i = 0; i < sequence.sequence.length - 1; i++) {
                const current = sequence.sequence[i];
                const next = sequence.sequence[i + 1];
                if (!this.transitionMatrix.has(current)) {
                    this.transitionMatrix.set(current, new Map());
                }
                const transitions = this.transitionMatrix.get(current);
                transitions.set(next, (transitions.get(next) || 0) + sequence.occurrences);
            }
        }
    }
    /**
     * Save sequences to file
     */
    saveSequences() {
        try {
            const lines = Array.from(this.sequences.values()).map(seq => JSON.stringify(seq));
            const content = lines.join('\n') + '\n';
            fs.writeFileSync(this.sequencesFile, content);
        }
        catch (error) {
            this.logger.error('Failed to save question sequences', { error });
        }
    }
}
//# sourceMappingURL=question-prediction-engine.js.map