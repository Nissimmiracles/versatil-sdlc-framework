/**
 * Shadcn MCP Executor - Production Implementation
 * Real component analysis using ts-morph AST parsing
 */

import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import type { ShadcnMCPConfig, ComponentScanResult, ComponentUsageReport } from './shadcn-mcp-config.js';
import { DEFAULT_SHADCN_MCP_CONFIG } from './shadcn-mcp-config.js';

export interface MCPExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
}

export class ShadcnMCPExecutor {
  private config: ShadcnMCPConfig;
  private project: Project | null = null;

  constructor(config: Partial<ShadcnMCPConfig> = {}) {
    this.config = { ...DEFAULT_SHADCN_MCP_CONFIG, ...config };
    // Lazy init - don't create Project until first use
  }

  /**
   * Ensure Project is initialized (lazy loading)
   */
  private ensureProject(): void {
    if (!this.project) {
      this.project = new Project({
        tsConfigFilePath: path.join(this.config.projectPath, 'tsconfig.json'),
        skipAddingFilesFromTsConfig: true
      });
    }
  }

  /**
   * Execute Shadcn MCP action
   */
  async executeShadcnMCP(action: string, params: any = {}): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`🎨 JAMES-FRONTEND: Executing Shadcn MCP action: ${action}`);

      switch (action) {
        case 'component_analysis':
          return await this.scanProject();

        case 'component_usage':
          return await this.analyzeComponentUsage(params.componentName);

        case 'unused_components':
          return await this.findUnusedComponents();

        case 'accessibility_check':
          return await this.validateAccessibility(params.componentName);

        default:
          throw new Error(`Unknown Shadcn MCP action: ${action}`);
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Scan project for Shadcn components
   */
  private async scanProject(): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`🔍 Scanning project for Shadcn components...`);

      // Ensure Project is initialized (lazy loading)
      this.ensureProject();

      // Find all installed components
      const componentsDir = path.join(this.config.projectPath, this.config.componentsPath);
      const installed = this.findInstalledComponents(componentsDir);

      // Find all source files
      const sourceFiles = await glob(this.config.filePatterns, {
        cwd: this.config.projectPath,
        ignore: this.config.excludePatterns,
        absolute: true
      });

      // Add files to project
      this.project!.addSourceFilesAtPaths(sourceFiles);

      // Analyze component usage
      const usageMap = this.analyzeUsage(installed);

      // Calculate statistics
      const used = Array.from(usageMap.entries()).map(([component, usage]) => ({
        component,
        usageCount: usage.files.size,
        files: Array.from(usage.files),
        variants: Array.from(usage.variants)
      }));

      const usedNames = new Set(used.map(u => u.component));
      const unused = installed.filter(c => !usedNames.has(c.name)).map(c => c.name);

      const result: ComponentScanResult = {
        installed,
        used,
        unused,
        statistics: {
          totalComponents: installed.length,
          utilizationRate: Math.round((used.length / installed.length) * 100),
          mostUsed: used.sort((a, b) => b.usageCount - a.usageCount)[0]?.component || 'None'
        }
      };

      console.log(`✅ Scan complete: ${installed.length} components, ${used.length} used, ${unused.length} unused`);

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Scan failed: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze specific component usage
   */
  private async analyzeComponentUsage(componentName: string): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`📊 Analyzing usage of ${componentName}...`);

      // Ensure Project is initialized (lazy loading)
      this.ensureProject();

      const usage: ComponentUsageReport['usage'] = [];
      const propsMap: Record<string, number> = {};

      for (const sourceFile of this.project!.getSourceFiles()) {
        const imports = sourceFile.getImportDeclarations();

        for (const importDecl of imports) {
          const importPath = importDecl.getModuleSpecifierValue();

          if (importPath.includes(componentName.toLowerCase()) ||
              importPath.includes('@/components/ui')) {

            const namedImports = importDecl.getNamedImports();

            for (const namedImport of namedImports) {
              if (namedImport.getName() === componentName) {
                // Find JSX elements using this component
                const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);

                for (const jsxElement of jsxElements) {
                  const tagName = jsxElement.getTagNameNode().getText();

                  if (tagName === componentName) {
                    const attributes = jsxElement.getAttributes();
                    const props: Record<string, any> = {};

                    for (const attr of attributes) {
                      if (attr.getKind() === SyntaxKind.JsxAttribute) {
                        const jsxAttr = attr.asKind(SyntaxKind.JsxAttribute);
                        if (jsxAttr) {
                          const propName = jsxAttr.getNameNode().getText();
                          props[propName] = jsxAttr.getInitializer()?.getText() || 'true';
                          propsMap[propName] = (propsMap[propName] || 0) + 1;
                        }
                      }
                    }

                    usage.push({
                      file: sourceFile.getFilePath(),
                      line: jsxElement.getStartLineNumber(),
                      props
                    });
                  }
                }
              }
            }
          }
        }
      }

      const report: ComponentUsageReport = {
        component: componentName,
        usage,
        patterns: {
          commonProps: propsMap,
          customizationLevel: Object.keys(propsMap).length > 5 ? 'high' :
                             Object.keys(propsMap).length > 2 ? 'medium' : 'low'
        },
        recommendations: this.generateComponentRecommendations(componentName, usage, propsMap)
      };

      console.log(`✅ Analysis complete: ${usage.length} usages found`);

      return {
        success: true,
        data: report,
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Usage analysis failed: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Find unused components
   */
  private async findUnusedComponents(): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      const scanResult = await this.scanProject();

      if (!scanResult.success) {
        throw new Error('Failed to scan project');
      }

      const unused = (scanResult.data as ComponentScanResult).unused;

      console.log(`✅ Found ${unused.length} unused components`);

      return {
        success: true,
        data: { unused, count: unused.length },
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Unused components check failed: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Validate accessibility (simplified check)
   */
  private async validateAccessibility(componentName: string): Promise<MCPExecutionResult> {
    const startTime = Date.now();

    try {
      console.log(`♿ Validating accessibility for ${componentName}...`);

      // Ensure Project is initialized (lazy loading)
      this.ensureProject();

      const issues: any[] = [];

      for (const sourceFile of this.project!.getSourceFiles()) {
        const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);

        for (const jsxElement of jsxElements) {
          if (jsxElement.getTagNameNode().getText() === componentName) {
            const hasAriaLabel = jsxElement.getAttributes().some(attr => {
              if (attr.getKind() === SyntaxKind.JsxAttribute) {
                const jsxAttr = attr.asKind(SyntaxKind.JsxAttribute);
                const attrName = jsxAttr?.getNameNode().getText();
                return attrName === 'aria-label' || attrName === 'aria-labelledby';
              }
              return false;
            });

            if (!hasAriaLabel && componentName.toLowerCase().includes('button')) {
              issues.push({
                type: 'missing-aria',
                severity: 'warning',
                file: sourceFile.getFilePath(),
                line: jsxElement.getStartLineNumber(),
                description: `${componentName} missing aria-label`,
                suggestion: 'Add aria-label or aria-labelledby attribute'
              });
            }
          }
        }
      }

      console.log(`✅ Accessibility check complete: ${issues.length} issues found`);

      return {
        success: true,
        data: { issues, count: issues.length },
        executionTime: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Accessibility check failed: ${error.message}`,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Helper: Find installed Shadcn components
   */
  private findInstalledComponents(componentsDir: string): { name: string; path: string }[] {
    if (!fs.existsSync(componentsDir)) {
      return [];
    }

    const files = fs.readdirSync(componentsDir);
    return files
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map(file => ({
        name: this.pascalCase(path.basename(file, path.extname(file))),
        path: path.join(componentsDir, file)
      }));
  }

  /**
   * Helper: Analyze component usage across project
   */
  private analyzeUsage(installed: { name: string; path: string }[]): Map<string, { files: Set<string>; variants: Set<string> }> {
    // Ensure Project is initialized (lazy loading)
    this.ensureProject();

    const usageMap = new Map<string, { files: Set<string>; variants: Set<string> }>();

    for (const { name } of installed) {
      const usage = { files: new Set<string>(), variants: new Set<string>() };

      for (const sourceFile of this.project!.getSourceFiles()) {
        const imports = sourceFile.getImportDeclarations();

        for (const importDecl of imports) {
          const namedImports = importDecl.getNamedImports();

          if (namedImports.some(ni => ni.getName() === name)) {
            usage.files.add(sourceFile.getFilePath());
          }
        }
      }

      if (usage.files.size > 0) {
        usageMap.set(name, usage);
      }
    }

    return usageMap;
  }

  /**
   * Helper: Generate component recommendations
   */
  private generateComponentRecommendations(
    componentName: string,
    usage: any[],
    propsMap: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (usage.length === 0) {
      recommendations.push(`${componentName} is not being used - consider removing if unnecessary`);
    } else if (usage.length > 50) {
      recommendations.push(`${componentName} is heavily used - ensure it's well-tested`);
    }

    const commonProps = Object.entries(propsMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([prop]) => prop);

    if (commonProps.length > 0) {
      recommendations.push(`Most common props: ${commonProps.join(', ')}`);
    }

    return recommendations.length > 0 ? recommendations : ['Component usage looks healthy'];
  }

  /**
   * Helper: Convert to PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}

// Export singleton instance
export const shadcnMCPExecutor = new ShadcnMCPExecutor();
