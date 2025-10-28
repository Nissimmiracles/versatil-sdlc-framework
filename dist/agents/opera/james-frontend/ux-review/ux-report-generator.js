/**
 * UX Report Generator
 *
 * Generates comprehensive UX reports with priority roadmaps, actionable
 * recommendations, and executive summaries. Supports multiple export formats.
 *
 * @module UXReportGenerator
 */
// ============================================================================
// UX REPORT GENERATOR CLASS
// ============================================================================
export class UXReportGenerator {
    /**
     * Generate comprehensive UX report
     */
    generateReport(data, options) {
        const exportOptions = {
            format: 'markdown',
            includeCodeExamples: true,
            includeScreenshots: false,
            includeMetrics: true,
            groupByCategory: true,
            ...options
        };
        switch (exportOptions.format) {
            case 'json':
                return this.generateJSONReport(data);
            case 'html':
                return this.generateHTMLReport(data, exportOptions);
            case 'markdown':
            default:
                return this.generateMarkdownReport(data, exportOptions);
        }
    }
    /**
     * Generate priority roadmap from issues and recommendations
     */
    generatePriorityRoadmap(issues, recommendations) {
        // Priority 1: Critical issues
        const criticalItems = this.createRoadmapItems(issues.filter(i => i.severity === 'critical'), recommendations.filter(r => r.type === 'immediate'));
        // Priority 2: High priority issues
        const highItems = this.createRoadmapItems(issues.filter(i => i.severity === 'high'), recommendations.filter(r => r.type === 'systematic' && r.expectedImpact === 'high'));
        // Priority 3: Medium priority improvements
        const mediumItems = this.createRoadmapItems(issues.filter(i => i.severity === 'medium'), recommendations.filter(r => r.type === 'systematic' && r.expectedImpact === 'medium'));
        // Priority 4: Low priority enhancements
        const lowItems = this.createRoadmapItems(issues.filter(i => i.severity === 'low'), recommendations.filter(r => r.type === 'enhancement'));
        return {
            priority1Critical: {
                title: 'Priority 1: Critical Fixes',
                description: 'These issues block users or violate accessibility standards',
                items: criticalItems,
                estimatedTotalTime: this.calculateTotalTime(criticalItems),
                expectedImpact: 'High - Immediate user experience improvement'
            },
            priority2High: {
                title: 'Priority 2: High Priority Improvements',
                description: 'Significant UX improvements with measurable impact',
                items: highItems,
                estimatedTotalTime: this.calculateTotalTime(highItems),
                expectedImpact: 'High - Substantial quality improvement'
            },
            priority3Medium: {
                title: 'Priority 3: Consistency Improvements',
                description: 'Visual and interaction consistency enhancements',
                items: mediumItems,
                estimatedTotalTime: this.calculateTotalTime(mediumItems),
                expectedImpact: 'Medium - Improved consistency and polish'
            },
            priority4Low: {
                title: 'Priority 4: Enhancement Opportunities',
                description: 'Nice-to-have improvements for elevated experience',
                items: lowItems,
                estimatedTotalTime: this.calculateTotalTime(lowItems),
                expectedImpact: 'Medium - Enhanced user delight'
            }
        };
    }
    /**
     * Calculate UX score from component scores
     */
    calculateOverallScore(componentScores) {
        const scores = Object.values(componentScores);
        if (scores.length === 0)
            return 0;
        return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    // ==========================================================================
    // MARKDOWN REPORT GENERATION
    // ==========================================================================
    generateMarkdownReport(data, options) {
        const sections = [];
        // Header
        sections.push(this.generateMarkdownHeader(data));
        // Executive Summary
        sections.push(this.generateExecutiveSummary(data));
        // What's Working Well
        if (data.whatWorksWell.length > 0) {
            sections.push(this.generateStrengthsSection(data.whatWorksWell));
        }
        // Critical Issues
        if (data.criticalIssues.length > 0) {
            sections.push(this.generateCriticalIssuesSection(data.criticalIssues, options));
        }
        // Recommendations by Type
        if (data.recommendations.length > 0) {
            sections.push(this.generateRecommendationsSection(data.recommendations, options));
        }
        // Priority Roadmap
        const roadmap = this.generatePriorityRoadmap(data.criticalIssues, data.recommendations);
        sections.push(this.generateRoadmapSection(roadmap));
        // Detailed Analysis (if metrics enabled)
        if (options.includeMetrics) {
            sections.push(this.generateDetailedAnalysis(data));
        }
        // Footer
        sections.push(this.generateMarkdownFooter(data));
        return sections.join('\n\n---\n\n');
    }
    generateMarkdownHeader(data) {
        const scoreEmoji = this.getScoreEmoji(data.overallScore);
        const scoreRating = this.getScoreRating(data.overallScore);
        return `# 🎨 UX Excellence Review Report

**Generated**: ${data.timestamp.toISOString()}
${data.metadata?.projectName ? `**Project**: ${data.metadata.projectName}` : ''}
${data.metadata?.version ? `**Version**: ${data.metadata.version}` : ''}
${data.metadata?.reviewedBy ? `**Reviewed by**: ${data.metadata.reviewedBy}` : ''}

## 🎯 Overall UX Score

**${data.overallScore}/100** ${scoreEmoji} - ${scoreRating}

${this.getScoreDescription(data.overallScore)}`;
    }
    generateExecutiveSummary(data) {
        const criticalCount = data.criticalIssues.filter(i => i.severity === 'critical').length;
        const highCount = data.criticalIssues.filter(i => i.severity === 'high').length;
        const mediumCount = data.criticalIssues.filter(i => i.severity === 'medium').length;
        return `## 📊 Executive Summary

**Total Issues Found**: ${data.criticalIssues.length}
- 🔴 Critical: ${criticalCount}
- 🟠 High: ${highCount}
- 🟡 Medium: ${mediumCount}
- 🟢 Low: ${data.criticalIssues.length - criticalCount - highCount - mediumCount}

**Recommendations**: ${data.recommendations.length}
- ⚡ Immediate: ${data.recommendations.filter(r => r.type === 'immediate').length}
- 🔧 Systematic: ${data.recommendations.filter(r => r.type === 'systematic').length}
- ✨ Enhancement: ${data.recommendations.filter(r => r.type === 'enhancement').length}

**Key Findings**:
${this.generateKeyFindings(data)}`;
    }
    generateKeyFindings(data) {
        const findings = [];
        // Analyze issues by category
        const categoryCount = new Map();
        data.criticalIssues.forEach(issue => {
            categoryCount.set(issue.category, (categoryCount.get(issue.category) || 0) + 1);
        });
        const topCategories = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);
        topCategories.forEach(([category, count]) => {
            findings.push(`- **${this.formatCategoryName(category)}**: ${count} issues`);
        });
        return findings.join('\n');
    }
    generateStrengthsSection(strengths) {
        return `## ✅ What's Working Well

${strengths.map(s => `- ✅ ${s}`).join('\n')}`;
    }
    generateCriticalIssuesSection(issues, options) {
        const sortedIssues = issues.sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
        const issuesByCategory = this.groupBy(sortedIssues, 'category');
        let markdown = '## 🔴 Issues & Findings\n\n';
        for (const [category, categoryIssues] of Object.entries(issuesByCategory)) {
            markdown += `### ${this.formatCategoryName(category)}\n\n`;
            categoryIssues.forEach((issue, idx) => {
                const severityIcon = this.getSeverityIcon(issue.severity);
                markdown += `#### ${idx + 1}. ${issue.title} ${severityIcon}\n\n`;
                markdown += `**Severity**: ${issue.severity.toUpperCase()}\n`;
                markdown += `**Impact**: ${issue.impact}\n`;
                if (issue.affectedUserRoles && issue.affectedUserRoles.length > 0) {
                    markdown += `**Affected Users**: ${issue.affectedUserRoles.join(', ')}\n`;
                }
                markdown += `\n**Current State**: ${issue.currentState}\n`;
                markdown += `\n**Recommended Solution**: ${issue.recommendedSolution}\n`;
                if (issue.file) {
                    markdown += `\n**Location**: \`${issue.file}\`${issue.line ? `:${issue.line}` : ''}\n`;
                }
                if (issue.estimatedFixTime) {
                    markdown += `\n**Estimated Fix Time**: ${issue.estimatedFixTime}\n`;
                }
                markdown += '\n---\n\n';
            });
        }
        return markdown;
    }
    generateRecommendationsSection(recommendations, options) {
        let markdown = '## 🎨 Design Recommendations\n\n';
        // Group by type
        const immediate = recommendations.filter(r => r.type === 'immediate');
        const systematic = recommendations.filter(r => r.type === 'systematic');
        const enhancement = recommendations.filter(r => r.type === 'enhancement');
        if (immediate.length > 0) {
            markdown += '### ⚡ Immediate Improvements (Quick Wins)\n\n';
            markdown += this.formatRecommendations(immediate, options);
        }
        if (systematic.length > 0) {
            markdown += '\n### 🔧 Systematic Enhancements\n\n';
            markdown += this.formatRecommendations(systematic, options);
        }
        if (enhancement.length > 0) {
            markdown += '\n### ✨ Enhancement Opportunities\n\n';
            markdown += this.formatRecommendations(enhancement, options);
        }
        return markdown;
    }
    formatRecommendations(recommendations, options) {
        return recommendations.map((rec, idx) => {
            let markdown = `#### ${idx + 1}. ${rec.title}\n\n`;
            markdown += `**Category**: ${this.formatCategoryName(rec.category)}\n`;
            markdown += `**Effort**: ${this.formatEffort(rec.estimatedEffort)}\n`;
            markdown += `**Impact**: ${rec.expectedImpact.toUpperCase()}\n\n`;
            markdown += `${rec.description}\n\n`;
            markdown += `**Implementation Steps**:\n`;
            rec.implementation.steps.forEach((step, i) => {
                markdown += `${i + 1}. ${step}\n`;
            });
            if (options.includeCodeExamples && rec.implementation.codeExamples) {
                markdown += '\n**Code Examples**:\n\n';
                rec.implementation.codeExamples.forEach(example => {
                    markdown += `*${example.description}*\n\n`;
                    if (example.before) {
                        markdown += '**Before**:\n';
                        markdown += `\`\`\`${example.language}\n${example.before}\n\`\`\`\n\n`;
                    }
                    markdown += '**After**:\n';
                    markdown += `\`\`\`${example.language}\n${example.after}\n\`\`\`\n\n`;
                });
            }
            markdown += '\n---\n\n';
            return markdown;
        }).join('\n');
    }
    generateRoadmapSection(roadmap) {
        let markdown = '## 🚀 Implementation Roadmap\n\n';
        const phases = [
            roadmap.priority1Critical,
            roadmap.priority2High,
            roadmap.priority3Medium,
            roadmap.priority4Low
        ];
        phases.forEach(phase => {
            if (phase.items.length > 0) {
                markdown += `### ${phase.title}\n\n`;
                markdown += `${phase.description}\n\n`;
                markdown += `**Estimated Total Time**: ${phase.estimatedTotalTime}\n`;
                markdown += `**Expected Impact**: ${phase.expectedImpact}\n\n`;
                phase.items.forEach(item => {
                    markdown += `- **${item.title}**\n`;
                    markdown += `  - ${item.description}\n`;
                    markdown += `  - ⏱️ Estimated time: ${item.estimatedTime}\n`;
                    if (item.dependencies.length > 0) {
                        markdown += `  - 🔗 Dependencies: ${item.dependencies.join(', ')}\n`;
                    }
                    markdown += '\n';
                });
                markdown += '\n';
            }
        });
        return markdown;
    }
    generateDetailedAnalysis(data) {
        let markdown = '## 📈 Detailed Analysis\n\n';
        if (data.visualConsistency) {
            markdown += '### Visual Consistency\n\n';
            markdown += `**Overall Score**: ${data.visualConsistency.score}/100\n\n`;
            // Add more detailed metrics
        }
        if (data.uxEvaluation) {
            markdown += '### User Experience Evaluation\n\n';
            markdown += `**Overall Score**: ${data.uxEvaluation.score}/100\n\n`;
            // Add more detailed metrics
        }
        if (data.markdownAnalysis) {
            markdown += '### Markdown Quality\n\n';
            markdown += `**Overall Score**: ${data.markdownAnalysis.score}/100\n\n`;
            // Add more detailed metrics
        }
        return markdown;
    }
    generateMarkdownFooter(data) {
        return `## ✅ Next Steps

1. **Review this report** with the team
2. **Prioritize** based on roadmap phases
3. **Assign** tasks to team members
4. **Track progress** with issue tracking system
5. **Re-test** after implementing fixes

---

*Generated by UX Excellence Reviewer - James-Frontend Sub-Agent*
*Report ID: ${this.generateReportId()}*
*Generation Time: ${data.timestamp.toISOString()}*`;
    }
    // ==========================================================================
    // JSON REPORT GENERATION
    // ==========================================================================
    generateJSONReport(data) {
        const roadmap = this.generatePriorityRoadmap(data.criticalIssues, data.recommendations);
        const report = {
            metadata: {
                reportId: this.generateReportId(),
                timestamp: data.timestamp.toISOString(),
                ...data.metadata
            },
            summary: {
                overallScore: data.overallScore,
                rating: this.getScoreRating(data.overallScore),
                totalIssues: data.criticalIssues.length,
                issuesBySeverity: this.countBySeverity(data.criticalIssues),
                totalRecommendations: data.recommendations.length,
                recommendationsByType: this.countByType(data.recommendations)
            },
            strengths: data.whatWorksWell,
            issues: data.criticalIssues,
            recommendations: data.recommendations,
            roadmap,
            detailedAnalysis: {
                visualConsistency: data.visualConsistency,
                uxEvaluation: data.uxEvaluation,
                markdownAnalysis: data.markdownAnalysis
            }
        };
        return JSON.stringify(report, null, 2);
    }
    // ==========================================================================
    // HTML REPORT GENERATION
    // ==========================================================================
    generateHTMLReport(data, options) {
        // Convert markdown to HTML with basic styling
        const markdownReport = this.generateMarkdownReport(data, options);
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UX Excellence Review Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1, h2, h3, h4 { color: #1a1a1a; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    h2 { font-size: 2rem; margin-top: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    h3 { font-size: 1.5rem; margin-top: 1.5rem; }
    code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
    .score { font-size: 3rem; font-weight: bold; color: #3b82f6; }
    .critical { color: #dc2626; }
    .high { color: #ea580c; }
    .medium { color: #ca8a04; }
    .low { color: #16a34a; }
  </style>
</head>
<body>
  ${this.markdownToHTML(markdownReport)}
</body>
</html>`;
    }
    // ==========================================================================
    // UTILITY METHODS
    // ==========================================================================
    createRoadmapItems(issues, recommendations) {
        const items = [];
        issues.forEach(issue => {
            items.push({
                title: issue.title,
                description: issue.recommendedSolution,
                estimatedTime: issue.estimatedFixTime || this.estimateTimeFromSeverity(issue.severity),
                dependencies: [],
                category: issue.category,
                relatedIssues: [issue.id]
            });
        });
        recommendations.forEach(rec => {
            items.push({
                title: rec.title,
                description: rec.description,
                estimatedTime: this.estimateTimeFromEffort(rec.estimatedEffort),
                dependencies: rec.implementation.dependencies || [],
                category: rec.category,
                relatedIssues: []
            });
        });
        return items;
    }
    calculateTotalTime(items) {
        // Simplified: just sum up estimates
        const totalMinutes = items.reduce((sum, item) => {
            const minutes = this.parseTimeEstimate(item.estimatedTime);
            return sum + minutes;
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const days = Math.floor(hours / 8);
        if (days > 0)
            return `${days} days`;
        if (hours > 0)
            return `${hours} hours`;
        return `${totalMinutes} minutes`;
    }
    parseTimeEstimate(estimate) {
        if (estimate.includes('minute')) {
            return parseInt(estimate) || 30;
        }
        else if (estimate.includes('hour')) {
            return (parseInt(estimate) || 1) * 60;
        }
        else if (estimate.includes('day')) {
            return (parseInt(estimate) || 1) * 8 * 60;
        }
        return 60; // Default 1 hour
    }
    estimateTimeFromEffort(effort) {
        const estimates = {
            'quick-win': '30 minutes',
            'small': '1-2 hours',
            'medium': '1 day',
            'large': '2-3 days'
        };
        return estimates[effort] || '1 hour';
    }
    estimateTimeFromSeverity(severity) {
        const estimates = {
            'critical': '2-4 hours',
            'high': '1-2 hours',
            'medium': '1 hour',
            'low': '30 minutes'
        };
        return estimates[severity] || '1 hour';
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
    getScoreRating(score) {
        if (score >= 90)
            return 'Excellent';
        if (score >= 70)
            return 'Good';
        if (score >= 50)
            return 'Fair';
        return 'Needs Improvement';
    }
    getScoreDescription(score) {
        if (score >= 90) {
            return '✅ **Excellent UX** - Minor refinements only. The interface demonstrates strong design principles with high consistency and usability.';
        }
        else if (score >= 70) {
            return '⚠️ **Good UX** - Some improvements needed. The interface is functional but would benefit from addressing consistency and accessibility issues.';
        }
        else if (score >= 50) {
            return '🔴 **Fair UX** - Significant improvements required. Multiple areas need attention to meet modern UX standards.';
        }
        else {
            return '🚨 **Poor UX** - Critical issues must be addressed immediately. The interface has fundamental problems affecting usability and accessibility.';
        }
    }
    getSeverityIcon(severity) {
        const icons = {
            'critical': '🔴',
            'high': '🟠',
            'medium': '🟡',
            'low': '🟢'
        };
        return icons[severity] || '⚪';
    }
    formatCategoryName(category) {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    formatEffort(effort) {
        const formatted = {
            'quick-win': '⚡ Quick Win (< 1 hour)',
            'small': '🔧 Small (1-2 hours)',
            'medium': '🛠️ Medium (1 day)',
            'large': '🏗️ Large (2-3 days)'
        };
        return formatted[effort] || effort;
    }
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const groupKey = String(item[key]);
            if (!result[groupKey]) {
                result[groupKey] = [];
            }
            result[groupKey].push(item);
            return result;
        }, {});
    }
    countBySeverity(issues) {
        return issues.reduce((counts, issue) => {
            counts[issue.severity] = (counts[issue.severity] || 0) + 1;
            return counts;
        }, {});
    }
    countByType(recommendations) {
        return recommendations.reduce((counts, rec) => {
            counts[rec.type] = (counts[rec.type] || 0) + 1;
            return counts;
        }, {});
    }
    generateReportId() {
        return `ux-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    markdownToHTML(markdown) {
        // Basic markdown to HTML conversion (simplified)
        return markdown
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>[\s\S]*<\/li>)/g, '<ul>$1</ul>') // Changed from 's' flag to [\s\S]
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>');
    }
}
//# sourceMappingURL=ux-report-generator.js.map