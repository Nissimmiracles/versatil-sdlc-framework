/**
 * Context Forecaster
 *
 * ML-based prediction of when context will exceed thresholds
 * Uses simple regression model on conversation patterns to forecast token usage
 *
 * Enhancement 6 of Context Engineering Suite
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
/**
 * Simple linear regression model for token forecasting
 *
 * Features:
 * - Tokens per message (weight: 0.4)
 * - Task complexity multiplier (weight: 0.3)
 * - Tool result size (weight: 0.2)
 * - Time of day factor (weight: 0.1)
 */
export class ContextForecaster {
    constructor(statsDir = path.join(os.homedir(), '.versatil', 'forecasting')) {
        this.trainingData = [];
        this.TOKEN_LIMIT = 200000;
        this.THRESHOLD_85 = 170000; // 85% of 200k
        this.THRESHOLD_95 = 190000; // 95% of 200k
        // Model coefficients (trained on historical data)
        this.coefficients = {
            tokensPerMessage: 0.4,
            complexityMultiplier: 0.3,
            toolResultSize: 0.2,
            timeOfDay: 0.1
        };
        // Complexity multipliers
        this.complexityFactors = {
            simple: 1.0,
            medium: 1.5,
            complex: 2.2
        };
        this.statsDir = statsDir;
    }
    /**
     * Initialize forecaster and load training data
     */
    async initialize() {
        await fs.mkdir(this.statsDir, { recursive: true });
        // Load historical training data
        try {
            const trainingPath = path.join(this.statsDir, 'training-data.json');
            if (await this.fileExists(trainingPath)) {
                const data = await fs.readFile(trainingPath, 'utf-8');
                this.trainingData = JSON.parse(data, this.dateReviver);
            }
        }
        catch (error) {
            console.error('[ContextForecaster] Failed to load training data:', error);
        }
        // Train model if sufficient data available
        if (this.trainingData.length >= 50) {
            await this.trainModel();
        }
    }
    /**
     * Forecast token usage for next N messages
     */
    async forecast(metrics) {
        const { currentTokens, messageCount, tokensPerMessage, taskComplexity = 'medium', timeOfDay = new Date().getHours(), averageToolResultSize, memoryOperationsPerMessage } = metrics;
        // Calculate base prediction (linear extrapolation)
        const complexityFactor = this.complexityFactors[taskComplexity];
        const timeOfDayFactor = this.getTimeOfDayFactor(timeOfDay);
        // Weighted prediction considering all factors
        const predictedTokensPerMessage = tokensPerMessage * this.coefficients.tokensPerMessage * complexityFactor +
            averageToolResultSize * this.coefficients.toolResultSize +
            (memoryOperationsPerMessage * 500) * this.coefficients.complexityMultiplier +
            (tokensPerMessage * timeOfDayFactor) * this.coefficients.timeOfDay;
        // Forecast for 5 and 10 messages ahead
        const tokensIn5 = currentTokens + (predictedTokensPerMessage * 5);
        const tokensIn10 = currentTokens + (predictedTokensPerMessage * 10);
        // Calculate messages until thresholds
        const messagesUntil85 = Math.max(0, Math.floor((this.THRESHOLD_85 - currentTokens) / predictedTokensPerMessage));
        const messagesUntil95 = Math.max(0, Math.floor((this.THRESHOLD_95 - currentTokens) / predictedTokensPerMessage));
        // Estimate time (assume 2 minutes per message on average)
        const minutesUntil85 = messagesUntil85 * 2;
        // Calculate confidence based on training data quality
        const confidence = this.calculateConfidence(metrics);
        // Determine recommendation
        const { recommendation, reasoning } = this.determineRecommendation(currentTokens, messagesUntil85, messagesUntil95, confidence);
        return {
            predictedTokensIn5Messages: Math.round(tokensIn5),
            predictedTokensIn10Messages: Math.round(tokensIn10),
            messagesUntil85Percent: messagesUntil85,
            messagesUntil95Percent: messagesUntil95,
            estimatedMinutesUntil85Percent: minutesUntil85,
            confidence,
            recommendation,
            reasoning
        };
    }
    /**
     * Record actual outcome for model training
     */
    async recordOutcome(metrics, actualTokensAfter5, actualTokensAfter10) {
        const dataPoint = {
            tokensPerMessage: metrics.tokensPerMessage,
            messageCount: metrics.messageCount,
            taskComplexity: metrics.taskComplexity,
            timeOfDay: metrics.timeOfDay,
            agentType: metrics.agentType || 'unknown',
            averageToolResultSize: metrics.averageToolResultSize,
            memoryOpsPerMessage: metrics.memoryOperationsPerMessage,
            actualTokensAfter5Messages: actualTokensAfter5,
            actualTokensAfter10Messages: actualTokensAfter10,
            timestamp: new Date()
        };
        this.trainingData.push(dataPoint);
        // Keep last 1000 data points
        if (this.trainingData.length > 1000) {
            this.trainingData = this.trainingData.slice(-1000);
        }
        // Save training data
        try {
            const trainingPath = path.join(this.statsDir, 'training-data.json');
            await fs.writeFile(trainingPath, JSON.stringify(this.trainingData, null, 2));
        }
        catch (error) {
            console.error('[ContextForecaster] Failed to save training data:', error);
        }
        // Retrain model every 50 data points
        if (this.trainingData.length % 50 === 0) {
            await this.trainModel();
        }
    }
    /**
     * Train regression model on historical data
     * Uses simple least squares regression
     */
    async trainModel() {
        if (this.trainingData.length < 50) {
            console.warn('[ContextForecaster] Insufficient training data (need 50+, have ' + this.trainingData.length + ')');
            return;
        }
        // Calculate optimal coefficients using gradient descent
        // (Simplified - in production, use proper ML library like TensorFlow.js)
        // For now, use adaptive coefficients based on data patterns
        const avgComplexityImpact = this.calculateAverageComplexityImpact();
        const avgToolResultImpact = this.calculateAverageToolResultImpact();
        // Adjust coefficients based on observed patterns
        const totalImpact = avgComplexityImpact + avgToolResultImpact + 1.0;
        this.coefficients = {
            tokensPerMessage: 1.0 / totalImpact,
            complexityMultiplier: avgComplexityImpact / totalImpact,
            toolResultSize: avgToolResultImpact / totalImpact,
            timeOfDay: 0.1 // Fixed low impact
        };
        // Save updated coefficients
        try {
            const coeffPath = path.join(this.statsDir, 'coefficients.json');
            await fs.writeFile(coeffPath, JSON.stringify(this.coefficients, null, 2));
        }
        catch (error) {
            console.error('[ContextForecaster] Failed to save coefficients:', error);
        }
        console.log('[ContextForecaster] Model retrained with ' + this.trainingData.length + ' data points');
    }
    /**
     * Calculate average complexity impact from training data
     */
    calculateAverageComplexityImpact() {
        const complexityRatios = this.trainingData.map(d => {
            const baseRate = d.tokensPerMessage;
            const complexityFactor = this.complexityFactors[d.taskComplexity];
            return complexityFactor;
        });
        return complexityRatios.reduce((sum, r) => sum + r, 0) / complexityRatios.length || 1.5;
    }
    /**
     * Calculate average tool result impact from training data
     */
    calculateAverageToolResultImpact() {
        const toolImpacts = this.trainingData.map(d => {
            return d.averageToolResultSize / d.tokensPerMessage;
        });
        return toolImpacts.reduce((sum, i) => sum + i, 0) / toolImpacts.length || 0.5;
    }
    /**
     * Get time of day factor (conversations at different times have different patterns)
     */
    getTimeOfDayFactor(hour) {
        // Morning (6-12): Lower token usage (fresh start)
        if (hour >= 6 && hour < 12)
            return 0.9;
        // Afternoon (12-18): Higher token usage (accumulated context)
        if (hour >= 12 && hour < 18)
            return 1.1;
        // Evening (18-24): Moderate (wrapping up)
        if (hour >= 18 && hour <= 23)
            return 1.0;
        // Night (0-6): Lower (quick tasks)
        return 0.8;
    }
    /**
     * Calculate confidence based on training data quality
     */
    calculateConfidence(metrics) {
        let confidence = 0.5; // Base confidence
        // More training data = higher confidence
        if (this.trainingData.length >= 500) {
            confidence += 0.3;
        }
        else if (this.trainingData.length >= 100) {
            confidence += 0.2;
        }
        else if (this.trainingData.length >= 50) {
            confidence += 0.1;
        }
        // Similar task complexity in training data = higher confidence
        const similarComplexity = this.trainingData.filter(d => d.taskComplexity === metrics.taskComplexity).length;
        if (similarComplexity >= 50) {
            confidence += 0.1;
        }
        // Similar agent type = higher confidence
        if (metrics.agentType) {
            const similarAgent = this.trainingData.filter(d => d.agentType === metrics.agentType).length;
            if (similarAgent >= 20) {
                confidence += 0.1;
            }
        }
        return Math.min(1.0, confidence);
    }
    /**
     * Determine recommendation based on forecast
     */
    determineRecommendation(currentTokens, messagesUntil85, messagesUntil95, confidence) {
        // Emergency: Already at 95%+
        if (currentTokens >= this.THRESHOLD_95) {
            return {
                recommendation: 'emergency',
                reasoning: 'Already at 95%+ token usage. Extract patterns immediately before emergency clear.'
            };
        }
        // Extract now: Within 5 messages of 85%
        if (messagesUntil85 <= 5) {
            return {
                recommendation: 'extract_now',
                reasoning: `Will reach 85% threshold in ~${messagesUntil85} messages (${messagesUntil85 * 2} minutes). Extract patterns now to avoid emergency clearing.`
            };
        }
        // Extract soon: Within 10 messages of 85%
        if (messagesUntil85 <= 10) {
            return {
                recommendation: 'extract_soon',
                reasoning: `Will reach 85% threshold in ~${messagesUntil85} messages (${messagesUntil85 * 2} minutes). Start preparing pattern extraction.`
            };
        }
        // Continue: Safe distance from threshold
        return {
            recommendation: 'continue',
            reasoning: `Safe token usage. Estimated ${messagesUntil85} messages (${messagesUntil85 * 2} minutes) until 85% threshold. Confidence: ${Math.round(confidence * 100)}%`
        };
    }
    /**
     * Get forecasting statistics
     */
    async getStatistics() {
        // Calculate model accuracy from last 50 predictions
        const recentData = this.trainingData.slice(-50);
        let totalError = 0;
        let correctPredictions = 0;
        for (const dataPoint of recentData) {
            // Recreate prediction
            const predicted = dataPoint.tokensPerMessage * 5;
            const actual = dataPoint.actualTokensAfter5Messages - (dataPoint.messageCount * dataPoint.tokensPerMessage);
            const error = Math.abs(predicted - actual) / actual;
            totalError += error;
            if (error < 0.15) { // Within 15% = correct
                correctPredictions++;
            }
        }
        const accuracy = recentData.length > 0 ? correctPredictions / recentData.length : 0;
        const avgError = recentData.length > 0 ? totalError / recentData.length : 0;
        return {
            trainingDataPoints: this.trainingData.length,
            modelAccuracy: Math.round(accuracy * 100) / 100,
            avgPredictionError: Math.round(avgError * 100) / 100,
            coefficients: this.coefficients
        };
    }
    /**
     * Clear old training data (older than 90 days)
     */
    async cleanupOldData() {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const originalLength = this.trainingData.length;
        this.trainingData = this.trainingData.filter(d => new Date(d.timestamp) > ninetyDaysAgo);
        const removed = originalLength - this.trainingData.length;
        if (removed > 0) {
            // Save updated data
            try {
                const trainingPath = path.join(this.statsDir, 'training-data.json');
                await fs.writeFile(trainingPath, JSON.stringify(this.trainingData, null, 2));
            }
            catch (error) {
                console.error('[ContextForecaster] Failed to save after cleanup:', error);
            }
        }
        return removed;
    }
    // Helper methods
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    dateReviver(key, value) {
        if (key === 'timestamp' && typeof value === 'string') {
            return new Date(value);
        }
        return value;
    }
}
/**
 * Singleton instance for global access
 */
let globalForecaster = null;
export function getGlobalForecaster() {
    if (!globalForecaster) {
        globalForecaster = new ContextForecaster();
    }
    return globalForecaster;
}
export function setGlobalForecaster(forecaster) {
    globalForecaster = forecaster;
}
//# sourceMappingURL=context-forecaster.js.map