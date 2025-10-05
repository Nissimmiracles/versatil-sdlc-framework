/**
 * Shadcn MCP Configuration
 * Production-ready component analysis configuration
 */

export interface ShadcnMCPConfig {
  projectPath: string;
  componentsPath: string;
  filePatterns: string[];
  excludePatterns: string[];
  analysisTimeout: number;
}

export interface ComponentScanResult {
  installed: {
    name: string;
    path: string;
  }[];

  used: {
    component: string;
    usageCount: number;
    files: string[];
    variants: string[];
  }[];

  unused: string[];

  statistics: {
    totalComponents: number;
    utilizationRate: number;
    mostUsed: string;
  };
}

export interface ComponentUsageReport {
  component: string;
  usage: {
    file: string;
    line: number;
    props: Record<string, any>;
  }[];
  patterns: {
    commonProps: Record<string, number>;
    customizationLevel: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
}

export const DEFAULT_SHADCN_MCP_CONFIG: ShadcnMCPConfig = {
  projectPath: process.cwd(),
  componentsPath: process.env.SHADCN_COMPONENTS_PATH || 'src/components/ui',
  filePatterns: ['**/*.{ts,tsx,js,jsx}'],
  excludePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  analysisTimeout: parseInt(process.env.SHADCN_ANALYSIS_TIMEOUT || '5000')
};
