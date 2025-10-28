/**
 * VERSATIL Agent Definitions for Claude SDK
 *
 * Purpose: Native Claude SDK agent definitions for all 6 OPERA agents
 * Benefits:
 * - Declarative agent configuration (no classes needed)
 * - Native SDK sub-agent support
 * - Automatic parallelization by Claude SDK
 * - Simplified architecture
 */
import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
/**
 * Maria-QA - Quality Guardian
 *
 * Role: Final validation gate, ensures 80%+ coverage, blocks merge if quality fails
 * Position in Flywheel: Final checkpoint before production
 * Auto-activation: *.test.*, __tests__/**, spec.*, *.spec.*
 */
export declare const MARIA_QA_AGENT: AgentDefinition;
/**
 * James-Frontend - UI/UX Architect with 5 Sub-Agents
 *
 * Role: Frontend development, accessibility, performance, design implementation, UX review
 * Position in Flywheel: Parallel with Marcus (step 4)
 * Auto-activation: *.tsx, *.jsx, *.vue, *.css, *.scss, *.md, components/**
 */
export declare const JAMES_FRONTEND_AGENT: AgentDefinition;
/**
 * Marcus-Backend - API Architect & Security Expert
 *
 * Role: Backend development, API design, security, database, performance
 * Position in Flywheel: Parallel with James (step 4)
 * Auto-activation: *.api.*, routes/**, controllers/**, models/**, *.sql
 */
export declare const MARCUS_BACKEND_AGENT: AgentDefinition;
/**
 * Sarah-PM - Project Manager & Documentation Lead
 *
 * Role: Project coordination, sprint management, documentation, reporting
 * Position in Flywheel: Documentation and coordination (step 7)
 * Auto-activation: *.md, docs/**, project events, sprint milestones
 */
export declare const SARAH_PM_AGENT: AgentDefinition;
/**
 * Alex-BA - Business Analyst & Requirements Engineer
 *
 * Role: Requirements analysis, user story creation, stakeholder communication
 * Position in Flywheel: Initial requirements gathering (step 1)
 * Auto-activation: requirements/**, *.feature, issue creation, stakeholder requests
 */
export declare const ALEX_BA_AGENT: AgentDefinition;
/**
 * Dr.AI-ML - AI/ML Engineer & Data Scientist
 *
 * Role: Machine learning, model development, data science, AI integration
 * Position in Flywheel: Specialized AI/ML work (parallel to Marcus/James)
 * Auto-activation: *.py, *.ipynb, models/**, data/**, ml/**
 */
export declare const DR_AI_ML_AGENT: AgentDefinition;
/**
 * Dana-Database - Database Architect
 *
 * Role: Data layer specialist, schema design, RLS policies, query optimization
 * Position in Framework: Three-tier architecture (data layer)
 * Auto-activation: *.sql, migrations/**, prisma/**, supabase/**
 */
export declare const DANA_DATABASE_AGENT: AgentDefinition;
/**
 * Oliver-MCP - MCP Intelligence & Orchestration Agent
 *
 * Role: Intelligent MCP selection, type classification, and anti-hallucination logic
 * Position in Framework: MCP router for all 18 OPERA agents
 * Auto-activation: mcp directories, mcp-related files, requests mentioning MCPs
 */
export declare const OLIVER_MCP_AGENT: AgentDefinition;
/**
 * Export all agent definitions for easy import
 */
export declare const OPERA_AGENTS: Record<string, AgentDefinition>;
/**
 * Framework system agents (non-OPERA)
 */
export { FRAMEWORK_HEALTH_AGENT } from './framework-health-agent.js';
/**
 * Get agent definition by ID
 */
export declare function getAgentDefinition(agentId: string): AgentDefinition | undefined;
/**
 * Get all agent IDs
 */
export declare function getAllAgentIds(): string[];
export default OPERA_AGENTS;
