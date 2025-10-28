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
export class MarcusRails extends EnhancedMarcus {
    constructor(vectorStore) {
        super(vectorStore);
        this.name = 'Marcus-Rails';
        this.id = 'marcus-rails';
        this.specialization = 'Ruby on Rails 7+ Specialist';
        this.systemPrompt = `You are Marcus-Rails, a specialized Ruby on Rails expert with deep knowledge of:
- Rails 7+ features (Hotwire, Turbo, Stimulus)
- Active Record patterns and query optimization
- Rails conventions and best practices
- RESTful routing and resourceful controllers
- Strong parameters and security
- Background jobs with Sidekiq/Delayed Job
- Action Cable for WebSockets
- Rails testing with RSpec/Minitest`;
    }
    async activate(context) {
        const response = await super.activate(context);
        const railsAnalysis = await this.analyzeRailsPatterns(context);
        response.suggestions = response.suggestions || [];
        response.suggestions.push(...railsAnalysis.suggestions);
        if (response.context) {
            response.context.railsAnalysis = railsAnalysis;
        }
        return response;
    }
    async analyzeRailsPatterns(context) {
        const content = context.content || '';
        const suggestions = [];
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
    hasNPlusOnePattern(content) {
        // Check for associations accessed in loops without eager loading
        return (content.includes('.each') || content.includes('.map')) &&
            (content.includes('.posts') || content.includes('.comments') || content.includes('.user'));
    }
    isController(content) {
        return content.includes('ApplicationController') || content.includes('< ActionController');
    }
    isModel(content) {
        return content.includes('ApplicationRecord') || content.includes('< ActiveRecord::Base');
    }
    getMethodCount(content) {
        return (content.match(/def /g) || []).length;
    }
    hasLongRunningOperation(content) {
        const longOps = ['send_email', 'generate_report', 'process_image', 'import_data'];
        return longOps.some(op => content.includes(op));
    }
    detectRailsComponent(filePath) {
        if (filePath.includes('/controllers/'))
            return 'Controller';
        if (filePath.includes('/models/'))
            return 'Model';
        if (filePath.includes('/views/'))
            return 'View';
        if (filePath.includes('/jobs/'))
            return 'Background Job';
        if (filePath.includes('/mailers/'))
            return 'Mailer';
        if (filePath.includes('/services/'))
            return 'Service Object';
        return 'Rails Component';
    }
    getDefaultRAGConfig() {
        return {
            ...super.getDefaultRAGConfig(),
            agentDomain: 'backend-rails',
            maxExamples: 5
        };
    }
}
//# sourceMappingURL=marcus-rails.js.map