/**
 * Automated Changelog Generator
 * Generates beautiful changelogs from git commits using conventional commit format
 */

import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CommitInfo {
  hash: string;
  type: string;
  scope?: string;
  subject: string;
  body?: string;
  breaking?: boolean;
  author: string;
  date: Date;
  pr?: string;
}

export interface ChangelogEntry {
  version: string;
  date: Date;
  features: CommitInfo[];
  fixes: CommitInfo[];
  breaking: CommitInfo[];
  chores: CommitInfo[];
  docs: CommitInfo[];
  refactor: CommitInfo[];
  performance: CommitInfo[];
  tests: CommitInfo[];
}

export class ChangelogGenerator {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  /**
   * Generate changelog from git history
   */
  async generateChangelog(fromTag?: string, toTag: string = 'HEAD'): Promise<string> {
    console.log(`📝 Generating changelog from ${fromTag || 'beginning'} to ${toTag}...`);

    const commits = await this.getCommitsSince(fromTag);
    const parsedCommits = commits.map(commit => this.parseCommit(commit));

    const currentVersion = await this.getCurrentVersion();
    const entry: ChangelogEntry = {
      version: currentVersion,
      date: new Date(),
      features: parsedCommits.filter(c => c.type === 'feat'),
      fixes: parsedCommits.filter(c => c.type === 'fix'),
      breaking: parsedCommits.filter(c => c.breaking),
      chores: parsedCommits.filter(c => c.type === 'chore'),
      docs: parsedCommits.filter(c => c.type === 'docs'),
      refactor: parsedCommits.filter(c => c.type === 'refactor'),
      performance: parsedCommits.filter(c => c.type === 'perf'),
      tests: parsedCommits.filter(c => c.type === 'test')
    };

    return this.formatChangelog(entry);
  }

  /**
   * Update CHANGELOG.md file
   */
  async updateChangelogFile(newEntry: string): Promise<void> {
    const changelogPath = path.join(this.projectPath, 'CHANGELOG.md');

    let existingContent = '';
    try {
      existingContent = await fs.readFile(changelogPath, 'utf-8');
    } catch {
      // File doesn't exist, create new one
      existingContent = this.getChangelogHeader();
    }

    // Insert new entry after header
    const lines = existingContent.split('\n');
    const headerEndIndex = lines.findIndex(line => line.startsWith('## '));

    if (headerEndIndex === -1) {
      // No existing entries, add after header
      const updatedContent = this.getChangelogHeader() + '\n' + newEntry;
      await fs.writeFile(changelogPath, updatedContent);
    } else {
      // Insert before first existing entry
      lines.splice(headerEndIndex, 0, newEntry, '');
      await fs.writeFile(changelogPath, lines.join('\n'));
    }

    console.log(`✅ Updated CHANGELOG.md with new entries`);
  }

  /**
   * Get commits since last tag or from beginning
   */
  private async getCommitsSince(fromTag?: string): Promise<string[]> {
    try {
      let command = 'git log --oneline --no-merges';

      if (fromTag) {
        // Get commits since the tag
        command = `git log ${fromTag}..HEAD --oneline --no-merges`;
      } else {
        // Get last 20 commits if no tag specified
        command = 'git log --oneline --no-merges -20';
      }

      const output = execSync(command, {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });

      return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
      console.warn('Could not get git commits:', error);
      return [];
    }
  }

  /**
   * Parse conventional commit format
   */
  private parseCommit(commitLine: string): CommitInfo {
    const [hash, ...messageParts] = commitLine.split(' ');
    const message = messageParts.join(' ');

    // Parse conventional commit format: type(scope): subject
    const conventionalRegex = /^(\w+)(?:\(([^)]+)\))?: (.+)$/;
    const match = message.match(conventionalRegex);

    if (match) {
      const [, type, scope, subject] = match;
      return {
        hash: hash.substring(0, 7),
        type,
        scope,
        subject,
        breaking: message.includes('BREAKING CHANGE') || subject.includes('!:'),
        author: this.getCommitAuthor(hash),
        date: this.getCommitDate(hash),
        pr: this.extractPRNumber(subject)
      };
    }

    // Fallback for non-conventional commits
    return {
      hash: hash.substring(0, 7),
      type: 'chore',
      subject: message,
      breaking: false,
      author: this.getCommitAuthor(hash),
      date: this.getCommitDate(hash)
    };
  }

  /**
   * Get commit author
   */
  private getCommitAuthor(hash: string): string {
    try {
      return execSync(`git show -s --format='%an' ${hash}`, {
        cwd: this.projectPath,
        encoding: 'utf-8'
      }).trim();
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get commit date
   */
  private getCommitDate(hash: string): Date {
    try {
      const dateStr = execSync(`git show -s --format='%ci' ${hash}`, {
        cwd: this.projectPath,
        encoding: 'utf-8'
      }).trim();
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  }

  /**
   * Extract PR number from commit message
   */
  private extractPRNumber(subject: string): string | undefined {
    const prMatch = subject.match(/#(\d+)/);
    return prMatch ? prMatch[1] : undefined;
  }

  /**
   * Get current version from package.json
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const packagePath = path.join(this.projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);
      return packageJson.version || '0.0.1';
    } catch {
      return '0.0.1';
    }
  }

  /**
   * Format changelog entry
   */
  private formatChangelog(entry: ChangelogEntry): string {
    const sections: string[] = [];

    // Header
    sections.push(`## [${entry.version}] - ${entry.date.toISOString().split('T')[0]}`);
    sections.push('');

    // Breaking changes (most important)
    if (entry.breaking.length > 0) {
      sections.push('### 💥 BREAKING CHANGES');
      entry.breaking.forEach(commit => {
        sections.push(`- **${commit.scope || 'core'}**: ${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))`);
      });
      sections.push('');
    }

    // Features
    if (entry.features.length > 0) {
      sections.push('### ✨ Features');
      entry.features.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        const pr = commit.pr ? ` ([#${commit.pr}](../../pull/${commit.pr}))` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))${pr}`);
      });
      sections.push('');
    }

    // Bug fixes
    if (entry.fixes.length > 0) {
      sections.push('### 🐛 Bug Fixes');
      entry.fixes.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        const pr = commit.pr ? ` ([#${commit.pr}](../../pull/${commit.pr}))` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))${pr}`);
      });
      sections.push('');
    }

    // Performance improvements
    if (entry.performance.length > 0) {
      sections.push('### 🚀 Performance Improvements');
      entry.performance.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))`);
      });
      sections.push('');
    }

    // Documentation
    if (entry.docs.length > 0) {
      sections.push('### 📚 Documentation');
      entry.docs.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))`);
      });
      sections.push('');
    }

    // Code refactoring
    if (entry.refactor.length > 0) {
      sections.push('### 🔨 Code Refactoring');
      entry.refactor.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))`);
      });
      sections.push('');
    }

    // Tests
    if (entry.tests.length > 0) {
      sections.push('### 🧪 Tests');
      entry.tests.forEach(commit => {
        const scope = commit.scope ? `**${commit.scope}**: ` : '';
        sections.push(`- ${scope}${commit.subject} ([${commit.hash}](../../commit/${commit.hash}))`);
      });
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Get changelog header
   */
  private getChangelogHeader(): string {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
  }

  /**
   * Generate release notes for GitHub
   */
  async generateReleaseNotes(version: string): Promise<string> {
    const changelog = await this.generateChangelog();

    return `
🚀 **VERSATIL Framework ${version}**

${changelog}

## 📦 Installation

\`\`\`bash
npm install -g versatil-sdlc-framework@${version}
\`\`\`

## 🔄 Upgrade Guide

\`\`\`bash
npm update -g versatil-sdlc-framework
versatil init --upgrade
\`\`\`

## 📞 Support

- 📖 [Documentation](https://docs.versatil-platform.com)
- 💬 [Discord Community](https://discord.gg/versatil)
- 🐛 [Report Issues](https://github.com/versatil-platform/versatil-sdlc-framework/issues)

---

🤖 Generated with VERSATIL SDLC Framework
`;
  }

  /**
   * Auto-generate changelog for current changes
   */
  async autoGenerateChangelog(): Promise<void> {
    console.log('🔄 Auto-generating changelog...');

    const lastTag = await this.getLastTag();
    const changelog = await this.generateChangelog(lastTag);

    if (changelog.trim()) {
      await this.updateChangelogFile(changelog);
      console.log('✅ Changelog generated successfully');
    } else {
      console.log('ℹ️ No new changes to add to changelog');
    }
  }

  /**
   * Get last git tag
   */
  private async getLastTag(): Promise<string | undefined> {
    try {
      const output = execSync('git describe --tags --abbrev=0', {
        cwd: this.projectPath,
        encoding: 'utf-8'
      });
      return output.trim();
    } catch {
      return undefined;
    }
  }
}

export const changelogGenerator = new ChangelogGenerator();