/**
 * Story Generator for Alex-BA
 * Automatically generates user stories from feature requests
 */

import { EventEmitter } from 'events';
import { writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface FeatureRequest {
  title: string;
  description: string;
  requester?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  keywords: string[];
  context: string;
  timestamp: number;
}

export interface UserStory {
  id: string;
  number: number;
  epic?: string;
  title: string;
  asA: string;          // User role
  iWant: string;        // Goal/desire
  soThat: string;       // Benefit/value
  acceptanceCriteria: AcceptanceCriteria[];
  functionalRequirements: Requirement[];
  nonFunctionalRequirements: NonFunctionalRequirements;
  technicalNotes: TechnicalNotes;
  estimatedPoints: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'draft' | 'review' | 'approved' | 'in-progress' | 'completed';
  createdAt: Date;
  filepath: string;
}

export interface AcceptanceCriteria {
  scenario: string;
  given: string[];
  when: string[];
  then: string[];
}

export interface Requirement {
  priority: 'P0' | 'P1' | 'P2';
  description: string;
}

export interface NonFunctionalRequirements {
  performance?: {
    responseTime?: string;
    throughput?: string;
    loadTime?: string;
  };
  security?: {
    authentication?: string;
    authorization?: string;
    dataValidation?: string;
  };
  usability?: {
    accessibility?: string;
    mobileSupport?: string;
    browserSupport?: string;
  };
}

export interface TechnicalNotes {
  apiRequirements?: string[];
  dataModel?: string[];
  integrations?: string[];
}

export interface StoryGeneratorConfig {
  outputDir: string;
  autoNumber: boolean;
  templatePath?: string;
  autoHandoff: boolean;
}

export class StoryGenerator extends EventEmitter {
  private config: StoryGeneratorConfig;
  private storyCounter: number = 0;

  constructor(config: Partial<StoryGeneratorConfig> = {}) {
    super();
    this.config = {
      outputDir: 'docs/user-stories',
      autoNumber: true,
      autoHandoff: true,
      ...config
    };
  }

  /**
   * Generate a user story from a feature request
   */
  async generateStory(request: FeatureRequest): Promise<UserStory> {
    try {
      // Extract user story components from request
      const storyComponents = await this.extractStoryComponents(request);

      // Generate acceptance criteria
      const acceptanceCriteria = await this.generateAcceptanceCriteria(request, storyComponents);

      // Identify functional requirements
      const functionalRequirements = await this.identifyFunctionalRequirements(request);

      // Identify non-functional requirements
      const nonFunctionalRequirements = await this.identifyNonFunctionalRequirements(request);

      // Extract technical notes
      const technicalNotes = await this.extractTechnicalNotes(request);

      // Estimate story points
      const estimatedPoints = this.estimateStoryPoints(request, functionalRequirements);

      // Get next story number
      const storyNumber = await this.getNextStoryNumber();

      const story: UserStory = {
        id: `US-${String(storyNumber).padStart(3, '0')}`,
        number: storyNumber,
        epic: this.inferEpic(request),
        title: request.title,
        asA: storyComponents.role,
        iWant: storyComponents.goal,
        soThat: storyComponents.benefit,
        acceptanceCriteria,
        functionalRequirements,
        nonFunctionalRequirements,
        technicalNotes,
        estimatedPoints,
        priority: request.priority || this.inferPriority(request),
        status: 'draft',
        createdAt: new Date(),
        filepath: ''
      };

      // Generate markdown file
      const filepath = await this.createStoryFile(story);
      story.filepath = filepath;

      this.emit('story:generated', story);
      return story;

    } catch (error: any) {
      this.emit('story:error', { request, error: error.message });
      throw error;
    }
  }

  /**
   * Extract user story components (As a, I want, So that)
   */
  private async extractStoryComponents(request: FeatureRequest): Promise<{
    role: string;
    goal: string;
    benefit: string;
  }> {
    // Simple heuristic-based extraction (can be enhanced with LLM)
    const keywords = request.keywords.join(' ').toLowerCase();
    const description = request.description.toLowerCase();

    // Infer user role
    let role = 'user';
    if (keywords.includes('admin') || description.includes('administrator')) {
      role = 'administrator';
    } else if (keywords.includes('developer') || keywords.includes('engineer')) {
      role = 'developer';
    } else if (keywords.includes('manager') || keywords.includes('pm')) {
      role = 'project manager';
    }

    // Extract goal (the "I want" part)
    const goal = request.title;

    // Infer benefit (the "So that" part)
    let benefit = 'I can accomplish my tasks more efficiently';
    if (keywords.includes('auth') || keywords.includes('security')) {
      benefit = 'my data and account remain secure';
    } else if (keywords.includes('performance') || keywords.includes('fast')) {
      benefit = 'I can work more quickly';
    } else if (keywords.includes('accessible') || keywords.includes('a11y')) {
      benefit = 'the system is accessible to all users';
    }

    return { role, goal, benefit };
  }

  /**
   * Generate acceptance criteria in Gherkin format
   */
  private async generateAcceptanceCriteria(
    request: FeatureRequest,
    components: { role: string; goal: string; benefit: string }
  ): Promise<AcceptanceCriteria[]> {
    const criteria: AcceptanceCriteria[] = [];

    // Happy path scenario
    criteria.push({
      scenario: 'Happy Path - Feature Works as Expected',
      given: ['the system is operational', `the ${components.role} is authenticated`],
      when: [`the ${components.role} ${this.actionFromGoal(components.goal)}`],
      then: ['the action completes successfully', 'appropriate feedback is shown to the user']
    });

    // Error handling scenario
    criteria.push({
      scenario: 'Error Handling - Invalid Input',
      given: ['the system is operational'],
      when: ['the user provides invalid input'],
      then: ['the system shows a clear error message', 'the system prevents invalid state changes']
    });

    // Edge case scenario if relevant
    if (request.keywords.some(k => k.toLowerCase().includes('auth') || k.toLowerCase().includes('security'))) {
      criteria.push({
        scenario: 'Security - Unauthorized Access',
        given: ['the user is not authenticated or lacks permissions'],
        when: ['the user attempts to access the feature'],
        then: ['the system denies access', 'an appropriate error message is displayed']
      });
    }

    return criteria;
  }

  /**
   * Identify functional requirements
   */
  private async identifyFunctionalRequirements(request: FeatureRequest): Promise<Requirement[]> {
    const requirements: Requirement[] = [];

    // Add core requirements based on keywords
    requirements.push({
      priority: 'P0',
      description: request.title
    });

    if (request.keywords.some(k => k.toLowerCase().includes('ui') || k.toLowerCase().includes('interface'))) {
      requirements.push({
        priority: 'P0',
        description: 'User interface must be intuitive and responsive'
      });
    }

    if (request.keywords.some(k => k.toLowerCase().includes('api'))) {
      requirements.push({
        priority: 'P0',
        description: 'API endpoints must be RESTful and follow best practices'
      });
    }

    if (request.keywords.some(k => k.toLowerCase().includes('test'))) {
      requirements.push({
        priority: 'P1',
        description: 'Comprehensive test coverage (>80%)'
      });
    }

    return requirements;
  }

  /**
   * Identify non-functional requirements
   */
  private async identifyNonFunctionalRequirements(request: FeatureRequest): Promise<NonFunctionalRequirements> {
    const nfr: NonFunctionalRequirements = {};

    // Performance requirements
    nfr.performance = {
      responseTime: '< 200ms for API calls',
      throughput: 'Support 100 concurrent users',
      loadTime: '< 2 seconds for page load'
    };

    // Security requirements
    if (request.keywords.some(k => k.toLowerCase().includes('auth') || k.toLowerCase().includes('security'))) {
      nfr.security = {
        authentication: 'OAuth 2.0 or JWT required',
        authorization: 'Role-based access control (RBAC)',
        dataValidation: 'Input sanitization and validation required'
      };
    }

    // Usability requirements
    nfr.usability = {
      accessibility: 'WCAG 2.1 AA compliance',
      mobileSupport: 'Responsive design for mobile devices',
      browserSupport: 'Chrome, Firefox, Safari, Edge (latest versions)'
    };

    return nfr;
  }

  /**
   * Extract technical notes
   */
  private async extractTechnicalNotes(request: FeatureRequest): Promise<TechnicalNotes> {
    const notes: TechnicalNotes = {};

    // API requirements
    if (request.keywords.some(k => k.toLowerCase().includes('api'))) {
      notes.apiRequirements = [
        'RESTful API design',
        'JSON request/response format',
        'Proper HTTP status codes'
      ];
    }

    // Data model
    if (request.keywords.some(k => k.toLowerCase().includes('database') || k.toLowerCase().includes('data'))) {
      notes.dataModel = [
        'Define database schema',
        'Add appropriate indexes',
        'Implement data validation'
      ];
    }

    // Integrations
    if (request.keywords.some(k => k.toLowerCase().includes('integration') || k.toLowerCase().includes('third-party'))) {
      notes.integrations = [
        'Identify third-party services required',
        'Define integration contracts',
        'Implement error handling for external services'
      ];
    }

    return notes;
  }

  /**
   * Estimate story points using complexity heuristics
   */
  private estimateStoryPoints(request: FeatureRequest, requirements: Requirement[]): number {
    let points = 3; // Base complexity

    // Adjust based on number of requirements
    if (requirements.length > 5) points += 2;
    if (requirements.length > 10) points += 3;

    // Adjust based on keywords
    const keywords = request.keywords.join(' ').toLowerCase();
    if (keywords.includes('complex') || keywords.includes('integration')) points += 3;
    if (keywords.includes('simple') || keywords.includes('quick')) points -= 1;
    if (keywords.includes('auth') || keywords.includes('security')) points += 2;

    // Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
    const fibonacci = [1, 2, 3, 5, 8, 13, 21];
    return fibonacci.reduce((prev, curr) =>
      Math.abs(curr - points) < Math.abs(prev - points) ? curr : prev
    );
  }

  /**
   * Create markdown file for the user story
   */
  private async createStoryFile(story: UserStory): Promise<string> {
    const outputDir = this.config.outputDir;

    // Ensure output directory exists
    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    const filename = `${story.id}-${this.slugify(story.title)}.md`;
    const filepath = join(outputDir, filename);

    const content = this.generateMarkdown(story);

    await writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Generate markdown content for user story
   */
  private generateMarkdown(story: UserStory): string {
    let md = `# User Story: ${story.title}\n\n`;
    md += `**Story ID**: ${story.id}\n`;
    md += `**Epic**: ${story.epic || 'N/A'}\n`;
    md += `**Created**: ${story.createdAt.toISOString().split('T')[0]}\n`;
    md += `**Author**: Alex-BA (Business Analyst)\n`;
    md += `**Status**: ${story.status}\n`;
    md += `**Priority**: ${story.priority}\n`;
    md += `**Estimated Points**: ${story.estimatedPoints}\n\n`;

    md += `---\n\n`;

    md += `## User Story\n\n`;
    md += `**As a** ${story.asA}\n`;
    md += `**I want** ${story.iWant}\n`;
    md += `**So that** ${story.soThat}\n\n`;

    md += `---\n\n`;

    md += `## Acceptance Criteria\n\n`;
    story.acceptanceCriteria.forEach((ac, index) => {
      md += `### Scenario ${index + 1}: ${ac.scenario}\n\n`;
      md += `\`\`\`gherkin\n`;
      ac.given.forEach(g => md += `Given ${g}\n`);
      ac.when.forEach(w => md += `When ${w}\n`);
      ac.then.forEach(t => md += `Then ${t}\n`);
      md += `\`\`\`\n\n`;
    });

    md += `---\n\n`;

    md += `## Functional Requirements\n\n`;
    const p0Reqs = story.functionalRequirements.filter(r => r.priority === 'P0');
    const p1Reqs = story.functionalRequirements.filter(r => r.priority === 'P1');
    const p2Reqs = story.functionalRequirements.filter(r => r.priority === 'P2');

    if (p0Reqs.length > 0) {
      md += `### Must Have (P0)\n`;
      p0Reqs.forEach(r => md += `- [ ] ${r.description}\n`);
      md += `\n`;
    }

    if (p1Reqs.length > 0) {
      md += `### Should Have (P1)\n`;
      p1Reqs.forEach(r => md += `- [ ] ${r.description}\n`);
      md += `\n`;
    }

    if (p2Reqs.length > 0) {
      md += `### Nice to Have (P2)\n`;
      p2Reqs.forEach(r => md += `- [ ] ${r.description}\n`);
      md += `\n`;
    }

    md += `---\n\n`;

    md += `## Non-Functional Requirements\n\n`;

    if (story.nonFunctionalRequirements.performance) {
      md += `### Performance\n`;
      const perf = story.nonFunctionalRequirements.performance;
      if (perf.responseTime) md += `- **Response Time**: ${perf.responseTime}\n`;
      if (perf.throughput) md += `- **Throughput**: ${perf.throughput}\n`;
      if (perf.loadTime) md += `- **Load Time**: ${perf.loadTime}\n`;
      md += `\n`;
    }

    if (story.nonFunctionalRequirements.security) {
      md += `### Security\n`;
      const sec = story.nonFunctionalRequirements.security;
      if (sec.authentication) md += `- **Authentication**: ${sec.authentication}\n`;
      if (sec.authorization) md += `- **Authorization**: ${sec.authorization}\n`;
      if (sec.dataValidation) md += `- **Data Validation**: ${sec.dataValidation}\n`;
      md += `\n`;
    }

    if (story.nonFunctionalRequirements.usability) {
      md += `### Usability\n`;
      const usability = story.nonFunctionalRequirements.usability;
      if (usability.accessibility) md += `- **Accessibility**: ${usability.accessibility}\n`;
      if (usability.mobileSupport) md += `- **Mobile Support**: ${usability.mobileSupport}\n`;
      if (usability.browserSupport) md += `- **Browser Support**: ${usability.browserSupport}\n`;
      md += `\n`;
    }

    md += `---\n\n`;

    md += `## Technical Notes\n\n`;

    if (story.technicalNotes.apiRequirements && story.technicalNotes.apiRequirements.length > 0) {
      md += `### API Requirements\n`;
      story.technicalNotes.apiRequirements.forEach(req => md += `- ${req}\n`);
      md += `\n`;
    }

    if (story.technicalNotes.dataModel && story.technicalNotes.dataModel.length > 0) {
      md += `### Data Model\n`;
      story.technicalNotes.dataModel.forEach(model => md += `- ${model}\n`);
      md += `\n`;
    }

    if (story.technicalNotes.integrations && story.technicalNotes.integrations.length > 0) {
      md += `### Third-Party Integrations\n`;
      story.technicalNotes.integrations.forEach(int => md += `- ${int}\n`);
      md += `\n`;
    }

    md += `---\n\n`;

    md += `## Definition of Done (DoD)\n\n`;
    md += `- [ ] Code implemented and peer-reviewed\n`;
    md += `- [ ] All acceptance criteria met\n`;
    md += `- [ ] Unit tests written and passing (>80% coverage)\n`;
    md += `- [ ] Integration tests passing\n`;
    md += `- [ ] Security scan completed (no critical issues)\n`;
    md += `- [ ] Performance benchmarks met\n`;
    md += `- [ ] Accessibility audit passed (WCAG 2.1 AA)\n`;
    md += `- [ ] Documentation updated\n`;
    md += `- [ ] Deployed to staging environment\n\n`;

    md += `---\n\n`;

    md += `**Story Generated by**: Alex-BA (VERSATIL SDLC Framework)\n`;
    md += `**Framework Version**: 1.0.0\n`;
    md += `**Auto-Generated**: ${new Date().toISOString()}\n`;

    return md;
  }

  /**
   * Get next story number
   */
  private async getNextStoryNumber(): Promise<number> {
    if (!this.config.autoNumber) {
      return ++this.storyCounter;
    }

    try {
      const files = await readdir(this.config.outputDir);
      const storyNumbers = files
        .filter(f => f.startsWith('US-'))
        .map(f => {
          const match = f.match(/US-(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => n > 0);

      return storyNumbers.length > 0 ? Math.max(...storyNumbers) + 1 : 1;
    } catch {
      return 1; // Start from 1 if directory doesn't exist
    }
  }

  /**
   * Helper: Infer epic from feature request
   */
  private inferEpic(request: FeatureRequest): string {
    const keywords = request.keywords.join(' ').toLowerCase();

    if (keywords.includes('auth') || keywords.includes('login')) return 'Authentication & Authorization';
    if (keywords.includes('payment') || keywords.includes('checkout')) return 'E-Commerce & Payments';
    if (keywords.includes('dashboard') || keywords.includes('analytics')) return 'Analytics & Reporting';
    if (keywords.includes('api')) return 'API Development';
    if (keywords.includes('ui') || keywords.includes('ux')) return 'User Experience';

    return 'General Development';
  }

  /**
   * Helper: Infer priority from feature request
   */
  private inferPriority(request: FeatureRequest): 'P0' | 'P1' | 'P2' | 'P3' {
    const description = request.description.toLowerCase();

    if (description.includes('critical') || description.includes('urgent')) return 'P0';
    if (description.includes('important') || description.includes('high priority')) return 'P1';
    if (description.includes('nice to have') || description.includes('optional')) return 'P3';

    return 'P2'; // Medium by default
  }

  /**
   * Helper: Extract action verb from goal
   */
  private actionFromGoal(goal: string): string {
    const actionVerbs = ['create', 'update', 'delete', 'view', 'manage', 'configure', 'enable', 'disable'];
    const lowerGoal = goal.toLowerCase();

    for (const verb of actionVerbs) {
      if (lowerGoal.includes(verb)) {
        return `${verb}s the ${goal.toLowerCase().replace(verb, '').trim()}`;
      }
    }

    return `uses the ${goal.toLowerCase()}`;
  }

  /**
   * Helper: Convert title to slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
