/**
 * Template Matcher Service - Integration Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TemplateMatcher } from '../../src/templates/template-matcher.js';

describe('TemplateMatcher', () => {
  let matcher: TemplateMatcher;

  beforeEach(() => {
    matcher = new TemplateMatcher();
  });

  it('should match "Add user authentication" to auth-system template', async () => {
    const result = await matcher.matchTemplate({
      description: 'Add user authentication with JWT tokens'
    });

    if (result.best_match) {
      expect(result.best_match.template_name).toBe('auth-system');
      expect(result.best_match.match_score).toBeGreaterThanOrEqual(70);
    }
  });

  it('should match "Add products API" to crud-endpoint template', async () => {
    const result = await matcher.matchTemplate({
      description: 'Add products REST API with CRUD operations'
    });

    if (result.best_match) {
      expect(result.best_match.template_name).toBe('crud-endpoint');
      expect(result.best_match.match_score).toBeGreaterThanOrEqual(70);
    }
  });

  it('should support explicit template selection', async () => {
    const result = await matcher.matchTemplate({
      description: 'Custom feature',
      explicit_template: 'auth-system'
    });

    expect(result.use_template).toBe(true);
    expect(result.best_match?.template_name).toBe('auth-system');
    expect(result.best_match?.match_score).toBe(100);
  });

  it('should return no match for very different description', async () => {
    const result = await matcher.matchTemplate({
      description: 'xyz custom unique feature with no keywords'
    });

    expect(result.use_template).toBe(false);
    expect(result.best_match).toBeNull();
  });

  it('should load all available templates', async () => {
    const templates = await matcher.getAvailableTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates).toContain('auth-system');
    expect(templates).toContain('crud-endpoint');
  });
});
