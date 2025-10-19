/**
 * Visual Consistency Checker
 *
 * Analyzes UI components for design token consistency, visual discrepancies,
 * and standardization opportunities across tables, buttons, forms, and layouts.
 *
 * @module VisualConsistencyChecker
 */

import { z } from 'zod';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export const DesignTokenSchema = z.object({
  colors: z.record(z.string()),
  spacing: z.array(z.number()),
  typography: z.object({
    fontFamily: z.string(),
    sizes: z.record(z.string()),
    weights: z.record(z.number()),
    lineHeights: z.record(z.number())
  }),
  shadows: z.record(z.string()).optional(),
  borderRadius: z.record(z.string()).optional(),
  transitions: z.record(z.string()).optional()
});

export type DesignTokens = z.infer<typeof DesignTokenSchema>;

export interface VisualConsistencyReport {
  overallScore: number; // 0-100
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
  type: 'inconsistent-borders' | 'inconsistent-padding' | 'inconsistent-sorting' |
        'missing-responsive' | 'misaligned-columns' | 'inconsistent-headers';
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
  type: 'inconsistent-size' | 'inconsistent-padding' | 'inconsistent-colors' |
        'missing-states' | 'inconsistent-border-radius' | 'inline-styles';
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
  type: 'inconsistent-spacing' | 'inconsistent-labels' | 'missing-validation' |
        'inconsistent-error-states' | 'missing-aria' | 'inconsistent-input-size';
  description: string;
  currentValue: string;
  expectedValue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface SpacingAnalysis {
  score: number;
  adherence: number; // % using design tokens
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
  adherence: number; // % using design tokens
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
  adherence: number; // % using design tokens
  violations: ColorViolation[];
  recommendations: string[];
  paletteUsage: PaletteUsage[];
}

export interface ColorViolation {
  file: string;
  line?: number;
  property: string;
  value: string; // Hex or RGB
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

// ============================================================================
// VISUAL CONSISTENCY CHECKER CLASS
// ============================================================================

export class VisualConsistencyChecker {
  private designTokens: DesignTokens | null = null;

  constructor(designTokens?: DesignTokens) {
    this.designTokens = designTokens || this.getDefaultDesignTokens();
  }

  /**
   * Run comprehensive visual consistency check
   */
  async check(context: CheckContext): Promise<VisualConsistencyReport> {
    if (context.designTokens) {
      this.designTokens = context.designTokens;
    }

    // Run all component analyses in parallel
    const [
      tables,
      buttons,
      forms,
      spacing,
      typography,
      colors
    ] = await Promise.all([
      this.analyzeTables(context),
      this.analyzeButtons(context),
      this.analyzeForms(context),
      this.analyzeSpacing(context),
      this.analyzeTypography(context),
      this.analyzeColors(context)
    ]);

    const componentAnalysis: ComponentAnalysis = {
      tables,
      buttons,
      forms,
      spacing,
      typography,
      colors
    };

    // Calculate token compliance
    const tokenCompliance = this.calculateTokenCompliance(componentAnalysis);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(componentAnalysis);

    // Generate recommendations
    const recommendations = this.generateRecommendations(componentAnalysis);

    // Generate summary
    const summary = this.generateSummary(overallScore, componentAnalysis, tokenCompliance);

    return {
      overallScore,
      componentAnalysis,
      tokenCompliance,
      recommendations,
      summary
    };
  }

  // ==========================================================================
  // TABLE ANALYSIS
  // ==========================================================================

  private async analyzeTables(context: CheckContext): Promise<TableAnalysis> {
    const issues: TableIssue[] = [];
    let totalTables = 0;

    for (const [filePath, content] of context.fileContents) {
      // Detect tables (HTML, JSX, Markdown)
      const htmlTables = content.match(/<table/g)?.length || 0;
      const markdownTables = content.match(/\|[^\n]+\|/g)?.length || 0;
      const componentTables = content.match(/(?:DataTable|TableContainer|Table)/g)?.length || 0;

      totalTables += htmlTables + (markdownTables > 0 ? 1 : 0) + componentTables;

      // Check for inconsistent borders
      if (content.includes('<table') && !content.includes('border')) {
        issues.push({
          file: filePath,
          type: 'inconsistent-borders',
          description: 'Table missing border styling',
          currentValue: 'none',
          expectedValue: 'border: 1px solid',
          severity: 'medium'
        });
      }

      // Check for responsive tables
      if ((htmlTables > 0 || componentTables > 0) && !content.includes('responsive')) {
        issues.push({
          file: filePath,
          type: 'missing-responsive',
          description: 'Table not responsive on mobile',
          currentValue: 'fixed layout',
          expectedValue: 'responsive layout with horizontal scroll',
          severity: 'high'
        });
      }

      // Check for inconsistent padding
      const tablePadding = content.match(/(?:td|th)[^>]*(?:padding|p-):\s*(\d+)/g);
      if (tablePadding && tablePadding.length > 1) {
        const paddings = new Set(tablePadding);
        if (paddings.size > 2) {
          issues.push({
            file: filePath,
            type: 'inconsistent-padding',
            description: 'Table cells have inconsistent padding',
            currentValue: Array.from(paddings).join(', '),
            expectedValue: 'consistent padding (e.g., 12px or 16px)',
            severity: 'medium'
          });
        }
      }
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    const recommendations = this.generateTableRecommendations(issues);

    return { score, totalTables, issues, recommendations };
  }

  private generateTableRecommendations(issues: TableIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'inconsistent-borders')) {
      recommendations.push('Standardize table borders (1px solid, use design token color)');
    }
    if (issues.some(i => i.type === 'missing-responsive')) {
      recommendations.push('Add responsive behavior (horizontal scroll on mobile)');
    }
    if (issues.some(i => i.type === 'inconsistent-padding')) {
      recommendations.push('Use consistent cell padding (12px or 16px from spacing scale)');
    }
    if (issues.some(i => i.type === 'inconsistent-headers')) {
      recommendations.push('Standardize table header styling (bold, background color)');
    }

    return recommendations;
  }

  // ==========================================================================
  // BUTTON ANALYSIS
  // ==========================================================================

  private async analyzeButtons(context: CheckContext): Promise<ButtonAnalysis> {
    const issues: ButtonIssue[] = [];
    const variantMap = new Map<string, ButtonVariant>();
    let totalButtons = 0;

    for (const [filePath, content] of context.fileContents) {
      // Count buttons
      const buttonMatches = content.match(/<button|<Button|btn-/g);
      totalButtons += buttonMatches?.length || 0;

      // Check for inline styles
      const inlineStyleButtons = content.match(/<button[^>]*style=/g);
      if (inlineStyleButtons) {
        issues.push({
          file: filePath,
          type: 'inline-styles',
          description: 'Button uses inline styles instead of design system',
          currentValue: 'inline style',
          expectedValue: 'design system class or component',
          severity: 'high'
        });
      }

      // Check for inconsistent sizing
      const buttonSizes = content.match(/(?:height|h-):\s*(\d+)/g);
      if (buttonSizes && new Set(buttonSizes).size > 3) {
        issues.push({
          file: filePath,
          type: 'inconsistent-size',
          description: 'Buttons have inconsistent sizes',
          currentValue: 'multiple sizes',
          expectedValue: 'standard sizes (sm, md, lg)',
          severity: 'medium'
        });
      }

      // Track button variants
      const variantMatches = content.matchAll(/<Button\s+variant=["']([^"']+)["']/g);
      for (const match of variantMatches) {
        const variant = match[1];
        if (!variantMap.has(variant)) {
          variantMap.set(variant, { name: variant, count: 0, files: [], isStandard: false });
        }
        const v = variantMap.get(variant)!;
        v.count++;
        if (!v.files.includes(filePath)) {
          v.files.push(filePath);
        }
      }
    }

    // Identify non-standard variants
    const standardVariants = new Set(['primary', 'secondary', 'tertiary', 'ghost', 'danger']);
    const variants = Array.from(variantMap.values()).map(v => ({
      ...v,
      isStandard: standardVariants.has(v.name)
    }));

    const nonStandardVariants = variants.filter(v => !v.isStandard);
    if (nonStandardVariants.length > 0) {
      issues.push({
        file: 'multiple',
        type: 'inconsistent-colors',
        description: `Non-standard button variants: ${nonStandardVariants.map(v => v.name).join(', ')}`,
        currentValue: nonStandardVariants.map(v => v.name).join(', '),
        expectedValue: 'primary, secondary, tertiary, ghost, danger',
        severity: 'medium'
      });
    }

    const score = Math.max(0, 100 - (issues.length * 8));
    const recommendations = this.generateButtonRecommendations(issues);

    return { score, totalButtons, issues, recommendations, variants };
  }

  private generateButtonRecommendations(issues: ButtonIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'inline-styles')) {
      recommendations.push('Replace inline styles with design system components');
    }
    if (issues.some(i => i.type === 'inconsistent-size')) {
      recommendations.push('Standardize button sizes (sm: 32px, md: 40px, lg: 48px)');
    }
    if (issues.some(i => i.type === 'inconsistent-colors')) {
      recommendations.push('Use standard button variants (primary, secondary, tertiary, ghost, danger)');
    }

    return recommendations;
  }

  // ==========================================================================
  // FORM ANALYSIS
  // ==========================================================================

  private async analyzeForms(context: CheckContext): Promise<FormAnalysis> {
    const issues: FormIssue[] = [];
    let totalForms = 0;

    for (const [filePath, content] of context.fileContents) {
      const formMatches = content.match(/<form|<Form/g);
      totalForms += formMatches?.length || 0;

      // Check for missing ARIA labels
      if (content.includes('<input') && !content.includes('aria-label')) {
        issues.push({
          file: filePath,
          type: 'missing-aria',
          description: 'Form inputs missing aria-label',
          currentValue: 'no aria-label',
          expectedValue: 'aria-label or aria-labelledby',
          severity: 'high'
        });
      }

      // Check for inconsistent label placement
      const labelAbove = content.match(/<label>[^<]*<input/g)?.length || 0;
      const labelInline = content.match(/<input[^>]*><label/g)?.length || 0;
      if (labelAbove > 0 && labelInline > 0) {
        issues.push({
          file: filePath,
          type: 'inconsistent-labels',
          description: 'Inconsistent label placement',
          currentValue: 'mixed above/inline',
          expectedValue: 'consistent above or inline',
          severity: 'medium'
        });
      }
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    const recommendations = this.generateFormRecommendations(issues);

    return { score, totalForms, issues, recommendations };
  }

  private generateFormRecommendations(issues: FormIssue[]): string[] {
    const recommendations: string[] = [];

    if (issues.some(i => i.type === 'missing-aria')) {
      recommendations.push('Add aria-label to all form inputs');
    }
    if (issues.some(i => i.type === 'inconsistent-labels')) {
      recommendations.push('Standardize label placement (preferably above input)');
    }

    return recommendations;
  }

  // ==========================================================================
  // SPACING ANALYSIS
  // ==========================================================================

  private async analyzeSpacing(context: CheckContext): Promise<SpacingAnalysis> {
    const violations: SpacingViolation[] = [];
    const spacingScale = this.designTokens?.spacing || [4, 8, 12, 16, 24, 32, 48, 64];
    let totalSpacingDeclarations = 0;
    let compliantDeclarations = 0;

    for (const [filePath, content] of context.fileContents) {
      const spacingPattern = /(?:padding|margin|gap|top|bottom|left|right):\s*(\d+)(?:px|rem)/g;
      const matches = content.matchAll(spacingPattern);

      for (const match of matches) {
        totalSpacingDeclarations++;
        const value = parseInt(match[1]);
        const property = match[0].split(':')[0].trim() as SpacingViolation['property'];

        if (spacingScale.includes(value)) {
          compliantDeclarations++;
        } else {
          const nearest = this.findNearestSpacingValue(value, spacingScale);
          violations.push({
            file: filePath,
            property,
            value: `${value}px`,
            nearestTokenValue: `${nearest}px`,
            severity: Math.abs(value - nearest) > 8 ? 'high' : 'medium'
          });
        }
      }
    }

    const adherence = totalSpacingDeclarations > 0
      ? Math.round((compliantDeclarations / totalSpacingDeclarations) * 100)
      : 100;

    const score = adherence;
    const recommendations = [
      `Use spacing scale: ${spacingScale.join(', ')}px`,
      'Replace arbitrary values with design tokens',
      'Consider using spacing variables (e.g., --spacing-4)'
    ];

    return { score, adherence, violations, recommendations };
  }

  private findNearestSpacingValue(value: number, scale: number[]): number {
    return scale.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
  }

  // ==========================================================================
  // TYPOGRAPHY ANALYSIS
  // ==========================================================================

  private async analyzeTypography(context: CheckContext): Promise<TypographyAnalysis> {
    const violations: TypographyViolation[] = [];
    let totalTypographyDeclarations = 0;
    let compliantDeclarations = 0;

    const typographyTokens = this.designTokens?.typography.sizes || {
      'xs': '0.75rem',
      'sm': '0.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    };

    for (const [filePath, content] of context.fileContents) {
      // Check font-size
      const fontSizePattern = /font-size:\s*(\d+(?:\.\d+)?(?:px|rem|em))/g;
      const matches = content.matchAll(fontSizePattern);

      for (const match of matches) {
        totalTypographyDeclarations++;
        const value = match[1];

        const isCompliant = Object.values(typographyTokens).some(token =>
          token === value || token === this.pxToRem(value)
        );

        if (isCompliant) {
          compliantDeclarations++;
        } else {
          violations.push({
            file: filePath,
            property: 'font-size',
            value,
            expectedToken: 'typography scale token',
            severity: 'medium'
          });
        }
      }

      // Check for inline font-family
      if (content.match(/font-family:\s*["'][^"']+["']/)) {
        violations.push({
          file: filePath,
          property: 'font-family',
          value: 'inline font-family',
          expectedToken: 'design token (e.g., font-sans)',
          severity: 'high'
        });
      }
    }

    const adherence = totalTypographyDeclarations > 0
      ? Math.round((compliantDeclarations / totalTypographyDeclarations) * 100)
      : 100;

    const score = adherence;
    const recommendations = [
      'Use typography scale tokens',
      'Avoid inline font-size declarations',
      'Use font-family variables from design system'
    ];

    return { score, adherence, violations, recommendations };
  }

  private pxToRem(value: string): string {
    const px = parseFloat(value);
    return `${px / 16}rem`;
  }

  // ==========================================================================
  // COLOR ANALYSIS
  // ==========================================================================

  private async analyzeColors(context: CheckContext): Promise<ColorAnalysis> {
    const violations: ColorViolation[] = [];
    const paletteUsageMap = new Map<string, PaletteUsage>();
    let totalColorDeclarations = 0;
    let compliantDeclarations = 0;

    const palette = this.designTokens?.colors || {};

    for (const [filePath, content] of context.fileContents) {
      // Check for hardcoded hex colors
      const hexPattern = /#[0-9a-fA-F]{3,6}/g;
      const hexMatches = content.matchAll(hexPattern);

      for (const match of hexMatches) {
        totalColorDeclarations++;
        const color = match[0];

        // Check if color is in palette
        const paletteEntry = Object.entries(palette).find(([_, value]) =>
          value.toLowerCase() === color.toLowerCase()
        );

        if (paletteEntry) {
          compliantDeclarations++;
          const [name, value] = paletteEntry;

          if (!paletteUsageMap.has(name)) {
            paletteUsageMap.set(name, { color: value, name, count: 0, files: [] });
          }
          const usage = paletteUsageMap.get(name)!;
          usage.count++;
          if (!usage.files.includes(filePath)) {
            usage.files.push(filePath);
          }
        } else {
          const nearest = this.findNearestPaletteColor(color, palette);
          violations.push({
            file: filePath,
            property: 'color',
            value: color,
            nearestPaletteColor: nearest,
            severity: 'high'
          });
        }
      }
    }

    const adherence = totalColorDeclarations > 0
      ? Math.round((compliantDeclarations / totalColorDeclarations) * 100)
      : 100;

    const score = adherence;
    const paletteUsage = Array.from(paletteUsageMap.values());
    const recommendations = [
      'Replace hardcoded colors with design tokens',
      'Use semantic color variables (primary, secondary, etc.)',
      'Ensure color contrast meets WCAG AA standards'
    ];

    return { score, adherence, violations, recommendations, paletteUsage };
  }

  private findNearestPaletteColor(color: string, palette: Record<string, string>): string | undefined {
    // Simplified: just return first palette color
    return Object.values(palette)[0];
  }

  // ==========================================================================
  // SCORING & RECOMMENDATIONS
  // ==========================================================================

  private calculateTokenCompliance(analysis: ComponentAnalysis): TokenCompliance {
    const colorsCompliance = analysis.colors.adherence;
    const spacingCompliance = analysis.spacing.adherence;
    const typographyCompliance = analysis.typography.adherence;
    const overallCompliance = Math.round(
      (colorsCompliance + spacingCompliance + typographyCompliance) / 3
    );

    return {
      colorsCompliance,
      spacingCompliance,
      typographyCompliance,
      overallCompliance
    };
  }

  private calculateOverallScore(analysis: ComponentAnalysis): number {
    const scores = [
      analysis.tables.score,
      analysis.buttons.score,
      analysis.forms.score,
      analysis.spacing.score,
      analysis.typography.score,
      analysis.colors.score
    ];

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private generateRecommendations(analysis: ComponentAnalysis): VisualRecommendation[] {
    const recommendations: VisualRecommendation[] = [];

    // Tables
    if (analysis.tables.score < 80) {
      recommendations.push({
        id: 'table-consistency',
        priority: 'high',
        category: 'tables',
        title: 'Standardize Table Components',
        description: 'Tables have inconsistent styling and lack responsive behavior',
        impact: 'Improves user experience on mobile and maintains visual consistency',
        implementation: {
          steps: [
            'Create reusable Table component with consistent styling',
            'Add responsive wrapper for horizontal scroll',
            'Standardize cell padding and border styles'
          ],
          affectedFiles: analysis.tables.issues.map(i => i.file)
        },
        estimatedEffort: 'medium'
      });
    }

    // Buttons
    if (analysis.buttons.score < 80) {
      recommendations.push({
        id: 'button-standardization',
        priority: 'high',
        category: 'buttons',
        title: 'Standardize Button Components',
        description: 'Buttons have inconsistent sizing, colors, and states',
        impact: 'Creates predictable, accessible button interactions',
        implementation: {
          steps: [
            'Define standard button variants (primary, secondary, tertiary)',
            'Create size variants (sm, md, lg)',
            'Implement consistent hover and active states'
          ],
          affectedFiles: analysis.buttons.issues.map(i => i.file)
        },
        estimatedEffort: 'medium'
      });
    }

    return recommendations;
  }

  private generateSummary(
    overallScore: number,
    analysis: ComponentAnalysis,
    compliance: TokenCompliance
  ): string {
    const rating = overallScore >= 90 ? 'Excellent' :
                   overallScore >= 70 ? 'Good' :
                   overallScore >= 50 ? 'Fair' : 'Poor';

    return `Visual consistency is ${rating} (${overallScore}/100). ` +
           `Design token compliance: ${compliance.overallCompliance}%. ` +
           `Key areas needing attention: ${this.getTopIssues(analysis).join(', ')}.`;
  }

  private getTopIssues(analysis: ComponentAnalysis): string[] {
    const issues: string[] = [];

    if (analysis.tables.score < 70) issues.push('tables');
    if (analysis.buttons.score < 70) issues.push('buttons');
    if (analysis.forms.score < 70) issues.push('forms');
    if (analysis.spacing.score < 70) issues.push('spacing');
    if (analysis.typography.score < 70) issues.push('typography');
    if (analysis.colors.score < 70) issues.push('colors');

    return issues.length > 0 ? issues : ['none'];
  }

  private getDefaultDesignTokens(): DesignTokens {
    return {
      colors: {
        'primary': '#3b82f6',
        'secondary': '#6b7280',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
        'background': '#ffffff',
        'text': '#1f2937'
      },
      spacing: [4, 8, 12, 16, 24, 32, 48, 64],
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        sizes: {
          'xs': '0.75rem',
          'sm': '0.875rem',
          'base': '1rem',
          'lg': '1.125rem',
          'xl': '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem'
        },
        weights: {
          'normal': 400,
          'medium': 500,
          'semibold': 600,
          'bold': 700
        },
        lineHeights: {
          'tight': 1.25,
          'normal': 1.5,
          'relaxed': 1.75
        }
      }
    };
  }
}
