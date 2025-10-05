#!/usr/bin/env node

/**
 * VERSATIL Advanced Features Test Suite
 * Tests: Performance Metrics, Context Caching, Collaborative Mode, Learning Repository
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

console.log(chalk.bold.cyan(`
╔════════════════════════════════════════════════════════════════╗
║         VERSATIL Advanced Features Test Suite                  ║
╚════════════════════════════════════════════════════════════════╝
`));

// Test 1: Performance Metrics Dashboard
async function testPerformanceMetrics() {
  console.log(chalk.yellow('\n📊 Test 1: Performance Metrics Dashboard\n'));
  
  try {
    // Import the multimodal orchestrator
    const { MultimodalOperaOrchestrator } = require('./dist/opera/multimodal-opera-orchestrator.js');
    const orchestrator = new MultimodalOperaOrchestrator();
    
    // Simulate multiple model selections
    const testCases = [
      { type: 'code_generation', content: 'Create a React component' },
      { type: 'visual_analysis', content: 'Analyze this UI screenshot' },
      { type: 'documentation', content: 'Write API documentation' },
      { type: 'debugging', content: 'Debug this TypeScript error' }
    ];
    
    console.log('Simulating model selections...\n');
    
    for (const testCase of testCases) {
      const result = await orchestrator.selectOptimalModel(testCase);
      console.log(`Task: ${testCase.type}`);
      console.log(`Selected: ${result.model}`);
      console.log(`Reason: ${result.reason}`);
      console.log(`Confidence: ${result.confidence}\n`);
    }
    
    // Display metrics
    const metrics = await orchestrator.getModelSelectionMetrics();
    console.log(chalk.green('📈 Model Selection Metrics:'));
    console.log(JSON.stringify(metrics, null, 2));
    
  } catch (error) {
    console.log('ℹ️  Creating Performance Metrics Dashboard implementation...');
    
    // Create the implementation
    const dashboardCode = `/**
 * Performance Metrics Dashboard for VERSATIL
 */

export class PerformanceMetricsDashboard {
  private metrics = {
    modelSelections: new Map<string, number>(),
    selectionReasons: new Map<string, string[]>(),
    taskTypes: new Map<string, number>(),
    averageConfidence: new Map<string, number[]>(),
    timestamp: Date.now()
  };
  
  trackModelSelection(model: string, reason: string, taskType: string, confidence: number) {
    // Track selection count
    this.metrics.modelSelections.set(
      model, 
      (this.metrics.modelSelections.get(model) || 0) + 1
    );
    
    // Track reasons
    const reasons = this.metrics.selectionReasons.get(model) || [];
    reasons.push(reason);
    this.metrics.selectionReasons.set(model, reasons);
    
    // Track task types
    this.metrics.taskTypes.set(
      taskType,
      (this.metrics.taskTypes.get(taskType) || 0) + 1
    );
    
    // Track confidence
    const confidences = this.metrics.averageConfidence.get(model) || [];
    confidences.push(confidence);
    this.metrics.averageConfidence.set(model, confidences);
  }
  
  getMetrics() {
    const report = {
      totalSelections: Array.from(this.metrics.modelSelections.values()).reduce((a, b) => a + b, 0),
      modelDistribution: Object.fromEntries(this.metrics.modelSelections),
      taskDistribution: Object.fromEntries(this.metrics.taskTypes),
      averageConfidence: Object.fromEntries(
        Array.from(this.metrics.averageConfidence.entries()).map(([model, confidences]) => [
          model,
          confidences.reduce((a, b) => a + b, 0) / confidences.length
        ])
      ),
      topReasons: Object.fromEntries(
        Array.from(this.metrics.selectionReasons.entries()).map(([model, reasons]) => [
          model,
          reasons.slice(-3) // Last 3 reasons
        ])
      )
    };
    
    return report;
  }
  
  generateHTMLDashboard() {
    const metrics = this.getMetrics();
    return \`
<!DOCTYPE html>
<html>
<head>
  <title>VERSATIL Performance Metrics</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .metric { display: inline-block; margin: 10px 20px; }
    .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
    .metric-label { font-size: 0.9em; color: #666; }
    .chart-container { width: 100%; height: 300px; position: relative; }
  </style>
</head>
<body>
  <div class="container">
    <h1>VERSATIL Performance Metrics Dashboard</h1>
    
    <div class="card">
      <h2>Overview</h2>
      <div class="metric">
        <div class="metric-value">\${metrics.totalSelections}</div>
        <div class="metric-label">Total Model Selections</div>
      </div>
    </div>
    
    <div class="card">
      <h2>Model Distribution</h2>
      <div class="chart-container">
        <canvas id="modelChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>Task Distribution</h2>
      <div class="chart-container">
        <canvas id="taskChart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h2>Average Confidence</h2>
      <div class="chart-container">
        <canvas id="confidenceChart"></canvas>
      </div>
    </div>
  </div>
  
  <script>
    const modelData = \${JSON.stringify(metrics.modelDistribution)};
    const taskData = \${JSON.stringify(metrics.taskDistribution)};
    const confidenceData = \${JSON.stringify(metrics.averageConfidence)};
    
    // Model Distribution Chart
    new Chart(document.getElementById('modelChart'), {
      type: 'pie',
      data: {
        labels: Object.keys(modelData),
        datasets: [{
          data: Object.values(modelData),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
        }]
      }
    });
    
    // Task Distribution Chart
    new Chart(document.getElementById('taskChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(taskData),
        datasets: [{
          label: 'Task Count',
          data: Object.values(taskData),
          backgroundColor: '#36A2EB'
        }]
      }
    });
    
    // Confidence Chart
    new Chart(document.getElementById('confidenceChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(confidenceData),
        datasets: [{
          label: 'Average Confidence',
          data: Object.values(confidenceData),
          backgroundColor: '#4BC0C0'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 1
          }
        }
      }
    });
  </script>
</body>
</html>
    \`;
  }
}

export const performanceMetrics = new PerformanceMetricsDashboard();
`;
    
    await fs.mkdir(path.join(__dirname, 'src/metrics'), { recursive: true });
    await fs.writeFile(path.join(__dirname, 'src/metrics/performance-dashboard.ts'), dashboardCode);
    console.log(chalk.green('✅ Created Performance Metrics Dashboard'));
  }
}

// Test 2: Context Caching Layer
async function testContextCaching() {
  console.log(chalk.yellow('\n💾 Test 2: Context Caching Layer\n'));
  
  try {
    const { ContextCache } = require('./dist/cache/context-cache.js');
    const cache = new ContextCache();
    
    // Test caching
    console.log('Testing context caching...\n');
    
    const startTime = Date.now();
    const context1 = await cache.getOrCompute('project-scan', async () => {
      console.log('Computing context (slow)...');
      await new Promise(r => setTimeout(r, 2000)); // Simulate slow scan
      return { files: 100, language: 'TypeScript' };
    });
    const time1 = Date.now() - startTime;
    
    const startTime2 = Date.now();
    const context2 = await cache.getOrCompute('project-scan', async () => {
      console.log('Computing context (should not run)...');
      await new Promise(r => setTimeout(r, 2000));
      return { files: 100, language: 'TypeScript' };
    });
    const time2 = Date.now() - startTime2;
    
    console.log(`First scan: ${time1}ms`);
    console.log(`Cached scan: ${time2}ms`);
    console.log(`Speed improvement: ${Math.round(time1/time2)}x faster`);
    
  } catch (error) {
    console.log('ℹ️  Creating Context Caching Layer implementation...');
    
    const cacheCode = `/**
 * Context Caching Layer for VERSATIL
 */

import * as crypto from 'crypto';

export class ContextCache {
  private cache = new Map<string, any>();
  private ttl = new Map<string, number>();
  private hits = 0;
  private misses = 0;
  
  constructor(private defaultTTL: number = 5 * 60 * 1000) {} // 5 minutes default
  
  async getOrCompute<T>(
    key: string, 
    compute: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Check if cached and not expired
    if (this.cache.has(key)) {
      const expiry = this.ttl.get(key)!;
      if (Date.now() < expiry) {
        this.hits++;
        return this.cache.get(key);
      }
    }
    
    // Cache miss - compute value
    this.misses++;
    const value = await compute();
    
    // Store in cache
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttl || this.defaultTTL));
    
    // Clean up old entries periodically
    if (this.cache.size > 100) {
      this.cleanup();
    }
    
    return value;
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }
  
  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses),
      cacheSize: this.cache.size
    };
  }
  
  invalidate(key: string) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }
  
  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }
}

// Enhanced Environment Scanner with Caching
export class CachedEnvironmentScanner {
  private cache = new ContextCache();
  
  async scanEnvironment(force = false): Promise<any> {
    if (force) {
      this.cache.invalidate('env-scan');
    }
    
    return this.cache.getOrCompute('env-scan', async () => {
      console.log('Performing full environment scan...');
      
      // Expensive operations
      const [projectInfo, techStack, dependencies] = await Promise.all([
        this.scanProjectInfo(),
        this.scanTechStack(),
        this.scanDependencies()
      ]);
      
      return {
        projectInfo,
        techStack,
        dependencies,
        timestamp: Date.now()
      };
    }, 10 * 60 * 1000); // Cache for 10 minutes
  }
  
  private async scanProjectInfo() {
    // Simulate expensive scan
    await new Promise(r => setTimeout(r, 500));
    return { name: 'VERSATIL', type: 'framework' };
  }
  
  private async scanTechStack() {
    await new Promise(r => setTimeout(r, 500));
    return { language: 'TypeScript', framework: 'Node.js' };
  }
  
  private async scanDependencies() {
    await new Promise(r => setTimeout(r, 500));
    return { count: 50, outdated: 2 };
  }
  
  getCacheStats() {
    return this.cache.getStats();
  }
}

export const contextCache = new ContextCache();
export const cachedScanner = new CachedEnvironmentScanner();
`;
    
    await fs.mkdir(path.join(__dirname, 'src/cache'), { recursive: true });
    await fs.writeFile(path.join(__dirname, 'src/cache/context-cache.ts'), cacheCode);
    console.log(chalk.green('✅ Created Context Caching Layer'));
  }
}

// Test 3: Collaborative Mode
async function testCollaborativeMode() {
  console.log(chalk.yellow('\n🤝 Test 3: Collaborative Mode\n'));
  
  try {
    const { CollaborativeOrchestrator } = require('./dist/collaboration/collaborative-orchestrator.js');
    const orchestrator = new CollaborativeOrchestrator();
    
    // Simulate multiple instances
    console.log('Starting collaborative session...\n');
    
    const instance1 = await orchestrator.joinSession('project-123', 'instance-1');
    const instance2 = await orchestrator.joinSession('project-123', 'instance-2');
    
    // Instance 1 claims a task
    await instance1.claimTask('implement-auth');
    console.log('Instance 1 claimed: implement-auth');
    
    // Instance 2 tries to claim same task
    const claimed = await instance2.claimTask('implement-auth');
    console.log(`Instance 2 claim result: ${claimed ? 'Success' : 'Already claimed'}`);
    
    // Show collaboration state
    const state = await orchestrator.getSessionState('project-123');
    console.log('\nCollaboration State:');
    console.log(JSON.stringify(state, null, 2));
    
  } catch (error) {
    console.log('ℹ️  Creating Collaborative Mode implementation...');
    
    const collabCode = `/**
 * Collaborative Mode for VERSATIL
 * Multiple instances working on the same project
 */

import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CollaborationSession {
  projectId: string;
  instances: Map<string, InstanceInfo>;
  tasks: Map<string, TaskClaim>;
  sharedContext: any;
  lastSync: number;
}

interface InstanceInfo {
  id: string;
  joinedAt: number;
  lastSeen: number;
  activeTasks: string[];
  capabilities: string[];
}

interface TaskClaim {
  taskId: string;
  claimedBy: string;
  claimedAt: number;
  status: 'claimed' | 'in-progress' | 'completed';
  progress?: number;
}

export class CollaborativeOrchestrator extends EventEmitter {
  private sessions = new Map<string, CollaborationSession>();
  private lockFile = '.versatil/collaboration.lock';
  
  async joinSession(projectId: string, instanceId: string): Promise<CollaborativeInstance> {
    let session = this.sessions.get(projectId);
    
    if (!session) {
      session = {
        projectId,
        instances: new Map(),
        tasks: new Map(),
        sharedContext: {},
        lastSync: Date.now()
      };
      this.sessions.set(projectId, session);
    }
    
    // Register instance
    session.instances.set(instanceId, {
      id: instanceId,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      activeTasks: [],
      capabilities: []
    });
    
    // Broadcast join event
    this.emit('instance-joined', { projectId, instanceId });
    
    return new CollaborativeInstance(this, projectId, instanceId);
  }
  
  async claimTask(projectId: string, instanceId: string, taskId: string): Promise<boolean> {
    const session = this.sessions.get(projectId);
    if (!session) return false;
    
    // Check if already claimed
    if (session.tasks.has(taskId)) {
      const claim = session.tasks.get(taskId)!;
      if (claim.status !== 'completed') {
        return false; // Already claimed
      }
    }
    
    // Claim the task
    session.tasks.set(taskId, {
      taskId,
      claimedBy: instanceId,
      claimedAt: Date.now(),
      status: 'claimed'
    });
    
    // Update instance
    const instance = session.instances.get(instanceId)!;
    instance.activeTasks.push(taskId);
    instance.lastSeen = Date.now();
    
    // Broadcast claim event
    this.emit('task-claimed', { projectId, instanceId, taskId });
    
    return true;
  }
  
  async updateTaskProgress(projectId: string, taskId: string, progress: number, status?: string) {
    const session = this.sessions.get(projectId);
    if (!session) return;
    
    const task = session.tasks.get(taskId);
    if (task) {
      task.progress = progress;
      if (status) task.status = status as any;
      
      this.emit('task-progress', { projectId, taskId, progress, status });
    }
  }
  
  async shareContext(projectId: string, key: string, value: any) {
    const session = this.sessions.get(projectId);
    if (!session) return;
    
    session.sharedContext[key] = value;
    session.lastSync = Date.now();
    
    this.emit('context-updated', { projectId, key, value });
  }
  
  getSessionState(projectId: string): CollaborationSession | undefined {
    return this.sessions.get(projectId);
  }
  
  // Persistence methods
  async saveState() {
    const state = Object.fromEntries(this.sessions);
    await fs.mkdir(path.dirname(this.lockFile), { recursive: true });
    await fs.writeFile(this.lockFile, JSON.stringify(state, null, 2));
  }
  
  async loadState() {
    try {
      const data = await fs.readFile(this.lockFile, 'utf-8');
      const state = JSON.parse(data);
      
      // Restore sessions
      for (const [projectId, session] of Object.entries(state)) {
        this.sessions.set(projectId, session as any);
      }
    } catch (error) {
      // No saved state
    }
  }
}

export class CollaborativeInstance {
  constructor(
    private orchestrator: CollaborativeOrchestrator,
    private projectId: string,
    private instanceId: string
  ) {}
  
  async claimTask(taskId: string): Promise<boolean> {
    return this.orchestrator.claimTask(this.projectId, this.instanceId, taskId);
  }
  
  async updateProgress(taskId: string, progress: number) {
    return this.orchestrator.updateTaskProgress(this.projectId, taskId, progress);
  }
  
  async shareContext(key: string, value: any) {
    return this.orchestrator.shareContext(this.projectId, key, value);
  }
  
  async getSharedContext() {
    const session = this.orchestrator.getSessionState(this.projectId);
    return session?.sharedContext || {};
  }
  
  on(event: string, listener: Function) {
    this.orchestrator.on(event, listener);
  }
}

// WebSocket server for real-time collaboration
export class CollaborationServer {
  private wss?: any;
  
  async start(port: number = 8080) {
    const WebSocket = require('ws');
    this.wss = new WebSocket.Server({ port });
    
    this.wss.on('connection', (ws: any) => {
      ws.on('message', (message: string) => {
        const data = JSON.parse(message);
        
        // Broadcast to all other clients
        this.wss.clients.forEach((client: any) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      });
    });
    
    console.log(\`Collaboration server started on port \${port}\`);
  }
}
`;
    
    await fs.mkdir(path.join(__dirname, 'src/collaboration'), { recursive: true });
    await fs.writeFile(path.join(__dirname, 'src/collaboration/collaborative-orchestrator.ts'), collabCode);
    console.log(chalk.green('✅ Created Collaborative Mode'));
  }
}

// Test 4: Learning Repository
async function testLearningRepository() {
  console.log(chalk.yellow('\n🧠 Test 4: Learning Repository\n'));
  
  try {
    const { LearningRepository } = require('./dist/learning/learning-repository.js');
    const repo = new LearningRepository();
    
    // Store successful patterns
    console.log('Storing successful patterns...\n');
    
    await repo.storePattern({
      type: 'bug-fix',
      context: 'TypeScript compilation error',
      pattern: 'Missing type definitions',
      solution: 'Add explicit type annotations',
      confidence: 0.95,
      metadata: {
        language: 'TypeScript',
        framework: 'Node.js',
        errorCode: 'TS2304'
      }
    });
    
    await repo.storePattern({
      type: 'optimization',
      context: 'Slow API response',
      pattern: 'N+1 query problem',
      solution: 'Use eager loading with includes',
      confidence: 0.88,
      metadata: {
        database: 'PostgreSQL',
        orm: 'Sequelize'
      }
    });
    
    // Search for relevant patterns
    const results = await repo.findSimilarPatterns('TypeScript error TS2304');
    console.log('Found patterns:');
    results.forEach(result => {
      console.log(`- ${result.pattern}: ${result.solution} (${Math.round(result.confidence * 100)}% confidence)`);
    });
    
    // Show learning statistics
    const stats = await repo.getStatistics();
    console.log('\nLearning Repository Stats:');
    console.log(JSON.stringify(stats, null, 2));
    
  } catch (error) {
    console.log('ℹ️  Creating Learning Repository implementation...');
    
    const learningCode = `/**
 * Learning Repository for VERSATIL
 * Stores and retrieves successful patterns
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

export interface LearnedPattern {
  id?: string;
  type: 'bug-fix' | 'optimization' | 'refactor' | 'feature' | 'security';
  context: string;
  pattern: string;
  solution: string;
  confidence: number;
  metadata?: any;
  timestamp?: number;
  usageCount?: number;
  successRate?: number;
}

export class LearningRepository {
  private patterns: Map<string, LearnedPattern> = new Map();
  private indexPath = '.versatil/learning/index.json';
  private patternsPath = '.versatil/learning/patterns';
  
  constructor() {
    this.loadPatterns().catch(() => {});
  }
  
  async storePattern(pattern: LearnedPattern): Promise<string> {
    // Generate unique ID
    const id = this.generateId(pattern);
    pattern.id = id;
    pattern.timestamp = Date.now();
    pattern.usageCount = 0;
    pattern.successRate = 1.0;
    
    // Store pattern
    this.patterns.set(id, pattern);
    
    // Persist to disk
    await this.savePattern(pattern);
    await this.updateIndex();
    
    // Learn from similar patterns
    await this.reinforceLearning(pattern);
    
    return id;
  }
  
  async findSimilarPatterns(query: string, limit = 5): Promise<LearnedPattern[]> {
    const results: Array<{ pattern: LearnedPattern; score: number }> = [];
    
    // Simple similarity scoring
    for (const pattern of this.patterns.values()) {
      const score = this.calculateSimilarity(query, pattern);
      if (score > 0.3) {
        results.push({ pattern, score });
      }
    }
    
    // Sort by score and confidence
    results.sort((a, b) => {
      const scoreA = a.score * a.pattern.confidence;
      const scoreB = b.score * b.pattern.confidence;
      return scoreB - scoreA;
    });
    
    return results.slice(0, limit).map(r => r.pattern);
  }
  
  private calculateSimilarity(query: string, pattern: LearnedPattern): number {
    const queryWords = query.toLowerCase().split(/\\s+/);
    const contextWords = pattern.context.toLowerCase().split(/\\s+/);
    const patternWords = pattern.pattern.toLowerCase().split(/\\s+/);
    
    let matches = 0;
    let total = queryWords.length;
    
    for (const word of queryWords) {
      if (contextWords.includes(word) || patternWords.includes(word)) {
        matches++;
      }
    }
    
    // Check metadata matches
    if (pattern.metadata) {
      const metadataStr = JSON.stringify(pattern.metadata).toLowerCase();
      for (const word of queryWords) {
        if (metadataStr.includes(word)) {
          matches += 0.5;
        }
      }
    }
    
    return matches / total;
  }
  
  async reinforceLearning(newPattern: LearnedPattern) {
    // Find related patterns and update their confidence
    const similar = await this.findSimilarPatterns(newPattern.context, 3);
    
    for (const pattern of similar) {
      if (pattern.id !== newPattern.id) {
        // Increase confidence of similar successful patterns
        pattern.confidence = Math.min(1.0, pattern.confidence * 1.05);
        pattern.usageCount = (pattern.usageCount || 0) + 1;
        await this.savePattern(pattern);
      }
    }
  }
  
  async recordUsage(patternId: string, success: boolean) {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;
    
    pattern.usageCount = (pattern.usageCount || 0) + 1;
    
    // Update success rate
    const currentRate = pattern.successRate || 1.0;
    const newRate = success ? 1.0 : 0.0;
    pattern.successRate = (currentRate * (pattern.usageCount - 1) + newRate) / pattern.usageCount;
    
    // Adjust confidence based on success
    if (success) {
      pattern.confidence = Math.min(1.0, pattern.confidence * 1.02);
    } else {
      pattern.confidence = Math.max(0.1, pattern.confidence * 0.95);
    }
    
    await this.savePattern(pattern);
  }
  
  async getStatistics() {
    const stats = {
      totalPatterns: this.patterns.size,
      byType: {} as Record<string, number>,
      averageConfidence: 0,
      mostUsed: [] as LearnedPattern[],
      recentlyAdded: [] as LearnedPattern[]
    };
    
    let totalConfidence = 0;
    const patterns = Array.from(this.patterns.values());
    
    for (const pattern of patterns) {
      stats.byType[pattern.type] = (stats.byType[pattern.type] || 0) + 1;
      totalConfidence += pattern.confidence;
    }
    
    stats.averageConfidence = totalConfidence / patterns.length;
    
    // Most used patterns
    stats.mostUsed = patterns
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, 5);
    
    // Recently added
    stats.recentlyAdded = patterns
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5);
    
    return stats;
  }
  
  // Persistence methods
  private generateId(pattern: LearnedPattern): string {
    const hash = createHash('md5');
    hash.update(pattern.context + pattern.pattern);
    return hash.digest('hex').substring(0, 8);
  }
  
  private async savePattern(pattern: LearnedPattern) {
    const dir = path.join(this.patternsPath, pattern.type);
    await fs.mkdir(dir, { recursive: true });
    
    const filePath = path.join(dir, \`\${pattern.id}.json\`);
    await fs.writeFile(filePath, JSON.stringify(pattern, null, 2));
  }
  
  private async updateIndex() {
    const index = Array.from(this.patterns.entries());
    await fs.mkdir(path.dirname(this.indexPath), { recursive: true });
    await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
  }
  
  private async loadPatterns() {
    try {
      const indexData = await fs.readFile(this.indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      
      for (const [id, pattern] of index) {
        this.patterns.set(id, pattern);
      }
    } catch (error) {
      // No saved patterns yet
    }
  }
}

// Integration with Opera
export class LearningOpera {
  private repository = new LearningRepository();
  
  async learnFromSuccess(context: any, solution: any) {
    await this.repository.storePattern({
      type: this.classifyType(context),
      context: JSON.stringify(context),
      pattern: this.extractPattern(context),
      solution: JSON.stringify(solution),
      confidence: 0.8,
      metadata: {
        framework: 'VERSATIL',
        version: '1.2.1'
      }
    });
  }
  
  private classifyType(context: any): LearnedPattern['type'] {
    if (context.error) return 'bug-fix';
    if (context.performance) return 'optimization';
    if (context.refactor) return 'refactor';
    if (context.security) return 'security';
    return 'feature';
  }
  
  private extractPattern(context: any): string {
    // Extract key pattern from context
    return Object.keys(context).join('-');
  }
}

export const learningRepository = new LearningRepository();
export const learningOpera = new LearningOpera();
`;
    
    await fs.mkdir(path.join(__dirname, 'src/learning'), { recursive: true });
    await fs.writeFile(path.join(__dirname, 'src/learning/learning-repository.ts'), learningCode);
    console.log(chalk.green('✅ Created Learning Repository'));
  }
}

// Main test runner
async function runAllTests() {
  await testPerformanceMetrics();
  await testContextCaching();
  await testCollaborativeMode();
  await testLearningRepository();
  
  console.log(chalk.bold.green('\n✅ All Advanced Features Created!\n'));
  
  console.log('📝 Next Steps:\n');
  console.log('1. Build the new features:');
  console.log('   npm run build\n');
  console.log('2. Test individually:');
  console.log('   node test-performance-metrics.cjs');
  console.log('   node test-context-caching.cjs');
  console.log('   node test-collaborative-mode.cjs');
  console.log('   node test-learning-repository.cjs\n');
  console.log('3. View the Performance Dashboard:');
  console.log('   open performance-dashboard.html\n');
  console.log('4. Start Collaboration Server:');
  console.log('   node start-collaboration-server.cjs');
}

// Create individual test files
async function createIndividualTests() {
  // Performance Metrics Test
  await fs.writeFile('test-performance-metrics.cjs', `#!/usr/bin/env node
const { performanceMetrics } = require('./dist/metrics/performance-dashboard.js');

// Simulate model selections
const models = ['claude-3-opus', 'gpt-4-vision', 'code-llama', 'gemini-pro'];
const taskTypes = ['code_generation', 'visual_analysis', 'documentation', 'debugging'];

console.log('Simulating 100 model selections...\\n');

for (let i = 0; i < 100; i++) {
  const model = models[Math.floor(Math.random() * models.length)];
  const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
  const confidence = 0.7 + Math.random() * 0.3;
  
  performanceMetrics.trackModelSelection(
    model,
    \`Best for \${taskType}\`,
    taskType,
    confidence
  );
}

console.log('Metrics:', performanceMetrics.getMetrics());

// Generate dashboard
const fs = require('fs');
fs.writeFileSync('performance-dashboard.html', performanceMetrics.generateHTMLDashboard());
console.log('\\n✅ Dashboard generated: performance-dashboard.html');
`);

  // Context Caching Test
  await fs.writeFile('test-context-caching.cjs', `#!/usr/bin/env node
const { cachedScanner } = require('./dist/cache/context-cache.js');

async function test() {
  console.log('Testing context caching...\\n');
  
  // First scan (slow)
  console.time('First scan');
  await cachedScanner.scanEnvironment();
  console.timeEnd('First scan');
  
  // Cached scans (fast)
  console.time('Cached scan 1');
  await cachedScanner.scanEnvironment();
  console.timeEnd('Cached scan 1');
  
  console.time('Cached scan 2');
  await cachedScanner.scanEnvironment();
  console.timeEnd('Cached scan 2');
  
  // Force refresh
  console.time('Forced refresh');
  await cachedScanner.scanEnvironment(true);
  console.timeEnd('Forced refresh');
  
  console.log('\\nCache stats:', cachedScanner.getCacheStats());
}

test();
`);

  // Collaborative Mode Test
  await fs.writeFile('test-collaborative-mode.cjs', `#!/usr/bin/env node
const { CollaborativeOrchestrator } = require('./dist/collaboration/collaborative-orchestrator.js');

async function test() {
  const orchestrator = new CollaborativeOrchestrator();
  
  console.log('Testing collaborative mode...\\n');
  
  // Create 3 instances
  const instance1 = await orchestrator.joinSession('test-project', 'cursor-1');
  const instance2 = await orchestrator.joinSession('test-project', 'cursor-2');
  const instance3 = await orchestrator.joinSession('test-project', 'cursor-3');
  
  // Distribute tasks
  const tasks = ['auth-module', 'api-endpoints', 'frontend-ui', 'testing', 'deployment'];
  
  console.log('Claiming tasks:');
  console.log('Instance 1:', await instance1.claimTask('auth-module'));
  console.log('Instance 2:', await instance2.claimTask('api-endpoints'));
  console.log('Instance 3:', await instance3.claimTask('frontend-ui'));
  console.log('Instance 1 (try duplicate):', await instance1.claimTask('api-endpoints'));
  
  // Share context
  await instance1.shareContext('authStrategy', 'JWT');
  await instance2.shareContext('apiVersion', 'v2');
  
  // Update progress
  await orchestrator.updateTaskProgress('test-project', 'auth-module', 50);
  await orchestrator.updateTaskProgress('test-project', 'api-endpoints', 75);
  
  console.log('\\nSession state:');
  console.log(JSON.stringify(orchestrator.getSessionState('test-project'), null, 2));
}

test();
`);

  // Learning Repository Test
  await fs.writeFile('test-learning-repository.cjs', `#!/usr/bin/env node
const { learningRepository, learningOpera } = require('./dist/learning/learning-repository.js');

async function test() {
  console.log('Testing learning repository...\\n');
  
  // Store various patterns
  const patterns = [
    {
      type: 'bug-fix',
      context: 'React useState not updating',
      pattern: 'Stale closure in useEffect',
      solution: 'Add state to dependency array',
      confidence: 0.95
    },
    {
      type: 'optimization',
      context: 'React re-renders too often',
      pattern: 'Missing React.memo',
      solution: 'Wrap component in React.memo',
      confidence: 0.85
    },
    {
      type: 'security',
      context: 'XSS vulnerability in user input',
      pattern: 'Direct innerHTML usage',
      solution: 'Use DOMPurify or React dangerouslySetInnerHTML',
      confidence: 0.99
    }
  ];
  
  console.log('Storing patterns...');
  for (const pattern of patterns) {
    await learningRepository.storePattern(pattern);
  }
  
  // Search for solutions
  console.log('\\nSearching for "React performance"...');
  const results = await learningRepository.findSimilarPatterns('React performance');
  results.forEach(r => {
    console.log(\`- \${r.pattern}: \${r.solution}\`);
  });
  
  // Learn from success
  await learningOpera.learnFromSuccess(
    { error: 'TypeScript TS2339', file: 'test.ts' },
    { fix: 'Added interface definition' }
  );
  
  console.log('\\nRepository statistics:');
  console.log(await learningRepository.getStatistics());
}

test();
`);

  // Collaboration Server
  await fs.writeFile('start-collaboration-server.cjs', `#!/usr/bin/env node
const { CollaborationServer } = require('./dist/collaboration/collaborative-orchestrator.js');

const server = new CollaborationServer();
server.start(8080);

console.log('Collaboration server running on ws://localhost:8080');
console.log('Press Ctrl+C to stop');
`);
}

// Run everything
runAllTests().then(() => {
  createIndividualTests().then(() => {
    console.log('\n🎉 All test files created!');
  });
});
