/**
 * VERSATIL SDLC Framework - Coding Style Detector
 *
 * Auto-detects user coding style from git commits and existing code
 * Part of Layer 3 (User/Team Context) - Task 8
 *
 * Features:
 * - Analyze indentation patterns
 * - Detect naming conventions
 * - Identify comment patterns
 * - Auto-populate UserCodingPreferences
 */
import type { UserCodingPreferences } from './user-context-manager.js';
export interface CodeAnalysisResult {
    confidence: number;
    samples: number;
    detectedPreferences: Partial<UserCodingPreferences>;
    analysis: {
        indentation: {
            tabs: number;
            spaces2: number;
            spaces4: number;
        };
        naming: {
            camel: number;
            snake: number;
            pascal: number;
        };
        quotes: {
            single: number;
            double: number;
            backticks: number;
        };
        semicolons: {
            present: number;
            absent: number;
        };
    };
}
export declare class CodingStyleDetector {
    /**
     * Analyze user's git commits to detect coding style
     */
    analyzeGitHistory(repoPath: string, userId?: string, maxCommits?: number): Promise<CodeAnalysisResult>;
    /**
     * Analyze code files in a directory
     */
    analyzeDirectory(dirPath: string, extensions?: string[]): Promise<CodeAnalysisResult>;
    /**
     * Analyze single code snippet
     */
    analyzeCode(code: string, result: CodeAnalysisResult): void;
    /**
     * Calculate preferences from analysis
     */
    private calculatePreferences;
    /**
     * Calculate confidence score (0-1)
     */
    private calculateConfidence;
    /**
     * Find code files in directory recursively
     */
    private findCodeFiles;
    /**
     * Check if file is a code file
     */
    private isCodeFile;
}
export declare const codingStyleDetector: CodingStyleDetector;
