/**
 * VERSATIL SDLC Framework - Architectural Validator
 *
 * Implements cross-file architectural validation to prevent:
 * - Orphaned page components (pages without routes)
 * - Broken navigation (menu items without routes)
 * - Incomplete deliverables (partial multi-file implementations)
 * - Duplicate implementations (multiple versions of same feature)
 *
 * This addresses the critical gap identified in the production audit:
 * "Framework has excellent detection but ZERO enforcement mechanisms"
 *
 * @see docs/audit/production-audit-report.md - Critical Failures #1-4
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ArchitecturalViolation {
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  rule: string;
  message: string;
  file: string;
  line?: number;
  relatedFiles?: string[];
  fixSuggestion?: string;
  autoFixAvailable: boolean;
}

export interface ValidationResult {
  passed: boolean;
  violations: ArchitecturalViolation[];
  warnings: ArchitecturalViolation[];
  blockers: ArchitecturalViolation[];
  stats: ValidationStats;
}

export interface ValidationStats {
  filesAnalyzed: number;
  rulesExecuted: number;
  violationsFound: number;
  blockersFound: number;
  executionTimeMs: number;
}

export interface DependencyNode {
  filePath: string;
  type: 'component' | 'route' | 'menu' | 'test' | 'config' | 'other';
  imports: string[];
  exports: string[];
  metadata: Record<string, any>;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: Map<string, Set<string>>; // filePath -> Set of dependencies

  findNodes(filter: NodeFilter): DependencyNode[];
  hasEdge(from: string, to: string): boolean;
  getImporters(filePath: string): DependencyNode[];
}

export interface NodeFilter {
  path?: RegExp;
  type?: DependencyNode['type'];
  metadata?: Record<string, any>;
}

export interface ArchitecturalRule {
  name: string;
  description: string;
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  enabled: boolean;

  check(graph: DependencyGraph, changedFiles: string[]): Promise<ArchitecturalViolation[]>;
}

// ============================================================================
// Dependency Graph Implementation
// ============================================================================

class DependencyGraphImpl implements DependencyGraph {
  nodes: Map<string, DependencyNode> = new Map();
  edges: Map<string, Set<string>> = new Map();

  addNode(node: DependencyNode): void {
    this.nodes.set(node.filePath, node);

    if (!this.edges.has(node.filePath)) {
      this.edges.set(node.filePath, new Set());
    }

    // Add edges for imports
    node.imports.forEach(importPath => {
      this.edges.get(node.filePath)!.add(importPath);
    });
  }

  findNodes(filter: NodeFilter): DependencyNode[] {
    const results: DependencyNode[] = [];

    for (const node of this.nodes.values()) {
      let matches = true;

      if (filter.path && !filter.path.test(node.filePath)) {
        matches = false;
      }

      if (filter.type && node.type !== filter.type) {
        matches = false;
      }

      if (filter.metadata) {
        for (const [key, value] of Object.entries(filter.metadata)) {
          if (node.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
      }

      if (matches) {
        results.push(node);
      }
    }

    return results;
  }

  hasEdge(from: string, to: string): boolean {
    const edges = this.edges.get(from);
    if (!edges) return false;

    // Check direct import
    if (edges.has(to)) return true;

    // Check if 'from' imports anything that imports 'to' (transitive)
    // For now, just check direct imports
    // TODO: Implement transitive dependency checking if needed

    return false;
  }

  getImporters(filePath: string): DependencyNode[] {
    const importers: DependencyNode[] = [];

    for (const [nodePath, edges] of this.edges.entries()) {
      if (edges.has(filePath)) {
        const node = this.nodes.get(nodePath);
        if (node) {
          importers.push(node);
        }
      }
    }

    return importers;
  }
}

// ============================================================================
// Architectural Rules
// ============================================================================

/**
 * Rule: Pages Must Have Routes
 *
 * Detects orphaned page components that have no corresponding route definition.
 * This would have prevented Failure #1 from the audit (8 orphaned Simplified pages).
 */
export class PagesMustHaveRoutesRule implements ArchitecturalRule {
  name = 'pages-must-have-routes';
  description = 'All page components must have corresponding route definitions';
  severity: 'blocker' = 'blocker';
  enabled = true;

  async check(graph: DependencyGraph): Promise<ArchitecturalViolation[]> {
    const violations: ArchitecturalViolation[] = [];

    // Find all page components (in src/pages/, src/views/, src/routes/, etc.)
    const pageComponents = graph.findNodes({
      path: /\/(pages|views|routes|screens)\/.*\.(tsx|jsx|vue|svelte)$/
    });

    // Find route configuration files (App.tsx, router/index.ts, etc.)
    const routeConfigs = graph.findNodes({
      path: /(App\.(tsx|jsx)|router\/index\.(ts|js)|routes\.(ts|js))/
    });

    // Check each page component for route registration
    for (const page of pageComponents) {
      // Skip test files and story files
      if (page.filePath.includes('.test.') ||
          page.filePath.includes('.spec.') ||
          page.filePath.includes('.stories.')) {
        continue;
      }

      // Check if any route config imports this page
      const isRouted = routeConfigs.some(routeConfig =>
        graph.hasEdge(routeConfig.filePath, page.filePath)
      );

      if (!isRouted) {
        // Check if this is a sub-component (not a page)
        const fileName = path.basename(page.filePath, path.extname(page.filePath));
        const isSubComponent = fileName.startsWith('_') ||
                               fileName.includes('Component') ||
                               fileName.includes('View') && !fileName.endsWith('Page');

        if (!isSubComponent) {
          violations.push({
            severity: 'blocker',
            rule: this.name,
            message: `Orphaned page component detected: ${path.basename(page.filePath)} has no route registration`,
            file: page.filePath,
            relatedFiles: routeConfigs.map(r => r.filePath),
            fixSuggestion: this.generateRouteSuggestion(page, routeConfigs),
            autoFixAvailable: true
          });
        }
      }
    }

    return violations;
  }

  private generateRouteSuggestion(page: DependencyNode, routeConfigs: DependencyNode[]): string {
    const pageName = path.basename(page.filePath, path.extname(page.filePath));
    const routePath = this.inferRoutePath(page.filePath);
    const mainRouteConfig = routeConfigs.find(r => r.filePath.includes('App.')) || routeConfigs[0];

    if (!mainRouteConfig) {
      return `Create a route configuration file (e.g., App.tsx) and add a route for ${pageName}`;
    }

    const relativePath = path.relative(
      path.dirname(mainRouteConfig.filePath),
      page.filePath
    ).replace(/\\/g, '/');

    return `
Add to ${path.basename(mainRouteConfig.filePath)}:

1. Import the component:
   import ${pageName} from './${relativePath}';

2. Add route definition:
   <Route path="${routePath}" element={
     <Suspense fallback={<LoadingSpinner />}>
       <${pageName} />
     </Suspense>
   } />

Or run: npm run versatil:add-route ${page.filePath}
`.trim();
  }

  private inferRoutePath(filePath: string): string {
    // Extract route path from file path
    // e.g., src/pages/dealflow/DealFlowSimplified.tsx -> /dealflow/simplified

    const parts = filePath.split('/');
    const pagesIndex = parts.findIndex(p => p === 'pages' || p === 'views' || p === 'routes');

    if (pagesIndex === -1) return '/unknown';

    const routeParts = parts.slice(pagesIndex + 1);
    const fileName = path.basename(filePath, path.extname(filePath));

    // Remove 'Page', 'View', 'Simplified' suffixes
    const cleanName = fileName
      .replace(/(Page|View|Simplified)$/, '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');

    routeParts[routeParts.length - 1] = cleanName;

    return '/' + routeParts.filter(p => p !== 'index').join('/');
  }
}

/**
 * Rule: Menus Must Have Routes
 *
 * Validates that all navigation menu items have valid route definitions.
 * This would have prevented Failure #2 from the audit (broken Analytics navigation).
 */
export class MenusMustHaveRoutesRule implements ArchitecturalRule {
  name = 'menus-must-have-routes';
  description = 'All navigation menu items must have valid route definitions';
  severity: 'critical' = 'critical';
  enabled = true;

  async check(graph: DependencyGraph): Promise<ArchitecturalViolation[]> {
    const violations: ArchitecturalViolation[] = [];

    // Find navigation configuration files
    const navConfigs = graph.findNodes({
      path: /(navigation|menu|sidebar).*\.(ts|tsx|js|jsx)/
    });

    // Find route configuration files
    const routeConfigs = graph.findNodes({
      path: /(App\.(tsx|jsx)|router\/index\.(ts|js)|routes\.(ts|js))/
    });

    if (routeConfigs.length === 0) {
      return violations; // No route config, can't validate
    }

    // Parse each navigation config for menu items
    for (const navConfig of navConfigs) {
      try {
        const content = await fs.readFile(navConfig.filePath, 'utf-8');
        const menuItems = this.extractMenuItems(content);

        for (const menuItem of menuItems) {
          // Check if route exists in any route config
          const routeExists = await this.checkRouteExists(menuItem.path, routeConfigs);

          if (!routeExists) {
            violations.push({
              severity: 'critical',
              rule: this.name,
              message: `Navigation menu item "${menuItem.label}" links to non-existent route: ${menuItem.path}`,
              file: navConfig.filePath,
              line: menuItem.line,
              relatedFiles: routeConfigs.map(r => r.filePath),
              fixSuggestion: `Add route definition for ${menuItem.path} in ${path.basename(routeConfigs[0].filePath)} or remove menu item`,
              autoFixAvailable: false
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing navigation config ${navConfig.filePath}:`, error);
      }
    }

    return violations;
  }

  private extractMenuItems(content: string): Array<{path: string; label: string; line: number}> {
    const menuItems: Array<{path: string; label: string; line: number}> = [];
    const lines = content.split('\n');

    // Look for patterns like: path: "/analytics", key: "/analytics", to: "/analytics"
    const pathPattern = /(?:path|key|to):\s*['"]([^'"]+)['"]/;
    const labelPattern = /(?:label|title|name):\s*['"]([^'"]+)['"]/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const pathMatch = line.match(pathPattern);

      if (pathMatch) {
        const path = pathMatch[1];

        // Look for label in nearby lines (within 5 lines)
        let label = path;
        for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
          const labelMatch = lines[j].match(labelPattern);
          if (labelMatch) {
            label = labelMatch[1];
            break;
          }
        }

        menuItems.push({ path, label, line: i + 1 });
      }
    }

    return menuItems;
  }

  private async checkRouteExists(routePath: string, routeConfigs: DependencyNode[]): Promise<boolean> {
    for (const routeConfig of routeConfigs) {
      try {
        const content = await fs.readFile(routeConfig.filePath, 'utf-8');

        // Look for route definitions matching this path
        // Patterns: path="/analytics", path='/analytics', path={"/analytics"}
        const routePattern = new RegExp(`path\\s*[=:]\\s*[{"']${routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[}"']`);

        if (routePattern.test(content)) {
          return true;
        }
      } catch (error) {
        console.error(`Error checking route in ${routeConfig.filePath}:`, error);
      }
    }

    return false;
  }
}

/**
 * Rule: Routes Must Have Components
 *
 * Validates that all route definitions point to existing components.
 * Detects broken route definitions.
 */
export class RoutesMustHaveComponentsRule implements ArchitecturalRule {
  name = 'routes-must-have-components';
  description = 'All route definitions must point to existing components';
  severity: 'blocker' = 'blocker';
  enabled = true;

  async check(graph: DependencyGraph): Promise<ArchitecturalViolation[]> {
    const violations: ArchitecturalViolation[] = [];

    // Find route configuration files
    const routeConfigs = graph.findNodes({
      path: /(App\.(tsx|jsx)|router\/index\.(ts|js)|routes\.(ts|js))/
    });

    for (const routeConfig of routeConfigs) {
      try {
        const content = await fs.readFile(routeConfig.filePath, 'utf-8');
        const routes = this.extractRoutes(content);

        for (const route of routes) {
          // Check if component exists in imports
          const componentExists = routeConfig.imports.some(imp =>
            imp.includes(route.component) || imp.endsWith(`/${route.component}`)
          );

          if (!componentExists && !route.isLazy) {
            violations.push({
              severity: 'blocker',
              rule: this.name,
              message: `Route "${route.path}" references non-existent component: ${route.component}`,
              file: routeConfig.filePath,
              line: route.line,
              fixSuggestion: `Import ${route.component} or create the component file`,
              autoFixAvailable: false
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing route config ${routeConfig.filePath}:`, error);
      }
    }

    return violations;
  }

  private extractRoutes(content: string): Array<{path: string; component: string; line: number; isLazy: boolean}> {
    const routes: Array<{path: string; component: string; line: number; isLazy: boolean}> = [];
    const lines = content.split('\n');

    // Look for Route components: <Route path="/x" element={<Component />} />
    const routePattern = /<Route\s+path=["']([^"']+)["'][^>]*element=\{<([A-Z]\w+)/;
    const lazyPattern = /React\.lazy|import\(/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const routeMatch = line.match(routePattern);

      if (routeMatch) {
        const [, path, component] = routeMatch;
        const isLazy = lazyPattern.test(line);

        routes.push({ path, component, line: i + 1, isLazy });
      }
    }

    return routes;
  }
}

/**
 * Rule: Deliverable Completeness
 *
 * Tracks multi-file deliverables to ensure complete implementation.
 * This would have prevented Failure #3 from the audit (incomplete Phase 3).
 */
export class DeliverableCompletenessRule implements ArchitecturalRule {
  name = 'deliverable-completeness';
  description = 'Multi-file deliverables must be complete before commit';
  severity: 'major' = 'major';
  enabled = true;

  async check(graph: DependencyGraph, changedFiles: string[]): Promise<ArchitecturalViolation[]> {
    const violations: ArchitecturalViolation[] = [];

    // Check if any changed files indicate a new page deliverable
    const newPages = changedFiles.filter(f =>
      f.match(/\/(pages|views|routes)\/.*\.(tsx|jsx|vue|svelte)$/) &&
      !f.includes('.test.') &&
      !f.includes('.spec.')
    );

    for (const pageFile of newPages) {
      const deliverableFiles = this.getExpectedDeliverableFiles(pageFile);
      const missingFiles: string[] = [];

      for (const [filePath, description] of Object.entries(deliverableFiles)) {
        // Check if file exists or is in changedFiles
        const exists = changedFiles.includes(filePath) || graph.nodes.has(filePath);

        if (!exists) {
          missingFiles.push(`${description} (${filePath})`);
        }
      }

      if (missingFiles.length > 0) {
        violations.push({
          severity: 'major',
          rule: this.name,
          message: `Incomplete page deliverable for ${path.basename(pageFile)}. Missing: ${missingFiles.join(', ')}`,
          file: pageFile,
          relatedFiles: Object.keys(deliverableFiles),
          fixSuggestion: `Complete the deliverable by:\n${missingFiles.map(f => `  - Create ${f}`).join('\n')}`,
          autoFixAvailable: false
        });
      }
    }

    return violations;
  }

  private getExpectedDeliverableFiles(pageFile: string): Record<string, string> {
    const dir = path.dirname(pageFile);
    const baseName = path.basename(pageFile, path.extname(pageFile));
    const ext = path.extname(pageFile);

    // Expected files for a complete page deliverable
    return {
      [pageFile]: 'Page component',
      // Route should be in App.tsx (checked by another rule)
      // Menu should be in navigation config (checked by another rule)
      [`${dir}/${baseName}.test${ext}`]: 'Unit tests'
    };
  }
}

// ============================================================================
// Architectural Validator (Main Class)
// ============================================================================

export class ArchitecturalValidator {
  private rules: ArchitecturalRule[] = [];
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.initializeRules();
  }

  private initializeRules(): void {
    this.rules = [
      new PagesMustHaveRoutesRule(),
      new MenusMustHaveRoutesRule(),
      new RoutesMustHaveComponentsRule(),
      new DeliverableCompletenessRule()
    ];
  }

  /**
   * Validate project architecture
   *
   * @param changedFiles - Files changed in current commit (optional)
   * @returns ValidationResult with all violations found
   */
  async validate(changedFiles: string[] = []): Promise<ValidationResult> {
    const startTime = Date.now();

    console.log('🔍 Building dependency graph...');
    const graph = await this.buildDependencyGraph();

    console.log('✅ Dependency graph built:', {
      nodes: graph.nodes.size,
      edges: Array.from(graph.edges.values()).reduce((sum, set) => sum + set.size, 0)
    });

    console.log('🔍 Running architectural validation rules...');
    const allViolations: ArchitecturalViolation[] = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      console.log(`  - ${rule.name}...`);
      const violations = await rule.check(graph, changedFiles);
      allViolations.push(...violations);

      if (violations.length > 0) {
        console.log(`    ⚠️  Found ${violations.length} violation(s)`);
      }
    }

    const blockers = allViolations.filter(v => v.severity === 'blocker');
    const warnings = allViolations.filter(v => v.severity !== 'blocker');

    const result: ValidationResult = {
      passed: blockers.length === 0,
      violations: allViolations,
      warnings,
      blockers,
      stats: {
        filesAnalyzed: graph.nodes.size,
        rulesExecuted: this.rules.filter(r => r.enabled).length,
        violationsFound: allViolations.length,
        blockersFound: blockers.length,
        executionTimeMs: Date.now() - startTime
      }
    };

    return result;
  }

  /**
   * Build dependency graph from project files
   */
  private async buildDependencyGraph(): Promise<DependencyGraph> {
    const graph = new DependencyGraphImpl();

    // Find all relevant source files
    const srcPatterns = [
      path.join(this.projectRoot, 'src/**/*.{ts,tsx,js,jsx}'),
      path.join(this.projectRoot, 'app/**/*.{ts,tsx,js,jsx}'), // Next.js
      path.join(this.projectRoot, 'pages/**/*.{ts,tsx,js,jsx,vue,svelte}')
    ];

    const files: string[] = [];
    for (const pattern of srcPatterns) {
      try {
        const matches = await glob(pattern, { ignore: '**/node_modules/**' });
        files.push(...matches);
      } catch (error) {
        // Pattern not found, skip
      }
    }

    // Parse each file and add to graph
    for (const filePath of files) {
      try {
        const node = await this.parseFile(filePath);
        graph.addNode(node);
      } catch (error) {
        console.error(`Error parsing ${filePath}:`, error);
      }
    }

    return graph;
  }

  /**
   * Parse a file and extract dependencies
   */
  private async parseFile(filePath: string): Promise<DependencyNode> {
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract imports
    const imports = this.extractImports(content, filePath);

    // Extract exports
    const exports = this.extractExports(content);

    // Determine file type
    const type = this.determineFileType(filePath, content);

    // Extract metadata
    const metadata = this.extractMetadata(filePath, content, type);

    return {
      filePath,
      type,
      imports,
      exports,
      metadata
    };
  }

  private extractImports(content: string, fromFile: string): string[] {
    const imports: string[] = [];
    const importPattern = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;

    let match;
    while ((match = importPattern.exec(content)) !== null) {
      const importPath = match[1];

      // Resolve relative imports to absolute paths
      if (importPath.startsWith('.')) {
        const resolvedPath = path.resolve(path.dirname(fromFile), importPath);
        imports.push(resolvedPath);
      } else {
        // External package or path alias
        imports.push(importPath);
      }
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exports: string[] = [];

    // Named exports: export const X, export function X, export class X
    const namedExportPattern = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
    let match;
    while ((match = namedExportPattern.exec(content)) !== null) {
      exports.push(match[1]);
    }

    // Default export
    if (/export\s+default/m.test(content)) {
      exports.push('default');
    }

    return exports;
  }

  private determineFileType(filePath: string, content: string): DependencyNode['type'] {
    if (filePath.includes('/pages/') || filePath.includes('/views/') || filePath.includes('/routes/')) {
      return 'component';
    }
    if (filePath.includes('App.') || filePath.includes('router/index') || filePath.includes('routes.')) {
      return 'route';
    }
    if (filePath.includes('navigation') || filePath.includes('menu') || filePath.includes('sidebar')) {
      return 'menu';
    }
    if (filePath.includes('.test.') || filePath.includes('.spec.')) {
      return 'test';
    }
    if (filePath.includes('config')) {
      return 'config';
    }

    return 'other';
  }

  private extractMetadata(filePath: string, content: string, type: DependencyNode['type']): Record<string, any> {
    const metadata: Record<string, any> = {};

    if (type === 'component') {
      // Extract component name
      const componentMatch = content.match(/(?:export\s+default\s+(?:function|class)\s+(\w+)|const\s+(\w+)\s*=.*?React)/);
      if (componentMatch) {
        metadata.componentName = componentMatch[1] || componentMatch[2];
      }

      // Check if it's a page component
      metadata.isPage = /\/(pages|views|screens)\//.test(filePath);
    }

    return metadata;
  }

  /**
   * Format validation results for display
   */
  formatResults(result: ValidationResult): string {
    const lines: string[] = [];

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('  🔍 VERSATIL Architectural Validation Report');
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');

    // Stats
    lines.push('📊 Validation Statistics:');
    lines.push(`  Files analyzed: ${result.stats.filesAnalyzed}`);
    lines.push(`  Rules executed: ${result.stats.rulesExecuted}`);
    lines.push(`  Violations found: ${result.stats.violationsFound}`);
    lines.push(`  Blockers: ${result.stats.blockersFound}`);
    lines.push(`  Execution time: ${result.stats.executionTimeMs}ms`);
    lines.push('');

    // Overall result
    if (result.passed) {
      lines.push('✅ PASSED - No blocking architectural violations detected');
    } else {
      lines.push(`❌ FAILED - ${result.blockers.length} blocking violation(s) must be fixed`);
    }
    lines.push('');

    // Blockers
    if (result.blockers.length > 0) {
      lines.push('🚨 BLOCKING VIOLATIONS:');
      lines.push('━'.repeat(50));

      result.blockers.forEach((violation, index) => {
        lines.push('');
        lines.push(`${index + 1}. ${violation.message}`);
        lines.push(`   Rule: ${violation.rule}`);
        lines.push(`   File: ${violation.file}`);
        if (violation.line) {
          lines.push(`   Line: ${violation.line}`);
        }
        if (violation.fixSuggestion) {
          lines.push('');
          lines.push('   💡 Fix Suggestion:');
          violation.fixSuggestion.split('\n').forEach(line => {
            lines.push(`   ${line}`);
          });
        }
      });

      lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      lines.push('━'.repeat(50));

      result.warnings.forEach((warning, index) => {
        lines.push('');
        lines.push(`${index + 1}. [${warning.severity.toUpperCase()}] ${warning.message}`);
        lines.push(`   File: ${warning.file}`);
      });

      lines.push('');
    }

    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return lines.join('\n');
  }
}
