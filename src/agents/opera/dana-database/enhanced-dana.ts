import { RAGEnabledAgent, RAGConfig, AgentRAGContext } from '../../core/rag-enabled-agent.js';
import { AgentResponse, AgentActivationContext } from '../../core/base-agent.js';
import { PatternAnalyzer, AnalysisResult } from '../../../intelligence/pattern-analyzer.js';
import { PromptGenerator } from '../../../intelligence/prompt-generator.js';
import { EnhancedVectorMemoryStore } from '../../../rag/enhanced-vector-memory-store.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnhancedDana extends RAGEnabledAgent {
  name = 'EnhancedDana';
  id = 'enhanced-dana';
  specialization = 'Database Architect & Data Layer Specialist';
  systemPrompt = 'Database architect specializing in PostgreSQL, Supabase, schema design, migrations, RLS policies, and vector databases for RAG systems';

  constructor(vectorStore?: EnhancedVectorMemoryStore) {
    super(vectorStore);
  }

  /**
   * Override activate to provide database-specific context
   */
  async activate(context: AgentActivationContext): Promise<AgentResponse> {
    const response = await super.activate(context);

    // Replace analysisScore with databaseHealth
    if (response.context) {
      const { analysisScore, ...rest } = response.context;
      response.context = {
        ...rest,
        databaseHealth: analysisScore
      };
    }

    return response;
  }

  /**
   * Database-specific RAG configuration
   */
  protected getDefaultRAGConfig(): RAGConfig {
    return {
      maxExamples: 3,
      similarityThreshold: 0.8,
      agentDomain: 'database',
      enableLearning: true
    };
  }

  /**
   * Run database-specific pattern analysis
   */
  protected async runPatternAnalysis(context: AgentActivationContext): Promise<AnalysisResult> {
    // Database analysis follows same pattern as backend
    return PatternAnalyzer.analyzeBackend(context.content, context.filePath);
  }

  /**
   * Override message generation to include agent name
   */
  protected generateEnhancedMessage(analysis: AnalysisResult, ragContext?: any): string {
    const criticalCount = analysis.patterns.filter(p => p.severity === 'critical').length;

    let message = criticalCount > 0
      ? `Enhanced Dana - Critical Issues Detected: ${criticalCount} critical database issues found.`
      : `Enhanced Dana - Database Analysis Complete: Score ${analysis.score}/100. ${analysis.patterns.length} issues found.`;

    if (ragContext) {
      const ragInsights = [];
      if (ragContext.similarCode.length > 0) ragInsights.push(`${ragContext.similarCode.length} similar schema patterns`);
      if (Object.keys(ragContext.previousSolutions).length > 0) ragInsights.push(`solutions for ${Object.keys(ragContext.previousSolutions).length} migration types`);
      if (ragContext.projectStandards.length > 0) ragInsights.push(`${ragContext.projectStandards.length} project standards`);

      if (ragInsights.length > 0) {
        message += ` RAG-Enhanced: ${ragInsights.join(', ')}.`;
      }
    }

    return message;
  }

  /**
   * Generate database-specific base prompt template
   */
  protected getBasePromptTemplate(): string {
    return `---
name: enhanced-dana-database-rag
description: RAG-Enhanced Database Analysis
model: sonnet
agent: Enhanced Dana
---

You are **Enhanced Dana**, a database architect and data layer specialist with 10+ years of experience in PostgreSQL, Supabase, schema design, migrations, and vector databases.

## Your Core Mission
Provide comprehensive database analysis with historical schema patterns and proven optimization solutions.

## Database Focus Areas:
1. **Schema Design**
   - Analyze table structures, relationships, and normalization
   - Evaluate indexing strategies and query performance
   - Review constraints, foreign keys, and data integrity

2. **Migrations & Versioning**
   - Design reversible migration scripts
   - Validate migration safety and rollback procedures
   - Track schema evolution and breaking changes

3. **Row Level Security (RLS)**
   - Design multi-tenant data isolation policies
   - Review RLS policy correctness and performance
   - Ensure secure data access patterns

4. **Query Optimization**
   - Analyze query performance using EXPLAIN plans
   - Identify N+1 queries and missing indexes
   - Suggest query rewrites for better performance

5. **Supabase Integration**
   - Edge Functions implementation and optimization
   - Realtime subscriptions configuration
   - Storage bucket policies and file handling

6. **Vector Databases (pgvector)**
   - Embedding storage and similarity search
   - RAG system optimization
   - Vector index strategies (HNSW, IVFFlat)

7. **Backup & Recovery**
   - Point-in-time recovery configuration
   - Automated backup validation
   - Disaster recovery procedures

8. **Security & Compliance**
   - SQL injection prevention
   - Encryption at rest and in transit
   - Audit logging and compliance tracking

## Analysis Approach:
1. **Schema Review**: Examine table definitions, relationships, and constraints
2. **Security Audit**: Check RLS policies, permissions, and SQL injection risks
3. **Performance Analysis**: Identify slow queries, missing indexes, and optimization opportunities
4. **Migration Safety**: Validate migration scripts for safety and rollback capability
5. **Best Practices**: Apply PostgreSQL and Supabase best practices
6. **RAG Context**: Leverage similar schema patterns and proven solutions from project history

## Code Review Standards:
- ✅ Use transactions for data consistency
- ✅ Implement RLS policies for multi-tenant security
- ✅ Create indexes for frequently queried columns
- ✅ Validate foreign key constraints
- ✅ Use prepared statements to prevent SQL injection
- ✅ Document migration scripts with rollback procedures
- ✅ Test migrations in staging before production
- ✅ Monitor query performance with EXPLAIN ANALYZE
`;
  }

  /**
   * Generate database-specific handoffs based on analysis
   */
  protected generateDomainHandoffs(analysis: AnalysisResult): string[] {
    const handoffs: string[] = [];

    // Security issues should go to Marcus for API-level security coordination
    const securityIssues = analysis.patterns.filter(p => p.category === 'security');
    if (securityIssues.length > 0) {
      handoffs.push('enhanced-marcus');
    }

    // Performance issues may need backend optimization
    if (analysis.patterns.some(p => p.category === 'performance' || p.type.includes('optimization'))) {
      handoffs.push('enhanced-marcus');
    }

    // Low score needs quality review
    if (analysis.score < 70) {
      handoffs.push('enhanced-maria');
    }

    // Migration issues may need PM coordination for deployment timing
    if (analysis.patterns.some(p => p.type.includes('migration') || p.type.includes('breaking-change'))) {
      handoffs.push('sarah-pm');
    }

    return [...new Set(handoffs)];
  }

}

export default EnhancedDana;
