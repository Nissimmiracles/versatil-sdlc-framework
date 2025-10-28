export interface SimulationScenario {
    id: string;
    name: string;
    status: string;
    featureName?: string;
    evidence?: any;
    confidence?: number;
    testCases?: TestCase[];
    promise?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
}
export interface TestCase {
    id: string;
    name: string;
    description?: string;
    timestamp?: number;
    passed?: boolean;
    actualResult?: any;
    executionTime?: number;
    action?: string;
    expectedResult?: any;
}
export interface CapabilityMatrix {
    [key: string]: any;
}
export { SimulationQa as SimulationQA };
import { BaseAgent, AgentResponse, AgentActivationContext } from './base-agent.js';
export declare class SimulationQa extends BaseAgent {
    name: string;
    id: string;
    specialization: string;
    systemPrompt: string;
    activate(context: AgentActivationContext): Promise<AgentResponse>;
    getCapabilityMatrix(): Promise<CapabilityMatrix | null>;
}
