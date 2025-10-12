/**
 * Automatic Roadmap Generator
 *
 * Analyzes project structure and generates personalized development roadmaps
 * with agent recommendations, weekly milestones, and quality gates.
 *
 * Part of VERSATIL SDLC Framework v6.4.0
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProjectAnalysis {
  projectType: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'ml' | 'unknown';
  technologies: string[];
  framework: string | null;
  languages: string[];
  hasTests: boolean;
  hasCI: boolean;
  teamSize: 'solo' | 'small' | 'medium' | 'large';
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface AgentRecommendation {
  agentName: string;
  agentPath: string;
  reason: string;
  priority: 'critical' | 'recommended' | 'optional';
}

export interface WeeklyMilestone {
  week: number;
  title: string;
  description: string;
  tasks: string[];
  agents: string[];
  qualityGates: string[];
}

export interface ProjectRoadmap {
  projectName: string;
  analysis: ProjectAnalysis;
  recommendedAgents: AgentRecommendation[];
  milestones: WeeklyMilestone[];
  qualityStrategy: string[];
  deploymentChecklist: string[];
}

export class RoadmapGenerator {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Main entry point: Analyze project and generate complete roadmap
   */
  async generateRoadmap(): Promise<ProjectRoadmap> {
    const analysis = await this.analyzeProjectStructure();
    const recommendedAgents = this.detectRecommendedAgents(analysis);
    const milestones = this.generateWeeklyMilestones(analysis, recommendedAgents);
    const qualityStrategy = this.generateQualityStrategy(analysis);
    const deploymentChecklist = this.generateDeploymentChecklist(analysis);

    return {
      projectName: this.getProjectName(),
      analysis,
      recommendedAgents,
      milestones,
      qualityStrategy,
      deploymentChecklist
    };
  }

  /**
   * Analyze project structure and detect technologies
   */
  private async analyzeProjectStructure(): Promise<ProjectAnalysis> {
    const technologies: string[] = [];
    const languages: string[] = [];
    let framework: string | null = null;
    let projectType: ProjectAnalysis['projectType'] = 'unknown';

    // Read package.json if exists (Node.js project)
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Detect frontend frameworks
      if (deps['react']) {
        technologies.push('React');
        framework = 'React';
        languages.push('JavaScript');
        if (deps['typescript']) languages.push('TypeScript');

        if (deps['next']) {
          technologies.push('Next.js');
          framework = 'Next.js';
          projectType = 'fullstack';
        } else {
          projectType = 'frontend';
        }
      }

      if (deps['vue']) {
        technologies.push('Vue');
        framework = 'Vue';
        languages.push('JavaScript');
        if (deps['typescript']) languages.push('TypeScript');
        projectType = 'frontend';
      }

      if (deps['@angular/core']) {
        technologies.push('Angular');
        framework = 'Angular';
        languages.push('TypeScript');
        projectType = 'frontend';
      }

      if (deps['svelte']) {
        technologies.push('Svelte');
        framework = 'Svelte';
        languages.push('JavaScript');
        if (deps['typescript']) languages.push('TypeScript');
        projectType = 'frontend';
      }

      // Detect backend frameworks
      if (deps['express'] || deps['fastify'] || deps['koa']) {
        technologies.push('Node.js');
        languages.push('JavaScript');
        if (deps['typescript']) languages.push('TypeScript');
        if (projectType === 'frontend') {
          projectType = 'fullstack';
        } else {
          projectType = 'backend';
        }
      }

      // Detect mobile
      if (deps['react-native']) {
        technologies.push('React Native');
        framework = 'React Native';
        projectType = 'mobile';
        languages.push('JavaScript');
        if (deps['typescript']) languages.push('TypeScript');
      }

      // Detect testing
      if (deps['jest'] || deps['vitest'] || deps['mocha']) {
        technologies.push('Testing');
      }
    }

    // Check for Python projects
    const requirementsPath = path.join(this.projectPath, 'requirements.txt');
    const pyprojectPath = path.join(this.projectPath, 'pyproject.toml');
    if (fs.existsSync(requirementsPath) || fs.existsSync(pyprojectPath)) {
      languages.push('Python');
      technologies.push('Python');

      // Check for ML/AI frameworks
      let content = '';
      if (fs.existsSync(requirementsPath)) {
        content = fs.readFileSync(requirementsPath, 'utf-8');
      }

      if (content.includes('tensorflow') || content.includes('pytorch') ||
          content.includes('scikit-learn') || content.includes('keras')) {
        technologies.push('Machine Learning');
        projectType = 'ml';
      } else if (content.includes('django')) {
        technologies.push('Django');
        framework = 'Django';
        projectType = 'backend';
      } else if (content.includes('flask') || content.includes('fastapi')) {
        technologies.push('Flask/FastAPI');
        framework = 'Flask/FastAPI';
        projectType = 'backend';
      } else {
        projectType = 'backend';
      }
    }

    // Check for Ruby (Rails)
    const gemfilePath = path.join(this.projectPath, 'Gemfile');
    if (fs.existsSync(gemfilePath)) {
      languages.push('Ruby');
      technologies.push('Ruby on Rails');
      framework = 'Rails';
      projectType = 'backend';
    }

    // Check for Go
    const goModPath = path.join(this.projectPath, 'go.mod');
    if (fs.existsSync(goModPath)) {
      languages.push('Go');
      technologies.push('Go');
      projectType = 'backend';
    }

    // Check for Java
    const pomPath = path.join(this.projectPath, 'pom.xml');
    const gradlePath = path.join(this.projectPath, 'build.gradle');
    if (fs.existsSync(pomPath) || fs.existsSync(gradlePath)) {
      languages.push('Java');
      technologies.push('Java');
      projectType = 'backend';
    }

    // Detect tests
    const hasTests = fs.existsSync(path.join(this.projectPath, 'tests')) ||
                     fs.existsSync(path.join(this.projectPath, 'test')) ||
                     fs.existsSync(path.join(this.projectPath, '__tests__')) ||
                     fs.existsSync(path.join(this.projectPath, 'spec'));

    // Detect CI
    const hasCI = fs.existsSync(path.join(this.projectPath, '.github/workflows')) ||
                  fs.existsSync(path.join(this.projectPath, '.gitlab-ci.yml')) ||
                  fs.existsSync(path.join(this.projectPath, 'Jenkinsfile'));

    // Estimate complexity
    const fileCount = this.countFiles(this.projectPath);
    const complexity: ProjectAnalysis['complexity'] =
      fileCount < 50 ? 'simple' :
      fileCount < 200 ? 'moderate' : 'complex';

    // Estimate team size (heuristic based on git contributors if available)
    let teamSize: ProjectAnalysis['teamSize'] = 'solo';
    try {
      const gitPath = path.join(this.projectPath, '.git');
      if (fs.existsSync(gitPath)) {
        // Default to small team if git exists
        teamSize = 'small';
      }
    } catch (e) {
      // Keep solo
    }

    return {
      projectType,
      technologies,
      framework,
      languages,
      hasTests,
      hasCI,
      teamSize,
      complexity
    };
  }

  /**
   * Detect which OPERA agents and sub-agents should be used
   */
  private detectRecommendedAgents(analysis: ProjectAnalysis): AgentRecommendation[] {
    const recommendations: AgentRecommendation[] = [];

    // Core agents - always recommended
    recommendations.push({
      agentName: 'Maria-QA',
      agentPath: '.claude/agents/maria-qa.md',
      reason: 'Quality assurance, test coverage, and code review',
      priority: 'critical'
    });

    recommendations.push({
      agentName: 'Sarah-PM',
      agentPath: '.claude/agents/sarah-pm.md',
      reason: 'Project coordination, sprint management, and documentation',
      priority: 'recommended'
    });

    // Frontend agents
    if (analysis.projectType === 'frontend' || analysis.projectType === 'fullstack' || analysis.projectType === 'mobile') {
      recommendations.push({
        agentName: 'James-Frontend',
        agentPath: '.claude/agents/james-frontend.md',
        reason: 'UI/UX development, accessibility, and performance',
        priority: 'critical'
      });

      // React sub-agent
      if (analysis.technologies.includes('React') || analysis.technologies.includes('Next.js')) {
        recommendations.push({
          agentName: 'James-React',
          agentPath: '.claude/agents/sub-agents/james-frontend/james-react.md',
          reason: 'React-specific patterns, hooks, and component architecture',
          priority: 'critical'
        });
      }

      // Vue sub-agent
      if (analysis.technologies.includes('Vue')) {
        recommendations.push({
          agentName: 'James-Vue',
          agentPath: '.claude/agents/sub-agents/james-frontend/james-vue.md',
          reason: 'Vue composition API, reactivity, and component patterns',
          priority: 'critical'
        });
      }

      // Next.js sub-agent
      if (analysis.technologies.includes('Next.js')) {
        recommendations.push({
          agentName: 'James-NextJS',
          agentPath: '.claude/agents/sub-agents/james-frontend/james-nextjs.md',
          reason: 'Next.js SSR, SSG, routing, and optimization',
          priority: 'critical'
        });
      }

      // Angular sub-agent
      if (analysis.technologies.includes('Angular')) {
        recommendations.push({
          agentName: 'James-Angular',
          agentPath: '.claude/agents/sub-agents/james-frontend/james-angular.md',
          reason: 'Angular modules, dependency injection, and RxJS patterns',
          priority: 'critical'
        });
      }

      // Svelte sub-agent
      if (analysis.technologies.includes('Svelte')) {
        recommendations.push({
          agentName: 'James-Svelte',
          agentPath: '.claude/agents/sub-agents/james-frontend/james-svelte.md',
          reason: 'Svelte reactivity, stores, and compiler optimizations',
          priority: 'critical'
        });
      }
    }

    // Backend agents
    if (analysis.projectType === 'backend' || analysis.projectType === 'fullstack') {
      recommendations.push({
        agentName: 'Marcus-Backend',
        agentPath: '.claude/agents/marcus-backend.md',
        reason: 'API architecture, security, and performance',
        priority: 'critical'
      });

      // Node.js sub-agent
      if (analysis.technologies.includes('Node.js')) {
        recommendations.push({
          agentName: 'Marcus-Node',
          agentPath: '.claude/agents/sub-agents/marcus-backend/marcus-node-backend.md',
          reason: 'Node.js event loop, async patterns, and Express/Fastify',
          priority: 'critical'
        });
      }

      // Python sub-agent
      if (analysis.technologies.includes('Python')) {
        recommendations.push({
          agentName: 'Marcus-Python',
          agentPath: '.claude/agents/sub-agents/marcus-backend/marcus-python-backend.md',
          reason: 'Python async/await, Django/Flask, and PEP compliance',
          priority: 'critical'
        });
      }

      // Rails sub-agent
      if (analysis.technologies.includes('Ruby on Rails')) {
        recommendations.push({
          agentName: 'Marcus-Rails',
          agentPath: '.claude/agents/sub-agents/marcus-backend/marcus-rails-backend.md',
          reason: 'Rails conventions, ActiveRecord, and RESTful APIs',
          priority: 'critical'
        });
      }

      // Go sub-agent
      if (analysis.technologies.includes('Go')) {
        recommendations.push({
          agentName: 'Marcus-Go',
          agentPath: '.claude/agents/sub-agents/marcus-backend/marcus-go-backend.md',
          reason: 'Go concurrency, goroutines, and microservices',
          priority: 'critical'
        });
      }

      // Java sub-agent
      if (analysis.technologies.includes('Java')) {
        recommendations.push({
          agentName: 'Marcus-Java',
          agentPath: '.claude/agents/sub-agents/marcus-backend/marcus-java-backend.md',
          reason: 'Java Spring Boot, JPA, and enterprise patterns',
          priority: 'critical'
        });
      }
    }

    // ML/AI agent
    if (analysis.projectType === 'ml' || analysis.technologies.includes('Machine Learning')) {
      recommendations.push({
        agentName: 'Dr.AI-ML',
        agentPath: '.claude/agents/dr-ai-ml.md',
        reason: 'Machine learning model development, training, and deployment',
        priority: 'critical'
      });
    }

    // Business analyst (always useful)
    recommendations.push({
      agentName: 'Alex-BA',
      agentPath: '.claude/agents/alex-ba.md',
      reason: 'Requirements analysis, user stories, and acceptance criteria',
      priority: 'recommended'
    });

    return recommendations;
  }

  /**
   * Generate weekly milestones based on project analysis
   */
  private generateWeeklyMilestones(
    analysis: ProjectAnalysis,
    agents: AgentRecommendation[]
  ): WeeklyMilestone[] {
    const milestones: WeeklyMilestone[] = [];

    // Week 1: Foundation and Setup
    milestones.push({
      week: 1,
      title: 'Foundation & Architecture',
      description: 'Establish project structure, standards, and core architecture',
      tasks: [
        'Review and refine project requirements with Alex-BA',
        'Set up development environment and tooling',
        'Define coding standards and conventions',
        'Create initial project structure',
        'Set up version control and branching strategy',
        'Configure CI/CD pipeline (if not present)'
      ],
      agents: ['Alex-BA', 'Sarah-PM', ...this.getRelevantAgents(agents, ['Marcus', 'James'])],
      qualityGates: [
        'All developers can run project locally',
        'Linting and formatting rules enforced',
        'CI/CD pipeline passes on main branch'
      ]
    });

    // Week 2: Core Development
    milestones.push({
      week: 2,
      title: 'Core Feature Development',
      description: 'Implement primary features with quality standards',
      tasks: this.generateWeek2Tasks(analysis),
      agents: this.getRelevantAgents(agents, ['Marcus', 'James', 'Maria']),
      qualityGates: [
        'Unit tests for all new code (80%+ coverage)',
        'Code review by Maria-QA passed',
        'No critical security vulnerabilities',
        'Performance benchmarks met'
      ]
    });

    // Week 3: Integration and Testing
    milestones.push({
      week: 3,
      title: 'Integration & Quality Assurance',
      description: 'Integrate components and comprehensive testing',
      tasks: this.generateWeek3Tasks(analysis),
      agents: ['Maria-QA', ...this.getRelevantAgents(agents, ['Marcus', 'James'])],
      qualityGates: [
        'All integration tests passing',
        'E2E tests covering critical user flows',
        'Accessibility audit (WCAG 2.1 AA) passed',
        'Security scan (OWASP) completed',
        'Performance tests passing (< 200ms API, < 3s page load)'
      ]
    });

    // Week 4: Polish and Deployment
    milestones.push({
      week: 4,
      title: 'Polish & Production Readiness',
      description: 'Final optimizations, documentation, and deployment',
      tasks: [
        'Performance optimization and profiling',
        'User acceptance testing (UAT)',
        'Complete documentation (API docs, user guides)',
        'Deployment automation and rollback procedures',
        'Monitoring and alerting setup',
        'Final security audit',
        'Production deployment',
        'Post-deployment verification'
      ],
      agents: ['Sarah-PM', 'Maria-QA', ...this.getRelevantAgents(agents, ['Marcus', 'James'])],
      qualityGates: [
        'All production checklist items completed',
        'Documentation reviewed and approved',
        'Monitoring dashboards operational',
        'Rollback procedure tested',
        'Zero critical/high severity issues'
      ]
    });

    return milestones;
  }

  /**
   * Generate Week 2 tasks based on project type
   */
  private generateWeek2Tasks(analysis: ProjectAnalysis): string[] {
    const tasks: string[] = [];

    if (analysis.projectType === 'frontend' || analysis.projectType === 'fullstack') {
      tasks.push('Implement core UI components with accessibility');
      tasks.push('Set up state management and routing');
      tasks.push('Integrate with backend APIs (or mock data)');
      tasks.push('Implement responsive design for mobile/tablet');
    }

    if (analysis.projectType === 'backend' || analysis.projectType === 'fullstack') {
      tasks.push('Implement core API endpoints with validation');
      tasks.push('Set up database schema and migrations');
      tasks.push('Implement authentication and authorization');
      tasks.push('Add error handling and logging');
    }

    if (analysis.projectType === 'ml') {
      tasks.push('Data preprocessing and feature engineering');
      tasks.push('Model training and hyperparameter tuning');
      tasks.push('Model evaluation and validation');
      tasks.push('Create model serving API');
    }

    // Common tasks
    tasks.push('Write unit tests for all new code');
    tasks.push('Document API contracts and component interfaces');

    return tasks;
  }

  /**
   * Generate Week 3 tasks based on project type
   */
  private generateWeek3Tasks(analysis: ProjectAnalysis): string[] {
    const tasks: string[] = [];

    if (analysis.projectType === 'frontend' || analysis.projectType === 'fullstack') {
      tasks.push('Integration testing for critical user flows');
      tasks.push('Cross-browser compatibility testing');
      tasks.push('Accessibility testing with screen readers');
      tasks.push('Visual regression testing');
    }

    if (analysis.projectType === 'backend' || analysis.projectType === 'fullstack') {
      tasks.push('API integration testing with realistic data');
      tasks.push('Load testing and stress testing (Rule 2)');
      tasks.push('Database performance optimization');
      tasks.push('Security penetration testing');
    }

    if (analysis.projectType === 'ml') {
      tasks.push('Model performance testing on production-like data');
      tasks.push('A/B testing framework setup');
      tasks.push('Model monitoring and drift detection');
    }

    // Common tasks
    tasks.push('End-to-end testing of complete workflows');
    tasks.push('Bug triage and resolution');
    tasks.push('Performance profiling and optimization');

    return tasks;
  }

  /**
   * Generate quality strategy recommendations
   */
  private generateQualityStrategy(analysis: ProjectAnalysis): string[] {
    const strategy: string[] = [];

    // Testing strategy
    if (!analysis.hasTests) {
      strategy.push('**Testing Setup**: Configure Jest/Vitest for unit tests (target 80%+ coverage)');
      strategy.push('**Integration Tests**: Set up testing library for component/API integration tests');
    } else {
      strategy.push('**Test Enhancement**: Review existing tests, increase coverage to 80%+');
    }

    // CI/CD
    if (!analysis.hasCI) {
      strategy.push('**CI/CD Pipeline**: Set up GitHub Actions or GitLab CI for automated testing');
      strategy.push('**Quality Gates**: Enforce passing tests and linting before merging');
    } else {
      strategy.push('**CI Enhancement**: Add performance testing and security scans to pipeline');
    }

    // Frontend-specific
    if (analysis.projectType === 'frontend' || analysis.projectType === 'fullstack') {
      strategy.push('**Accessibility**: Run axe-core audits, target WCAG 2.1 AA compliance');
      strategy.push('**Performance**: Use Lighthouse CI, target 90+ performance score');
      strategy.push('**Visual Regression**: Set up Percy or Chromatic for UI change detection');
    }

    // Backend-specific
    if (analysis.projectType === 'backend' || analysis.projectType === 'fullstack') {
      strategy.push('**Security Scanning**: Integrate Snyk or OWASP Dependency-Check');
      strategy.push('**API Testing**: Use Postman/Insomnia collections for API validation');
      strategy.push('**Load Testing**: Run k6 or Artillery tests, target < 200ms response times');
    }

    // ML-specific
    if (analysis.projectType === 'ml') {
      strategy.push('**Model Validation**: Track model metrics (accuracy, precision, recall)');
      strategy.push('**Data Quality**: Validate input data distributions and outliers');
      strategy.push('**Model Monitoring**: Set up MLflow or Weights & Biases for tracking');
    }

    // Code review
    strategy.push('**Code Review**: Maria-QA reviews all PRs before merging');
    strategy.push('**Documentation**: Maintain up-to-date README, API docs, and architecture diagrams');

    return strategy;
  }

  /**
   * Generate deployment checklist
   */
  private generateDeploymentChecklist(analysis: ProjectAnalysis): string[] {
    const checklist: string[] = [
      '✅ All tests passing (unit, integration, E2E)',
      '✅ Code coverage >= 80%',
      '✅ No critical/high security vulnerabilities',
      '✅ Performance benchmarks met',
      '✅ Documentation updated',
      '✅ Environment variables configured',
      '✅ Database migrations tested',
      '✅ Rollback procedure documented and tested',
      '✅ Monitoring and alerting configured',
      '✅ Load testing completed successfully'
    ];

    if (analysis.projectType === 'frontend' || analysis.projectType === 'fullstack') {
      checklist.push('✅ Lighthouse score >= 90');
      checklist.push('✅ Accessibility audit passed (WCAG 2.1 AA)');
      checklist.push('✅ Cross-browser testing completed');
    }

    if (analysis.projectType === 'backend' || analysis.projectType === 'fullstack') {
      checklist.push('✅ API documentation published');
      checklist.push('✅ Rate limiting configured');
      checklist.push('✅ Database backups automated');
    }

    if (analysis.projectType === 'ml') {
      checklist.push('✅ Model performance validated on production data');
      checklist.push('✅ Model versioning and rollback tested');
      checklist.push('✅ Prediction latency meets requirements');
    }

    return checklist;
  }

  /**
   * Helper: Get relevant agent names from recommendations
   */
  private getRelevantAgents(agents: AgentRecommendation[], keywords: string[]): string[] {
    return agents
      .filter(a => keywords.some(k => a.agentName.includes(k)))
      .map(a => a.agentName);
  }

  /**
   * Helper: Get project name from package.json or directory name
   */
  private getProjectName(): string {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.name || path.basename(this.projectPath);
      } catch (e) {
        // Fall through
      }
    }
    return path.basename(this.projectPath);
  }

  /**
   * Helper: Count files in project (excluding node_modules, .git, etc.)
   */
  private countFiles(dir: string): number {
    let count = 0;
    const excluded = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.venv'];

    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (excluded.includes(item)) continue;

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          count += this.countFiles(fullPath);
        } else {
          count++;
        }
      }
    } catch (e) {
      // Ignore permission errors
    }

    return count;
  }

  /**
   * Generate markdown roadmap document
   */
  async generateMarkdown(): Promise<string> {
    const roadmap = await this.generateRoadmap();
    let markdown = `# 🗺️ ${roadmap.projectName} - VERSATIL Development Roadmap

**Generated**: ${new Date().toLocaleDateString()}
**Framework**: VERSATIL SDLC v6.4.0

---

## 📊 Project Analysis

**Project Type**: ${roadmap.analysis.projectType}
**Technologies**: ${roadmap.analysis.technologies.join(', ')}
**Primary Language(s)**: ${roadmap.analysis.languages.join(', ')}
${roadmap.analysis.framework ? `**Framework**: ${roadmap.analysis.framework}` : ''}
**Complexity**: ${roadmap.analysis.complexity}
**Team Size**: ${roadmap.analysis.teamSize}

**Current Status**:
- Tests: ${roadmap.analysis.hasTests ? '✅ Present' : '⚠️ Missing'}
- CI/CD: ${roadmap.analysis.hasCI ? '✅ Configured' : '⚠️ Not configured'}

---

## 🤖 Recommended OPERA Agents

The following agents will help you build and maintain this project:

`;

    // Group agents by priority
    const criticalAgents = roadmap.recommendedAgents.filter(a => a.priority === 'critical');
    const recommendedAgents = roadmap.recommendedAgents.filter(a => a.priority === 'recommended');
    const optionalAgents = roadmap.recommendedAgents.filter(a => a.priority === 'optional');

    if (criticalAgents.length > 0) {
      markdown += '### Critical Agents (Primary Development)\n\n';
      for (const agent of criticalAgents) {
        markdown += `- **${agent.agentName}** \`${agent.agentPath}\`\n`;
        markdown += `  ${agent.reason}\n\n`;
      }
    }

    if (recommendedAgents.length > 0) {
      markdown += '### Recommended Agents (Enhanced Workflow)\n\n';
      for (const agent of recommendedAgents) {
        markdown += `- **${agent.agentName}** \`${agent.agentPath}\`\n`;
        markdown += `  ${agent.reason}\n\n`;
      }
    }

    if (optionalAgents.length > 0) {
      markdown += '### Optional Agents (Advanced Features)\n\n';
      for (const agent of optionalAgents) {
        markdown += `- **${agent.agentName}** \`${agent.agentPath}\`\n`;
        markdown += `  ${agent.reason}\n\n`;
      }
    }

    markdown += `---

## 📅 4-Week Development Plan

`;

    // Generate milestones
    for (const milestone of roadmap.milestones) {
      markdown += `### Week ${milestone.week}: ${milestone.title}

**Description**: ${milestone.description}

**Primary Agents**: ${milestone.agents.join(', ')}

**Tasks**:
${milestone.tasks.map(t => `- [ ] ${t}`).join('\n')}

**Quality Gates**:
${milestone.qualityGates.map(q => `- ${q}`).join('\n')}

---

`;
    }

    markdown += `## 🎯 Quality Strategy

${roadmap.qualityStrategy.map(s => `- ${s}`).join('\n')}

---

## 🚀 Deployment Checklist

${roadmap.deploymentChecklist.join('\n')}

---

## 💡 Next Steps

1. **Review this roadmap** with your team and adjust timelines as needed
2. **Activate agents** using slash commands (e.g., \`/maria review test coverage\`)
3. **Start Week 1** by working with Alex-BA to refine requirements
4. **Enable proactive agents** by running \`versatil-daemon start\`
5. **Track progress** using Sarah-PM for sprint management

---

## 📚 Additional Resources

- **VERSATIL Documentation**: \`.claude/AGENTS.md\`, \`.claude/rules/README.md\`
- **Agent Slash Commands**: \`.claude/commands/\`
- **Framework Health Check**: \`npm run doctor\`
- **Quality Validation**: \`npm run validate\`

---

**🤖 Generated by VERSATIL SDLC Framework v6.4.0**
**Last Updated**: ${new Date().toISOString()}
`;

    return markdown;
  }
}
