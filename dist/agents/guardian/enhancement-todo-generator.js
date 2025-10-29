/**
 * VERSATIL SDLC Framework - Enhancement TODO Generator
 *
 * Generates enhancement TODO files in markdown format from enhancement suggestions.
 * Creates files in todos/ directory with format: enhancement-[category]-[timestamp]-[hash].md
 *
 * @version 7.12.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { GuardianLogger } from './guardian-logger.js';
/**
 * Enhancement TODO Generator
 */
export class EnhancementTodoGenerator {
    constructor(todosDir) {
        this.existingTodoFingerprints = new Set();
        this.logger = GuardianLogger.getInstance();
        this.todosDir = todosDir || process.cwd() + '/todos';
        // Ensure todos directory exists
        if (!fs.existsSync(this.todosDir)) {
            fs.mkdirSync(this.todosDir, { recursive: true });
        }
        // Load existing todo fingerprints for deduplication
        this.loadExistingTodoFingerprints();
    }
    /**
     * Generate enhancement TODO files from suggestions
     */
    async generateTodos(suggestions) {
        const startTime = Date.now();
        this.logger.info(`📝 [Enhancement TODO Generator] Generating ${suggestions.length} enhancement TODOs`);
        let todosCreated = 0;
        let todosSkipped = 0;
        const filePaths = [];
        for (const suggestion of suggestions) {
            // Check for duplicates
            const fingerprint = this.generateFingerprint(suggestion);
            if (this.existingTodoFingerprints.has(fingerprint)) {
                this.logger.info(`⏭️  Skipping duplicate enhancement TODO: ${suggestion.title}`);
                todosSkipped++;
                continue;
            }
            // Generate markdown content
            const markdown = this.generateMarkdownContent(suggestion);
            // Generate filename
            const filename = this.generateFilename(suggestion);
            const filepath = path.join(this.todosDir, filename);
            // Write to file
            fs.writeFileSync(filepath, markdown);
            // Add to fingerprints
            this.existingTodoFingerprints.add(fingerprint);
            filePaths.push(filepath);
            todosCreated++;
            this.logger.info(`✅ Created enhancement TODO: ${filename}`);
        }
        const duration = Date.now() - startTime;
        this.logger.info(`✅ [Enhancement TODO Generator] Generation complete`, {
            todos_created: todosCreated,
            todos_skipped: todosSkipped,
            duration_ms: duration
        });
        return {
            todos_created: todosCreated,
            todos_skipped: todosSkipped,
            file_paths: filePaths
        };
    }
    /**
     * Generate markdown content for enhancement TODO
     */
    generateMarkdownContent(suggestion) {
        const sections = [];
        // YAML frontmatter
        sections.push('---');
        sections.push(`id: "${suggestion.id}"`);
        sections.push('type: "guardian-enhancement"');
        sections.push(`assigned_agent: "${suggestion.assigned_agent}"`);
        sections.push(`priority: "${suggestion.priority}"`);
        sections.push(`category: "${suggestion.category}"`);
        sections.push(`confidence: ${suggestion.confidence}`);
        sections.push(`estimated_effort: "${suggestion.estimated_effort_hours} hours"`);
        sections.push('originated_from: "root-cause-learning"');
        sections.push(`created: "${suggestion.created_at}"`);
        sections.push(`auto_applicable: ${suggestion.auto_applicable}`);
        sections.push(`requires_manual_review: ${suggestion.requires_manual_review}`);
        sections.push(`approval_tier: ${suggestion.approval_tier}`);
        sections.push(`approval_required: ${suggestion.approval_required}`);
        sections.push('---');
        sections.push('');
        // Title
        sections.push(`# 🚀 Enhancement Suggestion - ${suggestion.title}`);
        sections.push('');
        // Approval status section (v7.12.0+)
        this.addApprovalSection(sections, suggestion);
        // Pattern detected section
        sections.push('## Pattern Detected');
        sections.push('');
        sections.push(`**Issue**: ${suggestion.issue_description}`);
        sections.push(`**Occurrences**: ${suggestion.issue_occurrences} times in past ${suggestion.issue_timespan_hours}h`);
        sections.push(`**Root Cause Pattern**: ${suggestion.root_cause_pattern_id}`);
        sections.push('');
        // Current impact
        sections.push('## Current Impact');
        sections.push('');
        sections.push(`- **Manual Interventions**: ${suggestion.roi.manual_interventions_eliminated} per week`);
        sections.push(`- **Time Spent**: ${suggestion.roi.hours_saved_per_week}h per week on manual fixes`);
        sections.push(`- **Reliability Impact**: ${suggestion.roi.reliability_improvement_percent}% improvement possible`);
        sections.push('');
        // Suggested enhancement
        sections.push('## Suggested Enhancement');
        sections.push('');
        sections.push(`**Goal**: ${suggestion.description}`);
        sections.push('');
        sections.push(`**Category**: ${this.formatCategory(suggestion.category)}`);
        sections.push(`**Estimated Effort**: ${suggestion.estimated_effort_hours} hours`);
        sections.push(`**Assigned Agent**: **${suggestion.assigned_agent}**`);
        sections.push('');
        // Implementation steps
        sections.push('## Implementation Steps');
        sections.push('');
        suggestion.implementation_steps.forEach((step, index) => {
            sections.push(`${index + 1}. ${step}`);
        });
        sections.push('');
        // Expected benefits
        sections.push('## Expected Benefits');
        sections.push('');
        sections.push(`- ✅ **Reduce manual intervention**: ${suggestion.roi.manual_interventions_eliminated} interventions/week → 0`);
        sections.push(`- ✅ **Save time**: ${suggestion.roi.hours_saved_per_week}h/week freed for feature development`);
        sections.push(`- ✅ **Improve reliability**: ${suggestion.roi.reliability_improvement_percent}% reliability improvement`);
        sections.push(`- ✅ **Auto-remediation**: ${suggestion.auto_applicable ? 'YES - Can be automated' : 'Partial - Requires monitoring'}`);
        sections.push('');
        // Supporting evidence
        sections.push('## Supporting Evidence');
        sections.push('');
        sections.push(`- **Verification Confidence**: ${suggestion.evidence.verification_confidence}%`);
        sections.push(`- **Expected Success Rate**: ${suggestion.evidence.success_rate_if_implemented}%`);
        sections.push(`- **Issue Occurrences**: ${suggestion.evidence.occurrences}`);
        sections.push('');
        if (suggestion.evidence.similar_historical_fixes.length > 0) {
            sections.push('### Similar Historical Fixes');
            sections.push('');
            suggestion.evidence.similar_historical_fixes.forEach(fix => {
                sections.push(`- ${fix}`);
            });
            sections.push('');
        }
        // ROI calculation
        sections.push('## ROI Calculation');
        sections.push('');
        sections.push('```');
        sections.push(`Implementation Time: ${suggestion.estimated_effort_hours}h`);
        sections.push(`Time Saved per Week: ${suggestion.roi.hours_saved_per_week}h`);
        sections.push(`Break-even: ${Math.round((suggestion.estimated_effort_hours / suggestion.roi.hours_saved_per_week) * 10) / 10} weeks`);
        sections.push(`Annual Savings: ${Math.round(suggestion.roi.hours_saved_per_week * 52)}h/year`);
        sections.push('```');
        sections.push('');
        // Auto-application guidance
        if (suggestion.auto_applicable) {
            sections.push('## Auto-Application Guidance');
            sections.push('');
            sections.push('✅ **This enhancement can be auto-applied** by Guardian with high confidence.');
            sections.push('');
            sections.push('**Recommended Approach**:');
            sections.push('1. Review implementation steps above');
            sections.push('2. Run `/work enhancement-*.md` to implement');
            sections.push('3. Guardian will automatically apply and verify');
            sections.push('4. Review changes and commit');
            sections.push('');
        }
        if (suggestion.requires_manual_review) {
            sections.push('## ⚠️ Manual Review Required');
            sections.push('');
            sections.push('This enhancement requires human judgment due to:');
            sections.push(`- Priority: ${suggestion.priority.toUpperCase()}`);
            sections.push(`- Complexity: ${suggestion.implementation_steps.length} implementation steps`);
            sections.push(`- Confidence: ${suggestion.confidence}% (< 90% threshold for full automation)`);
            sections.push('');
            sections.push('**Review Checklist**:');
            sections.push('- [ ] Verify root cause analysis is accurate');
            sections.push('- [ ] Confirm implementation steps are appropriate');
            sections.push('- [ ] Check for potential side effects');
            sections.push('- [ ] Validate estimated effort');
            sections.push('');
        }
        // Learning opportunity
        sections.push('## 🧠 Learning Opportunity');
        sections.push('');
        sections.push('After implementing this enhancement:');
        sections.push('');
        sections.push(`1. Run \`/learn "Implemented ${suggestion.title}"\``);
        sections.push('2. Guardian will store the fix pattern in RAG');
        sections.push('3. Similar issues will be auto-remediable in the future');
        sections.push('4. Compounding engineering: Next similar issue will be 40% faster to fix');
        sections.push('');
        // Footer
        sections.push('---');
        sections.push('');
        sections.push('**Generated by Guardian Root Cause Learning Engine**');
        sections.push('**Root Cause Pattern ID**: `' + suggestion.root_cause_pattern_id + '`');
        sections.push(`**Detection Method**: Chain-of-Verification (CoVe) with ${suggestion.confidence}% confidence`);
        sections.push(`**Category**: ${suggestion.category}`);
        sections.push(`**Priority**: ${suggestion.priority.toUpperCase()}`);
        return sections.join('\n');
    }
    /**
     * Generate filename for enhancement TODO
     */
    generateFilename(suggestion) {
        const timestamp = Date.now();
        const hash = Math.random().toString(36).slice(2, 6);
        return `enhancement-${suggestion.category}-${suggestion.priority}-${timestamp}-${hash}.md`;
    }
    /**
     * Generate fingerprint for deduplication
     */
    generateFingerprint(suggestion) {
        // Use title + category + assigned agent as fingerprint
        return `${suggestion.title}-${suggestion.category}-${suggestion.assigned_agent}`
            .toLowerCase()
            .replace(/\s+/g, '-')
            .slice(0, 100);
    }
    /**
     * Load existing todo fingerprints from todos directory
     */
    loadExistingTodoFingerprints() {
        if (!fs.existsSync(this.todosDir)) {
            return;
        }
        const files = fs.readdirSync(this.todosDir);
        const enhancementFiles = files.filter(f => f.startsWith('enhancement-') && f.endsWith('.md'));
        for (const file of enhancementFiles) {
            try {
                const filepath = path.join(this.todosDir, file);
                const content = fs.readFileSync(filepath, 'utf-8');
                // Extract title from markdown
                const titleMatch = content.match(/^# 🚀 Enhancement Suggestion - (.+)$/m);
                if (titleMatch) {
                    const title = titleMatch[1];
                    // Extract category and agent from frontmatter
                    const categoryMatch = content.match(/^category: "(.+)"$/m);
                    const agentMatch = content.match(/^assigned_agent: "(.+)"$/m);
                    if (categoryMatch && agentMatch) {
                        const fingerprint = `${title}-${categoryMatch[1]}-${agentMatch[1]}`
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .slice(0, 100);
                        this.existingTodoFingerprints.add(fingerprint);
                    }
                }
            }
            catch (error) {
                this.logger.error(`Failed to parse existing TODO: ${file}`, { error });
            }
        }
        this.logger.info(`📚 [Enhancement TODO Generator] Loaded ${this.existingTodoFingerprints.size} existing enhancement fingerprints`);
    }
    /**
     * Format category for display
     */
    formatCategory(category) {
        const categoryMap = {
            'auto-remediation': '🤖 Auto-Remediation',
            'monitoring': '📊 Monitoring',
            'performance': '⚡ Performance',
            'reliability': '🛡️ Reliability',
            'security': '🔒 Security'
        };
        return categoryMap[category] || category;
    }
    /**
     * Add approval section to markdown (v7.12.0+)
     */
    addApprovalSection(sections, suggestion) {
        sections.push('## 🔐 Approval Status');
        sections.push('');
        // Tier badge
        const tierBadges = {
            1: '🟢 **TIER 1** - Auto-Apply',
            2: '🟡 **TIER 2** - Prompt for Approval',
            3: '🔴 **TIER 3** - Manual Review Required'
        };
        sections.push(`- **Approval Tier**: ${tierBadges[suggestion.approval_tier]}`);
        // Approval required
        sections.push(`- **Approval Required**: ${suggestion.approval_required ? 'YES' : 'NO'}`);
        // Reason
        sections.push(`- **Reason**: ${suggestion.approval_required_reason}`);
        sections.push('');
        // Tier-specific guidance
        if (suggestion.approval_tier === 1) {
            sections.push('### Auto-Apply Guidance');
            sections.push('');
            sections.push('✅ **This enhancement was auto-applied by Guardian** (high confidence ≥95%).');
            sections.push('');
            sections.push('**What happened**:');
            sections.push('1. Guardian detected recurring pattern automatically');
            sections.push('2. Verified confidence ≥95%, success rate ≥95%');
            sections.push('3. Auto-applied fix immediately');
            sections.push('4. Logged to telemetry for tracking');
            sections.push('');
            sections.push('**No action required** - This TODO is for audit trail only.');
            sections.push('');
        }
        else if (suggestion.approval_tier === 2) {
            sections.push('### Approval Actions');
            sections.push('');
            sections.push('🟡 **This enhancement requires your approval** (medium confidence 80-95%).');
            sections.push('');
            sections.push('**Commands**:');
            sections.push(`- \`/approve ${suggestion.id}\` - Approve and implement now`);
            sections.push(`- \`/reject ${suggestion.id} "reason"\` - Reject with reason`);
            sections.push(`- \`/defer ${suggestion.id}\` - Review later (keeps this TODO)`);
            sections.push('');
            sections.push('**Or use interactive prompt** (if Guardian prompts during health check):');
            sections.push('```');
            sections.push('Approve this enhancement?');
            sections.push('  [Y]es  - Approve and implement now');
            sections.push('  [N]o   - Reject (requires reason)');
            sections.push('  [D]efer - Review later');
            sections.push('  [I]nfo  - Show full details');
            sections.push('```');
            sections.push('');
        }
        else {
            sections.push('### Manual Review Actions');
            sections.push('');
            sections.push('🔴 **This enhancement requires careful manual review** (low confidence <80% or high risk).');
            sections.push('');
            sections.push('**Review Checklist**:');
            sections.push('- [ ] Verify root cause analysis is accurate');
            sections.push('- [ ] Confirm implementation steps are appropriate');
            sections.push('- [ ] Check for potential side effects');
            sections.push('- [ ] Validate estimated effort and ROI');
            sections.push('- [ ] Test in non-production environment first');
            sections.push('');
            sections.push('**Commands**:');
            sections.push(`- \`/work ${this.generateFilename(suggestion)}\` - Start implementation with assigned agent (${suggestion.assigned_agent})`);
            sections.push(`- \`/approve ${suggestion.id}\` - Force approval (after manual review)`);
            sections.push(`- \`/reject ${suggestion.id} "reason"\` - Reject permanently`);
            sections.push('');
        }
        sections.push('---');
        sections.push('');
    }
}
//# sourceMappingURL=enhancement-todo-generator.js.map