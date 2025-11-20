/**
 * VERSATIL Type Definitions
 */

export interface AgentResponse {
  agentId: string;
  message: string;
  suggestions: any[];
  priority: string;
  handoffTo: string[];
  context: any;
  success?: boolean; // Indicates if activation was successful
  data?: any;
  analysis?: any;
  status?: 'success' | 'error' | 'warning';
  timestamp?: string;
}

export interface AgentActivationContext {
  trigger?: any;
  filePath?: string;
  content?: string;
  [key: string]: any;
}

export interface ValidationResults {
  score: number;
  issues: any[];
  warnings: string[];
  recommendations: any[];
  crossFileAnalysis?: {
    inconsistencies: any[];
    suggestions: string[];
  };
  performanceMetrics?: {
    analysisTime: number;
    filesAnalyzed: number;
  };
  securityConcerns?: any[];
}

export interface Issue {
  type: string;
  severity: string;
  message: string;
  file: string;
}

export interface Recommendation {
  type: string;
  priority: string;
  message: string;
  actions?: string[];
  estimatedEffort?: string;
  autoFixable?: boolean;
}
