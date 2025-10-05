/**
 * VERSATIL SDLC Framework - Real-time Progress Tracker
 * Provides comprehensive real-time visibility into SDLC and agent progress
 */

import { EventEmitter } from 'events';
import { VERSATILLogger } from '../utils/logger.js';
import { SDLCOrchestrator, FlywheelState } from '../flywheel/sdlc-orchestrator.js';
import { EnhancedOPERACoordinator } from '../opera/enhanced-opera-coordinator.js';
import { AgentRegistry } from '../agents/agent-registry.js';
import { WebSocket, WebSocketServer } from 'ws';

export interface TaskProgress {
  id: string;
  agentId: string;
  taskName: string;
  phase: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'blocked';
  progress: number; // 0-100
  startTime?: number;
  estimatedCompletion?: number;
  actualCompletion?: number;
  blockers?: string[];
  output?: any;
}

export interface SDLCContextSnapshot {
  timestamp: number;
  flywheel: FlywheelState;
  phases: {
    [phaseId: string]: {
      status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
      progress: number;
      qualityScore: number;
      activeTasks: number;
      completedTasks: number;
    };
  };
  agents: {
    [agentId: string]: {
      status: 'idle' | 'busy' | 'error';
      currentTask?: TaskProgress;
      taskQueue: number;
      performance: {
        avgExecutionTime: number;
        successRate: number;
        tasksCompleted: number;
      };
    };
  };
  metrics: {
    overallProgress: number;
    velocity: number; // tasks per hour
    estimatedCompletion: number; // timestamp
    blockers: string[];
    risks: string[];
  };
}

export interface RealTimeConfig {
  updateInterval: number;
  enableWebSocket: boolean;
  wsPort?: number;
  persistProgress: boolean;
  alertThresholds: {
    taskTimeout: number;
    phaseDelay: number;
    qualityDrop: number;
  };
}

/**
 * Real-time SDLC Progress Tracker
 */
export class RealTimeSDLCTracker extends EventEmitter {
  private logger: VERSATILLogger;
  private sdlcOrchestrator: SDLCOrchestrator;
  private operaCoordinator: EnhancedOPERACoordinator;
  private agentRegistry: AgentRegistry;
  private config: RealTimeConfig;
  
  private tasks: Map<string, TaskProgress> = new Map();
  private contextHistory: SDLCContextSnapshot[] = [];
  private updateTimer?: NodeJS.Timeout;
  private wsServer?: WebSocketServer;
  private wsClients: Set<WebSocket> = new Set();
  
  // Performance tracking
  private taskStartTimes: Map<string, number> = new Map();
  private phaseStartTimes: Map<string, number> = new Map();
  private completionRates: Map<string, number[]> = new Map();
  
  constructor(
    sdlcOrchestrator: SDLCOrchestrator,
    operaCoordinator: EnhancedOPERACoordinator,
    agentRegistry: AgentRegistry,
    config?: Partial<RealTimeConfig>
  ) {
    super();
    this.logger = new VERSATILLogger();
    this.sdlcOrchestrator = sdlcOrchestrator;
    this.operaCoordinator = operaCoordinator;
    this.agentRegistry = agentRegistry;
    
    this.config = {
      updateInterval: 1000, // 1 second
      enableWebSocket: true,
      wsPort: 8080,
      persistProgress: true,
      alertThresholds: {
        taskTimeout: 300000, // 5 minutes
        phaseDelay: 3600000, // 1 hour
        qualityDrop: 10 // 10% drop
      },
      ...config
    };
    
    this.initialize();
  }
  
  /**
   * Initialize real-time tracking
   */
  private async initialize(): Promise<void> {
    // Set up agent listeners
    this.setupAgentListeners();
    
    // Set up SDLC orchestrator listeners
    this.setupSDLCListeners();
    
    // Set up OPERA coordinator listeners
    this.setupOPERAListeners();
    
    // Start WebSocket server if enabled
    if (this.config.enableWebSocket) {
      this.startWebSocketServer();
    }
    
    // Start update loop
    this.startUpdateLoop();
    
    // Load persisted progress if enabled
    if (this.config.persistProgress) {
      await this.loadPersistedProgress();
    }
    
    this.logger.info('Real-time SDLC Tracker initialized', {
      updateInterval: this.config.updateInterval,
      webSocket: this.config.enableWebSocket,
      agents: this.agentRegistry.getAllAgents().length
    }, 'realtime-tracker');
  }
  
  /**
   * Setup agent event listeners
   */
  private setupAgentListeners(): void {
    const agents = this.agentRegistry.getAllAgents();

    agents.forEach((agent) => {
      const agentId = agent.id;
      // Intercept agent activation
      const originalActivate = agent.activate.bind(agent);

      agent.activate = async (context) => {
        const taskId = this.generateTaskId();

        // Create task progress entry
        const task: TaskProgress = {
          id: taskId,
          agentId,
          taskName: context.trigger || 'unnamed-task',
          phase: this.sdlcOrchestrator.getFlywheelState().currentPhase,
          status: 'in-progress',
          progress: 0,
          startTime: Date.now()
        };
        
        this.tasks.set(taskId, task);
        this.taskStartTimes.set(taskId, Date.now());
        
        // Emit task started event
        this.emit('task:started', task);
        this.broadcastUpdate('task:started', task);
        
        try {
          // Execute original activation
          const result = await originalActivate(context);
          
          // Update task progress
          task.status = 'completed';
          task.progress = 100;
          task.actualCompletion = Date.now();
          task.output = result;
          
          // Calculate execution time
          const executionTime = Date.now() - (task.startTime || 0);
          this.updateAgentPerformance(agentId, executionTime, true);
          
          // Emit task completed event
          this.emit('task:completed', task);
          this.broadcastUpdate('task:completed', task);
          
          return result;
          
        } catch (error) {
          // Update task on failure
          task.status = 'failed';
          task.blockers = [error instanceof Error ? error.message : 'Unknown error'];
          
          // Update agent performance
          const executionTime = Date.now() - (task.startTime || 0);
          this.updateAgentPerformance(agentId, executionTime, false);
          
          // Emit task failed event
          this.emit('task:failed', task);
          this.broadcastUpdate('task:failed', task);
          
          throw error;
        }
      };
    });
  }
  
  /**
   * Setup SDLC orchestrator listeners
   */
  private setupSDLCListeners(): void {
    // Listen for phase transitions
    this.sdlcOrchestrator.on('phase:started', (data) => {
      this.phaseStartTimes.set(data.phase, Date.now());
      this.emit('phase:started', data);
      this.broadcastUpdate('phase:started', data);
    });
    
    this.sdlcOrchestrator.on('phase:completed', (data) => {
      const startTime = this.phaseStartTimes.get(data.phase);
      if (startTime) {
        const duration = Date.now() - startTime;
        this.updatePhaseMetrics(data.phase, duration);
      }
      this.emit('phase:completed', data);
      this.broadcastUpdate('phase:completed', data);
    });
    
    // Listen for quality gate events
    this.sdlcOrchestrator.on('qualitygate:passed', (data) => {
      this.emit('qualitygate:passed', data);
      this.broadcastUpdate('qualitygate:passed', data);
    });
    
    this.sdlcOrchestrator.on('qualitygate:failed', (data) => {
      this.emit('qualitygate:failed', data);
      this.broadcastUpdate('qualitygate:failed', data);
      this.checkQualityAlerts(data);
    });
  }
  
  /**
   * Setup OPERA coordinator listeners
   */
  private setupOPERAListeners(): void {
    // Listen for enhanced activations
    this.operaCoordinator.on('enhanced_activation', (data) => {
      this.emit('agent:enhanced', data);
      this.broadcastUpdate('agent:enhanced', data);
    });
    
    // Listen for autonomous goals
    this.operaCoordinator.on('autonomous_goal_completed', (data) => {
      this.emit('autonomous:completed', data);
      this.broadcastUpdate('autonomous:completed', data);
    });
    
    // Listen for human intervention
    this.operaCoordinator.on('human_intervention_required', (data) => {
      this.emit('intervention:required', data);
      this.broadcastUpdate('intervention:required', data);
      this.createBlocker(data.reason);
    });
  }
  
  /**
   * Start update loop
   */
  private startUpdateLoop(): void {
    this.updateTimer = setInterval(() => {
      this.updateContextSnapshot();
      this.checkTimeouts();
      this.calculateMetrics();
    }, this.config.updateInterval);
  }
  
  /**
   * Update context snapshot
   */
  private updateContextSnapshot(): void {
    const snapshot = this.createContextSnapshot();
    
    // Add to history (keep last 1000)
    this.contextHistory.push(snapshot);
    if (this.contextHistory.length > 1000) {
      this.contextHistory.shift();
    }
    
    // Emit update
    this.emit('context:updated', snapshot);
    this.broadcastUpdate('context:updated', snapshot);
    
    // Persist if enabled
    if (this.config.persistProgress) {
      this.persistProgress(snapshot);
    }
  }
  
  /**
   * Create current context snapshot
   */
  private createContextSnapshot(): SDLCContextSnapshot {
    const flywheelState = this.sdlcOrchestrator.getFlywheelState();
    const snapshot: SDLCContextSnapshot = {
      timestamp: Date.now(),
      flywheel: flywheelState,
      phases: {},
      agents: {},
      metrics: {
        overallProgress: flywheelState.overallProgress,
        velocity: this.calculateVelocity(),
        estimatedCompletion: this.estimateCompletion(),
        blockers: flywheelState.blockers,
        risks: this.identifyRisks()
      }
    };
    
    // Build phase status
    const phases = ['requirements', 'design', 'development', 'testing', 'deployment', 'monitoring', 'feedback', 'improvement'];
    phases.forEach((phaseId, index) => {
      const isCurrentPhase = phaseId === flywheelState.currentPhase;
      const isPastPhase = index < phases.indexOf(flywheelState.currentPhase);
      
      snapshot.phases[phaseId] = {
        status: isPastPhase ? 'completed' : (isCurrentPhase ? 'in-progress' : 'not-started'),
        progress: isPastPhase ? 100 : (isCurrentPhase ? flywheelState.phaseProgress : 0),
        qualityScore: isPastPhase ? 95 : (isCurrentPhase ? flywheelState.qualityScore : 0),
        activeTasks: this.getActiveTasksForPhase(phaseId),
        completedTasks: this.getCompletedTasksForPhase(phaseId)
      };
    });
    
    // Build agent status
    this.agentRegistry.getAllAgents().forEach((agent) => {
      const agentId = agent.id;
      const activeTasks = Array.from(this.tasks.values()).filter(
        t => t.agentId === agentId && t.status === 'in-progress'
      );

      const performanceData = this.getAgentPerformance(agentId);

      snapshot.agents[agentId] = {
        status: activeTasks.length > 0 ? 'busy' : 'idle',
        currentTask: activeTasks[0],
        taskQueue: activeTasks.length,
        performance: performanceData
      };
    });
    
    return snapshot;
  }
  
  /**
   * Calculate velocity (tasks per hour)
   */
  private calculateVelocity(): number {
    const oneHourAgo = Date.now() - 3600000;
    const completedTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'completed' && (t.actualCompletion || 0) > oneHourAgo
    );
    
    return completedTasks.length;
  }
  
  /**
   * Estimate completion time
   */
  private estimateCompletion(): number {
    const velocity = this.calculateVelocity();
    if (velocity === 0) return 0;
    
    const pendingTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'pending' || t.status === 'in-progress'
    );
    
    const hoursRemaining = pendingTasks.length / velocity;
    return Date.now() + (hoursRemaining * 3600000);
  }
  
  /**
   * Identify risks
   */
  private identifyRisks(): string[] {
    const risks = [];
    
    // Check for stalled tasks
    const stalledTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'in-progress' && 
           (Date.now() - (t.startTime || 0)) > this.config.alertThresholds.taskTimeout
    );
    
    if (stalledTasks.length > 0) {
      risks.push(`${stalledTasks.length} tasks are taking longer than expected`);
    }
    
    // Check quality scores
    const currentQuality = this.sdlcOrchestrator.getFlywheelState().qualityScore;
    if (currentQuality < 70) {
      risks.push('Quality score is below acceptable threshold');
    }
    
    // Check velocity trend
    const velocityTrend = this.calculateVelocityTrend();
    if (velocityTrend < -20) {
      risks.push('Development velocity is declining');
    }
    
    return risks;
  }
  
  /**
   * WebSocket server for real-time updates
   */
  private startWebSocketServer(): void {
    this.wsServer = new WebSocketServer({ port: this.config.wsPort });
    
    this.wsServer.on('connection', (ws) => {
      this.wsClients.add(ws);
      
      // Send initial context
      ws.send(JSON.stringify({
        type: 'initial',
        data: this.createContextSnapshot()
      }));
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
    });
    
    this.logger.info(`WebSocket server started on port ${this.config.wsPort}`, {}, 'realtime-tracker');
  }
  
  /**
   * Broadcast update to all WebSocket clients
   */
  private broadcastUpdate(type: string, data: any): void {
    if (!this.wsServer) return;
    
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    this.wsClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'subscribe':
        // Handle subscription to specific events
        break;
        
      case 'query':
        // Handle queries for specific data
        const response = this.handleQuery(message.query);
        ws.send(JSON.stringify({
          type: 'response',
          query: message.query,
          data: response
        }));
        break;
        
      case 'command':
        // Handle commands (e.g., pause task, override, etc.)
        this.handleCommand(message.command);
        break;
    }
  }
  
  /**
   * Public API
   */
  
  /**
   * Get current context snapshot
   */
  public getCurrentContext(): SDLCContextSnapshot {
    return this.createContextSnapshot();
  }
  
  /**
   * Get task progress by ID
   */
  public getTaskProgress(taskId: string): TaskProgress | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Update task progress manually
   */
  public updateTaskProgress(taskId: string, progress: number, estimatedCompletion?: number): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'in-progress') {
      task.progress = Math.min(100, Math.max(0, progress));
      if (estimatedCompletion) {
        task.estimatedCompletion = estimatedCompletion;
      }
      
      this.emit('task:progress', task);
      this.broadcastUpdate('task:progress', task);
    }
  }
  
  /**
   * Get historical data
   */
  public getHistory(from: number, to: number): SDLCContextSnapshot[] {
    return this.contextHistory.filter(
      snapshot => snapshot.timestamp >= from && snapshot.timestamp <= to
    );
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): any {
    return {
      velocity: this.calculateVelocity(),
      velocityTrend: this.calculateVelocityTrend(),
      avgTaskDuration: this.calculateAverageTaskDuration(),
      successRate: this.calculateSuccessRate(),
      phaseMetrics: this.getPhaseMetrics(),
      agentMetrics: this.getAllAgentPerformance()
    };
  }
  
  /**
   * Stop tracking
   */
  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
    
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    this.removeAllListeners();
    this.logger.info('Real-time SDLC Tracker stopped', {}, 'realtime-tracker');
  }
  
  // Helper methods
  
  private generateTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getActiveTasksForPhase(phaseId: string): number {
    return Array.from(this.tasks.values()).filter(
      t => t.phase === phaseId && t.status === 'in-progress'
    ).length;
  }
  
  private getCompletedTasksForPhase(phaseId: string): number {
    return Array.from(this.tasks.values()).filter(
      t => t.phase === phaseId && t.status === 'completed'
    ).length;
  }
  
  private updateAgentPerformance(agentId: string, executionTime: number, success: boolean): void {
    const rates = this.completionRates.get(agentId) || [];
    rates.push(success ? 1 : 0);
    
    // Keep last 100 results
    if (rates.length > 100) {
      rates.shift();
    }
    
    this.completionRates.set(agentId, rates);
  }
  
  private getAgentPerformance(agentId: string): any {
    const rates = this.completionRates.get(agentId) || [];
    const completedTasks = Array.from(this.tasks.values()).filter(
      t => t.agentId === agentId && t.status === 'completed'
    );
    
    const totalExecutionTime = completedTasks.reduce((sum, t) => {
      return sum + ((t.actualCompletion || 0) - (t.startTime || 0));
    }, 0);
    
    return {
      avgExecutionTime: completedTasks.length > 0 ? totalExecutionTime / completedTasks.length : 0,
      successRate: rates.length > 0 ? (rates.filter(r => r === 1).length / rates.length) * 100 : 100,
      tasksCompleted: completedTasks.length
    };
  }
  
  private calculateVelocityTrend(): number {
    // Compare current velocity to average of last 5 hours
    const currentVelocity = this.calculateVelocity();
    const historicalVelocities = [];
    
    for (let i = 1; i <= 5; i++) {
      const startTime = Date.now() - (i * 3600000) - 3600000;
      const endTime = Date.now() - (i * 3600000);
      
      const tasks = Array.from(this.tasks.values()).filter(
        t => t.status === 'completed' && 
             (t.actualCompletion || 0) >= startTime && 
             (t.actualCompletion || 0) < endTime
      );
      
      historicalVelocities.push(tasks.length);
    }
    
    const avgHistorical = historicalVelocities.reduce((sum, v) => sum + v, 0) / historicalVelocities.length;
    
    if (avgHistorical === 0) return 0;
    return ((currentVelocity - avgHistorical) / avgHistorical) * 100;
  }
  
  private calculateAverageTaskDuration(): number {
    const completedTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'completed' && t.startTime && t.actualCompletion
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalDuration = completedTasks.reduce((sum, t) => {
      return sum + ((t.actualCompletion || 0) - (t.startTime || 0));
    }, 0);
    
    return totalDuration / completedTasks.length;
  }
  
  private calculateSuccessRate(): number {
    const allTasks = Array.from(this.tasks.values()).filter(
      t => t.status === 'completed' || t.status === 'failed'
    );
    
    if (allTasks.length === 0) return 100;
    
    const successfulTasks = allTasks.filter(t => t.status === 'completed');
    return (successfulTasks.length / allTasks.length) * 100;
  }
  
  private updatePhaseMetrics(phaseId: string, duration: number): void {
    // Store phase metrics for analysis
    this.emit('phase:metrics', {
      phaseId,
      duration,
      tasksCompleted: this.getCompletedTasksForPhase(phaseId),
      qualityScore: this.sdlcOrchestrator.getFlywheelState().qualityScore
    });
  }
  
  private checkTimeouts(): void {
    const now = Date.now();
    
    this.tasks.forEach((task) => {
      if (task.status === 'in-progress' && task.startTime) {
        const duration = now - task.startTime;
        
        if (duration > this.config.alertThresholds.taskTimeout) {
          this.emit('alert:task-timeout', {
            task,
            duration,
            threshold: this.config.alertThresholds.taskTimeout
          });
        }
      }
    });
  }
  
  private calculateMetrics(): void {
    // This method is called periodically to update metrics
    // Implementation covered in createContextSnapshot
  }
  
  private checkQualityAlerts(data: any): void {
    const qualityDrop = data.previousScore - data.currentScore;
    
    if (qualityDrop > this.config.alertThresholds.qualityDrop) {
      this.emit('alert:quality-drop', {
        phase: data.phase,
        previousScore: data.previousScore,
        currentScore: data.currentScore,
        drop: qualityDrop
      });
    }
  }
  
  private createBlocker(reason: string): void {
    const flywheel = this.sdlcOrchestrator.getFlywheelState();
    if (!flywheel.blockers.includes(reason)) {
      flywheel.blockers.push(reason);
    }
  }
  
  private async loadPersistedProgress(): Promise<void> {
    // In production, load from database or file system
    // For now, start fresh
    this.logger.info('Loading persisted progress (if available)', {}, 'realtime-tracker');
  }
  
  private async persistProgress(snapshot: SDLCContextSnapshot): Promise<void> {
    // In production, save to database or file system
    // For now, just log
    this.logger.debug('Persisting progress snapshot', {
      timestamp: snapshot.timestamp,
      overallProgress: snapshot.metrics.overallProgress
    }, 'realtime-tracker');
  }
  
  private handleQuery(query: any): any {
    // Handle specific data queries
    switch (query.type) {
      case 'agent-status':
        return this.getAgentPerformance(query.agentId);
      case 'phase-status':
        return this.getCurrentContext().phases[query.phaseId];
      case 'task-details':
        return this.getTaskProgress(query.taskId);
      default:
        return null;
    }
  }
  
  private handleCommand(command: any): void {
    // Handle commands from WebSocket clients
    switch (command.type) {
      case 'pause-task':
        // Implement task pause logic
        break;
      case 'retry-task':
        // Implement task retry logic
        break;
      case 'override-phase':
        // Implement phase override logic
        break;
    }
  }
  
  private getPhaseMetrics(): any {
    const phases = ['requirements', 'design', 'development', 'testing', 'deployment', 'monitoring', 'feedback', 'improvement'];
    const metrics: any = {};
    
    phases.forEach((phaseId) => {
      const startTime = this.phaseStartTimes.get(phaseId);
      const duration = startTime ? Date.now() - startTime : 0;
      
      metrics[phaseId] = {
        duration,
        tasksCompleted: this.getCompletedTasksForPhase(phaseId),
        activeTasks: this.getActiveTasksForPhase(phaseId),
        startTime
      };
    });
    
    return metrics;
  }
  
  private getAllAgentPerformance(): any {
    const performance: any = {};

    this.agentRegistry.getAllAgents().forEach((agent) => {
      performance[agent.id] = this.getAgentPerformance(agent.id);
    });

    return performance;
  }
}
