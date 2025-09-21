import { BaseAgent, AgentActivationContext, AgentResponse, ValidationResults } from './base-agent';

/**
 * DevOps-Dan - Infrastructure & Deployment Specialist
 * Handles Docker, Kubernetes, CI/CD, Terraform, and cloud infrastructure
 */
export class DevOpsDan extends BaseAgent {
  constructor() {
    super('devops-dan', 'Infrastructure & Deployment');
  }

  protected async runAgentSpecificValidation(context: AgentActivationContext): Promise<Partial<ValidationResults>> {
    const patterns = this.analyzeInfrastructurePatterns(context.content || '', context.filePath);
    const recommendations = this.generateRecommendations(patterns, context.matchedKeywords || []);

    return {
      issues: [],
      warnings: [],
      recommendations: recommendations.map(r => ({
        type: r.type,
        priority: r.priority as any,
        message: r.message
      }))
    };
  }

  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const { trigger, filePath, content, matchedKeywords = [] } = context;

    // Analyze infrastructure patterns
    const infrastructurePatterns = this.analyzeInfrastructurePatterns(content, filePath);
    const recommendations = this.generateRecommendations(infrastructurePatterns, matchedKeywords);

    return {
      agentId: 'devops-dan',
      message: this.generateResponse(infrastructurePatterns, recommendations),
      suggestions: recommendations,
      priority: this.calculatePriority(infrastructurePatterns),
      handoffTo: this.determineHandoffs(infrastructurePatterns),
      context: {
        infrastructureType: infrastructurePatterns.type,
        complexity: infrastructurePatterns.complexity,
        securityLevel: infrastructurePatterns.securityLevel,
        scalabilityNeeds: infrastructurePatterns.scalabilityNeeds
      }
    };
  }

  private analyzeInfrastructurePatterns(content: string, filePath?: string) {
    const patterns = {
      type: 'unknown',
      complexity: 'low',
      securityLevel: 'basic',
      scalabilityNeeds: 'minimal',
      technologies: [] as string[],
      containers: false,
      orchestration: false,
      cicd: false,
      monitoring: false,
      security: false
    };

    if (!content) return patterns;

    // Detect infrastructure technologies
    const techPatterns = {
      docker: /dockerfile|docker-compose|FROM |RUN |COPY |ADD |WORKDIR /i,
      kubernetes: /apiVersion:|kind:|metadata:|spec:|deployment|service|ingress|configmap/i,
      terraform: /resource |provider |variable |output |data |module /i,
      ansible: /playbook|hosts:|vars:|tasks:|become:|notify:/i,
      helm: /chart\.yaml|values\.yaml|templates\/|\.tpl/i,
      cicd: /pipeline|workflow|build:|deploy:|test:|stage:|job:/i,
      aws: /aws_|AWS::|s3|ec2|lambda|rds|vpc|iam/i,
      azure: /Microsoft\.|azurerm_|Azure::|storage|webapp|keyvault/i,
      gcp: /google_|gcp_|cloud_|compute|storage|functions/i,
      monitoring: /prometheus|grafana|jaeger|zipkin|datadog|newrelic/i,
      security: /vault|secrets|encryption|tls|ssl|certificate|auth/i
    };

    Object.entries(techPatterns).forEach(([tech, pattern]) => {
      if (pattern.test(content)) {
        patterns.technologies.push(tech);

        switch (tech) {
          case 'docker':
            patterns.containers = true;
            break;
          case 'kubernetes':
          case 'helm':
            patterns.orchestration = true;
            patterns.complexity = 'high';
            break;
          case 'terraform':
          case 'ansible':
            patterns.complexity = patterns.complexity === 'low' ? 'medium' : 'high';
            break;
          case 'cicd':
            patterns.cicd = true;
            break;
          case 'monitoring':
            patterns.monitoring = true;
            break;
          case 'security':
            patterns.security = true;
            patterns.securityLevel = 'advanced';
            break;
        }
      }
    });

    // Determine primary type
    if (patterns.orchestration) {
      patterns.type = 'orchestration';
      patterns.scalabilityNeeds = 'high';
    } else if (patterns.containers) {
      patterns.type = 'containerization';
      patterns.scalabilityNeeds = 'medium';
    } else if (patterns.technologies.includes('terraform') || patterns.technologies.includes('ansible')) {
      patterns.type = 'infrastructure-as-code';
    } else if (patterns.cicd) {
      patterns.type = 'ci-cd';
    }

    return patterns;
  }

  private generateRecommendations(patterns: any, keywords: string[]) {
    const recommendations = [];

    // Container recommendations
    if (patterns.containers && !patterns.monitoring) {
      recommendations.push({
        type: 'enhancement',
        message: 'Consider adding container monitoring with Prometheus and Grafana',
        priority: 'medium'
      });
    }

    // Security recommendations
    if (patterns.containers && patterns.securityLevel === 'basic') {
      recommendations.push({
        type: 'security',
        message: 'Implement container security scanning and vulnerability assessment',
        priority: 'high'
      });
    }

    // Orchestration recommendations
    if (patterns.containers && !patterns.orchestration && patterns.complexity === 'high') {
      recommendations.push({
        type: 'scalability',
        message: 'Consider migrating to Kubernetes for better orchestration and scaling',
        priority: 'medium'
      });
    }

    // CI/CD recommendations
    if (!patterns.cicd && patterns.type !== 'unknown') {
      recommendations.push({
        type: 'automation',
        message: 'Implement CI/CD pipeline for automated deployment and testing',
        priority: 'high'
      });
    }

    // Backup and disaster recovery
    if (patterns.type === 'orchestration' || patterns.scalabilityNeeds === 'high') {
      recommendations.push({
        type: 'reliability',
        message: 'Implement backup strategy and disaster recovery procedures',
        priority: 'high'
      });
    }

    return recommendations;
  }

  private generateResponse(patterns: any, recommendations: any[]) {
    let response = `🔧 **DevOps-Dan Analysis** - Infrastructure & Deployment\n\n`;

    response += `**Infrastructure Type**: ${patterns.type}\n`;
    response += `**Complexity Level**: ${patterns.complexity}\n`;
    response += `**Technologies Detected**: ${patterns.technologies.join(', ') || 'None'}\n\n`;

    if (patterns.containers) {
      response += `✅ **Containerization**: Docker detected\n`;
    }
    if (patterns.orchestration) {
      response += `✅ **Orchestration**: Kubernetes/Helm detected\n`;
    }
    if (patterns.cicd) {
      response += `✅ **CI/CD**: Pipeline configuration detected\n`;
    }
    if (patterns.monitoring) {
      response += `✅ **Monitoring**: Observability tools detected\n`;
    }

    if (recommendations.length > 0) {
      response += `\n**Recommendations**:\n`;
      recommendations.forEach((rec, index) => {
        response += `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}\n`;
      });
    }

    response += `\n**Security Level**: ${patterns.securityLevel}`;
    response += `\n**Scalability Needs**: ${patterns.scalabilityNeeds}`;

    return response;
  }

  private calculatePriority(patterns: any): 'low' | 'medium' | 'high' | 'critical' {
    if (patterns.type === 'orchestration' && patterns.security) {
      return 'critical';
    }
    if (patterns.complexity === 'high' || patterns.scalabilityNeeds === 'high') {
      return 'high';
    }
    if (patterns.containers || patterns.cicd) {
      return 'medium';
    }
    return 'low';
  }

  private determineHandoffs(patterns: any): string[] {
    const handoffs = [];

    if (patterns.security || patterns.securityLevel === 'advanced') {
      handoffs.push('security-sam');
    }
    if (patterns.monitoring) {
      handoffs.push('maria-qa'); // For monitoring tests
    }
    if (patterns.cicd) {
      handoffs.push('marcus-backend', 'james-frontend'); // For deployment coordination
    }
    if (patterns.type !== 'unknown') {
      handoffs.push('sarah-pm'); // For project coordination
    }

    return handoffs;
  }
}

export default DevOpsDan;