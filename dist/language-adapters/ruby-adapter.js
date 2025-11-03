/* eslint-disable no-empty */
/**
 * VERSATIL Framework v3.0.0 - Ruby Language Adapter
 *
 * Enables VERSATIL to work with Ruby projects, supporting Bundler, RSpec,
 * RuboCop, and the entire Ruby ecosystem.
 *
 * OPERA agents can now orchestrate Ruby development workflows.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BaseLanguageAdapter } from './base-language-adapter.js';
const execAsync = promisify(exec);
export class RubyAdapter extends BaseLanguageAdapter {
    async detect() {
        const indicators = ['Gemfile', 'Rakefile', '*.gemspec', '.ruby-version'];
        for (const file of indicators) {
            if (existsSync(join(this.rootPath, file))) {
                return true;
            }
        }
        try {
            const { stdout } = await execAsync(`find . -name "*.rb" | head -1`, {
                cwd: this.rootPath
            });
            if (stdout.trim())
                return true;
        }
        catch { // eslint-disable-line no-empty
        }
        return false;
    }
    getCapabilities() {
        return {
            testing: true,
            linting: true,
            formatting: true,
            typeChecking: false,
            packageManagement: true,
            buildSystem: true
        };
    }
    async analyzeProject() {
        try {
            const { stdout } = await execAsync('ruby --version');
            this.rubyVersion = stdout.trim();
        }
        catch { // eslint-disable-line no-empty
            this.rubyVersion = 'Unknown';
        }
        const mainFiles = await this.findRubyFiles(['lib/**/*.rb', 'app/**/*.rb']);
        const testFiles = await this.findRubyFiles(['spec/**/*.rb', 'test/**/*.rb']);
        const configFiles = [];
        for (const config of ['Gemfile', 'Gemfile.lock', 'Rakefile', '.rubocop.yml', '.rspec']) {
            if (existsSync(join(this.rootPath, config)))
                configFiles.push(config);
        }
        return {
            rootPath: this.rootPath,
            language: 'ruby',
            packageManager: 'bundler',
            mainFiles,
            testFiles,
            configFiles,
            buildOutput: 'pkg/',
            dependencies: await this.parseDependencies()
        };
    }
    async runTests(options) {
        try {
            const command = 'bundle exec rspec --format json';
            const { stdout } = await execAsync(command, { cwd: this.rootPath });
            const result = JSON.parse(stdout);
            const examples = result.examples || [];
            return {
                passed: examples.filter((e) => e.status === 'passed').length,
                failed: examples.filter((e) => e.status === 'failed').length,
                skipped: examples.filter((e) => e.status === 'pending').length,
                coverage: undefined,
                duration: result.summary?.duration || 0,
                details: []
            };
        }
        catch (error) {
            return {
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: 0,
                details: [{ name: 'test execution', status: 'failed', duration: 0, error: error.message }]
            };
        }
    }
    async build(options) {
        const startTime = Date.now();
        try {
            const { stdout } = await execAsync('gem build', { cwd: this.rootPath });
            const artifacts = [];
            try {
                const { stdout: files } = await execAsync('ls pkg/');
                artifacts.push(...files.split('\n').filter(f => f.endsWith('.gem')).map(f => `pkg/${f}`));
            }
            catch { // eslint-disable-line no-empty
            }
            return {
                success: true,
                output: stdout,
                errors: [],
                warnings: [],
                artifacts,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                output: error.stdout || '',
                errors: [error.message],
                warnings: [],
                artifacts: [],
                duration: Date.now() - startTime
            };
        }
    }
    async lint(options) {
        try {
            const command = 'bundle exec rubocop --format json';
            const { stdout } = await execAsync(command, { cwd: this.rootPath });
            const result = JSON.parse(stdout);
            const files = result.files || [];
            const issues = files.flatMap((file) => (file.offenses || []).map((offense) => ({
                file: file.path,
                line: offense.location.line,
                column: offense.location.column,
                severity: offense.severity === 'error' ? 'error' : 'warning',
                message: offense.message,
                rule: offense.cop_name
            })));
            return {
                errors: issues.filter(i => i.severity === 'error').length,
                warnings: issues.filter(i => i.severity === 'warning').length,
                issues
            };
        }
        catch (error) {
            return { errors: 0, warnings: 0, issues: [] };
        }
    }
    async format(options) {
        try {
            const checkArg = options?.check ? '--dry-run' : '--autocorrect-all';
            await execAsync(`bundle exec rubocop ${checkArg}`, { cwd: this.rootPath });
            return { formatted: 1, errors: [] };
        }
        catch (error) {
            return { formatted: 0, errors: [error.message] };
        }
    }
    async installDependencies() {
        try {
            const { stdout } = await execAsync('bundle install', { cwd: this.rootPath });
            const installed = await this.parseDependencyNames();
            return { success: true, installed, errors: [] };
        }
        catch (error) {
            return { success: false, installed: [], errors: [error.message] };
        }
    }
    getRecommendedAgents() {
        return ['maria-qa', 'marcus-backend', 'james-frontend', 'devops-dan', 'security-sam'];
    }
    async getQualityMetrics() {
        const testCoverage = 0;
        let lintScore = 100;
        try {
            const lintResult = await this.lint();
            lintScore = Math.max(0, 100 - (lintResult.errors + lintResult.warnings) * 5);
        }
        catch { // eslint-disable-line no-empty
        }
        return {
            testCoverage,
            lintScore,
            complexityScore: 75,
            maintainability: (testCoverage + lintScore + 75) / 3
        };
    }
    async executeCommand(command, args) {
        const fullCommand = args ? `${command} ${args.join(' ')}` : command;
        try {
            const { stdout, stderr } = await execAsync(fullCommand, { cwd: this.rootPath });
            return { exitCode: 0, stdout, stderr };
        }
        catch (error) {
            return {
                exitCode: error.code || 1,
                stdout: error.stdout || '',
                stderr: error.stderr || error.message
            };
        }
    }
    async findRubyFiles(patterns) {
        const files = [];
        try {
            const { stdout } = await execAsync(`find . -name "*.rb" -type f`, { cwd: this.rootPath });
            files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.rb')));
        }
        catch { // eslint-disable-line no-empty
        }
        return Array.from(new Set(files));
    }
    async parseDependencies() {
        const deps = {};
        const gemfilePath = join(this.rootPath, 'Gemfile');
        if (!existsSync(gemfilePath))
            return deps;
        const content = readFileSync(gemfilePath, 'utf8');
        const gemPattern = /gem\s+['"]([^'"]+)['"],\s*['"]~>\s*([^'"]+)['"]/g;
        let match;
        while ((match = gemPattern.exec(content)) !== null) {
            deps[match[1]] = match[2];
        }
        return deps;
    }
    async parseDependencyNames() {
        const deps = await this.parseDependencies();
        return Object.keys(deps);
    }
}
//# sourceMappingURL=ruby-adapter.js.map