/**
 * VERSATIL Framework v3.0.0 - Base Language Adapter
 *
 * Foundation for multi-language support enabling VERSATIL to work with
 * Python, Go, Rust, Java, and other languages beyond TypeScript.
 *
 * Each language adapter implements this interface to provide language-specific
 * functionality while maintaining BMAD methodology across all languages.
 */

export interface ProjectStructure {
  rootPath: string;
  language: string;
  packageManager?: string;
  mainFiles: string[];
  testFiles: string[];
  configFiles: string[];
  buildOutput?: string;
  dependencies: Record<string, string>;
}

export interface LanguageCapabilities {
  testing: boolean;
  linting: boolean;
  formatting: boolean;
  typeChecking: boolean;
  packageManagement: boolean;
  buildSystem: boolean;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  coverage?: number;
  duration: number;
  details: Array<{
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  artifacts: string[];
  duration: number;
}

export interface LintResult {
  errors: number;
  warnings: number;
  issues: Array<{
    file: string;
    line: number;
    column: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    rule?: string;
  }>;
}

/**
 * Base Language Adapter Interface
 *
 * All language-specific adapters must implement this interface
 */
export abstract class BaseLanguageAdapter {
  protected rootPath: string;
  protected projectStructure?: ProjectStructure;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Detect if this adapter can handle the project
   */
  abstract detect(): Promise<boolean>;

  /**
   * Get language-specific capabilities
   */
  abstract getCapabilities(): LanguageCapabilities;

  /**
   * Analyze project structure
   */
  abstract analyzeProject(): Promise<ProjectStructure>;

  /**
   * Run tests
   */
  abstract runTests(options?: {
    pattern?: string;
    coverage?: boolean;
    watch?: boolean;
  }): Promise<TestResult>;

  /**
   * Build project
   */
  abstract build(options?: {
    mode?: 'development' | 'production';
    target?: string;
    optimization?: boolean;
  }): Promise<BuildResult>;

  /**
   * Lint code
   */
  abstract lint(options?: {
    fix?: boolean;
    files?: string[];
  }): Promise<LintResult>;

  /**
   * Format code
   */
  abstract format(options?: {
    files?: string[];
    check?: boolean;
  }): Promise<{ formatted: number; errors: string[] }>;

  /**
   * Install dependencies
   */
  abstract installDependencies(): Promise<{
    success: boolean;
    installed: string[];
    errors: string[];
  }>;

  /**
   * Get recommended BMAD agents for this language
   */
  abstract getRecommendedAgents(): string[];

  /**
   * Get language-specific quality metrics
   */
  abstract getQualityMetrics(): Promise<{
    testCoverage: number;
    lintScore: number;
    complexityScore: number;
    maintainability: number;
  }>;

  /**
   * Execute language-specific command
   */
  abstract executeCommand(command: string, args?: string[]): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }>;
}

/**
 * Language Adapter Registry
 *
 * Manages all registered language adapters
 */
export class LanguageAdapterRegistry {
  private static adapters: Map<string, typeof BaseLanguageAdapter> = new Map();
  private static instances: Map<string, BaseLanguageAdapter> = new Map();

  /**
   * Register a language adapter
   */
  static register(language: string, adapter: typeof BaseLanguageAdapter): void {
    this.adapters.set(language.toLowerCase(), adapter);
  }

  /**
   * Get adapter for a language
   */
  static get(language: string): typeof BaseLanguageAdapter | undefined {
    return this.adapters.get(language.toLowerCase());
  }

  /**
   * Get or create adapter instance for a project
   */
  static async getInstance(language: string, rootPath: string): Promise<BaseLanguageAdapter | null> {
    const key = `${language}:${rootPath}`;

    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    const AdapterClass = this.get(language);
    if (!AdapterClass) {
      return null;
    }

    const instance = new AdapterClass(rootPath);
    const canHandle = await instance.detect();

    if (!canHandle) {
      return null;
    }

    this.instances.set(key, instance);
    return instance;
  }

  /**
   * Detect language(s) for a project
   */
  static async detectLanguages(rootPath: string): Promise<string[]> {
    const detected: string[] = [];

    for (const [language, AdapterClass] of this.adapters.entries()) {
      const instance = new AdapterClass(rootPath);
      if (await instance.detect()) {
        detected.push(language);
      }
    }

    return detected;
  }

  /**
   * Get all registered languages
   */
  static getRegisteredLanguages(): string[] {
    return Array.from(this.adapters.keys());
  }
}

/**
 * Universal Project Detector
 *
 * Automatically detects project type and selects appropriate adapters
 */
export class UniversalProjectDetector {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  /**
   * Detect all languages used in project
   */
  async detectAllLanguages(): Promise<string[]> {
    return LanguageAdapterRegistry.detectLanguages(this.rootPath);
  }

  /**
   * Detect primary language (most prevalent)
   */
  async detectPrimaryLanguage(): Promise<string | null> {
    const languages = await this.detectAllLanguages();

    if (languages.length === 0) {
      return null;
    }

    // For now, return first detected
    // In production, analyze file counts to determine primary
    return languages[0];
  }

  /**
   * Get adapters for all detected languages
   */
  async getAdapters(): Promise<BaseLanguageAdapter[]> {
    const languages = await this.detectAllLanguages();
    const adapters: BaseLanguageAdapter[] = [];

    for (const language of languages) {
      const adapter = await LanguageAdapterRegistry.getInstance(language, this.rootPath);
      if (adapter) {
        adapters.push(adapter);
      }
    }

    return adapters;
  }

  /**
   * Get comprehensive project analysis across all languages
   */
  async analyzeProject(): Promise<{
    languages: string[];
    primaryLanguage: string | null;
    structures: ProjectStructure[];
    recommendedAgents: string[];
    capabilities: Record<string, LanguageCapabilities>;
  }> {
    const adapters = await this.getAdapters();
    const structures = await Promise.all(adapters.map(a => a.analyzeProject()));
    const capabilities: Record<string, LanguageCapabilities> = {};

    const allRecommendedAgents = new Set<string>();

    for (const adapter of adapters) {
      const structure = await adapter.analyzeProject();
      capabilities[structure.language] = adapter.getCapabilities();

      for (const agent of adapter.getRecommendedAgents()) {
        allRecommendedAgents.add(agent);
      }
    }

    return {
      languages: await this.detectAllLanguages(),
      primaryLanguage: await this.detectPrimaryLanguage(),
      structures,
      recommendedAgents: Array.from(allRecommendedAgents),
      capabilities
    };
  }
}