/**
 * VERSATIL SDLC Framework - Enhanced Agent Registry
 *
 * Central registry for all BMAD agents with enhanced capabilities
 * based on the Enhanced Maria analysis and configuration validation requirements
 */

import { BaseAgent } from './base-agent';
import { EnhancedMaria } from './enhanced-maria';
import { EnhancedJames } from './enhanced-james';
import { EnhancedMarcus } from './enhanced-marcus';
import { SarahPM } from './sarah-pm';
import { AlexBA } from './alex-ba';
import { DrAIML } from './dr-ai-ml';
import { DevOpsDan } from './devops-dan';
import { SecuritySam } from './security-sam';
import { IntrospectiveAgent } from './introspective-agent';
import { ArchitectureDan } from './architecture-dan';
import { DeploymentOrchestrator } from './deployment-orchestrator';
import { SimulationQA } from './simulation-qa';
import { log } from '../utils/logger';

export interface AgentMetadata {
  id: string;
  name: string;
  specialization: string;
  version: string;
  capabilities: string[];
  triggers: {
    filePatterns: string[];
    keywords: string[];
    errorPatterns: string[];
  };
  dependencies: string[];
  priority: number;
  autoActivate: boolean;
  collaborators: string[];
  mcpTools: string[];
}

export class AgentRegistry {
  private agents: Map<string, BaseAgent> = new Map();
  private metadata: Map<string, AgentMetadata> = new Map();

  constructor() {
    this.registerAllAgents();
  }

  private registerAllAgents(): void {
    console.log('🤖 Registering Enhanced BMAD Agents...');

    // Enhanced Maria - Advanced QA Lead with Configuration Validation (Intelligence-wrapped)
    this.registerAgent(new EnhancedMaria(), {
      id: 'enhanced-maria',
      name: 'Enhanced Maria',
      specialization: 'Advanced QA Lead & Configuration Validator',
      version: '2.0.0',
      capabilities: [
        'Configuration consistency validation',
        'Cross-file dependency checking',
        'Navigation integrity testing',
        'Production code cleanliness verification',
        'Real-time quality dashboard',
        'Performance monitoring',
        'Accessibility auditing',
        'Security basic validation'
      ],
      triggers: {
        filePatterns: [
          '*.test.*', '*.spec.*', 'tests/**/*', 'cypress/**/*',
          '*.config.*', 'package.json', 'tsconfig.json',
          '*.tsx', '*.jsx', '*.ts', '*.js' // Now monitors all code for quality
        ],
        keywords: [
          'test', 'bug', 'error', 'validation', 'quality', 'debug',
          'config', 'configuration', 'route', 'navigation', 'context'
        ],
        errorPatterns: [
          'test.*failed', 'assertion.*error', 'timeout.*error',
          'console.*error', 'warning.*detected', 'configuration.*error',
          'route.*not.*found', 'navigation.*error', 'context.*error'
        ]
      },
      dependencies: [
        '@testing-library/*', 'jest', 'vitest', 'cypress', 'playwright',
        'eslint', 'typescript'
      ],
      priority: 1, // Highest priority for quality enforcement
      autoActivate: true,
      collaborators: ['enhanced-james', 'enhanced-marcus', 'security-sam', 'devops-dan'],
      mcpTools: ['Chrome MCP', 'Playwright MCP', 'Testing MCP']
    });

    // Enhanced James - Advanced Frontend Specialist with Route-Navigation Validation (Intelligence-wrapped)
    this.registerAgent(new EnhancedJames(), {
      id: 'enhanced-james',
      name: 'Enhanced James',
      specialization: 'Advanced Frontend Specialist & Navigation Validator',
      version: '2.0.0',
      capabilities: [
        'Route-navigation consistency validation',
        'Cross-component dependency checking',
        'Context flow validation',
        'Profile context navigation integrity',
        'Component-route mapping verification',
        'Accessibility validation',
        'Frontend performance monitoring'
      ],
      triggers: {
        filePatterns: [
          '*.tsx', '*.jsx', '*.css', '*.scss', 'components/**/*',
          'pages/**/*', 'src/App.*', '*router*', '*navigation*'
        ],
        keywords: [
          'UI', 'component', 'styling', 'responsive', 'design',
          'router', 'navigation', 'route', 'context', 'profile'
        ],
        errorPatterns: [
          'No routes matched location', 'component.*not.*found',
          'styling.*error', 'CSS.*error', 'import.*component.*failed',
          'navigation.*error', 'route.*mismatch'
        ]
      },
      dependencies: [
        'react', 'react-router', 'react-router-dom', '@types/react',
        'antd', '@tremor/react', 'styled-components'
      ],
      priority: 2,
      autoActivate: true,
      collaborators: ['enhanced-marcus', 'enhanced-maria', 'security-sam'],
      mcpTools: ['Chrome MCP', 'Shadcn MCP', 'Storybook MCP']
    });

    // Enhanced Marcus - Advanced Backend Specialist with API-Frontend Integration (Intelligence-wrapped)
    this.registerAgent(new EnhancedMarcus(), {
      id: 'enhanced-marcus',
      name: 'Enhanced Marcus',
      specialization: 'Advanced Backend Specialist & Integration Validator',
      version: '2.0.0',
      capabilities: [
        'API-frontend integration validation',
        'Configuration drift detection',
        'Service consistency checking',
        'Cross-service dependency validation',
        'Backend-frontend contract verification',
        'Database schema validation',
        'Security pattern validation'
      ],
      triggers: {
        filePatterns: [
          '*.ts', 'src/services/**/*', '*.sql', 'supabase/**/*',
          'api/**/*', 'server/**/*', '*.api.*', '*config*'
        ],
        keywords: [
          'API', 'database', 'backend', 'Edge Function', 'auth',
          'server', 'service', 'integration', 'configuration'
        ],
        errorPatterns: [
          'Failed to resolve import', 'dependency.*not.*found',
          'module.*not.*found', 'API.*error', 'database.*error',
          'auth.*error', 'service.*error', 'integration.*failed'
        ]
      },
      dependencies: [
        '@supabase/supabase-js', '@refinedev/core', 'supabase',
        'express', 'fastify', 'prisma', 'typeorm'
      ],
      priority: 2,
      autoActivate: true,
      collaborators: ['enhanced-james', 'enhanced-maria', 'security-sam', 'devops-dan'],
      mcpTools: ['GitHub MCP', 'Database MCP', 'API MCP']
    });

    // DevOps-Dan - Infrastructure & Deployment Specialist
    this.registerAgent(new DevOpsDan(), {
      id: 'devops-dan',
      name: 'DevOps Dan',
      specialization: 'Infrastructure & Deployment Specialist',
      version: '1.0.0',
      capabilities: [
        'Docker containerization analysis',
        'Kubernetes orchestration validation',
        'CI/CD pipeline optimization',
        'Infrastructure as Code validation',
        'Cloud deployment analysis',
        'Performance monitoring setup',
        'Security infrastructure validation'
      ],
      triggers: {
        filePatterns: [
          'Dockerfile', 'docker-compose.*', '*.tf', '*.tfvars',
          '.github/workflows/*', 'kubernetes/**/*', 'k8s/**/*',
          '*.yml', '*.yaml', 'ansible/**/*'
        ],
        keywords: [
          'docker', 'kubernetes', 'terraform', 'infrastructure',
          'deployment', 'CI/CD', 'pipeline', 'cloud', 'monitoring'
        ],
        errorPatterns: [
          'docker.*build.*failed', 'kubernetes.*error', 'terraform.*error',
          'deployment.*failed', 'pipeline.*error'
        ]
      },
      dependencies: [
        'docker', 'kubernetes', 'terraform', 'ansible'
      ],
      priority: 3,
      autoActivate: true,
      collaborators: ['enhanced-marcus', 'security-sam', 'enhanced-maria'],
      mcpTools: ['Docker MCP', 'AWS MCP', 'Kubernetes MCP']
    });

    // Security-Sam - Security & Compliance Specialist
    this.registerAgent(new SecuritySam(), {
      id: 'security-sam',
      name: 'Security Sam',
      specialization: 'Security & Compliance Specialist',
      version: '1.0.0',
      capabilities: [
        'Vulnerability detection and analysis',
        'Authentication and authorization validation',
        'Input validation verification',
        'Secure coding practice enforcement',
        'Compliance checking',
        'Security configuration validation',
        'Penetration testing coordination'
      ],
      triggers: {
        filePatterns: [
          '*auth*', '*security*', '*login*', '*password*',
          '*.env*', '*config*', '*secret*', '*key*'
        ],
        keywords: [
          'auth', 'authentication', 'authorization', 'security',
          'vulnerability', 'encryption', 'password', 'token', 'jwt'
        ],
        errorPatterns: [
          'security.*error', 'auth.*failed', 'unauthorized',
          'vulnerability.*detected', 'security.*breach'
        ]
      },
      dependencies: [
        'bcrypt', 'jsonwebtoken', 'helmet', 'express-rate-limit'
      ],
      priority: 1, // High priority for security
      autoActivate: true,
      collaborators: ['enhanced-marcus', 'enhanced-james', 'devops-dan', 'enhanced-maria'],
      mcpTools: ['Security Scanner MCP', 'Vault MCP']
    });

    // IntrospectiveAgent - Self-Monitoring & Optimization Controller
    this.registerAgent(new IntrospectiveAgent(), {
      id: 'introspective-agent',
      name: 'IntrospectiveAgent',
      specialization: 'Self-Monitoring & Optimization Controller',
      version: '1.0.0',
      capabilities: [
        'Framework health monitoring',
        'Performance optimization engine',
        'Pattern recognition and analysis',
        'Meta-learning from usage patterns',
        'Autonomous improvement suggestions',
        'Tool-based controller system',
        'Real-time framework introspection'
      ],
      triggers: {
        filePatterns: [
          'src/**/*', 'package.json', 'tsconfig.json', 'jest.config.*',
          '*.ts', '*.js', 'tests/**/*', '.github/**/*'
        ],
        keywords: [
          'introspection', 'optimization', 'performance', 'monitoring',
          'self-improvement', 'analysis', 'framework', 'health'
        ],
        errorPatterns: [
          'performance.*degradation', 'memory.*leak', 'build.*slow',
          'test.*timeout', 'optimization.*needed'
        ]
      },
      dependencies: [
        'fs-extra', 'child_process', 'performance-hooks'
      ],
      priority: 4, // Lower priority, runs periodically
      autoActivate: false, // Manual or scheduled activation
      collaborators: ['enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'devops-dan', 'security-sam'],
      mcpTools: ['Read MCP', 'Grep MCP', 'Bash MCP', 'WebFetch MCP']
    });

    // Architecture-Dan - System Architecture & Design Patterns Specialist
    this.registerAgent(new ArchitectureDan(), {
      id: 'architecture-dan',
      name: 'Architecture Dan',
      specialization: 'System Architecture & Design Patterns Specialist',
      version: '1.0.0',
      capabilities: [
        'System architecture design and validation',
        'Design pattern recognition and implementation',
        'SOLID principles enforcement',
        'Architectural decision records (ADRs)',
        'Scalability assessment and optimization',
        'Integration pattern validation',
        'Technology stack consistency checking'
      ],
      triggers: {
        filePatterns: [
          '**/architecture/**', '**/design/**', '**/patterns/**',
          '*.architecture.*', '*.design.*', '**/adr/**',
          '**/config/**', '**/interfaces/**', '**/abstract/**'
        ],
        keywords: [
          'architecture', 'design', 'pattern', 'interface', 'abstract',
          'singleton', 'factory', 'observer', 'mvc', 'microservice',
          'scalability', 'coupling', 'cohesion', 'solid'
        ],
        errorPatterns: [
          'architecture.*violation', 'design.*pattern.*misuse',
          'tight.*coupling', 'single.*responsibility.*violation'
        ]
      },
      dependencies: [
        'typescript', 'eslint', 'architectural-linting'
      ],
      priority: 2,
      autoActivate: true,
      collaborators: ['enhanced-james', 'enhanced-marcus', 'security-sam', 'enhanced-maria'],
      mcpTools: ['Read MCP', 'Write MCP', 'Grep MCP']
    });

    // Deployment Orchestrator - Enhanced Deployment Pipeline Manager
    this.registerAgent(new DeploymentOrchestrator(), {
      id: 'deployment-orchestrator',
      name: 'Deployment Orchestrator',
      specialization: 'Advanced Deployment Pipeline & Release Management',
      version: '1.0.0',
      capabilities: [
        'Multi-environment deployment orchestration',
        'Blue-green deployment strategy implementation',
        'Deployment readiness validation',
        'Environment configuration management',
        'Health check automation and monitoring',
        'Rollback strategy coordination',
        'Docker and Kubernetes optimization'
      ],
      triggers: {
        filePatterns: [
          '**/deployment/**', '**/deploy/**', '**/k8s/**',
          'Dockerfile', 'docker-compose.yml', '*.deployment.*',
          '.github/workflows/**', '**/terraform/**', '**/helm/**'
        ],
        keywords: [
          'deployment', 'deploy', 'docker', 'kubernetes', 'k8s',
          'helm', 'terraform', 'blue-green', 'canary', 'rollback',
          'environment', 'production', 'staging', 'pipeline'
        ],
        errorPatterns: [
          'deployment.*failed', 'health.*check.*failed',
          'rollback.*triggered', 'environment.*error'
        ]
      },
      dependencies: [
        'docker', 'kubernetes', 'helm', 'terraform'
      ],
      priority: 2,
      autoActivate: true,
      collaborators: ['devops-dan', 'security-sam', 'enhanced-maria', 'enhanced-marcus'],
      mcpTools: ['Docker MCP', 'Kubernetes MCP', 'AWS MCP', 'GitHub MCP']
    });

    // SimulationQA - Pre-Development Reality Validator & Stress Tester
    this.registerAgent(new SimulationQA(), {
      id: 'simulation-qa',
      name: 'SimulationQA',
      specialization: 'Pre-Development Reality Validator & Stress Tester',
      version: '1.0.0',
      capabilities: [
        'Framework promise mapping and validation',
        'Autonomous test case generation',
        'Reality vs architecture validation',
        'Vapor-ware detection and elimination',
        'GitHub readiness assessment',
        'Capability matrix generation',
        'Brutal honesty reporting',
        'Live framework stress testing'
      ],
      triggers: {
        filePatterns: [
          'CLAUDE.md', 'README.md', 'package.json', 'src/**/*',
          '*.test.*', 'docs/**/*', '.github/**/*'
        ],
        keywords: [
          'simulation', 'validation', 'test', 'reality', 'stress',
          'capability', 'github', 'release', 'promise', 'claim'
        ],
        errorPatterns: [
          'promise.*not.*implemented', 'capability.*missing',
          'vapor.*detected', 'functionality.*broken'
        ]
      },
      dependencies: [
        'fs-extra', 'child_process', 'events'
      ],
      priority: 0, // Highest priority - validates everything else
      autoActivate: false, // Manual activation for stress testing
      collaborators: ['enhanced-maria', 'enhanced-james', 'enhanced-marcus', 'sarah-pm', 'alex-ba', 'introspective-agent'],
      mcpTools: ['Read MCP', 'Grep MCP', 'Bash MCP', 'Write MCP', 'Edit MCP']
    });

    console.log(`✅ Registered ${this.agents.size} Enhanced BMAD Agents (including SimulationQA)`);
    this.printAgentSummary();
  }

  private registerAgent(agent: BaseAgent, metadata: AgentMetadata): void {
    this.agents.set(metadata.id, agent);
    this.metadata.set(metadata.id, metadata);
    console.log(`   🤖 ${metadata.name} (${metadata.version}) - ${metadata.specialization}`);
  }

  private printAgentSummary(): void {
    console.log('\n📊 Enhanced BMAD Agent Capabilities Summary:');
    console.log('━'.repeat(80));

    for (const [id, metadata] of this.metadata) {
      console.log(`\n🤖 ${metadata.name}`);
      console.log(`   Specialization: ${metadata.specialization}`);
      console.log(`   Key Capabilities: ${metadata.capabilities.slice(0, 3).join(', ')}...`);
      console.log(`   Auto-Activate: ${metadata.autoActivate ? '✅' : '❌'}`);
      console.log(`   Priority: ${metadata.priority} | Collaborators: ${metadata.collaborators.length}`);
    }

    console.log('\n🎯 Key Enhancements Based on Enhanced Maria Analysis:');
    console.log('   ✅ Configuration consistency validation across all agents');
    console.log('   ✅ Cross-file dependency checking');
    console.log('   ✅ Navigation integrity testing (James)');
    console.log('   ✅ API-frontend integration validation (Marcus)');
    console.log('   ✅ Real-time quality dashboard (Maria)');
    console.log('   ✅ Production code cleanliness verification');
    console.log('   ✅ Enhanced collaboration between agents');
    console.log('━'.repeat(80));
  }

  // Public API methods
  public getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  public getAgentMetadata(id: string): AgentMetadata | undefined {
    return this.metadata.get(id);
  }

  public getAllAgents(): Map<string, BaseAgent> {
    return new Map(this.agents);
  }

  public getAllMetadata(): Map<string, AgentMetadata> {
    return new Map(this.metadata);
  }

  public getAgentsByCapability(capability: string): [string, BaseAgent][] {
    const result: [string, BaseAgent][] = [];

    for (const [id, metadata] of this.metadata) {
      if (metadata.capabilities.some(cap =>
        cap.toLowerCase().includes(capability.toLowerCase())
      )) {
        const agent = this.agents.get(id);
        if (agent) {
          result.push([id, agent]);
        }
      }
    }

    return result;
  }

  public getAgentsForFilePattern(filePath: string): [string, BaseAgent][] {
    const result: [string, BaseAgent][] = [];
    const fileName = filePath.split('/').pop() || '';

    for (const [id, metadata] of this.metadata) {
      if (!metadata.autoActivate) continue;

      const matches = metadata.triggers.filePatterns.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(fileName) || regex.test(filePath);
        }
        return fileName.includes(pattern) || filePath.includes(pattern);
      });

      if (matches) {
        const agent = this.agents.get(id);
        if (agent) {
          result.push([id, agent]);
        }
      }
    }

    // Sort by priority
    return result.sort((a, b) => {
      const priorityA = this.metadata.get(a[0])?.priority || 999;
      const priorityB = this.metadata.get(b[0])?.priority || 999;
      return priorityA - priorityB;
    });
  }

  public getAgentsForKeywords(keywords: string[]): [string, BaseAgent][] {
    const result: [string, BaseAgent][] = [];

    for (const [id, metadata] of this.metadata) {
      const hasMatchingKeyword = keywords.some(keyword =>
        metadata.triggers.keywords.some(trigger =>
          trigger.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(trigger.toLowerCase())
        )
      );

      if (hasMatchingKeyword) {
        const agent = this.agents.get(id);
        if (agent) {
          result.push([id, agent]);
        }
      }
    }

    return result.sort((a, b) => {
      const priorityA = this.metadata.get(a[0])?.priority || 999;
      const priorityB = this.metadata.get(b[0])?.priority || 999;
      return priorityA - priorityB;
    });
  }

  public getCollaborators(agentId: string): BaseAgent[] {
    const metadata = this.metadata.get(agentId);
    if (!metadata) return [];

    return metadata.collaborators
      .map(id => this.agents.get(id))
      .filter((agent): agent is BaseAgent => agent !== undefined);
  }

  public getAgentHealth(): Record<string, unknown> {
    const health: Record<string, unknown> = {};

    for (const [agentId, metadata] of this.metadata) {
      health[agentId] = {
        name: metadata.name,
        version: metadata.version,
        capabilities: metadata.capabilities.length,
        collaborators: metadata.collaborators.length,
        autoActivate: metadata.autoActivate,
        priority: metadata.priority
      };
    }

    return health;
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();
export default agentRegistry;