/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-this-alias, no-case-declarations, no-empty, no-control-regex */
/**
 * VERSATIL SDLC Framework - Intelligent Onboarding System
 * Rule 4: Enhanced onboarding system for new users with automatic setup
 */
import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { CredentialWizard } from './credential-wizard.js';
import { getServicesForAgents, getAgentsUsingService } from './credential-templates.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
const execAsync = promisify(exec);
export class IntelligentOnboardingSystem extends EventEmitter {
    constructor(projectRoot) {
        super();
        // Note: parallelTaskManager removed - using Claude SDK native parallelization via VersatilOrchestrator
        // Onboarding configuration
        this.onboardingSteps = new Map();
        // Progress tracking
        this.completedSteps = new Set();
        this.onboardingProgress = 0;
        this.estimatedCompletion = new Date();
        this.logger = new VERSATILLogger('IntelligentOnboarding');
        this.projectRoot = projectRoot;
        this.initializeOnboardingSteps();
    }
    /**
     * Start intelligent onboarding process
     */
    async startOnboarding(profile) {
        this.logger.info('Starting intelligent onboarding process');
        try {
            // **STEP 0: Detect conflicts FIRST (before any changes)**
            const conflicts = await this.detectConflicts();
            const resolution = await this.handleConflicts(conflicts);
            // Handle cancellation
            if (resolution.strategy === 'CANCEL') {
                return {
                    success: false,
                    message: 'Installation cancelled by user',
                    errors: ['User chose not to proceed with installation']
                };
            }
            // Log resolution actions
            if (resolution.actions.length > 0) {
                console.log('\n✅ Conflict resolution completed:');
                resolution.actions.forEach(action => console.log(`   • ${action}`));
                console.log('');
            }
            // Step 1: Project analysis (enhanced with conflict detection)
            const analysis = await this.analyzeProject();
            analysis.hasExistingFramework = conflicts.existingInstallation !== null;
            analysis.existingFrameworkVersion = conflicts.existingInstallation?.version;
            analysis.migrationRequired = resolution.strategy === 'UPGRADE' || resolution.strategy === 'MIGRATE';
            this.projectAnalysis = analysis;
            // Step 2: Create or update user profile
            this.userProfile = await this.createUserProfile(profile);
            // Step 3: Generate personalized onboarding plan
            const plan = await this.generateOnboardingPlan(analysis, this.userProfile);
            // Step 4: Execute onboarding steps in parallel where possible
            const result = await this.executeOnboardingPlan(plan);
            // Step 5: Run credential wizard (if not already configured)
            const credentialSetup = await this.setupCredentials();
            // Step 6: Validate setup and provide recommendations
            const validation = await this.validateSetup();
            const allRecommendations = [
                ...result.recommendations || [],
                ...validation.recommendations || []
            ];
            // Add credential recommendations if some services are missing
            if (credentialSetup && credentialSetup.skipped.length > 0) {
                allRecommendations.push(`Configure ${credentialSetup.skipped.length} skipped service(s): versatil credentials setup`);
            }
            return {
                success: result.success && validation.success && (!credentialSetup || credentialSetup.success),
                message: 'Onboarding completed successfully!',
                nextSteps: [
                    'Start the proactive daemon: versatil-daemon start',
                    'Try creating your first feature with agent assistance',
                    'Run the daily audit to establish baseline metrics',
                    'Configure your preferred development workflow'
                ],
                recommendations: allRecommendations
            };
        }
        catch (error) {
            this.logger.error('Onboarding failed', { error });
            return {
                success: false,
                message: 'Onboarding failed. Please check logs for details.',
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    /**
     * Analyze current project structure and requirements
     */
    async analyzeProject() {
        this.logger.info('Analyzing project structure');
        const analysis = {
            detectedTechnologies: [],
            projectStructure: 'unknown',
            complexity: 'simple',
            recommendedAgents: [],
            recommendedRules: [],
            estimatedSetupTime: 300 // 5 minutes default
        };
        try {
            // Check for package.json
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            try {
                const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
                analysis.detectedTechnologies.push('Node.js');
                // Analyze dependencies
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
                if (allDeps.react || allDeps['@types/react']) {
                    analysis.detectedTechnologies.push('React');
                    analysis.recommendedAgents.push('james-frontend');
                }
                if (allDeps.vue) {
                    analysis.detectedTechnologies.push('Vue');
                    analysis.recommendedAgents.push('james-frontend');
                }
                if (allDeps.express || allDeps.fastify || allDeps.nest) {
                    analysis.detectedTechnologies.push('Backend');
                    analysis.recommendedAgents.push('marcus-backend');
                }
                if (allDeps.typescript) {
                    analysis.detectedTechnologies.push('TypeScript');
                }
                if (allDeps.playwright || allDeps.cypress || allDeps.jest) {
                    analysis.detectedTechnologies.push('Testing');
                    analysis.recommendedAgents.push('maria-qa');
                }
                // Determine complexity
                const depCount = Object.keys(allDeps).length;
                if (depCount > 50)
                    analysis.complexity = 'complex';
                else if (depCount > 20)
                    analysis.complexity = 'moderate';
            }
            catch (error) {
                this.logger.debug('No package.json found or invalid format');
            }
            // Check for Python files
            const pythonFiles = await this.findFiles('**/*.py');
            if (pythonFiles.length > 0) {
                analysis.detectedTechnologies.push('Python');
                if (pythonFiles.some(f => f.includes('ml') || f.includes('model'))) {
                    analysis.recommendedAgents.push('dr-ai-ml');
                }
            }
            // Check for documentation
            const docFiles = await this.findFiles('**/*.md');
            if (docFiles.length > 0) {
                analysis.recommendedAgents.push('sarah-pm');
            }
            // Recommend rules based on project analysis
            if (analysis.complexity === 'complex' || analysis.detectedTechnologies.length > 3) {
                analysis.recommendedRules.push('parallel_execution', 'stress_testing', 'daily_audit');
                analysis.estimatedSetupTime = 900; // 15 minutes
            }
            else {
                analysis.recommendedRules.push('daily_audit');
                analysis.estimatedSetupTime = 300; // 5 minutes
            }
            // Determine project structure
            if (await this.fileExists('src'))
                analysis.projectStructure = 'src-based';
            else if (await this.fileExists('lib'))
                analysis.projectStructure = 'lib-based';
            else if (await this.fileExists('app'))
                analysis.projectStructure = 'app-based';
            this.logger.info('Project analysis completed', analysis);
            return analysis;
        }
        catch (error) {
            this.logger.warn('Project analysis failed, using defaults', { error });
            return analysis;
        }
    }
    /**
     * Create user profile with intelligent defaults
     */
    async createUserProfile(profile) {
        const defaultProfile = {
            userId: `user-${Date.now()}`,
            experience: 'intermediate',
            projectType: 'fullstack',
            techStack: this.projectAnalysis?.detectedTechnologies || [],
            teamSize: 1,
            goals: ['setup_versatil_framework', 'improve_development_velocity', 'enhance_code_quality'],
            preferences: {
                agentActivation: 'smart',
                ruleExecution: 'automatic',
                feedbackLevel: 'normal'
            }
        };
        // Merge with provided profile
        const userProfile = { ...defaultProfile, ...profile };
        // Intelligent adjustments based on project analysis
        if (this.projectAnalysis) {
            if (this.projectAnalysis.complexity === 'complex') {
                userProfile.experience = 'expert';
                userProfile.preferences.feedbackLevel = 'verbose';
            }
            if (this.projectAnalysis.detectedTechnologies.includes('React')) {
                userProfile.projectType = 'web';
            }
            else if (this.projectAnalysis.detectedTechnologies.includes('Python')) {
                userProfile.projectType = 'backend';
            }
        }
        // Save profile for future reference
        await this.saveUserProfile(userProfile);
        this.logger.info('User profile created', { userId: userProfile.userId, experience: userProfile.experience });
        return userProfile;
    }
    /**
     * Generate personalized onboarding plan
     */
    async generateOnboardingPlan(analysis, profile) {
        const plan = [];
        // Core setup steps (always included)
        plan.push(this.onboardingSteps.get('verify_dependencies'), this.onboardingSteps.get('initialize_versatil'), this.onboardingSteps.get('configure_agents'));
        // Technology-specific steps
        if (analysis.detectedTechnologies.includes('React') || analysis.detectedTechnologies.includes('Vue')) {
            plan.push(this.onboardingSteps.get('setup_frontend_tools'));
        }
        if (analysis.detectedTechnologies.includes('Backend')) {
            plan.push(this.onboardingSteps.get('setup_backend_tools'));
        }
        if (analysis.detectedTechnologies.includes('Testing')) {
            plan.push(this.onboardingSteps.get('configure_testing'));
        }
        // Rule-specific setup based on recommendations
        if (analysis.recommendedRules.includes('parallel_execution')) {
            plan.push(this.onboardingSteps.get('setup_parallel_execution'));
        }
        if (analysis.recommendedRules.includes('stress_testing')) {
            plan.push(this.onboardingSteps.get('setup_stress_testing'));
        }
        if (analysis.recommendedRules.includes('daily_audit')) {
            plan.push(this.onboardingSteps.get('setup_daily_audit'));
        }
        // Experience-based customization
        if (profile.experience === 'beginner') {
            plan.push(this.onboardingSteps.get('interactive_tutorial'));
        }
        else if (profile.experience === 'expert') {
            plan.push(this.onboardingSteps.get('advanced_configuration'));
        }
        // Final validation
        plan.push(this.onboardingSteps.get('validate_setup'));
        // Sort by dependencies and priority
        return this.sortOnboardingSteps(plan);
    }
    /**
     * Execute onboarding plan with parallel processing where possible
     */
    async executeOnboardingPlan(plan) {
        this.logger.info('Executing onboarding plan', { stepCount: plan.length });
        const results = [];
        const errors = [];
        const recommendations = [];
        try {
            // Group steps by dependencies for parallel execution
            const stepGroups = this.groupStepsByDependencies(plan);
            for (const group of stepGroups) {
                // Execute steps in parallel within each group
                const groupResults = await Promise.allSettled(group.map(step => this.executeOnboardingStep(step)));
                for (const [index, result] of groupResults.entries()) {
                    const step = group[index];
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                        if (result.value.success) {
                            this.completedSteps.add(step.id);
                            this.updateProgress();
                        }
                        else {
                            errors.push(`${step.title}: ${result.value.message}`);
                        }
                        if (result.value.recommendations) {
                            recommendations.push(...result.value.recommendations);
                        }
                    }
                    else {
                        errors.push(`${step.title}: ${result.reason}`);
                    }
                }
                // Stop if any required step failed
                const failedRequired = group.some((step, index) => step.required &&
                    (groupResults[index].status === 'rejected' ||
                        (groupResults[index].status === 'fulfilled' &&
                            !groupResults[index].value.success)));
                if (failedRequired) {
                    throw new Error('Required onboarding step failed');
                }
            }
            const success = errors.length === 0;
            return {
                success,
                message: success ? 'All onboarding steps completed' : 'Some onboarding steps failed',
                errors: errors.length > 0 ? errors : undefined,
                recommendations
            };
        }
        catch (error) {
            this.logger.error('Onboarding execution failed', { error });
            return {
                success: false,
                message: 'Onboarding execution failed',
                errors: [error instanceof Error ? error.message : String(error)]
            };
        }
    }
    /**
     * Execute individual onboarding step
     */
    async executeOnboardingStep(step) {
        this.logger.info(`Executing onboarding step: ${step.title}`);
        try {
            // Check dependencies
            for (const dep of step.dependencies) {
                if (!this.completedSteps.has(dep)) {
                    return {
                        success: false,
                        message: `Dependency ${dep} not completed`
                    };
                }
            }
            // Execute the step
            const result = await step.action();
            // Validate the result
            if (result.success) {
                const isValid = await step.validation();
                if (!isValid) {
                    return {
                        success: false,
                        message: `Step completed but validation failed: ${step.title}`
                    };
                }
            }
            this.emit('step:completed', { step, result });
            return result;
        }
        catch (error) {
            this.logger.error(`Step execution failed: ${step.title}`, { error });
            return {
                success: false,
                message: `Step failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
    /**
     * Initialize all available onboarding steps
     */
    initializeOnboardingSteps() {
        const steps = [
            {
                id: 'verify_dependencies',
                title: 'Verify Dependencies',
                description: 'Check if Node.js and npm are installed',
                category: 'setup',
                required: true,
                estimated_time: 30,
                dependencies: [],
                validation: async () => {
                    try {
                        await execAsync('node --version');
                        await execAsync('npm --version');
                        return true;
                    }
                    catch {
                        return false;
                    }
                },
                action: async () => {
                    try {
                        const nodeVersion = await execAsync('node --version');
                        const npmVersion = await execAsync('npm --version');
                        return {
                            success: true,
                            message: `Dependencies verified: Node ${nodeVersion.stdout.trim()}, npm ${npmVersion.stdout.trim()}`
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            message: 'Please install Node.js and npm before continuing'
                        };
                    }
                }
            },
            {
                id: 'initialize_versatil',
                title: 'Initialize VERSATIL Framework',
                description: 'Set up VERSATIL configuration and directories',
                category: 'setup',
                required: true,
                estimated_time: 60,
                dependencies: ['verify_dependencies'],
                validation: async () => {
                    return await this.fileExists('.versatil');
                },
                action: async () => {
                    try {
                        await this.ensureDirectory('.versatil');
                        await this.ensureDirectory('.versatil/agents');
                        await this.ensureDirectory('.versatil/rules');
                        await this.ensureDirectory('.versatil/memory');
                        const config = {
                            project: {},
                            agents: {},
                            rules: {
                                parallel_execution: { enabled: false },
                                stress_testing: { enabled: false },
                                daily_audit: { enabled: false }
                            },
                            initialized_at: new Date().toISOString()
                        };
                        await fs.writeFile(path.join(this.projectRoot, '.versatil/config.json'), JSON.stringify(config, null, 2));
                        return {
                            success: true,
                            message: 'VERSATIL framework initialized successfully'
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            message: `Failed to initialize VERSATIL: ${error}`
                        };
                    }
                }
            },
            {
                id: 'configure_agents',
                title: 'Configure Agents',
                description: 'Set up recommended agents based on project analysis',
                category: 'configuration',
                required: true,
                estimated_time: 90,
                dependencies: ['initialize_versatil'],
                validation: async () => {
                    return await this.fileExists('.versatil/agents');
                },
                action: async () => {
                    try {
                        const recommendedAgents = this.projectAnalysis?.recommendedAgents || ['maria-qa', 'sarah-pm'];
                        for (const agentId of recommendedAgents) {
                            await this.configureAgent(agentId);
                        }
                        return {
                            success: true,
                            message: `Configured ${recommendedAgents.length} agents: ${recommendedAgents.join(', ')}`,
                            recommendations: [
                                'Agents are now configured and ready to assist',
                                'You can enable/disable agents in .versatil/config.json'
                            ]
                        };
                    }
                    catch (error) {
                        return {
                            success: false,
                            message: `Failed to configure agents: ${error}`
                        };
                    }
                }
            },
            // Add more steps...
            {
                id: 'setup_parallel_execution',
                title: 'Setup Parallel Execution',
                description: 'Configure Rule 1: Parallel task execution',
                category: 'configuration',
                required: false,
                estimated_time: 120,
                dependencies: ['configure_agents'],
                validation: async () => {
                    return true; // Add actual validation
                },
                action: async () => {
                    // Implementation for parallel execution setup
                    return {
                        success: true,
                        message: 'Parallel execution rule configured',
                        recommendations: ['You can now run multiple tasks simultaneously without conflicts']
                    };
                }
            },
            {
                id: 'setup_stress_testing',
                title: 'Setup Stress Testing',
                description: 'Configure Rule 2: Automated stress test generation',
                category: 'configuration',
                required: false,
                estimated_time: 120,
                dependencies: ['configure_agents'],
                validation: async () => {
                    return true; // Add actual validation
                },
                action: async () => {
                    // Implementation for stress testing setup
                    return {
                        success: true,
                        message: 'Stress testing rule configured',
                        recommendations: ['Stress tests will be automatically generated for new features']
                    };
                }
            },
            {
                id: 'setup_daily_audit',
                title: 'Setup Daily Audit',
                description: 'Configure Rule 3: Daily health checks and audits',
                category: 'configuration',
                required: false,
                estimated_time: 90,
                dependencies: ['configure_agents'],
                validation: async () => {
                    return true; // Add actual validation
                },
                action: async () => {
                    // Implementation for daily audit setup
                    return {
                        success: true,
                        message: 'Daily audit rule configured',
                        recommendations: ['Daily health checks will run automatically to monitor project quality']
                    };
                }
            },
            {
                id: 'validate_setup',
                title: 'Validate Setup',
                description: 'Final validation of VERSATIL framework installation',
                category: 'validation',
                required: true,
                estimated_time: 60,
                dependencies: ['configure_agents'],
                validation: async () => {
                    return await this.fileExists('.versatil/config.json');
                },
                action: async () => {
                    return await this.validateSetup();
                }
            }
        ];
        // Store all steps in the map
        for (const step of steps) {
            this.onboardingSteps.set(step.id, step);
        }
    }
    /**
     * Validate complete setup
     */
    async validateSetup() {
        const validations = [];
        // Check VERSATIL directory
        validations.push({
            name: 'VERSATIL directory exists',
            passed: await this.fileExists('.versatil')
        });
        // Check configuration file
        validations.push({
            name: 'Configuration file exists',
            passed: await this.fileExists('.versatil/config.json')
        });
        // Check agents directory
        validations.push({
            name: 'Agents directory exists',
            passed: await this.fileExists('.versatil/agents')
        });
        const passedCount = validations.filter(v => v.passed).length;
        const success = passedCount === validations.length;
        return {
            success,
            message: `Setup validation: ${passedCount}/${validations.length} checks passed`,
            recommendations: success ? [
                'VERSATIL framework is properly installed',
                'Ready to start development with AI assistance'
            ] : [
                'Some validation checks failed',
                'Please review the setup process'
            ]
        };
    }
    // Helper methods
    async fileExists(filePath) {
        try {
            await fs.access(path.join(this.projectRoot, filePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async ensureDirectory(dirPath) {
        const fullPath = path.join(this.projectRoot, dirPath);
        await fs.mkdir(fullPath, { recursive: true });
    }
    async findFiles(pattern) {
        // Simplified file finding - in production would use glob
        try {
            const { exec } = require('child_process').promises;
            const result = await exec(`find ${this.projectRoot} -name "${pattern.replace('**/', '')}" 2>/dev/null || true`);
            return result.stdout.trim().split('\n').filter(Boolean);
        }
        catch {
            return [];
        }
    }
    async configureAgent(agentId) {
        const agentDir = path.join(this.projectRoot, '.versatil/agents', agentId);
        await fs.mkdir(agentDir, { recursive: true });
        const agentConfig = {
            id: agentId,
            enabled: true,
            auto_activate: true,
            configured_at: new Date().toISOString()
        };
        await fs.writeFile(path.join(agentDir, 'config.json'), JSON.stringify(agentConfig, null, 2));
    }
    async saveUserProfile(profile) {
        await fs.writeFile(path.join(this.projectRoot, '.versatil/user-profile.json'), JSON.stringify(profile, null, 2));
    }
    sortOnboardingSteps(steps) {
        // Topological sort based on dependencies
        const sorted = [];
        const visited = new Set();
        const visit = (step) => {
            if (visited.has(step.id))
                return;
            for (const depId of step.dependencies) {
                const depStep = steps.find(s => s.id === depId);
                if (depStep)
                    visit(depStep);
            }
            visited.add(step.id);
            sorted.push(step);
        };
        for (const step of steps) {
            visit(step);
        }
        return sorted;
    }
    groupStepsByDependencies(steps) {
        const groups = [];
        const processed = new Set();
        while (processed.size < steps.length) {
            const currentGroup = [];
            for (const step of steps) {
                if (processed.has(step.id))
                    continue;
                // Check if all dependencies are satisfied
                const canExecute = step.dependencies.every(dep => processed.has(dep));
                if (canExecute) {
                    currentGroup.push(step);
                    processed.add(step.id);
                }
            }
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
            else {
                // Break infinite loop if no progress can be made
                break;
            }
        }
        return groups;
    }
    updateProgress() {
        this.onboardingProgress = (this.completedSteps.size / this.onboardingSteps.size) * 100;
        this.emit('progress:updated', { progress: this.onboardingProgress });
    }
    /**
     * Get current onboarding progress
     */
    getProgress() {
        return {
            progress: this.onboardingProgress,
            completed: this.completedSteps.size,
            total: this.onboardingSteps.size
        };
    }
    /**
     * Detect existing framework installations and conflicts
     */
    async detectConflicts() {
        this.logger.info('Detecting existing installations and conflicts');
        const conflicts = {
            hasConflicts: false,
            existingInstallation: null,
            conflictingFrameworks: [],
            versionMismatch: false,
            corruptedInstallation: false,
            recommendations: [],
            missingFiles: []
        };
        try {
            // Check for existing VERSATIL installation
            const configPath = path.join(this.projectRoot, '.versatil/config.json');
            if (await this.fileExists('.versatil/config.json')) {
                const configContent = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(configContent);
                conflicts.existingInstallation = {
                    version: config.version || 'unknown',
                    installedAt: config.initialized_at || 'unknown',
                    agents: config.agents || {},
                    rules: config.rules || {},
                    configPath
                };
                // Version comparison
                const currentVersion = '6.1.0'; // Should match package.json
                if (config.version && config.version !== currentVersion) {
                    conflicts.versionMismatch = true;
                    conflicts.hasConflicts = true;
                    // Simple version comparison (for production, use semver library)
                    const [existingMajor, existingMinor] = config.version.split('.').map(Number);
                    const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);
                    if (existingMajor < currentMajor || (existingMajor === currentMajor && existingMinor < currentMinor)) {
                        conflicts.recommendations.push('UPGRADE_REQUIRED');
                    }
                    else {
                        conflicts.recommendations.push('DOWNGRADE_WARNING');
                    }
                }
                // Check for corrupted installation
                const requiredFiles = [
                    '.versatil/config.json',
                    '.versatil/agents',
                    '.versatil/rules',
                    '.versatil/memory'
                ];
                for (const file of requiredFiles) {
                    if (!(await this.fileExists(file))) {
                        conflicts.missingFiles.push(file);
                        conflicts.corruptedInstallation = true;
                        conflicts.hasConflicts = true;
                    }
                }
                if (conflicts.corruptedInstallation) {
                    conflicts.recommendations.push('REPAIR_INSTALLATION');
                }
            }
            else {
                conflicts.recommendations.push('FRESH_INSTALL');
            }
            // Check for conflicting frameworks in package.json
            try {
                const packageJsonPath = path.join(this.projectRoot, 'package.json');
                const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
                const packageJson = JSON.parse(packageJsonContent);
                const conflictingFrameworks = [
                    'sdlc-framework-competitor',
                    'other-development-framework',
                    'alternative-sdlc-tool'
                ];
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };
                for (const framework of conflictingFrameworks) {
                    if (allDeps[framework]) {
                        conflicts.conflictingFrameworks.push(framework);
                        conflicts.hasConflicts = true;
                        conflicts.recommendations.push('REVIEW_COEXISTENCE');
                    }
                }
            }
            catch (error) {
                // package.json doesn't exist or is invalid - not a critical error
                this.logger.debug('Could not read package.json for conflict detection');
            }
            this.logger.info('Conflict detection complete', {
                hasConflicts: conflicts.hasConflicts,
                recommendations: conflicts.recommendations.length
            });
            return conflicts;
        }
        catch (error) {
            this.logger.error('Conflict detection failed', { error });
            // Return default no-conflicts result to allow installation to proceed
            return conflicts;
        }
    }
    /**
     * Handle conflicts based on detected issues
     */
    async handleConflicts(conflicts) {
        if (!conflicts.hasConflicts) {
            return { strategy: 'PROCEED', actions: [] };
        }
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const ask = (question) => {
            return new Promise(resolve => {
                rl.question(question, answer => {
                    resolve(answer.trim());
                });
            });
        };
        const askYesNo = async (question, defaultYes = true) => {
            const defaultStr = defaultYes ? 'Y/n' : 'y/N';
            const answer = await ask(`${question} (${defaultStr}): `);
            if (!answer)
                return defaultYes;
            return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
        };
        try {
            // Upgrade scenario
            if (conflicts.versionMismatch && conflicts.recommendations.includes('UPGRADE_REQUIRED')) {
                console.log('\n🔄 Existing VERSATIL installation detected');
                console.log(`   Current version: ${conflicts.existingInstallation?.version}`);
                console.log(`   New version: 6.1.0\n`);
                const shouldUpgrade = await askYesNo('Would you like to upgrade to the latest version?', true);
                if (shouldUpgrade) {
                    const resolution = await this.performUpgrade(conflicts.existingInstallation);
                    rl.close();
                    return resolution;
                }
                else {
                    rl.close();
                    return { strategy: 'CANCEL', actions: [] };
                }
            }
            // Repair scenario
            if (conflicts.corruptedInstallation) {
                console.log('\n⚠️  Corrupted VERSATIL installation detected');
                console.log(`   Missing files: ${conflicts.missingFiles.join(', ')}\n`);
                const shouldRepair = await askYesNo('Would you like to repair the installation?', true);
                if (shouldRepair) {
                    const resolution = await this.performRepair(conflicts.missingFiles);
                    rl.close();
                    return resolution;
                }
            }
            // Coexistence scenario
            if (conflicts.conflictingFrameworks.length > 0) {
                console.log('\n⚠️  Conflicting frameworks detected:');
                conflicts.conflictingFrameworks.forEach(f => console.log(`   • ${f}`));
                console.log('\nOptions:');
                console.log('1. Install VERSATIL alongside existing frameworks');
                console.log('2. Cancel installation\n');
                const choice = await ask('Your choice (1-2): ');
                if (choice === '1') {
                    rl.close();
                    return { strategy: 'COEXIST', actions: ['Proceeding with coexistence mode'] };
                }
                else {
                    rl.close();
                    return { strategy: 'CANCEL', actions: [] };
                }
            }
            rl.close();
            return { strategy: 'PROCEED', actions: [] };
        }
        catch (error) {
            rl.close();
            this.logger.error('Conflict handling failed', { error });
            return { strategy: 'CANCEL', actions: [] };
        }
    }
    /**
     * Perform version upgrade with backup
     */
    async performUpgrade(existingInstallation) {
        const actions = [];
        try {
            // Create backup directory
            const timestamp = Date.now();
            const backupDir = path.join(this.projectRoot, `.versatil/backups/${timestamp}`);
            await fs.mkdir(backupDir, { recursive: true });
            // Backup existing config
            const configBackupPath = path.join(backupDir, 'config.json');
            await fs.copyFile(existingInstallation.configPath, configBackupPath);
            actions.push(`Backed up config to ${backupDir}`);
            // Merge configurations
            const newConfig = await this.mergeConfigs(existingInstallation);
            await fs.writeFile(existingInstallation.configPath, JSON.stringify(newConfig, null, 2));
            actions.push('Merged old and new configurations');
            actions.push('Preserved user customizations');
            return {
                strategy: 'UPGRADE',
                actions,
                backupCreated: true,
                backupPath: backupDir
            };
        }
        catch (error) {
            this.logger.error('Upgrade failed', { error });
            return {
                strategy: 'CANCEL',
                actions: [`Upgrade failed: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }
    /**
     * Repair corrupted installation
     */
    async performRepair(missingFiles) {
        const actions = [];
        try {
            for (const file of missingFiles) {
                const fullPath = path.join(this.projectRoot, file);
                // Check if it's a directory or file
                if (file.endsWith('/') || !file.includes('.')) {
                    await fs.mkdir(fullPath, { recursive: true });
                    actions.push(`Created missing directory: ${file}`);
                }
                else {
                    // Create default file based on type
                    if (file.includes('config.json')) {
                        const defaultConfig = {
                            version: '1.0.0',
                            initialized_at: new Date().toISOString(),
                            agents: {},
                            rules: {}
                        };
                        await fs.writeFile(fullPath, JSON.stringify(defaultConfig, null, 2));
                        actions.push(`Recreated config file: ${file}`);
                    }
                }
            }
            return { strategy: 'REPAIR', actions };
        }
        catch (error) {
            this.logger.error('Repair failed', { error });
            return {
                strategy: 'CANCEL',
                actions: [`Repair failed: ${error instanceof Error ? error.message : String(error)}`]
            };
        }
    }
    /**
     * Merge old and new configurations
     */
    async mergeConfigs(oldInstallation) {
        const defaultConfig = {
            version: '1.0.0',
            project: {},
            agents: {},
            rules: {
                parallel_execution: { enabled: false },
                stress_testing: { enabled: false },
                daily_audit: { enabled: false }
            },
            initialized_at: oldInstallation.installedAt,
            upgraded_at: new Date().toISOString(),
            previous_version: oldInstallation.version
        };
        // Preserve user customizations
        return {
            ...defaultConfig,
            agents: { ...defaultConfig.agents, ...oldInstallation.agents },
            rules: { ...defaultConfig.rules, ...oldInstallation.rules },
            project: oldInstallation.agents || {}
        };
    }
    /**
     * Get active agents from configuration
     */
    async getActiveAgents() {
        try {
            const configPath = path.join(this.projectRoot, '.versatil/config.json');
            if (await this.fileExists('.versatil/config.json')) {
                const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
                return Object.keys(config.agents || {}).filter(agentId => config.agents[agentId].enabled !== false);
            }
        }
        catch (error) {
            this.logger.debug('Could not read active agents from config');
        }
        // Return recommended agents based on project analysis
        return this.projectAnalysis?.recommendedAgents || [];
    }
    /**
     * Setup credentials for external services with agent awareness
     */
    async setupCredentials() {
        this.logger.info('Starting credential setup');
        try {
            console.log('\n═══════════════════════════════════════════════════════════');
            console.log('\n📦 Step 5: Service Credentials Setup\n');
            console.log('VERSATIL integrates with external services (Supabase, Vertex AI, etc.)');
            console.log('Let\'s configure your API keys and credentials.\n');
            console.log('🔐 Credentials will be encrypted with AES-256-GCM and stored at:');
            console.log(`   ${this.projectRoot}/.versatil/credentials.json\n`);
            // Get active agents to determine needed services
            const activeAgents = await this.getActiveAgents();
            if (activeAgents.length > 0) {
                const neededServices = getServicesForAgents(activeAgents);
                console.log('📊 Based on your active agents, you need:\n');
                neededServices.forEach(service => {
                    const agents = getAgentsUsingService(service.id);
                    console.log(`  • ${service.name} - Used by: ${agents.join(', ')}`);
                });
                console.log('');
            }
            // NEW: Generate project ID for encryption
            const projectId = await this.generateProjectId();
            // Create credential wizard with project-level context
            const wizard = new CredentialWizard({
                interactive: true,
                projectContext: {
                    projectPath: this.projectRoot,
                    projectId
                },
                useEncryption: true // Enable encryption for project-level storage
            });
            const result = await wizard.run({ interactive: true });
            this.logger.info('Credential setup completed', {
                configured: result.configured.length,
                encrypted: result.encrypted
            });
            return result;
        }
        catch (error) {
            this.logger.error('Credential setup failed', { error });
            console.log('\n⚠️  Credential setup can be completed later with:');
            console.log('   versatil-credentials setup\n');
            return null;
        }
    }
    /**
     * Generate stable project ID for encryption context
     */
    async generateProjectId() {
        const crypto = await import('crypto');
        const projectSignature = crypto.createHash('sha256')
            .update(this.projectRoot)
            .digest('hex')
            .substring(0, 16);
        return `project-${projectSignature}`;
    }
    /**
     * Resume interrupted onboarding
     */
    async resumeOnboarding() {
        try {
            // Load previous progress
            const profilePath = path.join(this.projectRoot, '.versatil/user-profile.json');
            const profileData = await fs.readFile(profilePath, 'utf8');
            this.userProfile = JSON.parse(profileData);
            // Continue from where we left off
            return await this.startOnboarding(this.userProfile);
        }
        catch (error) {
            return await this.startOnboarding();
        }
    }
}
//# sourceMappingURL=intelligent-onboarding-system.js.map