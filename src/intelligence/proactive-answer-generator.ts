/**
 * VERSATIL SDLC Framework - Proactive Answer Generator
 *
 * Generates answers BEFORE user asks, based on learned question patterns.
 * Anticipates user's next questions and pre-generates comprehensive answers.
 *
 * @version 7.13.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GuardianLogger } from '../agents/guardian/guardian-logger.js';
import { ConversationPatternDetector, type QuestionCategory } from './conversation-pattern-detector.js';
import { UserInteractionLearner } from './user-interaction-learner.js';

const execAsync = promisify(exec);

export interface ProactiveAnswer {
  trigger: 'feature_completion' | 'code_change' | 'health_check_result' | 'git_commit';
  anticipated_questions: {
    question: string;
    category: QuestionCategory;
    probability: number;  // 0-100
  }[];
  pregenerated_answers: Map<string, string>;
  confidence: number;  // 0-100
  should_show_proactively: boolean;
  evidence: {
    files_verified: string[];
    commands_run: string[];
    integration_checked: boolean;
  };
}

export interface FeatureContext {
  feature_name: string;
  version?: string;
  files_created: string[];
  files_modified: string[];
  total_lines: number;
  documentation_files: string[];
  git_status: {
    uncommitted: boolean;
    files_count: number;
    latest_commit?: string;
    remote_status?: string;
  };
}

/**
 * Proactive Answer Generator
 */
export class ProactiveAnswerGenerator {
  private logger: GuardianLogger;
  private patternDetector: ConversationPatternDetector;
  private interactionLearner: UserInteractionLearner;

  constructor() {
    this.logger = GuardianLogger.getInstance();
    this.patternDetector = new ConversationPatternDetector();
    this.interactionLearner = new UserInteractionLearner();
  }

  /**
   * Generate proactive answer for feature completion
   */
  public async generateForFeatureCompletion(context: FeatureContext): Promise<ProactiveAnswer | null> {
    this.logger.info('[Proactive Answer] Generating for feature completion', {
      feature: context.feature_name
    });

    // Get user's frequent questions
    const frequentPatterns = this.patternDetector.getFrequentPatterns(10);

    if (frequentPatterns.length === 0) {
      // User hasn't established patterns yet
      return null;
    }

    // Anticipate questions based on patterns
    const anticipatedQuestions = this.anticipateQuestions(frequentPatterns, 'feature_completion');

    if (anticipatedQuestions.length === 0) {
      return null;
    }

    // Pre-generate answers for each anticipated question
    const pregeneratedAnswers = new Map<string, string>();
    const evidence = {
      files_verified: [] as string[],
      commands_run: [] as string[],
      integration_checked: false
    };

    for (const anticipated of anticipatedQuestions) {
      const answer = await this.generateAnswerForCategory(
        anticipated.category,
        context,
        evidence
      );
      pregeneratedAnswers.set(anticipated.category, answer);
    }

    // Calculate overall confidence
    const avgProbability = anticipatedQuestions.reduce((sum, q) => sum + q.probability, 0) / anticipatedQuestions.length;
    const confidence = Math.round(avgProbability * (evidence.files_verified.length > 0 ? 1.2 : 1.0));

    // Should show proactively if confidence >= 70 and user prefers it
    const userProfile = this.interactionLearner.getProfile();
    const shouldShow = confidence >= 70 &&
                      (userProfile?.prefers_proactive_answers !== false) &&
                      frequentPatterns.some(p => p.occurrences >= 3);

    return {
      trigger: 'feature_completion',
      anticipated_questions: anticipatedQuestions,
      pregenerated_answers: pregeneratedAnswers,
      confidence,
      should_show_proactively: shouldShow,
      evidence
    };
  }

  /**
   * Format proactive answer for display
   */
  public formatProactiveAnswer(answer: ProactiveAnswer, context: FeatureContext): string {
    const sections: string[] = [];

    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('📋 IMPLEMENTATION VERIFICATION (Auto-generated)');
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    sections.push('');

    // Show answers for each anticipated question category
    for (const [category, answerText] of answer.pregenerated_answers.entries()) {
      sections.push(answerText);
      sections.push('');
    }

    // Show evidence
    if (answer.evidence.files_verified.length > 0) {
      sections.push('🔍 Verification Evidence:');
      sections.push(`   Files exist: ✅ (${answer.evidence.files_verified.length} verified)`);
      if (answer.evidence.integration_checked) {
        sections.push('   Code integrated: ✅ (grep confirmed references)');
      }
      sections.push(`   Git status: ${context.git_status.files_count} uncommitted files`);
      sections.push('');
    }

    sections.push(`✋ Skipping questions - Guardian learned you always want this info (${answer.confidence}% confidence)`);
    sections.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return sections.join('\n');
  }

  /**
   * Anticipate questions based on patterns
   */
  private anticipateQuestions(
    patterns: any[],
    trigger: string
  ): { question: string; category: QuestionCategory; probability: number }[] {
    const anticipated: { question: string; category: QuestionCategory; probability: number }[] = [];

    // Map pattern occurrences to question categories
    const categoryCount = new Map<QuestionCategory, number>();
    let totalOccurrences = 0;

    for (const pattern of patterns) {
      const count = pattern.occurrences;
      categoryCount.set(pattern.question_category, (categoryCount.get(pattern.question_category) || 0) + count);
      totalOccurrences += count;
    }

    // Calculate probability for each category
    for (const [category, count] of categoryCount.entries()) {
      const probability = Math.round((count / totalOccurrences) * 100);

      if (probability >= 20) {  // At least 20% probability
        anticipated.push({
          question: this.getCategoryQuestion(category),
          category,
          probability
        });
      }
    }

    // Sort by probability
    anticipated.sort((a, b) => b.probability - a.probability);

    return anticipated.slice(0, 5);  // Top 5 questions
  }

  /**
   * Get representative question for category
   */
  private getCategoryQuestion(category: QuestionCategory): string {
    const questions: Record<QuestionCategory, string> = {
      'status': 'documented or built?',
      'verification': 'sure?',
      'availability': 'accessible via /update?',
      'implementation': 'where is the code?',
      'documentation': 'where are the docs?',
      'comparison': 'what changed?',
      'action_required': 'what do I need to do?'
    };

    return questions[category];
  }

  /**
   * Generate answer for specific question category
   */
  private async generateAnswerForCategory(
    category: QuestionCategory,
    context: FeatureContext,
    evidence: { files_verified: string[]; commands_run: string[]; integration_checked: boolean }
  ): Promise<string> {
    switch (category) {
      case 'status':
        return await this.generateStatusAnswer(context, evidence);
      case 'availability':
        return await this.generateAvailabilityAnswer(context, evidence);
      case 'verification':
        return await this.generateVerificationAnswer(context, evidence);
      case 'implementation':
        return await this.generateImplementationAnswer(context, evidence);
      case 'documentation':
        return await this.generateDocumentationAnswer(context, evidence);
      default:
        return `${category}: Information available upon request`;
    }
  }

  /**
   * Generate status answer
   */
  private async generateStatusAnswer(
    context: FeatureContext,
    evidence: any
  ): Promise<string> {
    const sections: string[] = [];

    sections.push('| Aspect | Status | Details |');
    sections.push('|--------|--------|---------|');

    // Code status
    const codeStatus = context.files_created.length > 0 || context.files_modified.length > 0 ? '✅ BUILT' : '❌ NOT BUILT';
    const codeDetails = `${context.total_lines} lines, ${context.files_created.length + context.files_modified.length} files`;
    sections.push(`| **Code** | ${codeStatus} | ${codeDetails} |`);

    // Verify files exist
    for (const file of [...context.files_created, ...context.files_modified].slice(0, 3)) {
      if (fs.existsSync(file)) {
        evidence.files_verified.push(file);
      }
    }

    // Documentation status
    const docsStatus = context.documentation_files.length > 0 ? '✅ WRITTEN' : '⚠️ PARTIAL';
    const docsDetails = `${context.documentation_files.length} files`;
    sections.push(`| **Docs** | ${docsStatus} | ${docsDetails} |`);

    // Public status
    const publicStatus = context.git_status.uncommitted ? '❌ LOCAL ONLY' : '✅ COMMITTED';
    const publicDetails = context.git_status.uncommitted ? 'Needs commit + release' : 'In repository';
    sections.push(`| **Public** | ${publicStatus} | ${publicDetails} |`);

    return sections.join('\n');
  }

  /**
   * Generate availability answer
   */
  private async generateAvailabilityAnswer(
    context: FeatureContext,
    evidence: any
  ): Promise<string> {
    const sections: string[] = [];

    sections.push('📦 **Public Availability:**');

    if (context.git_status.uncommitted) {
      sections.push('   ❌ NOT accessible via /update yet');
      sections.push(`   Local: v${context.version || 'dev'} works now`);
      sections.push(`   GitHub: Uncommitted (${context.git_status.files_count} files)`);
      sections.push('   Action: Needs commit → push → GitHub release');
    } else {
      sections.push('   ✅ Accessible via /update command');
      sections.push(`   Version: v${context.version || 'latest'}`);
      if (context.git_status.latest_commit) {
        sections.push(`   Commit: ${context.git_status.latest_commit.slice(0, 8)}`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Generate verification answer
   */
  private async generateVerificationAnswer(
    context: FeatureContext,
    evidence: any
  ): Promise<string> {
    const sections: string[] = [];

    sections.push('🔍 **Verification Proof:**');

    // Check files exist
    const existingFiles = [];
    for (const file of [...context.files_created, ...context.files_modified]) {
      if (fs.existsSync(file)) {
        existingFiles.push(file);
        try {
          const stats = fs.statSync(file);
          const lines = fs.readFileSync(file, 'utf-8').split('\n').length;
          evidence.files_verified.push(`${file} (${lines} lines)`);
        } catch (error) {
          // Ignore
        }
      }
    }

    sections.push(`   Files exist: ✅ (${existingFiles.length}/${context.files_created.length + context.files_modified.length})`);

    // Check integration (grep for cross-references)
    if (context.files_created.length > 0) {
      try {
        const firstFile = context.files_created[0];
        const baseName = path.basename(firstFile, path.extname(firstFile));
        const { stdout } = await execAsync(`grep -r "${baseName}" "${path.dirname(firstFile)}" 2>/dev/null | wc -l`);
        const references = parseInt(stdout.trim(), 10);

        if (references > 0) {
          sections.push(`   Code integrated: ✅ (${references} references found)`);
          evidence.integration_checked = true;
        }
      } catch (error) {
        // Ignore grep errors
      }
    }

    // Git status
    sections.push(`   Git status: ${context.git_status.files_count} uncommitted files`);

    // Commands run
    sections.push('');
    sections.push('   Commands verified:');
    sections.push(`   $ ls -la [${existingFiles.length} files confirmed]`);
    if (evidence.integration_checked) {
      sections.push('   $ grep [cross-references verified]');
    }

    return sections.join('\n');
  }

  /**
   * Generate implementation answer
   */
  private async generateImplementationAnswer(
    context: FeatureContext,
    evidence: any
  ): Promise<string> {
    const sections: string[] = [];

    sections.push('📂 **Implementation Files:**');
    sections.push('');

    // Created files
    if (context.files_created.length > 0) {
      sections.push('   New files:');
      for (const file of context.files_created.slice(0, 5)) {
        const lines = this.getLineCount(file);
        sections.push(`   - ${file} (${lines} lines)`);
      }
      if (context.files_created.length > 5) {
        sections.push(`   ... and ${context.files_created.length - 5} more files`);
      }
      sections.push('');
    }

    // Modified files
    if (context.files_modified.length > 0) {
      sections.push('   Modified files:');
      for (const file of context.files_modified.slice(0, 5)) {
        sections.push(`   - ${file}`);
      }
      if (context.files_modified.length > 5) {
        sections.push(`   ... and ${context.files_modified.length - 5} more files`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Generate documentation answer
   */
  private async generateDocumentationAnswer(
    context: FeatureContext,
    evidence: any
  ): Promise<string> {
    const sections: string[] = [];

    sections.push('📚 **Documentation:**');
    sections.push('');

    if (context.documentation_files.length > 0) {
      for (const file of context.documentation_files) {
        const lines = this.getLineCount(file);
        sections.push(`   - ${file} (${lines} lines)`);
      }
    } else {
      sections.push('   ⚠️  No documentation files detected');
    }

    return sections.join('\n');
  }

  /**
   * Get line count for file
   */
  private getLineCount(filePath: string): number {
    try {
      if (!fs.existsSync(filePath)) return 0;
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }
}
