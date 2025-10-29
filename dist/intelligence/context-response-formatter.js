/**
 * VERSATIL SDLC Framework - Context-Aware Response Formatter
 *
 * Formats answers based on user's learned preferences.
 * Adapts structure, detail level, and content based on user profile.
 *
 * @version 7.13.0
 */
import { GuardianLogger } from '../agents/guardian/guardian-logger.js';
import { UserInteractionLearner } from './user-interaction-learner.js';
/**
 * Context-Aware Response Formatter
 */
export class ContextResponseFormatter {
    constructor() {
        this.logger = GuardianLogger.getInstance();
        this.interactionLearner = new UserInteractionLearner();
    }
    /**
     * Format response based on user preferences
     */
    formatResponse(rawAnswer, context) {
        const prefs = this.interactionLearner.getAnswerFormatPreferences();
        const detailPrefs = this.interactionLearner.getDetailLevelPreferences();
        // Build response sections according to user's preferred structure
        const sections = [];
        for (const sectionType of prefs.structure) {
            const section = this.buildSection(sectionType, context, prefs, detailPrefs);
            if (section) {
                sections.push(section);
            }
        }
        return sections.join('\n\n');
    }
    /**
     * Build section based on type
     */
    buildSection(type, context, prefs, detailPrefs) {
        switch (type) {
            case 'direct_answer':
                return this.buildDirectAnswer(context);
            case 'evidence':
                return prefs.proof_first ? this.buildEvidence(context, prefs) : null;
            case 'details':
                return this.buildDetails(context, prefs, detailPrefs);
            case 'action_items':
                return this.buildActionItems(context);
            default:
                return null;
        }
    }
    /**
     * Build direct answer section
     */
    buildDirectAnswer(context) {
        if (!context.implementation_details) {
            return '✅ **Status**: Information available';
        }
        const { files, lines, documented } = context.implementation_details;
        const codeStatus = files.length > 0 ? 'BUILT' : 'NOT BUILT';
        const docsStatus = documented ? 'DOCUMENTED' : 'PARTIAL';
        return `✅ **Status**: BOTH ${codeStatus.toLowerCase()} AND ${docsStatus.toLowerCase()}\n   - Code: ${lines} lines across ${files.length} files\n   - Docs: ${documented ? 'Complete' : 'Partial'}`;
    }
    /**
     * Build evidence section
     */
    buildEvidence(context, prefs) {
        if (!context.verification_evidence)
            return null;
        const sections = ['🔍 **Verification Evidence**:'];
        if (prefs.show_file_existence && context.verification_evidence.files_exist) {
            sections.push('   ✅ Files exist (verified with ls)');
        }
        if (prefs.show_integration_proof && context.verification_evidence.integration_verified) {
            sections.push('   ✅ Code integrated (grep confirmed references)');
        }
        if (prefs.include_verification_commands && context.verification_evidence.commands_run.length > 0) {
            sections.push('   ✅ Commands verified:');
            for (const cmd of context.verification_evidence.commands_run.slice(0, 3)) {
                sections.push(`      $ ${cmd}`);
            }
        }
        if (prefs.include_git_status && context.git_status) {
            sections.push(`   📊 Git: ${context.git_status.files_count} uncommitted files`);
        }
        return sections.join('\n');
    }
    /**
     * Build details section
     */
    buildDetails(context, prefs, detailPrefs) {
        if (!context.implementation_details)
            return null;
        const sections = [];
        if (detailPrefs.overall_detail_level === 'minimal') {
            return null; // Skip details for minimal preference
        }
        if (prefs.include_tables && context.implementation_details.files.length > 1) {
            sections.push(this.buildTable(context));
        }
        if (prefs.include_file_paths) {
            sections.push(this.buildFilePaths(context, prefs));
        }
        return sections.length > 0 ? sections.join('\n\n') : null;
    }
    /**
     * Build table
     */
    buildTable(context) {
        const sections = [];
        sections.push('| Aspect | Status | Details |');
        sections.push('|--------|--------|---------|');
        if (context.implementation_details) {
            const { files, lines, documented } = context.implementation_details;
            sections.push(`| Code | ✅ BUILT | ${lines} lines, ${files.length} files |`);
            sections.push(`| Docs | ${documented ? '✅' : '⚠️'} ${documented ? 'COMPLETE' : 'PARTIAL'} | ${documented ? 'Comprehensive' : 'In progress'} |`);
        }
        if (context.git_status) {
            const status = context.git_status.uncommitted ? '❌ LOCAL' : '✅ COMMITTED';
            sections.push(`| Public | ${status} | ${context.git_status.uncommitted ? 'Needs release' : 'In repo'} |`);
        }
        return sections.join('\n');
    }
    /**
     * Build file paths section
     */
    buildFilePaths(context, prefs) {
        if (!context.implementation_details)
            return '';
        const sections = ['📂 **Files**:'];
        for (const file of context.implementation_details.files.slice(0, 5)) {
            if (prefs.include_line_counts) {
                sections.push(`   - [${file}](${file}) (lines available)`);
            }
            else {
                sections.push(`   - [${file}](${file})`);
            }
        }
        if (context.implementation_details.files.length > 5) {
            sections.push(`   ... and ${context.implementation_details.files.length - 5} more files`);
        }
        return sections.join('\n');
    }
    /**
     * Build action items section
     */
    buildActionItems(context) {
        if (!context.git_status || !context.git_status.uncommitted) {
            return null; // No actions needed if already committed
        }
        const sections = ['⚡ **Next Steps**:'];
        sections.push('   1. Commit changes: `git add . && git commit -m "message"`');
        sections.push('   2. Push to GitHub: `git push origin main`');
        sections.push('   3. Create release: Use GitHub UI or `gh release create`');
        sections.push('   4. Users can then access via `/update` command');
        return sections.join('\n');
    }
}
//# sourceMappingURL=context-response-formatter.js.map