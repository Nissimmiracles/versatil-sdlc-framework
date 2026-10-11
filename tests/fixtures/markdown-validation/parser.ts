// Test-only logical Markdown parsing. Raw checkout bytes are never rewritten.
import { load, JSON_SCHEMA } from 'js-yaml';

export function normalizeMarkdown(source: string): string {
  return source.replace(/\r\n?/g, '\n');
}

export function parseSkillMarkdown(source: string) {
  const content = normalizeMarkdown(source);
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!frontmatter) throw new Error('Invalid skill frontmatter');
  // JSON_SCHEMA rejects executable/custom YAML tags; skill identifiers are plain slugs.
  const metadata = load(frontmatter[1], { schema: JSON_SCHEMA }) as Record<string, unknown>;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) ||
      typeof metadata.name !== 'string' || metadata.name.trim() !== metadata.name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.name) ||
      typeof metadata.description !== 'string' || !metadata.description.trim()) {
    throw new Error('Invalid skill metadata');
  }
  const examples = [...content.matchAll(/^```([^\n]*)\n([\s\S]*?)^```[ \t]*$/gm)]
    .map(match => ({ language: match[1].trim(), code: match[2].trimEnd() }));
  return { content, name: metadata.name, description: metadata.description, examples };
}

export function validateCodeExamples(source: string, language: 'typescript' | 'python' | 'sql'): void {
  for (const example of parseSkillMarkdown(source).examples.filter(block => block.language === language)) {
    const code = example.code;
    if (language === 'typescript' && (/PLACEHOLDER|TODO:/.test(code) || !/import|const|function|interface|type|class|export|\w+\s*\(/.test(code))) {
      throw new Error('Invalid TypeScript example');
    }
    if (language === 'python' && (/PLACEHOLDER|pass {2}# TODO/.test(code) || !/import|def|class|from/.test(code))) {
      throw new Error('Invalid Python example');
    }
    if (language === 'sql') {
      const statements = code.replace(/--[^\n]*/g, '').trim();
      if (statements ? !/CREATE|SELECT|INSERT|UPDATE|DELETE|ALTER|DROP/i.test(statements) || !statements.includes(';') : !/^--/m.test(code)) {
        throw new Error('Invalid SQL example');
      }
    }
  }
}
