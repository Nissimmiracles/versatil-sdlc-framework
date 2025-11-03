/* eslint-disable no-empty */
/**
 * VERSATIL Framework v3.0.0 - Rust Language Adapter
 *
 * Enables VERSATIL to work with Rust projects, supporting cargo test, cargo build,
 * clippy, rustfmt, and the entire Rust toolchain.
 *
 * OPERA agents can now orchestrate Rust development workflows.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { BaseLanguageAdapter } from './base-language-adapter.js';
const execAsync = promisify(exec);
export class RustAdapter extends BaseLanguageAdapter {
    /**
     * Detect if this is a Rust project
     */
    async detect() {
        // Primary indicator: Cargo.toml file
        if (existsSync(join(this.rootPath, 'Cargo.toml'))) {
            return true;
        }
        // Secondary indicators
        const indicators = [
            'Cargo.lock',
            'src/main.rs',
            'src/lib.rs'
        ];
        for (const file of indicators) {
            if (existsSync(join(this.rootPath, file))) {
                // Verify it's actually a Rust project
                try {
                    const { stdout } = await execAsync(`find . -name "*.rs" | head -1`, {
                        cwd: this.rootPath
                    });
                    if (stdout.trim()) {
                        return true;
                    }
                }
                catch { // eslint-disable-line no-empty
                    continue;
                }
            }
        }
        return false;
    }
    /**
     * Get Rust-specific capabilities
     */
    getCapabilities() {
        return {
            testing: true, // cargo test
            linting: true, // clippy
            formatting: true, // rustfmt
            typeChecking: true, // Native Rust type checking
            packageManagement: true, // cargo
            buildSystem: true // cargo build
        };
    }
    /**
     * Analyze Rust project structure
     */
    async analyzeProject() {
        // Get Rust version
        try {
            const { stdout } = await execAsync('rustc --version');
            this.rustVersion = stdout.trim();
        }
        catch { // eslint-disable-line no-empty
            this.rustVersion = 'Unknown';
        }
        // Parse Cargo.toml for package name
        const cargoTomlPath = join(this.rootPath, 'Cargo.toml');
        if (existsSync(cargoTomlPath)) {
            const content = readFileSync(cargoTomlPath, 'utf8');
            const nameMatch = content.match(/^name\s*=\s*"(.+)"$/m);
            if (nameMatch) {
                this.packageName = nameMatch[1];
            }
        }
        // Find Rust source files
        const mainFiles = await this.findRustFiles([
            'src/**/*.rs',
            'examples/**/*.rs',
            'benches/**/*.rs'
        ]);
        // Find test files
        const testFiles = await this.findRustFiles([
            'tests/**/*.rs',
            'src/**/*test*.rs'
        ]);
        // Find config files
        const configFiles = [];
        const configs = [
            'Cargo.toml',
            'Cargo.lock',
            'rust-toolchain.toml',
            'rustfmt.toml',
            '.rustfmt.toml',
            'clippy.toml'
        ];
        for (const config of configs) {
            if (existsSync(join(this.rootPath, config))) {
                configFiles.push(config);
            }
        }
        // Parse dependencies from Cargo.toml
        const dependencies = await this.parseDependencies();
        return {
            rootPath: this.rootPath,
            language: 'rust',
            packageManager: 'cargo',
            mainFiles: mainFiles.filter(f => !f.includes('/tests/') && !f.includes('test')),
            testFiles,
            configFiles,
            buildOutput: 'target/',
            dependencies
        };
    }
    /**
     * Run Rust tests using cargo test
     */
    async runTests(options) {
        const patternArg = options?.pattern ? options.pattern : '';
        const coverageArg = options?.coverage ? '--' : ''; // Note: coverage requires tarpaulin
        try {
            let command = `cargo test ${patternArg} -- --test-threads=1 --nocapture`;
            // Use cargo-tarpaulin for coverage if requested
            if (options?.coverage) {
                try {
                    command = `cargo tarpaulin --out Json --output-dir target/coverage`;
                }
                catch { // eslint-disable-line no-empty
                    // Fallback to regular cargo test if tarpaulin not available
                    command = `cargo test ${patternArg}`;
                }
            }
            const { stdout, stderr } = await execAsync(command, { cwd: this.rootPath });
            // Parse cargo test output
            const testResultPattern = /test result: (\w+)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured/;
            const match = stdout.match(testResultPattern);
            let passed = 0;
            let failed = 0;
            let skipped = 0;
            if (match) {
                passed = parseInt(match[2]);
                failed = parseInt(match[3]);
                skipped = parseInt(match[4]);
            }
            // Parse coverage if available
            let coverage;
            if (options?.coverage) {
                try {
                    const coverageFile = join(this.rootPath, 'target/coverage/tarpaulin-report.json');
                    if (existsSync(coverageFile)) {
                        const coverageData = JSON.parse(readFileSync(coverageFile, 'utf8'));
                        coverage = coverageData.coverage;
                    }
                }
                catch { // eslint-disable-line no-empty
                    coverage = undefined;
                }
            }
            return {
                passed,
                failed,
                skipped,
                coverage,
                duration: 0, // Cargo doesn't provide total duration easily
                details: []
            };
        }
        catch (error) {
            // Parse error output
            const errorOutput = error.stdout || error.stderr || '';
            const failedMatch = errorOutput.match(/(\d+) failed/);
            return {
                passed: 0,
                failed: failedMatch ? parseInt(failedMatch[1]) : 1,
                skipped: 0,
                duration: 0,
                details: [{
                        name: 'test execution',
                        status: 'failed',
                        duration: 0,
                        error: error.message
                    }]
            };
        }
    }
    /**
     * Build Rust project using cargo build
     */
    async build(options) {
        const startTime = Date.now();
        const errors = [];
        const warnings = [];
        const artifacts = [];
        try {
            const releaseFlag = options?.mode === 'production' || options?.optimization ? '--release' : '';
            const targetFlag = options?.target ? `--target ${options.target}` : '';
            const buildCmd = `cargo build ${releaseFlag} ${targetFlag}`.trim();
            const { stdout, stderr } = await execAsync(buildCmd, { cwd: this.rootPath });
            // Parse build output for warnings
            const warningPattern = /warning: (.+)/g;
            let warningMatch;
            while ((warningMatch = warningPattern.exec(stderr)) !== null) {
                warnings.push(warningMatch[1]);
            }
            // Check for built artifacts
            const targetDir = options?.mode === 'production' || options?.optimization
                ? 'target/release'
                : 'target/debug';
            try {
                const { stdout: files } = await execAsync(`ls "${join(this.rootPath, targetDir)}"`, {
                    cwd: this.rootPath
                });
                const binaries = files.split('\n').filter(f => f && !f.includes('.') && !f.includes('build'));
                artifacts.push(...binaries.map(b => `${targetDir}/${b}`));
            }
            catch { // eslint-disable-line no-empty
                // No artifacts found
            }
            return {
                success: true,
                output: stdout,
                errors,
                warnings,
                artifacts,
                duration: Date.now() - startTime
            };
        }
        catch (error) {
            // Parse error output
            const errorPattern = /error: (.+)/g;
            let errorMatch;
            while ((errorMatch = errorPattern.exec(error.stderr || '')) !== null) {
                errors.push(errorMatch[1]);
            }
            return {
                success: false,
                output: error.stdout || '',
                errors,
                warnings,
                artifacts,
                duration: Date.now() - startTime
            };
        }
    }
    /**
     * Lint Rust code using clippy
     */
    async lint(options) {
        const fixArg = options?.fix ? '--fix --allow-dirty --allow-staged' : '';
        try {
            const { stdout, stderr } = await execAsync(`cargo clippy ${fixArg} -- -D warnings`, { cwd: this.rootPath });
            // Parse clippy output
            const warningPattern = /warning: (.+)/g;
            const errorPattern = /error: (.+)/g;
            const warnings = [];
            const errors = [];
            let match;
            while ((match = warningPattern.exec(stderr)) !== null) {
                warnings.push({
                    file: 'unknown',
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: match[1],
                    rule: 'clippy'
                });
            }
            while ((match = errorPattern.exec(stderr)) !== null) {
                errors.push({
                    file: 'unknown',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: match[1],
                    rule: 'clippy'
                });
            }
            return {
                errors: errors.length,
                warnings: warnings.length,
                issues: [...errors, ...warnings]
            };
        }
        catch (error) {
            // Clippy failed, parse the output
            const issues = [];
            const errorOutput = error.stderr || '';
            const warningPattern = /warning: (.+)/g;
            const errorPattern = /error: (.+)/g;
            let match;
            while ((match = warningPattern.exec(errorOutput)) !== null) {
                issues.push({
                    file: 'unknown',
                    line: 0,
                    column: 0,
                    severity: 'warning',
                    message: match[1],
                    rule: 'clippy'
                });
            }
            while ((match = errorPattern.exec(errorOutput)) !== null) {
                issues.push({
                    file: 'unknown',
                    line: 0,
                    column: 0,
                    severity: 'error',
                    message: match[1],
                    rule: 'clippy'
                });
            }
            return {
                errors: issues.filter(i => i.severity === 'error').length,
                warnings: issues.filter(i => i.severity === 'warning').length,
                issues
            };
        }
    }
    /**
     * Format Rust code using rustfmt
     */
    async format(options) {
        const checkArg = options?.check ? '--check' : '';
        try {
            const { stdout } = await execAsync(`cargo fmt ${checkArg}`, { cwd: this.rootPath });
            if (options?.check) {
                // If check mode and no output, all files are formatted
                return { formatted: 0, errors: [] };
            }
            else {
                return { formatted: 1, errors: [] };
            }
        }
        catch (error) {
            if (options?.check) {
                // Files need formatting
                const output = error.stdout || error.stderr || '';
                const diffLines = output.split('\n').filter((l) => l.startsWith('Diff in'));
                return { formatted: 0, errors: [`${diffLines.length} files need formatting`] };
            }
            else {
                return { formatted: 0, errors: [error.message] };
            }
        }
    }
    /**
     * Install Rust dependencies using cargo
     */
    async installDependencies() {
        try {
            // Cargo automatically fetches dependencies during build
            // We can use cargo fetch to download them explicitly
            const { stdout } = await execAsync('cargo fetch', { cwd: this.rootPath });
            // Parse installed crates
            const installed = await this.parseDependencyNames();
            return { success: true, installed, errors: [] };
        }
        catch (error) {
            return { success: false, installed: [], errors: [error.message] };
        }
    }
    /**
     * Get recommended OPERA agents for Rust projects
     */
    getRecommendedAgents() {
        return [
            'maria-qa', // Testing with cargo test
            'marcus-backend', // Backend/systems programming (Rust's strength)
            'devops-dan', // Deployment (Docker, Kubernetes)
            'security-sam', // Security (Rust's memory safety, cargo-audit)
            'architecture-dan' // System design (performance-critical systems)
        ];
    }
    /**
     * Get Rust-specific quality metrics
     */
    async getQualityMetrics() {
        // Run coverage using tarpaulin
        let testCoverage = 0;
        try {
            await execAsync('cargo tarpaulin --out Json --output-dir target/coverage', {
                cwd: this.rootPath
            });
            const coverageFile = join(this.rootPath, 'target/coverage/tarpaulin-report.json');
            if (existsSync(coverageFile)) {
                const coverageData = JSON.parse(readFileSync(coverageFile, 'utf8'));
                testCoverage = coverageData.coverage || 0;
            }
        }
        catch { // eslint-disable-line no-empty
            testCoverage = 0;
        }
        // Run clippy for linting score
        let lintScore = 100;
        try {
            const lintResult = await this.lint();
            const totalIssues = lintResult.errors + lintResult.warnings;
            lintScore = Math.max(0, 100 - (totalIssues * 5)); // Deduct 5 points per issue
        }
        catch { // eslint-disable-line no-empty
            lintScore = 100;
        }
        // Rust has excellent built-in complexity checks via clippy
        const complexityScore = lintScore; // Use lint score as proxy
        return {
            testCoverage,
            lintScore,
            complexityScore,
            maintainability: (testCoverage + lintScore + complexityScore) / 3
        };
    }
    /**
     * Execute Rust-specific command
     */
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
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    async findRustFiles(patterns) {
        const files = [];
        for (const pattern of patterns) {
            try {
                const { stdout } = await execAsync(`find . -name "*.rs" -type f`, {
                    cwd: this.rootPath
                });
                files.push(...stdout.split('\n').filter(f => f.trim() && f.endsWith('.rs')));
            }
            catch { // eslint-disable-line no-empty
                // Pattern not found, continue
            }
        }
        return Array.from(new Set(files)); // Remove duplicates
    }
    async parseDependencies() {
        const deps = {};
        const cargoTomlPath = join(this.rootPath, 'Cargo.toml');
        if (!existsSync(cargoTomlPath)) {
            return deps;
        }
        const content = readFileSync(cargoTomlPath, 'utf8');
        // Parse [dependencies] section
        const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
        if (depsMatch) {
            const depsBlock = depsMatch[1];
            const lines = depsBlock.split('\n');
            for (const line of lines) {
                const match = line.trim().match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
                if (match) {
                    deps[match[1]] = match[2];
                }
                else {
                    // Handle object-style dependencies
                    const objMatch = line.trim().match(/^([a-zA-Z0-9_-]+)\s*=\s*\{/);
                    if (objMatch) {
                        deps[objMatch[1]] = 'latest';
                    }
                }
            }
        }
        return deps;
    }
    async parseDependencyNames() {
        const deps = await this.parseDependencies();
        return Object.keys(deps);
    }
}
//# sourceMappingURL=rust-adapter.js.map