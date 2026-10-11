/** Native basename contracts exercised with POSIX and Windows path libraries; reads are offline fixtures. */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as nativePath from 'node:path';
const fixture = vi.hoisted(() => ({ style: process.platform === 'win32' ? 'win32' : 'posix', documents: new Map<string, string>() }));
vi.mock('path', async importOriginal => {
  const actual = await importOriginal<typeof import('path')>();
  return { ...actual,
    basename: (...args: [string, string?]) => actual[fixture.style].basename(...args),
    relative: (...args: [string, string]) => actual[fixture.style].relative(...args),
  };
});
vi.mock('fs/promises', async importOriginal => {
  const actual = await importOriginal<typeof import('fs/promises')>();
  return { ...actual, readFile: vi.fn(async (...args: any[]) => fixture.documents.has(String(args[0])) ? fixture.documents.get(String(args[0])) : (actual.readFile as any)(...args)) };
});
import { ExamplesSearchService } from '../../src/context-engineering/examples-search';
import { GotchasSearchService } from '../../src/context-engineering/gotchas-search';
beforeEach(() => { fixture.documents.clear(); });
const gotcha = '## Gotcha 1: Fixture boundary\n**Severity**: high\n**Pattern**: auth\n';
describe('Native metadata basenames', () => {
  it.each(['posix', 'win32'])('uses the same gotcha technology and ID with %s paths', async style => {
    fixture.style = style;
    const paths = nativePath[style];
    const dir = style === 'win32' ? 'C:\\fixture\\gotchas' : '/fixture/gotchas';
    const file = paths.join(dir, 'frontend', 'react.md');
    fixture.documents.set(file, gotcha.replace(/\\n/g, '\n'));
    const entries = await (new GotchasSearchService(dir) as any).parseGotchaFile(file);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ technology: 'react', id: 'react-1', severity: 'high' });
    expect(entries[0].relative_path.replace(/\\/g, '/')).toBe('frontend/react.md');
  });
  it.each(['posix', 'win32'])('uses only the filename for default example metadata with %s paths', async style => {
    fixture.style = style;
    const paths = nativePath[style];
    const dir = style === 'win32' ? 'C:\\fixture\\examples' : '/fixture/examples';
    const file = paths.join(dir, 'frontend', 'react-button.tsx');
    fixture.documents.set(file, 'export const fixture = true;');
    const entry = await (new ExamplesSearchService(dir) as any).parseExampleFile(file, 'frontend');
    expect(entry.description).toBe('react button');
    expect(entry.keywords).toEqual(['react', 'button']);
    expect(entry.technology).toEqual(['frontend', 'react', 'typescript']);
    expect(entry.relative_path.replace(/\\/g, '/')).toBe('frontend/react-button.tsx');
  });
});
