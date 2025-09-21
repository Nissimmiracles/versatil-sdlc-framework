/**
 * VERSATIL SDLC Framework - Deployment Orchestrator
 * Enhanced Deployment Pipeline for Complete SDLC Flywheel
 *
 * Addresses the 70% gap in Deployment & Release phase
 */

import { BaseAgent, AgentActivationContext, AgentResponse } from './base-agent';
import { VERSATILLogger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface DeploymentEnvironment {
  name: string;
  type: 'development' | 'staging' | 'production';
  url: string;
  healthCheckUrl: string;
  config: Record<string, any>;
  deploymentStrategy: 'blue-green' | 'rolling' | 'canary';
}

export interface DeploymentPipeline {
  id: string;
  name: string;
  environments: DeploymentEnvironment[];
  stages: DeploymentStage[];
  rollbackStrategy: RollbackStrategy;
}

export interface DeploymentStage {
  name: string;
  type: 'build' | 'test' | 'deploy' | 'verify' | 'promote';
  environment: string;
  commands: string[];
  healthChecks: HealthCheck[];
  rollbackTriggers: string[];
}

export interface RollbackStrategy {
  automatic: boolean;
  triggers: string[];
  maxAttempts: number;
  notifications: string[];
}

export interface HealthCheck {
  name: string;
  type: 'http' | 'tcp' | 'command';
  target: string;
  timeout: number;
  retries: number;
  successCriteria: string;
}

export class DeploymentOrchestrator extends BaseAgent {
  id = 'deployment-orchestrator';
  name = 'Deployment Orchestrator';
  specialization = 'Advanced Deployment Pipeline & Release Management';

  private deploymentPipelines: Map<string, DeploymentPipeline> = new Map();
  private activeDeployments: Map<string, any> = new Map();

  constructor(logger: VERSATILLogger) {
    super(logger);
    this.initializeDeploymentPipelines();
  }

  /**
   * Enhanced Agent Activation for Deployment Management
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    this.logger.info('🚀 Deployment Orchestrator activated', {
      filePath: context.filePath,
      trigger: context.trigger
    }, 'deployment-orchestrator');

    const validationResults = await this.runStandardValidation(context);

    if (!validationResults.isValid) {
      return {
        agentId: this.id,
        success: false,
        suggestions: validationResults.errors.map(error => ({
          type: 'error',
          message: error,
          line: 0,
          file: context.filePath
        })),
        context: validationResults
      };
    }

    // Deployment-specific validation and orchestration
    const deploymentResults = await this.runDeploymentOrchestration(context);

    return {
      agentId: this.id,
      success: deploymentResults.isValid,
      suggestions: [
        ...deploymentResults.suggestions,
        ...await this.generateDeploymentInsights(context)
      ],
      context: {
        ...validationResults,
        deployment: deploymentResults
      }
    };
  }

  /**
   * Deployment orchestration logic
   */
  private async runDeploymentOrchestration(context: AgentActivationContext): Promise<any> {
    const suggestions = [];
    let isValid = true;

    try {
      // Detect deployment configuration
      const deploymentConfig = await this.detectDeploymentConfiguration(context.filePath);

      if (deploymentConfig.detected) {
        // Validate pipeline configuration
        const pipelineValidation = await this.validatePipelineConfiguration(deploymentConfig);
        suggestions.push(...pipelineValidation.suggestions);

        // Check deployment readiness
        const readinessCheck = await this.checkDeploymentReadiness(context);
        suggestions.push(...readinessCheck.suggestions);

        // Environment-specific validations
        const environmentValidation = await this.validateEnvironmentConfiguration(deploymentConfig);
        suggestions.push(...environmentValidation.suggestions);

        // Blue-green deployment setup
        const blueGreenSetup = await this.setupBlueGreenDeployment(deploymentConfig);
        suggestions.push(...blueGreenSetup.suggestions);
      }

      this.logger.debug('Deployment orchestration completed', {
        configDetected: deploymentConfig.detected,
        suggestionsCount: suggestions.length,
        filePath: context.filePath
      }, 'deployment-orchestrator');

    } catch (error) {
      this.logger.error('Deployment orchestration failed', {
        error: error.message,
        filePath: context.filePath
      }, 'deployment-orchestrator');

      isValid = false;
      suggestions.push({
        type: 'error',
        message: `Deployment orchestration failed: ${error.message}`,
        line: 0,
        file: context.filePath
      });
    }

    return {
      isValid,
      suggestions,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Detect deployment configuration files
   */
  private async detectDeploymentConfiguration(filePath: string): Promise<any> {
    const projectRoot = this.findProjectRoot(filePath);
    const deploymentFiles = [
      'docker-compose.yml',
      'Dockerfile',
      '.github/workflows',
      'k8s/',
      'terraform/',
      'deployment.yml',
      'helm/',
      '.deployment/'
    ];

    const detected = [];
    for (const file of deploymentFiles) {
      try {
        await fs.access(path.join(projectRoot, file));
        detected.push(file);
      } catch {
        // File doesn't exist, continue
      }
    }

    return {
      detected: detected.length > 0,
      files: detected,
      projectRoot
    };
  }

  /**
   * Validate pipeline configuration
   */
  private async validatePipelineConfiguration(config: any): Promise<any> {
    const suggestions = [];

    // Check for multi-stage pipeline
    if (!config.files.some(f => f.includes('workflow') || f.includes('pipeline'))) {
      suggestions.push({
        type: 'warning',
        message: 'No CI/CD pipeline detected - consider adding automated deployment',
        line: 0,
        file: '',
        fix: 'Create .github/workflows/deploy.yml for automated deployments'
      });
    }

    // Check for environment separation
    if (!config.files.some(f => f.includes('environment') || f.includes('env'))) {
      suggestions.push({
        type: 'info',
        message: 'Environment-specific configuration recommended',
        line: 0,
        file: '',
        fix: 'Create environment-specific configuration files'
      });
    }

    // Docker best practices
    if (config.files.includes('Dockerfile')) {
      const dockerValidation = await this.validateDockerConfiguration(config.projectRoot);
      suggestions.push(...dockerValidation);
    }

    // Kubernetes configuration
    if (config.files.some(f => f.includes('k8s'))) {
      const k8sValidation = await this.validateKubernetesConfiguration(config.projectRoot);
      suggestions.push(...k8sValidation);
    }

    return { suggestions };
  }

  /**
   * Check deployment readiness
   */
  private async checkDeploymentReadiness(context: AgentActivationContext): Promise<any> {
    const suggestions = [];

    try {
      const content = await fs.readFile(context.filePath, 'utf-8');

      // Check for environment variables
      if (content.includes('process.env') && !content.includes('dotenv')) {
        suggestions.push({
          type: 'warning',
          message: 'Environment variables used without dotenv configuration',
          line: this.findLineNumber(content, 'process.env'),
          file: context.filePath,
          fix: 'Configure dotenv for environment variable management'
        });
      }

      // Check for proper error handling
      if (content.includes('app.listen') && !content.includes('error')) {
        suggestions.push({
          type: 'warning',
          message: 'Server startup missing error handling',
          line: this.findLineNumber(content, 'app.listen'),
          file: context.filePath,
          fix: 'Add error handling for server startup failures'
        });
      }

      // Health check endpoint
      if (content.includes('express') && !content.includes('/health')) {
        suggestions.push({
          type: 'info',
          message: 'Consider adding health check endpoint for deployment monitoring',
          line: 0,
          file: context.filePath,
          fix: 'Add GET /health endpoint returning service status'
        });
      }

      // Graceful shutdown
      if (content.includes('server') && !content.includes('SIGTERM')) {
        suggestions.push({
          type: 'info',
          message: 'Implement graceful shutdown for zero-downtime deployments',
          line: 0,
          file: context.filePath,
          fix: 'Add SIGTERM handler for graceful shutdown'
        });
      }

    } catch (error) {
      suggestions.push({
        type: 'error',
        message: `Readiness check failed: ${error.message}`,
        line: 0,
        file: context.filePath
      });
    }

    return { suggestions };
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironmentConfiguration(config: any): Promise<any> {
    const suggestions = [];

    // Check for environment-specific files
    const envFiles = ['.env.development', '.env.staging', '.env.production'];
    const existingEnvFiles = [];

    for (const envFile of envFiles) {
      try {
        await fs.access(path.join(config.projectRoot, envFile));
        existingEnvFiles.push(envFile);
      } catch {
        // File doesn't exist
      }
    }

    if (existingEnvFiles.length === 0) {
      suggestions.push({
        type: 'warning',
        message: 'No environment-specific configuration files found',
        line: 0,
        file: '',
        fix: 'Create .env files for different environments'
      });
    }

    // Validate .env.example exists
    try {
      await fs.access(path.join(config.projectRoot, '.env.example'));
    } catch {
      suggestions.push({
        type: 'info',
        message: 'Create .env.example for environment variable documentation',
        line: 0,
        file: '',
        fix: 'Add .env.example with required environment variables'
      });
    }

    return { suggestions };
  }

  /**
   * Setup blue-green deployment strategy
   */
  private async setupBlueGreenDeployment(config: any): Promise<any> {
    const suggestions = [];

    // Check for load balancer configuration
    if (!config.files.some(f => f.includes('nginx') || f.includes('load-balancer'))) {
      suggestions.push({
        type: 'info',
        message: 'Blue-green deployment requires load balancer configuration',
        line: 0,
        file: '',
        fix: 'Configure nginx or cloud load balancer for traffic switching'
      });
    }

    // Database migration strategy
    suggestions.push({
      type: 'info',
      message: 'Ensure database migrations are backward compatible for blue-green deployment',
      line: 0,
      file: '',
      fix: 'Implement forward-compatible database migrations'
    });

    // Health check automation
    suggestions.push({
      type: 'info',
      message: 'Automated health checks required for blue-green traffic switching',
      line: 0,
      file: '',
      fix: 'Implement comprehensive health check endpoints'
    });

    return { suggestions };
  }

  /**
   * Validate Docker configuration
   */
  private async validateDockerConfiguration(projectRoot: string): Promise<any[]> {
    const suggestions = [];

    try {
      const dockerfileContent = await fs.readFile(path.join(projectRoot, 'Dockerfile'), 'utf-8');

      // Multi-stage builds
      if (!dockerfileContent.includes('FROM') || dockerfileContent.split('FROM').length < 3) {
        suggestions.push({
          type: 'info',
          message: 'Consider multi-stage Docker builds for smaller images',
          line: 0,
          file: 'Dockerfile',
          fix: 'Use multi-stage builds to reduce image size'
        });
      }

      // Non-root user
      if (!dockerfileContent.includes('USER') || dockerfileContent.includes('USER root')) {
        suggestions.push({
          type: 'warning',
          message: 'Docker container should not run as root user',
          line: this.findLineNumber(dockerfileContent, 'FROM'),
          file: 'Dockerfile',
          fix: 'Add USER directive with non-root user'
        });
      }

      // Health check
      if (!dockerfileContent.includes('HEALTHCHECK')) {
        suggestions.push({
          type: 'info',
          message: 'Add Docker health check for better orchestration',
          line: 0,
          file: 'Dockerfile',
          fix: 'Add HEALTHCHECK directive'
        });
      }

    } catch (error) {
      // Dockerfile doesn't exist or can't be read
    }

    return suggestions;
  }

  /**
   * Validate Kubernetes configuration
   */
  private async validateKubernetesConfiguration(projectRoot: string): Promise<any[]> {
    const suggestions = [];

    try {
      const k8sDir = path.join(projectRoot, 'k8s');
      const files = await fs.readdir(k8sDir);

      // Check for essential Kubernetes resources
      const requiredResources = ['deployment.yaml', 'service.yaml', 'ingress.yaml'];
      const missingResources = requiredResources.filter(resource =>
        !files.some(file => file.includes(resource.split('.')[0]))
      );

      for (const resource of missingResources) {
        suggestions.push({
          type: 'warning',
          message: `Missing Kubernetes ${resource} configuration`,
          line: 0,
          file: `k8s/${resource}`,
          fix: `Create ${resource} for proper Kubernetes deployment`
        });
      }

      // Resource limits
      for (const file of files.filter(f => f.includes('deployment'))) {
        const content = await fs.readFile(path.join(k8sDir, file), 'utf-8');
        if (!content.includes('resources:')) {
          suggestions.push({
            type: 'warning',
            message: 'Kubernetes deployment missing resource limits',
            line: 0,
            file: `k8s/${file}`,
            fix: 'Add CPU and memory resource limits'
          });
        }
      }

    } catch (error) {
      // K8s directory doesn't exist or can't be read
    }

    return suggestions;
  }

  /**
   * Generate deployment insights
   */
  private async generateDeploymentInsights(context: AgentActivationContext): Promise<any[]> {
    const insights = [];

    // Deployment frequency analysis
    insights.push({
      type: 'info',
      message: 'Consider implementing continuous deployment for faster feedback loops',
      line: 0,
      file: context.filePath,
      fix: 'Set up automated deployment triggers on successful tests'
    });

    // Monitoring and observability
    insights.push({
      type: 'info',
      message: 'Implement comprehensive monitoring for deployment success tracking',
      line: 0,
      file: context.filePath,
      fix: 'Add application performance monitoring (APM) and logging'
    });

    // Feature flags
    insights.push({
      type: 'info',
      message: 'Feature flags enable safer deployments and gradual rollouts',
      line: 0,
      file: context.filePath,
      fix: 'Implement feature flag system for risk mitigation'
    });

    return insights;
  }

  /**
   * Initialize deployment pipelines
   */
  private initializeDeploymentPipelines(): void {
    // Standard three-tier pipeline
    const standardPipeline: DeploymentPipeline = {
      id: 'standard-pipeline',
      name: 'Standard Development Pipeline',
      environments: [
        {
          name: 'development',
          type: 'development',
          url: 'https://dev.example.com',
          healthCheckUrl: 'https://dev.example.com/health',
          config: { debug: true, logLevel: 'debug' },
          deploymentStrategy: 'rolling'
        },
        {
          name: 'staging',
          type: 'staging',
          url: 'https://staging.example.com',
          healthCheckUrl: 'https://staging.example.com/health',
          config: { debug: false, logLevel: 'info' },
          deploymentStrategy: 'blue-green'
        },
        {
          name: 'production',
          type: 'production',
          url: 'https://example.com',
          healthCheckUrl: 'https://example.com/health',
          config: { debug: false, logLevel: 'error' },
          deploymentStrategy: 'canary'
        }
      ],
      stages: [
        {
          name: 'build',
          type: 'build',
          environment: 'development',
          commands: ['npm ci', 'npm run build', 'npm run test'],
          healthChecks: [],
          rollbackTriggers: ['build-failure']
        },
        {
          name: 'deploy-dev',
          type: 'deploy',
          environment: 'development',
          commands: ['docker build', 'docker push', 'kubectl apply'],
          healthChecks: [
            {
              name: 'http-health',
              type: 'http',
              target: 'https://dev.example.com/health',
              timeout: 30000,
              retries: 3,
              successCriteria: '200'
            }
          ],
          rollbackTriggers: ['health-check-failure', 'deployment-failure']
        }
      ],
      rollbackStrategy: {
        automatic: true,
        triggers: ['health-check-failure', 'error-rate-spike'],
        maxAttempts: 3,
        notifications: ['team-slack', 'email-alerts']
      }
    };

    this.deploymentPipelines.set('standard', standardPipeline);
  }

  /**
   * Helper methods
   */
  private findLineNumber(content: string, searchText: string): number {
    const lines = content.split('\n');
    const lineIndex = lines.findIndex(line => line.includes(searchText));
    return lineIndex >= 0 ? lineIndex + 1 : 0;
  }

  private findProjectRoot(filePath: string): string {
    let currentDir = path.dirname(filePath);

    while (currentDir !== path.dirname(currentDir)) {
      try {
        if (require('fs').existsSync(path.join(currentDir, 'package.json'))) {
          return currentDir;
        }
      } catch {
        // Continue searching
      }
      currentDir = path.dirname(currentDir);
    }

    return path.dirname(filePath);
  }
}