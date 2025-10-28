/**
 * Simulation QA - Stub Implementation
 *
 * This is a minimal stub to satisfy TypeScript compilation.
 * Full implementation pending.
 */
import { BaseAgent, AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
export interface SimulationScenario {
    id: string;
    name: string;
    description: string;
    featureName: string;
    testCases: TestCase[];
    expectedOutcomes: string[];
    status?: 'passed' | 'failed' | 'untested';
    actualBehavior?: string;
    evidence?: string[];
    confidence?: number;
}
export interface TestCase {
    id: string;
    name: string;
    description?: string;
    input: any;
    expectedOutput: any;
    actualOutput?: any;
    passed?: boolean;
    timestamp?: number;
    actualResult?: any;
    executionTime?: number;
    action?: string;
    expectedResult?: any;
}
export interface CapabilityMatrix {
    framework: string;
    version: string;
    timestamp: Date;
    overallScore: number;
    categories: Record<string, CategoryCapability>;
    scenarios: SimulationScenario[];
    recommendations: any[];
    blockers: string[];
    readyForGitHub: boolean;
}
export interface CategoryCapability {
    promised: number;
    actual: number;
    percentage: number;
    status: 'working' | 'partial' | 'broken';
    evidence: string[];
}
export declare class SimulationQA extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    getCapabilityMatrix(): CapabilityMatrix;
    runScenario(scenario: SimulationScenario): Promise<TestCase[]>;
}
export default SimulationQA;
