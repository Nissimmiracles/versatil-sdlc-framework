/**
 * Marcus-Backend SDK Agent
 * SDK-native version of Enhanced Marcus that uses Claude Agent SDK for execution
 * while preserving all existing backend functionality
 */

import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { EnhancedMarcus } from './enhanced-marcus.js';
import type { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import type { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';

export class MarcusSDKAgent extends SDKAgentAdapter {
  private legacyAgent: EnhancedMarcus;

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super({
      agentId: 'marcus-backend',
      vectorStore,
      model: 'sonnet'
    });

    // Keep legacy agent for specialized methods
    this.legacyAgent = new EnhancedMarcus(vectorStore);
  }

  /**
   * Override activate to add Marcus-specific validations
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    // 1. Run SDK activation (core analysis)
    const response = await super.activate(context);

    // 2. Add Marcus-specific context
    if (response.context) {
      response.context = {
        ...response.context,
        backendHealth: response.context.analysisScore,
        apiType: this.detectAPIType(context.content || ''),
        dbType: this.detectDatabaseType(context.content || ''),
        securityScore: this.calculateSecurityScore(response.suggestions || [])
      };
    }

    return response;
  }

  /**
   * Detect API type from content
   */
  private detectAPIType(content: string): string {
    if (content.includes('GraphQL') || content.includes('gql`')) return 'graphql';
    if (content.includes('tRPC') || content.includes('trpc')) return 'trpc';
    if (content.includes('app.get') || content.includes('app.post')) return 'rest';
    if (content.includes('router.') || content.includes('route')) return 'rest';
    if (content.includes('websocket') || content.includes('ws')) return 'websocket';
    return 'api';
  }

  /**
   * Detect database type from content
   */
  private detectDatabaseType(content: string): string {
    if (content.includes('mongoose') || content.includes('MongoDB')) return 'mongodb';
    if (content.includes('prisma') || content.includes('Prisma')) return 'prisma';
    if (content.includes('sequelize') || content.includes('Sequelize')) return 'sequelize';
    if (content.includes('typeorm') || content.includes('TypeORM')) return 'typeorm';
    if (content.includes('postgresql') || content.includes('pg')) return 'postgresql';
    if (content.includes('mysql') || content.includes('MySQL')) return 'mysql';
    if (content.includes('redis') || content.includes('Redis')) return 'redis';
    return 'database';
  }

  /**
   * Calculate security score from suggestions
   */
  private calculateSecurityScore(suggestions: any[]): number {
    const securityIssues = suggestions.filter(s =>
      s.type === 'security' ||
      s.type === 'security-risk' ||
      s.message?.toLowerCase().includes('security')
    );

    if (securityIssues.length === 0) return 100;
    if (securityIssues.some(i => i.priority === 'critical')) return 30;
    if (securityIssues.some(i => i.priority === 'high')) return 60;
    return 80;
  }

  /**
   * Run backend validation (delegated to legacy agent)
   */
  async runBackendValidation(context: any): Promise<any> {
    return this.legacyAgent.runBackendValidation(context);
  }

  /**
   * Validate API integration (delegated to legacy agent)
   */
  validateAPIIntegration(context: any): { score: number; issues: any[] } {
    return this.legacyAgent.validateAPIIntegration(context);
  }

  /**
   * Validate service consistency (delegated to legacy agent)
   */
  validateServiceConsistency(context: any): { score: number; issues: any[] } {
    return this.legacyAgent.validateServiceConsistency(context);
  }

  /**
   * Check configuration consistency (delegated to legacy agent)
   */
  checkConfigurationConsistency(context: any): { score: number; issues: any[] } {
    return this.legacyAgent.checkConfigurationConsistency(context);
  }

  /**
   * Calculate priority (delegated to legacy agent)
   */
  calculatePriority(issues: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const priority = this.legacyAgent.calculatePriority(issues);
    return priority as 'low' | 'medium' | 'high' | 'critical';
  }

  /**
   * Determine handoffs (delegated to legacy agent)
   */
  determineHandoffs(issues: any[]): string[] {
    return this.legacyAgent.determineHandoffs(issues);
  }

  /**
   * Generate actionable recommendations (delegated to legacy agent)
   */
  generateActionableRecommendations(issues: any[]): Array<{ type: string; message: string; priority: string }> {
    return this.legacyAgent.generateActionableRecommendations(issues);
  }

  /**
   * Generate enhanced report (delegated to legacy agent)
   */
  generateEnhancedReport(issues: any[], metadata: any = {}): string {
    return this.legacyAgent.generateEnhancedReport(issues, metadata);
  }

  /**
   * Get score emoji (delegated to legacy agent)
   */
  getScoreEmoji(score: number): string {
    return this.legacyAgent.getScoreEmoji(score);
  }

  /**
   * Extract agent name (delegated to legacy agent)
   */
  extractAgentName(text: string): string {
    return this.legacyAgent.extractAgentName(text);
  }

  /**
   * Identify critical issues (delegated to legacy agent)
   */
  identifyCriticalIssues(issues: any[]): any[] {
    return this.legacyAgent.identifyCriticalIssues(issues);
  }

  /**
   * Validate database queries (delegated to legacy agent)
   */
  validateDatabaseQueries(context: any): any[] {
    return this.legacyAgent.validateDatabaseQueries(context);
  }

  /**
   * Check API security (delegated to legacy agent)
   */
  checkAPISecurity(context: any): any[] {
    return this.legacyAgent.checkAPISecurity(context);
  }

  /**
   * Analyze cache strategy (delegated to legacy agent)
   */
  analyzeCacheStrategy(context: any): any {
    return this.legacyAgent.analyzeCacheStrategy(context);
  }

  /**
   * Check authentication patterns (delegated to legacy agent)
   */
  checkAuthenticationPatterns(context: any): any[] {
    return this.legacyAgent.checkAuthenticationPatterns(context);
  }

  /**
   * Validate error handling (delegated to legacy agent)
   */
  validateErrorHandling(context: any): any[] {
    return this.legacyAgent.validateErrorHandling(context);
  }

  /**
   * Check input validation (delegated to legacy agent)
   */
  checkInputValidation(context: any): any[] {
    return this.legacyAgent.checkInputValidation(context);
  }

  /**
   * Analyze rate limiting (delegated to legacy agent)
   */
  analyzeRateLimiting(context: any): any {
    return this.legacyAgent.analyzeRateLimiting(context);
  }

  /**
   * Check CORS configuration (delegated to legacy agent)
   */
  checkCORSConfiguration(context: any): any[] {
    return this.legacyAgent.checkCORSConfiguration(context);
  }

  /**
   * Validate API versioning (delegated to legacy agent)
   */
  validateAPIVersioning(context: any): any {
    return this.legacyAgent.validateAPIVersioning(context);
  }

  /**
   * Check database indexes (delegated to legacy agent)
   */
  checkDatabaseIndexes(context: any): any[] {
    return this.legacyAgent.checkDatabaseIndexes(context);
  }

  /**
   * Check configuration inconsistencies (delegated to legacy agent)
   */
  hasConfigurationInconsistencies(context: any): boolean {
    return this.legacyAgent.hasConfigurationInconsistencies(context);
  }
}
