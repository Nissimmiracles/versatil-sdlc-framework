# Auto-Agent Dispatcher Configuration

## VERSATIL SDLC Framework - Intelligent Agent Activation System

This document defines the **Auto-Agent Dispatcher** - an intelligent system that automatically activates the appropriate BMAD agents based on file patterns, keywords, project context, and development activities.

---

## 🎯 Dispatcher Overview

The **Auto-Agent Dispatcher** serves as the central intelligence hub that:
- **Monitors file changes** and development activities
- **Analyzes context patterns** to determine optimal agent activation
- **Preserves conversation context** during agent transitions
- **Coordinates multi-agent collaboration** for complex tasks
- **Learns from user preferences** to improve activation accuracy

---

## 🧠 Intelligence Engine

### 1. Pattern Recognition System

```javascript
// Auto-Agent Dispatcher Core Engine
class VersatilAgentDispatcher {
  constructor() {
    this.agents = this.initializeAgents();
    this.contextHistory = new Map();
    this.learningEngine = new AgentLearningEngine();
    this.collaborationTracker = new CollaborationTracker();
  }

  async analyzeAndDispatch(event) {
    const context = await this.analyzeContext(event);
    const confidence = await this.calculateConfidence(context);
    const agent = await this.selectOptimalAgent(context, confidence);

    if (confidence > 0.8) {
      return await this.activateAgent(agent, context);
    } else {
      return await this.requestUserConfirmation(agent, context, confidence);
    }
  }

  async analyzeContext(event) {
    return {
      filePatterns: this.analyzeFilePatterns(event.files),
      keywords: this.extractKeywords(event.content),
      projectType: await this.detectProjectType(),
      currentTask: this.getCurrentTaskContext(),
      userIntent: await this.predictUserIntent(event),
      collaborationNeeded: this.assessCollaborationNeeds(event),
      priority: this.calculateTaskPriority(event),
      complexity: this.estimateComplexity(event)
    };
  }
}
```

### 2. Agent Selection Algorithm

```javascript
// Multi-dimensional Agent Selection
class AgentSelectionEngine {
  async selectOptimalAgent(context) {
    const scores = {};

    // Calculate base scores from file patterns
    for (const agent of this.agents) {
      scores[agent.name] = this.calculateFilePatternScore(agent, context.filePatterns);
    }

    // Enhance with keyword analysis
    this.enhanceWithKeywords(scores, context.keywords);

    // Consider project context
    this.adjustForProjectContext(scores, context.projectType);

    // Factor in collaboration needs
    this.adjustForCollaboration(scores, context.collaborationNeeded);

    // Apply learning engine insights
    await this.applyLearningInsights(scores, context);

    // Normalize and select
    return this.selectTopAgent(scores, context);
  }

  calculateFilePatternScore(agent, patterns) {
    let score = 0;
    for (const pattern of patterns) {
      for (const agentPattern of agent.patterns) {
        if (this.patternMatches(pattern, agentPattern)) {
          score += agent.patternWeights[agentPattern] || 1.0;
        }
      }
    }
    return score;
  }
}
```

---

## 🔄 Agent Activation Rules

### 1. Primary Activation Triggers

```yaml
Agent_Activation_Matrix:
  Maria-QA:
    file_patterns:
      - "**/*.test.{js,ts,jsx,tsx}"
      - "**/__tests__/**"
      - "**/cypress/**"
      - "**/*.spec.{js,ts}"
      - "**/e2e/**"
    keywords:
      - ["test", "testing", "spec", "coverage"]
      - ["bug", "error", "fix", "debug"]
      - ["quality", "qa", "validation"]
    confidence_threshold: 0.85
    auto_activate: true
    priority: 1

  James-Frontend:
    file_patterns:
      - "**/*.{jsx,tsx,vue,svelte}"
      - "**/components/**"
      - "**/ui/**"
      - "**/*.{css,scss,sass,less}"
      - "**/styles/**"
    keywords:
      - ["react", "vue", "component", "ui"]
      - ["frontend", "client", "browser"]
      - ["css", "style", "responsive"]
    confidence_threshold: 0.8
    auto_activate: true
    priority: 2

  Marcus-Backend:
    file_patterns:
      - "**/*.api.{js,ts}"
      - "**/server/**"
      - "**/backend/**"
      - "**/controllers/**"
      - "**/models/**"
      - "**/database/**"
    keywords:
      - ["server", "api", "backend", "database"]
      - ["authentication", "security", "middleware"]
      - ["docker", "deployment", "infrastructure"]
    confidence_threshold: 0.8
    auto_activate: true
    priority: 2

  Sarah-PM:
    file_patterns:
      - "**/README.md"
      - "**/*.md"
      - "**/docs/**"
      - "package.json"
      - ".github/**"
    keywords:
      - ["project", "documentation", "setup"]
      - ["planning", "roadmap", "milestone"]
      - ["team", "coordination", "management"]
    confidence_threshold: 0.75
    auto_activate: false
    priority: 3

  Alex-BA:
    file_patterns:
      - "**/requirements/**"
      - "**/specs/**"
      - "**/*.feature"
      - "**/user-stories/**"
    keywords:
      - ["requirement", "specification", "user story"]
      - ["business", "stakeholder", "feature"]
      - ["acceptance", "criteria", "epic"]
    confidence_threshold: 0.75
    auto_activate: false
    priority: 3

  Dr.AI-ML:
    file_patterns:
      - "**/*.py"
      - "**/ml/**"
      - "**/ai/**"
      - "**/*.ipynb"
      - "requirements.txt"
    keywords:
      - ["machine learning", "ai", "model"]
      - ["tensorflow", "pytorch", "scikit"]
      - ["data", "prediction", "algorithm"]
    confidence_threshold: 0.8
    auto_activate: true
    priority: 4
```

### 2. Context-Aware Activation

```javascript
// Context-Sensitive Agent Selection
class ContextAwareDispatcher {
  async enhanceSelectionWithContext(baseScores, context) {
    // Project phase consideration
    if (context.phase === 'planning') {
      baseScores['Sarah-PM'] *= 1.5;
      baseScores['Alex-BA'] *= 1.3;
    } else if (context.phase === 'development') {
      baseScores['James-Frontend'] *= 1.2;
      baseScores['Marcus-Backend'] *= 1.2;
    } else if (context.phase === 'testing') {
      baseScores['Maria-QA'] *= 1.8;
    }

    // Error/bug context
    if (context.hasErrors || context.keywords.includes('bug')) {
      baseScores['Maria-QA'] *= 1.6;
    }

    // Performance issues
    if (context.keywords.some(k => ['performance', 'slow', 'optimization'].includes(k))) {
      baseScores['James-Frontend'] *= 1.3;
      baseScores['Marcus-Backend'] *= 1.3;
      baseScores['Maria-QA'] *= 1.2;
    }

    // Security concerns
    if (context.keywords.some(k => ['security', 'vulnerability', 'auth'].includes(k))) {
      baseScores['Marcus-Backend'] *= 1.4;
      baseScores['Maria-QA'] *= 1.3;
    }

    return baseScores;
  }

  async detectProjectPhase(context) {
    const indicators = {
      planning: ['roadmap', 'requirements', 'planning', 'epic'],
      development: ['implement', 'build', 'create', 'develop'],
      testing: ['test', 'debug', 'fix', 'validate'],
      deployment: ['deploy', 'release', 'production', 'launch'],
      maintenance: ['update', 'patch', 'maintain', 'optimize']
    };

    let maxScore = 0;
    let detectedPhase = 'development';

    for (const [phase, keywords] of Object.entries(indicators)) {
      const score = keywords.reduce((sum, keyword) => {
        return sum + (context.keywords.includes(keyword) ? 1 : 0);
      }, 0);

      if (score > maxScore) {
        maxScore = score;
        detectedPhase = phase;
      }
    }

    return detectedPhase;
  }
}
```

---

## 🤝 Collaboration Orchestration

### 1. Multi-Agent Workflow Management

```javascript
// Collaboration Workflow Manager
class CollaborationOrchestrator {
  async orchestrateMultiAgentTask(context) {
    const workflow = await this.generateWorkflow(context);
    const results = [];

    for (const step of workflow.steps) {
      if (step.parallel) {
        // Execute agents in parallel
        const parallelResults = await Promise.all(
          step.agents.map(agent => this.executeAgentTask(agent, step.context))
        );
        results.push(...parallelResults);
      } else {
        // Sequential execution with context handoff
        let stepContext = step.context;
        for (const agent of step.agents) {
          const result = await this.executeAgentTask(agent, stepContext);
          stepContext = await this.mergeContexts(stepContext, result.context);
          results.push(result);
        }
      }
    }

    return await this.consolidateResults(results);
  }

  async generateWorkflow(context) {
    // Example: Full-stack feature implementation
    if (context.taskType === 'full-stack-feature') {
      return {
        name: 'Full Stack Feature Implementation',
        steps: [
          {
            name: 'Requirements Analysis',
            agents: ['Alex-BA'],
            parallel: false,
            context: context.requirements
          },
          {
            name: 'Planning & Architecture',
            agents: ['Sarah-PM'],
            parallel: false,
            context: context.planning
          },
          {
            name: 'Implementation',
            agents: ['James-Frontend', 'Marcus-Backend'],
            parallel: true,
            context: context.implementation
          },
          {
            name: 'Testing & Quality',
            agents: ['Maria-QA'],
            parallel: false,
            context: context.testing
          }
        ]
      };
    }

    return this.generateDefaultWorkflow(context);
  }
}
```

### 2. Handoff Protocols

```javascript
// Agent Handoff Manager
class AgentHandoffManager {
  async executeHandoff(fromAgent, toAgent, context) {
    // Prepare handoff package
    const handoffPackage = await this.prepareHandoffPackage(fromAgent, context);

    // Validate handoff readiness
    const readiness = await this.validateHandoffReadiness(handoffPackage);

    if (readiness.score < 0.8) {
      throw new Error(`Handoff not ready: ${readiness.issues.join(', ')}`);
    }

    // Execute context preservation
    await this.preserveContext(handoffPackage);

    // Deactivate current agent
    await this.deactivateAgent(fromAgent);

    // Activate new agent with preserved context
    return await this.activateAgentWithContext(toAgent, handoffPackage);
  }

  async prepareHandoffPackage(agent, context) {
    return {
      metadata: {
        fromAgent: agent.name,
        timestamp: new Date().toISOString(),
        handoffReason: context.handoffReason,
        urgency: context.urgency || 'normal'
      },

      taskContext: {
        currentTask: agent.getCurrentTask(),
        completedWork: agent.getCompletedWork(),
        remainingWork: agent.getRemainingWork(),
        dependencies: agent.getDependencies(),
        blockers: agent.getBlockers()
      },

      technicalContext: {
        filesModified: agent.getModifiedFiles(),
        codeChanges: agent.getCodeChanges(),
        testResults: agent.getTestResults(),
        configurations: agent.getConfigurations()
      },

      businessContext: {
        requirements: context.requirements,
        acceptanceCriteria: context.acceptanceCriteria,
        userStories: context.userStories,
        stakeholderFeedback: context.stakeholderFeedback
      },

      qualityContext: {
        codeQuality: agent.getCodeQualityMetrics(),
        testCoverage: agent.getTestCoverage(),
        performanceMetrics: agent.getPerformanceMetrics(),
        securityFindings: agent.getSecurityFindings()
      }
    };
  }
}
```

---

## 📚 Learning & Optimization

### 1. Machine Learning for Agent Selection

```javascript
// Agent Selection Learning Engine
class AgentSelectionLearningEngine {
  constructor() {
    this.trainingData = new Map();
    this.model = this.initializeModel();
    this.feedbackProcessor = new FeedbackProcessor();
  }

  async learnFromUserFeedback(selection, feedback) {
    const trainingExample = {
      context: selection.context,
      selectedAgent: selection.agent,
      userSatisfaction: feedback.satisfaction,
      taskSuccess: feedback.success,
      timeToCompletion: feedback.duration,
      qualityScore: feedback.quality
    };

    this.trainingData.set(selection.id, trainingExample);

    if (this.trainingData.size > 100) {
      await this.retrainModel();
    }
  }

  async predictOptimalAgent(context) {
    const features = this.extractFeatures(context);
    const predictions = await this.model.predict(features);

    return {
      agent: predictions.topAgent,
      confidence: predictions.confidence,
      alternatives: predictions.alternatives,
      reasoning: predictions.reasoning
    };
  }

  extractFeatures(context) {
    return {
      fileTypeDistribution: this.calculateFileTypeDistribution(context.files),
      keywordFrequency: this.calculateKeywordFrequency(context.keywords),
      projectComplexity: this.estimateProjectComplexity(context),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      userPreferences: this.getUserPreferences(),
      historicalPatterns: this.getHistoricalPatterns(context)
    };
  }
}
```

### 2. Performance Analytics

```javascript
// Dispatcher Performance Analytics
class DispatcherAnalytics {
  async generatePerformanceReport() {
    const metrics = await this.collectMetrics();

    return {
      activation_accuracy: {
        overall: metrics.correctActivations / metrics.totalActivations,
        by_agent: this.calculatePerAgentAccuracy(metrics),
        trending: this.calculateAccuracyTrend(metrics)
      },

      response_time: {
        average: metrics.totalResponseTime / metrics.totalActivations,
        by_context: this.calculateResponseTimeByContext(metrics),
        percentiles: this.calculateResponseTimePercentiles(metrics)
      },

      user_satisfaction: {
        average: metrics.totalSatisfaction / metrics.totalFeedback,
        by_agent: this.calculateSatisfactionByAgent(metrics),
        trending: this.calculateSatisfactionTrend(metrics)
      },

      collaboration_efficiency: {
        successful_handoffs: metrics.successfulHandoffs / metrics.totalHandoffs,
        context_preservation: metrics.contextPreservationScore,
        multi_agent_task_success: metrics.multiAgentTaskSuccess
      },

      learning_effectiveness: {
        prediction_improvement: this.calculatePredictionImprovement(metrics),
        adaptation_rate: this.calculateAdaptationRate(metrics),
        false_positive_reduction: this.calculateFalsePositiveReduction(metrics)
      }
    };
  }

  async optimizeDispatcherConfiguration() {
    const analytics = await this.generatePerformanceReport();
    const optimizations = [];

    // Adjust confidence thresholds
    if (analytics.activation_accuracy.overall < 0.85) {
      optimizations.push({
        type: 'confidence_threshold',
        agents: this.identifyLowAccuracyAgents(analytics),
        adjustment: 'increase'
      });
    }

    // Optimize pattern weights
    const patternEffectiveness = await this.analyzePatternEffectiveness();
    for (const [pattern, effectiveness] of patternEffectiveness) {
      if (effectiveness < 0.7) {
        optimizations.push({
          type: 'pattern_weight',
          pattern: pattern,
          adjustment: 'decrease'
        });
      }
    }

    return await this.applyOptimizations(optimizations);
  }
}
```

---

## 🎛️ Configuration Interface

### 1. Dispatcher Configuration

```yaml
# Auto-Agent Dispatcher Configuration
dispatcher_config:
  # Global Settings
  enabled: true
  learning_mode: true
  auto_activation_threshold: 0.8
  user_confirmation_threshold: 0.6
  context_preservation_enabled: true

  # Agent Priority Matrix
  agent_priorities:
    emergency: ["Maria-QA", "Sarah-PM"]
    high: ["Maria-QA", "James-Frontend", "Marcus-Backend"]
    normal: ["James-Frontend", "Marcus-Backend", "Sarah-PM", "Alex-BA", "Dr.AI-ML"]
    low: ["Alex-BA", "Dr.AI-ML"]

  # Collaboration Rules
  collaboration:
    max_concurrent_agents: 3
    handoff_timeout: 300  # seconds
    context_sync_interval: 30  # seconds
    collaboration_patterns:
      frontend_backend: ["James-Frontend", "Marcus-Backend"]
      requirements_development: ["Alex-BA", "James-Frontend", "Marcus-Backend"]
      testing_validation: ["Maria-QA", "*"]

  # Learning Configuration
  learning:
    training_mode: "online"
    feedback_collection: true
    model_update_frequency: "weekly"
    min_training_samples: 50
    feature_engineering: "automatic"

  # Performance Monitoring
  monitoring:
    metrics_collection: true
    performance_alerts: true
    accuracy_threshold: 0.85
    response_time_threshold: 2000  # milliseconds
    user_satisfaction_threshold: 4.0  # out of 5
```

### 2. User Preference System

```javascript
// User Preference Learning System
class UserPreferenceSystem {
  constructor() {
    this.preferences = new Map();
    this.behaviorAnalyzer = new BehaviorAnalyzer();
  }

  async analyzeUserBehavior(userId, interactions) {
    const patterns = this.behaviorAnalyzer.extractPatterns(interactions);

    const preferences = {
      preferred_agents: this.identifyPreferredAgents(patterns),
      working_hours: this.identifyWorkingHours(patterns),
      task_preferences: this.identifyTaskPreferences(patterns),
      collaboration_style: this.identifyCollaborationStyle(patterns),
      quality_priorities: this.identifyQualityPriorities(patterns)
    };

    this.preferences.set(userId, preferences);
    return preferences;
  }

  async personalizeDispatcher(userId, context) {
    const userPrefs = this.preferences.get(userId);
    if (!userPrefs) return context;

    // Adjust agent scores based on preferences
    for (const [agent, score] of Object.entries(context.agentScores)) {
      if (userPrefs.preferred_agents.includes(agent)) {
        context.agentScores[agent] *= 1.2;
      }
    }

    // Consider working hours
    const currentHour = new Date().getHours();
    if (userPrefs.working_hours &&
        !this.isWithinWorkingHours(currentHour, userPrefs.working_hours)) {
      context.urgency = Math.max(0, context.urgency - 1);
    }

    return context;
  }
}
```

---

## 🚨 Emergency Protocols

### 1. Critical Issue Handling

```javascript
// Emergency Response Dispatcher
class EmergencyDispatcher {
  async handleEmergency(context) {
    const emergencyLevel = this.assessEmergencyLevel(context);

    switch (emergencyLevel) {
      case 'P0_CRITICAL':
        return await this.handleP0Critical(context);
      case 'P1_HIGH':
        return await this.handleP1High(context);
      case 'P2_MEDIUM':
        return await this.handleP2Medium(context);
      default:
        return await this.handleNormalDispatch(context);
    }
  }

  async handleP0Critical(context) {
    // Immediate activation of Maria-QA as incident commander
    await this.activateEmergencyMode();

    const incidentTeam = await this.assembleIncidentTeam(context);
    const response = await this.coordinateEmergencyResponse(incidentTeam, context);

    return {
      status: 'emergency_active',
      incident_commander: 'Maria-QA',
      response_team: incidentTeam,
      estimated_resolution: response.eta,
      escalation_contacts: await this.getEscalationContacts(context)
    };
  }

  assessEmergencyLevel(context) {
    const indicators = {
      P0_CRITICAL: [
        'production down', 'system failure', 'security breach',
        'data loss', 'critical bug', 'service unavailable'
      ],
      P1_HIGH: [
        'performance issue', 'user impact', 'deployment failure',
        'test failures', 'urgent fix needed'
      ],
      P2_MEDIUM: [
        'bug report', 'feature request', 'optimization needed',
        'documentation update', 'minor issue'
      ]
    };

    for (const [level, keywords] of Object.entries(indicators)) {
      if (keywords.some(keyword =>
        context.content.toLowerCase().includes(keyword.toLowerCase())
      )) {
        return level;
      }
    }

    return 'NORMAL';
  }
}
```

---

## 📊 Monitoring & Metrics

### 1. Real-time Dashboard

```javascript
// Dispatcher Monitoring Dashboard
class DispatcherDashboard {
  constructor() {
    this.metricsCollector = new MetricsCollector();
    this.alertManager = new AlertManager();
    this.visualizer = new DataVisualizer();
  }

  async generateDashboard() {
    const metrics = await this.metricsCollector.collectAllMetrics();

    return {
      overview: {
        total_activations: metrics.activations.total,
        success_rate: metrics.activations.success_rate,
        average_response_time: metrics.performance.avg_response_time,
        user_satisfaction: metrics.satisfaction.average
      },

      agent_performance: {
        activation_frequency: metrics.agents.activation_frequency,
        task_completion_rate: metrics.agents.completion_rate,
        handoff_success_rate: metrics.collaboration.handoff_success,
        quality_scores: metrics.quality.by_agent
      },

      learning_progress: {
        prediction_accuracy: metrics.learning.accuracy,
        model_confidence: metrics.learning.confidence,
        adaptation_rate: metrics.learning.adaptation
      },

      alerts: await this.alertManager.getActiveAlerts(),

      recommendations: await this.generateOptimizationRecommendations(metrics)
    };
  }

  async generateOptimizationRecommendations(metrics) {
    const recommendations = [];

    // Activation accuracy recommendations
    if (metrics.activations.success_rate < 0.85) {
      recommendations.push({
        type: 'accuracy_improvement',
        priority: 'high',
        description: 'Consider adjusting confidence thresholds',
        affected_agents: this.identifyLowAccuracyAgents(metrics)
      });
    }

    // Performance recommendations
    if (metrics.performance.avg_response_time > 2000) {
      recommendations.push({
        type: 'performance_optimization',
        priority: 'medium',
        description: 'Optimize dispatcher response time',
        suggested_actions: ['Enable caching', 'Optimize pattern matching']
      });
    }

    return recommendations;
  }
}
```

---

*This Auto-Agent Dispatcher configuration enables intelligent, context-aware agent activation and collaboration within the VERSATIL SDLC Framework, ensuring optimal agent selection and seamless handoffs for maximum development efficiency.*

**Dispatcher Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained By**: VERSATIL Development Team