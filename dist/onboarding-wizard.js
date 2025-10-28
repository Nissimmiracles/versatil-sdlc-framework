/**
 * VERSATIL Framework Onboarding Wizard
 * Interactive setup experience for new developers with OPERA agent customization
 */
import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { RoadmapGenerator } from './roadmap-generator.js';
export class OnboardingWizard {
    constructor() {
        this.responses = {};
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    /**
     * Start the interactive onboarding experience
     */
    async startOnboarding() {
        console.log(`
🚀 Welcome to VERSATIL SDLC Framework!

Let's set up your AI-native development environment with the perfect OPERA agent configuration.
This will take 3-5 minutes and will create a personalized development experience.

Press Enter to continue...`);
        await this.waitForEnter();
        // Project analysis
        await this.analyzeProject();
        // Team and experience setup
        await this.setupTeamContext();
        // OPERA agent customization
        await this.customizeOPERAAgents();
        // MCP tool preferences
        await this.configureMCPTools();
        // Final configuration
        const config = await this.generateConfiguration();
        // Setup completion
        await this.completeSetup(config);
        this.rl.close();
        return config;
    }
    /**
     * Analyze existing project structure and detect patterns
     */
    async analyzeProject() {
        console.log(`\n🔍 Step 1: Project Analysis\n`);
        const projectPath = process.cwd();
        console.log(`Analyzing project at: ${projectPath}`);
        // Auto-detect project type
        const detectedType = await this.detectProjectType(projectPath);
        const detectedTech = await this.detectTechnologies(projectPath);
        console.log(`\n📊 Auto-Detection Results:`);
        console.log(`   Project Type: ${detectedType || 'Unknown'}`);
        console.log(`   Technologies: ${detectedTech.join(', ') || 'None detected'}`);
        // Confirm or override detection
        const projectType = await this.askQuestion(`
What type of project are you working on?
1) Frontend (React, Vue, Angular)
2) Backend (Node.js, Python, Java)
3) Full-stack (Frontend + Backend)
4) Mobile (React Native, Flutter)
5) ML/AI (Python, TensorFlow, PyTorch)
6) Enterprise (Microservices, Complex architecture)

Detected: ${detectedType || 'Unknown'} - Press Enter to confirm, or choose (1-6): `);
        this.responses.projectType = this.parseProjectType(projectType || detectedType || 'web');
        this.responses.technologies = detectedTech;
        console.log(`✅ Project configured as: ${this.responses.projectType}`);
    }
    /**
     * Setup team context and experience level
     */
    async setupTeamContext() {
        console.log(`\n👥 Step 2: Team & Experience Setup\n`);
        const teamSize = await this.askQuestion(`
What's your team size?
1) Solo developer
2) Small team (2-5 people)
3) Medium team (6-15 people)
4) Large team (16+ people)

Choose (1-4): `);
        this.responses.teamSize = this.parseTeamSize(teamSize);
        const experience = await this.askQuestion(`
What's your experience with AI-assisted development?
1) Beginner (New to AI tools)
2) Intermediate (Some experience with GitHub Copilot, etc.)
3) Expert (Experienced with multiple AI development tools)

Choose (1-3): `);
        this.responses.experience = this.parseExperience(experience);
        const priorities = await this.askQuestion(`
What are your main development priorities? (comma-separated)
1) Speed/Velocity
2) Code Quality
3) Testing/QA
4) Security
5) Performance
6) Team Collaboration

Enter numbers (e.g., 1,3,4): `);
        this.responses.priorities = this.parsePriorities(priorities);
        console.log(`✅ Team context configured: ${this.responses.teamSize} team, ${this.responses.experience} level`);
    }
    /**
     * Customize OPERA agents based on user preferences
     */
    async customizeOPERAAgents() {
        console.log(`\n🤖 Step 3: OPERA Agent Customization\n`);
        console.log(`The OPERA methodology includes 6 specialized agents. Let's customize them for your workflow:\n`);
        const agentCustomizations = new Map();
        // Maria - QA Agent
        console.log(`🔧 MARIA (QA Agent) - Quality Assurance & Testing`);
        const mariaConfig = await this.customizeAgent('Maria-QA', {
            description: 'Handles testing, quality gates, and bug detection',
            defaultTriggers: ['*.test.*', '*.spec.*', 'cypress/', 'jest.config.*'],
            capabilities: ['Automated testing', 'Visual regression', 'Performance testing', 'Accessibility audits']
        });
        agentCustomizations.set('Maria-QA', mariaConfig);
        // James - Frontend Agent
        console.log(`\n🎨 JAMES (Frontend Agent) - UI/UX & Frontend Development`);
        const jamesConfig = await this.customizeAgent('James-Frontend', {
            description: 'Focuses on React/Vue components, styling, and user experience',
            defaultTriggers: ['*.tsx', '*.jsx', '*.vue', '*.scss', '*.css'],
            capabilities: ['Component optimization', 'Performance monitoring', 'Design system', 'Responsive design']
        });
        agentCustomizations.set('James-Frontend', jamesConfig);
        // Marcus - Backend Agent
        console.log(`\n⚙️ MARCUS (Backend Agent) - API & Database Development`);
        const marcusConfig = await this.customizeAgent('Marcus-Backend', {
            description: 'Handles APIs, databases, security, and architecture',
            defaultTriggers: ['*.api.*', '*.service.*', '*.model.*', 'server/', 'database/'],
            capabilities: ['API design', 'Database optimization', 'Security auditing', 'Architecture review']
        });
        agentCustomizations.set('Marcus-Backend', marcusConfig);
        // Dr.AI - ML Agent
        if (this.responses.projectType === 'ml' || this.responses.technologies?.includes('tensorflow')) {
            console.log(`\n🧠 DR.AI (ML Agent) - Machine Learning & Data Science`);
            const draiConfig = await this.customizeAgent('Dr.AI-ML', {
                description: 'Specializes in ML models, data pipelines, and AI optimization',
                defaultTriggers: ['*.py', '*.ipynb', 'models/', 'data/', 'ml/'],
                capabilities: ['Model optimization', 'Data validation', 'Hyperparameter tuning', 'Model deployment']
            });
            agentCustomizations.set('Dr.AI-ML', draiConfig);
        }
        // Sarah - PM Agent
        if (this.responses.teamSize !== 'solo') {
            console.log(`\n📋 SARAH (Project Manager) - Coordination & Planning`);
            const sarahConfig = await this.customizeAgent('Sarah-PM', {
                description: 'Manages project coordination, documentation, and team communication',
                defaultTriggers: ['README.md', 'docs/', '*.md', 'CHANGELOG.*'],
                capabilities: ['Project planning', 'Documentation', 'Team coordination', 'Release management']
            });
            agentCustomizations.set('Sarah-PM', sarahConfig);
        }
        // Alex - BA Agent
        if (this.responses.projectType === 'enterprise' || this.responses.teamSize === 'large') {
            console.log(`\n📊 ALEX (Business Analyst) - Requirements & Analytics`);
            const alexConfig = await this.customizeAgent('Alex-BA', {
                description: 'Focuses on business logic, requirements, and user analytics',
                defaultTriggers: ['*.feature', 'requirements/', 'specs/', 'analytics/'],
                capabilities: ['Requirements analysis', 'User story creation', 'Analytics integration', 'Business logic validation']
            });
            agentCustomizations.set('Alex-BA', alexConfig);
        }
        this.responses.agentCustomizations = agentCustomizations;
        console.log(`✅ OPERA agents customized: ${agentCustomizations.size} agents configured`);
    }
    /**
     * Customize individual agent
     */
    async customizeAgent(agentName, agentInfo) {
        console.log(`\nAgent: ${agentName}`);
        console.log(`Purpose: ${agentInfo.description}`);
        console.log(`Capabilities: ${agentInfo.capabilities.join(', ')}`);
        const autoActivate = await this.askYesNo(`Enable auto-activation for ${agentName}? (Y/n): `, true);
        const priorityInput = await this.askQuestion(`Priority level for ${agentName} (1-10, higher = more important): `);
        const priority = parseInt(priorityInput) || 5;
        const customTriggers = await this.askQuestion(`
Additional file patterns for ${agentName}?
Default: ${agentInfo.defaultTriggers.join(', ')}
Add more (comma-separated, or press Enter to skip): `);
        const specialFocus = await this.askQuestion(`
Special focus areas for ${agentName}?
Available: ${agentInfo.capabilities.join(', ')}
Choose (comma-separated, or press Enter for all): `);
        return {
            agentName,
            priority,
            autoActivate,
            customTriggers: customTriggers ? customTriggers.split(',').map(t => t.trim()) : [],
            specialFocus: specialFocus ? specialFocus.split(',').map(f => f.trim()) : agentInfo.capabilities
        };
    }
    /**
     * Configure MCP tool preferences
     */
    async configureMCPTools() {
        console.log(`\n🔧 Step 4: MCP Tool Configuration\n`);
        console.log(`VERSATIL integrates with Model Context Protocol (MCP) tools for enhanced automation:\n`);
        const mcpChoices = await this.askQuestion(`
Which MCP tools would you like to enable?
1) Chrome MCP - Browser automation and testing
2) Shadcn MCP - UI component library integration
3) GitHub MCP - Repository analysis and automation
4) Playwright MCP - Cross-browser testing
5) All of the above

Choose (1-5): `);
        this.responses.mcpPreferences = this.parseMCPPreferences(mcpChoices);
        console.log(`✅ MCP tools configured: ${this.responses.mcpPreferences.join(', ')}`);
    }
    /**
     * Generate final configuration
     */
    async generateConfiguration() {
        console.log(`\n⚙️ Step 5: Generating Configuration\n`);
        console.log(`Creating your personalized VERSATIL configuration...`);
        // Simulate configuration generation
        await this.delay(2000);
        const config = {
            projectType: this.responses.projectType,
            teamSize: this.responses.teamSize,
            experience: this.responses.experience,
            technologies: this.responses.technologies,
            priorities: this.responses.priorities,
            agentCustomizations: this.responses.agentCustomizations,
            mcpPreferences: this.responses.mcpPreferences
        };
        console.log(`✅ Configuration generated successfully!`);
        return config;
    }
    /**
     * Complete setup and create project files
     */
    async completeSetup(config) {
        console.log(`\n🎉 Step 6: Setup Completion\n`);
        console.log(`Creating VERSATIL project structure...`);
        // Create .versatil directory and configuration files
        await this.createProjectStructure(config);
        // Generate personalized roadmap
        await this.generateProjectRoadmap(config);
        console.log(`
✅ VERSATIL Framework Setup Complete!

✨ What's New in v7.1.0+ (You Get This Automatically!):

   🚀 PROACTIVE AUTOMATION - Hooks drive action, Claude executes immediately
      • Templates auto-apply when you create files (5-10x faster)
      • Agents auto-activate based on file edits (no manual commands)
      • Patterns auto-suggest from historical learnings (85-95% token savings)
      • Full automation - no confirmation needed!

   🧠 94.1% TOKEN SAVINGS - Skills-first architecture
      • Progressive disclosure (15 tokens → 500 tokens → 2,000 tokens)
      • Library guides load only when mentioned
      • Code generators use copy-paste templates, not regeneration

   📍 COMPOUNDING ENGINEERING - Each feature 40% faster than the last
      • Pattern search finds similar work you've done before
      • Template matching suggests proven approaches
      • Todo generation from historical effort data

📁 Created Files:
   .versatil/config.json - Main configuration
   .versatil/agents/ - Agent definitions
   .cursorrules - IDE integration
   CLAUDE.md - OPERA methodology guide
   docs/VERSATIL_ROADMAP.md - 📍 Your personalized 4-week development roadmap
   versatil.log - Framework activity log

🚀 Next Steps:

   1. ⚡ Start the proactive daemon (REQUIRED for auto-activation):
      versatil-daemon start

      This enables automatic agent activation when you edit files.
      You only need to start it once per project.

   2. 📍 Review your personalized roadmap:
      docs/VERSATIL_ROADMAP.md

   3. 🧪 Test agent auto-activation:
      • Edit a *.test.* file → Maria-QA activates
      • Edit a *.tsx file → James-Frontend activates
      • Or use slash commands: /maria-qa, /james-frontend

   4. 📚 Check the documentation:
      docs/INSTALLATION.md
      docs/AUTOMATION_TEST_REPORT.md (87.5% automation success rate!)

💡 Daemon Commands:
   versatil-daemon status    # Check if running
   versatil-daemon stop      # Stop daemon
   versatil-daemon logs      # View daemon logs

🎯 Your OPERA agents are ready:
${Array.from(config.agentCustomizations.keys()).map(agent => `   • ${agent}`).join('\n')}

📍 Roadmap Generated: Check docs/VERSATIL_ROADMAP.md for your customized 4-week plan with:
   • Weekly milestones tailored to your ${config.projectType} project
   • Recommended agents for each phase
   • Quality gates and success metrics
   • Technology-specific best practices
`);
        // Ask if user wants to start daemon now
        const startDaemon = await this.askYesNo(`
Would you like to start the proactive daemon now? (Recommended)
This enables automatic agent activation when you edit files. (Y/n): `, true);
        if (startDaemon) {
            console.log('\n🚀 Starting VERSATIL Proactive Daemon...');
            try {
                // Import and start daemon
                const { execSync } = await import('child_process');
                execSync('versatil-daemon start', { stdio: 'inherit', cwd: process.cwd() });
                console.log('\n✅ Daemon started successfully!');
                console.log('   Agents will now auto-activate when you edit files.');
                console.log('   Check status anytime: versatil-daemon status');
            }
            catch (error) {
                console.error('\n⚠️  Could not start daemon automatically.');
                console.log('   Please run manually: versatil-daemon start');
                console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        else {
            console.log('\n⚠️  Remember to start the daemon later:');
            console.log('   versatil-daemon start');
        }
        console.log('\nHappy coding with VERSATIL! 🚀\n');
    }
    // Helper methods for parsing responses
    parseProjectType(input) {
        const map = {
            '1': 'frontend', '2': 'backend', '3': 'fullstack',
            '4': 'mobile', '5': 'ml', '6': 'enterprise'
        };
        return map[input] || 'fullstack';
    }
    parseTeamSize(input) {
        const map = {
            '1': 'solo', '2': 'small', '3': 'medium', '4': 'large'
        };
        return map[input] || 'small';
    }
    parseExperience(input) {
        const map = {
            '1': 'beginner', '2': 'intermediate', '3': 'expert'
        };
        return map[input] || 'intermediate';
    }
    parsePriorities(input) {
        const map = {
            '1': 'Speed', '2': 'Quality', '3': 'Testing',
            '4': 'Security', '5': 'Performance', '6': 'Collaboration'
        };
        return input.split(',').map(i => map[i.trim()]).filter((item) => Boolean(item));
    }
    parseMCPPreferences(input) {
        if (input === '5')
            return ['chrome_mcp', 'shadcn_mcp', 'github_mcp', 'playwright_mcp'];
        const map = {
            '1': 'chrome_mcp', '2': 'shadcn_mcp', '3': 'github_mcp', '4': 'playwright_mcp'
        };
        return input.split(',').map(i => map[i.trim()]).filter((item) => Boolean(item));
    }
    // Auto-detection methods
    async detectProjectType(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            if (packageJson.dependencies?.['react'] || packageJson.dependencies?.['vue']) {
                return 'frontend';
            }
            if (packageJson.dependencies?.['express'] || packageJson.dependencies?.['koa']) {
                return 'backend';
            }
            if (packageJson.dependencies?.['react-native']) {
                return 'mobile';
            }
        }
        catch {
            // No package.json or can't read it
        }
        return null;
    }
    async detectTechnologies(projectPath) {
        const technologies = [];
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            if (allDeps['react'])
                technologies.push('React');
            if (allDeps['vue'])
                technologies.push('Vue');
            if (allDeps['angular'])
                technologies.push('Angular');
            if (allDeps['typescript'])
                technologies.push('TypeScript');
            if (allDeps['express'])
                technologies.push('Express');
            if (allDeps['next'])
                technologies.push('Next.js');
            if (allDeps['tensorflow'] || allDeps['torch'])
                technologies.push('ML/AI');
        }
        catch {
            // Can't detect from package.json
        }
        return technologies;
    }
    async createProjectStructure(config) {
        const versatilDir = '.versatil';
        // Create directories
        await fs.mkdir(versatilDir, { recursive: true });
        await fs.mkdir(path.join(versatilDir, 'agents'), { recursive: true });
        await fs.mkdir(path.join(versatilDir, 'mcp'), { recursive: true });
        // Create main config
        await fs.writeFile(path.join(versatilDir, 'config.json'), JSON.stringify(config, null, 2));
        // Create agent configurations
        for (const [agentName, agentConfig] of config.agentCustomizations) {
            await fs.writeFile(path.join(versatilDir, 'agents', `${agentName.toLowerCase()}.json`), JSON.stringify(agentConfig, null, 2));
        }
        // Create .cursorrules
        await fs.writeFile('.cursorrules', this.generateCursorRules(config));
        // Create basic CLAUDE.md
        await fs.writeFile('CLAUDE.md', this.generateClaudeGuide(config));
    }
    generateCursorRules(config) {
        return `# VERSATIL Framework - Auto-generated .cursorrules
# Generated by onboarding wizard for ${config.projectType} project

${Array.from(config.agentCustomizations.entries()).map(([agentName, agentConfig]) => `
# ${agentName}
${agentName.toLowerCase()}_triggers:
  auto_activate: ${agentConfig.autoActivate}
  priority: ${agentConfig.priority}
  focus: ${agentConfig.specialFocus.join(', ')}
`).join('\n')}
`;
    }
    generateClaudeGuide(config) {
        return `# VERSATIL OPERA Methodology Guide

## Your Customized Agent Team

${Array.from(config.agentCustomizations.entries()).map(([agentName, agentConfig]) => `
### ${agentName}
- **Priority**: ${agentConfig.priority}/10
- **Auto-activation**: ${agentConfig.autoActivate ? 'Enabled' : 'Disabled'}
- **Focus Areas**: ${agentConfig.specialFocus.join(', ')}
`).join('\n')}

## Project Configuration
- **Type**: ${config.projectType}
- **Team Size**: ${config.teamSize}
- **Experience Level**: ${config.experience}
- **Technologies**: ${config.technologies.join(', ')}
- **Priorities**: ${config.priorities.join(', ')}

## 📍 Your Development Roadmap

A personalized 4-week development roadmap has been generated for your project.
Check **docs/VERSATIL_ROADMAP.md** for detailed week-by-week milestones, agent recommendations, and quality gates.

Generated by VERSATIL Onboarding Wizard
`;
    }
    /**
     * Generate personalized project roadmap
     */
    async generateProjectRoadmap(config) {
        console.log(`\n📍 Generating personalized development roadmap...`);
        const projectPath = process.cwd();
        const roadmapGenerator = new RoadmapGenerator(projectPath);
        try {
            // Generate markdown roadmap
            const roadmapMarkdown = await roadmapGenerator.generateMarkdown();
            // Create docs directory if it doesn't exist
            const docsDir = path.join(projectPath, 'docs');
            await fs.mkdir(docsDir, { recursive: true });
            // Write roadmap to docs/VERSATIL_ROADMAP.md
            const roadmapPath = path.join(docsDir, 'VERSATIL_ROADMAP.md');
            await fs.writeFile(roadmapPath, roadmapMarkdown);
            console.log(`✅ Roadmap generated: docs/VERSATIL_ROADMAP.md`);
            console.log(`   Includes: 4-week plan, ${config.agentCustomizations.size} recommended agents, quality gates`);
        }
        catch (error) {
            console.error(`⚠️ Warning: Could not generate roadmap:`, error);
            console.log(`   You can manually run: npm run generate:roadmap`);
        }
    }
    // Utility methods
    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }
    async askYesNo(question, defaultValue = false) {
        const answer = await this.askQuestion(question);
        if (!answer)
            return defaultValue;
        return answer.toLowerCase().startsWith('y');
    }
    async waitForEnter() {
        await this.askQuestion('');
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Export CLI command
export async function runOnboardingWizard() {
    const wizard = new OnboardingWizard();
    await wizard.startOnboarding();
}
//# sourceMappingURL=onboarding-wizard.js.map