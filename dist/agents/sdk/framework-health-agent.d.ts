/**
 * Framework Health Check Agent (Native Claude SDK)
 *
 * Purpose: Native SDK agent for comprehensive VERSATIL framework health monitoring
 * Replaces: Multiple custom health check scripts and monitors
 * Benefits:
 * - Native SDK integration
 * - Declarative agent definition
 * - Automatic parallelization with other agents
 * - Proactive health monitoring
 */
import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
/**
 * Framework Health Check Agent
 *
 * Role: Monitor VERSATIL framework health, detect issues, auto-remediate when possible
 * Auto-activation: Scheduled (daily), on-demand via /framework:doctor command, after errors
 * Capabilities:
 * - Framework isolation validation
 * - Agent registry health checks
 * - RAG/vector store connectivity
 * - MCP connection validation (all 14 MCPs)
 * - Database health (PostgreSQL, Redis)
 * - Performance metrics collection
 * - Auto-remediation for common issues
 */
export declare const FRAMEWORK_HEALTH_AGENT: AgentDefinition;
/**
 * Execute framework health check via SDK
 */
export declare function executeFrameworkHealthCheck(): Promise<any>;
export default FRAMEWORK_HEALTH_AGENT;
