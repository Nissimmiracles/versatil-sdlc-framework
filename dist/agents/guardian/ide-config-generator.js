/**
 * VERSATIL SDLC Framework - IDE Configuration Generator
 *
 * Generates optimal IDE configuration files to prevent crashes:
 * - .cursorignore (Cursor IDE ignore patterns)
 * - .vscode/settings.json (VSCode performance optimizations)
 * - .idea/.gitignore (JetBrains ignore patterns)
 *
 * Uses template-based generation with project-specific customization
 *
 * Part of Guardian's proactive IDE optimization system (v7.15.0+)
 *
 * @version 7.15.0
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * IDE Configuration Generator
 * Creates optimal ignore files and settings for IDE performance
 */
export class IDEConfigGenerator {
    constructor(projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
    }
    /**
     * Generate optimal IDE configurations
     * Creates .cursorignore, .vscode/settings.json, etc.
     */
    async generateOptimalConfigs(ideType, largeDirectories = []) {
        const startTime = Date.now();
        const filesCreated = [];
        const filesUpdated = [];
        const errors = [];
        try {
            // Detect project type for customization
            const projectInfo = this.detectProjectType();
            // Generate .cursorignore (for Cursor and VSCode)
            if (ideType === 'cursor' || ideType === 'vscode' || ideType === 'unknown') {
                const cursorIgnoreResult = await this.generateCursorIgnore(projectInfo, largeDirectories);
                if (cursorIgnoreResult.success) {
                    filesCreated.push('.cursorignore');
                }
                else if (cursorIgnoreResult.error) {
                    errors.push(cursorIgnoreResult.error);
                }
                // Generate .vscode/settings.json
                const vscodeSettingsResult = await this.generateVSCodeSettings(projectInfo, largeDirectories);
                if (vscodeSettingsResult.success) {
                    if (vscodeSettingsResult.updated) {
                        filesUpdated.push('.vscode/settings.json');
                    }
                    else {
                        filesCreated.push('.vscode/settings.json');
                    }
                }
                else if (vscodeSettingsResult.error) {
                    errors.push(vscodeSettingsResult.error);
                }
            }
            // Generate .idea/.gitignore (for JetBrains)
            if (ideType === 'jetbrains') {
                const ideaIgnoreResult = await this.generateIdeaGitignore(projectInfo);
                if (ideaIgnoreResult.success) {
                    filesCreated.push('.idea/.gitignore');
                }
                else if (ideaIgnoreResult.error) {
                    errors.push(ideaIgnoreResult.error);
                }
            }
            return {
                success: errors.length === 0,
                files_created: filesCreated,
                files_updated: filesUpdated,
                errors,
                duration_ms: Date.now() - startTime
            };
        }
        catch (error) {
            return {
                success: false,
                files_created: filesCreated,
                files_updated: filesUpdated,
                errors: [`Unexpected error: ${error.message}`],
                duration_ms: Date.now() - startTime
            };
        }
    }
    /**
     * Detect project type from file structure
     */
    detectProjectType() {
        const technologies = [];
        const packageManagers = [];
        // Check for Node.js
        if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
            technologies.push('node');
            if (fs.existsSync(path.join(this.projectRoot, 'package-lock.json'))) {
                packageManagers.push('npm');
            }
            if (fs.existsSync(path.join(this.projectRoot, 'yarn.lock'))) {
                packageManagers.push('yarn');
            }
            if (fs.existsSync(path.join(this.projectRoot, 'pnpm-lock.yaml'))) {
                packageManagers.push('pnpm');
            }
        }
        // Check for Python
        if (fs.existsSync(path.join(this.projectRoot, 'requirements.txt')) ||
            fs.existsSync(path.join(this.projectRoot, 'pyproject.toml'))) {
            technologies.push('python');
        }
        // Check for Rust
        if (fs.existsSync(path.join(this.projectRoot, 'Cargo.toml'))) {
            technologies.push('rust');
        }
        // Check for Go
        if (fs.existsSync(path.join(this.projectRoot, 'go.mod'))) {
            technologies.push('go');
        }
        // Check for Java
        if (fs.existsSync(path.join(this.projectRoot, 'pom.xml')) ||
            fs.existsSync(path.join(this.projectRoot, 'build.gradle'))) {
            technologies.push('java');
        }
        let type = 'unknown';
        if (technologies.length === 1) {
            type = technologies[0];
        }
        else if (technologies.length > 1) {
            type = 'mixed';
        }
        return { type, technologies, package_managers: packageManagers };
    }
    /**
     * Generate .cursorignore file
     */
    async generateCursorIgnore(projectInfo, largeDirectories) {
        const targetPath = path.join(this.projectRoot, '.cursorignore');
        // Check if file already exists
        if (fs.existsSync(targetPath)) {
            return { success: false, error: '.cursorignore already exists' };
        }
        try {
            const content = this.buildCursorIgnoreContent(projectInfo, largeDirectories);
            fs.writeFileSync(targetPath, content, 'utf-8');
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Failed to create .cursorignore: ${error.message}` };
        }
    }
    /**
     * Build .cursorignore content
     */
    buildCursorIgnoreContent(projectInfo, largeDirectories) {
        const lines = [
            '# Cursor IDE Ignore File',
            '# Auto-generated by VERSATIL Guardian (v7.15.0)',
            '# Prevents indexing of large directories to avoid memory issues and crashes',
            ''
        ];
        // Dependencies
        lines.push('# Dependencies');
        if (projectInfo.technologies.includes('node')) {
            lines.push('node_modules/', '.pnp', '.pnp.js');
        }
        if (projectInfo.technologies.includes('python')) {
            lines.push('__pycache__/', '*.py[cod]', '*$py.class', '.Python', 'env/', 'venv/');
        }
        if (projectInfo.technologies.includes('rust')) {
            lines.push('target/', 'Cargo.lock');
        }
        if (projectInfo.technologies.includes('go')) {
            lines.push('vendor/');
        }
        if (projectInfo.technologies.includes('java')) {
            lines.push('target/', '.gradle/', 'build/');
        }
        lines.push('');
        // Build outputs
        lines.push('# Build outputs');
        lines.push('dist/', 'build/', 'out/', '.next/', '.nuxt/', '.cache/', '.parcel-cache/');
        lines.push('');
        // Testing
        lines.push('# Testing');
        lines.push('coverage/', '.nyc_output/', '*.lcov');
        lines.push('');
        // Logs and telemetry
        lines.push('# Logs and telemetry');
        lines.push('logs/', '*.log');
        lines.push('npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*');
        lines.push('lerna-debug.log*', '.pnpm-debug.log*');
        if (largeDirectories.some(d => d.path.includes('.versatil/logs'))) {
            lines.push('~/.versatil/logs/', '.versatil/logs/');
        }
        lines.push('');
        // Environment and secrets
        lines.push('# Environment and secrets');
        lines.push('.env', '.env.local', '.env.*.local', '*.pem', '*.key');
        lines.push('');
        // OS files
        lines.push('# OS files');
        lines.push('.DS_Store', '.AppleDouble', '.LSOverride', 'Thumbs.db', 'Desktop.ini');
        lines.push('');
        // IDE files
        lines.push('# IDE files (other than Cursor)');
        lines.push('.idea/', '*.swp', '*.swo', '*~');
        lines.push('');
        // Git
        lines.push('# Git');
        lines.push('.git/');
        lines.push('');
        // Temporary files
        lines.push('# Temporary files');
        lines.push('tmp/', 'temp/', '*.tmp');
        lines.push('');
        // Large data files
        lines.push('# Large data files');
        lines.push('*.sqlite', '*.db');
        lines.push('');
        // VERSATIL-specific (if detected)
        if (largeDirectories.some(d => d.path.includes('.versatil'))) {
            lines.push('# VERSATIL Framework');
            lines.push('~/.versatil/rag/', '.versatil/rag/');
            lines.push('~/.versatil/learning/', '.versatil/learning/');
            lines.push('**/guardian-telemetry.log', '**/*telemetry*.log');
            lines.push('.mcp/');
            lines.push('');
        }
        // TypeScript cache
        if (projectInfo.technologies.includes('node')) {
            lines.push('# TypeScript cache');
            lines.push('*.tsbuildinfo');
            lines.push('');
        }
        // Backup files
        lines.push('# Backup files');
        lines.push('*.backup', '*.bak');
        lines.push('');
        return lines.join('\n');
    }
    /**
     * Generate .vscode/settings.json file
     */
    async generateVSCodeSettings(projectInfo, largeDirectories) {
        const vscodeDir = path.join(this.projectRoot, '.vscode');
        const targetPath = path.join(vscodeDir, 'settings.json');
        // Ensure .vscode directory exists
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }
        try {
            let existingSettings = {};
            let isUpdate = false;
            // Read existing settings if file exists
            if (fs.existsSync(targetPath)) {
                const content = fs.readFileSync(targetPath, 'utf-8');
                existingSettings = JSON.parse(content);
                isUpdate = true;
            }
            // Build optimized settings
            const optimizedSettings = this.buildVSCodeSettings(projectInfo, largeDirectories);
            // Merge with existing settings (preserve user customizations)
            const mergedSettings = { ...existingSettings, ...optimizedSettings };
            // Write settings
            fs.writeFileSync(targetPath, JSON.stringify(mergedSettings, null, 2), 'utf-8');
            return { success: true, updated: isUpdate };
        }
        catch (error) {
            return {
                success: false,
                error: `Failed to ${fs.existsSync(targetPath) ? 'update' : 'create'} .vscode/settings.json: ${error.message}`
            };
        }
    }
    /**
     * Build VSCode settings object
     */
    buildVSCodeSettings(projectInfo, largeDirectories) {
        const settings = {
            // File watcher exclusions
            'files.watcherExclude': {
                '**/node_modules/**': true,
                '**/dist/**': true,
                '**/build/**': true,
                '**/coverage/**': true,
                '**/.git/**': true,
                '**/logs/**': true,
                '**/tmp/**': true,
                '**/temp/**': true
            },
            // Search exclusions
            'search.exclude': {
                '**/node_modules': true,
                '**/dist': true,
                '**/build': true,
                '**/coverage': true,
                '**/.git': true,
                '**/logs': true,
                '**/tmp': true,
                '**/temp': true
            },
            // Files exclusions (UI)
            'files.exclude': {
                '**/.git': true,
                '**/.DS_Store': true
            }
        };
        // Add VERSATIL-specific exclusions if detected
        if (largeDirectories.some(d => d.path.includes('.versatil'))) {
            settings['files.watcherExclude']['**/.versatil/logs/**'] = true;
            settings['files.watcherExclude']['**/.versatil/rag/**'] = true;
            settings['files.watcherExclude']['**/.versatil/learning/**'] = true;
            settings['search.exclude']['**/.versatil/logs'] = true;
            settings['search.exclude']['**/.versatil/rag'] = true;
            settings['search.exclude']['**/.versatil/learning'] = true;
        }
        // TypeScript optimizations (if Node.js project)
        if (projectInfo.technologies.includes('node')) {
            settings['typescript.tsserver.maxTsServerMemory'] = 4096;
            settings['typescript.tsserver.log'] = 'off';
            settings['typescript.disableAutomaticTypeAcquisition'] = false;
        }
        // File watching limits
        settings['files.watcherInclude'] = [
            '**/*.ts',
            '**/*.tsx',
            '**/*.js',
            '**/*.jsx',
            '**/*.json',
            '**/*.md'
        ];
        return settings;
    }
    /**
     * Generate .idea/.gitignore file (JetBrains)
     */
    async generateIdeaGitignore(projectInfo) {
        const ideaDir = path.join(this.projectRoot, '.idea');
        const targetPath = path.join(ideaDir, '.gitignore');
        // Check if .idea directory exists
        if (!fs.existsSync(ideaDir)) {
            return { success: false, error: '.idea directory does not exist (JetBrains IDE not detected)' };
        }
        // Check if file already exists
        if (fs.existsSync(targetPath)) {
            return { success: false, error: '.idea/.gitignore already exists' };
        }
        try {
            const content = this.buildIdeaGitignoreContent(projectInfo);
            fs.writeFileSync(targetPath, content, 'utf-8');
            return { success: true };
        }
        catch (error) {
            return { success: false, error: `Failed to create .idea/.gitignore: ${error.message}` };
        }
    }
    /**
     * Build .idea/.gitignore content
     */
    buildIdeaGitignoreContent(projectInfo) {
        const lines = [
            '# JetBrains IDE Ignore File',
            '# Auto-generated by VERSATIL Guardian (v7.15.0)',
            '',
            '# User-specific stuff',
            'workspace.xml',
            'tasks.xml',
            'usage.statistics.xml',
            'dictionaries/',
            'shelf/',
            '',
            '# Generated files',
            '.idea/**/contentModel.xml',
            '',
            '# Sensitive or high-churn files',
            '.idea/**/dataSources/',
            '.idea/**/dataSources.ids',
            '.idea/**/dataSources.local.xml',
            '.idea/**/sqlDataSources.xml',
            '.idea/**/dynamic.xml',
            '.idea/**/uiDesigner.xml',
            '.idea/**/dbnavigator.xml',
            ''
        ];
        return lines.join('\n');
    }
}
//# sourceMappingURL=ide-config-generator.js.map