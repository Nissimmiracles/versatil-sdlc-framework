/**
 * Visual Consistency Checker
 *
 * Analyzes UI components for design token consistency, visual discrepancies,
 * and standardization opportunities across tables, buttons, forms, and layouts.
 *
 * @module VisualConsistencyChecker
 */
import { z } from 'zod';
export declare const DesignTokenSchema: z.ZodObject<{
    colors: z.ZodRecord<z.ZodString, z.ZodString>;
    spacing: z.ZodArray<z.ZodNumber, "many">;
    typography: z.ZodObject<{
        fontFamily: z.ZodString;
        sizes: z.ZodRecord<z.ZodString, z.ZodString>;
        weights: z.ZodRecord<z.ZodString, z.ZodNumber>;
        lineHeights: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        fontFamily?: string;
        sizes?: Record<string, string>;
        weights?: Record<string, number>;
        lineHeights?: Record<string, number>;
    }, {
        fontFamily?: string;
        sizes?: Record<string, string>;
        weights?: Record<string, number>;
        lineHeights?: Record<string, number>;
    }>;
    shadows: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    borderRadius: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    transitions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    colors?: Record<string, string>;
    typography?: {
        fontFamily?: string;
        sizes?: Record<string, string>;
        weights?: Record<string, number>;
        lineHeights?: Record<string, number>;
    };
    spacing?: number[];
    shadows?: Record<string, string>;
    borderRadius?: Record<string, string>;
    transitions?: Record<string, string>;
}, {
    colors?: Record<string, string>;
    typography?: {
        fontFamily?: string;
        sizes?: Record<string, string>;
        weights?: Record<string, number>;
        lineHeights?: Record<string, number>;
    };
    spacing?: number[];
    shadows?: Record<string, string>;
    borderRadius?: Record<string, string>;
    transitions?: Record<string, string>;
}>;
export type DesignTokens = z.infer<typeof DesignTokenSchema>;
export interface VisualConsistencyReport {
    overallScore: number;
    componentAnalysis: ComponentAnalysis;
    tokenCompliance: TokenCompliance;
    recommendations: VisualRecommendation[];
    summary: string;
}
export interface ComponentAnalysis {
    tables: TableAnalysis;
    buttons: ButtonAnalysis;
    forms: FormAnalysis;
    spacing: SpacingAnalysis;
    typography: TypographyAnalysis;
    colors: ColorAnalysis;
}
export interface TableAnalysis {
    score: number;
    totalTables: number;
    issues: TableIssue[];
    recommendations: string[];
}
export interface TableIssue {
    file: string;
    line?: number;
    type: 'inconsistent-borders' | 'inconsistent-padding' | 'inconsistent-sorting' | 'missing-responsive' | 'misaligned-columns' | 'inconsistent-headers';
    description: string;
    currentValue: string;
    expectedValue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ButtonAnalysis {
    score: number;
    totalButtons: number;
    issues: ButtonIssue[];
    recommendations: string[];
    variants: ButtonVariant[];
}
export interface ButtonIssue {
    file: string;
    line?: number;
    type: 'inconsistent-size' | 'inconsistent-padding' | 'inconsistent-colors' | 'missing-states' | 'inconsistent-border-radius' | 'inline-styles';
    description: string;
    currentValue: string;
    expectedValue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ButtonVariant {
    name: string;
    count: number;
    files: string[];
    isStandard: boolean;
}
export interface FormAnalysis {
    score: number;
    totalForms: number;
    issues: FormIssue[];
    recommendations: string[];
}
export interface FormIssue {
    file: string;
    line?: number;
    type: 'inconsistent-spacing' | 'inconsistent-labels' | 'missing-validation' | 'inconsistent-error-states' | 'missing-aria' | 'inconsistent-input-size';
    description: string;
    currentValue: string;
    expectedValue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface SpacingAnalysis {
    score: number;
    adherence: number;
    violations: SpacingViolation[];
    recommendations: string[];
}
export interface SpacingViolation {
    file: string;
    line?: number;
    property: 'padding' | 'margin' | 'gap' | 'top' | 'bottom' | 'left' | 'right';
    value: string;
    nearestTokenValue: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface TypographyAnalysis {
    score: number;
    adherence: number;
    violations: TypographyViolation[];
    recommendations: string[];
}
export interface TypographyViolation {
    file: string;
    line?: number;
    property: 'font-size' | 'font-weight' | 'line-height' | 'font-family';
    value: string;
    expectedToken: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface ColorAnalysis {
    score: number;
    adherence: number;
    violations: ColorViolation[];
    recommendations: string[];
    paletteUsage: PaletteUsage[];
}
export interface ColorViolation {
    file: string;
    line?: number;
    property: string;
    value: string;
    nearestPaletteColor?: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
}
export interface PaletteUsage {
    color: string;
    name: string;
    count: number;
    files: string[];
}
export interface TokenCompliance {
    colorsCompliance: number;
    spacingCompliance: number;
    typographyCompliance: number;
    overallCompliance: number;
}
export interface VisualRecommendation {
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'tables' | 'buttons' | 'forms' | 'spacing' | 'typography' | 'colors';
    title: string;
    description: string;
    impact: string;
    implementation: {
        steps: string[];
        codeExample?: string;
        affectedFiles: string[];
    };
    estimatedEffort: 'quick-win' | 'small' | 'medium' | 'large';
}
export interface CheckContext {
    filePaths: string[];
    fileContents: Map<string, string>;
    designTokens?: DesignTokens;
    framework?: 'react' | 'vue' | 'svelte' | 'angular';
}
export declare class VisualConsistencyChecker {
    private designTokens;
    constructor(designTokens?: DesignTokens);
    /**
     * Run comprehensive visual consistency check
     */
    check(context: CheckContext): Promise<VisualConsistencyReport>;
    private analyzeTables;
    private generateTableRecommendations;
    private analyzeButtons;
    private generateButtonRecommendations;
    private analyzeForms;
    private generateFormRecommendations;
    private analyzeSpacing;
    private findNearestSpacingValue;
    private analyzeTypography;
    private pxToRem;
    private analyzeColors;
    private findNearestPaletteColor;
    private calculateTokenCompliance;
    private calculateOverallScore;
    private generateRecommendations;
    private generateSummary;
    private getTopIssues;
    private getDefaultDesignTokens;
}
