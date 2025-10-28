/**
 * Context Forecaster
 *
 * ML-based prediction of when context will exceed thresholds
 * Uses simple regression model on conversation patterns to forecast token usage
 *
 * Enhancement 6 of Context Engineering Suite
 */
export interface ConversationMetrics {
    currentTokens: number;
    messageCount: number;
    tokensPerMessage: number;
    agentType?: string;
    taskComplexity: 'simple' | 'medium' | 'complex';
    timeOfDay: number;
    averageToolResultSize: number;
    memoryOperationsPerMessage: number;
}
export interface ForecastResult {
    predictedTokensIn5Messages: number;
    predictedTokensIn10Messages: number;
    messagesUntil85Percent: number;
    messagesUntil95Percent: number;
    estimatedMinutesUntil85Percent: number;
    confidence: number;
    recommendation: 'continue' | 'extract_soon' | 'extract_now' | 'emergency';
    reasoning: string;
}
export interface TrainingDataPoint {
    tokensPerMessage: number;
    messageCount: number;
    taskComplexity: 'simple' | 'medium' | 'complex';
    timeOfDay: number;
    agentType: string;
    averageToolResultSize: number;
    memoryOpsPerMessage: number;
    actualTokensAfter5Messages: number;
    actualTokensAfter10Messages: number;
    timestamp: Date;
}
/**
 * Simple linear regression model for token forecasting
 *
 * Features:
 * - Tokens per message (weight: 0.4)
 * - Task complexity multiplier (weight: 0.3)
 * - Tool result size (weight: 0.2)
 * - Time of day factor (weight: 0.1)
 */
export declare class ContextForecaster {
    private trainingData;
    private statsDir;
    private readonly TOKEN_LIMIT;
    private readonly THRESHOLD_85;
    private readonly THRESHOLD_95;
    private coefficients;
    private complexityFactors;
    constructor(statsDir?: string);
    /**
     * Initialize forecaster and load training data
     */
    initialize(): Promise<void>;
    /**
     * Forecast token usage for next N messages
     */
    forecast(metrics: ConversationMetrics): Promise<ForecastResult>;
    /**
     * Record actual outcome for model training
     */
    recordOutcome(metrics: ConversationMetrics, actualTokensAfter5: number, actualTokensAfter10: number): Promise<void>;
    /**
     * Train regression model on historical data
     * Uses simple least squares regression
     */
    private trainModel;
    /**
     * Calculate average complexity impact from training data
     */
    private calculateAverageComplexityImpact;
    /**
     * Calculate average tool result impact from training data
     */
    private calculateAverageToolResultImpact;
    /**
     * Get time of day factor (conversations at different times have different patterns)
     */
    private getTimeOfDayFactor;
    /**
     * Calculate confidence based on training data quality
     */
    private calculateConfidence;
    /**
     * Determine recommendation based on forecast
     */
    private determineRecommendation;
    /**
     * Get forecasting statistics
     */
    getStatistics(): Promise<{
        trainingDataPoints: number;
        modelAccuracy: number;
        avgPredictionError: number;
        coefficients: typeof this.coefficients;
    }>;
    /**
     * Clear old training data (older than 90 days)
     */
    cleanupOldData(): Promise<number>;
    private fileExists;
    private dateReviver;
}
export declare function getGlobalForecaster(): ContextForecaster;
export declare function setGlobalForecaster(forecaster: ContextForecaster): void;
