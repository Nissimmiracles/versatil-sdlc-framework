/**
 * Marcus-Rails: Ruby on Rails Specialist
 *
 * Language-specific sub-agent for Ruby on Rails 7+ development.
 * Specializes in Active Record, Hotwire, and Rails conventions.
 *
 * Auto-activates on: Gemfile, config/routes.rb, .rb files
 *
 * @module marcus-rails
 * @version 6.6.0
 * @parent marcus-backend
 */

import { EnhancedMarcus } from '../enhanced-marcus.js';
import { AgentActivationContext, AgentResponse } from '../../../core/base-agent.js';
import { EnhancedVectorMemoryStore } from '../../../../rag/enhanced-vector-memory-store.js';

export class MarcusRails extends EnhancedMarcus {
  name = 'Marcus-Rails';
  id = 'marcus-rails';
  specialization = 'Ruby on Rails 7+ Specialist';
  systemPrompt = `You are Marcus-Rails, a specialized Ruby on Rails expert with deep knowledge of:
- Rails 7+ features (Hotwire, Turbo, Stimulus)
- ActiveRecord patterns and query optimization
- Rails conventions and best practices
- RESTful routing and resourceful controllers
- Strong parameters and security
- Background jobs with Sidekiq/Delayed Job
- Action Cable for WebSockets
- Rails testing with RSpec/Minitest`;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const response = await super.activate(context);
    const railsAnalysis = await this.analyzeRailsPatterns(context);

    response.suggestions = response.suggestions || [];
    response.suggestions.push(...railsAnalysis.suggestions);

    if (response.context) {
      response.context.railsAnalysis = railsAnalysis;
    }

    return response;
  }

  public async analyzeRailsPatterns(context: AgentActivationContext) {
    const content = context.content || '';
    const suggestions: Array<{ type: string; message: string; priority: string }> = [];
    let score = 100;

    // Check for N+1 query patterns
    if (this.hasNPlusOnePattern(content)) {
      score -= 20;
      suggestions.push({
        type: 'performance',
        message: 'N+1 query detected. Use includes, eager_load, or preload.',
        priority: 'high'
      });
    }

    // Check for SQL injection in raw queries
    if (content.includes('where(') && content.includes('#{')) {
      score -= 25;
      suggestions.push({
        type: 'security',
        message: 'SQL injection risk with string interpolation. Use parameterized queries.',
        priority: 'critical'
      });
    }

    // Check for strong parameters
    if (this.isController(content) && !content.includes('permit(')) {
      score -= 15;
      suggestions.push({
        type: 'security',
        message: 'Strong parameters not detected. Use permit() for mass assignment protection.',
        priority: 'high'
      });
    }

    // Check for proper callbacks
    if (content.includes('before_save') || content.includes('after_save')) {
      suggestions.push({
        type: 'best-practice',
        message: 'Consider using service objects instead of callbacks for complex logic.',
        priority: 'low'
      });
    }

    // Check for fat models
    if (this.isModel(content) && this.getMethodCount(content) > 10) {
      score -= 10;
      suggestions.push({
        type: 'architecture',
        message: 'Fat model detected. Consider extracting logic to service objects or concerns.',
        priority: 'medium'
      });
    }

    // Check for database indexes
    if (content.includes('add_column') && !content.includes('add_index')) {
      suggestions.push({
        type: 'performance',
        message: 'Consider adding database indexes for frequently queried columns.',
        priority: 'medium'
      });
    }

    // Check for background jobs
    if (this.hasLongRunningOperation(content) && !content.includes('perform_later')) {
      suggestions.push({
        type: 'performance',
        message: 'Long-running operation detected. Consider moving to background job.',
        priority: 'medium'
      });
    }

    return {
      score: Math.max(score, 0),
      suggestions,
      component: this.detectRailsComponent(context.filePath || '')
    };
  }

  private hasNPlusOnePattern(content: string): boolean {
    // Check for associations accessed in loops without eager loading
    return (content.includes('.each') || content.includes('.map')) &&
           (content.includes('.posts') || content.includes('.comments') || content.includes('.user'));
  }

  private isController(content: string): boolean {
    return content.includes('ApplicationController') || content.includes('< ActionController');
  }

  private isModel(content: string): boolean {
    return content.includes('ApplicationRecord') || content.includes('< ActiveRecord::Base');
  }

  private getMethodCount(content: string): number {
    return (content.match(/def /g) || []).length;
  }

  private hasLongRunningOperation(content: string): boolean {
    const longOps = ['send_email', 'generate_report', 'process_image', 'import_data'];
    return longOps.some(op => content.includes(op));
  }

  private detectRailsComponent(filePath: string): string {
    if (filePath.includes('/controllers/')) return 'Controller';
    if (filePath.includes('/models/')) return 'Model';
    if (filePath.includes('/views/')) return 'View';
    if (filePath.includes('/jobs/')) return 'Background Job';
    if (filePath.includes('/mailers/')) return 'Mailer';
    if (filePath.includes('/services/')) return 'Service Object';
    return 'Rails Component';
  }

  protected getDefaultRAGConfig() {
    return {
      ...super.getDefaultRAGConfig(),
      agentDomain: 'backend-rails',
      maxExamples: 5
    };
  }

  // ActiveRecord Pattern Detection Methods
  public hasActiveRecordModel(content: string): boolean {
    return /class\s+\w+\s*<\s*ApplicationRecord/.test(content) || /class\s+\w+\s*<\s*ActiveRecord::Base/.test(content);
  }

  public hasAssociations(content: string): boolean {
    return /has_many|belongs_to|has_one|has_and_belongs_to_many/.test(content);
  }

  public hasValidations(content: string): boolean {
    return /validates|validates_presence_of|validates_uniqueness_of/.test(content);
  }

  public hasNPlusOne(content: string): boolean {
    // Check for .each or .map with association access inside the block
    const hasLoop = /\.each\s+do\s*\||\. map\s*\{/.test(content);
    const hasAssociationAccess = /\|\s*\w+\s*\|[^}]*\.\w+\./.test(content) || /user\.\w+|post\.\w+|comment\.\w+/.test(content);
    const hasEagerLoading = content.includes('includes') || content.includes('eager_load');
    return hasLoop && hasAssociationAccess && !hasEagerLoading;
  }

  public hasIncludes(content: string): boolean {
    return /\.includes\(/.test(content);
  }

  public hasScopes(content: string): boolean {
    return /scope\s+:\w+/.test(content);
  }

  // Controller Pattern Detection Methods
  public hasController(content: string): boolean {
    return /class\s+\w+Controller\s*<\s*ApplicationController/.test(content);
  }

  public hasBeforeAction(content: string): boolean {
    return /before_action/.test(content);
  }

  public hasStrongParams(content: string): boolean {
    return /params\.require\(/.test(content) && /\.permit\(/.test(content);
  }

  public hasMissingStrongParams(content: string): boolean {
    const hasParams = /params\[/.test(content);
    const hasStrong = this.hasStrongParams(content);
    return hasParams && !hasStrong;
  }

  // Security Methods
  public detectSQLInjection(content: string): boolean {
    return /where\(['"]\w+\s*=.*#\{/.test(content) || /where\(".*\+/.test(content);
  }

  public hasParameterizedQuery(content: string): boolean {
    return /where\([^)]*\?/.test(content) || /where\(\[/.test(content);
  }

  public hasCSRFProtection(content: string): boolean {
    return /protect_from_forgery/.test(content);
  }

  public hasAuthentication(content: string): boolean {
    return /devise|authenticate_user|current_user/.test(content);
  }

  public hasPundit(content: string): boolean {
    return /authorize\s+@|policy\(/.test(content);
  }

  public hasExposedSecrets(content: string): boolean {
    const patterns = [
      /password\s*=\s*["'][^"']+["']/,
      /api_key\s*=\s*["'][^"']+["']/,
      /secret\s*=\s*["'][^"']+["']/
    ];
    return patterns.some(pattern => pattern.test(content));
  }

  // Ruby 3+ Features
  public hasPatternMatching(content: string): boolean {
    return /case\s+\w+\s+in\s+/.test(content);
  }

  public hasEndlessMethod(content: string): boolean {
    return /def\s+\w+\([^)]*\)\s*=/.test(content);
  }

  public hasKeywordArgs(content: string): boolean {
    return /def\s+\w+\([^)]*:\s*\w+/.test(content);
  }

  public hasSafeNavigation(content: string): boolean {
    return /&\./.test(content);
  }

  // Performance Methods
  public hasCounterCache(content: string): boolean {
    return /counter_cache:/.test(content);
  }

  public hasCaching(content: string): boolean {
    return /Rails\.cache|cache\(/.test(content);
  }

  public hasFragmentCache(content: string): boolean {
    return /<% cache /.test(content);
  }

  public hasSelect(content: string): boolean {
    return /\.select\(/.test(content);
  }

  public hasPluck(content: string): boolean {
    return /\.pluck\(/.test(content);
  }

  public hasFindEach(content: string): boolean {
    return /\.find_each\(/.test(content);
  }

  // Background Job Methods
  public hasActiveJob(content: string): boolean {
    return /class\s+\w+Job\s*<\s*ApplicationJob/.test(content) || /perform_later/.test(content);
  }

  public hasSidekiq(content: string): boolean {
    return /include\s+Sidekiq::Worker/.test(content);
  }

  // Testing Methods
  public hasRSpec(content: string): boolean {
    return /RSpec\.describe|describe\s+['"]/.test(content);
  }

  public hasMinitest(content: string): boolean {
    return /class\s+\w+Test\s*</.test(content) || /test\s+["']/.test(content);
  }

  public hasFactoryBot(content: string): boolean {
    return /FactoryBot\.(create|define|build)|create\(:\w+/.test(content);
  }

  public hasFixtures(content: string, filePath?: string): boolean {
    return /fixtures\s+:/.test(content) || (filePath?.includes('fixtures') ?? false);
  }

  // Ruby Idioms
  public hasBlocks(content: string): boolean {
    return /\{.*\}|do\s+\|.*\|\s+end|yield/.test(content);
  }

  public hasSymbols(content: string): boolean {
    return /:\w+/.test(content);
  }

  public hasStringInterpolation(content: string): boolean {
    return /#\{\w+\}/.test(content);
  }

  // Migration Methods
  public hasMigration(content: string): boolean {
    return /class\s+\w+\s*<\s*ActiveRecord::Migration/.test(content);
  }

  public hasIndex(content: string): boolean {
    return /add_index|index:/.test(content);
  }

  public hasForeignKey(content: string): boolean {
    return /add_foreign_key|foreign_key:/.test(content);
  }
}
