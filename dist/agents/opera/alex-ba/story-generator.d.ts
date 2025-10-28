/**
 * Story Generator for Alex-BA
 * Automatically generates user stories from feature requests
 */
import { EventEmitter } from 'events';
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
    asA: string;
    iWant: string;
    soThat: string;
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
export declare class StoryGenerator extends EventEmitter {
    private config;
    private storyCounter;
    constructor(config?: Partial<StoryGeneratorConfig>);
    /**
     * Generate a user story from a feature request
     */
    generateStory(request: FeatureRequest): Promise<UserStory>;
    /**
     * Extract user story components (As a, I want, So that)
     */
    private extractStoryComponents;
    /**
     * Generate acceptance criteria in Gherkin format
     */
    private generateAcceptanceCriteria;
    /**
     * Identify functional requirements
     */
    private identifyFunctionalRequirements;
    /**
     * Identify non-functional requirements
     */
    private identifyNonFunctionalRequirements;
    /**
     * Extract technical notes
     */
    private extractTechnicalNotes;
    /**
     * Estimate story points using complexity heuristics
     */
    private estimateStoryPoints;
    /**
     * Create markdown file for the user story
     */
    private createStoryFile;
    /**
     * Generate markdown content for user story
     */
    private generateMarkdown;
    /**
     * Get next story number
     */
    private getNextStoryNumber;
    /**
     * Helper: Infer epic from feature request
     */
    private inferEpic;
    /**
     * Helper: Infer priority from feature request
     */
    private inferPriority;
    /**
     * Helper: Extract action verb from goal
     */
    private actionFromGoal;
    /**
     * Helper: Convert title to slug
     */
    private slugify;
}
