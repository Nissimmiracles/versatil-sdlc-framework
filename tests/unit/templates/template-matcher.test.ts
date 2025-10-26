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
  });
});
