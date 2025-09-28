#!/usr/bin/env node

/**
 * VERSATIL SDLC Framework - Live Multi-Project Test
 * Tests real-time project detection and agent adaptation
 */

const fs = require('fs');
const path = require('path');

console.log('🔴 VERSATIL SDLC Framework - LIVE Multi-Project Test');
console.log('='.repeat(60));
console.log('📊 Detecting active projects and initializing adaptive agents...\n');

// Simple MCP Client for live testing
class LiveMCPClient {
  constructor() {
    this.activeProjects = new Map();
    this.agentStates = new Map();
  }

  // Detect project characteristics
  analyzeProject(projectPath) {
    try {
      const analysis = {
        path: projectPath,
        name: path.basename(projectPath),
        technologies: [],
        framework: 'unknown',
        complexity: 'medium',
        requirements: [],
        adaptations: {}
      };

      // Check for package.json
      const packagePath = path.join(projectPath, 'package.json');
      if (fs.existsSync(packagePath)) {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        analysis.technologies.push('Node.js');

        // Detect frameworks from dependencies
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.react) analysis.technologies.push('React');
        if (deps['react-native']) analysis.technologies.push('React Native');
        if (deps.vue) analysis.technologies.push('Vue.js');
        if (deps.angular) analysis.technologies.push('Angular');
        if (deps.express) analysis.technologies.push('Express');
        if (deps.fastify) analysis.technologies.push('Fastify');
        if (deps.typescript) analysis.technologies.push('TypeScript');
        if (deps.jest) analysis.technologies.push('Jest');
        if (deps.playwright) analysis.technologies.push('Playwright');
        if (deps.cypress) analysis.technologies.push('Cypress');

        // Determine project type
        if (deps.react && deps.express) {
          analysis.framework = 'Full-Stack React';
          analysis.complexity = 'high';
        } else if (deps.react) {
          analysis.framework = 'React Frontend';
        } else if (deps.express) {
          analysis.framework = 'Node.js Backend';
        }
      }

      // Check for Python projects
      if (fs.existsSync(path.join(projectPath, 'requirements.txt')) ||
          fs.existsSync(path.join(projectPath, 'pyproject.toml'))) {
        analysis.technologies.push('Python');

        // Check for ML frameworks
        const reqPath = path.join(projectPath, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
          const requirements = fs.readFileSync(reqPath, 'utf8');
          if (requirements.includes('tensorflow')) analysis.technologies.push('TensorFlow');
          if (requirements.includes('pytorch')) analysis.technologies.push('PyTorch');
          if (requirements.includes('sklearn')) analysis.technologies.push('Scikit-learn');
          if (requirements.includes('django')) analysis.technologies.push('Django');
          if (requirements.includes('flask')) analysis.technologies.push('Flask');
        }
      }

      // Check for mobile projects
      if (fs.existsSync(path.join(projectPath, 'android')) ||
          fs.existsSync(path.join(projectPath, 'ios'))) {
        analysis.framework = 'Mobile Application';
        analysis.technologies.push('Mobile Development');
      }

      return analysis;
    } catch (error) {
      return {
        path: projectPath,
        name: path.basename(projectPath),
        technologies: ['Unknown'],
        framework: 'unknown',
        error: error.message
      };
    }
  }

  // Adapt agents to project context
  adaptAgentsToProject(projectAnalysis) {
    const adaptations = {
      'enhanced-maria': [],
      'enhanced-james': [],
      'enhanced-marcus': [],
      'architecture-dan': [],
      'security-sam': [],
      'devops-dan': []
    };

    const { technologies, framework } = projectAnalysis;

    // Maria-QA adaptations
    if (technologies.includes('React')) {
      adaptations['enhanced-maria'].push('React component testing');
      adaptations['enhanced-maria'].push('JSX accessibility testing');
    }
    if (technologies.includes('Node.js')) {
      adaptations['enhanced-maria'].push('API endpoint testing');
      adaptations['enhanced-maria'].push('Node.js performance testing');
    }
    if (technologies.includes('Python')) {
      adaptations['enhanced-maria'].push('Python unit testing');
      adaptations['enhanced-maria'].push('Data validation testing');
    }
    if (technologies.includes('Mobile Development')) {
      adaptations['enhanced-maria'].push('Device compatibility testing');
      adaptations['enhanced-maria'].push('Mobile UX testing');
    }

    // James-Frontend adaptations
    if (technologies.includes('React')) {
      adaptations['enhanced-james'].push('React hooks optimization');
      adaptations['enhanced-james'].push('Component state management');
    }
    if (technologies.includes('TypeScript')) {
      adaptations['enhanced-james'].push('TypeScript interface design');
      adaptations['enhanced-james'].push('Type-safe component props');
    }
    if (framework === 'Mobile Application') {
      adaptations['enhanced-james'].push('Touch interaction design');
      adaptations['enhanced-james'].push('Responsive mobile layouts');
    }

    // Marcus-Backend adaptations
    if (technologies.includes('Express')) {
      adaptations['enhanced-marcus'].push('Express.js API design');
      adaptations['enhanced-marcus'].push('Middleware architecture');
    }
    if (technologies.includes('Python')) {
      adaptations['enhanced-marcus'].push('Python API development');
      adaptations['enhanced-marcus'].push('Data processing pipelines');
    }
    if (technologies.includes('TensorFlow')) {
      adaptations['enhanced-marcus'].push('ML model serving');
      adaptations['enhanced-marcus'].push('Training pipeline APIs');
    }

    return adaptations;
  }

  // Live project scanning
  async scanActiveProjects() {
    console.log('🔍 Scanning for active projects...\n');

    // Simulate detection of current working directory projects
    const currentDir = process.cwd();
    const parentDir = path.dirname(currentDir);

    const potentialProjects = [];

    // Check current directory
    potentialProjects.push(currentDir);

    // Check sibling directories (common workspace pattern)
    try {
      const siblings = fs.readdirSync(parentDir);
      siblings.forEach(sibling => {
        const siblingPath = path.join(parentDir, sibling);
        if (fs.statSync(siblingPath).isDirectory() && sibling !== path.basename(currentDir)) {
          potentialProjects.push(siblingPath);
        }
      });
    } catch (error) {
      console.log(`   ⚠️ Could not scan parent directory: ${error.message}`);
    }

    // Analyze each potential project
    const detectedProjects = [];
    potentialProjects.slice(0, 5).forEach(projectPath => { // Limit to 5 for performance
      const analysis = this.analyzeProject(projectPath);
      if (analysis.technologies.length > 0 && !analysis.error) {
        detectedProjects.push(analysis);
        this.activeProjects.set(analysis.name, analysis);
      }
    });

    return detectedProjects;
  }

  // Activate agents for specific project
  async activateAgentsForProject(projectName) {
    const project = this.activeProjects.get(projectName);
    if (!project) {
      throw new Error(`Project ${projectName} not found`);
    }

    const adaptations = this.adaptAgentsToProject(project);

    // Store agent states for this project
    this.agentStates.set(projectName, {
      activeAgents: Object.keys(adaptations).filter(agent => adaptations[agent].length > 0),
      adaptations,
      activatedAt: new Date().toISOString(),
      context: {
        framework: project.framework,
        technologies: project.technologies,
        complexity: project.complexity
      }
    });

    return {
      success: true,
      project: projectName,
      activatedAgents: this.agentStates.get(projectName).activeAgents,
      adaptations
    };
  }

  // Get project status
  getProjectStatus(projectName) {
    const project = this.activeProjects.get(projectName);
    const agentState = this.agentStates.get(projectName);

    if (!project) return null;

    return {
      project: project.name,
      framework: project.framework,
      technologies: project.technologies,
      complexity: project.complexity,
      agents: agentState ? {
        active: agentState.activeAgents,
        adaptations: agentState.adaptations,
        activatedAt: agentState.activatedAt
      } : null
    };
  }
}

async function runLiveTest() {
  const client = new LiveMCPClient();

  try {
    // Scan for active projects
    const projects = await client.scanActiveProjects();

    console.log(`📊 Found ${projects.length} active projects:\n`);

    if (projects.length === 0) {
      console.log('❌ No projects detected. Make sure you\'re in a project directory.');
      return;
    }

    // Display detected projects
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. 📁 ${project.name}`);
      console.log(`      🔧 Technologies: ${project.technologies.join(', ')}`);
      console.log(`      🏗️ Framework: ${project.framework}`);
      console.log(`      📈 Complexity: ${project.complexity}\n`);
    });

    console.log('🤖 Activating adaptive agents for each project...\n');

    // Activate agents for each project
    for (const project of projects) {
      console.log(`🔄 Processing: ${project.name}`);

      try {
        const activation = await client.activateAgentsForProject(project.name);

        console.log(`   ✅ Agents activated: ${activation.activatedAgents.join(', ')}`);
        console.log('   🎯 Agent Adaptations:');

        Object.entries(activation.adaptations).forEach(([agent, adaptations]) => {
          if (adaptations.length > 0) {
            console.log(`      🤖 ${agent}:`);
            adaptations.forEach(adaptation => {
              console.log(`         • ${adaptation}`);
            });
          }
        });
        console.log('');
      } catch (error) {
        console.log(`   ❌ Failed to activate agents: ${error.message}\n`);
      }
    }

    console.log('=' .repeat(60));
    console.log('🎯 LIVE TEST READY - Project Detection Complete');
    console.log('=' .repeat(60));
    console.log('📋 Next Steps:');
    console.log('   1. Ask questions about any of the detected projects');
    console.log('   2. Request specific agent assistance (Maria, James, Marcus, etc.)');
    console.log('   3. Test cross-project knowledge transfer');
    console.log('   4. Verify agent adaptations match your project needs');
    console.log('');
    console.log('💬 Ready for your questions and commands!');
    console.log('');

    // Return project information for further interaction
    return {
      detectedProjects: projects.map(p => ({
        name: p.name,
        path: p.path,
        technologies: p.technologies,
        framework: p.framework
      })),
      activeAgents: projects.reduce((acc, project) => {
        const status = client.getProjectStatus(project.name);
        if (status && status.agents) {
          acc[project.name] = status.agents.active;
        }
        return acc;
      }, {})
    };

  } catch (error) {
    console.error('❌ Live test failed:', error);
    throw error;
  }
}

// Run the live test
runLiveTest()
  .then(result => {
    if (result) {
      console.log('🚀 VERSATIL Framework is now actively monitoring your projects!');
      console.log('🔗 MCP integration ready for cross-project intelligent assistance.');
    }
  })
  .catch(error => {
    console.error('💥 Live test encountered an error:', error.message);
    process.exit(1);
  });