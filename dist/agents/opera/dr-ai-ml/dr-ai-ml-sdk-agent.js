/**
 * Dr.AI-ML SDK Agent
 * SDK-native version of Dr.AI-ML that uses Claude Agent SDK for execution
 * while preserving all existing AI/ML functionality
 */
import { SDKAgentAdapter } from '../../sdk/sdk-agent-adapter.js';
import { DrAiMl } from './dr-ai-ml.js';
export class DrAIMLSDKAgent extends SDKAgentAdapter {
    constructor(vectorStore) {
        super({
            agentId: 'dr-ai-ml',
            vectorStore,
            model: 'sonnet'
        });
        // Keep legacy agent for specialized methods
        this.legacyAgent = new DrAiMl(vectorStore);
    }
    /**
     * Override activate to add Dr.AI-ML-specific enhancements
     */
    async activate(context) {
        // 1. Run SDK activation (core analysis)
        const response = await super.activate(context);
        // 2. Add ML-specific insights to context
        if (response.context) {
            response.context = {
                ...response.context,
                mlInsights: {
                    modelArchitectureDetected: this.detectModelArchitecture(context.content || ''),
                    trainingPipelinePresent: this.detectTrainingPipeline(context.content || ''),
                    dataPreprocessingPresent: this.detectDataPreprocessing(context.content || ''),
                    evaluationMetricsPresent: this.detectEvaluationMetrics(context.content || ''),
                    deploymentPatterns: this.detectDeploymentPatterns(context.content || '')
                },
                modelType: this.detectModelType(context.content || ''),
                framework: this.detectMLFramework(context.content || ''),
                mlopsMaturity: this.assessMLOpsMaturity(context.content || '')
            };
        }
        // 3. Add ML-specific suggestions
        const mlSuggestions = this.generateMLSuggestions(context);
        if (mlSuggestions.length > 0) {
            response.suggestions = [...(response.suggestions || []), ...mlSuggestions];
        }
        // 4. Determine handoffs for ML coordination
        const handoffs = this.determineMLHandoffs(context, response);
        if (handoffs.length > 0) {
            response.handoffTo = [...(response.handoffTo || []), ...handoffs];
        }
        return response;
    }
    /**
     * Detect model architecture
     */
    detectModelArchitecture(content) {
        return content.match(/model\s*=|Sequential\(|Model\(|nn\.Module|keras\.layers/i) !== null;
    }
    /**
     * Detect training pipeline
     */
    detectTrainingPipeline(content) {
        return content.match(/model\.fit|trainer\.train|optimizer|loss_fn|train_loop/i) !== null;
    }
    /**
     * Detect data preprocessing
     */
    detectDataPreprocessing(content) {
        return content.match(/transform|normalize|augment|preprocessing|feature_engineering/i) !== null;
    }
    /**
     * Detect evaluation metrics
     */
    detectEvaluationMetrics(content) {
        return content.match(/evaluate|metrics|accuracy|precision|recall|f1_score|confusion_matrix/i) !== null;
    }
    /**
     * Detect deployment patterns
     */
    detectDeploymentPatterns(content) {
        return content.match(/save_model|load_model|inference|predict|deploy|mlflow|serving/i) !== null;
    }
    /**
     * Detect model type
     */
    detectModelType(content) {
        if (content.match(/cnn|conv2d|convolution/i))
            return 'cnn';
        if (content.match(/rnn|lstm|gru/i))
            return 'rnn';
        if (content.match(/transformer|attention|bert|gpt/i))
            return 'transformer';
        if (content.match(/random.?forest|decision.?tree|xgboost|lightgbm/i))
            return 'tree-based';
        if (content.match(/svm|support.?vector/i))
            return 'svm';
        if (content.match(/linear.?regression|logistic.?regression/i))
            return 'regression';
        if (content.match(/k.?means|dbscan|clustering/i))
            return 'clustering';
        return 'unknown';
    }
    /**
     * Detect ML framework
     */
    detectMLFramework(content) {
        if (content.match(/torch|pytorch/i))
            return 'pytorch';
        if (content.match(/tensorflow|tf\./i))
            return 'tensorflow';
        if (content.match(/keras/i))
            return 'keras';
        if (content.match(/scikit.?learn|sklearn/i))
            return 'scikit-learn';
        if (content.match(/jax|flax/i))
            return 'jax';
        if (content.match(/mxnet/i))
            return 'mxnet';
        return 'unknown';
    }
    /**
     * Assess MLOps maturity level
     */
    assessMLOpsMaturity(content) {
        let score = 0;
        const features = [];
        if (content.match(/mlflow|wandb|tensorboard/i)) {
            score += 20;
            features.push('experiment-tracking');
        }
        if (content.match(/docker|kubernetes|container/i)) {
            score += 20;
            features.push('containerization');
        }
        if (content.match(/ci\/cd|pipeline|github.actions|jenkins/i)) {
            score += 20;
            features.push('ci-cd');
        }
        if (content.match(/monitoring|prometheus|grafana|alerting/i)) {
            score += 20;
            features.push('monitoring');
        }
        if (content.match(/model.?versioning|dvc|git.?lfs/i)) {
            score += 20;
            features.push('version-control');
        }
        const level = score >= 80 ? 'advanced'
            : score >= 60 ? 'intermediate'
                : score >= 40 ? 'basic'
                    : 'initial';
        return { level, score };
    }
    /**
     * Generate ML-specific suggestions
     */
    generateMLSuggestions(context) {
        const suggestions = [];
        const content = context.content || '';
        // Model architecture suggestions
        if (content.match(/model\s*=/i) && !content.match(/summary|print/i)) {
            suggestions.push({
                type: 'model-documentation',
                message: 'Add model.summary() or architecture documentation for clarity',
                priority: 'medium',
                file: context.filePath || 'model'
            });
        }
        // Training suggestions
        if (content.match(/model\.fit|train/i) && !content.match(/validation|val_/i)) {
            suggestions.push({
                type: 'validation-set',
                message: 'Add validation set for monitoring overfitting during training',
                priority: 'high',
                file: context.filePath || 'training'
            });
        }
        // Evaluation suggestions
        if (content.match(/evaluate|metrics/i) && !content.match(/confusion_matrix|classification_report/i)) {
            suggestions.push({
                type: 'evaluation-metrics',
                message: 'Add comprehensive evaluation metrics (confusion matrix, precision, recall, F1)',
                priority: 'high',
                file: context.filePath || 'evaluation'
            });
        }
        // Hyperparameter tuning suggestions
        if (content.match(/learning_rate|lr\s*=/i) && !content.match(/scheduler|decay/i)) {
            suggestions.push({
                type: 'learning-rate-schedule',
                message: 'Consider using learning rate scheduler for better convergence',
                priority: 'medium',
                file: context.filePath || 'training'
            });
        }
        // Deployment suggestions
        if (content.match(/save_model|\.save\(/i) && !content.match(/version|timestamp/i)) {
            suggestions.push({
                type: 'model-versioning',
                message: 'Add version tracking and metadata to saved models for MLOps',
                priority: 'high',
                file: context.filePath || 'deployment'
            });
        }
        // Data preprocessing suggestions
        if (content.match(/normalize|standardize/i) && !content.match(/fit_transform|scaler/i)) {
            suggestions.push({
                type: 'data-preprocessing',
                message: 'Use fit_transform on training data and transform on test data to prevent data leakage',
                priority: 'critical',
                file: context.filePath || 'preprocessing'
            });
        }
        // MLOps suggestions
        if (content.match(/model|train/i) && !content.match(/mlflow|wandb|experiment/i)) {
            suggestions.push({
                type: 'experiment-tracking',
                message: 'Add experiment tracking (MLflow, Weights & Biases) for reproducibility',
                priority: 'medium',
                file: context.filePath || 'mlops'
            });
        }
        return suggestions;
    }
    /**
     * Determine ML-specific handoffs
     */
    determineMLHandoffs(context, response) {
        const handoffs = [];
        const content = context.content || '';
        // Hand off to Marcus for API deployment
        if (content.match(/api|endpoint|serving|inference/i)) {
            handoffs.push('marcus-backend');
        }
        // Hand off to Maria-QA for model testing
        if (content.match(/test|evaluate|validation/i)) {
            handoffs.push('maria-qa');
        }
        // Hand off to Sarah-PM for ML project planning
        if (content.match(/milestone|sprint|project|timeline/i)) {
            handoffs.push('sarah-pm');
        }
        return handoffs;
    }
    /**
     * Validate model architecture
     */
    validateModelArchitecture(model) {
        const issues = [];
        if (!model || typeof model !== 'object') {
            issues.push('Model object is invalid or missing');
            return { valid: false, issues };
        }
        // Check for basic model properties
        if (!model.layers && !model.modules) {
            issues.push('Model missing layers or modules definition');
        }
        if (!model.compile && !model.optimizer) {
            issues.push('Model missing compilation or optimizer configuration');
        }
        return {
            valid: issues.length === 0,
            issues
        };
    }
    /**
     * Analyze training metrics
     */
    analyzeTrainingMetrics(metrics) {
        return {
            epochs: metrics.epochs || 0,
            finalLoss: metrics.finalLoss || 0,
            finalAccuracy: metrics.finalAccuracy || 0,
            validationLoss: metrics.validationLoss || 0,
            validationAccuracy: metrics.validationAccuracy || 0,
            overfitting: (metrics.finalLoss < metrics.validationLoss) &&
                ((metrics.validationLoss - metrics.finalLoss) / metrics.finalLoss) > 0.1,
            trainingStability: metrics.lossHistory ? this.assessTrainingStability(metrics.lossHistory) : 'unknown',
            recommendations: this.generateTrainingRecommendations(metrics)
        };
    }
    /**
     * Assess training stability
     */
    assessTrainingStability(lossHistory) {
        if (lossHistory.length < 3)
            return 'insufficient-data';
        const recentLosses = lossHistory.slice(-5);
        const variance = this.calculateVariance(recentLosses);
        if (variance < 0.01)
            return 'stable';
        if (variance < 0.1)
            return 'moderate';
        return 'unstable';
    }
    /**
     * Calculate variance
     */
    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    }
    /**
     * Generate training recommendations
     */
    generateTrainingRecommendations(metrics) {
        const recommendations = [];
        if (metrics.finalAccuracy < 0.7) {
            recommendations.push('Consider increasing model complexity or training duration');
        }
        if (metrics.overfitting) {
            recommendations.push('Model is overfitting - add regularization or increase training data');
        }
        if (metrics.validationAccuracy > metrics.finalAccuracy) {
            recommendations.push('Training may be underfitting - consider training longer or using a more complex model');
        }
        return recommendations;
    }
    /**
     * Generate deployment recommendations
     */
    generateDeploymentRecommendations(deployment) {
        return {
            framework: deployment.framework || 'unknown',
            servingPlatform: deployment.platform || 'unspecified',
            scalability: deployment.autoscaling ? 'enabled' : 'disabled',
            monitoring: deployment.monitoring ? 'enabled' : 'disabled',
            recommendations: [
                'Implement model versioning for rollback capability',
                'Set up A/B testing for model comparison',
                'Monitor inference latency and throughput',
                'Implement automatic retraining pipeline',
                'Add model performance degradation alerts'
            ]
        };
    }
    /**
     * Assess model performance
     */
    assessModelPerformance(performance) {
        return {
            accuracy: performance.accuracy || 0,
            precision: performance.precision || 0,
            recall: performance.recall || 0,
            f1Score: performance.f1Score || 0,
            inferenceTime: performance.inferenceTime || 0,
            modelSize: performance.modelSize || 0,
            performanceGrade: this.calculatePerformanceGrade(performance),
            recommendations: this.generatePerformanceRecommendations(performance)
        };
    }
    /**
     * Calculate performance grade
     */
    calculatePerformanceGrade(performance) {
        const score = (performance.accuracy || 0) * 0.4 +
            (performance.precision || 0) * 0.2 +
            (performance.recall || 0) * 0.2 +
            (performance.f1Score || 0) * 0.2;
        if (score >= 0.9)
            return 'A';
        if (score >= 0.8)
            return 'B';
        if (score >= 0.7)
            return 'C';
        if (score >= 0.6)
            return 'D';
        return 'F';
    }
    /**
     * Generate performance recommendations
     */
    generatePerformanceRecommendations(performance) {
        const recommendations = [];
        if (performance.accuracy < 0.8) {
            recommendations.push('Improve model accuracy through architecture optimization or data augmentation');
        }
        if (performance.inferenceTime > 100) {
            recommendations.push('Optimize inference time through model quantization or pruning');
        }
        if (performance.modelSize > 100) {
            recommendations.push('Consider model compression to reduce deployment footprint');
        }
        return recommendations;
    }
}
//# sourceMappingURL=dr-ai-ml-sdk-agent.js.map