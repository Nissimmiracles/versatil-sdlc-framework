/** Executed hook-source suggestions, not live Claude Task invocation.
 * I/O is restricted to temporary fixtures; identity/guardian/telemetry are synthetic boundaries.
 */
import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHookFixture } from '../fixtures/hook-source-harness/harness.js';

describe('Agent activation suggestion source contract', () => {
  let fixture: ReturnType<typeof createHookFixture>;
  beforeAll(() => { fixture = createHookFixture(); });
  afterAll(() => fixture.cleanup());
  const editedFile = (relative: string, content = '') => {
    const path = join(fixture.root, relative);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
    return path.replace(/\\/g, '/');
  };

  test('new test files suggest Maria-QA and the test-creator template', () => {
    const filePath = editedFile('tests/inventory.test.ts', "test('fixture', () => {});");
    const output = JSON.parse(fixture.run('post-file-edit', { toolName: 'Write', filePath, sessionId: 'fixture-1' }).stdout);
    expect(output.hookType).toBe('template-auto-suggestion + agent-activation');
    expect(output.agent).toMatchObject({ name: 'Maria-QA', autoActivate: true });
    expect(output.template.name).toBe('test-creator');
    expect(output.action).toBe('COPY_TEMPLATE_THEN_INVOKE_AGENT');
  });

  test('agent markdown does not claim a template activation absent from current source behavior', () => {
    // The current hook matches basename against a full .claude/agents path;
    // this unsupported branch must not be advertised as an executed capability.
    const filePath = editedFile('.claude/agents/synthetic-agent.md');
    expect(fixture.run('post-file-edit', { toolName: 'Write', filePath }).stdout).toBe('');
  });

  test('auth prompts inject the declared JWT pattern and related libraries', () => {
    const output = fixture.run('before-prompt', { prompt: 'Implement JWT authentication with cookies' }).stdout;
    for (const expected of ['jwt-auth-cookies', 'marcus-backend', 'testing-library']) expect(output).toContain(expected);
  });

  test('backend route edits suggest Marcus-Backend with Node.js routing', () => {
    const filePath = editedFile('src/routes/users.ts', 'export const users = [];');
    const output = JSON.parse(fixture.run('post-file-edit', { toolName: 'Write', filePath }).stdout);
    expect(output).toMatchObject({ hookType: 'agent-activation-suggestion', agent: 'Marcus-Backend', subAgent: 'marcus-node', autoActivate: true });
  });

  test('RAG library prompts suggest current cross-skill relationships', () => {
    const output = fixture.run('before-prompt', { prompt: 'I need to work with the rag library for pattern search' }).stdout;
    for (const expected of ['rag-library', 'orchestration-library', 'testing-library', 'rag-patterns']) expect(output).toContain(expected);
  });

  test('compiled source executes within 100ms, excluding transpiler and process startup', () => {
    const filePath = editedFile("tests/O'Reilly $literal.test.ts");
    const output = fixture.run('post-file-edit', { toolName: 'Write', filePath });
    expect(JSON.parse(output.stdout).agent.name).toBe('Maria-QA');
    expect(output.executionMs).toBeLessThan(100);
    expect(existsSync(join(fixture.root, 'ESCAPED'))).toBe(false);
  });

  test('missing file paths yield no activation recommendation', () => {
    expect(fixture.run('post-file-edit', { toolName: 'Write' }).stdout).toBe('');
  });
});
