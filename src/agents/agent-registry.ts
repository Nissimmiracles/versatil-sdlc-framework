import { VERSATILLogger } from '../utils/logger.js';
import { BaseAgent } from './base-agent.js';
import { EnhancedMaria } from './enhanced-maria.js';
import { EnhancedJames } from './enhanced-james.js';
import { EnhancedMarcus } from './enhanced-marcus.js';
import { SarahPm } from './sarah-pm.js';
import { AlexBa } from './alex-ba.js';
import { DrAiMl } from './dr-ai-ml.js';
import { DevopsDan } from './devops-dan.js';
import { SecuritySam } from './security-sam.js';
import { ArchitectureDan } from './architecture-dan.js';
import { DeploymentOrchestrator } from './deployment-orchestrator.js';
import { IntrospectiveAgent } from './introspective-agent.js';
import { SimulationQa } from './simulation-qa.js';

export class AgentRegistry {
  private agents = new Map<string, BaseAgent>();
  
  constructor() {
    this.registerAllAgents();
  }
  
  private registerAllAgents(): void {
    this.agents.set('enhanced-maria', new EnhancedMaria());
    this.agents.set('enhanced-james', new EnhancedJames());
    this.agents.set('enhanced-marcus', new EnhancedMarcus());
    this.agents.set('sarah-pm', new SarahPm());
    this.agents.set('alex-ba', new AlexBa());
    this.agents.set('dr-ai-ml', new DrAiMl());
    this.agents.set('devops-dan', new DevopsDan());
    this.agents.set('security-sam', new SecuritySam());
    this.agents.set('architecture-dan', new ArchitectureDan());
    this.agents.set('deployment-orchestrator', new DeploymentOrchestrator());
    this.agents.set('introspective-agent', new IntrospectiveAgent());
    this.agents.set('simulation-qa', new SimulationQa());
  }
  
  getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }
  
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  listAgents(): BaseAgent[] {
    return this.getAllAgents();
  }

  registerAgent(id: string, agent: BaseAgent): void {
    this.agents.set(id, agent);
  }

  getAgentsForFilePattern(pattern: string): BaseAgent[] {
    return this.getAllAgents();
  }

  getStatus(): any {
    return {
      totalAgents: this.agents.size,
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        name: agent.name,
        specialization: agent.specialization
      }))
    };
  }

  isHealthy(): boolean {
    return this.agents.size > 0;
  }
}

export const log = console;
