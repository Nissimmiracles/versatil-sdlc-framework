/** Offline integration of context search and the real INITIAL.md parser. */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ExamplesSearchService } from '../../src/context-engineering/examples-search';
import { GotchasSearchService } from '../../src/context-engineering/gotchas-search';
import { TemplateParser } from '../../src/context-engineering/template-parser';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let root: string;
let examples: ExamplesSearchService;
let gotchas: GotchasSearchService;
beforeEach(async () => {
  root = await fs.mkdtemp(join(tmpdir(), 'plan-context-'));
  for (const domain of ['backend', 'frontend', 'database']) {
    await fs.mkdir(join(root, 'examples', domain), { recursive: true });
    await fs.mkdir(join(root, 'gotchas', domain), { recursive: true });
  }
  const inputs = [
    ['backend', 'login.ts', 'authentication,backend', 'Validate login'],
    ['frontend', 'button.tsx', 'react,frontend', 'Accessible button'],
    ['database', 'schema.ts', 'postgresql,database', 'Tenant schema'],
  ];
  for (const [domain, file, technology, description] of inputs) {
    await fs.writeFile(join(root, 'examples', domain, file), `/**
 * @description ${description}
 * @technology ${technology}
 * @keywords auth,fixture
 */
export const fixture = true;`);
  }
  for (const [domain, technology, severity] of [
    ['backend', 'authentication', 'critical'], ['frontend', 'react', 'high'], ['database', 'postgresql', 'medium'],
  ]) {
    await fs.writeFile(join(root, 'gotchas', domain, `${technology}.md`), `## Gotcha 1: ${technology} boundary
**Severity**: ${severity}
**Frequency**: Common
**Pattern**: auth
### The Mistake
\`\`\`ts
allowAll();
\`\`\`
### The Correct Pattern
\`\`\`ts
validate();
\`\`\`
### Detection
Review boundary`);
  }
  examples = new ExamplesSearchService(join(root, 'examples'));
  gotchas = new GotchasSearchService(join(root, 'gotchas'));
});
afterEach(async () => { await fs.rm(root, { recursive: true, force: true }); });

describe('Context search input contracts', () => {
  it.each([
    ['authentication', 'backend', 'login.ts'], ['react', 'frontend', 'button.tsx'], ['postgresql', 'database', 'schema.ts'],
  ])('routes %s examples to %s', async (technology, domain, file) => {
    const result = await examples.search({ technologies: [technology], includeContent: true });
    expect(result[domain]).toHaveLength(1);
    expect(result[domain][0].file_path).toBe(join(root, 'examples', domain, file));
    expect(result[domain][0].content).toContain('export const fixture = true');
    for (const other of ['backend', 'frontend', 'database'].filter(value => value !== domain)) expect(result[other]).toEqual([]);
  });
  it('does not invent examples for an unsupported technology', async () => {
    expect(await examples.search({ technologies: ['unknown-fixture'] })).toEqual({ backend: [], frontend: [], database: [], testing: [], rag: [], hooks: [], commands: [], validation: [] });
  });
  it('retrieves both sources independently for React context', async () => {
    const [sample, risks] = await Promise.all([examples.search({ technologies: ['react'] }), gotchas.search({ technologies: ['react'] })]);
    expect(sample.frontend).toHaveLength(1);
    expect(risks.all).toHaveLength(1);
    expect(risks.all[0]).toMatchObject({ technology: 'react', severity: 'high', pattern: 'auth' });
  });
  it('filters severity without retaining lower-severity risks', async () => {
    const result = await gotchas.search({ severity: ['critical', 'high'] });
    expect(result.all.map(entry => entry.severity)).toEqual(['critical', 'high']);
    expect(result.database).toEqual([]);
  });
  it.each([['marcus-backend', 'authentication'], ['james-frontend', 'react'], ['dana-database', 'postgresql']])('filters risks for %s', async (agent, technology) => {
    const result = await gotchas.search({ agent });
    expect(result.all.map(entry => entry.technology)).toEqual([technology]);
  });
  it('returns no risks for an unknown technology', async () => {
    expect((await gotchas.search({ technologies: ['unknown-fixture'] })).all).toEqual([]);
  });
});

describe('Real template detection and parsing', () => {
  it('detects a structured file and extracts goals, references, and risks', async () => {
    const file = join(root, 'INITIAL.md');
    await fs.writeFile(file, `## FEATURE
Tenant login

Require authenticated tenant access.

### Goals
- Authenticate users
### Acceptance Criteria
- Reject unknown tenants
## EXAMPLES
Reference implementations.
- examples/backend/login.ts
## OTHER CONSIDERATIONS
### Gotchas
- Never trust client tenant IDs
`);
    expect(await TemplateParser.isTemplate(file)).toBe(true);
    const result = await TemplateParser.parse(file);
    expect(result.feature.title).toBe('Tenant login');
    expect(result.feature.goals).toEqual(['Authenticate users']);
    expect(result.feature.acceptanceCriteria).toEqual(['Reject unknown tenants']);
    expect(result.examples.references).toEqual(['examples/backend/login.ts']);
    expect(result.gotchas.items).toEqual(['Never trust client tenant IDs']);
    expect(result.filePath).toBe(file);
  });
  it('rejects ordinary Markdown and missing files', async () => {
    const file = join(root, 'plain.md');
    await fs.writeFile(file, '# Ordinary notes');
    expect(await TemplateParser.isTemplate(file)).toBe(false);
    expect(await TemplateParser.isTemplate(join(root, 'missing.md'))).toBe(false);
  });
  it('propagates an unreadable template instead of fabricating requirements', async () => {
    await expect(TemplateParser.parse(join(root, 'missing.md'))).rejects.toThrow();
  });
});
