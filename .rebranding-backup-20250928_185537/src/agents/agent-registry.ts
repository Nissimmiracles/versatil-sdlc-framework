import { VERSATILLogger } from '../utils/logger';
import { BaseAgent } from './base-agent';
import { EnhancedMaria } from './enhanced-maria';
import { EnhancedJames } from './enhanced-james';
import { EnhancedMarcus } from './enhanced-marcus';
import { SarahPm } from './sarah-pm';
import { AlexBa } from './alex-ba';
import { DrAiMl } from './dr-ai-ml';
import { DevopsDan } from './devops-dan';
import { SecuritySam } from './security-sam';
import { ArchitectureDan } from './architecture-dan';
import { DeploymentOrchestrator } from './deployment-orchestrator';
import { IntrospectiveAgent } from './introspective-agent';
import { SimulationQa } from './simulation-qa';

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
}

export const log = console;
