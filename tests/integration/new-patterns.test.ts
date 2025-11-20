/**
 * New Named Patterns Test Suite (v7.3.0)
 *
 * Tests 5 new named patterns:
 * 1. oauth2-integration
 * 2. database-migration
 * 3. graphql-api
 * 4. react-component
 * 5. docker-deployment
 *
 * Validates:
 * - Pattern files exist and are valid JSON
 * - Intent patterns trigger correctly
 * - Hook suggests patterns when intents detected
 * - Related agents auto-activate appropriately
 */

import { describe, test, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('New Named Patterns (v7.3.0)', () => {
  const patternsDir = join(process.cwd(), '.versatil', 'learning', 'patterns');

  test('Test 1: All 5 new patterns exist and are valid JSON', () => {
    const patterns = [
      'oauth2-integration.json',
      'database-migration.json',
      'graphql-api.json',
      'react-component.json',
      'docker-deployment.json'
    ];

    patterns.forEach((patternFile) => {
      const filePath = join(patternsDir, patternFile);
      expect(existsSync(filePath)).toBe(true);

      // Validate JSON structure
      const content = readFileSync(filePath, 'utf-8');
      const pattern = JSON.parse(content);

      // Check required fields
      expect(pattern).toHaveProperty('name');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('category');
      expect(pattern).toHaveProperty('type');
      expect(pattern).toHaveProperty('context');
      expect(pattern).toHaveProperty('implementation');
      expect(pattern).toHaveProperty('metrics');
      expect(pattern).toHaveProperty('related');
      expect(pattern).toHaveProperty('examples');
      expect(pattern).toHaveProperty('testing');
      expect(pattern).toHaveProperty('versioning');

      // Check implementation structure
      expect(pattern.implementation).toHaveProperty('code');
      expect(pattern.implementation).toHaveProperty('instructions');
      expect(pattern.implementation).toHaveProperty('prerequisites');
      expect(pattern.implementation).toHaveProperty('warnings');

      console.log(`✅ ${patternFile} is valid`);
    });
  });

  test('Test 2: OAuth intent triggers oauth2-integration pattern', () => {
    const hookInput = JSON.stringify({
      prompt: 'Implement OAuth2 with Google and GitHub',
      workingDirectory: process.cwd(),
      sessionId: 'test-oauth'
    });

    const hookOutput = execSync(
      `echo '${hookInput}' | .claude/hooks/dist/before-prompt.cjs`,
      { encoding: 'utf-8' }
    );

    expect(hookOutput).toContain('oauth2-integration');
    expect(hookOutput).toContain('marcus-backend');
    expect(hookOutput).toContain('testing-library');

    console.log('✅ Test 2 PASS: OAuth intent detected correctly');
  });

  test('Test 3: Migration intent triggers database-migration pattern + Dana-Database', () => {
    const hookInput = JSON.stringify({
      prompt: 'Create Prisma migration to add phone column to User table',
      workingDirectory: process.cwd(),
      sessionId: 'test-migration'
    });

    const hookOutput = execSync(
      `echo '${hookInput}' | .claude/hooks/dist/before-prompt.cjs`,
      { encoding: 'utf-8' }
    );

    expect(hookOutput).toContain('database-migration');
    expect(hookOutput).toContain('dana-database');
    expect(hookOutput).toContain('Dana-Database');
    expect(hookOutput).toContain('AUTO-ACTIVATE');

    console.log('✅ Test 3 PASS: Migration intent detected + Dana-Database auto-activates');
  });

  test('Test 4: GraphQL intent triggers graphql-api pattern', () => {
    const hookInput = JSON.stringify({
      prompt: 'Implement GraphQL API with Apollo Server and resolvers',
      workingDirectory: process.cwd(),
      sessionId: 'test-graphql'
    });

    const hookOutput = execSync(
      `echo '${hookInput}' | .claude/hooks/dist/before-prompt.cjs`,
      { encoding: 'utf-8' }
    );

    expect(hookOutput).toContain('graphql-api');
    expect(hookOutput).toContain('marcus-backend');
    expect(hookOutput).toContain('testing-library');

    console.log('✅ Test 4 PASS: GraphQL intent detected correctly');
  });

  test('Test 5: Component intent triggers react-component pattern + James-Frontend', () => {
    const hookInput = JSON.stringify({
      prompt: 'Create new React component for user profile card',
      workingDirectory: process.cwd(),
      sessionId: 'test-component'
    });

    const hookOutput = execSync(
      `echo '${hookInput}' | .claude/hooks/dist/before-prompt.cjs`,
      { encoding: 'utf-8' }
    );

    expect(hookOutput).toContain('react-component');
    expect(hookOutput).toContain('james-frontend');
    expect(hookOutput).toContain('James-Frontend');
    expect(hookOutput).toContain('AUTO-ACTIVATE');

    console.log('✅ Test 5 PASS: Component intent detected + James-Frontend auto-activates');
  });

  test('Test 6: Docker intent triggers docker-deployment pattern', () => {
    const hookInput = JSON.stringify({
      prompt: 'Create Dockerfile with multi-stage build and docker-compose',
      workingDirectory: process.cwd(),
      sessionId: 'test-docker'
    });

    const hookOutput = execSync(
      `echo '${hookInput}' | .claude/hooks/dist/before-prompt.cjs`,
      { encoding: 'utf-8' }
    );

    expect(hookOutput).toContain('docker-deployment');
    expect(hookOutput).toContain('marcus-backend');

    console.log('✅ Test 6 PASS: Docker intent detected correctly');
  });

  test('Test 7: Total pattern count is 54 (49 + 5 new)', () => {
    const files = execSync('ls -1 .versatil/learning/patterns/*.json 2>/dev/null || echo "0"', {
      encoding: 'utf-8'
    });

    const patternCount = files.split('\n').filter(Boolean).length;

    expect(patternCount).toBeGreaterThanOrEqual(54);

    console.log(`✅ Test 7 PASS: Total patterns: ${patternCount} (expected: ≥54)`);
  });

  test('Test 8: Pattern metrics are realistic', () => {
    const patterns = [
      'oauth2-integration.json',
      'database-migration.json',
      'graphql-api.json',
      'react-component.json',
      'docker-deployment.json'
    ];

    patterns.forEach((patternFile) => {
      const content = readFileSync(join(patternsDir, patternFile), 'utf-8');
      const pattern = JSON.parse(content);

      // Metrics should be realistic (0-1 range)
      expect(pattern.metrics.successRate).toBeGreaterThan(0);
      expect(pattern.metrics.successRate).toBeLessThanOrEqual(1);

      expect(pattern.metrics.performanceImpact).toBeGreaterThan(0);
      expect(pattern.metrics.performanceImpact).toBeLessThanOrEqual(1);

      expect(pattern.metrics.adoptionRate).toBeGreaterThan(0);
      expect(pattern.metrics.adoptionRate).toBeLessThanOrEqual(1);

      // avgImplementationTime should be a string
      expect(typeof pattern.metrics.avgImplementationTime).toBe('string');
      expect(pattern.metrics.avgImplementationTime).toMatch(/\d+-\d+ hours?/);
    });

    console.log('✅ Test 8 PASS: Pattern metrics are realistic');
  });
});

/**
 * Manual Verification (for actual usage):
 *
 * 1. Test OAuth pattern:
 *    - User says: "Implement OAuth2 with Google"
 *    - Hook outputs oauth2-integration pattern suggestion
 *    - Claude applies pattern and references marcus-backend library
 *
 * 2. Test Migration pattern:
 *    - User says: "Add phone column to User table"
 *    - Hook outputs database-migration pattern + Dana-Database auto-activate
 *    - Dana-Database agent invoked via Task tool
 *
 * 3. Test GraphQL pattern:
 *    - User says: "Create GraphQL API with mutations"
 *    - Hook outputs graphql-api pattern suggestion
 *    - Claude applies pattern and references marcus-backend library
 *
 * 4. Test React pattern:
 *    - User says: "Create UserCard component in React"
 *    - Hook outputs react-component pattern + James-Frontend auto-activate
 *    - James-Frontend agent invoked via Task tool
 *
 * 5. Test Docker pattern:
 *    - User says: "Dockerize this app"
 *    - Hook outputs docker-deployment pattern suggestion
 *    - Claude applies pattern and creates Dockerfile + docker-compose.yml
 */
