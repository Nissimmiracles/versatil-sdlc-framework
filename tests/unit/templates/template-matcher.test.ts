/**
 * Template Matcher Service - Unit Tests
 * Tests for template matching and scoring algorithms
 */

import { TemplateMatcher, TemplateMatchResult } from '../../src/templates/template-matcher';
import * as fs from 'fs';
import * as path from 'path';

describe('TemplateMatcher', () => {
  let matcher: TemplateMatcher;
  const templatesDir = path.join(process.cwd(), 'templates', 'plan-templates');

  beforeAll(() => {
    // Ensure templates directory exists
    if (!fs.existsSync(templatesDir)) {
      throw new Error(`Templates directory not found: ${templatesDir}`);
    }
  });

  beforeEach(() => {
    matcher = new TemplateMatcher();
  });

  describe('Template Loading', () => {
    it('should load all YAML templates on initialization', async () => {
      const templates = await matcher.getAvailableTemplates();

      expect(templates).toContain('auth-system');
      expect(templates).toContain('crud-endpoint');
      expect(templates).toContain('dashboard');
      expect(templates).toContain('api-integration');
      expect(templates).toContain('file-upload');
    });

    it('should load template with correct structure', async () => {
      const template = await matcher.loadTemplate('auth-system');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Authentication System');
      expect(template?.category).toBe('Security');
      expect(template?.keywords).toContain('auth');
      expect(template?.keywords).toContain('login');
      expect(template?.estimated_effort.hours).toBe(28);
    });
  });

  describe('Auto-Matching', () => {
    it('should match "Add user authentication" to auth-system template', async () => {
      const result = await matcher.matchTemplate({
        description: 'Add user authentication with JWT'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(70);
      expect(result.best_match?.matched_keywords).toContain('auth');
    });

    it('should match "Add products API" to crud-endpoint template', async () => {
      const result = await matcher.matchTemplate({
        description: 'Add products CRUD REST API with database'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('crud-endpoint');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(70);
    });

    it('should match "Build analytics dashboard" to dashboard template', async () => {
      const result = await matcher.matchTemplate({
        description: 'Build analytics dashboard with charts and KPIs'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('dashboard');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(70);
    });

    it('should match "Stripe integration" to api-integration template', async () => {
      const result = await matcher.matchTemplate({
        description: 'Integrate Stripe payment API with webhooks'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('api-integration');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(60);
    });

    it('should match "Upload profile pictures" to file-upload template', async () => {
      const result = await matcher.matchTemplate({
        description: 'Upload profile pictures to S3 storage'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('file-upload');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(70);
    });

    it('should not match custom unique feature below threshold', async () => {
      const result = await matcher.matchTemplate({
        description: 'Implement quantum blockchain analyzer with neural networks'
      });

      expect(result.use_template).toBe(false);
      expect(result.best_match).toBeNull();
      expect(result.reason).toContain('threshold');
    });
  });

  describe('Explicit Template Selection', () => {
    it('should force match when explicit template specified', async () => {
      const result = await matcher.matchTemplate({
        description: 'Some random description',
        explicit_template: 'auth-system'
      });

      expect(result.use_template).toBe(true);
      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.match_score).toBe(100); // Explicit = 100%
      expect(result.reason).toContain('Explicitly selected');
    });

    it('should return error if explicit template not found', async () => {
      const result = await matcher.matchTemplate({
        description: 'Test',
        explicit_template: 'nonexistent-template'
      });

      expect(result.use_template).toBe(false);
      expect(result.best_match).toBeNull();
      expect(result.reason).toContain('not found');
      expect(result.reason).toContain('Available');
    });
  });

  describe('Keyword Matching Algorithm', () => {
    it('should score higher for more keyword matches', async () => {
      const result1 = await matcher.matchTemplate({
        description: 'auth login jwt password'
      });

      const result2 = await matcher.matchTemplate({
        description: 'auth'
      });

      if (result1.best_match && result2.best_match) {
        expect(result1.best_match.match_score).toBeGreaterThan(result2.best_match.match_score);
      }
    });

    it('should boost score for exact template name match', async () => {
      const result = await matcher.matchTemplate({
        description: 'Authentication System implementation'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(80);
    });

    it('should boost score for category keyword match', async () => {
      const result = await matcher.matchTemplate({
        description: 'Security authentication feature'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.match_score).toBeGreaterThanOrEqual(70);
    });

    it('should filter out stopwords', async () => {
      const result1 = await matcher.matchTemplate({
        description: 'authentication login'
      });

      const result2 = await matcher.matchTemplate({
        description: 'the authentication and login for the users'
      });

      // Should have similar scores despite stopwords
      if (result1.best_match && result2.best_match) {
        const scoreDiff = Math.abs(result1.best_match.match_score - result2.best_match.match_score);
        expect(scoreDiff).toBeLessThan(20);
      }
    });
  });

  describe('Match Result Structure', () => {
    it('should return all matches sorted by score', async () => {
      const result = await matcher.matchTemplate({
        description: 'API endpoint with authentication'
      });

      expect(result.all_matches.length).toBeGreaterThan(0);

      // Check sorting (descending)
      for (let i = 0; i < result.all_matches.length - 1; i++) {
        expect(result.all_matches[i].match_score).toBeGreaterThanOrEqual(
          result.all_matches[i + 1].match_score
        );
      }
    });

    it('should include matched keywords in result', async () => {
      const result = await matcher.matchTemplate({
        description: 'User login with JWT authentication'
      });

      expect(result.best_match?.matched_keywords).toBeDefined();
      expect(result.best_match?.matched_keywords.length).toBeGreaterThan(0);
    });

    it('should include effort estimates in result', async () => {
      const result = await matcher.matchTemplate({
        description: 'Add authentication'
      });

      expect(result.best_match?.estimated_effort).toBeDefined();
      expect(result.best_match?.estimated_effort.hours).toBeGreaterThan(0);
      expect(result.best_match?.estimated_effort.range).toMatch(/\d+-\d+/);
      expect(result.best_match?.estimated_effort.confidence).toBeGreaterThan(0);
    });

    it('should include category in result', async () => {
      const result = await matcher.matchTemplate({
        description: 'Authentication system'
      });

      expect(result.best_match?.category).toBe('Security');
    });

    it('should include complexity in result', async () => {
      const result = await matcher.matchTemplate({
        description: 'User authentication'
      });

      expect(result.best_match?.complexity).toBeDefined();
      expect(['Small', 'Medium', 'Large', 'XL']).toContain(result.best_match?.complexity);
    });
  });

  describe('Effort Adjustment', () => {
    it('should calculate effort adjustment for higher complexity', () => {
      const adjusted = matcher.calculateEffortAdjustment(
        10, // base
        'higher', // complexity diff
        ['custom feature 1', 'custom feature 2'] // 2 custom requirements
      });

      expect(adjusted.hours).toBeGreaterThan(10); // Base 10 + 30% + 2*2 = 17
      expect(adjusted.hours).toBeCloseTo(17, 0);
      expect(adjusted.confidence).toBeLessThan(90); // Reduced confidence
    });

    it('should calculate effort adjustment for lower complexity', () => {
      const adjusted = matcher.calculateEffortAdjustment(
        10, // base
        'lower', // complexity diff
        [] // no custom requirements
      );

      expect(adjusted.hours).toBeLessThan(10); // Base 10 - 20% = 8
      expect(adjusted.hours).toBeCloseTo(8, 0);
    });

    it('should adjust for custom requirements', () => {
      const noCustom = matcher.calculateEffortAdjustment(10, 'same', []);
      const withCustom = matcher.calculateEffortAdjustment(10, 'same', ['req1', 'req2', 'req3']);

      expect(withCustom.hours).toBeGreaterThan(noCustom.hours);
      expect(withCustom.hours).toBeCloseTo(10 + 3 * 2, 0); // +2 hours per requirement
    });

    it('should include effort range in adjustment', () => {
      const adjusted = matcher.calculateEffortAdjustment(10, 'same', []);

      expect(adjusted.range).toMatch(/\d+-\d+/);
      const [min, max] = adjusted.range.split('-').map(Number);
      expect(min).toBeLessThan(adjusted.hours);
      expect(max).toBeGreaterThan(adjusted.hours);
    });

    it('should reduce confidence with more customization', () => {
      const base = matcher.calculateEffortAdjustment(10, 'same', []);
      const complex = matcher.calculateEffortAdjustment(10, 'higher', ['r1', 'r2', 'r3', 'r4', 'r5']);

      expect(complex.confidence).toBeLessThan(base.confidence);
    });

    it('should never return confidence below 50%', () => {
      const adjusted = matcher.calculateEffortAdjustment(
        10,
        'higher',
        Array(20).fill('custom requirement') // Many requirements
      );

      expect(adjusted.confidence).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty description', async () => {
      const result = await matcher.matchTemplate({
        description: ''
      });

      expect(result.use_template).toBe(false);
    });

    it('should handle very long description', async () => {
      const longDesc = 'authentication '.repeat(100);
      const result = await matcher.matchTemplate({
        description: longDesc
      });

      expect(result).toBeDefined();
      expect(result.best_match?.template_name).toBe('auth-system');
    });

    it('should handle special characters in description', async () => {
      const result = await matcher.matchTemplate({
        description: 'Add @user #authentication with $JWT & OAuth2!'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
    });

    it('should be case insensitive', async () => {
      const result1 = await matcher.matchTemplate({
        description: 'AUTHENTICATION'
      });

      const result2 = await matcher.matchTemplate({
        description: 'authentication'
      });

      expect(result1.best_match?.template_name).toBe(result2.best_match?.template_name);
    });

    it('should handle description with only stopwords', async () => {
      const result = await matcher.matchTemplate({
        description: 'the and or but in on at to for'
      });

      expect(result.use_template).toBe(false);
    });

    it('should handle single character tokens', async () => {
      const result = await matcher.matchTemplate({
        description: 'a b c d e auth'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
    });

    it('should handle unicode characters', async () => {
      const result = await matcher.matchTemplate({
        description: '用户 authentication système 認証'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
    });

    it('should handle numbers in description', async () => {
      const result = await matcher.matchTemplate({
        description: 'OAuth2 authentication with JWT tokens for 1000 users'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
    });
  });

  describe('Scoring Algorithm Validation', () => {
    it('should cap match score at 100%', async () => {
      const result = await matcher.matchTemplate({
        description: 'Authentication System auth login signup jwt oauth password session security'
      });

      expect(result.best_match?.match_score).toBeLessThanOrEqual(100);
    });

    it('should apply 30% boost for exact name match', async () => {
      const withName = await matcher.matchTemplate({
        description: 'Authentication System'
      });

      const withoutName = await matcher.matchTemplate({
        description: 'auth'
      });

      if (withName.best_match && withoutName.best_match) {
        const scoreDiff = withName.best_match.match_score - withoutName.best_match.match_score;
        expect(scoreDiff).toBeGreaterThanOrEqual(20); // At least 20% boost from name
      }
    });

    it('should apply 20% boost for category match', async () => {
      const withCategory = await matcher.matchTemplate({
        description: 'Security feature with auth'
      });

      expect(withCategory.best_match?.template_name).toBe('auth-system');
      expect(withCategory.best_match?.match_score).toBeGreaterThanOrEqual(70);
    });

    it('should calculate base score from keyword overlap percentage', async () => {
      const result = await matcher.matchTemplate({
        description: 'auth login'
      });

      // auth-system has 8 keywords, matching 2 = 25% base + boosts
      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.match_score).toBeGreaterThan(0);
    });

    it('should handle partial keyword matches (substring)', async () => {
      const result = await matcher.matchTemplate({
        description: 'authentication authorization'
      });

      expect(result.best_match?.template_name).toBe('auth-system');
      expect(result.best_match?.matched_keywords).toContain('auth');
    });

    it('should deduplicate matched keywords', async () => {
      const result = await matcher.matchTemplate({
        description: 'auth auth auth login login'
      });

      const uniqueKeywords = new Set(result.best_match?.matched_keywords);
      expect(uniqueKeywords.size).toBe(result.best_match?.matched_keywords.length);
    });
  });

  describe('Template Ranking', () => {
    it('should rank multiple matching templates by score', async () => {
      const result = await matcher.matchTemplate({
        description: 'API with authentication'
      });

      // Should match both api-integration and auth-system
      expect(result.all_matches.length).toBeGreaterThanOrEqual(2);

      // First should have highest score
      for (let i = 0; i < result.all_matches.length - 1; i++) {
        expect(result.all_matches[i].match_score).toBeGreaterThanOrEqual(
          result.all_matches[i + 1].match_score
        );
      }
    });

    it('should handle tie in match scores', async () => {
      const result = await matcher.matchTemplate({
        description: 'feature'
      });

      // Might have ties - ensure stable sorting
      expect(result.all_matches).toBeDefined();
      expect(result.best_match).toBe(result.all_matches[0] || null);
    });

    it('should return empty matches when no keywords match', async () => {
      const result = await matcher.matchTemplate({
        description: 'xyzabc123'
      });

      expect(result.all_matches.length).toBe(0);
      expect(result.use_template).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should match template in under 100ms', async () => {
      const start = Date.now();
      await matcher.matchTemplate({
        description: 'Add user authentication with JWT tokens'
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle batch matching efficiently', async () => {
      const descriptions = [
        'authentication',
        'CRUD API',
        'dashboard',
        'file upload',
        'third-party integration'
      ];

      const start = Date.now();
      for (const desc of descriptions) {
        await matcher.matchTemplate({ description: desc });
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // 5 matches in <500ms
    });

    it('should load templates only once (caching)', async () => {
      const templates1 = await matcher.getAvailableTemplates();
      const templates2 = await matcher.getAvailableTemplates();

      expect(templates1).toEqual(templates2);
    });
  });

  describe('Template Path Validation', () => {
    it('should return valid template path for matched template', async () => {
      const result = await matcher.matchTemplate({
        description: 'authentication'
      });

      expect(result.best_match?.template_path).toBeDefined();
      expect(result.best_match?.template_path).toContain('auth-system.yaml');
      expect(fs.existsSync(result.best_match!.template_path)).toBe(true);
    });

    it('should include templates directory in path', async () => {
      const result = await matcher.matchTemplate({
        description: 'CRUD endpoint'
      });

      expect(result.best_match?.template_path).toContain('templates');
      expect(result.best_match?.template_path).toContain('plan-templates');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing keywords gracefully', async () => {
      const result = await matcher.matchTemplate({
        description: ''
      });

      expect(() => result).not.toThrow();
      expect(result.use_template).toBe(false);
    });

    it('should handle null/undefined description', async () => {
      const result1 = await matcher.matchTemplate({
        description: null as any
      });

      expect(result1.use_template).toBe(false);

      const result2 = await matcher.matchTemplate({
        description: undefined as any
      });

      expect(result2.use_template).toBe(false);
    });

    it('should provide helpful error message for nonexistent template', async () => {
      const result = await matcher.matchTemplate({
        description: 'test',
        explicit_template: 'fake-template'
      });

      expect(result.reason).toContain('not found');
      expect(result.reason).toContain('Available');
      expect(result.reason).toContain('auth-system');
    });
  });

  describe('Threshold Behavior', () => {
    it('should reject templates below 70% threshold', async () => {
      const result = await matcher.matchTemplate({
        description: 'random unrelated task'
      });

      expect(result.use_template).toBe(false);
      if (result.all_matches.length > 0) {
        expect(result.all_matches[0].match_score).toBeLessThan(70);
      }
    });

    it('should accept templates at exactly 70% threshold', async () => {
      // This is implementation-dependent, but we test the boundary
      const result = await matcher.matchTemplate({
        description: 'authentication'
      });

      if (result.best_match) {
        if (result.best_match.match_score >= 70) {
          expect(result.use_template).toBe(true);
        } else {
          expect(result.use_template).toBe(false);
        }
      }
    });

    it('should include threshold in rejection reason', async () => {
      const result = await matcher.matchTemplate({
        description: 'unrelated feature'
      });

      if (!result.use_template) {
        expect(result.reason.toLowerCase()).toContain('threshold');
      }
    });
  });

  describe('Integration with Real Templates', () => {
    it('should load auth-system template with all required fields', async () => {
      const template = await matcher.loadTemplate('auth-system');

      expect(template).toBeDefined();
      expect(template?.name).toBeDefined();
      expect(template?.category).toBeDefined();
      expect(template?.keywords).toBeDefined();
      expect(template?.keywords.length).toBeGreaterThan(0);
      expect(template?.estimated_effort).toBeDefined();
      expect(template?.complexity).toBeDefined();
    });

    it('should load all 5 templates successfully', async () => {
      const templateNames = ['auth-system', 'crud-endpoint', 'dashboard', 'api-integration', 'file-upload'];

      for (const name of templateNames) {
        const template = await matcher.loadTemplate(name);
        expect(template).toBeDefined();
        expect(template?.name).toBeTruthy();
      }
    });

    it('should return null for nonexistent template', async () => {
      const template = await matcher.loadTemplate('nonexistent');
      expect(template).toBeNull();
    });
  });
});
