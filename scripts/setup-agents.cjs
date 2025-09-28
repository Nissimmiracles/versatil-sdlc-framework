#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Agent Setup Script
 * Configures and initializes the 6 specialized BMAD agents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  agent: (agent, msg) => console.log(`${colors.magenta}[${agent}]${colors.reset} ${msg}`)
};

// Agent configurations
const agents = {
  'maria-qa': {
    name: 'Maria-QA',
    role: 'Quality Assurance Lead',
    emoji: '🧪',
    description: 'Testing expert, quality gates, Chrome MCP integration',
    patterns: ['*.test.*', '*.spec.*', '__tests__/**', 'cypress/**'],
    keywords: ['test', 'spec', 'coverage', 'quality', 'bug'],
    tools: ['playwright', '@playwright/test', 'chrome-mcp', 'lighthouse', 'axe-core']
  },
  'james-frontend': {
    name: 'James-Frontend',
    role: 'Frontend Specialist',
    emoji: '🎨',
    description: 'React/Vue expert, UI/UX, performance optimization',
    patterns: ['*.jsx', '*.tsx', '*.vue', 'components/**', '*.css'],
    keywords: ['react', 'vue', 'component', 'ui', 'frontend'],
    tools: ['react', 'vue', 'eslint', 'prettier', 'webpack']
  },
  'marcus-backend': {
    name: 'Marcus-Backend',
    role: 'Backend Expert',
    emoji: '⚙️',
    description: 'API architect, database expert, security specialist',
    patterns: ['*.api.*', 'server/**', 'backend/**', 'controllers/**'],
    keywords: ['server', 'api', 'database', 'security', 'backend'],
    tools: ['express', 'fastify', 'prisma', 'mongoose', 'docker']
  },
  'sarah-pm': {
    name: 'Sarah-PM',
    role: 'Project Manager',
    emoji: '📋',
    description: 'Project coordination, documentation, planning',
    patterns: ['README.md', '*.md', 'docs/**', 'package.json'],
    keywords: ['project', 'plan', 'documentation', 'milestone'],
    tools: ['markdown', 'mermaid', 'github-actions', 'project-management']
  },
  'alex-ba': {
    name: 'Alex-BA',
    role: 'Business Analyst',
    emoji: '📊',
    description: 'Requirements analysis, user stories, business logic',
    patterns: ['requirements/**', 'specs/**', '*.feature'],
    keywords: ['requirement', 'user story', 'business', 'feature'],
    tools: ['gherkin', 'cucumber', 'business-analysis', 'requirements']
  },
  'dr-ai-ml': {
    name: 'Dr.AI-ML',
    role: 'AI/ML Specialist',
    emoji: '🤖',
    description: 'Machine learning, data science, AI integration',
    patterns: ['*.py', 'ml/**', '*.ipynb', 'requirements.txt'],
    keywords: ['ml', 'ai', 'tensorflow', 'pytorch', 'model'],
    tools: ['tensorflow', 'pytorch', 'scikit-learn', 'jupyter', 'pandas']
  }
};

class VersatilAgentSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.versatilDir = path.join(this.projectRoot, '.versatil');
    this.projectConfig = this.loadProjectConfig();
    this.packageJson = this.loadPackageJson();
  }

  loadProjectConfig() {
    try {
      const configPath = path.join(this.versatilDir, 'project-config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (error) {
      log.warning('Could not load project configuration');
    }
    return { project: {}, agents: {} };
  }

  loadPackageJson() {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (fs.existsSync(packagePath)) {
        return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      }
    } catch (error) {
      log.warning('Could not load package.json');
    }
    return { dependencies: {}, devDependencies: {} };
  }

  showHeader() {
    console.clear();
    console.log(`${colors.blue}╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║                    VERSATIL AGENT SETUP                     ║`);
    console.log(`║                BMAD Methodology Configuration               ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log('🤖 Configuring 6 specialized AI agents for optimal development workflow');
    console.log('');
  }

  async analyzeProject() {
    log.info('Analyzing project structure and requirements...');

    const analysis = {
      projectType: this.detectProjectType(),
      framework: this.detectFramework(),
      hasTests: this.hasTestingSetup(),
      hasDocumentation: this.hasDocumentation(),
      complexity: this.estimateComplexity(),
      recommendedAgents: []
    };

    // Determine which agents are most relevant
    for (const [agentId, agent] of Object.entries(agents)) {
      const relevanceScore = this.calculateAgentRelevance(agent, analysis);
      if (relevanceScore > 0.5) {
        analysis.recommendedAgents.push({ id: agentId, agent, score: relevanceScore });
      }
    }

    // Sort by relevance
    analysis.recommendedAgents.sort((a, b) => b.score - a.score);

    return analysis;
  }

  detectProjectType() {
    if (fs.existsSync('package.json')) return 'nodejs';
    if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml')) return 'python';
    if (fs.existsSync('Cargo.toml')) return 'rust';
    if (fs.existsSync('go.mod')) return 'go';
    return 'unknown';
  }

  detectFramework() {
    const pkg = this.packageJson;
    if (pkg.dependencies?.react || pkg.devDependencies?.react) return 'react';
    if (pkg.dependencies?.vue || pkg.devDependencies?.vue) return 'vue';
    if (pkg.dependencies?.express) return 'express';
    if (pkg.dependencies?.next) return 'nextjs';
    return 'none';
  }

  hasTestingSetup() {
    const testIndicators = [
      'test', 'tests', '__tests__', 'spec', 'cypress', 'e2e',
      'jest.config.js', 'playwright.config.js', 'vitest.config.js'
    ];

    return testIndicators.some(indicator => {
      return fs.existsSync(indicator) ||
             this.packageJson.scripts?.[indicator] ||
             this.packageJson.devDependencies?.[indicator];
    });
  }

  hasDocumentation() {
    return fs.existsSync('README.md') || fs.existsSync('docs');
  }

  estimateComplexity() {
    let score = 0;

    // File count
    const jsFiles = this.countFiles(['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx']);
    if (jsFiles > 50) score += 2;
    else if (jsFiles > 20) score += 1;

    // Package dependencies
    const depCount = Object.keys(this.packageJson.dependencies || {}).length;
    if (depCount > 20) score += 2;
    else if (depCount > 10) score += 1;

    // Has backend and frontend
    if (this.hasDirectory('server') || this.hasDirectory('backend')) score += 1;
    if (this.hasDirectory('client') || this.hasDirectory('frontend')) score += 1;

    return Math.min(score, 5); // Max 5
  }

  countFiles(patterns) {
    try {
      // Simple file counting (in real implementation, would use glob)
      const result = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | wc -l',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      return parseInt(result.trim()) || 0;
    } catch {
      return 0;
    }
  }

  hasDirectory(dirName) {
    return fs.existsSync(dirName) && fs.lstatSync(dirName).isDirectory();
  }

  calculateAgentRelevance(agent, analysis) {
    let score = 0;

    // Base relevance based on project type
    switch (analysis.projectType) {
      case 'nodejs':
        if (agent.name.includes('Frontend') || agent.name.includes('Backend')) score += 0.8;
        break;
      case 'python':
        if (agent.name.includes('AI-ML')) score += 0.9;
        if (agent.name.includes('Backend')) score += 0.6;
        break;
    }

    // Framework-specific relevance
    if (analysis.framework === 'react' && agent.name.includes('Frontend')) score += 0.7;
    if (analysis.framework === 'express' && agent.name.includes('Backend')) score += 0.7;

    // Testing setup
    if (analysis.hasTests && agent.name.includes('QA')) score += 0.8;

    // Documentation
    if (analysis.hasDocumentation && agent.name.includes('PM')) score += 0.6;

    // Complexity factor
    if (analysis.complexity >= 3) {
      if (agent.name.includes('QA') || agent.name.includes('PM')) score += 0.3;
    }

    // Always include Maria-QA for quality
    if (agent.name.includes('QA')) score += 0.5;

    return Math.min(score, 1.0);
  }

  async configureAgent(agentId, agent, enabled = true) {
    log.agent(agent.name, `Configuring ${agent.emoji} ${agent.name} (${agent.role})`);

    const agentConfig = {
      id: agentId,
      name: agent.name,
      role: agent.role,
      description: agent.description,
      enabled: enabled,
      auto_activate: enabled,
      patterns: agent.patterns,
      keywords: agent.keywords,
      tools: agent.tools,
      configured_at: new Date().toISOString()
    };

    // Create agent-specific configuration
    const agentDir = path.join(this.versatilDir, 'agents', agentId);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Save agent configuration
    fs.writeFileSync(
      path.join(agentDir, 'config.json'),
      JSON.stringify(agentConfig, null, 2)
    );

    // Create agent-specific prompts and templates
    await this.createAgentAssets(agentId, agent, agentDir);

    log.success(`${agent.name} configured successfully`);
    return agentConfig;
  }

  async createAgentAssets(agentId, agent, agentDir) {
    // Create agent prompt template
    const promptTemplate = this.generateAgentPrompt(agent);
    fs.writeFileSync(path.join(agentDir, 'prompt.md'), promptTemplate);

    // Create agent-specific commands
    const commandsScript = this.generateAgentCommands(agentId, agent);
    fs.writeFileSync(path.join(agentDir, 'commands.sh'), commandsScript);

    try {
      fs.chmodSync(path.join(agentDir, 'commands.sh'), 0o755);
    } catch (error) {
      // Continue if chmod fails
    }

    // Create agent workflows
    if (agentId === 'maria-qa') {
      await this.createMariaQAAssets(agentDir);
    } else if (agentId === 'james-frontend') {
      await this.createJamesFrontendAssets(agentDir);
    } else if (agentId === 'marcus-backend') {
      await this.createMarcusBackendAssets(agentDir);
    }
  }

  generateAgentPrompt(agent) {
    return `# ${agent.name} - ${agent.role}

## Role Description
${agent.description}

## Activation Patterns
${agent.patterns.map(p => `- ${p}`).join('\n')}

## Keywords
${agent.keywords.map(k => `- ${k}`).join('\n')}

## Responsibilities
You are ${agent.name}, specialized in ${agent.role.toLowerCase()}. Your primary focus is on:

${this.getAgentResponsibilities(agent.name)}

## Context Awareness
- Always maintain quality-first approach
- Collaborate effectively with other agents
- Preserve context during handoffs
- Follow BMAD methodology principles

## Tools & Technologies
${agent.tools.map(t => `- ${t}`).join('\n')}

## Success Metrics
- Code quality scores
- User satisfaction
- Task completion rate
- Collaboration effectiveness
`;
  }

  getAgentResponsibilities(agentName) {
    const responsibilities = {
      'Maria-QA': `- Comprehensive testing strategies and implementation
- Quality gates enforcement (80%+ coverage)
- Chrome MCP testing integration
- Bug detection and prevention
- Performance and security testing
- Automated testing pipeline setup
- Code review quality standards`,

      'James-Frontend': `- Modern component development (React/Vue/Svelte)
- Responsive and accessible UI implementation
- Frontend performance optimization
- State management architecture
- Design system implementation
- Browser compatibility assurance
- Progressive Web App features`,

      'Marcus-Backend': `- RESTful/GraphQL API design and implementation
- Database architecture and optimization
- Authentication/authorization systems
- Microservices architecture
- Docker containerization
- CI/CD pipeline configuration
- Security implementation`,

      'Sarah-PM': `- Project planning and milestone tracking
- Team coordination and communication
- Documentation strategy and maintenance
- Risk management and mitigation
- Stakeholder communication
- Process improvement initiatives
- Quality assurance oversight`,

      'Alex-BA': `- Requirements gathering and analysis
- User story creation and refinement
- Acceptance criteria definition
- Business process mapping
- Stakeholder needs analysis
- Feature prioritization
- ROI calculation and value assessment`,

      'Dr.AI-ML': `- Machine learning model development
- Data preprocessing and feature engineering
- Model training, validation, and optimization
- AI integration into web applications
- MLOps pipeline implementation
- Data visualization and analysis
- Research and experimentation`
    };

    return responsibilities[agentName] || '- Specialized task execution\n- Quality assurance\n- Team collaboration';
  }

  generateAgentCommands(agentId, agent) {
    const commands = {
      'maria-qa': `#!/bin/bash
# Maria-QA Commands

maria_test_all() {
    echo "${agent.emoji} Running comprehensive test suite..."
    npm run test
    playwright test
}

maria_visual_test() {
    echo "${agent.emoji} Running visual regression tests..."
    chrome-mcp test --visual
}

maria_performance() {
    echo "${agent.emoji} Running performance tests..."
    lighthouse http://localhost:3000
}

maria_accessibility() {
    echo "${agent.emoji} Running accessibility audit..."
    pa11y http://localhost:3000
}`,

      'james-frontend': `#!/bin/bash
# James-Frontend Commands

james_lint() {
    echo "${agent.emoji} Linting frontend code..."
    eslint src/ --fix
    prettier --write src/
}

james_build() {
    echo "${agent.emoji} Building frontend..."
    npm run build
}

james_optimize() {
    echo "${agent.emoji} Optimizing frontend performance..."
    webpack-bundle-analyzer dist/
}`,

      'marcus-backend': `#!/bin/bash
# Marcus-Backend Commands

marcus_security() {
    echo "${agent.emoji} Running security audit..."
    npm audit
    snyk test
}

marcus_api_test() {
    echo "${agent.emoji} Testing API endpoints..."
    newman run api-tests.postman_collection.json
}

marcus_docker() {
    echo "${agent.emoji} Managing Docker containers..."
    docker-compose up -d
}`
    };

    return commands[agentId] || `#!/bin/bash\n# ${agent.name} Commands\necho "Commands for ${agent.name}"`;
  }

  async createMariaQAAssets(agentDir) {
    // Create test configuration template
    const testConfig = `// Maria-QA Test Configuration
module.exports = {
  testTimeout: 30000,
  coverage: {
    threshold: 80,
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  },
  chromeMCP: {
    enabled: true,
    visualTesting: true,
    performanceTesting: true,
    accessibilityTesting: true
  }
};`;

    fs.writeFileSync(path.join(agentDir, 'test.config.js'), testConfig);

    // Create quality gates checklist
    const qualityGates = `# Maria-QA Quality Gates Checklist

## Pre-commit Gates
- [ ] Code linting passed
- [ ] Unit tests passed (80%+ coverage)
- [ ] Type checking passed
- [ ] Security scan completed

## Pre-deploy Gates
- [ ] Integration tests passed
- [ ] E2E tests passed
- [ ] Performance benchmarks met
- [ ] Accessibility audit passed
- [ ] Visual regression tests passed

## Post-deploy Gates
- [ ] Smoke tests passed
- [ ] Monitoring alerts configured
- [ ] Performance metrics within budget
- [ ] User acceptance criteria met
`;

    fs.writeFileSync(path.join(agentDir, 'quality-gates.md'), qualityGates);
  }

  async createJamesFrontendAssets(agentDir) {
    // Create component template
    const componentTemplate = `// James-Frontend Component Template
import React from 'react';
import PropTypes from 'prop-types';
import styles from './Component.module.css';

const Component = ({ children, className, ...props }) => {
  return (
    <div className={\`\${styles.component} \${className}\`} {...props}>
      {children}
    </div>
  );
};

Component.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string
};

Component.defaultProps = {
  className: ''
};

export default Component;
`;

    fs.writeFileSync(path.join(agentDir, 'component.template.jsx'), componentTemplate);
  }

  async createMarcusBackendAssets(agentDir) {
    // Create API template
    const apiTemplate = `// Marcus-Backend API Template
const express = require('express');
const router = express.Router();

// GET endpoint
router.get('/', async (req, res) => {
  try {
    // Implementation here
    res.json({ message: 'Success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST endpoint
router.post('/', async (req, res) => {
  try {
    // Implementation here
    res.status(201).json({ message: 'Created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
`;

    fs.writeFileSync(path.join(agentDir, 'api.template.js'), apiTemplate);
  }

  async updateProjectConfiguration(configuredAgents) {
    // Update project configuration with agent settings
    this.projectConfig.agents = {};

    for (const agentConfig of configuredAgents) {
      this.projectConfig.agents[agentConfig.id] = {
        enabled: agentConfig.enabled,
        auto_activate: agentConfig.auto_activate,
        configured_at: agentConfig.configured_at
      };
    }

    // Save updated configuration
    fs.writeFileSync(
      path.join(this.versatilDir, 'project-config.json'),
      JSON.stringify(this.projectConfig, null, 2)
    );

    log.success('Project configuration updated');
  }

  async generateAgentSummary(analysis, configuredAgents) {
    console.log('\n' + colors.cyan + '╔══════════════════════════════════════════════════════════════╗');
    console.log('║                      AGENT SETUP SUMMARY                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝' + colors.reset);
    console.log('');

    console.log(`${colors.blue}Project Analysis:${colors.reset}`);
    console.log(`• Type: ${analysis.projectType}`);
    console.log(`• Framework: ${analysis.framework}`);
    console.log(`• Complexity: ${'★'.repeat(analysis.complexity)}${'☆'.repeat(5 - analysis.complexity)}`);
    console.log(`• Has Tests: ${analysis.hasTests ? '✅' : '❌'}`);
    console.log(`• Has Docs: ${analysis.hasDocumentation ? '✅' : '❌'}`);
    console.log('');

    console.log(`${colors.blue}Configured Agents:${colors.reset}`);
    for (const agent of configuredAgents) {
      const emoji = agents[agent.id]?.emoji || '🤖';
      const status = agent.enabled ? '✅ Active' : '⏸️  Inactive';
      console.log(`• ${emoji} ${agent.name} - ${status}`);
    }
    console.log('');

    console.log(`${colors.blue}Next Steps:${colors.reset}`);
    console.log('1. 🚀 Open your project in Cursor IDE');
    console.log('2. 📝 Edit files matching agent patterns to see auto-activation');
    console.log('3. ✅ Run: npm run versatil:validate');
    console.log('4. 🧪 Test Maria-QA: npm run maria:test');
    console.log('');

    console.log(`${colors.yellow}Pro Tips:${colors.reset}`);
    console.log('• Agents auto-activate based on file patterns and keywords');
    console.log('• Maria-QA reviews all code changes for quality');
    console.log('• Use .cursorrules to customize activation rules');
    console.log('• Check .versatil/agents/ for individual agent configurations');
  }

  async run() {
    try {
      this.showHeader();

      // Analyze project
      const analysis = await this.analyzeProject();
      log.info(`Project analysis completed (${analysis.recommendedAgents.length} agents recommended)`);

      // Configure all agents
      const configuredAgents = [];

      for (const { id, agent, score } of analysis.recommendedAgents) {
        const config = await this.configureAgent(id, agent, score > 0.7);
        configuredAgents.push(config);
      }

      // Configure remaining agents (disabled by default)
      const configuredIds = new Set(configuredAgents.map(a => a.id));
      for (const [id, agent] of Object.entries(agents)) {
        if (!configuredIds.has(id)) {
          const config = await this.configureAgent(id, agent, false);
          configuredAgents.push(config);
        }
      }

      // Update project configuration
      await this.updateProjectConfiguration(configuredAgents);

      // Show summary
      await this.generateAgentSummary(analysis, configuredAgents);

      log.success('VERSATIL agents setup completed successfully! 🎉');

    } catch (error) {
      log.error(`Agent setup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the setup
if (require.main === module) {
  const setup = new VersatilAgentSetup();
  setup.run();
}

module.exports = VersatilAgentSetup;