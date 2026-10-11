/** Real hook-source intent suggestions with synthetic identity/telemetry boundaries.
 * Named suggestions do not prove that their external pattern assets are installed,
 * that suggested metrics are measured, or that an agent was invoked.
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHookFixture } from '../fixtures/hook-source-harness/harness.js';

const cases = [
  ['oauth2-integration', 'Implement OAuth2 with Google and GitHub', 'marcus-backend', 'testing-library'],
  ['database-migration', 'Create Prisma migration to add phone column to User table', 'dana-database', 'Dana-Database'],
  ['graphql-api', 'Implement GraphQL API with Apollo Server and resolvers', 'marcus-backend', 'testing-library'],
  ['react-component', 'Create new React component for user profile card', 'james-frontend', 'James-Frontend'],
  ['docker-deployment', 'Create Dockerfile with multi-stage build and docker-compose', 'marcus-backend']
];

describe('Named pattern suggestion source contract', () => {
  let fixture: ReturnType<typeof createHookFixture>;
  beforeAll(() => { fixture = createHookFixture(); });
  afterAll(() => fixture.cleanup());

  test.each(cases)('suggests %s for its declared intent', (pattern, prompt, library, related) => {
    const result = fixture.run('before-prompt', { prompt });
    expect(result.stdout).toContain(`\`${pattern}\``);
    expect(result.stdout).toContain(library);
    if (related) expect(result.stdout).toContain(related);
    expect(result.stdout).toContain('Auto-Discovered Capabilities');
  });

  test('retains all five named suggestion contracts without a historical total-count assumption', () => {
    const output = fixture.run('before-prompt', { prompt: cases.map(item => item[1]).join('\n') }).stdout;
    for (const [pattern] of cases) expect(output).toContain(`\`${pattern}\``);
    expect(new Set(cases.map(item => item[0])).size).toBe(5);
  });

  test('unrelated prompts do not claim named patterns or measured outcomes', () => {
    const output = fixture.run('before-prompt', { prompt: 'What is a for loop?' }).stdout;
    expect(output).toBe('');
  });

  test('transports quotes and shell syntax as literal JSON rather than executing a shell', () => {
    const result = fixture.run('before-prompt', { prompt: "Implement OAuth2 for O'Reilly\n$(touch ESCAPED) `echo shell`" });
    expect(result.stdout).toContain('oauth2-integration');
    expect(result.stdout).not.toContain('shell\n');
    expect(existsSync(join(fixture.root, 'ESCAPED'))).toBe(false);
  });
});
