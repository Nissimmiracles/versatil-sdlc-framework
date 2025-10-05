/**
 * VERSATIL Framework Onboarding Wizard
 * Interactive setup experience for new developers with OPERA agent customization
 */

import * as readline from 'readline';
import * as fs from 'fs/promises';
import * as path from 'path';
import { VERSATILAgentDispatcher, AgentTrigger } from './agent-dispatcher.js';
import { AdaptiveAgentCreator } from './adaptive-agent-creator.js';

export interface OnboardingResponse {
  projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ml' | 'enterprise';
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  experience: 'beginner' | 'intermediate' | 'expert';
  technologies: string[];
  priorities: string[];
  agentCustomizations: Map<string, AgentCustomization>;
  mcpPreferences: string[];
}

export interface AgentCustomization {
  agentName: string;
  priority: number;
  autoActivate: boolean;
  customTriggers: string[];
  specialFocus: string[];
}

export class OnboardingWizard {
  private rl: readline.Interface;
  private responses: Partial<OnboardingResponse> = {};

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Start the interactive onboarding experience
   */
  async startOnboarding(): Promise<OnboardingResponse> {
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
    return config as OnboardingResponse;
  }

  /**
   * Analyze existing project structure and detect patterns
   */
  private async analyzeProject(): Promise<void> {
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
  private async setupTeamContext(): Promise<void> {
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
  private async customizeOPERAAgents(): Promise<void> {
    console.log(`\n🤖 Step 3: OPERA Agent Customization\n`);

    console.log(`The OPERA methodology includes 6 specialized agents. Let's customize them for your workflow:\n`);

    const agentCustomizations = new Map<string, AgentCustomization>();

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
  private async customizeAgent(agentName: string, agentInfo: any): Promise<AgentCustomization> {
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
  private async configureMCPTools(): Promise<void> {
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
  private async generateConfiguration(): Promise<OnboardingResponse> {
    console.log(`\n⚙️ Step 5: Generating Configuration\n`);

    console.log(`Creating your personalized VERSATIL configuration...`);

    // Simulate configuration generation
    await this.delay(2000);

    const config: OnboardingResponse = {
      projectType: this.responses.projectType!,
      teamSize: this.responses.teamSize!,
      experience: this.responses.experience!,
      technologies: this.responses.technologies!,
      priorities: this.responses.priorities!,
      agentCustomizations: this.responses.agentCustomizations!,
      mcpPreferences: this.responses.mcpPreferences!
    };

    console.log(`✅ Configuration generated successfully!`);
    return config;
  }

  /**
   * Complete setup and create project files
   */
  private async completeSetup(config: OnboardingResponse): Promise<void> {
    console.log(`\n🎉 Step 6: Setup Completion\n`);

    console.log(`Creating VERSATIL project structure...`);

    // Create .versatil directory and configuration files
    await this.createProjectStructure(config);

    console.log(`
✅ VERSATIL Framework Setup Complete!

📁 Created Files:
   .versatil/config.json - Main configuration
   .versatil/agents/ - Agent definitions
   .cursorrules - IDE integration
   CLAUDE.md - OPERA methodology guide
   versatil.log - Framework activity log

🚀 Next Steps:
   1. Run 'npm run dev' to start your project
   2. Create a file matching your agent triggers to test auto-activation
   3. Check the documentation at docs/INSTALLATION.md

💡 Pro Tip: Your agents will auto-activate based on the file patterns you configured!

🎯 Your OPERA agents are ready:
${Array.from(config.agentCustomizations.keys()).map(agent => `   • ${agent}`).join('\n')}

Happy coding with VERSATIL! 🚀
`);
  }

  // Helper methods for parsing responses
  private parseProjectType(input: string): OnboardingResponse['projectType'] {
    const map: { [key: string]: OnboardingResponse['projectType'] } = {
      '1': 'frontend', '2': 'backend', '3': 'fullstack',
      '4': 'mobile', '5': 'ml', '6': 'enterprise'
    };
    return map[input] || 'fullstack';
  }

  private parseTeamSize(input: string): OnboardingResponse['teamSize'] {
    const map: { [key: string]: OnboardingResponse['teamSize'] } = {
      '1': 'solo', '2': 'small', '3': 'medium', '4': 'large'
    };
    return map[input] || 'small';
  }

  private parseExperience(input: string): OnboardingResponse['experience'] {
    const map: { [key: string]: OnboardingResponse['experience'] } = {
      '1': 'beginner', '2': 'intermediate', '3': 'expert'
    };
    return map[input] || 'intermediate';
  }

  private parsePriorities(input: string): string[] {
    const map: { [key: string]: string } = {
      '1': 'Speed', '2': 'Quality', '3': 'Testing',
      '4': 'Security', '5': 'Performance', '6': 'Collaboration'
    };
    return input.split(',').map(i => map[i.trim()]).filter((item): item is string => Boolean(item));
  }

  private parseMCPPreferences(input: string): string[] {
    if (input === '5') return ['chrome_mcp', 'shadcn_mcp', 'github_mcp', 'playwright_mcp'];

    const map: { [key: string]: string } = {
      '1': 'chrome_mcp', '2': 'shadcn_mcp', '3': 'github_mcp', '4': 'playwright_mcp'
    };
    return input.split(',').map(i => map[i.trim()]).filter((item): item is string => Boolean(item));
  }

  // Auto-detection methods
  private async detectProjectType(projectPath: string): Promise<string | null> {
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
    } catch {
      // No package.json or can't read it
    }

    return null;
  }

  private async detectTechnologies(projectPath: string): Promise<string[]> {
    const technologies: string[] = [];

    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      if (allDeps['react']) technologies.push('React');
      if (allDeps['vue']) technologies.push('Vue');
      if (allDeps['angular']) technologies.push('Angular');
      if (allDeps['typescript']) technologies.push('TypeScript');
      if (allDeps['express']) technologies.push('Express');
      if (allDeps['next']) technologies.push('Next.js');
      if (allDeps['tensorflow'] || allDeps['torch']) technologies.push('ML/AI');

    } catch {
      // Can't detect from package.json
    }

    return technologies;
  }

  private async createProjectStructure(config: OnboardingResponse): Promise<void> {
    const versatilDir = '.versatil';

    // Create directories
    await fs.mkdir(versatilDir, { recursive: true });
    await fs.mkdir(path.join(versatilDir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(versatilDir, 'mcp'), { recursive: true });

    // Create main config
    await fs.writeFile(
      path.join(versatilDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );

    // Create agent configurations
    for (const [agentName, agentConfig] of config.agentCustomizations) {
      await fs.writeFile(
        path.join(versatilDir, 'agents', `${agentName.toLowerCase()}.json`),
        JSON.stringify(agentConfig, null, 2)
      );
    }

    // Create .cursorrules
    await fs.writeFile('.cursorrules', this.generateCursorRules(config));

    // Create basic CLAUDE.md
    await fs.writeFile('CLAUDE.md', this.generateClaudeGuide(config));
  }

  private generateCursorRules(config: OnboardingResponse): string {
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

  private generateClaudeGuide(config: OnboardingResponse): string {
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

Generated by VERSATIL Onboarding Wizard
`;
  }

  // Utility methods
  private async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private async askYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
    const answer = await this.askQuestion(question);
    if (!answer) return defaultValue;
    return answer.toLowerCase().startsWith('y');
  }

  private async waitForEnter(): Promise<void> {
    await this.askQuestion('');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export CLI command
export async function runOnboardingWizard(): Promise<void> {
  const wizard = new OnboardingWizard();
  await wizard.startOnboarding();
}