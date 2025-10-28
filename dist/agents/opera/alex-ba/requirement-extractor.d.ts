/**
 * Requirement Extractor for Alex-BA
 * Automatically detects and extracts requirements from user messages and code
 */
import { EventEmitter } from 'events';
import type { FeatureRequest } from './story-generator.js';
export interface ExtractionResult {
    detected: boolean;
    featureRequest?: FeatureRequest;
    confidence: number;
    keywords: string[];
    requirementType: 'feature' | 'enhancement' | 'bug-fix' | 'refactor' | 'documentation' | 'unknown';
}
export interface ExtractionConfig {
    minConfidence: number;
    autoActivate: boolean;
}
export declare class RequirementExtractor extends EventEmitter {
    private config;
    private readonly FEATURE_KEYWORDS;
    private readonly TYPE_INDICATORS;
    private readonly DOMAIN_KEYWORDS;
    constructor(config?: Partial<ExtractionConfig>);
    /**
     * Extract feature request from user message
     */
    extractFromMessage(message: string, context?: {
        filename?: string;
        codeContext?: string;
        previousMessages?: string[];
    }): Promise<ExtractionResult>;
    /**
     * Extract requirements from code comments
     */
    extractFromCode(filePath: string, content: string): Promise<ExtractionResult[]>;
    /**
     * Extract feature title from message
     */
    private extractTitle;
    /**
     * Determine requirement type
     */
    private determineRequirementType;
    /**
     * Infer priority from message content
     */
    private inferPriority;
    /**
     * Batch extract from multiple messages
     */
    extractFromBatch(messages: string[]): Promise<ExtractionResult[]>;
    /**
     * Get extraction statistics
     */
    getStats(): {
        totalExtractions: number;
        byType: Record<string, number>;
        averageConfidence: number;
    };
}
