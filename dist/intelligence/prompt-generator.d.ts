/**
 * VERSATIL SDLC Framework - Level 2: Smart Prompt Generation System (RAG-Enhanced)
 *
 * Generates specialized prompts for Claude Code/Cursor AI based on:
 * - Pattern analysis results enhanced with historical knowledge
 * - Agent specialization with learned expertise
 * - Project context enriched with conventions
 * - User intent guided by proven solutions
 */
import { AnalysisResult, RAGContext } from './pattern-analyzer.js';
export interface PromptContext {
    filePath: string;
    content: string;
    language: string;
    projectName: string;
    userRequest?: string;
    analysisResult: AnalysisResult;
    ragContext?: RAGContext;
}
export interface GeneratedPrompt {
    agent: string;
    title: string;
    prompt: string;
    model: 'sonnet' | 'opus';
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedTime: string;
    handoffSuggestions: string[];
}
export declare class PromptGenerator {
    /**
     * Generate QA analysis prompt for Enhanced Maria
     */
    static generateQAPrompt(context: PromptContext): GeneratedPrompt;
    /**
     * Generate Frontend analysis prompt for Enhanced James
     */
    static generateFrontendPrompt(context: PromptContext): GeneratedPrompt;
    /**
     * Generate Backend analysis prompt for Enhanced Marcus
     */
    static generateBackendPrompt(context: PromptContext): GeneratedPrompt;
    /**
     * Generate Project Manager overview prompt for Sarah-PM
     */
    static generatePMPrompt(context: PromptContext): GeneratedPrompt;
    /**
     * Generate appropriate prompt based on file type and agent
     */
    static generatePrompt(agent: string, context: PromptContext): GeneratedPrompt;
    /**
     * Generate RAG context section for prompts
     */
    private static generateRAGContextSection;
}
