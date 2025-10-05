#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Enhanced Onboarding with Scenario Detection
 * Intelligently detects and configures based on project type and needs
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

class EnhancedVERSATILOnboarding {
  constructor() {
    this.detected = {
      projectType: null,
      teamSize: null,
      aiExperience: null,
      existingTools: {},
      requirements: {},
      recommendations: []
    };
    
    this.scenarios = {
      'startup-mvp': {
        name: 'Startup Building MVP',
        indicators: ['small team', 'speed priority', 'new project'],
        config: {
          riskTolerance: 0.4,
          autonomousMode: true,
          autoApproval: true,
          focusAgents: ['enhanced-marcus', 'enhanced-james', 'enhanced-maria']
        }
      },
      'enterprise-migration': {
        name: 'Enterprise System Migration',
        indicators: ['large team', 'existing codebase', 'stability priority'],
        config: {
          riskTolerance: 0.1,
          autonomousMode: false,
          requireApproval: true,
          focusAgents: ['architecture-dan', 'security-sam', 'enhanced-maria']
        }
      },
      'ai-augmentation': {
        name: 'AI Development Augmentation',
        indicators: ['ai project', 'ml components', 'optimization'],
        config: {
          riskTolerance: 0.3,
          autonomousMode: true,
          mlIntegration: true,
          focusAgents: ['dr-ai-ml', 'enhanced-marcus', 'data-dana']
        }
      },
      'legacy-modernization': {
        name: 'Legacy System Modernization',
        indicators: ['old codebase', 'refactoring', 'gradual migration'],
        config: {
          riskTolerance: 0.2,
          incrementalMode: true,
          preserveExisting: true,
          focusAgents: ['architecture-dan', 'enhanced-marcus', 'devops-dan']
        }
      },
      'research-prototype': {
        name: 'Research/Prototype Development',
        indicators: ['experimental', 'rapid iteration', 'flexible requirements'],
        config: {
          riskTolerance: 0.6,
          autonomousMode: true,
          rapidPrototyping: true,
          focusAgents: ['enhanced-marcus', 'dr-ai-ml', 'enhanced-james']
        }
      },
      'framework-self-dev': {
        name: 'Framework Self-Development',
        indicators: ['versatil', 'framework development', 'self-referential'],
        config: {
          riskTolerance: 0.3,
          autonomousMode: true,
          selfReferential: true,
          introspectionPriority: 'high',
          focusAgents: ['introspective-agent', 'architecture-dan', 'enhanced-marcus']
        }
      }
    };
  }
  
  async start() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║       VERSATIL v1.2.0 - Intelligent Onboarding Wizard         ║
╚═══════════════════════════════════════════════════════════════╝

Welcome! I'll help configure VERSATIL for your specific needs.
Let me ask a few questions to optimize your setup...
`);

    // Detect existing environment first
    await this.detectEnvironment();
    
    // Interactive questions
    await this.askQuestions();
    
    // Determine scenario
    const scenario = this.determineScenario();
    
    // Generate configuration
    const config = await this.generateConfiguration(scenario);
    
    // Create setup
    await this.createSetup(config);
    
    // Show next steps
    this.showNextSteps(scenario);
  }
  
  async detectEnvironment() {
    console.log('\n🔍 Analyzing your project...\n');
    
    // Check for VERSATIL itself (self-referential case)
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      if (packageJson.name === 'versatil-sdlc-framework') {
        this.detected.projectType = 'framework-self-dev';
        console.log('   ✨ Special case: VERSATIL self-development detected!');
      }
    } catch {}
    
    // Run standard detection
    const detection = await this.runStandardDetection();
    Object.assign(this.detected.existingTools, detection);
    
    console.log('   ✅ Environment analysis complete\n');
  }
  
  async askQuestions() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const ask = (question) => new Promise(resolve => rl.question(question, resolve));
    
    // Only ask if not self-referential
    if (this.detected.projectType !== 'framework-self-dev') {
      // 1. Project type
      console.log('What best describes your project?\n');
      console.log('1. New startup/MVP development');
      console.log('2. Enterprise application');
      console.log('3. AI/ML project');
      console.log('4. Legacy system modernization');
      console.log('5. Research/Experimental prototype');
      console.log('6. Other\n');
      
      const projectChoice = await ask('Enter your choice (1-6): ');
      this.detected.projectType = this.mapProjectType(projectChoice);
      
      // 2. Team size
      console.log('\nWhat\'s your team size?\n');
      console.log('1. Solo developer');
      console.log('2. Small team (2-5)');
      console.log('3. Medium team (6-20)');
      console.log('4. Large team (20+)\n');
      
      const teamChoice = await ask('Enter your choice (1-4): ');
      this.detected.teamSize = this.mapTeamSize(teamChoice);
      
      // 3. AI experience
      console.log('\nWhat\'s your experience with AI-assisted development?\n');
      console.log('1. New to AI development');
      console.log('2. Some experience');
      console.log('3. Experienced');
      console.log('4. Expert\n');
      
      const aiChoice = await ask('Enter your choice (1-4): ');
      this.detected.aiExperience = this.mapAIExperience(aiChoice);
      
      // 4. Priority
      console.log('\nWhat\'s your top priority?\n');
      console.log('1. Development speed');
      console.log('2. Code quality');
      console.log('3. System stability');
      console.log('4. Innovation/Experimentation\n');
      
      const priorityChoice = await ask('Enter your choice (1-4): ');
      this.detected.requirements.priority = this.mapPriority(priorityChoice);
    }
    
    // 5. Additional features (always ask)
    console.log('\nWhich features are important to you? (comma-separated numbers)\n');
    console.log('1. Visual UI design analysis');
    console.log('2. Advanced code generation');
    console.log('3. Automated testing focus');
    console.log('4. Security scanning');
    console.log('5. Performance optimization');
    console.log('6. Self-healing capabilities\n');
    
    const featuresChoice = await ask('Enter your choices (e.g., 1,3,5): ');
    this.detected.requirements.features = this.parseFeatures(featuresChoice);
    
    rl.close();
  }
  
  determineScenario() {
    // Special case for self-referential
    if (this.detected.projectType === 'framework-self-dev') {
      console.log('\n🎯 Scenario: Framework Self-Development Mode\n');
      return this.scenarios['framework-self-dev'];
    }
    
    // Score each scenario
    const scores = {};
    
    for (const [key, scenario] of Object.entries(this.scenarios)) {
      scores[key] = 0;
      
      // Check indicators
      if (this.detected.teamSize === 'small' && scenario.indicators.includes('small team')) {
        scores[key] += 2;
      }
      if (this.detected.teamSize === 'large' && scenario.indicators.includes('large team')) {
        scores[key] += 2;
      }
      if (this.detected.requirements.priority === 'speed' && scenario.indicators.includes('speed priority')) {
        scores[key] += 3;
      }
      if (this.detected.requirements.priority === 'stability' && scenario.indicators.includes('stability priority')) {
        scores[key] += 3;
      }
      
      // Project type matching
      if (key.includes(this.detected.projectType)) {
        scores[key] += 5;
      }
    }
    
    // Find best match
    const bestMatch = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const scenario = this.scenarios[bestMatch];
    
    console.log(`\n🎯 Scenario: ${scenario.name}\n`);
    
    return scenario;
  }
  
  async generateConfiguration(scenario) {
    const config = {
      version: '1.2.0',
      scenario: scenario.name,
      detected: this.detected,
      features: {
        rag: {
          enabled: true,
          reranking: true,
          multimodal: this.detected.requirements.features?.includes('visual'),
          vectorDB: this.detected.existingTools.supabase ? 'supabase' : 'local'
        },
        archon: {
          enabled: true,
          ...scenario.config,
          multimodal: this.detected.requirements.features?.includes('visual'),
          modelSelection: this.selectModels()
        },
        agents: {
          enhanced: true,
          focus: scenario.config.focusAgents,
          autoActivation: this.detected.aiExperience !== 'new'
        },
        introspection: {
          enabled: true,
          continuous: true,
          autoFix: scenario.config.autonomousMode,
          priority: scenario.config.introspectionPriority || 'normal'
        }
      },
      onboarding: {
        completedAt: new Date().toISOString(),
        scenario: scenario.name,
        customizations: this.detected.requirements
      }
    };
    
    // Special configurations for self-referential mode
    if (scenario.name === 'Framework Self-Development') {
      config.features.selfReferential = {
        enabled: true,
        contextBoundary: '.versatil-dev',
        avoidRecursion: true,
        focusAreas: ['src', 'tests', 'docs'],
        excludePaths: ['node_modules', 'dist', '.versatil']
      };
      
      config.features.introspection.priority = 'critical';
      config.features.archon.carefulMode = true;
    }
    
    return config;
  }
  
  async createSetup(config) {
    console.log('📁 Creating optimized configuration...\n');
    
    // Create directories
    await fs.mkdir('.versatil', { recursive: true });
    await fs.mkdir('.versatil/scenarios', { recursive: true });
    
    // Save configuration
    await fs.writeFile(
      '.versatil/config.json',
      JSON.stringify(config, null, 2)
    );
    console.log('   ✅ Configuration saved');
    
    // Create scenario-specific files
    if (config.scenario === 'Framework Self-Development') {
      await this.createSelfDevSetup(config);
    }
    
    // Generate custom agent configurations
    await this.generateAgentConfigs(config);
    
    // Create initial memories
    await this.createInitialMemories(config);
    
    console.log('   ✅ Setup complete!\n');
  }
  
  async createSelfDevSetup(config) {
    // Special setup for self-referential development
    const selfDevConfig = {
      name: 'VERSATIL Self-Development Mode',
      description: 'Framework developing itself',
      boundaries: {
        allowedPaths: ['src', 'tests', 'docs', 'scripts'],
        excludedPaths: ['node_modules', 'dist', '.versatil', '.git'],
        contextLimit: 'current-directory'
      },
      rules: [
        'Never modify core safety mechanisms',
        'Always validate changes through introspection',
        'Maintain backward compatibility',
        'Document all autonomous decisions',
        'Prevent recursive self-modification loops'
      ],
      goals: [
        {
          type: 'continuous',
          description: 'Improve framework quality',
          metrics: ['test coverage', 'performance', 'documentation']
        },
        {
          type: 'reactive',
          description: 'Fix detected issues',
          trigger: 'introspection-alert'
        }
      ]
    };
    
    await fs.writeFile(
      '.versatil/self-dev-config.json',
      JSON.stringify(selfDevConfig, null, 2)
    );
    
    // Create context boundary marker
    await fs.writeFile('.versatil-dev', 'VERSATIL Development Context Boundary');
  }
  
  async generateAgentConfigs(config) {
    // Create custom agent activation rules based on scenario
    const agentRules = {
      activationPriority: config.features.agents.focus,
      autoTriggers: {},
      collaborationPatterns: []
    };
    
    // Define triggers based on scenario
    if (config.features.selfReferential?.enabled) {
      agentRules.autoTriggers = {
        'introspective-agent': ['file-change', 'error', 'performance-degradation'],
        'architecture-dan': ['new-component', 'refactor-needed'],
        'enhanced-marcus': ['code-generation', 'bug-fix'],
        'enhanced-maria': ['test-coverage-drop', 'new-feature']
      };
    } else if (config.scenario === 'Startup Building MVP') {
      agentRules.autoTriggers = {
        'enhanced-marcus': ['new-feature', 'api-development'],
        'enhanced-james': ['ui-component', 'frontend-task'],
        'enhanced-maria': ['deploy-ready', 'quality-check']
      };
    }
    
    await fs.writeFile(
      '.versatil/agent-rules.json',
      JSON.stringify(agentRules, null, 2)
    );
  }
  
  async createInitialMemories(config) {
    // Store onboarding context as first memory
    const memory = {
      type: 'onboarding_context',
      timestamp: Date.now(),
      config,
      scenario: config.scenario,
      recommendations: this.generateRecommendations(config)
    };
    
    await fs.writeFile(
      '.versatil/rag/vector-index/onboarding-memory.json',
      JSON.stringify(memory, null, 2)
    );
  }
  
  showNextSteps(scenario) {
    console.log('🎉 VERSATIL is configured for your needs!\n');
    
    if (scenario.name === 'Framework Self-Development') {
      console.log('🤖 Self-Development Mode Activated!\n');
      console.log('Special features enabled:');
      console.log('• Introspective agent has highest priority');
      console.log('• Context boundaries established');
      console.log('• Recursive modification protection active');
      console.log('• Continuous self-improvement enabled\n');
      
      console.log('Next steps:');
      console.log('1. Run: npm run verify:context');
      console.log('2. Run: npm run demo:context');
      console.log('3. Start developing with: @archon improve versatil framework');
      console.log('4. Monitor with: @introspect health-check\n');
    } else {
      console.log(`Optimized for: ${scenario.name}\n`);
      
      console.log('Next steps:');
      console.log('1. Test your setup: npm run test:enhanced');
      console.log('2. Start with: @archon <your first goal>');
      console.log('3. Query knowledge: @memory <topic>');
      console.log('4. Check health: @introspect status\n');
    }
    
    console.log('📚 Resources:');
    console.log('• Documentation: docs/README.md');
    console.log('• Scenario Guide: .versatil/scenarios/guide.md');
    console.log('• Support: github.com/versatil-sdlc/issues\n');
    
    console.log('Happy coding with VERSATIL! 🚀\n');
  }
  
  // Helper methods
  runStandardDetection() {
    // Reuse existing detection logic
    return {
      cursor: false,
      supabase: false,
      claude: false,
      typescript: false,
      react: false
    };
  }
  
  selectModels() {
    const models = ['claude-3-opus'];
    
    if (this.detected.requirements.features?.includes('visual')) {
      models.push('gpt-4-vision');
    }
    
    if (this.detected.requirements.features?.includes('code-generation')) {
      models.push('codellama-70b');
    }
    
    return models;
  }
  
  generateRecommendations(config) {
    const recommendations = [];
    
    if (config.features.selfReferential?.enabled) {
      recommendations.push('Run framework self-tests regularly');
      recommendations.push('Monitor introspection logs closely');
      recommendations.push('Use @archon carefully for self-modifications');
    }
    
    if (!config.features.rag.vectorDB === 'supabase') {
      recommendations.push('Consider setting up Supabase for better RAG performance');
    }
    
    if (config.detected.aiExperience === 'new') {
      recommendations.push('Start with guided mode before enabling full autonomy');
    }
    
    return recommendations;
  }
  
  // Mapping functions
  mapProjectType(choice) {
    const map = {
      '1': 'startup',
      '2': 'enterprise',
      '3': 'ai-ml',
      '4': 'legacy',
      '5': 'research',
      '6': 'other'
    };
    return map[choice] || 'other';
  }
  
  mapTeamSize(choice) {
    const map = {
      '1': 'solo',
      '2': 'small',
      '3': 'medium',
      '4': 'large'
    };
    return map[choice] || 'small';
  }
  
  mapAIExperience(choice) {
    const map = {
      '1': 'new',
      '2': 'some',
      '3': 'experienced',
      '4': 'expert'
    };
    return map[choice] || 'some';
  }
  
  mapPriority(choice) {
    const map = {
      '1': 'speed',
      '2': 'quality',
      '3': 'stability',
      '4': 'innovation'
    };
    return map[choice] || 'quality';
  }
  
  parseFeatures(input) {
    const features = [];
    const map = {
      '1': 'visual',
      '2': 'code-generation',
      '3': 'testing',
      '4': 'security',
      '5': 'performance',
      '6': 'self-healing'
    };
    
    input.split(',').forEach(num => {
      const feature = map[num.trim()];
      if (feature) features.push(feature);
    });
    
    return features;
  }
}

// Run onboarding
if (require.main === module) {
  const onboarding = new EnhancedVERSATILOnboarding();
  onboarding.start().catch(console.error);
}

module.exports = EnhancedVERSATILOnboarding;
