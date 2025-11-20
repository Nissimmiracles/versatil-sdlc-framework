/**
 * VERSATIL SDLC Framework - Agent Type Definitions
 */

export interface AgentActivationContext {
  files?: string[];
  task?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  trigger?: string;
  phase?: string;
  metadata?: Record<string, any>;
}

export interface Recommendation {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  actions?: string[];
  fix?: string;
}

export interface AgentResponse {
  agentId: string;
  message: string;
  suggestions: Recommendation[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  handoffTo: string[];
  context: Record<string, any>;
  success?: boolean; // Indicates if activation was successful
  result?: any;
  status?: 'success' | 'error' | 'warning';
  timestamp?: string;
}

export interface ValidationResults {
  suggestions: Recommendation[];
  errors?: string[];
  warnings?: string[];
  isValid?: boolean;
}