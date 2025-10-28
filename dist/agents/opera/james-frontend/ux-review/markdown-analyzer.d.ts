/**
 * Markdown Analyzer
 *
 * Analyzes markdown rendering quality including heading hierarchy,
 * list formatting, code blocks, tables, links, and images.
 *
 * @module MarkdownAnalyzer
 */
export interface MarkdownAnalysisResult {
    overallScore: number;
    headingHierarchy: HeadingHierarchyReport;
    listFormatting: ListFormattingReport;
    codeBlocks: CodeBlockReport;
    tables: TableReport;
    links: LinkReport;
    images: ImageReport;
    readability: ReadabilityReport;
    summary: string;
}
export interface HeadingHierarchyReport {
    score: number;
    structure: HeadingStructure[];
    violations: HeadingViolation[];
    recommendations: string[];
}
export interface HeadingStructure {
    level: number;
    text: string;
    line: number;
    file: string;
}
export interface HeadingViolation {
    file: string;
    line: number;
    type: 'missing-h1' | 'skipped-level' | 'multiple-h1' | 'inconsistent-style';
    description: string;
    currentState: string;
    expectedState: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ListFormattingReport {
    score: number;
    consistency: boolean;
    violations: ListViolation[];
    recommendations: string[];
}
export interface ListViolation {
    file: string;
    line: number;
    type: 'mixed-markers' | 'inconsistent-indentation' | 'missing-blank-lines';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface CodeBlockReport {
    score: number;
    totalBlocks: number;
    syntaxHighlighting: SyntaxHighlightingAnalysis;
    formatting: CodeFormattingAnalysis;
    recommendations: string[];
}
export interface SyntaxHighlightingAnalysis {
    withLanguage: number;
    withoutLanguage: number;
    percentageWithLanguage: number;
}
export interface CodeFormattingAnalysis {
    wellFormatted: number;
    poorlyFormatted: number;
    issues: CodeFormattingIssue[];
}
export interface CodeFormattingIssue {
    file: string;
    line: number;
    type: 'missing-language' | 'inconsistent-indentation' | 'long-lines';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface TableReport {
    score: number;
    totalTables: number;
    violations: TableViolation[];
    recommendations: string[];
}
export interface TableViolation {
    file: string;
    line: number;
    type: 'malformed-table' | 'inconsistent-alignment' | 'missing-headers' | 'uneven-columns';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface LinkReport {
    score: number;
    totalLinks: number;
    internal: number;
    external: number;
    brokenLinks: BrokenLink[];
    recommendations: string[];
}
export interface BrokenLink {
    file: string;
    line: number;
    url: string;
    text: string;
    reason: 'not-found' | 'invalid-format' | 'relative-path-issue';
}
export interface ImageReport {
    score: number;
    totalImages: number;
    withAltText: number;
    withoutAltText: number;
    violations: ImageViolation[];
    recommendations: string[];
}
export interface ImageViolation {
    file: string;
    line: number;
    type: 'missing-alt-text' | 'empty-alt-text' | 'broken-path';
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ReadabilityReport {
    score: number;
    paragraphLength: ParagraphAnalysis;
    sentenceLength: SentenceAnalysis;
    recommendations: string[];
}
export interface ParagraphAnalysis {
    average: number;
    tooLong: number;
    optimal: number;
}
export interface SentenceAnalysis {
    average: number;
    tooLong: number;
    optimal: number;
}
export interface MarkdownContext {
    filePaths: string[];
    fileContents: Map<string, string>;
    baseUrl?: string;
}
export declare class MarkdownAnalyzer {
    /**
     * Analyze markdown files comprehensively
     */
    analyze(context: MarkdownContext): Promise<MarkdownAnalysisResult>;
    private analyzeHeadingHierarchy;
    private generateHeadingRecommendations;
    private analyzeListFormatting;
    private analyzeCodeBlocks;
    private analyzeTables;
    private analyzeLinks;
    private analyzeImages;
    private analyzeReadability;
    private filterMarkdownFiles;
    private calculateOverallScore;
    private generateSummary;
    private emptyAnalysis;
}
