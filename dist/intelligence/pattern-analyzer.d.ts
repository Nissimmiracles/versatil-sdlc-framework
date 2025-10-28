/**
 * VERSATIL SDLC Framework - Level 1: Pattern Analysis System (RAG-Enhanced)
 *
 * Provides intelligent code analysis with optional RAG context using:
 * - Regex pattern matching enhanced with historical patterns
 * - AST-like parsing with learned conventions
 * - Heuristic analysis enriched with project knowledge
 * - Best practice detection from vector memory
 */
import { MemoryDocument } from '../rag/enhanced-vector-memory-store.js';
export interface RAGContext {
    similarPatterns: MemoryDocument[];
    relevantSolutions: MemoryDocument[];
    projectConventions: MemoryDocument[];
    agentExpertise: MemoryDocument[];
}
export interface PatternMatch {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    line: number;
    column: number;
    message: string;
    suggestion: string;
    code: string;
    category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
    description?: string;
}
export interface AnalysisResult {
    patterns: PatternMatch[];
    score: number;
    summary: string;
    recommendations: string[];
    coverage?: number;
    quality?: number;
    security?: number;
    performance?: number;
    issues?: any[];
}
export declare class PatternAnalyzer {
    /**
     * Analyze code for QA patterns (Enhanced Maria) with optional RAG context
     */
    static analyzeQA(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult;
    /**
     * Analyze code for Frontend patterns (Enhanced James)
     */
    static analyzeFrontend(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult;
    /**
     * Analyze code for Backend patterns (Enhanced Marcus)
     */
    static analyzeBackend(content: string, filePath: string, ragContext?: RAGContext): AnalysisResult;
    /**
     * Calculate quality score based on patterns
     */
    private static calculateQualityScore;
    /**
     * Generate Frontend summary
     */
    private static generateFrontendSummary;
    /**
     * Generate Frontend recommendations
     */
    private static generateFrontendRecommendations;
    /**
     * Generate Backend summary
     */
    private static generateBackendSummary;
    /**
     * Generate Backend recommendations
     */
    private static generateBackendRecommendations;
    /**
     * Enhance patterns with RAG context knowledge
     */
    private static enhanceWithRAGContext;
    /**
     * Generate QA summary with RAG context
     */
    private static generateQASummary;
    /**
     * Generate QA recommendations with RAG context
     */
    private static generateQARecommendations;
}
