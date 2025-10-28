/**
 * UX Review Modules Index
 *
 * Exports all UX review modules for easy import and integration with
 * James-Frontend's UX Excellence Reviewer sub-agent.
 *
 * @module UXReview
 */
export * from './visual-consistency-checker';
export * from './markdown-analyzer';
export * from './ux-report-generator';
// Re-export main classes for convenience
export { VisualConsistencyChecker } from './visual-consistency-checker';
export { MarkdownAnalyzer } from './markdown-analyzer';
export { UXReportGenerator } from './ux-report-generator';
//# sourceMappingURL=index.js.map