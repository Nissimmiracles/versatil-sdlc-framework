/**
 * Multi-Project Manager with Intelligent Isolation
 * Manages separate contexts, RAG systems, and documentation for different projects
 *
 * Features:
 * - Project-specific RAG knowledge bases
 * - Isolated agent configurations per project
 * - Cross-project learning without contamination
 * - Project-specific documentation systems
 * - Intelligent context switching
 * - Shared global learnings (optional)
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';
import { projectVisionManager, ProjectVision, ProjectHistory, MarketAnalysis } from '../project/project-vision-manager.js';

export interface ProjectContext {
  id: string;
  path: string;
  name: string;
  type: string;
  framework: string;
  version: string;
  signature: string;
  metadata: {
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    size: number;
    dependencies: string[];
    technologies: string[];
    patterns: string[];
    complexity: 'simple' | 'medium' | 'complex';
  };
  isolation: {
    ragNamespace: string;
    agentConfigs: Record<string, any>;
    documentationPath: string;
    cacheNamespace: string;
    learningPath: string;
  };
  configuration: {
    enabledAgents: string[];
    preferences: Record<string, any>;
    customRules: any[];
    qualityGates: any[];
  };
  // NEW: Three-layer context enhancement (Layer 2: Project Context)
  vision?: ProjectVision;
  history?: ProjectHistory;
  marketContext?: MarketAnalysis;
}

export interface ProjectIsolationConfig {
  strictIsolation: boolean;
  allowCrossProjectLearning: boolean;
  sharedGlobalKnowledge: boolean;
  automaticContextSwitching: boolean;
  ragPersistence: boolean;
  documentationSeparation: boolean;
  cacheIsolation: boolean;
}

export interface RAGNamespace {
  projectId: string;
  namespace: string;
  vectorStore: string;
  documentPath: string;
  embeddings: any[];
  metadata: {
    documentCount: number;
    lastUpdated: number;
    averageChunkSize: number;
    topics: string[];
  };
}

export interface CrossProjectLearning {
  patterns: Map<string, any>;
  bestPractices: Map<string, any>;
  commonSolutions: Map<string, any>;
  antiPatterns: Map<string, any>;
  performanceInsights: Map<string, any>;
}

export class MultiProjectManager extends EventEmitter {
  private projects: Map<string, ProjectContext> = new Map();
  private currentProject: string | null = null;
  private ragNamespaces: Map<string, RAGNamespace> = new Map();
  private crossProjectLearning: CrossProjectLearning;
  private config: ProjectIsolationConfig;
  private frameworkBasePath: string;

  constructor(config: Partial<ProjectIsolationConfig> = {}) {
    super();

    this.config = {
      strictIsolation: true,
      allowCrossProjectLearning: true,
      sharedGlobalKnowledge: false,
      automaticContextSwitching: true,
      ragPersistence: true,
      documentationSeparation: true,
      cacheIsolation: true,
      ...config
    };

    this.frameworkBasePath = join(process.env.HOME || '~', '.versatil-global');
    this.crossProjectLearning = this.initializeCrossProjectLearning();

    this.initialize();
  }

  private initializeCrossProjectLearning(): CrossProjectLearning {
    return {
      patterns: new Map(),
      bestPractices: new Map(),
      commonSolutions: new Map(),
      antiPatterns: new Map(),
      performanceInsights: new Map()
    };
  }

  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.frameworkBasePath, { recursive: true });
      await this.loadGlobalProjects();
      await this.loadCrossProjectLearning();

      this.emit('initialized', {
        projectCount: this.projects.size,
        frameworkPath: this.frameworkBasePath
      });

    } catch (error) {
      this.emit('error', {
        phase: 'initialization',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async registerProject(projectPath: string): Promise<ProjectContext> {
    try {
      const absolutePath = resolve(projectPath);
      const projectSignature = await this.generateProjectSignature(absolutePath);

      // Check if project already exists
      const existingProject = this.findProjectByPath(absolutePath);
      if (existingProject) {
        existingProject.metadata.lastAccessed = Date.now();
        existingProject.metadata.accessCount++;
        await this.saveProjectContext(existingProject);
        return existingProject;
      }

      const projectContext = await this.createProjectContext(absolutePath, projectSignature);
      await this.setupProjectIsolation(projectContext);

      this.projects.set(projectContext.id, projectContext);
      await this.saveProjectContext(projectContext);

      this.emit('project_registered', {
        projectId: projectContext.id,
        name: projectContext.name,
        path: projectContext.path
      });

      return projectContext;

    } catch (error) {
      this.emit('error', {
        operation: 'registerProject',
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async switchToProject(projectPath: string): Promise<ProjectContext> {
    try {
      const absolutePath = resolve(projectPath);
      let project = this.findProjectByPath(absolutePath);

      if (!project) {
        project = await this.registerProject(absolutePath);
      }

      // Switch context
      this.currentProject = project.id;
      project.metadata.lastAccessed = Date.now();
      project.metadata.accessCount++;

      // Load project-specific configurations
      await this.loadProjectConfigurations(project);
      await this.activateProjectRAG(project);
      await this.switchAgentConfigurations(project);

      this.emit('project_switched', {
        projectId: project.id,
        name: project.name,
        path: project.path,
        ragNamespace: project.isolation.ragNamespace
      });

      return project;

    } catch (error) {
      this.emit('error', {
        operation: 'switchToProject',
        projectPath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  getCurrentProject(): ProjectContext | null {
    if (!this.currentProject) return null;
    return this.projects.get(this.currentProject) || null;
  }

  async getProjectRAGContext(projectId?: string): Promise<RAGNamespace | null> {
    const id = projectId || this.currentProject;
    if (!id) return null;

    return this.ragNamespaces.get(id) || null;
  }

  async updateProjectDocumentation(
    content: string,
    category: string,
    projectId?: string
  ): Promise<void> {
    try {
      const id = projectId || this.currentProject;
      if (!id) throw new Error('No active project');

      const project = this.projects.get(id);
      if (!project) throw new Error('Project not found');

      const docPath = join(project.isolation.documentationPath, `${category}.md`);
      await fs.mkdir(project.isolation.documentationPath, { recursive: true });
      await fs.writeFile(docPath, content);

      // Update RAG with new documentation
      await this.updateProjectRAG(project, docPath, content);

      this.emit('documentation_updated', {
        projectId: id,
        category,
        path: docPath
      });

    } catch (error) {
      this.emit('error', {
        operation: 'updateProjectDocumentation',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async queryProjectKnowledge(
    query: string,
    projectId?: string,
    includeGlobal: boolean = false
  ): Promise<any[]> {
    try {
      const id = projectId || this.currentProject;
      if (!id) throw new Error('No active project');

      const ragNamespace = this.ragNamespaces.get(id);
      if (!ragNamespace) return [];

      // Query project-specific knowledge
      const projectResults = await this.queryRAGNamespace(ragNamespace, query);

      // Optionally include global/cross-project knowledge
      let globalResults: any[] = [];
      if (includeGlobal && this.config.sharedGlobalKnowledge) {
        globalResults = await this.queryCrossProjectKnowledge(query);
      }

      return [...projectResults, ...globalResults];

    } catch (error) {
      this.emit('error', {
        operation: 'queryProjectKnowledge',
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  async learnFromProject(
    projectId: string,
    learningType: 'pattern' | 'best_practice' | 'solution' | 'anti_pattern',
    data: any
  ): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) throw new Error('Project not found');

      // Store in project-specific learning
      await this.storeProjectLearning(project, learningType, data);

      // Optionally contribute to cross-project learning
      if (this.config.allowCrossProjectLearning) {
        await this.contributeToCrossProjectLearning(learningType, data, project);
      }

      this.emit('learning_stored', {
        projectId,
        learningType,
        dataSize: JSON.stringify(data).length
      });

    } catch (error) {
      this.emit('error', {
        operation: 'learnFromProject',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async getProjectInsights(projectId?: string): Promise<any> {
    try {
      const id = projectId || this.currentProject;
      if (!id) throw new Error('No active project');

      const project = this.projects.get(id);
      if (!project) throw new Error('Project not found');

      const insights = {
        project: {
          name: project.name,
          type: project.type,
          framework: project.framework,
          complexity: project.metadata.complexity,
          accessCount: project.metadata.accessCount
        },
        rag: await this.getRAGInsights(id),
        agents: await this.getAgentInsights(project),
        documentation: await this.getDocumentationInsights(project),
        learnings: await this.getProjectLearningInsights(project),
        recommendations: await this.getProjectRecommendations(project)
      };

      return insights;

    } catch (error) {
      this.emit('error', {
        operation: 'getProjectInsights',
        error: error instanceof Error ? error.message : String(error)
      });
      return {};
    }
  }

  async exportProjectData(projectId: string, outputPath: string): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) throw new Error('Project not found');

      const exportData = {
        version: '1.0.0',
        timestamp: Date.now(),
        project: project,
        rag: this.ragNamespaces.get(projectId),
        documentation: await this.exportProjectDocumentation(project),
        learnings: await this.exportProjectLearnings(project),
        configurations: await this.exportProjectConfigurations(project)
      };

      await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));

      this.emit('project_exported', {
        projectId,
        outputPath,
        size: JSON.stringify(exportData).length
      });

    } catch (error) {
      this.emit('error', {
        operation: 'exportProjectData',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  async importProjectData(inputPath: string): Promise<string> {
    try {
      const data = await fs.readFile(inputPath, 'utf-8');
      const importData = JSON.parse(data);

      if (importData.version !== '1.0.0') {
        throw new Error(`Incompatible version: ${importData.version}`);
      }

      const project: ProjectContext = importData.project;

      // Import project context
      this.projects.set(project.id, project);
      await this.saveProjectContext(project);

      // Import RAG namespace
      if (importData.rag) {
        this.ragNamespaces.set(project.id, importData.rag);
      }

      // Restore project isolation
      await this.setupProjectIsolation(project);

      // Import documentation and learnings
      if (importData.documentation) {
        await this.importProjectDocumentation(project, importData.documentation);
      }

      if (importData.learnings) {
        await this.importProjectLearnings(project, importData.learnings);
      }

      this.emit('project_imported', {
        projectId: project.id,
        inputPath,
        name: project.name
      });

      return project.id;

    } catch (error) {
      this.emit('error', {
        operation: 'importProjectData',
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  async listProjects(): Promise<ProjectContext[]> {
    return Array.from(this.projects.values()).sort((a, b) =>
      b.metadata.lastAccessed - a.metadata.lastAccessed
    );
  }

  async removeProject(projectId: string, deleteData: boolean = false): Promise<void> {
    try {
      const project = this.projects.get(projectId);
      if (!project) throw new Error('Project not found');

      // Remove from memory
      this.projects.delete(projectId);
      this.ragNamespaces.delete(projectId);

      // Optionally delete persistent data
      if (deleteData) {
        await this.deleteProjectData(project);
      }

      // Update current project if needed
      if (this.currentProject === projectId) {
        this.currentProject = null;
      }

      this.emit('project_removed', {
        projectId,
        name: project.name,
        dataDeleted: deleteData
      });

    } catch (error) {
      this.emit('error', {
        operation: 'removeProject',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async generateProjectSignature(projectPath: string): Promise<string> {
    try {
      const packageJson = await this.safeReadJson(join(projectPath, 'package.json'));
      const tsConfig = await this.safeReadJson(join(projectPath, 'tsconfig.json'));

      const signatureData = {
        path: projectPath,
        packageJson: packageJson?.name || '',
        dependencies: Object.keys(packageJson?.dependencies || {}),
        devDependencies: Object.keys(packageJson?.devDependencies || {}),
        typescript: !!tsConfig,
        timestamp: Date.now()
      };

      return createHash('md5')
        .update(JSON.stringify(signatureData))
        .digest('hex');

    } catch (error) {
      return createHash('md5')
        .update(`${projectPath}-${Date.now()}`)
        .digest('hex');
    }
  }

  private async createProjectContext(
    projectPath: string,
    signature: string
  ): Promise<ProjectContext> {
    const projectName = projectPath.split('/').pop() || 'unknown';
    const projectId = `project_${signature}`;

    const packageJson = await this.safeReadJson(join(projectPath, 'package.json'));
    const projectType = this.detectProjectType(projectPath, packageJson);
    const framework = this.detectFramework(packageJson);

    return {
      id: projectId,
      path: projectPath,
      name: projectName,
      type: projectType,
      framework,
      version: packageJson?.version || '1.0.0',
      signature,
      metadata: {
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        size: 0,
        dependencies: Object.keys(packageJson?.dependencies || {}),
        technologies: this.detectTechnologies(packageJson),
        patterns: [],
        complexity: 'medium'
      },
      isolation: {
        ragNamespace: `rag_${projectId}`,
        agentConfigs: {},
        documentationPath: join(this.frameworkBasePath, 'projects', projectId, 'docs'),
        cacheNamespace: `cache_${projectId}`,
        learningPath: join(this.frameworkBasePath, 'projects', projectId, 'learning')
      },
      configuration: {
        enabledAgents: [],
        preferences: {},
        customRules: [],
        qualityGates: []
      }
    };
  }

  private async setupProjectIsolation(project: ProjectContext): Promise<void> {
    const projectBasePath = join(this.frameworkBasePath, 'projects', project.id);

    // Create isolated directories
    await fs.mkdir(project.isolation.documentationPath, { recursive: true });
    await fs.mkdir(project.isolation.learningPath, { recursive: true });
    await fs.mkdir(join(projectBasePath, 'cache'), { recursive: true });
    await fs.mkdir(join(projectBasePath, 'rag'), { recursive: true });

    // Initialize RAG namespace
    const ragNamespace: RAGNamespace = {
      projectId: project.id,
      namespace: project.isolation.ragNamespace,
      vectorStore: join(projectBasePath, 'rag', 'vectors.json'),
      documentPath: join(projectBasePath, 'rag', 'documents'),
      embeddings: [],
      metadata: {
        documentCount: 0,
        lastUpdated: Date.now(),
        averageChunkSize: 0,
        topics: []
      }
    };

    this.ragNamespaces.set(project.id, ragNamespace);
    await fs.mkdir(ragNamespace.documentPath, { recursive: true });
  }

  private findProjectByPath(projectPath: string): ProjectContext | undefined {
    return Array.from(this.projects.values()).find(
      project => project.path === projectPath
    );
  }

  private detectProjectType(projectPath: string, packageJson: any): string {
    if (packageJson?.dependencies?.react || packageJson?.devDependencies?.react) {
      return 'react-application';
    }
    if (packageJson?.dependencies?.vue || packageJson?.devDependencies?.vue) {
      return 'vue-application';
    }
    if (packageJson?.dependencies?.express || packageJson?.devDependencies?.express) {
      return 'node-server';
    }
    if (packageJson?.dependencies?.typescript || packageJson?.devDependencies?.typescript) {
      return 'typescript-application';
    }
    return 'generic-project';
  }

  private detectFramework(packageJson: any): string {
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };

    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps.angular) return 'angular';
    if (deps.svelte) return 'svelte';
    if (deps.express) return 'express';
    if (deps.fastify) return 'fastify';
    if (deps.typescript) return 'typescript';

    return 'vanilla';
  }

  private detectTechnologies(packageJson: any): string[] {
    const deps = { ...packageJson?.dependencies, ...packageJson?.devDependencies };
    const technologies = [];

    // Frontend frameworks
    if (deps.react) technologies.push('react');
    if (deps.vue) technologies.push('vue');
    if (deps.angular) technologies.push('angular');

    // Backend frameworks
    if (deps.express) technologies.push('express');
    if (deps.fastify) technologies.push('fastify');

    // Testing
    if (deps.jest) technologies.push('jest');
    if (deps.mocha) technologies.push('mocha');
    if (deps.playwright) technologies.push('playwright');

    // Build tools
    if (deps.webpack) technologies.push('webpack');
    if (deps.vite) technologies.push('vite');
    if (deps.rollup) technologies.push('rollup');

    // Languages
    if (deps.typescript) technologies.push('typescript');

    return technologies;
  }

  private async safeReadJson(filePath: string): Promise<any> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private async loadGlobalProjects(): Promise<void> {
    try {
      const projectsPath = join(this.frameworkBasePath, 'projects.json');
      const content = await fs.readFile(projectsPath, 'utf-8');
      const data = JSON.parse(content);

      for (const [id, project] of Object.entries(data.projects || {})) {
        this.projects.set(id, project as ProjectContext);
      }
    } catch (error) {
      // No existing projects
    }
  }

  private async saveProjectContext(project: ProjectContext): Promise<void> {
    try {
      const projectsPath = join(this.frameworkBasePath, 'projects.json');
      const existingData = await this.safeReadJson(projectsPath) || { projects: {} };

      existingData.projects[project.id] = project;
      existingData.lastUpdated = Date.now();

      await fs.writeFile(projectsPath, JSON.stringify(existingData, null, 2));
    } catch (error) {
      this.emit('error', {
        operation: 'saveProjectContext',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async loadCrossProjectLearning(): Promise<void> {
    try {
      const learningPath = join(this.frameworkBasePath, 'cross-project-learning.json');
      const content = await fs.readFile(learningPath, 'utf-8');
      const data = JSON.parse(content);

      // Restore learning maps
      this.crossProjectLearning.patterns = new Map(data.patterns || []);
      this.crossProjectLearning.bestPractices = new Map(data.bestPractices || []);
      this.crossProjectLearning.commonSolutions = new Map(data.commonSolutions || []);
      this.crossProjectLearning.antiPatterns = new Map(data.antiPatterns || []);
      this.crossProjectLearning.performanceInsights = new Map(data.performanceInsights || []);
    } catch (error) {
      // No existing cross-project learning
    }
  }

  // Placeholder methods for advanced functionality
  private async loadProjectConfigurations(project: ProjectContext): Promise<void> {
    // Load project-specific agent configurations
  }

  private async activateProjectRAG(project: ProjectContext): Promise<void> {
    // Activate project-specific RAG namespace
  }

  private async switchAgentConfigurations(project: ProjectContext): Promise<void> {
    // Switch to project-specific agent configurations
  }

  private async updateProjectRAG(project: ProjectContext, docPath: string, content: string): Promise<void> {
    // Update project RAG with new documentation
  }

  private async queryRAGNamespace(namespace: RAGNamespace, query: string): Promise<any[]> {
    // Query project-specific RAG namespace
    return [];
  }

  private async queryCrossProjectKnowledge(query: string): Promise<any[]> {
    // Query cross-project knowledge base
    return [];
  }

  // ==================== NEW: Three-Layer Context Enhancement Methods ====================

  /**
   * Store project vision
   */
  async storeProjectVision(projectId: string, vision: Partial<ProjectVision>): Promise<void> {
    await projectVisionManager.storeVision(projectId, vision);

    // Update in-memory project context
    const project = this.projects.get(projectId);
    if (project) {
      project.vision = await projectVisionManager.getVision(projectId) || undefined;
      this.emit('project_vision_stored', { projectId, vision });
    }
  }

  /**
   * Get project vision
   */
  async getProjectVision(projectId: string): Promise<ProjectVision | null> {
    return await projectVisionManager.getVision(projectId);
  }

  /**
   * Update market context for project
   */
  async updateProjectMarketContext(projectId: string, market: MarketAnalysis): Promise<void> {
    await projectVisionManager.updateMarketContext(projectId, market);

    // Update in-memory project context
    const project = this.projects.get(projectId);
    if (project) {
      project.marketContext = await projectVisionManager.getMarketContext(projectId) || undefined;
      this.emit('project_market_updated', { projectId, market });
    }
  }

  /**
   * Track project event (feature added, decision made, etc.)
   */
  async trackProjectEvent(
    projectId: string,
    event: { type: string; description: string; impact: string; agent: string; metadata?: any }
  ): Promise<void> {
    await projectVisionManager.trackEvent(projectId, event as any);
    this.emit('project_event_tracked', { projectId, event });
  }

  /**
   * Track milestone
   */
  async trackProjectMilestone(projectId: string, milestone: any): Promise<void> {
    await projectVisionManager.trackMilestone(projectId, milestone);
    this.emit('project_milestone_tracked', { projectId, milestone });
  }

  /**
   * Get project history (events, milestones, decisions)
   */
  async getProjectHistory(projectId: string, limit?: number): Promise<ProjectHistory> {
    return await projectVisionManager.getProjectHistory(projectId, limit);
  }

  /**
   * Get enriched project context (includes vision, history, market)
   */
  async getEnrichedProjectContext(projectId: string): Promise<ProjectContext | null> {
    const project = this.projects.get(projectId);
    if (!project) return null;

    // Enrich with vision, history, market context
    project.vision = await projectVisionManager.getVision(projectId) || undefined;
    project.history = await projectVisionManager.getProjectHistory(projectId, 50);
    project.marketContext = await projectVisionManager.getMarketContext(projectId) || undefined;

    return project;
  }

  private async storeProjectLearning(project: ProjectContext, type: string, data: any): Promise<void> {
    // Store learning in project-specific location
  }

  private async contributeToCrossProjectLearning(type: string, data: any, project: ProjectContext): Promise<void> {
    // Contribute anonymized learning to cross-project knowledge
  }

  private async getRAGInsights(projectId: string): Promise<any> {
    const namespace = this.ragNamespaces.get(projectId);
    return namespace?.metadata || {};
  }

  private async getAgentInsights(project: ProjectContext): Promise<any> {
    return {
      enabled: project.configuration.enabledAgents,
      recommendations: []
    };
  }

  private async getDocumentationInsights(project: ProjectContext): Promise<any> {
    return {
      path: project.isolation.documentationPath,
      files: []
    };
  }

  private async getProjectLearningInsights(project: ProjectContext): Promise<any> {
    return {
      patterns: 0,
      solutions: 0,
      bestPractices: 0
    };
  }

  private async getProjectRecommendations(project: ProjectContext): Promise<any[]> {
    return [];
  }

  private async exportProjectDocumentation(project: ProjectContext): Promise<any> {
    return {};
  }

  private async exportProjectLearnings(project: ProjectContext): Promise<any> {
    return {};
  }

  private async exportProjectConfigurations(project: ProjectContext): Promise<any> {
    return project.configuration;
  }

  private async importProjectDocumentation(project: ProjectContext, data: any): Promise<void> {
    // Import documentation data
  }

  private async importProjectLearnings(project: ProjectContext, data: any): Promise<void> {
    // Import learning data
  }

  private async deleteProjectData(project: ProjectContext): Promise<void> {
    const projectBasePath = join(this.frameworkBasePath, 'projects', project.id);
    await fs.rmdir(projectBasePath, { recursive: true });
  }
}

export default MultiProjectManager;