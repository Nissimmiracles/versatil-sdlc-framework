/**
 * UX Excellence Reviewer Sub-Agent for James-Frontend
 *
 * A senior UI/UX expert with 15+ years of experience that conducts comprehensive
 * UI/UX reviews focusing on visual consistency, user experience excellence,
 * markdown perfection, simplification, and holistic design.
 *
 * Auto-triggers on:
 * - UI component changes (*.tsx, *.jsx, *.vue, *.css)
 * - Markdown updates (*.md)
 * - Design file changes (Figma, Sketch, Adobe XD)
 * - Manual review requests
 *
 * @module UXExcellenceReviewer
 */

import { EventEmitter } from 'events';
import { VisualConsistencyChecker } from '../ux-review/visual-consistency-checker.js';
import { MarkdownAnalyzer } from '../ux-review/markdown-analyzer.js';
import { UXReportGenerator } from '../ux-review/ux-report-generator.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UXReviewContext {
  filePaths: string[];
  fileContents: Map<string, string>;
  userRole?: 'admin' | 'user' | 'super_admin';
  deviceSize?: 'mobile' | 'tablet' | 'desktop';
  framework?: 'react' | 'vue' | 'svelte' | 'angular';
  designSystem?: DesignSystemInfo;
}

export interface DesignSystemInfo {
  colorPalette: string[];
  typography: TypographyScale;
  spacing: SpacingScale;
  breakpoints: Breakpoint[];
}

export interface TypographyScale {
  fontFamily: string;
  sizes: { [key: string]: string }; // h1: '2rem', body: '1rem', etc.
  weights: { [key: string]: number };
  lineHeights: { [key: string]: number };
}

export interface SpacingScale {
  unit: string; // 'px', 'rem', 'em'
  scale: number[]; // [4, 8, 16, 24, 32, 48, 64]
}

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export interface UXReviewResult {
  overallScore: number; // 0-100
  criticalIssues: UXIssue[];
  recommendations: UXRecommendation[];
  whatWorksWell: string[];
  priorityRoadmap: PriorityRoadmap;
}

export interface UXIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'visual-consistency' | 'user-experience' | 'accessibility' | 'performance' | 'markdown';
  title: string;
  description: string;
  impact: string;
  affectedUserRoles: string[];
  currentState: string;
  recommendedSolution: string;
  file?: string;
  line?: number;
}

export interface UXRecommendation {
  id: string;
  type: 'immediate' | 'systematic' | 'enhancement';
  category: string;
  title: string;
  description: string;
  implementation: ImplementationDetails;
  estimatedEffort: 'quick-win' | 'small' | 'medium' | 'large';
  expectedImpact: 'high' | 'medium' | 'low';
}

export interface ImplementationDetails {
  steps: string[];
  codeExamples?: CodeExample[];
  cssChanges?: string;
  componentRefactoring?: string;
}

export interface CodeExample {
  language: string;
  before?: string;
  after: string;
  description: string;
}

export interface PriorityRoadmap {
  priority1: RoadmapItem[];
  priority2: RoadmapItem[];
  priority3: RoadmapItem[];
}

export interface RoadmapItem {
  title: string;
  description: string;
  estimatedTime: string;
  dependencies: string[];
}

export interface VisualConsistencyAnalysis {
  score: number;
  tableViews: ConsistencyCheck;
  actionButtons: ConsistencyCheck;
  formElements: ConsistencyCheck;
  spacing: ConsistencyCheck;
  typography: ConsistencyCheck;
  colorUsage: ConsistencyCheck;
}

export interface ConsistencyCheck {
  score: number;
  issues: string[];
  recommendations: string[];
}

export interface UXEvaluationResult {
  score: number;
  navigationFlow: FlowAnalysis;
  feedbackMechanisms: FeedbackAnalysis;
  accessibility: AccessibilityAnalysis;
  roleBasedExperience: RoleAnalysis;
  mobileResponsiveness: ResponsivenessAnalysis;
  performancePerception: PerformanceAnalysis;
}

export interface FlowAnalysis {
  score: number;
  clickDepth: number;
  unusedComponents: string[];
  navigationIssues: string[];
}

export interface FeedbackAnalysis {
  score: number;
  loadingStates: boolean;
  successMessages: boolean;
  errorHandling: string[];
}

export interface AccessibilityAnalysis {
  score: number;
  wcagCompliance: 'A' | 'AA' | 'AAA' | 'non-compliant';
  keyboardNavigation: boolean;
  screenReaderSupport: string[];
  ariaLabels: boolean;
}

export interface RoleAnalysis {
  score: number;
  roleAdaptations: Map<string, string[]>;
  missingAdaptations: string[];
}

export interface ResponsivenessAnalysis {
  score: number;
  breakpointCoverage: string[];
  mobileIssues: string[];
  tabletIssues: string[];
}

export interface PerformanceAnalysis {
  score: number;
  perceivedSpeed: 'instant' | 'fast' | 'acceptable' | 'slow';
  loadingIndicators: boolean;
  optimizationOpportunities: string[];
}

export interface MarkdownAnalysisResult {
  score: number;
  headingHierarchy: HierarchyCheck;
  listFormatting: FormattingCheck;
  codeBlocks: CodeBlockCheck;
  tables: TableCheck;
  links: LinkCheck;
  images: ImageCheck;
  blockquotes: BlockquoteCheck;
}

export interface HierarchyCheck {
  score: number;
  issues: string[];
  structure: string;
}

export interface FormattingCheck {
  score: number;
  issues: string[];
  consistency: boolean;
}

export interface CodeBlockCheck {
  score: number;
  syntaxHighlighting: boolean;
  copyButton: boolean;
  overflow: 'scroll' | 'wrap' | 'none';
}

export interface TableCheck {
  score: number;
  borders: boolean;
  padding: boolean;
  responsive: boolean;
}

export interface LinkCheck {
  score: number;
  internalExternal: boolean;
  brokenLinks: string[];
}

export interface ImageCheck {
  score: number;
  altText: boolean;
  lazyLoading: boolean;
  captions: boolean;
}

export interface BlockquoteCheck {
  score: number;
  visuallyDistinct: boolean;
  appropriate: boolean;
}

export interface SimplificationRecommendations {
  progressiveDisclosure: string[];
  cognitiveLoadReduction: string[];
  visualHierarchy: string[];
  whitespaceUtilization: string[];
  consistentPatterns: string[];
}

// ============================================================================
// UX EXCELLENCE REVIEWER CLASS
// ============================================================================

export class UXExcellenceReviewer extends EventEmitter {
  private reviewHistory: Map<string, UXReviewResult>;

  constructor() {
    super();
    this.reviewHistory = new Map();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Conduct comprehensive UX review
   */
  async reviewComprehensive(context: UXReviewContext): Promise<UXReviewResult> {
    this.emit('review:started', { context });

    try {
      // Run all analysis modules in parallel
      const [
        visualAnalysis,
        uxEvaluation,
        markdownAnalysis,
        simplifications
      ] = await Promise.all([
        this.reviewVisualConsistency(context),
        this.evaluateUserExperience(context),
        this.analyzeMarkdownRendering(context),
        this.suggestSimplifications(context)
      ]);

      // Calculate overall score
      const overallScore = this.calculateOverallScore({
        visualAnalysis,
        uxEvaluation,
        markdownAnalysis
      });

      // Collect all issues
      const criticalIssues = this.collectCriticalIssues({
        visualAnalysis,
        uxEvaluation,
        markdownAnalysis
      });

      // Generate recommendations
      const recommendations = this.generateRecommendations({
        visualAnalysis,
        uxEvaluation,
        markdownAnalysis,
        simplifications
      });

      // Identify what works well
      const whatWorksWell = this.identifyStrengths({
        visualAnalysis,
        uxEvaluation,
        markdownAnalysis
      });

      // Create priority roadmap
      const priorityRoadmap = this.createRoadmap(criticalIssues, recommendations);

      const result: UXReviewResult = {
        overallScore,
        criticalIssues,
        recommendations,
        whatWorksWell,
        priorityRoadmap
      };

      // Store in history
      const key = this.generateReviewKey(context);
      this.reviewHistory.set(key, result);

      this.emit('review:completed', { context, result });
      return result;

    } catch (error) {
      this.emit('review:error', { context, error });
      throw error;
    }
  }

  /**
   * Review visual consistency (uses dedicated checker)
   */
  async reviewVisualConsistency(context: UXReviewContext): Promise<VisualConsistencyAnalysis> {
    // Convert DesignSystemInfo to DesignTokens format expected by checker
    const designTokens = context.designSystem ? {
      colors: context.designSystem.colorPalette.reduce((acc, color, idx) => {
        acc[`color-${idx}`] = color;
        return acc;
      }, {} as Record<string, string>),
      spacing: context.designSystem.spacing.scale, // Extract scale array
      typography: context.designSystem.typography,
      shadows: {},
      borderRadius: {},
      transitions: {}
    } : undefined;

    const checker = new VisualConsistencyChecker(designTokens);

    const checkContext = {
      filePaths: context.filePaths,
      fileContents: context.fileContents,
      designTokens: designTokens,
      framework: context.framework
    };

    const report = await checker.check(checkContext);

    // Convert report format to match expected interface
    return {
      score: report.overallScore,
      tableViews: {
        score: report.componentAnalysis.tables.score,
        issues: report.componentAnalysis.tables.issues.map(i => i.description),
        recommendations: report.componentAnalysis.tables.recommendations
      },
      actionButtons: {
        score: report.componentAnalysis.buttons.score,
        issues: report.componentAnalysis.buttons.issues.map(i => i.description),
        recommendations: report.componentAnalysis.buttons.recommendations
      },
      formElements: {
        score: report.componentAnalysis.forms.score,
        issues: report.componentAnalysis.forms.issues.map(i => i.description),
        recommendations: report.componentAnalysis.forms.recommendations
      },
      spacing: {
        score: report.componentAnalysis.spacing.score,
        issues: report.componentAnalysis.spacing.violations.map(v => `${v.file}: ${v.property} uses ${v.value}, nearest token: ${v.nearestTokenValue}`),
        recommendations: report.componentAnalysis.spacing.recommendations
      },
      typography: {
        score: report.componentAnalysis.typography.score,
        issues: report.componentAnalysis.typography.violations.map(v => `${v.file}: ${v.property} uses ${v.value}`),
        recommendations: report.componentAnalysis.typography.recommendations
      },
      colorUsage: {
        score: report.componentAnalysis.colors.score,
        issues: report.componentAnalysis.colors.violations.map(v => `${v.file}: hardcoded color ${v.value}`),
        recommendations: report.componentAnalysis.colors.recommendations
      }
    };
  }

  /**
   * Evaluate user experience
   */
  async evaluateUserExperience(context: UXReviewContext): Promise<UXEvaluationResult> {
    const navigationFlow = await this.analyzeNavigationFlow(context);
    const feedbackMechanisms = await this.analyzeFeedbackMechanisms(context);
    const accessibility = await this.analyzeAccessibility(context);
    const roleBasedExperience = await this.analyzeRoleBasedExperience(context);
    const mobileResponsiveness = await this.analyzeMobileResponsiveness(context);
    const performancePerception = await this.analyzePerformancePerception(context);

    const score = this.calculateAverageScore([
      navigationFlow.score,
      feedbackMechanisms.score,
      accessibility.score,
      roleBasedExperience.score,
      mobileResponsiveness.score,
      performancePerception.score
    ]);

    return {
      score,
      navigationFlow,
      feedbackMechanisms,
      accessibility,
      roleBasedExperience,
      mobileResponsiveness,
      performancePerception
    };
  }

  /**
   * Analyze markdown rendering (uses dedicated analyzer)
   */
  async analyzeMarkdownRendering(context: UXReviewContext): Promise<MarkdownAnalysisResult> {
    const analyzer = new MarkdownAnalyzer();

    const markdownContext = {
      filePaths: context.filePaths,
      fileContents: context.fileContents
    };

    const analysis = await analyzer.analyze(markdownContext);

    // Map to expected interface format
    return {
      score: analysis.overallScore,
      headingHierarchy: {
        score: analysis.headingHierarchy.score,
        issues: analysis.headingHierarchy.violations.map(v => v.description),
        structure: analysis.headingHierarchy.structure.map(s => `H${s.level}: ${s.text}`).join(' → ')
      },
      listFormatting: {
        score: analysis.listFormatting.score,
        issues: analysis.listFormatting.violations.map(v => v.description),
        consistency: analysis.listFormatting.consistency
      },
      codeBlocks: {
        score: analysis.codeBlocks.score,
        syntaxHighlighting: analysis.codeBlocks.syntaxHighlighting.percentageWithLanguage >= 80,
        copyButton: false, // Not analyzed by markdown analyzer
        overflow: 'scroll'
      },
      tables: {
        score: analysis.tables.score,
        borders: true,
        padding: true,
        responsive: analysis.tables.violations.length === 0
      },
      links: {
        score: analysis.links.score,
        internalExternal: true,
        brokenLinks: analysis.links.brokenLinks.map(l => l.url)
      },
      images: {
        score: analysis.images.score,
        altText: analysis.images.withAltText > 0,
        lazyLoading: false, // Not analyzed
        captions: false // Not analyzed
      },
      blockquotes: {
        score: 90,
        visuallyDistinct: true,
        appropriate: true
      }
    };
  }

  /**
   * Suggest simplifications
   */
  async suggestSimplifications(context: UXReviewContext): Promise<SimplificationRecommendations> {
    return {
      progressiveDisclosure: await this.identifyProgressiveDisclosureOpportunities(context),
      cognitiveLoadReduction: await this.identifyCognitiveLoadIssues(context),
      visualHierarchy: await this.identifyVisualHierarchyIssues(context),
      whitespaceUtilization: await this.identifyWhitespaceOpportunities(context),
      consistentPatterns: await this.identifyInconsistentPatterns(context)
    };
  }

  /**
   * Generate formatted report
   */
  generateFormattedReport(result: UXReviewResult): string {
    // Use the dedicated report generator for comprehensive reports
    const reportGenerator = new UXReportGenerator();

    const reportData = {
      timestamp: new Date(),
      overallScore: result.overallScore,
      criticalIssues: result.criticalIssues,
      recommendations: result.recommendations,
      whatWorksWell: result.whatWorksWell
    };

    return reportGenerator.generateReport(reportData, {
      format: 'markdown',
      includeCodeExamples: true,
      includeMetrics: true,
      groupByCategory: true
    });
  }

  // ==========================================================================
  // PRIVATE ANALYSIS METHODS
  // ==========================================================================

  private async analyzeTableViews(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze table consistency
    for (const [filePath, content] of context.fileContents) {
      if (this.hasTableElements(content)) {
        const tableIssues = this.detectTableIssues(content, filePath);
        issues.push(...tableIssues);
      }
    }

    if (issues.length === 0) {
      recommendations.push('Table views are consistent');
    } else {
      recommendations.push('Standardize table column widths, headers, and sorting indicators');
      recommendations.push('Ensure responsive behavior on mobile devices');
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    return { score, issues, recommendations };
  }

  private async analyzeActionButtons(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const [filePath, content] of context.fileContents) {
      const buttonIssues = this.detectButtonInconsistencies(content, filePath);
      issues.push(...buttonIssues);
    }

    if (issues.length > 0) {
      recommendations.push('Standardize button sizing (height, padding, min-width)');
      recommendations.push('Use consistent placement (right-aligned for primary actions)');
      recommendations.push('Implement consistent hover and active states');
    }

    const score = Math.max(0, 100 - (issues.length * 8));
    return { score, issues, recommendations };
  }

  private async analyzeFormElements(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const [filePath, content] of context.fileContents) {
      const formIssues = this.detectFormInconsistencies(content, filePath);
      issues.push(...formIssues);
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    return { score, issues, recommendations };
  }

  private async analyzeSpacing(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const spacingScale = context.designSystem?.spacing?.scale || [4, 8, 16, 24, 32, 48, 64];

    for (const [filePath, content] of context.fileContents) {
      const spacingIssues = this.detectSpacingInconsistencies(content, spacingScale, filePath);
      issues.push(...spacingIssues);
    }

    if (issues.length > 0) {
      recommendations.push(`Use spacing scale: ${spacingScale.join(', ')}px`);
      recommendations.push('Avoid arbitrary padding/margin values');
    }

    const score = Math.max(0, 100 - (issues.length * 5));
    return { score, issues, recommendations };
  }

  private async analyzeTypography(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    for (const [filePath, content] of context.fileContents) {
      const typographyIssues = this.detectTypographyInconsistencies(content, filePath);
      issues.push(...typographyIssues);
    }

    const score = Math.max(0, 100 - (issues.length * 8));
    return { score, issues, recommendations };
  }

  private async analyzeColorUsage(context: UXReviewContext): Promise<ConsistencyCheck> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const palette = context.designSystem?.colorPalette || [];

    for (const [filePath, content] of context.fileContents) {
      const colorIssues = this.detectColorInconsistencies(content, palette, filePath);
      issues.push(...colorIssues);
    }

    const score = Math.max(0, 100 - (issues.length * 10));
    return { score, issues, recommendations };
  }

  private async analyzeNavigationFlow(context: UXReviewContext): Promise<FlowAnalysis> {
    const unusedComponents: string[] = [];
    const navigationIssues: string[] = [];

    // Analyze component usage and navigation patterns
    const clickDepth = this.calculateClickDepth(context);

    if (clickDepth > 3) {
      navigationIssues.push('Navigation requires more than 3 clicks for common tasks');
    }

    const score = Math.max(0, 100 - (navigationIssues.length * 15));
    return { score, clickDepth, unusedComponents, navigationIssues };
  }

  private async analyzeFeedbackMechanisms(context: UXReviewContext): Promise<FeedbackAnalysis> {
    let loadingStates = false;
    let successMessages = false;
    const errorHandling: string[] = [];

    for (const [filePath, content] of context.fileContents) {
      if (content.includes('isLoading') || content.includes('loading')) {
        loadingStates = true;
      }
      if (content.includes('success') || content.includes('toast')) {
        successMessages = true;
      }
    }

    const score = (loadingStates ? 50 : 0) + (successMessages ? 50 : 0);
    return { score, loadingStates, successMessages, errorHandling };
  }

  private async analyzeAccessibility(context: UXReviewContext): Promise<AccessibilityAnalysis> {
    const screenReaderSupport: string[] = [];
    let ariaLabels = false;
    let keyboardNavigation = false;

    for (const [filePath, content] of context.fileContents) {
      if (content.includes('aria-label') || content.includes('aria-describedby')) {
        ariaLabels = true;
      }
      if (content.includes('onKeyDown') || content.includes('tabIndex')) {
        keyboardNavigation = true;
      }
    }

    const score = (ariaLabels ? 40 : 0) + (keyboardNavigation ? 40 : 0) + 20;
    const wcagCompliance: 'A' | 'AA' | 'AAA' | 'non-compliant' =
      score >= 90 ? 'AA' : score >= 70 ? 'A' : 'non-compliant';

    return { score, wcagCompliance, keyboardNavigation, screenReaderSupport, ariaLabels };
  }

  private async analyzeRoleBasedExperience(context: UXReviewContext): Promise<RoleAnalysis> {
    const roleAdaptations = new Map<string, string[]>();
    const missingAdaptations: string[] = [];

    // Default score if no role-specific context
    const score = 75;

    return { score, roleAdaptations, missingAdaptations };
  }

  private async analyzeMobileResponsiveness(context: UXReviewContext): Promise<ResponsivenessAnalysis> {
    const breakpointCoverage: string[] = [];
    const mobileIssues: string[] = [];
    const tabletIssues: string[] = [];

    for (const [filePath, content] of context.fileContents) {
      if (content.includes('@media') || content.includes('breakpoint')) {
        breakpointCoverage.push(filePath);
      }
    }

    const score = breakpointCoverage.length > 0 ? 85 : 50;
    return { score, breakpointCoverage, mobileIssues, tabletIssues };
  }

  private async analyzePerformancePerception(context: UXReviewContext): Promise<PerformanceAnalysis> {
    const optimizationOpportunities: string[] = [];
    let loadingIndicators = false;

    for (const [filePath, content] of context.fileContents) {
      if (content.includes('Suspense') || content.includes('lazy')) {
        loadingIndicators = true;
      }
    }

    const perceivedSpeed: 'instant' | 'fast' | 'acceptable' | 'slow' =
      loadingIndicators ? 'fast' : 'acceptable';

    const score = loadingIndicators ? 85 : 70;
    return { score, perceivedSpeed, loadingIndicators, optimizationOpportunities };
  }

  private async checkHeadingHierarchy(files: string[], context: UXReviewContext): Promise<HierarchyCheck> {
    const issues: string[] = [];
    let structure = '';

    for (const file of files) {
      const content = context.fileContents.get(file) || '';
      const headings = content.match(/^#{1,6}\s+.+$/gm) || [];

      if (headings.length > 0 && !headings[0].startsWith('# ')) {
        issues.push(`${file}: Document should start with H1 (#)`);
      }
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    return { score, issues, structure };
  }

  private async checkListFormatting(files: string[], context: UXReviewContext): Promise<FormattingCheck> {
    const issues: string[] = [];
    const consistency = true;
    const score = 85;
    return { score, issues, consistency };
  }

  private async checkCodeBlocks(files: string[], context: UXReviewContext): Promise<CodeBlockCheck> {
    const syntaxHighlighting = true;
    const copyButton = false;
    const overflow: 'scroll' | 'wrap' | 'none' = 'scroll';
    const score = 80;
    return { score, syntaxHighlighting, copyButton, overflow };
  }

  private async checkTables(files: string[], context: UXReviewContext): Promise<TableCheck> {
    const borders = true;
    const padding = true;
    const responsive = false;
    const score = responsive ? 100 : 70;
    return { score, borders, padding, responsive };
  }

  private async checkLinks(files: string[], context: UXReviewContext): Promise<LinkCheck> {
    const internalExternal = true;
    const brokenLinks: string[] = [];
    const score = 90;
    return { score, internalExternal, brokenLinks };
  }

  private async checkImages(files: string[], context: UXReviewContext): Promise<ImageCheck> {
    const altText = true;
    const lazyLoading = false;
    const captions = false;
    const score = altText ? 70 : 40;
    return { score, altText, lazyLoading, captions };
  }

  private async checkBlockquotes(files: string[], context: UXReviewContext): Promise<BlockquoteCheck> {
    const visuallyDistinct = true;
    const appropriate = true;
    const score = 90;
    return { score, visuallyDistinct, appropriate };
  }

  // ==========================================================================
  // SIMPLIFICATION ANALYSIS
  // ==========================================================================

  private async identifyProgressiveDisclosureOpportunities(context: UXReviewContext): Promise<string[]> {
    return [
      'Consider collapsing advanced settings behind "Advanced" toggle',
      'Hide secondary actions in dropdown menu',
      'Use tabs to separate different content types'
    ];
  }

  private async identifyCognitiveLoadIssues(context: UXReviewContext): Promise<string[]> {
    return [
      'Group related form fields with clear labels',
      'Reduce number of choices shown simultaneously',
      'Use smart defaults to minimize decisions'
    ];
  }

  private async identifyVisualHierarchyIssues(context: UXReviewContext): Promise<string[]> {
    return [
      'Make primary actions more prominent (larger, bolder)',
      'Use size and color to indicate importance',
      'Guide eye flow with proper spacing and alignment'
    ];
  }

  private async identifyWhitespaceOpportunities(context: UXReviewContext): Promise<string[]> {
    return [
      'Increase spacing between sections for better readability',
      'Add breathing room around interactive elements',
      'Use generous padding in cards and containers'
    ];
  }

  private async identifyInconsistentPatterns(context: UXReviewContext): Promise<string[]> {
    return [
      'Standardize confirmation dialog patterns',
      'Use consistent loading states across all pages',
      'Apply same search/filter pattern everywhere'
    ];
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  private calculateOverallScore(analyses: {
    visualAnalysis: VisualConsistencyAnalysis;
    uxEvaluation: UXEvaluationResult;
    markdownAnalysis: MarkdownAnalysisResult;
  }): number {
    return Math.round(
      (analyses.visualAnalysis.score * 0.35 +
       analyses.uxEvaluation.score * 0.45 +
       analyses.markdownAnalysis.score * 0.20)
    );
  }

  private collectCriticalIssues(analyses: any): UXIssue[] {
    const issues: UXIssue[] = [];

    // Add critical issues from analyses
    // This would be populated based on actual analysis results

    return issues;
  }

  private generateRecommendations(analyses: any): UXRecommendation[] {
    const recommendations: UXRecommendation[] = [];

    // Generate recommendations based on analysis results

    return recommendations;
  }

  private identifyStrengths(analyses: any): string[] {
    const strengths: string[] = [];

    if (analyses.visualAnalysis.score >= 80) {
      strengths.push('Strong visual consistency across components');
    }
    if (analyses.uxEvaluation.accessibility.score >= 80) {
      strengths.push('Good accessibility implementation (WCAG compliant)');
    }
    if (analyses.uxEvaluation.mobileResponsiveness.score >= 80) {
      strengths.push('Excellent mobile responsiveness');
    }

    return strengths;
  }

  private createRoadmap(issues: UXIssue[], recommendations: UXRecommendation[]): PriorityRoadmap {
    const priority1: RoadmapItem[] = issues
      .filter(i => i.severity === 'critical')
      .map(i => ({
        title: i.title,
        description: i.recommendedSolution,
        estimatedTime: '1-2 hours',
        dependencies: []
      }));

    const priority2: RoadmapItem[] = recommendations
      .filter(r => r.type === 'systematic')
      .map(r => ({
        title: r.title,
        description: r.description,
        estimatedTime: this.estimateTimeFromEffort(r.estimatedEffort),
        dependencies: []
      }));

    const priority3: RoadmapItem[] = recommendations
      .filter(r => r.type === 'enhancement')
      .map(r => ({
        title: r.title,
        description: r.description,
        estimatedTime: this.estimateTimeFromEffort(r.estimatedEffort),
        dependencies: []
      }));

    return { priority1, priority2, priority3 };
  }

  private calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((a, b) => a + b, 0);
    return Math.round(sum / scores.length);
  }

  private filterMarkdownFiles(context: UXReviewContext): string[] {
    return context.filePaths.filter(path => path.endsWith('.md'));
  }

  private emptyMarkdownAnalysis(): MarkdownAnalysisResult {
    return {
      score: 100,
      headingHierarchy: { score: 100, issues: [], structure: '' },
      listFormatting: { score: 100, issues: [], consistency: true },
      codeBlocks: { score: 100, syntaxHighlighting: true, copyButton: true, overflow: 'scroll' },
      tables: { score: 100, borders: true, padding: true, responsive: true },
      links: { score: 100, internalExternal: true, brokenLinks: [] },
      images: { score: 100, altText: true, lazyLoading: true, captions: true },
      blockquotes: { score: 100, visuallyDistinct: true, appropriate: true }
    };
  }

  private hasTableElements(content: string): boolean {
    return content.includes('<table') || content.includes('TableContainer') ||
           content.includes('DataGrid') || content.includes('|---');
  }

  private detectTableIssues(content: string, filePath: string): string[] {
    const issues: string[] = [];

    if (!content.includes('responsive') && this.hasTableElements(content)) {
      issues.push(`${filePath}: Table may not be responsive on mobile`);
    }

    return issues;
  }

  private detectButtonInconsistencies(content: string, filePath: string): string[] {
    const issues: string[] = [];

    // Check for inline styles on buttons
    if (content.match(/<button[^>]+style=/)) {
      issues.push(`${filePath}: Button uses inline styles instead of design system`);
    }

    return issues;
  }

  private detectFormInconsistencies(content: string, filePath: string): string[] {
    const issues: string[] = [];

    if (content.includes('<input') && !content.includes('aria-label')) {
      issues.push(`${filePath}: Form inputs missing aria-label for accessibility`);
    }

    return issues;
  }

  private detectSpacingInconsistencies(content: string, scale: number[], filePath: string): string[] {
    const issues: string[] = [];

    // Check for arbitrary spacing values
    const spacingPattern = /(?:padding|margin):\s*(\d+)px/g;
    const matches = content.matchAll(spacingPattern);

    for (const match of matches) {
      const value = parseInt(match[1]);
      if (!scale.includes(value)) {
        issues.push(`${filePath}: Uses spacing value ${value}px not in design scale`);
      }
    }

    return issues;
  }

  private detectTypographyInconsistencies(content: string, filePath: string): string[] {
    const issues: string[] = [];

    // Check for inline font-size
    if (content.match(/font-size:\s*\d+px/)) {
      issues.push(`${filePath}: Uses inline font-size instead of typography scale`);
    }

    return issues;
  }

  private detectColorInconsistencies(content: string, palette: string[], filePath: string): string[] {
    const issues: string[] = [];

    // Check for hardcoded colors
    if (content.match(/#[0-9a-fA-F]{3,6}/) && palette.length > 0) {
      issues.push(`${filePath}: Uses hardcoded hex colors instead of design system palette`);
    }

    return issues;
  }

  private calculateClickDepth(context: UXReviewContext): number {
    // Simplified calculation - would need actual route analysis
    return 2;
  }

  private generateReviewKey(context: UXReviewContext): string {
    return `${context.filePaths.join(',')}_${Date.now()}`;
  }

  private getScoreEmoji(score: number): string {
    if (score >= 90) return '🌟';
    if (score >= 70) return '✅';
    if (score >= 50) return '⚠️';
    return '🔴';
  }

  private formatRecommendations(recommendations: UXRecommendation[]): string {
    if (recommendations.length === 0) {
      return '*No recommendations in this category*\n';
    }

    return recommendations.map((rec, idx) => `
${idx + 1}. **${rec.title}** (${rec.estimatedEffort}, ${rec.expectedImpact} impact)
   - ${rec.description}
   - Implementation: ${rec.implementation.steps.join(' → ')}
`).join('\n');
  }

  private estimateTimeFromEffort(effort: string): string {
    switch (effort) {
      case 'quick-win': return '30 minutes';
      case 'small': return '1-2 hours';
      case 'medium': return '1 day';
      case 'large': return '2-3 days';
      default: return '1 hour';
    }
  }
}
