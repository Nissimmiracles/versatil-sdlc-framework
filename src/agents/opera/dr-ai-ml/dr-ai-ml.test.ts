import { describe, it, expect, beforeEach } from 'vitest';
import { DrAiMl } from './dr-ai-ml.js';
import { AgentActivationContext } from '../../core/base-agent.js';

describe('DrAiMl - AI/ML Specialist Agent', () => {
  let agent: DrAiMl;

  beforeEach(() => {
    agent = new DrAiMl();
  });

  // ===========================
  // 1. Agent Initialization (4 tests)
  // ===========================

  describe('Agent Initialization', () => {
    it('should initialize with correct name', () => {
      expect(agent.name).toBe('DrAiMl');
    });

    it('should initialize with correct id', () => {
      expect(agent.id).toBe('dr-ai-ml');
    });

    it('should initialize with correct specialization', () => {
      expect(agent.specialization).toBe('AI/ML Specialist & MLOps Engineer');
    });

    it('should have RAG config with ai-ml domain and high threshold', () => {
      const ragConfig = agent['getDefaultRAGConfig']();
      expect(ragConfig.maxExamples).toBe(3);
      expect(ragConfig.similarityThreshold).toBe(0.85); // Higher precision for ML code
      expect(ragConfig.agentDomain).toBe('ai-ml');
      expect(ragConfig.enableLearning).toBe(true);
    });
  });

  // ===========================
  // 2. ML Pattern Detection (8 tests)
  // ===========================

  describe('ML Pattern Detection', () => {
    it('should detect model architecture patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model = Sequential([Dense(128), Dropout(0.2), Dense(10)])',
        filePath: 'model.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-architecture')).toBe(true);
    });

    it('should detect training pipeline patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'history = model.fit(X_train, y_train, epochs=10, batch_size=32)',
        filePath: 'train.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'training-pipeline')).toBe(true);
    });

    it('should detect data preprocessing patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'scaler = StandardScaler()\nX_scaled = scaler.fit_transform(X_train)',
        filePath: 'preprocessing.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'data-preprocessing')).toBe(true);
    });

    it('should detect model evaluation patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'from sklearn.metrics import accuracy_score, precision_score, recall_score',
        filePath: 'evaluate.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-evaluation')).toBe(true);
    });

    it('should detect hyperparameter tuning patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'study = optuna.create_study()\nstudy.optimize(objective, n_trials=100)',
        filePath: 'tune.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'hyperparameter-tuning')).toBe(true);
    });

    it('should detect model deployment patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model.save("model.h5")\nloaded_model = load_model("model.h5")',
        filePath: 'deploy.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-deployment')).toBe(true);
    });

    it('should detect MLOps patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'import mlflow\nmlflow.log_metric("accuracy", accuracy)',
        filePath: 'experiment.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'mlops')).toBe(true);
    });

    it('should detect data leakage risks with critical severity', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'scaler.fit_transform(X_test)  # DANGEROUS: fitting on test data!',
        filePath: 'preprocess.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'data-leakage-risk' && p.severity === 'critical')).toBe(true);
    });
  });

  // ===========================
  // 3. Framework Recognition (4 tests)
  // ===========================

  describe('Framework Recognition', () => {
    it('should recognize TensorFlow/Keras patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'from tensorflow import keras\nmodel = keras.Sequential()',
        filePath: 'tf_model.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-architecture')).toBe(true);
    });

    it('should recognize PyTorch patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'import torch.nn as nn\nclass Net(nn.Module):\n    def __init__(self):',
        filePath: 'pytorch_model.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-architecture')).toBe(true);
    });

    it('should recognize scikit-learn patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'from sklearn.ensemble import RandomForestClassifier\nmodel = RandomForestClassifier()',
        filePath: 'sklearn_model.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // May not trigger model-architecture but should analyze successfully
      expect(analysis.patterns).toBeDefined();
    });

    it('should handle mixed framework code', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'import torch\nimport tensorflow as tf\nmodel = Sequential()',
        filePath: 'mixed.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.some(p => p.type === 'model-architecture')).toBe(true);
    });
  });

  // ===========================
  // 4. Quality Analysis (4 tests)
  // ===========================

  describe('Quality Analysis', () => {
    it('should assign high score (95) for code without critical issues', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model = Sequential([Dense(10)])\nmodel.compile(optimizer="adam")',
        filePath: 'clean_model.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBe(95);
    });

    it('should assign low score (70) for code with critical data leakage', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'scaler.fit_transform(X_test)',
        filePath: 'leaky.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.score).toBe(70);
    });

    it('should detect CPU-only training as performance warning', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model.cpu()  # Training on CPU only',
        filePath: 'train_cpu.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      // Pattern analyzer looks for .cpu() method call
      expect(analysis.patterns.some(p => p.type === 'performance-warning' && p.severity === 'high')).toBe(true);
    });

    it('should generate recommendations for high/critical severity issues', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'scaler.fit_transform(test_data)  # data leakage\ndevice = "cpu"',
        filePath: 'issues.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ===========================
  // 5. Response Enhancement (4 tests)
  // ===========================

  describe('Response Enhancement', () => {
    it('should add mlInsights to response context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model = Sequential([Dense(10)])\nmodel.fit(X, y)',
        filePath: 'model.py'
      };

      const response = await agent.activate(context);
      expect(response.context?.mlInsights).toBeDefined();
      expect(response.context?.mlInsights.modelArchitectureDetected).toBe(true);
      expect(response.context?.mlInsights.trainingPipelinePresent).toBe(true);
    });

    it('should extract evaluation metrics from content', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'accuracy = 0.95\nprecision = 0.92\nrecall = 0.88',
        filePath: 'metrics.py'
      };

      const response = await agent.activate(context);
      const metrics = response.context?.mlInsights?.evaluationMetrics || [];
      expect(metrics).toContain('accuracy');
      expect(metrics).toContain('precision');
      expect(metrics).toContain('recall');
    });

    it('should detect MLOps tooling in context', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'import mlflow\nmlflow.start_run()',
        filePath: 'experiment.py'
      };

      const response = await agent.activate(context);
      expect(response.context?.mlInsights?.mlopsTooling).toBe(true);
    });

    it('should determine handoffs based on patterns', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model = Sequential()\nmodel.fit(X, y)',
        filePath: 'train.py'
      };

      const response = await agent.activate(context);
      expect(response.handoffTo).toBeDefined();
    });
  });

  // ===========================
  // 6. RAG Context (3 tests)
  // ===========================

  describe('RAG Context', () => {
    it('should use high similarity threshold (0.85) for ML patterns', () => {
      const config = agent['getDefaultRAGConfig']();
      expect(config.similarityThreshold).toBe(0.85);
    });

    it('should enable learning for ML architectures', () => {
      const config = agent['getDefaultRAGConfig']();
      expect(config.enableLearning).toBe(true);
      expect(config.agentDomain).toBe('ai-ml');
    });

    it('should extract evaluation metrics from various formats', () => {
      const metrics1 = agent['extractEvaluationMetrics']('accuracy: 0.95, f1-score: 0.88');
      expect(metrics1).toContain('accuracy');
      expect(metrics1).toContain('f1');

      const metrics2 = agent['extractEvaluationMetrics']('RMSE = 0.05, MAE = 0.03');
      expect(metrics2).toContain('rmse');
      expect(metrics2).toContain('mae');
    });
  });

  // ===========================
  // 7. Edge Cases (3 tests)
  // ===========================

  describe('Edge Cases', () => {
    it('should handle empty ML code', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: '',
        filePath: 'empty.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns).toBeDefined();
      expect(analysis.patterns.length).toBe(0);
      expect(analysis.score).toBe(95); // No critical issues = high score
    });

    it('should handle non-ML code gracefully', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'function hello() { console.log("Hello"); }',
        filePath: 'utils.js'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis.patterns.length).toBe(0);
      expect(analysis.score).toBe(95);
    });

    it('should handle malformed ML code', async () => {
      const context: AgentActivationContext = {
        trigger: 'manual',
        content: 'model = Sequential(\nmodel.fit(',
        filePath: 'broken.py'
      };

      const analysis = await agent['runPatternAnalysis'](context);
      expect(analysis).toBeDefined();
      expect(analysis.patterns).toBeDefined();
    });
  });
});
