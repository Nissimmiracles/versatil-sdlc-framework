// Synthetic documentation corpus: deterministic ranking and lifecycle inputs, no product claims.
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

export function createDocsCorpus() {
  const root = mkdtempSync(join(tmpdir(), 'versatil-docs-corpus-'));
  const documents: Record<string, string> = {
    'agents/maria.md': '# Maria QA Testing\n\nMaria agent performs testing quality coverage and workflow review.',
    'agents/james.md': '# James Frontend Agent\n\nJames agent reviews React components and accessibility.',
    'agents/marcus.md': '# Marcus Backend Agent\n\nMarcus agent reviews API security and performance.',
    'workflows/primary.md': '# OPERA Agent Workflow\n\nOPERA agent workflow coordinates testing quality and handoff.',
    'workflows/secondary.md': '# Workflow Review\n\nWorkflow review records agent handoff evidence.',
    'guides/overview.md': '# Application Guide\n\nAn overview mentioning Maria for comparison.',
    'guides/installation.md': '# Installation Guide\n\nInstall the example documentation package.',
    'security/auth.md': '# Security Authentication\n\nSecurity authentication prevents unsafe input.',
  };
  for (const [relative, content] of Object.entries(documents)) {
    const file = join(root, 'docs', relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return { root, count: Object.keys(documents).length, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
