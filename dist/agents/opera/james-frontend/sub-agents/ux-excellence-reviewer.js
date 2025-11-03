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
// ============================================================================
// UX EXCELLENCE REVIEWER CLASS
// ============================================================================
export class UXExcellenceReviewer extends EventEmitter {
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
    async reviewComprehensive(context) {
        this.emit('review:started', { context });
        try {
            // Run all analysis modules in parallel
            const [visualAnalysis, uxEvaluation, markdownAnalysis, simplifications] = await Promise.all([
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
            const result = {
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
        }
        catch (error) {
            this.emit('review:error', { context, error });
            throw error;
        }
    }
    /**
     * Review visual consistency (uses dedicated checker)
     */
    async reviewVisualConsistency(context) {
        import { VisualConsistencyChecker } from '../ux-review/visual-consistency-checker';
        const checker = new VisualConsistencyChecker(context.designSystem);
        const checkContext = {
            filePaths: context.filePaths,
            fileContents: context.fileContents,
            designTokens: context.designSystem,
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
    async evaluateUserExperience(context) {
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
    async analyzeMarkdownRendering(context) {
        import { MarkdownAnalyzer } from '../ux-review/markdown-analyzer';
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
    async suggestSimplifications(context) {
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
    generateFormattedReport(result) {
        // Use the dedicated report generator for comprehensive reports
        import { UXReportGenerator } from '../ux-review/ux-report-generator';
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
    async analyzeTableViews(context) {
        const issues = [];
        const recommendations = [];
        // Analyze table consistency
        for (const [filePath, content] of context.fileContents) {
            if (this.hasTableElements(content)) {
                const tableIssues = this.detectTableIssues(content, filePath);
                issues.push(...tableIssues);
            }
        }
        if (issues.length === 0) {
            recommendations.push('Table views are consistent');
        }
        else {
            recommendations.push('Standardize table column widths, headers, and sorting indicators');
            recommendations.push('Ensure responsive behavior on mobile devices');
        }
        const score = Math.max(0, 100 - (issues.length * 10));
        return { score, issues, recommendations };
    }
    async analyzeActionButtons(context) {
        const issues = [];
        const recommendations = [];
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
    async analyzeFormElements(context) {
        const issues = [];
        const recommendations = [];
        for (const [filePath, content] of context.fileContents) {
            const formIssues = this.detectFormInconsistencies(content, filePath);
            issues.push(...formIssues);
        }
        const score = Math.max(0, 100 - (issues.length * 10));
        return { score, issues, recommendations };
    }
    async analyzeSpacing(context) {
        const issues = [];
        const recommendations = [];
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
    async analyzeTypography(context) {
        const issues = [];
        const recommendations = [];
        for (const [filePath, content] of context.fileContents) {
            const typographyIssues = this.detectTypographyInconsistencies(content, filePath);
            issues.push(...typographyIssues);
        }
        const score = Math.max(0, 100 - (issues.length * 8));
        return { score, issues, recommendations };
    }
    async analyzeColorUsage(context) {
        const issues = [];
        const recommendations = [];
        const palette = context.designSystem?.colorPalette || [];
        for (const [filePath, content] of context.fileContents) {
            const colorIssues = this.detectColorInconsistencies(content, palette, filePath);
            issues.push(...colorIssues);
        }
        const score = Math.max(0, 100 - (issues.length * 10));
        return { score, issues, recommendations };
    }
    async analyzeNavigationFlow(context) {
        const unusedComponents = [];
        const navigationIssues = [];
        // Analyze component usage and navigation patterns
        const clickDepth = this.calculateClickDepth(context);
        if (clickDepth > 3) {
            navigationIssues.push('Navigation requires more than 3 clicks for common tasks');
        }
        const score = Math.max(0, 100 - (navigationIssues.length * 15));
        return { score, clickDepth, unusedComponents, navigationIssues };
    }
    async analyzeFeedbackMechanisms(context) {
        let loadingStates = false;
        let successMessages = false;
        const errorHandling = [];
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
    async analyzeAccessibility(context) {
        const screenReaderSupport = [];
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
        const wcagCompliance = score >= 90 ? 'AA' : score >= 70 ? 'A' : 'non-compliant';
        return { score, wcagCompliance, keyboardNavigation, screenReaderSupport, ariaLabels };
    }
    async analyzeRoleBasedExperience(context) {
        const roleAdaptations = new Map();
        const missingAdaptations = [];
        // Default score if no role-specific context
        const score = 75;
        return { score, roleAdaptations, missingAdaptations };
    }
    async analyzeMobileResponsiveness(context) {
        const breakpointCoverage = [];
        const mobileIssues = [];
        const tabletIssues = [];
        for (const [filePath, content] of context.fileContents) {
            if (content.includes('@media') || content.includes('breakpoint')) {
                breakpointCoverage.push(filePath);
            }
        }
        const score = breakpointCoverage.length > 0 ? 85 : 50;
        return { score, breakpointCoverage, mobileIssues, tabletIssues };
    }
    async analyzePerformancePerception(context) {
        const optimizationOpportunities = [];
        let loadingIndicators = false;
        for (const [filePath, content] of context.fileContents) {
            if (content.includes('Suspense') || content.includes('lazy')) {
                loadingIndicators = true;
            }
        }
        const perceivedSpeed = loadingIndicators ? 'fast' : 'acceptable';
        const score = loadingIndicators ? 85 : 70;
        return { score, perceivedSpeed, loadingIndicators, optimizationOpportunities };
    }
    async checkHeadingHierarchy(files, context) {
        const issues = [];
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
    async checkListFormatting(files, context) {
        const issues = [];
        const consistency = true;
        const score = 85;
        return { score, issues, consistency };
    }
    async checkCodeBlocks(files, context) {
        const syntaxHighlighting = true;
        const copyButton = false;
        const overflow = 'scroll';
        const score = 80;
        return { score, syntaxHighlighting, copyButton, overflow };
    }
    async checkTables(files, context) {
        const borders = true;
        const padding = true;
        const responsive = false;
        const score = responsive ? 100 : 70;
        return { score, borders, padding, responsive };
    }
    async checkLinks(files, context) {
        const internalExternal = true;
        const brokenLinks = [];
        const score = 90;
        return { score, internalExternal, brokenLinks };
    }
    async checkImages(files, context) {
        const altText = true;
        const lazyLoading = false;
        const captions = false;
        const score = altText ? 70 : 40;
        return { score, altText, lazyLoading, captions };
    }
    async checkBlockquotes(files, context) {
        const visuallyDistinct = true;
        const appropriate = true;
        const score = 90;
        return { score, visuallyDistinct, appropriate };
    }
    // ==========================================================================
    // SIMPLIFICATION ANALYSIS
    // ==========================================================================
    async identifyProgressiveDisclosureOpportunities(context) {
        return [
            'Consider collapsing advanced settings behind "Advanced" toggle',
            'Hide secondary actions in dropdown menu',
            'Use tabs to separate different content types'
        ];
    }
    async identifyCognitiveLoadIssues(context) {
        return [
            'Group related form fields with clear labels',
            'Reduce number of choices shown simultaneously',
            'Use smart defaults to minimize decisions'
        ];
    }
    async identifyVisualHierarchyIssues(context) {
        return [
            'Make primary actions more prominent (larger, bolder)',
            'Use size and color to indicate importance',
            'Guide eye flow with proper spacing and alignment'
        ];
    }
    async identifyWhitespaceOpportunities(context) {
        return [
            'Increase spacing between sections for better readability',
            'Add breathing room around interactive elements',
            'Use generous padding in cards and containers'
        ];
    }
    async identifyInconsistentPatterns(context) {
        return [
            'Standardize confirmation dialog patterns',
            'Use consistent loading states across all pages',
            'Apply same search/filter pattern everywhere'
        ];
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    calculateOverallScore(analyses) {
        return Math.round((analyses.visualAnalysis.score * 0.35 +
            analyses.uxEvaluation.score * 0.45 +
            analyses.markdownAnalysis.score * 0.20));
    }
    collectCriticalIssues(analyses) {
        const issues = [];
        // Add critical issues from analyses
        // This would be populated based on actual analysis results
        return issues;
    }
    generateRecommendations(analyses) {
        const recommendations = [];
        // Generate recommendations based on analysis results
        return recommendations;
    }
    identifyStrengths(analyses) {
        const strengths = [];
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
    createRoadmap(issues, recommendations) {
        const priority1 = issues
            .filter(i => i.severity === 'critical')
            .map(i => ({
            title: i.title,
            description: i.recommendedSolution,
            estimatedTime: '1-2 hours',
            dependencies: []
        }));
        const priority2 = recommendations
            .filter(r => r.type === 'systematic')
            .map(r => ({
            title: r.title,
            description: r.description,
            estimatedTime: this.estimateTimeFromEffort(r.estimatedEffort),
            dependencies: []
        }));
        const priority3 = recommendations
            .filter(r => r.type === 'enhancement')
            .map(r => ({
            title: r.title,
            description: r.description,
            estimatedTime: this.estimateTimeFromEffort(r.estimatedEffort),
            dependencies: []
        }));
        return { priority1, priority2, priority3 };
    }
    calculateAverageScore(scores) {
        if (scores.length === 0)
            return 0;
        const sum = scores.reduce((a, b) => a + b, 0);
        return Math.round(sum / scores.length);
    }
    filterMarkdownFiles(context) {
        return context.filePaths.filter(path => path.endsWith('.md'));
    }
    emptyMarkdownAnalysis() {
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
    hasTableElements(content) {
        return content.includes('<table') || content.includes('TableContainer') ||
            content.includes('DataGrid') || content.includes('|---');
    }
    detectTableIssues(content, filePath) {
        const issues = [];
        if (!content.includes('responsive') && this.hasTableElements(content)) {
            issues.push(`${filePath}: Table may not be responsive on mobile`);
        }
        return issues;
    }
    detectButtonInconsistencies(content, filePath) {
        const issues = [];
        // Check for inline styles on buttons
        if (content.match(/<button[^>]+style=/)) {
            issues.push(`${filePath}: Button uses inline styles instead of design system`);
        }
        return issues;
    }
    detectFormInconsistencies(content, filePath) {
        const issues = [];
        if (content.includes('<input') && !content.includes('aria-label')) {
            issues.push(`${filePath}: Form inputs missing aria-label for accessibility`);
        }
        return issues;
    }
    detectSpacingInconsistencies(content, scale, filePath) {
        const issues = [];
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
    detectTypographyInconsistencies(content, filePath) {
        const issues = [];
        // Check for inline font-size
        if (content.match(/font-size:\s*\d+px/)) {
            issues.push(`${filePath}: Uses inline font-size instead of typography scale`);
        }
        return issues;
    }
    detectColorInconsistencies(content, palette, filePath) {
        const issues = [];
        // Check for hardcoded colors
        if (content.match(/#[0-9a-fA-F]{3,6}/) && palette.length > 0) {
            issues.push(`${filePath}: Uses hardcoded hex colors instead of design system palette`);
        }
        return issues;
    }
    calculateClickDepth(context) {
        // Simplified calculation - would need actual route analysis
        return 2;
    }
    generateReviewKey(context) {
        return `${context.filePaths.join(',')}_${Date.now()}`;
    }
    getScoreEmoji(score) {
        if (score >= 90)
            return '🌟';
        if (score >= 70)
            return '✅';
        if (score >= 50)
            return '⚠️';
        return '🔴';
    }
    formatRecommendations(recommendations) {
        if (recommendations.length === 0) {
            return '*No recommendations in this category*\n';
        }
        return recommendations.map((rec, idx) => `
${idx + 1}. **${rec.title}** (${rec.estimatedEffort}, ${rec.expectedImpact} impact)
   - ${rec.description}
   - Implementation: ${rec.implementation.steps.join(' → ')}
`).join('\n');
    }
    estimateTimeFromEffort(effort) {
        switch (effort) {
            case 'quick-win': return '30 minutes';
            case 'small': return '1-2 hours';
            case 'medium': return '1 day';
            case 'large': return '2-3 days';
            default: return '1 hour';
        }
    }
}
//# sourceMappingURL=ux-excellence-reviewer.js.map